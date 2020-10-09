'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _commander = _interopRequireDefault(require("commander"));

var _API = _interopRequireDefault(require("../API"));

var _Log = _interopRequireDefault(require("../API/Log"));

var _constants = _interopRequireDefault(require("../../constants"));

var _package = _interopRequireDefault(require("../../package.json"));

var _chalk = _interopRequireDefault(require("chalk"));

var _path = _interopRequireDefault(require("path"));

var fmt = _interopRequireWildcard(require("../tools/fmt"));

var _child_process = require("child_process");

var _os = _interopRequireDefault(require("os"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

process.env.PM2_NO_INTERACTION = 'true'; // Do not print banner

process.env.PM2_DISCRETE_MODE = "true";

_commander["default"].version(_package["default"].version).description('pm2-dev monitor for any file changes and automatically restart it').option('--raw', 'raw log output').option('--timestamp', 'print timestamp').option('--node-args <node_args>', 'space delimited arguments to pass to node in cluster mode - e.g. --node-args="--debug=7001 --trace-deprecation"').option('--ignore [files]', 'files to ignore while watching').option('--post-exec [cmd]', 'execute extra command after change detected').option('--silent-exec', 'do not output result of post command', false).option('--test-mode', 'debug mode for test suit').option('--interpreter <interpreter>', 'the interpreter pm2 should use for executing app (bash, python...)').option('--env [name]', 'select env_[name] env variables in process config file').option('--auto-exit', 'exit if all processes are errored/stopped or 0 apps launched').usage('pm2-dev app.js');

var pm2 = new _API["default"]({
  pm2_home: _path["default"].join(_os["default"].homedir ? _os["default"].homedir() : process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE, '.pm2-dev')
});
pm2.connect(function () {
  _commander["default"].parse(process.argv);
});

function postExecCmd(command, cb) {
  var exec_cmd = (0, _child_process.exec)(command);

  if (_commander["default"].silentExec !== true) {
    exec_cmd.stdout.on('data', function (data) {
      process.stdout.write(data);
    });
    exec_cmd.stderr.on('data', function (data) {
      process.stderr.write(data);
    });
  }

  exec_cmd.on('close', function done() {
    if (cb) cb(null);
  });
  exec_cmd.on('error', function (err) {
    console.error(err.stack || err);
  });
}

;

function run(cmd, opts) {
  var timestamp = opts.timestamp;
  opts.watch = true;
  opts.autorestart = true;
  opts.restart_delay = 1000;
  if (opts.autoExit) autoExit();

  if (opts.ignore) {
    opts.ignore_watch = opts.ignore.split(',');
    opts.ignore_watch.push('node_modules');
  }

  if (timestamp === true) timestamp = 'YYYY-MM-DD-HH:mm:ss';
  pm2.start(cmd, opts, function (err, procs) {
    if (err) {
      console.error(err);
      pm2.destroy(function () {
        process.exit(0);
      });
      return false;
    }

    if (opts.testMode) {
      return pm2.disconnect(function () {});
    }

    fmt.sep();
    fmt.title('PM2 development mode');
    fmt.field('Apps started', procs.map(function (p) {
      return p.pm2_env.name;
    }));
    fmt.field('Processes started', _chalk["default"].bold(procs.length));
    fmt.field('Watch and Restart', _chalk["default"].green('Enabled'));
    fmt.field('Ignored folder', opts.ignore_watch || 'node_modules');
    if (opts.postExec) fmt.field('Post restart cmd', opts.postExec);
    fmt.sep();
    setTimeout(function () {
      pm2.Client.launchBus(function (err, bus) {
        bus.on('process:event', function (packet) {
          if (packet.event == 'online') {
            if (opts.postExec) postExecCmd(opts.postExec);
          }
        });
      });
    }, 1000);

    _Log["default"].devStream(pm2.Client, 'all', opts.raw, timestamp, false);

    process.on('SIGINT', function () {
      console.log('>>>>> [PM2 DEV] Stopping current development session');
      pm2["delete"]('all', function () {
        pm2.destroy(function () {
          process.exit(0);
        });
      });
    });
  });
}

_commander["default"].command('*').action(function (cmd, opts) {
  run(cmd, _commander["default"]);
});

_commander["default"].command('start <file|json_file>').description('start target config file/script in development mode').action(function (cmd, opts) {
  run(cmd, _commander["default"]);
});

function exitPM2() {
  if (pm2 && pm2.connected == true) {
    console.log(_chalk["default"].green.bold('>>> Exiting PM2'));
    pm2.kill(function () {
      process.exit(0);
    });
  } else process.exit(0);
}

function autoExit(_final) {
  setTimeout(function () {
    pm2.list(function (err, apps) {
      if (err) console.error(err.stack || err);
      var online_count = 0;
      apps.forEach(function (app) {
        if (app.pm2_env.status == _constants["default"].ONLINE_STATUS || app.pm2_env.status == _constants["default"].LAUNCHING_STATUS) online_count++;
      });

      if (online_count == 0) {
        console.log('0 application online, exiting');
        if (_final == true) process.exit(1);else autoExit(true);
        return false;
      }

      autoExit(false);
    });
  }, 3000);
}

if (process.argv.length == 2) {
  _commander["default"].outputHelp();

  exitPM2();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9iaW5hcmllcy9EZXZDTEkudHMiXSwibmFtZXMiOlsicHJvY2VzcyIsImVudiIsIlBNMl9OT19JTlRFUkFDVElPTiIsIlBNMl9ESVNDUkVURV9NT0RFIiwiY29tbWFuZGVyIiwidmVyc2lvbiIsInBrZyIsImRlc2NyaXB0aW9uIiwib3B0aW9uIiwidXNhZ2UiLCJwbTIiLCJQTTIiLCJwbTJfaG9tZSIsInBhdGgiLCJqb2luIiwib3MiLCJob21lZGlyIiwiSE9NRSIsIkhPTUVQQVRIIiwiVVNFUlBST0ZJTEUiLCJjb25uZWN0IiwicGFyc2UiLCJhcmd2IiwicG9zdEV4ZWNDbWQiLCJjb21tYW5kIiwiY2IiLCJleGVjX2NtZCIsInNpbGVudEV4ZWMiLCJzdGRvdXQiLCJvbiIsImRhdGEiLCJ3cml0ZSIsInN0ZGVyciIsImRvbmUiLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJzdGFjayIsInJ1biIsImNtZCIsIm9wdHMiLCJ0aW1lc3RhbXAiLCJ3YXRjaCIsImF1dG9yZXN0YXJ0IiwicmVzdGFydF9kZWxheSIsImF1dG9FeGl0IiwiaWdub3JlIiwiaWdub3JlX3dhdGNoIiwic3BsaXQiLCJwdXNoIiwic3RhcnQiLCJwcm9jcyIsImRlc3Ryb3kiLCJleGl0IiwidGVzdE1vZGUiLCJkaXNjb25uZWN0IiwiZm10Iiwic2VwIiwidGl0bGUiLCJmaWVsZCIsIm1hcCIsInAiLCJwbTJfZW52IiwibmFtZSIsImNoYWxrIiwiYm9sZCIsImxlbmd0aCIsImdyZWVuIiwicG9zdEV4ZWMiLCJzZXRUaW1lb3V0IiwiQ2xpZW50IiwibGF1bmNoQnVzIiwiYnVzIiwicGFja2V0IiwiZXZlbnQiLCJMb2ciLCJkZXZTdHJlYW0iLCJyYXciLCJsb2ciLCJhY3Rpb24iLCJleGl0UE0yIiwiY29ubmVjdGVkIiwia2lsbCIsImZpbmFsIiwibGlzdCIsImFwcHMiLCJvbmxpbmVfY291bnQiLCJmb3JFYWNoIiwiYXBwIiwic3RhdHVzIiwiY3N0IiwiT05MSU5FX1NUQVRV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QUluRCxHQUFKLEVBQVNDLE9BQU8sQ0FBQ0MsS0FBUixDQUFjRixHQUFHLENBQUNHLEtBQUosSUFBYUgsR0FBM0I7QUFFVCxVQUFJb0QsWUFBWSxHQUFHLENBQW5CO0FBRUFELE1BQUFBLElBQUksQ0FBQ0UsT0FBTCxDQUFhLFVBQVNDLEdBQVQsRUFBYztBQUN6QixZQUFJQSxHQUFHLENBQUMxQixPQUFKLENBQVkyQixNQUFaLElBQXNCQyxzQkFBSUMsYUFBMUIsSUFDQUgsR0FBRyxDQUFDMUIsT0FBSixDQUFZMkIsTUFBWixJQUFzQkMsc0JBQUlFLGdCQUQ5QixFQUVFTixZQUFZO0FBQ2YsT0FKRDs7QUFNQSxVQUFJQSxZQUFZLElBQUksQ0FBcEIsRUFBdUI7QUFDckJuRCxRQUFBQSxPQUFPLENBQUMyQyxHQUFSLENBQVksK0JBQVo7QUFDQSxZQUFJSyxNQUFLLElBQUksSUFBYixFQUNFbkYsT0FBTyxDQUFDcUQsSUFBUixDQUFhLENBQWIsRUFERixLQUdFUixRQUFRLENBQUMsSUFBRCxDQUFSO0FBQ0YsZUFBTyxLQUFQO0FBQ0Q7O0FBQ0RBLE1BQUFBLFFBQVEsQ0FBQyxLQUFELENBQVI7QUFDRCxLQXBCRDtBQXFCRCxHQXRCUyxFQXNCUCxJQXRCTyxDQUFWO0FBdUJEOztBQUVELElBQUk3QyxPQUFPLENBQUNzQixJQUFSLENBQWE0QyxNQUFiLElBQXVCLENBQTNCLEVBQThCO0FBQzVCOUQsd0JBQVV5RixVQUFWOztBQUNBYixFQUFBQSxPQUFPO0FBQ1IiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0JztcblxucHJvY2Vzcy5lbnYuUE0yX05PX0lOVEVSQUNUSU9OID0gJ3RydWUnO1xuLy8gRG8gbm90IHByaW50IGJhbm5lclxucHJvY2Vzcy5lbnYuUE0yX0RJU0NSRVRFX01PREUgPSBcInRydWVcIjtcblxuaW1wb3J0IGNvbW1hbmRlciBmcm9tICdjb21tYW5kZXInO1xuXG5pbXBvcnQgUE0yICAgICAgIGZyb20gJy4uL0FQSSc7XG5pbXBvcnQgTG9nICAgICAgIGZyb20gJy4uL0FQSS9Mb2cnO1xuaW1wb3J0IGNzdCAgICAgICBmcm9tICcuLi8uLi9jb25zdGFudHMnO1xuaW1wb3J0IHBrZyAgICAgICBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nO1xuaW1wb3J0IGNoYWxrICAgICBmcm9tICdjaGFsayc7XG5pbXBvcnQgcGF0aCAgICAgIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZm10ICAgICAgIGZyb20gJy4uL3Rvb2xzL2ZtdCc7XG5pbXBvcnQgeyBleGVjIH0gICAgICBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBvcyAgICAgICAgZnJvbSAnb3MnO1xuXG5jb21tYW5kZXIudmVyc2lvbihwa2cudmVyc2lvbilcbiAgLmRlc2NyaXB0aW9uKCdwbTItZGV2IG1vbml0b3IgZm9yIGFueSBmaWxlIGNoYW5nZXMgYW5kIGF1dG9tYXRpY2FsbHkgcmVzdGFydCBpdCcpXG4gIC5vcHRpb24oJy0tcmF3JywgJ3JhdyBsb2cgb3V0cHV0JylcbiAgLm9wdGlvbignLS10aW1lc3RhbXAnLCAncHJpbnQgdGltZXN0YW1wJylcbiAgLm9wdGlvbignLS1ub2RlLWFyZ3MgPG5vZGVfYXJncz4nLCAnc3BhY2UgZGVsaW1pdGVkIGFyZ3VtZW50cyB0byBwYXNzIHRvIG5vZGUgaW4gY2x1c3RlciBtb2RlIC0gZS5nLiAtLW5vZGUtYXJncz1cIi0tZGVidWc9NzAwMSAtLXRyYWNlLWRlcHJlY2F0aW9uXCInKVxuICAub3B0aW9uKCctLWlnbm9yZSBbZmlsZXNdJywgJ2ZpbGVzIHRvIGlnbm9yZSB3aGlsZSB3YXRjaGluZycpXG4gIC5vcHRpb24oJy0tcG9zdC1leGVjIFtjbWRdJywgJ2V4ZWN1dGUgZXh0cmEgY29tbWFuZCBhZnRlciBjaGFuZ2UgZGV0ZWN0ZWQnKVxuICAub3B0aW9uKCctLXNpbGVudC1leGVjJywgJ2RvIG5vdCBvdXRwdXQgcmVzdWx0IG9mIHBvc3QgY29tbWFuZCcsIGZhbHNlKVxuICAub3B0aW9uKCctLXRlc3QtbW9kZScsICdkZWJ1ZyBtb2RlIGZvciB0ZXN0IHN1aXQnKVxuICAub3B0aW9uKCctLWludGVycHJldGVyIDxpbnRlcnByZXRlcj4nLCAndGhlIGludGVycHJldGVyIHBtMiBzaG91bGQgdXNlIGZvciBleGVjdXRpbmcgYXBwIChiYXNoLCBweXRob24uLi4pJylcbiAgLm9wdGlvbignLS1lbnYgW25hbWVdJywgJ3NlbGVjdCBlbnZfW25hbWVdIGVudiB2YXJpYWJsZXMgaW4gcHJvY2VzcyBjb25maWcgZmlsZScpXG4gIC5vcHRpb24oJy0tYXV0by1leGl0JywgJ2V4aXQgaWYgYWxsIHByb2Nlc3NlcyBhcmUgZXJyb3JlZC9zdG9wcGVkIG9yIDAgYXBwcyBsYXVuY2hlZCcpXG4gIC51c2FnZSgncG0yLWRldiBhcHAuanMnKTtcblxudmFyIHBtMjogYW55ID0gbmV3IFBNMih7XG4gIHBtMl9ob21lIDogcGF0aC5qb2luKG9zLmhvbWVkaXIgPyBvcy5ob21lZGlyKCkgOiAocHJvY2Vzcy5lbnYuSE9NRSB8fCBwcm9jZXNzLmVudi5IT01FUEFUSCB8fCBwcm9jZXNzLmVudi5VU0VSUFJPRklMRSksICcucG0yLWRldicpXG59KTtcblxucG0yLmNvbm5lY3QoZnVuY3Rpb24oKSB7XG4gIGNvbW1hbmRlci5wYXJzZShwcm9jZXNzLmFyZ3YpO1xufSk7XG5cbmZ1bmN0aW9uIHBvc3RFeGVjQ21kKGNvbW1hbmQsIGNiPykge1xuICB2YXIgZXhlY19jbWQgPSBleGVjKGNvbW1hbmQpO1xuXG4gIGlmIChjb21tYW5kZXIuc2lsZW50RXhlYyAhPT0gdHJ1ZSkge1xuICAgIGV4ZWNfY21kLnN0ZG91dC5vbignZGF0YScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKGRhdGEpO1xuICAgIH0pO1xuXG4gICAgZXhlY19jbWQuc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvY2Vzcy5zdGRlcnIud3JpdGUoZGF0YSk7XG4gICAgfSk7XG4gIH1cblxuICBleGVjX2NtZC5vbignY2xvc2UnLCBmdW5jdGlvbiBkb25lKCkge1xuICAgIGlmIChjYikgY2IobnVsbCk7XG4gIH0pO1xuXG4gIGV4ZWNfY21kLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayB8fCBlcnIpO1xuICB9KTtcbn07XG5cbmZ1bmN0aW9uIHJ1bihjbWQsIG9wdHMpIHtcbiAgdmFyIHRpbWVzdGFtcCA9IG9wdHMudGltZXN0YW1wO1xuXG4gIG9wdHMud2F0Y2ggPSB0cnVlO1xuICBvcHRzLmF1dG9yZXN0YXJ0ID0gdHJ1ZTtcbiAgb3B0cy5yZXN0YXJ0X2RlbGF5ID0gMTAwMFxuICBpZiAob3B0cy5hdXRvRXhpdClcbiAgICBhdXRvRXhpdCgpO1xuXG4gIGlmIChvcHRzLmlnbm9yZSkge1xuICAgIG9wdHMuaWdub3JlX3dhdGNoID0gb3B0cy5pZ25vcmUuc3BsaXQoJywnKVxuICAgIG9wdHMuaWdub3JlX3dhdGNoLnB1c2goJ25vZGVfbW9kdWxlcycpO1xuICB9XG5cbiAgaWYgKHRpbWVzdGFtcCA9PT0gdHJ1ZSlcbiAgICB0aW1lc3RhbXAgPSAnWVlZWS1NTS1ERC1ISDptbTpzcyc7XG5cbiAgcG0yLnN0YXJ0KGNtZCwgb3B0cywgZnVuY3Rpb24oZXJyLCBwcm9jcykge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgcG0yLmRlc3Ryb3koZnVuY3Rpb24oKSB7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChvcHRzLnRlc3RNb2RlKSB7XG4gICAgICByZXR1cm4gcG0yLmRpc2Nvbm5lY3QoZnVuY3Rpb24oKSB7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmbXQuc2VwKCk7XG4gICAgZm10LnRpdGxlKCdQTTIgZGV2ZWxvcG1lbnQgbW9kZScpO1xuICAgIGZtdC5maWVsZCgnQXBwcyBzdGFydGVkJywgcHJvY3MubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHAucG0yX2Vudi5uYW1lIH0gKSk7XG4gICAgZm10LmZpZWxkKCdQcm9jZXNzZXMgc3RhcnRlZCcsIGNoYWxrLmJvbGQocHJvY3MubGVuZ3RoKSk7XG4gICAgZm10LmZpZWxkKCdXYXRjaCBhbmQgUmVzdGFydCcsIGNoYWxrLmdyZWVuKCdFbmFibGVkJykpO1xuICAgIGZtdC5maWVsZCgnSWdub3JlZCBmb2xkZXInLCBvcHRzLmlnbm9yZV93YXRjaCB8fCAnbm9kZV9tb2R1bGVzJyk7XG4gICAgaWYgKG9wdHMucG9zdEV4ZWMpXG4gICAgICBmbXQuZmllbGQoJ1Bvc3QgcmVzdGFydCBjbWQnLCBvcHRzLnBvc3RFeGVjKTtcbiAgICBmbXQuc2VwKCk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgcG0yLkNsaWVudC5sYXVuY2hCdXMoZnVuY3Rpb24oZXJyLCBidXMpIHtcbiAgICAgICAgYnVzLm9uKCdwcm9jZXNzOmV2ZW50JywgZnVuY3Rpb24ocGFja2V0KSB7XG4gICAgICAgICAgaWYgKHBhY2tldC5ldmVudCA9PSAnb25saW5lJykge1xuICAgICAgICAgICAgaWYgKG9wdHMucG9zdEV4ZWMpXG4gICAgICAgICAgICAgIHBvc3RFeGVjQ21kKG9wdHMucG9zdEV4ZWMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9LCAxMDAwKTtcblxuICAgIExvZy5kZXZTdHJlYW0ocG0yLkNsaWVudCwgJ2FsbCcsIG9wdHMucmF3LCB0aW1lc3RhbXAsIGZhbHNlKTtcblxuICAgIHByb2Nlc3Mub24oJ1NJR0lOVCcsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc29sZS5sb2coJz4+Pj4+IFtQTTIgREVWXSBTdG9wcGluZyBjdXJyZW50IGRldmVsb3BtZW50IHNlc3Npb24nKTtcbiAgICAgIHBtMi5kZWxldGUoJ2FsbCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBwbTIuZGVzdHJveShmdW5jdGlvbigpIHtcbiAgICAgICAgICBwcm9jZXNzLmV4aXQoMCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgfSk7XG59XG5cbmNvbW1hbmRlci5jb21tYW5kKCcqJylcbiAgLmFjdGlvbihmdW5jdGlvbihjbWQsIG9wdHMpe1xuICAgIHJ1bihjbWQsIGNvbW1hbmRlcik7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnc3RhcnQgPGZpbGV8anNvbl9maWxlPicpXG4gIC5kZXNjcmlwdGlvbignc3RhcnQgdGFyZ2V0IGNvbmZpZyBmaWxlL3NjcmlwdCBpbiBkZXZlbG9wbWVudCBtb2RlJylcbiAgLmFjdGlvbihmdW5jdGlvbihjbWQsIG9wdHMpIHtcbiAgICBydW4oY21kLCBjb21tYW5kZXIpO1xuICB9KTtcblxuZnVuY3Rpb24gZXhpdFBNMigpIHtcbiAgaWYgKHBtMiAmJiBwbTIuY29ubmVjdGVkID09IHRydWUpIHtcbiAgICBjb25zb2xlLmxvZyhjaGFsay5ncmVlbi5ib2xkKCc+Pj4gRXhpdGluZyBQTTInKSk7XG4gICAgcG0yLmtpbGwoZnVuY3Rpb24oKSB7XG4gICAgICBwcm9jZXNzLmV4aXQoMCk7XG4gICAgfSk7XG4gIH1cbiAgZWxzZVxuICAgIHByb2Nlc3MuZXhpdCgwKTtcbn1cblxuZnVuY3Rpb24gYXV0b0V4aXQoZmluYWw/KSB7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgcG0yLmxpc3QoZnVuY3Rpb24oZXJyLCBhcHBzKSB7XG4gICAgICBpZiAoZXJyKSBjb25zb2xlLmVycm9yKGVyci5zdGFjayB8fCBlcnIpO1xuXG4gICAgICB2YXIgb25saW5lX2NvdW50ID0gMDtcblxuICAgICAgYXBwcy5mb3JFYWNoKGZ1bmN0aW9uKGFwcCkge1xuICAgICAgICBpZiAoYXBwLnBtMl9lbnYuc3RhdHVzID09IGNzdC5PTkxJTkVfU1RBVFVTIHx8XG4gICAgICAgICAgICBhcHAucG0yX2Vudi5zdGF0dXMgPT0gY3N0LkxBVU5DSElOR19TVEFUVVMpXG4gICAgICAgICAgb25saW5lX2NvdW50Kys7XG4gICAgICB9KTtcblxuICAgICAgaWYgKG9ubGluZV9jb3VudCA9PSAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCcwIGFwcGxpY2F0aW9uIG9ubGluZSwgZXhpdGluZycpO1xuICAgICAgICBpZiAoZmluYWwgPT0gdHJ1ZSlcbiAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBhdXRvRXhpdCh0cnVlKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgYXV0b0V4aXQoZmFsc2UpO1xuICAgIH0pO1xuICB9LCAzMDAwKTtcbn1cblxuaWYgKHByb2Nlc3MuYXJndi5sZW5ndGggPT0gMikge1xuICBjb21tYW5kZXIub3V0cHV0SGVscCgpO1xuICBleGl0UE0yKCk7XG59XG4iXX0=