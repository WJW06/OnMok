import React, { useState, useEffect } from "react";
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
      id: 1,
      title: "Room 1",
      setting: "Normal Mode",
      players: 1,
      maxPlayers: 8,
      isLocked: true,
      password: "1234",
    },
  ]);

  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const addRoom = () => {
    const newRoom: Room = {
      id: Date.now(),
      title: `Room ${rooms.length + 1}`,
      setting: "Default Setting",
      players: Math.floor(Math.random() * 8),
      maxPlayers: 8,
      isLocked: Math.random() > 0.5,
      password: Math.random() > 0.5 ? "0000" : "",
    };
    setRooms((prev) => [...prev, newRoom]);
  };

  const handleRoomClick = (room: Room) => {
    if (room.isLocked) {
      setSelectedRoom(room);
      setShowPasswordModal(true);
    } else {
      alert(`${room.title} Enter success!`);
    }
  };

  const handlePasswordSubmit = (enteredPassword: string) => {
    if (selectedRoom && enteredPassword === selectedRoom.password) {
      alert(`${selectedRoom.title} Enter success!`);
      setShowPasswordModal(false);
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
          <p className="stats">win / lose / draw</p>
          <p className="level">level 70%</p>
        </div>

        <button onClick={addRoom}>Create room</button>
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
            <RoomBox key={room.id} {...room} onClick={() => handleRoomClick(room)} />
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
