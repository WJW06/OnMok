import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReloadToken } from "../socket";
import { LoginApi } from "../express";
import '../styles/Login.css'

const Login: React.FC = () => {
    const [u_id, setU_id] = useState("");
    const [u_password, setU_password] = useState("");
    const navigate = useNavigate();

    function GoToSignPage() {
        navigate('/Sign_up');
    }

    const Login = async () => {
        const data = await LoginApi(u_id, u_password);
        if (data.success) {
            if (!data.token) {
                console.error("Server did not return a valid token:", data);
                return;
            }

            const newToken = String(data.token);
            localStorage.setItem("token", newToken);
            ReloadToken(newToken);
            window.playMainBGM();
            navigate('/Home');
        }
        else {
            alert(data.message);
        }
    };

    return (
        <div className='login-div'>
            <div className='sign-link-div' onClick={GoToSignPage}>
                <h3 className='sign-link'>Sign up→</h3>
            </div>
            <h1 className='login-title'>Login</h1>
            <input type='text' placeholder='Input Id' className='login-id'
                onChange={(e) => setU_id(e.target.value)} /><br />
            <input type='password' placeholder='Input password' className='login-password'
                onChange={(e) => setU_password(e.target.value)} /><br />
            <button className='login-botton' onClick={Login}>Login</button>
        </div>
    );
}

export default Login;