const mongoose = require("mongoose");

const locationSchema = mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  coords: {
    latitude: String,
    longtitude: String,
    altitude: String,
    accuracy: String,
    heading: String,
    speed: String,
  },
});

mongoose.model("Location", locationSchema);
