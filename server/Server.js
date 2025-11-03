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

async function GetRanking(client) {
  try {
    const rankingQuery = `
    select * 
    from "User"
    order by "u_ranking" asc;`;
    const ranking = await client.query(rankingQuery);

    return ranking.rows;
  } catch (err) {
    console.error("GetRanking Error:", err);
    throw err;
  }
}

async function RefreshRoomList(socket = null) {
  try {
    const query = `
    select * 
    from "Room";`;
    const rooms = await client.query(query);

    if (socket) socket.emit("roomListUpdate", rooms.rows);
    else io.emit("roomListUpdate", rooms.rows);

    return rooms.rows;
  } catch (err) {
    console.error("RefreshRoomList Error:", err);
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
  port: 5432, /* 집 */
  // port: 5433, /* 회사 */
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
  const user = await client.query(`
    select "u_name", "u_win", "u_lose", "u_draw", "u_level", "u_exp" 
    from "User" 
    where "u_id" = $1`, [u_id]);
  res.json({ success: true, user: user.rows[0] });
});

app.get("/GetRoomsInfo", async (req, res) => {
  try {
    const rooms = await RefreshRoomList();

    res.json({ success: true, rooms: rooms });

  } catch (err) {
    console.error("GetRooms Error:", err);
    res.status(500).json({ success: false, message: "Failed to load rooms" });
  }
});

