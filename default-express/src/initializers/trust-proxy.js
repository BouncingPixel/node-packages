module.exports = function(app) {
  // needed for Heroku to get the client's IP address from req.ips[req.ips.length-1]
  if (process.env.NODE_ENV === 'production') {
    app.enable('trust proxy');
  }
};
