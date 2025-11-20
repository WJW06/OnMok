import React, { useEffect } from "react";

interface WinnerOverlayProps {
    message: String;
    onFinish: () => void;
}

export default function WinnerOverlay({ message, onFinish }: WinnerOverlayProps) {
    useEffect(() => {
        const timer = setTimeout(() => { onFinish(); }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.65)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                pointerEvents: "auto",
            }}
        >
            <div
                style={{
                    color: "white",
                    fontSize: "80px",
                    fontWeight: "bold",
                    animation: "winnerScale 1s ease-out",
                }}
            >
                {message}
            </div>

            <style>{`
        @keyframes winnerScale {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
