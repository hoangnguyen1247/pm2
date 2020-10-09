"use strict";

var _commander = _interopRequireDefault(require("commander"));

var _API = _interopRequireDefault(require("../API"));

var _Log = _interopRequireDefault(require("../API/Log"));

var _constants = _interopRequireDefault(require("../../constants"));

var _package = _interopRequireDefault(require("../../package.json"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Specialized PM2 CLI for Containers
 */
var DEFAULT_FAIL_COUNT = "3";
process.env.PM2_DISCRETE_MODE = "true";

_commander["default"].version(_package["default"].version).description('pm2-runtime is a drop-in replacement Node.js binary for containers').option('-i --instances <number>', 'launch [number] of processes automatically load-balanced. Increase overall performances and performance stability.').option('--secret [key]', '[MONITORING] PM2 plus secret key').option('--no-autorestart', 'start an app without automatic restart').option('--node-args <node_args>', 'space delimited arguments to pass to node in cluster mode - e.g. --node-args="--debug=7001 --trace-deprecation"').option('-n --name <name>', 'set a <name> for script').option('--max-memory-restart <memory>', 'specify max memory amount used to autorestart (in octet or use syntax like 100M)').option('-c --cron <cron_pattern>', 'restart a running process based on a cron pattern').option('--interpreter <interpreter>', 'the interpreter pm2 should use for executing app (bash, python...)').option('--public [key]', '[MONITORING] PM2 plus public key').option('--machine-name [name]', '[MONITORING] PM2 plus machine name').option('--trace', 'enable transaction tracing with km').option('--v8', 'enable v8 data collecting').option('--format', 'output logs formated like key=val').option('--raw', 'raw output (default mode)').option('--formatted', 'formatted log output |id|app|log').option('--json', 'output logs in json format').option('--delay <seconds>', 'delay start of configuration file by <seconds>', 0).option('--web [port]', 'launch process web api on [port] (default to 9615)').option('--only <application-name>', 'only act on one application of configuration').option('--no-auto-exit', 'do not exit if all processes are errored/stopped or 0 apps launched').option('--env [name]', 'inject env_[name] env variables in process config file').option('--watch', 'watch and restart application on file change').option('--error <path>', 'error log file destination (default disabled)', '/dev/null').option('--output <path>', 'output log file destination (default disabled)', '/dev/null').option('--deep-monitoring', 'enable all monitoring tools (equivalent to --v8 --event-loop-inspector --trace)').allowUnknownOption().usage('app.js');

_commander["default"].command('*').action(function (cmd) {
  Runtime.instanciate(cmd);
});

_commander["default"].command('start <app.js|json_file>').description('start an application or json ecosystem file').action(function (cmd) {
  Runtime.instanciate(cmd);
});

if (process.argv.length == 2) {
  _commander["default"].outputHelp();

  process.exit(1);
}

var Runtime = {
  pm2: null,
  instanciate: function instanciate(cmd) {
    this.pm2 = new _API["default"]({
      pm2_home: process.env.PM2_HOME || _path["default"].join(process.env.HOME, '.pm2'),
      secret_key: _constants["default"].SECRET_KEY || _commander["default"].secret,
      public_key: _constants["default"].PUBLIC_KEY || _commander["default"]["public"],
      machine_name: _constants["default"].MACHINE_NAME || _commander["default"].machineName,
      daemon_mode: process.env.PM2_RUNTIME_DEBUG || false
    });
    this.pm2.connect(function (err, pm2_meta) {
      process.on('SIGINT', function () {
        Runtime.exit();
      });
      process.on('SIGTERM', function () {
        Runtime.exit();
      });
      Runtime.startLogStreaming();
      Runtime.startApp(cmd, function (err) {
        if (err) {
          console.error(err.message || err);
          return Runtime.exit();
        }
      });
    });
  },

  /**
   * Log Streaming Management
   */
  startLogStreaming: function startLogStreaming() {
    if (_commander["default"].json === true) _Log["default"].jsonStream(this.pm2.Client, 'all');else if (_commander["default"].format === true) _Log["default"].formatStream(this.pm2.Client, 'all', false, 'YYYY-MM-DD-HH:mm:ssZZ');else _Log["default"].stream(this.pm2.Client, 'all', !_commander["default"].formatted, _commander["default"].timestamp, true);
  },

  /**
   * Application Startup
   */
  startApp: function startApp(cmd, cb) {
    function exec() {
      this.pm2.start(cmd, _commander["default"], function (err, obj) {
        if (err) return cb(err);
        if (obj && obj.length == 0) return cb(new Error("0 application started (no apps to run on ".concat(cmd, ")")));

        if (_commander["default"].web) {
          var port = _commander["default"].web === true ? _constants["default"].WEB_PORT : _commander["default"].web;
          Runtime.pm2.web(port);
        }

        if (_commander["default"].autoExit) {
          setTimeout(function () {
            Runtime.autoExitWorker();
          }, 4000);
        } // For Testing purpose (allow to auto exit CLI)


        if (process.env.PM2_RUNTIME_DEBUG) Runtime.pm2.disconnect(function () {});
        return cb(null, obj);
      });
    } // via --delay <seconds> option


    setTimeout(exec.bind(this), _commander["default"].delay * 1000);
  },

  /**
   * Exit runtime mgmt
   */
  exit: function exit(code) {
    if (!this.pm2) return process.exit(1);
    this.pm2.kill(function () {
      process.exit(code || 0);
    });
  },

  /**
   * Exit current PM2 instance if 0 app is online
   * function activated via --auto-exit
   */
  autoExitWorker: function autoExitWorker(fail_count) {
    var interval = 2000;
    if (typeof fail_count == 'undefined') fail_count = DEFAULT_FAIL_COUNT;
    var timer = setTimeout(function () {
      Runtime.pm2.list(function (err, apps) {
        if (err) {
          console.error('Could not run pm2 list');
          return Runtime.autoExitWorker();
        }

        var appOnline = 0;
        apps.forEach(function (app) {
          if (!app.pm2_env.pmx_module && (app.pm2_env.status === _constants["default"].ONLINE_STATUS || app.pm2_env.status === _constants["default"].LAUNCHING_STATUS)) {
            appOnline++;
          }
        });

        if (appOnline === 0) {
          console.log('0 application online, retry =', fail_count);
          if (fail_count <= 0) return Runtime.exit(2);
          return Runtime.autoExitWorker(--fail_count);
        }

        Runtime.autoExitWorker();
      });
    }, interval);
    timer.unref();
  }
};

_commander["default"].parse(process.argv);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9iaW5hcmllcy9SdW50aW1lNERvY2tlci50cyJdLCJuYW1lcyI6WyJERUZBVUxUX0ZBSUxfQ09VTlQiLCJwcm9jZXNzIiwiZW52IiwiUE0yX0RJU0NSRVRFX01PREUiLCJjb21tYW5kZXIiLCJ2ZXJzaW9uIiwicGtnIiwiZGVzY3JpcHRpb24iLCJvcHRpb24iLCJhbGxvd1Vua25vd25PcHRpb24iLCJ1c2FnZSIsImNvbW1hbmQiLCJhY3Rpb24iLCJjbWQiLCJSdW50aW1lIiwiaW5zdGFuY2lhdGUiLCJhcmd2IiwibGVuZ3RoIiwib3V0cHV0SGVscCIsImV4aXQiLCJwbTIiLCJQTTIiLCJwbTJfaG9tZSIsIlBNMl9IT01FIiwicGF0aCIsImpvaW4iLCJIT01FIiwic2VjcmV0X2tleSIsImNzdCIsIlNFQ1JFVF9LRVkiLCJzZWNyZXQiLCJwdWJsaWNfa2V5IiwiUFVCTElDX0tFWSIsIm1hY2hpbmVfbmFtZSIsIk1BQ0hJTkVfTkFNRSIsIm1hY2hpbmVOYW1lIiwiZGFlbW9uX21vZGUiLCJQTTJfUlVOVElNRV9ERUJVRyIsImNvbm5lY3QiLCJlcnIiLCJwbTJfbWV0YSIsIm9uIiwic3RhcnRMb2dTdHJlYW1pbmciLCJzdGFydEFwcCIsImNvbnNvbGUiLCJlcnJvciIsIm1lc3NhZ2UiLCJqc29uIiwiTG9nIiwianNvblN0cmVhbSIsIkNsaWVudCIsImZvcm1hdCIsImZvcm1hdFN0cmVhbSIsInN0cmVhbSIsImZvcm1hdHRlZCIsInRpbWVzdGFtcCIsImNiIiwiZXhlYyIsInN0YXJ0Iiwib2JqIiwiRXJyb3IiLCJ3ZWIiLCJwb3J0IiwiV0VCX1BPUlQiLCJhdXRvRXhpdCIsInNldFRpbWVvdXQiLCJhdXRvRXhpdFdvcmtlciIsImRpc2Nvbm5lY3QiLCJiaW5kIiwiZGVsYXkiLCJjb2RlIiwia2lsbCIsImZhaWxfY291bnQiLCJpbnRlcnZhbCIsInRpbWVyIiwibGlzdCIsImFwcHMiLCJhcHBPbmxpbmUiLCJmb3JFYWNoIiwiYXBwIiwicG0yX2VudiIsInBteF9tb2R1bGUiLCJzdGF0dXMiLCJPTkxJTkVfU1RBVFVTIiwiTEFVTkNISU5HX1NUQVRVUyIsImxvZyIsInVucmVmIiwicGFyc2UiXSwibWFwcGluZ3MiOiI7O0FBR0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFSQTs7O0FBU0EsSUFBTUEsa0JBQWtCLEdBQUcsR0FBM0I7QUFFQUMsT0FBTyxDQUFDQyxHQUFSLENBQVlDLGlCQUFaLEdBQWdDLE1BQWhDOztBQUVBQyxzQkFBVUMsT0FBVixDQUFrQkMsb0JBQUlELE9BQXRCLEVBQ0dFLFdBREgsQ0FDZSxvRUFEZixFQUVHQyxNQUZILENBRVUseUJBRlYsRUFFcUMsb0hBRnJDLEVBR0dBLE1BSEgsQ0FHVSxnQkFIVixFQUc0QixrQ0FINUIsRUFJR0EsTUFKSCxDQUlVLGtCQUpWLEVBSThCLHdDQUo5QixFQUtHQSxNQUxILENBS1UseUJBTFYsRUFLcUMsaUhBTHJDLEVBTUdBLE1BTkgsQ0FNVSxrQkFOVixFQU04Qix5QkFOOUIsRUFPR0EsTUFQSCxDQU9VLCtCQVBWLEVBTzJDLGtGQVAzQyxFQVFHQSxNQVJILENBUVUsMEJBUlYsRUFRc0MsbURBUnRDLEVBU0dBLE1BVEgsQ0FTVSw2QkFUVixFQVN5QyxvRUFUekMsRUFVR0EsTUFWSCxDQVVVLGdCQVZWLEVBVTRCLGtDQVY1QixFQVdHQSxNQVhILENBV1UsdUJBWFYsRUFXbUMsb0NBWG5DLEVBWUdBLE1BWkgsQ0FZVSxTQVpWLEVBWXFCLG9DQVpyQixFQWFHQSxNQWJILENBYVUsTUFiVixFQWFrQiwyQkFibEIsRUFjR0EsTUFkSCxDQWNVLFVBZFYsRUFjc0IsbUNBZHRCLEVBZUdBLE1BZkgsQ0FlVSxPQWZWLEVBZW1CLDJCQWZuQixFQWdCR0EsTUFoQkgsQ0FnQlUsYUFoQlYsRUFnQnlCLGtDQWhCekIsRUFpQkdBLE1BakJILENBaUJVLFFBakJWLEVBaUJvQiw0QkFqQnBCLEVBa0JHQSxNQWxCSCxDQWtCVSxtQkFsQlYsRUFrQitCLGdEQWxCL0IsRUFrQmlGLENBbEJqRixF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RUFBUztBQUNQSyxVQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBYyx3QkFBZDtBQUNBLGlCQUFPL0IsT0FBTyxDQUFDb0QsY0FBUixFQUFQO0FBQ0Q7O0FBRUQsWUFBSVcsU0FBUyxHQUFHLENBQWhCO0FBRUFELFFBQUFBLElBQUksQ0FBQ0UsT0FBTCxDQUFhLFVBQVVDLEdBQVYsRUFBZTtBQUMxQixjQUFJLENBQUNBLEdBQUcsQ0FBQ0MsT0FBSixDQUFZQyxVQUFiLEtBQ0RGLEdBQUcsQ0FBQ0MsT0FBSixDQUFZRSxNQUFaLEtBQXVCdEQsc0JBQUl1RCxhQUEzQixJQUNDSixHQUFHLENBQUNDLE9BQUosQ0FBWUUsTUFBWixLQUF1QnRELHNCQUFJd0QsZ0JBRjNCLENBQUosRUFFa0Q7QUFDaERQLFlBQUFBLFNBQVM7QUFDVjtBQUNGLFNBTkQ7O0FBUUEsWUFBSUEsU0FBUyxLQUFLLENBQWxCLEVBQXFCO0FBQ25CakMsVUFBQUEsT0FBTyxDQUFDeUMsR0FBUixDQUFZLCtCQUFaLEVBQTZDYixVQUE3QztBQUNBLGNBQUlBLFVBQVUsSUFBSSxDQUFsQixFQUNFLE9BQU8xRCxPQUFPLENBQUNLLElBQVIsQ0FBYSxDQUFiLENBQVA7QUFDRixpQkFBT0wsT0FBTyxDQUFDb0QsY0FBUixDQUF1QixFQUFFTSxVQUF6QixDQUFQO0FBQ0Q7O0FBRUQxRCxRQUFBQSxPQUFPLENBQUNvRCxjQUFSO0FBQ0QsT0F4QkQ7QUF5QkQsS0ExQnFCLEVBMEJuQk8sUUExQm1CLENBQXRCO0FBNEJBQyxJQUFBQSxLQUFLLENBQUNZLEtBQU47QUFDRDtBQTdIVyxDQUFkOztBQWdJQWxGLHNCQUFVbUYsS0FBVixDQUFnQnRGLE9BQU8sQ0FBQ2UsSUFBeEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNwZWNpYWxpemVkIFBNMiBDTEkgZm9yIENvbnRhaW5lcnNcbiAqL1xuaW1wb3J0IGNvbW1hbmRlciBmcm9tICdjb21tYW5kZXInO1xuaW1wb3J0IFBNMiAgICAgICBmcm9tICcuLi9BUEknO1xuaW1wb3J0IExvZyAgICAgICBmcm9tICcuLi9BUEkvTG9nJztcbmltcG9ydCBjc3QgICAgICAgZnJvbSAnLi4vLi4vY29uc3RhbnRzJztcbmltcG9ydCBwa2cgICAgICAgZnJvbSAnLi4vLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCBwYXRoICAgICAgZnJvbSAncGF0aCc7XG5jb25zdCBERUZBVUxUX0ZBSUxfQ09VTlQgPSBcIjNcIjtcblxucHJvY2Vzcy5lbnYuUE0yX0RJU0NSRVRFX01PREUgPSBcInRydWVcIjtcblxuY29tbWFuZGVyLnZlcnNpb24ocGtnLnZlcnNpb24pXG4gIC5kZXNjcmlwdGlvbigncG0yLXJ1bnRpbWUgaXMgYSBkcm9wLWluIHJlcGxhY2VtZW50IE5vZGUuanMgYmluYXJ5IGZvciBjb250YWluZXJzJylcbiAgLm9wdGlvbignLWkgLS1pbnN0YW5jZXMgPG51bWJlcj4nLCAnbGF1bmNoIFtudW1iZXJdIG9mIHByb2Nlc3NlcyBhdXRvbWF0aWNhbGx5IGxvYWQtYmFsYW5jZWQuIEluY3JlYXNlIG92ZXJhbGwgcGVyZm9ybWFuY2VzIGFuZCBwZXJmb3JtYW5jZSBzdGFiaWxpdHkuJylcbiAgLm9wdGlvbignLS1zZWNyZXQgW2tleV0nLCAnW01PTklUT1JJTkddIFBNMiBwbHVzIHNlY3JldCBrZXknKVxuICAub3B0aW9uKCctLW5vLWF1dG9yZXN0YXJ0JywgJ3N0YXJ0IGFuIGFwcCB3aXRob3V0IGF1dG9tYXRpYyByZXN0YXJ0JylcbiAgLm9wdGlvbignLS1ub2RlLWFyZ3MgPG5vZGVfYXJncz4nLCAnc3BhY2UgZGVsaW1pdGVkIGFyZ3VtZW50cyB0byBwYXNzIHRvIG5vZGUgaW4gY2x1c3RlciBtb2RlIC0gZS5nLiAtLW5vZGUtYXJncz1cIi0tZGVidWc9NzAwMSAtLXRyYWNlLWRlcHJlY2F0aW9uXCInKVxuICAub3B0aW9uKCctbiAtLW5hbWUgPG5hbWU+JywgJ3NldCBhIDxuYW1lPiBmb3Igc2NyaXB0JylcbiAgLm9wdGlvbignLS1tYXgtbWVtb3J5LXJlc3RhcnQgPG1lbW9yeT4nLCAnc3BlY2lmeSBtYXggbWVtb3J5IGFtb3VudCB1c2VkIHRvIGF1dG9yZXN0YXJ0IChpbiBvY3RldCBvciB1c2Ugc3ludGF4IGxpa2UgMTAwTSknKVxuICAub3B0aW9uKCctYyAtLWNyb24gPGNyb25fcGF0dGVybj4nLCAncmVzdGFydCBhIHJ1bm5pbmcgcHJvY2VzcyBiYXNlZCBvbiBhIGNyb24gcGF0dGVybicpXG4gIC5vcHRpb24oJy0taW50ZXJwcmV0ZXIgPGludGVycHJldGVyPicsICd0aGUgaW50ZXJwcmV0ZXIgcG0yIHNob3VsZCB1c2UgZm9yIGV4ZWN1dGluZyBhcHAgKGJhc2gsIHB5dGhvbi4uLiknKVxuICAub3B0aW9uKCctLXB1YmxpYyBba2V5XScsICdbTU9OSVRPUklOR10gUE0yIHBsdXMgcHVibGljIGtleScpXG4gIC5vcHRpb24oJy0tbWFjaGluZS1uYW1lIFtuYW1lXScsICdbTU9OSVRPUklOR10gUE0yIHBsdXMgbWFjaGluZSBuYW1lJylcbiAgLm9wdGlvbignLS10cmFjZScsICdlbmFibGUgdHJhbnNhY3Rpb24gdHJhY2luZyB3aXRoIGttJylcbiAgLm9wdGlvbignLS12OCcsICdlbmFibGUgdjggZGF0YSBjb2xsZWN0aW5nJylcbiAgLm9wdGlvbignLS1mb3JtYXQnLCAnb3V0cHV0IGxvZ3MgZm9ybWF0ZWQgbGlrZSBrZXk9dmFsJylcbiAgLm9wdGlvbignLS1yYXcnLCAncmF3IG91dHB1dCAoZGVmYXVsdCBtb2RlKScpXG4gIC5vcHRpb24oJy0tZm9ybWF0dGVkJywgJ2Zvcm1hdHRlZCBsb2cgb3V0cHV0IHxpZHxhcHB8bG9nJylcbiAgLm9wdGlvbignLS1qc29uJywgJ291dHB1dCBsb2dzIGluIGpzb24gZm9ybWF0JylcbiAgLm9wdGlvbignLS1kZWxheSA8c2Vjb25kcz4nLCAnZGVsYXkgc3RhcnQgb2YgY29uZmlndXJhdGlvbiBmaWxlIGJ5IDxzZWNvbmRzPicsIDApXG4gIC5vcHRpb24oJy0td2ViIFtwb3J0XScsICdsYXVuY2ggcHJvY2VzcyB3ZWIgYXBpIG9uIFtwb3J0XSAoZGVmYXVsdCB0byA5NjE1KScpXG4gIC5vcHRpb24oJy0tb25seSA8YXBwbGljYXRpb24tbmFtZT4nLCAnb25seSBhY3Qgb24gb25lIGFwcGxpY2F0aW9uIG9mIGNvbmZpZ3VyYXRpb24nKVxuICAub3B0aW9uKCctLW5vLWF1dG8tZXhpdCcsICdkbyBub3QgZXhpdCBpZiBhbGwgcHJvY2Vzc2VzIGFyZSBlcnJvcmVkL3N0b3BwZWQgb3IgMCBhcHBzIGxhdW5jaGVkJylcbiAgLm9wdGlvbignLS1lbnYgW25hbWVdJywgJ2luamVjdCBlbnZfW25hbWVdIGVudiB2YXJpYWJsZXMgaW4gcHJvY2VzcyBjb25maWcgZmlsZScpXG4gIC5vcHRpb24oJy0td2F0Y2gnLCAnd2F0Y2ggYW5kIHJlc3RhcnQgYXBwbGljYXRpb24gb24gZmlsZSBjaGFuZ2UnKVxuICAub3B0aW9uKCctLWVycm9yIDxwYXRoPicsICdlcnJvciBsb2cgZmlsZSBkZXN0aW5hdGlvbiAoZGVmYXVsdCBkaXNhYmxlZCknLCAnL2Rldi9udWxsJylcbiAgLm9wdGlvbignLS1vdXRwdXQgPHBhdGg+JywgJ291dHB1dCBsb2cgZmlsZSBkZXN0aW5hdGlvbiAoZGVmYXVsdCBkaXNhYmxlZCknLCAnL2Rldi9udWxsJylcbiAgLm9wdGlvbignLS1kZWVwLW1vbml0b3JpbmcnLCAnZW5hYmxlIGFsbCBtb25pdG9yaW5nIHRvb2xzIChlcXVpdmFsZW50IHRvIC0tdjggLS1ldmVudC1sb29wLWluc3BlY3RvciAtLXRyYWNlKScpXG4gIC5hbGxvd1Vua25vd25PcHRpb24oKVxuICAudXNhZ2UoJ2FwcC5qcycpO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnKicpXG4gIC5hY3Rpb24oZnVuY3Rpb24oY21kKXtcbiAgICBSdW50aW1lLmluc3RhbmNpYXRlKGNtZCk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnc3RhcnQgPGFwcC5qc3xqc29uX2ZpbGU+JylcbiAgLmRlc2NyaXB0aW9uKCdzdGFydCBhbiBhcHBsaWNhdGlvbiBvciBqc29uIGVjb3N5c3RlbSBmaWxlJylcbiAgLmFjdGlvbihmdW5jdGlvbihjbWQpIHtcbiAgICBSdW50aW1lLmluc3RhbmNpYXRlKGNtZCk7XG4gIH0pO1xuXG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aCA9PSAyKSB7XG4gIGNvbW1hbmRlci5vdXRwdXRIZWxwKCk7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn1cblxudmFyIFJ1bnRpbWUgPSB7XG4gIHBtMiA6IG51bGwsXG4gIGluc3RhbmNpYXRlIDogZnVuY3Rpb24oY21kKSB7XG4gICAgdGhpcy5wbTIgPSBuZXcgUE0yKHtcbiAgICAgIHBtMl9ob21lIDogcHJvY2Vzcy5lbnYuUE0yX0hPTUUgfHzCoHBhdGguam9pbihwcm9jZXNzLmVudi5IT01FLCAnLnBtMicpLFxuICAgICAgc2VjcmV0X2tleSA6IGNzdC5TRUNSRVRfS0VZIHx8IGNvbW1hbmRlci5zZWNyZXQsXG4gICAgICBwdWJsaWNfa2V5IDogY3N0LlBVQkxJQ19LRVkgfHwgY29tbWFuZGVyLnB1YmxpYyxcbiAgICAgIG1hY2hpbmVfbmFtZSA6IGNzdC5NQUNISU5FX05BTUUgfHwgY29tbWFuZGVyLm1hY2hpbmVOYW1lLFxuICAgICAgZGFlbW9uX21vZGUgOiBwcm9jZXNzLmVudi5QTTJfUlVOVElNRV9ERUJVRyB8fCBmYWxzZVxuICAgIH0pO1xuXG4gICAgdGhpcy5wbTIuY29ubmVjdChmdW5jdGlvbihlcnIsIHBtMl9tZXRhKSB7XG4gICAgICBwcm9jZXNzLm9uKCdTSUdJTlQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgUnVudGltZS5leGl0KCk7XG4gICAgICB9KTtcblxuICAgICAgcHJvY2Vzcy5vbignU0lHVEVSTScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBSdW50aW1lLmV4aXQoKTtcbiAgICAgIH0pO1xuXG4gICAgICBSdW50aW1lLnN0YXJ0TG9nU3RyZWFtaW5nKCk7XG4gICAgICBSdW50aW1lLnN0YXJ0QXBwKGNtZCwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVyci5tZXNzYWdlIHx8IGVycik7XG4gICAgICAgICAgcmV0dXJuIFJ1bnRpbWUuZXhpdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogTG9nIFN0cmVhbWluZyBNYW5hZ2VtZW50XG4gICAqL1xuICBzdGFydExvZ1N0cmVhbWluZyA6IGZ1bmN0aW9uKCkge1xuICAgIGlmIChjb21tYW5kZXIuanNvbiA9PT0gdHJ1ZSlcbiAgICAgIExvZy5qc29uU3RyZWFtKHRoaXMucG0yLkNsaWVudCwgJ2FsbCcpO1xuICAgIGVsc2UgaWYgKGNvbW1hbmRlci5mb3JtYXQgPT09IHRydWUpXG4gICAgICBMb2cuZm9ybWF0U3RyZWFtKHRoaXMucG0yLkNsaWVudCwgJ2FsbCcsIGZhbHNlLCAnWVlZWS1NTS1ERC1ISDptbTpzc1paJyk7XG4gICAgZWxzZVxuICAgICAgTG9nLnN0cmVhbSh0aGlzLnBtMi5DbGllbnQsICdhbGwnLCAhY29tbWFuZGVyLmZvcm1hdHRlZCwgY29tbWFuZGVyLnRpbWVzdGFtcCwgdHJ1ZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFwcGxpY2F0aW9uIFN0YXJ0dXBcbiAgICovXG4gIHN0YXJ0QXBwIDogZnVuY3Rpb24oY21kLCBjYikge1xuICAgIGZ1bmN0aW9uIGV4ZWMoKSB7XG4gICAgICB0aGlzLnBtMi5zdGFydChjbWQsIGNvbW1hbmRlciwgZnVuY3Rpb24oZXJyLCBvYmopIHtcbiAgICAgICAgaWYgKGVycilcbiAgICAgICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgaWYgKG9iaiAmJiBvYmoubGVuZ3RoID09IDApXG4gICAgICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcihgMCBhcHBsaWNhdGlvbiBzdGFydGVkIChubyBhcHBzIHRvIHJ1biBvbiAke2NtZH0pYCkpXG5cbiAgICAgICAgaWYgKGNvbW1hbmRlci53ZWIpIHtcbiAgICAgICAgICB2YXIgcG9ydCA9IGNvbW1hbmRlci53ZWIgPT09IHRydWUgPyBjc3QuV0VCX1BPUlQgOiBjb21tYW5kZXIud2ViO1xuICAgICAgICAgIFJ1bnRpbWUucG0yLndlYihwb3J0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb21tYW5kZXIuYXV0b0V4aXQpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgUnVudGltZS5hdXRvRXhpdFdvcmtlcigpO1xuICAgICAgICAgIH0sIDQwMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRm9yIFRlc3RpbmcgcHVycG9zZSAoYWxsb3cgdG8gYXV0byBleGl0IENMSSlcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52LlBNMl9SVU5USU1FX0RFQlVHKVxuICAgICAgICAgIFJ1bnRpbWUucG0yLmRpc2Nvbm5lY3QoZnVuY3Rpb24oKSB7fSk7XG5cbiAgICAgICAgcmV0dXJuIGNiKG51bGwsIG9iaik7XG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gdmlhIC0tZGVsYXkgPHNlY29uZHM+IG9wdGlvblxuICAgIHNldFRpbWVvdXQoZXhlYy5iaW5kKHRoaXMpLCBjb21tYW5kZXIuZGVsYXkgKiAxMDAwKTtcbiAgfSxcblxuICAvKipcbiAgICogRXhpdCBydW50aW1lIG1nbXRcbiAgICovXG4gIGV4aXQgOiBmdW5jdGlvbihjb2RlPykge1xuICAgIGlmICghdGhpcy5wbTIpIHJldHVybiBwcm9jZXNzLmV4aXQoMSk7XG5cbiAgICB0aGlzLnBtMi5raWxsKGZ1bmN0aW9uKCkge1xuICAgICAgcHJvY2Vzcy5leGl0KGNvZGUgfHwgMCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEV4aXQgY3VycmVudCBQTTIgaW5zdGFuY2UgaWYgMCBhcHAgaXMgb25saW5lXG4gICAqIGZ1bmN0aW9uIGFjdGl2YXRlZCB2aWEgLS1hdXRvLWV4aXRcbiAgICovXG4gIGF1dG9FeGl0V29ya2VyIDogZnVuY3Rpb24oZmFpbF9jb3VudD8pIHtcbiAgICB2YXIgaW50ZXJ2YWwgPSAyMDAwO1xuXG4gICAgaWYgKHR5cGVvZihmYWlsX2NvdW50KSA9PSd1bmRlZmluZWQnKVxuICAgICAgZmFpbF9jb3VudCA9IERFRkFVTFRfRkFJTF9DT1VOVDtcblxuICAgIHZhciB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgUnVudGltZS5wbTIubGlzdChmdW5jdGlvbiAoZXJyLCBhcHBzKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb3VsZCBub3QgcnVuIHBtMiBsaXN0Jyk7XG4gICAgICAgICAgcmV0dXJuIFJ1bnRpbWUuYXV0b0V4aXRXb3JrZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhcHBPbmxpbmUgPSAwO1xuXG4gICAgICAgIGFwcHMuZm9yRWFjaChmdW5jdGlvbiAoYXBwKSB7XG4gICAgICAgICAgaWYgKCFhcHAucG0yX2Vudi5wbXhfbW9kdWxlICYmXG4gICAgICAgICAgICAoYXBwLnBtMl9lbnYuc3RhdHVzID09PSBjc3QuT05MSU5FX1NUQVRVUyB8fFxuICAgICAgICAgICAgICBhcHAucG0yX2Vudi5zdGF0dXMgPT09IGNzdC5MQVVOQ0hJTkdfU1RBVFVTKSkge1xuICAgICAgICAgICAgYXBwT25saW5lKys7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoYXBwT25saW5lID09PSAwKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJzAgYXBwbGljYXRpb24gb25saW5lLCByZXRyeSA9JywgZmFpbF9jb3VudCk7XG4gICAgICAgICAgaWYgKGZhaWxfY291bnQgPD0gMClcbiAgICAgICAgICAgIHJldHVybiBSdW50aW1lLmV4aXQoMik7XG4gICAgICAgICAgcmV0dXJuIFJ1bnRpbWUuYXV0b0V4aXRXb3JrZXIoLS1mYWlsX2NvdW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIFJ1bnRpbWUuYXV0b0V4aXRXb3JrZXIoKTtcbiAgICAgIH0pO1xuICAgIH0sIGludGVydmFsKTtcblxuICAgIHRpbWVyLnVucmVmKCk7XG4gIH1cbn1cblxuY29tbWFuZGVyLnBhcnNlKHByb2Nlc3MuYXJndik7XG4iXX0=