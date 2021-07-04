const mongoose = require('mongoose');

const Schema2 = new mongoose.Schema({
    custid: String,
    name: String,
    email: String,
    phone: Number,
    registred_date: Date,
    c_amount: [{
        date: String,
        time: String,
        gold_amt: Number,
        paid_amt: Number
    }]

})
module.exports = mongoose.model('usersauthentications7', Schema2);