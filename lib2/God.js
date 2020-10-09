"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _cluster = _interopRequireDefault(require("cluster"));

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _eventemitter = require("eventemitter2");

var _fs = _interopRequireDefault(require("fs"));

var _vizion = _interopRequireDefault(require("vizion"));

var _debug = _interopRequireDefault(require("debug"));

var _Utility = _interopRequireDefault(require("./Utility"));

var _constants = _interopRequireDefault(require("../constants"));

var _timesLimit = _interopRequireDefault(require("async/timesLimit"));

var _Configuration = _interopRequireDefault(require("./Configuration"));

var _semver = _interopRequireDefault(require("semver"));

var _Event = _interopRequireDefault(require("./Event"));

var _Methods = _interopRequireDefault(require("./God/Methods"));

var _ForkMode = _interopRequireDefault(require("./God/ForkMode"));

var _ClusterMode = _interopRequireDefault(require("./God/ClusterMode"));

var _Reload = _interopRequireDefault(require("./God/Reload"));

var _ActionMethods = _interopRequireDefault(require("./God/ActionMethods"));

var _Watcher = _interopRequireDefault(require("./Watcher"));

var _Worker = _interopRequireDefault(require("./Worker"));

var _SystemInfo = _interopRequireDefault(require("./Sysinfo/SystemInfo"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */

/******************************
 *    ______ _______ ______
 *   |   __ \   |   |__    |
 *   |    __/       |    __|
 *   |___|  |__|_|__|______|
 *
 *    Main Daemon side file
 *
 ******************************/

/**
 * Populate God namespace
 */
var numCPUs = _os["default"].cpus() ? _os["default"].cpus().length : 1;
var debug = (0, _debug["default"])('pm2:god');
/**
 * Override cluster module configuration
 */

if (_semver["default"].lt(process.version, '10.0.0')) {
  _cluster["default"].setupMaster({
    // TODO: please check this
    // windowsHide: true,
    exec: _path["default"].resolve(_path["default"].dirname(module.filename), 'ProcessContainerLegacy.js')
  });
} else {
  _cluster["default"].setupMaster({
    // TODO: please check this
    // windowsHide: true,
    exec: _path["default"].resolve(_path["default"].dirname(module.filename), 'ProcessContainer.js')
  });
}
/**
 * Expose God
 */


var God = {
  next_id: 0,
  clusters_db: {},
  configuration: {},
  started_at: Date.now(),
  system_infos_proc: null,
  system_infos: null,
  bus: new _eventemitter.EventEmitter2({
    wildcard: true,
    delimiter: ':',
    maxListeners: 1000
  })
};

_Utility["default"].overrideConsole(God.bus);
/**
 * Populate God namespace
 */


(0, _Event["default"])(God);
(0, _Methods["default"])(God);
(0, _ForkMode["default"])(God);
(0, _ClusterMode["default"])(God);
(0, _Reload["default"])(God);
(0, _ActionMethods["default"])(God);
(0, _Watcher["default"])(God);

God.init = function () {
  (0, _Worker["default"])(this);
  God.system_infos_proc = null;
  this.configuration = _Configuration["default"].getSync('pm2');

  if (this.configuration && this.configuration.sysmonit == 'true') {
    God.launchSysMonitoring({}, function () {
      console.log('System monitoring launched');
    });
  }

  setTimeout(function () {
    God.Worker.start();
  }, 500);
};

God.writeExitSeparator = function (pm2_env, code, signal) {
  try {
    var exit_sep = "[PM2][".concat(new Date().toISOString(), "] app exited");
    if (code) exit_sep += "itself with exit code: ".concat(code);
    if (signal) exit_sep += "by an external signal: ".concat(signal);
    exit_sep += '\n';
    if (pm2_env.pm_out_log_path) _fs["default"].writeFileSync(pm2_env.pm_out_log_path, exit_sep);
    if (pm2_env.pm_err_log_path) _fs["default"].writeFileSync(pm2_env.pm_err_log_path, exit_sep);
    if (pm2_env.pm_log_path) _fs["default"].writeFileSync(pm2_env.pm_log_path, exit_sep);
  } catch (e) {}
};
/**
 * Init new process
 */


God.prepare = function prepare(env, cb) {
  // generate a new unique id for each processes
  env.env.unique_id = _Utility["default"].generateUUID(); // if the app is standalone, no multiple instance

  if (typeof env.instances === 'undefined') {
    env.vizion_running = false;
    if (env.env && env.env.vizion_running) env.env.vizion_running = false;

    if (env.status == _constants["default"].STOPPED_STATUS) {
      env.pm_id = God.getNewId();
      var clu = {
        pm2_env: env,
        process: {}
      };
      God.clusters_db[env.pm_id] = clu;
      return cb(null, [God.clusters_db[env.pm_id]]);
    }

    return God.executeApp(env, function (err, clu) {
      if (err) return cb(err);
      God.notify('start', clu, true);
      return cb(null, [_Utility["default"].clone(clu)]);
    });
  } // find how many replicate the user want


  env.instances = parseInt(env.instances);

  if (env.instances === 0) {
    env.instances = numCPUs;
  } else if (env.instances < 0) {
    env.instances += numCPUs;
  }

  if (env.instances <= 0) {
    env.instances = 1;
  }

  (0, _timesLimit["default"])(env.instances, 1, function (n, next) {
    env.vizion_running = false;

    if (env.env && env.env.vizion_running) {
      env.env.vizion_running = false;
    }

    God.injectVariables(env, function inject(err, _env) {
      if (err) return next(err);
      return God.executeApp(_Utility["default"].clone(_env), function (err, clu) {
        if (err) return next(err);
        God.notify('start', clu, true); // here call next wihtout an array because
        // async.times aggregate the result into an array

        return next(null, _Utility["default"].clone(clu));
      });
    });
  }, cb);
};
/**
 * Launch the specified script (present in env)
 * @api private
 * @method executeApp
 * @param {Mixed} env
 * @param {Function} cb
 * @return Literal
 */


God.executeApp = function executeApp(env, cb) {
  var env_copy = _Utility["default"].clone(env);

  _Utility["default"].extend(env_copy, env_copy.env);

  env_copy['status'] = _constants["default"].LAUNCHING_STATUS;
  env_copy['pm_uptime'] = Date.now();
  env_copy['axm_actions'] = [];
  env_copy['axm_monitor'] = {};
  env_copy['axm_options'] = {};
  env_copy['axm_dynamic'] = {};
  env_copy['vizion_running'] = env_copy['vizion_running'] !== undefined ? env_copy['vizion_running'] : false;
  if (!env_copy.created_at) env_copy['created_at'] = Date.now();
  /**
   * Enter here when it's the first time that the process is created
   * 1 - Assign a new id
   * 2 - Reset restart time and unstable_restarts
   * 3 - Assign a log file name depending on the id
   * 4 - If watch option is set, look for changes
   */

  if (env_copy['pm_id'] === undefined) {
    env_copy['pm_id'] = God.getNewId();
    env_copy['restart_time'] = 0;
    env_copy['unstable_restarts'] = 0; // add -pm_id to pid file

    env_copy.pm_pid_path = env_copy.pm_pid_path.replace(/-[0-9]+\.pid$|\.pid$/g, '-' + env_copy['pm_id'] + '.pid'); // If merge option, dont separate the logs

    if (!env_copy['merge_logs']) {
      ['', '_out', '_err'].forEach(function (k) {
        var key = 'pm' + k + '_log_path';
        env_copy[key] && (env_copy[key] = env_copy[key].replace(/-[0-9]+\.log$|\.log$/g, '-' + env_copy['pm_id'] + '.log'));
      });
    } // Initiate watch file


    if (env_copy['watch']) {
      God.watch.enable(env_copy);
    }
  }

  God.registerCron(env_copy);
  /** Callback when application is launched */

  var readyCb = function ready(proc) {
    // If vizion enabled run versioning retrieval system
    if (proc.pm2_env.vizion !== false && proc.pm2_env.vizion !== "false") God.finalizeProcedure(proc);else God.notify('online', proc);
    if (proc.pm2_env.status !== _constants["default"].ERRORED_STATUS) proc.pm2_env.status = _constants["default"].ONLINE_STATUS;
    console.log("App [".concat(proc.pm2_env.name, ":").concat(proc.pm2_env.pm_id, "] online"));
    if (cb) cb(null, proc);
  };

  if (env_copy.exec_mode === 'cluster_mode') {
    /**
     * Cluster mode logic (for NodeJS apps)
     */
    God.nodeApp(env_copy, function nodeApp(err, clu) {
      if (cb && err) return cb(err);
      if (err) return false;
      var old_env = God.clusters_db[clu.pm2_env.pm_id];

      if (old_env) {
        old_env = null;
        God.clusters_db[clu.pm2_env.pm_id] = null;
      }

      God.clusters_db[clu.pm2_env.pm_id] = clu;
      clu.once('error', function (err) {
        console.error(err.stack || err);
        clu.pm2_env.status = _constants["default"].ERRORED_STATUS;

        try {
          clu.destroy && clu.destroy();
        } catch (e) {
          console.error(e.stack || e);
          God.handleExit(clu, _constants["default"].ERROR_EXIT);
        }
      });
      clu.once('disconnect', function () {
        console.log('App name:%s id:%s disconnected', clu.pm2_env.name, clu.pm2_env.pm_id);
      });
      clu.once('exit', function cluExit(code, signal) {
        //God.writeExitSeparator(clu.pm2_env, code, signal)
        God.handleExit(clu, code || 0, signal || 'SIGINT');
      });
      return clu.once('online', function () {
        if (!clu.pm2_env.wait_ready) return readyCb(clu); // Timeout if the ready message has not been sent before listen_timeout

        var ready_timeout = setTimeout(function () {
          God.bus.removeListener('process:msg', listener);
          return readyCb(clu);
        }, clu.pm2_env.listen_timeout || _constants["default"].GRACEFUL_LISTEN_TIMEOUT);

        var listener = function listener(packet) {
          if (packet.raw === 'ready' && packet.process.name === clu.pm2_env.name && packet.process.pm_id === clu.pm2_env.pm_id) {
            clearTimeout(ready_timeout);
            God.bus.removeListener('process:msg', listener);
            return readyCb(clu);
          }
        };

        God.bus.on('process:msg', listener);
      });
    });
  } else {
    /**
     * Fork mode logic
     */
    God.forkMode(env_copy, function forkMode(err, clu) {
      if (cb && err) return cb(err);
      if (err) return false;
      var old_env = God.clusters_db[clu.pm2_env.pm_id];
      if (old_env) old_env = null;
      God.clusters_db[env_copy.pm_id] = clu;
      clu.once('error', function cluError(err) {
        console.error(err.stack || err);
        clu.pm2_env.status = _constants["default"].ERRORED_STATUS;

        try {
          clu.kill && clu.kill();
        } catch (e) {
          console.error(e.stack || e);
          God.handleExit(clu, _constants["default"].ERROR_EXIT);
        }
      });
      clu.once('exit', function cluClose(code, signal) {
        //God.writeExitSeparator(clu.pm2_env, code, signal)
        if (clu.connected === true) clu.disconnect && clu.disconnect();
        clu._reloadLogs = null;
        return God.handleExit(clu, code || 0, signal);
      });
      if (!clu.pm2_env.wait_ready) return readyCb(clu); // Timeout if the ready message has not been sent before listen_timeout

      var ready_timeout = setTimeout(function () {
        God.bus.removeListener('process:msg', listener);
        return readyCb(clu);
      }, clu.pm2_env.listen_timeout || _constants["default"].GRACEFUL_LISTEN_TIMEOUT);

      var listener = function listener(packet) {
        if (packet.raw === 'ready' && packet.process.name === clu.pm2_env.name && packet.process.pm_id === clu.pm2_env.pm_id) {
          clearTimeout(ready_timeout);
          God.bus.removeListener('process:msg', listener);
          return readyCb(clu);
        }
      };

      God.bus.on('process:msg', listener);
    });
  }

  return false;
};
/**
 * Handle logic when a process exit (Node or Fork)
 * @method handleExit
 * @param {} clu
 * @param {} exit_code
 * @return
 */


God.handleExit = function handleExit(clu, exit_code, kill_signal) {
  console.log("App [".concat(clu.pm2_env.name, ":").concat(clu.pm2_env.pm_id, "] exited with code [").concat(exit_code, "] via signal [").concat(kill_signal || 'SIGINT', "]"));
  var proc = this.clusters_db[clu.pm2_env.pm_id];

  if (!proc) {
    console.error('Process undefined ? with process id ', clu.pm2_env.pm_id);
    return false;
  }

  var stopping = proc.pm2_env.status == _constants["default"].STOPPING_STATUS || proc.pm2_env.status == _constants["default"].STOPPED_STATUS || proc.pm2_env.status == _constants["default"].ERRORED_STATUS || proc.pm2_env.autorestart === false || proc.pm2_env.autorestart === "false";
  var overlimit = false;
  if (stopping) proc.process.pid = 0; // Reset probes and actions

  if (proc.pm2_env.axm_actions) proc.pm2_env.axm_actions = [];
  if (proc.pm2_env.axm_monitor) proc.pm2_env.axm_monitor = {};
  if (proc.pm2_env.status != _constants["default"].ERRORED_STATUS && proc.pm2_env.status != _constants["default"].STOPPING_STATUS) proc.pm2_env.status = _constants["default"].STOPPED_STATUS;

  if (proc.pm2_env.pm_id.toString().indexOf('_old_') !== 0) {
    try {
      _fs["default"].unlinkSync(proc.pm2_env.pm_pid_path);
    } catch (e) {
      debug('Error when unlinking pid file', e);
    }
  }
  /**
   * Avoid infinite reloop if an error is present
   */
  // If the process has been created less than 15seconds ago
  // And if the process has an uptime less than a second


  var min_uptime = typeof proc.pm2_env.min_uptime !== 'undefined' ? proc.pm2_env.min_uptime : 1000;
  var max_restarts = typeof proc.pm2_env.max_restarts !== 'undefined' ? proc.pm2_env.max_restarts : 16;

  if (Date.now() - proc.pm2_env.created_at < min_uptime * max_restarts) {
    if (Date.now() - proc.pm2_env.pm_uptime < min_uptime) {
      // Increment unstable restart
      proc.pm2_env.unstable_restarts += 1;
    }
  }

  if (proc.pm2_env.unstable_restarts >= max_restarts) {
    // Too many unstable restart in less than 15 seconds
    // Set the process as 'ERRORED'
    // And stop restarting it
    proc.pm2_env.status = _constants["default"].ERRORED_STATUS;
    proc.process.pid = 0;
    console.log('Script %s had too many unstable restarts (%d). Stopped. %j', proc.pm2_env.pm_exec_path, proc.pm2_env.unstable_restarts, proc.pm2_env.status);
    God.notify('restart overlimit', proc);
    proc.pm2_env.unstable_restarts = 0;
    proc.pm2_env.created_at = null;
    overlimit = true;
  }

  if (typeof exit_code !== 'undefined') proc.pm2_env.exit_code = exit_code;
  God.notify('exit', proc);

  if (God.pm2_being_killed) {
    //console.log('[HandleExit] PM2 is being killed, stopping restart procedure...');
    return false;
  }

  var restart_delay = 0;

  if (proc.pm2_env.restart_delay !== undefined && !isNaN(parseInt(proc.pm2_env.restart_delay))) {
    proc.pm2_env.status = _constants["default"].WAITING_RESTART;
    restart_delay = parseInt(proc.pm2_env.restart_delay);
  }

  if (proc.pm2_env.exp_backoff_restart_delay !== undefined && !isNaN(parseInt(proc.pm2_env.exp_backoff_restart_delay))) {
    proc.pm2_env.status = _constants["default"].WAITING_RESTART;

    if (!proc.pm2_env.prev_restart_delay) {
      proc.pm2_env.prev_restart_delay = proc.pm2_env.exp_backoff_restart_delay;
      restart_delay = proc.pm2_env.exp_backoff_restart_delay;
    } else {
      proc.pm2_env.prev_restart_delay = Math.floor(Math.min(15000, proc.pm2_env.prev_restart_delay * 1.5));
      restart_delay = proc.pm2_env.prev_restart_delay;
    }

    console.log("App [".concat(clu.pm2_env.name, ":").concat(clu.pm2_env.pm_id, "] will restart in ").concat(restart_delay, "ms"));
  }

  if (!stopping && !overlimit) {
    //make this property unenumerable
    Object.defineProperty(proc.pm2_env, 'restart_task', {
      configurable: true,
      writable: true
    });
    proc.pm2_env.restart_task = setTimeout(function () {
      proc.pm2_env.restart_time += 1;
      God.executeApp(proc.pm2_env);
    }, restart_delay);
  }

  return false;
};
/**
 * @method finalizeProcedure
 * @param proc {Object}
 * @return
 */


God.finalizeProcedure = function finalizeProcedure(proc) {
  var last_path = '';

  var current_path = proc.pm2_env.cwd || _path["default"].dirname(proc.pm2_env.pm_exec_path);

  var proc_id = proc.pm2_env.pm_id;
  proc.pm2_env.version = _Utility["default"].findPackageVersion(proc.pm2_env.pm_exec_path || proc.pm2_env.cwd);

  if (proc.pm2_env.vizion_running === true) {
    debug('Vizion is already running for proc id: %d, skipping this round', proc_id);
    return God.notify('online', proc);
  }

  proc.pm2_env.vizion_running = true;

  _vizion["default"].analyze({
    folder: current_path
  }, function recur_path(err, meta) {
    var proc = God.clusters_db[proc_id];
    if (err) debug(err.stack || err);

    if (!proc || !proc.pm2_env || proc.pm2_env.status == _constants["default"].STOPPED_STATUS || proc.pm2_env.status == _constants["default"].STOPPING_STATUS || proc.pm2_env.status == _constants["default"].ERRORED_STATUS) {
      return console.error('Cancelling versioning data parsing');
    }

    proc.pm2_env.vizion_running = false;

    if (!err) {
      proc.pm2_env.versioning = meta;
      proc.pm2_env.versioning.repo_path = current_path;
      God.notify('online', proc);
    } else if (err && current_path === last_path) {
      proc.pm2_env.versioning = null;
      God.notify('online', proc);
    } else {
      last_path = current_path;
      current_path = _path["default"].dirname(current_path);
      proc.pm2_env.vizion_running = true;

      _vizion["default"].analyze({
        folder: current_path
      }, recur_path);
    }

    return false;
  });
};
/**
 * Inject variables into processes
 * @param {Object} env environnement to be passed to the process
 * @param {Function} cb invoked with <err, env>
 */


God.injectVariables = function injectVariables(env, cb) {
  // allow to override the key of NODE_APP_INSTANCE if wanted
  var instanceKey = process.env.PM2_PROCESS_INSTANCE_VAR || env.instance_var; // we need to find the last NODE_APP_INSTANCE used

  var instances = Object.keys(God.clusters_db).map(function (procId) {
    return God.clusters_db[procId];
  }).filter(function (proc) {
    return proc.pm2_env.name === env.name && typeof proc.pm2_env[instanceKey] !== 'undefined';
  }).map(function (proc) {
    return proc.pm2_env[instanceKey];
  }).sort(function (a, b) {
    return b - a;
  }); // default to last one + 1

  var instanceNumber = typeof instances[0] === 'undefined' ? 0 : instances[0] + 1; // but try to find a one available

  for (var i = 0; i < instances.length; i++) {
    if (instances.indexOf(i) === -1) {
      instanceNumber = i;
      break;
    }
  }

  env[instanceKey] = instanceNumber; // if using increment_var, we need to increment it

  if (env.increment_var) {
    var lastIncrement = Object.keys(God.clusters_db).map(function (procId) {
      return God.clusters_db[procId];
    }).filter(function (proc) {
      return proc.pm2_env.name === env.name && typeof proc.pm2_env[env.increment_var] !== 'undefined';
    }).map(function (proc) {
      return proc.pm2_env[env.increment_var];
    }).sort(function (a, b) {
      return b - a;
    })[0]; // inject a incremental variable

    var defaut = env.env[env.increment_var] || 0;
    env[env.increment_var] = typeof lastIncrement === 'undefined' ? defaut : lastIncrement + 1;
    env.env[env.increment_var] = env[env.increment_var];
  }

  return cb(null, env);
};

God.launchSysMonitoring = function (env, cb) {
  if (God.system_infos_proc !== null) return cb(new Error('Sys Monitoring already launched'));

  try {
    God.system_infos_proc = new _SystemInfo["default"]();
    setInterval(function () {
      God.system_infos_proc.query(function (err, data) {
        if (err) return;
        God.system_infos = data;
      });
    }, 1000);
    God.system_infos_proc.fork();
  } catch (e) {
    console.log(e);
    God.system_infos_proc = null;
  }

  return cb();
};

God.init();
var _default = God;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Hb2QudHMiXSwibmFtZXMiOlsibnVtQ1BVcyIsIm9zIiwiY3B1cyIsImxlbmd0aCIsImRlYnVnIiwic2VtdmVyIiwibHQiLCJwcm9jZXNzIiwidmVyc2lvbiIsImNsdXN0ZXIiLCJzZXR1cE1hc3RlciIsImV4ZWMiLCJwYXRoIiwicmVzb2x2ZSIsImRpcm5hbWUiLCJtb2R1bGUiLCJmaWxlbmFtZSIsIkdvZCIsIm5leHRfaWQiLCJjbHVzdGVyc19kYiIsImNvbmZpZ3VyYXRpb24iLCJzdGFydGVkX2F0IiwiRGF0ZSIsIm5vdyIsInN5c3RlbV9pbmZvc19wcm9jIiwic3lzdGVtX2luZm9zIiwiYnVzIiwiRXZlbnRFbWl0dGVyMiIsIndpbGRjYXJkIiwiZGVsaW1pdGVyIiwibWF4TGlzdGVuZXJzIiwiVXRpbGl0eSIsIm92ZXJyaWRlQ29uc29sZSIsImluaXQiLCJDb25maWd1cmF0aW9uIiwiZ2V0U3luYyIsInN5c21vbml0IiwibGF1bmNoU3lzTW9uaXRvcmluZyIsImNvbnNvbGUiLCJsb2ciLCJzZXRUaW1lb3V0IiwiV29ya2VyIiwic3RhcnQiLCJ3cml0ZUV4aXRTZXBhcmF0b3IiLCJwbTJfZW52IiwiY29kZSIsInNpZ25hbCIsImV4aXRfc2VwIiwidG9JU09TdHJpbmciLCJwbV9vdXRfbG9nX3BhdGgiLCJmcyIsIndyaXRlRmlsZVN5bmMiLCJwbV9lcnJfbG9nX3BhdGgiLCJwbV9sb2dfcGF0aCIsImUiLCJwcmVwYXJlIiwiZW52IiwiY2IiLCJ1bmlxdWVfaWQiLCJnZW5lcmF0ZVVVSUQiLCJpbnN0YW5jZXMiLCJ2aXppb25fcnVubmluZyIsInN0YXR1cyIsImNzdCIsIlNUT1BQRURfU1RBVFVTIiwicG1faWQiLCJnZXROZXdJZCIsImNsdSIsImV4ZWN1dGVBcHAiLCJlcnIiLCJub3RpZnkiLCJjbG9uZSIsInBhcnNlSW50IiwibiIsIm5leHQiLCJpbmplY3RWYXJpYWJsZXMiLCJpbmplY3QiLCJfZW52IiwiZW52X2NvcHkiLCJleHRlbmQiLCJMQVVOQ0hJTkdfU1RBVFVTIiwidW5kZWZpbmVkIiwiY3JlYXRlZF9hdCIsInBtX3BpZF9wYXRoIiwicmVwbGFjZSIsImZvckVhY2giLCJrIiwia2V5Iiwid2F0Y2giLCJlbmFibGUiLCJyZWdpc3RlckNyb24iLCJyZWFkeUNiIiwicmVhZHkiLCJwcm9jIiwidml6aW9uIiwiZmluYWxpemVQcm9jZWR1cmUiLCJFUlJPUkVEX1NUQVRVUyIsIk9OTElORV9TVEFUVVMiLCJuYW1lIiwiZXhlY19tb2RlIiwibm9kZUFwcCIsIm9sZF9lbnYiLCJvbmNlIiwiZXJyb3IiLCJzdGFjayIsImRlc3Ryb3kiLCJoYW5kbGVFeGl0IiwiRVJST1JfRVhJVCIsImNsdUV4aXQiLCJ3YWl0X3JlYWR5IiwicmVhZHlfdGltZW91dCIsInJlbW92ZUxpc3RlbmVyIiwibGlzdGVuZXIiLCJsaXN0ZW5fdGltZW91dCIsIkdSQUNFRlVMX0xJU1RFTl9USU1FT1VUIiwicGFja2V0IiwicmF3IiwiY2xlYXJUaW1lb3V0Iiwib24iLCJmb3JrTW9kZSIsImNsdUVycm9yIiwia2lsbCIsImNsdUNsb3NlIiwiY29ubmVjdGVkIiwiZGlzY29ubmVjdCIsIl9yZWxvYWRMb2dzIiwiZXhpdF9jb2RlIiwia2lsbF9zaWduYWwiLCJzdG9wcGluZyIsIlNUT1BQSU5HX1NUQVRVUyIsImF1dG9yZXN0YXJ0Iiwib3ZlcmxpbWl0IiwicGlkIiwiYXhtX2FjdGlvbnMiLCJheG1fbW9uaXRvciIsInRvU3RyaW5nIiwiaW5kZXhPZiIsInVubGlua1N5bmMiLCJtaW5fdXB0aW1lIiwibWF4X3Jlc3RhcnRzIiwicG1fdXB0aW1lIiwidW5zdGFibGVfcmVzdGFydHMiLCJwbV9leGVjX3BhdGgiLCJwbTJfYmVpbmdfa2lsbGVkIiwicmVzdGFydF9kZWxheSIsImlzTmFOIiwiV0FJVElOR19SRVNUQVJUIiwiZXhwX2JhY2tvZmZfcmVzdGFydF9kZWxheSIsInByZXZfcmVzdGFydF9kZWxheSIsIk1hdGgiLCJmbG9vciIsIm1pbiIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJyZXN0YXJ0X3Rhc2siLCJyZXN0YXJ0X3RpbWUiLCJsYXN0X3BhdGgiLCJjdXJyZW50X3BhdGgiLCJjd2QiLCJwcm9jX2lkIiwiZmluZFBhY2thZ2VWZXJzaW9uIiwiYW5hbHl6ZSIsImZvbGRlciIsInJlY3VyX3BhdGgiLCJtZXRhIiwidmVyc2lvbmluZyIsInJlcG9fcGF0aCIsImluc3RhbmNlS2V5IiwiUE0yX1BST0NFU1NfSU5TVEFOQ0VfVkFSIiwiaW5zdGFuY2VfdmFyIiwia2V5cyIsIm1hcCIsInByb2NJZCIsImZpbHRlciIsInNvcnQiLCJhIiwiYiIsImluc3RhbmNlTnVtYmVyIiwiaSIsImluY3JlbWVudF92YXIiLCJsYXN0SW5jcmVtZW50IiwiZGVmYXV0IiwiRXJyb3IiLCJzeXNpbmZvIiwic2V0SW50ZXJ2YWwiLCJxdWVyeSIsImRhdGEiLCJmb3JrIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUtBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOzs7O0FBekNBOzs7Ozs7QUFNQTs7Ozs7Ozs7OztBQXVCQTs7O0FBY0EsSUFBTUEsT0FBTyxHQUFHQyxlQUFHQyxJQUFILEtBQVlELGVBQUdDLElBQUgsR0FBVUMsTUFBdEIsR0FBK0IsQ0FBL0M7QUFDQSxJQUFNQyxLQUFLLEdBQUcsdUJBQVksU0FBWixDQUFkO0FBRUE7Ozs7QUFHQSxJQUFJQyxtQkFBT0MsRUFBUCxDQUFVQyxPQUFPLENBQUNDLE9BQWxCLEVBQTJCLFFBQTNCLENBQUosRUFBMEM7QUFDeENDLHNCQUFRQyxXQUFSLENBQW9CO0FBQ2xCO0FBQ0E7QUFDQUMsSUFBQUEsSUFBSSxFQUFHQyxpQkFBS0MsT0FBTCxDQUFhRCxpQkFBS0UsT0FBTCxDQUFhQyxNQUFNLENBQUNDLFFBQXBCLENBQWIs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cm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIGxpY2Vuc2UgdGhhdFxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4gKi9cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgX19fX19fIF9fX19fX18gX19fX19fXG4gKiAgIHwgICBfXyBcXCAgIHwgICB8X18gICAgfFxuICogICB8ICAgIF9fLyAgICAgICB8ICAgIF9ffFxuICogICB8X19ffCAgfF9ffF98X198X19fX19ffFxuICpcbiAqICAgIE1haW4gRGFlbW9uIHNpZGUgZmlsZVxuICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmltcG9ydCBjbHVzdGVyICAgICAgIGZyb20gJ2NsdXN0ZXInO1xuaW1wb3J0IG9zICAgICAgIGZyb20gJ29zJztcbmltcG9ydCBwYXRoICAgICAgICAgIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyMiB9IGZyb20gJ2V2ZW50ZW1pdHRlcjInO1xuaW1wb3J0IGZzICAgICAgICAgICAgZnJvbSAnZnMnO1xuaW1wb3J0IHZpemlvbiAgICAgICAgZnJvbSAndml6aW9uJztcbmltcG9ydCBkZWJ1Z0xvZ2dlciAgICAgICAgIGZyb20gJ2RlYnVnJztcbmltcG9ydCBVdGlsaXR5ICAgICAgIGZyb20gJy4vVXRpbGl0eSc7XG5pbXBvcnQgY3N0ICAgICAgICAgICBmcm9tICcuLi9jb25zdGFudHMnO1xuaW1wb3J0IHRpbWVzTGltaXQgICAgZnJvbSAnYXN5bmMvdGltZXNMaW1pdCc7XG5pbXBvcnQgQ29uZmlndXJhdGlvbiBmcm9tICcuL0NvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHNlbXZlciAgICAgICAgZnJvbSAnc2VtdmVyJztcblxuLyoqXG4gKiBQb3B1bGF0ZSBHb2QgbmFtZXNwYWNlXG4gKi9cbmltcG9ydCBHb2RFdmVudCBmcm9tICcuL0V2ZW50JztcbmltcG9ydCBHb2RNZXRob2RzIGZyb20gJy4vR29kL01ldGhvZHMnO1xuaW1wb3J0IEdvZEZvcmtNb2RlIGZyb20gJy4vR29kL0ZvcmtNb2RlJztcbmltcG9ydCBHb2RDbHVzdGVyTW9kZSBmcm9tICcuL0dvZC9DbHVzdGVyTW9kZSc7XG5pbXBvcnQgR29kUmVsb2FkIGZyb20gJy4vR29kL1JlbG9hZCc7XG5pbXBvcnQgR29kQWN0aW9uTWV0aG9kcyBmcm9tICcuL0dvZC9BY3Rpb25NZXRob2RzJztcbmltcG9ydCBHb2RXYXRjaGVyIGZyb20gJy4vV2F0Y2hlcic7XG5pbXBvcnQgR29kV29ya2VyIGZyb20gJy4vV29ya2VyJztcblxuaW1wb3J0IHN5c2luZm8gZnJvbSAnLi9TeXNpbmZvL1N5c3RlbUluZm8nXG5cbmNvbnN0IG51bUNQVXMgPSBvcy5jcHVzKCkgPyBvcy5jcHVzKCkubGVuZ3RoIDogMTtcbmNvbnN0IGRlYnVnID0gZGVidWdMb2dnZXIoJ3BtMjpnb2QnKTtcblxuLyoqXG4gKiBPdmVycmlkZSBjbHVzdGVyIG1vZHVsZSBjb25maWd1cmF0aW9uXG4gKi9cbmlmIChzZW12ZXIubHQocHJvY2Vzcy52ZXJzaW9uLCAnMTAuMC4wJykpIHtcbiAgY2x1c3Rlci5zZXR1cE1hc3Rlcih7XG4gICAgLy8gVE9ETzogcGxlYXNlIGNoZWNrIHRoaXNcbiAgICAvLyB3aW5kb3dzSGlkZTogdHJ1ZSxcbiAgICBleGVjIDogcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShtb2R1bGUuZmlsZW5hbWUpLCAnUHJvY2Vzc0NvbnRhaW5lckxlZ2FjeS5qcycpXG4gIH0pO1xufVxuZWxzZSB7XG4gIGNsdXN0ZXIuc2V0dXBNYXN0ZXIoe1xuICAgIC8vIFRPRE86IHBsZWFzZSBjaGVjayB0aGlzXG4gICAgLy8gd2luZG93c0hpZGU6IHRydWUsXG4gICAgZXhlYyA6IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUobW9kdWxlLmZpbGVuYW1lKSwgJ1Byb2Nlc3NDb250YWluZXIuanMnKVxuICB9KTtcbn1cblxuLyoqXG4gKiBFeHBvc2UgR29kXG4gKi9cbnZhciBHb2Q6IGFueSA9IHtcbiAgbmV4dF9pZCA6IDAsXG4gIGNsdXN0ZXJzX2RiIDoge30sXG4gIGNvbmZpZ3VyYXRpb246IHt9LFxuICBzdGFydGVkX2F0IDogRGF0ZS5ub3coKSxcbiAgc3lzdGVtX2luZm9zX3Byb2M6IG51bGwsXG4gIHN5c3RlbV9pbmZvczogbnVsbCxcbiAgYnVzIDogbmV3IEV2ZW50RW1pdHRlcjIoe1xuICAgIHdpbGRjYXJkOiB0cnVlLFxuICAgIGRlbGltaXRlcjogJzonLFxuICAgIG1heExpc3RlbmVyczogMTAwMFxuICB9KVxufTtcblxuVXRpbGl0eS5vdmVycmlkZUNvbnNvbGUoR29kLmJ1cyk7XG5cbi8qKlxuICogUG9wdWxhdGUgR29kIG5hbWVzcGFjZVxuICovXG5Hb2RFdmVudChHb2QpO1xuR29kTWV0aG9kcyhHb2QpO1xuR29kRm9ya01vZGUoR29kKTtcbkdvZENsdXN0ZXJNb2RlKEdvZCk7XG5Hb2RSZWxvYWQoR29kKTtcbkdvZEFjdGlvbk1ldGhvZHMoR29kKTtcbkdvZFdhdGNoZXIoR29kKTtcblxuR29kLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgR29kV29ya2VyKHRoaXMpXG4gIEdvZC5zeXN0ZW1faW5mb3NfcHJvYyA9IG51bGxcblxuICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBDb25maWd1cmF0aW9uLmdldFN5bmMoJ3BtMicpXG5cbiAgaWYgKHRoaXMuY29uZmlndXJhdGlvbiAmJiB0aGlzLmNvbmZpZ3VyYXRpb24uc3lzbW9uaXQgPT0gJ3RydWUnKSB7XG4gICAgR29kLmxhdW5jaFN5c01vbml0b3Jpbmcoe30sICgpID0+IHsgY29uc29sZS5sb2coJ1N5c3RlbSBtb25pdG9yaW5nIGxhdW5jaGVkJykgfSlcbiAgfVxuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgR29kLldvcmtlci5zdGFydCgpXG4gIH0sIDUwMClcbn1cblxuR29kLndyaXRlRXhpdFNlcGFyYXRvciA9IGZ1bmN0aW9uKHBtMl9lbnYsIGNvZGUsIHNpZ25hbCkge1xuICB0cnkge1xuICAgIHZhciBleGl0X3NlcCA9IGBbUE0yXVske25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX1dIGFwcCBleGl0ZWRgXG4gICAgaWYgKGNvZGUpXG4gICAgICBleGl0X3NlcCArPSBgaXRzZWxmIHdpdGggZXhpdCBjb2RlOiAke2NvZGV9YFxuICAgIGlmIChzaWduYWwpXG4gICAgICBleGl0X3NlcCArPSBgYnkgYW4gZXh0ZXJuYWwgc2lnbmFsOiAke3NpZ25hbH1gXG4gICAgZXhpdF9zZXAgKz0gJ1xcbidcblxuICAgIGlmIChwbTJfZW52LnBtX291dF9sb2dfcGF0aClcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMocG0yX2Vudi5wbV9vdXRfbG9nX3BhdGgsIGV4aXRfc2VwKVxuICAgIGlmIChwbTJfZW52LnBtX2Vycl9sb2dfcGF0aClcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMocG0yX2Vudi5wbV9lcnJfbG9nX3BhdGgsIGV4aXRfc2VwKVxuICAgIGlmIChwbTJfZW52LnBtX2xvZ19wYXRoKVxuICAgICAgZnMud3JpdGVGaWxlU3luYyhwbTJfZW52LnBtX2xvZ19wYXRoLCBleGl0X3NlcClcbiAgfSBjYXRjaChlKSB7XG4gIH1cbn1cblxuLyoqXG4gKiBJbml0IG5ldyBwcm9jZXNzXG4gKi9cbkdvZC5wcmVwYXJlID0gZnVuY3Rpb24gcHJlcGFyZSAoZW52LCBjYikge1xuICAvLyBnZW5lcmF0ZSBhIG5ldyB1bmlxdWUgaWQgZm9yIGVhY2ggcHJvY2Vzc2VzXG4gIGVudi5lbnYudW5pcXVlX2lkID0gVXRpbGl0eS5nZW5lcmF0ZVVVSUQoKVxuXG4gIC8vIGlmIHRoZSBhcHAgaXMgc3RhbmRhbG9uZSwgbm8gbXVsdGlwbGUgaW5zdGFuY2VcbiAgaWYgKHR5cGVvZiBlbnYuaW5zdGFuY2VzID09PSAndW5kZWZpbmVkJykge1xuICAgIGVudi52aXppb25fcnVubmluZyA9IGZhbHNlO1xuICAgIGlmIChlbnYuZW52ICYmIGVudi5lbnYudml6aW9uX3J1bm5pbmcpIGVudi5lbnYudml6aW9uX3J1bm5pbmcgPSBmYWxzZTtcblxuICAgIGlmIChlbnYuc3RhdHVzID09IGNzdC5TVE9QUEVEX1NUQVRVUykge1xuICAgICAgZW52LnBtX2lkID0gR29kLmdldE5ld0lkKClcbiAgICAgIHZhciBjbHUgPSB7XG4gICAgICAgIHBtMl9lbnYgOiBlbnYsXG4gICAgICAgIHByb2Nlc3M6IHtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgR29kLmNsdXN0ZXJzX2RiW2Vudi5wbV9pZF0gPSBjbHVcbiAgICAgIHJldHVybiBjYihudWxsLCBbIEdvZC5jbHVzdGVyc19kYltlbnYucG1faWRdIF0pXG4gICAgfVxuXG4gICAgcmV0dXJuIEdvZC5leGVjdXRlQXBwKGVudiwgZnVuY3Rpb24gKGVyciwgY2x1KSB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgIEdvZC5ub3RpZnkoJ3N0YXJ0JywgY2x1LCB0cnVlKTtcbiAgICAgIHJldHVybiBjYihudWxsLCBbIFV0aWxpdHkuY2xvbmUoY2x1KSBdKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGZpbmQgaG93IG1hbnkgcmVwbGljYXRlIHRoZSB1c2VyIHdhbnRcbiAgZW52Lmluc3RhbmNlcyA9IHBhcnNlSW50KGVudi5pbnN0YW5jZXMpO1xuICBpZiAoZW52Lmluc3RhbmNlcyA9PT0gMCkge1xuICAgIGVudi5pbnN0YW5jZXMgPSBudW1DUFVzO1xuICB9IGVsc2UgaWYgKGVudi5pbnN0YW5jZXMgPCAwKSB7XG4gICAgZW52Lmluc3RhbmNlcyArPSBudW1DUFVzO1xuICB9XG4gIGlmIChlbnYuaW5zdGFuY2VzIDw9IDApIHtcbiAgICBlbnYuaW5zdGFuY2VzID0gMTtcbiAgfVxuXG4gIHRpbWVzTGltaXQoZW52Lmluc3RhbmNlcywgMSwgZnVuY3Rpb24gKG4sIG5leHQpIHtcbiAgICBlbnYudml6aW9uX3J1bm5pbmcgPSBmYWxzZTtcbiAgICBpZiAoZW52LmVudiAmJiBlbnYuZW52LnZpemlvbl9ydW5uaW5nKSB7XG4gICAgICBlbnYuZW52LnZpemlvbl9ydW5uaW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgR29kLmluamVjdFZhcmlhYmxlcyhlbnYsIGZ1bmN0aW9uIGluamVjdCAoZXJyLCBfZW52KSB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gbmV4dChlcnIpO1xuICAgICAgcmV0dXJuIEdvZC5leGVjdXRlQXBwKFV0aWxpdHkuY2xvbmUoX2VudiksIGZ1bmN0aW9uIChlcnIsIGNsdSkge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gbmV4dChlcnIpO1xuICAgICAgICBHb2Qubm90aWZ5KCdzdGFydCcsIGNsdSwgdHJ1ZSk7XG4gICAgICAgIC8vIGhlcmUgY2FsbCBuZXh0IHdpaHRvdXQgYW4gYXJyYXkgYmVjYXVzZVxuICAgICAgICAvLyBhc3luYy50aW1lcyBhZ2dyZWdhdGUgdGhlIHJlc3VsdCBpbnRvIGFuIGFycmF5XG4gICAgICAgIHJldHVybiBuZXh0KG51bGwsIFV0aWxpdHkuY2xvbmUoY2x1KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSwgY2IpO1xufTtcblxuLyoqXG4gKiBMYXVuY2ggdGhlIHNwZWNpZmllZCBzY3JpcHQgKHByZXNlbnQgaW4gZW52KVxuICogQGFwaSBwcml2YXRlXG4gKiBAbWV0aG9kIGV4ZWN1dGVBcHBcbiAqIEBwYXJhbSB7TWl4ZWR9IGVudlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2JcbiAqIEByZXR1cm4gTGl0ZXJhbFxuICovXG5Hb2QuZXhlY3V0ZUFwcCA9IGZ1bmN0aW9uIGV4ZWN1dGVBcHAoZW52LCBjYikge1xuICB2YXIgZW52X2NvcHkgPSBVdGlsaXR5LmNsb25lKGVudik7XG5cbiAgVXRpbGl0eS5leHRlbmQoZW52X2NvcHksIGVudl9jb3B5LmVudik7XG5cbiAgZW52X2NvcHlbJ3N0YXR1cyddICAgICAgICAgPSBjc3QuTEFVTkNISU5HX1NUQVRVUztcbiAgZW52X2NvcHlbJ3BtX3VwdGltZSddICAgICAgPSBEYXRlLm5vdygpO1xuICBlbnZfY29weVsnYXhtX2FjdGlvbnMnXSAgICA9IFtdO1xuICBlbnZfY29weVsnYXhtX21vbml0b3InXSAgICA9IHt9O1xuICBlbnZfY29weVsnYXhtX29wdGlvbnMnXSAgICA9IHt9O1xuICBlbnZfY29weVsnYXhtX2R5bmFtaWMnXSAgICA9IHt9O1xuICBlbnZfY29weVsndml6aW9uX3J1bm5pbmcnXSA9XG4gICAgZW52X2NvcHlbJ3Zpemlvbl9ydW5uaW5nJ10gIT09IHVuZGVmaW5lZCA/IGVudl9jb3B5Wyd2aXppb25fcnVubmluZyddIDogZmFsc2U7XG5cbiAgaWYgKCFlbnZfY29weS5jcmVhdGVkX2F0KVxuICAgIGVudl9jb3B5WydjcmVhdGVkX2F0J10gPSBEYXRlLm5vdygpO1xuXG4gIC8qKlxuICAgKiBFbnRlciBoZXJlIHdoZW4gaXQncyB0aGUgZmlyc3QgdGltZSB0aGF0IHRoZSBwcm9jZXNzIGlzIGNyZWF0ZWRcbiAgICogMSAtIEFzc2lnbiBhIG5ldyBpZFxuICAgKiAyIC0gUmVzZXQgcmVzdGFydCB0aW1lIGFuZCB1bnN0YWJsZV9yZXN0YXJ0c1xuICAgKiAzIC0gQXNzaWduIGEgbG9nIGZpbGUgbmFtZSBkZXBlbmRpbmcgb24gdGhlIGlkXG4gICAqIDQgLSBJZiB3YXRjaCBvcHRpb24gaXMgc2V0LCBsb29rIGZvciBjaGFuZ2VzXG4gICAqL1xuICBpZiAoZW52X2NvcHlbJ3BtX2lkJ10gPT09IHVuZGVmaW5lZCkge1xuICAgIGVudl9jb3B5WydwbV9pZCddICAgICAgICAgICAgID0gR29kLmdldE5ld0lkKCk7XG4gICAgZW52X2NvcHlbJ3Jlc3RhcnRfdGltZSddICAgICAgPSAwO1xuICAgIGVudl9jb3B5Wyd1bnN0YWJsZV9yZXN0YXJ0cyddID0gMDtcblxuICAgIC8vIGFkZCAtcG1faWQgdG8gcGlkIGZpbGVcbiAgICBlbnZfY29weS5wbV9waWRfcGF0aCA9IGVudl9jb3B5LnBtX3BpZF9wYXRoLnJlcGxhY2UoLy1bMC05XStcXC5waWQkfFxcLnBpZCQvZywgJy0nICsgZW52X2NvcHlbJ3BtX2lkJ10gKyAnLnBpZCcpO1xuXG4gICAgLy8gSWYgbWVyZ2Ugb3B0aW9uLCBkb250IHNlcGFyYXRlIHRoZSBsb2dzXG4gICAgaWYgKCFlbnZfY29weVsnbWVyZ2VfbG9ncyddKSB7XG4gICAgICBbJycsICdfb3V0JywgJ19lcnInXS5mb3JFYWNoKGZ1bmN0aW9uKGspe1xuICAgICAgICB2YXIga2V5ID0gJ3BtJyArIGsgKyAnX2xvZ19wYXRoJztcbiAgICAgICAgZW52X2NvcHlba2V5XSAmJiAoZW52X2NvcHlba2V5XSA9IGVudl9jb3B5W2tleV0ucmVwbGFjZSgvLVswLTldK1xcLmxvZyR8XFwubG9nJC9nLCAnLScgKyBlbnZfY29weVsncG1faWQnXSArICcubG9nJykpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSW5pdGlhdGUgd2F0Y2ggZmlsZVxuICAgIGlmIChlbnZfY29weVsnd2F0Y2gnXSkge1xuICAgICAgR29kLndhdGNoLmVuYWJsZShlbnZfY29weSk7XG4gICAgfVxuICB9XG5cbiAgR29kLnJlZ2lzdGVyQ3JvbihlbnZfY29weSlcblxuICAvKiogQ2FsbGJhY2sgd2hlbiBhcHBsaWNhdGlvbiBpcyBsYXVuY2hlZCAqL1xuICB2YXIgcmVhZHlDYiA9IGZ1bmN0aW9uIHJlYWR5KHByb2MpIHtcbiAgICAvLyBJZiB2aXppb24gZW5hYmxlZCBydW4gdmVyc2lvbmluZyByZXRyaWV2YWwgc3lzdGVtXG4gICAgaWYgKHByb2MucG0yX2Vudi52aXppb24gIT09IGZhbHNlICYmIHByb2MucG0yX2Vudi52aXppb24gIT09IFwiZmFsc2VcIilcbiAgICAgIEdvZC5maW5hbGl6ZVByb2NlZHVyZShwcm9jKTtcbiAgICBlbHNlXG4gICAgICBHb2Qubm90aWZ5KCdvbmxpbmUnLCBwcm9jKTtcblxuICAgIGlmIChwcm9jLnBtMl9lbnYuc3RhdHVzICE9PSBjc3QuRVJST1JFRF9TVEFUVVMpXG4gICAgICBwcm9jLnBtMl9lbnYuc3RhdHVzID0gY3N0Lk9OTElORV9TVEFUVVNcblxuICAgIGNvbnNvbGUubG9nKGBBcHAgWyR7cHJvYy5wbTJfZW52Lm5hbWV9OiR7cHJvYy5wbTJfZW52LnBtX2lkfV0gb25saW5lYCk7XG4gICAgaWYgKGNiKSBjYihudWxsLCBwcm9jKTtcbiAgfVxuXG4gIGlmIChlbnZfY29weS5leGVjX21vZGUgPT09ICdjbHVzdGVyX21vZGUnKSB7XG4gICAgLyoqXG4gICAgICogQ2x1c3RlciBtb2RlIGxvZ2ljIChmb3IgTm9kZUpTIGFwcHMpXG4gICAgICovXG4gICAgR29kLm5vZGVBcHAoZW52X2NvcHksIGZ1bmN0aW9uIG5vZGVBcHAoZXJyLCBjbHUpIHtcbiAgICAgIGlmIChjYiAmJiBlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgaWYgKGVycikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICB2YXIgb2xkX2VudiA9IEdvZC5jbHVzdGVyc19kYltjbHUucG0yX2Vudi5wbV9pZF07XG5cbiAgICAgIGlmIChvbGRfZW52KSB7XG4gICAgICAgIG9sZF9lbnYgPSBudWxsO1xuICAgICAgICBHb2QuY2x1c3RlcnNfZGJbY2x1LnBtMl9lbnYucG1faWRdID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgR29kLmNsdXN0ZXJzX2RiW2NsdS5wbTJfZW52LnBtX2lkXSA9IGNsdTtcblxuICAgICAgY2x1Lm9uY2UoJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrIHx8IGVycik7XG4gICAgICAgIGNsdS5wbTJfZW52LnN0YXR1cyA9IGNzdC5FUlJPUkVEX1NUQVRVUztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjbHUuZGVzdHJveSAmJiBjbHUuZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgICAgICAgIEdvZC5oYW5kbGVFeGl0KGNsdSwgY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgY2x1Lm9uY2UoJ2Rpc2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0FwcCBuYW1lOiVzIGlkOiVzIGRpc2Nvbm5lY3RlZCcsIGNsdS5wbTJfZW52Lm5hbWUsIGNsdS5wbTJfZW52LnBtX2lkKTtcbiAgICAgIH0pO1xuXG4gICAgICBjbHUub25jZSgnZXhpdCcsIGZ1bmN0aW9uIGNsdUV4aXQoY29kZSwgc2lnbmFsKSB7XG4gICAgICAgIC8vR29kLndyaXRlRXhpdFNlcGFyYXRvcihjbHUucG0yX2VudiwgY29kZSwgc2lnbmFsKVxuICAgICAgICBHb2QuaGFuZGxlRXhpdChjbHUsIGNvZGUgfHwgMCwgc2lnbmFsIHx8ICdTSUdJTlQnKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gY2x1Lm9uY2UoJ29ubGluZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFjbHUucG0yX2Vudi53YWl0X3JlYWR5KVxuICAgICAgICAgIHJldHVybiByZWFkeUNiKGNsdSk7XG5cbiAgICAgICAgLy8gVGltZW91dCBpZiB0aGUgcmVhZHkgbWVzc2FnZSBoYXMgbm90IGJlZW4gc2VudCBiZWZvcmUgbGlzdGVuX3RpbWVvdXRcbiAgICAgICAgdmFyIHJlYWR5X3RpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIEdvZC5idXMucmVtb3ZlTGlzdGVuZXIoJ3Byb2Nlc3M6bXNnJywgbGlzdGVuZXIpXG4gICAgICAgICAgcmV0dXJuIHJlYWR5Q2IoY2x1KVxuICAgICAgICB9LCBjbHUucG0yX2Vudi5saXN0ZW5fdGltZW91dCB8fCBjc3QuR1JBQ0VGVUxfTElTVEVOX1RJTUVPVVQpO1xuXG4gICAgICAgIHZhciBsaXN0ZW5lciA9IGZ1bmN0aW9uIChwYWNrZXQpIHtcbiAgICAgICAgICBpZiAocGFja2V0LnJhdyA9PT0gJ3JlYWR5JyAmJlxuICAgICAgICAgICAgICBwYWNrZXQucHJvY2Vzcy5uYW1lID09PSBjbHUucG0yX2Vudi5uYW1lICYmXG4gICAgICAgICAgICAgIHBhY2tldC5wcm9jZXNzLnBtX2lkID09PSBjbHUucG0yX2Vudi5wbV9pZCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHJlYWR5X3RpbWVvdXQpO1xuICAgICAgICAgICAgR29kLmJ1cy5yZW1vdmVMaXN0ZW5lcigncHJvY2Vzczptc2cnLCBsaXN0ZW5lcilcbiAgICAgICAgICAgIHJldHVybiByZWFkeUNiKGNsdSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBHb2QuYnVzLm9uKCdwcm9jZXNzOm1zZycsIGxpc3RlbmVyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8qKlxuICAgICAqIEZvcmsgbW9kZSBsb2dpY1xuICAgICAqL1xuICAgIEdvZC5mb3JrTW9kZShlbnZfY29weSwgZnVuY3Rpb24gZm9ya01vZGUoZXJyLCBjbHUpIHtcbiAgICAgIGlmIChjYiAmJiBlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgaWYgKGVycikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICB2YXIgb2xkX2VudiA9IEdvZC5jbHVzdGVyc19kYltjbHUucG0yX2Vudi5wbV9pZF07XG4gICAgICBpZiAob2xkX2Vudikgb2xkX2VudiA9IG51bGw7XG5cbiAgICAgIEdvZC5jbHVzdGVyc19kYltlbnZfY29weS5wbV9pZF0gPSBjbHU7XG5cbiAgICAgIGNsdS5vbmNlKCdlcnJvcicsIGZ1bmN0aW9uIGNsdUVycm9yKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayB8fCBlcnIpO1xuICAgICAgICBjbHUucG0yX2Vudi5zdGF0dXMgPSBjc3QuRVJST1JFRF9TVEFUVVM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY2x1LmtpbGwgJiYgY2x1LmtpbGwoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICAgICAgICBHb2QuaGFuZGxlRXhpdChjbHUsIGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGNsdS5vbmNlKCdleGl0JywgZnVuY3Rpb24gY2x1Q2xvc2UoY29kZSwgc2lnbmFsKSB7XG4gICAgICAgIC8vR29kLndyaXRlRXhpdFNlcGFyYXRvcihjbHUucG0yX2VudiwgY29kZSwgc2lnbmFsKVxuXG4gICAgICAgIGlmIChjbHUuY29ubmVjdGVkID09PSB0cnVlKVxuICAgICAgICAgIGNsdS5kaXNjb25uZWN0ICYmIGNsdS5kaXNjb25uZWN0KCk7XG4gICAgICAgIGNsdS5fcmVsb2FkTG9ncyA9IG51bGw7XG4gICAgICAgIHJldHVybiBHb2QuaGFuZGxlRXhpdChjbHUsIGNvZGUgfHwgMCwgc2lnbmFsKTtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoIWNsdS5wbTJfZW52LndhaXRfcmVhZHkpXG4gICAgICAgIHJldHVybiByZWFkeUNiKGNsdSk7XG5cbiAgICAgIC8vIFRpbWVvdXQgaWYgdGhlIHJlYWR5IG1lc3NhZ2UgaGFzIG5vdCBiZWVuIHNlbnQgYmVmb3JlIGxpc3Rlbl90aW1lb3V0XG4gICAgICB2YXIgcmVhZHlfdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIEdvZC5idXMucmVtb3ZlTGlzdGVuZXIoJ3Byb2Nlc3M6bXNnJywgbGlzdGVuZXIpXG4gICAgICAgIHJldHVybiByZWFkeUNiKGNsdSlcbiAgICAgIH0sIGNsdS5wbTJfZW52Lmxpc3Rlbl90aW1lb3V0IHx8IGNzdC5HUkFDRUZVTF9MSVNURU5fVElNRU9VVCk7XG5cbiAgICAgIHZhciBsaXN0ZW5lciA9IGZ1bmN0aW9uIChwYWNrZXQpIHtcbiAgICAgICAgaWYgKHBhY2tldC5yYXcgPT09ICdyZWFkeScgJiZcbiAgICAgICAgICAgIHBhY2tldC5wcm9jZXNzLm5hbWUgPT09IGNsdS5wbTJfZW52Lm5hbWUgJiZcbiAgICAgICAgICAgIHBhY2tldC5wcm9jZXNzLnBtX2lkID09PSBjbHUucG0yX2Vudi5wbV9pZCkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChyZWFkeV90aW1lb3V0KTtcbiAgICAgICAgICBHb2QuYnVzLnJlbW92ZUxpc3RlbmVyKCdwcm9jZXNzOm1zZycsIGxpc3RlbmVyKVxuICAgICAgICAgIHJldHVybiByZWFkeUNiKGNsdSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgR29kLmJ1cy5vbigncHJvY2Vzczptc2cnLCBsaXN0ZW5lcik7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgbG9naWMgd2hlbiBhIHByb2Nlc3MgZXhpdCAoTm9kZSBvciBGb3JrKVxuICogQG1ldGhvZCBoYW5kbGVFeGl0XG4gKiBAcGFyYW0ge30gY2x1XG4gKiBAcGFyYW0ge30gZXhpdF9jb2RlXG4gKiBAcmV0dXJuXG4gKi9cbkdvZC5oYW5kbGVFeGl0ID0gZnVuY3Rpb24gaGFuZGxlRXhpdChjbHUsIGV4aXRfY29kZSwga2lsbF9zaWduYWwpIHtcbiAgY29uc29sZS5sb2coYEFwcCBbJHtjbHUucG0yX2Vudi5uYW1lfToke2NsdS5wbTJfZW52LnBtX2lkfV0gZXhpdGVkIHdpdGggY29kZSBbJHtleGl0X2NvZGV9XSB2aWEgc2lnbmFsIFske2tpbGxfc2lnbmFsIHx8ICdTSUdJTlQnfV1gKVxuXG4gIHZhciBwcm9jID0gdGhpcy5jbHVzdGVyc19kYltjbHUucG0yX2Vudi5wbV9pZF07XG5cbiAgaWYgKCFwcm9jKSB7XG4gICAgY29uc29sZS5lcnJvcignUHJvY2VzcyB1bmRlZmluZWQgPyB3aXRoIHByb2Nlc3MgaWQgJywgY2x1LnBtMl9lbnYucG1faWQpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHZhciBzdG9wcGluZyA9IChwcm9jLnBtMl9lbnYuc3RhdHVzID09IGNzdC5TVE9QUElOR19TVEFUVVNcbiAgICAgICAgICAgICAgICAgIHx8IHByb2MucG0yX2Vudi5zdGF0dXMgPT0gY3N0LlNUT1BQRURfU1RBVFVTXG4gICAgICAgICAgICAgICAgICB8fCBwcm9jLnBtMl9lbnYuc3RhdHVzID09IGNzdC5FUlJPUkVEX1NUQVRVUylcbiAgICAgIHx8IChwcm9jLnBtMl9lbnYuYXV0b3Jlc3RhcnQgPT09IGZhbHNlIHx8IHByb2MucG0yX2Vudi5hdXRvcmVzdGFydCA9PT0gXCJmYWxzZVwiKTtcblxuICB2YXIgb3ZlcmxpbWl0ICAgPSBmYWxzZTtcblxuICBpZiAoc3RvcHBpbmcpIHByb2MucHJvY2Vzcy5waWQgPSAwO1xuXG4gIC8vIFJlc2V0IHByb2JlcyBhbmQgYWN0aW9uc1xuICBpZiAocHJvYy5wbTJfZW52LmF4bV9hY3Rpb25zKSBwcm9jLnBtMl9lbnYuYXhtX2FjdGlvbnMgPSBbXTtcbiAgaWYgKHByb2MucG0yX2Vudi5heG1fbW9uaXRvcikgcHJvYy5wbTJfZW52LmF4bV9tb25pdG9yID0ge307XG5cbiAgaWYgKHByb2MucG0yX2Vudi5zdGF0dXMgIT0gY3N0LkVSUk9SRURfU1RBVFVTICYmXG4gICAgICBwcm9jLnBtMl9lbnYuc3RhdHVzICE9IGNzdC5TVE9QUElOR19TVEFUVVMpXG4gICAgcHJvYy5wbTJfZW52LnN0YXR1cyA9IGNzdC5TVE9QUEVEX1NUQVRVUztcblxuICBpZiAocHJvYy5wbTJfZW52LnBtX2lkLnRvU3RyaW5nKCkuaW5kZXhPZignX29sZF8nKSAhPT0gMCkge1xuICAgIHRyeSB7XG4gICAgICBmcy51bmxpbmtTeW5jKHByb2MucG0yX2Vudi5wbV9waWRfcGF0aCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZGVidWcoJ0Vycm9yIHdoZW4gdW5saW5raW5nIHBpZCBmaWxlJywgZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEF2b2lkIGluZmluaXRlIHJlbG9vcCBpZiBhbiBlcnJvciBpcyBwcmVzZW50XG4gICAqL1xuICAvLyBJZiB0aGUgcHJvY2VzcyBoYXMgYmVlbiBjcmVhdGVkIGxlc3MgdGhhbiAxNXNlY29uZHMgYWdvXG5cbiAgLy8gQW5kIGlmIHRoZSBwcm9jZXNzIGhhcyBhbiB1cHRpbWUgbGVzcyB0aGFuIGEgc2Vjb25kXG4gIHZhciBtaW5fdXB0aW1lID0gdHlwZW9mKHByb2MucG0yX2Vudi5taW5fdXB0aW1lKSAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jLnBtMl9lbnYubWluX3VwdGltZSA6IDEwMDA7XG4gIHZhciBtYXhfcmVzdGFydHMgPSB0eXBlb2YocHJvYy5wbTJfZW52Lm1heF9yZXN0YXJ0cykgIT09ICd1bmRlZmluZWQnID8gcHJvYy5wbTJfZW52Lm1heF9yZXN0YXJ0cyA6IDE2O1xuXG4gIGlmICgoRGF0ZS5ub3coKSAtIHByb2MucG0yX2Vudi5jcmVhdGVkX2F0KSA8IChtaW5fdXB0aW1lICogbWF4X3Jlc3RhcnRzKSkge1xuICAgIGlmICgoRGF0ZS5ub3coKSAtIHByb2MucG0yX2Vudi5wbV91cHRpbWUpIDwgbWluX3VwdGltZSkge1xuICAgICAgLy8gSW5jcmVtZW50IHVuc3RhYmxlIHJlc3RhcnRcbiAgICAgIHByb2MucG0yX2Vudi51bnN0YWJsZV9yZXN0YXJ0cyArPSAxO1xuICAgIH1cbiAgfVxuXG5cbiAgaWYgKHByb2MucG0yX2Vudi51bnN0YWJsZV9yZXN0YXJ0cyA+PSBtYXhfcmVzdGFydHMpIHtcbiAgICAvLyBUb28gbWFueSB1bnN0YWJsZSByZXN0YXJ0IGluIGxlc3MgdGhhbiAxNSBzZWNvbmRzXG4gICAgLy8gU2V0IHRoZSBwcm9jZXNzIGFzICdFUlJPUkVEJ1xuICAgIC8vIEFuZCBzdG9wIHJlc3RhcnRpbmcgaXRcbiAgICBwcm9jLnBtMl9lbnYuc3RhdHVzID0gY3N0LkVSUk9SRURfU1RBVFVTO1xuICAgIHByb2MucHJvY2Vzcy5waWQgPSAwO1xuXG4gICAgY29uc29sZS5sb2coJ1NjcmlwdCAlcyBoYWQgdG9vIG1hbnkgdW5zdGFibGUgcmVzdGFydHMgKCVkKS4gU3RvcHBlZC4gJWonLFxuICAgICAgcHJvYy5wbTJfZW52LnBtX2V4ZWNfcGF0aCxcbiAgICAgIHByb2MucG0yX2Vudi51bnN0YWJsZV9yZXN0YXJ0cyxcbiAgICAgIHByb2MucG0yX2Vudi5zdGF0dXMpO1xuXG4gICAgR29kLm5vdGlmeSgncmVzdGFydCBvdmVybGltaXQnLCBwcm9jKTtcblxuICAgIHByb2MucG0yX2Vudi51bnN0YWJsZV9yZXN0YXJ0cyA9IDA7XG4gICAgcHJvYy5wbTJfZW52LmNyZWF0ZWRfYXQgPSBudWxsO1xuICAgIG92ZXJsaW1pdCA9IHRydWU7XG4gIH1cblxuICBpZiAodHlwZW9mKGV4aXRfY29kZSkgIT09ICd1bmRlZmluZWQnKSBwcm9jLnBtMl9lbnYuZXhpdF9jb2RlID0gZXhpdF9jb2RlO1xuXG4gIEdvZC5ub3RpZnkoJ2V4aXQnLCBwcm9jKTtcblxuICBpZiAoR29kLnBtMl9iZWluZ19raWxsZWQpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdbSGFuZGxlRXhpdF0gUE0yIGlzIGJlaW5nIGtpbGxlZCwgc3RvcHBpbmcgcmVzdGFydCBwcm9jZWR1cmUuLi4nKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB2YXIgcmVzdGFydF9kZWxheSA9IDA7XG5cbiAgaWYgKHByb2MucG0yX2Vudi5yZXN0YXJ0X2RlbGF5ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICFpc05hTihwYXJzZUludChwcm9jLnBtMl9lbnYucmVzdGFydF9kZWxheSkpKSB7XG4gICAgcHJvYy5wbTJfZW52LnN0YXR1cyA9IGNzdC5XQUlUSU5HX1JFU1RBUlQ7XG4gICAgcmVzdGFydF9kZWxheSA9IHBhcnNlSW50KHByb2MucG0yX2Vudi5yZXN0YXJ0X2RlbGF5KTtcbiAgfVxuXG4gIGlmIChwcm9jLnBtMl9lbnYuZXhwX2JhY2tvZmZfcmVzdGFydF9kZWxheSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAhaXNOYU4ocGFyc2VJbnQocHJvYy5wbTJfZW52LmV4cF9iYWNrb2ZmX3Jlc3RhcnRfZGVsYXkpKSkge1xuICAgIHByb2MucG0yX2Vudi5zdGF0dXMgPSBjc3QuV0FJVElOR19SRVNUQVJUO1xuICAgIGlmICghcHJvYy5wbTJfZW52LnByZXZfcmVzdGFydF9kZWxheSkge1xuICAgICAgcHJvYy5wbTJfZW52LnByZXZfcmVzdGFydF9kZWxheSA9IHByb2MucG0yX2Vudi5leHBfYmFja29mZl9yZXN0YXJ0X2RlbGF5XG4gICAgICByZXN0YXJ0X2RlbGF5ID0gcHJvYy5wbTJfZW52LmV4cF9iYWNrb2ZmX3Jlc3RhcnRfZGVsYXlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBwcm9jLnBtMl9lbnYucHJldl9yZXN0YXJ0X2RlbGF5ID0gTWF0aC5mbG9vcihNYXRoLm1pbigxNTAwMCwgcHJvYy5wbTJfZW52LnByZXZfcmVzdGFydF9kZWxheSAqIDEuNSkpXG4gICAgICByZXN0YXJ0X2RlbGF5ID0gcHJvYy5wbTJfZW52LnByZXZfcmVzdGFydF9kZWxheVxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhgQXBwIFske2NsdS5wbTJfZW52Lm5hbWV9OiR7Y2x1LnBtMl9lbnYucG1faWR9XSB3aWxsIHJlc3RhcnQgaW4gJHtyZXN0YXJ0X2RlbGF5fW1zYClcbiAgfVxuXG4gIGlmICghc3RvcHBpbmcgJiYgIW92ZXJsaW1pdCkge1xuICAgIC8vbWFrZSB0aGlzIHByb3BlcnR5IHVuZW51bWVyYWJsZVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm9jLnBtMl9lbnYsICdyZXN0YXJ0X3Rhc2snLCB7Y29uZmlndXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZX0pO1xuICAgIHByb2MucG0yX2Vudi5yZXN0YXJ0X3Rhc2sgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgcHJvYy5wbTJfZW52LnJlc3RhcnRfdGltZSArPSAxO1xuICAgICAgR29kLmV4ZWN1dGVBcHAocHJvYy5wbTJfZW52KTtcbiAgICB9LCByZXN0YXJ0X2RlbGF5KTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogQG1ldGhvZCBmaW5hbGl6ZVByb2NlZHVyZVxuICogQHBhcmFtIHByb2Mge09iamVjdH1cbiAqIEByZXR1cm5cbiAqL1xuR29kLmZpbmFsaXplUHJvY2VkdXJlID0gZnVuY3Rpb24gZmluYWxpemVQcm9jZWR1cmUocHJvYykge1xuICB2YXIgbGFzdF9wYXRoICAgID0gJyc7XG4gIHZhciBjdXJyZW50X3BhdGggPSBwcm9jLnBtMl9lbnYuY3dkIHx8IHBhdGguZGlybmFtZShwcm9jLnBtMl9lbnYucG1fZXhlY19wYXRoKTtcbiAgdmFyIHByb2NfaWQgICAgICA9IHByb2MucG0yX2Vudi5wbV9pZDtcblxuICBwcm9jLnBtMl9lbnYudmVyc2lvbiA9IFV0aWxpdHkuZmluZFBhY2thZ2VWZXJzaW9uKHByb2MucG0yX2Vudi5wbV9leGVjX3BhdGggfHwgcHJvYy5wbTJfZW52LmN3ZCk7XG5cbiAgaWYgKHByb2MucG0yX2Vudi52aXppb25fcnVubmluZyA9PT0gdHJ1ZSkge1xuICAgIGRlYnVnKCdWaXppb24gaXMgYWxyZWFkeSBydW5uaW5nIGZvciBwcm9jIGlkOiAlZCwgc2tpcHBpbmcgdGhpcyByb3VuZCcsIHByb2NfaWQpO1xuICAgIHJldHVybiBHb2Qubm90aWZ5KCdvbmxpbmUnLCBwcm9jKTtcbiAgfVxuICBwcm9jLnBtMl9lbnYudml6aW9uX3J1bm5pbmcgPSB0cnVlO1xuXG4gIHZpemlvbi5hbmFseXplKHtmb2xkZXIgOiBjdXJyZW50X3BhdGh9LCBmdW5jdGlvbiByZWN1cl9wYXRoKGVyciwgbWV0YSl7XG4gICAgdmFyIHByb2MgPSBHb2QuY2x1c3RlcnNfZGJbcHJvY19pZF07XG5cbiAgICBpZiAoZXJyKVxuICAgICAgZGVidWcoZXJyLnN0YWNrIHx8IGVycik7XG5cbiAgICBpZiAoIXByb2MgfHxcbiAgICAgICAgIXByb2MucG0yX2VudiB8fFxuICAgICAgICBwcm9jLnBtMl9lbnYuc3RhdHVzID09IGNzdC5TVE9QUEVEX1NUQVRVUyB8fFxuICAgICAgICBwcm9jLnBtMl9lbnYuc3RhdHVzID09IGNzdC5TVE9QUElOR19TVEFUVVMgfHxcbiAgICAgICAgcHJvYy5wbTJfZW52LnN0YXR1cyA9PSBjc3QuRVJST1JFRF9TVEFUVVMpIHtcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdDYW5jZWxsaW5nIHZlcnNpb25pbmcgZGF0YSBwYXJzaW5nJyk7XG4gICAgfVxuXG4gICAgcHJvYy5wbTJfZW52LnZpemlvbl9ydW5uaW5nID0gZmFsc2U7XG5cbiAgICBpZiAoIWVycikge1xuICAgICAgcHJvYy5wbTJfZW52LnZlcnNpb25pbmcgPSBtZXRhO1xuICAgICAgcHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRoID0gY3VycmVudF9wYXRoO1xuICAgICAgR29kLm5vdGlmeSgnb25saW5lJywgcHJvYyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGVyciAmJiBjdXJyZW50X3BhdGggPT09IGxhc3RfcGF0aCkge1xuICAgICAgcHJvYy5wbTJfZW52LnZlcnNpb25pbmcgPSBudWxsO1xuICAgICAgR29kLm5vdGlmeSgnb25saW5lJywgcHJvYyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbGFzdF9wYXRoID0gY3VycmVudF9wYXRoO1xuICAgICAgY3VycmVudF9wYXRoID0gcGF0aC5kaXJuYW1lKGN1cnJlbnRfcGF0aCk7XG4gICAgICBwcm9jLnBtMl9lbnYudml6aW9uX3J1bm5pbmcgPSB0cnVlO1xuICAgICAgdml6aW9uLmFuYWx5emUoe2ZvbGRlciA6IGN1cnJlbnRfcGF0aH0sIHJlY3VyX3BhdGgpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBJbmplY3QgdmFyaWFibGVzIGludG8gcHJvY2Vzc2VzXG4gKiBAcGFyYW0ge09iamVjdH0gZW52IGVudmlyb25uZW1lbnQgdG8gYmUgcGFzc2VkIHRvIHRoZSBwcm9jZXNzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBpbnZva2VkIHdpdGggPGVyciwgZW52PlxuICovXG5Hb2QuaW5qZWN0VmFyaWFibGVzID0gZnVuY3Rpb24gaW5qZWN0VmFyaWFibGVzIChlbnYsIGNiKSB7XG4gIC8vIGFsbG93IHRvIG92ZXJyaWRlIHRoZSBrZXkgb2YgTk9ERV9BUFBfSU5TVEFOQ0UgaWYgd2FudGVkXG4gIHZhciBpbnN0YW5jZUtleSA9IHByb2Nlc3MuZW52LlBNMl9QUk9DRVNTX0lOU1RBTkNFX1ZBUiB8fCBlbnYuaW5zdGFuY2VfdmFyO1xuXG4gIC8vIHdlIG5lZWQgdG8gZmluZCB0aGUgbGFzdCBOT0RFX0FQUF9JTlNUQU5DRSB1c2VkXG4gIHZhciBpbnN0YW5jZXMgPSBPYmplY3Qua2V5cyhHb2QuY2x1c3RlcnNfZGIpXG4gICAgLm1hcChmdW5jdGlvbiAocHJvY0lkKSB7XG4gICAgICByZXR1cm4gR29kLmNsdXN0ZXJzX2RiW3Byb2NJZF07XG4gICAgfSkuZmlsdGVyKGZ1bmN0aW9uIChwcm9jKSB7XG4gICAgICByZXR1cm4gcHJvYy5wbTJfZW52Lm5hbWUgPT09IGVudi5uYW1lICYmXG4gICAgICAgIHR5cGVvZiBwcm9jLnBtMl9lbnZbaW5zdGFuY2VLZXldICE9PSAndW5kZWZpbmVkJztcbiAgICB9KS5tYXAoZnVuY3Rpb24gKHByb2MpIHtcbiAgICAgIHJldHVybiBwcm9jLnBtMl9lbnZbaW5zdGFuY2VLZXldO1xuICAgIH0pLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgIHJldHVybiBiIC0gYTtcbiAgICB9KTtcbiAgLy8gZGVmYXVsdCB0byBsYXN0IG9uZSArIDFcbiAgdmFyIGluc3RhbmNlTnVtYmVyID0gdHlwZW9mIGluc3RhbmNlc1swXSA9PT0gJ3VuZGVmaW5lZCcgPyAwIDogaW5zdGFuY2VzWzBdICsgMTtcbiAgLy8gYnV0IHRyeSB0byBmaW5kIGEgb25lIGF2YWlsYWJsZVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpbnN0YW5jZXMuaW5kZXhPZihpKSA9PT0gLTEpIHtcbiAgICAgIGluc3RhbmNlTnVtYmVyID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBlbnZbaW5zdGFuY2VLZXldID0gaW5zdGFuY2VOdW1iZXI7XG5cbiAgLy8gaWYgdXNpbmcgaW5jcmVtZW50X3Zhciwgd2UgbmVlZCB0byBpbmNyZW1lbnQgaXRcbiAgaWYgKGVudi5pbmNyZW1lbnRfdmFyKSB7XG4gICAgdmFyIGxhc3RJbmNyZW1lbnQgPSBPYmplY3Qua2V5cyhHb2QuY2x1c3RlcnNfZGIpXG4gICAgICAubWFwKGZ1bmN0aW9uIChwcm9jSWQpIHtcbiAgICAgICAgcmV0dXJuIEdvZC5jbHVzdGVyc19kYltwcm9jSWRdO1xuICAgICAgfSkuZmlsdGVyKGZ1bmN0aW9uIChwcm9jKSB7XG4gICAgICAgIHJldHVybiBwcm9jLnBtMl9lbnYubmFtZSA9PT0gZW52Lm5hbWUgJiZcbiAgICAgICAgICB0eXBlb2YgcHJvYy5wbTJfZW52W2Vudi5pbmNyZW1lbnRfdmFyXSAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICB9KS5tYXAoZnVuY3Rpb24gKHByb2MpIHtcbiAgICAgICAgcmV0dXJuIHByb2MucG0yX2VudltlbnYuaW5jcmVtZW50X3Zhcl07XG4gICAgICB9KS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBiIC0gYTtcbiAgICAgIH0pWzBdO1xuICAgIC8vIGluamVjdCBhIGluY3JlbWVudGFsIHZhcmlhYmxlXG4gICAgdmFyIGRlZmF1dCA9IGVudi5lbnZbZW52LmluY3JlbWVudF92YXJdIHx8IDA7XG4gICAgZW52W2Vudi5pbmNyZW1lbnRfdmFyXSA9IHR5cGVvZiBsYXN0SW5jcmVtZW50ID09PSAndW5kZWZpbmVkJyA/IGRlZmF1dCA6IGxhc3RJbmNyZW1lbnQgKyAxO1xuICAgIGVudi5lbnZbZW52LmluY3JlbWVudF92YXJdID0gZW52W2Vudi5pbmNyZW1lbnRfdmFyXTtcbiAgfVxuXG4gIHJldHVybiBjYihudWxsLCBlbnYpO1xufTtcblxuR29kLmxhdW5jaFN5c01vbml0b3JpbmcgPSBmdW5jdGlvbihlbnYsIGNiKSB7XG4gIGlmIChHb2Quc3lzdGVtX2luZm9zX3Byb2MgIT09IG51bGwpXG4gICAgcmV0dXJuIGNiKG5ldyBFcnJvcignU3lzIE1vbml0b3JpbmcgYWxyZWFkeSBsYXVuY2hlZCcpKVxuXG4gIHRyeSB7XG4gICAgR29kLnN5c3RlbV9pbmZvc19wcm9jID0gbmV3IHN5c2luZm8oKVxuXG4gICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgR29kLnN5c3RlbV9pbmZvc19wcm9jLnF1ZXJ5KChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuXG4gICAgICAgIEdvZC5zeXN0ZW1faW5mb3MgPSBkYXRhXG4gICAgICB9KVxuICAgIH0sIDEwMDApXG5cbiAgICBHb2Quc3lzdGVtX2luZm9zX3Byb2MuZm9yaygpXG4gIH0gY2F0Y2goZSkge1xuICAgIGNvbnNvbGUubG9nKGUpXG4gICAgR29kLnN5c3RlbV9pbmZvc19wcm9jID0gbnVsbFxuICB9XG4gIHJldHVybiBjYigpXG59XG5cbkdvZC5pbml0KClcblxuZXhwb3J0IGRlZmF1bHQgR29kO1xuIl19