const mongoose = require("mongoose");

const agentSchema = mongoose.Schema({
  name: { type: String },
  cancelfee: {
    type: Number
  },
});

const agentDetailSchema = mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent"
  },
  phonenumber: {
    type: Number
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location"
  }
});

mongoose.model("Agent", agentSchema);
