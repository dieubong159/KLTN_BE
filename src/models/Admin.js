const mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt");

const adminSchema = Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  status: { type: Boolean }
});

const managementSchema = Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  isCreator: { type: Boolean }
});

exports.adminSchema = adminSchema;

const Admin = mongoose.model("Admin", adminSchema);

exports.createAdmin = adminData => {
  const admin = new Admin(adminData);
  //hash the password only if the password has been changed or user is new
  if (!admin.isModified("password")) return next;
  //generate the hash
  bcrypt.hash(admin.password, null, null, function(err, hash) {
    if (err) return next(err);
    //change the password to the hash version
    admin.password = hash;
  });
  return admin.save();
};

exports.findById = id => {
  return Admin.findById(id).then(result => {
    result = result.toJSON();
    delete result._id;
    delete result.__v;
    return result;
  });
};

