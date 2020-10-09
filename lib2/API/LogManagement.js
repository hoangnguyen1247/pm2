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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvTG9nTWFuYWdlbWVudC50cyJdLCJuYW1lcyI6WyJDTEkiLCJwcm90b3R5cGUiLCJmbHVzaCIsImFwaSIsImNiIiwidGhhdCIsIkNvbW1vbiIsInByaW50T3V0IiwiY3N0IiwiUFJFRklYX01TRyIsIlBNMl9MT0dfRklMRV9QQVRIIiwiZnMiLCJjbG9zZVN5bmMiLCJvcGVuU3luYyIsIkNsaWVudCIsImV4ZWN1dGVSZW1vdGUiLCJlcnIiLCJsaXN0IiwicHJpbnRFcnJvciIsInJldEVyciIsImV4aXRDbGkiLCJFUlJPUl9FWElUIiwiZm9yRWFjaCIsImwiLCJwbTJfZW52IiwicG1fb3V0X2xvZ19wYXRoIiwicG1fZXJyX2xvZ19wYXRoIiwicG1fbG9nX3BhdGgiLCJuYW1lIiwibGFzdEluZGV4T2YiLCJTVUNDRVNTX0VYSVQiLCJsb2dyb3RhdGUiLCJvcHRzIiwicHJvY2VzcyIsImdldHVpZCIsInN0ZG91dCIsInN0ZGVyciIsImNoYWxrIiwiZ3JleSIsInBhdGgiLCJkaXJuYW1lIiwiZXhlY1BhdGgiLCJ0cmltIiwiZXhpc3RzU3luYyIsInRlbXBsYXRlUGF0aCIsImpvaW4iLCJURU1QTEFURV9GT0xERVIiLCJMT0dST1RBVEVfU0NSSVBUIiwic2NyaXB0IiwicmVhZEZpbGVTeW5jIiwiZW5jb2RpbmciLCJ1c2VyIiwicmVwbGFjZSIsIlBNMl9ST09UX1BBVEgiLCJ3cml0ZUZpbGVTeW5jIiwiZSIsImNvbnNvbGUiLCJlcnJvciIsInN0YWNrIiwic3VjY2VzcyIsInJlbG9hZExvZ3MiLCJsb2dzIiwic3RyZWFtTG9ncyIsImlkIiwibGluZXMiLCJyYXciLCJ0aW1lc3RhbXAiLCJleGNsdXNpdmUiLCJoaWdobGlnaHQiLCJmaWxlc19saXN0IiwidW5kZWZpbmVkIiwicHVzaElmVW5pcXVlIiwiZW50cnkiLCJleGlzdHMiLCJ0b0xvd2VyQ2FzZSIsInNvbWUiLCJmaWxlIiwicHVzaCIsInJlZ2V4TGlzdCIsIm5hbWVzcGFjZUxpc3QiLCJMb2ciLCJzdHJlYW0iLCJib2xkIiwidXRpbCIsImZvcm1hdCIsImNhbGwiLCJwcm9jIiwicG1faWQiLCJhcHBfbmFtZSIsInR5cGUiLCJuYW1lc3BhY2UiLCJpbmRleE9mIiwiaXNOYU4iLCJsZW5ndGgiLCJyZWdleCIsIlJlZ0V4cCIsInRlc3QiLCJ0YWlsIiwicHJpbnRMb2dzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7QUFFZSxrQkFBU0EsR0FBVCxFQUFjO0FBRTNCOzs7OztBQUtBQSxFQUFBQSxHQUFHLENBQUNDLFNBQUosQ0FBY0MsS0FBZCxHQUFzQixVQUFTQyxHQUFULEVBQWNDLEVBQWQsRUFBa0I7QUFDdEMsUUFBSUMsSUFBSSxHQUFHLElBQVg7O0FBRUEsUUFBSSxDQUFDRixHQUFMLEVBQVU7QUFDUkcseUJBQU9DLFFBQVAsQ0FBZ0JDLHNCQUFJQyxVQUFKLEdBQWlCLFdBQWpCLEdBQStCRCxzQkFBSUUsaUJBQW5EOztBQUNBQyxxQkFBR0MsU0FBSCxDQUFhRCxlQUFHRSxRQUFILENBQVlMLHNCQUFJRSxpQkFBaEIsRUFBbUMsR0FBbkMsQ0FBYjtBQUNEOztBQUVETCxJQUFBQSxJQUFJLENBQUNTLE1BQUwsQ0FBWUMsYUFBWixDQUEwQixnQkFBMUIsRUFBNEMsRUFBNUMsRUFBZ0QsVUFBU0MsR0FBVCxFQUFjQyxJQUFkLEVBQW9CO0FBQ2xFLFVBQUlELEdBQUosRUFBUztBQUNQViwyQkFBT1ksVUFBUCxDQUFrQkYsR0FBbEI7O0FBQ0EsZUFBT1osRUFBRSxHQUFHQSxFQUFFLENBQUNFLG1CQUFPYSxNQUFQLENBQWNILEdBQWQsQ0FBRCxDQUFMLEdBQTRCWCxJQUFJLENBQUNlLE9BQUwsQ0FBYVosc0JBQUlhLFVBQWpCLENBQXJDO0FBQ0Q7O0FBQ0RKLE1BQUFBLElBQUksQ0FBQ0ssT0FBTCxDQUFhLFVBQVNDLENBQVQsRUFBWTtBQUN2QixZQUFJLE9BQU9wQixHQUFQLElBQWMsV0FBbEIsRUFBK0I7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LEVBQXFCTCxLQUFyQixFQUE0QkMsR0FBNUIsRUFBaUMsWUFBVztBQUMxQzVELFVBQUFBLElBQUksQ0FBQ2UsT0FBTCxDQUFhWixzQkFBSXNCLFlBQWpCO0FBQ0QsU0FGRDtBQUdEO0FBQ0YsS0FoRUQ7QUFpRUQsR0EvRkQ7QUFnR0Q7O0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgIGZyb20gJ2NoYWxrJztcbmltcG9ydCB1dGlsICAgZnJvbSAndXRpbCc7XG5pbXBvcnQgZnMgICAgIGZyb20gJ2ZzJztcbmltcG9ydCB7IGV4ZWMgfSAgIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHBhdGggICBmcm9tICdwYXRoJztcblxuaW1wb3J0IExvZyAgICBmcm9tICcuL0xvZyc7XG5pbXBvcnQgY3N0ICAgIGZyb20gJy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgQ29tbW9uIGZyb20gJy4uL0NvbW1vbi5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKENMSSkge1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIGZsdXNoXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUuZmx1c2ggPSBmdW5jdGlvbihhcGksIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKCFhcGkpIHtcbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdGbHVzaGluZyAnICsgY3N0LlBNMl9MT0dfRklMRV9QQVRIKTtcbiAgICAgIGZzLmNsb3NlU3luYyhmcy5vcGVuU3luYyhjc3QuUE0yX0xPR19GSUxFX1BBVEgsICd3JykpO1xuICAgIH1cblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbihsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXBpID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0ZsdXNoaW5nOicpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArIGwucG0yX2Vudi5wbV9vdXRfbG9nX3BhdGgpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArIGwucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGgpO1xuXG4gICAgICAgICAgaWYgKGwucG0yX2Vudi5wbV9sb2dfcGF0aCkge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgbC5wbTJfZW52LnBtX2xvZ19wYXRoKTtcbiAgICAgICAgICAgIGZzLmNsb3NlU3luYyhmcy5vcGVuU3luYyhsLnBtMl9lbnYucG1fbG9nX3BhdGgsICd3JykpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmcy5jbG9zZVN5bmMoZnMub3BlblN5bmMobC5wbTJfZW52LnBtX291dF9sb2dfcGF0aCwgJ3cnKSk7XG4gICAgICAgICAgZnMuY2xvc2VTeW5jKGZzLm9wZW5TeW5jKGwucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGgsICd3JykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGwucG0yX2Vudi5uYW1lID09PSBhcGkpIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnRmx1c2hpbmc6Jyk7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgbC5wbTJfZW52LnBtX291dF9sb2dfcGF0aCk7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgbC5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCk7XG5cbiAgICAgICAgICBpZiAobC5wbTJfZW52LnBtX2xvZ19wYXRoICYmXG4gICAgICAgICAgICAgIGwucG0yX2Vudi5wbV9sb2dfcGF0aC5sYXN0SW5kZXhPZignLycpIDwgbC5wbTJfZW52LnBtX2xvZ19wYXRoLmxhc3RJbmRleE9mKGFwaSkpIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArIGwucG0yX2Vudi5wbV9sb2dfcGF0aCk7XG4gICAgICAgICAgICBmcy5jbG9zZVN5bmMoZnMub3BlblN5bmMobC5wbTJfZW52LnBtX2xvZ19wYXRoLCAndycpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAobC5wbTJfZW52LnBtX291dF9sb2dfcGF0aC5sYXN0SW5kZXhPZignLycpIDwgbC5wbTJfZW52LnBtX291dF9sb2dfcGF0aC5sYXN0SW5kZXhPZihhcGkpKVxuICAgICAgICAgICAgZnMuY2xvc2VTeW5jKGZzLm9wZW5TeW5jKGwucG0yX2Vudi5wbV9vdXRfbG9nX3BhdGgsICd3JykpO1xuICAgICAgICAgIGlmIChsLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoLmxhc3RJbmRleE9mKCcvJykgPCBsLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoLmxhc3RJbmRleE9mKGFwaSkpXG4gICAgICAgICAgICBmcy5jbG9zZVN5bmMoZnMub3BlblN5bmMobC5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCwgJ3cnKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnTG9ncyBmbHVzaGVkJyk7XG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBsaXN0KSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICB9KTtcbiAgfTtcblxuICBDTEkucHJvdG90eXBlLmxvZ3JvdGF0ZSA9IGZ1bmN0aW9uKG9wdHMsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHByb2Nlc3MuZ2V0dWlkKCkgIT0gMCkge1xuICAgICAgcmV0dXJuIGV4ZWMoJ3dob2FtaScsIGZ1bmN0aW9uKGVyciwgc3Rkb3V0LCBzdGRlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0cgKyAnWW91IGhhdmUgdG8gcnVuIHRoaXMgY29tbWFuZCBhcyByb290LiBFeGVjdXRlIHRoZSBmb2xsb3dpbmcgY29tbWFuZDonKTtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0cgKyBjaGFsay5ncmV5KCcgICAgICBzdWRvIGVudiBQQVRIPSRQQVRIOicgKyBwYXRoLmRpcm5hbWUocHJvY2Vzcy5leGVjUGF0aCkgKyAnIHBtMiBsb2dyb3RhdGUgLXUgJyArIHN0ZG91dC50cmltKCkpKTtcblxuICAgICAgICBjYiA/IGNiKENvbW1vbi5yZXRFcnIoJ1lvdSBoYXZlIHRvIHJ1biB0aGlzIHdpdGggZWxldmF0ZWQgcmlnaHRzJykpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghZnMuZXhpc3RzU3luYygnL2V0Yy9sb2dyb3RhdGUuZCcpKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TRyArICcvZXRjL2xvZ3JvdGF0ZS5kIGRvZXMgbm90IGV4aXN0IHdlIGNhbiBub3QgY29weSB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uLicpO1xuICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycignL2V0Yy9sb2dyb3RhdGUuZCBkb2VzIG5vdCBleGlzdCcpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgfVxuXG4gICAgdmFyIHRlbXBsYXRlUGF0aCA9IHBhdGguam9pbihjc3QuVEVNUExBVEVfRk9MREVSLCBjc3QuTE9HUk9UQVRFX1NDUklQVCk7XG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0dldHRpbmcgbG9ncm9yYXRlIHRlbXBsYXRlICcgKyB0ZW1wbGF0ZVBhdGgpO1xuICAgIHZhciBzY3JpcHQgPSBmcy5yZWFkRmlsZVN5bmModGVtcGxhdGVQYXRoLCB7ZW5jb2Rpbmc6ICd1dGY4J30pO1xuXG4gICAgdmFyIHVzZXIgPSBvcHRzLnVzZXIgfHwgJ3Jvb3QnO1xuXG4gICAgc2NyaXB0ID0gc2NyaXB0LnJlcGxhY2UoLyVIT01FX1BBVEglL2csIGNzdC5QTTJfUk9PVF9QQVRIKVxuICAgICAgLnJlcGxhY2UoLyVVU0VSJS9nLCB1c2VyKTtcblxuICAgIHRyeSB7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKCcvZXRjL2xvZ3JvdGF0ZS5kL3BtMi0nK3VzZXIsIHNjcmlwdCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgIH1cblxuICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdMb2dyb3RhdGUgY29uZmlndXJhdGlvbiBhZGRlZCB0byAvZXRjL2xvZ3JvdGF0ZS5kL3BtMicpO1xuICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOnRydWV9KSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCByZWxvYWRMb2dzXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUucmVsb2FkTG9ncyA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgQ29tbW9uLnByaW50T3V0KCdSZWxvYWRpbmcgYWxsIGxvZ3MuLi4nKTtcbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdyZWxvYWRMb2dzJywge30sIGZ1bmN0aW9uKGVyciwgbG9ncykge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIENvbW1vbi5wcmludE91dCgnQWxsIGxvZ3MgcmVsb2FkZWQnKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGxvZ3MpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIHN0cmVhbUxvZ3NcbiAgICogQHBhcmFtIHtTdHJpbmd9IGlkXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsaW5lc1xuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHJhd1xuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnN0cmVhbUxvZ3MgPSBmdW5jdGlvbihpZCwgbGluZXMsIHJhdywgdGltZXN0YW1wLCBleGNsdXNpdmUsIGhpZ2hsaWdodCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgZmlsZXNfbGlzdCA9IFtdO1xuXG4gICAgLy8gSWYgbm8gYXJndW1lbnQgaXMgZ2l2ZW4sIHdlIHN0cmVhbSBsb2dzIGZvciBhbGwgcnVubmluZyBhcHBzXG4gICAgaWQgPSBpZCB8fCAnYWxsJztcbiAgICBsaW5lcyA9IGxpbmVzICE9PSB1bmRlZmluZWQgPyBsaW5lcyA6IDIwO1xuICAgIGxpbmVzID0gbGluZXMgPCAwID8gLShsaW5lcykgOiBsaW5lcztcblxuICAgIC8vIEF2b2lkIGR1cGxpY2F0ZXMgYW5kIGNoZWNrIGlmIHBhdGggaXMgZGlmZmVyZW50IGZyb20gJy9kZXYvbnVsbCdcbiAgICB2YXIgcHVzaElmVW5pcXVlID0gZnVuY3Rpb24oZW50cnkpIHtcbiAgICAgIHZhciBleGlzdHMgPSBmYWxzZTtcblxuICAgICAgaWYgKGVudHJ5LnBhdGgudG9Mb3dlckNhc2VcbiAgICAgICAgICAmJiBlbnRyeS5wYXRoLnRvTG93ZXJDYXNlKCkgIT09ICcvZGV2L251bGwnKSB7XG5cbiAgICAgICAgZmlsZXNfbGlzdC5zb21lKGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICBpZiAoZmlsZS5wYXRoID09PSBlbnRyeS5wYXRoKVxuICAgICAgICAgICAgZXhpc3RzID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm4gZXhpc3RzO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZXhpc3RzKVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBmaWxlc19saXN0LnB1c2goZW50cnkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEdldCB0aGUgbGlzdCBvZiBhbGwgcnVubmluZyBhcHBzXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XG4gICAgICB2YXIgcmVnZXhMaXN0ID0gW107XG4gICAgICB2YXIgbmFtZXNwYWNlTGlzdCA9IFtdO1xuXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChsaW5lcyA9PT0gMClcbiAgICAgICAgcmV0dXJuIExvZy5zdHJlYW0odGhhdC5DbGllbnQsIGlkLCByYXcsIHRpbWVzdGFtcCwgZXhjbHVzaXZlLCBoaWdobGlnaHQpO1xuXG4gICAgICBDb21tb24ucHJpbnRPdXQoY2hhbGsuYm9sZC5ncmV5KHV0aWwuZm9ybWF0LmNhbGwodGhpcywgJ1tUQUlMSU5HXSBUYWlsaW5nIGxhc3QgJWQgbGluZXMgZm9yIFslc10gcHJvY2VzcyVzIChjaGFuZ2UgdGhlIHZhbHVlIHdpdGggLS1saW5lcyBvcHRpb24pJywgbGluZXMsIGlkLCBpZCA9PT0gJ2FsbCcgPyAnZXMnIDogJycpKSk7XG5cbiAgICAgIC8vIFBvcHVsYXRlIHRoZSBhcnJheSBgZmlsZXNfbGlzdGAgd2l0aCB0aGUgcGF0aHMgb2YgYWxsIGZpbGVzIHdlIG5lZWQgdG8gdGFpbFxuICAgICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHByb2MpIHtcbiAgICAgICAgaWYgKHByb2MucG0yX2VudiAmJiAoaWQgPT09ICdhbGwnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2MucG0yX2Vudi5uYW1lID09IGlkIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2MucG0yX2Vudi5wbV9pZCA9PSBpZCkpIHtcbiAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX291dF9sb2dfcGF0aCAmJiBleGNsdXNpdmUgIT09ICdlcnInKVxuICAgICAgICAgICAgcHVzaElmVW5pcXVlKHtcbiAgICAgICAgICAgICAgcGF0aCAgICAgOiBwcm9jLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoLFxuICAgICAgICAgICAgICBhcHBfbmFtZSA6cHJvYy5wbTJfZW52LnBtX2lkICsgJ3wnICsgcHJvYy5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICAgIHR5cGUgICAgIDogJ291dCd9KTtcbiAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCAmJiBleGNsdXNpdmUgIT09ICdvdXQnKVxuICAgICAgICAgICAgcHVzaElmVW5pcXVlKHtcbiAgICAgICAgICAgICAgcGF0aCAgICAgOiBwcm9jLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoLFxuICAgICAgICAgICAgICBhcHBfbmFtZSA6IHByb2MucG0yX2Vudi5wbV9pZCArICd8JyArIHByb2MucG0yX2Vudi5uYW1lLFxuICAgICAgICAgICAgICB0eXBlICAgICA6ICdlcnInXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmKHByb2MucG0yX2VudiAmJiBwcm9jLnBtMl9lbnYubmFtZXNwYWNlID09IGlkKSB7XG4gICAgICAgICAgaWYobmFtZXNwYWNlTGlzdC5pbmRleE9mKHByb2MucG0yX2Vudi5uYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZUxpc3QucHVzaChwcm9jLnBtMl9lbnYubmFtZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHByb2MucG0yX2Vudi5wbV9vdXRfbG9nX3BhdGggJiYgZXhjbHVzaXZlICE9PSAnZXJyJylcbiAgICAgICAgICAgIHB1c2hJZlVuaXF1ZSh7XG4gICAgICAgICAgICAgIHBhdGggICAgIDogcHJvYy5wbTJfZW52LnBtX291dF9sb2dfcGF0aCxcbiAgICAgICAgICAgICAgYXBwX25hbWUgOnByb2MucG0yX2Vudi5wbV9pZCArICd8JyArIHByb2MucG0yX2Vudi5uYW1lLFxuICAgICAgICAgICAgICB0eXBlICAgICA6ICdvdXQnfSk7XG4gICAgICAgICAgaWYgKHByb2MucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGggJiYgZXhjbHVzaXZlICE9PSAnb3V0JylcbiAgICAgICAgICAgIHB1c2hJZlVuaXF1ZSh7XG4gICAgICAgICAgICAgIHBhdGggICAgIDogcHJvYy5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCxcbiAgICAgICAgICAgICAgYXBwX25hbWUgOiBwcm9jLnBtMl9lbnYucG1faWQgKyAnfCcgKyBwcm9jLnBtMl9lbnYubmFtZSxcbiAgICAgICAgICAgICAgdHlwZSAgICAgOiAnZXJyJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUG9wdWxhdGUgdGhlIGFycmF5IGBmaWxlc19saXN0YCB3aXRoIHRoZSBwYXRocyBvZiBhbGwgZmlsZXMgd2UgbmVlZCB0byB0YWlsLCB3aGVuIGxvZyBpbiBwdXQgaXMgYSByZWdleFxuICAgICAgICBlbHNlIGlmKHByb2MucG0yX2VudiAmJiAoaXNOYU4oaWQpICYmIGlkWzBdID09PSAnLycgJiYgaWRbaWQubGVuZ3RoIC0gMV0gPT09ICcvJykpIHtcbiAgICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKGlkLnJlcGxhY2UoL1xcLy9nLCAnJykpO1xuICAgICAgICAgIGlmKHJlZ2V4LnRlc3QocHJvYy5wbTJfZW52Lm5hbWUpKSB7XG4gICAgICAgICAgICBpZihyZWdleExpc3QuaW5kZXhPZihwcm9jLnBtMl9lbnYubmFtZSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgIHJlZ2V4TGlzdC5wdXNoKHByb2MucG0yX2Vudi5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9jLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoICYmIGV4Y2x1c2l2ZSAhPT0gJ2VycicpXG4gICAgICAgICAgICAgIHB1c2hJZlVuaXF1ZSh7XG4gICAgICAgICAgICAgICAgcGF0aCAgICAgOiBwcm9jLnBtMl9lbnYucG1fb3V0X2xvZ19wYXRoLFxuICAgICAgICAgICAgICAgIGFwcF9uYW1lIDogcHJvYy5wbTJfZW52LnBtX2lkICsgJ3wnICsgcHJvYy5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgOiAnb3V0J30pO1xuICAgICAgICAgICAgaWYgKHByb2MucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGggJiYgZXhjbHVzaXZlICE9PSAnb3V0JylcbiAgICAgICAgICAgICAgcHVzaElmVW5pcXVlKHtcbiAgICAgICAgICAgICAgICBwYXRoICAgICA6IHByb2MucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGgsXG4gICAgICAgICAgICAgICAgYXBwX25hbWUgOiBwcm9jLnBtMl9lbnYucG1faWQgKyAnfCcgKyBwcm9jLnBtMl9lbnYubmFtZSxcbiAgICAgICAgICAgICAgICB0eXBlICAgICA6ICdlcnInXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAvL2ZvciBmaXhpbmcgaXNzdWUgaHR0cHM6Ly9naXRodWIuY29tL1VuaXRlY2gvcG0yL2lzc3Vlcy8zNTA2XG4gICAgIC8qIGlmIChmaWxlc19saXN0ICYmIGZpbGVzX2xpc3QubGVuZ3RoID09IDApIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgJ05vIGZpbGUgdG8gc3RyZWFtIGZvciBhcHAgWyVzXSwgZXhpdGluZy4nLCBpZCk7XG4gICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfSovXG5cbiAgICAgIGlmICghcmF3ICYmIChpZCA9PT0gJ2FsbCcgfHwgaWQgPT09ICdQTTInKSAmJiBleGNsdXNpdmUgPT09IGZhbHNlKSB7XG4gICAgICAgIExvZy50YWlsKFt7XG4gICAgICAgICAgcGF0aCAgICAgOiBjc3QuUE0yX0xPR19GSUxFX1BBVEgsXG4gICAgICAgICAgYXBwX25hbWUgOiAnUE0yJyxcbiAgICAgICAgICB0eXBlICAgICA6ICdQTTInXG4gICAgICAgIH1dLCBsaW5lcywgcmF3LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBMb2cudGFpbChmaWxlc19saXN0LCBsaW5lcywgcmF3LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIExvZy5zdHJlYW0odGhhdC5DbGllbnQsIGlkLCByYXcsIHRpbWVzdGFtcCwgZXhjbHVzaXZlLCBoaWdobGlnaHQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBMb2cudGFpbChmaWxlc19saXN0LCBsaW5lcywgcmF3LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZihyZWdleExpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmVnZXhMaXN0LmZvckVhY2goZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgICAgICBMb2cuc3RyZWFtKHRoYXQuQ2xpZW50LCBpZCwgcmF3LCB0aW1lc3RhbXAsIGV4Y2x1c2l2ZSwgaGlnaGxpZ2h0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYobmFtZXNwYWNlTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBuYW1lc3BhY2VMaXN0LmZvckVhY2goZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgICAgICBMb2cuc3RyZWFtKHRoYXQuQ2xpZW50LCBpZCwgcmF3LCB0aW1lc3RhbXAsIGV4Y2x1c2l2ZSwgaGlnaGxpZ2h0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgTG9nLnN0cmVhbSh0aGF0LkNsaWVudCwgaWQsIHJhdywgdGltZXN0YW1wLCBleGNsdXNpdmUsIGhpZ2hsaWdodCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBwcmludExvZ3NcbiAgICogQHBhcmFtIHtTdHJpbmd9IGlkXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsaW5lc1xuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHJhd1xuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnByaW50TG9ncyA9IGZ1bmN0aW9uKGlkLCBsaW5lcywgcmF3LCB0aW1lc3RhbXAsIGV4Y2x1c2l2ZSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgZmlsZXNfbGlzdCA9IFtdO1xuXG4gICAgLy8gSWYgbm8gYXJndW1lbnQgaXMgZ2l2ZW4sIHdlIHN0cmVhbSBsb2dzIGZvciBhbGwgcnVubmluZyBhcHBzXG4gICAgaWQgPSBpZCB8fCAnYWxsJztcbiAgICBsaW5lcyA9IGxpbmVzICE9PSB1bmRlZmluZWQgPyBsaW5lcyA6IDIwO1xuICAgIGxpbmVzID0gbGluZXMgPCAwID8gLShsaW5lcykgOiBsaW5lcztcblxuICAgIC8vIEF2b2lkIGR1cGxpY2F0ZXMgYW5kIGNoZWNrIGlmIHBhdGggaXMgZGlmZmVyZW50IGZyb20gJy9kZXYvbnVsbCdcbiAgICB2YXIgcHVzaElmVW5pcXVlID0gZnVuY3Rpb24oZW50cnkpIHtcbiAgICAgIHZhciBleGlzdHMgPSBmYWxzZTtcblxuICAgICAgaWYgKGVudHJ5LnBhdGgudG9Mb3dlckNhc2VcbiAgICAgICAgICAmJiBlbnRyeS5wYXRoLnRvTG93ZXJDYXNlKCkgIT09ICcvZGV2L251bGwnKSB7XG5cbiAgICAgICAgZmlsZXNfbGlzdC5zb21lKGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICBpZiAoZmlsZS5wYXRoID09PSBlbnRyeS5wYXRoKVxuICAgICAgICAgICAgZXhpc3RzID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm4gZXhpc3RzO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZXhpc3RzKVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBmaWxlc19saXN0LnB1c2goZW50cnkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEdldCB0aGUgbGlzdCBvZiBhbGwgcnVubmluZyBhcHBzXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChsaW5lcyA8PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVClcbiAgICAgIH1cblxuICAgICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQuZ3JleSh1dGlsLmZvcm1hdC5jYWxsKHRoaXMsICdbVEFJTElOR10gVGFpbGluZyBsYXN0ICVkIGxpbmVzIGZvciBbJXNdIHByb2Nlc3MlcyAoY2hhbmdlIHRoZSB2YWx1ZSB3aXRoIC0tbGluZXMgb3B0aW9uKScsIGxpbmVzLCBpZCwgaWQgPT09ICdhbGwnID8gJ2VzJyA6ICcnKSkpO1xuXG4gICAgICAvLyBQb3B1bGF0ZSB0aGUgYXJyYXkgYGZpbGVzX2xpc3RgIHdpdGggdGhlIHBhdGhzIG9mIGFsbCBmaWxlcyB3ZSBuZWVkIHRvIHRhaWxcbiAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbihwcm9jKSB7XG4gICAgICAgIGlmIChwcm9jLnBtMl9lbnYgJiYgKGlkID09PSAnYWxsJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jLnBtMl9lbnYubmFtZSA9PSBpZCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jLnBtMl9lbnYucG1faWQgPT0gaWQpKSB7XG4gICAgICAgICAgaWYgKHByb2MucG0yX2Vudi5wbV9vdXRfbG9nX3BhdGggJiYgZXhjbHVzaXZlICE9PSAnZXJyJylcbiAgICAgICAgICAgIHB1c2hJZlVuaXF1ZSh7XG4gICAgICAgICAgICAgIHBhdGggICAgIDogcHJvYy5wbTJfZW52LnBtX291dF9sb2dfcGF0aCxcbiAgICAgICAgICAgICAgYXBwX25hbWUgOnByb2MucG0yX2Vudi5wbV9pZCArICd8JyArIHByb2MucG0yX2Vudi5uYW1lLFxuICAgICAgICAgICAgICB0eXBlICAgICA6ICdvdXQnfSk7XG4gICAgICAgICAgaWYgKHByb2MucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGggJiYgZXhjbHVzaXZlICE9PSAnb3V0JylcbiAgICAgICAgICAgIHB1c2hJZlVuaXF1ZSh7XG4gICAgICAgICAgICAgIHBhdGggICAgIDogcHJvYy5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aCxcbiAgICAgICAgICAgICAgYXBwX25hbWUgOiBwcm9jLnBtMl9lbnYucG1faWQgKyAnfCcgKyBwcm9jLnBtMl9lbnYubmFtZSxcbiAgICAgICAgICAgICAgdHlwZSAgICAgOiAnZXJyJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUG9wdWxhdGUgdGhlIGFycmF5IGBmaWxlc19saXN0YCB3aXRoIHRoZSBwYXRocyBvZiBhbGwgZmlsZXMgd2UgbmVlZCB0byB0YWlsLCB3aGVuIGxvZyBpbiBwdXQgaXMgYSByZWdleFxuICAgICAgICBlbHNlIGlmKHByb2MucG0yX2VudiAmJiAoaXNOYU4oaWQpICYmIGlkWzBdID09PSAnLycgJiYgaWRbaWQubGVuZ3RoIC0gMV0gPT09ICcvJykpIHtcbiAgICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKGlkLnJlcGxhY2UoL1xcLy9nLCAnJykpO1xuICAgICAgICAgIGlmKHJlZ2V4LnRlc3QocHJvYy5wbTJfZW52Lm5hbWUpKSB7XG4gICAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX291dF9sb2dfcGF0aCAmJiBleGNsdXNpdmUgIT09ICdlcnInKVxuICAgICAgICAgICAgICBwdXNoSWZVbmlxdWUoe1xuICAgICAgICAgICAgICAgIHBhdGggICAgIDogcHJvYy5wbTJfZW52LnBtX291dF9sb2dfcGF0aCxcbiAgICAgICAgICAgICAgICBhcHBfbmFtZSA6IHByb2MucG0yX2Vudi5wbV9pZCArICd8JyArIHByb2MucG0yX2Vudi5uYW1lLFxuICAgICAgICAgICAgICAgIHR5cGUgICAgIDogJ291dCd9KTtcbiAgICAgICAgICAgIGlmIChwcm9jLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoICYmIGV4Y2x1c2l2ZSAhPT0gJ291dCcpXG4gICAgICAgICAgICAgIHB1c2hJZlVuaXF1ZSh7XG4gICAgICAgICAgICAgICAgcGF0aCAgICAgOiBwcm9jLnBtMl9lbnYucG1fZXJyX2xvZ19wYXRoLFxuICAgICAgICAgICAgICAgIGFwcF9uYW1lIDogcHJvYy5wbTJfZW52LnBtX2lkICsgJ3wnICsgcHJvYy5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICAgICAgdHlwZSAgICAgOiAnZXJyJ1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAoIXJhdyAmJiAoaWQgPT09ICdhbGwnIHx8IGlkID09PSAnUE0yJykgJiYgZXhjbHVzaXZlID09PSBmYWxzZSkge1xuICAgICAgICBMb2cudGFpbChbe1xuICAgICAgICAgIHBhdGggICAgIDogY3N0LlBNMl9MT0dfRklMRV9QQVRILFxuICAgICAgICAgIGFwcF9uYW1lIDogJ1BNMicsXG4gICAgICAgICAgdHlwZSAgICAgOiAnUE0yJ1xuICAgICAgICB9XSwgbGluZXMsIHJhdywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgTG9nLnRhaWwoZmlsZXNfbGlzdCwgbGluZXMsIHJhdywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIExvZy50YWlsKGZpbGVzX2xpc3QsIGxpbmVzLCByYXcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59O1xuIl19