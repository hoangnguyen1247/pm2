"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Configuration = _interopRequireDefault(require("../../Configuration"));

var _constants = _interopRequireDefault(require("../../../constants"));

var _Common = _interopRequireDefault(require("../../Common"));

var _forEachLimit = _interopRequireDefault(require("async/forEachLimit"));

var _sexec = _interopRequireDefault(require("../../tools/sexec"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _os = _interopRequireDefault(require("os"));

var _child_process = require("child_process");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Module management to manage tarball packages
 *
 * pm2 install http.tar.gz
 * pm2 uninstall http
 *
 * - the first and only folder in the tarball must be called module (tar zcvf http module/)
 * - a package.json must be present with attribute "name", "version" and "pm2" to declare apps to run
 */
function install(PM2, module_filepath, opts, cb) {
  // Remote file retrieval
  if (module_filepath.includes('http') === true) {
    var target_file = module_filepath.split('/').pop();

    var target_filepath = _path["default"].join(_os["default"].tmpdir(), target_file);

    opts.install_url = module_filepath;
    return retrieveRemote(module_filepath, target_filepath, function (err) {
      if (err) {
        _Common["default"].errMod(err);

        process.exit(1);
      }

      installLocal(PM2, target_filepath, opts, cb);
    });
  } // Local install


  installLocal(PM2, module_filepath, opts, cb);
}

function retrieveRemote(url, dest, cb) {
  _Common["default"].logMod("Retrieving remote package ".concat(url, "..."));

  var wget = (0, _child_process.spawn)('wget', [url, '-O', dest, '-q'], {
    stdio: 'inherit',
    env: process.env,
    shell: true
  });
  wget.on('error', function (err) {
    console.error(err.stack || err);
  });
  wget.on('close', function (code) {
    if (code !== 0) return cb(new Error('Could not download'));
    return cb(null);
  });
}

function installLocal(PM2, module_filepath, opts, cb) {
  _Common["default"].logMod("Installing package ".concat(module_filepath)); // Get module name by unpacking the module/package.json only and read the name attribute


  getModuleName(module_filepath, function (err, module_name) {
    if (err) return cb(err);

    _Common["default"].logMod("Module name is ".concat(module_name));

    _Common["default"].logMod("Depackaging module...");

    var install_path = _path["default"].join(_constants["default"].DEFAULT_MODULE_PATH, module_name);

    require('mkdirp').sync(install_path);

    var install_instance = (0, _child_process.spawn)('tar', ['zxf', module_filepath, '-C', install_path, '--strip-components 1'], {
      stdio: 'inherit',
      env: process.env,
      shell: true
    });
    install_instance.on('close', function (code) {
      _Common["default"].logMod("Module depackaged in ".concat(install_path));

      if (code == 0) return runInstall(PM2, install_path, module_name, opts, cb);
      return PM2.exitCli(1);
    });
    install_instance.on('error', function (err) {
      console.error(err.stack || err);
    });
  });
}

function deleteModulePath(module_name) {
  var sanitized = module_name.replace(/\./g, '');
  (0, _child_process.execSync)("rm -r ".concat(_path["default"].join(_constants["default"].DEFAULT_MODULE_PATH, module_name)), {
    silent: true
  });
}

function runInstall(PM2, target_path, module_name, opts, cb) {
  var config_file = _path["default"].join(target_path, 'package.json');

  var conf;

  try {
    conf = require(config_file);
    module_name = conf.name;
  } catch (e) {
    _Common["default"].errMod(new Error('Cannot find package.json file with name attribute at least'));
  } // Force with the name in the package.json


  opts.started_as_module = true;
  opts.cwd = target_path;
  if (needPrefix(conf)) opts.name_prefix = module_name;

  if (opts.install) {
    _Common["default"].logMod("Running YARN install...");

    (0, _sexec["default"])("cd ".concat(target_path, " ; yarn install"), {
      silent: false
    }, function (code) {
      // Start apps under "apps" or "pm2" attribute
      _Common["default"].logMod("Starting ".concat(target_path));

      PM2.start(conf, opts, function (err, data) {
        if (err) return cb(err);

        _Configuration["default"].setSync("".concat(_constants["default"].MODULE_CONF_PREFIX_TAR, ":").concat(module_name), {
          source: 'tarball',
          install_url: opts.install_url,
          installed_at: Date.now()
        });

        _Common["default"].logMod("Module INSTALLED and STARTED");

        return cb(null, 'Module installed & Started');
      });
    });
  } else {
    PM2.start(conf, opts, function (err, data) {
      if (err) return cb(err);

      _Configuration["default"].setSync("".concat(_constants["default"].MODULE_CONF_PREFIX_TAR, ":").concat(module_name), {
        source: 'tarball',
        install_url: opts.install_url,
        installed_at: Date.now()
      });

      _Common["default"].logMod("Module INSTALLED and STARTED");

      return cb(null, 'Module installed & Started');
    });
  }
}

function start(PM2, module_name, cb) {
  var module_path = _path["default"].join(_constants["default"].DEFAULT_MODULE_PATH, module_name);

  _Common["default"].printOut(_constants["default"].PREFIX_MSG_MOD + 'Starting TAR module ' + module_name);

  var package_json_path = _path["default"].join(module_path, 'package.json');

  var module_conf = _Configuration["default"].getSync("".concat(_constants["default"].MODULE_CONF_PREFIX_TAR, ":").concat(module_name));

  try {
    var conf = require(package_json_path);
  } catch (e) {
    _Common["default"].printError("Could not find package.json as ".concat(package_json_path));

    return cb();
  }

  var opts = {};
  opts.started_as_module = true;
  opts.cwd = module_path;
  if (module_conf.install_url) opts.install_url = module_conf.install_url;
  if (needPrefix(conf)) opts.name_prefix = module_name;
  PM2.start(conf, opts, function (err, data) {
    if (err) {
      _Common["default"].printError("Could not start ".concat(module_name, " ").concat(module_path));

      return cb();
    }

    _Common["default"].printOut("".concat(_constants["default"].PREFIX_MSG_MOD, " Module ").concat(module_name, " STARTED"));

    return cb();
  });
}
/**
 * Retrieve from module package.json the name of each application
 * delete process and delete folder
 */


function uninstall(PM2, module_name, cb) {
  var module_path = _path["default"].join(_constants["default"].DEFAULT_MODULE_PATH, module_name);

  _Common["default"].logMod("Removing ".concat(module_name, " from auto startup"));

  try {
    var pkg = require(_path["default"].join(module_path, 'package.json'));
  } catch (e) {
    _Common["default"].errMod('Could not retrieve module package.json');

    return cb(e);
  }

  var apps = pkg.apps || pkg.pm2;
  apps = [].concat(apps);
  /**
   * Some time a module can have multiple processes
   */

  (0, _forEachLimit["default"])(apps, 1, function (app, next) {
    var app_name;

    if (!app.name) {
      _Common["default"].renderApplicationName(app);
    }

    if (apps.length > 1) app_name = "".concat(module_name, ":").concat(app.name);else if (apps.length == 1 && pkg.name != apps[0].name) app_name = "".concat(module_name, ":").concat(app.name);else app_name = app.name;

    PM2._operate('deleteProcessId', app_name, function () {
      deleteModulePath(module_name);
      next();
    });
  }, function () {
    _Configuration["default"].unsetSync("".concat(_constants["default"].MODULE_CONF_PREFIX_TAR, ":").concat(module_name));

    cb(null);
  });
}
/**
 * Uncompress only module/package.json and retrieve the "name" attribute in the package.json
 */


function getModuleName(module_filepath, cb) {
  var tmp_folder = _path["default"].join(_os["default"].tmpdir(), _constants["default"].MODULE_BASEFOLDER);

  var install_instance = (0, _child_process.spawn)('tar', ['zxf', module_filepath, '-C', _os["default"].tmpdir(), "".concat(_constants["default"].MODULE_BASEFOLDER, "/package.json")], {
    stdio: 'inherit',
    env: process.env,
    shell: true
  });
  install_instance.on('close', function (code) {
    try {
      var pkg = JSON.parse(_fs["default"].readFileSync(_path["default"].join(tmp_folder, "package.json"), "utf8"));
      return cb(null, pkg.name);
    } catch (e) {
      return cb(e);
    }
  });
}

function package1(module_path, target_path, cb) {
  var base_folder = _path["default"].dirname(module_path);

  var module_folder_name = _path["default"].basename(module_path);

  var pkg = require(_path["default"].join(module_path, 'package.json'));

  var pkg_name = "".concat(module_folder_name, "-v").concat(pkg.version.replace(/\./g, '-'), ".tar.gz");

  var target_fullpath = _path["default"].join(target_path, pkg_name);

  var cmd = "tar zcf ".concat(target_fullpath, " -C ").concat(base_folder, " --transform 's,").concat(module_folder_name, ",module,' ").concat(module_folder_name);

  _Common["default"].logMod("Gziping ".concat(module_path, " to ").concat(target_fullpath));

  var tar = (0, _child_process.exec)(cmd, function (err, sto, ste) {
    if (err) {
      console.log(sto.toString().trim());
      console.log(ste.toString().trim());
    }
  });
  tar.on('close', function (code) {
    cb(code == 0 ? null : code, {
      package_name: pkg_name,
      path: target_fullpath
    });
  });
}

function publish(PM2, folder, cb) {
  var target_folder = folder ? _path["default"].resolve(folder) : process.cwd();

  try {
    var pkg = JSON.parse(_fs["default"].readFileSync(_path["default"].join(target_folder, 'package.json')).toString());
  } catch (e) {
    _Common["default"].errMod("".concat(process.cwd(), " module does not contain any package.json"));

    process.exit(1);
  }

  if (!pkg.name) throw new Error('Attribute name should be present');
  if (!pkg.version) throw new Error('Attribute version should be present');
  if (!pkg.pm2 && !pkg.apps) throw new Error('Attribute apps should be present');
  var current_path = target_folder;

  var module_name = _path["default"].basename(current_path);

  var target_path = _os["default"].tmpdir();

  _Common["default"].logMod("Starting publishing procedure for ".concat(module_name, "@").concat(pkg.version));

  package1(current_path, target_path, function (err, res) {
    if (err) {
      _Common["default"].errMod('Can\'t package, exiting');

      process.exit(1);
    }

    _Common["default"].logMod("Package [".concat(pkg.name, "] created in path ").concat(res.path));

    var data = {
      module_data: {
        file: res.path,
        content_type: 'content/gzip'
      },
      id: pkg.name,
      name: pkg.name,
      version: pkg.version
    };
    var uri = "".concat(PM2.pm2_configuration.registry, "/api/v1/modules");

    _Common["default"].logMod("Sending Package to remote ".concat(pkg.name, " ").concat(uri));

    require('needle').post(uri, data, {
      multipart: true
    }, function (err, res, body) {
      if (err) {
        _Common["default"].errMod(err);

        process.exit(1);
      }

      if (res.statusCode !== 200) {
        _Common["default"].errMod("".concat(pkg.name, "-").concat(pkg.version, ": ").concat(res.body.msg));

        process.exit(1);
      }

      _Common["default"].logMod("Module ".concat(module_name, " published under version ").concat(pkg.version));

      process.exit(0);
    });
  });
}

function needPrefix(conf) {
  if (conf.apps && conf.apps.length > 1 || conf.pm2 && conf.pm2.length > 1 || conf.apps.length == 1 && conf.name != conf.apps[0].name) return true;
  return false;
}

var _default = {
  install: install,
  uninstall: uninstall,
  start: start,
  publish: publish,
  package1: package1
};
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvTW9kdWxlcy9UQVIudHMiXSwibmFtZXMiOlsiaW5zdGFsbCIsIlBNMiIsIm1vZHVsZV9maWxlcGF0aCIsIm9wdHMiLCJjYiIsImluY2x1ZGVzIiwidGFyZ2V0X2ZpbGUiLCJzcGxpdCIsInBvcCIsInRhcmdldF9maWxlcGF0aCIsInBhdGgiLCJqb2luIiwib3MiLCJ0bXBkaXIiLCJpbnN0YWxsX3VybCIsInJldHJpZXZlUmVtb3RlIiwiZXJyIiwiQ29tbW9uIiwiZXJyTW9kIiwicHJvY2VzcyIsImV4aXQiLCJpbnN0YWxsTG9jYWwiLCJ1cmwiLCJkZXN0IiwibG9nTW9kIiwid2dldCIsInN0ZGlvIiwiZW52Iiwic2hlbGwiLCJvbiIsImNvbnNvbGUiLCJlcnJvciIsInN0YWNrIiwiY29kZSIsIkVycm9yIiwiZ2V0TW9kdWxlTmFtZSIsIm1vZHVsZV9uYW1lIiwiaW5zdGFsbF9wYXRoIiwiY3N0IiwiREVGQVVMVF9NT0RVTEVfUEFUSCIsInJlcXVpcmUiLCJzeW5jIiwiaW5zdGFsbF9pbnN0YW5jZSIsInJ1bkluc3RhbGwiLCJleGl0Q2xpIiwiZGVsZXRlTW9kdWxlUGF0aCIsInNhbml0aXplZCIsInJlcGxhY2UiLCJzaWxlbnQiLCJ0YXJnZXRfcGF0aCIsImNvbmZpZ19maWxlIiwiY29uZiIsIm5hbWUiLCJlIiwic3RhcnRlZF9hc19tb2R1bGUiLCJjd2QiLCJuZWVkUHJlZml4IiwibmFtZV9wcmVmaXgiLCJzdGFydCIsImRhdGEiLCJDb25maWd1cmF0aW9uIiwic2V0U3luYyIsIk1PRFVMRV9DT05GX1BSRUZJWF9UQVIiLCJzb3VyY2UiLCJpbnN0YWxsZWRfYXQiLCJEYXRlIiwibm93IiwibW9kdWxlX3BhdGgiLCJwcmludE91dCIsIlBSRUZJWF9NU0dfTU9EIiwicGFja2FnZV9qc29uX3BhdGgiLCJtb2R1bGVfY29uZiIsImdldFN5bmMiLCJwcmludEVycm9yIiwidW5pbnN0YWxsIiwicGtnIiwiYXBwcyIsInBtMiIsImNvbmNhdCIsImFwcCIsIm5leHQiLCJhcHBfbmFtZSIsInJlbmRlckFwcGxpY2F0aW9uTmFtZSIsImxlbmd0aCIsIl9vcGVyYXRlIiwidW5zZXRTeW5jIiwidG1wX2ZvbGRlciIsIk1PRFVMRV9CQVNFRk9MREVSIiwiSlNPTiIsInBhcnNlIiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJwYWNrYWdlMSIsImJhc2VfZm9sZGVyIiwiZGlybmFtZSIsIm1vZHVsZV9mb2xkZXJfbmFtZSIsImJhc2VuYW1lIiwicGtnX25hbWUiLCJ2ZXJzaW9uIiwidGFyZ2V0X2Z1bGxwYXRoIiwiY21kIiwidGFyIiwic3RvIiwic3RlIiwibG9nIiwidG9TdHJpbmciLCJ0cmltIiwicGFja2FnZV9uYW1lIiwicHVibGlzaCIsImZvbGRlciIsInRhcmdldF9mb2xkZXIiLCJyZXNvbHZlIiwiY3VycmVudF9wYXRoIiwicmVzIiwibW9kdWxlX2RhdGEiLCJmaWxlIiwiY29udGVudF90eXBlIiwiaWQiLCJ1cmkiLCJwbTJfY29uZmlndXJhdGlvbiIsInJlZ2lzdHJ5IiwicG9zdCIsIm11bHRpcGFydCIsImJvZHkiLCJzdGF0dXNDb2RlIiwibXNnIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFJQTs7Ozs7Ozs7O0FBVUEsU0FBU0EsT0FBVCxDQUFpQkMsR0FBakIsRUFBc0JDLGVBQXRCLEVBQXVDQyxJQUF2QyxFQUE2Q0MsRUFBN0MsRUFBaUQ7QUFDL0M7QUFDQSxNQUFJRixlQUFlLENBQUNHLFFBQWhCLENBQXlCLE1BQXpCLE1BQXFDLElBQXpDLEVBQStDO0FBQzdDLFFBQUlDLFdBQVcsR0FBR0osZUFBZSxDQUFDSyxLQUFoQixDQUFzQixHQUF0QixFQUEyQkMsR0FBM0IsRUFBbEI7O0FBQ0EsUUFBSUMsZUFBZSxHQUFHQyxpQkFBS0MsSUFBTCxDQUFVQyxlQUFHQyxNQUFILEVBQVYsRUFBdUJQLFdBQXZCLENBQXRCOztBQUVBSCxJQUFBQSxJ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O0FBYUQsR0FsQ08sQ0FBUjtBQW1DRDs7QUFFRCxTQUFTb0MsVUFBVCxDQUFvQkwsSUFBcEIsRUFBMEI7QUFDeEIsTUFBS0EsSUFBSSxDQUFDeUIsSUFBTCxJQUFhekIsSUFBSSxDQUFDeUIsSUFBTCxDQUFVTyxNQUFWLEdBQW1CLENBQWpDLElBQ0NoQyxJQUFJLENBQUMwQixHQUFMLElBQVkxQixJQUFJLENBQUMwQixHQUFMLENBQVNNLE1BQVQsR0FBa0IsQ0FEL0IsSUFFQ2hDLElBQUksQ0FBQ3lCLElBQUwsQ0FBVU8sTUFBVixJQUFvQixDQUFwQixJQUF5QmhDLElBQUksQ0FBQ0MsSUFBTCxJQUFhRCxJQUFJLENBQUN5QixJQUFMLENBQVUsQ0FBVixFQUFheEIsSUFGeEQsRUFHRSxPQUFPLElBQVA7QUFDRixTQUFPLEtBQVA7QUFDRDs7ZUFFYztBQUNicEQsRUFBQUEsT0FBTyxFQUFQQSxPQURhO0FBRWIwRSxFQUFBQSxTQUFTLEVBQVRBLFNBRmE7QUFHYmhCLEVBQUFBLEtBQUssRUFBTEEsS0FIYTtBQUlia0QsRUFBQUEsT0FBTyxFQUFQQSxPQUphO0FBS2JoQixFQUFBQSxRQUFRLEVBQVJBO0FBTGEsQyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgQ29uZmlndXJhdGlvbiBmcm9tICcuLi8uLi9Db25maWd1cmF0aW9uJztcclxuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi8uLi9jb25zdGFudHMnO1xyXG5pbXBvcnQgQ29tbW9uIGZyb20gJy4uLy4uL0NvbW1vbic7XHJcbmltcG9ydCBmb3JFYWNoTGltaXQgIGZyb20gJ2FzeW5jL2ZvckVhY2hMaW1pdCc7XHJcbmltcG9ydCBzZXhlYyBmcm9tICcuLi8uLi90b29scy9zZXhlYydcclxuXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xyXG5pbXBvcnQgeyBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5pbXBvcnQgeyBleGVjIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XHJcbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XHJcblxyXG4vKipcclxuICogTW9kdWxlIG1hbmFnZW1lbnQgdG8gbWFuYWdlIHRhcmJhbGwgcGFja2FnZXNcclxuICpcclxuICogcG0yIGluc3RhbGwgaHR0cC50YXIuZ3pcclxuICogcG0yIHVuaW5zdGFsbCBodHRwXHJcbiAqXHJcbiAqIC0gdGhlIGZpcnN0IGFuZCBvbmx5IGZvbGRlciBpbiB0aGUgdGFyYmFsbCBtdXN0IGJlIGNhbGxlZCBtb2R1bGUgKHRhciB6Y3ZmIGh0dHAgbW9kdWxlLylcclxuICogLSBhIHBhY2thZ2UuanNvbiBtdXN0IGJlIHByZXNlbnQgd2l0aCBhdHRyaWJ1dGUgXCJuYW1lXCIsIFwidmVyc2lvblwiIGFuZCBcInBtMlwiIHRvIGRlY2xhcmUgYXBwcyB0byBydW5cclxuICovXHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsKFBNMiwgbW9kdWxlX2ZpbGVwYXRoLCBvcHRzLCBjYikge1xyXG4gIC8vIFJlbW90ZSBmaWxlIHJldHJpZXZhbFxyXG4gIGlmIChtb2R1bGVfZmlsZXBhdGguaW5jbHVkZXMoJ2h0dHAnKSA9PT0gdHJ1ZSkge1xyXG4gICAgdmFyIHRhcmdldF9maWxlID0gbW9kdWxlX2ZpbGVwYXRoLnNwbGl0KCcvJykucG9wKClcclxuICAgIHZhciB0YXJnZXRfZmlsZXBhdGggPSBwYXRoLmpvaW4ob3MudG1wZGlyKCksIHRhcmdldF9maWxlKVxyXG5cclxuICAgIG9wdHMuaW5zdGFsbF91cmwgPSBtb2R1bGVfZmlsZXBhdGhcclxuXHJcbiAgICByZXR1cm4gcmV0cmlldmVSZW1vdGUobW9kdWxlX2ZpbGVwYXRoLCB0YXJnZXRfZmlsZXBhdGgsIChlcnIpID0+IHtcclxuICAgICAgaWYgKGVycikge1xyXG4gICAgICAgIENvbW1vbi5lcnJNb2QoZXJyKVxyXG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKVxyXG4gICAgICB9XHJcbiAgICAgIGluc3RhbGxMb2NhbChQTTIsIHRhcmdldF9maWxlcGF0aCwgb3B0cywgY2IpXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgLy8gTG9jYWwgaW5zdGFsbFxyXG4gIGluc3RhbGxMb2NhbChQTTIsIG1vZHVsZV9maWxlcGF0aCwgb3B0cywgY2IpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJldHJpZXZlUmVtb3RlKHVybCwgZGVzdCwgY2IpIHtcclxuICBDb21tb24ubG9nTW9kKGBSZXRyaWV2aW5nIHJlbW90ZSBwYWNrYWdlICR7dXJsfS4uLmApXHJcblxyXG4gIHZhciB3Z2V0ID0gc3Bhd24oJ3dnZXQnLCBbdXJsLCAnLU8nLCBkZXN0LCAnLXEnXSwge1xyXG4gICAgc3RkaW8gOiAnaW5oZXJpdCcsXHJcbiAgICBlbnY6IHByb2Nlc3MuZW52LFxyXG5cdFx0c2hlbGwgOiB0cnVlXHJcbiAgfSlcclxuXHJcbiAgd2dldC5vbignZXJyb3InLCAoZXJyKSA9PiB7XHJcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayB8fCBlcnIpXHJcbiAgfSlcclxuXHJcbiAgd2dldC5vbignY2xvc2UnLCAoY29kZSkgPT4ge1xyXG4gICAgaWYgKGNvZGUgIT09IDApXHJcbiAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoJ0NvdWxkIG5vdCBkb3dubG9hZCcpKVxyXG4gICAgcmV0dXJuIGNiKG51bGwpXHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbExvY2FsKFBNMiwgbW9kdWxlX2ZpbGVwYXRoLCBvcHRzLCBjYikge1xyXG4gIENvbW1vbi5sb2dNb2QoYEluc3RhbGxpbmcgcGFja2FnZSAke21vZHVsZV9maWxlcGF0aH1gKVxyXG5cclxuICAvLyBHZXQgbW9kdWxlIG5hbWUgYnkgdW5wYWNraW5nIHRoZSBtb2R1bGUvcGFja2FnZS5qc29uIG9ubHkgYW5kIHJlYWQgdGhlIG5hbWUgYXR0cmlidXRlXHJcbiAgZ2V0TW9kdWxlTmFtZShtb2R1bGVfZmlsZXBhdGgsIGZ1bmN0aW9uKGVyciwgbW9kdWxlX25hbWUpIHtcclxuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpXHJcblxyXG4gICAgQ29tbW9uLmxvZ01vZChgTW9kdWxlIG5hbWUgaXMgJHttb2R1bGVfbmFtZX1gKVxyXG5cclxuICAgIENvbW1vbi5sb2dNb2QoYERlcGFja2FnaW5nIG1vZHVsZS4uLmApXHJcblxyXG4gICAgdmFyIGluc3RhbGxfcGF0aCA9IHBhdGguam9pbihjc3QuREVGQVVMVF9NT0RVTEVfUEFUSCwgbW9kdWxlX25hbWUpO1xyXG5cclxuICAgIHJlcXVpcmUoJ21rZGlycCcpLnN5bmMoaW5zdGFsbF9wYXRoKVxyXG5cclxuICAgIHZhciBpbnN0YWxsX2luc3RhbmNlID0gc3Bhd24oJ3RhcicsIFsnenhmJywgbW9kdWxlX2ZpbGVwYXRoLCAnLUMnLCBpbnN0YWxsX3BhdGgsICctLXN0cmlwLWNvbXBvbmVudHMgMSddLCB7XHJcbiAgICAgIHN0ZGlvIDogJ2luaGVyaXQnLFxyXG4gICAgICBlbnY6IHByb2Nlc3MuZW52LFxyXG5cdFx0ICBzaGVsbCA6IHRydWVcclxuICAgIH0pXHJcblxyXG4gICAgaW5zdGFsbF9pbnN0YW5jZS5vbignY2xvc2UnLCBmdW5jdGlvbihjb2RlKSB7XHJcbiAgICAgIENvbW1vbi5sb2dNb2QoYE1vZHVsZSBkZXBhY2thZ2VkIGluICR7aW5zdGFsbF9wYXRofWApXHJcbiAgICAgIGlmIChjb2RlID09IDApXHJcbiAgICAgICAgcmV0dXJuIHJ1bkluc3RhbGwoUE0yLCBpbnN0YWxsX3BhdGgsIG1vZHVsZV9uYW1lLCBvcHRzLCBjYilcclxuICAgICAgcmV0dXJuIFBNMi5leGl0Q2xpKDEpXHJcbiAgICB9KTtcclxuXHJcbiAgICBpbnN0YWxsX2luc3RhbmNlLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2sgfHwgZXJyKTtcclxuICAgIH0pO1xyXG4gIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlbGV0ZU1vZHVsZVBhdGgobW9kdWxlX25hbWUpIHtcclxuICB2YXIgc2FuaXRpemVkID0gbW9kdWxlX25hbWUucmVwbGFjZSgvXFwuL2csICcnKVxyXG4gIGV4ZWNTeW5jKGBybSAtciAke3BhdGguam9pbihjc3QuREVGQVVMVF9NT0RVTEVfUEFUSCwgbW9kdWxlX25hbWUpfWAsIHsgc2lsZW50OiB0cnVlIH0gYXMgYW55KVxyXG59XHJcblxyXG5mdW5jdGlvbiBydW5JbnN0YWxsKFBNMiwgdGFyZ2V0X3BhdGgsIG1vZHVsZV9uYW1lLCBvcHRzLCBjYikge1xyXG4gIHZhciBjb25maWdfZmlsZSA9IHBhdGguam9pbih0YXJnZXRfcGF0aCwgJ3BhY2thZ2UuanNvbicpXHJcbiAgdmFyIGNvbmZcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbmYgPSByZXF1aXJlKGNvbmZpZ19maWxlKVxyXG4gICAgbW9kdWxlX25hbWUgPSBjb25mLm5hbWVcclxuICB9IGNhdGNoKGUpIHtcclxuICAgIENvbW1vbi5lcnJNb2QobmV3IEVycm9yKCdDYW5ub3QgZmluZCBwYWNrYWdlLmpzb24gZmlsZSB3aXRoIG5hbWUgYXR0cmlidXRlIGF0IGxlYXN0JykpO1xyXG4gIH1cclxuXHJcbiAgLy8gRm9yY2Ugd2l0aCB0aGUgbmFtZSBpbiB0aGUgcGFja2FnZS5qc29uXHJcbiAgb3B0cy5zdGFydGVkX2FzX21vZHVsZSA9IHRydWVcclxuICBvcHRzLmN3ZCA9IHRhcmdldF9wYXRoXHJcblxyXG4gIGlmIChuZWVkUHJlZml4KGNvbmYpKVxyXG4gICAgb3B0cy5uYW1lX3ByZWZpeCA9IG1vZHVsZV9uYW1lXHJcblxyXG4gIGlmIChvcHRzLmluc3RhbGwpIHtcclxuICAgIENvbW1vbi5sb2dNb2QoYFJ1bm5pbmcgWUFSTiBpbnN0YWxsLi4uYClcclxuXHJcbiAgICBzZXhlYyhgY2QgJHt0YXJnZXRfcGF0aH0gOyB5YXJuIGluc3RhbGxgLCB7c2lsZW50OiBmYWxzZX0sIGZ1bmN0aW9uKGNvZGUpIHtcclxuICAgICAgLy8gU3RhcnQgYXBwcyB1bmRlciBcImFwcHNcIiBvciBcInBtMlwiIGF0dHJpYnV0ZVxyXG4gICAgICBDb21tb24ubG9nTW9kKGBTdGFydGluZyAke3RhcmdldF9wYXRofWApXHJcbiAgICAgIFBNMi5zdGFydChjb25mLCBvcHRzLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcclxuICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxyXG5cclxuICAgICAgICBDb25maWd1cmF0aW9uLnNldFN5bmMoYCR7Y3N0Lk1PRFVMRV9DT05GX1BSRUZJWF9UQVJ9OiR7bW9kdWxlX25hbWV9YCwge1xyXG4gICAgICAgICAgc291cmNlOiAndGFyYmFsbCcsXHJcbiAgICAgICAgICBpbnN0YWxsX3VybDogb3B0cy5pbnN0YWxsX3VybCxcclxuICAgICAgICAgIGluc3RhbGxlZF9hdDogRGF0ZS5ub3coKVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIENvbW1vbi5sb2dNb2QoYE1vZHVsZSBJTlNUQUxMRUQgYW5kIFNUQVJURURgKVxyXG4gICAgICAgIHJldHVybiBjYihudWxsLCAnTW9kdWxlIGluc3RhbGxlZCAmIFN0YXJ0ZWQnKVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBQTTIuc3RhcnQoY29uZiwgb3B0cywgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XHJcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpXHJcblxyXG4gICAgICBDb25maWd1cmF0aW9uLnNldFN5bmMoYCR7Y3N0Lk1PRFVMRV9DT05GX1BSRUZJWF9UQVJ9OiR7bW9kdWxlX25hbWV9YCwge1xyXG4gICAgICAgIHNvdXJjZTogJ3RhcmJhbGwnLFxyXG4gICAgICAgIGluc3RhbGxfdXJsOiBvcHRzLmluc3RhbGxfdXJsLFxyXG4gICAgICAgIGluc3RhbGxlZF9hdDogRGF0ZS5ub3coKVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgQ29tbW9uLmxvZ01vZChgTW9kdWxlIElOU1RBTExFRCBhbmQgU1RBUlRFRGApXHJcbiAgICAgIHJldHVybiBjYihudWxsLCAnTW9kdWxlIGluc3RhbGxlZCAmIFN0YXJ0ZWQnKVxyXG4gICAgfSlcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0YXJ0KFBNMiwgbW9kdWxlX25hbWUsIGNiKSB7XHJcbiAgdmFyIG1vZHVsZV9wYXRoID0gcGF0aC5qb2luKGNzdC5ERUZBVUxUX01PRFVMRV9QQVRILCBtb2R1bGVfbmFtZSk7XHJcbiAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX01PRCArICdTdGFydGluZyBUQVIgbW9kdWxlICcgKyBtb2R1bGVfbmFtZSk7XHJcbiAgdmFyIHBhY2thZ2VfanNvbl9wYXRoID0gcGF0aC5qb2luKG1vZHVsZV9wYXRoLCAncGFja2FnZS5qc29uJyk7XHJcbiAgdmFyIG1vZHVsZV9jb25mID0gQ29uZmlndXJhdGlvbi5nZXRTeW5jKGAke2NzdC5NT0RVTEVfQ09ORl9QUkVGSVhfVEFSfToke21vZHVsZV9uYW1lfWApXHJcblxyXG4gIHRyeSB7XHJcbiAgICB2YXIgY29uZiA9IHJlcXVpcmUocGFja2FnZV9qc29uX3BhdGgpXHJcbiAgfSBjYXRjaChlKSB7XHJcbiAgICBDb21tb24ucHJpbnRFcnJvcihgQ291bGQgbm90IGZpbmQgcGFja2FnZS5qc29uIGFzICR7cGFja2FnZV9qc29uX3BhdGh9YClcclxuICAgIHJldHVybiBjYigpXHJcbiAgfVxyXG5cclxuICB2YXIgb3B0czphbnkgPSB7fTtcclxuXHJcbiAgb3B0cy5zdGFydGVkX2FzX21vZHVsZSA9IHRydWVcclxuICBvcHRzLmN3ZCA9IG1vZHVsZV9wYXRoXHJcblxyXG4gIGlmIChtb2R1bGVfY29uZi5pbnN0YWxsX3VybClcclxuICAgIG9wdHMuaW5zdGFsbF91cmwgPSBtb2R1bGVfY29uZi5pbnN0YWxsX3VybFxyXG5cclxuICBpZiAobmVlZFByZWZpeChjb25mKSlcclxuICAgIG9wdHMubmFtZV9wcmVmaXggPSBtb2R1bGVfbmFtZVxyXG5cclxuICBQTTIuc3RhcnQoY29uZiwgb3B0cywgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XHJcbiAgICBpZiAoZXJyKSB7XHJcbiAgICAgIENvbW1vbi5wcmludEVycm9yKGBDb3VsZCBub3Qgc3RhcnQgJHttb2R1bGVfbmFtZX0gJHttb2R1bGVfcGF0aH1gKVxyXG4gICAgICByZXR1cm4gY2IoKVxyXG4gICAgfVxyXG5cclxuICAgIENvbW1vbi5wcmludE91dChgJHtjc3QuUFJFRklYX01TR19NT0R9IE1vZHVsZSAke21vZHVsZV9uYW1lfSBTVEFSVEVEYClcclxuICAgIHJldHVybiBjYigpO1xyXG4gIH0pXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXRyaWV2ZSBmcm9tIG1vZHVsZSBwYWNrYWdlLmpzb24gdGhlIG5hbWUgb2YgZWFjaCBhcHBsaWNhdGlvblxyXG4gKiBkZWxldGUgcHJvY2VzcyBhbmQgZGVsZXRlIGZvbGRlclxyXG4gKi9cclxuZnVuY3Rpb24gdW5pbnN0YWxsKFBNMiwgbW9kdWxlX25hbWUsIGNiKSB7XHJcbiAgdmFyIG1vZHVsZV9wYXRoID0gcGF0aC5qb2luKGNzdC5ERUZBVUxUX01PRFVMRV9QQVRILCBtb2R1bGVfbmFtZSk7XHJcblxyXG4gIENvbW1vbi5sb2dNb2QoYFJlbW92aW5nICR7bW9kdWxlX25hbWV9IGZyb20gYXV0byBzdGFydHVwYClcclxuXHJcbiAgdHJ5IHtcclxuICAgIHZhciBwa2cgPSByZXF1aXJlKHBhdGguam9pbihtb2R1bGVfcGF0aCwgJ3BhY2thZ2UuanNvbicpKVxyXG4gIH0gY2F0Y2goZSkge1xyXG4gICAgQ29tbW9uLmVyck1vZCgnQ291bGQgbm90IHJldHJpZXZlIG1vZHVsZSBwYWNrYWdlLmpzb24nKTtcclxuICAgIHJldHVybiBjYihlKVxyXG4gIH1cclxuXHJcbiAgdmFyIGFwcHMgPSBwa2cuYXBwcyB8fCBwa2cucG0yXHJcbiAgYXBwcyA9IFtdLmNvbmNhdChhcHBzKTtcclxuXHJcbiAgLyoqXHJcbiAgICogU29tZSB0aW1lIGEgbW9kdWxlIGNhbiBoYXZlIG11bHRpcGxlIHByb2Nlc3Nlc1xyXG4gICAqL1xyXG4gIGZvckVhY2hMaW1pdChhcHBzLCAxLCAoYXBwLCBuZXh0KSA9PiB7XHJcbiAgICB2YXIgYXBwX25hbWVcclxuXHJcbiAgICBpZiAoIWFwcC5uYW1lKSB7XHJcbiAgICAgIENvbW1vbi5yZW5kZXJBcHBsaWNhdGlvbk5hbWUoYXBwKVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChhcHBzLmxlbmd0aCA+IDEpXHJcbiAgICAgIGFwcF9uYW1lID0gYCR7bW9kdWxlX25hbWV9OiR7YXBwLm5hbWV9YFxyXG4gICAgZWxzZSBpZiAoYXBwcy5sZW5ndGggPT0gMSAmJiBwa2cubmFtZSAhPSBhcHBzWzBdLm5hbWUpXHJcbiAgICAgIGFwcF9uYW1lID0gYCR7bW9kdWxlX25hbWV9OiR7YXBwLm5hbWV9YFxyXG4gICAgZWxzZVxyXG4gICAgICBhcHBfbmFtZSA9IGFwcC5uYW1lXHJcblxyXG4gICAgUE0yLl9vcGVyYXRlKCdkZWxldGVQcm9jZXNzSWQnLCBhcHBfbmFtZSwgKCkgPT4ge1xyXG4gICAgICBkZWxldGVNb2R1bGVQYXRoKG1vZHVsZV9uYW1lKVxyXG4gICAgICBuZXh0KClcclxuICAgIH0pXHJcbiAgfSwgKCkgPT4ge1xyXG4gICAgQ29uZmlndXJhdGlvbi51bnNldFN5bmMoYCR7Y3N0Lk1PRFVMRV9DT05GX1BSRUZJWF9UQVJ9OiR7bW9kdWxlX25hbWV9YClcclxuICAgIGNiKG51bGwpXHJcbiAgfSlcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBVbmNvbXByZXNzIG9ubHkgbW9kdWxlL3BhY2thZ2UuanNvbiBhbmQgcmV0cmlldmUgdGhlIFwibmFtZVwiIGF0dHJpYnV0ZSBpbiB0aGUgcGFja2FnZS5qc29uXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRNb2R1bGVOYW1lKG1vZHVsZV9maWxlcGF0aCwgY2IpIHtcclxuICB2YXIgdG1wX2ZvbGRlciA9IHBhdGguam9pbihvcy50bXBkaXIoKSwgY3N0Lk1PRFVMRV9CQVNFRk9MREVSKVxyXG5cclxuICB2YXIgaW5zdGFsbF9pbnN0YW5jZSA9IHNwYXduKCd0YXInLCBbJ3p4ZicsIG1vZHVsZV9maWxlcGF0aCwgJy1DJywgb3MudG1wZGlyKCksIGAke2NzdC5NT0RVTEVfQkFTRUZPTERFUn0vcGFja2FnZS5qc29uYF0sIHtcclxuICAgIHN0ZGlvIDogJ2luaGVyaXQnLFxyXG4gICAgZW52OiBwcm9jZXNzLmVudixcclxuXHRcdHNoZWxsIDogdHJ1ZVxyXG4gIH0pXHJcblxyXG4gIGluc3RhbGxfaW5zdGFuY2Uub24oJ2Nsb3NlJywgZnVuY3Rpb24oY29kZSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgdmFyIHBrZyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbih0bXBfZm9sZGVyLCBgcGFja2FnZS5qc29uYCksIFwidXRmOFwiKSlcclxuICAgICAgcmV0dXJuIGNiKG51bGwsIHBrZy5uYW1lKVxyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgIHJldHVybiBjYihlKVxyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYWNrYWdlMShtb2R1bGVfcGF0aCwgdGFyZ2V0X3BhdGgsIGNiKSB7XHJcbiAgdmFyIGJhc2VfZm9sZGVyID0gcGF0aC5kaXJuYW1lKG1vZHVsZV9wYXRoKVxyXG4gIHZhciBtb2R1bGVfZm9sZGVyX25hbWUgPSBwYXRoLmJhc2VuYW1lKG1vZHVsZV9wYXRoKVxyXG4gIHZhciBwa2cgPSByZXF1aXJlKHBhdGguam9pbihtb2R1bGVfcGF0aCwgJ3BhY2thZ2UuanNvbicpKVxyXG4gIHZhciBwa2dfbmFtZSA9IGAke21vZHVsZV9mb2xkZXJfbmFtZX0tdiR7cGtnLnZlcnNpb24ucmVwbGFjZSgvXFwuL2csICctJyl9LnRhci5nemBcclxuICB2YXIgdGFyZ2V0X2Z1bGxwYXRoID0gcGF0aC5qb2luKHRhcmdldF9wYXRoLCBwa2dfbmFtZSlcclxuXHJcbiAgdmFyIGNtZCA9IGB0YXIgemNmICR7dGFyZ2V0X2Z1bGxwYXRofSAtQyAke2Jhc2VfZm9sZGVyfSAtLXRyYW5zZm9ybSAncywke21vZHVsZV9mb2xkZXJfbmFtZX0sbW9kdWxlLCcgJHttb2R1bGVfZm9sZGVyX25hbWV9YFxyXG5cclxuICBDb21tb24ubG9nTW9kKGBHemlwaW5nICR7bW9kdWxlX3BhdGh9IHRvICR7dGFyZ2V0X2Z1bGxwYXRofWApXHJcblxyXG4gIHZhciB0YXIgPSBleGVjKGNtZCwgKGVyciwgc3RvLCBzdGUpID0+IHtcclxuICAgIGlmIChlcnIpIHtcclxuICAgICAgY29uc29sZS5sb2coc3RvLnRvU3RyaW5nKCkudHJpbSgpKVxyXG4gICAgICBjb25zb2xlLmxvZyhzdGUudG9TdHJpbmcoKS50cmltKCkpXHJcbiAgICB9XHJcbiAgfSlcclxuXHJcbiAgdGFyLm9uKCdjbG9zZScsIGZ1bmN0aW9uIChjb2RlKSB7XHJcbiAgICBjYihjb2RlID09IDAgPyBudWxsIDogY29kZSwge1xyXG4gICAgICBwYWNrYWdlX25hbWU6IHBrZ19uYW1lLFxyXG4gICAgICBwYXRoOiB0YXJnZXRfZnVsbHBhdGhcclxuICAgIH0pXHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gcHVibGlzaChQTTIsIGZvbGRlciwgY2IpIHtcclxuICB2YXIgdGFyZ2V0X2ZvbGRlciA9IGZvbGRlciA/IHBhdGgucmVzb2x2ZShmb2xkZXIpIDogcHJvY2Vzcy5jd2QoKVxyXG5cclxuICB0cnkge1xyXG4gICAgdmFyIHBrZyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbih0YXJnZXRfZm9sZGVyLCAncGFja2FnZS5qc29uJykpLnRvU3RyaW5nKCkpXHJcbiAgfSBjYXRjaChlKSB7XHJcbiAgICBDb21tb24uZXJyTW9kKGAke3Byb2Nlc3MuY3dkKCl9IG1vZHVsZSBkb2VzIG5vdCBjb250YWluIGFueSBwYWNrYWdlLmpzb25gKVxyXG4gICAgcHJvY2Vzcy5leGl0KDEpXHJcbiAgfVxyXG5cclxuICBpZiAoIXBrZy5uYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ0F0dHJpYnV0ZSBuYW1lIHNob3VsZCBiZSBwcmVzZW50JylcclxuICBpZiAoIXBrZy52ZXJzaW9uKSB0aHJvdyBuZXcgRXJyb3IoJ0F0dHJpYnV0ZSB2ZXJzaW9uIHNob3VsZCBiZSBwcmVzZW50JylcclxuICBpZiAoIXBrZy5wbTIgJiYgIXBrZy5hcHBzKSB0aHJvdyBuZXcgRXJyb3IoJ0F0dHJpYnV0ZSBhcHBzIHNob3VsZCBiZSBwcmVzZW50JylcclxuXHJcbiAgdmFyIGN1cnJlbnRfcGF0aCA9IHRhcmdldF9mb2xkZXJcclxuICB2YXIgbW9kdWxlX25hbWUgPSBwYXRoLmJhc2VuYW1lKGN1cnJlbnRfcGF0aClcclxuICB2YXIgdGFyZ2V0X3BhdGggPSBvcy50bXBkaXIoKVxyXG5cclxuICBDb21tb24ubG9nTW9kKGBTdGFydGluZyBwdWJsaXNoaW5nIHByb2NlZHVyZSBmb3IgJHttb2R1bGVfbmFtZX1AJHtwa2cudmVyc2lvbn1gKVxyXG5cclxuICBwYWNrYWdlMShjdXJyZW50X3BhdGgsIHRhcmdldF9wYXRoLCAoZXJyLCByZXMpID0+IHtcclxuICAgIGlmIChlcnIpIHtcclxuICAgICAgQ29tbW9uLmVyck1vZCgnQ2FuXFwndCBwYWNrYWdlLCBleGl0aW5nJylcclxuICAgICAgcHJvY2Vzcy5leGl0KDEpXHJcbiAgICB9XHJcblxyXG4gICAgQ29tbW9uLmxvZ01vZChgUGFja2FnZSBbJHtwa2cubmFtZX1dIGNyZWF0ZWQgaW4gcGF0aCAke3Jlcy5wYXRofWApXHJcblxyXG4gICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgIG1vZHVsZV9kYXRhOiB7XHJcbiAgICAgICAgZmlsZTogcmVzLnBhdGgsXHJcbiAgICAgICAgY29udGVudF90eXBlOiAnY29udGVudC9nemlwJ1xyXG4gICAgICB9LFxyXG4gICAgICBpZDogcGtnLm5hbWUsXHJcbiAgICAgIG5hbWU6IHBrZy5uYW1lLFxyXG4gICAgICB2ZXJzaW9uOiBwa2cudmVyc2lvblxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgdXJpID0gYCR7UE0yLnBtMl9jb25maWd1cmF0aW9uLnJlZ2lzdHJ5fS9hcGkvdjEvbW9kdWxlc2BcclxuICAgIENvbW1vbi5sb2dNb2QoYFNlbmRpbmcgUGFja2FnZSB0byByZW1vdGUgJHtwa2cubmFtZX0gJHt1cml9YClcclxuXHJcbiAgICByZXF1aXJlKCduZWVkbGUnKVxyXG4gICAgICAucG9zdCh1cmksIGRhdGEsIHsgbXVsdGlwYXJ0OiB0cnVlIH0sIGZ1bmN0aW9uKGVyciwgcmVzLCBib2R5KSB7XHJcbiAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgQ29tbW9uLmVyck1vZChlcnIpXHJcbiAgICAgICAgICBwcm9jZXNzLmV4aXQoMSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlcy5zdGF0dXNDb2RlICE9PSAyMDApIHtcclxuICAgICAgICAgIENvbW1vbi5lcnJNb2QoYCR7cGtnLm5hbWV9LSR7cGtnLnZlcnNpb259OiAke3Jlcy5ib2R5Lm1zZ31gKVxyXG4gICAgICAgICAgcHJvY2Vzcy5leGl0KDEpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIENvbW1vbi5sb2dNb2QoYE1vZHVsZSAke21vZHVsZV9uYW1lfSBwdWJsaXNoZWQgdW5kZXIgdmVyc2lvbiAke3BrZy52ZXJzaW9ufWApXHJcbiAgICAgICAgcHJvY2Vzcy5leGl0KDApXHJcbiAgICAgIH0pXHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gbmVlZFByZWZpeChjb25mKSB7XHJcbiAgaWYgKChjb25mLmFwcHMgJiYgY29uZi5hcHBzLmxlbmd0aCA+IDEpIHx8XHJcbiAgICAgIChjb25mLnBtMiAmJiBjb25mLnBtMi5sZW5ndGggPiAxKSB8fFxyXG4gICAgICAoY29uZi5hcHBzLmxlbmd0aCA9PSAxICYmIGNvbmYubmFtZSAhPSBjb25mLmFwcHNbMF0ubmFtZSkpXHJcbiAgICByZXR1cm4gdHJ1ZVxyXG4gIHJldHVybiBmYWxzZVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgaW5zdGFsbCxcclxuICB1bmluc3RhbGwsXHJcbiAgc3RhcnQsXHJcbiAgcHVibGlzaCxcclxuICBwYWNrYWdlMVxyXG59XHJcbiJdfQ==