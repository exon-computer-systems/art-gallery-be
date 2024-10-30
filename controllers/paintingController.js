const { mongoose } = require("mongoose");
const Painting = require("../model/Painting");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// CREATE PAINTING z konwersją na WebM
const createPainting = async (req, res) => {
  const {
    firstName,
    lastName,
    title,
    age,
    city,
    country,
    school,
    technique,
    contest,
    year,
    award,
    image,
    filters,
  } = req.body;

  // Ensure the 'uploads' directory exists
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  let imagePath;
  if (image.startsWith("data:image")) {
    // Decode base64 string
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    imagePath = path.join(uploadsDir, `${Date.now()}.png`);
    fs.writeFileSync(imagePath, buffer);
  } else {
    return res.status(400).json({ message: "Invalid image format" });
  }

  try {
    const painting = await Painting.create({
      firstName,
      lastName,
      title,
      age,
      city,
      country,
      school,
      technique,
      contest,
      year,
      award,
      image: imagePath,
      filters,
    });
    res.status(201).json(painting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL PAINTINGS METHOD
const getAllPaintings = async (req, res) => {
  const paintings = await Painting.find();
  if (!paintings) {
    return res.status(204).json({ message: "Paintings not found" });
  }
  res.json(paintings);
};

// GET ONE PAINTING METHOD
const getPainting = async (req, res) => {
  if (!req.params?.pid) {
    return res.status(400).json({ message: "Painting ID required" });
  }
  try {
    const painting = await Painting.findOne({ pid: req.params.pid });
    if (!painting) {
      return res
        .status(404)
        .json({ message: `Painting ID ${req.params.pid} not found` });
    }
    res.json(painting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE PAINTINGS METHOD
const updatePainting = async (req, res) => {
  if (!req?.params.pid) {
    return res.status(400).json({ message: "Painting ID required" });
  }
  try {
    const updatedPainting = await Painting.findOneAndUpdate(
      { pid: req.params.pid },
      req.body,
      { new: true }
    );
    if (!updatedPainting) {
      return res.status(404).json({ message: "Painting not found" });
    }
    res.status(200).json(updatedPainting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELTETE PAINTINGS METHOD
const deletePainting = async (req, res) => {
  if (!req.params?.pid) {
    return res.status(400).json({ message: "Painting ID required" });
  }
  try {
    const painting = await Painting.findOneAndDelete({ pid: req.params.pid });
    if (!painting) {
      return res.status(404).json({ message: "Painting not found" });
    }
    res.status(200).json({ message: "Painting deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllPaintings,
  getPainting,
  createPainting,
  updatePainting,
  deletePainting,
};
