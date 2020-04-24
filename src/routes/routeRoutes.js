const express = require("express");
const mongoose = require("mongoose");

const Route = mongoose.model("Route");

const router = express.Router();

router.get("/routes", async (req, res) => {
  const routes = await Route.find();
  res.send(routes);
});

router.post("/routes", async (req, res) => {});
