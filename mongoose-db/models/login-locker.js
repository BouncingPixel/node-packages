'use strict';

const mongoose = require('mongoose');

const LoginLockerSchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required.']
  },

  failedCount: {
    type: Number,
    default: 0
  },

  lastAttempt: {
    type: Date
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  },
  timestamps: true
});

module.exports = mongoose.model('loginlocker', LoginLockerSchema);
