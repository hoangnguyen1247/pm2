/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _commander = _interopRequireDefault(require("commander"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _eachLimit = _interopRequireDefault(require("async/eachLimit"));

var _series = _interopRequireDefault(require("async/series"));

var _debug = _interopRequireDefault(require("debug"));

var _util = _interopRequireDefault(require("util"));

var _chalk = _interopRequireDefault(require("chalk"));

var _fclone = _interopRequireDefault(require("fclone"));

var _Docker = _interopRequireDefault(require("./ExtraMgmt/Docker"));

var _constants = _interopRequireDefault(require("../../constants"));

var _Client = _interopRequireDefault(require("../Client"));

var _Common = _interopRequireDefault(require("../Common"));

var _InteractorClient = _interopRequireDefault(require("@pm2/agent/src/InteractorClient"));

var _Config = _interopRequireDefault(require("../tools/Config"));

var _Modularizer = _interopRequireDefault(require("./Modules/Modularizer"));

var _paths = _interopRequireDefault(require("../../paths"));

var _UX = _interopRequireDefault(require("./UX"));

var _package = _interopRequireDefault(require("../../package.json"));

var _flagExt = _interopRequireDefault(require("./Modules/flagExt"));

var _Configuration = _interopRequireDefault(require("../Configuration"));

var _semver = _interopRequireDefault(require("semver"));

var _sexec = _interopRequireDefault(require("../tools/sexec"));

var _crypto = _interopRequireDefault(require("crypto"));

var _json = _interopRequireDefault(require("../tools/json5"));

var _dayjs = _interopRequireDefault(require("dayjs"));

var _Extra = _interopRequireDefault(require("./Extra"));

var _Deploy = _interopRequireDefault(require("./Deploy"));

var _index = _interopRequireDefault(require("./Modules/index"));

var _link = _interopRequireDefault(require("./pm2-plus/link"));

var _processSelector = _interopRequireDefault(require("./pm2-plus/process-selector"));

var _helpers = _interopRequireDefault(require("./pm2-plus/helpers"));

var _Configuration2 = _interopRequireDefault(require("./Configuration"));

var _Version = _interopRequireDefault(require("./Version"));

var _Startup = _interopRequireDefault(require("./Startup"));

var _LogManagement = _interopRequireDefault(require("./LogManagement"));

var _Containerizer = _interopRequireDefault(require("./Containerizer"));

// import treeify from './tools/treeify'
//////////////////////////
// Load all API methods //
//////////////////////////
var debug = (0, _debug["default"])('pm2:cli');

var IMMUTABLE_MSG = _chalk["default"].bold.blue('Use --update-env to update environment variables');

var conf = _constants["default"];
/**
 * Main Function to be imported
 * can be aliased to PM2
 *
 * To use it when PM2 is installed as a module:
 *
 * var PM2 = require('pm2');
 *
 * var pm2 = PM2(<opts>);
 *
 *
 * @param {Object}  opts
 * @param {String}  [opts.cwd=<current>]         override pm2 cwd for starting scripts
 * @param {String}  [opts.pm2_home=[<paths.js>]] pm2 directory for log, pids, socket files
 * @param {Boolean} [opts.independent=false]     unique PM2 instance (random pm2_home)
 * @param {Boolean} [opts.daemon_mode=true]      should be called in the same process or not
 * @param {String}  [opts.public_key=null]       pm2 plus bucket public key
 * @param {String}  [opts.secret_key=null]       pm2 plus bucket secret key
 * @param {String}  [opts.machine_name=null]     pm2 plus instance name
 */

var API = /*#__PURE__*/function () {
  // in Containerizer.ts
  // in Extra.ts
  // in Deploy.ts
  // in Modules/index
  function API(opts) {
    var _this = this;

    (0, _classCallCheck2["default"])(this, API);
    (0, _defineProperty2["default"])(this, "daemon_mode", void 0);
    (0, _defineProperty2["default"])(this, "pm2_home", void 0);
    (0, _defineProperty2["default"])(this, "public_key", void 0);
    (0, _defineProperty2["default"])(this, "secret_key", void 0);
    (0, _defineProperty2["default"])(this, "machine_name", void 0);
    (0, _defineProperty2["default"])(this, "cwd", void 0);
    (0, _defineProperty2["default"])(this, "_conf", void 0);
    (0, _defineProperty2["default"])(this, "Client", void 0);
    (0, _defineProperty2["default"])(this, "pm2_configuration", void 0);
    (0, _defineProperty2["default"])(this, "gl_interact_infos", void 0);
    (0, _defineProperty2["default"])(this, "gl_is_km_linked", void 0);
    (0, _defineProperty2["default"])(this, "gl_retry", void 0);
    (0, _defineProperty2["default"])(this, "start_timer", void 0);
    (0, _defineProperty2["default"])(this, "killAgent", void 0);
    (0, _defineProperty2["default"])(this, "launchAll", void 0);
    (0, _defineProperty2["default"])(this, "getVersion", void 0);
    (0, _defineProperty2["default"])(this, "dump", void 0);
    (0, _defineProperty2["default"])(this, "resurrect", void 0);
    (0, _defineProperty2["default"])(this, "streamLogs", void 0);
    (0, _defineProperty2["default"])(this, "dockerMode", void 0);
    (0, _defineProperty2["default"])(this, "trigger", void 0);
    (0, _defineProperty2["default"])(this, "getPID", void 0);
    (0, _defineProperty2["default"])(this, "boilerplate", void 0);
    (0, _defineProperty2["default"])(this, "profile", void 0);
    (0, _defineProperty2["default"])(this, "inspect", void 0);
    (0, _defineProperty2["default"])(this, "sendSignalToProcessName", void 0);
    (0, _defineProperty2["default"])(this, "sendSignalToProcessId", void 0);
    (0, _defineProperty2["default"])(this, "ping", void 0);
    (0, _defineProperty2["default"])(this, "deploy", void 0);
    (0, _defineProperty2["default"])(this, "install", void 0);
    (0, _defineProperty2["default"])(this, "uninstall", void 0);
    (0, _defineProperty2["default"])(this, "update", function (cb) {
      _Common["default"].printOut('Be sure to have the latest version by doing `npm install pm2@latest -g` before doing this procedure.'); // Dump PM2 processes


      _this.Client.executeRemote('notifyKillPM2', {}, function () {});

      _this.getVersion(function (err, new_version) {
        // If not linked to PM2 plus, and update PM2 to latest, display motd.update
        if (!_this.gl_is_km_linked && !err && _package["default"].version != new_version) {
          var dt = _fs["default"].readFileSync(_path["default"].join(__dirname, _this._conf.PM2_UPDATE));

          console.log(dt.toString());
        }

        _this.dump(function (err) {
          debug('Dumping successfull', err);

          _this.killDaemon(function () {
            // debug('------------------ Everything killed', arguments as any);
            _this.Client.launchDaemon({
              interactor: false
            }, function (err, child) {
              _this.Client.launchRPC(function () {
                _this.resurrect(function () {
                  _Common["default"].printOut(_chalk["default"].blue.bold('>>>>>>>>>> PM2 updated'));

                  _this.launchAll(_this, function () {
                    _InteractorClient["default"].launchAndInteract(_this._conf, {
                      pm2_version: _package["default"].version
                    }, function (err, data, interactor_proc) {});

                    setTimeout(function () {
                      return cb ? cb(null, {
                        success: true
                      }) : _this.speedList();
                    }, 250);
                  });
                });
              });
            });
          });
        });
      });

      return false;
    });
    if (!opts) opts = {};
    this.daemon_mode = typeof opts.daemon_mode == 'undefined' ? true : opts.daemon_mode;
    this.pm2_home = conf.PM2_ROOT_PATH;
    this.public_key = conf.PUBLIC_KEY || opts.public_key || null;
    this.secret_key = conf.SECRET_KEY || opts.secret_key || null;
    this.machine_name = conf.MACHINE_NAME || opts.machine_name || null;
    /**
     * CWD resolution
     */

    this.cwd = process.cwd();

    if (opts.cwd) {
      this.cwd = _path["default"].resolve(opts.cwd);
    }
    /**
     * PM2 HOME resolution
     */


    if (opts.pm2_home && opts.independent == true) throw new Error('You cannot set a pm2_home and independent instance in same time');

    if (opts.pm2_home) {
      // Override default conf file
      this.pm2_home = opts.pm2_home;
      conf = _util["default"].inherits(conf, (0, _paths["default"])(this.pm2_home));
    } else if (opts.independent == true && conf.IS_WINDOWS === false) {
      // Create an unique pm2 instance
      var random_file = _crypto["default"].randomBytes(8).toString('hex');

      this.pm2_home = _path["default"].join('/tmp', random_file); // If we dont explicitly tell to have a daemon
      // It will go as in proc

      if (typeof opts.daemon_mode == 'undefined') this.daemon_mode = false;
      conf = _util["default"].inherits(conf, (0, _paths["default"])(this.pm2_home));
    }

    this._conf = conf;

    if (conf.IS_WINDOWS) {// Weird fix, may need to be dropped
      // @todo windows connoisseur double check
      // TODO: please check this
      // if (process.stdout._handle && process.stdout._handle.setBlocking)
      //   process.stdout._handle.setBlocking(true);
    }

    this.Client = new _Client["default"]({
      pm2_home: this.pm2_home,
      conf: this._conf,
      secret_key: this.secret_key,
      public_key: this.public_key,
      daemon_mode: this.daemon_mode,
      machine_name: this.machine_name
    });
    this.pm2_configuration = _Configuration["default"].getSync('pm2') || {};
    this.gl_interact_infos = null;
    this.gl_is_km_linked = false;

    try {
      var pid = _fs["default"].readFileSync(conf.INTERACTOR_PID_PATH);

      pid = parseInt(pid.toString().trim());
      process.kill(pid, 0);
      this.gl_is_km_linked = true;
    } catch (e) {
      this.gl_is_km_linked = false;
    } // For testing purposes


    if (this.secret_key && process.env.NODE_ENV == 'local_test') this.gl_is_km_linked = true;

    _InteractorClient["default"].ping(this._conf, function (err, result) {
      if (!err && result === true) {
        _fs["default"].readFile(conf.INTERACTION_CONF, function (err, _conf) {
          if (!err) {
            try {
              _this.gl_interact_infos = JSON.parse(_conf.toString());
            } catch (e) {
              try {
                _this.gl_interact_infos = _json["default"].parse(_conf.toString());
              } catch (e) {
                console.error(e);
                _this.gl_interact_infos = null;
              }
            }
          }
        });
      }
    });

    this.gl_retry = 0;
  }
  /**
   * Connect to PM2
   * Calling this command is now optional
   *
   * @param {Function} cb callback once pm2 is ready for commands
   */


  (0, _createClass2["default"])(API, [{
    key: "connect",
    value: function connect(noDaemon, cb) {
      var _this2 = this;

      this.start_timer = new Date();

      if (typeof cb == 'undefined') {
        cb = noDaemon;
        noDaemon = false;
      } else if (noDaemon === true) {
        // Backward compatibility with PM2 1.x
        this.Client.daemon_mode = false;
        this.daemon_mode = false;
      }

      this.Client.start(function (err, meta) {
        if (err) return cb(err);
        if (meta.new_pm2_instance == false && _this2.daemon_mode === true) return cb(err, meta); // If new pm2 instance has been popped
        // Lauch all modules

        _this2.launchAll(_this2, function (err_mod) {
          return cb(err, meta);
        });
      });
    }
    /**
     * Usefull when custom PM2 created with independent flag set to true
     * This will cleanup the newly created instance
     * by removing folder, killing PM2 and so on
     *
     * @param {Function} cb callback once cleanup is successfull
     */

  }, {
    key: "destroy",
    value: function destroy(cb) {
      debug('Killing and deleting current deamon');
      this.killDaemon(function () {
        var cmd = 'rm -rf ' + this.pm2_home;

        var test_path = _path["default"].join(this.pm2_home, 'module_conf.json');

        var test_path_2 = _path["default"].join(this.pm2_home, 'pm2.pid');

        if (this.pm2_home.indexOf('.pm2') > -1) return cb(new Error('Destroy is not a allowed method on .pm2'));

        _fs["default"].access(test_path, _fs["default"].constants.R_OK, function (err) {
          if (err) return cb(err);
          debug('Deleting temporary folder %s', this.pm2_home);
          (0, _sexec["default"])(cmd, cb);
        });
      });
    }
    /**
     * Disconnect from PM2 instance
     * This will allow your software to exit by itself
     *
     * @param {Function} [cb] optional callback once connection closed
     */

  }, {
    key: "disconnect",
    value: function disconnect(cb) {
      if (!cb) cb = function cb() {};
      this.Client.close(function (err, data) {
        // debug('The session lasted %ds', (new Date() - that.start_timer) / 1000);
        return cb(err, data);
      });
    }
  }, {
    key: "close",

    /**
     * Alias on disconnect
     * @param cb
     */
    value: function close(cb) {
      this.disconnect(cb);
    }
    /**
     * Launch modules
     *
     * @param {Function} cb callback once pm2 has launched modules
     */

  }, {
    key: "launchModules",
    value: function launchModules(cb) {
      this.launchAll(this, cb);
    }
    /**
     * Enable bus allowing to retrieve various process event
     * like logs, restarts, reloads
     *
     * @param {Function} cb callback called with 1st param err and 2nb param the bus
     */

  }, {
    key: "launchBus",
    value: function launchBus(cb) {
      this.Client.launchBus(cb);
    }
    /**
     * Exit methods for API
     * @param {Integer} code exit code for terminal
     */

  }, {
    key: "exitCli",
    value: function exitCli(code) {
      var _this3 = this;

      // Do nothing if PM2 called programmatically (also in speedlist)
      if (conf.PM2_PROGRAMMATIC && process.env.PM2_USAGE != 'CLI') return false;

      _InteractorClient["default"].disconnectRPC(function () {
        _this3.Client.close(function () {
          code = code || 0; // Safe exits process after all streams are drained.
          // file descriptor flag.

          var fds = 0; // exits process when stdout (1) and sdterr(2) are both drained.

          function tryToExit() {
            if (fds & 1 && fds & 2) {
              // debug('This command took %ds to execute', (new Date() - that.start_timer) / 1000);
              process.exit(code);
            }
          }

          [process.stdout, process.stderr].forEach(function (std) {
            var fd = std.fd;

            if (!std.bufferSize) {
              // bufferSize equals 0 means current stream is drained.
              fds = fds | fd;
            } else {
              // Appends nothing to the std queue, but will trigger `tryToExit` event on `drain`.
              std.write && std.write('', function () {
                fds = fds | fd;
                tryToExit();
              });
            } // Does not write anything more.


            delete std.write;
          });
          tryToExit();
        });
      });
    } ////////////////////////////
    // Application management //
    ////////////////////////////

    /**
     * Start a file or json with configuration
     * @param {Object||String} cmd script to start or json
     * @param {Function} cb called when application has been started
     */

  }, {
    key: "start",
    value: function start(cmd, opts, cb) {
      var _this4 = this;

      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }

      if (!opts) opts = {};

      if (_semver["default"].lt(process.version, '6.0.0')) {
        _Common["default"].printOut(conf.PREFIX_MSG_WARNING + 'Node 4 is deprecated, please upgrade to use pm2 to have all features');
      }

      if (_util["default"].isArray(opts.watch) && opts.watch.length === 0) opts.watch = (opts.rawArgs ? !!~opts.rawArgs.indexOf('--watch') : !!~process.argv.indexOf('--watch')) || false;

      if (_Common["default"].isConfigFile(cmd) || (0, _typeof2["default"])(cmd) === 'object') {
        this._startJson(cmd, opts, 'restartProcessId', function (err, procs) {
          return cb ? cb(err, procs) : _this4.speedList();
        });
      } else {
        this._startScript(cmd, opts, function (err, procs) {
          return cb ? cb(err, procs) : _this4.speedList(0);
        });
      }
    }
    /**
     * Reset process counters
     *
     * @method resetMetaProcess
     */

  }, {
    key: "reset",
    value: function reset(process_name, cb) {
      var _this5 = this;

      var processIds = function processIds(ids, cb) {
        (0, _eachLimit["default"])(ids, conf.CONCURRENT_ACTIONS, function (id, next) {
          _this5.Client.executeRemote('resetMetaProcessId', id, function (err, res) {
            if (err) console.error(err);

            _Common["default"].printOut(conf.PREFIX_MSG + 'Resetting meta for process id %d', id);

            return next();
          });
        }, function (err) {
          if (err) return cb(_Common["default"].retErr(err));
          return cb ? cb(null, {
            success: true
          }) : _this5.speedList();
        });
      };

      if (process_name == 'all') {
        this.Client.getAllProcessId(function (err, ids) {
          if (err) {
            _Common["default"].printError(err);

            return cb ? cb(_Common["default"].retErr(err)) : _this5.exitCli(conf.ERROR_EXIT);
          }

          return processIds(ids, cb);
        });
      } else if (isNaN(process_name)) {
        this.Client.getProcessIdByName(process_name, function (err, ids) {
          if (err) {
            _Common["default"].printError(err);

            return cb ? cb(_Common["default"].retErr(err)) : _this5.exitCli(conf.ERROR_EXIT);
          }

          if (ids.length === 0) {
            _Common["default"].printError('Unknown process name');

            return cb ? cb(new Error('Unknown process name')) : _this5.exitCli(conf.ERROR_EXIT);
          }

          return processIds(ids, cb);
        });
      } else {
        processIds([process_name], cb);
      }
    }
    /**
     * Update daemonized PM2 Daemon
     *
     * @param {Function} cb callback when pm2 has been upgraded
     */

  }, {
    key: "reload",

    /**
     * Reload an application
     *
     * @param {String} process_name Application Name or All
     * @param {Object} opts         Options
     * @param {Function} cb         Callback
     */
    value: function reload(process_name, opts, cb) {
      var _this6 = this;

      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }

      var delay = _Common["default"].lockReload();

      if (delay > 0 && opts.force != true) {
        _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Reload already in progress, please try again in ' + Math.floor((conf.RELOAD_LOCK_TIMEOUT - delay) / 1000) + ' seconds or use --force');

        return cb ? cb(new Error('Reload in progress')) : this.exitCli(conf.ERROR_EXIT);
      }

      if (_Common["default"].isConfigFile(process_name)) this._startJson(process_name, opts, 'reloadProcessId', function (err, apps) {
        _Common["default"].unlockReload();

        if (err) return cb ? cb(err) : _this6.exitCli(conf.ERROR_EXIT);
        return cb ? cb(null, apps) : _this6.exitCli(conf.SUCCESS_EXIT);
      });else {
        if (opts && opts.env) {
          var err = 'Using --env [env] without passing the ecosystem.config.js does not work';

          _Common["default"].err(err);

          _Common["default"].unlockReload();

          return cb ? cb(_Common["default"].retErr(err)) : this.exitCli(conf.ERROR_EXIT);
        }

        if (opts && !opts.updateEnv) _Common["default"].printOut(IMMUTABLE_MSG);

        this._operate('reloadProcessId', process_name, opts, function (err, apps) {
          _Common["default"].unlockReload();

          if (err) return cb ? cb(err) : this.exitCli(conf.ERROR_EXIT);
          return cb ? cb(null, apps) : this.exitCli(conf.SUCCESS_EXIT);
        });
      }
    }
    /**
     * Restart process
     *
     * @param {String} cmd   Application Name / Process id / JSON application file / 'all'
     * @param {Object} opts  Extra options to be updated
     * @param {Function} cb  Callback
     */

  }, {
    key: "restart",
    value: function restart(cmd, opts, cb) {
      var _this7 = this;

      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }

      if (typeof cmd === 'number') cmd = cmd.toString();

      if (cmd == "-") {
        // Restart from PIPED JSON
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', function (param) {
          process.stdin.pause();

          _this7.actionFromJson('restartProcessId', param, opts, 'pipe', cb);
        });
      } else if (_Common["default"].isConfigFile(cmd) || (0, _typeof2["default"])(cmd) === 'object') this._startJson(cmd, opts, 'restartProcessId', cb);else {
        if (opts && opts.env) {
          var err = 'Using --env [env] without passing the ecosystem.config.js does not work';

          _Common["default"].err(err);

          return cb ? cb(_Common["default"].retErr(err)) : this.exitCli(conf.ERROR_EXIT);
        }

        if (opts && !opts.updateEnv) _Common["default"].printOut(IMMUTABLE_MSG);

        this._operate('restartProcessId', cmd, opts, cb);
      }
    }
    /**
     * Delete process
     *
     * @param {String} process_name Application Name / Process id / Application file / 'all'
     * @param {Function} cb Callback
     */

  }, {
    key: "delete",
    value: function _delete(process_name, jsonVia, cb) {
      var _this8 = this;

      if (typeof jsonVia === "function") {
        cb = jsonVia;
        jsonVia = null;
      }

      if (typeof process_name === "number") {
        process_name = process_name.toString();
      }

      if (jsonVia == 'pipe') return this.actionFromJson('deleteProcessId', process_name, _commander["default"], 'pipe', function (err, procs) {
        return cb ? cb(err, procs) : _this8.speedList();
      });
      if (_Common["default"].isConfigFile(process_name)) return this.actionFromJson('deleteProcessId', process_name, _commander["default"], 'file', function (err, procs) {
        return cb ? cb(err, procs) : _this8.speedList();
      });else {
        this._operate('deleteProcessId', process_name, function (err, procs) {
          return cb ? cb(err, procs) : _this8.speedList();
        });
      }
    }
    /**
     * Stop process
     *
     * @param {String} process_name Application Name / Process id / Application file / 'all'
     * @param {Function} cb Callback
     */

  }, {
    key: "stop",
    value: function stop(process_name, cb) {
      var _this9 = this;

      if (typeof process_name === 'number') process_name = process_name.toString();

      if (process_name == "-") {
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', function (param) {
          process.stdin.pause();

          _this9.actionFromJson('stopProcessId', param, _commander["default"], 'pipe', function (err, procs) {
            return cb ? cb(err, procs) : _this9.speedList();
          });
        });
      } else if (_Common["default"].isConfigFile(process_name)) this.actionFromJson('stopProcessId', process_name, _commander["default"], 'file', function (err, procs) {
        return cb ? cb(err, procs) : _this9.speedList();
      });else this._operate('stopProcessId', process_name, function (err, procs) {
        return cb ? cb(err, procs) : _this9.speedList();
      });
    }
    /**
     * Get list of all processes managed
     *
     * @param {Function} cb Callback
     */

  }, {
    key: "list",
    value: function list(opts, cb) {
      var _this10 = this;

      if (typeof opts == 'function') {
        cb = opts;
        opts = null;
      }

      this.Client.executeRemote('getMonitorData', {}, function (err, list) {
        if (err) {
          _Common["default"].printError(err);

          return cb ? cb(_Common["default"].retErr(err)) : _this10.exitCli(conf.ERROR_EXIT);
        }

        if (opts && opts.rawArgs && opts.rawArgs.indexOf('--watch') > -1) {
          var show = function show() {
            process.stdout.write('\x1b[2J');
            process.stdout.write('\x1b[0f');
            console.log('Last refresh: ', (0, _dayjs["default"])().format());

            _this10.Client.executeRemote('getMonitorData', {}, function (err, list) {
              _UX["default"].list(list, null);
            });
          };

          show();
          setInterval(show, 900);
          return false;
        }

        return cb ? cb(null, list) : _this10.speedList(null);
      });
    }
    /**
     * Kill Daemon
     *
     * @param {Function} cb Callback
     */

  }, {
    key: "killDaemon",
    value: function killDaemon(cb) {
      var _this11 = this;

      process.env.PM2_STATUS = 'stopping';
      this.Client.executeRemote('notifyKillPM2', {}, function () {});

      _Common["default"].printOut(conf.PREFIX_MSG + '[v] Modules Stopped');

      this._operate('deleteProcessId', 'all', function (err, list) {
        _Common["default"].printOut(conf.PREFIX_MSG + '[v] All Applications Stopped');

        process.env.PM2_SILENT = 'false';

        _this11.killAgent(function (err, data) {
          if (!err) {
            _Common["default"].printOut(conf.PREFIX_MSG + '[v] Agent Stopped');
          }

          _this11.Client.killDaemon(function (err, res) {
            if (err) _Common["default"].printError(err);

            _Common["default"].printOut(conf.PREFIX_MSG + '[v] PM2 Daemon Stopped');

            return cb ? cb(err, res) : _this11.exitCli(conf.SUCCESS_EXIT);
          });
        });
      });
    }
  }, {
    key: "kill",
    value: function kill(cb) {
      this.killDaemon(cb);
    } /////////////////////
    // Private methods //
    /////////////////////

    /**
     * Method to START / RESTART a script
     *
     * @private
     * @param {string} script script name (will be resolved according to location)
     */

  }, {
    key: "_startScript",
    value: function _startScript(script, opts, cb) {
      var _this12 = this;

      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }
      /**
       * Commander.js tricks
       */


      var app_conf = _Config["default"].filterOptions(opts);

      var appConf = {};
      if (typeof app_conf.name == 'function') delete app_conf.name;
      delete app_conf.args; // Retrieve arguments via -- <args>

      var argsIndex;
      if (opts.rawArgs && (argsIndex = opts.rawArgs.indexOf('--')) >= 0) app_conf.args = opts.rawArgs.slice(argsIndex + 1);else if (opts.scriptArgs) app_conf.args = opts.scriptArgs;
      app_conf.script = script;
      if (!app_conf.namespace) app_conf.namespace = 'default';

      if ((appConf = _Common["default"].verifyConfs(app_conf)) instanceof Error) {
        _Common["default"].err(appConf);

        return cb ? cb(_Common["default"].retErr(appConf)) : this.exitCli(conf.ERROR_EXIT);
      }

      app_conf = appConf[0];

      if (opts.watchDelay) {
        if (typeof opts.watchDelay === "string" && opts.watchDelay.indexOf("ms") !== -1) app_conf.watch_delay = parseInt(opts.watchDelay);else {
          app_conf.watch_delay = parseFloat(opts.watchDelay) * 1000;
        }
      }

      var mas = [];
      if (typeof opts.ext != 'undefined') _flagExt["default"].make_available_extension(opts, mas); // for -e flag

      mas.length > 0 ? app_conf.ignore_watch = mas : 0;
      /**
       * If -w option, write configuration to configuration.json file
       */

      if (app_conf.write) {
        var dst_path = _path["default"].join(process.env.PWD || process.cwd(), app_conf.name + '-pm2.json');

        _Common["default"].printOut(conf.PREFIX_MSG + 'Writing configuration to', _chalk["default"].blue(dst_path)); // pretty JSON


        try {
          _fs["default"].writeFileSync(dst_path, JSON.stringify(app_conf, null, 2));
        } catch (e) {
          console.error(e.stack || e);
        }
      }
      /**
       * If start <app_name> start/restart application
       */


      var restartExistingProcessName = function restartExistingProcessName(cb) {
        if (!isNaN(script) || typeof script === 'string' && script.indexOf('/') != -1 || typeof script === 'string' && _path["default"].extname(script) !== '') return cb(null);

        _this12.Client.getProcessIdByName(script, function (err, ids) {
          if (err && cb) return cb(err);

          if (ids.length > 0) {
            _this12._operate('restartProcessId', script, opts, function (err, list) {
              if (err) return cb(err);

              _Common["default"].printOut(conf.PREFIX_MSG + 'Process successfully started');

              return cb(true, list);
            });
          } else return cb(null);
        });
      };
      /**
       * If start <namespace> start/restart namespace
       */


      function restartExistingNameSpace(cb) {
        var _this13 = this;

        if (!isNaN(script) || typeof script === 'string' && script.indexOf('/') != -1 || typeof script === 'string' && _path["default"].extname(script) !== '') return cb(null);

        if (script !== 'all') {
          this.Client.getProcessIdsByNamespace(script, function (err, ids) {
            if (err && cb) return cb(err);

            if (ids.length > 0) {
              _this13._operate('restartProcessId', script, opts, function (err, list) {
                if (err) return cb(err);

                _Common["default"].printOut(conf.PREFIX_MSG + 'Process successfully started');

                return cb(true, list);
              });
            } else return cb(null);
          });
        } else {
          this._operate('restartProcessId', 'all', function (err, list) {
            if (err) return cb(err);

            _Common["default"].printOut(conf.PREFIX_MSG + 'Process successfully started');

            return cb(true, list);
          });
        }
      }

      var restartExistingProcessId = function restartExistingProcessId(cb) {
        if (isNaN(script)) return cb(null);

        _this12._operate('restartProcessId', script, opts, function (err, list) {
          if (err) return cb(err);

          _Common["default"].printOut(conf.PREFIX_MSG + 'Process successfully started');

          return cb(true, list);
        });
      };
      /**
       * Restart a process with the same full path
       * Or start it
       */


      var restartExistingProcessPathOrStartNew = function restartExistingProcessPathOrStartNew(cb) {
        _this12.Client.executeRemote('getMonitorData', {}, function (err, procs) {
          if (err) return cb ? cb(new Error(err)) : _this12.exitCli(conf.ERROR_EXIT);

          var full_path = _path["default"].resolve(_this12.cwd, script);

          var managed_script = null;
          procs.forEach(function (proc) {
            if (proc.pm2_env.pm_exec_path == full_path && proc.pm2_env.name == app_conf.name) managed_script = proc;
          });

          if (managed_script && (managed_script.pm2_env.status == conf.STOPPED_STATUS || managed_script.pm2_env.status == conf.STOPPING_STATUS || managed_script.pm2_env.status == conf.ERRORED_STATUS)) {
            // Restart process if stopped
            var app_name = managed_script.pm2_env.name;

            _this12._operate('restartProcessId', app_name, opts, function (err, list) {
              if (err) return cb ? cb(new Error(err)) : _this12.exitCli(conf.ERROR_EXIT);

              _Common["default"].printOut(conf.PREFIX_MSG + 'Process successfully started');

              return cb(true, list);
            });

            return false;
          } else if (managed_script && !opts.force) {
            _Common["default"].err('Script already launched, add -f option to force re-execution');

            return cb(new Error('Script already launched'));
          }

          var resolved_paths = null;

          try {
            resolved_paths = _Common["default"].resolveAppAttributes({
              cwd: _this12.cwd,
              pm2_home: _this12.pm2_home
            }, app_conf);
          } catch (e) {
            _Common["default"].err(e.message);

            return cb(_Common["default"].retErr(e));
          }

          _Common["default"].printOut(conf.PREFIX_MSG + 'Starting %s in %s (%d instance' + (resolved_paths.instances > 1 ? 's' : '') + ')', resolved_paths.pm_exec_path, resolved_paths.exec_mode, resolved_paths.instances);

          if (!resolved_paths.env) resolved_paths.env = {}; // Set PM2 HOME in case of child process using PM2 API

          resolved_paths.env['PM2_HOME'] = _this12.pm2_home;

          var additional_env = _Modularizer["default"].getAdditionalConf(resolved_paths.name);

          _util["default"].inherits(resolved_paths.env, additional_env); // Is KM linked?


          resolved_paths.km_link = _this12.gl_is_km_linked;

          _this12.Client.executeRemote('prepare', resolved_paths, function (err, data) {
            if (err) {
              _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Error while launching application', err.stack || err);

              return cb(_Common["default"].retErr(err));
            }

            _Common["default"].printOut(conf.PREFIX_MSG + 'Done.');

            return cb(true, data);
          });

          return false;
        });
      };

      (0, _series["default"])([restartExistingProcessName, restartExistingNameSpace, restartExistingProcessId, restartExistingProcessPathOrStartNew], function (err, data) {
        if (err instanceof Error) return cb ? cb(err) : _this12.exitCli(conf.ERROR_EXIT);
        var ret = {};
        data.forEach(function (_dt) {
          if (_dt !== undefined) ret = _dt;
        });
        return cb ? cb(null, ret) : _this12.speedList();
      });
    }
    /**
     * Method to start/restart/reload processes from a JSON file
     * It will start app not started
     * Can receive only option to skip applications
     *
     * @private
     */

  }, {
    key: "_startJson",
    value: function _startJson(file, opts, action, pipe, cb) {
      var _this14 = this;

      var config = {};
      var appConf = [];
      var staticConf = [];
      var deployConf = {};
      var apps_info = [];
      /**
       * Get File configuration
       */

      if (typeof cb === 'undefined' && typeof pipe === 'function') {
        cb = pipe;
      }

      if ((0, _typeof2["default"])(file) === 'object') {
        config = file;
      } else if (pipe === 'pipe') {
        config = _Common["default"].parseConfig(file, 'pipe');
      } else {
        var data = null;

        var isAbsolute = _path["default"].isAbsolute(file);

        var file_path = isAbsolute ? file : _path["default"].join(this.cwd, file);
        debug('Resolved filepath %s', file_path);

        try {
          data = _fs["default"].readFileSync(file_path);
        } catch (e) {
          _Common["default"].printError(conf.PREFIX_MSG_ERR + 'File ' + file + ' not found');

          return cb ? cb(_Common["default"].retErr(e)) : this.exitCli(conf.ERROR_EXIT);
        }

        try {
          config = _Common["default"].parseConfig(data, file);
        } catch (e) {
          _Common["default"].printError(conf.PREFIX_MSG_ERR + 'File ' + file + ' malformated');

          console.error(e);
          return cb ? cb(_Common["default"].retErr(e)) : this.exitCli(conf.ERROR_EXIT);
        }
      }
      /**
       * Alias some optional fields
       */


      if (config.deploy) deployConf = config.deploy;
      if (config["static"]) staticConf = config["static"];
      if (config.apps) appConf = config.apps;else if (config.pm2) appConf = config.pm2;else appConf = config;
      if (!Array.isArray(appConf)) appConf = [appConf];
      if ((appConf = _Common["default"].verifyConfs(appConf)) instanceof Error) return cb ? cb(appConf) : this.exitCli(conf.ERROR_EXIT);
      process.env.PM2_JSON_PROCESSING = "true"; // Get App list

      var apps_name = [];
      var proc_list = {}; // Add statics to apps

      staticConf.forEach(function (serve) {
        appConf.push({
          name: serve.name ? serve.name : "static-page-server-".concat(serve.port),
          script: _path["default"].resolve(__dirname, 'API', 'Serve.js'),
          env: {
            PM2_SERVE_PORT: serve.port,
            PM2_SERVE_HOST: serve.host,
            PM2_SERVE_PATH: serve.path,
            PM2_SERVE_SPA: serve.spa,
            PM2_SERVE_DIRECTORY: serve.directory,
            PM2_SERVE_BASIC_AUTH: serve.basic_auth !== undefined,
            PM2_SERVE_BASIC_AUTH_USERNAME: serve.basic_auth ? serve.basic_auth.username : null,
            PM2_SERVE_BASIC_AUTH_PASSWORD: serve.basic_auth ? serve.basic_auth.password : null,
            PM2_SERVE_MONITOR: serve.monitor
          }
        });
      }); // Here we pick only the field we want from the CLI when starting a JSON

      appConf.forEach(function (app) {
        if (!app.env) {
          app.env = {};
        }

        app.env.io = app.io; // --only <app>

        if (opts.only) {
          var apps = opts.only.split(/,| /);
          if (apps.indexOf(app.name) == -1) return false;
        } // Namespace


        if (!app.namespace) {
          if (opts.namespace) app.namespace = opts.namespace;else app.namespace = 'default';
        } // --watch


        if (!app.watch && opts.watch && opts.watch === true) app.watch = true; // --ignore-watch

        if (!app.ignore_watch && opts.ignore_watch) app.ignore_watch = opts.ignore_watch;
        if (opts.install_url) app.install_url = opts.install_url; // --instances <nb>

        if (opts.instances && typeof opts.instances === 'number') app.instances = opts.instances; // --uid <user>

        if (opts.uid) app.uid = opts.uid; // --gid <user>

        if (opts.gid) app.gid = opts.gid; // Specific

        if (app.append_env_to_name && opts.env) app.name += '-' + opts.env;
        if (opts.name_prefix && app.name.indexOf(opts.name_prefix) == -1) app.name = "".concat(opts.name_prefix, ":").concat(app.name);
        app.username = _Common["default"].getCurrentUsername();
        apps_name.push(app.name);
      });
      this.Client.executeRemote('getMonitorData', {}, function (err, raw_proc_list) {
        if (err) {
          _Common["default"].printError(err);

          return cb ? cb(_Common["default"].retErr(err)) : _this14.exitCli(conf.ERROR_EXIT);
        }
        /**
         * Uniquify in memory process list
         */


        raw_proc_list.forEach(function (proc) {
          proc_list[proc.name] = proc;
        });
        /**
         * Auto detect application already started
         * and act on them depending on action
         */

        (0, _eachLimit["default"])(Object.keys(proc_list), conf.CONCURRENT_ACTIONS, function (proc_name, next) {
          // Skip app name (--only option)
          if (apps_name.indexOf(proc_name) == -1) return next();
          if (!(action == 'reloadProcessId' || action == 'softReloadProcessId' || action == 'restartProcessId')) throw new Error('Wrong action called');
          var apps = appConf.filter(function (app) {
            return app.name == proc_name;
          });
          var envs = apps.map(function (app) {
            // Binds env_diff to env and returns it.
            return _Common["default"].mergeEnvironmentVariables(app, opts.env, deployConf);
          }); // Assigns own enumerable properties of all
          // Notice: if people use the same name in different apps,
          //         duplicated envs will be overrode by the last one

          var env = envs.reduce(function (e1, e2) {
            return _util["default"].inherits(e1, e2);
          }); // When we are processing JSON, allow to keep the new env by default

          env.updateEnv = true; // Pass `env` option

          _this14._operate(action, proc_name, env, function (err, ret) {
            if (err) _Common["default"].printError(err); // For return

            apps_info = apps_info.concat(ret);

            _this14.Client.notifyGod(action, proc_name); // And Remove from array to spy


            apps_name.splice(apps_name.indexOf(proc_name), 1);
            return next();
          });
        }, function (err) {
          if (err) return cb ? cb(_Common["default"].retErr(err)) : _this14.exitCli(conf.ERROR_EXIT);
          if (apps_name.length > 0 && action != 'start') _Common["default"].printOut(conf.PREFIX_MSG_WARNING + 'Applications %s not running, starting...', apps_name.join(', ')); // Start missing apps

          return startApps(apps_name, function (err, apps) {
            apps_info = apps_info.concat(apps);
            return cb ? cb(err, apps_info) : this.speedList(err ? 1 : 0);
          });
        });
        return false;
      });

      function startApps(app_name_to_start, cb) {
        var _this15 = this;

        var apps_to_start = [];
        var apps_started = [];
        var apps_errored = [];
        appConf.forEach(function (app, i) {
          if (app_name_to_start.indexOf(app.name) != -1) {
            apps_to_start.push(appConf[i]);
          }
        });
        (0, _eachLimit["default"])(apps_to_start, conf.CONCURRENT_ACTIONS, function (app, next) {
          if (opts.cwd) app.cwd = opts.cwd;
          if (opts.force_name) app.name = opts.force_name;
          if (opts.started_as_module) app.pmx_module = true;
          var resolved_paths = null; // hardcode script name to use `serve` feature inside a process file

          if (app.script === 'serve') {
            app.script = _path["default"].resolve(__dirname, 'API', 'Serve.js');
          }

          try {
            resolved_paths = _Common["default"].resolveAppAttributes({
              cwd: _this15.cwd,
              pm2_home: _this15.pm2_home
            }, app);
          } catch (e) {
            apps_errored.push(e);

            _Common["default"].err("Error: ".concat(e.message));

            return next();
          }

          if (!resolved_paths.env) resolved_paths.env = {}; // Set PM2 HOME in case of child process using PM2 API

          resolved_paths.env['PM2_HOME'] = _this15.pm2_home;

          var additional_env = _Modularizer["default"].getAdditionalConf(resolved_paths.name);

          _util["default"].inherits(resolved_paths.env, additional_env);

          resolved_paths.env = _Common["default"].mergeEnvironmentVariables(resolved_paths, opts.env, deployConf);
          delete resolved_paths.env.current_conf; // Is KM linked?

          resolved_paths.km_link = _this15.gl_is_km_linked;

          if (resolved_paths.wait_ready) {
            _Common["default"].warn("App ".concat(resolved_paths.name, " has option 'wait_ready' set, waiting for app to be ready..."));
          }

          _this15.Client.executeRemote('prepare', resolved_paths, function (err, data) {
            if (err) {
              _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Process failed to launch %s', err.message ? err.message : err);

              return next();
            }

            if (data.length === 0) {
              _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Process config loading failed', data);

              return next();
            }

            _Common["default"].printOut(conf.PREFIX_MSG + 'App [%s] launched (%d instances)', data[0].pm2_env.name, data.length);

            apps_started = apps_started.concat(data);
            next();
          });
        }, function (err) {
          var final_error = err || apps_errored.length > 0 ? apps_errored : null;
          return cb ? cb(final_error, apps_started) : _this15.speedList();
        });
        return false;
      }
    }
    /**
     * Apply a RPC method on the json file
     * @private
     * @method actionFromJson
     * @param {string} action RPC Method
     * @param {object} options
     * @param {string|object} file file
     * @param {string} jsonVia action type (=only 'pipe' ?)
     * @param {Function}
     */

  }, {
    key: "actionFromJson",
    value: function actionFromJson(action, file, opts, jsonVia, cb) {
      var _this16 = this;

      var appConf = {};
      var ret_processes = []; //accept programmatic calls

      if ((0, _typeof2["default"])(file) == 'object') {
        cb = typeof jsonVia == 'function' ? jsonVia : cb;
        appConf = file;
      } else if (jsonVia == 'file') {
        var data = null;

        try {
          data = _fs["default"].readFileSync(file);
        } catch (e) {
          _Common["default"].printError(conf.PREFIX_MSG_ERR + 'File ' + file + ' not found');

          return cb ? cb(_Common["default"].retErr(e)) : this.exitCli(conf.ERROR_EXIT);
        }

        try {
          appConf = _Common["default"].parseConfig(data, file);
        } catch (e) {
          _Common["default"].printError(conf.PREFIX_MSG_ERR + 'File ' + file + ' malformated');

          console.error(e);
          return cb ? cb(_Common["default"].retErr(e)) : this.exitCli(conf.ERROR_EXIT);
        }
      } else if (jsonVia == 'pipe') {
        appConf = _Common["default"].parseConfig(file, 'pipe');
      } else {
        _Common["default"].printError('Bad call to actionFromJson, jsonVia should be one of file, pipe');

        return this.exitCli(conf.ERROR_EXIT);
      } // Backward compatibility


      if (appConf.apps) appConf = appConf.apps;
      if (!Array.isArray(appConf)) appConf = [appConf];
      if ((appConf = _Common["default"].verifyConfs(appConf)) instanceof Error) return cb ? cb(appConf) : this.exitCli(conf.ERROR_EXIT);
      (0, _eachLimit["default"])(appConf, conf.CONCURRENT_ACTIONS, function (proc, next1) {
        var name = '';
        var new_env;
        if (!proc.name) name = _path["default"].basename(proc.script);else name = proc.name;
        if (opts.only && opts.only != name) return process.nextTick(next1);
        if (opts && opts.env) new_env = _Common["default"].mergeEnvironmentVariables(proc, opts.env);else new_env = _Common["default"].mergeEnvironmentVariables(proc);

        _this16.Client.getProcessIdByName(name, function (err, ids) {
          if (err) {
            _Common["default"].printError(err);

            return next1();
          }

          if (!ids) return next1();
          (0, _eachLimit["default"])(ids, conf.CONCURRENT_ACTIONS, function (id, next2) {
            var opts = {}; //stopProcessId could accept options to?

            if (action == 'restartProcessId') {
              opts = {
                id: id,
                env: new_env
              };
            } else {
              opts = id;
            }

            _this16.Client.executeRemote(action, opts, function (err, res) {
              ret_processes.push(res);

              if (err) {
                _Common["default"].printError(err);

                return next2();
              }

              if (action == 'restartProcessId') {
                _this16.Client.notifyGod('restart', id);
              } else if (action == 'deleteProcessId') {
                _this16.Client.notifyGod('delete', id);
              } else if (action == 'stopProcessId') {
                _this16.Client.notifyGod('stop', id);
              }

              _Common["default"].printOut(conf.PREFIX_MSG + "[%s](%d) \u2713", name, id);

              return next2();
            });
          }, function (err) {
            return next1(null, ret_processes);
          });
        });
      }, function (err) {
        if (cb) return cb(null, ret_processes);else return _this16.speedList();
      });
    }
    /**
     * Main function to operate with PM2 daemon
     *
     * @param {String} action_name  Name of action (restartProcessId, deleteProcessId, stopProcessId)
     * @param {String} process_name can be 'all', a id integer or process name
     * @param {Object} envs         object with CLI options / environment
     */

  }, {
    key: "_operate",
    value: function _operate(action_name, process_name, envs, cb) {
      var _this17 = this;

      var update_env = false;
      var ret = []; // Make sure all options exist

      if (!envs) envs = {};

      if (typeof envs == 'function') {
        cb = envs;
        envs = {};
      } // Set via env.update (JSON processing)


      if (envs.updateEnv === true) update_env = true;
      var concurrent_actions = envs.parallel || conf.CONCURRENT_ACTIONS;

      if (!process.env.PM2_JSON_PROCESSING || envs.commands) {
        envs = this._handleAttributeUpdate(envs);
      }
      /**
       * Set current updated configuration if not passed
       */


      if (!envs.current_conf) {
        var _conf = (0, _fclone["default"])(envs);

        envs = {
          current_conf: _conf
        }; // Is KM linked?

        envs.current_conf.km_link = this.gl_is_km_linked;
      }
      /**
       * Operate action on specific process id
       */


      var processIds = function processIds(ids, cb) {
        _Common["default"].printOut(conf.PREFIX_MSG + 'Applying action %s on app [%s](ids: %s)', action_name, process_name, ids);

        if (ids.length <= 2) concurrent_actions = 1;
        if (action_name == 'deleteProcessId') concurrent_actions = 10;
        (0, _eachLimit["default"])(ids, concurrent_actions, function (id, next) {
          var opts; // These functions need extra param to be passed

          if (action_name == 'restartProcessId' || action_name == 'reloadProcessId' || action_name == 'softReloadProcessId') {
            var new_env = {};

            if (update_env === true) {
              if (conf.PM2_PROGRAMMATIC == true) new_env = _Common["default"].safeExtend({}, process.env);else new_env = _util["default"].inherits({}, process.env);
              Object.keys(envs).forEach(function (k) {
                new_env[k] = envs[k];
              });
            } else {
              new_env = envs;
            }

            opts = {
              id: id,
              env: new_env
            };
          } else {
            opts = id;
          }

          _this17.Client.executeRemote(action_name, opts, function (err, res) {
            if (err) {
              _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Process %s not found', id);

              return next("Process ".concat(id, " not found"));
            }

            if (action_name == 'restartProcessId') {
              _this17.Client.notifyGod('restart', id);
            } else if (action_name == 'deleteProcessId') {
              _this17.Client.notifyGod('delete', id);
            } else if (action_name == 'stopProcessId') {
              _this17.Client.notifyGod('stop', id);
            } else if (action_name == 'reloadProcessId') {
              _this17.Client.notifyGod('reload', id);
            } else if (action_name == 'softReloadProcessId') {
              _this17.Client.notifyGod('graceful reload', id);
            }

            if (!Array.isArray(res)) res = [res]; // Filter return

            res.forEach(function (proc) {
              _Common["default"].printOut(conf.PREFIX_MSG + "[%s](%d) \u2713", proc.pm2_env ? proc.pm2_env.name : process_name, id);

              if (action_name == 'stopProcessId' && proc.pm2_env && proc.pm2_env.cron_restart) {
                _Common["default"].warn("App ".concat(_chalk["default"].bold(proc.pm2_env.name), " stopped but CRON RESTART is still UP ").concat(proc.pm2_env.cron_restart));
              }

              if (!proc.pm2_env) return false;
              ret.push({
                name: proc.pm2_env.name,
                namespace: proc.pm2_env.namespace,
                pm_id: proc.pm2_env.pm_id,
                status: proc.pm2_env.status,
                restart_time: proc.pm2_env.restart_time,
                pm2_env: {
                  name: proc.pm2_env.name,
                  namespace: proc.pm2_env.namespace,
                  pm_id: proc.pm2_env.pm_id,
                  status: proc.pm2_env.status,
                  restart_time: proc.pm2_env.restart_time,
                  env: proc.pm2_env.env
                }
              });
            });
            return next();
          });
        }, function (err) {
          if (err) return cb ? cb(_Common["default"].retErr(err)) : _this17.exitCli(conf.ERROR_EXIT);
          return cb ? cb(null, ret) : _this17.speedList();
        });
      };

      if (process_name == 'all') {
        // When using shortcuts like 'all', do not delete modules
        var fn;
        if (process.env.PM2_STATUS == 'stopping') this.Client.getAllProcessId(function (err, ids) {
          reoperate(err, ids);
        });else this.Client.getAllProcessIdWithoutModules(function (err, ids) {
          reoperate(err, ids);
        });

        var reoperate = function reoperate(err, ids) {
          if (err) {
            _Common["default"].printError(err);

            return cb ? cb(_Common["default"].retErr(err)) : _this17.exitCli(conf.ERROR_EXIT);
          }

          if (!ids || ids.length === 0) {
            _Common["default"].printError(conf.PREFIX_MSG_WARNING + 'No process found');

            return cb ? cb(new Error('process name not found')) : _this17.exitCli(conf.ERROR_EXIT);
          }

          return processIds(ids, cb);
        };
      } // operate using regex
      else if (isNaN(process_name) && process_name[0] === '/' && process_name[process_name.length - 1] === '/') {
          var regex = new RegExp(process_name.replace(/\//g, ''));
          this.Client.executeRemote('getMonitorData', {}, function (err, list) {
            if (err) {
              _Common["default"].printError('Error retrieving process list: ' + err);

              return cb(err);
            }

            var found_proc = [];
            list.forEach(function (proc) {
              if (regex.test(proc.pm2_env.name)) {
                found_proc.push(proc.pm_id);
              }
            });

            if (found_proc.length === 0) {
              _Common["default"].printError(conf.PREFIX_MSG_WARNING + 'No process found');

              return cb ? cb(new Error('process name not found')) : _this17.exitCli(conf.ERROR_EXIT);
            }

            return processIds(found_proc, cb);
          });
        } else if (isNaN(process_name)) {
          /**
           * We can not stop or delete a module but we can restart it
           * to refresh configuration variable
           */
          var allow_module_restart = action_name == 'restartProcessId' ? true : false;
          this.Client.getProcessIdByName(process_name, allow_module_restart, function (err, ids) {
            if (err) {
              _Common["default"].printError(err);

              return cb ? cb(_Common["default"].retErr(err)) : _this17.exitCli(conf.ERROR_EXIT);
            }

            if (ids && ids.length > 0) {
              /**
              * Determine if the process to restart is a module
              * if yes load configuration variables and merge with the current environment
              */
              var additional_env = _Modularizer["default"].getAdditionalConf(process_name);

              _util["default"].inherits(envs, additional_env);

              return processIds(ids, cb);
            }

            _this17.Client.getProcessIdsByNamespace(process_name, allow_module_restart, function (err, ns_process_ids) {
              if (err) {
                _Common["default"].printError(err);

                return cb ? cb(_Common["default"].retErr(err)) : _this17.exitCli(conf.ERROR_EXIT);
              }

              if (!ns_process_ids || ns_process_ids.length === 0) {
                _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Process or Namespace %s not found', process_name);

                return cb ? cb(new Error('process or namespace not found')) : _this17.exitCli(conf.ERROR_EXIT);
              }
              /**
               * Determine if the process to restart is a module
               * if yes load configuration variables and merge with the current environment
               */


              var ns_additional_env = _Modularizer["default"].getAdditionalConf(process_name);

              _util["default"].inherits(envs, ns_additional_env);

              return processIds(ns_process_ids, cb);
            });
          });
        } else {
          if (this.pm2_configuration.docker == "true" || this.pm2_configuration.docker == true) {
            // Docker/Systemd process interaction detection
            this.Client.executeRemote('getMonitorData', {}, function (err, proc_list) {
              var higher_id = 0;
              proc_list.forEach(function (p) {
                p.pm_id > higher_id ? higher_id = p.pm_id : null;
              }); // Is Docker/Systemd

              if (process_name > higher_id) return _Docker["default"].processCommand(_this17, higher_id, process_name, action_name, function (err) {
                if (err) {
                  _Common["default"].printError(conf.PREFIX_MSG_ERR + (err.message ? err.message : err));

                  return cb ? cb(_Common["default"].retErr(err)) : _this17.exitCli(conf.ERROR_EXIT);
                }

                return cb ? cb(null, ret) : _this17.speedList();
              }); // Check if application name as number is an app name

              _this17.Client.getProcessIdByName(process_name, function (err, ids) {
                if (ids.length > 0) return processIds(ids, cb); // Check if application name as number is an namespace

                _this17.Client.getProcessIdsByNamespace(process_name, function (err, ns_process_ids) {
                  if (ns_process_ids.length > 0) return processIds(ns_process_ids, cb); // Else operate on pm id

                  return processIds([process_name], cb);
                });
              });
            });
          } else {
            // Check if application name as number is an app name
            this.Client.getProcessIdByName(process_name, function (err, ids) {
              if (ids.length > 0) return processIds(ids, cb); // Check if application name as number is an namespace

              _this17.Client.getProcessIdsByNamespace(process_name, function (err, ns_process_ids) {
                if (ns_process_ids.length > 0) return processIds(ns_process_ids, cb); // Else operate on pm id

                return processIds([process_name], cb);
              });
            });
          }
        }
    }
    /**
     * Converts CamelCase Commander.js arguments
     * to Underscore
     * (nodeArgs -> node_args)
     */

  }, {
    key: "_handleAttributeUpdate",
    value: function _handleAttributeUpdate(opts) {
      var conf = _Config["default"].filterOptions(opts);

      if (typeof conf.name != 'string') delete conf.name;
      var argsIndex = 0;

      if (opts.rawArgs && (argsIndex = opts.rawArgs.indexOf('--')) >= 0) {
        conf.args = opts.rawArgs.slice(argsIndex + 1);
      }

      var appConf = _Common["default"].verifyConfs(conf)[0];

      if (appConf instanceof Error) {
        _Common["default"].printError('Error while transforming CamelCase args to underscore');

        return appConf;
      }

      if (argsIndex == -1) delete appConf.args;
      if (appConf.name == 'undefined') delete appConf.name;
      delete appConf.exec_mode;

      if (_util["default"].isArray(appConf.watch) && appConf.watch.length === 0) {
        if (!~opts.rawArgs.indexOf('--watch')) delete appConf.watch;
      } // Options set via environment variables


      if (process.env.PM2_DEEP_MONITORING) appConf.deep_monitoring = true; // Force deletion of defaults values set by commander
      // to avoid overriding specified configuration by user

      if (appConf.treekill === true) delete appConf.treekill;
      if (appConf.pmx === true) delete appConf.pmx;
      if (appConf.vizion === true) delete appConf.vizion;
      if (appConf.automation === true) delete appConf.automation;
      if (appConf.autorestart === true) delete appConf.autorestart;
      return appConf;
    }
  }, {
    key: "getProcessIdByName",
    value: function getProcessIdByName(name, cb) {
      var _this18 = this;

      this.Client.getProcessIdByName(name, function (err, id) {
        if (err) {
          _Common["default"].printError(err);

          return cb ? cb(_Common["default"].retErr(err)) : _this18.exitCli(conf.ERROR_EXIT);
        }

        console.log(id);
        return cb ? cb(null, id) : _this18.exitCli(conf.SUCCESS_EXIT);
      });
    }
    /**
     * Description
     * @method jlist
     * @param {} debug
     * @return
     */

  }, {
    key: "jlist",
    value: function jlist(debug) {
      var _this19 = this;

      this.Client.executeRemote('getMonitorData', {}, function (err, list) {
        if (err) {
          _Common["default"].printError(err);

          return _this19.exitCli(conf.ERROR_EXIT);
        }

        if (debug) {
          process.stdout.write(_util["default"].inspect(list, false, null, false));
        } else {
          process.stdout.write(JSON.stringify(list));
        }

        _this19.exitCli(conf.SUCCESS_EXIT);
      });
    }
    /**
     * Display system information
     * @method slist
     * @return
     */

  }, {
    key: "slist",
    value: function slist(tree) {
      var _this20 = this;

      this.Client.executeRemote('getSystemData', {}, function (err, sys_infos) {
        if (err) {
          _Common["default"].err(err);

          return _this20.exitCli(conf.ERROR_EXIT);
        }

        if (tree === true) {// console.log(treeify.asTree(sys_infos, true))
        } else process.stdout.write(_util["default"].inspect(sys_infos, false, null, false));

        _this20.exitCli(conf.SUCCESS_EXIT);
      });
    }
    /**
     * Description
     * @method speedList
     * @return
     */

  }, {
    key: "speedList",
    value: function speedList(code, apps_acted) {
      var _this21 = this;

      var systemdata = null;
      var acted = [];

      if (code != 0 && code != null) {
        return this.exitCli(code ? code : conf.SUCCESS_EXIT);
      }

      if (apps_acted && apps_acted.length > 0) {
        apps_acted.forEach(function (proc) {
          acted.push(proc.pm2_env ? proc.pm2_env.pm_id : proc.pm_id);
        });
      }

      var doList = function doList(err, list, sys_infos) {
        if (err) {
          if (_this21.gl_retry == 0) {
            _this21.gl_retry += 1;
            return setTimeout(_this21.speedList.bind(_this21), 1400);
          }

          console.error('Error retrieving process list: %s.\nA process seems to be on infinite loop, retry in 5 seconds', err);
          return _this21.exitCli(conf.ERROR_EXIT);
        }

        if (process.stdout.isTTY === false) {
          _UX["default"].list_min(list);
        } else if (_commander["default"].miniList && !_commander["default"].silent) _UX["default"].list_min(list);else if (!_commander["default"].silent) {
          if (_this21.gl_interact_infos) {
            var dashboard_url = "https://app.pm2.io/#/r/".concat(_this21.gl_interact_infos.public_key);

            if (_this21.gl_interact_infos.info_node != 'https://root.keymetrics.io') {
              dashboard_url = "".concat(_this21.gl_interact_infos.info_node, "/#/r/").concat(_this21.gl_interact_infos.public_key);
            }

            _Common["default"].printOut('%s PM2+ activated | Instance Name: %s | Dash: %s', _chalk["default"].green.bold('⇆'), _chalk["default"].bold(_this21.gl_interact_infos.machine_name), _chalk["default"].bold(dashboard_url));
          }

          _UX["default"].list(list, sys_infos); //Common.printOut(chalk.white.italic(' Use `pm2 show <id|name>` to get more details about an app'));

        }

        if (_this21.Client.daemon_mode == false) {
          _Common["default"].printOut('[--no-daemon] Continue to stream logs');

          _Common["default"].printOut('[--no-daemon] Exit on target PM2 exit pid=' + _fs["default"].readFileSync(conf.PM2_PID_FILE_PATH).toString());

          global["_auto_exit"] = true;
          return _this21.streamLogs('all', 0, false, 'HH:mm:ss', false);
        } // if (process.stdout.isTTY) if looking for start logs
        else if (!process.env.TRAVIS && process.env.NODE_ENV != 'test' && acted.length > 0 && _commander["default"].attach === true) {
            _Common["default"].info("Log streaming apps id: ".concat(_chalk["default"].cyan(acted.join(' ')), ", exit with Ctrl-C or will exit in 10secs")); // setTimeout(() => {
            //   Common.info(`Log streaming exited automatically, run 'pm2 logs' to continue watching logs`)
            //   return that.exitCli(code ? code : conf.SUCCESS_EXIT);
            // }, 10000)


            return acted.forEach(function (proc_name) {
              _this21.streamLogs(proc_name, 0, false, null, false);
            });
          } else {
            return _this21.exitCli(code ? code : conf.SUCCESS_EXIT);
          }
      }; // Do nothing if PM2 called programmatically and not called from CLI (also in exitCli)


      if (conf.PM2_PROGRAMMATIC && process.env.PM2_USAGE != 'CLI') {
        return false;
      } else {
        return this.Client.executeRemote('getSystemData', {}, function (err, sys_infos) {
          _this21.Client.executeRemote('getMonitorData', {}, function (err, proc_list) {
            doList(err, proc_list, sys_infos);
          });
        });
      }
    }
    /**
     * Scale up/down a process
     * @method scale
     */

  }, {
    key: "scale",
    value: function scale(app_name, number, cb) {
      var _this22 = this;

      function addProcs(proc, value, cb) {
        (function ex(proc, number) {
          if (number-- === 0) return cb();

          _Common["default"].printOut(conf.PREFIX_MSG + 'Scaling up application');

          this.Client.executeRemote('duplicateProcessId', proc.pm2_env.pm_id, ex.bind(this, proc, number));
        })(proc, number);
      }

      var rmProcs = function rmProcs(procs, value, cb) {
        var i = 0;

        var ex = function ex(procs, number) {
          if (number++ === 0) return cb();

          _this22._operate('deleteProcessId', procs[i++].pm2_env.pm_id, ex.bind(_this22, procs, number));
        };

        ex(procs, number);
      };

      var end = function end() {
        return cb ? cb(null, {
          success: true
        }) : _this22.speedList();
      };

      this.Client.getProcessByName(app_name, function (err, procs) {
        if (err) {
          _Common["default"].printError(err);

          return cb ? cb(_Common["default"].retErr(err)) : _this22.exitCli(conf.ERROR_EXIT);
        }

        if (!procs || procs.length === 0) {
          _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Application %s not found', app_name);

          return cb ? cb(new Error('App not found')) : _this22.exitCli(conf.ERROR_EXIT);
        }

        var proc_number = procs.length;

        if (typeof number === 'string' && number.indexOf('+') >= 0) {
          number = parseInt(number, 10);
          return addProcs(procs[0], number, end);
        } else if (typeof number === 'string' && number.indexOf('-') >= 0) {
          number = parseInt(number, 10);
          return rmProcs(procs[0], number, end);
        } else {
          number = parseInt(number, 10);
          number = number - proc_number;
          if (number < 0) return rmProcs(procs, number, end);else if (number > 0) return addProcs(procs[0], number, end);else {
            _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Nothing to do');

            return cb ? cb(new Error('Same process number')) : _this22.exitCli(conf.ERROR_EXIT);
          }
        }
      });
    }
    /**
     * Description
     * @method describeProcess
     * @param {} pm2_id
     * @return
     */

  }, {
    key: "describe",
    value: function describe(pm2_id, cb) {
      var _this23 = this;

      var found_proc = [];
      this.Client.executeRemote('getMonitorData', {}, function (err, list) {
        if (err) {
          _Common["default"].printError('Error retrieving process list: ' + err);

          _this23.exitCli(conf.ERROR_EXIT);
        }

        list.forEach(function (proc) {
          if (!isNaN(pm2_id) && proc.pm_id == pm2_id || typeof pm2_id === 'string' && proc.name == pm2_id) {
            found_proc.push(proc);
          }
        });

        if (found_proc.length === 0) {
          _Common["default"].printError(conf.PREFIX_MSG_WARNING + '%s doesn\'t exist', pm2_id);

          return cb ? cb(null, []) : _this23.exitCli(conf.ERROR_EXIT);
        }

        if (!cb) {
          found_proc.forEach(function (proc) {
            _UX["default"].describe(proc);
          });
        }

        return cb ? cb(null, found_proc) : _this23.exitCli(conf.SUCCESS_EXIT);
      });
    }
    /**
     * API method to perform a deep update of PM2
     * @method deepUpdate
     */

  }, {
    key: "deepUpdate",
    value: function deepUpdate(cb) {
      _Common["default"].printOut(conf.PREFIX_MSG + 'Updating PM2...');

      var child = (0, _sexec["default"])("npm i -g pm2@latest; pm2 update");
      child.stdout.on('end', function () {
        _Common["default"].printOut(conf.PREFIX_MSG + 'PM2 successfully updated');

        cb ? cb(null, {
          success: true
        }) : this.exitCli(conf.SUCCESS_EXIT);
      });
    }
  }]);
  return API;
}();

