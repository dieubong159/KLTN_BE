var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();

const Agent = mongoose.model("Agent");
const Map = mongoose.model("Map");
const Const = mongoose.model("Const");
const AgentDetail = mongoose.model("AgentDetail");
const Location = mongoose.model("Location");
const User = mongoose.model("User");
const Review = mongoose.model("Review");
const ManagementAdmin = mongoose.model("ManagementAdmin");
const Coupon = mongoose.model("Coupon");
const Booking = mongoose.model("Booking");
const Route = mongoose.model("Route");

let getAgentForAdmin = async (adminId) => {
  let adminMmgs = await ManagementAdmin.find();
  let agentList = await Agent.find();
  let agents = adminMmgs.filter(
    (e) => e.admin.toString() == adminId && e.agent !== null
  );
  if (agents.length == 0) {
    agents = agentList;
    agents = agents.map((e) => e._id.toString());
  } else {
    agents = agents.filter((e) => e.agent).map((e) => e.agent.toString());
  }

  return [...new Set(agents)];
};

let getAgentForAdminRoot = async (adminId) => {
  let agentList = await Agent.find();
  let adminMmgs = await ManagementAdmin.find();
  let agents = adminMmgs.filter(
    (e) => e.admin.toString() == adminId && e.agent !== null && e.isroot
  );
  if (agents.length == 0) {
    agents = agentList;
    agents = agents.map((e) => e._id.toString());
  } else {
    agents = agents.filter((e) => e.agent).map((e) => e.agent.toString());
  }

  return [...new Set(agents)];
};

router.get("/agent-by-admin/:admin_id", async (req, res) => {
  let agents = await Agent.find();
  // if(req.params.admin_id == "5ec2add03694f0452c7d8115"){
  //   return res.status(200).send(agents);
  // }
  let agentForAdminIds = await getAgentForAdmin(req.params.admin_id);

  let results = [];
  for (let agent of agents) {
    if (agentForAdminIds.some((e) => e == agent._id.toString())) {
      results.push(agent);
    }
  }
  res.status(200).send(results);
});

router.get("/agent-by-adminroot/:admin_id", async (req, res) => {
  let agents = await Agent.find();
  // if(req.params.admin_id=="5ec2add03694f0452c7d8115"){
  //   return res.status(200).send(agents);
  // }
  let agentForAdminIds = await getAgentForAdminRoot(req.params.admin_id);

  let results = [];
  for (let agent of agents) {
    if (agentForAdminIds.some((e) => e == agent._id.toString())) {
      results.push(agent);
    }
  }
  res.status(200).send(results);
});

// router.get("/agent/:agent_id", async (req, res) => {
//   // Agent.findById(req.params.agent_id).then((result) => {
//   //   result = result.toJSON();
//   //   delete result.__v;
//   //   res.status(200).send(result);
//   // });
// });

router.get("/agent/review", async (req, res) => {
  const agentId = req.params;
  const agent = await Agent.findById(agentId);
  if (agent) {
    res.status(200).send({ reviews: agent.reviews });
  }
});

