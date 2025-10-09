import { useEffect, useState } from 'react';
import '../style/Sign_up.css'
import { useNavigate } from 'react-router-dom';
// import MainPage from './Ground'

export default function Login() {
    useEffect(() => {
        fetch("http://localhost:5000/Sign_up")
            .then((res) => res.json())
            .then((data) => { console.log(data) })
    });

    const navigate = useNavigate();

    function GoToLoginPage() {
        navigate('/Login');
    }

    const [u_id, setU_id] = useState("");
    const [u_pwd, setU_pwd] = useState("");
    const [u_verify_pwd, setU_verify_pwd] = useState("");

    const Sign_Up = async () => {
        if (u_pwd !== u_verify_pwd) {
            alert("Not equal pwd.");
            return;
        }

        const res = await fetch("http://localhost:5000/Sign_up", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ u_id, u_pwd }),
        });

        const data = await res.json();
        console.log(data);
        
        if (data.success) {
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
            <input type='text' placeholder='Input Id' className='sign-id'
                onChange={(e) => { setU_id(e.target.value) }} /><br />
            <input type='password' placeholder='Input password' className='sign-pwd'
                onChange={(e) => { setU_pwd(e.target.value) }} /><br />
            <input type='password' placeholder='Input verify password' className='sign-verify-pwd'
                onChange={(e) => { setU_verify_pwd(e.target.value) }} /><br />
            <button className='sign-botton' onClick={Sign_Up}>Sign up</button>
        </div>
    );
}