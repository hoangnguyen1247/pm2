"use strict";

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _constants = _interopRequireDefault(require("../constants"));

var _Utility = _interopRequireDefault(require("./Utility"));

var _ProcessUtils = _interopRequireDefault(require("./ProcessUtils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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

  process.send = function (message) {
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
    var pid = process.pid;
    if (typeof pid !== 'undefined') _fs["default"].writeFileSync(pidFile, process.pid.toString());
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
      if (process.env.gid) process.setgid(pm2_env.gid);
      if (pm2_env.uid) process.setuid(pm2_env.uid);
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
  if (pm2_env.log_date_format) _Utility["default"].startLogging(stds, function (err) {
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
    if (_ProcessUtils["default"].isESModule(script) === true) Promise.resolve("".concat(process.env.pm_exec_path)).then(function (s) {
      return _interopRequireWildcard(require(s));
    });else require('module')._load(script, null, true);

    function logError(types, error) {
      try {
        types.forEach(function (type) {
          stds[type] && typeof stds[type].write == 'function' && stds[type].write(error + '\n');
        });
      } catch (e) {}
    }
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Qcm9jZXNzQ29udGFpbmVyLnRzIl0sIm5hbWVzIjpbInBtMl9lbnYiLCJKU09OIiwicGFyc2UiLCJwcm9jZXNzIiwiZW52IiwiayIsInRpdGxlIiwiUFJPQ0VTU19USVRMRSIsInBtX2V4ZWNfcGF0aCIsIlByb2Nlc3NDb250YWluZXIiLCJQcm9jZXNzVXRpbHMiLCJpbmplY3RNb2R1bGVzIiwic3RkRmlsZSIsInBtX2xvZ19wYXRoIiwib3V0RmlsZSIsInBtX291dF9sb2dfcGF0aCIsImVyckZpbGUiLCJwbV9lcnJfbG9nX3BhdGgiLCJwaWRGaWxlIiwicG1fcGlkX3BhdGgiLCJzY3JpcHQiLCJvcmlnaW5hbF9zZW5kIiwic2VuZCIsInNvdXJjZV9tYXBfc3VwcG9ydCIsInJlcXVpcmUiLCJpbnN0YWxsIiwibWVzc2FnZSIsImNvbm5lY3RlZCIsImFwcGx5IiwiYXJndW1lbnRzIiwidmVyc2lvbnMiLCJub2RlIiwiY3N0IiwiTU9ESUZZX1JFUVVJUkUiLCJtYWluIiwiZmlsZW5hbWUiLCJfaW5pdFBhdGhzIiwicGlkIiwiZnMiLCJ3cml0ZUZpbGVTeW5jIiwidG9TdHJpbmciLCJlIiwiY29uc29sZSIsImVycm9yIiwic3RhY2siLCJhcmdzIiwiYXJndiIsImNvbmNhdCIsInN0ZHMiLCJvdXQiLCJlcnIiLCJzdGQiLCJ1aWQiLCJnaWQiLCJzZXRnaWQiLCJzZXR1aWQiLCJzZXRUaW1lb3V0Iiwic3lzY2FsbCIsImV4aXQiLCJleGVjIiwicCIsImV4dG5hbWUiLCJvbiIsIm1zZyIsInR5cGUiLCJpc05hTiIsImZkIiwiZGVzdHJveSIsImVuZCIsImNsb3NlIiwiX2ZpbGUiLCJVdGlsaXR5Iiwic3RhcnRMb2dnaW5nIiwibG9nIiwiZGF5anMiLCJsb2dfZGF0ZV9mb3JtYXQiLCJkYXRhIiwic3RkZXJyIiwid3JpdGUiLCJzdHJpbmciLCJjYiIsImxvZ19kYXRhIiwiZGlzYWJsZV9sb2dzIiwibG9nX3R5cGUiLCJzdHJpbmdpZnkiLCJ0aW1lc3RhbXAiLCJmb3JtYXQiLCJEYXRlIiwidG9JU09TdHJpbmciLCJwcm9jZXNzX2lkIiwicG1faWQiLCJhcHBfbmFtZSIsIm5hbWUiLCJ0b3BpYyIsImNoZWNrUGF0aElzTnVsbCIsImVuY29kaW5nIiwic3Rkb3V0IiwiZ2V0VW5jYXVnaHRFeGNlcHRpb25MaXN0ZW5lciIsImxpc3RlbmVyIiwidW5jYXVnaHRMaXN0ZW5lciIsImxvZ0Vycm9yIiwiZXJyT2JqIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlOYW1lcyIsImZvckVhY2giLCJrZXkiLCJ1bmRlZmluZWQiLCJsaXN0ZW5lcnMiLCJmaWx0ZXIiLCJsZW5ndGgiLCJlbWl0IiwiQ09ERV9VTkNBVUdIVEVYQ0VQVElPTiIsImNoZGlyIiwicG1fY3dkIiwiUFdEIiwiZGlybmFtZSIsImlzRVNNb2R1bGUiLCJfbG9hZCIsInR5cGVzIl0sIm1hcHBpbmdzIjoiOztBQVdBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7Ozs7O0FBR0E7QUFDQSxJQUFJQSxPQUFPLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFXQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUosT0FBdkIsQ0FBZDs7QUFDQSxLQUFLLElBQUlLLENBQVQsSUFBY0wsT0FBZCxFQUF1QjtBQUNyQkcsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlDLENBQVosSUFBaUJMLE9BQU8sQ0FBQ0ssQ0FBRCxDQUF4QjtBQUNELEMsQ0FFRDs7O0FBQ0FGLE9BQU8sQ0FBQ0csS0FBUixHQUFnQkgsT0FBTyxDQUFDQyxHQUFSLENBQVlHLGFBQVosSUFBNkIsVUFBVVAsT0FBTyxDQUFDUSxZQUEvRDtBQUVBLE9BQU9MLE9BQU8sQ0FBQ0MsR0FBUixDQUFZSixPQUFuQjtBQUVBOzs7O0FBR0EsQ0FBQyxTQUFTUyxnQkFBVCxHQUE0QjtBQUUzQkMsMkJBQWFDLGFBQWI7O0FBRUEsTUFBSUMsT0FBTyxHQUFHWixPQUFPLENBQUNhLFdBQXRCO0FBQ0EsTUFBSUMsT0FBTyxHQUFHZCxPQUFPLENBQUNlLGVBQXRCO0FB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V2MsS0FBWCxDQUFpQm5DLEtBQUssR0FBRyxJQUF6QixDQUF2RDtBQUNELFNBRkQ7QUFHRCxPQUpELENBSUUsT0FBT0YsQ0FBUCxFQUFVLENBQUc7QUFDaEI7QUFDRixHQTVKRDtBQTZKRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcclxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXHJcbiAqXHJcbiAqIFRoaXMgZmlsZSB3cmFwIHRhcmdldCBhcHBsaWNhdGlvblxyXG4gKiAtIHJlZGlyZWN0IHN0ZGluLCBzdGRlcnIgdG8gYnVzICsgbG9nIGZpbGVzXHJcbiAqIC0gcmVuYW1lIHByb2Nlc3NcclxuICogLSBwaWRcclxuICovXHJcblxyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgcCBmcm9tICdwYXRoJztcclxuaW1wb3J0IGNzdCBmcm9tICcuLi9jb25zdGFudHMnO1xyXG5pbXBvcnQgVXRpbGl0eSBmcm9tICcuL1V0aWxpdHknO1xyXG5pbXBvcnQgUHJvY2Vzc1V0aWxzIGZyb20gJy4vUHJvY2Vzc1V0aWxzJztcclxuaW1wb3J0IGRheWpzIGZyb20gJ2RheWpzJztcclxuXHJcbi8vIExvYWQgYWxsIGVudi12YXJzIGZyb20gbWFzdGVyLlxyXG52YXIgcG0yX2VudiA9IEpTT04ucGFyc2UocHJvY2Vzcy5lbnYucG0yX2Vudik7XHJcbmZvciAodmFyIGsgaW4gcG0yX2Vudikge1xyXG4gIHByb2Nlc3MuZW52W2tdID0gcG0yX2VudltrXTtcclxufVxyXG5cclxuLy8gUmVuYW1lIHByb2Nlc3NcclxucHJvY2Vzcy50aXRsZSA9IHByb2Nlc3MuZW52LlBST0NFU1NfVElUTEUgfHwgJ25vZGUgJyArIHBtMl9lbnYucG1fZXhlY19wYXRoO1xyXG5cclxuZGVsZXRlIHByb2Nlc3MuZW52LnBtMl9lbnY7XHJcblxyXG4vKipcclxuICogTWFpbiBlbnRyYW5jZSB0byB3cmFwIHRoZSBkZXNpcmVkIGNvZGVcclxuICovXHJcbihmdW5jdGlvbiBQcm9jZXNzQ29udGFpbmVyKCkge1xyXG5cclxuICBQcm9jZXNzVXRpbHMuaW5qZWN0TW9kdWxlcygpXHJcblxyXG4gIHZhciBzdGRGaWxlID0gcG0yX2Vudi5wbV9sb2dfcGF0aDtcclxuICB2YXIgb3V0RmlsZSA9IHBtMl9lbnYucG1fb3V0X2xvZ19wYXRoO1xyXG4gIHZhciBlcnJGaWxlID0gcG0yX2Vudi5wbV9lcnJfbG9nX3BhdGg7XHJcbiAgdmFyIHBpZEZpbGUgPSBwbTJfZW52LnBtX3BpZF9wYXRoO1xyXG4gIHZhciBzY3JpcHQgPSBwbTJfZW52LnBtX2V4ZWNfcGF0aDtcclxuXHJcbiAgdmFyIG9yaWdpbmFsX3NlbmQgPSBwcm9jZXNzLnNlbmQ7XHJcblxyXG4gIGlmICh0eXBlb2YgKHByb2Nlc3MuZW52LnNvdXJjZV9tYXBfc3VwcG9ydCkgIT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgIHByb2Nlc3MuZW52LnNvdXJjZV9tYXBfc3VwcG9ydCAhPT0gJ2ZhbHNlJykge1xyXG4gICAgcmVxdWlyZSgnc291cmNlLW1hcC1zdXBwb3J0JykuaW5zdGFsbCgpO1xyXG4gIH1cclxuXHJcbiAgcHJvY2Vzcy5zZW5kID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcclxuICAgIGlmIChwcm9jZXNzLmNvbm5lY3RlZClcclxuICAgICAgcmV0dXJuIG9yaWdpbmFsX3NlbmQuYXBwbHkodGhpcywgYXJndW1lbnRzIGFzIGFueSk7XHJcbiAgfTtcclxuXHJcbiAgLy9zZW5kIG5vZGUgdmVyc2lvblxyXG4gIGlmIChwcm9jZXNzLnZlcnNpb25zICYmIHByb2Nlc3MudmVyc2lvbnMubm9kZSkge1xyXG4gICAgcHJvY2Vzcy5zZW5kKHtcclxuICAgICAgJ25vZGVfdmVyc2lvbic6IHByb2Nlc3MudmVyc2lvbnMubm9kZVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBpZiAoY3N0Lk1PRElGWV9SRVFVSVJFKVxyXG4gICAgcmVxdWlyZS5tYWluLmZpbGVuYW1lID0gcG0yX2Vudi5wbV9leGVjX3BhdGg7XHJcblxyXG4gIC8vIFJlc2V0cyBnbG9iYWwgcGF0aHMgZm9yIHJlcXVpcmUoKVxyXG4gIHJlcXVpcmUoJ21vZHVsZScpLl9pbml0UGF0aHMoKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZFxyXG4gICAgaWYgKHR5cGVvZiAocGlkKSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMocGlkRmlsZSwgcHJvY2Vzcy5waWQudG9TdHJpbmcoKSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xyXG4gIH1cclxuXHJcbiAgLy8gQWRkIGFyZ3MgdG8gcHJvY2VzcyBpZiBhcmdzIHNwZWNpZmllZCBvbiBzdGFydFxyXG4gIGlmIChwcm9jZXNzLmVudi5hcmdzICE9IG51bGwpXHJcbiAgICBwcm9jZXNzLmFyZ3YgPSBwcm9jZXNzLmFyZ3YuY29uY2F0KHBtMl9lbnYuYXJncyk7XHJcblxyXG4gIC8vIHN0ZGlvLCBpbmNsdWRpbmc6IG91dCwgZXJyIGFuZCBlbnRpcmUgKGJvdGggb3V0IGFuZCBlcnIgaWYgbmVjZXNzYXJ5KS5cclxuICB2YXIgc3RkczogYW55ID0ge1xyXG4gICAgb3V0OiBvdXRGaWxlLFxyXG4gICAgZXJyOiBlcnJGaWxlXHJcbiAgfTtcclxuICBzdGRGaWxlICYmIChzdGRzLnN0ZCA9IHN0ZEZpbGUpO1xyXG5cclxuICAvLyB1aWQvZ2lkIG1hbmFnZW1lbnRcclxuICBpZiAocG0yX2Vudi51aWQgfHwgcG0yX2Vudi5naWQpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGlmIChwcm9jZXNzLmVudi5naWQpXHJcbiAgICAgICAgcHJvY2Vzcy5zZXRnaWQocG0yX2Vudi5naWQpO1xyXG4gICAgICBpZiAocG0yX2Vudi51aWQpXHJcbiAgICAgICAgcHJvY2Vzcy5zZXR1aWQocG0yX2Vudi51aWQpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCclcyBvbiBjYWxsICVzJywgZS5tZXNzYWdlLCBlLnN5c2NhbGwpO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzIGlzIG5vdCBhY2Nlc3NpYmxlJywgcG0yX2Vudi51aWQpO1xyXG4gICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMSk7XHJcbiAgICAgIH0sIDEwMCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBleGVjKHNjcmlwdCwgc3Rkcyk7XHJcbn0pKCk7XHJcblxyXG4vKipcclxuICogRGVzY3JpcHRpb25cclxuICogQG1ldGhvZCBleGVjXHJcbiAqIEBwYXJhbSB7fSBzY3JpcHRcclxuICogQHBhcmFtIHt9IHN0ZHNcclxuICogQHJldHVyblxyXG4gKi9cclxuZnVuY3Rpb24gZXhlYyhzY3JpcHQsIHN0ZHMpIHtcclxuICBpZiAocC5leHRuYW1lKHNjcmlwdCkgPT0gJy5jb2ZmZWUnKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICByZXF1aXJlKCdjb2ZmZWUtc2NyaXB0L3JlZ2lzdGVyJyk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIENvZmZlZVNjcmlwdCBpbnRlcnByZXRlcjonLCBlLm1lc3NhZ2UgfHwgZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAocC5leHRuYW1lKHNjcmlwdCkgPT0gJy5scycpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHJlcXVpcmUoJ2xpdmVzY3JpcHQnKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGxvYWQgTGl2ZVNjcmlwdCBpbnRlcnByZXRlcjonLCBlLm1lc3NhZ2UgfHwgZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAocC5leHRuYW1lKHNjcmlwdCkgPT0gJy50cycgfHwgcC5leHRuYW1lKHNjcmlwdCkgPT0gJy50c3gnKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICByZXF1aXJlKCd0cy1ub2RlL3JlZ2lzdGVyJyk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIFR5cGVzY3JpcHQgaW50ZXJwcmV0ZXI6JywgZS5tZXNzYWdlIHx8IGUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJvY2Vzcy5vbignbWVzc2FnZScsIGZ1bmN0aW9uIChtc2cpIHtcclxuICAgIGlmIChtc2cudHlwZSA9PT0gJ2xvZzpyZWxvYWQnKSB7XHJcbiAgICAgIGZvciAodmFyIGsgaW4gc3Rkcykge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygc3Rkc1trXSA9PSAnb2JqZWN0JyAmJiAhaXNOYU4oc3Rkc1trXS5mZCkpIHtcclxuICAgICAgICAgIGlmIChzdGRzW2tdLmRlc3Ryb3kpIHN0ZHNba10uZGVzdHJveSgpO1xyXG4gICAgICAgICAgZWxzZSBpZiAoc3Rkc1trXS5lbmQpIHN0ZHNba10uZW5kKCk7XHJcbiAgICAgICAgICBlbHNlIGlmIChzdGRzW2tdLmNsb3NlKSBzdGRzW2tdLmNsb3NlKCk7XHJcbiAgICAgICAgICBzdGRzW2tdID0gc3Rkc1trXS5fZmlsZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgVXRpbGl0eS5zdGFydExvZ2dpbmcoc3RkcywgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgIGlmIChlcnIpXHJcbiAgICAgICAgICByZXR1cm4gY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHJlbG9hZCBsb2dzOicsIGVyci5zdGFjayk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1JlbG9hZGluZyBsb2cuLi4nKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHZhciBkYXlqcyA9IG51bGw7XHJcblxyXG4gIGlmIChwbTJfZW52LmxvZ19kYXRlX2Zvcm1hdClcclxuXHJcbiAgVXRpbGl0eS5zdGFydExvZ2dpbmcoc3RkcywgZnVuY3Rpb24gKGVycikge1xyXG4gICAgaWYgKGVycikge1xyXG4gICAgICBwcm9jZXNzLnNlbmQoe1xyXG4gICAgICAgIHR5cGU6ICdwcm9jZXNzOmV4Y2VwdGlvbicsXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICBzeXNjYWxsOiAnUHJvY2Vzc0NvbnRhaW5lci5zdGFydExvZ2dpbmcnXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzcy5zdGRlcnIud3JpdGUgPSAoZnVuY3Rpb24gKHdyaXRlKSB7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoc3RyaW5nLCBjYikge1xyXG4gICAgICAgIHZhciBsb2dfZGF0YSA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIERpc2FibGUgbG9ncyBpZiBzcGVjaWZpZWRcclxuICAgICAgICBpZiAocG0yX2Vudi5kaXNhYmxlX2xvZ3MgPT09IHRydWUpIHtcclxuICAgICAgICAgIHJldHVybiBjYiA/IGNiKCkgOiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwbTJfZW52LmxvZ190eXBlICYmIHBtMl9lbnYubG9nX3R5cGUgPT09ICdqc29uJykge1xyXG4gICAgICAgICAgbG9nX2RhdGEgPSBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IHN0cmluZy50b1N0cmluZygpLFxyXG4gICAgICAgICAgICB0aW1lc3RhbXA6IHBtMl9lbnYubG9nX2RhdGVfZm9ybWF0ICYmIGRheWpzID9cclxuICAgICAgICAgICAgICBkYXlqcygpLmZvcm1hdChwbTJfZW52LmxvZ19kYXRlX2Zvcm1hdCkgOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgICAgIHR5cGU6ICdlcnInLFxyXG4gICAgICAgICAgICBwcm9jZXNzX2lkOiBwbTJfZW52LnBtX2lkLFxyXG4gICAgICAgICAgICBhcHBfbmFtZTogcG0yX2Vudi5uYW1lXHJcbiAgICAgICAgICB9KSArICdcXG4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChwbTJfZW52LmxvZ19kYXRlX2Zvcm1hdCAmJiBkYXlqcylcclxuICAgICAgICAgIGxvZ19kYXRhID0gYCR7ZGF5anMoKS5mb3JtYXQocG0yX2Vudi5sb2dfZGF0ZV9mb3JtYXQpfTogJHtzdHJpbmcudG9TdHJpbmcoKX1gO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIGxvZ19kYXRhID0gc3RyaW5nLnRvU3RyaW5nKCk7XHJcblxyXG4gICAgICAgIHByb2Nlc3Muc2VuZCh7XHJcbiAgICAgICAgICB0eXBlOiAnbG9nOmVycicsXHJcbiAgICAgICAgICB0b3BpYzogJ2xvZzplcnInLFxyXG4gICAgICAgICAgZGF0YTogbG9nX2RhdGFcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKFV0aWxpdHkuY2hlY2tQYXRoSXNOdWxsKHBtMl9lbnYucG1fZXJyX2xvZ19wYXRoKSAmJlxyXG4gICAgICAgICAgKCFwbTJfZW52LnBtX2xvZ19wYXRoIHx8IFV0aWxpdHkuY2hlY2tQYXRoSXNOdWxsKHBtMl9lbnYucG1fbG9nX3BhdGgpKSlcclxuICAgICAgICAgIHJldHVybiBjYiA/IGNiKCkgOiBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogcGxlYXNlIGNoZWNrIHRoaXNcclxuICAgICAgICBjb25zdCBlbmNvZGluZyA9IFwiXCI7XHJcbiAgICAgICAgc3Rkcy5zdGQgJiYgc3Rkcy5zdGQud3JpdGUgJiYgc3Rkcy5zdGQud3JpdGUobG9nX2RhdGEsIGVuY29kaW5nKTtcclxuICAgICAgICBzdGRzLmVyciAmJiBzdGRzLmVyci53cml0ZSAmJiBzdGRzLmVyci53cml0ZShsb2dfZGF0YSwgZW5jb2RpbmcsIGNiKTtcclxuICAgICAgfTtcclxuICAgIH0pKHByb2Nlc3Muc3RkZXJyLndyaXRlKTtcclxuXHJcbiAgICBwcm9jZXNzLnN0ZG91dC53cml0ZSA9IChmdW5jdGlvbiAod3JpdGUpIHtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzdHJpbmcsIGNiKSB7XHJcbiAgICAgICAgdmFyIGxvZ19kYXRhID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gRGlzYWJsZSBsb2dzIGlmIHNwZWNpZmllZFxyXG4gICAgICAgIGlmIChwbTJfZW52LmRpc2FibGVfbG9ncyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoKSA6IGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBtMl9lbnYubG9nX3R5cGUgJiYgcG0yX2Vudi5sb2dfdHlwZSA9PT0gJ2pzb24nKSB7XHJcbiAgICAgICAgICBsb2dfZGF0YSA9IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgbWVzc2FnZTogc3RyaW5nLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogcG0yX2Vudi5sb2dfZGF0ZV9mb3JtYXQgJiYgZGF5anMgP1xyXG4gICAgICAgICAgICAgIGRheWpzKCkuZm9ybWF0KHBtMl9lbnYubG9nX2RhdGVfZm9ybWF0KSA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgdHlwZTogJ291dCcsXHJcbiAgICAgICAgICAgIHByb2Nlc3NfaWQ6IHBtMl9lbnYucG1faWQsXHJcbiAgICAgICAgICAgIGFwcF9uYW1lOiBwbTJfZW52Lm5hbWVcclxuICAgICAgICAgIH0pICsgJ1xcbic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHBtMl9lbnYubG9nX2RhdGVfZm9ybWF0ICYmIGRheWpzKVxyXG4gICAgICAgICAgbG9nX2RhdGEgPSBgJHtkYXlqcygpLmZvcm1hdChwbTJfZW52LmxvZ19kYXRlX2Zvcm1hdCl9OiAke3N0cmluZy50b1N0cmluZygpfWA7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgbG9nX2RhdGEgPSBzdHJpbmcudG9TdHJpbmcoKTtcclxuXHJcbiAgICAgICAgcHJvY2Vzcy5zZW5kKHtcclxuICAgICAgICAgIHR5cGU6ICdsb2c6b3V0JyxcclxuICAgICAgICAgIGRhdGE6IGxvZ19kYXRhXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChVdGlsaXR5LmNoZWNrUGF0aElzTnVsbChwbTJfZW52LnBtX291dF9sb2dfcGF0aCkgJiZcclxuICAgICAgICAgICghcG0yX2Vudi5wbV9sb2dfcGF0aCB8fCBVdGlsaXR5LmNoZWNrUGF0aElzTnVsbChwbTJfZW52LnBtX2xvZ19wYXRoKSkpXHJcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYigpIDogbnVsbDtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogcGxlYXNlIGNoZWNrIHRoaXNcclxuICAgICAgICBjb25zdCBlbmNvZGluZyA9IFwiXCI7XHJcbiAgICAgICAgc3Rkcy5zdGQgJiYgc3Rkcy5zdGQud3JpdGUgJiYgc3Rkcy5zdGQud3JpdGUobG9nX2RhdGEsIGVuY29kaW5nKTtcclxuICAgICAgICBzdGRzLm91dCAmJiBzdGRzLm91dC53cml0ZSAmJiBzdGRzLm91dC53cml0ZShsb2dfZGF0YSwgZW5jb2RpbmcsIGNiKTtcclxuICAgICAgfTtcclxuICAgIH0pKHByb2Nlc3Muc3Rkb3V0LndyaXRlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRVbmNhdWdodEV4Y2VwdGlvbkxpc3RlbmVyKGxpc3RlbmVyKSB7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiB1bmNhdWdodExpc3RlbmVyKGVycikge1xyXG4gICAgICAgIHZhciBlcnJvciA9IGVyciAmJiBlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnI7XHJcblxyXG4gICAgICAgIGlmIChsaXN0ZW5lciA9PT0gJ3VuaGFuZGxlZFJlamVjdGlvbicpIHtcclxuICAgICAgICAgIGVycm9yID0gJ1lvdSBoYXZlIHRyaWdnZXJlZCBhbiB1bmhhbmRsZWRSZWplY3Rpb24sIHlvdSBtYXkgaGF2ZSBmb3Jnb3R0ZW4gdG8gY2F0Y2ggYSBQcm9taXNlIHJlamVjdGlvbjpcXG4nICsgZXJyb3I7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsb2dFcnJvcihbJ3N0ZCcsICdlcnInXSwgZXJyb3IpO1xyXG5cclxuICAgICAgICAvLyBOb3RpZnkgbWFzdGVyIHRoYXQgYW4gdW5jYXVnaHRFeGNlcHRpb24gaGFzIGJlZW4gY2F0Y2hlZFxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgIHZhciBlcnJPYmogPSB7fTtcclxuXHJcbiAgICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGVycikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgZXJyT2JqW2tleV0gPSBlcnJba2V5XTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcHJvY2Vzcy5zZW5kKHtcclxuICAgICAgICAgICAgdHlwZTogJ2xvZzplcnInLFxyXG4gICAgICAgICAgICB0b3BpYzogJ2xvZzplcnInLFxyXG4gICAgICAgICAgICBkYXRhOiAnXFxuJyArIGVycm9yICsgJ1xcbidcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcHJvY2Vzcy5zZW5kKHtcclxuICAgICAgICAgICAgdHlwZTogJ3Byb2Nlc3M6ZXhjZXB0aW9uJyxcclxuICAgICAgICAgICAgZGF0YTogZXJyT2JqICE9PSB1bmRlZmluZWQgPyBlcnJPYmogOiB7IG1lc3NhZ2U6ICdObyBlcnJvciBidXQgJyArIGxpc3RlbmVyICsgJyB3YXMgY2F1Z2h0IScgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgbG9nRXJyb3IoWydzdGQnLCAnZXJyJ10sICdDaGFubmVsIGlzIGFscmVhZHkgY2xvc2VkIGNhblxcJ3QgYnJvYWRjYXN0IGVycm9yOlxcbicgKyBlLnN0YWNrKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghcHJvY2Vzcy5saXN0ZW5lcnMobGlzdGVuZXIpLmZpbHRlcihmdW5jdGlvbiAobGlzdGVuZXIpIHtcclxuICAgICAgICAgIHJldHVybiBsaXN0ZW5lciAhPT0gdW5jYXVnaHRMaXN0ZW5lcjtcclxuICAgICAgICB9KS5sZW5ndGgpIHtcclxuICAgICAgICAgIGlmIChsaXN0ZW5lciA9PSAndW5jYXVnaHRFeGNlcHRpb24nKSB7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZW1pdCgnZGlzY29ubmVjdCcpO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoY3N0LkNPREVfVU5DQVVHSFRFWENFUFRJT04pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3Mub24oJ3VuY2F1Z2h0RXhjZXB0aW9uJywgZ2V0VW5jYXVnaHRFeGNlcHRpb25MaXN0ZW5lcigndW5jYXVnaHRFeGNlcHRpb24nKSk7XHJcbiAgICBwcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCBnZXRVbmNhdWdodEV4Y2VwdGlvbkxpc3RlbmVyKCd1bmhhbmRsZWRSZWplY3Rpb24nKSk7XHJcblxyXG4gICAgLy8gQ2hhbmdlIGRpciB0byBmaXggcHJvY2Vzcy5jd2RcclxuICAgIHByb2Nlc3MuY2hkaXIocG0yX2Vudi5wbV9jd2QgfHwgcHJvY2Vzcy5lbnYuUFdEIHx8IHAuZGlybmFtZShzY3JpcHQpKTtcclxuXHJcbiAgICBpZiAoUHJvY2Vzc1V0aWxzLmlzRVNNb2R1bGUoc2NyaXB0KSA9PT0gdHJ1ZSlcclxuICAgICAgaW1wb3J0KHByb2Nlc3MuZW52LnBtX2V4ZWNfcGF0aCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHJlcXVpcmUoJ21vZHVsZScpLl9sb2FkKHNjcmlwdCwgbnVsbCwgdHJ1ZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gbG9nRXJyb3IodHlwZXMsIGVycm9yKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdHlwZXMuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xyXG4gICAgICAgICAgc3Rkc1t0eXBlXSAmJiB0eXBlb2Ygc3Rkc1t0eXBlXS53cml0ZSA9PSAnZnVuY3Rpb24nICYmIHN0ZHNbdHlwZV0ud3JpdGUoZXJyb3IgKyAnXFxuJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHsgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcbiJdfQ==