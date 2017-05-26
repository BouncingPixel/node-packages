const bluebird = require('bluebird');

const GeneratorConstructor = tryEvalFor('(function*(){}).constructor');
const AsyncConstructor = tryEvalFor('(async function(){}).constructor');

module.exports = function wrapMiddleware(genFn) {
  const isGenerator = GeneratorConstructor && genFn instanceof GeneratorConstructor;
  const isAsync = AsyncConstructor && genFn instanceof AsyncConstructor;

  if (!isGenerator && !isAsync) {
    return genFn;
  }

  const cr = isAsync ?
    genFn : // if it is an AsyncConstructor, then it already is like a coroutine
    bluebird.coroutine(genFn); // generators get wrapped by bluebird.coroutine

  if (genFn.length >= 4) {
    return function(err, req, res, next) {
      let nextCalled = false;
      let nextValue;
      function crNext(error) {
        nextCalled = true;
        nextValue = error;
      }

      cr(err, req, res, crNext).then(function() {
        if (nextCalled) {
          next(nextValue);
        }
      }).catch(next);
    };
  }

  return function(req, res, next) {
    let nextCalled = false;
    let nextValue;
    function crNext(error) {
      nextCalled = true;
      nextValue = error;
    }

    cr(req, res, crNext).then(function() {
      if (nextCalled) {
        next(nextValue);
      }
    }).catch(next);
  };
};

function tryEvalFor(str) {
  let c = null;
  try {
    c = eval(str);
  } catch (_e) {
    c = null;
  }

  return c;
}
