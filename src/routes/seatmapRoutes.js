var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();

const AVAILABLE = 0;
const UNAVAILABLE = 1;
const PENDING = 2;

const SeatMap = mongoose.model("SeatMap");
const Map = mongoose.model("Map");
const Vehicle = mongoose.model("Vehicle");
const Agent = mongoose.model("Agent");
const Route = mongoose.model("Route");
const Booking = mongoose.model("Booking");

router.get("/seatmap/:route_id", async (req, res) => {
  var route = null;
  var vehicle = null;
  var booking = null;
  var seatmap = null;
  var seatmapselect = [];
  Route.findById(req.params.route_id)
    .populate("vehicle")
    .then((result) => {
      result = result.toJSON();
      //delete result.__v;
      route = result;
      console.log(route);
      var query = { vehicle: route.vehicle._id };
      SeatMap.find(query).then((result) => {
        //result = result.toJSON();
        //delete result.__v;
        seatmap = result;
        seatmap.forEach((item) => {
          if (item.seatNumber != null) {
            seatmapselect.push(item);
          }
        });
        var querybooking = { route: req.params.route_id };
        Booking.find(querybooking).then((result) => {
          booking = result;
        });
        seatmapselect.forEach((item) => {
          
          booking.forEach((e)=>{
            if((item.seatNumber === e.seatNumber) && (e.seatStatus === UNAVAILABLE)){

            }
          });
          // check seatmap dang duyet co ton tai trong Dat cho hay ko
        });
      });
    });
});

router.get("/seatmap", async (req, res) => {
  var listseatmap = await SeatMap.find();
  res.status(200).send(listseatmap);
});

router.get('/mapbyagent', async (req, res) => {
  let agentId = req.query.agentId;
  let vehicleType = req.query.vehicleType;

  if (agentId && vehicleType) {
    let map = await Map.findOne({ agent: agentId, type: vehicleType })
      .populate('orderType')
      .populate('agent')
      .populate('type');

    if (map) {
      return res.send({
        statusCode: 200,
        state: "Successfull",
        message: "Successfull",
        data: map
      });
    }

    return res.send({
      statusCode: 404,
      state: "Failed",
      message: "Map does not find with input parameters",
      data: null
    });
  }

  return res.send({
    statusCode: 400,
    state: 'Failed',
    message: 'Expected parameters adgentId or vehicleType is missing',
    data: null
  });
});

router.post("/seatmap", async (req, res) => {
  const seatmap = new SeatMap(req.body);
  var validVehicle = mongoose.Types.ObjectId.isValid(seatmap.vehicle);
  if (validVehicle) {
    const vehicleExist = await Vehicle.exists({ _id: seatmap.vehicle });
    if (!vehicleExist) {
      return res.status(500).json({
        error: "Vehicle not exist",
      });
    }
  }else{
    return res.status(500).json({
      error: "Not a valid ID",
    });
  }
  seatmap
    .save()
    .then(() => {
      res.status(200).json({
        message: "SeatMap added successfully!",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

router.post("/map", async (req, res) => {
  const map = new Map(req.body);
  //var validAgent = mongoose.Types.ObjectId.isValid(map.agent);
  // if (validAgent) {
  //   const agentExist = await Agent.exists({ _id: map.agent });
  //   if (!agentExist) {
  //     return res.status(500).json({
  //       error: "Agent not exist",
  //     });
  //   }
  // }else{
  //   return res.status(500).json({
  //     error: "Not a valid ID",
  //   });
  // }
  map
    .save()
    .then(() => {
      res.status(200).json({
        message: "SeatMap added successfully!",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

module.exports = router;
