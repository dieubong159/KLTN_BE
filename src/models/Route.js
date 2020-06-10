const mongoose = require("mongoose");

const routeSchema = mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
  },
  startTime: {
    type: String,
  },
  endTime: {
    type: String,
  },
  startLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  endLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  status: {
    type: mongoose.Schema.Types.ObjectId, ref: "Const"
  },
  price: {
    type: Number,
  },
  departureDate: {
    type: Date,
    default: Date.now(),
  },
});

mongoose.model("Route", routeSchema);
