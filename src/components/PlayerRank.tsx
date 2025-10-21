import React from "react";
import "../styles/PlayerRank.css";

export interface PlayerRankInfo {
    rank: number;
    name: string;
    win: number;
    lose: number;
    draw: number;
    level: number;
}

interface PlayerRankProps extends PlayerRankInfo {
    onClick: () => void;
}

const PlayerRank: React.FC<PlayerRankProps> = ({
    rank,
    name,
    win,
    lose,
    draw,
    level,
    onClick,
}) => {
    return (
        <div className="player-container">
            <div className="player-rank">#{rank}</div>
            <div className="player-box">
                <p className="player-name">
                    <strong>{name}</strong> (Lv. {level})
                </p>
                <p className="player-record">
                    {win} win {lose} lose {draw} draw
                </p>
            </div>
        </div>
    );
};

export default PlayerRank;
