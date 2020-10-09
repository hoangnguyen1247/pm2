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

var _constants = _interopRequireDefault(require("../constants.js"));

var _timesLimit = _interopRequireDefault(require("async/timesLimit"));

var _Configuration = _interopRequireDefault(require("./Configuration"));

var _semver = _interopRequireDefault(require("semver"));

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


require("./Event.js")(God);

require("./God/Methods.js")(God);

require("./God/ForkMode.js")(God);

require("./God/ClusterMode.js")(God);

require("./God/Reload")(God);

require("./God/ActionMethods")(God);

require("./Watcher")(God);

God.init = function () {
  require("./Worker.js")(this);

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
    var sysinfo = require("./Sysinfo/SystemInfo.js");

    God.system_infos_proc = new sysinfo();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Hb2QudHMiXSwibmFtZXMiOlsibnVtQ1BVcyIsIm9zIiwiY3B1cyIsImxlbmd0aCIsImRlYnVnIiwic2VtdmVyIiwibHQiLCJwcm9jZXNzIiwidmVyc2lvbiIsImNsdXN0ZXIiLCJzZXR1cE1hc3RlciIsImV4ZWMiLCJwYXRoIiwicmVzb2x2ZSIsImRpcm5hbWUiLCJtb2R1bGUiLCJmaWxlbmFtZSIsIkdvZCIsIm5leHRfaWQiLCJjbHVzdGVyc19kYiIsImNvbmZpZ3VyYXRpb24iLCJzdGFydGVkX2F0IiwiRGF0ZSIsIm5vdyIsInN5c3RlbV9pbmZvc19wcm9jIiwic3lzdGVtX2luZm9zIiwiYnVzIiwiRXZlbnRFbWl0dGVyMiIsIndpbGRjYXJkIiwiZGVsaW1pdGVyIiwibWF4TGlzdGVuZXJzIiwiVXRpbGl0eSIsIm92ZXJyaWRlQ29uc29sZSIsInJlcXVpcmUiLCJpbml0IiwiQ29uZmlndXJhdGlvbiIsImdldFN5bmMiLCJzeXNtb25pdCIsImxhdW5jaFN5c01vbml0b3JpbmciLCJjb25zb2xlIiwibG9nIiwic2V0VGltZW91dCIsIldvcmtlciIsInN0YXJ0Iiwid3JpdGVFeGl0U2VwYXJhdG9yIiwicG0yX2VudiIsImNvZGUiLCJzaWduYWwiLCJleGl0X3NlcCIsInRvSVNPU3RyaW5nIiwicG1fb3V0X2xvZ19wYXRoIiwiZnMiLCJ3cml0ZUZpbGVTeW5jIiwicG1fZXJyX2xvZ19wYXRoIiwicG1fbG9nX3BhdGgiLCJlIiwicHJlcGFyZSIsImVudiIsImNiIiwidW5pcXVlX2lkIiwiZ2VuZXJhdGVVVUlEIiwiaW5zdGFuY2VzIiwidml6aW9uX3J1bm5pbmciLCJzdGF0dXMiLCJjc3QiLCJTVE9QUEVEX1NUQVRVUyIsInBtX2lkIiwiZ2V0TmV3SWQiLCJjbHUiLCJleGVjdXRlQXBwIiwiZXJyIiwibm90aWZ5IiwiY2xvbmUiLCJwYXJzZUludCIsIm4iLCJuZXh0IiwiaW5qZWN0VmFyaWFibGVzIiwiaW5qZWN0IiwiX2VudiIsImVudl9jb3B5IiwiZXh0ZW5kIiwiTEFVTkNISU5HX1NUQVRVUyIsInVuZGVmaW5lZCIsImNyZWF0ZWRfYXQiLCJwbV9waWRfcGF0aCIsInJlcGxhY2UiLCJmb3JFYWNoIiwiayIsImtleSIsIndhdGNoIiwiZW5hYmxlIiwicmVnaXN0ZXJDcm9uIiwicmVhZHlDYiIsInJlYWR5IiwicHJvYyIsInZpemlvbiIsImZpbmFsaXplUHJvY2VkdXJlIiwiRVJST1JFRF9TVEFUVVMiLCJPTkxJTkVfU1RBVFVTIiwibmFtZSIsImV4ZWNfbW9kZSIsIm5vZGVBcHAiLCJvbGRfZW52Iiwib25jZSIsImVycm9yIiwic3RhY2siLCJkZXN0cm95IiwiaGFuZGxlRXhpdCIsIkVSUk9SX0VYSVQiLCJjbHVFeGl0Iiwid2FpdF9yZWFkeSIsInJlYWR5X3RpbWVvdXQiLCJyZW1vdmVMaXN0ZW5lciIsImxpc3RlbmVyIiwibGlzdGVuX3RpbWVvdXQiLCJHUkFDRUZVTF9MSVNURU5fVElNRU9VVCIsInBhY2tldCIsInJhdyIsImNsZWFyVGltZW91dCIsIm9uIiwiZm9ya01vZGUiLCJjbHVFcnJvciIsImtpbGwiLCJjbHVDbG9zZSIsImNvbm5lY3RlZCIsImRpc2Nvbm5lY3QiLCJfcmVsb2FkTG9ncyIsImV4aXRfY29kZSIsImtpbGxfc2lnbmFsIiwic3RvcHBpbmciLCJTVE9QUElOR19TVEFUVVMiLCJhdXRvcmVzdGFydCIsIm92ZXJsaW1pdCIsInBpZCIsImF4bV9hY3Rpb25zIiwiYXhtX21vbml0b3IiLCJ0b1N0cmluZyIsImluZGV4T2YiLCJ1bmxpbmtTeW5jIiwibWluX3VwdGltZSIsIm1heF9yZXN0YXJ0cyIsInBtX3VwdGltZSIsInVuc3RhYmxlX3Jlc3RhcnRzIiwicG1fZXhlY19wYXRoIiwicG0yX2JlaW5nX2tpbGxlZCIsInJlc3RhcnRfZGVsYXkiLCJpc05hTiIsIldBSVRJTkdfUkVTVEFSVCIsImV4cF9iYWNrb2ZmX3Jlc3RhcnRfZGVsYXkiLCJwcmV2X3Jlc3RhcnRfZGVsYXkiLCJNYXRoIiwiZmxvb3IiLCJtaW4iLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImNvbmZpZ3VyYWJsZSIsIndyaXRhYmxlIiwicmVzdGFydF90YXNrIiwicmVzdGFydF90aW1lIiwibGFzdF9wYXRoIiwiY3VycmVudF9wYXRoIiwiY3dkIiwicHJvY19pZCIsImZpbmRQYWNrYWdlVmVyc2lvbiIsImFuYWx5emUiLCJmb2xkZXIiLCJyZWN1cl9wYXRoIiwibWV0YSIsInZlcnNpb25pbmciLCJyZXBvX3BhdGgiLCJpbnN0YW5jZUtleSIsIlBNMl9QUk9DRVNTX0lOU1RBTkNFX1ZBUiIsImluc3RhbmNlX3ZhciIsImtleXMiLCJtYXAiLCJwcm9jSWQiLCJmaWx0ZXIiLCJzb3J0IiwiYSIsImIiLCJpbnN0YW5jZU51bWJlciIsImkiLCJpbmNyZW1lbnRfdmFyIiwibGFzdEluY3JlbWVudCIsImRlZmF1dCIsIkVycm9yIiwic3lzaW5mbyIsInNldEludGVydmFsIiwicXVlcnkiLCJkYXRhIiwiZm9yayJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQTNCQTs7Ozs7O0FBTUE7Ozs7Ozs7OztBQXVCQSxJQUFNQSxPQUFPLEdBQUdDLGVBQUdDLElBQUgsS0FBWUQsZUFBR0MsSUFBSCxHQUFVQyxNQUF0QixHQUErQixDQUEvQztBQUNBLElBQU1DLEtBQUssR0FBRyx1QkFBWSxTQUFaLENBQWQ7QUFFQTs7OztBQUdBLElBQUlDLG1CQUFPQyxFQUFQLENBQVVDLE9BQU8sQ0FBQ0MsT0FBbEIsRUFBMkIsUUFBM0IsQ0FBSixFQUEwQztBQUN4Q0Msc0JBQVFDLFdBQVIsQ0FBb0I7QUFDbEI7QUFDQTtBQUNBQyxJQUFBQSxJQUFJLEVBQUdDLGlCQUFLQyxPQUFMLENBQWFELGlCQUFLRSxPQUFMLENBQWFDLE1BQU0sQ0FBQ0MsUUFBcEIsQ0FBYixFQUE0QywyQkFBNUM7QUFIVyxHQUFwQjtBQUtELENBTkQsTUFPSztBQUNIUCxzQkFBUUMs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LEVBQUUsRUFBVDtBQUNELENBckJEOztBQXVCQXpDLEdBQUcsQ0FBQ2lCLElBQUo7ZUFFZWpCLEciLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgbGljZW5zZSB0aGF0XHJcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxyXG4gKi9cclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogICAgX19fX19fIF9fX19fX18gX19fX19fXHJcbiAqICAgfCAgIF9fIFxcICAgfCAgIHxfXyAgICB8XHJcbiAqICAgfCAgICBfXy8gICAgICAgfCAgICBfX3xcclxuICogICB8X19ffCAgfF9ffF98X198X19fX19ffFxyXG4gKlxyXG4gKiAgICBNYWluIERhZW1vbiBzaWRlIGZpbGVcclxuICpcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbmltcG9ydCBjbHVzdGVyICAgICAgIGZyb20gJ2NsdXN0ZXInO1xyXG5pbXBvcnQgb3MgICAgICAgZnJvbSAnb3MnO1xyXG5pbXBvcnQgcGF0aCAgICAgICAgICBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgRXZlbnRFbWl0dGVyMiB9IGZyb20gJ2V2ZW50ZW1pdHRlcjInO1xyXG5pbXBvcnQgZnMgICAgICAgICAgICBmcm9tICdmcyc7XHJcbmltcG9ydCB2aXppb24gICAgICAgIGZyb20gJ3Zpemlvbic7XHJcbmltcG9ydCBkZWJ1Z0xvZ2dlciAgICAgICAgIGZyb20gJ2RlYnVnJztcclxuaW1wb3J0IFV0aWxpdHkgICAgICAgZnJvbSAnLi9VdGlsaXR5JztcclxuaW1wb3J0IGNzdCAgICAgICAgICAgZnJvbSAnLi4vY29uc3RhbnRzLmpzJztcclxuaW1wb3J0IHRpbWVzTGltaXQgICAgZnJvbSAnYXN5bmMvdGltZXNMaW1pdCc7XHJcbmltcG9ydCBDb25maWd1cmF0aW9uIGZyb20gJy4vQ29uZmlndXJhdGlvbic7XHJcbmltcG9ydCBzZW12ZXIgICAgICAgIGZyb20gJ3NlbXZlcic7XHJcblxyXG5jb25zdCBudW1DUFVzID0gb3MuY3B1cygpID8gb3MuY3B1cygpLmxlbmd0aCA6IDE7XHJcbmNvbnN0IGRlYnVnID0gZGVidWdMb2dnZXIoJ3BtMjpnb2QnKTtcclxuXHJcbi8qKlxyXG4gKiBPdmVycmlkZSBjbHVzdGVyIG1vZHVsZSBjb25maWd1cmF0aW9uXHJcbiAqL1xyXG5pZiAoc2VtdmVyLmx0KHByb2Nlc3MudmVyc2lvbiwgJzEwLjAuMCcpKSB7XHJcbiAgY2x1c3Rlci5zZXR1cE1hc3Rlcih7XHJcbiAgICAvLyBUT0RPOiBwbGVhc2UgY2hlY2sgdGhpc1xyXG4gICAgLy8gd2luZG93c0hpZGU6IHRydWUsXHJcbiAgICBleGVjIDogcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShtb2R1bGUuZmlsZW5hbWUpLCAnUHJvY2Vzc0NvbnRhaW5lckxlZ2FjeS5qcycpXHJcbiAgfSk7XHJcbn1cclxuZWxzZSB7XHJcbiAgY2x1c3Rlci5zZXR1cE1hc3Rlcih7XHJcbiAgICAvLyBUT0RPOiBwbGVhc2UgY2hlY2sgdGhpc1xyXG4gICAgLy8gd2luZG93c0hpZGU6IHRydWUsXHJcbiAgICBleGVjIDogcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShtb2R1bGUuZmlsZW5hbWUpLCAnUHJvY2Vzc0NvbnRhaW5lci5qcycpXHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBFeHBvc2UgR29kXHJcbiAqL1xyXG52YXIgR29kOiBhbnkgPSB7XHJcbiAgbmV4dF9pZCA6IDAsXHJcbiAgY2x1c3RlcnNfZGIgOiB7fSxcclxuICBjb25maWd1cmF0aW9uOiB7fSxcclxuICBzdGFydGVkX2F0IDogRGF0ZS5ub3coKSxcclxuICBzeXN0ZW1faW5mb3NfcHJvYzogbnVsbCxcclxuICBzeXN0ZW1faW5mb3M6IG51bGwsXHJcbiAgYnVzIDogbmV3IEV2ZW50RW1pdHRlcjIoe1xyXG4gICAgd2lsZGNhcmQ6IHRydWUsXHJcbiAgICBkZWxpbWl0ZXI6ICc6JyxcclxuICAgIG1heExpc3RlbmVyczogMTAwMFxyXG4gIH0pXHJcbn07XHJcblxyXG5VdGlsaXR5Lm92ZXJyaWRlQ29uc29sZShHb2QuYnVzKTtcclxuXHJcbi8qKlxyXG4gKiBQb3B1bGF0ZSBHb2QgbmFtZXNwYWNlXHJcbiAqL1xyXG5yZXF1aXJlKCcuL0V2ZW50LmpzJykoR29kKTtcclxucmVxdWlyZSgnLi9Hb2QvTWV0aG9kcy5qcycpKEdvZCk7XHJcbnJlcXVpcmUoJy4vR29kL0ZvcmtNb2RlLmpzJykoR29kKTtcclxucmVxdWlyZSgnLi9Hb2QvQ2x1c3Rlck1vZGUuanMnKShHb2QpO1xyXG5yZXF1aXJlKCcuL0dvZC9SZWxvYWQnKShHb2QpO1xyXG5yZXF1aXJlKCcuL0dvZC9BY3Rpb25NZXRob2RzJykoR29kKTtcclxucmVxdWlyZSgnLi9XYXRjaGVyJykoR29kKTtcclxuXHJcbkdvZC5pbml0ID0gZnVuY3Rpb24oKSB7XHJcbiAgcmVxdWlyZSgnLi9Xb3JrZXIuanMnKSh0aGlzKVxyXG4gIEdvZC5zeXN0ZW1faW5mb3NfcHJvYyA9IG51bGxcclxuXHJcbiAgdGhpcy5jb25maWd1cmF0aW9uID0gQ29uZmlndXJhdGlvbi5nZXRTeW5jKCdwbTInKVxyXG5cclxuICBpZiAodGhpcy5jb25maWd1cmF0aW9uICYmIHRoaXMuY29uZmlndXJhdGlvbi5zeXNtb25pdCA9PSAndHJ1ZScpIHtcclxuICAgIEdvZC5sYXVuY2hTeXNNb25pdG9yaW5nKHt9LCAoKSA9PiB7IGNvbnNvbGUubG9nKCdTeXN0ZW0gbW9uaXRvcmluZyBsYXVuY2hlZCcpIH0pXHJcbiAgfVxyXG5cclxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgR29kLldvcmtlci5zdGFydCgpXHJcbiAgfSwgNTAwKVxyXG59XHJcblxyXG5Hb2Qud3JpdGVFeGl0U2VwYXJhdG9yID0gZnVuY3Rpb24ocG0yX2VudiwgY29kZSwgc2lnbmFsKSB7XHJcbiAgdHJ5IHtcclxuICAgIHZhciBleGl0X3NlcCA9IGBbUE0yXVske25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX1dIGFwcCBleGl0ZWRgXHJcbiAgICBpZiAoY29kZSlcclxuICAgICAgZXhpdF9zZXAgKz0gYGl0c2VsZiB3aXRoIGV4aXQgY29kZTogJHtjb2RlfWBcclxuICAgIGlmIChzaWduYWwpXHJcbiAgICAgIGV4aXRfc2VwICs9IGBieSBhbiBleHRlcm5hbCBzaWduYWw6ICR7c2lnbmFsfWBcclxuICAgIGV4aXRfc2VwICs9ICdcXG4nXHJcblxyXG4gICAgaWYgKHBtMl9lbnYucG1fb3V0X2xvZ19wYXRoKVxyXG4gICAgICBmcy53cml0ZUZpbGVTeW5jKHBtMl9lbnYucG1fb3V0X2xvZ19wYXRoLCBleGl0X3NlcClcclxuICAgIGlmIChwbTJfZW52LnBtX2Vycl9sb2dfcGF0aClcclxuICAgICAgZnMud3JpdGVGaWxlU3luYyhwbTJfZW52LnBtX2Vycl9sb2dfcGF0aCwgZXhpdF9zZXApXHJcbiAgICBpZiAocG0yX2Vudi5wbV9sb2dfcGF0aClcclxuICAgICAgZnMud3JpdGVGaWxlU3luYyhwbTJfZW52LnBtX2xvZ19wYXRoLCBleGl0X3NlcClcclxuICB9IGNhdGNoKGUpIHtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbml0IG5ldyBwcm9jZXNzXHJcbiAqL1xyXG5Hb2QucHJlcGFyZSA9IGZ1bmN0aW9uIHByZXBhcmUgKGVudiwgY2IpIHtcclxuICAvLyBnZW5lcmF0ZSBhIG5ldyB1bmlxdWUgaWQgZm9yIGVhY2ggcHJvY2Vzc2VzXHJcbiAgZW52LmVudi51bmlxdWVfaWQgPSBVdGlsaXR5LmdlbmVyYXRlVVVJRCgpXHJcblxyXG4gIC8vIGlmIHRoZSBhcHAgaXMgc3RhbmRhbG9uZSwgbm8gbXVsdGlwbGUgaW5zdGFuY2VcclxuICBpZiAodHlwZW9mIGVudi5pbnN0YW5jZXMgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBlbnYudml6aW9uX3J1bm5pbmcgPSBmYWxzZTtcclxuICAgIGlmIChlbnYuZW52ICYmIGVudi5lbnYudml6aW9uX3J1bm5pbmcpIGVudi5lbnYudml6aW9uX3J1bm5pbmcgPSBmYWxzZTtcclxuXHJcbiAgICBpZiAoZW52LnN0YXR1cyA9PSBjc3QuU1RPUFBFRF9TVEFUVVMpIHtcclxuICAgICAgZW52LnBtX2lkID0gR29kLmdldE5ld0lkKClcclxuICAgICAgdmFyIGNsdSA9IHtcclxuICAgICAgICBwbTJfZW52IDogZW52LFxyXG4gICAgICAgIHByb2Nlc3M6IHtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgR29kLmNsdXN0ZXJzX2RiW2Vudi5wbV9pZF0gPSBjbHVcclxuICAgICAgcmV0dXJuIGNiKG51bGwsIFsgR29kLmNsdXN0ZXJzX2RiW2Vudi5wbV9pZF0gXSlcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gR29kLmV4ZWN1dGVBcHAoZW52LCBmdW5jdGlvbiAoZXJyLCBjbHUpIHtcclxuICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XHJcbiAgICAgIEdvZC5ub3RpZnkoJ3N0YXJ0JywgY2x1LCB0cnVlKTtcclxuICAgICAgcmV0dXJuIGNiKG51bGwsIFsgVXRpbGl0eS5jbG9uZShjbHUpIF0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvLyBmaW5kIGhvdyBtYW55IHJlcGxpY2F0ZSB0aGUgdXNlciB3YW50XHJcbiAgZW52Lmluc3RhbmNlcyA9IHBhcnNlSW50KGVudi5pbnN0YW5jZXMpO1xyXG4gIGlmIChlbnYuaW5zdGFuY2VzID09PSAwKSB7XHJcbiAgICBlbnYuaW5zdGFuY2VzID0gbnVtQ1BVcztcclxuICB9IGVsc2UgaWYgKGVudi5pbnN0YW5jZXMgPCAwKSB7XHJcbiAgICBlbnYuaW5zdGFuY2VzICs9IG51bUNQVXM7XHJcbiAgfVxyXG4gIGlmIChlbnYuaW5zdGFuY2VzIDw9IDApIHtcclxuICAgIGVudi5pbnN0YW5jZXMgPSAxO1xyXG4gIH1cclxuXHJcbiAgdGltZXNMaW1pdChlbnYuaW5zdGFuY2VzLCAxLCBmdW5jdGlvbiAobiwgbmV4dCkge1xyXG4gICAgZW52LnZpemlvbl9ydW5uaW5nID0gZmFsc2U7XHJcbiAgICBpZiAoZW52LmVudiAmJiBlbnYuZW52LnZpemlvbl9ydW5uaW5nKSB7XHJcbiAgICAgIGVudi5lbnYudml6aW9uX3J1bm5pbmcgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBHb2QuaW5qZWN0VmFyaWFibGVzKGVudiwgZnVuY3Rpb24gaW5qZWN0IChlcnIsIF9lbnYpIHtcclxuICAgICAgaWYgKGVycikgcmV0dXJuIG5leHQoZXJyKTtcclxuICAgICAgcmV0dXJuIEdvZC5leGVjdXRlQXBwKFV0aWxpdHkuY2xvbmUoX2VudiksIGZ1bmN0aW9uIChlcnIsIGNsdSkge1xyXG4gICAgICAgIGlmIChlcnIpIHJldHVybiBuZXh0KGVycik7XHJcbiAgICAgICAgR29kLm5vdGlmeSgnc3RhcnQnLCBjbHUsIHRydWUpO1xyXG4gICAgICAgIC8vIGhlcmUgY2FsbCBuZXh0IHdpaHRvdXQgYW4gYXJyYXkgYmVjYXVzZVxyXG4gICAgICAgIC8vIGFzeW5jLnRpbWVzIGFnZ3JlZ2F0ZSB0aGUgcmVzdWx0IGludG8gYW4gYXJyYXlcclxuICAgICAgICByZXR1cm4gbmV4dChudWxsLCBVdGlsaXR5LmNsb25lKGNsdSkpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0sIGNiKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMYXVuY2ggdGhlIHNwZWNpZmllZCBzY3JpcHQgKHByZXNlbnQgaW4gZW52KVxyXG4gKiBAYXBpIHByaXZhdGVcclxuICogQG1ldGhvZCBleGVjdXRlQXBwXHJcbiAqIEBwYXJhbSB7TWl4ZWR9IGVudlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYlxyXG4gKiBAcmV0dXJuIExpdGVyYWxcclxuICovXHJcbkdvZC5leGVjdXRlQXBwID0gZnVuY3Rpb24gZXhlY3V0ZUFwcChlbnYsIGNiKSB7XHJcbiAgdmFyIGVudl9jb3B5ID0gVXRpbGl0eS5jbG9uZShlbnYpO1xyXG5cclxuICBVdGlsaXR5LmV4dGVuZChlbnZfY29weSwgZW52X2NvcHkuZW52KTtcclxuXHJcbiAgZW52X2NvcHlbJ3N0YXR1cyddICAgICAgICAgPSBjc3QuTEFVTkNISU5HX1NUQVRVUztcclxuICBlbnZfY29weVsncG1fdXB0aW1lJ10gICAgICA9IERhdGUubm93KCk7XHJcbiAgZW52X2NvcHlbJ2F4bV9hY3Rpb25zJ10gICAgPSBbXTtcclxuICBlbnZfY29weVsnYXhtX21vbml0b3InXSAgICA9IHt9O1xyXG4gIGVudl9jb3B5WydheG1fb3B0aW9ucyddICAgID0ge307XHJcbiAgZW52X2NvcHlbJ2F4bV9keW5hbWljJ10gICAgPSB7fTtcclxuICBlbnZfY29weVsndml6aW9uX3J1bm5pbmcnXSA9XHJcbiAgICBlbnZfY29weVsndml6aW9uX3J1bm5pbmcnXSAhPT0gdW5kZWZpbmVkID8gZW52X2NvcHlbJ3Zpemlvbl9ydW5uaW5nJ10gOiBmYWxzZTtcclxuXHJcbiAgaWYgKCFlbnZfY29weS5jcmVhdGVkX2F0KVxyXG4gICAgZW52X2NvcHlbJ2NyZWF0ZWRfYXQnXSA9IERhdGUubm93KCk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEVudGVyIGhlcmUgd2hlbiBpdCdzIHRoZSBmaXJzdCB0aW1lIHRoYXQgdGhlIHByb2Nlc3MgaXMgY3JlYXRlZFxyXG4gICAqIDEgLSBBc3NpZ24gYSBuZXcgaWRcclxuICAgKiAyIC0gUmVzZXQgcmVzdGFydCB0aW1lIGFuZCB1bnN0YWJsZV9yZXN0YXJ0c1xyXG4gICAqIDMgLSBBc3NpZ24gYSBsb2cgZmlsZSBuYW1lIGRlcGVuZGluZyBvbiB0aGUgaWRcclxuICAgKiA0IC0gSWYgd2F0Y2ggb3B0aW9uIGlzIHNldCwgbG9vayBmb3IgY2hhbmdlc1xyXG4gICAqL1xyXG4gIGlmIChlbnZfY29weVsncG1faWQnXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBlbnZfY29weVsncG1faWQnXSAgICAgICAgICAgICA9IEdvZC5nZXROZXdJZCgpO1xyXG4gICAgZW52X2NvcHlbJ3Jlc3RhcnRfdGltZSddICAgICAgPSAwO1xyXG4gICAgZW52X2NvcHlbJ3Vuc3RhYmxlX3Jlc3RhcnRzJ10gPSAwO1xyXG5cclxuICAgIC8vIGFkZCAtcG1faWQgdG8gcGlkIGZpbGVcclxuICAgIGVudl9jb3B5LnBtX3BpZF9wYXRoID0gZW52X2NvcHkucG1fcGlkX3BhdGgucmVwbGFjZSgvLVswLTldK1xcLnBpZCR8XFwucGlkJC9nLCAnLScgKyBlbnZfY29weVsncG1faWQnXSArICcucGlkJyk7XHJcblxyXG4gICAgLy8gSWYgbWVyZ2Ugb3B0aW9uLCBkb250IHNlcGFyYXRlIHRoZSBsb2dzXHJcbiAgICBpZiAoIWVudl9jb3B5WydtZXJnZV9sb2dzJ10pIHtcclxuICAgICAgWycnLCAnX291dCcsICdfZXJyJ10uZm9yRWFjaChmdW5jdGlvbihrKXtcclxuICAgICAgICB2YXIga2V5ID0gJ3BtJyArIGsgKyAnX2xvZ19wYXRoJztcclxuICAgICAgICBlbnZfY29weVtrZXldICYmIChlbnZfY29weVtrZXldID0gZW52X2NvcHlba2V5XS5yZXBsYWNlKC8tWzAtOV0rXFwubG9nJHxcXC5sb2ckL2csICctJyArIGVudl9jb3B5WydwbV9pZCddICsgJy5sb2cnKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEluaXRpYXRlIHdhdGNoIGZpbGVcclxuICAgIGlmIChlbnZfY29weVsnd2F0Y2gnXSkge1xyXG4gICAgICBHb2Qud2F0Y2guZW5hYmxlKGVudl9jb3B5KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIEdvZC5yZWdpc3RlckNyb24oZW52X2NvcHkpXHJcblxyXG4gIC8qKiBDYWxsYmFjayB3aGVuIGFwcGxpY2F0aW9uIGlzIGxhdW5jaGVkICovXHJcbiAgdmFyIHJlYWR5Q2IgPSBmdW5jdGlvbiByZWFkeShwcm9jKSB7XHJcbiAgICAvLyBJZiB2aXppb24gZW5hYmxlZCBydW4gdmVyc2lvbmluZyByZXRyaWV2YWwgc3lzdGVtXHJcbiAgICBpZiAocHJvYy5wbTJfZW52LnZpemlvbiAhPT0gZmFsc2UgJiYgcHJvYy5wbTJfZW52LnZpemlvbiAhPT0gXCJmYWxzZVwiKVxyXG4gICAgICBHb2QuZmluYWxpemVQcm9jZWR1cmUocHJvYyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIEdvZC5ub3RpZnkoJ29ubGluZScsIHByb2MpO1xyXG5cclxuICAgIGlmIChwcm9jLnBtMl9lbnYuc3RhdHVzICE9PSBjc3QuRVJST1JFRF9TVEFUVVMpXHJcbiAgICAgIHByb2MucG0yX2Vudi5zdGF0dXMgPSBjc3QuT05MSU5FX1NUQVRVU1xyXG5cclxuICAgIGNvbnNvbGUubG9nKGBBcHAgWyR7cHJvYy5wbTJfZW52Lm5hbWV9OiR7cHJvYy5wbTJfZW52LnBtX2lkfV0gb25saW5lYCk7XHJcbiAgICBpZiAoY2IpIGNiKG51bGwsIHByb2MpO1xyXG4gIH1cclxuXHJcbiAgaWYgKGVudl9jb3B5LmV4ZWNfbW9kZSA9PT0gJ2NsdXN0ZXJfbW9kZScpIHtcclxuICAgIC8qKlxyXG4gICAgICogQ2x1c3RlciBtb2RlIGxvZ2ljIChmb3IgTm9kZUpTIGFwcHMpXHJcbiAgICAgKi9cclxuICAgIEdvZC5ub2RlQXBwKGVudl9jb3B5LCBmdW5jdGlvbiBub2RlQXBwKGVyciwgY2x1KSB7XHJcbiAgICAgIGlmIChjYiAmJiBlcnIpIHJldHVybiBjYihlcnIpO1xyXG4gICAgICBpZiAoZXJyKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICB2YXIgb2xkX2VudiA9IEdvZC5jbHVzdGVyc19kYltjbHUucG0yX2Vudi5wbV9pZF07XHJcblxyXG4gICAgICBpZiAob2xkX2Vudikge1xyXG4gICAgICAgIG9sZF9lbnYgPSBudWxsO1xyXG4gICAgICAgIEdvZC5jbHVzdGVyc19kYltjbHUucG0yX2Vudi5wbV9pZF0gPSBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBHb2QuY2x1c3RlcnNfZGJbY2x1LnBtMl9lbnYucG1faWRdID0gY2x1O1xyXG5cclxuICAgICAgY2x1Lm9uY2UoJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2sgfHwgZXJyKTtcclxuICAgICAgICBjbHUucG0yX2Vudi5zdGF0dXMgPSBjc3QuRVJST1JFRF9TVEFUVVM7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNsdS5kZXN0cm95ICYmIGNsdS5kZXN0cm95KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XHJcbiAgICAgICAgICBHb2QuaGFuZGxlRXhpdChjbHUsIGNzdC5FUlJPUl9FWElUKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgY2x1Lm9uY2UoJ2Rpc2Nvbm5lY3QnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnQXBwIG5hbWU6JXMgaWQ6JXMgZGlzY29ubmVjdGVkJywgY2x1LnBtMl9lbnYubmFtZSwgY2x1LnBtMl9lbnYucG1faWQpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGNsdS5vbmNlKCdleGl0JywgZnVuY3Rpb24gY2x1RXhpdChjb2RlLCBzaWduYWwpIHtcclxuICAgICAgICAvL0dvZC53cml0ZUV4aXRTZXBhcmF0b3IoY2x1LnBtMl9lbnYsIGNvZGUsIHNpZ25hbClcclxuICAgICAgICBHb2QuaGFuZGxlRXhpdChjbHUsIGNvZGUgfHwgMCwgc2lnbmFsIHx8ICdTSUdJTlQnKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gY2x1Lm9uY2UoJ29ubGluZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoIWNsdS5wbTJfZW52LndhaXRfcmVhZHkpXHJcbiAgICAgICAgICByZXR1cm4gcmVhZHlDYihjbHUpO1xyXG5cclxuICAgICAgICAvLyBUaW1lb3V0IGlmIHRoZSByZWFkeSBtZXNzYWdlIGhhcyBub3QgYmVlbiBzZW50IGJlZm9yZSBsaXN0ZW5fdGltZW91dFxyXG4gICAgICAgIHZhciByZWFkeV90aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgIEdvZC5idXMucmVtb3ZlTGlzdGVuZXIoJ3Byb2Nlc3M6bXNnJywgbGlzdGVuZXIpXHJcbiAgICAgICAgICByZXR1cm4gcmVhZHlDYihjbHUpXHJcbiAgICAgICAgfSwgY2x1LnBtMl9lbnYubGlzdGVuX3RpbWVvdXQgfHwgY3N0LkdSQUNFRlVMX0xJU1RFTl9USU1FT1VUKTtcclxuXHJcbiAgICAgICAgdmFyIGxpc3RlbmVyID0gZnVuY3Rpb24gKHBhY2tldCkge1xyXG4gICAgICAgICAgaWYgKHBhY2tldC5yYXcgPT09ICdyZWFkeScgJiZcclxuICAgICAgICAgICAgICBwYWNrZXQucHJvY2Vzcy5uYW1lID09PSBjbHUucG0yX2Vudi5uYW1lICYmXHJcbiAgICAgICAgICAgICAgcGFja2V0LnByb2Nlc3MucG1faWQgPT09IGNsdS5wbTJfZW52LnBtX2lkKSB7XHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChyZWFkeV90aW1lb3V0KTtcclxuICAgICAgICAgICAgR29kLmJ1cy5yZW1vdmVMaXN0ZW5lcigncHJvY2Vzczptc2cnLCBsaXN0ZW5lcilcclxuICAgICAgICAgICAgcmV0dXJuIHJlYWR5Q2IoY2x1KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgR29kLmJ1cy5vbigncHJvY2Vzczptc2cnLCBsaXN0ZW5lcik7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgLyoqXHJcbiAgICAgKiBGb3JrIG1vZGUgbG9naWNcclxuICAgICAqL1xyXG4gICAgR29kLmZvcmtNb2RlKGVudl9jb3B5LCBmdW5jdGlvbiBmb3JrTW9kZShlcnIsIGNsdSkge1xyXG4gICAgICBpZiAoY2IgJiYgZXJyKSByZXR1cm4gY2IoZXJyKTtcclxuICAgICAgaWYgKGVycikgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgdmFyIG9sZF9lbnYgPSBHb2QuY2x1c3RlcnNfZGJbY2x1LnBtMl9lbnYucG1faWRdO1xyXG4gICAgICBpZiAob2xkX2Vudikgb2xkX2VudiA9IG51bGw7XHJcblxyXG4gICAgICBHb2QuY2x1c3RlcnNfZGJbZW52X2NvcHkucG1faWRdID0gY2x1O1xyXG5cclxuICAgICAgY2x1Lm9uY2UoJ2Vycm9yJywgZnVuY3Rpb24gY2x1RXJyb3IoZXJyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2sgfHwgZXJyKTtcclxuICAgICAgICBjbHUucG0yX2Vudi5zdGF0dXMgPSBjc3QuRVJST1JFRF9TVEFUVVM7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNsdS5raWxsICYmIGNsdS5raWxsKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XHJcbiAgICAgICAgICBHb2QuaGFuZGxlRXhpdChjbHUsIGNzdC5FUlJPUl9FWElUKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgY2x1Lm9uY2UoJ2V4aXQnLCBmdW5jdGlvbiBjbHVDbG9zZShjb2RlLCBzaWduYWwpIHtcclxuICAgICAgICAvL0dvZC53cml0ZUV4aXRTZXBhcmF0b3IoY2x1LnBtMl9lbnYsIGNvZGUsIHNpZ25hbClcclxuXHJcbiAgICAgICAgaWYgKGNsdS5jb25uZWN0ZWQgPT09IHRydWUpXHJcbiAgICAgICAgICBjbHUuZGlzY29ubmVjdCAmJiBjbHUuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgIGNsdS5fcmVsb2FkTG9ncyA9IG51bGw7XHJcbiAgICAgICAgcmV0dXJuIEdvZC5oYW5kbGVFeGl0KGNsdSwgY29kZSB8fCAwLCBzaWduYWwpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGlmICghY2x1LnBtMl9lbnYud2FpdF9yZWFkeSlcclxuICAgICAgICByZXR1cm4gcmVhZHlDYihjbHUpO1xyXG5cclxuICAgICAgLy8gVGltZW91dCBpZiB0aGUgcmVhZHkgbWVzc2FnZSBoYXMgbm90IGJlZW4gc2VudCBiZWZvcmUgbGlzdGVuX3RpbWVvdXRcclxuICAgICAgdmFyIHJlYWR5X3RpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIEdvZC5idXMucmVtb3ZlTGlzdGVuZXIoJ3Byb2Nlc3M6bXNnJywgbGlzdGVuZXIpXHJcbiAgICAgICAgcmV0dXJuIHJlYWR5Q2IoY2x1KVxyXG4gICAgICB9LCBjbHUucG0yX2Vudi5saXN0ZW5fdGltZW91dCB8fCBjc3QuR1JBQ0VGVUxfTElTVEVOX1RJTUVPVVQpO1xyXG5cclxuICAgICAgdmFyIGxpc3RlbmVyID0gZnVuY3Rpb24gKHBhY2tldCkge1xyXG4gICAgICAgIGlmIChwYWNrZXQucmF3ID09PSAncmVhZHknICYmXHJcbiAgICAgICAgICAgIHBhY2tldC5wcm9jZXNzLm5hbWUgPT09IGNsdS5wbTJfZW52Lm5hbWUgJiZcclxuICAgICAgICAgICAgcGFja2V0LnByb2Nlc3MucG1faWQgPT09IGNsdS5wbTJfZW52LnBtX2lkKSB7XHJcbiAgICAgICAgICBjbGVhclRpbWVvdXQocmVhZHlfdGltZW91dCk7XHJcbiAgICAgICAgICBHb2QuYnVzLnJlbW92ZUxpc3RlbmVyKCdwcm9jZXNzOm1zZycsIGxpc3RlbmVyKVxyXG4gICAgICAgICAgcmV0dXJuIHJlYWR5Q2IoY2x1KVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBHb2QuYnVzLm9uKCdwcm9jZXNzOm1zZycsIGxpc3RlbmVyKTtcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogSGFuZGxlIGxvZ2ljIHdoZW4gYSBwcm9jZXNzIGV4aXQgKE5vZGUgb3IgRm9yaylcclxuICogQG1ldGhvZCBoYW5kbGVFeGl0XHJcbiAqIEBwYXJhbSB7fSBjbHVcclxuICogQHBhcmFtIHt9IGV4aXRfY29kZVxyXG4gKiBAcmV0dXJuXHJcbiAqL1xyXG5Hb2QuaGFuZGxlRXhpdCA9IGZ1bmN0aW9uIGhhbmRsZUV4aXQoY2x1LCBleGl0X2NvZGUsIGtpbGxfc2lnbmFsKSB7XHJcbiAgY29uc29sZS5sb2coYEFwcCBbJHtjbHUucG0yX2Vudi5uYW1lfToke2NsdS5wbTJfZW52LnBtX2lkfV0gZXhpdGVkIHdpdGggY29kZSBbJHtleGl0X2NvZGV9XSB2aWEgc2lnbmFsIFske2tpbGxfc2lnbmFsIHx8ICdTSUdJTlQnfV1gKVxyXG5cclxuICB2YXIgcHJvYyA9IHRoaXMuY2x1c3RlcnNfZGJbY2x1LnBtMl9lbnYucG1faWRdO1xyXG5cclxuICBpZiAoIXByb2MpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1Byb2Nlc3MgdW5kZWZpbmVkID8gd2l0aCBwcm9jZXNzIGlkICcsIGNsdS5wbTJfZW52LnBtX2lkKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIHZhciBzdG9wcGluZyA9IChwcm9jLnBtMl9lbnYuc3RhdHVzID09IGNzdC5TVE9QUElOR19TVEFUVVNcclxuICAgICAgICAgICAgICAgICAgfHwgcHJvYy5wbTJfZW52LnN0YXR1cyA9PSBjc3QuU1RPUFBFRF9TVEFUVVNcclxuICAgICAgICAgICAgICAgICAgfHwgcHJvYy5wbTJfZW52LnN0YXR1cyA9PSBjc3QuRVJST1JFRF9TVEFUVVMpXHJcbiAgICAgIHx8IChwcm9jLnBtMl9lbnYuYXV0b3Jlc3RhcnQgPT09IGZhbHNlIHx8IHByb2MucG0yX2Vudi5hdXRvcmVzdGFydCA9PT0gXCJmYWxzZVwiKTtcclxuXHJcbiAgdmFyIG92ZXJsaW1pdCAgID0gZmFsc2U7XHJcblxyXG4gIGlmIChzdG9wcGluZykgcHJvYy5wcm9jZXNzLnBpZCA9IDA7XHJcblxyXG4gIC8vIFJlc2V0IHByb2JlcyBhbmQgYWN0aW9uc1xyXG4gIGlmIChwcm9jLnBtMl9lbnYuYXhtX2FjdGlvbnMpIHByb2MucG0yX2Vudi5heG1fYWN0aW9ucyA9IFtdO1xyXG4gIGlmIChwcm9jLnBtMl9lbnYuYXhtX21vbml0b3IpIHByb2MucG0yX2Vudi5heG1fbW9uaXRvciA9IHt9O1xyXG5cclxuICBpZiAocHJvYy5wbTJfZW52LnN0YXR1cyAhPSBjc3QuRVJST1JFRF9TVEFUVVMgJiZcclxuICAgICAgcHJvYy5wbTJfZW52LnN0YXR1cyAhPSBjc3QuU1RPUFBJTkdfU1RBVFVTKVxyXG4gICAgcHJvYy5wbTJfZW52LnN0YXR1cyA9IGNzdC5TVE9QUEVEX1NUQVRVUztcclxuXHJcbiAgaWYgKHByb2MucG0yX2Vudi5wbV9pZC50b1N0cmluZygpLmluZGV4T2YoJ19vbGRfJykgIT09IDApIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGZzLnVubGlua1N5bmMocHJvYy5wbTJfZW52LnBtX3BpZF9wYXRoKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgZGVidWcoJ0Vycm9yIHdoZW4gdW5saW5raW5nIHBpZCBmaWxlJywgZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBdm9pZCBpbmZpbml0ZSByZWxvb3AgaWYgYW4gZXJyb3IgaXMgcHJlc2VudFxyXG4gICAqL1xyXG4gIC8vIElmIHRoZSBwcm9jZXNzIGhhcyBiZWVuIGNyZWF0ZWQgbGVzcyB0aGFuIDE1c2Vjb25kcyBhZ29cclxuXHJcbiAgLy8gQW5kIGlmIHRoZSBwcm9jZXNzIGhhcyBhbiB1cHRpbWUgbGVzcyB0aGFuIGEgc2Vjb25kXHJcbiAgdmFyIG1pbl91cHRpbWUgPSB0eXBlb2YocHJvYy5wbTJfZW52Lm1pbl91cHRpbWUpICE9PSAndW5kZWZpbmVkJyA/IHByb2MucG0yX2Vudi5taW5fdXB0aW1lIDogMTAwMDtcclxuICB2YXIgbWF4X3Jlc3RhcnRzID0gdHlwZW9mKHByb2MucG0yX2Vudi5tYXhfcmVzdGFydHMpICE9PSAndW5kZWZpbmVkJyA/IHByb2MucG0yX2Vudi5tYXhfcmVzdGFydHMgOiAxNjtcclxuXHJcbiAgaWYgKChEYXRlLm5vdygpIC0gcHJvYy5wbTJfZW52LmNyZWF0ZWRfYXQpIDwgKG1pbl91cHRpbWUgKiBtYXhfcmVzdGFydHMpKSB7XHJcbiAgICBpZiAoKERhdGUubm93KCkgLSBwcm9jLnBtMl9lbnYucG1fdXB0aW1lKSA8IG1pbl91cHRpbWUpIHtcclxuICAgICAgLy8gSW5jcmVtZW50IHVuc3RhYmxlIHJlc3RhcnRcclxuICAgICAgcHJvYy5wbTJfZW52LnVuc3RhYmxlX3Jlc3RhcnRzICs9IDE7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgaWYgKHByb2MucG0yX2Vudi51bnN0YWJsZV9yZXN0YXJ0cyA+PSBtYXhfcmVzdGFydHMpIHtcclxuICAgIC8vIFRvbyBtYW55IHVuc3RhYmxlIHJlc3RhcnQgaW4gbGVzcyB0aGFuIDE1IHNlY29uZHNcclxuICAgIC8vIFNldCB0aGUgcHJvY2VzcyBhcyAnRVJST1JFRCdcclxuICAgIC8vIEFuZCBzdG9wIHJlc3RhcnRpbmcgaXRcclxuICAgIHByb2MucG0yX2Vudi5zdGF0dXMgPSBjc3QuRVJST1JFRF9TVEFUVVM7XHJcbiAgICBwcm9jLnByb2Nlc3MucGlkID0gMDtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnU2NyaXB0ICVzIGhhZCB0b28gbWFueSB1bnN0YWJsZSByZXN0YXJ0cyAoJWQpLiBTdG9wcGVkLiAlaicsXHJcbiAgICAgIHByb2MucG0yX2Vudi5wbV9leGVjX3BhdGgsXHJcbiAgICAgIHByb2MucG0yX2Vudi51bnN0YWJsZV9yZXN0YXJ0cyxcclxuICAgICAgcHJvYy5wbTJfZW52LnN0YXR1cyk7XHJcblxyXG4gICAgR29kLm5vdGlmeSgncmVzdGFydCBvdmVybGltaXQnLCBwcm9jKTtcclxuXHJcbiAgICBwcm9jLnBtMl9lbnYudW5zdGFibGVfcmVzdGFydHMgPSAwO1xyXG4gICAgcHJvYy5wbTJfZW52LmNyZWF0ZWRfYXQgPSBudWxsO1xyXG4gICAgb3ZlcmxpbWl0ID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIGlmICh0eXBlb2YoZXhpdF9jb2RlKSAhPT0gJ3VuZGVmaW5lZCcpIHByb2MucG0yX2Vudi5leGl0X2NvZGUgPSBleGl0X2NvZGU7XHJcblxyXG4gIEdvZC5ub3RpZnkoJ2V4aXQnLCBwcm9jKTtcclxuXHJcbiAgaWYgKEdvZC5wbTJfYmVpbmdfa2lsbGVkKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdbSGFuZGxlRXhpdF0gUE0yIGlzIGJlaW5nIGtpbGxlZCwgc3RvcHBpbmcgcmVzdGFydCBwcm9jZWR1cmUuLi4nKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIHZhciByZXN0YXJ0X2RlbGF5ID0gMDtcclxuXHJcbiAgaWYgKHByb2MucG0yX2Vudi5yZXN0YXJ0X2RlbGF5ICE9PSB1bmRlZmluZWQgJiZcclxuICAgICAgIWlzTmFOKHBhcnNlSW50KHByb2MucG0yX2Vudi5yZXN0YXJ0X2RlbGF5KSkpIHtcclxuICAgIHByb2MucG0yX2Vudi5zdGF0dXMgPSBjc3QuV0FJVElOR19SRVNUQVJUO1xyXG4gICAgcmVzdGFydF9kZWxheSA9IHBhcnNlSW50KHByb2MucG0yX2Vudi5yZXN0YXJ0X2RlbGF5KTtcclxuICB9XHJcblxyXG4gIGlmIChwcm9jLnBtMl9lbnYuZXhwX2JhY2tvZmZfcmVzdGFydF9kZWxheSAhPT0gdW5kZWZpbmVkICYmXHJcbiAgICAgICFpc05hTihwYXJzZUludChwcm9jLnBtMl9lbnYuZXhwX2JhY2tvZmZfcmVzdGFydF9kZWxheSkpKSB7XHJcbiAgICBwcm9jLnBtMl9lbnYuc3RhdHVzID0gY3N0LldBSVRJTkdfUkVTVEFSVDtcclxuICAgIGlmICghcHJvYy5wbTJfZW52LnByZXZfcmVzdGFydF9kZWxheSkge1xyXG4gICAgICBwcm9jLnBtMl9lbnYucHJldl9yZXN0YXJ0X2RlbGF5ID0gcHJvYy5wbTJfZW52LmV4cF9iYWNrb2ZmX3Jlc3RhcnRfZGVsYXlcclxuICAgICAgcmVzdGFydF9kZWxheSA9IHByb2MucG0yX2Vudi5leHBfYmFja29mZl9yZXN0YXJ0X2RlbGF5XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcHJvYy5wbTJfZW52LnByZXZfcmVzdGFydF9kZWxheSA9IE1hdGguZmxvb3IoTWF0aC5taW4oMTUwMDAsIHByb2MucG0yX2Vudi5wcmV2X3Jlc3RhcnRfZGVsYXkgKiAxLjUpKVxyXG4gICAgICByZXN0YXJ0X2RlbGF5ID0gcHJvYy5wbTJfZW52LnByZXZfcmVzdGFydF9kZWxheVxyXG4gICAgfVxyXG4gICAgY29uc29sZS5sb2coYEFwcCBbJHtjbHUucG0yX2Vudi5uYW1lfToke2NsdS5wbTJfZW52LnBtX2lkfV0gd2lsbCByZXN0YXJ0IGluICR7cmVzdGFydF9kZWxheX1tc2ApXHJcbiAgfVxyXG5cclxuICBpZiAoIXN0b3BwaW5nICYmICFvdmVybGltaXQpIHtcclxuICAgIC8vbWFrZSB0aGlzIHByb3BlcnR5IHVuZW51bWVyYWJsZVxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb2MucG0yX2VudiwgJ3Jlc3RhcnRfdGFzaycsIHtjb25maWd1cmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlfSk7XHJcbiAgICBwcm9jLnBtMl9lbnYucmVzdGFydF90YXNrID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgcHJvYy5wbTJfZW52LnJlc3RhcnRfdGltZSArPSAxO1xyXG4gICAgICBHb2QuZXhlY3V0ZUFwcChwcm9jLnBtMl9lbnYpO1xyXG4gICAgfSwgcmVzdGFydF9kZWxheSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBmaW5hbGl6ZVByb2NlZHVyZVxyXG4gKiBAcGFyYW0gcHJvYyB7T2JqZWN0fVxyXG4gKiBAcmV0dXJuXHJcbiAqL1xyXG5Hb2QuZmluYWxpemVQcm9jZWR1cmUgPSBmdW5jdGlvbiBmaW5hbGl6ZVByb2NlZHVyZShwcm9jKSB7XHJcbiAgdmFyIGxhc3RfcGF0aCAgICA9ICcnO1xyXG4gIHZhciBjdXJyZW50X3BhdGggPSBwcm9jLnBtMl9lbnYuY3dkIHx8IHBhdGguZGlybmFtZShwcm9jLnBtMl9lbnYucG1fZXhlY19wYXRoKTtcclxuICB2YXIgcHJvY19pZCAgICAgID0gcHJvYy5wbTJfZW52LnBtX2lkO1xyXG5cclxuICBwcm9jLnBtMl9lbnYudmVyc2lvbiA9IFV0aWxpdHkuZmluZFBhY2thZ2VWZXJzaW9uKHByb2MucG0yX2Vudi5wbV9leGVjX3BhdGggfHwgcHJvYy5wbTJfZW52LmN3ZCk7XHJcblxyXG4gIGlmIChwcm9jLnBtMl9lbnYudml6aW9uX3J1bm5pbmcgPT09IHRydWUpIHtcclxuICAgIGRlYnVnKCdWaXppb24gaXMgYWxyZWFkeSBydW5uaW5nIGZvciBwcm9jIGlkOiAlZCwgc2tpcHBpbmcgdGhpcyByb3VuZCcsIHByb2NfaWQpO1xyXG4gICAgcmV0dXJuIEdvZC5ub3RpZnkoJ29ubGluZScsIHByb2MpO1xyXG4gIH1cclxuICBwcm9jLnBtMl9lbnYudml6aW9uX3J1bm5pbmcgPSB0cnVlO1xyXG5cclxuICB2aXppb24uYW5hbHl6ZSh7Zm9sZGVyIDogY3VycmVudF9wYXRofSwgZnVuY3Rpb24gcmVjdXJfcGF0aChlcnIsIG1ldGEpe1xyXG4gICAgdmFyIHByb2MgPSBHb2QuY2x1c3RlcnNfZGJbcHJvY19pZF07XHJcblxyXG4gICAgaWYgKGVycilcclxuICAgICAgZGVidWcoZXJyLnN0YWNrIHx8IGVycik7XHJcblxyXG4gICAgaWYgKCFwcm9jIHx8XHJcbiAgICAgICAgIXByb2MucG0yX2VudiB8fFxyXG4gICAgICAgIHByb2MucG0yX2Vudi5zdGF0dXMgPT0gY3N0LlNUT1BQRURfU1RBVFVTIHx8XHJcbiAgICAgICAgcHJvYy5wbTJfZW52LnN0YXR1cyA9PSBjc3QuU1RPUFBJTkdfU1RBVFVTIHx8XHJcbiAgICAgICAgcHJvYy5wbTJfZW52LnN0YXR1cyA9PSBjc3QuRVJST1JFRF9TVEFUVVMpIHtcclxuICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0NhbmNlbGxpbmcgdmVyc2lvbmluZyBkYXRhIHBhcnNpbmcnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jLnBtMl9lbnYudml6aW9uX3J1bm5pbmcgPSBmYWxzZTtcclxuXHJcbiAgICBpZiAoIWVycikge1xyXG4gICAgICBwcm9jLnBtMl9lbnYudmVyc2lvbmluZyA9IG1ldGE7XHJcbiAgICAgIHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aCA9IGN1cnJlbnRfcGF0aDtcclxuICAgICAgR29kLm5vdGlmeSgnb25saW5lJywgcHJvYyk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChlcnIgJiYgY3VycmVudF9wYXRoID09PSBsYXN0X3BhdGgpIHtcclxuICAgICAgcHJvYy5wbTJfZW52LnZlcnNpb25pbmcgPSBudWxsO1xyXG4gICAgICBHb2Qubm90aWZ5KCdvbmxpbmUnLCBwcm9jKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBsYXN0X3BhdGggPSBjdXJyZW50X3BhdGg7XHJcbiAgICAgIGN1cnJlbnRfcGF0aCA9IHBhdGguZGlybmFtZShjdXJyZW50X3BhdGgpO1xyXG4gICAgICBwcm9jLnBtMl9lbnYudml6aW9uX3J1bm5pbmcgPSB0cnVlO1xyXG4gICAgICB2aXppb24uYW5hbHl6ZSh7Zm9sZGVyIDogY3VycmVudF9wYXRofSwgcmVjdXJfcGF0aCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogSW5qZWN0IHZhcmlhYmxlcyBpbnRvIHByb2Nlc3Nlc1xyXG4gKiBAcGFyYW0ge09iamVjdH0gZW52IGVudmlyb25uZW1lbnQgdG8gYmUgcGFzc2VkIHRvIHRoZSBwcm9jZXNzXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIGludm9rZWQgd2l0aCA8ZXJyLCBlbnY+XHJcbiAqL1xyXG5Hb2QuaW5qZWN0VmFyaWFibGVzID0gZnVuY3Rpb24gaW5qZWN0VmFyaWFibGVzIChlbnYsIGNiKSB7XHJcbiAgLy8gYWxsb3cgdG8gb3ZlcnJpZGUgdGhlIGtleSBvZiBOT0RFX0FQUF9JTlNUQU5DRSBpZiB3YW50ZWRcclxuICB2YXIgaW5zdGFuY2VLZXkgPSBwcm9jZXNzLmVudi5QTTJfUFJPQ0VTU19JTlNUQU5DRV9WQVIgfHwgZW52Lmluc3RhbmNlX3ZhcjtcclxuXHJcbiAgLy8gd2UgbmVlZCB0byBmaW5kIHRoZSBsYXN0IE5PREVfQVBQX0lOU1RBTkNFIHVzZWRcclxuICB2YXIgaW5zdGFuY2VzID0gT2JqZWN0LmtleXMoR29kLmNsdXN0ZXJzX2RiKVxyXG4gICAgLm1hcChmdW5jdGlvbiAocHJvY0lkKSB7XHJcbiAgICAgIHJldHVybiBHb2QuY2x1c3RlcnNfZGJbcHJvY0lkXTtcclxuICAgIH0pLmZpbHRlcihmdW5jdGlvbiAocHJvYykge1xyXG4gICAgICByZXR1cm4gcHJvYy5wbTJfZW52Lm5hbWUgPT09IGVudi5uYW1lICYmXHJcbiAgICAgICAgdHlwZW9mIHByb2MucG0yX2VudltpbnN0YW5jZUtleV0gIT09ICd1bmRlZmluZWQnO1xyXG4gICAgfSkubWFwKGZ1bmN0aW9uIChwcm9jKSB7XHJcbiAgICAgIHJldHVybiBwcm9jLnBtMl9lbnZbaW5zdGFuY2VLZXldO1xyXG4gICAgfSkuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICByZXR1cm4gYiAtIGE7XHJcbiAgICB9KTtcclxuICAvLyBkZWZhdWx0IHRvIGxhc3Qgb25lICsgMVxyXG4gIHZhciBpbnN0YW5jZU51bWJlciA9IHR5cGVvZiBpbnN0YW5jZXNbMF0gPT09ICd1bmRlZmluZWQnID8gMCA6IGluc3RhbmNlc1swXSArIDE7XHJcbiAgLy8gYnV0IHRyeSB0byBmaW5kIGEgb25lIGF2YWlsYWJsZVxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgaW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBpZiAoaW5zdGFuY2VzLmluZGV4T2YoaSkgPT09IC0xKSB7XHJcbiAgICAgIGluc3RhbmNlTnVtYmVyID0gaTtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGVudltpbnN0YW5jZUtleV0gPSBpbnN0YW5jZU51bWJlcjtcclxuXHJcbiAgLy8gaWYgdXNpbmcgaW5jcmVtZW50X3Zhciwgd2UgbmVlZCB0byBpbmNyZW1lbnQgaXRcclxuICBpZiAoZW52LmluY3JlbWVudF92YXIpIHtcclxuICAgIHZhciBsYXN0SW5jcmVtZW50ID0gT2JqZWN0LmtleXMoR29kLmNsdXN0ZXJzX2RiKVxyXG4gICAgICAubWFwKGZ1bmN0aW9uIChwcm9jSWQpIHtcclxuICAgICAgICByZXR1cm4gR29kLmNsdXN0ZXJzX2RiW3Byb2NJZF07XHJcbiAgICAgIH0pLmZpbHRlcihmdW5jdGlvbiAocHJvYykge1xyXG4gICAgICAgIHJldHVybiBwcm9jLnBtMl9lbnYubmFtZSA9PT0gZW52Lm5hbWUgJiZcclxuICAgICAgICAgIHR5cGVvZiBwcm9jLnBtMl9lbnZbZW52LmluY3JlbWVudF92YXJdICE9PSAndW5kZWZpbmVkJztcclxuICAgICAgfSkubWFwKGZ1bmN0aW9uIChwcm9jKSB7XHJcbiAgICAgICAgcmV0dXJuIHByb2MucG0yX2VudltlbnYuaW5jcmVtZW50X3Zhcl07XHJcbiAgICAgIH0pLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gYiAtIGE7XHJcbiAgICAgIH0pWzBdO1xyXG4gICAgLy8gaW5qZWN0IGEgaW5jcmVtZW50YWwgdmFyaWFibGVcclxuICAgIHZhciBkZWZhdXQgPSBlbnYuZW52W2Vudi5pbmNyZW1lbnRfdmFyXSB8fCAwO1xyXG4gICAgZW52W2Vudi5pbmNyZW1lbnRfdmFyXSA9IHR5cGVvZiBsYXN0SW5jcmVtZW50ID09PSAndW5kZWZpbmVkJyA/IGRlZmF1dCA6IGxhc3RJbmNyZW1lbnQgKyAxO1xyXG4gICAgZW52LmVudltlbnYuaW5jcmVtZW50X3Zhcl0gPSBlbnZbZW52LmluY3JlbWVudF92YXJdO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGNiKG51bGwsIGVudik7XHJcbn07XHJcblxyXG5Hb2QubGF1bmNoU3lzTW9uaXRvcmluZyA9IGZ1bmN0aW9uKGVudiwgY2IpIHtcclxuICBpZiAoR29kLnN5c3RlbV9pbmZvc19wcm9jICE9PSBudWxsKVxyXG4gICAgcmV0dXJuIGNiKG5ldyBFcnJvcignU3lzIE1vbml0b3JpbmcgYWxyZWFkeSBsYXVuY2hlZCcpKVxyXG5cclxuICB0cnkge1xyXG4gICAgdmFyIHN5c2luZm8gPSByZXF1aXJlKCcuL1N5c2luZm8vU3lzdGVtSW5mby5qcycpXHJcbiAgICBHb2Quc3lzdGVtX2luZm9zX3Byb2MgPSBuZXcgc3lzaW5mbygpXHJcblxyXG4gICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICBHb2Quc3lzdGVtX2luZm9zX3Byb2MucXVlcnkoKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgIGlmIChlcnIpIHJldHVyblxyXG4gICAgICAgIEdvZC5zeXN0ZW1faW5mb3MgPSBkYXRhXHJcbiAgICAgIH0pXHJcbiAgICB9LCAxMDAwKVxyXG5cclxuICAgIEdvZC5zeXN0ZW1faW5mb3NfcHJvYy5mb3JrKClcclxuICB9IGNhdGNoKGUpIHtcclxuICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICBHb2Quc3lzdGVtX2luZm9zX3Byb2MgPSBudWxsXHJcbiAgfVxyXG4gIHJldHVybiBjYigpXHJcbn1cclxuXHJcbkdvZC5pbml0KClcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEdvZDtcclxuIl19