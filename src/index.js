require("./models/User");
require("./models/Admin");
require("./models/Agent");
require("./models/Booking");
require("./models/Coupon");
require("./models/Location");
require("./models/Route");
require("./models/Schedule");
require("./models/SeatMap");
require("./models/Track");
require("./models/Vehicle");
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
const scheduleRoutes = require("./routes/scheduleRoutes");
const seatmapRoutes = require("./routes/seatmapRoutes");
const trackRoutes = require("./routes/trackRoutes");
const userRoutes = require("./routes/userRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");

const app = express();

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
// app.use(scheduleRoutes);
app.use(seatmapRoutes);
// app.use(trackRoutes);
// app.use(userRoutes);
app.use(vehicleRoutes);

const mongoUri =
  "mongodb+srv://dieubong159:dieu16110291@reactnative-obpke.mongodb.net/test?retryWrites=true&w=majority";

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("Connected to mongo instance!");
});

mongoose.connection.on("error", (err) => {
  console.error("Error connecting to mongo!", err);
});

app.get("/", requireAuth, (req, res) => {
  res.send(`Your email is ${req.user.email}`);
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
