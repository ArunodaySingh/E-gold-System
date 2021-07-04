const crypto = require("crypto");
const user = require("../../database/Scheme/user");
const nodemailer = require("nodemailer");
const async = require("async");

exports.getreset = (req, res) => {
    res.render('reset', {
        expressFlash: req.flash('success')
    });
}
exports.postreset = (req, res, next) => {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            user.findOne({
                username: req.body.email
            }, function (err, user) {
                if (!user) {
                    req.flash('success', 'No account with that email address exists.');
                    return res.redirect('/reset');
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.USERNAME,
                    pass: process.env.PASSWORD
                }
            });
            var mailOptions = {
                to: user.username,
                from: process.env.USERNAME,
                subject: ' Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {

                req.flash('success', 'An e-mail has been sent to ' + user.username + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) console.log(err);;
        res.redirect('/reset');
    });
}