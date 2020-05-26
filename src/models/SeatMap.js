const mongoose = require("mongoose");

const seatMapSchema = mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle"
  },
  index: {
    type: Number
  },
  seatNumber: {
    type: Number
  }
});

const mapSchema = mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent"
  },
  type: {
    type: mongoose.Schema.Types.ObjectId, ref: "Const"
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  },
  orderType: {
    type: mongoose.Schema.Types.ObjectId, ref: "Const"
  }
});

mongoose.model("SeatMap", seatMapSchema);
mongoose.model("Map", mapSchema);
