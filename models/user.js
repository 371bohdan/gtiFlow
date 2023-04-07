const mongoose = require('mongoose');

//Тут малюємо нашу таблицю із типами даних та іншими властивостями
const User = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
    //Додаток до профілю
    fname: {
        type: String

    },
    lname: {
        type: String
    },
    gender:{
        type: String,
        enum: ['male', 'famale']
    },
    age: {
        type: Number,
        integerOnly: true
    },
    //відновлення паролю токен та дата життя токену
    resetPasswordToken: String,
    resetPasswordExpires: Date
});



module.exports = mongoose.model('User', User);