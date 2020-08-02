const express = require("express");
const mongoose = require("mongoose");

const Coupon = mongoose.model("Coupon");
const Payment = mongoose.model("Payment");
const Booking = mongoose.model("Booking");
const Const = mongoose.model("Const");

const router = express.Router();

router.get("/payment", async (req, res) => {
  const routes = await Payment.find();
  res.status(200).send(routes);
});

router.get("/payment/:payment_id", async (req, res) => {});

router.post("/coupon", async (req, res) => {
  var payload = req.body;
  // console.log(payload);
  const coupons = await Coupon.find({ code: payload.code });
  // console.log(coupons);
  if (coupons.length !== 0) {
    return res.status(422).send({ message: "Code available" });
  } else {
    try {
      const newCoupon = new Coupon(payload);
      await newCoupon.save();
      return res.status(200).send({ message: "Saved!" });
    } catch (error) {
      return res.send(error);
    }
  }
});

router.get("/coupon", async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).send(coupons);
  } catch (error) {
    res.status(422).send(error);
  }
});

module.exports = router;
