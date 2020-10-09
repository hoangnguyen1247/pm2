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

var _Docker = _interopRequireDefault(require("./API/ExtraMgmt/Docker"));

var _constants = _interopRequireDefault(require("../constants"));

var _Client = _interopRequireDefault(require("./Client"));

var _Common = _interopRequireDefault(require("./Common"));

var _InteractorClient = _interopRequireDefault(require("@pm2/agent/src/InteractorClient"));

var _Config = _interopRequireDefault(require("./tools/Config"));

var _Modularizer = _interopRequireDefault(require("./API/Modules/Modularizer"));

var _paths = _interopRequireDefault(require("../paths"));

var _UX = _interopRequireDefault(require("./API/UX"));

var _package = _interopRequireDefault(require("../package.json"));

var _flagExt = _interopRequireDefault(require("./API/Modules/flagExt"));

var _Configuration = _interopRequireDefault(require("./Configuration"));

var _semver = _interopRequireDefault(require("semver"));

var _sexec = _interopRequireDefault(require("./tools/sexec"));

var _crypto = _interopRequireDefault(require("crypto"));

var _json = _interopRequireDefault(require("./tools/json5"));

var _dayjs = _interopRequireDefault(require("dayjs"));

var _Extra = _interopRequireDefault(require("./API/Extra"));

var _Deploy = _interopRequireDefault(require("./API/Deploy"));

var _index = _interopRequireDefault(require("./API/Modules/index"));

var _link = _interopRequireDefault(require("./API/pm2-plus/link"));

var _processSelector = _interopRequireDefault(require("./API/pm2-plus/process-selector"));

var _helpers = _interopRequireDefault(require("./API/pm2-plus/helpers"));

var _Configuration2 = _interopRequireDefault(require("./API/Configuration"));

var _Version = _interopRequireDefault(require("./API/Version"));

var _Startup = _interopRequireDefault(require("./API/Startup"));

var _LogManagement = _interopRequireDefault(require("./API/LogManagement"));