app.get("/GetRankingInfo", async (req, res) => {
  try {
    const ranking = await GetRanking(client);

    res.json({ success: true, ranking: ranking });

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
    const userQuery = `
    select * 
    from "User" 
    where "u_id" = $1;`;
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
    const userQuery = `
    insert into "User"("u_id", "u_password", "u_name") 
    values($1, $2, $3) 
    returning *`;
    const values = [u_id, u_password, u_name];
    const result = await client.query(userQuery, values);
    await client.query(`
      insert into "UserRoom" 
      values($1, null)`, [u_id]);

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
  await client.query(`
    update "User" 
    set "u_name" = $1 
    where "u_id" = $2`, [u_name, u_id]);
  res.json({ success: true });
});

app.post("/CreateRoom", async (req, res) => {
  const { roomData } = req.body;

  if (!roomData || !roomData.r_id) {
    return res.status(400).json({ success: false, message: "Invalid room data" });
  }

  try {
    const roomQuery = `
    insert into "Room" 
    values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
    returning *`;
    const values = [
      roomData.r_id, roomData.r_name, roomData.r_password, roomData.r_isLocked,
      roomData.r_players, roomData.r_maxPlayers, roomData.r_roomMaster,
      roomData.r_player1, roomData.r_player2, roomData.r_turnTime, roomData.r_isUndo];
    await client.query(roomQuery, values);

    res.json({ success: true, message: "Success sign up!" });

  } catch (err) {
    console.error("Create DB Error: ", err);
    res.status(500).json({ success: false, message: "DB Error" });
  }
});

app.post("/RandomRoom", async (req, res) => {
  try {
    const randomQuery = `
    select "r_id" 
    from "Room" 
    where "r_isLocked" = false 
    order by RANDOM() limit 1;`;
    const result = await client.query(randomQuery);

    res.json({ success: true, message: "Random join room.", room: result.rows[0] });

  } catch (err) {
    console.error("Random DB Error: ", err);
    res.status(500).json({ success: false, message: "DB Error" });
  }
});

app.post("/SearchRoom", async (req, res) => {
  const { text } = req.body;

  if (text === '') {
    const rooms = await RefreshRoomList();
    return res.json({ success: true, rooms: rooms });
  }

  try {
    const searchQuery = `
    select * 
    from "Room" 
    where "r_name" like '%'||$1||'%';`;
    const result = await client.query(searchQuery, [text]);
    const rooms = result.rows.map(room => ({
      r_id: room.r_id,
      r_name: room.r_name,
      r_password: room.r_password,
      r_isLocked: room.r_isLocked,
      r_players: room.r_players,
      r_maxPlayers: room.r_maxPlayers,
      r_roomMaster: room.r_roomMaster,
      r_player1: room.r_player1,
      r_player2: room.r_player2,
      r_turnTime: room.r_turnTime,
      r_isUndo: room.r_isUndo,
    }));

    return res.json({ success: true, rooms: rooms });

  } catch (err) {
    console.error("SearchRoom Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/JoinRoom", AuthMiddleware, async (req, res) => {
  const { r_id } = req.body;
  const { u_id } = req.user;

  if (!r_id) {
    return res.status(400).json({ success: false, message: "No room provided" });
  }

  try {
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
  try {
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
  socket.on("createRoom", async () => {
    try {
      await RefreshRoomList();

    } catch (err) {
      console.error("createRoom Error:", err);
      socket.emit("roomError", { message: "Create room faild!" });
    }
  });

  socket.on("joinRoom", async ({ r_id }) => {
    const { u_id, u_name } = socket.data.datas;

    try {
      socket.join(r_id);
      const roomQuery = `
      select *
      from "Room"
      where "r_id" = $1;`;
      const room = await client.query(roomQuery, [r_id]);
      const roomData = room.rows[0];

      const playersQuery = `
      update "Room" 
      set "r_players" = "r_players" + 1
      where "r_id" = $1
      and exists(
        select *
        from "UserRoom"
        where "u_id" = $2
        and "r_id" is distinct from $1)
      returning *;`;
      const players = await client.query(playersQuery, [r_id, u_id]);

      if (players.rows) {
        const userRoomQuery = `
        update "UserRoom" 
        set "r_id" = $1 
        where "u_id" = $2;`;
        await client.query(userRoomQuery, [r_id, u_id]);
      }

      const p1Query = `
      select *
      from "User"
      where u_name = $1;`;
      const p1 = await client.query(p1Query, [roomData.r_player1]);

      const p2Query = `
      select *
      from "User"
      where u_name = $1;`;
      const p2 = await client.query(p2Query, [roomData.r_player2]);

      io.to(r_id).emit("roomUpdate", { 
      room: roomData, p1: p1.rows[0], p2: p2.rows[0],
      p1_ready: roomData.r_p1Ready, p2_ready: roomData.r_p2Ready
      });

      socket.emit("joinRoomSuccess", {
        message: `${u_name} joined`,
        roomInfo: roomData,
      });

      await RefreshRoomList(null);

      const chatQuery = `
      select "c_sender", "c_text", "c_created"
      from "Chat"
      where "r_id" = $1
      order by "c_created" desc
      limit 30;`;
      const chatResult = await client.query(chatQuery, [r_id]);
      const chatHistory = chatResult.rows.reverse();

      socket.emit("loadChat", chatHistory);

    } catch (err) {
      console.error("joinRoom error:", err);
      socket.emit("roomError", { message: "joinRoom failed" });
    }
  });

  socket.on("playerJoin", async ({ r_id, p_num }) => {
    const { u_name } = socket.data.datas;

    if (!r_id) {
      return res.status(400).json({ success: false, message: "No room provided" });
    }

    try {
      const playerJoinQuery = p_num === 1
        ? `
      update "Room"
      set "r_player1" = $1
      where "r_id" = $2
      and "r_player1" is null
      and ("r_player2" != $3 or "r_player2" is null)
      returning *;`
        : `
      update "Room"
      set "r_player2" = $1
      where "r_id" = $2
      and "r_player2" is null
      and ("r_player1" != $3 or "r_player1" is null)
      returning *;`;
      const result = await client.query(playerJoinQuery, [u_name, r_id, u_name]);

      if (result.rowCount === 0) {
        console.log("You can't join!");
        return socket.emit("playerError", { message: "playerJoin failed" });
      }

      const playerQuery = `
      select *
      from "User"
      where u_name = $1;`;
      const player = await client.query(playerQuery, [u_name]);

      io.to(r_id).emit("playerUpdate", { player: player.rows[0], p_num: p_num, is_join: true, is_ready: false });

    } catch (err) {
      console.error("playerJoin Error:", err);
      socket.emit("playerError", { message: "playerJoin failed" });
    }
  });

  socket.on("playerLeave", async ({ r_id, p_num }) => {
    const { u_name } = socket.data.datas;

    if (!r_id) {
      return res.status(400).json({ success: false, message: "No room provided" });
    }

    try {
      const playerLeaveQuery = p_num === 1
        ? `
      update "Room"
      set "r_player1" = null
      where "r_id" = $1
      and "r_player1" = $2
      returning *;`
        : `
      update "Room"
      set "r_player2" = null
      where "r_id" = $1
      and "r_player2" = $2
      returning *;`;
      const result = await client.query(playerLeaveQuery, [r_id, u_name]);

      if (result.rows[0]) {
        io.to(r_id).emit("playerUpdate", { player: null, p_num: p_num, is_join: false, is_ready: false });
      }

    } catch (err) {
      console.error("playerLeave Error:", err);
      socket.emit("playerError", { message: "playerLeave failed" });
    }
  });

  socket.on("playerReady", async ({ r_id, p_num, is_ready }) => {
    const { u_name } = socket.data.datas;

    if (!r_id) {
      return res.status(400).json({ success: false, message: "No room provided" });
    }

    try {
      const playerReadyQuery = p_num === 1
        ? `
      update "Room"
      set "r_p1Ready" = $1
      where "r_id" = $2
      and "r_player1" = $3
      returning *;`
        : `
      update "Room"
      set "r_p2Ready" = $1
      where "r_id" = $2
      and "r_player2" = $3
      returning *`;
      const result = await client.query(playerReadyQuery, [is_ready, r_id, u_name]);

      if (result.rows[0]) {
        const playerQuery = `
        select *
        from "User"
        where "u_name" = $1;`;
        const player = await client.query(playerQuery, [u_name]);

        io.to(r_id).emit("playerUpdate", { player: player.rows[0], p_num: p_num, is_join: true, is_ready: is_ready });
      }

    } catch (err) {
      console.error("playerLeave Error:", err);
      socket.emit("playerError", { message: "playerLeave failed" });
    }
  });

  socket.on("sendMessage", async ({ r_id, message }) => {
    const { u_name } = socket.data.datas;

    try {
      const insertQuery = `
      insert into "Chat" ("r_id", "c_sender", "c_text")
      values ($1, $2, $3);`;
      await client.query(insertQuery, [r_id, u_name, message]);

      const trimQuery = `
      delete from "Chat" 
      where "c_index" not in ( 
      select "c_index" 
      from "Chat" 
      where "r_id" = $1 
      order by "c_created" desc 
      limit 30) 
      and "r_id" = $1;`;
      await client.query(trimQuery, [r_id]);

      io.to(r_id).emit("newMessage", {
        c_sender: u_name,
        c_text: message,
        c_created: new Date().toISOString(),
      });

      console.log("newMessage is", { u_name, message });

    } catch (err) {
      console.error("sendMessage error:", err);
      socket.emit("chatError", { message: "Failed send message" });
    }
  });

  socket.on("leaveRoom", async ({ r_id }) => {
    const { u_id, u_name } = socket.data.datas;

    try {
      const userRoomQuery = `
      update "UserRoom" 
      set "r_id" = null
      where "u_id" = $1;`;
      await client.query(userRoomQuery, [u_id]);

      const leaveP1Query = `
      update "Room"
      set "r_player1" = null
      and "r_p1Ready" = false
      where "r_player1" = $1;`
      await client.query(leaveP1Query, [u_name]);

      const leaveP2Query = `
      update "Room"
      set "r_player2" = null
      and "r_p2Ready" = false
      where "r_player2" = $1;`
      await client.query(leaveP2Query, [u_name]);

      const roomQuery = `
      update "Room" 
      set "r_players" = "r_players" - 1
      where "r_id" = $1
      returning *;`;
      const room = await client.query(roomQuery, [r_id]);
      const roomData = room.rows[0];

      if (roomData.r_players < 1) {
        await client.query(`
        delete from "Room" 
        where "r_id" = $1;`, [r_id]);
        console.log(`Remove room (${r_id})`);
        RefreshRoomList();
        return;
      }

      const p1Query = `
      select *
      from "User"
      where u_name = $1;`;
      const p1 = await client.query(p1Query, [roomData.r_player1]);

      const p2Query = `
      select *
      from "User"
      where u_name = $1;`;
      const p2 = await client.query(p2Query, [roomData.r_player2]);

      if (roomData) {
        io.to(r_id).emit("roomUpdate", { 
        room: roomData, p1: p1.rows[0], p2: p2.rows[0],
        p1_ready: roomData.r_p1Ready, p2_ready: roomData.r_p2Ready
      });;
      }

      // 추후에 추가
      console.log(`left ${u_name} room (${r_id})`);

      socket.leave(r_id);
      console.log(`left room (${r_id})`);

      await RefreshRoomList(null);

    } catch (err) {
      console.error("leaveRoom Error:", err);
    }
  });

  socket.on("refreshRoomList", async () => {
    await RefreshRoomList(socket);
  });
});

server.listen(5000, () => {
  console.log("Socket running on http://localhost:5000")
});