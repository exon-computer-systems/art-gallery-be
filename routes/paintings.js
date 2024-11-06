const express = require("express");
const router = express.Router();
const {
  createPainting,
  getAllPaintings,
  getPainting,
  updatePainting,
  deletePainting,
  upload,
} = require("./../controllers/paintingController");

// Route to create a new painting
router.post("/", upload.single("image"), createPainting);
router.get("/", getAllPaintings);
router.get("/:pid", getPainting);
router.put("/:pid", updatePainting);
router.delete("/:pid", deletePainting);

module.exports = router;
