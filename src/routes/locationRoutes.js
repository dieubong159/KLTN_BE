const express = require("express");
const mongoose = require("mongoose");

const Location = mongoose.model("Location");

const router = express.Router();

router.get("/locations", async (req, res) => {
  const routes = await Location.find();
  res.send(routes);
});

router.post("/locations", async (req, res) => {
  const { address, timestamp, coords } = req.body;
  console.log(req.body);

  if (!address) {
    return res.status(422).send({ error: "You must provide an address" });
  }

  try {
    const location = new Location({ address, timestamp, coords });
    await location.save();
    res.send(location);
  } catch (error) {
    res.status(422).send({ error: error.message });
  }
});

module.exports = router;
