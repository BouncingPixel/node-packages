const rewire = require('rewire');
const path = require('path');

const routerFactory = rewire('../src/express-handler-routing');

describe('express-handler-routing route generation', function() {

  let mockExpressRouter;
  let mockExpress;

  let middleware = {};
  let routes = {};

  beforeAll(function() {
    mockExpressRouter = {
      use: jasmine.createSpy('mockUse').and.callFake(function(p1, p2) {
        if (!p2 || p1 instanceof Function) {
          middleware['/'] = (middleware['/'] || 0) + arguments.length;
        } else {
          middleware[p1] = (middleware[p1] || 0) + (arguments.length - 1);
        }
      }),

      get: jasmine.createSpy('mockGet').and.callFake(function(p1) {
        routes[p1] = (routes[p1] || 0) + 1;
      }),

      post: jasmine.createSpy('mockPost').and.callFake(function(p1) {
        routes[p1] = (routes[p1] || 0) + 1;
      })
    };

    mockExpress = {
      Router: function() {
        return mockExpressRouter;
      }
    };

    routerFactory.__set__('express', mockExpress);
  });

  afterEach(function() {
    mockExpressRouter.use.calls.reset();
    mockExpressRouter.get.calls.reset();
    mockExpressRouter.post.calls.reset();
  });

  it('should generate proper routes', function(done) {
    const returnedRouter = routerFactory(path.resolve(__dirname, 'routes'));

    expect(returnedRouter).toBe(mockExpressRouter);

    setTimeout(function() {
      const routePaths = Object.keys(routes);

      const expectedRoutes = [
        '/',
        '/path0',
        '/path0/path1',
        '/path0/path2',
        '/path0/path3',
        '/path0/path4/path5',
        '/path0/path4/path6',
        '/path7',
        '/path8'
      ];

      expect(routePaths.length).toBe(expectedRoutes.length);

      for (let i = 0; i < expectedRoutes.length; i++) {
        expect(routePaths).toContain(expectedRoutes[i]);
      }

      done();
    }, 1000);
  });

});
