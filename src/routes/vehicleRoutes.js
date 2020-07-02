const express = require("express");
const mongoose = require("mongoose");
const { json } = require("express");

const Vehicle = mongoose.model("Vehicle");
const Agent = mongoose.model("Agent");
const Location = mongoose.model("Location");
const SeatMap = mongoose.model("SeatMap");
const Map = mongoose.model("Map");
const Station = mongoose.model("Station");

const router = express.Router();

router.get("/vehicle", async (req, res) => {
  const routes = await Vehicle.find()
    .populate("startLocation")
    .populate("endLocation")
    .populate("startProvince")
    .populate("endProvince")
    .populate("agent")
    .populate("type");

  res.status(200).send(routes);
});

router.get("/vehicle/:vehicle_id", async (req, res) => {
  console.log(req.params.vehicle_id);
  const vehicle = await Vehicle.findById(req.params.vehicle_id)
  .populate("startLocation")
  .populate("endLocation")
  .populate("startProvince")
  .populate("endProvince")
  .populate("agent")
  .populate("type");

  var queryStation = { vehicle: req.params.vehicle_id };
  const listStation = await Station.find(queryStation)
  .populate("stationStop")
  .populate("province")
  .populate("vehicle")
  .populate({
    path: "vehicle",
    model: "Vehicle",
    populate: { path: "startLocation endLocation startProvince endProvince agent type" },
  });

  return res.send({
    vehicles: vehicle,
    listStations: listStation
  });
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
    address : data.location[0],
    coords:{
      latitude: data.latitudeLocation[0],
      longtitude: data.longtitudeLocation[0]
    }
  });

  const endLocation = new Location({
    address : data.location[1],
    coords:{
      latitude: data.latitudeLocation[1],
      longtitude: data.longtitudeLocation[1]
    }
  });

  const startProvince = new Location({
    address : data.locationProvince[0],
    coords:{
      latitude: data.latitudeProvince[0],
      longtitude: data.longtitudeProvince[0]
    }
  });

  const endProvince = new Location({
    address : data.locationProvince[1],
    coords:{
      latitude: data.latitudeProvince[1],
      longtitude: data.longtitudeProvince[1]
    }
  });
  const vehicle = new Vehicle({
    type: data.vehicleType,
    name : data.name,
    totalSeats:data.totalSeats,
    licensePlates: data.licensePlates,
    startLocation: startLocation._id,
    startProvince: startProvince._id,
    endLocation: endLocation._id,
    endProvince: endProvince._id,
    agent: data.vehicleAgent,
    isOnline : data.isOnline
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

  var provinceFromCheck = await Location.findOne({
    coords:{
      latitude: startProvince.coords.latitude,
      longtitude: startProvince.coords.longtitude
    }
  });
  if(!provinceFromCheck){
    startProvince.save();
  }else{
    vehicle.startProvince = provinceFromCheck._id;
  }

  var provinceToCheck = await Location.findOne({
    coords:{
      latitude: endProvince.coords.latitude,
      longtitude: endProvince.coords.longtitude
    }
  });
  if(!provinceToCheck){
    endProvince.save();
  }else{
    vehicle.endProvince = provinceToCheck._id;
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

  await vehicle.save();

  const startStation = new Station({
    vehicle: vehicle._id,
    stationStop : vehicle.startLocation,
    province : vehicle.startProvince,
    orderRouteToStation: data.orderToStation[0]
  });

  const endStation = new Station({
    vehicle: vehicle._id,
    stationStop : vehicle.endLocation,
    province : vehicle.endProvince,
    orderRouteToStation: data.orderToStation[1]
  });

  startStation.save();
  endStation.save();

  let length = data.locationAddStation.length;
  for(let i = 0;i<length;i++){
    const locationStationNew = new Location({
      address : data.locationAddStation[i],
      coords:{
        latitude: data.latitudeLocationAddStation[i],
        longtitude: data.longitudeLocationAddStation[i]
      }
    });
  
    const locationProvinceNew = new Location({
      address : data.locationAddProvince[i],
      coords:{
        latitude: data.latitudeLocationAddProvince[i],
        longtitude: data.longitudeLocationAddProvince[i]
      }
    });

    const stationNew = new Station({
      vehicle: vehicle._id,
      stationStop : locationStationNew._id,
      province : locationProvinceNew._id,
      orderRouteToStation: data.orderToAddStation[i]
    });

    var stationNewCheck = await Location.findOne({
      coords:{
        latitude: locationStationNew.coords.latitude,
        longtitude: locationStationNew.coords.longtitude
      }
    });
    if(stationNewCheck){
      stationNew.stationStop = stationNewCheck._id
    }
    else{
      await locationStationNew.save();
    }

    var provinceNewCheck = await Location.findOne({
      coords:{
        latitude: locationProvinceNew.coords.latitude,
        longtitude: locationProvinceNew.coords.longtitude
      }
    });
    if(provinceNewCheck){
      stationNew.province = provinceNewCheck._id
    }
    else{
      await locationProvinceNew.save();
    }
    await stationNew.save();   
  }

  res.status(200).json({
    message: "Data save changed successfully!",
  });


});

module.exports = router;
