import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from "react";
import { socket, setNavigate } from "./socket";
import Login from './pages/Login';
import Sign from './pages/Sign_up';
import Home from './pages/Home';
import Room from './pages/Room';
import Ranking from './pages/Ranking';

export default function Router() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkTokenExpiration = () => {
            const token = localStorage.getItem("token");
            const isLoginPage = location.pathname === "/Login" || location.pathname === "/Sign_up";

            if (isLoginPage) {
                if (token && token.includes(".")) {
                    try {
                        const payload = JSON.parse(atob(token.split(".")[1]));
                        const exp = payload.exp * 1000;
                        const now = Date.now();

                        if (now < exp) {
                            console.log("Already logged in. Redirecting to /Home");
                            navigate("/Home");
                            return;
                        }
                    } catch (err) {
                        console.warn("Invalid token payload on Login page:", err);
                    }
                }
                return;
            }

            if (!token || typeof token !== "string" || !token.includes(".")) {
                alert("Invalid or missing token.");
                console.warn("Invalid or missing token:", token);
                navigate("/Login");
                return;
            }

            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const exp = payload.exp * 1000;
                const now = Date.now();

                if (now > exp) {
                    console.warn("Token expired. Disconnecting socket...");
                    socket.disconnect();
                    localStorage.removeItem("token");
                    navigate("/Login");
                }
            } catch (err) {
                console.error("Invalid token payload:", err);
                localStorage.removeItem("token");
                navigate("/Login");
            }
        };

        checkTokenExpiration();
        setNavigate(navigate);

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
        </Routes>
    );
}