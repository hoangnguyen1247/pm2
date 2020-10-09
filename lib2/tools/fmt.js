"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.msg = exports.dump = exports.li = exports.subfield = exports.field = exports.title = exports.line = exports.sep = exports.separator = void 0;

var _util = _interopRequireDefault(require("util"));

// --------------------------------------------------------------------------------------------------------------------
//
// fmt.js - Command line output formatting.
//
// Copyright (c) 2012 Andrew Chilton - http://chilts.org/
// Written by Andrew Chilton <andychilton@gmail.com>
//
// License: http://opensource.org/licenses/MIT
//
// --------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------
var sepC = '===============================================================================';
var lineC = '-------------------------------------------------------------------------------';
var fieldC = '                    '; // --------------------------------------------------------------------------------------------------------------------
// separator

var separator = function separator() {
  console.log(sepC);
}; // alias the above


exports.separator = separator;
var sep = separator; // line

exports.sep = sep;

var line = function line() {
  console.log(lineC);
}; // title


exports.line = line;

var title = function title(_title) {
  var out = '--- ' + _title + ' ';
  out += lineC.substr(out.length);
  console.log(out);
}; // field


exports.title = title;

var field = function field(key, value) {
  console.log('' + key + fieldC.substr(key.length) + ' : ' + value);
}; // subfield


exports.field = field;

var subfield = function subfield(key, value) {
  console.log('- ' + key + fieldC.substr(key.length + 2) + ' : ' + value);
}; // list item


exports.subfield = subfield;

var li = function li(msg) {
  console.log('* ' + msg);
}; // dump


exports.li = li;

var dump = function dump(data, name) {
  if (name) {
    console.log(name + ' :', _util["default"].inspect(data, false, null, true));
  } else {
    console.log(_util["default"].inspect(data, false, null, true));
  }
}; // msg


exports.dump = dump;

var msg = function msg(_msg) {
  console.log(_msg);
}; // --------------------------------------------------------------------------------------------------------------------


