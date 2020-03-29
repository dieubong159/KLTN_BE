const mongoose = require("mongoose");

const trackSchema = mongoose.Schema({
  startLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location"
  },
  endLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location"
  },
  distance: {
    type: Number,
    default: 0
  }
});

mongoose.model("Track", trackSchema);
