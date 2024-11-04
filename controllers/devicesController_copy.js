const express = require("express");
const ws = require("ws");
const url = require("url");
const { format } = require("path");

const connectedDevices = [];

const getAllDevices = (req, res) => {
  // res.json(connectedDevices.map((device) => device.deviceId));
  console.log(connectedDevices);
  res.json(
    connectedDevices.map((device) => ({
      deviceId: device.deviceId,
      name: device.name,
      row: device.row,
      col: device.col,
      format: device.format,
      imagePath: device.imagePath,
    }))
  );
};

// const sendMessage = (req, res) => {
//   const { deviceList, message } = req.body;
//   console.log("Sending message to", deviceId);

//   deviceList.map((el) => {
//     const device = connectedDevices.find(
//       (device) => device.deviceId === deviceId
//     );

//     if (device) {
//       device.ws.send(JSON.stringify({ type: "message", content: message }));
//       console.log(`Message sent to device ${deviceId}`);
//       res.json({ status: "Message sent" });
//     } else {
//       console.log(`Device ${deviceId} not found`);
//       res.status(404).json({ error: "Device not found" });
//     }
//   });
// };

const sendMessage = (req, res) => {
  const { deviceList, message } = req.body;
  console.log("Sending message to devices:", deviceList);

  const results = deviceList.map((deviceId) => {
    const device = connectedDevices.find(
      (device) => device.deviceId === deviceId
    );

    if (device) {
      device.imagePath = message;
      device.ws.send(JSON.stringify({ type: "message", content: message }));
      console.log(`Message sent to device ${deviceId}`);
      return { deviceId, status: "Message sent" };
    } else {
      console.log(`Device ${deviceId} not found`);
      return { deviceId, error: "Device not found" };
    }
  });

  res.json(results);
};

const startWebSocketServer = (server) => {
  const wss = new ws.Server({ server });

  wss.on("connection", (ws) => {
    console.log("Connection open");

    ws.on("message", (data) => {
      const parsedData = JSON.parse(data);
      console.log("Received deviceId:", parsedData.deviceId);

      const existingDevice = connectedDevices.find(
        (device) => device.deviceId === parsedData.deviceId
      );
      if (!existingDevice) {
        connectedDevices.push({ ...parsedData, ws });
        console.log(`Device ${parsedData.deviceId} added`);
      } else {
        console.log(`Device ${parsedData.deviceId} is already connected`);
      }

      console.log("Total connected devices:", connectedDevices.length);
    });

    ws.on("close", () => {
      console.log("Client disconnected");

      const index = connectedDevices.findIndex((device) => device.ws === ws);
      if (index !== -1) {
        console.log(`Device ${connectedDevices[index].deviceId} removed`);
        connectedDevices.splice(index, 1);
      }
    });

    ws.onerror = (error) => {
      console.log("WebSocket error:", error);
    };
  });
};

module.exports = { startWebSocketServer, getAllDevices, sendMessage };
