var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();

const Agent = mongoose.model("Agent");
const Map = mongoose.model("Map");
const Const = mongoose.model("Const");
const AgentDetail = mongoose.model("AgentDetail");
const Location = mongoose.model("Location");

router.get("/agent", async (req, res) => {
  const agents = await Agent.find();
  res.status(200).send(agents);
});

// router.get("/agent/:agent_id", async (req, res) => {
//   // Agent.findById(req.params.agent_id).then((result) => {
//   //   result = result.toJSON();
//   //   delete result.__v;
//   //   res.status(200).send(result);
//   // });
// });

router.get("/agent/addAgentData", async (req, res) => {
  var vehicleAndOrderTypes = await Const.find({ 
    $or: [
      { type: "loai_xe" },
      { type: "kieu_xep_loai_danh_so" }
    ]
  });
  res.send({ 
    vehicleAndOrderTypes: vehicleAndOrderTypes
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
    cancelfee : data.cancelfee
  });

  const locationFrom = new Location({
    address : data.locationFrom,
    coords:{
      latitude: data.latitudeLocationFrom,
      longtitude: data.longitudeLocationFrom
    }
  });

  const locationTo = new Location({
    address : data.locationTo,
    coords:{
      latitude: data.latitudeLocationTo,
      longtitude: data.longitudeLocationTo
    }
  });

  const agentDetailFrom = new AgentDetail({
    phonenumber:data.phoneFrom,
    location:locationFrom._id,
    agent: agent._id
  });

  const agentDetailTo= new AgentDetail({
    phonenumber:data.phoneTo,
    location:locationTo._id,
    agent: agent._id
  });

  const mapXeThuong = new Map({
    agent: agent._id,
    type: data.mapTypeXeThuong,
    width:data.mapWidthXeThuong,
    height: data.mapHeightXeThuong,
    orderType: data.orderTypeXeThuong
  });

  const mapXeGiuong = new Map({
    agent: agent._id,
    type: data.mapTypeXeGiuong,
    width:data.mapWidthXeGiuong,
    height: data.mapHeightXeGiuong,
    orderType: data.orderTypeXeGiuong
  });

  // bat dau save()
  agent.save();

  var locationFromcheck = await Location.findOne({
    coords:{
      latitude: locationFrom.coords.latitude,
      longtitude: locationFrom.coords.longtitude
    }
  });
  if(locationFromcheck){
    agentDetailFrom.location = locationFromcheck._id;
  }
  else{
    locationFrom.save();
  }
  await agentDetailFrom.save();

  var locationTocheck = await Location.findOne({
    coords:{
      latitude: locationTo.coords.latitude,
      longtitude: locationTo.coords.longtitude
    }
  });
  if(locationTocheck){
    agentDetailTo.location = locationTocheck._id
  }
  else{
    locationTo.save();
  }
  await agentDetailTo.save();
  
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

module.exports = router;
