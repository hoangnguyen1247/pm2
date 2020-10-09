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

var _child_process = require("child_process");

var _inspector = _interopRequireDefault(require("inspector"));

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
    var fork_new_pm2 = (0, _child_process.spawn)('node', [path, 'update'], {
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

    var session = new _inspector["default"].Session();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9EYWVtb24udHMiXSwibmFtZXMiOlsiZGVidWciLCJEYWVtb24iLCJvcHRzIiwiaWdub3JlX3NpZ25hbHMiLCJycGNfc29ja2V0X3JlYWR5IiwicHViX3NvY2tldF9yZWFkeSIsInB1Yl9zb2NrZXRfZmlsZSIsImNzdCIsIkRBRU1PTl9QVUJfUE9SVCIsInJwY19zb2NrZXRfZmlsZSIsIkRBRU1PTl9SUENfUE9SVCIsInBpZF9wYXRoIiwicGlkX2ZpbGUiLCJQTTJfUElEX0ZJTEVfUEFUSCIsInByb3RvdHlwZSIsInN0YXJ0IiwidGhhdCIsImQiLCJkb21haW4iLCJjcmVhdGUiLCJvbmNlIiwiZXJyIiwiZm10Iiwic2VwIiwidGl0bGUiLCJmaWVsZCIsIkRhdGUiLCJjb25zb2xlIiwiZXJyb3IiLCJtZXNzYWdlIiwic3RhY2siLCJwYXRoIiwiSVNfV0lORE9XUyIsIl9fZGlybmFtZSIsInByb2Nlc3MiLCJlbnYiLCJmb3JrX25ld19wbTIiLCJkZXRhY2hlZCIsInN0ZGlvIiwib24iLCJsb2ciLCJleGl0IiwicnVuIiwiaW5uZXJTdGFydCIsImNiIiwicGtnIiwidmVyc2lvbiIsInZlcnNpb25zIiwibm9kZSIsImFyY2giLCJQTTJfSE9NRSIsIkRFRkFVTFRfTE9HX1BBVEgiLCJXT1JLRVJfSU5URVJWQUwiLCJEVU1QX0ZJTEVfUEFUSCIsIkNPTkNVUlJFTlRfQUNUSU9OUyIsIktJTExfVElNRU9VVCIsImZzIiwid3JpdGVGaWxlU3luYyIsInBpZCIsInRvU3RyaW5nIiwiZSIsImhhbmRsZVNpZ25hbHMiLCJwdWIiLCJheG9uIiwic29ja2V0IiwicHViX3NvY2tldCIsImJpbmQiLCJjaG1vZCIsIlBNMl9TT0NLRVRfVVNFUiIsIlBNMl9TT0NLRVRfR1JPVVAiLCJjaG93biIsInBhcnNlSW50Iiwic2VuZFJlYWR5IiwicmVwIiwic2VydmVyIiwicnBjIiwiU2VydmVyIiwicnBjX3NvY2tldCIsInByb2ZpbGUiLCJ0eXBlIiwibXNnIiwic2VtdmVyIiwic2F0aXNmaWVzIiwiY21kIiwiZW5hYmxlIiwic3RvcCIsImRpc2FibGUiLCJzZXNzaW9uIiwiaW5zcGVjdG9yIiwiU2Vzc2lvbiIsImNvbm5lY3QiLCJ0aW1lb3V0IiwicG9zdCIsImRhdGEiLCJzZXRUaW1lb3V0Iiwid3JpdGVGaWxlIiwicHdkIiwiSlNPTiIsInN0cmluZ2lmeSIsImZpbGUiLCJleHBvc2UiLCJraWxsTWUiLCJjbG9zZSIsInByb2ZpbGVDUFUiLCJwcm9maWxlTUVNIiwicHJlcGFyZSIsIkdvZCIsImxhdW5jaFN5c01vbml0b3JpbmciLCJnZXRNb25pdG9yRGF0YSIsImdldFN5c3RlbURhdGEiLCJzdGFydFByb2Nlc3NJZCIsInN0b3BQcm9jZXNzSWQiLCJyZXN0YXJ0UHJvY2Vzc0lkIiwiZGVsZXRlUHJvY2Vzc0lkIiwic2VuZExpbmVUb1N0ZGluIiwic29mdFJlbG9hZFByb2Nlc3NJZCIsInJlbG9hZFByb2Nlc3NJZCIsImR1cGxpY2F0ZVByb2Nlc3NJZCIsInJlc2V0TWV0YVByb2Nlc3NJZCIsInN0b3BXYXRjaCIsInN0YXJ0V2F0Y2giLCJ0b2dnbGVXYXRjaCIsIm5vdGlmeUJ5UHJvY2Vzc0lkIiwibm90aWZ5S2lsbFBNMiIsIm1vbml0b3IiLCJ1bm1vbml0b3IiLCJtc2dQcm9jZXNzIiwic2VuZERhdGFUb1Byb2Nlc3NJZCIsInNlbmRTaWduYWxUb1Byb2Nlc3NJZCIsInNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lIiwicGluZyIsImdldFZlcnNpb24iLCJnZXRSZXBvcnQiLCJyZWxvYWRMb2dzIiwic3RhcnRMb2dpYyIsImJ1cyIsImVtaXQiLCJzdGF0dXMiLCJzeXN0ZW1faW5mb3NfcHJvYyIsImtpbGwiLCJ1bmxpbmtTeW5jIiwiU1VDQ0VTU19FWElUIiwiZ3JhY2VmdWxsRXhpdCIsInBtMl92ZXJzaW9uIiwic2VuZCIsIm9ubGluZSIsInN1Y2Nlc3MiLCJpc0V4aXRpbmciLCJkdW1wUHJvY2Vzc0xpc3QiLCJwcm9jZXNzZXMiLCJnZXRGb3JtYXRlZFByb2Nlc3NlcyIsInByb2MiLCJuZXh0IiwicG0yX2VudiIsInBtX2lkIiwiYXhtQWN0aW9ucyIsImV4aXN0cyIsImF4bV9hY3Rpb24iLCJjbHVzdGVyc19kYiIsImF4bV9hY3Rpb25zIiwiZm9yRWFjaCIsImFjdGlvbnMiLCJhY3Rpb25fbmFtZSIsInB1c2giLCJheG1Nb25pdG9yIiwibmFtZSIsIk9iamVjdCIsImtleXMiLCJjb25mX2tleSIsImF4bV9vcHRpb25zIiwiVXRpbGl0eSIsImNsb25lIiwidXRpbCIsImluaGVyaXRzIiwiYXhtX21vbml0b3IiLCJvbkFueSIsImV2ZW50IiwiZGF0YV92IiwiaW5kZXhPZiIsInJlcXVpcmUiLCJtYWluIiwibW9kdWxlIiwiUE0yX0RBRU1PTl9USVRMRSIsImRhZW1vbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBTUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBcEJBOzs7OztBQXNCQSxJQUFNQSxLQUFLLEdBQUcsdUJBQVksWUFBWixDQUFkOztBQUVBLElBQUlDLE1BQU0sR0FBRyxTQUFUQSxNQUFTLENBQVVDLElBQVYsRUFBaUI7QUFDNUIsTUFBSSxDQUFDQSxJQUFMLEVBQVdBLElBQUksR0FBRyxFQUFQO0FBRVgsT0FBS0MsY0FBTCxHQUFzQkQsSUFBSSxDQUFDQyxjQUFMLElBQXVCLEtBQTdDO0FBQ0EsT0FBS0MsZ0JBQUwsR0FBd0IsS0FBeEI7QUFDQSxPQUFLQyxnQkFBTCxHQUF3QixLQUF4QjtBQUVBLE9BQUtDLGVBQUwsR0FBdUJKLElBQUksQ0FBQ0ksZUFBTCxJQUF3QkMsc0JBQUlDLGVBQW5EO0FBQ0EsT0FBS0MsZUFBTCxHQUF1QlAsSUFBSSxDQUFDTyxlQUFMLElBQXdCRixzQkFBSUcsZUFBbkQ7QUFFQSxPQUFLQyxRQUFMLEdBQWdCVCxJQUFJLENBQUNVLFFBQUwsSUFBaUJMLHNCQUFJTSxpQkFBckM7QUFDRCxDQVhEOztBQWFBWixN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QUFjM0YsR0FBRyxDQUFDYSxJQUFsQixDQUF0RTs7QUFDQWIsSUFBQUEsR0FBRyxHQUFHLElBQU47QUFDRCxHQVREO0FBV0E7Ozs7O0FBR0EwQixrQkFBSTZCLEdBQUosQ0FBUXdDLEtBQVIsQ0FBYyxVQUFVQyxLQUFWLEVBQWlCQyxNQUFqQixFQUF5QjtBQUNyQyxRQUFJLENBQUMsWUFBRCxFQUNGLGFBREUsRUFFRixtQkFGRSxFQUdGLDBCQUhFLEVBRzBCQyxPQUgxQixDQUdrQ0YsS0FIbEMsSUFHMkMsQ0FBQyxDQUhoRCxFQUdtRDtBQUNqREMsTUFBQUEsTUFBTSxHQUFHLElBQVQ7QUFDQSxhQUFPLEtBQVA7QUFDRDs7QUFDRGpLLElBQUFBLElBQUksQ0FBQzhDLEdBQUwsQ0FBUzBFLElBQVQsQ0FBY3dDLEtBQWQsRUFBcUJOLG9CQUFRQyxLQUFSLENBQWNNLE1BQWQsQ0FBckI7QUFDQUEsSUFBQUEsTUFBTSxHQUFHLElBQVQ7QUFDRCxHQVZEO0FBV0QsQ0FsRkQ7O0FBb0ZBLElBQUlFLE9BQU8sQ0FBQ0MsSUFBUixLQUFpQkMsTUFBckIsRUFBNkI7QUFDM0JuSixFQUFBQSxPQUFPLENBQUNWLEtBQVIsR0FBZ0JVLE9BQU8sQ0FBQ0MsR0FBUixDQUFZbUosZ0JBQVosSUFBZ0MsVUFBVXpJLG9CQUFJQyxPQUFkLEdBQXdCLGdCQUF4QixHQUEyQ1osT0FBTyxDQUFDQyxHQUFSLENBQVllLFFBQXZELEdBQWtFLEdBQWxIO0FBRUEsTUFBSXFJLE1BQU0sR0FBRyxJQUFJdEwsTUFBSixFQUFiO0FBRUFzTCxFQUFBQSxNQUFNLENBQUN4SyxLQUFQO0FBQ0Q7O2VBRWNkLE0iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuICovXG5cbmltcG9ydCBkZWJ1Z0xvZ2dlciBmcm9tICdkZWJ1Zyc7XG5pbXBvcnQgcGtnIGZyb20gJy4uL3BhY2thZ2UuanNvbic7XG5pbXBvcnQgY3N0IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgcnBjIGZyb20gJ3BtMi1heG9uLXJwYyc7XG5pbXBvcnQgYXhvbiBmcm9tICdwbTItYXhvbic7XG5pbXBvcnQgZG9tYWluIGZyb20gJ2RvbWFpbic7XG5pbXBvcnQgVXRpbGl0eSBmcm9tICcuL1V0aWxpdHkuanMnO1xuaW1wb3J0IHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IEdvZCBmcm9tICcuL0dvZCc7XG5pbXBvcnQgZWFjaExpbWl0IGZyb20gJ2FzeW5jL2VhY2hMaW1pdCc7XG5pbXBvcnQgKiBhcyBmbXQgZnJvbSAnLi90b29scy9mbXQnO1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBpbnNwZWN0b3IgZnJvbSAnaW5zcGVjdG9yJ1xuXG5jb25zdCBkZWJ1ZyA9IGRlYnVnTG9nZ2VyKCdwbTI6ZGFlbW9uJyk7XG5cbnZhciBEYWVtb24gPSBmdW5jdGlvbiAob3B0cz8pIHtcbiAgaWYgKCFvcHRzKSBvcHRzID0ge307XG5cbiAgdGhpcy5pZ25vcmVfc2lnbmFscyA9IG9wdHMuaWdub3JlX3NpZ25hbHMgfHwgZmFsc2U7XG4gIHRoaXMucnBjX3NvY2tldF9yZWFkeSA9IGZhbHNlO1xuICB0aGlzLnB1Yl9zb2NrZXRfcmVhZHkgPSBmYWxzZTtcblxuICB0aGlzLnB1Yl9zb2NrZXRfZmlsZSA9IG9wdHMucHViX3NvY2tldF9maWxlIHx8IGNzdC5EQUVNT05fUFVCX1BPUlQ7XG4gIHRoaXMucnBjX3NvY2tldF9maWxlID0gb3B0cy5ycGNfc29ja2V0X2ZpbGUgfHwgY3N0LkRBRU1PTl9SUENfUE9SVDtcblxuICB0aGlzLnBpZF9wYXRoID0gb3B0cy5waWRfZmlsZSB8fCBjc3QuUE0yX1BJRF9GSUxFX1BBVEg7XG59O1xuXG5EYWVtb24ucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdGhhdCA9IHRoaXM7XG4gIHZhciBkID0gZG9tYWluLmNyZWF0ZSgpO1xuXG4gIGQub25jZSgnZXJyb3InLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgZm10LnNlcCgpO1xuICAgIGZtdC50aXRsZSgnUE0yIGdsb2JhbCBlcnJvciBjYXVnaHQnKTtcbiAgICBmbXQuZmllbGQoJ1RpbWUnLCBuZXcgRGF0ZSgpKTtcbiAgICBjb25zb2xlLmVycm9yKGVyci5tZXNzYWdlKTtcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gICAgZm10LnNlcCgpO1xuXG4gICAgY29uc29sZS5lcnJvcignW1BNMl0gUmVzdXJyZWN0aW5nIFBNMicpO1xuXG4gICAgdmFyIHBhdGggPSBjc3QuSVNfV0lORE9XUyA/IF9fZGlybmFtZSArICcvLi4vYmluL3BtMicgOiBwcm9jZXNzLmVudlsnXyddO1xuICAgIHZhciBmb3JrX25ld19wbTIgPSBzcGF3bignbm9kZScsIFtwYXRoLCAndXBkYXRlJ10sIHtcbiAgICAgIGRldGFjaGVkOiB0cnVlLFxuICAgICAgc3RkaW86ICdpbmhlcml0J1xuICAgIH0pO1xuXG4gICAgZm9ya19uZXdfcG0yLm9uKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdQTTIgc3VjY2Vzc2Z1bGx5IGZvcmtlZCcpO1xuICAgICAgcHJvY2Vzcy5leGl0KDApO1xuICAgIH0pXG5cbiAgfSk7XG5cbiAgZC5ydW4oZnVuY3Rpb24gKCkge1xuICAgIHRoYXQuaW5uZXJTdGFydCgpO1xuICB9KTtcbn1cblxuRGFlbW9uLnByb3RvdHlwZS5pbm5lclN0YXJ0ID0gZnVuY3Rpb24gKGNiKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcblxuICBpZiAoIWNiKSBjYiA9IGZ1bmN0aW9uICgpIHtcbiAgICBmbXQuc2VwKCk7XG4gICAgZm10LnRpdGxlKCdOZXcgUE0yIERhZW1vbiBzdGFydGVkJyk7XG4gICAgZm10LmZpZWxkKCdUaW1lJywgbmV3IERhdGUoKSk7XG4gICAgZm10LmZpZWxkKCdQTTIgdmVyc2lvbicsIHBrZy52ZXJzaW9uKTtcbiAgICBmbXQuZmllbGQoJ05vZGUuanMgdmVyc2lvbicsIHByb2Nlc3MudmVyc2lvbnMubm9kZSk7XG4gICAgZm10LmZpZWxkKCdDdXJyZW50IGFyY2gnLCBwcm9jZXNzLmFyY2gpO1xuICAgIGZtdC5maWVsZCgnUE0yIGhvbWUnLCBjc3QuUE0yX0hPTUUpO1xuICAgIGZtdC5maWVsZCgnUE0yIFBJRCBmaWxlJywgdGhhdC5waWRfcGF0aCk7XG4gICAgZm10LmZpZWxkKCdSUEMgc29ja2V0IGZpbGUnLCB0aGF0LnJwY19zb2NrZXRfZmlsZSk7XG4gICAgZm10LmZpZWxkKCdCVVMgc29ja2V0IGZpbGUnLCB0aGF0LnB1Yl9zb2NrZXRfZmlsZSk7XG4gICAgZm10LmZpZWxkKCdBcHBsaWNhdGlvbiBsb2cgcGF0aCcsIGNzdC5ERUZBVUxUX0xPR19QQVRIKTtcbiAgICBmbXQuZmllbGQoJ1dvcmtlciBJbnRlcnZhbCcsIGNzdC5XT1JLRVJfSU5URVJWQUwpO1xuICAgIGZtdC5maWVsZCgnUHJvY2VzcyBkdW1wIGZpbGUnLCBjc3QuRFVNUF9GSUxFX1BBVEgpO1xuICAgIGZtdC5maWVsZCgnQ29uY3VycmVudCBhY3Rpb25zJywgY3N0LkNPTkNVUlJFTlRfQUNUSU9OUyk7XG4gICAgZm10LmZpZWxkKCdTSUdURVJNIHRpbWVvdXQnLCBjc3QuS0lMTF9USU1FT1VUKTtcbiAgICBmbXQuc2VwKCk7XG4gIH07XG5cbiAgLy8gV3JpdGUgRGFlbW9uIFBJRCBpbnRvIGZpbGVcbiAgdHJ5IHtcbiAgICBmcy53cml0ZUZpbGVTeW5jKHRoYXQucGlkX3BhdGgsIHByb2Nlc3MucGlkLnRvU3RyaW5nKCkpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICB9XG5cbiAgaWYgKHRoaXMuaWdub3JlX3NpZ25hbHMgIT0gdHJ1ZSlcbiAgICB0aGlzLmhhbmRsZVNpZ25hbHMoKTtcblxuICAvKipcbiAgICogUHViIHN5c3RlbSBmb3IgcmVhbCB0aW1lIG5vdGlmaWNhdGlvbnNcbiAgICovXG4gIHRoaXMucHViID0gYXhvbi5zb2NrZXQoJ3B1Yi1lbWl0dGVyJyk7XG5cbiAgdGhpcy5wdWJfc29ja2V0ID0gdGhpcy5wdWIuYmluZCh0aGlzLnB1Yl9zb2NrZXRfZmlsZSk7XG5cbiAgdGhpcy5wdWJfc29ja2V0Lm9uY2UoJ2JpbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgZnMuY2htb2QodGhhdC5wdWJfc29ja2V0X2ZpbGUsICc3NzUnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKGUpIGNvbnNvbGUuZXJyb3IoZSk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5QTTJfU09DS0VUX1VTRVIgJiYgcHJvY2Vzcy5lbnYuUE0yX1NPQ0tFVF9HUk9VUClcbiAgICAgICAgICBmcy5jaG93bih0aGF0LnB1Yl9zb2NrZXRfZmlsZSxcbiAgICAgICAgICAgIHBhcnNlSW50KHByb2Nlc3MuZW52LlBNMl9TT0NLRVRfVVNFUiksXG4gICAgICAgICAgICBwYXJzZUludChwcm9jZXNzLmVudi5QTTJfU09DS0VUX0dST1VQKSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgaWYgKGUpIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoYXQucHViX3NvY2tldF9yZWFkeSA9IHRydWU7XG4gICAgdGhhdC5zZW5kUmVhZHkoY2IpO1xuICB9KTtcblxuICAvKipcbiAgICogUmVwL1JlcSAtIFJQQyBzeXN0ZW0gdG8gaW50ZXJhY3Qgd2l0aCBHb2RcbiAgICovXG4gIHRoaXMucmVwID0gYXhvbi5zb2NrZXQoJ3JlcCcpO1xuXG4gIHZhciBzZXJ2ZXIgPSBuZXcgcnBjLlNlcnZlcih0aGlzLnJlcCk7XG5cbiAgdGhpcy5ycGNfc29ja2V0ID0gdGhpcy5yZXAuYmluZCh0aGlzLnJwY19zb2NrZXRfZmlsZSk7XG5cbiAgdGhpcy5ycGNfc29ja2V0Lm9uY2UoJ2JpbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgZnMuY2htb2QodGhhdC5ycGNfc29ja2V0X2ZpbGUsICc3NzUnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKGUpIGNvbnNvbGUuZXJyb3IoZSk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5QTTJfU09DS0VUX1VTRVIgJiYgcHJvY2Vzcy5lbnYuUE0yX1NPQ0tFVF9HUk9VUClcbiAgICAgICAgICBmcy5jaG93bih0aGF0LnJwY19zb2NrZXRfZmlsZSxcbiAgICAgICAgICAgIHBhcnNlSW50KHByb2Nlc3MuZW52LlBNMl9TT0NLRVRfVVNFUiksXG4gICAgICAgICAgICBwYXJzZUludChwcm9jZXNzLmVudi5QTTJfU09DS0VUX0dST1VQKSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgaWYgKGUpIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgdGhhdC5ycGNfc29ja2V0X3JlYWR5ID0gdHJ1ZTtcbiAgICB0aGF0LnNlbmRSZWFkeShjYik7XG4gIH0pO1xuXG5cbiAgLyoqXG4gICAqIE1lbW9yeSBTbmFwc2hvdFxuICAgKi9cbiAgZnVuY3Rpb24gcHJvZmlsZSh0eXBlLCBtc2csIGNiKSB7XG4gICAgaWYgKHNlbXZlci5zYXRpc2ZpZXMocHJvY2Vzcy52ZXJzaW9uLCAnPCA4JykpXG4gICAgICByZXR1cm4gY2IobnVsbCwgeyBlcnJvcjogJ05vZGUuanMgaXMgbm90IG9uIHJpZ2h0IHZlcnNpb24nIH0pXG5cbiAgICB2YXIgY21kXG5cbiAgICBpZiAodHlwZSA9PT0gJ2NwdScpIHtcbiAgICAgIGNtZCA9IHtcbiAgICAgICAgZW5hYmxlOiAnUHJvZmlsZXIuZW5hYmxlJyxcbiAgICAgICAgc3RhcnQ6ICdQcm9maWxlci5zdGFydCcsXG4gICAgICAgIHN0b3A6ICdQcm9maWxlci5zdG9wJyxcbiAgICAgICAgZGlzYWJsZTogJ1Byb2ZpbGVyLmRpc2FibGUnXG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlID09ICdtZW0nKSB7XG4gICAgICBjbWQgPSB7XG4gICAgICAgIGVuYWJsZTogJ0hlYXBQcm9maWxlci5lbmFibGUnLFxuICAgICAgICBzdGFydDogJ0hlYXBQcm9maWxlci5zdGFydFNhbXBsaW5nJyxcbiAgICAgICAgc3RvcDogJ0hlYXBQcm9maWxlci5zdG9wU2FtcGxpbmcnLFxuICAgICAgICBkaXNhYmxlOiAnSGVhcFByb2ZpbGVyLmRpc2FibGUnXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHNlc3Npb24gPSBuZXcgaW5zcGVjdG9yLlNlc3Npb24oKVxuXG4gICAgc2Vzc2lvbi5jb25uZWN0KClcblxuICAgIHZhciB0aW1lb3V0ID0gbXNnLnRpbWVvdXQgfHwgNTAwMFxuXG4gICAgc2Vzc2lvbi5wb3N0KGNtZC5lbmFibGUsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYihudWxsLCB7IGVycm9yOiBlcnIubWVzc2FnZSB8fCBlcnIgfSlcblxuICAgICAgY29uc29sZS5sb2coYFN0YXJ0aW5nICR7Y21kLnN0YXJ0fWApXG4gICAgICBzZXNzaW9uLnBvc3QoY21kLnN0YXJ0LCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiBjYihudWxsLCB7IGVycm9yOiBlcnIubWVzc2FnZSB8fCBlcnIgfSlcblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBzZXNzaW9uLnBvc3QoY21kLnN0b3AsIChlcnIsIGRhdGE6IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKG51bGwsIHsgZXJyb3I6IGVyci5tZXNzYWdlIHx8IGVyciB9KVxuICAgICAgICAgICAgY29uc3QgcHJvZmlsZSA9IGRhdGEucHJvZmlsZVxuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU3RvcHBpbmcgJHtjbWQuc3RvcH1gKVxuICAgICAgICAgICAgc2Vzc2lvbi5wb3N0KGNtZC5kaXNhYmxlKVxuXG4gICAgICAgICAgICBmcy53cml0ZUZpbGUobXNnLnB3ZCwgSlNPTi5zdHJpbmdpZnkocHJvZmlsZSksIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKG51bGwsIHsgZXJyb3I6IGVyci5tZXNzYWdlIHx8IGVyciB9KVxuICAgICAgICAgICAgICByZXR1cm4gY2IobnVsbCwgeyBmaWxlOiBtc2cucHdkIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG4gICAgICAgIH0sIHRpbWVvdXQpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBzZXJ2ZXIuZXhwb3NlKHtcbiAgICBraWxsTWU6IHRoYXQuY2xvc2UuYmluZCh0aGlzKSxcbiAgICBwcm9maWxlQ1BVOiBwcm9maWxlLmJpbmQodGhpcywgJ2NwdScpLFxuICAgIHByb2ZpbGVNRU06IHByb2ZpbGUuYmluZCh0aGlzLCAnbWVtJyksXG4gICAgcHJlcGFyZTogR29kLnByZXBhcmUsXG4gICAgbGF1bmNoU3lzTW9uaXRvcmluZzogR29kLmxhdW5jaFN5c01vbml0b3JpbmcsXG4gICAgZ2V0TW9uaXRvckRhdGE6IEdvZC5nZXRNb25pdG9yRGF0YSxcbiAgICBnZXRTeXN0ZW1EYXRhOiBHb2QuZ2V0U3lzdGVtRGF0YSxcblxuICAgIHN0YXJ0UHJvY2Vzc0lkOiBHb2Quc3RhcnRQcm9jZXNzSWQsXG4gICAgc3RvcFByb2Nlc3NJZDogR29kLnN0b3BQcm9jZXNzSWQsXG4gICAgcmVzdGFydFByb2Nlc3NJZDogR29kLnJlc3RhcnRQcm9jZXNzSWQsXG4gICAgZGVsZXRlUHJvY2Vzc0lkOiBHb2QuZGVsZXRlUHJvY2Vzc0lkLFxuXG4gICAgc2VuZExpbmVUb1N0ZGluOiBHb2Quc2VuZExpbmVUb1N0ZGluLFxuICAgIHNvZnRSZWxvYWRQcm9jZXNzSWQ6IEdvZC5zb2Z0UmVsb2FkUHJvY2Vzc0lkLFxuICAgIHJlbG9hZFByb2Nlc3NJZDogR29kLnJlbG9hZFByb2Nlc3NJZCxcbiAgICBkdXBsaWNhdGVQcm9jZXNzSWQ6IEdvZC5kdXBsaWNhdGVQcm9jZXNzSWQsXG4gICAgcmVzZXRNZXRhUHJvY2Vzc0lkOiBHb2QucmVzZXRNZXRhUHJvY2Vzc0lkLFxuICAgIHN0b3BXYXRjaDogR29kLnN0b3BXYXRjaCxcbiAgICBzdGFydFdhdGNoOiBHb2Quc3RhcnRXYXRjaCxcbiAgICB0b2dnbGVXYXRjaDogR29kLnRvZ2dsZVdhdGNoLFxuICAgIG5vdGlmeUJ5UHJvY2Vzc0lkOiBHb2Qubm90aWZ5QnlQcm9jZXNzSWQsXG5cbiAgICBub3RpZnlLaWxsUE0yOiBHb2Qubm90aWZ5S2lsbFBNMixcbiAgICBtb25pdG9yOiBHb2QubW9uaXRvcixcbiAgICB1bm1vbml0b3I6IEdvZC51bm1vbml0b3IsXG5cbiAgICBtc2dQcm9jZXNzOiBHb2QubXNnUHJvY2VzcyxcbiAgICBzZW5kRGF0YVRvUHJvY2Vzc0lkOiBHb2Quc2VuZERhdGFUb1Byb2Nlc3NJZCxcbiAgICBzZW5kU2lnbmFsVG9Qcm9jZXNzSWQ6IEdvZC5zZW5kU2lnbmFsVG9Qcm9jZXNzSWQsXG4gICAgc2VuZFNpZ25hbFRvUHJvY2Vzc05hbWU6IEdvZC5zZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZSxcblxuICAgIHBpbmc6IEdvZC5waW5nLFxuICAgIGdldFZlcnNpb246IEdvZC5nZXRWZXJzaW9uLFxuICAgIGdldFJlcG9ydDogR29kLmdldFJlcG9ydCxcbiAgICByZWxvYWRMb2dzOiBHb2QucmVsb2FkTG9nc1xuICB9KTtcblxuICB0aGlzLnN0YXJ0TG9naWMoKTtcbn1cblxuRGFlbW9uLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uIChvcHRzLCBjYikge1xuICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgR29kLmJ1cy5lbWl0KCdwbTI6a2lsbCcsIHtcbiAgICBzdGF0dXM6ICdraWxsZWQnLFxuICAgIG1zZzogJ3BtMiBoYXMgYmVlbiBraWxsZWQgdmlhIENMSSdcbiAgfSk7XG5cbiAgaWYgKEdvZC5zeXN0ZW1faW5mb3NfcHJvYyAhPT0gbnVsbClcbiAgICBHb2Quc3lzdGVtX2luZm9zX3Byb2Mua2lsbCgpXG5cbiAgLyoqXG4gICAqIENsZWFubHkga2lsbCBwbTJcbiAgICovXG4gIHRoYXQucnBjX3NvY2tldC5jbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgdGhhdC5wdWJfc29ja2V0LmNsb3NlKGZ1bmN0aW9uICgpIHtcblxuICAgICAgLy8gbm90aWZ5IGNsaSB0aGF0IHRoZSBkYWVtb24gaXMgc2h1dGluZyBkb3duIChvbmx5IHVuZGVyIHVuaXggc2luY2Ugd2luZG93cyBkb2VzbnQgaGFuZGxlIHNpZ25hbHMpXG4gICAgICBpZiAoY3N0LklTX1dJTkRPV1MgPT09IGZhbHNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcHJvY2Vzcy5raWxsKHBhcnNlSW50KG9wdHMucGlkKSwgJ1NJR1FVSVQnKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvdWxkIG5vdCBzZW5kIFNJR1FVSVQgdG8gQ0xJJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgZnMudW5saW5rU3luYyh0aGF0LnBpZF9wYXRoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHsgfVxuXG4gICAgICBjb25zb2xlLmxvZygnUE0yIHN1Y2Nlc3NmdWxseSBzdG9wcGVkJyk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcHJvY2Vzcy5leGl0KGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgfSwgMik7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5EYWVtb24ucHJvdG90eXBlLmhhbmRsZVNpZ25hbHMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcblxuICBwcm9jZXNzLm9uKCdTSUdURVJNJywgdGhhdC5ncmFjZWZ1bGxFeGl0LmJpbmQodGhpcykpO1xuICBwcm9jZXNzLm9uKCdTSUdJTlQnLCB0aGF0LmdyYWNlZnVsbEV4aXQuYmluZCh0aGlzKSk7XG4gIHByb2Nlc3Mub24oJ1NJR0hVUCcsIGZ1bmN0aW9uICgpIHsgfSk7XG4gIHByb2Nlc3Mub24oJ1NJR1FVSVQnLCB0aGF0LmdyYWNlZnVsbEV4aXQuYmluZCh0aGlzKSk7XG4gIHByb2Nlc3Mub24oJ1NJR1VTUjInLCBmdW5jdGlvbiAoKSB7XG4gICAgR29kLnJlbG9hZExvZ3Moe30sIGZ1bmN0aW9uICgpIHsgfSk7XG4gIH0pO1xufVxuXG5EYWVtb24ucHJvdG90eXBlLnNlbmRSZWFkeSA9IGZ1bmN0aW9uIChjYikge1xuICAvLyBTZW5kIHJlYWR5IG1lc3NhZ2UgdG8gQ2xpZW50XG4gIGlmICh0aGlzLnJwY19zb2NrZXRfcmVhZHkgPT0gdHJ1ZSAmJiB0aGlzLnB1Yl9zb2NrZXRfcmVhZHkgPT0gdHJ1ZSkge1xuICAgIGNiKG51bGwsIHtcbiAgICAgIHBpZDogcHJvY2Vzcy5waWQsXG4gICAgICBwbTJfdmVyc2lvbjogcGtnLnZlcnNpb25cbiAgICB9KTtcbiAgICBpZiAodHlwZW9mIChwcm9jZXNzLnNlbmQpICE9ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBwcm9jZXNzLnNlbmQoe1xuICAgICAgb25saW5lOiB0cnVlLFxuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHBpZDogcHJvY2Vzcy5waWQsXG4gICAgICBwbTJfdmVyc2lvbjogcGtnLnZlcnNpb25cbiAgICB9KTtcbiAgfTtcbn1cblxuRGFlbW9uLnByb3RvdHlwZS5ncmFjZWZ1bGxFeGl0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgLy8gbmV2ZXIgZXhlY3V0ZSBtdWx0aXBsZSBncmFjZWZ1bGxFeGl0IHNpbXVsdGFuZW91c2x5XG4gIC8vIHRoaXMgY2FuIGxlYWQgdG8gbG9zcyBvZiBzb21lIGFwcHMgaW4gZHVtcCBmaWxlXG4gIGlmICh0aGlzLmlzRXhpdGluZykgcmV0dXJuXG5cbiAgdGhpcy5pc0V4aXRpbmcgPSB0cnVlXG5cbiAgR29kLmJ1cy5lbWl0KCdwbTI6a2lsbCcsIHtcbiAgICBzdGF0dXM6ICdraWxsZWQnLFxuICAgIG1zZzogJ3BtMiBoYXMgYmVlbiBraWxsZWQgYnkgU0lHTkFMJ1xuICB9KTtcblxuICBjb25zb2xlLmxvZygncG0yIGhhcyBiZWVuIGtpbGxlZCBieSBzaWduYWwsIGR1bXBpbmcgcHJvY2VzcyBsaXN0IGJlZm9yZSBleGl0Li4uJyk7XG5cbiAgaWYgKEdvZC5zeXN0ZW1faW5mb3NfcHJvYyAhPT0gbnVsbClcbiAgICBHb2Quc3lzdGVtX2luZm9zX3Byb2Mua2lsbCgpXG5cbiAgR29kLmR1bXBQcm9jZXNzTGlzdChmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgcHJvY2Vzc2VzID0gR29kLmdldEZvcm1hdGVkUHJvY2Vzc2VzKCk7XG5cbiAgICBlYWNoTGltaXQocHJvY2Vzc2VzLCAxLCBmdW5jdGlvbiAocHJvYywgbmV4dCkge1xuICAgICAgY29uc29sZS5sb2coJ0RlbGV0aW5nIHByb2Nlc3MgJXMnLCBwcm9jLnBtMl9lbnYucG1faWQpO1xuICAgICAgR29kLmRlbGV0ZVByb2Nlc3NJZChwcm9jLnBtMl9lbnYucG1faWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgIH0pO1xuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZzLnVubGlua1N5bmModGhhdC5waWRfcGF0aCk7XG4gICAgICB9IGNhdGNoIChlKSB7IH1cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGF0LmlzRXhpdGluZyA9IGZhbHNlXG4gICAgICAgIGNvbnNvbGUubG9nKCdFeGl0ZWQgcGVhY2VmdWxseScpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9LCAyKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbkRhZW1vbi5wcm90b3R5cGUuc3RhcnRMb2dpYyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gIC8qKlxuICAgKiBBY3Rpb24gdHJlYXRtZW50IHNwZWNpZmljc1xuICAgKiBBdHRhY2ggYWN0aW9ucyB0byBwbTJfZW52LmF4bV9hY3Rpb25zIHZhcmlhYmxlcyAobmFtZSArIG9wdGlvbnMpXG4gICAqL1xuICBHb2QuYnVzLm9uKCdheG06YWN0aW9uJywgZnVuY3Rpb24gYXhtQWN0aW9ucyhtc2cpIHtcbiAgICB2YXIgcG0yX2VudiA9IG1zZy5wcm9jZXNzO1xuICAgIHZhciBleGlzdHMgPSBmYWxzZTtcbiAgICB2YXIgYXhtX2FjdGlvbiA9IG1zZy5kYXRhO1xuXG4gICAgaWYgKCFwbTJfZW52IHx8ICFHb2QuY2x1c3RlcnNfZGJbcG0yX2Vudi5wbV9pZF0pXG4gICAgICByZXR1cm4gY29uc29sZS5lcnJvcignQVhNIEFDVElPTiBVbmtub3duIGlkICVzJywgcG0yX2Vudi5wbV9pZCk7XG5cbiAgICBpZiAoIUdvZC5jbHVzdGVyc19kYltwbTJfZW52LnBtX2lkXS5wbTJfZW52LmF4bV9hY3Rpb25zKVxuICAgICAgR29kLmNsdXN0ZXJzX2RiW3BtMl9lbnYucG1faWRdLnBtMl9lbnYuYXhtX2FjdGlvbnMgPSBbXTtcblxuICAgIEdvZC5jbHVzdGVyc19kYltwbTJfZW52LnBtX2lkXS5wbTJfZW52LmF4bV9hY3Rpb25zLmZvckVhY2goZnVuY3Rpb24gKGFjdGlvbnMpIHtcbiAgICAgIGlmIChhY3Rpb25zLmFjdGlvbl9uYW1lID09IGF4bV9hY3Rpb24uYWN0aW9uX25hbWUpXG4gICAgICAgIGV4aXN0cyA9IHRydWU7XG4gICAgfSk7XG5cbiAgICBpZiAoZXhpc3RzID09PSBmYWxzZSkge1xuICAgICAgZGVidWcoJ0FkZGluZyBhY3Rpb24nLCBheG1fYWN0aW9uKTtcbiAgICAgIEdvZC5jbHVzdGVyc19kYltwbTJfZW52LnBtX2lkXS5wbTJfZW52LmF4bV9hY3Rpb25zLnB1c2goYXhtX2FjdGlvbik7XG4gICAgfVxuICAgIG1zZyA9IG51bGw7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmUgbW9kdWxlXG4gICAqL1xuICBHb2QuYnVzLm9uKCdheG06b3B0aW9uOmNvbmZpZ3VyYXRpb24nLCBmdW5jdGlvbiBheG1Nb25pdG9yKG1zZykge1xuICAgIGlmICghbXNnLnByb2Nlc3MpXG4gICAgICByZXR1cm4gY29uc29sZS5lcnJvcignW2F4bTpvcHRpb246Y29uZmlndXJhdGlvbl0gbm8gcHJvY2VzcyBkZWZpbmVkJyk7XG5cbiAgICBpZiAoIUdvZC5jbHVzdGVyc19kYlttc2cucHJvY2Vzcy5wbV9pZF0pXG4gICAgICByZXR1cm4gY29uc29sZS5lcnJvcignW2F4bTpvcHRpb246Y29uZmlndXJhdGlvbl0gVW5rbm93biBpZCAlcycsIG1zZy5wcm9jZXNzLnBtX2lkKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBBcHBsaWNhdGlvbiBOYW1lIG52ZXJyaWRlXG4gICAgICBpZiAobXNnLmRhdGEubmFtZSlcbiAgICAgICAgR29kLmNsdXN0ZXJzX2RiW21zZy5wcm9jZXNzLnBtX2lkXS5wbTJfZW52Lm5hbWUgPSBtc2cuZGF0YS5uYW1lO1xuXG4gICAgICBPYmplY3Qua2V5cyhtc2cuZGF0YSkuZm9yRWFjaChmdW5jdGlvbiAoY29uZl9rZXkpIHtcbiAgICAgICAgR29kLmNsdXN0ZXJzX2RiW21zZy5wcm9jZXNzLnBtX2lkXS5wbTJfZW52LmF4bV9vcHRpb25zW2NvbmZfa2V5XSA9IFV0aWxpdHkuY2xvbmUobXNnLmRhdGFbY29uZl9rZXldKTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICB9XG4gICAgbXNnID0gbnVsbDtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIFByb2Nlc3MgbW9uaXRvcmluZyBkYXRhIChwcm9iZXMpXG4gICAqL1xuICBHb2QuYnVzLm9uKCdheG06bW9uaXRvcicsIGZ1bmN0aW9uIGF4bU1vbml0b3IobXNnKSB7XG4gICAgaWYgKCFtc2cucHJvY2VzcylcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdbYXhtOm1vbml0b3JdIG5vIHByb2Nlc3MgZGVmaW5lZCcpO1xuXG4gICAgaWYgKCFtc2cucHJvY2VzcyB8fCAhR29kLmNsdXN0ZXJzX2RiW21zZy5wcm9jZXNzLnBtX2lkXSlcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdBWE0gTU9OSVRPUiBVbmtub3duIGlkICVzJywgbXNnLnByb2Nlc3MucG1faWQpO1xuXG4gICAgdXRpbC5pbmhlcml0cyhHb2QuY2x1c3RlcnNfZGJbbXNnLnByb2Nlc3MucG1faWRdLnBtMl9lbnYuYXhtX21vbml0b3IsIFV0aWxpdHkuY2xvbmUobXNnLmRhdGEpKTtcbiAgICBtc2cgPSBudWxsO1xuICB9KTtcblxuICAvKipcbiAgICogQnJvYWRjYXN0IG1lc3NhZ2VzXG4gICAqL1xuICBHb2QuYnVzLm9uQW55KGZ1bmN0aW9uIChldmVudCwgZGF0YV92KSB7XG4gICAgaWYgKFsnYXhtOmFjdGlvbicsXG4gICAgICAnYXhtOm1vbml0b3InLFxuICAgICAgJ2F4bTpvcHRpb246c2V0UElEJyxcbiAgICAgICdheG06b3B0aW9uOmNvbmZpZ3VyYXRpb24nXS5pbmRleE9mKGV2ZW50KSA+IC0xKSB7XG4gICAgICBkYXRhX3YgPSBudWxsO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGF0LnB1Yi5lbWl0KGV2ZW50LCBVdGlsaXR5LmNsb25lKGRhdGFfdikpO1xuICAgIGRhdGFfdiA9IG51bGw7XG4gIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIHByb2Nlc3MudGl0bGUgPSBwcm9jZXNzLmVudi5QTTJfREFFTU9OX1RJVExFIHx8ICdQTTIgdicgKyBwa2cudmVyc2lvbiArICc6IEdvZCBEYWVtb24gKCcgKyBwcm9jZXNzLmVudi5QTTJfSE9NRSArICcpJztcblxuICB2YXIgZGFlbW9uID0gbmV3IERhZW1vbigpO1xuXG4gIGRhZW1vbi5zdGFydCgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBEYWVtb247XG4iXX0=