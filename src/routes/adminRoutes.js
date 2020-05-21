var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();
var bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Admin = mongoose.model("Admin");
const ManagementAdmin = mongoose.model("ManagementAdmin");
const Agent = mongoose.model("Agent");

router.post("/admin", async (req, res, next) => {
  const admin = new Admin(req.body);
  if (!admin.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);
    bcrypt.hash(admin.password, salt, (err, hash) => {
      if (err) return next(err);
      admin.password = hash;
      admin
        .save()
        .then(() => {
          res.status(200).send(admin);
        })
        .catch((error) => {
          res.status(500).json({
            error: error,
          });
        });
    });
  });
});

router.get("/admin/CheckUserName", async (req, res) => {
  var query = { username: req.body.username };
  Admin.find(query).then((result) => {
    //result = result.toJSON();
    delete result.__v;
    res.status(200).send(result);
  });
});

router.get("/admin/:admin_id", async (req, res) => {
  Admin.findById(req.params.admin_id).then((result) => {
    result = result.toJSON();
    delete result.__v;
    res.status(200).send(result);
  });
});

router.get("/admin", async (req, res) => {
  var listAdmin = await Admin.find();
  res.status(200).send(listAdmin);
});

router.patch("/admin/:admin_id", async (req, res, next) => {
  var userData = req.body;
  // if (userData.password) {
  //     bcrypt.genSalt(10, function (err, salt) {
  //         if (err) return next(err);
  //         bcrypt.hash(userData.password, salt, (err, hash) => {
  //             if (err) return next(err);
  //             userData.password = hash;
  //         });
  //     });
  // }
  Admin.findById(req.params.admin_id, function (err, user) {
    for (let i in userData) {
      user[i] = userData[i];
    }
    user
      .save()
      .then(() => {
        res.status(200).json({
          message: "Admin changed successfully!",
        });
      })
      .catch((error) => {
        res.status(500).json({
          error: error,
        });
      });
  });
});

router.delete("/admin/:admin_id", async (req, res) => {
  Admin.findByIdAndRemove(req.params.admin_id)
    .exec()
    .then((doc) => {
      if (!doc) {
        return res.status(404).end();
      }
      return res.status(200).json({
        message: "Admin delete successfully!",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

router.post("/admin/signin", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(422)
      .send({ error: "Must provide username and password" });
  }

  const admin = await Admin.findOne({ username });
  if (!admin) {
    return res.status(422).send({ error: "Invalid password or username" });
  }

  try {
    await admin.comparePassword(password);
    const token = jwt.sign({ adminId: admin._id }, "KLTN-Booking",{
      expiresIn: "24h",
    });
    res.status(200).send({ token });
  } catch (err) {
    return res.status(422).send({ error: "Invalid password or username" });
  }
});


router.get("/managementadmin", async (req, res) => {
  var listManagementAdmin = await ManagementAdmin.find();
  res.status(200).send(listManagementAdmin);
});

router.get("/managementadmin/:management_id", async (req, res) => {
  ManagementAdmin.findById(req.params.management_id).then((result) => {
    result = result.toJSON();
    delete result.__v;
    res.status(200).send(result);
  });
});

router.get("/managementadmin/checkagent", async (req, res) => {
  var query = { agent: req.body.agent };
  ManagementAdmin.find(query).then((result) => {
    //result = result.toJSON();
    delete result.__v;
    res.status(200).send(result);
  });
});

router.get("/managementadmin/checkadmin", async (req, res) => {
  var query = { admin: req.body.admin };
  ManagementAdmin.find(query).then((result) => {
    //result = result.toJSON();
    delete result.__v;
    res.status(200).send(result);
  });
});

router.post("/managementadmin", async (req, res) =>{
  const management = new ManagementAdmin(req.body);
  var validAgent = mongoose.Types.ObjectId.isValid(management.agent);
  var validAdmin = mongoose.Types.ObjectId.isValid(management.admin);

  if(validAgent && validAdmin){
    const agentExist = await Agent.exists({ _id: management.agent });
    const adminExist = await Admin.exists({ _id: management.admin });
    if (!agentExist) {
      return res.status(500).json({
        error: "Agent not exist",
      });
    }
    if (!adminExist) {
      return res.status(500).json({
        error: "Admin not exist",
      });
    }
  }
  else{
    return res.status(500).json({
      error: "Not a valid ID",
    });
  }
  management
    .save()
    .then(() => {
      res.status(200).json({
        message: "Management added successfully!",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

// router.patch("/managementadmin/:management_id", async (req, res) => {

// });

module.exports = router;
