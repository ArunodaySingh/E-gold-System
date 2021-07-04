const getkyc = (req, res) => {
    res.render('fileupload', {
        expressFlash: req.flash('success'),
        expressFlash2: req.flash('success')
    })
}
module.exports = getkyc;