import React, { useState, useEffect } from "react";
import { useNavigate, useLocation  } from "react-router-dom";
import RoomBox, { Room } from "../components/RoomBox";
import PasswordModal from "../components/PasswordModal";
import SettingsModal from "../components/SettingModal";
import "../styles/Home.css";

const Home: React.FC = () => {
  useEffect(() => {
    fetch("http://localhost:5000/Home")
      .then((res) => res.json())
      .then((data) => { console.log(data) })
  });
  
  const [rooms, setRooms] = useState<Room[]>([
    {
      r_id: 1,
      r_name: "Room 1",
      r_players: 1,
      r_maxPlayers: 8,
      r_setting: "Normal Mode",
      r_isLocked: true,
      r_password: "1234",
    },
  ]);
  
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { u_id } = location.state || {u_id: "Guset" }

  const createRoom = () => {
      const newRoom: Room = {
      r_id: rooms.length + 1,
      r_name: `Room ${rooms.length + 1}`,
      r_players: Math.floor(Math.random() * 8),
      r_maxPlayers: 8,
      r_setting: "Default Setting",
      r_isLocked: Math.random() > 0.5,
      r_password: Math.random() > 0.5 ? "0000" : "",  
    };
    setRooms((prev) => [...prev, newRoom]);
    SelectRoom();
  }

  const SelectRoom = async () => {
    const res = await fetch("http://localhost:5000/SelectRoom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ u_id: u_id }),
    });

    const data = await res.json();
    if (data.success) {
      navigate(`/room/${data.r_id}`);
    }
  }

  const handleRoomClick = (room: Room) => {
    if (room.r_isLocked) {
      setSelectedRoom(room);
      setShowPasswordModal(true);
    } else {
      alert(`${room.r_id} Enter success!`);
      SelectRoom();
    }
  };

  const handlePasswordSubmit = (enteredPassword: string) => {
    if (selectedRoom && enteredPassword === selectedRoom.r_password) {
      setShowPasswordModal(false);
      alert(`${selectedRoom.r_name} Enter success!`);
      SelectRoom();
    } else {
      alert("Wrong Password");
    }
  };

  return (
    <div className="home-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="profile-box">
          <div className="avatar" />
          <p className="nickname">Nickname</p>
          
          <div className="stats-box">
            <div className="stat-item">
              <span>{0} Win</span>
            </div>
            <div className="stat-item">
              <span>{0} Lose</span>
            </div>
            <div className="stat-item">
              <span>{0} Draw</span>
            </div>
          </div>

          <div className="level-box">
            <span className="level-text">Level {10}</span>
            <div className="level-bar">
              <span className="level-percent">70%</span>
              <div className="level-fill" style={{ width: "70%" }}>
              </div>
            </div>
          </div>
        </div>

        <button onClick={createRoom}>Create room</button>
        <button>Search room</button>
        <button>Random room</button>
        <button>Ranking</button>

        <div className="theme-icon" onClick={() => setShowSettings(true)}>⚙️</div>
      </div>

      {/* room-list Area */}
      <div className="main-area">
        <div className="room-list-header">
          <h1>Room List</h1>
          <button className="refresh-btn">🔄</button>
        </div>

        <div className="room-list">
          {rooms.map((room) => (
            <RoomBox key={room.r_name} {...room} onClick={() => handleRoomClick(room)} />
          ))}
        </div>
      </div>

      {/* Modals */}
      {showPasswordModal && (
        <PasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default Home;
