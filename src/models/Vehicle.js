const mongoose = require("mongoose");

const vehicleSchema = mongoose.Schema({
  type: {
    type: Number,
  },
  name: {
    type: String,
  },
  numberSeats: {
    type: Number,
  },
  licensePlates: {
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
    type: Number,
    default: 0,
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
  },
});

mongoose.model("Vehicle", vehicleSchema);
