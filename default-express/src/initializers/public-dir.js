const express = require('express');
const winston = require('winston');

module.exports = function(app) {
  winston.debug('Configuring routes for statics');
  app.use(express.static('public'));
};
