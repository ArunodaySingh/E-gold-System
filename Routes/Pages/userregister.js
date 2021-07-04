const passport = require("passport");
const user = require("../../database/Scheme/user");

exports.getregister = (req, res) => {
    res.render('register')
}
exports.postregister = (req, res) => {
    user.register({
        username: req.body.username,
        name: req.body.name,
        contact: req.body.contact,
        Subscription: "Not Yet"
    }, req.body.password, function (err) {
        if (err) {
            console.log(err);
            req.flash('success', 'Try again');
            return res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, function () {
                req.flash('success', 'Successfully Registered');
                return res.redirect('/login');
            })

        }
    })
}