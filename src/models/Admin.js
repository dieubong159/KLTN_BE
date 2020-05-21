const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
var Schema = mongoose.Schema;

const adminSchema = Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  admintype: { type: Number },
});

const managementSchema = Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  isCreator: { type: String },
  isroot :{type : Boolean}
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
exports.managementSchema = managementSchema;

mongoose.model("Admin", adminSchema);
mongoose.model("ManagementAdmin", managementSchema);


