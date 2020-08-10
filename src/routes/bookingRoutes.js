const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const axios = require("axios");
const { start } = require("repl");
const moment = require("moment");
const nodemailer = require("nodemailer");
const Nexmo = require("nexmo");
const _ = require("lodash");

const Booking = mongoose.model("Booking");
const Route = mongoose.model("Route");
const RouteDeparture = mongoose.model("RouteDeparture");
const RouteSchedule = mongoose.model("RouteSchedule");
const Const = mongoose.model("Const");
const Coupon = mongoose.model("Coupon");
const Payment = mongoose.model("Payment");

const router = express.Router();

var partnerCode = "MOMOX3LR20200621";
var accessKey = "6pnCTPbCaPV5wew2";
var serectkey = "ZmdAGeuX53DbdXPGrrISDEzRngk2QRwg";
var orderInfo = "Thanh toán bằng Momo";
// var returnUrl = "";
var notifyurl = "https://878860a01230.ngrok.io/booking/momo_ipn";
var requestType = "captureMoMoWallet";
var storeId = "gVOSOzYsIuCrf8cejBG4";
var extraData = "";

var transporter = nodemailer.createTransport({
  // config mail server
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "16110291@student.hcmute.edu.vn", //Tài khoản gmail vừa tạo
    pass: "dieu0586060734", //Mật khẩu tài khoản gmail vừa tạo
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

const nexmo = new Nexmo({
  apiKey: "a599ecb4",
  apiSecret: "fe5pT8bv2KhtG8K7",
});

const makeCode = (length) => {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const confirmPayment = async (bookingCode) => {
  var bookings = await Booking.find({ bookingCode: bookingCode });
  console.log("Update Payment");
  // console.log(bookings);
  if (bookings.length === 0) {
    return 422;
  }
  try {
    for (let booking of bookings) {
      var coupon;
      var discountRate = 0;
      if (!booking.coupon) {
        coupon = null;
      } else {
        var coupon = await Coupon.findById(booking.coupon);
        if (!coupon) {
          coupon = null;
        } else {
          discountRate = coupon.discountRate;
        }
      }
      let pricePayment = booking.price * ((100 - discountRate) / 100);
      var payment = new Payment({
        booking: booking,
        amount: pricePayment,
        coupon: coupon,
      });

      var constSeats = await Const.findOne({
        type: "trang_thai_ghe",
        value: "da_dat",
      });
      booking.seatStatus = constSeats;
      booking.save();
      // console.log(payment);
      payment.save();
    }
    const from = "TieuDan Booking";
    let to;
    if (userInformation.phoneNumber[0] === "+") {
      to = "0" + bookings[0].bookingInformation.phonenumber.slice(3);
    } else {
      to = bookings[0].bookingInformation.phonenumber;
    }
    const text =
      "Bạn đã thanh toán thành công! Mã đặt chỗ của bạn là " +
      bookingCode +
      ". Xin vui lòng đến trạm đón trước 30 phút để khởi hành!";

    nexmo.message.sendSms(from, to, text);

    var BookingItemHtml = "";
    let group = _.groupBy(bookings, "routeDeparture._id");
    const groupData = Object.values(group);

    for (let booking of groupData) {
      const provinceName = (location) => {
        var n = location.split(",");
        return n[n.length - 2];
      };
      let seats = [];
      for (let item of booking) {
        seats.push(item.seatNumber);
      }
      BookingItemHtml +=
        '<table style="border-collapse: collapse; background-color: #fff;width: 100%;">                    <tr>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;" align="center">                            <p style="margin: 0; color: #5c5c5c;" >GHẾ</p>                            <p style="margin: 0;">' +
        seats.toString() +
        '</p>                            <p style="margin: 0; color: #5c5c5c;" ><small>(Xem mặt vé từ hãng)</small></p>                        </td>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px; font-size: 28px; vertical-align: middle;text-align: center;" colspan="2">                            <span style="color: #5c5c5c;" >Từ</span>                            <span style="font-weight: bold;">' +
        provinceName(booking[0].startLocation) +
        '</span>                             <span style="color: #5c5c5c;" >đến</span>                             <span style="font-weight: bold;" >' +
        provinceName(booking[0].endLocation) +
        '</span>                        </td>                      </tr>                    <tr>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px; text-align: center;">                            <p style="margin: 0; color: #5c5c5c;" >' +
        booking[0].routeDeparture.route.vehicle.agent.name +
        '</p>                        </td>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;">                            <p style="margin: 0; color: #5c5c5c;" >' +
        booking[0].startLocation.split(",", 1) +
        '</p>                            <div>                                <div style="float:left; width: 50%;" >                                    <span style="font-size: 28px;" >' +
        booking[0].startDate.substr(11, 5) +
        '</span>                                </div>                                <div style="float:right; width: 50%;" >                                    <p style="margin: 0;">' +
        booking[0].startDate.substr(3, 2) +
        '</p>                                    <p style="margin: 0;"><small>Tháng ' +
        booking[0].startDate.substr(0, 2) +
        ", " +
        booking[0].startDate.substr(6, 4) +
        '</small></p>                                </div>                            </div>                        </td>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;">                            <p style="margin: 0; color: #5c5c5c;" >' +
        booking[0].endLocation.split(",", 1) +
        '</p>                            <div>                                <div style="float:left; width: 50%;" >                                    <span style="font-size: 28px;">' +
        booking[0].endDate.substr(11, 5) +
        '</span>                                </div>                                <div style="float:right; width: 50%;" >                                    <p style="margin: 0;">' +
        booking[0].startDate.substr(3, 2) +
        '</p>                                    <p style="margin: 0;"><small>' +
        booking[0].endDate.substr(0, 2) +
        ", " +
        booking[0].endDate.substr(6, 4) +
        "</small></p>                                </div>                            </div>                        </td>                    </tr>                </table>";
    }

    const mailOptions = {
      from: "16110291@student.hcmute.edu.vn", // sender address
      to: userInformation.email,
      subject: "Thông báo thanh toán thành công", // Subject line
      html:
        '<!DOCTYPE html>        <html lang="en">       <head>            <meta charset="UTF-8">            <meta name="viewport" content="width=device-width, initial-scale=1.0">            <title>Email template</title>        </head>        <body>            <div style="font-family: Arial, Helvetica, sans-serif;background-color: #f1f1f1;padding: 16px;">                <table style="border-collapse: collapse; background-color: #fff;width: 100%; display: block;margin-bottom: 32px;">                    <tr style="font-size: 28px;">                        <td style="vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;" colspan="2">                            <span style="color: #5c5c5c;" >THÔNG TIN QUAN TRỌNG</span>                        </td>                        <td style="vertical-align: top;border: 1px solid #a7a6a6; padding: 12px; color: #5c5c5c;" align="right">                            <span>MÃ THANH TOÁN: <span style="color:red;">' +
        payload.bookingCode +
        '</span></span>                        </td>                    </tr>                    <tr>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;">                            <p style="margin: 0; color: #5c5c5c;" >THỜI HẠN THANH TOÁN</p>                            <p style="margin: 0; font-weight: bold; color: orange; font-size: 20px; display: block;margin: 8px 0;">Đã thanh toán</p>                            <small style="font-weight: bold; color:red; display: block;margin-bottom: 4px;" ></small>                            <p style="margin: 0;"><small style="color: #5c5c5c;"><i>Quý khách cần đảm bảo thanh toán trước thời hạn trên (hiển thị theo khung 24h).</i></small></p>                        </td>                        <td style="vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;">                            <p style="margin: 0; color: #5c5c5c;" class="text-dark">MÃ ĐẶT CHỖ DÙNG ĐỂ TRA CỨU VÀ THANH TOÁN</p>                            <p style="margin: 0; font-weight: bold; color:red; font-size: 20px; display: block;margin: 8px 0;">+ ' +
        payload.bookingCode +
        '</p>                            <p style="margin: 0;"><small style="color: #5c5c5c;" class="text-dark"><i>Thực hiện trước thời hạn 60 phút (Nếu thanh toán tại cửa hàng tiện lợi).</i></small></p>                        </td>                        <td style="vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;">                            <p  style="margin: 0; color: #5c5c5c;" >SỐ TIỀN THANH TOÁN</p>                            <p style="margin: 0; font-weight: bold; color:red; font-size: 20px; display: block;margin: 8px 0;">' +
        amount +
        '</p>                            <p style="margin: 0;"><small  style="color: #5c5c5c;" ><i>Thanh toán xác số tiền phải trả trong mọi trường hợp.</i></small></p>                        </td>                    </tr>                </table>     ' +
        BookingItemHtml +
        '           <table style="border-collapse: collapse; background-color: #fff;width: 100%; margin-top: 32px;">                    <tr>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;">                            <span style="color: #5c5c5c; font-size: 28px;">HÀNH KHÁCH</span>                        </td>                    </tr>                    <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;" align="center">                        <span style="border: 1px solid #a7a6a6;border-radius: 16px;padding:4px 8px;margin-bottom: 4px;display: inline-block; font-style: italic; color: #5c5c5c;" >' +
        userInformation.name +
        '</span>                        <p style="margin: 0; color: #5c5c5c;" ><small>' +
        userInformation.phoneNumber +
        '</small></p>                        <p style="margin: 0; color: #5c5c5c;" ><small>' +
        userInformation.email +
        '</small></p> <p style="margin: 0; color: #5c5c5c;" ><small>' +
        userInformation.identityId +
        "</small></p>                    </td>                </table>            </div>        </body>        </html>",
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log(err);
        // res.flash("mess", "Lỗi gửi mail: " + err); //Gửi thông báo đến người dùng
      } else {
        console.log("Message sent: " + info.response);
        // req.flash("mess", "Một email đã được gửi đến tài khoản của bạn"); //Gửi thông báo đến người dùng
        // res.redirect("/");
      }
    });

    return 200;
  } catch (error) {
    console.log(error);
    return 500;
  }
};

router.post("/booking/req_momo", async (req, res) => {
  const payload = req.body;
  // console.log("Request momo: " + JSON.stringify(payload));
  // console.log("Request momo: " + payload);

  // console.log("Request momo:" + payload.bookingId);
  // let amount = 0;
  // payload.routeDetail.forEach(function (value, index) {
  //   amount = value.price * payload.seats[index].length;
  // });
  var rawSignature =
    "partnerCode=" +
    partnerCode +
    "&accessKey=" +
    accessKey +
    "&requestId=" +
    payload.orderId +
    "&amount=" +
    payload.amount.toString() +
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
  // console.log("--------------------SIGNATURE----------------");
  // console.log(signature);
  //Send the request and get the response
  var body = JSON.stringify({
    partnerCode: partnerCode,
    accessKey: accessKey,
    requestId: payload.orderId,
    amount: payload.amount.toString(),
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
      // console.log(response.data);
    }
  } catch (err) {
    res.status(404).send(err);
  }
});

router.post("/booking/req_pos", async (req, res) => {
  console.log("REQ_POS");
  const payload = req.body;
  const storeSlug = partnerCode + "-" + storeId;
  // let amount = 0;
  // payload.routeDetail.forEach(function (value, index) {
  //   amount = value.price * payload.seats[index].length;
  // });
  var rawSignature =
    "storeSlug=" +
    storeSlug +
    "&amount=" +
    payload.amount.toString() +
    "&billId=" +
    payload.orderId;
  // console.log("--------------------RAW SIGNATURE----------------");
  // console.log(rawSignature);
  var signature = crypto
    .createHmac("sha256", serectkey)
    .update(rawSignature)
    .digest("hex");
  // console.log("--------------------SIGNATURE----------------");
  // console.log(signature);
  const QRUri =
    "https://test-payment.momo.vn/pay/store/" +
    storeSlug +
    "?a=" +
    payload.amount.toString() +
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
    const groupBookingCodes = await Booking.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: "$bookingCode",
        },
      },
    ]);
    // console.log(groupBookingCodes.length);
    let results = [];
    if (groupBookingCodes.length !== 0) {
      for (let code of groupBookingCodes) {
        const groupBooking = await Booking.aggregate([
          {
            $match: {
              bookingCode: code._id,
            },
          },
          {
            $group: {
              _id: "$_id",
              bookingCode: { $first: "$bookingCode" },
              userInformation: { $first: "$bookingInformation" },
              price: { $first: "$price" },
              seatNumber: { $first: "$seatNumber" },
              seatStatus: { $first: "$seatStatus" },
              routeDeparture: { $first: "$routeDeparture" },
              status: { $first: "$status" },
              cancelDate: { $first: "$cancelDate" },
              paymentType: { $first: "$paymentType" },
              qrCode: { $first: "$qrCode" },
              coupon: { $first: "$coupon" },
              startLocation: { $first: "$startLocation" },
              endLocation: { $first: "$endLocation" },
              startDate: { $first: "$startDate" },
              endDate: { $first: "$endDate" },
              reviewed: { $first: "$reviewed" },
            },
          },
        ]);
        if (groupBooking.length !== 0) {
          const bookings = await Booking.populate(groupBooking, {
            path: "seatStatus status routeDeparture coupon",
            populate: {
              path: "route",
              model: "Route",
              populate: {
                path: "startLocation endLocation vehicle",
                populate: { path: "type agent" },
              },
            },
          });
          bookings.sort(function (a, b) {
            const TimeA = moment(a.startDate, "MM/DD/YYYY hh:mm");
            const TimeB = moment(b.startDate, "MM/DD/YYYY hh:mm");
            return TimeA.get() - TimeB.get();
          });
          // console.log(bookings);
          results.push(bookings);
        }
      }
    }
    res.status(200).send(results);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/booking", async (req, res) => {
  const payload = req.body;
  const bookingDetail = payload.bookingDetail;
  const bookingInformation = payload.bookingInformation;
  const userId = payload.userId;
  // console.log(req.body);

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

  for (let e of bookingDetail) {
    let departureId = e.departureId;
    // console.log(startTime);
    if (!departureId) {
      let departureDate = new Date(e.startDate);
      // console.log(departureDate.getDate());
      // console.log(e._id);
      const routeSchedule = RouteSchedule.findOne({
        route: e._id,
        dayOfWeek: departureDate.getDay(),
      });
      const routeDeparture = new RouteDeparture({
        route: e._id,
        routeSchedule: routeSchedule._id,
        departureDate: departureDate,
        status: statusRoute,
      });
      routeDeparture.save();
      departureId = routeDeparture._id;

      // console.log(departureId);
    }
    try {
      for (let seat of e.seats) {
        const bookingInfo = {
          routeDeparture: departureId,
          seatNumber: seat.seatNumber,
          price: e.price,
          user: userId,
          bookingInformation: bookingInformation,
          seatStatus: constSeats,
          status: constBooking,
          bookingCode: bookingCode,
          startLocation: e.startLocation,
          endLocation: e.endLocation,
          startDate: e.startDate,
          endDate: e.endDate,
        };
        // console.log(bookingInfo);
        const booking = new Booking(bookingInfo);
        booking.save();
      }
      // console.log(booking);
    } catch (error) {
      res.status(502).send(error.response);
    }
  }
  return res.status(200).send({
    bookingCode: bookingCode,
  });
});

