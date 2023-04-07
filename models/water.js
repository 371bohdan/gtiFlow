// модель для вводу координат та хімічних показників води

const mongoose = require('mongoose');



const analys_waterSchema = new mongoose.Schema({
    name_place:{
        type: String,
        required: true
    },
    coordinateX: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function(value) {
              return value % 1 !== 0;
            },
            message: props => `${props.value} is not a floating point number!`
        }

    },
    coordinateY: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function(value) {
              return value % 1 !== 0;
            },
            message: props => `${props.value} is not a floating point number!`
        }
    },
    year: {
        type: Number,
        required: true,
        min: 1900 // Мінімальне значення для року
    },
    season: {
        type: String,
        required: true,
        enum: ['winter', 'spring', 'summer', 'fall'] // Можливі значення для сезону
      },
    chemical_index:{
        type: String,
        required: true,
    },
    result: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function(value) {
              return value % 1 !== 0;
            },
            message: props => `${props.value} is not a floating point number!`
        }
    },
    comment: {
        type: String
    }
})

const AnalysWater = mongoose.model('analysWater', analys_waterSchema);

module.exports = { AnalysWater };