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

async function getRoomsAndEmit(io, client) {
  try {
    const query = `select * from "Room";`;
    const result = await client.query(query);
    const rooms = result.rows.map(room => ({
      r_id: room.r_id,
      r_name: room.r_name,
      r_password: room.r_password,
      r_isLocked: room.r_islocked,
      r_players: room.r_players,
      r_maxPlayers: room.r_maxplayer,
      r_roomMaster: room.r_roommaster,
      r_player1: room.r_player1,
      r_player2: room.r_player2,
      r_turnTime: room.r_turntime,
      r_isUndo: room.r_undo,
    }));

    if (io) {
      io.emit("roomListUpdate", rooms);
    }

    return rooms;
  } catch (err) {
    console.error("getRoomsAndEmit Error:", err);
    throw err;
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
  const user = await client.query('select u_name, u_win, u_lose, u_draw, u_level, u_exp from "User" where u_id = $1', [u_id]);
  res.json({ success: true, user: user.rows[0] });
});

app.get("/GetRoomsInfo", async (req, res) => {
  try {
    const rooms = await getRoomsAndEmit(null, client);

    res.json({ success: true, rooms: rooms });

  } catch (err) {
    console.error("GetRooms Error:", err);
    res.status(500).json({ success: false, message: "Failed to load rooms" });
  }
});

app.get("/Ground", async (req, res) => {
  try {
    const result = await client.query("select now()");
    console.log("Enter game");
    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

app.post("/Login", async (req, res) => {
  const { u_id, u_password } = req.body;

  try {
    const userQuery = `select * from "User" where u_id = $1`;
    const result = await client.query(userQuery, [u_id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "This ID does not exist." });
    }

    const user = result.rows[0];
    if (user.u_password !== u_password) {
      return res.status(401).json({ success: false, message: "The password is different." });
    }

    const token = jwt.sign(
      { u_id: user.u_id, u_name: user.u_name },
      SECRET_KEY,
      { expiresIn: "30min" }
    );

    console.log(`"${u_id}" logged in successfully`);
    res.json({ success: true, token, message: "Success Login!" });

  } catch (err) {
    console.error("Login DB Error: ", err);
    res.status(500).json({ success: false, message: "DB Error" });
  }
});

app.post("/Sign_up", async (req, res) => {
  const { u_id, u_password, u_name } = req.body;

  try {
    const userQuery = `insert into "User"(u_id, u_password, u_name) values($1, $2, $3) returning *`;
    const values = [u_id, u_password, u_name];
    const result = await client.query(userQuery, values);
    await client.query(`insert into "UserRoom" values($1, null)`, [u_id]);

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

app.post("/CreateRoom", async (req, res) => {
  const { roomData } = req.body;

  try {
    const roomQuery = `insert into "Room" values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *`;
    const values = [
      roomData.r_id, roomData.r_name, roomData.r_password, roomData.r_isLocked,
      roomData.r_players, roomData.r_maxPlayers, roomData.r_roomMaster,
      roomData.r_player1, roomData.r_player2, roomData.r_turnTime, roomData.r_undo];
    const result = await client.query(roomQuery, values);

    res.json({ success: true, message: "Success sign up!", user: result.rows[0] });

  } catch (err) {
    console.error("Create DB Error: ", err);
    res.status(500).json({ success: false, message: "DB Error" });
  }
});

app.post("/RandomRoom", async (req, res) => {
  try {
    const randomQuery = `select r_id from "Room" where r_isLocked = false order by RANDOM() limit 1;`;
    const result = await client.query(randomQuery);

    res.json({ success: true, message: "Random join room.", room: result.rows[0] });

  } catch (err) {
    console.error("Random DB Error: ", err);
    res.status(500).json({ success: false, message: "DB Error" });
  }
});

app.post("/JoinRoom", AuthMiddleware, async (req, res) => {
  const { r_id } = req.body;
  const { u_id } = req.user;

  if (!r_id) {
    return res.status(400).json({ success: false, message: "No room provided" });
  }

  try {
    const selectRoomQuery = `select r_players from "Room" where r_id = $1;`;
    const room = await client.query(selectRoomQuery, [r_id]);

    if (!room.rows) {
      console.log("Not enabled room!");
      return;
    }

    const players = room.rows[0].r_players;
    const joinPlayerQuery = `update "Room" set r_players = $1 where r_id = $2;`;
    await client.query(joinPlayerQuery, [players + 1, r_id]);

    const joinRoomQuery = `update "UserRoom" set r_id = $1 where u_id = $2 returning *;`;
    const userRoom = await client.query(joinRoomQuery, [r_id, u_id]);

    console.log("userRoom:", userRoom.rows);

    if (!userRoom.rowCount) {
      console.log("Not found user!");
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { exp, ...userRest } = req.user;
    const token = jwt.sign(
      { ...userRest },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    return res.json({ success: true, token: token });

  } catch (err) {
    console.error("JoinRoom Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/LeaveRoom", AuthMiddleware, async (req, res) => {
  const { r_id } = req.body;
  const { u_id, u_name } = req.user;

  if (!r_id) {
    return res.status(400).json({ success: false, message: "No room provided" });
  }

  try {
    const leaveP1Query = `update "Room" set r_player1 = '' where r_player1 = $1;`
    await client.query(leaveP1Query, [u_name]);
    const leaveP2Query = `update "Room" set r_player2 = '' where r_player2 = $1;`
    await client.query(leaveP2Query, [u_name]);

    const leaveRoomQuery = `update "UserRoom" set r_id = null where u_id = $1 returning *;`;
    const userRoom = await client.query(leaveRoomQuery, [u_id]);

    if (!userRoom.rowCount) {
      console.log("Not found user!");
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const getPlayersQuery = `select r_players from "Room" where r_id = $1;`;
    const room = await client.query(getPlayersQuery, [r_id]);
    const players = room.rows[0].r_players;

    const leavePlayerQuery = `update "Room" set r_players = $1 where r_id = $2;`;
    await client.query(leavePlayerQuery, [players - 1, r_id]);

    if (players === 1) {
      await client.query(`delete from "Room" where r_id = $1;`, [r_id]);
      console.log(`Remove room (${r_id})`);
    }

    const { exp, ...userRest } = req.user;
    const newToken = jwt.sign(
      { ...userRest },
      SECRET_KEY,
      { expiresIn: "30min" }
    );

    return res.json({ success: true, token: newToken });

  } catch (err) {
    console.error("LeaveRoom Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/PlayerJoin", AuthMiddleware, async (req, res) => {
  const { r_id, p_num } = req.body;
  const { u_name } = req.user;

  if (!r_id) {
    return res.status(400).json({ success: false, message: "No room provided" });
  }

  try {
    const playerJoinQuery = p_num === 1
      ? `update "Room" set r_player1 = $1 where r_id = $2 and r_player1 = '' and r_player2 != $3;`
      : `update "Room" set r_player2 = $1 where r_id = $2 and r_player2 = '' and r_player1 != $3;`;
    const result = await client.query(playerJoinQuery, [u_name, r_id, u_name]);
    if (result.rowCount === 0) {
      return res.json({ success: false, message: "Seat already taken" });
    }

    const roomQuery = `select * from "Room" where r_id = $1;`;
    const room = await client.query(roomQuery, [r_id]);
    const roomData = room.rows[0];

    io.to(r_id).emit("roomUpdate", { room: roomData });

    res.json({ success: true, message: `Player ${p_num} joined successfully`, user: u_name });

  } catch (err) {
    console.error("PlayerJoin Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/PlayerLeave", AuthMiddleware, async (req, res) => {
  const { r_id, p_num } = req.body;
  const { u_name } = req.user;

  if (!r_id) {
    return res.status(400).json({ success: false, message: "No room provided" });
  }

  try {
    const playerLeaveQuery = p_num === 1
      ? `update "Room" set r_player1 = '' where r_id = $1 and r_player1 = $2;`
      : `update "Room" set r_player2 = '' where r_id = $1 and r_player2 = $2;`;
    const result = await client.query(playerLeaveQuery, [r_id, u_name]);
    if (result.rowCount === 0) {
      return res.json({ success: false, message: "Not same user" });
    }

    const roomQuery = `select * from "Room" where r_id = $1;`;
    const room = await client.query(roomQuery, [r_id]);
    const roomData = room.rows[0];

    io.to(r_id).emit("roomUpdate", { room: roomData });

    res.json({ success: true, message: `Player ${p_num} joined successfully` });

  } catch (err) {
    console.error("PlayerLeave Error:", err);
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
  const authHeader = socket.handshake.auth?.token
    || socket.handshake.headers?.authorization;
  let token;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (typeof authHeader === 'string') {
    token = authHeader;
  }
  console.log("token provided is:", token);

  if (!token) {
    console.log("No token provided in socket connection");
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY, { clockTolerance: 5 });
    socket.data.datas = decoded;
    console.log("Success io use!");
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.error("Token expired at:", err.expiredAt);
      return next(new Error("Authentication error: token_expired"));
    } else {
      console.error("Invalid token in socket.io:", err);
      return next(new Error("Authentication error: invalid_token"));
    }
  }
});

io.on("connection", (socket) => {
  console.log("Success socket connection!");

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
    if (err.message === "Authentication error") {
      alert("Login session end. Re-login please");
      navigate("/Login");
    }
  });

  socket.on("createRoom", async () => {
    try {
      await getRoomsAndEmit(io, client);

    } catch (err) {
      console.error("CreateRoom Error:", err);
      socket.emit("roomError", { message: "Create room faild!" });
    }
  });

  socket.on("joinRoom", async () => {
    try {
      const { u_id, u_name } = socket.data.datas;
      const joinRoomQuery = `select r_id from "UserRoom" where u_id = $1;`;
      const result = await client.query(joinRoomQuery, [u_id]);

      if (result.rows[0] === null) {
        console.log("This user not join room");
        socket.emit("roomError", { message: "joinRoom failed" });
        return;
      }

      const r_id = result.rows[0].r_id;
      socket.join(r_id);

      const roomQuery = `select * from "Room" where r_id = $1;`;
      const room = await client.query(roomQuery, [r_id]);
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

  socket.on("leaveRoom", async () => {
    try {
      const { u_id, u_name } = socket.data.datas;
      const leaveRoomQuery = `select r_id from "UserRoom" where u_id = $1;`;
      const result = await client.query(leaveRoomQuery, [u_id]);

      if (result.rows[0] === null) {
        console.log("This user not join room");
        socket.emit("roomError", { message: "joinRoom failed" });
        return;
      }

      const r_id = result.rows[0].r_id;
      const roomQuery = `select * from "Room" where r_id = $1;`;
      const room = await client.query(roomQuery, [r_id]);

      if (room.rows[0] === 0) {
        io.to(r_id).emit("roomUpdate", { room });
        console.log(`Remove room (${r_id})`);
      }

      // 추후 추가
      console.log(`left ${u_name} room (${r_id})`);

      socket.leave(r_id);
      console.log(`left room (${r_id})`);
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