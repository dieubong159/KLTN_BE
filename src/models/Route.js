const mongoose = require("mongoose");

const routeSchema = mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle"
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  startLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location"
  },
  endLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location"
  },
  status: {
    type: Number
  },
  price: {
    type: Number
  }
});

mongoose.model("Route", routeSchema);
