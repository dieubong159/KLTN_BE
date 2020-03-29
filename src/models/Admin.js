const mongoose = require("mongoose");

const adminSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  status: { type: Boolean }
});

const managementSchema = mongoose.Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  isCreator: { type: Boolean }
});

mongoose.model("Admin", adminSchema);
