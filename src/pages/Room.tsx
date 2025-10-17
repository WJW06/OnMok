import { useEffect, useState } from "react";
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
  r_player1: string;
  r_player2: string;
  r_turnTime: number;
  r_isUndo: boolean;
}

const Room: React.FC = () => {
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState<RoomInfo | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      alert("Wrong token!");
      console.log("Wrong token!");
      navigate("/home");
      return;
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

    return () => {
      socket.off("roomUpdate");
      socket.off("roomError");
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

  return (
    <div className="room-container">
      <div className="room-header">
        <h1 className="room-name">{roomData?.r_name}</h1>
        <button className="close-btn" onClick={handleExit}>✖</button>
      </div>

      <div className="players">
        <div className="player">
          <h2>{roomData?.r_player1}</h2>
          <p className="record">{10} win {2} lose {1} draw</p>
          <div className="buttons">
            <button className="btn leave">leave</button>
            <button className="btn join">join</button>
            <button className="btn ready">Ready</button>
          </div>
        </div>

        <h2 className="vs">VS</h2>

        <div className="player">
          <h2>{roomData?.r_player2}</h2>
          <p className="record">{3} win {1} lose {0} draw</p>
          <div className="buttons">
            <button className="btn ready">Ready</button>
            <button className="btn join">join</button>
            <button className="btn leave">leave</button>
          </div>
        </div>
      </div>

      <div className="chat-box">
        <div className="messages">
          <p><strong>P1:</strong> Hi!</p>
          <p><strong>P2:</strong> Hello~</p>
        </div>
        <div className="input-area">
          <input type="text" placeholder="(Input message.)" />
          <button className="send-btn">➤</button>
        </div>
      </div>
    </div>
  );
}


export default Room;