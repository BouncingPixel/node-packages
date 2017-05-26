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
    const val = params.value;
    const index = context.get('$idx');

    return parseInt(val) === parseInt(index);
  };

  dust.helpers.inArray = function(chunk, context, bodies, params) {
    const array = params.array;
    const value = params.value;

    if (!array || !value) {
      return false;
    }
    return array.indexOf(value) !== -1;
  };

  dust.helpers.notInArray = function(chunk, context, bodies, params) {
    const array = params.array;
    const value = params.value;

    if (!array || !value) {
      return true;
    }
    return array.indexOf(value) === -1;
  };

  dust.helpers.once = function(chunk, context, bodies, _params) {
    const body = bodies.block;

    if (!body.onced) {
      body.onced = true;
      chunk.render(body, context);
    }

    return chunk;
  };

  dust.helpers.sumArray = function(chunk, context, bodies, params) {
    const objKey = params.value || null;
    if (!params.array ||
      (typeof objKey !== 'string' && objKey !== null)) {
      return false;
    } else {
      let sumQuantity = 0;
      for (let i in params.array) {
        sumQuantity +=
          objKey ?
            params.array[i][objKey] :
            params.array[i];
      }
      return sumQuantity;
    }
  };

  dust.helpers.loop = function(chunk, context, bodies, params) {
    let from = parseInt(dust.helpers.tap(params.from, chunk, context), 10) || 1;
    const to = parseInt(dust.helpers.tap(params.to, chunk, context), 10) || 1;
    const len = Math.abs(to - from) + 1;
    const increment = (to - from) / (len - 1) || 1;

    while (from !== to) {
      chunk = bodies.block(chunk, context.push(from, from, len));
      from += increment;
    }

    return chunk.render(bodies.block, context.push(from, from, len));
  };

  dust.helpers.quotientCeiling = function(chunk, context, bodies, params) {
    const key = parseInt(params.key, 10);
    const value = parseInt(params.value, 10);
    return Math.ceil(key / value);
  };

  dust.helpers.quotientFloor = function(chunk, context, bodies, params) {
    const key = parseInt(params.key, 10);
    const value = parseInt(params.value, 10);
    return Math.floor(key / value);
  };
};
