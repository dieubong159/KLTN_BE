const express = require("express");
const mongoose = require("mongoose");

const Booking = mongoose.model("Booking");
const Route = mongoose.model("Route");
const Const = mongoose.model("Const");

const router = express.Router();

router.get("/booking", async (req, res) => {
  const routes = await Booking.find();
  res.status(200).send(routes);
});

router.post("/booking", async (req, res, next) => {
  const booking = new Booking(req.body);

  var validroute = mongoose.Types.ObjectId.isValid(booking.route);

  if (validroute) {
    const routeExist = await Route.exists({ _id: booking.route });
    if (!routeExist) {
      return res.status(500).json({
        error: "Route not exist",
      });
    }
  } else {
    return res.status(500).json({
      error: "Not a valid ID",
    });
  }

  var constSeats = await Const.findOne({type:"trang_thai_ghe", value: "giu_cho"});
  var constBooking = await Const.findOne({type:"trang_thai_dat_cho", value: "cho"});

  booking.seatStatus = constSeats;
  booking.status = constBooking;

  console.log(booking);
  booking
    .save()
    .then(() => {
      res.status(200).json({
        message: "Booking added successfully!",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

module.exports = router;
