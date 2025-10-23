import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlayerRank from "../components/PlayerRank";
import { UserInfo } from "../pages/Home";
import "../styles/Ranking.css";

const Ranking: React.FC = () => {
    const navigate = useNavigate();
    const [ranking, setRanking] = useState<UserInfo[]>([]);

    useEffect(() => {
        fetchRanking();
    });

    async function fetchRanking() {
        try {
            const res = await fetch("http://localhost:5000/GetRankingInfo");
            const data = await res.json();

            if (data.success) {
                console.log("data.ranking:", data.ranking);
                setRanking(data.ranking);
            } else {
                console.error("Failed to fetch ranking:", data.message);
            }

        } catch (err) {
            console.error("Error fetching ranking:", err);
        }
    }

    return (
        <div className="ranking-page">
            <div className="ranking-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    Back
                </button>
                <h1 className="ranking-title">Ranking</h1>
            </div>

            <div className="ranking-list">
                {ranking.map((player) => (
                    <PlayerRank
                        key={player.u_ranking}
                        {...player}
                        onClick={() => { }}
                    />
                ))}
            </div>
        </div>
    );
};

export default Ranking;
