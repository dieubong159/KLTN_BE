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

router.post("/confirmPayment", async (req, res) => {
  var data = req.body;

  var coupon;
  var discountRate = 0;
  if (!data.coupon) {
    coupon = null;
  } else {
    var coupons = await Coupon.find().populate("code");
    var couponCheck = coupons.find((e) => e._id.toString() == data.coupon);
    if (!couponCheck) {
      coupon = null;
    } else {
      coupon = couponCheck;
      discountRate = couponCheck.discountRate;
    }
  }

  var bookings = await Booking.find();
  bookings = bookings.filter((e) => e.bookingCode == data.bookingCode);

  if (!bookings) {
    return res.status(404).json({
      error: "Not a valid bookingCode",
    });
  }
  try {
    for (let booking of bookings) {
      let pricePayment = booking.price * ((100 - discountRate) / 100);
      var payment = new Payment({
        booking: booking,
        price: booking.price,
        pricePayment: pricePayment,
        coupon: coupon,
      });

      var constSeats = await Const.findOne({
        type: "trang_thai_ghe",
        value: "da_dat",
      });
      booking.seatStatus = constSeats;
      booking.save();

      payment.save();
    }
    res.status(200).json({
      message: "Payment added successfully!",
    });
  } catch (error) {
    res.send(error);
  }
});

router.post("/coupon", async (req, res) => {
  var payload = req.body;
  console.log(payload);
  const coupons = await Coupon.find({ code: payload.code });
  console.log(coupons);
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
