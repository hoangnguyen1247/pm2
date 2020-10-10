"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _debug = _interopRequireDefault(require("debug"));

var _package = _interopRequireDefault(require("../package.json"));

var _constants = _interopRequireDefault(require("../constants"));

var _pm2AxonRpc = _interopRequireDefault(require("pm2-axon-rpc"));

var _pm2Axon = _interopRequireDefault(require("pm2-axon"));

var _domain = _interopRequireDefault(require("domain"));

var _Utility = _interopRequireDefault(require("./Utility"));

var _util = _interopRequireDefault(require("util"));

var _fs = _interopRequireDefault(require("fs"));

var _God = _interopRequireDefault(require("./God"));

var _eachLimit = _interopRequireDefault(require("async/eachLimit"));

var fmt = _interopRequireWildcard(require("./tools/fmt"));

var _semver = _interopRequireDefault(require("semver"));

var _child_process = require("child_process");

var _inspector = _interopRequireDefault(require("inspector"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9EYWVtb24udHMiXSwibmFtZXMiOlsiZGVidWciLCJEYWVtb24iLCJvcHRzIiwiaWdub3JlX3NpZ25hbHMiLCJycGNfc29ja2V0X3JlYWR5IiwicHViX3NvY2tldF9yZWFkeSIsInB1Yl9zb2NrZXRfZmlsZSIsImNzdCIsIkRBRU1PTl9QVUJfUE9SVCIsInJwY19zb2NrZXRfZmlsZSIsIkRBRU1PTl9SUENfUE9SVCIsInBpZF9wYXRoIiwicGlkX2ZpbGUiLCJQTTJfUElEX0ZJTEVfUEFUSCIsInByb3RvdHlwZSIsInN0YXJ0IiwidGhhdCIsImQiLCJkb21haW4iLCJjcmVhdGUiLCJvbmNlIiwiZXJyIiwiZm10Iiwic2VwIiwidGl0bGUiLCJmaWVsZCIsIkRhdGUiLCJjb25zb2xlIiwiZXJyb3IiLCJtZXNzYWdlIiwic3RhY2siLCJwYXRoIiwiSVNfV0lORE9XUyIsIl9fZGlybmFtZSIsInByb2Nlc3MiLCJlbnYiLCJmb3JrX25ld19wbTIiLCJkZXRhY2hlZCIsInN0ZGlvIiwib24iLCJsb2ciLCJleGl0IiwicnVuIiwiaW5uZXJTdGFydCIsImNiIiwicGtnIiwidmVyc2lvbiIsInZlcnNpb25zIiwibm9kZSIsImFyY2giLCJQTTJfSE9NRSIsIkRFRkFVTFRfTE9HX1BBVEgiLCJXT1JLRVJfSU5URVJWQUwiLCJEVU1QX0ZJTEVfUEFUSCIsIkNPTkNVUlJFTlRfQUNUSU9OUyIsIktJTExfVElNRU9VVCIsImZzIiwid3JpdGVGaWxlU3luYyIsInBpZCIsInRvU3RyaW5nIiwiZSIsImhhbmRsZVNpZ25hbHMiLCJwdWIiLCJheG9uIiwic29ja2V0IiwicHViX3NvY2tldCIsImJpbmQiLCJjaG1vZCIsIlBNMl9TT0NLRVRfVVNFUiIsIlBNMl9TT0NLRVRfR1JPVVAiLCJjaG93biIsInBhcnNlSW50Iiwic2VuZFJlYWR5IiwicmVwIiwic2VydmVyIiwicnBjIiwiU2VydmVyIiwicnBjX3NvY2tldCIsInByb2ZpbGUiLCJ0eXBlIiwibXNnIiwic2VtdmVyIiwic2F0aXNmaWVzIiwiY21kIiwiZW5hYmxlIiwic3RvcCIsImRpc2FibGUiLCJzZXNzaW9uIiwiaW5zcGVjdG9yIiwiU2Vzc2lvbiIsImNvbm5lY3QiLCJ0aW1lb3V0IiwicG9zdCIsImRhdGEiLCJzZXRUaW1lb3V0Iiwid3JpdGVGaWxlIiwicHdkIiwiSlNPTiIsInN0cmluZ2lmeSIsImZpbGUiLCJleHBvc2UiLCJraWxsTWUiLCJjbG9zZSIsInByb2ZpbGVDUFUiLCJwcm9maWxlTUVNIiwicHJlcGFyZSIsIkdvZCIsImxhdW5jaFN5c01vbml0b3JpbmciLCJnZXRNb25pdG9yRGF0YSIsImdldFN5c3RlbURhdGEiLCJzdGFydFByb2Nlc3NJZCIsInN0b3BQcm9jZXNzSWQiLCJyZXN0YXJ0UHJvY2Vzc0lkIiwiZGVsZXRlUHJvY2Vzc0lkIiwic2VuZExpbmVUb1N0ZGluIiwic29mdFJlbG9hZFByb2Nlc3NJZCIsInJlbG9hZFByb2Nlc3NJZCIsImR1cGxpY2F0ZVByb2Nlc3NJZCIsInJlc2V0TWV0YVByb2Nlc3NJZCIsInN0b3BXYXRjaCIsInN0YXJ0V2F0Y2giLCJ0b2dnbGVXYXRjaCIsIm5vdGlmeUJ5UHJvY2Vzc0lkIiwibm90aWZ5S2lsbFBNMiIsIm1vbml0b3IiLCJ1bm1vbml0b3IiLCJtc2dQcm9jZXNzIiwic2VuZERhdGFUb1Byb2Nlc3NJZCIsInNlbmRTaWduYWxUb1Byb2Nlc3NJZCIsInNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lIiwicGluZyIsImdldFZlcnNpb24iLCJnZXRSZXBvcnQiLCJyZWxvYWRMb2dzIiwic3RhcnRMb2dpYyIsImJ1cyIsImVtaXQiLCJzdGF0dXMiLCJzeXN0ZW1faW5mb3NfcHJvYyIsImtpbGwiLCJ1bmxpbmtTeW5jIiwiU1VDQ0VTU19FWElUIiwiZ3JhY2VmdWxsRXhpdCIsInBtMl92ZXJzaW9uIiwic2VuZCIsIm9ubGluZSIsInN1Y2Nlc3MiLCJpc0V4aXRpbmciLCJkdW1wUHJvY2Vzc0xpc3QiLCJwcm9jZXNzZXMiLCJnZXRGb3JtYXRlZFByb2Nlc3NlcyIsInByb2MiLCJuZXh0IiwicG0yX2VudiIsInBtX2lkIiwiYXhtQWN0aW9ucyIsImV4aXN0cyIsImF4bV9hY3Rpb24iLCJjbHVzdGVyc19kYiIsImF4bV9hY3Rpb25zIiwiZm9yRWFjaCIsImFjdGlvbnMiLCJhY3Rpb25fbmFtZSIsInB1c2giLCJheG1Nb25pdG9yIiwibmFtZSIsIk9iamVjdCIsImtleXMiLCJjb25mX2tleSIsImF4bV9vcHRpb25zIiwiVXRpbGl0eSIsImNsb25lIiwidXRpbCIsImluaGVyaXRzIiwiYXhtX21vbml0b3IiLCJvbkFueSIsImV2ZW50IiwiZGF0YV92IiwiaW5kZXhPZiIsInJlcXVpcmUiLCJtYWluIiwibW9kdWxlIiwiUE0yX0RBRU1PTl9USVRMRSIsImRhZW1vbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFNQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFwQkE7Ozs7O0FBc0JBLElBQU1BLEtBQUssR0FBRyx1QkFBWSxZQUFaLENBQWQ7O0FBRUEsSUFBSUMsTUFBTSxHQUFHLFNBQVRBLE1BQVMsQ0FBVUMsSUFBVixFQUFpQjtBQUM1QixNQUFJLENBQUNBLElBQUwsRUFBV0EsSUFBSSxHQUFHLEVBQVA7QUFFWCxPQUFLQyxjQUFMLEdBQXNCRCxJQUFJLENBQUNDLGNBQUwsSUFBdUIsS0FBN0M7QUFDQSxPQUFLQyxnQkFBTCxHQUF3QixLQUF4QjtBQUNBLE9BQUtDLGdCQUFMLEdBQXdCLEtBQXhCO0FBRUEsT0FBS0MsZUFBTCxHQUF1QkosSUFBSSxDQUFDSSxlQUFMLElBQXdCQyxzQkFBSUMsZUFBbkQ7QUFDQSxPQUFLQyxlQUFMLEdBQXVCUCxJQUFJLENBQUNPLGVBQUwsSUFBd0JGLHNCQUFJRyxlQUFuRDtBQUVBLE9BQUtDLFFBQUwsR0FBZ0JULElBQUksQ0FBQ1UsUUFBTCxJQUFpQkwsc0JBQUlNLGlCQUFyQztBQUNELENBWEQ7O0FBYUFaLE1BQU0s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RixHQUFHLENBQUNhLElBQWxCLENBQXRFOztBQUNBYixJQUFBQSxHQUFHLEdBQUcsSUFBTjtBQUNELEdBVEQ7QUFXQTs7Ozs7QUFHQTBCLGtCQUFJNkIsR0FBSixDQUFRd0MsS0FBUixDQUFjLFVBQVVDLEtBQVYsRUFBaUJDLE1BQWpCLEVBQXlCO0FBQ3JDLFFBQUksQ0FBQyxZQUFELEVBQ0YsYUFERSxFQUVGLG1CQUZFLEVBR0YsMEJBSEUsRUFHMEJDLE9BSDFCLENBR2tDRixLQUhsQyxJQUcyQyxDQUFDLENBSGhELEVBR21EO0FBQ2pEQyxNQUFBQSxNQUFNLEdBQUcsSUFBVDtBQUNBLGFBQU8sS0FBUDtBQUNEOztBQUNEakssSUFBQUEsSUFBSSxDQUFDOEMsR0FBTCxDQUFTMEUsSUFBVCxDQUFjd0MsS0FBZCxFQUFxQk4sb0JBQVFDLEtBQVIsQ0FBY00sTUFBZCxDQUFyQjtBQUNBQSxJQUFBQSxNQUFNLEdBQUcsSUFBVDtBQUNELEdBVkQ7QUFXRCxDQWxGRDs7QUFvRkEsSUFBSUUsT0FBTyxDQUFDQyxJQUFSLEtBQWlCQyxNQUFyQixFQUE2QjtBQUMzQm5KLEVBQUFBLE9BQU8sQ0FBQ1YsS0FBUixHQUFnQlUsT0FBTyxDQUFDQyxHQUFSLENBQVltSixnQkFBWixJQUFnQyxVQUFVekksb0JBQUlDLE9BQWQsR0FBd0IsZ0JBQXhCLEdBQTJDWixPQUFPLENBQUNDLEdBQVIsQ0FBWWUsUUFBdkQsR0FBa0UsR0FBbEg7QUFFQSxNQUFJcUksTUFBTSxHQUFHLElBQUl0TCxNQUFKLEVBQWI7QUFFQXNMLEVBQUFBLE1BQU0sQ0FBQ3hLLEtBQVA7QUFDRDs7ZUFFY2QsTSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIGxpY2Vuc2UgdGhhdFxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4gKi9cblxuaW1wb3J0IGRlYnVnTG9nZ2VyIGZyb20gJ2RlYnVnJztcbmltcG9ydCBwa2cgZnJvbSAnLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCBjc3QgZnJvbSAnLi4vY29uc3RhbnRzJztcbmltcG9ydCBycGMgZnJvbSAncG0yLWF4b24tcnBjJztcbmltcG9ydCBheG9uIGZyb20gJ3BtMi1heG9uJztcbmltcG9ydCBkb21haW4gZnJvbSAnZG9tYWluJztcbmltcG9ydCBVdGlsaXR5IGZyb20gJy4vVXRpbGl0eSc7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgR29kIGZyb20gJy4vR29kJztcbmltcG9ydCBlYWNoTGltaXQgZnJvbSAnYXN5bmMvZWFjaExpbWl0JztcbmltcG9ydCAqIGFzIGZtdCBmcm9tICcuL3Rvb2xzL2ZtdCc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IGluc3BlY3RvciBmcm9tICdpbnNwZWN0b3InXG5cbmNvbnN0IGRlYnVnID0gZGVidWdMb2dnZXIoJ3BtMjpkYWVtb24nKTtcblxudmFyIERhZW1vbiA9IGZ1bmN0aW9uIChvcHRzPykge1xuICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcblxuICB0aGlzLmlnbm9yZV9zaWduYWxzID0gb3B0cy5pZ25vcmVfc2lnbmFscyB8fCBmYWxzZTtcbiAgdGhpcy5ycGNfc29ja2V0X3JlYWR5ID0gZmFsc2U7XG4gIHRoaXMucHViX3NvY2tldF9yZWFkeSA9IGZhbHNlO1xuXG4gIHRoaXMucHViX3NvY2tldF9maWxlID0gb3B0cy5wdWJfc29ja2V0X2ZpbGUgfHwgY3N0LkRBRU1PTl9QVUJfUE9SVDtcbiAgdGhpcy5ycGNfc29ja2V0X2ZpbGUgPSBvcHRzLnJwY19zb2NrZXRfZmlsZSB8fCBjc3QuREFFTU9OX1JQQ19QT1JUO1xuXG4gIHRoaXMucGlkX3BhdGggPSBvcHRzLnBpZF9maWxlIHx8IGNzdC5QTTJfUElEX0ZJTEVfUEFUSDtcbn07XG5cbkRhZW1vbi5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcbiAgdmFyIGQgPSBkb21haW4uY3JlYXRlKCk7XG5cbiAgZC5vbmNlKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBmbXQuc2VwKCk7XG4gICAgZm10LnRpdGxlKCdQTTIgZ2xvYmFsIGVycm9yIGNhdWdodCcpO1xuICAgIGZtdC5maWVsZCgnVGltZScsIG5ldyBEYXRlKCkpO1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTtcbiAgICBmbXQuc2VwKCk7XG5cbiAgICBjb25zb2xlLmVycm9yKCdbUE0yXSBSZXN1cnJlY3RpbmcgUE0yJyk7XG5cbiAgICB2YXIgcGF0aCA9IGNzdC5JU19XSU5ET1dTID8gX19kaXJuYW1lICsgJy8uLi9iaW4vcG0yJyA6IHByb2Nlc3MuZW52WydfJ107XG4gICAgdmFyIGZvcmtfbmV3X3BtMiA9IHNwYXduKCdub2RlJywgW3BhdGgsICd1cGRhdGUnXSwge1xuICAgICAgZGV0YWNoZWQ6IHRydWUsXG4gICAgICBzdGRpbzogJ2luaGVyaXQnXG4gICAgfSk7XG5cbiAgICBmb3JrX25ld19wbTIub24oJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ1BNMiBzdWNjZXNzZnVsbHkgZm9ya2VkJyk7XG4gICAgICBwcm9jZXNzLmV4aXQoMCk7XG4gICAgfSlcblxuICB9KTtcblxuICBkLnJ1bihmdW5jdGlvbiAoKSB7XG4gICAgdGhhdC5pbm5lclN0YXJ0KCk7XG4gIH0pO1xufVxuXG5EYWVtb24ucHJvdG90eXBlLmlubmVyU3RhcnQgPSBmdW5jdGlvbiAoY2IpIHtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gIGlmICghY2IpIGNiID0gZnVuY3Rpb24gKCkge1xuICAgIGZtdC5zZXAoKTtcbiAgICBmbXQudGl0bGUoJ05ldyBQTTIgRGFlbW9uIHN0YXJ0ZWQnKTtcbiAgICBmbXQuZmllbGQoJ1RpbWUnLCBuZXcgRGF0ZSgpKTtcbiAgICBmbXQuZmllbGQoJ1BNMiB2ZXJzaW9uJywgcGtnLnZlcnNpb24pO1xuICAgIGZtdC5maWVsZCgnTm9kZS5qcyB2ZXJzaW9uJywgcHJvY2Vzcy52ZXJzaW9ucy5ub2RlKTtcbiAgICBmbXQuZmllbGQoJ0N1cnJlbnQgYXJjaCcsIHByb2Nlc3MuYXJjaCk7XG4gICAgZm10LmZpZWxkKCdQTTIgaG9tZScsIGNzdC5QTTJfSE9NRSk7XG4gICAgZm10LmZpZWxkKCdQTTIgUElEIGZpbGUnLCB0aGF0LnBpZF9wYXRoKTtcbiAgICBmbXQuZmllbGQoJ1JQQyBzb2NrZXQgZmlsZScsIHRoYXQucnBjX3NvY2tldF9maWxlKTtcbiAgICBmbXQuZmllbGQoJ0JVUyBzb2NrZXQgZmlsZScsIHRoYXQucHViX3NvY2tldF9maWxlKTtcbiAgICBmbXQuZmllbGQoJ0FwcGxpY2F0aW9uIGxvZyBwYXRoJywgY3N0LkRFRkFVTFRfTE9HX1BBVEgpO1xuICAgIGZtdC5maWVsZCgnV29ya2VyIEludGVydmFsJywgY3N0LldPUktFUl9JTlRFUlZBTCk7XG4gICAgZm10LmZpZWxkKCdQcm9jZXNzIGR1bXAgZmlsZScsIGNzdC5EVU1QX0ZJTEVfUEFUSCk7XG4gICAgZm10LmZpZWxkKCdDb25jdXJyZW50IGFjdGlvbnMnLCBjc3QuQ09OQ1VSUkVOVF9BQ1RJT05TKTtcbiAgICBmbXQuZmllbGQoJ1NJR1RFUk0gdGltZW91dCcsIGNzdC5LSUxMX1RJTUVPVVQpO1xuICAgIGZtdC5zZXAoKTtcbiAgfTtcblxuICAvLyBXcml0ZSBEYWVtb24gUElEIGludG8gZmlsZVxuICB0cnkge1xuICAgIGZzLndyaXRlRmlsZVN5bmModGhhdC5waWRfcGF0aCwgcHJvY2Vzcy5waWQudG9TdHJpbmcoKSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gIH1cblxuICBpZiAodGhpcy5pZ25vcmVfc2lnbmFscyAhPSB0cnVlKVxuICAgIHRoaXMuaGFuZGxlU2lnbmFscygpO1xuXG4gIC8qKlxuICAgKiBQdWIgc3lzdGVtIGZvciByZWFsIHRpbWUgbm90aWZpY2F0aW9uc1xuICAgKi9cbiAgdGhpcy5wdWIgPSBheG9uLnNvY2tldCgncHViLWVtaXR0ZXInKTtcblxuICB0aGlzLnB1Yl9zb2NrZXQgPSB0aGlzLnB1Yi5iaW5kKHRoaXMucHViX3NvY2tldF9maWxlKTtcblxuICB0aGlzLnB1Yl9zb2NrZXQub25jZSgnYmluZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBmcy5jaG1vZCh0aGF0LnB1Yl9zb2NrZXRfZmlsZSwgJzc3NScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoZSkgY29uc29sZS5lcnJvcihlKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52LlBNMl9TT0NLRVRfVVNFUiAmJiBwcm9jZXNzLmVudi5QTTJfU09DS0VUX0dST1VQKVxuICAgICAgICAgIGZzLmNob3duKHRoYXQucHViX3NvY2tldF9maWxlLFxuICAgICAgICAgICAgcGFyc2VJbnQocHJvY2Vzcy5lbnYuUE0yX1NPQ0tFVF9VU0VSKSxcbiAgICAgICAgICAgIHBhcnNlSW50KHByb2Nlc3MuZW52LlBNMl9TT0NLRVRfR1JPVVApLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICBpZiAoZSkgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhhdC5wdWJfc29ja2V0X3JlYWR5ID0gdHJ1ZTtcbiAgICB0aGF0LnNlbmRSZWFkeShjYik7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBSZXAvUmVxIC0gUlBDIHN5c3RlbSB0byBpbnRlcmFjdCB3aXRoIEdvZFxuICAgKi9cbiAgdGhpcy5yZXAgPSBheG9uLnNvY2tldCgncmVwJyk7XG5cbiAgdmFyIHNlcnZlciA9IG5ldyBycGMuU2VydmVyKHRoaXMucmVwKTtcblxuICB0aGlzLnJwY19zb2NrZXQgPSB0aGlzLnJlcC5iaW5kKHRoaXMucnBjX3NvY2tldF9maWxlKTtcblxuICB0aGlzLnJwY19zb2NrZXQub25jZSgnYmluZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBmcy5jaG1vZCh0aGF0LnJwY19zb2NrZXRfZmlsZSwgJzc3NScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoZSkgY29uc29sZS5lcnJvcihlKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52LlBNMl9TT0NLRVRfVVNFUiAmJiBwcm9jZXNzLmVudi5QTTJfU09DS0VUX0dST1VQKVxuICAgICAgICAgIGZzLmNob3duKHRoYXQucnBjX3NvY2tldF9maWxlLFxuICAgICAgICAgICAgcGFyc2VJbnQocHJvY2Vzcy5lbnYuUE0yX1NPQ0tFVF9VU0VSKSxcbiAgICAgICAgICAgIHBhcnNlSW50KHByb2Nlc3MuZW52LlBNMl9TT0NLRVRfR1JPVVApLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICBpZiAoZSkgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICB0aGF0LnJwY19zb2NrZXRfcmVhZHkgPSB0cnVlO1xuICAgIHRoYXQuc2VuZFJlYWR5KGNiKTtcbiAgfSk7XG5cblxuICAvKipcbiAgICogTWVtb3J5IFNuYXBzaG90XG4gICAqL1xuICBmdW5jdGlvbiBwcm9maWxlKHR5cGUsIG1zZywgY2IpIHtcbiAgICBpZiAoc2VtdmVyLnNhdGlzZmllcyhwcm9jZXNzLnZlcnNpb24sICc8IDgnKSlcbiAgICAgIHJldHVybiBjYihudWxsLCB7IGVycm9yOiAnTm9kZS5qcyBpcyBub3Qgb24gcmlnaHQgdmVyc2lvbicgfSlcblxuICAgIHZhciBjbWRcblxuICAgIGlmICh0eXBlID09PSAnY3B1Jykge1xuICAgICAgY21kID0ge1xuICAgICAgICBlbmFibGU6ICdQcm9maWxlci5lbmFibGUnLFxuICAgICAgICBzdGFydDogJ1Byb2ZpbGVyLnN0YXJ0JyxcbiAgICAgICAgc3RvcDogJ1Byb2ZpbGVyLnN0b3AnLFxuICAgICAgICBkaXNhYmxlOiAnUHJvZmlsZXIuZGlzYWJsZSdcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGUgPT0gJ21lbScpIHtcbiAgICAgIGNtZCA9IHtcbiAgICAgICAgZW5hYmxlOiAnSGVhcFByb2ZpbGVyLmVuYWJsZScsXG4gICAgICAgIHN0YXJ0OiAnSGVhcFByb2ZpbGVyLnN0YXJ0U2FtcGxpbmcnLFxuICAgICAgICBzdG9wOiAnSGVhcFByb2ZpbGVyLnN0b3BTYW1wbGluZycsXG4gICAgICAgIGRpc2FibGU6ICdIZWFwUHJvZmlsZXIuZGlzYWJsZSdcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgc2Vzc2lvbiA9IG5ldyBpbnNwZWN0b3IuU2Vzc2lvbigpXG5cbiAgICBzZXNzaW9uLmNvbm5lY3QoKVxuXG4gICAgdmFyIHRpbWVvdXQgPSBtc2cudGltZW91dCB8fCA1MDAwXG5cbiAgICBzZXNzaW9uLnBvc3QoY21kLmVuYWJsZSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgaWYgKGVycikgcmV0dXJuIGNiKG51bGwsIHsgZXJyb3I6IGVyci5tZXNzYWdlIHx8IGVyciB9KVxuXG4gICAgICBjb25zb2xlLmxvZyhgU3RhcnRpbmcgJHtjbWQuc3RhcnR9YClcbiAgICAgIHNlc3Npb24ucG9zdChjbWQuc3RhcnQsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKG51bGwsIHsgZXJyb3I6IGVyci5tZXNzYWdlIHx8IGVyciB9KVxuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHNlc3Npb24ucG9zdChjbWQuc3RvcCwgKGVyciwgZGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IobnVsbCwgeyBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgZXJyIH0pXG4gICAgICAgICAgICBjb25zdCBwcm9maWxlID0gZGF0YS5wcm9maWxlXG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTdG9wcGluZyAke2NtZC5zdG9wfWApXG4gICAgICAgICAgICBzZXNzaW9uLnBvc3QoY21kLmRpc2FibGUpXG5cbiAgICAgICAgICAgIGZzLndyaXRlRmlsZShtc2cucHdkLCBKU09OLnN0cmluZ2lmeShwcm9maWxlKSwgKGVycikgPT4ge1xuICAgICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IobnVsbCwgeyBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgZXJyIH0pXG4gICAgICAgICAgICAgIHJldHVybiBjYihudWxsLCB7IGZpbGU6IG1zZy5wd2QgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcbiAgICAgICAgfSwgdGltZW91dClcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHNlcnZlci5leHBvc2Uoe1xuICAgIGtpbGxNZTogdGhhdC5jbG9zZS5iaW5kKHRoaXMpLFxuICAgIHByb2ZpbGVDUFU6IHByb2ZpbGUuYmluZCh0aGlzLCAnY3B1JyksXG4gICAgcHJvZmlsZU1FTTogcHJvZmlsZS5iaW5kKHRoaXMsICdtZW0nKSxcbiAgICBwcmVwYXJlOiBHb2QucHJlcGFyZSxcbiAgICBsYXVuY2hTeXNNb25pdG9yaW5nOiBHb2QubGF1bmNoU3lzTW9uaXRvcmluZyxcbiAgICBnZXRNb25pdG9yRGF0YTogR29kLmdldE1vbml0b3JEYXRhLFxuICAgIGdldFN5c3RlbURhdGE6IEdvZC5nZXRTeXN0ZW1EYXRhLFxuXG4gICAgc3RhcnRQcm9jZXNzSWQ6IEdvZC5zdGFydFByb2Nlc3NJZCxcbiAgICBzdG9wUHJvY2Vzc0lkOiBHb2Quc3RvcFByb2Nlc3NJZCxcbiAgICByZXN0YXJ0UHJvY2Vzc0lkOiBHb2QucmVzdGFydFByb2Nlc3NJZCxcbiAgICBkZWxldGVQcm9jZXNzSWQ6IEdvZC5kZWxldGVQcm9jZXNzSWQsXG5cbiAgICBzZW5kTGluZVRvU3RkaW46IEdvZC5zZW5kTGluZVRvU3RkaW4sXG4gICAgc29mdFJlbG9hZFByb2Nlc3NJZDogR29kLnNvZnRSZWxvYWRQcm9jZXNzSWQsXG4gICAgcmVsb2FkUHJvY2Vzc0lkOiBHb2QucmVsb2FkUHJvY2Vzc0lkLFxuICAgIGR1cGxpY2F0ZVByb2Nlc3NJZDogR29kLmR1cGxpY2F0ZVByb2Nlc3NJZCxcbiAgICByZXNldE1ldGFQcm9jZXNzSWQ6IEdvZC5yZXNldE1ldGFQcm9jZXNzSWQsXG4gICAgc3RvcFdhdGNoOiBHb2Quc3RvcFdhdGNoLFxuICAgIHN0YXJ0V2F0Y2g6IEdvZC5zdGFydFdhdGNoLFxuICAgIHRvZ2dsZVdhdGNoOiBHb2QudG9nZ2xlV2F0Y2gsXG4gICAgbm90aWZ5QnlQcm9jZXNzSWQ6IEdvZC5ub3RpZnlCeVByb2Nlc3NJZCxcblxuICAgIG5vdGlmeUtpbGxQTTI6IEdvZC5ub3RpZnlLaWxsUE0yLFxuICAgIG1vbml0b3I6IEdvZC5tb25pdG9yLFxuICAgIHVubW9uaXRvcjogR29kLnVubW9uaXRvcixcblxuICAgIG1zZ1Byb2Nlc3M6IEdvZC5tc2dQcm9jZXNzLFxuICAgIHNlbmREYXRhVG9Qcm9jZXNzSWQ6IEdvZC5zZW5kRGF0YVRvUHJvY2Vzc0lkLFxuICAgIHNlbmRTaWduYWxUb1Byb2Nlc3NJZDogR29kLnNlbmRTaWduYWxUb1Byb2Nlc3NJZCxcbiAgICBzZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZTogR29kLnNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lLFxuXG4gICAgcGluZzogR29kLnBpbmcsXG4gICAgZ2V0VmVyc2lvbjogR29kLmdldFZlcnNpb24sXG4gICAgZ2V0UmVwb3J0OiBHb2QuZ2V0UmVwb3J0LFxuICAgIHJlbG9hZExvZ3M6IEdvZC5yZWxvYWRMb2dzXG4gIH0pO1xuXG4gIHRoaXMuc3RhcnRMb2dpYygpO1xufVxuXG5EYWVtb24ucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKG9wdHMsIGNiKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcblxuICBHb2QuYnVzLmVtaXQoJ3BtMjpraWxsJywge1xuICAgIHN0YXR1czogJ2tpbGxlZCcsXG4gICAgbXNnOiAncG0yIGhhcyBiZWVuIGtpbGxlZCB2aWEgQ0xJJ1xuICB9KTtcblxuICBpZiAoR29kLnN5c3RlbV9pbmZvc19wcm9jICE9PSBudWxsKVxuICAgIEdvZC5zeXN0ZW1faW5mb3NfcHJvYy5raWxsKClcblxuICAvKipcbiAgICogQ2xlYW5seSBraWxsIHBtMlxuICAgKi9cbiAgdGhhdC5ycGNfc29ja2V0LmNsb3NlKGZ1bmN0aW9uICgpIHtcbiAgICB0aGF0LnB1Yl9zb2NrZXQuY2xvc2UoZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBub3RpZnkgY2xpIHRoYXQgdGhlIGRhZW1vbiBpcyBzaHV0aW5nIGRvd24gKG9ubHkgdW5kZXIgdW5peCBzaW5jZSB3aW5kb3dzIGRvZXNudCBoYW5kbGUgc2lnbmFscylcbiAgICAgIGlmIChjc3QuSVNfV0lORE9XUyA9PT0gZmFsc2UpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBwcm9jZXNzLmtpbGwocGFyc2VJbnQob3B0cy5waWQpLCAnU0lHUVVJVCcpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignQ291bGQgbm90IHNlbmQgU0lHUVVJVCB0byBDTEknKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBmcy51bmxpbmtTeW5jKHRoYXQucGlkX3BhdGgpO1xuICAgICAgfSBjYXRjaCAoZSkgeyB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdQTTIgc3VjY2Vzc2Z1bGx5IHN0b3BwZWQnKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBwcm9jZXNzLmV4aXQoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9LCAyKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbkRhZW1vbi5wcm90b3R5cGUuaGFuZGxlU2lnbmFscyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gIHByb2Nlc3Mub24oJ1NJR1RFUk0nLCB0aGF0LmdyYWNlZnVsbEV4aXQuYmluZCh0aGlzKSk7XG4gIHByb2Nlc3Mub24oJ1NJR0lOVCcsIHRoYXQuZ3JhY2VmdWxsRXhpdC5iaW5kKHRoaXMpKTtcbiAgcHJvY2Vzcy5vbignU0lHSFVQJywgZnVuY3Rpb24gKCkgeyB9KTtcbiAgcHJvY2Vzcy5vbignU0lHUVVJVCcsIHRoYXQuZ3JhY2VmdWxsRXhpdC5iaW5kKHRoaXMpKTtcbiAgcHJvY2Vzcy5vbignU0lHVVNSMicsIGZ1bmN0aW9uICgpIHtcbiAgICBHb2QucmVsb2FkTG9ncyh7fSwgZnVuY3Rpb24gKCkgeyB9KTtcbiAgfSk7XG59XG5cbkRhZW1vbi5wcm90b3R5cGUuc2VuZFJlYWR5ID0gZnVuY3Rpb24gKGNiKSB7XG4gIC8vIFNlbmQgcmVhZHkgbWVzc2FnZSB0byBDbGllbnRcbiAgaWYgKHRoaXMucnBjX3NvY2tldF9yZWFkeSA9PSB0cnVlICYmIHRoaXMucHViX3NvY2tldF9yZWFkeSA9PSB0cnVlKSB7XG4gICAgY2IobnVsbCwge1xuICAgICAgcGlkOiBwcm9jZXNzLnBpZCxcbiAgICAgIHBtMl92ZXJzaW9uOiBwa2cudmVyc2lvblxuICAgIH0pO1xuICAgIGlmICh0eXBlb2YgKHByb2Nlc3Muc2VuZCkgIT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIHByb2Nlc3Muc2VuZCh7XG4gICAgICBvbmxpbmU6IHRydWUsXG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgcGlkOiBwcm9jZXNzLnBpZCxcbiAgICAgIHBtMl92ZXJzaW9uOiBwa2cudmVyc2lvblxuICAgIH0pO1xuICB9O1xufVxuXG5EYWVtb24ucHJvdG90eXBlLmdyYWNlZnVsbEV4aXQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcblxuICAvLyBuZXZlciBleGVjdXRlIG11bHRpcGxlIGdyYWNlZnVsbEV4aXQgc2ltdWx0YW5lb3VzbHlcbiAgLy8gdGhpcyBjYW4gbGVhZCB0byBsb3NzIG9mIHNvbWUgYXBwcyBpbiBkdW1wIGZpbGVcbiAgaWYgKHRoaXMuaXNFeGl0aW5nKSByZXR1cm5cblxuICB0aGlzLmlzRXhpdGluZyA9IHRydWVcblxuICBHb2QuYnVzLmVtaXQoJ3BtMjpraWxsJywge1xuICAgIHN0YXR1czogJ2tpbGxlZCcsXG4gICAgbXNnOiAncG0yIGhhcyBiZWVuIGtpbGxlZCBieSBTSUdOQUwnXG4gIH0pO1xuXG4gIGNvbnNvbGUubG9nKCdwbTIgaGFzIGJlZW4ga2lsbGVkIGJ5IHNpZ25hbCwgZHVtcGluZyBwcm9jZXNzIGxpc3QgYmVmb3JlIGV4aXQuLi4nKTtcblxuICBpZiAoR29kLnN5c3RlbV9pbmZvc19wcm9jICE9PSBudWxsKVxuICAgIEdvZC5zeXN0ZW1faW5mb3NfcHJvYy5raWxsKClcblxuICBHb2QuZHVtcFByb2Nlc3NMaXN0KGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBwcm9jZXNzZXMgPSBHb2QuZ2V0Rm9ybWF0ZWRQcm9jZXNzZXMoKTtcblxuICAgIGVhY2hMaW1pdChwcm9jZXNzZXMsIDEsIGZ1bmN0aW9uIChwcm9jLCBuZXh0KSB7XG4gICAgICBjb25zb2xlLmxvZygnRGVsZXRpbmcgcHJvY2VzcyAlcycsIHByb2MucG0yX2Vudi5wbV9pZCk7XG4gICAgICBHb2QuZGVsZXRlUHJvY2Vzc0lkKHByb2MucG0yX2Vudi5wbV9pZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgfSk7XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZnMudW5saW5rU3luYyh0aGF0LnBpZF9wYXRoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHsgfVxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoYXQuaXNFeGl0aW5nID0gZmFsc2VcbiAgICAgICAgY29uc29sZS5sb2coJ0V4aXRlZCBwZWFjZWZ1bGx5Jyk7XG4gICAgICAgIHByb2Nlc3MuZXhpdChjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH0sIDIpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuRGFlbW9uLnByb3RvdHlwZS5zdGFydExvZ2ljID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgLyoqXG4gICAqIEFjdGlvbiB0cmVhdG1lbnQgc3BlY2lmaWNzXG4gICAqIEF0dGFjaCBhY3Rpb25zIHRvIHBtMl9lbnYuYXhtX2FjdGlvbnMgdmFyaWFibGVzIChuYW1lICsgb3B0aW9ucylcbiAgICovXG4gIEdvZC5idXMub24oJ2F4bTphY3Rpb24nLCBmdW5jdGlvbiBheG1BY3Rpb25zKG1zZykge1xuICAgIHZhciBwbTJfZW52ID0gbXNnLnByb2Nlc3M7XG4gICAgdmFyIGV4aXN0cyA9IGZhbHNlO1xuICAgIHZhciBheG1fYWN0aW9uID0gbXNnLmRhdGE7XG5cbiAgICBpZiAoIXBtMl9lbnYgfHwgIUdvZC5jbHVzdGVyc19kYltwbTJfZW52LnBtX2lkXSlcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdBWE0gQUNUSU9OIFVua25vd24gaWQgJXMnLCBwbTJfZW52LnBtX2lkKTtcblxuICAgIGlmICghR29kLmNsdXN0ZXJzX2RiW3BtMl9lbnYucG1faWRdLnBtMl9lbnYuYXhtX2FjdGlvbnMpXG4gICAgICBHb2QuY2x1c3RlcnNfZGJbcG0yX2Vudi5wbV9pZF0ucG0yX2Vudi5heG1fYWN0aW9ucyA9IFtdO1xuXG4gICAgR29kLmNsdXN0ZXJzX2RiW3BtMl9lbnYucG1faWRdLnBtMl9lbnYuYXhtX2FjdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAoYWN0aW9ucykge1xuICAgICAgaWYgKGFjdGlvbnMuYWN0aW9uX25hbWUgPT0gYXhtX2FjdGlvbi5hY3Rpb25fbmFtZSlcbiAgICAgICAgZXhpc3RzID0gdHJ1ZTtcbiAgICB9KTtcblxuICAgIGlmIChleGlzdHMgPT09IGZhbHNlKSB7XG4gICAgICBkZWJ1ZygnQWRkaW5nIGFjdGlvbicsIGF4bV9hY3Rpb24pO1xuICAgICAgR29kLmNsdXN0ZXJzX2RiW3BtMl9lbnYucG1faWRdLnBtMl9lbnYuYXhtX2FjdGlvbnMucHVzaChheG1fYWN0aW9uKTtcbiAgICB9XG4gICAgbXNnID0gbnVsbDtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZSBtb2R1bGVcbiAgICovXG4gIEdvZC5idXMub24oJ2F4bTpvcHRpb246Y29uZmlndXJhdGlvbicsIGZ1bmN0aW9uIGF4bU1vbml0b3IobXNnKSB7XG4gICAgaWYgKCFtc2cucHJvY2VzcylcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdbYXhtOm9wdGlvbjpjb25maWd1cmF0aW9uXSBubyBwcm9jZXNzIGRlZmluZWQnKTtcblxuICAgIGlmICghR29kLmNsdXN0ZXJzX2RiW21zZy5wcm9jZXNzLnBtX2lkXSlcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdbYXhtOm9wdGlvbjpjb25maWd1cmF0aW9uXSBVbmtub3duIGlkICVzJywgbXNnLnByb2Nlc3MucG1faWQpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIEFwcGxpY2F0aW9uIE5hbWUgbnZlcnJpZGVcbiAgICAgIGlmIChtc2cuZGF0YS5uYW1lKVxuICAgICAgICBHb2QuY2x1c3RlcnNfZGJbbXNnLnByb2Nlc3MucG1faWRdLnBtMl9lbnYubmFtZSA9IG1zZy5kYXRhLm5hbWU7XG5cbiAgICAgIE9iamVjdC5rZXlzKG1zZy5kYXRhKS5mb3JFYWNoKGZ1bmN0aW9uIChjb25mX2tleSkge1xuICAgICAgICBHb2QuY2x1c3RlcnNfZGJbbXNnLnByb2Nlc3MucG1faWRdLnBtMl9lbnYuYXhtX29wdGlvbnNbY29uZl9rZXldID0gVXRpbGl0eS5jbG9uZShtc2cuZGF0YVtjb25mX2tleV0pO1xuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgIH1cbiAgICBtc2cgPSBudWxsO1xuICB9KTtcblxuICAvKipcbiAgICogUHJvY2VzcyBtb25pdG9yaW5nIGRhdGEgKHByb2JlcylcbiAgICovXG4gIEdvZC5idXMub24oJ2F4bTptb25pdG9yJywgZnVuY3Rpb24gYXhtTW9uaXRvcihtc2cpIHtcbiAgICBpZiAoIW1zZy5wcm9jZXNzKVxuICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ1theG06bW9uaXRvcl0gbm8gcHJvY2VzcyBkZWZpbmVkJyk7XG5cbiAgICBpZiAoIW1zZy5wcm9jZXNzIHx8ICFHb2QuY2x1c3RlcnNfZGJbbXNnLnByb2Nlc3MucG1faWRdKVxuICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0FYTSBNT05JVE9SIFVua25vd24gaWQgJXMnLCBtc2cucHJvY2Vzcy5wbV9pZCk7XG5cbiAgICB1dGlsLmluaGVyaXRzKEdvZC5jbHVzdGVyc19kYlttc2cucHJvY2Vzcy5wbV9pZF0ucG0yX2Vudi5heG1fbW9uaXRvciwgVXRpbGl0eS5jbG9uZShtc2cuZGF0YSkpO1xuICAgIG1zZyA9IG51bGw7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBCcm9hZGNhc3QgbWVzc2FnZXNcbiAgICovXG4gIEdvZC5idXMub25BbnkoZnVuY3Rpb24gKGV2ZW50LCBkYXRhX3YpIHtcbiAgICBpZiAoWydheG06YWN0aW9uJyxcbiAgICAgICdheG06bW9uaXRvcicsXG4gICAgICAnYXhtOm9wdGlvbjpzZXRQSUQnLFxuICAgICAgJ2F4bTpvcHRpb246Y29uZmlndXJhdGlvbiddLmluZGV4T2YoZXZlbnQpID4gLTEpIHtcbiAgICAgIGRhdGFfdiA9IG51bGw7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoYXQucHViLmVtaXQoZXZlbnQsIFV0aWxpdHkuY2xvbmUoZGF0YV92KSk7XG4gICAgZGF0YV92ID0gbnVsbDtcbiAgfSk7XG59O1xuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgcHJvY2Vzcy50aXRsZSA9IHByb2Nlc3MuZW52LlBNMl9EQUVNT05fVElUTEUgfHwgJ1BNMiB2JyArIHBrZy52ZXJzaW9uICsgJzogR29kIERhZW1vbiAoJyArIHByb2Nlc3MuZW52LlBNMl9IT01FICsgJyknO1xuXG4gIHZhciBkYWVtb24gPSBuZXcgRGFlbW9uKCk7XG5cbiAgZGFlbW9uLnN0YXJ0KCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IERhZW1vbjtcbiJdfQ==