const mongoose = require('mongoose');

const Schema1 = new mongoose.Schema({
    custid: String,
    name: String,
    premium_amount: Number,
    emi_amount: Number,
    email: String,
    phone: Number,
    registred_date: Date,
    c_amount: [{
        date: String,
        time: String,
        paid_amt: Number
    }]

})
module.exports = mongoose.model('usersauthentications6', Schema1);