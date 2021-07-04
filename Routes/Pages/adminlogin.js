const user = require("../../database/Scheme/user");
const plan1user = require("../../database/Scheme/plan1user");
const plan2user = require("../../database/Scheme/plan2user");

const adminlogin = (req, res) => {
    const name = req.body.username;
    const pass = req.body.password;
    if (name == process.env.ADMIN_EMAIL && pass == process.env.ADMIN_PASSWORD) {
        user.find({}, function (err, item) {
            if (!err) {
                plan1user.find().count(function (err, count) {
                    plan2user.find().count(function (err, count2) {

                        res.render("admindash", {
                            data: item,
                            plan1: count,
                            plan2: count2
                        });

                    });
                });
            }
        })
    } else {
        {
            res.render('adminlogin');
        }
    }
}
module.exports = adminlogin;