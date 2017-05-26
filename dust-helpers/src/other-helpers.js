module.exports = function(dust) {
  dust.helpers.isoptionselected = function(chunk, context, bodies, params) {
    const options = params.options;
    const optionkey = params.optionkey;
    const optionvalue = params.optionvalue;

    return options[optionkey] === optionvalue;
  };

  dust.filters.numberShortener = function(value) {
    if (typeof value === 'string') {
      value = parseInt(value, 10);
    }

    if (value < 1000) {
      return value;
    } else {
      const abbrs = ['k', 'm', 'b', 't', 'q'];

      for (var i = 0; i < abbrs.length; i++) {
        value = value / 1000;
        if (value < 1000) {
          let str = value.toFixed(1); // 999.999 rounds to 1000.0 100.0
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
