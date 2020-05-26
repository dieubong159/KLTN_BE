var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();

const Const = mongoose.model("Const");

router.get("/const", async (req, res) => {
  const const_list = await Const.find();
  res.status(200).send(const_list);
});

router.get("/const/:const_id", async (req, res) => {
  Const.findById(req.params.const_id).then((result) => {
    result = result.toJSON();
    delete result.__v;
    res.status(200).send(result);
  });
});

router.post("/const", async (req, res) => {
  const const_item = new Const(req.body);
  const_item
    .save()
    .then(() => {
      res.status(200).send(const_item);
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

router.patch("/const/:const_id", async (req, res) => {
  Const.findById(req.params.const_id, function (err, result) {
    if (err) {
      res.status(500).json({ error: err });
    }
    var constData = req.body;
    for (let i in constData) {
        result[i] = constData[i];
    }
    result.save()
      .then(() => {
        res.status(200).json({
          message: "Const changed successfully!",
        });
      })
      .catch((error) => {
        res.status(500).json({
          error: error,
        });
      });
  });
});

router.delete("/const/:const_id", async (req, res) => {
  Const.findByIdAndRemove(req.params.const_id)
    .exec()
    .then((doc) => {
      if (!doc) {
        return res.status(404).end();
      }
      return res.status(200).json({
        message: "Const delete successfully!",
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

module.exports = router;
