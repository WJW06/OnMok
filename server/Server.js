const express = require("express");
const { Client } = require("pg");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
// const SECRET_KEY = "abcdefg";

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  console.error("ERROR: SECRET_KEY is not set. Set it in .env or environment variables.");
  process.exit(1);
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

app.get("/Ground", async (req, res) => {
  try {
    const result = await client.query("SELECT NOW()");
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
      { u_name: user.u_name, r_name: null },
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
      res.json({ success: false, message: "This ID already exists." });
    } else {
      res.status(500).json({ success: false, message: "DB Error" });
    }

    console.error("Sign DB Error: ", err);
  }
});

app.post("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
});


const rooms = new Map();

app.post("/JoinRoom", (req, res) => {
  const { r_id, token, r_name } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: "No token provided" });
  }
  if (!r_id || !r_name) {
    return res.status(400).json({ success: false, message: "No room provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    console.log(`${decoded.u_name} joined room "${r_name}"`);
    rooms.set(r_id, { r_name, users: [decoded.u_name], state: {} });

    const { exp, iat, ...rest } = decoded;
    const newToken = jwt.sign(
      { ...rest, r_name },
      SECRET_KEY,
      { expiresIn: "30min" }
    );
    return res.json({ success: true, r_id, token: newToken });
  } catch (err) {
    console.error("JoinRoom Error:", err);
    res.status(401).json({ success: false, message: "Invalid token" });
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

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ r_id, token }) => {

    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      const { u_name, r_name } = decoded;

      socket.join(r_id);
      if (!rooms.has(r_id)) {
        rooms.set(r_id, { users: [u_name], r_name });
        console.log(`Created room: ${r_name} (${r_id}) by ${u_name}`);
      } else {
        const room = rooms.get(r_id);
        if (!room.users.includes(u_name)) room.users.push(u_name);
        console.log(`${u_name} joined room ${room.r_name} (${r_id})`);
      }

      const room = rooms.get(r_id);
      io.to(r_id).emit("roomUpdate", { u_name, r_name, users: room.users });
    } catch (err) {
      console.error("Invalid token:", err);
      socket.emit("authError", { message: "Invalid token" });
    }
  });

  socket.on("leaveRoom", ({ r_id, token }) => {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      const { u_name } = decoded.u_name;

      socket.leave(r_id);
      const room = rooms.get(r_id);
      if (room) {
        room.users = room.users.filter((u) => u !== u_name);
        io.to(r_id).emit("roomUpdate", { u_name, users: room.users });
        console.log(`${u_name} left room ${r_id}`);
      }
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