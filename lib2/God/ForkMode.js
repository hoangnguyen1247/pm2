/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
'use strict';
/**
 * @file Fork execution related functions
 * @author Alexandre Strzelewicz <as@unitech.io>
 * @project PM2
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ForkMode;

var _debug = _interopRequireDefault(require("debug"));

var _fs = _interopRequireDefault(require("fs"));

var _Utility = _interopRequireDefault(require("../Utility.js"));

var _path = _interopRequireDefault(require("path"));

var _dayjs = _interopRequireDefault(require("dayjs"));

var _semver = _interopRequireDefault(require("semver"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var log = (0, _debug["default"])('pm2:fork_mode');
/**
 * Description
 * @method exports
 * @param {} God
 * @return
 */

function ForkMode(God) {
  /**
   * For all apps - FORK MODE
   * fork the app
   * @method forkMode
   * @param {} pm2_env
   * @param {} cb
   * @return
   */
  God.forkMode = function forkMode(pm2_env, cb) {
    var command = '';
    var args = [];
    console.log("App [".concat(pm2_env.name, ":").concat(pm2_env.pm_id, "] starting in -fork mode-"));

    var spawn = require('child_process').spawn;

    var interpreter = pm2_env.exec_interpreter || 'node';
    var pidFile = pm2_env.pm_pid_path;

    if (interpreter !== 'none') {
      command = interpreter;

      if (pm2_env.node_args && Array.isArray(pm2_env.node_args)) {
        args = args.concat(pm2_env.node_args);
      } // Deprecated - to remove at some point


      if (process.env.PM2_NODE_OPTIONS) {
        args = args.concat(process.env.PM2_NODE_OPTIONS.split(' '));
      }

      if (interpreter === 'node' || RegExp('node$').test(interpreter)) {
        if (_semver["default"].lt(process.version, '10.0.0')) {
          args.push(_path["default"].resolve(_path["default"].dirname(module.filename), '..', 'ProcessContainerForkLegacy.js'));
        } else {
          args.push(_path["default"].resolve(_path["default"].dirname(module.filename), '..', 'ProcessContainerFork.js'));
        }
      } else args.push(pm2_env.pm_exec_path);
    } else {
      command = pm2_env.pm_exec_path;
      args = [];
    }

    if (pm2_env.args) {
      args = args.concat(pm2_env.args);
    } // piping stream o file


    var stds = {
      out: pm2_env.pm_out_log_path,
      err: pm2_env.pm_err_log_path
    }; // entire log std if necessary.

    if ('pm_log_path' in pm2_env) {
      stds.std = pm2_env.pm_log_path;
    }

    log("stds: %j", stds);

    _Utility["default"].startLogging(stds, function (err, result) {
      if (err) {
        God.logAndGenerateError(err);
        return cb(err);
      }

      ;

      try {
        var options = {
          env: pm2_env,
          detached: true,
          cwd: pm2_env.pm_cwd || process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe', 'ipc'] //Same as fork() in node core

        };

        if (typeof pm2_env.windowsHide === "boolean") {
          options.windowsHide = pm2_env.windowsHide;
        } else {
          options.windowsHide = true;
        }

        if (pm2_env.uid) {
          options.uid = pm2_env.uid;
        }

        if (pm2_env.gid) {
          options.gid = pm2_env.gid;
        }

        var cspr = spawn(command, args, options);
      } catch (e) {
        God.logAndGenerateError(e);
        return cb(e);
      }

      if (!cspr || !cspr.stderr || !cspr.stdout) {
        var fatalError = new Error('Process could not be forked properly, check your system health');
        God.logAndGenerateError(fatalError);
        return cb(fatalError);
      }

      cspr.process = {};
      cspr.process.pid = cspr.pid;
      cspr.pm2_env = pm2_env;

      function transformLogToJson(pm2_env, type, data) {
        return JSON.stringify({
          message: data.toString(),
          timestamp: pm2_env.log_date_format ? (0, _dayjs["default"])().format(pm2_env.log_date_format) : new Date().toISOString(),
          type: type,
          process_id: cspr.pm2_env.pm_id,
          app_name: cspr.pm2_env.name
        }) + '\n';
      }

      function prefixLogWithDate(pm2_env, data) {
        var log_data = [];
        log_data = data.toString().split('\n');
        if (log_data.length > 1) log_data.pop();
        log_data = log_data.map(function (line) {
          return "".concat((0, _dayjs["default"])().format(pm2_env.log_date_format), ": ").concat(line, "\n");
        });
        return log_data.join('');
      }

      cspr.stderr.on('data', function forkErrData(data) {
        var log_data = null; // via --out /dev/null --err /dev/null

        if (pm2_env.disable_logs === true) return false;
        if (pm2_env.log_type && pm2_env.log_type === 'json') log_data = transformLogToJson(pm2_env, 'err', data);else if (pm2_env.log_date_format) log_data = prefixLogWithDate(pm2_env, data);else log_data = data.toString();
        God.bus.emit('log:err', {
          process: {
            pm_id: cspr.pm2_env.pm_id,
            name: cspr.pm2_env.name,
            rev: cspr.pm2_env.versioning && cspr.pm2_env.versioning.revision ? cspr.pm2_env.versioning.revision : null,
            namespace: cspr.pm2_env.namespace
          },
          at: _Utility["default"].getDate(),
          data: log_data
        });

        if (_Utility["default"].checkPathIsNull(pm2_env.pm_err_log_path) && (!pm2_env.pm_log_path || _Utility["default"].checkPathIsNull(pm2_env.pm_log_path))) {
          return false;
        }

        stds.std && stds.std.write && stds.std.write(log_data);
        stds.err && stds.err.write && stds.err.write(log_data);
      });
      cspr.stdout.on('data', function forkOutData(data) {
        var log_data = null;
        if (pm2_env.disable_logs === true) return false;
        if (pm2_env.log_type && pm2_env.log_type === 'json') log_data = transformLogToJson(pm2_env, 'out', data);else if (pm2_env.log_date_format) log_data = prefixLogWithDate(pm2_env, data);else log_data = data.toString();
        God.bus.emit('log:out', {
          process: {
            pm_id: cspr.pm2_env.pm_id,
            name: cspr.pm2_env.name,
            rev: cspr.pm2_env.versioning && cspr.pm2_env.versioning.revision ? cspr.pm2_env.versioning.revision : null,
            namespace: cspr.pm2_env.namespace
          },
          at: _Utility["default"].getDate(),
          data: log_data
        });
        if (_Utility["default"].checkPathIsNull(pm2_env.pm_out_log_path) && (!pm2_env.pm_log_path || _Utility["default"].checkPathIsNull(pm2_env.pm_log_path))) return false;
        stds.std && stds.std.write && stds.std.write(log_data);
        stds.out && stds.out.write && stds.out.write(log_data);
      });
      /**
       * Broadcast message to God
       */

      cspr.on('message', function forkMessage(msg) {
        /*********************************
         * If you edit this function
         * Do the same in ClusterMode.js !
         *********************************/
        if (msg.data && msg.type) {
          process.nextTick(function () {
            return God.bus.emit(msg.type ? msg.type : 'process:msg', {
              at: _Utility["default"].getDate(),
              data: msg.data,
              process: {
                pm_id: cspr.pm2_env.pm_id,
                name: cspr.pm2_env.name,
                versioning: cspr.pm2_env.versioning,
                namespace: cspr.pm2_env.namespace
              }
            });
          });
        } else {
          if (_typeof(msg) == 'object' && 'node_version' in msg) {
            cspr.pm2_env.node_version = msg.node_version;
            return false;
          } else if (_typeof(msg) == 'object' && 'cron_restart' in msg) {
            // cron onTick is invoked in the process
            return God.restartProcessId({
              id: cspr.pm2_env.pm_id
            }, function () {
              console.log('Application %s has been restarted via CRON', cspr.pm2_env.name);
            });
          }

          return God.bus.emit('process:msg', {
            at: _Utility["default"].getDate(),
            raw: msg,
            process: {
              pm_id: cspr.pm2_env.pm_id,
              name: cspr.pm2_env.name,
              namespace: cspr.pm2_env.namespace
            }
          });
        }
      });

      try {
        var pid = cspr.pid;
        if (typeof pid !== 'undefined') _fs["default"].writeFileSync(pidFile, pid.toString());
      } catch (e) {
        console.error(e.stack || e);
      }

      cspr.once('exit', function forkClose(status) {
        try {
          for (var k in stds) {
            if (stds[k] && stds[k].destroy) stds[k].destroy();else if (stds[k] && stds[k].end) stds[k].end();else if (stds[k] && stds[k].close) stds[k].close();
            stds[k] = stds[k]._file;
          }
        } catch (e) {
          God.logAndGenerateError(e);
        }
      });

      cspr._reloadLogs = function (cb) {
        try {
          for (var k in stds) {
            if (stds[k] && stds[k].destroy) stds[k].destroy();else if (stds[k] && stds[k].end) stds[k].end();else if (stds[k] && stds[k].close) stds[k].close();
            stds[k] = stds[k]._file;
          }
        } catch (e) {
          God.logAndGenerateError(e);
        } //cspr.removeAllListeners();


        _Utility["default"].startLogging(stds, cb);
      };

      cspr.unref();
      return cb(null, cspr);
    });
  };
}

