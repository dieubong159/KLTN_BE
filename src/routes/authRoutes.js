const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = mongoose.model("User");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { phonenumber, password } = req.body;

  try {
    const user = new User({ phonenumber, password });
    await user.save();

    const token = jwt.sign({ userId: user._id }, "KLTN-Booking");
    res.send({ token });
  } catch (err) {
    res.status(422).send(err.message);
  }
});

router.post("/signin", async (req, res) => {
  const { phonenumber, password } = req.body;

  if (!phonenumber || !password) {
    return res
      .status(422)
      .send({ error: "Must provide phonenumber and password" });
  }

  const user = await User.findOne({ phonenumber });
  if (!user) {
    return res.status(422).send({ error: "Invalid password or phonenumber" });
  }

  try {
    await user.comparePassword(password);
    const token = jwt.sign({ userId: user._id }, "KLTN-Booking");
    res.send({ token });
  } catch (err) {
    return res.status(422).send({ error: "Invalid password or phonenumber" });
  }
});

module.exports = router;
