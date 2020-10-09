"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _debug = _interopRequireDefault(require("debug"));

var _Common = _interopRequireDefault(require("./Common.js"));

var _InteractorClient = _interopRequireDefault(require("@pm2/agent/src/InteractorClient"));

var _pm2AxonRpc = _interopRequireDefault(require("pm2-axon-rpc"));

var _forEach = _interopRequireDefault(require("async/forEach"));

var _pm2Axon = _interopRequireDefault(require("pm2-axon"));

var _util = _interopRequireDefault(require("util"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _package = _interopRequireDefault(require("../package.json"));

var _which = _interopRequireDefault(require("./tools/which"));

var _constants = _interopRequireDefault(require("../constants"));

var _Daemon = _interopRequireDefault(require("./Daemon"));

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _VersionCheck = _interopRequireDefault(require("./VersionCheck"));

var _os = _interopRequireDefault(require("os"));

var _child_process = require("child_process");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
var debug = (0, _debug["default"])('pm2:client');

function noop() {}

var Client = function Client(opts) {
  if (!opts) opts = {};
  if (!opts.conf) this.conf = _constants["default"];else {
    this.conf = opts.conf;
  }
  this.sub_sock = {};
  this.daemon_mode = typeof opts.daemon_mode === 'undefined' ? true : opts.daemon_mode;
  this.pm2_home = this.conf.PM2_ROOT_PATH;
  this.secret_key = opts.secret_key;
  this.public_key = opts.public_key;
  this.machine_name = opts.machine_name; // Create all folders and files needed
  // Client depends to that to interact with PM2 properly

  this.initFileStructure(this.conf);
  debug('Using RPC file %s', this.conf.DAEMON_RPC_PORT);
  debug('Using PUB file %s', this.conf.DAEMON_PUB_PORT);
  this.rpc_socket_file = this.conf.DAEMON_RPC_PORT;
  this.pub_socket_file = this.conf.DAEMON_PUB_PORT;
}; // @breaking change (noDaemonMode has been drop)
// @todo ret err


Client.prototype.start = function (cb) {
  var that = this;
  this.pingDaemon(function (daemonAlive) {
    if (daemonAlive === true) return that.launchRPC(function (err, meta) {
      return cb(null, {
        daemon_mode: that.conf.daemon_mode,
        new_pm2_instance: false,
        rpc_socket_file: that.rpc_socket_file,
        pub_socket_file: that.pub_socket_file,
        pm2_home: that.pm2_home
      });
    });
    /**
     * No Daemon mode
     */

    if (that.daemon_mode === false) {
      var daemon = new _Daemon["default"]({
        pub_socket_file: that.conf.DAEMON_PUB_PORT,
        rpc_socket_file: that.conf.DAEMON_RPC_PORT,
        pid_file: that.conf.PM2_PID_FILE_PATH,
        ignore_signals: true
      });
      console.log('Launching in no daemon mode');
      daemon.innerStart(function () {
        _InteractorClient["default"].launchAndInteract(that.conf, {
          machine_name: that.machine_name,
          public_key: that.public_key,
          secret_key: that.secret_key,
          pm2_version: _package["default"].version
        }, function (err, data, interactor_proc) {
          that.interactor_process = interactor_proc;
        });

        that.launchRPC(function (err, meta) {
          return cb(null, {
            daemon_mode: that.conf.daemon_mode,
            new_pm2_instance: true,
            rpc_socket_file: that.rpc_socket_file,
            pub_socket_file: that.pub_socket_file,
            pm2_home: that.pm2_home
          });
        });
      });
      return false;
    }
    /**
     * Daemon mode
     */


    that.launchDaemon(function (err, child) {
      if (err) {
        _Common["default"].printError(err);

        return cb ? cb(err) : process.exit(that.conf.ERROR_EXIT);
      }

      if (!process.env.PM2_DISCRETE_MODE) _Common["default"].printOut(that.conf.PREFIX_MSG + 'PM2 Successfully daemonized');
      that.launchRPC(function (err, meta) {
        return cb(null, {
          daemon_mode: that.conf.daemon_mode,
          new_pm2_instance: true,
          rpc_socket_file: that.rpc_socket_file,
          pub_socket_file: that.pub_socket_file,
          pm2_home: that.pm2_home
        });
      });
    });
  });
}; // Init file structure of pm2_home
// This includes
// - pm2 pid and log path
// - rpc and pub socket for command execution


Client.prototype.initFileStructure = function (opts) {
  if (!_fs["default"].existsSync(opts.DEFAULT_LOG_PATH)) {
    try {
      _mkdirp["default"].sync(opts.DEFAULT_LOG_PATH);
    } catch (e) {
      console.error(e.stack || e);
    }
  }

  if (!_fs["default"].existsSync(opts.DEFAULT_PID_PATH)) {
    try {
      _mkdirp["default"].sync(opts.DEFAULT_PID_PATH);
    } catch (e) {
      console.error(e.stack || e);
    }
  }

  if (!_fs["default"].existsSync(opts.PM2_MODULE_CONF_FILE)) {
    try {
      _fs["default"].writeFileSync(opts.PM2_MODULE_CONF_FILE, "{}");
    } catch (e) {
      console.error(e.stack || e);
    }
  }

  if (!_fs["default"].existsSync(opts.DEFAULT_MODULE_PATH)) {
    try {
      _mkdirp["default"].sync(opts.DEFAULT_MODULE_PATH);
    } catch (e) {
      console.error(e.stack || e);
    }
  }

  if (process.env.PM2_DISCRETE_MODE) {
    try {
      _fs["default"].writeFileSync(_path["default"].join(opts.PM2_HOME, 'touch'), Date.now().toString());
    } catch (e) {
      debug(e.stack || e);
    }
  }

  if (!process.env.PM2_PROGRAMMATIC && !_fs["default"].existsSync(_path["default"].join(opts.PM2_HOME, 'touch'))) {
    (0, _VersionCheck["default"])({
      state: 'install',
      version: _package["default"].version
    });

    var dt = _fs["default"].readFileSync(_path["default"].join(__dirname, opts.PM2_BANNER));

    console.log(dt.toString());

    try {
      _fs["default"].writeFileSync(_path["default"].join(opts.PM2_HOME, 'touch'), Date.now().toString());
    } catch (e) {
      debug(e.stack || e);
    }
  }
};

Client.prototype.close = function (cb) {
  var that = this;
  (0, _forEach["default"])([that.disconnectRPC.bind(that), that.disconnectBus.bind(that)], function (fn, next) {
    fn(next);
  }, cb);
};
/**
 * Launch the Daemon by forking this same file
 * The method Client.remoteWrapper will be called
 *
 * @method launchDaemon
 * @param {Object} opts
 * @param {Object} [opts.interactor=true] allow to disable interaction on launch
 */


Client.prototype.launchDaemon = function (opts, cb) {
  if (typeof opts == 'function') {
    cb = opts;
    opts = {
      interactor: true
    };
  }

  var that = this;

  var ClientJS = _path["default"].resolve(_path["default"].dirname(module.filename), 'Daemon.js');

  var node_args = [];
  var out, err; // if (process.env.TRAVIS) {
  //   // Redirect PM2 internal err and out to STDERR STDOUT when running with Travis
  //   out = 1;
  //   err = 2;
  // }
  // else {

  out = _fs["default"].openSync(that.conf.PM2_LOG_FILE_PATH, 'a'), err = _fs["default"].openSync(that.conf.PM2_LOG_FILE_PATH, 'a'); //}

  if (this.conf.LOW_MEMORY_ENVIRONMENT) {
    node_args.push('--gc-global'); // Does full GC (smaller memory footprint)

    node_args.push('--max-old-space-size=' + Math.floor(_os["default"].totalmem() / 1024 / 1024));
  } // Node.js tuning for better performance
  //node_args.push('--expose-gc'); // Allows manual GC in the code

  /**
   * Add node [arguments] depending on PM2_NODE_OPTIONS env variable
   */


  if (process.env.PM2_NODE_OPTIONS) node_args = node_args.concat(process.env.PM2_NODE_OPTIONS.split(' '));
  node_args.push(ClientJS);
  if (!process.env.PM2_DISCRETE_MODE) _Common["default"].printOut(that.conf.PREFIX_MSG + 'Spawning PM2 daemon with pm2_home=' + this.pm2_home);
  var interpreter = 'node';
  if ((0, _which["default"])('node') == null) interpreter = process.execPath;
  var spawnEnv = {
    'SILENT': that.conf.DEBUG ? !that.conf.DEBUG : true,
    'PM2_HOME': that.pm2_home
  };

  _util["default"].inherits(spawnEnv, process.env);

  var child = (0, _child_process.spawn)(interpreter, node_args, {
    detached: true,
    cwd: that.conf.cwd || process.cwd(),
    env: spawnEnv,
    stdio: ['ipc', out, err]
  });

  function onError(e) {
    console.error(e.message || e);
    return cb ? cb(e.message || e) : false;
  }

  child.once('error', onError);
  child.unref();
  child.once('message', function (msg) {
    debug('PM2 daemon launched with return message: ', msg);
    child.removeListener('error', onError);
    child.disconnect();
    if (opts && opts.interactor == false) return cb(null, child);
    if (process.env.PM2_NO_INTERACTION == 'true') return cb(null, child);
    /**
     * Here the Keymetrics agent is launched automaticcaly if
     * it has been already configured before (via pm2 link)
     */

    _InteractorClient["default"].launchAndInteract(that.conf, {
      machine_name: that.machine_name,
      public_key: that.public_key,
      secret_key: that.secret_key,
      pm2_version: _package["default"].version
    }, function (err, data, interactor_proc) {
      that.interactor_process = interactor_proc;
      return cb(null, child);
    });
  });
};
/**
 * Ping the daemon to know if it alive or not
 * @api public
 * @method pingDaemon
 * @param {} cb
 * @return
 */


Client.prototype.pingDaemon = function pingDaemon(cb) {
  var req = _pm2Axon["default"].socket('req', null);

  var client = new _pm2AxonRpc["default"].Client(req);
  var that = this;
  debug('[PING PM2] Trying to connect to server');
  client.sock.once('reconnect attempt', function () {
    client.sock.close();
    debug('Daemon not launched');
    process.nextTick(function () {
      return cb(false);
    });
  });
  client.sock.once('error', function (e) {
    if (e.code === 'EACCES') {
      _fs["default"].stat(that.conf.DAEMON_RPC_PORT, function (e, stats) {
        if (stats.uid === 0) {
          console.error(that.conf.PREFIX_MSG_ERR + 'Permission denied, to give access to current user:');
          console.log('$ sudo chown ' + process.env.USER + ':' + process.env.USER + ' ' + that.conf.DAEMON_RPC_PORT + ' ' + that.conf.DAEMON_PUB_PORT);
        } else console.error(that.conf.PREFIX_MSG_ERR + 'Permission denied, check permissions on ' + that.conf.DAEMON_RPC_PORT);

        process.exit(1);
      });
    } else console.error(e.message || e);
  });
  client.sock.once('connect', function () {
    client.sock.once('close', function () {
      return cb(true);
    });
    client.sock.close();
    debug('Daemon alive');
  });
  req.connect(this.rpc_socket_file);
};
/**
 * Methods to interact with the Daemon via RPC
 * This method wait to be connected to the Daemon
 * Once he's connected it trigger the command parsing (on ./bin/pm2 file, at the end)
 * @method launchRPC
 * @params {function} [cb]
 * @return
 */


Client.prototype.launchRPC = function launchRPC(cb) {
  var self = this;
  debug('Launching RPC client on socket file %s', this.rpc_socket_file);

  var req = _pm2Axon["default"].socket('req', null);

  this.client = new _pm2AxonRpc["default"].Client(req);

  var connectHandler = function connectHandler() {
    self.client.sock.removeListener('error', errorHandler);
    debug('RPC Connected to Daemon');

    if (cb) {
      setTimeout(function () {
        cb(null);
      }, 4);
    }
  };

  var errorHandler = function errorHandler(e) {
    self.client.sock.removeListener('connect', connectHandler);

    if (cb) {
      return cb(e);
    }
  };

  this.client.sock.once('connect', connectHandler);
  this.client.sock.once('error', errorHandler);
  this.client_sock = req.connect(this.rpc_socket_file);
};
/**
 * Methods to close the RPC connection
 * @callback cb
 */


Client.prototype.disconnectRPC = function disconnectRPC(cb) {
  var that = this;
  if (!cb) cb = noop;

  if (!this.client_sock || !this.client_sock.close) {
    this.client = null;
    return process.nextTick(function () {
      cb(new Error('SUB connection to PM2 is not launched'));
    });
  }

  if (this.client_sock.connected === false || this.client_sock.closing === true) {
    this.client = null;
    return process.nextTick(function () {
      cb(new Error('RPC already being closed'));
    });
  }

  try {
    var timer;
    that.client_sock.once('close', function () {
      clearTimeout(timer);
      that.client = null;
      debug('PM2 RPC cleanly closed');
      return cb(null, {
        msg: 'RPC Successfully closed'
      });
    });
    timer = setTimeout(function () {
      if (that.client_sock.destroy) that.client_sock.destroy();
      that.client = null;
      return cb(null, {
        msg: 'RPC Successfully closed via timeout'
      });
    }, 200);
    that.client_sock.close();
  } catch (e) {
    debug('Error while disconnecting RPC PM2', e.stack || e);
    return cb(e);
  }

  return false;
};

Client.prototype.launchBus = function launchEventSystem(cb) {
  var self = this;
  this.sub = _pm2Axon["default"].socket('sub-emitter', null);
  this.sub_sock = this.sub.connect(this.pub_socket_file);
  this.sub_sock.once('connect', function () {
    return cb(null, self.sub, self.sub_sock);
  });
};

Client.prototype.disconnectBus = function disconnectBus(cb) {
  if (!cb) cb = noop;
  var that = this;

  if (!this.sub_sock || !this.sub_sock.close) {
    that.sub = null;
    return process.nextTick(function () {
      cb(null, {
        msg: 'bus was not connected'
      });
    });
  }

  if (this.sub_sock.connected === false || this.sub_sock.closing === true) {
    that.sub = null;
    return process.nextTick(function () {
      cb(new Error('SUB connection is already being closed'));
    });
  }

  try {
    var timer;
    that.sub_sock.once('close', function () {
      that.sub = null;
      clearTimeout(timer);
      debug('PM2 PUB cleanly closed');
      return cb();
    });
    timer = setTimeout(function () {
      if (that.sub_sock.destroy) that.sub_sock.destroy();
      return cb();
    }, 200);
    this.sub_sock.close();
  } catch (e) {
    return cb(e);
  }
};
/**
 * Description
 * @method gestExposedMethods
 * @param {} cb
 * @return
 */


Client.prototype.getExposedMethods = function getExposedMethods(cb) {
  this.client.methods(cb);
};
/**
 * Description
 * @method executeRemote
 * @param {} method
 * @param {} env
 * @param {} fn
 * @return
 */


Client.prototype.executeRemote = function executeRemote(method, app_conf, fn) {
  var self = this; // stop watch on stop | env is the process id

  if (method.indexOf('stop') !== -1) {
    this.stopWatch(method, app_conf);
  } // stop watching when process is deleted
  else if (method.indexOf('delete') !== -1) {
      this.stopWatch(method, app_conf);
    } // stop everything on kill
    else if (method.indexOf('kill') !== -1) {
        this.stopWatch('deleteAll', app_conf);
      } else if (method.indexOf('restartProcessId') !== -1 && process.argv.indexOf('--watch') > -1) {
        delete app_conf.env.current_conf.watch;
        this.toggleWatch(method, app_conf);
      }

  if (!this.client || !this.client.call) {
    this.start(function (error) {
      if (error) {
        if (fn) return fn(error);
        console.error(error);
        return process.exit(0);
      }

      if (self.client) {
        return self.client.call(method, app_conf, fn);
      }
    });
    return false;
  }

  debug('Calling daemon method pm2:%s on rpc socket:%s', method, this.rpc_socket_file);
  return this.client.call(method, app_conf, fn);
};

Client.prototype.notifyGod = function (action_name, id, cb) {
  this.executeRemote('notifyByProcessId', {
    id: id,
    action_name: action_name,
    manually: true
  }, function () {
    debug('God notified');
    return cb ? cb() : false;
  });
};

Client.prototype.killDaemon = function killDaemon(fn) {
  var timeout;
  var that = this;

  function quit() {
    that.close(function () {
      return fn ? fn(null, {
        success: true
      }) : false;
    });
  } // under unix, we listen for signal (that is send by daemon to notify us that its shuting down)


  if (process.platform !== 'win32') {
    process.once('SIGQUIT', function () {
      debug('Received SIGQUIT from pm2 daemon');
      clearTimeout(timeout);
      quit();
    });
  } else {
    // if under windows, try to ping the daemon to see if it still here
    setTimeout(function () {
      that.pingDaemon(function (alive) {
        if (!alive) {
          clearTimeout(timeout);
          return quit();
        }
      });
    }, 250);
  }

  timeout = setTimeout(function () {
    quit();
  }, 3000); // Kill daemon

  this.executeRemote('killMe', {
    pid: process.pid
  });
};
/**
 * Description
 * @method toggleWatch
 * @param {String} pm2 method name
 * @param {Object} application environment, should include id
 * @param {Function} callback
 */


Client.prototype.toggleWatch = function toggleWatch(method, env, fn) {
  debug('Calling toggleWatch');
  this.client.call('toggleWatch', method, env, function () {
    return fn ? fn() : false;
  });
};
/**
 * Description
 * @method startWatch
 * @param {String} pm2 method name
 * @param {Object} application environment, should include id
 * @param {Function} callback
 */


Client.prototype.startWatch = function restartWatch(method, env, fn) {
  debug('Calling startWatch');
  this.client.call('startWatch', method, env, function () {
    return fn ? fn() : false;
  });
};
/**
 * Description
 * @method stopWatch
 * @param {String} pm2 method name
 * @param {Object} application environment, should include id
 * @param {Function} callback
 */


Client.prototype.stopWatch = function stopWatch(method, env, fn) {
  debug('Calling stopWatch');
  this.client.call('stopWatch', method, env, function () {
    return fn ? fn() : false;
  });
};

Client.prototype.getAllProcess = function (cb) {
  var found_proc = [];
  this.executeRemote('getMonitorData', {}, function (err, procs) {
    if (err) {
      _Common["default"].printError('Error retrieving process list: ' + err);

      return cb(err);
    }

    return cb(null, procs);
  });
};

Client.prototype.getAllProcessId = function (cb) {
  var found_proc = [];
  this.executeRemote('getMonitorData', {}, function (err, procs) {
    if (err) {
      _Common["default"].printError('Error retrieving process list: ' + err);

      return cb(err);
    }

    return cb(null, procs.map(function (proc) {
      return proc.pm_id;
    }));
  });
};

Client.prototype.getAllProcessIdWithoutModules = function (cb) {
  var found_proc = [];
  this.executeRemote('getMonitorData', {}, function (err, procs) {
    if (err) {
      _Common["default"].printError('Error retrieving process list: ' + err);

      return cb(err);
    }

    var proc_ids = procs.filter(function (proc) {
      return !proc.pm2_env.pmx_module;
    }).map(function (proc) {
      return proc.pm_id;
    });
    return cb(null, proc_ids);
  });
};

Client.prototype.getProcessIdByName = function (name, force_all, cb) {
  var found_proc = [];
  var full_details = {};

  if (typeof cb === 'undefined') {
    cb = force_all;
    force_all = false;
  }

  if (typeof name == 'number') name = name.toString();
  this.executeRemote('getMonitorData', {}, function (err, list) {
    if (err) {
      _Common["default"].printError('Error retrieving process list: ' + err);

      return cb(err);
    }

    list.forEach(function (proc) {
      if (proc.pm2_env.name == name || proc.pm2_env.pm_exec_path == _path["default"].resolve(name)) {
        found_proc.push(proc.pm_id);
        full_details[proc.pm_id] = proc;
      }
    });
    return cb(null, found_proc, full_details);
  });
};

Client.prototype.getProcessIdsByNamespace = function (namespace, force_all, cb) {
  var found_proc = [];
  var full_details = {};

  if (typeof cb === 'undefined') {
    cb = force_all;
    force_all = false;
  }

  if (typeof namespace == 'number') namespace = namespace.toString();
  this.executeRemote('getMonitorData', {}, function (err, list) {
    if (err) {
      _Common["default"].printError('Error retrieving process list: ' + err);

      return cb(err);
    }

    list.forEach(function (proc) {
      if (proc.pm2_env.namespace == namespace) {
        found_proc.push(proc.pm_id);
        full_details[proc.pm_id] = proc;
      }
    });
    return cb(null, found_proc, full_details);
  });
};

Client.prototype.getProcessByName = function (name, cb) {
  var found_proc = [];
  this.executeRemote('getMonitorData', {}, function (err, list) {
    if (err) {
      _Common["default"].printError('Error retrieving process list: ' + err);

      return cb(err);
    }

    list.forEach(function (proc) {
      if (proc.pm2_env.name == name || proc.pm2_env.pm_exec_path == _path["default"].resolve(name)) {
        found_proc.push(proc);
      }
    });
    return cb(null, found_proc);
  });
};

Client.prototype.getProcessByNameOrId = function (nameOrId, cb) {
  var foundProc = [];
  this.executeRemote('getMonitorData', {}, function (err, list) {
    if (err) {
      _Common["default"].printError('Error retrieving process list: ' + err);

      return cb(err);
    }

    list.forEach(function (proc) {
      if (proc.pm2_env.name === nameOrId || proc.pm2_env.pm_exec_path === _path["default"].resolve(nameOrId) || proc.pid === parseInt(nameOrId) || proc.pm2_env.pm_id === parseInt(nameOrId)) {
        foundProc.push(proc);
      }
    });
    return cb(null, foundProc);
  });
};

var _default = Client;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9DbGllbnQudHMiXSwibmFtZXMiOlsiZGVidWciLCJub29wIiwiQ2xpZW50Iiwib3B0cyIsImNvbmYiLCJjc3QiLCJzdWJfc29jayIsImRhZW1vbl9tb2RlIiwicG0yX2hvbWUiLCJQTTJfUk9PVF9QQVRIIiwic2VjcmV0X2tleSIsInB1YmxpY19rZXkiLCJtYWNoaW5lX25hbWUiLCJpbml0RmlsZVN0cnVjdHVyZSIsIkRBRU1PTl9SUENfUE9SVCIsIkRBRU1PTl9QVUJfUE9SVCIsInJwY19zb2NrZXRfZmlsZSIsInB1Yl9zb2NrZXRfZmlsZSIsInByb3RvdHlwZSIsInN0YXJ0IiwiY2IiLCJ0aGF0IiwicGluZ0RhZW1vbiIsImRhZW1vbkFsaXZlIiwibGF1bmNoUlBDIiwiZXJyIiwibWV0YSIsIm5ld19wbTJfaW5zdGFuY2UiLCJkYWVtb24iLCJEYWVtb24iLCJwaWRfZmlsZSIsIlBNMl9QSURfRklMRV9QQVRIIiwiaWdub3JlX3NpZ25hbHMiLCJjb25zb2xlIiwibG9nIiwiaW5uZXJTdGFydCIsIktNRGFlbW9uIiwibGF1bmNoQW5kSW50ZXJhY3QiLCJwbTJfdmVyc2lvbiIsInBrZyIsInZlcnNpb24iLCJkYXRhIiwiaW50ZXJhY3Rvcl9wcm9jIiwiaW50ZXJhY3Rvcl9wcm9jZXNzIiwibGF1bmNoRGFlbW9uIiwiY2hpbGQiLCJDb21tb24iLCJwcmludEVycm9yIiwicHJvY2VzcyIsImV4aXQiLCJFUlJPUl9FWElUIiwiZW52IiwiUE0yX0RJU0NSRVRFX01PREUiLCJwcmludE91dCIsIlBSRUZJWF9NU0ciLCJmcyIsImV4aXN0c1N5bmMiLCJERUZBVUxUX0xPR19QQVRIIiwibWtkaXJwIiwic3luYyIsImUiLCJlcnJvciIsInN0YWNrIiwiREVGQVVMVF9QSURfUEFUSCIsIlBNMl9NT0RVTEVfQ09ORl9GSUxFIiwid3JpdGVGaWxlU3luYyIsIkRFRkFVTFRfTU9EVUxFX1BBVEgiLCJwYXRoIiwiam9pbiIsIlBNMl9IT01FIiwiRGF0ZSIsIm5vdyIsInRvU3RyaW5nIiwiUE0yX1BST0dSQU1NQVRJQyIsInN0YXRlIiwiZHQiLCJyZWFkRmlsZVN5bmMiLCJfX2Rpcm5hbWUiLCJQTTJfQkFOTkVSIiwiY2xvc2UiLCJkaXNjb25uZWN0UlBDIiwiYmluZCIsImRpc2Nvbm5lY3RCdXMiLCJmbiIsIm5leHQiLCJpbnRlcmFjdG9yIiwiQ2xpZW50SlMiLCJyZXNvbHZlIiwiZGlybmFtZSIsIm1vZHVsZSIsImZpbGVuYW1lIiwibm9kZV9hcmdzIiwib3V0Iiwib3BlblN5bmMiLCJQTTJfTE9HX0ZJTEVfUEFUSCIsIkxPV19NRU1PUllfRU5WSVJPTk1FTlQiLCJwdXNoIiwiTWF0aCIsImZsb29yIiwib3MiLCJ0b3RhbG1lbSIsIlBNMl9OT0RFX09QVElPTlMiLCJjb25jYXQiLCJzcGxpdCIsImludGVycHJldGVyIiwiZXhlY1BhdGgiLCJzcGF3bkVudiIsIkRFQlVHIiwidXRpbCIsImluaGVyaXRzIiwiZGV0YWNoZWQiLCJjd2QiLCJzdGRpbyIsIm9uRXJyb3IiLCJtZXNzYWdlIiwib25jZSIsInVucmVmIiwibXNnIiwicmVtb3ZlTGlzdGVuZXIiLCJkaXNjb25uZWN0IiwiUE0yX05PX0lOVEVSQUNUSU9OIiwicmVxIiwiYXhvbiIsInNvY2tldCIsImNsaWVudCIsInJwYyIsInNvY2siLCJuZXh0VGljayIsImNvZGUiLCJzdGF0Iiwic3RhdHMiLCJ1aWQiLCJQUkVGSVhfTVNHX0VSUiIsIlVTRVIiLCJjb25uZWN0Iiwic2VsZiIsImNvbm5lY3RIYW5kbGVyIiwiZXJyb3JIYW5kbGVyIiwic2V0VGltZW91dCIsImNsaWVudF9zb2NrIiwiRXJyb3IiLCJjb25uZWN0ZWQiLCJjbG9zaW5nIiwidGltZXIiLCJjbGVhclRpbWVvdXQiLCJkZXN0cm95IiwibGF1bmNoQnVzIiwibGF1bmNoRXZlbnRTeXN0ZW0iLCJzdWIiLCJnZXRFeHBvc2VkTWV0aG9kcyIsIm1ldGhvZHMiLCJleGVjdXRlUmVtb3RlIiwibWV0aG9kIiwiYXBwX2NvbmYiLCJpbmRleE9mIiwic3RvcFdhdGNoIiwiYXJndiIsImN1cnJlbnRfY29uZiIsIndhdGNoIiwidG9nZ2xlV2F0Y2giLCJjYWxsIiwibm90aWZ5R29kIiwiYWN0aW9uX25hbWUiLCJpZCIsIm1hbnVhbGx5Iiwia2lsbERhZW1vbiIsInRpbWVvdXQiLCJxdWl0Iiwic3VjY2VzcyIsInBsYXRmb3JtIiwiYWxpdmUiLCJwaWQiLCJzdGFydFdhdGNoIiwicmVzdGFydFdhdGNoIiwiZ2V0QWxsUHJvY2VzcyIsImZvdW5kX3Byb2MiLCJwcm9jcyIsImdldEFsbFByb2Nlc3NJZCIsIm1hcCIsInByb2MiLCJwbV9pZCIsImdldEFsbFByb2Nlc3NJZFdpdGhvdXRNb2R1bGVzIiwicHJvY19pZHMiLCJmaWx0ZXIiLCJwbTJfZW52IiwicG14X21vZHVsZSIsImdldFByb2Nlc3NJZEJ5TmFtZSIsIm5hbWUiLCJmb3JjZV9hbGwiLCJmdWxsX2RldGFpbHMiLCJsaXN0IiwiZm9yRWFjaCIsInBtX2V4ZWNfcGF0aCIsImdldFByb2Nlc3NJZHNCeU5hbWVzcGFjZSIsIm5hbWVzcGFjZSIsImdldFByb2Nlc3NCeU5hbWUiLCJnZXRQcm9jZXNzQnlOYW1lT3JJZCIsIm5hbWVPcklkIiwiZm91bmRQcm9jIiwicGFyc2VJbnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFNQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQXRCQTs7Ozs7QUF3QkEsSUFBTUEsS0FBSyxHQUFHLHVCQUFZLFlBQVosQ0FBZDs7QUFFQSxTQUFTQyxJQUFULEdBQWdCLENBQUc7O0FBRW5CLElBQUlDLE1BQU0sR0FBRyxTQUFUQSxNQUFTLENBQVVDLElBQVYsRUFBZ0I7QUFDM0IsTUFBSSxDQUFDQSxJQUFMLEVBQVdBLElBQUksR0FBRyxFQUFQO0FBRVgsTUFBSSxDQUFDQSxJQUFJLENBQUNDLElBQVYsRUFDRSxLQUFLQSxJQUFMLEdBQVlDLHFCQUFa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QVU5SCxHQUFWLEVBQWVxSyxJQUFmLEVBQXFCO0FBQzVELFFBQUlySyxHQUFKLEVBQVM7QUFDUHFCLHlCQUFPQyxVQUFQLENBQWtCLG9DQUFvQ3RCLEdBQXREOztBQUNBLGFBQU9MLEVBQUUsQ0FBQ0ssR0FBRCxDQUFUO0FBQ0Q7O0FBRURxSyxJQUFBQSxJQUFJLENBQUNDLE9BQUwsQ0FBYSxVQUFVWixJQUFWLEVBQWdCO0FBQzNCLFVBQUlBLElBQUksQ0FBQ0ssT0FBTCxDQUFhRyxJQUFiLEtBQXNCVSxRQUF0QixJQUNGbEIsSUFBSSxDQUFDSyxPQUFMLENBQWFRLFlBQWIsS0FBOEI3SCxpQkFBS29CLE9BQUwsQ0FBYThHLFFBQWIsQ0FENUIsSUFFRmxCLElBQUksQ0FBQ1IsR0FBTCxLQUFhNEIsUUFBUSxDQUFDRixRQUFELENBRm5CLElBR0ZsQixJQUFJLENBQUNLLE9BQUwsQ0FBYUosS0FBYixLQUF1Qm1CLFFBQVEsQ0FBQ0YsUUFBRCxDQUhqQyxFQUc2QztBQUMzQ0MsUUFBQUEsU0FBUyxDQUFDdEcsSUFBVixDQUFlbUYsSUFBZjtBQUNEO0FBQ0YsS0FQRDtBQVNBLFdBQU8vSixFQUFFLENBQUMsSUFBRCxFQUFPa0wsU0FBUCxDQUFUO0FBQ0QsR0FoQkQ7QUFpQkQsQ0FwQkQ7O2VBc0JlcE0sTSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIGxpY2Vuc2UgdGhhdFxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4gKi9cblxuaW1wb3J0IGRlYnVnTG9nZ2VyIGZyb20gJ2RlYnVnJztcbmltcG9ydCBDb21tb24gZnJvbSAnLi9Db21tb24uanMnO1xuaW1wb3J0IEtNRGFlbW9uIGZyb20gJ0BwbTIvYWdlbnQvc3JjL0ludGVyYWN0b3JDbGllbnQnO1xuaW1wb3J0IHJwYyBmcm9tICdwbTItYXhvbi1ycGMnO1xuaW1wb3J0IGZvckVhY2ggZnJvbSAnYXN5bmMvZm9yRWFjaCc7XG5pbXBvcnQgYXhvbiBmcm9tICdwbTItYXhvbic7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBwa2cgZnJvbSAnLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCB3aGljaCBmcm9tICcuL3Rvb2xzL3doaWNoJztcbmltcG9ydCBjc3QgZnJvbSAnLi4vY29uc3RhbnRzJztcbmltcG9ydCBEYWVtb24gZnJvbSAnLi9EYWVtb24nO1xuaW1wb3J0IG1rZGlycCBmcm9tICdta2RpcnAnO1xuaW1wb3J0IHZDaGVjayBmcm9tICcuL1ZlcnNpb25DaGVjaydcbmltcG9ydCBvcyBmcm9tICdvcyc7XG5pbXBvcnQgeyBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuXG5jb25zdCBkZWJ1ZyA9IGRlYnVnTG9nZ2VyKCdwbTI6Y2xpZW50Jyk7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7IH1cblxudmFyIENsaWVudCA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gIGlmICghb3B0cykgb3B0cyA9IHt9O1xuXG4gIGlmICghb3B0cy5jb25mKVxuICAgIHRoaXMuY29uZiA9IGNzdDtcbiAgZWxzZSB7XG4gICAgdGhpcy5jb25mID0gb3B0cy5jb25mO1xuICB9XG5cbiAgdGhpcy5zdWJfc29jayA9IHt9O1xuICB0aGlzLmRhZW1vbl9tb2RlID0gdHlwZW9mIChvcHRzLmRhZW1vbl9tb2RlKSA9PT0gJ3VuZGVmaW5lZCcgPyB0cnVlIDogb3B0cy5kYWVtb25fbW9kZTtcbiAgdGhpcy5wbTJfaG9tZSA9IHRoaXMuY29uZi5QTTJfUk9PVF9QQVRIO1xuICB0aGlzLnNlY3JldF9rZXkgPSBvcHRzLnNlY3JldF9rZXk7XG4gIHRoaXMucHVibGljX2tleSA9IG9wdHMucHVibGljX2tleTtcbiAgdGhpcy5tYWNoaW5lX25hbWUgPSBvcHRzLm1hY2hpbmVfbmFtZTtcblxuICAvLyBDcmVhdGUgYWxsIGZvbGRlcnMgYW5kIGZpbGVzIG5lZWRlZFxuICAvLyBDbGllbnQgZGVwZW5kcyB0byB0aGF0IHRvIGludGVyYWN0IHdpdGggUE0yIHByb3Blcmx5XG4gIHRoaXMuaW5pdEZpbGVTdHJ1Y3R1cmUodGhpcy5jb25mKTtcblxuICBkZWJ1ZygnVXNpbmcgUlBDIGZpbGUgJXMnLCB0aGlzLmNvbmYuREFFTU9OX1JQQ19QT1JUKTtcbiAgZGVidWcoJ1VzaW5nIFBVQiBmaWxlICVzJywgdGhpcy5jb25mLkRBRU1PTl9QVUJfUE9SVCk7XG4gIHRoaXMucnBjX3NvY2tldF9maWxlID0gdGhpcy5jb25mLkRBRU1PTl9SUENfUE9SVDtcbiAgdGhpcy5wdWJfc29ja2V0X2ZpbGUgPSB0aGlzLmNvbmYuREFFTU9OX1BVQl9QT1JUO1xufTtcblxuLy8gQGJyZWFraW5nIGNoYW5nZSAobm9EYWVtb25Nb2RlIGhhcyBiZWVuIGRyb3ApXG4vLyBAdG9kbyByZXQgZXJyXG5DbGllbnQucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKGNiKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcblxuICB0aGlzLnBpbmdEYWVtb24oZnVuY3Rpb24gKGRhZW1vbkFsaXZlKSB7XG4gICAgaWYgKGRhZW1vbkFsaXZlID09PSB0cnVlKVxuICAgICAgcmV0dXJuIHRoYXQubGF1bmNoUlBDKGZ1bmN0aW9uIChlcnIsIG1ldGEpIHtcbiAgICAgICAgcmV0dXJuIGNiKG51bGwsIHtcbiAgICAgICAgICBkYWVtb25fbW9kZTogdGhhdC5jb25mLmRhZW1vbl9tb2RlLFxuICAgICAgICAgIG5ld19wbTJfaW5zdGFuY2U6IGZhbHNlLFxuICAgICAgICAgIHJwY19zb2NrZXRfZmlsZTogdGhhdC5ycGNfc29ja2V0X2ZpbGUsXG4gICAgICAgICAgcHViX3NvY2tldF9maWxlOiB0aGF0LnB1Yl9zb2NrZXRfZmlsZSxcbiAgICAgICAgICBwbTJfaG9tZTogdGhhdC5wbTJfaG9tZVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogTm8gRGFlbW9uIG1vZGVcbiAgICAgKi9cbiAgICBpZiAodGhhdC5kYWVtb25fbW9kZSA9PT0gZmFsc2UpIHtcbiAgICAgIHZhciBkYWVtb24gPSBuZXcgRGFlbW9uKHtcbiAgICAgICAgcHViX3NvY2tldF9maWxlOiB0aGF0LmNvbmYuREFFTU9OX1BVQl9QT1JULFxuICAgICAgICBycGNfc29ja2V0X2ZpbGU6IHRoYXQuY29uZi5EQUVNT05fUlBDX1BPUlQsXG4gICAgICAgIHBpZF9maWxlOiB0aGF0LmNvbmYuUE0yX1BJRF9GSUxFX1BBVEgsXG4gICAgICAgIGlnbm9yZV9zaWduYWxzOiB0cnVlXG4gICAgICB9KTtcblxuICAgICAgY29uc29sZS5sb2coJ0xhdW5jaGluZyBpbiBubyBkYWVtb24gbW9kZScpO1xuXG4gICAgICBkYWVtb24uaW5uZXJTdGFydChmdW5jdGlvbiAoKSB7XG4gICAgICAgIEtNRGFlbW9uLmxhdW5jaEFuZEludGVyYWN0KHRoYXQuY29uZiwge1xuICAgICAgICAgIG1hY2hpbmVfbmFtZTogdGhhdC5tYWNoaW5lX25hbWUsXG4gICAgICAgICAgcHVibGljX2tleTogdGhhdC5wdWJsaWNfa2V5LFxuICAgICAgICAgIHNlY3JldF9rZXk6IHRoYXQuc2VjcmV0X2tleSxcbiAgICAgICAgICBwbTJfdmVyc2lvbjogcGtnLnZlcnNpb25cbiAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgZGF0YSwgaW50ZXJhY3Rvcl9wcm9jKSB7XG4gICAgICAgICAgdGhhdC5pbnRlcmFjdG9yX3Byb2Nlc3MgPSBpbnRlcmFjdG9yX3Byb2M7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoYXQubGF1bmNoUlBDKGZ1bmN0aW9uIChlcnIsIG1ldGEpIHtcbiAgICAgICAgICByZXR1cm4gY2IobnVsbCwge1xuICAgICAgICAgICAgZGFlbW9uX21vZGU6IHRoYXQuY29uZi5kYWVtb25fbW9kZSxcbiAgICAgICAgICAgIG5ld19wbTJfaW5zdGFuY2U6IHRydWUsXG4gICAgICAgICAgICBycGNfc29ja2V0X2ZpbGU6IHRoYXQucnBjX3NvY2tldF9maWxlLFxuICAgICAgICAgICAgcHViX3NvY2tldF9maWxlOiB0aGF0LnB1Yl9zb2NrZXRfZmlsZSxcbiAgICAgICAgICAgIHBtMl9ob21lOiB0aGF0LnBtMl9ob21lXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGFlbW9uIG1vZGVcbiAgICAgKi9cbiAgICB0aGF0LmxhdW5jaERhZW1vbihmdW5jdGlvbiAoZXJyLCBjaGlsZCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIpIDogcHJvY2Vzcy5leGl0KHRoYXQuY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFwcm9jZXNzLmVudi5QTTJfRElTQ1JFVEVfTU9ERSlcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KHRoYXQuY29uZi5QUkVGSVhfTVNHICsgJ1BNMiBTdWNjZXNzZnVsbHkgZGFlbW9uaXplZCcpO1xuXG4gICAgICB0aGF0LmxhdW5jaFJQQyhmdW5jdGlvbiAoZXJyLCBtZXRhKSB7XG4gICAgICAgIHJldHVybiBjYihudWxsLCB7XG4gICAgICAgICAgZGFlbW9uX21vZGU6IHRoYXQuY29uZi5kYWVtb25fbW9kZSxcbiAgICAgICAgICBuZXdfcG0yX2luc3RhbmNlOiB0cnVlLFxuICAgICAgICAgIHJwY19zb2NrZXRfZmlsZTogdGhhdC5ycGNfc29ja2V0X2ZpbGUsXG4gICAgICAgICAgcHViX3NvY2tldF9maWxlOiB0aGF0LnB1Yl9zb2NrZXRfZmlsZSxcbiAgICAgICAgICBwbTJfaG9tZTogdGhhdC5wbTJfaG9tZVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbi8vIEluaXQgZmlsZSBzdHJ1Y3R1cmUgb2YgcG0yX2hvbWVcbi8vIFRoaXMgaW5jbHVkZXNcbi8vIC0gcG0yIHBpZCBhbmQgbG9nIHBhdGhcbi8vIC0gcnBjIGFuZCBwdWIgc29ja2V0IGZvciBjb21tYW5kIGV4ZWN1dGlvblxuQ2xpZW50LnByb3RvdHlwZS5pbml0RmlsZVN0cnVjdHVyZSA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gIGlmICghZnMuZXhpc3RzU3luYyhvcHRzLkRFRkFVTFRfTE9HX1BBVEgpKSB7XG4gICAgdHJ5IHtcbiAgICAgIG1rZGlycC5zeW5jKG9wdHMuREVGQVVMVF9MT0dfUEFUSCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghZnMuZXhpc3RzU3luYyhvcHRzLkRFRkFVTFRfUElEX1BBVEgpKSB7XG4gICAgdHJ5IHtcbiAgICAgIG1rZGlycC5zeW5jKG9wdHMuREVGQVVMVF9QSURfUEFUSCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghZnMuZXhpc3RzU3luYyhvcHRzLlBNMl9NT0RVTEVfQ09ORl9GSUxFKSkge1xuICAgIHRyeSB7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKG9wdHMuUE0yX01PRFVMRV9DT05GX0ZJTEUsIFwie31cIik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghZnMuZXhpc3RzU3luYyhvcHRzLkRFRkFVTFRfTU9EVUxFX1BBVEgpKSB7XG4gICAgdHJ5IHtcbiAgICAgIG1rZGlycC5zeW5jKG9wdHMuREVGQVVMVF9NT0RVTEVfUEFUSCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChwcm9jZXNzLmVudi5QTTJfRElTQ1JFVEVfTU9ERSkge1xuICAgIHRyeSB7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihvcHRzLlBNMl9IT01FLCAndG91Y2gnKSwgRGF0ZS5ub3coKS50b1N0cmluZygpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBkZWJ1ZyhlLnN0YWNrIHx8IGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghcHJvY2Vzcy5lbnYuUE0yX1BST0dSQU1NQVRJQyAmJiAhZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4ob3B0cy5QTTJfSE9NRSwgJ3RvdWNoJykpKSB7XG4gICAgdkNoZWNrKHtcbiAgICAgIHN0YXRlOiAnaW5zdGFsbCcsXG4gICAgICB2ZXJzaW9uOiBwa2cudmVyc2lvblxuICAgIH0pXG5cbiAgICB2YXIgZHQgPSBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgb3B0cy5QTTJfQkFOTkVSKSk7XG4gICAgY29uc29sZS5sb2coZHQudG9TdHJpbmcoKSk7XG4gICAgdHJ5IHtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKG9wdHMuUE0yX0hPTUUsICd0b3VjaCcpLCBEYXRlLm5vdygpLnRvU3RyaW5nKCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGRlYnVnKGUuc3RhY2sgfHwgZSk7XG4gICAgfVxuICB9XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKGNiKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcblxuICBmb3JFYWNoKFtcbiAgICB0aGF0LmRpc2Nvbm5lY3RSUEMuYmluZCh0aGF0KSxcbiAgICB0aGF0LmRpc2Nvbm5lY3RCdXMuYmluZCh0aGF0KVxuICBdLCBmdW5jdGlvbiAoZm4sIG5leHQpIHtcbiAgICBmbihuZXh0KVxuICB9LCBjYik7XG59O1xuXG4vKipcbiAqIExhdW5jaCB0aGUgRGFlbW9uIGJ5IGZvcmtpbmcgdGhpcyBzYW1lIGZpbGVcbiAqIFRoZSBtZXRob2QgQ2xpZW50LnJlbW90ZVdyYXBwZXIgd2lsbCBiZSBjYWxsZWRcbiAqXG4gKiBAbWV0aG9kIGxhdW5jaERhZW1vblxuICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0cy5pbnRlcmFjdG9yPXRydWVdIGFsbG93IHRvIGRpc2FibGUgaW50ZXJhY3Rpb24gb24gbGF1bmNoXG4gKi9cbkNsaWVudC5wcm90b3R5cGUubGF1bmNoRGFlbW9uID0gZnVuY3Rpb24gKG9wdHMsIGNiKSB7XG4gIGlmICh0eXBlb2YgKG9wdHMpID09ICdmdW5jdGlvbicpIHtcbiAgICBjYiA9IG9wdHM7XG4gICAgb3B0cyA9IHtcbiAgICAgIGludGVyYWN0b3I6IHRydWVcbiAgICB9O1xuICB9XG5cbiAgdmFyIHRoYXQgPSB0aGlzXG4gIHZhciBDbGllbnRKUyA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUobW9kdWxlLmZpbGVuYW1lKSwgJ0RhZW1vbi5qcycpO1xuICB2YXIgbm9kZV9hcmdzID0gW107XG4gIHZhciBvdXQsIGVycjtcblxuICAvLyBpZiAocHJvY2Vzcy5lbnYuVFJBVklTKSB7XG4gIC8vICAgLy8gUmVkaXJlY3QgUE0yIGludGVybmFsIGVyciBhbmQgb3V0IHRvIFNUREVSUiBTVERPVVQgd2hlbiBydW5uaW5nIHdpdGggVHJhdmlzXG4gIC8vICAgb3V0ID0gMTtcbiAgLy8gICBlcnIgPSAyO1xuICAvLyB9XG4gIC8vIGVsc2Uge1xuICBvdXQgPSBmcy5vcGVuU3luYyh0aGF0LmNvbmYuUE0yX0xPR19GSUxFX1BBVEgsICdhJyksXG4gICAgZXJyID0gZnMub3BlblN5bmModGhhdC5jb25mLlBNMl9MT0dfRklMRV9QQVRILCAnYScpO1xuICAvL31cblxuICBpZiAodGhpcy5jb25mLkxPV19NRU1PUllfRU5WSVJPTk1FTlQpIHtcbiAgICBub2RlX2FyZ3MucHVzaCgnLS1nYy1nbG9iYWwnKTsgLy8gRG9lcyBmdWxsIEdDIChzbWFsbGVyIG1lbW9yeSBmb290cHJpbnQpXG4gICAgbm9kZV9hcmdzLnB1c2goJy0tbWF4LW9sZC1zcGFjZS1zaXplPScgKyBNYXRoLmZsb29yKG9zLnRvdGFsbWVtKCkgLyAxMDI0IC8gMTAyNCkpO1xuICB9XG5cbiAgLy8gTm9kZS5qcyB0dW5pbmcgZm9yIGJldHRlciBwZXJmb3JtYW5jZVxuICAvL25vZGVfYXJncy5wdXNoKCctLWV4cG9zZS1nYycpOyAvLyBBbGxvd3MgbWFudWFsIEdDIGluIHRoZSBjb2RlXG5cbiAgLyoqXG4gICAqIEFkZCBub2RlIFthcmd1bWVudHNdIGRlcGVuZGluZyBvbiBQTTJfTk9ERV9PUFRJT05TIGVudiB2YXJpYWJsZVxuICAgKi9cbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9OT0RFX09QVElPTlMpXG4gICAgbm9kZV9hcmdzID0gbm9kZV9hcmdzLmNvbmNhdChwcm9jZXNzLmVudi5QTTJfTk9ERV9PUFRJT05TLnNwbGl0KCcgJykpO1xuICBub2RlX2FyZ3MucHVzaChDbGllbnRKUyk7XG5cbiAgaWYgKCFwcm9jZXNzLmVudi5QTTJfRElTQ1JFVEVfTU9ERSlcbiAgICBDb21tb24ucHJpbnRPdXQodGhhdC5jb25mLlBSRUZJWF9NU0cgKyAnU3Bhd25pbmcgUE0yIGRhZW1vbiB3aXRoIHBtMl9ob21lPScgKyB0aGlzLnBtMl9ob21lKTtcblxuICB2YXIgaW50ZXJwcmV0ZXIgPSAnbm9kZSc7XG5cbiAgaWYgKHdoaWNoKCdub2RlJykgPT0gbnVsbClcbiAgICBpbnRlcnByZXRlciA9IHByb2Nlc3MuZXhlY1BhdGg7XG5cbiAgbGV0IHNwYXduRW52OiBhbnkgPSB7XG4gICAgJ1NJTEVOVCc6IHRoYXQuY29uZi5ERUJVRyA/ICF0aGF0LmNvbmYuREVCVUcgOiB0cnVlLFxuICAgICdQTTJfSE9NRSc6IHRoYXQucG0yX2hvbWVcbiAgfVxuICB1dGlsLmluaGVyaXRzKHNwYXduRW52LCBwcm9jZXNzLmVudilcbiAgdmFyIGNoaWxkID0gc3Bhd24oaW50ZXJwcmV0ZXIsIG5vZGVfYXJncywge1xuICAgIGRldGFjaGVkOiB0cnVlLFxuICAgIGN3ZDogdGhhdC5jb25mLmN3ZCB8fCBwcm9jZXNzLmN3ZCgpLFxuICAgIGVudjogc3Bhd25FbnYsXG4gICAgc3RkaW86IFsnaXBjJywgb3V0LCBlcnJdXG4gIH0pO1xuXG4gIGZ1bmN0aW9uIG9uRXJyb3IoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlIHx8IGUpO1xuICAgIHJldHVybiBjYiA/IGNiKGUubWVzc2FnZSB8fCBlKSA6IGZhbHNlO1xuICB9XG5cbiAgY2hpbGQub25jZSgnZXJyb3InLCBvbkVycm9yKTtcblxuICBjaGlsZC51bnJlZigpO1xuXG4gIGNoaWxkLm9uY2UoJ21lc3NhZ2UnLCBmdW5jdGlvbiAobXNnKSB7XG4gICAgZGVidWcoJ1BNMiBkYWVtb24gbGF1bmNoZWQgd2l0aCByZXR1cm4gbWVzc2FnZTogJywgbXNnKTtcbiAgICBjaGlsZC5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbkVycm9yKTtcbiAgICBjaGlsZC5kaXNjb25uZWN0KCk7XG5cbiAgICBpZiAob3B0cyAmJiBvcHRzLmludGVyYWN0b3IgPT0gZmFsc2UpXG4gICAgICByZXR1cm4gY2IobnVsbCwgY2hpbGQpO1xuXG4gICAgaWYgKHByb2Nlc3MuZW52LlBNMl9OT19JTlRFUkFDVElPTiA9PSAndHJ1ZScpXG4gICAgICByZXR1cm4gY2IobnVsbCwgY2hpbGQpO1xuXG4gICAgLyoqXG4gICAgICogSGVyZSB0aGUgS2V5bWV0cmljcyBhZ2VudCBpcyBsYXVuY2hlZCBhdXRvbWF0aWNjYWx5IGlmXG4gICAgICogaXQgaGFzIGJlZW4gYWxyZWFkeSBjb25maWd1cmVkIGJlZm9yZSAodmlhIHBtMiBsaW5rKVxuICAgICAqL1xuICAgIEtNRGFlbW9uLmxhdW5jaEFuZEludGVyYWN0KHRoYXQuY29uZiwge1xuICAgICAgbWFjaGluZV9uYW1lOiB0aGF0Lm1hY2hpbmVfbmFtZSxcbiAgICAgIHB1YmxpY19rZXk6IHRoYXQucHVibGljX2tleSxcbiAgICAgIHNlY3JldF9rZXk6IHRoYXQuc2VjcmV0X2tleSxcbiAgICAgIHBtMl92ZXJzaW9uOiBwa2cudmVyc2lvblxuICAgIH0sIGZ1bmN0aW9uIChlcnIsIGRhdGEsIGludGVyYWN0b3JfcHJvYykge1xuICAgICAgdGhhdC5pbnRlcmFjdG9yX3Byb2Nlc3MgPSBpbnRlcmFjdG9yX3Byb2M7XG4gICAgICByZXR1cm4gY2IobnVsbCwgY2hpbGQpO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbi8qKlxuICogUGluZyB0aGUgZGFlbW9uIHRvIGtub3cgaWYgaXQgYWxpdmUgb3Igbm90XG4gKiBAYXBpIHB1YmxpY1xuICogQG1ldGhvZCBwaW5nRGFlbW9uXG4gKiBAcGFyYW0ge30gY2JcbiAqIEByZXR1cm5cbiAqL1xuQ2xpZW50LnByb3RvdHlwZS5waW5nRGFlbW9uID0gZnVuY3Rpb24gcGluZ0RhZW1vbihjYikge1xuICB2YXIgcmVxID0gYXhvbi5zb2NrZXQoJ3JlcScsIG51bGwpO1xuICB2YXIgY2xpZW50ID0gbmV3IHJwYy5DbGllbnQocmVxKTtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gIGRlYnVnKCdbUElORyBQTTJdIFRyeWluZyB0byBjb25uZWN0IHRvIHNlcnZlcicpO1xuXG4gIGNsaWVudC5zb2NrLm9uY2UoJ3JlY29ubmVjdCBhdHRlbXB0JywgZnVuY3Rpb24gKCkge1xuICAgIGNsaWVudC5zb2NrLmNsb3NlKCk7XG4gICAgZGVidWcoJ0RhZW1vbiBub3QgbGF1bmNoZWQnKTtcbiAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjYihmYWxzZSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGNsaWVudC5zb2NrLm9uY2UoJ2Vycm9yJywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZS5jb2RlID09PSAnRUFDQ0VTJykge1xuICAgICAgZnMuc3RhdCh0aGF0LmNvbmYuREFFTU9OX1JQQ19QT1JULCBmdW5jdGlvbiAoZSwgc3RhdHMpIHtcbiAgICAgICAgaWYgKHN0YXRzLnVpZCA9PT0gMCkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhhdC5jb25mLlBSRUZJWF9NU0dfRVJSICsgJ1Blcm1pc3Npb24gZGVuaWVkLCB0byBnaXZlIGFjY2VzcyB0byBjdXJyZW50IHVzZXI6Jyk7XG4gICAgICAgICAgY29uc29sZS5sb2coJyQgc3VkbyBjaG93biAnICsgcHJvY2Vzcy5lbnYuVVNFUiArICc6JyArIHByb2Nlc3MuZW52LlVTRVIgKyAnICcgKyB0aGF0LmNvbmYuREFFTU9OX1JQQ19QT1JUICsgJyAnICsgdGhhdC5jb25mLkRBRU1PTl9QVUJfUE9SVCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhhdC5jb25mLlBSRUZJWF9NU0dfRVJSICsgJ1Blcm1pc3Npb24gZGVuaWVkLCBjaGVjayBwZXJtaXNzaW9ucyBvbiAnICsgdGhhdC5jb25mLkRBRU1PTl9SUENfUE9SVCk7XG5cbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2VcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlIHx8IGUpO1xuICB9KTtcblxuICBjbGllbnQuc29jay5vbmNlKCdjb25uZWN0JywgZnVuY3Rpb24gKCkge1xuICAgIGNsaWVudC5zb2NrLm9uY2UoJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNiKHRydWUpO1xuICAgIH0pO1xuICAgIGNsaWVudC5zb2NrLmNsb3NlKCk7XG4gICAgZGVidWcoJ0RhZW1vbiBhbGl2ZScpO1xuICB9KTtcblxuICByZXEuY29ubmVjdCh0aGlzLnJwY19zb2NrZXRfZmlsZSk7XG59O1xuXG4vKipcbiAqIE1ldGhvZHMgdG8gaW50ZXJhY3Qgd2l0aCB0aGUgRGFlbW9uIHZpYSBSUENcbiAqIFRoaXMgbWV0aG9kIHdhaXQgdG8gYmUgY29ubmVjdGVkIHRvIHRoZSBEYWVtb25cbiAqIE9uY2UgaGUncyBjb25uZWN0ZWQgaXQgdHJpZ2dlciB0aGUgY29tbWFuZCBwYXJzaW5nIChvbiAuL2Jpbi9wbTIgZmlsZSwgYXQgdGhlIGVuZClcbiAqIEBtZXRob2QgbGF1bmNoUlBDXG4gKiBAcGFyYW1zIHtmdW5jdGlvbn0gW2NiXVxuICogQHJldHVyblxuICovXG5DbGllbnQucHJvdG90eXBlLmxhdW5jaFJQQyA9IGZ1bmN0aW9uIGxhdW5jaFJQQyhjYikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGRlYnVnKCdMYXVuY2hpbmcgUlBDIGNsaWVudCBvbiBzb2NrZXQgZmlsZSAlcycsIHRoaXMucnBjX3NvY2tldF9maWxlKTtcbiAgdmFyIHJlcSA9IGF4b24uc29ja2V0KCdyZXEnLCBudWxsKTtcbiAgdGhpcy5jbGllbnQgPSBuZXcgcnBjLkNsaWVudChyZXEpO1xuXG4gIHZhciBjb25uZWN0SGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICBzZWxmLmNsaWVudC5zb2NrLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIGVycm9ySGFuZGxlcik7XG4gICAgZGVidWcoJ1JQQyBDb25uZWN0ZWQgdG8gRGFlbW9uJyk7XG4gICAgaWYgKGNiKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2IobnVsbCk7XG4gICAgICB9LCA0KTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGVycm9ySGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgc2VsZi5jbGllbnQuc29jay5yZW1vdmVMaXN0ZW5lcignY29ubmVjdCcsIGNvbm5lY3RIYW5kbGVyKTtcbiAgICBpZiAoY2IpIHtcbiAgICAgIHJldHVybiBjYihlKTtcbiAgICB9XG4gIH07XG5cbiAgdGhpcy5jbGllbnQuc29jay5vbmNlKCdjb25uZWN0JywgY29ubmVjdEhhbmRsZXIpO1xuICB0aGlzLmNsaWVudC5zb2NrLm9uY2UoJ2Vycm9yJywgZXJyb3JIYW5kbGVyKTtcbiAgdGhpcy5jbGllbnRfc29jayA9IHJlcS5jb25uZWN0KHRoaXMucnBjX3NvY2tldF9maWxlKTtcbn07XG5cbi8qKlxuICogTWV0aG9kcyB0byBjbG9zZSB0aGUgUlBDIGNvbm5lY3Rpb25cbiAqIEBjYWxsYmFjayBjYlxuICovXG5DbGllbnQucHJvdG90eXBlLmRpc2Nvbm5lY3RSUEMgPSBmdW5jdGlvbiBkaXNjb25uZWN0UlBDKGNiKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcbiAgaWYgKCFjYikgY2IgPSBub29wO1xuXG4gIGlmICghdGhpcy5jbGllbnRfc29jayB8fCAhdGhpcy5jbGllbnRfc29jay5jbG9zZSkge1xuICAgIHRoaXMuY2xpZW50ID0gbnVsbDtcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICBjYihuZXcgRXJyb3IoJ1NVQiBjb25uZWN0aW9uIHRvIFBNMiBpcyBub3QgbGF1bmNoZWQnKSk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAodGhpcy5jbGllbnRfc29jay5jb25uZWN0ZWQgPT09IGZhbHNlIHx8XG4gICAgdGhpcy5jbGllbnRfc29jay5jbG9zaW5nID09PSB0cnVlKSB7XG4gICAgdGhpcy5jbGllbnQgPSBudWxsO1xuICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNiKG5ldyBFcnJvcignUlBDIGFscmVhZHkgYmVpbmcgY2xvc2VkJykpO1xuICAgIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICB2YXIgdGltZXI7XG5cbiAgICB0aGF0LmNsaWVudF9zb2NrLm9uY2UoJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIHRoYXQuY2xpZW50ID0gbnVsbDtcbiAgICAgIGRlYnVnKCdQTTIgUlBDIGNsZWFubHkgY2xvc2VkJyk7XG4gICAgICByZXR1cm4gY2IobnVsbCwgeyBtc2c6ICdSUEMgU3VjY2Vzc2Z1bGx5IGNsb3NlZCcgfSk7XG4gICAgfSk7XG5cbiAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoYXQuY2xpZW50X3NvY2suZGVzdHJveSlcbiAgICAgICAgdGhhdC5jbGllbnRfc29jay5kZXN0cm95KCk7XG4gICAgICB0aGF0LmNsaWVudCA9IG51bGw7XG4gICAgICByZXR1cm4gY2IobnVsbCwgeyBtc2c6ICdSUEMgU3VjY2Vzc2Z1bGx5IGNsb3NlZCB2aWEgdGltZW91dCcgfSk7XG4gICAgfSwgMjAwKTtcblxuICAgIHRoYXQuY2xpZW50X3NvY2suY2xvc2UoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGRlYnVnKCdFcnJvciB3aGlsZSBkaXNjb25uZWN0aW5nIFJQQyBQTTInLCBlLnN0YWNrIHx8IGUpO1xuICAgIHJldHVybiBjYihlKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmxhdW5jaEJ1cyA9IGZ1bmN0aW9uIGxhdW5jaEV2ZW50U3lzdGVtKGNiKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5zdWIgPSBheG9uLnNvY2tldCgnc3ViLWVtaXR0ZXInLCBudWxsKTtcbiAgdGhpcy5zdWJfc29jayA9IHRoaXMuc3ViLmNvbm5lY3QodGhpcy5wdWJfc29ja2V0X2ZpbGUpO1xuXG4gIHRoaXMuc3ViX3NvY2sub25jZSgnY29ubmVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY2IobnVsbCwgc2VsZi5zdWIsIHNlbGYuc3ViX3NvY2spO1xuICB9KTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUuZGlzY29ubmVjdEJ1cyA9IGZ1bmN0aW9uIGRpc2Nvbm5lY3RCdXMoY2IpIHtcbiAgaWYgKCFjYikgY2IgPSBub29wO1xuXG4gIHZhciB0aGF0ID0gdGhpcztcblxuICBpZiAoIXRoaXMuc3ViX3NvY2sgfHwgIXRoaXMuc3ViX3NvY2suY2xvc2UpIHtcbiAgICB0aGF0LnN1YiA9IG51bGw7XG4gICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgY2IobnVsbCwgeyBtc2c6ICdidXMgd2FzIG5vdCBjb25uZWN0ZWQnIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgaWYgKHRoaXMuc3ViX3NvY2suY29ubmVjdGVkID09PSBmYWxzZSB8fFxuICAgIHRoaXMuc3ViX3NvY2suY2xvc2luZyA9PT0gdHJ1ZSkge1xuICAgIHRoYXQuc3ViID0gbnVsbDtcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICBjYihuZXcgRXJyb3IoJ1NVQiBjb25uZWN0aW9uIGlzIGFscmVhZHkgYmVpbmcgY2xvc2VkJykpO1xuICAgIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICB2YXIgdGltZXI7XG5cbiAgICB0aGF0LnN1Yl9zb2NrLm9uY2UoJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgdGhhdC5zdWIgPSBudWxsO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIGRlYnVnKCdQTTIgUFVCIGNsZWFubHkgY2xvc2VkJyk7XG4gICAgICByZXR1cm4gY2IoKTtcbiAgICB9KTtcblxuICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhhdC5zdWJfc29jay5kZXN0cm95KVxuICAgICAgICB0aGF0LnN1Yl9zb2NrLmRlc3Ryb3koKTtcbiAgICAgIHJldHVybiBjYigpO1xuICAgIH0sIDIwMCk7XG5cbiAgICB0aGlzLnN1Yl9zb2NrLmNsb3NlKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gY2IoZSk7XG4gIH1cbn07XG5cbi8qKlxuICogRGVzY3JpcHRpb25cbiAqIEBtZXRob2QgZ2VzdEV4cG9zZWRNZXRob2RzXG4gKiBAcGFyYW0ge30gY2JcbiAqIEByZXR1cm5cbiAqL1xuQ2xpZW50LnByb3RvdHlwZS5nZXRFeHBvc2VkTWV0aG9kcyA9IGZ1bmN0aW9uIGdldEV4cG9zZWRNZXRob2RzKGNiKSB7XG4gIHRoaXMuY2xpZW50Lm1ldGhvZHMoY2IpO1xufTtcblxuLyoqXG4gKiBEZXNjcmlwdGlvblxuICogQG1ldGhvZCBleGVjdXRlUmVtb3RlXG4gKiBAcGFyYW0ge30gbWV0aG9kXG4gKiBAcGFyYW0ge30gZW52XG4gKiBAcGFyYW0ge30gZm5cbiAqIEByZXR1cm5cbiAqL1xuQ2xpZW50LnByb3RvdHlwZS5leGVjdXRlUmVtb3RlID0gZnVuY3Rpb24gZXhlY3V0ZVJlbW90ZShtZXRob2QsIGFwcF9jb25mLCBmbikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgLy8gc3RvcCB3YXRjaCBvbiBzdG9wIHwgZW52IGlzIHRoZSBwcm9jZXNzIGlkXG4gIGlmIChtZXRob2QuaW5kZXhPZignc3RvcCcpICE9PSAtMSkge1xuICAgIHRoaXMuc3RvcFdhdGNoKG1ldGhvZCwgYXBwX2NvbmYpO1xuICB9XG4gIC8vIHN0b3Agd2F0Y2hpbmcgd2hlbiBwcm9jZXNzIGlzIGRlbGV0ZWRcbiAgZWxzZSBpZiAobWV0aG9kLmluZGV4T2YoJ2RlbGV0ZScpICE9PSAtMSkge1xuICAgIHRoaXMuc3RvcFdhdGNoKG1ldGhvZCwgYXBwX2NvbmYpO1xuICB9XG4gIC8vIHN0b3AgZXZlcnl0aGluZyBvbiBraWxsXG4gIGVsc2UgaWYgKG1ldGhvZC5pbmRleE9mKCdraWxsJykgIT09IC0xKSB7XG4gICAgdGhpcy5zdG9wV2F0Y2goJ2RlbGV0ZUFsbCcsIGFwcF9jb25mKTtcbiAgfVxuICBlbHNlIGlmIChtZXRob2QuaW5kZXhPZigncmVzdGFydFByb2Nlc3NJZCcpICE9PSAtMSAmJiBwcm9jZXNzLmFyZ3YuaW5kZXhPZignLS13YXRjaCcpID4gLTEpIHtcbiAgICBkZWxldGUgYXBwX2NvbmYuZW52LmN1cnJlbnRfY29uZi53YXRjaDtcbiAgICB0aGlzLnRvZ2dsZVdhdGNoKG1ldGhvZCwgYXBwX2NvbmYpO1xuICB9XG5cbiAgaWYgKCF0aGlzLmNsaWVudCB8fCAhdGhpcy5jbGllbnQuY2FsbCkge1xuICAgIHRoaXMuc3RhcnQoZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgaWYgKGZuKVxuICAgICAgICAgIHJldHVybiBmbihlcnJvcik7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDApO1xuICAgICAgfVxuICAgICAgaWYgKHNlbGYuY2xpZW50KSB7XG4gICAgICAgIHJldHVybiBzZWxmLmNsaWVudC5jYWxsKG1ldGhvZCwgYXBwX2NvbmYsIGZuKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBkZWJ1ZygnQ2FsbGluZyBkYWVtb24gbWV0aG9kIHBtMjolcyBvbiBycGMgc29ja2V0OiVzJywgbWV0aG9kLCB0aGlzLnJwY19zb2NrZXRfZmlsZSk7XG4gIHJldHVybiB0aGlzLmNsaWVudC5jYWxsKG1ldGhvZCwgYXBwX2NvbmYsIGZuKTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUubm90aWZ5R29kID0gZnVuY3Rpb24gKGFjdGlvbl9uYW1lLCBpZCwgY2IpIHtcbiAgdGhpcy5leGVjdXRlUmVtb3RlKCdub3RpZnlCeVByb2Nlc3NJZCcsIHtcbiAgICBpZDogaWQsXG4gICAgYWN0aW9uX25hbWU6IGFjdGlvbl9uYW1lLFxuICAgIG1hbnVhbGx5OiB0cnVlXG4gIH0sIGZ1bmN0aW9uICgpIHtcbiAgICBkZWJ1ZygnR29kIG5vdGlmaWVkJyk7XG4gICAgcmV0dXJuIGNiID8gY2IoKSA6IGZhbHNlO1xuICB9KTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUua2lsbERhZW1vbiA9IGZ1bmN0aW9uIGtpbGxEYWVtb24oZm4pIHtcbiAgdmFyIHRpbWVvdXQ7XG4gIHZhciB0aGF0ID0gdGhpcztcblxuICBmdW5jdGlvbiBxdWl0KCkge1xuICAgIHRoYXQuY2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGZuID8gZm4obnVsbCwgeyBzdWNjZXNzOiB0cnVlIH0pIDogZmFsc2U7XG4gICAgfSk7XG4gIH1cblxuICAvLyB1bmRlciB1bml4LCB3ZSBsaXN0ZW4gZm9yIHNpZ25hbCAodGhhdCBpcyBzZW5kIGJ5IGRhZW1vbiB0byBub3RpZnkgdXMgdGhhdCBpdHMgc2h1dGluZyBkb3duKVxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykge1xuICAgIHByb2Nlc3Mub25jZSgnU0lHUVVJVCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGRlYnVnKCdSZWNlaXZlZCBTSUdRVUlUIGZyb20gcG0yIGRhZW1vbicpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgcXVpdCgpO1xuICAgIH0pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIGlmIHVuZGVyIHdpbmRvd3MsIHRyeSB0byBwaW5nIHRoZSBkYWVtb24gdG8gc2VlIGlmIGl0IHN0aWxsIGhlcmVcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoYXQucGluZ0RhZW1vbihmdW5jdGlvbiAoYWxpdmUpIHtcbiAgICAgICAgaWYgKCFhbGl2ZSkge1xuICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICByZXR1cm4gcXVpdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCAyNTApXG4gIH1cblxuICB0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgcXVpdCgpO1xuICB9LCAzMDAwKTtcblxuICAvLyBLaWxsIGRhZW1vblxuICB0aGlzLmV4ZWN1dGVSZW1vdGUoJ2tpbGxNZScsIHsgcGlkOiBwcm9jZXNzLnBpZCB9KTtcbn07XG5cblxuLyoqXG4gKiBEZXNjcmlwdGlvblxuICogQG1ldGhvZCB0b2dnbGVXYXRjaFxuICogQHBhcmFtIHtTdHJpbmd9IHBtMiBtZXRob2QgbmFtZVxuICogQHBhcmFtIHtPYmplY3R9IGFwcGxpY2F0aW9uIGVudmlyb25tZW50LCBzaG91bGQgaW5jbHVkZSBpZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqL1xuQ2xpZW50LnByb3RvdHlwZS50b2dnbGVXYXRjaCA9IGZ1bmN0aW9uIHRvZ2dsZVdhdGNoKG1ldGhvZCwgZW52LCBmbikge1xuICBkZWJ1ZygnQ2FsbGluZyB0b2dnbGVXYXRjaCcpO1xuICB0aGlzLmNsaWVudC5jYWxsKCd0b2dnbGVXYXRjaCcsIG1ldGhvZCwgZW52LCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZuID8gZm4oKSA6IGZhbHNlO1xuICB9KTtcbn07XG5cbi8qKlxuICogRGVzY3JpcHRpb25cbiAqIEBtZXRob2Qgc3RhcnRXYXRjaFxuICogQHBhcmFtIHtTdHJpbmd9IHBtMiBtZXRob2QgbmFtZVxuICogQHBhcmFtIHtPYmplY3R9IGFwcGxpY2F0aW9uIGVudmlyb25tZW50LCBzaG91bGQgaW5jbHVkZSBpZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqL1xuQ2xpZW50LnByb3RvdHlwZS5zdGFydFdhdGNoID0gZnVuY3Rpb24gcmVzdGFydFdhdGNoKG1ldGhvZCwgZW52LCBmbikge1xuICBkZWJ1ZygnQ2FsbGluZyBzdGFydFdhdGNoJyk7XG4gIHRoaXMuY2xpZW50LmNhbGwoJ3N0YXJ0V2F0Y2gnLCBtZXRob2QsIGVudiwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbiA/IGZuKCkgOiBmYWxzZTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIERlc2NyaXB0aW9uXG4gKiBAbWV0aG9kIHN0b3BXYXRjaFxuICogQHBhcmFtIHtTdHJpbmd9IHBtMiBtZXRob2QgbmFtZVxuICogQHBhcmFtIHtPYmplY3R9IGFwcGxpY2F0aW9uIGVudmlyb25tZW50LCBzaG91bGQgaW5jbHVkZSBpZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqL1xuQ2xpZW50LnByb3RvdHlwZS5zdG9wV2F0Y2ggPSBmdW5jdGlvbiBzdG9wV2F0Y2gobWV0aG9kLCBlbnYsIGZuKSB7XG4gIGRlYnVnKCdDYWxsaW5nIHN0b3BXYXRjaCcpO1xuICB0aGlzLmNsaWVudC5jYWxsKCdzdG9wV2F0Y2gnLCBtZXRob2QsIGVudiwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbiA/IGZuKCkgOiBmYWxzZTtcbiAgfSk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmdldEFsbFByb2Nlc3MgPSBmdW5jdGlvbiAoY2IpIHtcbiAgdmFyIGZvdW5kX3Byb2MgPSBbXTtcblxuICB0aGlzLmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIHByb2NzKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgIHJldHVybiBjYihlcnIpO1xuICAgIH1cblxuICAgIHJldHVybiBjYihudWxsLCBwcm9jcyk7XG4gIH0pO1xufTtcblxuQ2xpZW50LnByb3RvdHlwZS5nZXRBbGxQcm9jZXNzSWQgPSBmdW5jdGlvbiAoY2IpIHtcbiAgdmFyIGZvdW5kX3Byb2MgPSBbXTtcblxuICB0aGlzLmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIHByb2NzKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgIHJldHVybiBjYihlcnIpO1xuICAgIH1cblxuICAgIHJldHVybiBjYihudWxsLCBwcm9jcy5tYXAocHJvYyA9PiBwcm9jLnBtX2lkKSk7XG4gIH0pO1xufTtcblxuQ2xpZW50LnByb3RvdHlwZS5nZXRBbGxQcm9jZXNzSWRXaXRob3V0TW9kdWxlcyA9IGZ1bmN0aW9uIChjYikge1xuICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuXG4gIHRoaXMuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24gKGVyciwgcHJvY3MpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcignRXJyb3IgcmV0cmlldmluZyBwcm9jZXNzIGxpc3Q6ICcgKyBlcnIpO1xuICAgICAgcmV0dXJuIGNiKGVycik7XG4gICAgfVxuXG4gICAgdmFyIHByb2NfaWRzID0gcHJvY3NcbiAgICAgIC5maWx0ZXIocHJvYyA9PiAhcHJvYy5wbTJfZW52LnBteF9tb2R1bGUpXG4gICAgICAubWFwKHByb2MgPT4gcHJvYy5wbV9pZClcblxuICAgIHJldHVybiBjYihudWxsLCBwcm9jX2lkcyk7XG4gIH0pO1xufTtcblxuQ2xpZW50LnByb3RvdHlwZS5nZXRQcm9jZXNzSWRCeU5hbWUgPSBmdW5jdGlvbiAobmFtZSwgZm9yY2VfYWxsLCBjYikge1xuICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuICB2YXIgZnVsbF9kZXRhaWxzID0ge307XG5cbiAgaWYgKHR5cGVvZiAoY2IpID09PSAndW5kZWZpbmVkJykge1xuICAgIGNiID0gZm9yY2VfYWxsO1xuICAgIGZvcmNlX2FsbCA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiAobmFtZSkgPT0gJ251bWJlcicpXG4gICAgbmFtZSA9IG5hbWUudG9TdHJpbmcoKTtcblxuICB0aGlzLmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcignRXJyb3IgcmV0cmlldmluZyBwcm9jZXNzIGxpc3Q6ICcgKyBlcnIpO1xuICAgICAgcmV0dXJuIGNiKGVycik7XG4gICAgfVxuXG4gICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChwcm9jKSB7XG4gICAgICBpZiAocHJvYy5wbTJfZW52Lm5hbWUgPT0gbmFtZSB8fCBwcm9jLnBtMl9lbnYucG1fZXhlY19wYXRoID09IHBhdGgucmVzb2x2ZShuYW1lKSkge1xuICAgICAgICBmb3VuZF9wcm9jLnB1c2gocHJvYy5wbV9pZCk7XG4gICAgICAgIGZ1bGxfZGV0YWlsc1twcm9jLnBtX2lkXSA9IHByb2M7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY2IobnVsbCwgZm91bmRfcHJvYywgZnVsbF9kZXRhaWxzKTtcbiAgfSk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmdldFByb2Nlc3NJZHNCeU5hbWVzcGFjZSA9IGZ1bmN0aW9uIChuYW1lc3BhY2UsIGZvcmNlX2FsbCwgY2IpIHtcbiAgdmFyIGZvdW5kX3Byb2MgPSBbXTtcbiAgdmFyIGZ1bGxfZGV0YWlscyA9IHt9O1xuXG4gIGlmICh0eXBlb2YgKGNiKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjYiA9IGZvcmNlX2FsbDtcbiAgICBmb3JjZV9hbGwgPSBmYWxzZTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgKG5hbWVzcGFjZSkgPT0gJ251bWJlcicpXG4gICAgbmFtZXNwYWNlID0gbmFtZXNwYWNlLnRvU3RyaW5nKCk7XG5cbiAgdGhpcy5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgaWYgKGVycikge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgIHJldHVybiBjYihlcnIpO1xuICAgIH1cblxuICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbiAocHJvYykge1xuICAgICAgaWYgKHByb2MucG0yX2Vudi5uYW1lc3BhY2UgPT0gbmFtZXNwYWNlKSB7XG4gICAgICAgIGZvdW5kX3Byb2MucHVzaChwcm9jLnBtX2lkKTtcbiAgICAgICAgZnVsbF9kZXRhaWxzW3Byb2MucG1faWRdID0gcHJvYztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBjYihudWxsLCBmb3VuZF9wcm9jLCBmdWxsX2RldGFpbHMpO1xuICB9KTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUuZ2V0UHJvY2Vzc0J5TmFtZSA9IGZ1bmN0aW9uIChuYW1lLCBjYikge1xuICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuXG4gIHRoaXMuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24gKGVyciwgbGlzdCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIENvbW1vbi5wcmludEVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICB9XG5cbiAgICBsaXN0LmZvckVhY2goZnVuY3Rpb24gKHByb2MpIHtcbiAgICAgIGlmIChwcm9jLnBtMl9lbnYubmFtZSA9PSBuYW1lIHx8XG4gICAgICAgIHByb2MucG0yX2Vudi5wbV9leGVjX3BhdGggPT0gcGF0aC5yZXNvbHZlKG5hbWUpKSB7XG4gICAgICAgIGZvdW5kX3Byb2MucHVzaChwcm9jKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBjYihudWxsLCBmb3VuZF9wcm9jKTtcbiAgfSk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmdldFByb2Nlc3NCeU5hbWVPcklkID0gZnVuY3Rpb24gKG5hbWVPcklkLCBjYikge1xuICB2YXIgZm91bmRQcm9jID0gW107XG5cbiAgdGhpcy5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgaWYgKGVycikge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgIHJldHVybiBjYihlcnIpO1xuICAgIH1cblxuICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbiAocHJvYykge1xuICAgICAgaWYgKHByb2MucG0yX2Vudi5uYW1lID09PSBuYW1lT3JJZCB8fFxuICAgICAgICBwcm9jLnBtMl9lbnYucG1fZXhlY19wYXRoID09PSBwYXRoLnJlc29sdmUobmFtZU9ySWQpIHx8XG4gICAgICAgIHByb2MucGlkID09PSBwYXJzZUludChuYW1lT3JJZCkgfHxcbiAgICAgICAgcHJvYy5wbTJfZW52LnBtX2lkID09PSBwYXJzZUludChuYW1lT3JJZCkpIHtcbiAgICAgICAgZm91bmRQcm9jLnB1c2gocHJvYyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY2IobnVsbCwgZm91bmRQcm9jKTtcbiAgfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDbGllbnQ7XG4iXX0=