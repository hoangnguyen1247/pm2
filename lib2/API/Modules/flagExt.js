"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function find_extensions(folder, ext, ret) {
  try {
    _fs["default"].accessSync(folder, _fs["default"].constants.R_OK);
  } catch (err) {
    return;
  }

  if (_fs["default"].statSync(folder).isDirectory() && folder.indexOf('node_modules') == -1 && _fs["default"].statSync(folder)["mode"] & 4) {
    _fs["default"].readdirSync(folder).forEach(function (file) {
      var tmp;
      if (Number.parseInt(folder.lastIndexOf('/') + 1) === folder.length) tmp = folder + file;else tmp = folder + '/' + file;
      if (_fs["default"].statSync(tmp).isDirectory()) find_extensions(tmp, ext, ret);else {
        var p = true;

        for (var i = 0; i < ext.length; i++) {
          if (ext[i].test(file)) p = false;
        }

        if (p) ret.push(folder + '/' + file);
      }
    });
  }
}

var make_available_extension = function make_available_extension(opts, ret) {
  if (_typeof(opts) == 'object' && _typeof(ret) == 'object') {
    var mas = opts.ext.split(',');

    for (var i = 0; i < mas.length; i++) {
      mas[i] = '.' + mas[i];
    }

    var res = [];

    for (var i = 0; i < mas.length; i++) {
      res[i] = new RegExp(mas[i] + '$');
    }

    find_extensions(process.cwd(), res, ret);
  }
};

