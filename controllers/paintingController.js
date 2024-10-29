const { mongoose } = require("mongoose");
const Painting = require("../model/Painting");

// GET ALL PAINTINGS
const getAllPaintings = async (req, res) => {
  const paintings = await Painting.find();
  if (!paintings) {
    return res.status(204).json({ message: "Paintings not found" });
  }
  res.json(paintings);
};

// GET ONE PAINTING
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

// CREATE PAINTING
const createPainting = async (req, res) => {
  try {
    const painting = await Painting.create(req.body);
    res.status(201).json(painting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE PAINTING
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

// DELETE PAINTING
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
