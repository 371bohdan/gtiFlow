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
    resetPasswordToken: String,
    resetPasswordExpires: Date

});



module.exports = mongoose.model('User', User);