router.post("/booking/momo_ipn", async (req, res) => {
  const payload = req.body;
  console.log("MOMO IPN: ");
  console.log(req.body);
  // console.log("It goes here");
  if (payload.errorCode === "0") {
    // console.log(payload.orderId);
    const response = await confirmPayment(payload.orderId);
    if (response) {
      console.log(response);
    }
  }
  if (payload.status_code === "0") {
    // console.log(payload.orderId);
    const response = await confirmPayment(payload.order_Id);
    if (response) {
      console.log(response);
    }
  }
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
    const respRawSignature = `partnerCode=${payload.partnerCode}&accessKey=${payload.accessKey}&requestId=${payload.requestId}
    &orderId=${payload.orderId}&errorCode=${payload.errorCode}&message=${payload.message}
    &responseTime=${payload.responseTime}&extraData=${payload.extraData}`;
    const respSignature = crypto
      .createHmac("sha256", serectkey)
      .update(respRawSignature)
      .digest("hex");
    res.header({ "Content-Type": "application/json;charset=UTF-8" });
    res.status(200).send(respSignature);
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

router.post("/booking/saveQR", async (req, res) => {
  const payload = req.body;

  // console.log("Saved QR");
  // console.log(payload.bookingCode);
  try {
    await Booking.updateMany(
      { bookingCode: payload.bookingCode },
      { qrCode: payload.uri },
      function (err) {
        if (err) res.send({ error: err });
      }
    );
    res.status(200).send({ message: "Saved!" });
  } catch (error) {
    res.status(422).send(error);
  }
});

router.post("/booking/update", async (req, res) => {
  const payload = req.body;
  const paymentType = payload.paymentType;
  const userInformation = payload.userInformation;
  let expiredBooking;
  let amount = 0;

  const bookings = await Booking.find({
    bookingCode: payload.bookingCode,
  }).populate({
    path: "routeDeparture",
    populate: {
      path: "route",
      model: "Route",
      populate: {
        path: "vehicle",
        populate: { path: "agent" },
      },
    },
  });

  try {
    //Update Payment Type
    await Booking.updateMany(
      { bookingCode: payload.bookingCode },
      { paymentType: paymentType },
      function (err) {
        if (err) res.send({ error: err });
      }
    );

    //Update coupon for Booking item
    if (payload.coupon) {
      if (payload.coupon.userId) {
        await Booking.updateMany(
          { bookingCode: payload.bookingCode },
          { coupon: mongoose.Types.ObjectId(payload.coupon._id) },
          function (err) {
            if (err) res.send({ error: err });
          }
        );
      } else if (payload.coupon.agent) {
        if (bookings.length !== 0) {
          expiredBooking = bookings[0].bookingExpiredTime;
          let bookingIds = [];
          for (let booking of bookings) {
            amount +=
              booking.price -
              booking.price * (payload.coupon.discounRate / 100);
            if (
              booking.routeDeparture.route.vehicle.agent._id ==
              payload.coupon.agent
            ) {
              bookingIds.push(mongoose.Types.ObjectId(booking._id));
            }
          }
          await Booking.updateMany(
            {
              _id: { $in: bookingIds },
            },
            { coupon: mongoose.Types.ObjectId(payload.coupon._id) },
            function (err) {
              if (err) res.send(err);
            }
          );
        }
      }
    } else {
      for (let booking of bookings) {
        amount += booking.price;
      }
    }

    const from = "TieuDan Booking";
    let to;
    if (userInformation.phoneNumber[0] === "+") {
      to = "0" + userInformation.phoneNumber.slice(3);
    } else {
      to = userInformation.phoneNumber;
    }
    console.log(to);
    let text = "";
    if (paymentType !== "momo") {
      text =
        "Mã đặt chỗ của bạn là " +
        payload.bookingCode +
        ". Xin vui lòng thanh toán trước 11:30 ngày " +
        moment().add(1, "days").format("DD/MM/YYYY");
    } else {
      text = "Mã đặt chỗ của bạn là " + payload.bookingCode;
    }
    try {
      nexmo.message.sendSms(from, to, text);
    } catch (error) {
      console.log(error);
    }

    var BookingItemHtml = "";
    let group = _.groupBy(bookings, "routeDeparture._id");
    const groupData = Object.values(group);
    const provinceName = (location) => {
      var n = location.split(",");
      return n[n.length - 2];
    };
    for (let booking of groupData) {
      let seats = [];
      for (let item of booking) {
        seats.push(item.seatNumber);
      }
      BookingItemHtml +=
        '<table style="border-collapse: collapse; background-color: #fff;width: 100%;">                    <tr>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;" align="center">                            <p style="margin: 0; color: #5c5c5c;" >GHẾ</p>                            <p style="margin: 0;">' +
        seats.toString() +
        '</p>                            <p style="margin: 0; color: #5c5c5c;" ><small>(Xem mặt vé từ hãng)</small></p>                        </td>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px; font-size: 28px; vertical-align: middle;text-align: center;" colspan="2">                            <span style="color: #5c5c5c;" >Từ</span>                            <span style="font-weight: bold;">' +
        provinceName(booking[0].startLocation) +
        '</span>                             <span style="color: #5c5c5c;" >đến</span>                             <span style="font-weight: bold;" >' +
        provinceName(booking[0].endLocation) +
        '</span>                        </td>                      </tr>                    <tr>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px; text-align: center;">                            <p style="margin: 0; color: #5c5c5c;" >' +
        booking[0].routeDeparture.route.vehicle.agent.name +
        '</p>                        </td>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;">                            <p style="margin: 0; color: #5c5c5c;" >' +
        booking[0].startLocation.split(",", 1) +
        '</p>                            <div>                                <div style="float:left; width: 50%;" >                                    <span style="font-size: 28px;" >' +
        booking[0].startDate.substr(11, 5) +
        '</span>                                </div>                                <div style="float:right; width: 50%;" >                                    <p style="margin: 0;">' +
        booking[0].startDate.substr(3, 2) +
        '</p>                                    <p style="margin: 0;"><small>Tháng ' +
        booking[0].startDate.substr(0, 2) +
        ", " +
        booking[0].startDate.substr(6, 4) +
        '</small></p>                                </div>                            </div>                        </td>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;">                            <p style="margin: 0; color: #5c5c5c;" >' +
        booking[0].endLocation.split(",", 1) +
        '</p>                            <div>                                <div style="float:left; width: 50%;" >                                    <span style="font-size: 28px;">' +
        booking[0].endDate.substr(11, 5) +
        '</span>                                </div>                                <div style="float:right; width: 50%;" >                                    <p style="margin: 0;">' +
        booking[0].endDate.substr(3, 2) +
        '</p>                                    <p style="margin: 0;"><small>' +
        booking[0].endDate.substr(0, 2) +
        ", " +
        booking[0].endDate.substr(6, 4) +
        "</small></p>                                </div>                            </div>                        </td>                    </tr>                </table>";
    }

    const mailOptions = {
      from: "16110291@student.hcmute.edu.vn", // sender address
      to: userInformation.email,
      subject: "Thông báo đặt vé thành công", // Subject line
      html:
        '<!DOCTYPE html>        <html lang="en">       <head>            <meta charset="UTF-8">            <meta name="viewport" content="width=device-width, initial-scale=1.0">            <title>Email template</title>        </head>        <body>            <div style="font-family: Arial, Helvetica, sans-serif;background-color: #f1f1f1;padding: 16px;">                <table style="border-collapse: collapse; background-color: #fff;width: 100%; display: block;margin-bottom: 32px;">                    <tr style="font-size: 28px;">                        <td style="vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;" colspan="2">                            <span style="color: #5c5c5c;" >THÔNG TIN QUAN TRỌNG</span>                        </td>                        <td style="vertical-align: top;border: 1px solid #a7a6a6; padding: 12px; color: #5c5c5c;" align="right">                            <span>MÃ THANH TOÁN: <span style="color:red;">' +
        payload.bookingCode +
        '</span></span>                        </td>                    </tr>                    <tr>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;">                            <p style="margin: 0; color: #5c5c5c;" >THỜI HẠN THANH TOÁN</p>                            <p style="margin: 0; font-weight: bold; color: orange; font-size: 20px; display: block;margin: 8px 0;">Chưa thanh toán</p>                            <small style="font-weight: bold; color:red; display: block;margin-bottom: 4px;" >' +
        moment(expiredBooking).format("hh:mm DD/MM/YYYY") +
        '</small>                            <p style="margin: 0;"><small style="color: #5c5c5c;"><i>Quý khách cần đảm bảo thanh toán trước thời hạn trên (hiển thị theo khung 24h).</i></small></p>                        </td>                        <td style="vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;">                            <p style="margin: 0; color: #5c5c5c;" class="text-dark">MÃ ĐẶT CHỖ DÙNG ĐỂ TRA CỨU VÀ THANH TOÁN</p>                            <p style="margin: 0; font-weight: bold; color:red; font-size: 20px; display: block;margin: 8px 0;"> ' +
        payload.bookingCode +
        '</p>                            <p style="margin: 0;"><small style="color: #5c5c5c;" class="text-dark"><i>Thực hiện trước thời hạn 60 phút (Nếu thanh toán tại cửa hàng tiện lợi).</i></small></p>                        </td>                        <td style="vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;">                            <p  style="margin: 0; color: #5c5c5c;" >SỐ TIỀN THANH TOÁN</p>                            <p style="margin: 0; font-weight: bold; color:red; font-size: 20px; display: block;margin: 8px 0;">' +
        amount +
        '</p>                            <p style="margin: 0;"><small  style="color: #5c5c5c;" ><i>Thanh toán xác số tiền phải trả trong mọi trường hợp.</i></small></p>                        </td>                    </tr>                </table>     ' +
        BookingItemHtml +
        '           <table style="border-collapse: collapse; background-color: #fff;width: 100%; margin-top: 32px;">                    <tr>                        <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;">                            <span style="color: #5c5c5c; font-size: 28px;">HÀNH KHÁCH</span>                        </td>                    </tr>                    <td style="text-align: center; vertical-align: top;border: 1px solid #a7a6a6; padding: 12px;" align="center">                        <span style="border: 1px solid #a7a6a6;border-radius: 16px;padding:4px 8px;margin-bottom: 4px;display: inline-block; font-style: italic; color: #5c5c5c;" >' +
        userInformation.name +
        '</span>                        <p style="margin: 0; color: #5c5c5c;" ><small>' +
        userInformation.phoneNumber +
        '</small></p>                        <p style="margin: 0; color: #5c5c5c;" ><small>' +
        userInformation.email +
        '</small></p> <p style="margin: 0; color: #5c5c5c;" ><small>' +
        userInformation.indentityId +
        "</small></p>                    </td>                </table>            </div>        </body>        </html>",
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log(err);
        // res.flash("mess", "Lỗi gửi mail: " + err); //Gửi thông báo đến người dùng
      } else {
        console.log("Message sent: " + info.response);
        // req.flash("mess", "Một email đã được gửi đến tài khoản của bạn"); //Gửi thông báo đến người dùng
        // res.redirect("/");
      }
    });
    res.status(200).send({ message: "Update successfully!" });
  } catch (error) {
    console.log(error);
    res.send({ message: error.response });
  }
});

router.post("/confirmPayment", async (req, res) => {
  const response = await confirmPayment(req.body.bookingCode);
  if (response === 200) {
    res.status(200).send({ message: "Confirmed Payment!" });
  } else if (response === 422) {
    res.status(422).send({ message: "Wrong booking code" });
  } else {
    res.status(500).send({ message: "Something went wrong!" });
  }
});

module.exports = router;
