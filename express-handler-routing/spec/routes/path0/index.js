module.exports = {
  get: function(req, res) {
    res.send('/path0');
  },

  '/path3': {
    get: {
      handler: function(req, res) {
        res.send('/path0/path3');
      }
    }
  }
};
