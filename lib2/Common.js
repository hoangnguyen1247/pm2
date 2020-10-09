"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

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

/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */

/**
 * Common Utilities ONLY USED IN ->CLI<-
 */
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
  if ((0, _typeof2["default"])(destination) !== 'object') {
    destination = {};
  }

  if (!source || (0, _typeof2["default"])(source) !== 'object') {
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
  if (!add || (0, _typeof2["default"])(add) != 'object') return origin; //Ignore PM2's set environment variables from the nested env

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
    if ((0, _typeof2["default"])(app.env[key]) == 'object') {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Db21tb24udHMiXSwibmFtZXMiOlsiQ29tbW9uIiwiaG9tZWRpciIsImVudiIsInByb2Nlc3MiLCJob21lIiwiSE9NRSIsInVzZXIiLCJMT0dOQU1FIiwiVVNFUiIsIkxOQU1FIiwiVVNFUk5BTUUiLCJwbGF0Zm9ybSIsIlVTRVJQUk9GSUxFIiwiSE9NRURSSVZFIiwiSE9NRVBBVEgiLCJnZXR1aWQiLCJyZXNvbHZlSG9tZSIsImZpbGVwYXRoIiwicGF0aCIsImpvaW4iLCJzbGljZSIsImRldGVybWluZVNpbGVudENMSSIsInZhcmlhZGljQXJnc0Rhc2hlc1BvcyIsImFyZ3YiLCJpbmRleE9mIiwiczFvcHQiLCJzMm9wdCIsIlBNMl9TSUxFTlQiLCJrZXkiLCJjb25zb2xlIiwiY29kZSIsImNoYXJDb2RlQXQiLCJQTTJfRElTQ1JFVEVfTU9ERSIsInByaW50VmVyc2lvbiIsImxvZyIsInBrZyIsInZlcnNpb24iLCJleGl0IiwibG9ja1JlbG9hZCIsInQxIiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJjc3QiLCJQTTJfUkVMT0FEX0xPQ0tGSUxFIiwidG9TdHJpbmciLCJkaWZmIiwicGFyc2VJbnQiLCJSRUxPQURfTE9DS19USU1FT1VUIiwiZSIsIndyaXRlRmlsZVN5bmMiLCJ2YWx1ZU9mIiwiZXJyb3IiLCJtZXNzYWdlIiwidW5sb2NrUmVsb2FkIiwicHJlcGFyZUFwcENvbmYiLCJvcHRzIiwiYXBwIiwic2NyaXB0IiwiRXJyb3IiLCJjd2QiLCJyZXNvbHZlIiwiUFdEIiwibm9kZV9hcmdzIiwicG9ydCIsIlBPUlQiLCJwbV9leGVjX3BhdGgiLCJleGlzdHNTeW5jIiwiY2tkIiwiZGlzYWJsZV9zb3VyY2VfbWFwX3N1cHBvcnQiLCJhY2Nlc3NTeW5jIiwiY29uc3RhbnRzIiwiUl9PSyIsInNvdXJjZV9tYXBfc3VwcG9ydCIsIlBNMl9QUk9HUkFNTUFUSUMiLCJwbV9pZCIsInNhZmVFeHRlbmQiLCJmaWx0ZXJFbnYiLCJlbnZPYmoiLCJmaWx0ZXJfZW52IiwibmV3X2VudiIsImFsbG93ZWRLZXlzIiwicmVkdWNlIiwiYWNjIiwiY3VycmVudCIsImZpbHRlciIsIml0ZW0iLCJpbmNsdWRlcyIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwibGVuZ3RoIiwiZTEiLCJlMiIsInV0aWwiLCJpbmhlcml0cyIsInBtX2N3ZCIsInNpbmsiLCJyZXNvbHZlSW50ZXJwcmV0ZXIiLCJkZXRlcm1pbmVFeGVjTW9kZSIsImZvcm1hdGVkX2FwcF9uYW1lIiwibmFtZSIsInJlcGxhY2UiLCJmIiwiYWYiLCJwcyIsImV4dCIsImlzU3RkIiwidG9VcHBlckNhc2UiLCJkaXIiLCJkaXJuYW1lIiwicHJpbnRFcnJvciIsIlBSRUZJWF9NU0dfV0FSTklORyIsInByaW50T3V0IiwiUFJFRklYX01TRyIsIm1rZGlycCIsInN5bmMiLCJlcnIiLCJQUkVGSVhfTVNHX0VSUiIsInN1YnN0ciIsImFwcGx5Iiwic2VwIiwiaXNDb25maWdGaWxlIiwiZmlsZW5hbWUiLCJwYXJzZUNvbmZpZyIsImNvbmZPYmoiLCJzYW5kYm94Iiwidm0iLCJydW5JblRoaXNDb250ZXh0IiwiZGlzcGxheUVycm9ycyIsInRpbWVvdXQiLCJ5YW1sanMiLCJwYXJzZSIsImNvbmZQYXRoIiwicmVxdWlyZSIsImNhY2hlIiwicmV0RXJyIiwiZGV0ZXJtaW5lQ3JvbiIsImNyb25fcmVzdGFydCIsIkNyb25Kb2IiLCJleCIsImV4ZWNfbW9kZSIsImluc3RhbmNlcyIsImV4ZWNfaW50ZXJwcmV0ZXIiLCJyZXNvbHZlTm9kZUludGVycHJldGVyIiwiY2hhbGsiLCJib2xkIiwieWVsbG93IiwibnZtX3BhdGgiLCJJU19XSU5ET1dTIiwiTlZNX0hPTUUiLCJOVk1fRElSIiwicmVkIiwibXNnIiwibm9kZV92ZXJzaW9uIiwic3BsaXQiLCJwYXRoX3RvX25vZGUiLCJzZW12ZXIiLCJzYXRpc2ZpZXMiLCJudm1fbm9kZV9wYXRoIiwibnZtX2JpbiIsIm52bV9jbWQiLCJtYXhCdWZmZXIiLCJhcmNoIiwiZ3JlZW4iLCJub0ludGVycHJldGVyIiwiZXh0TmFtZSIsImV4dG5hbWUiLCJiZXR0ZXJJbnRlcnByZXRlciIsImV4dEl0cHMiLCJQWVRIT05VTkJVRkZFUkVEIiwiX19kaXJuYW1lIiwid2FybiIsIkJVSUxUSU5fTk9ERV9QQVRIIiwiZGVlcENvcHkiLCJzZXJpYWxpemUiLCJjbG9uZSIsIm9iaiIsInVuZGVmaW5lZCIsImVyck1vZCIsIlBSRUZJWF9NU0dfTU9EX0VSUiIsImFyZ3VtZW50cyIsImluZm8iLCJQUkVGSVhfTVNHX0lORk8iLCJsb2dNb2QiLCJQUkVGSVhfTVNHX01PRCIsImV4dGVuZCIsImRlc3RpbmF0aW9uIiwic291cmNlIiwibmV3X2tleSIsIm9yaWdpbiIsImFkZCIsImtleXNUb0lnbm9yZSIsImkiLCJtZXJnZUVudmlyb25tZW50VmFyaWFibGVzIiwiYXBwX2VudiIsImVudl9uYW1lIiwiZGVwbG95X2NvbmYiLCJuZXdfY29uZiIsIkpTT04iLCJzdHJpbmdpZnkiLCJyZXMiLCJjdXJyZW50X2NvbmYiLCJyZXNvbHZlQXBwQXR0cmlidXRlcyIsImNvbmYiLCJjb25mX2NvcHkiLCJ2ZXJpZnlDb25mcyIsImFwcENvbmZzIiwiY29uY2F0IiwidmVyaWZpZWRDb25mIiwiY21kIiwiY29tbWFuZCIsInJlbmRlckFwcGxpY2F0aW9uTmFtZSIsImV4ZWN1dGVfY29tbWFuZCIsInVzZXJuYW1lIiwiZ2V0Q3VycmVudFVzZXJuYW1lIiwiX3NjcmlwdCIsImFyZ3MiLCJ0aW1lIiwibG9nX2RhdGVfZm9ybWF0IiwidWlkIiwiZ2lkIiwiTk9ERV9FTlYiLCJ1c2VycyIsInBhc3N3ZCIsImdldFVzZXJzIiwidXNlcl9pbmZvIiwidXNlcklkIiwiZ3JvdXBzIiwiZ2V0R3JvdXBzIiwiZ3JvdXBfaW5mbyIsImlkIiwiZ3JvdXBJZCIsIlBNMl9ERUVQX01PTklUT1JJTkciLCJkZWVwX21vbml0b3JpbmciLCJhdXRvbWF0aW9uIiwicG14IiwiZGlzYWJsZV90cmFjZSIsInRyYWNlIiwibWVyZ2VfbG9ncyIsInJldCIsIkNvbmZpZyIsInZhbGlkYXRlSlNPTiIsImVycm9ycyIsInB1c2giLCJjb25maWciLCJjdXJyZW50X3VzZXIiLCJvcyIsInVzZXJJbmZvIiwiU1VET19VU0VSIiwiQzlfVVNFUiIsImJhc2VuYW1lIiwibGFzdERvdCIsImxhc3RJbmRleE9mIiwid2FybmluZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFVQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUE3QkE7Ozs7OztBQU1BOzs7QUF5QkEsSUFBTUEsTUFBVyxHQUFHLEVBQXBCOztBQUVBLFNBQVNDLE9BQVQsR0FBbUI7QUFDakIsTUFBSUMsR0FBRyxHQUFHQyxPQUFPLENBQUNELEdBQWxCO0FBQ0EsTUFBSUUsSUFBSSxHQUFHRixHQUFHLENBQUNHLElBQWY7QUFDQSxNQUFJQyxJQUFJLEdBQUdKLEdBQUcsQ0FBQ0ssT0FBSixJQUFlTCxHQUFHLENBQUNNLElBQW5CLElBQTJCTixHQUFHLENBQUNPLEtBQS9CLElBQXdDUCxHQUFHLENBQUNRLFFBQXZEOztBQUVBLE1BQUlQLE9BQU8sQ0FBQ1EsUUFBUixLQUFxQixPQUF6QixFQUFrQztBQUNoQyxXQUFPVCxHQUFHLENBQUNVLFdBQUosSUFBbUJWLEdBQUcsQ0FBQ1csU0FBSixHQUFnQlgsR0FBRyxDQUFDWSxRQUF2QyxJQUFtRFYsSUFBbkQsSUFBMkQsSUFBbEU7QUFDRDs7QUFFRCxNQUFJRCxPQUFPLENBQUNRLFFBQVIsS0FBcUIsUUFBekIsRUFBbUM7QUFDakMsV0FBT1AsSUFBSSxLQUFLRSxJQUFJLEdBQUcsWUFBWUEsSUFBZixHQUFzQixJQUEvQixDQUFYO0FBQ0Q7O0FBRUQsTUFBSUgsT0FBTyxDQUFDUSxRQUFSLEtBQXFCLE9BQXpCLEVBQWtDO0FBQ2hDLFdBQU9QLElBQUksS0FBS0QsT0FBTyxDQUFDWSxNQUFSLE9BQXFC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Q0FBQ2xKLE1BQUwsS0FBZ0J3SCxTQUFoQixHQUE0Qi9KLGlCQUFLd08sUUFBTCxDQUFjL0MsSUFBSSxDQUFDbEosTUFBbkIsQ0FBNUIsR0FBeUQsV0FBckU7QUFDQSxRQUFJa00sT0FBTyxHQUFHaEQsSUFBSSxDQUFDdkcsSUFBTCxDQUFVd0osV0FBVixDQUFzQixHQUF0QixDQUFkOztBQUNBLFFBQUlELE9BQU8sR0FBRyxDQUFkLEVBQWlCO0FBQ2ZoRCxNQUFBQSxJQUFJLENBQUN2RyxJQUFMLEdBQVl1RyxJQUFJLENBQUN2RyxJQUFMLENBQVVoRixLQUFWLENBQWdCLENBQWhCLEVBQW1CdU8sT0FBbkIsQ0FBWjtBQUNEO0FBQ0Y7QUFDRixDQVJEO0FBVUE7Ozs7OztBQUlBLFNBQVNoRixJQUFULENBQWNrRixPQUFkLEVBQXVCO0FBQ3JCN1AsRUFBQUEsTUFBTSxDQUFDZ0gsUUFBUCxDQUFnQnRFLHNCQUFJcUUsa0JBQUosR0FBeUI4SSxPQUF6QztBQUNEOztlQUVjN1AsTSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIGxpY2Vuc2UgdGhhdFxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4gKi9cblxuLyoqXG4gKiBDb21tb24gVXRpbGl0aWVzIE9OTFkgVVNFRCBJTiAtPkNMSTwtXG4gKi9cblxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmltcG9ydCB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCBmY2xvbmUgZnJvbSAnZmNsb25lJztcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCBkYXlqcyBmcm9tICdkYXlqcyc7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IGlzQmluYXJ5IGZyb20gJy4vdG9vbHMvaXNiaW5hcnlmaWxlJztcbmltcG9ydCBjc3QgZnJvbSAnLi4vY29uc3RhbnRzLmpzJztcbmltcG9ydCBleHRJdHBzIGZyb20gJy4vQVBJL2ludGVycHJldGVyJztcbmltcG9ydCBDb25maWcgZnJvbSAnLi90b29scy9Db25maWcnO1xuaW1wb3J0IHBrZyBmcm9tICcuLi9wYWNrYWdlLmpzb24nO1xuaW1wb3J0IHdoaWNoIGZyb20gJy4vdG9vbHMvd2hpY2gnO1xuaW1wb3J0IHlhbWxqcyBmcm9tICd5YW1sanMnO1xuaW1wb3J0IHZtIGZyb20gJ3ZtJztcbmltcG9ydCB7IENyb25Kb2IgfSBmcm9tICdjcm9uJztcbmltcG9ydCBta2RpcnAgZnJvbSAnbWtkaXJwJ1xuaW1wb3J0IHBhc3N3ZCBmcm9tICcuL3Rvb2xzL3Bhc3N3ZCdcblxuY29uc3QgQ29tbW9uOiBhbnkgPSB7fTtcblxuZnVuY3Rpb24gaG9tZWRpcigpIHtcbiAgdmFyIGVudiA9IHByb2Nlc3MuZW52O1xuICB2YXIgaG9tZSA9IGVudi5IT01FO1xuICB2YXIgdXNlciA9IGVudi5MT0dOQU1FIHx8IGVudi5VU0VSIHx8IGVudi5MTkFNRSB8fCBlbnYuVVNFUk5BTUU7XG5cbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICByZXR1cm4gZW52LlVTRVJQUk9GSUxFIHx8IGVudi5IT01FRFJJVkUgKyBlbnYuSE9NRVBBVEggfHwgaG9tZSB8fCBudWxsO1xuICB9XG5cbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgcmV0dXJuIGhvbWUgfHwgKHVzZXIgPyAnL1VzZXJzLycgKyB1c2VyIDogbnVsbCk7XG4gIH1cblxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2xpbnV4Jykge1xuICAgIHJldHVybiBob21lIHx8IChwcm9jZXNzLmdldHVpZCgpID09PSAwID8gJy9yb290JyA6ICh1c2VyID8gJy9ob21lLycgKyB1c2VyIDogbnVsbCkpO1xuICB9XG5cbiAgcmV0dXJuIGhvbWUgfHwgbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUhvbWUoZmlsZXBhdGgpIHtcbiAgaWYgKGZpbGVwYXRoWzBdID09PSAnficpIHtcbiAgICByZXR1cm4gcGF0aC5qb2luKGhvbWVkaXIoKSwgZmlsZXBhdGguc2xpY2UoMSkpO1xuICB9XG4gIHJldHVybiBmaWxlcGF0aDtcbn1cblxuQ29tbW9uLmRldGVybWluZVNpbGVudENMSSA9IGZ1bmN0aW9uICgpIHtcbiAgLy8gcG0yIHNob3VsZCBpZ25vcmUgLXMgLS1zaWxlbnQgLXYgaWYgdGhleSBhcmUgYWZ0ZXIgJy0tJ1xuICB2YXIgdmFyaWFkaWNBcmdzRGFzaGVzUG9zID0gcHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0tJyk7XG4gIHZhciBzMW9wdCA9IHByb2Nlc3MuYXJndi5pbmRleE9mKCctLXNpbGVudCcpXG4gIHZhciBzMm9wdCA9IHByb2Nlc3MuYXJndi5pbmRleE9mKCctcycpXG5cbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9TSUxFTlQgfHwgKHZhcmlhZGljQXJnc0Rhc2hlc1BvcyA+IC0xICYmXG4gICAgKHMxb3B0ICE9IC0xICYmIHMxb3B0IDwgdmFyaWFkaWNBcmdzRGFzaGVzUG9zKSAmJlxuICAgIChzMm9wdCAhPSAtMSAhPSBzMm9wdCA8IHZhcmlhZGljQXJnc0Rhc2hlc1BvcykpIHx8XG4gICAgKHZhcmlhZGljQXJnc0Rhc2hlc1BvcyA9PSAtMSAmJiAoczFvcHQgPiAtMSB8fCBzMm9wdCA+IC0xKSkpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gY29uc29sZSkge1xuICAgICAgdmFyIGNvZGUgPSBrZXkuY2hhckNvZGVBdCgwKTtcbiAgICAgIGlmIChjb2RlID49IDk3ICYmIGNvZGUgPD0gMTIyKSB7XG4gICAgICAgIGNvbnNvbGVba2V5XSA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICAgIH1cbiAgICB9XG4gICAgcHJvY2Vzcy5lbnYuUE0yX0RJU0NSRVRFX01PREUgPSBcInRydWVcIjtcbiAgfVxufVxuXG5Db21tb24ucHJpbnRWZXJzaW9uID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdmFyaWFkaWNBcmdzRGFzaGVzUG9zID0gcHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0tJyk7XG5cbiAgaWYgKHByb2Nlc3MuYXJndi5pbmRleE9mKCctdicpID4gLTEgJiYgcHJvY2Vzcy5hcmd2LmluZGV4T2YoJy12JykgPCB2YXJpYWRpY0FyZ3NEYXNoZXNQb3MpIHtcbiAgICBjb25zb2xlLmxvZyhwa2cudmVyc2lvbik7XG4gICAgcHJvY2Vzcy5leGl0KDApO1xuICB9XG59XG5cbkNvbW1vbi5sb2NrUmVsb2FkID0gZnVuY3Rpb24gKCkge1xuICB0cnkge1xuICAgIHZhciB0MSA9IGZzLnJlYWRGaWxlU3luYyhjc3QuUE0yX1JFTE9BRF9MT0NLRklMRSkudG9TdHJpbmcoKTtcblxuICAgIC8vIENoZWNrIGlmIGNvbnRlbnQgYW5kIGlmIHRpbWUgPCAzMCByZXR1cm4gbG9ja2VkXG4gICAgLy8gRWxzZSBpZiBjb250ZW50IGRldGVjdGVkIChsb2NrIGZpbGUgc3RhbGVkKSwgYWxsb3cgYW5kIHJld3JpdHRlXG4gICAgaWYgKHQxICYmIHQxICE9ICcnKSB7XG4gICAgICB2YXIgZGlmZiA9IGRheWpzKCkuZGlmZihwYXJzZUludCh0MSkpO1xuICAgICAgaWYgKGRpZmYgPCBjc3QuUkVMT0FEX0xPQ0tfVElNRU9VVClcbiAgICAgICAgcmV0dXJuIGRpZmY7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7IH1cblxuICB0cnkge1xuICAgIC8vIFdyaXRlIGxhdGVzdCB0aW1lc3RhbXBcbiAgICBmcy53cml0ZUZpbGVTeW5jKGNzdC5QTTJfUkVMT0FEX0xPQ0tGSUxFLCBkYXlqcygpLnZhbHVlT2YoKS50b1N0cmluZygpKTtcbiAgICByZXR1cm4gMDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlIHx8IGUpO1xuICB9XG59O1xuXG5Db21tb24udW5sb2NrUmVsb2FkID0gZnVuY3Rpb24gKCkge1xuICB0cnkge1xuICAgIGZzLndyaXRlRmlsZVN5bmMoY3N0LlBNMl9SRUxPQURfTE9DS0ZJTEUsICcnKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlIHx8IGUpO1xuICB9XG59O1xuXG4vKipcbiAqIFJlc29sdmUgYXBwIHBhdGhzIGFuZCByZXBsYWNlIG1pc3NpbmcgdmFsdWVzIHdpdGggZGVmYXVsdHMuXG4gKiBAbWV0aG9kIHByZXBhcmVBcHBDb25mXG4gKiBAcGFyYW0gYXBwIHtPYmplY3R9XG4gKiBAcGFyYW0ge30gY3dkXG4gKiBAcGFyYW0ge30gb3V0cHV0dGVyXG4gKiBAcmV0dXJuIGFwcFxuICovXG5Db21tb24ucHJlcGFyZUFwcENvbmYgPSBmdW5jdGlvbiAob3B0cywgYXBwKSB7XG4gIC8qKlxuICAgKiBNaW5pbXVtIHZhbGlkYXRpb25cbiAgICovXG4gIGlmICghYXBwLnNjcmlwdClcbiAgICByZXR1cm4gbmV3IEVycm9yKCdObyBzY3JpcHQgcGF0aCAtIGFib3J0aW5nJyk7XG5cbiAgdmFyIGN3ZCA9IG51bGw7XG5cbiAgaWYgKGFwcC5jd2QpIHtcbiAgICBjd2QgPSBwYXRoLnJlc29sdmUoYXBwLmN3ZCk7XG4gICAgcHJvY2Vzcy5lbnYuUFdEID0gYXBwLmN3ZDtcbiAgfVxuXG4gIGlmICghYXBwLm5vZGVfYXJncykge1xuICAgIGFwcC5ub2RlX2FyZ3MgPSBbXTtcbiAgfVxuXG4gIGlmIChhcHAucG9ydCAmJiBhcHAuZW52KSB7XG4gICAgYXBwLmVudi5QT1JUID0gYXBwLnBvcnQ7XG4gIH1cblxuICAvLyBDV0Qgb3B0aW9uIHJlc29sdmluZ1xuICBjd2QgJiYgKGN3ZFswXSAhPSAnLycpICYmIChjd2QgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgY3dkKSk7XG4gIGN3ZCA9IGN3ZCB8fCBvcHRzLmN3ZDtcblxuICAvLyBGdWxsIHBhdGggc2NyaXB0IHJlc29sdXRpb25cbiAgYXBwLnBtX2V4ZWNfcGF0aCA9IHBhdGgucmVzb2x2ZShjd2QsIGFwcC5zY3JpcHQpO1xuXG4gIC8vIElmIHNjcmlwdCBkb2VzIG5vdCBleGlzdCBhZnRlciByZXNvbHV0aW9uXG4gIGlmICghZnMuZXhpc3RzU3luYyhhcHAucG1fZXhlY19wYXRoKSkge1xuICAgIHZhciBja2Q7XG4gICAgLy8gVHJ5IHJlc29sdmUgY29tbWFuZCBhdmFpbGFibGUgaW4gJFBBVEhcbiAgICBpZiAoKGNrZCA9IHdoaWNoKGFwcC5zY3JpcHQpKSkge1xuICAgICAgaWYgKHR5cGVvZiAoY2tkKSAhPT0gJ3N0cmluZycpXG4gICAgICAgIGNrZCA9IGNrZC50b1N0cmluZygpO1xuICAgICAgYXBwLnBtX2V4ZWNfcGF0aCA9IGNrZDtcbiAgICB9XG4gICAgZWxzZVxuICAgICAgLy8gVGhyb3cgY3JpdGljYWwgZXJyb3JcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoYFNjcmlwdCBub3QgZm91bmQ6ICR7YXBwLnBtX2V4ZWNfcGF0aH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdXRvIGRldGVjdCAubWFwIGZpbGUgYW5kIGVuYWJsZSBzb3VyY2UgbWFwIHN1cHBvcnQgYXV0b21hdGljYWxseVxuICAgKi9cbiAgaWYgKGFwcC5kaXNhYmxlX3NvdXJjZV9tYXBfc3VwcG9ydCAhPSB0cnVlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGZzLmFjY2Vzc1N5bmMoYXBwLnBtX2V4ZWNfcGF0aCArICcubWFwJywgZnMuY29uc3RhbnRzLlJfT0spO1xuICAgICAgYXBwLnNvdXJjZV9tYXBfc3VwcG9ydCA9IHRydWU7XG4gICAgfSBjYXRjaCAoZSkgeyB9XG4gICAgZGVsZXRlIGFwcC5kaXNhYmxlX3NvdXJjZV9tYXBfc3VwcG9ydDtcbiAgfVxuXG4gIGRlbGV0ZSBhcHAuc2NyaXB0O1xuXG4gIC8vIFNldCBjdXJyZW50IGVudiBieSBmaXJzdCBhZGRpbmcgdGhlIHByb2Nlc3MgZW52aXJvbm1lbnQgYW5kIHRoZW4gZXh0ZW5kaW5nL3JlcGxhY2luZyBpdFxuICAvLyB3aXRoIGVudiBzcGVjaWZpZWQgb24gY29tbWFuZC1saW5lIG9yIEpTT04gZmlsZS5cblxuICB2YXIgZW52ID0ge307XG5cbiAgLyoqXG4gICAqIERvIG5vdCBjb3B5IGludGVybmFsIHBtMiBlbnZpcm9ubWVudCB2YXJpYWJsZXMgaWYgYWN0aW5nIG9uIHByb2Nlc3NcbiAgICogaXMgbWFkZSBmcm9tIGEgcHJvZ3JhbW1hdGljIHNjcmlwdCBzdGFydGVkIGJ5IFBNMiBvciBpZiBhIHBtX2lkIGlzIHByZXNlbnQgaW4gZW52XG4gICAqL1xuICBpZiAoY3N0LlBNMl9QUk9HUkFNTUFUSUMgfHwgcHJvY2Vzcy5lbnYucG1faWQpXG4gICAgQ29tbW9uLnNhZmVFeHRlbmQoZW52LCBwcm9jZXNzLmVudik7XG4gIGVsc2VcbiAgICBlbnYgPSBwcm9jZXNzLmVudjtcblxuICBmdW5jdGlvbiBmaWx0ZXJFbnYoZW52T2JqKSB7XG4gICAgaWYgKGFwcC5maWx0ZXJfZW52ID09IHRydWUpXG4gICAgICByZXR1cm4ge31cblxuICAgIGlmICh0eXBlb2YgYXBwLmZpbHRlcl9lbnYgPT09ICdzdHJpbmcnKSB7XG4gICAgICBkZWxldGUgZW52T2JqW2FwcC5maWx0ZXJfZW52XVxuICAgICAgcmV0dXJuIGVudk9ialxuICAgIH1cblxuICAgIHZhciBuZXdfZW52ID0ge307XG4gICAgdmFyIGFsbG93ZWRLZXlzID0gYXBwLmZpbHRlcl9lbnYucmVkdWNlKChhY2MsIGN1cnJlbnQpID0+XG4gICAgICBhY2MuZmlsdGVyKGl0ZW0gPT4gIWl0ZW0uaW5jbHVkZXMoY3VycmVudCkpLCBPYmplY3Qua2V5cyhlbnZPYmopKVxuICAgIGFsbG93ZWRLZXlzLmZvckVhY2goa2V5ID0+IG5ld19lbnZba2V5XSA9IGVudk9ialtrZXldKTtcbiAgICByZXR1cm4gbmV3X2VudlxuICB9XG5cbiAgYXBwLmVudiA9IFtcbiAgICB7fSwgKGFwcC5maWx0ZXJfZW52ICYmIGFwcC5maWx0ZXJfZW52Lmxlbmd0aCA+IDApID8gZmlsdGVyRW52KHByb2Nlc3MuZW52KSA6IGVudiwgYXBwLmVudiB8fCB7fVxuICBdLnJlZHVjZShmdW5jdGlvbiAoZTEsIGUyKSB7XG4gICAgcmV0dXJuIHV0aWwuaW5oZXJpdHMoZTEsIGUyKTtcbiAgfSk7XG5cbiAgYXBwLnBtX2N3ZCA9IGN3ZDtcbiAgLy8gSW50ZXJwcmV0ZXJcbiAgdHJ5IHtcbiAgICBDb21tb24uc2luay5yZXNvbHZlSW50ZXJwcmV0ZXIoYXBwKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBlXG4gIH1cblxuICAvLyBFeGVjIG1vZGUgYW5kIGNsdXN0ZXIgc3R1ZmZcbiAgQ29tbW9uLnNpbmsuZGV0ZXJtaW5lRXhlY01vZGUoYXBwKTtcblxuICAvKipcbiAgICogU2NhcnlcbiAgICovXG4gIHZhciBmb3JtYXRlZF9hcHBfbmFtZSA9IGFwcC5uYW1lLnJlcGxhY2UoL1teYS16QS1aMC05XFxcXC5cXFxcLV0vZywgJy0nKTtcblxuICBbJ2xvZycsICdvdXQnLCAnZXJyb3InLCAncGlkJ10uZm9yRWFjaChmdW5jdGlvbiAoZikge1xuICAgIHZhciBhZiA9IGFwcFtmICsgJ19maWxlJ10sIHBzLCBleHQgPSAoZiA9PSAncGlkJyA/ICdwaWQnIDogJ2xvZycpLCBpc1N0ZCA9ICF+Wydsb2cnLCAncGlkJ10uaW5kZXhPZihmKTtcbiAgICBpZiAoYWYpIGFmID0gcmVzb2x2ZUhvbWUoYWYpO1xuXG4gICAgaWYgKChmID09ICdsb2cnICYmIHR5cGVvZiBhZiA9PSAnYm9vbGVhbicgJiYgYWYpIHx8IChmICE9ICdsb2cnICYmICFhZikpIHtcbiAgICAgIHBzID0gW2NzdFsnREVGQVVMVF8nICsgZXh0LnRvVXBwZXJDYXNlKCkgKyAnX1BBVEgnXSwgZm9ybWF0ZWRfYXBwX25hbWUgKyAoaXNTdGQgPyAnLScgKyBmIDogJycpICsgJy4nICsgZXh0XTtcbiAgICB9IGVsc2UgaWYgKChmICE9ICdsb2cnIHx8IChmID09ICdsb2cnICYmIGFmKSkgJiYgYWYgIT09ICdOVUxMJyAmJiBhZiAhPT0gJy9kZXYvbnVsbCcpIHtcbiAgICAgIHBzID0gW2N3ZCwgYWZdO1xuXG4gICAgICB2YXIgZGlyID0gcGF0aC5kaXJuYW1lKHBhdGgucmVzb2x2ZShjd2QsIGFmKSk7XG4gICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19XQVJOSU5HICsgJ0ZvbGRlciBkb2VzIG5vdCBleGlzdDogJyArIGRpcik7XG4gICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdDcmVhdGluZyBmb2xkZXI6ICcgKyBkaXIpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG1rZGlycC5zeW5jKGRpcik7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArICdDb3VsZCBub3QgY3JlYXRlIGZvbGRlcjogJyArIHBhdGguZGlybmFtZShhZikpO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGNyZWF0ZSBmb2xkZXInKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfVxuICAgIC8vIFBNMiBwYXRoc1xuICAgIGlmIChhZiAhPT0gJ05VTEwnICYmIGFmICE9PSAnL2Rldi9udWxsJykge1xuICAgICAgcHMgJiYgKGFwcFsncG1fJyArIChpc1N0ZCA/IGYuc3Vic3RyKDAsIDMpICsgJ18nIDogJycpICsgZXh0ICsgJ19wYXRoJ10gPSBwYXRoLnJlc29sdmUuYXBwbHkobnVsbCwgcHMpKTtcbiAgICB9IGVsc2UgaWYgKHBhdGguc2VwID09PSAnXFxcXCcpIHtcbiAgICAgIGFwcFsncG1fJyArIChpc1N0ZCA/IGYuc3Vic3RyKDAsIDMpICsgJ18nIDogJycpICsgZXh0ICsgJ19wYXRoJ10gPSAnXFxcXFxcXFwuXFxcXE5VTCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwcFsncG1fJyArIChpc1N0ZCA/IGYuc3Vic3RyKDAsIDMpICsgJ18nIDogJycpICsgZXh0ICsgJ19wYXRoJ10gPSAnL2Rldi9udWxsJztcbiAgICB9XG4gICAgZGVsZXRlIGFwcFtmICsgJ19maWxlJ107XG4gIH0pO1xuXG4gIHJldHVybiBhcHA7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGZpbGVuYW1lIGlzIGEgY29uZmlndXJhdGlvbiBmaWxlXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWVcbiAqIEByZXR1cm4ge21peGVkfSBudWxsIGlmIG5vdCBjb25mIGZpbGUsIGpzb24gb3IgeWFtbCBpZiBjb25mXG4gKi9cbkNvbW1vbi5pc0NvbmZpZ0ZpbGUgPSBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgaWYgKHR5cGVvZiAoZmlsZW5hbWUpICE9PSAnc3RyaW5nJylcbiAgICByZXR1cm4gbnVsbDtcbiAgaWYgKGZpbGVuYW1lLmluZGV4T2YoJy5qc29uJykgIT09IC0xKVxuICAgIHJldHVybiAnanNvbic7XG4gIGlmIChmaWxlbmFtZS5pbmRleE9mKCcueW1sJykgPiAtMSB8fCBmaWxlbmFtZS5pbmRleE9mKCcueWFtbCcpID4gLTEpXG4gICAgcmV0dXJuICd5YW1sJztcbiAgaWYgKGZpbGVuYW1lLmluZGV4T2YoJy5jb25maWcuanMnKSAhPT0gLTEpXG4gICAgcmV0dXJuICdqcyc7XG4gIGlmIChmaWxlbmFtZS5pbmRleE9mKCcuY29uZmlnLmNqcycpICE9PSAtMSlcbiAgICByZXR1cm4gJ2pzJztcbiAgaWYgKGZpbGVuYW1lLmluZGV4T2YoJy5jb25maWcubWpzJykgIT09IC0xKVxuICAgIHJldHVybiAnbWpzJztcbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKipcbiAqIFBhcnNlcyBhIGNvbmZpZyBmaWxlIGxpa2UgZWNvc3lzdGVtLmNvbmZpZy5qcy4gU3VwcG9ydGVkIGZvcm1hdHM6IEpTLCBKU09OLCBKU09ONSwgWUFNTC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjb25mU3RyaW5nICBjb250ZW50cyBvZiB0aGUgY29uZmlnIGZpbGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAgICBwYXRoIHRvIHRoZSBjb25maWcgZmlsZVxuICogQHJldHVybiB7T2JqZWN0fSBjb25maWcgb2JqZWN0XG4gKi9cbkNvbW1vbi5wYXJzZUNvbmZpZyA9IGZ1bmN0aW9uIChjb25mT2JqLCBmaWxlbmFtZSkge1xuICBpZiAoIWZpbGVuYW1lIHx8XG4gICAgZmlsZW5hbWUgPT0gJ3BpcGUnIHx8XG4gICAgZmlsZW5hbWUgPT0gJ25vbmUnIHx8XG4gICAgZmlsZW5hbWUuaW5kZXhPZignLmpzb24nKSA+IC0xKSB7XG4gICAgdmFyIGNvZGUgPSAnKCcgKyBjb25mT2JqICsgJyknO1xuICAgIHZhciBzYW5kYm94ID0ge307XG5cbiAgICAvLyBUT0RPOiBQbGVhc2UgY2hlY2sgdGhpc1xuICAgIC8vIHJldHVybiB2bS5ydW5JblRoaXNDb250ZXh0KGNvZGUsIHNhbmRib3gsIHtcbiAgICAvLyAgIGZpbGVuYW1lOiBwYXRoLnJlc29sdmUoZmlsZW5hbWUpLFxuICAgIC8vICAgZGlzcGxheUVycm9yczogZmFsc2UsXG4gICAgLy8gICB0aW1lb3V0OiAxMDAwXG4gICAgLy8gfSk7XG4gICAgcmV0dXJuIHZtLnJ1bkluVGhpc0NvbnRleHQoY29kZSwge1xuICAgICAgZmlsZW5hbWU6IHBhdGgucmVzb2x2ZShmaWxlbmFtZSksXG4gICAgICBkaXNwbGF5RXJyb3JzOiBmYWxzZSxcbiAgICAgIHRpbWVvdXQ6IDEwMDBcbiAgICB9KTtcbiAgfVxuICBlbHNlIGlmIChmaWxlbmFtZS5pbmRleE9mKCcueW1sJykgPiAtMSB8fFxuICAgIGZpbGVuYW1lLmluZGV4T2YoJy55YW1sJykgPiAtMSkge1xuICAgIHJldHVybiB5YW1sanMucGFyc2UoY29uZk9iai50b1N0cmluZygpKTtcbiAgfVxuICBlbHNlIGlmIChmaWxlbmFtZS5pbmRleE9mKCcuY29uZmlnLmpzJykgPiAtMSB8fCBmaWxlbmFtZS5pbmRleE9mKCcuY29uZmlnLmNqcycpID4gLTEgfHwgZmlsZW5hbWUuaW5kZXhPZignLmNvbmZpZy5tanMnKSA+IC0xKSB7XG4gICAgdmFyIGNvbmZQYXRoID0gcmVxdWlyZS5yZXNvbHZlKHBhdGgucmVzb2x2ZShmaWxlbmFtZSkpO1xuICAgIGRlbGV0ZSByZXF1aXJlLmNhY2hlW2NvbmZQYXRoXTtcbiAgICByZXR1cm4gcmVxdWlyZShjb25mUGF0aCk7XG4gIH1cbn07XG5cbkNvbW1vbi5yZXRFcnIgPSBmdW5jdGlvbiAoZSkge1xuICBpZiAoIWUpXG4gICAgcmV0dXJuIG5ldyBFcnJvcignVW5pZGVudGlmaWVkIGVycm9yJyk7XG4gIGlmIChlIGluc3RhbmNlb2YgRXJyb3IpXG4gICAgcmV0dXJuIGU7XG4gIHJldHVybiBuZXcgRXJyb3IoZSk7XG59XG5cbkNvbW1vbi5zaW5rID0ge307XG5cbkNvbW1vbi5zaW5rLmRldGVybWluZUNyb24gPSBmdW5jdGlvbiAoYXBwKSB7XG5cbiAgaWYgKGFwcC5jcm9uX3Jlc3RhcnQpIHtcbiAgICB0cnkge1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ2Nyb24gcmVzdGFydCBhdCAnICsgYXBwLmNyb25fcmVzdGFydCk7XG4gICAgICBuZXcgQ3JvbkpvYihhcHAuY3Jvbl9yZXN0YXJ0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdjcm9uIHBhdHRlcm4gZm9yIGF1dG8gcmVzdGFydCBkZXRlY3RlZCBhbmQgdmFsaWQnKTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKGBDcm9uIHBhdHRlcm4gZXJyb3I6ICR7ZXgubWVzc2FnZX1gKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogSGFuZGxlIGFsaWFzIChmb3JrIDw9PiBmb3JrX21vZGUsIGNsdXN0ZXIgPD0+IGNsdXN0ZXJfbW9kZSlcbiAqL1xuQ29tbW9uLnNpbmsuZGV0ZXJtaW5lRXhlY01vZGUgPSBmdW5jdGlvbiAoYXBwKSB7XG4gIGlmIChhcHAuZXhlY19tb2RlKVxuICAgIGFwcC5leGVjX21vZGUgPSBhcHAuZXhlY19tb2RlLnJlcGxhY2UoL14oZm9ya3xjbHVzdGVyKSQvLCAnJDFfbW9kZScpO1xuXG4gIC8qKlxuICAgKiBIZXJlIHdlIHB1dCB0aGUgZGVmYXVsdCBleGVjIG1vZGVcbiAgICovXG4gIGlmICghYXBwLmV4ZWNfbW9kZSAmJlxuICAgIChhcHAuaW5zdGFuY2VzID49IDEgfHwgYXBwLmluc3RhbmNlcyA9PT0gMCB8fCBhcHAuaW5zdGFuY2VzID09PSAtMSkgJiZcbiAgICBhcHAuZXhlY19pbnRlcnByZXRlci5pbmRleE9mKCdub2RlJykgPiAtMSkge1xuICAgIGFwcC5leGVjX21vZGUgPSAnY2x1c3Rlcl9tb2RlJztcbiAgfSBlbHNlIGlmICghYXBwLmV4ZWNfbW9kZSkge1xuICAgIGFwcC5leGVjX21vZGUgPSAnZm9ya19tb2RlJztcbiAgfVxuICBpZiAodHlwZW9mIGFwcC5pbnN0YW5jZXMgPT0gJ3VuZGVmaW5lZCcpXG4gICAgYXBwLmluc3RhbmNlcyA9IDE7XG59O1xuXG52YXIgcmVzb2x2ZU5vZGVJbnRlcnByZXRlciA9IGZ1bmN0aW9uIChhcHApIHtcbiAgaWYgKGFwcC5leGVjX21vZGUgJiYgYXBwLmV4ZWNfbW9kZS5pbmRleE9mKCdjbHVzdGVyJykgPiAtMSkge1xuICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX1dBUk5JTkcgKyBjaGFsay5ib2xkLnllbGxvdygnQ2hvb3NpbmcgdGhlIE5vZGUuanMgdmVyc2lvbiBpbiBjbHVzdGVyIG1vZGUgaXMgbm90IHN1cHBvcnRlZCcpKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB2YXIgbnZtX3BhdGggPSBjc3QuSVNfV0lORE9XUyA/IHByb2Nlc3MuZW52Lk5WTV9IT01FIDogcHJvY2Vzcy5lbnYuTlZNX0RJUjtcbiAgaWYgKCFudm1fcGF0aCkge1xuICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArIGNoYWxrLnJlZCgnTlZNIGlzIG5vdCBhdmFpbGFibGUgaW4gUEFUSCcpKTtcbiAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyBjaGFsay5yZWQoJ0ZhbGxiYWNrIHRvIG5vZGUgaW4gUEFUSCcpKTtcbiAgICB2YXIgbXNnID0gY3N0LklTX1dJTkRPV1NcbiAgICAgID8gJ2h0dHBzOi8vZ2l0aHViLmNvbS9jb3JleWJ1dGxlci9udm0td2luZG93cy9yZWxlYXNlcy8nXG4gICAgICA6ICckIGN1cmwgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2NyZWF0aW9uaXgvbnZtL21hc3Rlci9pbnN0YWxsLnNoIHwgYmFzaCc7XG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX0VSUiArIGNoYWxrLmJvbGQoJ0luc3RhbGwgTlZNOlxcbicgKyBtc2cpKTtcbiAgfVxuICBlbHNlIHtcbiAgICB2YXIgbm9kZV92ZXJzaW9uID0gYXBwLmV4ZWNfaW50ZXJwcmV0ZXIuc3BsaXQoJ0AnKVsxXTtcbiAgICB2YXIgcGF0aF90b19ub2RlID0gY3N0LklTX1dJTkRPV1NcbiAgICAgID8gJy92JyArIG5vZGVfdmVyc2lvbiArICcvbm9kZS5leGUnXG4gICAgICA6IHNlbXZlci5zYXRpc2ZpZXMobm9kZV92ZXJzaW9uLCAnPj0gMC4xMi4wJylcbiAgICAgICAgPyAnL3ZlcnNpb25zL25vZGUvdicgKyBub2RlX3ZlcnNpb24gKyAnL2Jpbi9ub2RlJ1xuICAgICAgICA6ICcvdicgKyBub2RlX3ZlcnNpb24gKyAnL2Jpbi9ub2RlJztcbiAgICB2YXIgbnZtX25vZGVfcGF0aCA9IHBhdGguam9pbihudm1fcGF0aCwgcGF0aF90b19ub2RlKTtcbiAgICB0cnkge1xuICAgICAgZnMuYWNjZXNzU3luYyhudm1fbm9kZV9wYXRoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnSW5zdGFsbGluZyBOb2RlIHYlcycsIG5vZGVfdmVyc2lvbik7XG4gICAgICB2YXIgbnZtX2JpbiA9IHBhdGguam9pbihudm1fcGF0aCwgJ252bS4nICsgKGNzdC5JU19XSU5ET1dTID8gJ2V4ZScgOiAnc2gnKSk7XG4gICAgICB2YXIgbnZtX2NtZCA9IGNzdC5JU19XSU5ET1dTXG4gICAgICAgID8gbnZtX2JpbiArICcgaW5zdGFsbCAnICsgbm9kZV92ZXJzaW9uXG4gICAgICAgIDogJy4gJyArIG52bV9iaW4gKyAnIDsgbnZtIGluc3RhbGwgJyArIG5vZGVfdmVyc2lvbjtcblxuICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0V4ZWN1dGluZzogJXMnLCBudm1fY21kKTtcblxuICAgICAgZXhlY1N5bmMobnZtX2NtZCwge1xuICAgICAgICBjd2Q6IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpKSxcbiAgICAgICAgZW52OiBwcm9jZXNzLmVudixcbiAgICAgICAgbWF4QnVmZmVyOiAyMCAqIDEwMjQgKiAxMDI0XG4gICAgICB9KTtcblxuICAgICAgLy8gaW4gb3JkZXIgdG8gc3VwcG9ydCBib3RoIGFyY2gsIG52bSBmb3IgV2luZG93cyByZW5hbWVzICdub2RlLmV4ZScgdG86XG4gICAgICAvLyAnbm9kZTMyLmV4ZScgZm9yIHgzMiBhcmNoXG4gICAgICAvLyAnbm9kZTY0LmV4ZScgZm9yIHg2NCBhcmNoXG4gICAgICBpZiAoY3N0LklTX1dJTkRPV1MpXG4gICAgICAgIG52bV9ub2RlX3BhdGggPSBudm1fbm9kZV9wYXRoLnJlcGxhY2UoL25vZGUvLCAnbm9kZScgKyBwcm9jZXNzLmFyY2guc2xpY2UoMSkpXG4gICAgfVxuXG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgY2hhbGsuZ3JlZW4uYm9sZCgnU2V0dGluZyBOb2RlIHRvIHYlcyAocGF0aD0lcyknKSxcbiAgICAgIG5vZGVfdmVyc2lvbixcbiAgICAgIG52bV9ub2RlX3BhdGgpO1xuXG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPSBudm1fbm9kZV9wYXRoO1xuICB9XG59O1xuXG4vKipcbiAqIFJlc29sdmUgaW50ZXJwcmV0ZXJcbiAqL1xuQ29tbW9uLnNpbmsucmVzb2x2ZUludGVycHJldGVyID0gZnVuY3Rpb24gKGFwcCkge1xuICB2YXIgbm9JbnRlcnByZXRlciA9ICFhcHAuZXhlY19pbnRlcnByZXRlcjtcbiAgdmFyIGV4dE5hbWUgPSBwYXRoLmV4dG5hbWUoYXBwLnBtX2V4ZWNfcGF0aCk7XG4gIHZhciBiZXR0ZXJJbnRlcnByZXRlciA9IGV4dEl0cHNbZXh0TmFtZV07XG5cbiAgLy8gTm8gaW50ZXJwcmV0ZXIgZGVmaW5lZCBhbmQgY29ycmVzcG9uZGFuY2UgaW4gc2NoZW1hIGhhc2htYXBcbiAgaWYgKG5vSW50ZXJwcmV0ZXIgJiYgYmV0dGVySW50ZXJwcmV0ZXIpIHtcbiAgICBhcHAuZXhlY19pbnRlcnByZXRlciA9IGJldHRlckludGVycHJldGVyO1xuICB9XG4gIC8vIEVsc2UgaWYgbm8gSW50ZXJwcmV0ZXIgZGV0ZWN0IGlmIHByb2Nlc3MgaXMgYmluYXJ5XG4gIGVsc2UgaWYgKG5vSW50ZXJwcmV0ZXIpXG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPSBpc0JpbmFyeShhcHAucG1fZXhlY19wYXRoKSA/ICdub25lJyA6ICdub2RlJztcbiAgZWxzZSBpZiAoYXBwLmV4ZWNfaW50ZXJwcmV0ZXIuaW5kZXhPZignbm9kZUAnKSA+IC0xKVxuICAgIHJlc29sdmVOb2RlSW50ZXJwcmV0ZXIoYXBwKTtcblxuICBpZiAoYXBwLmV4ZWNfaW50ZXJwcmV0ZXIuaW5kZXhPZigncHl0aG9uJykgPiAtMSlcbiAgICBhcHAuZW52LlBZVEhPTlVOQlVGRkVSRUQgPSAnMSdcblxuICAvKipcbiAgICogU3BlY2lmaWMgaW5zdGFsbGVkIEpTIHRyYW5zcGlsZXJzXG4gICAqL1xuICBpZiAoYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPT0gJ3RzLW5vZGUnKSB7XG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vbm9kZV9tb2R1bGVzLy5iaW4vdHMtbm9kZScpO1xuICB9XG5cbiAgaWYgKGFwcC5leGVjX2ludGVycHJldGVyID09ICdsc2MnKSB7XG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vbm9kZV9tb2R1bGVzLy5iaW4vbHNjJyk7XG4gIH1cblxuICBpZiAoYXBwLmV4ZWNfaW50ZXJwcmV0ZXIgPT0gJ2NvZmZlZScpIHtcbiAgICBhcHAuZXhlY19pbnRlcnByZXRlciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9ub2RlX21vZHVsZXMvLmJpbi9jb2ZmZWUnKTtcbiAgfVxuXG4gIGlmIChhcHAuZXhlY19pbnRlcnByZXRlciAhPSAnbm9uZScgJiYgd2hpY2goYXBwLmV4ZWNfaW50ZXJwcmV0ZXIpID09IG51bGwpIHtcbiAgICAvLyBJZiBub2RlIGlzIG5vdCBwcmVzZW50XG4gICAgaWYgKGFwcC5leGVjX2ludGVycHJldGVyID09ICdub2RlJykge1xuICAgICAgQ29tbW9uLndhcm4oYFVzaW5nIGJ1aWx0aW4gbm9kZS5qcyB2ZXJzaW9uIG9uIHZlcnNpb24gJHtwcm9jZXNzLnZlcnNpb259YClcbiAgICAgIGFwcC5leGVjX2ludGVycHJldGVyID0gY3N0LkJVSUxUSU5fTk9ERV9QQVRIXG4gICAgfVxuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW50ZXJwcmV0ZXIgJHthcHAuZXhlY19pbnRlcnByZXRlcn0gaXMgTk9UIEFWQUlMQUJMRSBpbiBQQVRILiAodHlwZSAnd2hpY2ggJHthcHAuZXhlY19pbnRlcnByZXRlcn0nIHRvIGRvdWJsZSBjaGVjay4pYClcbiAgfVxuXG4gIHJldHVybiBhcHA7XG59O1xuXG5Db21tb24uZGVlcENvcHkgPSBDb21tb24uc2VyaWFsaXplID0gQ29tbW9uLmNsb25lID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09PSBudWxsIHx8IG9iaiA9PT0gdW5kZWZpbmVkKSByZXR1cm4ge307XG4gIHJldHVybiBmY2xvbmUob2JqKTtcbn07XG5cbkNvbW1vbi5lcnJNb2QgPSBmdW5jdGlvbiAobXNnKSB7XG4gIGlmIChwcm9jZXNzLmVudi5QTTJfU0lMRU5UIHx8IHByb2Nlc3MuZW52LlBNMl9QUk9HUkFNTUFUSUMgPT09ICd0cnVlJykgcmV0dXJuIGZhbHNlO1xuICBpZiAobXNnIGluc3RhbmNlb2YgRXJyb3IpXG4gICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IobXNnLm1lc3NhZ2UpO1xuICByZXR1cm4gY29uc29sZS5lcnJvcihgJHtjc3QuUFJFRklYX01TR19NT0RfRVJSfSR7bXNnfWApO1xufVxuXG5Db21tb24uZXJyID0gZnVuY3Rpb24gKG1zZykge1xuICBpZiAocHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCB8fCBwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID09PSAndHJ1ZScpIHJldHVybiBmYWxzZTtcbiAgaWYgKG1zZyBpbnN0YW5jZW9mIEVycm9yKVxuICAgIHJldHVybiBjb25zb2xlLmVycm9yKGAke2NzdC5QUkVGSVhfTVNHX0VSUn0ke21zZy5tZXNzYWdlfWApO1xuICByZXR1cm4gY29uc29sZS5lcnJvcihgJHtjc3QuUFJFRklYX01TR19FUlJ9JHttc2d9YCk7XG59XG5cbkNvbW1vbi5wcmludEVycm9yID0gZnVuY3Rpb24gKG1zZykge1xuICBpZiAocHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCB8fCBwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID09PSAndHJ1ZScpIHJldHVybiBmYWxzZTtcbiAgaWYgKG1zZyBpbnN0YW5jZW9mIEVycm9yKVxuICAgIHJldHVybiBjb25zb2xlLmVycm9yKG1zZy5tZXNzYWdlKTtcbiAgcmV0dXJuIGNvbnNvbGUuZXJyb3IuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzIGFzIGFueSk7XG59O1xuXG5Db21tb24ubG9nID0gZnVuY3Rpb24gKG1zZykge1xuICBpZiAocHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCB8fCBwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID09PSAndHJ1ZScpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIGNvbnNvbGUubG9nKGAke2NzdC5QUkVGSVhfTVNHfSR7bXNnfWApO1xufVxuXG5Db21tb24uaW5mbyA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9TSUxFTlQgfHwgcHJvY2Vzcy5lbnYuUE0yX1BST0dSQU1NQVRJQyA9PT0gJ3RydWUnKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBjb25zb2xlLmxvZyhgJHtjc3QuUFJFRklYX01TR19JTkZPfSR7bXNnfWApO1xufVxuXG5Db21tb24ud2FybiA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgaWYgKHByb2Nlc3MuZW52LlBNMl9TSUxFTlQgfHwgcHJvY2Vzcy5lbnYuUE0yX1BST0dSQU1NQVRJQyA9PT0gJ3RydWUnKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBjb25zb2xlLmxvZyhgJHtjc3QuUFJFRklYX01TR19XQVJOSU5HfSR7bXNnfWApO1xufVxuXG5Db21tb24ubG9nTW9kID0gZnVuY3Rpb24gKG1zZykge1xuICBpZiAocHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCB8fCBwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID09PSAndHJ1ZScpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIGNvbnNvbGUubG9nKGAke2NzdC5QUkVGSVhfTVNHX01PRH0ke21zZ31gKTtcbn1cblxuQ29tbW9uLnByaW50T3V0ID0gZnVuY3Rpb24gKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuUE0yX1NJTEVOVCA9PT0gJ3RydWUnIHx8IHByb2Nlc3MuZW52LlBNMl9QUk9HUkFNTUFUSUMgPT09ICd0cnVlJykgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzIGFzIGFueSk7XG59O1xuXG5cbi8qKlxuICogUmF3IGV4dGVuZFxuICovXG5Db21tb24uZXh0ZW5kID0gZnVuY3Rpb24gKGRlc3RpbmF0aW9uLCBzb3VyY2UpIHtcbiAgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbiAhPT0gJ29iamVjdCcpIHtcbiAgICBkZXN0aW5hdGlvbiA9IHt9O1xuICB9XG4gIGlmICghc291cmNlIHx8IHR5cGVvZiBzb3VyY2UgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIGRlc3RpbmF0aW9uO1xuICB9XG5cbiAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uIChuZXdfa2V5KSB7XG4gICAgaWYgKHNvdXJjZVtuZXdfa2V5XSAhPSAnW29iamVjdCBPYmplY3RdJylcbiAgICAgIGRlc3RpbmF0aW9uW25ld19rZXldID0gc291cmNlW25ld19rZXldO1xuICB9KTtcblxuICByZXR1cm4gZGVzdGluYXRpb247XG59O1xuXG4vKipcbiAqIFRoaXMgaXMgdXNlZnVsIHdoZW4gc3RhcnRpbmcgc2NyaXB0IHByb2dyYW1tYXRpY2FsbHlcbiAqL1xuQ29tbW9uLnNhZmVFeHRlbmQgPSBmdW5jdGlvbiAob3JpZ2luLCBhZGQpIHtcbiAgaWYgKCFhZGQgfHwgdHlwZW9mIGFkZCAhPSAnb2JqZWN0JykgcmV0dXJuIG9yaWdpbjtcblxuICAvL0lnbm9yZSBQTTIncyBzZXQgZW52aXJvbm1lbnQgdmFyaWFibGVzIGZyb20gdGhlIG5lc3RlZCBlbnZcbiAgdmFyIGtleXNUb0lnbm9yZSA9IFsnbmFtZScsICdleGVjX21vZGUnLCAnZW52JywgJ2FyZ3MnLCAncG1fY3dkJywgJ2V4ZWNfaW50ZXJwcmV0ZXInLCAncG1fZXhlY19wYXRoJywgJ25vZGVfYXJncycsICdwbV9vdXRfbG9nX3BhdGgnLCAncG1fZXJyX2xvZ19wYXRoJywgJ3BtX3BpZF9wYXRoJywgJ3BtX2lkJywgJ3N0YXR1cycsICdwbV91cHRpbWUnLCAnY3JlYXRlZF9hdCcsICd3aW5kb3dzSGlkZScsICd1c2VybmFtZScsICdtZXJnZV9sb2dzJywgJ2tpbGxfcmV0cnlfdGltZScsICdwcmV2X3Jlc3RhcnRfZGVsYXknLCAnaW5zdGFuY2VfdmFyJywgJ3Vuc3RhYmxlX3Jlc3RhcnRzJywgJ3Jlc3RhcnRfdGltZScsICdheG1fYWN0aW9ucycsICdwbXhfbW9kdWxlJywgJ2NvbW1hbmQnLCAnd2F0Y2gnLCAnZmlsdGVyX2VudicsICd2ZXJzaW9uaW5nJywgJ3Zpemlvbl9ydW5pbmcnLCAnTU9EVUxFX0RFQlVHJywgJ3BteCcsICdheG1fb3B0aW9ucycsICdjcmVhdGVkX2F0JywgJ3dhdGNoJywgJ3ZpemlvbicsICdheG1fZHluYW1pYycsICdheG1fbW9uaXRvcicsICdpbnN0YW5jZXMnLCAnYXV0b21hdGlvbicsICdhdXRvcmVzdGFydCcsICd1bnN0YWJsZV9yZXN0YXJ0JywgJ3RyZWVraWxsJywgJ2V4aXRfY29kZScsICd2aXppb24nXTtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICAvL09ubHkgY29weSBzdHVmZiBpbnRvIHRoZSBlbnYgdGhhdCB3ZSBkb24ndCBoYXZlIGFscmVhZHkuXG4gICAgaWYgKGtleXNUb0lnbm9yZS5pbmRleE9mKGtleXNbaV0pID09IC0xICYmIGFkZFtrZXlzW2ldXSAhPSAnW29iamVjdCBPYmplY3RdJylcbiAgICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuXG4vKipcbiAqIEV4dGVuZCB0aGUgYXBwLmVudiBvYmplY3Qgb2Ygd2l0aCB0aGUgcHJvcGVydGllcyB0YWtlbiBmcm9tIHRoZVxuICogYXBwLmVudl9bZW52TmFtZV0gYW5kIGRlcGxveSBjb25maWd1cmF0aW9uLlxuICogQWxzbyB1cGRhdGUgY3VycmVudCBqc29uIGF0dHJpYnV0ZXNcbiAqXG4gKiBVc2VkIG9ubHkgZm9yIENvbmZpZ3VyYXRpb24gZmlsZSBwcm9jZXNzaW5nXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGFwcCBUaGUgYXBwIG9iamVjdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBlbnZOYW1lIFRoZSBnaXZlbiBlbnZpcm9ubWVudCBuYW1lLlxuICogQHBhcmFtIHtPYmplY3R9IGRlcGxveUNvbmYgRGVwbG95bWVudCBjb25maWd1cmF0aW9uIG9iamVjdCAoZnJvbSBKU09OIGZpbGUgb3Igd2hhdGV2ZXIpLlxuICogQHJldHVybnMge09iamVjdH0gVGhlIGFwcC5lbnYgdmFyaWFibGVzIG9iamVjdC5cbiAqL1xuQ29tbW9uLm1lcmdlRW52aXJvbm1lbnRWYXJpYWJsZXMgPSBmdW5jdGlvbiAoYXBwX2VudiwgZW52X25hbWUsIGRlcGxveV9jb25mKSB7XG4gIHZhciBhcHAgPSBmY2xvbmUoYXBwX2Vudik7XG5cbiAgdmFyIG5ld19jb25mOiBhbnkgPSB7XG4gICAgZW52OiB7fVxuICB9XG5cbiAgLy8gU3RyaW5naWZ5IHBvc3NpYmxlIG9iamVjdFxuICBmb3IgKHZhciBrZXkgaW4gYXBwLmVudikge1xuICAgIGlmICh0eXBlb2YgYXBwLmVudltrZXldID09ICdvYmplY3QnKSB7XG4gICAgICBhcHAuZW52W2tleV0gPSBKU09OLnN0cmluZ2lmeShhcHAuZW52W2tleV0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYSBjb25maWd1cmF0aW9uIHVwZGF0ZVxuICAgKi9cbiAgdXRpbC5pbmhlcml0cyhuZXdfY29uZiwgYXBwKVxuXG4gIGlmIChlbnZfbmFtZSkge1xuICAgIC8vIEZpcnN0IG1lcmdlIHZhcmlhYmxlcyBmcm9tIGRlcGxveS5wcm9kdWN0aW9uLmVudiBvYmplY3QgYXMgbGVhc3QgcHJpb3JpdHkuXG4gICAgaWYgKGRlcGxveV9jb25mICYmIGRlcGxveV9jb25mW2Vudl9uYW1lXSAmJiBkZXBsb3lfY29uZltlbnZfbmFtZV1bJ2VudiddKSB7XG4gICAgICB1dGlsLmluaGVyaXRzKG5ld19jb25mLmVudiwgZGVwbG95X2NvbmZbZW52X25hbWVdWydlbnYnXSk7XG4gICAgfVxuXG4gICAgdXRpbC5pbmhlcml0cyhuZXdfY29uZi5lbnYsIGFwcC5lbnYpO1xuXG4gICAgLy8gVGhlbiwgbGFzdCBhbmQgaGlnaGVzdCBwcmlvcml0eSwgbWVyZ2UgdGhlIGFwcC5lbnZfcHJvZHVjdGlvbiBvYmplY3QuXG4gICAgaWYgKCdlbnZfJyArIGVudl9uYW1lIGluIGFwcCkge1xuICAgICAgdXRpbC5pbmhlcml0cyhuZXdfY29uZi5lbnYsIGFwcFsnZW52XycgKyBlbnZfbmFtZV0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19XQVJOSU5HICsgY2hhbGsuYm9sZCgnRW52aXJvbm1lbnQgWyVzXSBpcyBub3QgZGVmaW5lZCBpbiBwcm9jZXNzIGZpbGUnKSwgZW52X25hbWUpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSBuZXdfY29uZi5leGVjX21vZGVcblxuICB2YXIgcmVzOiBhbnkgPSB7XG4gICAgY3VycmVudF9jb25mOiB7fVxuICB9XG5cbiAgdXRpbC5pbmhlcml0cyhyZXMsIG5ld19jb25mLmVudilcbiAgdXRpbC5pbmhlcml0cyhyZXMuY3VycmVudF9jb25mLCBuZXdfY29uZilcblxuICAvLyAjMjU0MSBmb3JjZSByZXNvbHV0aW9uIG9mIG5vZGUgaW50ZXJwcmV0ZXJcbiAgaWYgKGFwcC5leGVjX2ludGVycHJldGVyICYmXG4gICAgYXBwLmV4ZWNfaW50ZXJwcmV0ZXIuaW5kZXhPZignQCcpID4gLTEpIHtcbiAgICByZXNvbHZlTm9kZUludGVycHJldGVyKGFwcCk7XG4gICAgcmVzLmN1cnJlbnRfY29uZi5leGVjX2ludGVycHJldGVyID0gYXBwLmV4ZWNfaW50ZXJwcmV0ZXJcbiAgfVxuXG4gIHJldHVybiByZXNcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgcmVzb2x2ZSBwYXRocywgb3B0aW9uIGFuZCBlbnZpcm9ubWVudFxuICogQ0FMTEVEIGJlZm9yZSAncHJlcGFyZScgR29kIGNhbGwgKD0+IFBST0NFU1MgSU5JVElBTElaQVRJT04pXG4gKiBAbWV0aG9kIHJlc29sdmVBcHBBdHRyaWJ1dGVzXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICogQHBhcmFtIHtPYmplY3R9IG9wdHMuY3dkXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cy5wbTJfaG9tZVxuICogQHBhcmFtIHtPYmplY3R9IGFwcENvbmYgYXBwbGljYXRpb24gY29uZmlndXJhdGlvblxuICogQHJldHVybiBhcHBcbiAqL1xuQ29tbW9uLnJlc29sdmVBcHBBdHRyaWJ1dGVzID0gZnVuY3Rpb24gKG9wdHMsIGNvbmYpIHtcbiAgdmFyIGNvbmZfY29weSA9IGZjbG9uZShjb25mKTtcblxuICB2YXIgYXBwID0gQ29tbW9uLnByZXBhcmVBcHBDb25mKG9wdHMsIGNvbmZfY29weSk7XG4gIGlmIChhcHAgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihhcHAubWVzc2FnZSk7XG4gIH1cbiAgcmV0dXJuIGFwcDtcbn1cblxuLyoqXG4gKiBWZXJpZnkgY29uZmlndXJhdGlvbnNcbiAqIENhbGxlZCBvbiBFVkVSWSBPcGVyYXRpb24gKHN0YXJ0L3Jlc3RhcnQvcmVsb2FkL3N0b3AuLi4pXG4gKiBAcGFyYW0ge0FycmF5fSBhcHBDb25mc1xuICogQHJldHVybnMge0FycmF5fVxuICovXG5Db21tb24udmVyaWZ5Q29uZnMgPSBmdW5jdGlvbiAoYXBwQ29uZnMpIHtcbiAgaWYgKCFhcHBDb25mcyB8fCBhcHBDb25mcy5sZW5ndGggPT0gMCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8vIE1ha2Ugc3VyZSBpdCBpcyBhbiBBcnJheS5cbiAgYXBwQ29uZnMgPSBbXS5jb25jYXQoYXBwQ29uZnMpO1xuXG4gIHZhciB2ZXJpZmllZENvbmYgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFwcENvbmZzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGFwcCA9IGFwcENvbmZzW2ldO1xuXG4gICAgaWYgKGFwcC5leGVjX21vZGUpXG4gICAgICBhcHAuZXhlY19tb2RlID0gYXBwLmV4ZWNfbW9kZS5yZXBsYWNlKC9eKGZvcmt8Y2x1c3RlcikkLywgJyQxX21vZGUnKTtcblxuICAgIC8vIEpTT04gY29uZjogYWxpYXMgY21kIHRvIHNjcmlwdFxuICAgIGlmIChhcHAuY21kICYmICFhcHAuc2NyaXB0KSB7XG4gICAgICBhcHAuc2NyaXB0ID0gYXBwLmNtZFxuICAgICAgZGVsZXRlIGFwcC5jbWRcbiAgICB9XG4gICAgLy8gSlNPTiBjb25mOiBhbGlhcyBjb21tYW5kIHRvIHNjcmlwdFxuICAgIGlmIChhcHAuY29tbWFuZCAmJiAhYXBwLnNjcmlwdCkge1xuICAgICAgYXBwLnNjcmlwdCA9IGFwcC5jb21tYW5kXG4gICAgICBkZWxldGUgYXBwLmNvbW1hbmRcbiAgICB9XG5cbiAgICBpZiAoIWFwcC5lbnYpIHtcbiAgICAgIGFwcC5lbnYgPSB7fVxuICAgIH1cblxuICAgIC8vIFJlbmRlciBhbiBhcHAgbmFtZSBpZiBub3QgZXhpc3RpbmcuXG4gICAgQ29tbW9uLnJlbmRlckFwcGxpY2F0aW9uTmFtZShhcHApO1xuXG4gICAgaWYgKGFwcC5leGVjdXRlX2NvbW1hbmQgPT0gdHJ1ZSkge1xuICAgICAgYXBwLmV4ZWNfbW9kZSA9ICdmb3JrJ1xuICAgICAgZGVsZXRlIGFwcC5leGVjdXRlX2NvbW1hbmRcbiAgICB9XG5cbiAgICBhcHAudXNlcm5hbWUgPSBDb21tb24uZ2V0Q3VycmVudFVzZXJuYW1lKCk7XG5cbiAgICAvKipcbiAgICAgKiBJZiBjb21tYW5kIGlzIGxpa2UgcG0yIHN0YXJ0IFwicHl0aG9uIHh4LnB5IC0tb2tcIlxuICAgICAqIFRoZW4gYXV0b21hdGljYWxseSBzdGFydCB0aGUgc2NyaXB0IHdpdGggYmFzaCAtYyBhbmQgc2V0IGEgbmFtZSBlcSB0byBjb21tYW5kXG4gICAgICovXG4gICAgaWYgKGFwcC5zY3JpcHQgJiYgYXBwLnNjcmlwdC5pbmRleE9mKCcgJykgPiAtMSAmJiBjc3QuSVNfV0lORE9XUyA9PT0gZmFsc2UpIHtcbiAgICAgIHZhciBfc2NyaXB0ID0gYXBwLnNjcmlwdDtcblxuICAgICAgaWYgKHdoaWNoKCdiYXNoJykpIHtcbiAgICAgICAgYXBwLnNjcmlwdCA9ICdiYXNoJztcbiAgICAgICAgYXBwLmFyZ3MgPSBbJy1jJywgX3NjcmlwdF07XG4gICAgICAgIGlmICghYXBwLm5hbWUpIHtcbiAgICAgICAgICBhcHAubmFtZSA9IF9zY3JpcHRcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAod2hpY2goJ3NoJykpIHtcbiAgICAgICAgYXBwLnNjcmlwdCA9ICdzaCc7XG4gICAgICAgIGFwcC5hcmdzID0gWyctYycsIF9zY3JpcHRdO1xuICAgICAgICBpZiAoIWFwcC5uYW1lKSB7XG4gICAgICAgICAgYXBwLm5hbWUgPSBfc2NyaXB0XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB3YXJuKCdiYXNoIG9yIHNoIG5vdCBhdmFpbGFibGUgaW4gJFBBVEgsIGtlZXBpbmcgc2NyaXB0IGFzIGlzJylcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgbG9nX2RhdGVfZm9ybWF0IGJ5IGRlZmF1bHRcbiAgICAgKi9cbiAgICBpZiAoYXBwLnRpbWUpIHtcbiAgICAgIGFwcC5sb2dfZGF0ZV9mb3JtYXQgPSAnWVlZWS1NTS1ERFRISDptbTpzcydcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgKyBSZXNvbHZlIFVJRC9HSURcbiAgICAgKiBjb21lcyBmcm9tIHBtMiAtLXVpZCA8PiAtLWdpZCA8PiBvciAtLXVzZXJcbiAgICAgKi9cbiAgICBpZiAoYXBwLnVpZCB8fCBhcHAuZ2lkIHx8IGFwcC51c2VyKSB7XG4gICAgICAvLyAxLyBDaGVjayBpZiB3aW5kb3dzXG4gICAgICBpZiAoY3N0LklTX1dJTkRPV1MgPT09IHRydWUpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgJy0tdWlkIGFuZCAtLWdpdCBkb2VzIG5vdCB3b3JrcyBvbiB3aW5kb3dzJyk7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoJy0tdWlkIGFuZCAtLWdpdCBkb2VzIG5vdCB3b3JrcyBvbiB3aW5kb3dzJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIDIvIFZlcmlmeSB0aGF0IHVzZXIgaXMgcm9vdCAodG9kbzogdmVyaWZ5IGlmIG90aGVyIGhhcyByaWdodClcbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPSAndGVzdCcgJiYgcHJvY2Vzcy5nZXR1aWQgJiYgcHJvY2Vzcy5nZXR1aWQoKSAhPT0gMCkge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyAnVG8gdXNlIC0tdWlkIGFuZCAtLWdpZCBwbGVhc2UgcnVuIHBtMiBhcyByb290Jyk7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoJ1RvIHVzZSBVSUQgYW5kIEdJRCBwbGVhc2UgcnVuIFBNMiBhcyByb290Jyk7XG4gICAgICB9XG5cbiAgICAgIC8vIDMvIFJlc29sdmUgdXNlciBpbmZvIHZpYSAvZXRjL3Bhc3N3b3JkXG4gICAgICB2YXIgdXNlcnNcbiAgICAgIHRyeSB7XG4gICAgICAgIHVzZXJzID0gcGFzc3dkLmdldFVzZXJzKClcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZSk7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoZSk7XG4gICAgICB9XG5cbiAgICAgIHZhciB1c2VyX2luZm8gPSB1c2Vyc1thcHAudWlkIHx8IGFwcC51c2VyXVxuICAgICAgaWYgKCF1c2VyX2luZm8pIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoYCR7Y3N0LlBSRUZJWF9NU0dfRVJSfSBVc2VyICR7YXBwLnVpZCB8fCBhcHAudXNlcn0gY2Fubm90IGJlIGZvdW5kYCk7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoYCR7Y3N0LlBSRUZJWF9NU0dfRVJSfSBVc2VyICR7YXBwLnVpZCB8fCBhcHAudXNlcn0gY2Fubm90IGJlIGZvdW5kYCk7XG4gICAgICB9XG5cbiAgICAgIGFwcC5lbnYuSE9NRSA9IHVzZXJfaW5mby5ob21lZGlyXG4gICAgICBhcHAudWlkID0gcGFyc2VJbnQodXNlcl9pbmZvLnVzZXJJZClcblxuICAgICAgLy8gNC8gUmVzb2x2ZSBncm91cCBpZCBpZiBnaWQgaXMgc3BlY2lmaWVkXG4gICAgICBpZiAoYXBwLmdpZCkge1xuICAgICAgICB2YXIgZ3JvdXBzXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZ3JvdXBzID0gcGFzc3dkLmdldEdyb3VwcygpXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlKTtcbiAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKGUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBncm91cF9pbmZvID0gZ3JvdXBzW2FwcC5naWRdXG4gICAgICAgIGlmICghZ3JvdXBfaW5mbykge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGAke2NzdC5QUkVGSVhfTVNHX0VSUn0gR3JvdXAgJHthcHAuZ2lkfSBjYW5ub3QgYmUgZm91bmRgKTtcbiAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKGAke2NzdC5QUkVGSVhfTVNHX0VSUn0gR3JvdXAgJHthcHAuZ2lkfSBjYW5ub3QgYmUgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICBhcHAuZ2lkID0gcGFyc2VJbnQoZ3JvdXBfaW5mby5pZClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFwcC5naWQgPSBwYXJzZUludCh1c2VyX2luZm8uZ3JvdXBJZClcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWZpYyBvcHRpb25zIG9mIFBNMi5pb1xuICAgICAqL1xuICAgIGlmIChwcm9jZXNzLmVudi5QTTJfREVFUF9NT05JVE9SSU5HKSB7XG4gICAgICBhcHAuZGVlcF9tb25pdG9yaW5nID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoYXBwLmF1dG9tYXRpb24gPT0gZmFsc2UpIHtcbiAgICAgIGFwcC5wbXggPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoYXBwLmRpc2FibGVfdHJhY2UpIHtcbiAgICAgIGFwcC50cmFjZSA9IGZhbHNlXG4gICAgICBkZWxldGUgYXBwLmRpc2FibGVfdHJhY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5zdGFuY2VzIHBhcmFtc1xuICAgICAqL1xuICAgIGlmIChhcHAuaW5zdGFuY2VzID09ICdtYXgnKSB7XG4gICAgICBhcHAuaW5zdGFuY2VzID0gMDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIChhcHAuaW5zdGFuY2VzKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGFwcC5pbnN0YW5jZXMgPSBwYXJzZUludChhcHAuaW5zdGFuY2VzKSB8fCAwO1xuICAgIH1cblxuICAgIGlmIChhcHAuZXhlY19tb2RlICE9ICdjbHVzdGVyX21vZGUnICYmXG4gICAgICAhYXBwLmluc3RhbmNlcyAmJlxuICAgICAgdHlwZW9mIChhcHAubWVyZ2VfbG9ncykgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGFwcC5tZXJnZV9sb2dzID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB2YXIgcmV0O1xuXG4gICAgaWYgKGFwcC5jcm9uX3Jlc3RhcnQpIHtcbiAgICAgIGlmICgocmV0ID0gQ29tbW9uLnNpbmsuZGV0ZXJtaW5lQ3JvbihhcHApKSBpbnN0YW5jZW9mIEVycm9yKVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5vdyB2YWxpZGF0aW9uIGNvbmZpZ3VyYXRpb25cbiAgICAgKi9cbiAgICB2YXIgcmV0OiBhbnkgPSBDb25maWcudmFsaWRhdGVKU09OKGFwcCk7XG4gICAgaWYgKHJldC5lcnJvcnMgJiYgcmV0LmVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgICByZXQuZXJyb3JzLmZvckVhY2goZnVuY3Rpb24gKGVycikgeyB3YXJuKGVycikgfSk7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKHJldC5lcnJvcnMpO1xuICAgIH1cblxuICAgIHZlcmlmaWVkQ29uZi5wdXNoKHJldC5jb25maWcpO1xuICB9XG5cbiAgcmV0dXJuIHZlcmlmaWVkQ29uZjtcbn1cblxuLyoqXG4gKiBHZXQgY3VycmVudCB1c2VybmFtZVxuICogQ2FsbGVkIG9uIEVWRVJZIHN0YXJ0aW5nIGFwcFxuICpcbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKi9cbkNvbW1vbi5nZXRDdXJyZW50VXNlcm5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBjdXJyZW50X3VzZXIgPSAnJztcblxuICBpZiAob3MudXNlckluZm8pIHtcbiAgICB0cnkge1xuICAgICAgY3VycmVudF91c2VyID0gb3MudXNlckluZm8oKS51c2VybmFtZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIEZvciB0aGUgY2FzZSBvZiB1bmhhbmRsZWQgZXJyb3IgZm9yIHV2X29zX2dldF9wYXNzd2RcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9Vbml0ZWNoL3BtMi9pc3N1ZXMvMzE4NFxuICAgIH1cbiAgfVxuXG4gIGlmIChjdXJyZW50X3VzZXIgPT09ICcnKSB7XG4gICAgY3VycmVudF91c2VyID0gcHJvY2Vzcy5lbnYuVVNFUiB8fCBwcm9jZXNzLmVudi5MTkFNRSB8fCBwcm9jZXNzLmVudi5VU0VSTkFNRSB8fCBwcm9jZXNzLmVudi5TVURPX1VTRVIgfHwgcHJvY2Vzcy5lbnYuQzlfVVNFUiB8fCBwcm9jZXNzLmVudi5MT0dOQU1FO1xuICB9XG5cbiAgcmV0dXJuIGN1cnJlbnRfdXNlcjtcbn1cblxuLyoqXG4gKiBSZW5kZXIgYW4gYXBwIG5hbWUgaWYgbm90IGV4aXN0aW5nLlxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZcbiAqL1xuQ29tbW9uLnJlbmRlckFwcGxpY2F0aW9uTmFtZSA9IGZ1bmN0aW9uIChjb25mKSB7XG4gIGlmICghY29uZi5uYW1lICYmIGNvbmYuc2NyaXB0KSB7XG4gICAgY29uZi5uYW1lID0gY29uZi5zY3JpcHQgIT09IHVuZGVmaW5lZCA/IHBhdGguYmFzZW5hbWUoY29uZi5zY3JpcHQpIDogJ3VuZGVmaW5lZCc7XG4gICAgdmFyIGxhc3REb3QgPSBjb25mLm5hbWUubGFzdEluZGV4T2YoJy4nKTtcbiAgICBpZiAobGFzdERvdCA+IDApIHtcbiAgICAgIGNvbmYubmFtZSA9IGNvbmYubmFtZS5zbGljZSgwLCBsYXN0RG90KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTaG93IHdhcm5pbmdzXG4gKiBAcGFyYW0ge1N0cmluZ30gd2FybmluZ1xuICovXG5mdW5jdGlvbiB3YXJuKHdhcm5pbmcpIHtcbiAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX1dBUk5JTkcgKyB3YXJuaW5nKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbW9uO1xuIl19