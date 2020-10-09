/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
'use strict';
/**
 * @file ActionMethod like restart, stop, monitor... are here
 * @author Alexandre Strzelewicz <as@unitech.io>
 * @project PM2
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _eachLimit = _interopRequireDefault(require("async/eachLimit"));

var _constants = _interopRequireDefault(require("../../constants.js"));

var _package = _interopRequireDefault(require("../../package.json"));

var _pidusage = _interopRequireDefault(require("pidusage"));

var _util = _interopRequireDefault(require("util"));

var _debug = _interopRequireDefault(require("debug"));

var _Utility = _interopRequireDefault(require("../Utility"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var debug = (0, _debug["default"])('pm2:ActionMethod');
var p = _path["default"];
/**
 * Description
 * @method exports
 * @param {} God
 * @return
 */

function _default(God) {
  /**
   * Description
   * @method getMonitorData
   * @param {} env
   * @param {} cb
   * @return
   */
  God.getMonitorData = function getMonitorData(env, cb) {
    var processes = God.getFormatedProcesses();
    var pids = processes.filter(filterBadProcess).map(function (pro, i) {
      var pid = getProcessId(pro);
      return pid;
    }); // No pids, return empty statistics

    if (pids.length === 0) {
      return cb(null, processes.map(function (pro) {
        pro['monit'] = {
          memory: 0,
          cpu: 0
        };
        return pro;
      }));
    }

    (0, _pidusage["default"])(pids, function retPidUsage(err, statistics) {
      // Just log, we'll set empty statistics
      if (err) {
        console.error('Error caught while calling pidusage');
        console.error(err);
        return cb(null, processes.map(function (pro) {
          pro['monit'] = {
            memory: 0,
            cpu: 0
          };
          return pro;
        }));
      }

      if (!statistics) {
        console.error('Statistics is not defined!');
        return cb(null, processes.map(function (pro) {
          pro['monit'] = {
            memory: 0,
            cpu: 0
          };
          return pro;
        }));
      }

      processes = processes.map(function (pro) {
        if (filterBadProcess(pro) === false) {
          pro['monit'] = {
            memory: 0,
            cpu: 0
          };
          return pro;
        }

        var pid = getProcessId(pro);
        var stat = statistics[pid];

        if (!stat) {
          pro['monit'] = {
            memory: 0,
            cpu: 0
          };
          return pro;
        }

        pro['monit'] = {
          memory: stat.memory,
          cpu: Math.round(stat.cpu * 10) / 10
        };
        return pro;
      });
      cb(null, processes);
    });
  };
  /**
   * Description
   * @method getSystemData
   * @param {} env
   * @param {} cb
   * @return
   */


  God.getSystemData = function getSystemData(env, cb) {
    if (God.system_infos_proc !== null) God.system_infos_proc.query(function (err, data) {
      cb(null, data);
    });else {
      cb(new Error('Sysinfos not launched, type: pm2 sysmonit'));
    }
  };
  /**
   * Description
   * @method dumpProcessList
   * @param {} cb
   * @return
   */


  God.dumpProcessList = function (cb) {
    var process_list = [];

    var apps = _Utility["default"].clone(God.getFormatedProcesses());

    var that = this; // Don't override the actual dump file if process list is empty
    // unless user explicitely did `pm2 dump`.
    // This often happens when PM2 crashed, we don't want to override
    // the dump file with an empty list of process.

    if (!apps[0]) {
      debug('[PM2] Did not override dump file because list of processes is empty');
      return cb(null, {
        success: true,
        process_list: process_list
      });
    }

    function fin(err) {
      // try to fix issues with empty dump file
      // like #3485
      if (process_list.length === 0) {
        // fix : if no dump file, no process, only module and after pm2 update
        if (!_fs["default"].existsSync(_constants["default"].DUMP_FILE_PATH) && typeof that.clearDump === 'function') {
          that.clearDump(function () {});
        } // if no process in list don't modify dump file
        // process list should not be empty


        return cb(null, {
          success: true,
          process_list: process_list
        });
      } // Back up dump file


      try {
        if (_fs["default"].existsSync(_constants["default"].DUMP_FILE_PATH)) {
          _fs["default"].writeFileSync(_constants["default"].DUMP_BACKUP_FILE_PATH, _fs["default"].readFileSync(_constants["default"].DUMP_FILE_PATH));
        }
      } catch (e) {
        console.error(e.stack || e);
      } // Overwrite dump file, delete if broken


      try {
        _fs["default"].writeFileSync(_constants["default"].DUMP_FILE_PATH, JSON.stringify(process_list));
      } catch (e) {
        console.error(e.stack || e);

        try {
          // try to backup file
          if (_fs["default"].existsSync(_constants["default"].DUMP_BACKUP_FILE_PATH)) {
            _fs["default"].writeFileSync(_constants["default"].DUMP_FILE_PATH, _fs["default"].readFileSync(_constants["default"].DUMP_BACKUP_FILE_PATH));
          }
        } catch (e) {
          // don't keep broken file
          _fs["default"].unlinkSync(_constants["default"].DUMP_FILE_PATH);

          console.error(e.stack || e);
        }
      }

      return cb(null, {
        success: true,
        process_list: process_list
      });
    }

    function saveProc(apps) {
      if (!apps[0]) return fin(null);
      delete apps[0].pm2_env.instances;
      delete apps[0].pm2_env.pm_id; // Do not dump modules

      if (!apps[0].pm2_env.pmx_module) process_list.push(apps[0].pm2_env);
      apps.shift();
      return saveProc(apps);
    }

    saveProc(apps);
  };
  /**
   * Description
   * @method ping
   * @param {} env
   * @param {} cb
   * @return CallExpression
   */


  God.ping = function (env, cb) {
    return cb(null, {
      msg: 'pong'
    });
  };
  /**
   * Description
   * @method notifyKillPM2
   */


  God.notifyKillPM2 = function () {
    God.pm2_being_killed = true;
  };
  /**
   * Duplicate a process
   * @method duplicateProcessId
   * @param {} id
   * @param {} cb
   * @return CallExpression
   */


  God.duplicateProcessId = function (id, cb) {
    if (!(id in God.clusters_db)) return cb(God.logAndGenerateError(id + ' id unknown'), {});
    if (!God.clusters_db[id] || !God.clusters_db[id].pm2_env) return cb(God.logAndGenerateError('Error when getting proc || proc.pm2_env'), {});

    var proc = _Utility["default"].clone(God.clusters_db[id].pm2_env);

    delete proc.created_at;
    delete proc.pm_id;
    delete proc.unique_id; // generate a new unique id for new process

    proc.unique_id = _Utility["default"].generateUUID();
    God.injectVariables(proc, function inject(_err, proc) {
      return God.executeApp(_Utility["default"].clone(proc), function (err, clu) {
        if (err) return cb(err);
        God.notify('start', clu, true);
        return cb(err, _Utility["default"].clone(clu));
      });
    });
  };
  /**
   * Start a stopped process by ID
   * @method startProcessId
   * @param {} id
   * @param {} cb
   * @return CallExpression
   */


  God.startProcessId = function (id, cb) {
    if (!(id in God.clusters_db)) return cb(God.logAndGenerateError(id + ' id unknown'), {});
    var proc = God.clusters_db[id];
    if (proc.pm2_env.status == _constants["default"].ONLINE_STATUS) return cb(God.logAndGenerateError('process already online'), {});
    if (proc.pm2_env.status == _constants["default"].LAUNCHING_STATUS) return cb(God.logAndGenerateError('process already started'), {});
    if (proc.process && proc.process.pid) return cb(God.logAndGenerateError('Process with pid ' + proc.process.pid + ' already exists'), {});
    return God.executeApp(God.clusters_db[id].pm2_env, function (err, proc) {
      return cb(err, _Utility["default"].clone(proc));
    });
  };
  /**
   * Stop a process and set it on state 'stopped'
   * @method stopProcessId
   * @param {} id
   * @param {} cb
   * @return Literal
   */


  God.stopProcessId = function (id, cb) {
    if (_typeof(id) == 'object' && 'id' in id) id = id.id;
    if (!(id in God.clusters_db)) return cb(God.logAndGenerateError(id + ' : id unknown'), {});
    var proc = God.clusters_db[id]; //clear time-out restart task

    clearTimeout(proc.pm2_env.restart_task);

    if (proc.pm2_env.status == _constants["default"].STOPPED_STATUS) {
      proc.process.pid = 0;
      return cb(null, God.getFormatedProcess(id));
    } // state == 'none' means that the process is not online yet


    if (proc.state && proc.state === 'none') return setTimeout(function () {
      God.stopProcessId(id, cb);
    }, 250);
    console.log('Stopping app:%s id:%s', proc.pm2_env.name, proc.pm2_env.pm_id);
    proc.pm2_env.status = _constants["default"].STOPPING_STATUS;

    if (!proc.process.pid) {
      console.error('app=%s id=%d does not have a pid', proc.pm2_env.name, proc.pm2_env.pm_id);
      proc.pm2_env.status = _constants["default"].STOPPED_STATUS;
      return cb(null, {
        error: true,
        message: 'could not kill process w/o pid'
      });
    }

    God.killProcess(proc.process.pid, proc.pm2_env, function (err) {
      proc.pm2_env.status = _constants["default"].STOPPED_STATUS;
      God.notify('exit', proc);

      if (err && err.type && err.type === 'timeout') {
        console.error('app=%s id=%d pid=%s could not be stopped', proc.pm2_env.name, proc.pm2_env.pm_id, proc.process.pid);
        proc.pm2_env.status = _constants["default"].ERRORED_STATUS;
        return cb(null, God.getFormatedProcess(id));
      }

      if (proc.pm2_env.pm_id.toString().indexOf('_old_') !== 0) {
        try {
          _fs["default"].unlinkSync(proc.pm2_env.pm_pid_path);
        } catch (e) {}
      }

      if (proc.pm2_env.axm_actions) proc.pm2_env.axm_actions = [];
      if (proc.pm2_env.axm_monitor) proc.pm2_env.axm_monitor = {};
      proc.process.pid = 0;
      return cb(null, God.getFormatedProcess(id));
    });
  };

  God.resetMetaProcessId = function (id, cb) {
    if (!(id in God.clusters_db)) return cb(God.logAndGenerateError(id + ' id unknown'), {});
    if (!God.clusters_db[id] || !God.clusters_db[id].pm2_env) return cb(God.logAndGenerateError('Error when getting proc || proc.pm2_env'), {});
    God.clusters_db[id].pm2_env.created_at = _Utility["default"].getDate();
    God.clusters_db[id].pm2_env.unstable_restarts = 0;
    God.clusters_db[id].pm2_env.restart_time = 0;
    return cb(null, God.getFormatedProcesses());
  };
  /**
   * Delete a process by id
   * It will stop it and remove it from the database
   * @method deleteProcessId
   * @param {} id
   * @param {} cb
   * @return Literal
   */


  God.deleteProcessId = function (id, cb) {
    God.deleteCron(id);
    God.stopProcessId(id, function (err, proc) {
      if (err) return cb(God.logAndGenerateError(err), {}); // ! transform to slow object

      delete God.clusters_db[id];
      if (Object.keys(God.clusters_db).length == 0) God.next_id = 0;
      return cb(null, proc);
    });
    return false;
  };
  /**
   * Restart a process ID
   * If the process is online it will not put it on state stopped
   * but directly kill it and let God restart it
   * @method restartProcessId
   * @param {} id
   * @param {} cb
   * @return Literal
   */


  God.restartProcessId = function (opts, cb) {
    var id = opts.id;
    var env = opts.env || {};
    if (typeof id === 'undefined') return cb(God.logAndGenerateError('opts.id not passed to restartProcessId', opts));
    if (!(id in God.clusters_db)) return cb(God.logAndGenerateError('God db process id unknown'), {});
    var proc = God.clusters_db[id];
    God.resetState(proc.pm2_env);
    /**
     * Merge new application configuration on restart
     * Same system in reloadProcessId and softReloadProcessId
     */

    _Utility["default"].extend(proc.pm2_env.env, env);

    _Utility["default"].extendExtraConfig(proc, opts);

    if (God.pm2_being_killed) {
      return cb(God.logAndGenerateError('[RestartProcessId] PM2 is being killed, stopping restart procedure...'));
    }

    if (proc.pm2_env.status === _constants["default"].ONLINE_STATUS || proc.pm2_env.status === _constants["default"].LAUNCHING_STATUS) {
      God.stopProcessId(id, function (err) {
        if (God.pm2_being_killed) return cb(God.logAndGenerateError('[RestartProcessId] PM2 is being killed, stopping restart procedure...'));
        proc.pm2_env.restart_time += 1;
        return God.startProcessId(id, cb);
      });
      return false;
    } else {
      debug('[restart] process not online, starting it');
      return God.startProcessId(id, cb);
    }
  };
  /**
   * Restart all process by name
   * @method restartProcessName
   * @param {} name
   * @param {} cb
   * @return Literal
   */


  God.restartProcessName = function (name, cb) {
    var processes = God.findByName(name);
    if (processes && processes.length === 0) return cb(God.logAndGenerateError('Unknown process'), {});
    (0, _eachLimit["default"])(processes, _constants["default"].CONCURRENT_ACTIONS, function (proc, next) {
      if (God.pm2_being_killed) return next('[Watch] PM2 is being killed, stopping restart procedure...');
      if (proc.pm2_env.status === _constants["default"].ONLINE_STATUS) return God.restartProcessId({
        id: proc.pm2_env.pm_id
      }, next);else if (proc.pm2_env.status !== _constants["default"].STOPPING_STATUS && proc.pm2_env.status !== _constants["default"].LAUNCHING_STATUS) return God.startProcessId(proc.pm2_env.pm_id, next);else return next(_util["default"].format('[Watch] Process name %s is being stopped so I won\'t restart it', name));
    }, function (err) {
      if (err) return cb(God.logAndGenerateError(err));
      return cb(null, God.getFormatedProcesses());
    });
    return false;
  };
  /**
   * Send system signal to process id
   * @method sendSignalToProcessId
   * @param {} opts
   * @param {} cb
   * @return CallExpression
   */


  God.sendSignalToProcessId = function (opts, cb) {
    var id = opts.process_id;
    var signal = opts.signal;
    if (!(id in God.clusters_db)) return cb(God.logAndGenerateError(id + ' id unknown'), {});
    var proc = God.clusters_db[id]; //God.notify('send signal ' + signal, proc, true);

    try {
      process.kill(God.clusters_db[id].process.pid, signal);
    } catch (e) {
      return cb(God.logAndGenerateError('Error when sending signal (signal unknown)'), {});
    }

    return cb(null, God.getFormatedProcesses());
  };
  /**
   * Send system signal to all processes by name
   * @method sendSignalToProcessName
   * @param {} opts
   * @param {} cb
   * @return
   */


  God.sendSignalToProcessName = function (opts, cb) {
    var processes = God.findByName(opts.process_name);
    var signal = opts.signal;
    if (processes && processes.length === 0) return cb(God.logAndGenerateError('Unknown process name'), {});
    (0, _eachLimit["default"])(processes, _constants["default"].CONCURRENT_ACTIONS, function (proc, next) {
      if (proc.pm2_env.status == _constants["default"].ONLINE_STATUS || proc.pm2_env.status == _constants["default"].LAUNCHING_STATUS) {
        try {
          process.kill(proc.process.pid, signal);
        } catch (e) {
          return next(e);
        }
      }

      return setTimeout(next, 200);
    }, function (err) {
      if (err) return cb(God.logAndGenerateError(err), {});
      return cb(null, God.getFormatedProcesses());
    });
  };
  /**
   * Stop watching daemon
   * @method stopWatch
   * @param {} method
   * @param {} value
   * @param {} fn
   * @return
   */


  God.stopWatch = function (method, value, fn) {
    var env = null;

    if (method == 'stopAll' || method == 'deleteAll') {
      var processes = God.getFormatedProcesses();
      processes.forEach(function (proc) {
        God.clusters_db[proc.pm_id].pm2_env.watch = false;
        God.watch.disable(proc.pm2_env);
      });
    } else {
      if (method.indexOf('ProcessId') !== -1) {
        env = God.clusters_db[value];
      } else if (method.indexOf('ProcessName') !== -1) {
        env = God.clusters_db[God.findByName(value)];
      }

      if (env) {
        God.watch.disable(env.pm2_env);
        env.pm2_env.watch = false;
      }
    }

    return fn(null, {
      success: true
    });
  };
  /**
   * Toggle watching daemon
   * @method toggleWatch
   * @param {String} method
   * @param {Object} application environment, should include id
   * @param {Function} callback
   */


  God.toggleWatch = function (method, value, fn) {
    var env = null;

    if (method == 'restartProcessId') {
      env = God.clusters_db[value.id];
    } else if (method == 'restartProcessName') {
      env = God.clusters_db[God.findByName(value)];
    }

    if (env) {
      env.pm2_env.watch = !env.pm2_env.watch;
      if (env.pm2_env.watch) God.watch.enable(env.pm2_env);else God.watch.disable(env.pm2_env);
    }

    return fn(null, {
      success: true
    });
  };
  /**
   * Start Watch
   * @method startWatch
   * @param {String} method
   * @param {Object} application environment, should include id
   * @param {Function} callback
   */


  God.startWatch = function (method, value, fn) {
    var env = null;

    if (method == 'restartProcessId') {
      env = God.clusters_db[value.id];
    } else if (method == 'restartProcessName') {
      env = God.clusters_db[God.findByName(value)];
    }

    if (env) {
      if (env.pm2_env.watch) return fn(null, {
        success: true,
        notrestarted: true
      });
      God.watch.enable(env.pm2_env); //env.pm2_env.env.watch = true;

      env.pm2_env.watch = true;
    }

    return fn(null, {
      success: true
    });
  };
  /**
   * Description
   * @method reloadLogs
   * @param {} opts
   * @param {} cb
   * @return CallExpression
   */


  God.reloadLogs = function (opts, cb) {
    console.log('Reloading logs...');
    var processIds = Object.keys(God.clusters_db);
    processIds.forEach(function (id) {
      var cluster = God.clusters_db[id];
      console.log('Reloading logs for process id %d', id);

      if (cluster && cluster.pm2_env) {
        // Cluster mode
        if (cluster.send && cluster.pm2_env.exec_mode == 'cluster_mode') {
          try {
            cluster.send({
              type: 'log:reload'
            });
          } catch (e) {
            console.error(e.message || e);
          }
        } // Fork mode
        else if (cluster._reloadLogs) {
            cluster._reloadLogs(function (err) {
              if (err) God.logAndGenerateError(err);
            });
          }
      }
    });
    return cb(null, {});
  };
  /**
   * Send Line To Stdin
   * @method sendLineToStdin
   * @param Object packet
   * @param String pm_id Process ID
   * @param String line  Line to send to process stdin
   */


  God.sendLineToStdin = function (packet, cb) {
    if (typeof packet.pm_id == 'undefined' || !packet.line) return cb(God.logAndGenerateError('pm_id or line field missing'), {});
    var pm_id = packet.pm_id;
    var line = packet.line;
    var proc = God.clusters_db[pm_id];
    if (!proc) return cb(God.logAndGenerateError('Process with ID <' + pm_id + '> unknown.'), {});
    if (proc.pm2_env.exec_mode == 'cluster_mode') return cb(God.logAndGenerateError('Cannot send line to processes in cluster mode'), {});
    if (proc.pm2_env.status != _constants["default"].ONLINE_STATUS && proc.pm2_env.status != _constants["default"].LAUNCHING_STATUS) return cb(God.logAndGenerateError('Process with ID <' + pm_id + '> offline.'), {});

    try {
      proc.stdin.write(line, function () {
        return cb(null, {
          pm_id: pm_id,
          line: line
        });
      });
    } catch (e) {
      return cb(God.logAndGenerateError(e), {});
    }
  };
  /**
   * @param {object} packet
   * @param {function} cb
   */


  God.sendDataToProcessId = function (packet, cb) {
    if (typeof packet.id == 'undefined' || typeof packet.data == 'undefined' || !packet.topic) return cb(God.logAndGenerateError('ID, DATA or TOPIC field is missing'), {});
    var pm_id = packet.id;
    var data = packet.data;
    var proc = God.clusters_db[pm_id];
    if (!proc) return cb(God.logAndGenerateError('Process with ID <' + pm_id + '> unknown.'), {});
    if (proc.pm2_env.status != _constants["default"].ONLINE_STATUS && proc.pm2_env.status != _constants["default"].LAUNCHING_STATUS) return cb(God.logAndGenerateError('Process with ID <' + pm_id + '> offline.'), {});

    try {
      proc.send(packet);
    } catch (e) {
      return cb(God.logAndGenerateError(e), {});
    }

    return cb(null, {
      success: true,
      data: packet
    });
  };
  /**
   * Send Message to Process by id or name
   * @method msgProcess
   * @param {} cmd
   * @param {} cb
   * @return Literal
   */


  God.msgProcess = function (cmd, cb) {
    if ('id' in cmd) {
      var id = cmd.id;
      if (!(id in God.clusters_db)) return cb(God.logAndGenerateError(id + ' id unknown'), {});
      var proc = God.clusters_db[id];
      var action_exist = false;
      proc.pm2_env.axm_actions.forEach(function (action) {
        if (action.action_name == cmd.msg) {
          action_exist = true; // Reset output buffer

          action.output = [];
        }
      });

      if (action_exist == false) {
        return cb(God.logAndGenerateError('Action doesn\'t exist ' + cmd.msg + ' for ' + proc.pm2_env.name), {});
      }

      if (proc.pm2_env.status == _constants["default"].ONLINE_STATUS || proc.pm2_env.status == _constants["default"].LAUNCHING_STATUS) {
        /*
         * Send message
         */
        if (cmd.opts == null && !cmd.uuid) proc.send(cmd.msg);else proc.send(cmd);
        return cb(null, {
          process_count: 1,
          success: true
        });
      } else return cb(God.logAndGenerateError(id + ' : id offline'), {});
    } else if ('name' in cmd) {
      /*
       * As names are not unique in case of cluster, this
       * will send msg to all process matching  'name'
       */
      var name = cmd.name;
      var arr = Object.keys(God.clusters_db);
      var sent = 0;

      (function ex(arr) {
        if (arr[0] == null || !arr) {
          return cb(null, {
            process_count: sent,
            success: true
          });
        }

        var id = arr[0];

        if (!God.clusters_db[id] || !God.clusters_db[id].pm2_env) {
          arr.shift();
          return ex(arr);
        }

        var proc_env = God.clusters_db[id].pm2_env;
        var isActionAvailable = proc_env.axm_actions.find(function (action) {
          return action.action_name === cmd.msg;
        }) !== undefined; // if action doesn't exist for this app
        // try with the next one

        if (isActionAvailable === false) {
          arr.shift();
          return ex(arr);
        }

        if ((p.basename(proc_env.pm_exec_path) == name || proc_env.name == name || proc_env.namespace == name || name == 'all') && (proc_env.status == _constants["default"].ONLINE_STATUS || proc_env.status == _constants["default"].LAUNCHING_STATUS)) {
          proc_env.axm_actions.forEach(function (action) {
            if (action.action_name == cmd.msg) {
              action_exist = true;
            }
          });

          if (action_exist == false || proc_env.axm_actions.length == 0) {
            arr.shift();
            return ex(arr);
          }

          if (cmd.opts == null) God.clusters_db[id].send(cmd.msg);else God.clusters_db[id].send(cmd);
          sent++;
          arr.shift();
          return ex(arr);
        } else {
          arr.shift();
          return ex(arr);
        }

        return false;
      })(arr);
    } else return cb(God.logAndGenerateError('method requires name or id field'), {});

    return false;
  };
  /**
   * Description
   * @method getVersion
   * @param {} env
   * @param {} cb
   * @return CallExpression
   */


  God.getVersion = function (env, cb) {
    process.nextTick(function () {
      return cb(null, _package["default"].version);
    });
  };

  God.monitor = function Monitor(pm_id, cb) {
    if (!God.clusters_db[pm_id] || !God.clusters_db[pm_id].pm2_env) return cb(new Error('Unknown pm_id'));
    God.clusters_db[pm_id].pm2_env._km_monitored = true;
    return cb(null, {
      success: true,
      pm_id: pm_id
    });
  };

  God.unmonitor = function Monitor(pm_id, cb) {
    if (!God.clusters_db[pm_id] || !God.clusters_db[pm_id].pm2_env) return cb(new Error('Unknown pm_id'));
    God.clusters_db[pm_id].pm2_env._km_monitored = false;
    return cb(null, {
      success: true,
      pm_id: pm_id
    });
  };

  God.getReport = function (arg, cb) {
    var report = {
      pm2_version: _package["default"].version,
      node_version: 'N/A',
      node_path: process.env['_'] || 'not found',
      argv0: process.argv0,
      argv: process.argv,
      user: process.env.USER,
      uid: _constants["default"].IS_WINDOWS === false && process.geteuid ? process.geteuid() : 'N/A',
      gid: _constants["default"].IS_WINDOWS === false && process.getegid ? process.getegid() : 'N/A',
      env: process.env,
      managed_apps: Object.keys(God.clusters_db).length,
      started_at: God.started_at
    };

    if (process.versions && process.versions.node) {
      report.node_version = process.versions.node;
    }

    process.nextTick(function () {
      return cb(null, report);
    });
  };
}

