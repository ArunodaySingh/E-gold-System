const user = require("../../database/Scheme/user");

const formwithid = (req, res) => {
    const id = req.params.title;
    user.findOne({
        _id: id
    }, function (err, result) {
        res.render("userkyc", {
            item: result
        });
    })
}
module.exports = formwithid;