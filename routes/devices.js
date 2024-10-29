const express = require("express");
const router = express.Router();

const devicesController = require("../controllers/devicesController");

router.get("/", devicesController.getAllDevices);

router.post("/", devicesController.sendMessage);

module.exports = router;
