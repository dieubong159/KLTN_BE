const express = require("express");
const mongoose = require("mongoose");

const Vehicle = mongoose.model("Vehicle");
const Agent = mongoose.model("Agent");
const Location = mongoose.model("Location");
const SeatMap = mongoose.model("SeatMap");
const Map = mongoose.model("Map");

const router = express.Router();

router.get("/vehicle", async (req, res) => {
  const routes = await Vehicle.find()
    .populate("startLocation")
    .populate("endLocation")
    .populate("agent")
    .populate("type");
  res.status(200).send(routes);
});

router.get("/vehicle/:vehicle_id", async (req, res) => {
  Vehicle.findById(req.params.vehicle_id)
    .populate("startLocation")
    .populate("endLocation")
    .populate("agent")
    .populate("type")
    .then((result) => {
      result = result.toJSON();
      delete result.__v;
      res.status(200).send(result);
    });
  //res.status(200).send(vehicle);
  // Vehicle.findById(req.params.vehicle_id).then((result) => {
  //   result = result.toJSON();
  //   delete result.__v;
  //   res.status(200).send(result);
  // });
});
router.post("/vehicle", async (req, res) => {
  const vehicle = new Vehicle(req.body);
  var validstartLocation = mongoose.Types.ObjectId.isValid(
    vehicle.startLocation
  );
  var validendLocation = mongoose.Types.ObjectId.isValid(vehicle.endLocation);
  var validagent = mongoose.Types.ObjectId.isValid(vehicle.agent);

  if (validstartLocation && validendLocation && validagent) {
    const startExist = await Location.exists({ _id: vehicle.startLocation });
    const endExist = await Location.exists({ _id: vehicle.endLocation });
    const agentExist = await Agent.exists({ _id: vehicle.agent });

    if (!startExist && !endExist) {
      return res.status(500).json({
        error: "Location not exist",
      });
    }
    if (!agentExist) {
      return res.status(500).json({
        error: "Agent not exist",
      });
    }
  } else {
    return res.status(500).json({
      error: "Not a valid ID",
    });
  }
  vehicle
    .save()
    .then(() => {
      res.status(200).json({
        message: "Vehicle added successfully!",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

router.patch("/vehicle/:vehicle_id", async (req, res) => {
  var vehicledata = req.body;
  Vehicle.findById(req.params.vehicle_id, function (err, vehicle) {
    for (let i in vehicledata) {
      if (i === "agent") {
        var valid = mongoose.Types.ObjectId.isValid(vehicledata[i]);
        if (valid) {
          const agentExist = Agent.exists({ _id: vehicledata[i] });
          if (!agentExist) {
            return res.status(500).json({
              error: "Agent not exist",
            });
          }
        } else {
          return res.status(500).json({
            error: "Not a valid ID",
          });
        }
      }

      vehicle[i] = vehicledata[i];
    }
    vehicle
      .save()
      .then(() => {
        res.status(200).json({
          message: "Vehicle changed successfully!",
        });
      })
      .catch((error) => {
        res.status(500).json({
          error: error,
        });
      });
  });
});

router.delete("/vehicle/:vehicle_id", async (req, res) => {
  Vehicle.findByIdAndRemove(req.params.vehicle_id)
    .exec()
    .then((doc) => {
      if (!doc) {
        return res.status(404).end();
      }
      return res.status(200).json({
        message: "Vehicle delete successfully!",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});


router.post("/vehicle/addvehicleandseatmap", async (req, res) => { 
  var data = req.body.vehicleData;
  const startLocation = new Location({
    address : data.locationFrom,
    coords:{
      latitude: data.latitudeStartLocation,
      longtitude: data.longtitudeStartLocation
    }
  });

  const endLocation = new Location({
    address : data.locationTo,
    coords:{
      latitude: data.latitudeEndLocation,
      longtitude: data.longtitudeEndLocation
    }
  });
  const vehicle = new Vehicle({
    type: data.vehicleType,
    name : data.name,
    totalSeats:data.totalSeats,
    licensePlates: data.licensePlates,
    startLocation: startLocation._id,
    endLocation: endLocation._id,
    agent: data.vehicleAgent
  });

  var locationFromcheck = await Location.findOne({
    coords:{
      latitude: startLocation.coords.latitude,
      longtitude: startLocation.coords.longtitude
    }
  });
  if(!locationFromcheck){
    startLocation.save();
  }
  else{
    vehicle.startLocation = locationFromcheck._id;
  }

  var locationtocheck = await Location.findOne({
    coords:{
      latitude: endLocation.coords.latitude,
      longtitude: endLocation.coords.longtitude
    }
  });
  if(!locationtocheck){
    endLocation.save();
  }else{
    vehicle.endLocation = locationtocheck._id;
  }

  let map = await Map.findOne({agent:data.vehicleAgent, type:data.vehicleType});
  let seatMap = req.body.seatMap;
  seatMap.forEach(item => {
    let seat = new SeatMap({
      vehicle: vehicle._id,
      index: item.item1,
      seatNumber: item.item2,
      mapDetail : map._id
    });

    seat.save();
  });

  vehicle.save();

  res.status(200).json({
    message: "Data save changed successfully!",
  });


});

module.exports = router;
