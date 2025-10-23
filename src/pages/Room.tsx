import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReloadToken, socket } from "../socket";
import "../styles/Room.css";

export interface RoomInfo {
  r_id: string;
  r_name: string;
  r_password: string;
  r_isLocked: boolean;
  r_players: number;
  r_maxPlayers: number;
  r_roomMaster: string;
  r_turnTime: number;
  r_isUndo: boolean;
}

interface ChatMessage {
  c_sender: string;
  c_text: string;
  c_created: string;
}

const Room: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [roomData, setRoomData] = useState<RoomInfo | null>(null);
  const [player1, setPlayer1] = useState<string>("");
  const [player2, setPlayer2] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!token) {
      alert("Wrong token!");
      console.log("Wrong token!");
      navigate("/home");
      return;
    }

    if (!socket.connected) {
      console.log("Reconnect socket from Room.tsx");
      socket.connect();
    }
    socket.emit("joinRoom");

    socket.on("roomUpdate", ({ room }) => {
      console.log("Reload room state:", room);
      setRoomData(room);
    });

    socket.on("roomError", (msg) => {
      console.error("Room error:", msg);
      alert(msg.message);
    });

    socket.on("loadChat", (history: ChatMessage[]) => {
      console.log("loadChat:", history);
      setMessages(history);
    });

    socket.on("newMessage", (message: ChatMessage) => {
      console.log("newMessage:", message);
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      console.log("Room effect return");
      socket.off("roomUpdate");
      socket.off("roomError");
      socket.off("loadChat");
      socket.off("newMessage");
      socket.emit("leaveRoom");
    };
  }, []);

  const handleExit = async () => {
    try {
      const res = await fetch("http://localhost:5000/LeaveRoom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ r_id: roomData?.r_id }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        ReloadToken(data.token);
      } else {
        alert(data.message || "Join room failed");
      }

    } catch (err) {
      console.error("LeaveRoom error:", err);
    }
    navigate("/Home");
  };

  const handlePlayerJoin = async (pNum: number) => {
    try {
      const res = await fetch("http://localhost:5000/PlayerJoin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ r_id: roomData?.r_id, p_num: pNum }),
      });

      const data = await res.json();
      if (data.success) {
        if (pNum === 1) setPlayer1(data.user);
        else setPlayer2(data.user);

        console.log(data.message);
      } else {
        console.error(data.message);
      }

    } catch (err) {
      console.error("Player1 join error:", err);
    }
  }

  const handlePlayerLeave = async (pNum: number) => {
    try {
      const res = await fetch("http://localhost:5000/PlayerLeave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ r_id: roomData?.r_id, p_num: pNum }),
      });

      const data = await res.json();
      if (data.success) {
        if (pNum === 1) setPlayer1("");
        else setPlayer2("");

        console.log(data.message);
      } else {
        console.error(data.message);
      }

    } catch (err) {
      console.error("Player1 leave error:", err);
    }
  }

  function SendMessage() {
    if (input.trim() === "") return;

    socket.emit("sendMessage", { r_id: roomData?.r_id, message: input });
    console.log("sended message is", input);
    setInput("");
  };

  return (
    <div className="room-container">
      <div className="room-header">
        <h1 className="room-name">{roomData?.r_name}</h1>
        <button className="close-btn" onClick={handleExit}>✖</button>
      </div>

      <div className="players">
        <div className="player">
          <h2>{player1}</h2>
          <p className="record">{10} win {2} lose {1} draw</p>
          <div className="buttons">
            <button className="btn leave" onClick={() => handlePlayerLeave(1)}>leave</button>
            <button className="btn join" onClick={() => handlePlayerJoin(1)}>join</button>
            <button className="btn ready">Ready</button>
          </div>
        </div>

        <h2 className="vs">VS</h2>

        <div className="player">
          <h2>{player2}</h2>
          <p className="record">{3} win {1} lose {0} draw</p>
          <div className="buttons">
            <button className="btn ready">Ready</button>
            <button className="btn join" onClick={() => handlePlayerJoin(2)}>join</button>
            <button className="btn leave" onClick={() => handlePlayerLeave(2)}>leave</button>
          </div>
        </div>
      </div>

      <div className="chat-box">
        <div className="messages">
          {messages.map((message, idx) => (
            <div key={idx} className="chat-line">
              <div>
                <strong>{message.c_sender}</strong>: {message.c_text}
              </div>
              <span className="chat-time">
                {new Date(message.c_created).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>

        <div className="input-area">
          <input
            value={input}
            type="text"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && SendMessage()}
            placeholder="(Input message.)"
          />
          <button className="send-btn" onClick={SendMessage}>➤</button>
        </div>
      </div>
    </div>
  );
}


export default Room;