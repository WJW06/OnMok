import React, { useState } from "react";
import "../styles/PasswordModal.css";

interface PasswordModalProps {
  onClose: () => void;
  onSubmit: (password: string) => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onClose, onSubmit }) => {
  const [password, setPassword] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(password);
    setPassword("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Enter Room Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Enter</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
