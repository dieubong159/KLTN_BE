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
var storeId = "gVOSOzYsIuCrf8cejBG4";
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
  let amount = 0;
  payload.routeDetail.forEach(function (value, index) {
    amount = value.price * payload.seats[index].length;
  });
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

router.post("/booking/req_pos", async (req, res) => {
  const payload = req.body;
  const storeSlug = partnerCode + "-" + storeId;
  let amount = 0;
  payload.routeDetail.forEach(function (value, index) {
    amount = value.price * payload.seats[index].length;
  });
  var rawSignature =
    "storeSlug=" +
    storeSlug +
    "&amount=" +
    amount.toString() +
    "&billId=" +
    payload.orderId;
  // console.log("--------------------RAW SIGNATURE----------------");
  // console.log(rawSignature);
  var signature = crypto
    .createHmac("sha256", serectkey)
    .update(rawSignature)
    .digest("hex");
  console.log("--------------------SIGNATURE----------------");
  console.log(signature);
  const QRUri =
    "https://test-payment.momo.vn/pay/store/" +
    storeSlug +
    "?a=" +
    amount.toString() +
    "&b=" +
    payload.orderId +
    "&s=" +
    signature;
  res.status(200).send({ QRUri: QRUri });
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
  console.log(userId);
  try {
    const booking = await Booking.find({ user: userId })
      .populate("status seatStatus")
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
  // console.log(bookingDetail);

  let bookingCode;

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
  // console.log("Booking Detail:");
  // console.log(bookingDetail[0].seats);
  bookingDetail.forEach((e) => {
    let departureId = e.departureId;
    if (!departureId) {
      let departureDate = new Date(e.startDate);
      // console.log(departureDate.getDate());
      // console.log(e._id);
      RouteSchedule.findOne({
        route: e._id,
        dayOfWeek: departureDate.getDay(),
      })
        .then((result) => {
          const routeDeparture = new RouteDeparture({
            route: e._id,
            routeSchedule: result._id,
            departureDate: departureDate,
            status: statusRoute,
          });
          routeDeparture.save();
          departureId = routeDeparture._id;
        })
        .then(() => {
          console.log(departureId);
          try {
            e.seats.forEach((seat) => {
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
              // console.log(bookingInfo);
              const booking = new Booking(bookingInfo);
              booking.save();
              // console.log(booking);
              // orderId = booking._id;
              // bookingExpired = booking.bookingExpiredTime;
            });
            // console.log(booking);
          } catch (error) {
            res.status(502).send(error.response);
          }
        });
    }
  });
  return res.status(200).send({
    bookingCode: bookingCode,
  });
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
  }
});

router.post("/booking/cancelTicketByCode", async (req, res) => {
  var bookings = await Booking.find();
  bookings = bookings.filter((e) => e.bookingCode == req.body.bookingCode);

  if (!bookings) {
    return res.status(404).json({
      error: "Not a valid bookingCode",
    });
  }
  var statusBookingRemove = await Const.findOne({
    type: "trang_thai_dat_cho",
    value: "da_huy",
  });

  for (let booking of bookings) {
    booking.status = statusBookingRemove;
    booking.cancelDate = new Date();
    booking.save();
  }
  res.status(200).json({
    message: "Booking remove successfully!",
  });
});

router.post("/booking/cancelTicketById", async (req, res) => {
  var booking = await Booking.findById(req.body.ticketId);
  console.log(req.body.ticketId);
  if (!booking) {
    return res.status(404).json({
      error: "Not a valid bookingCode",
    });
  }

  var statusBookingRemove = await Const.findOne({
    type: "trang_thai_dat_cho",
    value: "da_huy",
  });
  try {
    booking.status = statusBookingRemove;
    booking.cancelDate = new Date();
    booking.save();
    // console.log(booking);
    res.status(200).json({
      message: "Booking remove successfully!",
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/booking/cancelBooking", async (req, res) => {
  try {
    await Booking.deleteMany({ bookingCode: req.body.bookingCode });
    res.status(200).send({ message: "Delete Successful!" });
  } catch (error) {
    res.send(error.response);
  }
});

router.post("/booking/update", async (req, res) => {
  const payload = req.body;
  try {
    await Booking.updateMany(
      { bookingCode: payload.bookingCode },
      { paymentType: payload.paymentType },
      function (err) {
        res.send({ error: err });
      }
    );
  } catch (error) {
    res.send({ message: error.response });
  }
});

module.exports = router;
