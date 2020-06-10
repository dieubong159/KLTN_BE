const express = require("express");
const mongoose = require("mongoose");

const Route = mongoose.model("Route");

const router = express.Router();

router.get("/route/query", async (req, res) => {
  const payload = req.query;
  const date = new Date(payload.departureDate.substring(0, 10) + " 00:00");
  date.setDate(date.getDate() + 1);
  console.log(date.toISOString());
  const routes = await Route.find({
    startLocation: payload.startLocation,
    endLocation: payload.endLocation,
    departureDate: date.toISOString(),
  })
    .populate("startLocation")
    .populate("endLocation")
    .populate("vehicle")
    .populate("status");
  if (routes) {
    console.log(routes.length);
    res.status(200).send(routes);
  }
});

router.get("/route", async (req, res) => {
  const routes = await Route.find()
    .populate("startLocation")
    .populate("endLocation")
    .populate("status")
    .populate({
      path: "status",
      model: "Const",
      populate: {
        path: "agent",
      },
    })
    .populate({
      path: "vehicle",
      model: "Vehicle",
      populate: {
        path: "startLocation endLocation agent",
      },
    });
  // console.log(routes);
  res.status(200).send(routes);
});

router.get("/route/:route_id", async (req, res) => {
  Route.findById(req.params.route_id)
    .populate("startLocation")
    .populate("endLocation")
    .populate({
      path: "vehicle",
      model: "Vehicle",
      populate: {
        path: "startLocation endLocation agent",
      },
    })
    .then((result) => {
      result = result.toJSON();
      delete result.__v;
      res.status(200).send(result);
    });

  //res.status(200).send(route);
  // Route.findById(req.params.route_id).then((result) => {
  //   result = result.toJSON();
  //   delete result.__v;
  //   res.status(200).send(result);
  // });
});

router.post("/route", async (req, res) => {
  const newRoute = req.body;
  console.log(newRoute);
  try {
    const route = new Route({
      vehicle: newRoute.vehicle,
      startTime: newRoute.startTime,
      endTime: newRoute.endTime,
      startLocation: newRoute.startLocation,
      endLocation: newRoute.endLocation,
      status: newRoute.status,
      price: newRoute.price,
      departureDate: new Date(newRoute.departureDate),
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
    route
      .save()
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
