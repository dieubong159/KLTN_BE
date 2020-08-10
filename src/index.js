require("./models/User");
require("./models/Admin");
require("./models/Agent");
require("./models/Booking");
require("./models/Coupon");
require("./models/Location");
require("./models/Route");
require("./models/Station");
require("./models/SeatMap");
require("./models/Vehicle");
require("./models/Consts");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const requireAuth = require("./middlewares/requireAuth");
const adminRoutes = require("./routes/adminRoutes");
const agentRoutes = require("./routes/agentRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const couponRoutes = require("./routes/couponRoutes");
const locationRoutes = require("./routes/locationRoutes");
const routeRoutes = require("./routes/routeRoutes");
const stationRoutes = require("./routes/stationRoutes");
const seatmapRoutes = require("./routes/seatmapRoutes");
const userRoutes = require("./routes/userRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const otpRoutes = require("./routes/otpRoutes");
const constRoutes = require("./routes/constRoutes");
var port = process.env.PORT || 8080;

const app = express();

const http = require("http").Server(app);
const io = require("socket.io")(http);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.use(authRoutes);
app.use(adminRoutes);
app.use(agentRoutes);
app.use(bookingRoutes);
app.use(couponRoutes);
app.use(locationRoutes);
app.use(routeRoutes);
// app.use(stationRoutes);
app.use(seatmapRoutes);
// app.use(trackRoutes);
app.use(userRoutes);
app.use(vehicleRoutes);
app.use(otpRoutes);
app.use(constRoutes);
app.set("socketIo", io);

io.sockets.on("connect", (socket) => {
  const sessionID = socket.id;
  app.set("socketIoId", sessionID);
});

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => {
    console.log("Client Disconnected");
  });
});

const mongoUri =
  "mongodb+srv://dieubong159:dieu16110291@reactnative-obpke.mongodb.net/test?retryWrites=true&w=majority";

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

mongoose.connection.on("connected", () => {
  console.log("Connected to mongo instance!");
});

mongoose.connection.on("error", (err) => {
  console.error("Error connecting to mongo!", err);
});

// app.get("/", requireAuth, (req, res) => {
//   res.send(`Your email is ${req.user.email}`);
// });

http.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port 3000");
});
