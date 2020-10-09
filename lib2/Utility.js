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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9VdGlsaXR5LnRzIl0sIm5hbWVzIjpbIlV0aWxpdHkiLCJmaW5kUGFja2FnZVZlcnNpb24iLCJmdWxscGF0aCIsInZlcnNpb24iLCJuZXh0IiwidmFsdWUiLCJlIiwiZ2V0RGF0ZSIsIkRhdGUiLCJub3ciLCJleHRlbmRFeHRyYUNvbmZpZyIsInByb2MiLCJvcHRzIiwiZW52IiwiY3VycmVudF9jb25mIiwiT2JqZWN0Iiwia2V5cyIsImxlbmd0aCIsImV4dGVuZE1peCIsInBtMl9lbnYiLCJmb3JtYXRDTFUiLCJwcm9jZXNzIiwib2JqIiwiY2xvbmUiLCJleHRlbmQiLCJkZXN0aW5hdGlvbiIsInNvdXJjZSIsImZvckVhY2giLCJuZXdfa2V5Iiwid2hpY2hGaWxlRXhpc3RzIiwiZmlsZV9hcnIiLCJmIiwic29tZSIsImZpbGUiLCJmcyIsInN0YXRTeW5jIiwidW5kZWZpbmVkIiwib3ZlcnJpZGVDb25zb2xlIiwiYnVzIiwiY3N0IiwiUE0yX0xPR19EQVRFX0ZPUk1BVCIsInRpbWVzdGFtcCIsImZvcm1hdCIsImhhY2tzIiwiY29uc29sZWQiLCJtZXRob2QiLCJjb25zb2xlIiwiayIsImVtaXQiLCJwbV9pZCIsIm5hbWUiLCJyZXYiLCJhdCIsImRhdGEiLCJ1dGlsIiwiYXBwbHkiLCJhcmd1bWVudHMiLCJzdGFydExvZ2dpbmciLCJzdGRzIiwiY2FsbGJhY2siLCJmbG93cyIsInR5cGVzIiwic29ydCIsIngiLCJ5IiwiY2hhckNvZGVBdCIsImNyZWF0ZVdTIiwicGlvIiwiaW8iLCJpc05hTiIsImZkIiwic3BsaWNlIiwicHVzaCIsImluZGV4T2YiLCJjcmVhdGVXcml0ZVN0cmVhbSIsImZsYWdzIiwib25jZSIsIm9uIiwicmVtb3ZlTGlzdGVuZXIiLCJlcnIiLCJlcnJvciIsIl9maWxlIiwiZ2V0Q2Fub25pY01vZHVsZU5hbWUiLCJtb2R1bGVfbmFtZSIsImNhbm9uaWNfbW9kdWxlX25hbWUiLCJtYXRjaCIsInNwbGl0IiwicG9wIiwidXJpIiwidXJsIiwicGFyc2UiLCJwYXRobmFtZSIsInJlcGxhY2UiLCJjaGFyQXQiLCJsYXN0SW5kZXhPZiIsInN1YnN0ciIsImNoZWNrUGF0aElzTnVsbCIsInBhdGgiLCJnZW5lcmF0ZVVVSUQiLCJzIiwiaGV4RGlnaXRzIiwiaSIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsImpvaW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFVQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FBRUEsSUFBSUEsT0FBTyxHQUFHO0FBQ1pDLEVBQUFBLGtCQUFrQixFQUFHLDRCQUFTQyxRQUFULEVBQW1CO0FBQ3RDLFFBQUlDLE9BQUo7O0FBRUEsUUFBSTtBQUNGQSxNQUFBQSxPQUFPLEdBQUcsaUNBQWdCRCxRQUFoQixFQUEwQkUsSUFBMUIsR0FBaUNDLEtBQWpDLENBQXVDRixPQUFqRDtBQUNELEtBRkQsQ0FFRSxPQUFNRyxDQUFOLEVBQVM7QUFDVEgsTUFBQUEsT0FBTyxHQUFHLEtBQVY7QUFDRDs7QUFDRCxXQUFPQSxPQUFQO0FBQ0QsR0FWVztBQVdaSSxFQUFBQSxPQUFPLEVBQUcsbUJBQVc7QUFDbkIsV0FBT0MsSUFBSSxDQUFDQyxHQUFMLEVBQVA7QUFDRCxHQWJXO0FBY1pDLEVBQUFBLGlCQUFpQixFQUFHLDJCQUFTQyxJQUFULEVBQWVDLElBQWYsRUFBcUI7QUFDdkMsUUFBSUEsSUFBSSxDQUFDQyxHQUFMLElBQVlELElBQUksQ0FBQ0MsR0FBTCxDQUFTQyxZQUF6QixFQUF1QztBQUNyQyxVQUFJRixJQUFJLENBQUNDLEdBQUwsQ0FBU0MsWUFBVCxDQUFzQkQsR0FBdEIsSUFDQSxRQUFPRCxJQUFJLENBQUNDLEdBQUwsQ0FBU0MsWUFBVCxDQUFzQkQsR0FBN0IsTUFBc0MsUUFEdEMsSUFFQUUsTUFBTSxDQUFDQyxJQUFQLENBQVlKLElBQUksQ0FBQ0MsR0FBTCxDQUFTQyxZQUFULENBQXNCRCxHQUFsQyxFQUF1Q0ksTUFBdkMsS0FBa0QsQ0FGdEQsRUFHRSxPQUFPTCxJQUFJ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UFpDLEVBQUFBLFlBQVksRUFBRSx3QkFBWTtBQUN4QixRQUFJQyxDQUFDLEdBQUcsRUFBUjtBQUNBLFFBQUlDLFNBQVMsR0FBRyxrQkFBaEI7O0FBQ0EsU0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEVBQXBCLEVBQXdCQSxDQUFDLEVBQXpCLEVBQTZCO0FBQzNCRixNQUFBQSxDQUFDLENBQUNFLENBQUQsQ0FBRCxHQUFPRCxTQUFTLENBQUNMLE1BQVYsQ0FBaUJPLElBQUksQ0FBQ0MsS0FBTCxDQUFXRCxJQUFJLENBQUNFLE1BQUwsS0FBZ0IsSUFBM0IsQ0FBakIsRUFBbUQsQ0FBbkQsQ0FBUDtBQUNEOztBQUNETCxJQUFBQSxDQUFDLENBQUMsRUFBRCxDQUFELEdBQVEsR0FBUjtBQUNBQSxJQUFBQSxDQUFDLENBQUMsRUFBRCxDQUFELEdBQVFDLFNBQVMsQ0FBQ0wsTUFBVixDQUFrQkksQ0FBQyxDQUFDLEVBQUQsQ0FBRCxHQUFRLEdBQVQsR0FBZ0IsR0FBakMsRUFBc0MsQ0FBdEMsQ0FBUjtBQUNBQSxJQUFBQSxDQUFDLENBQUMsQ0FBRCxDQUFELEdBQU9BLENBQUMsQ0FBQyxFQUFELENBQUQsR0FBUUEsQ0FBQyxDQUFDLEVBQUQsQ0FBRCxHQUFRQSxDQUFDLENBQUMsRUFBRCxDQUFELEdBQVEsR0FBL0I7QUFDQSxXQUFPQSxDQUFDLENBQUNNLElBQUYsQ0FBTyxFQUFQLENBQVA7QUFDRDtBQWhRVyxDQUFkO2VBb1FlekcsTyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIGxpY2Vuc2UgdGhhdFxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4gKi9cblxuLyoqXG4gKiBDb21tb24gVXRpbGl0aWVzIE9OTFkgVVNFRCBJTiAtPkRBRU1PTjwtXG4gKi9cblxuaW1wb3J0IGZjbG9uZSBmcm9tICdmY2xvbmUnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCB3YXRlcmZhbGwgZnJvbSAnYXN5bmMvd2F0ZXJmYWxsJztcbmltcG9ydCB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IGRheWpzIGZyb20gJ2RheWpzJztcbmltcG9ydCBjc3QgZnJvbSAnLi4vY29uc3RhbnRzJztcbmltcG9ydCBmaW5kUGFja2FnZUpzb24gZnJvbSAnLi90b29scy9maW5kLXBhY2thZ2UtanNvbic7XG5cbnZhciBVdGlsaXR5ID0ge1xuICBmaW5kUGFja2FnZVZlcnNpb24gOiBmdW5jdGlvbihmdWxscGF0aCkge1xuICAgIHZhciB2ZXJzaW9uXG5cbiAgICB0cnkge1xuICAgICAgdmVyc2lvbiA9IGZpbmRQYWNrYWdlSnNvbihmdWxscGF0aCkubmV4dCgpLnZhbHVlLnZlcnNpb25cbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIHZlcnNpb24gPSAnTi9BJ1xuICAgIH1cbiAgICByZXR1cm4gdmVyc2lvblxuICB9LFxuICBnZXREYXRlIDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIERhdGUubm93KCk7XG4gIH0sXG4gIGV4dGVuZEV4dHJhQ29uZmlnIDogZnVuY3Rpb24ocHJvYywgb3B0cykge1xuICAgIGlmIChvcHRzLmVudiAmJiBvcHRzLmVudi5jdXJyZW50X2NvbmYpIHtcbiAgICAgIGlmIChvcHRzLmVudi5jdXJyZW50X2NvbmYuZW52ICYmXG4gICAgICAgICAgdHlwZW9mKG9wdHMuZW52LmN1cnJlbnRfY29uZi5lbnYpID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgIE9iamVjdC5rZXlzKG9wdHMuZW52LmN1cnJlbnRfY29uZi5lbnYpLmxlbmd0aCA9PT0gMClcbiAgICAgICAgZGVsZXRlIG9wdHMuZW52LmN1cnJlbnRfY29uZi5lbnZcblxuICAgICAgVXRpbGl0eS5leHRlbmRNaXgocHJvYy5wbTJfZW52LCBvcHRzLmVudi5jdXJyZW50X2NvbmYpO1xuICAgICAgZGVsZXRlIG9wdHMuZW52LmN1cnJlbnRfY29uZjtcbiAgICB9XG4gIH0sXG4gIGZvcm1hdENMVSA6IGZ1bmN0aW9uKHByb2Nlc3MpIHtcbiAgICBpZiAoIXByb2Nlc3MucG0yX2Vudikge1xuICAgICAgcmV0dXJuIHByb2Nlc3M7XG4gICAgfVxuXG4gICAgdmFyIG9iaiA9IFV0aWxpdHkuY2xvbmUocHJvY2Vzcy5wbTJfZW52KTtcbiAgICBkZWxldGUgb2JqLmVudjtcblxuICAgIHJldHVybiBvYmo7XG4gIH0sXG4gIGV4dGVuZCA6IGZ1bmN0aW9uKGRlc3RpbmF0aW9uLCBzb3VyY2Upe1xuICAgIGlmICghc291cmNlIHx8IHR5cGVvZiBzb3VyY2UgIT0gJ29iamVjdCcpIHJldHVybiBkZXN0aW5hdGlvbjtcblxuICAgICAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uKG5ld19rZXkpIHtcbiAgICAgICAgaWYgKHNvdXJjZVtuZXdfa2V5XSAhPSAnW29iamVjdCBPYmplY3RdJylcbiAgICAgICAgICBkZXN0aW5hdGlvbltuZXdfa2V5XSA9IHNvdXJjZVtuZXdfa2V5XTtcbiAgICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlc3RpbmF0aW9uO1xuICB9LFxuICAvLyBTYW1lIGFzIGV4dGVuZCBidXQgZHJvcCB2YWx1ZSB3aXRoICdudWxsJ1xuICBleHRlbmRNaXggOiBmdW5jdGlvbihkZXN0aW5hdGlvbiwgc291cmNlKXtcbiAgICBpZiAoIXNvdXJjZSB8fCB0eXBlb2Ygc291cmNlICE9ICdvYmplY3QnKSByZXR1cm4gZGVzdGluYXRpb247XG5cbiAgICBPYmplY3Qua2V5cyhzb3VyY2UpLmZvckVhY2goZnVuY3Rpb24obmV3X2tleSkge1xuICAgICAgaWYgKHNvdXJjZVtuZXdfa2V5XSA9PSAnbnVsbCcpXG4gICAgICAgIGRlbGV0ZSBkZXN0aW5hdGlvbltuZXdfa2V5XTtcbiAgICAgIGVsc2VcbiAgICAgICAgZGVzdGluYXRpb25bbmV3X2tleV0gPSBzb3VyY2VbbmV3X2tleV1cbiAgICB9KTtcblxuICAgIHJldHVybiBkZXN0aW5hdGlvbjtcbiAgfSxcblxuICB3aGljaEZpbGVFeGlzdHMgOiBmdW5jdGlvbihmaWxlX2Fycikge1xuICAgIHZhciBmID0gbnVsbDtcblxuICAgIGZpbGVfYXJyLnNvbWUoZnVuY3Rpb24oZmlsZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZnMuc3RhdFN5bmMoZmlsZSk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgZiA9IGZpbGU7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gZjtcbiAgfSxcbiAgY2xvbmUgICAgIDogZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PT0gbnVsbCB8fCBvYmogPT09IHVuZGVmaW5lZCkgcmV0dXJuIHt9O1xuICAgIHJldHVybiBmY2xvbmUob2JqKTtcbiAgfSxcbiAgb3ZlcnJpZGVDb25zb2xlIDogZnVuY3Rpb24oYnVzKSB7XG4gICAgaWYgKGNzdC5QTTJfTE9HX0RBVEVfRk9STUFUICYmIHR5cGVvZiBjc3QuUE0yX0xPR19EQVRFX0ZPUk1BVCA9PSAnc3RyaW5nJykge1xuICAgICAgLy8gR2VuZXJhdGUgdGltZXN0YW1wIHByZWZpeFxuICAgICAgZnVuY3Rpb24gdGltZXN0YW1wKCl7XG4gICAgICAgIHJldHVybiBgJHtkYXlqcyhEYXRlLm5vdygpKS5mb3JtYXQoJ1lZWVktTU0tRERUSEg6bW06c3MnKX06YDtcbiAgICAgIH1cblxuICAgICAgdmFyIGhhY2tzID0gWydpbmZvJywgJ2xvZycsICdlcnJvcicsICd3YXJuJ10sIGNvbnNvbGVkID0ge307XG5cbiAgICAgIC8vIHN0b3JlIGNvbnNvbGUgZnVuY3Rpb25zLlxuICAgICAgaGFja3MuZm9yRWFjaChmdW5jdGlvbihtZXRob2Qpe1xuICAgICAgICBjb25zb2xlZFttZXRob2RdID0gY29uc29sZVttZXRob2RdO1xuICAgICAgfSk7XG5cbiAgICAgIGhhY2tzLmZvckVhY2goZnVuY3Rpb24oayl7XG4gICAgICAgIGNvbnNvbGVba10gPSBmdW5jdGlvbigpe1xuICAgICAgICAgIGlmIChidXMpIHtcbiAgICAgICAgICAgIGJ1cy5lbWl0KCdsb2c6UE0yJywge1xuICAgICAgICAgICAgICBwcm9jZXNzIDoge1xuICAgICAgICAgICAgICAgIHBtX2lkICAgICAgOiAnUE0yJyxcbiAgICAgICAgICAgICAgICBuYW1lICAgICAgIDogJ1BNMicsXG4gICAgICAgICAgICAgICAgcmV2ICAgICAgICA6IG51bGxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgYXQgIDogVXRpbGl0eS5nZXREYXRlKCksXG4gICAgICAgICAgICAgIGRhdGEgOiB1dGlsLmZvcm1hdC5hcHBseSh0aGlzLCBhcmd1bWVudHMgYXMgYW55KSArICdcXG4nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gZG8gbm90IGRlc3Ryb3kgdmFyaWFibGUgaW5zZXJ0aW9uXG4gICAgICAgICAgYXJndW1lbnRzWzBdICYmIChhcmd1bWVudHNbMF0gPSB0aW1lc3RhbXAoKSArICcgUE0yICcgKyBrICsgJzogJyArIGFyZ3VtZW50c1swXSk7XG4gICAgICAgICAgY29uc29sZWRba10uYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcbiAgc3RhcnRMb2dnaW5nIDogZnVuY3Rpb24oc3RkcywgY2FsbGJhY2spIHtcbiAgICAvKipcbiAgICAgKiBTdGFydCBsb2cgb3V0Z29pbmcgbWVzc2FnZXNcbiAgICAgKiBAbWV0aG9kIHN0YXJ0TG9nZ2luZ1xuICAgICAqIEBwYXJhbSB7fSBjYWxsYmFja1xuICAgICAqIEByZXR1cm5cbiAgICAgKi9cbiAgICAvLyBNYWtlIHN1cmUgZGlyZWN0b3JpZXMgb2YgYGxvZ3NgIGFuZCBgcGlkc2AgZXhpc3QuXG4gICAgLy8gdHJ5IHtcbiAgICAvLyAgIFsnbG9ncycsICdwaWRzJ10uZm9yRWFjaChmdW5jdGlvbihuKXtcbiAgICAvLyAgICAgY29uc29sZS5sb2cobik7XG4gICAgLy8gICAgIChmdW5jdGlvbihfcGF0aCl7XG4gICAgLy8gICAgICAgIWZzLmV4aXN0c1N5bmMoX3BhdGgpICYmIGZzLm1rZGlyU3luYyhfcGF0aCwgJzA3NTUnKTtcbiAgICAvLyAgICAgfSkocGF0aC5yZXNvbHZlKGNzdC5QTTJfUk9PVF9QQVRILCBuKSk7XG4gICAgLy8gICB9KTtcbiAgICAvLyB9IGNhdGNoKGVycikge1xuICAgIC8vICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcignY2FuIG5vdCBjcmVhdGUgZGlyZWN0b3JpZXMgKGxvZ3MvcGlkcyk6JyArIGVyci5tZXNzYWdlKSk7XG4gICAgLy8gfVxuXG4gICAgLy8gd2F0ZXJmYWxsLlxuICAgIHZhciBmbG93cyA9IFtdO1xuICAgIC8vIHR5cGVzIG9mIHN0ZGlvLCBzaG91bGQgYmUgc29ydGVkIGFzIGBzdGQoZW50aXJlIGxvZylgLCBgb3V0YCwgYGVycmAuXG4gICAgdmFyIHR5cGVzID0gT2JqZWN0LmtleXMoc3Rkcykuc29ydChmdW5jdGlvbih4LCB5KXtcbiAgICAgIHJldHVybiAteC5jaGFyQ29kZUF0KDApICsgeS5jaGFyQ29kZUF0KDApO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHdyaXRlIHN0cmVhbXMuXG4gICAgKGZ1bmN0aW9uIGNyZWF0ZVdTKHBpbyl7XG4gICAgICBpZihwaW8ubGVuZ3RoICE9IDEpe1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBsZXQgaW8gPSBwaW9bMF07XG5cbiAgICAgIC8vIElmIGBzdGRgIGlzIGEgU3RyZWFtIHR5cGUsIHRyeSBuZXh0IGBzdGRgLlxuICAgICAgLy8gY29tcGF0aWJsZSB3aXRoIGBwbTIgcmVsb2FkTG9nc2BcbiAgICAgIGlmKHR5cGVvZiBzdGRzW2lvXSA9PSAnb2JqZWN0JyAmJiAhaXNOYU4oc3Rkc1tpb10uZmQpKXtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVdTKHR5cGVzLnNwbGljZSgwLCAxKSk7XG4gICAgICB9XG5cbiAgICAgIGZsb3dzLnB1c2goZnVuY3Rpb24obmV4dCl7XG4gICAgICAgIHZhciBmaWxlID0gc3Rkc1tpb107XG5cbiAgICAgICAgLy8gaWYgZmlsZSBjb250YWlucyBFUlIgb3IgL2Rldi9udWxsLCBkb250IHRyeSB0byBjcmVhdGUgc3RyZWFtIHNpbmNlIGhlIGRvbnQgd2FudCBsb2dzXG4gICAgICAgIGlmICghZmlsZSB8fCBmaWxlLmluZGV4T2YoJ05VTEwnKSA+IC0xIHx8IGZpbGUuaW5kZXhPZignL2Rldi9udWxsJykgPiAtMSlcbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuXG4gICAgICAgIHN0ZHNbaW9dID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0oZmlsZSwge2ZsYWdzOiAnYSd9KVxuICAgICAgICAgIC5vbmNlKCdlcnJvcicsIG5leHQpXG4gICAgICAgICAgLm9uKCdvcGVuJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHN0ZHNbaW9dLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG5leHQpO1xuXG4gICAgICAgICAgICBzdGRzW2lvXS5vbignZXJyb3InLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgc3Rkc1tpb10uX2ZpbGUgPSBmaWxlO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gY3JlYXRlV1ModHlwZXMuc3BsaWNlKDAsIDEpKTtcbiAgICB9KSh0eXBlcy5zcGxpY2UoMCwgMSkpO1xuXG4gICAgd2F0ZXJmYWxsKGZsb3dzLCBjYWxsYmFjayk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHBhcnNlIHRoZSBtb2R1bGUgbmFtZSBhbmQgcmV0dXJucyBpdCBhcyBjYW5vbmljOlxuICAgKiAtIE1ha2VzIHRoZSBuYW1lIGJhc2VkIG9uIGluc3RhbGxhdGlvbiBmaWxlbmFtZS5cbiAgICogLSBSZW1vdmVzIHRoZSBHaXRodWIgYXV0aG9yLCBtb2R1bGUgdmVyc2lvbiBhbmQgZ2l0IGJyYW5jaCBmcm9tIG9yaWdpbmFsIG5hbWUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtb2R1bGVfbmFtZVxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSBDYW5vbmljIG1vZHVsZSBuYW1lICh3aXRob3V0IHRyaW1lZCBwYXJ0cykuXG4gICAqIEBleGFtcGxlIEFsd2F5cyByZXR1cm5zICdwbTItc2xhY2snIGZvciBpbnB1dHMgJ21hLXphbC9wbTItc2xhY2snLCAnbWEtemFsL3BtMi1zbGFjayNvd24tYnJhbmNoJyxcbiAgICogICAgICAgICAgJ3BtMi1zbGFjay0xLjAuMC50Z3onIG9yICdwbTItc2xhY2tAMS4wLjAnLlxuICAgKi9cbiAgZ2V0Q2Fub25pY01vZHVsZU5hbWU6IGZ1bmN0aW9uKG1vZHVsZV9uYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGVfbmFtZSAhPT0gJ3N0cmluZycpIHJldHVybiBudWxsO1xuICAgIHZhciBjYW5vbmljX21vZHVsZV9uYW1lID0gbW9kdWxlX25hbWU7XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBtb2R1bGUgbmFtZSBmcm9tIGEgLnRneiBwYWNrYWdlIG5hbWUgKG9yIHRoZSBvcmlnaW5hbCBuYW1lIGlmIGl0IGlzIG5vdCBhIHZhbGlkIHBrZykuXG4gICAgLy8gSW5wdXQ6IFRoZSBwYWNrYWdlIG5hbWUgKGUuZy4gXCJmb28udGd6XCIsIFwiZm9vLTEuMC4wLnRnelwiLCBcImZvbGRlci9mb28udGd6XCIpXG4gICAgLy8gT3V0cHV0OiBUaGUgbW9kdWxlIG5hbWVcbiAgICBpZiAoY2Fub25pY19tb2R1bGVfbmFtZS5tYXRjaCgvXFwudGd6KCR8XFw/KS8pKSB7XG4gICAgICBpZiAoY2Fub25pY19tb2R1bGVfbmFtZS5tYXRjaCgvXiguK1xcLyk/KFteXFwvXSspXFwudGd6KCR8XFw/KS8pKSB7XG4gICAgICAgIGNhbm9uaWNfbW9kdWxlX25hbWUgPSBjYW5vbmljX21vZHVsZV9uYW1lLm1hdGNoKC9eKC4rXFwvKT8oW15cXC9dKylcXC50Z3ooJHxcXD8pLylbMl07XG4gICAgICAgIGlmIChjYW5vbmljX21vZHVsZV9uYW1lLm1hdGNoKC9eKC4rKS1bMC05XStcXC5bMC05XStcXC5bMC05XSsoLVthLXpBLVowLTlfXStcXC5bMC05XSspPyQvKSkge1xuICAgICAgICAgIGNhbm9uaWNfbW9kdWxlX25hbWUgPSBjYW5vbmljX21vZHVsZV9uYW1lLm1hdGNoKC9eKC4rKS1bMC05XStcXC5bMC05XStcXC5bMC05XSsoLVthLXpBLVowLTlfXStcXC5bMC05XSspPyQvKVsxXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vcG0yIGluc3RhbGwgZ2l0K2h0dHBzOi8vZ2l0aHViLmNvbS91c2VyL21vZHVsZVxuICAgIGlmKGNhbm9uaWNfbW9kdWxlX25hbWUuaW5kZXhPZignZ2l0KycpICE9PSAtMSkge1xuICAgICAgY2Fub25pY19tb2R1bGVfbmFtZSA9IGNhbm9uaWNfbW9kdWxlX25hbWUuc3BsaXQoJy8nKS5wb3AoKTtcbiAgICB9XG5cbiAgICAvL3BtMiBpbnN0YWxsIGh0dHBzOi8vZ2l0aHViLmNvbS91c2VyL21vZHVsZVxuICAgIGlmKGNhbm9uaWNfbW9kdWxlX25hbWUuaW5kZXhPZignaHR0cCcpICE9PSAtMSkge1xuICAgICAgdmFyIHVyaSA9IHVybC5wYXJzZShjYW5vbmljX21vZHVsZV9uYW1lKTtcbiAgICAgIGNhbm9uaWNfbW9kdWxlX25hbWUgPSB1cmkucGF0aG5hbWUuc3BsaXQoJy8nKS5wb3AoKTtcbiAgICB9XG5cbiAgICAvL3BtMiBpbnN0YWxsIGZpbGU6Ly8vaG9tZS91c2VyL21vZHVsZVxuICAgIGVsc2UgaWYoY2Fub25pY19tb2R1bGVfbmFtZS5pbmRleE9mKCdmaWxlOi8vJykgPT09IDApIHtcbiAgICAgIGNhbm9uaWNfbW9kdWxlX25hbWUgPSBjYW5vbmljX21vZHVsZV9uYW1lLnJlcGxhY2UoL1xcLyQvLCAnJykuc3BsaXQoJy8nKS5wb3AoKTtcbiAgICB9XG5cbiAgICAvL3BtMiBpbnN0YWxsIHVzZXJuYW1lL21vZHVsZVxuICAgIGVsc2UgaWYoY2Fub25pY19tb2R1bGVfbmFtZS5pbmRleE9mKCcvJykgIT09IC0xKSB7XG4gICAgICBpZiAoY2Fub25pY19tb2R1bGVfbmFtZS5jaGFyQXQoMCkgIT09IFwiQFwiKXtcbiAgICAgICAgY2Fub25pY19tb2R1bGVfbmFtZSA9IGNhbm9uaWNfbW9kdWxlX25hbWUuc3BsaXQoJy8nKVsxXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL3BtMiBpbnN0YWxsIEBzb21lc2NvcGUvbW9kdWxlQDIuMS4wLWJldGFcbiAgICBpZihjYW5vbmljX21vZHVsZV9uYW1lLmxhc3RJbmRleE9mKCdAJykgPiAwKSB7XG4gICAgICBjYW5vbmljX21vZHVsZV9uYW1lID0gY2Fub25pY19tb2R1bGVfbmFtZS5zdWJzdHIoMCxjYW5vbmljX21vZHVsZV9uYW1lLmxhc3RJbmRleE9mKFwiQFwiKSk7XG4gICAgfVxuXG4gICAgLy9wbTIgaW5zdGFsbCBtb2R1bGUjc29tZS1icmFuY2hcbiAgICBpZihjYW5vbmljX21vZHVsZV9uYW1lLmluZGV4T2YoJyMnKSAhPT0gLTEpIHtcbiAgICAgIGNhbm9uaWNfbW9kdWxlX25hbWUgPSBjYW5vbmljX21vZHVsZV9uYW1lLnNwbGl0KCcjJylbMF07XG4gICAgfVxuXG4gICAgaWYgKGNhbm9uaWNfbW9kdWxlX25hbWUuaW5kZXhPZignLmdpdCcpICE9PSAtMSkge1xuICAgICAgY2Fub25pY19tb2R1bGVfbmFtZSA9IGNhbm9uaWNfbW9kdWxlX25hbWUucmVwbGFjZSgnLmdpdCcsICcnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2Fub25pY19tb2R1bGVfbmFtZTtcbiAgfSxcblxuICBjaGVja1BhdGhJc051bGw6IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICByZXR1cm4gcGF0aCA9PT0gJ05VTEwnIHx8IHBhdGggPT09ICcvZGV2L251bGwnIHx8IHBhdGggPT09ICdcXFxcXFxcXC5cXFxcTlVMJztcbiAgfSxcblxuICBnZW5lcmF0ZVVVSUQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcyA9IFtdO1xuICAgIHZhciBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM2OyBpKyspIHtcbiAgICAgIHNbaV0gPSBoZXhEaWdpdHMuc3Vic3RyKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTApLCAxKTtcbiAgICB9XG4gICAgc1sxNF0gPSBcIjRcIjtcbiAgICBzWzE5XSA9IGhleERpZ2l0cy5zdWJzdHIoKHNbMTldICYgMHgzKSB8IDB4OCwgMSk7XG4gICAgc1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xuICAgIHJldHVybiBzLmpvaW4oXCJcIik7XG4gIH1cblxufTtcblxuZXhwb3J0IGRlZmF1bHQgVXRpbGl0eTtcbiJdfQ==