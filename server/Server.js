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

async function LeaveRoomPlayer(r_id, u_id, u_name) {
  try {
    const roomQuery = `
    update "Room" 
    set "r_players" = "r_players" - 1
    where "r_id" = $1
    returning *;`;
    const room = await client.query(roomQuery, [r_id]);
    const roomData = room.rows[0];
    var player1 = roomData.r_player1;
    var player2 = roomData.r_player2;
    var p1Ready = true;
    var p2Ready = true;

    if (player1 == u_name) {
      CancleReady(r_id, 1, u_name, false);
      player1 = null;
    }
    if (player2 == u_name) {
      CancleReady(r_id, 2, u_name, false);
      player2 = null;
    }

    const userRoomQuery = `
    update "UserRoom" 
    set "r_id" = null
    where "u_id" = $1;`;
    await client.query(userRoomQuery, [u_id]);

    const leavePlayerQuery = `
    update "Room"
    set "r_player1" = $1,
        "r_player2" = $2
    where "r_id" = $3;`;
    await client.query(leavePlayerQuery,
      [player1, player2, r_id]);

    if (player1 && roomData.r_p1Ready) p1Ready = true;
    else p1Ready = false;

    if (player2 && roomData.r_p2Ready) p2Ready = true;
    else p2Ready = false;

    const readyQuery = `
    update "Room"
    set "r_p1Ready" = $1,
        "r_p2Ready" = $2
    where "r_id" = $3;`;
    await client.query(readyQuery,
      [p1Ready, p2Ready, r_id]);

    if (roomData.r_players < 1) {
      await client.query(`
      delete from "Room" 
      where "r_id" = $1;`, [r_id]);
      console.log(`Remove room (${r_id})`);
      await RefreshRoomList();
      return;
    }

    const p1Query = `
    select *
    from "User"
    where u_name = $1;`;
    const p1 = await client.query(p1Query, [player1]);

    const p2Query = `
    select *
    from "User"
    where u_name = $1;`;
    const p2 = await client.query(p2Query, [player2]);

    if (roomData) {
      io.to(r_id).emit("roomUpdate", {
        room: roomData, p1: p1.rows[0], p2: p2.rows[0],
        p1_ready: p1Ready, p2_ready: p2Ready
      });
      io.to(r_id).emit("newMessage", {
        c_sender: u_name,
        c_text: "left",
        c_created: new Date().toISOString(),
        c_isEvent: true,
      });
    }

    const isPlayingQuery = `
    select "b_isPlaying"
    from "Board"
    where "r_id" = $1;`;
    const isPlaying = await client.query(isPlayingQuery, [r_id]);

    if (isPlaying.rows[0]) {
      EndGame(r_id, u_name, u_name);
      io.to(r_id).emit("ended");
    }

    await RefreshRoomList(null);
  } catch (err) {
    console.error("LeaveRoomPlayer Error:", err);
  }
}

const countdowns = new Map();

async function CheckReadys(socket, r_id) {
  try {
    const checkReadyQuery = `
    select "r_p1Ready", "r_p2Ready"
    from "Room"
    where "r_id" = $1;`;
    const checkReady = await client.query(checkReadyQuery, [r_id]);
    const { r_p1Ready, r_p2Ready } = checkReady.rows[0];

    if (r_p1Ready && r_p2Ready) {
      if (countdowns.has(r_id)) {
        console.log(`Countdown for ${r_id} already running`);
        return;
      }

      let remaining = 4;
      const countdownInterval = setInterval(async () => {
        if (remaining-- > 1) {
          io.to(r_id).emit("countdown", { seconds: remaining });
        } else {
          clearInterval(countdownInterval);
          countdowns.delete(r_id);

          await StartGame(r_id);
          io.to(r_id).emit("started", { message: "Game started!" });
        }
      }, 1000);

      countdowns.set(r_id, { countdownInterval });
    }

  } catch (err) {
    console.error("CheckReadys Error:", err);
    socket.emit("ReadysError", { message: "CheckReadys failed" });
  }
}

