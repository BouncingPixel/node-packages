const mongoose = require('mongoose');
const imgixset = require('./src/imgixset');

const schema = new mongoose.Schema({
  test: [{
    image: {
      type: imgixset,
      mimetypes: ['image/png']
    }
  }]
});

// console.log(schema.paths.test);

const allPaths = [];
findAllPaths(allPaths, [], schema);
console.log(allPaths);

function findAllPaths(result, path, schema) {
  for (let p in schema.paths) {
    const pathInfo = schema.paths[p];
    const isArray = pathInfo.instance === 'Array';

    const thisPath = path.concat(isArray ? (p + '[]') : p);

    if (pathInfo.schema === imgixset) {
      console.log(pathInfo);
      console.log(pathInfo.schema);

      result.push({
        path: thisPath.join('.'),
        options: pathInfo.options
      });
      // console.log(p);
      // console.log(pathInfo.options);
    } else if (pathInfo.schema && pathInfo.schema.paths) {
      findAllPaths(result, thisPath, pathInfo.schema);
    }
  }
}
