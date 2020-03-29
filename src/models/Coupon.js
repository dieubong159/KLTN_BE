const mongoose = require("mongoose");

const couponSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  receivedDate: { type: Date },
  code: { type: mongoose.Schema.Types.ObjectId, ref: "CouponCode" }
});

const discountSchema = mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  counpon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon"
  },
  usedDate: { type: Date }
});

const couponCodeSchema = mongoose.Schema({
  code: { type: String },
  expiredDate: { type: Date },
  discountRate: { type: Number },
  createBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createDate: { type: Date }
});

mongoose.model("Counpon", couponSchema);
mongoose.model("CouponCode", couponCodeSchema);
