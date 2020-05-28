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
    latitude: Number,
    longtitude: Number,
    altitude: Number,
    accuracy: String,
    heading: String,
    speed: String,
  },
});

mongoose.model("Location", locationSchema);
