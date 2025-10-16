import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "../styles/Room.css";

const token = localStorage.getItem("token");
export const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  withCredentials: true,
  auth: { token },
});

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
  r_turnTime: string;
  r_undo: boolean;
}

const Room: React.FC = () => {
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState<{ room: RoomInfo }>();

  useEffect(() => {
    if (!roomData) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Wrong token!");
      console.log("Wrong token!");
      navigate("/home");
      return;
    }

    socket.emit("joinRoom", { r_id: roomData?.room.r_id });

    socket.on("roomUpdate", ({ room }) => {
      console.log("Reload room state:", room);
      setRoomData({ room });
    });

    socket.on("roomError", (msg) => {
      console.error("Room error:", msg);
      alert(msg.message);
    });

    return () => {
      socket.emit("leaveRoom", { r_id: roomData?.room.r_id });
      fetch("http://localhost:5000/LeaveRoom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ r_id: roomData?.room.r_id }),
      });
    };
  }, [roomData]);

  const handleExit = () => {
    navigate("/Home");
  };

  return (
    <div className="room-container">
      <div className="room-header">
        <h1 className="room-name">{roomData?.room.r_name}</h1>
        <button className="close-btn" onClick={handleExit}>✖</button>
      </div>

      <div className="players">
        <div className="player">
          <h2>{roomData?.room.r_player1}</h2>
          <p className="record">{10} win {2} lose {1} draw</p>
          <div className="buttons">
            <button className="btn leave">leave</button>
            <button className="btn join">join</button>
            <button className="btn ready">Ready</button>
          </div>
        </div>

        <h2 className="vs">VS</h2>

        <div className="player">
          <h2>{roomData?.room.r_player2}</h2>
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