const express = require("express");
const { Client } = require("pg");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error("ERROR: SECRET_KEY is not set. Set it in .env or environment variables.");
  process.exit(1);
}

function AuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "No token" });

  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
}


const app = express();
app.use(cors({ origin: "http://localhost:4000", credentials: true }));
app.use(express.json());

const client = new Client({
  user: "Test_user",
  host: "127.0.0.1",
  database: "Test_db",
  password: "1234",
  // port: 5432, /* 집 */
  port: 5433, /* 회사 */
});

client.connect();

app.get("/", async (req, res) => {
  try {
    console.log("Enter Login page");
  } catch (err) {
    console.error(err);
    res.status(404).send("Not Found");
  }
});

app.get("/Login", async (req, res) => {
  try {
    console.log("Enter Login page");
  } catch (err) {
    console.error(err);
    res.status(404).send("Not Found");
  }
});

app.get("/Sign_up", async (req, res) => {
  try {
    console.log("Enter Sign page");
  } catch (err) {
    console.error(err);
    res.status(404).send("Not Found");
  }
});

app.get("/GetUserInfo", AuthMiddleware, async (req, res) => {
  const u_id = req.user.u_id;
  const result = await client.query('select u_name, u_win, u_lose, u_draw, u_level, u_exp from "User" where u_id = $1', [u_id]);
  res.json({ success: true, user: result.rows[0] });
});


app.get("/Ground", async (req, res) => {
  try {
    const result = await client.query("select now()");
    res.json(result.rows[0]);
    console.log("Enter game");
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

app.post("/Login", async (req, res) => {
  const { u_id, u_password } = req.body;

  try {
    const query = `select * from "User" where u_id = $1`;
    const result = await client.query(query, [u_id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "This ID does not exist." });
    }

    const user = result.rows[0];

    if (user.u_password !== u_password) {
      return res.status(401).json({ success: false, message: "The password is different." });
    }

    const token = jwt.sign(
      { u_id: user.u_id, u_name: user.u_name, r_id: null },
      SECRET_KEY,
      { expiresIn: "30min" }
    );

    console.log(`${u_id} logged in successfully`);
    res.json({ success: true, token, message: "Success Login!" });

  } catch (err) {
    console.error("Login DB Error: ", err);
    res.status(500).json({ success: false, message: "DB Error" });
  }
});

app.post("/Sign_up", async (req, res) => {
  const { u_id, u_password, u_name } = req.body;

  try {
    const query = `insert into "User"(u_id, u_password, u_name) values($1, $2, $3) returning *`;
    const values = [u_id, u_password, u_name];
    const result = await client.query(query, values);

    console.log("Inserted user: ", result.rows[0]);
    res.json({ success: true, message: "Success sign up!", user: result.rows[0] });

  } catch (err) {
    if (err.code === "23505") {
      res.json({ success: false, message: "This ID / NAME already exists." });
    } else {
      res.status(500).json({ success: false, message: "DB Error" });
    }

    console.error("Sign DB Error: ", err);
  }
});

// 아직 미사용
app.post("/SetUserInfo", AuthMiddleware, async (req, res) => {
  const { u_id } = req.user;
  const { u_name } = req.body;
  await client.query('update "User" set u_name = $1 where u_id = $2', [u_name, u_id]);
  res.json({ success: true });
});

const rooms = new Map();

app.post("/CreateRoom", async (req, res) => {
  const { roomData } = req.body;

  try {
    var turnTime;
    switch (roomData.r_turnTime) {
      case "10 sec":
        turnTime = 10;
        break;
      case "30 sec":
        turnTime = 30;
        break;
      case "1 min":
        turnTime = 60;
        break;
      case "5 min":
        turnTime = 300;
        break;
    }

    const query = `insert into "Room" values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *`;
    const values = [
      roomData.r_id, roomData.r_name, roomData.r_password, roomData.r_isLocked,
      roomData.r_players, roomData.r_maxPlayers, roomData.r_roomMaster,
      roomData.r_player1, roomData.r_player2, turnTime, roomData.r_undo];
    const result = await client.query(query, values);

    console.log("Inserted room: ", result.rows[0]);
    res.json({ success: true, message: "Success sign up!", user: result.rows[0] });

  } catch (err) {
    res.status(500).json({ success: false, message: "DB Error" });
    console.error("Create DB Error: ", err);
  }
});

app.post("/JoinRoom", AuthMiddleware, (req, res) => {
  const { r_id } = req.body;
  const { u_name } = req.user;

  if (!r_id) {
    return res.status(400).json({ success: false, message: "No room provided" });
  }

  try {
    const room = rooms.get(r_id);

    if (room) {
      if (!room.users.includes(u_name)) {
        room.users.push(u_name);
      }
      rooms.set(r_id, room);
    }
    else {
      rooms.set(r_id, { users: [u_name], state: {} });
    }
    console.log(`${u_name} joined room. (room id: ${r_id})`);

    const { exp, ...userRest } = req.user;;
    const newToken = jwt.sign(
      { ...userRest, r_id: r_id },
      SECRET_KEY,
      { expiresIn: "2h" }
    );
    return res.json({ success: true, token: newToken });

  } catch (err) {
    console.error("JoinRoom Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/LeaveRoom", AuthMiddleware, (req, res) => {
  const { r_id } = req.body;
  const { u_name } = req.user;

  if (!r_id) {
    return res.status(400).json({ success: false, message: "No room provided" });
  }

  try {
    console.log(`${u_name} leave room. (room id: ${r_id})`);
    rooms.delete(r_id, { users: [u_name], state: {} });

    const { exp, ...userRest } = req.user;
    const newToken = jwt.sign(
      { ...userRest, r_id: null },
      SECRET_KEY,
      { expiresIn: "30min" }
    );
    return res.json({ success: true, token: newToken });

  } catch (err) {
    console.error("LeaveRoom Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* Socket.io */

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

  if (!token) {
    console.log("No token provided in socket connection");
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    socket.data = decoded;
    next();
  } catch (err) {
    console.error("Invalid token in socket.io:", err);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
    if (err.message === "Authentication error") {
      alert("Login session end. Re-login please");
      navigate("/Login");
    }
  });

  socket.on("joinRoom", async (r_id) => {
    try {
      const { u_name } = socket.data;

      socket.join(r_id);
      if (!rooms.has(r_id)) {
        rooms.set(r_id, { users: [u_name] });
        console.log(`Created room (${r_id}) by ${u_name}`);
      } else {
        const room = rooms.get(r_id);
        if (!room.users.includes(u_name)) room.users.push(u_name);
        console.log(`${u_name} joined room (${r_id})`);
      }

      const query = `select * from "Room" where r_id = $1;`;
      const room = await client.query(query, [r_id]);
      const roomData = room.rows[0];

      io.to(r_id).emit("roomUpdate", { room: roomData });
      socket.emit("joinRoomSuccess", {
        message: `${u_name} joined`,
        roomInfo: roomData,
      });
    } catch (err) {
      console.error("joinRoom error:", err);
      socket.emit("roomError", { message: "joinRoom failed" });
    }
  });

  socket.on("leaveRoom", (r_id) => {
    try {
      const { u_name } = socket.data;
      const room = rooms.get(r_id);

      if (room) {
        room.users = room.users.filter((u) => u !== u_name);
        io.to(r_id).emit("roomUpdate", { room });
        console.log(`${u_name} left room (${r_id})`);
      }

      socket.leave(r_id);
    } catch (err) {
      console.error("leaveRoom Error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Socket running on http://localhost:5000")
});