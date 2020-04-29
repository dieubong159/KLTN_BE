const express = require("express");
const mongoose = require("mongoose");

const Vehicle = mongoose.model("Vehicle");

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


module.exports = router;