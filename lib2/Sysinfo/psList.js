'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _util = _interopRequireDefault(require("util"));

var _path = _interopRequireDefault(require("path"));

var _child_process = _interopRequireDefault(require("child_process"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var TEN_MEGABYTES = 1000 * 1000 * 10;

var execFile = _util["default"].promisify(_child_process["default"].execFile);

var windows = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var bin, _yield$execFile, stdout;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // Source: https://github.com/MarkTiedemann/fastlist
            bin = _path["default"].join(__dirname, 'fastlist.exe');
            _context.next = 3;
            return execFile(bin, {
              maxBuffer: TEN_MEGABYTES
            });

          case 3:
            _yield$execFile = _context.sent;
            stdout = _yield$execFile.stdout;
            return _context.abrupt("return", stdout.trim().split('\r\n').map(function (line) {
              return line.split('\t');
            }).map(function (_ref2) {
              var _ref3 = (0, _slicedToArray2["default"])(_ref2, 3),
                  name = _ref3[0],
                  pid = _ref3[1],
                  ppid = _ref3[2];

              return {
                name: name,
                pid: Number.parseInt(pid, 10),
                ppid: Number.parseInt(ppid, 10)
              };
            }));

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function windows() {
    return _ref.apply(this, arguments);
  };
}();

var main = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
    var options,
        flags,
        ret,
        _args3 = arguments;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            options = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : {};
            flags = (options.all === false ? '' : 'a') + 'wwxo';
            ret = {};
            _context3.next = 5;
            return Promise.all(['comm', 'args', 'ppid', 'uid', '%cpu', '%mem'].map( /*#__PURE__*/function () {
              var _ref5 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(cmd) {
                var _yield$execFile2, stdout, _iterator, _step, line, _line$split, _line$split2, pid, val;

                return _regenerator["default"].wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        _context2.next = 2;
                        return execFile('ps', [flags, "pid,".concat(cmd)], {
                          maxBuffer: TEN_MEGABYTES
                        });

                      case 2:
                        _yield$execFile2 = _context2.sent;
                        stdout = _yield$execFile2.stdout;
                        _iterator = _createForOfIteratorHelper(stdout.trim().split('\n').slice(1));

                        try {
                          for (_iterator.s(); !(_step = _iterator.n()).done;) {
                            line = _step.value;
                            line = line.trim();
                            _line$split = line.split(' ', 1), _line$split2 = (0, _slicedToArray2["default"])(_line$split, 1), pid = _line$split2[0];
                            val = line.slice(pid.length + 1).trim();

                            if (ret[pid] === undefined) {
                              ret[pid] = {};
                            }

                            ret[pid][cmd] = val;
                          }
                        } catch (err) {
                          _iterator.e(err);
                        } finally {
                          _iterator.f();
                        }

                      case 6:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2);
              }));

              return function (_x) {
                return _ref5.apply(this, arguments);
              };
            }()));

          case 5:
            return _context3.abrupt("return", Object.entries(ret).filter(function (_ref6) {
              var _ref7 = (0, _slicedToArray2["default"])(_ref6, 2),
                  value = _ref7[1];

              return value.comm && value.args && value.ppid && value.uid && value['%cpu'] && value['%mem'];
            }).map(function (_ref8) {
              var _ref9 = (0, _slicedToArray2["default"])(_ref8, 2),
                  key = _ref9[0],
                  value = _ref9[1];

              return {
                pid: Number.parseInt(key, 10),
                name: _path["default"].basename(value.comm),
                cmd: value.args,
                ppid: Number.parseInt(value.ppid, 10),
                uid: Number.parseInt(value.uid, 10),
                cpu: Number.parseFloat(value['%cpu']),
                memory: Number.parseFloat(value['%mem'])
              };
            }));

          case 6:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function main() {
    return _ref4.apply(this, arguments);
  };
}();

var _default = process.platform === 'win32' ? windows : main;

exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9TeXNpbmZvL3BzTGlzdC50cyJdLCJuYW1lcyI6WyJURU5fTUVHQUJZVEVTIiwiZXhlY0ZpbGUiLCJ1dGlsIiwicHJvbWlzaWZ5IiwiY2hpbGRQcm9jZXNzIiwid2luZG93cyIsImJpbiIsInBhdGgiLCJqb2luIiwiX19kaXJuYW1lIiwibWF4QnVmZmVyIiwic3Rkb3V0IiwidHJpbSIsInNwbGl0IiwibWFwIiwibGluZSIsIm5hbWUiLCJwaWQiLCJwcGlkIiwiTnVtYmVyIiwicGFyc2VJbnQiLCJtYWluIiwib3B0aW9ucyIsImZsYWdzIiwiYWxsIiwicmV0IiwiUHJvbWlzZSIsImNtZCIsInNsaWNlIiwidmFsIiwibGVuZ3RoIiwidW5kZWZpbmVkIiwiT2JqZWN0IiwiZW50cmllcyIsImZpbHRlciIsInZhbHVlIiwiY29tbSIsImFyZ3MiLCJ1aWQiLCJrZXkiLCJiYXNlbmFtZSIsImNwdSIsInBhcnNlRmxvYXQiLCJtZW1vcnkiLCJwcm9jZXNzIiwicGxhdGZvcm0iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQSxJQUFNQSxhQUFhLEdBQUcsT0FBTyxJQUFQLEdBQWMsRUFBcEM7O0FBQ0EsSUFBTUMsUUFBUSxHQUFHQyxpQkFBS0MsU0FBTCxDQUFlQywwQkFBYUgsUUFBNUIsQ0FBakI7O0FBRUEsSUFBTUksT0FBTztBQUFBLDJGQUFHO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDZjtBQUNNQyxZQUFBQSxHQUZTLEdBRUhDLGlCQUFLQyxJQUFMLENBQVVDLFNBQVYsRUFBcUIsY0FBckIsQ0FGRztBQUFBO0FBQUEsbUJBSVFSLFFBQVEsQ0FBQ0ssR0FBRCxFQUFNO0FBQUNJLGNBQUFBLFNBQVMsRUFBRVY7QUFBWixhQUFOLENBSmhCOztBQUFBO0FBQUE7QUFJUlcsWUFBQUEsTUFKUSxtQkFJUkEsTUFKUTtBQUFBLDZDQU1SQSxNQUFNLENBQ1hDLElBREssR0FFTEMsS0FG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QUFLLENBQUMsTUFBRCxDQUE1RCxJQUF3RUEsS0FBSyxDQUFDLE1BQUQsQ0FBakc7QUFBQSxhQURGLEVBRUxyQixHQUZLLENBRUQ7QUFBQTtBQUFBLGtCQUFFeUIsR0FBRjtBQUFBLGtCQUFPSixLQUFQOztBQUFBLHFCQUF3QjtBQUM1QmxCLGdCQUFBQSxHQUFHLEVBQUVFLE1BQU0sQ0FBQ0MsUUFBUCxDQUFnQm1CLEdBQWhCLEVBQXFCLEVBQXJCLENBRHVCO0FBRTVCdkIsZ0JBQUFBLElBQUksRUFBRVQsaUJBQUtpQyxRQUFMLENBQWNMLEtBQUssQ0FBQ0MsSUFBcEIsQ0FGc0I7QUFHNUJULGdCQUFBQSxHQUFHLEVBQUVRLEtBQUssQ0FBQ0UsSUFIaUI7QUFJNUJuQixnQkFBQUEsSUFBSSxFQUFFQyxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JlLEtBQUssQ0FBQ2pCLElBQXRCLEVBQTRCLEVBQTVCLENBSnNCO0FBSzVCb0IsZ0JBQUFBLEdBQUcsRUFBRW5CLE1BQU0sQ0FBQ0MsUUFBUCxDQUFnQmUsS0FBSyxDQUFDRyxHQUF0QixFQUEyQixFQUEzQixDQUx1QjtBQU01QkcsZ0JBQUFBLEdBQUcsRUFBRXRCLE1BQU0sQ0FBQ3VCLFVBQVAsQ0FBa0JQLEtBQUssQ0FBQyxNQUFELENBQXZCLENBTnVCO0FBTzVCUSxnQkFBQUEsTUFBTSxFQUFFeEIsTUFBTSxDQUFDdUIsVUFBUCxDQUFrQlAsS0FBSyxDQUFDLE1BQUQsQ0FBdkI7QUFQb0IsZUFBeEI7QUFBQSxhQUZDLENBdEJLOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEdBQUg7O0FBQUEsa0JBQUpkLElBQUk7QUFBQTtBQUFBO0FBQUEsR0FBVjs7ZUFtQ2V1QixPQUFPLENBQUNDLFFBQVIsS0FBcUIsT0FBckIsR0FBK0J4QyxPQUEvQixHQUF5Q2dCLEkiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGNoaWxkUHJvY2VzcyBmcm9tICdjaGlsZF9wcm9jZXNzJztcblxuY29uc3QgVEVOX01FR0FCWVRFUyA9IDEwMDAgKiAxMDAwICogMTA7XG5jb25zdCBleGVjRmlsZSA9IHV0aWwucHJvbWlzaWZ5KGNoaWxkUHJvY2Vzcy5leGVjRmlsZSk7XG5cbmNvbnN0IHdpbmRvd3MgPSBhc3luYyAoKSA9PiB7XG5cdC8vIFNvdXJjZTogaHR0cHM6Ly9naXRodWIuY29tL01hcmtUaWVkZW1hbm4vZmFzdGxpc3Rcblx0Y29uc3QgYmluID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ2Zhc3RsaXN0LmV4ZScpO1xuXG5cdGNvbnN0IHtzdGRvdXR9ID0gYXdhaXQgZXhlY0ZpbGUoYmluLCB7bWF4QnVmZmVyOiBURU5fTUVHQUJZVEVTfSk7XG5cblx0cmV0dXJuIHN0ZG91dFxuXHRcdC50cmltKClcblx0XHQuc3BsaXQoJ1xcclxcbicpXG5cdFx0Lm1hcChsaW5lID0+IGxpbmUuc3BsaXQoJ1xcdCcpKVxuXHRcdC5tYXAoKFtuYW1lLCBwaWQsIHBwaWRdKSA9PiAoe1xuXHRcdFx0bmFtZSxcblx0XHRcdHBpZDogTnVtYmVyLnBhcnNlSW50KHBpZCwgMTApLFxuXHRcdFx0cHBpZDogTnVtYmVyLnBhcnNlSW50KHBwaWQsIDEwKVxuXHRcdH0pKTtcbn07XG5cbmNvbnN0IG1haW4gPSBhc3luYyAob3B0aW9uczogYW55ID0ge30pID0+IHtcblx0Y29uc3QgZmxhZ3MgPSAob3B0aW9ucy5hbGwgPT09IGZhbHNlID8gJycgOiAnYScpICsgJ3d3eG8nO1xuXHRjb25zdCByZXQgPSB7fTtcblxuXHRhd2FpdCBQcm9taXNlLmFsbChbJ2NvbW0nLCAnYXJncycsICdwcGlkJywgJ3VpZCcsICclY3B1JywgJyVtZW0nXS5tYXAoYXN5bmMgY21kID0+IHtcblx0XHRjb25zdCB7c3Rkb3V0fSA9IGF3YWl0IGV4ZWNGaWxlKCdwcycsIFtmbGFncywgYHBpZCwke2NtZH1gXSwge21heEJ1ZmZlcjogVEVOX01FR0FCWVRFU30pO1xuXG5cdFx0Zm9yIChsZXQgbGluZSBvZiBzdGRvdXQudHJpbSgpLnNwbGl0KCdcXG4nKS5zbGljZSgxKSkge1xuXHRcdFx0bGluZSA9IGxpbmUudHJpbSgpO1xuXHRcdFx0Y29uc3QgW3BpZF0gPSBsaW5lLnNwbGl0KCcgJywgMSk7XG5cdFx0XHRjb25zdCB2YWwgPSBsaW5lLnNsaWNlKHBpZC5sZW5ndGggKyAxKS50cmltKCk7XG5cblx0XHRcdGlmIChyZXRbcGlkXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJldFtwaWRdID0ge307XG5cdFx0XHR9XG5cblx0XHRcdHJldFtwaWRdW2NtZF0gPSB2YWw7XG5cdFx0fVxuXHR9KSk7XG5cblx0Ly8gRmlsdGVyIG91dCBpbmNvbnNpc3RlbmNpZXMgYXMgdGhlcmUgbWlnaHQgYmUgcmFjZVxuXHQvLyBpc3N1ZXMgZHVlIHRvIGRpZmZlcmVuY2VzIGluIGBwc2AgYmV0d2VlbiB0aGUgc3Bhd25zXG5cdHJldHVybiBPYmplY3QuZW50cmllcyhyZXQpXG5cdFx0LmZpbHRlcigoWywgdmFsdWVdOiBhbnkpID0+IHZhbHVlLmNvbW0gJiYgdmFsdWUuYXJncyAmJiB2YWx1ZS5wcGlkICYmIHZhbHVlLnVpZCAmJiB2YWx1ZVsnJWNwdSddICYmIHZhbHVlWyclbWVtJ10pXG5cdFx0Lm1hcCgoW2tleSwgdmFsdWVdOiBhbnkpID0+ICh7XG5cdFx0XHRwaWQ6IE51bWJlci5wYXJzZUludChrZXksIDEwKSxcblx0XHRcdG5hbWU6IHBhdGguYmFzZW5hbWUodmFsdWUuY29tbSksXG5cdFx0XHRjbWQ6IHZhbHVlLmFyZ3MsXG5cdFx0XHRwcGlkOiBOdW1iZXIucGFyc2VJbnQodmFsdWUucHBpZCwgMTApLFxuXHRcdFx0dWlkOiBOdW1iZXIucGFyc2VJbnQodmFsdWUudWlkLCAxMCksXG5cdFx0XHRjcHU6IE51bWJlci5wYXJzZUZsb2F0KHZhbHVlWyclY3B1J10pLFxuXHRcdFx0bWVtb3J5OiBOdW1iZXIucGFyc2VGbG9hdCh2YWx1ZVsnJW1lbSddKVxuXHRcdH0pKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicgPyB3aW5kb3dzIDogbWFpbjtcbiJdfQ==