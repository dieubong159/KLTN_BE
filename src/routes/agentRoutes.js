var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();

const Agent = mongoose.model("Agent");
const Map = mongoose.model("Map");
const Const = mongoose.model("Const");

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
  var orderTypes = await Const.find({ type: "kieu_xep_loai_danh_so" });
  res.send({ orderTypes: orderTypes });
});

router.post("/agent", async (req, res, next) => {
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
