const express = require("express");
const mongoose = require("mongoose");

const Location = mongoose.model("Location");

const router = express.Router();

router.get("/location", async (req, res) => {
  // console.log("VO");
  const routes = await Location.find();
  res.status(200).send(routes);
});

router.get("/location/:location_id", async (req, res) => {
  Location.findById(req.params.location_id).then((result) => {
    result = result.toJSON();
    delete result.__v;
    res.status(200).send(result);
  });
});

router.post("/location", async (req, res) => {
  const data = req.body;
  console.log(req.body);
  const location = new Location({
    address: data.address,
    coords: {
      latitude: data.coords.latitude,
      longtitude: data.coords.longtitude,
    },
  });
  var locationcheck = await Location.findOne({
    coords: {
      latitude: location.coords.latitude,
      longtitude: location.coords.longtitude,
    },
  });
  console.log(locationcheck);
  if (locationcheck) {
    return res.status(422).send({ error: "You must provide an address" });
  } else {
    location.save();
    res.status(200).send(location);
  }
});

router.patch("/location/:location_id", async (req, res) => {
  Location.findById(req.params.location_id, function (err, Location) {
    if (err) {
      res.status(500).json({ error: err });
    }
    var locationdata = req.body;
    for (let i in locationdata) {
      Location[i] = locationdata[i];
    }
    Location.save()
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

router.delete("/location/:location_id", async (req, res) => {
  Location.findByIdAndRemove(req.params.location_id)
    .exec()
    .then((doc) => {
      if (!doc) {
        return res.status(404).end();
      }
      return res.status(200).json({
        message: "Location delete successfully!",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

module.exports = router;
