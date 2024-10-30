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
  title: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
    min: 0,
  },
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  school: {
    type: String,
    required: true,
  },
  technique: {
    type: String,
    required: true,
  },
  contest: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  award: {
    type: String,
    required: false,
    default: null,
  },
  image: {
    type: String,
    required: true,
  },
  filters: {
    technique: {
      type: String,
      required: true,
    },
    contest: {
      type: String,
      required: true,
    },
    award: {
      type: Boolean,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  },
});

const Painting = mongoose.model("Painting", paintingSchema);

module.exports = Painting;
