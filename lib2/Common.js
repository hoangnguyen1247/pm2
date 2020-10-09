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
          require('mkdirp').sync(dir);
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


      var passwd = require("./tools/passwd.js");

      var users;

      try {
        users = passwd.getUsers();
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
          groups = passwd.getGroups();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Db21tb24udHMiXSwibmFtZXMiOlsiQ29tbW9uIiwiaG9tZWRpciIsImVudiIsInByb2Nlc3MiLCJob21lIiwiSE9NRSIsInVzZXIiLCJMT0dOQU1FIiwiVVNFUiIsIkxOQU1FIiwiVVNFUk5BTUUiLCJwbGF0Zm9ybSIsIlVTRVJQUk9GSUxFIiwiSE9NRURSSVZFIiwiSE9NRVBBVEgiLCJnZXR1aWQiLCJyZXNvbHZlSG9tZSIsImZpbGVwYXRoIiwicGF0aCIsImpvaW4iLCJzbGljZSIsImRldGVybWluZVNpbGVudENMSSIsInZhcmlhZGljQXJnc0Rhc2hlc1BvcyIsImFyZ3YiLCJpbmRleE9mIiwiczFvcHQiLCJzMm9wdCIsIlBNMl9TSUxFTlQiLCJrZXkiLCJjb25zb2xlIiwiY29kZSIsImNoYXJDb2RlQXQiLCJQTTJfRElTQ1JFVEVfTU9ERSIsInByaW50VmVyc2lvbiIsImxvZyIsInBrZyIsInZlcnNpb24iLCJleGl0IiwibG9ja1JlbG9hZCIsInQxIiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJjc3QiLCJQTTJfUkVMT0FEX0xPQ0tGSUxFIiwidG9TdHJpbmciLCJkaWZmIiwicGFyc2VJbnQiLCJSRUxPQURfTE9DS19USU1FT1VUIiwiZSIsIndyaXRlRmlsZVN5bmMiLCJ2YWx1ZU9mIiwiZXJyb3IiLCJtZXNzYWdlIiwidW5sb2NrUmVsb2FkIiwicHJlcGFyZUFwcENvbmYiLCJvcHRzIiwiYXBwIiwic2NyaXB0IiwiRXJyb3IiLCJjd2QiLCJyZXNvbHZlIiwiUFdEIiwibm9kZV9hcmdzIiwicG9ydCIsIlBPUlQiLCJwbV9leGVjX3BhdGgiLCJleGlzdHNTeW5jIiwiY2tkIiwiZGlzYWJsZV9zb3VyY2VfbWFwX3N1cHBvcnQiLCJhY2Nlc3NTeW5jIiwiY29uc3RhbnRzIiwiUl9PSyIsInNvdXJjZV9tYXBfc3VwcG9ydCIsIlBNMl9QUk9HUkFNTUFUSUMiLCJwbV9pZCIsInNhZmVFeHRlbmQiLCJmaWx0ZXJFbnYiLCJlbnZPYmoiLCJmaWx0ZXJfZW52IiwibmV3X2VudiIsImFsbG93ZWRLZXlzIiwicmVkdWNlIiwiYWNjIiwiY3VycmVudCIsImZpbHRlciIsIml0ZW0iLCJpbmNsdWRlcyIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwibGVuZ3RoIiwiZTEiLCJlMiIsInV0aWwiLCJpbmhlcml0cyIsInBtX2N3ZCIsInNpbmsiLCJyZXNvbHZlSW50ZXJwcmV0ZXIiLCJkZXRlcm1pbmVFeGVjTW9kZSIsImZvcm1hdGVkX2FwcF9uYW1lIiwibmFtZSIsInJlcGxhY2UiLCJmIiwiYWYiLCJwcyIsImV4dCIsImlzU3RkIiwidG9VcHBlckNhc2UiLCJkaXIiLCJkaXJuYW1lIiwicHJpbnRFcnJvciIsIlBSRUZJWF9NU0dfV0FSTklORyIsInByaW50T3V0IiwiUFJFRklYX01TRyIsInJlcXVpcmUiLCJzeW5jIiwiZXJyIiwiUFJFRklYX01TR19FUlIiLCJzdWJzdHIiLCJhcHBseSIsInNlcCIsImlzQ29uZmlnRmlsZSIsImZpbGVuYW1lIiwicGFyc2VDb25maWciLCJjb25mT2JqIiwic2FuZGJveCIsInZtIiwicnVuSW5UaGlzQ29udGV4dCIsImRpc3BsYXlFcnJvcnMiLCJ0aW1lb3V0IiwieWFtbGpzIiwicGFyc2UiLCJjb25mUGF0aCIsImNhY2hlIiwicmV0RXJyIiwiZGV0ZXJtaW5lQ3JvbiIsImNyb25fcmVzdGFydCIsIkNyb25Kb2IiLCJleCIsImV4ZWNfbW9kZSIsImluc3RhbmNlcyIsImV4ZWNfaW50ZXJwcmV0ZXIiLCJyZXNvbHZlTm9kZUludGVycHJldGVyIiwiY2hhbGsiLCJib2xkIiwieWVsbG93IiwibnZtX3BhdGgiLCJJU19XSU5ET1dTIiwiTlZNX0hPTUUiLCJOVk1fRElSIiwicmVkIiwibXNnIiwibm9kZV92ZXJzaW9uIiwic3BsaXQiLCJwYXRoX3RvX25vZGUiLCJzZW12ZXIiLCJzYXRpc2ZpZXMiLCJudm1fbm9kZV9wYXRoIiwibnZtX2JpbiIsIm52bV9jbWQiLCJtYXhCdWZmZXIiLCJhcmNoIiwiZ3JlZW4iLCJub0ludGVycHJldGVyIiwiZXh0TmFtZSIsImV4dG5hbWUiLCJiZXR0ZXJJbnRlcnByZXRlciIsImV4dEl0cHMiLCJQWVRIT05VTkJVRkZFUkVEIiwiX19kaXJuYW1lIiwid2FybiIsIkJVSUxUSU5fTk9ERV9QQVRIIiwiZGVlcENvcHkiLCJzZXJpYWxpemUiLCJjbG9uZSIsIm9iaiIsInVuZGVmaW5lZCIsImVyck1vZCIsIlBSRUZJWF9NU0dfTU9EX0VSUiIsImFyZ3VtZW50cyIsImluZm8iLCJQUkVGSVhfTVNHX0lORk8iLCJsb2dNb2QiLCJQUkVGSVhfTVNHX01PRCIsImV4dGVuZCIsImRlc3RpbmF0aW9uIiwic291cmNlIiwibmV3X2tleSIsIm9yaWdpbiIsImFkZCIsImtleXNUb0lnbm9yZSIsImkiLCJtZXJnZUVudmlyb25tZW50VmFyaWFibGVzIiwiYXBwX2VudiIsImVudl9uYW1lIiwiZGVwbG95X2NvbmYiLCJuZXdfY29uZiIsIkpTT04iLCJzdHJpbmdpZnkiLCJyZXMiLCJjdXJyZW50X2NvbmYiLCJyZXNvbHZlQXBwQXR0cmlidXRlcyIsImNvbmYiLCJjb25mX2NvcHkiLCJ2ZXJpZnlDb25mcyIsImFwcENvbmZzIiwiY29uY2F0IiwidmVyaWZpZWRDb25mIiwiY21kIiwiY29tbWFuZCIsInJlbmRlckFwcGxpY2F0aW9uTmFtZSIsImV4ZWN1dGVfY29tbWFuZCIsInVzZXJuYW1lIiwiZ2V0Q3VycmVudFVzZXJuYW1lIiwiX3NjcmlwdCIsImFyZ3MiLCJ0aW1lIiwibG9nX2RhdGVfZm9ybWF0IiwidWlkIiwiZ2lkIiwiTk9ERV9FTlYiLCJwYXNzd2QiLCJ1c2VycyIsImdldFVzZXJzIiwidXNlcl9pbmZvIiwidXNlcklkIiwiZ3JvdXBzIiwiZ2V0R3JvdXBzIiwiZ3JvdXBfaW5mbyIsImlkIiwiZ3JvdXBJZCIsIlBNMl9ERUVQX01PTklUT1JJTkciLCJkZWVwX21vbml0b3JpbmciLCJhdXRvbWF0aW9uIiwicG14IiwiZGlzYWJsZV90cmFjZSIsInRyYWNlIiwibWVyZ2VfbG9ncyIsInJldCIsIkNvbmZpZyIsInZhbGlkYXRlSlNPTiIsImVycm9ycyIsInB1c2giLCJjb25maWciLCJjdXJyZW50X3VzZXIiLCJvcyIsInVzZXJJbmZvIiwiU1VET19VU0VSIiwiQzlfVVNFUiIsImJhc2VuYW1lIiwibGFzdERvdCIsImxhc3RJbmRleE9mIiwid2FybmluZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QUFFQSxJQUFNQSxNQUFXLEdBQUcsRUFBcEI7O0FBRUEsU0FBU0MsT0FBVCxHQUFtQjtBQUNqQixNQUFJQyxHQUFHLEdBQUdDLE9BQU8sQ0FBQ0QsR0FBbEI7QUFDQSxNQUFJRSxJQUFJLEdBQUdGLEdBQUcsQ0FBQ0csSUFBZjtBQUNBLE1BQUlDLElBQUksR0FBR0osR0FBRyxDQUFDSyxPQUFKLElBQWVMLEdBQUcsQ0FBQ00sSUFBbkIsSUFBMkJOLEdBQUcsQ0FBQ08sS0FBL0IsSUFBd0NQLEdBQUcsQ0FBQ1EsUUFBdkQ7O0FBRUEsTUFBSVAsT0FBTyxDQUFDUSxRQUFSLEtBQXFCLE9BQXpCLEVBQWtDO0FBQ2hDLFdBQU9ULEdBQUcsQ0FBQ1UsV0FBSixJQUFtQlYsR0FBRyxDQUFDVyxTQUFKLEdBQWdCWCxHQUFHLENBQUNZLFFBQXZDLElBQW1EVixJQUFuRCxJQUEyRCxJQUFsRTtBQUNEOztBQUVELE1BQUlELE9BQU8sQ0FBQ1EsUUFBUixLQUFxQixRQUF6QixFQUFtQztBQUNqQyxXQUFPUCxJQUFJLEtBQUtFLElBQUksR0FBRyxZQUFZQSxJQUFmLEdBQXNCLElBQS9CLENBQVg7QUFDRDs7QUFFRCxNQUFJSCxPQUFPLENBQUNRLFFBQVIsS0FBcUIsT0FBekIsRUFBa0M7QUFDaEMsV0FBT1AsSUFBSSxLQUFLRCxPQUFPLENBQUNZLE1BQVIsT0FBcUIsQ0FBckIsR0FBeUIsT0FBekIsR0FBb0NULElBQUksR0FBRyxXQUFX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QUFBQSxJQUFJLENBQUN0RyxJQUFMLEdBQVlzRyxJQUFJLENBQUNqSixNQUFMLEtBQWdCdUgsU0FBaEIsR0FBNEI5SixpQkFBS3VPLFFBQUwsQ0FBYy9DLElBQUksQ0FBQ2pKLE1BQW5CLENBQTVCLEdBQXlELFdBQXJFO0FBQ0EsUUFBSWlNLE9BQU8sR0FBR2hELElBQUksQ0FBQ3RHLElBQUwsQ0FBVXVKLFdBQVYsQ0FBc0IsR0FBdEIsQ0FBZDs7QUFDQSxRQUFJRCxPQUFPLEdBQUcsQ0FBZCxFQUFpQjtBQUNmaEQsTUFBQUEsSUFBSSxDQUFDdEcsSUFBTCxHQUFZc0csSUFBSSxDQUFDdEcsSUFBTCxDQUFVaEYsS0FBVixDQUFnQixDQUFoQixFQUFtQnNPLE9BQW5CLENBQVo7QUFDRDtBQUNGO0FBQ0YsQ0FSRDtBQVVBOzs7Ozs7QUFJQSxTQUFTaEYsSUFBVCxDQUFja0YsT0FBZCxFQUF1QjtBQUNyQjVQLEVBQUFBLE1BQU0sQ0FBQ2dILFFBQVAsQ0FBZ0J0RSxzQkFBSXFFLGtCQUFKLEdBQXlCNkksT0FBekM7QUFDRDs7ZUFFYzVQLE0iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuICovXG5cbi8qKlxuICogQ29tbW9uIFV0aWxpdGllcyBPTkxZIFVTRUQgSU4gLT5DTEk8LVxuICovXG5cbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBvcyBmcm9tICdvcyc7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgZmNsb25lIGZyb20gJ2ZjbG9uZSc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgZGF5anMgZnJvbSAnZGF5anMnO1xuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBpc0JpbmFyeSBmcm9tICcuL3Rvb2xzL2lzYmluYXJ5ZmlsZSc7XG5pbXBvcnQgY3N0IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgZXh0SXRwcyBmcm9tICcuL0FQSS9pbnRlcnByZXRlcic7XG5pbXBvcnQgQ29uZmlnIGZyb20gJy4vdG9vbHMvQ29uZmlnJztcbmltcG9ydCBwa2cgZnJvbSAnLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCB3aGljaCBmcm9tICcuL3Rvb2xzL3doaWNoJztcbmltcG9ydCB5YW1sanMgZnJvbSAneWFtbGpzJztcbmltcG9ydCB2bSBmcm9tICd2bSc7XG5pbXBvcnQgeyBDcm9uSm9iIH0gZnJvbSAnY3Jvbic7XG5cbmNvbnN0IENvbW1vbjogYW55ID0ge307XG5cbmZ1bmN0aW9uIGhvbWVkaXIoKSB7XG4gIHZhciBlbnYgPSBwcm9jZXNzLmVudjtcbiAgdmFyIGhvbWUgPSBlbnYuSE9NRTtcbiAgdmFyIHVzZXIgPSBlbnYuTE9HTkFNRSB8fCBlbnYuVVNFUiB8fCBlbnYuTE5BTUUgfHwgZW52LlVTRVJOQU1FO1xuXG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgcmV0dXJuIGVudi5VU0VSUFJPRklMRSB8fCBlbnYuSE9NRURSSVZFICsgZW52LkhPTUVQQVRIIHx8IGhvbWUgfHwgbnVsbDtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgIHJldHVybiBob21lIHx8ICh1c2VyID8gJy9Vc2Vycy8nICsgdXNlciA6IG51bGwpO1xuICB9XG5cbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdsaW51eCcpIHtcbiAgICByZXR1cm4gaG9tZSB8fCAocHJvY2Vzcy5nZXR1aWQoKSA9PT0gMCA/ICcvcm9vdCcgOiAodXNlciA/ICcvaG9tZS8nICsgdXNlciA6IG51bGwpKTtcbiAgfVxuXG4gIHJldHVybiBob21lIHx8IG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVIb21lKGZpbGVwYXRoKSB7XG4gIGlmIChmaWxlcGF0aFswXSA9PT0gJ34nKSB7XG4gICAgcmV0dXJuIHBhdGguam9pbihob21lZGlyKCksIGZpbGVwYXRoLnNsaWNlKDEpKTtcbiAgfVxuICByZXR1cm4gZmlsZXBhdGg7XG59XG5cbkNvbW1vbi5kZXRlcm1pbmVTaWxlbnRDTEkgPSBmdW5jdGlvbiAoKSB7XG4gIC8vIHBtMiBzaG91bGQgaWdub3JlIC1zIC0tc2lsZW50IC12IGlmIHRoZXkgYXJlIGFmdGVyICctLSdcbiAgdmFyIHZhcmlhZGljQXJnc0Rhc2hlc1BvcyA9IHByb2Nlc3MuYXJndi5pbmRleE9mKCctLScpO1xuICB2YXIgczFvcHQgPSBwcm9jZXNzLmFyZ3YuaW5kZXhPZignLS1zaWxlbnQnKVxuICB2YXIgczJvcHQgPSBwcm9jZXNzLmFyZ3YuaW5kZXhPZignLXMnKVxuXG4gIGlmIChwcm9jZXNzLmVudi5QTTJfU0lMRU5UIHx8ICh2YXJpYWRpY0FyZ3NEYXNoZXNQb3MgPiAtMSAmJlxuICAgIChzMW9wdCAhPSAtMSAmJiBzMW9wdCA8IHZhcmlhZGljQXJnc0Rhc2hlc1BvcykgJiZcbiAgICAoczJvcHQgIT0gLTEgIT0gczJvcHQgPCB2YXJpYWRpY0FyZ3NEYXNoZXNQb3MpKSB8fFxuICAgICh2YXJpYWRpY0FyZ3NEYXNoZXNQb3MgPT0gLTEgJiYgKHMxb3B0ID4gLTEgfHwgczJvcHQgPiAtMSkpKSB7XG4gICAgZm9yICh2YXIga2V5IGluIGNvbnNvbGUpIHtcbiAgICAgIHZhciBjb2RlID0ga2V5LmNoYXJDb2RlQXQoMCk7XG4gICAgICBpZiAoY29kZSA+PSA5NyAmJiBjb2RlIDw9IDEyMikge1xuICAgICAgICBjb25zb2xlW2tleV0gPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgICB9XG4gICAgfVxuICAgIHByb2Nlc3MuZW52LlBNMl9ESVNDUkVURV9NT0RFID0gXCJ0cnVlXCI7XG4gIH1cbn1cblxuQ29tbW9uLnByaW50VmVyc2lvbiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHZhcmlhZGljQXJnc0Rhc2hlc1BvcyA9IHByb2Nlc3MuYXJndi5pbmRleE9mKCctLScpO1xuXG4gIGlmIChwcm9jZXNzLmFyZ3YuaW5kZXhPZignLXYnKSA+IC0xICYmIHByb2Nlc3MuYXJndi5pbmRleE9mKCctdicpIDwgdmFyaWFkaWNBcmdzRGFzaGVzUG9zKSB7XG4gICAgY29uc29sZS5sb2cocGtnLnZlcnNpb24pO1xuICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgfVxufVxuXG5Db21tb24ubG9ja1JlbG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgdDEgPSBmcy5yZWFkRmlsZVN5bmMoY3N0LlBNMl9SRUxPQURfTE9DS0ZJTEUpLnRvU3RyaW5nKCk7XG5cbiAgICAvLyBDaGVjayBpZiBjb250ZW50IGFuZCBpZiB0aW1lIDwgMzAgcmV0dXJuIGxvY2tlZFxuICAgIC8vIEVsc2UgaWYgY29udGVudCBkZXRlY3RlZCAobG9jayBmaWxlIHN0YWxlZCksIGFsbG93IGFuZCByZXdyaXR0ZVxuICAgIGlmICh0MSAmJiB0MSAhPSAnJykge1xuICAgICAgdmFyIGRpZmYgPSBkYXlqcygpLmRpZmYocGFyc2VJbnQodDEpKTtcbiAgICAgIGlmIChkaWZmIDwgY3N0LlJFTE9BRF9MT0NLX1RJTUVPVVQpXG4gICAgICAgIHJldHVybiBkaWZmO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkgeyB9XG5cbiAgdHJ5IHtcbiAgICAvLyBXcml0ZSBsYXRlc3QgdGltZXN0YW1wXG4gICAgZnMud3JpdGVGaWxlU3luYyhjc3QuUE0yX1JFTE9BRF9MT0NLRklMRSwgZGF5anMoKS52YWx1ZU9mKCkudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIDA7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSB8fCBlKTtcbiAgfVxufTtcblxuQ29tbW9uLnVubG9ja1JlbG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICBmcy53cml0ZUZpbGVTeW5jKGNzdC5QTTJfUkVMT0FEX0xPQ0tGSUxFLCAnJyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSB8fCBlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXNvbHZlIGFwcCBwYXRocyBhbmQgcmVwbGFjZSBtaXNzaW5nIHZhbHVlcyB3aXRoIGRlZmF1bHRzLlxuICogQG1ldGhvZCBwcmVwYXJlQXBwQ29uZlxuICogQHBhcmFtIGFwcCB7T2JqZWN0fVxuICogQHBhcmFtIHt9IGN3ZFxuICogQHBhcmFtIHt9IG91dHB1dHRlclxuICogQHJldHVybiBhcHBcbiAqL1xuQ29tbW9uLnByZXBhcmVBcHBDb25mID0gZnVuY3Rpb24gKG9wdHMsIGFwcCkge1xuICAvKipcbiAgICogTWluaW11bSB2YWxpZGF0aW9uXG4gICAqL1xuICBpZiAoIWFwcC5zY3JpcHQpXG4gICAgcmV0dXJuIG5ldyBFcnJvcignTm8gc2NyaXB0IHBhdGggLSBhYm9ydGluZycpO1xuXG4gIHZhciBjd2QgPSBudWxsO1xuXG4gIGlmIChhcHAuY3dkKSB7XG4gICAgY3dkID0gcGF0aC5yZXNvbHZlKGFwcC5jd2QpO1xuICAgIHByb2Nlc3MuZW52LlBXRCA9IGFwcC5jd2Q7XG4gIH1cblxuICBpZiAoIWFwcC5ub2RlX2FyZ3MpIHtcbiAgICBhcHAubm9kZV9hcmdzID0gW107XG4gIH1cblxuICBpZiAoYXBwLnBvcnQgJiYgYXBwLmVudikge1xuICAgIGFwcC5lbnYuUE9SVCA9IGFwcC5wb3J0O1xuICB9XG5cbiAgLy8gQ1dEIG9wdGlvbiByZXNvbHZpbmdcbiAgY3dkICYmIChjd2RbMF0gIT0gJy8nKSAmJiAoY3dkID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIGN3ZCkpO1xuICBjd2QgPSBjd2QgfHwgb3B0cy5jd2Q7XG5cbiAgLy8gRnVsbCBwYXRoIHNjcmlwdCByZXNvbHV0aW9uXG4gIGFwcC5wbV9leGVjX3BhdGggPSBwYXRoLnJlc29sdmUoY3dkLCBhcHAuc2NyaXB0KTtcblxuICAvLyBJZiBzY3JpcHQgZG9lcyBub3QgZXhpc3QgYWZ0ZXIgcmVzb2x1dGlvblxuICBpZiAoIWZzLmV4aXN0c1N5bmMoYXBwLnBtX2V4ZWNfcGF0aCkpIHtcbiAgICB2YXIgY2tkO1xuICAgIC8vIFRyeSByZXNvbHZlIGNvbW1hbmQgYXZhaWxhYmxlIGluICRQQVRIXG4gICAgaWYgKChja2QgPSB3aGljaChhcHAuc2NyaXB0KSkpIHtcbiAgICAgIGlmICh0eXBlb2YgKGNrZCkgIT09ICdzdHJpbmcnKVxuICAgICAgICBja2QgPSBja2QudG9TdHJpbmcoKTtcbiAgICAgIGFwcC5wbV9leGVjX3BhdGggPSBja2Q7XG4gICAgfVxuICAgIGVsc2VcbiAgICAgIC8vIFRocm93IGNyaXRpY2FsIGVycm9yXG4gICAgICByZXR1cm4gbmV3IEVycm9yKGBTY3JpcHQgbm90IGZvdW5kOiAke2FwcC5wbV9leGVjX3BhdGh9YCk7XG4gIH1cblxuICAvKipcbiAgICogQXV0byBkZXRlY3QgLm1hcCBmaWxlIGFuZCBlbmFibGUgc291cmNlIG1hcCBzdXBwb3J0IGF1dG9tYXRpY2FsbHlcbiAgICovXG4gIGlmIChhcHAuZGlzYWJsZV9zb3VyY2VfbWFwX3N1cHBvcnQgIT0gdHJ1ZSkge1xuICAgIHRyeSB7XG4gICAgICBmcy5hY2Nlc3NTeW5jKGFwcC5wbV9leGVjX3BhdGggKyAnLm1hcCcsIGZzLmNvbnN0YW50cy5SX09LKTtcbiAgICAgIGFwcC5zb3VyY2VfbWFwX3N1cHBvcnQgPSB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHsgfVxuICAgIGRlbGV0ZSBhcHAuZGlzYWJsZV9zb3VyY2VfbWFwX3N1cHBvcnQ7XG4gIH1cblxuICBkZWxldGUgYXBwLnNjcmlwdDtcblxuICAvLyBTZXQgY3VycmVudCBlbnYgYnkgZmlyc3QgYWRkaW5nIHRoZSBwcm9jZXNzIGVudmlyb25tZW50IGFuZCB0aGVuIGV4dGVuZGluZy9yZXBsYWNpbmcgaXRcbiAgLy8gd2l0aCBlbnYgc3BlY2lmaWVkIG9uIGNvbW1hbmQtbGluZSBvciBKU09OIGZpbGUuXG5cbiAgdmFyIGVudiA9IHt9O1xuXG4gIC8qKlxuICAgKiBEbyBub3QgY29weSBpbnRlcm5hbCBwbTIgZW52aXJvbm1lbnQgdmFyaWFibGVzIGlmIGFjdGluZyBvbiBwcm9jZXNzXG4gICAqIGlzIG1hZGUgZnJvbSBhIHByb2dyYW1tYXRpYyBzY3JpcHQgc3RhcnRlZCBieSBQTTIgb3IgaWYgYSBwbV9pZCBpcyBwcmVzZW50IGluIGVudlxuICAgKi9cbiAgaWYgKGNzdC5QTTJfUFJPR1JBTU1BVElDIHx8IHByb2Nlc3MuZW52LnBtX2lkKVxuICAgIENvbW1vbi5zYWZlRXh0ZW5kKGVudiwgcHJvY2Vzcy5lbnYpO1xuICBlbHNlXG4gICAgZW52ID0gcHJvY2Vzcy5lbnY7XG5cbiAgZnVuY3Rpb24gZmlsdGVyRW52KGVudk9iaikge1xuICAgIGlmIChhcHAuZmlsdGVyX2VudiA9PSB0cnVlKVxuICAgICAgcmV0dXJuIHt9XG5cbiAgICBpZiAodHlwZW9mIGFwcC5maWx0ZXJfZW52ID09PSAnc3RyaW5nJykge1xuICAgICAgZGVsZXRlIGVudk9ialthcHAuZmlsdGVyX2Vudl1cbiAgICAgIHJldHVybiBlbnZPYmpcbiAgICB9XG5cbiAgICB2YXIgbmV3X2VudiA9IHt9O1xuICAgIHZhciBhbGxvd2VkS2V5cyA9IGFwcC5maWx0ZXJfZW52LnJlZHVjZSgoYWNjLCBjdXJyZW50KSA9PlxuICAgICAgYWNjLmZpbHRlcihpdGVtID0+ICFpdGVtLmluY2x1ZGVzKGN1cnJlbnQpKSwgT2JqZWN0LmtleXMoZW52T2JqKSlcbiAgICBhbGxvd2VkS2V5cy5mb3JFYWNoKGtleSA9PiBuZXdfZW52W2tleV0gPSBlbnZPYmpba2V5XSk7XG4gICAgcmV0dXJuIG5ld19lbnZcbiAgfVxuXG4gIGFwcC5lbnYgPSBbXG4gICAge30sIChhcHAuZmlsdGVyX2VudiAmJiBhcHAuZmlsdGVyX2Vudi5sZW5ndGggPiAwKSA/IGZpbHRlckVudihwcm9jZXNzLmVudikgOiBlbnYsIGFwcC5lbnYgfHwge31cbiAgXS5yZWR1Y2UoZnVuY3Rpb24gKGUxLCBlMikge1xuICAgIHJldHVybiB1dGlsLmluaGVyaXRzKGUxLCBlMik7XG4gIH0pO1xuXG4gIGFwcC5wbV9jd2QgPSBjd2Q7XG4gIC8vIEludGVycHJldGVyXG4gIHRyeSB7XG4gICAgQ29tbW9uLnNpbmsucmVzb2x2ZUludGVycHJldGVyKGFwcCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZVxuICB9XG5cbiAgLy8gRXhlYyBtb2RlIGFuZCBjbHVzdGVyIHN0dWZmXG4gIENvbW1vbi5zaW5rLmRldGVybWluZUV4ZWNNb2RlKGFwcCk7XG5cbiAgLyoqXG4gICAqIFNjYXJ5XG4gICAqL1xuICB2YXIgZm9ybWF0ZWRfYXBwX25hbWUgPSBhcHAubmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOVxcXFwuXFxcXC1dL2csICctJyk7XG5cbiAgWydsb2cnLCAnb3V0JywgJ2Vycm9yJywgJ3BpZCddLmZvckVhY2goZnVuY3Rpb24gKGYpIHtcbiAgICB2YXIgYWYgPSBhcHBbZiArICdfZmlsZSddLCBwcywgZXh0ID0gKGYgPT0gJ3BpZCcgPyAncGlkJyA6ICdsb2cnKSwgaXNTdGQgPSAhflsnbG9nJywgJ3BpZCddLmluZGV4T2YoZik7XG4gICAgaWYgKGFmKSBhZiA9IHJlc29sdmVIb21lKGFmKTtcblxuICAgIGlmICgoZiA9PSAnbG9nJyAmJiB0eXBlb2YgYWYgPT0gJ2Jvb2xlYW4nICYmIGFmKSB8fCAoZiAhPSAnbG9nJyAmJiAhYWYpKSB7XG4gICAgICBwcyA9IFtjc3RbJ0RFRkFVTFRfJyArIGV4dC50b1VwcGVyQ2FzZSgpICsgJ19QQVRIJ10sIGZvcm1hdGVkX2FwcF9uYW1lICsgKGlzU3RkID8gJy0nICsgZiA6ICcnKSArICcuJyArIGV4dF07XG4gICAgfSBlbHNlIGlmICgoZiAhPSAnbG9nJyB8fCAoZiA9PSAnbG9nJyAmJiBhZikpICYmIGFmICE9PSAnTlVMTCcgJiYgYWYgIT09ICcvZGV2L251bGwnKSB7XG4gICAgICBwcyA9IFtjd2QsIGFmXTtcblxuICAgICAgdmFyIGRpciA9IHBhdGguZGlybmFtZShwYXRoLnJlc29sdmUoY3dkLCBhZikpO1xuICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfV0FSTklORyArICdGb2xkZXIgZG9lcyBub3QgZXhpc3Q6ICcgKyBkaXIpO1xuICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnQ3JlYXRpbmcgZm9sZGVyOiAnICsgZGlyKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXF1aXJlKCdta2RpcnAnKS5zeW5jKGRpcik7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArICdDb3VsZCBub3QgY3JlYXRlIGZvbGRlcjogJyArIHBhdGguZGlybmFtZShhZikpO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGNyZWF0ZSBmb2xkZXInKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfVxuICAgIC8vIFBNMiBwYXRoc1xuICAgIGlmIChhZiAhPT0gJ05VTEwnICYmIGFmICE9PSAnL2Rldi9udWxsJykge1xuICAgICAgcHMgJiYgKGFwcFsncG1fJyArIChpc1N0ZCA/IGYuc3Vic3RyKDAsIDMpICsgJ18nIDogJycpICsgZXh0ICsgJ19wYXRoJ10gPSBwYXRoLnJlc29sdmUuYXBwbHkobnVsbCwgcHMpKTtcbiAgICB9IGVsc2UgaWYgKHBhdGguc2VwID09PSAnXFxcXCcpIHtcbiAgICAgIGFwcFsncG1fJyArIChpc1N0ZCA/IGYuc3Vic3RyKDAsIDMpICsgJ18nIDogJycpICsgZXh0ICsgJ19wYXRoJ10gPSAnXFxcXFxcXFwuXFxcXE5VTCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwcFsncG1fJyArIChpc1N0ZCA/IGYuc3Vic3RyKDAsIDMpICsgJ18nIDogJycpICsgZXh0ICsgJ19wYXRoJ10gPSAnL2Rldi9udWxsJztcbiAgICB9XG4gICAgZGVsZXRlIGFwcFtmICsgJ19maWxlJ107XG4gIH0pO1xuXG4gIHJldHVybiBhcHA7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGZpbGVuYW1lIGlzIGEgY29uZmlndXJhdGlvbiBmaWxlXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVcbiAqIEByZXR1cm4ge21peGVkfSBudWxsIGlmIG5vdCBjb25mIGZpbGUsIGpzb24gb3IgeWFtbCBpZiBjb25mXG4gKi9cbkNvbW1vbi5pc0NvbmZpZ0ZpbGUgPSBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgaWYgKHR5cGVvZiAoZmlsZW5hbWUpICE9PSAnc3RyaW5nJylcbiAgICByZXR1cm4gbnVsbDtcbiAgaWYgKGZpbGVuYW1lLmluZGV4T2YoJy5qc29uJykgIT09IC0xKVxuICAgIHJldHVybiAnanNvbic7XG4gIGlmIChmaWxlbmFtZS5pbmRleE9mKCcueW1sJykgPiAtMSB8fCBmaWxlbmFtZS5pbmRleE9mKCcueWFtbCcpID4gLTEpXG4gICAgcmV0dXJuICd5YW1sJztcbiAgaWYgKGZpbGVuYW1lLmluZGV4T2YoJy5jb25maWcuanMnKSAhPT0gLTEpXG4gICAgcmV0dXJuICdqcyc7XG4gIGlmIChmaWxlbmFtZS5pbmRleE9mKCcuY29uZmlnLmNqcycpICE9PSAtMSlcbiAgICByZXR1cm4gJ2pzJztcbiAgaWYgKGZpbGVuYW1lLmluZGV4T2YoJy5jb25maWcubWpzJykgIT09IC0xKVxuICAgIHJldHVybiAnbWpzJztcbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKipcbiAqIFBhcnNlcyBhIGNvbmZpZyBmaWxlIGxpa2UgZWNvc3lzdGVtLmNvbmZpZy5qcy4gU3VwcG9ydGVkIGZvcm1hdHM6IEpTLCBKU09OLCBKU09ONSwgWUFNTC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjb25mU3RyaW5nICBjb250ZW50cyBvZiB0aGUgY29uZmlnIGZpbGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAgICBwYXRoIHRvIHRoZSBjb25maWcgZmlsZVxuICogQHJldHVybiB7T2JqZWN0fSBjb25maWcgb2JqZWN0XG4gKi9cbkNvbW1vbi5wYXJzZUNvbmZpZyA9IGZ1bmN0aW9uIChjb25mT2JqLCBmaWxlbmFtZSkge1xuICBpZiAoIWZpbGVuYW1lIHx8XG4gICAgZmlsZW5hbWUgPT0gJ3BpcGUnIHx8XG4gICAgZmlsZW5hbWUgPT0gJ25vbmUnIHx8XG4gICAgZmlsZW5hbWUuaW5kZXhPZignLmpzb24nKSA+IC0xKSB7XG4gICAgdmFyIGNvZGUgPSAnKCcgKyBjb25mT2JqICsgJyknO1xuICAgIHZhciBzYW5kYm94ID0ge307XG5cbiAgICAvLyBUT0RPOiBQbGVhc2UgY2hlY2sgdGhpc1xuICAgIC8vIHJldHVybiB2bS5ydW5JblRoaXNDb250ZXh0KGNvZGUsIHNhbmRib3gsIHtcbiAgICAvLyAgIGZpbGVuYW1lOiBwYXRoLnJlc29sdmUoZmlsZW5hbWUpLFxuICAgIC8vICAgZGlzcGxheUVycm9yczogZmFsc2UsXG4gICAgLy8gICB0aW1lb3V0OiAxMDAwXG4gICAgLy8gfSk7XG4gICAgcmV0dXJuIHZtLnJ1bkluVGhpc0NvbnRleHQoY29kZSwge1xuICAgICAgZmlsZW5hbWU6IHBhdGgucmVzb2x2ZShmaWxlbmFtZSksXG4gICAgICBkaXNwbGF5RXJyb3JzOiBmYWxzZSxcbiAgICAgIHRpbWVvdXQ6IDEwMDBcbiAgICB9KTtcbiAgfVxuICBlbHNlIGlmIChmaWxlbmFtZS5pbmRleE9mKCcueW1sJykgPiAtMSB8fFxuICAgIGZpbGVuYW1lLmluZGV4T2YoJy55YW1sJykgPiAtMSkge1xuICAgIHJldHVybiB5YW1sanMucGFyc2UoY29uZk9iai50b1N0cmluZygpKTtcbiAgfVxuICBlbHNlIGlmIChmaWxlbmFtZS5pbmRleE9mKCcuY29uZmlnLmpzJykgPiAtMSB8fCBmaWxlbmFtZS5pbmRleE9mKCcuY29uZmlnLmNqcycpID4gLTEgfHwgZmlsZW5hbWUuaW5kZXhPZignLmNvbmZpZy5tanMnKSA+IC0xKSB7XG4gICAgdmFyIGNvbmZQYXRoID0gcmVxdWlyZS5yZXNvbHZlKHBhdGgucmVzb2x2ZShmaWxlbmFtZSkpO1xuICAgIGRlbGV0ZSByZXF1aXJlLmNhY2hlW2NvbmZQYXRoXTtcbiAgICByZXR1cm4gcmVxdWlyZShjb25mUGF0aCk7XG4gIH1cbn07XG5cbkNvbW1vbi5yZXRFcnIgPSBmdW5jdGlvbiAoZSkge1xuICBpZiAoIWUpXG4gICAgcmV0dXJuIG5ldyBFcnJvcignVW5pZGVudGlmaWVkIGVycm9yJyk7XG4gIGlmIChlIGluc3RhbmNlb2YgRXJyb3IpXG4gICAgcmV0dXJuIGU7XG4gIHJldHVybiBuZXcgRXJyb3IoZSk7XG59XG5cbkNvbW1vbi5zaW5rID0ge307XG5cbkNvbW1vbi5zaW5rLmRldGVybWluZUNyb24gPSBmdW5jdGlvbiAoYXBwKSB7XG5cbiAgaWYgKGFwcC5jcm9uX3Jlc3RhcnQpIHtcbiAgICB0cnkge1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ2Nyb24gcmVzdGFydCBhdCAnICsgYXBwLmNyb25fcmVzdGFydCk7XG4gICAgICBuZXcgQ3JvbkpvYihhcHAuY3Jvbl9yZXN0YXJ0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdjcm9uIHBhdHRlcm4gZm9yIGF1dG8gcmVzdGFydCBkZXRlY3RlZCBhbmQgdmFsaWQnKTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKGBDcm9uIHBhdHRlcm4gZXJyb3I6ICR7ZXgubWVzc2FnZX1gKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogSGFuZGxlIGFsaWFzIChmb3JrIDw9PiBmb3JrX21vZGUsIGNsdXN0ZXIgPD0+IGNsdXN0ZXJfbW9kZSlcbiAqL1xuQ29tbW9uLnNpbmsuZGV0ZXJtaW5lRXhlY01vZGUgPSBmdW5jdGlvbiAoYXBwKSB7XG4gIGlmIChhcHAuZXhlY19tb2RlKVxuICAgIGFwcC5leGVjX21vZGUgPSBhcHAuZXhlY19tb2RlLnJlcGxhY2UoL14oZm9ya3xjbHVzdGVyKSQvLCAnJDFfbW9kZScpO1xuXG4gIC8qKlxuICAgKiBIZXJlIHdlIHB1dCB0aGUgZGVmYXVsdCBleGVjIG1vZGVcbiAgICovXG4gIGlmICghYXBwLmV4ZWNfbW9kZSAmJlxuICAgIChhcHAuaW5zdGFuY2VzID49IDEgfHwgYXBwLmluc3RhbmNlcyA9PT0gMCB8fCBhcHAuaW5zdGFuY2VzID09PSAtMSkgJiZcbiAgICBhcHAuZXhlY19pbnRlcnByZXRlci5pbmRleE9mKCdub2RlJykgPiAtMSkge1xuICAgIGFwcC5leGVjX21vZGUgPSAnY2x1c3Rlcl9tb2RlJztcbiAgfSBlbHNlIGlmICghYXBwLmV4ZWNfbW9kZSkge1xuICAgIGFwcC5leGVjX21vZGUgPSAnZm9ya19tb2RlJztcbiAgfVxuICBpZiAodHlwZW9mIGFwcC5pbnN0YW5jZXMgPT0gJ3VuZGVmaW5lZCcpXG4gICAgYXBwLmluc3RhbmNlcyA9IDE7XG59O1xuXG52YXIgcmVzb2x2ZU5vZGVJbnRlcnByZXRlciA9IGZ1bmN0aW9uIChhcHApIHtcbiAgaWYgKGFwcC5leGVjX21vZGUgJiYgYXBwLmV4ZWNfbW9kZS5pbmRleE9mKCdjbHVzdGVyJykgPiAtMSkge1xuICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX1dBUk5JTkcgKyBjaGFsay5ib2xkLnllbGxvdygnQ2hvb3NpbmcgdGhlIE5vZGUuanMgdmVyc2lvbiBpbiBjbHVzdGVyIG1vZGUgaXMgbm90IHN1cHBvcnRlZCcpKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB2YXIgbnZtX3BhdGggPSBjc3QuSVNfV0lORE9XUyA/IHByb2Nlc3MuZW52Lk5WTV9IT01FIDogcHJvY2Vzcy5lbnYuTlZNX0RJUjtcbiAgaWYgKCFudm1fcGF0aCkge1xuICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArIGNoYWxrLnJlZCgnTlZNIGlzIG5vdCBhdmFpbGFibGUgaW4gUEFUSCcpKTtcbiAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyBjaGFsay5yZWQoJ0ZhbGxiYWNrIHRvIG5vZGUgaW4gUEFUSCcpKTtcbiAgICB2YXIgbXNnID0gY3N0LklTX1dJTkRPV1NcbiAgICAgID8gJ2h0dHBzOi8vZ2l0aHViLmNvbS9jb3JleWJ1dGxlci9udm0td2luZG93cy9yZWxlYXNlcy8nXG4gICAgICA6ICckIGN1cmwgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2NyZWF0aW9uaXgvbnZtL21hc3Rlci9pbnN0YWxsLnNoIHwgYmFzaCc7XG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX0VSUiArIGNoYWxrLmJvbGQoJ0luc3RhbGwgTlZNOlxcbicgKyBtc2cpKTtcbiAgfVxuICBlbHNlIHtcbiAgICB2YXIgbm9kZV92ZXJzaW9uID0gYXBwLmV4ZWNfaW50ZXJwcmV0ZXIuc3BsaXQoJ0AnKVsxXTtcbiAgICB2YXIgcGF0aF90b19ub2RlID0gY3N0LklTX1dJTkRPV1NcbiAgICAgID8gJy92JyArIG5vZGVfdmVyc2lvbiArICcvbm9kZS5leGUnXG4gICAgICA6IHNlbXZlci5zYXRpc2ZpZXMobm9kZV92ZXJzaW9uLCAnPj0gMC4xMi4wJylcbiAgICAgICAgPyAnL3ZlcnNpb25zL25vZGUvdicgKyBub2RlX3ZlcnNpb24gKyAnL2Jpbi9ub2RlJ1xuICAgICAgICA6ICcvdicgKyBub2RlX3ZlcnNpb24gKyAnL2Jpbi9ub2RlJztcbiAgICB2YXIgbnZtX25vZGVfcGF0aCA9IHBhdGguam9pbihudm1fcGF0aCwgcGF0aF90b19ub2RlKTtcbiAgICB0cnkge1xuICAgICAgZnMuYWNjZXNzU3luYyhudm1fbm9kZV9wYXRoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnSW5zdGFsbGluZyBOb2RlIHYlcycsIG5vZGVfdmVyc2lvbik7XG4gICAgICB2YXIgbnZtX2JpbiA9IHBhdGguam9pbihudm1fcGF0aCwgJ252bS4nICsgKGNzdC5JU19XSU5ET1dTID8gJ2V4ZScgOiAnc2gnKSk7XG4gICAgICB2YXIgbnZtX2NtZCA9IGNzdC5JU19XSU5ET1dTXG4gICAgICAgID8gbnZtX2JpbiArICcgaW5zdGFsbCAnICsgbm9kZV92ZXJzaW9uXG4gICAgICAgIDogJy4gJyArIG52bV9iaW4gKyAnIDsgbnZtIGluc3RhbGwgJyArIG5vZGVfdmVyc2lvbjtcblxuICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0V4ZWN1dGluZzogJXMnLCBudm1fY21kKTtcblxuICAgICAgZXhlY1N5bmMobnZtX2NtZCwge1xuICAgICAgICBjd2Q6IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpKSxcbiAgICAgICAgZW52OiBwcm9jZXNzLmVudixcbiAgICAgICAgbWF4QnVmZmVyOiAyMCAqIDEwMjQgKiAxMDI0XG4gICAgICB9KTtcblxuICAgICAgLy8gaW4gb3JkZXIgdG8gc3VwcG9ydCBib3RoIGFyY2gsIG52bSBmb3IgV2luZG93cyByZW5hbWVzICdub2RlLmV4ZScgdG86XG4gICAgICAvLyAnbm9kZTMyLmV4ZScgZm9yIHgzMiBhcmNoXG4gICAgICAvLyAnbm9kZTY0LmV4ZScgZm9yIHg2NCBhcmNoXG4gICAgICBpZiAoY3N0LklTX1dJTkRPV1MpXG4gICAgICAgIG52bV9ub2RlX3BhdGggPSBudm1fbm9kZV9wYXRoLnJlcGxhY2UoL25vZGUvLCAnbm9kZScgKyBwcm9jZXNzLmFyY2guc2xpY2UoMSkpXG4gICAgfVxuXG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgY2hhbGsuZ3JlZW4uYm9sZCgnU2V0dGluZyBOb2RlIHRvIHYlcyAocGF0aD0lcyknKSxcbiAgICAgIG5vZGVfdmVyc2lvbixcbiAgICAgIG52bV9ub2RlX3BhdGgpO1xuXG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPSBudm1fbm9kZV9wYXRoO1xuICB9XG59O1xuXG4vKipcbiAqIFJlc29sdmUgaW50ZXJwcmV0ZXJcbiAqL1xuQ29tbW9uLnNpbmsucmVzb2x2ZUludGVycHJldGVyID0gZnVuY3Rpb24gKGFwcCkge1xuICB2YXIgbm9JbnRlcnByZXRlciA9ICFhcHAuZXhlY19pbnRlcnByZXRlcjtcbiAgdmFyIGV4dE5hbWUgPSBwYXRoLmV4dG5hbWUoYXBwLnBtX2V4ZWNfcGF0aCk7XG4gIHZhciBiZXR0ZXJJbnRlcnByZXRlciA9IGV4dEl0cHNbZXh0TmFtZV07XG5cbiAgLy8gTm8gaW50ZXJwcmV0ZXIgZGVmaW5lZCBhbmQgY29ycmVzcG9uZGFuY2UgaW4gc2NoZW1hIGhhc2htYXBcbiAgaWYgKG5vSW50ZXJwcmV0ZXIgJiYgYmV0dGVySW50ZXJwcmV0ZXIpIHtcbiAgICBhcHAuZXhlY19pbnRlcnByZXRlciA9IGJldHRlckludGVycHJldGVyO1xuICB9XG4gIC8vIEVsc2UgaWYgbm8gSW50ZXJwcmV0ZXIgZGV0ZWN0IGlmIHByb2Nlc3MgaXMgYmluYXJ5XG4gIGVsc2UgaWYgKG5vSW50ZXJwcmV0ZXIpXG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPSBpc0JpbmFyeShhcHAucG1fZXhlY19wYXRoKSA/ICdub25lJyA6ICdub2RlJztcbiAgZWxzZSBpZiAoYXBwLmV4ZWNfaW50ZXJwcmV0ZXIuaW5kZXhPZignbm9kZUAnKSA+IC0xKVxuICAgIHJlc29sdmVOb2RlSW50ZXJwcmV0ZXIoYXBwKTtcblxuICBpZiAoYXBwLmV4ZWNfaW50ZXJwcmV0ZXIuaW5kZXhPZigncHl0aG9uJykgPiAtMSlcbiAgICBhcHAuZW52LlBZVEhPTlVOQlVGRkVSRUQgPSAnMSdcblxuICAvKipcbiAgICogU3BlY2lmaWMgaW5zdGFsbGVkIEpTIHRyYW5zcGlsZXJzXG4gICAqL1xuICBpZiAoYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPT0gJ3RzLW5vZGUnKSB7XG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vbm9kZV9tb2R1bGVzLy5iaW4vdHMtbm9kZScpO1xuICB9XG5cbiAgaWYgKGFwcC5leGVjX2ludGVycHJldGVyID09ICdsc2MnKSB7XG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vbm9kZV9tb2R1bGVzLy5iaW4vbHNjJyk7XG4gIH1cblxuICBpZiAoYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPT0gJ2NvZmZlZScpIHtcbiAgICBhcHAuZXhlY19pbnRlcnByZXRlciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9ub2RlX21vZHVsZXMvLmJpbi9jb2ZmZWUnKTtcbiAgfVxuXG4gIGlmIChhcHAuZXhlY19pbnRlcnByZXRlciAhPSAnbm9uZScgJiYgd2hpY2goYXBwLmV4ZWNfaW50ZXJwcmV0ZXIpID09IG51bGwpIHtcbiAgICAvLyBJZiBub2RlIGlzIG5vdCBwcmVzZW50XG4gICAgaWYgKGFwcC5leGVjX2ludGVycHJldGVyID09ICdub2RlJykge1xuICAgICAgQ29tbW9uLndhcm4oYFVzaW5nIGJ1aWx0aW4gbm9kZS5qcyB2ZXJzaW9uIG9uIHZlcnNpb24gJHtwcm9jZXNzLnZlcnNpb259YClcbiAgICAgIGFwcC5leGVjX2ludGVycHJldGVyID0gY3N0LkJVSUxUSU5fTk9ERV9QQVRIXG4gICAgfVxuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW50ZXJwcmV0ZXIgJHthcHAuZXhlY19pbnRlcnByZXRlcn0gaXMgTk9UIEFWQUlMQUJMRSBpbiBQQVRILiAodHlwZSAnd2hpY2ggJHthcHAuZXhlY19pbnRlcnByZXRlcn0nIHRvIGRvdWJsZSBjaGVjay4pYClcbiAgfVxuXG4gIHJldHVybiBhcHA7XG59O1xuXG5Db21tb24uZGVlcENvcHkgPSBDb21tb24uc2VyaWFsaXplID0gQ29tbW9uLmNsb25lID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09PSBudWxsIHx8IG9iaiA9PT0gdW5kZWZpbmVkKSByZXR1cm4ge307XG4gIHJldHVybiBmY2xvbmUob2JqKTtcbn07XG5cbkNvbW1vbi5lcnJNb2QgPSBmdW5jdGlvbiAobXNnKSB7XG4gIGlmIChwcm9jZXNzLmVudi5QTTJfU0lMRU5UIHx8IHByb2Nlc3MuZW52LlBNMl9QUk9HUkFNTUFUSUMgPT09ICd0cnVlJykgcmV0dXJuIGZhbHNlO1xuICBpZiAobXNnIGluc3RhbmNlb2YgRXJyb3IpXG4gICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IobXNnLm1lc3NhZ2UpO1xuICByZXR1cm4gY29uc29sZS5lcnJvcihgJHtjc3QuUFJFRklYX01TR19NT0RfRVJSfSR7bXNnfWApO1xufVxuXG5Db21tb24uZXJyID0gZnVuY3Rpb24gKG1zZykge1xuICBpZiAocHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCB8fCBwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID09PSAndHJ1ZScpIHJldHVybiBmYWxzZTtcbiAgaWYgKG1zZyBpbnN0YW5jZW9mIEVycm9yKVxuICAgIHJldHVybiBjb25zb2xlLmVycm9yKGAke2NzdC5QUkVGSVhfTVNHX0VSUn0ke21zZy5tZXNzYWdlfWApO1xuICByZXR1cm4gY29uc29sZS5lcnJvcihgJHtjc3QuUFJFRklYX01TR19FUlJ9JHttc2d9YCk7XG59XG5cbkNvbW1vbi5wcmludEVycm9yID0gZnVuY3Rpb24gKG1zZykge1xuICBpZiAocHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCB8fCBwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID09PSAndHJ1ZScpIHJldHVybiBmYWxzZTtcbiAgaWYgKG1zZyBpbnN0YW5jZW9mIEVycm9yKVxuICAgIHJldHVybiBjb25zb2xlLmVycm9yKG1zZy5tZXNzYWdlKTtcbiAgcmV0dXJuIGNvbnNvbGUuZXJyb3IuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzIGFzIGFueSk7XG59O1xuXG5Db21tb24ubG9nID0gZnVuY3Rpb24gKG1zZykge1xuICBpZiAocHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCB8fCBwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID09PSAndHJ1ZScpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIGNvbnNvbGUubG9nKGAke2NzdC5QUkVGSVhfTVNHfSR7bXNnfWApO1xufVxuXG5Db21tb24uaW5mbyA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9TSUxFTlQgfHwgcHJvY2Vzcy5lbnYuUE0yX1BST0dSQU1NQVRJQyA9PT0gJ3RydWUnKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBjb25zb2xlLmxvZyhgJHtjc3QuUFJFRklYX01TR19JTkZPfSR7bXNnfWApO1xufVxuXG5Db21tb24ud2FybiA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9TSUxFTlQgfHwgcHJvY2Vzcy5lbnYuUE0yX1BST0dSQU1NQVRJQyA9PT0gJ3RydWUnKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBjb25zb2xlLmxvZyhgJHtjc3QuUFJFRklYX01TR19XQVJOSU5HfSR7bXNnfWApO1xufVxuXG5Db21tb24ubG9nTW9kID0gZnVuY3Rpb24gKG1zZykge1xuICBpZiAocHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCB8fCBwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID09PSAndHJ1ZScpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIGNvbnNvbGUubG9nKGAke2NzdC5QUkVGSVhfTVNHX01PRH0ke21zZ31gKTtcbn1cblxuQ29tbW9uLnByaW50T3V0ID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCA9PT0gJ3RydWUnIHx8IHByb2Nlc3MuZW52LlBNMl9QUk9HUkFNTUFUSUMgPT09ICd0cnVlJykgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzIGFzIGFueSk7XG59O1xuXG5cbi8qKlxuICogUmF3IGV4dGVuZFxuICovXG5Db21tb24uZXh0ZW5kID0gZnVuY3Rpb24gKGRlc3RpbmF0aW9uLCBzb3VyY2UpIHtcbiAgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbiAhPT0gJ29iamVjdCcpIHtcbiAgICBkZXN0aW5hdGlvbiA9IHt9O1xuICB9XG4gIGlmICghc291cmNlIHx8IHR5cGVvZiBzb3VyY2UgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIGRlc3RpbmF0aW9uO1xuICB9XG5cbiAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uIChuZXdfa2V5KSB7XG4gICAgaWYgKHNvdXJjZVtuZXdfa2V5XSAhPSAnW29iamVjdCBPYmplY3RdJylcbiAgICAgIGRlc3RpbmF0aW9uW25ld19rZXldID0gc291cmNlW25ld19rZXldO1xuICB9KTtcblxuICByZXR1cm4gZGVzdGluYXRpb247XG59O1xuXG4vKipcbiAqIFRoaXMgaXMgdXNlZnVsIHdoZW4gc3RhcnRpbmcgc2NyaXB0IHByb2dyYW1tYXRpY2FsbHlcbiAqL1xuQ29tbW9uLnNhZmVFeHRlbmQgPSBmdW5jdGlvbiAob3JpZ2luLCBhZGQpIHtcbiAgaWYgKCFhZGQgfHwgdHlwZW9mIGFkZCAhPSAnb2JqZWN0JykgcmV0dXJuIG9yaWdpbjtcblxuICAvL0lnbm9yZSBQTTIncyBzZXQgZW52aXJvbm1lbnQgdmFyaWFibGVzIGZyb20gdGhlIG5lc3RlZCBlbnZcbiAgdmFyIGtleXNUb0lnbm9yZSA9IFsnbmFtZScsICdleGVjX21vZGUnLCAnZW52JywgJ2FyZ3MnLCAncG1fY3dkJywgJ2V4ZWNfaW50ZXJwcmV0ZXInLCAncG1fZXhlY19wYXRoJywgJ25vZGVfYXJncycsICdwbV9vdXRfbG9nX3BhdGgnLCAncG1fZXJyX2xvZ19wYXRoJywgJ3BtX3BpZF9wYXRoJywgJ3BtX2lkJywgJ3N0YXR1cycsICdwbV91cHRpbWUnLCAnY3JlYXRlZF9hdCcsICd3aW5kb3dzSGlkZScsICd1c2VybmFtZScsICdtZXJnZV9sb2dzJywgJ2tpbGxfcmV0cnlfdGltZScsICdwcmV2X3Jlc3RhcnRfZGVsYXknLCAnaW5zdGFuY2VfdmFyJywgJ3Vuc3RhYmxlX3Jlc3RhcnRzJywgJ3Jlc3RhcnRfdGltZScsICdheG1fYWN0aW9ucycsICdwbXhfbW9kdWxlJywgJ2NvbW1hbmQnLCAnd2F0Y2gnLCAnZmlsdGVyX2VudicsICd2ZXJzaW9uaW5nJywgJ3Zpemlvbl9ydW5pbmcnLCAnTU9EVUxFX0RFQlVHJywgJ3BteCcsICdheG1fb3B0aW9ucycsICdjcmVhdGVkX2F0JywgJ3dhdGNoJywgJ3ZpemlvbicsICdheG1fZHluYW1pYycsICdheG1fbW9uaXRvcicsICdpbnN0YW5jZXMnLCAnYXV0b21hdGlvbicsICdhdXRvcmVzdGFydCcsICd1bnN0YWJsZV9yZXN0YXJ0JywgJ3RyZWVraWxsJywgJ2V4aXRfY29kZScsICd2aXppb24nXTtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICAvL09ubHkgY29weSBzdHVmZiBpbnRvIHRoZSBlbnYgdGhhdCB3ZSBkb24ndCBoYXZlIGFscmVhZHkuXG4gICAgaWYgKGtleXNUb0lnbm9yZS5pbmRleE9mKGtleXNbaV0pID09IC0xICYmIGFkZFtrZXlzW2ldXSAhPSAnW29iamVjdCBPYmplY3RdJylcbiAgICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuXG4vKipcbiAqIEV4dGVuZCB0aGUgYXBwLmVudiBvYmplY3Qgb2Ygd2l0aCB0aGUgcHJvcGVydGllcyB0YWtlbiBmcm9tIHRoZVxuICogYXBwLmVudl9bZW52TmFtZV0gYW5kIGRlcGxveSBjb25maWd1cmF0aW9uLlxuICogQWxzbyB1cGRhdGUgY3VycmVudCBqc29uIGF0dHJpYnV0ZXNcbiAqXG4gKiBVc2VkIG9ubHkgZm9yIENvbmZpZ3VyYXRpb24gZmlsZSBwcm9jZXNzaW5nXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGFwcCBUaGUgYXBwIG9iamVjdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBlbnZOYW1lIFRoZSBnaXZlbiBlbnZpcm9ubWVudCBuYW1lLlxuICogQHBhcmFtIHtPYmplY3R9IGRlcGxveUNvbmYgRGVwbG95bWVudCBjb25maWd1cmF0aW9uIG9iamVjdCAoZnJvbSBKU09OIGZpbGUgb3Igd2hhdGV2ZXIpLlxuICogQHJldHVybnMge09iamVjdH0gVGhlIGFwcC5lbnYgdmFyaWFibGVzIG9iamVjdC5cbiAqL1xuQ29tbW9uLm1lcmdlRW52aXJvbm1lbnRWYXJpYWJsZXMgPSBmdW5jdGlvbiAoYXBwX2VudiwgZW52X25hbWUsIGRlcGxveV9jb25mKSB7XG4gIHZhciBhcHAgPSBmY2xvbmUoYXBwX2Vudik7XG5cbiAgdmFyIG5ld19jb25mOiBhbnkgPSB7XG4gICAgZW52OiB7fVxuICB9XG5cbiAgLy8gU3RyaW5naWZ5IHBvc3NpYmxlIG9iamVjdFxuICBmb3IgKHZhciBrZXkgaW4gYXBwLmVudikge1xuICAgIGlmICh0eXBlb2YgYXBwLmVudltrZXldID09ICdvYmplY3QnKSB7XG4gICAgICBhcHAuZW52W2tleV0gPSBKU09OLnN0cmluZ2lmeShhcHAuZW52W2tleV0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYSBjb25maWd1cmF0aW9uIHVwZGF0ZVxuICAgKi9cbiAgdXRpbC5pbmhlcml0cyhuZXdfY29uZiwgYXBwKVxuXG4gIGlmIChlbnZfbmFtZSkge1xuICAgIC8vIEZpcnN0IG1lcmdlIHZhcmlhYmxlcyBmcm9tIGRlcGxveS5wcm9kdWN0aW9uLmVudiBvYmplY3QgYXMgbGVhc3QgcHJpb3JpdHkuXG4gICAgaWYgKGRlcGxveV9jb25mICYmIGRlcGxveV9jb25mW2Vudl9uYW1lXSAmJiBkZXBsb3lfY29uZltlbnZfbmFtZV1bJ2VudiddKSB7XG4gICAgICB1dGlsLmluaGVyaXRzKG5ld19jb25mLmVudiwgZGVwbG95X2NvbmZbZW52X25hbWVdWydlbnYnXSk7XG4gICAgfVxuXG4gICAgdXRpbC5pbmhlcml0cyhuZXdfY29uZi5lbnYsIGFwcC5lbnYpO1xuXG4gICAgLy8gVGhlbiwgbGFzdCBhbmQgaGlnaGVzdCBwcmlvcml0eSwgbWVyZ2UgdGhlIGFwcC5lbnZfcHJvZHVjdGlvbiBvYmplY3QuXG4gICAgaWYgKCdlbnZfJyArIGVudl9uYW1lIGluIGFwcCkge1xuICAgICAgdXRpbC5pbmhlcml0cyhuZXdfY29uZi5lbnYsIGFwcFsnZW52XycgKyBlbnZfbmFtZV0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19XQVJOSU5HICsgY2hhbGsuYm9sZCgnRW52aXJvbm1lbnQgWyVzXSBpcyBub3QgZGVmaW5lZCBpbiBwcm9jZXNzIGZpbGUnKSwgZW52X25hbWUpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSBuZXdfY29uZi5leGVjX21vZGVcblxuICB2YXIgcmVzOiBhbnkgPSB7XG4gICAgY3VycmVudF9jb25mOiB7fVxuICB9XG5cbiAgdXRpbC5pbmhlcml0cyhyZXMsIG5ld19jb25mLmVudilcbiAgdXRpbC5pbmhlcml0cyhyZXMuY3VycmVudF9jb25mLCBuZXdfY29uZilcblxuICAvLyAjMjU0MSBmb3JjZSByZXNvbHV0aW9uIG9mIG5vZGUgaW50ZXJwcmV0ZXJcbiAgaWYgKGFwcC5leGVjX2ludGVycHJldGVyICYmXG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIuaW5kZXhPZignQCcpID4gLTEpIHtcbiAgICByZXNvbHZlTm9kZUludGVycHJldGVyKGFwcCk7XG4gICAgcmVzLmN1cnJlbnRfY29uZi5leGVjX2ludGVycHJldGVyID0gYXBwLmV4ZWNfaW50ZXJwcmV0ZXJcbiAgfVxuXG4gIHJldHVybiByZXNcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgcmVzb2x2ZSBwYXRocywgb3B0aW9uIGFuZCBlbnZpcm9ubWVudFxuICogQ0FMTEVEIGJlZm9yZSAncHJlcGFyZScgR29kIGNhbGwgKD0+IFBST0NFU1MgSU5JVElBTElaQVRJT04pXG4gKiBAbWV0aG9kIHJlc29sdmVBcHBBdHRyaWJ1dGVzXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICogQHBhcmFtIHtPYmplY3R9IG9wdHMuY3dkXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cy5wbTJfaG9tZVxuICogQHBhcmFtIHtPYmplY3R9IGFwcENvbmYgYXBwbGljYXRpb24gY29uZmlndXJhdGlvblxuICogQHJldHVybiBhcHBcbiAqL1xuQ29tbW9uLnJlc29sdmVBcHBBdHRyaWJ1dGVzID0gZnVuY3Rpb24gKG9wdHMsIGNvbmYpIHtcbiAgdmFyIGNvbmZfY29weSA9IGZjbG9uZShjb25mKTtcblxuICB2YXIgYXBwID0gQ29tbW9uLnByZXBhcmVBcHBDb25mKG9wdHMsIGNvbmZfY29weSk7XG4gIGlmIChhcHAgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihhcHAubWVzc2FnZSk7XG4gIH1cbiAgcmV0dXJuIGFwcDtcbn1cblxuLyoqXG4gKiBWZXJpZnkgY29uZmlndXJhdGlvbnNcbiAqIENhbGxlZCBvbiBFVkVSWSBPcGVyYXRpb24gKHN0YXJ0L3Jlc3RhcnQvcmVsb2FkL3N0b3AuLi4pXG4gKiBAcGFyYW0ge0FycmF5fSBhcHBDb25mc1xuICogQHJldHVybnMge0FycmF5fVxuICovXG5Db21tb24udmVyaWZ5Q29uZnMgPSBmdW5jdGlvbiAoYXBwQ29uZnMpIHtcbiAgaWYgKCFhcHBDb25mcyB8fCBhcHBDb25mcy5sZW5ndGggPT0gMCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8vIE1ha2Ugc3VyZSBpdCBpcyBhbiBBcnJheS5cbiAgYXBwQ29uZnMgPSBbXS5jb25jYXQoYXBwQ29uZnMpO1xuXG4gIHZhciB2ZXJpZmllZENvbmYgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFwcENvbmZzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGFwcCA9IGFwcENvbmZzW2ldO1xuXG4gICAgaWYgKGFwcC5leGVjX21vZGUpXG4gICAgICBhcHAuZXhlY19tb2RlID0gYXBwLmV4ZWNfbW9kZS5yZXBsYWNlKC9eKGZvcmt8Y2x1c3RlcikkLywgJyQxX21vZGUnKTtcblxuICAgIC8vIEpTT04gY29uZjogYWxpYXMgY21kIHRvIHNjcmlwdFxuICAgIGlmIChhcHAuY21kICYmICFhcHAuc2NyaXB0KSB7XG4gICAgICBhcHAuc2NyaXB0ID0gYXBwLmNtZFxuICAgICAgZGVsZXRlIGFwcC5jbWRcbiAgICB9XG4gICAgLy8gSlNPTiBjb25mOiBhbGlhcyBjb21tYW5kIHRvIHNjcmlwdFxuICAgIGlmIChhcHAuY29tbWFuZCAmJiAhYXBwLnNjcmlwdCkge1xuICAgICAgYXBwLnNjcmlwdCA9IGFwcC5jb21tYW5kXG4gICAgICBkZWxldGUgYXBwLmNvbW1hbmRcbiAgICB9XG5cbiAgICBpZiAoIWFwcC5lbnYpIHtcbiAgICAgIGFwcC5lbnYgPSB7fVxuICAgIH1cblxuICAgIC8vIFJlbmRlciBhbiBhcHAgbmFtZSBpZiBub3QgZXhpc3RpbmcuXG4gICAgQ29tbW9uLnJlbmRlckFwcGxpY2F0aW9uTmFtZShhcHApO1xuXG4gICAgaWYgKGFwcC5leGVjdXRlX2NvbW1hbmQgPT0gdHJ1ZSkge1xuICAgICAgYXBwLmV4ZWNfbW9kZSA9ICdmb3JrJ1xuICAgICAgZGVsZXRlIGFwcC5leGVjdXRlX2NvbW1hbmRcbiAgICB9XG5cbiAgICBhcHAudXNlcm5hbWUgPSBDb21tb24uZ2V0Q3VycmVudFVzZXJuYW1lKCk7XG5cbiAgICAvKipcbiAgICAgKiBJZiBjb21tYW5kIGlzIGxpa2UgcG0yIHN0YXJ0IFwicHl0aG9uIHh4LnB5IC0tb2tcIlxuICAgICAqIFRoZW4gYXV0b21hdGljYWxseSBzdGFydCB0aGUgc2NyaXB0IHdpdGggYmFzaCAtYyBhbmQgc2V0IGEgbmFtZSBlcSB0byBjb21tYW5kXG4gICAgICovXG4gICAgaWYgKGFwcC5zY3JpcHQgJiYgYXBwLnNjcmlwdC5pbmRleE9mKCcgJykgPiAtMSAmJiBjc3QuSVNfV0lORE9XUyA9PT0gZmFsc2UpIHtcbiAgICAgIHZhciBfc2NyaXB0ID0gYXBwLnNjcmlwdDtcblxuICAgICAgaWYgKHdoaWNoKCdiYXNoJykpIHtcbiAgICAgICAgYXBwLnNjcmlwdCA9ICdiYXNoJztcbiAgICAgICAgYXBwLmFyZ3MgPSBbJy1jJywgX3NjcmlwdF07XG4gICAgICAgIGlmICghYXBwLm5hbWUpIHtcbiAgICAgICAgICBhcHAubmFtZSA9IF9zY3JpcHRcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAod2hpY2goJ3NoJykpIHtcbiAgICAgICAgYXBwLnNjcmlwdCA9ICdzaCc7XG4gICAgICAgIGFwcC5hcmdzID0gWyctYycsIF9zY3JpcHRdO1xuICAgICAgICBpZiAoIWFwcC5uYW1lKSB7XG4gICAgICAgICAgYXBwLm5hbWUgPSBfc2NyaXB0XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB3YXJuKCdiYXNoIG9yIHNoIG5vdCBhdmFpbGFibGUgaW4gJFBBVEgsIGtlZXBpbmcgc2NyaXB0IGFzIGlzJylcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgbG9nX2RhdGVfZm9ybWF0IGJ5IGRlZmF1bHRcbiAgICAgKi9cbiAgICBpZiAoYXBwLnRpbWUpIHtcbiAgICAgIGFwcC5sb2dfZGF0ZV9mb3JtYXQgPSAnWVlZWS1NTS1ERFRISDptbTpzcydcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgKyBSZXNvbHZlIFVJRC9HSURcbiAgICAgKiBjb21lcyBmcm9tIHBtMiAtLXVpZCA8PiAtLWdpZCA8PiBvciAtLXVzZXJcbiAgICAgKi9cbiAgICBpZiAoYXBwLnVpZCB8fCBhcHAuZ2lkIHx8IGFwcC51c2VyKSB7XG4gICAgICAvLyAxLyBDaGVjayBpZiB3aW5kb3dzXG4gICAgICBpZiAoY3N0LklTX1dJTkRPV1MgPT09IHRydWUpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgJy0tdWlkIGFuZCAtLWdpdCBkb2VzIG5vdCB3b3JrcyBvbiB3aW5kb3dzJyk7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoJy0tdWlkIGFuZCAtLWdpdCBkb2VzIG5vdCB3b3JrcyBvbiB3aW5kb3dzJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIDIvIFZlcmlmeSB0aGF0IHVzZXIgaXMgcm9vdCAodG9kbzogdmVyaWZ5IGlmIG90aGVyIGhhcyByaWdodClcbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPSAndGVzdCcgJiYgcHJvY2Vzcy5nZXR1aWQgJiYgcHJvY2Vzcy5nZXR1aWQoKSAhPT0gMCkge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyAnVG8gdXNlIC0tdWlkIGFuZCAtLWdpZCBwbGVhc2UgcnVuIHBtMiBhcyByb290Jyk7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoJ1RvIHVzZSBVSUQgYW5kIEdJRCBwbGVhc2UgcnVuIFBNMiBhcyByb290Jyk7XG4gICAgICB9XG5cbiAgICAgIC8vIDMvIFJlc29sdmUgdXNlciBpbmZvIHZpYSAvZXRjL3Bhc3N3b3JkXG4gICAgICB2YXIgcGFzc3dkID0gcmVxdWlyZSgnLi90b29scy9wYXNzd2QuanMnKVxuICAgICAgdmFyIHVzZXJzXG4gICAgICB0cnkge1xuICAgICAgICB1c2VycyA9IHBhc3N3ZC5nZXRVc2VycygpXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGUpO1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKGUpO1xuICAgICAgfVxuXG4gICAgICB2YXIgdXNlcl9pbmZvID0gdXNlcnNbYXBwLnVpZCB8fCBhcHAudXNlcl1cbiAgICAgIGlmICghdXNlcl9pbmZvKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGAke2NzdC5QUkVGSVhfTVNHX0VSUn0gVXNlciAke2FwcC51aWQgfHwgYXBwLnVzZXJ9IGNhbm5vdCBiZSBmb3VuZGApO1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKGAke2NzdC5QUkVGSVhfTVNHX0VSUn0gVXNlciAke2FwcC51aWQgfHwgYXBwLnVzZXJ9IGNhbm5vdCBiZSBmb3VuZGApO1xuICAgICAgfVxuXG4gICAgICBhcHAuZW52LkhPTUUgPSB1c2VyX2luZm8uaG9tZWRpclxuICAgICAgYXBwLnVpZCA9IHBhcnNlSW50KHVzZXJfaW5mby51c2VySWQpXG5cbiAgICAgIC8vIDQvIFJlc29sdmUgZ3JvdXAgaWQgaWYgZ2lkIGlzIHNwZWNpZmllZFxuICAgICAgaWYgKGFwcC5naWQpIHtcbiAgICAgICAgdmFyIGdyb3Vwc1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGdyb3VwcyA9IHBhc3N3ZC5nZXRHcm91cHMoKVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZSk7XG4gICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ3JvdXBfaW5mbyA9IGdyb3Vwc1thcHAuZ2lkXVxuICAgICAgICBpZiAoIWdyb3VwX2luZm8pIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihgJHtjc3QuUFJFRklYX01TR19FUlJ9IEdyb3VwICR7YXBwLmdpZH0gY2Fubm90IGJlIGZvdW5kYCk7XG4gICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihgJHtjc3QuUFJFRklYX01TR19FUlJ9IEdyb3VwICR7YXBwLmdpZH0gY2Fubm90IGJlIGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgYXBwLmdpZCA9IHBhcnNlSW50KGdyb3VwX2luZm8uaWQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcHAuZ2lkID0gcGFyc2VJbnQodXNlcl9pbmZvLmdyb3VwSWQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3BlY2lmaWMgb3B0aW9ucyBvZiBQTTIuaW9cbiAgICAgKi9cbiAgICBpZiAocHJvY2Vzcy5lbnYuUE0yX0RFRVBfTU9OSVRPUklORykge1xuICAgICAgYXBwLmRlZXBfbW9uaXRvcmluZyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGFwcC5hdXRvbWF0aW9uID09IGZhbHNlKSB7XG4gICAgICBhcHAucG14ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGFwcC5kaXNhYmxlX3RyYWNlKSB7XG4gICAgICBhcHAudHJhY2UgPSBmYWxzZVxuICAgICAgZGVsZXRlIGFwcC5kaXNhYmxlX3RyYWNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluc3RhbmNlcyBwYXJhbXNcbiAgICAgKi9cbiAgICBpZiAoYXBwLmluc3RhbmNlcyA9PSAnbWF4Jykge1xuICAgICAgYXBwLmluc3RhbmNlcyA9IDA7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiAoYXBwLmluc3RhbmNlcykgPT09ICdzdHJpbmcnKSB7XG4gICAgICBhcHAuaW5zdGFuY2VzID0gcGFyc2VJbnQoYXBwLmluc3RhbmNlcykgfHwgMDtcbiAgICB9XG5cbiAgICBpZiAoYXBwLmV4ZWNfbW9kZSAhPSAnY2x1c3Rlcl9tb2RlJyAmJlxuICAgICAgIWFwcC5pbnN0YW5jZXMgJiZcbiAgICAgIHR5cGVvZiAoYXBwLm1lcmdlX2xvZ3MpID09ICd1bmRlZmluZWQnKSB7XG4gICAgICBhcHAubWVyZ2VfbG9ncyA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIHJldDtcblxuICAgIGlmIChhcHAuY3Jvbl9yZXN0YXJ0KSB7XG4gICAgICBpZiAoKHJldCA9IENvbW1vbi5zaW5rLmRldGVybWluZUNyb24oYXBwKSkgaW5zdGFuY2VvZiBFcnJvcilcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBOb3cgdmFsaWRhdGlvbiBjb25maWd1cmF0aW9uXG4gICAgICovXG4gICAgdmFyIHJldDogYW55ID0gQ29uZmlnLnZhbGlkYXRlSlNPTihhcHApO1xuICAgIGlmIChyZXQuZXJyb3JzICYmIHJldC5lcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0LmVycm9ycy5mb3JFYWNoKGZ1bmN0aW9uIChlcnIpIHsgd2FybihlcnIpIH0pO1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcihyZXQuZXJyb3JzKTtcbiAgICB9XG5cbiAgICB2ZXJpZmllZENvbmYucHVzaChyZXQuY29uZmlnKTtcbiAgfVxuXG4gIHJldHVybiB2ZXJpZmllZENvbmY7XG59XG5cbi8qKlxuICogR2V0IGN1cnJlbnQgdXNlcm5hbWVcbiAqIENhbGxlZCBvbiBFVkVSWSBzdGFydGluZyBhcHBcbiAqXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5Db21tb24uZ2V0Q3VycmVudFVzZXJuYW1lID0gZnVuY3Rpb24gKCkge1xuICB2YXIgY3VycmVudF91c2VyID0gJyc7XG5cbiAgaWYgKG9zLnVzZXJJbmZvKSB7XG4gICAgdHJ5IHtcbiAgICAgIGN1cnJlbnRfdXNlciA9IG9zLnVzZXJJbmZvKCkudXNlcm5hbWU7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBGb3IgdGhlIGNhc2Ugb2YgdW5oYW5kbGVkIGVycm9yIGZvciB1dl9vc19nZXRfcGFzc3dkXG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vVW5pdGVjaC9wbTIvaXNzdWVzLzMxODRcbiAgICB9XG4gIH1cblxuICBpZiAoY3VycmVudF91c2VyID09PSAnJykge1xuICAgIGN1cnJlbnRfdXNlciA9IHByb2Nlc3MuZW52LlVTRVIgfHwgcHJvY2Vzcy5lbnYuTE5BTUUgfHwgcHJvY2Vzcy5lbnYuVVNFUk5BTUUgfHwgcHJvY2Vzcy5lbnYuU1VET19VU0VSIHx8IHByb2Nlc3MuZW52LkM5X1VTRVIgfHwgcHJvY2Vzcy5lbnYuTE9HTkFNRTtcbiAgfVxuXG4gIHJldHVybiBjdXJyZW50X3VzZXI7XG59XG5cbi8qKlxuICogUmVuZGVyIGFuIGFwcCBuYW1lIGlmIG5vdCBleGlzdGluZy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25mXG4gKi9cbkNvbW1vbi5yZW5kZXJBcHBsaWNhdGlvbk5hbWUgPSBmdW5jdGlvbiAoY29uZikge1xuICBpZiAoIWNvbmYubmFtZSAmJiBjb25mLnNjcmlwdCkge1xuICAgIGNvbmYubmFtZSA9IGNvbmYuc2NyaXB0ICE9PSB1bmRlZmluZWQgPyBwYXRoLmJhc2VuYW1lKGNvbmYuc2NyaXB0KSA6ICd1bmRlZmluZWQnO1xuICAgIHZhciBsYXN0RG90ID0gY29uZi5uYW1lLmxhc3RJbmRleE9mKCcuJyk7XG4gICAgaWYgKGxhc3REb3QgPiAwKSB7XG4gICAgICBjb25mLm5hbWUgPSBjb25mLm5hbWUuc2xpY2UoMCwgbGFzdERvdCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2hvdyB3YXJuaW5nc1xuICogQHBhcmFtIHtTdHJpbmd9IHdhcm5pbmdcbiAqL1xuZnVuY3Rpb24gd2Fybih3YXJuaW5nKSB7XG4gIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19XQVJOSU5HICsgd2FybmluZyk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbW1vbjtcbiJdfQ==