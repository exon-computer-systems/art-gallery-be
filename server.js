require("dotenv").config();
const http = require("http");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConn");

const app = express();
app.use(express.json());

const PORT = 7777;

connectDB();

app.get("/", (req, res) => {
  res.send("Server is working");
});

app.use("/paintings", require("./routes/paintings"));

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
