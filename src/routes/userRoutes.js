const express = require("express");
const mongoose = require("mongoose");

const User = mongoose.model("User");

const router = express.Router();

router.get("/users", async (req, res) => {
  const users = await User.find();

  res.send(users);
});

router.post("/changePassword", async (req, res) => {
  const payload = req.body;
  const newPassword = payload.newPassword;
  const userId = payload.userId;

  try {
    const user = await User.findOne({ _id: userId });
    if (user) {
    }
  } catch (error) {
    res.status(422).send({ message: "No user found!" });
  }
});

module.exports = router;
