const mongoose = require("mongoose");

const stationSchema = mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle"
  },
  stationStop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  province: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
});

mongoose.model("Station", stationSchema);
