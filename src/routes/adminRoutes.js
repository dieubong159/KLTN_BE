var express = require("express");
var router = express.Router();
const AdminModel = require("../models/Admin");

router.post("/createadmin", async (req, res) => {
    AdminModel.createAdmin(req.body).then(result => {
        res.status(201).send({
            id: result._id
        });
    });
});

router.get("/admin/:admin_id",async (req, res) => {
    AdminModel.findById(req.params.admin_id).then(result => {
        res.status(200).send(result);
      });
});