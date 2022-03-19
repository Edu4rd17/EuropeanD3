// import {config} from "./configHide";
var createError = require('http-errors');
const express = require('express');
const session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const nodeMailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var registerRouter = require('./routes/register');
var loginRouter = require('./routes/login');
var customsRouter = require('./routes/customs');
var graphRouter = require('./routes/graph');
var userInfoRouter = require('./routes/userInfo');
var editDetailsRouter = require('./routes/editDetails');

const mysql = require("mysql");
const bcrypt = require("bcrypt");
const validator = require("validator");
const xss = require("xss");
const emojiStrip = require("emoji-strip");
const sqlString = require("sqlstring");

var app = express();

const HALF_HOUR = 1000 * 60 * 30

const {
    NODE_ENV = 'development',
    SESS_NAME = 'sid',
    SESS_SECRET = 'keyboard cat',
    SESS_LIFETIME = HALF_HOUR
} = process.env

const IN_PROD = NODE_ENV === 'production'

app.use(express.json())
//middleware to read req.body.<params>

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1);// trust first proxy
app.use(session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESS_SECRET,
    cookie: {
        maxAge: SESS_LIFETIME,
        samSite: true,
        secure: IN_PROD
    }
}))

app.use('/', indexRouter);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/customs', customsRouter);
app.use('/users', usersRouter);
app.use('/graph', graphRouter);
app.use('/userInfo', userInfoRouter);
app.use('/editDetails', editDetailsRouter);


const redirectLogin = (req, res, next) => {
    if (!req.session.username) {
        res.redirect('/login')
    } else {
        next()
    }
}

const transporter = nodeMailer.createTransport(sendGridTransport({
    auth: {
        api_key: "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"
    }
}))
app.post('/register', function (req, res) {

    // catch the username that was sent to us from the jQuery POST on the index.ejs page
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var username = req.body.username;
    var password = req.body.password;
    var confirmPassword = req.body.confirm_password;
    var email = req.body.email;
    var phone = req.body.phone;
    var gender = req.body.gender;
    var country = req.body.country;
    var city = req.body.city;

    var errorMessage = '';

    //get the library
    var validator = require('validator');
    //run the validator
    var emailValid = validator.isEmail(email); //true
    //check the response
    console.log(emailValid);

    if (email.length == '') {
        errorMessage += 'Please enter a valid email address!!<br>';
    } else if (emailValid == false) {
        errorMessage += 'Email address is not valid. Please enter a valid email address!!<br>';
    } else if (email.length > 40) {
        errorMessage += 'Email address is too long. Maximum length allowed it 40 characters!<br>';
    }

    if (password.length == '') {
        errorMessage += 'Please enter a password! <br>';
    } else if (password.length < 8) {
        errorMessage += 'Password too short. Minimum characters should be 8! <br>';
    } else if (password.length > 25) {
        errorMessage += 'Password too long. Maximum length allowed is 25 characters! <br>';
    }


    if (username.length == '') {
        errorMessage += 'Please enter a username! <br>';
    } else if (username.length < 6) {
        errorMessage += 'Username too short. Minimum characters should be 6! <br>';
    } else if (username.length > 15) {
        errorMessage += 'Username too long. Maximum length allowed is 15 characters! <br>';
    }

    var xss = require("xss");
    username = xss(username);

    var emojiStrip = require('emoji-strip');
    username = emojiStrip(username);

    var sqlString = require('sqlstring');
    var cleanedUsername = sqlString.escape(username);

    username = cleanedUsername;

    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPass = bcrypt.hashSync(password, salt);
    const hashConfirmPass = bcrypt.hashSync(confirmPassword, salt);

    password = hashPass;
    confirmPassword = hashConfirmPass;

    if (password !== confirmPassword) {
        errorMessage += 'Passwords do not match!';
    }

    //if the length of the error is > than 0 send back the error
    if (errorMessage.length > 0) {
        res.send(errorMessage);
    } else {

        var valid = true;
        var validator = require('validator');

        var response = validator.isEmail(email);

        if (response == false) {
            valid = false;
        }

        // Remember to check what database you are connecting to and if the
        // values are correct.
        const bcrypt = require('bcrypt');
        var mysql = require('mysql');
        var connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Database2001',
            database: 'majorproject'
        });
        // This is the actual SQL query part
        connection.query("INSERT INTO `majorproject`.`users` (`firstname`, `lastname`, `username`, `password`, `email`, `phone`, `gender`, `country`, `city`) VALUES ('" + firstname + "', '" + lastname + "', " + username + ", '" + password + "', '" + email + "', '" + phone + "', '" + gender + "', '" + country + "', '" + city + "');", function (error, results, fields) {
            if (error) throw error;

            transporter.sendMail({
                to: email,
                from: "iacobedy2001@gmail.com",
                subject: "Account created succesfull!",
                html: "<h1>Welcome to our app!</h1>"
            })
            res.send("Registered!");
            // res.redirect('/');
        });
        connection.end();
    }
});


