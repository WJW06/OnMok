import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Sign from './pages/Sign_up';
import Home from './pages/Home';
import Room from './pages/Room';
import Ground from './components/Ground';

export default function Router() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Sign_up" element={<Sign />} />
            <Route path="/Home" element={<Home />} />
            <Route path="/Ground" element={<Ground />} />
            <Route path="/room/:r_id" element={<Room />} />
        </Routes>
    );
}