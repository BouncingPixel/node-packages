const axios = require('axios');
const nconf = require('nconf');
const logger = require('winston');

const HttpErrors = require('@bouncingpixel/http-errors');

const captchaVerifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

module.exports = function requireNocaptcha(req, res, next) {
  const secret = nconf.get('nocaptchaSecret');
  const bypass = nconf.get('nocaptchaBypass');

  if (!secret || (bypass && bypass.toString().toLowerCase() === 'true')) {
    return next();
  }

  const captchaResponse = req.body['g-recaptcha-response'];
  const postVars = 'secret=' + nconf.get('nocaptchaSecret') + '&response=' + captchaResponse;

  axios.post(captchaVerifyUrl, postVars, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(function(response) {
    if (response.data.success) {
      return next();
    } else {
      return next(new HttpErrors.BadRequestError('Unable to validate captcha'));
    }
  }).catch(function(response) {
    logger.warn(response);
    return next(new HttpErrors.InternalServerError('A server error has occurred'));
  });
};
