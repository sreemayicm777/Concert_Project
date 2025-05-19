const mongoose = require('mongoose');

const concertSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    venue: {
        type: String,
        required: true,
        trim: true
    },
    ticketPrice: {
        type: Number,
        required: true,
        min: 0
    },
    availableTickets: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String,
        required: true,
        default: '/images/default-concert.jpg' // Default image path
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Concert = mongoose.model('Concert', concertSchema);

module.exports = Concert;