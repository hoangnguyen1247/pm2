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
  if (!opts.conf) this.conf = require("../constants.js");else {
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
      var Daemon = require("./Daemon.js");

      var daemon = new Daemon({
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
      require('mkdirp').sync(opts.DEFAULT_LOG_PATH);
    } catch (e) {
      console.error(e.stack || e);
    }
  }

  if (!_fs["default"].existsSync(opts.DEFAULT_PID_PATH)) {
    try {
      require('mkdirp').sync(opts.DEFAULT_PID_PATH);
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
      require('mkdirp').sync(opts.DEFAULT_MODULE_PATH);
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
    var vCheck = require("./VersionCheck.js");

    vCheck({
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
    var os = require('os');

    node_args.push('--gc-global'); // Does full GC (smaller memory footprint)

    node_args.push('--max-old-space-size=' + Math.floor(os.totalmem() / 1024 / 1024));
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

  var child = require('child_process').spawn(interpreter, node_args, {
    detached: true,
    cwd: that.conf.cwd || process.cwd(),
    env: _util["default"].inherits({
      'SILENT': that.conf.DEBUG ? !that.conf.DEBUG : true,
      'PM2_HOME': that.pm2_home
    }, process.env),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9DbGllbnQudHMiXSwibmFtZXMiOlsiZGVidWciLCJub29wIiwiQ2xpZW50Iiwib3B0cyIsImNvbmYiLCJyZXF1aXJlIiwic3ViX3NvY2siLCJkYWVtb25fbW9kZSIsInBtMl9ob21lIiwiUE0yX1JPT1RfUEFUSCIsInNlY3JldF9rZXkiLCJwdWJsaWNfa2V5IiwibWFjaGluZV9uYW1lIiwiaW5pdEZpbGVTdHJ1Y3R1cmUiLCJEQUVNT05fUlBDX1BPUlQiLCJEQUVNT05fUFVCX1BPUlQiLCJycGNfc29ja2V0X2ZpbGUiLCJwdWJfc29ja2V0X2ZpbGUiLCJwcm90b3R5cGUiLCJzdGFydCIsImNiIiwidGhhdCIsInBpbmdEYWVtb24iLCJkYWVtb25BbGl2ZSIsImxhdW5jaFJQQyIsImVyciIsIm1ldGEiLCJuZXdfcG0yX2luc3RhbmNlIiwiRGFlbW9uIiwiZGFlbW9uIiwicGlkX2ZpbGUiLCJQTTJfUElEX0ZJTEVfUEFUSCIsImlnbm9yZV9zaWduYWxzIiwiY29uc29sZSIsImxvZyIsImlubmVyU3RhcnQiLCJLTURhZW1vbiIsImxhdW5jaEFuZEludGVyYWN0IiwicG0yX3ZlcnNpb24iLCJwa2ciLCJ2ZXJzaW9uIiwiZGF0YSIsImludGVyYWN0b3JfcHJvYyIsImludGVyYWN0b3JfcHJvY2VzcyIsImxhdW5jaERhZW1vbiIsImNoaWxkIiwiQ29tbW9uIiwicHJpbnRFcnJvciIsInByb2Nlc3MiLCJleGl0IiwiRVJST1JfRVhJVCIsImVudiIsIlBNMl9ESVNDUkVURV9NT0RFIiwicHJpbnRPdXQiLCJQUkVGSVhfTVNHIiwiZnMiLCJleGlzdHNTeW5jIiwiREVGQVVMVF9MT0dfUEFUSCIsInN5bmMiLCJlIiwiZXJyb3IiLCJzdGFjayIsIkRFRkFVTFRfUElEX1BBVEgiLCJQTTJfTU9EVUxFX0NPTkZfRklMRSIsIndyaXRlRmlsZVN5bmMiLCJERUZBVUxUX01PRFVMRV9QQVRIIiwicGF0aCIsImpvaW4iLCJQTTJfSE9NRSIsIkRhdGUiLCJub3ciLCJ0b1N0cmluZyIsIlBNMl9QUk9HUkFNTUFUSUMiLCJ2Q2hlY2siLCJzdGF0ZSIsImR0IiwicmVhZEZpbGVTeW5jIiwiX19kaXJuYW1lIiwiUE0yX0JBTk5FUiIsImNsb3NlIiwiZGlzY29ubmVjdFJQQyIsImJpbmQiLCJkaXNjb25uZWN0QnVzIiwiZm4iLCJuZXh0IiwiaW50ZXJhY3RvciIsIkNsaWVudEpTIiwicmVzb2x2ZSIsImRpcm5hbWUiLCJtb2R1bGUiLCJmaWxlbmFtZSIsIm5vZGVfYXJncyIsIm91dCIsIm9wZW5TeW5jIiwiUE0yX0xPR19GSUxFX1BBVEgiLCJMT1dfTUVNT1JZX0VOVklST05NRU5UIiwib3MiLCJwdXNoIiwiTWF0aCIsImZsb29yIiwidG90YWxtZW0iLCJQTTJfTk9ERV9PUFRJT05TIiwiY29uY2F0Iiwic3BsaXQiLCJpbnRlcnByZXRlciIsImV4ZWNQYXRoIiwic3Bhd24iLCJkZXRhY2hlZCIsImN3ZCIsInV0aWwiLCJpbmhlcml0cyIsIkRFQlVHIiwic3RkaW8iLCJvbkVycm9yIiwibWVzc2FnZSIsIm9uY2UiLCJ1bnJlZiIsIm1zZyIsInJlbW92ZUxpc3RlbmVyIiwiZGlzY29ubmVjdCIsIlBNMl9OT19JTlRFUkFDVElPTiIsInJlcSIsImF4b24iLCJzb2NrZXQiLCJjbGllbnQiLCJycGMiLCJzb2NrIiwibmV4dFRpY2siLCJjb2RlIiwic3RhdCIsInN0YXRzIiwidWlkIiwiUFJFRklYX01TR19FUlIiLCJVU0VSIiwiY29ubmVjdCIsInNlbGYiLCJjb25uZWN0SGFuZGxlciIsImVycm9ySGFuZGxlciIsInNldFRpbWVvdXQiLCJjbGllbnRfc29jayIsIkVycm9yIiwiY29ubmVjdGVkIiwiY2xvc2luZyIsInRpbWVyIiwiY2xlYXJUaW1lb3V0IiwiZGVzdHJveSIsImxhdW5jaEJ1cyIsImxhdW5jaEV2ZW50U3lzdGVtIiwic3ViIiwiZ2V0RXhwb3NlZE1ldGhvZHMiLCJtZXRob2RzIiwiZXhlY3V0ZVJlbW90ZSIsIm1ldGhvZCIsImFwcF9jb25mIiwiaW5kZXhPZiIsInN0b3BXYXRjaCIsImFyZ3YiLCJjdXJyZW50X2NvbmYiLCJ3YXRjaCIsInRvZ2dsZVdhdGNoIiwiY2FsbCIsIm5vdGlmeUdvZCIsImFjdGlvbl9uYW1lIiwiaWQiLCJtYW51YWxseSIsImtpbGxEYWVtb24iLCJ0aW1lb3V0IiwicXVpdCIsInN1Y2Nlc3MiLCJwbGF0Zm9ybSIsImFsaXZlIiwicGlkIiwic3RhcnRXYXRjaCIsInJlc3RhcnRXYXRjaCIsImdldEFsbFByb2Nlc3MiLCJmb3VuZF9wcm9jIiwicHJvY3MiLCJnZXRBbGxQcm9jZXNzSWQiLCJtYXAiLCJwcm9jIiwicG1faWQiLCJnZXRBbGxQcm9jZXNzSWRXaXRob3V0TW9kdWxlcyIsInByb2NfaWRzIiwiZmlsdGVyIiwicG0yX2VudiIsInBteF9tb2R1bGUiLCJnZXRQcm9jZXNzSWRCeU5hbWUiLCJuYW1lIiwiZm9yY2VfYWxsIiwiZnVsbF9kZXRhaWxzIiwibGlzdCIsImZvckVhY2giLCJwbV9leGVjX3BhdGgiLCJnZXRQcm9jZXNzSWRzQnlOYW1lc3BhY2UiLCJuYW1lc3BhY2UiLCJnZXRQcm9jZXNzQnlOYW1lIiwiZ2V0UHJvY2Vzc0J5TmFtZU9ySWQiLCJuYW1lT3JJZCIsImZvdW5kUHJvYyIsInBhcnNlSW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBTUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFoQkE7Ozs7O0FBa0JBLElBQU1BLEtBQUssR0FBRyx1QkFBWSxZQUFaLENBQWQ7O0FBRUEsU0FBU0MsSUFBVCxHQUFnQixDQUFHOztBQUVuQixJQUFJQyxNQUFNLEdBQUcsU0FBVEEsTUFBUyxDQUFVQyxJQUFWLEVBQWdCO0FBQzNCLE1BQUksQ0FBQ0EsSUFBTCxFQUFXQSxJQUFJLEdBQUcsRUFBUDtBQUVYLE1BQUksQ0FBQ0EsSUFBSSxDQUFDQyxJQUFWLEVBQ0UsS0FBS0EsSUFBTCxHQUFZQyxPQUFPLG1CQUFuQixDQURGLEtBRUs7QUFDSCxTQUFLRCxJQUFMLEdB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LElBQUQsRUFBTzJKLFVBQVAsQ0FBVDtBQUNELEdBZEQ7QUFlRCxDQWxCRDs7QUFvQkE3SyxNQUFNLENBQUNnQixTQUFQLENBQWlCa0wsb0JBQWpCLEdBQXdDLFVBQVVDLFFBQVYsRUFBb0JqTCxFQUFwQixFQUF3QjtBQUM5RCxNQUFJa0wsU0FBUyxHQUFHLEVBQWhCO0FBRUEsT0FBSy9DLGFBQUwsQ0FBbUIsZ0JBQW5CLEVBQXFDLEVBQXJDLEVBQXlDLFVBQVU5SCxHQUFWLEVBQWVxSyxJQUFmLEVBQXFCO0FBQzVELFFBQUlySyxHQUFKLEVBQVM7QUFDUHFCLHlCQUFPQyxVQUFQLENBQWtCLG9DQUFvQ3RCLEdBQXREOztBQUNBLGFBQU9MLEVBQUUsQ0FBQ0ssR0FBRCxDQUFUO0FBQ0Q7O0FBRURxSyxJQUFBQSxJQUFJLENBQUNDLE9BQUwsQ0FBYSxVQUFVWixJQUFWLEVBQWdCO0FBQzNCLFVBQUlBLElBQUksQ0FBQ0ssT0FBTCxDQUFhRyxJQUFiLEtBQXNCVSxRQUF0QixJQUNGbEIsSUFBSSxDQUFDSyxPQUFMLENBQWFRLFlBQWIsS0FBOEI5SCxpQkFBS3FCLE9BQUwsQ0FBYThHLFFBQWIsQ0FENUIsSUFFRmxCLElBQUksQ0FBQ1IsR0FBTCxLQUFhNEIsUUFBUSxDQUFDRixRQUFELENBRm5CLElBR0ZsQixJQUFJLENBQUNLLE9BQUwsQ0FBYUosS0FBYixLQUF1Qm1CLFFBQVEsQ0FBQ0YsUUFBRCxDQUhqQyxFQUc2QztBQUMzQ0MsUUFBQUEsU0FBUyxDQUFDckcsSUFBVixDQUFla0YsSUFBZjtBQUNEO0FBQ0YsS0FQRDtBQVNBLFdBQU8vSixFQUFFLENBQUMsSUFBRCxFQUFPa0wsU0FBUCxDQUFUO0FBQ0QsR0FoQkQ7QUFpQkQsQ0FwQkQ7O2VBc0JlcE0sTSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIGxpY2Vuc2UgdGhhdFxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4gKi9cblxuaW1wb3J0IGRlYnVnTG9nZ2VyIGZyb20gJ2RlYnVnJztcbmltcG9ydCBDb21tb24gZnJvbSAnLi9Db21tb24uanMnO1xuaW1wb3J0IEtNRGFlbW9uIGZyb20gJ0BwbTIvYWdlbnQvc3JjL0ludGVyYWN0b3JDbGllbnQnO1xuaW1wb3J0IHJwYyBmcm9tICdwbTItYXhvbi1ycGMnO1xuaW1wb3J0IGZvckVhY2ggZnJvbSAnYXN5bmMvZm9yRWFjaCc7XG5pbXBvcnQgYXhvbiBmcm9tICdwbTItYXhvbic7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBwa2cgZnJvbSAnLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCB3aGljaCBmcm9tICcuL3Rvb2xzL3doaWNoJztcblxuY29uc3QgZGVidWcgPSBkZWJ1Z0xvZ2dlcigncG0yOmNsaWVudCcpO1xuXG5mdW5jdGlvbiBub29wKCkgeyB9XG5cbnZhciBDbGllbnQgPSBmdW5jdGlvbiAob3B0cykge1xuICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcblxuICBpZiAoIW9wdHMuY29uZilcbiAgICB0aGlzLmNvbmYgPSByZXF1aXJlKCcuLi9jb25zdGFudHMuanMnKTtcbiAgZWxzZSB7XG4gICAgdGhpcy5jb25mID0gb3B0cy5jb25mO1xuICB9XG5cbiAgdGhpcy5zdWJfc29jayA9IHt9O1xuICB0aGlzLmRhZW1vbl9tb2RlID0gdHlwZW9mIChvcHRzLmRhZW1vbl9tb2RlKSA9PT0gJ3VuZGVmaW5lZCcgPyB0cnVlIDogb3B0cy5kYWVtb25fbW9kZTtcbiAgdGhpcy5wbTJfaG9tZSA9IHRoaXMuY29uZi5QTTJfUk9PVF9QQVRIO1xuICB0aGlzLnNlY3JldF9rZXkgPSBvcHRzLnNlY3JldF9rZXk7XG4gIHRoaXMucHVibGljX2tleSA9IG9wdHMucHVibGljX2tleTtcbiAgdGhpcy5tYWNoaW5lX25hbWUgPSBvcHRzLm1hY2hpbmVfbmFtZTtcblxuICAvLyBDcmVhdGUgYWxsIGZvbGRlcnMgYW5kIGZpbGVzIG5lZWRlZFxuICAvLyBDbGllbnQgZGVwZW5kcyB0byB0aGF0IHRvIGludGVyYWN0IHdpdGggUE0yIHByb3Blcmx5XG4gIHRoaXMuaW5pdEZpbGVTdHJ1Y3R1cmUodGhpcy5jb25mKTtcblxuICBkZWJ1ZygnVXNpbmcgUlBDIGZpbGUgJXMnLCB0aGlzLmNvbmYuREFFTU9OX1JQQ19QT1JUKTtcbiAgZGVidWcoJ1VzaW5nIFBVQiBmaWxlICVzJywgdGhpcy5jb25mLkRBRU1PTl9QVUJfUE9SVCk7XG4gIHRoaXMucnBjX3NvY2tldF9maWxlID0gdGhpcy5jb25mLkRBRU1PTl9SUENfUE9SVDtcbiAgdGhpcy5wdWJfc29ja2V0X2ZpbGUgPSB0aGlzLmNvbmYuREFFTU9OX1BVQl9QT1JUO1xufTtcblxuLy8gQGJyZWFraW5nIGNoYW5nZSAobm9EYWVtb25Nb2RlIGhhcyBiZWVuIGRyb3ApXG4vLyBAdG9kbyByZXQgZXJyXG5DbGllbnQucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKGNiKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcblxuICB0aGlzLnBpbmdEYWVtb24oZnVuY3Rpb24gKGRhZW1vbkFsaXZlKSB7XG4gICAgaWYgKGRhZW1vbkFsaXZlID09PSB0cnVlKVxuICAgICAgcmV0dXJuIHRoYXQubGF1bmNoUlBDKGZ1bmN0aW9uIChlcnIsIG1ldGEpIHtcbiAgICAgICAgcmV0dXJuIGNiKG51bGwsIHtcbiAgICAgICAgICBkYWVtb25fbW9kZTogdGhhdC5jb25mLmRhZW1vbl9tb2RlLFxuICAgICAgICAgIG5ld19wbTJfaW5zdGFuY2U6IGZhbHNlLFxuICAgICAgICAgIHJwY19zb2NrZXRfZmlsZTogdGhhdC5ycGNfc29ja2V0X2ZpbGUsXG4gICAgICAgICAgcHViX3NvY2tldF9maWxlOiB0aGF0LnB1Yl9zb2NrZXRfZmlsZSxcbiAgICAgICAgICBwbTJfaG9tZTogdGhhdC5wbTJfaG9tZVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogTm8gRGFlbW9uIG1vZGVcbiAgICAgKi9cbiAgICBpZiAodGhhdC5kYWVtb25fbW9kZSA9PT0gZmFsc2UpIHtcbiAgICAgIHZhciBEYWVtb24gPSByZXF1aXJlKCcuL0RhZW1vbi5qcycpO1xuXG4gICAgICB2YXIgZGFlbW9uID0gbmV3IERhZW1vbih7XG4gICAgICAgIHB1Yl9zb2NrZXRfZmlsZTogdGhhdC5jb25mLkRBRU1PTl9QVUJfUE9SVCxcbiAgICAgICAgcnBjX3NvY2tldF9maWxlOiB0aGF0LmNvbmYuREFFTU9OX1JQQ19QT1JULFxuICAgICAgICBwaWRfZmlsZTogdGhhdC5jb25mLlBNMl9QSURfRklMRV9QQVRILFxuICAgICAgICBpZ25vcmVfc2lnbmFsczogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCdMYXVuY2hpbmcgaW4gbm8gZGFlbW9uIG1vZGUnKTtcblxuICAgICAgZGFlbW9uLmlubmVyU3RhcnQoZnVuY3Rpb24gKCkge1xuICAgICAgICBLTURhZW1vbi5sYXVuY2hBbmRJbnRlcmFjdCh0aGF0LmNvbmYsIHtcbiAgICAgICAgICBtYWNoaW5lX25hbWU6IHRoYXQubWFjaGluZV9uYW1lLFxuICAgICAgICAgIHB1YmxpY19rZXk6IHRoYXQucHVibGljX2tleSxcbiAgICAgICAgICBzZWNyZXRfa2V5OiB0aGF0LnNlY3JldF9rZXksXG4gICAgICAgICAgcG0yX3ZlcnNpb246IHBrZy52ZXJzaW9uXG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIGRhdGEsIGludGVyYWN0b3JfcHJvYykge1xuICAgICAgICAgIHRoYXQuaW50ZXJhY3Rvcl9wcm9jZXNzID0gaW50ZXJhY3Rvcl9wcm9jO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGF0LmxhdW5jaFJQQyhmdW5jdGlvbiAoZXJyLCBtZXRhKSB7XG4gICAgICAgICAgcmV0dXJuIGNiKG51bGwsIHtcbiAgICAgICAgICAgIGRhZW1vbl9tb2RlOiB0aGF0LmNvbmYuZGFlbW9uX21vZGUsXG4gICAgICAgICAgICBuZXdfcG0yX2luc3RhbmNlOiB0cnVlLFxuICAgICAgICAgICAgcnBjX3NvY2tldF9maWxlOiB0aGF0LnJwY19zb2NrZXRfZmlsZSxcbiAgICAgICAgICAgIHB1Yl9zb2NrZXRfZmlsZTogdGhhdC5wdWJfc29ja2V0X2ZpbGUsXG4gICAgICAgICAgICBwbTJfaG9tZTogdGhhdC5wbTJfaG9tZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERhZW1vbiBtb2RlXG4gICAgICovXG4gICAgdGhhdC5sYXVuY2hEYWVtb24oZnVuY3Rpb24gKGVyciwgY2hpbGQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyKSA6IHByb2Nlc3MuZXhpdCh0aGF0LmNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghcHJvY2Vzcy5lbnYuUE0yX0RJU0NSRVRFX01PREUpXG4gICAgICAgIENvbW1vbi5wcmludE91dCh0aGF0LmNvbmYuUFJFRklYX01TRyArICdQTTIgU3VjY2Vzc2Z1bGx5IGRhZW1vbml6ZWQnKTtcblxuICAgICAgdGhhdC5sYXVuY2hSUEMoZnVuY3Rpb24gKGVyciwgbWV0YSkge1xuICAgICAgICByZXR1cm4gY2IobnVsbCwge1xuICAgICAgICAgIGRhZW1vbl9tb2RlOiB0aGF0LmNvbmYuZGFlbW9uX21vZGUsXG4gICAgICAgICAgbmV3X3BtMl9pbnN0YW5jZTogdHJ1ZSxcbiAgICAgICAgICBycGNfc29ja2V0X2ZpbGU6IHRoYXQucnBjX3NvY2tldF9maWxlLFxuICAgICAgICAgIHB1Yl9zb2NrZXRfZmlsZTogdGhhdC5wdWJfc29ja2V0X2ZpbGUsXG4gICAgICAgICAgcG0yX2hvbWU6IHRoYXQucG0yX2hvbWVcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59O1xuXG4vLyBJbml0IGZpbGUgc3RydWN0dXJlIG9mIHBtMl9ob21lXG4vLyBUaGlzIGluY2x1ZGVzXG4vLyAtIHBtMiBwaWQgYW5kIGxvZyBwYXRoXG4vLyAtIHJwYyBhbmQgcHViIHNvY2tldCBmb3IgY29tbWFuZCBleGVjdXRpb25cbkNsaWVudC5wcm90b3R5cGUuaW5pdEZpbGVTdHJ1Y3R1cmUgPSBmdW5jdGlvbiAob3B0cykge1xuICBpZiAoIWZzLmV4aXN0c1N5bmMob3B0cy5ERUZBVUxUX0xPR19QQVRIKSkge1xuICAgIHRyeSB7XG4gICAgICByZXF1aXJlKCdta2RpcnAnKS5zeW5jKG9wdHMuREVGQVVMVF9MT0dfUEFUSCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghZnMuZXhpc3RzU3luYyhvcHRzLkRFRkFVTFRfUElEX1BBVEgpKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJlcXVpcmUoJ21rZGlycCcpLnN5bmMob3B0cy5ERUZBVUxUX1BJRF9QQVRIKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFmcy5leGlzdHNTeW5jKG9wdHMuUE0yX01PRFVMRV9DT05GX0ZJTEUpKSB7XG4gICAgdHJ5IHtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMob3B0cy5QTTJfTU9EVUxFX0NPTkZfRklMRSwgXCJ7fVwiKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFmcy5leGlzdHNTeW5jKG9wdHMuREVGQVVMVF9NT0RVTEVfUEFUSCkpIHtcbiAgICB0cnkge1xuICAgICAgcmVxdWlyZSgnbWtkaXJwJykuc3luYyhvcHRzLkRFRkFVTFRfTU9EVUxFX1BBVEgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICB9XG4gIH1cblxuICBpZiAocHJvY2Vzcy5lbnYuUE0yX0RJU0NSRVRFX01PREUpIHtcbiAgICB0cnkge1xuICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ob3B0cy5QTTJfSE9NRSwgJ3RvdWNoJyksIERhdGUubm93KCkudG9TdHJpbmcoKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZGVidWcoZS5zdGFjayB8fCBlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXByb2Nlc3MuZW52LlBNMl9QUk9HUkFNTUFUSUMgJiYgIWZzLmV4aXN0c1N5bmMocGF0aC5qb2luKG9wdHMuUE0yX0hPTUUsICd0b3VjaCcpKSkge1xuXG4gICAgdmFyIHZDaGVjayA9IHJlcXVpcmUoJy4vVmVyc2lvbkNoZWNrLmpzJylcblxuICAgIHZDaGVjayh7XG4gICAgICBzdGF0ZTogJ2luc3RhbGwnLFxuICAgICAgdmVyc2lvbjogcGtnLnZlcnNpb25cbiAgICB9KVxuXG4gICAgdmFyIGR0ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsIG9wdHMuUE0yX0JBTk5FUikpO1xuICAgIGNvbnNvbGUubG9nKGR0LnRvU3RyaW5nKCkpO1xuICAgIHRyeSB7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihvcHRzLlBNMl9IT01FLCAndG91Y2gnKSwgRGF0ZS5ub3coKS50b1N0cmluZygpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBkZWJ1ZyhlLnN0YWNrIHx8IGUpO1xuICAgIH1cbiAgfVxufTtcblxuQ2xpZW50LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uIChjYikge1xuICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgZm9yRWFjaChbXG4gICAgdGhhdC5kaXNjb25uZWN0UlBDLmJpbmQodGhhdCksXG4gICAgdGhhdC5kaXNjb25uZWN0QnVzLmJpbmQodGhhdClcbiAgXSwgZnVuY3Rpb24gKGZuLCBuZXh0KSB7XG4gICAgZm4obmV4dClcbiAgfSwgY2IpO1xufTtcblxuLyoqXG4gKiBMYXVuY2ggdGhlIERhZW1vbiBieSBmb3JraW5nIHRoaXMgc2FtZSBmaWxlXG4gKiBUaGUgbWV0aG9kIENsaWVudC5yZW1vdGVXcmFwcGVyIHdpbGwgYmUgY2FsbGVkXG4gKlxuICogQG1ldGhvZCBsYXVuY2hEYWVtb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdHMuaW50ZXJhY3Rvcj10cnVlXSBhbGxvdyB0byBkaXNhYmxlIGludGVyYWN0aW9uIG9uIGxhdW5jaFxuICovXG5DbGllbnQucHJvdG90eXBlLmxhdW5jaERhZW1vbiA9IGZ1bmN0aW9uIChvcHRzLCBjYikge1xuICBpZiAodHlwZW9mIChvcHRzKSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgY2IgPSBvcHRzO1xuICAgIG9wdHMgPSB7XG4gICAgICBpbnRlcmFjdG9yOiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIHZhciB0aGF0ID0gdGhpc1xuICB2YXIgQ2xpZW50SlMgPSBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKG1vZHVsZS5maWxlbmFtZSksICdEYWVtb24uanMnKTtcbiAgdmFyIG5vZGVfYXJncyA9IFtdO1xuICB2YXIgb3V0LCBlcnI7XG5cbiAgLy8gaWYgKHByb2Nlc3MuZW52LlRSQVZJUykge1xuICAvLyAgIC8vIFJlZGlyZWN0IFBNMiBpbnRlcm5hbCBlcnIgYW5kIG91dCB0byBTVERFUlIgU1RET1VUIHdoZW4gcnVubmluZyB3aXRoIFRyYXZpc1xuICAvLyAgIG91dCA9IDE7XG4gIC8vICAgZXJyID0gMjtcbiAgLy8gfVxuICAvLyBlbHNlIHtcbiAgb3V0ID0gZnMub3BlblN5bmModGhhdC5jb25mLlBNMl9MT0dfRklMRV9QQVRILCAnYScpLFxuICAgIGVyciA9IGZzLm9wZW5TeW5jKHRoYXQuY29uZi5QTTJfTE9HX0ZJTEVfUEFUSCwgJ2EnKTtcbiAgLy99XG5cbiAgaWYgKHRoaXMuY29uZi5MT1dfTUVNT1JZX0VOVklST05NRU5UKSB7XG4gICAgdmFyIG9zID0gcmVxdWlyZSgnb3MnKTtcbiAgICBub2RlX2FyZ3MucHVzaCgnLS1nYy1nbG9iYWwnKTsgLy8gRG9lcyBmdWxsIEdDIChzbWFsbGVyIG1lbW9yeSBmb290cHJpbnQpXG4gICAgbm9kZV9hcmdzLnB1c2goJy0tbWF4LW9sZC1zcGFjZS1zaXplPScgKyBNYXRoLmZsb29yKG9zLnRvdGFsbWVtKCkgLyAxMDI0IC8gMTAyNCkpO1xuICB9XG5cbiAgLy8gTm9kZS5qcyB0dW5pbmcgZm9yIGJldHRlciBwZXJmb3JtYW5jZVxuICAvL25vZGVfYXJncy5wdXNoKCctLWV4cG9zZS1nYycpOyAvLyBBbGxvd3MgbWFudWFsIEdDIGluIHRoZSBjb2RlXG5cbiAgLyoqXG4gICAqIEFkZCBub2RlIFthcmd1bWVudHNdIGRlcGVuZGluZyBvbiBQTTJfTk9ERV9PUFRJT05TIGVudiB2YXJpYWJsZVxuICAgKi9cbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9OT0RFX09QVElPTlMpXG4gICAgbm9kZV9hcmdzID0gbm9kZV9hcmdzLmNvbmNhdChwcm9jZXNzLmVudi5QTTJfTk9ERV9PUFRJT05TLnNwbGl0KCcgJykpO1xuICBub2RlX2FyZ3MucHVzaChDbGllbnRKUyk7XG5cbiAgaWYgKCFwcm9jZXNzLmVudi5QTTJfRElTQ1JFVEVfTU9ERSlcbiAgICBDb21tb24ucHJpbnRPdXQodGhhdC5jb25mLlBSRUZJWF9NU0cgKyAnU3Bhd25pbmcgUE0yIGRhZW1vbiB3aXRoIHBtMl9ob21lPScgKyB0aGlzLnBtMl9ob21lKTtcblxuICB2YXIgaW50ZXJwcmV0ZXIgPSAnbm9kZSc7XG5cbiAgaWYgKHdoaWNoKCdub2RlJykgPT0gbnVsbClcbiAgICBpbnRlcnByZXRlciA9IHByb2Nlc3MuZXhlY1BhdGg7XG5cbiAgdmFyIGNoaWxkID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpLnNwYXduKGludGVycHJldGVyLCBub2RlX2FyZ3MsIHtcbiAgICBkZXRhY2hlZDogdHJ1ZSxcbiAgICBjd2Q6IHRoYXQuY29uZi5jd2QgfHwgcHJvY2Vzcy5jd2QoKSxcbiAgICBlbnY6IHV0aWwuaW5oZXJpdHMoe1xuICAgICAgJ1NJTEVOVCc6IHRoYXQuY29uZi5ERUJVRyA/ICF0aGF0LmNvbmYuREVCVUcgOiB0cnVlLFxuICAgICAgJ1BNMl9IT01FJzogdGhhdC5wbTJfaG9tZVxuICAgIH0sIHByb2Nlc3MuZW52KSxcbiAgICBzdGRpbzogWydpcGMnLCBvdXQsIGVycl1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gb25FcnJvcihlKSB7XG4gICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UgfHwgZSk7XG4gICAgcmV0dXJuIGNiID8gY2IoZS5tZXNzYWdlIHx8IGUpIDogZmFsc2U7XG4gIH1cblxuICBjaGlsZC5vbmNlKCdlcnJvcicsIG9uRXJyb3IpO1xuXG4gIGNoaWxkLnVucmVmKCk7XG5cbiAgY2hpbGQub25jZSgnbWVzc2FnZScsIGZ1bmN0aW9uIChtc2cpIHtcbiAgICBkZWJ1ZygnUE0yIGRhZW1vbiBsYXVuY2hlZCB3aXRoIHJldHVybiBtZXNzYWdlOiAnLCBtc2cpO1xuICAgIGNoaWxkLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uRXJyb3IpO1xuICAgIGNoaWxkLmRpc2Nvbm5lY3QoKTtcblxuICAgIGlmIChvcHRzICYmIG9wdHMuaW50ZXJhY3RvciA9PSBmYWxzZSlcbiAgICAgIHJldHVybiBjYihudWxsLCBjaGlsZCk7XG5cbiAgICBpZiAocHJvY2Vzcy5lbnYuUE0yX05PX0lOVEVSQUNUSU9OID09ICd0cnVlJylcbiAgICAgIHJldHVybiBjYihudWxsLCBjaGlsZCk7XG5cbiAgICAvKipcbiAgICAgKiBIZXJlIHRoZSBLZXltZXRyaWNzIGFnZW50IGlzIGxhdW5jaGVkIGF1dG9tYXRpY2NhbHkgaWZcbiAgICAgKiBpdCBoYXMgYmVlbiBhbHJlYWR5IGNvbmZpZ3VyZWQgYmVmb3JlICh2aWEgcG0yIGxpbmspXG4gICAgICovXG4gICAgS01EYWVtb24ubGF1bmNoQW5kSW50ZXJhY3QodGhhdC5jb25mLCB7XG4gICAgICBtYWNoaW5lX25hbWU6IHRoYXQubWFjaGluZV9uYW1lLFxuICAgICAgcHVibGljX2tleTogdGhhdC5wdWJsaWNfa2V5LFxuICAgICAgc2VjcmV0X2tleTogdGhhdC5zZWNyZXRfa2V5LFxuICAgICAgcG0yX3ZlcnNpb246IHBrZy52ZXJzaW9uXG4gICAgfSwgZnVuY3Rpb24gKGVyciwgZGF0YSwgaW50ZXJhY3Rvcl9wcm9jKSB7XG4gICAgICB0aGF0LmludGVyYWN0b3JfcHJvY2VzcyA9IGludGVyYWN0b3JfcHJvYztcbiAgICAgIHJldHVybiBjYihudWxsLCBjaGlsZCk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBQaW5nIHRoZSBkYWVtb24gdG8ga25vdyBpZiBpdCBhbGl2ZSBvciBub3RcbiAqIEBhcGkgcHVibGljXG4gKiBAbWV0aG9kIHBpbmdEYWVtb25cbiAqIEBwYXJhbSB7fSBjYlxuICogQHJldHVyblxuICovXG5DbGllbnQucHJvdG90eXBlLnBpbmdEYWVtb24gPSBmdW5jdGlvbiBwaW5nRGFlbW9uKGNiKSB7XG4gIHZhciByZXEgPSBheG9uLnNvY2tldCgncmVxJywgbnVsbCk7XG4gIHZhciBjbGllbnQgPSBuZXcgcnBjLkNsaWVudChyZXEpO1xuICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgZGVidWcoJ1tQSU5HIFBNMl0gVHJ5aW5nIHRvIGNvbm5lY3QgdG8gc2VydmVyJyk7XG5cbiAgY2xpZW50LnNvY2sub25jZSgncmVjb25uZWN0IGF0dGVtcHQnLCBmdW5jdGlvbiAoKSB7XG4gICAgY2xpZW50LnNvY2suY2xvc2UoKTtcbiAgICBkZWJ1ZygnRGFlbW9uIG5vdCBsYXVuY2hlZCcpO1xuICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNiKGZhbHNlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgY2xpZW50LnNvY2sub25jZSgnZXJyb3InLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlLmNvZGUgPT09ICdFQUNDRVMnKSB7XG4gICAgICBmcy5zdGF0KHRoYXQuY29uZi5EQUVNT05fUlBDX1BPUlQsIGZ1bmN0aW9uIChlLCBzdGF0cykge1xuICAgICAgICBpZiAoc3RhdHMudWlkID09PSAwKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcih0aGF0LmNvbmYuUFJFRklYX01TR19FUlIgKyAnUGVybWlzc2lvbiBkZW5pZWQsIHRvIGdpdmUgYWNjZXNzIHRvIGN1cnJlbnQgdXNlcjonKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnJCBzdWRvIGNob3duICcgKyBwcm9jZXNzLmVudi5VU0VSICsgJzonICsgcHJvY2Vzcy5lbnYuVVNFUiArICcgJyArIHRoYXQuY29uZi5EQUVNT05fUlBDX1BPUlQgKyAnICcgKyB0aGF0LmNvbmYuREFFTU9OX1BVQl9QT1JUKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgY29uc29sZS5lcnJvcih0aGF0LmNvbmYuUFJFRklYX01TR19FUlIgKyAnUGVybWlzc2lvbiBkZW5pZWQsIGNoZWNrIHBlcm1pc3Npb25zIG9uICcgKyB0aGF0LmNvbmYuREFFTU9OX1JQQ19QT1JUKTtcblxuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZVxuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UgfHwgZSk7XG4gIH0pO1xuXG4gIGNsaWVudC5zb2NrLm9uY2UoJ2Nvbm5lY3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgY2xpZW50LnNvY2sub25jZSgnY2xvc2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gY2IodHJ1ZSk7XG4gICAgfSk7XG4gICAgY2xpZW50LnNvY2suY2xvc2UoKTtcbiAgICBkZWJ1ZygnRGFlbW9uIGFsaXZlJyk7XG4gIH0pO1xuXG4gIHJlcS5jb25uZWN0KHRoaXMucnBjX3NvY2tldF9maWxlKTtcbn07XG5cbi8qKlxuICogTWV0aG9kcyB0byBpbnRlcmFjdCB3aXRoIHRoZSBEYWVtb24gdmlhIFJQQ1xuICogVGhpcyBtZXRob2Qgd2FpdCB0byBiZSBjb25uZWN0ZWQgdG8gdGhlIERhZW1vblxuICogT25jZSBoZSdzIGNvbm5lY3RlZCBpdCB0cmlnZ2VyIHRoZSBjb21tYW5kIHBhcnNpbmcgKG9uIC4vYmluL3BtMiBmaWxlLCBhdCB0aGUgZW5kKVxuICogQG1ldGhvZCBsYXVuY2hSUENcbiAqIEBwYXJhbXMge2Z1bmN0aW9ufSBbY2JdXG4gKiBAcmV0dXJuXG4gKi9cbkNsaWVudC5wcm90b3R5cGUubGF1bmNoUlBDID0gZnVuY3Rpb24gbGF1bmNoUlBDKGNiKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgZGVidWcoJ0xhdW5jaGluZyBSUEMgY2xpZW50IG9uIHNvY2tldCBmaWxlICVzJywgdGhpcy5ycGNfc29ja2V0X2ZpbGUpO1xuICB2YXIgcmVxID0gYXhvbi5zb2NrZXQoJ3JlcScsIG51bGwpO1xuICB0aGlzLmNsaWVudCA9IG5ldyBycGMuQ2xpZW50KHJlcSk7XG5cbiAgdmFyIGNvbm5lY3RIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHNlbGYuY2xpZW50LnNvY2sucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgZXJyb3JIYW5kbGVyKTtcbiAgICBkZWJ1ZygnUlBDIENvbm5lY3RlZCB0byBEYWVtb24nKTtcbiAgICBpZiAoY2IpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBjYihudWxsKTtcbiAgICAgIH0sIDQpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgZXJyb3JIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICBzZWxmLmNsaWVudC5zb2NrLnJlbW92ZUxpc3RlbmVyKCdjb25uZWN0JywgY29ubmVjdEhhbmRsZXIpO1xuICAgIGlmIChjYikge1xuICAgICAgcmV0dXJuIGNiKGUpO1xuICAgIH1cbiAgfTtcblxuICB0aGlzLmNsaWVudC5zb2NrLm9uY2UoJ2Nvbm5lY3QnLCBjb25uZWN0SGFuZGxlcik7XG4gIHRoaXMuY2xpZW50LnNvY2sub25jZSgnZXJyb3InLCBlcnJvckhhbmRsZXIpO1xuICB0aGlzLmNsaWVudF9zb2NrID0gcmVxLmNvbm5lY3QodGhpcy5ycGNfc29ja2V0X2ZpbGUpO1xufTtcblxuLyoqXG4gKiBNZXRob2RzIHRvIGNsb3NlIHRoZSBSUEMgY29ubmVjdGlvblxuICogQGNhbGxiYWNrIGNiXG4gKi9cbkNsaWVudC5wcm90b3R5cGUuZGlzY29ubmVjdFJQQyA9IGZ1bmN0aW9uIGRpc2Nvbm5lY3RSUEMoY2IpIHtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuICBpZiAoIWNiKSBjYiA9IG5vb3A7XG5cbiAgaWYgKCF0aGlzLmNsaWVudF9zb2NrIHx8ICF0aGlzLmNsaWVudF9zb2NrLmNsb3NlKSB7XG4gICAgdGhpcy5jbGllbnQgPSBudWxsO1xuICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNiKG5ldyBFcnJvcignU1VCIGNvbm5lY3Rpb24gdG8gUE0yIGlzIG5vdCBsYXVuY2hlZCcpKTtcbiAgICB9KTtcbiAgfVxuXG4gIGlmICh0aGlzLmNsaWVudF9zb2NrLmNvbm5lY3RlZCA9PT0gZmFsc2UgfHxcbiAgICB0aGlzLmNsaWVudF9zb2NrLmNsb3NpbmcgPT09IHRydWUpIHtcbiAgICB0aGlzLmNsaWVudCA9IG51bGw7XG4gICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgY2IobmV3IEVycm9yKCdSUEMgYWxyZWFkeSBiZWluZyBjbG9zZWQnKSk7XG4gICAgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIHZhciB0aW1lcjtcblxuICAgIHRoYXQuY2xpZW50X3NvY2sub25jZSgnY2xvc2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgdGhhdC5jbGllbnQgPSBudWxsO1xuICAgICAgZGVidWcoJ1BNMiBSUEMgY2xlYW5seSBjbG9zZWQnKTtcbiAgICAgIHJldHVybiBjYihudWxsLCB7IG1zZzogJ1JQQyBTdWNjZXNzZnVsbHkgY2xvc2VkJyB9KTtcbiAgICB9KTtcblxuICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhhdC5jbGllbnRfc29jay5kZXN0cm95KVxuICAgICAgICB0aGF0LmNsaWVudF9zb2NrLmRlc3Ryb3koKTtcbiAgICAgIHRoYXQuY2xpZW50ID0gbnVsbDtcbiAgICAgIHJldHVybiBjYihudWxsLCB7IG1zZzogJ1JQQyBTdWNjZXNzZnVsbHkgY2xvc2VkIHZpYSB0aW1lb3V0JyB9KTtcbiAgICB9LCAyMDApO1xuXG4gICAgdGhhdC5jbGllbnRfc29jay5jbG9zZSgpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZGVidWcoJ0Vycm9yIHdoaWxlIGRpc2Nvbm5lY3RpbmcgUlBDIFBNMicsIGUuc3RhY2sgfHwgZSk7XG4gICAgcmV0dXJuIGNiKGUpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUubGF1bmNoQnVzID0gZnVuY3Rpb24gbGF1bmNoRXZlbnRTeXN0ZW0oY2IpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLnN1YiA9IGF4b24uc29ja2V0KCdzdWItZW1pdHRlcicsIG51bGwpO1xuICB0aGlzLnN1Yl9zb2NrID0gdGhpcy5zdWIuY29ubmVjdCh0aGlzLnB1Yl9zb2NrZXRfZmlsZSk7XG5cbiAgdGhpcy5zdWJfc29jay5vbmNlKCdjb25uZWN0JywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjYihudWxsLCBzZWxmLnN1Yiwgc2VsZi5zdWJfc29jayk7XG4gIH0pO1xufTtcblxuQ2xpZW50LnByb3RvdHlwZS5kaXNjb25uZWN0QnVzID0gZnVuY3Rpb24gZGlzY29ubmVjdEJ1cyhjYikge1xuICBpZiAoIWNiKSBjYiA9IG5vb3A7XG5cbiAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gIGlmICghdGhpcy5zdWJfc29jayB8fCAhdGhpcy5zdWJfc29jay5jbG9zZSkge1xuICAgIHRoYXQuc3ViID0gbnVsbDtcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICBjYihudWxsLCB7IG1zZzogJ2J1cyB3YXMgbm90IGNvbm5lY3RlZCcgfSk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAodGhpcy5zdWJfc29jay5jb25uZWN0ZWQgPT09IGZhbHNlIHx8XG4gICAgdGhpcy5zdWJfc29jay5jbG9zaW5nID09PSB0cnVlKSB7XG4gICAgdGhhdC5zdWIgPSBudWxsO1xuICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNiKG5ldyBFcnJvcignU1VCIGNvbm5lY3Rpb24gaXMgYWxyZWFkeSBiZWluZyBjbG9zZWQnKSk7XG4gICAgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIHZhciB0aW1lcjtcblxuICAgIHRoYXQuc3ViX3NvY2sub25jZSgnY2xvc2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGF0LnN1YiA9IG51bGw7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgZGVidWcoJ1BNMiBQVUIgY2xlYW5seSBjbG9zZWQnKTtcbiAgICAgIHJldHVybiBjYigpO1xuICAgIH0pO1xuXG4gICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGF0LnN1Yl9zb2NrLmRlc3Ryb3kpXG4gICAgICAgIHRoYXQuc3ViX3NvY2suZGVzdHJveSgpO1xuICAgICAgcmV0dXJuIGNiKCk7XG4gICAgfSwgMjAwKTtcblxuICAgIHRoaXMuc3ViX3NvY2suY2xvc2UoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBjYihlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBEZXNjcmlwdGlvblxuICogQG1ldGhvZCBnZXN0RXhwb3NlZE1ldGhvZHNcbiAqIEBwYXJhbSB7fSBjYlxuICogQHJldHVyblxuICovXG5DbGllbnQucHJvdG90eXBlLmdldEV4cG9zZWRNZXRob2RzID0gZnVuY3Rpb24gZ2V0RXhwb3NlZE1ldGhvZHMoY2IpIHtcbiAgdGhpcy5jbGllbnQubWV0aG9kcyhjYik7XG59O1xuXG4vKipcbiAqIERlc2NyaXB0aW9uXG4gKiBAbWV0aG9kIGV4ZWN1dGVSZW1vdGVcbiAqIEBwYXJhbSB7fSBtZXRob2RcbiAqIEBwYXJhbSB7fSBlbnZcbiAqIEBwYXJhbSB7fSBmblxuICogQHJldHVyblxuICovXG5DbGllbnQucHJvdG90eXBlLmV4ZWN1dGVSZW1vdGUgPSBmdW5jdGlvbiBleGVjdXRlUmVtb3RlKG1ldGhvZCwgYXBwX2NvbmYsIGZuKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICAvLyBzdG9wIHdhdGNoIG9uIHN0b3AgfCBlbnYgaXMgdGhlIHByb2Nlc3MgaWRcbiAgaWYgKG1ldGhvZC5pbmRleE9mKCdzdG9wJykgIT09IC0xKSB7XG4gICAgdGhpcy5zdG9wV2F0Y2gobWV0aG9kLCBhcHBfY29uZik7XG4gIH1cbiAgLy8gc3RvcCB3YXRjaGluZyB3aGVuIHByb2Nlc3MgaXMgZGVsZXRlZFxuICBlbHNlIGlmIChtZXRob2QuaW5kZXhPZignZGVsZXRlJykgIT09IC0xKSB7XG4gICAgdGhpcy5zdG9wV2F0Y2gobWV0aG9kLCBhcHBfY29uZik7XG4gIH1cbiAgLy8gc3RvcCBldmVyeXRoaW5nIG9uIGtpbGxcbiAgZWxzZSBpZiAobWV0aG9kLmluZGV4T2YoJ2tpbGwnKSAhPT0gLTEpIHtcbiAgICB0aGlzLnN0b3BXYXRjaCgnZGVsZXRlQWxsJywgYXBwX2NvbmYpO1xuICB9XG4gIGVsc2UgaWYgKG1ldGhvZC5pbmRleE9mKCdyZXN0YXJ0UHJvY2Vzc0lkJykgIT09IC0xICYmIHByb2Nlc3MuYXJndi5pbmRleE9mKCctLXdhdGNoJykgPiAtMSkge1xuICAgIGRlbGV0ZSBhcHBfY29uZi5lbnYuY3VycmVudF9jb25mLndhdGNoO1xuICAgIHRoaXMudG9nZ2xlV2F0Y2gobWV0aG9kLCBhcHBfY29uZik7XG4gIH1cblxuICBpZiAoIXRoaXMuY2xpZW50IHx8ICF0aGlzLmNsaWVudC5jYWxsKSB7XG4gICAgdGhpcy5zdGFydChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBpZiAoZm4pXG4gICAgICAgICAgcmV0dXJuIGZuKGVycm9yKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMCk7XG4gICAgICB9XG4gICAgICBpZiAoc2VsZi5jbGllbnQpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuY2xpZW50LmNhbGwobWV0aG9kLCBhcHBfY29uZiwgZm4pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGRlYnVnKCdDYWxsaW5nIGRhZW1vbiBtZXRob2QgcG0yOiVzIG9uIHJwYyBzb2NrZXQ6JXMnLCBtZXRob2QsIHRoaXMucnBjX3NvY2tldF9maWxlKTtcbiAgcmV0dXJuIHRoaXMuY2xpZW50LmNhbGwobWV0aG9kLCBhcHBfY29uZiwgZm4pO1xufTtcblxuQ2xpZW50LnByb3RvdHlwZS5ub3RpZnlHb2QgPSBmdW5jdGlvbiAoYWN0aW9uX25hbWUsIGlkLCBjYikge1xuICB0aGlzLmV4ZWN1dGVSZW1vdGUoJ25vdGlmeUJ5UHJvY2Vzc0lkJywge1xuICAgIGlkOiBpZCxcbiAgICBhY3Rpb25fbmFtZTogYWN0aW9uX25hbWUsXG4gICAgbWFudWFsbHk6IHRydWVcbiAgfSwgZnVuY3Rpb24gKCkge1xuICAgIGRlYnVnKCdHb2Qgbm90aWZpZWQnKTtcbiAgICByZXR1cm4gY2IgPyBjYigpIDogZmFsc2U7XG4gIH0pO1xufTtcblxuQ2xpZW50LnByb3RvdHlwZS5raWxsRGFlbW9uID0gZnVuY3Rpb24ga2lsbERhZW1vbihmbikge1xuICB2YXIgdGltZW91dDtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gIGZ1bmN0aW9uIHF1aXQoKSB7XG4gICAgdGhhdC5jbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZm4gPyBmbihudWxsLCB7IHN1Y2Nlc3M6IHRydWUgfSkgOiBmYWxzZTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIHVuZGVyIHVuaXgsIHdlIGxpc3RlbiBmb3Igc2lnbmFsICh0aGF0IGlzIHNlbmQgYnkgZGFlbW9uIHRvIG5vdGlmeSB1cyB0aGF0IGl0cyBzaHV0aW5nIGRvd24pXG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKSB7XG4gICAgcHJvY2Vzcy5vbmNlKCdTSUdRVUlUJywgZnVuY3Rpb24gKCkge1xuICAgICAgZGVidWcoJ1JlY2VpdmVkIFNJR1FVSVQgZnJvbSBwbTIgZGFlbW9uJyk7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICBxdWl0KCk7XG4gICAgfSk7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gaWYgdW5kZXIgd2luZG93cywgdHJ5IHRvIHBpbmcgdGhlIGRhZW1vbiB0byBzZWUgaWYgaXQgc3RpbGwgaGVyZVxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgdGhhdC5waW5nRGFlbW9uKGZ1bmN0aW9uIChhbGl2ZSkge1xuICAgICAgICBpZiAoIWFsaXZlKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgIHJldHVybiBxdWl0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIDI1MClcbiAgfVxuXG4gIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICBxdWl0KCk7XG4gIH0sIDMwMDApO1xuXG4gIC8vIEtpbGwgZGFlbW9uXG4gIHRoaXMuZXhlY3V0ZVJlbW90ZSgna2lsbE1lJywgeyBwaWQ6IHByb2Nlc3MucGlkIH0pO1xufTtcblxuXG4vKipcbiAqIERlc2NyaXB0aW9uXG4gKiBAbWV0aG9kIHRvZ2dsZVdhdGNoXG4gKiBAcGFyYW0ge1N0cmluZ30gcG0yIG1ldGhvZCBuYW1lXG4gKiBAcGFyYW0ge09iamVjdH0gYXBwbGljYXRpb24gZW52aXJvbm1lbnQsIHNob3VsZCBpbmNsdWRlIGlkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5DbGllbnQucHJvdG90eXBlLnRvZ2dsZVdhdGNoID0gZnVuY3Rpb24gdG9nZ2xlV2F0Y2gobWV0aG9kLCBlbnYsIGZuKSB7XG4gIGRlYnVnKCdDYWxsaW5nIHRvZ2dsZVdhdGNoJyk7XG4gIHRoaXMuY2xpZW50LmNhbGwoJ3RvZ2dsZVdhdGNoJywgbWV0aG9kLCBlbnYsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZm4gPyBmbigpIDogZmFsc2U7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBEZXNjcmlwdGlvblxuICogQG1ldGhvZCBzdGFydFdhdGNoXG4gKiBAcGFyYW0ge1N0cmluZ30gcG0yIG1ldGhvZCBuYW1lXG4gKiBAcGFyYW0ge09iamVjdH0gYXBwbGljYXRpb24gZW52aXJvbm1lbnQsIHNob3VsZCBpbmNsdWRlIGlkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5DbGllbnQucHJvdG90eXBlLnN0YXJ0V2F0Y2ggPSBmdW5jdGlvbiByZXN0YXJ0V2F0Y2gobWV0aG9kLCBlbnYsIGZuKSB7XG4gIGRlYnVnKCdDYWxsaW5nIHN0YXJ0V2F0Y2gnKTtcbiAgdGhpcy5jbGllbnQuY2FsbCgnc3RhcnRXYXRjaCcsIG1ldGhvZCwgZW52LCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZuID8gZm4oKSA6IGZhbHNlO1xuICB9KTtcbn07XG5cbi8qKlxuICogRGVzY3JpcHRpb25cbiAqIEBtZXRob2Qgc3RvcFdhdGNoXG4gKiBAcGFyYW0ge1N0cmluZ30gcG0yIG1ldGhvZCBuYW1lXG4gKiBAcGFyYW0ge09iamVjdH0gYXBwbGljYXRpb24gZW52aXJvbm1lbnQsIHNob3VsZCBpbmNsdWRlIGlkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5DbGllbnQucHJvdG90eXBlLnN0b3BXYXRjaCA9IGZ1bmN0aW9uIHN0b3BXYXRjaChtZXRob2QsIGVudiwgZm4pIHtcbiAgZGVidWcoJ0NhbGxpbmcgc3RvcFdhdGNoJyk7XG4gIHRoaXMuY2xpZW50LmNhbGwoJ3N0b3BXYXRjaCcsIG1ldGhvZCwgZW52LCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZuID8gZm4oKSA6IGZhbHNlO1xuICB9KTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUuZ2V0QWxsUHJvY2VzcyA9IGZ1bmN0aW9uIChjYikge1xuICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuXG4gIHRoaXMuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24gKGVyciwgcHJvY3MpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcignRXJyb3IgcmV0cmlldmluZyBwcm9jZXNzIGxpc3Q6ICcgKyBlcnIpO1xuICAgICAgcmV0dXJuIGNiKGVycik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNiKG51bGwsIHByb2NzKTtcbiAgfSk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmdldEFsbFByb2Nlc3NJZCA9IGZ1bmN0aW9uIChjYikge1xuICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuXG4gIHRoaXMuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24gKGVyciwgcHJvY3MpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcignRXJyb3IgcmV0cmlldmluZyBwcm9jZXNzIGxpc3Q6ICcgKyBlcnIpO1xuICAgICAgcmV0dXJuIGNiKGVycik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNiKG51bGwsIHByb2NzLm1hcChwcm9jID0+IHByb2MucG1faWQpKTtcbiAgfSk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmdldEFsbFByb2Nlc3NJZFdpdGhvdXRNb2R1bGVzID0gZnVuY3Rpb24gKGNiKSB7XG4gIHZhciBmb3VuZF9wcm9jID0gW107XG5cbiAgdGhpcy5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBwcm9jcykge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIENvbW1vbi5wcmludEVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICB9XG5cbiAgICB2YXIgcHJvY19pZHMgPSBwcm9jc1xuICAgICAgLmZpbHRlcihwcm9jID0+ICFwcm9jLnBtMl9lbnYucG14X21vZHVsZSlcbiAgICAgIC5tYXAocHJvYyA9PiBwcm9jLnBtX2lkKVxuXG4gICAgcmV0dXJuIGNiKG51bGwsIHByb2NfaWRzKTtcbiAgfSk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLmdldFByb2Nlc3NJZEJ5TmFtZSA9IGZ1bmN0aW9uIChuYW1lLCBmb3JjZV9hbGwsIGNiKSB7XG4gIHZhciBmb3VuZF9wcm9jID0gW107XG4gIHZhciBmdWxsX2RldGFpbHMgPSB7fTtcblxuICBpZiAodHlwZW9mIChjYikgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgY2IgPSBmb3JjZV9hbGw7XG4gICAgZm9yY2VfYWxsID0gZmFsc2U7XG4gIH1cblxuICBpZiAodHlwZW9mIChuYW1lKSA9PSAnbnVtYmVyJylcbiAgICBuYW1lID0gbmFtZS50b1N0cmluZygpO1xuXG4gIHRoaXMuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24gKGVyciwgbGlzdCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIENvbW1vbi5wcmludEVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICB9XG5cbiAgICBsaXN0LmZvckVhY2goZnVuY3Rpb24gKHByb2MpIHtcbiAgICAgIGlmIChwcm9jLnBtMl9lbnYubmFtZSA9PSBuYW1lIHx8IHByb2MucG0yX2Vudi5wbV9leGVjX3BhdGggPT0gcGF0aC5yZXNvbHZlKG5hbWUpKSB7XG4gICAgICAgIGZvdW5kX3Byb2MucHVzaChwcm9jLnBtX2lkKTtcbiAgICAgICAgZnVsbF9kZXRhaWxzW3Byb2MucG1faWRdID0gcHJvYztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBjYihudWxsLCBmb3VuZF9wcm9jLCBmdWxsX2RldGFpbHMpO1xuICB9KTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUuZ2V0UHJvY2Vzc0lkc0J5TmFtZXNwYWNlID0gZnVuY3Rpb24gKG5hbWVzcGFjZSwgZm9yY2VfYWxsLCBjYikge1xuICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuICB2YXIgZnVsbF9kZXRhaWxzID0ge307XG5cbiAgaWYgKHR5cGVvZiAoY2IpID09PSAndW5kZWZpbmVkJykge1xuICAgIGNiID0gZm9yY2VfYWxsO1xuICAgIGZvcmNlX2FsbCA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiAobmFtZXNwYWNlKSA9PSAnbnVtYmVyJylcbiAgICBuYW1lc3BhY2UgPSBuYW1lc3BhY2UudG9TdHJpbmcoKTtcblxuICB0aGlzLmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcignRXJyb3IgcmV0cmlldmluZyBwcm9jZXNzIGxpc3Q6ICcgKyBlcnIpO1xuICAgICAgcmV0dXJuIGNiKGVycik7XG4gICAgfVxuXG4gICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChwcm9jKSB7XG4gICAgICBpZiAocHJvYy5wbTJfZW52Lm5hbWVzcGFjZSA9PSBuYW1lc3BhY2UpIHtcbiAgICAgICAgZm91bmRfcHJvYy5wdXNoKHByb2MucG1faWQpO1xuICAgICAgICBmdWxsX2RldGFpbHNbcHJvYy5wbV9pZF0gPSBwcm9jO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNiKG51bGwsIGZvdW5kX3Byb2MsIGZ1bGxfZGV0YWlscyk7XG4gIH0pO1xufTtcblxuQ2xpZW50LnByb3RvdHlwZS5nZXRQcm9jZXNzQnlOYW1lID0gZnVuY3Rpb24gKG5hbWUsIGNiKSB7XG4gIHZhciBmb3VuZF9wcm9jID0gW107XG5cbiAgdGhpcy5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgaWYgKGVycikge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgIHJldHVybiBjYihlcnIpO1xuICAgIH1cblxuICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbiAocHJvYykge1xuICAgICAgaWYgKHByb2MucG0yX2Vudi5uYW1lID09IG5hbWUgfHxcbiAgICAgICAgcHJvYy5wbTJfZW52LnBtX2V4ZWNfcGF0aCA9PSBwYXRoLnJlc29sdmUobmFtZSkpIHtcbiAgICAgICAgZm91bmRfcHJvYy5wdXNoKHByb2MpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNiKG51bGwsIGZvdW5kX3Byb2MpO1xuICB9KTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUuZ2V0UHJvY2Vzc0J5TmFtZU9ySWQgPSBmdW5jdGlvbiAobmFtZU9ySWQsIGNiKSB7XG4gIHZhciBmb3VuZFByb2MgPSBbXTtcblxuICB0aGlzLmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcignRXJyb3IgcmV0cmlldmluZyBwcm9jZXNzIGxpc3Q6ICcgKyBlcnIpO1xuICAgICAgcmV0dXJuIGNiKGVycik7XG4gICAgfVxuXG4gICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChwcm9jKSB7XG4gICAgICBpZiAocHJvYy5wbTJfZW52Lm5hbWUgPT09IG5hbWVPcklkIHx8XG4gICAgICAgIHByb2MucG0yX2Vudi5wbV9leGVjX3BhdGggPT09IHBhdGgucmVzb2x2ZShuYW1lT3JJZCkgfHxcbiAgICAgICAgcHJvYy5waWQgPT09IHBhcnNlSW50KG5hbWVPcklkKSB8fFxuICAgICAgICBwcm9jLnBtMl9lbnYucG1faWQgPT09IHBhcnNlSW50KG5hbWVPcklkKSkge1xuICAgICAgICBmb3VuZFByb2MucHVzaChwcm9jKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBjYihudWxsLCBmb3VuZFByb2MpO1xuICB9KTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IENsaWVudDtcbiJdfQ==