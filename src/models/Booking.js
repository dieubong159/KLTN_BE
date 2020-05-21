const mongoose = require("mongoose");

const expiredTime = (h)=>{
  var today = new Date();
  today.setHours(today.getHours()+ h);
  return today;
}


const bookingSchema = mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
  },
  seatNumber: { type: Number },
  seatStatus: {
    type: Number,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  price: { type: Number },
  bookingTime: { type: Date, default: Date.now(), },
  bookingExpiredTime: { type: Date, default: expiredTime(5), },
  status: { type: Number },
});

mongoose.model("Booking", bookingSchema);
