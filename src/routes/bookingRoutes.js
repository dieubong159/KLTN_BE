const express = require("express");
const mongoose = require("mongoose");

const Booking = mongoose.model("Booking");
const Route = mongoose.model("Route");

const router = express.Router();

router.get("/booking", async (req, res) => {
  const routes = await Booking.find();
  res.status(200).send(routes);
});

router.post("/booking", async (req, res, next) => {
  const booking = new Booking(req.body);
  console.log(booking);

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