exports.msg = msg;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9mbXQudHMiXSwibmFtZXMiOlsic2VwQyIsImxpbmVDIiwiZmllbGRDIiwic2VwYXJhdG9yIiwiY29uc29sZSIsImxvZyIsInNlcCIsImxpbmUiLCJ0aXRsZSIsIm91dCIsInN1YnN0ciIsImxlbmd0aCIsImZpZWxkIiwia2V5IiwidmFsdWUiLCJzdWJmaWVsZCIsImxpIiwibXNnIiwiZHVtcCIsImRhdGEiLCJuYW1lIiwidXRpbCIsImluc3BlY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQVdBOztBQVhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBSUE7QUFFQSxJQUFJQSxJQUFJLEdBQUksaUZBQVo7QUFDQSxJQUFJQyxLQUFLLEdBQUcsaUZBQVo7QUFDQSxJQUFJQyxNQUFNLEdBQUcsc0JBQWIsQyxDQUVBO0FBRUE7O0FBQ08sSUFBTUMsU0FBUyxHQUFHLFNBQVpBLFNBQVksR0FBVztBQUNoQ0MsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlMLElBQVo7QUFDSCxDQUZNLEMsQ0FJUDs7OztBQUNPLElBQU1NLEdBQUcsR0FBR0gsU0FBWixDLENBRVA7Ozs7QUFDTyxJQUFNSSxJQUFJLEdBQUcsU0FBUEEsSUFBTyxHQUFXO0FBQzNCSCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUosS0FBWjtBQUNILENBRk0sQyxDQUlQOzs7OztBQUNPLElBQU1PLEtBQUssR0FBRyxlQUFTQSxNQUFULEVBQWdCO0FBQ2pDLE1BQUlDLEdBQUcsR0FBRyxTQUFTRCxNQUFULEdBQWlCLEdBQTNCO0FBQ0FDLEVBQUFBLEdBQUcsSUFBSVIsS0FBSyxDQUFDUyxNQUFOLENBQWFELEdBQUcsQ0FBQ0UsTUFBakIsQ0FBUDtBQUNBUCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUksR0FBWjtBQUNILENBSk0sQyxDQU1QOzs7OztBQUNPLElBQU1HLEtBQUssR0FBRyxTQUFSQSxLQUFRLENBQVNDLEdBQVQsRUFBY0MsS0FBZCxFQUFxQjtBQUN0Q1YsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksS0FBS1EsR0FBTCxHQUFXWCxNQUFNLENBQUNRLE1BQVAsQ0FBY0csR0FBRyxDQUFDRixNQUFsQixDQUFYLEdBQXVDLEtBQXZDLEdBQStDRyxLQUEzRDtBQUNILENBRk0sQyxDQUlQOzs7OztBQUNPLElBQU1DLFFBQVEsR0FBRyxTQUFYQSxRQUFXLENBQVNGLEdBQVQsRUFBY0MsS0FBZCxFQUFxQjtBQUN6Q1YsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksT0FBT1EsR0FBUCxHQUFhWCxNQUFNLENBQUNRLE1BQVAsQ0FBY0csR0FBRyxDQUFDRixNQUFKLEdBQWEsQ0FBM0IsQ0FBYixHQUE2QyxLQUE3QyxHQUFxREcsS0FBakU7QUFDSCxDQUZNLEMsQ0FJUDs7Ozs7QUFDTyxJQUFNRSxFQUFFLEdBQUcsU0FBTEEsRUFBSyxDQUFTQyxHQUFULEVBQWM7QUFDNUJiLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLE9BQU9ZLEdBQW5CO0FBQ0gsQ0FGTSxDLENBSVA7Ozs7O0FBQ08sSUFBTUMsSUFBSSxHQUFHLFNBQVBBLElBQU8sQ0FBU0MsSUFBVCxFQUFlQyxJQUFmLEVBQXFCO0FBQ3JDLE1BQUtBLElBQUwsRUFBWTtBQUNSaEIsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVllLElBQUksR0FBRyxJQUFuQixFQUF5QkMsaUJBQUtDLE9BQUwsQ0FBYUgsSUFBYixFQUFtQixLQUFuQixFQUEwQixJQUExQixFQUFnQyxJQUFoQyxDQUF6QjtBQUNILEdBRkQsTUFHSztBQUNEZixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWWdCLGlCQUFLQyxPQUFMLENBQWFILElBQWIsRUFBbUIsS0FBbkIsRUFBMEIsSUFBMUIsRUFBZ0MsSUFBaEMsQ0FBWjtBQUNIO0FBQ0osQ0FQTSxDLENBU1A7Ozs7O0FBQ08sSUFBTUYsR0FBRyxHQUFHLGFBQVNBLElBQVQsRUFBYztBQUM3QmIsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlZLElBQVo7QUFDSCxDQUZNLEMsQ0FJUCIsInNvdXJjZXNDb250ZW50IjpbIi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vL1xuLy8gZm10LmpzIC0gQ29tbWFuZCBsaW5lIG91dHB1dCBmb3JtYXR0aW5nLlxuLy9cbi8vIENvcHlyaWdodCAoYykgMjAxMiBBbmRyZXcgQ2hpbHRvbiAtIGh0dHA6Ly9jaGlsdHMub3JnL1xuLy8gV3JpdHRlbiBieSBBbmRyZXcgQ2hpbHRvbiA8YW5keWNoaWx0b25AZ21haWwuY29tPlxuLy9cbi8vIExpY2Vuc2U6IGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcbi8vXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxudmFyIHNlcEMgID0gJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nO1xudmFyIGxpbmVDID0gJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nO1xudmFyIGZpZWxkQyA9ICcgICAgICAgICAgICAgICAgICAgICc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIHNlcGFyYXRvclxuZXhwb3J0IGNvbnN0IHNlcGFyYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKHNlcEMpO1xufTtcblxuLy8gYWxpYXMgdGhlIGFib3ZlXG5leHBvcnQgY29uc3Qgc2VwID0gc2VwYXJhdG9yO1xuXG4vLyBsaW5lXG5leHBvcnQgY29uc3QgbGluZSA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKGxpbmVDKTtcbn07XG5cbi8vIHRpdGxlXG5leHBvcnQgY29uc3QgdGl0bGUgPSBmdW5jdGlvbih0aXRsZSkge1xuICAgIHZhciBvdXQgPSAnLS0tICcgKyB0aXRsZSArICcgJztcbiAgICBvdXQgKz0gbGluZUMuc3Vic3RyKG91dC5sZW5ndGgpO1xuICAgIGNvbnNvbGUubG9nKG91dCk7XG59O1xuXG4vLyBmaWVsZFxuZXhwb3J0IGNvbnN0IGZpZWxkID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgIGNvbnNvbGUubG9nKCcnICsga2V5ICsgZmllbGRDLnN1YnN0cihrZXkubGVuZ3RoKSArICcgOiAnICsgdmFsdWUpO1xufTtcblxuLy8gc3ViZmllbGRcbmV4cG9ydCBjb25zdCBzdWJmaWVsZCA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICBjb25zb2xlLmxvZygnLSAnICsga2V5ICsgZmllbGRDLnN1YnN0cihrZXkubGVuZ3RoICsgMikgKyAnIDogJyArIHZhbHVlKTtcbn07XG5cbi8vIGxpc3QgaXRlbVxuZXhwb3J0IGNvbnN0IGxpID0gZnVuY3Rpb24obXNnKSB7XG4gICAgY29uc29sZS5sb2coJyogJyArIG1zZyk7XG59O1xuXG4vLyBkdW1wXG5leHBvcnQgY29uc3QgZHVtcCA9IGZ1bmN0aW9uKGRhdGEsIG5hbWUpIHtcbiAgICBpZiAoIG5hbWUgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKG5hbWUgKyAnIDonLCB1dGlsLmluc3BlY3QoZGF0YSwgZmFsc2UsIG51bGwsIHRydWUpKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHV0aWwuaW5zcGVjdChkYXRhLCBmYWxzZSwgbnVsbCwgdHJ1ZSkpO1xuICAgIH1cbn07XG5cbi8vIG1zZ1xuZXhwb3J0IGNvbnN0IG1zZyA9IGZ1bmN0aW9uKG1zZykge1xuICAgIGNvbnNvbGUubG9nKG1zZyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIl19