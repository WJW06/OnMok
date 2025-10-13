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
  // port: 5432, /* 집 */
  port: 5433, /* 회사 */
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

    console.log(`${u_id} logged in successfully`);
    res.json({ success: true, message: "Success Login!" });

  } catch (err) {
    console.error("Login DB Error: ", err);
    res.status(500).json({ success: false, message: "DB Error" });
  }
});

app.post("/Sign_up", async (req, res) => {
  const { u_id, u_password } = req.body;

  try {
    const query = `insert into "User"(u_id, u_password) values($1, $2) returning *`;
    const values = [u_id, u_password];
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