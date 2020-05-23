const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = mongoose.model("User");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const signupInformation = req.body;
  console.log(signupInformation);
  try {
    const user = new User({
      phoneNumber: signupInformation.phoneNumber,
      password: signupInformation.password,
      email: signupInformation.email,
      fullName: signupInformation.fullName,
      userAgent: signupInformation.userAgent,
      avatar: signupInformation.avatar,
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, "KLTN-Booking", {
      expiresIn: "24h",
    });
    res.send({ token });
  } catch (err) {
    console.log(err.message);
    res.status(422).send(err.message);
  }
});

router.get("/oauth/:user_agent", async (req, res) => {
  const oauthId = req.params.user_agent;
  // console.log(oauthId);
  const user = await User.findOne({ userAgent: oauthId });
  // console.log(user);
  if (!user || user === null) {
    res.status(422).send({ message: "This user is unregistered" });
  } else {
    const token = jwt.sign({ userId: user._id }, "KLTN-Booking");
    res.send({ token });
    console.log(token);
  }
});

router.post("/signin", async (req, res) => {
  const { phoneNumber, password } = req.body.params;
  if (!phoneNumber || !password) {
    return res
      .status(422)
      .send({ error: "Must provide phonenumber and password" });
  }

  const user = await User.findOne({ phoneNumber: phoneNumber });
  if (!user) {
    return res.status(422).send({ error: "Invalid password or phoneNumber" });
  }

  try {
    await user.comparePassword(password);
    const token = jwt.sign({ userId: user._id }, "KLTN-Booking");
    res.send({ token });
  } catch (err) {
    return res.status(422).send({ error: "Invalid password or phonenumber" });
  }
});

router.get("/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findOne({
      _id: userId,
    });
    if (user) {
      res.send({ user });
    } else {
      return res.status(422).send({ error: "Invalid user ID" });
    }
  } catch (err) {
    console.log(err.message);
    return res.status(422).send({ error: "Invalid user ID" });
  }
});

router.post("/verifyToken", (req, res) => {
  const token = req.body.token;
  try {
    const decoded = jwt.verify(token, "KLTN-Booking");
    res.send(decoded);
  } catch (error) {
    console.log(error);
    return res.status(422).send({ error: "Invalid Token" });
  }
});

module.exports = router;
