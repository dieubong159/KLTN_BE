const express = require("express");
const mongoose = require("mongoose");
// const requireAuth = require("../middlewares/requireAuth");

const User = mongoose.model("User");
const Coupon = mongoose.model("Coupon");

const router = express.Router();

//router.use(requireAuth);

router.get("/user", async (req, res) => {
  const users = await User.find();
  res.send(users);
});

router.patch("/changePassword/:userId", async (req, res) => {
  const payload = req.body;
  const userId = req.params.userId;
  const isForgotPassword = payload.isForgotPassword;
  console.log(userId);
  console.log(payload);
  try {
    const user = await User.findById(userId);
    // console.log(user);
    if (user) {
      if (isForgotPassword) {
        user.password = payload.newPassword;
        user.save().then(() => {
          res
            .status(200)
            .json({ message: "Password has been changed successfully!" });
        });
      } else {
        try {
          await user.comparePassword(payload.password);
          user.password = payload.newPassword;
          user.save().then(() => {
            res
              .status(200)
              .json({ message: "Password has been changed successfully!" });
          });
        } catch (error) {
          console.log(error);
          return res
            .status(422)
            .send({ error: "Invalid password or phonenumber" });
        }
      }
    } else {
      res.status(422).json({ message: "No user found !" });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch("/user/edit/:userId", async (req, res) => {
  const payload = req.body.payload;
  const userId = req.params.userId;
  console.log(payload);
  // console.log(userId);
  try {
    const user = await User.findById(userId);
    // console.log(user);
    if (user) {
      for (let i in payload) {
        user[i] = payload[i];
        console.log(i);
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

router.post("/user/coupon", async (req, res) => {
  const payload = req.body;
  const user = await User.findById(payload.userId);
  const coupon = await Coupon.findById(payload.couponId);
  if (user && coupon) {
    const userCoupon = user.coupons.filter((e) => e._id === payload.couponId);
    if (userCoupon.length !== 0)
      return res.status(422).send({ message: "User already has this coupon" });
    else {
      User.findByIdAndUpdate(
        user._id,
        {
          $push: { coupons: coupon._id },
        },
        { upsert: false },
        function (err, doc) {
          if (err) return res.status(500).send({ error: err });
          res.status(200).send(doc);
        }
      );
    }
  } else {
    res.status(422).send({ message: "No user or coupon found" });
  }
});

router.get("/user/coupon/:userId", async (req, res) => {
  // console.log(req);
  const userId = req.params.userId;
  const user = await User.findById(userId).populate("coupons");
  if (user) {
    const coupons = user.coupons;
    if (coupons) {
      return res.status(200).send({ userCoupons: coupons });
    } else {
      return res.send({ message: "No coupons found!" });
    }
  }
});

// router.get("/agent/coupon/:agentId", async (req, res) => {
//   const agentId = req.params.agentId;
//   const agent = await Agent.findById(agentId).populate("coupons");
//   if (agent) {
//     const coupons = agent.coupons;
//     if (coupons) {
//       return res.status(200).send({ agentCoupons: coupons });
//     } else {
//       return res.send({ message: "No coupons found!" });
//     }
//   }
// });

module.exports = router;
