const { mongoose } = require("mongoose");
const Painting = require("../model/Painting");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const { imageToWebp } = require("image-to-webp");

// CREATE PAINTING z konwersją na WebP

const { Buffer } = require("buffer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Globalny obiekt do przechowywania fragmentów plików (w produkcji zaleca się użycie Redis lub bazy danych)
const fileChunks = {};

const createPainting = async (req, res) => {
  try {
    // Wyciągnięcie danych z `req.body`
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
      filters,
      chunkNumber,
      totalChunks,
      originalName,
    } = req.body;

    // Przechowywanie fragmentu obrazu z multer
    const fileChunk = req.file.buffer;

    // Inicjalizacja tablicy do przechowywania fragmentów, jeśli jeszcze nie istnieje dla danego obrazu
    if (!fileChunks[originalName]) {
      fileChunks[originalName] = [];
    }

    // Dodanie fragmentu do tablicy
    fileChunks[originalName][chunkNumber] = fileChunk;

    // Sprawdzenie, czy wszystkie fragmenty zostały odebrane
    if (parseInt(chunkNumber) === totalChunks - 1) {
      // Złożenie pełnego obrazu z fragmentów
      const fullImageBuffer = Buffer.concat(fileChunks[originalName]);

      // Ścieżka do zapisu scalonego pliku
      const filePath = path.join(
        __dirname,
        "./../public/uploads",
        originalName
      );

      // Zapis scalonego pliku na dysk
      fs.writeFileSync(filePath, fullImageBuffer);

      // console.log("fullImageBuffer: ", filePath);

      // const readFile = fs.readFileSync(`./public/uploads/${originalName}`);

      // const imgToWebP = fullImageBuffer;
      // const outputFilePath = await imageToWebp(fullImageBuffer, 90);
      // fs.copyFileSync(
      //   webpImage,
      //   `${__dirname}/./../public/uplaods/${originalName.slice(0, -4)}.webp`
      // );

      // Usunięcie danych fragmentów po złożeniu pełnego obrazu
      delete fileChunks[originalName];

      // Tworzenie nowego dokumentu obrazu z nazwą pliku zamiast jego zawartości
      const painting = new Painting({
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
        image: originalName, // zapisujemy tylko nazwę pliku
        filters: JSON.parse(filters),
      });

      // Zapis dokumentu w bazie danych
      await painting.save();

      res
        .status(201)
        .json({ message: "Painting created successfully", painting });
    } else {
      // Odpowiedź o poprawnym przesłaniu fragmentu
      res.status(200).json({
        message: `Chunk ${parseInt(chunkNumber) + 1}/${totalChunks} received`,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to create painting", error: error.message });
  }
};

// Konfiguracja multer do przechowywania w pamięci (bez zapisu na dysku)
// const storage = multer.memoryStorage();
// const upload = multer({ storage });
// Globalny obiekt do przechowywania fragmentów plików (w produkcji zaleca się użycie Redis lub bazy danych)
// const fileChunks = {};

// const createPainting = async (req, res) => {
//   try {
//     // Wyciągnięcie danych z `req.body`
//     const {
//       firstName,
//       lastName,
//       title,
//       age,
//       city,
//       country,
//       school,
//       technique,
//       contest,
//       year,
//       award,
//       filters,
//       chunkNumber,
//       totalChunks,
//       originalName,
//     } = req.body;

//     // Przechowywanie fragmentu obrazu z multer
//     const fileChunk = req.file.buffer;

//     // Inicjalizacja tablicy do przechowywania fragmentów, jeśli jeszcze nie istnieje dla danego obrazu
//     if (!fileChunks[originalName]) {
//       fileChunks[originalName] = [];
//     }

//     // Dodanie fragmentu do tablicy
//     fileChunks[originalName][chunkNumber] = fileChunk;

//     // Sprawdzenie, czy wszystkie fragmenty zostały odebrane
//     if (parseInt(chunkNumber) === totalChunks - 1) {
//       // Złożenie pełnego obrazu z fragmentów
//       const fullImageBuffer = Buffer.concat(fileChunks[originalName]);

//       // Konwersja obrazu na Base64
//       const base64Image = fullImageBuffer.toString("base64");

//       // Usunięcie danych fragmentów po złożeniu pełnego obrazu
//       delete fileChunks[originalName];

//       // Tworzenie nowego dokumentu obrazu
//       const painting = new Painting({
//         firstName,
//         lastName,
//         title,
//         age,
//         city,
//         country,
//         school,
//         technique,
//         contest,
//         year,
//         award,
//         image: originalName,
//         filters: JSON.parse(filters),
//       });

//       // Zapis dokumentu w bazie danych
//       await painting.save();

//       res
//         .status(201)
//         .json({ message: "Painting created successfully", painting });
//     } else {
//       // Odpowiedź o poprawnym przesłaniu fragmentu
//       res.status(200).json({
//         message: `Chunk ${parseInt(chunkNumber) + 1}/${totalChunks} received`,
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Failed to create painting", error: error.message });
//   }
// };

// // GET ALL PAINTINGS METHOD
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

const getFilteredPainting = async (req, res) => {
  const {
    firstName,
    lastName,
    title,
    minAge,
    maxAge,
    city,
    school,
    minYear,
    maxYear,
    technique,
    contest,
    award,
    country,
  } = req.body;

  const filter = {
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(title && { title }),
    // min max age
    ...(minAge &&
      maxAge && { age: { $gte: Number(minAge), $lte: Number(maxAge) } }),
    // city school
    ...(city && { city }),
    ...(school && { school }),
    // min max year
    ...(minYear &&
      maxYear && { year: { $gte: Number(minYear), $lte: Number(maxYear) } }),
    // filters
    ...(technique && { "filters.technique": technique }),
    ...(contest && { "filters.contest": contest }),
    ...(award && { "filters.award": award }),
    ...(country && { "filters.country": country }),
  };

  try {
    const paintings = await Painting.find(filter);
    res.json(paintings);
  } catch (err) {
    console.log(err);
    res.json(err);
  }
};

module.exports = {
  getAllPaintings,
  getPainting,
  createPainting,
  updatePainting,
  deletePainting,
  getFilteredPainting,
  upload,
};
