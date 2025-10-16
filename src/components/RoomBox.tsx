import React from "react";
import { RoomInfo } from "../pages/Room";
import "../styles/RoomBox.css";


interface RoomBoxProps extends RoomInfo {
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