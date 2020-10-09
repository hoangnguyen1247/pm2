"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvTW9kdWxlcy9UQVIudHMiXSwibmFtZXMiOlsiaW5zdGFsbCIsIlBNMiIsIm1vZHVsZV9maWxlcGF0aCIsIm9wdHMiLCJjYiIsImluY2x1ZGVzIiwidGFyZ2V0X2ZpbGUiLCJzcGxpdCIsInBvcCIsInRhcmdldF9maWxlcGF0aCIsInBhdGgiLCJqb2luIiwib3MiLCJ0bXBkaXIiLCJpbnN0YWxsX3VybCIsInJldHJpZXZlUmVtb3RlIiwiZXJyIiwiQ29tbW9uIiwiZXJyTW9kIiwicHJvY2VzcyIsImV4aXQiLCJpbnN0YWxsTG9jYWwiLCJ1cmwiLCJkZXN0IiwibG9nTW9kIiwid2dldCIsInN0ZGlvIiwiZW52Iiwic2hlbGwiLCJvbiIsImNvbnNvbGUiLCJlcnJvciIsInN0YWNrIiwiY29kZSIsIkVycm9yIiwiZ2V0TW9kdWxlTmFtZSIsIm1vZHVsZV9uYW1lIiwiaW5zdGFsbF9wYXRoIiwiY3N0IiwiREVGQVVMVF9NT0RVTEVfUEFUSCIsInJlcXVpcmUiLCJzeW5jIiwiaW5zdGFsbF9pbnN0YW5jZSIsInJ1bkluc3RhbGwiLCJleGl0Q2xpIiwiZGVsZXRlTW9kdWxlUGF0aCIsInNhbml0aXplZCIsInJlcGxhY2UiLCJzaWxlbnQiLCJ0YXJnZXRfcGF0aCIsImNvbmZpZ19maWxlIiwiY29uZiIsIm5hbWUiLCJlIiwic3RhcnRlZF9hc19tb2R1bGUiLCJjd2QiLCJuZWVkUHJlZml4IiwibmFtZV9wcmVmaXgiLCJzdGFydCIsImRhdGEiLCJDb25maWd1cmF0aW9uIiwic2V0U3luYyIsIk1PRFVMRV9DT05GX1BSRUZJWF9UQVIiLCJzb3VyY2UiLCJpbnN0YWxsZWRfYXQiLCJEYXRlIiwibm93IiwibW9kdWxlX3BhdGgiLCJwcmludE91dCIsIlBSRUZJWF9NU0dfTU9EIiwicGFja2FnZV9qc29uX3BhdGgiLCJtb2R1bGVfY29uZiIsImdldFN5bmMiLCJwcmludEVycm9yIiwidW5pbnN0YWxsIiwicGtnIiwiYXBwcyIsInBtMiIsImNvbmNhdCIsImFwcCIsIm5leHQiLCJhcHBfbmFtZSIsInJlbmRlckFwcGxpY2F0aW9uTmFtZSIsImxlbmd0aCIsIl9vcGVyYXRlIiwidW5zZXRTeW5jIiwidG1wX2ZvbGRlciIsIk1PRFVMRV9CQVNFRk9MREVSIiwiSlNPTiIsInBhcnNlIiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJwYWNrYWdlMSIsImJhc2VfZm9sZGVyIiwiZGlybmFtZSIsIm1vZHVsZV9mb2xkZXJfbmFtZSIsImJhc2VuYW1lIiwicGtnX25hbWUiLCJ2ZXJzaW9uIiwidGFyZ2V0X2Z1bGxwYXRoIiwiY21kIiwidGFyIiwic3RvIiwic3RlIiwibG9nIiwidG9TdHJpbmciLCJ0cmltIiwicGFja2FnZV9uYW1lIiwicHVibGlzaCIsImZvbGRlciIsInRhcmdldF9mb2xkZXIiLCJyZXNvbHZlIiwiY3VycmVudF9wYXRoIiwicmVzIiwibW9kdWxlX2RhdGEiLCJmaWxlIiwiY29udGVudF90eXBlIiwiaWQiLCJ1cmkiLCJwbTJfY29uZmlndXJhdGlvbiIsInJlZ2lzdHJ5IiwicG9zdCIsIm11bHRpcGFydCIsImJvZHkiLCJzdGF0dXNDb2RlIiwibXNnIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFJQTs7Ozs7Ozs7O0FBVUEsU0FBU0EsT0FBVCxDQUFpQkMsR0FBakIsRUFBc0JDLGVBQXRCLEVBQXVDQyxJQUF2QyxFQUE2Q0MsRUFBN0MsRUFBaUQ7QUFDL0M7QUFDQSxNQUFJRixlQUFlLENBQUNHLFFBQWhCLENBQXlCLE1BQXpCLE1BQXFDLElBQXpDLEVBQStDO0FBQzdDLFFBQUlDLFdBQVcsR0FBR0osZUFBZSxDQUFDSyxLQUFoQixDQUFzQixHQUF0QixFQUEyQkMsR0FBM0IsRUFBbEI7O0FBQ0EsUUFBSUMsZUFBZSxHQUFHQyxpQkFBS0MsSUFBTCxDQUFVQyxlQUFHQyxNQUFILEVBQVYsRUFBdUJQLFdBQXZCLENBQXRCOztBQUVBSCxJQUFBQSxJ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O0FBYUQsR0FsQ08sQ0FBUjtBQW1DRDs7QUFFRCxTQUFTb0MsVUFBVCxDQUFvQkwsSUFBcEIsRUFBMEI7QUFDeEIsTUFBS0EsSUFBSSxDQUFDeUIsSUFBTCxJQUFhekIsSUFBSSxDQUFDeUIsSUFBTCxDQUFVTyxNQUFWLEdBQW1CLENBQWpDLElBQ0NoQyxJQUFJLENBQUMwQixHQUFMLElBQVkxQixJQUFJLENBQUMwQixHQUFMLENBQVNNLE1BQVQsR0FBa0IsQ0FEL0IsSUFFQ2hDLElBQUksQ0FBQ3lCLElBQUwsQ0FBVU8sTUFBVixJQUFvQixDQUFwQixJQUF5QmhDLElBQUksQ0FBQ0MsSUFBTCxJQUFhRCxJQUFJLENBQUN5QixJQUFMLENBQVUsQ0FBVixFQUFheEIsSUFGeEQsRUFHRSxPQUFPLElBQVA7QUFDRixTQUFPLEtBQVA7QUFDRDs7ZUFFYztBQUNicEQsRUFBQUEsT0FBTyxFQUFQQSxPQURhO0FBRWIwRSxFQUFBQSxTQUFTLEVBQVRBLFNBRmE7QUFHYmhCLEVBQUFBLEtBQUssRUFBTEEsS0FIYTtBQUlia0QsRUFBQUEsT0FBTyxFQUFQQSxPQUphO0FBS2JoQixFQUFBQSxRQUFRLEVBQVJBO0FBTGEsQyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IENvbmZpZ3VyYXRpb24gZnJvbSAnLi4vLi4vQ29uZmlndXJhdGlvbic7XG5pbXBvcnQgY3N0IGZyb20gJy4uLy4uLy4uL2NvbnN0YW50cyc7XG5pbXBvcnQgQ29tbW9uIGZyb20gJy4uLy4uL0NvbW1vbic7XG5pbXBvcnQgZm9yRWFjaExpbWl0ICBmcm9tICdhc3luYy9mb3JFYWNoTGltaXQnO1xuaW1wb3J0IHNleGVjIGZyb20gJy4uLy4uL3Rvb2xzL3NleGVjJ1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB7IGV4ZWMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5cbi8qKlxuICogTW9kdWxlIG1hbmFnZW1lbnQgdG8gbWFuYWdlIHRhcmJhbGwgcGFja2FnZXNcbiAqXG4gKiBwbTIgaW5zdGFsbCBodHRwLnRhci5nelxuICogcG0yIHVuaW5zdGFsbCBodHRwXG4gKlxuICogLSB0aGUgZmlyc3QgYW5kIG9ubHkgZm9sZGVyIGluIHRoZSB0YXJiYWxsIG11c3QgYmUgY2FsbGVkIG1vZHVsZSAodGFyIHpjdmYgaHR0cCBtb2R1bGUvKVxuICogLSBhIHBhY2thZ2UuanNvbiBtdXN0IGJlIHByZXNlbnQgd2l0aCBhdHRyaWJ1dGUgXCJuYW1lXCIsIFwidmVyc2lvblwiIGFuZCBcInBtMlwiIHRvIGRlY2xhcmUgYXBwcyB0byBydW5cbiAqL1xuXG5mdW5jdGlvbiBpbnN0YWxsKFBNMiwgbW9kdWxlX2ZpbGVwYXRoLCBvcHRzLCBjYikge1xuICAvLyBSZW1vdGUgZmlsZSByZXRyaWV2YWxcbiAgaWYgKG1vZHVsZV9maWxlcGF0aC5pbmNsdWRlcygnaHR0cCcpID09PSB0cnVlKSB7XG4gICAgdmFyIHRhcmdldF9maWxlID0gbW9kdWxlX2ZpbGVwYXRoLnNwbGl0KCcvJykucG9wKClcbiAgICB2YXIgdGFyZ2V0X2ZpbGVwYXRoID0gcGF0aC5qb2luKG9zLnRtcGRpcigpLCB0YXJnZXRfZmlsZSlcblxuICAgIG9wdHMuaW5zdGFsbF91cmwgPSBtb2R1bGVfZmlsZXBhdGhcblxuICAgIHJldHVybiByZXRyaWV2ZVJlbW90ZShtb2R1bGVfZmlsZXBhdGgsIHRhcmdldF9maWxlcGF0aCwgKGVycikgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24uZXJyTW9kKGVycilcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpXG4gICAgICB9XG4gICAgICBpbnN0YWxsTG9jYWwoUE0yLCB0YXJnZXRfZmlsZXBhdGgsIG9wdHMsIGNiKVxuICAgIH0pXG4gIH1cblxuICAvLyBMb2NhbCBpbnN0YWxsXG4gIGluc3RhbGxMb2NhbChQTTIsIG1vZHVsZV9maWxlcGF0aCwgb3B0cywgY2IpXG59XG5cbmZ1bmN0aW9uIHJldHJpZXZlUmVtb3RlKHVybCwgZGVzdCwgY2IpIHtcbiAgQ29tbW9uLmxvZ01vZChgUmV0cmlldmluZyByZW1vdGUgcGFja2FnZSAke3VybH0uLi5gKVxuXG4gIHZhciB3Z2V0ID0gc3Bhd24oJ3dnZXQnLCBbdXJsLCAnLU8nLCBkZXN0LCAnLXEnXSwge1xuICAgIHN0ZGlvIDogJ2luaGVyaXQnLFxuICAgIGVudjogcHJvY2Vzcy5lbnYsXG5cdFx0c2hlbGwgOiB0cnVlXG4gIH0pXG5cbiAgd2dldC5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2sgfHwgZXJyKVxuICB9KVxuXG4gIHdnZXQub24oJ2Nsb3NlJywgKGNvZGUpID0+IHtcbiAgICBpZiAoY29kZSAhPT0gMClcbiAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoJ0NvdWxkIG5vdCBkb3dubG9hZCcpKVxuICAgIHJldHVybiBjYihudWxsKVxuICB9KVxufVxuXG5mdW5jdGlvbiBpbnN0YWxsTG9jYWwoUE0yLCBtb2R1bGVfZmlsZXBhdGgsIG9wdHMsIGNiKSB7XG4gIENvbW1vbi5sb2dNb2QoYEluc3RhbGxpbmcgcGFja2FnZSAke21vZHVsZV9maWxlcGF0aH1gKVxuXG4gIC8vIEdldCBtb2R1bGUgbmFtZSBieSB1bnBhY2tpbmcgdGhlIG1vZHVsZS9wYWNrYWdlLmpzb24gb25seSBhbmQgcmVhZCB0aGUgbmFtZSBhdHRyaWJ1dGVcbiAgZ2V0TW9kdWxlTmFtZShtb2R1bGVfZmlsZXBhdGgsIGZ1bmN0aW9uKGVyciwgbW9kdWxlX25hbWUpIHtcbiAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuXG4gICAgQ29tbW9uLmxvZ01vZChgTW9kdWxlIG5hbWUgaXMgJHttb2R1bGVfbmFtZX1gKVxuXG4gICAgQ29tbW9uLmxvZ01vZChgRGVwYWNrYWdpbmcgbW9kdWxlLi4uYClcblxuICAgIHZhciBpbnN0YWxsX3BhdGggPSBwYXRoLmpvaW4oY3N0LkRFRkFVTFRfTU9EVUxFX1BBVEgsIG1vZHVsZV9uYW1lKTtcblxuICAgIHJlcXVpcmUoJ21rZGlycCcpLnN5bmMoaW5zdGFsbF9wYXRoKVxuXG4gICAgdmFyIGluc3RhbGxfaW5zdGFuY2UgPSBzcGF3bigndGFyJywgWyd6eGYnLCBtb2R1bGVfZmlsZXBhdGgsICctQycsIGluc3RhbGxfcGF0aCwgJy0tc3RyaXAtY29tcG9uZW50cyAxJ10sIHtcbiAgICAgIHN0ZGlvIDogJ2luaGVyaXQnLFxuICAgICAgZW52OiBwcm9jZXNzLmVudixcblx0XHQgIHNoZWxsIDogdHJ1ZVxuICAgIH0pXG5cbiAgICBpbnN0YWxsX2luc3RhbmNlLm9uKCdjbG9zZScsIGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgIENvbW1vbi5sb2dNb2QoYE1vZHVsZSBkZXBhY2thZ2VkIGluICR7aW5zdGFsbF9wYXRofWApXG4gICAgICBpZiAoY29kZSA9PSAwKVxuICAgICAgICByZXR1cm4gcnVuSW5zdGFsbChQTTIsIGluc3RhbGxfcGF0aCwgbW9kdWxlX25hbWUsIG9wdHMsIGNiKVxuICAgICAgcmV0dXJuIFBNMi5leGl0Q2xpKDEpXG4gICAgfSk7XG5cbiAgICBpbnN0YWxsX2luc3RhbmNlLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrIHx8IGVycik7XG4gICAgfSk7XG4gIH0pXG59XG5cbmZ1bmN0aW9uIGRlbGV0ZU1vZHVsZVBhdGgobW9kdWxlX25hbWUpIHtcbiAgdmFyIHNhbml0aXplZCA9IG1vZHVsZV9uYW1lLnJlcGxhY2UoL1xcLi9nLCAnJylcbiAgZXhlY1N5bmMoYHJtIC1yICR7cGF0aC5qb2luKGNzdC5ERUZBVUxUX01PRFVMRV9QQVRILCBtb2R1bGVfbmFtZSl9YCwgeyBzaWxlbnQ6IHRydWUgfSBhcyBhbnkpXG59XG5cbmZ1bmN0aW9uIHJ1bkluc3RhbGwoUE0yLCB0YXJnZXRfcGF0aCwgbW9kdWxlX25hbWUsIG9wdHMsIGNiKSB7XG4gIHZhciBjb25maWdfZmlsZSA9IHBhdGguam9pbih0YXJnZXRfcGF0aCwgJ3BhY2thZ2UuanNvbicpXG4gIHZhciBjb25mXG5cbiAgdHJ5IHtcbiAgICBjb25mID0gcmVxdWlyZShjb25maWdfZmlsZSlcbiAgICBtb2R1bGVfbmFtZSA9IGNvbmYubmFtZVxuICB9IGNhdGNoKGUpIHtcbiAgICBDb21tb24uZXJyTW9kKG5ldyBFcnJvcignQ2Fubm90IGZpbmQgcGFja2FnZS5qc29uIGZpbGUgd2l0aCBuYW1lIGF0dHJpYnV0ZSBhdCBsZWFzdCcpKTtcbiAgfVxuXG4gIC8vIEZvcmNlIHdpdGggdGhlIG5hbWUgaW4gdGhlIHBhY2thZ2UuanNvblxuICBvcHRzLnN0YXJ0ZWRfYXNfbW9kdWxlID0gdHJ1ZVxuICBvcHRzLmN3ZCA9IHRhcmdldF9wYXRoXG5cbiAgaWYgKG5lZWRQcmVmaXgoY29uZikpXG4gICAgb3B0cy5uYW1lX3ByZWZpeCA9IG1vZHVsZV9uYW1lXG5cbiAgaWYgKG9wdHMuaW5zdGFsbCkge1xuICAgIENvbW1vbi5sb2dNb2QoYFJ1bm5pbmcgWUFSTiBpbnN0YWxsLi4uYClcblxuICAgIHNleGVjKGBjZCAke3RhcmdldF9wYXRofSA7IHlhcm4gaW5zdGFsbGAsIHtzaWxlbnQ6IGZhbHNlfSwgZnVuY3Rpb24oY29kZSkge1xuICAgICAgLy8gU3RhcnQgYXBwcyB1bmRlciBcImFwcHNcIiBvciBcInBtMlwiIGF0dHJpYnV0ZVxuICAgICAgQ29tbW9uLmxvZ01vZChgU3RhcnRpbmcgJHt0YXJnZXRfcGF0aH1gKVxuICAgICAgUE0yLnN0YXJ0KGNvbmYsIG9wdHMsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuXG4gICAgICAgIENvbmZpZ3VyYXRpb24uc2V0U3luYyhgJHtjc3QuTU9EVUxFX0NPTkZfUFJFRklYX1RBUn06JHttb2R1bGVfbmFtZX1gLCB7XG4gICAgICAgICAgc291cmNlOiAndGFyYmFsbCcsXG4gICAgICAgICAgaW5zdGFsbF91cmw6IG9wdHMuaW5zdGFsbF91cmwsXG4gICAgICAgICAgaW5zdGFsbGVkX2F0OiBEYXRlLm5vdygpXG4gICAgICAgIH0pXG5cbiAgICAgICAgQ29tbW9uLmxvZ01vZChgTW9kdWxlIElOU1RBTExFRCBhbmQgU1RBUlRFRGApXG4gICAgICAgIHJldHVybiBjYihudWxsLCAnTW9kdWxlIGluc3RhbGxlZCAmIFN0YXJ0ZWQnKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG4gIGVsc2Uge1xuICAgIFBNMi5zdGFydChjb25mLCBvcHRzLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpXG5cbiAgICAgIENvbmZpZ3VyYXRpb24uc2V0U3luYyhgJHtjc3QuTU9EVUxFX0NPTkZfUFJFRklYX1RBUn06JHttb2R1bGVfbmFtZX1gLCB7XG4gICAgICAgIHNvdXJjZTogJ3RhcmJhbGwnLFxuICAgICAgICBpbnN0YWxsX3VybDogb3B0cy5pbnN0YWxsX3VybCxcbiAgICAgICAgaW5zdGFsbGVkX2F0OiBEYXRlLm5vdygpXG4gICAgICB9KVxuXG4gICAgICBDb21tb24ubG9nTW9kKGBNb2R1bGUgSU5TVEFMTEVEIGFuZCBTVEFSVEVEYClcbiAgICAgIHJldHVybiBjYihudWxsLCAnTW9kdWxlIGluc3RhbGxlZCAmIFN0YXJ0ZWQnKVxuICAgIH0pXG4gIH1cbn1cblxuZnVuY3Rpb24gc3RhcnQoUE0yLCBtb2R1bGVfbmFtZSwgY2IpIHtcbiAgdmFyIG1vZHVsZV9wYXRoID0gcGF0aC5qb2luKGNzdC5ERUZBVUxUX01PRFVMRV9QQVRILCBtb2R1bGVfbmFtZSk7XG4gIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19NT0QgKyAnU3RhcnRpbmcgVEFSIG1vZHVsZSAnICsgbW9kdWxlX25hbWUpO1xuICB2YXIgcGFja2FnZV9qc29uX3BhdGggPSBwYXRoLmpvaW4obW9kdWxlX3BhdGgsICdwYWNrYWdlLmpzb24nKTtcbiAgdmFyIG1vZHVsZV9jb25mID0gQ29uZmlndXJhdGlvbi5nZXRTeW5jKGAke2NzdC5NT0RVTEVfQ09ORl9QUkVGSVhfVEFSfToke21vZHVsZV9uYW1lfWApXG5cbiAgdHJ5IHtcbiAgICB2YXIgY29uZiA9IHJlcXVpcmUocGFja2FnZV9qc29uX3BhdGgpXG4gIH0gY2F0Y2goZSkge1xuICAgIENvbW1vbi5wcmludEVycm9yKGBDb3VsZCBub3QgZmluZCBwYWNrYWdlLmpzb24gYXMgJHtwYWNrYWdlX2pzb25fcGF0aH1gKVxuICAgIHJldHVybiBjYigpXG4gIH1cblxuICB2YXIgb3B0czphbnkgPSB7fTtcblxuICBvcHRzLnN0YXJ0ZWRfYXNfbW9kdWxlID0gdHJ1ZVxuICBvcHRzLmN3ZCA9IG1vZHVsZV9wYXRoXG5cbiAgaWYgKG1vZHVsZV9jb25mLmluc3RhbGxfdXJsKVxuICAgIG9wdHMuaW5zdGFsbF91cmwgPSBtb2R1bGVfY29uZi5pbnN0YWxsX3VybFxuXG4gIGlmIChuZWVkUHJlZml4KGNvbmYpKVxuICAgIG9wdHMubmFtZV9wcmVmaXggPSBtb2R1bGVfbmFtZVxuXG4gIFBNMi5zdGFydChjb25mLCBvcHRzLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcihgQ291bGQgbm90IHN0YXJ0ICR7bW9kdWxlX25hbWV9ICR7bW9kdWxlX3BhdGh9YClcbiAgICAgIHJldHVybiBjYigpXG4gICAgfVxuXG4gICAgQ29tbW9uLnByaW50T3V0KGAke2NzdC5QUkVGSVhfTVNHX01PRH0gTW9kdWxlICR7bW9kdWxlX25hbWV9IFNUQVJURURgKVxuICAgIHJldHVybiBjYigpO1xuICB9KVxufVxuXG4vKipcbiAqIFJldHJpZXZlIGZyb20gbW9kdWxlIHBhY2thZ2UuanNvbiB0aGUgbmFtZSBvZiBlYWNoIGFwcGxpY2F0aW9uXG4gKiBkZWxldGUgcHJvY2VzcyBhbmQgZGVsZXRlIGZvbGRlclxuICovXG5mdW5jdGlvbiB1bmluc3RhbGwoUE0yLCBtb2R1bGVfbmFtZSwgY2IpIHtcbiAgdmFyIG1vZHVsZV9wYXRoID0gcGF0aC5qb2luKGNzdC5ERUZBVUxUX01PRFVMRV9QQVRILCBtb2R1bGVfbmFtZSk7XG5cbiAgQ29tbW9uLmxvZ01vZChgUmVtb3ZpbmcgJHttb2R1bGVfbmFtZX0gZnJvbSBhdXRvIHN0YXJ0dXBgKVxuXG4gIHRyeSB7XG4gICAgdmFyIHBrZyA9IHJlcXVpcmUocGF0aC5qb2luKG1vZHVsZV9wYXRoLCAncGFja2FnZS5qc29uJykpXG4gIH0gY2F0Y2goZSkge1xuICAgIENvbW1vbi5lcnJNb2QoJ0NvdWxkIG5vdCByZXRyaWV2ZSBtb2R1bGUgcGFja2FnZS5qc29uJyk7XG4gICAgcmV0dXJuIGNiKGUpXG4gIH1cblxuICB2YXIgYXBwcyA9IHBrZy5hcHBzIHx8IHBrZy5wbTJcbiAgYXBwcyA9IFtdLmNvbmNhdChhcHBzKTtcblxuICAvKipcbiAgICogU29tZSB0aW1lIGEgbW9kdWxlIGNhbiBoYXZlIG11bHRpcGxlIHByb2Nlc3Nlc1xuICAgKi9cbiAgZm9yRWFjaExpbWl0KGFwcHMsIDEsIChhcHAsIG5leHQpID0+IHtcbiAgICB2YXIgYXBwX25hbWVcblxuICAgIGlmICghYXBwLm5hbWUpIHtcbiAgICAgIENvbW1vbi5yZW5kZXJBcHBsaWNhdGlvbk5hbWUoYXBwKVxuICAgIH1cblxuICAgIGlmIChhcHBzLmxlbmd0aCA+IDEpXG4gICAgICBhcHBfbmFtZSA9IGAke21vZHVsZV9uYW1lfToke2FwcC5uYW1lfWBcbiAgICBlbHNlIGlmIChhcHBzLmxlbmd0aCA9PSAxICYmIHBrZy5uYW1lICE9IGFwcHNbMF0ubmFtZSlcbiAgICAgIGFwcF9uYW1lID0gYCR7bW9kdWxlX25hbWV9OiR7YXBwLm5hbWV9YFxuICAgIGVsc2VcbiAgICAgIGFwcF9uYW1lID0gYXBwLm5hbWVcblxuICAgIFBNMi5fb3BlcmF0ZSgnZGVsZXRlUHJvY2Vzc0lkJywgYXBwX25hbWUsICgpID0+IHtcbiAgICAgIGRlbGV0ZU1vZHVsZVBhdGgobW9kdWxlX25hbWUpXG4gICAgICBuZXh0KClcbiAgICB9KVxuICB9LCAoKSA9PiB7XG4gICAgQ29uZmlndXJhdGlvbi51bnNldFN5bmMoYCR7Y3N0Lk1PRFVMRV9DT05GX1BSRUZJWF9UQVJ9OiR7bW9kdWxlX25hbWV9YClcbiAgICBjYihudWxsKVxuICB9KVxufVxuXG5cbi8qKlxuICogVW5jb21wcmVzcyBvbmx5IG1vZHVsZS9wYWNrYWdlLmpzb24gYW5kIHJldHJpZXZlIHRoZSBcIm5hbWVcIiBhdHRyaWJ1dGUgaW4gdGhlIHBhY2thZ2UuanNvblxuICovXG5mdW5jdGlvbiBnZXRNb2R1bGVOYW1lKG1vZHVsZV9maWxlcGF0aCwgY2IpIHtcbiAgdmFyIHRtcF9mb2xkZXIgPSBwYXRoLmpvaW4ob3MudG1wZGlyKCksIGNzdC5NT0RVTEVfQkFTRUZPTERFUilcblxuICB2YXIgaW5zdGFsbF9pbnN0YW5jZSA9IHNwYXduKCd0YXInLCBbJ3p4ZicsIG1vZHVsZV9maWxlcGF0aCwgJy1DJywgb3MudG1wZGlyKCksIGAke2NzdC5NT0RVTEVfQkFTRUZPTERFUn0vcGFja2FnZS5qc29uYF0sIHtcbiAgICBzdGRpbyA6ICdpbmhlcml0JyxcbiAgICBlbnY6IHByb2Nlc3MuZW52LFxuXHRcdHNoZWxsIDogdHJ1ZVxuICB9KVxuXG4gIGluc3RhbGxfaW5zdGFuY2Uub24oJ2Nsb3NlJywgZnVuY3Rpb24oY29kZSkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgcGtnID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKHRtcF9mb2xkZXIsIGBwYWNrYWdlLmpzb25gKSwgXCJ1dGY4XCIpKVxuICAgICAgcmV0dXJuIGNiKG51bGwsIHBrZy5uYW1lKVxuICAgIH0gY2F0Y2goZSkge1xuICAgICAgcmV0dXJuIGNiKGUpXG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gcGFja2FnZTEobW9kdWxlX3BhdGgsIHRhcmdldF9wYXRoLCBjYikge1xuICB2YXIgYmFzZV9mb2xkZXIgPSBwYXRoLmRpcm5hbWUobW9kdWxlX3BhdGgpXG4gIHZhciBtb2R1bGVfZm9sZGVyX25hbWUgPSBwYXRoLmJhc2VuYW1lKG1vZHVsZV9wYXRoKVxuICB2YXIgcGtnID0gcmVxdWlyZShwYXRoLmpvaW4obW9kdWxlX3BhdGgsICdwYWNrYWdlLmpzb24nKSlcbiAgdmFyIHBrZ19uYW1lID0gYCR7bW9kdWxlX2ZvbGRlcl9uYW1lfS12JHtwa2cudmVyc2lvbi5yZXBsYWNlKC9cXC4vZywgJy0nKX0udGFyLmd6YFxuICB2YXIgdGFyZ2V0X2Z1bGxwYXRoID0gcGF0aC5qb2luKHRhcmdldF9wYXRoLCBwa2dfbmFtZSlcblxuICB2YXIgY21kID0gYHRhciB6Y2YgJHt0YXJnZXRfZnVsbHBhdGh9IC1DICR7YmFzZV9mb2xkZXJ9IC0tdHJhbnNmb3JtICdzLCR7bW9kdWxlX2ZvbGRlcl9uYW1lfSxtb2R1bGUsJyAke21vZHVsZV9mb2xkZXJfbmFtZX1gXG5cbiAgQ29tbW9uLmxvZ01vZChgR3ppcGluZyAke21vZHVsZV9wYXRofSB0byAke3RhcmdldF9mdWxscGF0aH1gKVxuXG4gIHZhciB0YXIgPSBleGVjKGNtZCwgKGVyciwgc3RvLCBzdGUpID0+IHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZyhzdG8udG9TdHJpbmcoKS50cmltKCkpXG4gICAgICBjb25zb2xlLmxvZyhzdGUudG9TdHJpbmcoKS50cmltKCkpXG4gICAgfVxuICB9KVxuXG4gIHRhci5vbignY2xvc2UnLCBmdW5jdGlvbiAoY29kZSkge1xuICAgIGNiKGNvZGUgPT0gMCA/IG51bGwgOiBjb2RlLCB7XG4gICAgICBwYWNrYWdlX25hbWU6IHBrZ19uYW1lLFxuICAgICAgcGF0aDogdGFyZ2V0X2Z1bGxwYXRoXG4gICAgfSlcbiAgfSlcbn1cblxuZnVuY3Rpb24gcHVibGlzaChQTTIsIGZvbGRlciwgY2IpIHtcbiAgdmFyIHRhcmdldF9mb2xkZXIgPSBmb2xkZXIgPyBwYXRoLnJlc29sdmUoZm9sZGVyKSA6IHByb2Nlc3MuY3dkKClcblxuICB0cnkge1xuICAgIHZhciBwa2cgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4odGFyZ2V0X2ZvbGRlciwgJ3BhY2thZ2UuanNvbicpKS50b1N0cmluZygpKVxuICB9IGNhdGNoKGUpIHtcbiAgICBDb21tb24uZXJyTW9kKGAke3Byb2Nlc3MuY3dkKCl9IG1vZHVsZSBkb2VzIG5vdCBjb250YWluIGFueSBwYWNrYWdlLmpzb25gKVxuICAgIHByb2Nlc3MuZXhpdCgxKVxuICB9XG5cbiAgaWYgKCFwa2cubmFtZSkgdGhyb3cgbmV3IEVycm9yKCdBdHRyaWJ1dGUgbmFtZSBzaG91bGQgYmUgcHJlc2VudCcpXG4gIGlmICghcGtnLnZlcnNpb24pIHRocm93IG5ldyBFcnJvcignQXR0cmlidXRlIHZlcnNpb24gc2hvdWxkIGJlIHByZXNlbnQnKVxuICBpZiAoIXBrZy5wbTIgJiYgIXBrZy5hcHBzKSB0aHJvdyBuZXcgRXJyb3IoJ0F0dHJpYnV0ZSBhcHBzIHNob3VsZCBiZSBwcmVzZW50JylcblxuICB2YXIgY3VycmVudF9wYXRoID0gdGFyZ2V0X2ZvbGRlclxuICB2YXIgbW9kdWxlX25hbWUgPSBwYXRoLmJhc2VuYW1lKGN1cnJlbnRfcGF0aClcbiAgdmFyIHRhcmdldF9wYXRoID0gb3MudG1wZGlyKClcblxuICBDb21tb24ubG9nTW9kKGBTdGFydGluZyBwdWJsaXNoaW5nIHByb2NlZHVyZSBmb3IgJHttb2R1bGVfbmFtZX1AJHtwa2cudmVyc2lvbn1gKVxuXG4gIHBhY2thZ2UxKGN1cnJlbnRfcGF0aCwgdGFyZ2V0X3BhdGgsIChlcnIsIHJlcykgPT4ge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIENvbW1vbi5lcnJNb2QoJ0NhblxcJ3QgcGFja2FnZSwgZXhpdGluZycpXG4gICAgICBwcm9jZXNzLmV4aXQoMSlcbiAgICB9XG5cbiAgICBDb21tb24ubG9nTW9kKGBQYWNrYWdlIFske3BrZy5uYW1lfV0gY3JlYXRlZCBpbiBwYXRoICR7cmVzLnBhdGh9YClcblxuICAgIHZhciBkYXRhID0ge1xuICAgICAgbW9kdWxlX2RhdGE6IHtcbiAgICAgICAgZmlsZTogcmVzLnBhdGgsXG4gICAgICAgIGNvbnRlbnRfdHlwZTogJ2NvbnRlbnQvZ3ppcCdcbiAgICAgIH0sXG4gICAgICBpZDogcGtnLm5hbWUsXG4gICAgICBuYW1lOiBwa2cubmFtZSxcbiAgICAgIHZlcnNpb246IHBrZy52ZXJzaW9uXG4gICAgfTtcblxuICAgIHZhciB1cmkgPSBgJHtQTTIucG0yX2NvbmZpZ3VyYXRpb24ucmVnaXN0cnl9L2FwaS92MS9tb2R1bGVzYFxuICAgIENvbW1vbi5sb2dNb2QoYFNlbmRpbmcgUGFja2FnZSB0byByZW1vdGUgJHtwa2cubmFtZX0gJHt1cml9YClcblxuICAgIHJlcXVpcmUoJ25lZWRsZScpXG4gICAgICAucG9zdCh1cmksIGRhdGEsIHsgbXVsdGlwYXJ0OiB0cnVlIH0sIGZ1bmN0aW9uKGVyciwgcmVzLCBib2R5KSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBDb21tb24uZXJyTW9kKGVycilcbiAgICAgICAgICBwcm9jZXNzLmV4aXQoMSlcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMCkge1xuICAgICAgICAgIENvbW1vbi5lcnJNb2QoYCR7cGtnLm5hbWV9LSR7cGtnLnZlcnNpb259OiAke3Jlcy5ib2R5Lm1zZ31gKVxuICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKVxuICAgICAgICB9XG4gICAgICAgIENvbW1vbi5sb2dNb2QoYE1vZHVsZSAke21vZHVsZV9uYW1lfSBwdWJsaXNoZWQgdW5kZXIgdmVyc2lvbiAke3BrZy52ZXJzaW9ufWApXG4gICAgICAgIHByb2Nlc3MuZXhpdCgwKVxuICAgICAgfSlcbiAgfSlcbn1cblxuZnVuY3Rpb24gbmVlZFByZWZpeChjb25mKSB7XG4gIGlmICgoY29uZi5hcHBzICYmIGNvbmYuYXBwcy5sZW5ndGggPiAxKSB8fFxuICAgICAgKGNvbmYucG0yICYmIGNvbmYucG0yLmxlbmd0aCA+IDEpIHx8XG4gICAgICAoY29uZi5hcHBzLmxlbmd0aCA9PSAxICYmIGNvbmYubmFtZSAhPSBjb25mLmFwcHNbMF0ubmFtZSkpXG4gICAgcmV0dXJuIHRydWVcbiAgcmV0dXJuIGZhbHNlXG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgaW5zdGFsbCxcbiAgdW5pbnN0YWxsLFxuICBzdGFydCxcbiAgcHVibGlzaCxcbiAgcGFja2FnZTFcbn1cbiJdfQ==