const express = require("express");
const mongoose = require("mongoose");

const Counpon = mongoose.model("Booking");
const CouponCode = mongoose.model("CouponCode");
const Payment = mongoose.model("Payment");

const router = express.Router();

router.get("/payment", async (req, res) => {
  const routes = await Payment.find();
  res.status(200).send(routes);
});

module.exports = router;