router.post("/agent/review", async (req, res) => {
  const payload = req.body;
  console.log(payload);
  const user = await User.findById(payload.user);
  const route = await Route.findById(payload.route).populate({
    path: "vehicle",
    populate: "agent",
  });
  const agent = route.vehicle.agent;
  // if (route) console.log(route);
  const bookingCode = payload.bookingCode;

  if (user && route) {
    try {
      const review = new Review({
        user: payload.user,
        rating: payload.rate,
        comment: payload.review,
        route: payload.route,
      });
      review.save();

      let newReviewRate;
      if (agent.reviewRate) {
        newReviewRate =
          (agent.reviewRate * agent.reviews.length + review.rating) /
          (agent.reviews.length + 1);
        newReviewRate.toFixed(1);
      } else {
        newReviewRate = review.rating;
        e;
      }

      Agent.findOneAndUpdate(
        { _id: agent._id },
        { $push: { reviews: review._id }, $set: { reviewRate: newReviewRate } },
        { upsert: false },
        function (err) {
          if (err) return res.status(500).send({ error: err });
          // res.status(200).send(doc);
        }
      );

      const bookings = await Booking.find({
        bookingCode: bookingCode,
      }).populate({
        path: "routeDeparture",
        populate: "route",
      });
      if (bookings.length !== 0) {
        bookings.filter((e) => {
          e.routeDeparture.route._id === payload.route;
        });
        for (let booking of bookings) {
          await Booking.findByIdAndUpdate(booking._id, { reviewed: true });
        }
      }
      // console.log("Agent found: ");
      // console.log(bookings.length);
      res.status(200).send({ message: "Review successfully" });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }
});

router.get("/agent/addAgentData", async (req, res) => {
  var vehicleAndOrderTypes = await Const.find({
    $or: [{ type: "loai_xe" }, { type: "kieu_xep_loai_danh_so" }],
  });
  res.send({
    vehicleAndOrderTypes: vehicleAndOrderTypes,
  });
});

router.post("/agent", async (req, res) => {
  const agent = new Agent(req.body);
  console.log(agent);
  agent
    .save()
    .then(() => {
      res.status(200).send(agent);
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

router.post("/agent/addagent", async (req, res) => {
  var data = req.body;

  const agent = new Agent({
    name: data.name,
    cancelfee: data.cancelfee,
    priceToDistance: data.priceToDistance,
  });

  const locationFrom = new Location({
    address: data.locationFrom,
    coords: {
      latitude: data.latitudeLocationFrom,
      longtitude: data.longitudeLocationFrom,
    },
  });

  const locationTo = new Location({
    address: data.locationTo,
    coords: {
      latitude: data.latitudeLocationTo,
      longtitude: data.longitudeLocationTo,
    },
  });

  const agentDetailFrom = new AgentDetail({
    phonenumber: data.phoneFrom,
    location: locationFrom._id,
    agent: agent._id,
    isMain: 1,
  });

  const agentDetailTo = new AgentDetail({
    phonenumber: data.phoneTo,
    location: locationTo._id,
    agent: agent._id,
    isMain: 1,
  });

  const mapXeThuong = new Map({
    agent: agent._id,
    type: data.mapTypeXeThuong,
    width: data.mapWidthXeThuong,
    height: data.mapHeightXeThuong,
    orderType: data.orderTypeXeThuong,
  });

  const mapXeGiuong = new Map({
    agent: agent._id,
    type: data.mapTypeXeGiuong,
    width: data.mapWidthXeGiuong,
    height: data.mapHeightXeGiuong,
    orderType: data.orderTypeXeGiuong,
  });

  // bat dau save()
  agent.save();

  var locationFromcheck = await Location.findOne({
    coords: {
      latitude: locationFrom.coords.latitude,
      longtitude: locationFrom.coords.longtitude,
    },
  });
  if (locationFromcheck) {
    agentDetailFrom.location = locationFromcheck._id;
  } else {
    locationFrom.save();
  }
  await agentDetailFrom.save();

  var locationTocheck = await Location.findOne({
    coords: {
      latitude: locationTo.coords.latitude,
      longtitude: locationTo.coords.longtitude,
    },
  });
  if (locationTocheck) {
    agentDetailTo.location = locationTocheck._id;
  } else {
    locationTo.save();
  }
  await agentDetailTo.save();

  let length = data.locationAddNew.length;
  for (let i = 0; i < length; i++) {
    const locationNew = new Location({
      address: data.locationAddNew[i],
      coords: {
        latitude: data.latitudeLocationAddNew[i],
        longtitude: data.longitudeLocationAddNew[i],
      },
    });

    const agentDetailNew = new AgentDetail({
      phonenumber: data.phoneAddNew[i],
      location: locationNew._id,
      agent: agent._id,
      isMain: 0,
    });

    var locationNewcheck = await Location.findOne({
      coords: {
        latitude: locationNew.coords.latitude,
        longtitude: locationNew.coords.longtitude,
      },
    });
    if (locationNewcheck) {
      agentDetailNew.location = locationNewcheck._id;
    } else {
      locationNew.save();
    }
    await agentDetailNew.save();
  }

  await mapXeThuong.save();
  await mapXeGiuong.save();
  res.status(200).json({
    message: "Data save changed successfully!",
  });
});

router.patch("/agent/:agent_id", async (req, res) => {
  var agentdata = req.body;
  Agent.findById(req.params.agent_id, function (err, agent) {
    for (let i in agentdata) {
      agent[i] = agentdata[i];
    }
    agent
      .save()
      .then(() => {
        res.status(200).json({
          message: "Agent changed successfully!",
        });
      })
      .catch((error) => {
        res.status(500).json({
          error: error,
        });
      });
  });
});

router.delete("/agent/:agent_id", async (req, res) => {
  Agent.findByIdAndRemove(req.params.agent_id)
    .exec()
    .then((doc) => {
      if (!doc) {
        return res.status(404).end();
      }
      return res.status(200).json({
        message: "Agent delete successfully!",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

router.post("/agent/coupon", async (req, res) => {
  const payload = req.body;
  // console.log(payload);
  const coupon = await Coupon.findById(payload.couponId);
  const agent = await Agent.findById(payload.agentId);
  // console.log(agent);
  // console.log(coupon);
  if (agent && coupon) {
    const agentCoupon = agent.coupons.filter((e) => e._id === payload.couponId);
    console.log(agentCoupon);
    if (agentCoupon.length !== 0)
      return res.status(422).send({ message: "Agent already has this coupon" });
    else {
      Agent.findByIdAndUpdate(
        agent._id,
        {
          $push: { coupons: coupon._id },
        },
        { upsert: false },
        function (err, doc) {
          if (err) return res.status(500).send({ error: err });
          res.status(200).send(doc);
        }
      );
    }
  } else {
    res.status(422).send({ message: "No agent or coupon found" });
  }
});

// router.get("/agent/coupon", async (req, res) => {
//   const agentIds = req.body;
//   let objAgents = [];
//   agentIds.forEach(agentId => {
//     objAgents.push(mongoose.Schema.Types.ObjectId(agentId));
//   });

//   const agents = await Agent.find({
//     _id: {
//       $in: objAgents
//     }
//   })
//   if (agents) {
//     console.log(agents.)
//     // const coupons = agent.coupons;
//     // if (coupons) {
//     //   return res.status(200).send({ agentCoupons: coupons });
//     // } else {
//     //   return res.send({ message: "No coupons found!" });
//     // }
//   }
// });

module.exports = router;
