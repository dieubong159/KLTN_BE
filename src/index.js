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

const app = express();

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hi there");
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
