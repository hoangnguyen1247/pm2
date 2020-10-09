"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fclone = _interopRequireDefault(require("fclone"));

var _fs = _interopRequireDefault(require("fs"));

var _waterfall = _interopRequireDefault(require("async/waterfall"));

var _util = _interopRequireDefault(require("util"));

var _url = _interopRequireDefault(require("url"));

var _dayjs = _interopRequireDefault(require("dayjs"));

var _constants = _interopRequireDefault(require("../constants"));

var _findPackageJson = _interopRequireDefault(require("./tools/find-package-json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var Utility = {
  findPackageVersion: function findPackageVersion(fullpath) {
    var version;

    try {
      version = (0, _findPackageJson["default"])(fullpath).next().value.version;
    } catch (e) {
      version = 'N/A';
    }

    return version;
  },
  getDate: function getDate() {
    return Date.now();
  },
  extendExtraConfig: function extendExtraConfig(proc, opts) {
    if (opts.env && opts.env.current_conf) {
      if (opts.env.current_conf.env && _typeof(opts.env.current_conf.env) === 'object' && Object.keys(opts.env.current_conf.env).length === 0) delete opts.env.current_conf.env;
      Utility.extendMix(proc.pm2_env, opts.env.current_conf);
      delete opts.env.current_conf;
    }
  },
  formatCLU: function formatCLU(process) {
    if (!process.pm2_env) {
      return process;
    }

    var obj = Utility.clone(process.pm2_env);
    delete obj.env;
    return obj;
  },
  extend: function extend(destination, source) {
    if (!source || _typeof(source) != 'object') return destination;
    Object.keys(source).forEach(function (new_key) {
      if (source[new_key] != '[object Object]') destination[new_key] = source[new_key];
    });
    return destination;
  },
  // Same as extend but drop value with 'null'
  extendMix: function extendMix(destination, source) {
    if (!source || _typeof(source) != 'object') return destination;
    Object.keys(source).forEach(function (new_key) {
      if (source[new_key] == 'null') delete destination[new_key];else destination[new_key] = source[new_key];
    });
    return destination;
  },
  whichFileExists: function whichFileExists(file_arr) {
    var f = null;
    file_arr.some(function (file) {
      try {
        _fs["default"].statSync(file);
      } catch (e) {
        return false;
      }

      f = file;
      return true;
    });
    return f;
  },
  clone: function clone(obj) {
    if (obj === null || obj === undefined) return {};
    return (0, _fclone["default"])(obj);
  },
  overrideConsole: function overrideConsole(bus) {
    if (_constants["default"].PM2_LOG_DATE_FORMAT && typeof _constants["default"].PM2_LOG_DATE_FORMAT == 'string') {
      // Generate timestamp prefix
      var timestamp = function timestamp() {
        return "".concat((0, _dayjs["default"])(Date.now()).format('YYYY-MM-DDTHH:mm:ss'), ":");
      };

      var hacks = ['info', 'log', 'error', 'warn'],
          consoled = {}; // store console functions.

      hacks.forEach(function (method) {
        consoled[method] = console[method];
      });
      hacks.forEach(function (k) {
        console[k] = function () {
          if (bus) {
            bus.emit('log:PM2', {
              process: {
                pm_id: 'PM2',
                name: 'PM2',
                rev: null
              },
              at: Utility.getDate(),
              data: _util["default"].format.apply(this, arguments) + '\n'
            });
          } // do not destroy variable insertion


          arguments[0] && (arguments[0] = timestamp() + ' PM2 ' + k + ': ' + arguments[0]);
          consoled[k].apply(console, arguments);
        };
      });
    }
  },
  startLogging: function startLogging(stds, callback) {
    /**
     * Start log outgoing messages
     * @method startLogging
     * @param {} callback
     * @return
     */
    // Make sure directories of `logs` and `pids` exist.
    // try {
    //   ['logs', 'pids'].forEach(function(n){
    //     console.log(n);
    //     (function(_path){
    //       !fs.existsSync(_path) && fs.mkdirSync(_path, '0755');
    //     })(path.resolve(cst.PM2_ROOT_PATH, n));
    //   });
    // } catch(err) {
    //   return callback(new Error('can not create directories (logs/pids):' + err.message));
    // }
    // waterfall.
    var flows = []; // types of stdio, should be sorted as `std(entire log)`, `out`, `err`.

    var types = Object.keys(stds).sort(function (x, y) {
      return -x.charCodeAt(0) + y.charCodeAt(0);
    }); // Create write streams.

    (function createWS(pio) {
      if (pio.length != 1) {
        return false;
      }

      var io = pio[0]; // If `std` is a Stream type, try next `std`.
      // compatible with `pm2 reloadLogs`

      if (_typeof(stds[io]) == 'object' && !isNaN(stds[io].fd)) {
        return createWS(types.splice(0, 1));
      }

      flows.push(function (next) {
        var file = stds[io]; // if file contains ERR or /dev/null, dont try to create stream since he dont want logs

        if (!file || file.indexOf('NULL') > -1 || file.indexOf('/dev/null') > -1) return next();
        stds[io] = _fs["default"].createWriteStream(file, {
          flags: 'a'
        }).once('error', next).on('open', function () {
          stds[io].removeListener('error', next);
          stds[io].on('error', function (err) {
            console.error(err);
          });
          next();
        });
        stds[io]._file = file;
      });
      return createWS(types.splice(0, 1));
    })(types.splice(0, 1));

    (0, _waterfall["default"])(flows, callback);
  },

  /**
   * Function parse the module name and returns it as canonic:
   * - Makes the name based on installation filename.
   * - Removes the Github author, module version and git branch from original name.
   *
   * @param {string} module_name
   * @returns {string} Canonic module name (without trimed parts).
   * @example Always returns 'pm2-slack' for inputs 'ma-zal/pm2-slack', 'ma-zal/pm2-slack#own-branch',
   *          'pm2-slack-1.0.0.tgz' or 'pm2-slack@1.0.0'.
   */
  getCanonicModuleName: function getCanonicModuleName(module_name) {
    if (typeof module_name !== 'string') return null;
    var canonic_module_name = module_name; // Returns the module name from a .tgz package name (or the original name if it is not a valid pkg).
    // Input: The package name (e.g. "foo.tgz", "foo-1.0.0.tgz", "folder/foo.tgz")
    // Output: The module name

    if (canonic_module_name.match(/\.tgz($|\?)/)) {
      if (canonic_module_name.match(/^(.+\/)?([^\/]+)\.tgz($|\?)/)) {
        canonic_module_name = canonic_module_name.match(/^(.+\/)?([^\/]+)\.tgz($|\?)/)[2];

        if (canonic_module_name.match(/^(.+)-[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9_]+\.[0-9]+)?$/)) {
          canonic_module_name = canonic_module_name.match(/^(.+)-[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9_]+\.[0-9]+)?$/)[1];
        }
      }
    } //pm2 install git+https://github.com/user/module


    if (canonic_module_name.indexOf('git+') !== -1) {
      canonic_module_name = canonic_module_name.split('/').pop();
    } //pm2 install https://github.com/user/module


    if (canonic_module_name.indexOf('http') !== -1) {
      var uri = _url["default"].parse(canonic_module_name);

      canonic_module_name = uri.pathname.split('/').pop();
    } //pm2 install file:///home/user/module
    else if (canonic_module_name.indexOf('file://') === 0) {
        canonic_module_name = canonic_module_name.replace(/\/$/, '').split('/').pop();
      } //pm2 install username/module
      else if (canonic_module_name.indexOf('/') !== -1) {
          if (canonic_module_name.charAt(0) !== "@") {
            canonic_module_name = canonic_module_name.split('/')[1];
          }
        } //pm2 install @somescope/module@2.1.0-beta


    if (canonic_module_name.lastIndexOf('@') > 0) {
      canonic_module_name = canonic_module_name.substr(0, canonic_module_name.lastIndexOf("@"));
    } //pm2 install module#some-branch


    if (canonic_module_name.indexOf('#') !== -1) {
      canonic_module_name = canonic_module_name.split('#')[0];
    }

    if (canonic_module_name.indexOf('.git') !== -1) {
      canonic_module_name = canonic_module_name.replace('.git', '');
    }

    return canonic_module_name;
  },
  checkPathIsNull: function checkPathIsNull(path) {
    return path === 'NULL' || path === '/dev/null' || path === '\\\\.\\NUL';
  },
  generateUUID: function generateUUID() {
    var s = [];
    var hexDigits = "0123456789abcdef";

    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }

    s[14] = "4";
    s[19] = hexDigits.substr(s[19] & 0x3 | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";
    return s.join("");
  }
};
var _default = Utility;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9VdGlsaXR5LnRzIl0sIm5hbWVzIjpbIlV0aWxpdHkiLCJmaW5kUGFja2FnZVZlcnNpb24iLCJmdWxscGF0aCIsInZlcnNpb24iLCJuZXh0IiwidmFsdWUiLCJlIiwiZ2V0RGF0ZSIsIkRhdGUiLCJub3ciLCJleHRlbmRFeHRyYUNvbmZpZyIsInByb2MiLCJvcHRzIiwiZW52IiwiY3VycmVudF9jb25mIiwiT2JqZWN0Iiwia2V5cyIsImxlbmd0aCIsImV4dGVuZE1peCIsInBtMl9lbnYiLCJmb3JtYXRDTFUiLCJwcm9jZXNzIiwib2JqIiwiY2xvbmUiLCJleHRlbmQiLCJkZXN0aW5hdGlvbiIsInNvdXJjZSIsImZvckVhY2giLCJuZXdfa2V5Iiwid2hpY2hGaWxlRXhpc3RzIiwiZmlsZV9hcnIiLCJmIiwic29tZSIsImZpbGUiLCJmcyIsInN0YXRTeW5jIiwidW5kZWZpbmVkIiwib3ZlcnJpZGVDb25zb2xlIiwiYnVzIiwiY3N0IiwiUE0yX0xPR19EQVRFX0ZPUk1BVCIsInRpbWVzdGFtcCIsImZvcm1hdCIsImhhY2tzIiwiY29uc29sZWQiLCJtZXRob2QiLCJjb25zb2xlIiwiayIsImVtaXQiLCJwbV9pZCIsIm5hbWUiLCJyZXYiLCJhdCIsImRhdGEiLCJ1dGlsIiwiYXBwbHkiLCJhcmd1bWVudHMiLCJzdGFydExvZ2dpbmciLCJzdGRzIiwiY2FsbGJhY2siLCJmbG93cyIsInR5cGVzIiwic29ydCIsIngiLCJ5IiwiY2hhckNvZGVBdCIsImNyZWF0ZVdTIiwicGlvIiwiaW8iLCJpc05hTiIsImZkIiwic3BsaWNlIiwicHVzaCIsImluZGV4T2YiLCJjcmVhdGVXcml0ZVN0cmVhbSIsImZsYWdzIiwib25jZSIsIm9uIiwicmVtb3ZlTGlzdGVuZXIiLCJlcnIiLCJlcnJvciIsIl9maWxlIiwiZ2V0Q2Fub25pY01vZHVsZU5hbWUiLCJtb2R1bGVfbmFtZSIsImNhbm9uaWNfbW9kdWxlX25hbWUiLCJtYXRjaCIsInNwbGl0IiwicG9wIiwidXJpIiwidXJsIiwicGFyc2UiLCJwYXRobmFtZSIsInJlcGxhY2UiLCJjaGFyQXQiLCJsYXN0SW5kZXhPZiIsInN1YnN0ciIsImNoZWNrUGF0aElzTnVsbCIsInBhdGgiLCJnZW5lcmF0ZVVVSUQiLCJzIiwiaGV4RGlnaXRzIiwiaSIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsImpvaW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFVQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FBRUEsSUFBSUEsT0FBTyxHQUFHO0FBQ1pDLEVBQUFBLGtCQUFrQixFQUFHLDRCQUFTQyxRQUFULEVBQW1CO0FBQ3RDLFFBQUlDLE9BQUo7O0FBRUEsUUFBSTtBQUNGQSxNQUFBQSxPQUFPLEdBQUcsaUNBQWdCRCxRQUFoQixFQUEwQkUsSUFBMUIsR0FBaUNDLEtBQWpDLENBQXVDRixPQUFqRDtBQUNELEtBRkQsQ0FFRSxPQUFNRyxDQUFOLEVBQVM7QUFDVEgsTUFBQUEsT0FBTyxHQUFHLEtBQVY7QUFDRDs7QUFDRCxXQUFPQSxPQUFQO0FBQ0QsR0FWVztBQVdaSSxFQUFBQSxPQUFPLEVBQUcsbUJBQVc7QUFDbkIsV0FBT0MsSUFBSSxDQUFDQyxHQUFMLEVBQVA7QUFDRCxHQWJXO0FBY1pDLEVBQUFBLGlCQUFpQixFQUFHLDJCQUFTQyxJQUFULEVBQWVDLElBQWYsRUFBcUI7QUFDdkMsUUFBSUEsSUFBSSxDQUFDQyxHQUFMLElBQVlELElBQUksQ0FBQ0MsR0FBTCxDQUFTQyxZQUF6QixFQUF1QztBQUNyQyxVQUFJRixJQUFJLENBQUNDLEdBQUwsQ0FBU0MsWUFBVCxDQUFzQkQsR0FBdEIsSUFDQSxRQUFPRCxJQUFJLENBQUNDLEdBQUwsQ0FBU0MsWUFBVCxDQUFzQkQsR0FBN0IsTUFBc0MsUUFEdEMsSUFFQUUsTUFBTSxDQUFDQyxJQUFQLENBQVlKLElBQUksQ0FBQ0MsR0FBTCxDQUFTQyxZQUFULENBQXNCRCxHQUFsQyxFQUF1Q0ksTUFBdkMsS0FBa0QsQ0FGdEQsRUFHRSxPQUFPTCxJQUFJ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UFpDLEVBQUFBLFlBQVksRUFBRSx3QkFBWTtBQUN4QixRQUFJQyxDQUFDLEdBQUcsRUFBUjtBQUNBLFFBQUlDLFNBQVMsR0FBRyxrQkFBaEI7O0FBQ0EsU0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEVBQXBCLEVBQXdCQSxDQUFDLEVBQXpCLEVBQTZCO0FBQzNCRixNQUFBQSxDQUFDLENBQUNFLENBQUQsQ0FBRCxHQUFPRCxTQUFTLENBQUNMLE1BQVYsQ0FBaUJPLElBQUksQ0FBQ0MsS0FBTCxDQUFXRCxJQUFJLENBQUNFLE1BQUwsS0FBZ0IsSUFBM0IsQ0FBakIsRUFBbUQsQ0FBbkQsQ0FBUDtBQUNEOztBQUNETCxJQUFBQSxDQUFDLENBQUMsRUFBRCxDQUFELEdBQVEsR0FBUjtBQUNBQSxJQUFBQSxDQUFDLENBQUMsRUFBRCxDQUFELEdBQVFDLFNBQVMsQ0FBQ0wsTUFBVixDQUFrQkksQ0FBQyxDQUFDLEVBQUQsQ0FBRCxHQUFRLEdBQVQsR0FBZ0IsR0FBakMsRUFBc0MsQ0FBdEMsQ0FBUjtBQUNBQSxJQUFBQSxDQUFDLENBQUMsQ0FBRCxDQUFELEdBQU9BLENBQUMsQ0FBQyxFQUFELENBQUQsR0FBUUEsQ0FBQyxDQUFDLEVBQUQsQ0FBRCxHQUFRQSxDQUFDLENBQUMsRUFBRCxDQUFELEdBQVEsR0FBL0I7QUFDQSxXQUFPQSxDQUFDLENBQUNNLElBQUYsQ0FBTyxFQUFQLENBQVA7QUFDRDtBQWhRVyxDQUFkO2VBb1FlekcsTyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcclxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIENvbW1vbiBVdGlsaXRpZXMgT05MWSBVU0VEIElOIC0+REFFTU9OPC1cclxuICovXHJcblxyXG5pbXBvcnQgZmNsb25lIGZyb20gJ2ZjbG9uZSc7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCB3YXRlcmZhbGwgZnJvbSAnYXN5bmMvd2F0ZXJmYWxsJztcclxuaW1wb3J0IHV0aWwgZnJvbSAndXRpbCc7XHJcbmltcG9ydCB1cmwgZnJvbSAndXJsJztcclxuaW1wb3J0IGRheWpzIGZyb20gJ2RheWpzJztcclxuaW1wb3J0IGNzdCBmcm9tICcuLi9jb25zdGFudHMnO1xyXG5pbXBvcnQgZmluZFBhY2thZ2VKc29uIGZyb20gJy4vdG9vbHMvZmluZC1wYWNrYWdlLWpzb24nO1xyXG5cclxudmFyIFV0aWxpdHkgPSB7XHJcbiAgZmluZFBhY2thZ2VWZXJzaW9uIDogZnVuY3Rpb24oZnVsbHBhdGgpIHtcclxuICAgIHZhciB2ZXJzaW9uXHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgdmVyc2lvbiA9IGZpbmRQYWNrYWdlSnNvbihmdWxscGF0aCkubmV4dCgpLnZhbHVlLnZlcnNpb25cclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICB2ZXJzaW9uID0gJ04vQSdcclxuICAgIH1cclxuICAgIHJldHVybiB2ZXJzaW9uXHJcbiAgfSxcclxuICBnZXREYXRlIDogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gRGF0ZS5ub3coKTtcclxuICB9LFxyXG4gIGV4dGVuZEV4dHJhQ29uZmlnIDogZnVuY3Rpb24ocHJvYywgb3B0cykge1xyXG4gICAgaWYgKG9wdHMuZW52ICYmIG9wdHMuZW52LmN1cnJlbnRfY29uZikge1xyXG4gICAgICBpZiAob3B0cy5lbnYuY3VycmVudF9jb25mLmVudiAmJlxyXG4gICAgICAgICAgdHlwZW9mKG9wdHMuZW52LmN1cnJlbnRfY29uZi5lbnYpID09PSAnb2JqZWN0JyAmJlxyXG4gICAgICAgICAgT2JqZWN0LmtleXMob3B0cy5lbnYuY3VycmVudF9jb25mLmVudikubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIGRlbGV0ZSBvcHRzLmVudi5jdXJyZW50X2NvbmYuZW52XHJcblxyXG4gICAgICBVdGlsaXR5LmV4dGVuZE1peChwcm9jLnBtMl9lbnYsIG9wdHMuZW52LmN1cnJlbnRfY29uZik7XHJcbiAgICAgIGRlbGV0ZSBvcHRzLmVudi5jdXJyZW50X2NvbmY7XHJcbiAgICB9XHJcbiAgfSxcclxuICBmb3JtYXRDTFUgOiBmdW5jdGlvbihwcm9jZXNzKSB7XHJcbiAgICBpZiAoIXByb2Nlc3MucG0yX2Vudikge1xyXG4gICAgICByZXR1cm4gcHJvY2VzcztcclxuICAgIH1cclxuXHJcbiAgICB2YXIgb2JqID0gVXRpbGl0eS5jbG9uZShwcm9jZXNzLnBtMl9lbnYpO1xyXG4gICAgZGVsZXRlIG9iai5lbnY7XHJcblxyXG4gICAgcmV0dXJuIG9iajtcclxuICB9LFxyXG4gIGV4dGVuZCA6IGZ1bmN0aW9uKGRlc3RpbmF0aW9uLCBzb3VyY2Upe1xyXG4gICAgaWYgKCFzb3VyY2UgfHwgdHlwZW9mIHNvdXJjZSAhPSAnb2JqZWN0JykgcmV0dXJuIGRlc3RpbmF0aW9uO1xyXG5cclxuICAgICAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uKG5ld19rZXkpIHtcclxuICAgICAgICBpZiAoc291cmNlW25ld19rZXldICE9ICdbb2JqZWN0IE9iamVjdF0nKVxyXG4gICAgICAgICAgZGVzdGluYXRpb25bbmV3X2tleV0gPSBzb3VyY2VbbmV3X2tleV07XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBkZXN0aW5hdGlvbjtcclxuICB9LFxyXG4gIC8vIFNhbWUgYXMgZXh0ZW5kIGJ1dCBkcm9wIHZhbHVlIHdpdGggJ251bGwnXHJcbiAgZXh0ZW5kTWl4IDogZnVuY3Rpb24oZGVzdGluYXRpb24sIHNvdXJjZSl7XHJcbiAgICBpZiAoIXNvdXJjZSB8fCB0eXBlb2Ygc291cmNlICE9ICdvYmplY3QnKSByZXR1cm4gZGVzdGluYXRpb247XHJcblxyXG4gICAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uKG5ld19rZXkpIHtcclxuICAgICAgaWYgKHNvdXJjZVtuZXdfa2V5XSA9PSAnbnVsbCcpXHJcbiAgICAgICAgZGVsZXRlIGRlc3RpbmF0aW9uW25ld19rZXldO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgZGVzdGluYXRpb25bbmV3X2tleV0gPSBzb3VyY2VbbmV3X2tleV1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBkZXN0aW5hdGlvbjtcclxuICB9LFxyXG5cclxuICB3aGljaEZpbGVFeGlzdHMgOiBmdW5jdGlvbihmaWxlX2Fycikge1xyXG4gICAgdmFyIGYgPSBudWxsO1xyXG5cclxuICAgIGZpbGVfYXJyLnNvbWUoZnVuY3Rpb24oZmlsZSkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGZzLnN0YXRTeW5jKGZpbGUpO1xyXG4gICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgZiA9IGZpbGU7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gZjtcclxuICB9LFxyXG4gIGNsb25lICAgICA6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgaWYgKG9iaiA9PT0gbnVsbCB8fCBvYmogPT09IHVuZGVmaW5lZCkgcmV0dXJuIHt9O1xyXG4gICAgcmV0dXJuIGZjbG9uZShvYmopO1xyXG4gIH0sXHJcbiAgb3ZlcnJpZGVDb25zb2xlIDogZnVuY3Rpb24oYnVzKSB7XHJcbiAgICBpZiAoY3N0LlBNMl9MT0dfREFURV9GT1JNQVQgJiYgdHlwZW9mIGNzdC5QTTJfTE9HX0RBVEVfRk9STUFUID09ICdzdHJpbmcnKSB7XHJcbiAgICAgIC8vIEdlbmVyYXRlIHRpbWVzdGFtcCBwcmVmaXhcclxuICAgICAgZnVuY3Rpb24gdGltZXN0YW1wKCl7XHJcbiAgICAgICAgcmV0dXJuIGAke2RheWpzKERhdGUubm93KCkpLmZvcm1hdCgnWVlZWS1NTS1ERFRISDptbTpzcycpfTpgO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgaGFja3MgPSBbJ2luZm8nLCAnbG9nJywgJ2Vycm9yJywgJ3dhcm4nXSwgY29uc29sZWQgPSB7fTtcclxuXHJcbiAgICAgIC8vIHN0b3JlIGNvbnNvbGUgZnVuY3Rpb25zLlxyXG4gICAgICBoYWNrcy5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZCl7XHJcbiAgICAgICAgY29uc29sZWRbbWV0aG9kXSA9IGNvbnNvbGVbbWV0aG9kXTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBoYWNrcy5mb3JFYWNoKGZ1bmN0aW9uKGspe1xyXG4gICAgICAgIGNvbnNvbGVba10gPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgaWYgKGJ1cykge1xyXG4gICAgICAgICAgICBidXMuZW1pdCgnbG9nOlBNMicsIHtcclxuICAgICAgICAgICAgICBwcm9jZXNzIDoge1xyXG4gICAgICAgICAgICAgICAgcG1faWQgICAgICA6ICdQTTInLFxyXG4gICAgICAgICAgICAgICAgbmFtZSAgICAgICA6ICdQTTInLFxyXG4gICAgICAgICAgICAgICAgcmV2ICAgICAgICA6IG51bGxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGF0ICA6IFV0aWxpdHkuZ2V0RGF0ZSgpLFxyXG4gICAgICAgICAgICAgIGRhdGEgOiB1dGlsLmZvcm1hdC5hcHBseSh0aGlzLCBhcmd1bWVudHMgYXMgYW55KSArICdcXG4nXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gZG8gbm90IGRlc3Ryb3kgdmFyaWFibGUgaW5zZXJ0aW9uXHJcbiAgICAgICAgICBhcmd1bWVudHNbMF0gJiYgKGFyZ3VtZW50c1swXSA9IHRpbWVzdGFtcCgpICsgJyBQTTIgJyArIGsgKyAnOiAnICsgYXJndW1lbnRzWzBdKTtcclxuICAgICAgICAgIGNvbnNvbGVkW2tdLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICBzdGFydExvZ2dpbmcgOiBmdW5jdGlvbihzdGRzLCBjYWxsYmFjaykge1xyXG4gICAgLyoqXHJcbiAgICAgKiBTdGFydCBsb2cgb3V0Z29pbmcgbWVzc2FnZXNcclxuICAgICAqIEBtZXRob2Qgc3RhcnRMb2dnaW5nXHJcbiAgICAgKiBAcGFyYW0ge30gY2FsbGJhY2tcclxuICAgICAqIEByZXR1cm5cclxuICAgICAqL1xyXG4gICAgLy8gTWFrZSBzdXJlIGRpcmVjdG9yaWVzIG9mIGBsb2dzYCBhbmQgYHBpZHNgIGV4aXN0LlxyXG4gICAgLy8gdHJ5IHtcclxuICAgIC8vICAgWydsb2dzJywgJ3BpZHMnXS5mb3JFYWNoKGZ1bmN0aW9uKG4pe1xyXG4gICAgLy8gICAgIGNvbnNvbGUubG9nKG4pO1xyXG4gICAgLy8gICAgIChmdW5jdGlvbihfcGF0aCl7XHJcbiAgICAvLyAgICAgICAhZnMuZXhpc3RzU3luYyhfcGF0aCkgJiYgZnMubWtkaXJTeW5jKF9wYXRoLCAnMDc1NScpO1xyXG4gICAgLy8gICAgIH0pKHBhdGgucmVzb2x2ZShjc3QuUE0yX1JPT1RfUEFUSCwgbikpO1xyXG4gICAgLy8gICB9KTtcclxuICAgIC8vIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAvLyAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ2NhbiBub3QgY3JlYXRlIGRpcmVjdG9yaWVzIChsb2dzL3BpZHMpOicgKyBlcnIubWVzc2FnZSkpO1xyXG4gICAgLy8gfVxyXG5cclxuICAgIC8vIHdhdGVyZmFsbC5cclxuICAgIHZhciBmbG93cyA9IFtdO1xyXG4gICAgLy8gdHlwZXMgb2Ygc3RkaW8sIHNob3VsZCBiZSBzb3J0ZWQgYXMgYHN0ZChlbnRpcmUgbG9nKWAsIGBvdXRgLCBgZXJyYC5cclxuICAgIHZhciB0eXBlcyA9IE9iamVjdC5rZXlzKHN0ZHMpLnNvcnQoZnVuY3Rpb24oeCwgeSl7XHJcbiAgICAgIHJldHVybiAteC5jaGFyQ29kZUF0KDApICsgeS5jaGFyQ29kZUF0KDApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHdyaXRlIHN0cmVhbXMuXHJcbiAgICAoZnVuY3Rpb24gY3JlYXRlV1MocGlvKXtcclxuICAgICAgaWYocGlvLmxlbmd0aCAhPSAxKXtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgbGV0IGlvID0gcGlvWzBdO1xyXG5cclxuICAgICAgLy8gSWYgYHN0ZGAgaXMgYSBTdHJlYW0gdHlwZSwgdHJ5IG5leHQgYHN0ZGAuXHJcbiAgICAgIC8vIGNvbXBhdGlibGUgd2l0aCBgcG0yIHJlbG9hZExvZ3NgXHJcbiAgICAgIGlmKHR5cGVvZiBzdGRzW2lvXSA9PSAnb2JqZWN0JyAmJiAhaXNOYU4oc3Rkc1tpb10uZmQpKXtcclxuICAgICAgICByZXR1cm4gY3JlYXRlV1ModHlwZXMuc3BsaWNlKDAsIDEpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZmxvd3MucHVzaChmdW5jdGlvbihuZXh0KXtcclxuICAgICAgICB2YXIgZmlsZSA9IHN0ZHNbaW9dO1xyXG5cclxuICAgICAgICAvLyBpZiBmaWxlIGNvbnRhaW5zIEVSUiBvciAvZGV2L251bGwsIGRvbnQgdHJ5IHRvIGNyZWF0ZSBzdHJlYW0gc2luY2UgaGUgZG9udCB3YW50IGxvZ3NcclxuICAgICAgICBpZiAoIWZpbGUgfHwgZmlsZS5pbmRleE9mKCdOVUxMJykgPiAtMSB8fCBmaWxlLmluZGV4T2YoJy9kZXYvbnVsbCcpID4gLTEpXHJcbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xyXG5cclxuICAgICAgICBzdGRzW2lvXSA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZpbGUsIHtmbGFnczogJ2EnfSlcclxuICAgICAgICAgIC5vbmNlKCdlcnJvcicsIG5leHQpXHJcbiAgICAgICAgICAub24oJ29wZW4nLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBzdGRzW2lvXS5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBuZXh0KTtcclxuXHJcbiAgICAgICAgICAgIHN0ZHNbaW9dLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICBzdGRzW2lvXS5fZmlsZSA9IGZpbGU7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gY3JlYXRlV1ModHlwZXMuc3BsaWNlKDAsIDEpKTtcclxuICAgIH0pKHR5cGVzLnNwbGljZSgwLCAxKSk7XHJcblxyXG4gICAgd2F0ZXJmYWxsKGZsb3dzLCBjYWxsYmFjayk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogRnVuY3Rpb24gcGFyc2UgdGhlIG1vZHVsZSBuYW1lIGFuZCByZXR1cm5zIGl0IGFzIGNhbm9uaWM6XHJcbiAgICogLSBNYWtlcyB0aGUgbmFtZSBiYXNlZCBvbiBpbnN0YWxsYXRpb24gZmlsZW5hbWUuXHJcbiAgICogLSBSZW1vdmVzIHRoZSBHaXRodWIgYXV0aG9yLCBtb2R1bGUgdmVyc2lvbiBhbmQgZ2l0IGJyYW5jaCBmcm9tIG9yaWdpbmFsIG5hbWUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW9kdWxlX25hbWVcclxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBDYW5vbmljIG1vZHVsZSBuYW1lICh3aXRob3V0IHRyaW1lZCBwYXJ0cykuXHJcbiAgICogQGV4YW1wbGUgQWx3YXlzIHJldHVybnMgJ3BtMi1zbGFjaycgZm9yIGlucHV0cyAnbWEtemFsL3BtMi1zbGFjaycsICdtYS16YWwvcG0yLXNsYWNrI293bi1icmFuY2gnLFxyXG4gICAqICAgICAgICAgICdwbTItc2xhY2stMS4wLjAudGd6JyBvciAncG0yLXNsYWNrQDEuMC4wJy5cclxuICAgKi9cclxuICBnZXRDYW5vbmljTW9kdWxlTmFtZTogZnVuY3Rpb24obW9kdWxlX25hbWUpIHtcclxuICAgIGlmICh0eXBlb2YgbW9kdWxlX25hbWUgIT09ICdzdHJpbmcnKSByZXR1cm4gbnVsbDtcclxuICAgIHZhciBjYW5vbmljX21vZHVsZV9uYW1lID0gbW9kdWxlX25hbWU7XHJcblxyXG4gICAgLy8gUmV0dXJucyB0aGUgbW9kdWxlIG5hbWUgZnJvbSBhIC50Z3ogcGFja2FnZSBuYW1lIChvciB0aGUgb3JpZ2luYWwgbmFtZSBpZiBpdCBpcyBub3QgYSB2YWxpZCBwa2cpLlxyXG4gICAgLy8gSW5wdXQ6IFRoZSBwYWNrYWdlIG5hbWUgKGUuZy4gXCJmb28udGd6XCIsIFwiZm9vLTEuMC4wLnRnelwiLCBcImZvbGRlci9mb28udGd6XCIpXHJcbiAgICAvLyBPdXRwdXQ6IFRoZSBtb2R1bGUgbmFtZVxyXG4gICAgaWYgKGNhbm9uaWNfbW9kdWxlX25hbWUubWF0Y2goL1xcLnRneigkfFxcPykvKSkge1xyXG4gICAgICBpZiAoY2Fub25pY19tb2R1bGVfbmFtZS5tYXRjaCgvXiguK1xcLyk/KFteXFwvXSspXFwudGd6KCR8XFw/KS8pKSB7XHJcbiAgICAgICAgY2Fub25pY19tb2R1bGVfbmFtZSA9IGNhbm9uaWNfbW9kdWxlX25hbWUubWF0Y2goL14oLitcXC8pPyhbXlxcL10rKVxcLnRneigkfFxcPykvKVsyXTtcclxuICAgICAgICBpZiAoY2Fub25pY19tb2R1bGVfbmFtZS5tYXRjaCgvXiguKyktWzAtOV0rXFwuWzAtOV0rXFwuWzAtOV0rKC1bYS16QS1aMC05X10rXFwuWzAtOV0rKT8kLykpIHtcclxuICAgICAgICAgIGNhbm9uaWNfbW9kdWxlX25hbWUgPSBjYW5vbmljX21vZHVsZV9uYW1lLm1hdGNoKC9eKC4rKS1bMC05XStcXC5bMC05XStcXC5bMC05XSsoLVthLXpBLVowLTlfXStcXC5bMC05XSspPyQvKVsxXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL3BtMiBpbnN0YWxsIGdpdCtodHRwczovL2dpdGh1Yi5jb20vdXNlci9tb2R1bGVcclxuICAgIGlmKGNhbm9uaWNfbW9kdWxlX25hbWUuaW5kZXhPZignZ2l0KycpICE9PSAtMSkge1xyXG4gICAgICBjYW5vbmljX21vZHVsZV9uYW1lID0gY2Fub25pY19tb2R1bGVfbmFtZS5zcGxpdCgnLycpLnBvcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vcG0yIGluc3RhbGwgaHR0cHM6Ly9naXRodWIuY29tL3VzZXIvbW9kdWxlXHJcbiAgICBpZihjYW5vbmljX21vZHVsZV9uYW1lLmluZGV4T2YoJ2h0dHAnKSAhPT0gLTEpIHtcclxuICAgICAgdmFyIHVyaSA9IHVybC5wYXJzZShjYW5vbmljX21vZHVsZV9uYW1lKTtcclxuICAgICAgY2Fub25pY19tb2R1bGVfbmFtZSA9IHVyaS5wYXRobmFtZS5zcGxpdCgnLycpLnBvcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vcG0yIGluc3RhbGwgZmlsZTovLy9ob21lL3VzZXIvbW9kdWxlXHJcbiAgICBlbHNlIGlmKGNhbm9uaWNfbW9kdWxlX25hbWUuaW5kZXhPZignZmlsZTovLycpID09PSAwKSB7XHJcbiAgICAgIGNhbm9uaWNfbW9kdWxlX25hbWUgPSBjYW5vbmljX21vZHVsZV9uYW1lLnJlcGxhY2UoL1xcLyQvLCAnJykuc3BsaXQoJy8nKS5wb3AoKTtcclxuICAgIH1cclxuXHJcbiAgICAvL3BtMiBpbnN0YWxsIHVzZXJuYW1lL21vZHVsZVxyXG4gICAgZWxzZSBpZihjYW5vbmljX21vZHVsZV9uYW1lLmluZGV4T2YoJy8nKSAhPT0gLTEpIHtcclxuICAgICAgaWYgKGNhbm9uaWNfbW9kdWxlX25hbWUuY2hhckF0KDApICE9PSBcIkBcIil7XHJcbiAgICAgICAgY2Fub25pY19tb2R1bGVfbmFtZSA9IGNhbm9uaWNfbW9kdWxlX25hbWUuc3BsaXQoJy8nKVsxXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vcG0yIGluc3RhbGwgQHNvbWVzY29wZS9tb2R1bGVAMi4xLjAtYmV0YVxyXG4gICAgaWYoY2Fub25pY19tb2R1bGVfbmFtZS5sYXN0SW5kZXhPZignQCcpID4gMCkge1xyXG4gICAgICBjYW5vbmljX21vZHVsZV9uYW1lID0gY2Fub25pY19tb2R1bGVfbmFtZS5zdWJzdHIoMCxjYW5vbmljX21vZHVsZV9uYW1lLmxhc3RJbmRleE9mKFwiQFwiKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9wbTIgaW5zdGFsbCBtb2R1bGUjc29tZS1icmFuY2hcclxuICAgIGlmKGNhbm9uaWNfbW9kdWxlX25hbWUuaW5kZXhPZignIycpICE9PSAtMSkge1xyXG4gICAgICBjYW5vbmljX21vZHVsZV9uYW1lID0gY2Fub25pY19tb2R1bGVfbmFtZS5zcGxpdCgnIycpWzBdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjYW5vbmljX21vZHVsZV9uYW1lLmluZGV4T2YoJy5naXQnKSAhPT0gLTEpIHtcclxuICAgICAgY2Fub25pY19tb2R1bGVfbmFtZSA9IGNhbm9uaWNfbW9kdWxlX25hbWUucmVwbGFjZSgnLmdpdCcsICcnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2Fub25pY19tb2R1bGVfbmFtZTtcclxuICB9LFxyXG5cclxuICBjaGVja1BhdGhJc051bGw6IGZ1bmN0aW9uKHBhdGgpIHtcclxuICAgIHJldHVybiBwYXRoID09PSAnTlVMTCcgfHwgcGF0aCA9PT0gJy9kZXYvbnVsbCcgfHwgcGF0aCA9PT0gJ1xcXFxcXFxcLlxcXFxOVUwnO1xyXG4gIH0sXHJcblxyXG4gIGdlbmVyYXRlVVVJRDogZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHMgPSBbXTtcclxuICAgIHZhciBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzY7IGkrKykge1xyXG4gICAgICBzW2ldID0gaGV4RGlnaXRzLnN1YnN0cihNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwKSwgMSk7XHJcbiAgICB9XHJcbiAgICBzWzE0XSA9IFwiNFwiO1xyXG4gICAgc1sxOV0gPSBoZXhEaWdpdHMuc3Vic3RyKChzWzE5XSAmIDB4MykgfCAweDgsIDEpO1xyXG4gICAgc1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xyXG4gICAgcmV0dXJuIHMuam9pbihcIlwiKTtcclxuICB9XHJcblxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgVXRpbGl0eTtcclxuIl19