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
      var crypto = require('crypto');

      var random_file = crypto.randomBytes(8).toString('hex');
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
              var json5 = require("./tools/json5.js");

              try {
                that.gl_interact_infos = json5.parse(_conf.toString());
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
            console.log('Last refresh: ', dayjs().format());
            that.Client.executeRemote('getMonitorData', {}, function (err, list) {
              _UX["default"].list(list, null);
            });
          };

          var dayjs = require('dayjs');

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

        if (tree === true) {
          var treeify = require("./tools/treeify.js");

          console.log(treeify.asTree(sys_infos, true));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9BUEkudHMiXSwibmFtZXMiOlsiZGVidWciLCJJTU1VVEFCTEVfTVNHIiwiY2hhbGsiLCJib2xkIiwiYmx1ZSIsImNvbmYiLCJjc3QiLCJBUEkiLCJvcHRzIiwidGhhdCIsImRhZW1vbl9tb2RlIiwicG0yX2hvbWUiLCJQTTJfUk9PVF9QQVRIIiwicHVibGljX2tleSIsIlBVQkxJQ19LRVkiLCJzZWNyZXRfa2V5IiwiU0VDUkVUX0tFWSIsIm1hY2hpbmVfbmFtZSIsIk1BQ0hJTkVfTkFNRSIsImN3ZCIsInByb2Nlc3MiLCJwYXRoIiwicmVzb2x2ZSIsImluZGVwZW5kZW50IiwiRXJyb3IiLCJ1dGlsIiwiaW5oZXJpdHMiLCJJU19XSU5ET1dTIiwiY3J5cHRvIiwicmVxdWlyZSIsInJhbmRvbV9maWxlIiwicmFuZG9tQnl0ZXMiLCJ0b1N0cmluZyIsImpvaW4iLCJfY29uZiIsIkNsaWVudCIsInBtMl9jb25maWd1cmF0aW9uIiwiQ29uZmlndXJhdGlvbiIsImdldFN5bmMiLCJnbF9pbnRlcmFjdF9pbmZvcyIsImdsX2lzX2ttX2xpbmtlZCIsInBpZCIsImZzIiwicmVhZEZpbGVTeW5jIiwiSU5URVJBQ1RPUl9QSURfUEFUSCIsInBhcnNlSW50IiwidHJpbSIsImtpbGwiLCJlIiwiZW52IiwiTk9ERV9FTlYiLCJLTURhZW1vbiIsInBpbmciLCJlcnIiLCJyZXN1bHQiLCJyZWFkRmlsZSIsIklOVEVSQUNUSU9OX0NPTkYiLCJKU09OIiwicGFyc2UiLCJqc29uNSIsImNvbnNvbGUiLCJlcnJvciIsImdsX3JldHJ5Iiwibm9EYWVtb24iLCJjYiIsInN0YXJ0X3RpbWVyIiwiRGF0ZSIsInN0YXJ0IiwibWV0YSIsIm5ld19wbTJfaW5zdGFuY2UiLCJsYXVuY2hBbGwiLCJlcnJfbW9kIiwia2lsbERhZW1vbiIsImNtZCIsInRlc3RfcGF0aCIsInRlc3RfcGF0aF8yIiwiaW5kZXhPZiIsImFjY2VzcyIsImNvbnN0YW50cyIsIlJfT0siLCJjbG9zZSIsImRhdGEiLCJkaXNjb25uZWN0IiwibGF1bmNoQnVzIiwiY29kZSIsIlBNMl9QUk9HUkFNTUFUSUMiLCJQTTJfVVNBR0UiLCJkaXNjb25uZWN0UlBDIiwiZmRzIiwidHJ5VG9FeGl0IiwiZXhpdCIsInN0ZG91dCIsInN0ZGVyciIsImZvckVhY2giLCJzdGQiLCJmZCIsImJ1ZmZlclNpemUiLCJ3cml0ZSIsInNlbXZlciIsImx0IiwidmVyc2lvbiIsIkNvbW1vbiIsInByaW50T3V0IiwiUFJFRklYX01TR19XQVJOSU5HIiwiaXNBcnJheSIsIndhdGNoIiwibGVuZ3RoIiwicmF3QXJncyIsImFyZ3YiLCJpc0NvbmZpZ0ZpbGUiLCJfc3RhcnRKc29uIiwicHJvY3MiLCJzcGVlZExpc3QiLCJfc3RhcnRTY3JpcHQiLCJwcm9jZXNzX25hbWUiLCJwcm9jZXNzSWRzIiwiaWRzIiwiQ09OQ1VSUkVOVF9BQ1RJT05TIiwiaWQiLCJuZXh0IiwiZXhlY3V0ZVJlbW90ZSIsInJlcyIsIlBSRUZJWF9NU0ciLCJyZXRFcnIiLCJzdWNjZXNzIiwiZ2V0QWxsUHJvY2Vzc0lkIiwicHJpbnRFcnJvciIsImV4aXRDbGkiLCJFUlJPUl9FWElUIiwiaXNOYU4iLCJnZXRQcm9jZXNzSWRCeU5hbWUiLCJnZXRWZXJzaW9uIiwibmV3X3ZlcnNpb24iLCJwa2ciLCJkdCIsIl9fZGlybmFtZSIsIlBNMl9VUERBVEUiLCJsb2ciLCJkdW1wIiwiYXJndW1lbnRzIiwibGF1bmNoRGFlbW9uIiwiaW50ZXJhY3RvciIsImNoaWxkIiwibGF1bmNoUlBDIiwicmVzdXJyZWN0IiwibGF1bmNoQW5kSW50ZXJhY3QiLCJwbTJfdmVyc2lvbiIsImludGVyYWN0b3JfcHJvYyIsInNldFRpbWVvdXQiLCJkZWxheSIsImxvY2tSZWxvYWQiLCJmb3JjZSIsIlBSRUZJWF9NU0dfRVJSIiwiTWF0aCIsImZsb29yIiwiUkVMT0FEX0xPQ0tfVElNRU9VVCIsImFwcHMiLCJ1bmxvY2tSZWxvYWQiLCJTVUNDRVNTX0VYSVQiLCJ1cGRhdGVFbnYiLCJfb3BlcmF0ZSIsInN0ZGluIiwicmVzdW1lIiwic2V0RW5jb2RpbmciLCJvbiIsInBhcmFtIiwicGF1c2UiLCJhY3Rpb25Gcm9tSnNvbiIsImpzb25WaWEiLCJjb21tYW5kZXIiLCJsaXN0Iiwic2hvdyIsImRheWpzIiwiZm9ybWF0IiwiVVgiLCJzZXRJbnRlcnZhbCIsIlBNMl9TVEFUVVMiLCJQTTJfU0lMRU5UIiwia2lsbEFnZW50Iiwic2NyaXB0IiwiYXBwX2NvbmYiLCJDb25maWciLCJmaWx0ZXJPcHRpb25zIiwiYXBwQ29uZiIsIm5hbWUiLCJhcmdzIiwiYXJnc0luZGV4Iiwic2xpY2UiLCJzY3JpcHRBcmdzIiwibmFtZXNwYWNlIiwidmVyaWZ5Q29uZnMiLCJ3YXRjaERlbGF5Iiwid2F0Y2hfZGVsYXkiLCJwYXJzZUZsb2F0IiwibWFzIiwiZXh0IiwiaGYiLCJtYWtlX2F2YWlsYWJsZV9leHRlbnNpb24iLCJpZ25vcmVfd2F0Y2giLCJkc3RfcGF0aCIsIlBXRCIsIndyaXRlRmlsZVN5bmMiLCJzdHJpbmdpZnkiLCJzdGFjayIsInJlc3RhcnRFeGlzdGluZ1Byb2Nlc3NOYW1lIiwicmVzdGFydEV4aXN0aW5nTmFtZVNwYWNlIiwicmVzdGFydEV4aXN0aW5nUHJvY2Vzc0lkIiwicmVzdGFydEV4aXN0aW5nUHJvY2Vzc1BhdGhPclN0YXJ0TmV3IiwicmV0IiwiX2R0IiwidW5kZWZpbmVkIiwiZXh0bmFtZSIsImdldFByb2Nlc3NJZHNCeU5hbWVzcGFjZSIsImZ1bGxfcGF0aCIsIm1hbmFnZWRfc2NyaXB0IiwicHJvYyIsInBtMl9lbnYiLCJwbV9leGVjX3BhdGgiLCJzdGF0dXMiLCJTVE9QUEVEX1NUQVRVUyIsIlNUT1BQSU5HX1NUQVRVUyIsIkVSUk9SRURfU1RBVFVTIiwiYXBwX25hbWUiLCJyZXNvbHZlZF9wYXRocyIsInJlc29sdmVBcHBBdHRyaWJ1dGVzIiwibWVzc2FnZSIsImluc3RhbmNlcyIsImV4ZWNfbW9kZSIsImFkZGl0aW9uYWxfZW52IiwiTW9kdWxhcml6ZXIiLCJnZXRBZGRpdGlvbmFsQ29uZiIsImttX2xpbmsiLCJmaWxlIiwiYWN0aW9uIiwicGlwZSIsImNvbmZpZyIsInN0YXRpY0NvbmYiLCJkZXBsb3lDb25mIiwiYXBwc19pbmZvIiwicGFyc2VDb25maWciLCJpc0Fic29sdXRlIiwiZmlsZV9wYXRoIiwiZGVwbG95IiwicG0yIiwiQXJyYXkiLCJQTTJfSlNPTl9QUk9DRVNTSU5HIiwiYXBwc19uYW1lIiwicHJvY19saXN0Iiwic2VydmUiLCJwdXNoIiwicG9ydCIsIlBNMl9TRVJWRV9QT1JUIiwiUE0yX1NFUlZFX0hPU1QiLCJob3N0IiwiUE0yX1NFUlZFX1BBVEgiLCJQTTJfU0VSVkVfU1BBIiwic3BhIiwiUE0yX1NFUlZFX0RJUkVDVE9SWSIsImRpcmVjdG9yeSIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIIiwiYmFzaWNfYXV0aCIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIX1VTRVJOQU1FIiwidXNlcm5hbWUiLCJQTTJfU0VSVkVfQkFTSUNfQVVUSF9QQVNTV09SRCIsInBhc3N3b3JkIiwiUE0yX1NFUlZFX01PTklUT1IiLCJtb25pdG9yIiwiYXBwIiwiaW8iLCJvbmx5Iiwic3BsaXQiLCJpbnN0YWxsX3VybCIsInVpZCIsImdpZCIsImFwcGVuZF9lbnZfdG9fbmFtZSIsIm5hbWVfcHJlZml4IiwiZ2V0Q3VycmVudFVzZXJuYW1lIiwicmF3X3Byb2NfbGlzdCIsIk9iamVjdCIsImtleXMiLCJwcm9jX25hbWUiLCJmaWx0ZXIiLCJlbnZzIiwibWFwIiwibWVyZ2VFbnZpcm9ubWVudFZhcmlhYmxlcyIsInJlZHVjZSIsImUxIiwiZTIiLCJjb25jYXQiLCJub3RpZnlHb2QiLCJzcGxpY2UiLCJzdGFydEFwcHMiLCJhcHBfbmFtZV90b19zdGFydCIsImFwcHNfdG9fc3RhcnQiLCJhcHBzX3N0YXJ0ZWQiLCJhcHBzX2Vycm9yZWQiLCJpIiwiZm9yY2VfbmFtZSIsInN0YXJ0ZWRfYXNfbW9kdWxlIiwicG14X21vZHVsZSIsImN1cnJlbnRfY29uZiIsIndhaXRfcmVhZHkiLCJ3YXJuIiwiZmluYWxfZXJyb3IiLCJyZXRfcHJvY2Vzc2VzIiwibmV4dDEiLCJuZXdfZW52IiwiYmFzZW5hbWUiLCJuZXh0VGljayIsIm5leHQyIiwiYWN0aW9uX25hbWUiLCJ1cGRhdGVfZW52IiwiY29uY3VycmVudF9hY3Rpb25zIiwicGFyYWxsZWwiLCJjb21tYW5kcyIsIl9oYW5kbGVBdHRyaWJ1dGVVcGRhdGUiLCJzYWZlRXh0ZW5kIiwiayIsImNyb25fcmVzdGFydCIsInBtX2lkIiwicmVzdGFydF90aW1lIiwicmVvcGVyYXRlIiwiZm4iLCJnZXRBbGxQcm9jZXNzSWRXaXRob3V0TW9kdWxlcyIsInJlZ2V4IiwiUmVnRXhwIiwicmVwbGFjZSIsImZvdW5kX3Byb2MiLCJ0ZXN0IiwiYWxsb3dfbW9kdWxlX3Jlc3RhcnQiLCJuc19wcm9jZXNzX2lkcyIsIm5zX2FkZGl0aW9uYWxfZW52IiwiZG9ja2VyIiwiaGlnaGVyX2lkIiwicCIsIkRvY2tlck1nbXQiLCJwcm9jZXNzQ29tbWFuZCIsIlBNMl9ERUVQX01PTklUT1JJTkciLCJkZWVwX21vbml0b3JpbmciLCJ0cmVla2lsbCIsInBteCIsInZpemlvbiIsImF1dG9tYXRpb24iLCJhdXRvcmVzdGFydCIsImluc3BlY3QiLCJ0cmVlIiwic3lzX2luZm9zIiwidHJlZWlmeSIsImFzVHJlZSIsImFwcHNfYWN0ZWQiLCJzeXN0ZW1kYXRhIiwiYWN0ZWQiLCJkb0xpc3QiLCJiaW5kIiwiaXNUVFkiLCJsaXN0X21pbiIsIm1pbmlMaXN0Iiwic2lsZW50IiwiZGFzaGJvYXJkX3VybCIsImluZm9fbm9kZSIsImdyZWVuIiwiUE0yX1BJRF9GSUxFX1BBVEgiLCJnbG9iYWwiLCJzdHJlYW1Mb2dzIiwiVFJBVklTIiwiYXR0YWNoIiwiaW5mbyIsImN5YW4iLCJudW1iZXIiLCJhZGRQcm9jcyIsInZhbHVlIiwiZXgiLCJybVByb2NzIiwiZW5kIiwiZ2V0UHJvY2Vzc0J5TmFtZSIsInByb2NfbnVtYmVyIiwicG0yX2lkIiwiZGVzY3JpYmUiXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQUtBOzs7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QVlBLEdBQVo7QUFDQSxpQ0FBZUEsR0FBZjtBQUNBLHlCQUFjQSxHQUFkO0FBRUEsZ0NBQVVBLEdBQVY7QUFDQSx5QkFBV0EsR0FBWDtBQUNBLHlCQUFXQSxHQUFYO0FBQ0EsK0JBQVFBLEdBQVI7QUFDQSwrQkFBYUEsR0FBYjtlQUVlQSxHIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgbGljZW5zZSB0aGF0XG4gKiBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgY29tbWFuZGVyIGZyb20gJ2NvbW1hbmRlcic7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZWFjaExpbWl0IGZyb20gJ2FzeW5jL2VhY2hMaW1pdCc7XG5pbXBvcnQgc2VyaWVzIGZyb20gJ2FzeW5jL3Nlcmllcyc7XG5pbXBvcnQgZGVidWdMb2dnZXIgZnJvbSAnZGVidWcnO1xuaW1wb3J0IHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IGZjbG9uZSBmcm9tICdmY2xvbmUnO1xuXG5pbXBvcnQgRG9ja2VyTWdtdCBmcm9tICcuL0FQSS9FeHRyYU1nbXQvRG9ja2VyJztcbmltcG9ydCBjc3QgZnJvbSAnLi4vY29uc3RhbnRzJztcbmltcG9ydCBDbGllbnQgZnJvbSAnLi9DbGllbnQnO1xuaW1wb3J0IENvbW1vbiBmcm9tICcuL0NvbW1vbic7XG5pbXBvcnQgS01EYWVtb24gZnJvbSAnQHBtMi9hZ2VudC9zcmMvSW50ZXJhY3RvckNsaWVudCc7XG5pbXBvcnQgQ29uZmlnIGZyb20gJy4vdG9vbHMvQ29uZmlnJztcbmltcG9ydCBNb2R1bGFyaXplciBmcm9tICcuL0FQSS9Nb2R1bGVzL01vZHVsYXJpemVyJztcbmltcG9ydCBwYXRoX3N0cnVjdHVyZSBmcm9tICcuLi9wYXRocyc7XG5pbXBvcnQgVVggZnJvbSAnLi9BUEkvVVgnO1xuaW1wb3J0IHBrZyBmcm9tICcuLi9wYWNrYWdlLmpzb24nO1xuaW1wb3J0IGhmIGZyb20gJy4vQVBJL01vZHVsZXMvZmxhZ0V4dCc7XG5pbXBvcnQgQ29uZmlndXJhdGlvbiBmcm9tICcuL0NvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHNleGVjIGZyb20gJy4vdG9vbHMvc2V4ZWMnO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gTG9hZCBhbGwgQVBJIG1ldGhvZHMgLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmltcG9ydCBBUElFeHRyYSBmcm9tICcuL0FQSS9FeHRyYSc7XG5pbXBvcnQgQVBJRGVwbG95IGZyb20gJy4vQVBJL0RlcGxveSc7XG5pbXBvcnQgQVBJTW9kdWxlIGZyb20gJy4vQVBJL01vZHVsZXMvaW5kZXgnO1xuXG5pbXBvcnQgQVBJUGx1c0xpbmsgZnJvbSAnLi9BUEkvcG0yLXBsdXMvbGluayc7XG5pbXBvcnQgQVBJUGx1c1Byb2Nlc3MgZnJvbSAnLi9BUEkvcG0yLXBsdXMvcHJvY2Vzcy1zZWxlY3Rvcic7XG5pbXBvcnQgQVBJUGx1c0hlbHBlciBmcm9tICcuL0FQSS9wbTItcGx1cy9oZWxwZXJzJztcblxuaW1wb3J0IEFQSUNvbmZpZyBmcm9tICcuL0FQSS9Db25maWd1cmF0aW9uJztcbmltcG9ydCBBUElWZXJzaW9uIGZyb20gJy4vQVBJL1ZlcnNpb24nO1xuaW1wb3J0IEFQSVN0YXJ0dXAgZnJvbSAnLi9BUEkvU3RhcnR1cCc7XG5pbXBvcnQgQVBJTWdudCBmcm9tICcuL0FQSS9Mb2dNYW5hZ2VtZW50JztcbmltcG9ydCBBUElDb250YWluZXIgZnJvbSAnLi9BUEkvQ29udGFpbmVyaXplcic7XG5cbnZhciBkZWJ1ZyA9IGRlYnVnTG9nZ2VyKCdwbTI6Y2xpJyk7XG52YXIgSU1NVVRBQkxFX01TRyA9IGNoYWxrLmJvbGQuYmx1ZSgnVXNlIC0tdXBkYXRlLWVudiB0byB1cGRhdGUgZW52aXJvbm1lbnQgdmFyaWFibGVzJyk7XG5cbnZhciBjb25mID0gY3N0XG5cbi8qKlxuICogTWFpbiBGdW5jdGlvbiB0byBiZSBpbXBvcnRlZFxuICogY2FuIGJlIGFsaWFzZWQgdG8gUE0yXG4gKlxuICogVG8gdXNlIGl0IHdoZW4gUE0yIGlzIGluc3RhbGxlZCBhcyBhIG1vZHVsZTpcbiAqXG4gKiB2YXIgUE0yID0gcmVxdWlyZSgncG0yJyk7XG4gKlxuICogdmFyIHBtMiA9IFBNMig8b3B0cz4pO1xuICpcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gIG9wdHNcbiAqIEBwYXJhbSB7U3RyaW5nfSAgW29wdHMuY3dkPTxjdXJyZW50Pl0gICAgICAgICBvdmVycmlkZSBwbTIgY3dkIGZvciBzdGFydGluZyBzY3JpcHRzXG4gKiBAcGFyYW0ge1N0cmluZ30gIFtvcHRzLnBtMl9ob21lPVs8cGF0aHMuanM+XV0gcG0yIGRpcmVjdG9yeSBmb3IgbG9nLCBwaWRzLCBzb2NrZXQgZmlsZXNcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdHMuaW5kZXBlbmRlbnQ9ZmFsc2VdICAgICB1bmlxdWUgUE0yIGluc3RhbmNlIChyYW5kb20gcG0yX2hvbWUpXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRzLmRhZW1vbl9tb2RlPXRydWVdICAgICAgc2hvdWxkIGJlIGNhbGxlZCBpbiB0aGUgc2FtZSBwcm9jZXNzIG9yIG5vdFxuICogQHBhcmFtIHtTdHJpbmd9ICBbb3B0cy5wdWJsaWNfa2V5PW51bGxdICAgICAgIHBtMiBwbHVzIGJ1Y2tldCBwdWJsaWMga2V5XG4gKiBAcGFyYW0ge1N0cmluZ30gIFtvcHRzLnNlY3JldF9rZXk9bnVsbF0gICAgICAgcG0yIHBsdXMgYnVja2V0IHNlY3JldCBrZXlcbiAqIEBwYXJhbSB7U3RyaW5nfSAgW29wdHMubWFjaGluZV9uYW1lPW51bGxdICAgICBwbTIgcGx1cyBpbnN0YW5jZSBuYW1lXG4gKi9cbmNsYXNzIEFQSSB7XG5cbiAgZGFlbW9uX21vZGU6IGJvb2xlYW47XG4gIHBtMl9ob21lOiBzdHJpbmc7XG4gIHB1YmxpY19rZXk6IHN0cmluZztcbiAgc2VjcmV0X2tleTogc3RyaW5nO1xuICBtYWNoaW5lX25hbWU6IHN0cmluZztcblxuICBjd2Q6IHN0cmluZztcblxuICBfY29uZjogYW55O1xuXG4gIENsaWVudDogYW55O1xuICBwbTJfY29uZmlndXJhdGlvbjogYW55O1xuICBnbF9pbnRlcmFjdF9pbmZvczogYW55O1xuICBnbF9pc19rbV9saW5rZWQ6IGJvb2xlYW47XG5cbiAgZ2xfcmV0cnk6IG51bWJlcjtcblxuICAgIHN0YXJ0X3RpbWVyOiBEYXRlO1xuICBraWxsQWdlbnQ6IChjYikgPT4gdm9pZDtcbiAgbGF1bmNoQWxsOiAoZGF0YSwgY2IpID0+IHZvaWQ7XG4gIGdldFZlcnNpb246IChlcnIsIHJlcz8pID0+IHZvaWQ7XG4gIGR1bXA6IChlcnIpID0+IHZvaWQ7XG4gIHJlc3VycmVjdDogKGVycj8pID0+IHZvaWQ7XG5cbiAgc3RyZWFtTG9nczogKGEsIGIsIGMsIGQsIGUpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IgKG9wdHM/KSB7XG4gICAgaWYgKCFvcHRzKSBvcHRzID0ge307XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdGhpcy5kYWVtb25fbW9kZSA9IHR5cGVvZihvcHRzLmRhZW1vbl9tb2RlKSA9PSAndW5kZWZpbmVkJyA/IHRydWUgOiBvcHRzLmRhZW1vbl9tb2RlO1xuICAgIHRoaXMucG0yX2hvbWUgPSBjb25mLlBNMl9ST09UX1BBVEg7XG4gICAgdGhpcy5wdWJsaWNfa2V5ID0gY29uZi5QVUJMSUNfS0VZIHx8IG9wdHMucHVibGljX2tleSB8fCBudWxsO1xuICAgIHRoaXMuc2VjcmV0X2tleSA9IGNvbmYuU0VDUkVUX0tFWSB8fCBvcHRzLnNlY3JldF9rZXkgfHwgbnVsbDtcbiAgICB0aGlzLm1hY2hpbmVfbmFtZSA9IGNvbmYuTUFDSElORV9OQU1FIHx8IG9wdHMubWFjaGluZV9uYW1lIHx8IG51bGxcblxuICAgIC8qKlxuICAgICAqIENXRCByZXNvbHV0aW9uXG4gICAgICovXG4gICAgdGhpcy5jd2QgPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGlmIChvcHRzLmN3ZCkge1xuICAgICAgdGhpcy5jd2QgPSBwYXRoLnJlc29sdmUob3B0cy5jd2QpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBNMiBIT01FIHJlc29sdXRpb25cbiAgICAgKi9cbiAgICBpZiAob3B0cy5wbTJfaG9tZSAmJiBvcHRzLmluZGVwZW5kZW50ID09IHRydWUpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBjYW5ub3Qgc2V0IGEgcG0yX2hvbWUgYW5kIGluZGVwZW5kZW50IGluc3RhbmNlIGluIHNhbWUgdGltZScpO1xuXG4gICAgaWYgKG9wdHMucG0yX2hvbWUpIHtcbiAgICAgIC8vIE92ZXJyaWRlIGRlZmF1bHQgY29uZiBmaWxlXG4gICAgICB0aGlzLnBtMl9ob21lID0gb3B0cy5wbTJfaG9tZTtcbiAgICAgIGNvbmYgPSB1dGlsLmluaGVyaXRzKGNvbmYsIHBhdGhfc3RydWN0dXJlKHRoaXMucG0yX2hvbWUpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAob3B0cy5pbmRlcGVuZGVudCA9PSB0cnVlICYmIGNvbmYuSVNfV0lORE9XUyA9PT0gZmFsc2UpIHtcbiAgICAgIC8vIENyZWF0ZSBhbiB1bmlxdWUgcG0yIGluc3RhbmNlXG4gICAgICBjb25zdCBjcnlwdG8gPSByZXF1aXJlKCdjcnlwdG8nKTtcbiAgICAgIHZhciByYW5kb21fZmlsZSA9IGNyeXB0by5yYW5kb21CeXRlcyg4KS50b1N0cmluZygnaGV4Jyk7XG4gICAgICB0aGlzLnBtMl9ob21lID0gcGF0aC5qb2luKCcvdG1wJywgcmFuZG9tX2ZpbGUpO1xuXG4gICAgICAvLyBJZiB3ZSBkb250IGV4cGxpY2l0bHkgdGVsbCB0byBoYXZlIGEgZGFlbW9uXG4gICAgICAvLyBJdCB3aWxsIGdvIGFzIGluIHByb2NcbiAgICAgIGlmICh0eXBlb2Yob3B0cy5kYWVtb25fbW9kZSkgPT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgIHRoaXMuZGFlbW9uX21vZGUgPSBmYWxzZTtcbiAgICAgIGNvbmYgPSB1dGlsLmluaGVyaXRzKGNvbmYsIHBhdGhfc3RydWN0dXJlKHRoaXMucG0yX2hvbWUpKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jb25mID0gY29uZjtcblxuICAgIGlmIChjb25mLklTX1dJTkRPV1MpIHtcbiAgICAgIC8vIFdlaXJkIGZpeCwgbWF5IG5lZWQgdG8gYmUgZHJvcHBlZFxuICAgICAgLy8gQHRvZG8gd2luZG93cyBjb25ub2lzc2V1ciBkb3VibGUgY2hlY2tcbiAgICAgIC8vIFRPRE86IHBsZWFzZSBjaGVjayB0aGlzXG4gICAgICAvLyBpZiAocHJvY2Vzcy5zdGRvdXQuX2hhbmRsZSAmJiBwcm9jZXNzLnN0ZG91dC5faGFuZGxlLnNldEJsb2NraW5nKVxuICAgICAgLy8gICBwcm9jZXNzLnN0ZG91dC5faGFuZGxlLnNldEJsb2NraW5nKHRydWUpO1xuICAgIH1cblxuICAgIHRoaXMuQ2xpZW50ID0gbmV3IENsaWVudCh7XG4gICAgICBwbTJfaG9tZTogdGhhdC5wbTJfaG9tZSxcbiAgICAgIGNvbmY6IHRoaXMuX2NvbmYsXG4gICAgICBzZWNyZXRfa2V5OiB0aGlzLnNlY3JldF9rZXksXG4gICAgICBwdWJsaWNfa2V5OiB0aGlzLnB1YmxpY19rZXksXG4gICAgICBkYWVtb25fbW9kZTogdGhpcy5kYWVtb25fbW9kZSxcbiAgICAgIG1hY2hpbmVfbmFtZTogdGhpcy5tYWNoaW5lX25hbWVcbiAgICB9KTtcblxuICAgIHRoaXMucG0yX2NvbmZpZ3VyYXRpb24gPSBDb25maWd1cmF0aW9uLmdldFN5bmMoJ3BtMicpIHx8IHt9XG5cbiAgICB0aGlzLmdsX2ludGVyYWN0X2luZm9zID0gbnVsbDtcbiAgICB0aGlzLmdsX2lzX2ttX2xpbmtlZCA9IGZhbHNlO1xuXG4gICAgdHJ5IHtcbiAgICAgIHZhciBwaWQ6IGFueSA9IGZzLnJlYWRGaWxlU3luYyhjb25mLklOVEVSQUNUT1JfUElEX1BBVEgpO1xuICAgICAgcGlkID0gcGFyc2VJbnQocGlkLnRvU3RyaW5nKCkudHJpbSgpKTtcbiAgICAgIHByb2Nlc3Mua2lsbChwaWQsIDApO1xuICAgICAgdGhhdC5nbF9pc19rbV9saW5rZWQgPSB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRoYXQuZ2xfaXNfa21fbGlua2VkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gRm9yIHRlc3RpbmcgcHVycG9zZXNcbiAgICBpZiAodGhpcy5zZWNyZXRfa2V5ICYmIHByb2Nlc3MuZW52Lk5PREVfRU5WID09ICdsb2NhbF90ZXN0JylcbiAgICAgIHRoYXQuZ2xfaXNfa21fbGlua2VkID0gdHJ1ZTtcblxuICAgIEtNRGFlbW9uLnBpbmcodGhpcy5fY29uZiwgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgIGlmICghZXJyICYmIHJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgICBmcy5yZWFkRmlsZShjb25mLklOVEVSQUNUSU9OX0NPTkYsIChlcnIsIF9jb25mKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnIpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHRoYXQuZ2xfaW50ZXJhY3RfaW5mb3MgPSBKU09OLnBhcnNlKF9jb25mLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgdmFyIGpzb241ID0gcmVxdWlyZSgnLi90b29scy9qc29uNS5qcycpXG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhhdC5nbF9pbnRlcmFjdF9pbmZvcyA9IGpzb241LnBhcnNlKF9jb25mLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICAgICAgICAgICAgICB0aGF0LmdsX2ludGVyYWN0X2luZm9zID0gbnVsbFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pXG5cbiAgICB0aGlzLmdsX3JldHJ5ID0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25uZWN0IHRvIFBNMlxuICAgKiBDYWxsaW5nIHRoaXMgY29tbWFuZCBpcyBub3cgb3B0aW9uYWxcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGJhY2sgb25jZSBwbTIgaXMgcmVhZHkgZm9yIGNvbW1hbmRzXG4gICAqL1xuICBjb25uZWN0IChub0RhZW1vbiwgY2I/KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoaXMuc3RhcnRfdGltZXIgPSBuZXcgRGF0ZSgpO1xuXG4gICAgaWYgKHR5cGVvZihjYikgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNiID0gbm9EYWVtb247XG4gICAgICBub0RhZW1vbiA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAobm9EYWVtb24gPT09IHRydWUpIHtcbiAgICAgIC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHkgd2l0aCBQTTIgMS54XG4gICAgICB0aGlzLkNsaWVudC5kYWVtb25fbW9kZSA9IGZhbHNlO1xuICAgICAgdGhpcy5kYWVtb25fbW9kZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuQ2xpZW50LnN0YXJ0KGZ1bmN0aW9uKGVyciwgbWV0YSkge1xuICAgICAgaWYgKGVycilcbiAgICAgICAgcmV0dXJuIGNiKGVycik7XG5cbiAgICAgIGlmIChtZXRhLm5ld19wbTJfaW5zdGFuY2UgPT0gZmFsc2UgJiYgdGhhdC5kYWVtb25fbW9kZSA9PT0gdHJ1ZSlcbiAgICAgICAgcmV0dXJuIGNiKGVyciwgbWV0YSk7XG5cbiAgICAgIC8vIElmIG5ldyBwbTIgaW5zdGFuY2UgaGFzIGJlZW4gcG9wcGVkXG4gICAgICAvLyBMYXVjaCBhbGwgbW9kdWxlc1xuICAgICAgdGhhdC5sYXVuY2hBbGwodGhhdCwgZnVuY3Rpb24oZXJyX21vZCkge1xuICAgICAgICByZXR1cm4gY2IoZXJyLCBtZXRhKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWZ1bGwgd2hlbiBjdXN0b20gUE0yIGNyZWF0ZWQgd2l0aCBpbmRlcGVuZGVudCBmbGFnIHNldCB0byB0cnVlXG4gICAqIFRoaXMgd2lsbCBjbGVhbnVwIHRoZSBuZXdseSBjcmVhdGVkIGluc3RhbmNlXG4gICAqIGJ5IHJlbW92aW5nIGZvbGRlciwga2lsbGluZyBQTTIgYW5kIHNvIG9uXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIGNhbGxiYWNrIG9uY2UgY2xlYW51cCBpcyBzdWNjZXNzZnVsbFxuICAgKi9cbiAgZGVzdHJveSAoY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBkZWJ1ZygnS2lsbGluZyBhbmQgZGVsZXRpbmcgY3VycmVudCBkZWFtb24nKTtcblxuICAgIHRoaXMua2lsbERhZW1vbihmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjbWQgPSAncm0gLXJmICcgKyB0aGF0LnBtMl9ob21lO1xuICAgICAgdmFyIHRlc3RfcGF0aCA9IHBhdGguam9pbih0aGF0LnBtMl9ob21lLCAnbW9kdWxlX2NvbmYuanNvbicpO1xuICAgICAgdmFyIHRlc3RfcGF0aF8yID0gcGF0aC5qb2luKHRoYXQucG0yX2hvbWUsICdwbTIucGlkJyk7XG5cbiAgICAgIGlmICh0aGF0LnBtMl9ob21lLmluZGV4T2YoJy5wbTInKSA+IC0xKVxuICAgICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdEZXN0cm95IGlzIG5vdCBhIGFsbG93ZWQgbWV0aG9kIG9uIC5wbTInKSk7XG5cbiAgICAgIGZzLmFjY2Vzcyh0ZXN0X3BhdGgsIGZzLmNvbnN0YW50cy5SX09LLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgIGRlYnVnKCdEZWxldGluZyB0ZW1wb3JhcnkgZm9sZGVyICVzJywgdGhhdC5wbTJfaG9tZSk7XG4gICAgICAgIHNleGVjKGNtZCwgY2IpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGlzY29ubmVjdCBmcm9tIFBNMiBpbnN0YW5jZVxuICAgKiBUaGlzIHdpbGwgYWxsb3cgeW91ciBzb2Z0d2FyZSB0byBleGl0IGJ5IGl0c2VsZlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2JdIG9wdGlvbmFsIGNhbGxiYWNrIG9uY2UgY29ubmVjdGlvbiBjbG9zZWRcbiAgICovXG4gIGRpc2Nvbm5lY3QgKGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICghY2IpIGNiID0gZnVuY3Rpb24oKSB7fTtcblxuICAgIHRoaXMuQ2xpZW50LmNsb3NlKGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgLy8gZGVidWcoJ1RoZSBzZXNzaW9uIGxhc3RlZCAlZHMnLCAobmV3IERhdGUoKSAtIHRoYXQuc3RhcnRfdGltZXIpIC8gMTAwMCk7XG4gICAgICByZXR1cm4gY2IoZXJyLCBkYXRhKTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQWxpYXMgb24gZGlzY29ubmVjdFxuICAgKiBAcGFyYW0gY2JcbiAgICovXG4gIGNsb3NlIChjYikge1xuICAgIHRoaXMuZGlzY29ubmVjdChjYik7XG4gIH1cblxuICAvKipcbiAgICogTGF1bmNoIG1vZHVsZXNcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGJhY2sgb25jZSBwbTIgaGFzIGxhdW5jaGVkIG1vZHVsZXNcbiAgICovXG4gIGxhdW5jaE1vZHVsZXMgKGNiKSB7XG4gICAgdGhpcy5sYXVuY2hBbGwodGhpcywgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZSBidXMgYWxsb3dpbmcgdG8gcmV0cmlldmUgdmFyaW91cyBwcm9jZXNzIGV2ZW50XG4gICAqIGxpa2UgbG9ncywgcmVzdGFydHMsIHJlbG9hZHNcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGJhY2sgY2FsbGVkIHdpdGggMXN0IHBhcmFtIGVyciBhbmQgMm5iIHBhcmFtIHRoZSBidXNcbiAgICovXG4gIGxhdW5jaEJ1cyAoY2IpIHtcbiAgICB0aGlzLkNsaWVudC5sYXVuY2hCdXMoY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4aXQgbWV0aG9kcyBmb3IgQVBJXG4gICAqIEBwYXJhbSB7SW50ZWdlcn0gY29kZSBleGl0IGNvZGUgZm9yIHRlcm1pbmFsXG4gICAqL1xuICBleGl0Q2xpIChjb2RlKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgLy8gRG8gbm90aGluZyBpZiBQTTIgY2FsbGVkIHByb2dyYW1tYXRpY2FsbHkgKGFsc28gaW4gc3BlZWRsaXN0KVxuICAgIGlmIChjb25mLlBNMl9QUk9HUkFNTUFUSUMgJiYgcHJvY2Vzcy5lbnYuUE0yX1VTQUdFICE9ICdDTEknKSByZXR1cm4gZmFsc2U7XG5cbiAgICBLTURhZW1vbi5kaXNjb25uZWN0UlBDKGZ1bmN0aW9uKCkge1xuICAgICAgdGhhdC5DbGllbnQuY2xvc2UoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvZGUgPSBjb2RlIHx8IDA7XG4gICAgICAgIC8vIFNhZmUgZXhpdHMgcHJvY2VzcyBhZnRlciBhbGwgc3RyZWFtcyBhcmUgZHJhaW5lZC5cbiAgICAgICAgLy8gZmlsZSBkZXNjcmlwdG9yIGZsYWcuXG4gICAgICAgIHZhciBmZHMgPSAwO1xuICAgICAgICAvLyBleGl0cyBwcm9jZXNzIHdoZW4gc3Rkb3V0ICgxKSBhbmQgc2R0ZXJyKDIpIGFyZSBib3RoIGRyYWluZWQuXG4gICAgICAgIGZ1bmN0aW9uIHRyeVRvRXhpdCgpIHtcbiAgICAgICAgICBpZiAoKGZkcyAmIDEpICYmIChmZHMgJiAyKSkge1xuICAgICAgICAgICAgLy8gZGVidWcoJ1RoaXMgY29tbWFuZCB0b29rICVkcyB0byBleGVjdXRlJywgKG5ldyBEYXRlKCkgLSB0aGF0LnN0YXJ0X3RpbWVyKSAvIDEwMDApO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KGNvZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIFtwcm9jZXNzLnN0ZG91dCwgcHJvY2Vzcy5zdGRlcnJdLmZvckVhY2goZnVuY3Rpb24oc3RkKSB7XG4gICAgICAgICAgdmFyIGZkID0gc3RkLmZkO1xuICAgICAgICAgIGlmICghc3RkLmJ1ZmZlclNpemUpIHtcbiAgICAgICAgICAgIC8vIGJ1ZmZlclNpemUgZXF1YWxzIDAgbWVhbnMgY3VycmVudCBzdHJlYW0gaXMgZHJhaW5lZC5cbiAgICAgICAgICAgIGZkcyA9IGZkcyB8IGZkO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBlbmRzIG5vdGhpbmcgdG8gdGhlIHN0ZCBxdWV1ZSwgYnV0IHdpbGwgdHJpZ2dlciBgdHJ5VG9FeGl0YCBldmVudCBvbiBgZHJhaW5gLlxuICAgICAgICAgICAgc3RkLndyaXRlICYmIHN0ZC53cml0ZSgnJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGZkcyA9IGZkcyB8IGZkO1xuICAgICAgICAgICAgICB0cnlUb0V4aXQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBEb2VzIG5vdCB3cml0ZSBhbnl0aGluZyBtb3JlLlxuICAgICAgICAgIGRlbGV0ZSBzdGQud3JpdGU7XG4gICAgICAgIH0pO1xuICAgICAgICB0cnlUb0V4aXQoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEFwcGxpY2F0aW9uIG1hbmFnZW1lbnQgLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAvKipcbiAgICogU3RhcnQgYSBmaWxlIG9yIGpzb24gd2l0aCBjb25maWd1cmF0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fHxTdHJpbmd9IGNtZCBzY3JpcHQgdG8gc3RhcnQgb3IganNvblxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBjYWxsZWQgd2hlbiBhcHBsaWNhdGlvbiBoYXMgYmVlbiBzdGFydGVkXG4gICAqL1xuICBzdGFydCAoY21kLCBvcHRzLCBjYikge1xuICAgIGlmICh0eXBlb2Yob3B0cykgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjYiA9IG9wdHM7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIGlmICghb3B0cykgb3B0cyA9IHt9O1xuXG4gICAgaWYgKHNlbXZlci5sdChwcm9jZXNzLnZlcnNpb24sICc2LjAuMCcpKSB7XG4gICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHX1dBUk5JTkcgKyAnTm9kZSA0IGlzIGRlcHJlY2F0ZWQsIHBsZWFzZSB1cGdyYWRlIHRvIHVzZSBwbTIgdG8gaGF2ZSBhbGwgZmVhdHVyZXMnKTtcbiAgICB9XG5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHV0aWwuaXNBcnJheShvcHRzLndhdGNoKSAmJiBvcHRzLndhdGNoLmxlbmd0aCA9PT0gMClcbiAgICAgIG9wdHMud2F0Y2ggPSAob3B0cy5yYXdBcmdzID8gISF+b3B0cy5yYXdBcmdzLmluZGV4T2YoJy0td2F0Y2gnKSA6ICEhfnByb2Nlc3MuYXJndi5pbmRleE9mKCctLXdhdGNoJykpIHx8IGZhbHNlO1xuXG4gICAgaWYgKENvbW1vbi5pc0NvbmZpZ0ZpbGUoY21kKSB8fCAodHlwZW9mKGNtZCkgPT09ICdvYmplY3QnKSkge1xuICAgICAgdGhhdC5fc3RhcnRKc29uKGNtZCwgb3B0cywgJ3Jlc3RhcnRQcm9jZXNzSWQnLCAoZXJyLCBwcm9jcykgPT4ge1xuICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIsIHByb2NzKSA6IHRoaXMuc3BlZWRMaXN0KClcbiAgICAgIH0pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhhdC5fc3RhcnRTY3JpcHQoY21kLCBvcHRzLCAoZXJyLCBwcm9jcykgPT4ge1xuICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIsIHByb2NzKSA6IHRoaXMuc3BlZWRMaXN0KDApXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCBwcm9jZXNzIGNvdW50ZXJzXG4gICAqXG4gICAqIEBtZXRob2QgcmVzZXRNZXRhUHJvY2Vzc1xuICAgKi9cbiAgcmVzZXQgKHByb2Nlc3NfbmFtZSwgY2I/KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0lkcyhpZHMsIGNiKSB7XG4gICAgICBlYWNoTGltaXQoaWRzLCBjb25mLkNPTkNVUlJFTlRfQUNUSU9OUywgZnVuY3Rpb24oaWQsIG5leHQpIHtcbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgncmVzZXRNZXRhUHJvY2Vzc0lkJywgaWQsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgICAgaWYgKGVycikgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnUmVzZXR0aW5nIG1ldGEgZm9yIHByb2Nlc3MgaWQgJWQnLCBpZCk7XG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKENvbW1vbi5yZXRFcnIoZXJyKSk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOnRydWV9KSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAocHJvY2Vzc19uYW1lID09ICdhbGwnKSB7XG4gICAgICB0aGF0LkNsaWVudC5nZXRBbGxQcm9jZXNzSWQoZnVuY3Rpb24oZXJyLCBpZHMpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9jZXNzSWRzKGlkcywgY2IpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGlzTmFOKHByb2Nlc3NfbmFtZSkpIHtcbiAgICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZShwcm9jZXNzX25hbWUsIGZ1bmN0aW9uKGVyciwgaWRzKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKCdVbmtub3duIHByb2Nlc3MgbmFtZScpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcignVW5rbm93biBwcm9jZXNzIG5hbWUnKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvY2Vzc0lkcyhpZHMsIGNiKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcm9jZXNzSWRzKFtwcm9jZXNzX25hbWVdLCBjYik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBkYWVtb25pemVkIFBNMiBEYWVtb25cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGJhY2sgd2hlbiBwbTIgaGFzIGJlZW4gdXBncmFkZWRcbiAgICovXG4gIHVwZGF0ZSAoY2I/KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgQ29tbW9uLnByaW50T3V0KCdCZSBzdXJlIHRvIGhhdmUgdGhlIGxhdGVzdCB2ZXJzaW9uIGJ5IGRvaW5nIGBucG0gaW5zdGFsbCBwbTJAbGF0ZXN0IC1nYCBiZWZvcmUgZG9pbmcgdGhpcyBwcm9jZWR1cmUuJyk7XG5cbiAgICAvLyBEdW1wIFBNMiBwcm9jZXNzZXNcbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdub3RpZnlLaWxsUE0yJywge30sIGZ1bmN0aW9uKCkge30pO1xuXG4gICAgdGhhdC5nZXRWZXJzaW9uKGZ1bmN0aW9uKGVyciwgbmV3X3ZlcnNpb24pIHtcbiAgICAgIC8vIElmIG5vdCBsaW5rZWQgdG8gUE0yIHBsdXMsIGFuZCB1cGRhdGUgUE0yIHRvIGxhdGVzdCwgZGlzcGxheSBtb3RkLnVwZGF0ZVxuICAgICAgaWYgKCF0aGF0LmdsX2lzX2ttX2xpbmtlZCAmJiAhZXJyICYmIChwa2cudmVyc2lvbiAhPSBuZXdfdmVyc2lvbikpIHtcbiAgICAgICAgdmFyIGR0ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsIHRoYXQuX2NvbmYuUE0yX1VQREFURSkpO1xuICAgICAgICBjb25zb2xlLmxvZyhkdC50b1N0cmluZygpKTtcbiAgICAgIH1cblxuICAgICAgdGhhdC5kdW1wKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBkZWJ1ZygnRHVtcGluZyBzdWNjZXNzZnVsbCcsIGVycik7XG4gICAgICAgIHRoYXQua2lsbERhZW1vbihmdW5jdGlvbigpIHtcbiAgICAgICAgICBkZWJ1ZygnLS0tLS0tLS0tLS0tLS0tLS0tIEV2ZXJ5dGhpbmcga2lsbGVkJywgYXJndW1lbnRzKTtcbiAgICAgICAgICB0aGF0LkNsaWVudC5sYXVuY2hEYWVtb24oe2ludGVyYWN0b3I6ZmFsc2V9LCBmdW5jdGlvbihlcnIsIGNoaWxkKSB7XG4gICAgICAgICAgICB0aGF0LkNsaWVudC5sYXVuY2hSUEMoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHRoYXQucmVzdXJyZWN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjaGFsay5ibHVlLmJvbGQoJz4+Pj4+Pj4+Pj4gUE0yIHVwZGF0ZWQnKSk7XG4gICAgICAgICAgICAgICAgdGhhdC5sYXVuY2hBbGwodGhhdCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICBLTURhZW1vbi5sYXVuY2hBbmRJbnRlcmFjdCh0aGF0Ll9jb25mLCB7XG4gICAgICAgICAgICAgICAgICAgIHBtMl92ZXJzaW9uOiBwa2cudmVyc2lvblxuICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyLCBkYXRhLCBpbnRlcmFjdG9yX3Byb2MpIHtcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwge3N1Y2Nlc3M6dHJ1ZX0pIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICAgICAgICAgICAgICAgIH0sIDI1MClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWxvYWQgYW4gYXBwbGljYXRpb25cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHByb2Nlc3NfbmFtZSBBcHBsaWNhdGlvbiBOYW1lIG9yIEFsbFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAgICAgICAgIE9wdGlvbnNcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgICAgICAgICBDYWxsYmFja1xuICAgKi9cbiAgcmVsb2FkIChwcm9jZXNzX25hbWUsIG9wdHMsIGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICh0eXBlb2Yob3B0cykgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjYiA9IG9wdHM7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuXG4gICAgdmFyIGRlbGF5ID0gQ29tbW9uLmxvY2tSZWxvYWQoKTtcbiAgICBpZiAoZGVsYXkgPiAwICYmIG9wdHMuZm9yY2UgIT0gdHJ1ZSkge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdSZWxvYWQgYWxyZWFkeSBpbiBwcm9ncmVzcywgcGxlYXNlIHRyeSBhZ2FpbiBpbiAnICsgTWF0aC5mbG9vcigoY29uZi5SRUxPQURfTE9DS19USU1FT1VUIC0gZGVsYXkpIC8gMTAwMCkgKyAnIHNlY29uZHMgb3IgdXNlIC0tZm9yY2UnKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcignUmVsb2FkIGluIHByb2dyZXNzJykpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgfVxuXG4gICAgaWYgKENvbW1vbi5pc0NvbmZpZ0ZpbGUocHJvY2Vzc19uYW1lKSlcbiAgICAgIHRoYXQuX3N0YXJ0SnNvbihwcm9jZXNzX25hbWUsIG9wdHMsICdyZWxvYWRQcm9jZXNzSWQnLCBmdW5jdGlvbihlcnIsIGFwcHMpIHtcbiAgICAgICAgQ29tbW9uLnVubG9ja1JlbG9hZCgpO1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVycikgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgYXBwcykgOiB0aGF0LmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgICAgfSk7XG4gICAgZWxzZSB7XG4gICAgICBpZiAob3B0cyAmJiBvcHRzLmVudikge1xuICAgICAgICB2YXIgZXJyID0gJ1VzaW5nIC0tZW52IFtlbnZdIHdpdGhvdXQgcGFzc2luZyB0aGUgZWNvc3lzdGVtLmNvbmZpZy5qcyBkb2VzIG5vdCB3b3JrJ1xuICAgICAgICBDb21tb24uZXJyKGVycik7XG4gICAgICAgIENvbW1vbi51bmxvY2tSZWxvYWQoKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0cyAmJiAhb3B0cy51cGRhdGVFbnYpXG4gICAgICAgIENvbW1vbi5wcmludE91dChJTU1VVEFCTEVfTVNHKTtcblxuICAgICAgdGhhdC5fb3BlcmF0ZSgncmVsb2FkUHJvY2Vzc0lkJywgcHJvY2Vzc19uYW1lLCBvcHRzLCBmdW5jdGlvbihlcnIsIGFwcHMpIHtcbiAgICAgICAgQ29tbW9uLnVubG9ja1JlbG9hZCgpO1xuXG4gICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBhcHBzKSA6IHRoYXQuZXhpdENsaShjb25mLlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzdGFydCBwcm9jZXNzXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjbWQgICBBcHBsaWNhdGlvbiBOYW1lIC8gUHJvY2VzcyBpZCAvIEpTT04gYXBwbGljYXRpb24gZmlsZSAvICdhbGwnXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzICBFeHRyYSBvcHRpb25zIHRvIGJlIHVwZGF0ZWRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgIENhbGxiYWNrXG4gICAqL1xuICByZXN0YXJ0IChjbWQsIG9wdHMsIGNiKSB7XG4gICAgaWYgKHR5cGVvZihvcHRzKSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNiID0gb3B0cztcbiAgICAgIG9wdHMgPSB7fTtcbiAgICB9XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZihjbWQpID09PSAnbnVtYmVyJylcbiAgICAgIGNtZCA9IGNtZC50b1N0cmluZygpO1xuXG4gICAgaWYgKGNtZCA9PSBcIi1cIikge1xuICAgICAgLy8gUmVzdGFydCBmcm9tIFBJUEVEIEpTT05cbiAgICAgIHByb2Nlc3Muc3RkaW4ucmVzdW1lKCk7XG4gICAgICBwcm9jZXNzLnN0ZGluLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgICBwcm9jZXNzLnN0ZGluLm9uKCdkYXRhJywgZnVuY3Rpb24gKHBhcmFtKSB7XG4gICAgICAgIHByb2Nlc3Muc3RkaW4ucGF1c2UoKTtcbiAgICAgICAgdGhhdC5hY3Rpb25Gcm9tSnNvbigncmVzdGFydFByb2Nlc3NJZCcsIHBhcmFtLCBvcHRzLCAncGlwZScsIGNiKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChDb21tb24uaXNDb25maWdGaWxlKGNtZCkgfHwgdHlwZW9mKGNtZCkgPT09ICdvYmplY3QnKVxuICAgICAgdGhhdC5fc3RhcnRKc29uKGNtZCwgb3B0cywgJ3Jlc3RhcnRQcm9jZXNzSWQnLCBjYik7XG4gICAgZWxzZSB7XG4gICAgICBpZiAob3B0cyAmJiBvcHRzLmVudikge1xuICAgICAgICB2YXIgZXJyID0gJ1VzaW5nIC0tZW52IFtlbnZdIHdpdGhvdXQgcGFzc2luZyB0aGUgZWNvc3lzdGVtLmNvbmZpZy5qcyBkb2VzIG5vdCB3b3JrJ1xuICAgICAgICBDb21tb24uZXJyKGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRzICYmICFvcHRzLnVwZGF0ZUVudilcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KElNTVVUQUJMRV9NU0cpO1xuICAgICAgdGhhdC5fb3BlcmF0ZSgncmVzdGFydFByb2Nlc3NJZCcsIGNtZCwgb3B0cywgY2IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgcHJvY2Vzc1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvY2Vzc19uYW1lIEFwcGxpY2F0aW9uIE5hbWUgLyBQcm9jZXNzIGlkIC8gQXBwbGljYXRpb24gZmlsZSAvICdhbGwnXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIENhbGxiYWNrXG4gICAqL1xuICBkZWxldGUgKHByb2Nlc3NfbmFtZSwganNvblZpYSwgY2I/KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZihqc29uVmlhKSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjYiA9IGpzb25WaWE7XG4gICAgICBqc29uVmlhID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mKHByb2Nlc3NfbmFtZSkgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgIHByb2Nlc3NfbmFtZSA9IHByb2Nlc3NfbmFtZS50b1N0cmluZygpO1xuICAgIH1cblxuICAgIGlmIChqc29uVmlhID09ICdwaXBlJylcbiAgICAgIHJldHVybiB0aGF0LmFjdGlvbkZyb21Kc29uKCdkZWxldGVQcm9jZXNzSWQnLCBwcm9jZXNzX25hbWUsIGNvbW1hbmRlciwgJ3BpcGUnLCAoZXJyLCBwcm9jcykgPT4ge1xuICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIsIHByb2NzKSA6IHRoaXMuc3BlZWRMaXN0KClcbiAgICAgIH0pO1xuICAgIGlmIChDb21tb24uaXNDb25maWdGaWxlKHByb2Nlc3NfbmFtZSkpXG4gICAgICByZXR1cm4gdGhhdC5hY3Rpb25Gcm9tSnNvbignZGVsZXRlUHJvY2Vzc0lkJywgcHJvY2Vzc19uYW1lLCBjb21tYW5kZXIsICdmaWxlJywgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgpXG4gICAgICB9KTtcbiAgICBlbHNlIHtcbiAgICAgIHRoYXQuX29wZXJhdGUoJ2RlbGV0ZVByb2Nlc3NJZCcsIHByb2Nlc3NfbmFtZSwgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgpXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3RvcCBwcm9jZXNzXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9jZXNzX25hbWUgQXBwbGljYXRpb24gTmFtZSAvIFByb2Nlc3MgaWQgLyBBcHBsaWNhdGlvbiBmaWxlIC8gJ2FsbCdcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgQ2FsbGJhY2tcbiAgICovXG4gIHN0b3AgKHByb2Nlc3NfbmFtZSwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mKHByb2Nlc3NfbmFtZSkgPT09ICdudW1iZXInKVxuICAgICAgcHJvY2Vzc19uYW1lID0gcHJvY2Vzc19uYW1lLnRvU3RyaW5nKCk7XG5cbiAgICBpZiAocHJvY2Vzc19uYW1lID09IFwiLVwiKSB7XG4gICAgICBwcm9jZXNzLnN0ZGluLnJlc3VtZSgpO1xuICAgICAgcHJvY2Vzcy5zdGRpbi5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgICAgcHJvY2Vzcy5zdGRpbi5vbignZGF0YScsIGZ1bmN0aW9uIChwYXJhbSkge1xuICAgICAgICBwcm9jZXNzLnN0ZGluLnBhdXNlKCk7XG4gICAgICAgIHRoYXQuYWN0aW9uRnJvbUpzb24oJ3N0b3BQcm9jZXNzSWQnLCBwYXJhbSwgY29tbWFuZGVyLCAncGlwZScsIChlcnIsIHByb2NzKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgpXG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAoQ29tbW9uLmlzQ29uZmlnRmlsZShwcm9jZXNzX25hbWUpKVxuICAgICAgdGhhdC5hY3Rpb25Gcm9tSnNvbignc3RvcFByb2Nlc3NJZCcsIHByb2Nlc3NfbmFtZSwgY29tbWFuZGVyLCAnZmlsZScsIChlcnIsIHByb2NzKSA9PiB7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKGVyciwgcHJvY3MpIDogdGhpcy5zcGVlZExpc3QoKVxuICAgICAgfSk7XG4gICAgZWxzZVxuICAgICAgdGhhdC5fb3BlcmF0ZSgnc3RvcFByb2Nlc3NJZCcsIHByb2Nlc3NfbmFtZSwgKGVyciwgcHJvY3MpID0+IHtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBwcm9jcykgOiB0aGlzLnNwZWVkTGlzdCgpXG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgbGlzdCBvZiBhbGwgcHJvY2Vzc2VzIG1hbmFnZWRcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgQ2FsbGJhY2tcbiAgICovXG4gIGxpc3QgKG9wdHM/LCBjYj8pIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mKG9wdHMpID09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNiID0gb3B0cztcbiAgICAgIG9wdHMgPSBudWxsO1xuICAgIH1cblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRzICYmIG9wdHMucmF3QXJncyAmJiBvcHRzLnJhd0FyZ3MuaW5kZXhPZignLS13YXRjaCcpID4gLTEpIHtcbiAgICAgICAgdmFyIGRheWpzID0gcmVxdWlyZSgnZGF5anMnKTtcbiAgICAgICAgZnVuY3Rpb24gc2hvdygpIHtcbiAgICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZSgnXFx4MWJbMkonKTtcbiAgICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZSgnXFx4MWJbMGYnKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTGFzdCByZWZyZXNoOiAnLCBkYXlqcygpLmZvcm1hdCgpKTtcbiAgICAgICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbihlcnIsIGxpc3QpIHtcbiAgICAgICAgICAgIFVYLmxpc3QobGlzdCwgbnVsbCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBzaG93KCk7XG4gICAgICAgIHNldEludGVydmFsKHNob3csIDkwMCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgbGlzdCkgOiB0aGF0LnNwZWVkTGlzdChudWxsKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBLaWxsIERhZW1vblxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBDYWxsYmFja1xuICAgKi9cbiAga2lsbERhZW1vbiAoY2IpIHtcbiAgICBwcm9jZXNzLmVudi5QTTJfU1RBVFVTID0gJ3N0b3BwaW5nJ1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnbm90aWZ5S2lsbFBNMicsIHt9LCBmdW5jdGlvbigpIHt9KTtcblxuICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnW3ZdIE1vZHVsZXMgU3RvcHBlZCcpO1xuXG4gICAgdGhhdC5fb3BlcmF0ZSgnZGVsZXRlUHJvY2Vzc0lkJywgJ2FsbCcsIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdbdl0gQWxsIEFwcGxpY2F0aW9ucyBTdG9wcGVkJyk7XG4gICAgICBwcm9jZXNzLmVudi5QTTJfU0lMRU5UID0gJ2ZhbHNlJztcblxuICAgICAgdGhhdC5raWxsQWdlbnQoZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdbdl0gQWdlbnQgU3RvcHBlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhhdC5DbGllbnQua2lsbERhZW1vbihmdW5jdGlvbihlcnIsIHJlcykge1xuICAgICAgICAgIGlmIChlcnIpIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdbdl0gUE0yIERhZW1vbiBTdG9wcGVkJyk7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCByZXMpIDogdGhhdC5leGl0Q2xpKGNvbmYuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0pO1xuICAgIH0pXG4gIH1cblxuICBraWxsIChjYikge1xuICAgIHRoaXMua2lsbERhZW1vbihjYik7XG4gIH1cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gUHJpdmF0ZSBtZXRob2RzIC8vXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gIC8qKlxuICAgKiBNZXRob2QgdG8gU1RBUlQgLyBSRVNUQVJUIGEgc2NyaXB0XG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzY3JpcHQgc2NyaXB0IG5hbWUgKHdpbGwgYmUgcmVzb2x2ZWQgYWNjb3JkaW5nIHRvIGxvY2F0aW9uKVxuICAgKi9cbiAgX3N0YXJ0U2NyaXB0IChzY3JpcHQsIG9wdHMsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRzID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY2IgPSBvcHRzO1xuICAgICAgb3B0cyA9IHt9O1xuICAgIH1cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAvKipcbiAgICAgKiBDb21tYW5kZXIuanMgdHJpY2tzXG4gICAgICovXG4gICAgdmFyIGFwcF9jb25mOiBhbnkgPSBDb25maWcuZmlsdGVyT3B0aW9ucyhvcHRzKTtcbiAgICB2YXIgYXBwQ29uZiA9IHt9O1xuXG4gICAgaWYgKHR5cGVvZiBhcHBfY29uZi5uYW1lID09ICdmdW5jdGlvbicpXG4gICAgICBkZWxldGUgYXBwX2NvbmYubmFtZTtcblxuICAgIGRlbGV0ZSBhcHBfY29uZi5hcmdzO1xuXG4gICAgLy8gUmV0cmlldmUgYXJndW1lbnRzIHZpYSAtLSA8YXJncz5cbiAgICB2YXIgYXJnc0luZGV4O1xuXG4gICAgaWYgKG9wdHMucmF3QXJncyAmJiAoYXJnc0luZGV4ID0gb3B0cy5yYXdBcmdzLmluZGV4T2YoJy0tJykpID49IDApXG4gICAgICBhcHBfY29uZi5hcmdzID0gb3B0cy5yYXdBcmdzLnNsaWNlKGFyZ3NJbmRleCArIDEpO1xuICAgIGVsc2UgaWYgKG9wdHMuc2NyaXB0QXJncylcbiAgICAgIGFwcF9jb25mLmFyZ3MgPSBvcHRzLnNjcmlwdEFyZ3M7XG5cbiAgICBhcHBfY29uZi5zY3JpcHQgPSBzY3JpcHQ7XG4gICAgaWYoIWFwcF9jb25mLm5hbWVzcGFjZSlcbiAgICAgIGFwcF9jb25mLm5hbWVzcGFjZSA9ICdkZWZhdWx0JztcblxuICAgIGlmICgoYXBwQ29uZiA9IENvbW1vbi52ZXJpZnlDb25mcyhhcHBfY29uZikpIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIENvbW1vbi5lcnIoYXBwQ29uZilcbiAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoYXBwQ29uZikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgfVxuXG4gICAgYXBwX2NvbmYgPSBhcHBDb25mWzBdO1xuXG4gICAgaWYgKG9wdHMud2F0Y2hEZWxheSkge1xuICAgICAgaWYgKHR5cGVvZiBvcHRzLndhdGNoRGVsYXkgPT09IFwic3RyaW5nXCIgJiYgb3B0cy53YXRjaERlbGF5LmluZGV4T2YoXCJtc1wiKSAhPT0gLTEpXG4gICAgICAgIGFwcF9jb25mLndhdGNoX2RlbGF5ID0gcGFyc2VJbnQob3B0cy53YXRjaERlbGF5KTtcbiAgICAgIGVsc2Uge1xuICAgICAgICBhcHBfY29uZi53YXRjaF9kZWxheSA9IHBhcnNlRmxvYXQob3B0cy53YXRjaERlbGF5KSAqIDEwMDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIG1hcyA9IFtdO1xuICAgIGlmKHR5cGVvZiBvcHRzLmV4dCAhPSAndW5kZWZpbmVkJylcbiAgICAgIGhmLm1ha2VfYXZhaWxhYmxlX2V4dGVuc2lvbihvcHRzLCBtYXMpOyAvLyBmb3IgLWUgZmxhZ1xuICAgIG1hcy5sZW5ndGggPiAwID8gYXBwX2NvbmYuaWdub3JlX3dhdGNoID0gbWFzIDogMDtcblxuICAgIC8qKlxuICAgICAqIElmIC13IG9wdGlvbiwgd3JpdGUgY29uZmlndXJhdGlvbiB0byBjb25maWd1cmF0aW9uLmpzb24gZmlsZVxuICAgICAqL1xuICAgIGlmIChhcHBfY29uZi53cml0ZSkge1xuICAgICAgdmFyIGRzdF9wYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuZW52LlBXRCB8fCBwcm9jZXNzLmN3ZCgpLCBhcHBfY29uZi5uYW1lICsgJy1wbTIuanNvbicpO1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdXcml0aW5nIGNvbmZpZ3VyYXRpb24gdG8nLCBjaGFsay5ibHVlKGRzdF9wYXRoKSk7XG4gICAgICAvLyBwcmV0dHkgSlNPTlxuICAgICAgdHJ5IHtcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhkc3RfcGF0aCwgSlNPTi5zdHJpbmdpZnkoYXBwX2NvbmYsIG51bGwsIDIpKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNlcmllcyhbXG4gICAgICByZXN0YXJ0RXhpc3RpbmdQcm9jZXNzTmFtZSxcbiAgICAgIHJlc3RhcnRFeGlzdGluZ05hbWVTcGFjZSxcbiAgICAgIHJlc3RhcnRFeGlzdGluZ1Byb2Nlc3NJZCxcbiAgICAgIHJlc3RhcnRFeGlzdGluZ1Byb2Nlc3NQYXRoT3JTdGFydE5ld1xuICAgIF0sIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKVxuICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG5cbiAgICAgIHZhciByZXQgPSB7fTtcblxuICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKF9kdCkge1xuICAgICAgICBpZiAoX2R0ICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgcmV0ID0gX2R0O1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJldCkgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogSWYgc3RhcnQgPGFwcF9uYW1lPiBzdGFydC9yZXN0YXJ0IGFwcGxpY2F0aW9uXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVzdGFydEV4aXN0aW5nUHJvY2Vzc05hbWUoY2IpIHtcbiAgICAgIGlmICghaXNOYU4oc2NyaXB0KSB8fFxuICAgICAgICAodHlwZW9mIHNjcmlwdCA9PT0gJ3N0cmluZycgJiYgc2NyaXB0LmluZGV4T2YoJy8nKSAhPSAtMSkgfHxcbiAgICAgICAgKHR5cGVvZiBzY3JpcHQgPT09ICdzdHJpbmcnICYmIHBhdGguZXh0bmFtZShzY3JpcHQpICE9PSAnJykpXG4gICAgICAgIHJldHVybiBjYihudWxsKTtcblxuICAgICAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzSWRCeU5hbWUoc2NyaXB0LCBmdW5jdGlvbihlcnIsIGlkcykge1xuICAgICAgICAgIGlmIChlcnIgJiYgY2IpIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgIGlmIChpZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhhdC5fb3BlcmF0ZSgncmVzdGFydFByb2Nlc3NJZCcsIHNjcmlwdCwgb3B0cywgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XG4gICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1Byb2Nlc3Mgc3VjY2Vzc2Z1bGx5IHN0YXJ0ZWQnKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGNiKHRydWUsIGxpc3QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgcmV0dXJuIGNiKG51bGwpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiBzdGFydCA8bmFtZXNwYWNlPiBzdGFydC9yZXN0YXJ0IG5hbWVzcGFjZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlc3RhcnRFeGlzdGluZ05hbWVTcGFjZShjYikge1xuICAgICAgaWYgKCFpc05hTihzY3JpcHQpIHx8XG4gICAgICAgICh0eXBlb2Ygc2NyaXB0ID09PSAnc3RyaW5nJyAmJiBzY3JpcHQuaW5kZXhPZignLycpICE9IC0xKSB8fFxuICAgICAgICAodHlwZW9mIHNjcmlwdCA9PT0gJ3N0cmluZycgJiYgcGF0aC5leHRuYW1lKHNjcmlwdCkgIT09ICcnKSlcbiAgICAgICAgcmV0dXJuIGNiKG51bGwpO1xuXG4gICAgICBpZiAoc2NyaXB0ICE9PSAnYWxsJykge1xuICAgICAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzSWRzQnlOYW1lc3BhY2Uoc2NyaXB0LCBmdW5jdGlvbiAoZXJyLCBpZHMpIHtcbiAgICAgICAgICBpZiAoZXJyICYmIGNiKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgICBpZiAoaWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoYXQuX29wZXJhdGUoJ3Jlc3RhcnRQcm9jZXNzSWQnLCBzY3JpcHQsIG9wdHMsIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnUHJvY2VzcyBzdWNjZXNzZnVsbHkgc3RhcnRlZCcpO1xuICAgICAgICAgICAgICByZXR1cm4gY2IodHJ1ZSwgbGlzdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSByZXR1cm4gY2IobnVsbCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoYXQuX29wZXJhdGUoJ3Jlc3RhcnRQcm9jZXNzSWQnLCAnYWxsJywgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XG4gICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdQcm9jZXNzIHN1Y2Nlc3NmdWxseSBzdGFydGVkJyk7XG4gICAgICAgICAgcmV0dXJuIGNiKHRydWUsIGxpc3QpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXN0YXJ0RXhpc3RpbmdQcm9jZXNzSWQoY2IpIHtcbiAgICAgIGlmIChpc05hTihzY3JpcHQpKSByZXR1cm4gY2IobnVsbCk7XG5cbiAgICAgIHRoYXQuX29wZXJhdGUoJ3Jlc3RhcnRQcm9jZXNzSWQnLCBzY3JpcHQsIG9wdHMsIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdQcm9jZXNzIHN1Y2Nlc3NmdWxseSBzdGFydGVkJyk7XG4gICAgICAgIHJldHVybiBjYih0cnVlLCBsaXN0KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlc3RhcnQgYSBwcm9jZXNzIHdpdGggdGhlIHNhbWUgZnVsbCBwYXRoXG4gICAgICogT3Igc3RhcnQgaXRcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZXN0YXJ0RXhpc3RpbmdQcm9jZXNzUGF0aE9yU3RhcnROZXcoY2IpIHtcbiAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uKGVyciwgcHJvY3MpIHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG5cbiAgICAgICAgdmFyIGZ1bGxfcGF0aCA9IHBhdGgucmVzb2x2ZSh0aGF0LmN3ZCwgc2NyaXB0KTtcbiAgICAgICAgdmFyIG1hbmFnZWRfc2NyaXB0ID0gbnVsbDtcblxuICAgICAgICBwcm9jcy5mb3JFYWNoKGZ1bmN0aW9uKHByb2MpIHtcbiAgICAgICAgICBpZiAocHJvYy5wbTJfZW52LnBtX2V4ZWNfcGF0aCA9PSBmdWxsX3BhdGggJiZcbiAgICAgICAgICAgICAgcHJvYy5wbTJfZW52Lm5hbWUgPT0gYXBwX2NvbmYubmFtZSlcbiAgICAgICAgICAgIG1hbmFnZWRfc2NyaXB0ID0gcHJvYztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG1hbmFnZWRfc2NyaXB0ICYmXG4gICAgICAgICAgKG1hbmFnZWRfc2NyaXB0LnBtMl9lbnYuc3RhdHVzID09IGNvbmYuU1RPUFBFRF9TVEFUVVMgfHxcbiAgICAgICAgICAgIG1hbmFnZWRfc2NyaXB0LnBtMl9lbnYuc3RhdHVzID09IGNvbmYuU1RPUFBJTkdfU1RBVFVTIHx8XG4gICAgICAgICAgICBtYW5hZ2VkX3NjcmlwdC5wbTJfZW52LnN0YXR1cyA9PSBjb25mLkVSUk9SRURfU1RBVFVTKSkge1xuICAgICAgICAgIC8vIFJlc3RhcnQgcHJvY2VzcyBpZiBzdG9wcGVkXG4gICAgICAgICAgdmFyIGFwcF9uYW1lID0gbWFuYWdlZF9zY3JpcHQucG0yX2Vudi5uYW1lO1xuXG4gICAgICAgICAgdGhhdC5fb3BlcmF0ZSgncmVzdGFydFByb2Nlc3NJZCcsIGFwcF9uYW1lLCBvcHRzLCBmdW5jdGlvbihlcnIsIGxpc3QpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdQcm9jZXNzIHN1Y2Nlc3NmdWxseSBzdGFydGVkJyk7XG4gICAgICAgICAgICByZXR1cm4gY2IodHJ1ZSwgbGlzdCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG1hbmFnZWRfc2NyaXB0ICYmICFvcHRzLmZvcmNlKSB7XG4gICAgICAgICAgQ29tbW9uLmVycignU2NyaXB0IGFscmVhZHkgbGF1bmNoZWQsIGFkZCAtZiBvcHRpb24gdG8gZm9yY2UgcmUtZXhlY3V0aW9uJyk7XG4gICAgICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcignU2NyaXB0IGFscmVhZHkgbGF1bmNoZWQnKSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzb2x2ZWRfcGF0aHMgPSBudWxsO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzb2x2ZWRfcGF0aHMgPSBDb21tb24ucmVzb2x2ZUFwcEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgY3dkICAgICAgOiB0aGF0LmN3ZCxcbiAgICAgICAgICAgIHBtMl9ob21lIDogdGhhdC5wbTJfaG9tZVxuICAgICAgICAgIH0sIGFwcF9jb25mKTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgQ29tbW9uLmVycihlLm1lc3NhZ2UpO1xuICAgICAgICAgIHJldHVybiBjYihDb21tb24ucmV0RXJyKGUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnU3RhcnRpbmcgJXMgaW4gJXMgKCVkIGluc3RhbmNlJyArIChyZXNvbHZlZF9wYXRocy5pbnN0YW5jZXMgPiAxID8gJ3MnIDogJycpICsgJyknLFxuICAgICAgICAgIHJlc29sdmVkX3BhdGhzLnBtX2V4ZWNfcGF0aCwgcmVzb2x2ZWRfcGF0aHMuZXhlY19tb2RlLCByZXNvbHZlZF9wYXRocy5pbnN0YW5jZXMpO1xuXG4gICAgICAgIGlmICghcmVzb2x2ZWRfcGF0aHMuZW52KSByZXNvbHZlZF9wYXRocy5lbnYgPSB7fTtcblxuICAgICAgICAvLyBTZXQgUE0yIEhPTUUgaW4gY2FzZSBvZiBjaGlsZCBwcm9jZXNzIHVzaW5nIFBNMiBBUElcbiAgICAgICAgcmVzb2x2ZWRfcGF0aHMuZW52WydQTTJfSE9NRSddID0gdGhhdC5wbTJfaG9tZTtcblxuICAgICAgICB2YXIgYWRkaXRpb25hbF9lbnYgPSBNb2R1bGFyaXplci5nZXRBZGRpdGlvbmFsQ29uZihyZXNvbHZlZF9wYXRocy5uYW1lKTtcbiAgICAgICAgdXRpbC5pbmhlcml0cyhyZXNvbHZlZF9wYXRocy5lbnYsIGFkZGl0aW9uYWxfZW52KTtcblxuICAgICAgICAvLyBJcyBLTSBsaW5rZWQ/XG4gICAgICAgIHJlc29sdmVkX3BhdGhzLmttX2xpbmsgPSB0aGF0LmdsX2lzX2ttX2xpbmtlZDtcblxuICAgICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdwcmVwYXJlJywgcmVzb2x2ZWRfcGF0aHMsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnRXJyb3Igd2hpbGUgbGF1bmNoaW5nIGFwcGxpY2F0aW9uJywgZXJyLnN0YWNrIHx8IGVycik7XG4gICAgICAgICAgICByZXR1cm4gY2IoQ29tbW9uLnJldEVycihlcnIpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ0RvbmUuJyk7XG4gICAgICAgICAgcmV0dXJuIGNiKHRydWUsIGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1ldGhvZCB0byBzdGFydC9yZXN0YXJ0L3JlbG9hZCBwcm9jZXNzZXMgZnJvbSBhIEpTT04gZmlsZVxuICAgKiBJdCB3aWxsIHN0YXJ0IGFwcCBub3Qgc3RhcnRlZFxuICAgKiBDYW4gcmVjZWl2ZSBvbmx5IG9wdGlvbiB0byBza2lwIGFwcGxpY2F0aW9uc1xuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3N0YXJ0SnNvbiAoZmlsZSwgb3B0cywgYWN0aW9uLCBwaXBlPywgY2I/KSB7XG4gICAgdmFyIGNvbmZpZzogYW55ICAgICA9IHt9O1xuICAgIHZhciBhcHBDb25mOiBhbnlbXSAgICA9IFtdO1xuICAgIHZhciBzdGF0aWNDb25mID0gW107XG4gICAgdmFyIGRlcGxveUNvbmYgPSB7fTtcbiAgICB2YXIgYXBwc19pbmZvICA9IFtdO1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIC8qKlxuICAgICAqIEdldCBGaWxlIGNvbmZpZ3VyYXRpb25cbiAgICAgKi9cbiAgICBpZiAodHlwZW9mKGNiKSA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mKHBpcGUpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYiA9IHBpcGU7XG4gICAgfVxuICAgIGlmICh0eXBlb2YoZmlsZSkgPT09ICdvYmplY3QnKSB7XG4gICAgICBjb25maWcgPSBmaWxlO1xuICAgIH0gZWxzZSBpZiAocGlwZSA9PT0gJ3BpcGUnKSB7XG4gICAgICBjb25maWcgPSBDb21tb24ucGFyc2VDb25maWcoZmlsZSwgJ3BpcGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGRhdGEgPSBudWxsO1xuXG4gICAgICB2YXIgaXNBYnNvbHV0ZSA9IHBhdGguaXNBYnNvbHV0ZShmaWxlKVxuICAgICAgdmFyIGZpbGVfcGF0aCA9IGlzQWJzb2x1dGUgPyBmaWxlIDogcGF0aC5qb2luKHRoYXQuY3dkLCBmaWxlKTtcblxuICAgICAgZGVidWcoJ1Jlc29sdmVkIGZpbGVwYXRoICVzJywgZmlsZV9wYXRoKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhmaWxlX3BhdGgpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnRmlsZSAnICsgZmlsZSArJyBub3QgZm91bmQnKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uZmlnID0gQ29tbW9uLnBhcnNlQ29uZmlnKGRhdGEsIGZpbGUpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAnRmlsZSAnICsgZmlsZSArICcgbWFsZm9ybWF0ZWQnKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGlhcyBzb21lIG9wdGlvbmFsIGZpZWxkc1xuICAgICAqL1xuICAgIGlmIChjb25maWcuZGVwbG95KVxuICAgICAgZGVwbG95Q29uZiA9IGNvbmZpZy5kZXBsb3k7XG4gICAgaWYgKGNvbmZpZy5zdGF0aWMpXG4gICAgICBzdGF0aWNDb25mID0gY29uZmlnLnN0YXRpYztcbiAgICBpZiAoY29uZmlnLmFwcHMpXG4gICAgICBhcHBDb25mID0gY29uZmlnLmFwcHM7XG4gICAgZWxzZSBpZiAoY29uZmlnLnBtMilcbiAgICAgIGFwcENvbmYgPSBjb25maWcucG0yO1xuICAgIGVsc2VcbiAgICAgIGFwcENvbmYgPSBjb25maWc7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFwcENvbmYpKVxuICAgICAgYXBwQ29uZiA9IFthcHBDb25mXTtcblxuICAgIGlmICgoYXBwQ29uZiA9IENvbW1vbi52ZXJpZnlDb25mcyhhcHBDb25mKSkgaW5zdGFuY2VvZiBFcnJvcilcbiAgICAgIHJldHVybiBjYiA/IGNiKGFwcENvbmYpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG5cbiAgICBwcm9jZXNzLmVudi5QTTJfSlNPTl9QUk9DRVNTSU5HID0gXCJ0cnVlXCI7XG5cbiAgICAvLyBHZXQgQXBwIGxpc3RcbiAgICB2YXIgYXBwc19uYW1lID0gW107XG4gICAgdmFyIHByb2NfbGlzdCA9IHt9O1xuXG4gICAgLy8gQWRkIHN0YXRpY3MgdG8gYXBwc1xuICAgIHN0YXRpY0NvbmYuZm9yRWFjaChmdW5jdGlvbihzZXJ2ZSkge1xuICAgICAgYXBwQ29uZi5wdXNoKHtcbiAgICAgICAgbmFtZTogc2VydmUubmFtZSA/IHNlcnZlLm5hbWUgOiBgc3RhdGljLXBhZ2Utc2VydmVyLSR7c2VydmUucG9ydH1gLFxuICAgICAgICBzY3JpcHQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdBUEknLCAnU2VydmUuanMnKSxcbiAgICAgICAgZW52OiB7XG4gICAgICAgICAgUE0yX1NFUlZFX1BPUlQ6IHNlcnZlLnBvcnQsXG4gICAgICAgICAgUE0yX1NFUlZFX0hPU1Q6IHNlcnZlLmhvc3QsXG4gICAgICAgICAgUE0yX1NFUlZFX1BBVEg6IHNlcnZlLnBhdGgsXG4gICAgICAgICAgUE0yX1NFUlZFX1NQQTogc2VydmUuc3BhLFxuICAgICAgICAgIFBNMl9TRVJWRV9ESVJFQ1RPUlk6IHNlcnZlLmRpcmVjdG9yeSxcbiAgICAgICAgICBQTTJfU0VSVkVfQkFTSUNfQVVUSDogc2VydmUuYmFzaWNfYXV0aCAhPT0gdW5kZWZpbmVkLFxuICAgICAgICAgIFBNMl9TRVJWRV9CQVNJQ19BVVRIX1VTRVJOQU1FOiBzZXJ2ZS5iYXNpY19hdXRoID8gc2VydmUuYmFzaWNfYXV0aC51c2VybmFtZSA6IG51bGwsXG4gICAgICAgICAgUE0yX1NFUlZFX0JBU0lDX0FVVEhfUEFTU1dPUkQ6IHNlcnZlLmJhc2ljX2F1dGggPyBzZXJ2ZS5iYXNpY19hdXRoLnBhc3N3b3JkIDogbnVsbCxcbiAgICAgICAgICBQTTJfU0VSVkVfTU9OSVRPUjogc2VydmUubW9uaXRvclxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIEhlcmUgd2UgcGljayBvbmx5IHRoZSBmaWVsZCB3ZSB3YW50IGZyb20gdGhlIENMSSB3aGVuIHN0YXJ0aW5nIGEgSlNPTlxuICAgIGFwcENvbmYuZm9yRWFjaChmdW5jdGlvbihhcHApIHtcbiAgICAgIGlmICghYXBwLmVudikgeyBhcHAuZW52ID0ge307IH1cbiAgICAgIGFwcC5lbnYuaW8gPSBhcHAuaW87XG4gICAgICAvLyAtLW9ubHkgPGFwcD5cbiAgICAgIGlmIChvcHRzLm9ubHkpIHtcbiAgICAgICAgdmFyIGFwcHMgPSBvcHRzLm9ubHkuc3BsaXQoLyx8IC8pXG4gICAgICAgIGlmIChhcHBzLmluZGV4T2YoYXBwLm5hbWUpID09IC0xKVxuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgLy8gTmFtZXNwYWNlXG4gICAgICBpZiAoIWFwcC5uYW1lc3BhY2UpIHtcbiAgICAgICAgaWYgKG9wdHMubmFtZXNwYWNlKVxuICAgICAgICAgIGFwcC5uYW1lc3BhY2UgPSBvcHRzLm5hbWVzcGFjZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGFwcC5uYW1lc3BhY2UgPSAnZGVmYXVsdCc7XG4gICAgICB9XG4gICAgICAvLyAtLXdhdGNoXG4gICAgICBpZiAoIWFwcC53YXRjaCAmJiBvcHRzLndhdGNoICYmIG9wdHMud2F0Y2ggPT09IHRydWUpXG4gICAgICAgIGFwcC53YXRjaCA9IHRydWU7XG4gICAgICAvLyAtLWlnbm9yZS13YXRjaFxuICAgICAgaWYgKCFhcHAuaWdub3JlX3dhdGNoICYmIG9wdHMuaWdub3JlX3dhdGNoKVxuICAgICAgICBhcHAuaWdub3JlX3dhdGNoID0gb3B0cy5pZ25vcmVfd2F0Y2g7XG4gICAgICBpZiAob3B0cy5pbnN0YWxsX3VybClcbiAgICAgICAgYXBwLmluc3RhbGxfdXJsID0gb3B0cy5pbnN0YWxsX3VybDtcbiAgICAgIC8vIC0taW5zdGFuY2VzIDxuYj5cbiAgICAgIGlmIChvcHRzLmluc3RhbmNlcyAmJiB0eXBlb2Yob3B0cy5pbnN0YW5jZXMpID09PSAnbnVtYmVyJylcbiAgICAgICAgYXBwLmluc3RhbmNlcyA9IG9wdHMuaW5zdGFuY2VzO1xuICAgICAgLy8gLS11aWQgPHVzZXI+XG4gICAgICBpZiAob3B0cy51aWQpXG4gICAgICAgIGFwcC51aWQgPSBvcHRzLnVpZDtcbiAgICAgIC8vIC0tZ2lkIDx1c2VyPlxuICAgICAgaWYgKG9wdHMuZ2lkKVxuICAgICAgICBhcHAuZ2lkID0gb3B0cy5naWQ7XG4gICAgICAvLyBTcGVjaWZpY1xuICAgICAgaWYgKGFwcC5hcHBlbmRfZW52X3RvX25hbWUgJiYgb3B0cy5lbnYpXG4gICAgICAgIGFwcC5uYW1lICs9ICgnLScgKyBvcHRzLmVudik7XG4gICAgICBpZiAob3B0cy5uYW1lX3ByZWZpeCAmJiBhcHAubmFtZS5pbmRleE9mKG9wdHMubmFtZV9wcmVmaXgpID09IC0xKVxuICAgICAgICBhcHAubmFtZSA9IGAke29wdHMubmFtZV9wcmVmaXh9OiR7YXBwLm5hbWV9YFxuXG4gICAgICBhcHAudXNlcm5hbWUgPSBDb21tb24uZ2V0Q3VycmVudFVzZXJuYW1lKCk7XG4gICAgICBhcHBzX25hbWUucHVzaChhcHAubmFtZSk7XG4gICAgfSk7XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbihlcnIsIHJhd19wcm9jX2xpc3QpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIFVuaXF1aWZ5IGluIG1lbW9yeSBwcm9jZXNzIGxpc3RcbiAgICAgICAqL1xuICAgICAgcmF3X3Byb2NfbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHByb2MpIHtcbiAgICAgICAgcHJvY19saXN0W3Byb2MubmFtZV0gPSBwcm9jO1xuICAgICAgfSk7XG5cbiAgICAgIC8qKlxuICAgICAgICogQXV0byBkZXRlY3QgYXBwbGljYXRpb24gYWxyZWFkeSBzdGFydGVkXG4gICAgICAgKiBhbmQgYWN0IG9uIHRoZW0gZGVwZW5kaW5nIG9uIGFjdGlvblxuICAgICAgICovXG4gICAgICBlYWNoTGltaXQoT2JqZWN0LmtleXMocHJvY19saXN0KSwgY29uZi5DT05DVVJSRU5UX0FDVElPTlMsIGZ1bmN0aW9uKHByb2NfbmFtZSwgbmV4dCkge1xuICAgICAgICAvLyBTa2lwIGFwcCBuYW1lICgtLW9ubHkgb3B0aW9uKVxuICAgICAgICBpZiAoYXBwc19uYW1lLmluZGV4T2YocHJvY19uYW1lKSA9PSAtMSlcbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuXG4gICAgICAgIGlmICghKGFjdGlvbiA9PSAncmVsb2FkUHJvY2Vzc0lkJyB8fFxuICAgICAgICAgICAgYWN0aW9uID09ICdzb2Z0UmVsb2FkUHJvY2Vzc0lkJyB8fFxuICAgICAgICAgICAgYWN0aW9uID09ICdyZXN0YXJ0UHJvY2Vzc0lkJykpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXcm9uZyBhY3Rpb24gY2FsbGVkJyk7XG5cbiAgICAgICAgdmFyIGFwcHMgPSBhcHBDb25mLmZpbHRlcihmdW5jdGlvbihhcHApIHtcbiAgICAgICAgICByZXR1cm4gYXBwLm5hbWUgPT0gcHJvY19uYW1lO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZW52cyA9IGFwcHMubWFwKGZ1bmN0aW9uKGFwcCl7XG4gICAgICAgICAgLy8gQmluZHMgZW52X2RpZmYgdG8gZW52IGFuZCByZXR1cm5zIGl0LlxuICAgICAgICAgIHJldHVybiBDb21tb24ubWVyZ2VFbnZpcm9ubWVudFZhcmlhYmxlcyhhcHAsIG9wdHMuZW52LCBkZXBsb3lDb25mKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQXNzaWducyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIGFsbFxuICAgICAgICAvLyBOb3RpY2U6IGlmIHBlb3BsZSB1c2UgdGhlIHNhbWUgbmFtZSBpbiBkaWZmZXJlbnQgYXBwcyxcbiAgICAgICAgLy8gICAgICAgICBkdXBsaWNhdGVkIGVudnMgd2lsbCBiZSBvdmVycm9kZSBieSB0aGUgbGFzdCBvbmVcbiAgICAgICAgdmFyIGVudiA9IGVudnMucmVkdWNlKGZ1bmN0aW9uKGUxLCBlMil7XG4gICAgICAgICAgcmV0dXJuIHV0aWwuaW5oZXJpdHMoZTEsIGUyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gV2hlbiB3ZSBhcmUgcHJvY2Vzc2luZyBKU09OLCBhbGxvdyB0byBrZWVwIHRoZSBuZXcgZW52IGJ5IGRlZmF1bHRcbiAgICAgICAgZW52LnVwZGF0ZUVudiA9IHRydWU7XG5cbiAgICAgICAgLy8gUGFzcyBgZW52YCBvcHRpb25cbiAgICAgICAgdGhhdC5fb3BlcmF0ZShhY3Rpb24sIHByb2NfbmFtZSwgZW52LCBmdW5jdGlvbihlcnIsIHJldCkge1xuICAgICAgICAgIGlmIChlcnIpIENvbW1vbi5wcmludEVycm9yKGVycik7XG5cbiAgICAgICAgICAvLyBGb3IgcmV0dXJuXG4gICAgICAgICAgYXBwc19pbmZvID0gYXBwc19pbmZvLmNvbmNhdChyZXQpO1xuXG4gICAgICAgICAgdGhhdC5DbGllbnQubm90aWZ5R29kKGFjdGlvbiwgcHJvY19uYW1lKTtcbiAgICAgICAgICAvLyBBbmQgUmVtb3ZlIGZyb20gYXJyYXkgdG8gc3B5XG4gICAgICAgICAgYXBwc19uYW1lLnNwbGljZShhcHBzX25hbWUuaW5kZXhPZihwcm9jX25hbWUpLCAxKTtcbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICB9KTtcblxuICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgaWYgKGFwcHNfbmFtZS5sZW5ndGggPiAwICYmIGFjdGlvbiAhPSAnc3RhcnQnKVxuICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0dfV0FSTklORyArICdBcHBsaWNhdGlvbnMgJXMgbm90IHJ1bm5pbmcsIHN0YXJ0aW5nLi4uJywgYXBwc19uYW1lLmpvaW4oJywgJykpO1xuICAgICAgICAvLyBTdGFydCBtaXNzaW5nIGFwcHNcbiAgICAgICAgcmV0dXJuIHN0YXJ0QXBwcyhhcHBzX25hbWUsIGZ1bmN0aW9uKGVyciwgYXBwcykge1xuICAgICAgICAgIGFwcHNfaW5mbyA9IGFwcHNfaW5mby5jb25jYXQoYXBwcyk7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyLCBhcHBzX2luZm8pIDogdGhhdC5zcGVlZExpc3QoZXJyID8gMSA6IDApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gc3RhcnRBcHBzKGFwcF9uYW1lX3RvX3N0YXJ0LCBjYikge1xuICAgICAgdmFyIGFwcHNfdG9fc3RhcnQgPSBbXTtcbiAgICAgIHZhciBhcHBzX3N0YXJ0ZWQgPSBbXTtcbiAgICAgIHZhciBhcHBzX2Vycm9yZWQgPSBbXTtcblxuICAgICAgYXBwQ29uZi5mb3JFYWNoKGZ1bmN0aW9uKGFwcCwgaSkge1xuICAgICAgICBpZiAoYXBwX25hbWVfdG9fc3RhcnQuaW5kZXhPZihhcHAubmFtZSkgIT0gLTEpIHtcbiAgICAgICAgICBhcHBzX3RvX3N0YXJ0LnB1c2goYXBwQ29uZltpXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBlYWNoTGltaXQoYXBwc190b19zdGFydCwgY29uZi5DT05DVVJSRU5UX0FDVElPTlMsIGZ1bmN0aW9uKGFwcCwgbmV4dCkge1xuICAgICAgICBpZiAob3B0cy5jd2QpXG4gICAgICAgICAgYXBwLmN3ZCA9IG9wdHMuY3dkO1xuICAgICAgICBpZiAob3B0cy5mb3JjZV9uYW1lKVxuICAgICAgICAgIGFwcC5uYW1lID0gb3B0cy5mb3JjZV9uYW1lO1xuICAgICAgICBpZiAob3B0cy5zdGFydGVkX2FzX21vZHVsZSlcbiAgICAgICAgICBhcHAucG14X21vZHVsZSA9IHRydWU7XG5cbiAgICAgICAgdmFyIHJlc29sdmVkX3BhdGhzID0gbnVsbDtcblxuICAgICAgICAvLyBoYXJkY29kZSBzY3JpcHQgbmFtZSB0byB1c2UgYHNlcnZlYCBmZWF0dXJlIGluc2lkZSBhIHByb2Nlc3MgZmlsZVxuICAgICAgICBpZiAoYXBwLnNjcmlwdCA9PT0gJ3NlcnZlJykge1xuICAgICAgICAgIGFwcC5zY3JpcHQgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnQVBJJywgJ1NlcnZlLmpzJylcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzb2x2ZWRfcGF0aHMgPSBDb21tb24ucmVzb2x2ZUFwcEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgY3dkICAgICAgOiB0aGF0LmN3ZCxcbiAgICAgICAgICAgIHBtMl9ob21lIDogdGhhdC5wbTJfaG9tZVxuICAgICAgICAgIH0sIGFwcCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBhcHBzX2Vycm9yZWQucHVzaChlKVxuICAgICAgICAgIENvbW1vbi5lcnIoYEVycm9yOiAke2UubWVzc2FnZX1gKVxuICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXJlc29sdmVkX3BhdGhzLmVudikgcmVzb2x2ZWRfcGF0aHMuZW52ID0ge307XG5cbiAgICAgICAgLy8gU2V0IFBNMiBIT01FIGluIGNhc2Ugb2YgY2hpbGQgcHJvY2VzcyB1c2luZyBQTTIgQVBJXG4gICAgICAgIHJlc29sdmVkX3BhdGhzLmVudlsnUE0yX0hPTUUnXSA9IHRoYXQucG0yX2hvbWU7XG5cbiAgICAgICAgdmFyIGFkZGl0aW9uYWxfZW52ID0gTW9kdWxhcml6ZXIuZ2V0QWRkaXRpb25hbENvbmYocmVzb2x2ZWRfcGF0aHMubmFtZSk7XG4gICAgICAgIHV0aWwuaW5oZXJpdHMocmVzb2x2ZWRfcGF0aHMuZW52LCBhZGRpdGlvbmFsX2Vudik7XG5cbiAgICAgICAgcmVzb2x2ZWRfcGF0aHMuZW52ID0gQ29tbW9uLm1lcmdlRW52aXJvbm1lbnRWYXJpYWJsZXMocmVzb2x2ZWRfcGF0aHMsIG9wdHMuZW52LCBkZXBsb3lDb25mKTtcblxuICAgICAgICBkZWxldGUgcmVzb2x2ZWRfcGF0aHMuZW52LmN1cnJlbnRfY29uZjtcblxuICAgICAgICAvLyBJcyBLTSBsaW5rZWQ/XG4gICAgICAgIHJlc29sdmVkX3BhdGhzLmttX2xpbmsgPSB0aGF0LmdsX2lzX2ttX2xpbmtlZDtcblxuICAgICAgICBpZiAocmVzb2x2ZWRfcGF0aHMud2FpdF9yZWFkeSkge1xuICAgICAgICAgIENvbW1vbi53YXJuKGBBcHAgJHtyZXNvbHZlZF9wYXRocy5uYW1lfSBoYXMgb3B0aW9uICd3YWl0X3JlYWR5JyBzZXQsIHdhaXRpbmcgZm9yIGFwcCB0byBiZSByZWFkeS4uLmApXG4gICAgICAgIH1cbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgncHJlcGFyZScsIHJlc29sdmVkX3BhdGhzLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ1Byb2Nlc3MgZmFpbGVkIHRvIGxhdW5jaCAlcycsIGVyci5tZXNzYWdlID8gZXJyLm1lc3NhZ2UgOiBlcnIpO1xuICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ1Byb2Nlc3MgY29uZmlnIGxvYWRpbmcgZmFpbGVkJywgZGF0YSk7XG4gICAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnQXBwIFslc10gbGF1bmNoZWQgKCVkIGluc3RhbmNlcyknLCBkYXRhWzBdLnBtMl9lbnYubmFtZSwgZGF0YS5sZW5ndGgpO1xuICAgICAgICAgIGFwcHNfc3RhcnRlZCA9IGFwcHNfc3RhcnRlZC5jb25jYXQoZGF0YSk7XG4gICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9KTtcblxuICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIHZhciBmaW5hbF9lcnJvciA9IGVyciB8fCBhcHBzX2Vycm9yZWQubGVuZ3RoID4gMCA/IGFwcHNfZXJyb3JlZCA6IG51bGxcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZmluYWxfZXJyb3IsIGFwcHNfc3RhcnRlZCkgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IGEgUlBDIG1ldGhvZCBvbiB0aGUganNvbiBmaWxlXG4gICAqIEBwcml2YXRlXG4gICAqIEBtZXRob2QgYWN0aW9uRnJvbUpzb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvbiBSUEMgTWV0aG9kXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gZmlsZSBmaWxlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBqc29uVmlhIGFjdGlvbiB0eXBlICg9b25seSAncGlwZScgPylcbiAgICogQHBhcmFtIHtGdW5jdGlvbn1cbiAgICovXG4gIGFjdGlvbkZyb21Kc29uIChhY3Rpb24sIGZpbGUsIG9wdHMsIGpzb25WaWEsIGNiKSB7XG4gICAgdmFyIGFwcENvbmY6IGFueSA9IHt9O1xuICAgIHZhciByZXRfcHJvY2Vzc2VzID0gW107XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgLy9hY2NlcHQgcHJvZ3JhbW1hdGljIGNhbGxzXG4gICAgaWYgKHR5cGVvZiBmaWxlID09ICdvYmplY3QnKSB7XG4gICAgICBjYiA9IHR5cGVvZiBqc29uVmlhID09ICdmdW5jdGlvbicgPyBqc29uVmlhIDogY2I7XG4gICAgICBhcHBDb25mID0gZmlsZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoanNvblZpYSA9PSAnZmlsZScpIHtcbiAgICAgIHZhciBkYXRhID0gbnVsbDtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhmaWxlKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ0ZpbGUgJyArIGZpbGUgKycgbm90IGZvdW5kJyk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZSkpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGFwcENvbmYgPSBDb21tb24ucGFyc2VDb25maWcoZGF0YSwgZmlsZSk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdGaWxlICcgKyBmaWxlICsgJyBtYWxmb3JtYXRlZCcpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGUpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoanNvblZpYSA9PSAncGlwZScpIHtcbiAgICAgIGFwcENvbmYgPSBDb21tb24ucGFyc2VDb25maWcoZmlsZSwgJ3BpcGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0JhZCBjYWxsIHRvIGFjdGlvbkZyb21Kc29uLCBqc29uVmlhIHNob3VsZCBiZSBvbmUgb2YgZmlsZSwgcGlwZScpO1xuICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgIH1cblxuICAgIC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbiAgICBpZiAoYXBwQ29uZi5hcHBzKVxuICAgICAgYXBwQ29uZiA9IGFwcENvbmYuYXBwcztcblxuICAgIGlmICghQXJyYXkuaXNBcnJheShhcHBDb25mKSlcbiAgICAgIGFwcENvbmYgPSBbYXBwQ29uZl07XG5cbiAgICBpZiAoKGFwcENvbmYgPSBDb21tb24udmVyaWZ5Q29uZnMoYXBwQ29uZikpIGluc3RhbmNlb2YgRXJyb3IpXG4gICAgICByZXR1cm4gY2IgPyBjYihhcHBDb25mKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuXG4gICAgZWFjaExpbWl0KGFwcENvbmYsIGNvbmYuQ09OQ1VSUkVOVF9BQ1RJT05TLCBmdW5jdGlvbihwcm9jLCBuZXh0MSkge1xuICAgICAgdmFyIG5hbWUgPSAnJztcbiAgICAgIHZhciBuZXdfZW52O1xuXG4gICAgICBpZiAoIXByb2MubmFtZSlcbiAgICAgICAgbmFtZSA9IHBhdGguYmFzZW5hbWUocHJvYy5zY3JpcHQpO1xuICAgICAgZWxzZVxuICAgICAgICBuYW1lID0gcHJvYy5uYW1lO1xuXG4gICAgICBpZiAob3B0cy5vbmx5ICYmIG9wdHMub25seSAhPSBuYW1lKVxuICAgICAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhuZXh0MSk7XG5cbiAgICAgIGlmIChvcHRzICYmIG9wdHMuZW52KVxuICAgICAgICBuZXdfZW52ID0gQ29tbW9uLm1lcmdlRW52aXJvbm1lbnRWYXJpYWJsZXMocHJvYywgb3B0cy5lbnYpO1xuICAgICAgZWxzZVxuICAgICAgICBuZXdfZW52ID0gQ29tbW9uLm1lcmdlRW52aXJvbm1lbnRWYXJpYWJsZXMocHJvYyk7XG5cbiAgICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZShuYW1lLCBmdW5jdGlvbihlcnIsIGlkcykge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICByZXR1cm4gbmV4dDEoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlkcykgcmV0dXJuIG5leHQxKCk7XG5cbiAgICAgICAgZWFjaExpbWl0KGlkcywgY29uZi5DT05DVVJSRU5UX0FDVElPTlMsIGZ1bmN0aW9uKGlkLCBuZXh0Mikge1xuICAgICAgICAgIHZhciBvcHRzID0ge307XG5cbiAgICAgICAgICAvL3N0b3BQcm9jZXNzSWQgY291bGQgYWNjZXB0IG9wdGlvbnMgdG8/XG4gICAgICAgICAgaWYgKGFjdGlvbiA9PSAncmVzdGFydFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgIG9wdHMgPSB7aWQgOiBpZCwgZW52IDogbmV3X2Vudn07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wdHMgPSBpZDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKGFjdGlvbiwgb3B0cywgZnVuY3Rpb24oZXJyLCByZXMpIHtcbiAgICAgICAgICAgIHJldF9wcm9jZXNzZXMucHVzaChyZXMpO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICByZXR1cm4gbmV4dDIoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGFjdGlvbiA9PSAncmVzdGFydFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgICAgdGhhdC5DbGllbnQubm90aWZ5R29kKCdyZXN0YXJ0JywgaWQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT0gJ2RlbGV0ZVByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgICAgdGhhdC5DbGllbnQubm90aWZ5R29kKCdkZWxldGUnLCBpZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PSAnc3RvcFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgICAgdGhhdC5DbGllbnQubm90aWZ5R29kKCdzdG9wJywgaWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1slc10oJWQpIFxcdTI3MTMnLCBuYW1lLCBpZCk7XG4gICAgICAgICAgICByZXR1cm4gbmV4dDIoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQxKG51bGwsIHJldF9wcm9jZXNzZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgaWYgKGNiKSByZXR1cm4gY2IobnVsbCwgcmV0X3Byb2Nlc3Nlcyk7XG4gICAgICBlbHNlIHJldHVybiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgIH0pO1xuICB9XG5cblxuICAvKipcbiAgICogTWFpbiBmdW5jdGlvbiB0byBvcGVyYXRlIHdpdGggUE0yIGRhZW1vblxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gYWN0aW9uX25hbWUgIE5hbWUgb2YgYWN0aW9uIChyZXN0YXJ0UHJvY2Vzc0lkLCBkZWxldGVQcm9jZXNzSWQsIHN0b3BQcm9jZXNzSWQpXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9jZXNzX25hbWUgY2FuIGJlICdhbGwnLCBhIGlkIGludGVnZXIgb3IgcHJvY2VzcyBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbnZzICAgICAgICAgb2JqZWN0IHdpdGggQ0xJIG9wdGlvbnMgLyBlbnZpcm9ubWVudFxuICAgKi9cbiAgX29wZXJhdGUgKGFjdGlvbl9uYW1lLCBwcm9jZXNzX25hbWUsIGVudnMsIGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgdXBkYXRlX2VudiA9IGZhbHNlO1xuICAgIHZhciByZXQgPSBbXTtcblxuICAgIC8vIE1ha2Ugc3VyZSBhbGwgb3B0aW9ucyBleGlzdFxuICAgIGlmICghZW52cylcbiAgICAgIGVudnMgPSB7fTtcblxuICAgIGlmICh0eXBlb2YoZW52cykgPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICBjYiA9IGVudnM7XG4gICAgICBlbnZzID0ge307XG4gICAgfVxuXG4gICAgLy8gU2V0IHZpYSBlbnYudXBkYXRlIChKU09OIHByb2Nlc3NpbmcpXG4gICAgaWYgKGVudnMudXBkYXRlRW52ID09PSB0cnVlKVxuICAgICAgdXBkYXRlX2VudiA9IHRydWU7XG5cbiAgICB2YXIgY29uY3VycmVudF9hY3Rpb25zID0gZW52cy5wYXJhbGxlbCB8fCBjb25mLkNPTkNVUlJFTlRfQUNUSU9OUztcblxuICAgIGlmICghcHJvY2Vzcy5lbnYuUE0yX0pTT05fUFJPQ0VTU0lORyB8fCBlbnZzLmNvbW1hbmRzKSB7XG4gICAgICBlbnZzID0gdGhhdC5faGFuZGxlQXR0cmlidXRlVXBkYXRlKGVudnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCBjdXJyZW50IHVwZGF0ZWQgY29uZmlndXJhdGlvbiBpZiBub3QgcGFzc2VkXG4gICAgICovXG4gICAgaWYgKCFlbnZzLmN1cnJlbnRfY29uZikge1xuICAgICAgdmFyIF9jb25mID0gZmNsb25lKGVudnMpO1xuICAgICAgZW52cyA9IHtcbiAgICAgICAgY3VycmVudF9jb25mIDogX2NvbmZcbiAgICAgIH1cblxuICAgICAgLy8gSXMgS00gbGlua2VkP1xuICAgICAgZW52cy5jdXJyZW50X2NvbmYua21fbGluayA9IHRoYXQuZ2xfaXNfa21fbGlua2VkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9wZXJhdGUgYWN0aW9uIG9uIHNwZWNpZmljIHByb2Nlc3MgaWRcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwcm9jZXNzSWRzKGlkcywgY2IpIHtcbiAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnQXBwbHlpbmcgYWN0aW9uICVzIG9uIGFwcCBbJXNdKGlkczogJXMpJywgYWN0aW9uX25hbWUsIHByb2Nlc3NfbmFtZSwgaWRzKTtcblxuICAgICAgaWYgKGlkcy5sZW5ndGggPD0gMilcbiAgICAgICAgY29uY3VycmVudF9hY3Rpb25zID0gMTtcblxuICAgICAgaWYgKGFjdGlvbl9uYW1lID09ICdkZWxldGVQcm9jZXNzSWQnKVxuICAgICAgICBjb25jdXJyZW50X2FjdGlvbnMgPSAxMDtcblxuICAgICAgZWFjaExpbWl0KGlkcywgY29uY3VycmVudF9hY3Rpb25zLCBmdW5jdGlvbihpZCwgbmV4dCkge1xuICAgICAgICB2YXIgb3B0cztcblxuICAgICAgICAvLyBUaGVzZSBmdW5jdGlvbnMgbmVlZCBleHRyYSBwYXJhbSB0byBiZSBwYXNzZWRcbiAgICAgICAgaWYgKGFjdGlvbl9uYW1lID09ICdyZXN0YXJ0UHJvY2Vzc0lkJyB8fFxuICAgICAgICAgIGFjdGlvbl9uYW1lID09ICdyZWxvYWRQcm9jZXNzSWQnIHx8XG4gICAgICAgICAgYWN0aW9uX25hbWUgPT0gJ3NvZnRSZWxvYWRQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgdmFyIG5ld19lbnY6IGFueSA9IHt9O1xuXG4gICAgICAgICAgaWYgKHVwZGF0ZV9lbnYgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmIChjb25mLlBNMl9QUk9HUkFNTUFUSUMgPT0gdHJ1ZSlcbiAgICAgICAgICAgICAgbmV3X2VudiA9IENvbW1vbi5zYWZlRXh0ZW5kKHt9LCBwcm9jZXNzLmVudik7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIG5ld19lbnYgPSB1dGlsLmluaGVyaXRzKHt9LCBwcm9jZXNzLmVudik7XG5cbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGVudnMpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgICAgICAgICBuZXdfZW52W2tdID0gZW52c1trXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5ld19lbnYgPSBlbnZzO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9wdHMgPSB7XG4gICAgICAgICAgICBpZCAgOiBpZCxcbiAgICAgICAgICAgIGVudiA6IG5ld19lbnZcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIG9wdHMgPSBpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoYWN0aW9uX25hbWUsIG9wdHMsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdQcm9jZXNzICVzIG5vdCBmb3VuZCcsIGlkKTtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KGBQcm9jZXNzICR7aWR9IG5vdCBmb3VuZGApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhY3Rpb25fbmFtZSA9PSAncmVzdGFydFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgIHRoYXQuQ2xpZW50Lm5vdGlmeUdvZCgncmVzdGFydCcsIGlkKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbl9uYW1lID09ICdkZWxldGVQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICB0aGF0LkNsaWVudC5ub3RpZnlHb2QoJ2RlbGV0ZScsIGlkKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbl9uYW1lID09ICdzdG9wUHJvY2Vzc0lkJykge1xuICAgICAgICAgICAgdGhhdC5DbGllbnQubm90aWZ5R29kKCdzdG9wJywgaWQpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uX25hbWUgPT0gJ3JlbG9hZFByb2Nlc3NJZCcpIHtcbiAgICAgICAgICAgIHRoYXQuQ2xpZW50Lm5vdGlmeUdvZCgncmVsb2FkJywgaWQpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uX25hbWUgPT0gJ3NvZnRSZWxvYWRQcm9jZXNzSWQnKSB7XG4gICAgICAgICAgICB0aGF0LkNsaWVudC5ub3RpZnlHb2QoJ2dyYWNlZnVsIHJlbG9hZCcsIGlkKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocmVzKSlcbiAgICAgICAgICAgIHJlcyA9IFtyZXNdO1xuXG4gICAgICAgICAgLy8gRmlsdGVyIHJldHVyblxuICAgICAgICAgIHJlcy5mb3JFYWNoKGZ1bmN0aW9uKHByb2MpIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnWyVzXSglZCkgXFx1MjcxMycsIHByb2MucG0yX2VudiA/IHByb2MucG0yX2Vudi5uYW1lIDogcHJvY2Vzc19uYW1lLCBpZCk7XG5cbiAgICAgICAgICAgIGlmIChhY3Rpb25fbmFtZSA9PSAnc3RvcFByb2Nlc3NJZCcgJiYgcHJvYy5wbTJfZW52ICYmIHByb2MucG0yX2Vudi5jcm9uX3Jlc3RhcnQpIHtcbiAgICAgICAgICAgICAgQ29tbW9uLndhcm4oYEFwcCAke2NoYWxrLmJvbGQocHJvYy5wbTJfZW52Lm5hbWUpfSBzdG9wcGVkIGJ1dCBDUk9OIFJFU1RBUlQgaXMgc3RpbGwgVVAgJHtwcm9jLnBtMl9lbnYuY3Jvbl9yZXN0YXJ0fWApXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghcHJvYy5wbTJfZW52KSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldC5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZSAgICAgICAgIDogcHJvYy5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICAgIG5hbWVzcGFjZTogcHJvYy5wbTJfZW52Lm5hbWVzcGFjZSxcbiAgICAgICAgICAgICAgcG1faWQgICAgICAgIDogcHJvYy5wbTJfZW52LnBtX2lkLFxuICAgICAgICAgICAgICBzdGF0dXMgICAgICAgOiBwcm9jLnBtMl9lbnYuc3RhdHVzLFxuICAgICAgICAgICAgICByZXN0YXJ0X3RpbWUgOiBwcm9jLnBtMl9lbnYucmVzdGFydF90aW1lLFxuICAgICAgICAgICAgICBwbTJfZW52IDoge1xuICAgICAgICAgICAgICAgIG5hbWUgICAgICAgICA6IHByb2MucG0yX2Vudi5uYW1lLFxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogcHJvYy5wbTJfZW52Lm5hbWVzcGFjZSxcbiAgICAgICAgICAgICAgICBwbV9pZCAgICAgICAgOiBwcm9jLnBtMl9lbnYucG1faWQsXG4gICAgICAgICAgICAgICAgc3RhdHVzICAgICAgIDogcHJvYy5wbTJfZW52LnN0YXR1cyxcbiAgICAgICAgICAgICAgICByZXN0YXJ0X3RpbWUgOiBwcm9jLnBtMl9lbnYucmVzdGFydF90aW1lLFxuICAgICAgICAgICAgICAgIGVudiAgICAgICAgICA6IHByb2MucG0yX2Vudi5lbnZcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICB9KTtcbiAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJldCkgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHByb2Nlc3NfbmFtZSA9PSAnYWxsJykge1xuICAgICAgLy8gV2hlbiB1c2luZyBzaG9ydGN1dHMgbGlrZSAnYWxsJywgZG8gbm90IGRlbGV0ZSBtb2R1bGVzXG4gICAgICB2YXIgZm5cblxuICAgICAgaWYgKHByb2Nlc3MuZW52LlBNMl9TVEFUVVMgPT0gJ3N0b3BwaW5nJylcbiAgICAgICAgdGhhdC5DbGllbnQuZ2V0QWxsUHJvY2Vzc0lkKGZ1bmN0aW9uKGVyciwgaWRzKSB7XG4gICAgICAgICAgcmVvcGVyYXRlKGVyciwgaWRzKVxuICAgICAgICB9KTtcbiAgICAgIGVsc2VcbiAgICAgICAgdGhhdC5DbGllbnQuZ2V0QWxsUHJvY2Vzc0lkV2l0aG91dE1vZHVsZXMoZnVuY3Rpb24oZXJyLCBpZHMpIHtcbiAgICAgICAgICByZW9wZXJhdGUoZXJyLCBpZHMpXG4gICAgICAgIH0pO1xuXG4gICAgICBmdW5jdGlvbiByZW9wZXJhdGUoZXJyLCBpZHMpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaWRzIHx8IGlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfV0FSTklORyArICdObyBwcm9jZXNzIGZvdW5kJyk7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKCdwcm9jZXNzIG5hbWUgbm90IGZvdW5kJykpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoaWRzLCBjYik7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIG9wZXJhdGUgdXNpbmcgcmVnZXhcbiAgICBlbHNlIGlmIChpc05hTihwcm9jZXNzX25hbWUpICYmIHByb2Nlc3NfbmFtZVswXSA9PT0gJy8nICYmIHByb2Nlc3NfbmFtZVtwcm9jZXNzX25hbWUubGVuZ3RoIC0gMV0gPT09ICcvJykge1xuICAgICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChwcm9jZXNzX25hbWUucmVwbGFjZSgvXFwvL2csICcnKSk7XG5cbiAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZm91bmRfcHJvYyA9IFtdO1xuICAgICAgICBsaXN0LmZvckVhY2goZnVuY3Rpb24ocHJvYykge1xuICAgICAgICAgIGlmIChyZWdleC50ZXN0KHByb2MucG0yX2Vudi5uYW1lKSkge1xuICAgICAgICAgICAgZm91bmRfcHJvYy5wdXNoKHByb2MucG1faWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGZvdW5kX3Byb2MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX1dBUk5JTkcgKyAnTm8gcHJvY2VzcyBmb3VuZCcpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcigncHJvY2VzcyBuYW1lIG5vdCBmb3VuZCcpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoZm91bmRfcHJvYywgY2IpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGlzTmFOKHByb2Nlc3NfbmFtZSkpIHtcbiAgICAgIC8qKlxuICAgICAgICogV2UgY2FuIG5vdCBzdG9wIG9yIGRlbGV0ZSBhIG1vZHVsZSBidXQgd2UgY2FuIHJlc3RhcnQgaXRcbiAgICAgICAqIHRvIHJlZnJlc2ggY29uZmlndXJhdGlvbiB2YXJpYWJsZVxuICAgICAgICovXG4gICAgICB2YXIgYWxsb3dfbW9kdWxlX3Jlc3RhcnQgPSBhY3Rpb25fbmFtZSA9PSAncmVzdGFydFByb2Nlc3NJZCcgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZShwcm9jZXNzX25hbWUsIGFsbG93X21vZHVsZV9yZXN0YXJ0LCBmdW5jdGlvbiAoZXJyLCBpZHMpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpZHMgJiYgaWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvKipcbiAgICAgICAgICogRGV0ZXJtaW5lIGlmIHRoZSBwcm9jZXNzIHRvIHJlc3RhcnQgaXMgYSBtb2R1bGVcbiAgICAgICAgICogaWYgeWVzIGxvYWQgY29uZmlndXJhdGlvbiB2YXJpYWJsZXMgYW5kIG1lcmdlIHdpdGggdGhlIGN1cnJlbnQgZW52aXJvbm1lbnRcbiAgICAgICAgICovXG4gICAgICAgICAgdmFyIGFkZGl0aW9uYWxfZW52ID0gTW9kdWxhcml6ZXIuZ2V0QWRkaXRpb25hbENvbmYocHJvY2Vzc19uYW1lKTtcbiAgICAgICAgICB1dGlsLmluaGVyaXRzKGVudnMsIGFkZGl0aW9uYWxfZW52KTtcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzc0lkcyhpZHMsIGNiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NJZHNCeU5hbWVzcGFjZShwcm9jZXNzX25hbWUsIGFsbG93X21vZHVsZV9yZXN0YXJ0LCBmdW5jdGlvbiAoZXJyLCBuc19wcm9jZXNzX2lkcykge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghbnNfcHJvY2Vzc19pZHMgfHwgbnNfcHJvY2Vzc19pZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ1Byb2Nlc3Mgb3IgTmFtZXNwYWNlICVzIG5vdCBmb3VuZCcsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoJ3Byb2Nlc3Mgb3IgbmFtZXNwYWNlIG5vdCBmb3VuZCcpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIERldGVybWluZSBpZiB0aGUgcHJvY2VzcyB0byByZXN0YXJ0IGlzIGEgbW9kdWxlXG4gICAgICAgICAgICogaWYgeWVzIGxvYWQgY29uZmlndXJhdGlvbiB2YXJpYWJsZXMgYW5kIG1lcmdlIHdpdGggdGhlIGN1cnJlbnQgZW52aXJvbm1lbnRcbiAgICAgICAgICAgKi9cbiAgICAgICAgICB2YXIgbnNfYWRkaXRpb25hbF9lbnYgPSBNb2R1bGFyaXplci5nZXRBZGRpdGlvbmFsQ29uZihwcm9jZXNzX25hbWUpO1xuICAgICAgICAgIHV0aWwuaW5oZXJpdHMoZW52cywgbnNfYWRkaXRpb25hbF9lbnYpO1xuICAgICAgICAgIHJldHVybiBwcm9jZXNzSWRzKG5zX3Byb2Nlc3NfaWRzLCBjYik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGF0LnBtMl9jb25maWd1cmF0aW9uLmRvY2tlciA9PSBcInRydWVcIiB8fFxuICAgICAgICAgIHRoYXQucG0yX2NvbmZpZ3VyYXRpb24uZG9ja2VyID09IHRydWUpIHtcbiAgICAgICAgLy8gRG9ja2VyL1N5c3RlbWQgcHJvY2VzcyBpbnRlcmFjdGlvbiBkZXRlY3Rpb25cbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgKGVyciwgcHJvY19saXN0KSA9PiB7XG4gICAgICAgICAgdmFyIGhpZ2hlcl9pZCA9IDBcbiAgICAgICAgICBwcm9jX2xpc3QuZm9yRWFjaChwID0+IHsgcC5wbV9pZCA+IGhpZ2hlcl9pZCA/IGhpZ2hlcl9pZCA9IHAucG1faWQgOiBudWxsIH0pXG5cbiAgICAgICAgICAvLyBJcyBEb2NrZXIvU3lzdGVtZFxuICAgICAgICAgIGlmIChwcm9jZXNzX25hbWUgPiBoaWdoZXJfaWQpXG4gICAgICAgICAgICByZXR1cm4gRG9ja2VyTWdtdC5wcm9jZXNzQ29tbWFuZCh0aGF0LCBoaWdoZXJfaWQsIHByb2Nlc3NfbmFtZSwgYWN0aW9uX25hbWUsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNvbmYuUFJFRklYX01TR19FUlIgKyAoZXJyLm1lc3NhZ2UgPyBlcnIubWVzc2FnZSA6IGVycikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJldCkgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgIC8vIENoZWNrIGlmIGFwcGxpY2F0aW9uIG5hbWUgYXMgbnVtYmVyIGlzIGFuIGFwcCBuYW1lXG4gICAgICAgICAgdGhhdC5DbGllbnQuZ2V0UHJvY2Vzc0lkQnlOYW1lKHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24oZXJyLCBpZHMpIHtcbiAgICAgICAgICAgIGlmIChpZHMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoaWRzLCBjYik7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGlmIGFwcGxpY2F0aW9uIG5hbWUgYXMgbnVtYmVyIGlzIGFuIG5hbWVzcGFjZVxuICAgICAgICAgICAgdGhhdC5DbGllbnQuZ2V0UHJvY2Vzc0lkc0J5TmFtZXNwYWNlKHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24oZXJyLCBuc19wcm9jZXNzX2lkcykge1xuICAgICAgICAgICAgICBpZiAobnNfcHJvY2Vzc19pZHMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvY2Vzc0lkcyhuc19wcm9jZXNzX2lkcywgY2IpO1xuICAgICAgICAgICAgICAvLyBFbHNlIG9wZXJhdGUgb24gcG0gaWRcbiAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoW3Byb2Nlc3NfbmFtZV0sIGNiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFwcGxpY2F0aW9uIG5hbWUgYXMgbnVtYmVyIGlzIGFuIGFwcCBuYW1lXG4gICAgICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZShwcm9jZXNzX25hbWUsIGZ1bmN0aW9uKGVyciwgaWRzKSB7XG4gICAgICAgICAgaWYgKGlkcy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoaWRzLCBjYik7XG5cbiAgICAgICAgICAvLyBDaGVjayBpZiBhcHBsaWNhdGlvbiBuYW1lIGFzIG51bWJlciBpcyBhbiBuYW1lc3BhY2VcbiAgICAgICAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzSWRzQnlOYW1lc3BhY2UocHJvY2Vzc19uYW1lLCBmdW5jdGlvbihlcnIsIG5zX3Byb2Nlc3NfaWRzKSB7XG4gICAgICAgICAgICBpZiAobnNfcHJvY2Vzc19pZHMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMobnNfcHJvY2Vzc19pZHMsIGNiKTtcbiAgICAgICAgICAgIC8vIEVsc2Ugb3BlcmF0ZSBvbiBwbSBpZFxuICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3NJZHMoW3Byb2Nlc3NfbmFtZV0sIGNiKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIENhbWVsQ2FzZSBDb21tYW5kZXIuanMgYXJndW1lbnRzXG4gICAqIHRvIFVuZGVyc2NvcmVcbiAgICogKG5vZGVBcmdzIC0+IG5vZGVfYXJncylcbiAgICovXG4gIF9oYW5kbGVBdHRyaWJ1dGVVcGRhdGUgKG9wdHMpIHtcbiAgICB2YXIgY29uZjogYW55ID0gQ29uZmlnLmZpbHRlck9wdGlvbnMob3B0cyk7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZihjb25mLm5hbWUpICE9ICdzdHJpbmcnKVxuICAgICAgZGVsZXRlIGNvbmYubmFtZTtcblxuICAgIHZhciBhcmdzSW5kZXggPSAwO1xuICAgIGlmIChvcHRzLnJhd0FyZ3MgJiYgKGFyZ3NJbmRleCA9IG9wdHMucmF3QXJncy5pbmRleE9mKCctLScpKSA+PSAwKSB7XG4gICAgICBjb25mLmFyZ3MgPSBvcHRzLnJhd0FyZ3Muc2xpY2UoYXJnc0luZGV4ICsgMSk7XG4gICAgfVxuXG4gICAgdmFyIGFwcENvbmYgPSBDb21tb24udmVyaWZ5Q29uZnMoY29uZilbMF07XG5cbiAgICBpZiAoYXBwQ29uZiBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcignRXJyb3Igd2hpbGUgdHJhbnNmb3JtaW5nIENhbWVsQ2FzZSBhcmdzIHRvIHVuZGVyc2NvcmUnKTtcbiAgICAgIHJldHVybiBhcHBDb25mO1xuICAgIH1cblxuICAgIGlmIChhcmdzSW5kZXggPT0gLTEpXG4gICAgICBkZWxldGUgYXBwQ29uZi5hcmdzO1xuICAgIGlmIChhcHBDb25mLm5hbWUgPT0gJ3VuZGVmaW5lZCcpXG4gICAgICBkZWxldGUgYXBwQ29uZi5uYW1lO1xuXG4gICAgZGVsZXRlIGFwcENvbmYuZXhlY19tb2RlO1xuXG4gICAgaWYgKHV0aWwuaXNBcnJheShhcHBDb25mLndhdGNoKSAmJiBhcHBDb25mLndhdGNoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWYgKCF+b3B0cy5yYXdBcmdzLmluZGV4T2YoJy0td2F0Y2gnKSlcbiAgICAgICAgZGVsZXRlIGFwcENvbmYud2F0Y2hcbiAgICB9XG5cbiAgICAvLyBPcHRpb25zIHNldCB2aWEgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gICAgaWYgKHByb2Nlc3MuZW52LlBNMl9ERUVQX01PTklUT1JJTkcpXG4gICAgICBhcHBDb25mLmRlZXBfbW9uaXRvcmluZyA9IHRydWU7XG5cbiAgICAvLyBGb3JjZSBkZWxldGlvbiBvZiBkZWZhdWx0cyB2YWx1ZXMgc2V0IGJ5IGNvbW1hbmRlclxuICAgIC8vIHRvIGF2b2lkIG92ZXJyaWRpbmcgc3BlY2lmaWVkIGNvbmZpZ3VyYXRpb24gYnkgdXNlclxuICAgIGlmIChhcHBDb25mLnRyZWVraWxsID09PSB0cnVlKVxuICAgICAgZGVsZXRlIGFwcENvbmYudHJlZWtpbGw7XG4gICAgaWYgKGFwcENvbmYucG14ID09PSB0cnVlKVxuICAgICAgZGVsZXRlIGFwcENvbmYucG14O1xuICAgIGlmIChhcHBDb25mLnZpemlvbiA9PT0gdHJ1ZSlcbiAgICAgIGRlbGV0ZSBhcHBDb25mLnZpemlvbjtcbiAgICBpZiAoYXBwQ29uZi5hdXRvbWF0aW9uID09PSB0cnVlKVxuICAgICAgZGVsZXRlIGFwcENvbmYuYXV0b21hdGlvbjtcbiAgICBpZiAoYXBwQ29uZi5hdXRvcmVzdGFydCA9PT0gdHJ1ZSlcbiAgICAgIGRlbGV0ZSBhcHBDb25mLmF1dG9yZXN0YXJ0O1xuXG4gICAgcmV0dXJuIGFwcENvbmY7XG4gIH1cblxuICBnZXRQcm9jZXNzSWRCeU5hbWUgKG5hbWUsIGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoaXMuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZShuYW1lLCBmdW5jdGlvbihlcnIsIGlkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY29uZi5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGlkKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGlkKSA6IHRoYXQuZXhpdENsaShjb25mLlNVQ0NFU1NfRVhJVCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBqbGlzdFxuICAgKiBAcGFyYW0ge30gZGVidWdcbiAgICogQHJldHVyblxuICAgKi9cbiAgamxpc3QgKGRlYnVnPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uKGVyciwgbGlzdCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkZWJ1Zykge1xuICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZSh1dGlsLmluc3BlY3QobGlzdCwgZmFsc2UsIG51bGwsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoSlNPTi5zdHJpbmdpZnkobGlzdCkpO1xuICAgICAgfVxuXG4gICAgICB0aGF0LmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGlzcGxheSBzeXN0ZW0gaW5mb3JtYXRpb25cbiAgICogQG1ldGhvZCBzbGlzdFxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBzbGlzdCAodHJlZSkge1xuICAgIHRoaXMuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldFN5c3RlbURhdGEnLCB7fSwgKGVyciwgc3lzX2luZm9zKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5lcnIoZXJyKVxuICAgICAgICByZXR1cm4gdGhpcy5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVClcbiAgICAgIH1cblxuICAgICAgaWYgKHRyZWUgPT09IHRydWUpIHtcbiAgICAgICAgdmFyIHRyZWVpZnkgPSByZXF1aXJlKCcuL3Rvb2xzL3RyZWVpZnkuanMnKVxuICAgICAgICBjb25zb2xlLmxvZyh0cmVlaWZ5LmFzVHJlZShzeXNfaW5mb3MsIHRydWUpKVxuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZSh1dGlsLmluc3BlY3Qoc3lzX2luZm9zLCBmYWxzZSwgbnVsbCwgZmFsc2UpKVxuICAgICAgdGhpcy5leGl0Q2xpKGNvbmYuU1VDQ0VTU19FWElUKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBzcGVlZExpc3RcbiAgICogQHJldHVyblxuICAgKi9cbiAgc3BlZWRMaXN0IChjb2RlPywgYXBwc19hY3RlZD8pIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHN5c3RlbWRhdGEgPSBudWxsXG4gICAgdmFyIGFjdGVkID0gW11cblxuICAgIGlmICgoY29kZSAhPSAwICYmIGNvZGUgIT0gbnVsbCkpIHtcbiAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY29kZSA/IGNvZGUgOiBjb25mLlNVQ0NFU1NfRVhJVCk7XG4gICAgfVxuXG4gICAgaWYgKGFwcHNfYWN0ZWQgJiYgYXBwc19hY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBhcHBzX2FjdGVkLmZvckVhY2gocHJvYyA9PiB7XG4gICAgICAgIGFjdGVkLnB1c2gocHJvYy5wbTJfZW52ID8gcHJvYy5wbTJfZW52LnBtX2lkIDogcHJvYy5wbV9pZClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gRG8gbm90aGluZyBpZiBQTTIgY2FsbGVkIHByb2dyYW1tYXRpY2FsbHkgYW5kIG5vdCBjYWxsZWQgZnJvbSBDTEkgKGFsc28gaW4gZXhpdENsaSlcbiAgICBpZiAoKGNvbmYuUE0yX1BST0dSQU1NQVRJQyAmJiBwcm9jZXNzLmVudi5QTTJfVVNBR0UgIT0gJ0NMSScpKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgcmV0dXJuIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldFN5c3RlbURhdGEnLCB7fSwgKGVyciwgc3lzX2luZm9zKSA9PiB7XG4gICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCAoZXJyLCBwcm9jX2xpc3QpID0+IHtcbiAgICAgICAgZG9MaXN0KGVyciwgcHJvY19saXN0LCBzeXNfaW5mb3MpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBmdW5jdGlvbiBkb0xpc3QoZXJyLCBsaXN0LCBzeXNfaW5mb3MpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgaWYgKHRoYXQuZ2xfcmV0cnkgPT0gMCkge1xuICAgICAgICAgIHRoYXQuZ2xfcmV0cnkgKz0gMTtcbiAgICAgICAgICByZXR1cm4gc2V0VGltZW91dCh0aGF0LnNwZWVkTGlzdC5iaW5kKHRoYXQpLCAxNDAwKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJXMuXFxuQSBwcm9jZXNzIHNlZW1zIHRvIGJlIG9uIGluZmluaXRlIGxvb3AsIHJldHJ5IGluIDUgc2Vjb25kcycsZXJyKTtcbiAgICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgaWYgKHByb2Nlc3Muc3Rkb3V0LmlzVFRZID09PSBmYWxzZSkge1xuICAgICAgICBVWC5saXN0X21pbihsaXN0KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGNvbW1hbmRlci5taW5pTGlzdCAmJiAhY29tbWFuZGVyLnNpbGVudClcbiAgICAgICAgVVgubGlzdF9taW4obGlzdCk7XG4gICAgICBlbHNlIGlmICghY29tbWFuZGVyLnNpbGVudCkge1xuICAgICAgICBpZiAodGhhdC5nbF9pbnRlcmFjdF9pbmZvcykge1xuICAgICAgICAgIHZhciBkYXNoYm9hcmRfdXJsID0gYGh0dHBzOi8vYXBwLnBtMi5pby8jL3IvJHt0aGF0LmdsX2ludGVyYWN0X2luZm9zLnB1YmxpY19rZXl9YFxuXG4gICAgICAgICAgaWYgKHRoYXQuZ2xfaW50ZXJhY3RfaW5mb3MuaW5mb19ub2RlICE9ICdodHRwczovL3Jvb3Qua2V5bWV0cmljcy5pbycpIHtcbiAgICAgICAgICAgIGRhc2hib2FyZF91cmwgPSBgJHt0aGF0LmdsX2ludGVyYWN0X2luZm9zLmluZm9fbm9kZX0vIy9yLyR7dGhhdC5nbF9pbnRlcmFjdF9pbmZvcy5wdWJsaWNfa2V5fWBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoJyVzIFBNMisgYWN0aXZhdGVkIHwgSW5zdGFuY2UgTmFtZTogJXMgfCBEYXNoOiAlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNoYWxrLmdyZWVuLmJvbGQoJ+KHhicpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFsay5ib2xkKHRoYXQuZ2xfaW50ZXJhY3RfaW5mb3MubWFjaGluZV9uYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbGsuYm9sZChkYXNoYm9hcmRfdXJsKSlcbiAgICAgICAgfVxuICAgICAgICBVWC5saXN0KGxpc3QsIHN5c19pbmZvcyk7XG4gICAgICAgIC8vQ29tbW9uLnByaW50T3V0KGNoYWxrLndoaXRlLml0YWxpYygnIFVzZSBgcG0yIHNob3cgPGlkfG5hbWU+YCB0byBnZXQgbW9yZSBkZXRhaWxzIGFib3V0IGFuIGFwcCcpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoYXQuQ2xpZW50LmRhZW1vbl9tb2RlID09IGZhbHNlKSB7XG4gICAgICAgIENvbW1vbi5wcmludE91dCgnWy0tbm8tZGFlbW9uXSBDb250aW51ZSB0byBzdHJlYW0gbG9ncycpO1xuICAgICAgICBDb21tb24ucHJpbnRPdXQoJ1stLW5vLWRhZW1vbl0gRXhpdCBvbiB0YXJnZXQgUE0yIGV4aXQgcGlkPScgKyBmcy5yZWFkRmlsZVN5bmMoY29uZi5QTTJfUElEX0ZJTEVfUEFUSCkudG9TdHJpbmcoKSk7XG4gICAgICAgIGdsb2JhbFtcIl9hdXRvX2V4aXRcIl0gPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhhdC5zdHJlYW1Mb2dzKCdhbGwnLCAwLCBmYWxzZSwgJ0hIOm1tOnNzJywgZmFsc2UpO1xuICAgICAgfVxuICAgICAgLy8gaWYgKHByb2Nlc3Muc3Rkb3V0LmlzVFRZKSBpZiBsb29raW5nIGZvciBzdGFydCBsb2dzXG4gICAgICBlbHNlIGlmICghcHJvY2Vzcy5lbnYuVFJBVklTICYmIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9ICd0ZXN0JyAmJiBhY3RlZC5sZW5ndGggPiAwICYmIChjb21tYW5kZXIuYXR0YWNoID09PSB0cnVlKSkge1xuICAgICAgICBDb21tb24uaW5mbyhgTG9nIHN0cmVhbWluZyBhcHBzIGlkOiAke2NoYWxrLmN5YW4oYWN0ZWQuam9pbignICcpKX0sIGV4aXQgd2l0aCBDdHJsLUMgb3Igd2lsbCBleGl0IGluIDEwc2Vjc2ApXG5cbiAgICAgICAgLy8gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIC8vICAgQ29tbW9uLmluZm8oYExvZyBzdHJlYW1pbmcgZXhpdGVkIGF1dG9tYXRpY2FsbHksIHJ1biAncG0yIGxvZ3MnIHRvIGNvbnRpbnVlIHdhdGNoaW5nIGxvZ3NgKVxuICAgICAgICAvLyAgIHJldHVybiB0aGF0LmV4aXRDbGkoY29kZSA/IGNvZGUgOiBjb25mLlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgIC8vIH0sIDEwMDAwKVxuXG4gICAgICAgIHJldHVybiBhY3RlZC5mb3JFYWNoKChwcm9jX25hbWUpID0+IHtcbiAgICAgICAgICB0aGF0LnN0cmVhbUxvZ3MocHJvY19uYW1lLCAwLCBmYWxzZSwgbnVsbCwgZmFsc2UpO1xuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY29kZSA/IGNvZGUgOiBjb25mLlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNjYWxlIHVwL2Rvd24gYSBwcm9jZXNzXG4gICAqIEBtZXRob2Qgc2NhbGVcbiAgICovXG4gIHNjYWxlIChhcHBfbmFtZSwgbnVtYmVyLCBjYj8pIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBhZGRQcm9jcyhwcm9jLCB2YWx1ZSwgY2IpIHtcbiAgICAgIChmdW5jdGlvbiBleChwcm9jLCBudW1iZXIpIHtcbiAgICAgICAgaWYgKG51bWJlci0tID09PSAwKSByZXR1cm4gY2IoKTtcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KGNvbmYuUFJFRklYX01TRyArICdTY2FsaW5nIHVwIGFwcGxpY2F0aW9uJyk7XG4gICAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2R1cGxpY2F0ZVByb2Nlc3NJZCcsIHByb2MucG0yX2Vudi5wbV9pZCwgZXguYmluZCh0aGlzLCBwcm9jLCBudW1iZXIpKTtcbiAgICAgIH0pKHByb2MsIG51bWJlcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcm1Qcm9jcyhwcm9jcywgdmFsdWUsIGNiKSB7XG4gICAgICB2YXIgaSA9IDA7XG5cbiAgICAgIChmdW5jdGlvbiBleChwcm9jcywgbnVtYmVyKSB7XG4gICAgICAgIGlmIChudW1iZXIrKyA9PT0gMCkgcmV0dXJuIGNiKCk7XG4gICAgICAgIHRoYXQuX29wZXJhdGUoJ2RlbGV0ZVByb2Nlc3NJZCcsIHByb2NzW2krK10ucG0yX2Vudi5wbV9pZCwgZXguYmluZCh0aGlzLCBwcm9jcywgbnVtYmVyKSk7XG4gICAgICB9KShwcm9jcywgbnVtYmVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlbmQoKSB7XG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsLCB7c3VjY2Vzczp0cnVlfSkgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgIH1cblxuICAgIHRoaXMuQ2xpZW50LmdldFByb2Nlc3NCeU5hbWUoYXBwX25hbWUsIGZ1bmN0aW9uKGVyciwgcHJvY3MpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjb25mLkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXByb2NzIHx8IHByb2NzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjb25mLlBSRUZJWF9NU0dfRVJSICsgJ0FwcGxpY2F0aW9uICVzIG5vdCBmb3VuZCcsIGFwcF9uYW1lKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKCdBcHAgbm90IGZvdW5kJykpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBwcm9jX251bWJlciA9IHByb2NzLmxlbmd0aDtcblxuICAgICAgaWYgKHR5cGVvZihudW1iZXIpID09PSAnc3RyaW5nJyAmJiBudW1iZXIuaW5kZXhPZignKycpID49IDApIHtcbiAgICAgICAgbnVtYmVyID0gcGFyc2VJbnQobnVtYmVyLCAxMCk7XG4gICAgICAgIHJldHVybiBhZGRQcm9jcyhwcm9jc1swXSwgbnVtYmVyLCBlbmQpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAodHlwZW9mKG51bWJlcikgPT09ICdzdHJpbmcnICYmIG51bWJlci5pbmRleE9mKCctJykgPj0gMCkge1xuICAgICAgICBudW1iZXIgPSBwYXJzZUludChudW1iZXIsIDEwKTtcbiAgICAgICAgcmV0dXJuIHJtUHJvY3MocHJvY3NbMF0sIG51bWJlciwgZW5kKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBudW1iZXIgPSBwYXJzZUludChudW1iZXIsIDEwKTtcbiAgICAgICAgbnVtYmVyID0gbnVtYmVyIC0gcHJvY19udW1iZXI7XG5cbiAgICAgICAgaWYgKG51bWJlciA8IDApXG4gICAgICAgICAgcmV0dXJuIHJtUHJvY3MocHJvY3MsIG51bWJlciwgZW5kKTtcbiAgICAgICAgZWxzZSBpZiAobnVtYmVyID4gMClcbiAgICAgICAgICByZXR1cm4gYWRkUHJvY3MocHJvY3NbMF0sIG51bWJlciwgZW5kKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX0VSUiArICdOb3RoaW5nIHRvIGRvJyk7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKCdTYW1lIHByb2Nlc3MgbnVtYmVyJykpIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIGRlc2NyaWJlUHJvY2Vzc1xuICAgKiBAcGFyYW0ge30gcG0yX2lkXG4gICAqIEByZXR1cm5cbiAgICovXG4gIGRlc2NyaWJlIChwbTJfaWQsIGNiPykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHZhciBmb3VuZF9wcm9jID0gW107XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbihlcnIsIGxpc3QpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgICAgdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbihwcm9jKSB7XG4gICAgICAgIGlmICgoIWlzTmFOKHBtMl9pZCkgICAgJiYgcHJvYy5wbV9pZCA9PSBwbTJfaWQpIHx8XG4gICAgICAgICAgKHR5cGVvZihwbTJfaWQpID09PSAnc3RyaW5nJyAmJiBwcm9jLm5hbWUgID09IHBtMl9pZCkpIHtcbiAgICAgICAgICBmb3VuZF9wcm9jLnB1c2gocHJvYyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAoZm91bmRfcHJvYy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY29uZi5QUkVGSVhfTVNHX1dBUk5JTkcgKyAnJXMgZG9lc25cXCd0IGV4aXN0JywgcG0yX2lkKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgW10pIDogdGhhdC5leGl0Q2xpKGNvbmYuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghY2IpIHtcbiAgICAgICAgZm91bmRfcHJvYy5mb3JFYWNoKGZ1bmN0aW9uKHByb2MpIHtcbiAgICAgICAgICBVWC5kZXNjcmliZShwcm9jKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGZvdW5kX3Byb2MpIDogdGhhdC5leGl0Q2xpKGNvbmYuU1VDQ0VTU19FWElUKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBUEkgbWV0aG9kIHRvIHBlcmZvcm0gYSBkZWVwIHVwZGF0ZSBvZiBQTTJcbiAgICogQG1ldGhvZCBkZWVwVXBkYXRlXG4gICAqL1xuICBkZWVwVXBkYXRlIChjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIENvbW1vbi5wcmludE91dChjb25mLlBSRUZJWF9NU0cgKyAnVXBkYXRpbmcgUE0yLi4uJyk7XG5cbiAgICB2YXIgY2hpbGQ6IGFueSA9IHNleGVjKFwibnBtIGkgLWcgcG0yQGxhdGVzdDsgcG0yIHVwZGF0ZVwiKTtcblxuICAgIGNoaWxkLnN0ZG91dC5vbignZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICBDb21tb24ucHJpbnRPdXQoY29uZi5QUkVGSVhfTVNHICsgJ1BNMiBzdWNjZXNzZnVsbHkgdXBkYXRlZCcpO1xuICAgICAgY2IgPyBjYihudWxsLCB7c3VjY2Vzczp0cnVlfSkgOiB0aGF0LmV4aXRDbGkoY29uZi5TVUNDRVNTX0VYSVQpO1xuICAgIH0pO1xuICB9XG59O1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gTG9hZCBhbGwgQVBJIG1ldGhvZHMgLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbkFQSUV4dHJhKEFQSSk7XG5BUElEZXBsb3koQVBJKTtcbkFQSU1vZHVsZShBUEkpO1xuXG5BUElQbHVzTGluayhBUEkpO1xuQVBJUGx1c1Byb2Nlc3MoQVBJKTtcbkFQSVBsdXNIZWxwZXIoQVBJKTtcblxuQVBJQ29uZmlnKEFQSSk7XG5BUElWZXJzaW9uKEFQSSk7XG5BUElTdGFydHVwKEFQSSk7XG5BUElNZ250KEFQSSk7XG5BUElDb250YWluZXIoQVBJKTtcblxuZXhwb3J0IGRlZmF1bHQgQVBJO1xuIl19