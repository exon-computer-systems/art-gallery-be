const { mongoose } = require("mongoose");
const Painting = require("../model/Painting");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const imageProcessing = sharp();

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
      pid,
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
        "./../public/original",
        originalName
      );

      // Zapis scalonego pliku na dysk
      fs.writeFileSync(filePath, fullImageBuffer);

      const toPathFilePath = path.join(
        __dirname,
        "./../public/uploads",
        originalName
      );
      const fromFilePath = path.join(
        __dirname,
        "./../public/original",
        originalName
      );

      fs.mkdirSync(path.dirname(toPathFilePath), { recursive: true });

      const toPath = fs.createWriteStream(fromFilePath);

      const readFile = fs.readFileSync(fromFilePath);

      sharp(readFile)
        .webp()
        .toFile(`${toPathFilePath.slice(0, -4)}.webp`, (err, info) => {
          if (err) {
            console.error("Sharp processing error:", err);
          } else {
            console.log("Image successfully converted to WebP:", info);
          }
        });

      delete fileChunks[originalName];

      // Tworzenie nowego dokumentu obrazu z nazwą pliku zamiast jego zawartości
      const painting = new Painting({
        firstName,
        lastName,
        title,
        age,
        city,
        country,
        pid,
        school,
        technique,
        contest,
        year,
        award,
        image: `${originalName.slice(0, -4)}.webp`,
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
  if (!req.params?.id) {
    return res.status(400).json({ message: "Painting ID required" });
  }
  try {
    const painting = await Painting.findOne({ _id: req.params.id });
    if (!painting) {
      return res
        .status(404)
        .json({ message: `Painting ID ${req.params.id} not found` });
    }
    res.json(painting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE PAINTINGS METHOD
const updatePainting = async (req, res) => {
  if (!req?.params.id) {
    return res.status(400).json({ message: "Painting ID required" });
  }

  try {
    const {
      firstName,
      lastName,
      title,
      age,
      city,
      country,
      pid,
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

    const fileChunk = req.file?.buffer; // Obsługa opcjonalnego pliku
    let updatedImageName;

    if (fileChunk) {
      if (!fileChunks[originalName]) {
        fileChunks[originalName] = [];
      }

      // Dodanie fragmentu do tablicy
      fileChunks[originalName][chunkNumber] = fileChunk;

      // Sprawdzenie, czy wszystkie fragmenty zostały odebrane
      if (parseInt(chunkNumber) === totalChunks - 1) {
        const fullImageBuffer = Buffer.concat(fileChunks[originalName]);

        const filePath = path.join(
          __dirname,
          "./../public/original",
          originalName
        );

        fs.writeFileSync(filePath, fullImageBuffer);

        const toPathFilePath = path.join(
          __dirname,
          "./../public/uploads",
          originalName
        );
        const fromFilePath = path.join(
          __dirname,
          "./../public/original",
          originalName
        );

        fs.mkdirSync(path.dirname(toPathFilePath), { recursive: true });

        const readFile = fs.readFileSync(fromFilePath);

        const webpFileName = `${originalName.slice(0, -4)}.webp`;
        updatedImageName = webpFileName;

        await sharp(readFile)
          .webp()
          .toFile(toPathFilePath.replace(/\.[^.]+$/, ".webp"));

        delete fileChunks[originalName];
      } else {
        return res.status(200).json({
          message: `Chunk ${parseInt(chunkNumber) + 1}/${totalChunks} received`,
        });
      }
    }

    const updatedData = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(title && { title }),
      ...(age && { age }),
      ...(city && { city }),
      ...(country && { country }),
      ...(pid && { pid }),
      ...(school && { school }),
      ...(technique && { technique }),
      ...(contest && { contest }),
      ...(year && { year }),
      ...(award && { award }),
      ...(filters && { filters: JSON.parse(filters) }),
      ...(updatedImageName && { image: updatedImageName }),
    };

    const updatedPainting = await Painting.findOneAndUpdate(
      { _id: req.params.id },
      updatedData,
      { new: true }
    );

    if (!updatedPainting) {
      return res.status(404).json({ message: "Painting not found" });
    }

    res.status(200).json(updatedPainting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELTETE PAINTINGS METHOD
const deletePainting = async (req, res) => {
  const getFileName = req.body.image;

  if (!getFileName) {
    console.error("getFileName is undefined or missing");
  } else {
    fs.unlinkSync(path.join(__dirname, `./../public/uploads/${getFileName}`));
    fs.unlinkSync(
      path.join(
        __dirname,
        `./../public/original/${getFileName.slice(0, -5)}.jpg`
      )
    );
    console.log(
      `Deleted: ${path.join(__dirname, `./../public/uploads/${getFileName}`)}`
    );
  }

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
    fullName,
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

  console.log(fullName);

  const [firstName, ...lastNameParts] = fullName.trim().split(" ");
  const lastName = lastNameParts.join(" ");

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
