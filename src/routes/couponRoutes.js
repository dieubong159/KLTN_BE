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

router.post("/adminpayment", async (req, res) => {
  var data = req.body;

  var counpon;
  var discountRate = 0;
  if(!data.counpon){
    counpon = null;
  }
  else{
    var counpons = await Counpon.find().populate("code");
    var counponCheck = counpons.find(e=>e._id.toString()== data.counpon);
    if(!counponCheck){
      counpon = null;
    }
    else{
      counpon = counponCheck;
      discountRate = counponCheck.discountRate;
    }
  }

  var bookings = await Booking.find();
  bookings = bookings.filter(e=>e.bookingCode = data.bookingCode);

  if(!bookings){
    return res.status(404).json({
      error: "Not a valid bookingCode",
    });
  }

  for(let booking of bookings){
    let pricePayment = booking.price * ((100-discountRate)/100);
    var payment = new Payment({
      booking : booking,
      price: booking.price,
      pricePayment: pricePayment,
      counpon: counpon
    });
  
    var constSeats = await Const.findOne({type:"trang_thai_ghe", value: "da_dat"});
    booking.seatStatus = constSeats;
    booking.save();
     
    payment.save();
  }
  res.status(200).json({
    message: "Payment added successfully!",
  });
});

router.post("/removeTicket/:bookingcode",async (req,res)=>{
  var bookings = await Booking.find();
  bookings = bookings.filter(e=>e.bookingCode = req.params.bookingCode);

  if(!bookings){
    return res.status(404).json({
      error: "Not a valid bookingCode",
    });
  }
  var statusBookingRemove = await Const.findOne({type:"trang_thai_dat_cho", value: "da_huy"});

  for(let booking of bookings){
    booking.status = statusBookingRemove;
    booking.save();
  }
  res.status(200).json({
    message: "Booking remove successfully!",
  });
});

module.exports = router;