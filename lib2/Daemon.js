"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _debug = _interopRequireDefault(require("debug"));

var _package = _interopRequireDefault(require("../package.json"));

var _constants = _interopRequireDefault(require("../constants.js"));

var _pm2AxonRpc = _interopRequireDefault(require("pm2-axon-rpc"));

var _pm2Axon = _interopRequireDefault(require("pm2-axon"));

var _domain = _interopRequireDefault(require("domain"));

var _Utility = _interopRequireDefault(require("./Utility.js"));

var _util = _interopRequireDefault(require("util"));

var _fs = _interopRequireDefault(require("fs"));

var _God = _interopRequireDefault(require("./God"));

var _eachLimit = _interopRequireDefault(require("async/eachLimit"));

var fmt = _interopRequireWildcard(require("./tools/fmt"));

var _semver = _interopRequireDefault(require("semver"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
var debug = (0, _debug["default"])('pm2:daemon');

var Daemon = function Daemon(opts) {
  if (!opts) opts = {};
  this.ignore_signals = opts.ignore_signals || false;
  this.rpc_socket_ready = false;
  this.pub_socket_ready = false;
  this.pub_socket_file = opts.pub_socket_file || _constants["default"].DAEMON_PUB_PORT;
  this.rpc_socket_file = opts.rpc_socket_file || _constants["default"].DAEMON_RPC_PORT;
  this.pid_path = opts.pid_file || _constants["default"].PM2_PID_FILE_PATH;
};

Daemon.prototype.start = function () {
  var that = this;

  var d = _domain["default"].create();

  d.once('error', function (err) {
    fmt.sep();
    fmt.title('PM2 global error caught');
    fmt.field('Time', new Date());
    console.error(err.message);
    console.error(err.stack);
    fmt.sep();
    console.error('[PM2] Resurrecting PM2');
    var path = _constants["default"].IS_WINDOWS ? __dirname + '/../bin/pm2' : process.env['_'];

    var fork_new_pm2 = require('child_process').spawn('node', [path, 'update'], {
      detached: true,
      stdio: 'inherit'
    });

    fork_new_pm2.on('close', function () {
      console.log('PM2 successfully forked');
      process.exit(0);
    });
  });
  d.run(function () {
    that.innerStart();
  });
};

Daemon.prototype.innerStart = function (cb) {
  var that = this;
  if (!cb) cb = function cb() {
    fmt.sep();
    fmt.title('New PM2 Daemon started');
    fmt.field('Time', new Date());
    fmt.field('PM2 version', _package["default"].version);
    fmt.field('Node.js version', process.versions.node);
    fmt.field('Current arch', process.arch);
    fmt.field('PM2 home', _constants["default"].PM2_HOME);
    fmt.field('PM2 PID file', that.pid_path);
    fmt.field('RPC socket file', that.rpc_socket_file);
    fmt.field('BUS socket file', that.pub_socket_file);
    fmt.field('Application log path', _constants["default"].DEFAULT_LOG_PATH);
    fmt.field('Worker Interval', _constants["default"].WORKER_INTERVAL);
    fmt.field('Process dump file', _constants["default"].DUMP_FILE_PATH);
    fmt.field('Concurrent actions', _constants["default"].CONCURRENT_ACTIONS);
    fmt.field('SIGTERM timeout', _constants["default"].KILL_TIMEOUT);
    fmt.sep();
  }; // Write Daemon PID into file

  try {
    _fs["default"].writeFileSync(that.pid_path, process.pid.toString());
  } catch (e) {
    console.error(e.stack || e);
  }

  if (this.ignore_signals != true) this.handleSignals();
  /**
   * Pub system for real time notifications
   */

  this.pub = _pm2Axon["default"].socket('pub-emitter');
  this.pub_socket = this.pub.bind(this.pub_socket_file);
  this.pub_socket.once('bind', function () {
    _fs["default"].chmod(that.pub_socket_file, '775', function (e) {
      if (e) console.error(e);

      try {
        if (process.env.PM2_SOCKET_USER && process.env.PM2_SOCKET_GROUP) _fs["default"].chown(that.pub_socket_file, parseInt(process.env.PM2_SOCKET_USER), parseInt(process.env.PM2_SOCKET_GROUP), function (e) {
          if (e) console.error(e);
        });
      } catch (e) {
        console.error(e);
      }
    });

    that.pub_socket_ready = true;
    that.sendReady(cb);
  });
  /**
   * Rep/Req - RPC system to interact with God
   */

  this.rep = _pm2Axon["default"].socket('rep');
  var server = new _pm2AxonRpc["default"].Server(this.rep);
  this.rpc_socket = this.rep.bind(this.rpc_socket_file);
  this.rpc_socket.once('bind', function () {
    _fs["default"].chmod(that.rpc_socket_file, '775', function (e) {
      if (e) console.error(e);

      try {
        if (process.env.PM2_SOCKET_USER && process.env.PM2_SOCKET_GROUP) _fs["default"].chown(that.rpc_socket_file, parseInt(process.env.PM2_SOCKET_USER), parseInt(process.env.PM2_SOCKET_GROUP), function (e) {
          if (e) console.error(e);
        });
      } catch (e) {
        console.error(e);
      }
    });

    that.rpc_socket_ready = true;
    that.sendReady(cb);
  });
  /**
   * Memory Snapshot
   */

  function profile(type, msg, cb) {
    if (_semver["default"].satisfies(process.version, '< 8')) return cb(null, {
      error: 'Node.js is not on right version'
    });
    var cmd;

    if (type === 'cpu') {
      cmd = {
        enable: 'Profiler.enable',
        start: 'Profiler.start',
        stop: 'Profiler.stop',
        disable: 'Profiler.disable'
      };
    }

    if (type == 'mem') {
      cmd = {
        enable: 'HeapProfiler.enable',
        start: 'HeapProfiler.startSampling',
        stop: 'HeapProfiler.stopSampling',
        disable: 'HeapProfiler.disable'
      };
    }

    var inspector = require('inspector');

    var session = new inspector.Session();
    session.connect();
    var timeout = msg.timeout || 5000;
    session.post(cmd.enable, function (err, data) {
      if (err) return cb(null, {
        error: err.message || err
      });
      console.log("Starting ".concat(cmd.start));
      session.post(cmd.start, function (err, data) {
        if (err) return cb(null, {
          error: err.message || err
        });
        setTimeout(function () {
          session.post(cmd.stop, function (err, data) {
            if (err) return cb(null, {
              error: err.message || err
            });
            var profile = data.profile;
            console.log("Stopping ".concat(cmd.stop));
            session.post(cmd.disable);

            _fs["default"].writeFile(msg.pwd, JSON.stringify(profile), function (err) {
              if (err) return cb(null, {
                error: err.message || err
              });
              return cb(null, {
                file: msg.pwd
              });
            });
          });
        }, timeout);
      });
    });
  }

  server.expose({
    killMe: that.close.bind(this),
    profileCPU: profile.bind(this, 'cpu'),
    profileMEM: profile.bind(this, 'mem'),
    prepare: _God["default"].prepare,
    launchSysMonitoring: _God["default"].launchSysMonitoring,
    getMonitorData: _God["default"].getMonitorData,
    getSystemData: _God["default"].getSystemData,
    startProcessId: _God["default"].startProcessId,
    stopProcessId: _God["default"].stopProcessId,
    restartProcessId: _God["default"].restartProcessId,
    deleteProcessId: _God["default"].deleteProcessId,
    sendLineToStdin: _God["default"].sendLineToStdin,
    softReloadProcessId: _God["default"].softReloadProcessId,
    reloadProcessId: _God["default"].reloadProcessId,
    duplicateProcessId: _God["default"].duplicateProcessId,
    resetMetaProcessId: _God["default"].resetMetaProcessId,
    stopWatch: _God["default"].stopWatch,
    startWatch: _God["default"].startWatch,
    toggleWatch: _God["default"].toggleWatch,
    notifyByProcessId: _God["default"].notifyByProcessId,
    notifyKillPM2: _God["default"].notifyKillPM2,
    monitor: _God["default"].monitor,
    unmonitor: _God["default"].unmonitor,
    msgProcess: _God["default"].msgProcess,
    sendDataToProcessId: _God["default"].sendDataToProcessId,
    sendSignalToProcessId: _God["default"].sendSignalToProcessId,
    sendSignalToProcessName: _God["default"].sendSignalToProcessName,
    ping: _God["default"].ping,
    getVersion: _God["default"].getVersion,
    getReport: _God["default"].getReport,
    reloadLogs: _God["default"].reloadLogs
  });
  this.startLogic();
};

Daemon.prototype.close = function (opts, cb) {
  var that = this;

  _God["default"].bus.emit('pm2:kill', {
    status: 'killed',
    msg: 'pm2 has been killed via CLI'
  });

  if (_God["default"].system_infos_proc !== null) _God["default"].system_infos_proc.kill();
  /**
   * Cleanly kill pm2
   */

  that.rpc_socket.close(function () {
    that.pub_socket.close(function () {
      // notify cli that the daemon is shuting down (only under unix since windows doesnt handle signals)
      if (_constants["default"].IS_WINDOWS === false) {
        try {
          process.kill(parseInt(opts.pid), 'SIGQUIT');
        } catch (e) {
          console.error('Could not send SIGQUIT to CLI');
        }
      }

      try {
        _fs["default"].unlinkSync(that.pid_path);
      } catch (e) {}

      console.log('PM2 successfully stopped');
      setTimeout(function () {
        process.exit(_constants["default"].SUCCESS_EXIT);
      }, 2);
    });
  });
};

Daemon.prototype.handleSignals = function () {
  var that = this;
  process.on('SIGTERM', that.gracefullExit.bind(this));
  process.on('SIGINT', that.gracefullExit.bind(this));
  process.on('SIGHUP', function () {});
  process.on('SIGQUIT', that.gracefullExit.bind(this));
  process.on('SIGUSR2', function () {
    _God["default"].reloadLogs({}, function () {});
  });
};

Daemon.prototype.sendReady = function (cb) {
  // Send ready message to Client
  if (this.rpc_socket_ready == true && this.pub_socket_ready == true) {
    cb(null, {
      pid: process.pid,
      pm2_version: _package["default"].version
    });
    if (typeof process.send != 'function') return false;
    process.send({
      online: true,
      success: true,
      pid: process.pid,
      pm2_version: _package["default"].version
    });
  }

  ;
};

Daemon.prototype.gracefullExit = function () {
  var that = this; // never execute multiple gracefullExit simultaneously
  // this can lead to loss of some apps in dump file

  if (this.isExiting) return;
  this.isExiting = true;

  _God["default"].bus.emit('pm2:kill', {
    status: 'killed',
    msg: 'pm2 has been killed by SIGNAL'
  });

  console.log('pm2 has been killed by signal, dumping process list before exit...');
  if (_God["default"].system_infos_proc !== null) _God["default"].system_infos_proc.kill();

  _God["default"].dumpProcessList(function () {
    var processes = _God["default"].getFormatedProcesses();

    (0, _eachLimit["default"])(processes, 1, function (proc, next) {
      console.log('Deleting process %s', proc.pm2_env.pm_id);

      _God["default"].deleteProcessId(proc.pm2_env.pm_id, function () {
        return next();
      });
    }, function (err) {
      try {
        _fs["default"].unlinkSync(that.pid_path);
      } catch (e) {}

      setTimeout(function () {
        that.isExiting = false;
        console.log('Exited peacefully');
        process.exit(_constants["default"].SUCCESS_EXIT);
      }, 2);
    });
  });
};

Daemon.prototype.startLogic = function () {
  var that = this;
  /**
   * Action treatment specifics
   * Attach actions to pm2_env.axm_actions variables (name + options)
   */

  _God["default"].bus.on('axm:action', function axmActions(msg) {
    var pm2_env = msg.process;
    var exists = false;
    var axm_action = msg.data;
    if (!pm2_env || !_God["default"].clusters_db[pm2_env.pm_id]) return console.error('AXM ACTION Unknown id %s', pm2_env.pm_id);
    if (!_God["default"].clusters_db[pm2_env.pm_id].pm2_env.axm_actions) _God["default"].clusters_db[pm2_env.pm_id].pm2_env.axm_actions = [];

    _God["default"].clusters_db[pm2_env.pm_id].pm2_env.axm_actions.forEach(function (actions) {
      if (actions.action_name == axm_action.action_name) exists = true;
    });

    if (exists === false) {
      debug('Adding action', axm_action);

      _God["default"].clusters_db[pm2_env.pm_id].pm2_env.axm_actions.push(axm_action);
    }

    msg = null;
  });
  /**
   * Configure module
   */


  _God["default"].bus.on('axm:option:configuration', function axmMonitor(msg) {
    if (!msg.process) return console.error('[axm:option:configuration] no process defined');
    if (!_God["default"].clusters_db[msg.process.pm_id]) return console.error('[axm:option:configuration] Unknown id %s', msg.process.pm_id);

    try {
      // Application Name nverride
      if (msg.data.name) _God["default"].clusters_db[msg.process.pm_id].pm2_env.name = msg.data.name;
      Object.keys(msg.data).forEach(function (conf_key) {
        _God["default"].clusters_db[msg.process.pm_id].pm2_env.axm_options[conf_key] = _Utility["default"].clone(msg.data[conf_key]);
      });
    } catch (e) {
      console.error(e.stack || e);
    }

    msg = null;
  });
  /**
   * Process monitoring data (probes)
   */


  _God["default"].bus.on('axm:monitor', function axmMonitor(msg) {
    if (!msg.process) return console.error('[axm:monitor] no process defined');
    if (!msg.process || !_God["default"].clusters_db[msg.process.pm_id]) return console.error('AXM MONITOR Unknown id %s', msg.process.pm_id);

    _util["default"].inherits(_God["default"].clusters_db[msg.process.pm_id].pm2_env.axm_monitor, _Utility["default"].clone(msg.data));

    msg = null;
  });
  /**
   * Broadcast messages
   */


  _God["default"].bus.onAny(function (event, data_v) {
    if (['axm:action', 'axm:monitor', 'axm:option:setPID', 'axm:option:configuration'].indexOf(event) > -1) {
      data_v = null;
      return false;
    }

    that.pub.emit(event, _Utility["default"].clone(data_v));
    data_v = null;
  });
};

if (require.main === module) {
  process.title = process.env.PM2_DAEMON_TITLE || 'PM2 v' + _package["default"].version + ': God Daemon (' + process.env.PM2_HOME + ')';
  var daemon = new Daemon();
  daemon.start();
}

var _default = Daemon;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9EYWVtb24udHMiXSwibmFtZXMiOlsiZGVidWciLCJEYWVtb24iLCJvcHRzIiwiaWdub3JlX3NpZ25hbHMiLCJycGNfc29ja2V0X3JlYWR5IiwicHViX3NvY2tldF9yZWFkeSIsInB1Yl9zb2NrZXRfZmlsZSIsImNzdCIsIkRBRU1PTl9QVUJfUE9SVCIsInJwY19zb2NrZXRfZmlsZSIsIkRBRU1PTl9SUENfUE9SVCIsInBpZF9wYXRoIiwicGlkX2ZpbGUiLCJQTTJfUElEX0ZJTEVfUEFUSCIsInByb3RvdHlwZSIsInN0YXJ0IiwidGhhdCIsImQiLCJkb21haW4iLCJjcmVhdGUiLCJvbmNlIiwiZXJyIiwiZm10Iiwic2VwIiwidGl0bGUiLCJmaWVsZCIsIkRhdGUiLCJjb25zb2xlIiwiZXJyb3IiLCJtZXNzYWdlIiwic3RhY2siLCJwYXRoIiwiSVNfV0lORE9XUyIsIl9fZGlybmFtZSIsInByb2Nlc3MiLCJlbnYiLCJmb3JrX25ld19wbTIiLCJyZXF1aXJlIiwic3Bhd24iLCJkZXRhY2hlZCIsInN0ZGlvIiwib24iLCJsb2ciLCJleGl0IiwicnVuIiwiaW5uZXJTdGFydCIsImNiIiwicGtnIiwidmVyc2lvbiIsInZlcnNpb25zIiwibm9kZSIsImFyY2giLCJQTTJfSE9NRSIsIkRFRkFVTFRfTE9HX1BBVEgiLCJXT1JLRVJfSU5URVJWQUwiLCJEVU1QX0ZJTEVfUEFUSCIsIkNPTkNVUlJFTlRfQUNUSU9OUyIsIktJTExfVElNRU9VVCIsImZzIiwid3JpdGVGaWxlU3luYyIsInBpZCIsInRvU3RyaW5nIiwiZSIsImhhbmRsZVNpZ25hbHMiLCJwdWIiLCJheG9uIiwic29ja2V0IiwicHViX3NvY2tldCIsImJpbmQiLCJjaG1vZCIsIlBNMl9TT0NLRVRfVVNFUiIsIlBNMl9TT0NLRVRfR1JPVVAiLCJjaG93biIsInBhcnNlSW50Iiwic2VuZFJlYWR5IiwicmVwIiwic2VydmVyIiwicnBjIiwiU2VydmVyIiwicnBjX3NvY2tldCIsInByb2ZpbGUiLCJ0eXBlIiwibXNnIiwic2VtdmVyIiwic2F0aXNmaWVzIiwiY21kIiwiZW5hYmxlIiwic3RvcCIsImRpc2FibGUiLCJpbnNwZWN0b3IiLCJzZXNzaW9uIiwiU2Vzc2lvbiIsImNvbm5lY3QiLCJ0aW1lb3V0IiwicG9zdCIsImRhdGEiLCJzZXRUaW1lb3V0Iiwid3JpdGVGaWxlIiwicHdkIiwiSlNPTiIsInN0cmluZ2lmeSIsImZpbGUiLCJleHBvc2UiLCJraWxsTWUiLCJjbG9zZSIsInByb2ZpbGVDUFUiLCJwcm9maWxlTUVNIiwicHJlcGFyZSIsIkdvZCIsImxhdW5jaFN5c01vbml0b3JpbmciLCJnZXRNb25pdG9yRGF0YSIsImdldFN5c3RlbURhdGEiLCJzdGFydFByb2Nlc3NJZCIsInN0b3BQcm9jZXNzSWQiLCJyZXN0YXJ0UHJvY2Vzc0lkIiwiZGVsZXRlUHJvY2Vzc0lkIiwic2VuZExpbmVUb1N0ZGluIiwic29mdFJlbG9hZFByb2Nlc3NJZCIsInJlbG9hZFByb2Nlc3NJZCIsImR1cGxpY2F0ZVByb2Nlc3NJZCIsInJlc2V0TWV0YVByb2Nlc3NJZCIsInN0b3BXYXRjaCIsInN0YXJ0V2F0Y2giLCJ0b2dnbGVXYXRjaCIsIm5vdGlmeUJ5UHJvY2Vzc0lkIiwibm90aWZ5S2lsbFBNMiIsIm1vbml0b3IiLCJ1bm1vbml0b3IiLCJtc2dQcm9jZXNzIiwic2VuZERhdGFUb1Byb2Nlc3NJZCIsInNlbmRTaWduYWxUb1Byb2Nlc3NJZCIsInNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lIiwicGluZyIsImdldFZlcnNpb24iLCJnZXRSZXBvcnQiLCJyZWxvYWRMb2dzIiwic3RhcnRMb2dpYyIsImJ1cyIsImVtaXQiLCJzdGF0dXMiLCJzeXN0ZW1faW5mb3NfcHJvYyIsImtpbGwiLCJ1bmxpbmtTeW5jIiwiU1VDQ0VTU19FWElUIiwiZ3JhY2VmdWxsRXhpdCIsInBtMl92ZXJzaW9uIiwic2VuZCIsIm9ubGluZSIsInN1Y2Nlc3MiLCJpc0V4aXRpbmciLCJkdW1wUHJvY2Vzc0xpc3QiLCJwcm9jZXNzZXMiLCJnZXRGb3JtYXRlZFByb2Nlc3NlcyIsInByb2MiLCJuZXh0IiwicG0yX2VudiIsInBtX2lkIiwiYXhtQWN0aW9ucyIsImV4aXN0cyIsImF4bV9hY3Rpb24iLCJjbHVzdGVyc19kYiIsImF4bV9hY3Rpb25zIiwiZm9yRWFjaCIsImFjdGlvbnMiLCJhY3Rpb25fbmFtZSIsInB1c2giLCJheG1Nb25pdG9yIiwibmFtZSIsIk9iamVjdCIsImtleXMiLCJjb25mX2tleSIsImF4bV9vcHRpb25zIiwiVXRpbGl0eSIsImNsb25lIiwidXRpbCIsImluaGVyaXRzIiwiYXhtX21vbml0b3IiLCJvbkFueSIsImV2ZW50IiwiZGF0YV92IiwiaW5kZXhPZiIsIm1haW4iLCJtb2R1bGUiLCJQTTJfREFFTU9OX1RJVExFIiwiZGFlbW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFNQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFsQkE7Ozs7O0FBb0JBLElBQU1BLEtBQUssR0FBRyx1QkFBWSxZQUFaLENBQWQ7O0FBRUEsSUFBSUMsTUFBTSxHQUFHLFNBQVRBLE1BQVMsQ0FBVUMsSUFBVixFQUFpQjtBQUM1QixNQUFJLENBQUNBLElBQUwsRUFBV0EsSUFBSSxHQUFHLEVBQVA7QUFFWCxPQUFLQyxjQUFMLEdBQXNCRCxJQUFJLENBQUNDLGNBQUwsSUFBdUIsS0FBN0M7QUFDQSxPQUFLQyxnQkFBTCxHQUF3QixLQUF4QjtBQUNBLE9BQUtDLGdCQUFMLEdBQXdCLEtBQXhCO0FBRUEsT0FBS0MsZUFBTCxHQUF1QkosSUFBSSxDQUFDSSxlQUFMLElBQXdCQyxzQkFBSUMsZUFBbkQ7QUFDQSxPQUFLQyxlQUFMLEdBQXVCUCxJQUFJLENBQUNPLGVBQUwsSUFBd0JGLHNCQUFJRyxlQUFuRDtBQUVBLE9BQUtDLFFBQUwsR0FBZ0JULElBQUksQ0FBQ1UsUUFBTCxJQUFpQkwsc0JBQUlNLGlCQUFyQztBQUNELENBWEQ7O0FBYUFaLE1BQU0s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Q0FBZ0I5RSxHQUFHLENBQUNoRCxPQUFKLENBQVkwSCxLQUE1QixFQUFtQ0QsT0FBbkMsQ0FBMkNxQixXQUF6RCxFQUFzRUosb0JBQVFDLEtBQVIsQ0FBYzNGLEdBQUcsQ0FBQ2EsSUFBbEIsQ0FBdEU7O0FBQ0FiLElBQUFBLEdBQUcsR0FBRyxJQUFOO0FBQ0QsR0FURDtBQVdBOzs7OztBQUdBMEIsa0JBQUk2QixHQUFKLENBQVF3QyxLQUFSLENBQWMsVUFBVUMsS0FBVixFQUFpQkMsTUFBakIsRUFBeUI7QUFDckMsUUFBSSxDQUFDLFlBQUQsRUFDRixhQURFLEVBRUYsbUJBRkUsRUFHRiwwQkFIRSxFQUcwQkMsT0FIMUIsQ0FHa0NGLEtBSGxDLElBRzJDLENBQUMsQ0FIaEQsRUFHbUQ7QUFDakRDLE1BQUFBLE1BQU0sR0FBRyxJQUFUO0FBQ0EsYUFBTyxLQUFQO0FBQ0Q7O0FBQ0RuSyxJQUFBQSxJQUFJLENBQUNnRCxHQUFMLENBQVMwRSxJQUFULENBQWN3QyxLQUFkLEVBQXFCTixvQkFBUUMsS0FBUixDQUFjTSxNQUFkLENBQXJCO0FBQ0FBLElBQUFBLE1BQU0sR0FBRyxJQUFUO0FBQ0QsR0FWRDtBQVdELENBbEZEOztBQW9GQSxJQUFJOUksT0FBTyxDQUFDZ0osSUFBUixLQUFpQkMsTUFBckIsRUFBNkI7QUFDM0JwSixFQUFBQSxPQUFPLENBQUNWLEtBQVIsR0FBZ0JVLE9BQU8sQ0FBQ0MsR0FBUixDQUFZb0osZ0JBQVosSUFBZ0MsVUFBVXhJLG9CQUFJQyxPQUFkLEdBQXdCLGdCQUF4QixHQUEyQ2QsT0FBTyxDQUFDQyxHQUFSLENBQVlpQixRQUF2RCxHQUFrRSxHQUFsSDtBQUVBLE1BQUlvSSxNQUFNLEdBQUcsSUFBSXZMLE1BQUosRUFBYjtBQUVBdUwsRUFBQUEsTUFBTSxDQUFDekssS0FBUDtBQUNEOztlQUVjZCxNIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIGxpY2Vuc2UgdGhhdFxyXG4gKiBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cclxuICovXHJcblxyXG5pbXBvcnQgZGVidWdMb2dnZXIgZnJvbSAnZGVidWcnO1xyXG5pbXBvcnQgcGtnIGZyb20gJy4uL3BhY2thZ2UuanNvbic7XHJcbmltcG9ydCBjc3QgZnJvbSAnLi4vY29uc3RhbnRzLmpzJztcclxuaW1wb3J0IHJwYyBmcm9tICdwbTItYXhvbi1ycGMnO1xyXG5pbXBvcnQgYXhvbiBmcm9tICdwbTItYXhvbic7XHJcbmltcG9ydCBkb21haW4gZnJvbSAnZG9tYWluJztcclxuaW1wb3J0IFV0aWxpdHkgZnJvbSAnLi9VdGlsaXR5LmpzJztcclxuaW1wb3J0IHV0aWwgZnJvbSAndXRpbCc7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCBHb2QgZnJvbSAnLi9Hb2QnO1xyXG5pbXBvcnQgZWFjaExpbWl0IGZyb20gJ2FzeW5jL2VhY2hMaW1pdCc7XHJcbmltcG9ydCAqIGFzIGZtdCBmcm9tICcuL3Rvb2xzL2ZtdCc7XHJcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuXHJcbmNvbnN0IGRlYnVnID0gZGVidWdMb2dnZXIoJ3BtMjpkYWVtb24nKTtcclxuXHJcbnZhciBEYWVtb24gPSBmdW5jdGlvbiAob3B0cz8pIHtcclxuICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcclxuXHJcbiAgdGhpcy5pZ25vcmVfc2lnbmFscyA9IG9wdHMuaWdub3JlX3NpZ25hbHMgfHwgZmFsc2U7XHJcbiAgdGhpcy5ycGNfc29ja2V0X3JlYWR5ID0gZmFsc2U7XHJcbiAgdGhpcy5wdWJfc29ja2V0X3JlYWR5ID0gZmFsc2U7XHJcblxyXG4gIHRoaXMucHViX3NvY2tldF9maWxlID0gb3B0cy5wdWJfc29ja2V0X2ZpbGUgfHwgY3N0LkRBRU1PTl9QVUJfUE9SVDtcclxuICB0aGlzLnJwY19zb2NrZXRfZmlsZSA9IG9wdHMucnBjX3NvY2tldF9maWxlIHx8IGNzdC5EQUVNT05fUlBDX1BPUlQ7XHJcblxyXG4gIHRoaXMucGlkX3BhdGggPSBvcHRzLnBpZF9maWxlIHx8IGNzdC5QTTJfUElEX0ZJTEVfUEFUSDtcclxufTtcclxuXHJcbkRhZW1vbi5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIHZhciBkID0gZG9tYWluLmNyZWF0ZSgpO1xyXG5cclxuICBkLm9uY2UoJ2Vycm9yJywgZnVuY3Rpb24gKGVycikge1xyXG4gICAgZm10LnNlcCgpO1xyXG4gICAgZm10LnRpdGxlKCdQTTIgZ2xvYmFsIGVycm9yIGNhdWdodCcpO1xyXG4gICAgZm10LmZpZWxkKCdUaW1lJywgbmV3IERhdGUoKSk7XHJcbiAgICBjb25zb2xlLmVycm9yKGVyci5tZXNzYWdlKTtcclxuICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTtcclxuICAgIGZtdC5zZXAoKTtcclxuXHJcbiAgICBjb25zb2xlLmVycm9yKCdbUE0yXSBSZXN1cnJlY3RpbmcgUE0yJyk7XHJcblxyXG4gICAgdmFyIHBhdGggPSBjc3QuSVNfV0lORE9XUyA/IF9fZGlybmFtZSArICcvLi4vYmluL3BtMicgOiBwcm9jZXNzLmVudlsnXyddO1xyXG4gICAgdmFyIGZvcmtfbmV3X3BtMiA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKS5zcGF3bignbm9kZScsIFtwYXRoLCAndXBkYXRlJ10sIHtcclxuICAgICAgZGV0YWNoZWQ6IHRydWUsXHJcbiAgICAgIHN0ZGlvOiAnaW5oZXJpdCdcclxuICAgIH0pO1xyXG5cclxuICAgIGZvcmtfbmV3X3BtMi5vbignY2xvc2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdQTTIgc3VjY2Vzc2Z1bGx5IGZvcmtlZCcpO1xyXG4gICAgICBwcm9jZXNzLmV4aXQoMCk7XHJcbiAgICB9KVxyXG5cclxuICB9KTtcclxuXHJcbiAgZC5ydW4oZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC5pbm5lclN0YXJ0KCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbkRhZW1vbi5wcm90b3R5cGUuaW5uZXJTdGFydCA9IGZ1bmN0aW9uIChjYikge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgaWYgKCFjYikgY2IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBmbXQuc2VwKCk7XHJcbiAgICBmbXQudGl0bGUoJ05ldyBQTTIgRGFlbW9uIHN0YXJ0ZWQnKTtcclxuICAgIGZtdC5maWVsZCgnVGltZScsIG5ldyBEYXRlKCkpO1xyXG4gICAgZm10LmZpZWxkKCdQTTIgdmVyc2lvbicsIHBrZy52ZXJzaW9uKTtcclxuICAgIGZtdC5maWVsZCgnTm9kZS5qcyB2ZXJzaW9uJywgcHJvY2Vzcy52ZXJzaW9ucy5ub2RlKTtcclxuICAgIGZtdC5maWVsZCgnQ3VycmVudCBhcmNoJywgcHJvY2Vzcy5hcmNoKTtcclxuICAgIGZtdC5maWVsZCgnUE0yIGhvbWUnLCBjc3QuUE0yX0hPTUUpO1xyXG4gICAgZm10LmZpZWxkKCdQTTIgUElEIGZpbGUnLCB0aGF0LnBpZF9wYXRoKTtcclxuICAgIGZtdC5maWVsZCgnUlBDIHNvY2tldCBmaWxlJywgdGhhdC5ycGNfc29ja2V0X2ZpbGUpO1xyXG4gICAgZm10LmZpZWxkKCdCVVMgc29ja2V0IGZpbGUnLCB0aGF0LnB1Yl9zb2NrZXRfZmlsZSk7XHJcbiAgICBmbXQuZmllbGQoJ0FwcGxpY2F0aW9uIGxvZyBwYXRoJywgY3N0LkRFRkFVTFRfTE9HX1BBVEgpO1xyXG4gICAgZm10LmZpZWxkKCdXb3JrZXIgSW50ZXJ2YWwnLCBjc3QuV09SS0VSX0lOVEVSVkFMKTtcclxuICAgIGZtdC5maWVsZCgnUHJvY2VzcyBkdW1wIGZpbGUnLCBjc3QuRFVNUF9GSUxFX1BBVEgpO1xyXG4gICAgZm10LmZpZWxkKCdDb25jdXJyZW50IGFjdGlvbnMnLCBjc3QuQ09OQ1VSUkVOVF9BQ1RJT05TKTtcclxuICAgIGZtdC5maWVsZCgnU0lHVEVSTSB0aW1lb3V0JywgY3N0LktJTExfVElNRU9VVCk7XHJcbiAgICBmbXQuc2VwKCk7XHJcbiAgfTtcclxuXHJcbiAgLy8gV3JpdGUgRGFlbW9uIFBJRCBpbnRvIGZpbGVcclxuICB0cnkge1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyh0aGF0LnBpZF9wYXRoLCBwcm9jZXNzLnBpZC50b1N0cmluZygpKTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XHJcbiAgfVxyXG5cclxuICBpZiAodGhpcy5pZ25vcmVfc2lnbmFscyAhPSB0cnVlKVxyXG4gICAgdGhpcy5oYW5kbGVTaWduYWxzKCk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFB1YiBzeXN0ZW0gZm9yIHJlYWwgdGltZSBub3RpZmljYXRpb25zXHJcbiAgICovXHJcbiAgdGhpcy5wdWIgPSBheG9uLnNvY2tldCgncHViLWVtaXR0ZXInKTtcclxuXHJcbiAgdGhpcy5wdWJfc29ja2V0ID0gdGhpcy5wdWIuYmluZCh0aGlzLnB1Yl9zb2NrZXRfZmlsZSk7XHJcblxyXG4gIHRoaXMucHViX3NvY2tldC5vbmNlKCdiaW5kJywgZnVuY3Rpb24gKCkge1xyXG4gICAgZnMuY2htb2QodGhhdC5wdWJfc29ja2V0X2ZpbGUsICc3NzUnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICBpZiAoZSkgY29uc29sZS5lcnJvcihlKTtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52LlBNMl9TT0NLRVRfVVNFUiAmJiBwcm9jZXNzLmVudi5QTTJfU09DS0VUX0dST1VQKVxyXG4gICAgICAgICAgZnMuY2hvd24odGhhdC5wdWJfc29ja2V0X2ZpbGUsXHJcbiAgICAgICAgICAgIHBhcnNlSW50KHByb2Nlc3MuZW52LlBNMl9TT0NLRVRfVVNFUiksXHJcbiAgICAgICAgICAgIHBhcnNlSW50KHByb2Nlc3MuZW52LlBNMl9TT0NLRVRfR1JPVVApLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgIGlmIChlKSBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHRoYXQucHViX3NvY2tldF9yZWFkeSA9IHRydWU7XHJcbiAgICB0aGF0LnNlbmRSZWFkeShjYik7XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlcC9SZXEgLSBSUEMgc3lzdGVtIHRvIGludGVyYWN0IHdpdGggR29kXHJcbiAgICovXHJcbiAgdGhpcy5yZXAgPSBheG9uLnNvY2tldCgncmVwJyk7XHJcblxyXG4gIHZhciBzZXJ2ZXIgPSBuZXcgcnBjLlNlcnZlcih0aGlzLnJlcCk7XHJcblxyXG4gIHRoaXMucnBjX3NvY2tldCA9IHRoaXMucmVwLmJpbmQodGhpcy5ycGNfc29ja2V0X2ZpbGUpO1xyXG5cclxuICB0aGlzLnJwY19zb2NrZXQub25jZSgnYmluZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIGZzLmNobW9kKHRoYXQucnBjX3NvY2tldF9maWxlLCAnNzc1JywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgaWYgKGUpIGNvbnNvbGUuZXJyb3IoZSk7XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5QTTJfU09DS0VUX1VTRVIgJiYgcHJvY2Vzcy5lbnYuUE0yX1NPQ0tFVF9HUk9VUClcclxuICAgICAgICAgIGZzLmNob3duKHRoYXQucnBjX3NvY2tldF9maWxlLFxyXG4gICAgICAgICAgICBwYXJzZUludChwcm9jZXNzLmVudi5QTTJfU09DS0VUX1VTRVIpLFxyXG4gICAgICAgICAgICBwYXJzZUludChwcm9jZXNzLmVudi5QTTJfU09DS0VUX0dST1VQKSwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICBpZiAoZSkgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgdGhhdC5ycGNfc29ja2V0X3JlYWR5ID0gdHJ1ZTtcclxuICAgIHRoYXQuc2VuZFJlYWR5KGNiKTtcclxuICB9KTtcclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIE1lbW9yeSBTbmFwc2hvdFxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHByb2ZpbGUodHlwZSwgbXNnLCBjYikge1xyXG4gICAgaWYgKHNlbXZlci5zYXRpc2ZpZXMocHJvY2Vzcy52ZXJzaW9uLCAnPCA4JykpXHJcbiAgICAgIHJldHVybiBjYihudWxsLCB7IGVycm9yOiAnTm9kZS5qcyBpcyBub3Qgb24gcmlnaHQgdmVyc2lvbicgfSlcclxuXHJcbiAgICB2YXIgY21kXHJcblxyXG4gICAgaWYgKHR5cGUgPT09ICdjcHUnKSB7XHJcbiAgICAgIGNtZCA9IHtcclxuICAgICAgICBlbmFibGU6ICdQcm9maWxlci5lbmFibGUnLFxyXG4gICAgICAgIHN0YXJ0OiAnUHJvZmlsZXIuc3RhcnQnLFxyXG4gICAgICAgIHN0b3A6ICdQcm9maWxlci5zdG9wJyxcclxuICAgICAgICBkaXNhYmxlOiAnUHJvZmlsZXIuZGlzYWJsZSdcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHR5cGUgPT0gJ21lbScpIHtcclxuICAgICAgY21kID0ge1xyXG4gICAgICAgIGVuYWJsZTogJ0hlYXBQcm9maWxlci5lbmFibGUnLFxyXG4gICAgICAgIHN0YXJ0OiAnSGVhcFByb2ZpbGVyLnN0YXJ0U2FtcGxpbmcnLFxyXG4gICAgICAgIHN0b3A6ICdIZWFwUHJvZmlsZXIuc3RvcFNhbXBsaW5nJyxcclxuICAgICAgICBkaXNhYmxlOiAnSGVhcFByb2ZpbGVyLmRpc2FibGUnXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpbnNwZWN0b3IgPSByZXF1aXJlKCdpbnNwZWN0b3InKVxyXG4gICAgdmFyIHNlc3Npb24gPSBuZXcgaW5zcGVjdG9yLlNlc3Npb24oKVxyXG5cclxuICAgIHNlc3Npb24uY29ubmVjdCgpXHJcblxyXG4gICAgdmFyIHRpbWVvdXQgPSBtc2cudGltZW91dCB8fCA1MDAwXHJcblxyXG4gICAgc2Vzc2lvbi5wb3N0KGNtZC5lbmFibGUsIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgaWYgKGVycikgcmV0dXJuIGNiKG51bGwsIHsgZXJyb3I6IGVyci5tZXNzYWdlIHx8IGVyciB9KVxyXG5cclxuICAgICAgY29uc29sZS5sb2coYFN0YXJ0aW5nICR7Y21kLnN0YXJ0fWApXHJcbiAgICAgIHNlc3Npb24ucG9zdChjbWQuc3RhcnQsIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IobnVsbCwgeyBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgZXJyIH0pXHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgc2Vzc2lvbi5wb3N0KGNtZC5zdG9wLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYihudWxsLCB7IGVycm9yOiBlcnIubWVzc2FnZSB8fCBlcnIgfSlcclxuICAgICAgICAgICAgY29uc3QgcHJvZmlsZSA9IGRhdGEucHJvZmlsZVxyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFN0b3BwaW5nICR7Y21kLnN0b3B9YClcclxuICAgICAgICAgICAgc2Vzc2lvbi5wb3N0KGNtZC5kaXNhYmxlKVxyXG5cclxuICAgICAgICAgICAgZnMud3JpdGVGaWxlKG1zZy5wd2QsIEpTT04uc3RyaW5naWZ5KHByb2ZpbGUpLCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKG51bGwsIHsgZXJyb3I6IGVyci5tZXNzYWdlIHx8IGVyciB9KVxyXG4gICAgICAgICAgICAgIHJldHVybiBjYihudWxsLCB7IGZpbGU6IG1zZy5wd2QgfSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSwgdGltZW91dClcclxuICAgICAgfSlcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBzZXJ2ZXIuZXhwb3NlKHtcclxuICAgIGtpbGxNZTogdGhhdC5jbG9zZS5iaW5kKHRoaXMpLFxyXG4gICAgcHJvZmlsZUNQVTogcHJvZmlsZS5iaW5kKHRoaXMsICdjcHUnKSxcclxuICAgIHByb2ZpbGVNRU06IHByb2ZpbGUuYmluZCh0aGlzLCAnbWVtJyksXHJcbiAgICBwcmVwYXJlOiBHb2QucHJlcGFyZSxcclxuICAgIGxhdW5jaFN5c01vbml0b3Jpbmc6IEdvZC5sYXVuY2hTeXNNb25pdG9yaW5nLFxyXG4gICAgZ2V0TW9uaXRvckRhdGE6IEdvZC5nZXRNb25pdG9yRGF0YSxcclxuICAgIGdldFN5c3RlbURhdGE6IEdvZC5nZXRTeXN0ZW1EYXRhLFxyXG5cclxuICAgIHN0YXJ0UHJvY2Vzc0lkOiBHb2Quc3RhcnRQcm9jZXNzSWQsXHJcbiAgICBzdG9wUHJvY2Vzc0lkOiBHb2Quc3RvcFByb2Nlc3NJZCxcclxuICAgIHJlc3RhcnRQcm9jZXNzSWQ6IEdvZC5yZXN0YXJ0UHJvY2Vzc0lkLFxyXG4gICAgZGVsZXRlUHJvY2Vzc0lkOiBHb2QuZGVsZXRlUHJvY2Vzc0lkLFxyXG5cclxuICAgIHNlbmRMaW5lVG9TdGRpbjogR29kLnNlbmRMaW5lVG9TdGRpbixcclxuICAgIHNvZnRSZWxvYWRQcm9jZXNzSWQ6IEdvZC5zb2Z0UmVsb2FkUHJvY2Vzc0lkLFxyXG4gICAgcmVsb2FkUHJvY2Vzc0lkOiBHb2QucmVsb2FkUHJvY2Vzc0lkLFxyXG4gICAgZHVwbGljYXRlUHJvY2Vzc0lkOiBHb2QuZHVwbGljYXRlUHJvY2Vzc0lkLFxyXG4gICAgcmVzZXRNZXRhUHJvY2Vzc0lkOiBHb2QucmVzZXRNZXRhUHJvY2Vzc0lkLFxyXG4gICAgc3RvcFdhdGNoOiBHb2Quc3RvcFdhdGNoLFxyXG4gICAgc3RhcnRXYXRjaDogR29kLnN0YXJ0V2F0Y2gsXHJcbiAgICB0b2dnbGVXYXRjaDogR29kLnRvZ2dsZVdhdGNoLFxyXG4gICAgbm90aWZ5QnlQcm9jZXNzSWQ6IEdvZC5ub3RpZnlCeVByb2Nlc3NJZCxcclxuXHJcbiAgICBub3RpZnlLaWxsUE0yOiBHb2Qubm90aWZ5S2lsbFBNMixcclxuICAgIG1vbml0b3I6IEdvZC5tb25pdG9yLFxyXG4gICAgdW5tb25pdG9yOiBHb2QudW5tb25pdG9yLFxyXG5cclxuICAgIG1zZ1Byb2Nlc3M6IEdvZC5tc2dQcm9jZXNzLFxyXG4gICAgc2VuZERhdGFUb1Byb2Nlc3NJZDogR29kLnNlbmREYXRhVG9Qcm9jZXNzSWQsXHJcbiAgICBzZW5kU2lnbmFsVG9Qcm9jZXNzSWQ6IEdvZC5zZW5kU2lnbmFsVG9Qcm9jZXNzSWQsXHJcbiAgICBzZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZTogR29kLnNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lLFxyXG5cclxuICAgIHBpbmc6IEdvZC5waW5nLFxyXG4gICAgZ2V0VmVyc2lvbjogR29kLmdldFZlcnNpb24sXHJcbiAgICBnZXRSZXBvcnQ6IEdvZC5nZXRSZXBvcnQsXHJcbiAgICByZWxvYWRMb2dzOiBHb2QucmVsb2FkTG9nc1xyXG4gIH0pO1xyXG5cclxuICB0aGlzLnN0YXJ0TG9naWMoKTtcclxufVxyXG5cclxuRGFlbW9uLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uIChvcHRzLCBjYikge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgR29kLmJ1cy5lbWl0KCdwbTI6a2lsbCcsIHtcclxuICAgIHN0YXR1czogJ2tpbGxlZCcsXHJcbiAgICBtc2c6ICdwbTIgaGFzIGJlZW4ga2lsbGVkIHZpYSBDTEknXHJcbiAgfSk7XHJcblxyXG4gIGlmIChHb2Quc3lzdGVtX2luZm9zX3Byb2MgIT09IG51bGwpXHJcbiAgICBHb2Quc3lzdGVtX2luZm9zX3Byb2Mua2lsbCgpXHJcblxyXG4gIC8qKlxyXG4gICAqIENsZWFubHkga2lsbCBwbTJcclxuICAgKi9cclxuICB0aGF0LnJwY19zb2NrZXQuY2xvc2UoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC5wdWJfc29ja2V0LmNsb3NlKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgIC8vIG5vdGlmeSBjbGkgdGhhdCB0aGUgZGFlbW9uIGlzIHNodXRpbmcgZG93biAob25seSB1bmRlciB1bml4IHNpbmNlIHdpbmRvd3MgZG9lc250IGhhbmRsZSBzaWduYWxzKVxyXG4gICAgICBpZiAoY3N0LklTX1dJTkRPV1MgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIHByb2Nlc3Mua2lsbChwYXJzZUludChvcHRzLnBpZCksICdTSUdRVUlUJyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcignQ291bGQgbm90IHNlbmQgU0lHUVVJVCB0byBDTEknKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgZnMudW5saW5rU3luYyh0aGF0LnBpZF9wYXRoKTtcclxuICAgICAgfSBjYXRjaCAoZSkgeyB9XHJcblxyXG4gICAgICBjb25zb2xlLmxvZygnUE0yIHN1Y2Nlc3NmdWxseSBzdG9wcGVkJyk7XHJcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHByb2Nlc3MuZXhpdChjc3QuU1VDQ0VTU19FWElUKTtcclxuICAgICAgfSwgMik7XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuRGFlbW9uLnByb3RvdHlwZS5oYW5kbGVTaWduYWxzID0gZnVuY3Rpb24gKCkge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgcHJvY2Vzcy5vbignU0lHVEVSTScsIHRoYXQuZ3JhY2VmdWxsRXhpdC5iaW5kKHRoaXMpKTtcclxuICBwcm9jZXNzLm9uKCdTSUdJTlQnLCB0aGF0LmdyYWNlZnVsbEV4aXQuYmluZCh0aGlzKSk7XHJcbiAgcHJvY2Vzcy5vbignU0lHSFVQJywgZnVuY3Rpb24gKCkgeyB9KTtcclxuICBwcm9jZXNzLm9uKCdTSUdRVUlUJywgdGhhdC5ncmFjZWZ1bGxFeGl0LmJpbmQodGhpcykpO1xyXG4gIHByb2Nlc3Mub24oJ1NJR1VTUjInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBHb2QucmVsb2FkTG9ncyh7fSwgZnVuY3Rpb24gKCkgeyB9KTtcclxuICB9KTtcclxufVxyXG5cclxuRGFlbW9uLnByb3RvdHlwZS5zZW5kUmVhZHkgPSBmdW5jdGlvbiAoY2IpIHtcclxuICAvLyBTZW5kIHJlYWR5IG1lc3NhZ2UgdG8gQ2xpZW50XHJcbiAgaWYgKHRoaXMucnBjX3NvY2tldF9yZWFkeSA9PSB0cnVlICYmIHRoaXMucHViX3NvY2tldF9yZWFkeSA9PSB0cnVlKSB7XHJcbiAgICBjYihudWxsLCB7XHJcbiAgICAgIHBpZDogcHJvY2Vzcy5waWQsXHJcbiAgICAgIHBtMl92ZXJzaW9uOiBwa2cudmVyc2lvblxyXG4gICAgfSk7XHJcbiAgICBpZiAodHlwZW9mIChwcm9jZXNzLnNlbmQpICE9ICdmdW5jdGlvbicpXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICBwcm9jZXNzLnNlbmQoe1xyXG4gICAgICBvbmxpbmU6IHRydWUsXHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIHBpZDogcHJvY2Vzcy5waWQsXHJcbiAgICAgIHBtMl92ZXJzaW9uOiBwa2cudmVyc2lvblxyXG4gICAgfSk7XHJcbiAgfTtcclxufVxyXG5cclxuRGFlbW9uLnByb3RvdHlwZS5ncmFjZWZ1bGxFeGl0ID0gZnVuY3Rpb24gKCkge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgLy8gbmV2ZXIgZXhlY3V0ZSBtdWx0aXBsZSBncmFjZWZ1bGxFeGl0IHNpbXVsdGFuZW91c2x5XHJcbiAgLy8gdGhpcyBjYW4gbGVhZCB0byBsb3NzIG9mIHNvbWUgYXBwcyBpbiBkdW1wIGZpbGVcclxuICBpZiAodGhpcy5pc0V4aXRpbmcpIHJldHVyblxyXG5cclxuICB0aGlzLmlzRXhpdGluZyA9IHRydWVcclxuXHJcbiAgR29kLmJ1cy5lbWl0KCdwbTI6a2lsbCcsIHtcclxuICAgIHN0YXR1czogJ2tpbGxlZCcsXHJcbiAgICBtc2c6ICdwbTIgaGFzIGJlZW4ga2lsbGVkIGJ5IFNJR05BTCdcclxuICB9KTtcclxuXHJcbiAgY29uc29sZS5sb2coJ3BtMiBoYXMgYmVlbiBraWxsZWQgYnkgc2lnbmFsLCBkdW1waW5nIHByb2Nlc3MgbGlzdCBiZWZvcmUgZXhpdC4uLicpO1xyXG5cclxuICBpZiAoR29kLnN5c3RlbV9pbmZvc19wcm9jICE9PSBudWxsKVxyXG4gICAgR29kLnN5c3RlbV9pbmZvc19wcm9jLmtpbGwoKVxyXG5cclxuICBHb2QuZHVtcFByb2Nlc3NMaXN0KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICB2YXIgcHJvY2Vzc2VzID0gR29kLmdldEZvcm1hdGVkUHJvY2Vzc2VzKCk7XHJcblxyXG4gICAgZWFjaExpbWl0KHByb2Nlc3NlcywgMSwgZnVuY3Rpb24gKHByb2MsIG5leHQpIHtcclxuICAgICAgY29uc29sZS5sb2coJ0RlbGV0aW5nIHByb2Nlc3MgJXMnLCBwcm9jLnBtMl9lbnYucG1faWQpO1xyXG4gICAgICBHb2QuZGVsZXRlUHJvY2Vzc0lkKHByb2MucG0yX2Vudi5wbV9pZCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBuZXh0KCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGZzLnVubGlua1N5bmModGhhdC5waWRfcGF0aCk7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHsgfVxyXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGF0LmlzRXhpdGluZyA9IGZhbHNlXHJcbiAgICAgICAgY29uc29sZS5sb2coJ0V4aXRlZCBwZWFjZWZ1bGx5Jyk7XHJcbiAgICAgICAgcHJvY2Vzcy5leGl0KGNzdC5TVUNDRVNTX0VYSVQpO1xyXG4gICAgICB9LCAyKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5EYWVtb24ucHJvdG90eXBlLnN0YXJ0TG9naWMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAvKipcclxuICAgKiBBY3Rpb24gdHJlYXRtZW50IHNwZWNpZmljc1xyXG4gICAqIEF0dGFjaCBhY3Rpb25zIHRvIHBtMl9lbnYuYXhtX2FjdGlvbnMgdmFyaWFibGVzIChuYW1lICsgb3B0aW9ucylcclxuICAgKi9cclxuICBHb2QuYnVzLm9uKCdheG06YWN0aW9uJywgZnVuY3Rpb24gYXhtQWN0aW9ucyhtc2cpIHtcclxuICAgIHZhciBwbTJfZW52ID0gbXNnLnByb2Nlc3M7XHJcbiAgICB2YXIgZXhpc3RzID0gZmFsc2U7XHJcbiAgICB2YXIgYXhtX2FjdGlvbiA9IG1zZy5kYXRhO1xyXG5cclxuICAgIGlmICghcG0yX2VudiB8fCAhR29kLmNsdXN0ZXJzX2RiW3BtMl9lbnYucG1faWRdKVxyXG4gICAgICByZXR1cm4gY29uc29sZS5lcnJvcignQVhNIEFDVElPTiBVbmtub3duIGlkICVzJywgcG0yX2Vudi5wbV9pZCk7XHJcblxyXG4gICAgaWYgKCFHb2QuY2x1c3RlcnNfZGJbcG0yX2Vudi5wbV9pZF0ucG0yX2Vudi5heG1fYWN0aW9ucylcclxuICAgICAgR29kLmNsdXN0ZXJzX2RiW3BtMl9lbnYucG1faWRdLnBtMl9lbnYuYXhtX2FjdGlvbnMgPSBbXTtcclxuXHJcbiAgICBHb2QuY2x1c3RlcnNfZGJbcG0yX2Vudi5wbV9pZF0ucG0yX2Vudi5heG1fYWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChhY3Rpb25zKSB7XHJcbiAgICAgIGlmIChhY3Rpb25zLmFjdGlvbl9uYW1lID09IGF4bV9hY3Rpb24uYWN0aW9uX25hbWUpXHJcbiAgICAgICAgZXhpc3RzID0gdHJ1ZTtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChleGlzdHMgPT09IGZhbHNlKSB7XHJcbiAgICAgIGRlYnVnKCdBZGRpbmcgYWN0aW9uJywgYXhtX2FjdGlvbik7XHJcbiAgICAgIEdvZC5jbHVzdGVyc19kYltwbTJfZW52LnBtX2lkXS5wbTJfZW52LmF4bV9hY3Rpb25zLnB1c2goYXhtX2FjdGlvbik7XHJcbiAgICB9XHJcbiAgICBtc2cgPSBudWxsO1xyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICAgKiBDb25maWd1cmUgbW9kdWxlXHJcbiAgICovXHJcbiAgR29kLmJ1cy5vbignYXhtOm9wdGlvbjpjb25maWd1cmF0aW9uJywgZnVuY3Rpb24gYXhtTW9uaXRvcihtc2cpIHtcclxuICAgIGlmICghbXNnLnByb2Nlc3MpXHJcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdbYXhtOm9wdGlvbjpjb25maWd1cmF0aW9uXSBubyBwcm9jZXNzIGRlZmluZWQnKTtcclxuXHJcbiAgICBpZiAoIUdvZC5jbHVzdGVyc19kYlttc2cucHJvY2Vzcy5wbV9pZF0pXHJcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdbYXhtOm9wdGlvbjpjb25maWd1cmF0aW9uXSBVbmtub3duIGlkICVzJywgbXNnLnByb2Nlc3MucG1faWQpO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIEFwcGxpY2F0aW9uIE5hbWUgbnZlcnJpZGVcclxuICAgICAgaWYgKG1zZy5kYXRhLm5hbWUpXHJcbiAgICAgICAgR29kLmNsdXN0ZXJzX2RiW21zZy5wcm9jZXNzLnBtX2lkXS5wbTJfZW52Lm5hbWUgPSBtc2cuZGF0YS5uYW1lO1xyXG5cclxuICAgICAgT2JqZWN0LmtleXMobXNnLmRhdGEpLmZvckVhY2goZnVuY3Rpb24gKGNvbmZfa2V5KSB7XHJcbiAgICAgICAgR29kLmNsdXN0ZXJzX2RiW21zZy5wcm9jZXNzLnBtX2lkXS5wbTJfZW52LmF4bV9vcHRpb25zW2NvbmZfa2V5XSA9IFV0aWxpdHkuY2xvbmUobXNnLmRhdGFbY29uZl9rZXldKTtcclxuICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcclxuICAgIH1cclxuICAgIG1zZyA9IG51bGw7XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFByb2Nlc3MgbW9uaXRvcmluZyBkYXRhIChwcm9iZXMpXHJcbiAgICovXHJcbiAgR29kLmJ1cy5vbignYXhtOm1vbml0b3InLCBmdW5jdGlvbiBheG1Nb25pdG9yKG1zZykge1xyXG4gICAgaWYgKCFtc2cucHJvY2VzcylcclxuICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ1theG06bW9uaXRvcl0gbm8gcHJvY2VzcyBkZWZpbmVkJyk7XHJcblxyXG4gICAgaWYgKCFtc2cucHJvY2VzcyB8fCAhR29kLmNsdXN0ZXJzX2RiW21zZy5wcm9jZXNzLnBtX2lkXSlcclxuICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0FYTSBNT05JVE9SIFVua25vd24gaWQgJXMnLCBtc2cucHJvY2Vzcy5wbV9pZCk7XHJcblxyXG4gICAgdXRpbC5pbmhlcml0cyhHb2QuY2x1c3RlcnNfZGJbbXNnLnByb2Nlc3MucG1faWRdLnBtMl9lbnYuYXhtX21vbml0b3IsIFV0aWxpdHkuY2xvbmUobXNnLmRhdGEpKTtcclxuICAgIG1zZyA9IG51bGw7XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEJyb2FkY2FzdCBtZXNzYWdlc1xyXG4gICAqL1xyXG4gIEdvZC5idXMub25BbnkoZnVuY3Rpb24gKGV2ZW50LCBkYXRhX3YpIHtcclxuICAgIGlmIChbJ2F4bTphY3Rpb24nLFxyXG4gICAgICAnYXhtOm1vbml0b3InLFxyXG4gICAgICAnYXhtOm9wdGlvbjpzZXRQSUQnLFxyXG4gICAgICAnYXhtOm9wdGlvbjpjb25maWd1cmF0aW9uJ10uaW5kZXhPZihldmVudCkgPiAtMSkge1xyXG4gICAgICBkYXRhX3YgPSBudWxsO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICB0aGF0LnB1Yi5lbWl0KGV2ZW50LCBVdGlsaXR5LmNsb25lKGRhdGFfdikpO1xyXG4gICAgZGF0YV92ID0gbnVsbDtcclxuICB9KTtcclxufTtcclxuXHJcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xyXG4gIHByb2Nlc3MudGl0bGUgPSBwcm9jZXNzLmVudi5QTTJfREFFTU9OX1RJVExFIHx8ICdQTTIgdicgKyBwa2cudmVyc2lvbiArICc6IEdvZCBEYWVtb24gKCcgKyBwcm9jZXNzLmVudi5QTTJfSE9NRSArICcpJztcclxuXHJcbiAgdmFyIGRhZW1vbiA9IG5ldyBEYWVtb24oKTtcclxuXHJcbiAgZGFlbW9uLnN0YXJ0KCk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IERhZW1vbjtcclxuIl19