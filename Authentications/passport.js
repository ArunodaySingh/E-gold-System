const express = require('express');
const app = express();
const passport = require("passport");
const user = require("../database/Scheme/user");

module.exports = (passport) => {

    passport.use(user.createStrategy());
    passport.serializeUser(user.serializeUser());
    passport.deserializeUser(user.deserializeUser());

}


