var express = require("express");
var router = express.Router();
const AdminModel = require("../models/Admin");


router.post("/createadmin", async (req, res,next) => {
    AdminModel.createAdmin(req.body,next).then(result => {
        res.status(201).send({
            id: result._id,
            message: 'User added successfully!'
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