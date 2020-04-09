var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();
const AdminModel = require("../models/Admin");

const Admin = mongoose.model("Admin");

router.post("/createadmin", async (req, res, next) => {
    const admin = new Admin(req.body);
    if (!admin.isModified("password")) return next();
    bcrypt.genSalt(10, function (err, salt) {
        if (err) return next(err);
        bcrypt.hash(admin.password, salt, (err, hash) => {
            if (err) return next(err);
            admin.password = hash;
            admin.save().then(
                () => {
                    res.status(201).json({
                        message: 'Admin added successfully!'
                    });
                }
            ).catch(
                (error) => {
                    res.status(500).json({
                        error: error
                    });
                }
            );;
        });
    });
});

router.get("/admin/:admin_id", async (req, res) => {
    AdminModel.findById(req.params.admin_id).then(result => {
        res.status(200).send(result);
    });
});

router.get("/admin", async (req, res) => {
    let limit =
        req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10;
    let page = 0;
    if (req.query) {
        if (req.body.page) {
            req.query.page = parseInt(req.query.page);
            page = Number.isInteger(req.body.page) ? req.body.page : 0;
        }
    }
    AdminModel.listAdmin(limit, page).then(result => {
        res.status(200).send(result);
    });
});

module.exports = router;