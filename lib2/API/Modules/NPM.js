"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvTW9kdWxlcy9OUE0udHMiXSwibmFtZXMiOlsibG9jYWxTdGFydCIsIlBNMiIsIm9wdHMiLCJjYiIsInByb2NfcGF0aCIsImNtZCIsImNvbmYiLCJDb21tb24iLCJwcmludE91dCIsImNzdCIsIlBSRUZJWF9NU0dfTU9EIiwicHJvY2VzcyIsImN3ZCIsInBhdGgiLCJqb2luIiwiREVGQVVMVF9NT0RVTEVfSlNPTiIsImV4dGVuZCIsImRldmVsb3BtZW50X21vZGUiLCJTdGFydE1vZHVsZSIsImVyciIsImR0IiwiZ2VuZXJhdGVTYW1wbGUiLCJhcHBfbmFtZSIsInJsIiwicmVhZGxpbmUiLCJjcmVhdGVJbnRlcmZhY2UiLCJpbnB1dCIsInN0ZGluIiwib3V0cHV0Iiwic3Rkb3V0Iiwic2FtcGxpemUiLCJtb2R1bGVfbmFtZSIsImNtZDEiLCJjbWQyIiwiY21kMyIsInByaW50RXJyb3IiLCJQUkVGSVhfTVNHX01PRF9FUlIiLCJtZXNzYWdlIiwiY29uc29sZSIsImxvZyIsInF1ZXN0aW9uIiwicHVibGlzaCIsInNlbXZlciIsInJlcXVpcmUiLCJwYWNrYWdlX2ZpbGUiLCJwYWNrYWdlX2pzb24iLCJ2ZXJzaW9uIiwiaW5jIiwibmFtZSIsImFuc3dlciIsImZzIiwid3JpdGVGaWxlIiwiSlNPTiIsInN0cmluZ2lmeSIsImNvZGUiLCJtb2R1bGVFeGlzdEluTG9jYWxEQiIsIkNMSSIsIm1vZHVsZXMiLCJDb25maWd1cmF0aW9uIiwiZ2V0U3luYyIsIk1PRFVMRV9DT05GX1BSRUZJWCIsIm1vZHVsZV9uYW1lX29ubHkiLCJVdGlsaXR5IiwiZ2V0Q2Fub25pY01vZHVsZU5hbWUiLCJPYmplY3QiLCJrZXlzIiwiaW5kZXhPZiIsImluc3RhbGwiLCJleGlzdHMiLCJsb2dNb2QiLCJSb2xsYmFjayIsImJhY2t1cCIsInVuaW5zdGFsbCIsImNvbnRpbnVlSW5zdGFsbCIsImdldE5QTUNvbW1hbmRMaW5lIiwiaW5zdGFsbF9wYXRoIiwic3Bhd24iLCJiaW5kIiwiSVNfV0lORE9XUyIsInN0ZGlvIiwiZW52Iiwic2hlbGwiLCJCVUlMVElOX05PREVfUEFUSCIsIkJVSUxUSU5fTlBNX1BBVEgiLCJjaGFsayIsImJvbGQiLCJyZWQiLCJjYW5vbmljX21vZHVsZV9uYW1lIiwiREVGQVVMVF9NT0RVTEVfUEFUSCIsInRoZW4iLCJjaGRpciIsIm9zIiwiaG9tZWRpciIsImluc3RhbGxfaW5zdGFuY2UiLCJvbiIsImZpbmFsaXplSW5zdGFsbCIsImVycm9yIiwic3RhY2siLCJyZXZlcnQiLCJFcnJvciIsInBhY2thZ2VfanNvbl9wYXRoIiwicGFyc2UiLCJyZWFkRmlsZVN5bmMiLCJ0b1N0cmluZyIsImNvbmZpZyIsImZvckVhY2giLCJrZXkiLCJzZXRTeW5jSWZOb3RFeGlzdCIsImUiLCJzZXQiLCJ1aWQiLCJnaWQiLCJkYXRhIiwiUE0yX1BST0dSQU1NQVRJQyIsInN0YXJ0IiwidW5zZXRTeW5jIiwiZGVsZXRlTW9kdWxlIiwiaW5jbHVkZXMiLCJnZXRNb2R1bGVDb25mIiwibW9kdWxlX2NvbmYiLCJnZXRBbGxTeW5jIiwiYWRkaXRpb25hbF9lbnYiLCJjbG9uZSIsImFwcHMiLCJwbTIiLCJiaW4iLCJzY3JpcHQiLCJtYWluIiwid2F0Y2giLCJmb3JjZV9uYW1lIiwic3RhcnRlZF9hc19tb2R1bGUiLCJzYWZlIiwidGltZSIsInBhcnNlSW50Iiwic2V0VGltZW91dCIsImRlc2NyaWJlIiwicG0yX2VudiIsInJlc3RhcnRfdGltZSIsImJhY2t1cF9wYXRoIiwidG1wZGlyIiwibW9kdWxlX3BhdGgiLCJzdGF0U3luYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7Ozs7Ozs7O0FBWUEsU0FBU0EsVUFBVCxDQUFvQkMsR0FBcEIsRUFBeUJDLElBQXpCLEVBQStCQyxFQUEvQixFQUFtQztBQUNq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VixFQUF1QjtBQUM3QjtBQUNBLFFBQUk0RyxNQUFNLEdBQUdoRyxPQUFPLENBQUMsSUFBRCxDQUFQLENBQWNnRyxNQUFkLEVBQWI7O0FBQ0EsUUFBSXBELG1CQUFtQixHQUFHekIsb0JBQVFDLG9CQUFSLENBQTZCaEMsV0FBN0IsQ0FBMUI7O0FBQ0EsUUFBSTZHLFdBQVcsR0FBRy9ILGlCQUFLQyxJQUFMLENBQVVMLHNCQUFJK0UsbUJBQWQsRUFBbUNELG1CQUFuQyxDQUFsQjs7QUFDQSxpQ0FBWXFELFdBQVosRUFBeUIvSCxpQkFBS0MsSUFBTCxDQUFVNkgsTUFBVixFQUFrQnBELG1CQUFsQixDQUF6QjtBQUNEO0FBeENZLENBQWY7ZUEyQ2U7QUFDYnBCLEVBQUFBLE9BQU8sRUFBUEEsT0FEYTtBQUViSyxFQUFBQSxTQUFTLEVBQVRBLFNBRmE7QUFHYjBDLEVBQUFBLEtBQUssRUFBTEEsS0FIYTtBQUliekUsRUFBQUEsT0FBTyxFQUFQQSxPQUphO0FBS2JwQixFQUFBQSxjQUFjLEVBQWRBLGNBTGE7QUFNYnJCLEVBQUFBLFVBQVUsRUFBVkEsVUFOYTtBQU9ic0gsRUFBQUEsYUFBYSxFQUFiQTtBQVBhLEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5cbmltcG9ydCByZWFkbGluZSBmcm9tICdyZWFkbGluZSdcbmltcG9ydCB3aGljaCBmcm9tICcuLi8uLi90b29scy93aGljaCdcbmltcG9ydCBzZXhlYyBmcm9tICcuLi8uLi90b29scy9zZXhlYydcbmltcG9ydCBjb3B5ZGlyU3luYyBmcm9tICcuLi8uLi90b29scy9jb3B5ZGlyU3luYydcbmltcG9ydCBkZWxldGVGb2xkZXJSZWN1cnNpdmUgZnJvbSAnLi4vLi4vdG9vbHMvZGVsZXRlRm9sZGVyUmVjdXJzaXZlJ1xuXG5pbXBvcnQgQ29uZmlndXJhdGlvbiBmcm9tICcuLi8uLi9Db25maWd1cmF0aW9uJztcbmltcG9ydCBjc3QgZnJvbSAnLi4vLi4vLi4vY29uc3RhbnRzJztcbmltcG9ydCBDb21tb24gZnJvbSAnLi4vLi4vQ29tbW9uJztcbmltcG9ydCBVdGlsaXR5IGZyb20gJy4uLy4uL1V0aWxpdHknO1xuXG4vKipcbiAqIFBNMiBNb2R1bGUgU3lzdGVtLlxuICogRmVhdHVyZXM6XG4gKiAtIEluc3RhbGxlZCBtb2R1bGVzIGFyZSBsaXN0ZWQgc2VwYXJhdGVseSBmcm9tIHVzZXIgYXBwbGljYXRpb25zXG4gKiAtIEFsd2F5cyBPTiwgYSBtb2R1bGUgaXMgYWx3YXlzIHVwIGFsb25nIFBNMiwgdG8gc3RvcCBpdCwgeW91IG5lZWQgdG8gdW5pbnN0YWxsIGl0XG4gKiAtIEluc3RhbGwgYSBydW5uYWJsZSBtb2R1bGUgZnJvbSBOUE0vR2l0aHViL0hUVFAgKHJlcXVpcmUgYSBwYWNrYWdlLmpzb24gb25seSlcbiAqIC0gU29tZSBtb2R1bGVzIGFkZCBpbnRlcm5hbCBQTTIgZGVwZW5jZW5jaWVzIChsaWtlIHR5cGVzY3JpcHQsIHByb2ZpbGluZy4uLilcbiAqIC0gSW50ZXJuYWxseSBpdCB1c2VzIE5QTSBpbnN0YWxsIChodHRwczovL2RvY3MubnBtanMuY29tL2NsaS9pbnN0YWxsKVxuICogLSBBdXRvIGRpc2NvdmVyIHNjcmlwdCB0byBsYXVuY2ggKGZpcnN0IGl0IGNoZWNrcyB0aGUgYXBwcyBmaWVsZCwgdGhlbiBiaW4gYW5kIGZpbmFsbHkgbWFpbiBhdHRyKVxuICogLSBHZW5lcmF0ZSBzYW1wbGUgbW9kdWxlIHZpYSBwbTIgbW9kdWxlOmdlbmVyYXRlIDxtb2R1bGVfbmFtZT5cbiAqL1xuXG5mdW5jdGlvbiBsb2NhbFN0YXJ0KFBNMiwgb3B0cywgY2IpIHtcbiAgdmFyIHByb2NfcGF0aCA9ICcnLFxuICAgIGNtZCA9ICcnLFxuICAgIGNvbmYgPSB7fTtcblxuICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0dfTU9EICsgJ0luc3RhbGxpbmcgbG9jYWwgbW9kdWxlIGluIERFVkVMT1BNRU5UIE1PREUgd2l0aCBXQVRDSCBhdXRvIHJlc3RhcnQnKTtcbiAgcHJvY19wYXRoID0gcHJvY2Vzcy5jd2QoKTtcblxuICBjbWQgPSBwYXRoLmpvaW4ocHJvY19wYXRoLCBjc3QuREVGQVVMVF9NT0RVTEVfSlNPTik7XG5cbiAgQ29tbW9uLmV4dGVuZChvcHRzLCB7XG4gICAgY21kOiBjbWQsXG4gICAgZGV2ZWxvcG1lbnRfbW9kZTogdHJ1ZSxcbiAgICBwcm9jX3BhdGg6IHByb2NfcGF0aFxuICB9KTtcblxuICByZXR1cm4gU3RhcnRNb2R1bGUoUE0yLCBvcHRzLCBmdW5jdGlvbiAoZXJyLCBkdCkge1xuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnTW9kdWxlIHN1Y2Nlc3NmdWxseSBpbnN0YWxsZWQgYW5kIGxhdW5jaGVkJyk7XG4gICAgcmV0dXJuIGNiKG51bGwsIGR0KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlU2FtcGxlKGFwcF9uYW1lLCBjYikge1xuICB2YXIgcmwgPSByZWFkbGluZS5jcmVhdGVJbnRlcmZhY2Uoe1xuICAgIGlucHV0OiBwcm9jZXNzLnN0ZGluLFxuICAgIG91dHB1dDogcHJvY2Vzcy5zdGRvdXRcbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2FtcGxpemUobW9kdWxlX25hbWUpIHtcbiAgICB2YXIgY21kMSA9ICdnaXQgY2xvbmUgaHR0cHM6Ly9naXRodWIuY29tL3BtMi1oaXZlL3NhbXBsZS1tb2R1bGUuZ2l0ICcgKyBtb2R1bGVfbmFtZSArICc7IGNkICcgKyBtb2R1bGVfbmFtZSArICc7IHJtIC1yZiAuZ2l0JztcbiAgICB2YXIgY21kMiA9ICdjZCAnICsgbW9kdWxlX25hbWUgKyAnIDsgc2VkIC1pIFwiczpzYW1wbGUtbW9kdWxlOicgKyBtb2R1bGVfbmFtZSArICc6Z1wiIHBhY2thZ2UuanNvbic7XG4gICAgdmFyIGNtZDMgPSAnY2QgJyArIG1vZHVsZV9uYW1lICsgJyA7IG5wbSBpbnN0YWxsJztcblxuICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnR2V0dGluZyBzYW1wbGUgYXBwJyk7XG5cbiAgICBzZXhlYyhjbWQxLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19NT0RfRVJSICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgc2V4ZWMoY21kMiwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgICAgIHNleGVjKGNtZDMsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX01PRCArICdNb2R1bGUgc2FtcGxlIGNyZWF0ZWQgaW4gZm9sZGVyOiAnLCBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgbW9kdWxlX25hbWUpKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KCdTdGFydCBtb2R1bGUgaW4gZGV2ZWxvcG1lbnQgbW9kZTonKTtcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoJyQgY2QgJyArIG1vZHVsZV9uYW1lICsgJy8nKTtcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoJyQgcG0yIGluc3RhbGwgLiAnKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XG5cbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoJ01vZHVsZSBMb2c6ICcpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dCgnJCBwbTIgbG9ncyAnICsgbW9kdWxlX25hbWUpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoJ1VuaW5zdGFsbCBtb2R1bGU6ICcpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dCgnJCBwbTIgdW5pbnN0YWxsICcgKyBtb2R1bGVfbmFtZSk7XG4gICAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dCgnRm9yY2UgcmVzdGFydDogJyk7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KCckIHBtMiByZXN0YXJ0ICcgKyBtb2R1bGVfbmFtZSk7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoKSA6IGZhbHNlO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgaWYgKGFwcF9uYW1lKSByZXR1cm4gc2FtcGxpemUoYXBwX25hbWUpO1xuXG4gIHJsLnF1ZXN0aW9uKGNzdC5QUkVGSVhfTVNHX01PRCArIFwiTW9kdWxlIG5hbWU6IFwiLCBmdW5jdGlvbiAobW9kdWxlX25hbWUpIHtcbiAgICBzYW1wbGl6ZShtb2R1bGVfbmFtZSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBwdWJsaXNoKG9wdHMsIGNiKSB7XG4gIHZhciBybCA9IHJlYWRsaW5lLmNyZWF0ZUludGVyZmFjZSh7XG4gICAgaW5wdXQ6IHByb2Nlc3Muc3RkaW4sXG4gICAgb3V0cHV0OiBwcm9jZXNzLnN0ZG91dFxuICB9KTtcblxuICB2YXIgc2VtdmVyID0gcmVxdWlyZSgnc2VtdmVyJyk7XG5cbiAgdmFyIHBhY2thZ2VfZmlsZSA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncGFja2FnZS5qc29uJyk7XG5cbiAgdmFyIHBhY2thZ2VfanNvbiA9IHJlcXVpcmUocGFja2FnZV9maWxlKTtcblxuICBwYWNrYWdlX2pzb24udmVyc2lvbiA9IHNlbXZlci5pbmMocGFja2FnZV9qc29uLnZlcnNpb24sICdtaW5vcicpO1xuICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0dfTU9EICsgJ0luY3JlbWVudGluZyBtb2R1bGUgdG86ICVzQCVzJyxcbiAgICBwYWNrYWdlX2pzb24ubmFtZSxcbiAgICBwYWNrYWdlX2pzb24udmVyc2lvbik7XG5cblxuICBybC5xdWVzdGlvbihcIldyaXRlICYgUHVibGlzaD8gW1kvTl1cIiwgZnVuY3Rpb24gKGFuc3dlcikge1xuICAgIGlmIChhbnN3ZXIgIT0gXCJZXCIpXG4gICAgICByZXR1cm4gY2IoKTtcblxuXG4gICAgZnMud3JpdGVGaWxlKHBhY2thZ2VfZmlsZSwgSlNPTi5zdHJpbmdpZnkocGFja2FnZV9qc29uLCBudWxsLCAyKSwgZnVuY3Rpb24gKCkge1xuICAgICAgLy8gaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG5cbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnUHVibGlzaGluZyBtb2R1bGUgLSAlc0AlcycsXG4gICAgICAgIHBhY2thZ2VfanNvbi5uYW1lLFxuICAgICAgICBwYWNrYWdlX2pzb24udmVyc2lvbik7XG5cbiAgICAgIHNleGVjKCducG0gcHVibGlzaCcsIGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnTW9kdWxlIC0gJXNAJXMgc3VjY2Vzc2Z1bGx5IHB1Ymxpc2hlZCcsXG4gICAgICAgICAgcGFja2FnZV9qc29uLm5hbWUsXG4gICAgICAgICAgcGFja2FnZV9qc29uLnZlcnNpb24pO1xuXG4gICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnUHVzaGluZyBtb2R1bGUgb24gR2l0Jyk7XG4gICAgICAgIHNleGVjKCdnaXQgYWRkIC4gOyBnaXQgY29tbWl0IC1tIFwiJyArIHBhY2thZ2VfanNvbi52ZXJzaW9uICsgJ1wiOyBnaXQgcHVzaCBvcmlnaW4gbWFzdGVyJywgZnVuY3Rpb24gKGNvZGUpIHtcblxuICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnSW5zdGFsbGFibGUgd2l0aCBwbTIgaW5zdGFsbCAlcycsIHBhY2thZ2VfanNvbi5uYW1lKTtcbiAgICAgICAgICByZXR1cm4gY2IobnVsbCwgcGFja2FnZV9qc29uKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICB9KTtcbn1cblxuZnVuY3Rpb24gbW9kdWxlRXhpc3RJbkxvY2FsREIoQ0xJLCBtb2R1bGVfbmFtZSwgY2IpIHtcbiAgdmFyIG1vZHVsZXMgPSBDb25maWd1cmF0aW9uLmdldFN5bmMoY3N0Lk1PRFVMRV9DT05GX1BSRUZJWCk7XG4gIGlmICghbW9kdWxlcykgcmV0dXJuIGNiKGZhbHNlKTtcbiAgdmFyIG1vZHVsZV9uYW1lX29ubHkgPSBVdGlsaXR5LmdldENhbm9uaWNNb2R1bGVOYW1lKG1vZHVsZV9uYW1lKVxuICBtb2R1bGVzID0gT2JqZWN0LmtleXMobW9kdWxlcyk7XG4gIHJldHVybiBjYihtb2R1bGVzLmluZGV4T2YobW9kdWxlX25hbWVfb25seSkgPiAtMSA/IHRydWUgOiBmYWxzZSk7XG59O1xuXG5mdW5jdGlvbiBpbnN0YWxsKENMSSwgbW9kdWxlX25hbWUsIG9wdHMsIGNiKSB7XG4gIG1vZHVsZUV4aXN0SW5Mb2NhbERCKENMSSwgbW9kdWxlX25hbWUsIGZ1bmN0aW9uIChleGlzdHMpIHtcbiAgICBpZiAoZXhpc3RzKSB7XG4gICAgICBDb21tb24ubG9nTW9kKCdNb2R1bGUgYWxyZWFkeSBpbnN0YWxsZWQuIFVwZGF0aW5nLicpO1xuXG4gICAgICBSb2xsYmFjay5iYWNrdXAobW9kdWxlX25hbWUpO1xuXG4gICAgICByZXR1cm4gdW5pbnN0YWxsKENMSSwgbW9kdWxlX25hbWUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNvbnRpbnVlSW5zdGFsbChDTEksIG1vZHVsZV9uYW1lLCBvcHRzLCBjYik7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRpbnVlSW5zdGFsbChDTEksIG1vZHVsZV9uYW1lLCBvcHRzLCBjYik7XG4gIH0pXG59XG5cbi8vIEJ1aWx0aW4gTm9kZSBTd2l0Y2hcbmZ1bmN0aW9uIGdldE5QTUNvbW1hbmRMaW5lKG1vZHVsZV9uYW1lLCBpbnN0YWxsX3BhdGgpIHtcbiAgaWYgKHdoaWNoKCducG0nKSkge1xuICAgIHJldHVybiBzcGF3bi5iaW5kKHRoaXMsIGNzdC5JU19XSU5ET1dTID8gJ25wbS5jbWQnIDogJ25wbScsIFsnaW5zdGFsbCcsIG1vZHVsZV9uYW1lLCAnLS1sb2dsZXZlbD1lcnJvcicsICctLXByZWZpeCcsIGBcIiR7aW5zdGFsbF9wYXRofVwiYF0sIHtcbiAgICAgIHN0ZGlvOiAnaW5oZXJpdCcsXG4gICAgICBlbnY6IHByb2Nlc3MuZW52LFxuICAgICAgc2hlbGw6IHRydWVcbiAgICB9KVxuICB9XG4gIGVsc2Uge1xuICAgIHJldHVybiBzcGF3bi5iaW5kKHRoaXMsIGNzdC5CVUlMVElOX05PREVfUEFUSCwgW2NzdC5CVUlMVElOX05QTV9QQVRILCAnaW5zdGFsbCcsIG1vZHVsZV9uYW1lLCAnLS1sb2dsZXZlbD1lcnJvcicsICctLXByZWZpeCcsIGBcIiR7aW5zdGFsbF9wYXRofVwiYF0sIHtcbiAgICAgIHN0ZGlvOiAnaW5oZXJpdCcsXG4gICAgICBlbnY6IHByb2Nlc3MuZW52LFxuICAgICAgc2hlbGw6IHRydWVcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGNvbnRpbnVlSW5zdGFsbChDTEksIG1vZHVsZV9uYW1lLCBvcHRzLCBjYikge1xuICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0dfTU9EICsgJ0NhbGxpbmcgJyArIGNoYWxrLmJvbGQucmVkKCdbTlBNXScpICsgJyB0byBpbnN0YWxsICcgKyBtb2R1bGVfbmFtZSArICcgLi4uJyk7XG5cbiAgdmFyIGNhbm9uaWNfbW9kdWxlX25hbWUgPSBVdGlsaXR5LmdldENhbm9uaWNNb2R1bGVOYW1lKG1vZHVsZV9uYW1lKTtcbiAgdmFyIGluc3RhbGxfcGF0aCA9IHBhdGguam9pbihjc3QuREVGQVVMVF9NT0RVTEVfUEFUSCwgY2Fub25pY19tb2R1bGVfbmFtZSk7XG5cbiAgcmVxdWlyZSgnbWtkaXJwJykoaW5zdGFsbF9wYXRoKVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHByb2Nlc3MuY2hkaXIob3MuaG9tZWRpcigpKTtcblxuICAgICAgdmFyIGluc3RhbGxfaW5zdGFuY2UgPSBnZXROUE1Db21tYW5kTGluZShtb2R1bGVfbmFtZSwgaW5zdGFsbF9wYXRoKSgpO1xuXG4gICAgICBpbnN0YWxsX2luc3RhbmNlLm9uKCdjbG9zZScsIGZpbmFsaXplSW5zdGFsbCk7XG5cbiAgICAgIGluc3RhbGxfaW5zdGFuY2Uub24oJ2Vycm9yJywgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayB8fCBlcnIpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgZnVuY3Rpb24gZmluYWxpemVJbnN0YWxsKGNvZGUpIHtcbiAgICBpZiAoY29kZSAhPSAwKSB7XG4gICAgICAvLyBJZiBpbnN0YWxsIGhhcyBmYWlsZWQsIHJldmVydCB0byBwcmV2aW91cyBtb2R1bGUgdmVyc2lvblxuICAgICAgcmV0dXJuIFJvbGxiYWNrLnJldmVydChDTEksIG1vZHVsZV9uYW1lLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoJ0luc3RhbGxhdGlvbiBmYWlsZWQgdmlhIE5QTSwgbW9kdWxlIGhhcyBiZWVuIHJlc3RvcmVkIHRvIHByZXYgdmVyc2lvbicpKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnTW9kdWxlIGRvd25sb2FkZWQnKTtcblxuICAgIHZhciBwcm9jX3BhdGggPSBwYXRoLmpvaW4oaW5zdGFsbF9wYXRoLCAnbm9kZV9tb2R1bGVzJywgY2Fub25pY19tb2R1bGVfbmFtZSk7XG4gICAgdmFyIHBhY2thZ2VfanNvbl9wYXRoID0gcGF0aC5qb2luKHByb2NfcGF0aCwgJ3BhY2thZ2UuanNvbicpO1xuXG4gICAgLy8gQXBwZW5kIGRlZmF1bHQgY29uZmlndXJhdGlvbiB0byBtb2R1bGUgY29uZmlndXJhdGlvblxuICAgIHRyeSB7XG4gICAgICB2YXIgY29uZiA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhY2thZ2VfanNvbl9wYXRoKS50b1N0cmluZygpKS5jb25maWc7XG5cbiAgICAgIGlmIChjb25mKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKGNvbmYpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgIENvbmZpZ3VyYXRpb24uc2V0U3luY0lmTm90RXhpc3QoY2Fub25pY19tb2R1bGVfbmFtZSArICc6JyArIGtleSwgY29uZltrZXldKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoZSk7XG4gICAgfVxuXG4gICAgb3B0cyA9IENvbW1vbi5leHRlbmQob3B0cywge1xuICAgICAgY21kOiBwYWNrYWdlX2pzb25fcGF0aCxcbiAgICAgIGRldmVsb3BtZW50X21vZGU6IGZhbHNlLFxuICAgICAgcHJvY19wYXRoOiBwcm9jX3BhdGhcbiAgICB9KTtcblxuICAgIENvbmZpZ3VyYXRpb24uc2V0KGNzdC5NT0RVTEVfQ09ORl9QUkVGSVggKyAnOicgKyBjYW5vbmljX21vZHVsZV9uYW1lLCB7XG4gICAgICB1aWQ6IG9wdHMudWlkLFxuICAgICAgZ2lkOiBvcHRzLmdpZFxuICAgIH0sIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuXG4gICAgICBTdGFydE1vZHVsZShDTEksIG9wdHMsIGZ1bmN0aW9uIChlcnIsIGR0KSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuXG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID09PSAndHJ1ZScpXG4gICAgICAgICAgcmV0dXJuIGNiKG51bGwsIGR0KTtcblxuICAgICAgICBDTEkuY29uZihjYW5vbmljX21vZHVsZV9uYW1lLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX01PRCArICdNb2R1bGUgc3VjY2Vzc2Z1bGx5IGluc3RhbGxlZCBhbmQgbGF1bmNoZWQnKTtcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0dfTU9EICsgJ0NoZWNrb3V0IG1vZHVsZSBvcHRpb25zOiBgJCBwbTIgY29uZmAnKTtcbiAgICAgICAgICByZXR1cm4gY2IobnVsbCwgZHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN0YXJ0KFBNMiwgbW9kdWxlcywgbW9kdWxlX25hbWUsIGNiKSB7XG4gIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnU3RhcnRpbmcgTlBNIG1vZHVsZSAnICsgbW9kdWxlX25hbWUpO1xuXG4gIHZhciBpbnN0YWxsX3BhdGggPSBwYXRoLmpvaW4oY3N0LkRFRkFVTFRfTU9EVUxFX1BBVEgsIG1vZHVsZV9uYW1lKTtcbiAgdmFyIHByb2NfcGF0aCA9IHBhdGguam9pbihpbnN0YWxsX3BhdGgsICdub2RlX21vZHVsZXMnLCBtb2R1bGVfbmFtZSk7XG4gIHZhciBwYWNrYWdlX2pzb25fcGF0aCA9IHBhdGguam9pbihwcm9jX3BhdGgsICdwYWNrYWdlLmpzb24nKTtcblxuICB2YXIgb3B0cyA9IHt9O1xuXG4gIC8vIE1lcmdlIHdpdGggZW1iZWRkZWQgY29uZmlndXJhdGlvbiBpbnNpZGUgbW9kdWxlX2NvbmYgKHVpZCwgZ2lkKVxuICBDb21tb24uZXh0ZW5kKG9wdHMsIG1vZHVsZXNbbW9kdWxlX25hbWVdKTtcblxuICAvLyBNZXJnZSBtZXRhIGRhdGEgdG8gc3RhcnQgbW9kdWxlIHByb3Blcmx5XG4gIENvbW1vbi5leHRlbmQob3B0cywge1xuICAgIC8vIHBhY2thZ2UuanNvbiBwYXRoXG4gICAgY21kOiBwYWNrYWdlX2pzb25fcGF0aCxcbiAgICAvLyBzdGFydGluZyBtb2RlXG4gICAgZGV2ZWxvcG1lbnRfbW9kZTogZmFsc2UsXG4gICAgLy8gcHJvY2VzcyBjd2RcbiAgICBwcm9jX3BhdGg6IHByb2NfcGF0aFxuICB9KTtcblxuICBTdGFydE1vZHVsZShQTTIsIG9wdHMsIGZ1bmN0aW9uIChlcnIsIGR0KSB7XG4gICAgaWYgKGVycikgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIHJldHVybiBjYigpO1xuICB9KVxufVxuXG5mdW5jdGlvbiB1bmluc3RhbGwoQ0xJLCBtb2R1bGVfbmFtZSwgY2IpIHtcbiAgdmFyIG1vZHVsZV9uYW1lX29ubHkgPSBVdGlsaXR5LmdldENhbm9uaWNNb2R1bGVOYW1lKG1vZHVsZV9uYW1lKVxuICB2YXIgcHJvY19wYXRoID0gcGF0aC5qb2luKGNzdC5ERUZBVUxUX01PRFVMRV9QQVRILCBtb2R1bGVfbmFtZV9vbmx5KTtcbiAgQ29uZmlndXJhdGlvbi51bnNldFN5bmMoY3N0Lk1PRFVMRV9DT05GX1BSRUZJWCArICc6JyArIG1vZHVsZV9uYW1lX29ubHkpO1xuXG4gIENMSS5kZWxldGVNb2R1bGUobW9kdWxlX25hbWVfb25seSwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgIGNvbnNvbGUubG9nKCdEZWxldGluZycsIHByb2NfcGF0aClcbiAgICBpZiAobW9kdWxlX25hbWUgIT0gJy4nICYmIHByb2NfcGF0aC5pbmNsdWRlcygnbW9kdWxlcycpID09PSB0cnVlKSB7XG4gICAgICBkZWxldGVGb2xkZXJSZWN1cnNpdmUocHJvY19wYXRoKVxuICAgIH1cblxuICAgIGlmIChlcnIpIHtcbiAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2IobnVsbCwgZGF0YSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRNb2R1bGVDb25mKGFwcF9uYW1lKSB7XG4gIGlmICghYXBwX25hbWUpIHRocm93IG5ldyBFcnJvcignTm8gYXBwX25hbWUgZGVmaW5lZCcpO1xuXG4gIHZhciBtb2R1bGVfY29uZiA9IENvbmZpZ3VyYXRpb24uZ2V0QWxsU3luYygpO1xuXG4gIHZhciBhZGRpdGlvbmFsX2VudiA9IHt9O1xuXG4gIGlmICghbW9kdWxlX2NvbmZbYXBwX25hbWVdKSB7XG4gICAgYWRkaXRpb25hbF9lbnYgPSB7fTtcbiAgICBhZGRpdGlvbmFsX2VudlthcHBfbmFtZV0gPSB7fTtcbiAgfVxuICBlbHNlIHtcbiAgICBhZGRpdGlvbmFsX2VudiA9IENvbW1vbi5jbG9uZShtb2R1bGVfY29uZlthcHBfbmFtZV0pO1xuICAgIGFkZGl0aW9uYWxfZW52W2FwcF9uYW1lXSA9IEpTT04uc3RyaW5naWZ5KG1vZHVsZV9jb25mW2FwcF9uYW1lXSk7XG4gIH1cbiAgcmV0dXJuIGFkZGl0aW9uYWxfZW52O1xufVxuXG5mdW5jdGlvbiBTdGFydE1vZHVsZShDTEksIG9wdHMsIGNiKSB7XG4gIGlmICghb3B0cy5jbWQgJiYgIW9wdHMucGFja2FnZSkgdGhyb3cgbmV3IEVycm9yKCdtb2R1bGUgcGFja2FnZS5qc29uIG5vdCBkZWZpbmVkJyk7XG4gIGlmICghb3B0cy5kZXZlbG9wbWVudF9tb2RlKSBvcHRzLmRldmVsb3BtZW50X21vZGUgPSBmYWxzZTtcblxuICB2YXIgcGFja2FnZV9qc29uID0gcmVxdWlyZShvcHRzLmNtZCB8fCBvcHRzLnBhY2thZ2UpO1xuXG4gIC8qKlxuICAgKiBTY3JpcHQgZmlsZSBkZXRlY3Rpb25cbiAgICogMS0gKmFwcHMqIGZpZWxkIChkZWZhdWx0IHBtMiBqc29uIGNvbmZpZ3VyYXRpb24pXG4gICAqIDItICpiaW4qIGZpZWxkXG4gICAqIDMtICptYWluKiBmaWVsZFxuICAgKi9cbiAgaWYgKCFwYWNrYWdlX2pzb24uYXBwcyAmJiAhcGFja2FnZV9qc29uLnBtMikge1xuICAgIHBhY2thZ2VfanNvbi5hcHBzID0ge307XG5cbiAgICBpZiAocGFja2FnZV9qc29uLmJpbikge1xuICAgICAgdmFyIGJpbiA9IE9iamVjdC5rZXlzKHBhY2thZ2VfanNvbi5iaW4pWzBdO1xuICAgICAgcGFja2FnZV9qc29uLmFwcHMuc2NyaXB0ID0gcGFja2FnZV9qc29uLmJpbltiaW5dO1xuICAgIH1cbiAgICBlbHNlIGlmIChwYWNrYWdlX2pzb24ubWFpbikge1xuICAgICAgcGFja2FnZV9qc29uLmFwcHMuc2NyaXB0ID0gcGFja2FnZV9qc29uLm1haW47XG4gICAgfVxuICB9XG5cbiAgQ29tbW9uLmV4dGVuZChvcHRzLCB7XG4gICAgY3dkOiBvcHRzLnByb2NfcGF0aCxcbiAgICB3YXRjaDogb3B0cy5kZXZlbG9wbWVudF9tb2RlLFxuICAgIGZvcmNlX25hbWU6IHBhY2thZ2VfanNvbi5uYW1lLFxuICAgIHN0YXJ0ZWRfYXNfbW9kdWxlOiB0cnVlXG4gIH0pO1xuXG4gIC8vIFN0YXJ0IHRoZSBtb2R1bGVcbiAgQ0xJLnN0YXJ0KHBhY2thZ2VfanNvbiwgb3B0cywgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuXG4gICAgaWYgKG9wdHMuc2FmZSkge1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX01PRCArICdNb25pdG9yaW5nIG1vZHVsZSBiZWhhdmlvciBmb3IgcG90ZW50aWFsIGlzc3VlICg1c2Vjcy4uLiknKTtcblxuICAgICAgdmFyIHRpbWUgPSB0eXBlb2YgKG9wdHMuc2FmZSkgPT0gJ2Jvb2xlYW4nID8gMzAwMCA6IHBhcnNlSW50KG9wdHMuc2FmZSk7XG4gICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIENMSS5kZXNjcmliZShwYWNrYWdlX2pzb24ubmFtZSwgZnVuY3Rpb24gKGVyciwgYXBwcykge1xuICAgICAgICAgIGlmIChlcnIgfHwgYXBwc1swXS5wbTJfZW52LnJlc3RhcnRfdGltZSA+IDIpIHtcbiAgICAgICAgICAgIHJldHVybiBSb2xsYmFjay5yZXZlcnQoQ0xJLCBwYWNrYWdlX2pzb24ubmFtZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdOZXcgTW9kdWxlIGlzIGluc3RhYmxlLCByZXN0b3JlZCB0byBwcmV2aW91cyB2ZXJzaW9uJykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjYihudWxsLCBkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICB9LCB0aW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2IobnVsbCwgZGF0YSk7XG4gIH0pO1xufTtcblxuXG5cbnZhciBSb2xsYmFjayA9IHtcbiAgcmV2ZXJ0OiBmdW5jdGlvbiAoQ0xJLCBtb2R1bGVfbmFtZSwgY2IpIHtcbiAgICB2YXIgY2Fub25pY19tb2R1bGVfbmFtZSA9IFV0aWxpdHkuZ2V0Q2Fub25pY01vZHVsZU5hbWUobW9kdWxlX25hbWUpO1xuICAgIHZhciBiYWNrdXBfcGF0aCA9IHBhdGguam9pbihyZXF1aXJlKCdvcycpLnRtcGRpcigpLCBjYW5vbmljX21vZHVsZV9uYW1lKTtcbiAgICB2YXIgbW9kdWxlX3BhdGggPSBwYXRoLmpvaW4oY3N0LkRFRkFVTFRfTU9EVUxFX1BBVEgsIGNhbm9uaWNfbW9kdWxlX25hbWUpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGZzLnN0YXRTeW5jKGJhY2t1cF9wYXRoKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoJ25vIGJhY2t1cCBmb3VuZCcpKTtcbiAgICB9XG5cbiAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0dfTU9EICsgY2hhbGsuYm9sZC5yZWQoJ1tbW1tbIE1vZHVsZSBpbnN0YWxsYXRpb24gZmFpbHVyZSEgXV1dXV0nKSk7XG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX01PRCArIGNoYWxrLmJvbGQucmVkKCdbUkVTVE9SSU5HIFRPIFBSRVZJT1VTIFZFUlNJT05dJykpO1xuXG4gICAgQ0xJLmRlbGV0ZU1vZHVsZShjYW5vbmljX21vZHVsZV9uYW1lLCBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBEZWxldGUgZmFpbGluZyBtb2R1bGVcblxuICAgICAgaWYgKG1vZHVsZV9uYW1lLmluY2x1ZGVzKCdtb2R1bGVzJykgPT09IHRydWUpXG4gICAgICAgIGRlbGV0ZUZvbGRlclJlY3Vyc2l2ZShtb2R1bGVfcGF0aClcbiAgICAgIC8vIFJlc3RvcmUgd29ya2luZyB2ZXJzaW9uXG4gICAgICBjb3B5ZGlyU3luYyhiYWNrdXBfcGF0aCwgcGF0aC5qb2luKGNzdC5ERUZBVUxUX01PRFVMRV9QQVRILCBjYW5vbmljX21vZHVsZV9uYW1lKSk7XG5cbiAgICAgIHZhciBwcm9jX3BhdGggPSBwYXRoLmpvaW4obW9kdWxlX3BhdGgsICdub2RlX21vZHVsZXMnLCBjYW5vbmljX21vZHVsZV9uYW1lKTtcbiAgICAgIHZhciBwYWNrYWdlX2pzb25fcGF0aCA9IHBhdGguam9pbihwcm9jX3BhdGgsICdwYWNrYWdlLmpzb24nKTtcblxuICAgICAgLy8gU3RhcnQgbW9kdWxlXG4gICAgICBTdGFydE1vZHVsZShDTEksIHtcbiAgICAgICAgY21kOiBwYWNrYWdlX2pzb25fcGF0aCxcbiAgICAgICAgZGV2ZWxvcG1lbnRfbW9kZTogZmFsc2UsXG4gICAgICAgIHByb2NfcGF0aDogcHJvY19wYXRoXG4gICAgICB9LCBjYik7XG4gICAgfSk7XG4gIH0sXG4gIGJhY2t1cDogZnVuY3Rpb24gKG1vZHVsZV9uYW1lKSB7XG4gICAgLy8gQmFja3VwIGN1cnJlbnQgbW9kdWxlXG4gICAgdmFyIHRtcGRpciA9IHJlcXVpcmUoJ29zJykudG1wZGlyKCk7XG4gICAgdmFyIGNhbm9uaWNfbW9kdWxlX25hbWUgPSBVdGlsaXR5LmdldENhbm9uaWNNb2R1bGVOYW1lKG1vZHVsZV9uYW1lKTtcbiAgICB2YXIgbW9kdWxlX3BhdGggPSBwYXRoLmpvaW4oY3N0LkRFRkFVTFRfTU9EVUxFX1BBVEgsIGNhbm9uaWNfbW9kdWxlX25hbWUpO1xuICAgIGNvcHlkaXJTeW5jKG1vZHVsZV9wYXRoLCBwYXRoLmpvaW4odG1wZGlyLCBjYW5vbmljX21vZHVsZV9uYW1lKSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBpbnN0YWxsLFxuICB1bmluc3RhbGwsXG4gIHN0YXJ0LFxuICBwdWJsaXNoLFxuICBnZW5lcmF0ZVNhbXBsZSxcbiAgbG9jYWxTdGFydCxcbiAgZ2V0TW9kdWxlQ29uZlxufVxuIl19