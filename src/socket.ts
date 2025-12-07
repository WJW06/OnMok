import { io } from "socket.io-client";

// // [Local]
// export const socket = io("http://localhost:5000", {
//     transports: ["websocket"],
//     withCredentials: true,
//     autoConnect: false,
// });

// [Online]
export const socket = io("https://unpermanent-ara-unostensive.ngrok-free.dev", {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
});

let navigateFn: ((path: string) => void) | null = null;

export function setNavigate(fn: (path: string) => void) {
    navigateFn = fn;
}

export function ReloadToken(token: string | null) {
    if (!token || token === "undefined" || !token.includes(".")) {
        alert("Wrong token!");
        console.log("Wrong token!");
        if (navigateFn) navigateFn("/Login");
        return;
    }

    socket.auth = { token: token };
    (socket as any).isTokenReload = true;

    if (socket.connected) {
        console.log("Disconnecting old socket...");
        socket.disconnect();
    }

    console.log("Reconnecting with new token...");
    socket.connect();
}

socket.on("connect", () => {
    const r_id = sessionStorage.getItem("currentRoom");
    if (r_id) socket.emit("joinRoom", { r_id });
    (socket as any).isTokenReload = false;
    console.log("Connected:", socket.id)
});

socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
    if (err.message === "Authentication error") {
        alert("Login session end. Re-login please");
        if (navigateFn) navigateFn("/Login");
    }
});

socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
});