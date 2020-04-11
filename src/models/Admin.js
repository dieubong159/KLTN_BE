const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const adminSchema = Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  status: { type: Number }
});

const managementSchema = Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  isCreator: { type: Boolean }
});

exports.adminSchema = adminSchema;

mongoose.model("Admin", adminSchema);


