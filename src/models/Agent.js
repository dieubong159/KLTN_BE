const mongoose = require("mongoose");

const ReviewSchema = mongoose.Schema({
  rating: {
    type: Number,
    required: true,
  },
  comment: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
  },
});

const agentSchema = mongoose.Schema({
  name: { type: String },
  cancelfee: {
    type: Number,
  },
  priceToDistance: {
    type: Number,
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      default: undefined,
    },
  ],
  coupons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: undefined,
    },
  ],
  reviewRate: {
    type: Number,
    default: undefined,
  },
});

const agentDetailSchema = mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
  },
  phonenumber: {
    type: Number,
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  isMain: {
    type: Number,
  },
});

mongoose.model("Review", ReviewSchema);
mongoose.model("Agent", agentSchema);
mongoose.model("AgentDetail", agentDetailSchema);
