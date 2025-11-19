import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "../pages/Room"

import "../styles/ChatBox.css";

interface ChatBoxProps {
    messages: ChatMessage[];
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    sendMessage: () => void;
}

const ChatBox = ({ messages, input, setInput, sendMessage }: ChatBoxProps) => {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setTimeout(() => {
            console.log("Smoooooooth");
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
    }, [messages]);

  return (
    <AnimatePresence>
      <motion.div
        key="chat-box"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="chat-box"
      >
        <div className="messages">
          {messages.map((message, idx) => (
            <div key={idx} className="chat-line">
              {message.c_isEvent ? (
                <div>
                  (<strong>{message.c_sender}</strong> {message.c_text} the room.)
                </div>
              ) : (
                <div>
                  <strong>{message.c_sender}</strong>: {message.c_text}
                </div>
              )}
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
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="(Input message.)"
          />
          <button className="send-btn" onClick={sendMessage}>➤</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ChatBox;