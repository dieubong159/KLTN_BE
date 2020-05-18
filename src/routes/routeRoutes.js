const express = require("express");
const mongoose = require("mongoose");

const Route = mongoose.model("Route");

const router = express.Router();

router.get("/routes", async (req, res) => {
  const params = req.query;
  console.log(params);
  const routes = await Route.find({
    startLocation: params.departureLocation,
    endLocation: params.arriveLocation,
    departureDate: params.departureDate,
  })
    .populate("startLocation")
    .populate("endLocation");
  if (routes.length !== 0) {
    console.log(routes);
    res.status(200).send(routes);
  } else {
    const routes = await Route.find();
    res.status(200).send(routes);
    // console.log(routes);
  }
});

router.post("/routes", async (req, res) => {
  const newRoute = req.body;
  try {
    const route = new Route({
      vehicle: newRoute.vehicleId,
      startTime: newRoute.startTime,
      endTime: newRoute.endTime,
      startLocation: newRoute.startLocation,
      endLocation: newRoute.endLocation,
      status: newRoute.status,
      price: newRoute.price,
      departureDate: newRoute.departureDate,
    });
    await route.save();
    res.status(200).send({ route: route });
  } catch (err) {
    console.log(err.message);
    res.status(422).send(err.message);
  }
});

module.exports = router;
