import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Sign from './components/Sign';
import Ground from './components/Ground';

export default function Router() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Sign" element={<Sign />} />
            <Route path="/Ground" element={<Ground />} />
        </Routes>
    );
}