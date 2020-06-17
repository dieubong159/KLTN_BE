const express = require("express");
const mongoose = require("mongoose");

const Booking = mongoose.model("Booking");
const Route = mongoose.model("Route");
const RouteDeparture = mongoose.model("RouteDeparture");
const RouteSchedule = mongoose.model("RouteSchedule");
const Const = mongoose.model("Const");

const router = express.Router();

router.get("/booking", async (req, res) => {
  const routes = await Booking.find();
  res.status(200).send(routes);
});

router.post("/booking", async (req, res, next) => {
  const data = req.body;
  const booking = new Booking({
    routeuDeparture : data.routeuDeparture,
    seatNumber: data.seatNumber,
    price : data.price
  });

  if(!data.routeuDeparture){
    let departureDate = new Date(data.departureDate);
    let routeSchedule = RouteSchedule.findOne({route: data.route,dayOfWeek: departureDate.getDay()});
    const routeuDeparture = new RouteDeparture({
      route: data.route,
      routeSchedule:routeSchedule._id,
      departureDate : departureDate
    });
    routeuDeparture.save();
    booking.routeuDeparture = routeuDeparture._id;
  }

  var validroute = mongoose.Types.ObjectId.isValid(booking.route);

  if (validroute) {
    const routeExist = await RouteDeparture.exists({ _id: booking.routeuDeparture });
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
