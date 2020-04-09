const mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt");

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

// exports.createAdmin = (adminData,next) => {
//   const admin = new Admin(adminData);

//   if(!admin.isModified("password")) return next();

//   bcrypt.genSalt(10,function(err, salt) {
//     if (err) return next(err);
    
//     bcrypt.hash(admin.password,salt,(err,hash)=>{
//       if (err) return next(err);
//       admin.password = hash;
//       next();
//     });
//   });
//   return admin.save();
// };

exports.findById = id => {
  return Admin.findById(id).then(result => {
    result = result.toJSON();
    delete result._id;
    delete result.__v;
    return result;
  });
};

exports.listAdmin = (perPage, page) => {
  return new Promise((resolve, reject) => {
    Admin.find()
      .limit(perPage)
      .skip(perPage * page)
      .exec(function(err, users) {
        if (err) reject(err);
        else resolve(users);
      });
  });
};

