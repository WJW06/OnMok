const express = require("express");
const { Client } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
  user: "Test",
  host: "127.0.0.1",
  database: "postgres",
  password: "1234",
  port: 5432,
});

client.connect();

app.get("/", async (req, res) => {
  try {
    console.log("Enter Login page");
  } catch (err){
    console.error(err);
    res.status(404).send("Not Found");
  }
});

app.get("/Login", async (req, res) => {
  try {
    console.log("Enter Login page");
  } catch (err){
    console.error(err);
    res.status(404).send("Not Found");
  }
});

app.get("/Sign", async (req, res) => {
  try {
    console.log("Enter Sign page");
  } catch (err){
    console.error(err);
    res.status(404).send("Not Found");
  }
});

app.get("/Ground", async (req, res) => {
  try {
    const result = await client.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});