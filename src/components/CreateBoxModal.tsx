import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { RoomInfo } from "../pages/Room";
import "../styles/CreateBoxModal.css";

interface CreateBoxModalProps {
    u_master: string;
    onClose: () => void;
    onCreate: (roomData: RoomInfo) => void;
}

const CreateBoxModal: React.FC<CreateBoxModalProps> = ({ u_master, onClose, onCreate }) => {
    const [name, setName] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [maxPlayers, setMaxPlayers] = useState<number>(4);
    const [turnTime, setTurnTime] = useState<number>(60);
    const [isUndo, setUndo] = useState(false);
    const [isTurnDropDown, setIsTurnDropDown] = useState<boolean>(false);

    const handleCreate = () => {
        if (!name.trim()) {
            alert("Input room name!");
            return;
        }

        onCreate({
            r_id: uuidv4().slice(0, 8),
            r_name: name,
            r_password: password,
            r_isLocked: password.trim() ? true : false,
            r_players: 1,
            r_maxPlayers: maxPlayers,
            r_roomMaster: u_master,
            r_player1: "",
            r_player2: "",
            r_turnTime: turnTime,
            r_isUndo: isUndo,
        });
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
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter room name"
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
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
                            value={maxPlayers}
                            onChange={(e) => setMaxPlayers(Number(e.target.value))}
                        />
                    </div>

                    <div className="undo-box">
                        <label>
                            Undo
                            <input
                                type="checkbox"
                                checked={isUndo}
                                onChange={(e) => setUndo(e.target.checked)}
                            />
                        </label>
                    </div>

                    <div className="inline-group">
                        <label style={{ marginRight: "12px" }}>Turn time</label>
                        <div className="dropdown">
                            <button
                                className="dropdown-btn"
                                onClick={() => setIsTurnDropDown(!isTurnDropDown)}
                            >
                                {turnTime < 60 ? <span>{turnTime} sec</span>
                                    : <span>{turnTime / 60} min</span>}▼
                            </button>
                            {isTurnDropDown && (
                                <ul className="dropdown-menu">
                                    {turnOptions.map((option) => (
                                        <li
                                            key={option}
                                            onClick={() => {
                                                let time: number = 60;
                                                switch (option) {
                                                    case "10 sec":
                                                        time = 10;
                                                        break;
                                                    case "30 sec":
                                                        time = 30;
                                                        break;
                                                    case "1 min":
                                                        time = 60;
                                                        break;
                                                    case "5 min":
                                                        time = 300;
                                                        break;
                                                }

                                                setTurnTime(time);
                                                setIsTurnDropDown(false);
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
