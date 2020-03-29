const mongoose = require("mongoose");

const locationSchema = mongoose.Schema({
  timestamp: Number,
  coords: {
    latitude: Number,
    longtitude: Number,
    altitude: Number,
    accuracy: Number,
    heading: Number,
    speed: Number
  },
  address: String
});

mongoose.model("Location", locationSchema);
