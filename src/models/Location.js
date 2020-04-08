const mongoose = require("mongoose");

const locationSchema = mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
  },
  timestamp: {
    type: Number,
    default: +new Date(),
  },
  coords: {
    latitude: Number,
    longtitude: Number,
    altitude: Number,
    accuracy: Number,
    heading: Number,
    speed: Number,
  },
});

mongoose.model("Location", locationSchema);
