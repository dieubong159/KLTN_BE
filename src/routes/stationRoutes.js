const express = require("express");
const mongoose = require("mongoose");

const Station = mongoose.model("Station");

const router = express.Router();

router.get("/station", async (req, res) => {
    const station = await Station.find();
    res.status(200).send(station);
  });

module.exports = router;