;

function filterBadProcess(pro) {
  if (pro.pm2_env.status !== _constants["default"].ONLINE_STATUS) {
    return false;
  }

  if (pro.pm2_env.axm_options && pro.pm2_env.axm_options.pid) {
    if (isNaN(pro.pm2_env.axm_options.pid)) {
      return false;
    }
  }

  return true;
}

function getProcessId(pro) {
  var pid = pro.pid;

  if (pro.pm2_env.axm_options && pro.pm2_env.axm_options.pid) {
    pid = pro.pm2_env.axm_options.pid;
  }

  return pid;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Hb2QvQWN0aW9uTWV0aG9kcy50cyJdLCJuYW1lcyI6WyJkZWJ1ZyIsInAiLCJwYXRoIiwiR29kIiwiZ2V0TW9uaXRvckRhdGEiLCJlbnYiLCJjYiIsInByb2Nlc3NlcyIsImdldEZvcm1hdGVkUHJvY2Vzc2VzIiwicGlkcyIsImZpbHRlciIsImZpbHRlckJhZFByb2Nlc3MiLCJtYXAiLCJwcm8iLCJpIiwicGlkIiwiZ2V0UHJvY2Vzc0lkIiwibGVuZ3RoIiwibWVtb3J5IiwiY3B1IiwicmV0UGlkVXNhZ2UiLCJlcnIiLCJzdGF0aXN0aWNzIiwiY29uc29sZSIsImVycm9yIiwic3RhdCIsIk1hdGgiLCJyb3VuZCIsImdldFN5c3RlbURhdGEiLCJzeXN0ZW1faW5mb3NfcHJvYyIsInF1ZXJ5IiwiZGF0YSIsIkVycm9yIiwiZHVtcFByb2Nlc3NMaXN0IiwicHJvY2Vzc19saXN0IiwiYXBwcyIsIlV0aWxpdHkiLCJjbG9uZSIsInRoYXQiLCJzdWNjZXNzIiwiZmluIiwiZnMiLCJleGlzdHNTeW5jIiwiY3N0IiwiRFVNUF9GSUxFX1BBVEgiLCJjbGVhckR1bXAiLCJ3cml0ZUZpbGVTeW5jIiwiRFVNUF9CQUNLVVBfRklMRV9QQVRIIiwicmVhZEZpbGVTeW5jIiwiZSIsInN0YWNrIiwiSlNPTiIsInN0cmluZ2lmeSIsInVubGlua1N5bmMiLCJzYXZlUHJvYyIsInBtMl9lbnYiLCJpbnN0YW5jZXMiLCJwbV9pZCIsInBteF9tb2R1bGUiLCJwdXNoIiwic2hpZnQiLCJwaW5nIiwibXNnIiwibm90aWZ5S2lsbFBNMiIsInBtMl9iZWluZ19raWxsZWQiLCJkdXBsaWNhdGVQcm9jZXNzSWQiLCJpZCIsImNsdXN0ZXJzX2RiIiwibG9nQW5kR2VuZXJhdGVFcnJvciIsInByb2MiLCJjcmVhdGVkX2F0IiwidW5pcXVlX2lkIiwiZ2VuZXJhdGVVVUlEIiwiaW5qZWN0VmFyaWFibGVzIiwiaW5qZWN0IiwiX2VyciIsImV4ZWN1dGVBcHAiLCJjbHUiLCJub3RpZnkiLCJzdGFydFByb2Nlc3NJZCIsInN0YXR1cyIsIk9OTElORV9TVEFUVVMiLCJMQVVOQ0hJTkdfU1RBVFVTIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzSWQiLCJjbGVhclRpbWVvdXQiLCJyZXN0YXJ0X3Rhc2siLCJTVE9QUEVEX1NUQVRVUyIsImdldEZvcm1hdGVkUHJvY2VzcyIsInN0YXRlIiwic2V0VGltZW91dCIsImxvZyIsIm5hbWUiLCJTVE9QUElOR19TVEFUVVMiLCJtZXNzYWdlIiwia2lsbFByb2Nlc3MiLCJ0eXBlIiwiRVJST1JFRF9TVEFUVVMiLCJ0b1N0cmluZyIsImluZGV4T2YiLCJwbV9waWRfcGF0aCIsImF4bV9hY3Rpb25zIiwiYXhtX21vbml0b3IiLCJyZXNldE1ldGFQcm9jZXNzSWQiLCJnZXREYXRlIiwidW5zdGFibGVfcmVzdGFydHMiLCJyZXN0YXJ0X3RpbWUiLCJkZWxldGVQcm9jZXNzSWQiLCJkZWxldGVDcm9uIiwiT2JqZWN0Iiwia2V5cyIsIm5leHRfaWQiLCJyZXN0YXJ0UHJvY2Vzc0lkIiwib3B0cyIsInJlc2V0U3RhdGUiLCJleHRlbmQiLCJleHRlbmRFeHRyYUNvbmZpZyIsInJlc3RhcnRQcm9jZXNzTmFtZSIsImZpbmRCeU5hbWUiLCJDT05DVVJSRU5UX0FDVElPTlMiLCJuZXh0IiwidXRpbCIsImZvcm1hdCIsInNlbmRTaWduYWxUb1Byb2Nlc3NJZCIsInByb2Nlc3NfaWQiLCJzaWduYWwiLCJraWxsIiwic2VuZFNpZ25hbFRvUHJvY2Vzc05hbWUiLCJwcm9jZXNzX25hbWUiLCJzdG9wV2F0Y2giLCJtZXRob2QiLCJ2YWx1ZSIsImZuIiwiZm9yRWFjaCIsIndhdGNoIiwiZGlzYWJsZSIsInRvZ2dsZVdhdGNoIiwiZW5hYmxlIiwic3RhcnRXYXRjaCIsIm5vdHJlc3RhcnRlZCIsInJlbG9hZExvZ3MiLCJwcm9jZXNzSWRzIiwiY2x1c3RlciIsInNlbmQiLCJleGVjX21vZGUiLCJfcmVsb2FkTG9ncyIsInNlbmRMaW5lVG9TdGRpbiIsInBhY2tldCIsImxpbmUiLCJzdGRpbiIsIndyaXRlIiwic2VuZERhdGFUb1Byb2Nlc3NJZCIsInRvcGljIiwibXNnUHJvY2VzcyIsImNtZCIsImFjdGlvbl9leGlzdCIsImFjdGlvbiIsImFjdGlvbl9uYW1lIiwib3V0cHV0IiwidXVpZCIsInByb2Nlc3NfY291bnQiLCJhcnIiLCJzZW50IiwiZXgiLCJwcm9jX2VudiIsImlzQWN0aW9uQXZhaWxhYmxlIiwiZmluZCIsInVuZGVmaW5lZCIsImJhc2VuYW1lIiwicG1fZXhlY19wYXRoIiwibmFtZXNwYWNlIiwiZ2V0VmVyc2lvbiIsIm5leHRUaWNrIiwicGtnIiwidmVyc2lvbiIsIm1vbml0b3IiLCJNb25pdG9yIiwiX2ttX21vbml0b3JlZCIsInVubW9uaXRvciIsImdldFJlcG9ydCIsImFyZyIsInJlcG9ydCIsInBtMl92ZXJzaW9uIiwibm9kZV92ZXJzaW9uIiwibm9kZV9wYXRoIiwiYXJndjAiLCJhcmd2IiwidXNlciIsIlVTRVIiLCJ1aWQiLCJJU19XSU5ET1dTIiwiZ2V0ZXVpZCIsImdpZCIsImdldGVnaWQiLCJtYW5hZ2VkX2FwcHMiLCJzdGFydGVkX2F0IiwidmVyc2lvbnMiLCJub2RlIiwiYXhtX29wdGlvbnMiLCJpc05hTiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FBS0E7QUFFQTs7Ozs7Ozs7Ozs7QUFNQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FBRUEsSUFBTUEsS0FBSyxHQUFHLHVCQUFZLGtCQUFaLENBQWQ7QUFDQSxJQUFNQyxDQUFDLEdBQUdDLGdCQUFWO0FBRUE7Ozs7Ozs7QUFNZSxrQkFBVUMsR0FBVixFQUFlO0FBQzVCOzs7Ozs7O0FBT0FBLEVBQUFBLEdBQUcsQ0FBQ0MsY0FBSixHQUFxQixTQUFTQSxjQUFULENBQXdCQyxHQUF4QixFQUE2QkMsRUFBN0IsRUFBaUM7QUFDcEQsUUFBSUMsU0FBUyxHQUFHSixHQUFHLENBQUNLLG9CQUFKLEVBQWhCO0FBQ0EsUUFBSUMsSUFBSSxHQUFHRixTQUFT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QUFPK0ssTUFBUCxDQUFUO0FBQ0QsS0FGRDtBQUdELEdBdEJEO0FBdUJEOztBQUFBOztBQUVELFNBQVMxSyxnQkFBVCxDQUEwQkUsR0FBMUIsRUFBK0I7QUFDN0IsTUFBSUEsR0FBRyxDQUFDMEMsT0FBSixDQUFZeUIsTUFBWixLQUF1QnJDLHNCQUFJc0MsYUFBL0IsRUFBOEM7QUFDNUMsV0FBTyxLQUFQO0FBQ0Q7O0FBRUQsTUFBSXBFLEdBQUcsQ0FBQzBDLE9BQUosQ0FBWStJLFdBQVosSUFBMkJ6TCxHQUFHLENBQUMwQyxPQUFKLENBQVkrSSxXQUFaLENBQXdCdkwsR0FBdkQsRUFBNEQ7QUFDMUQsUUFBSXdMLEtBQUssQ0FBQzFMLEdBQUcsQ0FBQzBDLE9BQUosQ0FBWStJLFdBQVosQ0FBd0J2TCxHQUF6QixDQUFULEVBQXdDO0FBQ3RDLGFBQU8sS0FBUDtBQUNEO0FBQ0Y7O0FBRUQsU0FBTyxJQUFQO0FBQ0Q7O0FBRUQsU0FBU0MsWUFBVCxDQUFzQkgsR0FBdEIsRUFBMkI7QUFDekIsTUFBSUUsR0FBRyxHQUFHRixHQUFHLENBQUNFLEdBQWQ7O0FBRUEsTUFBSUYsR0FBRyxDQUFDMEMsT0FBSixDQUFZK0ksV0FBWixJQUEyQnpMLEdBQUcsQ0FBQzBDLE9BQUosQ0FBWStJLFdBQVosQ0FBd0J2TCxHQUF2RCxFQUE0RDtBQUMxREEsSUFBQUEsR0FBRyxHQUFHRixHQUFHLENBQUMwQyxPQUFKLENBQVkrSSxXQUFaLENBQXdCdkwsR0FBOUI7QUFDRDs7QUFFRCxTQUFPQSxHQUFQO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQGZpbGUgQWN0aW9uTWV0aG9kIGxpa2UgcmVzdGFydCwgc3RvcCwgbW9uaXRvci4uLiBhcmUgaGVyZVxuICogQGF1dGhvciBBbGV4YW5kcmUgU3RyemVsZXdpY3ogPGFzQHVuaXRlY2guaW8+XG4gKiBAcHJvamVjdCBQTTJcbiAqL1xuXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZWFjaExpbWl0IGZyb20gJ2FzeW5jL2VhY2hMaW1pdCc7XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IHBrZyBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nO1xuaW1wb3J0IHBpZHVzYWdlIGZyb20gJ3BpZHVzYWdlJztcbmltcG9ydCB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0IGRlYnVnTG9nZ2VyIGZyb20gJ2RlYnVnJztcbmltcG9ydCBVdGlsaXR5IGZyb20gJy4uL1V0aWxpdHknO1xuXG5jb25zdCBkZWJ1ZyA9IGRlYnVnTG9nZ2VyKCdwbTI6QWN0aW9uTWV0aG9kJyk7XG5jb25zdCBwID0gcGF0aDtcblxuLyoqXG4gKiBEZXNjcmlwdGlvblxuICogQG1ldGhvZCBleHBvcnRzXG4gKiBAcGFyYW0ge30gR29kXG4gKiBAcmV0dXJuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChHb2QpIHtcbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uXG4gICAqIEBtZXRob2QgZ2V0TW9uaXRvckRhdGFcbiAgICogQHBhcmFtIHt9IGVudlxuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVyblxuICAgKi9cbiAgR29kLmdldE1vbml0b3JEYXRhID0gZnVuY3Rpb24gZ2V0TW9uaXRvckRhdGEoZW52LCBjYikge1xuICAgIHZhciBwcm9jZXNzZXMgPSBHb2QuZ2V0Rm9ybWF0ZWRQcm9jZXNzZXMoKTtcbiAgICB2YXIgcGlkcyA9IHByb2Nlc3Nlcy5maWx0ZXIoZmlsdGVyQmFkUHJvY2VzcylcbiAgICAgIC5tYXAoZnVuY3Rpb24gKHBybywgaSkge1xuICAgICAgICB2YXIgcGlkID0gZ2V0UHJvY2Vzc0lkKHBybylcbiAgICAgICAgcmV0dXJuIHBpZDtcbiAgICAgIH0pXG5cbiAgICAvLyBObyBwaWRzLCByZXR1cm4gZW1wdHkgc3RhdGlzdGljc1xuICAgIGlmIChwaWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGNiKG51bGwsIHByb2Nlc3Nlcy5tYXAoZnVuY3Rpb24gKHBybykge1xuICAgICAgICBwcm9bJ21vbml0J10gPSB7XG4gICAgICAgICAgbWVtb3J5OiAwLFxuICAgICAgICAgIGNwdTogMFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBwcm9cbiAgICAgIH0pKVxuICAgIH1cblxuICAgIHBpZHVzYWdlKHBpZHMsIGZ1bmN0aW9uIHJldFBpZFVzYWdlKGVyciwgc3RhdGlzdGljcykge1xuICAgICAgLy8gSnVzdCBsb2csIHdlJ2xsIHNldCBlbXB0eSBzdGF0aXN0aWNzXG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNhdWdodCB3aGlsZSBjYWxsaW5nIHBpZHVzYWdlJyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcblxuICAgICAgICByZXR1cm4gY2IobnVsbCwgcHJvY2Vzc2VzLm1hcChmdW5jdGlvbiAocHJvKSB7XG4gICAgICAgICAgcHJvWydtb25pdCddID0ge1xuICAgICAgICAgICAgbWVtb3J5OiAwLFxuICAgICAgICAgICAgY3B1OiAwXG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gcHJvXG4gICAgICAgIH0pKVxuICAgICAgfVxuXG4gICAgICBpZiAoIXN0YXRpc3RpY3MpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignU3RhdGlzdGljcyBpcyBub3QgZGVmaW5lZCEnKVxuXG4gICAgICAgIHJldHVybiBjYihudWxsLCBwcm9jZXNzZXMubWFwKGZ1bmN0aW9uIChwcm8pIHtcbiAgICAgICAgICBwcm9bJ21vbml0J10gPSB7XG4gICAgICAgICAgICBtZW1vcnk6IDAsXG4gICAgICAgICAgICBjcHU6IDBcbiAgICAgICAgICB9O1xuICAgICAgICAgIHJldHVybiBwcm9cbiAgICAgICAgfSkpXG4gICAgICB9XG5cbiAgICAgIHByb2Nlc3NlcyA9IHByb2Nlc3Nlcy5tYXAoZnVuY3Rpb24gKHBybykge1xuICAgICAgICBpZiAoZmlsdGVyQmFkUHJvY2Vzcyhwcm8pID09PSBmYWxzZSkge1xuICAgICAgICAgIHByb1snbW9uaXQnXSA9IHtcbiAgICAgICAgICAgIG1lbW9yeTogMCxcbiAgICAgICAgICAgIGNwdTogMFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICByZXR1cm4gcHJvO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBpZCA9IGdldFByb2Nlc3NJZChwcm8pO1xuICAgICAgICB2YXIgc3RhdCA9IHN0YXRpc3RpY3NbcGlkXTtcblxuICAgICAgICBpZiAoIXN0YXQpIHtcbiAgICAgICAgICBwcm9bJ21vbml0J10gPSB7XG4gICAgICAgICAgICBtZW1vcnk6IDAsXG4gICAgICAgICAgICBjcHU6IDBcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgcmV0dXJuIHBybztcbiAgICAgICAgfVxuXG4gICAgICAgIHByb1snbW9uaXQnXSA9IHtcbiAgICAgICAgICBtZW1vcnk6IHN0YXQubWVtb3J5LFxuICAgICAgICAgIGNwdTogTWF0aC5yb3VuZChzdGF0LmNwdSAqIDEwKSAvIDEwXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHBybztcbiAgICAgIH0pO1xuXG4gICAgICBjYihudWxsLCBwcm9jZXNzZXMpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIGdldFN5c3RlbURhdGFcbiAgICogQHBhcmFtIHt9IGVudlxuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVyblxuICAgKi9cbiAgR29kLmdldFN5c3RlbURhdGEgPSBmdW5jdGlvbiBnZXRTeXN0ZW1EYXRhKGVudiwgY2IpIHtcbiAgICBpZiAoR29kLnN5c3RlbV9pbmZvc19wcm9jICE9PSBudWxsKVxuICAgICAgR29kLnN5c3RlbV9pbmZvc19wcm9jLnF1ZXJ5KChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgY2IobnVsbCwgZGF0YSlcbiAgICAgIH0pXG4gICAgZWxzZSB7XG4gICAgICBjYihuZXcgRXJyb3IoJ1N5c2luZm9zIG5vdCBsYXVuY2hlZCwgdHlwZTogcG0yIHN5c21vbml0JykpXG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIGR1bXBQcm9jZXNzTGlzdFxuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVyblxuICAgKi9cbiAgR29kLmR1bXBQcm9jZXNzTGlzdCA9IGZ1bmN0aW9uIChjYikge1xuICAgIHZhciBwcm9jZXNzX2xpc3QgPSBbXTtcbiAgICB2YXIgYXBwcyA9IFV0aWxpdHkuY2xvbmUoR29kLmdldEZvcm1hdGVkUHJvY2Vzc2VzKCkpO1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIC8vIERvbid0IG92ZXJyaWRlIHRoZSBhY3R1YWwgZHVtcCBmaWxlIGlmIHByb2Nlc3MgbGlzdCBpcyBlbXB0eVxuICAgIC8vIHVubGVzcyB1c2VyIGV4cGxpY2l0ZWx5IGRpZCBgcG0yIGR1bXBgLlxuICAgIC8vIFRoaXMgb2Z0ZW4gaGFwcGVucyB3aGVuIFBNMiBjcmFzaGVkLCB3ZSBkb24ndCB3YW50IHRvIG92ZXJyaWRlXG4gICAgLy8gdGhlIGR1bXAgZmlsZSB3aXRoIGFuIGVtcHR5IGxpc3Qgb2YgcHJvY2Vzcy5cbiAgICBpZiAoIWFwcHNbMF0pIHtcbiAgICAgIGRlYnVnKCdbUE0yXSBEaWQgbm90IG92ZXJyaWRlIGR1bXAgZmlsZSBiZWNhdXNlIGxpc3Qgb2YgcHJvY2Vzc2VzIGlzIGVtcHR5Jyk7XG4gICAgICByZXR1cm4gY2IobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBwcm9jZXNzX2xpc3Q6IHByb2Nlc3NfbGlzdCB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaW4oZXJyKSB7XG5cbiAgICAgIC8vIHRyeSB0byBmaXggaXNzdWVzIHdpdGggZW1wdHkgZHVtcCBmaWxlXG4gICAgICAvLyBsaWtlICMzNDg1XG4gICAgICBpZiAocHJvY2Vzc19saXN0Lmxlbmd0aCA9PT0gMCkge1xuXG4gICAgICAgIC8vIGZpeCA6IGlmIG5vIGR1bXAgZmlsZSwgbm8gcHJvY2Vzcywgb25seSBtb2R1bGUgYW5kIGFmdGVyIHBtMiB1cGRhdGVcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGNzdC5EVU1QX0ZJTEVfUEFUSCkgJiYgdHlwZW9mIHRoYXQuY2xlYXJEdW1wID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdGhhdC5jbGVhckR1bXAoZnVuY3Rpb24gKCkgeyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIG5vIHByb2Nlc3MgaW4gbGlzdCBkb24ndCBtb2RpZnkgZHVtcCBmaWxlXG4gICAgICAgIC8vIHByb2Nlc3MgbGlzdCBzaG91bGQgbm90IGJlIGVtcHR5XG4gICAgICAgIHJldHVybiBjYihudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIHByb2Nlc3NfbGlzdDogcHJvY2Vzc19saXN0IH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBCYWNrIHVwIGR1bXAgZmlsZVxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoY3N0LkRVTVBfRklMRV9QQVRIKSkge1xuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoY3N0LkRVTVBfQkFDS1VQX0ZJTEVfUEFUSCwgZnMucmVhZEZpbGVTeW5jKGNzdC5EVU1QX0ZJTEVfUEFUSCkpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICAgIH1cblxuICAgICAgLy8gT3ZlcndyaXRlIGR1bXAgZmlsZSwgZGVsZXRlIGlmIGJyb2tlblxuICAgICAgdHJ5IHtcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhjc3QuRFVNUF9GSUxFX1BBVEgsIEpTT04uc3RyaW5naWZ5KHByb2Nlc3NfbGlzdCkpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gdHJ5IHRvIGJhY2t1cCBmaWxlXG4gICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoY3N0LkRVTVBfQkFDS1VQX0ZJTEVfUEFUSCkpIHtcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoY3N0LkRVTVBfRklMRV9QQVRILCBmcy5yZWFkRmlsZVN5bmMoY3N0LkRVTVBfQkFDS1VQX0ZJTEVfUEFUSCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8vIGRvbid0IGtlZXAgYnJva2VuIGZpbGVcbiAgICAgICAgICBmcy51bmxpbmtTeW5jKGNzdC5EVU1QX0ZJTEVfUEFUSCk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjYihudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIHByb2Nlc3NfbGlzdDogcHJvY2Vzc19saXN0IH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNhdmVQcm9jKGFwcHMpIHtcbiAgICAgIGlmICghYXBwc1swXSlcbiAgICAgICAgcmV0dXJuIGZpbihudWxsKTtcbiAgICAgIGRlbGV0ZSBhcHBzWzBdLnBtMl9lbnYuaW5zdGFuY2VzO1xuICAgICAgZGVsZXRlIGFwcHNbMF0ucG0yX2Vudi5wbV9pZDtcbiAgICAgIC8vIERvIG5vdCBkdW1wIG1vZHVsZXNcbiAgICAgIGlmICghYXBwc1swXS5wbTJfZW52LnBteF9tb2R1bGUpXG4gICAgICAgIHByb2Nlc3NfbGlzdC5wdXNoKGFwcHNbMF0ucG0yX2Vudik7XG4gICAgICBhcHBzLnNoaWZ0KCk7XG4gICAgICByZXR1cm4gc2F2ZVByb2MoYXBwcyk7XG4gICAgfVxuICAgIHNhdmVQcm9jKGFwcHMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIHBpbmdcbiAgICogQHBhcmFtIHt9IGVudlxuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVybiBDYWxsRXhwcmVzc2lvblxuICAgKi9cbiAgR29kLnBpbmcgPSBmdW5jdGlvbiAoZW52LCBjYikge1xuICAgIHJldHVybiBjYihudWxsLCB7IG1zZzogJ3BvbmcnIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIG5vdGlmeUtpbGxQTTJcbiAgICovXG4gIEdvZC5ub3RpZnlLaWxsUE0yID0gZnVuY3Rpb24gKCkge1xuICAgIEdvZC5wbTJfYmVpbmdfa2lsbGVkID0gdHJ1ZTtcbiAgfTtcblxuICAvKipcbiAgICogRHVwbGljYXRlIGEgcHJvY2Vzc1xuICAgKiBAbWV0aG9kIGR1cGxpY2F0ZVByb2Nlc3NJZFxuICAgKiBAcGFyYW0ge30gaWRcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm4gQ2FsbEV4cHJlc3Npb25cbiAgICovXG4gIEdvZC5kdXBsaWNhdGVQcm9jZXNzSWQgPSBmdW5jdGlvbiAoaWQsIGNiKSB7XG4gICAgaWYgKCEoaWQgaW4gR29kLmNsdXN0ZXJzX2RiKSlcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihpZCArICcgaWQgdW5rbm93bicpLCB7fSk7XG5cbiAgICBpZiAoIUdvZC5jbHVzdGVyc19kYltpZF0gfHwgIUdvZC5jbHVzdGVyc19kYltpZF0ucG0yX2VudilcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignRXJyb3Igd2hlbiBnZXR0aW5nIHByb2MgfHwgcHJvYy5wbTJfZW52JyksIHt9KTtcblxuICAgIHZhciBwcm9jID0gVXRpbGl0eS5jbG9uZShHb2QuY2x1c3RlcnNfZGJbaWRdLnBtMl9lbnYpO1xuXG5cbiAgICBkZWxldGUgcHJvYy5jcmVhdGVkX2F0O1xuICAgIGRlbGV0ZSBwcm9jLnBtX2lkO1xuICAgIGRlbGV0ZSBwcm9jLnVuaXF1ZV9pZDtcblxuICAgIC8vIGdlbmVyYXRlIGEgbmV3IHVuaXF1ZSBpZCBmb3IgbmV3IHByb2Nlc3NcbiAgICBwcm9jLnVuaXF1ZV9pZCA9IFV0aWxpdHkuZ2VuZXJhdGVVVUlEKClcblxuICAgIEdvZC5pbmplY3RWYXJpYWJsZXMocHJvYywgZnVuY3Rpb24gaW5qZWN0KF9lcnIsIHByb2MpIHtcbiAgICAgIHJldHVybiBHb2QuZXhlY3V0ZUFwcChVdGlsaXR5LmNsb25lKHByb2MpLCBmdW5jdGlvbiAoZXJyLCBjbHUpIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgIEdvZC5ub3RpZnkoJ3N0YXJ0JywgY2x1LCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIGNiKGVyciwgVXRpbGl0eS5jbG9uZShjbHUpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTdGFydCBhIHN0b3BwZWQgcHJvY2VzcyBieSBJRFxuICAgKiBAbWV0aG9kIHN0YXJ0UHJvY2Vzc0lkXG4gICAqIEBwYXJhbSB7fSBpZFxuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVybiBDYWxsRXhwcmVzc2lvblxuICAgKi9cbiAgR29kLnN0YXJ0UHJvY2Vzc0lkID0gZnVuY3Rpb24gKGlkLCBjYikge1xuICAgIGlmICghKGlkIGluIEdvZC5jbHVzdGVyc19kYikpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoaWQgKyAnIGlkIHVua25vd24nKSwge30pO1xuXG4gICAgdmFyIHByb2MgPSBHb2QuY2x1c3RlcnNfZGJbaWRdO1xuICAgIGlmIChwcm9jLnBtMl9lbnYuc3RhdHVzID09IGNzdC5PTkxJTkVfU1RBVFVTKVxuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKCdwcm9jZXNzIGFscmVhZHkgb25saW5lJyksIHt9KTtcbiAgICBpZiAocHJvYy5wbTJfZW52LnN0YXR1cyA9PSBjc3QuTEFVTkNISU5HX1NUQVRVUylcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcigncHJvY2VzcyBhbHJlYWR5IHN0YXJ0ZWQnKSwge30pO1xuICAgIGlmIChwcm9jLnByb2Nlc3MgJiYgcHJvYy5wcm9jZXNzLnBpZClcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignUHJvY2VzcyB3aXRoIHBpZCAnICsgcHJvYy5wcm9jZXNzLnBpZCArICcgYWxyZWFkeSBleGlzdHMnKSwge30pO1xuXG4gICAgcmV0dXJuIEdvZC5leGVjdXRlQXBwKEdvZC5jbHVzdGVyc19kYltpZF0ucG0yX2VudiwgZnVuY3Rpb24gKGVyciwgcHJvYykge1xuICAgICAgcmV0dXJuIGNiKGVyciwgVXRpbGl0eS5jbG9uZShwcm9jKSk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvKipcbiAgICogU3RvcCBhIHByb2Nlc3MgYW5kIHNldCBpdCBvbiBzdGF0ZSAnc3RvcHBlZCdcbiAgICogQG1ldGhvZCBzdG9wUHJvY2Vzc0lkXG4gICAqIEBwYXJhbSB7fSBpZFxuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVybiBMaXRlcmFsXG4gICAqL1xuICBHb2Quc3RvcFByb2Nlc3NJZCA9IGZ1bmN0aW9uIChpZCwgY2IpIHtcbiAgICBpZiAodHlwZW9mIGlkID09ICdvYmplY3QnICYmICdpZCcgaW4gaWQpXG4gICAgICBpZCA9IGlkLmlkO1xuXG4gICAgaWYgKCEoaWQgaW4gR29kLmNsdXN0ZXJzX2RiKSlcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihpZCArICcgOiBpZCB1bmtub3duJyksIHt9KTtcblxuICAgIHZhciBwcm9jID0gR29kLmNsdXN0ZXJzX2RiW2lkXTtcblxuICAgIC8vY2xlYXIgdGltZS1vdXQgcmVzdGFydCB0YXNrXG4gICAgY2xlYXJUaW1lb3V0KHByb2MucG0yX2Vudi5yZXN0YXJ0X3Rhc2spO1xuXG4gICAgaWYgKHByb2MucG0yX2Vudi5zdGF0dXMgPT0gY3N0LlNUT1BQRURfU1RBVFVTKSB7XG4gICAgICBwcm9jLnByb2Nlc3MucGlkID0gMDtcbiAgICAgIHJldHVybiBjYihudWxsLCBHb2QuZ2V0Rm9ybWF0ZWRQcm9jZXNzKGlkKSk7XG4gICAgfVxuICAgIC8vIHN0YXRlID09ICdub25lJyBtZWFucyB0aGF0IHRoZSBwcm9jZXNzIGlzIG5vdCBvbmxpbmUgeWV0XG4gICAgaWYgKHByb2Muc3RhdGUgJiYgcHJvYy5zdGF0ZSA9PT0gJ25vbmUnKVxuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBHb2Quc3RvcFByb2Nlc3NJZChpZCwgY2IpOyB9LCAyNTApO1xuXG4gICAgY29uc29sZS5sb2coJ1N0b3BwaW5nIGFwcDolcyBpZDolcycsIHByb2MucG0yX2Vudi5uYW1lLCBwcm9jLnBtMl9lbnYucG1faWQpO1xuICAgIHByb2MucG0yX2Vudi5zdGF0dXMgPSBjc3QuU1RPUFBJTkdfU1RBVFVTO1xuXG4gICAgaWYgKCFwcm9jLnByb2Nlc3MucGlkKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdhcHA9JXMgaWQ9JWQgZG9lcyBub3QgaGF2ZSBhIHBpZCcsIHByb2MucG0yX2Vudi5uYW1lLCBwcm9jLnBtMl9lbnYucG1faWQpO1xuICAgICAgcHJvYy5wbTJfZW52LnN0YXR1cyA9IGNzdC5TVE9QUEVEX1NUQVRVUztcbiAgICAgIHJldHVybiBjYihudWxsLCB7IGVycm9yOiB0cnVlLCBtZXNzYWdlOiAnY291bGQgbm90IGtpbGwgcHJvY2VzcyB3L28gcGlkJyB9KTtcbiAgICB9XG5cbiAgICBHb2Qua2lsbFByb2Nlc3MocHJvYy5wcm9jZXNzLnBpZCwgcHJvYy5wbTJfZW52LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBwcm9jLnBtMl9lbnYuc3RhdHVzID0gY3N0LlNUT1BQRURfU1RBVFVTO1xuXG4gICAgICBHb2Qubm90aWZ5KCdleGl0JywgcHJvYyk7XG5cbiAgICAgIGlmIChlcnIgJiYgZXJyLnR5cGUgJiYgZXJyLnR5cGUgPT09ICd0aW1lb3V0Jykge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdhcHA9JXMgaWQ9JWQgcGlkPSVzIGNvdWxkIG5vdCBiZSBzdG9wcGVkJyxcbiAgICAgICAgICBwcm9jLnBtMl9lbnYubmFtZSxcbiAgICAgICAgICBwcm9jLnBtMl9lbnYucG1faWQsXG4gICAgICAgICAgcHJvYy5wcm9jZXNzLnBpZCk7XG4gICAgICAgIHByb2MucG0yX2Vudi5zdGF0dXMgPSBjc3QuRVJST1JFRF9TVEFUVVM7XG4gICAgICAgIHJldHVybiBjYihudWxsLCBHb2QuZ2V0Rm9ybWF0ZWRQcm9jZXNzKGlkKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9jLnBtMl9lbnYucG1faWQudG9TdHJpbmcoKS5pbmRleE9mKCdfb2xkXycpICE9PSAwKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZnMudW5saW5rU3luYyhwcm9jLnBtMl9lbnYucG1fcGlkX3BhdGgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7IH1cbiAgICAgIH1cblxuICAgICAgaWYgKHByb2MucG0yX2Vudi5heG1fYWN0aW9ucykgcHJvYy5wbTJfZW52LmF4bV9hY3Rpb25zID0gW107XG4gICAgICBpZiAocHJvYy5wbTJfZW52LmF4bV9tb25pdG9yKSBwcm9jLnBtMl9lbnYuYXhtX21vbml0b3IgPSB7fTtcblxuICAgICAgcHJvYy5wcm9jZXNzLnBpZCA9IDA7XG4gICAgICByZXR1cm4gY2IobnVsbCwgR29kLmdldEZvcm1hdGVkUHJvY2VzcyhpZCkpO1xuICAgIH0pO1xuICB9O1xuXG4gIEdvZC5yZXNldE1ldGFQcm9jZXNzSWQgPSBmdW5jdGlvbiAoaWQsIGNiKSB7XG4gICAgaWYgKCEoaWQgaW4gR29kLmNsdXN0ZXJzX2RiKSlcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihpZCArICcgaWQgdW5rbm93bicpLCB7fSk7XG5cbiAgICBpZiAoIUdvZC5jbHVzdGVyc19kYltpZF0gfHwgIUdvZC5jbHVzdGVyc19kYltpZF0ucG0yX2VudilcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignRXJyb3Igd2hlbiBnZXR0aW5nIHByb2MgfHwgcHJvYy5wbTJfZW52JyksIHt9KTtcblxuICAgIEdvZC5jbHVzdGVyc19kYltpZF0ucG0yX2Vudi5jcmVhdGVkX2F0ID0gVXRpbGl0eS5nZXREYXRlKCk7XG4gICAgR29kLmNsdXN0ZXJzX2RiW2lkXS5wbTJfZW52LnVuc3RhYmxlX3Jlc3RhcnRzID0gMDtcbiAgICBHb2QuY2x1c3RlcnNfZGJbaWRdLnBtMl9lbnYucmVzdGFydF90aW1lID0gMDtcblxuICAgIHJldHVybiBjYihudWxsLCBHb2QuZ2V0Rm9ybWF0ZWRQcm9jZXNzZXMoKSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIHByb2Nlc3MgYnkgaWRcbiAgICogSXQgd2lsbCBzdG9wIGl0IGFuZCByZW1vdmUgaXQgZnJvbSB0aGUgZGF0YWJhc2VcbiAgICogQG1ldGhvZCBkZWxldGVQcm9jZXNzSWRcbiAgICogQHBhcmFtIHt9IGlkXG4gICAqIEBwYXJhbSB7fSBjYlxuICAgKiBAcmV0dXJuIExpdGVyYWxcbiAgICovXG4gIEdvZC5kZWxldGVQcm9jZXNzSWQgPSBmdW5jdGlvbiAoaWQsIGNiKSB7XG4gICAgR29kLmRlbGV0ZUNyb24oaWQpO1xuXG4gICAgR29kLnN0b3BQcm9jZXNzSWQoaWQsIGZ1bmN0aW9uIChlcnIsIHByb2MpIHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihlcnIpLCB7fSk7XG4gICAgICAvLyAhIHRyYW5zZm9ybSB0byBzbG93IG9iamVjdFxuICAgICAgZGVsZXRlIEdvZC5jbHVzdGVyc19kYltpZF07XG5cbiAgICAgIGlmIChPYmplY3Qua2V5cyhHb2QuY2x1c3RlcnNfZGIpLmxlbmd0aCA9PSAwKVxuICAgICAgICBHb2QubmV4dF9pZCA9IDA7XG4gICAgICByZXR1cm4gY2IobnVsbCwgcHJvYyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXN0YXJ0IGEgcHJvY2VzcyBJRFxuICAgKiBJZiB0aGUgcHJvY2VzcyBpcyBvbmxpbmUgaXQgd2lsbCBub3QgcHV0IGl0IG9uIHN0YXRlIHN0b3BwZWRcbiAgICogYnV0IGRpcmVjdGx5IGtpbGwgaXQgYW5kIGxldCBHb2QgcmVzdGFydCBpdFxuICAgKiBAbWV0aG9kIHJlc3RhcnRQcm9jZXNzSWRcbiAgICogQHBhcmFtIHt9IGlkXG4gICAqIEBwYXJhbSB7fSBjYlxuICAgKiBAcmV0dXJuIExpdGVyYWxcbiAgICovXG4gIEdvZC5yZXN0YXJ0UHJvY2Vzc0lkID0gZnVuY3Rpb24gKG9wdHMsIGNiKSB7XG4gICAgdmFyIGlkID0gb3B0cy5pZDtcbiAgICB2YXIgZW52ID0gb3B0cy5lbnYgfHwge307XG5cbiAgICBpZiAodHlwZW9mIChpZCkgPT09ICd1bmRlZmluZWQnKVxuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKCdvcHRzLmlkIG5vdCBwYXNzZWQgdG8gcmVzdGFydFByb2Nlc3NJZCcsIG9wdHMpKTtcbiAgICBpZiAoIShpZCBpbiBHb2QuY2x1c3RlcnNfZGIpKVxuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKCdHb2QgZGIgcHJvY2VzcyBpZCB1bmtub3duJyksIHt9KTtcblxuICAgIHZhciBwcm9jID0gR29kLmNsdXN0ZXJzX2RiW2lkXTtcblxuICAgIEdvZC5yZXNldFN0YXRlKHByb2MucG0yX2Vudik7XG5cbiAgICAvKipcbiAgICAgKiBNZXJnZSBuZXcgYXBwbGljYXRpb24gY29uZmlndXJhdGlvbiBvbiByZXN0YXJ0XG4gICAgICogU2FtZSBzeXN0ZW0gaW4gcmVsb2FkUHJvY2Vzc0lkIGFuZCBzb2Z0UmVsb2FkUHJvY2Vzc0lkXG4gICAgICovXG4gICAgVXRpbGl0eS5leHRlbmQocHJvYy5wbTJfZW52LmVudiwgZW52KTtcbiAgICBVdGlsaXR5LmV4dGVuZEV4dHJhQ29uZmlnKHByb2MsIG9wdHMpO1xuXG4gICAgaWYgKEdvZC5wbTJfYmVpbmdfa2lsbGVkKSB7XG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ1tSZXN0YXJ0UHJvY2Vzc0lkXSBQTTIgaXMgYmVpbmcga2lsbGVkLCBzdG9wcGluZyByZXN0YXJ0IHByb2NlZHVyZS4uLicpKTtcbiAgICB9XG4gICAgaWYgKHByb2MucG0yX2Vudi5zdGF0dXMgPT09IGNzdC5PTkxJTkVfU1RBVFVTIHx8IHByb2MucG0yX2Vudi5zdGF0dXMgPT09IGNzdC5MQVVOQ0hJTkdfU1RBVFVTKSB7XG4gICAgICBHb2Quc3RvcFByb2Nlc3NJZChpZCwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoR29kLnBtMl9iZWluZ19raWxsZWQpXG4gICAgICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKCdbUmVzdGFydFByb2Nlc3NJZF0gUE0yIGlzIGJlaW5nIGtpbGxlZCwgc3RvcHBpbmcgcmVzdGFydCBwcm9jZWR1cmUuLi4nKSk7XG4gICAgICAgIHByb2MucG0yX2Vudi5yZXN0YXJ0X3RpbWUgKz0gMTtcbiAgICAgICAgcmV0dXJuIEdvZC5zdGFydFByb2Nlc3NJZChpZCwgY2IpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBkZWJ1ZygnW3Jlc3RhcnRdIHByb2Nlc3Mgbm90IG9ubGluZSwgc3RhcnRpbmcgaXQnKTtcbiAgICAgIHJldHVybiBHb2Quc3RhcnRQcm9jZXNzSWQoaWQsIGNiKTtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogUmVzdGFydCBhbGwgcHJvY2VzcyBieSBuYW1lXG4gICAqIEBtZXRob2QgcmVzdGFydFByb2Nlc3NOYW1lXG4gICAqIEBwYXJhbSB7fSBuYW1lXG4gICAqIEBwYXJhbSB7fSBjYlxuICAgKiBAcmV0dXJuIExpdGVyYWxcbiAgICovXG4gIEdvZC5yZXN0YXJ0UHJvY2Vzc05hbWUgPSBmdW5jdGlvbiAobmFtZSwgY2IpIHtcbiAgICB2YXIgcHJvY2Vzc2VzID0gR29kLmZpbmRCeU5hbWUobmFtZSk7XG5cbiAgICBpZiAocHJvY2Vzc2VzICYmIHByb2Nlc3Nlcy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ1Vua25vd24gcHJvY2VzcycpLCB7fSk7XG5cbiAgICBlYWNoTGltaXQocHJvY2Vzc2VzLCBjc3QuQ09OQ1VSUkVOVF9BQ1RJT05TLCBmdW5jdGlvbiAocHJvYywgbmV4dCkge1xuICAgICAgaWYgKEdvZC5wbTJfYmVpbmdfa2lsbGVkKVxuICAgICAgICByZXR1cm4gbmV4dCgnW1dhdGNoXSBQTTIgaXMgYmVpbmcga2lsbGVkLCBzdG9wcGluZyByZXN0YXJ0IHByb2NlZHVyZS4uLicpO1xuICAgICAgaWYgKHByb2MucG0yX2Vudi5zdGF0dXMgPT09IGNzdC5PTkxJTkVfU1RBVFVTKVxuICAgICAgICByZXR1cm4gR29kLnJlc3RhcnRQcm9jZXNzSWQoeyBpZDogcHJvYy5wbTJfZW52LnBtX2lkIH0sIG5leHQpO1xuICAgICAgZWxzZSBpZiAocHJvYy5wbTJfZW52LnN0YXR1cyAhPT0gY3N0LlNUT1BQSU5HX1NUQVRVU1xuICAgICAgICAmJiBwcm9jLnBtMl9lbnYuc3RhdHVzICE9PSBjc3QuTEFVTkNISU5HX1NUQVRVUylcbiAgICAgICAgcmV0dXJuIEdvZC5zdGFydFByb2Nlc3NJZChwcm9jLnBtMl9lbnYucG1faWQsIG5leHQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbmV4dCh1dGlsLmZvcm1hdCgnW1dhdGNoXSBQcm9jZXNzIG5hbWUgJXMgaXMgYmVpbmcgc3RvcHBlZCBzbyBJIHdvblxcJ3QgcmVzdGFydCBpdCcsIG5hbWUpKTtcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoZXJyKSk7XG4gICAgICByZXR1cm4gY2IobnVsbCwgR29kLmdldEZvcm1hdGVkUHJvY2Vzc2VzKCkpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZW5kIHN5c3RlbSBzaWduYWwgdG8gcHJvY2VzcyBpZFxuICAgKiBAbWV0aG9kIHNlbmRTaWduYWxUb1Byb2Nlc3NJZFxuICAgKiBAcGFyYW0ge30gb3B0c1xuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVybiBDYWxsRXhwcmVzc2lvblxuICAgKi9cbiAgR29kLnNlbmRTaWduYWxUb1Byb2Nlc3NJZCA9IGZ1bmN0aW9uIChvcHRzLCBjYikge1xuICAgIHZhciBpZCA9IG9wdHMucHJvY2Vzc19pZDtcbiAgICB2YXIgc2lnbmFsID0gb3B0cy5zaWduYWw7XG5cbiAgICBpZiAoIShpZCBpbiBHb2QuY2x1c3RlcnNfZGIpKVxuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKGlkICsgJyBpZCB1bmtub3duJyksIHt9KTtcblxuICAgIHZhciBwcm9jID0gR29kLmNsdXN0ZXJzX2RiW2lkXTtcblxuICAgIC8vR29kLm5vdGlmeSgnc2VuZCBzaWduYWwgJyArIHNpZ25hbCwgcHJvYywgdHJ1ZSk7XG5cbiAgICB0cnkge1xuICAgICAgcHJvY2Vzcy5raWxsKEdvZC5jbHVzdGVyc19kYltpZF0ucHJvY2Vzcy5waWQsIHNpZ25hbCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKCdFcnJvciB3aGVuIHNlbmRpbmcgc2lnbmFsIChzaWduYWwgdW5rbm93biknKSwge30pO1xuICAgIH1cbiAgICByZXR1cm4gY2IobnVsbCwgR29kLmdldEZvcm1hdGVkUHJvY2Vzc2VzKCkpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZW5kIHN5c3RlbSBzaWduYWwgdG8gYWxsIHByb2Nlc3NlcyBieSBuYW1lXG4gICAqIEBtZXRob2Qgc2VuZFNpZ25hbFRvUHJvY2Vzc05hbWVcbiAgICogQHBhcmFtIHt9IG9wdHNcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm5cbiAgICovXG4gIEdvZC5zZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZSA9IGZ1bmN0aW9uIChvcHRzLCBjYikge1xuICAgIHZhciBwcm9jZXNzZXMgPSBHb2QuZmluZEJ5TmFtZShvcHRzLnByb2Nlc3NfbmFtZSk7XG4gICAgdmFyIHNpZ25hbCA9IG9wdHMuc2lnbmFsO1xuXG4gICAgaWYgKHByb2Nlc3NlcyAmJiBwcm9jZXNzZXMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKCdVbmtub3duIHByb2Nlc3MgbmFtZScpLCB7fSk7XG5cbiAgICBlYWNoTGltaXQocHJvY2Vzc2VzLCBjc3QuQ09OQ1VSUkVOVF9BQ1RJT05TLCBmdW5jdGlvbiAocHJvYywgbmV4dCkge1xuICAgICAgaWYgKHByb2MucG0yX2Vudi5zdGF0dXMgPT0gY3N0Lk9OTElORV9TVEFUVVMgfHwgcHJvYy5wbTJfZW52LnN0YXR1cyA9PSBjc3QuTEFVTkNISU5HX1NUQVRVUykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHByb2Nlc3Mua2lsbChwcm9jLnByb2Nlc3MucGlkLCBzaWduYWwpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQoZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KG5leHQsIDIwMCk7XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKGVyciksIHt9KTtcbiAgICAgIHJldHVybiBjYihudWxsLCBHb2QuZ2V0Rm9ybWF0ZWRQcm9jZXNzZXMoKSk7XG4gICAgfSk7XG5cbiAgfTtcblxuICAvKipcbiAgICogU3RvcCB3YXRjaGluZyBkYWVtb25cbiAgICogQG1ldGhvZCBzdG9wV2F0Y2hcbiAgICogQHBhcmFtIHt9IG1ldGhvZFxuICAgKiBAcGFyYW0ge30gdmFsdWVcbiAgICogQHBhcmFtIHt9IGZuXG4gICAqIEByZXR1cm5cbiAgICovXG4gIEdvZC5zdG9wV2F0Y2ggPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSwgZm4pIHtcbiAgICB2YXIgZW52ID0gbnVsbDtcblxuICAgIGlmIChtZXRob2QgPT0gJ3N0b3BBbGwnIHx8IG1ldGhvZCA9PSAnZGVsZXRlQWxsJykge1xuICAgICAgdmFyIHByb2Nlc3NlcyA9IEdvZC5nZXRGb3JtYXRlZFByb2Nlc3NlcygpO1xuXG4gICAgICBwcm9jZXNzZXMuZm9yRWFjaChmdW5jdGlvbiAocHJvYykge1xuICAgICAgICBHb2QuY2x1c3RlcnNfZGJbcHJvYy5wbV9pZF0ucG0yX2Vudi53YXRjaCA9IGZhbHNlO1xuICAgICAgICBHb2Qud2F0Y2guZGlzYWJsZShwcm9jLnBtMl9lbnYpO1xuICAgICAgfSk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICBpZiAobWV0aG9kLmluZGV4T2YoJ1Byb2Nlc3NJZCcpICE9PSAtMSkge1xuICAgICAgICBlbnYgPSBHb2QuY2x1c3RlcnNfZGJbdmFsdWVdO1xuICAgICAgfSBlbHNlIGlmIChtZXRob2QuaW5kZXhPZignUHJvY2Vzc05hbWUnKSAhPT0gLTEpIHtcbiAgICAgICAgZW52ID0gR29kLmNsdXN0ZXJzX2RiW0dvZC5maW5kQnlOYW1lKHZhbHVlKV07XG4gICAgICB9XG5cbiAgICAgIGlmIChlbnYpIHtcbiAgICAgICAgR29kLndhdGNoLmRpc2FibGUoZW52LnBtMl9lbnYpO1xuICAgICAgICBlbnYucG0yX2Vudi53YXRjaCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZm4obnVsbCwgeyBzdWNjZXNzOiB0cnVlIH0pO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIFRvZ2dsZSB3YXRjaGluZyBkYWVtb25cbiAgICogQG1ldGhvZCB0b2dnbGVXYXRjaFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhcHBsaWNhdGlvbiBlbnZpcm9ubWVudCwgc2hvdWxkIGluY2x1ZGUgaWRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIEdvZC50b2dnbGVXYXRjaCA9IGZ1bmN0aW9uIChtZXRob2QsIHZhbHVlLCBmbikge1xuICAgIHZhciBlbnYgPSBudWxsO1xuXG4gICAgaWYgKG1ldGhvZCA9PSAncmVzdGFydFByb2Nlc3NJZCcpIHtcbiAgICAgIGVudiA9IEdvZC5jbHVzdGVyc19kYlt2YWx1ZS5pZF07XG4gICAgfSBlbHNlIGlmIChtZXRob2QgPT0gJ3Jlc3RhcnRQcm9jZXNzTmFtZScpIHtcbiAgICAgIGVudiA9IEdvZC5jbHVzdGVyc19kYltHb2QuZmluZEJ5TmFtZSh2YWx1ZSldO1xuICAgIH1cblxuICAgIGlmIChlbnYpIHtcbiAgICAgIGVudi5wbTJfZW52LndhdGNoID0gIWVudi5wbTJfZW52LndhdGNoO1xuICAgICAgaWYgKGVudi5wbTJfZW52LndhdGNoKVxuICAgICAgICBHb2Qud2F0Y2guZW5hYmxlKGVudi5wbTJfZW52KTtcbiAgICAgIGVsc2VcbiAgICAgICAgR29kLndhdGNoLmRpc2FibGUoZW52LnBtMl9lbnYpO1xuICAgIH1cblxuICAgIHJldHVybiBmbihudWxsLCB7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFN0YXJ0IFdhdGNoXG4gICAqIEBtZXRob2Qgc3RhcnRXYXRjaFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhcHBsaWNhdGlvbiBlbnZpcm9ubWVudCwgc2hvdWxkIGluY2x1ZGUgaWRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIEdvZC5zdGFydFdhdGNoID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUsIGZuKSB7XG4gICAgdmFyIGVudiA9IG51bGw7XG5cbiAgICBpZiAobWV0aG9kID09ICdyZXN0YXJ0UHJvY2Vzc0lkJykge1xuICAgICAgZW52ID0gR29kLmNsdXN0ZXJzX2RiW3ZhbHVlLmlkXTtcbiAgICB9IGVsc2UgaWYgKG1ldGhvZCA9PSAncmVzdGFydFByb2Nlc3NOYW1lJykge1xuICAgICAgZW52ID0gR29kLmNsdXN0ZXJzX2RiW0dvZC5maW5kQnlOYW1lKHZhbHVlKV07XG4gICAgfVxuXG4gICAgaWYgKGVudikge1xuICAgICAgaWYgKGVudi5wbTJfZW52LndhdGNoKVxuICAgICAgICByZXR1cm4gZm4obnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBub3RyZXN0YXJ0ZWQ6IHRydWUgfSk7XG5cbiAgICAgIEdvZC53YXRjaC5lbmFibGUoZW52LnBtMl9lbnYpO1xuICAgICAgLy9lbnYucG0yX2Vudi5lbnYud2F0Y2ggPSB0cnVlO1xuICAgICAgZW52LnBtMl9lbnYud2F0Y2ggPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmbihudWxsLCB7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uXG4gICAqIEBtZXRob2QgcmVsb2FkTG9nc1xuICAgKiBAcGFyYW0ge30gb3B0c1xuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVybiBDYWxsRXhwcmVzc2lvblxuICAgKi9cbiAgR29kLnJlbG9hZExvZ3MgPSBmdW5jdGlvbiAob3B0cywgY2IpIHtcbiAgICBjb25zb2xlLmxvZygnUmVsb2FkaW5nIGxvZ3MuLi4nKTtcbiAgICB2YXIgcHJvY2Vzc0lkcyA9IE9iamVjdC5rZXlzKEdvZC5jbHVzdGVyc19kYik7XG5cbiAgICBwcm9jZXNzSWRzLmZvckVhY2goZnVuY3Rpb24gKGlkKSB7XG4gICAgICB2YXIgY2x1c3RlciA9IEdvZC5jbHVzdGVyc19kYltpZF07XG5cbiAgICAgIGNvbnNvbGUubG9nKCdSZWxvYWRpbmcgbG9ncyBmb3IgcHJvY2VzcyBpZCAlZCcsIGlkKTtcblxuICAgICAgaWYgKGNsdXN0ZXIgJiYgY2x1c3Rlci5wbTJfZW52KSB7XG4gICAgICAgIC8vIENsdXN0ZXIgbW9kZVxuICAgICAgICBpZiAoY2x1c3Rlci5zZW5kICYmIGNsdXN0ZXIucG0yX2Vudi5leGVjX21vZGUgPT0gJ2NsdXN0ZXJfbW9kZScpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY2x1c3Rlci5zZW5kKHtcbiAgICAgICAgICAgICAgdHlwZTogJ2xvZzpyZWxvYWQnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSB8fCBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gRm9yayBtb2RlXG4gICAgICAgIGVsc2UgaWYgKGNsdXN0ZXIuX3JlbG9hZExvZ3MpIHtcbiAgICAgICAgICBjbHVzdGVyLl9yZWxvYWRMb2dzKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBjYihudWxsLCB7fSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNlbmQgTGluZSBUbyBTdGRpblxuICAgKiBAbWV0aG9kIHNlbmRMaW5lVG9TdGRpblxuICAgKiBAcGFyYW0gT2JqZWN0IHBhY2tldFxuICAgKiBAcGFyYW0gU3RyaW5nIHBtX2lkIFByb2Nlc3MgSURcbiAgICogQHBhcmFtIFN0cmluZyBsaW5lICBMaW5lIHRvIHNlbmQgdG8gcHJvY2VzcyBzdGRpblxuICAgKi9cbiAgR29kLnNlbmRMaW5lVG9TdGRpbiA9IGZ1bmN0aW9uIChwYWNrZXQsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiAocGFja2V0LnBtX2lkKSA9PSAndW5kZWZpbmVkJyB8fCAhcGFja2V0LmxpbmUpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ3BtX2lkIG9yIGxpbmUgZmllbGQgbWlzc2luZycpLCB7fSk7XG5cbiAgICB2YXIgcG1faWQgPSBwYWNrZXQucG1faWQ7XG4gICAgdmFyIGxpbmUgPSBwYWNrZXQubGluZTtcblxuICAgIHZhciBwcm9jID0gR29kLmNsdXN0ZXJzX2RiW3BtX2lkXTtcblxuICAgIGlmICghcHJvYylcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignUHJvY2VzcyB3aXRoIElEIDwnICsgcG1faWQgKyAnPiB1bmtub3duLicpLCB7fSk7XG5cbiAgICBpZiAocHJvYy5wbTJfZW52LmV4ZWNfbW9kZSA9PSAnY2x1c3Rlcl9tb2RlJylcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignQ2Fubm90IHNlbmQgbGluZSB0byBwcm9jZXNzZXMgaW4gY2x1c3RlciBtb2RlJyksIHt9KTtcblxuICAgIGlmIChwcm9jLnBtMl9lbnYuc3RhdHVzICE9IGNzdC5PTkxJTkVfU1RBVFVTICYmIHByb2MucG0yX2Vudi5zdGF0dXMgIT0gY3N0LkxBVU5DSElOR19TVEFUVVMpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ1Byb2Nlc3Mgd2l0aCBJRCA8JyArIHBtX2lkICsgJz4gb2ZmbGluZS4nKSwge30pO1xuXG4gICAgdHJ5IHtcbiAgICAgIHByb2Muc3RkaW4ud3JpdGUobGluZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY2IobnVsbCwge1xuICAgICAgICAgIHBtX2lkOiBwbV9pZCxcbiAgICAgICAgICBsaW5lOiBsaW5lXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKGUpLCB7fSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwYWNrZXRcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2JcbiAgICovXG4gIEdvZC5zZW5kRGF0YVRvUHJvY2Vzc0lkID0gZnVuY3Rpb24gKHBhY2tldCwgY2IpIHtcbiAgICBpZiAodHlwZW9mIChwYWNrZXQuaWQpID09ICd1bmRlZmluZWQnIHx8XG4gICAgICB0eXBlb2YgKHBhY2tldC5kYXRhKSA9PSAndW5kZWZpbmVkJyB8fFxuICAgICAgIXBhY2tldC50b3BpYylcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignSUQsIERBVEEgb3IgVE9QSUMgZmllbGQgaXMgbWlzc2luZycpLCB7fSk7XG5cbiAgICB2YXIgcG1faWQgPSBwYWNrZXQuaWQ7XG4gICAgdmFyIGRhdGEgPSBwYWNrZXQuZGF0YTtcblxuICAgIHZhciBwcm9jID0gR29kLmNsdXN0ZXJzX2RiW3BtX2lkXTtcblxuICAgIGlmICghcHJvYylcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignUHJvY2VzcyB3aXRoIElEIDwnICsgcG1faWQgKyAnPiB1bmtub3duLicpLCB7fSk7XG5cbiAgICBpZiAocHJvYy5wbTJfZW52LnN0YXR1cyAhPSBjc3QuT05MSU5FX1NUQVRVUyAmJiBwcm9jLnBtMl9lbnYuc3RhdHVzICE9IGNzdC5MQVVOQ0hJTkdfU1RBVFVTKVxuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKCdQcm9jZXNzIHdpdGggSUQgPCcgKyBwbV9pZCArICc+IG9mZmxpbmUuJyksIHt9KTtcblxuICAgIHRyeSB7XG4gICAgICBwcm9jLnNlbmQocGFja2V0KTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihlKSwge30pO1xuICAgIH1cblxuICAgIHJldHVybiBjYihudWxsLCB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YTogcGFja2V0XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNlbmQgTWVzc2FnZSB0byBQcm9jZXNzIGJ5IGlkIG9yIG5hbWVcbiAgICogQG1ldGhvZCBtc2dQcm9jZXNzXG4gICAqIEBwYXJhbSB7fSBjbWRcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm4gTGl0ZXJhbFxuICAgKi9cbiAgR29kLm1zZ1Byb2Nlc3MgPSBmdW5jdGlvbiAoY21kLCBjYikge1xuICAgIGlmICgnaWQnIGluIGNtZCkge1xuICAgICAgdmFyIGlkID0gY21kLmlkO1xuICAgICAgaWYgKCEoaWQgaW4gR29kLmNsdXN0ZXJzX2RiKSlcbiAgICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKGlkICsgJyBpZCB1bmtub3duJyksIHt9KTtcbiAgICAgIHZhciBwcm9jID0gR29kLmNsdXN0ZXJzX2RiW2lkXTtcblxuICAgICAgdmFyIGFjdGlvbl9leGlzdCA9IGZhbHNlO1xuXG4gICAgICBwcm9jLnBtMl9lbnYuYXhtX2FjdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgIGlmIChhY3Rpb24uYWN0aW9uX25hbWUgPT0gY21kLm1zZykge1xuICAgICAgICAgIGFjdGlvbl9leGlzdCA9IHRydWU7XG4gICAgICAgICAgLy8gUmVzZXQgb3V0cHV0IGJ1ZmZlclxuICAgICAgICAgIGFjdGlvbi5vdXRwdXQgPSBbXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAoYWN0aW9uX2V4aXN0ID09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignQWN0aW9uIGRvZXNuXFwndCBleGlzdCAnICsgY21kLm1zZyArICcgZm9yICcgKyBwcm9jLnBtMl9lbnYubmFtZSksIHt9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb2MucG0yX2Vudi5zdGF0dXMgPT0gY3N0Lk9OTElORV9TVEFUVVMgfHwgcHJvYy5wbTJfZW52LnN0YXR1cyA9PSBjc3QuTEFVTkNISU5HX1NUQVRVUykge1xuICAgICAgICAvKlxuICAgICAgICAgKiBTZW5kIG1lc3NhZ2VcbiAgICAgICAgICovXG4gICAgICAgIGlmIChjbWQub3B0cyA9PSBudWxsICYmICFjbWQudXVpZClcbiAgICAgICAgICBwcm9jLnNlbmQoY21kLm1zZyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwcm9jLnNlbmQoY21kKTtcblxuICAgICAgICByZXR1cm4gY2IobnVsbCwgeyBwcm9jZXNzX2NvdW50OiAxLCBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoaWQgKyAnIDogaWQgb2ZmbGluZScpLCB7fSk7XG4gICAgfVxuXG4gICAgZWxzZSBpZiAoJ25hbWUnIGluIGNtZCkge1xuICAgICAgLypcbiAgICAgICAqIEFzIG5hbWVzIGFyZSBub3QgdW5pcXVlIGluIGNhc2Ugb2YgY2x1c3RlciwgdGhpc1xuICAgICAgICogd2lsbCBzZW5kIG1zZyB0byBhbGwgcHJvY2VzcyBtYXRjaGluZyAgJ25hbWUnXG4gICAgICAgKi9cbiAgICAgIHZhciBuYW1lID0gY21kLm5hbWU7XG4gICAgICB2YXIgYXJyID0gT2JqZWN0LmtleXMoR29kLmNsdXN0ZXJzX2RiKTtcbiAgICAgIHZhciBzZW50ID0gMDtcblxuICAgICAgKGZ1bmN0aW9uIGV4KGFycikge1xuICAgICAgICBpZiAoYXJyWzBdID09IG51bGwgfHwgIWFycikge1xuICAgICAgICAgIHJldHVybiBjYihudWxsLCB7XG4gICAgICAgICAgICBwcm9jZXNzX2NvdW50OiBzZW50LFxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGlkID0gYXJyWzBdO1xuXG4gICAgICAgIGlmICghR29kLmNsdXN0ZXJzX2RiW2lkXSB8fCAhR29kLmNsdXN0ZXJzX2RiW2lkXS5wbTJfZW52KSB7XG4gICAgICAgICAgYXJyLnNoaWZ0KCk7XG4gICAgICAgICAgcmV0dXJuIGV4KGFycik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJvY19lbnYgPSBHb2QuY2x1c3RlcnNfZGJbaWRdLnBtMl9lbnY7XG5cbiAgICAgICAgY29uc3QgaXNBY3Rpb25BdmFpbGFibGUgPSBwcm9jX2Vudi5heG1fYWN0aW9ucy5maW5kKGFjdGlvbiA9PiBhY3Rpb24uYWN0aW9uX25hbWUgPT09IGNtZC5tc2cpICE9PSB1bmRlZmluZWRcblxuICAgICAgICAvLyBpZiBhY3Rpb24gZG9lc24ndCBleGlzdCBmb3IgdGhpcyBhcHBcbiAgICAgICAgLy8gdHJ5IHdpdGggdGhlIG5leHQgb25lXG4gICAgICAgIGlmIChpc0FjdGlvbkF2YWlsYWJsZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBhcnIuc2hpZnQoKTtcbiAgICAgICAgICByZXR1cm4gZXgoYXJyKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgaWYgKChwLmJhc2VuYW1lKHByb2NfZW52LnBtX2V4ZWNfcGF0aCkgPT0gbmFtZSB8fFxuICAgICAgICAgIHByb2NfZW52Lm5hbWUgPT0gbmFtZSB8fFxuICAgICAgICAgIHByb2NfZW52Lm5hbWVzcGFjZSA9PSBuYW1lIHx8XG4gICAgICAgICAgbmFtZSA9PSAnYWxsJykgJiZcbiAgICAgICAgICAocHJvY19lbnYuc3RhdHVzID09IGNzdC5PTkxJTkVfU1RBVFVTIHx8XG4gICAgICAgICAgICBwcm9jX2Vudi5zdGF0dXMgPT0gY3N0LkxBVU5DSElOR19TVEFUVVMpKSB7XG5cbiAgICAgICAgICBwcm9jX2Vudi5heG1fYWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGlmIChhY3Rpb24uYWN0aW9uX25hbWUgPT0gY21kLm1zZykge1xuICAgICAgICAgICAgICBhY3Rpb25fZXhpc3QgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKGFjdGlvbl9leGlzdCA9PSBmYWxzZSB8fCBwcm9jX2Vudi5heG1fYWN0aW9ucy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgYXJyLnNoaWZ0KCk7XG4gICAgICAgICAgICByZXR1cm4gZXgoYXJyKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY21kLm9wdHMgPT0gbnVsbClcbiAgICAgICAgICAgIEdvZC5jbHVzdGVyc19kYltpZF0uc2VuZChjbWQubXNnKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBHb2QuY2x1c3RlcnNfZGJbaWRdLnNlbmQoY21kKTtcblxuICAgICAgICAgIHNlbnQrKztcbiAgICAgICAgICBhcnIuc2hpZnQoKTtcbiAgICAgICAgICByZXR1cm4gZXgoYXJyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBhcnIuc2hpZnQoKTtcbiAgICAgICAgICByZXR1cm4gZXgoYXJyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KShhcnIpO1xuICAgIH1cblxuICAgIGVsc2UgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKCdtZXRob2QgcmVxdWlyZXMgbmFtZSBvciBpZCBmaWVsZCcpLCB7fSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIGdldFZlcnNpb25cbiAgICogQHBhcmFtIHt9IGVudlxuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVybiBDYWxsRXhwcmVzc2lvblxuICAgKi9cbiAgR29kLmdldFZlcnNpb24gPSBmdW5jdGlvbiAoZW52LCBjYikge1xuICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNiKG51bGwsIHBrZy52ZXJzaW9uKTtcbiAgICB9KTtcbiAgfTtcblxuICBHb2QubW9uaXRvciA9IGZ1bmN0aW9uIE1vbml0b3IocG1faWQsIGNiKSB7XG4gICAgaWYgKCFHb2QuY2x1c3RlcnNfZGJbcG1faWRdIHx8ICFHb2QuY2x1c3RlcnNfZGJbcG1faWRdLnBtMl9lbnYpXG4gICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdVbmtub3duIHBtX2lkJykpO1xuXG4gICAgR29kLmNsdXN0ZXJzX2RiW3BtX2lkXS5wbTJfZW52Ll9rbV9tb25pdG9yZWQgPSB0cnVlO1xuICAgIHJldHVybiBjYihudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIHBtX2lkOiBwbV9pZCB9KTtcbiAgfVxuXG4gIEdvZC51bm1vbml0b3IgPSBmdW5jdGlvbiBNb25pdG9yKHBtX2lkLCBjYikge1xuICAgIGlmICghR29kLmNsdXN0ZXJzX2RiW3BtX2lkXSB8fCAhR29kLmNsdXN0ZXJzX2RiW3BtX2lkXS5wbTJfZW52KVxuICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcignVW5rbm93biBwbV9pZCcpKTtcblxuICAgIEdvZC5jbHVzdGVyc19kYltwbV9pZF0ucG0yX2Vudi5fa21fbW9uaXRvcmVkID0gZmFsc2U7XG4gICAgcmV0dXJuIGNiKG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgcG1faWQ6IHBtX2lkIH0pO1xuICB9XG5cbiAgR29kLmdldFJlcG9ydCA9IGZ1bmN0aW9uIChhcmcsIGNiKSB7XG4gICAgdmFyIHJlcG9ydCA9IHtcbiAgICAgIHBtMl92ZXJzaW9uOiBwa2cudmVyc2lvbixcbiAgICAgIG5vZGVfdmVyc2lvbjogJ04vQScsXG4gICAgICBub2RlX3BhdGg6IHByb2Nlc3MuZW52WydfJ10gfHwgJ25vdCBmb3VuZCcsXG4gICAgICBhcmd2MDogcHJvY2Vzcy5hcmd2MCxcbiAgICAgIGFyZ3Y6IHByb2Nlc3MuYXJndixcbiAgICAgIHVzZXI6IHByb2Nlc3MuZW52LlVTRVIsXG4gICAgICB1aWQ6IChjc3QuSVNfV0lORE9XUyA9PT0gZmFsc2UgJiYgcHJvY2Vzcy5nZXRldWlkKSA/IHByb2Nlc3MuZ2V0ZXVpZCgpIDogJ04vQScsXG4gICAgICBnaWQ6IChjc3QuSVNfV0lORE9XUyA9PT0gZmFsc2UgJiYgcHJvY2Vzcy5nZXRlZ2lkKSA/IHByb2Nlc3MuZ2V0ZWdpZCgpIDogJ04vQScsXG4gICAgICBlbnY6IHByb2Nlc3MuZW52LFxuICAgICAgbWFuYWdlZF9hcHBzOiBPYmplY3Qua2V5cyhHb2QuY2x1c3RlcnNfZGIpLmxlbmd0aCxcbiAgICAgIHN0YXJ0ZWRfYXQ6IEdvZC5zdGFydGVkX2F0XG4gICAgfTtcblxuICAgIGlmIChwcm9jZXNzLnZlcnNpb25zICYmIHByb2Nlc3MudmVyc2lvbnMubm9kZSkge1xuICAgICAgcmVwb3J0Lm5vZGVfdmVyc2lvbiA9IHByb2Nlc3MudmVyc2lvbnMubm9kZTtcbiAgICB9XG5cbiAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjYihudWxsLCByZXBvcnQpO1xuICAgIH0pO1xuICB9O1xufTtcblxuZnVuY3Rpb24gZmlsdGVyQmFkUHJvY2Vzcyhwcm8pIHtcbiAgaWYgKHByby5wbTJfZW52LnN0YXR1cyAhPT0gY3N0Lk9OTElORV9TVEFUVVMpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAocHJvLnBtMl9lbnYuYXhtX29wdGlvbnMgJiYgcHJvLnBtMl9lbnYuYXhtX29wdGlvbnMucGlkKSB7XG4gICAgaWYgKGlzTmFOKHByby5wbTJfZW52LmF4bV9vcHRpb25zLnBpZCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvY2Vzc0lkKHBybykge1xuICB2YXIgcGlkID0gcHJvLnBpZFxuXG4gIGlmIChwcm8ucG0yX2Vudi5heG1fb3B0aW9ucyAmJiBwcm8ucG0yX2Vudi5heG1fb3B0aW9ucy5waWQpIHtcbiAgICBwaWQgPSBwcm8ucG0yX2Vudi5heG1fb3B0aW9ucy5waWQ7XG4gIH1cblxuICByZXR1cm4gcGlkXG59XG4iXX0=