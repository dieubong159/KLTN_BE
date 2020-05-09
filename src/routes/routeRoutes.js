const express = require("express");
const mongoose = require("mongoose");

const Route = mongoose.model("Route");

const router = express.Router();

router.get("/routes", async (req, res) => {
  // const routes = await Route.find();
  // res.status(200).send(routes);
  const params = req.params;
  console.log(params);
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
