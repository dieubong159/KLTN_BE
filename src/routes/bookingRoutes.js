const express = require("express");
const mongoose = require("mongoose");
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
// var returnUrl = "";
var notifyurl = "https://5947eba45346.ngrok.io/booking/momo_ipn";
var requestType = "captureMoMoWallet";
var extraData = "";

const makeCode = (length) => {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

router.post("/booking/req_momo", async (req, res) => {
  const payload = req.body;
  // console.log("Request momo: " + JSON.stringify(payload));
  // console.log("Request momo: " + payload);

  // console.log("Request momo:" + payload.bookingId);
  var amount = payload.routeDetail.price * payload.seats.length;
  var rawSignature =
    "partnerCode=" +
    partnerCode +
    "&accessKey=" +
    accessKey +
    "&requestId=" +
    payload.orderId +
    "&amount=" +
    amount.toString() +
    "&orderId=" +
    payload.orderId +
    "&orderInfo=" +
    orderInfo +
    "&returnUrl=" +
    payload.redirectUrl +
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
    requestId: payload.orderId,
    amount: amount.toString(),
    orderId: payload.orderId,
    orderInfo: orderInfo,
    returnUrl: payload.redirectUrl,
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
      console.log(response.data);
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

router.get("/booking/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const booking = await Booking.find({ user: userId })
      .populate("status")
      .populate({
        path: "routeDeparture",
        populate: {
          path: "route",
          model: "Route",
          populate: {
            path: "startLocation endLocation vehicle",
            populate: { path: "type agent" },
          },
        },
      });
    if (booking) {
      res.status(200).send(booking);
    }
  } catch (error) {
    res.send(error);
  }
});

router.post("/booking", async (req, res, next) => {
  const payload = req.body;
  const bookingDetail = payload.bookingDetail;
  const bookingInformation = payload.bookingInformation;
  const userId = payload.userId;
  let bookingCode;
  var orderId;

  var statusRoute = await Const.findOne({
    type: "trang_thai_hanh_trinh",
    value: "chua_di",
  });
  var constSeats = await Const.findOne({
    type: "trang_thai_ghe",
    value: "giu_cho",
  });
  var constBooking = await Const.findOne({
    type: "trang_thai_dat_cho",
    value: "cho",
  });

  try {
    var booking = [0];
    while (booking.length > 0) {
      bookingCode = makeCode(5);
      booking = await Booking.find({
        bookingCode: bookingCode,
        status: constBooking,
      });
    }
  } catch (error) {
    console.log("Check booking code exists: " + error);
  }

  bookingDetail.forEach(async (e) => {
    let departureId = e.departureId;
    if (!departureId) {
      let departureDate = new Date(e.startDate);
      // console.log(departureDate.getDate());
      // console.log(e._id);
      let routeSchedule = RouteSchedule.findOne({
        route: e._id,
        dayOfWeek: departureDate.getDay(),
      });
      const routeDeparture = new RouteDeparture({
        route: e._id,
        routeSchedule: (await routeSchedule)._id,
        departureDate: departureDate,
        status: statusRoute,
      });
      await routeDeparture.save();
      departureId = routeDeparture._id;
    }

    // var validroute = mongoose.Types.ObjectId.isValid(departureId);

    try {
      await e.seats.forEach((seat) => {
        const bookingInfo = {
          routeDeparture: departureId,
          seatNumber: seat.seatNumber,
          price: e.price,
          user: userId,
          bookingInformation: bookingInformation,
          seatStatus: constSeats,
          status: constBooking,
          bookingCode: bookingCode,
        };
        const booking = new Booking(bookingInfo);
        booking.save();
        orderId = booking._id;
      });
      // console.log(orderId);
    } catch (error) {
      console.log("Booking Error: " + error);
      res.status(502).send(error.response);
    }
  });
  // console.log(bookingCode);
  return res.status(200).send({ bookingCode: bookingCode, orderId: orderId });
});

router.post("/booking/momo_ipn", async (req, res) => {
  const payload = req.body;
  console.log("It goes here" + req.body);
  // console.log("It goes here");
  var rawSignature = `partnerCode=${payload.partnerCode}&accessKey=${payload.accessKey}&requestId=${payload.requestId}&amount=${payload.amount}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}&orderType=${payload.orderType}&transId=${payload.transId}&message=${payload.message}&localMessage=${payload.localMessage}&responseTime=${payload.responseTime}&errorCode=${payload.errorCode}&payType=${payload.payType}&extraData=${payload.extraData}`;
  // console.log("--------------------RAW SIGNATURE----------------");
  // console.log(rawSignature);
  var signature = crypto
    .createHmac("sha256", serectkey)
    .update(rawSignature)
    .digest("hex");
  if (signature === payload.signature) {
    // var io = req.app.get("socketIo");
    // var socketId = req.app.get("socketIoId");
    // io.to(socketId).emit("ipn", payload);
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

    // if (payload.errorCode === "0") {
    //   let paidTicket = await Booking.findOne({ _id: responseBody.orderId });
    //   if (paidTicket) {
    //     let relevantTicket = await Booking.find({
    //       bookingCode: paidTicket.bookingCode,
    //     });
    //     if (relevantTicket) console.log("Relevant Ticket: " + relevantTicket);
    //   }
    // }
  }
});

module.exports = router;
