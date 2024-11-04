const express = require("express");
const ws = require("ws");
const Device = require("../model/Device");

const connectedDevices = [];

// Initialize devices with WebSocket connections if marked as connected in MongoDB
const initializeConnectedDevices = async () => {
  try {
    const devices = await Device.find();
    devices.forEach((device) => {
      connectedDevices.push({
        deviceId: device.deviceId,
        name: device.name,
        row: device.row,
        col: device.col,
        format: device.format,
        imagePath: device.imagePath,
        ws: null, // WebSocket will be assigned on connection
        connected: device.connected || false, // Store connection status
      });
    });
    console.log("Connected devices initialized from MongoDB.");
  } catch (error) {
    console.error("Error initializing connected devices:", error);
  }
};

// Call initializeConnectedDevices when the server starts
initializeConnectedDevices();

const getAllDevices = async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const sendMessage = async (req, res) => {
  const { deviceList, message } = req.body;

  if (connectedDevices.length === 0) {
    await initializeConnectedDevices();
  }

  const results = await Promise.all(
    deviceList.map(async (deviceId) => {
      let device = connectedDevices.find((d) => d.deviceId === deviceId);

      if (!device) {
        device = await Device.findOne({ deviceId });
        if (device) {
          connectedDevices.push({
            ...device.toObject(),
            ws: null,
          });
        }
      }

      if (device) {
        device.imagePath = message;

        if (device.ws) {
          device.ws.send(JSON.stringify({ type: "message", content: message }));
          console.log(`Message sent to device ${deviceId}`);
        } else {
          console.log(
            `Device ${deviceId} is not currently connected via WebSocket`
          );
        }

        await Device.updateOne({ deviceId }, { imagePath: message });

        return { deviceId, status: "Message sent" };
      } else {
        console.log(`Device ${deviceId} not found in MongoDB`);
        return { deviceId, error: "Device not found" };
      }
    })
  );

  res.json(results);
};

const startWebSocketServer = (server) => {
  const wss = new ws.Server({ server });

  wss.on("connection", (ws) => {
    console.log("Connection open");

    ws.on("message", async (data) => {
      const parsedData = JSON.parse(data);
      console.log("Received deviceId:", parsedData.deviceId);

      let device = connectedDevices.find(
        (d) => d.deviceId === parsedData.deviceId
      );

      if (!device) {
        device = await Device.findOne({ deviceId: parsedData.deviceId });

        if (!device) {
          try {
            device = new Device({
              deviceId: parsedData.deviceId,
              name: parsedData.name || "Unnamed Device",
              row: parsedData.row || 1,
              col: parsedData.col || 1,
              format: parsedData.format || "vertical",
              imagePath: parsedData.imagePath || "",
              connected: true,
            });
            await device.save();
            console.log(`New device ${parsedData.deviceId} added to MongoDB.`);
          } catch (error) {
            console.error("Error saving new device to MongoDB:", error);
          }
        }

        connectedDevices.push({ ...device.toObject(), ws });
        console.log(`Device ${device.deviceId} added and connected.`);
      } else {
        device.ws = ws;
        device.connected = true;
        await Device.updateOne(
          { deviceId: parsedData.deviceId },
          { connected: true }
        );
        console.log(`Device ${parsedData.deviceId} is already connected.`);
      }

      console.log("Total connected devices:", connectedDevices.length);
    });

    ws.on("close", async () => {
      console.log("Client disconnected");

      const index = connectedDevices.findIndex((device) => device.ws === ws);
      if (index !== -1) {
        const device = connectedDevices[index];
        device.connected = false;
        await Device.updateOne(
          { deviceId: device.deviceId },
          { connected: false }
        );
        console.log(
          `Device ${device.deviceId} disconnected and status updated.`
        );
        connectedDevices.splice(index, 1);
      }
    });

    ws.onerror = (error) => {
      console.log("WebSocket error:", error);
    };
  });
};

module.exports = { startWebSocketServer, getAllDevices, sendMessage };
