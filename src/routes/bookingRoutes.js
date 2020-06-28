const express = require("express");
const mongoose = require("mongoose");
const https = require("https");
const crypto = require("crypto");
const axios = require("axios");

const Booking = mongoose.model("Booking");
const Route = mongoose.model("Route");
const RouteDeparture = mongoose.model("RouteDeparture");
const RouteSchedule = mongoose.model("RouteSchedule");
const Const = mongoose.model("Const");

const router = express.Router();

// var endpoint = "https://test-payment.momo.vn/gw_payment/transactionProcessor";
// var hostname = "https://test-payment.momo.vn";
// var path = "/gw_payment/transactionProcessor";
var partnerCode = "MOMOX3LR20200621";
var accessKey = "6pnCTPbCaPV5wew2";
var serectkey = "ZmdAGeuX53DbdXPGrrISDEzRngk2QRwg";
var orderInfo = "Thanh toán bằng Momo";
var returnUrl = "exp://ey-iy5.dieubong159.tlcn-bookingticket.exp.direct:80";
var notifyurl = "https://78846355a920.ngrok.io/booking/momo_ipn";
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
  console.log("--------------------RAW SIGNATURE----------------");
  console.log(rawSignature);
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

router.get("/booking", async (req, res) => {
  const routes = await Booking.find();
  res.status(200).send(routes);
});

router.post("/booking", async (req, res, next) => {
  const payload = req.body;
  // const booking = new Booking({
  //   routeuDeparture : payload.routeuDeparture,
  //   seatNumber: payload.seatNumber,
  //   price : payload.price
  // });

  let routeuDepartureData = payload.routeuDeparture;
  if(!payload.routeuDeparture){
    let departureDate = new Date(payload.departureDate);
    let routeSchedule = RouteSchedule.findOne({route: payload.route,dayOfWeek: departureDate.getDay()});
    const routeuDeparture = new RouteDeparture({
      route: payload.route,
      routeSchedule:routeSchedule._id,
      departureDate : departureDate
    });
    await routeuDeparture.save();
    routeuDepartureData = routeuDeparture._id;
  }

  var validroute = mongoose.Types.ObjectId.isValid(payload.routeuDeparture);
  console.log(validroute);

  if (validroute) {
    const routeExist = await RouteDeparture.exists({ _id: payload.routeuDeparture });
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
      routeuDeparture: routeuDepartureData,
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
  console.log(req.body);
  console.log("It goes here");
  // const payload = req.body;
  // console.log(payload);
  // res.status(200).send({ message: "da hell" });
  res.status(200);
});

module.exports = router;
