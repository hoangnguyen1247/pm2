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

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _eachLimit = _interopRequireDefault(require("async/eachLimit"));

var _constants = _interopRequireDefault(require("../../constants.js"));

var _package = _interopRequireDefault(require("../../package.json"));

var _pidusage = _interopRequireDefault(require("pidusage"));

var _util = _interopRequireDefault(require("util"));

var _debug = _interopRequireDefault(require("debug"));

var _Utility = _interopRequireDefault(require("../Utility"));

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
    if ((0, _typeof2["default"])(id) == 'object' && 'id' in id) id = id.id;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Hb2QvQWN0aW9uTWV0aG9kcy50cyJdLCJuYW1lcyI6WyJkZWJ1ZyIsInAiLCJwYXRoIiwiR29kIiwiZ2V0TW9uaXRvckRhdGEiLCJlbnYiLCJjYiIsInByb2Nlc3NlcyIsImdldEZvcm1hdGVkUHJvY2Vzc2VzIiwicGlkcyIsImZpbHRlciIsImZpbHRlckJhZFByb2Nlc3MiLCJtYXAiLCJwcm8iLCJpIiwicGlkIiwiZ2V0UHJvY2Vzc0lkIiwibGVuZ3RoIiwibWVtb3J5IiwiY3B1IiwicmV0UGlkVXNhZ2UiLCJlcnIiLCJzdGF0aXN0aWNzIiwiY29uc29sZSIsImVycm9yIiwic3RhdCIsIk1hdGgiLCJyb3VuZCIsImdldFN5c3RlbURhdGEiLCJzeXN0ZW1faW5mb3NfcHJvYyIsInF1ZXJ5IiwiZGF0YSIsIkVycm9yIiwiZHVtcFByb2Nlc3NMaXN0IiwicHJvY2Vzc19saXN0IiwiYXBwcyIsIlV0aWxpdHkiLCJjbG9uZSIsInRoYXQiLCJzdWNjZXNzIiwiZmluIiwiZnMiLCJleGlzdHNTeW5jIiwiY3N0IiwiRFVNUF9GSUxFX1BBVEgiLCJjbGVhckR1bXAiLCJ3cml0ZUZpbGVTeW5jIiwiRFVNUF9CQUNLVVBfRklMRV9QQVRIIiwicmVhZEZpbGVTeW5jIiwiZSIsInN0YWNrIiwiSlNPTiIsInN0cmluZ2lmeSIsInVubGlua1N5bmMiLCJzYXZlUHJvYyIsInBtMl9lbnYiLCJpbnN0YW5jZXMiLCJwbV9pZCIsInBteF9tb2R1bGUiLCJwdXNoIiwic2hpZnQiLCJwaW5nIiwibXNnIiwibm90aWZ5S2lsbFBNMiIsInBtMl9iZWluZ19raWxsZWQiLCJkdXBsaWNhdGVQcm9jZXNzSWQiLCJpZCIsImNsdXN0ZXJzX2RiIiwibG9nQW5kR2VuZXJhdGVFcnJvciIsInByb2MiLCJjcmVhdGVkX2F0IiwidW5pcXVlX2lkIiwiZ2VuZXJhdGVVVUlEIiwiaW5qZWN0VmFyaWFibGVzIiwiaW5qZWN0IiwiX2VyciIsImV4ZWN1dGVBcHAiLCJjbHUiLCJub3RpZnkiLCJzdGFydFByb2Nlc3NJZCIsInN0YXR1cyIsIk9OTElORV9TVEFUVVMiLCJMQVVOQ0hJTkdfU1RBVFVTIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzSWQiLCJjbGVhclRpbWVvdXQiLCJyZXN0YXJ0X3Rhc2siLCJTVE9QUEVEX1NUQVRVUyIsImdldEZvcm1hdGVkUHJvY2VzcyIsInN0YXRlIiwic2V0VGltZW91dCIsImxvZyIsIm5hbWUiLCJTVE9QUElOR19TVEFUVVMiLCJtZXNzYWdlIiwia2lsbFByb2Nlc3MiLCJ0eXBlIiwiRVJST1JFRF9TVEFUVVMiLCJ0b1N0cmluZyIsImluZGV4T2YiLCJwbV9waWRfcGF0aCIsImF4bV9hY3Rpb25zIiwiYXhtX21vbml0b3IiLCJyZXNldE1ldGFQcm9jZXNzSWQiLCJnZXREYXRlIiwidW5zdGFibGVfcmVzdGFydHMiLCJyZXN0YXJ0X3RpbWUiLCJkZWxldGVQcm9jZXNzSWQiLCJkZWxldGVDcm9uIiwiT2JqZWN0Iiwia2V5cyIsIm5leHRfaWQiLCJyZXN0YXJ0UHJvY2Vzc0lkIiwib3B0cyIsInJlc2V0U3RhdGUiLCJleHRlbmQiLCJleHRlbmRFeHRyYUNvbmZpZyIsInJlc3RhcnRQcm9jZXNzTmFtZSIsImZpbmRCeU5hbWUiLCJDT05DVVJSRU5UX0FDVElPTlMiLCJuZXh0IiwidXRpbCIsImZvcm1hdCIsInNlbmRTaWduYWxUb1Byb2Nlc3NJZCIsInByb2Nlc3NfaWQiLCJzaWduYWwiLCJraWxsIiwic2VuZFNpZ25hbFRvUHJvY2Vzc05hbWUiLCJwcm9jZXNzX25hbWUiLCJzdG9wV2F0Y2giLCJtZXRob2QiLCJ2YWx1ZSIsImZuIiwiZm9yRWFjaCIsIndhdGNoIiwiZGlzYWJsZSIsInRvZ2dsZVdhdGNoIiwiZW5hYmxlIiwic3RhcnRXYXRjaCIsIm5vdHJlc3RhcnRlZCIsInJlbG9hZExvZ3MiLCJwcm9jZXNzSWRzIiwiY2x1c3RlciIsInNlbmQiLCJleGVjX21vZGUiLCJfcmVsb2FkTG9ncyIsInNlbmRMaW5lVG9TdGRpbiIsInBhY2tldCIsImxpbmUiLCJzdGRpbiIsIndyaXRlIiwic2VuZERhdGFUb1Byb2Nlc3NJZCIsInRvcGljIiwibXNnUHJvY2VzcyIsImNtZCIsImFjdGlvbl9leGlzdCIsImFjdGlvbiIsImFjdGlvbl9uYW1lIiwib3V0cHV0IiwidXVpZCIsInByb2Nlc3NfY291bnQiLCJhcnIiLCJzZW50IiwiZXgiLCJwcm9jX2VudiIsImlzQWN0aW9uQXZhaWxhYmxlIiwiZmluZCIsInVuZGVmaW5lZCIsImJhc2VuYW1lIiwicG1fZXhlY19wYXRoIiwibmFtZXNwYWNlIiwiZ2V0VmVyc2lvbiIsIm5leHRUaWNrIiwicGtnIiwidmVyc2lvbiIsIm1vbml0b3IiLCJNb25pdG9yIiwiX2ttX21vbml0b3JlZCIsInVubW9uaXRvciIsImdldFJlcG9ydCIsImFyZyIsInJlcG9ydCIsInBtMl92ZXJzaW9uIiwibm9kZV92ZXJzaW9uIiwibm9kZV9wYXRoIiwiYXJndjAiLCJhcmd2IiwidXNlciIsIlVTRVIiLCJ1aWQiLCJJU19XSU5ET1dTIiwiZ2V0ZXVpZCIsImdpZCIsImdldGVnaWQiLCJtYW5hZ2VkX2FwcHMiLCJzdGFydGVkX2F0IiwidmVyc2lvbnMiLCJub2RlIiwiYXhtX29wdGlvbnMiLCJpc05hTiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FBS0E7QUFFQTs7Ozs7Ozs7Ozs7Ozs7O0FBTUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsSUFBTUEsS0FBSyxHQUFHLHVCQUFZLGtCQUFaLENBQWQ7QUFDQSxJQUFNQyxDQUFDLEdBQUdDLGdCQUFWO0FBRUE7Ozs7Ozs7QUFNZSxrQkFBVUMsR0FBVixFQUFlO0FBQzVCOzs7Ozs7O0FBT0FBLEVBQUFBLEdBQUcsQ0FBQ0MsY0FBSixHQUFxQixTQUFTQSxjQUFULENBQXdCQyxHQUF4QixFQUE2QkMsRUFBN0IsRUFBaUM7QUFDcEQsUUFBSUMsU0FBUyxHQUFHSixHQUFHLENBQUNLLG9CQUFKLEVBQWhCO0FBQ0EsUUFBSUMsSUFBSSxHQUFHRixTQUFT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RUFBTytLLE1BQVAsQ0FBVDtBQUNELEtBRkQ7QUFHRCxHQXRCRDtBQXVCRDs7QUFBQTs7QUFFRCxTQUFTMUssZ0JBQVQsQ0FBMEJFLEdBQTFCLEVBQStCO0FBQzdCLE1BQUlBLEdBQUcsQ0FBQzBDLE9BQUosQ0FBWXlCLE1BQVosS0FBdUJyQyxzQkFBSXNDLGFBQS9CLEVBQThDO0FBQzVDLFdBQU8sS0FBUDtBQUNEOztBQUVELE1BQUlwRSxHQUFHLENBQUMwQyxPQUFKLENBQVkrSSxXQUFaLElBQTJCekwsR0FBRyxDQUFDMEMsT0FBSixDQUFZK0ksV0FBWixDQUF3QnZMLEdBQXZELEVBQTREO0FBQzFELFFBQUl3TCxLQUFLLENBQUMxTCxHQUFHLENBQUMwQyxPQUFKLENBQVkrSSxXQUFaLENBQXdCdkwsR0FBekIsQ0FBVCxFQUF3QztBQUN0QyxhQUFPLEtBQVA7QUFDRDtBQUNGOztBQUVELFNBQU8sSUFBUDtBQUNEOztBQUVELFNBQVNDLFlBQVQsQ0FBc0JILEdBQXRCLEVBQTJCO0FBQ3pCLE1BQUlFLEdBQUcsR0FBR0YsR0FBRyxDQUFDRSxHQUFkOztBQUVBLE1BQUlGLEdBQUcsQ0FBQzBDLE9BQUosQ0FBWStJLFdBQVosSUFBMkJ6TCxHQUFHLENBQUMwQyxPQUFKLENBQVkrSSxXQUFaLENBQXdCdkwsR0FBdkQsRUFBNEQ7QUFDMURBLElBQUFBLEdBQUcsR0FBR0YsR0FBRyxDQUFDMEMsT0FBSixDQUFZK0ksV0FBWixDQUF3QnZMLEdBQTlCO0FBQ0Q7O0FBRUQsU0FBT0EsR0FBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgbGljZW5zZSB0aGF0XG4gKiBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBmaWxlIEFjdGlvbk1ldGhvZCBsaWtlIHJlc3RhcnQsIHN0b3AsIG1vbml0b3IuLi4gYXJlIGhlcmVcbiAqIEBhdXRob3IgQWxleGFuZHJlIFN0cnplbGV3aWN6IDxhc0B1bml0ZWNoLmlvPlxuICogQHByb2plY3QgUE0yXG4gKi9cblxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGVhY2hMaW1pdCBmcm9tICdhc3luYy9lYWNoTGltaXQnO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmltcG9ydCBjc3QgZnJvbSAnLi4vLi4vY29uc3RhbnRzLmpzJztcbmltcG9ydCBwa2cgZnJvbSAnLi4vLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCBwaWR1c2FnZSBmcm9tICdwaWR1c2FnZSc7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCBkZWJ1Z0xvZ2dlciBmcm9tICdkZWJ1Zyc7XG5pbXBvcnQgVXRpbGl0eSBmcm9tICcuLi9VdGlsaXR5JztcblxuY29uc3QgZGVidWcgPSBkZWJ1Z0xvZ2dlcigncG0yOkFjdGlvbk1ldGhvZCcpO1xuY29uc3QgcCA9IHBhdGg7XG5cbi8qKlxuICogRGVzY3JpcHRpb25cbiAqIEBtZXRob2QgZXhwb3J0c1xuICogQHBhcmFtIHt9IEdvZFxuICogQHJldHVyblxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoR29kKSB7XG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIGdldE1vbml0b3JEYXRhXG4gICAqIEBwYXJhbSB7fSBlbnZcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm5cbiAgICovXG4gIEdvZC5nZXRNb25pdG9yRGF0YSA9IGZ1bmN0aW9uIGdldE1vbml0b3JEYXRhKGVudiwgY2IpIHtcbiAgICB2YXIgcHJvY2Vzc2VzID0gR29kLmdldEZvcm1hdGVkUHJvY2Vzc2VzKCk7XG4gICAgdmFyIHBpZHMgPSBwcm9jZXNzZXMuZmlsdGVyKGZpbHRlckJhZFByb2Nlc3MpXG4gICAgICAubWFwKGZ1bmN0aW9uIChwcm8sIGkpIHtcbiAgICAgICAgdmFyIHBpZCA9IGdldFByb2Nlc3NJZChwcm8pXG4gICAgICAgIHJldHVybiBwaWQ7XG4gICAgICB9KVxuXG4gICAgLy8gTm8gcGlkcywgcmV0dXJuIGVtcHR5IHN0YXRpc3RpY3NcbiAgICBpZiAocGlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBjYihudWxsLCBwcm9jZXNzZXMubWFwKGZ1bmN0aW9uIChwcm8pIHtcbiAgICAgICAgcHJvWydtb25pdCddID0ge1xuICAgICAgICAgIG1lbW9yeTogMCxcbiAgICAgICAgICBjcHU6IDBcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gcHJvXG4gICAgICB9KSlcbiAgICB9XG5cbiAgICBwaWR1c2FnZShwaWRzLCBmdW5jdGlvbiByZXRQaWRVc2FnZShlcnIsIHN0YXRpc3RpY3MpIHtcbiAgICAgIC8vIEp1c3QgbG9nLCB3ZSdsbCBzZXQgZW1wdHkgc3RhdGlzdGljc1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjYXVnaHQgd2hpbGUgY2FsbGluZyBwaWR1c2FnZScpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG5cbiAgICAgICAgcmV0dXJuIGNiKG51bGwsIHByb2Nlc3Nlcy5tYXAoZnVuY3Rpb24gKHBybykge1xuICAgICAgICAgIHByb1snbW9uaXQnXSA9IHtcbiAgICAgICAgICAgIG1lbW9yeTogMCxcbiAgICAgICAgICAgIGNwdTogMFxuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuIHByb1xuICAgICAgICB9KSlcbiAgICAgIH1cblxuICAgICAgaWYgKCFzdGF0aXN0aWNzKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1N0YXRpc3RpY3MgaXMgbm90IGRlZmluZWQhJylcblxuICAgICAgICByZXR1cm4gY2IobnVsbCwgcHJvY2Vzc2VzLm1hcChmdW5jdGlvbiAocHJvKSB7XG4gICAgICAgICAgcHJvWydtb25pdCddID0ge1xuICAgICAgICAgICAgbWVtb3J5OiAwLFxuICAgICAgICAgICAgY3B1OiAwXG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gcHJvXG4gICAgICAgIH0pKVxuICAgICAgfVxuXG4gICAgICBwcm9jZXNzZXMgPSBwcm9jZXNzZXMubWFwKGZ1bmN0aW9uIChwcm8pIHtcbiAgICAgICAgaWYgKGZpbHRlckJhZFByb2Nlc3MocHJvKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBwcm9bJ21vbml0J10gPSB7XG4gICAgICAgICAgICBtZW1vcnk6IDAsXG4gICAgICAgICAgICBjcHU6IDBcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgcmV0dXJuIHBybztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwaWQgPSBnZXRQcm9jZXNzSWQocHJvKTtcbiAgICAgICAgdmFyIHN0YXQgPSBzdGF0aXN0aWNzW3BpZF07XG5cbiAgICAgICAgaWYgKCFzdGF0KSB7XG4gICAgICAgICAgcHJvWydtb25pdCddID0ge1xuICAgICAgICAgICAgbWVtb3J5OiAwLFxuICAgICAgICAgICAgY3B1OiAwXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHJldHVybiBwcm87XG4gICAgICAgIH1cblxuICAgICAgICBwcm9bJ21vbml0J10gPSB7XG4gICAgICAgICAgbWVtb3J5OiBzdGF0Lm1lbW9yeSxcbiAgICAgICAgICBjcHU6IE1hdGgucm91bmQoc3RhdC5jcHUgKiAxMCkgLyAxMFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBwcm87XG4gICAgICB9KTtcblxuICAgICAgY2IobnVsbCwgcHJvY2Vzc2VzKTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBnZXRTeXN0ZW1EYXRhXG4gICAqIEBwYXJhbSB7fSBlbnZcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm5cbiAgICovXG4gIEdvZC5nZXRTeXN0ZW1EYXRhID0gZnVuY3Rpb24gZ2V0U3lzdGVtRGF0YShlbnYsIGNiKSB7XG4gICAgaWYgKEdvZC5zeXN0ZW1faW5mb3NfcHJvYyAhPT0gbnVsbClcbiAgICAgIEdvZC5zeXN0ZW1faW5mb3NfcHJvYy5xdWVyeSgoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgIGNiKG51bGwsIGRhdGEpXG4gICAgICB9KVxuICAgIGVsc2Uge1xuICAgICAgY2IobmV3IEVycm9yKCdTeXNpbmZvcyBub3QgbGF1bmNoZWQsIHR5cGU6IHBtMiBzeXNtb25pdCcpKVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBkdW1wUHJvY2Vzc0xpc3RcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm5cbiAgICovXG4gIEdvZC5kdW1wUHJvY2Vzc0xpc3QgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICB2YXIgcHJvY2Vzc19saXN0ID0gW107XG4gICAgdmFyIGFwcHMgPSBVdGlsaXR5LmNsb25lKEdvZC5nZXRGb3JtYXRlZFByb2Nlc3NlcygpKTtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAvLyBEb24ndCBvdmVycmlkZSB0aGUgYWN0dWFsIGR1bXAgZmlsZSBpZiBwcm9jZXNzIGxpc3QgaXMgZW1wdHlcbiAgICAvLyB1bmxlc3MgdXNlciBleHBsaWNpdGVseSBkaWQgYHBtMiBkdW1wYC5cbiAgICAvLyBUaGlzIG9mdGVuIGhhcHBlbnMgd2hlbiBQTTIgY3Jhc2hlZCwgd2UgZG9uJ3Qgd2FudCB0byBvdmVycmlkZVxuICAgIC8vIHRoZSBkdW1wIGZpbGUgd2l0aCBhbiBlbXB0eSBsaXN0IG9mIHByb2Nlc3MuXG4gICAgaWYgKCFhcHBzWzBdKSB7XG4gICAgICBkZWJ1ZygnW1BNMl0gRGlkIG5vdCBvdmVycmlkZSBkdW1wIGZpbGUgYmVjYXVzZSBsaXN0IG9mIHByb2Nlc3NlcyBpcyBlbXB0eScpO1xuICAgICAgcmV0dXJuIGNiKG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgcHJvY2Vzc19saXN0OiBwcm9jZXNzX2xpc3QgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmluKGVycikge1xuXG4gICAgICAvLyB0cnkgdG8gZml4IGlzc3VlcyB3aXRoIGVtcHR5IGR1bXAgZmlsZVxuICAgICAgLy8gbGlrZSAjMzQ4NVxuICAgICAgaWYgKHByb2Nlc3NfbGlzdC5sZW5ndGggPT09IDApIHtcblxuICAgICAgICAvLyBmaXggOiBpZiBubyBkdW1wIGZpbGUsIG5vIHByb2Nlc3MsIG9ubHkgbW9kdWxlIGFuZCBhZnRlciBwbTIgdXBkYXRlXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhjc3QuRFVNUF9GSUxFX1BBVEgpICYmIHR5cGVvZiB0aGF0LmNsZWFyRHVtcCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRoYXQuY2xlYXJEdW1wKGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBubyBwcm9jZXNzIGluIGxpc3QgZG9uJ3QgbW9kaWZ5IGR1bXAgZmlsZVxuICAgICAgICAvLyBwcm9jZXNzIGxpc3Qgc2hvdWxkIG5vdCBiZSBlbXB0eVxuICAgICAgICByZXR1cm4gY2IobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBwcm9jZXNzX2xpc3Q6IHByb2Nlc3NfbGlzdCB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gQmFjayB1cCBkdW1wIGZpbGVcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGNzdC5EVU1QX0ZJTEVfUEFUSCkpIHtcbiAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGNzdC5EVU1QX0JBQ0tVUF9GSUxFX1BBVEgsIGZzLnJlYWRGaWxlU3luYyhjc3QuRFVNUF9GSUxFX1BBVEgpKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE92ZXJ3cml0ZSBkdW1wIGZpbGUsIGRlbGV0ZSBpZiBicm9rZW5cbiAgICAgIHRyeSB7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoY3N0LkRVTVBfRklMRV9QQVRILCBKU09OLnN0cmluZ2lmeShwcm9jZXNzX2xpc3QpKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIHRyeSB0byBiYWNrdXAgZmlsZVxuICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGNzdC5EVU1QX0JBQ0tVUF9GSUxFX1BBVEgpKSB7XG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGNzdC5EVU1QX0ZJTEVfUEFUSCwgZnMucmVhZEZpbGVTeW5jKGNzdC5EVU1QX0JBQ0tVUF9GSUxFX1BBVEgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBkb24ndCBrZWVwIGJyb2tlbiBmaWxlXG4gICAgICAgICAgZnMudW5saW5rU3luYyhjc3QuRFVNUF9GSUxFX1BBVEgpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2IobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBwcm9jZXNzX2xpc3Q6IHByb2Nlc3NfbGlzdCB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzYXZlUHJvYyhhcHBzKSB7XG4gICAgICBpZiAoIWFwcHNbMF0pXG4gICAgICAgIHJldHVybiBmaW4obnVsbCk7XG4gICAgICBkZWxldGUgYXBwc1swXS5wbTJfZW52Lmluc3RhbmNlcztcbiAgICAgIGRlbGV0ZSBhcHBzWzBdLnBtMl9lbnYucG1faWQ7XG4gICAgICAvLyBEbyBub3QgZHVtcCBtb2R1bGVzXG4gICAgICBpZiAoIWFwcHNbMF0ucG0yX2Vudi5wbXhfbW9kdWxlKVxuICAgICAgICBwcm9jZXNzX2xpc3QucHVzaChhcHBzWzBdLnBtMl9lbnYpO1xuICAgICAgYXBwcy5zaGlmdCgpO1xuICAgICAgcmV0dXJuIHNhdmVQcm9jKGFwcHMpO1xuICAgIH1cbiAgICBzYXZlUHJvYyhhcHBzKTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBwaW5nXG4gICAqIEBwYXJhbSB7fSBlbnZcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm4gQ2FsbEV4cHJlc3Npb25cbiAgICovXG4gIEdvZC5waW5nID0gZnVuY3Rpb24gKGVudiwgY2IpIHtcbiAgICByZXR1cm4gY2IobnVsbCwgeyBtc2c6ICdwb25nJyB9KTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBub3RpZnlLaWxsUE0yXG4gICAqL1xuICBHb2Qubm90aWZ5S2lsbFBNMiA9IGZ1bmN0aW9uICgpIHtcbiAgICBHb2QucG0yX2JlaW5nX2tpbGxlZCA9IHRydWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIER1cGxpY2F0ZSBhIHByb2Nlc3NcbiAgICogQG1ldGhvZCBkdXBsaWNhdGVQcm9jZXNzSWRcbiAgICogQHBhcmFtIHt9IGlkXG4gICAqIEBwYXJhbSB7fSBjYlxuICAgKiBAcmV0dXJuIENhbGxFeHByZXNzaW9uXG4gICAqL1xuICBHb2QuZHVwbGljYXRlUHJvY2Vzc0lkID0gZnVuY3Rpb24gKGlkLCBjYikge1xuICAgIGlmICghKGlkIGluIEdvZC5jbHVzdGVyc19kYikpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoaWQgKyAnIGlkIHVua25vd24nKSwge30pO1xuXG4gICAgaWYgKCFHb2QuY2x1c3RlcnNfZGJbaWRdIHx8ICFHb2QuY2x1c3RlcnNfZGJbaWRdLnBtMl9lbnYpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ0Vycm9yIHdoZW4gZ2V0dGluZyBwcm9jIHx8IHByb2MucG0yX2VudicpLCB7fSk7XG5cbiAgICB2YXIgcHJvYyA9IFV0aWxpdHkuY2xvbmUoR29kLmNsdXN0ZXJzX2RiW2lkXS5wbTJfZW52KTtcblxuXG4gICAgZGVsZXRlIHByb2MuY3JlYXRlZF9hdDtcbiAgICBkZWxldGUgcHJvYy5wbV9pZDtcbiAgICBkZWxldGUgcHJvYy51bmlxdWVfaWQ7XG5cbiAgICAvLyBnZW5lcmF0ZSBhIG5ldyB1bmlxdWUgaWQgZm9yIG5ldyBwcm9jZXNzXG4gICAgcHJvYy51bmlxdWVfaWQgPSBVdGlsaXR5LmdlbmVyYXRlVVVJRCgpXG5cbiAgICBHb2QuaW5qZWN0VmFyaWFibGVzKHByb2MsIGZ1bmN0aW9uIGluamVjdChfZXJyLCBwcm9jKSB7XG4gICAgICByZXR1cm4gR29kLmV4ZWN1dGVBcHAoVXRpbGl0eS5jbG9uZShwcm9jKSwgZnVuY3Rpb24gKGVyciwgY2x1KSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgICBHb2Qubm90aWZ5KCdzdGFydCcsIGNsdSwgdHJ1ZSk7XG4gICAgICAgIHJldHVybiBjYihlcnIsIFV0aWxpdHkuY2xvbmUoY2x1KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogU3RhcnQgYSBzdG9wcGVkIHByb2Nlc3MgYnkgSURcbiAgICogQG1ldGhvZCBzdGFydFByb2Nlc3NJZFxuICAgKiBAcGFyYW0ge30gaWRcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm4gQ2FsbEV4cHJlc3Npb25cbiAgICovXG4gIEdvZC5zdGFydFByb2Nlc3NJZCA9IGZ1bmN0aW9uIChpZCwgY2IpIHtcbiAgICBpZiAoIShpZCBpbiBHb2QuY2x1c3RlcnNfZGIpKVxuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKGlkICsgJyBpZCB1bmtub3duJyksIHt9KTtcblxuICAgIHZhciBwcm9jID0gR29kLmNsdXN0ZXJzX2RiW2lkXTtcbiAgICBpZiAocHJvYy5wbTJfZW52LnN0YXR1cyA9PSBjc3QuT05MSU5FX1NUQVRVUylcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcigncHJvY2VzcyBhbHJlYWR5IG9ubGluZScpLCB7fSk7XG4gICAgaWYgKHByb2MucG0yX2Vudi5zdGF0dXMgPT0gY3N0LkxBVU5DSElOR19TVEFUVVMpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ3Byb2Nlc3MgYWxyZWFkeSBzdGFydGVkJyksIHt9KTtcbiAgICBpZiAocHJvYy5wcm9jZXNzICYmIHByb2MucHJvY2Vzcy5waWQpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ1Byb2Nlc3Mgd2l0aCBwaWQgJyArIHByb2MucHJvY2Vzcy5waWQgKyAnIGFscmVhZHkgZXhpc3RzJyksIHt9KTtcblxuICAgIHJldHVybiBHb2QuZXhlY3V0ZUFwcChHb2QuY2x1c3RlcnNfZGJbaWRdLnBtMl9lbnYsIGZ1bmN0aW9uIChlcnIsIHByb2MpIHtcbiAgICAgIHJldHVybiBjYihlcnIsIFV0aWxpdHkuY2xvbmUocHJvYykpO1xuICAgIH0pO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIFN0b3AgYSBwcm9jZXNzIGFuZCBzZXQgaXQgb24gc3RhdGUgJ3N0b3BwZWQnXG4gICAqIEBtZXRob2Qgc3RvcFByb2Nlc3NJZFxuICAgKiBAcGFyYW0ge30gaWRcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm4gTGl0ZXJhbFxuICAgKi9cbiAgR29kLnN0b3BQcm9jZXNzSWQgPSBmdW5jdGlvbiAoaWQsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBpZCA9PSAnb2JqZWN0JyAmJiAnaWQnIGluIGlkKVxuICAgICAgaWQgPSBpZC5pZDtcblxuICAgIGlmICghKGlkIGluIEdvZC5jbHVzdGVyc19kYikpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoaWQgKyAnIDogaWQgdW5rbm93bicpLCB7fSk7XG5cbiAgICB2YXIgcHJvYyA9IEdvZC5jbHVzdGVyc19kYltpZF07XG5cbiAgICAvL2NsZWFyIHRpbWUtb3V0IHJlc3RhcnQgdGFza1xuICAgIGNsZWFyVGltZW91dChwcm9jLnBtMl9lbnYucmVzdGFydF90YXNrKTtcblxuICAgIGlmIChwcm9jLnBtMl9lbnYuc3RhdHVzID09IGNzdC5TVE9QUEVEX1NUQVRVUykge1xuICAgICAgcHJvYy5wcm9jZXNzLnBpZCA9IDA7XG4gICAgICByZXR1cm4gY2IobnVsbCwgR29kLmdldEZvcm1hdGVkUHJvY2VzcyhpZCkpO1xuICAgIH1cbiAgICAvLyBzdGF0ZSA9PSAnbm9uZScgbWVhbnMgdGhhdCB0aGUgcHJvY2VzcyBpcyBub3Qgb25saW5lIHlldFxuICAgIGlmIChwcm9jLnN0YXRlICYmIHByb2Muc3RhdGUgPT09ICdub25lJylcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgR29kLnN0b3BQcm9jZXNzSWQoaWQsIGNiKTsgfSwgMjUwKTtcblxuICAgIGNvbnNvbGUubG9nKCdTdG9wcGluZyBhcHA6JXMgaWQ6JXMnLCBwcm9jLnBtMl9lbnYubmFtZSwgcHJvYy5wbTJfZW52LnBtX2lkKTtcbiAgICBwcm9jLnBtMl9lbnYuc3RhdHVzID0gY3N0LlNUT1BQSU5HX1NUQVRVUztcblxuICAgIGlmICghcHJvYy5wcm9jZXNzLnBpZCkge1xuICAgICAgY29uc29sZS5lcnJvcignYXBwPSVzIGlkPSVkIGRvZXMgbm90IGhhdmUgYSBwaWQnLCBwcm9jLnBtMl9lbnYubmFtZSwgcHJvYy5wbTJfZW52LnBtX2lkKTtcbiAgICAgIHByb2MucG0yX2Vudi5zdGF0dXMgPSBjc3QuU1RPUFBFRF9TVEFUVVM7XG4gICAgICByZXR1cm4gY2IobnVsbCwgeyBlcnJvcjogdHJ1ZSwgbWVzc2FnZTogJ2NvdWxkIG5vdCBraWxsIHByb2Nlc3Mgdy9vIHBpZCcgfSk7XG4gICAgfVxuXG4gICAgR29kLmtpbGxQcm9jZXNzKHByb2MucHJvY2Vzcy5waWQsIHByb2MucG0yX2VudiwgZnVuY3Rpb24gKGVycikge1xuICAgICAgcHJvYy5wbTJfZW52LnN0YXR1cyA9IGNzdC5TVE9QUEVEX1NUQVRVUztcblxuICAgICAgR29kLm5vdGlmeSgnZXhpdCcsIHByb2MpO1xuXG4gICAgICBpZiAoZXJyICYmIGVyci50eXBlICYmIGVyci50eXBlID09PSAndGltZW91dCcpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignYXBwPSVzIGlkPSVkIHBpZD0lcyBjb3VsZCBub3QgYmUgc3RvcHBlZCcsXG4gICAgICAgICAgcHJvYy5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgcHJvYy5wbTJfZW52LnBtX2lkLFxuICAgICAgICAgIHByb2MucHJvY2Vzcy5waWQpO1xuICAgICAgICBwcm9jLnBtMl9lbnYuc3RhdHVzID0gY3N0LkVSUk9SRURfU1RBVFVTO1xuICAgICAgICByZXR1cm4gY2IobnVsbCwgR29kLmdldEZvcm1hdGVkUHJvY2VzcyhpZCkpO1xuICAgICAgfVxuXG4gICAgICBpZiAocHJvYy5wbTJfZW52LnBtX2lkLnRvU3RyaW5nKCkuaW5kZXhPZignX29sZF8nKSAhPT0gMCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGZzLnVubGlua1N5bmMocHJvYy5wbTJfZW52LnBtX3BpZF9wYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkgeyB9XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9jLnBtMl9lbnYuYXhtX2FjdGlvbnMpIHByb2MucG0yX2Vudi5heG1fYWN0aW9ucyA9IFtdO1xuICAgICAgaWYgKHByb2MucG0yX2Vudi5heG1fbW9uaXRvcikgcHJvYy5wbTJfZW52LmF4bV9tb25pdG9yID0ge307XG5cbiAgICAgIHByb2MucHJvY2Vzcy5waWQgPSAwO1xuICAgICAgcmV0dXJuIGNiKG51bGwsIEdvZC5nZXRGb3JtYXRlZFByb2Nlc3MoaWQpKTtcbiAgICB9KTtcbiAgfTtcblxuICBHb2QucmVzZXRNZXRhUHJvY2Vzc0lkID0gZnVuY3Rpb24gKGlkLCBjYikge1xuICAgIGlmICghKGlkIGluIEdvZC5jbHVzdGVyc19kYikpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoaWQgKyAnIGlkIHVua25vd24nKSwge30pO1xuXG4gICAgaWYgKCFHb2QuY2x1c3RlcnNfZGJbaWRdIHx8ICFHb2QuY2x1c3RlcnNfZGJbaWRdLnBtMl9lbnYpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ0Vycm9yIHdoZW4gZ2V0dGluZyBwcm9jIHx8IHByb2MucG0yX2VudicpLCB7fSk7XG5cbiAgICBHb2QuY2x1c3RlcnNfZGJbaWRdLnBtMl9lbnYuY3JlYXRlZF9hdCA9IFV0aWxpdHkuZ2V0RGF0ZSgpO1xuICAgIEdvZC5jbHVzdGVyc19kYltpZF0ucG0yX2Vudi51bnN0YWJsZV9yZXN0YXJ0cyA9IDA7XG4gICAgR29kLmNsdXN0ZXJzX2RiW2lkXS5wbTJfZW52LnJlc3RhcnRfdGltZSA9IDA7XG5cbiAgICByZXR1cm4gY2IobnVsbCwgR29kLmdldEZvcm1hdGVkUHJvY2Vzc2VzKCkpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZWxldGUgYSBwcm9jZXNzIGJ5IGlkXG4gICAqIEl0IHdpbGwgc3RvcCBpdCBhbmQgcmVtb3ZlIGl0IGZyb20gdGhlIGRhdGFiYXNlXG4gICAqIEBtZXRob2QgZGVsZXRlUHJvY2Vzc0lkXG4gICAqIEBwYXJhbSB7fSBpZFxuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVybiBMaXRlcmFsXG4gICAqL1xuICBHb2QuZGVsZXRlUHJvY2Vzc0lkID0gZnVuY3Rpb24gKGlkLCBjYikge1xuICAgIEdvZC5kZWxldGVDcm9uKGlkKTtcblxuICAgIEdvZC5zdG9wUHJvY2Vzc0lkKGlkLCBmdW5jdGlvbiAoZXJyLCBwcm9jKSB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoZXJyKSwge30pO1xuICAgICAgLy8gISB0cmFuc2Zvcm0gdG8gc2xvdyBvYmplY3RcbiAgICAgIGRlbGV0ZSBHb2QuY2x1c3RlcnNfZGJbaWRdO1xuXG4gICAgICBpZiAoT2JqZWN0LmtleXMoR29kLmNsdXN0ZXJzX2RiKS5sZW5ndGggPT0gMClcbiAgICAgICAgR29kLm5leHRfaWQgPSAwO1xuICAgICAgcmV0dXJuIGNiKG51bGwsIHByb2MpO1xuICAgIH0pO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICAvKipcbiAgICogUmVzdGFydCBhIHByb2Nlc3MgSURcbiAgICogSWYgdGhlIHByb2Nlc3MgaXMgb25saW5lIGl0IHdpbGwgbm90IHB1dCBpdCBvbiBzdGF0ZSBzdG9wcGVkXG4gICAqIGJ1dCBkaXJlY3RseSBraWxsIGl0IGFuZCBsZXQgR29kIHJlc3RhcnQgaXRcbiAgICogQG1ldGhvZCByZXN0YXJ0UHJvY2Vzc0lkXG4gICAqIEBwYXJhbSB7fSBpZFxuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVybiBMaXRlcmFsXG4gICAqL1xuICBHb2QucmVzdGFydFByb2Nlc3NJZCA9IGZ1bmN0aW9uIChvcHRzLCBjYikge1xuICAgIHZhciBpZCA9IG9wdHMuaWQ7XG4gICAgdmFyIGVudiA9IG9wdHMuZW52IHx8IHt9O1xuXG4gICAgaWYgKHR5cGVvZiAoaWQpID09PSAndW5kZWZpbmVkJylcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignb3B0cy5pZCBub3QgcGFzc2VkIHRvIHJlc3RhcnRQcm9jZXNzSWQnLCBvcHRzKSk7XG4gICAgaWYgKCEoaWQgaW4gR29kLmNsdXN0ZXJzX2RiKSlcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignR29kIGRiIHByb2Nlc3MgaWQgdW5rbm93bicpLCB7fSk7XG5cbiAgICB2YXIgcHJvYyA9IEdvZC5jbHVzdGVyc19kYltpZF07XG5cbiAgICBHb2QucmVzZXRTdGF0ZShwcm9jLnBtMl9lbnYpO1xuXG4gICAgLyoqXG4gICAgICogTWVyZ2UgbmV3IGFwcGxpY2F0aW9uIGNvbmZpZ3VyYXRpb24gb24gcmVzdGFydFxuICAgICAqIFNhbWUgc3lzdGVtIGluIHJlbG9hZFByb2Nlc3NJZCBhbmQgc29mdFJlbG9hZFByb2Nlc3NJZFxuICAgICAqL1xuICAgIFV0aWxpdHkuZXh0ZW5kKHByb2MucG0yX2Vudi5lbnYsIGVudik7XG4gICAgVXRpbGl0eS5leHRlbmRFeHRyYUNvbmZpZyhwcm9jLCBvcHRzKTtcblxuICAgIGlmIChHb2QucG0yX2JlaW5nX2tpbGxlZCkge1xuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKCdbUmVzdGFydFByb2Nlc3NJZF0gUE0yIGlzIGJlaW5nIGtpbGxlZCwgc3RvcHBpbmcgcmVzdGFydCBwcm9jZWR1cmUuLi4nKSk7XG4gICAgfVxuICAgIGlmIChwcm9jLnBtMl9lbnYuc3RhdHVzID09PSBjc3QuT05MSU5FX1NUQVRVUyB8fCBwcm9jLnBtMl9lbnYuc3RhdHVzID09PSBjc3QuTEFVTkNISU5HX1NUQVRVUykge1xuICAgICAgR29kLnN0b3BQcm9jZXNzSWQoaWQsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKEdvZC5wbTJfYmVpbmdfa2lsbGVkKVxuICAgICAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignW1Jlc3RhcnRQcm9jZXNzSWRdIFBNMiBpcyBiZWluZyBraWxsZWQsIHN0b3BwaW5nIHJlc3RhcnQgcHJvY2VkdXJlLi4uJykpO1xuICAgICAgICBwcm9jLnBtMl9lbnYucmVzdGFydF90aW1lICs9IDE7XG4gICAgICAgIHJldHVybiBHb2Quc3RhcnRQcm9jZXNzSWQoaWQsIGNiKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZGVidWcoJ1tyZXN0YXJ0XSBwcm9jZXNzIG5vdCBvbmxpbmUsIHN0YXJ0aW5nIGl0Jyk7XG4gICAgICByZXR1cm4gR29kLnN0YXJ0UHJvY2Vzc0lkKGlkLCBjYik7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIFJlc3RhcnQgYWxsIHByb2Nlc3MgYnkgbmFtZVxuICAgKiBAbWV0aG9kIHJlc3RhcnRQcm9jZXNzTmFtZVxuICAgKiBAcGFyYW0ge30gbmFtZVxuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVybiBMaXRlcmFsXG4gICAqL1xuICBHb2QucmVzdGFydFByb2Nlc3NOYW1lID0gZnVuY3Rpb24gKG5hbWUsIGNiKSB7XG4gICAgdmFyIHByb2Nlc3NlcyA9IEdvZC5maW5kQnlOYW1lKG5hbWUpO1xuXG4gICAgaWYgKHByb2Nlc3NlcyAmJiBwcm9jZXNzZXMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKCdVbmtub3duIHByb2Nlc3MnKSwge30pO1xuXG4gICAgZWFjaExpbWl0KHByb2Nlc3NlcywgY3N0LkNPTkNVUlJFTlRfQUNUSU9OUywgZnVuY3Rpb24gKHByb2MsIG5leHQpIHtcbiAgICAgIGlmIChHb2QucG0yX2JlaW5nX2tpbGxlZClcbiAgICAgICAgcmV0dXJuIG5leHQoJ1tXYXRjaF0gUE0yIGlzIGJlaW5nIGtpbGxlZCwgc3RvcHBpbmcgcmVzdGFydCBwcm9jZWR1cmUuLi4nKTtcbiAgICAgIGlmIChwcm9jLnBtMl9lbnYuc3RhdHVzID09PSBjc3QuT05MSU5FX1NUQVRVUylcbiAgICAgICAgcmV0dXJuIEdvZC5yZXN0YXJ0UHJvY2Vzc0lkKHsgaWQ6IHByb2MucG0yX2Vudi5wbV9pZCB9LCBuZXh0KTtcbiAgICAgIGVsc2UgaWYgKHByb2MucG0yX2Vudi5zdGF0dXMgIT09IGNzdC5TVE9QUElOR19TVEFUVVNcbiAgICAgICAgJiYgcHJvYy5wbTJfZW52LnN0YXR1cyAhPT0gY3N0LkxBVU5DSElOR19TVEFUVVMpXG4gICAgICAgIHJldHVybiBHb2Quc3RhcnRQcm9jZXNzSWQocHJvYy5wbTJfZW52LnBtX2lkLCBuZXh0KTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIG5leHQodXRpbC5mb3JtYXQoJ1tXYXRjaF0gUHJvY2VzcyBuYW1lICVzIGlzIGJlaW5nIHN0b3BwZWQgc28gSSB3b25cXCd0IHJlc3RhcnQgaXQnLCBuYW1lKSk7XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKGVycikpO1xuICAgICAgcmV0dXJuIGNiKG51bGwsIEdvZC5nZXRGb3JtYXRlZFByb2Nlc3NlcygpKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICAvKipcbiAgICogU2VuZCBzeXN0ZW0gc2lnbmFsIHRvIHByb2Nlc3MgaWRcbiAgICogQG1ldGhvZCBzZW5kU2lnbmFsVG9Qcm9jZXNzSWRcbiAgICogQHBhcmFtIHt9IG9wdHNcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm4gQ2FsbEV4cHJlc3Npb25cbiAgICovXG4gIEdvZC5zZW5kU2lnbmFsVG9Qcm9jZXNzSWQgPSBmdW5jdGlvbiAob3B0cywgY2IpIHtcbiAgICB2YXIgaWQgPSBvcHRzLnByb2Nlc3NfaWQ7XG4gICAgdmFyIHNpZ25hbCA9IG9wdHMuc2lnbmFsO1xuXG4gICAgaWYgKCEoaWQgaW4gR29kLmNsdXN0ZXJzX2RiKSlcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihpZCArICcgaWQgdW5rbm93bicpLCB7fSk7XG5cbiAgICB2YXIgcHJvYyA9IEdvZC5jbHVzdGVyc19kYltpZF07XG5cbiAgICAvL0dvZC5ub3RpZnkoJ3NlbmQgc2lnbmFsICcgKyBzaWduYWwsIHByb2MsIHRydWUpO1xuXG4gICAgdHJ5IHtcbiAgICAgIHByb2Nlc3Mua2lsbChHb2QuY2x1c3RlcnNfZGJbaWRdLnByb2Nlc3MucGlkLCBzaWduYWwpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignRXJyb3Igd2hlbiBzZW5kaW5nIHNpZ25hbCAoc2lnbmFsIHVua25vd24pJyksIHt9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNiKG51bGwsIEdvZC5nZXRGb3JtYXRlZFByb2Nlc3NlcygpKTtcbiAgfTtcblxuICAvKipcbiAgICogU2VuZCBzeXN0ZW0gc2lnbmFsIHRvIGFsbCBwcm9jZXNzZXMgYnkgbmFtZVxuICAgKiBAbWV0aG9kIHNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lXG4gICAqIEBwYXJhbSB7fSBvcHRzXG4gICAqIEBwYXJhbSB7fSBjYlxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBHb2Quc2VuZFNpZ25hbFRvUHJvY2Vzc05hbWUgPSBmdW5jdGlvbiAob3B0cywgY2IpIHtcbiAgICB2YXIgcHJvY2Vzc2VzID0gR29kLmZpbmRCeU5hbWUob3B0cy5wcm9jZXNzX25hbWUpO1xuICAgIHZhciBzaWduYWwgPSBvcHRzLnNpZ25hbDtcblxuICAgIGlmIChwcm9jZXNzZXMgJiYgcHJvY2Vzc2VzLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignVW5rbm93biBwcm9jZXNzIG5hbWUnKSwge30pO1xuXG4gICAgZWFjaExpbWl0KHByb2Nlc3NlcywgY3N0LkNPTkNVUlJFTlRfQUNUSU9OUywgZnVuY3Rpb24gKHByb2MsIG5leHQpIHtcbiAgICAgIGlmIChwcm9jLnBtMl9lbnYuc3RhdHVzID09IGNzdC5PTkxJTkVfU1RBVFVTIHx8IHByb2MucG0yX2Vudi5zdGF0dXMgPT0gY3N0LkxBVU5DSElOR19TVEFUVVMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBwcm9jZXNzLmtpbGwocHJvYy5wcm9jZXNzLnBpZCwgc2lnbmFsKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHJldHVybiBuZXh0KGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gc2V0VGltZW91dChuZXh0LCAyMDApO1xuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihlcnIpLCB7fSk7XG4gICAgICByZXR1cm4gY2IobnVsbCwgR29kLmdldEZvcm1hdGVkUHJvY2Vzc2VzKCkpO1xuICAgIH0pO1xuXG4gIH07XG5cbiAgLyoqXG4gICAqIFN0b3Agd2F0Y2hpbmcgZGFlbW9uXG4gICAqIEBtZXRob2Qgc3RvcFdhdGNoXG4gICAqIEBwYXJhbSB7fSBtZXRob2RcbiAgICogQHBhcmFtIHt9IHZhbHVlXG4gICAqIEBwYXJhbSB7fSBmblxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBHb2Quc3RvcFdhdGNoID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUsIGZuKSB7XG4gICAgdmFyIGVudiA9IG51bGw7XG5cbiAgICBpZiAobWV0aG9kID09ICdzdG9wQWxsJyB8fCBtZXRob2QgPT0gJ2RlbGV0ZUFsbCcpIHtcbiAgICAgIHZhciBwcm9jZXNzZXMgPSBHb2QuZ2V0Rm9ybWF0ZWRQcm9jZXNzZXMoKTtcblxuICAgICAgcHJvY2Vzc2VzLmZvckVhY2goZnVuY3Rpb24gKHByb2MpIHtcbiAgICAgICAgR29kLmNsdXN0ZXJzX2RiW3Byb2MucG1faWRdLnBtMl9lbnYud2F0Y2ggPSBmYWxzZTtcbiAgICAgICAgR29kLndhdGNoLmRpc2FibGUocHJvYy5wbTJfZW52KTtcbiAgICAgIH0pO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgaWYgKG1ldGhvZC5pbmRleE9mKCdQcm9jZXNzSWQnKSAhPT0gLTEpIHtcbiAgICAgICAgZW52ID0gR29kLmNsdXN0ZXJzX2RiW3ZhbHVlXTtcbiAgICAgIH0gZWxzZSBpZiAobWV0aG9kLmluZGV4T2YoJ1Byb2Nlc3NOYW1lJykgIT09IC0xKSB7XG4gICAgICAgIGVudiA9IEdvZC5jbHVzdGVyc19kYltHb2QuZmluZEJ5TmFtZSh2YWx1ZSldO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW52KSB7XG4gICAgICAgIEdvZC53YXRjaC5kaXNhYmxlKGVudi5wbTJfZW52KTtcbiAgICAgICAgZW52LnBtMl9lbnYud2F0Y2ggPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZuKG51bGwsIHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBUb2dnbGUgd2F0Y2hpbmcgZGFlbW9uXG4gICAqIEBtZXRob2QgdG9nZ2xlV2F0Y2hcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZFxuICAgKiBAcGFyYW0ge09iamVjdH0gYXBwbGljYXRpb24gZW52aXJvbm1lbnQsIHNob3VsZCBpbmNsdWRlIGlkXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBHb2QudG9nZ2xlV2F0Y2ggPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSwgZm4pIHtcbiAgICB2YXIgZW52ID0gbnVsbDtcblxuICAgIGlmIChtZXRob2QgPT0gJ3Jlc3RhcnRQcm9jZXNzSWQnKSB7XG4gICAgICBlbnYgPSBHb2QuY2x1c3RlcnNfZGJbdmFsdWUuaWRdO1xuICAgIH0gZWxzZSBpZiAobWV0aG9kID09ICdyZXN0YXJ0UHJvY2Vzc05hbWUnKSB7XG4gICAgICBlbnYgPSBHb2QuY2x1c3RlcnNfZGJbR29kLmZpbmRCeU5hbWUodmFsdWUpXTtcbiAgICB9XG5cbiAgICBpZiAoZW52KSB7XG4gICAgICBlbnYucG0yX2Vudi53YXRjaCA9ICFlbnYucG0yX2Vudi53YXRjaDtcbiAgICAgIGlmIChlbnYucG0yX2Vudi53YXRjaClcbiAgICAgICAgR29kLndhdGNoLmVuYWJsZShlbnYucG0yX2Vudik7XG4gICAgICBlbHNlXG4gICAgICAgIEdvZC53YXRjaC5kaXNhYmxlKGVudi5wbTJfZW52KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZm4obnVsbCwgeyBzdWNjZXNzOiB0cnVlIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTdGFydCBXYXRjaFxuICAgKiBAbWV0aG9kIHN0YXJ0V2F0Y2hcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZFxuICAgKiBAcGFyYW0ge09iamVjdH0gYXBwbGljYXRpb24gZW52aXJvbm1lbnQsIHNob3VsZCBpbmNsdWRlIGlkXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBHb2Quc3RhcnRXYXRjaCA9IGZ1bmN0aW9uIChtZXRob2QsIHZhbHVlLCBmbikge1xuICAgIHZhciBlbnYgPSBudWxsO1xuXG4gICAgaWYgKG1ldGhvZCA9PSAncmVzdGFydFByb2Nlc3NJZCcpIHtcbiAgICAgIGVudiA9IEdvZC5jbHVzdGVyc19kYlt2YWx1ZS5pZF07XG4gICAgfSBlbHNlIGlmIChtZXRob2QgPT0gJ3Jlc3RhcnRQcm9jZXNzTmFtZScpIHtcbiAgICAgIGVudiA9IEdvZC5jbHVzdGVyc19kYltHb2QuZmluZEJ5TmFtZSh2YWx1ZSldO1xuICAgIH1cblxuICAgIGlmIChlbnYpIHtcbiAgICAgIGlmIChlbnYucG0yX2Vudi53YXRjaClcbiAgICAgICAgcmV0dXJuIGZuKG51bGwsIHsgc3VjY2VzczogdHJ1ZSwgbm90cmVzdGFydGVkOiB0cnVlIH0pO1xuXG4gICAgICBHb2Qud2F0Y2guZW5hYmxlKGVudi5wbTJfZW52KTtcbiAgICAgIC8vZW52LnBtMl9lbnYuZW52LndhdGNoID0gdHJ1ZTtcbiAgICAgIGVudi5wbTJfZW52LndhdGNoID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZm4obnVsbCwgeyBzdWNjZXNzOiB0cnVlIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIHJlbG9hZExvZ3NcbiAgICogQHBhcmFtIHt9IG9wdHNcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm4gQ2FsbEV4cHJlc3Npb25cbiAgICovXG4gIEdvZC5yZWxvYWRMb2dzID0gZnVuY3Rpb24gKG9wdHMsIGNiKSB7XG4gICAgY29uc29sZS5sb2coJ1JlbG9hZGluZyBsb2dzLi4uJyk7XG4gICAgdmFyIHByb2Nlc3NJZHMgPSBPYmplY3Qua2V5cyhHb2QuY2x1c3RlcnNfZGIpO1xuXG4gICAgcHJvY2Vzc0lkcy5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgdmFyIGNsdXN0ZXIgPSBHb2QuY2x1c3RlcnNfZGJbaWRdO1xuXG4gICAgICBjb25zb2xlLmxvZygnUmVsb2FkaW5nIGxvZ3MgZm9yIHByb2Nlc3MgaWQgJWQnLCBpZCk7XG5cbiAgICAgIGlmIChjbHVzdGVyICYmIGNsdXN0ZXIucG0yX2Vudikge1xuICAgICAgICAvLyBDbHVzdGVyIG1vZGVcbiAgICAgICAgaWYgKGNsdXN0ZXIuc2VuZCAmJiBjbHVzdGVyLnBtMl9lbnYuZXhlY19tb2RlID09ICdjbHVzdGVyX21vZGUnKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNsdXN0ZXIuc2VuZCh7XG4gICAgICAgICAgICAgIHR5cGU6ICdsb2c6cmVsb2FkJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UgfHwgZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEZvcmsgbW9kZVxuICAgICAgICBlbHNlIGlmIChjbHVzdGVyLl9yZWxvYWRMb2dzKSB7XG4gICAgICAgICAgY2x1c3Rlci5fcmVsb2FkTG9ncyhmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSBHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY2IobnVsbCwge30pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZW5kIExpbmUgVG8gU3RkaW5cbiAgICogQG1ldGhvZCBzZW5kTGluZVRvU3RkaW5cbiAgICogQHBhcmFtIE9iamVjdCBwYWNrZXRcbiAgICogQHBhcmFtIFN0cmluZyBwbV9pZCBQcm9jZXNzIElEXG4gICAqIEBwYXJhbSBTdHJpbmcgbGluZSAgTGluZSB0byBzZW5kIHRvIHByb2Nlc3Mgc3RkaW5cbiAgICovXG4gIEdvZC5zZW5kTGluZVRvU3RkaW4gPSBmdW5jdGlvbiAocGFja2V0LCBjYikge1xuICAgIGlmICh0eXBlb2YgKHBhY2tldC5wbV9pZCkgPT0gJ3VuZGVmaW5lZCcgfHwgIXBhY2tldC5saW5lKVxuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKCdwbV9pZCBvciBsaW5lIGZpZWxkIG1pc3NpbmcnKSwge30pO1xuXG4gICAgdmFyIHBtX2lkID0gcGFja2V0LnBtX2lkO1xuICAgIHZhciBsaW5lID0gcGFja2V0LmxpbmU7XG5cbiAgICB2YXIgcHJvYyA9IEdvZC5jbHVzdGVyc19kYltwbV9pZF07XG5cbiAgICBpZiAoIXByb2MpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ1Byb2Nlc3Mgd2l0aCBJRCA8JyArIHBtX2lkICsgJz4gdW5rbm93bi4nKSwge30pO1xuXG4gICAgaWYgKHByb2MucG0yX2Vudi5leGVjX21vZGUgPT0gJ2NsdXN0ZXJfbW9kZScpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ0Nhbm5vdCBzZW5kIGxpbmUgdG8gcHJvY2Vzc2VzIGluIGNsdXN0ZXIgbW9kZScpLCB7fSk7XG5cbiAgICBpZiAocHJvYy5wbTJfZW52LnN0YXR1cyAhPSBjc3QuT05MSU5FX1NUQVRVUyAmJiBwcm9jLnBtMl9lbnYuc3RhdHVzICE9IGNzdC5MQVVOQ0hJTkdfU1RBVFVTKVxuICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKCdQcm9jZXNzIHdpdGggSUQgPCcgKyBwbV9pZCArICc+IG9mZmxpbmUuJyksIHt9KTtcblxuICAgIHRyeSB7XG4gICAgICBwcm9jLnN0ZGluLndyaXRlKGxpbmUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNiKG51bGwsIHtcbiAgICAgICAgICBwbV9pZDogcG1faWQsXG4gICAgICAgICAgbGluZTogbGluZVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihlKSwge30pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge29iamVjdH0gcGFja2V0XG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNiXG4gICAqL1xuICBHb2Quc2VuZERhdGFUb1Byb2Nlc3NJZCA9IGZ1bmN0aW9uIChwYWNrZXQsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiAocGFja2V0LmlkKSA9PSAndW5kZWZpbmVkJyB8fFxuICAgICAgdHlwZW9mIChwYWNrZXQuZGF0YSkgPT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICFwYWNrZXQudG9waWMpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ0lELCBEQVRBIG9yIFRPUElDIGZpZWxkIGlzIG1pc3NpbmcnKSwge30pO1xuXG4gICAgdmFyIHBtX2lkID0gcGFja2V0LmlkO1xuICAgIHZhciBkYXRhID0gcGFja2V0LmRhdGE7XG5cbiAgICB2YXIgcHJvYyA9IEdvZC5jbHVzdGVyc19kYltwbV9pZF07XG5cbiAgICBpZiAoIXByb2MpXG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ1Byb2Nlc3Mgd2l0aCBJRCA8JyArIHBtX2lkICsgJz4gdW5rbm93bi4nKSwge30pO1xuXG4gICAgaWYgKHByb2MucG0yX2Vudi5zdGF0dXMgIT0gY3N0Lk9OTElORV9TVEFUVVMgJiYgcHJvYy5wbTJfZW52LnN0YXR1cyAhPSBjc3QuTEFVTkNISU5HX1NUQVRVUylcbiAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignUHJvY2VzcyB3aXRoIElEIDwnICsgcG1faWQgKyAnPiBvZmZsaW5lLicpLCB7fSk7XG5cbiAgICB0cnkge1xuICAgICAgcHJvYy5zZW5kKHBhY2tldCk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoZSksIHt9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2IobnVsbCwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHBhY2tldFxuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZW5kIE1lc3NhZ2UgdG8gUHJvY2VzcyBieSBpZCBvciBuYW1lXG4gICAqIEBtZXRob2QgbXNnUHJvY2Vzc1xuICAgKiBAcGFyYW0ge30gY21kXG4gICAqIEBwYXJhbSB7fSBjYlxuICAgKiBAcmV0dXJuIExpdGVyYWxcbiAgICovXG4gIEdvZC5tc2dQcm9jZXNzID0gZnVuY3Rpb24gKGNtZCwgY2IpIHtcbiAgICBpZiAoJ2lkJyBpbiBjbWQpIHtcbiAgICAgIHZhciBpZCA9IGNtZC5pZDtcbiAgICAgIGlmICghKGlkIGluIEdvZC5jbHVzdGVyc19kYikpXG4gICAgICAgIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihpZCArICcgaWQgdW5rbm93bicpLCB7fSk7XG4gICAgICB2YXIgcHJvYyA9IEdvZC5jbHVzdGVyc19kYltpZF07XG5cbiAgICAgIHZhciBhY3Rpb25fZXhpc3QgPSBmYWxzZTtcblxuICAgICAgcHJvYy5wbTJfZW52LmF4bV9hY3Rpb25zLmZvckVhY2goZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICBpZiAoYWN0aW9uLmFjdGlvbl9uYW1lID09IGNtZC5tc2cpIHtcbiAgICAgICAgICBhY3Rpb25fZXhpc3QgPSB0cnVlO1xuICAgICAgICAgIC8vIFJlc2V0IG91dHB1dCBidWZmZXJcbiAgICAgICAgICBhY3Rpb24ub3V0cHV0ID0gW107XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKGFjdGlvbl9leGlzdCA9PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gY2IoR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoJ0FjdGlvbiBkb2VzblxcJ3QgZXhpc3QgJyArIGNtZC5tc2cgKyAnIGZvciAnICsgcHJvYy5wbTJfZW52Lm5hbWUpLCB7fSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9jLnBtMl9lbnYuc3RhdHVzID09IGNzdC5PTkxJTkVfU1RBVFVTIHx8IHByb2MucG0yX2Vudi5zdGF0dXMgPT0gY3N0LkxBVU5DSElOR19TVEFUVVMpIHtcbiAgICAgICAgLypcbiAgICAgICAgICogU2VuZCBtZXNzYWdlXG4gICAgICAgICAqL1xuICAgICAgICBpZiAoY21kLm9wdHMgPT0gbnVsbCAmJiAhY21kLnV1aWQpXG4gICAgICAgICAgcHJvYy5zZW5kKGNtZC5tc2cpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcHJvYy5zZW5kKGNtZCk7XG5cbiAgICAgICAgcmV0dXJuIGNiKG51bGwsIHsgcHJvY2Vzc19jb3VudDogMSwgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIGNiKEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKGlkICsgJyA6IGlkIG9mZmxpbmUnKSwge30pO1xuICAgIH1cblxuICAgIGVsc2UgaWYgKCduYW1lJyBpbiBjbWQpIHtcbiAgICAgIC8qXG4gICAgICAgKiBBcyBuYW1lcyBhcmUgbm90IHVuaXF1ZSBpbiBjYXNlIG9mIGNsdXN0ZXIsIHRoaXNcbiAgICAgICAqIHdpbGwgc2VuZCBtc2cgdG8gYWxsIHByb2Nlc3MgbWF0Y2hpbmcgICduYW1lJ1xuICAgICAgICovXG4gICAgICB2YXIgbmFtZSA9IGNtZC5uYW1lO1xuICAgICAgdmFyIGFyciA9IE9iamVjdC5rZXlzKEdvZC5jbHVzdGVyc19kYik7XG4gICAgICB2YXIgc2VudCA9IDA7XG5cbiAgICAgIChmdW5jdGlvbiBleChhcnIpIHtcbiAgICAgICAgaWYgKGFyclswXSA9PSBudWxsIHx8ICFhcnIpIHtcbiAgICAgICAgICByZXR1cm4gY2IobnVsbCwge1xuICAgICAgICAgICAgcHJvY2Vzc19jb3VudDogc2VudCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpZCA9IGFyclswXTtcblxuICAgICAgICBpZiAoIUdvZC5jbHVzdGVyc19kYltpZF0gfHwgIUdvZC5jbHVzdGVyc19kYltpZF0ucG0yX2Vudikge1xuICAgICAgICAgIGFyci5zaGlmdCgpO1xuICAgICAgICAgIHJldHVybiBleChhcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHByb2NfZW52ID0gR29kLmNsdXN0ZXJzX2RiW2lkXS5wbTJfZW52O1xuXG4gICAgICAgIGNvbnN0IGlzQWN0aW9uQXZhaWxhYmxlID0gcHJvY19lbnYuYXhtX2FjdGlvbnMuZmluZChhY3Rpb24gPT4gYWN0aW9uLmFjdGlvbl9uYW1lID09PSBjbWQubXNnKSAhPT0gdW5kZWZpbmVkXG5cbiAgICAgICAgLy8gaWYgYWN0aW9uIGRvZXNuJ3QgZXhpc3QgZm9yIHRoaXMgYXBwXG4gICAgICAgIC8vIHRyeSB3aXRoIHRoZSBuZXh0IG9uZVxuICAgICAgICBpZiAoaXNBY3Rpb25BdmFpbGFibGUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgYXJyLnNoaWZ0KCk7XG4gICAgICAgICAgcmV0dXJuIGV4KGFycik7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGlmICgocC5iYXNlbmFtZShwcm9jX2Vudi5wbV9leGVjX3BhdGgpID09IG5hbWUgfHxcbiAgICAgICAgICBwcm9jX2Vudi5uYW1lID09IG5hbWUgfHxcbiAgICAgICAgICBwcm9jX2Vudi5uYW1lc3BhY2UgPT0gbmFtZSB8fFxuICAgICAgICAgIG5hbWUgPT0gJ2FsbCcpICYmXG4gICAgICAgICAgKHByb2NfZW52LnN0YXR1cyA9PSBjc3QuT05MSU5FX1NUQVRVUyB8fFxuICAgICAgICAgICAgcHJvY19lbnYuc3RhdHVzID09IGNzdC5MQVVOQ0hJTkdfU1RBVFVTKSkge1xuXG4gICAgICAgICAgcHJvY19lbnYuYXhtX2FjdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgICAgICBpZiAoYWN0aW9uLmFjdGlvbl9uYW1lID09IGNtZC5tc2cpIHtcbiAgICAgICAgICAgICAgYWN0aW9uX2V4aXN0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChhY3Rpb25fZXhpc3QgPT0gZmFsc2UgfHwgcHJvY19lbnYuYXhtX2FjdGlvbnMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIGFyci5zaGlmdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGV4KGFycik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNtZC5vcHRzID09IG51bGwpXG4gICAgICAgICAgICBHb2QuY2x1c3RlcnNfZGJbaWRdLnNlbmQoY21kLm1zZyk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgR29kLmNsdXN0ZXJzX2RiW2lkXS5zZW5kKGNtZCk7XG5cbiAgICAgICAgICBzZW50Kys7XG4gICAgICAgICAgYXJyLnNoaWZ0KCk7XG4gICAgICAgICAgcmV0dXJuIGV4KGFycik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgYXJyLnNoaWZ0KCk7XG4gICAgICAgICAgcmV0dXJuIGV4KGFycik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSkoYXJyKTtcbiAgICB9XG5cbiAgICBlbHNlIHJldHVybiBjYihHb2QubG9nQW5kR2VuZXJhdGVFcnJvcignbWV0aG9kIHJlcXVpcmVzIG5hbWUgb3IgaWQgZmllbGQnKSwge30pO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBnZXRWZXJzaW9uXG4gICAqIEBwYXJhbSB7fSBlbnZcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm4gQ2FsbEV4cHJlc3Npb25cbiAgICovXG4gIEdvZC5nZXRWZXJzaW9uID0gZnVuY3Rpb24gKGVudiwgY2IpIHtcbiAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjYihudWxsLCBwa2cudmVyc2lvbik7XG4gICAgfSk7XG4gIH07XG5cbiAgR29kLm1vbml0b3IgPSBmdW5jdGlvbiBNb25pdG9yKHBtX2lkLCBjYikge1xuICAgIGlmICghR29kLmNsdXN0ZXJzX2RiW3BtX2lkXSB8fCAhR29kLmNsdXN0ZXJzX2RiW3BtX2lkXS5wbTJfZW52KVxuICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcignVW5rbm93biBwbV9pZCcpKTtcblxuICAgIEdvZC5jbHVzdGVyc19kYltwbV9pZF0ucG0yX2Vudi5fa21fbW9uaXRvcmVkID0gdHJ1ZTtcbiAgICByZXR1cm4gY2IobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBwbV9pZDogcG1faWQgfSk7XG4gIH1cblxuICBHb2QudW5tb25pdG9yID0gZnVuY3Rpb24gTW9uaXRvcihwbV9pZCwgY2IpIHtcbiAgICBpZiAoIUdvZC5jbHVzdGVyc19kYltwbV9pZF0gfHwgIUdvZC5jbHVzdGVyc19kYltwbV9pZF0ucG0yX2VudilcbiAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoJ1Vua25vd24gcG1faWQnKSk7XG5cbiAgICBHb2QuY2x1c3RlcnNfZGJbcG1faWRdLnBtMl9lbnYuX2ttX21vbml0b3JlZCA9IGZhbHNlO1xuICAgIHJldHVybiBjYihudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIHBtX2lkOiBwbV9pZCB9KTtcbiAgfVxuXG4gIEdvZC5nZXRSZXBvcnQgPSBmdW5jdGlvbiAoYXJnLCBjYikge1xuICAgIHZhciByZXBvcnQgPSB7XG4gICAgICBwbTJfdmVyc2lvbjogcGtnLnZlcnNpb24sXG4gICAgICBub2RlX3ZlcnNpb246ICdOL0EnLFxuICAgICAgbm9kZV9wYXRoOiBwcm9jZXNzLmVudlsnXyddIHx8ICdub3QgZm91bmQnLFxuICAgICAgYXJndjA6IHByb2Nlc3MuYXJndjAsXG4gICAgICBhcmd2OiBwcm9jZXNzLmFyZ3YsXG4gICAgICB1c2VyOiBwcm9jZXNzLmVudi5VU0VSLFxuICAgICAgdWlkOiAoY3N0LklTX1dJTkRPV1MgPT09IGZhbHNlICYmIHByb2Nlc3MuZ2V0ZXVpZCkgPyBwcm9jZXNzLmdldGV1aWQoKSA6ICdOL0EnLFxuICAgICAgZ2lkOiAoY3N0LklTX1dJTkRPV1MgPT09IGZhbHNlICYmIHByb2Nlc3MuZ2V0ZWdpZCkgPyBwcm9jZXNzLmdldGVnaWQoKSA6ICdOL0EnLFxuICAgICAgZW52OiBwcm9jZXNzLmVudixcbiAgICAgIG1hbmFnZWRfYXBwczogT2JqZWN0LmtleXMoR29kLmNsdXN0ZXJzX2RiKS5sZW5ndGgsXG4gICAgICBzdGFydGVkX2F0OiBHb2Quc3RhcnRlZF9hdFxuICAgIH07XG5cbiAgICBpZiAocHJvY2Vzcy52ZXJzaW9ucyAmJiBwcm9jZXNzLnZlcnNpb25zLm5vZGUpIHtcbiAgICAgIHJlcG9ydC5ub2RlX3ZlcnNpb24gPSBwcm9jZXNzLnZlcnNpb25zLm5vZGU7XG4gICAgfVxuXG4gICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gY2IobnVsbCwgcmVwb3J0KTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlckJhZFByb2Nlc3MocHJvKSB7XG4gIGlmIChwcm8ucG0yX2Vudi5zdGF0dXMgIT09IGNzdC5PTkxJTkVfU1RBVFVTKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHByby5wbTJfZW52LmF4bV9vcHRpb25zICYmIHByby5wbTJfZW52LmF4bV9vcHRpb25zLnBpZCkge1xuICAgIGlmIChpc05hTihwcm8ucG0yX2Vudi5heG1fb3B0aW9ucy5waWQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGdldFByb2Nlc3NJZChwcm8pIHtcbiAgdmFyIHBpZCA9IHByby5waWRcblxuICBpZiAocHJvLnBtMl9lbnYuYXhtX29wdGlvbnMgJiYgcHJvLnBtMl9lbnYuYXhtX29wdGlvbnMucGlkKSB7XG4gICAgcGlkID0gcHJvLnBtMl9lbnYuYXhtX29wdGlvbnMucGlkO1xuICB9XG5cbiAgcmV0dXJuIHBpZFxufVxuIl19