import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReloadToken, socket } from "../socket";
import { UserInfo } from "../pages/Home";
import { motion, AnimatePresence } from "framer-motion";
import Board from '../components/Board';

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

export interface ChatMessage {
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [roomState, setRoomState] = useState<string>("VS");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!token || !token.includes(".")) {
      alert("Wrong token!");
      console.log("Wrong token!");
      navigate("/home");
      return;
    }

    socket.auth = { token: token };
    if (!socket.connected) {
      console.log("Reconnect socket from Room");
      socket.connect();
    }

    socket.on("playerUpdate", ({ player, p_num, is_join, is_ready }) => {
      console.log("Reload player state:", player);

      if (p_num === 1) {
        setPlayer1(player);
        setPlayer1State({ joined: is_join, ready: is_ready });
      } else {
        setPlayer2(player);
        setPlayer2State({ joined: is_join, ready: is_ready });
      }
    })

    socket.on("playerError", (msg) => {
      console.error("Player error:", msg);
    });

    socket.on("roomUpdate", ({ room, p1, p2, p1_ready, p2_ready }) => {
      console.log("Reload room state:", room);
      setRoomData(room);
      setPlayer1(p1);
      setPlayer2(p2);
      setPlayer1State({ joined: p1 != null, ready: p1_ready });
      setPlayer2State({ joined: p2 != null, ready: p2_ready });

      console.log("r_id!:", room.r_id);
    });

    socket.on("roomError", (msg) => {
      alert(msg.message);
      console.error("Room error:", msg);
    });

    socket.on("loadChat", (history: ChatMessage[]) => {
      setMessages(history);
      console.log("loadChat:", history);
    });

    socket.on("newMessage", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      console.log("newMessage:", message);
      console.log("Currnet messages:",messages);
    });

    socket.on("countdown", ({ seconds }) => {
      setRoomState(seconds);
    });

    socket.on("cancleCountdown", () => {
      console.log("Countdown canceled.");
      setRoomState("VS");
    })

    socket.on("started", () => {
      setRoomState("VS");
      setStarted(true);
      const r_id = sessionStorage.getItem("currentRoom");
      socket.emit("successStart", {r_id: r_id});
    });

    socket.on("ended", () => {
      setStarted(false);
    });

    return () => {
      const r_id = sessionStorage.getItem("currentRoom");
      OutGame(r_id);
      socket.emit("leaveRoom", { r_id });
      socket.off("ended");
      socket.off("started");
      socket.off("cancleCountdown");
      socket.off("countdown");
      socket.off("loadChat");
      socket.off("newMessage");
      socket.off("playerError");
      socket.off("playerUpdate");
      socket.off("roomError");
      socket.off("roomUpdate");
      sessionStorage.removeItem("currentRoom");
      console.log("Room effect return");
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      console.log("Smoooooooth");
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleExit = async () => {
    try {
      const res = await fetch("http://localhost:5000/LeaveRoom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  const handlePlayerReady = (pNum: number, isReady: boolean) => {
    socket.emit("playerReady", { r_id: roomData?.r_id, p_num: pNum, is_ready: isReady });
  }

  function SendMessage() {
    if (input.trim() === "") return;

    socket.emit("sendMessage", { r_id: roomData?.r_id, message: input });
    console.log("sended message is", input);
    setInput("");
  };

  function OutGame(r_id: string | null) {
    if (r_id) {
      const url = "http://localhost:5000/OutGame";
      const body = JSON.stringify({ r_id: r_id, token: localStorage.getItem('token') });
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    }
  }

  return (
    <AnimatePresence>
      {!started && (
        <motion.div
          key="room"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}>{
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
                      disabled={!player1State.joined || player1State.ready}>
                      leave
                    </button>
                    <button
                      id="p1-join" className="btn join"
                      onClick={() => handlePlayerJoin(1)}
                      disabled={player1State.joined}>
                      join
                    </button>
                    <button
                      id="p1-ready"
                      className={`btn ready ${player1State.ready ? "active" : ""}`}
                      onClick={() => handlePlayerReady(1, !player1State.ready)}
                      disabled={!player1State.joined}>
                      Ready
                    </button>
                  </div>
                </div>

                <h2 className={`room-state ${roomState !== "VS" ? "counting" : ""}`}>
                  {roomState}
                </h2>

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
                      disabled={!player2State.joined || player2State.ready}>
                      leave
                    </button>
                    <button
                      id="p2-join" className="btn join"
                      onClick={() => handlePlayerJoin(2)}
                      disabled={player2State.joined}>
                      join
                    </button>
                    <button
                      id="p2-ready"
                      className={`btn ready ${player2State.ready ? "active" : ""}`}
                      onClick={() => handlePlayerReady(2, !player2State.ready)}
                      disabled={!player2State.joined}>
                      Ready
                    </button>
                  </div>
                </div>
              </div>

              <div className= "chat-box">
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
                  <div ref={messagesEndRef}></div>
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
            </div>}
        </motion.div>
      )}

      {started && (
        <motion.div
          key="board"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}>{
            <>
              <Board />
              
              <div className= "chat-box">
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
                  <div ref={messagesEndRef}></div>
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
            </>
          }
        </motion.div>
      )}
    </AnimatePresence>
  );
}


export default Room;