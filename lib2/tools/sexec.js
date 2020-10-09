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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9zZXhlYy50cyJdLCJuYW1lcyI6WyJERUZBVUxUX01BWEJVRkZFUl9TSVpFIiwiX2V4ZWMiLCJjb21tYW5kIiwib3B0aW9ucyIsImNhbGxiYWNrIiwiYXN5bmMiLCJjb25zb2xlIiwiZXJyb3IiLCJlIiwiT2JqZWN0IiwiYXNzaWduIiwic2lsZW50IiwiY3dkIiwicGF0aCIsInJlc29sdmUiLCJwcm9jZXNzIiwidG9TdHJpbmciLCJlbnYiLCJtYXhCdWZmZXIiLCJlbmNvZGluZyIsImMiLCJjaGlsZCIsImV4ZWMiLCJlcnIiLCJzdGRvdXQiLCJzdGRlcnIiLCJjb2RlIiwidW5kZWZpbmVkIiwicGlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUNBOztBQUVBOzs7Ozs7QUFFQSxJQUFJQSxzQkFBc0IsR0FBRyxLQUFLLElBQUwsR0FBWSxJQUF6Qzs7QUFFQSxTQUFTQyxLQUFULENBQWVDLE9BQWYsRUFBd0JDLE9BQXhCLEVBQWtDQyxRQUFsQyxFQUE2QztBQUMzQ0QsRUFBQUEsT0FBTyxHQUFHQSxPQUFPLElBQUksRUFBckI7O0FBRUEsTUFBSSxPQUFPQSxPQUFQLEtBQW1CLFVBQXZCLEVBQW1DO0FBQ2pDQyxJQUFBQSxRQUFRLEdBQUdELE9BQVg7QUFDRDs7QUFFRCxNQUFJLFFBQU9BLE9BQVAsTUFBbUIsUUFBbkIsSUFBK0IsT0FBT0MsUUFBUCxLQUFvQixVQUF2RCxFQUFtRTtBQUNqRUQsSUFBQUEsT0FBTyxDQUFDRSxLQUFSLEdBQWdCLElBQWhCO0FBQ0Q7O0FBRUQsTUFBSSxDQUFDSCxPQUFMLEVBQWM7QUFDWixRQUFJO0FBQ0ZJLE1BQUFBLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLDhCQUFkO0FBQ0QsS0FGRCxDQUVFLE9BQU9DLENBQVAsRUFBVTtBQUNWO0FBQ0Q7QUFDRjs7QUFFREwsRUFBQUEsT0FBTyxHQUFHTSxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUN0QkMsSUFBQUEsTUFBTSxFQUFFLEtBRGM7QUFFdEJDLElBQUFBLEdBQUcsRUFBRUMsaUJBQUtDLE9BQUwsQ0FBYUMsT0FBTyxDQUFDSCxHQUFSLEVBQWIsRUFBNEJJLFFBQTVCLEVBRmlCO0FBR3RCQyxJQUFBQSxHQUFHLEVBQUVGLE9BQU8sQ0FBQ0UsR0FIUztBQUl0QkMsSUFBQUEsU0FBUyxFQUFFbEIsc0JBSlc7QUFLdEJtQixJQUFBQSxRQUFRLEVBQUU7QUFMWSxHQUFkLEVBTVBoQixPQU5PLENBQVY7O0FBUUEsTUFBSWlCLENBQUMsR0FBR0MsMEJBQU1DLElBQU4sQ0FBV3BCLE9BQVgsRUFBb0JDLE9BQXBCLEVBQTZCLFVBQVVvQixHQUFWLEVBQWVDLE1BQWYsRUFBdUJDLE1BQXZCLEVBQStCO0FBQ2xFLFFBQUlyQixRQUFKLEVBQWM7QUFDWixVQUFJLENBQUNtQixHQUFMLEVBQVU7QUFDUm5CLFFBQUFBLFFBQVEsQ0FBQyxDQUFELEVBQUlvQixNQUFKLEVBQVlDLE1BQVosQ0FBUjtBQUNELE9BRkQsTUFFTyxJQUFJRixHQUFHLENBQUNHLElBQUosS0FBYUMsU0FBakIsRUFBNEI7QUFDakM7O0FBQ0E7QUFDQXZCLFFBQUFBLFFBQVEsQ0FBQyxDQUFELEVBQUlvQixNQUFKLEVBQVlDLE1BQVosQ0FBUjtBQUNELE9BSk0sTUFJQTtBQUNMckIsUUFBQUEsUUFBUSxDQUFDbUIsR0FBRyxDQUFDRyxJQUFMLEVBQVdGLE1BQVgsRUFBbUJDLE1BQW5CLENBQVI7QUFDRDtBQUNGO0FBQ0YsR0FaTyxDQUFSOztBQWNBLE1BQUksQ0FBQ3RCLE9BQU8sQ0FBQ1EsTUFBYixFQUFxQjtBQUNuQlMsSUFBQUEsQ0FBQyxDQUFDSSxNQUFGLENBQVNJLElBQVQsQ0FBY2IsT0FBTyxDQUFDUyxNQUF0QjtBQUNBSixJQUFBQSxDQUFDLENBQUNLLE1BQUYsQ0FBU0csSUFBVCxDQUFjYixPQUFPLENBQUNVLE1BQXRCO0FBQ0Q7QUFDRjs7ZUFFY3hCLEsiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCBjaGlsZCBmcm9tICdjaGlsZF9wcm9jZXNzJztcclxuXHJcbnZhciBERUZBVUxUX01BWEJVRkZFUl9TSVpFID0gMjAgKiAxMDI0ICogMTAyNDtcclxuXHJcbmZ1bmN0aW9uIF9leGVjKGNvbW1hbmQsIG9wdGlvbnM/LCBjYWxsYmFjaz8pIHtcclxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBjYWxsYmFjayA9IG9wdGlvbnM7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgb3B0aW9ucy5hc3luYyA9IHRydWU7XHJcbiAgfVxyXG5cclxuICBpZiAoIWNvbW1hbmQpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tzZXhlY10gbXVzdCBzcGVjaWZ5IGNvbW1hbmQnKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xyXG4gICAgc2lsZW50OiBmYWxzZSxcclxuICAgIGN3ZDogcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCkpLnRvU3RyaW5nKCksXHJcbiAgICBlbnY6IHByb2Nlc3MuZW52LFxyXG4gICAgbWF4QnVmZmVyOiBERUZBVUxUX01BWEJVRkZFUl9TSVpFLFxyXG4gICAgZW5jb2Rpbmc6ICd1dGY4JyxcclxuICB9LCBvcHRpb25zKTtcclxuXHJcbiAgdmFyIGMgPSBjaGlsZC5leGVjKGNvbW1hbmQsIG9wdGlvbnMsIGZ1bmN0aW9uIChlcnIsIHN0ZG91dCwgc3RkZXJyKSB7XHJcbiAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgaWYgKCFlcnIpIHtcclxuICAgICAgICBjYWxsYmFjaygwLCBzdGRvdXQsIHN0ZGVycik7XHJcbiAgICAgIH0gZWxzZSBpZiAoZXJyLmNvZGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIFNlZSBpc3N1ZSAjNTM2XHJcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgICBjYWxsYmFjaygxLCBzdGRvdXQsIHN0ZGVycik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY2FsbGJhY2soZXJyLmNvZGUsIHN0ZG91dCwgc3RkZXJyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICBpZiAoIW9wdGlvbnMuc2lsZW50KSB7XHJcbiAgICBjLnN0ZG91dC5waXBlKHByb2Nlc3Muc3Rkb3V0KTtcclxuICAgIGMuc3RkZXJyLnBpcGUocHJvY2Vzcy5zdGRlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgX2V4ZWM7XHJcbiJdfQ==