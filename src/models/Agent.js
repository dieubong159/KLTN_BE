const mongoose = require("mongoose");

const agentSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  status: { type: Number }
});

const agentDetailSchema = mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent"
  },
  phonenumber: {
    type: Number
  },
  cancelfee: {
    type: Number
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location"
  }
});

mongoose.model("Agent", agentSchema);
