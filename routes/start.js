const {Router} = require('express');
const router = Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');
const passport = require('passport');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { AnalysWater } = require('../models/water');
const { get } = require('http');
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
    const {name_place, coordinateX, coordinateY, year, season, chemical_index, result, comment} = req.body;
    let errors = [];
    if (!name_place || !coordinateX || !coordinateY || !year || !season || !chemical_index|| !result){
        errors.push({
            msg: 'Please fill in all fields!'
        });
    }
    if(isNaN(parseFloat(coordinateX))){
        errors.push({
            msg: 'Incorrect enter coordinateX'
        })
    }
    if(isNaN(parseFloat(coordinateY))){
        errors.push({
            msg: 'Incorrect enter coordinateY'
        })
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
                result: result,
                comment:comment
            });
            newAnalys.save();
            req.flash(
                'Data loaded successful',
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

//Коригування параметрів даних про воду

router.get('/set_water/:_id', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById();
        const water = await AnalysWater.findById(req.params._id);
        res.render('set_water', {title: 'change data water', water, user});
    }
    catch(err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
})

router.post('/set_water/:id', async (req, res) => {
    const { name_place, coordinateX, coordinateY, year, season, chemical_index, result, comment } = req.body;
    try {
      if (isNaN(parseFloat(coordinateX))) {
        req.flash('error', 'coordinateX must be a number with a period and not include characters other than numbers');
        return res.redirect(`/set_water/${req.params.id}`);
      }
      if (isNaN(parseFloat(coordinateY))) {
        req.flash('error', 'coordinateY must be a number with a period and not include characters other than numbers');
        return res.redirect(`/set_water/${req.params.id}`);
      }
      await AnalysWater.updateOne(
        { _id: req.params.id },
        {
          $set: {
            name_place: name_place,
            coordinateX: coordinateX,
            coordinateY: coordinateY,
            year: year,
            season: season,
            chemical_index: chemical_index,
            result: result,
            comment: comment,
          },
        }
      );
      req.flash('success', 'Data updated successfully');
      res.redirect('/profile');
    } catch (err) {
      console.log(err);
      req.flash('error', 'Error on server side');
      await req.flash.save();
      res.redirect(`/set_water/${req.params.id}`);
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



//Коригування параметрів особистих даних
router.get('/add_data', isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user._id);
    try{
        res.render('add_data', { title: "Tell about you", user});
    }
    catch(err){
        console.log(err);
        res.redirect('/login');
    }
})

router.post('/add_data', async (req,res) => {
    const {fname, lname, gender, age} = req.body;
    if(!fname || !lname || !gender || !age){
        req.flash('error', 'Fill all fields!')
    }
    if(age > 120){
        req.flash('error', `Very old age`);
        return res.redirect('/profile');
    }
    if(age < 3){
        req.flash('error', `Very young age`);
        return res.redirect('/profile');
    }
    try{
            await User.updateMany({}, {
                $set: {
                    fname: fname,
                    lname: lname,
                    gender: gender,
                    age: age
                }
            });
        req.flash('success',
            'Data loaded successful',
        );
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong');
        res.redirect('/profile');
    }
});

router.get('/set_data', isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user._id);
    try{
        res.render('set_data', { title: "Change your data", user});
    }
    catch(err){
        console.log(err);
        res.redirect('/login');
    }
})

router.post('/set_data', async (req,res) => {
    const {fname, lname, gender, age} = req.body;
    try{
        await User.updateOne(
            { _id: req.params._id }, // знайти запис за _id
            { $set: { fname: fname, lname: lname, gender: gender, age: age } } // оновити значення
        );
        req.flash(
            'success',
            'Data updated successfully'
        );
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        req.flash(
            'error',
            'Server Error'
        );
        res.redirect('/profile');
    }
  });



  
module.exports = router;