; //////////////////////////
// Load all API methods //
//////////////////////////

(0, _Extra["default"])(API);
(0, _Deploy["default"])(API);
(0, _index["default"])(API);
(0, _link["default"])(API);
(0, _processSelector["default"])(API);
(0, _helpers["default"])(API);
(0, _Configuration2["default"])(API);
(0, _Version["default"])(API);
(0, _Startup["default"])(API);
(0, _LogManagement["default"])(API);
(0, _Containerizer["default"])(API);
var _default = API;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvaW5kZXgudHMiXSwibmFtZXMiOlsiZGVidWciLCJJTU1VVEFCTEVfTVNHIiwiY2hhbGsiLCJib2xkIiwiYmx1ZSIsImNvbmYiLCJjc3QiLCJBUEkiLCJvcHRzIiwiY2IiLCJDb21tb24iLCJwcmludE91dCIsIkNsaWVudCIsImV4ZWN1dGVSZW1vdGUiLCJnZXRWZXJzaW9uIiwiZXJyIiwibmV3X3ZlcnNpb24iLCJnbF9pc19rbV9saW5rZWQiLCJwa2ciLCJ2ZXJzaW9uIiwiZHQiLCJmcyIsInJlYWRGaWxlU3luYyIsInBhdGgiLCJqb2luIiwiX19kaXJuYW1lIiwiX2NvbmYiLCJQTTJfVVBEQVRFIiwiY29uc29sZSIsImxvZyIsInRvU3RyaW5nIiwiZHVtcCIsImtpbGxEYWVtb24iLCJsYXVuY2hEYWVtb24iLCJpbnRlcmFjdG9yIiwiY2hpbGQiLCJsYXVuY2hSUEMiLCJyZXN1cnJlY3QiLCJsYXVuY2hBbGwiLCJLTURhZW1vbiIsImxhdW5jaEFuZEludGVyYWN0IiwicG0yX3ZlcnNpb24iLCJkYXRhIiwiaW50ZXJhY3Rvcl9wcm9jIiwic2V0VGltZW91dCIsInN1Y2Nlc3MiLCJzcGVlZExpc3QiLCJkYWVtb25fbW9kZSIsInBtMl9ob21lIiwiUE0yX1JPT1RfUEFUSCIsInB1YmxpY19rZXkiLCJQVUJMSUNfS0VZIiwic2VjcmV0X2tleSIsIlNFQ1JFVF9LRVkiLCJtYWNoaW5lX25hbWUiLCJNQUNISU5FX05BTUUiLCJjd2QiLCJwcm9jZXNzIiwicmVzb2x2ZSIsImluZGVwZW5kZW50IiwiRXJyb3IiLCJ1dGlsIiwiaW5oZXJpdHMiLCJJU19XSU5ET1dTIiwicmFuZG9tX2ZpbGUiLCJjcnlwdG8iLCJyYW5kb21CeXRlcyIsInBtMl9jb25maWd1cmF0aW9uIiwiQ29uZmlndXJhdGlvbiIsImdldFN5bmMiLCJnbF9pbnRlcmFjdF9pbmZvcyIsInBpZCIsIklOVEVSQUNUT1JfUElEX1BBVEgiLCJwYXJzZUludCIsInRyaW0iLCJraWxsIiwiZSIsImVudiIsIk5PREVfRU5WIiwicGluZyIsInJlc3VsdCIsInJlYWRGaWxlIiwiSU5URVJBQ1RJT05fQ09ORiIsIkpTT04iLCJwYXJzZSIsImpzb241IiwiZXJyb3IiLCJnbF9yZXRyeSIsIm5vRGFlbW9uIiwic3RhcnRfdGltZXIiLCJEYXRlIiwic3RhcnQiLCJtZXRhIiwibmV3X3BtMl9pbnN0YW5jZSIsImVycl9tb2QiLCJjbWQiLCJ0ZXN0X3BhdGgiLCJ0ZXN0X3BhdGhfMiIsImluZGV4T2YiLCJhY2Nlc3MiLCJjb25zdGFudHMiLCJSX09LIiwiY2xvc2UiLCJkaXNjb25uZWN0IiwibGF1bmNoQnVzIiwiY29kZSIsIlBNMl9QUk9HUkFNTUFUSUMiLCJQTTJfVVNBR0UiLCJkaXNjb25uZWN0UlBDIiwiZmRzIiwidHJ5VG9FeGl0IiwiZXhpdCIsInN0ZG91dCIsInN0ZGVyciIsImZvckVhY2giLCJzdGQiLCJmZCIsImJ1ZmZlclNpemUiLCJ3cml0ZSIsInNlbXZlciIsImx0IiwiUFJFRklYX01TR19XQVJOSU5HIiwiaXNBcnJheSIsIndhdGNoIiwibGVuZ3RoIiwicmF3QXJncyIsImFyZ3YiLCJpc0NvbmZpZ0ZpbGUiLCJfc3RhcnRKc29uIiwicHJvY3MiLCJfc3RhcnRTY3JpcHQiLCJwcm9jZXNzX25hbWUiLCJwcm9jZXNzSWRzIiwiaWRzIiwiQ09OQ1VSUkVOVF9BQ1RJT05TIiwiaWQiLCJuZXh0IiwicmVzIiwiUFJFRklYX01TRyIsInJldEVyciIsImdldEFsbFByb2Nlc3NJZCIsInByaW50RXJyb3IiLCJleGl0Q2xpIiwiRVJST1JfRVhJVCIsImlzTmFOIiwiZ2V0UHJvY2Vzc0lkQnlOYW1lIiwiZGVsYXkiLCJsb2NrUmVsb2FkIiwiZm9yY2UiLCJQUkVGSVhfTVNHX0VSUiIsIk1hdGgiLCJmbG9vciIsIlJFTE9BRF9MT0NLX1RJTUVPVVQiLCJhcHBzIiwidW5sb2NrUmVsb2FkIiwiU1VDQ0VTU19FWElUIiwidXBkYXRlRW52IiwiX29wZXJhdGUiLCJzdGRpbiIsInJlc3VtZSIsInNldEVuY29kaW5nIiwib24iLCJwYXJhbSIsInBhdXNlIiwiYWN0aW9uRnJvbUpzb24iLCJqc29uVmlhIiwiY29tbWFuZGVyIiwibGlzdCIsInNob3ciLCJmb3JtYXQiLCJVWCIsInNldEludGVydmFsIiwiUE0yX1NUQVRVUyIsIlBNMl9TSUxFTlQiLCJraWxsQWdlbnQiLCJzY3JpcHQiLCJhcHBfY29uZiIsIkNvbmZpZyIsImZpbHRlck9wdGlvbnMiLCJhcHBDb25mIiwibmFtZSIsImFyZ3MiLCJhcmdzSW5kZXgiLCJzbGljZSIsInNjcmlwdEFyZ3MiLCJuYW1lc3BhY2UiLCJ2ZXJpZnlDb25mcyIsIndhdGNoRGVsYXkiLCJ3YXRjaF9kZWxheSIsInBhcnNlRmxvYXQiLCJtYXMiLCJleHQiLCJoZiIsIm1ha2VfYXZhaWxhYmxlX2V4dGVuc2lvbiIsImlnbm9yZV93YXRjaCIsImRzdF9wYXRoIiwiUFdEIiwid3JpdGVGaWxlU3luYyIsInN0cmluZ2lmeSIsInN0YWNrIiwicmVzdGFydEV4aXN0aW5nUHJvY2Vzc05hbWUiLCJleHRuYW1lIiwicmVzdGFydEV4aXN0aW5nTmFtZVNwYWNlIiwiZ2V0UHJvY2Vzc0lkc0J5TmFtZXNwYWNlIiwicmVzdGFydEV4aXN0aW5nUHJvY2Vzc0lkIiwicmVzdGFydEV4aXN0aW5nUHJvY2Vzc1BhdGhPclN0YXJ0TmV3IiwiZnVsbF9wYXRoIiwibWFuYWdlZF9zY3JpcHQiLCJwcm9jIiwicG0yX2VudiIsInBtX2V4ZWNfcGF0aCIsInN0YXR1cyIsIlNUT1BQRURfU1RBVFVTIiwiU1RPUFBJTkdfU1RBVFVTIiwiRVJST1JFRF9TVEFUVVMiLCJhcHBfbmFtZSIsInJlc29sdmVkX3BhdGhzIiwicmVzb2x2ZUFwcEF0dHJpYnV0ZXMiLCJtZXNzYWdlIiwiaW5zdGFuY2VzIiwiZXhlY19tb2RlIiwiYWRkaXRpb25hbF9lbnYiLCJNb2R1bGFyaXplciIsImdldEFkZGl0aW9uYWxDb25mIiwia21fbGluayIsInJldCIsIl9kdCIsInVuZGVmaW5lZCIsImZpbGUiLCJhY3Rpb24iLCJwaXBlIiwiY29uZmlnIiwic3RhdGljQ29uZiIsImRlcGxveUNvbmYiLCJhcHBzX2luZm8iLCJwYXJzZUNvbmZpZyIsImlzQWJzb2x1dGUiLCJmaWxlX3BhdGgiLCJkZXBsb3kiLCJwbTIiLCJBcnJheSIsIlBNMl9KU09OX1BST0NFU1NJTkciLCJhcHBzX25hbWUiLCJwcm9jX2xpc3QiLCJzZXJ2ZSIsInB1c2giLCJwb3J0IiwiUE0yX1NFUlZFX1BPUlQiLCJQTTJfU0VSVkVfSE9TVCIsImhvc3QiLCJQTTJfU0VSVkVfUEFUSCIsIlBNMl9TRVJWRV9TUEEiLCJzcGEiLCJQTTJfU0VSVkVfRElSRUNUT1JZIiwiZGlyZWN0b3J5IiwiUE0yX1NFUlZFX0JBU0lDX0FVVEgiLCJiYXNpY19hdXRoIiwiUE0yX1NFUlZFX0JBU0lDX0FVVEhfVVNFUk5BTUUiLCJ1c2VybmFtZSIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIX1BBU1NXT1JEIiwicGFzc3dvcmQiLCJQTTJfU0VSVkVfTU9OSVRPUiIsIm1vbml0b3IiLCJhcHAiLCJpbyIsIm9ubHkiLCJzcGxpdCIsImluc3RhbGxfdXJsIiwidWlkIiwiZ2lkIiwiYXBwZW5kX2Vudl90b19uYW1lIiwibmFtZV9wcmVmaXgiLCJnZXRDdXJyZW50VXNlcm5hbWUiLCJyYXdfcHJvY19saXN0IiwiT2JqZWN0Iiwia2V5cyIsInByb2NfbmFtZSIsImZpbHRlciIsImVudnMiLCJtYXAiLCJtZXJnZUVudmlyb25tZW50VmFyaWFibGVzIiwicmVkdWNlIiwiZTEiLCJlMiIsImNvbmNhdCIsIm5vdGlmeUdvZCIsInNwbGljZSIsInN0YXJ0QXBwcyIsImFwcF9uYW1lX3RvX3N0YXJ0IiwiYXBwc190b19zdGFydCIsImFwcHNfc3RhcnRlZCIsImFwcHNfZXJyb3JlZCIsImkiLCJmb3JjZV9uYW1lIiwic3RhcnRlZF9hc19tb2R1bGUiLCJwbXhfbW9kdWxlIiwiY3VycmVudF9jb25mIiwid2FpdF9yZWFkeSIsIndhcm4iLCJmaW5hbF9lcnJvciIsInJldF9wcm9jZXNzZXMiLCJuZXh0MSIsIm5ld19lbnYiLCJiYXNlbmFtZSIsIm5leHRUaWNrIiwibmV4dDIiLCJhY3Rpb25fbmFtZSIsInVwZGF0ZV9lbnYiLCJjb25jdXJyZW50X2FjdGlvbnMiLCJwYXJhbGxlbCIsImNvbW1hbmRzIiwiX2hhbmRsZUF0dHJpYnV0ZVVwZGF0ZSIsInNhZmVFeHRlbmQiLCJrIiwiY3Jvbl9yZXN0YXJ0IiwicG1faWQiLCJyZXN0YXJ0X3RpbWUiLCJmbiIsInJlb3BlcmF0ZSIsImdldEFsbFByb2Nlc3NJZFdpdGhvdXRNb2R1bGVzIiwicmVnZXgiLCJSZWdFeHAiLCJyZXBsYWNlIiwiZm91bmRfcHJvYyIsInRlc3QiLCJhbGxvd19tb2R1bGVfcmVzdGFydCIsIm5zX3Byb2Nlc3NfaWRzIiwibnNfYWRkaXRpb25hbF9lbnYiLCJkb2NrZXIiLCJoaWdoZXJfaWQiLCJwIiwiRG9ja2VyTWdtdCIsInByb2Nlc3NDb21tYW5kIiwiUE0yX0RFRVBfTU9OSVRPUklORyIsImRlZXBfbW9uaXRvcmluZyIsInRyZWVraWxsIiwicG14Iiwidml6aW9uIiwiYXV0b21hdGlvbiIsImF1dG9yZXN0YXJ0IiwiaW5zcGVjdCIsInRyZWUiLCJzeXNfaW5mb3MiLCJhcHBzX2FjdGVkIiwic3lzdGVtZGF0YSIsImFjdGVkIiwiZG9MaXN0IiwiYmluZCIsImlzVFRZIiwibGlzdF9taW4iLCJtaW5pTGlzdCIsInNpbGVudCIsImRhc2hib2FyZF91cmwiLCJpbmZvX25vZGUiLCJncmVlbiIsIlBNMl9QSURfRklMRV9QQVRIIiwiZ2xvYmFsIiwic3RyZWFtTG9ncyIsIlRSQVZJUyIsImF0dGFjaCIsImluZm8iLCJjeWFuIiwibnVtYmVyIiwiYWRkUHJvY3MiLCJ2YWx1ZSIsImV4Iiwicm1Qcm9jcyIsImVuZCIsImdldFByb2Nlc3NCeU5hbWUiLCJwcm9jX251bWJlciIsInBtMl9pZCIsImRlc2NyaWJlIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUFLQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFD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QUFQLENBQWdCTixJQUFJLENBQUNxSSxVQUFMLEdBQWtCLDBCQUFsQzs7QUFDQWpJLFFBQUFBLEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBTztBQUFFb0MsVUFBQUEsT0FBTyxFQUFFO0FBQVgsU0FBUCxDQUFMLEdBQWlDLEtBQUtpRyxPQUFMLENBQWF6SSxJQUFJLENBQUNzSixZQUFsQixDQUFuQztBQUNILE9BSEQ7QUFJSDs7Ozs7QUFDSixDLENBRUQ7QUFDQTtBQUNBOztBQUVBLHVCQUFTcEosR0FBVDtBQUNBLHdCQUFVQSxHQUFWO0FBQ0EsdUJBQVVBLEdBQVY7QUFFQSxzQkFBWUEsR0FBWjtBQUNBLGlDQUFlQSxHQUFmO0FBQ0EseUJBQWNBLEdBQWQ7QUFFQSxnQ0FBVUEsR0FBVjtBQUNBLHlCQUFXQSxHQUFYO0FBQ0EseUJBQVdBLEdBQVg7QUFDQSwrQkFBUUEsR0FBUjtBQUNBLCtCQUFhQSxHQUFiO2VBRWVBLEciLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCBjb21tYW5kZXIgZnJvbSAnY29tbWFuZGVyJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBlYWNoTGltaXQgZnJvbSAnYXN5bmMvZWFjaExpbWl0JztcbmltcG9ydCBzZXJpZXMgZnJvbSAnYXN5bmMvc2VyaWVzJztcbmltcG9ydCBkZWJ1Z0xvZ2dlciBmcm9tICdkZWJ1Zyc7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgZmNsb25lIGZyb20gJ2ZjbG9uZSc7XG5cbmltcG9ydCBEb2NrZXJNZ210IGZyb20gJy4vRXh0cmFNZ210L0RvY2tlcic7XG5pbXBvcnQgY3N0IGZyb20gJy4uLy4uL2NvbnN0YW50cyc7XG5pbXBvcnQgQ2xpZW50IGZyb20gJy4uL0NsaWVudCc7XG5pbXBvcnQgQ29tbW9uIGZyb20gJy4uL0NvbW1vbic7XG5pbXBvcnQgS01EYWVtb24gZnJvbSAnQHBtMi9hZ2VudC9zcmMvSW50ZXJhY3RvckNsaWVudCc7XG5pbXBvcnQgQ29uZmlnIGZyb20gJy4uL3Rvb2xzL0NvbmZpZyc7XG5pbXBvcnQgTW9kdWxhcml6ZXIgZnJvbSAnLi9Nb2R1bGVzL01vZHVsYXJpemVyJztcbmltcG9ydCBwYXRoX3N0cnVjdHVyZSBmcm9tICcuLi8uLi9wYXRocyc7XG5pbXBvcnQgVVggZnJvbSAnLi9VWCc7XG5pbXBvcnQgcGtnIGZyb20gJy4uLy4uL3BhY2thZ2UuanNvbic7XG5pbXBvcnQgaGYgZnJvbSAnLi9Nb2R1bGVzL2ZsYWdFeHQnO1xuaW1wb3J0IENvbmZpZ3VyYXRpb24gZnJvbSAnLi4vQ29uZmlndXJhdGlvbic7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgc2V4ZWMgZnJvbSAnLi4vdG9vbHMvc2V4ZWMnO1xuaW1wb3J0IGNyeXB0byBmcm9tICdjcnlwdG8nO1xuaW1wb3J0IGpzb241IGZyb20gJy4uL3Rvb2xzL2pzb241J1xuaW1wb3J0IGRheWpzIGZyb20gJ2RheWpzJztcbi8vIGltcG9ydCB0cmVlaWZ5IGZyb20gJy4vdG9vbHMvdHJlZWlmeSdcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIExvYWQgYWxsIEFQSSBtZXRob2RzIC8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5pbXBvcnQgQVBJRXh0cmEgZnJvbSAnLi9FeHRyYSc7XG5pbXBvcnQgQVBJRGVwbG95IGZyb20gJy4vRGVwbG95JztcbmltcG9ydCBBUElNb2R1bGUgZnJvbSAnLi9Nb2R1bGVzL2luZGV4JztcblxuaW1wb3J0IEFQSVBsdXNMaW5rIGZyb20gJy4vcG0yLXBsdXMvbGluayc7XG5pbXBvcnQgQVBJUGx1c1Byb2Nlc3MgZnJvbSAnLi9wbTItcGx1cy9wcm9jZXNzLXNlbGVjdG9yJztcbmltcG9ydCBBUElQbHVzSGVscGVyIGZyb20gJy4vcG0yLXBsdXMvaGVscGVycyc7XG5cbmltcG9ydCBBUElDb25maWcgZnJvbSAnLi9Db25maWd1cmF0aW9uJztcbmltcG9ydCBBUElWZXJzaW9uIGZyb20gJy4vVmVyc2lvbic7XG5pbXBvcnQgQVBJU3RhcnR1cCBmcm9tICcuL1N0YXJ0dXAnO1xuaW1wb3J0IEFQSU1nbnQgZnJvbSAnLi9Mb2dNYW5hZ2VtZW50JztcbmltcG9ydCBBUElDb250YWluZXIgZnJvbSAnLi9Db250YWluZXJpemVyJztcblxudmFyIGRlYnVnID0gZGVidWdMb2dnZXIoJ3BtMjpjbGknKTtcbnZhciBJTU1VVEFCTEVfTVNHID0gY2hhbGsuYm9sZC5ibHVlKCdVc2UgLS11cGRhdGUtZW52IHRvIHVwZGF0ZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMnKTtcblxudmFyIGNvbmYgPSBjc3RcblxuLyoqXG4gKiBNYWluIEZ1bmN0aW9uIHRvIGJlIGltcG9ydGVkXG4gKiBjYW4gYmUgYWxpYXNlZCB0byBQTTJcbiAqXG4gKiBUbyB1c2UgaXQgd2hlbiBQTTIgaXMgaW5zdGFsbGVkIGFzIGEgbW9kdWxlOlxuICpcbiAqIHZhciBQTTIgPSByZXF1aXJlKCdwbTInKTtcbiAqXG4gKiB2YXIgcG0yID0gUE0yKDxvcHRzPik7XG4gKlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSAgb3B0c1xuICogQHBhcmFtIHtTdHJpbmd9ICBbb3B0cy5jd2Q9PGN1cnJlbnQ+XSAgICAgICAgIG92ZXJyaWRlIHBtMiBjd2QgZm9yIHN0YXJ0aW5nIHNjcmlwdHNcbiAqIEBwYXJhbSB7U3RyaW5nfSAgW29wdHMucG0yX2hvbWU9WzxwYXRocy5qcz5dXSBwbTIgZGlyZWN0b3J5IGZvciBsb2csIHBpZHMsIHNvY2tldCBmaWxlc1xuICogQHBhcmFtIHtCb29sZWFufSBbb3B0cy5pbmRlcGVuZGVudD1mYWxzZV0gICAgIHVuaXF1ZSBQTTIgaW5zdGFuY2UgKHJhbmRvbSBwbTJfaG9tZSlcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdHMuZGFlbW9uX21vZGU9dHJ1ZV0gICAgICBzaG91bGQgYmUgY2FsbGVkIGluIHRoZSBzYW1lIHByb2Nlc3Mgb3Igbm90XG4gKiBAcGFyYW0ge1N0cmluZ30gIFtvcHRzLnB1YmxpY19rZXk9bnVsbF0gICAgICAgcG0yIHBsdXMgYnVja2V0IHB1YmxpYyBrZXlcbiAqIEBwYXJhbSB7U3RyaW5nfSAgW29wdHMuc2VjcmV0X2tleT1udWxsXSAgICAgICBwbTIgcGx1cyBidWNrZXQgc2VjcmV0IGtleVxuICogQHBhcmFtIHtTdHJpbmd9ICBbb3B0cy5tYWNoaW5lX25hbWU9bnVsbF0gICAgIHBtMiBwbHVzIGluc3RhbmNlIG5hbWVcbiAqL1xuY2xhc3MgQVBJIHtcblxuICAgIGRhZW1vbl9tb2RlOiBib29sZWFuO1xuICAgIHBtMl9ob21lOiBzdHJpbmc7XG4gICAgcHVibGljX2tleTogc3RyaW5nO1xuICAgIHNlY3JldF9rZXk6IHN0cmluZztcbiAgICBtYWNoaW5lX25hbWU6IHN0cmluZztcblxuICAgIGN3ZDogc3RyaW5nO1xuXG4gICAgX2NvbmY6IGFueTtcblxuICAgIENsaWVudDogYW55O1xuICAgIHBtMl9jb25maWd1cmF0aW9uOiBhbnk7XG4gICAgZ2xfaW50ZXJhY3RfaW5mb3M6IGFueTtcbiAgICBnbF9pc19rbV9saW5rZWQ6IGJvb2xlYW47XG5cbiAgICBnbF9yZXRyeTogbnVtYmVyO1xuXG4gICAgc3RhcnRfdGltZXI6IERhdGU7XG4gICAga2lsbEFnZW50OiAoY2IpID0+IHZvaWQ7XG4gICAgbGF1bmNoQWxsOiAoZGF0YSwgY2IpID0+IHZvaWQ7XG4gICAgZ2V0VmVyc2lvbjogKGVyciwgcmVzPykgPT4gdm9pZDtcbiAgICBkdW1wOiAoZXJyKSA9PiB2b2lkO1xuICAgIHJlc3VycmVjdDogKGVycj8pID0+IHZvaWQ7XG5cbiAgICBzdHJlYW1Mb2dzOiAoYSwgYiwgYywgZCwgZSkgPT4gdm9pZDtcblxuICAgIC8vIGluIENvbnRhaW5lcml6ZXIudHNcbiAgICBkb2NrZXJNb2RlOiAoY21kOiBzdHJpbmcsIG9wdHM6IGFueSwgZW52OiBzdHJpbmcpID0+IHZvaWQ7XG5cbiAgICAvLyBpbiBFeHRyYS50c1xuICAgIHRyaWdnZXI6IChwbUlkOiBudW1iZXIsIGFjdGlvbk5hbWU6IHN0cmluZywgcGFyYW1zOiBhbnksIGNiPykgPT4gdm9pZDtcbiAgICBnZXRQSUQ6IChhcHBOYW1lOiBzdHJpbmcsIGNiPykgPT4gdm9pZDtcbiAgICBib2lsZXJwbGF0ZTogKGNiPykgPT4gdm9pZDtcbiAgICBwcm9maWxlOiAodHlwZTogc3RyaW5nLCB0aW1lOiBhbnksIGNiPykgPT4gdm9pZDtcbiAgICBpbnNwZWN0OiAoYXBwTmFtZTogc3RyaW5nLCBjYj8pID0+IHZvaWQ7XG4gICAgc2VuZFNpZ25hbFRvUHJvY2Vzc05hbWU6IChzaWduYWw6IHN0cmluZywgcHJvY2Vzc05hbWU6IHN0cmluZywgY2I/KSA9PiB2b2lkO1xuICAgIHNlbmRTaWduYWxUb1Byb2Nlc3NJZDogKHNpZ25hbDogc3RyaW5nLCBwcm9jZXNzSWQ6IHN0cmluZywgY2I/KSA9PiB2b2lkO1xuICAgIHBpbmc6IChjYj8pID0+IHZvaWQ7XG5cbiAgICAvLyBpbiBEZXBsb3kudHNcbiAgICBkZXBsb3k6IChmaWxlOiBzdHJpbmcsIGNvbW1hbmRzOiBhbnksIGNiPykgPT4gdm9pZDtcblxuICAgIC8vIGluIE1vZHVsZXMvaW5kZXhcbiAgICBpbnN0YWxsOiAobW9kdWxlTmFtZTogc3RyaW5nLCBvcHRzPzogYW55LCBjYj8pID0+IHZvaWQ7XG4gICAgdW5pbnN0YWxsOiAobW9kdWxlTmFtZTogc3RyaW5nLCBjYj8pID0+IHZvaWQ7XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRzPykge1xuICAgICAgICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcblxuICAgICAgICB0aGlzLmRhZW1vbl9tb2RlID0gdHlwZW9mIChvcHRzLmRhZW1vbl9tb2RlKSA9PSAndW5kZWZpbmVkJyA/IHRydWUgOiBvcHRzLmRhZW1vbl9tb2RlO1xuICAgICAgICB0aGlzLnBtMl9ob21lID0gY29uZi5QTTJfUk9PVF9QQVRIO1xuICAgICAgICB0aGlzLnB1YmxpY19rZXkgPSBjb25mLlBVQkxJQ19LRVkgfHwgb3B0cy5wdWJsaWNfa2V5IHx8IG51bGw7XG4gICAgICAgIHRoaXMuc2VjcmV0X2tleSA9IGNvbmYuU0VDUkVUX0tFWSB8fCBvcHRzLnNlY3JldF9rZXkgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5tYWNoaW5lX25hbWUgPSBjb25mLk1BQ0hJTkVfTkFNRSB8fCBvcHRzLm1hY2hpbmVfbmFtZSB8fCBudWxsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENXRCByZXNvbHV0aW9uXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmN3ZCA9IHByb2Nlc3MuY3dkKCk7XG4gICAgICAgIGlmIChvcHRzLmN3ZCkge1xuICAgICAgICAgICAgdGhpcy5jd2QgPSBwYXRoLnJlc29sdmUob3B0cy5jd2QpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBNMiBIT01FIHJlc29sdXRpb25cbiAgICAgICAgICovXG4gICAgICAgIGlmIChvcHRzLnBtMl9ob21lICYmIG9wdHMuaW5kZXBlbmRlbnQgPT0gdHJ1ZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IGNhbm5vdCBzZXQgYSBwbTJfaG9tZSBhbmQgaW5kZXBlbmRlbnQgaW5zdGFuY2UgaW4gc2FtZSB0aW1lJyk7XG5cbiAgICAgICAgaWYgKG9wdHMucG0yX2hvbWUpIHtcbiAgICAgICAgICAgIC8vIE92ZXJyaWRlIGRlZmF1bHQgY29uZiBmaWxlXG4gICAgICAgICAgICB0aGlzLnBtMl9ob21lID0gb3B0cy5wbTJfaG9tZTtcbiAgICAgICAgICAgIGNvbmYgPSB1dGlsLmluaGVyaXRzKGNvbmYsIHBhdGhfc3RydWN0dXJlKHRoaXMucG0yX2hvbWUpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRzLmluZGVwZW5kZW50ID09IHRydWUgJiYgY29uZi5JU19XSU5ET1dTID09PSBmYWxzZSkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGFuIHVuaXF1ZSBwbTIgaW5zdGFuY2VcbiAgICAgICAgICAgIHZhciByYW5kb21fZmlsZSA9IGNyeXB0by5yYW5kb21CeXRlcyg4KS50b1N0cmluZygnaGV4Jyk7XG4gICAgICAgICAgICB0aGlzLnBtMl9ob21lID0gcGF0aC5qb2luKCcvdG1wJywgcmFuZG9tX2ZpbGUpO1xuXG4gICAgICAgICAgICAvLyBJZiB3ZSBkb250IGV4cGxpY2l0bHkgdGVsbCB0byBoYXZlIGEgZGFlbW9uXG4gICAgICAgICAgICAvLyBJdCB3aWxsIGdvIGFzIGluIHByb2NcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKG9wdHMuZGFlbW9uX21vZGUpID09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgIHRoaXMuZGFlbW9uX21vZGUgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbmYgPSB1dGlsLmluaGVyaXRzKGNvbmYsIHBhdGhfc3RydWN0dXJlKHRoaXMucG0yX2hvbWUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbmYgPSBjb25mO1xuXG4gICAgICAgIGlmIChjb25mLklTX1dJTkRPV1MpIHtcbiAgICAgICAgICAgIC8vIFdlaXJkIGZpeCwgbWF5IG5lZWQgdG8gYmUgZHJvcHBlZFxuICAgICAgICAgICAgLy8gQHRvZG8gd2luZG93cyBjb25ub2lzc2V1ciBkb3VibGUgY2hlY2tcbiAgICAgICAgICAgIC8vIFRPRE86IHBsZWFzZSBjaGVjayB0aGlzXG4gICAgICAgICAgICAvLyBpZiAocHJvY2Vzcy5zdGRvdXQuX2hhbmRsZSAmJiBwcm9jZXNzLnN0ZG91dC5faGFuZGxlLnNldEJsb2NraW5nKVxuICAgICAgICAgICAgLy8gICBwcm9jZXNzLnN0ZG91dC5faGFuZGxlLnNldEJsb2NraW5nKHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5DbGllbnQgPSBuZXcgQ2xpZW50KHtcbiAgICAgICAgICAgIHBtMl9ob21lOiB0aGlzLnBtMl9ob21lLFxuICAgICAgICAgICAgY29uZjogdGhpcy5fY29uZixcbiAgICAgICAgICAgIHNlY3JldF9rZXk6IHRoaXMuc2VjcmV0X2tleSxcbiAgICAgICAgICAgIHB1YmxpY19rZXk6IHRoaXMucHVibGljX2tleSxcbiAgICAgICAgICAgIGRhZW1vbl9tb2RlOiB0aGlzLmRhZW1vbl9tb2RlLFxuICAgICAgICAgICAgbWFjaGluZV9uYW1lOiB0aGlzLm1hY2hpbmVfbmFtZVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnBtMl9jb25maWd1cmF0aW9uID0gQ29uZmlndXJhdGlvbi5nZXRTeW5jKCdwbTInKSB8fCB7fVxuXG4gICAgICAgIHRoaXMuZ2xfaW50ZXJhY3RfaW5mb3MgPSBudWxsO1xuICAgICAgICB0aGlzLmdsX2lzX2ttX2xpbmtlZCA9IGZhbHNlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgcGlkOiBhbnkgPSBmcy5yZWFkRmlsZVN5bmMoY29uZi5JTlRFUkFDVE9SX1BJRF9QQVRIKTtcbiAgICAgICAgICAgIHBpZCA9IHBhcnNlSW50KHBpZC50b1N0cmluZygpLnRyaW0oKSk7XG4gICAgICAgICAgICBwcm9jZXNzLmtpbGwocGlkLCAwKTtcbiAgICAgICAgICAgIHRoaXMuZ2xfaXNfa21fbGlua2VkID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5nbF9pc19rbV9saW5rZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZvciB0ZXN0aW5nIHB1cnBvc2VzXG4gICAgICAgIGlmICh0aGlzLnNlY3JldF9rZXkgJiYgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT0gJ2xvY2FsX3Rlc3QnKVxuICAgICAgICAgICAgdGhpcy5nbF9pc19rbV9saW5rZWQgPSB0cnVlO1xuXG4gICAgICAgIEtNRGFlbW9uLnBpbmcodGhpcy5fY29uZiwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAoIWVyciAmJiByZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZShjb25mLklOVEVSQUNUSU9OX0NPTkYsIChlcnIsIF9jb25mKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2xfaW50ZXJhY3RfaW5mb3MgPSBKU09OLnBhcnNlKF9jb25mLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nbF9pbnRlcmFjdF9pbmZvcyA9IGpzb241LnBhcnNlKF9jb25mLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2xfaW50ZXJhY3RfaW5mb3MgPSBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICB0aGlzLmdsX3JldHJ5ID0gMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb25uZWN0IHRvIFBNMlxuICAgICAqIENhbGxpbmcgdGhpcyBjb21tYW5kIGlzIG5vdyBvcHRpb25hbFxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGJhY2sgb25jZSBwbTIgaXMgcmVhZHkgZm9yIGNvbW1hbmRzXG4gICAgICovXG4gICAgY29ubmVjdChub0RhZW1vbiwgY2I/KSB7XG4gICAgICAgIHRoaXMuc3RhcnRfdGltZXIgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgIGlmICh0eXBlb2YgKGNiKSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY2IgPSBub0RhZW1vbjtcbiAgICAgICAgICAgIG5vRGFlbW9uID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAobm9EYWVtb24gPT09IHRydWUpIHtcbiAgICAgICAgICAgIC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHkgd2l0aCBQTTIgMS54XG4gICAgICAgICAgICB0aGlzLkNsaWVudC5kYWVtb25fbW9kZSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5kYWVtb25fbW9kZSA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5DbGllbnQuc3RhcnQoKGVyciwgbWV0YSkgPT4ge1xuICAgICAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IoZXJyKTtcblxuICAgICAgICAgICAgaWYgKG1ldGEubmV3X3BtMl9pbnN0YW5jZSA9PSBmYWxzZSAmJiB0aGlzLmRhZW1vbl9tb2RlID09PSB0cnVlKVxuICAgICAgICAgICAgICAgIHJldHVybiBjYihlcnIsIG1ldGEpO1xuXG4gICAgICAgICAgICAvLyBJZiBuZXcgcG0yIGluc3RhbmNlIGhhcyBiZWVuIHBvcHBlZFxuICAgICAgICAgICAgLy8gTGF1Y2ggYWxsIG1vZHVsZXNcbiAgICAgICAgICAgIHRoaXMubGF1bmNoQWxsKHRoaXMsIGZ1bmN0aW9uIChlcnJfbW9kKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiKGVyciwgbWV0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlZnVsbCB3aGVuIGN1c3RvbSBQTTIgY3JlYXRlZCB3aXRoIGluZGVwZW5kZW50IGZsYWcgc2V0IHRvIHRydWVcbiAgICAgKiBUaGlzIHdpbGwgY2xlYW51cCB0aGUgbmV3bHkgY3JlYXRlZCBpbnN0YW5jZVxuICAgICAqIGJ5IHJlbW92aW5nIGZvbGRlciwga2lsbGluZyBQTTIgYW5kIHNvIG9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBjYWxsYmFjayBvbmNlIGNsZWFudXAgaXMgc3VjY2Vzc2Z1bGxcbiAgICAgKi9cbiAgICBkZXN0cm95KGNiKSB7XG4gICAgICAgIGRlYnVnKCdLaWxsaW5nIGFuZCBkZWxldGluZyBjdXJyZW50IGRlYW1vbicpO1xuXG4gICAgICAgIHRoaXMua2lsbERhZW1vbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY21kID0gJ3JtIC1yZiAnICsgdGhpcy5wbTJfaG9tZTtcbiAgICAgICAgICAgIHZhciB0ZXN0X3BhdGggPSBwYXRoLmpvaW4odGhpcy5wbTJfaG9tZSwgJ21vZHVsZV9jb25mLmpzb24nKTtcbiAgICAgICAgICAgIHZhciB0ZXN0X3BhdGhfMiA9IHBhdGguam9pbih0aGlzLnBtMl9ob21lLCAncG0yLnBpZCcpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5wbTJfaG9tZS5pbmRleE9mKCcucG0yJykgPiAtMSlcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdEZXN0cm95IGlzIG5vdCBhIGFsbG93ZWQgbWV0aG9kIG9uIC5wbTInKSk7XG5cbiAgICAgICAgICAgIGZzLmFjY2Vzcyh0ZXN0X3BhdGgsIGZzLmNvbnN0YW50cy5SX09LLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgICAgICAgZGVidWcoJ0RlbGV0aW5nIHRlbXBvcmFyeSBmb2xkZXIgJXMnLCB0aGlzLnBtMl9ob21lKTtcbiAgICAgICAgICAgICAgICBzZXhlYyhjbWQsIGNiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNjb25uZWN0IGZyb20gUE0yIGluc3RhbmNlXG4gICAgICogVGhpcyB3aWxsIGFsbG93IHlvdXIgc29mdHdhcmUgdG8gZXhpdCBieSBpdHNlbGZcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYl0gb3B0aW9uYWwgY2FsbGJhY2sgb25jZSBjb25uZWN0aW9uIGNsb3NlZFxuICAgICAqL1xuICAgIGRpc2Nvbm5lY3QoY2I/KSB7XG4gICAgICAgIGlmICghY2IpIGNiID0gZnVuY3Rpb24gKCkgeyB9O1xuXG4gICAgICAgIHRoaXMuQ2xpZW50LmNsb3NlKGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgIC8vIGRlYnVnKCdUaGUgc2Vzc2lvbiBsYXN0ZWQgJWRzJywgKG5ldyBEYXRlKCkgLSB0aGF0LnN0YXJ0X3RpbWVyKSAvIDEwMDApO1xuICAgICAgICAgICAgcmV0dXJuIGNiKGVyciwgZGF0YSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBvbiBkaXNjb25uZWN0XG4gICAgICogQHBhcmFtIGNiXG4gICAgICovXG4gICAgY2xvc2UoY2IpIHtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KGNiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMYXVuY2ggbW9kdWxlc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGJhY2sgb25jZSBwbTIgaGFzIGxhdW5jaGVkIG1vZHVsZXNcbiAgICAgKi9cbiAgICBsYXVuY2hNb2R1bGVzKGNiKSB7XG4gICAgICAgIHRoaXMubGF1bmNoQWxsKHRoaXMsIGNiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgYnVzIGFsbG93aW5nIHRvIHJldHJpZXZlIHZhcmlvdXMgcHJvY2VzcyBldmVudFxuICAgICAqIGxpa2UgbG9ncywgcmVzdGFydHMsIHJlbG9hZHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIGNhbGxiYWNrIGNhbGxlZCB3aXRoIDFzdCBwYXJhbSBlcnIgYW5kIDJuYiBwYXJhbSB0aGUgYnVzXG4gICAgICovXG4gICAgbGF1bmNoQnVzKGNiKSB7XG4gICAgICAgIHRoaXMuQ2xpZW50LmxhdW5jaEJ1cyhjYik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhpdCBtZXRob2RzIGZvciBBUElcbiAgICAgKiBAcGFyYW0ge0ludGVnZXJ9IGNvZGUgZXhpdCBjb2RlIGZvciB0ZXJtaW5hbFxuICAgICAqL1xuICAgIGV4aXRDbGkoY29kZSkge1xuICAgICAgICAvLyBEbyBub3RoaW5nIGlmIFBNMiBjYWxsZWQgcHJvZ3JhbW1hdGljYWxseSAoYWxzbyBpbiBzcGVlZGxpc3QpXG4gICAgICAgIGlmIChjb25mLlBNMl9QUk9HUkFNTUFUSUMgJiYgcHJvY2Vzcy5lbnYuUE0yX1VTQUdFICE9ICdDTEknKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgS01EYWVtb24uZGlzY29ubmVjdFJQQygoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLkNsaWVudC5jbG9zZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29kZSA9IGNvZGUgfHwgMDtcbiAgICAgICAgICAgICAgICAvLyBTYWZlIGV4aXRzIHByb2Nlc3MgYWZ0ZXIgYWxsIHN0cmVhbXMgYXJlIGRyYWluZWQuXG4gICAgICAgICAgICAgICAgLy8gZmlsZSBkZXNjcmlwdG9yIGZsYWcuXG4gICAgICAgICAgICAgICAgdmFyIGZkcyA9IDA7XG4gICAgICAgICAgICAgICAgLy8gZXhpdHMgcHJvY2VzcyB3aGVuIHN0ZG91dCAoMSkgYW5kIHNkdGVycigyKSBhcmUgYm90aCBkcmFpbmVkLlxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHRyeVRvRXhpdCgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChmZHMgJiAxKSAmJiAoZmRzICYgMikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRlYnVnKCdUaGlzIGNvbW1hbmQgdG9vayAlZHMgdG8gZXhlY3V0ZScsIChuZXcgRGF0ZSgpIC0gdGhhdC5zdGFydF90aW1lcikgLyAxMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdChjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIFtwcm9jZXNzLnN0ZG91dCwgcHJvY2Vzcy5zdGRlcnJdLmZvckVhY2goZnVuY3Rpb24gKHN0ZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZmQgPSBzdGQuZmQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc3RkLmJ1ZmZlclNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJ1ZmZlclNpemUgZXF1YWxzIDAgbWVhbnMgY3VycmVudCBzdHJlYW0gaXMgZHJhaW5lZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZkcyA9IGZkcyB8IGZkO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXBwZW5kcyBub3RoaW5nIHRvIHRoZSBzdGQgcXVldWUsIGJ1dCB3aWxsIHRyaWdnZXIgYHRyeVRvRXhpdGAgZXZlbnQgb24gYGRyYWluYC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZC53cml0ZSAmJiBzdGQud3JpdGUoJycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmZHMgPSBmZHMgfCBmZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnlUb0V4aXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIERvZXMgbm90IHdyaXRlIGFueXRoaW5nIG1vcmUuXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzdGQud3JpdGU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdHJ5VG9FeGl0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIEFwcGxpY2F0aW9uIG1hbmFnZW1lbnQgLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAvKipcbiAgICAgKiBTdGFydCBhIGZpbGUgb3IganNvbiB3aXRoIGNvbmZpZ3VyYXRpb25cbiAgICAgKiBAcGFyYW0ge09iamVjdHx8U3RyaW5nfSBjbWQgc2NyaXB0IHRvIHN0YXJ0IG9yIGpzb25cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBjYWxsZWQgd2hlbiBhcHBsaWNhdGlvbiBoYXMgYmVlbiBzdGFydGVkXG4gICAgICovXG4gICAgc3RhcnQoY21kLCBvcHRzLCBjYikge1xuICAgICAgICBpZiAodHlwZW9mIChvcHRzKSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNiID0gb3B0cztcbiAgICAgICAgICAgIG9wdHMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcblxuICAgICAgICBpZiAoc2VtdmVyLmx0KHByb2Nlc3MudmVyc2lvbiwgJzYuMC4wJykpIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0dfV0FSTklORyArICdOb2RlIDQgaXMgZGVwcmVjYXRlZCwgcGxlYXNlIHVwZ3JhZGUgdG8gdXNlIHBtMiB0byBoYXZlIGFsbCBmZWF0dXJlcycpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWwuaXNBcnJheShvcHRzLndhdGNoKSAmJiBvcHRzLndhdGNoLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIG9wdHMud2F0Y2ggPSAob3B0cy5yYXdBcmdzID8gISF+b3B0cy5yYXdBcmdzLmluZGV4T2YoJy0td2F0Y2gnKSA6ICEhfnByb2Nlc3MuYXJndi5pbmRleE9mKCctLXdhdGNoJykpIHx8IGZhbHNlO1xuXG4gICAgICAgIGlmIChDb21tb24uaXNDb25maWdGaWxlKGNtZCkgfHwgKHR5cGVvZiAoY21kKSA9PT0gJ29iamVjdCcpKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGFydEpzb24oY21kLCBvcHRzLCAncmVzdGFydFByb2Nlc3NJZCcsIChlcnIsIHByb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc3RhcnRTY3JpcHQoY21kLCBvcHRzLCAoZXJyLCBwcm9jcykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVyciwgcHJvY3MpIDogdGhpcy5zcGVlZExpc3QoMClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXNldCBwcm9jZXNzIGNvdW50ZXJzXG4gICAgICpcbiAgICAgKiBAbWV0aG9kIHJlc2V0TWV0YVByb2Nlc3NcbiAgICAgKi9cbiAgICByZXNldChwcm9jZXNzX25hbWUsIGNiPykge1xuICAgICAgICBjb25zdCBwcm9jZXNzSWRzID0gKGlkcywgY2IpID0+IHtcbiAgICAgICAgICAgIGVhY2hMaW1pdChpZHMsIGNvbmYuQ09OQ1VSUkVOVF9BQ1RJT05TLCAoaWQsIG5leHQpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdyZXNldE1ldGFQcm9jZXNzSWQnLCBpZCwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdSZXNldHRpbmcgbWV0YSBmb3IgcHJvY2VzcyBpZCAlZCcsIGlkKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoQ29tbW9uLnJldEVycihlcnIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCB7IHN1Y2Nlc3M6IHRydWUgfSkgOiB0aGlzLnNwZWVkTGlzdCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvY2Vzc19uYW1lID09ICdhbGwnKSB7XG4gICAgICAgICAgICB0aGlzLkNsaWVudC5nZXRBbGxQcm9jZXNzSWQoKGVyciwgaWRzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzSWRzKGlkcywgY2IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNOYU4ocHJvY2Vzc19uYW1lKSkge1xuICAgICAgICAgICAgdGhpcy5DbGllbnQuZ2V0UHJvY2Vzc0lkQnlOYW1lKHByb2Nlc3NfbmFtZSwgKGVyciwgaWRzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKCdVbmtub3duIHByb2Nlc3MgbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoJ1Vua25vd24gcHJvY2VzcyBuYW1lJykpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzSWRzKGlkcywgY2IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm9jZXNzSWRzKFtwcm9jZXNzX25hbWVdLCBjYik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgZGFlbW9uaXplZCBQTTIgRGFlbW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBjYWxsYmFjayB3aGVuIHBtMiBoYXMgYmVlbiB1cGdyYWRlZFxuICAgICAqL1xuICAgIHVwZGF0ZSA9IChjYj8pID0+IHtcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KCdCZSBzdXJlIHRvIGhhdmUgdGhlIGxhdGVzdCB2ZXJzaW9uIGJ5IGRvaW5nIGBucG0gaW5zdGFsbCBwbTJAbGF0ZXN0IC1nYCBiZWZvcmUgZG9pbmcgdGhpcyBwcm9jZWR1cmUuJyk7XG5cbiAgICAgICAgLy8gRHVtcCBQTTIgcHJvY2Vzc2VzXG4gICAgICAgIHRoaXMuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ25vdGlmeUtpbGxQTTInLCB7fSwgZnVuY3Rpb24gKCkgeyB9KTtcblxuICAgICAgICB0aGlzLmdldFZlcnNpb24oKGVyciwgbmV3X3ZlcnNpb24pID0+IHtcbiAgICAgICAgICAgIC8vIElmIG5vdCBsaW5rZWQgdG8gUE0yIHBsdXMsIGFuZCB1cGRhdGUgUE0yIHRvIGxhdGVzdCwgZGlzcGxheSBtb3RkLnVwZGF0ZVxuICAgICAgICAgICAgaWYgKCF0aGlzLmdsX2lzX2ttX2xpbmtlZCAmJiAhZXJyICYmIChwa2cudmVyc2lvbiAhPSBuZXdfdmVyc2lvbikpIHtcbiAgICAgICAgICAgICAgICB2YXIgZHQgPSBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgdGhpcy5fY29uZi5QTTJfVVBEQVRFKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZHQudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZHVtcCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgZGVidWcoJ0R1bXBpbmcgc3VjY2Vzc2Z1bGwnLCBlcnIpO1xuICAgICAgICAgICAgICAgIHRoaXMua2lsbERhZW1vbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGRlYnVnKCctLS0tLS0tLS0tLS0tLS0tLS0gRXZlcnl0aGluZyBraWxsZWQnLCBhcmd1bWVudHMgYXMgYW55KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5DbGllbnQubGF1bmNoRGFlbW9uKHsgaW50ZXJhY3RvcjogZmFsc2UgfSwgKGVyciwgY2hpbGQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuQ2xpZW50LmxhdW5jaFJQQygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN1cnJlY3QoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY2hhbGsuYmx1ZS5ib2xkKCc+Pj4+Pj4+Pj4+IFBNMiB1cGRhdGVkJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhdW5jaEFsbCh0aGlzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBLTURhZW1vbi5sYXVuY2hBbmRJbnRlcmFjdCh0aGlzLl9jb25mLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG0yX3ZlcnNpb246IHBrZy52ZXJzaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAoZXJyLCBkYXRhLCBpbnRlcmFjdG9yX3Byb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCB7IHN1Y2Nlc3M6IHRydWUgfSkgOiB0aGlzLnNwZWVkTGlzdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMjUwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVsb2FkIGFuIGFwcGxpY2F0aW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvY2Vzc19uYW1lIEFwcGxpY2F0aW9uIE5hbWUgb3IgQWxsXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgICAgICAgICBPcHRpb25zXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgICAgICAgICBDYWxsYmFja1xuICAgICAqL1xuICAgIHJlbG9hZChwcm9jZXNzX25hbWUsIG9wdHMsIGNiPykge1xuICAgICAgICBpZiAodHlwZW9mIChvcHRzKSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNiID0gb3B0cztcbiAgICAgICAgICAgIG9wdHMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkZWxheSA9IENvbW1vbi5sb2NrUmVsb2FkKCk7XG4gICAgICAgIGlmIChkZWxheSA+IDAgJiYgb3B0cy5mb3JjZSAhPSB0cnVlKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ1JlbG9hZCBhbHJlYWR5IGluIHByb2dyZXNzLCBwbGVhc2UgdHJ5IGFnYWluIGluICcgKyBNYXRoLmZsb29yKChjb25mLlJFTE9BRF9MT0NLX1RJTUVPVVQgLSBkZWxheSkgLyAxMDAwKSArICcgc2Vjb25kcyBvciB1c2UgLS1mb3JjZScpO1xuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKCdSZWxvYWQgaW4gcHJvZ3Jlc3MnKSkgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChDb21tb24uaXNDb25maWdGaWxlKHByb2Nlc3NfbmFtZSkpXG4gICAgICAgICAgICB0aGlzLl9zdGFydEpzb24ocHJvY2Vzc19uYW1lLCBvcHRzLCAncmVsb2FkUHJvY2Vzc0lkJywgKGVyciwgYXBwcykgPT4ge1xuICAgICAgICAgICAgICAgIENvbW1vbi51bmxvY2tSZWxvYWQoKTtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgYXBwcykgOiB0aGlzLmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKG9wdHMgJiYgb3B0cy5lbnYpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyID0gJ1VzaW5nIC0tZW52IFtlbnZdIHdpdGhvdXQgcGFzc2luZyB0aGUgZWNvc3lzdGVtLmNvbmZpZy5qcyBkb2VzIG5vdCB3b3JrJ1xuICAgICAgICAgICAgICAgIENvbW1vbi5lcnIoZXJyKTtcbiAgICAgICAgICAgICAgICBDb21tb24udW5sb2NrUmVsb2FkKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoaXMuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3B0cyAmJiAhb3B0cy51cGRhdGVFbnYpXG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KElNTVVUQUJMRV9NU0cpO1xuXG4gICAgICAgICAgICB0aGlzLl9vcGVyYXRlKCdyZWxvYWRQcm9jZXNzSWQnLCBwcm9jZXNzX25hbWUsIG9wdHMsIGZ1bmN0aW9uIChlcnIsIGFwcHMpIHtcbiAgICAgICAgICAgICAgICBDb21tb24udW5sb2NrUmVsb2FkKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgYXBwcykgOiB0aGlzLmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXN0YXJ0IHByb2Nlc3NcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjbWQgICBBcHBsaWNhdGlvbiBOYW1lIC8gUHJvY2VzcyBpZCAvIEpTT04gYXBwbGljYXRpb24gZmlsZSAvICdhbGwnXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgIEV4dHJhIG9wdGlvbnMgdG8gYmUgdXBkYXRlZFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiICBDYWxsYmFja1xuICAgICAqL1xuICAgIHJlc3RhcnQoY21kLCBvcHRzLCBjYikge1xuICAgICAgICBpZiAodHlwZW9mIChvcHRzKSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNiID0gb3B0cztcbiAgICAgICAgICAgIG9wdHMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKGNtZCkgPT09ICdudW1iZXInKVxuICAgICAgICAgICAgY21kID0gY21kLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgaWYgKGNtZCA9PSBcIi1cIikge1xuICAgICAgICAgICAgLy8gUmVzdGFydCBmcm9tIFBJUEVEIEpTT05cbiAgICAgICAgICAgIHByb2Nlc3Muc3RkaW4ucmVzdW1lKCk7XG4gICAgICAgICAgICBwcm9jZXNzLnN0ZGluLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgICAgICAgICBwcm9jZXNzLnN0ZGluLm9uKCdkYXRhJywgKHBhcmFtKSA9PiB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5zdGRpbi5wYXVzZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uRnJvbUpzb24oJ3Jlc3RhcnRQcm9jZXNzSWQnLCBwYXJhbSwgb3B0cywgJ3BpcGUnLCBjYik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChDb21tb24uaXNDb25maWdGaWxlKGNtZCkgfHwgdHlwZW9mIChjbWQpID09PSAnb2JqZWN0JylcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0SnNvbihjbWQsIG9wdHMsICdyZXN0YXJ0UHJvY2Vzc0lkJywgY2IpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChvcHRzICYmIG9wdHMuZW52KSB7XG4gICAgICAgICAgICAgICAgdmFyIGVyciA9ICdVc2luZyAtLWVudiBbZW52XSB3aXRob3V0IHBhc3NpbmcgdGhlIGVjb3N5c3RlbS5jb25maWcuanMgZG9lcyBub3Qgd29yaydcbiAgICAgICAgICAgICAgICBDb21tb24uZXJyKGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoaXMuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdHMgJiYgIW9wdHMudXBkYXRlRW52KVxuICAgICAgICAgICAgICAgIENvbW1vbi5wcmludE91dChJTU1VVEFCTEVfTVNHKTtcbiAgICAgICAgICAgIHRoaXMuX29wZXJhdGUoJ3Jlc3RhcnRQcm9jZXNzSWQnLCBjbWQsIG9wdHMsIGNiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZSBwcm9jZXNzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvY2Vzc19uYW1lIEFwcGxpY2F0aW9uIE5hbWUgLyBQcm9jZXNzIGlkIC8gQXBwbGljYXRpb24gZmlsZSAvICdhbGwnXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgQ2FsbGJhY2tcbiAgICAgKi9cbiAgICBkZWxldGUocHJvY2Vzc19uYW1lLCBqc29uVmlhLCBjYj8pIHtcbiAgICAgICAgaWYgKHR5cGVvZiAoanNvblZpYSkgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgY2IgPSBqc29uVmlhO1xuICAgICAgICAgICAganNvblZpYSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChwcm9jZXNzX25hbWUpID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICBwcm9jZXNzX25hbWUgPSBwcm9jZXNzX25hbWUudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChqc29uVmlhID09ICdwaXBlJylcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGlvbkZyb21Kc29uKCdkZWxldGVQcm9jZXNzSWQnLCBwcm9jZXNzX25hbWUsIGNvbW1hbmRlciwgJ3BpcGUnLCAoZXJyLCBwcm9jcykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVyciwgcHJvY3MpIDogdGhpcy5zcGVlZExpc3QoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIGlmIChDb21tb24uaXNDb25maWdGaWxlKHByb2Nlc3NfbmFtZSkpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hY3Rpb25Gcm9tSnNvbignZGVsZXRlUHJvY2Vzc0lkJywgcHJvY2Vzc19uYW1lLCBjb21tYW5kZXIsICdmaWxlJywgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIsIHByb2NzKSA6IHRoaXMuc3BlZWRMaXN0KClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX29wZXJhdGUoJ2RlbGV0ZVByb2Nlc3NJZCcsIHByb2Nlc3NfbmFtZSwgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIsIHByb2NzKSA6IHRoaXMuc3BlZWRMaXN0KClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RvcCBwcm9jZXNzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvY2Vzc19uYW1lIEFwcGxpY2F0aW9uIE5hbWUgLyBQcm9jZXNzIGlkIC8gQXBwbGljYXRpb24gZmlsZSAvICdhbGwnXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgQ2FsbGJhY2tcbiAgICAgKi9cbiAgICBzdG9wKHByb2Nlc3NfbmFtZSwgY2IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiAocHJvY2Vzc19uYW1lKSA9PT0gJ251bWJlcicpXG4gICAgICAgICAgICBwcm9jZXNzX25hbWUgPSBwcm9jZXNzX25hbWUudG9TdHJpbmcoKTtcblxuICAgICAgICBpZiAocHJvY2Vzc19uYW1lID09IFwiLVwiKSB7XG4gICAgICAgICAgICBwcm9jZXNzLnN0ZGluLnJlc3VtZSgpO1xuICAgICAgICAgICAgcHJvY2Vzcy5zdGRpbi5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgICAgICAgICAgcHJvY2Vzcy5zdGRpbi5vbignZGF0YScsIChwYXJhbSkgPT4ge1xuICAgICAgICAgICAgICAgIHByb2Nlc3Muc3RkaW4ucGF1c2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvbkZyb21Kc29uKCdzdG9wUHJvY2Vzc0lkJywgcGFyYW0sIGNvbW1hbmRlciwgJ3BpcGUnLCAoZXJyLCBwcm9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIsIHByb2NzKSA6IHRoaXMuc3BlZWRMaXN0KClcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoQ29tbW9uLmlzQ29uZmlnRmlsZShwcm9jZXNzX25hbWUpKVxuICAgICAgICAgICAgdGhpcy5hY3Rpb25Gcm9tSnNvbignc3RvcFByb2Nlc3NJZCcsIHByb2Nlc3NfbmFtZSwgY29tbWFuZGVyLCAnZmlsZScsIChlcnIsIHByb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5fb3BlcmF0ZSgnc3RvcFByb2Nlc3NJZCcsIHByb2Nlc3NfbmFtZSwgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIsIHByb2NzKSA6IHRoaXMuc3BlZWRMaXN0KClcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBsaXN0IG9mIGFsbCBwcm9jZXNzZXMgbWFuYWdlZFxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgQ2FsbGJhY2tcbiAgICAgKi9cbiAgICBsaXN0KG9wdHM/LCBjYj8pIHtcbiAgICAgICAgaWYgKHR5cGVvZiAob3B0cykgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2IgPSBvcHRzO1xuICAgICAgICAgICAgb3B0cyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCAoZXJyLCBsaXN0KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHRzICYmIG9wdHMucmF3QXJncyAmJiBvcHRzLnJhd0FyZ3MuaW5kZXhPZignLS13YXRjaCcpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzaG93ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZSgnXFx4MWJbMkonKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoJ1xceDFiWzBmJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdMYXN0IHJlZnJlc2g6ICcsIGRheWpzKCkuZm9ybWF0KCkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCAoZXJyLCBsaXN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBVWC5saXN0KGxpc3QsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzaG93KCk7XG4gICAgICAgICAgICAgICAgc2V0SW50ZXJ2YWwoc2hvdywgOTAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGxpc3QpIDogdGhpcy5zcGVlZExpc3QobnVsbCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEtpbGwgRGFlbW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBDYWxsYmFja1xuICAgICAqL1xuICAgIGtpbGxEYWVtb24oY2IpIHtcbiAgICAgICAgcHJvY2Vzcy5lbnYuUE0yX1NUQVRVUyA9ICdzdG9wcGluZydcblxuICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdub3RpZnlLaWxsUE0yJywge30sIGZ1bmN0aW9uICgpIHsgfSk7XG5cbiAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdbdl0gTW9kdWxlcyBTdG9wcGVkJyk7XG5cbiAgICAgICAgdGhpcy5fb3BlcmF0ZSgnZGVsZXRlUHJvY2Vzc0lkJywgJ2FsbCcsIChlcnIsIGxpc3QpID0+IHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnW3ZdIEFsbCBBcHBsaWNhdGlvbnMgU3RvcHBlZCcpO1xuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCA9ICdmYWxzZSc7XG5cbiAgICAgICAgICAgIHRoaXMua2lsbEFnZW50KChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWVycikge1xuICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1t2XSBBZ2VudCBTdG9wcGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5DbGllbnQua2lsbERhZW1vbigoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdbdl0gUE0yIERhZW1vbiBTdG9wcGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVyciwgcmVzKSA6IHRoaXMuZXhpdENsaShjb25mLlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGtpbGwoY2IpIHtcbiAgICAgICAgdGhpcy5raWxsRGFlbW9uKGNiKTtcbiAgICB9XG5cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBQcml2YXRlIG1ldGhvZHMgLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBTVEFSVCAvIFJFU1RBUlQgYSBzY3JpcHRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNjcmlwdCBzY3JpcHQgbmFtZSAod2lsbCBiZSByZXNvbHZlZCBhY2NvcmRpbmcgdG8gbG9jYXRpb24pXG4gICAgICovXG4gICAgX3N0YXJ0U2NyaXB0KHNjcmlwdCwgb3B0cywgY2IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRzID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgY2IgPSBvcHRzO1xuICAgICAgICAgICAgb3B0cyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbW1hbmRlci5qcyB0cmlja3NcbiAgICAgICAgICovXG4gICAgICAgIHZhciBhcHBfY29uZjogYW55ID0gQ29uZmlnLmZpbHRlck9wdGlvbnMob3B0cyk7XG4gICAgICAgIHZhciBhcHBDb25mID0ge307XG5cbiAgICAgICAgaWYgKHR5cGVvZiBhcHBfY29uZi5uYW1lID09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICBkZWxldGUgYXBwX2NvbmYubmFtZTtcblxuICAgICAgICBkZWxldGUgYXBwX2NvbmYuYXJncztcblxuICAgICAgICAvLyBSZXRyaWV2ZSBhcmd1bWVudHMgdmlhIC0tIDxhcmdzPlxuICAgICAgICB2YXIgYXJnc0luZGV4O1xuXG4gICAgICAgIGlmIChvcHRzLnJhd0FyZ3MgJiYgKGFyZ3NJbmRleCA9IG9wdHMucmF3QXJncy5pbmRleE9mKCctLScpKSA+PSAwKVxuICAgICAgICAgICAgYXBwX2NvbmYuYXJncyA9IG9wdHMucmF3QXJncy5zbGljZShhcmdzSW5kZXggKyAxKTtcbiAgICAgICAgZWxzZSBpZiAob3B0cy5zY3JpcHRBcmdzKVxuICAgICAgICAgICAgYXBwX2NvbmYuYXJncyA9IG9wdHMuc2NyaXB0QXJncztcblxuICAgICAgICBhcHBfY29uZi5zY3JpcHQgPSBzY3JpcHQ7XG4gICAgICAgIGlmICghYXBwX2NvbmYubmFtZXNwYWNlKVxuICAgICAgICAgICAgYXBwX2NvbmYubmFtZXNwYWNlID0gJ2RlZmF1bHQnO1xuXG4gICAgICAgIGlmICgoYXBwQ29uZiA9IENvbW1vbi52ZXJpZnlDb25mcyhhcHBfY29uZikpIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgIENvbW1vbi5lcnIoYXBwQ29uZilcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoYXBwQ29uZikpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cblxuICAgICAgICBhcHBfY29uZiA9IGFwcENvbmZbMF07XG5cbiAgICAgICAgaWYgKG9wdHMud2F0Y2hEZWxheSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRzLndhdGNoRGVsYXkgPT09IFwic3RyaW5nXCIgJiYgb3B0cy53YXRjaERlbGF5LmluZGV4T2YoXCJtc1wiKSAhPT0gLTEpXG4gICAgICAgICAgICAgICAgYXBwX2NvbmYud2F0Y2hfZGVsYXkgPSBwYXJzZUludChvcHRzLndhdGNoRGVsYXkpO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYXBwX2NvbmYud2F0Y2hfZGVsYXkgPSBwYXJzZUZsb2F0KG9wdHMud2F0Y2hEZWxheSkgKiAxMDAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1hcyA9IFtdO1xuICAgICAgICBpZiAodHlwZW9mIG9wdHMuZXh0ICE9ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgaGYubWFrZV9hdmFpbGFibGVfZXh0ZW5zaW9uKG9wdHMsIG1hcyk7IC8vIGZvciAtZSBmbGFnXG4gICAgICAgIG1hcy5sZW5ndGggPiAwID8gYXBwX2NvbmYuaWdub3JlX3dhdGNoID0gbWFzIDogMDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgLXcgb3B0aW9uLCB3cml0ZSBjb25maWd1cmF0aW9uIHRvIGNvbmZpZ3VyYXRpb24uanNvbiBmaWxlXG4gICAgICAgICAqL1xuICAgICAgICBpZiAoYXBwX2NvbmYud3JpdGUpIHtcbiAgICAgICAgICAgIHZhciBkc3RfcGF0aCA9IHBhdGguam9pbihwcm9jZXNzLmVudi5QV0QgfHwgcHJvY2Vzcy5jd2QoKSwgYXBwX2NvbmYubmFtZSArICctcG0yLmpzb24nKTtcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnV3JpdGluZyBjb25maWd1cmF0aW9uIHRvJywgY2hhbGsuYmx1ZShkc3RfcGF0aCkpO1xuICAgICAgICAgICAgLy8gcHJldHR5IEpTT05cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhkc3RfcGF0aCwgSlNPTi5zdHJpbmdpZnkoYXBwX2NvbmYsIG51bGwsIDIpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgc3RhcnQgPGFwcF9uYW1lPiBzdGFydC9yZXN0YXJ0IGFwcGxpY2F0aW9uXG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCByZXN0YXJ0RXhpc3RpbmdQcm9jZXNzTmFtZSA9IChjYikgPT4ge1xuICAgICAgICAgICAgaWYgKCFpc05hTihzY3JpcHQpIHx8XG4gICAgICAgICAgICAgICAgKHR5cGVvZiBzY3JpcHQgPT09ICdzdHJpbmcnICYmIHNjcmlwdC5pbmRleE9mKCcvJykgIT0gLTEpIHx8XG4gICAgICAgICAgICAgICAgKHR5cGVvZiBzY3JpcHQgPT09ICdzdHJpbmcnICYmIHBhdGguZXh0bmFtZShzY3JpcHQpICE9PSAnJykpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiKG51bGwpO1xuXG4gICAgICAgICAgICB0aGlzLkNsaWVudC5nZXRQcm9jZXNzSWRCeU5hbWUoc2NyaXB0LCAoZXJyLCBpZHMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyICYmIGNiKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgICAgICAgICBpZiAoaWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb3BlcmF0ZSgncmVzdGFydFByb2Nlc3NJZCcsIHNjcmlwdCwgb3B0cywgZnVuY3Rpb24gKGVyciwgbGlzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1Byb2Nlc3Mgc3VjY2Vzc2Z1bGx5IHN0YXJ0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYih0cnVlLCBsaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIGNiKG51bGwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgc3RhcnQgPG5hbWVzcGFjZT4gc3RhcnQvcmVzdGFydCBuYW1lc3BhY2VcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIHJlc3RhcnRFeGlzdGluZ05hbWVTcGFjZShjYikge1xuICAgICAgICAgICAgaWYgKCFpc05hTihzY3JpcHQpIHx8XG4gICAgICAgICAgICAgICAgKHR5cGVvZiBzY3JpcHQgPT09ICdzdHJpbmcnICYmIHNjcmlwdC5pbmRleE9mKCcvJykgIT0gLTEpIHx8XG4gICAgICAgICAgICAgICAgKHR5cGVvZiBzY3JpcHQgPT09ICdzdHJpbmcnICYmIHBhdGguZXh0bmFtZShzY3JpcHQpICE9PSAnJykpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiKG51bGwpO1xuXG4gICAgICAgICAgICBpZiAoc2NyaXB0ICE9PSAnYWxsJykge1xuICAgICAgICAgICAgICAgIHRoaXMuQ2xpZW50LmdldFByb2Nlc3NJZHNCeU5hbWVzcGFjZShzY3JpcHQsIChlcnIsIGlkcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyICYmIGNiKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9vcGVyYXRlKCdyZXN0YXJ0UHJvY2Vzc0lkJywgc2NyaXB0LCBvcHRzLCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdQcm9jZXNzIHN1Y2Nlc3NmdWxseSBzdGFydGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiKHRydWUsIGxpc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gY2IobnVsbCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vcGVyYXRlKCdyZXN0YXJ0UHJvY2Vzc0lkJywgJ2FsbCcsIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnUHJvY2VzcyBzdWNjZXNzZnVsbHkgc3RhcnRlZCcpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IodHJ1ZSwgbGlzdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXN0YXJ0RXhpc3RpbmdQcm9jZXNzSWQgPSAoY2IpID0+IHtcbiAgICAgICAgICAgIGlmIChpc05hTihzY3JpcHQpKSByZXR1cm4gY2IobnVsbCk7XG5cbiAgICAgICAgICAgIHRoaXMuX29wZXJhdGUoJ3Jlc3RhcnRQcm9jZXNzSWQnLCBzY3JpcHQsIG9wdHMsIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1Byb2Nlc3Mgc3VjY2Vzc2Z1bGx5IHN0YXJ0ZWQnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IodHJ1ZSwgbGlzdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXN0YXJ0IGEgcHJvY2VzcyB3aXRoIHRoZSBzYW1lIGZ1bGwgcGF0aFxuICAgICAgICAgKiBPciBzdGFydCBpdFxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgcmVzdGFydEV4aXN0aW5nUHJvY2Vzc1BhdGhPclN0YXJ0TmV3ID0gKGNiKSA9PiB7XG4gICAgICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCAoZXJyLCBwcm9jcykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcihlcnIpKSA6IHRoaXMuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGZ1bGxfcGF0aCA9IHBhdGgucmVzb2x2ZSh0aGlzLmN3ZCwgc2NyaXB0KTtcbiAgICAgICAgICAgICAgICB2YXIgbWFuYWdlZF9zY3JpcHQgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgcHJvY3MuZm9yRWFjaChmdW5jdGlvbiAocHJvYykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX2V4ZWNfcGF0aCA9PSBmdWxsX3BhdGggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2MucG0yX2Vudi5uYW1lID09IGFwcF9jb25mLm5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkX3NjcmlwdCA9IHByb2M7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAobWFuYWdlZF9zY3JpcHQgJiZcbiAgICAgICAgICAgICAgICAgICAgKG1hbmFnZWRfc2NyaXB0LnBtMl9lbnYuc3RhdHVzID09IGNvbmYuU1RPUFBFRF9TVEFUVVMgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hbmFnZWRfc2NyaXB0LnBtMl9lbnYuc3RhdHVzID09IGNvbmYuU1RPUFBJTkdfU1RBVFVTIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBtYW5hZ2VkX3NjcmlwdC5wbTJfZW52LnN0YXR1cyA9PSBjb25mLkVSUk9SRURfU1RBVFVTKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZXN0YXJ0IHByb2Nlc3MgaWYgc3RvcHBlZFxuICAgICAgICAgICAgICAgICAgICB2YXIgYXBwX25hbWUgPSBtYW5hZ2VkX3NjcmlwdC5wbTJfZW52Lm5hbWU7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb3BlcmF0ZSgncmVzdGFydFByb2Nlc3NJZCcsIGFwcF9uYW1lLCBvcHRzLCAoZXJyLCBsaXN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoZXJyKSkgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnUHJvY2VzcyBzdWNjZXNzZnVsbHkgc3RhcnRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiKHRydWUsIGxpc3QpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChtYW5hZ2VkX3NjcmlwdCAmJiAhb3B0cy5mb3JjZSkge1xuICAgICAgICAgICAgICAgICAgICBDb21tb24uZXJyKCdTY3JpcHQgYWxyZWFkeSBsYXVuY2hlZCwgYWRkIC1mIG9wdGlvbiB0byBmb3JjZSByZS1leGVjdXRpb24nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcignU2NyaXB0IGFscmVhZHkgbGF1bmNoZWQnKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHJlc29sdmVkX3BhdGhzID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVkX3BhdGhzID0gQ29tbW9uLnJlc29sdmVBcHBBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN3ZDogdGhpcy5jd2QsXG4gICAgICAgICAgICAgICAgICAgICAgICBwbTJfaG9tZTogdGhpcy5wbTJfaG9tZVxuICAgICAgICAgICAgICAgICAgICB9LCBhcHBfY29uZik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBDb21tb24uZXJyKGUubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYihDb21tb24ucmV0RXJyKGUpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1N0YXJ0aW5nICVzIGluICVzICglZCBpbnN0YW5jZScgKyAocmVzb2x2ZWRfcGF0aHMuaW5zdGFuY2VzID4gMSA/ICdzJyA6ICcnKSArICcpJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRfcGF0aHMucG1fZXhlY19wYXRoLCByZXNvbHZlZF9wYXRocy5leGVjX21vZGUsIHJlc29sdmVkX3BhdGhzLmluc3RhbmNlcyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkX3BhdGhzLmVudikgcmVzb2x2ZWRfcGF0aHMuZW52ID0ge307XG5cbiAgICAgICAgICAgICAgICAvLyBTZXQgUE0yIEhPTUUgaW4gY2FzZSBvZiBjaGlsZCBwcm9jZXNzIHVzaW5nIFBNMiBBUElcbiAgICAgICAgICAgICAgICByZXNvbHZlZF9wYXRocy5lbnZbJ1BNMl9IT01FJ10gPSB0aGlzLnBtMl9ob21lO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFkZGl0aW9uYWxfZW52ID0gTW9kdWxhcml6ZXIuZ2V0QWRkaXRpb25hbENvbmYocmVzb2x2ZWRfcGF0aHMubmFtZSk7XG4gICAgICAgICAgICAgICAgdXRpbC5pbmhlcml0cyhyZXNvbHZlZF9wYXRocy5lbnYsIGFkZGl0aW9uYWxfZW52KTtcblxuICAgICAgICAgICAgICAgIC8vIElzIEtNIGxpbmtlZD9cbiAgICAgICAgICAgICAgICByZXNvbHZlZF9wYXRocy5rbV9saW5rID0gdGhpcy5nbF9pc19rbV9saW5rZWQ7XG5cbiAgICAgICAgICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdwcmVwYXJlJywgcmVzb2x2ZWRfcGF0aHMsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdFcnJvciB3aGlsZSBsYXVuY2hpbmcgYXBwbGljYXRpb24nLCBlcnIuc3RhY2sgfHwgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYihDb21tb24ucmV0RXJyKGVycikpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdEb25lLicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IodHJ1ZSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXJpZXMoW1xuICAgICAgICAgICAgcmVzdGFydEV4aXN0aW5nUHJvY2Vzc05hbWUsXG4gICAgICAgICAgICByZXN0YXJ0RXhpc3RpbmdOYW1lU3BhY2UsXG4gICAgICAgICAgICByZXN0YXJ0RXhpc3RpbmdQcm9jZXNzSWQsXG4gICAgICAgICAgICByZXN0YXJ0RXhpc3RpbmdQcm9jZXNzUGF0aE9yU3RhcnROZXdcbiAgICAgICAgXSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKVxuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVycikgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcblxuICAgICAgICAgICAgdmFyIHJldCA9IHt9O1xuXG4gICAgICAgICAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24gKF9kdCkge1xuICAgICAgICAgICAgICAgIGlmIChfZHQgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAgICAgcmV0ID0gX2R0O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJldCkgOiB0aGlzLnNwZWVkTGlzdCgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gc3RhcnQvcmVzdGFydC9yZWxvYWQgcHJvY2Vzc2VzIGZyb20gYSBKU09OIGZpbGVcbiAgICAgKiBJdCB3aWxsIHN0YXJ0IGFwcCBub3Qgc3RhcnRlZFxuICAgICAqIENhbiByZWNlaXZlIG9ubHkgb3B0aW9uIHRvIHNraXAgYXBwbGljYXRpb25zXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9zdGFydEpzb24oZmlsZSwgb3B0cywgYWN0aW9uLCBwaXBlPywgY2I/KSB7XG4gICAgICAgIHZhciBjb25maWc6IGFueSA9IHt9O1xuICAgICAgICB2YXIgYXBwQ29uZjogYW55W10gPSBbXTtcbiAgICAgICAgdmFyIHN0YXRpY0NvbmYgPSBbXTtcbiAgICAgICAgdmFyIGRlcGxveUNvbmYgPSB7fTtcbiAgICAgICAgdmFyIGFwcHNfaW5mbyA9IFtdO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgRmlsZSBjb25maWd1cmF0aW9uXG4gICAgICAgICAqL1xuICAgICAgICBpZiAodHlwZW9mIChjYikgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiAocGlwZSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNiID0gcGlwZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIChmaWxlKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNvbmZpZyA9IGZpbGU7XG4gICAgICAgIH0gZWxzZSBpZiAocGlwZSA9PT0gJ3BpcGUnKSB7XG4gICAgICAgICAgICBjb25maWcgPSBDb21tb24ucGFyc2VDb25maWcoZmlsZSwgJ3BpcGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gbnVsbDtcblxuICAgICAgICAgICAgdmFyIGlzQWJzb2x1dGUgPSBwYXRoLmlzQWJzb2x1dGUoZmlsZSlcbiAgICAgICAgICAgIHZhciBmaWxlX3BhdGggPSBpc0Fic29sdXRlID8gZmlsZSA6IHBhdGguam9pbih0aGlzLmN3ZCwgZmlsZSk7XG5cbiAgICAgICAgICAgIGRlYnVnKCdSZXNvbHZlZCBmaWxlcGF0aCAlcycsIGZpbGVfcGF0aCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhmaWxlX3BhdGgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnRmlsZSAnICsgZmlsZSArICcgbm90IGZvdW5kJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlKSkgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25maWcgPSBDb21tb24ucGFyc2VDb25maWcoZGF0YSwgZmlsZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdGaWxlICcgKyBmaWxlICsgJyBtYWxmb3JtYXRlZCcpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlKSkgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbGlhcyBzb21lIG9wdGlvbmFsIGZpZWxkc1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKGNvbmZpZy5kZXBsb3kpXG4gICAgICAgICAgICBkZXBsb3lDb25mID0gY29uZmlnLmRlcGxveTtcbiAgICAgICAgaWYgKGNvbmZpZy5zdGF0aWMpXG4gICAgICAgICAgICBzdGF0aWNDb25mID0gY29uZmlnLnN0YXRpYztcbiAgICAgICAgaWYgKGNvbmZpZy5hcHBzKVxuICAgICAgICAgICAgYXBwQ29uZiA9IGNvbmZpZy5hcHBzO1xuICAgICAgICBlbHNlIGlmIChjb25maWcucG0yKVxuICAgICAgICAgICAgYXBwQ29uZiA9IGNvbmZpZy5wbTI7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGFwcENvbmYgPSBjb25maWc7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShhcHBDb25mKSlcbiAgICAgICAgICAgIGFwcENvbmYgPSBbYXBwQ29uZl07XG5cbiAgICAgICAgaWYgKChhcHBDb25mID0gQ29tbW9uLnZlcmlmeUNvbmZzKGFwcENvbmYpKSBpbnN0YW5jZW9mIEVycm9yKVxuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoYXBwQ29uZikgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcblxuICAgICAgICBwcm9jZXNzLmVudi5QTTJfSlNPTl9QUk9DRVNTSU5HID0gXCJ0cnVlXCI7XG5cbiAgICAgICAgLy8gR2V0IEFwcCBsaXN0XG4gICAgICAgIHZhciBhcHBzX25hbWUgPSBbXTtcbiAgICAgICAgdmFyIHByb2NfbGlzdCA9IHt9O1xuXG4gICAgICAgIC8vIEFkZCBzdGF0aWNzIHRvIGFwcHNcbiAgICAgICAgc3RhdGljQ29uZi5mb3JFYWNoKGZ1bmN0aW9uIChzZXJ2ZSkge1xuICAgICAgICAgICAgYXBwQ29uZi5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBzZXJ2ZS5uYW1lID8gc2VydmUubmFtZSA6IGBzdGF0aWMtcGFnZS1zZXJ2ZXItJHtzZXJ2ZS5wb3J0fWAsXG4gICAgICAgICAgICAgICAgc2NyaXB0OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnQVBJJywgJ1NlcnZlLmpzJyksXG4gICAgICAgICAgICAgICAgZW52OiB7XG4gICAgICAgICAgICAgICAgICAgIFBNMl9TRVJWRV9QT1JUOiBzZXJ2ZS5wb3J0LFxuICAgICAgICAgICAgICAgICAgICBQTTJfU0VSVkVfSE9TVDogc2VydmUuaG9zdCxcbiAgICAgICAgICAgICAgICAgICAgUE0yX1NFUlZFX1BBVEg6IHNlcnZlLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIFBNMl9TRVJWRV9TUEE6IHNlcnZlLnNwYSxcbiAgICAgICAgICAgICAgICAgICAgUE0yX1NFUlZFX0RJUkVDVE9SWTogc2VydmUuZGlyZWN0b3J5LFxuICAgICAgICAgICAgICAgICAgICBQTTJfU0VSVkVfQkFTSUNfQVVUSDogc2VydmUuYmFzaWNfYXV0aCAhPT0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICBQTTJfU0VSVkVfQkFTSUNfQVVUSF9VU0VSTkFNRTogc2VydmUuYmFzaWNfYXV0aCA/IHNlcnZlLmJhc2ljX2F1dGgudXNlcm5hbWUgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBQTTJfU0VSVkVfQkFTSUNfQVVUSF9QQVNTV09SRDogc2VydmUuYmFzaWNfYXV0aCA/IHNlcnZlLmJhc2ljX2F1dGgucGFzc3dvcmQgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBQTTJfU0VSVkVfTU9OSVRPUjogc2VydmUubW9uaXRvclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIZXJlIHdlIHBpY2sgb25seSB0aGUgZmllbGQgd2Ugd2FudCBmcm9tIHRoZSBDTEkgd2hlbiBzdGFydGluZyBhIEpTT05cbiAgICAgICAgYXBwQ29uZi5mb3JFYWNoKGZ1bmN0aW9uIChhcHApIHtcbiAgICAgICAgICAgIGlmICghYXBwLmVudikgeyBhcHAuZW52ID0ge307IH1cbiAgICAgICAgICAgIGFwcC5lbnYuaW8gPSBhcHAuaW87XG4gICAgICAgICAgICAvLyAtLW9ubHkgPGFwcD5cbiAgICAgICAgICAgIGlmIChvcHRzLm9ubHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXBwcyA9IG9wdHMub25seS5zcGxpdCgvLHwgLylcbiAgICAgICAgICAgICAgICBpZiAoYXBwcy5pbmRleE9mKGFwcC5uYW1lKSA9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOYW1lc3BhY2VcbiAgICAgICAgICAgIGlmICghYXBwLm5hbWVzcGFjZSkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLm5hbWVzcGFjZSlcbiAgICAgICAgICAgICAgICAgICAgYXBwLm5hbWVzcGFjZSA9IG9wdHMubmFtZXNwYWNlO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYXBwLm5hbWVzcGFjZSA9ICdkZWZhdWx0JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIC0td2F0Y2hcbiAgICAgICAgICAgIGlmICghYXBwLndhdGNoICYmIG9wdHMud2F0Y2ggJiYgb3B0cy53YXRjaCA9PT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICBhcHAud2F0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgLy8gLS1pZ25vcmUtd2F0Y2hcbiAgICAgICAgICAgIGlmICghYXBwLmlnbm9yZV93YXRjaCAmJiBvcHRzLmlnbm9yZV93YXRjaClcbiAgICAgICAgICAgICAgICBhcHAuaWdub3JlX3dhdGNoID0gb3B0cy5pZ25vcmVfd2F0Y2g7XG4gICAgICAgICAgICBpZiAob3B0cy5pbnN0YWxsX3VybClcbiAgICAgICAgICAgICAgICBhcHAuaW5zdGFsbF91cmwgPSBvcHRzLmluc3RhbGxfdXJsO1xuICAgICAgICAgICAgLy8gLS1pbnN0YW5jZXMgPG5iPlxuICAgICAgICAgICAgaWYgKG9wdHMuaW5zdGFuY2VzICYmIHR5cGVvZiAob3B0cy5pbnN0YW5jZXMpID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgICAgICBhcHAuaW5zdGFuY2VzID0gb3B0cy5pbnN0YW5jZXM7XG4gICAgICAgICAgICAvLyAtLXVpZCA8dXNlcj5cbiAgICAgICAgICAgIGlmIChvcHRzLnVpZClcbiAgICAgICAgICAgICAgICBhcHAudWlkID0gb3B0cy51aWQ7XG4gICAgICAgICAgICAvLyAtLWdpZCA8dXNlcj5cbiAgICAgICAgICAgIGlmIChvcHRzLmdpZClcbiAgICAgICAgICAgICAgICBhcHAuZ2lkID0gb3B0cy5naWQ7XG4gICAgICAgICAgICAvLyBTcGVjaWZpY1xuICAgICAgICAgICAgaWYgKGFwcC5hcHBlbmRfZW52X3RvX25hbWUgJiYgb3B0cy5lbnYpXG4gICAgICAgICAgICAgICAgYXBwLm5hbWUgKz0gKCctJyArIG9wdHMuZW52KTtcbiAgICAgICAgICAgIGlmIChvcHRzLm5hbWVfcHJlZml4ICYmIGFwcC5uYW1lLmluZGV4T2Yob3B0cy5uYW1lX3ByZWZpeCkgPT0gLTEpXG4gICAgICAgICAgICAgICAgYXBwLm5hbWUgPSBgJHtvcHRzLm5hbWVfcHJlZml4fToke2FwcC5uYW1lfWBcblxuICAgICAgICAgICAgYXBwLnVzZXJuYW1lID0gQ29tbW9uLmdldEN1cnJlbnRVc2VybmFtZSgpO1xuICAgICAgICAgICAgYXBwc19uYW1lLnB1c2goYXBwLm5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCAoZXJyLCByYXdfcHJvY19saXN0KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVW5pcXVpZnkgaW4gbWVtb3J5IHByb2Nlc3MgbGlzdFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByYXdfcHJvY19saXN0LmZvckVhY2goZnVuY3Rpb24gKHByb2MpIHtcbiAgICAgICAgICAgICAgICBwcm9jX2xpc3RbcHJvYy5uYW1lXSA9IHByb2M7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBBdXRvIGRldGVjdCBhcHBsaWNhdGlvbiBhbHJlYWR5IHN0YXJ0ZWRcbiAgICAgICAgICAgICAqIGFuZCBhY3Qgb24gdGhlbSBkZXBlbmRpbmcgb24gYWN0aW9uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGVhY2hMaW1pdChPYmplY3Qua2V5cyhwcm9jX2xpc3QpLCBjb25mLkNPTkNVUlJFTlRfQUNUSU9OUywgKHByb2NfbmFtZSwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFNraXAgYXBwIG5hbWUgKC0tb25seSBvcHRpb24pXG4gICAgICAgICAgICAgICAgaWYgKGFwcHNfbmFtZS5pbmRleE9mKHByb2NfbmFtZSkgPT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIShhY3Rpb24gPT0gJ3JlbG9hZFByb2Nlc3NJZCcgfHxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID09ICdzb2Z0UmVsb2FkUHJvY2Vzc0lkJyB8fFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPT0gJ3Jlc3RhcnRQcm9jZXNzSWQnKSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXcm9uZyBhY3Rpb24gY2FsbGVkJyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgYXBwcyA9IGFwcENvbmYuZmlsdGVyKGZ1bmN0aW9uIChhcHApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFwcC5uYW1lID09IHByb2NfbmFtZTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHZhciBlbnZzID0gYXBwcy5tYXAoZnVuY3Rpb24gKGFwcCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBCaW5kcyBlbnZfZGlmZiB0byBlbnYgYW5kIHJldHVybnMgaXQuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBDb21tb24ubWVyZ2VFbnZpcm9ubWVudFZhcmlhYmxlcyhhcHAsIG9wdHMuZW52LCBkZXBsb3lDb25mKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIEFzc2lnbnMgb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiBhbGxcbiAgICAgICAgICAgICAgICAvLyBOb3RpY2U6IGlmIHBlb3BsZSB1c2UgdGhlIHNhbWUgbmFtZSBpbiBkaWZmZXJlbnQgYXBwcyxcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIGR1cGxpY2F0ZWQgZW52cyB3aWxsIGJlIG92ZXJyb2RlIGJ5IHRoZSBsYXN0IG9uZVxuICAgICAgICAgICAgICAgIHZhciBlbnYgPSBlbnZzLnJlZHVjZShmdW5jdGlvbiAoZTEsIGUyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1dGlsLmluaGVyaXRzKGUxLCBlMik7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBwcm9jZXNzaW5nIEpTT04sIGFsbG93IHRvIGtlZXAgdGhlIG5ldyBlbnYgYnkgZGVmYXVsdFxuICAgICAgICAgICAgICAgIGVudi51cGRhdGVFbnYgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgLy8gUGFzcyBgZW52YCBvcHRpb25cbiAgICAgICAgICAgICAgICB0aGlzLl9vcGVyYXRlKGFjdGlvbiwgcHJvY19uYW1lLCBlbnYsIChlcnIsIHJldCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEZvciByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgYXBwc19pbmZvID0gYXBwc19pbmZvLmNvbmNhdChyZXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuQ2xpZW50Lm5vdGlmeUdvZChhY3Rpb24sIHByb2NfbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFuZCBSZW1vdmUgZnJvbSBhcnJheSB0byBzcHlcbiAgICAgICAgICAgICAgICAgICAgYXBwc19uYW1lLnNwbGljZShhcHBzX25hbWUuaW5kZXhPZihwcm9jX25hbWUpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgICAgICBpZiAoYXBwc19uYW1lLmxlbmd0aCA+IDAgJiYgYWN0aW9uICE9ICdzdGFydCcpXG4gICAgICAgICAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0dfV0FSTklORyArICdBcHBsaWNhdGlvbnMgJXMgbm90IHJ1bm5pbmcsIHN0YXJ0aW5nLi4uJywgYXBwc19uYW1lLmpvaW4oJywgJykpO1xuICAgICAgICAgICAgICAgIC8vIFN0YXJ0IG1pc3NpbmcgYXBwc1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGFydEFwcHMoYXBwc19uYW1lLCBmdW5jdGlvbiAoZXJyLCBhcHBzKSB7XG4gICAgICAgICAgICAgICAgICAgIGFwcHNfaW5mbyA9IGFwcHNfaW5mby5jb25jYXQoYXBwcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVyciwgYXBwc19pbmZvKSA6IHRoaXMuc3BlZWRMaXN0KGVyciA/IDEgOiAwKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBzdGFydEFwcHMoYXBwX25hbWVfdG9fc3RhcnQsIGNiKSB7XG4gICAgICAgICAgICB2YXIgYXBwc190b19zdGFydCA9IFtdO1xuICAgICAgICAgICAgdmFyIGFwcHNfc3RhcnRlZCA9IFtdO1xuICAgICAgICAgICAgdmFyIGFwcHNfZXJyb3JlZCA9IFtdO1xuXG4gICAgICAgICAgICBhcHBDb25mLmZvckVhY2goZnVuY3Rpb24gKGFwcCwgaSkge1xuICAgICAgICAgICAgICAgIGlmIChhcHBfbmFtZV90b19zdGFydC5pbmRleE9mKGFwcC5uYW1lKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBhcHBzX3RvX3N0YXJ0LnB1c2goYXBwQ29uZltpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVhY2hMaW1pdChhcHBzX3RvX3N0YXJ0LCBjb25mLkNPTkNVUlJFTlRfQUNUSU9OUywgKGFwcCwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLmN3ZClcbiAgICAgICAgICAgICAgICAgICAgYXBwLmN3ZCA9IG9wdHMuY3dkO1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLmZvcmNlX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIGFwcC5uYW1lID0gb3B0cy5mb3JjZV9uYW1lO1xuICAgICAgICAgICAgICAgIGlmIChvcHRzLnN0YXJ0ZWRfYXNfbW9kdWxlKVxuICAgICAgICAgICAgICAgICAgICBhcHAucG14X21vZHVsZSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICB2YXIgcmVzb2x2ZWRfcGF0aHMgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgLy8gaGFyZGNvZGUgc2NyaXB0IG5hbWUgdG8gdXNlIGBzZXJ2ZWAgZmVhdHVyZSBpbnNpZGUgYSBwcm9jZXNzIGZpbGVcbiAgICAgICAgICAgICAgICBpZiAoYXBwLnNjcmlwdCA9PT0gJ3NlcnZlJykge1xuICAgICAgICAgICAgICAgICAgICBhcHAuc2NyaXB0ID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ0FQSScsICdTZXJ2ZS5qcycpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRfcGF0aHMgPSBDb21tb24ucmVzb2x2ZUFwcEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgY3dkOiB0aGlzLmN3ZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBtMl9ob21lOiB0aGlzLnBtMl9ob21lXG4gICAgICAgICAgICAgICAgICAgIH0sIGFwcCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBhcHBzX2Vycm9yZWQucHVzaChlKVxuICAgICAgICAgICAgICAgICAgICBDb21tb24uZXJyKGBFcnJvcjogJHtlLm1lc3NhZ2V9YClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkX3BhdGhzLmVudikgcmVzb2x2ZWRfcGF0aHMuZW52ID0ge307XG5cbiAgICAgICAgICAgICAgICAvLyBTZXQgUE0yIEhPTUUgaW4gY2FzZSBvZiBjaGlsZCBwcm9jZXNzIHVzaW5nIFBNMiBBUElcbiAgICAgICAgICAgICAgICByZXNvbHZlZF9wYXRocy5lbnZbJ1BNMl9IT01FJ10gPSB0aGlzLnBtMl9ob21lO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFkZGl0aW9uYWxfZW52ID0gTW9kdWxhcml6ZXIuZ2V0QWRkaXRpb25hbENvbmYocmVzb2x2ZWRfcGF0aHMubmFtZSk7XG4gICAgICAgICAgICAgICAgdXRpbC5pbmhlcml0cyhyZXNvbHZlZF9wYXRocy5lbnYsIGFkZGl0aW9uYWxfZW52KTtcblxuICAgICAgICAgICAgICAgIHJlc29sdmVkX3BhdGhzLmVudiA9IENvbW1vbi5tZXJnZUVudmlyb25tZW50VmFyaWFibGVzKHJlc29sdmVkX3BhdGhzLCBvcHRzLmVudiwgZGVwbG95Q29uZik7XG5cbiAgICAgICAgICAgICAgICBkZWxldGUgcmVzb2x2ZWRfcGF0aHMuZW52LmN1cnJlbnRfY29uZjtcblxuICAgICAgICAgICAgICAgIC8vIElzIEtNIGxpbmtlZD9cbiAgICAgICAgICAgICAgICByZXNvbHZlZF9wYXRocy5rbV9saW5rID0gdGhpcy5nbF9pc19rbV9saW5rZWQ7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzb2x2ZWRfcGF0aHMud2FpdF9yZWFkeSkge1xuICAgICAgICAgICAgICAgICAgICBDb21tb24ud2FybihgQXBwICR7cmVzb2x2ZWRfcGF0aHMubmFtZX0gaGFzIG9wdGlvbiAnd2FpdF9yZWFkeScgc2V0LCB3YWl0aW5nIGZvciBhcHAgdG8gYmUgcmVhZHkuLi5gKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdwcmVwYXJlJywgcmVzb2x2ZWRfcGF0aHMsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdQcm9jZXNzIGZhaWxlZCB0byBsYXVuY2ggJXMnLCBlcnIubWVzc2FnZSA/IGVyci5tZXNzYWdlIDogZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ1Byb2Nlc3MgY29uZmlnIGxvYWRpbmcgZmFpbGVkJywgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdBcHAgWyVzXSBsYXVuY2hlZCAoJWQgaW5zdGFuY2VzKScsIGRhdGFbMF0ucG0yX2Vudi5uYW1lLCBkYXRhLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgIGFwcHNfc3RhcnRlZCA9IGFwcHNfc3RhcnRlZC5jb25jYXQoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBmaW5hbF9lcnJvciA9IGVyciB8fCBhcHBzX2Vycm9yZWQubGVuZ3RoID4gMCA/IGFwcHNfZXJyb3JlZCA6IG51bGxcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihmaW5hbF9lcnJvciwgYXBwc19zdGFydGVkKSA6IHRoaXMuc3BlZWRMaXN0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFwcGx5IGEgUlBDIG1ldGhvZCBvbiB0aGUganNvbiBmaWxlXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAbWV0aG9kIGFjdGlvbkZyb21Kc29uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvbiBSUEMgTWV0aG9kXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IGZpbGUgZmlsZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBqc29uVmlhIGFjdGlvbiB0eXBlICg9b25seSAncGlwZScgPylcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufVxuICAgICAqL1xuICAgIGFjdGlvbkZyb21Kc29uKGFjdGlvbiwgZmlsZSwgb3B0cywganNvblZpYSwgY2IpIHtcbiAgICAgICAgdmFyIGFwcENvbmY6IGFueSA9IHt9O1xuICAgICAgICB2YXIgcmV0X3Byb2Nlc3NlcyA9IFtdO1xuXG4gICAgICAgIC8vYWNjZXB0IHByb2dyYW1tYXRpYyBjYWxsc1xuICAgICAgICBpZiAodHlwZW9mIGZpbGUgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNiID0gdHlwZW9mIGpzb25WaWEgPT0gJ2Z1bmN0aW9uJyA/IGpzb25WaWEgOiBjYjtcbiAgICAgICAgICAgIGFwcENvbmYgPSBmaWxlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGpzb25WaWEgPT0gJ2ZpbGUnKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IG51bGw7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhmaWxlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ0ZpbGUgJyArIGZpbGUgKyAnIG5vdCBmb3VuZCcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZSkpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXBwQ29uZiA9IENvbW1vbi5wYXJzZUNvbmZpZyhkYXRhLCBmaWxlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ0ZpbGUgJyArIGZpbGUgKyAnIG1hbGZvcm1hdGVkJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGUpKSA6IHRoaXMuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGpzb25WaWEgPT0gJ3BpcGUnKSB7XG4gICAgICAgICAgICBhcHBDb25mID0gQ29tbW9uLnBhcnNlQ29uZmlnKGZpbGUsICdwaXBlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcignQmFkIGNhbGwgdG8gYWN0aW9uRnJvbUpzb24sIGpzb25WaWEgc2hvdWxkIGJlIG9uZSBvZiBmaWxlLCBwaXBlJyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCYWNrd2FyZCBjb21wYXRpYmlsaXR5XG4gICAgICAgIGlmIChhcHBDb25mLmFwcHMpXG4gICAgICAgICAgICBhcHBDb25mID0gYXBwQ29uZi5hcHBzO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShhcHBDb25mKSlcbiAgICAgICAgICAgIGFwcENvbmYgPSBbYXBwQ29uZl07XG5cbiAgICAgICAgaWYgKChhcHBDb25mID0gQ29tbW9uLnZlcmlmeUNvbmZzKGFwcENvbmYpKSBpbnN0YW5jZW9mIEVycm9yKVxuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoYXBwQ29uZikgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcblxuICAgICAgICBlYWNoTGltaXQoYXBwQ29uZiwgY29uZi5DT05DVVJSRU5UX0FDVElPTlMsIChwcm9jLCBuZXh0MSkgPT4ge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSAnJztcbiAgICAgICAgICAgIHZhciBuZXdfZW52O1xuXG4gICAgICAgICAgICBpZiAoIXByb2MubmFtZSlcbiAgICAgICAgICAgICAgICBuYW1lID0gcGF0aC5iYXNlbmFtZShwcm9jLnNjcmlwdCk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbmFtZSA9IHByb2MubmFtZTtcblxuICAgICAgICAgICAgaWYgKG9wdHMub25seSAmJiBvcHRzLm9ubHkgIT0gbmFtZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhuZXh0MSk7XG5cbiAgICAgICAgICAgIGlmIChvcHRzICYmIG9wdHMuZW52KVxuICAgICAgICAgICAgICAgIG5ld19lbnYgPSBDb21tb24ubWVyZ2VFbnZpcm9ubWVudFZhcmlhYmxlcyhwcm9jLCBvcHRzLmVudik7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbmV3X2VudiA9IENvbW1vbi5tZXJnZUVudmlyb25tZW50VmFyaWFibGVzKHByb2MpO1xuXG4gICAgICAgICAgICB0aGlzLkNsaWVudC5nZXRQcm9jZXNzSWRCeU5hbWUobmFtZSwgKGVyciwgaWRzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dDEoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFpZHMpIHJldHVybiBuZXh0MSgpO1xuXG4gICAgICAgICAgICAgICAgZWFjaExpbWl0KGlkcywgY29uZi5DT05DVVJSRU5UX0FDVElPTlMsIChpZCwgbmV4dDIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9wdHMgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICAvL3N0b3BQcm9jZXNzSWQgY291bGQgYWNjZXB0IG9wdGlvbnMgdG8/XG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gPT0gJ3Jlc3RhcnRQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRzID0geyBpZDogaWQsIGVudjogbmV3X2VudiB9O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0cyA9IGlkO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5DbGllbnQuZXhlY3V0ZVJlbW90ZShhY3Rpb24sIG9wdHMsIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0X3Byb2Nlc3Nlcy5wdXNoKHJlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dDIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbiA9PSAncmVzdGFydFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkNsaWVudC5ub3RpZnlHb2QoJ3Jlc3RhcnQnLCBpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PSAnZGVsZXRlUHJvY2Vzc0lkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuQ2xpZW50Lm5vdGlmeUdvZCgnZGVsZXRlJywgaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT0gJ3N0b3BQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5DbGllbnQubm90aWZ5R29kKCdzdG9wJywgaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1slc10oJWQpIFxcdTI3MTMnLCBuYW1lLCBpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dDIoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dDEobnVsbCwgcmV0X3Byb2Nlc3Nlcyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgaWYgKGNiKSByZXR1cm4gY2IobnVsbCwgcmV0X3Byb2Nlc3Nlcyk7XG4gICAgICAgICAgICBlbHNlIHJldHVybiB0aGlzLnNwZWVkTGlzdCgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIE1haW4gZnVuY3Rpb24gdG8gb3BlcmF0ZSB3aXRoIFBNMiBkYWVtb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBhY3Rpb25fbmFtZSAgTmFtZSBvZiBhY3Rpb24gKHJlc3RhcnRQcm9jZXNzSWQsIGRlbGV0ZVByb2Nlc3NJZCwgc3RvcFByb2Nlc3NJZClcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvY2Vzc19uYW1lIGNhbiBiZSAnYWxsJywgYSBpZCBpbnRlZ2VyIG9yIHByb2Nlc3MgbmFtZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBlbnZzICAgICAgICAgb2JqZWN0IHdpdGggQ0xJIG9wdGlvbnMgLyBlbnZpcm9ubWVudFxuICAgICAqL1xuICAgIF9vcGVyYXRlKGFjdGlvbl9uYW1lLCBwcm9jZXNzX25hbWUsIGVudnMsIGNiPykge1xuICAgICAgICB2YXIgdXBkYXRlX2VudiA9IGZhbHNlO1xuICAgICAgICB2YXIgcmV0ID0gW107XG5cbiAgICAgICAgLy8gTWFrZSBzdXJlIGFsbCBvcHRpb25zIGV4aXN0XG4gICAgICAgIGlmICghZW52cylcbiAgICAgICAgICAgIGVudnMgPSB7fTtcblxuICAgICAgICBpZiAodHlwZW9mIChlbnZzKSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYiA9IGVudnM7XG4gICAgICAgICAgICBlbnZzID0ge307XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXQgdmlhIGVudi51cGRhdGUgKEpTT04gcHJvY2Vzc2luZylcbiAgICAgICAgaWYgKGVudnMudXBkYXRlRW52ID09PSB0cnVlKVxuICAgICAgICAgICAgdXBkYXRlX2VudiA9IHRydWU7XG5cbiAgICAgICAgdmFyIGNvbmN1cnJlbnRfYWN0aW9ucyA9IGVudnMucGFyYWxsZWwgfHwgY29uZi5DT05DVVJSRU5UX0FDVElPTlM7XG5cbiAgICAgICAgaWYgKCFwcm9jZXNzLmVudi5QTTJfSlNPTl9QUk9DRVNTSU5HIHx8IGVudnMuY29tbWFuZHMpIHtcbiAgICAgICAgICAgIGVudnMgPSB0aGlzLl9oYW5kbGVBdHRyaWJ1dGVVcGRhdGUoZW52cyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IGN1cnJlbnQgdXBkYXRlZCBjb25maWd1cmF0aW9uIGlmIG5vdCBwYXNzZWRcbiAgICAgICAgICovXG4gICAgICAgIGlmICghZW52cy5jdXJyZW50X2NvbmYpIHtcbiAgICAgICAgICAgIHZhciBfY29uZiA9IGZjbG9uZShlbnZzKTtcbiAgICAgICAgICAgIGVudnMgPSB7XG4gICAgICAgICAgICAgICAgY3VycmVudF9jb25mOiBfY29uZlxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJcyBLTSBsaW5rZWQ/XG4gICAgICAgICAgICBlbnZzLmN1cnJlbnRfY29uZi5rbV9saW5rID0gdGhpcy5nbF9pc19rbV9saW5rZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogT3BlcmF0ZSBhY3Rpb24gb24gc3BlY2lmaWMgcHJvY2VzcyBpZFxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgcHJvY2Vzc0lkcyA9IChpZHMsIGNiKSA9PiB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ0FwcGx5aW5nIGFjdGlvbiAlcyBvbiBhcHAgWyVzXShpZHM6ICVzKScsIGFjdGlvbl9uYW1lLCBwcm9jZXNzX25hbWUsIGlkcyk7XG5cbiAgICAgICAgICAgIGlmIChpZHMubGVuZ3RoIDw9IDIpXG4gICAgICAgICAgICAgICAgY29uY3VycmVudF9hY3Rpb25zID0gMTtcblxuICAgICAgICAgICAgaWYgKGFjdGlvbl9uYW1lID09ICdkZWxldGVQcm9jZXNzSWQnKVxuICAgICAgICAgICAgICAgIGNvbmN1cnJlbnRfYWN0aW9ucyA9IDEwO1xuXG4gICAgICAgICAgICBlYWNoTGltaXQoaWRzLCBjb25jdXJyZW50X2FjdGlvbnMsIChpZCwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBvcHRzO1xuXG4gICAgICAgICAgICAgICAgLy8gVGhlc2UgZnVuY3Rpb25zIG5lZWQgZXh0cmEgcGFyYW0gdG8gYmUgcGFzc2VkXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbl9uYW1lID09ICdyZXN0YXJ0UHJvY2Vzc0lkJyB8fFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25fbmFtZSA9PSAncmVsb2FkUHJvY2Vzc0lkJyB8fFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25fbmFtZSA9PSAnc29mdFJlbG9hZFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld19lbnY6IGFueSA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh1cGRhdGVfZW52ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZi5QTTJfUFJPR1JBTU1BVElDID09IHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2VudiA9IENvbW1vbi5zYWZlRXh0ZW5kKHt9LCBwcm9jZXNzLmVudik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2VudiA9IHV0aWwuaW5oZXJpdHMoe30sIHByb2Nlc3MuZW52KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZW52cykuZm9yRWFjaChmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19lbnZba10gPSBlbnZzW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZW52ID0gZW52cztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnY6IG5ld19lbnZcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdHMgPSBpZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKGFjdGlvbl9uYW1lLCBvcHRzLCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdQcm9jZXNzICVzIG5vdCBmb3VuZCcsIGlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KGBQcm9jZXNzICR7aWR9IG5vdCBmb3VuZGApO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbl9uYW1lID09ICdyZXN0YXJ0UHJvY2Vzc0lkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5DbGllbnQubm90aWZ5R29kKCdyZXN0YXJ0JywgaWQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbl9uYW1lID09ICdkZWxldGVQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkNsaWVudC5ub3RpZnlHb2QoJ2RlbGV0ZScsIGlkKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb25fbmFtZSA9PSAnc3RvcFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuQ2xpZW50Lm5vdGlmeUdvZCgnc3RvcCcsIGlkKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb25fbmFtZSA9PSAncmVsb2FkUHJvY2Vzc0lkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5DbGllbnQubm90aWZ5R29kKCdyZWxvYWQnLCBpZCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uX25hbWUgPT0gJ3NvZnRSZWxvYWRQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkNsaWVudC5ub3RpZnlHb2QoJ2dyYWNlZnVsIHJlbG9hZCcsIGlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyZXMpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gW3Jlc107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRmlsdGVyIHJldHVyblxuICAgICAgICAgICAgICAgICAgICByZXMuZm9yRWFjaChmdW5jdGlvbiAocHJvYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdbJXNdKCVkKSBcXHUyNzEzJywgcHJvYy5wbTJfZW52ID8gcHJvYy5wbTJfZW52Lm5hbWUgOiBwcm9jZXNzX25hbWUsIGlkKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbl9uYW1lID09ICdzdG9wUHJvY2Vzc0lkJyAmJiBwcm9jLnBtMl9lbnYgJiYgcHJvYy5wbTJfZW52LmNyb25fcmVzdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbW1vbi53YXJuKGBBcHAgJHtjaGFsay5ib2xkKHByb2MucG0yX2Vudi5uYW1lKX0gc3RvcHBlZCBidXQgQ1JPTiBSRVNUQVJUIGlzIHN0aWxsIFVQICR7cHJvYy5wbTJfZW52LmNyb25fcmVzdGFydH1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXByb2MucG0yX2VudikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJvYy5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBwcm9jLnBtMl9lbnYubmFtZXNwYWNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBtX2lkOiBwcm9jLnBtMl9lbnYucG1faWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBwcm9jLnBtMl9lbnYuc3RhdHVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RhcnRfdGltZTogcHJvYy5wbTJfZW52LnJlc3RhcnRfdGltZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbTJfZW52OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHByb2MucG0yX2Vudi5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lc3BhY2U6IHByb2MucG0yX2Vudi5uYW1lc3BhY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBtX2lkOiBwcm9jLnBtMl9lbnYucG1faWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogcHJvYy5wbTJfZW52LnN0YXR1cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdGFydF90aW1lOiBwcm9jLnBtMl9lbnYucmVzdGFydF90aW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnY6IHByb2MucG0yX2Vudi5lbnZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgcmV0KSA6IHRoaXMuc3BlZWRMaXN0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9jZXNzX25hbWUgPT0gJ2FsbCcpIHtcbiAgICAgICAgICAgIC8vIFdoZW4gdXNpbmcgc2hvcnRjdXRzIGxpa2UgJ2FsbCcsIGRvIG5vdCBkZWxldGUgbW9kdWxlc1xuICAgICAgICAgICAgdmFyIGZuXG5cbiAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5QTTJfU1RBVFVTID09ICdzdG9wcGluZycpXG4gICAgICAgICAgICAgICAgdGhpcy5DbGllbnQuZ2V0QWxsUHJvY2Vzc0lkKGZ1bmN0aW9uIChlcnIsIGlkcykge1xuICAgICAgICAgICAgICAgICAgICByZW9wZXJhdGUoZXJyLCBpZHMpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGhpcy5DbGllbnQuZ2V0QWxsUHJvY2Vzc0lkV2l0aG91dE1vZHVsZXMoKGVyciwgaWRzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlb3BlcmF0ZShlcnIsIGlkcylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgcmVvcGVyYXRlID0gKGVyciwgaWRzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghaWRzIHx8IGlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX1dBUk5JTkcgKyAnTm8gcHJvY2VzcyBmb3VuZCcpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoJ3Byb2Nlc3MgbmFtZSBub3QgZm91bmQnKSkgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoaWRzLCBjYik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gb3BlcmF0ZSB1c2luZyByZWdleFxuICAgICAgICBlbHNlIGlmIChpc05hTihwcm9jZXNzX25hbWUpICYmIHByb2Nlc3NfbmFtZVswXSA9PT0gJy8nICYmIHByb2Nlc3NfbmFtZVtwcm9jZXNzX25hbWUubGVuZ3RoIC0gMV0gPT09ICcvJykge1xuICAgICAgICAgICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChwcm9jZXNzX25hbWUucmVwbGFjZSgvXFwvL2csICcnKSk7XG5cbiAgICAgICAgICAgIHRoaXMuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIChlcnIsIGxpc3QpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuICAgICAgICAgICAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbiAocHJvYykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVnZXgudGVzdChwcm9jLnBtMl9lbnYubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kX3Byb2MucHVzaChwcm9jLnBtX2lkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kX3Byb2MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19XQVJOSU5HICsgJ05vIHByb2Nlc3MgZm91bmQnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKCdwcm9jZXNzIG5hbWUgbm90IGZvdW5kJykpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoZm91bmRfcHJvYywgY2IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNOYU4ocHJvY2Vzc19uYW1lKSkge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBXZSBjYW4gbm90IHN0b3Agb3IgZGVsZXRlIGEgbW9kdWxlIGJ1dCB3ZSBjYW4gcmVzdGFydCBpdFxuICAgICAgICAgICAgICogdG8gcmVmcmVzaCBjb25maWd1cmF0aW9uIHZhcmlhYmxlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHZhciBhbGxvd19tb2R1bGVfcmVzdGFydCA9IGFjdGlvbl9uYW1lID09ICdyZXN0YXJ0UHJvY2Vzc0lkJyA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgICAgICAgdGhpcy5DbGllbnQuZ2V0UHJvY2Vzc0lkQnlOYW1lKHByb2Nlc3NfbmFtZSwgYWxsb3dfbW9kdWxlX3Jlc3RhcnQsIChlcnIsIGlkcykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoaXMuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaWRzICYmIGlkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICogRGV0ZXJtaW5lIGlmIHRoZSBwcm9jZXNzIHRvIHJlc3RhcnQgaXMgYSBtb2R1bGVcbiAgICAgICAgICAgICAgICAgICAqIGlmIHllcyBsb2FkIGNvbmZpZ3VyYXRpb24gdmFyaWFibGVzIGFuZCBtZXJnZSB3aXRoIHRoZSBjdXJyZW50IGVudmlyb25tZW50XG4gICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdmFyIGFkZGl0aW9uYWxfZW52ID0gTW9kdWxhcml6ZXIuZ2V0QWRkaXRpb25hbENvbmYocHJvY2Vzc19uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgdXRpbC5pbmhlcml0cyhlbnZzLCBhZGRpdGlvbmFsX2Vudik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzSWRzKGlkcywgY2IpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuQ2xpZW50LmdldFByb2Nlc3NJZHNCeU5hbWVzcGFjZShwcm9jZXNzX25hbWUsIGFsbG93X21vZHVsZV9yZXN0YXJ0LCAoZXJyLCBuc19wcm9jZXNzX2lkcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoaXMuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghbnNfcHJvY2Vzc19pZHMgfHwgbnNfcHJvY2Vzc19pZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ1Byb2Nlc3Mgb3IgTmFtZXNwYWNlICVzIG5vdCBmb3VuZCcsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoJ3Byb2Nlc3Mgb3IgbmFtZXNwYWNlIG5vdCBmb3VuZCcpKSA6IHRoaXMuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIERldGVybWluZSBpZiB0aGUgcHJvY2VzcyB0byByZXN0YXJ0IGlzIGEgbW9kdWxlXG4gICAgICAgICAgICAgICAgICAgICAqIGlmIHllcyBsb2FkIGNvbmZpZ3VyYXRpb24gdmFyaWFibGVzIGFuZCBtZXJnZSB3aXRoIHRoZSBjdXJyZW50IGVudmlyb25tZW50XG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB2YXIgbnNfYWRkaXRpb25hbF9lbnYgPSBNb2R1bGFyaXplci5nZXRBZGRpdGlvbmFsQ29uZihwcm9jZXNzX25hbWUpO1xuICAgICAgICAgICAgICAgICAgICB1dGlsLmluaGVyaXRzKGVudnMsIG5zX2FkZGl0aW9uYWxfZW52KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMobnNfcHJvY2Vzc19pZHMsIGNiKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMucG0yX2NvbmZpZ3VyYXRpb24uZG9ja2VyID09IFwidHJ1ZVwiIHx8XG4gICAgICAgICAgICAgICAgdGhpcy5wbTJfY29uZmlndXJhdGlvbi5kb2NrZXIgPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIC8vIERvY2tlci9TeXN0ZW1kIHByb2Nlc3MgaW50ZXJhY3Rpb24gZGV0ZWN0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgKGVyciwgcHJvY19saXN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoaWdoZXJfaWQgPSAwXG4gICAgICAgICAgICAgICAgICAgIHByb2NfbGlzdC5mb3JFYWNoKHAgPT4geyBwLnBtX2lkID4gaGlnaGVyX2lkID8gaGlnaGVyX2lkID0gcC5wbV9pZCA6IG51bGwgfSlcblxuICAgICAgICAgICAgICAgICAgICAvLyBJcyBEb2NrZXIvU3lzdGVtZFxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvY2Vzc19uYW1lID4gaGlnaGVyX2lkKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIERvY2tlck1nbXQucHJvY2Vzc0NvbW1hbmQodGhpcywgaGlnaGVyX2lkLCBwcm9jZXNzX25hbWUsIGFjdGlvbl9uYW1lLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgKGVyci5tZXNzYWdlID8gZXJyLm1lc3NhZ2UgOiBlcnIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoaXMuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJldCkgOiB0aGlzLnNwZWVkTGlzdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBhcHBsaWNhdGlvbiBuYW1lIGFzIG51bWJlciBpcyBhbiBhcHAgbmFtZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLkNsaWVudC5nZXRQcm9jZXNzSWRCeU5hbWUocHJvY2Vzc19uYW1lLCAoZXJyLCBpZHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZHMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvY2Vzc0lkcyhpZHMsIGNiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgYXBwbGljYXRpb24gbmFtZSBhcyBudW1iZXIgaXMgYW4gbmFtZXNwYWNlXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkNsaWVudC5nZXRQcm9jZXNzSWRzQnlOYW1lc3BhY2UocHJvY2Vzc19uYW1lLCAoZXJyLCBuc19wcm9jZXNzX2lkcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuc19wcm9jZXNzX2lkcy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvY2Vzc0lkcyhuc19wcm9jZXNzX2lkcywgY2IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVsc2Ugb3BlcmF0ZSBvbiBwbSBpZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzSWRzKFtwcm9jZXNzX25hbWVdLCBjYik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIGFwcGxpY2F0aW9uIG5hbWUgYXMgbnVtYmVyIGlzIGFuIGFwcCBuYW1lXG4gICAgICAgICAgICAgICAgdGhpcy5DbGllbnQuZ2V0UHJvY2Vzc0lkQnlOYW1lKHByb2Nlc3NfbmFtZSwgKGVyciwgaWRzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpZHMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzSWRzKGlkcywgY2IpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIGFwcGxpY2F0aW9uIG5hbWUgYXMgbnVtYmVyIGlzIGFuIG5hbWVzcGFjZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLkNsaWVudC5nZXRQcm9jZXNzSWRzQnlOYW1lc3BhY2UocHJvY2Vzc19uYW1lLCBmdW5jdGlvbiAoZXJyLCBuc19wcm9jZXNzX2lkcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5zX3Byb2Nlc3NfaWRzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMobnNfcHJvY2Vzc19pZHMsIGNiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVsc2Ugb3BlcmF0ZSBvbiBwbSBpZFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoW3Byb2Nlc3NfbmFtZV0sIGNiKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBDYW1lbENhc2UgQ29tbWFuZGVyLmpzIGFyZ3VtZW50c1xuICAgICAqIHRvIFVuZGVyc2NvcmVcbiAgICAgKiAobm9kZUFyZ3MgLT4gbm9kZV9hcmdzKVxuICAgICAqL1xuICAgIF9oYW5kbGVBdHRyaWJ1dGVVcGRhdGUob3B0cykge1xuICAgICAgICB2YXIgY29uZjogYW55ID0gQ29uZmlnLmZpbHRlck9wdGlvbnMob3B0cyk7XG4gICAgICAgIGlmICh0eXBlb2YgKGNvbmYubmFtZSkgIT0gJ3N0cmluZycpXG4gICAgICAgICAgICBkZWxldGUgY29uZi5uYW1lO1xuXG4gICAgICAgIHZhciBhcmdzSW5kZXggPSAwO1xuICAgICAgICBpZiAob3B0cy5yYXdBcmdzICYmIChhcmdzSW5kZXggPSBvcHRzLnJhd0FyZ3MuaW5kZXhPZignLS0nKSkgPj0gMCkge1xuICAgICAgICAgICAgY29uZi5hcmdzID0gb3B0cy5yYXdBcmdzLnNsaWNlKGFyZ3NJbmRleCArIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFwcENvbmYgPSBDb21tb24udmVyaWZ5Q29uZnMoY29uZilbMF07XG5cbiAgICAgICAgaWYgKGFwcENvbmYgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHdoaWxlIHRyYW5zZm9ybWluZyBDYW1lbENhc2UgYXJncyB0byB1bmRlcnNjb3JlJyk7XG4gICAgICAgICAgICByZXR1cm4gYXBwQ29uZjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhcmdzSW5kZXggPT0gLTEpXG4gICAgICAgICAgICBkZWxldGUgYXBwQ29uZi5hcmdzO1xuICAgICAgICBpZiAoYXBwQ29uZi5uYW1lID09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgZGVsZXRlIGFwcENvbmYubmFtZTtcblxuICAgICAgICBkZWxldGUgYXBwQ29uZi5leGVjX21vZGU7XG5cbiAgICAgICAgaWYgKHV0aWwuaXNBcnJheShhcHBDb25mLndhdGNoKSAmJiBhcHBDb25mLndhdGNoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKCF+b3B0cy5yYXdBcmdzLmluZGV4T2YoJy0td2F0Y2gnKSlcbiAgICAgICAgICAgICAgICBkZWxldGUgYXBwQ29uZi53YXRjaFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3B0aW9ucyBzZXQgdmlhIGVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuUE0yX0RFRVBfTU9OSVRPUklORylcbiAgICAgICAgICAgIGFwcENvbmYuZGVlcF9tb25pdG9yaW5nID0gdHJ1ZTtcblxuICAgICAgICAvLyBGb3JjZSBkZWxldGlvbiBvZiBkZWZhdWx0cyB2YWx1ZXMgc2V0IGJ5IGNvbW1hbmRlclxuICAgICAgICAvLyB0byBhdm9pZCBvdmVycmlkaW5nIHNwZWNpZmllZCBjb25maWd1cmF0aW9uIGJ5IHVzZXJcbiAgICAgICAgaWYgKGFwcENvbmYudHJlZWtpbGwgPT09IHRydWUpXG4gICAgICAgICAgICBkZWxldGUgYXBwQ29uZi50cmVla2lsbDtcbiAgICAgICAgaWYgKGFwcENvbmYucG14ID09PSB0cnVlKVxuICAgICAgICAgICAgZGVsZXRlIGFwcENvbmYucG14O1xuICAgICAgICBpZiAoYXBwQ29uZi52aXppb24gPT09IHRydWUpXG4gICAgICAgICAgICBkZWxldGUgYXBwQ29uZi52aXppb247XG4gICAgICAgIGlmIChhcHBDb25mLmF1dG9tYXRpb24gPT09IHRydWUpXG4gICAgICAgICAgICBkZWxldGUgYXBwQ29uZi5hdXRvbWF0aW9uO1xuICAgICAgICBpZiAoYXBwQ29uZi5hdXRvcmVzdGFydCA9PT0gdHJ1ZSlcbiAgICAgICAgICAgIGRlbGV0ZSBhcHBDb25mLmF1dG9yZXN0YXJ0O1xuXG4gICAgICAgIHJldHVybiBhcHBDb25mO1xuICAgIH1cblxuICAgIGdldFByb2Nlc3NJZEJ5TmFtZShuYW1lLCBjYj8pIHtcbiAgICAgICAgdGhpcy5DbGllbnQuZ2V0UHJvY2Vzc0lkQnlOYW1lKG5hbWUsIChlcnIsIGlkKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpZCk7XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBpZCkgOiB0aGlzLmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXNjcmlwdGlvblxuICAgICAqIEBtZXRob2Qgamxpc3RcbiAgICAgKiBAcGFyYW0ge30gZGVidWdcbiAgICAgKiBAcmV0dXJuXG4gICAgICovXG4gICAgamxpc3QoZGVidWc/KSB7XG4gICAgICAgIHRoaXMuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIChlcnIsIGxpc3QpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRlYnVnKSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUodXRpbC5pbnNwZWN0KGxpc3QsIGZhbHNlLCBudWxsLCBmYWxzZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoSlNPTi5zdHJpbmdpZnkobGlzdCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNwbGF5IHN5c3RlbSBpbmZvcm1hdGlvblxuICAgICAqIEBtZXRob2Qgc2xpc3RcbiAgICAgKiBAcmV0dXJuXG4gICAgICovXG4gICAgc2xpc3QodHJlZSkge1xuICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRTeXN0ZW1EYXRhJywge30sIChlcnIsIHN5c19pbmZvcykgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIENvbW1vbi5lcnIoZXJyKVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHJlZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHRyZWVpZnkuYXNUcmVlKHN5c19pbmZvcywgdHJ1ZSkpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUodXRpbC5pbnNwZWN0KHN5c19pbmZvcywgZmFsc2UsIG51bGwsIGZhbHNlKSlcbiAgICAgICAgICAgIHRoaXMuZXhpdENsaShjb25mLlNVQ0NFU1NfRVhJVClcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXNjcmlwdGlvblxuICAgICAqIEBtZXRob2Qgc3BlZWRMaXN0XG4gICAgICogQHJldHVyblxuICAgICAqL1xuICAgIHNwZWVkTGlzdChjb2RlPywgYXBwc19hY3RlZD8pIHtcbiAgICAgICAgdmFyIHN5c3RlbWRhdGEgPSBudWxsXG4gICAgICAgIHZhciBhY3RlZCA9IFtdXG5cbiAgICAgICAgaWYgKChjb2RlICE9IDAgJiYgY29kZSAhPSBudWxsKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhpdENsaShjb2RlID8gY29kZSA6IGNvbmYuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhcHBzX2FjdGVkICYmIGFwcHNfYWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgYXBwc19hY3RlZC5mb3JFYWNoKHByb2MgPT4ge1xuICAgICAgICAgICAgICAgIGFjdGVkLnB1c2gocHJvYy5wbTJfZW52ID8gcHJvYy5wbTJfZW52LnBtX2lkIDogcHJvYy5wbV9pZClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb0xpc3QgPSAoZXJyLCBsaXN0LCBzeXNfaW5mb3MpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5nbF9yZXRyeSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2xfcmV0cnkgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQodGhpcy5zcGVlZExpc3QuYmluZCh0aGlzKSwgMTQwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAlcy5cXG5BIHByb2Nlc3Mgc2VlbXMgdG8gYmUgb24gaW5maW5pdGUgbG9vcCwgcmV0cnkgaW4gNSBzZWNvbmRzJywgZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5zdGRvdXQuaXNUVFkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgVVgubGlzdF9taW4obGlzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjb21tYW5kZXIubWluaUxpc3QgJiYgIWNvbW1hbmRlci5zaWxlbnQpXG4gICAgICAgICAgICAgICAgVVgubGlzdF9taW4obGlzdCk7XG4gICAgICAgICAgICBlbHNlIGlmICghY29tbWFuZGVyLnNpbGVudCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdsX2ludGVyYWN0X2luZm9zKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXNoYm9hcmRfdXJsID0gYGh0dHBzOi8vYXBwLnBtMi5pby8jL3IvJHt0aGlzLmdsX2ludGVyYWN0X2luZm9zLnB1YmxpY19rZXl9YFxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmdsX2ludGVyYWN0X2luZm9zLmluZm9fbm9kZSAhPSAnaHR0cHM6Ly9yb290LmtleW1ldHJpY3MuaW8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXNoYm9hcmRfdXJsID0gYCR7dGhpcy5nbF9pbnRlcmFjdF9pbmZvcy5pbmZvX25vZGV9LyMvci8ke3RoaXMuZ2xfaW50ZXJhY3RfaW5mb3MucHVibGljX2tleX1gXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoJyVzIFBNMisgYWN0aXZhdGVkIHwgSW5zdGFuY2UgTmFtZTogJXMgfCBEYXNoOiAlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFsay5ncmVlbi5ib2xkKCfih4YnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYWxrLmJvbGQodGhpcy5nbF9pbnRlcmFjdF9pbmZvcy5tYWNoaW5lX25hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbGsuYm9sZChkYXNoYm9hcmRfdXJsKSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgVVgubGlzdChsaXN0LCBzeXNfaW5mb3MpO1xuICAgICAgICAgICAgICAgIC8vQ29tbW9uLnByaW50T3V0KGNoYWxrLndoaXRlLml0YWxpYygnIFVzZSBgcG0yIHNob3cgPGlkfG5hbWU+YCB0byBnZXQgbW9yZSBkZXRhaWxzIGFib3V0IGFuIGFwcCcpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuQ2xpZW50LmRhZW1vbl9tb2RlID09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KCdbLS1uby1kYWVtb25dIENvbnRpbnVlIHRvIHN0cmVhbSBsb2dzJyk7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KCdbLS1uby1kYWVtb25dIEV4aXQgb24gdGFyZ2V0IFBNMiBleGl0IHBpZD0nICsgZnMucmVhZEZpbGVTeW5jKGNvbmYuUE0yX1BJRF9GSUxFX1BBVEgpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIGdsb2JhbFtcIl9hdXRvX2V4aXRcIl0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cmVhbUxvZ3MoJ2FsbCcsIDAsIGZhbHNlLCAnSEg6bW06c3MnLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiAocHJvY2Vzcy5zdGRvdXQuaXNUVFkpIGlmIGxvb2tpbmcgZm9yIHN0YXJ0IGxvZ3NcbiAgICAgICAgICAgIGVsc2UgaWYgKCFwcm9jZXNzLmVudi5UUkFWSVMgJiYgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT0gJ3Rlc3QnICYmIGFjdGVkLmxlbmd0aCA+IDAgJiYgKGNvbW1hbmRlci5hdHRhY2ggPT09IHRydWUpKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLmluZm8oYExvZyBzdHJlYW1pbmcgYXBwcyBpZDogJHtjaGFsay5jeWFuKGFjdGVkLmpvaW4oJyAnKSl9LCBleGl0IHdpdGggQ3RybC1DIG9yIHdpbGwgZXhpdCBpbiAxMHNlY3NgKVxuXG4gICAgICAgICAgICAgICAgLy8gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gICBDb21tb24uaW5mbyhgTG9nIHN0cmVhbWluZyBleGl0ZWQgYXV0b21hdGljYWxseSwgcnVuICdwbTIgbG9ncycgdG8gY29udGludWUgd2F0Y2hpbmcgbG9nc2ApXG4gICAgICAgICAgICAgICAgLy8gICByZXR1cm4gdGhhdC5leGl0Q2xpKGNvZGUgPyBjb2RlIDogY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAgICAgICAgIC8vIH0sIDEwMDAwKVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjdGVkLmZvckVhY2goKHByb2NfbmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0cmVhbUxvZ3MocHJvY19uYW1lLCAwLCBmYWxzZSwgbnVsbCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGl0Q2xpKGNvZGUgPyBjb2RlIDogY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRG8gbm90aGluZyBpZiBQTTIgY2FsbGVkIHByb2dyYW1tYXRpY2FsbHkgYW5kIG5vdCBjYWxsZWQgZnJvbSBDTEkgKGFsc28gaW4gZXhpdENsaSlcbiAgICAgICAgaWYgKChjb25mLlBNMl9QUk9HUkFNTUFUSUMgJiYgcHJvY2Vzcy5lbnYuUE0yX1VTQUdFICE9ICdDTEknKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldFN5c3RlbURhdGEnLCB7fSwgKGVyciwgc3lzX2luZm9zKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgKGVyciwgcHJvY19saXN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRvTGlzdChlcnIsIHByb2NfbGlzdCwgc3lzX2luZm9zKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2NhbGUgdXAvZG93biBhIHByb2Nlc3NcbiAgICAgKiBAbWV0aG9kIHNjYWxlXG4gICAgICovXG4gICAgc2NhbGUoYXBwX25hbWUsIG51bWJlciwgY2I/KSB7XG4gICAgICAgIGZ1bmN0aW9uIGFkZFByb2NzKHByb2MsIHZhbHVlLCBjYikge1xuICAgICAgICAgICAgKGZ1bmN0aW9uIGV4KHByb2MsIG51bWJlcikge1xuICAgICAgICAgICAgICAgIGlmIChudW1iZXItLSA9PT0gMCkgcmV0dXJuIGNiKCk7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdTY2FsaW5nIHVwIGFwcGxpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZHVwbGljYXRlUHJvY2Vzc0lkJywgcHJvYy5wbTJfZW52LnBtX2lkLCBleC5iaW5kKHRoaXMsIHByb2MsIG51bWJlcikpO1xuICAgICAgICAgICAgfSkocHJvYywgbnVtYmVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJtUHJvY3MgPSAocHJvY3MsIHZhbHVlLCBjYikgPT4ge1xuICAgICAgICAgICAgdmFyIGkgPSAwO1xuXG4gICAgICAgICAgICBjb25zdCBleCA9IChwcm9jcywgbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG51bWJlcisrID09PSAwKSByZXR1cm4gY2IoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9vcGVyYXRlKCdkZWxldGVQcm9jZXNzSWQnLCBwcm9jc1tpKytdLnBtMl9lbnYucG1faWQsIGV4LmJpbmQodGhpcywgcHJvY3MsIG51bWJlcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXgocHJvY3MsIG51bWJlcik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBlbmQgPSAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCB7IHN1Y2Nlc3M6IHRydWUgfSkgOiB0aGlzLnNwZWVkTGlzdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5DbGllbnQuZ2V0UHJvY2Vzc0J5TmFtZShhcHBfbmFtZSwgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFwcm9jcyB8fCBwcm9jcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ0FwcGxpY2F0aW9uICVzIG5vdCBmb3VuZCcsIGFwcF9uYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoJ0FwcCBub3QgZm91bmQnKSkgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHByb2NfbnVtYmVyID0gcHJvY3MubGVuZ3RoO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIChudW1iZXIpID09PSAnc3RyaW5nJyAmJiBudW1iZXIuaW5kZXhPZignKycpID49IDApIHtcbiAgICAgICAgICAgICAgICBudW1iZXIgPSBwYXJzZUludChudW1iZXIsIDEwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWRkUHJvY3MocHJvY3NbMF0sIG51bWJlciwgZW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiAobnVtYmVyKSA9PT0gJ3N0cmluZycgJiYgbnVtYmVyLmluZGV4T2YoJy0nKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgbnVtYmVyID0gcGFyc2VJbnQobnVtYmVyLCAxMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJtUHJvY3MocHJvY3NbMF0sIG51bWJlciwgZW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG51bWJlciA9IHBhcnNlSW50KG51bWJlciwgMTApO1xuICAgICAgICAgICAgICAgIG51bWJlciA9IG51bWJlciAtIHByb2NfbnVtYmVyO1xuXG4gICAgICAgICAgICAgICAgaWYgKG51bWJlciA8IDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBybVByb2NzKHByb2NzLCBudW1iZXIsIGVuZCk7XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobnVtYmVyID4gMClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFkZFByb2NzKHByb2NzWzBdLCBudW1iZXIsIGVuZCk7XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnTm90aGluZyB0byBkbycpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoJ1NhbWUgcHJvY2VzcyBudW1iZXInKSkgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlc2NyaXB0aW9uXG4gICAgICogQG1ldGhvZCBkZXNjcmliZVByb2Nlc3NcbiAgICAgKiBAcGFyYW0ge30gcG0yX2lkXG4gICAgICogQHJldHVyblxuICAgICAqL1xuICAgIGRlc2NyaWJlKHBtMl9pZCwgY2I/KSB7XG4gICAgICAgIHZhciBmb3VuZF9wcm9jID0gW107XG5cbiAgICAgICAgdGhpcy5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgKGVyciwgbGlzdCkgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICAgICAgICAgICAgdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbiAocHJvYykge1xuICAgICAgICAgICAgICAgIGlmICgoIWlzTmFOKHBtMl9pZCkgJiYgcHJvYy5wbV9pZCA9PSBwbTJfaWQpIHx8XG4gICAgICAgICAgICAgICAgICAgICh0eXBlb2YgKHBtMl9pZCkgPT09ICdzdHJpbmcnICYmIHByb2MubmFtZSA9PSBwbTJfaWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kX3Byb2MucHVzaChwcm9jKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKGZvdW5kX3Byb2MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX1dBUk5JTkcgKyAnJXMgZG9lc25cXCd0IGV4aXN0JywgcG0yX2lkKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBbXSkgOiB0aGlzLmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFjYikge1xuICAgICAgICAgICAgICAgIGZvdW5kX3Byb2MuZm9yRWFjaChmdW5jdGlvbiAocHJvYykge1xuICAgICAgICAgICAgICAgICAgICBVWC5kZXNjcmliZShwcm9jKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgZm91bmRfcHJvYykgOiB0aGlzLmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBUEkgbWV0aG9kIHRvIHBlcmZvcm0gYSBkZWVwIHVwZGF0ZSBvZiBQTTJcbiAgICAgKiBAbWV0aG9kIGRlZXBVcGRhdGVcbiAgICAgKi9cbiAgICBkZWVwVXBkYXRlKGNiKSB7XG4gICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnVXBkYXRpbmcgUE0yLi4uJyk7XG5cbiAgICAgICAgdmFyIGNoaWxkOiBhbnkgPSBzZXhlYyhcIm5wbSBpIC1nIHBtMkBsYXRlc3Q7IHBtMiB1cGRhdGVcIik7XG5cbiAgICAgICAgY2hpbGQuc3Rkb3V0Lm9uKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1BNMiBzdWNjZXNzZnVsbHkgdXBkYXRlZCcpO1xuICAgICAgICAgICAgY2IgPyBjYihudWxsLCB7IHN1Y2Nlc3M6IHRydWUgfSkgOiB0aGlzLmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gTG9hZCBhbGwgQVBJIG1ldGhvZHMgLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbkFQSUV4dHJhKEFQSSk7XG5BUElEZXBsb3koQVBJKTtcbkFQSU1vZHVsZShBUEkpO1xuXG5BUElQbHVzTGluayhBUEkpO1xuQVBJUGx1c1Byb2Nlc3MoQVBJKTtcbkFQSVBsdXNIZWxwZXIoQVBJKTtcblxuQVBJQ29uZmlnKEFQSSk7XG5BUElWZXJzaW9uKEFQSSk7XG5BUElTdGFydHVwKEFQSSk7XG5BUElNZ250KEFQSSk7XG5BUElDb250YWluZXIoQVBJKTtcblxuZXhwb3J0IGRlZmF1bHQgQVBJO1xuIl19