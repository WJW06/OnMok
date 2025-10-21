import React from "react";
import { useNavigate } from "react-router-dom";
import PlayerRank, { PlayerRankInfo } from "../components/PlayerRank";
import "../styles/Ranking.css";

const Ranking: React.FC = () => {
    const navigate = useNavigate();

    const players: PlayerRankInfo[] = [
        { rank: 1, name: "p1", win: 100, lose: 10, draw: 2, level: 100 },
        { rank: 2, name: "p2", win: 50, lose: 7, draw: 30, level: 53 },
        { rank: 3, name: "player3", win: 10, lose: 100, draw: 2, level: 77 },
    ];

    return (
        <div className="ranking-page">
            <div className="ranking-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    Back
                </button>
                <h1 className="ranking-title">Ranking</h1>
            </div>

            <div className="ranking-list">
                {players.map((player) => (
                    <PlayerRank
                        key={player.rank}
                        {...player}
                        onClick={() => { }}
                    />
                ))}
            </div>
        </div>
    );
};

export default Ranking;
