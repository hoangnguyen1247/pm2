"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.msg = exports.dump = exports.li = exports.subfield = exports.field = exports.title = exports.line = exports.sep = exports.separator = void 0;

var _util = _interopRequireDefault(require("util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9mbXQudHMiXSwibmFtZXMiOlsic2VwQyIsImxpbmVDIiwiZmllbGRDIiwic2VwYXJhdG9yIiwiY29uc29sZSIsImxvZyIsInNlcCIsImxpbmUiLCJ0aXRsZSIsIm91dCIsInN1YnN0ciIsImxlbmd0aCIsImZpZWxkIiwia2V5IiwidmFsdWUiLCJzdWJmaWVsZCIsImxpIiwibXNnIiwiZHVtcCIsImRhdGEiLCJuYW1lIiwidXRpbCIsImluc3BlY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFXQTs7OztBQVhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBSUE7QUFFQSxJQUFJQSxJQUFJLEdBQUksaUZBQVo7QUFDQSxJQUFJQyxLQUFLLEdBQUcsaUZBQVo7QUFDQSxJQUFJQyxNQUFNLEdBQUcsc0JBQWIsQyxDQUVBO0FBRUE7O0FBQ08sSUFBTUMsU0FBUyxHQUFHLFNBQVpBLFNBQVksR0FBVztBQUNoQ0MsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlMLElBQVo7QUFDSCxDQUZNLEMsQ0FJUDs7OztBQUNPLElBQU1NLEdBQUcsR0FBR0gsU0FBWixDLENBRVA7Ozs7QUFDTyxJQUFNSSxJQUFJLEdBQUcsU0FBUEEsSUFBTyxHQUFXO0FBQzNCSCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUosS0FBWjtBQUNILENBRk0sQyxDQUlQOzs7OztBQUNPLElBQU1PLEtBQUssR0FBRyxlQUFTQSxNQUFULEVBQWdCO0FBQ2pDLE1BQUlDLEdBQUcsR0FBRyxTQUFTRCxNQUFULEdBQWlCLEdBQTNCO0FBQ0FDLEVBQUFBLEdBQUcsSUFBSVIsS0FBSyxDQUFDUyxNQUFOLENBQWFELEdBQUcsQ0FBQ0UsTUFBakIsQ0FBUDtBQUNBUCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUksR0FBWjtBQUNILENBSk0sQyxDQU1QOzs7OztBQUNPLElBQU1HLEtBQUssR0FBRyxTQUFSQSxLQUFRLENBQVNDLEdBQVQsRUFBY0MsS0FBZCxFQUFxQjtBQUN0Q1YsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksS0FBS1EsR0FBTCxHQUFXWCxNQUFNLENBQUNRLE1BQVAsQ0FBY0csR0FBRyxDQUFDRixNQUFsQixDQUFYLEdBQXVDLEtBQXZDLEdBQStDRyxLQUEzRDtBQUNILENBRk0sQyxDQUlQOzs7OztBQUNPLElBQU1DLFFBQVEsR0FBRyxTQUFYQSxRQUFXLENBQVNGLEdBQVQsRUFBY0MsS0FBZCxFQUFxQjtBQUN6Q1YsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksT0FBT1EsR0FBUCxHQUFhWCxNQUFNLENBQUNRLE1BQVAsQ0FBY0csR0FBRyxDQUFDRixNQUFKLEdBQWEsQ0FBM0IsQ0FBYixHQUE2QyxLQUE3QyxHQUFxREcsS0FBakU7QUFDSCxDQUZNLEMsQ0FJUDs7Ozs7QUFDTyxJQUFNRSxFQUFFLEdBQUcsU0FBTEEsRUFBSyxDQUFTQyxHQUFULEVBQWM7QUFDNUJiLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLE9BQU9ZLEdBQW5CO0FBQ0gsQ0FGTSxDLENBSVA7Ozs7O0FBQ08sSUFBTUMsSUFBSSxHQUFHLFNBQVBBLElBQU8sQ0FBU0MsSUFBVCxFQUFlQyxJQUFmLEVBQXFCO0FBQ3JDLE1BQUtBLElBQUwsRUFBWTtBQUNSaEIsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVllLElBQUksR0FBRyxJQUFuQixFQUF5QkMsaUJBQUtDLE9BQUwsQ0FBYUgsSUFBYixFQUFtQixLQUFuQixFQUEwQixJQUExQixFQUFnQyxJQUFoQyxDQUF6QjtBQUNILEdBRkQsTUFHSztBQUNEZixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWWdCLGlCQUFLQyxPQUFMLENBQWFILElBQWIsRUFBbUIsS0FBbkIsRUFBMEIsSUFBMUIsRUFBZ0MsSUFBaEMsQ0FBWjtBQUNIO0FBQ0osQ0FQTSxDLENBU1A7Ozs7O0FBQ08sSUFBTUYsR0FBRyxHQUFHLGFBQVNBLElBQVQsRUFBYztBQUM3QmIsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlZLElBQVo7QUFDSCxDQUZNLEMsQ0FJUCIsInNvdXJjZXNDb250ZW50IjpbIi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vXHJcbi8vIGZtdC5qcyAtIENvbW1hbmQgbGluZSBvdXRwdXQgZm9ybWF0dGluZy5cclxuLy9cclxuLy8gQ29weXJpZ2h0IChjKSAyMDEyIEFuZHJldyBDaGlsdG9uIC0gaHR0cDovL2NoaWx0cy5vcmcvXHJcbi8vIFdyaXR0ZW4gYnkgQW5kcmV3IENoaWx0b24gPGFuZHljaGlsdG9uQGdtYWlsLmNvbT5cclxuLy9cclxuLy8gTGljZW5zZTogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFxyXG4vL1xyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuaW1wb3J0IHV0aWwgZnJvbSAndXRpbCc7XHJcblxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxudmFyIHNlcEMgID0gJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nO1xyXG52YXIgbGluZUMgPSAnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSc7XHJcbnZhciBmaWVsZEMgPSAnICAgICAgICAgICAgICAgICAgICAnO1xyXG5cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbi8vIHNlcGFyYXRvclxyXG5leHBvcnQgY29uc3Qgc2VwYXJhdG9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zb2xlLmxvZyhzZXBDKTtcclxufTtcclxuXHJcbi8vIGFsaWFzIHRoZSBhYm92ZVxyXG5leHBvcnQgY29uc3Qgc2VwID0gc2VwYXJhdG9yO1xyXG5cclxuLy8gbGluZVxyXG5leHBvcnQgY29uc3QgbGluZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc29sZS5sb2cobGluZUMpO1xyXG59O1xyXG5cclxuLy8gdGl0bGVcclxuZXhwb3J0IGNvbnN0IHRpdGxlID0gZnVuY3Rpb24odGl0bGUpIHtcclxuICAgIHZhciBvdXQgPSAnLS0tICcgKyB0aXRsZSArICcgJztcclxuICAgIG91dCArPSBsaW5lQy5zdWJzdHIob3V0Lmxlbmd0aCk7XHJcbiAgICBjb25zb2xlLmxvZyhvdXQpO1xyXG59O1xyXG5cclxuLy8gZmllbGRcclxuZXhwb3J0IGNvbnN0IGZpZWxkID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgY29uc29sZS5sb2coJycgKyBrZXkgKyBmaWVsZEMuc3Vic3RyKGtleS5sZW5ndGgpICsgJyA6ICcgKyB2YWx1ZSk7XHJcbn07XHJcblxyXG4vLyBzdWJmaWVsZFxyXG5leHBvcnQgY29uc3Qgc3ViZmllbGQgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICBjb25zb2xlLmxvZygnLSAnICsga2V5ICsgZmllbGRDLnN1YnN0cihrZXkubGVuZ3RoICsgMikgKyAnIDogJyArIHZhbHVlKTtcclxufTtcclxuXHJcbi8vIGxpc3QgaXRlbVxyXG5leHBvcnQgY29uc3QgbGkgPSBmdW5jdGlvbihtc2cpIHtcclxuICAgIGNvbnNvbGUubG9nKCcqICcgKyBtc2cpO1xyXG59O1xyXG5cclxuLy8gZHVtcFxyXG5leHBvcnQgY29uc3QgZHVtcCA9IGZ1bmN0aW9uKGRhdGEsIG5hbWUpIHtcclxuICAgIGlmICggbmFtZSApIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhuYW1lICsgJyA6JywgdXRpbC5pbnNwZWN0KGRhdGEsIGZhbHNlLCBudWxsLCB0cnVlKSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZyh1dGlsLmluc3BlY3QoZGF0YSwgZmFsc2UsIG51bGwsIHRydWUpKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8vIG1zZ1xyXG5leHBvcnQgY29uc3QgbXNnID0gZnVuY3Rpb24obXNnKSB7XHJcbiAgICBjb25zb2xlLmxvZyhtc2cpO1xyXG59O1xyXG5cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuIl19