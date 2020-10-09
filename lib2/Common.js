"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _os = _interopRequireDefault(require("os"));

var _util = _interopRequireDefault(require("util"));

var _chalk = _interopRequireDefault(require("chalk"));

var _fclone = _interopRequireDefault(require("fclone"));

var _semver = _interopRequireDefault(require("semver"));

var _dayjs = _interopRequireDefault(require("dayjs"));

var _child_process = require("child_process");

var _isbinaryfile = _interopRequireDefault(require("./tools/isbinaryfile"));

var _constants = _interopRequireDefault(require("../constants.js"));

var _interpreter = _interopRequireDefault(require("./API/interpreter"));

var _Config = _interopRequireDefault(require("./tools/Config"));

var _package = _interopRequireDefault(require("../package.json"));

var _which = _interopRequireDefault(require("./tools/which"));

var _yamljs = _interopRequireDefault(require("yamljs"));

var _vm = _interopRequireDefault(require("vm"));

var _cron = require("cron");

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _passwd = _interopRequireDefault(require("./tools/passwd"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var Common = {};

function homedir() {
  var env = process.env;
  var home = env.HOME;
  var user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

  if (process.platform === 'win32') {
    return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null;
  }

  if (process.platform === 'darwin') {
    return home || (user ? '/Users/' + user : null);
  }

  if (process.platform === 'linux') {
    return home || (process.getuid() === 0 ? '/root' : user ? '/home/' + user : null);
  }

  return home || null;
}

function resolveHome(filepath) {
  if (filepath[0] === '~') {
    return _path["default"].join(homedir(), filepath.slice(1));
  }

  return filepath;
}

Common.determineSilentCLI = function () {
  // pm2 should ignore -s --silent -v if they are after '--'
  var variadicArgsDashesPos = process.argv.indexOf('--');
  var s1opt = process.argv.indexOf('--silent');
  var s2opt = process.argv.indexOf('-s');

  if (process.env.PM2_SILENT || variadicArgsDashesPos > -1 && s1opt != -1 && s1opt < variadicArgsDashesPos && s2opt != -1 != s2opt < variadicArgsDashesPos || variadicArgsDashesPos == -1 && (s1opt > -1 || s2opt > -1)) {
    for (var key in console) {
      var code = key.charCodeAt(0);

      if (code >= 97 && code <= 122) {
        console[key] = function () {};
      }
    }

    process.env.PM2_DISCRETE_MODE = "true";
  }
};

Common.printVersion = function () {
  var variadicArgsDashesPos = process.argv.indexOf('--');

  if (process.argv.indexOf('-v') > -1 && process.argv.indexOf('-v') < variadicArgsDashesPos) {
    console.log(_package["default"].version);
    process.exit(0);
  }
};

Common.lockReload = function () {
  try {
    var t1 = _fs["default"].readFileSync(_constants["default"].PM2_RELOAD_LOCKFILE).toString(); // Check if content and if time < 30 return locked
    // Else if content detected (lock file staled), allow and rewritte


    if (t1 && t1 != '') {
      var diff = (0, _dayjs["default"])().diff(parseInt(t1));
      if (diff < _constants["default"].RELOAD_LOCK_TIMEOUT) return diff;
    }
  } catch (e) {}

  try {
    // Write latest timestamp
    _fs["default"].writeFileSync(_constants["default"].PM2_RELOAD_LOCKFILE, (0, _dayjs["default"])().valueOf().toString());

    return 0;
  } catch (e) {
    console.error(e.message || e);
  }
};

Common.unlockReload = function () {
  try {
    _fs["default"].writeFileSync(_constants["default"].PM2_RELOAD_LOCKFILE, '');
  } catch (e) {
    console.error(e.message || e);
  }
};
/**
 * Resolve app paths and replace missing values with defaults.
 * @method prepareAppConf
 * @param app {Object}
 * @param {} cwd
 * @param {} outputter
 * @return app
 */


Common.prepareAppConf = function (opts, app) {
  /**
   * Minimum validation
   */
  if (!app.script) return new Error('No script path - aborting');
  var cwd = null;

  if (app.cwd) {
    cwd = _path["default"].resolve(app.cwd);
    process.env.PWD = app.cwd;
  }

  if (!app.node_args) {
    app.node_args = [];
  }

  if (app.port && app.env) {
    app.env.PORT = app.port;
  } // CWD option resolving


  cwd && cwd[0] != '/' && (cwd = _path["default"].resolve(process.cwd(), cwd));
  cwd = cwd || opts.cwd; // Full path script resolution

  app.pm_exec_path = _path["default"].resolve(cwd, app.script); // If script does not exist after resolution

  if (!_fs["default"].existsSync(app.pm_exec_path)) {
    var ckd; // Try resolve command available in $PATH

    if (ckd = (0, _which["default"])(app.script)) {
      if (typeof ckd !== 'string') ckd = ckd.toString();
      app.pm_exec_path = ckd;
    } else // Throw critical error
      return new Error("Script not found: ".concat(app.pm_exec_path));
  }
  /**
   * Auto detect .map file and enable source map support automatically
   */


  if (app.disable_source_map_support != true) {
    try {
      _fs["default"].accessSync(app.pm_exec_path + '.map', _fs["default"].constants.R_OK);

      app.source_map_support = true;
    } catch (e) {}

    delete app.disable_source_map_support;
  }

  delete app.script; // Set current env by first adding the process environment and then extending/replacing it
  // with env specified on command-line or JSON file.

  var env = {};
  /**
   * Do not copy internal pm2 environment variables if acting on process
   * is made from a programmatic script started by PM2 or if a pm_id is present in env
   */

  if (_constants["default"].PM2_PROGRAMMATIC || process.env.pm_id) Common.safeExtend(env, process.env);else env = process.env;

  function filterEnv(envObj) {
    if (app.filter_env == true) return {};

    if (typeof app.filter_env === 'string') {
      delete envObj[app.filter_env];
      return envObj;
    }

    var new_env = {};
    var allowedKeys = app.filter_env.reduce(function (acc, current) {
      return acc.filter(function (item) {
        return !item.includes(current);
      });
    }, Object.keys(envObj));
    allowedKeys.forEach(function (key) {
      return new_env[key] = envObj[key];
    });
    return new_env;
  }

  app.env = [{}, app.filter_env && app.filter_env.length > 0 ? filterEnv(process.env) : env, app.env || {}].reduce(function (e1, e2) {
    return _util["default"].inherits(e1, e2);
  });
  app.pm_cwd = cwd; // Interpreter

  try {
    Common.sink.resolveInterpreter(app);
  } catch (e) {
    return e;
  } // Exec mode and cluster stuff


  Common.sink.determineExecMode(app);
  /**
   * Scary
   */

  var formated_app_name = app.name.replace(/[^a-zA-Z0-9\\.\\-]/g, '-');
  ['log', 'out', 'error', 'pid'].forEach(function (f) {
    var af = app[f + '_file'],
        ps,
        ext = f == 'pid' ? 'pid' : 'log',
        isStd = !~['log', 'pid'].indexOf(f);
    if (af) af = resolveHome(af);

    if (f == 'log' && typeof af == 'boolean' && af || f != 'log' && !af) {
      ps = [_constants["default"]['DEFAULT_' + ext.toUpperCase() + '_PATH'], formated_app_name + (isStd ? '-' + f : '') + '.' + ext];
    } else if ((f != 'log' || f == 'log' && af) && af !== 'NULL' && af !== '/dev/null') {
      ps = [cwd, af];

      var dir = _path["default"].dirname(_path["default"].resolve(cwd, af));

      if (!_fs["default"].existsSync(dir)) {
        Common.printError(_constants["default"].PREFIX_MSG_WARNING + 'Folder does not exist: ' + dir);
        Common.printOut(_constants["default"].PREFIX_MSG + 'Creating folder: ' + dir);

        try {
          _mkdirp["default"].sync(dir);
        } catch (err) {
          Common.printError(_constants["default"].PREFIX_MSG_ERR + 'Could not create folder: ' + _path["default"].dirname(af));
          throw new Error('Could not create folder');
        }
      }
    } // PM2 paths


    if (af !== 'NULL' && af !== '/dev/null') {
      ps && (app['pm_' + (isStd ? f.substr(0, 3) + '_' : '') + ext + '_path'] = _path["default"].resolve.apply(null, ps));
    } else if (_path["default"].sep === '\\') {
      app['pm_' + (isStd ? f.substr(0, 3) + '_' : '') + ext + '_path'] = '\\\\.\\NUL';
    } else {
      app['pm_' + (isStd ? f.substr(0, 3) + '_' : '') + ext + '_path'] = '/dev/null';
    }

    delete app[f + '_file'];
  });
  return app;
};
/**
 * Check if filename is a configuration file
 * @param {string} filename
 * @return {mixed} null if not conf file, json or yaml if conf
 */


Common.isConfigFile = function (filename) {
  if (typeof filename !== 'string') return null;
  if (filename.indexOf('.json') !== -1) return 'json';
  if (filename.indexOf('.yml') > -1 || filename.indexOf('.yaml') > -1) return 'yaml';
  if (filename.indexOf('.config.js') !== -1) return 'js';
  if (filename.indexOf('.config.cjs') !== -1) return 'js';
  if (filename.indexOf('.config.mjs') !== -1) return 'mjs';
  return null;
};
/**
 * Parses a config file like ecosystem.config.js. Supported formats: JS, JSON, JSON5, YAML.
 * @param {string} confString  contents of the config file
 * @param {string} filename    path to the config file
 * @return {Object} config object
 */


Common.parseConfig = function (confObj, filename) {
  if (!filename || filename == 'pipe' || filename == 'none' || filename.indexOf('.json') > -1) {
    var code = '(' + confObj + ')';
    var sandbox = {}; // TODO: Please check this
    // return vm.runInThisContext(code, sandbox, {
    //   filename: path.resolve(filename),
    //   displayErrors: false,
    //   timeout: 1000
    // });

    return _vm["default"].runInThisContext(code, {
      filename: _path["default"].resolve(filename),
      displayErrors: false,
      timeout: 1000
    });
  } else if (filename.indexOf('.yml') > -1 || filename.indexOf('.yaml') > -1) {
    return _yamljs["default"].parse(confObj.toString());
  } else if (filename.indexOf('.config.js') > -1 || filename.indexOf('.config.cjs') > -1 || filename.indexOf('.config.mjs') > -1) {
    var confPath = require.resolve(_path["default"].resolve(filename));

    delete require.cache[confPath];
    return require(confPath);
  }
};

Common.retErr = function (e) {
  if (!e) return new Error('Unidentified error');
  if (e instanceof Error) return e;
  return new Error(e);
};

Common.sink = {};

Common.sink.determineCron = function (app) {
  if (app.cron_restart) {
    try {
      Common.printOut(_constants["default"].PREFIX_MSG + 'cron restart at ' + app.cron_restart);
      new _cron.CronJob(app.cron_restart, function () {
        Common.printOut(_constants["default"].PREFIX_MSG + 'cron pattern for auto restart detected and valid');
      });
    } catch (ex) {
      return new Error("Cron pattern error: ".concat(ex.message));
    }
  }
};
/**
 * Handle alias (fork <=> fork_mode, cluster <=> cluster_mode)
 */


Common.sink.determineExecMode = function (app) {
  if (app.exec_mode) app.exec_mode = app.exec_mode.replace(/^(fork|cluster)$/, '$1_mode');
  /**
   * Here we put the default exec mode
   */

  if (!app.exec_mode && (app.instances >= 1 || app.instances === 0 || app.instances === -1) && app.exec_interpreter.indexOf('node') > -1) {
    app.exec_mode = 'cluster_mode';
  } else if (!app.exec_mode) {
    app.exec_mode = 'fork_mode';
  }

  if (typeof app.instances == 'undefined') app.instances = 1;
};

var resolveNodeInterpreter = function resolveNodeInterpreter(app) {
  if (app.exec_mode && app.exec_mode.indexOf('cluster') > -1) {
    Common.printError(_constants["default"].PREFIX_MSG_WARNING + _chalk["default"].bold.yellow('Choosing the Node.js version in cluster mode is not supported'));
    return false;
  }

  var nvm_path = _constants["default"].IS_WINDOWS ? process.env.NVM_HOME : process.env.NVM_DIR;

  if (!nvm_path) {
    Common.printError(_constants["default"].PREFIX_MSG_ERR + _chalk["default"].red('NVM is not available in PATH'));
    Common.printError(_constants["default"].PREFIX_MSG_ERR + _chalk["default"].red('Fallback to node in PATH'));
    var msg = _constants["default"].IS_WINDOWS ? 'https://github.com/coreybutler/nvm-windows/releases/' : '$ curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash';
    Common.printOut(_constants["default"].PREFIX_MSG_ERR + _chalk["default"].bold('Install NVM:\n' + msg));
  } else {
    var node_version = app.exec_interpreter.split('@')[1];
    var path_to_node = _constants["default"].IS_WINDOWS ? '/v' + node_version + '/node.exe' : _semver["default"].satisfies(node_version, '>= 0.12.0') ? '/versions/node/v' + node_version + '/bin/node' : '/v' + node_version + '/bin/node';

    var nvm_node_path = _path["default"].join(nvm_path, path_to_node);

    try {
      _fs["default"].accessSync(nvm_node_path);
    } catch (e) {
      Common.printOut(_constants["default"].PREFIX_MSG + 'Installing Node v%s', node_version);

      var nvm_bin = _path["default"].join(nvm_path, 'nvm.' + (_constants["default"].IS_WINDOWS ? 'exe' : 'sh'));

      var nvm_cmd = _constants["default"].IS_WINDOWS ? nvm_bin + ' install ' + node_version : '. ' + nvm_bin + ' ; nvm install ' + node_version;
      Common.printOut(_constants["default"].PREFIX_MSG + 'Executing: %s', nvm_cmd);
      (0, _child_process.execSync)(nvm_cmd, {
        cwd: _path["default"].resolve(process.cwd()),
        env: process.env,
        maxBuffer: 20 * 1024 * 1024
      }); // in order to support both arch, nvm for Windows renames 'node.exe' to:
      // 'node32.exe' for x32 arch
      // 'node64.exe' for x64 arch

      if (_constants["default"].IS_WINDOWS) nvm_node_path = nvm_node_path.replace(/node/, 'node' + process.arch.slice(1));
    }

    Common.printOut(_constants["default"].PREFIX_MSG + _chalk["default"].green.bold('Setting Node to v%s (path=%s)'), node_version, nvm_node_path);
    app.exec_interpreter = nvm_node_path;
  }
};
/**
 * Resolve interpreter
 */


Common.sink.resolveInterpreter = function (app) {
  var noInterpreter = !app.exec_interpreter;

  var extName = _path["default"].extname(app.pm_exec_path);

  var betterInterpreter = _interpreter["default"][extName]; // No interpreter defined and correspondance in schema hashmap

  if (noInterpreter && betterInterpreter) {
    app.exec_interpreter = betterInterpreter;
  } // Else if no Interpreter detect if process is binary
  else if (noInterpreter) app.exec_interpreter = (0, _isbinaryfile["default"])(app.pm_exec_path) ? 'none' : 'node';else if (app.exec_interpreter.indexOf('node@') > -1) resolveNodeInterpreter(app);

  if (app.exec_interpreter.indexOf('python') > -1) app.env.PYTHONUNBUFFERED = '1';
  /**
   * Specific installed JS transpilers
   */

  if (app.exec_interpreter == 'ts-node') {
    app.exec_interpreter = _path["default"].resolve(__dirname, '../node_modules/.bin/ts-node');
  }

  if (app.exec_interpreter == 'lsc') {
    app.exec_interpreter = _path["default"].resolve(__dirname, '../node_modules/.bin/lsc');
  }

  if (app.exec_interpreter == 'coffee') {
    app.exec_interpreter = _path["default"].resolve(__dirname, '../node_modules/.bin/coffee');
  }

  if (app.exec_interpreter != 'none' && (0, _which["default"])(app.exec_interpreter) == null) {
    // If node is not present
    if (app.exec_interpreter == 'node') {
      Common.warn("Using builtin node.js version on version ".concat(process.version));
      app.exec_interpreter = _constants["default"].BUILTIN_NODE_PATH;
    } else throw new Error("Interpreter ".concat(app.exec_interpreter, " is NOT AVAILABLE in PATH. (type 'which ").concat(app.exec_interpreter, "' to double check.)"));
  }

  return app;
};

Common.deepCopy = Common.serialize = Common.clone = function (obj) {
  if (obj === null || obj === undefined) return {};
  return (0, _fclone["default"])(obj);
};

Common.errMod = function (msg) {
  if (process.env.PM2_SILENT || process.env.PM2_PROGRAMMATIC === 'true') return false;
  if (msg instanceof Error) return console.error(msg.message);
  return console.error("".concat(_constants["default"].PREFIX_MSG_MOD_ERR).concat(msg));
};

Common.err = function (msg) {
  if (process.env.PM2_SILENT || process.env.PM2_PROGRAMMATIC === 'true') return false;
  if (msg instanceof Error) return console.error("".concat(_constants["default"].PREFIX_MSG_ERR).concat(msg.message));
  return console.error("".concat(_constants["default"].PREFIX_MSG_ERR).concat(msg));
};

Common.printError = function (msg) {
  if (process.env.PM2_SILENT || process.env.PM2_PROGRAMMATIC === 'true') return false;
  if (msg instanceof Error) return console.error(msg.message);
  return console.error.apply(console, arguments);
};

Common.log = function (msg) {
  if (process.env.PM2_SILENT || process.env.PM2_PROGRAMMATIC === 'true') return false;
  return console.log("".concat(_constants["default"].PREFIX_MSG).concat(msg));
};

Common.info = function (msg) {
  if (process.env.PM2_SILENT || process.env.PM2_PROGRAMMATIC === 'true') return false;
  return console.log("".concat(_constants["default"].PREFIX_MSG_INFO).concat(msg));
};

Common.warn = function (msg) {
  if (process.env.PM2_SILENT || process.env.PM2_PROGRAMMATIC === 'true') return false;
  return console.log("".concat(_constants["default"].PREFIX_MSG_WARNING).concat(msg));
};

Common.logMod = function (msg) {
  if (process.env.PM2_SILENT || process.env.PM2_PROGRAMMATIC === 'true') return false;
  return console.log("".concat(_constants["default"].PREFIX_MSG_MOD).concat(msg));
};

Common.printOut = function () {
  if (process.env.PM2_SILENT === 'true' || process.env.PM2_PROGRAMMATIC === 'true') return false;
  return console.log.apply(console, arguments);
};
/**
 * Raw extend
 */


Common.extend = function (destination, source) {
  if (_typeof(destination) !== 'object') {
    destination = {};
  }

  if (!source || _typeof(source) !== 'object') {
    return destination;
  }

  Object.keys(source).forEach(function (new_key) {
    if (source[new_key] != '[object Object]') destination[new_key] = source[new_key];
  });
  return destination;
};
/**
 * This is useful when starting script programmatically
 */


Common.safeExtend = function (origin, add) {
  if (!add || _typeof(add) != 'object') return origin; //Ignore PM2's set environment variables from the nested env

  var keysToIgnore = ['name', 'exec_mode', 'env', 'args', 'pm_cwd', 'exec_interpreter', 'pm_exec_path', 'node_args', 'pm_out_log_path', 'pm_err_log_path', 'pm_pid_path', 'pm_id', 'status', 'pm_uptime', 'created_at', 'windowsHide', 'username', 'merge_logs', 'kill_retry_time', 'prev_restart_delay', 'instance_var', 'unstable_restarts', 'restart_time', 'axm_actions', 'pmx_module', 'command', 'watch', 'filter_env', 'versioning', 'vizion_runing', 'MODULE_DEBUG', 'pmx', 'axm_options', 'created_at', 'watch', 'vizion', 'axm_dynamic', 'axm_monitor', 'instances', 'automation', 'autorestart', 'unstable_restart', 'treekill', 'exit_code', 'vizion'];
  var keys = Object.keys(add);
  var i = keys.length;

  while (i--) {
    //Only copy stuff into the env that we don't have already.
    if (keysToIgnore.indexOf(keys[i]) == -1 && add[keys[i]] != '[object Object]') origin[keys[i]] = add[keys[i]];
  }

  return origin;
};
/**
 * Extend the app.env object of with the properties taken from the
 * app.env_[envName] and deploy configuration.
 * Also update current json attributes
 *
 * Used only for Configuration file processing
 *
 * @param {Object} app The app object.
 * @param {string} envName The given environment name.
 * @param {Object} deployConf Deployment configuration object (from JSON file or whatever).
 * @returns {Object} The app.env variables object.
 */


Common.mergeEnvironmentVariables = function (app_env, env_name, deploy_conf) {
  var app = (0, _fclone["default"])(app_env);
  var new_conf = {
    env: {}
  }; // Stringify possible object

  for (var key in app.env) {
    if (_typeof(app.env[key]) == 'object') {
      app.env[key] = JSON.stringify(app.env[key]);
    }
  }
  /**
   * Extra configuration update
   */


  _util["default"].inherits(new_conf, app);

  if (env_name) {
    // First merge variables from deploy.production.env object as least priority.
    if (deploy_conf && deploy_conf[env_name] && deploy_conf[env_name]['env']) {
      _util["default"].inherits(new_conf.env, deploy_conf[env_name]['env']);
    }

    _util["default"].inherits(new_conf.env, app.env); // Then, last and highest priority, merge the app.env_production object.


    if ('env_' + env_name in app) {
      _util["default"].inherits(new_conf.env, app['env_' + env_name]);
    } else {
      Common.printOut(_constants["default"].PREFIX_MSG_WARNING + _chalk["default"].bold('Environment [%s] is not defined in process file'), env_name);
    }
  }

  delete new_conf.exec_mode;
  var res = {
    current_conf: {}
  };

  _util["default"].inherits(res, new_conf.env);

  _util["default"].inherits(res.current_conf, new_conf); // #2541 force resolution of node interpreter


  if (app.exec_interpreter && app.exec_interpreter.indexOf('@') > -1) {
    resolveNodeInterpreter(app);
    res.current_conf.exec_interpreter = app.exec_interpreter;
  }

  return res;
};
/**
 * This function will resolve paths, option and environment
 * CALLED before 'prepare' God call (=> PROCESS INITIALIZATION)
 * @method resolveAppAttributes
 * @param {Object} opts
 * @param {Object} opts.cwd
 * @param {Object} opts.pm2_home
 * @param {Object} appConf application configuration
 * @return app
 */


Common.resolveAppAttributes = function (opts, conf) {
  var conf_copy = (0, _fclone["default"])(conf);
  var app = Common.prepareAppConf(opts, conf_copy);

  if (app instanceof Error) {
    throw new Error(app.message);
  }

  return app;
};
/**
 * Verify configurations
 * Called on EVERY Operation (start/restart/reload/stop...)
 * @param {Array} appConfs
 * @returns {Array}
 */


Common.verifyConfs = function (appConfs) {
  if (!appConfs || appConfs.length == 0) {
    return [];
  } // Make sure it is an Array.


  appConfs = [].concat(appConfs);
  var verifiedConf = [];

  for (var i = 0; i < appConfs.length; i++) {
    var app = appConfs[i];
    if (app.exec_mode) app.exec_mode = app.exec_mode.replace(/^(fork|cluster)$/, '$1_mode'); // JSON conf: alias cmd to script

    if (app.cmd && !app.script) {
      app.script = app.cmd;
      delete app.cmd;
    } // JSON conf: alias command to script


    if (app.command && !app.script) {
      app.script = app.command;
      delete app.command;
    }

    if (!app.env) {
      app.env = {};
    } // Render an app name if not existing.


    Common.renderApplicationName(app);

    if (app.execute_command == true) {
      app.exec_mode = 'fork';
      delete app.execute_command;
    }

    app.username = Common.getCurrentUsername();
    /**
     * If command is like pm2 start "python xx.py --ok"
     * Then automatically start the script with bash -c and set a name eq to command
     */

    if (app.script && app.script.indexOf(' ') > -1 && _constants["default"].IS_WINDOWS === false) {
      var _script = app.script;

      if ((0, _which["default"])('bash')) {
        app.script = 'bash';
        app.args = ['-c', _script];

        if (!app.name) {
          app.name = _script;
        }
      } else if ((0, _which["default"])('sh')) {
        app.script = 'sh';
        app.args = ['-c', _script];

        if (!app.name) {
          app.name = _script;
        }
      } else {
        warn('bash or sh not available in $PATH, keeping script as is');
      }
    }
    /**
     * Add log_date_format by default
     */


    if (app.time) {
      app.log_date_format = 'YYYY-MM-DDTHH:mm:ss';
    }
    /**
     * Checks + Resolve UID/GID
     * comes from pm2 --uid <> --gid <> or --user
     */


    if (app.uid || app.gid || app.user) {
      // 1/ Check if windows
      if (_constants["default"].IS_WINDOWS === true) {
        Common.printError(_constants["default"].PREFIX_MSG_ERR + '--uid and --git does not works on windows');
        return new Error('--uid and --git does not works on windows');
      } // 2/ Verify that user is root (todo: verify if other has right)


      if (process.env.NODE_ENV != 'test' && process.getuid && process.getuid() !== 0) {
        Common.printError(_constants["default"].PREFIX_MSG_ERR + 'To use --uid and --gid please run pm2 as root');
        return new Error('To use UID and GID please run PM2 as root');
      } // 3/ Resolve user info via /etc/password


      var users;

      try {
        users = _passwd["default"].getUsers();
      } catch (e) {
        Common.printError(e);
        return new Error(e);
      }

      var user_info = users[app.uid || app.user];

      if (!user_info) {
        Common.printError("".concat(_constants["default"].PREFIX_MSG_ERR, " User ").concat(app.uid || app.user, " cannot be found"));
        return new Error("".concat(_constants["default"].PREFIX_MSG_ERR, " User ").concat(app.uid || app.user, " cannot be found"));
      }

      app.env.HOME = user_info.homedir;
      app.uid = parseInt(user_info.userId); // 4/ Resolve group id if gid is specified

      if (app.gid) {
        var groups;

        try {
          groups = _passwd["default"].getGroups();
        } catch (e) {
          Common.printError(e);
          return new Error(e);
        }

        var group_info = groups[app.gid];

        if (!group_info) {
          Common.printError("".concat(_constants["default"].PREFIX_MSG_ERR, " Group ").concat(app.gid, " cannot be found"));
          return new Error("".concat(_constants["default"].PREFIX_MSG_ERR, " Group ").concat(app.gid, " cannot be found"));
        }

        app.gid = parseInt(group_info.id);
      } else {
        app.gid = parseInt(user_info.groupId);
      }
    }
    /**
     * Specific options of PM2.io
     */


    if (process.env.PM2_DEEP_MONITORING) {
      app.deep_monitoring = true;
    }

    if (app.automation == false) {
      app.pmx = false;
    }

    if (app.disable_trace) {
      app.trace = false;
      delete app.disable_trace;
    }
    /**
     * Instances params
     */


    if (app.instances == 'max') {
      app.instances = 0;
    }

    if (typeof app.instances === 'string') {
      app.instances = parseInt(app.instances) || 0;
    }

    if (app.exec_mode != 'cluster_mode' && !app.instances && typeof app.merge_logs == 'undefined') {
      app.merge_logs = true;
    }

    var ret;

    if (app.cron_restart) {
      if ((ret = Common.sink.determineCron(app)) instanceof Error) return ret;
    }
    /**
     * Now validation configuration
     */


    var ret = _Config["default"].validateJSON(app);

    if (ret.errors && ret.errors.length > 0) {
      ret.errors.forEach(function (err) {
        warn(err);
      });
      return new Error(ret.errors);
    }

    verifiedConf.push(ret.config);
  }

  return verifiedConf;
};
/**
 * Get current username
 * Called on EVERY starting app
 *
 * @returns {String}
 */


Common.getCurrentUsername = function () {
  var current_user = '';

  if (_os["default"].userInfo) {
    try {
      current_user = _os["default"].userInfo().username;
    } catch (err) {// For the case of unhandled error for uv_os_get_passwd
      // https://github.com/Unitech/pm2/issues/3184
    }
  }

  if (current_user === '') {
    current_user = process.env.USER || process.env.LNAME || process.env.USERNAME || process.env.SUDO_USER || process.env.C9_USER || process.env.LOGNAME;
  }

  return current_user;
};
/**
 * Render an app name if not existing.
 * @param {Object} conf
 */


Common.renderApplicationName = function (conf) {
  if (!conf.name && conf.script) {
    conf.name = conf.script !== undefined ? _path["default"].basename(conf.script) : 'undefined';
    var lastDot = conf.name.lastIndexOf('.');

    if (lastDot > 0) {
      conf.name = conf.name.slice(0, lastDot);
    }
  }
};
/**
 * Show warnings
 * @param {String} warning
 */


function warn(warning) {
  Common.printOut(_constants["default"].PREFIX_MSG_WARNING + warning);
}

var _default = Common;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Db21tb24udHMiXSwibmFtZXMiOlsiQ29tbW9uIiwiaG9tZWRpciIsImVudiIsInByb2Nlc3MiLCJob21lIiwiSE9NRSIsInVzZXIiLCJMT0dOQU1FIiwiVVNFUiIsIkxOQU1FIiwiVVNFUk5BTUUiLCJwbGF0Zm9ybSIsIlVTRVJQUk9GSUxFIiwiSE9NRURSSVZFIiwiSE9NRVBBVEgiLCJnZXR1aWQiLCJyZXNvbHZlSG9tZSIsImZpbGVwYXRoIiwicGF0aCIsImpvaW4iLCJzbGljZSIsImRldGVybWluZVNpbGVudENMSSIsInZhcmlhZGljQXJnc0Rhc2hlc1BvcyIsImFyZ3YiLCJpbmRleE9mIiwiczFvcHQiLCJzMm9wdCIsIlBNMl9TSUxFTlQiLCJrZXkiLCJjb25zb2xlIiwiY29kZSIsImNoYXJDb2RlQXQiLCJQTTJfRElTQ1JFVEVfTU9ERSIsInByaW50VmVyc2lvbiIsImxvZyIsInBrZyIsInZlcnNpb24iLCJleGl0IiwibG9ja1JlbG9hZCIsInQxIiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJjc3QiLCJQTTJfUkVMT0FEX0xPQ0tGSUxFIiwidG9TdHJpbmciLCJkaWZmIiwicGFyc2VJbnQiLCJSRUxPQURfTE9DS19USU1FT1VUIiwiZSIsIndyaXRlRmlsZVN5bmMiLCJ2YWx1ZU9mIiwiZXJyb3IiLCJtZXNzYWdlIiwidW5sb2NrUmVsb2FkIiwicHJlcGFyZUFwcENvbmYiLCJvcHRzIiwiYXBwIiwic2NyaXB0IiwiRXJyb3IiLCJjd2QiLCJyZXNvbHZlIiwiUFdEIiwibm9kZV9hcmdzIiwicG9ydCIsIlBPUlQiLCJwbV9leGVjX3BhdGgiLCJleGlzdHNTeW5jIiwiY2tkIiwiZGlzYWJsZV9zb3VyY2VfbWFwX3N1cHBvcnQiLCJhY2Nlc3NTeW5jIiwiY29uc3RhbnRzIiwiUl9PSyIsInNvdXJjZV9tYXBfc3VwcG9ydCIsIlBNMl9QUk9HUkFNTUFUSUMiLCJwbV9pZCIsInNhZmVFeHRlbmQiLCJmaWx0ZXJFbnYiLCJlbnZPYmoiLCJmaWx0ZXJfZW52IiwibmV3X2VudiIsImFsbG93ZWRLZXlzIiwicmVkdWNlIiwiYWNjIiwiY3VycmVudCIsImZpbHRlciIsIml0ZW0iLCJpbmNsdWRlcyIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwibGVuZ3RoIiwiZTEiLCJlMiIsInV0aWwiLCJpbmhlcml0cyIsInBtX2N3ZCIsInNpbmsiLCJyZXNvbHZlSW50ZXJwcmV0ZXIiLCJkZXRlcm1pbmVFeGVjTW9kZSIsImZvcm1hdGVkX2FwcF9uYW1lIiwibmFtZSIsInJlcGxhY2UiLCJmIiwiYWYiLCJwcyIsImV4dCIsImlzU3RkIiwidG9VcHBlckNhc2UiLCJkaXIiLCJkaXJuYW1lIiwicHJpbnRFcnJvciIsIlBSRUZJWF9NU0dfV0FSTklORyIsInByaW50T3V0IiwiUFJFRklYX01TRyIsIm1rZGlycCIsInN5bmMiLCJlcnIiLCJQUkVGSVhfTVNHX0VSUiIsInN1YnN0ciIsImFwcGx5Iiwic2VwIiwiaXNDb25maWdGaWxlIiwiZmlsZW5hbWUiLCJwYXJzZUNvbmZpZyIsImNvbmZPYmoiLCJzYW5kYm94Iiwidm0iLCJydW5JblRoaXNDb250ZXh0IiwiZGlzcGxheUVycm9ycyIsInRpbWVvdXQiLCJ5YW1sanMiLCJwYXJzZSIsImNvbmZQYXRoIiwicmVxdWlyZSIsImNhY2hlIiwicmV0RXJyIiwiZGV0ZXJtaW5lQ3JvbiIsImNyb25fcmVzdGFydCIsIkNyb25Kb2IiLCJleCIsImV4ZWNfbW9kZSIsImluc3RhbmNlcyIsImV4ZWNfaW50ZXJwcmV0ZXIiLCJyZXNvbHZlTm9kZUludGVycHJldGVyIiwiY2hhbGsiLCJib2xkIiwieWVsbG93IiwibnZtX3BhdGgiLCJJU19XSU5ET1dTIiwiTlZNX0hPTUUiLCJOVk1fRElSIiwicmVkIiwibXNnIiwibm9kZV92ZXJzaW9uIiwic3BsaXQiLCJwYXRoX3RvX25vZGUiLCJzZW12ZXIiLCJzYXRpc2ZpZXMiLCJudm1fbm9kZV9wYXRoIiwibnZtX2JpbiIsIm52bV9jbWQiLCJtYXhCdWZmZXIiLCJhcmNoIiwiZ3JlZW4iLCJub0ludGVycHJldGVyIiwiZXh0TmFtZSIsImV4dG5hbWUiLCJiZXR0ZXJJbnRlcnByZXRlciIsImV4dEl0cHMiLCJQWVRIT05VTkJVRkZFUkVEIiwiX19kaXJuYW1lIiwid2FybiIsIkJVSUxUSU5fTk9ERV9QQVRIIiwiZGVlcENvcHkiLCJzZXJpYWxpemUiLCJjbG9uZSIsIm9iaiIsInVuZGVmaW5lZCIsImVyck1vZCIsIlBSRUZJWF9NU0dfTU9EX0VSUiIsImFyZ3VtZW50cyIsImluZm8iLCJQUkVGSVhfTVNHX0lORk8iLCJsb2dNb2QiLCJQUkVGSVhfTVNHX01PRCIsImV4dGVuZCIsImRlc3RpbmF0aW9uIiwic291cmNlIiwibmV3X2tleSIsIm9yaWdpbiIsImFkZCIsImtleXNUb0lnbm9yZSIsImkiLCJtZXJnZUVudmlyb25tZW50VmFyaWFibGVzIiwiYXBwX2VudiIsImVudl9uYW1lIiwiZGVwbG95X2NvbmYiLCJuZXdfY29uZiIsIkpTT04iLCJzdHJpbmdpZnkiLCJyZXMiLCJjdXJyZW50X2NvbmYiLCJyZXNvbHZlQXBwQXR0cmlidXRlcyIsImNvbmYiLCJjb25mX2NvcHkiLCJ2ZXJpZnlDb25mcyIsImFwcENvbmZzIiwiY29uY2F0IiwidmVyaWZpZWRDb25mIiwiY21kIiwiY29tbWFuZCIsInJlbmRlckFwcGxpY2F0aW9uTmFtZSIsImV4ZWN1dGVfY29tbWFuZCIsInVzZXJuYW1lIiwiZ2V0Q3VycmVudFVzZXJuYW1lIiwiX3NjcmlwdCIsImFyZ3MiLCJ0aW1lIiwibG9nX2RhdGVfZm9ybWF0IiwidWlkIiwiZ2lkIiwiTk9ERV9FTlYiLCJ1c2VycyIsInBhc3N3ZCIsImdldFVzZXJzIiwidXNlcl9pbmZvIiwidXNlcklkIiwiZ3JvdXBzIiwiZ2V0R3JvdXBzIiwiZ3JvdXBfaW5mbyIsImlkIiwiZ3JvdXBJZCIsIlBNMl9ERUVQX01PTklUT1JJTkciLCJkZWVwX21vbml0b3JpbmciLCJhdXRvbWF0aW9uIiwicG14IiwiZGlzYWJsZV90cmFjZSIsInRyYWNlIiwibWVyZ2VfbG9ncyIsInJldCIsIkNvbmZpZyIsInZhbGlkYXRlSlNPTiIsImVycm9ycyIsInB1c2giLCJjb25maWciLCJjdXJyZW50X3VzZXIiLCJvcyIsInVzZXJJbmZvIiwiU1VET19VU0VSIiwiQzlfVVNFUiIsImJhc2VuYW1lIiwibGFzdERvdCIsImxhc3RJbmRleE9mIiwid2FybmluZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QUFFQSxJQUFNQSxNQUFXLEdBQUcsRUFBcEI7O0FBRUEsU0FBU0MsT0FBVCxHQUFtQjtBQUNqQixNQUFJQyxHQUFHLEdBQUdDLE9BQU8sQ0FBQ0QsR0FBbEI7QUFDQSxNQUFJRSxJQUFJLEdBQUdGLEdBQUcsQ0FBQ0csSUFBZjtBQUNBLE1BQUlDLElBQUksR0FBR0osR0FBRyxDQUFDSyxPQUFKLElBQWVMLEdBQUcsQ0FBQ00sSUFBbkIsSUFBMkJOLEdBQUcsQ0FBQ08sS0FBL0IsSUFBd0NQLEdBQUcsQ0FBQ1EsUUFBdkQ7O0FBRUEsTUFBSVAsT0FBTyxDQUFDUSxRQUFSLEtBQXFCLE9BQXpCLEVBQWtDO0FBQ2hDLFdBQU9ULEdBQUcsQ0FBQ1UsV0FBSixJQUFtQlYsR0FBRyxDQUFDVyxTQUFKLEdBQWdCWCxHQUFHLENBQUNZLFFBQXZDLElBQW1EVixJQUFuRCxJQUEyRCxJQUFsRTtBQUNEOztBQUVELE1BQUlELE9BQU8sQ0FBQ1EsUUFBUixLQUFxQixRQUF6QixFQUFtQztBQUNqQyxXQUFPUCxJQUFJLEtBQUtFLElBQUksR0FBRyxZQUFZQSxJQUFmLEdBQXNCLElBQS9CLENBQVg7QUFDRDs7QUFFRCxNQUFJSCxPQUFPLENBQUNRLFFBQVIsS0FBcUIsT0FBekIsRUFBa0M7QUFDaEMsV0FBT1AsSUFBSSxLQUFLRCxPQUFPLENBQUNZLE1BQVIsT0FBcUIsQ0FBckIsR0FBeUIsT0FBekIs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aEIsR0FBNEIvSixpQkFBS3dPLFFBQUwsQ0FBYy9DLElBQUksQ0FBQ2xKLE1BQW5CLENBQTVCLEdBQXlELFdBQXJFO0FBQ0EsUUFBSWtNLE9BQU8sR0FBR2hELElBQUksQ0FBQ3ZHLElBQUwsQ0FBVXdKLFdBQVYsQ0FBc0IsR0FBdEIsQ0FBZDs7QUFDQSxRQUFJRCxPQUFPLEdBQUcsQ0FBZCxFQUFpQjtBQUNmaEQsTUFBQUEsSUFBSSxDQUFDdkcsSUFBTCxHQUFZdUcsSUFBSSxDQUFDdkcsSUFBTCxDQUFVaEYsS0FBVixDQUFnQixDQUFoQixFQUFtQnVPLE9BQW5CLENBQVo7QUFDRDtBQUNGO0FBQ0YsQ0FSRDtBQVVBOzs7Ozs7QUFJQSxTQUFTaEYsSUFBVCxDQUFja0YsT0FBZCxFQUF1QjtBQUNyQjdQLEVBQUFBLE1BQU0sQ0FBQ2dILFFBQVAsQ0FBZ0J0RSxzQkFBSXFFLGtCQUFKLEdBQXlCOEksT0FBekM7QUFDRDs7ZUFFYzdQLE0iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuICovXG5cbi8qKlxuICogQ29tbW9uIFV0aWxpdGllcyBPTkxZIFVTRUQgSU4gLT5DTEk8LVxuICovXG5cbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBvcyBmcm9tICdvcyc7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgZmNsb25lIGZyb20gJ2ZjbG9uZSc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgZGF5anMgZnJvbSAnZGF5anMnO1xuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBpc0JpbmFyeSBmcm9tICcuL3Rvb2xzL2lzYmluYXJ5ZmlsZSc7XG5pbXBvcnQgY3N0IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgZXh0SXRwcyBmcm9tICcuL0FQSS9pbnRlcnByZXRlcic7XG5pbXBvcnQgQ29uZmlnIGZyb20gJy4vdG9vbHMvQ29uZmlnJztcbmltcG9ydCBwa2cgZnJvbSAnLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCB3aGljaCBmcm9tICcuL3Rvb2xzL3doaWNoJztcbmltcG9ydCB5YW1sanMgZnJvbSAneWFtbGpzJztcbmltcG9ydCB2bSBmcm9tICd2bSc7XG5pbXBvcnQgeyBDcm9uSm9iIH0gZnJvbSAnY3Jvbic7XG5pbXBvcnQgbWtkaXJwIGZyb20gJ21rZGlycCdcbmltcG9ydCBwYXNzd2QgZnJvbSAnLi90b29scy9wYXNzd2QnXG5cbmNvbnN0IENvbW1vbjogYW55ID0ge307XG5cbmZ1bmN0aW9uIGhvbWVkaXIoKSB7XG4gIHZhciBlbnYgPSBwcm9jZXNzLmVudjtcbiAgdmFyIGhvbWUgPSBlbnYuSE9NRTtcbiAgdmFyIHVzZXIgPSBlbnYuTE9HTkFNRSB8fCBlbnYuVVNFUiB8fCBlbnYuTE5BTUUgfHwgZW52LlVTRVJOQU1FO1xuXG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgcmV0dXJuIGVudi5VU0VSUFJPRklMRSB8fCBlbnYuSE9NRURSSVZFICsgZW52LkhPTUVQQVRIIHx8IGhvbWUgfHwgbnVsbDtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgIHJldHVybiBob21lIHx8ICh1c2VyID8gJy9Vc2Vycy8nICsgdXNlciA6IG51bGwpO1xuICB9XG5cbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdsaW51eCcpIHtcbiAgICByZXR1cm4gaG9tZSB8fCAocHJvY2Vzcy5nZXR1aWQoKSA9PT0gMCA/ICcvcm9vdCcgOiAodXNlciA/ICcvaG9tZS8nICsgdXNlciA6IG51bGwpKTtcbiAgfVxuXG4gIHJldHVybiBob21lIHx8IG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVIb21lKGZpbGVwYXRoKSB7XG4gIGlmIChmaWxlcGF0aFswXSA9PT0gJ34nKSB7XG4gICAgcmV0dXJuIHBhdGguam9pbihob21lZGlyKCksIGZpbGVwYXRoLnNsaWNlKDEpKTtcbiAgfVxuICByZXR1cm4gZmlsZXBhdGg7XG59XG5cbkNvbW1vbi5kZXRlcm1pbmVTaWxlbnRDTEkgPSBmdW5jdGlvbiAoKSB7XG4gIC8vIHBtMiBzaG91bGQgaWdub3JlIC1zIC0tc2lsZW50IC12IGlmIHRoZXkgYXJlIGFmdGVyICctLSdcbiAgdmFyIHZhcmlhZGljQXJnc0Rhc2hlc1BvcyA9IHByb2Nlc3MuYXJndi5pbmRleE9mKCctLScpO1xuICB2YXIgczFvcHQgPSBwcm9jZXNzLmFyZ3YuaW5kZXhPZignLS1zaWxlbnQnKVxuICB2YXIgczJvcHQgPSBwcm9jZXNzLmFyZ3YuaW5kZXhPZignLXMnKVxuXG4gIGlmIChwcm9jZXNzLmVudi5QTTJfU0lMRU5UIHx8ICh2YXJpYWRpY0FyZ3NEYXNoZXNQb3MgPiAtMSAmJlxuICAgIChzMW9wdCAhPSAtMSAmJiBzMW9wdCA8IHZhcmlhZGljQXJnc0Rhc2hlc1BvcykgJiZcbiAgICAoczJvcHQgIT0gLTEgIT0gczJvcHQgPCB2YXJpYWRpY0FyZ3NEYXNoZXNQb3MpKSB8fFxuICAgICh2YXJpYWRpY0FyZ3NEYXNoZXNQb3MgPT0gLTEgJiYgKHMxb3B0ID4gLTEgfHwgczJvcHQgPiAtMSkpKSB7XG4gICAgZm9yICh2YXIga2V5IGluIGNvbnNvbGUpIHtcbiAgICAgIHZhciBjb2RlID0ga2V5LmNoYXJDb2RlQXQoMCk7XG4gICAgICBpZiAoY29kZSA+PSA5NyAmJiBjb2RlIDw9IDEyMikge1xuICAgICAgICBjb25zb2xlW2tleV0gPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgICB9XG4gICAgfVxuICAgIHByb2Nlc3MuZW52LlBNMl9ESVNDUkVURV9NT0RFID0gXCJ0cnVlXCI7XG4gIH1cbn1cblxuQ29tbW9uLnByaW50VmVyc2lvbiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHZhcmlhZGljQXJnc0Rhc2hlc1BvcyA9IHByb2Nlc3MuYXJndi5pbmRleE9mKCctLScpO1xuXG4gIGlmIChwcm9jZXNzLmFyZ3YuaW5kZXhPZignLXYnKSA+IC0xICYmIHByb2Nlc3MuYXJndi5pbmRleE9mKCctdicpIDwgdmFyaWFkaWNBcmdzRGFzaGVzUG9zKSB7XG4gICAgY29uc29sZS5sb2cocGtnLnZlcnNpb24pO1xuICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgfVxufVxuXG5Db21tb24ubG9ja1JlbG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgdDEgPSBmcy5yZWFkRmlsZVN5bmMoY3N0LlBNMl9SRUxPQURfTE9DS0ZJTEUpLnRvU3RyaW5nKCk7XG5cbiAgICAvLyBDaGVjayBpZiBjb250ZW50IGFuZCBpZiB0aW1lIDwgMzAgcmV0dXJuIGxvY2tlZFxuICAgIC8vIEVsc2UgaWYgY29udGVudCBkZXRlY3RlZCAobG9jayBmaWxlIHN0YWxlZCksIGFsbG93IGFuZCByZXdyaXR0ZVxuICAgIGlmICh0MSAmJiB0MSAhPSAnJykge1xuICAgICAgdmFyIGRpZmYgPSBkYXlqcygpLmRpZmYocGFyc2VJbnQodDEpKTtcbiAgICAgIGlmIChkaWZmIDwgY3N0LlJFTE9BRF9MT0NLX1RJTUVPVVQpXG4gICAgICAgIHJldHVybiBkaWZmO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkgeyB9XG5cbiAgdHJ5IHtcbiAgICAvLyBXcml0ZSBsYXRlc3QgdGltZXN0YW1wXG4gICAgZnMud3JpdGVGaWxlU3luYyhjc3QuUE0yX1JFTE9BRF9MT0NLRklMRSwgZGF5anMoKS52YWx1ZU9mKCkudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIDA7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSB8fCBlKTtcbiAgfVxufTtcblxuQ29tbW9uLnVubG9ja1JlbG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICBmcy53cml0ZUZpbGVTeW5jKGNzdC5QTTJfUkVMT0FEX0xPQ0tGSUxFLCAnJyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSB8fCBlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXNvbHZlIGFwcCBwYXRocyBhbmQgcmVwbGFjZSBtaXNzaW5nIHZhbHVlcyB3aXRoIGRlZmF1bHRzLlxuICogQG1ldGhvZCBwcmVwYXJlQXBwQ29uZlxuICogQHBhcmFtIGFwcCB7T2JqZWN0fVxuICogQHBhcmFtIHt9IGN3ZFxuICogQHBhcmFtIHt9IG91dHB1dHRlclxuICogQHJldHVybiBhcHBcbiAqL1xuQ29tbW9uLnByZXBhcmVBcHBDb25mID0gZnVuY3Rpb24gKG9wdHMsIGFwcCkge1xuICAvKipcbiAgICogTWluaW11bSB2YWxpZGF0aW9uXG4gICAqL1xuICBpZiAoIWFwcC5zY3JpcHQpXG4gICAgcmV0dXJuIG5ldyBFcnJvcignTm8gc2NyaXB0IHBhdGggLSBhYm9ydGluZycpO1xuXG4gIHZhciBjd2QgPSBudWxsO1xuXG4gIGlmIChhcHAuY3dkKSB7XG4gICAgY3dkID0gcGF0aC5yZXNvbHZlKGFwcC5jd2QpO1xuICAgIHByb2Nlc3MuZW52LlBXRCA9IGFwcC5jd2Q7XG4gIH1cblxuICBpZiAoIWFwcC5ub2RlX2FyZ3MpIHtcbiAgICBhcHAubm9kZV9hcmdzID0gW107XG4gIH1cblxuICBpZiAoYXBwLnBvcnQgJiYgYXBwLmVudikge1xuICAgIGFwcC5lbnYuUE9SVCA9IGFwcC5wb3J0O1xuICB9XG5cbiAgLy8gQ1dEIG9wdGlvbiByZXNvbHZpbmdcbiAgY3dkICYmIChjd2RbMF0gIT0gJy8nKSAmJiAoY3dkID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIGN3ZCkpO1xuICBjd2QgPSBjd2QgfHwgb3B0cy5jd2Q7XG5cbiAgLy8gRnVsbCBwYXRoIHNjcmlwdCByZXNvbHV0aW9uXG4gIGFwcC5wbV9leGVjX3BhdGggPSBwYXRoLnJlc29sdmUoY3dkLCBhcHAuc2NyaXB0KTtcblxuICAvLyBJZiBzY3JpcHQgZG9lcyBub3QgZXhpc3QgYWZ0ZXIgcmVzb2x1dGlvblxuICBpZiAoIWZzLmV4aXN0c1N5bmMoYXBwLnBtX2V4ZWNfcGF0aCkpIHtcbiAgICB2YXIgY2tkO1xuICAgIC8vIFRyeSByZXNvbHZlIGNvbW1hbmQgYXZhaWxhYmxlIGluICRQQVRIXG4gICAgaWYgKChja2QgPSB3aGljaChhcHAuc2NyaXB0KSkpIHtcbiAgICAgIGlmICh0eXBlb2YgKGNrZCkgIT09ICdzdHJpbmcnKVxuICAgICAgICBja2QgPSBja2QudG9TdHJpbmcoKTtcbiAgICAgIGFwcC5wbV9leGVjX3BhdGggPSBja2Q7XG4gICAgfVxuICAgIGVsc2VcbiAgICAgIC8vIFRocm93IGNyaXRpY2FsIGVycm9yXG4gICAgICByZXR1cm4gbmV3IEVycm9yKGBTY3JpcHQgbm90IGZvdW5kOiAke2FwcC5wbV9leGVjX3BhdGh9YCk7XG4gIH1cblxuICAvKipcbiAgICogQXV0byBkZXRlY3QgLm1hcCBmaWxlIGFuZCBlbmFibGUgc291cmNlIG1hcCBzdXBwb3J0IGF1dG9tYXRpY2FsbHlcbiAgICovXG4gIGlmIChhcHAuZGlzYWJsZV9zb3VyY2VfbWFwX3N1cHBvcnQgIT0gdHJ1ZSkge1xuICAgIHRyeSB7XG4gICAgICBmcy5hY2Nlc3NTeW5jKGFwcC5wbV9leGVjX3BhdGggKyAnLm1hcCcsIGZzLmNvbnN0YW50cy5SX09LKTtcbiAgICAgIGFwcC5zb3VyY2VfbWFwX3N1cHBvcnQgPSB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHsgfVxuICAgIGRlbGV0ZSBhcHAuZGlzYWJsZV9zb3VyY2VfbWFwX3N1cHBvcnQ7XG4gIH1cblxuICBkZWxldGUgYXBwLnNjcmlwdDtcblxuICAvLyBTZXQgY3VycmVudCBlbnYgYnkgZmlyc3QgYWRkaW5nIHRoZSBwcm9jZXNzIGVudmlyb25tZW50IGFuZCB0aGVuIGV4dGVuZGluZy9yZXBsYWNpbmcgaXRcbiAgLy8gd2l0aCBlbnYgc3BlY2lmaWVkIG9uIGNvbW1hbmQtbGluZSBvciBKU09OIGZpbGUuXG5cbiAgdmFyIGVudiA9IHt9O1xuXG4gIC8qKlxuICAgKiBEbyBub3QgY29weSBpbnRlcm5hbCBwbTIgZW52aXJvbm1lbnQgdmFyaWFibGVzIGlmIGFjdGluZyBvbiBwcm9jZXNzXG4gICAqIGlzIG1hZGUgZnJvbSBhIHByb2dyYW1tYXRpYyBzY3JpcHQgc3RhcnRlZCBieSBQTTIgb3IgaWYgYSBwbV9pZCBpcyBwcmVzZW50IGluIGVudlxuICAgKi9cbiAgaWYgKGNzdC5QTTJfUFJPR1JBTU1BVElDIHx8IHByb2Nlc3MuZW52LnBtX2lkKVxuICAgIENvbW1vbi5zYWZlRXh0ZW5kKGVudiwgcHJvY2Vzcy5lbnYpO1xuICBlbHNlXG4gICAgZW52ID0gcHJvY2Vzcy5lbnY7XG5cbiAgZnVuY3Rpb24gZmlsdGVyRW52KGVudk9iaikge1xuICAgIGlmIChhcHAuZmlsdGVyX2VudiA9PSB0cnVlKVxuICAgICAgcmV0dXJuIHt9XG5cbiAgICBpZiAodHlwZW9mIGFwcC5maWx0ZXJfZW52ID09PSAnc3RyaW5nJykge1xuICAgICAgZGVsZXRlIGVudk9ialthcHAuZmlsdGVyX2Vudl1cbiAgICAgIHJldHVybiBlbnZPYmpcbiAgICB9XG5cbiAgICB2YXIgbmV3X2VudiA9IHt9O1xuICAgIHZhciBhbGxvd2VkS2V5cyA9IGFwcC5maWx0ZXJfZW52LnJlZHVjZSgoYWNjLCBjdXJyZW50KSA9PlxuICAgICAgYWNjLmZpbHRlcihpdGVtID0+ICFpdGVtLmluY2x1ZGVzKGN1cnJlbnQpKSwgT2JqZWN0LmtleXMoZW52T2JqKSlcbiAgICBhbGxvd2VkS2V5cy5mb3JFYWNoKGtleSA9PiBuZXdfZW52W2tleV0gPSBlbnZPYmpba2V5XSk7XG4gICAgcmV0dXJuIG5ld19lbnZcbiAgfVxuXG4gIGFwcC5lbnYgPSBbXG4gICAge30sIChhcHAuZmlsdGVyX2VudiAmJiBhcHAuZmlsdGVyX2Vudi5sZW5ndGggPiAwKSA/IGZpbHRlckVudihwcm9jZXNzLmVudikgOiBlbnYsIGFwcC5lbnYgfHwge31cbiAgXS5yZWR1Y2UoZnVuY3Rpb24gKGUxLCBlMikge1xuICAgIHJldHVybiB1dGlsLmluaGVyaXRzKGUxLCBlMik7XG4gIH0pO1xuXG4gIGFwcC5wbV9jd2QgPSBjd2Q7XG4gIC8vIEludGVycHJldGVyXG4gIHRyeSB7XG4gICAgQ29tbW9uLnNpbmsucmVzb2x2ZUludGVycHJldGVyKGFwcCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZVxuICB9XG5cbiAgLy8gRXhlYyBtb2RlIGFuZCBjbHVzdGVyIHN0dWZmXG4gIENvbW1vbi5zaW5rLmRldGVybWluZUV4ZWNNb2RlKGFwcCk7XG5cbiAgLyoqXG4gICAqIFNjYXJ5XG4gICAqL1xuICB2YXIgZm9ybWF0ZWRfYXBwX25hbWUgPSBhcHAubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOVxcXFwuXFxcXC1dL2csICctJyk7XG5cbiAgWydsb2cnLCAnb3V0JywgJ2Vycm9yJywgJ3BpZCddLmZvckVhY2goZnVuY3Rpb24gKGYpIHtcbiAgICB2YXIgYWYgPSBhcHBbZiArICdfZmlsZSddLCBwcywgZXh0ID0gKGYgPT0gJ3BpZCcgPyAncGlkJyA6ICdsb2cnKSwgaXNTdGQgPSAhflsnbG9nJywgJ3BpZCddLmluZGV4T2YoZik7XG4gICAgaWYgKGFmKSBhZiA9IHJlc29sdmVIb21lKGFmKTtcblxuICAgIGlmICgoZiA9PSAnbG9nJyAmJiB0eXBlb2YgYWYgPT0gJ2Jvb2xlYW4nICYmIGFmKSB8fCAoZiAhPSAnbG9nJyAmJiAhYWYpKSB7XG4gICAgICBwcyA9IFtjc3RbJ0RFRkFVTFRfJyArIGV4dC50b1VwcGVyQ2FzZSgpICsgJ19QQVRIJ10sIGZvcm1hdGVkX2FwcF9uYW1lICsgKGlzU3RkID8gJy0nICsgZiA6ICcnKSArICcuJyArIGV4dF07XG4gICAgfSBlbHNlIGlmICgoZiAhPSAnbG9nJyB8fCAoZiA9PSAnbG9nJyAmJiBhZikpICYmIGFmICE9PSAnTlVMTCcgJiYgYWYgIT09ICcvZGV2L251bGwnKSB7XG4gICAgICBwcyA9IFtjd2QsIGFmXTtcblxuICAgICAgdmFyIGRpciA9IHBhdGguZGlybmFtZShwYXRoLnJlc29sdmUoY3dkLCBhZikpO1xuICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfV0FSTklORyArICdGb2xkZXIgZG9lcyBub3QgZXhpc3Q6ICcgKyBkaXIpO1xuICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnQ3JlYXRpbmcgZm9sZGVyOiAnICsgZGlyKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBta2RpcnAuc3luYyhkaXIpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyAnQ291bGQgbm90IGNyZWF0ZSBmb2xkZXI6ICcgKyBwYXRoLmRpcm5hbWUoYWYpKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBjcmVhdGUgZm9sZGVyJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIH1cbiAgICAvLyBQTTIgcGF0aHNcbiAgICBpZiAoYWYgIT09ICdOVUxMJyAmJiBhZiAhPT0gJy9kZXYvbnVsbCcpIHtcbiAgICAgIHBzICYmIChhcHBbJ3BtXycgKyAoaXNTdGQgPyBmLnN1YnN0cigwLCAzKSArICdfJyA6ICcnKSArIGV4dCArICdfcGF0aCddID0gcGF0aC5yZXNvbHZlLmFwcGx5KG51bGwsIHBzKSk7XG4gICAgfSBlbHNlIGlmIChwYXRoLnNlcCA9PT0gJ1xcXFwnKSB7XG4gICAgICBhcHBbJ3BtXycgKyAoaXNTdGQgPyBmLnN1YnN0cigwLCAzKSArICdfJyA6ICcnKSArIGV4dCArICdfcGF0aCddID0gJ1xcXFxcXFxcLlxcXFxOVUwnO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcHBbJ3BtXycgKyAoaXNTdGQgPyBmLnN1YnN0cigwLCAzKSArICdfJyA6ICcnKSArIGV4dCArICdfcGF0aCddID0gJy9kZXYvbnVsbCc7XG4gICAgfVxuICAgIGRlbGV0ZSBhcHBbZiArICdfZmlsZSddO1xuICB9KTtcblxuICByZXR1cm4gYXBwO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiBmaWxlbmFtZSBpcyBhIGNvbmZpZ3VyYXRpb24gZmlsZVxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lXG4gKiBAcmV0dXJuIHttaXhlZH0gbnVsbCBpZiBub3QgY29uZiBmaWxlLCBqc29uIG9yIHlhbWwgaWYgY29uZlxuICovXG5Db21tb24uaXNDb25maWdGaWxlID0gZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gIGlmICh0eXBlb2YgKGZpbGVuYW1lKSAhPT0gJ3N0cmluZycpXG4gICAgcmV0dXJuIG51bGw7XG4gIGlmIChmaWxlbmFtZS5pbmRleE9mKCcuanNvbicpICE9PSAtMSlcbiAgICByZXR1cm4gJ2pzb24nO1xuICBpZiAoZmlsZW5hbWUuaW5kZXhPZignLnltbCcpID4gLTEgfHwgZmlsZW5hbWUuaW5kZXhPZignLnlhbWwnKSA+IC0xKVxuICAgIHJldHVybiAneWFtbCc7XG4gIGlmIChmaWxlbmFtZS5pbmRleE9mKCcuY29uZmlnLmpzJykgIT09IC0xKVxuICAgIHJldHVybiAnanMnO1xuICBpZiAoZmlsZW5hbWUuaW5kZXhPZignLmNvbmZpZy5janMnKSAhPT0gLTEpXG4gICAgcmV0dXJuICdqcyc7XG4gIGlmIChmaWxlbmFtZS5pbmRleE9mKCcuY29uZmlnLm1qcycpICE9PSAtMSlcbiAgICByZXR1cm4gJ21qcyc7XG4gIHJldHVybiBudWxsO1xufTtcblxuLyoqXG4gKiBQYXJzZXMgYSBjb25maWcgZmlsZSBsaWtlIGVjb3N5c3RlbS5jb25maWcuanMuIFN1cHBvcnRlZCBmb3JtYXRzOiBKUywgSlNPTiwgSlNPTjUsIFlBTUwuXG4gKiBAcGFyYW0ge3N0cmluZ30gY29uZlN0cmluZyAgY29udGVudHMgb2YgdGhlIGNvbmZpZyBmaWxlXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgICAgcGF0aCB0byB0aGUgY29uZmlnIGZpbGVcbiAqIEByZXR1cm4ge09iamVjdH0gY29uZmlnIG9iamVjdFxuICovXG5Db21tb24ucGFyc2VDb25maWcgPSBmdW5jdGlvbiAoY29uZk9iaiwgZmlsZW5hbWUpIHtcbiAgaWYgKCFmaWxlbmFtZSB8fFxuICAgIGZpbGVuYW1lID09ICdwaXBlJyB8fFxuICAgIGZpbGVuYW1lID09ICdub25lJyB8fFxuICAgIGZpbGVuYW1lLmluZGV4T2YoJy5qc29uJykgPiAtMSkge1xuICAgIHZhciBjb2RlID0gJygnICsgY29uZk9iaiArICcpJztcbiAgICB2YXIgc2FuZGJveCA9IHt9O1xuXG4gICAgLy8gVE9ETzogUGxlYXNlIGNoZWNrIHRoaXNcbiAgICAvLyByZXR1cm4gdm0ucnVuSW5UaGlzQ29udGV4dChjb2RlLCBzYW5kYm94LCB7XG4gICAgLy8gICBmaWxlbmFtZTogcGF0aC5yZXNvbHZlKGZpbGVuYW1lKSxcbiAgICAvLyAgIGRpc3BsYXlFcnJvcnM6IGZhbHNlLFxuICAgIC8vICAgdGltZW91dDogMTAwMFxuICAgIC8vIH0pO1xuICAgIHJldHVybiB2bS5ydW5JblRoaXNDb250ZXh0KGNvZGUsIHtcbiAgICAgIGZpbGVuYW1lOiBwYXRoLnJlc29sdmUoZmlsZW5hbWUpLFxuICAgICAgZGlzcGxheUVycm9yczogZmFsc2UsXG4gICAgICB0aW1lb3V0OiAxMDAwXG4gICAgfSk7XG4gIH1cbiAgZWxzZSBpZiAoZmlsZW5hbWUuaW5kZXhPZignLnltbCcpID4gLTEgfHxcbiAgICBmaWxlbmFtZS5pbmRleE9mKCcueWFtbCcpID4gLTEpIHtcbiAgICByZXR1cm4geWFtbGpzLnBhcnNlKGNvbmZPYmoudG9TdHJpbmcoKSk7XG4gIH1cbiAgZWxzZSBpZiAoZmlsZW5hbWUuaW5kZXhPZignLmNvbmZpZy5qcycpID4gLTEgfHwgZmlsZW5hbWUuaW5kZXhPZignLmNvbmZpZy5janMnKSA+IC0xIHx8IGZpbGVuYW1lLmluZGV4T2YoJy5jb25maWcubWpzJykgPiAtMSkge1xuICAgIHZhciBjb25mUGF0aCA9IHJlcXVpcmUucmVzb2x2ZShwYXRoLnJlc29sdmUoZmlsZW5hbWUpKTtcbiAgICBkZWxldGUgcmVxdWlyZS5jYWNoZVtjb25mUGF0aF07XG4gICAgcmV0dXJuIHJlcXVpcmUoY29uZlBhdGgpO1xuICB9XG59O1xuXG5Db21tb24ucmV0RXJyID0gZnVuY3Rpb24gKGUpIHtcbiAgaWYgKCFlKVxuICAgIHJldHVybiBuZXcgRXJyb3IoJ1VuaWRlbnRpZmllZCBlcnJvcicpO1xuICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yKVxuICAgIHJldHVybiBlO1xuICByZXR1cm4gbmV3IEVycm9yKGUpO1xufVxuXG5Db21tb24uc2luayA9IHt9O1xuXG5Db21tb24uc2luay5kZXRlcm1pbmVDcm9uID0gZnVuY3Rpb24gKGFwcCkge1xuXG4gIGlmIChhcHAuY3Jvbl9yZXN0YXJ0KSB7XG4gICAgdHJ5IHtcbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdjcm9uIHJlc3RhcnQgYXQgJyArIGFwcC5jcm9uX3Jlc3RhcnQpO1xuICAgICAgbmV3IENyb25Kb2IoYXBwLmNyb25fcmVzdGFydCwgZnVuY3Rpb24gKCkge1xuICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnY3JvbiBwYXR0ZXJuIGZvciBhdXRvIHJlc3RhcnQgZGV0ZWN0ZWQgYW5kIHZhbGlkJyk7XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcihgQ3JvbiBwYXR0ZXJuIGVycm9yOiAke2V4Lm1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEhhbmRsZSBhbGlhcyAoZm9yayA8PT4gZm9ya19tb2RlLCBjbHVzdGVyIDw9PiBjbHVzdGVyX21vZGUpXG4gKi9cbkNvbW1vbi5zaW5rLmRldGVybWluZUV4ZWNNb2RlID0gZnVuY3Rpb24gKGFwcCkge1xuICBpZiAoYXBwLmV4ZWNfbW9kZSlcbiAgICBhcHAuZXhlY19tb2RlID0gYXBwLmV4ZWNfbW9kZS5yZXBsYWNlKC9eKGZvcmt8Y2x1c3RlcikkLywgJyQxX21vZGUnKTtcblxuICAvKipcbiAgICogSGVyZSB3ZSBwdXQgdGhlIGRlZmF1bHQgZXhlYyBtb2RlXG4gICAqL1xuICBpZiAoIWFwcC5leGVjX21vZGUgJiZcbiAgICAoYXBwLmluc3RhbmNlcyA+PSAxIHx8IGFwcC5pbnN0YW5jZXMgPT09IDAgfHwgYXBwLmluc3RhbmNlcyA9PT0gLTEpICYmXG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIuaW5kZXhPZignbm9kZScpID4gLTEpIHtcbiAgICBhcHAuZXhlY19tb2RlID0gJ2NsdXN0ZXJfbW9kZSc7XG4gIH0gZWxzZSBpZiAoIWFwcC5leGVjX21vZGUpIHtcbiAgICBhcHAuZXhlY19tb2RlID0gJ2ZvcmtfbW9kZSc7XG4gIH1cbiAgaWYgKHR5cGVvZiBhcHAuaW5zdGFuY2VzID09ICd1bmRlZmluZWQnKVxuICAgIGFwcC5pbnN0YW5jZXMgPSAxO1xufTtcblxudmFyIHJlc29sdmVOb2RlSW50ZXJwcmV0ZXIgPSBmdW5jdGlvbiAoYXBwKSB7XG4gIGlmIChhcHAuZXhlY19tb2RlICYmIGFwcC5leGVjX21vZGUuaW5kZXhPZignY2x1c3RlcicpID4gLTEpIHtcbiAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19XQVJOSU5HICsgY2hhbGsuYm9sZC55ZWxsb3coJ0Nob29zaW5nIHRoZSBOb2RlLmpzIHZlcnNpb24gaW4gY2x1c3RlciBtb2RlIGlzIG5vdCBzdXBwb3J0ZWQnKSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFyIG52bV9wYXRoID0gY3N0LklTX1dJTkRPV1MgPyBwcm9jZXNzLmVudi5OVk1fSE9NRSA6IHByb2Nlc3MuZW52Lk5WTV9ESVI7XG4gIGlmICghbnZtX3BhdGgpIHtcbiAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyBjaGFsay5yZWQoJ05WTSBpcyBub3QgYXZhaWxhYmxlIGluIFBBVEgnKSk7XG4gICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgY2hhbGsucmVkKCdGYWxsYmFjayB0byBub2RlIGluIFBBVEgnKSk7XG4gICAgdmFyIG1zZyA9IGNzdC5JU19XSU5ET1dTXG4gICAgICA/ICdodHRwczovL2dpdGh1Yi5jb20vY29yZXlidXRsZXIvbnZtLXdpbmRvd3MvcmVsZWFzZXMvJ1xuICAgICAgOiAnJCBjdXJsIGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9jcmVhdGlvbml4L252bS9tYXN0ZXIvaW5zdGFsbC5zaCB8IGJhc2gnO1xuICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19FUlIgKyBjaGFsay5ib2xkKCdJbnN0YWxsIE5WTTpcXG4nICsgbXNnKSk7XG4gIH1cbiAgZWxzZSB7XG4gICAgdmFyIG5vZGVfdmVyc2lvbiA9IGFwcC5leGVjX2ludGVycHJldGVyLnNwbGl0KCdAJylbMV07XG4gICAgdmFyIHBhdGhfdG9fbm9kZSA9IGNzdC5JU19XSU5ET1dTXG4gICAgICA/ICcvdicgKyBub2RlX3ZlcnNpb24gKyAnL25vZGUuZXhlJ1xuICAgICAgOiBzZW12ZXIuc2F0aXNmaWVzKG5vZGVfdmVyc2lvbiwgJz49IDAuMTIuMCcpXG4gICAgICAgID8gJy92ZXJzaW9ucy9ub2RlL3YnICsgbm9kZV92ZXJzaW9uICsgJy9iaW4vbm9kZSdcbiAgICAgICAgOiAnL3YnICsgbm9kZV92ZXJzaW9uICsgJy9iaW4vbm9kZSc7XG4gICAgdmFyIG52bV9ub2RlX3BhdGggPSBwYXRoLmpvaW4obnZtX3BhdGgsIHBhdGhfdG9fbm9kZSk7XG4gICAgdHJ5IHtcbiAgICAgIGZzLmFjY2Vzc1N5bmMobnZtX25vZGVfcGF0aCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0luc3RhbGxpbmcgTm9kZSB2JXMnLCBub2RlX3ZlcnNpb24pO1xuICAgICAgdmFyIG52bV9iaW4gPSBwYXRoLmpvaW4obnZtX3BhdGgsICdudm0uJyArIChjc3QuSVNfV0lORE9XUyA/ICdleGUnIDogJ3NoJykpO1xuICAgICAgdmFyIG52bV9jbWQgPSBjc3QuSVNfV0lORE9XU1xuICAgICAgICA/IG52bV9iaW4gKyAnIGluc3RhbGwgJyArIG5vZGVfdmVyc2lvblxuICAgICAgICA6ICcuICcgKyBudm1fYmluICsgJyA7IG52bSBpbnN0YWxsICcgKyBub2RlX3ZlcnNpb247XG5cbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdFeGVjdXRpbmc6ICVzJywgbnZtX2NtZCk7XG5cbiAgICAgIGV4ZWNTeW5jKG52bV9jbWQsIHtcbiAgICAgICAgY3dkOiBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSksXG4gICAgICAgIGVudjogcHJvY2Vzcy5lbnYsXG4gICAgICAgIG1heEJ1ZmZlcjogMjAgKiAxMDI0ICogMTAyNFxuICAgICAgfSk7XG5cbiAgICAgIC8vIGluIG9yZGVyIHRvIHN1cHBvcnQgYm90aCBhcmNoLCBudm0gZm9yIFdpbmRvd3MgcmVuYW1lcyAnbm9kZS5leGUnIHRvOlxuICAgICAgLy8gJ25vZGUzMi5leGUnIGZvciB4MzIgYXJjaFxuICAgICAgLy8gJ25vZGU2NC5leGUnIGZvciB4NjQgYXJjaFxuICAgICAgaWYgKGNzdC5JU19XSU5ET1dTKVxuICAgICAgICBudm1fbm9kZV9wYXRoID0gbnZtX25vZGVfcGF0aC5yZXBsYWNlKC9ub2RlLywgJ25vZGUnICsgcHJvY2Vzcy5hcmNoLnNsaWNlKDEpKVxuICAgIH1cblxuICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArIGNoYWxrLmdyZWVuLmJvbGQoJ1NldHRpbmcgTm9kZSB0byB2JXMgKHBhdGg9JXMpJyksXG4gICAgICBub2RlX3ZlcnNpb24sXG4gICAgICBudm1fbm9kZV9wYXRoKTtcblxuICAgIGFwcC5leGVjX2ludGVycHJldGVyID0gbnZtX25vZGVfcGF0aDtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXNvbHZlIGludGVycHJldGVyXG4gKi9cbkNvbW1vbi5zaW5rLnJlc29sdmVJbnRlcnByZXRlciA9IGZ1bmN0aW9uIChhcHApIHtcbiAgdmFyIG5vSW50ZXJwcmV0ZXIgPSAhYXBwLmV4ZWNfaW50ZXJwcmV0ZXI7XG4gIHZhciBleHROYW1lID0gcGF0aC5leHRuYW1lKGFwcC5wbV9leGVjX3BhdGgpO1xuICB2YXIgYmV0dGVySW50ZXJwcmV0ZXIgPSBleHRJdHBzW2V4dE5hbWVdO1xuXG4gIC8vIE5vIGludGVycHJldGVyIGRlZmluZWQgYW5kIGNvcnJlc3BvbmRhbmNlIGluIHNjaGVtYSBoYXNobWFwXG4gIGlmIChub0ludGVycHJldGVyICYmIGJldHRlckludGVycHJldGVyKSB7XG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPSBiZXR0ZXJJbnRlcnByZXRlcjtcbiAgfVxuICAvLyBFbHNlIGlmIG5vIEludGVycHJldGVyIGRldGVjdCBpZiBwcm9jZXNzIGlzIGJpbmFyeVxuICBlbHNlIGlmIChub0ludGVycHJldGVyKVxuICAgIGFwcC5leGVjX2ludGVycHJldGVyID0gaXNCaW5hcnkoYXBwLnBtX2V4ZWNfcGF0aCkgPyAnbm9uZScgOiAnbm9kZSc7XG4gIGVsc2UgaWYgKGFwcC5leGVjX2ludGVycHJldGVyLmluZGV4T2YoJ25vZGVAJykgPiAtMSlcbiAgICByZXNvbHZlTm9kZUludGVycHJldGVyKGFwcCk7XG5cbiAgaWYgKGFwcC5leGVjX2ludGVycHJldGVyLmluZGV4T2YoJ3B5dGhvbicpID4gLTEpXG4gICAgYXBwLmVudi5QWVRIT05VTkJVRkZFUkVEID0gJzEnXG5cbiAgLyoqXG4gICAqIFNwZWNpZmljIGluc3RhbGxlZCBKUyB0cmFuc3BpbGVyc1xuICAgKi9cbiAgaWYgKGFwcC5leGVjX2ludGVycHJldGVyID09ICd0cy1ub2RlJykge1xuICAgIGFwcC5leGVjX2ludGVycHJldGVyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL25vZGVfbW9kdWxlcy8uYmluL3RzLW5vZGUnKTtcbiAgfVxuXG4gIGlmIChhcHAuZXhlY19pbnRlcnByZXRlciA9PSAnbHNjJykge1xuICAgIGFwcC5leGVjX2ludGVycHJldGVyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL25vZGVfbW9kdWxlcy8uYmluL2xzYycpO1xuICB9XG5cbiAgaWYgKGFwcC5leGVjX2ludGVycHJldGVyID09ICdjb2ZmZWUnKSB7XG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vbm9kZV9tb2R1bGVzLy5iaW4vY29mZmVlJyk7XG4gIH1cblxuICBpZiAoYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgIT0gJ25vbmUnICYmIHdoaWNoKGFwcC5leGVjX2ludGVycHJldGVyKSA9PSBudWxsKSB7XG4gICAgLy8gSWYgbm9kZSBpcyBub3QgcHJlc2VudFxuICAgIGlmIChhcHAuZXhlY19pbnRlcnByZXRlciA9PSAnbm9kZScpIHtcbiAgICAgIENvbW1vbi53YXJuKGBVc2luZyBidWlsdGluIG5vZGUuanMgdmVyc2lvbiBvbiB2ZXJzaW9uICR7cHJvY2Vzcy52ZXJzaW9ufWApXG4gICAgICBhcHAuZXhlY19pbnRlcnByZXRlciA9IGNzdC5CVUlMVElOX05PREVfUEFUSFxuICAgIH1cbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludGVycHJldGVyICR7YXBwLmV4ZWNfaW50ZXJwcmV0ZXJ9IGlzIE5PVCBBVkFJTEFCTEUgaW4gUEFUSC4gKHR5cGUgJ3doaWNoICR7YXBwLmV4ZWNfaW50ZXJwcmV0ZXJ9JyB0byBkb3VibGUgY2hlY2suKWApXG4gIH1cblxuICByZXR1cm4gYXBwO1xufTtcblxuQ29tbW9uLmRlZXBDb3B5ID0gQ29tbW9uLnNlcmlhbGl6ZSA9IENvbW1vbi5jbG9uZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKG9iaiA9PT0gbnVsbCB8fCBvYmogPT09IHVuZGVmaW5lZCkgcmV0dXJuIHt9O1xuICByZXR1cm4gZmNsb25lKG9iaik7XG59O1xuXG5Db21tb24uZXJyTW9kID0gZnVuY3Rpb24gKG1zZykge1xuICBpZiAocHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCB8fCBwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID09PSAndHJ1ZScpIHJldHVybiBmYWxzZTtcbiAgaWYgKG1zZyBpbnN0YW5jZW9mIEVycm9yKVxuICAgIHJldHVybiBjb25zb2xlLmVycm9yKG1zZy5tZXNzYWdlKTtcbiAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBSRUZJWF9NU0dfTU9EX0VSUn0ke21zZ31gKTtcbn1cblxuQ29tbW9uLmVyciA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9TSUxFTlQgfHwgcHJvY2Vzcy5lbnYuUE0yX1BST0dSQU1NQVRJQyA9PT0gJ3RydWUnKSByZXR1cm4gZmFsc2U7XG4gIGlmIChtc2cgaW5zdGFuY2VvZiBFcnJvcilcbiAgICByZXR1cm4gY29uc29sZS5lcnJvcihgJHtjc3QuUFJFRklYX01TR19FUlJ9JHttc2cubWVzc2FnZX1gKTtcbiAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBSRUZJWF9NU0dfRVJSfSR7bXNnfWApO1xufVxuXG5Db21tb24ucHJpbnRFcnJvciA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9TSUxFTlQgfHwgcHJvY2Vzcy5lbnYuUE0yX1BST0dSQU1NQVRJQyA9PT0gJ3RydWUnKSByZXR1cm4gZmFsc2U7XG4gIGlmIChtc2cgaW5zdGFuY2VvZiBFcnJvcilcbiAgICByZXR1cm4gY29uc29sZS5lcnJvcihtc2cubWVzc2FnZSk7XG4gIHJldHVybiBjb25zb2xlLmVycm9yLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyBhcyBhbnkpO1xufTtcblxuQ29tbW9uLmxvZyA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9TSUxFTlQgfHwgcHJvY2Vzcy5lbnYuUE0yX1BST0dSQU1NQVRJQyA9PT0gJ3RydWUnKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBjb25zb2xlLmxvZyhgJHtjc3QuUFJFRklYX01TR30ke21zZ31gKTtcbn1cblxuQ29tbW9uLmluZm8gPSBmdW5jdGlvbiAobXNnKSB7XG4gIGlmIChwcm9jZXNzLmVudi5QTTJfU0lMRU5UIHx8IHByb2Nlc3MuZW52LlBNMl9QUk9HUkFNTUFUSUMgPT09ICd0cnVlJykgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gY29uc29sZS5sb2coYCR7Y3N0LlBSRUZJWF9NU0dfSU5GT30ke21zZ31gKTtcbn1cblxuQ29tbW9uLndhcm4gPSBmdW5jdGlvbiAobXNnKSB7XG4gIGlmIChwcm9jZXNzLmVudi5QTTJfU0lMRU5UIHx8IHByb2Nlc3MuZW52LlBNMl9QUk9HUkFNTUFUSUMgPT09ICd0cnVlJykgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gY29uc29sZS5sb2coYCR7Y3N0LlBSRUZJWF9NU0dfV0FSTklOR30ke21zZ31gKTtcbn1cblxuQ29tbW9uLmxvZ01vZCA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9TSUxFTlQgfHwgcHJvY2Vzcy5lbnYuUE0yX1BST0dSQU1NQVRJQyA9PT0gJ3RydWUnKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBjb25zb2xlLmxvZyhgJHtjc3QuUFJFRklYX01TR19NT0R9JHttc2d9YCk7XG59XG5cbkNvbW1vbi5wcmludE91dCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9TSUxFTlQgPT09ICd0cnVlJyB8fCBwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID09PSAndHJ1ZScpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyBhcyBhbnkpO1xufTtcblxuXG4vKipcbiAqIFJhdyBleHRlbmRcbiAqL1xuQ29tbW9uLmV4dGVuZCA9IGZ1bmN0aW9uIChkZXN0aW5hdGlvbiwgc291cmNlKSB7XG4gIGlmICh0eXBlb2YgZGVzdGluYXRpb24gIT09ICdvYmplY3QnKSB7XG4gICAgZGVzdGluYXRpb24gPSB7fTtcbiAgfVxuICBpZiAoIXNvdXJjZSB8fCB0eXBlb2Ygc291cmNlICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBkZXN0aW5hdGlvbjtcbiAgfVxuXG4gIE9iamVjdC5rZXlzKHNvdXJjZSkuZm9yRWFjaChmdW5jdGlvbiAobmV3X2tleSkge1xuICAgIGlmIChzb3VyY2VbbmV3X2tleV0gIT0gJ1tvYmplY3QgT2JqZWN0XScpXG4gICAgICBkZXN0aW5hdGlvbltuZXdfa2V5XSA9IHNvdXJjZVtuZXdfa2V5XTtcbiAgfSk7XG5cbiAgcmV0dXJuIGRlc3RpbmF0aW9uO1xufTtcblxuLyoqXG4gKiBUaGlzIGlzIHVzZWZ1bCB3aGVuIHN0YXJ0aW5nIHNjcmlwdCBwcm9ncmFtbWF0aWNhbGx5XG4gKi9cbkNvbW1vbi5zYWZlRXh0ZW5kID0gZnVuY3Rpb24gKG9yaWdpbiwgYWRkKSB7XG4gIGlmICghYWRkIHx8IHR5cGVvZiBhZGQgIT0gJ29iamVjdCcpIHJldHVybiBvcmlnaW47XG5cbiAgLy9JZ25vcmUgUE0yJ3Mgc2V0IGVudmlyb25tZW50IHZhcmlhYmxlcyBmcm9tIHRoZSBuZXN0ZWQgZW52XG4gIHZhciBrZXlzVG9JZ25vcmUgPSBbJ25hbWUnLCAnZXhlY19tb2RlJywgJ2VudicsICdhcmdzJywgJ3BtX2N3ZCcsICdleGVjX2ludGVycHJldGVyJywgJ3BtX2V4ZWNfcGF0aCcsICdub2RlX2FyZ3MnLCAncG1fb3V0X2xvZ19wYXRoJywgJ3BtX2Vycl9sb2dfcGF0aCcsICdwbV9waWRfcGF0aCcsICdwbV9pZCcsICdzdGF0dXMnLCAncG1fdXB0aW1lJywgJ2NyZWF0ZWRfYXQnLCAnd2luZG93c0hpZGUnLCAndXNlcm5hbWUnLCAnbWVyZ2VfbG9ncycsICdraWxsX3JldHJ5X3RpbWUnLCAncHJldl9yZXN0YXJ0X2RlbGF5JywgJ2luc3RhbmNlX3ZhcicsICd1bnN0YWJsZV9yZXN0YXJ0cycsICdyZXN0YXJ0X3RpbWUnLCAnYXhtX2FjdGlvbnMnLCAncG14X21vZHVsZScsICdjb21tYW5kJywgJ3dhdGNoJywgJ2ZpbHRlcl9lbnYnLCAndmVyc2lvbmluZycsICd2aXppb25fcnVuaW5nJywgJ01PRFVMRV9ERUJVRycsICdwbXgnLCAnYXhtX29wdGlvbnMnLCAnY3JlYXRlZF9hdCcsICd3YXRjaCcsICd2aXppb24nLCAnYXhtX2R5bmFtaWMnLCAnYXhtX21vbml0b3InLCAnaW5zdGFuY2VzJywgJ2F1dG9tYXRpb24nLCAnYXV0b3Jlc3RhcnQnLCAndW5zdGFibGVfcmVzdGFydCcsICd0cmVla2lsbCcsICdleGl0X2NvZGUnLCAndml6aW9uJ107XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgLy9Pbmx5IGNvcHkgc3R1ZmYgaW50byB0aGUgZW52IHRoYXQgd2UgZG9uJ3QgaGF2ZSBhbHJlYWR5LlxuICAgIGlmIChrZXlzVG9JZ25vcmUuaW5kZXhPZihrZXlzW2ldKSA9PSAtMSAmJiBhZGRba2V5c1tpXV0gIT0gJ1tvYmplY3QgT2JqZWN0XScpXG4gICAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cblxuLyoqXG4gKiBFeHRlbmQgdGhlIGFwcC5lbnYgb2JqZWN0IG9mIHdpdGggdGhlIHByb3BlcnRpZXMgdGFrZW4gZnJvbSB0aGVcbiAqIGFwcC5lbnZfW2Vudk5hbWVdIGFuZCBkZXBsb3kgY29uZmlndXJhdGlvbi5cbiAqIEFsc28gdXBkYXRlIGN1cnJlbnQganNvbiBhdHRyaWJ1dGVzXG4gKlxuICogVXNlZCBvbmx5IGZvciBDb25maWd1cmF0aW9uIGZpbGUgcHJvY2Vzc2luZ1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhcHAgVGhlIGFwcCBvYmplY3QuXG4gKiBAcGFyYW0ge3N0cmluZ30gZW52TmFtZSBUaGUgZ2l2ZW4gZW52aXJvbm1lbnQgbmFtZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkZXBsb3lDb25mIERlcGxveW1lbnQgY29uZmlndXJhdGlvbiBvYmplY3QgKGZyb20gSlNPTiBmaWxlIG9yIHdoYXRldmVyKS5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBhcHAuZW52IHZhcmlhYmxlcyBvYmplY3QuXG4gKi9cbkNvbW1vbi5tZXJnZUVudmlyb25tZW50VmFyaWFibGVzID0gZnVuY3Rpb24gKGFwcF9lbnYsIGVudl9uYW1lLCBkZXBsb3lfY29uZikge1xuICB2YXIgYXBwID0gZmNsb25lKGFwcF9lbnYpO1xuXG4gIHZhciBuZXdfY29uZjogYW55ID0ge1xuICAgIGVudjoge31cbiAgfVxuXG4gIC8vIFN0cmluZ2lmeSBwb3NzaWJsZSBvYmplY3RcbiAgZm9yICh2YXIga2V5IGluIGFwcC5lbnYpIHtcbiAgICBpZiAodHlwZW9mIGFwcC5lbnZba2V5XSA9PSAnb2JqZWN0Jykge1xuICAgICAgYXBwLmVudltrZXldID0gSlNPTi5zdHJpbmdpZnkoYXBwLmVudltrZXldKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXh0cmEgY29uZmlndXJhdGlvbiB1cGRhdGVcbiAgICovXG4gIHV0aWwuaW5oZXJpdHMobmV3X2NvbmYsIGFwcClcblxuICBpZiAoZW52X25hbWUpIHtcbiAgICAvLyBGaXJzdCBtZXJnZSB2YXJpYWJsZXMgZnJvbSBkZXBsb3kucHJvZHVjdGlvbi5lbnYgb2JqZWN0IGFzIGxlYXN0IHByaW9yaXR5LlxuICAgIGlmIChkZXBsb3lfY29uZiAmJiBkZXBsb3lfY29uZltlbnZfbmFtZV0gJiYgZGVwbG95X2NvbmZbZW52X25hbWVdWydlbnYnXSkge1xuICAgICAgdXRpbC5pbmhlcml0cyhuZXdfY29uZi5lbnYsIGRlcGxveV9jb25mW2Vudl9uYW1lXVsnZW52J10pO1xuICAgIH1cblxuICAgIHV0aWwuaW5oZXJpdHMobmV3X2NvbmYuZW52LCBhcHAuZW52KTtcblxuICAgIC8vIFRoZW4sIGxhc3QgYW5kIGhpZ2hlc3QgcHJpb3JpdHksIG1lcmdlIHRoZSBhcHAuZW52X3Byb2R1Y3Rpb24gb2JqZWN0LlxuICAgIGlmICgnZW52XycgKyBlbnZfbmFtZSBpbiBhcHApIHtcbiAgICAgIHV0aWwuaW5oZXJpdHMobmV3X2NvbmYuZW52LCBhcHBbJ2Vudl8nICsgZW52X25hbWVdKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0dfV0FSTklORyArIGNoYWxrLmJvbGQoJ0Vudmlyb25tZW50IFslc10gaXMgbm90IGRlZmluZWQgaW4gcHJvY2VzcyBmaWxlJyksIGVudl9uYW1lKTtcbiAgICB9XG4gIH1cblxuICBkZWxldGUgbmV3X2NvbmYuZXhlY19tb2RlXG5cbiAgdmFyIHJlczogYW55ID0ge1xuICAgIGN1cnJlbnRfY29uZjoge31cbiAgfVxuXG4gIHV0aWwuaW5oZXJpdHMocmVzLCBuZXdfY29uZi5lbnYpXG4gIHV0aWwuaW5oZXJpdHMocmVzLmN1cnJlbnRfY29uZiwgbmV3X2NvbmYpXG5cbiAgLy8gIzI1NDEgZm9yY2UgcmVzb2x1dGlvbiBvZiBub2RlIGludGVycHJldGVyXG4gIGlmIChhcHAuZXhlY19pbnRlcnByZXRlciAmJlxuICAgIGFwcC5leGVjX2ludGVycHJldGVyLmluZGV4T2YoJ0AnKSA+IC0xKSB7XG4gICAgcmVzb2x2ZU5vZGVJbnRlcnByZXRlcihhcHApO1xuICAgIHJlcy5jdXJyZW50X2NvbmYuZXhlY19pbnRlcnByZXRlciA9IGFwcC5leGVjX2ludGVycHJldGVyXG4gIH1cblxuICByZXR1cm4gcmVzXG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIHJlc29sdmUgcGF0aHMsIG9wdGlvbiBhbmQgZW52aXJvbm1lbnRcbiAqIENBTExFRCBiZWZvcmUgJ3ByZXBhcmUnIEdvZCBjYWxsICg9PiBQUk9DRVNTIElOSVRJQUxJWkFUSU9OKVxuICogQG1ldGhvZCByZXNvbHZlQXBwQXR0cmlidXRlc1xuICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLmN3ZFxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMucG0yX2hvbWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBhcHBDb25mIGFwcGxpY2F0aW9uIGNvbmZpZ3VyYXRpb25cbiAqIEByZXR1cm4gYXBwXG4gKi9cbkNvbW1vbi5yZXNvbHZlQXBwQXR0cmlidXRlcyA9IGZ1bmN0aW9uIChvcHRzLCBjb25mKSB7XG4gIHZhciBjb25mX2NvcHkgPSBmY2xvbmUoY29uZik7XG5cbiAgdmFyIGFwcCA9IENvbW1vbi5wcmVwYXJlQXBwQ29uZihvcHRzLCBjb25mX2NvcHkpO1xuICBpZiAoYXBwIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYXBwLm1lc3NhZ2UpO1xuICB9XG4gIHJldHVybiBhcHA7XG59XG5cbi8qKlxuICogVmVyaWZ5IGNvbmZpZ3VyYXRpb25zXG4gKiBDYWxsZWQgb24gRVZFUlkgT3BlcmF0aW9uIChzdGFydC9yZXN0YXJ0L3JlbG9hZC9zdG9wLi4uKVxuICogQHBhcmFtIHtBcnJheX0gYXBwQ29uZnNcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqL1xuQ29tbW9uLnZlcmlmeUNvbmZzID0gZnVuY3Rpb24gKGFwcENvbmZzKSB7XG4gIGlmICghYXBwQ29uZnMgfHwgYXBwQ29uZnMubGVuZ3RoID09IDApIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvLyBNYWtlIHN1cmUgaXQgaXMgYW4gQXJyYXkuXG4gIGFwcENvbmZzID0gW10uY29uY2F0KGFwcENvbmZzKTtcblxuICB2YXIgdmVyaWZpZWRDb25mID0gW107XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcHBDb25mcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBhcHAgPSBhcHBDb25mc1tpXTtcblxuICAgIGlmIChhcHAuZXhlY19tb2RlKVxuICAgICAgYXBwLmV4ZWNfbW9kZSA9IGFwcC5leGVjX21vZGUucmVwbGFjZSgvXihmb3JrfGNsdXN0ZXIpJC8sICckMV9tb2RlJyk7XG5cbiAgICAvLyBKU09OIGNvbmY6IGFsaWFzIGNtZCB0byBzY3JpcHRcbiAgICBpZiAoYXBwLmNtZCAmJiAhYXBwLnNjcmlwdCkge1xuICAgICAgYXBwLnNjcmlwdCA9IGFwcC5jbWRcbiAgICAgIGRlbGV0ZSBhcHAuY21kXG4gICAgfVxuICAgIC8vIEpTT04gY29uZjogYWxpYXMgY29tbWFuZCB0byBzY3JpcHRcbiAgICBpZiAoYXBwLmNvbW1hbmQgJiYgIWFwcC5zY3JpcHQpIHtcbiAgICAgIGFwcC5zY3JpcHQgPSBhcHAuY29tbWFuZFxuICAgICAgZGVsZXRlIGFwcC5jb21tYW5kXG4gICAgfVxuXG4gICAgaWYgKCFhcHAuZW52KSB7XG4gICAgICBhcHAuZW52ID0ge31cbiAgICB9XG5cbiAgICAvLyBSZW5kZXIgYW4gYXBwIG5hbWUgaWYgbm90IGV4aXN0aW5nLlxuICAgIENvbW1vbi5yZW5kZXJBcHBsaWNhdGlvbk5hbWUoYXBwKTtcblxuICAgIGlmIChhcHAuZXhlY3V0ZV9jb21tYW5kID09IHRydWUpIHtcbiAgICAgIGFwcC5leGVjX21vZGUgPSAnZm9yaydcbiAgICAgIGRlbGV0ZSBhcHAuZXhlY3V0ZV9jb21tYW5kXG4gICAgfVxuXG4gICAgYXBwLnVzZXJuYW1lID0gQ29tbW9uLmdldEN1cnJlbnRVc2VybmFtZSgpO1xuXG4gICAgLyoqXG4gICAgICogSWYgY29tbWFuZCBpcyBsaWtlIHBtMiBzdGFydCBcInB5dGhvbiB4eC5weSAtLW9rXCJcbiAgICAgKiBUaGVuIGF1dG9tYXRpY2FsbHkgc3RhcnQgdGhlIHNjcmlwdCB3aXRoIGJhc2ggLWMgYW5kIHNldCBhIG5hbWUgZXEgdG8gY29tbWFuZFxuICAgICAqL1xuICAgIGlmIChhcHAuc2NyaXB0ICYmIGFwcC5zY3JpcHQuaW5kZXhPZignICcpID4gLTEgJiYgY3N0LklTX1dJTkRPV1MgPT09IGZhbHNlKSB7XG4gICAgICB2YXIgX3NjcmlwdCA9IGFwcC5zY3JpcHQ7XG5cbiAgICAgIGlmICh3aGljaCgnYmFzaCcpKSB7XG4gICAgICAgIGFwcC5zY3JpcHQgPSAnYmFzaCc7XG4gICAgICAgIGFwcC5hcmdzID0gWyctYycsIF9zY3JpcHRdO1xuICAgICAgICBpZiAoIWFwcC5uYW1lKSB7XG4gICAgICAgICAgYXBwLm5hbWUgPSBfc2NyaXB0XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHdoaWNoKCdzaCcpKSB7XG4gICAgICAgIGFwcC5zY3JpcHQgPSAnc2gnO1xuICAgICAgICBhcHAuYXJncyA9IFsnLWMnLCBfc2NyaXB0XTtcbiAgICAgICAgaWYgKCFhcHAubmFtZSkge1xuICAgICAgICAgIGFwcC5uYW1lID0gX3NjcmlwdFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgd2FybignYmFzaCBvciBzaCBub3QgYXZhaWxhYmxlIGluICRQQVRILCBrZWVwaW5nIHNjcmlwdCBhcyBpcycpXG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGxvZ19kYXRlX2Zvcm1hdCBieSBkZWZhdWx0XG4gICAgICovXG4gICAgaWYgKGFwcC50aW1lKSB7XG4gICAgICBhcHAubG9nX2RhdGVfZm9ybWF0ID0gJ1lZWVktTU0tRERUSEg6bW06c3MnXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzICsgUmVzb2x2ZSBVSUQvR0lEXG4gICAgICogY29tZXMgZnJvbSBwbTIgLS11aWQgPD4gLS1naWQgPD4gb3IgLS11c2VyXG4gICAgICovXG4gICAgaWYgKGFwcC51aWQgfHwgYXBwLmdpZCB8fCBhcHAudXNlcikge1xuICAgICAgLy8gMS8gQ2hlY2sgaWYgd2luZG93c1xuICAgICAgaWYgKGNzdC5JU19XSU5ET1dTID09PSB0cnVlKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArICctLXVpZCBhbmQgLS1naXQgZG9lcyBub3Qgd29ya3Mgb24gd2luZG93cycpO1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKCctLXVpZCBhbmQgLS1naXQgZG9lcyBub3Qgd29ya3Mgb24gd2luZG93cycpO1xuICAgICAgfVxuXG4gICAgICAvLyAyLyBWZXJpZnkgdGhhdCB1c2VyIGlzIHJvb3QgKHRvZG86IHZlcmlmeSBpZiBvdGhlciBoYXMgcmlnaHQpXG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT0gJ3Rlc3QnICYmIHByb2Nlc3MuZ2V0dWlkICYmIHByb2Nlc3MuZ2V0dWlkKCkgIT09IDApIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgJ1RvIHVzZSAtLXVpZCBhbmQgLS1naWQgcGxlYXNlIHJ1biBwbTIgYXMgcm9vdCcpO1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKCdUbyB1c2UgVUlEIGFuZCBHSUQgcGxlYXNlIHJ1biBQTTIgYXMgcm9vdCcpO1xuICAgICAgfVxuXG4gICAgICAvLyAzLyBSZXNvbHZlIHVzZXIgaW5mbyB2aWEgL2V0Yy9wYXNzd29yZFxuICAgICAgdmFyIHVzZXJzXG4gICAgICB0cnkge1xuICAgICAgICB1c2VycyA9IHBhc3N3ZC5nZXRVc2VycygpXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGUpO1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKGUpO1xuICAgICAgfVxuXG4gICAgICB2YXIgdXNlcl9pbmZvID0gdXNlcnNbYXBwLnVpZCB8fCBhcHAudXNlcl1cbiAgICAgIGlmICghdXNlcl9pbmZvKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGAke2NzdC5QUkVGSVhfTVNHX0VSUn0gVXNlciAke2FwcC51aWQgfHwgYXBwLnVzZXJ9IGNhbm5vdCBiZSBmb3VuZGApO1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKGAke2NzdC5QUkVGSVhfTVNHX0VSUn0gVXNlciAke2FwcC51aWQgfHwgYXBwLnVzZXJ9IGNhbm5vdCBiZSBmb3VuZGApO1xuICAgICAgfVxuXG4gICAgICBhcHAuZW52LkhPTUUgPSB1c2VyX2luZm8uaG9tZWRpclxuICAgICAgYXBwLnVpZCA9IHBhcnNlSW50KHVzZXJfaW5mby51c2VySWQpXG5cbiAgICAgIC8vIDQvIFJlc29sdmUgZ3JvdXAgaWQgaWYgZ2lkIGlzIHNwZWNpZmllZFxuICAgICAgaWYgKGFwcC5naWQpIHtcbiAgICAgICAgdmFyIGdyb3Vwc1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGdyb3VwcyA9IHBhc3N3ZC5nZXRHcm91cHMoKVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZSk7XG4gICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ3JvdXBfaW5mbyA9IGdyb3Vwc1thcHAuZ2lkXVxuICAgICAgICBpZiAoIWdyb3VwX2luZm8pIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihgJHtjc3QuUFJFRklYX01TR19FUlJ9IEdyb3VwICR7YXBwLmdpZH0gY2Fubm90IGJlIGZvdW5kYCk7XG4gICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihgJHtjc3QuUFJFRklYX01TR19FUlJ9IEdyb3VwICR7YXBwLmdpZH0gY2Fubm90IGJlIGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgYXBwLmdpZCA9IHBhcnNlSW50KGdyb3VwX2luZm8uaWQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcHAuZ2lkID0gcGFyc2VJbnQodXNlcl9pbmZvLmdyb3VwSWQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3BlY2lmaWMgb3B0aW9ucyBvZiBQTTIuaW9cbiAgICAgKi9cbiAgICBpZiAocHJvY2Vzcy5lbnYuUE0yX0RFRVBfTU9OSVRPUklORykge1xuICAgICAgYXBwLmRlZXBfbW9uaXRvcmluZyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGFwcC5hdXRvbWF0aW9uID09IGZhbHNlKSB7XG4gICAgICBhcHAucG14ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGFwcC5kaXNhYmxlX3RyYWNlKSB7XG4gICAgICBhcHAudHJhY2UgPSBmYWxzZVxuICAgICAgZGVsZXRlIGFwcC5kaXNhYmxlX3RyYWNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluc3RhbmNlcyBwYXJhbXNcbiAgICAgKi9cbiAgICBpZiAoYXBwLmluc3RhbmNlcyA9PSAnbWF4Jykge1xuICAgICAgYXBwLmluc3RhbmNlcyA9IDA7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiAoYXBwLmluc3RhbmNlcykgPT09ICdzdHJpbmcnKSB7XG4gICAgICBhcHAuaW5zdGFuY2VzID0gcGFyc2VJbnQoYXBwLmluc3RhbmNlcykgfHwgMDtcbiAgICB9XG5cbiAgICBpZiAoYXBwLmV4ZWNfbW9kZSAhPSAnY2x1c3Rlcl9tb2RlJyAmJlxuICAgICAgIWFwcC5pbnN0YW5jZXMgJiZcbiAgICAgIHR5cGVvZiAoYXBwLm1lcmdlX2xvZ3MpID09ICd1bmRlZmluZWQnKSB7XG4gICAgICBhcHAubWVyZ2VfbG9ncyA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIHJldDtcblxuICAgIGlmIChhcHAuY3Jvbl9yZXN0YXJ0KSB7XG4gICAgICBpZiAoKHJldCA9IENvbW1vbi5zaW5rLmRldGVybWluZUNyb24oYXBwKSkgaW5zdGFuY2VvZiBFcnJvcilcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBOb3cgdmFsaWRhdGlvbiBjb25maWd1cmF0aW9uXG4gICAgICovXG4gICAgdmFyIHJldDogYW55ID0gQ29uZmlnLnZhbGlkYXRlSlNPTihhcHApO1xuICAgIGlmIChyZXQuZXJyb3JzICYmIHJldC5lcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0LmVycm9ycy5mb3JFYWNoKGZ1bmN0aW9uIChlcnIpIHsgd2FybihlcnIpIH0pO1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcihyZXQuZXJyb3JzKTtcbiAgICB9XG5cbiAgICB2ZXJpZmllZENvbmYucHVzaChyZXQuY29uZmlnKTtcbiAgfVxuXG4gIHJldHVybiB2ZXJpZmllZENvbmY7XG59XG5cbi8qKlxuICogR2V0IGN1cnJlbnQgdXNlcm5hbWVcbiAqIENhbGxlZCBvbiBFVkVSWSBzdGFydGluZyBhcHBcbiAqXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5Db21tb24uZ2V0Q3VycmVudFVzZXJuYW1lID0gZnVuY3Rpb24gKCkge1xuICB2YXIgY3VycmVudF91c2VyID0gJyc7XG5cbiAgaWYgKG9zLnVzZXJJbmZvKSB7XG4gICAgdHJ5IHtcbiAgICAgIGN1cnJlbnRfdXNlciA9IG9zLnVzZXJJbmZvKCkudXNlcm5hbWU7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBGb3IgdGhlIGNhc2Ugb2YgdW5oYW5kbGVkIGVycm9yIGZvciB1dl9vc19nZXRfcGFzc3dkXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vVW5pdGVjaC9wbTIvaXNzdWVzLzMxODRcbiAgICB9XG4gIH1cblxuICBpZiAoY3VycmVudF91c2VyID09PSAnJykge1xuICAgIGN1cnJlbnRfdXNlciA9IHByb2Nlc3MuZW52LlVTRVIgfHwgcHJvY2Vzcy5lbnYuTE5BTUUgfHwgcHJvY2Vzcy5lbnYuVVNFUk5BTUUgfHwgcHJvY2Vzcy5lbnYuU1VET19VU0VSIHx8IHByb2Nlc3MuZW52LkM5X1VTRVIgfHwgcHJvY2Vzcy5lbnYuTE9HTkFNRTtcbiAgfVxuXG4gIHJldHVybiBjdXJyZW50X3VzZXI7XG59XG5cbi8qKlxuICogUmVuZGVyIGFuIGFwcCBuYW1lIGlmIG5vdCBleGlzdGluZy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25mXG4gKi9cbkNvbW1vbi5yZW5kZXJBcHBsaWNhdGlvbk5hbWUgPSBmdW5jdGlvbiAoY29uZikge1xuICBpZiAoIWNvbmYubmFtZSAmJiBjb25mLnNjcmlwdCkge1xuICAgIGNvbmYubmFtZSA9IGNvbmYuc2NyaXB0ICE9PSB1bmRlZmluZWQgPyBwYXRoLmJhc2VuYW1lKGNvbmYuc2NyaXB0KSA6ICd1bmRlZmluZWQnO1xuICAgIHZhciBsYXN0RG90ID0gY29uZi5uYW1lLmxhc3RJbmRleE9mKCcuJyk7XG4gICAgaWYgKGxhc3REb3QgPiAwKSB7XG4gICAgICBjb25mLm5hbWUgPSBjb25mLm5hbWUuc2xpY2UoMCwgbGFzdERvdCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2hvdyB3YXJuaW5nc1xuICogQHBhcmFtIHtTdHJpbmd9IHdhcm5pbmdcbiAqL1xuZnVuY3Rpb24gd2Fybih3YXJuaW5nKSB7XG4gIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19XQVJOSU5HICsgd2FybmluZyk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbW1vbjtcbiJdfQ==