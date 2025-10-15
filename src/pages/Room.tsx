import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "../styles/Room.css";

export const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  withCredentials: true,
});

const Room: React.FC = () => {
  const navigate = useNavigate();
  const { r_id } = useParams();
  const [roomData, setRoomData] = useState<{ u_name: string; r_name: string }>();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !r_id) return;

    socket.emit("joinRoom", { r_id, token });

    socket.on("roomUpdate", (data) => {
      console.log("Reload room state:", data);
      setRoomData(data);
    });

    return () => {
      socket.emit("leaveRoom", { r_id, token });
    };
  }, [r_id]);

  const handleExit = () => {
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
          <h2>Player1</h2>
          <p className="record">{10} win {2} lose {1} draw</p>
          <div className="buttons">
            <button className="btn leave">leave</button>
            <button className="btn join">join</button>
            <button className="btn ready">Ready</button>
          </div>
        </div>

        <h2 className="vs">VS</h2>

        <div className="player">
          <h2>Player2</h2>
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