const { mongoose } = require("mongoose");
const Painting = require("../model/Painting");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
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

  const uploadsDir = path.join(process.cwd(), "/public/uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  let tempImagePath;
  if (image.startsWith("data:image")) {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    tempImagePath = path.join(uploadsDir, `${Date.now()}.png`);
    fs.writeFileSync(tempImagePath, buffer);
  } else {
    return res.status(400).json({ message: "Invalid image format" });
  }

  // Konwersja pliku do formatu .webp
  const webpPath = path.join(uploadsDir, `${Date.now()}.webp`);
  ffmpeg(tempImagePath)
    .output(webpPath)
    .on("end", async () => {
      fs.unlinkSync(tempImagePath); // Usuń plik tymczasowy

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
          image: path.basename(webpPath),
          filters,
        });

        res.status(201).json(painting);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    })
    .on("error", (err) => {
      res.status(500).json({ message: "Conversion error: " + err.message });
    })
    .run();
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

// GET FILTERED PAINTINGS
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
};

// {
//   "filters": {
//       "technique": "grafika komputerowa",
//       "contest": "Ogólnopolski Konkurs Grafiki",
//       "award": true,
//       "country": "Polska"
//   },
//   "_id": "6728ce92e018bd639c3db10f",
//   "firstName": "Michał",
//   "lastName": "Nowak",
//   "title": "Młody Grafik",
//   "age": 12,
//   "city": "Kraków",
//   "country": "Polska",
//   "school": "Szkoła Podstawowa nr 20",
//   "technique": "grafika komputerowa",
//   "contest": "Ogólnopolski Konkurs Grafiki",
//   "year": 2022,
//   "award": "Pierwsze miejsce",
//   "image": "1730727569847.webp",
//   "__v": 0
// },
