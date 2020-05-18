const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
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


adminSchema.methods.comparePassword = function (candidatePassword) {
  const admin = this;

  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, admin.password, (err, isMatch) => {
      if (err) {
        return reject(err);
      }

      if (!isMatch) {
        return reject(false);
      }
      resolve(true);
    });
  });
};

exports.adminSchema = adminSchema;

mongoose.model("Admin", adminSchema);


