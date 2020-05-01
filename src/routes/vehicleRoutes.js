const express = require("express");
const mongoose = require("mongoose");

const Vehicle = mongoose.model("Vehicle");
const Agent = mongoose.model("Agent");
const Location = mongoose.model("Location");

const router = express.Router();

router.get("/vehicle", async (req, res) => {
  const routes = await Vehicle.find();
  res.status(200).send(routes);
});

router.get("/vehicle/:vehicle_id", async (req, res) => {
  Vehicle.findById(req.params.vehicle_id).then((result) => {
    result = result.toJSON();
    delete result.__v;
    res.status(200).send(result);
  });
});
router.post("/vehicle", async (req, res) => {
  const vehicle = new Vehicle(req.body);
  var validstartLocation = mongoose.Types.ObjectId.isValid(vehicle.startLocation);
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
          const agentExist = Agent.exists({ _id: vehicledata[i]});
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

module.exports = router;
