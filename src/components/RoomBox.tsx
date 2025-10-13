import React from "react";
import "../styles/RoomBox.css";

export interface Room {
  name: string;
  players: number;
  maxPlayers: number;
  setting: string;
  isLocked: boolean;
  password?: string;
}

interface RoomBoxProps extends Room {
  onClick: () => void;
}

const RoomBox: React.FC<RoomBoxProps> = ({
  name,
  players,
  maxPlayers,
  setting,
  isLocked,
  onClick,
}) => {
  return (
    <div className="room-box" onClick={onClick}>
      <div className="room-info">
        <div className="avatar" />
        <div className="room-text">
          <p className="room-name">{name}</p>
          <p className="room-setting">{setting}</p>
        </div>
      </div>
      <div className="room-status">
        <span>{players}/{maxPlayers}</span>
        {isLocked && <span className="lock-icon">🔒</span>}
      </div>
    </div>
  );
};

export default RoomBox;