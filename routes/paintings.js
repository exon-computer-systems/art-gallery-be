// routes/paintings.js
const express = require("express");
const router = express.Router();
const paintingController = require("../controllers/paintingController");

router
  .route("/")
  .get(paintingController.getAllPaintings)
  .post(paintingController.createPainting);

// router.route("/one/:id").get(paintingController.getPaintingById);

router
  .route("/:pid")
  .get(paintingController.getPainting)
  .put(paintingController.updatePainting)
  .delete(paintingController.deletePainting);

module.exports = router;
