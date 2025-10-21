import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from "react";
import { socket } from "./socket";
import Login from './pages/Login';
import Sign from './pages/Sign_up';
import Home from './pages/Home';
import Room from './pages/Room';
import Ranking from './pages/Ranking';
import Ground from './components/Ground';

export default function Router() {
    const navigate = useNavigate();

    useEffect(() => {
        const checkTokenExpiration = () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            const payload = JSON.parse(atob(token.split(".")[1]));
            const exp = payload.exp * 1000;
            const now = Date.now();

            if (now > exp) {
                console.warn("End token. disconnect socket.");
                socket.disconnect();
                localStorage.removeItem("token");
                navigate("/login");
            }
        };

        checkTokenExpiration();

        const interval = setInterval(checkTokenExpiration, 5000);
        return () => clearInterval(interval);
    }, [navigate]);

    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Sign_up" element={<Sign />} />
            <Route path="/Home" element={<Home />} />
            <Route path="/room/:r_id" element={<Room />} />
            <Route path="/Ranking" element={<Ranking />} />
            <Route path="/Ground" element={<Ground />} />
        </Routes>
    );
}