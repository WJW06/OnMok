import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './Router';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

declare global {
  interface Window {
    playMainBGM: () => void;
    playGameBGM: () => void;
    playPlaceSound: () => void;
  }
}

function RootApp() {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const sfxPlaceRef = useRef<HTMLAudioElement | null>(null);
  const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  };
  const savedVolume = Number(getCookie("bgm_volume")) || 0.4;
  const [volume, setVolume] = useState(savedVolume);
  const currentBGM = useRef<"main"|"game"|null>(null);

  useEffect(() => {
    document.cookie = `bgm_volume=${volume}; path=/; max-age=31536000`;
    if (bgmRef.current) {
      bgmRef.current.volume = volume;
    }

    window.playMainBGM = () => {
      if (!bgmRef.current || currentBGM.current === "main") return;
      bgmRef.current.src = "/bgm/mainBGM.mp3";
      bgmRef.current.loop = true;
      bgmRef.current.volume = volume;
      bgmRef.current.play().catch((err) => {console.log("blocked main BGM:", err);});
      currentBGM.current = "main";
    };

    window.playGameBGM = () => {
      if (!bgmRef.current || currentBGM.current === "game") return;
      bgmRef.current.src = "/bgm/mainBGM.mp3";
      bgmRef.current.loop = true;
      bgmRef.current.volume = volume;
      bgmRef.current.play().catch((err) => {console.log("blocked game BGM:", err);});
      currentBGM.current = "game";
    };

    window.playPlaceSound = () => {
      if (!sfxPlaceRef.current) return;
      sfxPlaceRef.current.currentTime = 0;
      sfxPlaceRef.current.volume = 0.7;
      sfxPlaceRef.current.play().catch((err) => {console.log("blocked place SFX:", err);});
    };
  }, [volume]);

useEffect(() => {
  const enableBGM = () => {
    if (window.location.pathname === "/Login" ||
        window.location.pathname === "/Sign_up") return;
    window.playMainBGM();
    window.removeEventListener("click", enableBGM);
  };

  window.addEventListener("click", enableBGM);
}, []);

  return (
    <>
      <audio ref={bgmRef} preload="auto"></audio>
      <audio ref={sfxPlaceRef} src="/sfx/placeSFX.mp3" preload="auto"></audio>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<RootApp />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
