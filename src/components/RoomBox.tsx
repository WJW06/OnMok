import React from "react";
import "../styles/RoomBox.css";

export interface Room {
  r_id: string;
  r_name: string;
  r_players: number;
  r_maxPlayers: number;
  r_turnTime: string;
  r_isLocked: boolean;
  r_password?: string;
}

interface RoomBoxProps extends Room {
  onClick: () => void;
}

const RoomBox: React.FC<RoomBoxProps> = ({
  r_name,
  r_players,
  r_maxPlayers,
  r_turnTime,
  r_isLocked,
  onClick,
}) => {
  return (
    <div className="room-box" onClick={onClick}>
      <div className="room-info">
        <div className="avatar" />
        <div className="room-text">
          <p className="room-name">{r_name}</p>
          <p className="room-setting">{r_turnTime}</p>
        </div>
      </div>
      <div className="room-status">
        <span>{r_players}/{r_maxPlayers}</span>
        {r_isLocked && <span className="lock-icon">🔒</span>}
      </div>
    </div>
  );
};

export default RoomBox;