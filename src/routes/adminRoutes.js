var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();
var bcrypt = require("bcrypt");

const AdminModel = require("../models/Admin");

const Admin = mongoose.model("Admin");

router.post("/addadmin", async (req, res, next) => {
    const admin = new Admin(req.body);
    if (!admin.isModified("password")) {
        return next();
    }
    bcrypt.genSalt(10, function (err, salt) {
        if (err) return next(err);
        bcrypt.hash(admin.password, salt, (err, hash) => {
            if (err) return next(err);
            admin.password = hash;
            admin.save().then(
                () => {
                    res.status(200).json({
                        message: 'Admin added successfully!'
                    });
                }
            ).catch(
                (error) => {
                    res.status(500).json({
                        error: error
                    });
                }
            );
        });
    });
});

router.get("/admin/CheckUserName", async (req, res) => {
    var query = { username: req.body.username };
    Admin.find(query).then(result => {
        //result = result.toJSON();
        delete result.__v;
        res.status(200).send(result);
    });
});

router.get("/admin/:admin_id", async (req, res) => {
    Admin.findById(req.params.admin_id).then(result => {
        result = result.toJSON();
        delete result.__v;
        res.status(200).send(result);
    });
});

router.get("/admin", async (req, res) => {
    // let perPage =
    //     req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 200;
    // let page = 0;
    // if (req.query) {
    //     if (req.body.page) {
    //         req.query.page = parseInt(req.query.page);
    //         page = Number.isInteger(req.body.page) ? req.body.page : 0;
    //     }
    // }
    var listAdmin = await Admin.find()
        // .limit(perPage)
        // .skip(perPage * page)

    res.status(200).send(listAdmin);
});

router.patch("/admin/:admin_id", async (req, res, next) => {
    var userData = req.body;
    // if (userData.password) {
    //     bcrypt.genSalt(10, function (err, salt) {
    //         if (err) return next(err);
    //         bcrypt.hash(userData.password, salt, (err, hash) => {
    //             if (err) return next(err);
    //             userData.password = hash;
    //         });
    //     });
    // }
    Admin.findById(req.params.admin_id, function (err, user) {
        for (let i in userData) {
            user[i] = userData[i];
        }
        user.save().then(
            () => {
                res.status(200).json({
                    message: 'Admin changed successfully!'
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

router.delete("/admin/:admin_id", async (req, res) => {
    Admin
        .findByIdAndRemove(req.params.admin_id)
        .exec()
        .then(doc => {
            if (!doc) { return res.status(404).end(); }
            return res.status(200).json({
                message: 'Admin delete successfully!'
            });
        })
        .catch(
            (error) => {
                res.status(500).json({
                    error: error
                });
            }
        );
});

module.exports = router;