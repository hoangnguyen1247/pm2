"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _chalk = _interopRequireDefault(require("chalk"));

var _util = _interopRequireDefault(require("util"));

var _fs = _interopRequireDefault(require("fs"));

var _child_process = require("child_process");

var _path = _interopRequireDefault(require("path"));

var _Log = _interopRequireDefault(require("./Log"));

var _constants = _interopRequireDefault(require("../../constants.js"));

var _Common = _interopRequireDefault(require("../Common.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _default(CLI) {
  /**
   * Description
   * @method flush
   * @return
   */
  CLI.prototype.flush = function (api, cb) {
    var that = this;

    if (!api) {
      _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Flushing ' + _constants["default"].PM2_LOG_FILE_PATH);

      _fs["default"].closeSync(_fs["default"].openSync(_constants["default"].PM2_LOG_FILE_PATH, 'w'));
    }

    that.Client.executeRemote('getMonitorData', {}, function (err, list) {
      if (err) {
        _Common["default"].printError(err);

        return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      list.forEach(function (l) {
        if (typeof api == 'undefined') {
          _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Flushing:');

          _Common["default"].printOut(_constants["default"].PREFIX_MSG + l.pm2_env.pm_out_log_path);

          _Common["default"].printOut(_constants["default"].PREFIX_MSG + l.pm2_env.pm_err_log_path);

          if (l.pm2_env.pm_log_path) {
            _Common["default"].printOut(_constants["default"].PREFIX_MSG + l.pm2_env.pm_log_path);

            _fs["default"].closeSync(_fs["default"].openSync(l.pm2_env.pm_log_path, 'w'));
          }

          _fs["default"].closeSync(_fs["default"].openSync(l.pm2_env.pm_out_log_path, 'w'));

          _fs["default"].closeSync(_fs["default"].openSync(l.pm2_env.pm_err_log_path, 'w'));
        } else if (l.pm2_env.name === api) {
          _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Flushing:');

          _Common["default"].printOut(_constants["default"].PREFIX_MSG + l.pm2_env.pm_out_log_path);

          _Common["default"].printOut(_constants["default"].PREFIX_MSG + l.pm2_env.pm_err_log_path);

          if (l.pm2_env.pm_log_path && l.pm2_env.pm_log_path.lastIndexOf('/') < l.pm2_env.pm_log_path.lastIndexOf(api)) {
            _Common["default"].printOut(_constants["default"].PREFIX_MSG + l.pm2_env.pm_log_path);

            _fs["default"].closeSync(_fs["default"].openSync(l.pm2_env.pm_log_path, 'w'));
          }

          if (l.pm2_env.pm_out_log_path.lastIndexOf('/') < l.pm2_env.pm_out_log_path.lastIndexOf(api)) _fs["default"].closeSync(_fs["default"].openSync(l.pm2_env.pm_out_log_path, 'w'));
          if (l.pm2_env.pm_err_log_path.lastIndexOf('/') < l.pm2_env.pm_err_log_path.lastIndexOf(api)) _fs["default"].closeSync(_fs["default"].openSync(l.pm2_env.pm_err_log_path, 'w'));
        }
      });

      _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Logs flushed');

      return cb ? cb(null, list) : that.exitCli(_constants["default"].SUCCESS_EXIT);
    });
  };

  CLI.prototype.logrotate = function (opts, cb) {
    var that = this;

    if (process.getuid() != 0) {
      return (0, _child_process.exec)('whoami', function (err, stdout, stderr) {
        _Common["default"].printError(_constants["default"].PREFIX_MSG + 'You have to run this command as root. Execute the following command:');

        _Common["default"].printError(_constants["default"].PREFIX_MSG + _chalk["default"].grey('      sudo env PATH=$PATH:' + _path["default"].dirname(process.execPath) + ' pm2 logrotate -u ' + stdout.trim()));

        cb ? cb(_Common["default"].retErr('You have to run this with elevated rights')) : that.exitCli(_constants["default"].ERROR_EXIT);
      });
    }

    if (!_fs["default"].existsSync('/etc/logrotate.d')) {
      _Common["default"].printError(_constants["default"].PREFIX_MSG + '/etc/logrotate.d does not exist we can not copy the default configuration.');

      return cb ? cb(_Common["default"].retErr('/etc/logrotate.d does not exist')) : that.exitCli(_constants["default"].ERROR_EXIT);
    }

    var templatePath = _path["default"].join(_constants["default"].TEMPLATE_FOLDER, _constants["default"].LOGROTATE_SCRIPT);

    _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Getting logrorate template ' + templatePath);

    var script = _fs["default"].readFileSync(templatePath, {
      encoding: 'utf8'
    });

    var user = opts.user || 'root';
    script = script.replace(/%HOME_PATH%/g, _constants["default"].PM2_ROOT_PATH).replace(/%USER%/g, user);

    try {
      _fs["default"].writeFileSync('/etc/logrotate.d/pm2-' + user, script);
    } catch (e) {
      console.error(e.stack || e);
    }

    _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Logrotate configuration added to /etc/logrotate.d/pm2');

    return cb ? cb(null, {
      success: true
    }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
  };
  /**
   * Description
   * @method reloadLogs
   * @return
   */


  CLI.prototype.reloadLogs = function (cb) {
    var that = this;

    _Common["default"].printOut('Reloading all logs...');

    that.Client.executeRemote('reloadLogs', {}, function (err, logs) {
      if (err) {
        _Common["default"].printError(err);

        return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      _Common["default"].printOut('All logs reloaded');

      return cb ? cb(null, logs) : that.exitCli(_constants["default"].SUCCESS_EXIT);
    });
  };
  /**
   * Description
   * @method streamLogs
   * @param {String} id
   * @param {Number} lines
   * @param {Boolean} raw
   * @return
   */


  CLI.prototype.streamLogs = function (id, lines, raw, timestamp, exclusive, highlight) {
    var that = this;
    var files_list = []; // If no argument is given, we stream logs for all running apps

    id = id || 'all';
    lines = lines !== undefined ? lines : 20;
    lines = lines < 0 ? -lines : lines; // Avoid duplicates and check if path is different from '/dev/null'

    var pushIfUnique = function pushIfUnique(entry) {
      var exists = false;

      if (entry.path.toLowerCase && entry.path.toLowerCase() !== '/dev/null') {
        files_list.some(function (file) {
          if (file.path === entry.path) exists = true;
          return exists;
        });
        if (exists) return;
        files_list.push(entry);
      }
    }; // Get the list of all running apps


    that.Client.executeRemote('getMonitorData', {}, function (err, list) {
      var regexList = [];
      var namespaceList = [];

      if (err) {
        _Common["default"].printError(err);

        that.exitCli(_constants["default"].ERROR_EXIT);
      }

      if (lines === 0) return _Log["default"].stream(that.Client, id, raw, timestamp, exclusive, highlight);

      _Common["default"].printOut(_chalk["default"].bold.grey(_util["default"].format.call(this, '[TAILING] Tailing last %d lines for [%s] process%s (change the value with --lines option)', lines, id, id === 'all' ? 'es' : ''))); // Populate the array `files_list` with the paths of all files we need to tail


      list.forEach(function (proc) {
        if (proc.pm2_env && (id === 'all' || proc.pm2_env.name == id || proc.pm2_env.pm_id == id)) {
          if (proc.pm2_env.pm_out_log_path && exclusive !== 'err') pushIfUnique({
            path: proc.pm2_env.pm_out_log_path,
            app_name: proc.pm2_env.pm_id + '|' + proc.pm2_env.name,
            type: 'out'
          });
          if (proc.pm2_env.pm_err_log_path && exclusive !== 'out') pushIfUnique({
            path: proc.pm2_env.pm_err_log_path,
            app_name: proc.pm2_env.pm_id + '|' + proc.pm2_env.name,
            type: 'err'
          });
        } else if (proc.pm2_env && proc.pm2_env.namespace == id) {
          if (namespaceList.indexOf(proc.pm2_env.name) === -1) {
            namespaceList.push(proc.pm2_env.name);
          }

          if (proc.pm2_env.pm_out_log_path && exclusive !== 'err') pushIfUnique({
            path: proc.pm2_env.pm_out_log_path,
            app_name: proc.pm2_env.pm_id + '|' + proc.pm2_env.name,
            type: 'out'
          });
          if (proc.pm2_env.pm_err_log_path && exclusive !== 'out') pushIfUnique({
            path: proc.pm2_env.pm_err_log_path,
            app_name: proc.pm2_env.pm_id + '|' + proc.pm2_env.name,
            type: 'err'
          });
        } // Populate the array `files_list` with the paths of all files we need to tail, when log in put is a regex
        else if (proc.pm2_env && isNaN(id) && id[0] === '/' && id[id.length - 1] === '/') {
            var regex = new RegExp(id.replace(/\//g, ''));

            if (regex.test(proc.pm2_env.name)) {
              if (regexList.indexOf(proc.pm2_env.name) === -1) {
                regexList.push(proc.pm2_env.name);
              }

              if (proc.pm2_env.pm_out_log_path && exclusive !== 'err') pushIfUnique({
                path: proc.pm2_env.pm_out_log_path,
                app_name: proc.pm2_env.pm_id + '|' + proc.pm2_env.name,
                type: 'out'
              });
              if (proc.pm2_env.pm_err_log_path && exclusive !== 'out') pushIfUnique({
                path: proc.pm2_env.pm_err_log_path,
                app_name: proc.pm2_env.pm_id + '|' + proc.pm2_env.name,
                type: 'err'
              });
            }
          }
      }); //for fixing issue https://github.com/Unitech/pm2/issues/3506

      /* if (files_list && files_list.length == 0) {
         Common.printError(cst.PREFIX_MSG_ERR + 'No file to stream for app [%s], exiting.', id);
         return process.exit(cst.ERROR_EXIT);
       }*/

      if (!raw && (id === 'all' || id === 'PM2') && exclusive === false) {
        _Log["default"].tail([{
          path: _constants["default"].PM2_LOG_FILE_PATH,
          app_name: 'PM2',
          type: 'PM2'
        }], lines, raw, function () {
          _Log["default"].tail(files_list, lines, raw, function () {
            _Log["default"].stream(that.Client, id, raw, timestamp, exclusive, highlight);
          });
        });
      } else {
        _Log["default"].tail(files_list, lines, raw, function () {
          if (regexList.length > 0) {
            regexList.forEach(function (id) {
              _Log["default"].stream(that.Client, id, raw, timestamp, exclusive, highlight);
            });
          } else if (namespaceList.length > 0) {
            namespaceList.forEach(function (id) {
              _Log["default"].stream(that.Client, id, raw, timestamp, exclusive, highlight);
            });
          } else {
            _Log["default"].stream(that.Client, id, raw, timestamp, exclusive, highlight);
          }
        });
      }
    });
  };
  /**
   * Description
   * @method printLogs
   * @param {String} id
   * @param {Number} lines
   * @param {Boolean} raw
   * @return
   */


  CLI.prototype.printLogs = function (id, lines, raw, timestamp, exclusive) {
    var that = this;
    var files_list = []; // If no argument is given, we stream logs for all running apps

    id = id || 'all';
    lines = lines !== undefined ? lines : 20;
    lines = lines < 0 ? -lines : lines; // Avoid duplicates and check if path is different from '/dev/null'

    var pushIfUnique = function pushIfUnique(entry) {
      var exists = false;

      if (entry.path.toLowerCase && entry.path.toLowerCase() !== '/dev/null') {
        files_list.some(function (file) {
          if (file.path === entry.path) exists = true;
          return exists;
        });
        if (exists) return;
        files_list.push(entry);
      }
    }; // Get the list of all running apps


    that.Client.executeRemote('getMonitorData', {}, function (err, list) {
      if (err) {
        _Common["default"].printError(err);

        that.exitCli(_constants["default"].ERROR_EXIT);
      }

      if (lines <= 0) {
        return that.exitCli(_constants["default"].SUCCESS_EXIT);
      }

      _Common["default"].printOut(_chalk["default"].bold.grey(_util["default"].format.call(this, '[TAILING] Tailing last %d lines for [%s] process%s (change the value with --lines option)', lines, id, id === 'all' ? 'es' : ''))); // Populate the array `files_list` with the paths of all files we need to tail


      list.forEach(function (proc) {
        if (proc.pm2_env && (id === 'all' || proc.pm2_env.name == id || proc.pm2_env.pm_id == id)) {
          if (proc.pm2_env.pm_out_log_path && exclusive !== 'err') pushIfUnique({
            path: proc.pm2_env.pm_out_log_path,
            app_name: proc.pm2_env.pm_id + '|' + proc.pm2_env.name,
            type: 'out'
          });
          if (proc.pm2_env.pm_err_log_path && exclusive !== 'out') pushIfUnique({
            path: proc.pm2_env.pm_err_log_path,
            app_name: proc.pm2_env.pm_id + '|' + proc.pm2_env.name,
            type: 'err'
          });
        } // Populate the array `files_list` with the paths of all files we need to tail, when log in put is a regex
        else if (proc.pm2_env && isNaN(id) && id[0] === '/' && id[id.length - 1] === '/') {
            var regex = new RegExp(id.replace(/\//g, ''));

            if (regex.test(proc.pm2_env.name)) {
              if (proc.pm2_env.pm_out_log_path && exclusive !== 'err') pushIfUnique({
                path: proc.pm2_env.pm_out_log_path,
                app_name: proc.pm2_env.pm_id + '|' + proc.pm2_env.name,
                type: 'out'
              });
              if (proc.pm2_env.pm_err_log_path && exclusive !== 'out') pushIfUnique({
                path: proc.pm2_env.pm_err_log_path,
                app_name: proc.pm2_env.pm_id + '|' + proc.pm2_env.name,
                type: 'err'
              });
            }
          }
      });

      if (!raw && (id === 'all' || id === 'PM2') && exclusive === false) {
        _Log["default"].tail([{
          path: _constants["default"].PM2_LOG_FILE_PATH,
          app_name: 'PM2',
          type: 'PM2'
        }], lines, raw, function () {
          _Log["default"].tail(files_list, lines, raw, function () {
            that.exitCli(_constants["default"].SUCCESS_EXIT);
          });
        });
      } else {
        _Log["default"].tail(files_list, lines, raw, function () {
          that.exitCli(_constants["default"].SUCCESS_EXIT);
        });
      }
    });
  };
}

;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvTG9nTWFuYWdlbWVudC50cyJdLCJuYW1lcyI6WyJDTEkiLCJwcm90b3R5cGUiLCJmbHVzaCIsImFwaSIsImNiIiwidGhhdCIsIkNvbW1vbiIsInByaW50T3V0IiwiY3N0IiwiUFJFRklYX01TRyIsIlBNMl9MT0dfRklMRV9QQVRIIiwiZnMiLCJjbG9zZVN5bmMiLCJvcGVuU3luYyIsIkNsaWVudCIsImV4ZWN1dGVSZW1vdGUiLCJlcnIiLCJsaXN0IiwicHJpbnRFcnJvciIsInJldEVyciIsImV4aXRDbGkiLCJFUlJPUl9FWElUIiwiZm9yRWFjaCIsImwiLCJwbTJfZW52IiwicG1fb3V0X2xvZ19wYXRoIiwicG1fZXJyX2xvZ19wYXRoIiwicG1fbG9nX3BhdGgiLCJuYW1lIiwibGFzdEluZGV4T2YiLCJTVUNDRVNTX0VYSVQiLCJsb2dyb3RhdGUiLCJvcHRzIiwicHJvY2VzcyIsImdldHVpZCIsInN0ZG91dCIsInN0ZGVyciIsImNoYWxrIiwiZ3JleSIsInBhdGgiLCJkaXJuYW1lIiwiZXhlY1BhdGgiLCJ0cmltIiwiZXhpc3RzU3luYyIsInRlbXBsYXRlUGF0aCIsImpvaW4iLCJURU1QTEFURV9GT0xERVIiLCJMT0dST1RBVEVfU0NSSVBUIiwic2NyaXB0IiwicmVhZEZpbGVTeW5jIiwiZW5jb2RpbmciLCJ1c2VyIiwicmVwbGFjZSIsIlBNMl9ST09UX1BBVEgiLCJ3cml0ZUZpbGVTeW5jIiwiZSIsImNvbnNvbGUiLCJlcnJvciIsInN0YWNrIiwic3VjY2VzcyIsInJlbG9hZExvZ3MiLCJsb2dzIiwic3RyZWFtTG9ncyIsImlkIiwibGluZXMiLCJyYXciLCJ0aW1lc3RhbXAiLCJleGNsdXNpdmUiLCJoaWdobGlnaHQiLCJmaWxlc19saXN0IiwidW5kZWZpbmVkIiwicHVzaElmVW5pcXVlIiwiZW50cnkiLCJleGlzdHMiLCJ0b0xvd2VyQ2FzZSIsInNvbWUiLCJmaWxlIiwicHVzaCIsInJlZ2V4TGlzdCIsIm5hbWVzcGFjZUxpc3QiLCJMb2ciLCJzdHJlYW0iLCJib2xkIiwidXRpbCIsImZvcm1hdCIsImNhbGwiLCJwcm9jIiwicG1faWQiLCJhcHBfbmFtZSIsInR5cGUiLCJuYW1lc3BhY2UiLCJpbmRleE9mIiwiaXNOYU4iLCJsZW5ndGgiLCJyZWdleCIsIlJlZ0V4cCIsInRlc3QiLCJ0YWlsIiwicHJpbnRMb2dzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7QUFFZSxrQkFBU0EsR0FBVCxFQUFjO0FBRTNCOzs7OztBQUtBQSxFQUFBQSxHQUFHLENBQUNDLFNBQUosQ0FBY0MsS0FBZCxHQUFzQixVQUFTQyxHQUFULEVBQWNDLEVBQWQsRUFBa0I7QUFDdEMsUUFBSUMsSUFBSSxHQUFHLElBQVg7O0FBRUEsUUFBSSxDQUFDRixHQUFMLEVBQVU7QUFDUkcseUJBQU9DLFFBQVAsQ0FBZ0JDLHNCQUFJQyxVQUFKLEdBQWlCLFdBQWpCLEdBQStCRCxzQkFBSUUsaUJBQW5EOztBQUNBQyxxQkFBR0MsU0FBSCxDQUFhRCxlQUFHRSxRQUFILENBQVlMLHNCQUFJRSxpQkFBaEIsRUFBbUMsR0FBbkMsQ0FBYjtBQUNEOztBQUVETCxJQUFBQSxJQUFJLENBQUNTLE1BQUwsQ0FBWUMsYUFBWixDQUEwQixnQkFBMUIsRUFBNEMsRUFBNUMsRUFBZ0QsVUFBU0MsR0FBVCxFQUFjQyxJQUFkLEVBQW9CO0FBQ2xFLFVBQUlELEdBQUosRUFBUztBQUNQViwyQkFBT1ksVUFBUCxDQUFrQkYsR0FBbEI7O0FBQ0EsZUFBT1osRUFBRSxHQUFHQSxFQUFFLENBQUNFLG1CQUFPYSxNQUFQLENBQWNILEdBQWQsQ0FBRCxDQUFMLEdBQTRCWCxJQUFJLENBQUNlLE9BQUwsQ0FBYVosc0JBQUlhLFVBQWpCLENBQXJDO0FBQ0Q7O0FBQ0RKLE1BQUFBLElBQUksQ0FBQ0ssT0FBTCxDQUFhLFVBQVNDLENBQVQsRUFBWTtBQUN2QixZQUFJLE9BQU9wQixHQUFQLElBQWMsV0FBbEIsRUFBK0I7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LEVBQXFCTCxLQUFyQixFQUE0QkMsR0FBNUIsRUFBaUMsWUFBVztBQUMxQzVELFVBQUFBLElBQUksQ0FBQ2UsT0FBTCxDQUFhWixzQkFBSXNCLFlBQWpCO0FBQ0QsU0FGRDtBQUdEO0FBQ0YsS0FoRUQ7QUFpRUQsR0EvRkQ7QUFnR0Q7O0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgIGZyb20gJ2NoYWxrJztcclxuaW1wb3J0IHV0aWwgICBmcm9tICd1dGlsJztcclxuaW1wb3J0IGZzICAgICBmcm9tICdmcyc7XHJcbmltcG9ydCB7IGV4ZWMgfSAgIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5pbXBvcnQgcGF0aCAgIGZyb20gJ3BhdGgnO1xyXG5cclxuaW1wb3J0IExvZyAgICBmcm9tICcuL0xvZyc7XHJcbmltcG9ydCBjc3QgICAgZnJvbSAnLi4vLi4vY29uc3RhbnRzLmpzJztcclxuaW1wb3J0IENvbW1vbiBmcm9tICcuLi9Db21tb24uanMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oQ0xJKSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc2NyaXB0aW9uXHJcbiAgICogQG1ldGhvZCBmbHVzaFxyXG4gICAqIEByZXR1cm5cclxuICAgKi9cclxuICBDTEkucHJvdG90eXBlLmZsdXNoID0gZnVuY3Rpb24oYXBpLCBjYikge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgIGlmICghYXBpKSB7XHJcbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdGbHVzaGluZyAnICsgY3N0LlBNMl9MT0dfRklMRV9QQVRIKTtcclxuICAgICAgZnMuY2xvc2VTeW5jKGZzLm9wZW5TeW5jKGNzdC5QTTJfTE9HX0ZJTEVfUEFUSCwgJ3cnKSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XHJcbiAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xyXG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xyXG4gICAgICB9XHJcbiAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbihsKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBhcGkgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdGbHVzaGluZzonKTtcclxuICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArIGwucG0yX2Vudi5wbV9vdXRfbG9nX3BhdGgpO1xyXG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgbC5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCk7XHJcblxyXG4gICAgICAgICAgaWYgKGwucG0yX2Vudi5wbV9sb2dfcGF0aCkge1xyXG4gICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyBsLnBtMl9lbnYucG1fbG9nX3BhdGgpO1xyXG4gICAgICAgICAgICBmcy5jbG9zZVN5bmMoZnMub3BlblN5bmMobC5wbTJfZW52LnBtX2xvZ19wYXRoLCAndycpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGZzLmNsb3NlU3luYyhmcy5vcGVuU3luYyhsLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoLCAndycpKTtcclxuICAgICAgICAgIGZzLmNsb3NlU3luYyhmcy5vcGVuU3luYyhsLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoLCAndycpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobC5wbTJfZW52Lm5hbWUgPT09IGFwaSkge1xyXG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0ZsdXNoaW5nOicpO1xyXG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgbC5wbTJfZW52LnBtX291dF9sb2dfcGF0aCk7XHJcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyBsLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoKTtcclxuXHJcbiAgICAgICAgICBpZiAobC5wbTJfZW52LnBtX2xvZ19wYXRoICYmXHJcbiAgICAgICAgICAgICAgbC5wbTJfZW52LnBtX2xvZ19wYXRoLmxhc3RJbmRleE9mKCcvJykgPCBsLnBtMl9lbnYucG1fbG9nX3BhdGgubGFzdEluZGV4T2YoYXBpKSkge1xyXG4gICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyBsLnBtMl9lbnYucG1fbG9nX3BhdGgpO1xyXG4gICAgICAgICAgICBmcy5jbG9zZVN5bmMoZnMub3BlblN5bmMobC5wbTJfZW52LnBtX2xvZ19wYXRoLCAndycpKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAobC5wbTJfZW52LnBtX291dF9sb2dfcGF0aC5sYXN0SW5kZXhPZignLycpIDwgbC5wbTJfZW52LnBtX291dF9sb2dfcGF0aC5sYXN0SW5kZXhPZihhcGkpKVxyXG4gICAgICAgICAgICBmcy5jbG9zZVN5bmMoZnMub3BlblN5bmMobC5wbTJfZW52LnBtX291dF9sb2dfcGF0aCwgJ3cnKSk7XHJcbiAgICAgICAgICBpZiAobC5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aC5sYXN0SW5kZXhPZignLycpIDwgbC5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aC5sYXN0SW5kZXhPZihhcGkpKVxyXG4gICAgICAgICAgICBmcy5jbG9zZVN5bmMoZnMub3BlblN5bmMobC5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCwgJ3cnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdMb2dzIGZsdXNoZWQnKTtcclxuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgbGlzdCkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICBDTEkucHJvdG90eXBlLmxvZ3JvdGF0ZSA9IGZ1bmN0aW9uKG9wdHMsIGNiKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgaWYgKHByb2Nlc3MuZ2V0dWlkKCkgIT0gMCkge1xyXG4gICAgICByZXR1cm4gZXhlYygnd2hvYW1pJywgZnVuY3Rpb24oZXJyLCBzdGRvdXQsIHN0ZGVycikge1xyXG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHICsgJ1lvdSBoYXZlIHRvIHJ1biB0aGlzIGNvbW1hbmQgYXMgcm9vdC4gRXhlY3V0ZSB0aGUgZm9sbG93aW5nIGNvbW1hbmQ6Jyk7XHJcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0cgKyBjaGFsay5ncmV5KCcgICAgICBzdWRvIGVudiBQQVRIPSRQQVRIOicgKyBwYXRoLmRpcm5hbWUocHJvY2Vzcy5leGVjUGF0aCkgKyAnIHBtMiBsb2dyb3RhdGUgLXUgJyArIHN0ZG91dC50cmltKCkpKTtcclxuXHJcbiAgICAgICAgY2IgPyBjYihDb21tb24ucmV0RXJyKCdZb3UgaGF2ZSB0byBydW4gdGhpcyB3aXRoIGVsZXZhdGVkIHJpZ2h0cycpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghZnMuZXhpc3RzU3luYygnL2V0Yy9sb2dyb3RhdGUuZCcpKSB7XHJcbiAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHICsgJy9ldGMvbG9ncm90YXRlLmQgZG9lcyBub3QgZXhpc3Qgd2UgY2FuIG5vdCBjb3B5IHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24uJyk7XHJcbiAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoJy9ldGMvbG9ncm90YXRlLmQgZG9lcyBub3QgZXhpc3QnKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0ZW1wbGF0ZVBhdGggPSBwYXRoLmpvaW4oY3N0LlRFTVBMQVRFX0ZPTERFUiwgY3N0LkxPR1JPVEFURV9TQ1JJUFQpO1xyXG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0dldHRpbmcgbG9ncm9yYXRlIHRlbXBsYXRlICcgKyB0ZW1wbGF0ZVBhdGgpO1xyXG4gICAgdmFyIHNjcmlwdCA9IGZzLnJlYWRGaWxlU3luYyh0ZW1wbGF0ZVBhdGgsIHtlbmNvZGluZzogJ3V0ZjgnfSk7XHJcblxyXG4gICAgdmFyIHVzZXIgPSBvcHRzLnVzZXIgfHwgJ3Jvb3QnO1xyXG5cclxuICAgIHNjcmlwdCA9IHNjcmlwdC5yZXBsYWNlKC8lSE9NRV9QQVRIJS9nLCBjc3QuUE0yX1JPT1RfUEFUSClcclxuICAgICAgLnJlcGxhY2UoLyVVU0VSJS9nLCB1c2VyKTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBmcy53cml0ZUZpbGVTeW5jKCcvZXRjL2xvZ3JvdGF0ZS5kL3BtMi0nK3VzZXIsIHNjcmlwdCk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcclxuICAgIH1cclxuXHJcbiAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnTG9ncm90YXRlIGNvbmZpZ3VyYXRpb24gYWRkZWQgdG8gL2V0Yy9sb2dyb3RhdGUuZC9wbTInKTtcclxuICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOnRydWV9KSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEZXNjcmlwdGlvblxyXG4gICAqIEBtZXRob2QgcmVsb2FkTG9nc1xyXG4gICAqIEByZXR1cm5cclxuICAgKi9cclxuICBDTEkucHJvdG90eXBlLnJlbG9hZExvZ3MgPSBmdW5jdGlvbihjYikge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgIENvbW1vbi5wcmludE91dCgnUmVsb2FkaW5nIGFsbCBsb2dzLi4uJyk7XHJcbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdyZWxvYWRMb2dzJywge30sIGZ1bmN0aW9uKGVyciwgbG9ncykge1xyXG4gICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcclxuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcclxuICAgICAgfVxyXG4gICAgICBDb21tb24ucHJpbnRPdXQoJ0FsbCBsb2dzIHJlbG9hZGVkJyk7XHJcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGxvZ3MpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogRGVzY3JpcHRpb25cclxuICAgKiBAbWV0aG9kIHN0cmVhbUxvZ3NcclxuICAgKiBAcGFyYW0ge1N0cmluZ30gaWRcclxuICAgKiBAcGFyYW0ge051bWJlcn0gbGluZXNcclxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHJhd1xyXG4gICAqIEByZXR1cm5cclxuICAgKi9cclxuICBDTEkucHJvdG90eXBlLnN0cmVhbUxvZ3MgPSBmdW5jdGlvbihpZCwgbGluZXMsIHJhdywgdGltZXN0YW1wLCBleGNsdXNpdmUsIGhpZ2hsaWdodCkge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgdmFyIGZpbGVzX2xpc3QgPSBbXTtcclxuXHJcbiAgICAvLyBJZiBubyBhcmd1bWVudCBpcyBnaXZlbiwgd2Ugc3RyZWFtIGxvZ3MgZm9yIGFsbCBydW5uaW5nIGFwcHNcclxuICAgIGlkID0gaWQgfHwgJ2FsbCc7XHJcbiAgICBsaW5lcyA9IGxpbmVzICE9PSB1bmRlZmluZWQgPyBsaW5lcyA6IDIwO1xyXG4gICAgbGluZXMgPSBsaW5lcyA8IDAgPyAtKGxpbmVzKSA6IGxpbmVzO1xyXG5cclxuICAgIC8vIEF2b2lkIGR1cGxpY2F0ZXMgYW5kIGNoZWNrIGlmIHBhdGggaXMgZGlmZmVyZW50IGZyb20gJy9kZXYvbnVsbCdcclxuICAgIHZhciBwdXNoSWZVbmlxdWUgPSBmdW5jdGlvbihlbnRyeSkge1xyXG4gICAgICB2YXIgZXhpc3RzID0gZmFsc2U7XHJcblxyXG4gICAgICBpZiAoZW50cnkucGF0aC50b0xvd2VyQ2FzZVxyXG4gICAgICAgICAgJiYgZW50cnkucGF0aC50b0xvd2VyQ2FzZSgpICE9PSAnL2Rldi9udWxsJykge1xyXG5cclxuICAgICAgICBmaWxlc19saXN0LnNvbWUoZnVuY3Rpb24oZmlsZSkge1xyXG4gICAgICAgICAgaWYgKGZpbGUucGF0aCA9PT0gZW50cnkucGF0aClcclxuICAgICAgICAgICAgZXhpc3RzID0gdHJ1ZTtcclxuICAgICAgICAgIHJldHVybiBleGlzdHM7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChleGlzdHMpXHJcbiAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGZpbGVzX2xpc3QucHVzaChlbnRyeSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBHZXQgdGhlIGxpc3Qgb2YgYWxsIHJ1bm5pbmcgYXBwc1xyXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XHJcbiAgICAgIHZhciByZWdleExpc3QgPSBbXTtcclxuICAgICAgdmFyIG5hbWVzcGFjZUxpc3QgPSBbXTtcclxuXHJcbiAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xyXG4gICAgICAgIHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChsaW5lcyA9PT0gMClcclxuICAgICAgICByZXR1cm4gTG9nLnN0cmVhbSh0aGF0LkNsaWVudCwgaWQsIHJhdywgdGltZXN0YW1wLCBleGNsdXNpdmUsIGhpZ2hsaWdodCk7XHJcblxyXG4gICAgICBDb21tb24ucHJpbnRPdXQoY2hhbGsuYm9sZC5ncmV5KHV0aWwuZm9ybWF0LmNhbGwodGhpcywgJ1tUQUlMSU5HXSBUYWlsaW5nIGxhc3QgJWQgbGluZXMgZm9yIFslc10gcHJvY2VzcyVzIChjaGFuZ2UgdGhlIHZhbHVlIHdpdGggLS1saW5lcyBvcHRpb24pJywgbGluZXMsIGlkLCBpZCA9PT0gJ2FsbCcgPyAnZXMnIDogJycpKSk7XHJcblxyXG4gICAgICAvLyBQb3B1bGF0ZSB0aGUgYXJyYXkgYGZpbGVzX2xpc3RgIHdpdGggdGhlIHBhdGhzIG9mIGFsbCBmaWxlcyB3ZSBuZWVkIHRvIHRhaWxcclxuICAgICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHByb2MpIHtcclxuICAgICAgICBpZiAocHJvYy5wbTJfZW52ICYmIChpZCA9PT0gJ2FsbCcgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jLnBtMl9lbnYubmFtZSA9PSBpZCB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2MucG0yX2Vudi5wbV9pZCA9PSBpZCkpIHtcclxuICAgICAgICAgIGlmIChwcm9jLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoICYmIGV4Y2x1c2l2ZSAhPT0gJ2VycicpXHJcbiAgICAgICAgICAgIHB1c2hJZlVuaXF1ZSh7XHJcbiAgICAgICAgICAgICAgcGF0aCAgICAgOiBwcm9jLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoLFxyXG4gICAgICAgICAgICAgIGFwcF9uYW1lIDpwcm9jLnBtMl9lbnYucG1faWQgKyAnfCcgKyBwcm9jLnBtMl9lbnYubmFtZSxcclxuICAgICAgICAgICAgICB0eXBlICAgICA6ICdvdXQnfSk7XHJcbiAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCAmJiBleGNsdXNpdmUgIT09ICdvdXQnKVxyXG4gICAgICAgICAgICBwdXNoSWZVbmlxdWUoe1xyXG4gICAgICAgICAgICAgIHBhdGggICAgIDogcHJvYy5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCxcclxuICAgICAgICAgICAgICBhcHBfbmFtZSA6IHByb2MucG0yX2Vudi5wbV9pZCArICd8JyArIHByb2MucG0yX2Vudi5uYW1lLFxyXG4gICAgICAgICAgICAgIHR5cGUgICAgIDogJ2VycidcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIGlmKHByb2MucG0yX2VudiAmJiBwcm9jLnBtMl9lbnYubmFtZXNwYWNlID09IGlkKSB7XHJcbiAgICAgICAgICBpZihuYW1lc3BhY2VMaXN0LmluZGV4T2YocHJvYy5wbTJfZW52Lm5hbWUpID09PSAtMSkge1xyXG4gICAgICAgICAgICBuYW1lc3BhY2VMaXN0LnB1c2gocHJvYy5wbTJfZW52Lm5hbWUpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX291dF9sb2dfcGF0aCAmJiBleGNsdXNpdmUgIT09ICdlcnInKVxyXG4gICAgICAgICAgICBwdXNoSWZVbmlxdWUoe1xyXG4gICAgICAgICAgICAgIHBhdGggICAgIDogcHJvYy5wbTJfZW52LnBtX291dF9sb2dfcGF0aCxcclxuICAgICAgICAgICAgICBhcHBfbmFtZSA6cHJvYy5wbTJfZW52LnBtX2lkICsgJ3wnICsgcHJvYy5wbTJfZW52Lm5hbWUsXHJcbiAgICAgICAgICAgICAgdHlwZSAgICAgOiAnb3V0J30pO1xyXG4gICAgICAgICAgaWYgKHByb2MucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGggJiYgZXhjbHVzaXZlICE9PSAnb3V0JylcclxuICAgICAgICAgICAgcHVzaElmVW5pcXVlKHtcclxuICAgICAgICAgICAgICBwYXRoICAgICA6IHByb2MucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGgsXHJcbiAgICAgICAgICAgICAgYXBwX25hbWUgOiBwcm9jLnBtMl9lbnYucG1faWQgKyAnfCcgKyBwcm9jLnBtMl9lbnYubmFtZSxcclxuICAgICAgICAgICAgICB0eXBlICAgICA6ICdlcnInXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBQb3B1bGF0ZSB0aGUgYXJyYXkgYGZpbGVzX2xpc3RgIHdpdGggdGhlIHBhdGhzIG9mIGFsbCBmaWxlcyB3ZSBuZWVkIHRvIHRhaWwsIHdoZW4gbG9nIGluIHB1dCBpcyBhIHJlZ2V4XHJcbiAgICAgICAgZWxzZSBpZihwcm9jLnBtMl9lbnYgJiYgKGlzTmFOKGlkKSAmJiBpZFswXSA9PT0gJy8nICYmIGlkW2lkLmxlbmd0aCAtIDFdID09PSAnLycpKSB7XHJcbiAgICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKGlkLnJlcGxhY2UoL1xcLy9nLCAnJykpO1xyXG4gICAgICAgICAgaWYocmVnZXgudGVzdChwcm9jLnBtMl9lbnYubmFtZSkpIHtcclxuICAgICAgICAgICAgaWYocmVnZXhMaXN0LmluZGV4T2YocHJvYy5wbTJfZW52Lm5hbWUpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgIHJlZ2V4TGlzdC5wdXNoKHByb2MucG0yX2Vudi5uYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX291dF9sb2dfcGF0aCAmJiBleGNsdXNpdmUgIT09ICdlcnInKVxyXG4gICAgICAgICAgICAgIHB1c2hJZlVuaXF1ZSh7XHJcbiAgICAgICAgICAgICAgICBwYXRoICAgICA6IHByb2MucG0yX2Vudi5wbV9vdXRfbG9nX3BhdGgsXHJcbiAgICAgICAgICAgICAgICBhcHBfbmFtZSA6IHByb2MucG0yX2Vudi5wbV9pZCArICd8JyArIHByb2MucG0yX2Vudi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgOiAnb3V0J30pO1xyXG4gICAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCAmJiBleGNsdXNpdmUgIT09ICdvdXQnKVxyXG4gICAgICAgICAgICAgIHB1c2hJZlVuaXF1ZSh7XHJcbiAgICAgICAgICAgICAgICBwYXRoICAgICA6IHByb2MucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGgsXHJcbiAgICAgICAgICAgICAgICBhcHBfbmFtZSA6IHByb2MucG0yX2Vudi5wbV9pZCArICd8JyArIHByb2MucG0yX2Vudi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgOiAnZXJyJ1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgLy9mb3IgZml4aW5nIGlzc3VlIGh0dHBzOi8vZ2l0aHViLmNvbS9Vbml0ZWNoL3BtMi9pc3N1ZXMvMzUwNlxyXG4gICAgIC8qIGlmIChmaWxlc19saXN0ICYmIGZpbGVzX2xpc3QubGVuZ3RoID09IDApIHtcclxuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyAnTm8gZmlsZSB0byBzdHJlYW0gZm9yIGFwcCBbJXNdLCBleGl0aW5nLicsIGlkKTtcclxuICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KGNzdC5FUlJPUl9FWElUKTtcclxuICAgICAgfSovXHJcblxyXG4gICAgICBpZiAoIXJhdyAmJiAoaWQgPT09ICdhbGwnIHx8IGlkID09PSAnUE0yJykgJiYgZXhjbHVzaXZlID09PSBmYWxzZSkge1xyXG4gICAgICAgIExvZy50YWlsKFt7XHJcbiAgICAgICAgICBwYXRoICAgICA6IGNzdC5QTTJfTE9HX0ZJTEVfUEFUSCxcclxuICAgICAgICAgIGFwcF9uYW1lIDogJ1BNMicsXHJcbiAgICAgICAgICB0eXBlICAgICA6ICdQTTInXHJcbiAgICAgICAgfV0sIGxpbmVzLCByYXcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgTG9nLnRhaWwoZmlsZXNfbGlzdCwgbGluZXMsIHJhdywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIExvZy5zdHJlYW0odGhhdC5DbGllbnQsIGlkLCByYXcsIHRpbWVzdGFtcCwgZXhjbHVzaXZlLCBoaWdobGlnaHQpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgTG9nLnRhaWwoZmlsZXNfbGlzdCwgbGluZXMsIHJhdywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZihyZWdleExpc3QubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICByZWdleExpc3QuZm9yRWFjaChmdW5jdGlvbihpZCkge1xyXG4gICAgICAgICAgICAgICAgTG9nLnN0cmVhbSh0aGF0LkNsaWVudCwgaWQsIHJhdywgdGltZXN0YW1wLCBleGNsdXNpdmUsIGhpZ2hsaWdodCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmKG5hbWVzcGFjZUxpc3QubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBuYW1lc3BhY2VMaXN0LmZvckVhY2goZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICAgICAgICAgIExvZy5zdHJlYW0odGhhdC5DbGllbnQsIGlkLCByYXcsIHRpbWVzdGFtcCwgZXhjbHVzaXZlLCBoaWdobGlnaHQpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIExvZy5zdHJlYW0odGhhdC5DbGllbnQsIGlkLCByYXcsIHRpbWVzdGFtcCwgZXhjbHVzaXZlLCBoaWdobGlnaHQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEZXNjcmlwdGlvblxyXG4gICAqIEBtZXRob2QgcHJpbnRMb2dzXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IGlkXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGxpbmVzXHJcbiAgICogQHBhcmFtIHtCb29sZWFufSByYXdcclxuICAgKiBAcmV0dXJuXHJcbiAgICovXHJcbiAgQ0xJLnByb3RvdHlwZS5wcmludExvZ3MgPSBmdW5jdGlvbihpZCwgbGluZXMsIHJhdywgdGltZXN0YW1wLCBleGNsdXNpdmUpIHtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIHZhciBmaWxlc19saXN0ID0gW107XHJcblxyXG4gICAgLy8gSWYgbm8gYXJndW1lbnQgaXMgZ2l2ZW4sIHdlIHN0cmVhbSBsb2dzIGZvciBhbGwgcnVubmluZyBhcHBzXHJcbiAgICBpZCA9IGlkIHx8ICdhbGwnO1xyXG4gICAgbGluZXMgPSBsaW5lcyAhPT0gdW5kZWZpbmVkID8gbGluZXMgOiAyMDtcclxuICAgIGxpbmVzID0gbGluZXMgPCAwID8gLShsaW5lcykgOiBsaW5lcztcclxuXHJcbiAgICAvLyBBdm9pZCBkdXBsaWNhdGVzIGFuZCBjaGVjayBpZiBwYXRoIGlzIGRpZmZlcmVudCBmcm9tICcvZGV2L251bGwnXHJcbiAgICB2YXIgcHVzaElmVW5pcXVlID0gZnVuY3Rpb24oZW50cnkpIHtcclxuICAgICAgdmFyIGV4aXN0cyA9IGZhbHNlO1xyXG5cclxuICAgICAgaWYgKGVudHJ5LnBhdGgudG9Mb3dlckNhc2VcclxuICAgICAgICAgICYmIGVudHJ5LnBhdGgudG9Mb3dlckNhc2UoKSAhPT0gJy9kZXYvbnVsbCcpIHtcclxuXHJcbiAgICAgICAgZmlsZXNfbGlzdC5zb21lKGZ1bmN0aW9uKGZpbGUpIHtcclxuICAgICAgICAgIGlmIChmaWxlLnBhdGggPT09IGVudHJ5LnBhdGgpXHJcbiAgICAgICAgICAgIGV4aXN0cyA9IHRydWU7XHJcbiAgICAgICAgICByZXR1cm4gZXhpc3RzO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoZXhpc3RzKVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBmaWxlc19saXN0LnB1c2goZW50cnkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IHRoZSBsaXN0IG9mIGFsbCBydW5uaW5nIGFwcHNcclxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xyXG4gICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcclxuICAgICAgICB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobGluZXMgPD0gMCkge1xyXG4gICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVClcclxuICAgICAgfVxyXG5cclxuICAgICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQuZ3JleSh1dGlsLmZvcm1hdC5jYWxsKHRoaXMsICdbVEFJTElOR10gVGFpbGluZyBsYXN0ICVkIGxpbmVzIGZvciBbJXNdIHByb2Nlc3MlcyAoY2hhbmdlIHRoZSB2YWx1ZSB3aXRoIC0tbGluZXMgb3B0aW9uKScsIGxpbmVzLCBpZCwgaWQgPT09ICdhbGwnID8gJ2VzJyA6ICcnKSkpO1xyXG5cclxuICAgICAgLy8gUG9wdWxhdGUgdGhlIGFycmF5IGBmaWxlc19saXN0YCB3aXRoIHRoZSBwYXRocyBvZiBhbGwgZmlsZXMgd2UgbmVlZCB0byB0YWlsXHJcbiAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbihwcm9jKSB7XHJcbiAgICAgICAgaWYgKHByb2MucG0yX2VudiAmJiAoaWQgPT09ICdhbGwnIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvYy5wbTJfZW52Lm5hbWUgPT0gaWQgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jLnBtMl9lbnYucG1faWQgPT0gaWQpKSB7XHJcbiAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX291dF9sb2dfcGF0aCAmJiBleGNsdXNpdmUgIT09ICdlcnInKVxyXG4gICAgICAgICAgICBwdXNoSWZVbmlxdWUoe1xyXG4gICAgICAgICAgICAgIHBhdGggICAgIDogcHJvYy5wbTJfZW52LnBtX291dF9sb2dfcGF0aCxcclxuICAgICAgICAgICAgICBhcHBfbmFtZSA6cHJvYy5wbTJfZW52LnBtX2lkICsgJ3wnICsgcHJvYy5wbTJfZW52Lm5hbWUsXHJcbiAgICAgICAgICAgICAgdHlwZSAgICAgOiAnb3V0J30pO1xyXG4gICAgICAgICAgaWYgKHByb2MucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGggJiYgZXhjbHVzaXZlICE9PSAnb3V0JylcclxuICAgICAgICAgICAgcHVzaElmVW5pcXVlKHtcclxuICAgICAgICAgICAgICBwYXRoICAgICA6IHByb2MucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGgsXHJcbiAgICAgICAgICAgICAgYXBwX25hbWUgOiBwcm9jLnBtMl9lbnYucG1faWQgKyAnfCcgKyBwcm9jLnBtMl9lbnYubmFtZSxcclxuICAgICAgICAgICAgICB0eXBlICAgICA6ICdlcnInXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBQb3B1bGF0ZSB0aGUgYXJyYXkgYGZpbGVzX2xpc3RgIHdpdGggdGhlIHBhdGhzIG9mIGFsbCBmaWxlcyB3ZSBuZWVkIHRvIHRhaWwsIHdoZW4gbG9nIGluIHB1dCBpcyBhIHJlZ2V4XHJcbiAgICAgICAgZWxzZSBpZihwcm9jLnBtMl9lbnYgJiYgKGlzTmFOKGlkKSAmJiBpZFswXSA9PT0gJy8nICYmIGlkW2lkLmxlbmd0aCAtIDFdID09PSAnLycpKSB7XHJcbiAgICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKGlkLnJlcGxhY2UoL1xcLy9nLCAnJykpO1xyXG4gICAgICAgICAgaWYocmVnZXgudGVzdChwcm9jLnBtMl9lbnYubmFtZSkpIHtcclxuICAgICAgICAgICAgaWYgKHByb2MucG0yX2Vudi5wbV9vdXRfbG9nX3BhdGggJiYgZXhjbHVzaXZlICE9PSAnZXJyJylcclxuICAgICAgICAgICAgICBwdXNoSWZVbmlxdWUoe1xyXG4gICAgICAgICAgICAgICAgcGF0aCAgICAgOiBwcm9jLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoLFxyXG4gICAgICAgICAgICAgICAgYXBwX25hbWUgOiBwcm9jLnBtMl9lbnYucG1faWQgKyAnfCcgKyBwcm9jLnBtMl9lbnYubmFtZSxcclxuICAgICAgICAgICAgICAgIHR5cGUgICAgIDogJ291dCd9KTtcclxuICAgICAgICAgICAgaWYgKHByb2MucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGggJiYgZXhjbHVzaXZlICE9PSAnb3V0JylcclxuICAgICAgICAgICAgICBwdXNoSWZVbmlxdWUoe1xyXG4gICAgICAgICAgICAgICAgcGF0aCAgICAgOiBwcm9jLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoLFxyXG4gICAgICAgICAgICAgICAgYXBwX25hbWUgOiBwcm9jLnBtMl9lbnYucG1faWQgKyAnfCcgKyBwcm9jLnBtMl9lbnYubmFtZSxcclxuICAgICAgICAgICAgICAgIHR5cGUgICAgIDogJ2VycidcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaWYgKCFyYXcgJiYgKGlkID09PSAnYWxsJyB8fCBpZCA9PT0gJ1BNMicpICYmIGV4Y2x1c2l2ZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICBMb2cudGFpbChbe1xyXG4gICAgICAgICAgcGF0aCAgICAgOiBjc3QuUE0yX0xPR19GSUxFX1BBVEgsXHJcbiAgICAgICAgICBhcHBfbmFtZSA6ICdQTTInLFxyXG4gICAgICAgICAgdHlwZSAgICAgOiAnUE0yJ1xyXG4gICAgICAgIH1dLCBsaW5lcywgcmF3LCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIExvZy50YWlsKGZpbGVzX2xpc3QsIGxpbmVzLCByYXcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBMb2cudGFpbChmaWxlc19saXN0LCBsaW5lcywgcmF3LCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfTtcclxufTtcclxuIl19