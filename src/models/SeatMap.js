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
    type: String
  },
  mapDetail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Map"
  },
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
