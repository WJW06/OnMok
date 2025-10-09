import React, { useState } from "react";
import "../styles/SettingModal.css";

interface SettingModalProps {
  onClose: () => void;
}

const SettingModal: React.FC<SettingModalProps> = ({ onClose }) => {
  const [bgm, setBgm] = useState<number>(50);
  const [sfx, setSfx] = useState<number>(50);
  const [mute, setMute] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const handleSave = () => {
    console.log("Setting saved:", { bgm, sfx, mute, darkMode });
    alert("설정이 저장되었습니다!");
    onClose();
  };

  return (
    <div className="setting-overlay">
      <div className="setting-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="setting-title">Setting</h2>

        <div className="slider-group">
          <label htmlFor="bgm">BGM</label>
          <input
            id="bgm"
            type="range"
            min="0"
            max="100"
            value={mute ? 0 : bgm}
            onChange={(e) => setBgm(Number(e.target.value))}
            disabled={mute}
          />
        </div>

        <div className="slider-group">
          <label htmlFor="sfx">SFX</label>
          <input
            id="sfx"
            type="range"
            min="0"
            max="100"
            value={mute ? 0 : sfx}
            onChange={(e) => setSfx(Number(e.target.value))}
            disabled={mute}
          />
        </div>

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={mute}
              onChange={(e) => setMute(e.target.checked)}
            />
            Mute
          </label>
        </div>

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
            Dark mode
          </label>
        </div>

        <button className="save-btn" onClick={handleSave}>SAVE</button>
      </div>
    </div>
  );
};

export default SettingModal;
