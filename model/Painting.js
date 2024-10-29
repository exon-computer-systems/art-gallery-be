const mongoose = require("mongoose");

const paintingSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  pid: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
    min: 0,
  },
  year: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  technique: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
});

const Painting = mongoose.model("Painting", paintingSchema);

module.exports = Painting;
