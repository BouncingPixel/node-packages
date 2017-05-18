
module.exports = function renderPage(page, locals) {
  return function(req, res) {
    res.render(page, locals);
  };
};
