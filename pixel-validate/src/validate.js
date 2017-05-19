// validates all fields in a data object against a schema using mongoose
function validateAllFactory(Document) {
  return function validateAll(data, Schema) {
    return new Promise((resolve, reject) => {
      const doc = new Document(data, Schema);

      doc.validate((err) => {
        if (err) {
          reject(err);
          return;
        } else {
          resolve();
          return;
        }
      });
    });
  };
}

// validates a single field agaisnt the mongoose schema
// Does require all data (due to mongoose)
// the dataPath is in dot-notation, including arrays. ex: lines.0.qty
function validateFieldFactory(Document) {
  return function validateField(allData, dataPath, Schema) {
    return new Promise((resolve, reject) => {
      const doc = new Document(allData, Schema);
      const p = Schema.path(dataPath);

      // then it doesnt need to be checked
      if (!p) {
        resolve();
        return;
      }

      // do it this way, so any necessary casting occurs
      const value = doc.get(dataPath);

      p.doValidate(value, function(err) {
        if (err) {
          reject(err);
          return;
        } else {
          resolve();
          return;
        }
      }, doc);
    });
  };
}

module.exports = {
  validateAllFactory: validateAllFactory,
  validateFieldFactory: validateFieldFactory
};
