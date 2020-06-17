var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();

const SeatMap = mongoose.model("SeatMap");
const Map = mongoose.model("Map");
const Vehicle = mongoose.model("Vehicle");
const Agent = mongoose.model("Agent");
const Route = mongoose.model("Route");
const Booking = mongoose.model("Booking");

router.get("/seatmap", async (req, res) => {
  const params = req.query;
  const data = {
    vehicleId: params.vehicleId,
    departureId: params.departureId
  };

  var querySeatMap = { vehicle: data.vehicleId };
  var seatmap = await SeatMap.find(querySeatMap).populate({
    path: "mapDetail",
    model: "Map",
    populate: { path: "type orderType" },
  });

  var querybooking = { routeuDeparture: data.departureId};
  var booking = await Booking.find(querybooking).populate("seatStatus");

  let seatMapStatus = seatmap.map((seat) => {
    if (seat.seatNumber) {
      let seatState = { seatStatus: "trong", displayStatus: "Ghế trống" };
      if(booking){
        let book = booking.find((e) => e.seatNumber == seat.seatNumber);
        if (book) {
          seatState = {
            seatStatus: book.seatStatus.value,
            displayStatus: book.seatStatus.displayValue,
          };
        }
      }
      return {
        index: seat.index,
        seatNumber: seat.seatNumber,
        seatState: seatState,
      };
    }

    return {
      index: seat.index,
      seatNumber: null,
      seatState: null,
    };
  });

  return res.send({
    data: {
      map: {
        width: seatmap[0].mapDetail.width,
        height: seatmap[0].mapDetail.height,
        type: seatmap[0].mapDetail.type.value,
        displayType: seatmap[0].mapDetail.type.displayValue,
        orderType: seatmap[0].mapDetail.orderType.value,
        displayOrderType: seatmap[0].mapDetail.orderType.displayValue,
      },
      seatMapStatus: seatMapStatus,
    },
  });
});

router.get("/seatmap", async (req, res) => {
  var listseatmap = await SeatMap.find();
  res.status(200).send(listseatmap);
});

router.get("/mapbyagent", async (req, res) => {
  let agentId = req.query.agentId;
  let vehicleType = req.query.vehicleType;

  if (agentId && vehicleType) {
    let map = await Map.findOne({ agent: agentId, type: vehicleType })
      .populate("orderType")
      .populate("agent")
      .populate("type");

    if (map) {
      return res.send({
        statusCode: 200,
        state: "Successfull",
        message: "Successfull",
        data: map,
      });
    }

    return res.send({
      statusCode: 404,
      state: "Failed",
      message: "Map does not find with input parameters",
      data: null,
    });
  }

  return res.send({
    statusCode: 400,
    state: "Failed",
    message: "Expected parameters adgentId or vehicleType is missing",
    data: null,
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
  } else {
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
