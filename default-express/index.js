module.exports = {
  app: require('./src/express-init'),

  // this is a function which requires the app
  start: require('./src/express-start')
};
