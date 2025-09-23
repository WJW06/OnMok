import '../style/Login.css'
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();

    function GoToSignPage() {
        navigate('/Sign');
    }

    function GoToMainPage() {
        navigate('/Ground');
    }

    return (
        <div className='login-div'>
            <div className='sign-link-div' onClick={GoToSignPage}>
                <h3 className='sign-link'>sign page→</h3>
            </div>
            <h1 className='login-title'>Login Page</h1>
            <input type='text' placeholder='Input Id' className='login-id' /><br />
            <input type='password' placeholder='Input password' className='login-pwd'></input><br />
            <button className='login-botton' onClick={GoToMainPage}>Login</button>
        </div>
    );
}