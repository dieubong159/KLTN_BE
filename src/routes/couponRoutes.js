const express = require("express");
const mongoose = require("mongoose");

const Counpon = mongoose.model("Booking");
const CouponCode = mongoose.model("CouponCode");
const Payment = mongoose.model("Payment");
const Booking = mongoose.model("Booking");
const Const = mongoose.model("Const");


const router = express.Router();

router.get("/payment", async (req, res) => {
  const routes = await Payment.find();
  res.status(200).send(routes);
});

router.get("/payment/:payment_id",async (req, res) => {

});

router.post("/payment", async (req, res, next) => {
  var data = req.body;
  var payment = new Payment({
    booking : data.booking,
    price: data.price,
    pricePayment: data.pricePayment,
    counpon: data.counpon
  });

  var validbooking = mongoose.Types.ObjectId.isValid(payment.booking);

  if (validbooking) {
    const booking = await Booking.findById(payment.booking);
    if (!booking) {
      return res.status(500).json({
        error: "Booking not exist",
      });
    }

    var constSeats = await Const.findOne({type:"trang_thai_ghe", value: "da_dat"});
    booking.seatStatus = constSeats;
    booking.save();
  } else {
    return res.status(500).json({
      error: "Not a valid ID",
    });
  }

  payment
    .save()
    .then(() => {
      res.status(200).json({
        message: "Payment added successfully!",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

module.exports = router;