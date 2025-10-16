import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoomBox from "../components/RoomBox";
import PasswordModal from "../components/PasswordModal";
import SettingsModal from "../components/SettingModal";
import CreateBoxModal from "../components/CreateBoxModal";
import { RoomInfo } from "../pages/Room";
import "../styles/Home.css";

interface UserInfo {
  u_name: string,
  u_win: number,
  u_lose: number,
  u_draw: number,
  u_level: number,
  u_exp: number,
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Wrong token!");
        console.log("Wrong token!");
        navigate("/Login");
        return;
      }

      const res = await fetch("http://localhost:5000/GetUserInfo", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        localStorage.removeItem("token");
        navigate("/Login");
        return;
      }

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
      } else {
        console.log("End login.");
        localStorage.removeItem("token");
        navigate("/Login");
      }
    };

    fetchUser();
  }, []);

  const [rooms, setRooms] = useState<RoomInfo[]>([
    {
      r_id: "11111111",
      r_name: "Room 1",
      r_password: "1234",
      r_isLocked: true,
      r_players: 1,
      r_maxPlayers: 8,
      r_roomMaster: "",
      r_player1: "",
      r_player2: "",
      r_turnTime: "1 min",
      r_undo: false,
    },
  ]);

  // const [rooms, setRooms] = useState<Room[]>([]); // 추후에
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);

  async function JoinRoom(room: RoomInfo) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Wrong token!");
      console.log("Wrong token!");
      navigate("/Login");
      return;
    };

    const res = await fetch("http://localhost:5000/JoinRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ r_id: room.r_id }),
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem("token", data.token);
      navigate(`/room/${room.r_id}`);
    } else {
      alert(data.message || "Join room failed");
    }
  }

  const handleRoomClick = (room: RoomInfo) => {
    if (room.r_isLocked) {
      setSelectedRoom(room);
      setShowPasswordModal(true);
    } else {
      JoinRoom(room);
    }
  };

  const handlePasswordSubmit = (enteredPassword: string) => {
    if (selectedRoom && enteredPassword === selectedRoom.r_password) {
      setShowPasswordModal(false);
      JoinRoom(selectedRoom);
    } else {
      alert("Wrong Password");
    }
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleCreateRoom = async (room: RoomInfo) => {
    await fetch("http://localhost:5000/CreateRoom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomData: room }),
    });

    setRooms((prev) => [...prev, room]);
    JoinRoom(room);
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="home-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="profile-box">
          <div className="avatar" />
          <p className="nickname">{user.u_name}</p>

          <div className="stats-box">
            <div className="stat-item">
              <span>{user.u_win} Win</span>
            </div>
            <div className="stat-item">
              <span>{user.u_lose} Lose</span>
            </div>
            <div className="stat-item">
              <span>{user.u_draw} Draw</span>
            </div>
          </div>

          <div className="level-box">
            <span className="level-text">Level {user.u_level}</span>
            <div className="level-bar">
              <span className="level-percent">{(user.u_exp / (4 + user.u_level * 4)) * 100}%</span>
              <div className="level-fill" style={{ width: `${(user.u_exp / (4 + user.u_level * 4)) * 100}%` }}>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleOpenCreateModal}>Create room</button>
        <button>Random room</button>
        <button>Ranking</button>

        <div className="theme-icon" onClick={() => setShowSettings(true)}>⚙️</div>
      </div>

      {/* room-list Area */}
      <div className="main-area">
        <div className="room-list-header">
          <h1>Room List</h1>
          <div className="search-container">
            <label htmlFor="search" className="sr-only">Search</label>
            <input
              id="search"
              type="text"
              placeholder="Search"
              className="search-input"
            />
            <button className="refresh-btn">🔄</button>
          </div>
        </div>

        <div className="room-list">
          {rooms.map((room) => (
            <RoomBox
              key={room.r_id}
              r_id={room.r_id}
              r_name={room.r_name}
              r_password={room.r_password}
              r_isLocked={room.r_isLocked}
              r_players={room.r_players}
              r_maxPlayers={room.r_maxPlayers}
              r_roomMaster={room.r_roomMaster}
              r_player1={room.r_player1}
              r_player2={room.r_player2}
              r_turnTime={room.r_turnTime}
              r_undo={room.r_undo}
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
          u_master={user.u_name}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
};

export default Home;
