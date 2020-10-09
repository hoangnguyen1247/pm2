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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvTW9kdWxlcy9mbGFnRXh0LnRzIl0sIm5hbWVzIjpbImZpbmRfZXh0ZW5zaW9ucyIsImZvbGRlciIsImV4dCIsInJldCIsImZzIiwiYWNjZXNzU3luYyIsImNvbnN0YW50cyIsIlJfT0siLCJlcnIiLCJzdGF0U3luYyIsImlzRGlyZWN0b3J5IiwiaW5kZXhPZiIsInJlYWRkaXJTeW5jIiwiZm9yRWFjaCIsImZpbGUiLCJ0bXAiLCJOdW1iZXIiLCJwYXJzZUludCIsImxhc3RJbmRleE9mIiwibGVuZ3RoIiwicCIsImkiLCJ0ZXN0IiwicHVzaCIsIm1ha2VfYXZhaWxhYmxlX2V4dGVuc2lvbiIsIm9wdHMiLCJtYXMiLCJzcGxpdCIsInJlcyIsIlJlZ0V4cCIsInByb2Nlc3MiLCJjd2QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7Ozs7O0FBRUEsU0FBU0EsZUFBVCxDQUF5QkMsTUFBekIsRUFBaUNDLEdBQWpDLEVBQXNDQyxHQUF0QyxFQUEyQztBQUN6QyxNQUFJO0FBQ0ZDLG1CQUFHQyxVQUFILENBQWNKLE1BQWQsRUFBc0JHLGVBQUdFLFNBQUgsQ0FBYUMsSUFBbkM7QUFDRCxHQUZELENBRUUsT0FBT0MsR0FBUCxFQUFZO0FBQ1o7QUFDRDs7QUFDRCxNQUFJSixlQUFHSyxRQUFILENBQVlSLE1BQVosRUFBb0JTLFdBQXBCLE1BQXFDVCxNQUFNLENBQUNVLE9BQVAsQ0FBZSxjQUFmLEtBQWtDLENBQUMsQ0FBeEUsSUFBOEVQLGVBQUdLLFFBQUgsQ0FBWVIsTUFBWixFQUFvQixNQUFwQixJQUE4QixDQUFoSCxFQUFvSDtBQUNsSEcsbUJBQUdRLFdBQUgsQ0FBZVgsTUFBZixFQUF1QlksT0FBdkIsQ0FBK0IsVUFBQUMsSUFBSSxFQUFJO0FBQ3JDLFVBQUlDLEdBQUo7QUFDQSxVQUFJQyxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JoQixNQUFNLENBQUNpQixXQUFQLENBQW1CLEdBQW5CLElBQTBCLENBQTFDLE1BQWlEakIsTUFBTSxDQUFDa0IsTUFBNUQsRUFDRUosR0FBRyxHQUFHZCxNQUFNLEdBQUdhLElBQWYsQ0FERixLQUdFQyxHQUFHLEdBQUdkLE1BQU0sR0FBRyxHQUFULEdBQWVhLElBQXJCO0FBQ0YsVUFBSVYsZUFBR0ssUUFBSCxDQUFZTSxHQUFaLEVBQWlCTCxXQUFqQixFQUFKLEVBQ0VWLGVBQWUsQ0FBQ2UsR0FBRCxFQUFNYixHQUFOLEVBQVdDLEdBQVgsQ0FBZixDQURGLEtBRUs7QUFDSCxZQUFJaUIsQ0FBQyxHQUFHLElBQVI7O0FBQ0EsYUFBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHbkIsR0FBRyxDQUFDaUIsTUFBeEIsRUFBZ0NFLENBQUMsRUFBakM7QUFDRSxjQUFJbkIsR0FBRyxDQUFDbUIsQ0FBRCxDQUFILENBQU9DLElBQVAsQ0FBWVIsSUFBWixDQUFKLEVBQ0VNLENBQUMsR0FBRyxLQUFKO0FBRko7O0FBR0EsWUFBSUEsQ0FBSixFQUNFakIsR0FBRyxDQUFDb0IsSUFBSixDQUFTdEIsTUFBTSxHQUFHLEdBQVQsR0FBZWEsSUFBeEI7QUFDSDtBQUNGLEtBaEJEO0FBaUJEO0FBQ0Y7O0FBRUQsSUFBTVUsd0JBQXdCLEdBQUcsU0FBU0Esd0JBQVQsQ0FBa0NDLElBQWxDLEVBQXdDdEIsR0FBeEMsRUFBNkM7QUFDNUUsTUFBSSxRQUFPc0IsSUFBUCxLQUFlLFFBQWYsSUFBMkIsUUFBT3RCLEdBQVAsS0FBYyxRQUE3QyxFQUF1RDtBQUNyRCxRQUFJdUIsR0FBRyxHQUFHRCxJQUFJLENBQUN2QixHQUFMLENBQVN5QixLQUFULENBQWUsR0FBZixDQUFWOztBQUNBLFNBQUssSUFBSU4sQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0ssR0FBRyxDQUFDUCxNQUF4QixFQUFnQ0UsQ0FBQyxFQUFqQztBQUNFSyxNQUFBQSxHQUFHLENBQUNMLENBQUQsQ0FBSCxHQUFTLE1BQU1LLEdBQUcsQ0FBQ0wsQ0FBRCxDQUFsQjtBQURGOztBQUVBLFFBQUlPLEdBQUcsR0FBRyxFQUFWOztBQUNBLFNBQUssSUFBSVAsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0ssR0FBRyxDQUFDUCxNQUF4QixFQUFnQ0UsQ0FBQyxFQUFqQztBQUNFTyxNQUFBQSxHQUFHLENBQUNQLENBQUQsQ0FBSCxHQUFTLElBQUlRLE1BQUosQ0FBV0gsR0FBRyxDQUFDTCxDQUFELENBQUgsR0FBUyxHQUFwQixDQUFUO0FBREY7O0FBRUFyQixJQUFBQSxlQUFlLENBQUM4QixPQUFPLENBQUNDLEdBQVIsRUFBRCxFQUFnQkgsR0FBaEIsRUFBcUJ6QixHQUFyQixDQUFmO0FBQ0Q7QUFDRixDQVZEOztlQVllO0FBQ1pxQixFQUFBQSx3QkFBd0IsRUFBeEJBO0FBRFksQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcyBmcm9tICdmcyc7XHJcblxyXG5mdW5jdGlvbiBmaW5kX2V4dGVuc2lvbnMoZm9sZGVyLCBleHQsIHJldCkge1xyXG4gIHRyeSB7XHJcbiAgICBmcy5hY2Nlc3NTeW5jKGZvbGRlciwgZnMuY29uc3RhbnRzLlJfT0spO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBpZiAoZnMuc3RhdFN5bmMoZm9sZGVyKS5pc0RpcmVjdG9yeSgpICYmIGZvbGRlci5pbmRleE9mKCdub2RlX21vZHVsZXMnKSA9PSAtMSAmJiAoZnMuc3RhdFN5bmMoZm9sZGVyKVtcIm1vZGVcIl0gJiA0KSkge1xyXG4gICAgZnMucmVhZGRpclN5bmMoZm9sZGVyKS5mb3JFYWNoKGZpbGUgPT4ge1xyXG4gICAgICB2YXIgdG1wO1xyXG4gICAgICBpZiAoTnVtYmVyLnBhcnNlSW50KGZvbGRlci5sYXN0SW5kZXhPZignLycpICsgMSkgPT09IGZvbGRlci5sZW5ndGgpXHJcbiAgICAgICAgdG1wID0gZm9sZGVyICsgZmlsZTtcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHRtcCA9IGZvbGRlciArICcvJyArIGZpbGU7XHJcbiAgICAgIGlmIChmcy5zdGF0U3luYyh0bXApLmlzRGlyZWN0b3J5KCkpXHJcbiAgICAgICAgZmluZF9leHRlbnNpb25zKHRtcCwgZXh0LCByZXQpO1xyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB2YXIgcCA9IHRydWU7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleHQubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICBpZiAoZXh0W2ldLnRlc3QoZmlsZSkpXHJcbiAgICAgICAgICAgIHAgPSBmYWxzZTtcclxuICAgICAgICBpZiAocClcclxuICAgICAgICAgIHJldC5wdXNoKGZvbGRlciArICcvJyArIGZpbGUpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IG1ha2VfYXZhaWxhYmxlX2V4dGVuc2lvbiA9IGZ1bmN0aW9uIG1ha2VfYXZhaWxhYmxlX2V4dGVuc2lvbihvcHRzLCByZXQpIHtcclxuICBpZiAodHlwZW9mIG9wdHMgPT0gJ29iamVjdCcgJiYgdHlwZW9mIHJldCA9PSAnb2JqZWN0Jykge1xyXG4gICAgdmFyIG1hcyA9IG9wdHMuZXh0LnNwbGl0KCcsJyk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hcy5sZW5ndGg7IGkrKylcclxuICAgICAgbWFzW2ldID0gJy4nICsgbWFzW2ldO1xyXG4gICAgdmFyIHJlcyA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXMubGVuZ3RoOyBpKyspXHJcbiAgICAgIHJlc1tpXSA9IG5ldyBSZWdFeHAobWFzW2ldICsgJyQnKTtcclxuICAgIGZpbmRfZXh0ZW5zaW9ucyhwcm9jZXNzLmN3ZCgpLCByZXMsIHJldCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgIG1ha2VfYXZhaWxhYmxlX2V4dGVuc2lvblxyXG59O1xyXG4iXX0=