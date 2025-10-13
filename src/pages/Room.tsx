import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const Room: React.FC = () => {
  const { r_id } = useParams();
  const [searchParams] = useSearchParams();
  const user = searchParams.get("user");

  useEffect(() => {
    socket.emit("joinRoom", { r_id, user });

    socket.on("roomUpdate", (data) => {
      console.log("Reload room state:", data);
    });

    return () => {
      socket.emit("leaveRoom", { r_id, user });
    };
  }, [r_id, user]);

  return (
    <div>
      <h2>Room ID: {r_id}</h2>
      <p>user1: {user}</p>
    </div>
  );
}


export default Room;