app.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    var errorMessage = '';

    const bcrypt = require('bcrypt');
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Database2001',
        database: 'majorproject'
    });

    connection.connect();

    // This is the actual SQL query part
    // if (username && password) {
    connection.query("SELECT * FROM users WHERE username = ?", [username], function (error, result) {
        if (error) throw error;

        if (result.length === 0) {
            console.log("User does not exist!!");
            res.send(`${username} does not exist!!`);
        } else {
            const hashedPassword = result[0].password
            //get the hashedPassword from result
            var finalResult = bcrypt.compareSync(password, hashedPassword);

            if (finalResult === true) {
                req.session.username = username;
                req.session.userId = result[0].userId;
                req.session.firstname = result[0].firstname;
                req.session.lastname = result[0].lastname;
                req.session.email = result[0].email;
                req.session.phone = result[0].phone;
                req.session.gender = result[0].gender;
                req.session.country = result[0].country;
                req.session.city = result[0].city;
                req.session.dateRegister = result[0].dateRegister;

                console.log(req.session.firstname);
                res.send('Success');
                // if (req.session.username) {
                //     res.redirect('/');
                // }
            } else {
                res.send("Username or Password incorrect!")
                // res.redirect('/');
            }
        }
    });

    connection.end();

});

app.post('/editDetails', function (req, res) {
    var userId = req.session.userId;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var username = req.body.username;
    var email = req.body.email;
    var phone = req.body.phone;
    var gender = req.body.gender;
    var country = req.body.country;
    var city = req.body.city;

    var errorMessage = '';

    //get the library
    var validator = require('validator');
    //run the validator
    var emailValid = validator.isEmail(email); //true
    //check the response
    console.log(emailValid);

    if (email.length === '') {
        errorMessage += 'Please enter a valid email address!!<br>';
    } else if (emailValid === false) {
        errorMessage += 'Email address is not valid. Please enter a valid email address!!<br>';
    } else if (email.length > 40) {
        errorMessage += 'Email address is too long. Maximum length allowed it 40 characters!<br>';
    }


    if (username.length === '') {
        errorMessage += 'Please enter a username! <br>';
    } else if (username.length < 6) {
        errorMessage += 'Username too short. Minimum characters should be 6! <br>';
    } else if (username.length > 15) {
        errorMessage += 'Username too long. Maximum length allowed is 15 characters! <br>';
    }

    var xss = require("xss");
    username = xss(username);

    var emojiStrip = require('emoji-strip');
    username = emojiStrip(username);

    var sqlString = require('sqlstring');
    var cleanedUsername = sqlString.escape(username);

    username = cleanedUsername;
    //if the length of the error is > than 0 send back the error
    if (errorMessage.length > 0) {
        res.send(errorMessage);
    } else {

        var valid = true;
        var validator = require('validator');

        var response = validator.isEmail(email);

        if (response == false) {
            valid = false;
        }

        // Remember to check what database you are connecting to and if the
        // values are correct.
        const bcrypt = require('bcrypt');
        var mysql = require('mysql');
        var connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Database2001',
            database: 'majorproject'
        });
        // This is the actual SQL query part
        connection.query("UPDATE `majorproject`.`users` SET  `firstname` = '" + firstname + "', `lastname` = '" + lastname + "', `username` = " + username + ", `email` = '" + email + "', `phone` = '" + phone + "', `gender` = '" + gender + "', `country` = '" + country + "', `city` = '" + city + "' WHERE `userId` = '" + userId + "';", function (error, result, fields) {
            if (error) throw error;

            console.log("im here");


        });
        connection.end();
    }

    req.session.update();
    res.redirect('login');
});

app.post('/deleteAccount', function (req, res) {
    var userId = req.session.userId;

    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Database2001',
        database: 'majorproject'
    });
    // This is the actual SQL query part
    connection.query("DELETE FROM `majorproject`.`users` WHERE  `userId`= '" + userId + "';", function (error, results, fields) {
        if (error) throw error;

    });
    connection.end();

    req.session.destroy();
    res.redirect('login');
});


app.post('/logout', function (req, res) {
    req.session.destroy(error => {
        if (error) {
            return res.redirect('/');
        }
        res.clearCookie(SESS_NAME)
        res.redirect('/login');
    });
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
