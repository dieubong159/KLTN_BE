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

mongoose.model("SeatMap", seatMapSchema);
