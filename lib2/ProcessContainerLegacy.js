"use strict";

var _path = _interopRequireDefault(require("path"));

var _constants = _interopRequireDefault(require("../constants"));

var _Utility = _interopRequireDefault(require("./Utility"));

var _ProcessUtils = _interopRequireDefault(require("./ProcessUtils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// Load all env-vars from master.
var pm2_env = JSON.parse(process.env.pm2_env);

for (var k in pm2_env) {
  process.env[k] = pm2_env[k];
} // Rename process


process.title = process.env.PROCESS_TITLE || 'node ' + pm2_env.pm_exec_path;
delete process.env.pm2_env;
/**
 * Main entrance to wrap the desired code
 */

(function ProcessContainer() {
  var fs = require('fs');

  _ProcessUtils["default"].injectModules();

  var stdFile = pm2_env.pm_log_path;
  var outFile = pm2_env.pm_out_log_path;
  var errFile = pm2_env.pm_err_log_path;
  var pidFile = pm2_env.pm_pid_path;
  var script = pm2_env.pm_exec_path;
  var original_send = process.send;

  if (typeof process.env.source_map_support != 'undefined' && process.env.source_map_support !== 'false') {
    require('source-map-support').install();
  }

  process.send = function () {
    if (process.connected) return original_send.apply(this, arguments);
  }; //send node version


  if (process.versions && process.versions.node) {
    process.send({
      'node_version': process.versions.node
    });
  }

  if (_constants["default"].MODIFY_REQUIRE) require.main.filename = pm2_env.pm_exec_path; // Resets global paths for require()

  require('module')._initPaths();

  try {
    fs.writeFileSync(pidFile, process.pid.toString());
  } catch (e) {
    console.error(e.stack || e);
  } // Add args to process if args specified on start


  if (process.env.args != null) process.argv = process.argv.concat(pm2_env.args); // stdio, including: out, err and entire (both out and err if necessary).

  var stds = {
    out: outFile,
    err: errFile
  };
  stdFile && (stds.std = stdFile); // uid/gid management

  if (pm2_env.uid || pm2_env.gid) {
    try {
      if (pm2_env.uid) process.setuid(pm2_env.uid);
      if (process.env.gid) process.setgid(pm2_env.gid);
    } catch (e) {
      setTimeout(function () {
        console.error('%s on call %s', e.message, e.syscall);
        console.error('%s is not accessible', pm2_env.uid);
        return process.exit(1);
      }, 100);
    }
  }

  exec(script, stds);
})();
/**
 * Description
 * @method exec
 * @param {} script
 * @param {} stds
 * @return
 */


function exec(script, stds) {
  if (_path["default"].extname(script) == '.coffee') {
    try {
      require('coffee-script/register');
    } catch (e) {
      console.error('Failed to load CoffeeScript interpreter:', e.message || e);
    }
  }

  if (_path["default"].extname(script) == '.ls') {
    try {
      require('livescript');
    } catch (e) {
      console.error('Failed to load LiveScript interpreter:', e.message || e);
    }
  }

  if (_path["default"].extname(script) == '.ts' || _path["default"].extname(script) == '.tsx') {
    try {
      require('ts-node/register');
    } catch (e) {
      console.error('Failed to load Typescript interpreter:', e.message || e);
    }
  }

  process.on('message', function (msg) {
    if (msg.type === 'log:reload') {
      for (var k in stds) {
        if (_typeof(stds[k]) == 'object' && !isNaN(stds[k].fd)) {
          if (stds[k].destroy) stds[k].destroy();else if (stds[k].end) stds[k].end();else if (stds[k].close) stds[k].close();
          stds[k] = stds[k]._file;
        }
      }

      _Utility["default"].startLogging(stds, function (err) {
        if (err) return console.error('Failed to reload logs:', err.stack);
        console.log('Reloading log...');
      });
    }
  });
  var dayjs = null;
  if (pm2_env.log_date_format) dayjs = require('dayjs');

  _Utility["default"].startLogging(stds, function (err) {
    if (err) {
      process.send({
        type: 'process:exception',
        data: {
          message: err.message,
          syscall: 'ProcessContainer.startLogging'
        }
      });
      throw err;
      return;
    }

    process.stderr.write = function (write) {
      return function (string, cb) {
        var log_data = null; // Disable logs if specified

        if (pm2_env.disable_logs === true) {
          return cb ? cb() : false;
        }

        if (pm2_env.log_type && pm2_env.log_type === 'json') {
          log_data = JSON.stringify({
            message: string.toString(),
            timestamp: pm2_env.log_date_format && dayjs ? dayjs().format(pm2_env.log_date_format) : new Date().toISOString(),
            type: 'err',
            process_id: pm2_env.pm_id,
            app_name: pm2_env.name
          }) + '\n';
        } else if (pm2_env.log_date_format && dayjs) log_data = "".concat(dayjs().format(pm2_env.log_date_format), ": ").concat(string.toString());else log_data = string.toString();

        process.send({
          type: 'log:err',
          topic: 'log:err',
          data: log_data
        });
        if (_Utility["default"].checkPathIsNull(pm2_env.pm_err_log_path) && (!pm2_env.pm_log_path || _Utility["default"].checkPathIsNull(pm2_env.pm_log_path))) return cb ? cb() : false; // TODO: please check this

        var encoding = "";
        stds.std && stds.std.write && stds.std.write(log_data, encoding);
        stds.err && stds.err.write && stds.err.write(log_data, encoding, cb);
      };
    }(process.stderr.write);

    process.stdout.write = function (write) {
      return function (string, cb) {
        var log_data = null; // Disable logs if specified

        if (pm2_env.disable_logs === true) {
          return cb ? cb() : false;
        }

        if (pm2_env.log_type && pm2_env.log_type === 'json') {
          log_data = JSON.stringify({
            message: string.toString(),
            timestamp: pm2_env.log_date_format && dayjs ? dayjs().format(pm2_env.log_date_format) : new Date().toISOString(),
            type: 'out',
            process_id: pm2_env.pm_id,
            app_name: pm2_env.name
          }) + '\n';
        } else if (pm2_env.log_date_format && dayjs) log_data = "".concat(dayjs().format(pm2_env.log_date_format), ": ").concat(string.toString());else log_data = string.toString();

        process.send({
          type: 'log:out',
          data: log_data
        });
        if (_Utility["default"].checkPathIsNull(pm2_env.pm_out_log_path) && (!pm2_env.pm_log_path || _Utility["default"].checkPathIsNull(pm2_env.pm_log_path))) return cb ? cb() : null; // TODO: please check this

        var encoding = "";
        stds.std && stds.std.write && stds.std.write(log_data, encoding);
        stds.out && stds.out.write && stds.out.write(log_data, encoding, cb);
      };
    }(process.stdout.write);

    function getUncaughtExceptionListener(listener) {
      return function uncaughtListener(err) {
        var error = err && err.stack ? err.stack : err;

        if (listener === 'unhandledRejection') {
          error = 'You have triggered an unhandledRejection, you may have forgotten to catch a Promise rejection:\n' + error;
        }

        logError(['std', 'err'], error); // Notify master that an uncaughtException has been catched

        try {
          if (err) {
            var errObj = {};
            Object.getOwnPropertyNames(err).forEach(function (key) {
              errObj[key] = err[key];
            });
          }

          process.send({
            type: 'log:err',
            topic: 'log:err',
            data: '\n' + error + '\n'
          });
          process.send({
            type: 'process:exception',
            data: errObj !== undefined ? errObj : {
              message: 'No error but ' + listener + ' was caught!'
            }
          });
        } catch (e) {
          logError(['std', 'err'], 'Channel is already closed can\'t broadcast error:\n' + e.stack);
        }

        if (!process.listeners(listener).filter(function (listener) {
          return listener !== uncaughtListener;
        }).length) {
          if (listener == 'uncaughtException') {
            process.emit('disconnect');
            process.exit(_constants["default"].CODE_UNCAUGHTEXCEPTION);
          }
        }
      };
    }

    process.on('uncaughtException', getUncaughtExceptionListener('uncaughtException'));
    process.on('unhandledRejection', getUncaughtExceptionListener('unhandledRejection')); // Change dir to fix process.cwd

    process.chdir(pm2_env.pm_cwd || process.env.PWD || _path["default"].dirname(script));

    require('module')._load(script, null, true);

    function logError(types, error) {
      try {
        types.forEach(function (type) {
          stds[type] && typeof stds[type].write == 'function' && stds[type].write(error + '\n');
        });
      } catch (e) {}
    }
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Qcm9jZXNzQ29udGFpbmVyTGVnYWN5LnRzIl0sIm5hbWVzIjpbInBtMl9lbnYiLCJKU09OIiwicGFyc2UiLCJwcm9jZXNzIiwiZW52IiwiayIsInRpdGxlIiwiUFJPQ0VTU19USVRMRSIsInBtX2V4ZWNfcGF0aCIsIlByb2Nlc3NDb250YWluZXIiLCJmcyIsInJlcXVpcmUiLCJQcm9jZXNzVXRpbHMiLCJpbmplY3RNb2R1bGVzIiwic3RkRmlsZSIsInBtX2xvZ19wYXRoIiwib3V0RmlsZSIsInBtX291dF9sb2dfcGF0aCIsImVyckZpbGUiLCJwbV9lcnJfbG9nX3BhdGgiLCJwaWRGaWxlIiwicG1fcGlkX3BhdGgiLCJzY3JpcHQiLCJvcmlnaW5hbF9zZW5kIiwic2VuZCIsInNvdXJjZV9tYXBfc3VwcG9ydCIsImluc3RhbGwiLCJjb25uZWN0ZWQiLCJhcHBseSIsImFyZ3VtZW50cyIsInZlcnNpb25zIiwibm9kZSIsImNzdCIsIk1PRElGWV9SRVFVSVJFIiwibWFpbiIsImZpbGVuYW1lIiwiX2luaXRQYXRocyIsIndyaXRlRmlsZVN5bmMiLCJwaWQiLCJ0b1N0cmluZyIsImUiLCJjb25zb2xlIiwiZXJyb3IiLCJzdGFjayIsImFyZ3MiLCJhcmd2IiwiY29uY2F0Iiwic3RkcyIsIm91dCIsImVyciIsInN0ZCIsInVpZCIsImdpZCIsInNldHVpZCIsInNldGdpZCIsInNldFRpbWVvdXQiLCJtZXNzYWdlIiwic3lzY2FsbCIsImV4aXQiLCJleGVjIiwicCIsImV4dG5hbWUiLCJvbiIsIm1zZyIsInR5cGUiLCJpc05hTiIsImZkIiwiZGVzdHJveSIsImVuZCIsImNsb3NlIiwiX2ZpbGUiLCJVdGlsaXR5Iiwic3RhcnRMb2dnaW5nIiwibG9nIiwiZGF5anMiLCJsb2dfZGF0ZV9mb3JtYXQiLCJkYXRhIiwic3RkZXJyIiwid3JpdGUiLCJzdHJpbmciLCJjYiIsImxvZ19kYXRhIiwiZGlzYWJsZV9sb2dzIiwibG9nX3R5cGUiLCJzdHJpbmdpZnkiLCJ0aW1lc3RhbXAiLCJmb3JtYXQiLCJEYXRlIiwidG9JU09TdHJpbmciLCJwcm9jZXNzX2lkIiwicG1faWQiLCJhcHBfbmFtZSIsIm5hbWUiLCJ0b3BpYyIsImNoZWNrUGF0aElzTnVsbCIsImVuY29kaW5nIiwic3Rkb3V0IiwiZ2V0VW5jYXVnaHRFeGNlcHRpb25MaXN0ZW5lciIsImxpc3RlbmVyIiwidW5jYXVnaHRMaXN0ZW5lciIsImxvZ0Vycm9yIiwiZXJyT2JqIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlOYW1lcyIsImZvckVhY2giLCJrZXkiLCJ1bmRlZmluZWQiLCJsaXN0ZW5lcnMiLCJmaWx0ZXIiLCJsZW5ndGgiLCJlbWl0IiwiQ09ERV9VTkNBVUdIVEVYQ0VQVElPTiIsImNoZGlyIiwicG1fY3dkIiwiUFdEIiwiZGlybmFtZSIsIl9sb2FkIiwidHlwZXMiXSwibWFwcGluZ3MiOiI7O0FBV0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVBO0FBQ0EsSUFBSUEsT0FBTyxHQUFHQyxJQUFJLENBQUNDLEtBQUwsQ0FBV0MsT0FBTyxDQUFDQyxHQUFSLENBQVlKLE9BQXZCLENBQWQ7O0FBQ0EsS0FBSyxJQUFJSyxDQUFULElBQWNMLE9BQWQsRUFBdUI7QUFDckJHLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxDQUFaLElBQWlCTCxPQUFPLENBQUNLLENBQUQsQ0FBeEI7QUFDRCxDLENBRUQ7OztBQUNBRixPQUFPLENBQUNHLEtBQVIsR0FBZ0JILE9BQU8sQ0FBQ0MsR0FBUixDQUFZRyxhQUFaLElBQTZCLFVBQVVQLE9BQU8sQ0FBQ1EsWUFBL0Q7QUFFQSxPQUFPTCxPQUFPLENBQUNDLEdBQVIsQ0FBWUosT0FBbkI7QUFFQTs7OztBQUdBLENBQUMsU0FBU1MsZ0JBQVQsR0FBNEI7QUFDM0IsTUFBSUMsRUFBRSxHQUFHQyxPQUFPLENBQUMsSUFBRCxDQUFoQjs7QUFFQUMsMkJBQWFDLGFBQWI7O0FBRUEsTUFBSUMsT0FBTyxHQUFHZCxPQUFPLENBQUNlLFdBQXRCO0FBQ0EsTUFBSUMsT0FB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RixHQXpKRDtBQTBKRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcclxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXHJcbiAqXHJcbiAqIFRoaXMgZmlsZSB3cmFwIHRhcmdldCBhcHBsaWNhdGlvblxyXG4gKiAtIHJlZGlyZWN0IHN0ZGluLCBzdGRlcnIgdG8gYnVzICsgbG9nIGZpbGVzXHJcbiAqIC0gcmVuYW1lIHByb2Nlc3NcclxuICogLSBwaWRcclxuICovXHJcblxyXG5pbXBvcnQgcCBmcm9tICdwYXRoJztcclxuaW1wb3J0IGNzdCBmcm9tICcuLi9jb25zdGFudHMnO1xyXG5pbXBvcnQgVXRpbGl0eSBmcm9tICcuL1V0aWxpdHknO1xyXG5pbXBvcnQgUHJvY2Vzc1V0aWxzIGZyb20gJy4vUHJvY2Vzc1V0aWxzJztcclxuXHJcbi8vIExvYWQgYWxsIGVudi12YXJzIGZyb20gbWFzdGVyLlxyXG52YXIgcG0yX2VudiA9IEpTT04ucGFyc2UocHJvY2Vzcy5lbnYucG0yX2Vudik7XHJcbmZvciAodmFyIGsgaW4gcG0yX2Vudikge1xyXG4gIHByb2Nlc3MuZW52W2tdID0gcG0yX2VudltrXTtcclxufVxyXG5cclxuLy8gUmVuYW1lIHByb2Nlc3NcclxucHJvY2Vzcy50aXRsZSA9IHByb2Nlc3MuZW52LlBST0NFU1NfVElUTEUgfHwgJ25vZGUgJyArIHBtMl9lbnYucG1fZXhlY19wYXRoO1xyXG5cclxuZGVsZXRlIHByb2Nlc3MuZW52LnBtMl9lbnY7XHJcblxyXG4vKipcclxuICogTWFpbiBlbnRyYW5jZSB0byB3cmFwIHRoZSBkZXNpcmVkIGNvZGVcclxuICovXHJcbihmdW5jdGlvbiBQcm9jZXNzQ29udGFpbmVyKCkge1xyXG4gIHZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcblxyXG4gIFByb2Nlc3NVdGlscy5pbmplY3RNb2R1bGVzKClcclxuXHJcbiAgdmFyIHN0ZEZpbGUgPSBwbTJfZW52LnBtX2xvZ19wYXRoO1xyXG4gIHZhciBvdXRGaWxlID0gcG0yX2Vudi5wbV9vdXRfbG9nX3BhdGg7XHJcbiAgdmFyIGVyckZpbGUgPSBwbTJfZW52LnBtX2Vycl9sb2dfcGF0aDtcclxuICB2YXIgcGlkRmlsZSA9IHBtMl9lbnYucG1fcGlkX3BhdGg7XHJcbiAgdmFyIHNjcmlwdCA9IHBtMl9lbnYucG1fZXhlY19wYXRoO1xyXG5cclxuICB2YXIgb3JpZ2luYWxfc2VuZCA9IHByb2Nlc3Muc2VuZDtcclxuXHJcbiAgaWYgKHR5cGVvZiAocHJvY2Vzcy5lbnYuc291cmNlX21hcF9zdXBwb3J0KSAhPSAndW5kZWZpbmVkJyAmJlxyXG4gICAgcHJvY2Vzcy5lbnYuc291cmNlX21hcF9zdXBwb3J0ICE9PSAnZmFsc2UnKSB7XHJcbiAgICByZXF1aXJlKCdzb3VyY2UtbWFwLXN1cHBvcnQnKS5pbnN0YWxsKCk7XHJcbiAgfVxyXG5cclxuICBwcm9jZXNzLnNlbmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAocHJvY2Vzcy5jb25uZWN0ZWQpXHJcbiAgICAgIHJldHVybiBvcmlnaW5hbF9zZW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyBhcyBhbnkpO1xyXG4gIH07XHJcblxyXG4gIC8vc2VuZCBub2RlIHZlcnNpb25cclxuICBpZiAocHJvY2Vzcy52ZXJzaW9ucyAmJiBwcm9jZXNzLnZlcnNpb25zLm5vZGUpIHtcclxuICAgIHByb2Nlc3Muc2VuZCh7XHJcbiAgICAgICdub2RlX3ZlcnNpb24nOiBwcm9jZXNzLnZlcnNpb25zLm5vZGVcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgaWYgKGNzdC5NT0RJRllfUkVRVUlSRSlcclxuICAgIHJlcXVpcmUubWFpbi5maWxlbmFtZSA9IHBtMl9lbnYucG1fZXhlY19wYXRoO1xyXG5cclxuICAvLyBSZXNldHMgZ2xvYmFsIHBhdGhzIGZvciByZXF1aXJlKClcclxuICByZXF1aXJlKCdtb2R1bGUnKS5faW5pdFBhdGhzKCk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBmcy53cml0ZUZpbGVTeW5jKHBpZEZpbGUsIHByb2Nlc3MucGlkLnRvU3RyaW5nKCkpO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcclxuICB9XHJcblxyXG4gIC8vIEFkZCBhcmdzIHRvIHByb2Nlc3MgaWYgYXJncyBzcGVjaWZpZWQgb24gc3RhcnRcclxuICBpZiAocHJvY2Vzcy5lbnYuYXJncyAhPSBudWxsKVxyXG4gICAgcHJvY2Vzcy5hcmd2ID0gcHJvY2Vzcy5hcmd2LmNvbmNhdChwbTJfZW52LmFyZ3MpO1xyXG5cclxuICAvLyBzdGRpbywgaW5jbHVkaW5nOiBvdXQsIGVyciBhbmQgZW50aXJlIChib3RoIG91dCBhbmQgZXJyIGlmIG5lY2Vzc2FyeSkuXHJcbiAgdmFyIHN0ZHM6IGFueSA9IHtcclxuICAgIG91dDogb3V0RmlsZSxcclxuICAgIGVycjogZXJyRmlsZVxyXG4gIH07XHJcbiAgc3RkRmlsZSAmJiAoc3Rkcy5zdGQgPSBzdGRGaWxlKTtcclxuXHJcbiAgLy8gdWlkL2dpZCBtYW5hZ2VtZW50XHJcbiAgaWYgKHBtMl9lbnYudWlkIHx8IHBtMl9lbnYuZ2lkKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBpZiAocG0yX2Vudi51aWQpXHJcbiAgICAgICAgcHJvY2Vzcy5zZXR1aWQocG0yX2Vudi51aWQpO1xyXG4gICAgICBpZiAocHJvY2Vzcy5lbnYuZ2lkKVxyXG4gICAgICAgIHByb2Nlc3Muc2V0Z2lkKHBtMl9lbnYuZ2lkKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgb24gY2FsbCAlcycsIGUubWVzc2FnZSwgZS5zeXNjYWxsKTtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCclcyBpcyBub3QgYWNjZXNzaWJsZScsIHBtMl9lbnYudWlkKTtcclxuICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDEpO1xyXG4gICAgICB9LCAxMDApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZXhlYyhzY3JpcHQsIHN0ZHMpO1xyXG59KSgpO1xyXG5cclxuLyoqXHJcbiAqIERlc2NyaXB0aW9uXHJcbiAqIEBtZXRob2QgZXhlY1xyXG4gKiBAcGFyYW0ge30gc2NyaXB0XHJcbiAqIEBwYXJhbSB7fSBzdGRzXHJcbiAqIEByZXR1cm5cclxuICovXHJcbmZ1bmN0aW9uIGV4ZWMoc2NyaXB0LCBzdGRzKSB7XHJcbiAgaWYgKHAuZXh0bmFtZShzY3JpcHQpID09ICcuY29mZmVlJykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgcmVxdWlyZSgnY29mZmVlLXNjcmlwdC9yZWdpc3RlcicpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gbG9hZCBDb2ZmZWVTY3JpcHQgaW50ZXJwcmV0ZXI6JywgZS5tZXNzYWdlIHx8IGUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKHAuZXh0bmFtZShzY3JpcHQpID09ICcubHMnKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICByZXF1aXJlKCdsaXZlc2NyaXB0Jyk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIExpdmVTY3JpcHQgaW50ZXJwcmV0ZXI6JywgZS5tZXNzYWdlIHx8IGUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKHAuZXh0bmFtZShzY3JpcHQpID09ICcudHMnIHx8IHAuZXh0bmFtZShzY3JpcHQpID09ICcudHN4Jykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgcmVxdWlyZSgndHMtbm9kZS9yZWdpc3RlcicpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gbG9hZCBUeXBlc2NyaXB0IGludGVycHJldGVyOicsIGUubWVzc2FnZSB8fCBlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByb2Nlc3Mub24oJ21lc3NhZ2UnLCBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICBpZiAobXNnLnR5cGUgPT09ICdsb2c6cmVsb2FkJykge1xyXG4gICAgICBmb3IgKHZhciBrIGluIHN0ZHMpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHN0ZHNba10gPT0gJ29iamVjdCcgJiYgIWlzTmFOKHN0ZHNba10uZmQpKSB7XHJcbiAgICAgICAgICBpZiAoc3Rkc1trXS5kZXN0cm95KSBzdGRzW2tdLmRlc3Ryb3koKTtcclxuICAgICAgICAgIGVsc2UgaWYgKHN0ZHNba10uZW5kKSBzdGRzW2tdLmVuZCgpO1xyXG4gICAgICAgICAgZWxzZSBpZiAoc3Rkc1trXS5jbG9zZSkgc3Rkc1trXS5jbG9zZSgpO1xyXG4gICAgICAgICAgc3Rkc1trXSA9IHN0ZHNba10uX2ZpbGU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIFV0aWxpdHkuc3RhcnRMb2dnaW5nKHN0ZHMsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICBpZiAoZXJyKVxyXG4gICAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWxvYWQgbG9nczonLCBlcnIuc3RhY2spO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdSZWxvYWRpbmcgbG9nLi4uJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICB2YXIgZGF5anMgPSBudWxsO1xyXG5cclxuICBpZiAocG0yX2Vudi5sb2dfZGF0ZV9mb3JtYXQpXHJcbiAgICBkYXlqcyA9IHJlcXVpcmUoJ2RheWpzJyk7XHJcblxyXG4gIFV0aWxpdHkuc3RhcnRMb2dnaW5nKHN0ZHMsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgIGlmIChlcnIpIHtcclxuICAgICAgcHJvY2Vzcy5zZW5kKHtcclxuICAgICAgICB0eXBlOiAncHJvY2VzczpleGNlcHRpb24nLFxyXG4gICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlLFxyXG4gICAgICAgICAgc3lzY2FsbDogJ1Byb2Nlc3NDb250YWluZXIuc3RhcnRMb2dnaW5nJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIHRocm93IGVycjtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3Muc3RkZXJyLndyaXRlID0gKGZ1bmN0aW9uICh3cml0ZSkge1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHN0cmluZywgY2IpIHtcclxuICAgICAgICB2YXIgbG9nX2RhdGEgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBEaXNhYmxlIGxvZ3MgaWYgc3BlY2lmaWVkXHJcbiAgICAgICAgaWYgKHBtMl9lbnYuZGlzYWJsZV9sb2dzID09PSB0cnVlKSB7XHJcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYigpIDogZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocG0yX2Vudi5sb2dfdHlwZSAmJiBwbTJfZW52LmxvZ190eXBlID09PSAnanNvbicpIHtcclxuICAgICAgICAgIGxvZ19kYXRhID0gSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBzdHJpbmcudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgdGltZXN0YW1wOiBwbTJfZW52LmxvZ19kYXRlX2Zvcm1hdCAmJiBkYXlqcyA/XHJcbiAgICAgICAgICAgICAgZGF5anMoKS5mb3JtYXQocG0yX2Vudi5sb2dfZGF0ZV9mb3JtYXQpIDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICB0eXBlOiAnZXJyJyxcclxuICAgICAgICAgICAgcHJvY2Vzc19pZDogcG0yX2Vudi5wbV9pZCxcclxuICAgICAgICAgICAgYXBwX25hbWU6IHBtMl9lbnYubmFtZVxyXG4gICAgICAgICAgfSkgKyAnXFxuJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAocG0yX2Vudi5sb2dfZGF0ZV9mb3JtYXQgJiYgZGF5anMpXHJcbiAgICAgICAgICBsb2dfZGF0YSA9IGAke2RheWpzKCkuZm9ybWF0KHBtMl9lbnYubG9nX2RhdGVfZm9ybWF0KX06ICR7c3RyaW5nLnRvU3RyaW5nKCl9YDtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBsb2dfZGF0YSA9IHN0cmluZy50b1N0cmluZygpO1xyXG5cclxuICAgICAgICBwcm9jZXNzLnNlbmQoe1xyXG4gICAgICAgICAgdHlwZTogJ2xvZzplcnInLFxyXG4gICAgICAgICAgdG9waWM6ICdsb2c6ZXJyJyxcclxuICAgICAgICAgIGRhdGE6IGxvZ19kYXRhXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChVdGlsaXR5LmNoZWNrUGF0aElzTnVsbChwbTJfZW52LnBtX2Vycl9sb2dfcGF0aCkgJiZcclxuICAgICAgICAgICghcG0yX2Vudi5wbV9sb2dfcGF0aCB8fCBVdGlsaXR5LmNoZWNrUGF0aElzTnVsbChwbTJfZW52LnBtX2xvZ19wYXRoKSkpXHJcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYigpIDogZmFsc2U7XHJcblxyXG4gICAgICAgICAgLy8gVE9ETzogcGxlYXNlIGNoZWNrIHRoaXNcclxuICAgICAgICAgIGNvbnN0IGVuY29kaW5nID0gXCJcIjtcclxuICAgICAgICBzdGRzLnN0ZCAmJiBzdGRzLnN0ZC53cml0ZSAmJiBzdGRzLnN0ZC53cml0ZShsb2dfZGF0YSwgZW5jb2RpbmcpO1xyXG4gICAgICAgIHN0ZHMuZXJyICYmIHN0ZHMuZXJyLndyaXRlICYmIHN0ZHMuZXJyLndyaXRlKGxvZ19kYXRhLCBlbmNvZGluZywgY2IpO1xyXG4gICAgICB9O1xyXG4gICAgfSkocHJvY2Vzcy5zdGRlcnIud3JpdGUpO1xyXG5cclxuICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlID0gKGZ1bmN0aW9uICh3cml0ZSkge1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHN0cmluZywgY2IpIHtcclxuICAgICAgICB2YXIgbG9nX2RhdGEgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBEaXNhYmxlIGxvZ3MgaWYgc3BlY2lmaWVkXHJcbiAgICAgICAgaWYgKHBtMl9lbnYuZGlzYWJsZV9sb2dzID09PSB0cnVlKSB7XHJcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYigpIDogZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocG0yX2Vudi5sb2dfdHlwZSAmJiBwbTJfZW52LmxvZ190eXBlID09PSAnanNvbicpIHtcclxuICAgICAgICAgIGxvZ19kYXRhID0gSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBzdHJpbmcudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgdGltZXN0YW1wOiBwbTJfZW52LmxvZ19kYXRlX2Zvcm1hdCAmJiBkYXlqcyA/XHJcbiAgICAgICAgICAgICAgZGF5anMoKS5mb3JtYXQocG0yX2Vudi5sb2dfZGF0ZV9mb3JtYXQpIDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICB0eXBlOiAnb3V0JyxcclxuICAgICAgICAgICAgcHJvY2Vzc19pZDogcG0yX2Vudi5wbV9pZCxcclxuICAgICAgICAgICAgYXBwX25hbWU6IHBtMl9lbnYubmFtZVxyXG4gICAgICAgICAgfSkgKyAnXFxuJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAocG0yX2Vudi5sb2dfZGF0ZV9mb3JtYXQgJiYgZGF5anMpXHJcbiAgICAgICAgICBsb2dfZGF0YSA9IGAke2RheWpzKCkuZm9ybWF0KHBtMl9lbnYubG9nX2RhdGVfZm9ybWF0KX06ICR7c3RyaW5nLnRvU3RyaW5nKCl9YDtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBsb2dfZGF0YSA9IHN0cmluZy50b1N0cmluZygpO1xyXG5cclxuICAgICAgICBwcm9jZXNzLnNlbmQoe1xyXG4gICAgICAgICAgdHlwZTogJ2xvZzpvdXQnLFxyXG4gICAgICAgICAgZGF0YTogbG9nX2RhdGFcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKFV0aWxpdHkuY2hlY2tQYXRoSXNOdWxsKHBtMl9lbnYucG1fb3V0X2xvZ19wYXRoKSAmJlxyXG4gICAgICAgICAgKCFwbTJfZW52LnBtX2xvZ19wYXRoIHx8IFV0aWxpdHkuY2hlY2tQYXRoSXNOdWxsKHBtMl9lbnYucG1fbG9nX3BhdGgpKSlcclxuICAgICAgICAgIHJldHVybiBjYiA/IGNiKCkgOiBudWxsO1xyXG5cclxuICAgICAgICAgIC8vIFRPRE86IHBsZWFzZSBjaGVjayB0aGlzXHJcbiAgICAgICAgICBjb25zdCBlbmNvZGluZyA9IFwiXCI7XHJcbiAgICAgICAgc3Rkcy5zdGQgJiYgc3Rkcy5zdGQud3JpdGUgJiYgc3Rkcy5zdGQud3JpdGUobG9nX2RhdGEsIGVuY29kaW5nKTtcclxuICAgICAgICBzdGRzLm91dCAmJiBzdGRzLm91dC53cml0ZSAmJiBzdGRzLm91dC53cml0ZShsb2dfZGF0YSwgZW5jb2RpbmcsIGNiKTtcclxuICAgICAgfTtcclxuICAgIH0pKHByb2Nlc3Muc3Rkb3V0LndyaXRlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRVbmNhdWdodEV4Y2VwdGlvbkxpc3RlbmVyKGxpc3RlbmVyKSB7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiB1bmNhdWdodExpc3RlbmVyKGVycikge1xyXG4gICAgICAgIHZhciBlcnJvciA9IGVyciAmJiBlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnI7XHJcblxyXG4gICAgICAgIGlmIChsaXN0ZW5lciA9PT0gJ3VuaGFuZGxlZFJlamVjdGlvbicpIHtcclxuICAgICAgICAgIGVycm9yID0gJ1lvdSBoYXZlIHRyaWdnZXJlZCBhbiB1bmhhbmRsZWRSZWplY3Rpb24sIHlvdSBtYXkgaGF2ZSBmb3Jnb3R0ZW4gdG8gY2F0Y2ggYSBQcm9taXNlIHJlamVjdGlvbjpcXG4nICsgZXJyb3I7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsb2dFcnJvcihbJ3N0ZCcsICdlcnInXSwgZXJyb3IpO1xyXG5cclxuICAgICAgICAvLyBOb3RpZnkgbWFzdGVyIHRoYXQgYW4gdW5jYXVnaHRFeGNlcHRpb24gaGFzIGJlZW4gY2F0Y2hlZFxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgIHZhciBlcnJPYmogPSB7fTtcclxuXHJcbiAgICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGVycikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgZXJyT2JqW2tleV0gPSBlcnJba2V5XTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcHJvY2Vzcy5zZW5kKHtcclxuICAgICAgICAgICAgdHlwZTogJ2xvZzplcnInLFxyXG4gICAgICAgICAgICB0b3BpYzogJ2xvZzplcnInLFxyXG4gICAgICAgICAgICBkYXRhOiAnXFxuJyArIGVycm9yICsgJ1xcbidcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcHJvY2Vzcy5zZW5kKHtcclxuICAgICAgICAgICAgdHlwZTogJ3Byb2Nlc3M6ZXhjZXB0aW9uJyxcclxuICAgICAgICAgICAgZGF0YTogZXJyT2JqICE9PSB1bmRlZmluZWQgPyBlcnJPYmogOiB7IG1lc3NhZ2U6ICdObyBlcnJvciBidXQgJyArIGxpc3RlbmVyICsgJyB3YXMgY2F1Z2h0IScgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgbG9nRXJyb3IoWydzdGQnLCAnZXJyJ10sICdDaGFubmVsIGlzIGFscmVhZHkgY2xvc2VkIGNhblxcJ3QgYnJvYWRjYXN0IGVycm9yOlxcbicgKyBlLnN0YWNrKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghcHJvY2Vzcy5saXN0ZW5lcnMobGlzdGVuZXIpLmZpbHRlcihmdW5jdGlvbiAobGlzdGVuZXIpIHtcclxuICAgICAgICAgIHJldHVybiBsaXN0ZW5lciAhPT0gdW5jYXVnaHRMaXN0ZW5lcjtcclxuICAgICAgICB9KS5sZW5ndGgpIHtcclxuICAgICAgICAgIGlmIChsaXN0ZW5lciA9PSAndW5jYXVnaHRFeGNlcHRpb24nKSB7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW1pdCgnZGlzY29ubmVjdCcpO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoY3N0LkNPREVfVU5DQVVHSFRFWENFUFRJT04pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3Mub24oJ3VuY2F1Z2h0RXhjZXB0aW9uJywgZ2V0VW5jYXVnaHRFeGNlcHRpb25MaXN0ZW5lcigndW5jYXVnaHRFeGNlcHRpb24nKSk7XHJcbiAgICBwcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCBnZXRVbmNhdWdodEV4Y2VwdGlvbkxpc3RlbmVyKCd1bmhhbmRsZWRSZWplY3Rpb24nKSk7XHJcblxyXG4gICAgLy8gQ2hhbmdlIGRpciB0byBmaXggcHJvY2Vzcy5jd2RcclxuICAgIHByb2Nlc3MuY2hkaXIocG0yX2Vudi5wbV9jd2QgfHwgcHJvY2Vzcy5lbnYuUFdEIHx8IHAuZGlybmFtZShzY3JpcHQpKTtcclxuXHJcbiAgICByZXF1aXJlKCdtb2R1bGUnKS5fbG9hZChzY3JpcHQsIG51bGwsIHRydWUpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGxvZ0Vycm9yKHR5cGVzLCBlcnJvcikge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHR5cGVzLmZvckVhY2goZnVuY3Rpb24gKHR5cGUpIHtcclxuICAgICAgICAgIHN0ZHNbdHlwZV0gJiYgdHlwZW9mIHN0ZHNbdHlwZV0ud3JpdGUgPT0gJ2Z1bmN0aW9uJyAmJiBzdGRzW3R5cGVdLndyaXRlKGVycm9yICsgJ1xcbicpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGNhdGNoIChlKSB7IH1cclxuICAgIH1cclxuICB9KTtcclxufVxyXG4iXX0=