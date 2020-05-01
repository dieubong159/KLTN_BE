var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();
var bcrypt = require("bcrypt");

const Agent = mongoose.model("Agent");

router.get("/agent", async (req, res) => {
  const routes = await Agent.find();
  res.status(200).send(routes);
});

router.get("/agent/:agent_id", async (req, res) => {
  Agent.findById(req.params.agent_id).then((result) => {
    result = result.toJSON();
    delete result.__v;
    res.status(200).send(result);
  });
});

router.post("/agent", async (req, res, next) => {
  const agent = new Agent(req.body);
  console.log(agent);
  if (!agent.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);
    bcrypt.hash(agent.password, salt, (err, hash) => {
      if (err) return next(err);
      agent.password = hash;
      agent
        .save()
        .then(() => {
          res.status(200).json({
            message: "Agent added successfully!",
          });
        })
        .catch((error) => {
          res.status(500).json({
            error: error,
          });
        });
    });
  });
});

router.patch("/agent/:agent_id", async (req, res) => {
  var agentdata = req.body;
  if (agentdata.password) {
      bcrypt.genSalt(10, function (err, salt) {
          if (err) return next(err);
          bcrypt.hash(agentdata.password, salt, (err, hash) => {
              if (err) return next(err);
              agentdata.password = hash;
          });
      });
  }
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
