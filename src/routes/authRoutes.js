const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = mongoose.model("User");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { phonenumber, email, password } = req.body;

  try {
    const user = new User({ phonenumber, password, email });
    await user.save();

    const token = jwt.sign({ userId: user._id }, "KLTN-Booking");
    res.send({ token });
    console.log(token);
  } catch (err) {
    console.log(err);
    res.status(422).send(err.message);
  }
});

router.post("/signinWithCredential", async (req, res) => {
  const { email, name, id, photoUrl, address } = req.body.userInfo;
  // console.log(req.body.userInfo);

  const user = await User.findOne({ userAgent: id });

  if (!user || user === null) {
    try {
      const newUser = new User({
        email: email,
        fullname: name,
        avatar: photoUrl,
        userAgent: id,
      });
      await newUser.save();

      const token = jwt.sign({ userId: newUser._id }, "KLTN-Booking");
      console.log(token);
      res.send({ token });
    } catch (error) {
      res.status(422).send(error.message);
    }
  } else {
    const token = jwt.sign({ userId: user._id }, "KLTN-Booking");
    res.send({ token });
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
