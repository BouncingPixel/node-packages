module.exports = function(dust) {
  dust.helpers.some = function(chunk, context, bodies, params) {
    for (var prop in params) {
      if (params[prop]) {
        return true;
      }
    }
    return false;
  };

  dust.helpers.every = function(chunk, context, bodies, params) {
    for (var prop in params) {
      if (!params[prop]) {
        return false;
      }
    }
    return true;
  };

  dust.helpers.isIndex = function(chunk, context, bodies, params) {
    var val = params.value;
    var index = context.get('$idx');

    return parseInt(val) === parseInt(index);
  };

  dust.helpers.inArray = function(chunk, context, bodies, params) {
    var array = params.array;
    var value = params.value;

    if (!array || !value) {
      return false;
    }
    return array.indexOf(value) !== -1;
  };

  dust.helpers.notInArray = function(chunk, context, bodies, params) {
    var array = params.array;
    var value = params.value;

    if (!array || !value) {
      return true;
    }
    return array.indexOf(value) === -1;
  };

  dust.helpers.sumArray = function(chunk, context, bodies, params) {
    var objKey = params.value || null;
    if (!params.array ||
      (typeof objKey !== 'string' && objKey !== null)) {
      return false;
    } else {
      var sumQuantity = 0;
      for (var i in params.array) {
        sumQuantity +=
          objKey ?
            params.array[i][objKey] :
            params.array[i];
      }
      return sumQuantity;
    }
  };

  dust.helpers.loop = function(chunk, context, bodies, params) {
    var from = parseInt(dust.helpers.tap(params.from, chunk, context), 10) || 1;
    var to = parseInt(dust.helpers.tap(params.to, chunk, context), 10) || 1;
    var len = Math.abs(to - from) + 1;
    var increment = (to - from) / (len - 1) || 1;

    while (from !== to) {
      chunk = bodies.block(chunk, context.push(from, from, len));
      from += increment;
    }

    return chunk.render(bodies.block, context.push(from, from, len));
  };

  dust.helpers.quotientCeiling = function(chunk, context, bodies, params) {
    var key = parseInt(params.key, 10);
    var value = parseInt(params.value, 10);
    return Math.ceil(key / value);
  };

  dust.helpers.quotientFloor = function(chunk, context, bodies, params) {
    var key = parseInt(params.key, 10);
    var value = parseInt(params.value, 10);
    return Math.floor(key / value);
  };
};
