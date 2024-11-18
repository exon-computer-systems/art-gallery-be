const express = require("express");
const router = express.Router();
const {
  createPainting,
  getAllPaintings,
  getPainting,
  updatePainting,
  deletePainting,
  getFilteredPainting,
  upload,
} = require("./../controllers/paintingController");

// Route to create a new painting
router.post("/", upload.single("image"), createPainting);
router.get("/", getAllPaintings);
router.get("/:id", getPainting);
router.put("/:id", upload.single("image"), updatePainting);

router.delete("/:pid", deletePainting);

router.route("/filter").post(getFilteredPainting);

module.exports = router;
