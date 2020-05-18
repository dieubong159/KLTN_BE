const mongoose = require("mongoose");

const currentDate = (sp) => {
  today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //As January is 0.
  var yyyy = today.getFullYear();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;
  return mm + sp + dd + sp + yyyy;
};

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
  endLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  status: {
    type: Number,
  },
  price: {
    type: Number,
  },
  departureDate: {
    type: String,
    default: currentDate("-"),
  },
});

mongoose.model("Route", routeSchema);
