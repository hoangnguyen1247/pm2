"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _path = _interopRequireDefault(require("path"));

var _child_process = _interopRequireDefault(require("child_process"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var DEFAULT_MAXBUFFER_SIZE = 20 * 1024 * 1024;

function _exec(command, options, callback) {
  options = options || {};

  if (typeof options === 'function') {
    callback = options;
  }

  if (_typeof(options) === 'object' && typeof callback === 'function') {
    options.async = true;
  }

  if (!command) {
    try {
      console.error('[sexec] must specify command');
    } catch (e) {
      return;
    }
  }

  options = Object.assign({
    silent: false,
    cwd: _path["default"].resolve(process.cwd()).toString(),
    env: process.env,
    maxBuffer: DEFAULT_MAXBUFFER_SIZE,
    encoding: 'utf8'
  }, options);

  var c = _child_process["default"].exec(command, options, function (err, stdout, stderr) {
    if (callback) {
      if (!err) {
        callback(0, stdout, stderr);
      } else if (err.code === undefined) {
        // See issue #536

        /* istanbul ignore next */
        callback(1, stdout, stderr);
      } else {
        callback(err.code, stdout, stderr);
      }
    }
  });

  if (!options.silent) {
    c.stdout.pipe(process.stdout);
    c.stderr.pipe(process.stderr);
  }
}

var _default = _exec;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9zZXhlYy50cyJdLCJuYW1lcyI6WyJERUZBVUxUX01BWEJVRkZFUl9TSVpFIiwiX2V4ZWMiLCJjb21tYW5kIiwib3B0aW9ucyIsImNhbGxiYWNrIiwiYXN5bmMiLCJjb25zb2xlIiwiZXJyb3IiLCJlIiwiT2JqZWN0IiwiYXNzaWduIiwic2lsZW50IiwiY3dkIiwicGF0aCIsInJlc29sdmUiLCJwcm9jZXNzIiwidG9TdHJpbmciLCJlbnYiLCJtYXhCdWZmZXIiLCJlbmNvZGluZyIsImMiLCJjaGlsZCIsImV4ZWMiLCJlcnIiLCJzdGRvdXQiLCJzdGRlcnIiLCJjb2RlIiwidW5kZWZpbmVkIiwicGlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUNBOztBQUVBOzs7Ozs7QUFFQSxJQUFJQSxzQkFBc0IsR0FBRyxLQUFLLElBQUwsR0FBWSxJQUF6Qzs7QUFFQSxTQUFTQyxLQUFULENBQWVDLE9BQWYsRUFBd0JDLE9BQXhCLEVBQWtDQyxRQUFsQyxFQUE2QztBQUMzQ0QsRUFBQUEsT0FBTyxHQUFHQSxPQUFPLElBQUksRUFBckI7O0FBRUEsTUFBSSxPQUFPQSxPQUFQLEtBQW1CLFVBQXZCLEVBQW1DO0FBQ2pDQyxJQUFBQSxRQUFRLEdBQUdELE9BQVg7QUFDRDs7QUFFRCxNQUFJLFFBQU9BLE9BQVAsTUFBbUIsUUFBbkIsSUFBK0IsT0FBT0MsUUFBUCxLQUFvQixVQUF2RCxFQUFtRTtBQUNqRUQsSUFBQUEsT0FBTyxDQUFDRSxLQUFSLEdBQWdCLElBQWhCO0FBQ0Q7O0FBRUQsTUFBSSxDQUFDSCxPQUFMLEVBQWM7QUFDWixRQUFJO0FBQ0ZJLE1BQUFBLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLDhCQUFkO0FBQ0QsS0FGRCxDQUVFLE9BQU9DLENBQVAsRUFBVTtBQUNWO0FBQ0Q7QUFDRjs7QUFFREwsRUFBQUEsT0FBTyxHQUFHTSxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUN0QkMsSUFBQUEsTUFBTSxFQUFFLEtBRGM7QUFFdEJDLElBQUFBLEdBQUcsRUFBRUMsaUJBQUtDLE9BQUwsQ0FBYUMsT0FBTyxDQUFDSCxHQUFSLEVBQWIsRUFBNEJJLFFBQTVCLEVBRmlCO0FBR3RCQyxJQUFBQSxHQUFHLEVBQUVGLE9BQU8sQ0FBQ0UsR0FIUztBQUl0QkMsSUFBQUEsU0FBUyxFQUFFbEIsc0JBSlc7QUFLdEJtQixJQUFBQSxRQUFRLEVBQUU7QUFMWSxHQUFkLEVBTVBoQixPQU5PLENBQVY7O0FBUUEsTUFBSWlCLENBQUMsR0FBR0MsMEJBQU1DLElBQU4sQ0FBV3BCLE9BQVgsRUFBb0JDLE9BQXBCLEVBQTZCLFVBQVVvQixHQUFWLEVBQWVDLE1BQWYsRUFBdUJDLE1BQXZCLEVBQStCO0FBQ2xFLFFBQUlyQixRQUFKLEVBQWM7QUFDWixVQUFJLENBQUNtQixHQUFMLEVBQVU7QUFDUm5CLFFBQUFBLFFBQVEsQ0FBQyxDQUFELEVBQUlvQixNQUFKLEVBQVlDLE1BQVosQ0FBUjtBQUNELE9BRkQsTUFFTyxJQUFJRixHQUFHLENBQUNHLElBQUosS0FBYUMsU0FBakIsRUFBNEI7QUFDakM7O0FBQ0E7QUFDQXZCLFFBQUFBLFFBQVEsQ0FBQyxDQUFELEVBQUlvQixNQUFKLEVBQVlDLE1BQVosQ0FBUjtBQUNELE9BSk0sTUFJQTtBQUNMckIsUUFBQUEsUUFBUSxDQUFDbUIsR0FBRyxDQUFDRyxJQUFMLEVBQVdGLE1BQVgsRUFBbUJDLE1BQW5CLENBQVI7QUFDRDtBQUNGO0FBQ0YsR0FaTyxDQUFSOztBQWNBLE1BQUksQ0FBQ3RCLE9BQU8sQ0FBQ1EsTUFBYixFQUFxQjtBQUNuQlMsSUFBQUEsQ0FBQyxDQUFDSSxNQUFGLENBQVNJLElBQVQsQ0FBY2IsT0FBTyxDQUFDUyxNQUF0QjtBQUNBSixJQUFBQSxDQUFDLENBQUNLLE1BQUYsQ0FBU0csSUFBVCxDQUFjYixPQUFPLENBQUNVLE1BQXRCO0FBQ0Q7QUFDRjs7ZUFFY3hCLEsiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBjaGlsZCBmcm9tICdjaGlsZF9wcm9jZXNzJztcblxudmFyIERFRkFVTFRfTUFYQlVGRkVSX1NJWkUgPSAyMCAqIDEwMjQgKiAxMDI0O1xuXG5mdW5jdGlvbiBfZXhlYyhjb21tYW5kLCBvcHRpb25zPywgY2FsbGJhY2s/KSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgb3B0aW9ucy5hc3luYyA9IHRydWU7XG4gIH1cblxuICBpZiAoIWNvbW1hbmQpIHtcbiAgICB0cnkge1xuICAgICAgY29uc29sZS5lcnJvcignW3NleGVjXSBtdXN0IHNwZWNpZnkgY29tbWFuZCcpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgc2lsZW50OiBmYWxzZSxcbiAgICBjd2Q6IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpKS50b1N0cmluZygpLFxuICAgIGVudjogcHJvY2Vzcy5lbnYsXG4gICAgbWF4QnVmZmVyOiBERUZBVUxUX01BWEJVRkZFUl9TSVpFLFxuICAgIGVuY29kaW5nOiAndXRmOCcsXG4gIH0sIG9wdGlvbnMpO1xuXG4gIHZhciBjID0gY2hpbGQuZXhlYyhjb21tYW5kLCBvcHRpb25zLCBmdW5jdGlvbiAoZXJyLCBzdGRvdXQsIHN0ZGVycikge1xuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgaWYgKCFlcnIpIHtcbiAgICAgICAgY2FsbGJhY2soMCwgc3Rkb3V0LCBzdGRlcnIpO1xuICAgICAgfSBlbHNlIGlmIChlcnIuY29kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIFNlZSBpc3N1ZSAjNTM2XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIGNhbGxiYWNrKDEsIHN0ZG91dCwgc3RkZXJyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrKGVyci5jb2RlLCBzdGRvdXQsIHN0ZGVycik7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBpZiAoIW9wdGlvbnMuc2lsZW50KSB7XG4gICAgYy5zdGRvdXQucGlwZShwcm9jZXNzLnN0ZG91dCk7XG4gICAgYy5zdGRlcnIucGlwZShwcm9jZXNzLnN0ZGVycik7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgX2V4ZWM7XG4iXX0=