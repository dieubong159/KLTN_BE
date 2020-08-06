const express = require("express");
const Nexmo = require("nexmo");
const mongoose = require("mongoose");

const User = mongoose.model("User");

const router = express.Router();

const nexmo = new Nexmo({
  apiKey: "a599ecb4",
  apiSecret: "fe5pT8bv2KhtG8K7",
});

async function verify(number) {
  return new Promise(function (resolve, reject) {
    nexmo.verify.request(
      {
        number: number,
        brand: "TieuDan",
        code_length: 6,
        pin_expiry: 180,
        lg: "vi-vn",
      },
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

async function check(reqId, code) {
  return new Promise(function (resolve, reject) {
    nexmo.verify.check(
      {
        request_id: reqId,
        code: code,
      },
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

async function cancel(reqId) {
  return new Promise(function (resolve, reject) {
    nexmo.verify.control(
      {
        request_id: reqId,
        cmd: "cancel",
      },
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

router.post("/otp/verify/", async (req, res) => {
  const payload = await req.body;
  const phone = payload.phoneNumber;
  console.log(req.body);
  const user = await User.findOne({ phoneNumber: phone });
  if (user) {
    const result = await verify(phone);
    if (result.status === "0" || result.status === "10") {
      console.log(result);

      const reqId = result.request_id;
      res.status(200).json({ reqId: reqId, userId: user._id });
    }
  } else {
    res.status(422).send({ message: "The phone number does not exist" });
  }
});

router.post("/otp/check/", async (req, res) => {
  const payload = await req.body;
  console.log(payload);
  const code = payload.pin;
  const reqId = payload.reqId;

  const result = await check(reqId, code);
  console.log(result);

  if (result.status === "0") {
    const status = result.status;
    res.status(200).json({ status: status });
  } else {
    res.status(422).send({ message: "Wrong pin code" });
  }
});

router.post("/otp/cancel/", async (req, res) => {
  const payload = await req.body;
  const reqId = payload.reqId;

  const result = await cancel(reqId);
  res.status(200).send(result);
});

module.exports = router;
