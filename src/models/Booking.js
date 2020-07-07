const mongoose = require("mongoose");

const expiredTime = (h) => {
  var today = new Date();
  today.setHours(today.getHours() + h);
  return today;
};

const bookingSchema = mongoose.Schema({
  routeDeparture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RouteDeparture",
  },
  seatNumber: {
    type: String,
  },
  seatStatus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Const",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  bookingInformation: {
    type: Object,
  },
  price: { type: Number },
  bookingTime: { type: Date, default: Date.now() },
  bookingExpiredTime: { type: Date, default: expiredTime(5) },
  status: { type: mongoose.Schema.Types.ObjectId, ref: "Const" },
  bookingCode: String,
});

mongoose.model("Booking", bookingSchema);
