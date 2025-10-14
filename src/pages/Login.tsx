import { useEffect, useState } from 'react';
import '../styles/Login.css'
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    useEffect(() => {
        fetch("http://localhost:5000/Login")
            .then((res) => res.json())
            .then((data) => { console.log(data) })
    });

    const [u_id, setU_id] = useState("");
    const [u_password, setU_password] = useState("");
    const navigate = useNavigate();

    function GoToSignPage() {
        navigate('/Sign_up');
    }

    const Login = async () => {
        const res = await fetch("http://localhost:5000/Login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ u_id, u_password }),
        });

        const data = await res.json();
        console.log(data);

        if (data.success) {
            localStorage.setItem("token", data.token)
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