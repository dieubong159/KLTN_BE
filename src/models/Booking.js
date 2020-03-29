const mongoose = require("mongoose");

const ticketSchema = mongoose.Schema({
  seatNumber: { type: Number },
  startTime: { type: Date },
  price: { type: Number }
});

const bookingSchema = mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route"
  },
  seatStatus: {
    type: Number
  },
  tickets: [ticketSchema],
  bookingTime: { type: String },
  status: { type: Number }
});

mongoose.model("Booking", bookingSchema);
