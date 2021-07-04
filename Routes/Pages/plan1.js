const user = require("../../database/Scheme/user");

const plan1 = (req, res) => {
    const id = req.user._id;
    user.findOne({
        _id: id
    }, function (err, result) {

        if (err) {
            console.log(err);
        } else {
            if (result.kycvalue == 1) {
                res.render("allplan", {
                    data: result
                })
            } else {
                req.flash('success', 'Kindly First Verify The KYC');
                res.redirect('/kyc');
            }
        }

    })
}
module.exports = plan1;