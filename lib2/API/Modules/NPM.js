"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _os = _interopRequireDefault(require("os"));

var _child_process = require("child_process");

var _chalk = _interopRequireDefault(require("chalk"));

var _readline = _interopRequireDefault(require("readline"));

var _which = _interopRequireDefault(require("../../tools/which"));

var _sexec = _interopRequireDefault(require("../../tools/sexec"));

var _copydirSync = _interopRequireDefault(require("../../tools/copydirSync"));

var _deleteFolderRecursive = _interopRequireDefault(require("../../tools/deleteFolderRecursive"));

var _Configuration = _interopRequireDefault(require("../../Configuration"));

var _constants = _interopRequireDefault(require("../../../constants"));

var _Common = _interopRequireDefault(require("../../Common"));

var _Utility = _interopRequireDefault(require("../../Utility"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * PM2 Module System.
 * Features:
 * - Installed modules are listed separately from user applications
 * - Always ON, a module is always up along PM2, to stop it, you need to uninstall it
 * - Install a runnable module from NPM/Github/HTTP (require a package.json only)
 * - Some modules add internal PM2 depencencies (like typescript, profiling...)
 * - Internally it uses NPM install (https://docs.npmjs.com/cli/install)
 * - Auto discover script to launch (first it checks the apps field, then bin and finally main attr)
 * - Generate sample module via pm2 module:generate <module_name>
 */
function localStart(PM2, opts, cb) {
  var proc_path = '',
      cmd = '',
      conf = {};

  _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Installing local module in DEVELOPMENT MODE with WATCH auto restart');

  proc_path = process.cwd();
  cmd = _path["default"].join(proc_path, _constants["default"].DEFAULT_MODULE_JSON);

  _Common["default"].extend(opts, {
    cmd: cmd,
    development_mode: true,
    proc_path: proc_path
  });

  return StartModule(PM2, opts, function (err, dt) {
    if (err) return cb(err);

    _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Module successfully installed and launched');

    return cb(null, dt);
  });
}

function generateSample(app_name, cb) {
  var rl = _readline["default"].createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function samplize(module_name) {
    var cmd1 = 'git clone https://github.com/pm2-hive/sample-module.git ' + module_name + '; cd ' + module_name + '; rm -rf .git';
    var cmd2 = 'cd ' + module_name + ' ; sed -i "s:sample-module:' + module_name + ':g" package.json';
    var cmd3 = 'cd ' + module_name + ' ; npm install';

    _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Getting sample app');

    (0, _sexec["default"])(cmd1, function (err) {
      if (err) _Common["default"].printError(_constants["default"].PREFIX_MSG_MOD_ERR + err.message);
      (0, _sexec["default"])(cmd2, function (err) {
        console.log('');
        (0, _sexec["default"])(cmd3, function (err) {
          console.log('');

          _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Module sample created in folder: ', _path["default"].join(process.cwd(), module_name));

          console.log('');

          _Common["default"].printOut('Start module in development mode:');

          _Common["default"].printOut('$ cd ' + module_name + '/');

          _Common["default"].printOut('$ pm2 install . ');

          console.log('');

          _Common["default"].printOut('Module Log: ');

          _Common["default"].printOut('$ pm2 logs ' + module_name);

          console.log('');

          _Common["default"].printOut('Uninstall module: ');

          _Common["default"].printOut('$ pm2 uninstall ' + module_name);

          console.log('');

          _Common["default"].printOut('Force restart: ');

          _Common["default"].printOut('$ pm2 restart ' + module_name);

          return cb ? cb() : false;
        });
      });
    });
  }

  if (app_name) return samplize(app_name);
  rl.question(_constants["default"].PREFIX_MSG_MOD + "Module name: ", function (module_name) {
    samplize(module_name);
  });
}

function publish(opts, cb) {
  var rl = _readline["default"].createInterface({
    input: process.stdin,
    output: process.stdout
  });

  var semver = require('semver');

  var package_file = _path["default"].join(process.cwd(), 'package.json');

  var package_json = require(package_file);

  package_json.version = semver.inc(package_json.version, 'minor');

  _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Incrementing module to: %s@%s', package_json.name, package_json.version);

  rl.question("Write & Publish? [Y/N]", function (answer) {
    if (answer != "Y") return cb();

    _fs["default"].writeFile(package_file, JSON.stringify(package_json, null, 2), function () {
      // if (err) return cb(err);
      _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Publishing module - %s@%s', package_json.name, package_json.version);

      (0, _sexec["default"])('npm publish', function (code) {
        _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Module - %s@%s successfully published', package_json.name, package_json.version);

        _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Pushing module on Git');

        (0, _sexec["default"])('git add . ; git commit -m "' + package_json.version + '"; git push origin master', function (code) {
          _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Installable with pm2 install %s', package_json.name);

          return cb(null, package_json);
        });
      });
    });
  });
}

function moduleExistInLocalDB(CLI, module_name, cb) {
  var modules = _Configuration["default"].getSync(_constants["default"].MODULE_CONF_PREFIX);

  if (!modules) return cb(false);

  var module_name_only = _Utility["default"].getCanonicModuleName(module_name);

  modules = Object.keys(modules);
  return cb(modules.indexOf(module_name_only) > -1 ? true : false);
}

;

function install(CLI, module_name, opts, cb) {
  moduleExistInLocalDB(CLI, module_name, function (exists) {
    if (exists) {
      _Common["default"].logMod('Module already installed. Updating.');

      Rollback.backup(module_name);
      return uninstall(CLI, module_name, function () {
        return continueInstall(CLI, module_name, opts, cb);
      });
    }

    return continueInstall(CLI, module_name, opts, cb);
  });
} // Builtin Node Switch


function getNPMCommandLine(module_name, install_path) {
  if ((0, _which["default"])('npm')) {
    return _child_process.spawn.bind(this, _constants["default"].IS_WINDOWS ? 'npm.cmd' : 'npm', ['install', module_name, '--loglevel=error', '--prefix', "\"".concat(install_path, "\"")], {
      stdio: 'inherit',
      env: process.env,
      shell: true
    });
  } else {
    return _child_process.spawn.bind(this, _constants["default"].BUILTIN_NODE_PATH, [_constants["default"].BUILTIN_NPM_PATH, 'install', module_name, '--loglevel=error', '--prefix', "\"".concat(install_path, "\"")], {
      stdio: 'inherit',
      env: process.env,
      shell: true
    });
  }
}

function continueInstall(CLI, module_name, opts, cb) {
  _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Calling ' + _chalk["default"].bold.red('[NPM]') + ' to install ' + module_name + ' ...');

  var canonic_module_name = _Utility["default"].getCanonicModuleName(module_name);

  var install_path = _path["default"].join(_constants["default"].DEFAULT_MODULE_PATH, canonic_module_name);

  require('mkdirp')(install_path).then(function () {
    process.chdir(_os["default"].homedir());
    var install_instance = getNPMCommandLine(module_name, install_path)();
    install_instance.on('close', finalizeInstall);
    install_instance.on('error', function (err) {
      console.error(err.stack || err);
    });
  });

  function finalizeInstall(code) {
    if (code != 0) {
      // If install has failed, revert to previous module version
      return Rollback.revert(CLI, module_name, function () {
        return cb(new Error('Installation failed via NPM, module has been restored to prev version'));
      });
    }

    _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Module downloaded');

    var proc_path = _path["default"].join(install_path, 'node_modules', canonic_module_name);

    var package_json_path = _path["default"].join(proc_path, 'package.json'); // Append default configuration to module configuration


    try {
      var conf = JSON.parse(_fs["default"].readFileSync(package_json_path).toString()).config;

      if (conf) {
        Object.keys(conf).forEach(function (key) {
          _Configuration["default"].setSyncIfNotExist(canonic_module_name + ':' + key, conf[key]);
        });
      }
    } catch (e) {
      _Common["default"].printError(e);
    }

    opts = _Common["default"].extend(opts, {
      cmd: package_json_path,
      development_mode: false,
      proc_path: proc_path
    });

    _Configuration["default"].set(_constants["default"].MODULE_CONF_PREFIX + ':' + canonic_module_name, {
      uid: opts.uid,
      gid: opts.gid
    }, function (err, data) {
      if (err) return cb(err);
      StartModule(CLI, opts, function (err, dt) {
        if (err) return cb(err);
        if (process.env.PM2_PROGRAMMATIC === 'true') return cb(null, dt);
        CLI.conf(canonic_module_name, function () {
          _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Module successfully installed and launched');

          _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Checkout module options: `$ pm2 conf`');

          return cb(null, dt);
        });
      });
    });
  }
}

function start(PM2, modules, module_name, cb) {
  _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Starting NPM module ' + module_name);

  var install_path = _path["default"].join(_constants["default"].DEFAULT_MODULE_PATH, module_name);

  var proc_path = _path["default"].join(install_path, 'node_modules', module_name);

  var package_json_path = _path["default"].join(proc_path, 'package.json');

  var opts = {}; // Merge with embedded configuration inside module_conf (uid, gid)

  _Common["default"].extend(opts, modules[module_name]); // Merge meta data to start module properly


  _Common["default"].extend(opts, {
    // package.json path
    cmd: package_json_path,
    // starting mode
    development_mode: false,
    // process cwd
    proc_path: proc_path
  });

  StartModule(PM2, opts, function (err, dt) {
    if (err) console.error(err);
    return cb();
  });
}

function uninstall(CLI, module_name, cb) {
  var module_name_only = _Utility["default"].getCanonicModuleName(module_name);

  var proc_path = _path["default"].join(_constants["default"].DEFAULT_MODULE_PATH, module_name_only);

  _Configuration["default"].unsetSync(_constants["default"].MODULE_CONF_PREFIX + ':' + module_name_only);

  CLI.deleteModule(module_name_only, function (err, data) {
    console.log('Deleting', proc_path);

    if (module_name != '.' && proc_path.includes('modules') === true) {
      (0, _deleteFolderRecursive["default"])(proc_path);
    }

    if (err) {
      _Common["default"].printError(err);

      return cb(err);
    }

    return cb(null, data);
  });
}

function getModuleConf(app_name) {
  if (!app_name) throw new Error('No app_name defined');

  var module_conf = _Configuration["default"].getAllSync();

  var additional_env = {};

  if (!module_conf[app_name]) {
    additional_env = {};
    additional_env[app_name] = {};
  } else {
    additional_env = _Common["default"].clone(module_conf[app_name]);
    additional_env[app_name] = JSON.stringify(module_conf[app_name]);
  }

  return additional_env;
}

function StartModule(CLI, opts, cb) {
  if (!opts.cmd && !opts["package"]) throw new Error('module package.json not defined');
  if (!opts.development_mode) opts.development_mode = false;

  var package_json = require(opts.cmd || opts["package"]);
  /**
   * Script file detection
   * 1- *apps* field (default pm2 json configuration)
   * 2- *bin* field
   * 3- *main* field
   */


  if (!package_json.apps && !package_json.pm2) {
    package_json.apps = {};

    if (package_json.bin) {
      var bin = Object.keys(package_json.bin)[0];
      package_json.apps.script = package_json.bin[bin];
    } else if (package_json.main) {
      package_json.apps.script = package_json.main;
    }
  }

  _Common["default"].extend(opts, {
    cwd: opts.proc_path,
    watch: opts.development_mode,
    force_name: package_json.name,
    started_as_module: true
  }); // Start the module


  CLI.start(package_json, opts, function (err, data) {
    if (err) return cb(err);

    if (opts.safe) {
      _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Monitoring module behavior for potential issue (5secs...)');

      var time = typeof opts.safe == 'boolean' ? 3000 : parseInt(opts.safe);
      return setTimeout(function () {
        CLI.describe(package_json.name, function (err, apps) {
          if (err || apps[0].pm2_env.restart_time > 2) {
            return Rollback.revert(CLI, package_json.name, function () {
              return cb(new Error('New Module is instable, restored to previous version'));
            });
          }

          return cb(null, data);
        });
      }, time);
    }

    return cb(null, data);
  });
}

;
var Rollback = {
  revert: function revert(CLI, module_name, cb) {
    var canonic_module_name = _Utility["default"].getCanonicModuleName(module_name);

    var backup_path = _path["default"].join(require('os').tmpdir(), canonic_module_name);

    var module_path = _path["default"].join(_constants["default"].DEFAULT_MODULE_PATH, canonic_module_name);

    try {
      _fs["default"].statSync(backup_path);
    } catch (e) {
      return cb(new Error('no backup found'));
    }

    _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + _chalk["default"].bold.red('[[[[[ Module installation failure! ]]]]]'));

    _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + _chalk["default"].bold.red('[RESTORING TO PREVIOUS VERSION]'));

    CLI.deleteModule(canonic_module_name, function () {
      // Delete failing module
      if (module_name.includes('modules') === true) (0, _deleteFolderRecursive["default"])(module_path); // Restore working version

      (0, _copydirSync["default"])(backup_path, _path["default"].join(_constants["default"].DEFAULT_MODULE_PATH, canonic_module_name));

      var proc_path = _path["default"].join(module_path, 'node_modules', canonic_module_name);

      var package_json_path = _path["default"].join(proc_path, 'package.json'); // Start module


      StartModule(CLI, {
        cmd: package_json_path,
        development_mode: false,
        proc_path: proc_path
      }, cb);
    });
  },
  backup: function backup(module_name) {
    // Backup current module
    var tmpdir = require('os').tmpdir();

    var canonic_module_name = _Utility["default"].getCanonicModuleName(module_name);

    var module_path = _path["default"].join(_constants["default"].DEFAULT_MODULE_PATH, canonic_module_name);

    (0, _copydirSync["default"])(module_path, _path["default"].join(tmpdir, canonic_module_name));
  }
};
var _default = {
  install: install,
  uninstall: uninstall,
  start: start,
  publish: publish,
  generateSample: generateSample,
  localStart: localStart,
  getModuleConf: getModuleConf
};
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvTW9kdWxlcy9OUE0udHMiXSwibmFtZXMiOlsibG9jYWxTdGFydCIsIlBNMiIsIm9wdHMiLCJjYiIsInByb2NfcGF0aCIsImNtZCIsImNvbmYiLCJDb21tb24iLCJwcmludE91dCIsImNzdCIsIlBSRUZJWF9NU0dfTU9EIiwicHJvY2VzcyIsImN3ZCIsInBhdGgiLCJqb2luIiwiREVGQVVMVF9NT0RVTEVfSlNPTiIsImV4dGVuZCIsImRldmVsb3BtZW50X21vZGUiLCJTdGFydE1vZHVsZSIsImVyciIsImR0IiwiZ2VuZXJhdGVTYW1wbGUiLCJhcHBfbmFtZSIsInJsIiwicmVhZGxpbmUiLCJjcmVhdGVJbnRlcmZhY2UiLCJpbnB1dCIsInN0ZGluIiwib3V0cHV0Iiwic3Rkb3V0Iiwic2FtcGxpemUiLCJtb2R1bGVfbmFtZSIsImNtZDEiLCJjbWQyIiwiY21kMyIsInByaW50RXJyb3IiLCJQUkVGSVhfTVNHX01PRF9FUlIiLCJtZXNzYWdlIiwiY29uc29sZSIsImxvZyIsInF1ZXN0aW9uIiwicHVibGlzaCIsInNlbXZlciIsInJlcXVpcmUiLCJwYWNrYWdlX2ZpbGUiLCJwYWNrYWdlX2pzb24iLCJ2ZXJzaW9uIiwiaW5jIiwibmFtZSIsImFuc3dlciIsImZzIiwid3JpdGVGaWxlIiwiSlNPTiIsInN0cmluZ2lmeSIsImNvZGUiLCJtb2R1bGVFeGlzdEluTG9jYWxEQiIsIkNMSSIsIm1vZHVsZXMiLCJDb25maWd1cmF0aW9uIiwiZ2V0U3luYyIsIk1PRFVMRV9DT05GX1BSRUZJWCIsIm1vZHVsZV9uYW1lX29ubHkiLCJVdGlsaXR5IiwiZ2V0Q2Fub25pY01vZHVsZU5hbWUiLCJPYmplY3QiLCJrZXlzIiwiaW5kZXhPZiIsImluc3RhbGwiLCJleGlzdHMiLCJsb2dNb2QiLCJSb2xsYmFjayIsImJhY2t1cCIsInVuaW5zdGFsbCIsImNvbnRpbnVlSW5zdGFsbCIsImdldE5QTUNvbW1hbmRMaW5lIiwiaW5zdGFsbF9wYXRoIiwic3Bhd24iLCJiaW5kIiwiSVNfV0lORE9XUyIsInN0ZGlvIiwiZW52Iiwic2hlbGwiLCJCVUlMVElOX05PREVfUEFUSCIsIkJVSUxUSU5fTlBNX1BBVEgiLCJjaGFsayIsImJvbGQiLCJyZWQiLCJjYW5vbmljX21vZHVsZV9uYW1lIiwiREVGQVVMVF9NT0RVTEVfUEFUSCIsInRoZW4iLCJjaGRpciIsIm9zIiwiaG9tZWRpciIsImluc3RhbGxfaW5zdGFuY2UiLCJvbiIsImZpbmFsaXplSW5zdGFsbCIsImVycm9yIiwic3RhY2siLCJyZXZlcnQiLCJFcnJvciIsInBhY2thZ2VfanNvbl9wYXRoIiwicGFyc2UiLCJyZWFkRmlsZVN5bmMiLCJ0b1N0cmluZyIsImNvbmZpZyIsImZvckVhY2giLCJrZXkiLCJzZXRTeW5jSWZOb3RFeGlzdCIsImUiLCJzZXQiLCJ1aWQiLCJnaWQiLCJkYXRhIiwiUE0yX1BST0dSQU1NQVRJQyIsInN0YXJ0IiwidW5zZXRTeW5jIiwiZGVsZXRlTW9kdWxlIiwiaW5jbHVkZXMiLCJnZXRNb2R1bGVDb25mIiwibW9kdWxlX2NvbmYiLCJnZXRBbGxTeW5jIiwiYWRkaXRpb25hbF9lbnYiLCJjbG9uZSIsImFwcHMiLCJwbTIiLCJiaW4iLCJzY3JpcHQiLCJtYWluIiwid2F0Y2giLCJmb3JjZV9uYW1lIiwic3RhcnRlZF9hc19tb2R1bGUiLCJzYWZlIiwidGltZSIsInBhcnNlSW50Iiwic2V0VGltZW91dCIsImRlc2NyaWJlIiwicG0yX2VudiIsInJlc3RhcnRfdGltZSIsImJhY2t1cF9wYXRoIiwidG1wZGlyIiwibW9kdWxlX3BhdGgiLCJzdGF0U3luYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBRUE7Ozs7Ozs7Ozs7O0FBWUEsU0FBU0EsVUFBVCxDQUFvQkMsR0FBcEIsRUFBeUJDLElBQXpCLEVBQStCQyxFQUEvQixFQUFtQztBQUNq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VixFQUF1QjtBQUM3QjtBQUNBLFFBQUk0RyxNQUFNLEdBQUdoRyxPQUFPLENBQUMsSUFBRCxDQUFQLENBQWNnRyxNQUFkLEVBQWI7O0FBQ0EsUUFBSXBELG1CQUFtQixHQUFHekIsb0JBQVFDLG9CQUFSLENBQTZCaEMsV0FBN0IsQ0FBMUI7O0FBQ0EsUUFBSTZHLFdBQVcsR0FBRy9ILGlCQUFLQyxJQUFMLENBQVVMLHNCQUFJK0UsbUJBQWQsRUFBbUNELG1CQUFuQyxDQUFsQjs7QUFDQSxpQ0FBWXFELFdBQVosRUFBeUIvSCxpQkFBS0MsSUFBTCxDQUFVNkgsTUFBVixFQUFrQnBELG1CQUFsQixDQUF6QjtBQUNEO0FBeENZLENBQWY7ZUEyQ2U7QUFDYnBCLEVBQUFBLE9BQU8sRUFBUEEsT0FEYTtBQUViSyxFQUFBQSxTQUFTLEVBQVRBLFNBRmE7QUFHYjBDLEVBQUFBLEtBQUssRUFBTEEsS0FIYTtBQUliekUsRUFBQUEsT0FBTyxFQUFQQSxPQUphO0FBS2JwQixFQUFBQSxjQUFjLEVBQWRBLGNBTGE7QUFNYnJCLEVBQUFBLFVBQVUsRUFBVkEsVUFOYTtBQU9ic0gsRUFBQUEsYUFBYSxFQUFiQTtBQVBhLEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IG9zIGZyb20gJ29zJztcclxuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcclxuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcclxuXHJcbmltcG9ydCByZWFkbGluZSBmcm9tICdyZWFkbGluZSdcclxuaW1wb3J0IHdoaWNoIGZyb20gJy4uLy4uL3Rvb2xzL3doaWNoJ1xyXG5pbXBvcnQgc2V4ZWMgZnJvbSAnLi4vLi4vdG9vbHMvc2V4ZWMnXHJcbmltcG9ydCBjb3B5ZGlyU3luYyBmcm9tICcuLi8uLi90b29scy9jb3B5ZGlyU3luYydcclxuaW1wb3J0IGRlbGV0ZUZvbGRlclJlY3Vyc2l2ZSBmcm9tICcuLi8uLi90b29scy9kZWxldGVGb2xkZXJSZWN1cnNpdmUnXHJcblxyXG5pbXBvcnQgQ29uZmlndXJhdGlvbiBmcm9tICcuLi8uLi9Db25maWd1cmF0aW9uJztcclxuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi8uLi9jb25zdGFudHMnO1xyXG5pbXBvcnQgQ29tbW9uIGZyb20gJy4uLy4uL0NvbW1vbic7XHJcbmltcG9ydCBVdGlsaXR5IGZyb20gJy4uLy4uL1V0aWxpdHknO1xyXG5cclxuLyoqXHJcbiAqIFBNMiBNb2R1bGUgU3lzdGVtLlxyXG4gKiBGZWF0dXJlczpcclxuICogLSBJbnN0YWxsZWQgbW9kdWxlcyBhcmUgbGlzdGVkIHNlcGFyYXRlbHkgZnJvbSB1c2VyIGFwcGxpY2F0aW9uc1xyXG4gKiAtIEFsd2F5cyBPTiwgYSBtb2R1bGUgaXMgYWx3YXlzIHVwIGFsb25nIFBNMiwgdG8gc3RvcCBpdCwgeW91IG5lZWQgdG8gdW5pbnN0YWxsIGl0XHJcbiAqIC0gSW5zdGFsbCBhIHJ1bm5hYmxlIG1vZHVsZSBmcm9tIE5QTS9HaXRodWIvSFRUUCAocmVxdWlyZSBhIHBhY2thZ2UuanNvbiBvbmx5KVxyXG4gKiAtIFNvbWUgbW9kdWxlcyBhZGQgaW50ZXJuYWwgUE0yIGRlcGVuY2VuY2llcyAobGlrZSB0eXBlc2NyaXB0LCBwcm9maWxpbmcuLi4pXHJcbiAqIC0gSW50ZXJuYWxseSBpdCB1c2VzIE5QTSBpbnN0YWxsIChodHRwczovL2RvY3MubnBtanMuY29tL2NsaS9pbnN0YWxsKVxyXG4gKiAtIEF1dG8gZGlzY292ZXIgc2NyaXB0IHRvIGxhdW5jaCAoZmlyc3QgaXQgY2hlY2tzIHRoZSBhcHBzIGZpZWxkLCB0aGVuIGJpbiBhbmQgZmluYWxseSBtYWluIGF0dHIpXHJcbiAqIC0gR2VuZXJhdGUgc2FtcGxlIG1vZHVsZSB2aWEgcG0yIG1vZHVsZTpnZW5lcmF0ZSA8bW9kdWxlX25hbWU+XHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gbG9jYWxTdGFydChQTTIsIG9wdHMsIGNiKSB7XHJcbiAgdmFyIHByb2NfcGF0aCA9ICcnLFxyXG4gICAgY21kID0gJycsXHJcbiAgICBjb25mID0ge307XHJcblxyXG4gIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnSW5zdGFsbGluZyBsb2NhbCBtb2R1bGUgaW4gREVWRUxPUE1FTlQgTU9ERSB3aXRoIFdBVENIIGF1dG8gcmVzdGFydCcpO1xyXG4gIHByb2NfcGF0aCA9IHByb2Nlc3MuY3dkKCk7XHJcblxyXG4gIGNtZCA9IHBhdGguam9pbihwcm9jX3BhdGgsIGNzdC5ERUZBVUxUX01PRFVMRV9KU09OKTtcclxuXHJcbiAgQ29tbW9uLmV4dGVuZChvcHRzLCB7XHJcbiAgICBjbWQ6IGNtZCxcclxuICAgIGRldmVsb3BtZW50X21vZGU6IHRydWUsXHJcbiAgICBwcm9jX3BhdGg6IHByb2NfcGF0aFxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gU3RhcnRNb2R1bGUoUE0yLCBvcHRzLCBmdW5jdGlvbiAoZXJyLCBkdCkge1xyXG4gICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XHJcbiAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0dfTU9EICsgJ01vZHVsZSBzdWNjZXNzZnVsbHkgaW5zdGFsbGVkIGFuZCBsYXVuY2hlZCcpO1xyXG4gICAgcmV0dXJuIGNiKG51bGwsIGR0KTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVTYW1wbGUoYXBwX25hbWUsIGNiKSB7XHJcbiAgdmFyIHJsID0gcmVhZGxpbmUuY3JlYXRlSW50ZXJmYWNlKHtcclxuICAgIGlucHV0OiBwcm9jZXNzLnN0ZGluLFxyXG4gICAgb3V0cHV0OiBwcm9jZXNzLnN0ZG91dFxyXG4gIH0pO1xyXG5cclxuICBmdW5jdGlvbiBzYW1wbGl6ZShtb2R1bGVfbmFtZSkge1xyXG4gICAgdmFyIGNtZDEgPSAnZ2l0IGNsb25lIGh0dHBzOi8vZ2l0aHViLmNvbS9wbTItaGl2ZS9zYW1wbGUtbW9kdWxlLmdpdCAnICsgbW9kdWxlX25hbWUgKyAnOyBjZCAnICsgbW9kdWxlX25hbWUgKyAnOyBybSAtcmYgLmdpdCc7XHJcbiAgICB2YXIgY21kMiA9ICdjZCAnICsgbW9kdWxlX25hbWUgKyAnIDsgc2VkIC1pIFwiczpzYW1wbGUtbW9kdWxlOicgKyBtb2R1bGVfbmFtZSArICc6Z1wiIHBhY2thZ2UuanNvbic7XHJcbiAgICB2YXIgY21kMyA9ICdjZCAnICsgbW9kdWxlX25hbWUgKyAnIDsgbnBtIGluc3RhbGwnO1xyXG5cclxuICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnR2V0dGluZyBzYW1wbGUgYXBwJyk7XHJcblxyXG4gICAgc2V4ZWMoY21kMSwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICBpZiAoZXJyKSBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19NT0RfRVJSICsgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICBzZXhlYyhjbWQyLCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJycpO1xyXG4gICAgICAgIHNleGVjKGNtZDMsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCcnKTtcclxuICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnTW9kdWxlIHNhbXBsZSBjcmVhdGVkIGluIGZvbGRlcjogJywgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIG1vZHVsZV9uYW1lKSk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XHJcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoJ1N0YXJ0IG1vZHVsZSBpbiBkZXZlbG9wbWVudCBtb2RlOicpO1xyXG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KCckIGNkICcgKyBtb2R1bGVfbmFtZSArICcvJyk7XHJcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoJyQgcG0yIGluc3RhbGwgLiAnKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCcnKTtcclxuXHJcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoJ01vZHVsZSBMb2c6ICcpO1xyXG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KCckIHBtMiBsb2dzICcgKyBtb2R1bGVfbmFtZSk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XHJcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoJ1VuaW5zdGFsbCBtb2R1bGU6ICcpO1xyXG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KCckIHBtMiB1bmluc3RhbGwgJyArIG1vZHVsZV9uYW1lKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCcnKTtcclxuICAgICAgICAgIENvbW1vbi5wcmludE91dCgnRm9yY2UgcmVzdGFydDogJyk7XHJcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoJyQgcG0yIHJlc3RhcnQgJyArIG1vZHVsZV9uYW1lKTtcclxuICAgICAgICAgIHJldHVybiBjYiA/IGNiKCkgOiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGlmIChhcHBfbmFtZSkgcmV0dXJuIHNhbXBsaXplKGFwcF9uYW1lKTtcclxuXHJcbiAgcmwucXVlc3Rpb24oY3N0LlBSRUZJWF9NU0dfTU9EICsgXCJNb2R1bGUgbmFtZTogXCIsIGZ1bmN0aW9uIChtb2R1bGVfbmFtZSkge1xyXG4gICAgc2FtcGxpemUobW9kdWxlX25hbWUpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwdWJsaXNoKG9wdHMsIGNiKSB7XHJcbiAgdmFyIHJsID0gcmVhZGxpbmUuY3JlYXRlSW50ZXJmYWNlKHtcclxuICAgIGlucHV0OiBwcm9jZXNzLnN0ZGluLFxyXG4gICAgb3V0cHV0OiBwcm9jZXNzLnN0ZG91dFxyXG4gIH0pO1xyXG5cclxuICB2YXIgc2VtdmVyID0gcmVxdWlyZSgnc2VtdmVyJyk7XHJcblxyXG4gIHZhciBwYWNrYWdlX2ZpbGUgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3BhY2thZ2UuanNvbicpO1xyXG5cclxuICB2YXIgcGFja2FnZV9qc29uID0gcmVxdWlyZShwYWNrYWdlX2ZpbGUpO1xyXG5cclxuICBwYWNrYWdlX2pzb24udmVyc2lvbiA9IHNlbXZlci5pbmMocGFja2FnZV9qc29uLnZlcnNpb24sICdtaW5vcicpO1xyXG4gIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnSW5jcmVtZW50aW5nIG1vZHVsZSB0bzogJXNAJXMnLFxyXG4gICAgcGFja2FnZV9qc29uLm5hbWUsXHJcbiAgICBwYWNrYWdlX2pzb24udmVyc2lvbik7XHJcblxyXG5cclxuICBybC5xdWVzdGlvbihcIldyaXRlICYgUHVibGlzaD8gW1kvTl1cIiwgZnVuY3Rpb24gKGFuc3dlcikge1xyXG4gICAgaWYgKGFuc3dlciAhPSBcIllcIilcclxuICAgICAgcmV0dXJuIGNiKCk7XHJcblxyXG5cclxuICAgIGZzLndyaXRlRmlsZShwYWNrYWdlX2ZpbGUsIEpTT04uc3RyaW5naWZ5KHBhY2thZ2VfanNvbiwgbnVsbCwgMiksIGZ1bmN0aW9uICgpIHtcclxuICAgICAgLy8gaWYgKGVycikgcmV0dXJuIGNiKGVycik7XHJcblxyXG4gICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0dfTU9EICsgJ1B1Ymxpc2hpbmcgbW9kdWxlIC0gJXNAJXMnLFxyXG4gICAgICAgIHBhY2thZ2VfanNvbi5uYW1lLFxyXG4gICAgICAgIHBhY2thZ2VfanNvbi52ZXJzaW9uKTtcclxuXHJcbiAgICAgIHNleGVjKCducG0gcHVibGlzaCcsIGZ1bmN0aW9uIChjb2RlKSB7XHJcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX01PRCArICdNb2R1bGUgLSAlc0AlcyBzdWNjZXNzZnVsbHkgcHVibGlzaGVkJyxcclxuICAgICAgICAgIHBhY2thZ2VfanNvbi5uYW1lLFxyXG4gICAgICAgICAgcGFja2FnZV9qc29uLnZlcnNpb24pO1xyXG5cclxuICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0dfTU9EICsgJ1B1c2hpbmcgbW9kdWxlIG9uIEdpdCcpO1xyXG4gICAgICAgIHNleGVjKCdnaXQgYWRkIC4gOyBnaXQgY29tbWl0IC1tIFwiJyArIHBhY2thZ2VfanNvbi52ZXJzaW9uICsgJ1wiOyBnaXQgcHVzaCBvcmlnaW4gbWFzdGVyJywgZnVuY3Rpb24gKGNvZGUpIHtcclxuXHJcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0dfTU9EICsgJ0luc3RhbGxhYmxlIHdpdGggcG0yIGluc3RhbGwgJXMnLCBwYWNrYWdlX2pzb24ubmFtZSk7XHJcbiAgICAgICAgICByZXR1cm4gY2IobnVsbCwgcGFja2FnZV9qc29uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vZHVsZUV4aXN0SW5Mb2NhbERCKENMSSwgbW9kdWxlX25hbWUsIGNiKSB7XHJcbiAgdmFyIG1vZHVsZXMgPSBDb25maWd1cmF0aW9uLmdldFN5bmMoY3N0Lk1PRFVMRV9DT05GX1BSRUZJWCk7XHJcbiAgaWYgKCFtb2R1bGVzKSByZXR1cm4gY2IoZmFsc2UpO1xyXG4gIHZhciBtb2R1bGVfbmFtZV9vbmx5ID0gVXRpbGl0eS5nZXRDYW5vbmljTW9kdWxlTmFtZShtb2R1bGVfbmFtZSlcclxuICBtb2R1bGVzID0gT2JqZWN0LmtleXMobW9kdWxlcyk7XHJcbiAgcmV0dXJuIGNiKG1vZHVsZXMuaW5kZXhPZihtb2R1bGVfbmFtZV9vbmx5KSA+IC0xID8gdHJ1ZSA6IGZhbHNlKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGluc3RhbGwoQ0xJLCBtb2R1bGVfbmFtZSwgb3B0cywgY2IpIHtcclxuICBtb2R1bGVFeGlzdEluTG9jYWxEQihDTEksIG1vZHVsZV9uYW1lLCBmdW5jdGlvbiAoZXhpc3RzKSB7XHJcbiAgICBpZiAoZXhpc3RzKSB7XHJcbiAgICAgIENvbW1vbi5sb2dNb2QoJ01vZHVsZSBhbHJlYWR5IGluc3RhbGxlZC4gVXBkYXRpbmcuJyk7XHJcblxyXG4gICAgICBSb2xsYmFjay5iYWNrdXAobW9kdWxlX25hbWUpO1xyXG5cclxuICAgICAgcmV0dXJuIHVuaW5zdGFsbChDTEksIG1vZHVsZV9uYW1lLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGNvbnRpbnVlSW5zdGFsbChDTEksIG1vZHVsZV9uYW1lLCBvcHRzLCBjYik7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNvbnRpbnVlSW5zdGFsbChDTEksIG1vZHVsZV9uYW1lLCBvcHRzLCBjYik7XHJcbiAgfSlcclxufVxyXG5cclxuLy8gQnVpbHRpbiBOb2RlIFN3aXRjaFxyXG5mdW5jdGlvbiBnZXROUE1Db21tYW5kTGluZShtb2R1bGVfbmFtZSwgaW5zdGFsbF9wYXRoKSB7XHJcbiAgaWYgKHdoaWNoKCducG0nKSkge1xyXG4gICAgcmV0dXJuIHNwYXduLmJpbmQodGhpcywgY3N0LklTX1dJTkRPV1MgPyAnbnBtLmNtZCcgOiAnbnBtJywgWydpbnN0YWxsJywgbW9kdWxlX25hbWUsICctLWxvZ2xldmVsPWVycm9yJywgJy0tcHJlZml4JywgYFwiJHtpbnN0YWxsX3BhdGh9XCJgXSwge1xyXG4gICAgICBzdGRpbzogJ2luaGVyaXQnLFxyXG4gICAgICBlbnY6IHByb2Nlc3MuZW52LFxyXG4gICAgICBzaGVsbDogdHJ1ZVxyXG4gICAgfSlcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICByZXR1cm4gc3Bhd24uYmluZCh0aGlzLCBjc3QuQlVJTFRJTl9OT0RFX1BBVEgsIFtjc3QuQlVJTFRJTl9OUE1fUEFUSCwgJ2luc3RhbGwnLCBtb2R1bGVfbmFtZSwgJy0tbG9nbGV2ZWw9ZXJyb3InLCAnLS1wcmVmaXgnLCBgXCIke2luc3RhbGxfcGF0aH1cImBdLCB7XHJcbiAgICAgIHN0ZGlvOiAnaW5oZXJpdCcsXHJcbiAgICAgIGVudjogcHJvY2Vzcy5lbnYsXHJcbiAgICAgIHNoZWxsOiB0cnVlXHJcbiAgICB9KVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY29udGludWVJbnN0YWxsKENMSSwgbW9kdWxlX25hbWUsIG9wdHMsIGNiKSB7XHJcbiAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX01PRCArICdDYWxsaW5nICcgKyBjaGFsay5ib2xkLnJlZCgnW05QTV0nKSArICcgdG8gaW5zdGFsbCAnICsgbW9kdWxlX25hbWUgKyAnIC4uLicpO1xyXG5cclxuICB2YXIgY2Fub25pY19tb2R1bGVfbmFtZSA9IFV0aWxpdHkuZ2V0Q2Fub25pY01vZHVsZU5hbWUobW9kdWxlX25hbWUpO1xyXG4gIHZhciBpbnN0YWxsX3BhdGggPSBwYXRoLmpvaW4oY3N0LkRFRkFVTFRfTU9EVUxFX1BBVEgsIGNhbm9uaWNfbW9kdWxlX25hbWUpO1xyXG5cclxuICByZXF1aXJlKCdta2RpcnAnKShpbnN0YWxsX3BhdGgpXHJcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHByb2Nlc3MuY2hkaXIob3MuaG9tZWRpcigpKTtcclxuXHJcbiAgICAgIHZhciBpbnN0YWxsX2luc3RhbmNlID0gZ2V0TlBNQ29tbWFuZExpbmUobW9kdWxlX25hbWUsIGluc3RhbGxfcGF0aCkoKTtcclxuXHJcbiAgICAgIGluc3RhbGxfaW5zdGFuY2Uub24oJ2Nsb3NlJywgZmluYWxpemVJbnN0YWxsKTtcclxuXHJcbiAgICAgIGluc3RhbGxfaW5zdGFuY2Uub24oJ2Vycm9yJywgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrIHx8IGVycik7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gIGZ1bmN0aW9uIGZpbmFsaXplSW5zdGFsbChjb2RlKSB7XHJcbiAgICBpZiAoY29kZSAhPSAwKSB7XHJcbiAgICAgIC8vIElmIGluc3RhbGwgaGFzIGZhaWxlZCwgcmV2ZXJ0IHRvIHByZXZpb3VzIG1vZHVsZSB2ZXJzaW9uXHJcbiAgICAgIHJldHVybiBSb2xsYmFjay5yZXZlcnQoQ0xJLCBtb2R1bGVfbmFtZSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoJ0luc3RhbGxhdGlvbiBmYWlsZWQgdmlhIE5QTSwgbW9kdWxlIGhhcyBiZWVuIHJlc3RvcmVkIHRvIHByZXYgdmVyc2lvbicpKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX01PRCArICdNb2R1bGUgZG93bmxvYWRlZCcpO1xyXG5cclxuICAgIHZhciBwcm9jX3BhdGggPSBwYXRoLmpvaW4oaW5zdGFsbF9wYXRoLCAnbm9kZV9tb2R1bGVzJywgY2Fub25pY19tb2R1bGVfbmFtZSk7XHJcbiAgICB2YXIgcGFja2FnZV9qc29uX3BhdGggPSBwYXRoLmpvaW4ocHJvY19wYXRoLCAncGFja2FnZS5qc29uJyk7XHJcblxyXG4gICAgLy8gQXBwZW5kIGRlZmF1bHQgY29uZmlndXJhdGlvbiB0byBtb2R1bGUgY29uZmlndXJhdGlvblxyXG4gICAgdHJ5IHtcclxuICAgICAgdmFyIGNvbmYgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYWNrYWdlX2pzb25fcGF0aCkudG9TdHJpbmcoKSkuY29uZmlnO1xyXG5cclxuICAgICAgaWYgKGNvbmYpIHtcclxuICAgICAgICBPYmplY3Qua2V5cyhjb25mKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgIENvbmZpZ3VyYXRpb24uc2V0U3luY0lmTm90RXhpc3QoY2Fub25pY19tb2R1bGVfbmFtZSArICc6JyArIGtleSwgY29uZltrZXldKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBDb21tb24ucHJpbnRFcnJvcihlKTtcclxuICAgIH1cclxuXHJcbiAgICBvcHRzID0gQ29tbW9uLmV4dGVuZChvcHRzLCB7XHJcbiAgICAgIGNtZDogcGFja2FnZV9qc29uX3BhdGgsXHJcbiAgICAgIGRldmVsb3BtZW50X21vZGU6IGZhbHNlLFxyXG4gICAgICBwcm9jX3BhdGg6IHByb2NfcGF0aFxyXG4gICAgfSk7XHJcblxyXG4gICAgQ29uZmlndXJhdGlvbi5zZXQoY3N0Lk1PRFVMRV9DT05GX1BSRUZJWCArICc6JyArIGNhbm9uaWNfbW9kdWxlX25hbWUsIHtcclxuICAgICAgdWlkOiBvcHRzLnVpZCxcclxuICAgICAgZ2lkOiBvcHRzLmdpZFxyXG4gICAgfSwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xyXG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcclxuXHJcbiAgICAgIFN0YXJ0TW9kdWxlKENMSSwgb3B0cywgZnVuY3Rpb24gKGVyciwgZHQpIHtcclxuICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcclxuXHJcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52LlBNMl9QUk9HUkFNTUFUSUMgPT09ICd0cnVlJylcclxuICAgICAgICAgIHJldHVybiBjYihudWxsLCBkdCk7XHJcblxyXG4gICAgICAgIENMSS5jb25mKGNhbm9uaWNfbW9kdWxlX25hbWUsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnTW9kdWxlIHN1Y2Nlc3NmdWxseSBpbnN0YWxsZWQgYW5kIGxhdW5jaGVkJyk7XHJcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0dfTU9EICsgJ0NoZWNrb3V0IG1vZHVsZSBvcHRpb25zOiBgJCBwbTIgY29uZmAnKTtcclxuICAgICAgICAgIHJldHVybiBjYihudWxsLCBkdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzdGFydChQTTIsIG1vZHVsZXMsIG1vZHVsZV9uYW1lLCBjYikge1xyXG4gIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnU3RhcnRpbmcgTlBNIG1vZHVsZSAnICsgbW9kdWxlX25hbWUpO1xyXG5cclxuICB2YXIgaW5zdGFsbF9wYXRoID0gcGF0aC5qb2luKGNzdC5ERUZBVUxUX01PRFVMRV9QQVRILCBtb2R1bGVfbmFtZSk7XHJcbiAgdmFyIHByb2NfcGF0aCA9IHBhdGguam9pbihpbnN0YWxsX3BhdGgsICdub2RlX21vZHVsZXMnLCBtb2R1bGVfbmFtZSk7XHJcbiAgdmFyIHBhY2thZ2VfanNvbl9wYXRoID0gcGF0aC5qb2luKHByb2NfcGF0aCwgJ3BhY2thZ2UuanNvbicpO1xyXG5cclxuICB2YXIgb3B0cyA9IHt9O1xyXG5cclxuICAvLyBNZXJnZSB3aXRoIGVtYmVkZGVkIGNvbmZpZ3VyYXRpb24gaW5zaWRlIG1vZHVsZV9jb25mICh1aWQsIGdpZClcclxuICBDb21tb24uZXh0ZW5kKG9wdHMsIG1vZHVsZXNbbW9kdWxlX25hbWVdKTtcclxuXHJcbiAgLy8gTWVyZ2UgbWV0YSBkYXRhIHRvIHN0YXJ0IG1vZHVsZSBwcm9wZXJseVxyXG4gIENvbW1vbi5leHRlbmQob3B0cywge1xyXG4gICAgLy8gcGFja2FnZS5qc29uIHBhdGhcclxuICAgIGNtZDogcGFja2FnZV9qc29uX3BhdGgsXHJcbiAgICAvLyBzdGFydGluZyBtb2RlXHJcbiAgICBkZXZlbG9wbWVudF9tb2RlOiBmYWxzZSxcclxuICAgIC8vIHByb2Nlc3MgY3dkXHJcbiAgICBwcm9jX3BhdGg6IHByb2NfcGF0aFxyXG4gIH0pO1xyXG5cclxuICBTdGFydE1vZHVsZShQTTIsIG9wdHMsIGZ1bmN0aW9uIChlcnIsIGR0KSB7XHJcbiAgICBpZiAoZXJyKSBjb25zb2xlLmVycm9yKGVycik7XHJcbiAgICByZXR1cm4gY2IoKTtcclxuICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiB1bmluc3RhbGwoQ0xJLCBtb2R1bGVfbmFtZSwgY2IpIHtcclxuICB2YXIgbW9kdWxlX25hbWVfb25seSA9IFV0aWxpdHkuZ2V0Q2Fub25pY01vZHVsZU5hbWUobW9kdWxlX25hbWUpXHJcbiAgdmFyIHByb2NfcGF0aCA9IHBhdGguam9pbihjc3QuREVGQVVMVF9NT0RVTEVfUEFUSCwgbW9kdWxlX25hbWVfb25seSk7XHJcbiAgQ29uZmlndXJhdGlvbi51bnNldFN5bmMoY3N0Lk1PRFVMRV9DT05GX1BSRUZJWCArICc6JyArIG1vZHVsZV9uYW1lX29ubHkpO1xyXG5cclxuICBDTEkuZGVsZXRlTW9kdWxlKG1vZHVsZV9uYW1lX29ubHksIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcclxuICAgIGNvbnNvbGUubG9nKCdEZWxldGluZycsIHByb2NfcGF0aClcclxuICAgIGlmIChtb2R1bGVfbmFtZSAhPSAnLicgJiYgcHJvY19wYXRoLmluY2x1ZGVzKCdtb2R1bGVzJykgPT09IHRydWUpIHtcclxuICAgICAgZGVsZXRlRm9sZGVyUmVjdXJzaXZlKHByb2NfcGF0aClcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXJyKSB7XHJcbiAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XHJcbiAgICAgIHJldHVybiBjYihlcnIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYihudWxsLCBkYXRhKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TW9kdWxlQ29uZihhcHBfbmFtZSkge1xyXG4gIGlmICghYXBwX25hbWUpIHRocm93IG5ldyBFcnJvcignTm8gYXBwX25hbWUgZGVmaW5lZCcpO1xyXG5cclxuICB2YXIgbW9kdWxlX2NvbmYgPSBDb25maWd1cmF0aW9uLmdldEFsbFN5bmMoKTtcclxuXHJcbiAgdmFyIGFkZGl0aW9uYWxfZW52ID0ge307XHJcblxyXG4gIGlmICghbW9kdWxlX2NvbmZbYXBwX25hbWVdKSB7XHJcbiAgICBhZGRpdGlvbmFsX2VudiA9IHt9O1xyXG4gICAgYWRkaXRpb25hbF9lbnZbYXBwX25hbWVdID0ge307XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgYWRkaXRpb25hbF9lbnYgPSBDb21tb24uY2xvbmUobW9kdWxlX2NvbmZbYXBwX25hbWVdKTtcclxuICAgIGFkZGl0aW9uYWxfZW52W2FwcF9uYW1lXSA9IEpTT04uc3RyaW5naWZ5KG1vZHVsZV9jb25mW2FwcF9uYW1lXSk7XHJcbiAgfVxyXG4gIHJldHVybiBhZGRpdGlvbmFsX2VudjtcclxufVxyXG5cclxuZnVuY3Rpb24gU3RhcnRNb2R1bGUoQ0xJLCBvcHRzLCBjYikge1xyXG4gIGlmICghb3B0cy5jbWQgJiYgIW9wdHMucGFja2FnZSkgdGhyb3cgbmV3IEVycm9yKCdtb2R1bGUgcGFja2FnZS5qc29uIG5vdCBkZWZpbmVkJyk7XHJcbiAgaWYgKCFvcHRzLmRldmVsb3BtZW50X21vZGUpIG9wdHMuZGV2ZWxvcG1lbnRfbW9kZSA9IGZhbHNlO1xyXG5cclxuICB2YXIgcGFja2FnZV9qc29uID0gcmVxdWlyZShvcHRzLmNtZCB8fCBvcHRzLnBhY2thZ2UpO1xyXG5cclxuICAvKipcclxuICAgKiBTY3JpcHQgZmlsZSBkZXRlY3Rpb25cclxuICAgKiAxLSAqYXBwcyogZmllbGQgKGRlZmF1bHQgcG0yIGpzb24gY29uZmlndXJhdGlvbilcclxuICAgKiAyLSAqYmluKiBmaWVsZFxyXG4gICAqIDMtICptYWluKiBmaWVsZFxyXG4gICAqL1xyXG4gIGlmICghcGFja2FnZV9qc29uLmFwcHMgJiYgIXBhY2thZ2VfanNvbi5wbTIpIHtcclxuICAgIHBhY2thZ2VfanNvbi5hcHBzID0ge307XHJcblxyXG4gICAgaWYgKHBhY2thZ2VfanNvbi5iaW4pIHtcclxuICAgICAgdmFyIGJpbiA9IE9iamVjdC5rZXlzKHBhY2thZ2VfanNvbi5iaW4pWzBdO1xyXG4gICAgICBwYWNrYWdlX2pzb24uYXBwcy5zY3JpcHQgPSBwYWNrYWdlX2pzb24uYmluW2Jpbl07XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChwYWNrYWdlX2pzb24ubWFpbikge1xyXG4gICAgICBwYWNrYWdlX2pzb24uYXBwcy5zY3JpcHQgPSBwYWNrYWdlX2pzb24ubWFpbjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIENvbW1vbi5leHRlbmQob3B0cywge1xyXG4gICAgY3dkOiBvcHRzLnByb2NfcGF0aCxcclxuICAgIHdhdGNoOiBvcHRzLmRldmVsb3BtZW50X21vZGUsXHJcbiAgICBmb3JjZV9uYW1lOiBwYWNrYWdlX2pzb24ubmFtZSxcclxuICAgIHN0YXJ0ZWRfYXNfbW9kdWxlOiB0cnVlXHJcbiAgfSk7XHJcblxyXG4gIC8vIFN0YXJ0IHRoZSBtb2R1bGVcclxuICBDTEkuc3RhcnQocGFja2FnZV9qc29uLCBvcHRzLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XHJcbiAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcclxuXHJcbiAgICBpZiAob3B0cy5zYWZlKSB7XHJcbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnTW9uaXRvcmluZyBtb2R1bGUgYmVoYXZpb3IgZm9yIHBvdGVudGlhbCBpc3N1ZSAoNXNlY3MuLi4pJyk7XHJcblxyXG4gICAgICB2YXIgdGltZSA9IHR5cGVvZiAob3B0cy5zYWZlKSA9PSAnYm9vbGVhbicgPyAzMDAwIDogcGFyc2VJbnQob3B0cy5zYWZlKTtcclxuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIENMSS5kZXNjcmliZShwYWNrYWdlX2pzb24ubmFtZSwgZnVuY3Rpb24gKGVyciwgYXBwcykge1xyXG4gICAgICAgICAgaWYgKGVyciB8fCBhcHBzWzBdLnBtMl9lbnYucmVzdGFydF90aW1lID4gMikge1xyXG4gICAgICAgICAgICByZXR1cm4gUm9sbGJhY2sucmV2ZXJ0KENMSSwgcGFja2FnZV9qc29uLm5hbWUsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdOZXcgTW9kdWxlIGlzIGluc3RhYmxlLCByZXN0b3JlZCB0byBwcmV2aW91cyB2ZXJzaW9uJykpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBjYihudWxsLCBkYXRhKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSwgdGltZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNiKG51bGwsIGRhdGEpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuXHJcblxyXG52YXIgUm9sbGJhY2sgPSB7XHJcbiAgcmV2ZXJ0OiBmdW5jdGlvbiAoQ0xJLCBtb2R1bGVfbmFtZSwgY2IpIHtcclxuICAgIHZhciBjYW5vbmljX21vZHVsZV9uYW1lID0gVXRpbGl0eS5nZXRDYW5vbmljTW9kdWxlTmFtZShtb2R1bGVfbmFtZSk7XHJcbiAgICB2YXIgYmFja3VwX3BhdGggPSBwYXRoLmpvaW4ocmVxdWlyZSgnb3MnKS50bXBkaXIoKSwgY2Fub25pY19tb2R1bGVfbmFtZSk7XHJcbiAgICB2YXIgbW9kdWxlX3BhdGggPSBwYXRoLmpvaW4oY3N0LkRFRkFVTFRfTU9EVUxFX1BBVEgsIGNhbm9uaWNfbW9kdWxlX25hbWUpO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGZzLnN0YXRTeW5jKGJhY2t1cF9wYXRoKVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdubyBiYWNrdXAgZm91bmQnKSk7XHJcbiAgICB9XHJcblxyXG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX01PRCArIGNoYWxrLmJvbGQucmVkKCdbW1tbWyBNb2R1bGUgaW5zdGFsbGF0aW9uIGZhaWx1cmUhIF1dXV1dJykpO1xyXG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX01PRCArIGNoYWxrLmJvbGQucmVkKCdbUkVTVE9SSU5HIFRPIFBSRVZJT1VTIFZFUlNJT05dJykpO1xyXG5cclxuICAgIENMSS5kZWxldGVNb2R1bGUoY2Fub25pY19tb2R1bGVfbmFtZSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyBEZWxldGUgZmFpbGluZyBtb2R1bGVcclxuXHJcbiAgICAgIGlmIChtb2R1bGVfbmFtZS5pbmNsdWRlcygnbW9kdWxlcycpID09PSB0cnVlKVxyXG4gICAgICAgIGRlbGV0ZUZvbGRlclJlY3Vyc2l2ZShtb2R1bGVfcGF0aClcclxuICAgICAgLy8gUmVzdG9yZSB3b3JraW5nIHZlcnNpb25cclxuICAgICAgY29weWRpclN5bmMoYmFja3VwX3BhdGgsIHBhdGguam9pbihjc3QuREVGQVVMVF9NT0RVTEVfUEFUSCwgY2Fub25pY19tb2R1bGVfbmFtZSkpO1xyXG5cclxuICAgICAgdmFyIHByb2NfcGF0aCA9IHBhdGguam9pbihtb2R1bGVfcGF0aCwgJ25vZGVfbW9kdWxlcycsIGNhbm9uaWNfbW9kdWxlX25hbWUpO1xyXG4gICAgICB2YXIgcGFja2FnZV9qc29uX3BhdGggPSBwYXRoLmpvaW4ocHJvY19wYXRoLCAncGFja2FnZS5qc29uJyk7XHJcblxyXG4gICAgICAvLyBTdGFydCBtb2R1bGVcclxuICAgICAgU3RhcnRNb2R1bGUoQ0xJLCB7XHJcbiAgICAgICAgY21kOiBwYWNrYWdlX2pzb25fcGF0aCxcclxuICAgICAgICBkZXZlbG9wbWVudF9tb2RlOiBmYWxzZSxcclxuICAgICAgICBwcm9jX3BhdGg6IHByb2NfcGF0aFxyXG4gICAgICB9LCBjYik7XHJcbiAgICB9KTtcclxuICB9LFxyXG4gIGJhY2t1cDogZnVuY3Rpb24gKG1vZHVsZV9uYW1lKSB7XHJcbiAgICAvLyBCYWNrdXAgY3VycmVudCBtb2R1bGVcclxuICAgIHZhciB0bXBkaXIgPSByZXF1aXJlKCdvcycpLnRtcGRpcigpO1xyXG4gICAgdmFyIGNhbm9uaWNfbW9kdWxlX25hbWUgPSBVdGlsaXR5LmdldENhbm9uaWNNb2R1bGVOYW1lKG1vZHVsZV9uYW1lKTtcclxuICAgIHZhciBtb2R1bGVfcGF0aCA9IHBhdGguam9pbihjc3QuREVGQVVMVF9NT0RVTEVfUEFUSCwgY2Fub25pY19tb2R1bGVfbmFtZSk7XHJcbiAgICBjb3B5ZGlyU3luYyhtb2R1bGVfcGF0aCwgcGF0aC5qb2luKHRtcGRpciwgY2Fub25pY19tb2R1bGVfbmFtZSkpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG4gIGluc3RhbGwsXHJcbiAgdW5pbnN0YWxsLFxyXG4gIHN0YXJ0LFxyXG4gIHB1Ymxpc2gsXHJcbiAgZ2VuZXJhdGVTYW1wbGUsXHJcbiAgbG9jYWxTdGFydCxcclxuICBnZXRNb2R1bGVDb25mXHJcbn1cclxuIl19