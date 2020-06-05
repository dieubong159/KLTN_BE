const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const constSchema = Schema({
  type: { type: String, require: true },
  value: { type: String, require: true },
  displayValue: { type: String, require: true }
});

exports.constSchema = constSchema;

mongoose.model("Const", constSchema);