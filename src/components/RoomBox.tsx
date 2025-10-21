import React from "react";
import { RoomInfo } from "../pages/Room";
import "../styles/RoomBox.css";


interface RoomBoxProps extends RoomInfo {
  onClick: () => void;
}

const RoomBox: React.FC<RoomBoxProps> = ({
  r_id,
  r_name,
  r_password,
  r_isLocked,
  r_players,
  r_maxPlayers,
  r_roomMaster,
  r_turnTime,
  r_isUndo,
  onClick,
}) => {
  return (
    <div className="room-box" onClick={onClick}>
      <div className="room-info">
        <div className="avatar" />
        <div className="room-text">
          <p className="room-name">{r_name}</p>
          <p className="room-setting">{r_turnTime < 60 ? <span>{r_turnTime} sec</span>
            : <span>{r_turnTime / 60} min</span>} {r_isUndo && <span>& Can undo</span>}</p>
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