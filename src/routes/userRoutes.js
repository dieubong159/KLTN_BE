const express = require("express");
const mongoose = require("mongoose");
// const requireAuth = require("../middlewares/requireAuth");

const User = mongoose.model("User");

const router = express.Router();

//router.use(requireAuth);

router.get("/user", async (req, res) => {
  const users = await User.find();
  res.send(users);
});

router.patch("/changePassword/:userId", async (req, res) => {
  const payload = req.body;
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    if (user) {
      for (let i in payload) {
        user[i] = payload[i];
      }
      user.save().then(() => {
        res
          .status(200)
          .json({ message: "Password has been changed successfully!" });
      });
    } else {
      res.status(422).json({ message: "No user found !" });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch("/user/edit/:userId", async (req, res) => {
  const payload = req.body;
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    if (user) {
      for (let i in payload) {
        user[i] = payload[i];
      }
      user.save().then(() => {
        res
          .status(200)
          .json({ message: "Information has been changed successfully!" });
      });
    } else {
      res.status(422).json({ message: "No user found!" });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
