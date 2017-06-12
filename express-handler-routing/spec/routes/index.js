module.exports = {
  get: function(req, res) {
    res.send('/');
  },

  '/path8': {
    get: {
      handler: function(req, res) {
        res.send('/path8');
      }
    }
  }
};
