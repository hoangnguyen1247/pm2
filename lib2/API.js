/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
    _classCallCheck(this, API);

    _defineProperty(this, "daemon_mode", void 0);

    _defineProperty(this, "pm2_home", void 0);

    _defineProperty(this, "public_key", void 0);

    _defineProperty(this, "secret_key", void 0);

    _defineProperty(this, "machine_name", void 0);

    _defineProperty(this, "cwd", void 0);

    _defineProperty(this, "_conf", void 0);

    _defineProperty(this, "Client", void 0);

    _defineProperty(this, "pm2_configuration", void 0);

    _defineProperty(this, "gl_interact_infos", void 0);

    _defineProperty(this, "gl_is_km_linked", void 0);

    _defineProperty(this, "gl_retry", void 0);

    _defineProperty(this, "start_timer", void 0);

    _defineProperty(this, "killAgent", void 0);

    _defineProperty(this, "launchAll", void 0);

    _defineProperty(this, "getVersion", void 0);

    _defineProperty(this, "dump", void 0);

    _defineProperty(this, "resurrect", void 0);

    _defineProperty(this, "streamLogs", void 0);

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


  _createClass(API, [{
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

      if (_Common["default"].isConfigFile(cmd) || _typeof(cmd) === 'object') {
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
      } else if (_Common["default"].isConfigFile(cmd) || _typeof(cmd) === 'object') that._startJson(cmd, opts, 'restartProcessId', cb);else {
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

      if (_typeof(file) === 'object') {
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

      if (_typeof(file) == 'object') {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9BUEkudHMiXSwibmFtZXMiOlsiZGVidWciLCJJTU1VVEFCTEVfTVNHIiwiY2hhbGsiLCJib2xkIiwiYmx1ZSIsImNvbmYiLCJjc3QiLCJBUEkiLCJvcHRzIiwidGhhdCIsImRhZW1vbl9tb2RlIiwicG0yX2hvbWUiLCJQTTJfUk9PVF9QQVRIIiwicHVibGljX2tleSIsIlBVQkxJQ19LRVkiLCJzZWNyZXRfa2V5IiwiU0VDUkVUX0tFWSIsIm1hY2hpbmVfbmFtZSIsIk1BQ0hJTkVfTkFNRSIsImN3ZCIsInByb2Nlc3MiLCJwYXRoIiwicmVzb2x2ZSIsImluZGVwZW5kZW50IiwiRXJyb3IiLCJ1dGlsIiwiaW5oZXJpdHMiLCJJU19XSU5ET1dTIiwicmFuZG9tX2ZpbGUiLCJjcnlwdG8iLCJyYW5kb21CeXRlcyIsInRvU3RyaW5nIiwiam9pbiIsIl9jb25mIiwiQ2xpZW50IiwicG0yX2NvbmZpZ3VyYXRpb24iLCJDb25maWd1cmF0aW9uIiwiZ2V0U3luYyIsImdsX2ludGVyYWN0X2luZm9zIiwiZ2xfaXNfa21fbGlua2VkIiwicGlkIiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJJTlRFUkFDVE9SX1BJRF9QQVRIIiwicGFyc2VJbnQiLCJ0cmltIiwia2lsbCIsImUiLCJlbnYiLCJOT0RFX0VOViIsIktNRGFlbW9uIiwicGluZyIsImVyciIsInJlc3VsdCIsInJlYWRGaWxlIiwiSU5URVJBQ1RJT05fQ09ORiIsIkpTT04iLCJwYXJzZSIsImpzb241IiwiY29uc29sZSIsImVycm9yIiwiZ2xfcmV0cnkiLCJub0RhZW1vbiIsImNiIiwic3RhcnRfdGltZXIiLCJEYXRlIiwic3RhcnQiLCJtZXRhIiwibmV3X3BtMl9pbnN0YW5jZSIsImxhdW5jaEFsbCIsImVycl9tb2QiLCJraWxsRGFlbW9uIiwiY21kIiwidGVzdF9wYXRoIiwidGVzdF9wYXRoXzIiLCJpbmRleE9mIiwiYWNjZXNzIiwiY29uc3RhbnRzIiwiUl9PSyIsImNsb3NlIiwiZGF0YSIsImRpc2Nvbm5lY3QiLCJsYXVuY2hCdXMiLCJjb2RlIiwiUE0yX1BST0dSQU1NQVRJQyIsIlBNMl9VU0FHRSIsImRpc2Nvbm5lY3RSUEMiLCJmZHMiLCJ0cnlUb0V4aXQiLCJleGl0Iiwic3Rkb3V0Iiwic3RkZXJyIiwiZm9yRWFjaCIsInN0ZCIsImZkIiwiYnVmZmVyU2l6ZSIsIndyaXRlIiwic2VtdmVyIiwibHQiLCJ2ZXJzaW9uIiwiQ29tbW9uIiwicHJpbnRPdXQiLCJQUkVGSVhfTVNHX1dBUk5JTkciLCJpc0FycmF5Iiwid2F0Y2giLCJsZW5ndGgiLCJyYXdBcmdzIiwiYXJndiIsImlzQ29uZmlnRmlsZSIsIl9zdGFydEpzb24iLCJwcm9jcyIsInNwZWVkTGlzdCIsIl9zdGFydFNjcmlwdCIsInByb2Nlc3NfbmFtZSIsInByb2Nlc3NJZHMiLCJpZHMiLCJDT05DVVJSRU5UX0FDVElPTlMiLCJpZCIsIm5leHQiLCJleGVjdXRlUmVtb3RlIiwicmVzIiwiUFJFRklYX01TRyIsInJldEVyciIsInN1Y2Nlc3MiLCJnZXRBbGxQcm9jZXNzSWQiLCJwcmludEVycm9yIiwiZXhpdENsaSIsIkVSUk9SX0VYSVQiLCJpc05hTiIsImdldFByb2Nlc3NJZEJ5TmFtZSIsImdldFZlcnNpb24iLCJuZXdfdmVyc2lvbiIsInBrZyIsImR0IiwiX19kaXJuYW1lIiwiUE0yX1VQREFURSIsImxvZyIsImR1bXAiLCJhcmd1bWVudHMiLCJsYXVuY2hEYWVtb24iLCJpbnRlcmFjdG9yIiwiY2hpbGQiLCJsYXVuY2hSUEMiLCJyZXN1cnJlY3QiLCJsYXVuY2hBbmRJbnRlcmFjdCIsInBtMl92ZXJzaW9uIiwiaW50ZXJhY3Rvcl9wcm9jIiwic2V0VGltZW91dCIsImRlbGF5IiwibG9ja1JlbG9hZCIsImZvcmNlIiwiUFJFRklYX01TR19FUlIiLCJNYXRoIiwiZmxvb3IiLCJSRUxPQURfTE9DS19USU1FT1VUIiwiYXBwcyIsInVubG9ja1JlbG9hZCIsIlNVQ0NFU1NfRVhJVCIsInVwZGF0ZUVudiIsIl9vcGVyYXRlIiwic3RkaW4iLCJyZXN1bWUiLCJzZXRFbmNvZGluZyIsIm9uIiwicGFyYW0iLCJwYXVzZSIsImFjdGlvbkZyb21Kc29uIiwianNvblZpYSIsImNvbW1hbmRlciIsImxpc3QiLCJzaG93IiwiZm9ybWF0IiwiVVgiLCJzZXRJbnRlcnZhbCIsIlBNMl9TVEFUVVMiLCJQTTJfU0lMRU5UIiwia2lsbEFnZW50Iiwic2NyaXB0IiwiYXBwX2NvbmYiLCJDb25maWciLCJmaWx0ZXJPcHRpb25zIiwiYXBwQ29uZiIsIm5hbWUiLCJhcmdzIiwiYXJnc0luZGV4Iiwic2xpY2UiLCJzY3JpcHRBcmdzIiwibmFtZXNwYWNlIiwidmVyaWZ5Q29uZnMiLCJ3YXRjaERlbGF5Iiwid2F0Y2hfZGVsYXkiLCJwYXJzZUZsb2F0IiwibWFzIiwiZXh0IiwiaGYiLCJtYWtlX2F2YWlsYWJsZV9leHRlbnNpb24iLCJpZ25vcmVfd2F0Y2giLCJkc3RfcGF0aCIsIlBXRCIsIndyaXRlRmlsZVN5bmMiLCJzdHJpbmdpZnkiLCJzdGFjayIsInJlc3RhcnRFeGlzdGluZ1Byb2Nlc3NOYW1lIiwicmVzdGFydEV4aXN0aW5nTmFtZVNwYWNlIiwicmVzdGFydEV4aXN0aW5nUHJvY2Vzc0lkIiwicmVzdGFydEV4aXN0aW5nUHJvY2Vzc1BhdGhPclN0YXJ0TmV3IiwicmV0IiwiX2R0IiwidW5kZWZpbmVkIiwiZXh0bmFtZSIsImdldFByb2Nlc3NJZHNCeU5hbWVzcGFjZSIsImZ1bGxfcGF0aCIsIm1hbmFnZWRfc2NyaXB0IiwicHJvYyIsInBtMl9lbnYiLCJwbV9leGVjX3BhdGgiLCJzdGF0dXMiLCJTVE9QUEVEX1NUQVRVUyIsIlNUT1BQSU5HX1NUQVRVUyIsIkVSUk9SRURfU1RBVFVTIiwiYXBwX25hbWUiLCJyZXNvbHZlZF9wYXRocyIsInJlc29sdmVBcHBBdHRyaWJ1dGVzIiwibWVzc2FnZSIsImluc3RhbmNlcyIsImV4ZWNfbW9kZSIsImFkZGl0aW9uYWxfZW52IiwiTW9kdWxhcml6ZXIiLCJnZXRBZGRpdGlvbmFsQ29uZiIsImttX2xpbmsiLCJmaWxlIiwiYWN0aW9uIiwicGlwZSIsImNvbmZpZyIsInN0YXRpY0NvbmYiLCJkZXBsb3lDb25mIiwiYXBwc19pbmZvIiwicGFyc2VDb25maWciLCJpc0Fic29sdXRlIiwiZmlsZV9wYXRoIiwiZGVwbG95IiwicG0yIiwiQXJyYXkiLCJQTTJfSlNPTl9QUk9DRVNTSU5HIiwiYXBwc19uYW1lIiwicHJvY19saXN0Iiwic2VydmUiLCJwdXNoIiwicG9ydCIsIlBNMl9TRVJWRV9QT1JUIiwiUE0yX1NFUlZFX0hPU1QiLCJob3N0IiwiUE0yX1NFUlZFX1BBVEgiLCJQTTJfU0VSVkVfU1BBIiwic3BhIiwiUE0yX1NFUlZFX0RJUkVDVE9SWSIsImRpcmVjdG9yeSIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIIiwiYmFzaWNfYXV0aCIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIX1VTRVJOQU1FIiwidXNlcm5hbWUiLCJQTTJfU0VSVkVfQkFTSUNfQVVUSF9QQVNTV09SRCIsInBhc3N3b3JkIiwiUE0yX1NFUlZFX01PTklUT1IiLCJtb25pdG9yIiwiYXBwIiwiaW8iLCJvbmx5Iiwic3BsaXQiLCJpbnN0YWxsX3VybCIsInVpZCIsImdpZCIsImFwcGVuZF9lbnZfdG9fbmFtZSIsIm5hbWVfcHJlZml4IiwiZ2V0Q3VycmVudFVzZXJuYW1lIiwicmF3X3Byb2NfbGlzdCIsIk9iamVjdCIsImtleXMiLCJwcm9jX25hbWUiLCJmaWx0ZXIiLCJlbnZzIiwibWFwIiwibWVyZ2VFbnZpcm9ubWVudFZhcmlhYmxlcyIsInJlZHVjZSIsImUxIiwiZTIiLCJjb25jYXQiLCJub3RpZnlHb2QiLCJzcGxpY2UiLCJzdGFydEFwcHMiLCJhcHBfbmFtZV90b19zdGFydCIsImFwcHNfdG9fc3RhcnQiLCJhcHBzX3N0YXJ0ZWQiLCJhcHBzX2Vycm9yZWQiLCJpIiwiZm9yY2VfbmFtZSIsInN0YXJ0ZWRfYXNfbW9kdWxlIiwicG14X21vZHVsZSIsImN1cnJlbnRfY29uZiIsIndhaXRfcmVhZHkiLCJ3YXJuIiwiZmluYWxfZXJyb3IiLCJyZXRfcHJvY2Vzc2VzIiwibmV4dDEiLCJuZXdfZW52IiwiYmFzZW5hbWUiLCJuZXh0VGljayIsIm5leHQyIiwiYWN0aW9uX25hbWUiLCJ1cGRhdGVfZW52IiwiY29uY3VycmVudF9hY3Rpb25zIiwicGFyYWxsZWwiLCJjb21tYW5kcyIsIl9oYW5kbGVBdHRyaWJ1dGVVcGRhdGUiLCJzYWZlRXh0ZW5kIiwiayIsImNyb25fcmVzdGFydCIsInBtX2lkIiwicmVzdGFydF90aW1lIiwicmVvcGVyYXRlIiwiZm4iLCJnZXRBbGxQcm9jZXNzSWRXaXRob3V0TW9kdWxlcyIsInJlZ2V4IiwiUmVnRXhwIiwicmVwbGFjZSIsImZvdW5kX3Byb2MiLCJ0ZXN0IiwiYWxsb3dfbW9kdWxlX3Jlc3RhcnQiLCJuc19wcm9jZXNzX2lkcyIsIm5zX2FkZGl0aW9uYWxfZW52IiwiZG9ja2VyIiwiaGlnaGVyX2lkIiwicCIsIkRvY2tlck1nbXQiLCJwcm9jZXNzQ29tbWFuZCIsIlBNMl9ERUVQX01PTklUT1JJTkciLCJkZWVwX21vbml0b3JpbmciLCJ0cmVla2lsbCIsInBteCIsInZpemlvbiIsImF1dG9tYXRpb24iLCJhdXRvcmVzdGFydCIsImluc3BlY3QiLCJ0cmVlIiwic3lzX2luZm9zIiwiYXBwc19hY3RlZCIsInN5c3RlbWRhdGEiLCJhY3RlZCIsImRvTGlzdCIsImJpbmQiLCJpc1RUWSIsImxpc3RfbWluIiwibWluaUxpc3QiLCJzaWxlbnQiLCJkYXNoYm9hcmRfdXJsIiwiaW5mb19ub2RlIiwiZ3JlZW4iLCJQTTJfUElEX0ZJTEVfUEFUSCIsImdsb2JhbCIsInN0cmVhbUxvZ3MiLCJUUkFWSVMiLCJhdHRhY2giLCJpbmZvIiwiY3lhbiIsIm51bWJlciIsImFkZFByb2NzIiwidmFsdWUiLCJleCIsInJtUHJvY3MiLCJlbmQiLCJnZXRQcm9jZXNzQnlOYW1lIiwicHJvY19udW1iZXIiLCJwbTJfaWQiLCJkZXNjcmliZSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FBS0E7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFD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QUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBT3NRLFVBQVAsQ0FBTCxHQUEwQjVULElBQUksQ0FBQ3FILE9BQUwsQ0FBYXpILElBQUksQ0FBQ3dKLFlBQWxCLENBQW5DO0FBQ0QsT0F6QkQ7QUEwQkQ7QUFFRDs7Ozs7OzsrQkFJWTlGLEUsRUFBSTtBQUNkLFVBQUl0RCxJQUFJLEdBQUcsSUFBWDs7QUFFQTJGLHlCQUFPQyxRQUFQLENBQWdCaEcsSUFBSSxDQUFDb0gsVUFBTCxHQUFrQixpQkFBbEM7O0FBRUEsVUFBSW9CLEtBQVUsR0FBRyx1QkFBTSxpQ0FBTixDQUFqQjtBQUVBQSxNQUFBQSxLQUFLLENBQUNuRCxNQUFOLENBQWF5RSxFQUFiLENBQWdCLEtBQWhCLEVBQXVCLFlBQVc7QUFDaEMvRCwyQkFBT0MsUUFBUCxDQUFnQmhHLElBQUksQ0FBQ29ILFVBQUwsR0FBa0IsMEJBQWxDOztBQUNBMUQsUUFBQUEsRUFBRSxHQUFHQSxFQUFFLENBQUMsSUFBRCxFQUFPO0FBQUM0RCxVQUFBQSxPQUFPLEVBQUM7QUFBVCxTQUFQLENBQUwsR0FBOEJsSCxJQUFJLENBQUNxSCxPQUFMLENBQWF6SCxJQUFJLENBQUN3SixZQUFsQixDQUFoQztBQUNELE9BSEQ7QUFJRDs7Ozs7O0FBQ0YsQyxDQUVEO0FBQ0E7QUFDQTs7QUFFQSx1QkFBU3RKLEdBQVQ7QUFDQSx3QkFBVUEsR0FBVjtBQUNBLHVCQUFVQSxHQUFWO0FBRUEsc0JBQVlBLEdBQVo7QUFDQSxpQ0FBZUEsR0FBZjtBQUNBLHlCQUFjQSxHQUFkO0FBRUEsZ0NBQVVBLEdBQVY7QUFDQSx5QkFBV0EsR0FBWDtBQUNBLHlCQUFXQSxHQUFYO0FBQ0EsK0JBQVFBLEdBQVI7QUFDQSwrQkFBYUEsR0FBYjtlQUVlQSxHIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgbGljZW5zZSB0aGF0XG4gKiBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgY29tbWFuZGVyIGZyb20gJ2NvbW1hbmRlcic7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZWFjaExpbWl0IGZyb20gJ2FzeW5jL2VhY2hMaW1pdCc7XG5pbXBvcnQgc2VyaWVzIGZyb20gJ2FzeW5jL3Nlcmllcyc7XG5pbXBvcnQgZGVidWdMb2dnZXIgZnJvbSAnZGVidWcnO1xuaW1wb3J0IHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IGZjbG9uZSBmcm9tICdmY2xvbmUnO1xuXG5pbXBvcnQgRG9ja2VyTWdtdCBmcm9tICcuL0FQSS9FeHRyYU1nbXQvRG9ja2VyJztcbmltcG9ydCBjc3QgZnJvbSAnLi4vY29uc3RhbnRzJztcbmltcG9ydCBDbGllbnQgZnJvbSAnLi9DbGllbnQnO1xuaW1wb3J0IENvbW1vbiBmcm9tICcuL0NvbW1vbic7XG5pbXBvcnQgS01EYWVtb24gZnJvbSAnQHBtMi9hZ2VudC9zcmMvSW50ZXJhY3RvckNsaWVudCc7XG5pbXBvcnQgQ29uZmlnIGZyb20gJy4vdG9vbHMvQ29uZmlnJztcbmltcG9ydCBNb2R1bGFyaXplciBmcm9tICcuL0FQSS9Nb2R1bGVzL01vZHVsYXJpemVyJztcbmltcG9ydCBwYXRoX3N0cnVjdHVyZSBmcm9tICcuLi9wYXRocyc7XG5pbXBvcnQgVVggZnJvbSAnLi9BUEkvVVgnO1xuaW1wb3J0IHBrZyBmcm9tICcuLi9wYWNrYWdlLmpzb24nO1xuaW1wb3J0IGhmIGZyb20gJy4vQVBJL01vZHVsZXMvZmxhZ0V4dCc7XG5pbXBvcnQgQ29uZmlndXJhdGlvbiBmcm9tICcuL0NvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHNleGVjIGZyb20gJy4vdG9vbHMvc2V4ZWMnO1xuaW1wb3J0IGNyeXB0byBmcm9tICdjcnlwdG8nO1xuaW1wb3J0IGpzb241IGZyb20gJy4vdG9vbHMvanNvbjUnXG5pbXBvcnQgZGF5anMgZnJvbSAnZGF5anMnO1xuaW1wb3J0IHRyZWVpZnkgZnJvbSAnLi90b29scy90cmVlaWZ5J1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gTG9hZCBhbGwgQVBJIG1ldGhvZHMgLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmltcG9ydCBBUElFeHRyYSBmcm9tICcuL0FQSS9FeHRyYSc7XG5pbXBvcnQgQVBJRGVwbG95IGZyb20gJy4vQVBJL0RlcGxveSc7XG5pbXBvcnQgQVBJTW9kdWxlIGZyb20gJy4vQVBJL01vZHVsZXMvaW5kZXgnO1xuXG5pbXBvcnQgQVBJUGx1c0xpbmsgZnJvbSAnLi9BUEkvcG0yLXBsdXMvbGluayc7XG5pbXBvcnQgQVBJUGx1c1Byb2Nlc3MgZnJvbSAnLi9BUEkvcG0yLXBsdXMvcHJvY2Vzcy1zZWxlY3Rvcic7XG5pbXBvcnQgQVBJUGx1c0hlbHBlciBmcm9tICcuL0FQSS9wbTItcGx1cy9oZWxwZXJzJztcblxuaW1wb3J0IEFQSUNvbmZpZyBmcm9tICcuL0FQSS9Db25maWd1cmF0aW9uJztcbmltcG9ydCBBUElWZXJzaW9uIGZyb20gJy4vQVBJL1ZlcnNpb24nO1xuaW1wb3J0IEFQSVN0YXJ0dXAgZnJvbSAnLi9BUEkvU3RhcnR1cCc7XG5pbXBvcnQgQVBJTWdudCBmcm9tICcuL0FQSS9Mb2dNYW5hZ2VtZW50JztcbmltcG9ydCBBUElDb250YWluZXIgZnJvbSAnLi9BUEkvQ29udGFpbmVyaXplcic7XG5cbnZhciBkZWJ1ZyA9IGRlYnVnTG9nZ2VyKCdwbTI6Y2xpJyk7XG52YXIgSU1NVVRBQkxFX01TRyA9IGNoYWxrLmJvbGQuYmx1ZSgnVXNlIC0tdXBkYXRlLWVudiB0byB1cGRhdGUgZW52aXJvbm1lbnQgdmFyaWFibGVzJyk7XG5cbnZhciBjb25mID0gY3N0XG5cbi8qKlxuICogTWFpbiBGdW5jdGlvbiB0byBiZSBpbXBvcnRlZFxuICogY2FuIGJlIGFsaWFzZWQgdG8gUE0yXG4gKlxuICogVG8gdXNlIGl0IHdoZW4gUE0yIGlzIGluc3RhbGxlZCBhcyBhIG1vZHVsZTpcbiAqXG4gKiB2YXIgUE0yID0gcmVxdWlyZSgncG0yJyk7XG4gKlxuICogdmFyIHBtMiA9IFBNMig8b3B0cz4pO1xuICpcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gIG9wdHNcbiAqIEBwYXJhbSB7U3RyaW5nfSAgW29wdHMuY3dkPTxjdXJyZW50Pl0gICAgICAgICBvdmVycmlkZSBwbTIgY3dkIGZvciBzdGFydGluZyBzY3JpcHRzXG4gKiBAcGFyYW0ge1N0cmluZ30gIFtvcHRzLnBtMl9ob21lPVs8cGF0aHMuanM+XV0gcG0yIGRpcmVjdG9yeSBmb3IgbG9nLCBwaWRzLCBzb2NrZXQgZmlsZXNcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdHMuaW5kZXBlbmRlbnQ9ZmFsc2VdICAgICB1bmlxdWUgUE0yIGluc3RhbmNlIChyYW5kb20gcG0yX2hvbWUpXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRzLmRhZW1vbl9tb2RlPXRydWVdICAgICAgc2hvdWxkIGJlIGNhbGxlZCBpbiB0aGUgc2FtZSBwcm9jZXNzIG9yIG5vdFxuICogQHBhcmFtIHtTdHJpbmd9ICBbb3B0cy5wdWJsaWNfa2V5PW51bGxdICAgICAgIHBtMiBwbHVzIGJ1Y2tldCBwdWJsaWMga2V5XG4gKiBAcGFyYW0ge1N0cmluZ30gIFtvcHRzLnNlY3JldF9rZXk9bnVsbF0gICAgICAgcG0yIHBsdXMgYnVja2V0IHNlY3JldCBrZXlcbiAqIEBwYXJhbSB7U3RyaW5nfSAgW29wdHMubWFjaGluZV9uYW1lPW51bGxdICAgICBwbTIgcGx1cyBpbnN0YW5jZSBuYW1lXG4gKi9cbmNsYXNzIEFQSSB7XG5cbiAgZGFlbW9uX21vZGU6IGJvb2xlYW47XG4gIHBtMl9ob21lOiBzdHJpbmc7XG4gIHB1YmxpY19rZXk6IHN0cmluZztcbiAgc2VjcmV0X2tleTogc3RyaW5nO1xuICBtYWNoaW5lX25hbWU6IHN0cmluZztcblxuICBjd2Q6IHN0cmluZztcblxuICBfY29uZjogYW55O1xuXG4gIENsaWVudDogYW55O1xuICBwbTJfY29uZmlndXJhdGlvbjogYW55O1xuICBnbF9pbnRlcmFjdF9pbmZvczogYW55O1xuICBnbF9pc19rbV9saW5rZWQ6IGJvb2xlYW47XG5cbiAgZ2xfcmV0cnk6IG51bWJlcjtcblxuICAgIHN0YXJ0X3RpbWVyOiBEYXRlO1xuICBraWxsQWdlbnQ6IChjYikgPT4gdm9pZDtcbiAgbGF1bmNoQWxsOiAoZGF0YSwgY2IpID0+IHZvaWQ7XG4gIGdldFZlcnNpb246IChlcnIsIHJlcz8pID0+IHZvaWQ7XG4gIGR1bXA6IChlcnIpID0+IHZvaWQ7XG4gIHJlc3VycmVjdDogKGVycj8pID0+IHZvaWQ7XG5cbiAgc3RyZWFtTG9nczogKGEsIGIsIGMsIGQsIGUpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IgKG9wdHM/KSB7XG4gICAgaWYgKCFvcHRzKSBvcHRzID0ge307XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdGhpcy5kYWVtb25fbW9kZSA9IHR5cGVvZihvcHRzLmRhZW1vbl9tb2RlKSA9PSAndW5kZWZpbmVkJyA/IHRydWUgOiBvcHRzLmRhZW1vbl9tb2RlO1xuICAgIHRoaXMucG0yX2hvbWUgPSBjb25mLlBNMl9ST09UX1BBVEg7XG4gICAgdGhpcy5wdWJsaWNfa2V5ID0gY29uZi5QVUJMSUNfS0VZIHx8IG9wdHMucHVibGljX2tleSB8fCBudWxsO1xuICAgIHRoaXMuc2VjcmV0X2tleSA9IGNvbmYuU0VDUkVUX0tFWSB8fCBvcHRzLnNlY3JldF9rZXkgfHwgbnVsbDtcbiAgICB0aGlzLm1hY2hpbmVfbmFtZSA9IGNvbmYuTUFDSElORV9OQU1FIHx8IG9wdHMubWFjaGluZV9uYW1lIHx8IG51bGxcblxuICAgIC8qKlxuICAgICAqIENXRCByZXNvbHV0aW9uXG4gICAgICovXG4gICAgdGhpcy5jd2QgPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGlmIChvcHRzLmN3ZCkge1xuICAgICAgdGhpcy5jd2QgPSBwYXRoLnJlc29sdmUob3B0cy5jd2QpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBNMiBIT01FIHJlc29sdXRpb25cbiAgICAgKi9cbiAgICBpZiAob3B0cy5wbTJfaG9tZSAmJiBvcHRzLmluZGVwZW5kZW50ID09IHRydWUpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBjYW5ub3Qgc2V0IGEgcG0yX2hvbWUgYW5kIGluZGVwZW5kZW50IGluc3RhbmNlIGluIHNhbWUgdGltZScpO1xuXG4gICAgaWYgKG9wdHMucG0yX2hvbWUpIHtcbiAgICAgIC8vIE92ZXJyaWRlIGRlZmF1bHQgY29uZiBmaWxlXG4gICAgICB0aGlzLnBtMl9ob21lID0gb3B0cy5wbTJfaG9tZTtcbiAgICAgIGNvbmYgPSB1dGlsLmluaGVyaXRzKGNvbmYsIHBhdGhfc3RydWN0dXJlKHRoaXMucG0yX2hvbWUpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAob3B0cy5pbmRlcGVuZGVudCA9PSB0cnVlICYmIGNvbmYuSVNfV0lORE9XUyA9PT0gZmFsc2UpIHtcbiAgICAgIC8vIENyZWF0ZSBhbiB1bmlxdWUgcG0yIGluc3RhbmNlXG4gICAgICB2YXIgcmFuZG9tX2ZpbGUgPSBjcnlwdG8ucmFuZG9tQnl0ZXMoOCkudG9TdHJpbmcoJ2hleCcpO1xuICAgICAgdGhpcy5wbTJfaG9tZSA9IHBhdGguam9pbignL3RtcCcsIHJhbmRvbV9maWxlKTtcblxuICAgICAgLy8gSWYgd2UgZG9udCBleHBsaWNpdGx5IHRlbGwgdG8gaGF2ZSBhIGRhZW1vblxuICAgICAgLy8gSXQgd2lsbCBnbyBhcyBpbiBwcm9jXG4gICAgICBpZiAodHlwZW9mKG9wdHMuZGFlbW9uX21vZGUpID09ICd1bmRlZmluZWQnKVxuICAgICAgICB0aGlzLmRhZW1vbl9tb2RlID0gZmFsc2U7XG4gICAgICBjb25mID0gdXRpbC5pbmhlcml0cyhjb25mLCBwYXRoX3N0cnVjdHVyZSh0aGlzLnBtMl9ob21lKSk7XG4gICAgfVxuXG4gICAgdGhpcy5fY29uZiA9IGNvbmY7XG5cbiAgICBpZiAoY29uZi5JU19XSU5ET1dTKSB7XG4gICAgICAvLyBXZWlyZCBmaXgsIG1heSBuZWVkIHRvIGJlIGRyb3BwZWRcbiAgICAgIC8vIEB0b2RvIHdpbmRvd3MgY29ubm9pc3NldXIgZG91YmxlIGNoZWNrXG4gICAgICAvLyBUT0RPOiBwbGVhc2UgY2hlY2sgdGhpc1xuICAgICAgLy8gaWYgKHByb2Nlc3Muc3Rkb3V0Ll9oYW5kbGUgJiYgcHJvY2Vzcy5zdGRvdXQuX2hhbmRsZS5zZXRCbG9ja2luZylcbiAgICAgIC8vICAgcHJvY2Vzcy5zdGRvdXQuX2hhbmRsZS5zZXRCbG9ja2luZyh0cnVlKTtcbiAgICB9XG5cbiAgICB0aGlzLkNsaWVudCA9IG5ldyBDbGllbnQoe1xuICAgICAgcG0yX2hvbWU6IHRoYXQucG0yX2hvbWUsXG4gICAgICBjb25mOiB0aGlzLl9jb25mLFxuICAgICAgc2VjcmV0X2tleTogdGhpcy5zZWNyZXRfa2V5LFxuICAgICAgcHVibGljX2tleTogdGhpcy5wdWJsaWNfa2V5LFxuICAgICAgZGFlbW9uX21vZGU6IHRoaXMuZGFlbW9uX21vZGUsXG4gICAgICBtYWNoaW5lX25hbWU6IHRoaXMubWFjaGluZV9uYW1lXG4gICAgfSk7XG5cbiAgICB0aGlzLnBtMl9jb25maWd1cmF0aW9uID0gQ29uZmlndXJhdGlvbi5nZXRTeW5jKCdwbTInKSB8fCB7fVxuXG4gICAgdGhpcy5nbF9pbnRlcmFjdF9pbmZvcyA9IG51bGw7XG4gICAgdGhpcy5nbF9pc19rbV9saW5rZWQgPSBmYWxzZTtcblxuICAgIHRyeSB7XG4gICAgICB2YXIgcGlkOiBhbnkgPSBmcy5yZWFkRmlsZVN5bmMoY29uZi5JTlRFUkFDVE9SX1BJRF9QQVRIKTtcbiAgICAgIHBpZCA9IHBhcnNlSW50KHBpZC50b1N0cmluZygpLnRyaW0oKSk7XG4gICAgICBwcm9jZXNzLmtpbGwocGlkLCAwKTtcbiAgICAgIHRoYXQuZ2xfaXNfa21fbGlua2VkID0gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGF0LmdsX2lzX2ttX2xpbmtlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEZvciB0ZXN0aW5nIHB1cnBvc2VzXG4gICAgaWYgKHRoaXMuc2VjcmV0X2tleSAmJiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PSAnbG9jYWxfdGVzdCcpXG4gICAgICB0aGF0LmdsX2lzX2ttX2xpbmtlZCA9IHRydWU7XG5cbiAgICBLTURhZW1vbi5waW5nKHRoaXMuX2NvbmYsIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICBpZiAoIWVyciAmJiByZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgZnMucmVhZEZpbGUoY29uZi5JTlRFUkFDVElPTl9DT05GLCAoZXJyLCBfY29uZikgPT4ge1xuICAgICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB0aGF0LmdsX2ludGVyYWN0X2luZm9zID0gSlNPTi5wYXJzZShfY29uZi50b1N0cmluZygpKVxuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhhdC5nbF9pbnRlcmFjdF9pbmZvcyA9IGpzb241LnBhcnNlKF9jb25mLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICAgICAgICAgICAgICB0aGF0LmdsX2ludGVyYWN0X2luZm9zID0gbnVsbFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pXG5cbiAgICB0aGlzLmdsX3JldHJ5ID0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25uZWN0IHRvIFBNMlxuICAgKiBDYWxsaW5nIHRoaXMgY29tbWFuZCBpcyBub3cgb3B0aW9uYWxcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGJhY2sgb25jZSBwbTIgaXMgcmVhZHkgZm9yIGNvbW1hbmRzXG4gICAqL1xuICBjb25uZWN0IChub0RhZW1vbiwgY2I/KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoaXMuc3RhcnRfdGltZXIgPSBuZXcgRGF0ZSgpO1xuXG4gICAgaWYgKHR5cGVvZihjYikgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNiID0gbm9EYWVtb247XG4gICAgICBub0RhZW1vbiA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAobm9EYWVtb24gPT09IHRydWUpIHtcbiAgICAgIC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHkgd2l0aCBQTTIgMS54XG4gICAgICB0aGlzLkNsaWVudC5kYWVtb25fbW9kZSA9IGZhbHNlO1xuICAgICAgdGhpcy5kYWVtb25fbW9kZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuQ2xpZW50LnN0YXJ0KGZ1bmN0aW9uKGVyciwgbWV0YSkge1xuICAgICAgaWYgKGVycilcbiAgICAgICAgcmV0dXJuIGNiKGVycik7XG5cbiAgICAgIGlmIChtZXRhLm5ld19wbTJfaW5zdGFuY2UgPT0gZmFsc2UgJiYgdGhhdC5kYWVtb25fbW9kZSA9PT0gdHJ1ZSlcbiAgICAgICAgcmV0dXJuIGNiKGVyciwgbWV0YSk7XG5cbiAgICAgIC8vIElmIG5ldyBwbTIgaW5zdGFuY2UgaGFzIGJlZW4gcG9wcGVkXG4gICAgICAvLyBMYXVjaCBhbGwgbW9kdWxlc1xuICAgICAgdGhhdC5sYXVuY2hBbGwodGhhdCwgZnVuY3Rpb24oZXJyX21vZCkge1xuICAgICAgICByZXR1cm4gY2IoZXJyLCBtZXRhKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWZ1bGwgd2hlbiBjdXN0b20gUE0yIGNyZWF0ZWQgd2l0aCBpbmRlcGVuZGVudCBmbGFnIHNldCB0byB0cnVlXG4gICAqIFRoaXMgd2lsbCBjbGVhbnVwIHRoZSBuZXdseSBjcmVhdGVkIGluc3RhbmNlXG4gICAqIGJ5IHJlbW92aW5nIGZvbGRlciwga2lsbGluZyBQTTIgYW5kIHNvIG9uXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIGNhbGxiYWNrIG9uY2UgY2xlYW51cCBpcyBzdWNjZXNzZnVsbFxuICAgKi9cbiAgZGVzdHJveSAoY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBkZWJ1ZygnS2lsbGluZyBhbmQgZGVsZXRpbmcgY3VycmVudCBkZWFtb24nKTtcblxuICAgIHRoaXMua2lsbERhZW1vbihmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjbWQgPSAncm0gLXJmICcgKyB0aGF0LnBtMl9ob21lO1xuICAgICAgdmFyIHRlc3RfcGF0aCA9IHBhdGguam9pbih0aGF0LnBtMl9ob21lLCAnbW9kdWxlX2NvbmYuanNvbicpO1xuICAgICAgdmFyIHRlc3RfcGF0aF8yID0gcGF0aC5qb2luKHRoYXQucG0yX2hvbWUsICdwbTIucGlkJyk7XG5cbiAgICAgIGlmICh0aGF0LnBtMl9ob21lLmluZGV4T2YoJy5wbTInKSA+IC0xKVxuICAgICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdEZXN0cm95IGlzIG5vdCBhIGFsbG93ZWQgbWV0aG9kIG9uIC5wbTInKSk7XG5cbiAgICAgIGZzLmFjY2Vzcyh0ZXN0X3BhdGgsIGZzLmNvbnN0YW50cy5SX09LLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgIGRlYnVnKCdEZWxldGluZyB0ZW1wb3JhcnkgZm9sZGVyICVzJywgdGhhdC5wbTJfaG9tZSk7XG4gICAgICAgIHNleGVjKGNtZCwgY2IpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGlzY29ubmVjdCBmcm9tIFBNMiBpbnN0YW5jZVxuICAgKiBUaGlzIHdpbGwgYWxsb3cgeW91ciBzb2Z0d2FyZSB0byBleGl0IGJ5IGl0c2VsZlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdIG9wdGlvbmFsIGNhbGxiYWNrIG9uY2UgY29ubmVjdGlvbiBjbG9zZWRcbiAgICovXG4gIGRpc2Nvbm5lY3QgKGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICghY2IpIGNiID0gZnVuY3Rpb24oKSB7fTtcblxuICAgIHRoaXMuQ2xpZW50LmNsb3NlKGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgLy8gZGVidWcoJ1RoZSBzZXNzaW9uIGxhc3RlZCAlZHMnLCAobmV3IERhdGUoKSAtIHRoYXQuc3RhcnRfdGltZXIpIC8gMTAwMCk7XG4gICAgICByZXR1cm4gY2IoZXJyLCBkYXRhKTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQWxpYXMgb24gZGlzY29ubmVjdFxuICAgKiBAcGFyYW0gY2JcbiAgICovXG4gIGNsb3NlIChjYikge1xuICAgIHRoaXMuZGlzY29ubmVjdChjYik7XG4gIH1cblxuICAvKipcbiAgICogTGF1bmNoIG1vZHVsZXNcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGJhY2sgb25jZSBwbTIgaGFzIGxhdW5jaGVkIG1vZHVsZXNcbiAgICovXG4gIGxhdW5jaE1vZHVsZXMgKGNiKSB7XG4gICAgdGhpcy5sYXVuY2hBbGwodGhpcywgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZSBidXMgYWxsb3dpbmcgdG8gcmV0cmlldmUgdmFyaW91cyBwcm9jZXNzIGV2ZW50XG4gICAqIGxpa2UgbG9ncywgcmVzdGFydHMsIHJlbG9hZHNcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGJhY2sgY2FsbGVkIHdpdGggMXN0IHBhcmFtIGVyciBhbmQgMm5iIHBhcmFtIHRoZSBidXNcbiAgICovXG4gIGxhdW5jaEJ1cyAoY2IpIHtcbiAgICB0aGlzLkNsaWVudC5sYXVuY2hCdXMoY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4aXQgbWV0aG9kcyBmb3IgQVBJXG4gICAqIEBwYXJhbSB7SW50ZWdlcn0gY29kZSBleGl0IGNvZGUgZm9yIHRlcm1pbmFsXG4gICAqL1xuICBleGl0Q2xpIChjb2RlKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgLy8gRG8gbm90aGluZyBpZiBQTTIgY2FsbGVkIHByb2dyYW1tYXRpY2FsbHkgKGFsc28gaW4gc3BlZWRsaXN0KVxuICAgIGlmIChjb25mLlBNMl9QUk9HUkFNTUFUSUMgJiYgcHJvY2Vzcy5lbnYuUE0yX1VTQUdFICE9ICdDTEknKSByZXR1cm4gZmFsc2U7XG5cbiAgICBLTURhZW1vbi5kaXNjb25uZWN0UlBDKGZ1bmN0aW9uKCkge1xuICAgICAgdGhhdC5DbGllbnQuY2xvc2UoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvZGUgPSBjb2RlIHx8IDA7XG4gICAgICAgIC8vIFNhZmUgZXhpdHMgcHJvY2VzcyBhZnRlciBhbGwgc3RyZWFtcyBhcmUgZHJhaW5lZC5cbiAgICAgICAgLy8gZmlsZSBkZXNjcmlwdG9yIGZsYWcuXG4gICAgICAgIHZhciBmZHMgPSAwO1xuICAgICAgICAvLyBleGl0cyBwcm9jZXNzIHdoZW4gc3Rkb3V0ICgxKSBhbmQgc2R0ZXJyKDIpIGFyZSBib3RoIGRyYWluZWQuXG4gICAgICAgIGZ1bmN0aW9uIHRyeVRvRXhpdCgpIHtcbiAgICAgICAgICBpZiAoKGZkcyAmIDEpICYmIChmZHMgJiAyKSkge1xuICAgICAgICAgICAgLy8gZGVidWcoJ1RoaXMgY29tbWFuZCB0b29rICVkcyB0byBleGVjdXRlJywgKG5ldyBEYXRlKCkgLSB0aGF0LnN0YXJ0X3RpbWVyKSAvIDEwMDApO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KGNvZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIFtwcm9jZXNzLnN0ZG91dCwgcHJvY2Vzcy5zdGRlcnJdLmZvckVhY2goZnVuY3Rpb24oc3RkKSB7XG4gICAgICAgICAgdmFyIGZkID0gc3RkLmZkO1xuICAgICAgICAgIGlmICghc3RkLmJ1ZmZlclNpemUpIHtcbiAgICAgICAgICAgIC8vIGJ1ZmZlclNpemUgZXF1YWxzIDAgbWVhbnMgY3VycmVudCBzdHJlYW0gaXMgZHJhaW5lZC5cbiAgICAgICAgICAgIGZkcyA9IGZkcyB8IGZkO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBlbmRzIG5vdGhpbmcgdG8gdGhlIHN0ZCBxdWV1ZSwgYnV0IHdpbGwgdHJpZ2dlciBgdHJ5VG9FeGl0YCBldmVudCBvbiBgZHJhaW5gLlxuICAgICAgICAgICAgc3RkLndyaXRlICYmIHN0ZC53cml0ZSgnJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGZkcyA9IGZkcyB8IGZkO1xuICAgICAgICAgICAgICB0cnlUb0V4aXQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBEb2VzIG5vdCB3cml0ZSBhbnl0aGluZyBtb3JlLlxuICAgICAgICAgIGRlbGV0ZSBzdGQud3JpdGU7XG4gICAgICAgIH0pO1xuICAgICAgICB0cnlUb0V4aXQoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEFwcGxpY2F0aW9uIG1hbmFnZW1lbnQgLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAvKipcbiAgICogU3RhcnQgYSBmaWxlIG9yIGpzb24gd2l0aCBjb25maWd1cmF0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fHxTdHJpbmd9IGNtZCBzY3JpcHQgdG8gc3RhcnQgb3IganNvblxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBjYWxsZWQgd2hlbiBhcHBsaWNhdGlvbiBoYXMgYmVlbiBzdGFydGVkXG4gICAqL1xuICBzdGFydCAoY21kLCBvcHRzLCBjYikge1xuICAgIGlmICh0eXBlb2Yob3B0cykgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjYiA9IG9wdHM7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIGlmICghb3B0cykgb3B0cyA9IHt9O1xuXG4gICAgaWYgKHNlbXZlci5sdChwcm9jZXNzLnZlcnNpb24sICc2LjAuMCcpKSB7XG4gICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHX1dBUk5JTkcgKyAnTm9kZSA0IGlzIGRlcHJlY2F0ZWQsIHBsZWFzZSB1cGdyYWRlIHRvIHVzZSBwbTIgdG8gaGF2ZSBhbGwgZmVhdHVyZXMnKTtcbiAgICB9XG5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHV0aWwuaXNBcnJheShvcHRzLndhdGNoKSAmJiBvcHRzLndhdGNoLmxlbmd0aCA9PT0gMClcbiAgICAgIG9wdHMud2F0Y2ggPSAob3B0cy5yYXdBcmdzID8gISF+b3B0cy5yYXdBcmdzLmluZGV4T2YoJy0td2F0Y2gnKSA6ICEhfnByb2Nlc3MuYXJndi5pbmRleE9mKCctLXdhdGNoJykpIHx8IGZhbHNlO1xuXG4gICAgaWYgKENvbW1vbi5pc0NvbmZpZ0ZpbGUoY21kKSB8fCAodHlwZW9mKGNtZCkgPT09ICdvYmplY3QnKSkge1xuICAgICAgdGhhdC5fc3RhcnRKc29uKGNtZCwgb3B0cywgJ3Jlc3RhcnRQcm9jZXNzSWQnLCAoZXJyLCBwcm9jcykgPT4ge1xuICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIsIHByb2NzKSA6IHRoaXMuc3BlZWRMaXN0KClcbiAgICAgIH0pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhhdC5fc3RhcnRTY3JpcHQoY21kLCBvcHRzLCAoZXJyLCBwcm9jcykgPT4ge1xuICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIsIHByb2NzKSA6IHRoaXMuc3BlZWRMaXN0KDApXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCBwcm9jZXNzIGNvdW50ZXJzXG4gICAqXG4gICAqIEBtZXRob2QgcmVzZXRNZXRhUHJvY2Vzc1xuICAgKi9cbiAgcmVzZXQgKHByb2Nlc3NfbmFtZSwgY2I/KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0lkcyhpZHMsIGNiKSB7XG4gICAgICBlYWNoTGltaXQoaWRzLCBjb25mLkNPTkNVUlJFTlRfQUNUSU9OUywgZnVuY3Rpb24oaWQsIG5leHQpIHtcbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgncmVzZXRNZXRhUHJvY2Vzc0lkJywgaWQsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgICAgaWYgKGVycikgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnUmVzZXR0aW5nIG1ldGEgZm9yIHByb2Nlc3MgaWQgJWQnLCBpZCk7XG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKENvbW1vbi5yZXRFcnIoZXJyKSk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOnRydWV9KSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAocHJvY2Vzc19uYW1lID09ICdhbGwnKSB7XG4gICAgICB0aGF0LkNsaWVudC5nZXRBbGxQcm9jZXNzSWQoZnVuY3Rpb24oZXJyLCBpZHMpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9jZXNzSWRzKGlkcywgY2IpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGlzTmFOKHByb2Nlc3NfbmFtZSkpIHtcbiAgICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZShwcm9jZXNzX25hbWUsIGZ1bmN0aW9uKGVyciwgaWRzKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKCdVbmtub3duIHByb2Nlc3MgbmFtZScpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcignVW5rbm93biBwcm9jZXNzIG5hbWUnKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvY2Vzc0lkcyhpZHMsIGNiKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcm9jZXNzSWRzKFtwcm9jZXNzX25hbWVdLCBjYik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBkYWVtb25pemVkIFBNMiBEYWVtb25cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGJhY2sgd2hlbiBwbTIgaGFzIGJlZW4gdXBncmFkZWRcbiAgICovXG4gIHVwZGF0ZSAoY2I/KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgQ29tbW9uLnByaW50T3V0KCdCZSBzdXJlIHRvIGhhdmUgdGhlIGxhdGVzdCB2ZXJzaW9uIGJ5IGRvaW5nIGBucG0gaW5zdGFsbCBwbTJAbGF0ZXN0IC1nYCBiZWZvcmUgZG9pbmcgdGhpcyBwcm9jZWR1cmUuJyk7XG5cbiAgICAvLyBEdW1wIFBNMiBwcm9jZXNzZXNcbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdub3RpZnlLaWxsUE0yJywge30sIGZ1bmN0aW9uKCkge30pO1xuXG4gICAgdGhhdC5nZXRWZXJzaW9uKGZ1bmN0aW9uKGVyciwgbmV3X3ZlcnNpb24pIHtcbiAgICAgIC8vIElmIG5vdCBsaW5rZWQgdG8gUE0yIHBsdXMsIGFuZCB1cGRhdGUgUE0yIHRvIGxhdGVzdCwgZGlzcGxheSBtb3RkLnVwZGF0ZVxuICAgICAgaWYgKCF0aGF0LmdsX2lzX2ttX2xpbmtlZCAmJiAhZXJyICYmIChwa2cudmVyc2lvbiAhPSBuZXdfdmVyc2lvbikpIHtcbiAgICAgICAgdmFyIGR0ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsIHRoYXQuX2NvbmYuUE0yX1VQREFURSkpO1xuICAgICAgICBjb25zb2xlLmxvZyhkdC50b1N0cmluZygpKTtcbiAgICAgIH1cblxuICAgICAgdGhhdC5kdW1wKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBkZWJ1ZygnRHVtcGluZyBzdWNjZXNzZnVsbCcsIGVycik7XG4gICAgICAgIHRoYXQua2lsbERhZW1vbihmdW5jdGlvbigpIHtcbiAgICAgICAgICBkZWJ1ZygnLS0tLS0tLS0tLS0tLS0tLS0tIEV2ZXJ5dGhpbmcga2lsbGVkJywgYXJndW1lbnRzKTtcbiAgICAgICAgICB0aGF0LkNsaWVudC5sYXVuY2hEYWVtb24oe2ludGVyYWN0b3I6ZmFsc2V9LCBmdW5jdGlvbihlcnIsIGNoaWxkKSB7XG4gICAgICAgICAgICB0aGF0LkNsaWVudC5sYXVuY2hSUEMoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHRoYXQucmVzdXJyZWN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjaGFsay5ibHVlLmJvbGQoJz4+Pj4+Pj4+Pj4gUE0yIHVwZGF0ZWQnKSk7XG4gICAgICAgICAgICAgICAgdGhhdC5sYXVuY2hBbGwodGhhdCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICBLTURhZW1vbi5sYXVuY2hBbmRJbnRlcmFjdCh0aGF0Ll9jb25mLCB7XG4gICAgICAgICAgICAgICAgICAgIHBtMl92ZXJzaW9uOiBwa2cudmVyc2lvblxuICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyLCBkYXRhLCBpbnRlcmFjdG9yX3Byb2MpIHtcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwge3N1Y2Nlc3M6dHJ1ZX0pIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICAgICAgICAgICAgICAgIH0sIDI1MClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWxvYWQgYW4gYXBwbGljYXRpb25cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHByb2Nlc3NfbmFtZSBBcHBsaWNhdGlvbiBOYW1lIG9yIEFsbFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAgICAgICAgIE9wdGlvbnNcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgICAgICAgICBDYWxsYmFja1xuICAgKi9cbiAgcmVsb2FkIChwcm9jZXNzX25hbWUsIG9wdHMsIGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICh0eXBlb2Yob3B0cykgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjYiA9IG9wdHM7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuXG4gICAgdmFyIGRlbGF5ID0gQ29tbW9uLmxvY2tSZWxvYWQoKTtcbiAgICBpZiAoZGVsYXkgPiAwICYmIG9wdHMuZm9yY2UgIT0gdHJ1ZSkge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdSZWxvYWQgYWxyZWFkeSBpbiBwcm9ncmVzcywgcGxlYXNlIHRyeSBhZ2FpbiBpbiAnICsgTWF0aC5mbG9vcigoY29uZi5SRUxPQURfTE9DS19USU1FT1VUIC0gZGVsYXkpIC8gMTAwMCkgKyAnIHNlY29uZHMgb3IgdXNlIC0tZm9yY2UnKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcignUmVsb2FkIGluIHByb2dyZXNzJykpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgfVxuXG4gICAgaWYgKENvbW1vbi5pc0NvbmZpZ0ZpbGUocHJvY2Vzc19uYW1lKSlcbiAgICAgIHRoYXQuX3N0YXJ0SnNvbihwcm9jZXNzX25hbWUsIG9wdHMsICdyZWxvYWRQcm9jZXNzSWQnLCBmdW5jdGlvbihlcnIsIGFwcHMpIHtcbiAgICAgICAgQ29tbW9uLnVubG9ja1JlbG9hZCgpO1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVycikgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgYXBwcykgOiB0aGF0LmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgfSk7XG4gICAgZWxzZSB7XG4gICAgICBpZiAob3B0cyAmJiBvcHRzLmVudikge1xuICAgICAgICB2YXIgZXJyID0gJ1VzaW5nIC0tZW52IFtlbnZdIHdpdGhvdXQgcGFzc2luZyB0aGUgZWNvc3lzdGVtLmNvbmZpZy5qcyBkb2VzIG5vdCB3b3JrJ1xuICAgICAgICBDb21tb24uZXJyKGVycik7XG4gICAgICAgIENvbW1vbi51bmxvY2tSZWxvYWQoKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0cyAmJiAhb3B0cy51cGRhdGVFbnYpXG4gICAgICAgIENvbW1vbi5wcmludE91dChJTU1VVEFCTEVfTVNHKTtcblxuICAgICAgdGhhdC5fb3BlcmF0ZSgncmVsb2FkUHJvY2Vzc0lkJywgcHJvY2Vzc19uYW1lLCBvcHRzLCBmdW5jdGlvbihlcnIsIGFwcHMpIHtcbiAgICAgICAgQ29tbW9uLnVubG9ja1JlbG9hZCgpO1xuXG4gICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBhcHBzKSA6IHRoYXQuZXhpdENsaShjb25mLlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzdGFydCBwcm9jZXNzXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjbWQgICBBcHBsaWNhdGlvbiBOYW1lIC8gUHJvY2VzcyBpZCAvIEpTT04gYXBwbGljYXRpb24gZmlsZSAvICdhbGwnXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzICBFeHRyYSBvcHRpb25zIHRvIGJlIHVwZGF0ZWRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgIENhbGxiYWNrXG4gICAqL1xuICByZXN0YXJ0IChjbWQsIG9wdHMsIGNiKSB7XG4gICAgaWYgKHR5cGVvZihvcHRzKSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNiID0gb3B0cztcbiAgICAgIG9wdHMgPSB7fTtcbiAgICB9XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZihjbWQpID09PSAnbnVtYmVyJylcbiAgICAgIGNtZCA9IGNtZC50b1N0cmluZygpO1xuXG4gICAgaWYgKGNtZCA9PSBcIi1cIikge1xuICAgICAgLy8gUmVzdGFydCBmcm9tIFBJUEVEIEpTT05cbiAgICAgIHByb2Nlc3Muc3RkaW4ucmVzdW1lKCk7XG4gICAgICBwcm9jZXNzLnN0ZGluLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgICBwcm9jZXNzLnN0ZGluLm9uKCdkYXRhJywgZnVuY3Rpb24gKHBhcmFtKSB7XG4gICAgICAgIHByb2Nlc3Muc3RkaW4ucGF1c2UoKTtcbiAgICAgICAgdGhhdC5hY3Rpb25Gcm9tSnNvbigncmVzdGFydFByb2Nlc3NJZCcsIHBhcmFtLCBvcHRzLCAncGlwZScsIGNiKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChDb21tb24uaXNDb25maWdGaWxlKGNtZCkgfHwgdHlwZW9mKGNtZCkgPT09ICdvYmplY3QnKVxuICAgICAgdGhhdC5fc3RhcnRKc29uKGNtZCwgb3B0cywgJ3Jlc3RhcnRQcm9jZXNzSWQnLCBjYik7XG4gICAgZWxzZSB7XG4gICAgICBpZiAob3B0cyAmJiBvcHRzLmVudikge1xuICAgICAgICB2YXIgZXJyID0gJ1VzaW5nIC0tZW52IFtlbnZdIHdpdGhvdXQgcGFzc2luZyB0aGUgZWNvc3lzdGVtLmNvbmZpZy5qcyBkb2VzIG5vdCB3b3JrJ1xuICAgICAgICBDb21tb24uZXJyKGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRzICYmICFvcHRzLnVwZGF0ZUVudilcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KElNTVVUQUJMRV9NU0cpO1xuICAgICAgdGhhdC5fb3BlcmF0ZSgncmVzdGFydFByb2Nlc3NJZCcsIGNtZCwgb3B0cywgY2IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgcHJvY2Vzc1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvY2Vzc19uYW1lIEFwcGxpY2F0aW9uIE5hbWUgLyBQcm9jZXNzIGlkIC8gQXBwbGljYXRpb24gZmlsZSAvICdhbGwnXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIENhbGxiYWNrXG4gICAqL1xuICBkZWxldGUgKHByb2Nlc3NfbmFtZSwganNvblZpYSwgY2I/KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZihqc29uVmlhKSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjYiA9IGpzb25WaWE7XG4gICAgICBqc29uVmlhID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mKHByb2Nlc3NfbmFtZSkgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgIHByb2Nlc3NfbmFtZSA9IHByb2Nlc3NfbmFtZS50b1N0cmluZygpO1xuICAgIH1cblxuICAgIGlmIChqc29uVmlhID09ICdwaXBlJylcbiAgICAgIHJldHVybiB0aGF0LmFjdGlvbkZyb21Kc29uKCdkZWxldGVQcm9jZXNzSWQnLCBwcm9jZXNzX25hbWUsIGNvbW1hbmRlciwgJ3BpcGUnLCAoZXJyLCBwcm9jcykgPT4ge1xuICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIsIHByb2NzKSA6IHRoaXMuc3BlZWRMaXN0KClcbiAgICAgIH0pO1xuICAgIGlmIChDb21tb24uaXNDb25maWdGaWxlKHByb2Nlc3NfbmFtZSkpXG4gICAgICByZXR1cm4gdGhhdC5hY3Rpb25Gcm9tSnNvbignZGVsZXRlUHJvY2Vzc0lkJywgcHJvY2Vzc19uYW1lLCBjb21tYW5kZXIsICdmaWxlJywgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgpXG4gICAgICB9KTtcbiAgICBlbHNlIHtcbiAgICAgIHRoYXQuX29wZXJhdGUoJ2RlbGV0ZVByb2Nlc3NJZCcsIHByb2Nlc3NfbmFtZSwgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgpXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3RvcCBwcm9jZXNzXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9jZXNzX25hbWUgQXBwbGljYXRpb24gTmFtZSAvIFByb2Nlc3MgaWQgLyBBcHBsaWNhdGlvbiBmaWxlIC8gJ2FsbCdcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgQ2FsbGJhY2tcbiAgICovXG4gIHN0b3AgKHByb2Nlc3NfbmFtZSwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mKHByb2Nlc3NfbmFtZSkgPT09ICdudW1iZXInKVxuICAgICAgcHJvY2Vzc19uYW1lID0gcHJvY2Vzc19uYW1lLnRvU3RyaW5nKCk7XG5cbiAgICBpZiAocHJvY2Vzc19uYW1lID09IFwiLVwiKSB7XG4gICAgICBwcm9jZXNzLnN0ZGluLnJlc3VtZSgpO1xuICAgICAgcHJvY2Vzcy5zdGRpbi5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgICAgcHJvY2Vzcy5zdGRpbi5vbignZGF0YScsIGZ1bmN0aW9uIChwYXJhbSkge1xuICAgICAgICBwcm9jZXNzLnN0ZGluLnBhdXNlKCk7XG4gICAgICAgIHRoYXQuYWN0aW9uRnJvbUpzb24oJ3N0b3BQcm9jZXNzSWQnLCBwYXJhbSwgY29tbWFuZGVyLCAncGlwZScsIChlcnIsIHByb2NzKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgpXG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAoQ29tbW9uLmlzQ29uZmlnRmlsZShwcm9jZXNzX25hbWUpKVxuICAgICAgdGhhdC5hY3Rpb25Gcm9tSnNvbignc3RvcFByb2Nlc3NJZCcsIHByb2Nlc3NfbmFtZSwgY29tbWFuZGVyLCAnZmlsZScsIChlcnIsIHByb2NzKSA9PiB7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKGVyciwgcHJvY3MpIDogdGhpcy5zcGVlZExpc3QoKVxuICAgICAgfSk7XG4gICAgZWxzZVxuICAgICAgdGhhdC5fb3BlcmF0ZSgnc3RvcFByb2Nlc3NJZCcsIHByb2Nlc3NfbmFtZSwgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgpXG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgbGlzdCBvZiBhbGwgcHJvY2Vzc2VzIG1hbmFnZWRcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgQ2FsbGJhY2tcbiAgICovXG4gIGxpc3QgKG9wdHM/LCBjYj8pIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mKG9wdHMpID09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNiID0gb3B0cztcbiAgICAgIG9wdHMgPSBudWxsO1xuICAgIH1cblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRzICYmIG9wdHMucmF3QXJncyAmJiBvcHRzLnJhd0FyZ3MuaW5kZXhPZignLS13YXRjaCcpID4gLTEpIHtcbiAgICAgICAgZnVuY3Rpb24gc2hvdygpIHtcbiAgICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZSgnXFx4MWJbMkonKTtcbiAgICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZSgnXFx4MWJbMGYnKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTGFzdCByZWZyZXNoOiAnLCBkYXlqcygpLmZvcm1hdCgpKTtcbiAgICAgICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbihlcnIsIGxpc3QpIHtcbiAgICAgICAgICAgIFVYLmxpc3QobGlzdCwgbnVsbCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBzaG93KCk7XG4gICAgICAgIHNldEludGVydmFsKHNob3csIDkwMCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgbGlzdCkgOiB0aGF0LnNwZWVkTGlzdChudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBLaWxsIERhZW1vblxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBDYWxsYmFja1xuICAgKi9cbiAga2lsbERhZW1vbiAoY2IpIHtcbiAgICBwcm9jZXNzLmVudi5QTTJfU1RBVFVTID0gJ3N0b3BwaW5nJ1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnbm90aWZ5S2lsbFBNMicsIHt9LCBmdW5jdGlvbigpIHt9KTtcblxuICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnW3ZdIE1vZHVsZXMgU3RvcHBlZCcpO1xuXG4gICAgdGhhdC5fb3BlcmF0ZSgnZGVsZXRlUHJvY2Vzc0lkJywgJ2FsbCcsIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdbdl0gQWxsIEFwcGxpY2F0aW9ucyBTdG9wcGVkJyk7XG4gICAgICBwcm9jZXNzLmVudi5QTTJfU0lMRU5UID0gJ2ZhbHNlJztcblxuICAgICAgdGhhdC5raWxsQWdlbnQoZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdbdl0gQWdlbnQgU3RvcHBlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhhdC5DbGllbnQua2lsbERhZW1vbihmdW5jdGlvbihlcnIsIHJlcykge1xuICAgICAgICAgIGlmIChlcnIpIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdbdl0gUE0yIERhZW1vbiBTdG9wcGVkJyk7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCByZXMpIDogdGhhdC5leGl0Q2xpKGNvbmYuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0pO1xuICAgIH0pXG4gIH1cblxuICBraWxsIChjYikge1xuICAgIHRoaXMua2lsbERhZW1vbihjYik7XG4gIH1cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gUHJpdmF0ZSBtZXRob2RzIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIC8qKlxuICAgKiBNZXRob2QgdG8gU1RBUlQgLyBSRVNUQVJUIGEgc2NyaXB0XG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzY3JpcHQgc2NyaXB0IG5hbWUgKHdpbGwgYmUgcmVzb2x2ZWQgYWNjb3JkaW5nIHRvIGxvY2F0aW9uKVxuICAgKi9cbiAgX3N0YXJ0U2NyaXB0IChzY3JpcHQsIG9wdHMsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRzID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY2IgPSBvcHRzO1xuICAgICAgb3B0cyA9IHt9O1xuICAgIH1cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAvKipcbiAgICAgKiBDb21tYW5kZXIuanMgdHJpY2tzXG4gICAgICovXG4gICAgdmFyIGFwcF9jb25mOiBhbnkgPSBDb25maWcuZmlsdGVyT3B0aW9ucyhvcHRzKTtcbiAgICB2YXIgYXBwQ29uZiA9IHt9O1xuXG4gICAgaWYgKHR5cGVvZiBhcHBfY29uZi5uYW1lID09ICdmdW5jdGlvbicpXG4gICAgICBkZWxldGUgYXBwX2NvbmYubmFtZTtcblxuICAgIGRlbGV0ZSBhcHBfY29uZi5hcmdzO1xuXG4gICAgLy8gUmV0cmlldmUgYXJndW1lbnRzIHZpYSAtLSA8YXJncz5cbiAgICB2YXIgYXJnc0luZGV4O1xuXG4gICAgaWYgKG9wdHMucmF3QXJncyAmJiAoYXJnc0luZGV4ID0gb3B0cy5yYXdBcmdzLmluZGV4T2YoJy0tJykpID49IDApXG4gICAgICBhcHBfY29uZi5hcmdzID0gb3B0cy5yYXdBcmdzLnNsaWNlKGFyZ3NJbmRleCArIDEpO1xuICAgIGVsc2UgaWYgKG9wdHMuc2NyaXB0QXJncylcbiAgICAgIGFwcF9jb25mLmFyZ3MgPSBvcHRzLnNjcmlwdEFyZ3M7XG5cbiAgICBhcHBfY29uZi5zY3JpcHQgPSBzY3JpcHQ7XG4gICAgaWYoIWFwcF9jb25mLm5hbWVzcGFjZSlcbiAgICAgIGFwcF9jb25mLm5hbWVzcGFjZSA9ICdkZWZhdWx0JztcblxuICAgIGlmICgoYXBwQ29uZiA9IENvbW1vbi52ZXJpZnlDb25mcyhhcHBfY29uZikpIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIENvbW1vbi5lcnIoYXBwQ29uZilcbiAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoYXBwQ29uZikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgfVxuXG4gICAgYXBwX2NvbmYgPSBhcHBDb25mWzBdO1xuXG4gICAgaWYgKG9wdHMud2F0Y2hEZWxheSkge1xuICAgICAgaWYgKHR5cGVvZiBvcHRzLndhdGNoRGVsYXkgPT09IFwic3RyaW5nXCIgJiYgb3B0cy53YXRjaERlbGF5LmluZGV4T2YoXCJtc1wiKSAhPT0gLTEpXG4gICAgICAgIGFwcF9jb25mLndhdGNoX2RlbGF5ID0gcGFyc2VJbnQob3B0cy53YXRjaERlbGF5KTtcbiAgICAgIGVsc2Uge1xuICAgICAgICBhcHBfY29uZi53YXRjaF9kZWxheSA9IHBhcnNlRmxvYXQob3B0cy53YXRjaERlbGF5KSAqIDEwMDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIG1hcyA9IFtdO1xuICAgIGlmKHR5cGVvZiBvcHRzLmV4dCAhPSAndW5kZWZpbmVkJylcbiAgICAgIGhmLm1ha2VfYXZhaWxhYmxlX2V4dGVuc2lvbihvcHRzLCBtYXMpOyAvLyBmb3IgLWUgZmxhZ1xuICAgIG1hcy5sZW5ndGggPiAwID8gYXBwX2NvbmYuaWdub3JlX3dhdGNoID0gbWFzIDogMDtcblxuICAgIC8qKlxuICAgICAqIElmIC13IG9wdGlvbiwgd3JpdGUgY29uZmlndXJhdGlvbiB0byBjb25maWd1cmF0aW9uLmpzb24gZmlsZVxuICAgICAqL1xuICAgIGlmIChhcHBfY29uZi53cml0ZSkge1xuICAgICAgdmFyIGRzdF9wYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuZW52LlBXRCB8fCBwcm9jZXNzLmN3ZCgpLCBhcHBfY29uZi5uYW1lICsgJy1wbTIuanNvbicpO1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdXcml0aW5nIGNvbmZpZ3VyYXRpb24gdG8nLCBjaGFsay5ibHVlKGRzdF9wYXRoKSk7XG4gICAgICAvLyBwcmV0dHkgSlNPTlxuICAgICAgdHJ5IHtcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhkc3RfcGF0aCwgSlNPTi5zdHJpbmdpZnkoYXBwX2NvbmYsIG51bGwsIDIpKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNlcmllcyhbXG4gICAgICByZXN0YXJ0RXhpc3RpbmdQcm9jZXNzTmFtZSxcbiAgICAgIHJlc3RhcnRFeGlzdGluZ05hbWVTcGFjZSxcbiAgICAgIHJlc3RhcnRFeGlzdGluZ1Byb2Nlc3NJZCxcbiAgICAgIHJlc3RhcnRFeGlzdGluZ1Byb2Nlc3NQYXRoT3JTdGFydE5ld1xuICAgIF0sIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKVxuICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG5cbiAgICAgIHZhciByZXQgPSB7fTtcblxuICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKF9kdCkge1xuICAgICAgICBpZiAoX2R0ICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgcmV0ID0gX2R0O1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJldCkgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogSWYgc3RhcnQgPGFwcF9uYW1lPiBzdGFydC9yZXN0YXJ0IGFwcGxpY2F0aW9uXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVzdGFydEV4aXN0aW5nUHJvY2Vzc05hbWUoY2IpIHtcbiAgICAgIGlmICghaXNOYU4oc2NyaXB0KSB8fFxuICAgICAgICAodHlwZW9mIHNjcmlwdCA9PT0gJ3N0cmluZycgJiYgc2NyaXB0LmluZGV4T2YoJy8nKSAhPSAtMSkgfHxcbiAgICAgICAgKHR5cGVvZiBzY3JpcHQgPT09ICdzdHJpbmcnICYmIHBhdGguZXh0bmFtZShzY3JpcHQpICE9PSAnJykpXG4gICAgICAgIHJldHVybiBjYihudWxsKTtcblxuICAgICAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzSWRCeU5hbWUoc2NyaXB0LCBmdW5jdGlvbihlcnIsIGlkcykge1xuICAgICAgICAgIGlmIChlcnIgJiYgY2IpIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgIGlmIChpZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhhdC5fb3BlcmF0ZSgncmVzdGFydFByb2Nlc3NJZCcsIHNjcmlwdCwgb3B0cywgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XG4gICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1Byb2Nlc3Mgc3VjY2Vzc2Z1bGx5IHN0YXJ0ZWQnKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGNiKHRydWUsIGxpc3QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgcmV0dXJuIGNiKG51bGwpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiBzdGFydCA8bmFtZXNwYWNlPiBzdGFydC9yZXN0YXJ0IG5hbWVzcGFjZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlc3RhcnRFeGlzdGluZ05hbWVTcGFjZShjYikge1xuICAgICAgaWYgKCFpc05hTihzY3JpcHQpIHx8XG4gICAgICAgICh0eXBlb2Ygc2NyaXB0ID09PSAnc3RyaW5nJyAmJiBzY3JpcHQuaW5kZXhPZignLycpICE9IC0xKSB8fFxuICAgICAgICAodHlwZW9mIHNjcmlwdCA9PT0gJ3N0cmluZycgJiYgcGF0aC5leHRuYW1lKHNjcmlwdCkgIT09ICcnKSlcbiAgICAgICAgcmV0dXJuIGNiKG51bGwpO1xuXG4gICAgICBpZiAoc2NyaXB0ICE9PSAnYWxsJykge1xuICAgICAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzSWRzQnlOYW1lc3BhY2Uoc2NyaXB0LCBmdW5jdGlvbiAoZXJyLCBpZHMpIHtcbiAgICAgICAgICBpZiAoZXJyICYmIGNiKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgICBpZiAoaWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoYXQuX29wZXJhdGUoJ3Jlc3RhcnRQcm9jZXNzSWQnLCBzY3JpcHQsIG9wdHMsIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnUHJvY2VzcyBzdWNjZXNzZnVsbHkgc3RhcnRlZCcpO1xuICAgICAgICAgICAgICByZXR1cm4gY2IodHJ1ZSwgbGlzdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSByZXR1cm4gY2IobnVsbCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoYXQuX29wZXJhdGUoJ3Jlc3RhcnRQcm9jZXNzSWQnLCAnYWxsJywgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XG4gICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdQcm9jZXNzIHN1Y2Nlc3NmdWxseSBzdGFydGVkJyk7XG4gICAgICAgICAgcmV0dXJuIGNiKHRydWUsIGxpc3QpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXN0YXJ0RXhpc3RpbmdQcm9jZXNzSWQoY2IpIHtcbiAgICAgIGlmIChpc05hTihzY3JpcHQpKSByZXR1cm4gY2IobnVsbCk7XG5cbiAgICAgIHRoYXQuX29wZXJhdGUoJ3Jlc3RhcnRQcm9jZXNzSWQnLCBzY3JpcHQsIG9wdHMsIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdQcm9jZXNzIHN1Y2Nlc3NmdWxseSBzdGFydGVkJyk7XG4gICAgICAgIHJldHVybiBjYih0cnVlLCBsaXN0KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlc3RhcnQgYSBwcm9jZXNzIHdpdGggdGhlIHNhbWUgZnVsbCBwYXRoXG4gICAgICogT3Igc3RhcnQgaXRcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZXN0YXJ0RXhpc3RpbmdQcm9jZXNzUGF0aE9yU3RhcnROZXcoY2IpIHtcbiAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uKGVyciwgcHJvY3MpIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG5cbiAgICAgICAgdmFyIGZ1bGxfcGF0aCA9IHBhdGgucmVzb2x2ZSh0aGF0LmN3ZCwgc2NyaXB0KTtcbiAgICAgICAgdmFyIG1hbmFnZWRfc2NyaXB0ID0gbnVsbDtcblxuICAgICAgICBwcm9jcy5mb3JFYWNoKGZ1bmN0aW9uKHByb2MpIHtcbiAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX2V4ZWNfcGF0aCA9PSBmdWxsX3BhdGggJiZcbiAgICAgICAgICAgICAgcHJvYy5wbTJfZW52Lm5hbWUgPT0gYXBwX2NvbmYubmFtZSlcbiAgICAgICAgICAgIG1hbmFnZWRfc2NyaXB0ID0gcHJvYztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG1hbmFnZWRfc2NyaXB0ICYmXG4gICAgICAgICAgKG1hbmFnZWRfc2NyaXB0LnBtMl9lbnYuc3RhdHVzID09IGNvbmYuU1RPUFBFRF9TVEFUVVMgfHxcbiAgICAgICAgICAgIG1hbmFnZWRfc2NyaXB0LnBtMl9lbnYuc3RhdHVzID09IGNvbmYuU1RPUFBJTkdfU1RBVFVTIHx8XG4gICAgICAgICAgICBtYW5hZ2VkX3NjcmlwdC5wbTJfZW52LnN0YXR1cyA9PSBjb25mLkVSUk9SRURfU1RBVFVTKSkge1xuICAgICAgICAgIC8vIFJlc3RhcnQgcHJvY2VzcyBpZiBzdG9wcGVkXG4gICAgICAgICAgdmFyIGFwcF9uYW1lID0gbWFuYWdlZF9zY3JpcHQucG0yX2Vudi5uYW1lO1xuXG4gICAgICAgICAgdGhhdC5fb3BlcmF0ZSgncmVzdGFydFByb2Nlc3NJZCcsIGFwcF9uYW1lLCBvcHRzLCBmdW5jdGlvbihlcnIsIGxpc3QpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdQcm9jZXNzIHN1Y2Nlc3NmdWxseSBzdGFydGVkJyk7XG4gICAgICAgICAgICByZXR1cm4gY2IodHJ1ZSwgbGlzdCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG1hbmFnZWRfc2NyaXB0ICYmICFvcHRzLmZvcmNlKSB7XG4gICAgICAgICAgQ29tbW9uLmVycignU2NyaXB0IGFscmVhZHkgbGF1bmNoZWQsIGFkZCAtZiBvcHRpb24gdG8gZm9yY2UgcmUtZXhlY3V0aW9uJyk7XG4gICAgICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcignU2NyaXB0IGFscmVhZHkgbGF1bmNoZWQnKSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzb2x2ZWRfcGF0aHMgPSBudWxsO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzb2x2ZWRfcGF0aHMgPSBDb21tb24ucmVzb2x2ZUFwcEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgY3dkICAgICAgOiB0aGF0LmN3ZCxcbiAgICAgICAgICAgIHBtMl9ob21lIDogdGhhdC5wbTJfaG9tZVxuICAgICAgICAgIH0sIGFwcF9jb25mKTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgQ29tbW9uLmVycihlLm1lc3NhZ2UpO1xuICAgICAgICAgIHJldHVybiBjYihDb21tb24ucmV0RXJyKGUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnU3RhcnRpbmcgJXMgaW4gJXMgKCVkIGluc3RhbmNlJyArIChyZXNvbHZlZF9wYXRocy5pbnN0YW5jZXMgPiAxID8gJ3MnIDogJycpICsgJyknLFxuICAgICAgICAgIHJlc29sdmVkX3BhdGhzLnBtX2V4ZWNfcGF0aCwgcmVzb2x2ZWRfcGF0aHMuZXhlY19tb2RlLCByZXNvbHZlZF9wYXRocy5pbnN0YW5jZXMpO1xuXG4gICAgICAgIGlmICghcmVzb2x2ZWRfcGF0aHMuZW52KSByZXNvbHZlZF9wYXRocy5lbnYgPSB7fTtcblxuICAgICAgICAvLyBTZXQgUE0yIEhPTUUgaW4gY2FzZSBvZiBjaGlsZCBwcm9jZXNzIHVzaW5nIFBNMiBBUElcbiAgICAgICAgcmVzb2x2ZWRfcGF0aHMuZW52WydQTTJfSE9NRSddID0gdGhhdC5wbTJfaG9tZTtcblxuICAgICAgICB2YXIgYWRkaXRpb25hbF9lbnYgPSBNb2R1bGFyaXplci5nZXRBZGRpdGlvbmFsQ29uZihyZXNvbHZlZF9wYXRocy5uYW1lKTtcbiAgICAgICAgdXRpbC5pbmhlcml0cyhyZXNvbHZlZF9wYXRocy5lbnYsIGFkZGl0aW9uYWxfZW52KTtcblxuICAgICAgICAvLyBJcyBLTSBsaW5rZWQ/XG4gICAgICAgIHJlc29sdmVkX3BhdGhzLmttX2xpbmsgPSB0aGF0LmdsX2lzX2ttX2xpbmtlZDtcblxuICAgICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdwcmVwYXJlJywgcmVzb2x2ZWRfcGF0aHMsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnRXJyb3Igd2hpbGUgbGF1bmNoaW5nIGFwcGxpY2F0aW9uJywgZXJyLnN0YWNrIHx8IGVycik7XG4gICAgICAgICAgICByZXR1cm4gY2IoQ29tbW9uLnJldEVycihlcnIpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ0RvbmUuJyk7XG4gICAgICAgICAgcmV0dXJuIGNiKHRydWUsIGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1ldGhvZCB0byBzdGFydC9yZXN0YXJ0L3JlbG9hZCBwcm9jZXNzZXMgZnJvbSBhIEpTT04gZmlsZVxuICAgKiBJdCB3aWxsIHN0YXJ0IGFwcCBub3Qgc3RhcnRlZFxuICAgKiBDYW4gcmVjZWl2ZSBvbmx5IG9wdGlvbiB0byBza2lwIGFwcGxpY2F0aW9uc1xuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3N0YXJ0SnNvbiAoZmlsZSwgb3B0cywgYWN0aW9uLCBwaXBlPywgY2I/KSB7XG4gICAgdmFyIGNvbmZpZzogYW55ICAgICA9IHt9O1xuICAgIHZhciBhcHBDb25mOiBhbnlbXSAgICA9IFtdO1xuICAgIHZhciBzdGF0aWNDb25mID0gW107XG4gICAgdmFyIGRlcGxveUNvbmYgPSB7fTtcbiAgICB2YXIgYXBwc19pbmZvICA9IFtdO1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIC8qKlxuICAgICAqIEdldCBGaWxlIGNvbmZpZ3VyYXRpb25cbiAgICAgKi9cbiAgICBpZiAodHlwZW9mKGNiKSA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mKHBpcGUpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYiA9IHBpcGU7XG4gICAgfVxuICAgIGlmICh0eXBlb2YoZmlsZSkgPT09ICdvYmplY3QnKSB7XG4gICAgICBjb25maWcgPSBmaWxlO1xuICAgIH0gZWxzZSBpZiAocGlwZSA9PT0gJ3BpcGUnKSB7XG4gICAgICBjb25maWcgPSBDb21tb24ucGFyc2VDb25maWcoZmlsZSwgJ3BpcGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGRhdGEgPSBudWxsO1xuXG4gICAgICB2YXIgaXNBYnNvbHV0ZSA9IHBhdGguaXNBYnNvbHV0ZShmaWxlKVxuICAgICAgdmFyIGZpbGVfcGF0aCA9IGlzQWJzb2x1dGUgPyBmaWxlIDogcGF0aC5qb2luKHRoYXQuY3dkLCBmaWxlKTtcblxuICAgICAgZGVidWcoJ1Jlc29sdmVkIGZpbGVwYXRoICVzJywgZmlsZV9wYXRoKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhmaWxlX3BhdGgpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnRmlsZSAnICsgZmlsZSArJyBub3QgZm91bmQnKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uZmlnID0gQ29tbW9uLnBhcnNlQ29uZmlnKGRhdGEsIGZpbGUpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnRmlsZSAnICsgZmlsZSArICcgbWFsZm9ybWF0ZWQnKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBzb21lIG9wdGlvbmFsIGZpZWxkc1xuICAgICAqL1xuICAgIGlmIChjb25maWcuZGVwbG95KVxuICAgICAgZGVwbG95Q29uZiA9IGNvbmZpZy5kZXBsb3k7XG4gICAgaWYgKGNvbmZpZy5zdGF0aWMpXG4gICAgICBzdGF0aWNDb25mID0gY29uZmlnLnN0YXRpYztcbiAgICBpZiAoY29uZmlnLmFwcHMpXG4gICAgICBhcHBDb25mID0gY29uZmlnLmFwcHM7XG4gICAgZWxzZSBpZiAoY29uZmlnLnBtMilcbiAgICAgIGFwcENvbmYgPSBjb25maWcucG0yO1xuICAgIGVsc2VcbiAgICAgIGFwcENvbmYgPSBjb25maWc7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFwcENvbmYpKVxuICAgICAgYXBwQ29uZiA9IFthcHBDb25mXTtcblxuICAgIGlmICgoYXBwQ29uZiA9IENvbW1vbi52ZXJpZnlDb25mcyhhcHBDb25mKSkgaW5zdGFuY2VvZiBFcnJvcilcbiAgICAgIHJldHVybiBjYiA/IGNiKGFwcENvbmYpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG5cbiAgICBwcm9jZXNzLmVudi5QTTJfSlNPTl9QUk9DRVNTSU5HID0gXCJ0cnVlXCI7XG5cbiAgICAvLyBHZXQgQXBwIGxpc3RcbiAgICB2YXIgYXBwc19uYW1lID0gW107XG4gICAgdmFyIHByb2NfbGlzdCA9IHt9O1xuXG4gICAgLy8gQWRkIHN0YXRpY3MgdG8gYXBwc1xuICAgIHN0YXRpY0NvbmYuZm9yRWFjaChmdW5jdGlvbihzZXJ2ZSkge1xuICAgICAgYXBwQ29uZi5wdXNoKHtcbiAgICAgICAgbmFtZTogc2VydmUubmFtZSA/IHNlcnZlLm5hbWUgOiBgc3RhdGljLXBhZ2Utc2VydmVyLSR7c2VydmUucG9ydH1gLFxuICAgICAgICBzY3JpcHQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdBUEknLCAnU2VydmUuanMnKSxcbiAgICAgICAgZW52OiB7XG4gICAgICAgICAgUE0yX1NFUlZFX1BPUlQ6IHNlcnZlLnBvcnQsXG4gICAgICAgICAgUE0yX1NFUlZFX0hPU1Q6IHNlcnZlLmhvc3QsXG4gICAgICAgICAgUE0yX1NFUlZFX1BBVEg6IHNlcnZlLnBhdGgsXG4gICAgICAgICAgUE0yX1NFUlZFX1NQQTogc2VydmUuc3BhLFxuICAgICAgICAgIFBNMl9TRVJWRV9ESVJFQ1RPUlk6IHNlcnZlLmRpcmVjdG9yeSxcbiAgICAgICAgICBQTTJfU0VSVkVfQkFTSUNfQVVUSDogc2VydmUuYmFzaWNfYXV0aCAhPT0gdW5kZWZpbmVkLFxuICAgICAgICAgIFBNMl9TRVJWRV9CQVNJQ19BVVRIX1VTRVJOQU1FOiBzZXJ2ZS5iYXNpY19hdXRoID8gc2VydmUuYmFzaWNfYXV0aC51c2VybmFtZSA6IG51bGwsXG4gICAgICAgICAgUE0yX1NFUlZFX0JBU0lDX0FVVEhfUEFTU1dPUkQ6IHNlcnZlLmJhc2ljX2F1dGggPyBzZXJ2ZS5iYXNpY19hdXRoLnBhc3N3b3JkIDogbnVsbCxcbiAgICAgICAgICBQTTJfU0VSVkVfTU9OSVRPUjogc2VydmUubW9uaXRvclxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIEhlcmUgd2UgcGljayBvbmx5IHRoZSBmaWVsZCB3ZSB3YW50IGZyb20gdGhlIENMSSB3aGVuIHN0YXJ0aW5nIGEgSlNPTlxuICAgIGFwcENvbmYuZm9yRWFjaChmdW5jdGlvbihhcHApIHtcbiAgICAgIGlmICghYXBwLmVudikgeyBhcHAuZW52ID0ge307IH1cbiAgICAgIGFwcC5lbnYuaW8gPSBhcHAuaW87XG4gICAgICAvLyAtLW9ubHkgPGFwcD5cbiAgICAgIGlmIChvcHRzLm9ubHkpIHtcbiAgICAgICAgdmFyIGFwcHMgPSBvcHRzLm9ubHkuc3BsaXQoLyx8IC8pXG4gICAgICAgIGlmIChhcHBzLmluZGV4T2YoYXBwLm5hbWUpID09IC0xKVxuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgLy8gTmFtZXNwYWNlXG4gICAgICBpZiAoIWFwcC5uYW1lc3BhY2UpIHtcbiAgICAgICAgaWYgKG9wdHMubmFtZXNwYWNlKVxuICAgICAgICAgIGFwcC5uYW1lc3BhY2UgPSBvcHRzLm5hbWVzcGFjZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGFwcC5uYW1lc3BhY2UgPSAnZGVmYXVsdCc7XG4gICAgICB9XG4gICAgICAvLyAtLXdhdGNoXG4gICAgICBpZiAoIWFwcC53YXRjaCAmJiBvcHRzLndhdGNoICYmIG9wdHMud2F0Y2ggPT09IHRydWUpXG4gICAgICAgIGFwcC53YXRjaCA9IHRydWU7XG4gICAgICAvLyAtLWlnbm9yZS13YXRjaFxuICAgICAgaWYgKCFhcHAuaWdub3JlX3dhdGNoICYmIG9wdHMuaWdub3JlX3dhdGNoKVxuICAgICAgICBhcHAuaWdub3JlX3dhdGNoID0gb3B0cy5pZ25vcmVfd2F0Y2g7XG4gICAgICBpZiAob3B0cy5pbnN0YWxsX3VybClcbiAgICAgICAgYXBwLmluc3RhbGxfdXJsID0gb3B0cy5pbnN0YWxsX3VybDtcbiAgICAgIC8vIC0taW5zdGFuY2VzIDxuYj5cbiAgICAgIGlmIChvcHRzLmluc3RhbmNlcyAmJiB0eXBlb2Yob3B0cy5pbnN0YW5jZXMpID09PSAnbnVtYmVyJylcbiAgICAgICAgYXBwLmluc3RhbmNlcyA9IG9wdHMuaW5zdGFuY2VzO1xuICAgICAgLy8gLS11aWQgPHVzZXI+XG4gICAgICBpZiAob3B0cy51aWQpXG4gICAgICAgIGFwcC51aWQgPSBvcHRzLnVpZDtcbiAgICAgIC8vIC0tZ2lkIDx1c2VyPlxuICAgICAgaWYgKG9wdHMuZ2lkKVxuICAgICAgICBhcHAuZ2lkID0gb3B0cy5naWQ7XG4gICAgICAvLyBTcGVjaWZpY1xuICAgICAgaWYgKGFwcC5hcHBlbmRfZW52X3RvX25hbWUgJiYgb3B0cy5lbnYpXG4gICAgICAgIGFwcC5uYW1lICs9ICgnLScgKyBvcHRzLmVudik7XG4gICAgICBpZiAob3B0cy5uYW1lX3ByZWZpeCAmJiBhcHAubmFtZS5pbmRleE9mKG9wdHMubmFtZV9wcmVmaXgpID09IC0xKVxuICAgICAgICBhcHAubmFtZSA9IGAke29wdHMubmFtZV9wcmVmaXh9OiR7YXBwLm5hbWV9YFxuXG4gICAgICBhcHAudXNlcm5hbWUgPSBDb21tb24uZ2V0Q3VycmVudFVzZXJuYW1lKCk7XG4gICAgICBhcHBzX25hbWUucHVzaChhcHAubmFtZSk7XG4gICAgfSk7XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbihlcnIsIHJhd19wcm9jX2xpc3QpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFVuaXF1aWZ5IGluIG1lbW9yeSBwcm9jZXNzIGxpc3RcbiAgICAgICAqL1xuICAgICAgcmF3X3Byb2NfbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHByb2MpIHtcbiAgICAgICAgcHJvY19saXN0W3Byb2MubmFtZV0gPSBwcm9jO1xuICAgICAgfSk7XG5cbiAgICAgIC8qKlxuICAgICAgICogQXV0byBkZXRlY3QgYXBwbGljYXRpb24gYWxyZWFkeSBzdGFydGVkXG4gICAgICAgKiBhbmQgYWN0IG9uIHRoZW0gZGVwZW5kaW5nIG9uIGFjdGlvblxuICAgICAgICovXG4gICAgICBlYWNoTGltaXQoT2JqZWN0LmtleXMocHJvY19saXN0KSwgY29uZi5DT05DVVJSRU5UX0FDVElPTlMsIGZ1bmN0aW9uKHByb2NfbmFtZSwgbmV4dCkge1xuICAgICAgICAvLyBTa2lwIGFwcCBuYW1lICgtLW9ubHkgb3B0aW9uKVxuICAgICAgICBpZiAoYXBwc19uYW1lLmluZGV4T2YocHJvY19uYW1lKSA9PSAtMSlcbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuXG4gICAgICAgIGlmICghKGFjdGlvbiA9PSAncmVsb2FkUHJvY2Vzc0lkJyB8fFxuICAgICAgICAgICAgYWN0aW9uID09ICdzb2Z0UmVsb2FkUHJvY2Vzc0lkJyB8fFxuICAgICAgICAgICAgYWN0aW9uID09ICdyZXN0YXJ0UHJvY2Vzc0lkJykpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXcm9uZyBhY3Rpb24gY2FsbGVkJyk7XG5cbiAgICAgICAgdmFyIGFwcHMgPSBhcHBDb25mLmZpbHRlcihmdW5jdGlvbihhcHApIHtcbiAgICAgICAgICByZXR1cm4gYXBwLm5hbWUgPT0gcHJvY19uYW1lO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZW52cyA9IGFwcHMubWFwKGZ1bmN0aW9uKGFwcCl7XG4gICAgICAgICAgLy8gQmluZHMgZW52X2RpZmYgdG8gZW52IGFuZCByZXR1cm5zIGl0LlxuICAgICAgICAgIHJldHVybiBDb21tb24ubWVyZ2VFbnZpcm9ubWVudFZhcmlhYmxlcyhhcHAsIG9wdHMuZW52LCBkZXBsb3lDb25mKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQXNzaWducyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIGFsbFxuICAgICAgICAvLyBOb3RpY2U6IGlmIHBlb3BsZSB1c2UgdGhlIHNhbWUgbmFtZSBpbiBkaWZmZXJlbnQgYXBwcyxcbiAgICAgICAgLy8gICAgICAgICBkdXBsaWNhdGVkIGVudnMgd2lsbCBiZSBvdmVycm9kZSBieSB0aGUgbGFzdCBvbmVcbiAgICAgICAgdmFyIGVudiA9IGVudnMucmVkdWNlKGZ1bmN0aW9uKGUxLCBlMil7XG4gICAgICAgICAgcmV0dXJuIHV0aWwuaW5oZXJpdHMoZTEsIGUyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gV2hlbiB3ZSBhcmUgcHJvY2Vzc2luZyBKU09OLCBhbGxvdyB0byBrZWVwIHRoZSBuZXcgZW52IGJ5IGRlZmF1bHRcbiAgICAgICAgZW52LnVwZGF0ZUVudiA9IHRydWU7XG5cbiAgICAgICAgLy8gUGFzcyBgZW52YCBvcHRpb25cbiAgICAgICAgdGhhdC5fb3BlcmF0ZShhY3Rpb24sIHByb2NfbmFtZSwgZW52LCBmdW5jdGlvbihlcnIsIHJldCkge1xuICAgICAgICAgIGlmIChlcnIpIENvbW1vbi5wcmludEVycm9yKGVycik7XG5cbiAgICAgICAgICAvLyBGb3IgcmV0dXJuXG4gICAgICAgICAgYXBwc19pbmZvID0gYXBwc19pbmZvLmNvbmNhdChyZXQpO1xuXG4gICAgICAgICAgdGhhdC5DbGllbnQubm90aWZ5R29kKGFjdGlvbiwgcHJvY19uYW1lKTtcbiAgICAgICAgICAvLyBBbmQgUmVtb3ZlIGZyb20gYXJyYXkgdG8gc3B5XG4gICAgICAgICAgYXBwc19uYW1lLnNwbGljZShhcHBzX25hbWUuaW5kZXhPZihwcm9jX25hbWUpLCAxKTtcbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICB9KTtcblxuICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgaWYgKGFwcHNfbmFtZS5sZW5ndGggPiAwICYmIGFjdGlvbiAhPSAnc3RhcnQnKVxuICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0dfV0FSTklORyArICdBcHBsaWNhdGlvbnMgJXMgbm90IHJ1bm5pbmcsIHN0YXJ0aW5nLi4uJywgYXBwc19uYW1lLmpvaW4oJywgJykpO1xuICAgICAgICAvLyBTdGFydCBtaXNzaW5nIGFwcHNcbiAgICAgICAgcmV0dXJuIHN0YXJ0QXBwcyhhcHBzX25hbWUsIGZ1bmN0aW9uKGVyciwgYXBwcykge1xuICAgICAgICAgIGFwcHNfaW5mbyA9IGFwcHNfaW5mby5jb25jYXQoYXBwcyk7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBhcHBzX2luZm8pIDogdGhhdC5zcGVlZExpc3QoZXJyID8gMSA6IDApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gc3RhcnRBcHBzKGFwcF9uYW1lX3RvX3N0YXJ0LCBjYikge1xuICAgICAgdmFyIGFwcHNfdG9fc3RhcnQgPSBbXTtcbiAgICAgIHZhciBhcHBzX3N0YXJ0ZWQgPSBbXTtcbiAgICAgIHZhciBhcHBzX2Vycm9yZWQgPSBbXTtcblxuICAgICAgYXBwQ29uZi5mb3JFYWNoKGZ1bmN0aW9uKGFwcCwgaSkge1xuICAgICAgICBpZiAoYXBwX25hbWVfdG9fc3RhcnQuaW5kZXhPZihhcHAubmFtZSkgIT0gLTEpIHtcbiAgICAgICAgICBhcHBzX3RvX3N0YXJ0LnB1c2goYXBwQ29uZltpXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBlYWNoTGltaXQoYXBwc190b19zdGFydCwgY29uZi5DT05DVVJSRU5UX0FDVElPTlMsIGZ1bmN0aW9uKGFwcCwgbmV4dCkge1xuICAgICAgICBpZiAob3B0cy5jd2QpXG4gICAgICAgICAgYXBwLmN3ZCA9IG9wdHMuY3dkO1xuICAgICAgICBpZiAob3B0cy5mb3JjZV9uYW1lKVxuICAgICAgICAgIGFwcC5uYW1lID0gb3B0cy5mb3JjZV9uYW1lO1xuICAgICAgICBpZiAob3B0cy5zdGFydGVkX2FzX21vZHVsZSlcbiAgICAgICAgICBhcHAucG14X21vZHVsZSA9IHRydWU7XG5cbiAgICAgICAgdmFyIHJlc29sdmVkX3BhdGhzID0gbnVsbDtcblxuICAgICAgICAvLyBoYXJkY29kZSBzY3JpcHQgbmFtZSB0byB1c2UgYHNlcnZlYCBmZWF0dXJlIGluc2lkZSBhIHByb2Nlc3MgZmlsZVxuICAgICAgICBpZiAoYXBwLnNjcmlwdCA9PT0gJ3NlcnZlJykge1xuICAgICAgICAgIGFwcC5zY3JpcHQgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnQVBJJywgJ1NlcnZlLmpzJylcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzb2x2ZWRfcGF0aHMgPSBDb21tb24ucmVzb2x2ZUFwcEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgY3dkICAgICAgOiB0aGF0LmN3ZCxcbiAgICAgICAgICAgIHBtMl9ob21lIDogdGhhdC5wbTJfaG9tZVxuICAgICAgICAgIH0sIGFwcCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBhcHBzX2Vycm9yZWQucHVzaChlKVxuICAgICAgICAgIENvbW1vbi5lcnIoYEVycm9yOiAke2UubWVzc2FnZX1gKVxuICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXJlc29sdmVkX3BhdGhzLmVudikgcmVzb2x2ZWRfcGF0aHMuZW52ID0ge307XG5cbiAgICAgICAgLy8gU2V0IFBNMiBIT01FIGluIGNhc2Ugb2YgY2hpbGQgcHJvY2VzcyB1c2luZyBQTTIgQVBJXG4gICAgICAgIHJlc29sdmVkX3BhdGhzLmVudlsnUE0yX0hPTUUnXSA9IHRoYXQucG0yX2hvbWU7XG5cbiAgICAgICAgdmFyIGFkZGl0aW9uYWxfZW52ID0gTW9kdWxhcml6ZXIuZ2V0QWRkaXRpb25hbENvbmYocmVzb2x2ZWRfcGF0aHMubmFtZSk7XG4gICAgICAgIHV0aWwuaW5oZXJpdHMocmVzb2x2ZWRfcGF0aHMuZW52LCBhZGRpdGlvbmFsX2Vudik7XG5cbiAgICAgICAgcmVzb2x2ZWRfcGF0aHMuZW52ID0gQ29tbW9uLm1lcmdlRW52aXJvbm1lbnRWYXJpYWJsZXMocmVzb2x2ZWRfcGF0aHMsIG9wdHMuZW52LCBkZXBsb3lDb25mKTtcblxuICAgICAgICBkZWxldGUgcmVzb2x2ZWRfcGF0aHMuZW52LmN1cnJlbnRfY29uZjtcblxuICAgICAgICAvLyBJcyBLTSBsaW5rZWQ/XG4gICAgICAgIHJlc29sdmVkX3BhdGhzLmttX2xpbmsgPSB0aGF0LmdsX2lzX2ttX2xpbmtlZDtcblxuICAgICAgICBpZiAocmVzb2x2ZWRfcGF0aHMud2FpdF9yZWFkeSkge1xuICAgICAgICAgIENvbW1vbi53YXJuKGBBcHAgJHtyZXNvbHZlZF9wYXRocy5uYW1lfSBoYXMgb3B0aW9uICd3YWl0X3JlYWR5JyBzZXQsIHdhaXRpbmcgZm9yIGFwcCB0byBiZSByZWFkeS4uLmApXG4gICAgICAgIH1cbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgncHJlcGFyZScsIHJlc29sdmVkX3BhdGhzLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ1Byb2Nlc3MgZmFpbGVkIHRvIGxhdW5jaCAlcycsIGVyci5tZXNzYWdlID8gZXJyLm1lc3NhZ2UgOiBlcnIpO1xuICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ1Byb2Nlc3MgY29uZmlnIGxvYWRpbmcgZmFpbGVkJywgZGF0YSk7XG4gICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnQXBwIFslc10gbGF1bmNoZWQgKCVkIGluc3RhbmNlcyknLCBkYXRhWzBdLnBtMl9lbnYubmFtZSwgZGF0YS5sZW5ndGgpO1xuICAgICAgICAgIGFwcHNfc3RhcnRlZCA9IGFwcHNfc3RhcnRlZC5jb25jYXQoZGF0YSk7XG4gICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9KTtcblxuICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIHZhciBmaW5hbF9lcnJvciA9IGVyciB8fCBhcHBzX2Vycm9yZWQubGVuZ3RoID4gMCA/IGFwcHNfZXJyb3JlZCA6IG51bGxcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZmluYWxfZXJyb3IsIGFwcHNfc3RhcnRlZCkgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IGEgUlBDIG1ldGhvZCBvbiB0aGUganNvbiBmaWxlXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZXRob2QgYWN0aW9uRnJvbUpzb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvbiBSUEMgTWV0aG9kXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gZmlsZSBmaWxlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBqc29uVmlhIGFjdGlvbiB0eXBlICg9b25seSAncGlwZScgPylcbiAgICogQHBhcmFtIHtGdW5jdGlvbn1cbiAgICovXG4gIGFjdGlvbkZyb21Kc29uIChhY3Rpb24sIGZpbGUsIG9wdHMsIGpzb25WaWEsIGNiKSB7XG4gICAgdmFyIGFwcENvbmY6IGFueSA9IHt9O1xuICAgIHZhciByZXRfcHJvY2Vzc2VzID0gW107XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgLy9hY2NlcHQgcHJvZ3JhbW1hdGljIGNhbGxzXG4gICAgaWYgKHR5cGVvZiBmaWxlID09ICdvYmplY3QnKSB7XG4gICAgICBjYiA9IHR5cGVvZiBqc29uVmlhID09ICdmdW5jdGlvbicgPyBqc29uVmlhIDogY2I7XG4gICAgICBhcHBDb25mID0gZmlsZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoanNvblZpYSA9PSAnZmlsZScpIHtcbiAgICAgIHZhciBkYXRhID0gbnVsbDtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhmaWxlKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ0ZpbGUgJyArIGZpbGUgKycgbm90IGZvdW5kJyk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZSkpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGFwcENvbmYgPSBDb21tb24ucGFyc2VDb25maWcoZGF0YSwgZmlsZSk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdGaWxlICcgKyBmaWxlICsgJyBtYWxmb3JtYXRlZCcpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGUpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoanNvblZpYSA9PSAncGlwZScpIHtcbiAgICAgIGFwcENvbmYgPSBDb21tb24ucGFyc2VDb25maWcoZmlsZSwgJ3BpcGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0JhZCBjYWxsIHRvIGFjdGlvbkZyb21Kc29uLCBqc29uVmlhIHNob3VsZCBiZSBvbmUgb2YgZmlsZSwgcGlwZScpO1xuICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgIH1cblxuICAgIC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbiAgICBpZiAoYXBwQ29uZi5hcHBzKVxuICAgICAgYXBwQ29uZiA9IGFwcENvbmYuYXBwcztcblxuICAgIGlmICghQXJyYXkuaXNBcnJheShhcHBDb25mKSlcbiAgICAgIGFwcENvbmYgPSBbYXBwQ29uZl07XG5cbiAgICBpZiAoKGFwcENvbmYgPSBDb21tb24udmVyaWZ5Q29uZnMoYXBwQ29uZikpIGluc3RhbmNlb2YgRXJyb3IpXG4gICAgICByZXR1cm4gY2IgPyBjYihhcHBDb25mKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuXG4gICAgZWFjaExpbWl0KGFwcENvbmYsIGNvbmYuQ09OQ1VSUkVOVF9BQ1RJT05TLCBmdW5jdGlvbihwcm9jLCBuZXh0MSkge1xuICAgICAgdmFyIG5hbWUgPSAnJztcbiAgICAgIHZhciBuZXdfZW52O1xuXG4gICAgICBpZiAoIXByb2MubmFtZSlcbiAgICAgICAgbmFtZSA9IHBhdGguYmFzZW5hbWUocHJvYy5zY3JpcHQpO1xuICAgICAgZWxzZVxuICAgICAgICBuYW1lID0gcHJvYy5uYW1lO1xuXG4gICAgICBpZiAob3B0cy5vbmx5ICYmIG9wdHMub25seSAhPSBuYW1lKVxuICAgICAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhuZXh0MSk7XG5cbiAgICAgIGlmIChvcHRzICYmIG9wdHMuZW52KVxuICAgICAgICBuZXdfZW52ID0gQ29tbW9uLm1lcmdlRW52aXJvbm1lbnRWYXJpYWJsZXMocHJvYywgb3B0cy5lbnYpO1xuICAgICAgZWxzZVxuICAgICAgICBuZXdfZW52ID0gQ29tbW9uLm1lcmdlRW52aXJvbm1lbnRWYXJpYWJsZXMocHJvYyk7XG5cbiAgICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZShuYW1lLCBmdW5jdGlvbihlcnIsIGlkcykge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICByZXR1cm4gbmV4dDEoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlkcykgcmV0dXJuIG5leHQxKCk7XG5cbiAgICAgICAgZWFjaExpbWl0KGlkcywgY29uZi5DT05DVVJSRU5UX0FDVElPTlMsIGZ1bmN0aW9uKGlkLCBuZXh0Mikge1xuICAgICAgICAgIHZhciBvcHRzID0ge307XG5cbiAgICAgICAgICAvL3N0b3BQcm9jZXNzSWQgY291bGQgYWNjZXB0IG9wdGlvbnMgdG8/XG4gICAgICAgICAgaWYgKGFjdGlvbiA9PSAncmVzdGFydFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgIG9wdHMgPSB7aWQgOiBpZCwgZW52IDogbmV3X2Vudn07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wdHMgPSBpZDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKGFjdGlvbiwgb3B0cywgZnVuY3Rpb24oZXJyLCByZXMpIHtcbiAgICAgICAgICAgIHJldF9wcm9jZXNzZXMucHVzaChyZXMpO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICByZXR1cm4gbmV4dDIoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGFjdGlvbiA9PSAncmVzdGFydFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgICAgdGhhdC5DbGllbnQubm90aWZ5R29kKCdyZXN0YXJ0JywgaWQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT0gJ2RlbGV0ZVByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgICAgdGhhdC5DbGllbnQubm90aWZ5R29kKCdkZWxldGUnLCBpZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PSAnc3RvcFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgICAgdGhhdC5DbGllbnQubm90aWZ5R29kKCdzdG9wJywgaWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1slc10oJWQpIFxcdTI3MTMnLCBuYW1lLCBpZCk7XG4gICAgICAgICAgICByZXR1cm4gbmV4dDIoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQxKG51bGwsIHJldF9wcm9jZXNzZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgaWYgKGNiKSByZXR1cm4gY2IobnVsbCwgcmV0X3Byb2Nlc3Nlcyk7XG4gICAgICBlbHNlIHJldHVybiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgIH0pO1xuICB9XG5cblxuICAvKipcbiAgICogTWFpbiBmdW5jdGlvbiB0byBvcGVyYXRlIHdpdGggUE0yIGRhZW1vblxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gYWN0aW9uX25hbWUgIE5hbWUgb2YgYWN0aW9uIChyZXN0YXJ0UHJvY2Vzc0lkLCBkZWxldGVQcm9jZXNzSWQsIHN0b3BQcm9jZXNzSWQpXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9jZXNzX25hbWUgY2FuIGJlICdhbGwnLCBhIGlkIGludGVnZXIgb3IgcHJvY2VzcyBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbnZzICAgICAgICAgb2JqZWN0IHdpdGggQ0xJIG9wdGlvbnMgLyBlbnZpcm9ubWVudFxuICAgKi9cbiAgX29wZXJhdGUgKGFjdGlvbl9uYW1lLCBwcm9jZXNzX25hbWUsIGVudnMsIGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgdXBkYXRlX2VudiA9IGZhbHNlO1xuICAgIHZhciByZXQgPSBbXTtcblxuICAgIC8vIE1ha2Ugc3VyZSBhbGwgb3B0aW9ucyBleGlzdFxuICAgIGlmICghZW52cylcbiAgICAgIGVudnMgPSB7fTtcblxuICAgIGlmICh0eXBlb2YoZW52cykgPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICBjYiA9IGVudnM7XG4gICAgICBlbnZzID0ge307XG4gICAgfVxuXG4gICAgLy8gU2V0IHZpYSBlbnYudXBkYXRlIChKU09OIHByb2Nlc3NpbmcpXG4gICAgaWYgKGVudnMudXBkYXRlRW52ID09PSB0cnVlKVxuICAgICAgdXBkYXRlX2VudiA9IHRydWU7XG5cbiAgICB2YXIgY29uY3VycmVudF9hY3Rpb25zID0gZW52cy5wYXJhbGxlbCB8fCBjb25mLkNPTkNVUlJFTlRfQUNUSU9OUztcblxuICAgIGlmICghcHJvY2Vzcy5lbnYuUE0yX0pTT05fUFJPQ0VTU0lORyB8fCBlbnZzLmNvbW1hbmRzKSB7XG4gICAgICBlbnZzID0gdGhhdC5faGFuZGxlQXR0cmlidXRlVXBkYXRlKGVudnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCBjdXJyZW50IHVwZGF0ZWQgY29uZmlndXJhdGlvbiBpZiBub3QgcGFzc2VkXG4gICAgICovXG4gICAgaWYgKCFlbnZzLmN1cnJlbnRfY29uZikge1xuICAgICAgdmFyIF9jb25mID0gZmNsb25lKGVudnMpO1xuICAgICAgZW52cyA9IHtcbiAgICAgICAgY3VycmVudF9jb25mIDogX2NvbmZcbiAgICAgIH1cblxuICAgICAgLy8gSXMgS00gbGlua2VkP1xuICAgICAgZW52cy5jdXJyZW50X2NvbmYua21fbGluayA9IHRoYXQuZ2xfaXNfa21fbGlua2VkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9wZXJhdGUgYWN0aW9uIG9uIHNwZWNpZmljIHByb2Nlc3MgaWRcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwcm9jZXNzSWRzKGlkcywgY2IpIHtcbiAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnQXBwbHlpbmcgYWN0aW9uICVzIG9uIGFwcCBbJXNdKGlkczogJXMpJywgYWN0aW9uX25hbWUsIHByb2Nlc3NfbmFtZSwgaWRzKTtcblxuICAgICAgaWYgKGlkcy5sZW5ndGggPD0gMilcbiAgICAgICAgY29uY3VycmVudF9hY3Rpb25zID0gMTtcblxuICAgICAgaWYgKGFjdGlvbl9uYW1lID09ICdkZWxldGVQcm9jZXNzSWQnKVxuICAgICAgICBjb25jdXJyZW50X2FjdGlvbnMgPSAxMDtcblxuICAgICAgZWFjaExpbWl0KGlkcywgY29uY3VycmVudF9hY3Rpb25zLCBmdW5jdGlvbihpZCwgbmV4dCkge1xuICAgICAgICB2YXIgb3B0cztcblxuICAgICAgICAvLyBUaGVzZSBmdW5jdGlvbnMgbmVlZCBleHRyYSBwYXJhbSB0byBiZSBwYXNzZWRcbiAgICAgICAgaWYgKGFjdGlvbl9uYW1lID09ICdyZXN0YXJ0UHJvY2Vzc0lkJyB8fFxuICAgICAgICAgIGFjdGlvbl9uYW1lID09ICdyZWxvYWRQcm9jZXNzSWQnIHx8XG4gICAgICAgICAgYWN0aW9uX25hbWUgPT0gJ3NvZnRSZWxvYWRQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgdmFyIG5ld19lbnY6IGFueSA9IHt9O1xuXG4gICAgICAgICAgaWYgKHVwZGF0ZV9lbnYgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmIChjb25mLlBNMl9QUk9HUkFNTUFUSUMgPT0gdHJ1ZSlcbiAgICAgICAgICAgICAgbmV3X2VudiA9IENvbW1vbi5zYWZlRXh0ZW5kKHt9LCBwcm9jZXNzLmVudik7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIG5ld19lbnYgPSB1dGlsLmluaGVyaXRzKHt9LCBwcm9jZXNzLmVudik7XG5cbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGVudnMpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgICAgICAgICBuZXdfZW52W2tdID0gZW52c1trXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5ld19lbnYgPSBlbnZzO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9wdHMgPSB7XG4gICAgICAgICAgICBpZCAgOiBpZCxcbiAgICAgICAgICAgIGVudiA6IG5ld19lbnZcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIG9wdHMgPSBpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoYWN0aW9uX25hbWUsIG9wdHMsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdQcm9jZXNzICVzIG5vdCBmb3VuZCcsIGlkKTtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KGBQcm9jZXNzICR7aWR9IG5vdCBmb3VuZGApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhY3Rpb25fbmFtZSA9PSAncmVzdGFydFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgIHRoYXQuQ2xpZW50Lm5vdGlmeUdvZCgncmVzdGFydCcsIGlkKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbl9uYW1lID09ICdkZWxldGVQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICB0aGF0LkNsaWVudC5ub3RpZnlHb2QoJ2RlbGV0ZScsIGlkKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbl9uYW1lID09ICdzdG9wUHJvY2Vzc0lkJykge1xuICAgICAgICAgICAgdGhhdC5DbGllbnQubm90aWZ5R29kKCdzdG9wJywgaWQpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uX25hbWUgPT0gJ3JlbG9hZFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgIHRoYXQuQ2xpZW50Lm5vdGlmeUdvZCgncmVsb2FkJywgaWQpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uX25hbWUgPT0gJ3NvZnRSZWxvYWRQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICB0aGF0LkNsaWVudC5ub3RpZnlHb2QoJ2dyYWNlZnVsIHJlbG9hZCcsIGlkKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocmVzKSlcbiAgICAgICAgICAgIHJlcyA9IFtyZXNdO1xuXG4gICAgICAgICAgLy8gRmlsdGVyIHJldHVyblxuICAgICAgICAgIHJlcy5mb3JFYWNoKGZ1bmN0aW9uKHByb2MpIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnWyVzXSglZCkgXFx1MjcxMycsIHByb2MucG0yX2VudiA/IHByb2MucG0yX2Vudi5uYW1lIDogcHJvY2Vzc19uYW1lLCBpZCk7XG5cbiAgICAgICAgICAgIGlmIChhY3Rpb25fbmFtZSA9PSAnc3RvcFByb2Nlc3NJZCcgJiYgcHJvYy5wbTJfZW52ICYmIHByb2MucG0yX2Vudi5jcm9uX3Jlc3RhcnQpIHtcbiAgICAgICAgICAgICAgQ29tbW9uLndhcm4oYEFwcCAke2NoYWxrLmJvbGQocHJvYy5wbTJfZW52Lm5hbWUpfSBzdG9wcGVkIGJ1dCBDUk9OIFJFU1RBUlQgaXMgc3RpbGwgVVAgJHtwcm9jLnBtMl9lbnYuY3Jvbl9yZXN0YXJ0fWApXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghcHJvYy5wbTJfZW52KSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZSAgICAgICAgIDogcHJvYy5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICAgIG5hbWVzcGFjZTogcHJvYy5wbTJfZW52Lm5hbWVzcGFjZSxcbiAgICAgICAgICAgICAgcG1faWQgICAgICAgIDogcHJvYy5wbTJfZW52LnBtX2lkLFxuICAgICAgICAgICAgICBzdGF0dXMgICAgICAgOiBwcm9jLnBtMl9lbnYuc3RhdHVzLFxuICAgICAgICAgICAgICByZXN0YXJ0X3RpbWUgOiBwcm9jLnBtMl9lbnYucmVzdGFydF90aW1lLFxuICAgICAgICAgICAgICBwbTJfZW52IDoge1xuICAgICAgICAgICAgICAgIG5hbWUgICAgICAgICA6IHByb2MucG0yX2Vudi5uYW1lLFxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogcHJvYy5wbTJfZW52Lm5hbWVzcGFjZSxcbiAgICAgICAgICAgICAgICBwbV9pZCAgICAgICAgOiBwcm9jLnBtMl9lbnYucG1faWQsXG4gICAgICAgICAgICAgICAgc3RhdHVzICAgICAgIDogcHJvYy5wbTJfZW52LnN0YXR1cyxcbiAgICAgICAgICAgICAgICByZXN0YXJ0X3RpbWUgOiBwcm9jLnBtMl9lbnYucmVzdGFydF90aW1lLFxuICAgICAgICAgICAgICAgIGVudiAgICAgICAgICA6IHByb2MucG0yX2Vudi5lbnZcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICB9KTtcbiAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJldCkgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHByb2Nlc3NfbmFtZSA9PSAnYWxsJykge1xuICAgICAgLy8gV2hlbiB1c2luZyBzaG9ydGN1dHMgbGlrZSAnYWxsJywgZG8gbm90IGRlbGV0ZSBtb2R1bGVzXG4gICAgICB2YXIgZm5cblxuICAgICAgaWYgKHByb2Nlc3MuZW52LlBNMl9TVEFUVVMgPT0gJ3N0b3BwaW5nJylcbiAgICAgICAgdGhhdC5DbGllbnQuZ2V0QWxsUHJvY2Vzc0lkKGZ1bmN0aW9uKGVyciwgaWRzKSB7XG4gICAgICAgICAgcmVvcGVyYXRlKGVyciwgaWRzKVxuICAgICAgICB9KTtcbiAgICAgIGVsc2VcbiAgICAgICAgdGhhdC5DbGllbnQuZ2V0QWxsUHJvY2Vzc0lkV2l0aG91dE1vZHVsZXMoZnVuY3Rpb24oZXJyLCBpZHMpIHtcbiAgICAgICAgICByZW9wZXJhdGUoZXJyLCBpZHMpXG4gICAgICAgIH0pO1xuXG4gICAgICBmdW5jdGlvbiByZW9wZXJhdGUoZXJyLCBpZHMpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaWRzIHx8IGlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfV0FSTklORyArICdObyBwcm9jZXNzIGZvdW5kJyk7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKCdwcm9jZXNzIG5hbWUgbm90IGZvdW5kJykpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoaWRzLCBjYik7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIG9wZXJhdGUgdXNpbmcgcmVnZXhcbiAgICBlbHNlIGlmIChpc05hTihwcm9jZXNzX25hbWUpICYmIHByb2Nlc3NfbmFtZVswXSA9PT0gJy8nICYmIHByb2Nlc3NfbmFtZVtwcm9jZXNzX25hbWUubGVuZ3RoIC0gMV0gPT09ICcvJykge1xuICAgICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChwcm9jZXNzX25hbWUucmVwbGFjZSgvXFwvL2csICcnKSk7XG5cbiAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuICAgICAgICBsaXN0LmZvckVhY2goZnVuY3Rpb24ocHJvYykge1xuICAgICAgICAgIGlmIChyZWdleC50ZXN0KHByb2MucG0yX2Vudi5uYW1lKSkge1xuICAgICAgICAgICAgZm91bmRfcHJvYy5wdXNoKHByb2MucG1faWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGZvdW5kX3Byb2MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX1dBUk5JTkcgKyAnTm8gcHJvY2VzcyBmb3VuZCcpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcigncHJvY2VzcyBuYW1lIG5vdCBmb3VuZCcpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoZm91bmRfcHJvYywgY2IpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGlzTmFOKHByb2Nlc3NfbmFtZSkpIHtcbiAgICAgIC8qKlxuICAgICAgICogV2UgY2FuIG5vdCBzdG9wIG9yIGRlbGV0ZSBhIG1vZHVsZSBidXQgd2UgY2FuIHJlc3RhcnQgaXRcbiAgICAgICAqIHRvIHJlZnJlc2ggY29uZmlndXJhdGlvbiB2YXJpYWJsZVxuICAgICAgICovXG4gICAgICB2YXIgYWxsb3dfbW9kdWxlX3Jlc3RhcnQgPSBhY3Rpb25fbmFtZSA9PSAncmVzdGFydFByb2Nlc3NJZCcgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZShwcm9jZXNzX25hbWUsIGFsbG93X21vZHVsZV9yZXN0YXJ0LCBmdW5jdGlvbiAoZXJyLCBpZHMpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpZHMgJiYgaWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvKipcbiAgICAgICAgICogRGV0ZXJtaW5lIGlmIHRoZSBwcm9jZXNzIHRvIHJlc3RhcnQgaXMgYSBtb2R1bGVcbiAgICAgICAgICogaWYgeWVzIGxvYWQgY29uZmlndXJhdGlvbiB2YXJpYWJsZXMgYW5kIG1lcmdlIHdpdGggdGhlIGN1cnJlbnQgZW52aXJvbm1lbnRcbiAgICAgICAgICovXG4gICAgICAgICAgdmFyIGFkZGl0aW9uYWxfZW52ID0gTW9kdWxhcml6ZXIuZ2V0QWRkaXRpb25hbENvbmYocHJvY2Vzc19uYW1lKTtcbiAgICAgICAgICB1dGlsLmluaGVyaXRzKGVudnMsIGFkZGl0aW9uYWxfZW52KTtcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzc0lkcyhpZHMsIGNiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NJZHNCeU5hbWVzcGFjZShwcm9jZXNzX25hbWUsIGFsbG93X21vZHVsZV9yZXN0YXJ0LCBmdW5jdGlvbiAoZXJyLCBuc19wcm9jZXNzX2lkcykge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghbnNfcHJvY2Vzc19pZHMgfHwgbnNfcHJvY2Vzc19pZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ1Byb2Nlc3Mgb3IgTmFtZXNwYWNlICVzIG5vdCBmb3VuZCcsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoJ3Byb2Nlc3Mgb3IgbmFtZXNwYWNlIG5vdCBmb3VuZCcpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIERldGVybWluZSBpZiB0aGUgcHJvY2VzcyB0byByZXN0YXJ0IGlzIGEgbW9kdWxlXG4gICAgICAgICAgICogaWYgeWVzIGxvYWQgY29uZmlndXJhdGlvbiB2YXJpYWJsZXMgYW5kIG1lcmdlIHdpdGggdGhlIGN1cnJlbnQgZW52aXJvbm1lbnRcbiAgICAgICAgICAgKi9cbiAgICAgICAgICB2YXIgbnNfYWRkaXRpb25hbF9lbnYgPSBNb2R1bGFyaXplci5nZXRBZGRpdGlvbmFsQ29uZihwcm9jZXNzX25hbWUpO1xuICAgICAgICAgIHV0aWwuaW5oZXJpdHMoZW52cywgbnNfYWRkaXRpb25hbF9lbnYpO1xuICAgICAgICAgIHJldHVybiBwcm9jZXNzSWRzKG5zX3Byb2Nlc3NfaWRzLCBjYik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGF0LnBtMl9jb25maWd1cmF0aW9uLmRvY2tlciA9PSBcInRydWVcIiB8fFxuICAgICAgICAgIHRoYXQucG0yX2NvbmZpZ3VyYXRpb24uZG9ja2VyID09IHRydWUpIHtcbiAgICAgICAgLy8gRG9ja2VyL1N5c3RlbWQgcHJvY2VzcyBpbnRlcmFjdGlvbiBkZXRlY3Rpb25cbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgKGVyciwgcHJvY19saXN0KSA9PiB7XG4gICAgICAgICAgdmFyIGhpZ2hlcl9pZCA9IDBcbiAgICAgICAgICBwcm9jX2xpc3QuZm9yRWFjaChwID0+IHsgcC5wbV9pZCA+IGhpZ2hlcl9pZCA/IGhpZ2hlcl9pZCA9IHAucG1faWQgOiBudWxsIH0pXG5cbiAgICAgICAgICAvLyBJcyBEb2NrZXIvU3lzdGVtZFxuICAgICAgICAgIGlmIChwcm9jZXNzX25hbWUgPiBoaWdoZXJfaWQpXG4gICAgICAgICAgICByZXR1cm4gRG9ja2VyTWdtdC5wcm9jZXNzQ29tbWFuZCh0aGF0LCBoaWdoZXJfaWQsIHByb2Nlc3NfbmFtZSwgYWN0aW9uX25hbWUsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAoZXJyLm1lc3NhZ2UgPyBlcnIubWVzc2FnZSA6IGVycikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJldCkgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgIC8vIENoZWNrIGlmIGFwcGxpY2F0aW9uIG5hbWUgYXMgbnVtYmVyIGlzIGFuIGFwcCBuYW1lXG4gICAgICAgICAgdGhhdC5DbGllbnQuZ2V0UHJvY2Vzc0lkQnlOYW1lKHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24oZXJyLCBpZHMpIHtcbiAgICAgICAgICAgIGlmIChpZHMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoaWRzLCBjYik7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGlmIGFwcGxpY2F0aW9uIG5hbWUgYXMgbnVtYmVyIGlzIGFuIG5hbWVzcGFjZVxuICAgICAgICAgICAgdGhhdC5DbGllbnQuZ2V0UHJvY2Vzc0lkc0J5TmFtZXNwYWNlKHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24oZXJyLCBuc19wcm9jZXNzX2lkcykge1xuICAgICAgICAgICAgICBpZiAobnNfcHJvY2Vzc19pZHMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvY2Vzc0lkcyhuc19wcm9jZXNzX2lkcywgY2IpO1xuICAgICAgICAgICAgICAvLyBFbHNlIG9wZXJhdGUgb24gcG0gaWRcbiAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoW3Byb2Nlc3NfbmFtZV0sIGNiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFwcGxpY2F0aW9uIG5hbWUgYXMgbnVtYmVyIGlzIGFuIGFwcCBuYW1lXG4gICAgICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZShwcm9jZXNzX25hbWUsIGZ1bmN0aW9uKGVyciwgaWRzKSB7XG4gICAgICAgICAgaWYgKGlkcy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoaWRzLCBjYik7XG5cbiAgICAgICAgICAvLyBDaGVjayBpZiBhcHBsaWNhdGlvbiBuYW1lIGFzIG51bWJlciBpcyBhbiBuYW1lc3BhY2VcbiAgICAgICAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzSWRzQnlOYW1lc3BhY2UocHJvY2Vzc19uYW1lLCBmdW5jdGlvbihlcnIsIG5zX3Byb2Nlc3NfaWRzKSB7XG4gICAgICAgICAgICBpZiAobnNfcHJvY2Vzc19pZHMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMobnNfcHJvY2Vzc19pZHMsIGNiKTtcbiAgICAgICAgICAgIC8vIEVsc2Ugb3BlcmF0ZSBvbiBwbSBpZFxuICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoW3Byb2Nlc3NfbmFtZV0sIGNiKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIENhbWVsQ2FzZSBDb21tYW5kZXIuanMgYXJndW1lbnRzXG4gICAqIHRvIFVuZGVyc2NvcmVcbiAgICogKG5vZGVBcmdzIC0+IG5vZGVfYXJncylcbiAgICovXG4gIF9oYW5kbGVBdHRyaWJ1dGVVcGRhdGUgKG9wdHMpIHtcbiAgICB2YXIgY29uZjogYW55ID0gQ29uZmlnLmZpbHRlck9wdGlvbnMob3B0cyk7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZihjb25mLm5hbWUpICE9ICdzdHJpbmcnKVxuICAgICAgZGVsZXRlIGNvbmYubmFtZTtcblxuICAgIHZhciBhcmdzSW5kZXggPSAwO1xuICAgIGlmIChvcHRzLnJhd0FyZ3MgJiYgKGFyZ3NJbmRleCA9IG9wdHMucmF3QXJncy5pbmRleE9mKCctLScpKSA+PSAwKSB7XG4gICAgICBjb25mLmFyZ3MgPSBvcHRzLnJhd0FyZ3Muc2xpY2UoYXJnc0luZGV4ICsgMSk7XG4gICAgfVxuXG4gICAgdmFyIGFwcENvbmYgPSBDb21tb24udmVyaWZ5Q29uZnMoY29uZilbMF07XG5cbiAgICBpZiAoYXBwQ29uZiBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcignRXJyb3Igd2hpbGUgdHJhbnNmb3JtaW5nIENhbWVsQ2FzZSBhcmdzIHRvIHVuZGVyc2NvcmUnKTtcbiAgICAgIHJldHVybiBhcHBDb25mO1xuICAgIH1cblxuICAgIGlmIChhcmdzSW5kZXggPT0gLTEpXG4gICAgICBkZWxldGUgYXBwQ29uZi5hcmdzO1xuICAgIGlmIChhcHBDb25mLm5hbWUgPT0gJ3VuZGVmaW5lZCcpXG4gICAgICBkZWxldGUgYXBwQ29uZi5uYW1lO1xuXG4gICAgZGVsZXRlIGFwcENvbmYuZXhlY19tb2RlO1xuXG4gICAgaWYgKHV0aWwuaXNBcnJheShhcHBDb25mLndhdGNoKSAmJiBhcHBDb25mLndhdGNoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWYgKCF+b3B0cy5yYXdBcmdzLmluZGV4T2YoJy0td2F0Y2gnKSlcbiAgICAgICAgZGVsZXRlIGFwcENvbmYud2F0Y2hcbiAgICB9XG5cbiAgICAvLyBPcHRpb25zIHNldCB2aWEgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gICAgaWYgKHByb2Nlc3MuZW52LlBNMl9ERUVQX01PTklUT1JJTkcpXG4gICAgICBhcHBDb25mLmRlZXBfbW9uaXRvcmluZyA9IHRydWU7XG5cbiAgICAvLyBGb3JjZSBkZWxldGlvbiBvZiBkZWZhdWx0cyB2YWx1ZXMgc2V0IGJ5IGNvbW1hbmRlclxuICAgIC8vIHRvIGF2b2lkIG92ZXJyaWRpbmcgc3BlY2lmaWVkIGNvbmZpZ3VyYXRpb24gYnkgdXNlclxuICAgIGlmIChhcHBDb25mLnRyZWVraWxsID09PSB0cnVlKVxuICAgICAgZGVsZXRlIGFwcENvbmYudHJlZWtpbGw7XG4gICAgaWYgKGFwcENvbmYucG14ID09PSB0cnVlKVxuICAgICAgZGVsZXRlIGFwcENvbmYucG14O1xuICAgIGlmIChhcHBDb25mLnZpemlvbiA9PT0gdHJ1ZSlcbiAgICAgIGRlbGV0ZSBhcHBDb25mLnZpemlvbjtcbiAgICBpZiAoYXBwQ29uZi5hdXRvbWF0aW9uID09PSB0cnVlKVxuICAgICAgZGVsZXRlIGFwcENvbmYuYXV0b21hdGlvbjtcbiAgICBpZiAoYXBwQ29uZi5hdXRvcmVzdGFydCA9PT0gdHJ1ZSlcbiAgICAgIGRlbGV0ZSBhcHBDb25mLmF1dG9yZXN0YXJ0O1xuXG4gICAgcmV0dXJuIGFwcENvbmY7XG4gIH1cblxuICBnZXRQcm9jZXNzSWRCeU5hbWUgKG5hbWUsIGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoaXMuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZShuYW1lLCBmdW5jdGlvbihlcnIsIGlkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGlkKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGlkKSA6IHRoYXQuZXhpdENsaShjb25mLlNVQ0NFU1NfRVhJVCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBqbGlzdFxuICAgKiBAcGFyYW0ge30gZGVidWdcbiAgICogQHJldHVyblxuICAgKi9cbiAgamxpc3QgKGRlYnVnPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkZWJ1Zykge1xuICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZSh1dGlsLmluc3BlY3QobGlzdCwgZmFsc2UsIG51bGwsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoSlNPTi5zdHJpbmdpZnkobGlzdCkpO1xuICAgICAgfVxuXG4gICAgICB0aGF0LmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGlzcGxheSBzeXN0ZW0gaW5mb3JtYXRpb25cbiAgICogQG1ldGhvZCBzbGlzdFxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBzbGlzdCAodHJlZSkge1xuICAgIHRoaXMuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldFN5c3RlbURhdGEnLCB7fSwgKGVyciwgc3lzX2luZm9zKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5lcnIoZXJyKVxuICAgICAgICByZXR1cm4gdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVClcbiAgICAgIH1cblxuICAgICAgaWYgKHRyZWUgPT09IHRydWUpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2codHJlZWlmeS5hc1RyZWUoc3lzX2luZm9zLCB0cnVlKSlcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUodXRpbC5pbnNwZWN0KHN5c19pbmZvcywgZmFsc2UsIG51bGwsIGZhbHNlKSlcbiAgICAgIHRoaXMuZXhpdENsaShjb25mLlNVQ0NFU1NfRVhJVClcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uXG4gICAqIEBtZXRob2Qgc3BlZWRMaXN0XG4gICAqIEByZXR1cm5cbiAgICovXG4gIHNwZWVkTGlzdCAoY29kZT8sIGFwcHNfYWN0ZWQ/KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBzeXN0ZW1kYXRhID0gbnVsbFxuICAgIHZhciBhY3RlZCA9IFtdXG5cbiAgICBpZiAoKGNvZGUgIT0gMCAmJiBjb2RlICE9IG51bGwpKSB7XG4gICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNvZGUgPyBjb2RlIDogY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgIH1cblxuICAgIGlmIChhcHBzX2FjdGVkICYmIGFwcHNfYWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgYXBwc19hY3RlZC5mb3JFYWNoKHByb2MgPT4ge1xuICAgICAgICBhY3RlZC5wdXNoKHByb2MucG0yX2VudiA/IHByb2MucG0yX2Vudi5wbV9pZCA6IHByb2MucG1faWQpXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIERvIG5vdGhpbmcgaWYgUE0yIGNhbGxlZCBwcm9ncmFtbWF0aWNhbGx5IGFuZCBub3QgY2FsbGVkIGZyb20gQ0xJIChhbHNvIGluIGV4aXRDbGkpXG4gICAgaWYgKChjb25mLlBNMl9QUk9HUkFNTUFUSUMgJiYgcHJvY2Vzcy5lbnYuUE0yX1VTQUdFICE9ICdDTEknKSlcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIHJldHVybiB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRTeXN0ZW1EYXRhJywge30sIChlcnIsIHN5c19pbmZvcykgPT4ge1xuICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgKGVyciwgcHJvY19saXN0KSA9PiB7XG4gICAgICAgIGRvTGlzdChlcnIsIHByb2NfbGlzdCwgc3lzX2luZm9zKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgZnVuY3Rpb24gZG9MaXN0KGVyciwgbGlzdCwgc3lzX2luZm9zKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGlmICh0aGF0LmdsX3JldHJ5ID09IDApIHtcbiAgICAgICAgICB0aGF0LmdsX3JldHJ5ICs9IDE7XG4gICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQodGhhdC5zcGVlZExpc3QuYmluZCh0aGF0KSwgMTQwMCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcmV0cmlldmluZyBwcm9jZXNzIGxpc3Q6ICVzLlxcbkEgcHJvY2VzcyBzZWVtcyB0byBiZSBvbiBpbmZpbml0ZSBsb29wLCByZXRyeSBpbiA1IHNlY29uZHMnLGVycik7XG4gICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIGlmIChwcm9jZXNzLnN0ZG91dC5pc1RUWSA9PT0gZmFsc2UpIHtcbiAgICAgICAgVVgubGlzdF9taW4obGlzdCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChjb21tYW5kZXIubWluaUxpc3QgJiYgIWNvbW1hbmRlci5zaWxlbnQpXG4gICAgICAgIFVYLmxpc3RfbWluKGxpc3QpO1xuICAgICAgZWxzZSBpZiAoIWNvbW1hbmRlci5zaWxlbnQpIHtcbiAgICAgICAgaWYgKHRoYXQuZ2xfaW50ZXJhY3RfaW5mb3MpIHtcbiAgICAgICAgICB2YXIgZGFzaGJvYXJkX3VybCA9IGBodHRwczovL2FwcC5wbTIuaW8vIy9yLyR7dGhhdC5nbF9pbnRlcmFjdF9pbmZvcy5wdWJsaWNfa2V5fWBcblxuICAgICAgICAgIGlmICh0aGF0LmdsX2ludGVyYWN0X2luZm9zLmluZm9fbm9kZSAhPSAnaHR0cHM6Ly9yb290LmtleW1ldHJpY3MuaW8nKSB7XG4gICAgICAgICAgICBkYXNoYm9hcmRfdXJsID0gYCR7dGhhdC5nbF9pbnRlcmFjdF9pbmZvcy5pbmZvX25vZGV9LyMvci8ke3RoYXQuZ2xfaW50ZXJhY3RfaW5mb3MucHVibGljX2tleX1gXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KCclcyBQTTIrIGFjdGl2YXRlZCB8IEluc3RhbmNlIE5hbWU6ICVzIHwgRGFzaDogJXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFsay5ncmVlbi5ib2xkKCfih4YnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbGsuYm9sZCh0aGF0LmdsX2ludGVyYWN0X2luZm9zLm1hY2hpbmVfbmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNoYWxrLmJvbGQoZGFzaGJvYXJkX3VybCkpXG4gICAgICAgIH1cbiAgICAgICAgVVgubGlzdChsaXN0LCBzeXNfaW5mb3MpO1xuICAgICAgICAvL0NvbW1vbi5wcmludE91dChjaGFsay53aGl0ZS5pdGFsaWMoJyBVc2UgYHBtMiBzaG93IDxpZHxuYW1lPmAgdG8gZ2V0IG1vcmUgZGV0YWlscyBhYm91dCBhbiBhcHAnKSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGF0LkNsaWVudC5kYWVtb25fbW9kZSA9PSBmYWxzZSkge1xuICAgICAgICBDb21tb24ucHJpbnRPdXQoJ1stLW5vLWRhZW1vbl0gQ29udGludWUgdG8gc3RyZWFtIGxvZ3MnKTtcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KCdbLS1uby1kYWVtb25dIEV4aXQgb24gdGFyZ2V0IFBNMiBleGl0IHBpZD0nICsgZnMucmVhZEZpbGVTeW5jKGNvbmYuUE0yX1BJRF9GSUxFX1BBVEgpLnRvU3RyaW5nKCkpO1xuICAgICAgICBnbG9iYWxbXCJfYXV0b19leGl0XCJdID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoYXQuc3RyZWFtTG9ncygnYWxsJywgMCwgZmFsc2UsICdISDptbTpzcycsIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIC8vIGlmIChwcm9jZXNzLnN0ZG91dC5pc1RUWSkgaWYgbG9va2luZyBmb3Igc3RhcnQgbG9nc1xuICAgICAgZWxzZSBpZiAoIXByb2Nlc3MuZW52LlRSQVZJUyAmJiBwcm9jZXNzLmVudi5OT0RFX0VOViAhPSAndGVzdCcgJiYgYWN0ZWQubGVuZ3RoID4gMCAmJiAoY29tbWFuZGVyLmF0dGFjaCA9PT0gdHJ1ZSkpIHtcbiAgICAgICAgQ29tbW9uLmluZm8oYExvZyBzdHJlYW1pbmcgYXBwcyBpZDogJHtjaGFsay5jeWFuKGFjdGVkLmpvaW4oJyAnKSl9LCBleGl0IHdpdGggQ3RybC1DIG9yIHdpbGwgZXhpdCBpbiAxMHNlY3NgKVxuXG4gICAgICAgIC8vIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAvLyAgIENvbW1vbi5pbmZvKGBMb2cgc3RyZWFtaW5nIGV4aXRlZCBhdXRvbWF0aWNhbGx5LCBydW4gJ3BtMiBsb2dzJyB0byBjb250aW51ZSB3YXRjaGluZyBsb2dzYClcbiAgICAgICAgLy8gICByZXR1cm4gdGhhdC5leGl0Q2xpKGNvZGUgPyBjb2RlIDogY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAvLyB9LCAxMDAwMClcblxuICAgICAgICByZXR1cm4gYWN0ZWQuZm9yRWFjaCgocHJvY19uYW1lKSA9PiB7XG4gICAgICAgICAgdGhhdC5zdHJlYW1Mb2dzKHByb2NfbmFtZSwgMCwgZmFsc2UsIG51bGwsIGZhbHNlKTtcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNvZGUgPyBjb2RlIDogY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTY2FsZSB1cC9kb3duIGEgcHJvY2Vzc1xuICAgKiBAbWV0aG9kIHNjYWxlXG4gICAqL1xuICBzY2FsZSAoYXBwX25hbWUsIG51bWJlciwgY2I/KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gYWRkUHJvY3MocHJvYywgdmFsdWUsIGNiKSB7XG4gICAgICAoZnVuY3Rpb24gZXgocHJvYywgbnVtYmVyKSB7XG4gICAgICAgIGlmIChudW1iZXItLSA9PT0gMCkgcmV0dXJuIGNiKCk7XG4gICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnU2NhbGluZyB1cCBhcHBsaWNhdGlvbicpO1xuICAgICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdkdXBsaWNhdGVQcm9jZXNzSWQnLCBwcm9jLnBtMl9lbnYucG1faWQsIGV4LmJpbmQodGhpcywgcHJvYywgbnVtYmVyKSk7XG4gICAgICB9KShwcm9jLCBudW1iZXIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJtUHJvY3MocHJvY3MsIHZhbHVlLCBjYikge1xuICAgICAgdmFyIGkgPSAwO1xuXG4gICAgICAoZnVuY3Rpb24gZXgocHJvY3MsIG51bWJlcikge1xuICAgICAgICBpZiAobnVtYmVyKysgPT09IDApIHJldHVybiBjYigpO1xuICAgICAgICB0aGF0Ll9vcGVyYXRlKCdkZWxldGVQcm9jZXNzSWQnLCBwcm9jc1tpKytdLnBtMl9lbnYucG1faWQsIGV4LmJpbmQodGhpcywgcHJvY3MsIG51bWJlcikpO1xuICAgICAgfSkocHJvY3MsIG51bWJlcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZW5kKCkge1xuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwge3N1Y2Nlc3M6dHJ1ZX0pIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICB9XG5cbiAgICB0aGlzLkNsaWVudC5nZXRQcm9jZXNzQnlOYW1lKGFwcF9uYW1lLCBmdW5jdGlvbihlcnIsIHByb2NzKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFwcm9jcyB8fCBwcm9jcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdBcHBsaWNhdGlvbiAlcyBub3QgZm91bmQnLCBhcHBfbmFtZSk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcignQXBwIG5vdCBmb3VuZCcpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcHJvY19udW1iZXIgPSBwcm9jcy5sZW5ndGg7XG5cbiAgICAgIGlmICh0eXBlb2YobnVtYmVyKSA9PT0gJ3N0cmluZycgJiYgbnVtYmVyLmluZGV4T2YoJysnKSA+PSAwKSB7XG4gICAgICAgIG51bWJlciA9IHBhcnNlSW50KG51bWJlciwgMTApO1xuICAgICAgICByZXR1cm4gYWRkUHJvY3MocHJvY3NbMF0sIG51bWJlciwgZW5kKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHR5cGVvZihudW1iZXIpID09PSAnc3RyaW5nJyAmJiBudW1iZXIuaW5kZXhPZignLScpID49IDApIHtcbiAgICAgICAgbnVtYmVyID0gcGFyc2VJbnQobnVtYmVyLCAxMCk7XG4gICAgICAgIHJldHVybiBybVByb2NzKHByb2NzWzBdLCBudW1iZXIsIGVuZCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgbnVtYmVyID0gcGFyc2VJbnQobnVtYmVyLCAxMCk7XG4gICAgICAgIG51bWJlciA9IG51bWJlciAtIHByb2NfbnVtYmVyO1xuXG4gICAgICAgIGlmIChudW1iZXIgPCAwKVxuICAgICAgICAgIHJldHVybiBybVByb2NzKHByb2NzLCBudW1iZXIsIGVuZCk7XG4gICAgICAgIGVsc2UgaWYgKG51bWJlciA+IDApXG4gICAgICAgICAgcmV0dXJuIGFkZFByb2NzKHByb2NzWzBdLCBudW1iZXIsIGVuZCk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnTm90aGluZyB0byBkbycpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcignU2FtZSBwcm9jZXNzIG51bWJlcicpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBkZXNjcmliZVByb2Nlc3NcbiAgICogQHBhcmFtIHt9IHBtMl9pZFxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBkZXNjcmliZSAocG0yX2lkLCBjYj8pIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICAgIHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICBsaXN0LmZvckVhY2goZnVuY3Rpb24ocHJvYykge1xuICAgICAgICBpZiAoKCFpc05hTihwbTJfaWQpICAgICYmIHByb2MucG1faWQgPT0gcG0yX2lkKSB8fFxuICAgICAgICAgICh0eXBlb2YocG0yX2lkKSA9PT0gJ3N0cmluZycgJiYgcHJvYy5uYW1lICA9PSBwbTJfaWQpKSB7XG4gICAgICAgICAgZm91bmRfcHJvYy5wdXNoKHByb2MpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKGZvdW5kX3Byb2MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19XQVJOSU5HICsgJyVzIGRvZXNuXFwndCBleGlzdCcsIHBtMl9pZCk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIFtdKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWNiKSB7XG4gICAgICAgIGZvdW5kX3Byb2MuZm9yRWFjaChmdW5jdGlvbihwcm9jKSB7XG4gICAgICAgICAgVVguZGVzY3JpYmUocHJvYyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBmb3VuZF9wcm9jKSA6IHRoYXQuZXhpdENsaShjb25mLlNVQ0NFU1NfRVhJVCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQVBJIG1ldGhvZCB0byBwZXJmb3JtIGEgZGVlcCB1cGRhdGUgb2YgUE0yXG4gICAqIEBtZXRob2QgZGVlcFVwZGF0ZVxuICAgKi9cbiAgZGVlcFVwZGF0ZSAoY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1VwZGF0aW5nIFBNMi4uLicpO1xuXG4gICAgdmFyIGNoaWxkOiBhbnkgPSBzZXhlYyhcIm5wbSBpIC1nIHBtMkBsYXRlc3Q7IHBtMiB1cGRhdGVcIik7XG5cbiAgICBjaGlsZC5zdGRvdXQub24oJ2VuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdQTTIgc3VjY2Vzc2Z1bGx5IHVwZGF0ZWQnKTtcbiAgICAgIGNiID8gY2IobnVsbCwge3N1Y2Nlc3M6dHJ1ZX0pIDogdGhhdC5leGl0Q2xpKGNvbmYuU1VDQ0VTU19FWElUKTtcbiAgICB9KTtcbiAgfVxufTtcblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIExvYWQgYWxsIEFQSSBtZXRob2RzIC8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5BUElFeHRyYShBUEkpO1xuQVBJRGVwbG95KEFQSSk7XG5BUElNb2R1bGUoQVBJKTtcblxuQVBJUGx1c0xpbmsoQVBJKTtcbkFQSVBsdXNQcm9jZXNzKEFQSSk7XG5BUElQbHVzSGVscGVyKEFQSSk7XG5cbkFQSUNvbmZpZyhBUEkpO1xuQVBJVmVyc2lvbihBUEkpO1xuQVBJU3RhcnR1cChBUEkpO1xuQVBJTWdudChBUEkpO1xuQVBJQ29udGFpbmVyKEFQSSk7XG5cbmV4cG9ydCBkZWZhdWx0IEFQSTtcbiJdfQ==