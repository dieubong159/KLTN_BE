const express = require("express");
const mongoose = require("mongoose");

const User = mongoose.model("User");

const router = express.Router();

router.get("/users", async (req, res) => {
  const users = await User.find();

  res.send(users);
});
