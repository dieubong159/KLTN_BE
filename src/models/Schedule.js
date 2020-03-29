const mongoose = require("mongoose");

const scheduleSchema = mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle"
  },
  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Track"
  }
});

mongoose.model("Schedule", scheduleSchema);
