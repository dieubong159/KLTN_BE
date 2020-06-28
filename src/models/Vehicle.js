const mongoose = require("mongoose");

const vehicleSchema = mongoose.Schema({
  type: {
    type: mongoose.Schema.Types.ObjectId, ref: "Const"
  },
  name: {
    type: String,
  },
  totalSeats: {
    type: Number,
  },
  licensePlates: {
    type: String,
  },
  startLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  startProvince: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  endLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  endProvince: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  status: {
    type: Number,
    default: 0,
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
  },
  isOnline:{
    type: Boolean
  }
});

mongoose.model("Vehicle", vehicleSchema);
