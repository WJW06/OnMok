import React from "react";
import { UserInfo } from "../pages/Home";
import "../styles/PlayerRank.css";

interface PlayerRankProps extends UserInfo {
    onClick: () => void;
}

const PlayerRank: React.FC<PlayerRankProps> = ({
    u_name,
    u_win,
    u_lose,
    u_draw,
    u_level,
    u_ranking,
    onClick,
}) => {
    return (
        <div className="player-container">
            <div className="player-rank">#{u_ranking}</div>
            <div className="player-box">
                <p className="player-name">
                    <strong>{u_name}</strong> (Lv. {u_level})
                </p>
                <p className="player-record">
                    {u_win} win {u_lose} lose {u_draw} draw
                </p>
            </div>
        </div>
    );
};

export default PlayerRank;
