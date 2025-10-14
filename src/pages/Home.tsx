import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import RoomBox, { Room } from "../components/RoomBox";
import PasswordModal from "../components/PasswordModal";
import SettingsModal from "../components/SettingModal";
import CreateBoxModal from "../components/CreateBoxModal";
import "../styles/Home.css";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ u_id: string; u_name: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
      } else {
        console.log("End login.");
        localStorage.removeItem("token");
        window.location.href = "/Login";
      }
    };

    fetchUser();
  }, []);

  const [rooms, setRooms] = useState<Room[]>([
    {
      r_id: "11111111",
      r_name: "Room 1",
      r_players: 1,
      r_maxPlayers: 8,
      r_turnTime: "1 min",
      r_isLocked: true,
      r_password: "1234",
    },
  ]);

  // const [rooms, setRooms] = useState<Room[]>([]); // 추후에
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  async function JoinRoom(room: Room) {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/JoinRoom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ r_id: room.r_id, token, r_name: room.r_name }),
    });

    const data = await res.json();
    if (data.success) {
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      navigate(`/room/${room.r_id}`);
    } else {
      alert(data.message || "Join room failed");
    }
  }

  const handleRoomClick = (room: Room) => {
    if (room.r_isLocked) {
      setSelectedRoom(room);
      setShowPasswordModal(true);
    } else {
      alert(`${room.r_id} Enter success!`);
      JoinRoom(room);
    }
  };

  const handlePasswordSubmit = (enteredPassword: string) => {
    if (selectedRoom && enteredPassword === selectedRoom.r_password) {
      setShowPasswordModal(false);
      alert(`${selectedRoom.r_name} Enter success!`);
      JoinRoom(selectedRoom);
    } else {
      alert("Wrong Password");
    }
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleCreateRoom = (room: {
    r_name: string;
    r_password: string;
    r_players: number;
    r_turnTime: string;
  }) => {
    const newRoom: Room = {
      r_id: uuidv4().slice(0, 8),
      r_name: room.r_name,
      r_players: 1,
      r_maxPlayers: room.r_players,
      r_turnTime: room.r_turnTime,
      r_isLocked: room.r_password.trim() !== "",
      r_password: room.r_password,
    };

    setRooms((prev) => [...prev, newRoom]);
    JoinRoom(newRoom);
  };

  return (
    <div className="home-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="profile-box">
          <div className="avatar" />
          <p className="nickname">{user?.u_name}</p>

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

        <button onClick={handleOpenCreateModal}>Create room</button>
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
            <RoomBox
              key={room.r_id}
              r_id={room.r_id}
              r_name={room.r_name}
              r_turnTime={room.r_turnTime}
              r_players={room.r_players}
              r_maxPlayers={room.r_maxPlayers}
              r_isLocked={room.r_isLocked}
              r_password={room.r_password}
              onClick={() => handleRoomClick(room)}
            />
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

      {showCreateModal && (
        <CreateBoxModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
};

export default Home;
