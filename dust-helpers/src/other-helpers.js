module.exports = function(dust) {
  dust.helpers.once = function(chunk, context, bodies, _params) {
    var body = bodies.block;

    if (!body.onced) {
      body.onced = true;
      chunk.render(body, context);
    }

    return chunk;
  };

  dust.helpers.isoptionselected = function(chunk, context, bodies, params) {
    var options = params.options;
    var optionkey = params.optionkey;
    var optionvalue = params.optionvalue;

    return options[optionkey] === optionvalue;
  };

  dust.filters.numberShortener = function(value) {
    if (typeof value === 'string') {
      value = parseInt(value, 10);
    }

    if (value < 1000) {
      return value;
    } else {
      var abbrs = ['k', 'm', 'b', 't', 'q'];

      for (var i = 0; i < abbrs.length; i++) {
        value = value / 1000;
        if (value < 1000) {
          var str = value.toFixed(1); // 999.999 rounds to 1000.0 100.0
          if (str.length < 6) { // 6 means 1000.0 which should just continue upward, caused by rounding
            if (str.length > 3) {
              str = value.toFixed();
            }

            return str + abbrs[i];
          }
        }
      }

      // a fallback, use exponential just to keep it clean
      return value.toExponential(1);
    }
  };
};
