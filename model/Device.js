const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
  deviceId: String,
  name: String,
  row: Number,
  col: Number,
  format: String,
  imagePath: String,
});

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;
