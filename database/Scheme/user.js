const mongoose = require('mongoose');
const passportlocalmongoose = require('passport-local-mongoose');

const Schema = new mongoose.Schema({
  email: {
    type: String,
    index: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  password: String,
  Subscription: String,
  name: String,
  contact: Number,
  img: {

    data: Buffer,
    contentType: String,
    msg: String,
    id: String
  },
  nom_img: {

    data: Buffer,
    contentType: String,
    msg: String,
    id: String
  },
  chatbot:
  {
    send: String,
    receive: String
  },
  kycmessage: String,
  kycvalue: Number
});
Schema.plugin(passportlocalmongoose);
module.exports = mongoose.model('usersauthentications2', Schema);