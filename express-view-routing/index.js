module.exports =
  process.env.NODE_ENV === 'production' ?
    require('./src/fixed-routes') :
    require('./src/dynamic-routes');
