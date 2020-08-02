const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  amount: { type: Number },
  paymentTime: { type: Date, default: Date.now() },
});

const couponSchema = mongoose.Schema({
  code: { type: String },
  expiredDate: { type: Date },
  discountRate: { type: Number },
  createBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createDate: { type: Date, default: Date.now() },
});

mongoose.model("Coupon", couponSchema);
mongoose.model("Payment", paymentSchema);
