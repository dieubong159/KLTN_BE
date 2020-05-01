const mongoose = require("mongoose");

const vehicleSchema = mongoose.Schema({
  type: {
    type: String
  },
  name: { 
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
    type: Number,
    default: 0
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent"
  }
});

mongoose.model("Vehicle", vehicleSchema);