var _Containerizer = _interopRequireDefault(require("./API/Containerizer"));

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
  function API(opts) {
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
    if (!opts) opts = {};
    var that = this;
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
      pm2_home: that.pm2_home,
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
      that.gl_is_km_linked = true;
    } catch (e) {
      that.gl_is_km_linked = false;
    } // For testing purposes


    if (this.secret_key && process.env.NODE_ENV == 'local_test') that.gl_is_km_linked = true;

    _InteractorClient["default"].ping(this._conf, function (err, result) {
      if (!err && result === true) {
        _fs["default"].readFile(conf.INTERACTION_CONF, function (err, _conf) {
          if (!err) {
            try {
              that.gl_interact_infos = JSON.parse(_conf.toString());
            } catch (e) {
              try {
                that.gl_interact_infos = _json["default"].parse(_conf.toString());
              } catch (e) {
                console.error(e);
                that.gl_interact_infos = null;
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
      var that = this;
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
        if (meta.new_pm2_instance == false && that.daemon_mode === true) return cb(err, meta); // If new pm2 instance has been popped
        // Lauch all modules

        that.launchAll(that, function (err_mod) {
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
      var that = this;
      debug('Killing and deleting current deamon');
      this.killDaemon(function () {
        var cmd = 'rm -rf ' + that.pm2_home;

        var test_path = _path["default"].join(that.pm2_home, 'module_conf.json');

        var test_path_2 = _path["default"].join(that.pm2_home, 'pm2.pid');

        if (that.pm2_home.indexOf('.pm2') > -1) return cb(new Error('Destroy is not a allowed method on .pm2'));

        _fs["default"].access(test_path, _fs["default"].constants.R_OK, function (err) {
          if (err) return cb(err);
          debug('Deleting temporary folder %s', that.pm2_home);
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
      var that = this;
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
      var that = this; // Do nothing if PM2 called programmatically (also in speedlist)

      if (conf.PM2_PROGRAMMATIC && process.env.PM2_USAGE != 'CLI') return false;

      _InteractorClient["default"].disconnectRPC(function () {
        that.Client.close(function () {
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
      var _this = this;

      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }

      if (!opts) opts = {};

      if (_semver["default"].lt(process.version, '6.0.0')) {
        _Common["default"].printOut(conf.PREFIX_MSG_WARNING + 'Node 4 is deprecated, please upgrade to use pm2 to have all features');
      }

      var that = this;
      if (_util["default"].isArray(opts.watch) && opts.watch.length === 0) opts.watch = (opts.rawArgs ? !!~opts.rawArgs.indexOf('--watch') : !!~process.argv.indexOf('--watch')) || false;

      if (_Common["default"].isConfigFile(cmd) || (0, _typeof2["default"])(cmd) === 'object') {
        that._startJson(cmd, opts, 'restartProcessId', function (err, procs) {
          return cb ? cb(err, procs) : _this.speedList();
        });
      } else {
        that._startScript(cmd, opts, function (err, procs) {
          return cb ? cb(err, procs) : _this.speedList(0);
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
      var that = this;

      function processIds(ids, cb) {
        (0, _eachLimit["default"])(ids, conf.CONCURRENT_ACTIONS, function (id, next) {
          that.Client.executeRemote('resetMetaProcessId', id, function (err, res) {
            if (err) console.error(err);

            _Common["default"].printOut(conf.PREFIX_MSG + 'Resetting meta for process id %d', id);

            return next();
          });
        }, function (err) {
          if (err) return cb(_Common["default"].retErr(err));
          return cb ? cb(null, {
            success: true
          }) : that.speedList();
        });
      }

      if (process_name == 'all') {
        that.Client.getAllProcessId(function (err, ids) {
          if (err) {
            _Common["default"].printError(err);

            return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
          }

          return processIds(ids, cb);
        });
      } else if (isNaN(process_name)) {
        that.Client.getProcessIdByName(process_name, function (err, ids) {
          if (err) {
            _Common["default"].printError(err);

            return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
          }

          if (ids.length === 0) {
            _Common["default"].printError('Unknown process name');

            return cb ? cb(new Error('Unknown process name')) : that.exitCli(conf.ERROR_EXIT);
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
    key: "update",
    value: function update(cb) {
      var that = this;

      _Common["default"].printOut('Be sure to have the latest version by doing `npm install pm2@latest -g` before doing this procedure.'); // Dump PM2 processes


      that.Client.executeRemote('notifyKillPM2', {}, function () {});
      that.getVersion(function (err, new_version) {
        // If not linked to PM2 plus, and update PM2 to latest, display motd.update
        if (!that.gl_is_km_linked && !err && _package["default"].version != new_version) {
          var dt = _fs["default"].readFileSync(_path["default"].join(__dirname, that._conf.PM2_UPDATE));

          console.log(dt.toString());
        }

        that.dump(function (err) {
          debug('Dumping successfull', err);
          that.killDaemon(function () {
            debug('------------------ Everything killed', arguments);
            that.Client.launchDaemon({
              interactor: false
            }, function (err, child) {
              that.Client.launchRPC(function () {
                that.resurrect(function () {
                  _Common["default"].printOut(_chalk["default"].blue.bold('>>>>>>>>>> PM2 updated'));

                  that.launchAll(that, function () {
                    _InteractorClient["default"].launchAndInteract(that._conf, {
                      pm2_version: _package["default"].version
                    }, function (err, data, interactor_proc) {});

                    setTimeout(function () {
                      return cb ? cb(null, {
                        success: true
                      }) : that.speedList();
                    }, 250);
                  });
                });
              });
            });
          });
        });
      });
      return false;
    }
    /**
     * Reload an application
     *
     * @param {String} process_name Application Name or All
     * @param {Object} opts         Options
     * @param {Function} cb         Callback
     */

  }, {
    key: "reload",
    value: function reload(process_name, opts, cb) {
      var that = this;

      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }

      var delay = _Common["default"].lockReload();

      if (delay > 0 && opts.force != true) {
        _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Reload already in progress, please try again in ' + Math.floor((conf.RELOAD_LOCK_TIMEOUT - delay) / 1000) + ' seconds or use --force');

        return cb ? cb(new Error('Reload in progress')) : that.exitCli(conf.ERROR_EXIT);
      }

      if (_Common["default"].isConfigFile(process_name)) that._startJson(process_name, opts, 'reloadProcessId', function (err, apps) {
        _Common["default"].unlockReload();

        if (err) return cb ? cb(err) : that.exitCli(conf.ERROR_EXIT);
        return cb ? cb(null, apps) : that.exitCli(conf.SUCCESS_EXIT);
      });else {
        if (opts && opts.env) {
          var err = 'Using --env [env] without passing the ecosystem.config.js does not work';

          _Common["default"].err(err);

          _Common["default"].unlockReload();

          return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
        }

        if (opts && !opts.updateEnv) _Common["default"].printOut(IMMUTABLE_MSG);

        that._operate('reloadProcessId', process_name, opts, function (err, apps) {
          _Common["default"].unlockReload();

          if (err) return cb ? cb(err) : that.exitCli(conf.ERROR_EXIT);
          return cb ? cb(null, apps) : that.exitCli(conf.SUCCESS_EXIT);
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
      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }

      var that = this;
      if (typeof cmd === 'number') cmd = cmd.toString();

      if (cmd == "-") {
        // Restart from PIPED JSON
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', function (param) {
          process.stdin.pause();
          that.actionFromJson('restartProcessId', param, opts, 'pipe', cb);
        });
      } else if (_Common["default"].isConfigFile(cmd) || (0, _typeof2["default"])(cmd) === 'object') that._startJson(cmd, opts, 'restartProcessId', cb);else {
        if (opts && opts.env) {
          var err = 'Using --env [env] without passing the ecosystem.config.js does not work';

          _Common["default"].err(err);

          return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
        }

        if (opts && !opts.updateEnv) _Common["default"].printOut(IMMUTABLE_MSG);

        that._operate('restartProcessId', cmd, opts, cb);
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
      var _this2 = this;

      var that = this;

      if (typeof jsonVia === "function") {
        cb = jsonVia;
        jsonVia = null;
      }

      if (typeof process_name === "number") {
        process_name = process_name.toString();
      }

      if (jsonVia == 'pipe') return that.actionFromJson('deleteProcessId', process_name, _commander["default"], 'pipe', function (err, procs) {
        return cb ? cb(err, procs) : _this2.speedList();
      });
      if (_Common["default"].isConfigFile(process_name)) return that.actionFromJson('deleteProcessId', process_name, _commander["default"], 'file', function (err, procs) {
        return cb ? cb(err, procs) : _this2.speedList();
      });else {
        that._operate('deleteProcessId', process_name, function (err, procs) {
          return cb ? cb(err, procs) : _this2.speedList();
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
      var _this4 = this;

      var that = this;
      if (typeof process_name === 'number') process_name = process_name.toString();

      if (process_name == "-") {
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', function (param) {
          var _this3 = this;

          process.stdin.pause();
          that.actionFromJson('stopProcessId', param, _commander["default"], 'pipe', function (err, procs) {
            return cb ? cb(err, procs) : _this3.speedList();
          });
        });
      } else if (_Common["default"].isConfigFile(process_name)) that.actionFromJson('stopProcessId', process_name, _commander["default"], 'file', function (err, procs) {
        return cb ? cb(err, procs) : _this4.speedList();
      });else that._operate('stopProcessId', process_name, function (err, procs) {
        return cb ? cb(err, procs) : _this4.speedList();
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
      var that = this;

      if (typeof opts == 'function') {
        cb = opts;
        opts = null;
      }

      that.Client.executeRemote('getMonitorData', {}, function (err, list) {
        if (err) {
          _Common["default"].printError(err);

          return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
        }

        if (opts && opts.rawArgs && opts.rawArgs.indexOf('--watch') > -1) {
          var show = function show() {
            process.stdout.write('\x1b[2J');
            process.stdout.write('\x1b[0f');
            console.log('Last refresh: ', (0, _dayjs["default"])().format());
            that.Client.executeRemote('getMonitorData', {}, function (err, list) {
              _UX["default"].list(list, null);
            });
          };

          show();
          setInterval(show, 900);
          return false;
        }

        return cb ? cb(null, list) : that.speedList(null);
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
      process.env.PM2_STATUS = 'stopping';
      var that = this;
      that.Client.executeRemote('notifyKillPM2', {}, function () {});

      _Common["default"].printOut(conf.PREFIX_MSG + '[v] Modules Stopped');

      that._operate('deleteProcessId', 'all', function (err, list) {
        _Common["default"].printOut(conf.PREFIX_MSG + '[v] All Applications Stopped');

        process.env.PM2_SILENT = 'false';
        that.killAgent(function (err, data) {
          if (!err) {
            _Common["default"].printOut(conf.PREFIX_MSG + '[v] Agent Stopped');
          }

          that.Client.killDaemon(function (err, res) {
            if (err) _Common["default"].printError(err);

            _Common["default"].printOut(conf.PREFIX_MSG + '[v] PM2 Daemon Stopped');

            return cb ? cb(err, res) : that.exitCli(conf.SUCCESS_EXIT);
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
      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }

      var that = this;
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

        return cb ? cb(_Common["default"].retErr(appConf)) : that.exitCli(conf.ERROR_EXIT);
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

      (0, _series["default"])([restartExistingProcessName, restartExistingNameSpace, restartExistingProcessId, restartExistingProcessPathOrStartNew], function (err, data) {
        if (err instanceof Error) return cb ? cb(err) : that.exitCli(conf.ERROR_EXIT);
        var ret = {};
        data.forEach(function (_dt) {
          if (_dt !== undefined) ret = _dt;
        });
        return cb ? cb(null, ret) : that.speedList();
      });
      /**
       * If start <app_name> start/restart application
       */

      function restartExistingProcessName(cb) {
        if (!isNaN(script) || typeof script === 'string' && script.indexOf('/') != -1 || typeof script === 'string' && _path["default"].extname(script) !== '') return cb(null);
        that.Client.getProcessIdByName(script, function (err, ids) {
          if (err && cb) return cb(err);

          if (ids.length > 0) {
            that._operate('restartProcessId', script, opts, function (err, list) {
              if (err) return cb(err);

              _Common["default"].printOut(conf.PREFIX_MSG + 'Process successfully started');

              return cb(true, list);
            });
          } else return cb(null);
        });
      }
      /**
       * If start <namespace> start/restart namespace
       */


      function restartExistingNameSpace(cb) {
        if (!isNaN(script) || typeof script === 'string' && script.indexOf('/') != -1 || typeof script === 'string' && _path["default"].extname(script) !== '') return cb(null);

        if (script !== 'all') {
          that.Client.getProcessIdsByNamespace(script, function (err, ids) {
            if (err && cb) return cb(err);

            if (ids.length > 0) {
              that._operate('restartProcessId', script, opts, function (err, list) {
                if (err) return cb(err);

                _Common["default"].printOut(conf.PREFIX_MSG + 'Process successfully started');

                return cb(true, list);
              });
            } else return cb(null);
          });
        } else {
          that._operate('restartProcessId', 'all', function (err, list) {
            if (err) return cb(err);

            _Common["default"].printOut(conf.PREFIX_MSG + 'Process successfully started');

            return cb(true, list);
          });
        }
      }

      function restartExistingProcessId(cb) {
        if (isNaN(script)) return cb(null);

        that._operate('restartProcessId', script, opts, function (err, list) {
          if (err) return cb(err);

          _Common["default"].printOut(conf.PREFIX_MSG + 'Process successfully started');

          return cb(true, list);
        });
      }
      /**
       * Restart a process with the same full path
       * Or start it
       */


      function restartExistingProcessPathOrStartNew(cb) {
        that.Client.executeRemote('getMonitorData', {}, function (err, procs) {
          if (err) return cb ? cb(new Error(err)) : that.exitCli(conf.ERROR_EXIT);

          var full_path = _path["default"].resolve(that.cwd, script);

          var managed_script = null;
          procs.forEach(function (proc) {
            if (proc.pm2_env.pm_exec_path == full_path && proc.pm2_env.name == app_conf.name) managed_script = proc;
          });

          if (managed_script && (managed_script.pm2_env.status == conf.STOPPED_STATUS || managed_script.pm2_env.status == conf.STOPPING_STATUS || managed_script.pm2_env.status == conf.ERRORED_STATUS)) {
            // Restart process if stopped
            var app_name = managed_script.pm2_env.name;

            that._operate('restartProcessId', app_name, opts, function (err, list) {
              if (err) return cb ? cb(new Error(err)) : that.exitCli(conf.ERROR_EXIT);

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
              cwd: that.cwd,
              pm2_home: that.pm2_home
            }, app_conf);
          } catch (e) {
            _Common["default"].err(e.message);

            return cb(_Common["default"].retErr(e));
          }

          _Common["default"].printOut(conf.PREFIX_MSG + 'Starting %s in %s (%d instance' + (resolved_paths.instances > 1 ? 's' : '') + ')', resolved_paths.pm_exec_path, resolved_paths.exec_mode, resolved_paths.instances);

          if (!resolved_paths.env) resolved_paths.env = {}; // Set PM2 HOME in case of child process using PM2 API

          resolved_paths.env['PM2_HOME'] = that.pm2_home;

          var additional_env = _Modularizer["default"].getAdditionalConf(resolved_paths.name);

          _util["default"].inherits(resolved_paths.env, additional_env); // Is KM linked?


          resolved_paths.km_link = that.gl_is_km_linked;
          that.Client.executeRemote('prepare', resolved_paths, function (err, data) {
            if (err) {
              _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Error while launching application', err.stack || err);

              return cb(_Common["default"].retErr(err));
            }

            _Common["default"].printOut(conf.PREFIX_MSG + 'Done.');

            return cb(true, data);
          });
          return false;
        });
      }
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
      var config = {};
      var appConf = [];
      var staticConf = [];
      var deployConf = {};
      var apps_info = [];
      var that = this;
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

        var file_path = isAbsolute ? file : _path["default"].join(that.cwd, file);
        debug('Resolved filepath %s', file_path);

        try {
          data = _fs["default"].readFileSync(file_path);
        } catch (e) {
          _Common["default"].printError(conf.PREFIX_MSG_ERR + 'File ' + file + ' not found');

          return cb ? cb(_Common["default"].retErr(e)) : that.exitCli(conf.ERROR_EXIT);
        }

        try {
          config = _Common["default"].parseConfig(data, file);
        } catch (e) {
          _Common["default"].printError(conf.PREFIX_MSG_ERR + 'File ' + file + ' malformated');

          console.error(e);
          return cb ? cb(_Common["default"].retErr(e)) : that.exitCli(conf.ERROR_EXIT);
        }
      }
      /**
       * Alias some optional fields
       */


      if (config.deploy) deployConf = config.deploy;
      if (config["static"]) staticConf = config["static"];
      if (config.apps) appConf = config.apps;else if (config.pm2) appConf = config.pm2;else appConf = config;
      if (!Array.isArray(appConf)) appConf = [appConf];
      if ((appConf = _Common["default"].verifyConfs(appConf)) instanceof Error) return cb ? cb(appConf) : that.exitCli(conf.ERROR_EXIT);
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
      that.Client.executeRemote('getMonitorData', {}, function (err, raw_proc_list) {
        if (err) {
          _Common["default"].printError(err);

          return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
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

          that._operate(action, proc_name, env, function (err, ret) {
            if (err) _Common["default"].printError(err); // For return

            apps_info = apps_info.concat(ret);
            that.Client.notifyGod(action, proc_name); // And Remove from array to spy

            apps_name.splice(apps_name.indexOf(proc_name), 1);
            return next();
          });
        }, function (err) {
          if (err) return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
          if (apps_name.length > 0 && action != 'start') _Common["default"].printOut(conf.PREFIX_MSG_WARNING + 'Applications %s not running, starting...', apps_name.join(', ')); // Start missing apps

          return startApps(apps_name, function (err, apps) {
            apps_info = apps_info.concat(apps);
            return cb ? cb(err, apps_info) : that.speedList(err ? 1 : 0);
          });
        });
        return false;
      });

      function startApps(app_name_to_start, cb) {
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
              cwd: that.cwd,
              pm2_home: that.pm2_home
            }, app);
          } catch (e) {
            apps_errored.push(e);

            _Common["default"].err("Error: ".concat(e.message));

            return next();
          }

          if (!resolved_paths.env) resolved_paths.env = {}; // Set PM2 HOME in case of child process using PM2 API

          resolved_paths.env['PM2_HOME'] = that.pm2_home;

          var additional_env = _Modularizer["default"].getAdditionalConf(resolved_paths.name);

          _util["default"].inherits(resolved_paths.env, additional_env);

          resolved_paths.env = _Common["default"].mergeEnvironmentVariables(resolved_paths, opts.env, deployConf);
          delete resolved_paths.env.current_conf; // Is KM linked?

          resolved_paths.km_link = that.gl_is_km_linked;

          if (resolved_paths.wait_ready) {
            _Common["default"].warn("App ".concat(resolved_paths.name, " has option 'wait_ready' set, waiting for app to be ready..."));
          }

          that.Client.executeRemote('prepare', resolved_paths, function (err, data) {
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
          return cb ? cb(final_error, apps_started) : that.speedList();
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
      var appConf = {};
      var ret_processes = [];
      var that = this; //accept programmatic calls

      if ((0, _typeof2["default"])(file) == 'object') {
        cb = typeof jsonVia == 'function' ? jsonVia : cb;
        appConf = file;
      } else if (jsonVia == 'file') {
        var data = null;

        try {
          data = _fs["default"].readFileSync(file);
        } catch (e) {
          _Common["default"].printError(conf.PREFIX_MSG_ERR + 'File ' + file + ' not found');

          return cb ? cb(_Common["default"].retErr(e)) : that.exitCli(conf.ERROR_EXIT);
        }

        try {
          appConf = _Common["default"].parseConfig(data, file);
        } catch (e) {
          _Common["default"].printError(conf.PREFIX_MSG_ERR + 'File ' + file + ' malformated');

          console.error(e);
          return cb ? cb(_Common["default"].retErr(e)) : that.exitCli(conf.ERROR_EXIT);
        }
      } else if (jsonVia == 'pipe') {
        appConf = _Common["default"].parseConfig(file, 'pipe');
      } else {
        _Common["default"].printError('Bad call to actionFromJson, jsonVia should be one of file, pipe');

        return that.exitCli(conf.ERROR_EXIT);
      } // Backward compatibility


      if (appConf.apps) appConf = appConf.apps;
      if (!Array.isArray(appConf)) appConf = [appConf];
      if ((appConf = _Common["default"].verifyConfs(appConf)) instanceof Error) return cb ? cb(appConf) : that.exitCli(conf.ERROR_EXIT);
      (0, _eachLimit["default"])(appConf, conf.CONCURRENT_ACTIONS, function (proc, next1) {
        var name = '';
        var new_env;
        if (!proc.name) name = _path["default"].basename(proc.script);else name = proc.name;
        if (opts.only && opts.only != name) return process.nextTick(next1);
        if (opts && opts.env) new_env = _Common["default"].mergeEnvironmentVariables(proc, opts.env);else new_env = _Common["default"].mergeEnvironmentVariables(proc);
        that.Client.getProcessIdByName(name, function (err, ids) {
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

            that.Client.executeRemote(action, opts, function (err, res) {
              ret_processes.push(res);

              if (err) {
                _Common["default"].printError(err);

                return next2();
              }

              if (action == 'restartProcessId') {
                that.Client.notifyGod('restart', id);
              } else if (action == 'deleteProcessId') {
                that.Client.notifyGod('delete', id);
              } else if (action == 'stopProcessId') {
                that.Client.notifyGod('stop', id);
              }

              _Common["default"].printOut(conf.PREFIX_MSG + "[%s](%d) \u2713", name, id);

              return next2();
            });
          }, function (err) {
            return next1(null, ret_processes);
          });
        });
      }, function (err) {
        if (cb) return cb(null, ret_processes);else return that.speedList();
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
      var that = this;
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
        envs = that._handleAttributeUpdate(envs);
      }
      /**
       * Set current updated configuration if not passed
       */


      if (!envs.current_conf) {
        var _conf = (0, _fclone["default"])(envs);

        envs = {
          current_conf: _conf
        }; // Is KM linked?

        envs.current_conf.km_link = that.gl_is_km_linked;
      }
      /**
       * Operate action on specific process id
       */


      function processIds(ids, cb) {
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

          that.Client.executeRemote(action_name, opts, function (err, res) {
            if (err) {
              _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Process %s not found', id);

              return next("Process ".concat(id, " not found"));
            }

            if (action_name == 'restartProcessId') {
              that.Client.notifyGod('restart', id);
            } else if (action_name == 'deleteProcessId') {
              that.Client.notifyGod('delete', id);
            } else if (action_name == 'stopProcessId') {
              that.Client.notifyGod('stop', id);
            } else if (action_name == 'reloadProcessId') {
              that.Client.notifyGod('reload', id);
            } else if (action_name == 'softReloadProcessId') {
              that.Client.notifyGod('graceful reload', id);
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
          if (err) return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
          return cb ? cb(null, ret) : that.speedList();
        });
      }

      if (process_name == 'all') {
        var reoperate = function reoperate(err, ids) {
          if (err) {
            _Common["default"].printError(err);

            return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
          }

          if (!ids || ids.length === 0) {
            _Common["default"].printError(conf.PREFIX_MSG_WARNING + 'No process found');

            return cb ? cb(new Error('process name not found')) : that.exitCli(conf.ERROR_EXIT);
          }

          return processIds(ids, cb);
        };

        // When using shortcuts like 'all', do not delete modules
        var fn;
        if (process.env.PM2_STATUS == 'stopping') that.Client.getAllProcessId(function (err, ids) {
          reoperate(err, ids);
        });else that.Client.getAllProcessIdWithoutModules(function (err, ids) {
          reoperate(err, ids);
        });
      } // operate using regex
      else if (isNaN(process_name) && process_name[0] === '/' && process_name[process_name.length - 1] === '/') {
          var regex = new RegExp(process_name.replace(/\//g, ''));
          that.Client.executeRemote('getMonitorData', {}, function (err, list) {
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

              return cb ? cb(new Error('process name not found')) : that.exitCli(conf.ERROR_EXIT);
            }

            return processIds(found_proc, cb);
          });
        } else if (isNaN(process_name)) {
          /**
           * We can not stop or delete a module but we can restart it
           * to refresh configuration variable
           */
          var allow_module_restart = action_name == 'restartProcessId' ? true : false;
          that.Client.getProcessIdByName(process_name, allow_module_restart, function (err, ids) {
            if (err) {
              _Common["default"].printError(err);

              return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
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

            that.Client.getProcessIdsByNamespace(process_name, allow_module_restart, function (err, ns_process_ids) {
              if (err) {
                _Common["default"].printError(err);

                return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
              }

              if (!ns_process_ids || ns_process_ids.length === 0) {
                _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Process or Namespace %s not found', process_name);

                return cb ? cb(new Error('process or namespace not found')) : that.exitCli(conf.ERROR_EXIT);
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
          if (that.pm2_configuration.docker == "true" || that.pm2_configuration.docker == true) {
            // Docker/Systemd process interaction detection
            that.Client.executeRemote('getMonitorData', {}, function (err, proc_list) {
              var higher_id = 0;
              proc_list.forEach(function (p) {
                p.pm_id > higher_id ? higher_id = p.pm_id : null;
              }); // Is Docker/Systemd

              if (process_name > higher_id) return _Docker["default"].processCommand(that, higher_id, process_name, action_name, function (err) {
                if (err) {
                  _Common["default"].printError(conf.PREFIX_MSG_ERR + (err.message ? err.message : err));

                  return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
                }

                return cb ? cb(null, ret) : that.speedList();
              }); // Check if application name as number is an app name

              that.Client.getProcessIdByName(process_name, function (err, ids) {
                if (ids.length > 0) return processIds(ids, cb); // Check if application name as number is an namespace

                that.Client.getProcessIdsByNamespace(process_name, function (err, ns_process_ids) {
                  if (ns_process_ids.length > 0) return processIds(ns_process_ids, cb); // Else operate on pm id

                  return processIds([process_name], cb);
                });
              });
            });
          } else {
            // Check if application name as number is an app name
            that.Client.getProcessIdByName(process_name, function (err, ids) {
              if (ids.length > 0) return processIds(ids, cb); // Check if application name as number is an namespace

              that.Client.getProcessIdsByNamespace(process_name, function (err, ns_process_ids) {
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

      var that = this;
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
      var that = this;
      this.Client.getProcessIdByName(name, function (err, id) {
        if (err) {
          _Common["default"].printError(err);

          return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
        }

        console.log(id);
        return cb ? cb(null, id) : that.exitCli(conf.SUCCESS_EXIT);
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
      var that = this;
      that.Client.executeRemote('getMonitorData', {}, function (err, list) {
        if (err) {
          _Common["default"].printError(err);

          return that.exitCli(conf.ERROR_EXIT);
        }

        if (debug) {
          process.stdout.write(_util["default"].inspect(list, false, null, false));
        } else {
          process.stdout.write(JSON.stringify(list));
        }

        that.exitCli(conf.SUCCESS_EXIT);
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
      var _this5 = this;

      this.Client.executeRemote('getSystemData', {}, function (err, sys_infos) {
        if (err) {
          _Common["default"].err(err);

          return _this5.exitCli(conf.ERROR_EXIT);
        }

        if (tree === true) {// console.log(treeify.asTree(sys_infos, true))
        } else process.stdout.write(_util["default"].inspect(sys_infos, false, null, false));

        _this5.exitCli(conf.SUCCESS_EXIT);
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
      var that = this;
      var systemdata = null;
      var acted = [];

      if (code != 0 && code != null) {
        return that.exitCli(code ? code : conf.SUCCESS_EXIT);
      }

      if (apps_acted && apps_acted.length > 0) {
        apps_acted.forEach(function (proc) {
          acted.push(proc.pm2_env ? proc.pm2_env.pm_id : proc.pm_id);
        });
      } // Do nothing if PM2 called programmatically and not called from CLI (also in exitCli)


      if (conf.PM2_PROGRAMMATIC && process.env.PM2_USAGE != 'CLI') return false;
      return that.Client.executeRemote('getSystemData', {}, function (err, sys_infos) {
        that.Client.executeRemote('getMonitorData', {}, function (err, proc_list) {
          doList(err, proc_list, sys_infos);
        });
      });

      function doList(err, list, sys_infos) {
        if (err) {
          if (that.gl_retry == 0) {
            that.gl_retry += 1;
            return setTimeout(that.speedList.bind(that), 1400);
          }

          console.error('Error retrieving process list: %s.\nA process seems to be on infinite loop, retry in 5 seconds', err);
          return that.exitCli(conf.ERROR_EXIT);
        }

        if (process.stdout.isTTY === false) {
          _UX["default"].list_min(list);
        } else if (_commander["default"].miniList && !_commander["default"].silent) _UX["default"].list_min(list);else if (!_commander["default"].silent) {
          if (that.gl_interact_infos) {
            var dashboard_url = "https://app.pm2.io/#/r/".concat(that.gl_interact_infos.public_key);

            if (that.gl_interact_infos.info_node != 'https://root.keymetrics.io') {
              dashboard_url = "".concat(that.gl_interact_infos.info_node, "/#/r/").concat(that.gl_interact_infos.public_key);
            }

            _Common["default"].printOut('%s PM2+ activated | Instance Name: %s | Dash: %s', _chalk["default"].green.bold('⇆'), _chalk["default"].bold(that.gl_interact_infos.machine_name), _chalk["default"].bold(dashboard_url));
          }

          _UX["default"].list(list, sys_infos); //Common.printOut(chalk.white.italic(' Use `pm2 show <id|name>` to get more details about an app'));

        }

        if (that.Client.daemon_mode == false) {
          _Common["default"].printOut('[--no-daemon] Continue to stream logs');

          _Common["default"].printOut('[--no-daemon] Exit on target PM2 exit pid=' + _fs["default"].readFileSync(conf.PM2_PID_FILE_PATH).toString());

          global["_auto_exit"] = true;
          return that.streamLogs('all', 0, false, 'HH:mm:ss', false);
        } // if (process.stdout.isTTY) if looking for start logs
        else if (!process.env.TRAVIS && process.env.NODE_ENV != 'test' && acted.length > 0 && _commander["default"].attach === true) {
            _Common["default"].info("Log streaming apps id: ".concat(_chalk["default"].cyan(acted.join(' ')), ", exit with Ctrl-C or will exit in 10secs")); // setTimeout(() => {
            //   Common.info(`Log streaming exited automatically, run 'pm2 logs' to continue watching logs`)
            //   return that.exitCli(code ? code : conf.SUCCESS_EXIT);
            // }, 10000)


            return acted.forEach(function (proc_name) {
              that.streamLogs(proc_name, 0, false, null, false);
            });
          } else {
            return that.exitCli(code ? code : conf.SUCCESS_EXIT);
          }
      }
    }
    /**
     * Scale up/down a process
     * @method scale
     */

  }, {
    key: "scale",
    value: function scale(app_name, number, cb) {
      var that = this;

      function addProcs(proc, value, cb) {
        (function ex(proc, number) {
          if (number-- === 0) return cb();

          _Common["default"].printOut(conf.PREFIX_MSG + 'Scaling up application');

          that.Client.executeRemote('duplicateProcessId', proc.pm2_env.pm_id, ex.bind(this, proc, number));
        })(proc, number);
      }

      function rmProcs(procs, value, cb) {
        var i = 0;

        (function ex(procs, number) {
          if (number++ === 0) return cb();

          that._operate('deleteProcessId', procs[i++].pm2_env.pm_id, ex.bind(this, procs, number));
        })(procs, number);
      }

      function end() {
        return cb ? cb(null, {
          success: true
        }) : that.speedList();
      }

      this.Client.getProcessByName(app_name, function (err, procs) {
        if (err) {
          _Common["default"].printError(err);

          return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(conf.ERROR_EXIT);
        }

        if (!procs || procs.length === 0) {
          _Common["default"].printError(conf.PREFIX_MSG_ERR + 'Application %s not found', app_name);

          return cb ? cb(new Error('App not found')) : that.exitCli(conf.ERROR_EXIT);
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

            return cb ? cb(new Error('Same process number')) : that.exitCli(conf.ERROR_EXIT);
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
      var that = this;
      var found_proc = [];
      that.Client.executeRemote('getMonitorData', {}, function (err, list) {
        if (err) {
          _Common["default"].printError('Error retrieving process list: ' + err);

          that.exitCli(conf.ERROR_EXIT);
        }

        list.forEach(function (proc) {
          if (!isNaN(pm2_id) && proc.pm_id == pm2_id || typeof pm2_id === 'string' && proc.name == pm2_id) {
            found_proc.push(proc);
          }
        });

        if (found_proc.length === 0) {
          _Common["default"].printError(conf.PREFIX_MSG_WARNING + '%s doesn\'t exist', pm2_id);

          return cb ? cb(null, []) : that.exitCli(conf.ERROR_EXIT);
        }

        if (!cb) {
          found_proc.forEach(function (proc) {
            _UX["default"].describe(proc);
          });
        }

        return cb ? cb(null, found_proc) : that.exitCli(conf.SUCCESS_EXIT);
      });
    }
    /**
     * API method to perform a deep update of PM2
     * @method deepUpdate
     */

  }, {
    key: "deepUpdate",
    value: function deepUpdate(cb) {
      var that = this;

      _Common["default"].printOut(conf.PREFIX_MSG + 'Updating PM2...');

      var child = (0, _sexec["default"])("npm i -g pm2@latest; pm2 update");
      child.stdout.on('end', function () {
        _Common["default"].printOut(conf.PREFIX_MSG + 'PM2 successfully updated');

        cb ? cb(null, {
          success: true
        }) : that.exitCli(conf.SUCCESS_EXIT);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9BUEkudHMiXSwibmFtZXMiOlsiZGVidWciLCJJTU1VVEFCTEVfTVNHIiwiY2hhbGsiLCJib2xkIiwiYmx1ZSIsImNvbmYiLCJjc3QiLCJBUEkiLCJvcHRzIiwidGhhdCIsImRhZW1vbl9tb2RlIiwicG0yX2hvbWUiLCJQTTJfUk9PVF9QQVRIIiwicHVibGljX2tleSIsIlBVQkxJQ19LRVkiLCJzZWNyZXRfa2V5IiwiU0VDUkVUX0tFWSIsIm1hY2hpbmVfbmFtZSIsIk1BQ0hJTkVfTkFNRSIsImN3ZCIsInByb2Nlc3MiLCJwYXRoIiwicmVzb2x2ZSIsImluZGVwZW5kZW50IiwiRXJyb3IiLCJ1dGlsIiwiaW5oZXJpdHMiLCJJU19XSU5ET1dTIiwicmFuZG9tX2ZpbGUiLCJjcnlwdG8iLCJyYW5kb21CeXRlcyIsInRvU3RyaW5nIiwiam9pbiIsIl9jb25mIiwiQ2xpZW50IiwicG0yX2NvbmZpZ3VyYXRpb24iLCJDb25maWd1cmF0aW9uIiwiZ2V0U3luYyIsImdsX2ludGVyYWN0X2luZm9zIiwiZ2xfaXNfa21fbGlua2VkIiwicGlkIiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJJTlRFUkFDVE9SX1BJRF9QQVRIIiwicGFyc2VJbnQiLCJ0cmltIiwia2lsbCIsImUiLCJlbnYiLCJOT0RFX0VOViIsIktNRGFlbW9uIiwicGluZyIsImVyciIsInJlc3VsdCIsInJlYWRGaWxlIiwiSU5URVJBQ1RJT05fQ09ORiIsIkpTT04iLCJwYXJzZSIsImpzb241IiwiY29uc29sZSIsImVycm9yIiwiZ2xfcmV0cnkiLCJub0RhZW1vbiIsImNiIiwic3RhcnRfdGltZXIiLCJEYXRlIiwic3RhcnQiLCJtZXRhIiwibmV3X3BtMl9pbnN0YW5jZSIsImxhdW5jaEFsbCIsImVycl9tb2QiLCJraWxsRGFlbW9uIiwiY21kIiwidGVzdF9wYXRoIiwidGVzdF9wYXRoXzIiLCJpbmRleE9mIiwiYWNjZXNzIiwiY29uc3RhbnRzIiwiUl9PSyIsImNsb3NlIiwiZGF0YSIsImRpc2Nvbm5lY3QiLCJsYXVuY2hCdXMiLCJjb2RlIiwiUE0yX1BST0dSQU1NQVRJQyIsIlBNMl9VU0FHRSIsImRpc2Nvbm5lY3RSUEMiLCJmZHMiLCJ0cnlUb0V4aXQiLCJleGl0Iiwic3Rkb3V0Iiwic3RkZXJyIiwiZm9yRWFjaCIsInN0ZCIsImZkIiwiYnVmZmVyU2l6ZSIsIndyaXRlIiwic2VtdmVyIiwibHQiLCJ2ZXJzaW9uIiwiQ29tbW9uIiwicHJpbnRPdXQiLCJQUkVGSVhfTVNHX1dBUk5JTkciLCJpc0FycmF5Iiwid2F0Y2giLCJsZW5ndGgiLCJyYXdBcmdzIiwiYXJndiIsImlzQ29uZmlnRmlsZSIsIl9zdGFydEpzb24iLCJwcm9jcyIsInNwZWVkTGlzdCIsIl9zdGFydFNjcmlwdCIsInByb2Nlc3NfbmFtZSIsInByb2Nlc3NJZHMiLCJpZHMiLCJDT05DVVJSRU5UX0FDVElPTlMiLCJpZCIsIm5leHQiLCJleGVjdXRlUmVtb3RlIiwicmVzIiwiUFJFRklYX01TRyIsInJldEVyciIsInN1Y2Nlc3MiLCJnZXRBbGxQcm9jZXNzSWQiLCJwcmludEVycm9yIiwiZXhpdENsaSIsIkVSUk9SX0VYSVQiLCJpc05hTiIsImdldFByb2Nlc3NJZEJ5TmFtZSIsImdldFZlcnNpb24iLCJuZXdfdmVyc2lvbiIsInBrZyIsImR0IiwiX19kaXJuYW1lIiwiUE0yX1VQREFURSIsImxvZyIsImR1bXAiLCJhcmd1bWVudHMiLCJsYXVuY2hEYWVtb24iLCJpbnRlcmFjdG9yIiwiY2hpbGQiLCJsYXVuY2hSUEMiLCJyZXN1cnJlY3QiLCJsYXVuY2hBbmRJbnRlcmFjdCIsInBtMl92ZXJzaW9uIiwiaW50ZXJhY3Rvcl9wcm9jIiwic2V0VGltZW91dCIsImRlbGF5IiwibG9ja1JlbG9hZCIsImZvcmNlIiwiUFJFRklYX01TR19FUlIiLCJNYXRoIiwiZmxvb3IiLCJSRUxPQURfTE9DS19USU1FT1VUIiwiYXBwcyIsInVubG9ja1JlbG9hZCIsIlNVQ0NFU1NfRVhJVCIsInVwZGF0ZUVudiIsIl9vcGVyYXRlIiwic3RkaW4iLCJyZXN1bWUiLCJzZXRFbmNvZGluZyIsIm9uIiwicGFyYW0iLCJwYXVzZSIsImFjdGlvbkZyb21Kc29uIiwianNvblZpYSIsImNvbW1hbmRlciIsImxpc3QiLCJzaG93IiwiZm9ybWF0IiwiVVgiLCJzZXRJbnRlcnZhbCIsIlBNMl9TVEFUVVMiLCJQTTJfU0lMRU5UIiwia2lsbEFnZW50Iiwic2NyaXB0IiwiYXBwX2NvbmYiLCJDb25maWciLCJmaWx0ZXJPcHRpb25zIiwiYXBwQ29uZiIsIm5hbWUiLCJhcmdzIiwiYXJnc0luZGV4Iiwic2xpY2UiLCJzY3JpcHRBcmdzIiwibmFtZXNwYWNlIiwidmVyaWZ5Q29uZnMiLCJ3YXRjaERlbGF5Iiwid2F0Y2hfZGVsYXkiLCJwYXJzZUZsb2F0IiwibWFzIiwiZXh0IiwiaGYiLCJtYWtlX2F2YWlsYWJsZV9leHRlbnNpb24iLCJpZ25vcmVfd2F0Y2giLCJkc3RfcGF0aCIsIlBXRCIsIndyaXRlRmlsZVN5bmMiLCJzdHJpbmdpZnkiLCJzdGFjayIsInJlc3RhcnRFeGlzdGluZ1Byb2Nlc3NOYW1lIiwicmVzdGFydEV4aXN0aW5nTmFtZVNwYWNlIiwicmVzdGFydEV4aXN0aW5nUHJvY2Vzc0lkIiwicmVzdGFydEV4aXN0aW5nUHJvY2Vzc1BhdGhPclN0YXJ0TmV3IiwicmV0IiwiX2R0IiwidW5kZWZpbmVkIiwiZXh0bmFtZSIsImdldFByb2Nlc3NJZHNCeU5hbWVzcGFjZSIsImZ1bGxfcGF0aCIsIm1hbmFnZWRfc2NyaXB0IiwicHJvYyIsInBtMl9lbnYiLCJwbV9leGVjX3BhdGgiLCJzdGF0dXMiLCJTVE9QUEVEX1NUQVRVUyIsIlNUT1BQSU5HX1NUQVRVUyIsIkVSUk9SRURfU1RBVFVTIiwiYXBwX25hbWUiLCJyZXNvbHZlZF9wYXRocyIsInJlc29sdmVBcHBBdHRyaWJ1dGVzIiwibWVzc2FnZSIsImluc3RhbmNlcyIsImV4ZWNfbW9kZSIsImFkZGl0aW9uYWxfZW52IiwiTW9kdWxhcml6ZXIiLCJnZXRBZGRpdGlvbmFsQ29uZiIsImttX2xpbmsiLCJmaWxlIiwiYWN0aW9uIiwicGlwZSIsImNvbmZpZyIsInN0YXRpY0NvbmYiLCJkZXBsb3lDb25mIiwiYXBwc19pbmZvIiwicGFyc2VDb25maWciLCJpc0Fic29sdXRlIiwiZmlsZV9wYXRoIiwiZGVwbG95IiwicG0yIiwiQXJyYXkiLCJQTTJfSlNPTl9QUk9DRVNTSU5HIiwiYXBwc19uYW1lIiwicHJvY19saXN0Iiwic2VydmUiLCJwdXNoIiwicG9ydCIsIlBNMl9TRVJWRV9QT1JUIiwiUE0yX1NFUlZFX0hPU1QiLCJob3N0IiwiUE0yX1NFUlZFX1BBVEgiLCJQTTJfU0VSVkVfU1BBIiwic3BhIiwiUE0yX1NFUlZFX0RJUkVDVE9SWSIsImRpcmVjdG9yeSIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIIiwiYmFzaWNfYXV0aCIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIX1VTRVJOQU1FIiwidXNlcm5hbWUiLCJQTTJfU0VSVkVfQkFTSUNfQVVUSF9QQVNTV09SRCIsInBhc3N3b3JkIiwiUE0yX1NFUlZFX01PTklUT1IiLCJtb25pdG9yIiwiYXBwIiwiaW8iLCJvbmx5Iiwic3BsaXQiLCJpbnN0YWxsX3VybCIsInVpZCIsImdpZCIsImFwcGVuZF9lbnZfdG9fbmFtZSIsIm5hbWVfcHJlZml4IiwiZ2V0Q3VycmVudFVzZXJuYW1lIiwicmF3X3Byb2NfbGlzdCIsIk9iamVjdCIsImtleXMiLCJwcm9jX25hbWUiLCJmaWx0ZXIiLCJlbnZzIiwibWFwIiwibWVyZ2VFbnZpcm9ubWVudFZhcmlhYmxlcyIsInJlZHVjZSIsImUxIiwiZTIiLCJjb25jYXQiLCJub3RpZnlHb2QiLCJzcGxpY2UiLCJzdGFydEFwcHMiLCJhcHBfbmFtZV90b19zdGFydCIsImFwcHNfdG9fc3RhcnQiLCJhcHBzX3N0YXJ0ZWQiLCJhcHBzX2Vycm9yZWQiLCJpIiwiZm9yY2VfbmFtZSIsInN0YXJ0ZWRfYXNfbW9kdWxlIiwicG14X21vZHVsZSIsImN1cnJlbnRfY29uZiIsIndhaXRfcmVhZHkiLCJ3YXJuIiwiZmluYWxfZXJyb3IiLCJyZXRfcHJvY2Vzc2VzIiwibmV4dDEiLCJuZXdfZW52IiwiYmFzZW5hbWUiLCJuZXh0VGljayIsIm5leHQyIiwiYWN0aW9uX25hbWUiLCJ1cGRhdGVfZW52IiwiY29uY3VycmVudF9hY3Rpb25zIiwicGFyYWxsZWwiLCJjb21tYW5kcyIsIl9oYW5kbGVBdHRyaWJ1dGVVcGRhdGUiLCJzYWZlRXh0ZW5kIiwiayIsImNyb25fcmVzdGFydCIsInBtX2lkIiwicmVzdGFydF90aW1lIiwicmVvcGVyYXRlIiwiZm4iLCJnZXRBbGxQcm9jZXNzSWRXaXRob3V0TW9kdWxlcyIsInJlZ2V4IiwiUmVnRXhwIiwicmVwbGFjZSIsImZvdW5kX3Byb2MiLCJ0ZXN0IiwiYWxsb3dfbW9kdWxlX3Jlc3RhcnQiLCJuc19wcm9jZXNzX2lkcyIsIm5zX2FkZGl0aW9uYWxfZW52IiwiZG9ja2VyIiwiaGlnaGVyX2lkIiwicCIsIkRvY2tlck1nbXQiLCJwcm9jZXNzQ29tbWFuZCIsIlBNMl9ERUVQX01PTklUT1JJTkciLCJkZWVwX21vbml0b3JpbmciLCJ0cmVla2lsbCIsInBteCIsInZpemlvbiIsImF1dG9tYXRpb24iLCJhdXRvcmVzdGFydCIsImluc3BlY3QiLCJ0cmVlIiwic3lzX2luZm9zIiwiYXBwc19hY3RlZCIsInN5c3RlbWRhdGEiLCJhY3RlZCIsImRvTGlzdCIsImJpbmQiLCJpc1RUWSIsImxpc3RfbWluIiwibWluaUxpc3QiLCJzaWxlbnQiLCJkYXNoYm9hcmRfdXJsIiwiaW5mb19ub2RlIiwiZ3JlZW4iLCJQTTJfUElEX0ZJTEVfUEFUSCIsImdsb2JhbCIsInN0cmVhbUxvZ3MiLCJUUkFWSVMiLCJhdHRhY2giLCJpbmZvIiwiY3lhbiIsIm51bWJlciIsImFkZFByb2NzIiwidmFsdWUiLCJleCIsInJtUHJvY3MiLCJlbmQiLCJnZXRQcm9jZXNzQnlOYW1lIiwicHJvY19udW1iZXIiLCJwbTJfaWQiLCJkZXNjcmliZSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FBS0E7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7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RSxHQUFHQSxFQUFFLENBQUMsSUFBRCxFQUFPc1EsVUFBUCxDQUFMLEdBQTBCNVQsSUFBSSxDQUFDcUgsT0FBTCxDQUFhekgsSUFBSSxDQUFDd0osWUFBbEIsQ0FBbkM7QUFDRCxPQXpCRDtBQTBCRDtBQUVEOzs7Ozs7OytCQUlZOUYsRSxFQUFJO0FBQ2QsVUFBSXRELElBQUksR0FBRyxJQUFYOztBQUVBMkYseUJBQU9DLFFBQVAsQ0FBZ0JoRyxJQUFJLENBQUNvSCxVQUFMLEdBQWtCLGlCQUFsQzs7QUFFQSxVQUFJb0IsS0FBVSxHQUFHLHVCQUFNLGlDQUFOLENBQWpCO0FBRUFBLE1BQUFBLEtBQUssQ0FBQ25ELE1BQU4sQ0FBYXlFLEVBQWIsQ0FBZ0IsS0FBaEIsRUFBdUIsWUFBVztBQUNoQy9ELDJCQUFPQyxRQUFQLENBQWdCaEcsSUFBSSxDQUFDb0gsVUFBTCxHQUFrQiwwQkFBbEM7O0FBQ0ExRCxRQUFBQSxFQUFFLEdBQUdBLEVBQUUsQ0FBQyxJQUFELEVBQU87QUFBQzRELFVBQUFBLE9BQU8sRUFBQztBQUFULFNBQVAsQ0FBTCxHQUE4QmxILElBQUksQ0FBQ3FILE9BQUwsQ0FBYXpILElBQUksQ0FBQ3dKLFlBQWxCLENBQWhDO0FBQ0QsT0FIRDtBQUlEOzs7OztBQUNGLEMsQ0FFRDtBQUNBO0FBQ0E7O0FBRUEsdUJBQVN0SixHQUFUO0FBQ0Esd0JBQVVBLEdBQVY7QUFDQSx1QkFBVUEsR0FBVjtBQUVBLHNCQUFZQSxHQUFaO0FBQ0EsaUNBQWVBLEdBQWY7QUFDQSx5QkFBY0EsR0FBZDtBQUVBLGdDQUFVQSxHQUFWO0FBQ0EseUJBQVdBLEdBQVg7QUFDQSx5QkFBV0EsR0FBWDtBQUNBLCtCQUFRQSxHQUFSO0FBQ0EsK0JBQWFBLEdBQWI7ZUFFZUEsRyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIGxpY2Vuc2UgdGhhdFxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IGNvbW1hbmRlciBmcm9tICdjb21tYW5kZXInO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGVhY2hMaW1pdCBmcm9tICdhc3luYy9lYWNoTGltaXQnO1xuaW1wb3J0IHNlcmllcyBmcm9tICdhc3luYy9zZXJpZXMnO1xuaW1wb3J0IGRlYnVnTG9nZ2VyIGZyb20gJ2RlYnVnJztcbmltcG9ydCB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCBmY2xvbmUgZnJvbSAnZmNsb25lJztcblxuaW1wb3J0IERvY2tlck1nbXQgZnJvbSAnLi9BUEkvRXh0cmFNZ210L0RvY2tlcic7XG5pbXBvcnQgY3N0IGZyb20gJy4uL2NvbnN0YW50cyc7XG5pbXBvcnQgQ2xpZW50IGZyb20gJy4vQ2xpZW50JztcbmltcG9ydCBDb21tb24gZnJvbSAnLi9Db21tb24nO1xuaW1wb3J0IEtNRGFlbW9uIGZyb20gJ0BwbTIvYWdlbnQvc3JjL0ludGVyYWN0b3JDbGllbnQnO1xuaW1wb3J0IENvbmZpZyBmcm9tICcuL3Rvb2xzL0NvbmZpZyc7XG5pbXBvcnQgTW9kdWxhcml6ZXIgZnJvbSAnLi9BUEkvTW9kdWxlcy9Nb2R1bGFyaXplcic7XG5pbXBvcnQgcGF0aF9zdHJ1Y3R1cmUgZnJvbSAnLi4vcGF0aHMnO1xuaW1wb3J0IFVYIGZyb20gJy4vQVBJL1VYJztcbmltcG9ydCBwa2cgZnJvbSAnLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCBoZiBmcm9tICcuL0FQSS9Nb2R1bGVzL2ZsYWdFeHQnO1xuaW1wb3J0IENvbmZpZ3VyYXRpb24gZnJvbSAnLi9Db25maWd1cmF0aW9uJztcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCBzZXhlYyBmcm9tICcuL3Rvb2xzL3NleGVjJztcbmltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJztcbmltcG9ydCBqc29uNSBmcm9tICcuL3Rvb2xzL2pzb241J1xuaW1wb3J0IGRheWpzIGZyb20gJ2RheWpzJztcbmltcG9ydCB0cmVlaWZ5IGZyb20gJy4vdG9vbHMvdHJlZWlmeSdcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIExvYWQgYWxsIEFQSSBtZXRob2RzIC8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5pbXBvcnQgQVBJRXh0cmEgZnJvbSAnLi9BUEkvRXh0cmEnO1xuaW1wb3J0IEFQSURlcGxveSBmcm9tICcuL0FQSS9EZXBsb3knO1xuaW1wb3J0IEFQSU1vZHVsZSBmcm9tICcuL0FQSS9Nb2R1bGVzL2luZGV4JztcblxuaW1wb3J0IEFQSVBsdXNMaW5rIGZyb20gJy4vQVBJL3BtMi1wbHVzL2xpbmsnO1xuaW1wb3J0IEFQSVBsdXNQcm9jZXNzIGZyb20gJy4vQVBJL3BtMi1wbHVzL3Byb2Nlc3Mtc2VsZWN0b3InO1xuaW1wb3J0IEFQSVBsdXNIZWxwZXIgZnJvbSAnLi9BUEkvcG0yLXBsdXMvaGVscGVycyc7XG5cbmltcG9ydCBBUElDb25maWcgZnJvbSAnLi9BUEkvQ29uZmlndXJhdGlvbic7XG5pbXBvcnQgQVBJVmVyc2lvbiBmcm9tICcuL0FQSS9WZXJzaW9uJztcbmltcG9ydCBBUElTdGFydHVwIGZyb20gJy4vQVBJL1N0YXJ0dXAnO1xuaW1wb3J0IEFQSU1nbnQgZnJvbSAnLi9BUEkvTG9nTWFuYWdlbWVudCc7XG5pbXBvcnQgQVBJQ29udGFpbmVyIGZyb20gJy4vQVBJL0NvbnRhaW5lcml6ZXInO1xuXG52YXIgZGVidWcgPSBkZWJ1Z0xvZ2dlcigncG0yOmNsaScpO1xudmFyIElNTVVUQUJMRV9NU0cgPSBjaGFsay5ib2xkLmJsdWUoJ1VzZSAtLXVwZGF0ZS1lbnYgdG8gdXBkYXRlIGVudmlyb25tZW50IHZhcmlhYmxlcycpO1xuXG52YXIgY29uZiA9IGNzdFxuXG4vKipcbiAqIE1haW4gRnVuY3Rpb24gdG8gYmUgaW1wb3J0ZWRcbiAqIGNhbiBiZSBhbGlhc2VkIHRvIFBNMlxuICpcbiAqIFRvIHVzZSBpdCB3aGVuIFBNMiBpcyBpbnN0YWxsZWQgYXMgYSBtb2R1bGU6XG4gKlxuICogdmFyIFBNMiA9IHJlcXVpcmUoJ3BtMicpO1xuICpcbiAqIHZhciBwbTIgPSBQTTIoPG9wdHM+KTtcbiAqXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICBvcHRzXG4gKiBAcGFyYW0ge1N0cmluZ30gIFtvcHRzLmN3ZD08Y3VycmVudD5dICAgICAgICAgb3ZlcnJpZGUgcG0yIGN3ZCBmb3Igc3RhcnRpbmcgc2NyaXB0c1xuICogQHBhcmFtIHtTdHJpbmd9ICBbb3B0cy5wbTJfaG9tZT1bPHBhdGhzLmpzPl1dIHBtMiBkaXJlY3RvcnkgZm9yIGxvZywgcGlkcywgc29ja2V0IGZpbGVzXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRzLmluZGVwZW5kZW50PWZhbHNlXSAgICAgdW5pcXVlIFBNMiBpbnN0YW5jZSAocmFuZG9tIHBtMl9ob21lKVxuICogQHBhcmFtIHtCb29sZWFufSBbb3B0cy5kYWVtb25fbW9kZT10cnVlXSAgICAgIHNob3VsZCBiZSBjYWxsZWQgaW4gdGhlIHNhbWUgcHJvY2VzcyBvciBub3RcbiAqIEBwYXJhbSB7U3RyaW5nfSAgW29wdHMucHVibGljX2tleT1udWxsXSAgICAgICBwbTIgcGx1cyBidWNrZXQgcHVibGljIGtleVxuICogQHBhcmFtIHtTdHJpbmd9ICBbb3B0cy5zZWNyZXRfa2V5PW51bGxdICAgICAgIHBtMiBwbHVzIGJ1Y2tldCBzZWNyZXQga2V5XG4gKiBAcGFyYW0ge1N0cmluZ30gIFtvcHRzLm1hY2hpbmVfbmFtZT1udWxsXSAgICAgcG0yIHBsdXMgaW5zdGFuY2UgbmFtZVxuICovXG5jbGFzcyBBUEkge1xuXG4gIGRhZW1vbl9tb2RlOiBib29sZWFuO1xuICBwbTJfaG9tZTogc3RyaW5nO1xuICBwdWJsaWNfa2V5OiBzdHJpbmc7XG4gIHNlY3JldF9rZXk6IHN0cmluZztcbiAgbWFjaGluZV9uYW1lOiBzdHJpbmc7XG5cbiAgY3dkOiBzdHJpbmc7XG5cbiAgX2NvbmY6IGFueTtcblxuICBDbGllbnQ6IGFueTtcbiAgcG0yX2NvbmZpZ3VyYXRpb246IGFueTtcbiAgZ2xfaW50ZXJhY3RfaW5mb3M6IGFueTtcbiAgZ2xfaXNfa21fbGlua2VkOiBib29sZWFuO1xuXG4gIGdsX3JldHJ5OiBudW1iZXI7XG5cbiAgICBzdGFydF90aW1lcjogRGF0ZTtcbiAga2lsbEFnZW50OiAoY2IpID0+IHZvaWQ7XG4gIGxhdW5jaEFsbDogKGRhdGEsIGNiKSA9PiB2b2lkO1xuICBnZXRWZXJzaW9uOiAoZXJyLCByZXM/KSA9PiB2b2lkO1xuICBkdW1wOiAoZXJyKSA9PiB2b2lkO1xuICByZXN1cnJlY3Q6IChlcnI/KSA9PiB2b2lkO1xuXG4gIHN0cmVhbUxvZ3M6IChhLCBiLCBjLCBkLCBlKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yIChvcHRzPykge1xuICAgIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoaXMuZGFlbW9uX21vZGUgPSB0eXBlb2Yob3B0cy5kYWVtb25fbW9kZSkgPT0gJ3VuZGVmaW5lZCcgPyB0cnVlIDogb3B0cy5kYWVtb25fbW9kZTtcbiAgICB0aGlzLnBtMl9ob21lID0gY29uZi5QTTJfUk9PVF9QQVRIO1xuICAgIHRoaXMucHVibGljX2tleSA9IGNvbmYuUFVCTElDX0tFWSB8fCBvcHRzLnB1YmxpY19rZXkgfHwgbnVsbDtcbiAgICB0aGlzLnNlY3JldF9rZXkgPSBjb25mLlNFQ1JFVF9LRVkgfHwgb3B0cy5zZWNyZXRfa2V5IHx8IG51bGw7XG4gICAgdGhpcy5tYWNoaW5lX25hbWUgPSBjb25mLk1BQ0hJTkVfTkFNRSB8fCBvcHRzLm1hY2hpbmVfbmFtZSB8fCBudWxsXG5cbiAgICAvKipcbiAgICAgKiBDV0QgcmVzb2x1dGlvblxuICAgICAqL1xuICAgIHRoaXMuY3dkID0gcHJvY2Vzcy5jd2QoKTtcbiAgICBpZiAob3B0cy5jd2QpIHtcbiAgICAgIHRoaXMuY3dkID0gcGF0aC5yZXNvbHZlKG9wdHMuY3dkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQTTIgSE9NRSByZXNvbHV0aW9uXG4gICAgICovXG4gICAgaWYgKG9wdHMucG0yX2hvbWUgJiYgb3B0cy5pbmRlcGVuZGVudCA9PSB0cnVlKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgY2Fubm90IHNldCBhIHBtMl9ob21lIGFuZCBpbmRlcGVuZGVudCBpbnN0YW5jZSBpbiBzYW1lIHRpbWUnKTtcblxuICAgIGlmIChvcHRzLnBtMl9ob21lKSB7XG4gICAgICAvLyBPdmVycmlkZSBkZWZhdWx0IGNvbmYgZmlsZVxuICAgICAgdGhpcy5wbTJfaG9tZSA9IG9wdHMucG0yX2hvbWU7XG4gICAgICBjb25mID0gdXRpbC5pbmhlcml0cyhjb25mLCBwYXRoX3N0cnVjdHVyZSh0aGlzLnBtMl9ob21lKSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKG9wdHMuaW5kZXBlbmRlbnQgPT0gdHJ1ZSAmJiBjb25mLklTX1dJTkRPV1MgPT09IGZhbHNlKSB7XG4gICAgICAvLyBDcmVhdGUgYW4gdW5pcXVlIHBtMiBpbnN0YW5jZVxuICAgICAgdmFyIHJhbmRvbV9maWxlID0gY3J5cHRvLnJhbmRvbUJ5dGVzKDgpLnRvU3RyaW5nKCdoZXgnKTtcbiAgICAgIHRoaXMucG0yX2hvbWUgPSBwYXRoLmpvaW4oJy90bXAnLCByYW5kb21fZmlsZSk7XG5cbiAgICAgIC8vIElmIHdlIGRvbnQgZXhwbGljaXRseSB0ZWxsIHRvIGhhdmUgYSBkYWVtb25cbiAgICAgIC8vIEl0IHdpbGwgZ28gYXMgaW4gcHJvY1xuICAgICAgaWYgKHR5cGVvZihvcHRzLmRhZW1vbl9tb2RlKSA9PSAndW5kZWZpbmVkJylcbiAgICAgICAgdGhpcy5kYWVtb25fbW9kZSA9IGZhbHNlO1xuICAgICAgY29uZiA9IHV0aWwuaW5oZXJpdHMoY29uZiwgcGF0aF9zdHJ1Y3R1cmUodGhpcy5wbTJfaG9tZSkpO1xuICAgIH1cblxuICAgIHRoaXMuX2NvbmYgPSBjb25mO1xuXG4gICAgaWYgKGNvbmYuSVNfV0lORE9XUykge1xuICAgICAgLy8gV2VpcmQgZml4LCBtYXkgbmVlZCB0byBiZSBkcm9wcGVkXG4gICAgICAvLyBAdG9kbyB3aW5kb3dzIGNvbm5vaXNzZXVyIGRvdWJsZSBjaGVja1xuICAgICAgLy8gVE9ETzogcGxlYXNlIGNoZWNrIHRoaXNcbiAgICAgIC8vIGlmIChwcm9jZXNzLnN0ZG91dC5faGFuZGxlICYmIHByb2Nlc3Muc3Rkb3V0Ll9oYW5kbGUuc2V0QmxvY2tpbmcpXG4gICAgICAvLyAgIHByb2Nlc3Muc3Rkb3V0Ll9oYW5kbGUuc2V0QmxvY2tpbmcodHJ1ZSk7XG4gICAgfVxuXG4gICAgdGhpcy5DbGllbnQgPSBuZXcgQ2xpZW50KHtcbiAgICAgIHBtMl9ob21lOiB0aGF0LnBtMl9ob21lLFxuICAgICAgY29uZjogdGhpcy5fY29uZixcbiAgICAgIHNlY3JldF9rZXk6IHRoaXMuc2VjcmV0X2tleSxcbiAgICAgIHB1YmxpY19rZXk6IHRoaXMucHVibGljX2tleSxcbiAgICAgIGRhZW1vbl9tb2RlOiB0aGlzLmRhZW1vbl9tb2RlLFxuICAgICAgbWFjaGluZV9uYW1lOiB0aGlzLm1hY2hpbmVfbmFtZVxuICAgIH0pO1xuXG4gICAgdGhpcy5wbTJfY29uZmlndXJhdGlvbiA9IENvbmZpZ3VyYXRpb24uZ2V0U3luYygncG0yJykgfHwge31cblxuICAgIHRoaXMuZ2xfaW50ZXJhY3RfaW5mb3MgPSBudWxsO1xuICAgIHRoaXMuZ2xfaXNfa21fbGlua2VkID0gZmFsc2U7XG5cbiAgICB0cnkge1xuICAgICAgdmFyIHBpZDogYW55ID0gZnMucmVhZEZpbGVTeW5jKGNvbmYuSU5URVJBQ1RPUl9QSURfUEFUSCk7XG4gICAgICBwaWQgPSBwYXJzZUludChwaWQudG9TdHJpbmcoKS50cmltKCkpO1xuICAgICAgcHJvY2Vzcy5raWxsKHBpZCwgMCk7XG4gICAgICB0aGF0LmdsX2lzX2ttX2xpbmtlZCA9IHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhhdC5nbF9pc19rbV9saW5rZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBGb3IgdGVzdGluZyBwdXJwb3Nlc1xuICAgIGlmICh0aGlzLnNlY3JldF9rZXkgJiYgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT0gJ2xvY2FsX3Rlc3QnKVxuICAgICAgdGhhdC5nbF9pc19rbV9saW5rZWQgPSB0cnVlO1xuXG4gICAgS01EYWVtb24ucGluZyh0aGlzLl9jb25mLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuICAgICAgaWYgKCFlcnIgJiYgcmVzdWx0ID09PSB0cnVlKSB7XG4gICAgICAgIGZzLnJlYWRGaWxlKGNvbmYuSU5URVJBQ1RJT05fQ09ORiwgKGVyciwgX2NvbmYpID0+IHtcbiAgICAgICAgICBpZiAoIWVycikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgdGhhdC5nbF9pbnRlcmFjdF9pbmZvcyA9IEpTT04ucGFyc2UoX2NvbmYudG9TdHJpbmcoKSlcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoYXQuZ2xfaW50ZXJhY3RfaW5mb3MgPSBqc29uNS5wYXJzZShfY29uZi50b1N0cmluZygpKVxuICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpXG4gICAgICAgICAgICAgICAgdGhhdC5nbF9pbnRlcmFjdF9pbmZvcyA9IG51bGxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgdGhpcy5nbF9yZXRyeSA9IDA7XG4gIH1cblxuICAvKipcbiAgICogQ29ubmVjdCB0byBQTTJcbiAgICogQ2FsbGluZyB0aGlzIGNvbW1hbmQgaXMgbm93IG9wdGlvbmFsXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIGNhbGxiYWNrIG9uY2UgcG0yIGlzIHJlYWR5IGZvciBjb21tYW5kc1xuICAgKi9cbiAgY29ubmVjdCAobm9EYWVtb24sIGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGlzLnN0YXJ0X3RpbWVyID0gbmV3IERhdGUoKTtcblxuICAgIGlmICh0eXBlb2YoY2IpID09ICd1bmRlZmluZWQnKSB7XG4gICAgICBjYiA9IG5vRGFlbW9uO1xuICAgICAgbm9EYWVtb24gPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKG5vRGFlbW9uID09PSB0cnVlKSB7XG4gICAgICAvLyBCYWNrd2FyZCBjb21wYXRpYmlsaXR5IHdpdGggUE0yIDEueFxuICAgICAgdGhpcy5DbGllbnQuZGFlbW9uX21vZGUgPSBmYWxzZTtcbiAgICAgIHRoaXMuZGFlbW9uX21vZGUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLkNsaWVudC5zdGFydChmdW5jdGlvbihlcnIsIG1ldGEpIHtcbiAgICAgIGlmIChlcnIpXG4gICAgICAgIHJldHVybiBjYihlcnIpO1xuXG4gICAgICBpZiAobWV0YS5uZXdfcG0yX2luc3RhbmNlID09IGZhbHNlICYmIHRoYXQuZGFlbW9uX21vZGUgPT09IHRydWUpXG4gICAgICAgIHJldHVybiBjYihlcnIsIG1ldGEpO1xuXG4gICAgICAvLyBJZiBuZXcgcG0yIGluc3RhbmNlIGhhcyBiZWVuIHBvcHBlZFxuICAgICAgLy8gTGF1Y2ggYWxsIG1vZHVsZXNcbiAgICAgIHRoYXQubGF1bmNoQWxsKHRoYXQsIGZ1bmN0aW9uKGVycl9tb2QpIHtcbiAgICAgICAgcmV0dXJuIGNiKGVyciwgbWV0YSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VmdWxsIHdoZW4gY3VzdG9tIFBNMiBjcmVhdGVkIHdpdGggaW5kZXBlbmRlbnQgZmxhZyBzZXQgdG8gdHJ1ZVxuICAgKiBUaGlzIHdpbGwgY2xlYW51cCB0aGUgbmV3bHkgY3JlYXRlZCBpbnN0YW5jZVxuICAgKiBieSByZW1vdmluZyBmb2xkZXIsIGtpbGxpbmcgUE0yIGFuZCBzbyBvblxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBjYWxsYmFjayBvbmNlIGNsZWFudXAgaXMgc3VjY2Vzc2Z1bGxcbiAgICovXG4gIGRlc3Ryb3kgKGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZGVidWcoJ0tpbGxpbmcgYW5kIGRlbGV0aW5nIGN1cnJlbnQgZGVhbW9uJyk7XG5cbiAgICB0aGlzLmtpbGxEYWVtb24oZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY21kID0gJ3JtIC1yZiAnICsgdGhhdC5wbTJfaG9tZTtcbiAgICAgIHZhciB0ZXN0X3BhdGggPSBwYXRoLmpvaW4odGhhdC5wbTJfaG9tZSwgJ21vZHVsZV9jb25mLmpzb24nKTtcbiAgICAgIHZhciB0ZXN0X3BhdGhfMiA9IHBhdGguam9pbih0aGF0LnBtMl9ob21lLCAncG0yLnBpZCcpO1xuXG4gICAgICBpZiAodGhhdC5wbTJfaG9tZS5pbmRleE9mKCcucG0yJykgPiAtMSlcbiAgICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcignRGVzdHJveSBpcyBub3QgYSBhbGxvd2VkIG1ldGhvZCBvbiAucG0yJykpO1xuXG4gICAgICBmcy5hY2Nlc3ModGVzdF9wYXRoLCBmcy5jb25zdGFudHMuUl9PSywgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgICBkZWJ1ZygnRGVsZXRpbmcgdGVtcG9yYXJ5IGZvbGRlciAlcycsIHRoYXQucG0yX2hvbWUpO1xuICAgICAgICBzZXhlYyhjbWQsIGNiKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2Nvbm5lY3QgZnJvbSBQTTIgaW5zdGFuY2VcbiAgICogVGhpcyB3aWxsIGFsbG93IHlvdXIgc29mdHdhcmUgdG8gZXhpdCBieSBpdHNlbGZcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NiXSBvcHRpb25hbCBjYWxsYmFjayBvbmNlIGNvbm5lY3Rpb24gY2xvc2VkXG4gICAqL1xuICBkaXNjb25uZWN0IChjYj8pIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAoIWNiKSBjYiA9IGZ1bmN0aW9uKCkge307XG5cbiAgICB0aGlzLkNsaWVudC5jbG9zZShmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgIC8vIGRlYnVnKCdUaGUgc2Vzc2lvbiBsYXN0ZWQgJWRzJywgKG5ldyBEYXRlKCkgLSB0aGF0LnN0YXJ0X3RpbWVyKSAvIDEwMDApO1xuICAgICAgcmV0dXJuIGNiKGVyciwgZGF0YSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEFsaWFzIG9uIGRpc2Nvbm5lY3RcbiAgICogQHBhcmFtIGNiXG4gICAqL1xuICBjbG9zZSAoY2IpIHtcbiAgICB0aGlzLmRpc2Nvbm5lY3QoY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIExhdW5jaCBtb2R1bGVzXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIGNhbGxiYWNrIG9uY2UgcG0yIGhhcyBsYXVuY2hlZCBtb2R1bGVzXG4gICAqL1xuICBsYXVuY2hNb2R1bGVzIChjYikge1xuICAgIHRoaXMubGF1bmNoQWxsKHRoaXMsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgYnVzIGFsbG93aW5nIHRvIHJldHJpZXZlIHZhcmlvdXMgcHJvY2VzcyBldmVudFxuICAgKiBsaWtlIGxvZ3MsIHJlc3RhcnRzLCByZWxvYWRzXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIGNhbGxiYWNrIGNhbGxlZCB3aXRoIDFzdCBwYXJhbSBlcnIgYW5kIDJuYiBwYXJhbSB0aGUgYnVzXG4gICAqL1xuICBsYXVuY2hCdXMgKGNiKSB7XG4gICAgdGhpcy5DbGllbnQubGF1bmNoQnVzKGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGl0IG1ldGhvZHMgZm9yIEFQSVxuICAgKiBAcGFyYW0ge0ludGVnZXJ9IGNvZGUgZXhpdCBjb2RlIGZvciB0ZXJtaW5hbFxuICAgKi9cbiAgZXhpdENsaSAoY29kZSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIC8vIERvIG5vdGhpbmcgaWYgUE0yIGNhbGxlZCBwcm9ncmFtbWF0aWNhbGx5IChhbHNvIGluIHNwZWVkbGlzdClcbiAgICBpZiAoY29uZi5QTTJfUFJPR1JBTU1BVElDICYmIHByb2Nlc3MuZW52LlBNMl9VU0FHRSAhPSAnQ0xJJykgcmV0dXJuIGZhbHNlO1xuXG4gICAgS01EYWVtb24uZGlzY29ubmVjdFJQQyhmdW5jdGlvbigpIHtcbiAgICAgIHRoYXQuQ2xpZW50LmNsb3NlKGZ1bmN0aW9uKCkge1xuICAgICAgICBjb2RlID0gY29kZSB8fCAwO1xuICAgICAgICAvLyBTYWZlIGV4aXRzIHByb2Nlc3MgYWZ0ZXIgYWxsIHN0cmVhbXMgYXJlIGRyYWluZWQuXG4gICAgICAgIC8vIGZpbGUgZGVzY3JpcHRvciBmbGFnLlxuICAgICAgICB2YXIgZmRzID0gMDtcbiAgICAgICAgLy8gZXhpdHMgcHJvY2VzcyB3aGVuIHN0ZG91dCAoMSkgYW5kIHNkdGVycigyKSBhcmUgYm90aCBkcmFpbmVkLlxuICAgICAgICBmdW5jdGlvbiB0cnlUb0V4aXQoKSB7XG4gICAgICAgICAgaWYgKChmZHMgJiAxKSAmJiAoZmRzICYgMikpIHtcbiAgICAgICAgICAgIC8vIGRlYnVnKCdUaGlzIGNvbW1hbmQgdG9vayAlZHMgdG8gZXhlY3V0ZScsIChuZXcgRGF0ZSgpIC0gdGhhdC5zdGFydF90aW1lcikgLyAxMDAwKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdChjb2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBbcHJvY2Vzcy5zdGRvdXQsIHByb2Nlc3Muc3RkZXJyXS5mb3JFYWNoKGZ1bmN0aW9uKHN0ZCkge1xuICAgICAgICAgIHZhciBmZCA9IHN0ZC5mZDtcbiAgICAgICAgICBpZiAoIXN0ZC5idWZmZXJTaXplKSB7XG4gICAgICAgICAgICAvLyBidWZmZXJTaXplIGVxdWFscyAwIG1lYW5zIGN1cnJlbnQgc3RyZWFtIGlzIGRyYWluZWQuXG4gICAgICAgICAgICBmZHMgPSBmZHMgfCBmZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQXBwZW5kcyBub3RoaW5nIHRvIHRoZSBzdGQgcXVldWUsIGJ1dCB3aWxsIHRyaWdnZXIgYHRyeVRvRXhpdGAgZXZlbnQgb24gYGRyYWluYC5cbiAgICAgICAgICAgIHN0ZC53cml0ZSAmJiBzdGQud3JpdGUoJycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBmZHMgPSBmZHMgfCBmZDtcbiAgICAgICAgICAgICAgdHJ5VG9FeGl0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gRG9lcyBub3Qgd3JpdGUgYW55dGhpbmcgbW9yZS5cbiAgICAgICAgICBkZWxldGUgc3RkLndyaXRlO1xuICAgICAgICB9KTtcbiAgICAgICAgdHJ5VG9FeGl0KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBBcHBsaWNhdGlvbiBtYW5hZ2VtZW50IC8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgLyoqXG4gICAqIFN0YXJ0IGEgZmlsZSBvciBqc29uIHdpdGggY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0ge09iamVjdHx8U3RyaW5nfSBjbWQgc2NyaXB0IHRvIHN0YXJ0IG9yIGpzb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGVkIHdoZW4gYXBwbGljYXRpb24gaGFzIGJlZW4gc3RhcnRlZFxuICAgKi9cbiAgc3RhcnQgKGNtZCwgb3B0cywgY2IpIHtcbiAgICBpZiAodHlwZW9mKG9wdHMpID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY2IgPSBvcHRzO1xuICAgICAgb3B0cyA9IHt9O1xuICAgIH1cbiAgICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcblxuICAgIGlmIChzZW12ZXIubHQocHJvY2Vzcy52ZXJzaW9uLCAnNi4wLjAnKSkge1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TR19XQVJOSU5HICsgJ05vZGUgNCBpcyBkZXByZWNhdGVkLCBwbGVhc2UgdXBncmFkZSB0byB1c2UgcG0yIHRvIGhhdmUgYWxsIGZlYXR1cmVzJyk7XG4gICAgfVxuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh1dGlsLmlzQXJyYXkob3B0cy53YXRjaCkgJiYgb3B0cy53YXRjaC5sZW5ndGggPT09IDApXG4gICAgICBvcHRzLndhdGNoID0gKG9wdHMucmF3QXJncyA/ICEhfm9wdHMucmF3QXJncy5pbmRleE9mKCctLXdhdGNoJykgOiAhIX5wcm9jZXNzLmFyZ3YuaW5kZXhPZignLS13YXRjaCcpKSB8fCBmYWxzZTtcblxuICAgIGlmIChDb21tb24uaXNDb25maWdGaWxlKGNtZCkgfHwgKHR5cGVvZihjbWQpID09PSAnb2JqZWN0JykpIHtcbiAgICAgIHRoYXQuX3N0YXJ0SnNvbihjbWQsIG9wdHMsICdyZXN0YXJ0UHJvY2Vzc0lkJywgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgpXG4gICAgICB9KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoYXQuX3N0YXJ0U2NyaXB0KGNtZCwgb3B0cywgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgwKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgcHJvY2VzcyBjb3VudGVyc1xuICAgKlxuICAgKiBAbWV0aG9kIHJlc2V0TWV0YVByb2Nlc3NcbiAgICovXG4gIHJlc2V0IChwcm9jZXNzX25hbWUsIGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NJZHMoaWRzLCBjYikge1xuICAgICAgZWFjaExpbWl0KGlkcywgY29uZi5DT05DVVJSRU5UX0FDVElPTlMsIGZ1bmN0aW9uKGlkLCBuZXh0KSB7XG4gICAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ3Jlc2V0TWV0YVByb2Nlc3NJZCcsIGlkLCBmdW5jdGlvbihlcnIsIHJlcykge1xuICAgICAgICAgIGlmIChlcnIpIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1Jlc2V0dGluZyBtZXRhIGZvciBwcm9jZXNzIGlkICVkJywgaWQpO1xuICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiBjYihDb21tb24ucmV0RXJyKGVycikpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCB7c3VjY2Vzczp0cnVlfSkgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHByb2Nlc3NfbmFtZSA9PSAnYWxsJykge1xuICAgICAgdGhhdC5DbGllbnQuZ2V0QWxsUHJvY2Vzc0lkKGZ1bmN0aW9uKGVyciwgaWRzKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvY2Vzc0lkcyhpZHMsIGNiKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChpc05hTihwcm9jZXNzX25hbWUpKSB7XG4gICAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzSWRCeU5hbWUocHJvY2Vzc19uYW1lLCBmdW5jdGlvbihlcnIsIGlkcykge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcignVW5rbm93biBwcm9jZXNzIG5hbWUnKTtcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoJ1Vua25vd24gcHJvY2VzcyBuYW1lJykpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoaWRzLCBjYik7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvY2Vzc0lkcyhbcHJvY2Vzc19uYW1lXSwgY2IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgZGFlbW9uaXplZCBQTTIgRGFlbW9uXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIGNhbGxiYWNrIHdoZW4gcG0yIGhhcyBiZWVuIHVwZ3JhZGVkXG4gICAqL1xuICB1cGRhdGUgKGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIENvbW1vbi5wcmludE91dCgnQmUgc3VyZSB0byBoYXZlIHRoZSBsYXRlc3QgdmVyc2lvbiBieSBkb2luZyBgbnBtIGluc3RhbGwgcG0yQGxhdGVzdCAtZ2AgYmVmb3JlIGRvaW5nIHRoaXMgcHJvY2VkdXJlLicpO1xuXG4gICAgLy8gRHVtcCBQTTIgcHJvY2Vzc2VzXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnbm90aWZ5S2lsbFBNMicsIHt9LCBmdW5jdGlvbigpIHt9KTtcblxuICAgIHRoYXQuZ2V0VmVyc2lvbihmdW5jdGlvbihlcnIsIG5ld192ZXJzaW9uKSB7XG4gICAgICAvLyBJZiBub3QgbGlua2VkIHRvIFBNMiBwbHVzLCBhbmQgdXBkYXRlIFBNMiB0byBsYXRlc3QsIGRpc3BsYXkgbW90ZC51cGRhdGVcbiAgICAgIGlmICghdGhhdC5nbF9pc19rbV9saW5rZWQgJiYgIWVyciAmJiAocGtnLnZlcnNpb24gIT0gbmV3X3ZlcnNpb24pKSB7XG4gICAgICAgIHZhciBkdCA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCB0aGF0Ll9jb25mLlBNMl9VUERBVEUpKTtcbiAgICAgICAgY29uc29sZS5sb2coZHQudG9TdHJpbmcoKSk7XG4gICAgICB9XG5cbiAgICAgIHRoYXQuZHVtcChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgZGVidWcoJ0R1bXBpbmcgc3VjY2Vzc2Z1bGwnLCBlcnIpO1xuICAgICAgICB0aGF0LmtpbGxEYWVtb24oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZGVidWcoJy0tLS0tLS0tLS0tLS0tLS0tLSBFdmVyeXRoaW5nIGtpbGxlZCcsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgdGhhdC5DbGllbnQubGF1bmNoRGFlbW9uKHtpbnRlcmFjdG9yOmZhbHNlfSwgZnVuY3Rpb24oZXJyLCBjaGlsZCkge1xuICAgICAgICAgICAgdGhhdC5DbGllbnQubGF1bmNoUlBDKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB0aGF0LnJlc3VycmVjdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY2hhbGsuYmx1ZS5ib2xkKCc+Pj4+Pj4+Pj4+IFBNMiB1cGRhdGVkJykpO1xuICAgICAgICAgICAgICAgIHRoYXQubGF1bmNoQWxsKHRoYXQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgS01EYWVtb24ubGF1bmNoQW5kSW50ZXJhY3QodGhhdC5fY29uZiwge1xuICAgICAgICAgICAgICAgICAgICBwbTJfdmVyc2lvbjogcGtnLnZlcnNpb25cbiAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGVyciwgZGF0YSwgaW50ZXJhY3Rvcl9wcm9jKSB7XG4gICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOnRydWV9KSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgICAgICAgICAgICAgICB9LCAyNTApXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmVsb2FkIGFuIGFwcGxpY2F0aW9uXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9jZXNzX25hbWUgQXBwbGljYXRpb24gTmFtZSBvciBBbGxcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgICAgICAgICBPcHRpb25zXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiICAgICAgICAgQ2FsbGJhY2tcbiAgICovXG4gIHJlbG9hZCAocHJvY2Vzc19uYW1lLCBvcHRzLCBjYj8pIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mKG9wdHMpID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY2IgPSBvcHRzO1xuICAgICAgb3B0cyA9IHt9O1xuICAgIH1cblxuICAgIHZhciBkZWxheSA9IENvbW1vbi5sb2NrUmVsb2FkKCk7XG4gICAgaWYgKGRlbGF5ID4gMCAmJiBvcHRzLmZvcmNlICE9IHRydWUpIHtcbiAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnUmVsb2FkIGFscmVhZHkgaW4gcHJvZ3Jlc3MsIHBsZWFzZSB0cnkgYWdhaW4gaW4gJyArIE1hdGguZmxvb3IoKGNvbmYuUkVMT0FEX0xPQ0tfVElNRU9VVCAtIGRlbGF5KSAvIDEwMDApICsgJyBzZWNvbmRzIG9yIHVzZSAtLWZvcmNlJyk7XG4gICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoJ1JlbG9hZCBpbiBwcm9ncmVzcycpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgIH1cblxuICAgIGlmIChDb21tb24uaXNDb25maWdGaWxlKHByb2Nlc3NfbmFtZSkpXG4gICAgICB0aGF0Ll9zdGFydEpzb24ocHJvY2Vzc19uYW1lLCBvcHRzLCAncmVsb2FkUHJvY2Vzc0lkJywgZnVuY3Rpb24oZXJyLCBhcHBzKSB7XG4gICAgICAgIENvbW1vbi51bmxvY2tSZWxvYWQoKTtcbiAgICAgICAgaWYgKGVycilcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGFwcHMpIDogdGhhdC5leGl0Q2xpKGNvbmYuU1VDQ0VTU19FWElUKTtcbiAgICAgIH0pO1xuICAgIGVsc2Uge1xuICAgICAgaWYgKG9wdHMgJiYgb3B0cy5lbnYpIHtcbiAgICAgICAgdmFyIGVyciA9ICdVc2luZyAtLWVudiBbZW52XSB3aXRob3V0IHBhc3NpbmcgdGhlIGVjb3N5c3RlbS5jb25maWcuanMgZG9lcyBub3Qgd29yaydcbiAgICAgICAgQ29tbW9uLmVycihlcnIpO1xuICAgICAgICBDb21tb24udW5sb2NrUmVsb2FkKCk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdHMgJiYgIW9wdHMudXBkYXRlRW52KVxuICAgICAgICBDb21tb24ucHJpbnRPdXQoSU1NVVRBQkxFX01TRyk7XG5cbiAgICAgIHRoYXQuX29wZXJhdGUoJ3JlbG9hZFByb2Nlc3NJZCcsIHByb2Nlc3NfbmFtZSwgb3B0cywgZnVuY3Rpb24oZXJyLCBhcHBzKSB7XG4gICAgICAgIENvbW1vbi51bmxvY2tSZWxvYWQoKTtcblxuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVycikgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgYXBwcykgOiB0aGF0LmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RhcnQgcHJvY2Vzc1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gY21kICAgQXBwbGljYXRpb24gTmFtZSAvIFByb2Nlc3MgaWQgLyBKU09OIGFwcGxpY2F0aW9uIGZpbGUgLyAnYWxsJ1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAgRXh0cmEgb3B0aW9ucyB0byBiZSB1cGRhdGVkXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiICBDYWxsYmFja1xuICAgKi9cbiAgcmVzdGFydCAoY21kLCBvcHRzLCBjYikge1xuICAgIGlmICh0eXBlb2Yob3B0cykgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjYiA9IG9wdHM7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICh0eXBlb2YoY21kKSA9PT0gJ251bWJlcicpXG4gICAgICBjbWQgPSBjbWQudG9TdHJpbmcoKTtcblxuICAgIGlmIChjbWQgPT0gXCItXCIpIHtcbiAgICAgIC8vIFJlc3RhcnQgZnJvbSBQSVBFRCBKU09OXG4gICAgICBwcm9jZXNzLnN0ZGluLnJlc3VtZSgpO1xuICAgICAgcHJvY2Vzcy5zdGRpbi5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgICAgcHJvY2Vzcy5zdGRpbi5vbignZGF0YScsIGZ1bmN0aW9uIChwYXJhbSkge1xuICAgICAgICBwcm9jZXNzLnN0ZGluLnBhdXNlKCk7XG4gICAgICAgIHRoYXQuYWN0aW9uRnJvbUpzb24oJ3Jlc3RhcnRQcm9jZXNzSWQnLCBwYXJhbSwgb3B0cywgJ3BpcGUnLCBjYik7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAoQ29tbW9uLmlzQ29uZmlnRmlsZShjbWQpIHx8IHR5cGVvZihjbWQpID09PSAnb2JqZWN0JylcbiAgICAgIHRoYXQuX3N0YXJ0SnNvbihjbWQsIG9wdHMsICdyZXN0YXJ0UHJvY2Vzc0lkJywgY2IpO1xuICAgIGVsc2Uge1xuICAgICAgaWYgKG9wdHMgJiYgb3B0cy5lbnYpIHtcbiAgICAgICAgdmFyIGVyciA9ICdVc2luZyAtLWVudiBbZW52XSB3aXRob3V0IHBhc3NpbmcgdGhlIGVjb3N5c3RlbS5jb25maWcuanMgZG9lcyBub3Qgd29yaydcbiAgICAgICAgQ29tbW9uLmVycihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgICBpZiAob3B0cyAmJiAhb3B0cy51cGRhdGVFbnYpXG4gICAgICAgIENvbW1vbi5wcmludE91dChJTU1VVEFCTEVfTVNHKTtcbiAgICAgIHRoYXQuX29wZXJhdGUoJ3Jlc3RhcnRQcm9jZXNzSWQnLCBjbWQsIG9wdHMsIGNiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHByb2Nlc3NcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHByb2Nlc3NfbmFtZSBBcHBsaWNhdGlvbiBOYW1lIC8gUHJvY2VzcyBpZCAvIEFwcGxpY2F0aW9uIGZpbGUgLyAnYWxsJ1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBDYWxsYmFja1xuICAgKi9cbiAgZGVsZXRlIChwcm9jZXNzX25hbWUsIGpzb25WaWEsIGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICh0eXBlb2YoanNvblZpYSkgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY2IgPSBqc29uVmlhO1xuICAgICAganNvblZpYSA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZihwcm9jZXNzX25hbWUpID09PSBcIm51bWJlclwiKSB7XG4gICAgICBwcm9jZXNzX25hbWUgPSBwcm9jZXNzX25hbWUudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBpZiAoanNvblZpYSA9PSAncGlwZScpXG4gICAgICByZXR1cm4gdGhhdC5hY3Rpb25Gcm9tSnNvbignZGVsZXRlUHJvY2Vzc0lkJywgcHJvY2Vzc19uYW1lLCBjb21tYW5kZXIsICdwaXBlJywgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgpXG4gICAgICB9KTtcbiAgICBpZiAoQ29tbW9uLmlzQ29uZmlnRmlsZShwcm9jZXNzX25hbWUpKVxuICAgICAgcmV0dXJuIHRoYXQuYWN0aW9uRnJvbUpzb24oJ2RlbGV0ZVByb2Nlc3NJZCcsIHByb2Nlc3NfbmFtZSwgY29tbWFuZGVyLCAnZmlsZScsIChlcnIsIHByb2NzKSA9PiB7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKGVyciwgcHJvY3MpIDogdGhpcy5zcGVlZExpc3QoKVxuICAgICAgfSk7XG4gICAgZWxzZSB7XG4gICAgICB0aGF0Ll9vcGVyYXRlKCdkZWxldGVQcm9jZXNzSWQnLCBwcm9jZXNzX25hbWUsIChlcnIsIHByb2NzKSA9PiB7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKGVyciwgcHJvY3MpIDogdGhpcy5zcGVlZExpc3QoKVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN0b3AgcHJvY2Vzc1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvY2Vzc19uYW1lIEFwcGxpY2F0aW9uIE5hbWUgLyBQcm9jZXNzIGlkIC8gQXBwbGljYXRpb24gZmlsZSAvICdhbGwnXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIENhbGxiYWNrXG4gICAqL1xuICBzdG9wIChwcm9jZXNzX25hbWUsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZihwcm9jZXNzX25hbWUpID09PSAnbnVtYmVyJylcbiAgICAgIHByb2Nlc3NfbmFtZSA9IHByb2Nlc3NfbmFtZS50b1N0cmluZygpO1xuXG4gICAgaWYgKHByb2Nlc3NfbmFtZSA9PSBcIi1cIikge1xuICAgICAgcHJvY2Vzcy5zdGRpbi5yZXN1bWUoKTtcbiAgICAgIHByb2Nlc3Muc3RkaW4uc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICAgIHByb2Nlc3Muc3RkaW4ub24oJ2RhdGEnLCBmdW5jdGlvbiAocGFyYW0pIHtcbiAgICAgICAgcHJvY2Vzcy5zdGRpbi5wYXVzZSgpO1xuICAgICAgICB0aGF0LmFjdGlvbkZyb21Kc29uKCdzdG9wUHJvY2Vzc0lkJywgcGFyYW0sIGNvbW1hbmRlciwgJ3BpcGUnLCAoZXJyLCBwcm9jcykgPT4ge1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVyciwgcHJvY3MpIDogdGhpcy5zcGVlZExpc3QoKVxuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKENvbW1vbi5pc0NvbmZpZ0ZpbGUocHJvY2Vzc19uYW1lKSlcbiAgICAgIHRoYXQuYWN0aW9uRnJvbUpzb24oJ3N0b3BQcm9jZXNzSWQnLCBwcm9jZXNzX25hbWUsIGNvbW1hbmRlciwgJ2ZpbGUnLCAoZXJyLCBwcm9jcykgPT4ge1xuICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIsIHByb2NzKSA6IHRoaXMuc3BlZWRMaXN0KClcbiAgICAgIH0pO1xuICAgIGVsc2VcbiAgICAgIHRoYXQuX29wZXJhdGUoJ3N0b3BQcm9jZXNzSWQnLCBwcm9jZXNzX25hbWUsIChlcnIsIHByb2NzKSA9PiB7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKGVyciwgcHJvY3MpIDogdGhpcy5zcGVlZExpc3QoKVxuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGxpc3Qgb2YgYWxsIHByb2Nlc3NlcyBtYW5hZ2VkXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIENhbGxiYWNrXG4gICAqL1xuICBsaXN0IChvcHRzPywgY2I/KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZihvcHRzKSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYiA9IG9wdHM7XG4gICAgICBvcHRzID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbihlcnIsIGxpc3QpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0cyAmJiBvcHRzLnJhd0FyZ3MgJiYgb3B0cy5yYXdBcmdzLmluZGV4T2YoJy0td2F0Y2gnKSA+IC0xKSB7XG4gICAgICAgIGZ1bmN0aW9uIHNob3coKSB7XG4gICAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoJ1xceDFiWzJKJyk7XG4gICAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoJ1xceDFiWzBmJyk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ0xhc3QgcmVmcmVzaDogJywgZGF5anMoKS5mb3JtYXQoKSk7XG4gICAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XG4gICAgICAgICAgICBVWC5saXN0KGxpc3QsIG51bGwpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgc2hvdygpO1xuICAgICAgICBzZXRJbnRlcnZhbChzaG93LCA5MDApO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGxpc3QpIDogdGhhdC5zcGVlZExpc3QobnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogS2lsbCBEYWVtb25cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgQ2FsbGJhY2tcbiAgICovXG4gIGtpbGxEYWVtb24gKGNiKSB7XG4gICAgcHJvY2Vzcy5lbnYuUE0yX1NUQVRVUyA9ICdzdG9wcGluZydcblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ25vdGlmeUtpbGxQTTInLCB7fSwgZnVuY3Rpb24oKSB7fSk7XG5cbiAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1t2XSBNb2R1bGVzIFN0b3BwZWQnKTtcblxuICAgIHRoYXQuX29wZXJhdGUoJ2RlbGV0ZVByb2Nlc3NJZCcsICdhbGwnLCBmdW5jdGlvbihlcnIsIGxpc3QpIHtcbiAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnW3ZdIEFsbCBBcHBsaWNhdGlvbnMgU3RvcHBlZCcpO1xuICAgICAgcHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCA9ICdmYWxzZSc7XG5cbiAgICAgIHRoYXQua2lsbEFnZW50KGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICBpZiAoIWVycikge1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnW3ZdIEFnZW50IFN0b3BwZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoYXQuQ2xpZW50LmtpbGxEYWVtb24oZnVuY3Rpb24oZXJyLCByZXMpIHtcbiAgICAgICAgICBpZiAoZXJyKSBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnW3ZdIFBNMiBEYWVtb24gU3RvcHBlZCcpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVyciwgcmVzKSA6IHRoYXQuZXhpdENsaShjb25mLlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgIH0pO1xuXG4gICAgICB9KTtcbiAgICB9KVxuICB9XG5cbiAga2lsbCAoY2IpIHtcbiAgICB0aGlzLmtpbGxEYWVtb24oY2IpO1xuICB9XG5cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gIC8vIFByaXZhdGUgbWV0aG9kcyAvL1xuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAvKipcbiAgICogTWV0aG9kIHRvIFNUQVJUIC8gUkVTVEFSVCBhIHNjcmlwdFxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NyaXB0IHNjcmlwdCBuYW1lICh3aWxsIGJlIHJlc29sdmVkIGFjY29yZGluZyB0byBsb2NhdGlvbilcbiAgICovXG4gIF9zdGFydFNjcmlwdCAoc2NyaXB0LCBvcHRzLCBjYikge1xuICAgIGlmICh0eXBlb2Ygb3B0cyA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNiID0gb3B0cztcbiAgICAgIG9wdHMgPSB7fTtcbiAgICB9XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgLyoqXG4gICAgICogQ29tbWFuZGVyLmpzIHRyaWNrc1xuICAgICAqL1xuICAgIHZhciBhcHBfY29uZjogYW55ID0gQ29uZmlnLmZpbHRlck9wdGlvbnMob3B0cyk7XG4gICAgdmFyIGFwcENvbmYgPSB7fTtcblxuICAgIGlmICh0eXBlb2YgYXBwX2NvbmYubmFtZSA9PSAnZnVuY3Rpb24nKVxuICAgICAgZGVsZXRlIGFwcF9jb25mLm5hbWU7XG5cbiAgICBkZWxldGUgYXBwX2NvbmYuYXJncztcblxuICAgIC8vIFJldHJpZXZlIGFyZ3VtZW50cyB2aWEgLS0gPGFyZ3M+XG4gICAgdmFyIGFyZ3NJbmRleDtcblxuICAgIGlmIChvcHRzLnJhd0FyZ3MgJiYgKGFyZ3NJbmRleCA9IG9wdHMucmF3QXJncy5pbmRleE9mKCctLScpKSA+PSAwKVxuICAgICAgYXBwX2NvbmYuYXJncyA9IG9wdHMucmF3QXJncy5zbGljZShhcmdzSW5kZXggKyAxKTtcbiAgICBlbHNlIGlmIChvcHRzLnNjcmlwdEFyZ3MpXG4gICAgICBhcHBfY29uZi5hcmdzID0gb3B0cy5zY3JpcHRBcmdzO1xuXG4gICAgYXBwX2NvbmYuc2NyaXB0ID0gc2NyaXB0O1xuICAgIGlmKCFhcHBfY29uZi5uYW1lc3BhY2UpXG4gICAgICBhcHBfY29uZi5uYW1lc3BhY2UgPSAnZGVmYXVsdCc7XG5cbiAgICBpZiAoKGFwcENvbmYgPSBDb21tb24udmVyaWZ5Q29uZnMoYXBwX2NvbmYpKSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBDb21tb24uZXJyKGFwcENvbmYpXG4gICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGFwcENvbmYpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgIH1cblxuICAgIGFwcF9jb25mID0gYXBwQ29uZlswXTtcblxuICAgIGlmIChvcHRzLndhdGNoRGVsYXkpIHtcbiAgICAgIGlmICh0eXBlb2Ygb3B0cy53YXRjaERlbGF5ID09PSBcInN0cmluZ1wiICYmIG9wdHMud2F0Y2hEZWxheS5pbmRleE9mKFwibXNcIikgIT09IC0xKVxuICAgICAgICBhcHBfY29uZi53YXRjaF9kZWxheSA9IHBhcnNlSW50KG9wdHMud2F0Y2hEZWxheSk7XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXBwX2NvbmYud2F0Y2hfZGVsYXkgPSBwYXJzZUZsb2F0KG9wdHMud2F0Y2hEZWxheSkgKiAxMDAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBtYXMgPSBbXTtcbiAgICBpZih0eXBlb2Ygb3B0cy5leHQgIT0gJ3VuZGVmaW5lZCcpXG4gICAgICBoZi5tYWtlX2F2YWlsYWJsZV9leHRlbnNpb24ob3B0cywgbWFzKTsgLy8gZm9yIC1lIGZsYWdcbiAgICBtYXMubGVuZ3RoID4gMCA/IGFwcF9jb25mLmlnbm9yZV93YXRjaCA9IG1hcyA6IDA7XG5cbiAgICAvKipcbiAgICAgKiBJZiAtdyBvcHRpb24sIHdyaXRlIGNvbmZpZ3VyYXRpb24gdG8gY29uZmlndXJhdGlvbi5qc29uIGZpbGVcbiAgICAgKi9cbiAgICBpZiAoYXBwX2NvbmYud3JpdGUpIHtcbiAgICAgIHZhciBkc3RfcGF0aCA9IHBhdGguam9pbihwcm9jZXNzLmVudi5QV0QgfHwgcHJvY2Vzcy5jd2QoKSwgYXBwX2NvbmYubmFtZSArICctcG0yLmpzb24nKTtcbiAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnV3JpdGluZyBjb25maWd1cmF0aW9uIHRvJywgY2hhbGsuYmx1ZShkc3RfcGF0aCkpO1xuICAgICAgLy8gcHJldHR5IEpTT05cbiAgICAgIHRyeSB7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZHN0X3BhdGgsIEpTT04uc3RyaW5naWZ5KGFwcF9jb25mLCBudWxsLCAyKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZXJpZXMoW1xuICAgICAgcmVzdGFydEV4aXN0aW5nUHJvY2Vzc05hbWUsXG4gICAgICByZXN0YXJ0RXhpc3RpbmdOYW1lU3BhY2UsXG4gICAgICByZXN0YXJ0RXhpc3RpbmdQcm9jZXNzSWQsXG4gICAgICByZXN0YXJ0RXhpc3RpbmdQcm9jZXNzUGF0aE9yU3RhcnROZXdcbiAgICBdLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcilcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuXG4gICAgICB2YXIgcmV0ID0ge307XG5cbiAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihfZHQpIHtcbiAgICAgICAgaWYgKF9kdCAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgIHJldCA9IF9kdDtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsLCByZXQpIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIElmIHN0YXJ0IDxhcHBfbmFtZT4gc3RhcnQvcmVzdGFydCBhcHBsaWNhdGlvblxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlc3RhcnRFeGlzdGluZ1Byb2Nlc3NOYW1lKGNiKSB7XG4gICAgICBpZiAoIWlzTmFOKHNjcmlwdCkgfHxcbiAgICAgICAgKHR5cGVvZiBzY3JpcHQgPT09ICdzdHJpbmcnICYmIHNjcmlwdC5pbmRleE9mKCcvJykgIT0gLTEpIHx8XG4gICAgICAgICh0eXBlb2Ygc2NyaXB0ID09PSAnc3RyaW5nJyAmJiBwYXRoLmV4dG5hbWUoc2NyaXB0KSAhPT0gJycpKVxuICAgICAgICByZXR1cm4gY2IobnVsbCk7XG5cbiAgICAgICAgdGhhdC5DbGllbnQuZ2V0UHJvY2Vzc0lkQnlOYW1lKHNjcmlwdCwgZnVuY3Rpb24oZXJyLCBpZHMpIHtcbiAgICAgICAgICBpZiAoZXJyICYmIGNiKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgICBpZiAoaWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoYXQuX29wZXJhdGUoJ3Jlc3RhcnRQcm9jZXNzSWQnLCBzY3JpcHQsIG9wdHMsIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdQcm9jZXNzIHN1Y2Nlc3NmdWxseSBzdGFydGVkJyk7XG4gICAgICAgICAgICAgIHJldHVybiBjYih0cnVlLCBsaXN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHJldHVybiBjYihudWxsKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSWYgc3RhcnQgPG5hbWVzcGFjZT4gc3RhcnQvcmVzdGFydCBuYW1lc3BhY2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZXN0YXJ0RXhpc3RpbmdOYW1lU3BhY2UoY2IpIHtcbiAgICAgIGlmICghaXNOYU4oc2NyaXB0KSB8fFxuICAgICAgICAodHlwZW9mIHNjcmlwdCA9PT0gJ3N0cmluZycgJiYgc2NyaXB0LmluZGV4T2YoJy8nKSAhPSAtMSkgfHxcbiAgICAgICAgKHR5cGVvZiBzY3JpcHQgPT09ICdzdHJpbmcnICYmIHBhdGguZXh0bmFtZShzY3JpcHQpICE9PSAnJykpXG4gICAgICAgIHJldHVybiBjYihudWxsKTtcblxuICAgICAgaWYgKHNjcmlwdCAhPT0gJ2FsbCcpIHtcbiAgICAgICAgdGhhdC5DbGllbnQuZ2V0UHJvY2Vzc0lkc0J5TmFtZXNwYWNlKHNjcmlwdCwgZnVuY3Rpb24gKGVyciwgaWRzKSB7XG4gICAgICAgICAgaWYgKGVyciAmJiBjYikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgaWYgKGlkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGF0Ll9vcGVyYXRlKCdyZXN0YXJ0UHJvY2Vzc0lkJywgc2NyaXB0LCBvcHRzLCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1Byb2Nlc3Mgc3VjY2Vzc2Z1bGx5IHN0YXJ0ZWQnKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGNiKHRydWUsIGxpc3QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgcmV0dXJuIGNiKG51bGwpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGF0Ll9vcGVyYXRlKCdyZXN0YXJ0UHJvY2Vzc0lkJywgJ2FsbCcsIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnUHJvY2VzcyBzdWNjZXNzZnVsbHkgc3RhcnRlZCcpO1xuICAgICAgICAgIHJldHVybiBjYih0cnVlLCBsaXN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzdGFydEV4aXN0aW5nUHJvY2Vzc0lkKGNiKSB7XG4gICAgICBpZiAoaXNOYU4oc2NyaXB0KSkgcmV0dXJuIGNiKG51bGwpO1xuXG4gICAgICB0aGF0Ll9vcGVyYXRlKCdyZXN0YXJ0UHJvY2Vzc0lkJywgc2NyaXB0LCBvcHRzLCBmdW5jdGlvbihlcnIsIGxpc3QpIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnUHJvY2VzcyBzdWNjZXNzZnVsbHkgc3RhcnRlZCcpO1xuICAgICAgICByZXR1cm4gY2IodHJ1ZSwgbGlzdCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXN0YXJ0IGEgcHJvY2VzcyB3aXRoIHRoZSBzYW1lIGZ1bGwgcGF0aFxuICAgICAqIE9yIHN0YXJ0IGl0XG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVzdGFydEV4aXN0aW5nUHJvY2Vzc1BhdGhPclN0YXJ0TmV3KGNiKSB7XG4gICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbihlcnIsIHByb2NzKSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuXG4gICAgICAgIHZhciBmdWxsX3BhdGggPSBwYXRoLnJlc29sdmUodGhhdC5jd2QsIHNjcmlwdCk7XG4gICAgICAgIHZhciBtYW5hZ2VkX3NjcmlwdCA9IG51bGw7XG5cbiAgICAgICAgcHJvY3MuZm9yRWFjaChmdW5jdGlvbihwcm9jKSB7XG4gICAgICAgICAgaWYgKHByb2MucG0yX2Vudi5wbV9leGVjX3BhdGggPT0gZnVsbF9wYXRoICYmXG4gICAgICAgICAgICAgIHByb2MucG0yX2Vudi5uYW1lID09IGFwcF9jb25mLm5hbWUpXG4gICAgICAgICAgICBtYW5hZ2VkX3NjcmlwdCA9IHByb2M7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChtYW5hZ2VkX3NjcmlwdCAmJlxuICAgICAgICAgIChtYW5hZ2VkX3NjcmlwdC5wbTJfZW52LnN0YXR1cyA9PSBjb25mLlNUT1BQRURfU1RBVFVTIHx8XG4gICAgICAgICAgICBtYW5hZ2VkX3NjcmlwdC5wbTJfZW52LnN0YXR1cyA9PSBjb25mLlNUT1BQSU5HX1NUQVRVUyB8fFxuICAgICAgICAgICAgbWFuYWdlZF9zY3JpcHQucG0yX2Vudi5zdGF0dXMgPT0gY29uZi5FUlJPUkVEX1NUQVRVUykpIHtcbiAgICAgICAgICAvLyBSZXN0YXJ0IHByb2Nlc3MgaWYgc3RvcHBlZFxuICAgICAgICAgIHZhciBhcHBfbmFtZSA9IG1hbmFnZWRfc2NyaXB0LnBtMl9lbnYubmFtZTtcblxuICAgICAgICAgIHRoYXQuX29wZXJhdGUoJ3Jlc3RhcnRQcm9jZXNzSWQnLCBhcHBfbmFtZSwgb3B0cywgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XG4gICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnUHJvY2VzcyBzdWNjZXNzZnVsbHkgc3RhcnRlZCcpO1xuICAgICAgICAgICAgcmV0dXJuIGNiKHRydWUsIGxpc3QpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChtYW5hZ2VkX3NjcmlwdCAmJiAhb3B0cy5mb3JjZSkge1xuICAgICAgICAgIENvbW1vbi5lcnIoJ1NjcmlwdCBhbHJlYWR5IGxhdW5jaGVkLCBhZGQgLWYgb3B0aW9uIHRvIGZvcmNlIHJlLWV4ZWN1dGlvbicpO1xuICAgICAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoJ1NjcmlwdCBhbHJlYWR5IGxhdW5jaGVkJykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlc29sdmVkX3BhdGhzID0gbnVsbDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlc29sdmVkX3BhdGhzID0gQ29tbW9uLnJlc29sdmVBcHBBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAgIGN3ZCAgICAgIDogdGhhdC5jd2QsXG4gICAgICAgICAgICBwbTJfaG9tZSA6IHRoYXQucG0yX2hvbWVcbiAgICAgICAgICB9LCBhcHBfY29uZik7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgIENvbW1vbi5lcnIoZS5tZXNzYWdlKTtcbiAgICAgICAgICByZXR1cm4gY2IoQ29tbW9uLnJldEVycihlKSk7XG4gICAgICAgIH1cblxuICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1N0YXJ0aW5nICVzIGluICVzICglZCBpbnN0YW5jZScgKyAocmVzb2x2ZWRfcGF0aHMuaW5zdGFuY2VzID4gMSA/ICdzJyA6ICcnKSArICcpJyxcbiAgICAgICAgICByZXNvbHZlZF9wYXRocy5wbV9leGVjX3BhdGgsIHJlc29sdmVkX3BhdGhzLmV4ZWNfbW9kZSwgcmVzb2x2ZWRfcGF0aHMuaW5zdGFuY2VzKTtcblxuICAgICAgICBpZiAoIXJlc29sdmVkX3BhdGhzLmVudikgcmVzb2x2ZWRfcGF0aHMuZW52ID0ge307XG5cbiAgICAgICAgLy8gU2V0IFBNMiBIT01FIGluIGNhc2Ugb2YgY2hpbGQgcHJvY2VzcyB1c2luZyBQTTIgQVBJXG4gICAgICAgIHJlc29sdmVkX3BhdGhzLmVudlsnUE0yX0hPTUUnXSA9IHRoYXQucG0yX2hvbWU7XG5cbiAgICAgICAgdmFyIGFkZGl0aW9uYWxfZW52ID0gTW9kdWxhcml6ZXIuZ2V0QWRkaXRpb25hbENvbmYocmVzb2x2ZWRfcGF0aHMubmFtZSk7XG4gICAgICAgIHV0aWwuaW5oZXJpdHMocmVzb2x2ZWRfcGF0aHMuZW52LCBhZGRpdGlvbmFsX2Vudik7XG5cbiAgICAgICAgLy8gSXMgS00gbGlua2VkP1xuICAgICAgICByZXNvbHZlZF9wYXRocy5rbV9saW5rID0gdGhhdC5nbF9pc19rbV9saW5rZWQ7XG5cbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgncHJlcGFyZScsIHJlc29sdmVkX3BhdGhzLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ0Vycm9yIHdoaWxlIGxhdW5jaGluZyBhcHBsaWNhdGlvbicsIGVyci5zdGFjayB8fCBlcnIpO1xuICAgICAgICAgICAgcmV0dXJuIGNiKENvbW1vbi5yZXRFcnIoZXJyKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdEb25lLicpO1xuICAgICAgICAgIHJldHVybiBjYih0cnVlLCBkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNZXRob2QgdG8gc3RhcnQvcmVzdGFydC9yZWxvYWQgcHJvY2Vzc2VzIGZyb20gYSBKU09OIGZpbGVcbiAgICogSXQgd2lsbCBzdGFydCBhcHAgbm90IHN0YXJ0ZWRcbiAgICogQ2FuIHJlY2VpdmUgb25seSBvcHRpb24gdG8gc2tpcCBhcHBsaWNhdGlvbnNcbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9zdGFydEpzb24gKGZpbGUsIG9wdHMsIGFjdGlvbiwgcGlwZT8sIGNiPykge1xuICAgIHZhciBjb25maWc6IGFueSAgICAgPSB7fTtcbiAgICB2YXIgYXBwQ29uZjogYW55W10gICAgPSBbXTtcbiAgICB2YXIgc3RhdGljQ29uZiA9IFtdO1xuICAgIHZhciBkZXBsb3lDb25mID0ge307XG4gICAgdmFyIGFwcHNfaW5mbyAgPSBbXTtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAvKipcbiAgICAgKiBHZXQgRmlsZSBjb25maWd1cmF0aW9uXG4gICAgICovXG4gICAgaWYgKHR5cGVvZihjYikgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZihwaXBlKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2IgPSBwaXBlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mKGZpbGUpID09PSAnb2JqZWN0Jykge1xuICAgICAgY29uZmlnID0gZmlsZTtcbiAgICB9IGVsc2UgaWYgKHBpcGUgPT09ICdwaXBlJykge1xuICAgICAgY29uZmlnID0gQ29tbW9uLnBhcnNlQ29uZmlnKGZpbGUsICdwaXBlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBkYXRhID0gbnVsbDtcblxuICAgICAgdmFyIGlzQWJzb2x1dGUgPSBwYXRoLmlzQWJzb2x1dGUoZmlsZSlcbiAgICAgIHZhciBmaWxlX3BhdGggPSBpc0Fic29sdXRlID8gZmlsZSA6IHBhdGguam9pbih0aGF0LmN3ZCwgZmlsZSk7XG5cbiAgICAgIGRlYnVnKCdSZXNvbHZlZCBmaWxlcGF0aCAlcycsIGZpbGVfcGF0aCk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGRhdGEgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZV9wYXRoKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ0ZpbGUgJyArIGZpbGUgKycgbm90IGZvdW5kJyk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZSkpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbmZpZyA9IENvbW1vbi5wYXJzZUNvbmZpZyhkYXRhLCBmaWxlKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ0ZpbGUgJyArIGZpbGUgKyAnIG1hbGZvcm1hdGVkJyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZSkpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWxpYXMgc29tZSBvcHRpb25hbCBmaWVsZHNcbiAgICAgKi9cbiAgICBpZiAoY29uZmlnLmRlcGxveSlcbiAgICAgIGRlcGxveUNvbmYgPSBjb25maWcuZGVwbG95O1xuICAgIGlmIChjb25maWcuc3RhdGljKVxuICAgICAgc3RhdGljQ29uZiA9IGNvbmZpZy5zdGF0aWM7XG4gICAgaWYgKGNvbmZpZy5hcHBzKVxuICAgICAgYXBwQ29uZiA9IGNvbmZpZy5hcHBzO1xuICAgIGVsc2UgaWYgKGNvbmZpZy5wbTIpXG4gICAgICBhcHBDb25mID0gY29uZmlnLnBtMjtcbiAgICBlbHNlXG4gICAgICBhcHBDb25mID0gY29uZmlnO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShhcHBDb25mKSlcbiAgICAgIGFwcENvbmYgPSBbYXBwQ29uZl07XG5cbiAgICBpZiAoKGFwcENvbmYgPSBDb21tb24udmVyaWZ5Q29uZnMoYXBwQ29uZikpIGluc3RhbmNlb2YgRXJyb3IpXG4gICAgICByZXR1cm4gY2IgPyBjYihhcHBDb25mKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuXG4gICAgcHJvY2Vzcy5lbnYuUE0yX0pTT05fUFJPQ0VTU0lORyA9IFwidHJ1ZVwiO1xuXG4gICAgLy8gR2V0IEFwcCBsaXN0XG4gICAgdmFyIGFwcHNfbmFtZSA9IFtdO1xuICAgIHZhciBwcm9jX2xpc3QgPSB7fTtcblxuICAgIC8vIEFkZCBzdGF0aWNzIHRvIGFwcHNcbiAgICBzdGF0aWNDb25mLmZvckVhY2goZnVuY3Rpb24oc2VydmUpIHtcbiAgICAgIGFwcENvbmYucHVzaCh7XG4gICAgICAgIG5hbWU6IHNlcnZlLm5hbWUgPyBzZXJ2ZS5uYW1lIDogYHN0YXRpYy1wYWdlLXNlcnZlci0ke3NlcnZlLnBvcnR9YCxcbiAgICAgICAgc2NyaXB0OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnQVBJJywgJ1NlcnZlLmpzJyksXG4gICAgICAgIGVudjoge1xuICAgICAgICAgIFBNMl9TRVJWRV9QT1JUOiBzZXJ2ZS5wb3J0LFxuICAgICAgICAgIFBNMl9TRVJWRV9IT1NUOiBzZXJ2ZS5ob3N0LFxuICAgICAgICAgIFBNMl9TRVJWRV9QQVRIOiBzZXJ2ZS5wYXRoLFxuICAgICAgICAgIFBNMl9TRVJWRV9TUEE6IHNlcnZlLnNwYSxcbiAgICAgICAgICBQTTJfU0VSVkVfRElSRUNUT1JZOiBzZXJ2ZS5kaXJlY3RvcnksXG4gICAgICAgICAgUE0yX1NFUlZFX0JBU0lDX0FVVEg6IHNlcnZlLmJhc2ljX2F1dGggIT09IHVuZGVmaW5lZCxcbiAgICAgICAgICBQTTJfU0VSVkVfQkFTSUNfQVVUSF9VU0VSTkFNRTogc2VydmUuYmFzaWNfYXV0aCA/IHNlcnZlLmJhc2ljX2F1dGgudXNlcm5hbWUgOiBudWxsLFxuICAgICAgICAgIFBNMl9TRVJWRV9CQVNJQ19BVVRIX1BBU1NXT1JEOiBzZXJ2ZS5iYXNpY19hdXRoID8gc2VydmUuYmFzaWNfYXV0aC5wYXNzd29yZCA6IG51bGwsXG4gICAgICAgICAgUE0yX1NFUlZFX01PTklUT1I6IHNlcnZlLm1vbml0b3JcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBIZXJlIHdlIHBpY2sgb25seSB0aGUgZmllbGQgd2Ugd2FudCBmcm9tIHRoZSBDTEkgd2hlbiBzdGFydGluZyBhIEpTT05cbiAgICBhcHBDb25mLmZvckVhY2goZnVuY3Rpb24oYXBwKSB7XG4gICAgICBpZiAoIWFwcC5lbnYpIHsgYXBwLmVudiA9IHt9OyB9XG4gICAgICBhcHAuZW52LmlvID0gYXBwLmlvO1xuICAgICAgLy8gLS1vbmx5IDxhcHA+XG4gICAgICBpZiAob3B0cy5vbmx5KSB7XG4gICAgICAgIHZhciBhcHBzID0gb3B0cy5vbmx5LnNwbGl0KC8sfCAvKVxuICAgICAgICBpZiAoYXBwcy5pbmRleE9mKGFwcC5uYW1lKSA9PSAtMSlcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIC8vIE5hbWVzcGFjZVxuICAgICAgaWYgKCFhcHAubmFtZXNwYWNlKSB7XG4gICAgICAgIGlmIChvcHRzLm5hbWVzcGFjZSlcbiAgICAgICAgICBhcHAubmFtZXNwYWNlID0gb3B0cy5uYW1lc3BhY2U7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBhcHAubmFtZXNwYWNlID0gJ2RlZmF1bHQnO1xuICAgICAgfVxuICAgICAgLy8gLS13YXRjaFxuICAgICAgaWYgKCFhcHAud2F0Y2ggJiYgb3B0cy53YXRjaCAmJiBvcHRzLndhdGNoID09PSB0cnVlKVxuICAgICAgICBhcHAud2F0Y2ggPSB0cnVlO1xuICAgICAgLy8gLS1pZ25vcmUtd2F0Y2hcbiAgICAgIGlmICghYXBwLmlnbm9yZV93YXRjaCAmJiBvcHRzLmlnbm9yZV93YXRjaClcbiAgICAgICAgYXBwLmlnbm9yZV93YXRjaCA9IG9wdHMuaWdub3JlX3dhdGNoO1xuICAgICAgaWYgKG9wdHMuaW5zdGFsbF91cmwpXG4gICAgICAgIGFwcC5pbnN0YWxsX3VybCA9IG9wdHMuaW5zdGFsbF91cmw7XG4gICAgICAvLyAtLWluc3RhbmNlcyA8bmI+XG4gICAgICBpZiAob3B0cy5pbnN0YW5jZXMgJiYgdHlwZW9mKG9wdHMuaW5zdGFuY2VzKSA9PT0gJ251bWJlcicpXG4gICAgICAgIGFwcC5pbnN0YW5jZXMgPSBvcHRzLmluc3RhbmNlcztcbiAgICAgIC8vIC0tdWlkIDx1c2VyPlxuICAgICAgaWYgKG9wdHMudWlkKVxuICAgICAgICBhcHAudWlkID0gb3B0cy51aWQ7XG4gICAgICAvLyAtLWdpZCA8dXNlcj5cbiAgICAgIGlmIChvcHRzLmdpZClcbiAgICAgICAgYXBwLmdpZCA9IG9wdHMuZ2lkO1xuICAgICAgLy8gU3BlY2lmaWNcbiAgICAgIGlmIChhcHAuYXBwZW5kX2Vudl90b19uYW1lICYmIG9wdHMuZW52KVxuICAgICAgICBhcHAubmFtZSArPSAoJy0nICsgb3B0cy5lbnYpO1xuICAgICAgaWYgKG9wdHMubmFtZV9wcmVmaXggJiYgYXBwLm5hbWUuaW5kZXhPZihvcHRzLm5hbWVfcHJlZml4KSA9PSAtMSlcbiAgICAgICAgYXBwLm5hbWUgPSBgJHtvcHRzLm5hbWVfcHJlZml4fToke2FwcC5uYW1lfWBcblxuICAgICAgYXBwLnVzZXJuYW1lID0gQ29tbW9uLmdldEN1cnJlbnRVc2VybmFtZSgpO1xuICAgICAgYXBwc19uYW1lLnB1c2goYXBwLm5hbWUpO1xuICAgIH0pO1xuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24oZXJyLCByYXdfcHJvY19saXN0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBVbmlxdWlmeSBpbiBtZW1vcnkgcHJvY2VzcyBsaXN0XG4gICAgICAgKi9cbiAgICAgIHJhd19wcm9jX2xpc3QuZm9yRWFjaChmdW5jdGlvbihwcm9jKSB7XG4gICAgICAgIHByb2NfbGlzdFtwcm9jLm5hbWVdID0gcHJvYztcbiAgICAgIH0pO1xuXG4gICAgICAvKipcbiAgICAgICAqIEF1dG8gZGV0ZWN0IGFwcGxpY2F0aW9uIGFscmVhZHkgc3RhcnRlZFxuICAgICAgICogYW5kIGFjdCBvbiB0aGVtIGRlcGVuZGluZyBvbiBhY3Rpb25cbiAgICAgICAqL1xuICAgICAgZWFjaExpbWl0KE9iamVjdC5rZXlzKHByb2NfbGlzdCksIGNvbmYuQ09OQ1VSUkVOVF9BQ1RJT05TLCBmdW5jdGlvbihwcm9jX25hbWUsIG5leHQpIHtcbiAgICAgICAgLy8gU2tpcCBhcHAgbmFtZSAoLS1vbmx5IG9wdGlvbilcbiAgICAgICAgaWYgKGFwcHNfbmFtZS5pbmRleE9mKHByb2NfbmFtZSkgPT0gLTEpXG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcblxuICAgICAgICBpZiAoIShhY3Rpb24gPT0gJ3JlbG9hZFByb2Nlc3NJZCcgfHxcbiAgICAgICAgICAgIGFjdGlvbiA9PSAnc29mdFJlbG9hZFByb2Nlc3NJZCcgfHxcbiAgICAgICAgICAgIGFjdGlvbiA9PSAncmVzdGFydFByb2Nlc3NJZCcpKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV3JvbmcgYWN0aW9uIGNhbGxlZCcpO1xuXG4gICAgICAgIHZhciBhcHBzID0gYXBwQ29uZi5maWx0ZXIoZnVuY3Rpb24oYXBwKSB7XG4gICAgICAgICAgcmV0dXJuIGFwcC5uYW1lID09IHByb2NfbmFtZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGVudnMgPSBhcHBzLm1hcChmdW5jdGlvbihhcHApe1xuICAgICAgICAgIC8vIEJpbmRzIGVudl9kaWZmIHRvIGVudiBhbmQgcmV0dXJucyBpdC5cbiAgICAgICAgICByZXR1cm4gQ29tbW9uLm1lcmdlRW52aXJvbm1lbnRWYXJpYWJsZXMoYXBwLCBvcHRzLmVudiwgZGVwbG95Q29uZik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFzc2lnbnMgb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiBhbGxcbiAgICAgICAgLy8gTm90aWNlOiBpZiBwZW9wbGUgdXNlIHRoZSBzYW1lIG5hbWUgaW4gZGlmZmVyZW50IGFwcHMsXG4gICAgICAgIC8vICAgICAgICAgZHVwbGljYXRlZCBlbnZzIHdpbGwgYmUgb3ZlcnJvZGUgYnkgdGhlIGxhc3Qgb25lXG4gICAgICAgIHZhciBlbnYgPSBlbnZzLnJlZHVjZShmdW5jdGlvbihlMSwgZTIpe1xuICAgICAgICAgIHJldHVybiB1dGlsLmluaGVyaXRzKGUxLCBlMik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFdoZW4gd2UgYXJlIHByb2Nlc3NpbmcgSlNPTiwgYWxsb3cgdG8ga2VlcCB0aGUgbmV3IGVudiBieSBkZWZhdWx0XG4gICAgICAgIGVudi51cGRhdGVFbnYgPSB0cnVlO1xuXG4gICAgICAgIC8vIFBhc3MgYGVudmAgb3B0aW9uXG4gICAgICAgIHRoYXQuX29wZXJhdGUoYWN0aW9uLCBwcm9jX25hbWUsIGVudiwgZnVuY3Rpb24oZXJyLCByZXQpIHtcbiAgICAgICAgICBpZiAoZXJyKSBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuXG4gICAgICAgICAgLy8gRm9yIHJldHVyblxuICAgICAgICAgIGFwcHNfaW5mbyA9IGFwcHNfaW5mby5jb25jYXQocmV0KTtcblxuICAgICAgICAgIHRoYXQuQ2xpZW50Lm5vdGlmeUdvZChhY3Rpb24sIHByb2NfbmFtZSk7XG4gICAgICAgICAgLy8gQW5kIFJlbW92ZSBmcm9tIGFycmF5IHRvIHNweVxuICAgICAgICAgIGFwcHNfbmFtZS5zcGxpY2UoYXBwc19uYW1lLmluZGV4T2YocHJvY19uYW1lKSwgMSk7XG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgIGlmIChhcHBzX25hbWUubGVuZ3RoID4gMCAmJiBhY3Rpb24gIT0gJ3N0YXJ0JylcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHX1dBUk5JTkcgKyAnQXBwbGljYXRpb25zICVzIG5vdCBydW5uaW5nLCBzdGFydGluZy4uLicsIGFwcHNfbmFtZS5qb2luKCcsICcpKTtcbiAgICAgICAgLy8gU3RhcnQgbWlzc2luZyBhcHBzXG4gICAgICAgIHJldHVybiBzdGFydEFwcHMoYXBwc19uYW1lLCBmdW5jdGlvbihlcnIsIGFwcHMpIHtcbiAgICAgICAgICBhcHBzX2luZm8gPSBhcHBzX2luZm8uY29uY2F0KGFwcHMpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVyciwgYXBwc19pbmZvKSA6IHRoYXQuc3BlZWRMaXN0KGVyciA/IDEgOiAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHN0YXJ0QXBwcyhhcHBfbmFtZV90b19zdGFydCwgY2IpIHtcbiAgICAgIHZhciBhcHBzX3RvX3N0YXJ0ID0gW107XG4gICAgICB2YXIgYXBwc19zdGFydGVkID0gW107XG4gICAgICB2YXIgYXBwc19lcnJvcmVkID0gW107XG5cbiAgICAgIGFwcENvbmYuZm9yRWFjaChmdW5jdGlvbihhcHAsIGkpIHtcbiAgICAgICAgaWYgKGFwcF9uYW1lX3RvX3N0YXJ0LmluZGV4T2YoYXBwLm5hbWUpICE9IC0xKSB7XG4gICAgICAgICAgYXBwc190b19zdGFydC5wdXNoKGFwcENvbmZbaV0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgZWFjaExpbWl0KGFwcHNfdG9fc3RhcnQsIGNvbmYuQ09OQ1VSUkVOVF9BQ1RJT05TLCBmdW5jdGlvbihhcHAsIG5leHQpIHtcbiAgICAgICAgaWYgKG9wdHMuY3dkKVxuICAgICAgICAgIGFwcC5jd2QgPSBvcHRzLmN3ZDtcbiAgICAgICAgaWYgKG9wdHMuZm9yY2VfbmFtZSlcbiAgICAgICAgICBhcHAubmFtZSA9IG9wdHMuZm9yY2VfbmFtZTtcbiAgICAgICAgaWYgKG9wdHMuc3RhcnRlZF9hc19tb2R1bGUpXG4gICAgICAgICAgYXBwLnBteF9tb2R1bGUgPSB0cnVlO1xuXG4gICAgICAgIHZhciByZXNvbHZlZF9wYXRocyA9IG51bGw7XG5cbiAgICAgICAgLy8gaGFyZGNvZGUgc2NyaXB0IG5hbWUgdG8gdXNlIGBzZXJ2ZWAgZmVhdHVyZSBpbnNpZGUgYSBwcm9jZXNzIGZpbGVcbiAgICAgICAgaWYgKGFwcC5zY3JpcHQgPT09ICdzZXJ2ZScpIHtcbiAgICAgICAgICBhcHAuc2NyaXB0ID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ0FQSScsICdTZXJ2ZS5qcycpXG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlc29sdmVkX3BhdGhzID0gQ29tbW9uLnJlc29sdmVBcHBBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAgIGN3ZCAgICAgIDogdGhhdC5jd2QsXG4gICAgICAgICAgICBwbTJfaG9tZSA6IHRoYXQucG0yX2hvbWVcbiAgICAgICAgICB9LCBhcHApO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgYXBwc19lcnJvcmVkLnB1c2goZSlcbiAgICAgICAgICBDb21tb24uZXJyKGBFcnJvcjogJHtlLm1lc3NhZ2V9YClcbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFyZXNvbHZlZF9wYXRocy5lbnYpIHJlc29sdmVkX3BhdGhzLmVudiA9IHt9O1xuXG4gICAgICAgIC8vIFNldCBQTTIgSE9NRSBpbiBjYXNlIG9mIGNoaWxkIHByb2Nlc3MgdXNpbmcgUE0yIEFQSVxuICAgICAgICByZXNvbHZlZF9wYXRocy5lbnZbJ1BNMl9IT01FJ10gPSB0aGF0LnBtMl9ob21lO1xuXG4gICAgICAgIHZhciBhZGRpdGlvbmFsX2VudiA9IE1vZHVsYXJpemVyLmdldEFkZGl0aW9uYWxDb25mKHJlc29sdmVkX3BhdGhzLm5hbWUpO1xuICAgICAgICB1dGlsLmluaGVyaXRzKHJlc29sdmVkX3BhdGhzLmVudiwgYWRkaXRpb25hbF9lbnYpO1xuXG4gICAgICAgIHJlc29sdmVkX3BhdGhzLmVudiA9IENvbW1vbi5tZXJnZUVudmlyb25tZW50VmFyaWFibGVzKHJlc29sdmVkX3BhdGhzLCBvcHRzLmVudiwgZGVwbG95Q29uZik7XG5cbiAgICAgICAgZGVsZXRlIHJlc29sdmVkX3BhdGhzLmVudi5jdXJyZW50X2NvbmY7XG5cbiAgICAgICAgLy8gSXMgS00gbGlua2VkP1xuICAgICAgICByZXNvbHZlZF9wYXRocy5rbV9saW5rID0gdGhhdC5nbF9pc19rbV9saW5rZWQ7XG5cbiAgICAgICAgaWYgKHJlc29sdmVkX3BhdGhzLndhaXRfcmVhZHkpIHtcbiAgICAgICAgICBDb21tb24ud2FybihgQXBwICR7cmVzb2x2ZWRfcGF0aHMubmFtZX0gaGFzIG9wdGlvbiAnd2FpdF9yZWFkeScgc2V0LCB3YWl0aW5nIGZvciBhcHAgdG8gYmUgcmVhZHkuLi5gKVxuICAgICAgICB9XG4gICAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ3ByZXBhcmUnLCByZXNvbHZlZF9wYXRocywgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdQcm9jZXNzIGZhaWxlZCB0byBsYXVuY2ggJXMnLCBlcnIubWVzc2FnZSA/IGVyci5tZXNzYWdlIDogZXJyKTtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChkYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdQcm9jZXNzIGNvbmZpZyBsb2FkaW5nIGZhaWxlZCcsIGRhdGEpO1xuICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ0FwcCBbJXNdIGxhdW5jaGVkICglZCBpbnN0YW5jZXMpJywgZGF0YVswXS5wbTJfZW52Lm5hbWUsIGRhdGEubGVuZ3RoKTtcbiAgICAgICAgICBhcHBzX3N0YXJ0ZWQgPSBhcHBzX3N0YXJ0ZWQuY29uY2F0KGRhdGEpO1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICB2YXIgZmluYWxfZXJyb3IgPSBlcnIgfHwgYXBwc19lcnJvcmVkLmxlbmd0aCA+IDAgPyBhcHBzX2Vycm9yZWQgOiBudWxsXG4gICAgICAgIHJldHVybiBjYiA/IGNiKGZpbmFsX2Vycm9yLCBhcHBzX3N0YXJ0ZWQpIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBseSBhIFJQQyBtZXRob2Qgb24gdGhlIGpzb24gZmlsZVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAbWV0aG9kIGFjdGlvbkZyb21Kc29uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpb24gUlBDIE1ldGhvZFxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IGZpbGUgZmlsZVxuICAgKiBAcGFyYW0ge3N0cmluZ30ganNvblZpYSBhY3Rpb24gdHlwZSAoPW9ubHkgJ3BpcGUnID8pXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259XG4gICAqL1xuICBhY3Rpb25Gcm9tSnNvbiAoYWN0aW9uLCBmaWxlLCBvcHRzLCBqc29uVmlhLCBjYikge1xuICAgIHZhciBhcHBDb25mOiBhbnkgPSB7fTtcbiAgICB2YXIgcmV0X3Byb2Nlc3NlcyA9IFtdO1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIC8vYWNjZXB0IHByb2dyYW1tYXRpYyBjYWxsc1xuICAgIGlmICh0eXBlb2YgZmlsZSA9PSAnb2JqZWN0Jykge1xuICAgICAgY2IgPSB0eXBlb2YganNvblZpYSA9PSAnZnVuY3Rpb24nID8ganNvblZpYSA6IGNiO1xuICAgICAgYXBwQ29uZiA9IGZpbGU7XG4gICAgfVxuICAgIGVsc2UgaWYgKGpzb25WaWEgPT0gJ2ZpbGUnKSB7XG4gICAgICB2YXIgZGF0YSA9IG51bGw7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGRhdGEgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZSk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdGaWxlICcgKyBmaWxlICsnIG5vdCBmb3VuZCcpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGUpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBhcHBDb25mID0gQ29tbW9uLnBhcnNlQ29uZmlnKGRhdGEsIGZpbGUpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnRmlsZSAnICsgZmlsZSArICcgbWFsZm9ybWF0ZWQnKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGpzb25WaWEgPT0gJ3BpcGUnKSB7XG4gICAgICBhcHBDb25mID0gQ29tbW9uLnBhcnNlQ29uZmlnKGZpbGUsICdwaXBlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIENvbW1vbi5wcmludEVycm9yKCdCYWQgY2FsbCB0byBhY3Rpb25Gcm9tSnNvbiwganNvblZpYSBzaG91bGQgYmUgb25lIG9mIGZpbGUsIHBpcGUnKTtcbiAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICB9XG5cbiAgICAvLyBCYWNrd2FyZCBjb21wYXRpYmlsaXR5XG4gICAgaWYgKGFwcENvbmYuYXBwcylcbiAgICAgIGFwcENvbmYgPSBhcHBDb25mLmFwcHM7XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXBwQ29uZikpXG4gICAgICBhcHBDb25mID0gW2FwcENvbmZdO1xuXG4gICAgaWYgKChhcHBDb25mID0gQ29tbW9uLnZlcmlmeUNvbmZzKGFwcENvbmYpKSBpbnN0YW5jZW9mIEVycm9yKVxuICAgICAgcmV0dXJuIGNiID8gY2IoYXBwQ29uZikgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcblxuICAgIGVhY2hMaW1pdChhcHBDb25mLCBjb25mLkNPTkNVUlJFTlRfQUNUSU9OUywgZnVuY3Rpb24ocHJvYywgbmV4dDEpIHtcbiAgICAgIHZhciBuYW1lID0gJyc7XG4gICAgICB2YXIgbmV3X2VudjtcblxuICAgICAgaWYgKCFwcm9jLm5hbWUpXG4gICAgICAgIG5hbWUgPSBwYXRoLmJhc2VuYW1lKHByb2Muc2NyaXB0KTtcbiAgICAgIGVsc2VcbiAgICAgICAgbmFtZSA9IHByb2MubmFtZTtcblxuICAgICAgaWYgKG9wdHMub25seSAmJiBvcHRzLm9ubHkgIT0gbmFtZSlcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2sobmV4dDEpO1xuXG4gICAgICBpZiAob3B0cyAmJiBvcHRzLmVudilcbiAgICAgICAgbmV3X2VudiA9IENvbW1vbi5tZXJnZUVudmlyb25tZW50VmFyaWFibGVzKHByb2MsIG9wdHMuZW52KTtcbiAgICAgIGVsc2VcbiAgICAgICAgbmV3X2VudiA9IENvbW1vbi5tZXJnZUVudmlyb25tZW50VmFyaWFibGVzKHByb2MpO1xuXG4gICAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzSWRCeU5hbWUobmFtZSwgZnVuY3Rpb24oZXJyLCBpZHMpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgcmV0dXJuIG5leHQxKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpZHMpIHJldHVybiBuZXh0MSgpO1xuXG4gICAgICAgIGVhY2hMaW1pdChpZHMsIGNvbmYuQ09OQ1VSUkVOVF9BQ1RJT05TLCBmdW5jdGlvbihpZCwgbmV4dDIpIHtcbiAgICAgICAgICB2YXIgb3B0cyA9IHt9O1xuXG4gICAgICAgICAgLy9zdG9wUHJvY2Vzc0lkIGNvdWxkIGFjY2VwdCBvcHRpb25zIHRvP1xuICAgICAgICAgIGlmIChhY3Rpb24gPT0gJ3Jlc3RhcnRQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICBvcHRzID0ge2lkIDogaWQsIGVudiA6IG5ld19lbnZ9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcHRzID0gaWQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZShhY3Rpb24sIG9wdHMsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgICAgICByZXRfcHJvY2Vzc2VzLnB1c2gocmVzKTtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgcmV0dXJuIG5leHQyKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhY3Rpb24gPT0gJ3Jlc3RhcnRQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICAgIHRoYXQuQ2xpZW50Lm5vdGlmeUdvZCgncmVzdGFydCcsIGlkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09ICdkZWxldGVQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICAgIHRoYXQuQ2xpZW50Lm5vdGlmeUdvZCgnZGVsZXRlJywgaWQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT0gJ3N0b3BQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICAgIHRoYXQuQ2xpZW50Lm5vdGlmeUdvZCgnc3RvcCcsIGlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdbJXNdKCVkKSBcXHUyNzEzJywgbmFtZSwgaWQpO1xuICAgICAgICAgICAgcmV0dXJuIG5leHQyKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIHJldHVybiBuZXh0MShudWxsLCByZXRfcHJvY2Vzc2VzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgIGlmIChjYikgcmV0dXJuIGNiKG51bGwsIHJldF9wcm9jZXNzZXMpO1xuICAgICAgZWxzZSByZXR1cm4gdGhhdC5zcGVlZExpc3QoKTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIE1haW4gZnVuY3Rpb24gdG8gb3BlcmF0ZSB3aXRoIFBNMiBkYWVtb25cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGFjdGlvbl9uYW1lICBOYW1lIG9mIGFjdGlvbiAocmVzdGFydFByb2Nlc3NJZCwgZGVsZXRlUHJvY2Vzc0lkLCBzdG9wUHJvY2Vzc0lkKVxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvY2Vzc19uYW1lIGNhbiBiZSAnYWxsJywgYSBpZCBpbnRlZ2VyIG9yIHByb2Nlc3MgbmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZW52cyAgICAgICAgIG9iamVjdCB3aXRoIENMSSBvcHRpb25zIC8gZW52aXJvbm1lbnRcbiAgICovXG4gIF9vcGVyYXRlIChhY3Rpb25fbmFtZSwgcHJvY2Vzc19uYW1lLCBlbnZzLCBjYj8pIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHVwZGF0ZV9lbnYgPSBmYWxzZTtcbiAgICB2YXIgcmV0ID0gW107XG5cbiAgICAvLyBNYWtlIHN1cmUgYWxsIG9wdGlvbnMgZXhpc3RcbiAgICBpZiAoIWVudnMpXG4gICAgICBlbnZzID0ge307XG5cbiAgICBpZiAodHlwZW9mKGVudnMpID09ICdmdW5jdGlvbicpe1xuICAgICAgY2IgPSBlbnZzO1xuICAgICAgZW52cyA9IHt9O1xuICAgIH1cblxuICAgIC8vIFNldCB2aWEgZW52LnVwZGF0ZSAoSlNPTiBwcm9jZXNzaW5nKVxuICAgIGlmIChlbnZzLnVwZGF0ZUVudiA9PT0gdHJ1ZSlcbiAgICAgIHVwZGF0ZV9lbnYgPSB0cnVlO1xuXG4gICAgdmFyIGNvbmN1cnJlbnRfYWN0aW9ucyA9IGVudnMucGFyYWxsZWwgfHwgY29uZi5DT05DVVJSRU5UX0FDVElPTlM7XG5cbiAgICBpZiAoIXByb2Nlc3MuZW52LlBNMl9KU09OX1BST0NFU1NJTkcgfHwgZW52cy5jb21tYW5kcykge1xuICAgICAgZW52cyA9IHRoYXQuX2hhbmRsZUF0dHJpYnV0ZVVwZGF0ZShlbnZzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgY3VycmVudCB1cGRhdGVkIGNvbmZpZ3VyYXRpb24gaWYgbm90IHBhc3NlZFxuICAgICAqL1xuICAgIGlmICghZW52cy5jdXJyZW50X2NvbmYpIHtcbiAgICAgIHZhciBfY29uZiA9IGZjbG9uZShlbnZzKTtcbiAgICAgIGVudnMgPSB7XG4gICAgICAgIGN1cnJlbnRfY29uZiA6IF9jb25mXG4gICAgICB9XG5cbiAgICAgIC8vIElzIEtNIGxpbmtlZD9cbiAgICAgIGVudnMuY3VycmVudF9jb25mLmttX2xpbmsgPSB0aGF0LmdsX2lzX2ttX2xpbmtlZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPcGVyYXRlIGFjdGlvbiBvbiBzcGVjaWZpYyBwcm9jZXNzIGlkXG4gICAgICovXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0lkcyhpZHMsIGNiKSB7XG4gICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ0FwcGx5aW5nIGFjdGlvbiAlcyBvbiBhcHAgWyVzXShpZHM6ICVzKScsIGFjdGlvbl9uYW1lLCBwcm9jZXNzX25hbWUsIGlkcyk7XG5cbiAgICAgIGlmIChpZHMubGVuZ3RoIDw9IDIpXG4gICAgICAgIGNvbmN1cnJlbnRfYWN0aW9ucyA9IDE7XG5cbiAgICAgIGlmIChhY3Rpb25fbmFtZSA9PSAnZGVsZXRlUHJvY2Vzc0lkJylcbiAgICAgICAgY29uY3VycmVudF9hY3Rpb25zID0gMTA7XG5cbiAgICAgIGVhY2hMaW1pdChpZHMsIGNvbmN1cnJlbnRfYWN0aW9ucywgZnVuY3Rpb24oaWQsIG5leHQpIHtcbiAgICAgICAgdmFyIG9wdHM7XG5cbiAgICAgICAgLy8gVGhlc2UgZnVuY3Rpb25zIG5lZWQgZXh0cmEgcGFyYW0gdG8gYmUgcGFzc2VkXG4gICAgICAgIGlmIChhY3Rpb25fbmFtZSA9PSAncmVzdGFydFByb2Nlc3NJZCcgfHxcbiAgICAgICAgICBhY3Rpb25fbmFtZSA9PSAncmVsb2FkUHJvY2Vzc0lkJyB8fFxuICAgICAgICAgIGFjdGlvbl9uYW1lID09ICdzb2Z0UmVsb2FkUHJvY2Vzc0lkJykge1xuICAgICAgICAgIHZhciBuZXdfZW52OiBhbnkgPSB7fTtcblxuICAgICAgICAgIGlmICh1cGRhdGVfZW52ID09PSB0cnVlKSB7XG4gICAgICAgICAgICBpZiAoY29uZi5QTTJfUFJPR1JBTU1BVElDID09IHRydWUpXG4gICAgICAgICAgICAgIG5ld19lbnYgPSBDb21tb24uc2FmZUV4dGVuZCh7fSwgcHJvY2Vzcy5lbnYpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBuZXdfZW52ID0gdXRpbC5pbmhlcml0cyh7fSwgcHJvY2Vzcy5lbnYpO1xuXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhlbnZzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgICAgICAgICAgbmV3X2VudltrXSA9IGVudnNba107XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuZXdfZW52ID0gZW52cztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvcHRzID0ge1xuICAgICAgICAgICAgaWQgIDogaWQsXG4gICAgICAgICAgICBlbnYgOiBuZXdfZW52XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBvcHRzID0gaWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKGFjdGlvbl9uYW1lLCBvcHRzLCBmdW5jdGlvbihlcnIsIHJlcykge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnUHJvY2VzcyAlcyBub3QgZm91bmQnLCBpZCk7XG4gICAgICAgICAgICByZXR1cm4gbmV4dChgUHJvY2VzcyAke2lkfSBub3QgZm91bmRgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYWN0aW9uX25hbWUgPT0gJ3Jlc3RhcnRQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICB0aGF0LkNsaWVudC5ub3RpZnlHb2QoJ3Jlc3RhcnQnLCBpZCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb25fbmFtZSA9PSAnZGVsZXRlUHJvY2Vzc0lkJykge1xuICAgICAgICAgICAgdGhhdC5DbGllbnQubm90aWZ5R29kKCdkZWxldGUnLCBpZCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb25fbmFtZSA9PSAnc3RvcFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgIHRoYXQuQ2xpZW50Lm5vdGlmeUdvZCgnc3RvcCcsIGlkKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbl9uYW1lID09ICdyZWxvYWRQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICB0aGF0LkNsaWVudC5ub3RpZnlHb2QoJ3JlbG9hZCcsIGlkKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbl9uYW1lID09ICdzb2Z0UmVsb2FkUHJvY2Vzc0lkJykge1xuICAgICAgICAgICAgdGhhdC5DbGllbnQubm90aWZ5R29kKCdncmFjZWZ1bCByZWxvYWQnLCBpZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlcykpXG4gICAgICAgICAgICByZXMgPSBbcmVzXTtcblxuICAgICAgICAgIC8vIEZpbHRlciByZXR1cm5cbiAgICAgICAgICByZXMuZm9yRWFjaChmdW5jdGlvbihwcm9jKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1slc10oJWQpIFxcdTI3MTMnLCBwcm9jLnBtMl9lbnYgPyBwcm9jLnBtMl9lbnYubmFtZSA6IHByb2Nlc3NfbmFtZSwgaWQpO1xuXG4gICAgICAgICAgICBpZiAoYWN0aW9uX25hbWUgPT0gJ3N0b3BQcm9jZXNzSWQnICYmIHByb2MucG0yX2VudiAmJiBwcm9jLnBtMl9lbnYuY3Jvbl9yZXN0YXJ0KSB7XG4gICAgICAgICAgICAgIENvbW1vbi53YXJuKGBBcHAgJHtjaGFsay5ib2xkKHByb2MucG0yX2Vudi5uYW1lKX0gc3RvcHBlZCBidXQgQ1JPTiBSRVNUQVJUIGlzIHN0aWxsIFVQICR7cHJvYy5wbTJfZW52LmNyb25fcmVzdGFydH1gKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXByb2MucG0yX2VudikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICByZXQucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWUgICAgICAgICA6IHByb2MucG0yX2Vudi5uYW1lLFxuICAgICAgICAgICAgICBuYW1lc3BhY2U6IHByb2MucG0yX2Vudi5uYW1lc3BhY2UsXG4gICAgICAgICAgICAgIHBtX2lkICAgICAgICA6IHByb2MucG0yX2Vudi5wbV9pZCxcbiAgICAgICAgICAgICAgc3RhdHVzICAgICAgIDogcHJvYy5wbTJfZW52LnN0YXR1cyxcbiAgICAgICAgICAgICAgcmVzdGFydF90aW1lIDogcHJvYy5wbTJfZW52LnJlc3RhcnRfdGltZSxcbiAgICAgICAgICAgICAgcG0yX2VudiA6IHtcbiAgICAgICAgICAgICAgICBuYW1lICAgICAgICAgOiBwcm9jLnBtMl9lbnYubmFtZSxcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2U6IHByb2MucG0yX2Vudi5uYW1lc3BhY2UsXG4gICAgICAgICAgICAgICAgcG1faWQgICAgICAgIDogcHJvYy5wbTJfZW52LnBtX2lkLFxuICAgICAgICAgICAgICAgIHN0YXR1cyAgICAgICA6IHByb2MucG0yX2Vudi5zdGF0dXMsXG4gICAgICAgICAgICAgICAgcmVzdGFydF90aW1lIDogcHJvYy5wbTJfZW52LnJlc3RhcnRfdGltZSxcbiAgICAgICAgICAgICAgICBlbnYgICAgICAgICAgOiBwcm9jLnBtMl9lbnYuZW52XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCByZXQpIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChwcm9jZXNzX25hbWUgPT0gJ2FsbCcpIHtcbiAgICAgIC8vIFdoZW4gdXNpbmcgc2hvcnRjdXRzIGxpa2UgJ2FsbCcsIGRvIG5vdCBkZWxldGUgbW9kdWxlc1xuICAgICAgdmFyIGZuXG5cbiAgICAgIGlmIChwcm9jZXNzLmVudi5QTTJfU1RBVFVTID09ICdzdG9wcGluZycpXG4gICAgICAgIHRoYXQuQ2xpZW50LmdldEFsbFByb2Nlc3NJZChmdW5jdGlvbihlcnIsIGlkcykge1xuICAgICAgICAgIHJlb3BlcmF0ZShlcnIsIGlkcylcbiAgICAgICAgfSk7XG4gICAgICBlbHNlXG4gICAgICAgIHRoYXQuQ2xpZW50LmdldEFsbFByb2Nlc3NJZFdpdGhvdXRNb2R1bGVzKGZ1bmN0aW9uKGVyciwgaWRzKSB7XG4gICAgICAgICAgcmVvcGVyYXRlKGVyciwgaWRzKVxuICAgICAgICB9KTtcblxuICAgICAgZnVuY3Rpb24gcmVvcGVyYXRlKGVyciwgaWRzKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlkcyB8fCBpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX1dBUk5JTkcgKyAnTm8gcHJvY2VzcyBmb3VuZCcpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcigncHJvY2VzcyBuYW1lIG5vdCBmb3VuZCcpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9jZXNzSWRzKGlkcywgY2IpO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBvcGVyYXRlIHVzaW5nIHJlZ2V4XG4gICAgZWxzZSBpZiAoaXNOYU4ocHJvY2Vzc19uYW1lKSAmJiBwcm9jZXNzX25hbWVbMF0gPT09ICcvJyAmJiBwcm9jZXNzX25hbWVbcHJvY2Vzc19uYW1lLmxlbmd0aCAtIDFdID09PSAnLycpIHtcbiAgICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAocHJvY2Vzc19uYW1lLnJlcGxhY2UoL1xcLy9nLCAnJykpO1xuXG4gICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbihlcnIsIGxpc3QpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICAgICAgcmV0dXJuIGNiKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZvdW5kX3Byb2MgPSBbXTtcbiAgICAgICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHByb2MpIHtcbiAgICAgICAgICBpZiAocmVnZXgudGVzdChwcm9jLnBtMl9lbnYubmFtZSkpIHtcbiAgICAgICAgICAgIGZvdW5kX3Byb2MucHVzaChwcm9jLnBtX2lkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChmb3VuZF9wcm9jLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19XQVJOSU5HICsgJ05vIHByb2Nlc3MgZm91bmQnKTtcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoJ3Byb2Nlc3MgbmFtZSBub3QgZm91bmQnKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcm9jZXNzSWRzKGZvdW5kX3Byb2MsIGNiKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChpc05hTihwcm9jZXNzX25hbWUpKSB7XG4gICAgICAvKipcbiAgICAgICAqIFdlIGNhbiBub3Qgc3RvcCBvciBkZWxldGUgYSBtb2R1bGUgYnV0IHdlIGNhbiByZXN0YXJ0IGl0XG4gICAgICAgKiB0byByZWZyZXNoIGNvbmZpZ3VyYXRpb24gdmFyaWFibGVcbiAgICAgICAqL1xuICAgICAgdmFyIGFsbG93X21vZHVsZV9yZXN0YXJ0ID0gYWN0aW9uX25hbWUgPT0gJ3Jlc3RhcnRQcm9jZXNzSWQnID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzSWRCeU5hbWUocHJvY2Vzc19uYW1lLCBhbGxvd19tb2R1bGVfcmVzdGFydCwgZnVuY3Rpb24gKGVyciwgaWRzKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaWRzICYmIGlkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAqIERldGVybWluZSBpZiB0aGUgcHJvY2VzcyB0byByZXN0YXJ0IGlzIGEgbW9kdWxlXG4gICAgICAgICAqIGlmIHllcyBsb2FkIGNvbmZpZ3VyYXRpb24gdmFyaWFibGVzIGFuZCBtZXJnZSB3aXRoIHRoZSBjdXJyZW50IGVudmlyb25tZW50XG4gICAgICAgICAqL1xuICAgICAgICAgIHZhciBhZGRpdGlvbmFsX2VudiA9IE1vZHVsYXJpemVyLmdldEFkZGl0aW9uYWxDb25mKHByb2Nlc3NfbmFtZSk7XG4gICAgICAgICAgdXRpbC5pbmhlcml0cyhlbnZzLCBhZGRpdGlvbmFsX2Vudik7XG4gICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoaWRzLCBjYik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzSWRzQnlOYW1lc3BhY2UocHJvY2Vzc19uYW1lLCBhbGxvd19tb2R1bGVfcmVzdGFydCwgZnVuY3Rpb24gKGVyciwgbnNfcHJvY2Vzc19pZHMpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIW5zX3Byb2Nlc3NfaWRzIHx8IG5zX3Byb2Nlc3NfaWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdQcm9jZXNzIG9yIE5hbWVzcGFjZSAlcyBub3QgZm91bmQnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKCdwcm9jZXNzIG9yIG5hbWVzcGFjZSBub3QgZm91bmQnKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBEZXRlcm1pbmUgaWYgdGhlIHByb2Nlc3MgdG8gcmVzdGFydCBpcyBhIG1vZHVsZVxuICAgICAgICAgICAqIGlmIHllcyBsb2FkIGNvbmZpZ3VyYXRpb24gdmFyaWFibGVzIGFuZCBtZXJnZSB3aXRoIHRoZSBjdXJyZW50IGVudmlyb25tZW50XG4gICAgICAgICAgICovXG4gICAgICAgICAgdmFyIG5zX2FkZGl0aW9uYWxfZW52ID0gTW9kdWxhcml6ZXIuZ2V0QWRkaXRpb25hbENvbmYocHJvY2Vzc19uYW1lKTtcbiAgICAgICAgICB1dGlsLmluaGVyaXRzKGVudnMsIG5zX2FkZGl0aW9uYWxfZW52KTtcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzc0lkcyhuc19wcm9jZXNzX2lkcywgY2IpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhhdC5wbTJfY29uZmlndXJhdGlvbi5kb2NrZXIgPT0gXCJ0cnVlXCIgfHxcbiAgICAgICAgICB0aGF0LnBtMl9jb25maWd1cmF0aW9uLmRvY2tlciA9PSB0cnVlKSB7XG4gICAgICAgIC8vIERvY2tlci9TeXN0ZW1kIHByb2Nlc3MgaW50ZXJhY3Rpb24gZGV0ZWN0aW9uXG4gICAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIChlcnIsIHByb2NfbGlzdCkgPT4ge1xuICAgICAgICAgIHZhciBoaWdoZXJfaWQgPSAwXG4gICAgICAgICAgcHJvY19saXN0LmZvckVhY2gocCA9PiB7IHAucG1faWQgPiBoaWdoZXJfaWQgPyBoaWdoZXJfaWQgPSBwLnBtX2lkIDogbnVsbCB9KVxuXG4gICAgICAgICAgLy8gSXMgRG9ja2VyL1N5c3RlbWRcbiAgICAgICAgICBpZiAocHJvY2Vzc19uYW1lID4gaGlnaGVyX2lkKVxuICAgICAgICAgICAgcmV0dXJuIERvY2tlck1nbXQucHJvY2Vzc0NvbW1hbmQodGhhdCwgaGlnaGVyX2lkLCBwcm9jZXNzX25hbWUsIGFjdGlvbl9uYW1lLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgKGVyci5tZXNzYWdlID8gZXJyLm1lc3NhZ2UgOiBlcnIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCByZXQpIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAvLyBDaGVjayBpZiBhcHBsaWNhdGlvbiBuYW1lIGFzIG51bWJlciBpcyBhbiBhcHAgbmFtZVxuICAgICAgICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZShwcm9jZXNzX25hbWUsIGZ1bmN0aW9uKGVyciwgaWRzKSB7XG4gICAgICAgICAgICBpZiAoaWRzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzSWRzKGlkcywgY2IpO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBhcHBsaWNhdGlvbiBuYW1lIGFzIG51bWJlciBpcyBhbiBuYW1lc3BhY2VcbiAgICAgICAgICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NJZHNCeU5hbWVzcGFjZShwcm9jZXNzX25hbWUsIGZ1bmN0aW9uKGVyciwgbnNfcHJvY2Vzc19pZHMpIHtcbiAgICAgICAgICAgICAgaWYgKG5zX3Byb2Nlc3NfaWRzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMobnNfcHJvY2Vzc19pZHMsIGNiKTtcbiAgICAgICAgICAgICAgLy8gRWxzZSBvcGVyYXRlIG9uIHBtIGlkXG4gICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzSWRzKFtwcm9jZXNzX25hbWVdLCBjYik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAvLyBDaGVjayBpZiBhcHBsaWNhdGlvbiBuYW1lIGFzIG51bWJlciBpcyBhbiBhcHAgbmFtZVxuICAgICAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzSWRCeU5hbWUocHJvY2Vzc19uYW1lLCBmdW5jdGlvbihlcnIsIGlkcykge1xuICAgICAgICAgIGlmIChpZHMubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHJldHVybiBwcm9jZXNzSWRzKGlkcywgY2IpO1xuXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgYXBwbGljYXRpb24gbmFtZSBhcyBudW1iZXIgaXMgYW4gbmFtZXNwYWNlXG4gICAgICAgICAgdGhhdC5DbGllbnQuZ2V0UHJvY2Vzc0lkc0J5TmFtZXNwYWNlKHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24oZXJyLCBuc19wcm9jZXNzX2lkcykge1xuICAgICAgICAgICAgaWYgKG5zX3Byb2Nlc3NfaWRzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzSWRzKG5zX3Byb2Nlc3NfaWRzLCBjYik7XG4gICAgICAgICAgICAvLyBFbHNlIG9wZXJhdGUgb24gcG0gaWRcbiAgICAgICAgICAgIHJldHVybiBwcm9jZXNzSWRzKFtwcm9jZXNzX25hbWVdLCBjYik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBDYW1lbENhc2UgQ29tbWFuZGVyLmpzIGFyZ3VtZW50c1xuICAgKiB0byBVbmRlcnNjb3JlXG4gICAqIChub2RlQXJncyAtPiBub2RlX2FyZ3MpXG4gICAqL1xuICBfaGFuZGxlQXR0cmlidXRlVXBkYXRlIChvcHRzKSB7XG4gICAgdmFyIGNvbmY6IGFueSA9IENvbmZpZy5maWx0ZXJPcHRpb25zKG9wdHMpO1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICh0eXBlb2YoY29uZi5uYW1lKSAhPSAnc3RyaW5nJylcbiAgICAgIGRlbGV0ZSBjb25mLm5hbWU7XG5cbiAgICB2YXIgYXJnc0luZGV4ID0gMDtcbiAgICBpZiAob3B0cy5yYXdBcmdzICYmIChhcmdzSW5kZXggPSBvcHRzLnJhd0FyZ3MuaW5kZXhPZignLS0nKSkgPj0gMCkge1xuICAgICAgY29uZi5hcmdzID0gb3B0cy5yYXdBcmdzLnNsaWNlKGFyZ3NJbmRleCArIDEpO1xuICAgIH1cblxuICAgIHZhciBhcHBDb25mID0gQ29tbW9uLnZlcmlmeUNvbmZzKGNvbmYpWzBdO1xuXG4gICAgaWYgKGFwcENvbmYgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHdoaWxlIHRyYW5zZm9ybWluZyBDYW1lbENhc2UgYXJncyB0byB1bmRlcnNjb3JlJyk7XG4gICAgICByZXR1cm4gYXBwQ29uZjtcbiAgICB9XG5cbiAgICBpZiAoYXJnc0luZGV4ID09IC0xKVxuICAgICAgZGVsZXRlIGFwcENvbmYuYXJncztcbiAgICBpZiAoYXBwQ29uZi5uYW1lID09ICd1bmRlZmluZWQnKVxuICAgICAgZGVsZXRlIGFwcENvbmYubmFtZTtcblxuICAgIGRlbGV0ZSBhcHBDb25mLmV4ZWNfbW9kZTtcblxuICAgIGlmICh1dGlsLmlzQXJyYXkoYXBwQ29uZi53YXRjaCkgJiYgYXBwQ29uZi53YXRjaC5sZW5ndGggPT09IDApIHtcbiAgICAgIGlmICghfm9wdHMucmF3QXJncy5pbmRleE9mKCctLXdhdGNoJykpXG4gICAgICAgIGRlbGV0ZSBhcHBDb25mLndhdGNoXG4gICAgfVxuXG4gICAgLy8gT3B0aW9ucyBzZXQgdmlhIGVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgIGlmIChwcm9jZXNzLmVudi5QTTJfREVFUF9NT05JVE9SSU5HKVxuICAgICAgYXBwQ29uZi5kZWVwX21vbml0b3JpbmcgPSB0cnVlO1xuXG4gICAgLy8gRm9yY2UgZGVsZXRpb24gb2YgZGVmYXVsdHMgdmFsdWVzIHNldCBieSBjb21tYW5kZXJcbiAgICAvLyB0byBhdm9pZCBvdmVycmlkaW5nIHNwZWNpZmllZCBjb25maWd1cmF0aW9uIGJ5IHVzZXJcbiAgICBpZiAoYXBwQ29uZi50cmVla2lsbCA9PT0gdHJ1ZSlcbiAgICAgIGRlbGV0ZSBhcHBDb25mLnRyZWVraWxsO1xuICAgIGlmIChhcHBDb25mLnBteCA9PT0gdHJ1ZSlcbiAgICAgIGRlbGV0ZSBhcHBDb25mLnBteDtcbiAgICBpZiAoYXBwQ29uZi52aXppb24gPT09IHRydWUpXG4gICAgICBkZWxldGUgYXBwQ29uZi52aXppb247XG4gICAgaWYgKGFwcENvbmYuYXV0b21hdGlvbiA9PT0gdHJ1ZSlcbiAgICAgIGRlbGV0ZSBhcHBDb25mLmF1dG9tYXRpb247XG4gICAgaWYgKGFwcENvbmYuYXV0b3Jlc3RhcnQgPT09IHRydWUpXG4gICAgICBkZWxldGUgYXBwQ29uZi5hdXRvcmVzdGFydDtcblxuICAgIHJldHVybiBhcHBDb25mO1xuICB9XG5cbiAgZ2V0UHJvY2Vzc0lkQnlOYW1lIChuYW1lLCBjYj8pIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0aGlzLkNsaWVudC5nZXRQcm9jZXNzSWRCeU5hbWUobmFtZSwgZnVuY3Rpb24oZXJyLCBpZCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhpZCk7XG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBpZCkgOiB0aGF0LmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uXG4gICAqIEBtZXRob2Qgamxpc3RcbiAgICogQHBhcmFtIHt9IGRlYnVnXG4gICAqIEByZXR1cm5cbiAgICovXG4gIGpsaXN0IChkZWJ1Zz8pIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbihlcnIsIGxpc3QpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGVidWcpIHtcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUodXRpbC5pbnNwZWN0KGxpc3QsIGZhbHNlLCBudWxsLCBmYWxzZSkpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKEpTT04uc3RyaW5naWZ5KGxpc3QpKTtcbiAgICAgIH1cblxuICAgICAgdGhhdC5leGl0Q2xpKGNvbmYuU1VDQ0VTU19FWElUKTtcblxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc3BsYXkgc3lzdGVtIGluZm9ybWF0aW9uXG4gICAqIEBtZXRob2Qgc2xpc3RcbiAgICogQHJldHVyblxuICAgKi9cbiAgc2xpc3QgKHRyZWUpIHtcbiAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRTeXN0ZW1EYXRhJywge30sIChlcnIsIHN5c19pbmZvcykgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24uZXJyKGVycilcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpXG4gICAgICB9XG5cbiAgICAgIGlmICh0cmVlID09PSB0cnVlKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRyZWVpZnkuYXNUcmVlKHN5c19pbmZvcywgdHJ1ZSkpXG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKHV0aWwuaW5zcGVjdChzeXNfaW5mb3MsIGZhbHNlLCBudWxsLCBmYWxzZSkpXG4gICAgICB0aGlzLmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIHNwZWVkTGlzdFxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBzcGVlZExpc3QgKGNvZGU/LCBhcHBzX2FjdGVkPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgc3lzdGVtZGF0YSA9IG51bGxcbiAgICB2YXIgYWN0ZWQgPSBbXVxuXG4gICAgaWYgKChjb2RlICE9IDAgJiYgY29kZSAhPSBudWxsKSkge1xuICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjb2RlID8gY29kZSA6IGNvbmYuU1VDQ0VTU19FWElUKTtcbiAgICB9XG5cbiAgICBpZiAoYXBwc19hY3RlZCAmJiBhcHBzX2FjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGFwcHNfYWN0ZWQuZm9yRWFjaChwcm9jID0+IHtcbiAgICAgICAgYWN0ZWQucHVzaChwcm9jLnBtMl9lbnYgPyBwcm9jLnBtMl9lbnYucG1faWQgOiBwcm9jLnBtX2lkKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIFBNMiBjYWxsZWQgcHJvZ3JhbW1hdGljYWxseSBhbmQgbm90IGNhbGxlZCBmcm9tIENMSSAoYWxzbyBpbiBleGl0Q2xpKVxuICAgIGlmICgoY29uZi5QTTJfUFJPR1JBTU1BVElDICYmIHByb2Nlc3MuZW52LlBNMl9VU0FHRSAhPSAnQ0xJJykpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICByZXR1cm4gdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0U3lzdGVtRGF0YScsIHt9LCAoZXJyLCBzeXNfaW5mb3MpID0+IHtcbiAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIChlcnIsIHByb2NfbGlzdCkgPT4ge1xuICAgICAgICBkb0xpc3QoZXJyLCBwcm9jX2xpc3QsIHN5c19pbmZvcylcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGZ1bmN0aW9uIGRvTGlzdChlcnIsIGxpc3QsIHN5c19pbmZvcykge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBpZiAodGhhdC5nbF9yZXRyeSA9PSAwKSB7XG4gICAgICAgICAgdGhhdC5nbF9yZXRyeSArPSAxO1xuICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KHRoYXQuc3BlZWRMaXN0LmJpbmQodGhhdCksIDE0MDApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAlcy5cXG5BIHByb2Nlc3Mgc2VlbXMgdG8gYmUgb24gaW5maW5pdGUgbG9vcCwgcmV0cnkgaW4gNSBzZWNvbmRzJyxlcnIpO1xuICAgICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgICBpZiAocHJvY2Vzcy5zdGRvdXQuaXNUVFkgPT09IGZhbHNlKSB7XG4gICAgICAgIFVYLmxpc3RfbWluKGxpc3QpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoY29tbWFuZGVyLm1pbmlMaXN0ICYmICFjb21tYW5kZXIuc2lsZW50KVxuICAgICAgICBVWC5saXN0X21pbihsaXN0KTtcbiAgICAgIGVsc2UgaWYgKCFjb21tYW5kZXIuc2lsZW50KSB7XG4gICAgICAgIGlmICh0aGF0LmdsX2ludGVyYWN0X2luZm9zKSB7XG4gICAgICAgICAgdmFyIGRhc2hib2FyZF91cmwgPSBgaHR0cHM6Ly9hcHAucG0yLmlvLyMvci8ke3RoYXQuZ2xfaW50ZXJhY3RfaW5mb3MucHVibGljX2tleX1gXG5cbiAgICAgICAgICBpZiAodGhhdC5nbF9pbnRlcmFjdF9pbmZvcy5pbmZvX25vZGUgIT0gJ2h0dHBzOi8vcm9vdC5rZXltZXRyaWNzLmlvJykge1xuICAgICAgICAgICAgZGFzaGJvYXJkX3VybCA9IGAke3RoYXQuZ2xfaW50ZXJhY3RfaW5mb3MuaW5mb19ub2RlfS8jL3IvJHt0aGF0LmdsX2ludGVyYWN0X2luZm9zLnB1YmxpY19rZXl9YFxuICAgICAgICAgIH1cblxuICAgICAgICAgIENvbW1vbi5wcmludE91dCgnJXMgUE0yKyBhY3RpdmF0ZWQgfCBJbnN0YW5jZSBOYW1lOiAlcyB8IERhc2g6ICVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbGsuZ3JlZW4uYm9sZCgn4oeGJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNoYWxrLmJvbGQodGhhdC5nbF9pbnRlcmFjdF9pbmZvcy5tYWNoaW5lX25hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFsay5ib2xkKGRhc2hib2FyZF91cmwpKVxuICAgICAgICB9XG4gICAgICAgIFVYLmxpc3QobGlzdCwgc3lzX2luZm9zKTtcbiAgICAgICAgLy9Db21tb24ucHJpbnRPdXQoY2hhbGsud2hpdGUuaXRhbGljKCcgVXNlIGBwbTIgc2hvdyA8aWR8bmFtZT5gIHRvIGdldCBtb3JlIGRldGFpbHMgYWJvdXQgYW4gYXBwJykpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhhdC5DbGllbnQuZGFlbW9uX21vZGUgPT0gZmFsc2UpIHtcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KCdbLS1uby1kYWVtb25dIENvbnRpbnVlIHRvIHN0cmVhbSBsb2dzJyk7XG4gICAgICAgIENvbW1vbi5wcmludE91dCgnWy0tbm8tZGFlbW9uXSBFeGl0IG9uIHRhcmdldCBQTTIgZXhpdCBwaWQ9JyArIGZzLnJlYWRGaWxlU3luYyhjb25mLlBNMl9QSURfRklMRV9QQVRIKS50b1N0cmluZygpKTtcbiAgICAgICAgZ2xvYmFsW1wiX2F1dG9fZXhpdFwiXSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGF0LnN0cmVhbUxvZ3MoJ2FsbCcsIDAsIGZhbHNlLCAnSEg6bW06c3MnLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICAvLyBpZiAocHJvY2Vzcy5zdGRvdXQuaXNUVFkpIGlmIGxvb2tpbmcgZm9yIHN0YXJ0IGxvZ3NcbiAgICAgIGVsc2UgaWYgKCFwcm9jZXNzLmVudi5UUkFWSVMgJiYgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT0gJ3Rlc3QnICYmIGFjdGVkLmxlbmd0aCA+IDAgJiYgKGNvbW1hbmRlci5hdHRhY2ggPT09IHRydWUpKSB7XG4gICAgICAgIENvbW1vbi5pbmZvKGBMb2cgc3RyZWFtaW5nIGFwcHMgaWQ6ICR7Y2hhbGsuY3lhbihhY3RlZC5qb2luKCcgJykpfSwgZXhpdCB3aXRoIEN0cmwtQyBvciB3aWxsIGV4aXQgaW4gMTBzZWNzYClcblxuICAgICAgICAvLyBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgLy8gICBDb21tb24uaW5mbyhgTG9nIHN0cmVhbWluZyBleGl0ZWQgYXV0b21hdGljYWxseSwgcnVuICdwbTIgbG9ncycgdG8gY29udGludWUgd2F0Y2hpbmcgbG9nc2ApXG4gICAgICAgIC8vICAgcmV0dXJuIHRoYXQuZXhpdENsaShjb2RlID8gY29kZSA6IGNvbmYuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgLy8gfSwgMTAwMDApXG5cbiAgICAgICAgcmV0dXJuIGFjdGVkLmZvckVhY2goKHByb2NfbmFtZSkgPT4ge1xuICAgICAgICAgIHRoYXQuc3RyZWFtTG9ncyhwcm9jX25hbWUsIDAsIGZhbHNlLCBudWxsLCBmYWxzZSk7XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjb2RlID8gY29kZSA6IGNvbmYuU1VDQ0VTU19FWElUKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2NhbGUgdXAvZG93biBhIHByb2Nlc3NcbiAgICogQG1ldGhvZCBzY2FsZVxuICAgKi9cbiAgc2NhbGUgKGFwcF9uYW1lLCBudW1iZXIsIGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGFkZFByb2NzKHByb2MsIHZhbHVlLCBjYikge1xuICAgICAgKGZ1bmN0aW9uIGV4KHByb2MsIG51bWJlcikge1xuICAgICAgICBpZiAobnVtYmVyLS0gPT09IDApIHJldHVybiBjYigpO1xuICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1NjYWxpbmcgdXAgYXBwbGljYXRpb24nKTtcbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZHVwbGljYXRlUHJvY2Vzc0lkJywgcHJvYy5wbTJfZW52LnBtX2lkLCBleC5iaW5kKHRoaXMsIHByb2MsIG51bWJlcikpO1xuICAgICAgfSkocHJvYywgbnVtYmVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBybVByb2NzKHByb2NzLCB2YWx1ZSwgY2IpIHtcbiAgICAgIHZhciBpID0gMDtcblxuICAgICAgKGZ1bmN0aW9uIGV4KHByb2NzLCBudW1iZXIpIHtcbiAgICAgICAgaWYgKG51bWJlcisrID09PSAwKSByZXR1cm4gY2IoKTtcbiAgICAgICAgdGhhdC5fb3BlcmF0ZSgnZGVsZXRlUHJvY2Vzc0lkJywgcHJvY3NbaSsrXS5wbTJfZW52LnBtX2lkLCBleC5iaW5kKHRoaXMsIHByb2NzLCBudW1iZXIpKTtcbiAgICAgIH0pKHByb2NzLCBudW1iZXIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVuZCgpIHtcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOnRydWV9KSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgfVxuXG4gICAgdGhpcy5DbGllbnQuZ2V0UHJvY2Vzc0J5TmFtZShhcHBfbmFtZSwgZnVuY3Rpb24oZXJyLCBwcm9jcykge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghcHJvY3MgfHwgcHJvY3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnQXBwbGljYXRpb24gJXMgbm90IGZvdW5kJywgYXBwX25hbWUpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoJ0FwcCBub3QgZm91bmQnKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHByb2NfbnVtYmVyID0gcHJvY3MubGVuZ3RoO1xuXG4gICAgICBpZiAodHlwZW9mKG51bWJlcikgPT09ICdzdHJpbmcnICYmIG51bWJlci5pbmRleE9mKCcrJykgPj0gMCkge1xuICAgICAgICBudW1iZXIgPSBwYXJzZUludChudW1iZXIsIDEwKTtcbiAgICAgICAgcmV0dXJuIGFkZFByb2NzKHByb2NzWzBdLCBudW1iZXIsIGVuZCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmICh0eXBlb2YobnVtYmVyKSA9PT0gJ3N0cmluZycgJiYgbnVtYmVyLmluZGV4T2YoJy0nKSA+PSAwKSB7XG4gICAgICAgIG51bWJlciA9IHBhcnNlSW50KG51bWJlciwgMTApO1xuICAgICAgICByZXR1cm4gcm1Qcm9jcyhwcm9jc1swXSwgbnVtYmVyLCBlbmQpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIG51bWJlciA9IHBhcnNlSW50KG51bWJlciwgMTApO1xuICAgICAgICBudW1iZXIgPSBudW1iZXIgLSBwcm9jX251bWJlcjtcblxuICAgICAgICBpZiAobnVtYmVyIDwgMClcbiAgICAgICAgICByZXR1cm4gcm1Qcm9jcyhwcm9jcywgbnVtYmVyLCBlbmQpO1xuICAgICAgICBlbHNlIGlmIChudW1iZXIgPiAwKVxuICAgICAgICAgIHJldHVybiBhZGRQcm9jcyhwcm9jc1swXSwgbnVtYmVyLCBlbmQpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ05vdGhpbmcgdG8gZG8nKTtcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoJ1NhbWUgcHJvY2VzcyBudW1iZXInKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uXG4gICAqIEBtZXRob2QgZGVzY3JpYmVQcm9jZXNzXG4gICAqIEBwYXJhbSB7fSBwbTJfaWRcbiAgICogQHJldHVyblxuICAgKi9cbiAgZGVzY3JpYmUgKHBtMl9pZCwgY2I/KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdmFyIGZvdW5kX3Byb2MgPSBbXTtcblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcignRXJyb3IgcmV0cmlldmluZyBwcm9jZXNzIGxpc3Q6ICcgKyBlcnIpO1xuICAgICAgICB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHByb2MpIHtcbiAgICAgICAgaWYgKCghaXNOYU4ocG0yX2lkKSAgICAmJiBwcm9jLnBtX2lkID09IHBtMl9pZCkgfHxcbiAgICAgICAgICAodHlwZW9mKHBtMl9pZCkgPT09ICdzdHJpbmcnICYmIHByb2MubmFtZSAgPT0gcG0yX2lkKSkge1xuICAgICAgICAgIGZvdW5kX3Byb2MucHVzaChwcm9jKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChmb3VuZF9wcm9jLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfV0FSTklORyArICclcyBkb2VzblxcJ3QgZXhpc3QnLCBwbTJfaWQpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBbXSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFjYikge1xuICAgICAgICBmb3VuZF9wcm9jLmZvckVhY2goZnVuY3Rpb24ocHJvYykge1xuICAgICAgICAgIFVYLmRlc2NyaWJlKHByb2MpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgZm91bmRfcHJvYykgOiB0aGF0LmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFQSSBtZXRob2QgdG8gcGVyZm9ybSBhIGRlZXAgdXBkYXRlIG9mIFBNMlxuICAgKiBAbWV0aG9kIGRlZXBVcGRhdGVcbiAgICovXG4gIGRlZXBVcGRhdGUgKGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdVcGRhdGluZyBQTTIuLi4nKTtcblxuICAgIHZhciBjaGlsZDogYW55ID0gc2V4ZWMoXCJucG0gaSAtZyBwbTJAbGF0ZXN0OyBwbTIgdXBkYXRlXCIpO1xuXG4gICAgY2hpbGQuc3Rkb3V0Lm9uKCdlbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnUE0yIHN1Y2Nlc3NmdWxseSB1cGRhdGVkJyk7XG4gICAgICBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOnRydWV9KSA6IHRoYXQuZXhpdENsaShjb25mLlNVQ0NFU1NfRVhJVCk7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBMb2FkIGFsbCBBUEkgbWV0aG9kcyAvL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuQVBJRXh0cmEoQVBJKTtcbkFQSURlcGxveShBUEkpO1xuQVBJTW9kdWxlKEFQSSk7XG5cbkFQSVBsdXNMaW5rKEFQSSk7XG5BUElQbHVzUHJvY2VzcyhBUEkpO1xuQVBJUGx1c0hlbHBlcihBUEkpO1xuXG5BUElDb25maWcoQVBJKTtcbkFQSVZlcnNpb24oQVBJKTtcbkFQSVN0YXJ0dXAoQVBJKTtcbkFQSU1nbnQoQVBJKTtcbkFQSUNvbnRhaW5lcihBUEkpO1xuXG5leHBvcnQgZGVmYXVsdCBBUEk7XG4iXX0=