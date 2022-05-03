var express = require('express');
const session = require("express-session");
var router = express.Router();
// var flash = require('connect-flash');
// const redirectHome = (req, res, next) => {
//     if (!req.session.username) {
//         res.redirect('/')
//     } else {
//         next()
//     }
// }

router.get('/', function (req, res, next) {

    res.render('login', {
        title: 'Login',
        error: '',
        userId: req.session.userId,
        username: req.session.username,
        firstname: req.session.firstname,
        lastname: req.session.lastname,
        email: req.session.email,
        phone: req.session.phone,
        gender: req.session.gender,
        country: req.session.country,
        city: req.session.city,
        dateRegister: req.session.dateRegister,
        role: req.session.role
    });
});

module.exports = router;