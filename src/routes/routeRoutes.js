const express = require("express");
const mongoose = require("mongoose");

const Route = mongoose.model("Route");
const RouteDetail = mongoose.model("RouteDetail");
const RouteSchedule = mongoose.model("RouteSchedule");
const RouteuDeparture = mongoose.model("RouteuDeparture");
const Vehicle = mongoose.model("Vehicle");


const router = express.Router();

router.get("/route", async (req, res) => {
  const params = req.query;
  const routes = await Route.find({
    startLocation: params.departureLocation,
    endLocation: params.arriveLocation,
    departureDate: params.departureDate,
  })
    .populate("startLocation")
    .populate("endLocation")
    .populate("vehicle")
    .populate("status");
  if (routes.length !== 0) {
    res.status(200).send(routes);
  } else {
    const routes = await Route.find()
      .populate("startLocation")
      .populate("endLocation")
      .populate("startProvince")
      .populate("endProvince")
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
          path: "startLocation endLocation startProvince endProvince agent type",
        },
      });
    res.status(200).send(routes);
  }
});

router.get("/route/:route_id", async (req, res) => {
  Route.findById(req.params.route_id)
    .populate("startLocation")
    .populate("endLocation")
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
        path: "startLocation endLocation agent type",
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

router.post("/route/addRouteDetailAndRouteSchedule",async (req, res) => {
  const data = req.body;
  console.log(data);
  const vehicle = await Vehicle.findById(data.vehicleId);
  if(!vehicle){
    return res.status(404);
  }
  const route = new Route({
    vehicle: vehicle._id,
    startTime: data.startTime,
    endTime: data.endTime,
    startLocation: vehicle.startLocation,
    startProvince: vehicle.startProvince,
    endLocation: vehicle.endLocation,
    endProvince: vehicle.endProvince,
    price: data.price,
    isCorrectRoute : data.isCorrectRoute
  });

  await route.save();

  let length = data.stationId.length;
  for(let i = 0;i<length;i++){
    const routeDetail = new RouteDetail({
      route: route._id,
      station : data.stationId[i],
      timeArrivingToStation: data.stationTime[i],
      distanceToStation : data.stationDistance[i],
      orderRouteToStation : data.orderStation[i]
    });
    await routeDetail.save();
  }

  let lenghtDay = data.day.length;
  for(let i = 0;i<lenghtDay;i++){
    const routeSchedule = new RouteSchedule({
      route : route._id,
      dayOfWeek: data.day[i]
    });
    await routeSchedule.save();
  }

  return res.status(200).json({
    message: "Data save changed successfully!",
  });

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
