"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

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

var _constants = _interopRequireDefault(require("../../constants"));

var _Common = _interopRequireDefault(require("../Common"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvTG9nTWFuYWdlbWVudC50cyJdLCJuYW1lcyI6WyJDTEkiLCJwcm90b3R5cGUiLCJmbHVzaCIsImFwaSIsImNiIiwidGhhdCIsIkNvbW1vbiIsInByaW50T3V0IiwiY3N0IiwiUFJFRklYX01TRyIsIlBNMl9MT0dfRklMRV9QQVRIIiwiZnMiLCJjbG9zZVN5bmMiLCJvcGVuU3luYyIsIkNsaWVudCIsImV4ZWN1dGVSZW1vdGUiLCJlcnIiLCJsaXN0IiwicHJpbnRFcnJvciIsInJldEVyciIsImV4aXRDbGkiLCJFUlJPUl9FWElUIiwiZm9yRWFjaCIsImwiLCJwbTJfZW52IiwicG1fb3V0X2xvZ19wYXRoIiwicG1fZXJyX2xvZ19wYXRoIiwicG1fbG9nX3BhdGgiLCJuYW1lIiwibGFzdEluZGV4T2YiLCJTVUNDRVNTX0VYSVQiLCJsb2dyb3RhdGUiLCJvcHRzIiwicHJvY2VzcyIsImdldHVpZCIsInN0ZG91dCIsInN0ZGVyciIsImNoYWxrIiwiZ3JleSIsInBhdGgiLCJkaXJuYW1lIiwiZXhlY1BhdGgiLCJ0cmltIiwiZXhpc3RzU3luYyIsInRlbXBsYXRlUGF0aCIsImpvaW4iLCJURU1QTEFURV9GT0xERVIiLCJMT0dST1RBVEVfU0NSSVBUIiwic2NyaXB0IiwicmVhZEZpbGVTeW5jIiwiZW5jb2RpbmciLCJ1c2VyIiwicmVwbGFjZSIsIlBNMl9ST09UX1BBVEgiLCJ3cml0ZUZpbGVTeW5jIiwiZSIsImNvbnNvbGUiLCJlcnJvciIsInN0YWNrIiwic3VjY2VzcyIsInJlbG9hZExvZ3MiLCJsb2dzIiwic3RyZWFtTG9ncyIsImlkIiwibGluZXMiLCJyYXciLCJ0aW1lc3RhbXAiLCJleGNsdXNpdmUiLCJoaWdobGlnaHQiLCJmaWxlc19saXN0IiwidW5kZWZpbmVkIiwicHVzaElmVW5pcXVlIiwiZW50cnkiLCJleGlzdHMiLCJ0b0xvd2VyQ2FzZSIsInNvbWUiLCJmaWxlIiwicHVzaCIsInJlZ2V4TGlzdCIsIm5hbWVzcGFjZUxpc3QiLCJMb2ciLCJzdHJlYW0iLCJib2xkIiwidXRpbCIsImZvcm1hdCIsImNhbGwiLCJwcm9jIiwicG1faWQiLCJhcHBfbmFtZSIsInR5cGUiLCJuYW1lc3BhY2UiLCJpbmRleE9mIiwiaXNOYU4iLCJsZW5ndGgiLCJyZWdleCIsIlJlZ0V4cCIsInRlc3QiLCJ0YWlsIiwicHJpbnRMb2dzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFZSxrQkFBVUEsR0FBVixFQUFlO0FBRTVCOzs7OztBQUtBQSxFQUFBQSxHQUFHLENBQUNDLFNBQUosQ0FBY0MsS0FBZCxHQUFzQixVQUFVQyxHQUFWLEVBQWVDLEVBQWYsRUFBbUI7QUFDdkMsUUFBSUMsSUFBSSxHQUFHLElBQVg7O0FBRUEsUUFBSSxDQUFDRixHQUFMLEVBQVU7QUFDUkcseUJBQU9DLFFBQVAsQ0FBZ0JDLHNCQUFJQyxVQUFKLEdBQWlCLFdBQWpCLEdBQStCRCxzQkFBSUUsaUJBQW5EOztBQUNBQyxxQkFBR0MsU0FBSCxDQUFhRCxlQUFHRSxRQUFILENBQVlMLHNCQUFJRSxpQkFBaEIsRUFBbUMsR0FBbkMsQ0FBYjtBQUNEOztBQUVETCxJQUFBQSxJQUFJLENBQUNTLE1BQUwsQ0FBWUMsYUFBWixDQUEwQixnQkFBMUIsRUFBNEMsRUFBNUMsRUFBZ0QsVUFBVUMsR0FBVixFQUFlQyxJQUFmLEVBQXFCO0FBQ25FLFVBQUlELEdBQUosRUFBUztBQUNQViwyQkFBT1ksVUFBUCxDQUFrQkYsR0FBbEI7O0FBQ0EsZUFBT1osRUFBRSxHQUFHQSxFQUFFLENBQUNFLG1CQUFPYSxNQUFQLENBQWNILEdBQWQsQ0FBRCxDQUFMLEdBQTRCWCxJQUFJLENBQUNlLE9BQUwsQ0FBYVosc0JBQUlhLFVBQWpCLENBQXJDO0FBQ0Q7O0FBQ0RKLE1BQUFBLElBQUksQ0FBQ0ssT0FBTCxDQUFhLFVBQVVDLENBQVYsRUFBYTtBQUN4QixZQUFJLE9BQU9wQixHQUFQLElBQWMsV0FBbEIsRUFBK0I7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Q0FBUzVCLFVBQVQsRUFBcUJMLEtBQXJCLEVBQTRCQyxHQUE1QixFQUFpQyxZQUFZO0FBQzNDNUQsVUFBQUEsSUFBSSxDQUFDZSxPQUFMLENBQWFaLHNCQUFJc0IsWUFBakI7QUFDRCxTQUZEO0FBR0Q7QUFDRixLQWxFRDtBQW1FRCxHQWpHRDtBQWtHRDs7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgeyBleGVjIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuaW1wb3J0IExvZyBmcm9tICcuL0xvZyc7XG5pbXBvcnQgY3N0IGZyb20gJy4uLy4uL2NvbnN0YW50cyc7XG5pbXBvcnQgQ29tbW9uIGZyb20gJy4uL0NvbW1vbic7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChDTEkpIHtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBmbHVzaFxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmZsdXNoID0gZnVuY3Rpb24gKGFwaSwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAoIWFwaSkge1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0ZsdXNoaW5nICcgKyBjc3QuUE0yX0xPR19GSUxFX1BBVEgpO1xuICAgICAgZnMuY2xvc2VTeW5jKGZzLm9wZW5TeW5jKGNzdC5QTTJfTE9HX0ZJTEVfUEFUSCwgJ3cnKSk7XG4gICAgfVxuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24gKGVyciwgbGlzdCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICBpZiAodHlwZW9mIGFwaSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdGbHVzaGluZzonKTtcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyBsLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoKTtcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyBsLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoKTtcblxuICAgICAgICAgIGlmIChsLnBtMl9lbnYucG1fbG9nX3BhdGgpIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArIGwucG0yX2Vudi5wbV9sb2dfcGF0aCk7XG4gICAgICAgICAgICBmcy5jbG9zZVN5bmMoZnMub3BlblN5bmMobC5wbTJfZW52LnBtX2xvZ19wYXRoLCAndycpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZnMuY2xvc2VTeW5jKGZzLm9wZW5TeW5jKGwucG0yX2Vudi5wbV9vdXRfbG9nX3BhdGgsICd3JykpO1xuICAgICAgICAgIGZzLmNsb3NlU3luYyhmcy5vcGVuU3luYyhsLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoLCAndycpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsLnBtMl9lbnYubmFtZSA9PT0gYXBpKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0ZsdXNoaW5nOicpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArIGwucG0yX2Vudi5wbV9vdXRfbG9nX3BhdGgpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArIGwucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGgpO1xuXG4gICAgICAgICAgaWYgKGwucG0yX2Vudi5wbV9sb2dfcGF0aCAmJlxuICAgICAgICAgICAgbC5wbTJfZW52LnBtX2xvZ19wYXRoLmxhc3RJbmRleE9mKCcvJykgPCBsLnBtMl9lbnYucG1fbG9nX3BhdGgubGFzdEluZGV4T2YoYXBpKSkge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgbC5wbTJfZW52LnBtX2xvZ19wYXRoKTtcbiAgICAgICAgICAgIGZzLmNsb3NlU3luYyhmcy5vcGVuU3luYyhsLnBtMl9lbnYucG1fbG9nX3BhdGgsICd3JykpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChsLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoLmxhc3RJbmRleE9mKCcvJykgPCBsLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoLmxhc3RJbmRleE9mKGFwaSkpXG4gICAgICAgICAgICBmcy5jbG9zZVN5bmMoZnMub3BlblN5bmMobC5wbTJfZW52LnBtX291dF9sb2dfcGF0aCwgJ3cnKSk7XG4gICAgICAgICAgaWYgKGwucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGgubGFzdEluZGV4T2YoJy8nKSA8IGwucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGgubGFzdEluZGV4T2YoYXBpKSlcbiAgICAgICAgICAgIGZzLmNsb3NlU3luYyhmcy5vcGVuU3luYyhsLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoLCAndycpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdMb2dzIGZsdXNoZWQnKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGxpc3QpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH0pO1xuICB9O1xuXG4gIENMSS5wcm90b3R5cGUubG9ncm90YXRlID0gZnVuY3Rpb24gKG9wdHMsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHByb2Nlc3MuZ2V0dWlkKCkgIT0gMCkge1xuICAgICAgcmV0dXJuIGV4ZWMoJ3dob2FtaScsIGZ1bmN0aW9uIChlcnIsIHN0ZG91dCwgc3RkZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHICsgJ1lvdSBoYXZlIHRvIHJ1biB0aGlzIGNvbW1hbmQgYXMgcm9vdC4gRXhlY3V0ZSB0aGUgZm9sbG93aW5nIGNvbW1hbmQ6Jyk7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHICsgY2hhbGsuZ3JleSgnICAgICAgc3VkbyBlbnYgUEFUSD0kUEFUSDonICsgcGF0aC5kaXJuYW1lKHByb2Nlc3MuZXhlY1BhdGgpICsgJyBwbTIgbG9ncm90YXRlIC11ICcgKyBzdGRvdXQudHJpbSgpKSk7XG5cbiAgICAgICAgY2IgPyBjYihDb21tb24ucmV0RXJyKCdZb3UgaGF2ZSB0byBydW4gdGhpcyB3aXRoIGVsZXZhdGVkIHJpZ2h0cycpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoJy9ldGMvbG9ncm90YXRlLmQnKSkge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0cgKyAnL2V0Yy9sb2dyb3RhdGUuZCBkb2VzIG5vdCBleGlzdCB3ZSBjYW4gbm90IGNvcHkgdGhlIGRlZmF1bHQgY29uZmlndXJhdGlvbi4nKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoJy9ldGMvbG9ncm90YXRlLmQgZG9lcyBub3QgZXhpc3QnKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgIH1cblxuICAgIHZhciB0ZW1wbGF0ZVBhdGggPSBwYXRoLmpvaW4oY3N0LlRFTVBMQVRFX0ZPTERFUiwgY3N0LkxPR1JPVEFURV9TQ1JJUFQpO1xuICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdHZXR0aW5nIGxvZ3JvcmF0ZSB0ZW1wbGF0ZSAnICsgdGVtcGxhdGVQYXRoKTtcbiAgICB2YXIgc2NyaXB0ID0gZnMucmVhZEZpbGVTeW5jKHRlbXBsYXRlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuXG4gICAgdmFyIHVzZXIgPSBvcHRzLnVzZXIgfHwgJ3Jvb3QnO1xuXG4gICAgc2NyaXB0ID0gc2NyaXB0LnJlcGxhY2UoLyVIT01FX1BBVEglL2csIGNzdC5QTTJfUk9PVF9QQVRIKVxuICAgICAgLnJlcGxhY2UoLyVVU0VSJS9nLCB1c2VyKTtcblxuICAgIHRyeSB7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKCcvZXRjL2xvZ3JvdGF0ZS5kL3BtMi0nICsgdXNlciwgc2NyaXB0KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gICAgfVxuXG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0xvZ3JvdGF0ZSBjb25maWd1cmF0aW9uIGFkZGVkIHRvIC9ldGMvbG9ncm90YXRlLmQvcG0yJyk7XG4gICAgcmV0dXJuIGNiID8gY2IobnVsbCwgeyBzdWNjZXNzOiB0cnVlIH0pIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIHJlbG9hZExvZ3NcbiAgICogQHJldHVyblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5yZWxvYWRMb2dzID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgQ29tbW9uLnByaW50T3V0KCdSZWxvYWRpbmcgYWxsIGxvZ3MuLi4nKTtcbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdyZWxvYWRMb2dzJywge30sIGZ1bmN0aW9uIChlcnIsIGxvZ3MpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgICBDb21tb24ucHJpbnRPdXQoJ0FsbCBsb2dzIHJlbG9hZGVkJyk7XG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBsb2dzKSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBzdHJlYW1Mb2dzXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBpZFxuICAgKiBAcGFyYW0ge051bWJlcn0gbGluZXNcbiAgICogQHBhcmFtIHtCb29sZWFufSByYXdcbiAgICogQHJldHVyblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5zdHJlYW1Mb2dzID0gZnVuY3Rpb24gKGlkLCBsaW5lcywgcmF3LCB0aW1lc3RhbXAsIGV4Y2x1c2l2ZSwgaGlnaGxpZ2h0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBmaWxlc19saXN0ID0gW107XG5cbiAgICAvLyBJZiBubyBhcmd1bWVudCBpcyBnaXZlbiwgd2Ugc3RyZWFtIGxvZ3MgZm9yIGFsbCBydW5uaW5nIGFwcHNcbiAgICBpZCA9IGlkIHx8ICdhbGwnO1xuICAgIGxpbmVzID0gbGluZXMgIT09IHVuZGVmaW5lZCA/IGxpbmVzIDogMjA7XG4gICAgbGluZXMgPSBsaW5lcyA8IDAgPyAtKGxpbmVzKSA6IGxpbmVzO1xuXG4gICAgLy8gQXZvaWQgZHVwbGljYXRlcyBhbmQgY2hlY2sgaWYgcGF0aCBpcyBkaWZmZXJlbnQgZnJvbSAnL2Rldi9udWxsJ1xuICAgIHZhciBwdXNoSWZVbmlxdWUgPSBmdW5jdGlvbiAoZW50cnkpIHtcbiAgICAgIHZhciBleGlzdHMgPSBmYWxzZTtcblxuICAgICAgaWYgKGVudHJ5LnBhdGgudG9Mb3dlckNhc2VcbiAgICAgICAgJiYgZW50cnkucGF0aC50b0xvd2VyQ2FzZSgpICE9PSAnL2Rldi9udWxsJykge1xuXG4gICAgICAgIGZpbGVzX2xpc3Quc29tZShmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgIGlmIChmaWxlLnBhdGggPT09IGVudHJ5LnBhdGgpXG4gICAgICAgICAgICBleGlzdHMgPSB0cnVlO1xuICAgICAgICAgIHJldHVybiBleGlzdHM7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChleGlzdHMpXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGZpbGVzX2xpc3QucHVzaChlbnRyeSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gR2V0IHRoZSBsaXN0IG9mIGFsbCBydW5uaW5nIGFwcHNcbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICB2YXIgcmVnZXhMaXN0ID0gW107XG4gICAgICB2YXIgbmFtZXNwYWNlTGlzdCA9IFtdO1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChsaW5lcyA9PT0gMClcbiAgICAgICAgcmV0dXJuIExvZy5zdHJlYW0odGhhdC5DbGllbnQsIGlkLCByYXcsIHRpbWVzdGFtcCwgZXhjbHVzaXZlLCBoaWdobGlnaHQpO1xuXG4gICAgICBDb21tb24ucHJpbnRPdXQoY2hhbGsuYm9sZC5ncmV5KHV0aWwuZm9ybWF0LmNhbGwodGhpcywgJ1tUQUlMSU5HXSBUYWlsaW5nIGxhc3QgJWQgbGluZXMgZm9yIFslc10gcHJvY2VzcyVzIChjaGFuZ2UgdGhlIHZhbHVlIHdpdGggLS1saW5lcyBvcHRpb24pJywgbGluZXMsIGlkLCBpZCA9PT0gJ2FsbCcgPyAnZXMnIDogJycpKSk7XG5cbiAgICAgIC8vIFBvcHVsYXRlIHRoZSBhcnJheSBgZmlsZXNfbGlzdGAgd2l0aCB0aGUgcGF0aHMgb2YgYWxsIGZpbGVzIHdlIG5lZWQgdG8gdGFpbFxuICAgICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChwcm9jKSB7XG4gICAgICAgIGlmIChwcm9jLnBtMl9lbnYgJiYgKGlkID09PSAnYWxsJyB8fFxuICAgICAgICAgIHByb2MucG0yX2Vudi5uYW1lID09IGlkIHx8XG4gICAgICAgICAgcHJvYy5wbTJfZW52LnBtX2lkID09IGlkKSkge1xuICAgICAgICAgIGlmIChwcm9jLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoICYmIGV4Y2x1c2l2ZSAhPT0gJ2VycicpXG4gICAgICAgICAgICBwdXNoSWZVbmlxdWUoe1xuICAgICAgICAgICAgICBwYXRoOiBwcm9jLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoLFxuICAgICAgICAgICAgICBhcHBfbmFtZTogcHJvYy5wbTJfZW52LnBtX2lkICsgJ3wnICsgcHJvYy5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICAgIHR5cGU6ICdvdXQnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCAmJiBleGNsdXNpdmUgIT09ICdvdXQnKVxuICAgICAgICAgICAgcHVzaElmVW5pcXVlKHtcbiAgICAgICAgICAgICAgcGF0aDogcHJvYy5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCxcbiAgICAgICAgICAgICAgYXBwX25hbWU6IHByb2MucG0yX2Vudi5wbV9pZCArICd8JyArIHByb2MucG0yX2Vudi5uYW1lLFxuICAgICAgICAgICAgICB0eXBlOiAnZXJyJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvYy5wbTJfZW52ICYmIHByb2MucG0yX2Vudi5uYW1lc3BhY2UgPT0gaWQpIHtcbiAgICAgICAgICBpZiAobmFtZXNwYWNlTGlzdC5pbmRleE9mKHByb2MucG0yX2Vudi5uYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZUxpc3QucHVzaChwcm9jLnBtMl9lbnYubmFtZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHByb2MucG0yX2Vudi5wbV9vdXRfbG9nX3BhdGggJiYgZXhjbHVzaXZlICE9PSAnZXJyJylcbiAgICAgICAgICAgIHB1c2hJZlVuaXF1ZSh7XG4gICAgICAgICAgICAgIHBhdGg6IHByb2MucG0yX2Vudi5wbV9vdXRfbG9nX3BhdGgsXG4gICAgICAgICAgICAgIGFwcF9uYW1lOiBwcm9jLnBtMl9lbnYucG1faWQgKyAnfCcgKyBwcm9jLnBtMl9lbnYubmFtZSxcbiAgICAgICAgICAgICAgdHlwZTogJ291dCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChwcm9jLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoICYmIGV4Y2x1c2l2ZSAhPT0gJ291dCcpXG4gICAgICAgICAgICBwdXNoSWZVbmlxdWUoe1xuICAgICAgICAgICAgICBwYXRoOiBwcm9jLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoLFxuICAgICAgICAgICAgICBhcHBfbmFtZTogcHJvYy5wbTJfZW52LnBtX2lkICsgJ3wnICsgcHJvYy5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICAgIHR5cGU6ICdlcnInXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBQb3B1bGF0ZSB0aGUgYXJyYXkgYGZpbGVzX2xpc3RgIHdpdGggdGhlIHBhdGhzIG9mIGFsbCBmaWxlcyB3ZSBuZWVkIHRvIHRhaWwsIHdoZW4gbG9nIGluIHB1dCBpcyBhIHJlZ2V4XG4gICAgICAgIGVsc2UgaWYgKHByb2MucG0yX2VudiAmJiAoaXNOYU4oaWQpICYmIGlkWzBdID09PSAnLycgJiYgaWRbaWQubGVuZ3RoIC0gMV0gPT09ICcvJykpIHtcbiAgICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKGlkLnJlcGxhY2UoL1xcLy9nLCAnJykpO1xuICAgICAgICAgIGlmIChyZWdleC50ZXN0KHByb2MucG0yX2Vudi5uYW1lKSkge1xuICAgICAgICAgICAgaWYgKHJlZ2V4TGlzdC5pbmRleE9mKHByb2MucG0yX2Vudi5uYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgcmVnZXhMaXN0LnB1c2gocHJvYy5wbTJfZW52Lm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByb2MucG0yX2Vudi5wbV9vdXRfbG9nX3BhdGggJiYgZXhjbHVzaXZlICE9PSAnZXJyJylcbiAgICAgICAgICAgICAgcHVzaElmVW5pcXVlKHtcbiAgICAgICAgICAgICAgICBwYXRoOiBwcm9jLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoLFxuICAgICAgICAgICAgICAgIGFwcF9uYW1lOiBwcm9jLnBtMl9lbnYucG1faWQgKyAnfCcgKyBwcm9jLnBtMl9lbnYubmFtZSxcbiAgICAgICAgICAgICAgICB0eXBlOiAnb3V0J1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChwcm9jLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoICYmIGV4Y2x1c2l2ZSAhPT0gJ291dCcpXG4gICAgICAgICAgICAgIHB1c2hJZlVuaXF1ZSh7XG4gICAgICAgICAgICAgICAgcGF0aDogcHJvYy5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCxcbiAgICAgICAgICAgICAgICBhcHBfbmFtZTogcHJvYy5wbTJfZW52LnBtX2lkICsgJ3wnICsgcHJvYy5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2VycidcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy9mb3IgZml4aW5nIGlzc3VlIGh0dHBzOi8vZ2l0aHViLmNvbS9Vbml0ZWNoL3BtMi9pc3N1ZXMvMzUwNlxuICAgICAgLyogaWYgKGZpbGVzX2xpc3QgJiYgZmlsZXNfbGlzdC5sZW5ndGggPT0gMCkge1xuICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgJ05vIGZpbGUgdG8gc3RyZWFtIGZvciBhcHAgWyVzXSwgZXhpdGluZy4nLCBpZCk7XG4gICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICB9Ki9cblxuICAgICAgaWYgKCFyYXcgJiYgKGlkID09PSAnYWxsJyB8fCBpZCA9PT0gJ1BNMicpICYmIGV4Y2x1c2l2ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgTG9nLnRhaWwoW3tcbiAgICAgICAgICBwYXRoOiBjc3QuUE0yX0xPR19GSUxFX1BBVEgsXG4gICAgICAgICAgYXBwX25hbWU6ICdQTTInLFxuICAgICAgICAgIHR5cGU6ICdQTTInXG4gICAgICAgIH1dLCBsaW5lcywgcmF3LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgTG9nLnRhaWwoZmlsZXNfbGlzdCwgbGluZXMsIHJhdywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgTG9nLnN0cmVhbSh0aGF0LkNsaWVudCwgaWQsIHJhdywgdGltZXN0YW1wLCBleGNsdXNpdmUsIGhpZ2hsaWdodCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIExvZy50YWlsKGZpbGVzX2xpc3QsIGxpbmVzLCByYXcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAocmVnZXhMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJlZ2V4TGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICBMb2cuc3RyZWFtKHRoYXQuQ2xpZW50LCBpZCwgcmF3LCB0aW1lc3RhbXAsIGV4Y2x1c2l2ZSwgaGlnaGxpZ2h0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKG5hbWVzcGFjZUxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbmFtZXNwYWNlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICBMb2cuc3RyZWFtKHRoYXQuQ2xpZW50LCBpZCwgcmF3LCB0aW1lc3RhbXAsIGV4Y2x1c2l2ZSwgaGlnaGxpZ2h0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgTG9nLnN0cmVhbSh0aGF0LkNsaWVudCwgaWQsIHJhdywgdGltZXN0YW1wLCBleGNsdXNpdmUsIGhpZ2hsaWdodCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBwcmludExvZ3NcbiAgICogQHBhcmFtIHtTdHJpbmd9IGlkXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsaW5lc1xuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHJhd1xuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnByaW50TG9ncyA9IGZ1bmN0aW9uIChpZCwgbGluZXMsIHJhdywgdGltZXN0YW1wLCBleGNsdXNpdmUpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIGZpbGVzX2xpc3QgPSBbXTtcblxuICAgIC8vIElmIG5vIGFyZ3VtZW50IGlzIGdpdmVuLCB3ZSBzdHJlYW0gbG9ncyBmb3IgYWxsIHJ1bm5pbmcgYXBwc1xuICAgIGlkID0gaWQgfHwgJ2FsbCc7XG4gICAgbGluZXMgPSBsaW5lcyAhPT0gdW5kZWZpbmVkID8gbGluZXMgOiAyMDtcbiAgICBsaW5lcyA9IGxpbmVzIDwgMCA/IC0obGluZXMpIDogbGluZXM7XG5cbiAgICAvLyBBdm9pZCBkdXBsaWNhdGVzIGFuZCBjaGVjayBpZiBwYXRoIGlzIGRpZmZlcmVudCBmcm9tICcvZGV2L251bGwnXG4gICAgdmFyIHB1c2hJZlVuaXF1ZSA9IGZ1bmN0aW9uIChlbnRyeSkge1xuICAgICAgdmFyIGV4aXN0cyA9IGZhbHNlO1xuXG4gICAgICBpZiAoZW50cnkucGF0aC50b0xvd2VyQ2FzZVxuICAgICAgICAmJiBlbnRyeS5wYXRoLnRvTG93ZXJDYXNlKCkgIT09ICcvZGV2L251bGwnKSB7XG5cbiAgICAgICAgZmlsZXNfbGlzdC5zb21lKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgaWYgKGZpbGUucGF0aCA9PT0gZW50cnkucGF0aClcbiAgICAgICAgICAgIGV4aXN0cyA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuIGV4aXN0cztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGV4aXN0cylcbiAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgZmlsZXNfbGlzdC5wdXNoKGVudHJ5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBHZXQgdGhlIGxpc3Qgb2YgYWxsIHJ1bm5pbmcgYXBwc1xuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGxpbmVzIDw9IDApIHtcbiAgICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKVxuICAgICAgfVxuXG4gICAgICBDb21tb24ucHJpbnRPdXQoY2hhbGsuYm9sZC5ncmV5KHV0aWwuZm9ybWF0LmNhbGwodGhpcywgJ1tUQUlMSU5HXSBUYWlsaW5nIGxhc3QgJWQgbGluZXMgZm9yIFslc10gcHJvY2VzcyVzIChjaGFuZ2UgdGhlIHZhbHVlIHdpdGggLS1saW5lcyBvcHRpb24pJywgbGluZXMsIGlkLCBpZCA9PT0gJ2FsbCcgPyAnZXMnIDogJycpKSk7XG5cbiAgICAgIC8vIFBvcHVsYXRlIHRoZSBhcnJheSBgZmlsZXNfbGlzdGAgd2l0aCB0aGUgcGF0aHMgb2YgYWxsIGZpbGVzIHdlIG5lZWQgdG8gdGFpbFxuICAgICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChwcm9jKSB7XG4gICAgICAgIGlmIChwcm9jLnBtMl9lbnYgJiYgKGlkID09PSAnYWxsJyB8fFxuICAgICAgICAgIHByb2MucG0yX2Vudi5uYW1lID09IGlkIHx8XG4gICAgICAgICAgcHJvYy5wbTJfZW52LnBtX2lkID09IGlkKSkge1xuICAgICAgICAgIGlmIChwcm9jLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoICYmIGV4Y2x1c2l2ZSAhPT0gJ2VycicpXG4gICAgICAgICAgICBwdXNoSWZVbmlxdWUoe1xuICAgICAgICAgICAgICBwYXRoOiBwcm9jLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoLFxuICAgICAgICAgICAgICBhcHBfbmFtZTogcHJvYy5wbTJfZW52LnBtX2lkICsgJ3wnICsgcHJvYy5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICAgIHR5cGU6ICdvdXQnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCAmJiBleGNsdXNpdmUgIT09ICdvdXQnKVxuICAgICAgICAgICAgcHVzaElmVW5pcXVlKHtcbiAgICAgICAgICAgICAgcGF0aDogcHJvYy5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCxcbiAgICAgICAgICAgICAgYXBwX25hbWU6IHByb2MucG0yX2Vudi5wbV9pZCArICd8JyArIHByb2MucG0yX2Vudi5uYW1lLFxuICAgICAgICAgICAgICB0eXBlOiAnZXJyJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUG9wdWxhdGUgdGhlIGFycmF5IGBmaWxlc19saXN0YCB3aXRoIHRoZSBwYXRocyBvZiBhbGwgZmlsZXMgd2UgbmVlZCB0byB0YWlsLCB3aGVuIGxvZyBpbiBwdXQgaXMgYSByZWdleFxuICAgICAgICBlbHNlIGlmIChwcm9jLnBtMl9lbnYgJiYgKGlzTmFOKGlkKSAmJiBpZFswXSA9PT0gJy8nICYmIGlkW2lkLmxlbmd0aCAtIDFdID09PSAnLycpKSB7XG4gICAgICAgICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChpZC5yZXBsYWNlKC9cXC8vZywgJycpKTtcbiAgICAgICAgICBpZiAocmVnZXgudGVzdChwcm9jLnBtMl9lbnYubmFtZSkpIHtcbiAgICAgICAgICAgIGlmIChwcm9jLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoICYmIGV4Y2x1c2l2ZSAhPT0gJ2VycicpXG4gICAgICAgICAgICAgIHB1c2hJZlVuaXF1ZSh7XG4gICAgICAgICAgICAgICAgcGF0aDogcHJvYy5wbTJfZW52LnBtX291dF9sb2dfcGF0aCxcbiAgICAgICAgICAgICAgICBhcHBfbmFtZTogcHJvYy5wbTJfZW52LnBtX2lkICsgJ3wnICsgcHJvYy5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICAgICAgdHlwZTogJ291dCdcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCAmJiBleGNsdXNpdmUgIT09ICdvdXQnKVxuICAgICAgICAgICAgICBwdXNoSWZVbmlxdWUoe1xuICAgICAgICAgICAgICAgIHBhdGg6IHByb2MucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGgsXG4gICAgICAgICAgICAgICAgYXBwX25hbWU6IHByb2MucG0yX2Vudi5wbV9pZCArICd8JyArIHByb2MucG0yX2Vudi5uYW1lLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdlcnInXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmICghcmF3ICYmIChpZCA9PT0gJ2FsbCcgfHwgaWQgPT09ICdQTTInKSAmJiBleGNsdXNpdmUgPT09IGZhbHNlKSB7XG4gICAgICAgIExvZy50YWlsKFt7XG4gICAgICAgICAgcGF0aDogY3N0LlBNMl9MT0dfRklMRV9QQVRILFxuICAgICAgICAgIGFwcF9uYW1lOiAnUE0yJyxcbiAgICAgICAgICB0eXBlOiAnUE0yJ1xuICAgICAgICB9XSwgbGluZXMsIHJhdywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIExvZy50YWlsKGZpbGVzX2xpc3QsIGxpbmVzLCByYXcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgTG9nLnRhaWwoZmlsZXNfbGlzdCwgbGluZXMsIHJhdywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59O1xuIl19