async function CancleReady(r_id, p_num, u_name, is_join) {
  try {
    if (countdowns.has(r_id)) {
      const countdown = countdowns.get(r_id);
      clearInterval(countdown.countdownInterval);
      countdowns.delete(r_id);
      console.log(`Countdown for room ${r_id} canceled (player left).`);
      io.to(r_id).emit("cancleCountdown");
    }

    if (is_join) {
      const readyColumn = p_num === 1 ? "r_p1Ready" : "r_p2Ready";
      const playerColumn = p_num === 1 ? "r_player1" : "r_player2";
      const cancleReadyQuery = `
      update "Room"
      set "${readyColumn}" = false
      where "r_id" = $1
      and "${playerColumn}" = $2
      returning *;`;
      const result = await client.query(cancleReadyQuery, [r_id, u_name]);

      const playerQuery = `
      select *
      from "User"
      where "u_name" = $1;`;
      const player = await client.query(playerQuery, [u_name]);

      if (result.rows[0]) {
        io.to(r_id).emit("playerUpdate",
          {
            player: player.rows[0], p_num: p_num,
            is_join: is_join, is_ready: false
          });
      }
    }

  } catch (err) {
    console.error("CancleReady Error:", err);
    socket.emit("CancleError", { message: "CancleReady failed" });
  }
}

async function StartGame(r_id) {
  try {
    const roomQuery = `
      select "r_player1", "r_player2", "r_started", "r_isUndo"
      from "Room"
      where "r_id" = $1;`;
    const room = await client.query(roomQuery, [r_id]);
    const { r_player1, r_player2, r_started, r_isUndo } = room.rows[0];

    console.log("Start Room:", room.rows[0]);
    if (r_started === true) {
      console.log("Already started room.");
      return;
    }

    const startedQuery = `
      update "Room"
      set "r_started" = true
      where "r_id" = $1;`;
    await client.query(startedQuery, [r_id]);

    try {
      const createBoardQuery = `
        insert into "Board"("r_id", "b_player1", "b_player2", "b_isUndo")
        values($1, $2, $3, $4);`;
      await client.query(createBoardQuery, [r_id, r_player1, r_player2, r_isUndo]);
      console.log(`Board created for room ${r_id}`);

    } catch (err) {
      if (err.code === "23505") {
        console.log(`Board for ${r_id} already exists`);
      } else {
        throw err;
      }
    }

  } catch (err) {
    console.error("StartGame Error:", err);
  }
}

async function EndGame(r_id, leaveUser, leavePlayer) {
  try {
    const roomQuery = `
    update "Room"
    set "r_started" = false
    where "r_id" = $1
    and "r_started" = true
    and (("r_player1" is null
          or "r_player2" is null)
      or ("r_player1" = $2
            or "r_player2" = $2))
    returning *;`;
    const room = await client.query(roomQuery, [r_id, leaveUser]);

    if (room.rowCount === 0) {
      console.log("You can't end the room.");
      return false;
    }

    if (leavePlayer !== null) {
      const player1 = room.rows[0].r_player1;
      if (player1 !== leavePlayer) {
        UpdatePlayer(player1, true);
      }

      const player2 = room.rows[0].r_player2;
      if (player2 !== leavePlayer) {
        UpdatePlayer(player2, true);
      }
    }

    const deleteRoomQuery = `
    delete from "Board"
    where "r_id" = $1;`;
    await client.query(deleteRoomQuery, [r_id]);
    return true;

  } catch (err) {
    console.error("EndGame Error:", err);
    throw err;
  }
}

async function UpdatePlayer(u_name, isWin) {
  try {
    if (isWin) {
      const p1UpdateQuery = `
      update "User"
      set "u_win" = "u_win" + 1,
          "u_exp" = "u_exp" + 3
      where "u_name" = $1;`
      await client.query(p1UpdateQuery, [u_name]);
    }
    else {
      const p2UpdateQuery = `
      update "User"
      set "u_lose" = "u_lose" + 1,
          "u_exp" = "u_exp" + 1
      where "u_name" = $1;`
      await client.query(p2UpdateQuery, [u_name]);
    }
    CheckLevelup(u_name);
    ReloadRanking();

  } catch (err) {

  }
}

async function CheckLevelup(u_name) {
  try {
    const userQuery = `
    select "u_level", "u_exp"
    from "User"
    where "u_name" = $1;`
    const user = await client.query(userQuery, [u_name]);

    if (user.rowCount === 0) {
      console.log("Not found this user.");
      return;
    };

    const userData = user.rows[0];
    const exp = userData.u_exp - userData.u_level * 4

    if (exp >= 0) {
      const levelupQuery = `
      update "User"
      set "u_level" = "u_level" + 1,
          "u_exp" = $1
      where "u_name" = $2;`
      await client.query(levelupQuery, [exp, u_name]);
    }

  } catch (err) {
    console.error("CheckLevelup Error:", err);
    throw err;
  }
}

async function ReloadRanking() {
  try {
    const rankingQuery = `
    update "User" u
    set "u_ranking" = ranked.rank
    from (
      select
        u_id,
        dense_rank() over (
          order by u_win desc, u_lose asc, u_draw desc
        ) as rank
      from "User"
    ) ranked
    where u.u_id = ranked.u_id;`;
    await client.query(rankingQuery);

  } catch (err) {
    console.error("CheckRanking Error:", err);
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

    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, message: "This ID does not exist." });
    }

    const user = result.rows[0];
    if (user.u_password !== u_password) {
      return res.status(401).json({ success: false, message: "The password is different." });
    }

    if (user.u_logined === true) {
      return res.status(401).json({ success: false, message: "This user is already logged in." });
    }

    await client.query(`
    update "User" 
    set "u_logined" = true 
    where "u_id" = $1`, [u_id]);

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
    ("r_id", "r_name", "r_password",
     "r_isLocked", "r_players", "r_maxPlayers",
     "r_roomMaster", "r_turnTime", "r_isUndo")
    values($1, $2, $3, $4, $5, $6, $7, $8, $9) 
    returning *`;
    const values = [
      roomData.r_id, roomData.r_name, roomData.r_password, roomData.r_isLocked,
      roomData.r_players, roomData.r_maxPlayers, roomData.r_roomMaster,
      roomData.r_turnTime, roomData.r_isUndo];
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

app.post('/OutGame', async (req, res) => {
  const { r_id, token } = req.body;

  if (!r_id) return res.status(400).send('No r_id');

  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded;

    } catch (err) {
      res.status(401).json({ success: false, message: "Invalid token" });
    }
  }

  try {
    const u_name = req.user?.u_name;
    const result = await EndGame(r_id, u_name, u_name);
    if (result == true) io.to(r_id).emit("ended");
    res.status(200).send('ok');

  } catch {
    res.status(500).send('server error');
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

io.on("connection", async (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("refreshRoomList", async () => {
    await RefreshRoomList(socket);
  });

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
      where "u_name" = $1;`;
      const p1 = await client.query(p1Query, [roomData.r_player1]);

      const p2Query = `
      select *
      from "User"
      where "u_name" = $1;`;
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

      if (roomData.r_started) {
        socket.emit("started", { message: "Game started!" });
      }

      const chatQuery = `
      select "c_sender", "c_text", "c_created", "c_isEvent"
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
      const playerColumn = p_num === 1 ? "r_player1" : "r_player2";
      const enemyColumn = p_num !== 1 ? "r_player1" : "r_player2";
      const unReadyColumn = p_num === 1 ? "r_p1Ready" : "r_p2Ready";

      const playerJoinQuery = `
      update "Room"
      set "${playerColumn}" = $1,
           "${unReadyColumn}" = false
      where "r_id" = $2
      and "${playerColumn}" is null
      and ("${enemyColumn}" != $3 or "${enemyColumn}" is null)
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

      io.to(r_id).emit("playerUpdate",
        {
          player: player.rows[0], p_num: p_num,
          is_join: true, is_ready: false
        });

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
      const playerColumn = p_num === 1 ? "r_player1" : "r_player2";
      const playerLeaveQuery = `
      update "Room"
      set ${playerColumn} = null
      where "r_id" = $1
      and ${playerColumn} = $2
      returning *;`;
      const result = await client.query(playerLeaveQuery, [r_id, u_name]);

      if (result.rows[0]) {
        io.to(r_id).emit("playerUpdate",
          {
            player: null, p_num: p_num,
            is_join: false, is_ready: false
          });
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
      if (is_ready) {
        const isPlayingQuery = `
        select "b_isPlaying"
        from "Board"
        where "r_id" = $1;`;
        const isPlaying = await client.query(isPlayingQuery, [r_id]);

        if (isPlaying.rows[0]) {
          socket.emit("cantReady");
          return;
        }
      }

      const playerColumn = p_num === 1 ? "r_player1" : "r_player2";
      const readyColumn = p_num === 1 ? "r_p1Ready" : "r_p2Ready";

      const playerReadyQuery = `
      update "Room"
      set "${readyColumn}" = $1
      where "r_id" = $2
      and "${playerColumn}"  = $3
      returning *;`;
      const result = await client.query(playerReadyQuery,
        [is_ready, r_id, u_name]);


      if (result.rows[0]) {
        const playerQuery = `
        select *
        from "User"
        where "u_name" = $1;`;
        const player = await client.query(playerQuery, [u_name]);

        io.to(r_id).emit("playerUpdate",
          {
            player: player.rows[0], p_num: p_num,
            is_join: true, is_ready: is_ready
          });

        if (is_ready) CheckReadys(socket, r_id);
        else CancleReady(r_id, p_num, u_name, true);
      }

    } catch (err) {
      console.error("playerLeave Error:", err);
      socket.emit("playerError", { message: "playerLeave failed" });
    }
  });

  socket.on("sendMessage", async ({ r_id, message, isEvent }) => {
    const { u_name } = socket.data.datas;

    try {
      const insertQuery = `
      insert into "Chat" ("r_id", "c_sender", "c_text", "c_isEvent")
      values ($1, $2, $3, $4);`;
      await client.query(insertQuery,
        [r_id, u_name, message, isEvent]);

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
        c_isEvent: isEvent,
      });

      console.log("newMessage is", { u_name, message });

    } catch (err) {
      console.error("sendMessage error:", err);
      socket.emit("chatError", { message: "Failed send message" });
    }
  });

  socket.on("successStart", async ({ r_id }) => {
    try {
      const roomQuery = `
      select "r_player1", "r_player2"
      from "Room"
      where "r_id" = $1;`;
      const room = await client.query(roomQuery, [r_id]);
      const { r_player1, r_player2 } = room.rows[0];

      const zonesQuery = `
      select "b_zones", "b_turn", "b_isPlaying"
      from "Board"
      where "r_id" = $1;`
      const zones = await client.query(zonesQuery, [r_id]);
      const zonesData = zones.rows[0];

      socket.emit("makeBoard", {
        b_player1: r_player1, b_player2: r_player2,
        zonesState: zonesData.b_zones,
        turnState: zonesData.b_turn,
        b_isPlaying: zonesData.b_isPlaying
      });

    } catch (err) {
      console.error("successStart Error:", err);
    }
  });

  socket.on("selectZone", async ({ r_id, turn, index }) => {
    const { u_name } = socket.data.datas;

    try {
      const curPlayerColumn = turn % 2 === 0 ? "b_player1" : "b_player2";
      const checkZoneQuery = `
      select ("b_zones"::jsonb)-> ($1::int) as zone
      from "Board"
      where "r_id" = $2
      and ${curPlayerColumn} = $3;`;
      const result = await client.query(checkZoneQuery, [index, r_id, u_name]);

      if (result.rowCount === 0) {
        console.log("This is not the player.");
        return;
      }

      const zone = result.rows[0].zone;
      if (zone !== '') {
        console.log("already place zone!");
        return;
      }

      const playerColumn = turn % 2 === 0 ? '●' : '○';
      const zonesQuery = `
      update "Board"
      set "b_zones" = jsonb_set("b_zones", $1, $2::jsonb),
          "b_undoList" = "b_undoList" || to_jsonb($3::int),
          "b_turn" = $4
      where "r_id" = $5
      returning *;`;
      const values = [`{${index}}`, JSON.stringify(playerColumn), index, turn + 1, r_id];
      const zones = await client.query(zonesQuery, values);

      io.to(r_id).emit("placeZone", { b_zones: zones.rows[0].b_zones, index: index });

    } catch (err) {
      console.error("selectZone Error:", err);
      socket.emit("selectError", { message: "selectZone failed" });
    }
  });

  socket.on("endedGame", async ({ r_id, winner, loser }) => {
    const { u_name } = socket.data.datas;

    try {
      const endedQuery = `
      update "Board"
      set "b_isPlaying" = false
      where "r_id" = $1;`
      await client.query(endedQuery, [r_id]);

      if (u_name === winner) UpdatePlayer(winner, true);
      else UpdatePlayer(loser, false);

    } catch (err) {
      console.error("endedGame error:", err);
    }
  });

  socket.on("goRoom", async ({ r_id }) => {
    const { u_name } = socket.data.datas;

    try {
      const playersQuery = `
      select "r_player1", "r_player2"
      from "Room"
      where "r_id" = $1;`
      const players = await client.query(playersQuery, [r_id]);
      const p1 = players.rows[0].r_player1;
      const p2 = players.rows[0].r_player2;
      var b_pColumn = null;

      if (p1 === u_name) {
        b_pColumn = "b_player1";
        r_pColumn = "r_player1";
      }
      else if (p2 === u_name) {
        b_pColumn = "b_player2";
        r_pColumn = "r_player2";
      }

      if (b_pColumn !== null) {
        const leaveBoardrQuery = `
        update "Board"
        set ${b_pColumn} = null
        where "r_id" = $1
        and ${b_pColumn} = $2;`
        await client.query(leaveBoardrQuery, [r_id, u_name]);

        const playersQuery = `
        select "b_isPlaying"
        from "Board"
        where "r_id" = $1
        and "b_player1" is null
        and "b_player2" is null;`
        const players = await client.query(playersQuery, [r_id]);

        if (players.rowCount !== 0) {
          EndGame(r_id, u_name, null);
          io.to(r_id).emit("ended");
        }
      }

      socket.emit("ended");

    } catch (err) {

    }
  });

  socket.on("leaveRoom", async ({ r_id }) => {
    const { u_id, u_name } = socket.data.datas;

    try {
      LeaveRoomPlayer(r_id, u_id, u_name);
      socket.leave(r_id);

    } catch (err) {
      console.error("leaveRoom Error:", err);
    }
  });

  socket.on("disconnect", () => {
    if (socket.isTokenReload) {
      console.log("Reconnecting");
      return;
    }

    const { u_id, u_name } = socket.data.datas;

    setTimeout(async () => {
      const stillOnline = [...io.sockets.sockets.values()]
        .some(s => s.data?.datas?.u_id === u_id);

      if (!stillOnline) {
        const userQuery = `
        update "User"
        set "u_logined" = false
        where "u_id" = $1;`
        await client.query(userQuery, [u_id]);

        const userRoomQuery = `
        select "r_id"
        from "UserRoom"
        where "u_id" = $1;`;
        const userRoom = await client.query(userRoomQuery, [u_id]);
        if (userRoom.rows[0].r_id !== null) LeaveRoomPlayer(userRoom.rows[0].r_id, u_id, u_name);

        console.log(`${u_id} logouted`);
      }
    }, 1000);
  });
});

server.listen(5000, () => {
  console.log("Socket running on http://localhost:5000")
});