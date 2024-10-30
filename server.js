require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const cors = require("cors");

const mongoose = require("mongoose");
const connectDB = require("./config/dbConn");

const { startWebSocketServer } = require("./controllers/devicesController");

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

// connect to database
connectDB();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

// start websocket server
startWebSocketServer(server);

// access to public assets
app.use("/public", express.static(path.join(__dirname, "public")));

// routes
app.get("/", (req, res) => {
  res.send("Server is working");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use("/paintings", require("./routes/paintings"));
app.use("/devices", require("./routes/devices"));

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
