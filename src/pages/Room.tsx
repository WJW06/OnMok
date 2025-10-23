import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReloadToken, socket } from "../socket";
import { UserInfo } from "../pages/Home";
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
  const [player1, setPlayer1] = useState<UserInfo | null>(null);
  const [player1State, setPlayer1State] = useState({ joined: false, ready: false });
  const [player2, setPlayer2] = useState<UserInfo | null>(null);
  const [player2State, setPlayer2State] = useState({ joined: false, ready: false });
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

    socket.on("playerUpdate", ({ player, p_num, is_join }) => {
      console.log("Reload player state:", player);

      if (p_num === 1) {
        setPlayer1(player);
        if (is_join) {
          setPlayer1State({ ...player1State, joined: true });
        } else {
          setPlayer1State({ ...player1State, joined: false });
        }
      } else {
        setPlayer2(player);
        if (is_join) {
          setPlayer2State({ ...player1State, joined: true });
        } else {
          setPlayer2State({ ...player1State, joined: false });
        }
      }
    })

    socket.on("playerError", (msg) => {
      console.error("Player error:", msg);
    });

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
      socket.off("playerUpdate");
      socket.off("playerError");
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

  const handlePlayerJoin = (pNum: number) => {
    socket.emit("playerJoin", { r_id: roomData?.r_id, p_num: pNum });
  }

  const handlePlayerLeave = (pNum: number) => {
    socket.emit("playerLeave", { r_id: roomData?.r_id, p_num: pNum });
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
          <h2>{player1?.u_name}</h2>
          <p className="record">
            {player1?.u_win} win <> </>
            {player1?.u_lose} lose <> </>
            {player1?.u_draw} draw
          </p>
          <div className="buttons">
            <button
              id="p1-leave" className="btn leave"
              onClick={() => handlePlayerLeave(1)}
              disabled={!player1State.joined}>
              leave
            </button>
            <button
              id="p1-join" className="btn join"
              onClick={() => handlePlayerJoin(1)}
              disabled={player1State.joined}>
              join
            </button>
            <button
              id="p1-ready" className="btn ready"
              onClick={() => { }}
              disabled={!player1State.joined}>
              Ready
            </button>
          </div>
        </div>

        <h2 className="vs">VS</h2>

        <div className="player">
          <h2>{player2?.u_name}</h2>
          <p className="record">
            {player2?.u_win} win <> </>
            {player2?.u_lose} lose <> </>
            {player2?.u_draw} draw
          </p>
          <div className="buttons">
            <button
              id="p2-leave" className="btn leave"
              onClick={() => handlePlayerLeave(2)}
              disabled={!player2State.joined}>
              leave
            </button>
            <button
              id="p2-join" className="btn join"
              onClick={() => handlePlayerJoin(2)}
              disabled={player2State.joined}>
              join
            </button>
            <button
              id="p2-ready" className="btn ready"
              onClick={() => { }}
              disabled={!player2State.joined}>
              Ready
            </button>
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