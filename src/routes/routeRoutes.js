const express = require("express");
const mongoose = require("mongoose");

const Route = mongoose.model("Route");

const router = express.Router();

router.get("/route", async (req, res) => {
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
    res.status(200).send(routes);
  } else {
    const routes = await Route.find();
    res.status(200).send(routes);
  }
});

router.get("/route/:route_id", async (req, res) => {
  Route.findById(req.params.route_id).then((result) => {
    result = result.toJSON();
    delete result.__v;
    res.status(200).send(result);
  });
});

router.post("/route", async (req, res) => {
  const newRoute = req.body;
  try {
    const route = new Route({
      vehicle: newRoute.vehicle,
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

router.patch("/route/:route_id", async (req, res) => {
  Route.findById(req.params.route_id, function (err, route) {
    if (err) {
      res.status(500).json({ error: err });
    }
    var routedata = req.body;
    delete routedata._id;
    for (let i in routedata) {
      route[i] = routedata[i];
    }
    route.save()
      .then(() => {
        res.status(200).json({
          message: "Location changed successfully!",
        });
      })
      .catch((error) => {
        res.status(500).json({
          error: error,
        });
      });
  });
});

module.exports = router;
