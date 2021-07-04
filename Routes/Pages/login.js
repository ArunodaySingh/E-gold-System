const user = require("../../database/Scheme/user");
const plan1user = require("../../database/Scheme/plan1user");
const plan2user = require("../../database/Scheme/plan2user");
const passport = require("passport");
const request = require("request");

exports.getlogin = (req, res) =>
    res.render('login', {
        expressFlash: req.flash('success')
    })
exports.postlogin = (req, res2) => {
    const isuser = new user({
        username: req.body.username,
        password: req.body.password
    })

    req.login(isuser, async function (err, result) {
        if (err) {

            res2.render('register');
        } else {

            passport.authenticate('local')(req, res2, async function (err, info, result) {
                console.log(err, info, result);
                await user.findOne({
                    _id: req.user._id

                }, (err, result) => {
                    console.log(err);

                    if (result) {

                        const arr = [];
                        var options = {
                            'method': 'GET',
                            'url': 'https://www.goldapi.io/api/XAU/INR',
                            'headers': {
                                'x-access-token': process.env.X_ACCESS_TOKEN,
                                'Content-Type': 'application/json'
                            }
                        };
                        //for goldapi
                        request(options, async function (error, response) {
                            if (error) throw new Error(error);
                            const convert = await JSON.parse(JSON.stringify(response.body))
                            const convert2 = await JSON.parse(convert);
                            plan2user.findOne({
                                custid: req.user._id
                            }, (err, res) => {

                                function func1() {
                                    return new Promise(function (resolve, reject) {
                                        if (res.c_amount.length > 0) {
                                            res.c_amount.forEach(function (item) {
                                                arr.push(item.gold_amt);
                                            })
                                            resolve();
                                        } else {
                                            reject();
                                        }
                                    })
                                }
                                func1().then(function () {
                                    plan1user.findOne({
                                        custid: req.user._id
                                    }, (err, result2) => {
                                        if (err) throw new Error
                                        if (result2) {
                                            res2.render("userdash", {
                                                data: result,
                                                price: convert2.price,
                                                premium: result2.premium_amount,
                                                noemi: result2.c_amount.length,
                                                arrgold: arr,
                                                key: 1
                                            })
                                        } else {

                                            res2.render("userdash", {
                                                data: result,
                                                price: convert2.price,
                                                premium: "null",
                                                noemi: "0",
                                                arrgold: arr,
                                                key: 2
                                            })

                                        }
                                    })
                                }).catch(function () {
                                    plan1user.findOne({
                                        custid: req.user._id
                                    }, (err, result2) => {
                                        const arr2 = [0]
                                        if (err) throw new Error
                                        if (result2) {

                                            res2.render("userdash", {
                                                data: result,
                                                price: convert2.price,
                                                premium: result2.premium_amount,
                                                noemi: result2.c_amount.length,
                                                arrgold: arr2,
                                                key: 3
                                            })
                                        } else {

                                            res2.render("userdash", {
                                                data: result,
                                                price: convert2.price,
                                                premium: "null",
                                                noemi: "0",
                                                arrgold: arr2,
                                                key: 4
                                            })

                                        }
                                    })
                                })
                            })
                        });
                    }
                });
            })
        }
    });
}
