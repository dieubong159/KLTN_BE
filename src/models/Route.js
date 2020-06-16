const mongoose = require("mongoose");

const routeSchema = mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
  },
  startTime: {
    type: String,
  },
  endTime: {
    type: String,
  },
  startLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  startProvince: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  endLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  endProvince: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  price: {
    type: Number,
  },
  isCorrectRoute:{
    type: Boolean
  }
});

const routeDetailSchema = mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
  },
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",
  },
  timeArrivingToStation:{
    type: Number
  },
  distanceToStation:{
    type:Number
  },
  orderRouteToStation:{
    type:Number
  }
});

const routeScheduleSchema = mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
  },
  dayOfWeek: {
    type: Number,
  },
});

const routeDepartureSchema = mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
  },
  routeSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RouteSchedule",
  },
  departureDate: {
    type: Date,
  },
});

mongoose.model("Route", routeSchema);
mongoose.model("RouteDetail", routeDetailSchema);
mongoose.model("RouteSchedule", routeScheduleSchema);
mongoose.model("RouteDeparture", routeDepartureSchema);