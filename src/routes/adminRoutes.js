var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();
var bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { route } = require("./vehicleRoutes");

const Admin = mongoose.model("Admin");
const ManagementAdmin = mongoose.model("ManagementAdmin");
const Agent = mongoose.model("Agent");
const Payment = mongoose.model("Payment");
const RouteDeparture = mongoose.model("RouteDeparture");
const Booking = mongoose.model("Booking");


let getAgentForAdmin = async (adminId) =>{
  let adminMmgs = await ManagementAdmin.find();
  let agents = adminMmgs.filter(e => e.admin.toString() == adminId && e.agent !== null && e.isroot);
  if (agents.length == 0) {
    agents = adminMmgs;
  }
  agents = agents.filter(e => e.agent).map(e => e.agent.toString());

  return [...new Set(agents)];
};

let getSubAdmins = async (adminId) => {
  let adminMmgs = await ManagementAdmin.find();
  let agents = await getAgentForAdmin(adminId);
  let admins = adminMmgs.filter(e => e.agent && agents.some(i => i == e.agent.toString())).map(e => e.admin.toString());
  return await Admin.find({ _id: { '$in': admins } });
};

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

router.get("/admin-by-agent/:admin_id", async (req, res) => {
  res.send(await getSubAdmins(req.params.admin_id));
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

  let admins =  await Admin.find();
  let admin = admins.find(e=>e.username == username || e.email == username);
  if (!admin) {
    if(!admin){
      return res.status(422).send({ error: "Invalid password or username" });
    }
  }

  try {
    await admin.comparePassword(password);
    const token = jwt.sign({ adminId: admin._id }, "KLTN-Booking", {
      expiresIn: "24h",
    });

    let isRootAdmin = (await ManagementAdmin.find({admin : admin._id})).some(e => e.isroot === true);
    res.status(200).send({ token: token, id: admin._id, isRootAdmin: isRootAdmin });
  } catch (err) {
    return res.status(422).send({ error: "Invalid password or username" });
  }
});

router.get("/managementadmin", async (req, res) => {
  var listManagementAdmin = await ManagementAdmin.find().populate("agent").populate("admin");
  res.status(200).send(listManagementAdmin);
});

router.get("/managementadmin/:management_id", async (req, res) => {
  var management = ManagementAdmin.findById(req.params.management_id).populate("agent").populate("admin");
  res.status(200).send(management);
  // ManagementAdmin.findById(req.params.management_id).then((result) => {
  //   result = result.toJSON();
  //   delete result.__v;
  //   res.status(200).send(result);
  // });
});

router.get("/management/managementlistbyAgent/:agent_id", async (req, res) => {
  var query = { agent: req.params.agent_id };
  var listmanagement = await ManagementAdmin.find(query).populate("agent").populate("admin");
  res.status(200).send(listmanagement);
  // ManagementAdmin.find(query).then((result) => {
  //   //result = result.toJSON();
  //   delete result.__v;
  //   res.status(200).send(result);
  // });
});

router.get("/management/managementlistbyAdmin/:admin_id", async (req, res) => {
  var query = { admin: req.params.admin_id };
  var listmanagement = await ManagementAdmin.find(query).populate("agent").populate("admin");
  res.status(200).send(listmanagement);
  // ManagementAdmin.find(query).then((result) => {
  //   //result = result.toJSON();
  //   delete result.__v;
  //   res.status(200).send(result);
  // });
});

router.post("/managementadmin", async (req, res) => {
  const management = new ManagementAdmin(req.body);
  var validAgent = mongoose.Types.ObjectId.isValid(management.agent);
  var validAdmin = mongoose.Types.ObjectId.isValid(management.admin);

  if (validAgent && validAdmin) {
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
  } else {
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

router.patch("/managementadmin/:management_id", async (req, res) => {

});

router.post("/admin/changepassword", async (req, res) => {
  let {adminId, passold, passnew } = req.body;

  if (!adminId || !passold || !passnew) {
    return res.status(422).send({ error: "Must provide username and password" });
  }

  let admin = await Admin.findById(adminId);
  if(!admin){
    return res.status(422).send({ error: "AdminId not valid" });
  }
  try {
  await admin.comparePassword(passold);

  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);
    bcrypt.hash(passnew, salt, (err, hash) => {
      if (err) return next(err);
      admin.password = hash;
      admin.save();
      res.status(200).send({message : "Change password success"})
    });
  });
  } catch (err) {
    return res.status(422).send({ error: "Invalid password or username" });
  }
  
});


route.get("/statistical", async (req, res) => {
  let data = req.body;
  var statusRouteComplete = await Const.findOne({
    type: "trang_thai_hanh_trinh",
    value: "da_di",
  });
  var statusBookingComplete = await Const.findOne({
    type: "trang_thai_dat_cho",
    value: "da_di",
  });
  let allBookings = await Booking.find();
  const routeDepartures = await RouteDeparture.find()
    .populate({
      path: "route",
      model: "Route",
      populate: {
        path:
          "startLocation endLocation startProvince endProvince status vehicle",
        populate: {
          path:
            "startLocation endLocation startProvince endProvince agent type",
        },
      },
    });


  let fn_DateCompare = async (DateA, DateB)=> {
    var msDateA = Date.UTC(DateA.getFullYear(), DateA.getMonth()+1, DateA.getDate());
    var msDateB = Date.UTC(DateB.getFullYear(), DateB.getMonth()+1, DateB.getDate());
    if (parseFloat(msDateA) < parseFloat(msDateB))
      return -1;  // lt
    else if (parseFloat(msDateA) == parseFloat(msDateB))
      return 0;  // eq
    else if (parseFloat(msDateA) > parseFloat(msDateB))
      return 1;  // gt
    else
      return null;  // error
  };

  let getStatistical = async (routeDeparture,allBookings)=>{
    let bookings = allBookings.filter(e=>e.routeDeparture.toString() == routeDeparture._id.toString());
    let bookingComplete = bookings.filter(e=>e.status.toString() == statusBookingComplete);
    let ticketComplete = bookingComplete.length();
    let tickerCancel = bookings.filter(e=>e.status.toString() != statusBookingComplete).length();

    let revenue = 0;
    for(let booking of bookingComplete){
      revenue += booking.price;
    }

    let day = routeDeparture.departureDate.getDate();
    let month = routeDeparture.departureDate.getMonth() + 1;
    let year = routeDeparture.departureDate.getFullYear();

    var departureDate = day + '/' + month + '/' + year; 

    return {
      departureDate : departureDate,
      revenue : revenue,
      ticketComplete : ticketComplete,
      tickerCancel : tickerCancel
    };
  }
  var groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };
  let routeDepartureSelectData = []
  routeDepartures = routeDepartures.filter(e=>e.route.vehicle.agent._id.toString() == data.agentId 
                    && e.status.toString() == statusRouteComplete._id.toString());
  for(let routeDeparture of routeDepartures){
    if(fn_DateCompare(data.fromDate,routeDeparture.departureDate)== -1){
      if(fn_DateCompare(data.toDate ,routeDeparture.departureDate) == 1){
        let data = getStatistical(routeDeparture,allBookings);
        routeDepartureSelectData.push(data);
      }
    }
  }
});

module.exports = router;
