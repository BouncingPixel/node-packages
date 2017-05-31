const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1
  },

  value: {
    type: String,
    required: true,
    minlength: 1
  }
});