var _default = {
  make_available_extension: make_available_extension
};
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvTW9kdWxlcy9mbGFnRXh0LnRzIl0sIm5hbWVzIjpbImZpbmRfZXh0ZW5zaW9ucyIsImZvbGRlciIsImV4dCIsInJldCIsImZzIiwiYWNjZXNzU3luYyIsImNvbnN0YW50cyIsIlJfT0siLCJlcnIiLCJzdGF0U3luYyIsImlzRGlyZWN0b3J5IiwiaW5kZXhPZiIsInJlYWRkaXJTeW5jIiwiZm9yRWFjaCIsImZpbGUiLCJ0bXAiLCJOdW1iZXIiLCJwYXJzZUludCIsImxhc3RJbmRleE9mIiwibGVuZ3RoIiwicCIsImkiLCJ0ZXN0IiwicHVzaCIsIm1ha2VfYXZhaWxhYmxlX2V4dGVuc2lvbiIsIm9wdHMiLCJtYXMiLCJzcGxpdCIsInJlcyIsIlJlZ0V4cCIsInByb2Nlc3MiLCJjd2QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7Ozs7O0FBRUEsU0FBU0EsZUFBVCxDQUF5QkMsTUFBekIsRUFBaUNDLEdBQWpDLEVBQXNDQyxHQUF0QyxFQUEyQztBQUN6QyxNQUFJO0FBQ0ZDLG1CQUFHQyxVQUFILENBQWNKLE1BQWQsRUFBc0JHLGVBQUdFLFNBQUgsQ0FBYUMsSUFBbkM7QUFDRCxHQUZELENBRUUsT0FBT0MsR0FBUCxFQUFZO0FBQ1o7QUFDRDs7QUFDRCxNQUFJSixlQUFHSyxRQUFILENBQVlSLE1BQVosRUFBb0JTLFdBQXBCLE1BQXFDVCxNQUFNLENBQUNVLE9BQVAsQ0FBZSxjQUFmLEtBQWtDLENBQUMsQ0FBeEUsSUFBOEVQLGVBQUdLLFFBQUgsQ0FBWVIsTUFBWixFQUFvQixNQUFwQixJQUE4QixDQUFoSCxFQUFvSDtBQUNsSEcsbUJBQUdRLFdBQUgsQ0FBZVgsTUFBZixFQUF1QlksT0FBdkIsQ0FBK0IsVUFBQUMsSUFBSSxFQUFJO0FBQ3JDLFVBQUlDLEdBQUo7QUFDQSxVQUFJQyxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JoQixNQUFNLENBQUNpQixXQUFQLENBQW1CLEdBQW5CLElBQTBCLENBQTFDLE1BQWlEakIsTUFBTSxDQUFDa0IsTUFBNUQsRUFDRUosR0FBRyxHQUFHZCxNQUFNLEdBQUdhLElBQWYsQ0FERixLQUdFQyxHQUFHLEdBQUdkLE1BQU0sR0FBRyxHQUFULEdBQWVhLElBQXJCO0FBQ0YsVUFBSVYsZUFBR0ssUUFBSCxDQUFZTSxHQUFaLEVBQWlCTCxXQUFqQixFQUFKLEVBQ0VWLGVBQWUsQ0FBQ2UsR0FBRCxFQUFNYixHQUFOLEVBQVdDLEdBQVgsQ0FBZixDQURGLEtBRUs7QUFDSCxZQUFJaUIsQ0FBQyxHQUFHLElBQVI7O0FBQ0EsYUFBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHbkIsR0FBRyxDQUFDaUIsTUFBeEIsRUFBZ0NFLENBQUMsRUFBakM7QUFDRSxjQUFJbkIsR0FBRyxDQUFDbUIsQ0FBRCxDQUFILENBQU9DLElBQVAsQ0FBWVIsSUFBWixDQUFKLEVBQ0VNLENBQUMsR0FBRyxLQUFKO0FBRko7O0FBR0EsWUFBSUEsQ0FBSixFQUNFakIsR0FBRyxDQUFDb0IsSUFBSixDQUFTdEIsTUFBTSxHQUFHLEdBQVQsR0FBZWEsSUFBeEI7QUFDSDtBQUNGLEtBaEJEO0FBaUJEO0FBQ0Y7O0FBRUQsSUFBTVUsd0JBQXdCLEdBQUcsU0FBU0Esd0JBQVQsQ0FBa0NDLElBQWxDLEVBQXdDdEIsR0FBeEMsRUFBNkM7QUFDNUUsTUFBSSxRQUFPc0IsSUFBUCxLQUFlLFFBQWYsSUFBMkIsUUFBT3RCLEdBQVAsS0FBYyxRQUE3QyxFQUF1RDtBQUNyRCxRQUFJdUIsR0FBRyxHQUFHRCxJQUFJLENBQUN2QixHQUFMLENBQVN5QixLQUFULENBQWUsR0FBZixDQUFWOztBQUNBLFNBQUssSUFBSU4sQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0ssR0FBRyxDQUFDUCxNQUF4QixFQUFnQ0UsQ0FBQyxFQUFqQztBQUNFSyxNQUFBQSxHQUFHLENBQUNMLENBQUQsQ0FBSCxHQUFTLE1BQU1LLEdBQUcsQ0FBQ0wsQ0FBRCxDQUFsQjtBQURGOztBQUVBLFFBQUlPLEdBQUcsR0FBRyxFQUFWOztBQUNBLFNBQUssSUFBSVAsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0ssR0FBRyxDQUFDUCxNQUF4QixFQUFnQ0UsQ0FBQyxFQUFqQztBQUNFTyxNQUFBQSxHQUFHLENBQUNQLENBQUQsQ0FBSCxHQUFTLElBQUlRLE1BQUosQ0FBV0gsR0FBRyxDQUFDTCxDQUFELENBQUgsR0FBUyxHQUFwQixDQUFUO0FBREY7O0FBRUFyQixJQUFBQSxlQUFlLENBQUM4QixPQUFPLENBQUNDLEdBQVIsRUFBRCxFQUFnQkgsR0FBaEIsRUFBcUJ6QixHQUFyQixDQUFmO0FBQ0Q7QUFDRixDQVZEOztlQVllO0FBQ1pxQixFQUFBQSx3QkFBd0IsRUFBeEJBO0FBRFksQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmZ1bmN0aW9uIGZpbmRfZXh0ZW5zaW9ucyhmb2xkZXIsIGV4dCwgcmV0KSB7XG4gIHRyeSB7XG4gICAgZnMuYWNjZXNzU3luYyhmb2xkZXIsIGZzLmNvbnN0YW50cy5SX09LKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChmcy5zdGF0U3luYyhmb2xkZXIpLmlzRGlyZWN0b3J5KCkgJiYgZm9sZGVyLmluZGV4T2YoJ25vZGVfbW9kdWxlcycpID09IC0xICYmIChmcy5zdGF0U3luYyhmb2xkZXIpW1wibW9kZVwiXSAmIDQpKSB7XG4gICAgZnMucmVhZGRpclN5bmMoZm9sZGVyKS5mb3JFYWNoKGZpbGUgPT4ge1xuICAgICAgdmFyIHRtcDtcbiAgICAgIGlmIChOdW1iZXIucGFyc2VJbnQoZm9sZGVyLmxhc3RJbmRleE9mKCcvJykgKyAxKSA9PT0gZm9sZGVyLmxlbmd0aClcbiAgICAgICAgdG1wID0gZm9sZGVyICsgZmlsZTtcbiAgICAgIGVsc2VcbiAgICAgICAgdG1wID0gZm9sZGVyICsgJy8nICsgZmlsZTtcbiAgICAgIGlmIChmcy5zdGF0U3luYyh0bXApLmlzRGlyZWN0b3J5KCkpXG4gICAgICAgIGZpbmRfZXh0ZW5zaW9ucyh0bXAsIGV4dCwgcmV0KTtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgcCA9IHRydWU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXh0Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgIGlmIChleHRbaV0udGVzdChmaWxlKSlcbiAgICAgICAgICAgIHAgPSBmYWxzZTtcbiAgICAgICAgaWYgKHApXG4gICAgICAgICAgcmV0LnB1c2goZm9sZGVyICsgJy8nICsgZmlsZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuY29uc3QgbWFrZV9hdmFpbGFibGVfZXh0ZW5zaW9uID0gZnVuY3Rpb24gbWFrZV9hdmFpbGFibGVfZXh0ZW5zaW9uKG9wdHMsIHJldCkge1xuICBpZiAodHlwZW9mIG9wdHMgPT0gJ29iamVjdCcgJiYgdHlwZW9mIHJldCA9PSAnb2JqZWN0Jykge1xuICAgIHZhciBtYXMgPSBvcHRzLmV4dC5zcGxpdCgnLCcpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWFzLmxlbmd0aDsgaSsrKVxuICAgICAgbWFzW2ldID0gJy4nICsgbWFzW2ldO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hcy5sZW5ndGg7IGkrKylcbiAgICAgIHJlc1tpXSA9IG5ldyBSZWdFeHAobWFzW2ldICsgJyQnKTtcbiAgICBmaW5kX2V4dGVuc2lvbnMocHJvY2Vzcy5jd2QoKSwgcmVzLCByZXQpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgIG1ha2VfYXZhaWxhYmxlX2V4dGVuc2lvblxufTtcbiJdfQ==