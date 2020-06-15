const express = require("express");
const mongoose = require("mongoose");
const moment = require('moment');
const { route } = require("./vehicleRoutes");

const Route = mongoose.model("Route");
const RouteDetail = mongoose.model("RouteDetail");
const RouteSchedule = mongoose.model("RouteSchedule");
const RouteuDeparture = mongoose.model("RouteuDeparture");
const Vehicle = mongoose.model("Vehicle");
const Station = mongoose.model("Station");
const Agent = mongoose.model("Agent");

const router = express.Router();

var groupBy = function(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

var byOrder = (a, b) => {
  if (a.orderRouteToStation > b.orderRouteToStation) return 1;
  if (a.orderRouteToStation < b.orderRouteToStation) return -1;
  return 0;
};

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

router.get('/find-routes', async (req, resp) => {
  const params = req.query;
  const routeData = {
    startLocation: params.departureLocation,
    endLocation: params.arriveLocation,
    departureDate: params.departureDate,
  };

  let allRouteDetails = await RouteDetail.find().populate('station');
  let allAgents = await Agent.find();
  let routeDetailByStartLocs = allRouteDetails.filter(e => e.station.stationStop == routeData.startLocation || e.station.province == routeData.startLocation);
  let routes = routeDetailByStartLocs.map(e => e.route);
  let routeDetails = routes.flatMap(e => allRouteDetails.filter(i => i.route.toString() == e.toString()));
  let routeDetailByEndLocs = routeDetails.filter(e => e.station.stationStop == routeData.endLocation || e.station.province == routeData.endLocation);
  routes = routeDetailByEndLocs.map(e => e.route);
  routeDetails = routes.flatMap(e => allRouteDetails.filter(i => i.route.toString() == e.toString()));
  let routeDetailGroups = groupBy(routeDetails, 'route');

  let finalRouteDetails = [];
  for (prop in routeDetailGroups) {
    let start = routeDetailGroups[prop].find(e => e.station.stationStop == routeData.startLocation || e.station.province == routeData.startLocation);
    let end = routeDetailGroups[prop].find(e => e.station.stationStop == routeData.endLocation || e.station.province == routeData.endLocation);

    if (start.orderRouteToStation < end.orderRouteToStation) {
      finalRouteDetails = finalRouteDetails.concat(routeDetailGroups[prop]);
    }
  }

  routes = [...new Set(finalRouteDetails.map(e => e.route.toString()))];
  let schedules = await RouteSchedule.find({ '$and': [ 
    {'route': { '$in': routes} }, 
    {'dayOfWeek': new Date(routeData.departureDate).getDay() } 
  ]});

  routes = schedules.map(e => e.route);
  routes = await Route.find({ '_id': { '$in': routes } }).populate('vehicle');

  routeDetails = routes.flatMap(e => allRouteDetails.filter(i => i.route.toString() == e._id.toString()));
  routeDetailGroups = groupBy(routeDetails, 'route');

  dataFinal = []

  for (prop in routeDetailGroups) {
    let details = routeDetailGroups[prop];
    
    let start = details.find(e => e.station.stationStop == routeData.startLocation || e.station.province == routeData.startLocation);
    let end = details.find(e => e.station.stationStop == routeData.endLocation || e.station.province == routeData.endLocation);

    let ranges = details.filter(e => e.orderRouteToStation <= end.orderRouteToStation);
    ranges.sort(byOrder);

    let startTimeLength = 0, endTimeLength = 0;
    let disStartLength = 0, disEndLength = 0;
    for (let item of ranges) {
      if (item.orderRouteToStation <= start.orderRouteToStation) {
        startTimeLength += item.timeArrivingToStation;
        disStartLength += item.distanceToStation;
      }

      if (item.orderRouteToStation <= end.orderRouteToStation) {
        endTimeLength += item.timeArrivingToStation;
        disEndLength += item.distanceToStation;
      }
    }

    let route = routes.find(e => e._id.toString() == prop);
    let startTime = route.startTime.split(':');

    let startHour = moment('2020-06-16 00:00:00').add(parseInt(startTime[0]), 'hours').add(parseInt(startTime[1]), 'minutes').add(startTimeLength, 'hours');
    let endHour = moment('2020-06-16 00:00:00').add(parseInt(startTime[0]), 'hours').add(parseInt(startTime[1]), 'minutes').add(endTimeLength, 'hours');

    let vehicle = route.vehicle;
    let pricePerKm = allAgents.find(e => e._id.toString() == vehicle.agent.toString()).priceToDistance;
    dataFinal.push({
      '_id': prop,
      'vehicleId': vehicle._id.toString(),
      'vehicleName': vehicle.name,
      'startLocation': start.station.address,
      'endLocation': end.station.address,
      'startTime': startHour.format('HH:mm'),
      'endTime': endHour.format('HH:mm'),
      'price': (disEndLength - disStartLength) * pricePerKm
    });
  }

  return resp.send(dataFinal);
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
