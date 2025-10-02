const express = require("express");
const { Client } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
  user: "Test_user",
  host: "127.0.0.1",
  database: "Test_db",
  password: "1234",
  port: 5433,
});

client.connect();
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

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

app.post("/Login", (req, res) => {
  const { u_id, u_pwd } = req.body;
  console.log("u_id: ", u_id, " u_pwd: ", u_pwd);
  res.json({ success: true, message: "Success Login!" });
});

app.post("/Sign_up", async (req, res) => {
  const { u_id, u_pwd } = req.body;

  try {
    const query = `insert into "User"(u_id, u_pwd) values($1, $2) returning *`;
    const values = [u_id, u_pwd];
    const result = await client.query(query, values);

    console.log("Inserted user: ", result.rows[0]);
    res.json({ success: true, message: "Success Sign up!", user: result.rows[0] });
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      res.json({ success: false, message: "ID already exists" });
    } else {
      res.status(500).json({ success: false, message: "DB Error" });
    }
  }
});