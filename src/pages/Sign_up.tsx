import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sign_UpApi } from "../express";
import '../styles/Sign_up.css'

const Sign_up: React.FC = () => {
    const [u_id, setU_id] = useState("");
    const [u_password, setU_password] = useState("");
    const [u_verify_password, setU_verify_password] = useState("");
    const [u_name, setU_name] = useState("");
    const navigate = useNavigate();

    function GoToLoginPage() {
        navigate('/Login');
    }

    const Sign_Up = async () => {
        if (u_password !== u_verify_password) {
            alert("Not equal password.");
            return;
        }
        
        const data = await Sign_UpApi(u_id, u_password, u_name);
        if (data.success) {
            alert(data.message);
            navigate('/Login');
        }
        else {
            alert(data.message);
        }
    };

    return (
        <div className='sign-div'>
            <div className='login-link-div' onClick={GoToLoginPage}>
                <h3 className='login-link'>←Login</h3>
            </div>
            <h1 className='sign-title'>Sign up</h1>
            <input type='text' placeholder='Input id' className='sign-id'
                onChange={(e) => { setU_id(e.target.value) }} /><br />
            <input type='password' placeholder='Input password' className='sign-password'
                onChange={(e) => { setU_password(e.target.value) }} /><br />
            <input type='password' placeholder='Input verify password' className='sign-verify-password'
                onChange={(e) => { setU_verify_password(e.target.value) }} /><br />
            <input type='text' placeholder='Input name' className='sign-name'
                onChange={(e) => { setU_name(e.target.value) }} /><br />
            <button className='sign-botton' onClick={Sign_Up}>Sign up</button>
        </div>
    );
}

export default Sign_up;