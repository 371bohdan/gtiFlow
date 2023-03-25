const {Router} = require('express');
const router = Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');
const passport = require('passport');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { AnalysWater } = require('../models/water');
require('dotenv').config();


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()) return next();
    res.redirect('/login');
}

function isLoggedOut(req, res, next){
    if(!req.isAuthenticated()) return next();
    res.redirect('/profile');
}


//Routes

// моя головна сторінка із профілем

router.get('/profile', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const water = await AnalysWater.find({});
        res.render('index', { title: "My List", user, water });
    } catch (error) {
        console.error(error);
        res.redirect('/login');
    }
});


// сторінка із авторизацією

router.get('/login', isLoggedOut, (req, res) => {
    let response = {
        title: "Login",
        error: req.query.error
    }
    res.render('login', { success_msg: req.flash('success_msg'), response});
})

router.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login?error=true'
}))

router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/login');
    });
});



// Сторінка для реєстрації

router.get('/register', async (req, res) => {
    res.render('register', {title: 'registration'});
})
router.post('/register', async (req, res) =>{
    const {username, email, password, password2} = req.body;

    let errors = [];

    if (!username || !email || !password || !password2){
        errors.push({
            msg: 'Please fill in all fields!'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({
          msg: 'Invalid email format'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      errors.push({
          msg: 'User with this email already exists'
      });
    }

    if(password !== password2){
        errors.push({
            msg: 'Passwords do not match'
        });
    }

    if(password.length < 8){
        errors.push({
            msg: 'Password should be at least 8 characters'
        });
    }

    if(errors.length > 0){
        res.render('register', {
            errors,
            username,
            email,
            password,
            password2
        });
    } else {
        try {
            const newUser = new User({
                username: username,
                email: email,
                password: password
            });

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newUser.password, salt);
            newUser.password = hash;

            await newUser.save();

            req.flash('success', 'You are now registered and can login');
            res.redirect('/login');
        } catch (error) {
            console.error(error);
            errors.push({
                msg: 'Server Error'
            });
            res.render('register', {
                errors,
                username,
                email,
                password,
                password2
            });
        }
    }
});

//Додання даних про воду

router.get('/water', isLoggedIn, (req, res) => {
    res.render('water', { title: "New record about water"});
});

router.post('/water', async (req, res) => {
    const {name_place, coordinateX, coordinateY, year, season, chemical_index, result} = req.body;
    let errors = [];
    if (!name_place || !coordinateX || !coordinateY || !year || !season || !chemical_index|| !result){
        errors.push({
            msg: 'Please fill in all fields!'
        });
    }
    if(errors.length > 0){
        res.render('water', {
            errors,
            name_place,
            coordinateX,
            coordinateY,
            year,
            season,
            chemical_index,
            result
        });
     }
     else {
        try {
            const newAnalys= new AnalysWater({
                name_place: name_place,
                coordinateX: coordinateX,
                coordinateY: coordinateY,
                year: year,
                season: season,
                chemical_index: chemical_index,
                result: result
            });
            newAnalys.save();
            req.flash(
                'Data loaded succesful',
            );
            res.redirect('/profile');
        } catch (error) {
            console.error(error);
            errors.push({
                msg: 'Server Error'
            });
            res.render('water', {
                errors,
                name_place,
                coordinateX,
                coordinateY,
                year,
                season,
                chemical_index,
                result
            });
        }
    }
});


//Функціонал скидання паролю

// Форма забутого паролю
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', {title: 'forgot password'});
});


// Обробка форми забутого паролю

router.post('/forgot-password', async (req, res) => {
    try{
        const token = await crypto.randomBytes(32).toString('hex');
        const email = req.body.email;
        const user = await User.findOne({ email });
        if(!user){
            req.flash('error', 'User with this email was not found');
            return res.redirect('/forgot-password');
        }
        // Збереження токену у моделі користувача
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // Токен буде дійсний протягом 1 години
        await user.save();

        // Надсилання електронного листа з токеном
        
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: user.email,
            subject: 'Password reset',
            text:
                'You received this email because you or someone else sent a password reset request. \n\n' +
                'Please, press on link bottom for ending process:\n\n' +
                'http://' +
                req.headers.host +
                '/reset-password/' +
                token +
                '\n\n' +
                'If you don\'nt send request on drop password, ignore this message'
        };

        const transporterGmail = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const transporterUkrNet = nodemailer.createTransport({
            host: 'smtp.ukr.net',
            port: 465,
            secure: true,
            auth: {
              user: process.env.EMAIL_ADDRES,
              pass: process.env.EMAIL_PASSWORD
            }
          });

        let regexGmail = /gmail.com$/;
        let regexUrknet = /ukr.net$/;

        if(regexGmail.test(email)){
            transporterGmail.sendMail(mailOptions, (err, response) => {
                if (err) {
                    console.log(err);
                    req.flash('error', 'An error occurred while sending the email');
                    res.redirect('/forgot-password');
                } else {
                    user.save();
                    req.flash('success', 'An email with password reset instructions has been sent to ' + user.email);
                    res.redirect('/forgot-password');
                };
            })
        }
        else if(regexUrknet.test(email)){
            transporterUkrNet.sendMail(mailOptions, (err, response) => {
                if (err) {
                    console.log(err);
                    req.flash('error', 'An error occurred while sending the email');
                    res.redirect('/forgot-password');
                } else {
                    user.save();
                    req.flash('success', 'An email with password reset instructions has been sent to ' + user.email);
                    res.redirect('/forgot-password');
                };
            })
        }
        else{
            req.flash('error', 'This support only send gmail and ukr.net domain');
            res.redirect('/forgot-password');
        }
    }
    catch(err) {
        console.error(err);
        req.flash('error', 'An error occurred while sending the email');
        res.redirect('/forgot-password');
    }
});


//Зміна даних при підтверджені зміни пароля на пошті
// GET маршрут для відображення сторінки з формою зміни пароля
router.get('/reset-password/:token', async (req, res) => {
    try {

        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            req.flash('error', 'Invalid or expired token');
            return res.redirect('/forgot-password');
        }
        res.render('reset', {
            token: req.params.token, title: `reset your password ${user.username}`
        });
    } catch (err) {
        console.error(err);
        console.log(err);
        req.flash('error', 'An error occurred while trying to change the password');
        res.redirect('/forgot-password');
    }
});

// POST маршрут для зміни пароля
router.post('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            req.flash('error', 'Invalid or expired token');
            return res.redirect('/forgot-password');
        }
        if (req.body.password !== req.body.confirmPassword) {
            req.flash('error', 'Passwords don\'t match');
            return res.redirect(`/reset-password/${req.params.token}`);
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;


        await user.save();
        req.flash('success', 'Your password has been changed successfully. Please log in with your new password.');
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'An error occurred while trying to change the password');
        res.redirect(`/reset-password/${req.params.token}`);
    }
});



module.exports = router;