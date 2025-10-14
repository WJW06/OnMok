import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const Room: React.FC = () => {
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

  return (
    <div>
      <h1>Room name: {roomData?.r_name}</h1>
      <h2>User: {roomData?.u_name}</h2>
    </div>
  );
}


export default Room;