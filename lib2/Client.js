"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _debug = _interopRequireDefault(require("debug"));

var _Common = _interopRequireDefault(require("./Common"));

var _InteractorClient = _interopRequireDefault(require("@pm2/agent/src/InteractorClient"));

var _pm2AxonRpc = _interopRequireDefault(require("pm2-axon-rpc"));

var _forEach = _interopRequireDefault(require("async/forEach"));

var _pm2Axon = _interopRequireDefault(require("pm2-axon"));

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
  var _this = this;

  this.pingDaemon(function (daemonAlive) {
    if (daemonAlive === true) return _this.launchRPC(function (err, meta) {
      return cb(null, {
        daemon_mode: _this.conf.daemon_mode,
        new_pm2_instance: false,
        rpc_socket_file: _this.rpc_socket_file,
        pub_socket_file: _this.pub_socket_file,
        pm2_home: _this.pm2_home
      });
    });
    /**
     * No Daemon mode
     */

    if (_this.daemon_mode === false) {
      var daemon = new _Daemon["default"]({
        pub_socket_file: _this.conf.DAEMON_PUB_PORT,
        rpc_socket_file: _this.conf.DAEMON_RPC_PORT,
        pid_file: _this.conf.PM2_PID_FILE_PATH,
        ignore_signals: true
      });
      console.log('Launching in no daemon mode');
      daemon.innerStart(function () {
        _InteractorClient["default"].launchAndInteract(_this.conf, {
          machine_name: _this.machine_name,
          public_key: _this.public_key,
          secret_key: _this.secret_key,
          pm2_version: _package["default"].version
        }, function (err, data, interactor_proc) {
          _this.interactor_process = interactor_proc;
        });

        _this.launchRPC(function (err, meta) {
          return cb(null, {
            daemon_mode: _this.conf.daemon_mode,
            new_pm2_instance: true,
            rpc_socket_file: _this.rpc_socket_file,
            pub_socket_file: _this.pub_socket_file,
            pm2_home: _this.pm2_home
          });
        });
      });
      return false;
    }
    /**
     * Daemon mode
     */


    _this.launchDaemon(function (err, child) {
      if (err) {
        _Common["default"].printError(err);

        return cb ? cb(err) : process.exit(_this.conf.ERROR_EXIT);
      }

      if (!process.env.PM2_DISCRETE_MODE) _Common["default"].printOut(_this.conf.PREFIX_MSG + 'PM2 Successfully daemonized');

      _this.launchRPC(function (err, meta) {
        return cb(null, {
          daemon_mode: _this.conf.daemon_mode,
          new_pm2_instance: true,
          rpc_socket_file: _this.rpc_socket_file,
          pub_socket_file: _this.pub_socket_file,
          pm2_home: _this.pm2_home
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
  (0, _forEach["default"])([this.disconnectRPC.bind(this), this.disconnectBus.bind(this)], function (fn, next) {
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

  var ClientJS = _path["default"].resolve(_path["default"].dirname(module.filename), 'Daemon.js');

  var node_args = [];
  var out, err; // if (process.env.TRAVIS) {
  //   // Redirect PM2 internal err and out to STDERR STDOUT when running with Travis
  //   out = 1;
  //   err = 2;
  // }
  // else {

  out = _fs["default"].openSync(this.conf.PM2_LOG_FILE_PATH, 'a'), err = _fs["default"].openSync(this.conf.PM2_LOG_FILE_PATH, 'a'); //}

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
  if (!process.env.PM2_DISCRETE_MODE) _Common["default"].printOut(this.conf.PREFIX_MSG + 'Spawning PM2 daemon with pm2_home=' + this.pm2_home);
  var interpreter = 'node';
  if ((0, _which["default"])('node') == null) interpreter = process.execPath;
  var spawnEnv = Object.assign({}, {
    'SILENT': this.conf.DEBUG ? !this.conf.DEBUG : true,
    'PM2_HOME': this.pm2_home
  }, process.env);
  var child = (0, _child_process.spawn)(interpreter, node_args, {
    detached: true,
    cwd: this.conf.cwd || process.cwd(),
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
    var _this2 = this;

    debug('PM2 daemon launched with return message: ', msg);
    child.removeListener('error', onError);
    child.disconnect();
    if (opts && opts.interactor == false) return cb(null, child);
    if (process.env.PM2_NO_INTERACTION == 'true') return cb(null, child);
    /**
     * Here the Keymetrics agent is launched automaticcaly if
     * it has been already configured before (via pm2 link)
     */

    _InteractorClient["default"].launchAndInteract(this.conf, {
      machine_name: this.machine_name,
      public_key: this.public_key,
      secret_key: this.secret_key,
      pm2_version: _package["default"].version
    }, function (err, data, interactor_proc) {
      _this2.interactor_process = interactor_proc;
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
  var _this3 = this;

  var req = _pm2Axon["default"].socket('req', null);

  var client = new _pm2AxonRpc["default"].Client(req);
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
      _fs["default"].stat(_this3.conf.DAEMON_RPC_PORT, function (e, stats) {
        if (stats.uid === 0) {
          console.error(this.conf.PREFIX_MSG_ERR + 'Permission denied, to give access to current user:');
          console.log('$ sudo chown ' + process.env.USER + ':' + process.env.USER + ' ' + this.conf.DAEMON_RPC_PORT + ' ' + this.conf.DAEMON_PUB_PORT);
        } else console.error(this.conf.PREFIX_MSG_ERR + 'Permission denied, check permissions on ' + this.conf.DAEMON_RPC_PORT);

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
  var _this4 = this;

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
    this.client_sock.once('close', function () {
      clearTimeout(timer);
      _this4.client = null;
      debug('PM2 RPC cleanly closed');
      return cb(null, {
        msg: 'RPC Successfully closed'
      });
    });
    timer = setTimeout(function () {
      if (_this4.client_sock.destroy) _this4.client_sock.destroy();
      _this4.client = null;
      return cb(null, {
        msg: 'RPC Successfully closed via timeout'
      });
    }, 200);
    this.client_sock.close();
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
  var _this5 = this;

  if (!cb) cb = noop;

  if (!this.sub_sock || !this.sub_sock.close) {
    this.sub = null;
    return process.nextTick(function () {
      cb(null, {
        msg: 'bus was not connected'
      });
    });
  }

  if (this.sub_sock.connected === false || this.sub_sock.closing === true) {
    this.sub = null;
    return process.nextTick(function () {
      cb(new Error('SUB connection is already being closed'));
    });
  }

  try {
    var timer;
    this.sub_sock.once('close', function () {
      _this5.sub = null;
      clearTimeout(timer);
      debug('PM2 PUB cleanly closed');
      return cb();
    });
    timer = setTimeout(function () {
      if (_this5.sub_sock.destroy) _this5.sub_sock.destroy();
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
  var _this6 = this;

  // stop watch on stop | env is the process id
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

      if (_this6.client) {
        return _this6.client.call(method, app_conf, fn);
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
  var _this7 = this;

  var timeout;

  var quit = function quit() {
    _this7.close(function () {
      return fn ? fn(null, {
        success: true
      }) : false;
    });
  }; // under unix, we listen for signal (that is send by daemon to notify us that its shuting down)


  if (process.platform !== 'win32') {
    process.once('SIGQUIT', function () {
      debug('Received SIGQUIT from pm2 daemon');
      clearTimeout(timeout);
      quit();
    });
  } else {
    // if under windows, try to ping the daemon to see if it still here
    setTimeout(function () {
      _this7.pingDaemon(function (alive) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9DbGllbnQudHMiXSwibmFtZXMiOlsiZGVidWciLCJub29wIiwiQ2xpZW50Iiwib3B0cyIsImNvbmYiLCJjc3QiLCJzdWJfc29jayIsImRhZW1vbl9tb2RlIiwicG0yX2hvbWUiLCJQTTJfUk9PVF9QQVRIIiwic2VjcmV0X2tleSIsInB1YmxpY19rZXkiLCJtYWNoaW5lX25hbWUiLCJpbml0RmlsZVN0cnVjdHVyZSIsIkRBRU1PTl9SUENfUE9SVCIsIkRBRU1PTl9QVUJfUE9SVCIsInJwY19zb2NrZXRfZmlsZSIsInB1Yl9zb2NrZXRfZmlsZSIsInByb3RvdHlwZSIsInN0YXJ0IiwiY2IiLCJwaW5nRGFlbW9uIiwiZGFlbW9uQWxpdmUiLCJsYXVuY2hSUEMiLCJlcnIiLCJtZXRhIiwibmV3X3BtMl9pbnN0YW5jZSIsImRhZW1vbiIsIkRhZW1vbiIsInBpZF9maWxlIiwiUE0yX1BJRF9GSUxFX1BBVEgiLCJpZ25vcmVfc2lnbmFscyIsImNvbnNvbGUiLCJsb2ciLCJpbm5lclN0YXJ0IiwiS01EYWVtb24iLCJsYXVuY2hBbmRJbnRlcmFjdCIsInBtMl92ZXJzaW9uIiwicGtnIiwidmVyc2lvbiIsImRhdGEiLCJpbnRlcmFjdG9yX3Byb2MiLCJpbnRlcmFjdG9yX3Byb2Nlc3MiLCJsYXVuY2hEYWVtb24iLCJjaGlsZCIsIkNvbW1vbiIsInByaW50RXJyb3IiLCJwcm9jZXNzIiwiZXhpdCIsIkVSUk9SX0VYSVQiLCJlbnYiLCJQTTJfRElTQ1JFVEVfTU9ERSIsInByaW50T3V0IiwiUFJFRklYX01TRyIsImZzIiwiZXhpc3RzU3luYyIsIkRFRkFVTFRfTE9HX1BBVEgiLCJta2RpcnAiLCJzeW5jIiwiZSIsImVycm9yIiwic3RhY2siLCJERUZBVUxUX1BJRF9QQVRIIiwiUE0yX01PRFVMRV9DT05GX0ZJTEUiLCJ3cml0ZUZpbGVTeW5jIiwiREVGQVVMVF9NT0RVTEVfUEFUSCIsInBhdGgiLCJqb2luIiwiUE0yX0hPTUUiLCJEYXRlIiwibm93IiwidG9TdHJpbmciLCJQTTJfUFJPR1JBTU1BVElDIiwic3RhdGUiLCJkdCIsInJlYWRGaWxlU3luYyIsIl9fZGlybmFtZSIsIlBNMl9CQU5ORVIiLCJjbG9zZSIsImRpc2Nvbm5lY3RSUEMiLCJiaW5kIiwiZGlzY29ubmVjdEJ1cyIsImZuIiwibmV4dCIsImludGVyYWN0b3IiLCJDbGllbnRKUyIsInJlc29sdmUiLCJkaXJuYW1lIiwibW9kdWxlIiwiZmlsZW5hbWUiLCJub2RlX2FyZ3MiLCJvdXQiLCJvcGVuU3luYyIsIlBNMl9MT0dfRklMRV9QQVRIIiwiTE9XX01FTU9SWV9FTlZJUk9OTUVOVCIsInB1c2giLCJNYXRoIiwiZmxvb3IiLCJvcyIsInRvdGFsbWVtIiwiUE0yX05PREVfT1BUSU9OUyIsImNvbmNhdCIsInNwbGl0IiwiaW50ZXJwcmV0ZXIiLCJleGVjUGF0aCIsInNwYXduRW52IiwiT2JqZWN0IiwiYXNzaWduIiwiREVCVUciLCJkZXRhY2hlZCIsImN3ZCIsInN0ZGlvIiwib25FcnJvciIsIm1lc3NhZ2UiLCJvbmNlIiwidW5yZWYiLCJtc2ciLCJyZW1vdmVMaXN0ZW5lciIsImRpc2Nvbm5lY3QiLCJQTTJfTk9fSU5URVJBQ1RJT04iLCJyZXEiLCJheG9uIiwic29ja2V0IiwiY2xpZW50IiwicnBjIiwic29jayIsIm5leHRUaWNrIiwiY29kZSIsInN0YXQiLCJzdGF0cyIsInVpZCIsIlBSRUZJWF9NU0dfRVJSIiwiVVNFUiIsImNvbm5lY3QiLCJzZWxmIiwiY29ubmVjdEhhbmRsZXIiLCJlcnJvckhhbmRsZXIiLCJzZXRUaW1lb3V0IiwiY2xpZW50X3NvY2siLCJFcnJvciIsImNvbm5lY3RlZCIsImNsb3NpbmciLCJ0aW1lciIsImNsZWFyVGltZW91dCIsImRlc3Ryb3kiLCJsYXVuY2hCdXMiLCJsYXVuY2hFdmVudFN5c3RlbSIsInN1YiIsImdldEV4cG9zZWRNZXRob2RzIiwibWV0aG9kcyIsImV4ZWN1dGVSZW1vdGUiLCJtZXRob2QiLCJhcHBfY29uZiIsImluZGV4T2YiLCJzdG9wV2F0Y2giLCJhcmd2IiwiY3VycmVudF9jb25mIiwid2F0Y2giLCJ0b2dnbGVXYXRjaCIsImNhbGwiLCJub3RpZnlHb2QiLCJhY3Rpb25fbmFtZSIsImlkIiwibWFudWFsbHkiLCJraWxsRGFlbW9uIiwidGltZW91dCIsInF1aXQiLCJzdWNjZXNzIiwicGxhdGZvcm0iLCJhbGl2ZSIsInBpZCIsInN0YXJ0V2F0Y2giLCJyZXN0YXJ0V2F0Y2giLCJnZXRBbGxQcm9jZXNzIiwiZm91bmRfcHJvYyIsInByb2NzIiwiZ2V0QWxsUHJvY2Vzc0lkIiwibWFwIiwicHJvYyIsInBtX2lkIiwiZ2V0QWxsUHJvY2Vzc0lkV2l0aG91dE1vZHVsZXMiLCJwcm9jX2lkcyIsImZpbHRlciIsInBtMl9lbnYiLCJwbXhfbW9kdWxlIiwiZ2V0UHJvY2Vzc0lkQnlOYW1lIiwibmFtZSIsImZvcmNlX2FsbCIsImZ1bGxfZGV0YWlscyIsImxpc3QiLCJmb3JFYWNoIiwicG1fZXhlY19wYXRoIiwiZ2V0UHJvY2Vzc0lkc0J5TmFtZXNwYWNlIiwibmFtZXNwYWNlIiwiZ2V0UHJvY2Vzc0J5TmFtZSIsImdldFByb2Nlc3NCeU5hbWVPcklkIiwibmFtZU9ySWQiLCJmb3VuZFByb2MiLCJwYXJzZUludCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBTUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBckJBOzs7OztBQXVCQSxJQUFNQSxLQUFLLEdBQUcsdUJBQVksWUFBWixDQUFkOztBQUVBLFNBQVNDLElBQVQsR0FBZ0IsQ0FBRzs7QUFFbkIsSUFBSUMsTUFBTSxHQUFHLFNBQVRBLE1BQVMsQ0FBVUMsSUFBVixFQUFnQjtBQUMzQixNQUFJLENBQUNBLElBQUwsRUFBV0EsSUFBSSxHQUFHLEVBQVA7QUFFWCxNQUFJLENBQUNBLElBQUksQ0FBQ0MsSUFBVixFQUNFLEtBQUtBLElBQUwsR0FBWUMscUJBQVosQ0FERixLQUVLO0FBQ0gsU0FBS0QsSUFBTCxHQUFZRCxJQUFJLENBQUNDLElBQWpCO0FBQ0Q7QUFFRCxPQUFLRSxRQUFMLEdBQWdCLEVBQWhCO0FBQ0EsT0FBS0MsV0FBTCxHQUFtQixPQUFRSixJQUFJLENBQUNJLFdBQWIsS0FBOEIsV0FBOUIsR0FBNEMsSUFBNUMsR0FBbURKLElBQUksQ0FBQ0ksV0FBM0U7QUFDQSxPQUFLQyxRQUFMLEdBQWdCLEtBQUtKLElBQUwsQ0FBVUssYUFBMUI7QUFDQSxPQUFLQyxVQUFMLEdBQWtCUCxJQUFJLENBQUNPLFVBQXZCO0FBQ0EsT0FBS0MsVUFBTCxHQUFrQlIsSUFBSSxDQUFDUSxVQUF2QjtBQUNBLE9BQUtDLFlBQUwsR0FBb0JULElBQUksQ0FBQ1MsWUFBekIsQ0FkMkIsQ0FnQjNCO0FBQ0E7O0FBQ0EsT0FBS0MsaUJBQUwsQ0FBdUIsS0FBS1QsSUFBNUI7QUFFQUosRUFBQUEsS0FBSyxDQUFDLG1CQUFELEVBQXNCLEtBQUtJLElBQUwsQ0FBVVUsZUFBaEMsQ0FBTDtBQUNBZCxFQUFBQSxLQUFLLENBQUMsbUJBQUQsRUFBc0IsS0FBS0ksSUFBTCxDQUFVVyxlQUFoQyxDQUFMO0FBQ0EsT0FBS0MsZUFBTCxHQUF1QixLQUFLWixJQUFMLENBQVVVLGVBQWpDO0FBQ0EsT0FBS0csZUFBTCxHQUF1QixLQUFLYixJQUFMLENBQVVXLGVBQWpDO0FBQ0QsQ0F4QkQsQyxDQTBCQTtBQUNBOzs7QUFDQWIsTUFBTSxDQUFDZ0IsU0FBUCxDQUFpQkMsS0FBakIsR0FBeUIsVUFBVUMsRUFBVixFQUFjO0FBQUE7O0FBQ3JDLE9BQUtDLFVBQUwsQ0FBZ0IsVUFBQ0MsV0FBRCxFQUFpQjtBQUMvQixRQUFJQSxXQUFXLEtBQUssSUFBcEIsRUFDRSxPQUFPLEtBQUksQ0FBQ0MsU0FBTCxDQUFlLFVBQUNDLEdBQUQsRUFBTUMsSUFBTixFQUFlO0FBQ25DLGFBQU9MLEVBQUUsQ0FBQyxJQUFELEVBQU87QUFDZGIsUUFBQUEsV0FBVyxFQUFFLEtBQUksQ0FBQ0gsSUFBTCxDQUFVRyxXQURUO0FBRWRtQixRQUFBQSxnQkFBZ0IsRUFBRSxLQUZKO0FBR2RWLFFBQUFBLGVBQWUsRUFBRSxLQUFJLENBQUNBLGVBSFI7QUFJZEMsUUFBQUEsZUFBZSxFQUFFLEtBQUksQ0FBQ0EsZUFKUjtBQUtkVCxRQUFBQSxRQUFRLEVBQUUsS0FBSSxDQUFDQTtBQUxELE9BQVAsQ0FBVDtBQU9ELEtBUk0sQ0FBUDtBQVVGOzs7O0FBR0EsUUFBSSxLQUFJLENBQUNELFdBQUwsS0FBcUIsS0FBekIsRUFBZ0M7QUFDOUIsVUFBSW9CLE1BQU0sR0FBRyxJQUFJQyxrQkFBSixDQUFXO0FBQ3RCWCxRQUFBQSxlQUFlLEVBQUUsS0FBSSxDQUFDYixJQUFMLENBQVVXLGVBREw7QUFFdEJDLFFBQUFBLGVBQWUsRUFBRSxLQUFJLENBQUNaLElBQUwsQ0FBVVUsZUFGTDtBQUd0QmUsUUFBQUEsUUFBUSxFQUFFLEtBQUksQ0FBQ3pCLElBQUwsQ0FBVTBCLGlCQUhFO0FBSXRCQyxRQUFBQSxjQUFjLEVBQUU7QUFKTSxPQUFYLENBQWI7QUFPQUMsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksNkJBQVo7QUFFQU4sTUFBQUEsTUFBTSxDQUFDTyxVQUFQLENBQWtCLFlBQU07QUFDdEJDLHFDQUFTQyxpQkFBVCxDQUEyQixLQUFJLENBQUNoQyxJQUFoQyxFQUFzQztBQUNwQ1EsVUFBQUEsWUFBWSxFQUFFLEtBQUksQ0FBQ0EsWUFEaUI7QUFFcENELFVBQUFBLFVBQVUsRUFBRSxLQUFJLENBQUNBLFVBRm1CO0FBR3BDRCxVQUFBQSxVQUFVLEVBQUUsS0FBSSxDQUFDQSxVQUhtQjtBQUlwQzJCLFVBQUFBLFdBQVcsRUFBRUMsb0JBQUlDO0FBSm1CLFNBQXRDLEVBS0csVUFBQ2YsR0FBRCxFQUFNZ0IsSUFBTixFQUFZQyxlQUFaLEVBQWdDO0FBQ2pDLFVBQUEsS0FBSSxDQUFDQyxrQkFBTCxHQUEwQkQsZUFBMUI7QUFDRCxTQVBEOztBQVNBLFFBQUEsS0FBSSxDQUFDbEIsU0FBTCxDQUFlLFVBQUNDLEdBQUQsRUFBTUMsSUFBTixFQUFlO0FBQzVCLGlCQUFPTCxFQUFFLENBQUMsSUFBRCxFQUFPO0FBQ2RiLFlBQUFBLFdBQVcsRUFBRSxLQUFJLENBQUNILElBQUwsQ0FBVUcsV0FEVDtBQUVkbUIsWUFBQUEsZ0JBQWdCLEVBQUUsSUFGSjtBQUdkVixZQUFBQSxlQUFlLEVBQUUsS0FBSSxDQUFDQSxlQUhSO0FBSWRDLFlBQUFBLGVBQWUsRUFBRSxLQUFJLENBQUNBLGVBSlI7QUFLZFQsWUFBQUEsUUFBUSxFQUFFLEtBQUksQ0FBQ0E7QUFMRCxXQUFQLENBQVQ7QUFPRCxTQVJEO0FBU0QsT0FuQkQ7QUFvQkEsYUFBTyxLQUFQO0FBQ0Q7QUFFRDs7Ozs7QUFHQSxJQUFBLEtBQUksQ0FBQ21DLFlBQUwsQ0FBa0IsVUFBQ25CLEdBQUQsRUFBTW9CLEtBQU4sRUFBZ0I7QUFDaEMsVUFBSXBCLEdBQUosRUFBUztBQUNQcUIsMkJBQU9DLFVBQVAsQ0FBa0J0QixHQUFsQjs7QUFDQSxlQUFPSixFQUFFLEdBQUdBLEVBQUUsQ0FBQ0ksR0FBRCxDQUFMLEdBQWF1QixPQUFPLENBQUNDLElBQVIsQ0FBYSxLQUFJLENBQUM1QyxJQUFMLENBQVU2QyxVQUF2QixDQUF0QjtBQUNEOztBQUVELFVBQUksQ0FBQ0YsT0FBTyxDQUFDRyxHQUFSLENBQVlDLGlCQUFqQixFQUNFTixtQkFBT08sUUFBUCxDQUFnQixLQUFJLENBQUNoRCxJQUFMLENBQVVpRCxVQUFWLEdBQXVCLDZCQUF2Qzs7QUFFRixNQUFBLEtBQUksQ0FBQzlCLFNBQUwsQ0FBZSxVQUFDQyxHQUFELEVBQU1DLElBQU4sRUFBZTtBQUM1QixlQUFPTCxFQUFFLENBQUMsSUFBRCxFQUFPO0FBQ2RiLFVBQUFBLFdBQVcsRUFBRSxLQUFJLENBQUNILElBQUwsQ0FBVUcsV0FEVDtBQUVkbUIsVUFBQUEsZ0JBQWdCLEVBQUUsSUFGSjtBQUdkVixVQUFBQSxlQUFlLEVBQUUsS0FBSSxDQUFDQSxlQUhSO0FBSWRDLFVBQUFBLGVBQWUsRUFBRSxLQUFJLENBQUNBLGVBSlI7QUFLZFQsVUFBQUEsUUFBUSxFQUFFLEtBQUksQ0FBQ0E7QUFMRCxTQUFQLENBQVQ7QUFPRCxPQVJEO0FBU0QsS0FsQkQ7QUFtQkQsR0F0RUQ7QUF1RUQsQ0F4RUQsQyxDQTBFQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0FOLE1BQU0sQ0FBQ2dCLFNBQVAsQ0FBaUJMLGlCQUFqQixHQUFxQyxVQUFVVixJQUFWLEVBQWdCO0FBQ25ELE1BQUksQ0FBQ21ELGVBQUdDLFVBQUgsQ0FBY3BELElBQUksQ0FBQ3FELGdCQUFuQixDQUFMLEVBQTJDO0FBQ3pDLFFBQUk7QUFDRkMseUJBQU9DLElBQVAsQ0FBWXZELElBQUksQ0FBQ3FELGdCQUFqQjtBQUNELEtBRkQsQ0FFRSxPQUFPRyxDQUFQLEVBQVU7QUFDVjNCLE1BQUFBLE9BQU8sQ0FBQzRCLEtBQVIsQ0FBY0QsQ0FBQyxDQUFDRSxLQUFGLElBQVdGLENBQXpCO0FBQ0Q7QUFDRjs7QUFFRCxNQUFJLENBQUNMLGVBQUdDLFVBQUgsQ0FBY3BELElBQUksQ0FBQzJELGdCQUFuQixDQUFMLEVBQTJDO0FBQ3pDLFFBQUk7QUFDRkwseUJBQU9DLElBQVAsQ0FBWXZELElBQUksQ0FBQzJELGdCQUFqQjtBQUNELEtBRkQsQ0FFRSxPQUFPSCxDQUFQLEVBQVU7QUFDVjNCLE1BQUFBLE9BQU8sQ0FBQzRCLEtBQVIsQ0FBY0QsQ0FBQyxDQUFDRSxLQUFGLElBQVdGLENBQXpCO0FBQ0Q7QUFDRjs7QUFFRCxNQUFJLENBQUNMLGVBQUdDLFVBQUgsQ0FBY3BELElBQUksQ0FBQzRELG9CQUFuQixDQUFMLEVBQStDO0FBQzdDLFFBQUk7QUFDRlQscUJBQUdVLGFBQUgsQ0FBaUI3RCxJQUFJLENBQUM0RCxvQkFBdEIsRUFBNEMsSUFBNUM7QUFDRCxLQUZELENBRUUsT0FBT0osQ0FBUCxFQUFVO0FBQ1YzQixNQUFBQSxPQUFPLENBQUM0QixLQUFSLENBQWNELENBQUMsQ0FBQ0UsS0FBRixJQUFXRixDQUF6QjtBQUNEO0FBQ0Y7O0FBRUQsTUFBSSxDQUFDTCxlQUFHQyxVQUFILENBQWNwRCxJQUFJLENBQUM4RCxtQkFBbkIsQ0FBTCxFQUE4QztBQUM1QyxRQUFJO0FBQ0ZSLHlCQUFPQyxJQUFQLENBQVl2RCxJQUFJLENBQUM4RCxtQkFBakI7QUFDRCxLQUZELENBRUUsT0FBT04sQ0FBUCxFQUFVO0FBQ1YzQixNQUFBQSxPQUFPLENBQUM0QixLQUFSLENBQWNELENBQUMsQ0FBQ0UsS0FBRixJQUFXRixDQUF6QjtBQUNEO0FBQ0Y7O0FBRUQsTUFBSVosT0FBTyxDQUFDRyxHQUFSLENBQVlDLGlCQUFoQixFQUFtQztBQUNqQyxRQUFJO0FBQ0ZHLHFCQUFHVSxhQUFILENBQWlCRSxpQkFBS0MsSUFBTCxDQUFVaEUsSUFBSSxDQUFDaUUsUUFBZixFQUF5QixPQUF6QixDQUFqQixFQUFvREMsSUFBSSxDQUFDQyxHQUFMLEdBQVdDLFFBQVgsRUFBcEQ7QUFDRCxLQUZELENBRUUsT0FBT1osQ0FBUCxFQUFVO0FBQ1YzRCxNQUFBQSxLQUFLLENBQUMyRCxDQUFDLENBQUNFLEtBQUYsSUFBV0YsQ0FBWixDQUFMO0FBQ0Q7QUFDRjs7QUFFRCxNQUFJLENBQUNaLE9BQU8sQ0FBQ0csR0FBUixDQUFZc0IsZ0JBQWIsSUFBaUMsQ0FBQ2xCLGVBQUdDLFVBQUgsQ0FBY1csaUJBQUtDLElBQUwsQ0FBVWhFLElBQUksQ0FBQ2lFLFFBQWYsRUFBeUIsT0FBekIsQ0FBZCxDQUF0QyxFQUF3RjtBQUN0RixrQ0FBTztBQUNMSyxNQUFBQSxLQUFLLEVBQUUsU0FERjtBQUVMbEMsTUFBQUEsT0FBTyxFQUFFRCxvQkFBSUM7QUFGUixLQUFQOztBQUtBLFFBQUltQyxFQUFFLEdBQUdwQixlQUFHcUIsWUFBSCxDQUFnQlQsaUJBQUtDLElBQUwsQ0FBVVMsU0FBVixFQUFxQnpFLElBQUksQ0FBQzBFLFVBQTFCLENBQWhCLENBQVQ7O0FBQ0E3QyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWXlDLEVBQUUsQ0FBQ0gsUUFBSCxFQUFaOztBQUNBLFFBQUk7QUFDRmpCLHFCQUFHVSxhQUFILENBQWlCRSxpQkFBS0MsSUFBTCxDQUFVaEUsSUFBSSxDQUFDaUUsUUFBZixFQUF5QixPQUF6QixDQUFqQixFQUFvREMsSUFBSSxDQUFDQyxHQUFMLEdBQVdDLFFBQVgsRUFBcEQ7QUFDRCxLQUZELENBRUUsT0FBT1osQ0FBUCxFQUFVO0FBQ1YzRCxNQUFBQSxLQUFLLENBQUMyRCxDQUFDLENBQUNFLEtBQUYsSUFBV0YsQ0FBWixDQUFMO0FBQ0Q7QUFDRjtBQUNGLENBdkREOztBQXlEQXpELE1BQU0sQ0FBQ2dCLFNBQVAsQ0FBaUI0RCxLQUFqQixHQUF5QixVQUFVMUQsRUFBVixFQUFjO0FBQ3JDLDJCQUFRLENBQ04sS0FBSzJELGFBQUwsQ0FBbUJDLElBQW5CLENBQXdCLElBQXhCLENBRE0sRUFFTixLQUFLQyxhQUFMLENBQW1CRCxJQUFuQixDQUF3QixJQUF4QixDQUZNLENBQVIsRUFHRyxVQUFVRSxFQUFWLEVBQWNDLElBQWQsRUFBb0I7QUFDckJELElBQUFBLEVBQUUsQ0FBQ0MsSUFBRCxDQUFGO0FBQ0QsR0FMRCxFQUtHL0QsRUFMSDtBQU1ELENBUEQ7QUFTQTs7Ozs7Ozs7OztBQVFBbEIsTUFBTSxDQUFDZ0IsU0FBUCxDQUFpQnlCLFlBQWpCLEdBQWdDLFVBQVV4QyxJQUFWLEVBQWdCaUIsRUFBaEIsRUFBb0I7QUFDbEQsTUFBSSxPQUFRakIsSUFBUixJQUFpQixVQUFyQixFQUFpQztBQUMvQmlCLElBQUFBLEVBQUUsR0FBR2pCLElBQUw7QUFDQUEsSUFBQUEsSUFBSSxHQUFHO0FBQ0xpRixNQUFBQSxVQUFVLEVBQUU7QUFEUCxLQUFQO0FBR0Q7O0FBRUQsTUFBSUMsUUFBUSxHQUFHbkIsaUJBQUtvQixPQUFMLENBQWFwQixpQkFBS3FCLE9BQUwsQ0FBYUMsTUFBTSxDQUFDQyxRQUFwQixDQUFiLEVBQTRDLFdBQTVDLENBQWY7O0FBQ0EsTUFBSUMsU0FBUyxHQUFHLEVBQWhCO0FBQ0EsTUFBSUMsR0FBSixFQUFTbkUsR0FBVCxDQVZrRCxDQVlsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0FtRSxFQUFBQSxHQUFHLEdBQUdyQyxlQUFHc0MsUUFBSCxDQUFZLEtBQUt4RixJQUFMLENBQVV5RixpQkFBdEIsRUFBeUMsR0FBekMsQ0FBTixFQUNFckUsR0FBRyxHQUFHOEIsZUFBR3NDLFFBQUgsQ0FBWSxLQUFLeEYsSUFBTCxDQUFVeUYsaUJBQXRCLEVBQXlDLEdBQXpDLENBRFIsQ0FsQmtELENBb0JsRDs7QUFFQSxNQUFJLEtBQUt6RixJQUFMLENBQVUwRixzQkFBZCxFQUFzQztBQUNwQ0osSUFBQUEsU0FBUyxDQUFDSyxJQUFWLENBQWUsYUFBZixFQURvQyxDQUNMOztBQUMvQkwsSUFBQUEsU0FBUyxDQUFDSyxJQUFWLENBQWUsMEJBQTBCQyxJQUFJLENBQUNDLEtBQUwsQ0FBV0MsZUFBR0MsUUFBSCxLQUFnQixJQUFoQixHQUF1QixJQUFsQyxDQUF6QztBQUNELEdBekJpRCxDQTJCbEQ7QUFDQTs7QUFFQTs7Ozs7QUFHQSxNQUFJcEQsT0FBTyxDQUFDRyxHQUFSLENBQVlrRCxnQkFBaEIsRUFDRVYsU0FBUyxHQUFHQSxTQUFTLENBQUNXLE1BQVYsQ0FBaUJ0RCxPQUFPLENBQUNHLEdBQVIsQ0FBWWtELGdCQUFaLENBQTZCRSxLQUE3QixDQUFtQyxHQUFuQyxDQUFqQixDQUFaO0FBQ0ZaLEVBQUFBLFNBQVMsQ0FBQ0ssSUFBVixDQUFlVixRQUFmO0FBRUEsTUFBSSxDQUFDdEMsT0FBTyxDQUFDRyxHQUFSLENBQVlDLGlCQUFqQixFQUNFTixtQkFBT08sUUFBUCxDQUFnQixLQUFLaEQsSUFBTCxDQUFVaUQsVUFBVixHQUF1QixvQ0FBdkIsR0FBOEQsS0FBSzdDLFFBQW5GO0FBRUYsTUFBSStGLFdBQVcsR0FBRyxNQUFsQjtBQUVBLE1BQUksdUJBQU0sTUFBTixLQUFpQixJQUFyQixFQUNFQSxXQUFXLEdBQUd4RCxPQUFPLENBQUN5RCxRQUF0QjtBQUVGLE1BQUlDLFFBQVEsR0FBR0MsTUFBTSxDQUFDQyxNQUFQLENBQWMsRUFBZCxFQUFrQjtBQUMvQixjQUFVLEtBQUt2RyxJQUFMLENBQVV3RyxLQUFWLEdBQWtCLENBQUMsS0FBS3hHLElBQUwsQ0FBVXdHLEtBQTdCLEdBQXFDLElBRGhCO0FBRS9CLGdCQUFZLEtBQUtwRztBQUZjLEdBQWxCLEVBR1p1QyxPQUFPLENBQUNHLEdBSEksQ0FBZjtBQUtBLE1BQUlOLEtBQUssR0FBRywwQkFBTTJELFdBQU4sRUFBbUJiLFNBQW5CLEVBQThCO0FBQ3hDbUIsSUFBQUEsUUFBUSxFQUFFLElBRDhCO0FBRXhDQyxJQUFBQSxHQUFHLEVBQUUsS0FBSzFHLElBQUwsQ0FBVTBHLEdBQVYsSUFBaUIvRCxPQUFPLENBQUMrRCxHQUFSLEVBRmtCO0FBR3hDNUQsSUFBQUEsR0FBRyxFQUFFdUQsUUFIbUM7QUFJeENNLElBQUFBLEtBQUssRUFBRSxDQUFDLEtBQUQsRUFBUXBCLEdBQVIsRUFBYW5FLEdBQWI7QUFKaUMsR0FBOUIsQ0FBWjs7QUFPQSxXQUFTd0YsT0FBVCxDQUFpQnJELENBQWpCLEVBQW9CO0FBQ2xCM0IsSUFBQUEsT0FBTyxDQUFDNEIsS0FBUixDQUFjRCxDQUFDLENBQUNzRCxPQUFGLElBQWF0RCxDQUEzQjtBQUNBLFdBQU92QyxFQUFFLEdBQUdBLEVBQUUsQ0FBQ3VDLENBQUMsQ0FBQ3NELE9BQUYsSUFBYXRELENBQWQsQ0FBTCxHQUF3QixLQUFqQztBQUNEOztBQUVEZixFQUFBQSxLQUFLLENBQUNzRSxJQUFOLENBQVcsT0FBWCxFQUFvQkYsT0FBcEI7QUFFQXBFLEVBQUFBLEtBQUssQ0FBQ3VFLEtBQU47QUFFQXZFLEVBQUFBLEtBQUssQ0FBQ3NFLElBQU4sQ0FBVyxTQUFYLEVBQXNCLFVBQVVFLEdBQVYsRUFBZTtBQUFBOztBQUNuQ3BILElBQUFBLEtBQUssQ0FBQywyQ0FBRCxFQUE4Q29ILEdBQTlDLENBQUw7QUFDQXhFLElBQUFBLEtBQUssQ0FBQ3lFLGNBQU4sQ0FBcUIsT0FBckIsRUFBOEJMLE9BQTlCO0FBQ0FwRSxJQUFBQSxLQUFLLENBQUMwRSxVQUFOO0FBRUEsUUFBSW5ILElBQUksSUFBSUEsSUFBSSxDQUFDaUYsVUFBTCxJQUFtQixLQUEvQixFQUNFLE9BQU9oRSxFQUFFLENBQUMsSUFBRCxFQUFPd0IsS0FBUCxDQUFUO0FBRUYsUUFBSUcsT0FBTyxDQUFDRyxHQUFSLENBQVlxRSxrQkFBWixJQUFrQyxNQUF0QyxFQUNFLE9BQU9uRyxFQUFFLENBQUMsSUFBRCxFQUFPd0IsS0FBUCxDQUFUO0FBRUY7Ozs7O0FBSUFULGlDQUFTQyxpQkFBVCxDQUEyQixLQUFLaEMsSUFBaEMsRUFBc0M7QUFDcENRLE1BQUFBLFlBQVksRUFBRSxLQUFLQSxZQURpQjtBQUVwQ0QsTUFBQUEsVUFBVSxFQUFFLEtBQUtBLFVBRm1CO0FBR3BDRCxNQUFBQSxVQUFVLEVBQUUsS0FBS0EsVUFIbUI7QUFJcEMyQixNQUFBQSxXQUFXLEVBQUVDLG9CQUFJQztBQUptQixLQUF0QyxFQUtHLFVBQUNmLEdBQUQsRUFBTWdCLElBQU4sRUFBWUMsZUFBWixFQUFnQztBQUNqQyxNQUFBLE1BQUksQ0FBQ0Msa0JBQUwsR0FBMEJELGVBQTFCO0FBQ0EsYUFBT3JCLEVBQUUsQ0FBQyxJQUFELEVBQU93QixLQUFQLENBQVQ7QUFDRCxLQVJEO0FBU0QsR0F4QkQ7QUF5QkQsQ0EzRkQ7QUE2RkE7Ozs7Ozs7OztBQU9BMUMsTUFBTSxDQUFDZ0IsU0FBUCxDQUFpQkcsVUFBakIsR0FBOEIsU0FBU0EsVUFBVCxDQUFvQkQsRUFBcEIsRUFBd0I7QUFBQTs7QUFDcEQsTUFBSW9HLEdBQUcsR0FBR0Msb0JBQUtDLE1BQUwsQ0FBWSxLQUFaLEVBQW1CLElBQW5CLENBQVY7O0FBQ0EsTUFBSUMsTUFBTSxHQUFHLElBQUlDLHVCQUFJMUgsTUFBUixDQUFlc0gsR0FBZixDQUFiO0FBRUF4SCxFQUFBQSxLQUFLLENBQUMsd0NBQUQsQ0FBTDtBQUVBMkgsRUFBQUEsTUFBTSxDQUFDRSxJQUFQLENBQVlYLElBQVosQ0FBaUIsbUJBQWpCLEVBQXNDLFlBQU07QUFDMUNTLElBQUFBLE1BQU0sQ0FBQ0UsSUFBUCxDQUFZL0MsS0FBWjtBQUNBOUUsSUFBQUEsS0FBSyxDQUFDLHFCQUFELENBQUw7QUFDQStDLElBQUFBLE9BQU8sQ0FBQytFLFFBQVIsQ0FBaUIsWUFBWTtBQUMzQixhQUFPMUcsRUFBRSxDQUFDLEtBQUQsQ0FBVDtBQUNELEtBRkQ7QUFHRCxHQU5EO0FBUUF1RyxFQUFBQSxNQUFNLENBQUNFLElBQVAsQ0FBWVgsSUFBWixDQUFpQixPQUFqQixFQUEwQixVQUFDdkQsQ0FBRCxFQUFPO0FBQy9CLFFBQUlBLENBQUMsQ0FBQ29FLElBQUYsS0FBVyxRQUFmLEVBQXlCO0FBQ3ZCekUscUJBQUcwRSxJQUFILENBQVEsTUFBSSxDQUFDNUgsSUFBTCxDQUFVVSxlQUFsQixFQUFtQyxVQUFVNkMsQ0FBVixFQUFhc0UsS0FBYixFQUFvQjtBQUNyRCxZQUFJQSxLQUFLLENBQUNDLEdBQU4sS0FBYyxDQUFsQixFQUFxQjtBQUNuQmxHLFVBQUFBLE9BQU8sQ0FBQzRCLEtBQVIsQ0FBYyxLQUFLeEQsSUFBTCxDQUFVK0gsY0FBVixHQUEyQixvREFBekM7QUFDQW5HLFVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGtCQUFrQmMsT0FBTyxDQUFDRyxHQUFSLENBQVlrRixJQUE5QixHQUFxQyxHQUFyQyxHQUEyQ3JGLE9BQU8sQ0FBQ0csR0FBUixDQUFZa0YsSUFBdkQsR0FBOEQsR0FBOUQsR0FBb0UsS0FBS2hJLElBQUwsQ0FBVVUsZUFBOUUsR0FBZ0csR0FBaEcsR0FBc0csS0FBS1YsSUFBTCxDQUFVVyxlQUE1SDtBQUNELFNBSEQsTUFLRWlCLE9BQU8sQ0FBQzRCLEtBQVIsQ0FBYyxLQUFLeEQsSUFBTCxDQUFVK0gsY0FBVixHQUEyQiwwQ0FBM0IsR0FBd0UsS0FBSy9ILElBQUwsQ0FBVVUsZUFBaEc7O0FBRUZpQyxRQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYSxDQUFiO0FBQ0QsT0FURDtBQVVELEtBWEQsTUFhRWhCLE9BQU8sQ0FBQzRCLEtBQVIsQ0FBY0QsQ0FBQyxDQUFDc0QsT0FBRixJQUFhdEQsQ0FBM0I7QUFDSCxHQWZEO0FBaUJBZ0UsRUFBQUEsTUFBTSxDQUFDRSxJQUFQLENBQVlYLElBQVosQ0FBaUIsU0FBakIsRUFBNEIsWUFBWTtBQUN0Q1MsSUFBQUEsTUFBTSxDQUFDRSxJQUFQLENBQVlYLElBQVosQ0FBaUIsT0FBakIsRUFBMEIsWUFBWTtBQUNwQyxhQUFPOUYsRUFBRSxDQUFDLElBQUQsQ0FBVDtBQUNELEtBRkQ7QUFHQXVHLElBQUFBLE1BQU0sQ0FBQ0UsSUFBUCxDQUFZL0MsS0FBWjtBQUNBOUUsSUFBQUEsS0FBSyxDQUFDLGNBQUQsQ0FBTDtBQUNELEdBTkQ7QUFRQXdILEVBQUFBLEdBQUcsQ0FBQ2EsT0FBSixDQUFZLEtBQUtySCxlQUFqQjtBQUNELENBeENEO0FBMENBOzs7Ozs7Ozs7O0FBUUFkLE1BQU0sQ0FBQ2dCLFNBQVAsQ0FBaUJLLFNBQWpCLEdBQTZCLFNBQVNBLFNBQVQsQ0FBbUJILEVBQW5CLEVBQXVCO0FBQ2xELE1BQUlrSCxJQUFJLEdBQUcsSUFBWDtBQUNBdEksRUFBQUEsS0FBSyxDQUFDLHdDQUFELEVBQTJDLEtBQUtnQixlQUFoRCxDQUFMOztBQUNBLE1BQUl3RyxHQUFHLEdBQUdDLG9CQUFLQyxNQUFMLENBQVksS0FBWixFQUFtQixJQUFuQixDQUFWOztBQUNBLE9BQUtDLE1BQUwsR0FBYyxJQUFJQyx1QkFBSTFILE1BQVIsQ0FBZXNILEdBQWYsQ0FBZDs7QUFFQSxNQUFJZSxjQUFjLEdBQUcsU0FBakJBLGNBQWlCLEdBQVk7QUFDL0JELElBQUFBLElBQUksQ0FBQ1gsTUFBTCxDQUFZRSxJQUFaLENBQWlCUixjQUFqQixDQUFnQyxPQUFoQyxFQUF5Q21CLFlBQXpDO0FBQ0F4SSxJQUFBQSxLQUFLLENBQUMseUJBQUQsQ0FBTDs7QUFDQSxRQUFJb0IsRUFBSixFQUFRO0FBQ05xSCxNQUFBQSxVQUFVLENBQUMsWUFBWTtBQUNyQnJILFFBQUFBLEVBQUUsQ0FBQyxJQUFELENBQUY7QUFDRCxPQUZTLEVBRVAsQ0FGTyxDQUFWO0FBR0Q7QUFDRixHQVJEOztBQVVBLE1BQUlvSCxZQUFZLEdBQUcsU0FBZkEsWUFBZSxDQUFVN0UsQ0FBVixFQUFhO0FBQzlCMkUsSUFBQUEsSUFBSSxDQUFDWCxNQUFMLENBQVlFLElBQVosQ0FBaUJSLGNBQWpCLENBQWdDLFNBQWhDLEVBQTJDa0IsY0FBM0M7O0FBQ0EsUUFBSW5ILEVBQUosRUFBUTtBQUNOLGFBQU9BLEVBQUUsQ0FBQ3VDLENBQUQsQ0FBVDtBQUNEO0FBQ0YsR0FMRDs7QUFPQSxPQUFLZ0UsTUFBTCxDQUFZRSxJQUFaLENBQWlCWCxJQUFqQixDQUFzQixTQUF0QixFQUFpQ3FCLGNBQWpDO0FBQ0EsT0FBS1osTUFBTCxDQUFZRSxJQUFaLENBQWlCWCxJQUFqQixDQUFzQixPQUF0QixFQUErQnNCLFlBQS9CO0FBQ0EsT0FBS0UsV0FBTCxHQUFtQmxCLEdBQUcsQ0FBQ2EsT0FBSixDQUFZLEtBQUtySCxlQUFqQixDQUFuQjtBQUNELENBMUJEO0FBNEJBOzs7Ozs7QUFJQWQsTUFBTSxDQUFDZ0IsU0FBUCxDQUFpQjZELGFBQWpCLEdBQWlDLFNBQVNBLGFBQVQsQ0FBdUIzRCxFQUF2QixFQUEyQjtBQUFBOztBQUMxRCxNQUFJLENBQUNBLEVBQUwsRUFBU0EsRUFBRSxHQUFHbkIsSUFBTDs7QUFFVCxNQUFJLENBQUMsS0FBS3lJLFdBQU4sSUFBcUIsQ0FBQyxLQUFLQSxXQUFMLENBQWlCNUQsS0FBM0MsRUFBa0Q7QUFDaEQsU0FBSzZDLE1BQUwsR0FBYyxJQUFkO0FBQ0EsV0FBTzVFLE9BQU8sQ0FBQytFLFFBQVIsQ0FBaUIsWUFBWTtBQUNsQzFHLE1BQUFBLEVBQUUsQ0FBQyxJQUFJdUgsS0FBSixDQUFVLHVDQUFWLENBQUQsQ0FBRjtBQUNELEtBRk0sQ0FBUDtBQUdEOztBQUVELE1BQUksS0FBS0QsV0FBTCxDQUFpQkUsU0FBakIsS0FBK0IsS0FBL0IsSUFDRixLQUFLRixXQUFMLENBQWlCRyxPQUFqQixLQUE2QixJQUQvQixFQUNxQztBQUNuQyxTQUFLbEIsTUFBTCxHQUFjLElBQWQ7QUFDQSxXQUFPNUUsT0FBTyxDQUFDK0UsUUFBUixDQUFpQixZQUFZO0FBQ2xDMUcsTUFBQUEsRUFBRSxDQUFDLElBQUl1SCxLQUFKLENBQVUsMEJBQVYsQ0FBRCxDQUFGO0FBQ0QsS0FGTSxDQUFQO0FBR0Q7O0FBRUQsTUFBSTtBQUNGLFFBQUlHLEtBQUo7QUFFQSxTQUFLSixXQUFMLENBQWlCeEIsSUFBakIsQ0FBc0IsT0FBdEIsRUFBK0IsWUFBTTtBQUNuQzZCLE1BQUFBLFlBQVksQ0FBQ0QsS0FBRCxDQUFaO0FBQ0EsTUFBQSxNQUFJLENBQUNuQixNQUFMLEdBQWMsSUFBZDtBQUNBM0gsTUFBQUEsS0FBSyxDQUFDLHdCQUFELENBQUw7QUFDQSxhQUFPb0IsRUFBRSxDQUFDLElBQUQsRUFBTztBQUFFZ0csUUFBQUEsR0FBRyxFQUFFO0FBQVAsT0FBUCxDQUFUO0FBQ0QsS0FMRDtBQU9BMEIsSUFBQUEsS0FBSyxHQUFHTCxVQUFVLENBQUMsWUFBTTtBQUN2QixVQUFJLE1BQUksQ0FBQ0MsV0FBTCxDQUFpQk0sT0FBckIsRUFDRSxNQUFJLENBQUNOLFdBQUwsQ0FBaUJNLE9BQWpCO0FBQ0YsTUFBQSxNQUFJLENBQUNyQixNQUFMLEdBQWMsSUFBZDtBQUNBLGFBQU92RyxFQUFFLENBQUMsSUFBRCxFQUFPO0FBQUVnRyxRQUFBQSxHQUFHLEVBQUU7QUFBUCxPQUFQLENBQVQ7QUFDRCxLQUxpQixFQUtmLEdBTGUsQ0FBbEI7QUFPQSxTQUFLc0IsV0FBTCxDQUFpQjVELEtBQWpCO0FBQ0QsR0FsQkQsQ0FrQkUsT0FBT25CLENBQVAsRUFBVTtBQUNWM0QsSUFBQUEsS0FBSyxDQUFDLG1DQUFELEVBQXNDMkQsQ0FBQyxDQUFDRSxLQUFGLElBQVdGLENBQWpELENBQUw7QUFDQSxXQUFPdkMsRUFBRSxDQUFDdUMsQ0FBRCxDQUFUO0FBQ0Q7O0FBQ0QsU0FBTyxLQUFQO0FBQ0QsQ0F6Q0Q7O0FBMkNBekQsTUFBTSxDQUFDZ0IsU0FBUCxDQUFpQitILFNBQWpCLEdBQTZCLFNBQVNDLGlCQUFULENBQTJCOUgsRUFBM0IsRUFBK0I7QUFDMUQsTUFBSWtILElBQUksR0FBRyxJQUFYO0FBQ0EsT0FBS2EsR0FBTCxHQUFXMUIsb0JBQUtDLE1BQUwsQ0FBWSxhQUFaLEVBQTJCLElBQTNCLENBQVg7QUFDQSxPQUFLcEgsUUFBTCxHQUFnQixLQUFLNkksR0FBTCxDQUFTZCxPQUFULENBQWlCLEtBQUtwSCxlQUF0QixDQUFoQjtBQUVBLE9BQUtYLFFBQUwsQ0FBYzRHLElBQWQsQ0FBbUIsU0FBbkIsRUFBOEIsWUFBWTtBQUN4QyxXQUFPOUYsRUFBRSxDQUFDLElBQUQsRUFBT2tILElBQUksQ0FBQ2EsR0FBWixFQUFpQmIsSUFBSSxDQUFDaEksUUFBdEIsQ0FBVDtBQUNELEdBRkQ7QUFHRCxDQVJEOztBQVVBSixNQUFNLENBQUNnQixTQUFQLENBQWlCK0QsYUFBakIsR0FBaUMsU0FBU0EsYUFBVCxDQUF1QjdELEVBQXZCLEVBQTJCO0FBQUE7O0FBQzFELE1BQUksQ0FBQ0EsRUFBTCxFQUFTQSxFQUFFLEdBQUduQixJQUFMOztBQUVULE1BQUksQ0FBQyxLQUFLSyxRQUFOLElBQWtCLENBQUMsS0FBS0EsUUFBTCxDQUFjd0UsS0FBckMsRUFBNEM7QUFDMUMsU0FBS3FFLEdBQUwsR0FBVyxJQUFYO0FBQ0EsV0FBT3BHLE9BQU8sQ0FBQytFLFFBQVIsQ0FBaUIsWUFBWTtBQUNsQzFHLE1BQUFBLEVBQUUsQ0FBQyxJQUFELEVBQU87QUFBRWdHLFFBQUFBLEdBQUcsRUFBRTtBQUFQLE9BQVAsQ0FBRjtBQUNELEtBRk0sQ0FBUDtBQUdEOztBQUVELE1BQUksS0FBSzlHLFFBQUwsQ0FBY3NJLFNBQWQsS0FBNEIsS0FBNUIsSUFDRixLQUFLdEksUUFBTCxDQUFjdUksT0FBZCxLQUEwQixJQUQ1QixFQUNrQztBQUNoQyxTQUFLTSxHQUFMLEdBQVcsSUFBWDtBQUNBLFdBQU9wRyxPQUFPLENBQUMrRSxRQUFSLENBQWlCLFlBQVk7QUFDbEMxRyxNQUFBQSxFQUFFLENBQUMsSUFBSXVILEtBQUosQ0FBVSx3Q0FBVixDQUFELENBQUY7QUFDRCxLQUZNLENBQVA7QUFHRDs7QUFFRCxNQUFJO0FBQ0YsUUFBSUcsS0FBSjtBQUVBLFNBQUt4SSxRQUFMLENBQWM0RyxJQUFkLENBQW1CLE9BQW5CLEVBQTRCLFlBQU07QUFDaEMsTUFBQSxNQUFJLENBQUNpQyxHQUFMLEdBQVcsSUFBWDtBQUNBSixNQUFBQSxZQUFZLENBQUNELEtBQUQsQ0FBWjtBQUNBOUksTUFBQUEsS0FBSyxDQUFDLHdCQUFELENBQUw7QUFDQSxhQUFPb0IsRUFBRSxFQUFUO0FBQ0QsS0FMRDtBQU9BMEgsSUFBQUEsS0FBSyxHQUFHTCxVQUFVLENBQUMsWUFBTTtBQUN2QixVQUFJLE1BQUksQ0FBQ25JLFFBQUwsQ0FBYzBJLE9BQWxCLEVBQ0UsTUFBSSxDQUFDMUksUUFBTCxDQUFjMEksT0FBZDtBQUNGLGFBQU81SCxFQUFFLEVBQVQ7QUFDRCxLQUppQixFQUlmLEdBSmUsQ0FBbEI7QUFNQSxTQUFLZCxRQUFMLENBQWN3RSxLQUFkO0FBQ0QsR0FqQkQsQ0FpQkUsT0FBT25CLENBQVAsRUFBVTtBQUNWLFdBQU92QyxFQUFFLENBQUN1QyxDQUFELENBQVQ7QUFDRDtBQUNGLENBdENEO0FBd0NBOzs7Ozs7OztBQU1BekQsTUFBTSxDQUFDZ0IsU0FBUCxDQUFpQmtJLGlCQUFqQixHQUFxQyxTQUFTQSxpQkFBVCxDQUEyQmhJLEVBQTNCLEVBQStCO0FBQ2xFLE9BQUt1RyxNQUFMLENBQVkwQixPQUFaLENBQW9CakksRUFBcEI7QUFDRCxDQUZEO0FBSUE7Ozs7Ozs7Ozs7QUFRQWxCLE1BQU0sQ0FBQ2dCLFNBQVAsQ0FBaUJvSSxhQUFqQixHQUFpQyxTQUFTQSxhQUFULENBQXVCQyxNQUF2QixFQUErQkMsUUFBL0IsRUFBeUN0RSxFQUF6QyxFQUE2QztBQUFBOztBQUM1RTtBQUNBLE1BQUlxRSxNQUFNLENBQUNFLE9BQVAsQ0FBZSxNQUFmLE1BQTJCLENBQUMsQ0FBaEMsRUFBbUM7QUFDakMsU0FBS0MsU0FBTCxDQUFlSCxNQUFmLEVBQXVCQyxRQUF2QjtBQUNELEdBRkQsQ0FHQTtBQUhBLE9BSUssSUFBSUQsTUFBTSxDQUFDRSxPQUFQLENBQWUsUUFBZixNQUE2QixDQUFDLENBQWxDLEVBQXFDO0FBQ3hDLFdBQUtDLFNBQUwsQ0FBZUgsTUFBZixFQUF1QkMsUUFBdkI7QUFDRCxLQUZJLENBR0w7QUFISyxTQUlBLElBQUlELE1BQU0sQ0FBQ0UsT0FBUCxDQUFlLE1BQWYsTUFBMkIsQ0FBQyxDQUFoQyxFQUFtQztBQUN0QyxhQUFLQyxTQUFMLENBQWUsV0FBZixFQUE0QkYsUUFBNUI7QUFDRCxPQUZJLE1BR0EsSUFBSUQsTUFBTSxDQUFDRSxPQUFQLENBQWUsa0JBQWYsTUFBdUMsQ0FBQyxDQUF4QyxJQUE2QzFHLE9BQU8sQ0FBQzRHLElBQVIsQ0FBYUYsT0FBYixDQUFxQixTQUFyQixJQUFrQyxDQUFDLENBQXBGLEVBQXVGO0FBQzFGLGVBQU9ELFFBQVEsQ0FBQ3RHLEdBQVQsQ0FBYTBHLFlBQWIsQ0FBMEJDLEtBQWpDO0FBQ0EsYUFBS0MsV0FBTCxDQUFpQlAsTUFBakIsRUFBeUJDLFFBQXpCO0FBQ0Q7O0FBRUQsTUFBSSxDQUFDLEtBQUs3QixNQUFOLElBQWdCLENBQUMsS0FBS0EsTUFBTCxDQUFZb0MsSUFBakMsRUFBdUM7QUFDckMsU0FBSzVJLEtBQUwsQ0FBVyxVQUFDeUMsS0FBRCxFQUFXO0FBQ3BCLFVBQUlBLEtBQUosRUFBVztBQUNULFlBQUlzQixFQUFKLEVBQ0UsT0FBT0EsRUFBRSxDQUFDdEIsS0FBRCxDQUFUO0FBQ0Y1QixRQUFBQSxPQUFPLENBQUM0QixLQUFSLENBQWNBLEtBQWQ7QUFDQSxlQUFPYixPQUFPLENBQUNDLElBQVIsQ0FBYSxDQUFiLENBQVA7QUFDRDs7QUFDRCxVQUFJLE1BQUksQ0FBQzJFLE1BQVQsRUFBaUI7QUFDZixlQUFPLE1BQUksQ0FBQ0EsTUFBTCxDQUFZb0MsSUFBWixDQUFpQlIsTUFBakIsRUFBeUJDLFFBQXpCLEVBQW1DdEUsRUFBbkMsQ0FBUDtBQUNEO0FBQ0YsS0FWRDtBQVdBLFdBQU8sS0FBUDtBQUNEOztBQUVEbEYsRUFBQUEsS0FBSyxDQUFDLCtDQUFELEVBQWtEdUosTUFBbEQsRUFBMEQsS0FBS3ZJLGVBQS9ELENBQUw7QUFDQSxTQUFPLEtBQUsyRyxNQUFMLENBQVlvQyxJQUFaLENBQWlCUixNQUFqQixFQUF5QkMsUUFBekIsRUFBbUN0RSxFQUFuQyxDQUFQO0FBQ0QsQ0FuQ0Q7O0FBcUNBaEYsTUFBTSxDQUFDZ0IsU0FBUCxDQUFpQjhJLFNBQWpCLEdBQTZCLFVBQVVDLFdBQVYsRUFBdUJDLEVBQXZCLEVBQTJCOUksRUFBM0IsRUFBK0I7QUFDMUQsT0FBS2tJLGFBQUwsQ0FBbUIsbUJBQW5CLEVBQXdDO0FBQ3RDWSxJQUFBQSxFQUFFLEVBQUVBLEVBRGtDO0FBRXRDRCxJQUFBQSxXQUFXLEVBQUVBLFdBRnlCO0FBR3RDRSxJQUFBQSxRQUFRLEVBQUU7QUFINEIsR0FBeEMsRUFJRyxZQUFZO0FBQ2JuSyxJQUFBQSxLQUFLLENBQUMsY0FBRCxDQUFMO0FBQ0EsV0FBT29CLEVBQUUsR0FBR0EsRUFBRSxFQUFMLEdBQVUsS0FBbkI7QUFDRCxHQVBEO0FBUUQsQ0FURDs7QUFXQWxCLE1BQU0sQ0FBQ2dCLFNBQVAsQ0FBaUJrSixVQUFqQixHQUE4QixTQUFTQSxVQUFULENBQW9CbEYsRUFBcEIsRUFBd0I7QUFBQTs7QUFDcEQsTUFBSW1GLE9BQUo7O0FBQ0EsTUFBTUMsSUFBSSxHQUFHLFNBQVBBLElBQU8sR0FBTTtBQUNqQixJQUFBLE1BQUksQ0FBQ3hGLEtBQUwsQ0FBVyxZQUFZO0FBQ3JCLGFBQU9JLEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBTztBQUFFcUYsUUFBQUEsT0FBTyxFQUFFO0FBQVgsT0FBUCxDQUFMLEdBQWlDLEtBQTFDO0FBQ0QsS0FGRDtBQUdELEdBSkQsQ0FGb0QsQ0FRcEQ7OztBQUNBLE1BQUl4SCxPQUFPLENBQUN5SCxRQUFSLEtBQXFCLE9BQXpCLEVBQWtDO0FBQ2hDekgsSUFBQUEsT0FBTyxDQUFDbUUsSUFBUixDQUFhLFNBQWIsRUFBd0IsWUFBWTtBQUNsQ2xILE1BQUFBLEtBQUssQ0FBQyxrQ0FBRCxDQUFMO0FBQ0ErSSxNQUFBQSxZQUFZLENBQUNzQixPQUFELENBQVo7QUFDQUMsTUFBQUEsSUFBSTtBQUNMLEtBSkQ7QUFLRCxHQU5ELE1BT0s7QUFDSDtBQUNBN0IsSUFBQUEsVUFBVSxDQUFDLFlBQU07QUFDZixNQUFBLE1BQUksQ0FBQ3BILFVBQUwsQ0FBZ0IsVUFBVW9KLEtBQVYsRUFBaUI7QUFDL0IsWUFBSSxDQUFDQSxLQUFMLEVBQVk7QUFDVjFCLFVBQUFBLFlBQVksQ0FBQ3NCLE9BQUQsQ0FBWjtBQUNBLGlCQUFPQyxJQUFJLEVBQVg7QUFDRDtBQUNGLE9BTEQ7QUFNRCxLQVBTLEVBT1AsR0FQTyxDQUFWO0FBUUQ7O0FBRURELEVBQUFBLE9BQU8sR0FBRzVCLFVBQVUsQ0FBQyxZQUFZO0FBQy9CNkIsSUFBQUEsSUFBSTtBQUNMLEdBRm1CLEVBRWpCLElBRmlCLENBQXBCLENBNUJvRCxDQWdDcEQ7O0FBQ0EsT0FBS2hCLGFBQUwsQ0FBbUIsUUFBbkIsRUFBNkI7QUFBRW9CLElBQUFBLEdBQUcsRUFBRTNILE9BQU8sQ0FBQzJIO0FBQWYsR0FBN0I7QUFDRCxDQWxDRDtBQXFDQTs7Ozs7Ozs7O0FBT0F4SyxNQUFNLENBQUNnQixTQUFQLENBQWlCNEksV0FBakIsR0FBK0IsU0FBU0EsV0FBVCxDQUFxQlAsTUFBckIsRUFBNkJyRyxHQUE3QixFQUFrQ2dDLEVBQWxDLEVBQXNDO0FBQ25FbEYsRUFBQUEsS0FBSyxDQUFDLHFCQUFELENBQUw7QUFDQSxPQUFLMkgsTUFBTCxDQUFZb0MsSUFBWixDQUFpQixhQUFqQixFQUFnQ1IsTUFBaEMsRUFBd0NyRyxHQUF4QyxFQUE2QyxZQUFZO0FBQ3ZELFdBQU9nQyxFQUFFLEdBQUdBLEVBQUUsRUFBTCxHQUFVLEtBQW5CO0FBQ0QsR0FGRDtBQUdELENBTEQ7QUFPQTs7Ozs7Ozs7O0FBT0FoRixNQUFNLENBQUNnQixTQUFQLENBQWlCeUosVUFBakIsR0FBOEIsU0FBU0MsWUFBVCxDQUFzQnJCLE1BQXRCLEVBQThCckcsR0FBOUIsRUFBbUNnQyxFQUFuQyxFQUF1QztBQUNuRWxGLEVBQUFBLEtBQUssQ0FBQyxvQkFBRCxDQUFMO0FBQ0EsT0FBSzJILE1BQUwsQ0FBWW9DLElBQVosQ0FBaUIsWUFBakIsRUFBK0JSLE1BQS9CLEVBQXVDckcsR0FBdkMsRUFBNEMsWUFBWTtBQUN0RCxXQUFPZ0MsRUFBRSxHQUFHQSxFQUFFLEVBQUwsR0FBVSxLQUFuQjtBQUNELEdBRkQ7QUFHRCxDQUxEO0FBT0E7Ozs7Ozs7OztBQU9BaEYsTUFBTSxDQUFDZ0IsU0FBUCxDQUFpQndJLFNBQWpCLEdBQTZCLFNBQVNBLFNBQVQsQ0FBbUJILE1BQW5CLEVBQTJCckcsR0FBM0IsRUFBZ0NnQyxFQUFoQyxFQUFvQztBQUMvRGxGLEVBQUFBLEtBQUssQ0FBQyxtQkFBRCxDQUFMO0FBQ0EsT0FBSzJILE1BQUwsQ0FBWW9DLElBQVosQ0FBaUIsV0FBakIsRUFBOEJSLE1BQTlCLEVBQXNDckcsR0FBdEMsRUFBMkMsWUFBWTtBQUNyRCxXQUFPZ0MsRUFBRSxHQUFHQSxFQUFFLEVBQUwsR0FBVSxLQUFuQjtBQUNELEdBRkQ7QUFHRCxDQUxEOztBQU9BaEYsTUFBTSxDQUFDZ0IsU0FBUCxDQUFpQjJKLGFBQWpCLEdBQWlDLFVBQVV6SixFQUFWLEVBQWM7QUFDN0MsTUFBSTBKLFVBQVUsR0FBRyxFQUFqQjtBQUVBLE9BQUt4QixhQUFMLENBQW1CLGdCQUFuQixFQUFxQyxFQUFyQyxFQUF5QyxVQUFVOUgsR0FBVixFQUFldUosS0FBZixFQUFzQjtBQUM3RCxRQUFJdkosR0FBSixFQUFTO0FBQ1BxQix5QkFBT0MsVUFBUCxDQUFrQixvQ0FBb0N0QixHQUF0RDs7QUFDQSxhQUFPSixFQUFFLENBQUNJLEdBQUQsQ0FBVDtBQUNEOztBQUVELFdBQU9KLEVBQUUsQ0FBQyxJQUFELEVBQU8ySixLQUFQLENBQVQ7QUFDRCxHQVBEO0FBUUQsQ0FYRDs7QUFhQTdLLE1BQU0sQ0FBQ2dCLFNBQVAsQ0FBaUI4SixlQUFqQixHQUFtQyxVQUFVNUosRUFBVixFQUFjO0FBQy9DLE1BQUkwSixVQUFVLEdBQUcsRUFBakI7QUFFQSxPQUFLeEIsYUFBTCxDQUFtQixnQkFBbkIsRUFBcUMsRUFBckMsRUFBeUMsVUFBVTlILEdBQVYsRUFBZXVKLEtBQWYsRUFBc0I7QUFDN0QsUUFBSXZKLEdBQUosRUFBUztBQUNQcUIseUJBQU9DLFVBQVAsQ0FBa0Isb0NBQW9DdEIsR0FBdEQ7O0FBQ0EsYUFBT0osRUFBRSxDQUFDSSxHQUFELENBQVQ7QUFDRDs7QUFFRCxXQUFPSixFQUFFLENBQUMsSUFBRCxFQUFPMkosS0FBSyxDQUFDRSxHQUFOLENBQVUsVUFBQUMsSUFBSTtBQUFBLGFBQUlBLElBQUksQ0FBQ0MsS0FBVDtBQUFBLEtBQWQsQ0FBUCxDQUFUO0FBQ0QsR0FQRDtBQVFELENBWEQ7O0FBYUFqTCxNQUFNLENBQUNnQixTQUFQLENBQWlCa0ssNkJBQWpCLEdBQWlELFVBQVVoSyxFQUFWLEVBQWM7QUFDN0QsTUFBSTBKLFVBQVUsR0FBRyxFQUFqQjtBQUVBLE9BQUt4QixhQUFMLENBQW1CLGdCQUFuQixFQUFxQyxFQUFyQyxFQUF5QyxVQUFVOUgsR0FBVixFQUFldUosS0FBZixFQUFzQjtBQUM3RCxRQUFJdkosR0FBSixFQUFTO0FBQ1BxQix5QkFBT0MsVUFBUCxDQUFrQixvQ0FBb0N0QixHQUF0RDs7QUFDQSxhQUFPSixFQUFFLENBQUNJLEdBQUQsQ0FBVDtBQUNEOztBQUVELFFBQUk2SixRQUFRLEdBQUdOLEtBQUssQ0FDakJPLE1BRFksQ0FDTCxVQUFBSixJQUFJO0FBQUEsYUFBSSxDQUFDQSxJQUFJLENBQUNLLE9BQUwsQ0FBYUMsVUFBbEI7QUFBQSxLQURDLEVBRVpQLEdBRlksQ0FFUixVQUFBQyxJQUFJO0FBQUEsYUFBSUEsSUFBSSxDQUFDQyxLQUFUO0FBQUEsS0FGSSxDQUFmO0FBSUEsV0FBTy9KLEVBQUUsQ0FBQyxJQUFELEVBQU9pSyxRQUFQLENBQVQ7QUFDRCxHQVhEO0FBWUQsQ0FmRDs7QUFpQkFuTCxNQUFNLENBQUNnQixTQUFQLENBQWlCdUssa0JBQWpCLEdBQXNDLFVBQVVDLElBQVYsRUFBZ0JDLFNBQWhCLEVBQTJCdkssRUFBM0IsRUFBK0I7QUFDbkUsTUFBSTBKLFVBQVUsR0FBRyxFQUFqQjtBQUNBLE1BQUljLFlBQVksR0FBRyxFQUFuQjs7QUFFQSxNQUFJLE9BQVF4SyxFQUFSLEtBQWdCLFdBQXBCLEVBQWlDO0FBQy9CQSxJQUFBQSxFQUFFLEdBQUd1SyxTQUFMO0FBQ0FBLElBQUFBLFNBQVMsR0FBRyxLQUFaO0FBQ0Q7O0FBRUQsTUFBSSxPQUFRRCxJQUFSLElBQWlCLFFBQXJCLEVBQ0VBLElBQUksR0FBR0EsSUFBSSxDQUFDbkgsUUFBTCxFQUFQO0FBRUYsT0FBSytFLGFBQUwsQ0FBbUIsZ0JBQW5CLEVBQXFDLEVBQXJDLEVBQXlDLFVBQVU5SCxHQUFWLEVBQWVxSyxJQUFmLEVBQXFCO0FBQzVELFFBQUlySyxHQUFKLEVBQVM7QUFDUHFCLHlCQUFPQyxVQUFQLENBQWtCLG9DQUFvQ3RCLEdBQXREOztBQUNBLGFBQU9KLEVBQUUsQ0FBQ0ksR0FBRCxDQUFUO0FBQ0Q7O0FBRURxSyxJQUFBQSxJQUFJLENBQUNDLE9BQUwsQ0FBYSxVQUFVWixJQUFWLEVBQWdCO0FBQzNCLFVBQUlBLElBQUksQ0FBQ0ssT0FBTCxDQUFhRyxJQUFiLElBQXFCQSxJQUFyQixJQUE2QlIsSUFBSSxDQUFDSyxPQUFMLENBQWFRLFlBQWIsSUFBNkI3SCxpQkFBS29CLE9BQUwsQ0FBYW9HLElBQWIsQ0FBOUQsRUFBa0Y7QUFDaEZaLFFBQUFBLFVBQVUsQ0FBQy9FLElBQVgsQ0FBZ0JtRixJQUFJLENBQUNDLEtBQXJCO0FBQ0FTLFFBQUFBLFlBQVksQ0FBQ1YsSUFBSSxDQUFDQyxLQUFOLENBQVosR0FBMkJELElBQTNCO0FBQ0Q7QUFDRixLQUxEO0FBT0EsV0FBTzlKLEVBQUUsQ0FBQyxJQUFELEVBQU8wSixVQUFQLEVBQW1CYyxZQUFuQixDQUFUO0FBQ0QsR0FkRDtBQWVELENBM0JEOztBQTZCQTFMLE1BQU0sQ0FBQ2dCLFNBQVAsQ0FBaUI4Syx3QkFBakIsR0FBNEMsVUFBVUMsU0FBVixFQUFxQk4sU0FBckIsRUFBZ0N2SyxFQUFoQyxFQUFvQztBQUM5RSxNQUFJMEosVUFBVSxHQUFHLEVBQWpCO0FBQ0EsTUFBSWMsWUFBWSxHQUFHLEVBQW5COztBQUVBLE1BQUksT0FBUXhLLEVBQVIsS0FBZ0IsV0FBcEIsRUFBaUM7QUFDL0JBLElBQUFBLEVBQUUsR0FBR3VLLFNBQUw7QUFDQUEsSUFBQUEsU0FBUyxHQUFHLEtBQVo7QUFDRDs7QUFFRCxNQUFJLE9BQVFNLFNBQVIsSUFBc0IsUUFBMUIsRUFDRUEsU0FBUyxHQUFHQSxTQUFTLENBQUMxSCxRQUFWLEVBQVo7QUFFRixPQUFLK0UsYUFBTCxDQUFtQixnQkFBbkIsRUFBcUMsRUFBckMsRUFBeUMsVUFBVTlILEdBQVYsRUFBZXFLLElBQWYsRUFBcUI7QUFDNUQsUUFBSXJLLEdBQUosRUFBUztBQUNQcUIseUJBQU9DLFVBQVAsQ0FBa0Isb0NBQW9DdEIsR0FBdEQ7O0FBQ0EsYUFBT0osRUFBRSxDQUFDSSxHQUFELENBQVQ7QUFDRDs7QUFFRHFLLElBQUFBLElBQUksQ0FBQ0MsT0FBTCxDQUFhLFVBQVVaLElBQVYsRUFBZ0I7QUFDM0IsVUFBSUEsSUFBSSxDQUFDSyxPQUFMLENBQWFVLFNBQWIsSUFBMEJBLFNBQTlCLEVBQXlDO0FBQ3ZDbkIsUUFBQUEsVUFBVSxDQUFDL0UsSUFBWCxDQUFnQm1GLElBQUksQ0FBQ0MsS0FBckI7QUFDQVMsUUFBQUEsWUFBWSxDQUFDVixJQUFJLENBQUNDLEtBQU4sQ0FBWixHQUEyQkQsSUFBM0I7QUFDRDtBQUNGLEtBTEQ7QUFPQSxXQUFPOUosRUFBRSxDQUFDLElBQUQsRUFBTzBKLFVBQVAsRUFBbUJjLFlBQW5CLENBQVQ7QUFDRCxHQWREO0FBZUQsQ0EzQkQ7O0FBNkJBMUwsTUFBTSxDQUFDZ0IsU0FBUCxDQUFpQmdMLGdCQUFqQixHQUFvQyxVQUFVUixJQUFWLEVBQWdCdEssRUFBaEIsRUFBb0I7QUFDdEQsTUFBSTBKLFVBQVUsR0FBRyxFQUFqQjtBQUVBLE9BQUt4QixhQUFMLENBQW1CLGdCQUFuQixFQUFxQyxFQUFyQyxFQUF5QyxVQUFVOUgsR0FBVixFQUFlcUssSUFBZixFQUFxQjtBQUM1RCxRQUFJckssR0FBSixFQUFTO0FBQ1BxQix5QkFBT0MsVUFBUCxDQUFrQixvQ0FBb0N0QixHQUF0RDs7QUFDQSxhQUFPSixFQUFFLENBQUNJLEdBQUQsQ0FBVDtBQUNEOztBQUVEcUssSUFBQUEsSUFBSSxDQUFDQyxPQUFMLENBQWEsVUFBVVosSUFBVixFQUFnQjtBQUMzQixVQUFJQSxJQUFJLENBQUNLLE9BQUwsQ0FBYUcsSUFBYixJQUFxQkEsSUFBckIsSUFDRlIsSUFBSSxDQUFDSyxPQUFMLENBQWFRLFlBQWIsSUFBNkI3SCxpQkFBS29CLE9BQUwsQ0FBYW9HLElBQWIsQ0FEL0IsRUFDbUQ7QUFDakRaLFFBQUFBLFVBQVUsQ0FBQy9FLElBQVgsQ0FBZ0JtRixJQUFoQjtBQUNEO0FBQ0YsS0FMRDtBQU9BLFdBQU85SixFQUFFLENBQUMsSUFBRCxFQUFPMEosVUFBUCxDQUFUO0FBQ0QsR0FkRDtBQWVELENBbEJEOztBQW9CQTVLLE1BQU0sQ0FBQ2dCLFNBQVAsQ0FBaUJpTCxvQkFBakIsR0FBd0MsVUFBVUMsUUFBVixFQUFvQmhMLEVBQXBCLEVBQXdCO0FBQzlELE1BQUlpTCxTQUFTLEdBQUcsRUFBaEI7QUFFQSxPQUFLL0MsYUFBTCxDQUFtQixnQkFBbkIsRUFBcUMsRUFBckMsRUFBeUMsVUFBVTlILEdBQVYsRUFBZXFLLElBQWYsRUFBcUI7QUFDNUQsUUFBSXJLLEdBQUosRUFBUztBQUNQcUIseUJBQU9DLFVBQVAsQ0FBa0Isb0NBQW9DdEIsR0FBdEQ7O0FBQ0EsYUFBT0osRUFBRSxDQUFDSSxHQUFELENBQVQ7QUFDRDs7QUFFRHFLLElBQUFBLElBQUksQ0FBQ0MsT0FBTCxDQUFhLFVBQVVaLElBQVYsRUFBZ0I7QUFDM0IsVUFBSUEsSUFBSSxDQUFDSyxPQUFMLENBQWFHLElBQWIsS0FBc0JVLFFBQXRCLElBQ0ZsQixJQUFJLENBQUNLLE9BQUwsQ0FBYVEsWUFBYixLQUE4QjdILGlCQUFLb0IsT0FBTCxDQUFhOEcsUUFBYixDQUQ1QixJQUVGbEIsSUFBSSxDQUFDUixHQUFMLEtBQWE0QixRQUFRLENBQUNGLFFBQUQsQ0FGbkIsSUFHRmxCLElBQUksQ0FBQ0ssT0FBTCxDQUFhSixLQUFiLEtBQXVCbUIsUUFBUSxDQUFDRixRQUFELENBSGpDLEVBRzZDO0FBQzNDQyxRQUFBQSxTQUFTLENBQUN0RyxJQUFWLENBQWVtRixJQUFmO0FBQ0Q7QUFDRixLQVBEO0FBU0EsV0FBTzlKLEVBQUUsQ0FBQyxJQUFELEVBQU9pTCxTQUFQLENBQVQ7QUFDRCxHQWhCRDtBQWlCRCxDQXBCRDs7ZUFzQmVuTSxNIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgbGljZW5zZSB0aGF0XG4gKiBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cbiAqL1xuXG5pbXBvcnQgZGVidWdMb2dnZXIgZnJvbSAnZGVidWcnO1xuaW1wb3J0IENvbW1vbiBmcm9tICcuL0NvbW1vbic7XG5pbXBvcnQgS01EYWVtb24gZnJvbSAnQHBtMi9hZ2VudC9zcmMvSW50ZXJhY3RvckNsaWVudCc7XG5pbXBvcnQgcnBjIGZyb20gJ3BtMi1heG9uLXJwYyc7XG5pbXBvcnQgZm9yRWFjaCBmcm9tICdhc3luYy9mb3JFYWNoJztcbmltcG9ydCBheG9uIGZyb20gJ3BtMi1heG9uJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBwa2cgZnJvbSAnLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCB3aGljaCBmcm9tICcuL3Rvb2xzL3doaWNoJztcbmltcG9ydCBjc3QgZnJvbSAnLi4vY29uc3RhbnRzJztcbmltcG9ydCBEYWVtb24gZnJvbSAnLi9EYWVtb24nO1xuaW1wb3J0IG1rZGlycCBmcm9tICdta2RpcnAnO1xuaW1wb3J0IHZDaGVjayBmcm9tICcuL1ZlcnNpb25DaGVjaydcbmltcG9ydCBvcyBmcm9tICdvcyc7XG5pbXBvcnQgeyBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuXG5jb25zdCBkZWJ1ZyA9IGRlYnVnTG9nZ2VyKCdwbTI6Y2xpZW50Jyk7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7IH1cblxudmFyIENsaWVudCA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gIGlmICghb3B0cykgb3B0cyA9IHt9O1xuXG4gIGlmICghb3B0cy5jb25mKVxuICAgIHRoaXMuY29uZiA9IGNzdDtcbiAgZWxzZSB7XG4gICAgdGhpcy5jb25mID0gb3B0cy5jb25mO1xuICB9XG5cbiAgdGhpcy5zdWJfc29jayA9IHt9O1xuICB0aGlzLmRhZW1vbl9tb2RlID0gdHlwZW9mIChvcHRzLmRhZW1vbl9tb2RlKSA9PT0gJ3VuZGVmaW5lZCcgPyB0cnVlIDogb3B0cy5kYWVtb25fbW9kZTtcbiAgdGhpcy5wbTJfaG9tZSA9IHRoaXMuY29uZi5QTTJfUk9PVF9QQVRIO1xuICB0aGlzLnNlY3JldF9rZXkgPSBvcHRzLnNlY3JldF9rZXk7XG4gIHRoaXMucHVibGljX2tleSA9IG9wdHMucHVibGljX2tleTtcbiAgdGhpcy5tYWNoaW5lX25hbWUgPSBvcHRzLm1hY2hpbmVfbmFtZTtcblxuICAvLyBDcmVhdGUgYWxsIGZvbGRlcnMgYW5kIGZpbGVzIG5lZWRlZFxuICAvLyBDbGllbnQgZGVwZW5kcyB0byB0aGF0IHRvIGludGVyYWN0IHdpdGggUE0yIHByb3Blcmx5XG4gIHRoaXMuaW5pdEZpbGVTdHJ1Y3R1cmUodGhpcy5jb25mKTtcblxuICBkZWJ1ZygnVXNpbmcgUlBDIGZpbGUgJXMnLCB0aGlzLmNvbmYuREFFTU9OX1JQQ19QT1JUKTtcbiAgZGVidWcoJ1VzaW5nIFBVQiBmaWxlICVzJywgdGhpcy5jb25mLkRBRU1PTl9QVUJfUE9SVCk7XG4gIHRoaXMucnBjX3NvY2tldF9maWxlID0gdGhpcy5jb25mLkRBRU1PTl9SUENfUE9SVDtcbiAgdGhpcy5wdWJfc29ja2V0X2ZpbGUgPSB0aGlzLmNvbmYuREFFTU9OX1BVQl9QT1JUO1xufTtcblxuLy8gQGJyZWFraW5nIGNoYW5nZSAobm9EYWVtb25Nb2RlIGhhcyBiZWVuIGRyb3ApXG4vLyBAdG9kbyByZXQgZXJyXG5DbGllbnQucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKGNiKSB7XG4gIHRoaXMucGluZ0RhZW1vbigoZGFlbW9uQWxpdmUpID0+IHtcbiAgICBpZiAoZGFlbW9uQWxpdmUgPT09IHRydWUpXG4gICAgICByZXR1cm4gdGhpcy5sYXVuY2hSUEMoKGVyciwgbWV0YSkgPT4ge1xuICAgICAgICByZXR1cm4gY2IobnVsbCwge1xuICAgICAgICAgIGRhZW1vbl9tb2RlOiB0aGlzLmNvbmYuZGFlbW9uX21vZGUsXG4gICAgICAgICAgbmV3X3BtMl9pbnN0YW5jZTogZmFsc2UsXG4gICAgICAgICAgcnBjX3NvY2tldF9maWxlOiB0aGlzLnJwY19zb2NrZXRfZmlsZSxcbiAgICAgICAgICBwdWJfc29ja2V0X2ZpbGU6IHRoaXMucHViX3NvY2tldF9maWxlLFxuICAgICAgICAgIHBtMl9ob21lOiB0aGlzLnBtMl9ob21lXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBObyBEYWVtb24gbW9kZVxuICAgICAqL1xuICAgIGlmICh0aGlzLmRhZW1vbl9tb2RlID09PSBmYWxzZSkge1xuICAgICAgdmFyIGRhZW1vbiA9IG5ldyBEYWVtb24oe1xuICAgICAgICBwdWJfc29ja2V0X2ZpbGU6IHRoaXMuY29uZi5EQUVNT05fUFVCX1BPUlQsXG4gICAgICAgIHJwY19zb2NrZXRfZmlsZTogdGhpcy5jb25mLkRBRU1PTl9SUENfUE9SVCxcbiAgICAgICAgcGlkX2ZpbGU6IHRoaXMuY29uZi5QTTJfUElEX0ZJTEVfUEFUSCxcbiAgICAgICAgaWdub3JlX3NpZ25hbHM6IHRydWVcbiAgICAgIH0pO1xuXG4gICAgICBjb25zb2xlLmxvZygnTGF1bmNoaW5nIGluIG5vIGRhZW1vbiBtb2RlJyk7XG5cbiAgICAgIGRhZW1vbi5pbm5lclN0YXJ0KCgpID0+IHtcbiAgICAgICAgS01EYWVtb24ubGF1bmNoQW5kSW50ZXJhY3QodGhpcy5jb25mLCB7XG4gICAgICAgICAgbWFjaGluZV9uYW1lOiB0aGlzLm1hY2hpbmVfbmFtZSxcbiAgICAgICAgICBwdWJsaWNfa2V5OiB0aGlzLnB1YmxpY19rZXksXG4gICAgICAgICAgc2VjcmV0X2tleTogdGhpcy5zZWNyZXRfa2V5LFxuICAgICAgICAgIHBtMl92ZXJzaW9uOiBwa2cudmVyc2lvblxuICAgICAgICB9LCAoZXJyLCBkYXRhLCBpbnRlcmFjdG9yX3Byb2MpID0+IHtcbiAgICAgICAgICB0aGlzLmludGVyYWN0b3JfcHJvY2VzcyA9IGludGVyYWN0b3JfcHJvYztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5sYXVuY2hSUEMoKGVyciwgbWV0YSkgPT4ge1xuICAgICAgICAgIHJldHVybiBjYihudWxsLCB7XG4gICAgICAgICAgICBkYWVtb25fbW9kZTogdGhpcy5jb25mLmRhZW1vbl9tb2RlLFxuICAgICAgICAgICAgbmV3X3BtMl9pbnN0YW5jZTogdHJ1ZSxcbiAgICAgICAgICAgIHJwY19zb2NrZXRfZmlsZTogdGhpcy5ycGNfc29ja2V0X2ZpbGUsXG4gICAgICAgICAgICBwdWJfc29ja2V0X2ZpbGU6IHRoaXMucHViX3NvY2tldF9maWxlLFxuICAgICAgICAgICAgcG0yX2hvbWU6IHRoaXMucG0yX2hvbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEYWVtb24gbW9kZVxuICAgICAqL1xuICAgIHRoaXMubGF1bmNoRGFlbW9uKChlcnIsIGNoaWxkKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKGVycikgOiBwcm9jZXNzLmV4aXQodGhpcy5jb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXByb2Nlc3MuZW52LlBNMl9ESVNDUkVURV9NT0RFKVxuICAgICAgICBDb21tb24ucHJpbnRPdXQodGhpcy5jb25mLlBSRUZJWF9NU0cgKyAnUE0yIFN1Y2Nlc3NmdWxseSBkYWVtb25pemVkJyk7XG5cbiAgICAgIHRoaXMubGF1bmNoUlBDKChlcnIsIG1ldGEpID0+IHtcbiAgICAgICAgcmV0dXJuIGNiKG51bGwsIHtcbiAgICAgICAgICBkYWVtb25fbW9kZTogdGhpcy5jb25mLmRhZW1vbl9tb2RlLFxuICAgICAgICAgIG5ld19wbTJfaW5zdGFuY2U6IHRydWUsXG4gICAgICAgICAgcnBjX3NvY2tldF9maWxlOiB0aGlzLnJwY19zb2NrZXRfZmlsZSxcbiAgICAgICAgICBwdWJfc29ja2V0X2ZpbGU6IHRoaXMucHViX3NvY2tldF9maWxlLFxuICAgICAgICAgIHBtMl9ob21lOiB0aGlzLnBtMl9ob21lXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLy8gSW5pdCBmaWxlIHN0cnVjdHVyZSBvZiBwbTJfaG9tZVxuLy8gVGhpcyBpbmNsdWRlc1xuLy8gLSBwbTIgcGlkIGFuZCBsb2cgcGF0aFxuLy8gLSBycGMgYW5kIHB1YiBzb2NrZXQgZm9yIGNvbW1hbmQgZXhlY3V0aW9uXG5DbGllbnQucHJvdG90eXBlLmluaXRGaWxlU3RydWN0dXJlID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgaWYgKCFmcy5leGlzdHNTeW5jKG9wdHMuREVGQVVMVF9MT0dfUEFUSCkpIHtcbiAgICB0cnkge1xuICAgICAgbWtkaXJwLnN5bmMob3B0cy5ERUZBVUxUX0xPR19QQVRIKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFmcy5leGlzdHNTeW5jKG9wdHMuREVGQVVMVF9QSURfUEFUSCkpIHtcbiAgICB0cnkge1xuICAgICAgbWtkaXJwLnN5bmMob3B0cy5ERUZBVUxUX1BJRF9QQVRIKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFmcy5leGlzdHNTeW5jKG9wdHMuUE0yX01PRFVMRV9DT05GX0ZJTEUpKSB7XG4gICAgdHJ5IHtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMob3B0cy5QTTJfTU9EVUxFX0NPTkZfRklMRSwgXCJ7fVwiKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFmcy5leGlzdHNTeW5jKG9wdHMuREVGQVVMVF9NT0RVTEVfUEFUSCkpIHtcbiAgICB0cnkge1xuICAgICAgbWtkaXJwLnN5bmMob3B0cy5ERUZBVUxUX01PRFVMRV9QQVRIKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9ESVNDUkVURV9NT0RFKSB7XG4gICAgdHJ5IHtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKG9wdHMuUE0yX0hPTUUsICd0b3VjaCcpLCBEYXRlLm5vdygpLnRvU3RyaW5nKCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGRlYnVnKGUuc3RhY2sgfHwgZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDICYmICFmcy5leGlzdHNTeW5jKHBhdGguam9pbihvcHRzLlBNMl9IT01FLCAndG91Y2gnKSkpIHtcbiAgICB2Q2hlY2soe1xuICAgICAgc3RhdGU6ICdpbnN0YWxsJyxcbiAgICAgIHZlcnNpb246IHBrZy52ZXJzaW9uXG4gICAgfSlcblxuICAgIHZhciBkdCA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCBvcHRzLlBNMl9CQU5ORVIpKTtcbiAgICBjb25zb2xlLmxvZyhkdC50b1N0cmluZygpKTtcbiAgICB0cnkge1xuICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ob3B0cy5QTTJfSE9NRSwgJ3RvdWNoJyksIERhdGUubm93KCkudG9TdHJpbmcoKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZGVidWcoZS5zdGFjayB8fCBlKTtcbiAgICB9XG4gIH1cbn07XG5cbkNsaWVudC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiAoY2IpIHtcbiAgZm9yRWFjaChbXG4gICAgdGhpcy5kaXNjb25uZWN0UlBDLmJpbmQodGhpcyksXG4gICAgdGhpcy5kaXNjb25uZWN0QnVzLmJpbmQodGhpcylcbiAgXSwgZnVuY3Rpb24gKGZuLCBuZXh0KSB7XG4gICAgZm4obmV4dClcbiAgfSwgY2IpO1xufTtcblxuLyoqXG4gKiBMYXVuY2ggdGhlIERhZW1vbiBieSBmb3JraW5nIHRoaXMgc2FtZSBmaWxlXG4gKiBUaGUgbWV0aG9kIENsaWVudC5yZW1vdGVXcmFwcGVyIHdpbGwgYmUgY2FsbGVkXG4gKlxuICogQG1ldGhvZCBsYXVuY2hEYWVtb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdHMuaW50ZXJhY3Rvcj10cnVlXSBhbGxvdyB0byBkaXNhYmxlIGludGVyYWN0aW9uIG9uIGxhdW5jaFxuICovXG5DbGllbnQucHJvdG90eXBlLmxhdW5jaERhZW1vbiA9IGZ1bmN0aW9uIChvcHRzLCBjYikge1xuICBpZiAodHlwZW9mIChvcHRzKSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgY2IgPSBvcHRzO1xuICAgIG9wdHMgPSB7XG4gICAgICBpbnRlcmFjdG9yOiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIHZhciBDbGllbnRKUyA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUobW9kdWxlLmZpbGVuYW1lKSwgJ0RhZW1vbi5qcycpO1xuICB2YXIgbm9kZV9hcmdzID0gW107XG4gIHZhciBvdXQsIGVycjtcblxuICAvLyBpZiAocHJvY2Vzcy5lbnYuVFJBVklTKSB7XG4gIC8vICAgLy8gUmVkaXJlY3QgUE0yIGludGVybmFsIGVyciBhbmQgb3V0IHRvIFNUREVSUiBTVERPVVQgd2hlbiBydW5uaW5nIHdpdGggVHJhdmlzXG4gIC8vICAgb3V0ID0gMTtcbiAgLy8gICBlcnIgPSAyO1xuICAvLyB9XG4gIC8vIGVsc2Uge1xuICBvdXQgPSBmcy5vcGVuU3luYyh0aGlzLmNvbmYuUE0yX0xPR19GSUxFX1BBVEgsICdhJyksXG4gICAgZXJyID0gZnMub3BlblN5bmModGhpcy5jb25mLlBNMl9MT0dfRklMRV9QQVRILCAnYScpO1xuICAvL31cblxuICBpZiAodGhpcy5jb25mLkxPV19NRU1PUllfRU5WSVJPTk1FTlQpIHtcbiAgICBub2RlX2FyZ3MucHVzaCgnLS1nYy1nbG9iYWwnKTsgLy8gRG9lcyBmdWxsIEdDIChzbWFsbGVyIG1lbW9yeSBmb290cHJpbnQpXG4gICAgbm9kZV9hcmdzLnB1c2goJy0tbWF4LW9sZC1zcGFjZS1zaXplPScgKyBNYXRoLmZsb29yKG9zLnRvdGFsbWVtKCkgLyAxMDI0IC8gMTAyNCkpO1xuICB9XG5cbiAgLy8gTm9kZS5qcyB0dW5pbmcgZm9yIGJldHRlciBwZXJmb3JtYW5jZVxuICAvL25vZGVfYXJncy5wdXNoKCctLWV4cG9zZS1nYycpOyAvLyBBbGxvd3MgbWFudWFsIEdDIGluIHRoZSBjb2RlXG5cbiAgLyoqXG4gICAqIEFkZCBub2RlIFthcmd1bWVudHNdIGRlcGVuZGluZyBvbiBQTTJfTk9ERV9PUFRJT05TIGVudiB2YXJpYWJsZVxuICAgKi9cbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9OT0RFX09QVElPTlMpXG4gICAgbm9kZV9hcmdzID0gbm9kZV9hcmdzLmNvbmNhdChwcm9jZXNzLmVudi5QTTJfTk9ERV9PUFRJT05TLnNwbGl0KCcgJykpO1xuICBub2RlX2FyZ3MucHVzaChDbGllbnRKUyk7XG5cbiAgaWYgKCFwcm9jZXNzLmVudi5QTTJfRElTQ1JFVEVfTU9ERSlcbiAgICBDb21tb24ucHJpbnRPdXQodGhpcy5jb25mLlBSRUZJWF9NU0cgKyAnU3Bhd25pbmcgUE0yIGRhZW1vbiB3aXRoIHBtMl9ob21lPScgKyB0aGlzLnBtMl9ob21lKTtcblxuICB2YXIgaW50ZXJwcmV0ZXIgPSAnbm9kZSc7XG5cbiAgaWYgKHdoaWNoKCdub2RlJykgPT0gbnVsbClcbiAgICBpbnRlcnByZXRlciA9IHByb2Nlc3MuZXhlY1BhdGg7XG5cbiAgbGV0IHNwYXduRW52ID0gT2JqZWN0LmFzc2lnbih7fSwge1xuICAgICdTSUxFTlQnOiB0aGlzLmNvbmYuREVCVUcgPyAhdGhpcy5jb25mLkRFQlVHIDogdHJ1ZSxcbiAgICAnUE0yX0hPTUUnOiB0aGlzLnBtMl9ob21lXG4gIH0sIHByb2Nlc3MuZW52KVxuXG4gIHZhciBjaGlsZCA9IHNwYXduKGludGVycHJldGVyLCBub2RlX2FyZ3MsIHtcbiAgICBkZXRhY2hlZDogdHJ1ZSxcbiAgICBjd2Q6IHRoaXMuY29uZi5jd2QgfHwgcHJvY2Vzcy5jd2QoKSxcbiAgICBlbnY6IHNwYXduRW52LFxuICAgIHN0ZGlvOiBbJ2lwYycsIG91dCwgZXJyXVxuICB9KTtcblxuICBmdW5jdGlvbiBvbkVycm9yKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSB8fCBlKTtcbiAgICByZXR1cm4gY2IgPyBjYihlLm1lc3NhZ2UgfHwgZSkgOiBmYWxzZTtcbiAgfVxuXG4gIGNoaWxkLm9uY2UoJ2Vycm9yJywgb25FcnJvcik7XG5cbiAgY2hpbGQudW5yZWYoKTtcblxuICBjaGlsZC5vbmNlKCdtZXNzYWdlJywgZnVuY3Rpb24gKG1zZykge1xuICAgIGRlYnVnKCdQTTIgZGFlbW9uIGxhdW5jaGVkIHdpdGggcmV0dXJuIG1lc3NhZ2U6ICcsIG1zZyk7XG4gICAgY2hpbGQucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgY2hpbGQuZGlzY29ubmVjdCgpO1xuXG4gICAgaWYgKG9wdHMgJiYgb3B0cy5pbnRlcmFjdG9yID09IGZhbHNlKVxuICAgICAgcmV0dXJuIGNiKG51bGwsIGNoaWxkKTtcblxuICAgIGlmIChwcm9jZXNzLmVudi5QTTJfTk9fSU5URVJBQ1RJT04gPT0gJ3RydWUnKVxuICAgICAgcmV0dXJuIGNiKG51bGwsIGNoaWxkKTtcblxuICAgIC8qKlxuICAgICAqIEhlcmUgdGhlIEtleW1ldHJpY3MgYWdlbnQgaXMgbGF1bmNoZWQgYXV0b21hdGljY2FseSBpZlxuICAgICAqIGl0IGhhcyBiZWVuIGFscmVhZHkgY29uZmlndXJlZCBiZWZvcmUgKHZpYSBwbTIgbGluaylcbiAgICAgKi9cbiAgICBLTURhZW1vbi5sYXVuY2hBbmRJbnRlcmFjdCh0aGlzLmNvbmYsIHtcbiAgICAgIG1hY2hpbmVfbmFtZTogdGhpcy5tYWNoaW5lX25hbWUsXG4gICAgICBwdWJsaWNfa2V5OiB0aGlzLnB1YmxpY19rZXksXG4gICAgICBzZWNyZXRfa2V5OiB0aGlzLnNlY3JldF9rZXksXG4gICAgICBwbTJfdmVyc2lvbjogcGtnLnZlcnNpb25cbiAgICB9LCAoZXJyLCBkYXRhLCBpbnRlcmFjdG9yX3Byb2MpID0+IHtcbiAgICAgIHRoaXMuaW50ZXJhY3Rvcl9wcm9jZXNzID0gaW50ZXJhY3Rvcl9wcm9jO1xuICAgICAgcmV0dXJuIGNiKG51bGwsIGNoaWxkKTtcbiAgICB9KTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIFBpbmcgdGhlIGRhZW1vbiB0byBrbm93IGlmIGl0IGFsaXZlIG9yIG5vdFxuICogQGFwaSBwdWJsaWNcbiAqIEBtZXRob2QgcGluZ0RhZW1vblxuICogQHBhcmFtIHt9IGNiXG4gKiBAcmV0dXJuXG4gKi9cbkNsaWVudC5wcm90b3R5cGUucGluZ0RhZW1vbiA9IGZ1bmN0aW9uIHBpbmdEYWVtb24oY2IpIHtcbiAgdmFyIHJlcSA9IGF4b24uc29ja2V0KCdyZXEnLCBudWxsKTtcbiAgdmFyIGNsaWVudCA9IG5ldyBycGMuQ2xpZW50KHJlcSk7XG5cbiAgZGVidWcoJ1tQSU5HIFBNMl0gVHJ5aW5nIHRvIGNvbm5lY3QgdG8gc2VydmVyJyk7XG5cbiAgY2xpZW50LnNvY2sub25jZSgncmVjb25uZWN0IGF0dGVtcHQnLCAoKSA9PiB7XG4gICAgY2xpZW50LnNvY2suY2xvc2UoKTtcbiAgICBkZWJ1ZygnRGFlbW9uIG5vdCBsYXVuY2hlZCcpO1xuICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNiKGZhbHNlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgY2xpZW50LnNvY2sub25jZSgnZXJyb3InLCAoZSkgPT4ge1xuICAgIGlmIChlLmNvZGUgPT09ICdFQUNDRVMnKSB7XG4gICAgICBmcy5zdGF0KHRoaXMuY29uZi5EQUVNT05fUlBDX1BPUlQsIGZ1bmN0aW9uIChlLCBzdGF0cykge1xuICAgICAgICBpZiAoc3RhdHMudWlkID09PSAwKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLmNvbmYuUFJFRklYX01TR19FUlIgKyAnUGVybWlzc2lvbiBkZW5pZWQsIHRvIGdpdmUgYWNjZXNzIHRvIGN1cnJlbnQgdXNlcjonKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnJCBzdWRvIGNob3duICcgKyBwcm9jZXNzLmVudi5VU0VSICsgJzonICsgcHJvY2Vzcy5lbnYuVVNFUiArICcgJyArIHRoaXMuY29uZi5EQUVNT05fUlBDX1BPUlQgKyAnICcgKyB0aGlzLmNvbmYuREFFTU9OX1BVQl9QT1JUKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLmNvbmYuUFJFRklYX01TR19FUlIgKyAnUGVybWlzc2lvbiBkZW5pZWQsIGNoZWNrIHBlcm1pc3Npb25zIG9uICcgKyB0aGlzLmNvbmYuREFFTU9OX1JQQ19QT1JUKTtcblxuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZVxuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UgfHwgZSk7XG4gIH0pO1xuXG4gIGNsaWVudC5zb2NrLm9uY2UoJ2Nvbm5lY3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgY2xpZW50LnNvY2sub25jZSgnY2xvc2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gY2IodHJ1ZSk7XG4gICAgfSk7XG4gICAgY2xpZW50LnNvY2suY2xvc2UoKTtcbiAgICBkZWJ1ZygnRGFlbW9uIGFsaXZlJyk7XG4gIH0pO1xuXG4gIHJlcS5jb25uZWN0KHRoaXMucnBjX3NvY2tldF9maWxlKTtcbn07XG5cbi8qKlxuICogTWV0aG9kcyB0byBpbnRlcmFjdCB3aXRoIHRoZSBEYWVtb24gdmlhIFJQQ1xuICogVGhpcyBtZXRob2Qgd2FpdCB0byBiZSBjb25uZWN0ZWQgdG8gdGhlIERhZW1vblxuICogT25jZSBoZSdzIGNvbm5lY3RlZCBpdCB0cmlnZ2VyIHRoZSBjb21tYW5kIHBhcnNpbmcgKG9uIC4vYmluL3BtMiBmaWxlLCBhdCB0aGUgZW5kKVxuICogQG1ldGhvZCBsYXVuY2hSUENcbiAqIEBwYXJhbXMge2Z1bmN0aW9ufSBbY2JdXG4gKiBAcmV0dXJuXG4gKi9cbkNsaWVudC5wcm90b3R5cGUubGF1bmNoUlBDID0gZnVuY3Rpb24gbGF1bmNoUlBDKGNiKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgZGVidWcoJ0xhdW5jaGluZyBSUEMgY2xpZW50IG9uIHNvY2tldCBmaWxlICVzJywgdGhpcy5ycGNfc29ja2V0X2ZpbGUpO1xuICB2YXIgcmVxID0gYXhvbi5zb2NrZXQoJ3JlcScsIG51bGwpO1xuICB0aGlzLmNsaWVudCA9IG5ldyBycGMuQ2xpZW50KHJlcSk7XG5cbiAgdmFyIGNvbm5lY3RIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHNlbGYuY2xpZW50LnNvY2sucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgZXJyb3JIYW5kbGVyKTtcbiAgICBkZWJ1ZygnUlBDIENvbm5lY3RlZCB0byBEYWVtb24nKTtcbiAgICBpZiAoY2IpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBjYihudWxsKTtcbiAgICAgIH0sIDQpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgZXJyb3JIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICBzZWxmLmNsaWVudC5zb2NrLnJlbW92ZUxpc3RlbmVyKCdjb25uZWN0JywgY29ubmVjdEhhbmRsZXIpO1xuICAgIGlmIChjYikge1xuICAgICAgcmV0dXJuIGNiKGUpO1xuICAgIH1cbiAgfTtcblxuICB0aGlzLmNsaWVudC5zb2NrLm9uY2UoJ2Nvbm5lY3QnLCBjb25uZWN0SGFuZGxlcik7XG4gIHRoaXMuY2xpZW50LnNvY2sub25jZSgnZXJyb3InLCBlcnJvckhhbmRsZXIpO1xuICB0aGlzLmNsaWVudF9zb2NrID0gcmVxLmNvbm5lY3QodGhpcy5ycGNfc29ja2V0X2ZpbGUpO1xufTtcblxuLyoqXG4gKiBNZXRob2RzIHRvIGNsb3NlIHRoZSBSUEMgY29ubmVjdGlvblxuICogQGNhbGxiYWNrIGNiXG4gKi9cbkNsaWVudC5wcm90b3R5cGUuZGlzY29ubmVjdFJQQyA9IGZ1bmN0aW9uIGRpc2Nvbm5lY3RSUEMoY2IpIHtcbiAgaWYgKCFjYikgY2IgPSBub29wO1xuXG4gIGlmICghdGhpcy5jbGllbnRfc29jayB8fCAhdGhpcy5jbGllbnRfc29jay5jbG9zZSkge1xuICAgIHRoaXMuY2xpZW50ID0gbnVsbDtcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICBjYihuZXcgRXJyb3IoJ1NVQiBjb25uZWN0aW9uIHRvIFBNMiBpcyBub3QgbGF1bmNoZWQnKSk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAodGhpcy5jbGllbnRfc29jay5jb25uZWN0ZWQgPT09IGZhbHNlIHx8XG4gICAgdGhpcy5jbGllbnRfc29jay5jbG9zaW5nID09PSB0cnVlKSB7XG4gICAgdGhpcy5jbGllbnQgPSBudWxsO1xuICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNiKG5ldyBFcnJvcignUlBDIGFscmVhZHkgYmVpbmcgY2xvc2VkJykpO1xuICAgIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICB2YXIgdGltZXI7XG5cbiAgICB0aGlzLmNsaWVudF9zb2NrLm9uY2UoJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIHRoaXMuY2xpZW50ID0gbnVsbDtcbiAgICAgIGRlYnVnKCdQTTIgUlBDIGNsZWFubHkgY2xvc2VkJyk7XG4gICAgICByZXR1cm4gY2IobnVsbCwgeyBtc2c6ICdSUEMgU3VjY2Vzc2Z1bGx5IGNsb3NlZCcgfSk7XG4gICAgfSk7XG5cbiAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY2xpZW50X3NvY2suZGVzdHJveSlcbiAgICAgICAgdGhpcy5jbGllbnRfc29jay5kZXN0cm95KCk7XG4gICAgICB0aGlzLmNsaWVudCA9IG51bGw7XG4gICAgICByZXR1cm4gY2IobnVsbCwgeyBtc2c6ICdSUEMgU3VjY2Vzc2Z1bGx5IGNsb3NlZCB2aWEgdGltZW91dCcgfSk7XG4gICAgfSwgMjAwKTtcblxuICAgIHRoaXMuY2xpZW50X3NvY2suY2xvc2UoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGRlYnVnKCdFcnJvciB3aGlsZSBkaXNjb25uZWN0aW5nIFJQQyBQTTInLCBlLnN0YWNrIHx8IGUpO1xuICAgIHJldHVybiBjYihlKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmxhdW5jaEJ1cyA9IGZ1bmN0aW9uIGxhdW5jaEV2ZW50U3lzdGVtKGNiKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5zdWIgPSBheG9uLnNvY2tldCgnc3ViLWVtaXR0ZXInLCBudWxsKTtcbiAgdGhpcy5zdWJfc29jayA9IHRoaXMuc3ViLmNvbm5lY3QodGhpcy5wdWJfc29ja2V0X2ZpbGUpO1xuXG4gIHRoaXMuc3ViX3NvY2sub25jZSgnY29ubmVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY2IobnVsbCwgc2VsZi5zdWIsIHNlbGYuc3ViX3NvY2spO1xuICB9KTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUuZGlzY29ubmVjdEJ1cyA9IGZ1bmN0aW9uIGRpc2Nvbm5lY3RCdXMoY2IpIHtcbiAgaWYgKCFjYikgY2IgPSBub29wO1xuXG4gIGlmICghdGhpcy5zdWJfc29jayB8fCAhdGhpcy5zdWJfc29jay5jbG9zZSkge1xuICAgIHRoaXMuc3ViID0gbnVsbDtcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICBjYihudWxsLCB7IG1zZzogJ2J1cyB3YXMgbm90IGNvbm5lY3RlZCcgfSk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAodGhpcy5zdWJfc29jay5jb25uZWN0ZWQgPT09IGZhbHNlIHx8XG4gICAgdGhpcy5zdWJfc29jay5jbG9zaW5nID09PSB0cnVlKSB7XG4gICAgdGhpcy5zdWIgPSBudWxsO1xuICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNiKG5ldyBFcnJvcignU1VCIGNvbm5lY3Rpb24gaXMgYWxyZWFkeSBiZWluZyBjbG9zZWQnKSk7XG4gICAgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIHZhciB0aW1lcjtcblxuICAgIHRoaXMuc3ViX3NvY2sub25jZSgnY2xvc2UnLCAoKSA9PiB7XG4gICAgICB0aGlzLnN1YiA9IG51bGw7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgZGVidWcoJ1BNMiBQVUIgY2xlYW5seSBjbG9zZWQnKTtcbiAgICAgIHJldHVybiBjYigpO1xuICAgIH0pO1xuXG4gICAgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLnN1Yl9zb2NrLmRlc3Ryb3kpXG4gICAgICAgIHRoaXMuc3ViX3NvY2suZGVzdHJveSgpO1xuICAgICAgcmV0dXJuIGNiKCk7XG4gICAgfSwgMjAwKTtcblxuICAgIHRoaXMuc3ViX3NvY2suY2xvc2UoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBjYihlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBEZXNjcmlwdGlvblxuICogQG1ldGhvZCBnZXN0RXhwb3NlZE1ldGhvZHNcbiAqIEBwYXJhbSB7fSBjYlxuICogQHJldHVyblxuICovXG5DbGllbnQucHJvdG90eXBlLmdldEV4cG9zZWRNZXRob2RzID0gZnVuY3Rpb24gZ2V0RXhwb3NlZE1ldGhvZHMoY2IpIHtcbiAgdGhpcy5jbGllbnQubWV0aG9kcyhjYik7XG59O1xuXG4vKipcbiAqIERlc2NyaXB0aW9uXG4gKiBAbWV0aG9kIGV4ZWN1dGVSZW1vdGVcbiAqIEBwYXJhbSB7fSBtZXRob2RcbiAqIEBwYXJhbSB7fSBlbnZcbiAqIEBwYXJhbSB7fSBmblxuICogQHJldHVyblxuICovXG5DbGllbnQucHJvdG90eXBlLmV4ZWN1dGVSZW1vdGUgPSBmdW5jdGlvbiBleGVjdXRlUmVtb3RlKG1ldGhvZCwgYXBwX2NvbmYsIGZuKSB7XG4gIC8vIHN0b3Agd2F0Y2ggb24gc3RvcCB8IGVudiBpcyB0aGUgcHJvY2VzcyBpZFxuICBpZiAobWV0aG9kLmluZGV4T2YoJ3N0b3AnKSAhPT0gLTEpIHtcbiAgICB0aGlzLnN0b3BXYXRjaChtZXRob2QsIGFwcF9jb25mKTtcbiAgfVxuICAvLyBzdG9wIHdhdGNoaW5nIHdoZW4gcHJvY2VzcyBpcyBkZWxldGVkXG4gIGVsc2UgaWYgKG1ldGhvZC5pbmRleE9mKCdkZWxldGUnKSAhPT0gLTEpIHtcbiAgICB0aGlzLnN0b3BXYXRjaChtZXRob2QsIGFwcF9jb25mKTtcbiAgfVxuICAvLyBzdG9wIGV2ZXJ5dGhpbmcgb24ga2lsbFxuICBlbHNlIGlmIChtZXRob2QuaW5kZXhPZigna2lsbCcpICE9PSAtMSkge1xuICAgIHRoaXMuc3RvcFdhdGNoKCdkZWxldGVBbGwnLCBhcHBfY29uZik7XG4gIH1cbiAgZWxzZSBpZiAobWV0aG9kLmluZGV4T2YoJ3Jlc3RhcnRQcm9jZXNzSWQnKSAhPT0gLTEgJiYgcHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0td2F0Y2gnKSA+IC0xKSB7XG4gICAgZGVsZXRlIGFwcF9jb25mLmVudi5jdXJyZW50X2NvbmYud2F0Y2g7XG4gICAgdGhpcy50b2dnbGVXYXRjaChtZXRob2QsIGFwcF9jb25mKTtcbiAgfVxuXG4gIGlmICghdGhpcy5jbGllbnQgfHwgIXRoaXMuY2xpZW50LmNhbGwpIHtcbiAgICB0aGlzLnN0YXJ0KChlcnJvcikgPT4ge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIGlmIChmbilcbiAgICAgICAgICByZXR1cm4gZm4oZXJyb3IpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgwKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmNsaWVudCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnQuY2FsbChtZXRob2QsIGFwcF9jb25mLCBmbik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZGVidWcoJ0NhbGxpbmcgZGFlbW9uIG1ldGhvZCBwbTI6JXMgb24gcnBjIHNvY2tldDolcycsIG1ldGhvZCwgdGhpcy5ycGNfc29ja2V0X2ZpbGUpO1xuICByZXR1cm4gdGhpcy5jbGllbnQuY2FsbChtZXRob2QsIGFwcF9jb25mLCBmbik7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLm5vdGlmeUdvZCA9IGZ1bmN0aW9uIChhY3Rpb25fbmFtZSwgaWQsIGNiKSB7XG4gIHRoaXMuZXhlY3V0ZVJlbW90ZSgnbm90aWZ5QnlQcm9jZXNzSWQnLCB7XG4gICAgaWQ6IGlkLFxuICAgIGFjdGlvbl9uYW1lOiBhY3Rpb25fbmFtZSxcbiAgICBtYW51YWxseTogdHJ1ZVxuICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgZGVidWcoJ0dvZCBub3RpZmllZCcpO1xuICAgIHJldHVybiBjYiA/IGNiKCkgOiBmYWxzZTtcbiAgfSk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmtpbGxEYWVtb24gPSBmdW5jdGlvbiBraWxsRGFlbW9uKGZuKSB7XG4gIHZhciB0aW1lb3V0O1xuICBjb25zdCBxdWl0ID0gKCkgPT4ge1xuICAgIHRoaXMuY2xvc2UoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGZuID8gZm4obnVsbCwgeyBzdWNjZXNzOiB0cnVlIH0pIDogZmFsc2U7XG4gICAgfSk7XG4gIH1cblxuICAvLyB1bmRlciB1bml4LCB3ZSBsaXN0ZW4gZm9yIHNpZ25hbCAodGhhdCBpcyBzZW5kIGJ5IGRhZW1vbiB0byBub3RpZnkgdXMgdGhhdCBpdHMgc2h1dGluZyBkb3duKVxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykge1xuICAgIHByb2Nlc3Mub25jZSgnU0lHUVVJVCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGRlYnVnKCdSZWNlaXZlZCBTSUdRVUlUIGZyb20gcG0yIGRhZW1vbicpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgcXVpdCgpO1xuICAgIH0pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIGlmIHVuZGVyIHdpbmRvd3MsIHRyeSB0byBwaW5nIHRoZSBkYWVtb24gdG8gc2VlIGlmIGl0IHN0aWxsIGhlcmVcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMucGluZ0RhZW1vbihmdW5jdGlvbiAoYWxpdmUpIHtcbiAgICAgICAgaWYgKCFhbGl2ZSkge1xuICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICByZXR1cm4gcXVpdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCAyNTApXG4gIH1cblxuICB0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgcXVpdCgpO1xuICB9LCAzMDAwKTtcblxuICAvLyBLaWxsIGRhZW1vblxuICB0aGlzLmV4ZWN1dGVSZW1vdGUoJ2tpbGxNZScsIHsgcGlkOiBwcm9jZXNzLnBpZCB9KTtcbn07XG5cblxuLyoqXG4gKiBEZXNjcmlwdGlvblxuICogQG1ldGhvZCB0b2dnbGVXYXRjaFxuICogQHBhcmFtIHtTdHJpbmd9IHBtMiBtZXRob2QgbmFtZVxuICogQHBhcmFtIHtPYmplY3R9IGFwcGxpY2F0aW9uIGVudmlyb25tZW50LCBzaG91bGQgaW5jbHVkZSBpZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqL1xuQ2xpZW50LnByb3RvdHlwZS50b2dnbGVXYXRjaCA9IGZ1bmN0aW9uIHRvZ2dsZVdhdGNoKG1ldGhvZCwgZW52LCBmbikge1xuICBkZWJ1ZygnQ2FsbGluZyB0b2dnbGVXYXRjaCcpO1xuICB0aGlzLmNsaWVudC5jYWxsKCd0b2dnbGVXYXRjaCcsIG1ldGhvZCwgZW52LCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZuID8gZm4oKSA6IGZhbHNlO1xuICB9KTtcbn07XG5cbi8qKlxuICogRGVzY3JpcHRpb25cbiAqIEBtZXRob2Qgc3RhcnRXYXRjaFxuICogQHBhcmFtIHtTdHJpbmd9IHBtMiBtZXRob2QgbmFtZVxuICogQHBhcmFtIHtPYmplY3R9IGFwcGxpY2F0aW9uIGVudmlyb25tZW50LCBzaG91bGQgaW5jbHVkZSBpZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqL1xuQ2xpZW50LnByb3RvdHlwZS5zdGFydFdhdGNoID0gZnVuY3Rpb24gcmVzdGFydFdhdGNoKG1ldGhvZCwgZW52LCBmbikge1xuICBkZWJ1ZygnQ2FsbGluZyBzdGFydFdhdGNoJyk7XG4gIHRoaXMuY2xpZW50LmNhbGwoJ3N0YXJ0V2F0Y2gnLCBtZXRob2QsIGVudiwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbiA/IGZuKCkgOiBmYWxzZTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIERlc2NyaXB0aW9uXG4gKiBAbWV0aG9kIHN0b3BXYXRjaFxuICogQHBhcmFtIHtTdHJpbmd9IHBtMiBtZXRob2QgbmFtZVxuICogQHBhcmFtIHtPYmplY3R9IGFwcGxpY2F0aW9uIGVudmlyb25tZW50LCBzaG91bGQgaW5jbHVkZSBpZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqL1xuQ2xpZW50LnByb3RvdHlwZS5zdG9wV2F0Y2ggPSBmdW5jdGlvbiBzdG9wV2F0Y2gobWV0aG9kLCBlbnYsIGZuKSB7XG4gIGRlYnVnKCdDYWxsaW5nIHN0b3BXYXRjaCcpO1xuICB0aGlzLmNsaWVudC5jYWxsKCdzdG9wV2F0Y2gnLCBtZXRob2QsIGVudiwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbiA/IGZuKCkgOiBmYWxzZTtcbiAgfSk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmdldEFsbFByb2Nlc3MgPSBmdW5jdGlvbiAoY2IpIHtcbiAgdmFyIGZvdW5kX3Byb2MgPSBbXTtcblxuICB0aGlzLmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIHByb2NzKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgIHJldHVybiBjYihlcnIpO1xuICAgIH1cblxuICAgIHJldHVybiBjYihudWxsLCBwcm9jcyk7XG4gIH0pO1xufTtcblxuQ2xpZW50LnByb3RvdHlwZS5nZXRBbGxQcm9jZXNzSWQgPSBmdW5jdGlvbiAoY2IpIHtcbiAgdmFyIGZvdW5kX3Byb2MgPSBbXTtcblxuICB0aGlzLmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIHByb2NzKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgIHJldHVybiBjYihlcnIpO1xuICAgIH1cblxuICAgIHJldHVybiBjYihudWxsLCBwcm9jcy5tYXAocHJvYyA9PiBwcm9jLnBtX2lkKSk7XG4gIH0pO1xufTtcblxuQ2xpZW50LnByb3RvdHlwZS5nZXRBbGxQcm9jZXNzSWRXaXRob3V0TW9kdWxlcyA9IGZ1bmN0aW9uIChjYikge1xuICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuXG4gIHRoaXMuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24gKGVyciwgcHJvY3MpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcignRXJyb3IgcmV0cmlldmluZyBwcm9jZXNzIGxpc3Q6ICcgKyBlcnIpO1xuICAgICAgcmV0dXJuIGNiKGVycik7XG4gICAgfVxuXG4gICAgdmFyIHByb2NfaWRzID0gcHJvY3NcbiAgICAgIC5maWx0ZXIocHJvYyA9PiAhcHJvYy5wbTJfZW52LnBteF9tb2R1bGUpXG4gICAgICAubWFwKHByb2MgPT4gcHJvYy5wbV9pZClcblxuICAgIHJldHVybiBjYihudWxsLCBwcm9jX2lkcyk7XG4gIH0pO1xufTtcblxuQ2xpZW50LnByb3RvdHlwZS5nZXRQcm9jZXNzSWRCeU5hbWUgPSBmdW5jdGlvbiAobmFtZSwgZm9yY2VfYWxsLCBjYikge1xuICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuICB2YXIgZnVsbF9kZXRhaWxzID0ge307XG5cbiAgaWYgKHR5cGVvZiAoY2IpID09PSAndW5kZWZpbmVkJykge1xuICAgIGNiID0gZm9yY2VfYWxsO1xuICAgIGZvcmNlX2FsbCA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiAobmFtZSkgPT0gJ251bWJlcicpXG4gICAgbmFtZSA9IG5hbWUudG9TdHJpbmcoKTtcblxuICB0aGlzLmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcignRXJyb3IgcmV0cmlldmluZyBwcm9jZXNzIGxpc3Q6ICcgKyBlcnIpO1xuICAgICAgcmV0dXJuIGNiKGVycik7XG4gICAgfVxuXG4gICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChwcm9jKSB7XG4gICAgICBpZiAocHJvYy5wbTJfZW52Lm5hbWUgPT0gbmFtZSB8fCBwcm9jLnBtMl9lbnYucG1fZXhlY19wYXRoID09IHBhdGgucmVzb2x2ZShuYW1lKSkge1xuICAgICAgICBmb3VuZF9wcm9jLnB1c2gocHJvYy5wbV9pZCk7XG4gICAgICAgIGZ1bGxfZGV0YWlsc1twcm9jLnBtX2lkXSA9IHByb2M7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY2IobnVsbCwgZm91bmRfcHJvYywgZnVsbF9kZXRhaWxzKTtcbiAgfSk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmdldFByb2Nlc3NJZHNCeU5hbWVzcGFjZSA9IGZ1bmN0aW9uIChuYW1lc3BhY2UsIGZvcmNlX2FsbCwgY2IpIHtcbiAgdmFyIGZvdW5kX3Byb2MgPSBbXTtcbiAgdmFyIGZ1bGxfZGV0YWlscyA9IHt9O1xuXG4gIGlmICh0eXBlb2YgKGNiKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjYiA9IGZvcmNlX2FsbDtcbiAgICBmb3JjZV9hbGwgPSBmYWxzZTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgKG5hbWVzcGFjZSkgPT0gJ251bWJlcicpXG4gICAgbmFtZXNwYWNlID0gbmFtZXNwYWNlLnRvU3RyaW5nKCk7XG5cbiAgdGhpcy5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgaWYgKGVycikge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgIHJldHVybiBjYihlcnIpO1xuICAgIH1cblxuICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbiAocHJvYykge1xuICAgICAgaWYgKHByb2MucG0yX2Vudi5uYW1lc3BhY2UgPT0gbmFtZXNwYWNlKSB7XG4gICAgICAgIGZvdW5kX3Byb2MucHVzaChwcm9jLnBtX2lkKTtcbiAgICAgICAgZnVsbF9kZXRhaWxzW3Byb2MucG1faWRdID0gcHJvYztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBjYihudWxsLCBmb3VuZF9wcm9jLCBmdWxsX2RldGFpbHMpO1xuICB9KTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUuZ2V0UHJvY2Vzc0J5TmFtZSA9IGZ1bmN0aW9uIChuYW1lLCBjYikge1xuICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuXG4gIHRoaXMuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24gKGVyciwgbGlzdCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIENvbW1vbi5wcmludEVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICB9XG5cbiAgICBsaXN0LmZvckVhY2goZnVuY3Rpb24gKHByb2MpIHtcbiAgICAgIGlmIChwcm9jLnBtMl9lbnYubmFtZSA9PSBuYW1lIHx8XG4gICAgICAgIHByb2MucG0yX2Vudi5wbV9leGVjX3BhdGggPT0gcGF0aC5yZXNvbHZlKG5hbWUpKSB7XG4gICAgICAgIGZvdW5kX3Byb2MucHVzaChwcm9jKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBjYihudWxsLCBmb3VuZF9wcm9jKTtcbiAgfSk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmdldFByb2Nlc3NCeU5hbWVPcklkID0gZnVuY3Rpb24gKG5hbWVPcklkLCBjYikge1xuICB2YXIgZm91bmRQcm9jID0gW107XG5cbiAgdGhpcy5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgaWYgKGVycikge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgIHJldHVybiBjYihlcnIpO1xuICAgIH1cblxuICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbiAocHJvYykge1xuICAgICAgaWYgKHByb2MucG0yX2Vudi5uYW1lID09PSBuYW1lT3JJZCB8fFxuICAgICAgICBwcm9jLnBtMl9lbnYucG1fZXhlY19wYXRoID09PSBwYXRoLnJlc29sdmUobmFtZU9ySWQpIHx8XG4gICAgICAgIHByb2MucGlkID09PSBwYXJzZUludChuYW1lT3JJZCkgfHxcbiAgICAgICAgcHJvYy5wbTJfZW52LnBtX2lkID09PSBwYXJzZUludChuYW1lT3JJZCkpIHtcbiAgICAgICAgZm91bmRQcm9jLnB1c2gocHJvYyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY2IobnVsbCwgZm91bmRQcm9jKTtcbiAgfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDbGllbnQ7XG4iXX0=