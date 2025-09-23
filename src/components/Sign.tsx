import '../style/Sign.css'
import { useNavigate } from 'react-router-dom';
// import MainPage from './Ground'

export default function Login() {
    const navigate = useNavigate();

    function GoToLoginPage() {
        navigate('/Login');
    }

    return (
        <div className='sign-div'>
            <div className='login-link-div' onClick={GoToLoginPage}>
                <h3 className='login-link'>←login page</h3>
            </div>
            <h1 className='sign-title'>Sign Page</h1>
            <input type='text' placeholder='Input Id' className='sign-id' /><br />
            <input type='password' placeholder='Input password' className='sign-pwd'></input><br />
            <input type='password' placeholder='Input verify password' className='sign-verify-pwd'></input><br />
            <button className='sign-botton' onClick={GoToLoginPage}>Sign</button>
        </div>
    );
}