;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Hb2QvRm9ya01vZGUudHMiXSwibmFtZXMiOlsibG9nIiwiRm9ya01vZGUiLCJHb2QiLCJmb3JrTW9kZSIsInBtMl9lbnYiLCJjYiIsImNvbW1hbmQiLCJhcmdzIiwiY29uc29sZSIsIm5hbWUiLCJwbV9pZCIsInNwYXduIiwicmVxdWlyZSIsImludGVycHJldGVyIiwiZXhlY19pbnRlcnByZXRlciIsInBpZEZpbGUiLCJwbV9waWRfcGF0aCIsIm5vZGVfYXJncyIsIkFycmF5IiwiaXNBcnJheSIsImNvbmNhdCIsInByb2Nlc3MiLCJlbnYiLCJQTTJfTk9ERV9PUFRJT05TIiwic3BsaXQiLCJSZWdFeHAiLCJ0ZXN0Iiwic2VtdmVyIiwibHQiLCJ2ZXJzaW9uIiwicHVzaCIsInBhdGgiLCJyZXNvbHZlIiwiZGlybmFtZSIsIm1vZHVsZSIsImZpbGVuYW1lIiwicG1fZXhlY19wYXRoIiwic3RkcyIsIm91dCIsInBtX291dF9sb2dfcGF0aCIsImVyciIsInBtX2Vycl9sb2dfcGF0aCIsInN0ZCIsInBtX2xvZ19wYXRoIiwiVXRpbGl0eSIsInN0YXJ0TG9nZ2luZyIsInJlc3VsdCIsImxvZ0FuZEdlbmVyYXRlRXJyb3IiLCJvcHRpb25zIiwiZGV0YWNoZWQiLCJjd2QiLCJwbV9jd2QiLCJzdGRpbyIsIndpbmRvd3NIaWRlIiwidWlkIiwiZ2lkIiwiY3NwciIsImUiLCJzdGRlcnIiLCJzdGRvdXQiLCJmYXRhbEVycm9yIiwiRXJyb3IiLCJwaWQiLCJ0cmFuc2Zvcm1Mb2dUb0pzb24iLCJ0eXBlIiwiZGF0YSIsIkpTT04iLCJzdHJpbmdpZnkiLCJtZXNzYWdlIiwidG9TdHJpbmciLCJ0aW1lc3RhbXAiLCJsb2dfZGF0ZV9mb3JtYXQiLCJmb3JtYXQiLCJEYXRlIiwidG9JU09TdHJpbmciLCJwcm9jZXNzX2lkIiwiYXBwX25hbWUiLCJwcmVmaXhMb2dXaXRoRGF0ZSIsImxvZ19kYXRhIiwibGVuZ3RoIiwicG9wIiwibWFwIiwibGluZSIsImpvaW4iLCJvbiIsImZvcmtFcnJEYXRhIiwiZGlzYWJsZV9sb2dzIiwibG9nX3R5cGUiLCJidXMiLCJlbWl0IiwicmV2IiwidmVyc2lvbmluZyIsInJldmlzaW9uIiwibmFtZXNwYWNlIiwiYXQiLCJnZXREYXRlIiwiY2hlY2tQYXRoSXNOdWxsIiwid3JpdGUiLCJmb3JrT3V0RGF0YSIsImZvcmtNZXNzYWdlIiwibXNnIiwibmV4dFRpY2siLCJub2RlX3ZlcnNpb24iLCJyZXN0YXJ0UHJvY2Vzc0lkIiwiaWQiLCJyYXciLCJmcyIsIndyaXRlRmlsZVN5bmMiLCJlcnJvciIsInN0YWNrIiwib25jZSIsImZvcmtDbG9zZSIsInN0YXR1cyIsImsiLCJkZXN0cm95IiwiZW5kIiwiY2xvc2UiLCJfZmlsZSIsIl9yZWxvYWRMb2dzIiwidW5yZWYiXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQUtBO0FBRUE7Ozs7Ozs7Ozs7O0FBS0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVBLElBQU1BLEdBQUcsR0FBRyx1QkFBWSxlQUFaLENBQVo7QUFDQTs7Ozs7OztBQU1lLFNBQVNDLFFBQVQsQ0FBa0JDLEdBQWxCLEVBQXVCO0FBQ3BDOzs7Ozs7OztBQVFBQSxFQUFBQSxHQUFHLENBQUNDLFFBQUosR0FBZSxTQUFTQSxRQUFULENBQWtCQyxPQUFsQixFQUEyQkMsRUFBM0IsRUFBK0I7QUFDNUMsUUFBSUMsT0FBTyxHQUFHLEVBQWQ7QUFDQSxRQUFJQyxJQUFJLEdBQU0sRUFBZDtBQUVBQyxJQUFBQSxPQUFPLENBQUNSLEdBQVIsZ0JBQW9CSSxPQUFPLENBQUNLLElBQTVCLGNBQW9DTCxPQUFPLENBQUNNLEtBQTVDOztBQUNBLFFBQUlDLEtBQUssR0FBR0MsT0FBTyxDQUFDLGVBQUQsQ0FBUCxDQUF5QkQsS0FBckM7O0FBRUEsUUFBSUUsV0FBVyxHQUFHVCxPQUFPLENBQUNVLGdCQUFSLElBQTRCLE1BQTlDO0FBQ0EsUUFBSUMsT0FBTyxHQUFPWCxPQUFPLENBQUNZLFdBQTFCOztBQUVBLFFBQUlILFdB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QVFHLEtBQVI7QUFDbkMvRSxZQUFBQSxJQUFJLENBQUM0RSxDQUFELENBQUosR0FBVTVFLElBQUksQ0FBQzRFLENBQUQsQ0FBSixDQUFRSSxLQUFsQjtBQUNEO0FBQ0YsU0FQRCxDQU9FLE9BQU01RCxDQUFOLEVBQVM7QUFBRXZELFVBQUFBLEdBQUcsQ0FBQzZDLG1CQUFKLENBQXdCVSxDQUF4QjtBQUE0QixTQVJYLENBUzlCOzs7QUFDQWIsNEJBQVFDLFlBQVIsQ0FBcUJSLElBQXJCLEVBQTJCaEMsRUFBM0I7QUFDRCxPQVhEOztBQWFBbUQsTUFBQUEsSUFBSSxDQUFDK0QsS0FBTDtBQUVBLGFBQU9sSCxFQUFFLENBQUMsSUFBRCxFQUFPbUQsSUFBUCxDQUFUO0FBQ0QsS0FuTkQ7QUFxTkQsR0E1UUQ7QUE2UUQ7O0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgbGljZW5zZSB0aGF0XHJcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBmaWxlIEZvcmsgZXhlY3V0aW9uIHJlbGF0ZWQgZnVuY3Rpb25zXHJcbiAqIEBhdXRob3IgQWxleGFuZHJlIFN0cnplbGV3aWN6IDxhc0B1bml0ZWNoLmlvPlxyXG4gKiBAcHJvamVjdCBQTTJcclxuICovXHJcbmltcG9ydCBkZWJ1Z0xvZ2dlciAgICAgICAgICAgZnJvbSAnZGVidWcnO1xyXG5pbXBvcnQgZnMgICAgICAgICAgICBmcm9tICdmcyc7XHJcbmltcG9ydCBVdGlsaXR5ICAgICAgIGZyb20gJy4uL1V0aWxpdHkuanMnO1xyXG5pbXBvcnQgcGF0aCAgICAgICAgICBmcm9tICdwYXRoJztcclxuaW1wb3J0IGRheWpzICAgICAgICAgZnJvbSAnZGF5anMnO1xyXG5pbXBvcnQgc2VtdmVyICBmcm9tICdzZW12ZXInO1xyXG5cclxuY29uc3QgbG9nID0gZGVidWdMb2dnZXIoJ3BtMjpmb3JrX21vZGUnKTtcclxuLyoqXHJcbiAqIERlc2NyaXB0aW9uXHJcbiAqIEBtZXRob2QgZXhwb3J0c1xyXG4gKiBAcGFyYW0ge30gR29kXHJcbiAqIEByZXR1cm5cclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEZvcmtNb2RlKEdvZCkge1xyXG4gIC8qKlxyXG4gICAqIEZvciBhbGwgYXBwcyAtIEZPUksgTU9ERVxyXG4gICAqIGZvcmsgdGhlIGFwcFxyXG4gICAqIEBtZXRob2QgZm9ya01vZGVcclxuICAgKiBAcGFyYW0ge30gcG0yX2VudlxyXG4gICAqIEBwYXJhbSB7fSBjYlxyXG4gICAqIEByZXR1cm5cclxuICAgKi9cclxuICBHb2QuZm9ya01vZGUgPSBmdW5jdGlvbiBmb3JrTW9kZShwbTJfZW52LCBjYikge1xyXG4gICAgdmFyIGNvbW1hbmQgPSAnJztcclxuICAgIHZhciBhcmdzICAgID0gW107XHJcblxyXG4gICAgY29uc29sZS5sb2coYEFwcCBbJHtwbTJfZW52Lm5hbWV9OiR7cG0yX2Vudi5wbV9pZH1dIHN0YXJ0aW5nIGluIC1mb3JrIG1vZGUtYClcclxuICAgIHZhciBzcGF3biA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKS5zcGF3bjtcclxuXHJcbiAgICB2YXIgaW50ZXJwcmV0ZXIgPSBwbTJfZW52LmV4ZWNfaW50ZXJwcmV0ZXIgfHwgJ25vZGUnO1xyXG4gICAgdmFyIHBpZEZpbGUgICAgID0gcG0yX2Vudi5wbV9waWRfcGF0aDtcclxuXHJcbiAgICBpZiAoaW50ZXJwcmV0ZXIgIT09ICdub25lJykge1xyXG4gICAgICBjb21tYW5kID0gaW50ZXJwcmV0ZXI7XHJcblxyXG4gICAgICBpZiAocG0yX2Vudi5ub2RlX2FyZ3MgJiYgQXJyYXkuaXNBcnJheShwbTJfZW52Lm5vZGVfYXJncykpIHtcclxuICAgICAgICBhcmdzID0gYXJncy5jb25jYXQocG0yX2Vudi5ub2RlX2FyZ3MpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBEZXByZWNhdGVkIC0gdG8gcmVtb3ZlIGF0IHNvbWUgcG9pbnRcclxuICAgICAgaWYgKHByb2Nlc3MuZW52LlBNMl9OT0RFX09QVElPTlMpIHtcclxuICAgICAgICBhcmdzID0gYXJncy5jb25jYXQocHJvY2Vzcy5lbnYuUE0yX05PREVfT1BUSU9OUy5zcGxpdCgnICcpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGludGVycHJldGVyID09PSAnbm9kZScgfHwgUmVnRXhwKCdub2RlJCcpLnRlc3QoaW50ZXJwcmV0ZXIpKSB7XHJcbiAgICAgICAgaWYgKHNlbXZlci5sdChwcm9jZXNzLnZlcnNpb24sICcxMC4wLjAnKSkge1xyXG4gICAgICAgICAgYXJncy5wdXNoKHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUobW9kdWxlLmZpbGVuYW1lKSwgJy4uJywgJ1Byb2Nlc3NDb250YWluZXJGb3JrTGVnYWN5LmpzJykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGFyZ3MucHVzaChwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKG1vZHVsZS5maWxlbmFtZSksICcuLicsICdQcm9jZXNzQ29udGFpbmVyRm9yay5qcycpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZVxyXG4gICAgICAgIGFyZ3MucHVzaChwbTJfZW52LnBtX2V4ZWNfcGF0aCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY29tbWFuZCA9IHBtMl9lbnYucG1fZXhlY19wYXRoO1xyXG4gICAgICBhcmdzID0gWyBdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChwbTJfZW52LmFyZ3MpIHtcclxuICAgICAgYXJncyA9IGFyZ3MuY29uY2F0KHBtMl9lbnYuYXJncyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcGlwaW5nIHN0cmVhbSBvIGZpbGVcclxuICAgIHZhciBzdGRzOiBhbnkgPSB7XHJcbiAgICAgIG91dDogcG0yX2Vudi5wbV9vdXRfbG9nX3BhdGgsXHJcbiAgICAgIGVycjogcG0yX2Vudi5wbV9lcnJfbG9nX3BhdGhcclxuICAgIH07XHJcblxyXG4gICAgLy8gZW50aXJlIGxvZyBzdGQgaWYgbmVjZXNzYXJ5LlxyXG4gICAgaWYgKCdwbV9sb2dfcGF0aCcgaW4gcG0yX2Vudil7XHJcbiAgICAgIHN0ZHMuc3RkID0gcG0yX2Vudi5wbV9sb2dfcGF0aDtcclxuICAgIH1cclxuXHJcbiAgICBsb2coXCJzdGRzOiAlalwiLCBzdGRzKTtcclxuXHJcbiAgICBVdGlsaXR5LnN0YXJ0TG9nZ2luZyhzdGRzLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xyXG4gICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoZXJyKTtcclxuICAgICAgICByZXR1cm4gY2IoZXJyKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIG9wdGlvbnM6IGFueSA9IHtcclxuICAgICAgICAgIGVudiAgICAgIDogcG0yX2VudixcclxuICAgICAgICAgIGRldGFjaGVkIDogdHJ1ZSxcclxuICAgICAgICAgIGN3ZCAgICAgIDogcG0yX2Vudi5wbV9jd2QgfHwgcHJvY2Vzcy5jd2QoKSxcclxuICAgICAgICAgIHN0ZGlvICAgIDogWydwaXBlJywgJ3BpcGUnLCAncGlwZScsICdpcGMnXSAvL1NhbWUgYXMgZm9yaygpIGluIG5vZGUgY29yZVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZihwbTJfZW52LndpbmRvd3NIaWRlKSA9PT0gXCJib29sZWFuXCIpIHtcclxuICAgICAgICAgIG9wdGlvbnMud2luZG93c0hpZGUgPSBwbTJfZW52LndpbmRvd3NIaWRlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBvcHRpb25zLndpbmRvd3NIaWRlID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwbTJfZW52LnVpZCkge1xyXG4gICAgICAgICAgb3B0aW9ucy51aWQgPSBwbTJfZW52LnVpZFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBtMl9lbnYuZ2lkKSB7XHJcbiAgICAgICAgICBvcHRpb25zLmdpZCA9IHBtMl9lbnYuZ2lkXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY3NwciA9IHNwYXduKGNvbW1hbmQsIGFyZ3MsIG9wdGlvbnMpO1xyXG4gICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICBHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihlKTtcclxuICAgICAgICByZXR1cm4gY2IoZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghY3NwciB8fCAhY3Nwci5zdGRlcnIgfHwgIWNzcHIuc3Rkb3V0KSB7XHJcbiAgICAgICAgdmFyIGZhdGFsRXJyb3IgPSBuZXcgRXJyb3IoJ1Byb2Nlc3MgY291bGQgbm90IGJlIGZvcmtlZCBwcm9wZXJseSwgY2hlY2sgeW91ciBzeXN0ZW0gaGVhbHRoJylcclxuICAgICAgICBHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihmYXRhbEVycm9yKTtcclxuICAgICAgICByZXR1cm4gY2IoZmF0YWxFcnJvcik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNzcHIucHJvY2VzcyA9IHt9O1xyXG4gICAgICBjc3ByLnByb2Nlc3MucGlkID0gY3Nwci5waWQ7XHJcbiAgICAgIGNzcHIucG0yX2VudiA9IHBtMl9lbnY7XHJcblxyXG4gICAgICBmdW5jdGlvbiB0cmFuc2Zvcm1Mb2dUb0pzb24ocG0yX2VudiwgdHlwZSwgZGF0YSkge1xyXG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICBtZXNzYWdlIDogZGF0YS50b1N0cmluZygpLFxyXG4gICAgICAgICAgdGltZXN0YW1wIDogcG0yX2Vudi5sb2dfZGF0ZV9mb3JtYXQgPyBkYXlqcygpLmZvcm1hdChwbTJfZW52LmxvZ19kYXRlX2Zvcm1hdCkgOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICB0eXBlIDogdHlwZSxcclxuICAgICAgICAgIHByb2Nlc3NfaWQgOiBjc3ByLnBtMl9lbnYucG1faWQsXHJcbiAgICAgICAgICBhcHBfbmFtZSA6IGNzcHIucG0yX2Vudi5uYW1lXHJcbiAgICAgICAgfSkgKyAnXFxuJ1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBwcmVmaXhMb2dXaXRoRGF0ZShwbTJfZW52LCBkYXRhKSB7XHJcbiAgICAgICAgdmFyIGxvZ19kYXRhOiBhbnlbXSA9IFtdXHJcbiAgICAgICAgbG9nX2RhdGEgPSBkYXRhLnRvU3RyaW5nKCkuc3BsaXQoJ1xcbicpXHJcbiAgICAgICAgaWYgKGxvZ19kYXRhLmxlbmd0aCA+IDEpXHJcbiAgICAgICAgICBsb2dfZGF0YS5wb3AoKVxyXG4gICAgICAgIGxvZ19kYXRhID0gbG9nX2RhdGEubWFwKGxpbmUgPT4gYCR7ZGF5anMoKS5mb3JtYXQocG0yX2Vudi5sb2dfZGF0ZV9mb3JtYXQpfTogJHtsaW5lfVxcbmApXHJcbiAgICAgICAgcmV0dXJuIGxvZ19kYXRhLmpvaW4oJycpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNzcHIuc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24gZm9ya0VyckRhdGEoZGF0YSkge1xyXG4gICAgICAgIHZhciBsb2dfZGF0YSA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIHZpYSAtLW91dCAvZGV2L251bGwgLS1lcnIgL2Rldi9udWxsXHJcbiAgICAgICAgaWYgKHBtMl9lbnYuZGlzYWJsZV9sb2dzID09PSB0cnVlKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChwbTJfZW52LmxvZ190eXBlICYmIHBtMl9lbnYubG9nX3R5cGUgPT09ICdqc29uJylcclxuICAgICAgICAgIGxvZ19kYXRhID0gdHJhbnNmb3JtTG9nVG9Kc29uKHBtMl9lbnYsICdlcnInLCBkYXRhKVxyXG4gICAgICAgIGVsc2UgaWYgKHBtMl9lbnYubG9nX2RhdGVfZm9ybWF0KVxyXG4gICAgICAgICAgbG9nX2RhdGEgPSBwcmVmaXhMb2dXaXRoRGF0ZShwbTJfZW52LCBkYXRhKVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIGxvZ19kYXRhID0gZGF0YS50b1N0cmluZygpO1xyXG5cclxuICAgICAgICBHb2QuYnVzLmVtaXQoJ2xvZzplcnInLCB7XHJcbiAgICAgICAgICBwcm9jZXNzIDoge1xyXG4gICAgICAgICAgICBwbV9pZCAgICAgIDogY3Nwci5wbTJfZW52LnBtX2lkLFxyXG4gICAgICAgICAgICBuYW1lICAgICAgIDogY3Nwci5wbTJfZW52Lm5hbWUsXHJcbiAgICAgICAgICAgIHJldiAgICAgICAgOiAoY3Nwci5wbTJfZW52LnZlcnNpb25pbmcgJiYgY3Nwci5wbTJfZW52LnZlcnNpb25pbmcucmV2aXNpb24pID8gY3Nwci5wbTJfZW52LnZlcnNpb25pbmcucmV2aXNpb24gOiBudWxsLFxyXG4gICAgICAgICAgICBuYW1lc3BhY2UgIDogY3Nwci5wbTJfZW52Lm5hbWVzcGFjZVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGF0ICA6IFV0aWxpdHkuZ2V0RGF0ZSgpLFxyXG4gICAgICAgICAgZGF0YSA6IGxvZ19kYXRhXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChVdGlsaXR5LmNoZWNrUGF0aElzTnVsbChwbTJfZW52LnBtX2Vycl9sb2dfcGF0aCkgJiZcclxuICAgICAgICAgICghcG0yX2Vudi5wbV9sb2dfcGF0aCB8fCBVdGlsaXR5LmNoZWNrUGF0aElzTnVsbChwbTJfZW52LnBtX2xvZ19wYXRoKSkpIHtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0ZHMuc3RkICYmIHN0ZHMuc3RkLndyaXRlICYmIHN0ZHMuc3RkLndyaXRlKGxvZ19kYXRhKTtcclxuICAgICAgICBzdGRzLmVyciAmJiBzdGRzLmVyci53cml0ZSAmJiBzdGRzLmVyci53cml0ZShsb2dfZGF0YSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgY3Nwci5zdGRvdXQub24oJ2RhdGEnLCBmdW5jdGlvbiBmb3JrT3V0RGF0YShkYXRhKSB7XHJcbiAgICAgICAgdmFyIGxvZ19kYXRhID0gbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKHBtMl9lbnYuZGlzYWJsZV9sb2dzID09PSB0cnVlKVxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAocG0yX2Vudi5sb2dfdHlwZSAmJiBwbTJfZW52LmxvZ190eXBlID09PSAnanNvbicpXHJcbiAgICAgICAgICBsb2dfZGF0YSA9IHRyYW5zZm9ybUxvZ1RvSnNvbihwbTJfZW52LCAnb3V0JywgZGF0YSlcclxuICAgICAgICBlbHNlIGlmIChwbTJfZW52LmxvZ19kYXRlX2Zvcm1hdClcclxuICAgICAgICAgIGxvZ19kYXRhID0gcHJlZml4TG9nV2l0aERhdGUocG0yX2VudiwgZGF0YSlcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBsb2dfZGF0YSA9IGRhdGEudG9TdHJpbmcoKVxyXG5cclxuICAgICAgICBHb2QuYnVzLmVtaXQoJ2xvZzpvdXQnLCB7XHJcbiAgICAgICAgICBwcm9jZXNzIDoge1xyXG4gICAgICAgICAgICBwbV9pZCAgICAgIDogY3Nwci5wbTJfZW52LnBtX2lkLFxyXG4gICAgICAgICAgICBuYW1lICAgICAgIDogY3Nwci5wbTJfZW52Lm5hbWUsXHJcbiAgICAgICAgICAgIHJldiAgICAgICAgOiAoY3Nwci5wbTJfZW52LnZlcnNpb25pbmcgJiYgY3Nwci5wbTJfZW52LnZlcnNpb25pbmcucmV2aXNpb24pID8gY3Nwci5wbTJfZW52LnZlcnNpb25pbmcucmV2aXNpb24gOiBudWxsLFxyXG4gICAgICAgICAgICBuYW1lc3BhY2UgIDogY3Nwci5wbTJfZW52Lm5hbWVzcGFjZVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGF0ICA6IFV0aWxpdHkuZ2V0RGF0ZSgpLFxyXG4gICAgICAgICAgZGF0YSA6IGxvZ19kYXRhXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChVdGlsaXR5LmNoZWNrUGF0aElzTnVsbChwbTJfZW52LnBtX291dF9sb2dfcGF0aCkgJiZcclxuICAgICAgICAgICghcG0yX2Vudi5wbV9sb2dfcGF0aCB8fCBVdGlsaXR5LmNoZWNrUGF0aElzTnVsbChwbTJfZW52LnBtX2xvZ19wYXRoKSkpXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIHN0ZHMuc3RkICYmIHN0ZHMuc3RkLndyaXRlICYmIHN0ZHMuc3RkLndyaXRlKGxvZ19kYXRhKTtcclxuICAgICAgICBzdGRzLm91dCAmJiBzdGRzLm91dC53cml0ZSAmJiBzdGRzLm91dC53cml0ZShsb2dfZGF0YSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEJyb2FkY2FzdCBtZXNzYWdlIHRvIEdvZFxyXG4gICAgICAgKi9cclxuICAgICAgY3Nwci5vbignbWVzc2FnZScsIGZ1bmN0aW9uIGZvcmtNZXNzYWdlKG1zZykge1xyXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICAgKiBJZiB5b3UgZWRpdCB0aGlzIGZ1bmN0aW9uXHJcbiAgICAgICAgICogRG8gdGhlIHNhbWUgaW4gQ2x1c3Rlck1vZGUuanMgIVxyXG4gICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcbiAgICAgICAgaWYgKG1zZy5kYXRhICYmIG1zZy50eXBlKSB7XHJcbiAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gR29kLmJ1cy5lbWl0KG1zZy50eXBlID8gbXNnLnR5cGUgOiAncHJvY2Vzczptc2cnLCB7XHJcbiAgICAgICAgICAgICAgYXQgICAgICA6IFV0aWxpdHkuZ2V0RGF0ZSgpLFxyXG4gICAgICAgICAgICAgIGRhdGEgICAgOiBtc2cuZGF0YSxcclxuICAgICAgICAgICAgICBwcm9jZXNzIDoge1xyXG4gICAgICAgICAgICAgICAgcG1faWQgICAgICA6IGNzcHIucG0yX2Vudi5wbV9pZCxcclxuICAgICAgICAgICAgICAgIG5hbWUgICAgICAgOiBjc3ByLnBtMl9lbnYubmFtZSxcclxuICAgICAgICAgICAgICAgIHZlcnNpb25pbmcgOiBjc3ByLnBtMl9lbnYudmVyc2lvbmluZyxcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZSAgOiBjc3ByLnBtMl9lbnYubmFtZXNwYWNlXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICBpZiAodHlwZW9mIG1zZyA9PSAnb2JqZWN0JyAmJiAnbm9kZV92ZXJzaW9uJyBpbiBtc2cpIHtcclxuICAgICAgICAgICAgY3Nwci5wbTJfZW52Lm5vZGVfdmVyc2lvbiA9IG1zZy5ub2RlX3ZlcnNpb247XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG1zZyA9PSAnb2JqZWN0JyAmJiAnY3Jvbl9yZXN0YXJ0JyBpbiBtc2cpIHtcclxuICAgICAgICAgICAgLy8gY3JvbiBvblRpY2sgaXMgaW52b2tlZCBpbiB0aGUgcHJvY2Vzc1xyXG4gICAgICAgICAgICByZXR1cm4gR29kLnJlc3RhcnRQcm9jZXNzSWQoe1xyXG4gICAgICAgICAgICAgIGlkIDogY3Nwci5wbTJfZW52LnBtX2lkXHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBcHBsaWNhdGlvbiAlcyBoYXMgYmVlbiByZXN0YXJ0ZWQgdmlhIENST04nLCBjc3ByLnBtMl9lbnYubmFtZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiBHb2QuYnVzLmVtaXQoJ3Byb2Nlc3M6bXNnJywge1xyXG4gICAgICAgICAgICBhdCAgICAgIDogVXRpbGl0eS5nZXREYXRlKCksXHJcbiAgICAgICAgICAgIHJhdyAgICAgOiBtc2csXHJcbiAgICAgICAgICAgIHByb2Nlc3MgOiAge1xyXG4gICAgICAgICAgICAgIHBtX2lkICAgICAgOiBjc3ByLnBtMl9lbnYucG1faWQsXHJcbiAgICAgICAgICAgICAgbmFtZSAgICAgICA6IGNzcHIucG0yX2Vudi5uYW1lLFxyXG4gICAgICAgICAgICAgIG5hbWVzcGFjZSAgOiBjc3ByLnBtMl9lbnYubmFtZXNwYWNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHZhciBwaWQgPSBjc3ByLnBpZFxyXG4gICAgICAgIGlmICh0eXBlb2YocGlkKSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHBpZEZpbGUsIHBpZC50b1N0cmluZygpKTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY3Nwci5vbmNlKCdleGl0JywgZnVuY3Rpb24gZm9ya0Nsb3NlKHN0YXR1cykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBmb3IodmFyIGsgaW4gc3Rkcyl7XHJcbiAgICAgICAgICAgIGlmIChzdGRzW2tdICYmIHN0ZHNba10uZGVzdHJveSkgc3Rkc1trXS5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHN0ZHNba10gJiYgc3Rkc1trXS5lbmQpIHN0ZHNba10uZW5kKCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHN0ZHNba10gJiYgc3Rkc1trXS5jbG9zZSkgc3Rkc1trXS5jbG9zZSgpO1xyXG4gICAgICAgICAgICBzdGRzW2tdID0gc3Rkc1trXS5fZmlsZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoKGUpIHsgR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoZSk7fVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGNzcHIuX3JlbG9hZExvZ3MgPSBmdW5jdGlvbihjYikge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBmb3IgKHZhciBrIGluIHN0ZHMpe1xyXG4gICAgICAgICAgICBpZiAoc3Rkc1trXSAmJiBzdGRzW2tdLmRlc3Ryb3kpIHN0ZHNba10uZGVzdHJveSgpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChzdGRzW2tdICYmIHN0ZHNba10uZW5kKSBzdGRzW2tdLmVuZCgpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChzdGRzW2tdICYmIHN0ZHNba10uY2xvc2UpIHN0ZHNba10uY2xvc2UoKTtcclxuICAgICAgICAgICAgc3Rkc1trXSA9IHN0ZHNba10uX2ZpbGU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaChlKSB7IEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKGUpO31cclxuICAgICAgICAvL2NzcHIucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XHJcbiAgICAgICAgVXRpbGl0eS5zdGFydExvZ2dpbmcoc3RkcywgY2IpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgY3Nwci51bnJlZigpO1xyXG5cclxuICAgICAgcmV0dXJuIGNiKG51bGwsIGNzcHIpO1xyXG4gICAgfSk7XHJcblxyXG4gIH07XHJcbn07XHJcbiJdfQ==