import React, { useState } from "react";
import "../styles/CreateBoxModal.css";

interface CreateBoxModalProps {
    onClose: () => void;
    onCreate: (roomData: {
        r_name: string;
        r_password: string;
        r_players: number;
        r_turnTime: string;
        r_undo: boolean;
    }) => void;
}

const CreateBoxModal: React.FC<CreateBoxModalProps> = ({ onClose, onCreate }) => {
    const [r_name, setName] = useState<string>("");
    const [r_password, setPassword] = useState<string>("");
    const [r_players, setPlayers] = useState<number>(4);
    const [r_turnTime, setTurnTime] = useState<string>("1 min");
    const [undo, setUndo] = useState(false);
    const [isTurnTimeOpen, setIsTurnTimeOpen] = useState<boolean>(false);

    const handleCreate = () => {
        if (!r_name.trim()) {
            alert("Input room name!");
            return;
        }

        onCreate({ r_name, r_password, r_players, r_turnTime, r_undo: undo, });
        onClose();
    };

    const turnOptions = ["10 sec", "30 sec", "1 min", "5 min"];

    return (
        <div className="create-modal-overlay">
            <div className="create-room-modal">
                <button className="close-btn" onClick={onClose}>✕</button>
                <h2 className="create-modal-title">Create Room</h2>

                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        value={r_name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter room name"
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={r_password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="(Optional)"
                    />
                </div>

                <div className="form-inline">
                    <div className="inline-group">
                        <label>Players</label>
                        <input
                            type="number"
                            min={2}
                            max={16}
                            value={r_players}
                            onChange={(e) => setPlayers(Number(e.target.value))}
                        />
                    </div>

                    <div className="undo-box">
                        <label>
                            Undo
                            <input
                                type="checkbox"
                                checked={undo}
                                onChange={(e) => setUndo(e.target.checked)}
                            />
                        </label>
                    </div>

                    <div className="inline-group">
                        <label style={{ marginRight: "12px" }}>Turn time</label>
                        <div className="dropdown">
                            <button
                                className="dropdown-btn"
                                onClick={() => setIsTurnTimeOpen(!isTurnTimeOpen)}
                            >
                                {r_turnTime} ▼
                            </button>
                            {isTurnTimeOpen && (
                                <ul className="dropdown-menu">
                                    {turnOptions.map((option) => (
                                        <li
                                            key={option}
                                            onClick={() => {
                                                setTurnTime(option);
                                                setIsTurnTimeOpen(false);
                                            }}
                                        >
                                            {option}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <button className="create-btn" onClick={handleCreate}>
                    Create
                </button>
            </div>
        </div>
    );
};

export default CreateBoxModal;
