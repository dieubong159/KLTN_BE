const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const axios = require("axios");

const Booking = mongoose.model("Booking");
const Route = mongoose.model("Route");
const Const = mongoose.model("Const");

const router = express.Router();

// var endpoint = "https://test-payment.momo.vn/gw_payment/transactionProcessor";
// var hostname = "https://test-payment.momo.vn";
// var path = "/gw_payment/transactionProcessor";
var partnerCode = "MOMOX3LR20200621";
var accessKey = "6pnCTPbCaPV5wew2";
var serectkey = "ZmdAGeuX53DbdXPGrrISDEzRngk2QRwg";
var orderInfo = "Thanh toán bằng Momo";
var returnUrl = "exp://192.168.43.203:19000";
var notifyurl = "https://b0cef30944c2.ngrok.io/booking/momo_ipn";
var requestType = "captureMoMoWallet";
var extraData = "";

router.post("/booking/req_momo", async (req, res) => {
  const payload = req.body;
  console.log(payload);
  var rawSignature =
    "partnerCode=" +
    partnerCode +
    "&accessKey=" +
    accessKey +
    "&requestId=" +
    payload.bookingId +
    "&amount=" +
    payload.amount.toString() +
    "&orderId=" +
    payload.bookingId +
    "&orderInfo=" +
    orderInfo +
    "&returnUrl=" +
    returnUrl +
    "&notifyUrl=" +
    notifyurl +
    "&extraData=" +
    extraData;
  // console.log("--------------------RAW SIGNATURE----------------");
  // console.log(rawSignature);
  var signature = crypto
    .createHmac("sha256", serectkey)
    .update(rawSignature)
    .digest("hex");
  console.log("--------------------SIGNATURE----------------");
  console.log(signature);
  //Send the request and get the response
  var body = JSON.stringify({
    partnerCode: partnerCode,
    accessKey: accessKey,
    requestId: payload.bookingId,
    amount: payload.amount.toString(),
    orderId: payload.bookingId,
    orderInfo: orderInfo,
    returnUrl: returnUrl,
    notifyUrl: notifyurl,
    extraData: extraData,
    requestType: requestType,
    signature: signature,
  });
  try {
    const response = await axios.default.post(
      "https://test-payment.momo.vn/gw_payment/transactionProcessor",
      body
    );
    if (response.data) {
      res.status(200).send(response.data);
    }
  } catch (err) {
    res.status(404).send(err);
  }
});

router.post("/booking/checking_order_status", async (req, res) => {
  const payload = req.body;
  console.log(payload);
  var rawSignature =
    "partnerCode=" +
    partnerCode +
    "&accessKey=" +
    accessKey +
    "&requestId=" +
    payload.bookingId +
    "&orderId=" +
    payload.bookingId +
    "&requestType=transactionStatus";
  // console.log("--------------------RAW SIGNATURE----------------");
  // console.log(rawSignature);
  var signature = crypto
    .createHmac("sha256", serectkey)
    .update(rawSignature)
    .digest("hex");
  // console.log("--------------------SIGNATURE----------------");
  // console.log(signature);
  //Send the request and get the response
  var body = JSON.stringify({
    partnerCode: partnerCode,
    accessKey: accessKey,
    requestId: payload.bookingId,
    orderId: payload.bookingId,
    requestType: "transactionStatus",
    signature: signature,
  });
  try {
    const response = await axios.default.post(
      "https://test-payment.momo.vn/gw_payment/transactionProcessor",
      body
    );
    if (response.data) {
      console.log(response.data);
      res.status(200).send(response.data);
    }
  } catch (err) {
    res.status(404).send(err);
  }
});

router.get("/booking", async (req, res) => {
  const routes = await Booking.find();
  res.status(200).send(routes);
});

router.post("/booking", async (req, res, next) => {
  // console.log(req.body);
  const payload = req.body;

  var validroute = mongoose.Types.ObjectId.isValid(payload.route);
  console.log(validroute);

  if (validroute) {
    const routeExist = await Route.exists({ _id: payload.route });
    console.log(routeExist);
    if (!routeExist) {
      return res.status(500).json({
        error: "Route not exist",
      });
    }
  } else {
    return res.status(500).json({
      error: "Not a valid ID",
    });
  }

  var constSeats = await Const.findOne({
    type: "trang_thai_ghe",
    value: "giu_cho",
  });
  var constBooking = await Const.findOne({
    type: "trang_thai_dat_cho",
    value: "cho",
  });

  payload.seats.forEach((seat) => {
    const bookingInfo = {
      route: payload.route,
      seatNumber: seat.seatNumber,
      price: payload.price,
      bookingInformation: payload.bookingInformation,
      seatStatus: constSeats,
      status: constBooking,
    };
    const booking = new Booking(bookingInfo);
    console.log(booking);
    booking
      .save()
      .then(() => {
        return res.status(200).json({
          message: "Booking added successfully!",
        });
      })
      .catch((error) => {
        console.log(error);
        return res.status(500).json({
          error: error.response,
        });
      });
  });
});

router.post("/booking/momo_ipn", async (req, res) => {
  const payload = req.body;
  console.log(req.body);
  console.log("It goes here");
  const responseBody = {};
  responseBody.partnerCode = payload.partnerCode;
  responseBody.accessKey = payload.accessKey;
  responseBody.requestId = payload.requestId;
  responseBody.orderId = payload.orderId;
  responseBody.errorCode = payload.errorCode;
  responseBody.message = payload.message;
  responseBody.extraData = payload.extraData;
  responseBody.signature = payload.signature;
  res.header({ "Content-Type": "application/json;charset=UTF-8" });
  res.status(200).send(responseBody);
});

module.exports = router;
