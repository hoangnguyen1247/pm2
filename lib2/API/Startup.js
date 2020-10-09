"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _chalk = _interopRequireDefault(require("chalk"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _forEachLimit = _interopRequireDefault(require("async/forEachLimit"));

var _eachLimit = _interopRequireDefault(require("async/eachLimit"));

var _Common = _interopRequireDefault(require("../Common.js"));

var _constants = _interopRequireDefault(require("../../constants.js"));

var _util = _interopRequireDefault(require("util"));

var _os = require("os");

var _which = _interopRequireDefault(require("../tools/which.js"));

var _sexec = _interopRequireDefault(require("../tools/sexec"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
function _default(CLI) {
  /**
   * If command is launched without root right
   * Display helper
   */
  function isNotRoot(startup_mode, platform, opts, cb) {
    _Common["default"].printOut("".concat(_constants["default"].PREFIX_MSG, "To ").concat(startup_mode, " the Startup Script, copy/paste the following command:"));

    if (opts.user) {
      console.log('sudo env PATH=$PATH:' + _path["default"].dirname(process.execPath) + ' pm2 ' + opts.args[1].name() + ' ' + platform + ' -u ' + opts.user + ' --hp ' + process.env.HOME);
      return cb(new Error('You have to run this with elevated rights'));
    }

    return (0, _sexec["default"])('whoami', {
      silent: true
    }, function (err, stdout, stderr) {
      console.log('sudo env PATH=$PATH:' + _path["default"].dirname(process.execPath) + ' ' + require.main.filename + ' ' + opts.args[1].name() + ' ' + platform + ' -u ' + stdout.trim() + ' --hp ' + process.env.HOME);
      return cb(new Error('You have to run this with elevated rights'));
    });
  }
  /**
   * Detect running init system
   */


  function detectInitSystem() {
    var hash_map = {
      'systemctl': 'systemd',
      'update-rc.d': 'upstart',
      'chkconfig': 'systemv',
      'rc-update': 'openrc',
      'launchctl': 'launchd',
      'sysrc': 'rcd',
      'rcctl': 'rcd-openbsd',
      'svcadm': 'smf'
    };
    var init_systems = Object.keys(hash_map);

    for (var i = 0; i < init_systems.length; i++) {
      if ((0, _which["default"])(init_systems[i]) != null) {
        break;
      }
    }

    if (i >= init_systems.length) {
      _Common["default"].printError(_constants["default"].PREFIX_MSG_ERR + 'Init system not found');

      return null;
    }

    _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Init System found: ' + _chalk["default"].bold(hash_map[init_systems[i]]));

    return hash_map[init_systems[i]];
  }

  CLI.prototype.uninstallStartup = function (platform, opts, cb) {
    var commands;
    var that = this;
    var actual_platform = detectInitSystem();
    var user = opts.user || process.env.USER || process.env.LOGNAME; // Use LOGNAME on Solaris-like systems

    var service_name = opts.serviceName || 'pm2-' + user;
    var openrc_service_name = 'pm2';
    var launchd_service_name = opts.serviceName || 'pm2.' + user;
    if (!platform) platform = actual_platform;else if (actual_platform && actual_platform !== platform) {
      _Common["default"].printOut('-----------------------------------------------------------');

      _Common["default"].printOut(' PM2 detected ' + actual_platform + ' but you precised ' + platform);

      _Common["default"].printOut(' Please verify that your choice is indeed your init system');

      _Common["default"].printOut(' If you arent sure, just run : pm2 startup');

      _Common["default"].printOut('-----------------------------------------------------------');
    }
    if (platform === null) throw new Error('Init system not found');

    if (!cb) {
      cb = function cb(err, data) {
        if (err) return that.exitCli(_constants["default"].ERROR_EXIT);
        return that.exitCli(_constants["default"].SUCCESS_EXIT);
      };
    }

    if (process.getuid() != 0) {
      return isNotRoot('unsetup', platform, opts, cb);
    }

    if (_fs["default"].existsSync('/etc/init.d/pm2-init.sh')) {
      platform = 'oldsystem';
    }

    switch (platform) {
      case 'systemd':
        commands = ['systemctl stop ' + service_name, 'systemctl disable ' + service_name, 'rm /etc/systemd/system/' + service_name + '.service'];
        break;

      case 'systemv':
        commands = ['chkconfig ' + service_name + ' off', 'rm /etc/init.d/' + service_name];
        break;

      case 'oldsystem':
        _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Disabling and deleting old startup system');

        commands = ['update-rc.d pm2-init.sh disable', 'update-rc.d -f pm2-init.sh remove', 'rm /etc/init.d/pm2-init.sh'];
        break;

      case 'openrc':
        service_name = openrc_service_name;
        commands = ['/etc/init.d/' + service_name + ' stop', 'rc-update delete ' + service_name + ' default', 'rm /etc/init.d/' + service_name];
        break;

      case 'upstart':
        commands = ['update-rc.d ' + service_name + ' disable', 'update-rc.d -f ' + service_name + ' remove', 'rm /etc/init.d/' + service_name];
        break;

      case 'launchd':
        var destination = _path["default"].join(process.env.HOME, 'Library/LaunchAgents/' + launchd_service_name + '.plist');

        commands = ['launchctl remove ' + launchd_service_name + ' || true', 'rm ' + destination];
        break;

      case 'rcd':
        service_name = opts.serviceName || 'pm2_' + user;
        commands = ['/usr/local/etc/rc.d/' + service_name + ' stop', 'sysrc -x ' + service_name + '_enable', 'rm /usr/local/etc/rc.d/' + service_name];
        break;

      case 'rcd-openbsd':
        service_name = opts.serviceName || 'pm2_' + user;

        var destination = _path["default"].join('/etc/rc.d', service_name);

        commands = ['rcctl stop ' + service_name, 'rcctl disable ' + service_name, 'rm ' + destination];
        break;

      case 'smf':
        service_name = opts.serviceName || 'pm2_' + user;
        commands = ['svcadm disable ' + service_name, 'svccfg delete -f ' + service_name];
    }

    ;
    (0, _sexec["default"])(commands.join('&& '), function (code, stdout, stderr) {
      _Common["default"].printOut(stdout);

      _Common["default"].printOut(stderr);

      if (code == 0) {
        _Common["default"].printOut(_constants["default"].PREFIX_MSG + _chalk["default"].bold('Init file disabled.'));
      } else {
        _Common["default"].printOut(_constants["default"].ERROR_MSG + _chalk["default"].bold('Return code : ' + code));
      }

      cb(null, {
        commands: commands,
        platform: platform
      });
    });
  };
  /**
   * Startup script generation
   * @method startup
   * @param {string} platform type (centos|redhat|amazon|gentoo|systemd|smf)
   */


  CLI.prototype.startup = function (platform, opts, cb) {
    var that = this;
    var actual_platform = detectInitSystem();
    var user = opts.user || process.env.USER || process.env.LOGNAME; // Use LOGNAME on Solaris-like systems

    var service_name = opts.serviceName || 'pm2-' + user;
    var openrc_service_name = 'pm2';
    var launchd_service_name = opts.serviceName || 'pm2.' + user;
    if (!platform) platform = actual_platform;else if (actual_platform && actual_platform !== platform) {
      _Common["default"].printOut('-----------------------------------------------------------');

      _Common["default"].printOut(' PM2 detected ' + actual_platform + ' but you precised ' + platform);

      _Common["default"].printOut(' Please verify that your choice is indeed your init system');

      _Common["default"].printOut(' If you arent sure, just run : pm2 startup');

      _Common["default"].printOut('-----------------------------------------------------------');
    }
    if (platform == null) throw new Error('Init system not found');

    if (!cb) {
      cb = function cb(err, data) {
        if (err) return that.exitCli(_constants["default"].ERROR_EXIT);
        return that.exitCli(_constants["default"].SUCCESS_EXIT);
      };
    }

    if (process.getuid() != 0) {
      return isNotRoot('setup', platform, opts, cb);
    }

    var destination;
    var commands;
    var template;

    function getTemplate(type) {
      return _fs["default"].readFileSync(_path["default"].join(__dirname, '..', 'templates/init-scripts', type + '.tpl'), {
        encoding: 'utf8'
      });
    }

    switch (platform) {
      case 'ubuntu':
      case 'centos':
      case 'arch':
      case 'oracle':
      case 'systemd':
        if (opts.waitIp) template = getTemplate('systemd-online');else template = getTemplate('systemd');
        destination = '/etc/systemd/system/' + service_name + '.service';
        commands = ['systemctl enable ' + service_name];
        break;

      case 'ubuntu14':
      case 'ubuntu12':
      case 'upstart':
        template = getTemplate('upstart');
        destination = '/etc/init.d/' + service_name;
        commands = ['chmod +x ' + destination, 'mkdir -p /var/lock/subsys', 'touch /var/lock/subsys/' + service_name, 'update-rc.d ' + service_name + ' defaults'];
        break;

      case 'systemv':
      case 'amazon':
      case 'centos6':
        template = getTemplate('upstart');
        destination = '/etc/init.d/' + service_name;
        commands = ['chmod +x ' + destination, 'mkdir -p /var/lock/subsys', 'touch /var/lock/subsys/' + service_name, 'chkconfig --add ' + service_name, 'chkconfig ' + service_name + ' on', 'initctl list'];
        break;

      case 'macos':
      case 'darwin':
      case 'launchd':
        template = getTemplate('launchd');
        destination = _path["default"].join(process.env.HOME, 'Library/LaunchAgents/' + launchd_service_name + '.plist');
        commands = ['launchctl load -w ' + destination];
        break;

      case 'freebsd':
      case 'rcd':
        template = getTemplate('rcd');
        service_name = opts.serviceName || 'pm2_' + user;
        destination = '/usr/local/etc/rc.d/' + service_name;
        commands = ['chmod 755 ' + destination, 'sysrc ' + service_name + '_enable=YES'];
        break;

      case 'openbsd':
      case 'rcd-openbsd':
        template = getTemplate('rcd-openbsd');
        service_name = opts.serviceName || 'pm2_' + user;
        destination = _path["default"].join('/etc/rc.d/', service_name);
        commands = ['chmod 755 ' + destination, 'rcctl enable ' + service_name, 'rcctl start ' + service_name];
        break;

      case 'openrc':
        template = getTemplate('openrc');
        service_name = openrc_service_name;
        destination = '/etc/init.d/' + service_name;
        commands = ['chmod +x ' + destination, 'rc-update add ' + service_name + ' default'];
        break;

      case 'smf':
      case 'sunos':
      case 'solaris':
        template = getTemplate('smf');
        service_name = opts.serviceName || 'pm2_' + user;
        destination = _path["default"].join((0, _os.tmpdir)(), service_name + '.xml');
        commands = ['svccfg import ' + destination, 'svcadm enable ' + service_name];
        break;

      default:
        throw new Error('Unknown platform / init system name');
    }
    /**
     * 4# Replace template variable value
     */


    var envPath;
    if (_constants["default"].HAS_NODE_EMBEDDED == true) envPath = _util["default"].format('%s:%s', process.env.PATH || '', _path["default"].dirname(process.execPath));else if (new RegExp(_path["default"].dirname(process.execPath)).test(process.env.PATH)) envPath = process.env.PATH;else envPath = _util["default"].format('%s:%s', process.env.PATH || '', _path["default"].dirname(process.execPath));
    template = template.replace(/%PM2_PATH%/g, process.mainModule.filename).replace(/%NODE_PATH%/g, envPath).replace(/%USER%/g, user).replace(/%HOME_PATH%/g, opts.hp ? _path["default"].resolve(opts.hp, '.pm2') : _constants["default"].PM2_ROOT_PATH).replace(/%SERVICE_NAME%/g, service_name);

    _Common["default"].printOut(_chalk["default"].bold('Platform'), platform);

    _Common["default"].printOut(_chalk["default"].bold('Template'));

    _Common["default"].printOut(template);

    _Common["default"].printOut(_chalk["default"].bold('Target path'));

    _Common["default"].printOut(destination);

    _Common["default"].printOut(_chalk["default"].bold('Command list'));

    _Common["default"].printOut(commands);

    _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Writing init configuration in ' + destination);

    try {
      _fs["default"].writeFileSync(destination, template);
    } catch (e) {
      console.error(_constants["default"].PREFIX_MSG_ERR + 'Failure when trying to write startup script');
      console.error(e.message || e);
      return cb(e);
    }

    _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Making script booting at startup...');

    (0, _forEachLimit["default"])(commands, 1, function (command, next) {
      _Common["default"].printOut(_constants["default"].PREFIX_MSG + '[-] Executing: %s...', _chalk["default"].bold(command));

      (0, _sexec["default"])(command, function (code, stdout, stderr) {
        if (code === 0) {
          _Common["default"].printOut(_constants["default"].PREFIX_MSG + _chalk["default"].bold('[v] Command successfully executed.'));

          return next();
        } else {
          _Common["default"].printOut(_chalk["default"].red('[ERROR] Exit code : ' + code));

          return next(new Error(command + ' failed, see error above.'));
        }
      });
    }, function (err) {
      if (err) {
        console.error(_constants["default"].PREFIX_MSG_ERR + (err.message || err));
        return cb(err);
      }

      _Common["default"].printOut(_chalk["default"].bold.blue('+---------------------------------------+'));

      _Common["default"].printOut(_chalk["default"].bold.blue(_constants["default"].PREFIX_MSG + 'Freeze a process list on reboot via:'));

      _Common["default"].printOut(_chalk["default"].bold('$ pm2 save'));

      _Common["default"].printOut('');

      _Common["default"].printOut(_chalk["default"].bold.blue(_constants["default"].PREFIX_MSG + 'Remove init script via:'));

      _Common["default"].printOut(_chalk["default"].bold('$ pm2 unstartup ' + platform));

      return cb(null, {
        destination: destination,
        template: template
      });
    });
  };
  /**
   * DISABLED FEATURE
   * KEEPING METHOD FOR BACKWARD COMPAT
   */


  CLI.prototype.autodump = function (cb) {
    return cb();
  };
  /**
   * Dump current processes managed by pm2 into DUMP_FILE_PATH file
   * @method dump
   * @param {} cb
   * @return
   */


  CLI.prototype.dump = function (force, cb) {
    var env_arr = [];
    var that = this;

    if (typeof force === 'function') {
      cb = force;
      force = false;
    }

    if (!cb) _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Saving current process list...');
    that.Client.executeRemote('getMonitorData', {}, function (err, list) {
      if (err) {
        _Common["default"].printError('Error retrieving process list: ' + err);

        return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      }
      /**
       * Description
       * @method fin
       * @param {} err
       * @return
       */


      function fin(err) {
        // try to fix issues with empty dump file
        // like #3485
        if (!force && env_arr.length === 0 && !process.env.FORCE) {
          // fix : if no dump file, no process, only module and after pm2 update
          if (!_fs["default"].existsSync(_constants["default"].DUMP_FILE_PATH)) {
            that.clearDump(function () {});
          } // if no process in list don't modify dump file
          // process list should not be empty


          if (cb) {
            return cb(new Error('Process list empty, cannot save empty list'));
          } else {
            _Common["default"].printOut(_constants["default"].PREFIX_MSG_WARNING + 'PM2 is not managing any process, skipping save...');

            _Common["default"].printOut(_constants["default"].PREFIX_MSG_WARNING + 'To force saving use: pm2 save --force');

            that.exitCli(_constants["default"].SUCCESS_EXIT);
            return;
          }
        } // Back up dump file


        try {
          if (_fs["default"].existsSync(_constants["default"].DUMP_FILE_PATH)) {
            _fs["default"].writeFileSync(_constants["default"].DUMP_BACKUP_FILE_PATH, _fs["default"].readFileSync(_constants["default"].DUMP_FILE_PATH));
          }
        } catch (e) {
          console.error(e.stack || e);

          _Common["default"].printOut(_constants["default"].PREFIX_MSG_ERR + 'Failed to back up dump file in %s', _constants["default"].DUMP_BACKUP_FILE_PATH);
        } // Overwrite dump file, delete if broken and exit


        try {
          _fs["default"].writeFileSync(_constants["default"].DUMP_FILE_PATH, JSON.stringify(env_arr, [""], 2));
        } catch (e) {
          console.error(e.stack || e);

          try {
            // try to backup file
            if (_fs["default"].existsSync(_constants["default"].DUMP_BACKUP_FILE_PATH)) {
              _fs["default"].writeFileSync(_constants["default"].DUMP_FILE_PATH, _fs["default"].readFileSync(_constants["default"].DUMP_BACKUP_FILE_PATH));
            }
          } catch (e) {
            // don't keep broken file
            _fs["default"].unlinkSync(_constants["default"].DUMP_FILE_PATH);

            console.error(e.stack || e);
          }

          _Common["default"].printOut(_constants["default"].PREFIX_MSG_ERR + 'Failed to save dump file in %s', _constants["default"].DUMP_FILE_PATH);

          return that.exitCli(_constants["default"].ERROR_EXIT);
        }

        if (cb) return cb(null, {
          success: true
        });

        _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Successfully saved in %s', _constants["default"].DUMP_FILE_PATH);

        return that.exitCli(_constants["default"].SUCCESS_EXIT);
      }

      (function ex(apps) {
        if (!apps[0]) return fin(null);
        delete apps[0].pm2_env.instances;
        delete apps[0].pm2_env.pm_id;
        delete apps[0].pm2_env.prev_restart_delay;
        if (!apps[0].pm2_env.pmx_module) env_arr.push(apps[0].pm2_env);
        apps.shift();
        return ex(apps);
      })(list);
    });
  };
  /**
   * Remove DUMP_FILE_PATH file and DUMP_BACKUP_FILE_PATH file
   * @method dump
   * @param {} cb
   * @return
   */


  CLI.prototype.clearDump = function (cb) {
    _fs["default"].writeFileSync(_constants["default"].DUMP_FILE_PATH, JSON.stringify([]));

    if (cb && typeof cb === 'function') return cb();

    _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Successfully created %s', _constants["default"].DUMP_FILE_PATH);

    return this.exitCli(_constants["default"].SUCCESS_EXIT);
  };
  /**
   * Resurrect processes
   * @method resurrect
   * @param {} cb
   * @return
   */


  CLI.prototype.resurrect = function (cb) {
    var apps = {};
    var that = this;
    var processes;

    function readDumpFile(dumpFilePath) {
      _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Restoring processes located in %s', dumpFilePath);

      try {
        var apps = _fs["default"].readFileSync(dumpFilePath);
      } catch (e) {
        _Common["default"].printError(_constants["default"].PREFIX_MSG_ERR + 'Failed to read dump file in %s', dumpFilePath);

        throw e;
      }

      return apps;
    }

    function parseDumpFile(dumpFilePath, apps) {
      try {
        var processes = _Common["default"].parseConfig(apps, 'none');
      } catch (e) {
        _Common["default"].printError(_constants["default"].PREFIX_MSG_ERR + 'Failed to parse dump file in %s', dumpFilePath);

        try {
          _fs["default"].unlinkSync(dumpFilePath);
        } catch (e) {
          console.error(e.stack || e);
        }

        throw e;
      }

      return processes;
    } // Read dump file, fall back to backup, delete if broken


    try {
      apps = readDumpFile(_constants["default"].DUMP_FILE_PATH);
      processes = parseDumpFile(_constants["default"].DUMP_FILE_PATH, apps);
    } catch (e) {
      try {
        apps = readDumpFile(_constants["default"].DUMP_BACKUP_FILE_PATH);
        processes = parseDumpFile(_constants["default"].DUMP_BACKUP_FILE_PATH, apps);
      } catch (e) {
        _Common["default"].printError(_constants["default"].PREFIX_MSG_ERR + 'No processes saved; DUMP file doesn\'t exist'); // if (cb) return cb(Common.retErr(e));
        // else return that.exitCli(cst.ERROR_EXIT);


        return that.speedList();
      }
    }

    that.Client.executeRemote('getMonitorData', {}, function (err, list) {
      if (err) {
        _Common["default"].printError(err);

        return that.exitCli(1);
      }

      var current = [];
      var target = [];
      list.forEach(function (app) {
        if (!current[app.name]) current[app.name] = 0;
        current[app.name]++;
      });
      processes.forEach(function (app) {
        if (!target[app.name]) target[app.name] = 0;
        target[app.name]++;
      });
      var tostart = Object.keys(target).filter(function (i) {
        return Object.keys(current).indexOf(i) < 0;
      });
      (0, _eachLimit["default"])(processes, _constants["default"].CONCURRENT_ACTIONS, function (app, next) {
        if (tostart.indexOf(app.name) == -1) return next();
        that.Client.executeRemote('prepare', app, function (err, dt) {
          if (err) _Common["default"].printError(err);else _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Process %s restored', app.pm_exec_path);
          next();
        });
      }, function (err) {
        return cb ? cb(null, apps) : that.speedList();
      });
    });
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvU3RhcnR1cC50cyJdLCJuYW1lcyI6WyJDTEkiLCJpc05vdFJvb3QiLCJzdGFydHVwX21vZGUiLCJwbGF0Zm9ybSIsIm9wdHMiLCJjYiIsIkNvbW1vbiIsInByaW50T3V0IiwiY3N0IiwiUFJFRklYX01TRyIsInVzZXIiLCJjb25zb2xlIiwibG9nIiwicGF0aCIsImRpcm5hbWUiLCJwcm9jZXNzIiwiZXhlY1BhdGgiLCJhcmdzIiwibmFtZSIsImVudiIsIkhPTUUiLCJFcnJvciIsInNpbGVudCIsImVyciIsInN0ZG91dCIsInN0ZGVyciIsInJlcXVpcmUiLCJtYWluIiwiZmlsZW5hbWUiLCJ0cmltIiwiZGV0ZWN0SW5pdFN5c3RlbSIsImhhc2hfbWFwIiwiaW5pdF9zeXN0ZW1zIiwiT2JqZWN0Iiwia2V5cyIsImkiLCJsZW5ndGgiLCJwcmludEVycm9yIiwiUFJFRklYX01TR19FUlIiLCJjaGFsayIsImJvbGQiLCJwcm90b3R5cGUiLCJ1bmluc3RhbGxTdGFydHVwIiwiY29tbWFuZHMiLCJ0aGF0IiwiYWN0dWFsX3BsYXRmb3JtIiwiVVNFUiIsIkxPR05BTUUiLCJzZXJ2aWNlX25hbWUiLCJzZXJ2aWNlTmFtZSIsIm9wZW5yY19zZXJ2aWNlX25hbWUiLCJsYXVuY2hkX3NlcnZpY2VfbmFtZSIsImRhdGEiLCJleGl0Q2xpIiwiRVJST1JfRVhJVCIsIlNVQ0NFU1NfRVhJVCIsImdldHVpZCIsImZzIiwiZXhpc3RzU3luYyIsImRlc3RpbmF0aW9uIiwiam9pbiIsImNvZGUiLCJFUlJPUl9NU0ciLCJzdGFydHVwIiwidGVtcGxhdGUiLCJnZXRUZW1wbGF0ZSIsInR5cGUiLCJyZWFkRmlsZVN5bmMiLCJfX2Rpcm5hbWUiLCJlbmNvZGluZyIsIndhaXRJcCIsImVudlBhdGgiLCJIQVNfTk9ERV9FTUJFRERFRCIsInV0aWwiLCJmb3JtYXQiLCJQQVRIIiwiUmVnRXhwIiwidGVzdCIsInJlcGxhY2UiLCJtYWluTW9kdWxlIiwiaHAiLCJyZXNvbHZlIiwiUE0yX1JPT1RfUEFUSCIsIndyaXRlRmlsZVN5bmMiLCJlIiwiZXJyb3IiLCJtZXNzYWdlIiwiY29tbWFuZCIsIm5leHQiLCJyZWQiLCJibHVlIiwiYXV0b2R1bXAiLCJkdW1wIiwiZm9yY2UiLCJlbnZfYXJyIiwiQ2xpZW50IiwiZXhlY3V0ZVJlbW90ZSIsImxpc3QiLCJyZXRFcnIiLCJmaW4iLCJGT1JDRSIsIkRVTVBfRklMRV9QQVRIIiwiY2xlYXJEdW1wIiwiUFJFRklYX01TR19XQVJOSU5HIiwiRFVNUF9CQUNLVVBfRklMRV9QQVRIIiwic3RhY2siLCJKU09OIiwic3RyaW5naWZ5IiwidW5saW5rU3luYyIsInN1Y2Nlc3MiLCJleCIsImFwcHMiLCJwbTJfZW52IiwiaW5zdGFuY2VzIiwicG1faWQiLCJwcmV2X3Jlc3RhcnRfZGVsYXkiLCJwbXhfbW9kdWxlIiwicHVzaCIsInNoaWZ0IiwicmVzdXJyZWN0IiwicHJvY2Vzc2VzIiwicmVhZER1bXBGaWxlIiwiZHVtcEZpbGVQYXRoIiwicGFyc2VEdW1wRmlsZSIsInBhcnNlQ29uZmlnIiwic3BlZWRMaXN0IiwiY3VycmVudCIsInRhcmdldCIsImZvckVhY2giLCJhcHAiLCJ0b3N0YXJ0IiwiZmlsdGVyIiwiaW5kZXhPZiIsIkNPTkNVUlJFTlRfQUNUSU9OUyIsImR0IiwicG1fZXhlY19wYXRoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBS0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFmQTs7Ozs7QUFnQmUsa0JBQVNBLEdBQVQsRUFBYztBQUMzQjs7OztBQUlBLFdBQVNDLFNBQVQsQ0FBbUJDLFlBQW5CLEVBQWlDQyxRQUFqQyxFQUEyQ0MsSUFBM0MsRUFBaURDLEVBQWpELEVBQXFEO0FBQ25EQyx1QkFBT0MsUUFBUCxXQUFtQkMsc0JBQUlDLFVBQXZCLGdCQUF1Q1AsWUFBdkM7O0FBQ0EsUUFBSUUsSUFBSSxDQUFDTSxJQUFULEVBQWU7QUFDYkMsTUFBQUEsT0FB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RyxJQUFQLENBQUwsR0FBb0JuRSxJQUFJLENBQUNpRixTQUFMLEVBQTdCO0FBQ0QsT0FaRDtBQWFELEtBdENEO0FBdUNELEdBekZEO0FBMkZEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgbGljZW5zZSB0aGF0XG4gKiBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cbiAqL1xuaW1wb3J0IGNoYWxrICAgICAgICBmcm9tICdjaGFsayc7XG5pbXBvcnQgcGF0aCAgICAgICAgIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzICAgICAgICAgICBmcm9tICdmcyc7XG5pbXBvcnQgZm9yRWFjaExpbWl0IGZyb20gJ2FzeW5jL2ZvckVhY2hMaW1pdCc7XG5pbXBvcnQgZWFjaExpbWl0ICAgIGZyb20gJ2FzeW5jL2VhY2hMaW1pdCc7XG5pbXBvcnQgQ29tbW9uICAgICAgIGZyb20gJy4uL0NvbW1vbi5qcyc7XG5pbXBvcnQgY3N0ICAgICAgICAgIGZyb20gJy4uLy4uL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgdXRpbCBcdCAgICAgICBmcm9tICd1dGlsJztcbmltcG9ydCB7IHRtcGRpciBhcyB0bXBQYXRoIH0gICAgIGZyb20gJ29zJztcbmltcG9ydCB3aGljaCAgICAgICAgZnJvbSAnLi4vdG9vbHMvd2hpY2guanMnO1xuaW1wb3J0IHNleGVjIGZyb20gJy4uL3Rvb2xzL3NleGVjJztcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKENMSSkge1xuICAvKipcbiAgICogSWYgY29tbWFuZCBpcyBsYXVuY2hlZCB3aXRob3V0IHJvb3QgcmlnaHRcbiAgICogRGlzcGxheSBoZWxwZXJcbiAgICovXG4gIGZ1bmN0aW9uIGlzTm90Um9vdChzdGFydHVwX21vZGUsIHBsYXRmb3JtLCBvcHRzLCBjYikge1xuICAgIENvbW1vbi5wcmludE91dChgJHtjc3QuUFJFRklYX01TR31UbyAke3N0YXJ0dXBfbW9kZX0gdGhlIFN0YXJ0dXAgU2NyaXB0LCBjb3B5L3Bhc3RlIHRoZSBmb2xsb3dpbmcgY29tbWFuZDpgKTtcbiAgICBpZiAob3B0cy51c2VyKSB7XG4gICAgICBjb25zb2xlLmxvZygnc3VkbyBlbnYgUEFUSD0kUEFUSDonICsgcGF0aC5kaXJuYW1lKHByb2Nlc3MuZXhlY1BhdGgpICsgJyBwbTIgJyArIG9wdHMuYXJnc1sxXS5uYW1lKCkgKyAnICcgKyBwbGF0Zm9ybSArICcgLXUgJyArIG9wdHMudXNlciArICcgLS1ocCAnICsgcHJvY2Vzcy5lbnYuSE9NRSk7XG4gICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdZb3UgaGF2ZSB0byBydW4gdGhpcyB3aXRoIGVsZXZhdGVkIHJpZ2h0cycpKTtcbiAgICB9XG4gICAgcmV0dXJuIHNleGVjKCd3aG9hbWknLCB7c2lsZW50OiB0cnVlfSwgZnVuY3Rpb24oZXJyLCBzdGRvdXQsIHN0ZGVycikge1xuICAgICAgY29uc29sZS5sb2coJ3N1ZG8gZW52IFBBVEg9JFBBVEg6JyArIHBhdGguZGlybmFtZShwcm9jZXNzLmV4ZWNQYXRoKSArICcgJyArIHJlcXVpcmUubWFpbi5maWxlbmFtZSArICcgJyArIG9wdHMuYXJnc1sxXS5uYW1lKCkgKyAnICcgKyBwbGF0Zm9ybSArICcgLXUgJyArIHN0ZG91dC50cmltKCkgKyAnIC0taHAgJyArIHByb2Nlc3MuZW52LkhPTUUpO1xuICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcignWW91IGhhdmUgdG8gcnVuIHRoaXMgd2l0aCBlbGV2YXRlZCByaWdodHMnKSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZWN0IHJ1bm5pbmcgaW5pdCBzeXN0ZW1cbiAgICovXG4gIGZ1bmN0aW9uIGRldGVjdEluaXRTeXN0ZW0oKSB7XG4gICAgdmFyIGhhc2hfbWFwID0ge1xuICAgICAgJ3N5c3RlbWN0bCcgIDogJ3N5c3RlbWQnLFxuICAgICAgJ3VwZGF0ZS1yYy5kJzogJ3Vwc3RhcnQnLFxuICAgICAgJ2Noa2NvbmZpZycgIDogJ3N5c3RlbXYnLFxuICAgICAgJ3JjLXVwZGF0ZScgIDogJ29wZW5yYycsXG4gICAgICAnbGF1bmNoY3RsJyAgOiAnbGF1bmNoZCcsXG4gICAgICAnc3lzcmMnICAgICAgOiAncmNkJyxcbiAgICAgICdyY2N0bCcgICAgICA6ICdyY2Qtb3BlbmJzZCcsXG4gICAgICAnc3ZjYWRtJyAgICAgOiAnc21mJ1xuICAgIH07XG4gICAgdmFyIGluaXRfc3lzdGVtcyA9IE9iamVjdC5rZXlzKGhhc2hfbWFwKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5pdF9zeXN0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAod2hpY2goaW5pdF9zeXN0ZW1zW2ldKSAhPSBudWxsKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpID49IGluaXRfc3lzdGVtcy5sZW5ndGgpIHtcbiAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArICdJbml0IHN5c3RlbSBub3QgZm91bmQnKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnSW5pdCBTeXN0ZW0gZm91bmQ6ICcgKyBjaGFsay5ib2xkKGhhc2hfbWFwW2luaXRfc3lzdGVtc1tpXV0pKTtcbiAgICByZXR1cm4gaGFzaF9tYXBbaW5pdF9zeXN0ZW1zW2ldXTtcbiAgfVxuXG4gIENMSS5wcm90b3R5cGUudW5pbnN0YWxsU3RhcnR1cCA9IGZ1bmN0aW9uKHBsYXRmb3JtLCBvcHRzLCBjYikge1xuICAgIHZhciBjb21tYW5kcztcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIGFjdHVhbF9wbGF0Zm9ybSA9IGRldGVjdEluaXRTeXN0ZW0oKTtcbiAgICB2YXIgdXNlciA9IG9wdHMudXNlciB8fCBwcm9jZXNzLmVudi5VU0VSIHx8IHByb2Nlc3MuZW52LkxPR05BTUU7IC8vIFVzZSBMT0dOQU1FIG9uIFNvbGFyaXMtbGlrZSBzeXN0ZW1zXG4gICAgdmFyIHNlcnZpY2VfbmFtZSA9IChvcHRzLnNlcnZpY2VOYW1lIHx8ICdwbTItJyArIHVzZXIpO1xuICAgIHZhciBvcGVucmNfc2VydmljZV9uYW1lID0gJ3BtMic7XG4gICAgdmFyIGxhdW5jaGRfc2VydmljZV9uYW1lID0gKG9wdHMuc2VydmljZU5hbWUgfHwgJ3BtMi4nICsgdXNlcik7XG5cbiAgICBpZiAoIXBsYXRmb3JtKVxuICAgICAgcGxhdGZvcm0gPSBhY3R1YWxfcGxhdGZvcm07XG4gICAgZWxzZSBpZiAoYWN0dWFsX3BsYXRmb3JtICYmIGFjdHVhbF9wbGF0Zm9ybSAhPT0gcGxhdGZvcm0pIHtcbiAgICAgIENvbW1vbi5wcmludE91dCgnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKVxuICAgICAgQ29tbW9uLnByaW50T3V0KCcgUE0yIGRldGVjdGVkICcgKyBhY3R1YWxfcGxhdGZvcm0gKyAnIGJ1dCB5b3UgcHJlY2lzZWQgJyArIHBsYXRmb3JtKVxuICAgICAgQ29tbW9uLnByaW50T3V0KCcgUGxlYXNlIHZlcmlmeSB0aGF0IHlvdXIgY2hvaWNlIGlzIGluZGVlZCB5b3VyIGluaXQgc3lzdGVtJylcbiAgICAgIENvbW1vbi5wcmludE91dCgnIElmIHlvdSBhcmVudCBzdXJlLCBqdXN0IHJ1biA6IHBtMiBzdGFydHVwJylcbiAgICAgIENvbW1vbi5wcmludE91dCgnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKVxuICAgIH1cbiAgICBpZiAocGxhdGZvcm0gPT09IG51bGwpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luaXQgc3lzdGVtIG5vdCBmb3VuZCcpXG5cbiAgICBpZiAoIWNiKSB7XG4gICAgICBjYiA9IGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwcm9jZXNzLmdldHVpZCgpICE9IDApIHtcbiAgICAgIHJldHVybiBpc05vdFJvb3QoJ3Vuc2V0dXAnLCBwbGF0Zm9ybSwgb3B0cywgY2IpO1xuICAgIH1cblxuICAgIGlmIChmcy5leGlzdHNTeW5jKCcvZXRjL2luaXQuZC9wbTItaW5pdC5zaCcpKSB7XG4gICAgICBwbGF0Zm9ybSA9ICdvbGRzeXN0ZW0nO1xuICAgIH1cblxuICAgIHN3aXRjaChwbGF0Zm9ybSkge1xuICAgIGNhc2UgJ3N5c3RlbWQnOlxuICAgICAgY29tbWFuZHMgPSBbXG4gICAgICAgICdzeXN0ZW1jdGwgc3RvcCAnICsgc2VydmljZV9uYW1lLFxuICAgICAgICAnc3lzdGVtY3RsIGRpc2FibGUgJyArIHNlcnZpY2VfbmFtZSxcbiAgICAgICAgJ3JtIC9ldGMvc3lzdGVtZC9zeXN0ZW0vJyArIHNlcnZpY2VfbmFtZSArICcuc2VydmljZSdcbiAgICAgIF07XG4gICAgICBicmVhaztcbiAgICBjYXNlICdzeXN0ZW12JzpcbiAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAnY2hrY29uZmlnICcgKyBzZXJ2aWNlX25hbWUgKyAnIG9mZicsXG4gICAgICAgICdybSAvZXRjL2luaXQuZC8nICsgc2VydmljZV9uYW1lXG4gICAgICBdO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnb2xkc3lzdGVtJzpcbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdEaXNhYmxpbmcgYW5kIGRlbGV0aW5nIG9sZCBzdGFydHVwIHN5c3RlbScpO1xuICAgICAgY29tbWFuZHMgPSBbXG4gICAgICAgICd1cGRhdGUtcmMuZCBwbTItaW5pdC5zaCBkaXNhYmxlJyxcbiAgICAgICAgJ3VwZGF0ZS1yYy5kIC1mIHBtMi1pbml0LnNoIHJlbW92ZScsXG4gICAgICAgICdybSAvZXRjL2luaXQuZC9wbTItaW5pdC5zaCdcbiAgICAgIF07XG4gICAgICBicmVhaztcbiAgICBjYXNlICdvcGVucmMnOlxuICAgICAgc2VydmljZV9uYW1lID0gb3BlbnJjX3NlcnZpY2VfbmFtZTtcbiAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAnL2V0Yy9pbml0LmQvJyArIHNlcnZpY2VfbmFtZSArICcgc3RvcCcsXG4gICAgICAgICdyYy11cGRhdGUgZGVsZXRlICcgKyBzZXJ2aWNlX25hbWUgKyAnIGRlZmF1bHQnLFxuICAgICAgICAncm0gL2V0Yy9pbml0LmQvJyArIHNlcnZpY2VfbmFtZVxuICAgICAgXTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3Vwc3RhcnQnOlxuICAgICAgY29tbWFuZHMgPSBbXG4gICAgICAgICd1cGRhdGUtcmMuZCAnICsgc2VydmljZV9uYW1lICsgJyBkaXNhYmxlJyxcbiAgICAgICAgJ3VwZGF0ZS1yYy5kIC1mICcgKyBzZXJ2aWNlX25hbWUgKyAnIHJlbW92ZScsXG4gICAgICAgICdybSAvZXRjL2luaXQuZC8nICsgc2VydmljZV9uYW1lXG4gICAgICBdO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGF1bmNoZCc6XG4gICAgICB2YXIgZGVzdGluYXRpb24gPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSwgJ0xpYnJhcnkvTGF1bmNoQWdlbnRzLycgKyBsYXVuY2hkX3NlcnZpY2VfbmFtZSArICcucGxpc3QnKTtcbiAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAnbGF1bmNoY3RsIHJlbW92ZSAnICsgbGF1bmNoZF9zZXJ2aWNlX25hbWUgKyAnIHx8IHRydWUnLFxuICAgICAgICAncm0gJyArIGRlc3RpbmF0aW9uXG4gICAgICBdO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncmNkJzpcbiAgICAgIHNlcnZpY2VfbmFtZSA9IChvcHRzLnNlcnZpY2VOYW1lIHx8ICdwbTJfJyArIHVzZXIpO1xuICAgICAgY29tbWFuZHMgPSBbXG4gICAgICAgICcvdXNyL2xvY2FsL2V0Yy9yYy5kLycgKyBzZXJ2aWNlX25hbWUgKyAnIHN0b3AnLFxuICAgICAgICAnc3lzcmMgLXggJyArIHNlcnZpY2VfbmFtZSAgKyAnX2VuYWJsZScsXG4gICAgICAgICdybSAvdXNyL2xvY2FsL2V0Yy9yYy5kLycgKyBzZXJ2aWNlX25hbWVcbiAgICAgIF07XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyY2Qtb3BlbmJzZCc6XG4gICAgICBzZXJ2aWNlX25hbWUgPSAob3B0cy5zZXJ2aWNlTmFtZSB8fCAncG0yXycgKyB1c2VyKTtcbiAgICAgIHZhciBkZXN0aW5hdGlvbiA9IHBhdGguam9pbignL2V0Yy9yYy5kJywgc2VydmljZV9uYW1lKTtcbiAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAncmNjdGwgc3RvcCAnICsgc2VydmljZV9uYW1lLFxuICAgICAgICAncmNjdGwgZGlzYWJsZSAnICsgc2VydmljZV9uYW1lLFxuICAgICAgICAncm0gJyArIGRlc3RpbmF0aW9uXG4gICAgICBdO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnc21mJzpcbiAgICAgIHNlcnZpY2VfbmFtZSA9IChvcHRzLnNlcnZpY2VOYW1lIHx8ICdwbTJfJyArIHVzZXIpO1xuICAgICAgY29tbWFuZHMgPSBbXG4gICAgICAgICdzdmNhZG0gZGlzYWJsZSAnICsgc2VydmljZV9uYW1lLFxuICAgICAgICAnc3ZjY2ZnIGRlbGV0ZSAtZiAnICsgc2VydmljZV9uYW1lXG4gICAgICBdXG4gICAgfTtcblxuICAgIHNleGVjKGNvbW1hbmRzLmpvaW4oJyYmICcpLCBmdW5jdGlvbihjb2RlLCBzdGRvdXQsIHN0ZGVycikge1xuICAgICAgQ29tbW9uLnByaW50T3V0KHN0ZG91dCk7XG4gICAgICBDb21tb24ucHJpbnRPdXQoc3RkZXJyKTtcbiAgICAgIGlmIChjb2RlID09IDApIHtcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgY2hhbGsuYm9sZCgnSW5pdCBmaWxlIGRpc2FibGVkLicpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIENvbW1vbi5wcmludE91dChjc3QuRVJST1JfTVNHICsgY2hhbGsuYm9sZCgnUmV0dXJuIGNvZGUgOiAnICsgY29kZSkpO1xuICAgICAgfVxuXG4gICAgICBjYihudWxsLCB7XG4gICAgICAgIGNvbW1hbmRzIDogY29tbWFuZHMsXG4gICAgICAgIHBsYXRmb3JtIDogcGxhdGZvcm1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTdGFydHVwIHNjcmlwdCBnZW5lcmF0aW9uXG4gICAqIEBtZXRob2Qgc3RhcnR1cFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGxhdGZvcm0gdHlwZSAoY2VudG9zfHJlZGhhdHxhbWF6b258Z2VudG9vfHN5c3RlbWR8c21mKVxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5zdGFydHVwID0gZnVuY3Rpb24ocGxhdGZvcm0sIG9wdHMsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBhY3R1YWxfcGxhdGZvcm0gPSBkZXRlY3RJbml0U3lzdGVtKCk7XG4gICAgdmFyIHVzZXIgPSAob3B0cy51c2VyIHx8IHByb2Nlc3MuZW52LlVTRVIgfHwgcHJvY2Vzcy5lbnYuTE9HTkFNRSk7IC8vIFVzZSBMT0dOQU1FIG9uIFNvbGFyaXMtbGlrZSBzeXN0ZW1zXG4gICAgdmFyIHNlcnZpY2VfbmFtZSA9IChvcHRzLnNlcnZpY2VOYW1lIHx8ICdwbTItJyArIHVzZXIpO1xuICAgIHZhciBvcGVucmNfc2VydmljZV9uYW1lID0gJ3BtMic7XG4gICAgdmFyIGxhdW5jaGRfc2VydmljZV9uYW1lID0gKG9wdHMuc2VydmljZU5hbWUgfHwgJ3BtMi4nICsgdXNlcik7XG5cbiAgICBpZiAoIXBsYXRmb3JtKVxuICAgICAgcGxhdGZvcm0gPSBhY3R1YWxfcGxhdGZvcm07XG4gICAgZWxzZSBpZiAoYWN0dWFsX3BsYXRmb3JtICYmIGFjdHVhbF9wbGF0Zm9ybSAhPT0gcGxhdGZvcm0pIHtcbiAgICAgIENvbW1vbi5wcmludE91dCgnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKVxuICAgICAgQ29tbW9uLnByaW50T3V0KCcgUE0yIGRldGVjdGVkICcgKyBhY3R1YWxfcGxhdGZvcm0gKyAnIGJ1dCB5b3UgcHJlY2lzZWQgJyArIHBsYXRmb3JtKVxuICAgICAgQ29tbW9uLnByaW50T3V0KCcgUGxlYXNlIHZlcmlmeSB0aGF0IHlvdXIgY2hvaWNlIGlzIGluZGVlZCB5b3VyIGluaXQgc3lzdGVtJylcbiAgICAgIENvbW1vbi5wcmludE91dCgnIElmIHlvdSBhcmVudCBzdXJlLCBqdXN0IHJ1biA6IHBtMiBzdGFydHVwJylcbiAgICAgIENvbW1vbi5wcmludE91dCgnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKVxuICAgIH1cbiAgICBpZiAocGxhdGZvcm0gPT0gbnVsbClcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW5pdCBzeXN0ZW0gbm90IGZvdW5kJyk7XG5cbiAgICBpZiAoIWNiKSB7XG4gICAgICBjYiA9IGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwcm9jZXNzLmdldHVpZCgpICE9IDApIHtcbiAgICAgIHJldHVybiBpc05vdFJvb3QoJ3NldHVwJywgcGxhdGZvcm0sIG9wdHMsIGNiKTtcbiAgICB9XG5cbiAgICB2YXIgZGVzdGluYXRpb247XG4gICAgdmFyIGNvbW1hbmRzO1xuICAgIHZhciB0ZW1wbGF0ZTtcblxuICAgIGZ1bmN0aW9uIGdldFRlbXBsYXRlKHR5cGUpIHtcbiAgICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ3RlbXBsYXRlcy9pbml0LXNjcmlwdHMnLCB0eXBlICsgJy50cGwnKSwge2VuY29kaW5nOiAndXRmOCd9KTtcbiAgICB9XG5cbiAgICBzd2l0Y2gocGxhdGZvcm0pIHtcbiAgICBjYXNlICd1YnVudHUnOlxuICAgIGNhc2UgJ2NlbnRvcyc6XG4gICAgY2FzZSAnYXJjaCc6XG4gICAgY2FzZSAnb3JhY2xlJzpcbiAgICBjYXNlICdzeXN0ZW1kJzpcbiAgICAgIGlmIChvcHRzLndhaXRJcClcbiAgICAgICAgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgnc3lzdGVtZC1vbmxpbmUnKTtcbiAgICAgIGVsc2VcbiAgICAgICAgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgnc3lzdGVtZCcpO1xuICAgICAgZGVzdGluYXRpb24gPSAnL2V0Yy9zeXN0ZW1kL3N5c3RlbS8nICsgc2VydmljZV9uYW1lICsgJy5zZXJ2aWNlJztcbiAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAnc3lzdGVtY3RsIGVuYWJsZSAnICsgc2VydmljZV9uYW1lXG4gICAgICBdO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndWJ1bnR1MTQnOlxuICAgIGNhc2UgJ3VidW50dTEyJzpcbiAgICBjYXNlICd1cHN0YXJ0JzpcbiAgICAgIHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoJ3Vwc3RhcnQnKTtcbiAgICAgIGRlc3RpbmF0aW9uID0gJy9ldGMvaW5pdC5kLycgKyBzZXJ2aWNlX25hbWU7XG4gICAgICBjb21tYW5kcyA9IFtcbiAgICAgICAgJ2NobW9kICt4ICcgKyBkZXN0aW5hdGlvbixcbiAgICAgICAgJ21rZGlyIC1wIC92YXIvbG9jay9zdWJzeXMnLFxuICAgICAgICAndG91Y2ggL3Zhci9sb2NrL3N1YnN5cy8nICsgc2VydmljZV9uYW1lLFxuICAgICAgICAndXBkYXRlLXJjLmQgJyArIHNlcnZpY2VfbmFtZSArICcgZGVmYXVsdHMnXG4gICAgICBdO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnc3lzdGVtdic6XG4gICAgY2FzZSAnYW1hem9uJzpcbiAgICBjYXNlICdjZW50b3M2JzpcbiAgICAgIHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoJ3Vwc3RhcnQnKTtcbiAgICAgIGRlc3RpbmF0aW9uID0gJy9ldGMvaW5pdC5kLycgKyBzZXJ2aWNlX25hbWU7XG4gICAgICBjb21tYW5kcyA9IFtcbiAgICAgICAgJ2NobW9kICt4ICcgKyBkZXN0aW5hdGlvbixcbiAgICAgICAgJ21rZGlyIC1wIC92YXIvbG9jay9zdWJzeXMnLFxuICAgICAgICAndG91Y2ggL3Zhci9sb2NrL3N1YnN5cy8nICsgc2VydmljZV9uYW1lLFxuICAgICAgICAnY2hrY29uZmlnIC0tYWRkICcgKyBzZXJ2aWNlX25hbWUsXG4gICAgICAgICdjaGtjb25maWcgJyArIHNlcnZpY2VfbmFtZSArICcgb24nLFxuICAgICAgICAnaW5pdGN0bCBsaXN0J1xuICAgICAgXTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ21hY29zJzpcbiAgICBjYXNlICdkYXJ3aW4nOlxuICAgIGNhc2UgJ2xhdW5jaGQnOlxuICAgICAgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgnbGF1bmNoZCcpO1xuICAgICAgZGVzdGluYXRpb24gPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSwgJ0xpYnJhcnkvTGF1bmNoQWdlbnRzLycgKyBsYXVuY2hkX3NlcnZpY2VfbmFtZSArICcucGxpc3QnKTtcbiAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAnbGF1bmNoY3RsIGxvYWQgLXcgJyArIGRlc3RpbmF0aW9uXG4gICAgICBdXG4gICAgICBicmVhaztcbiAgICBjYXNlICdmcmVlYnNkJzpcbiAgICBjYXNlICdyY2QnOlxuICAgICAgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgncmNkJyk7XG4gICAgICBzZXJ2aWNlX25hbWUgPSAob3B0cy5zZXJ2aWNlTmFtZSB8fCAncG0yXycgKyB1c2VyKTtcbiAgICAgIGRlc3RpbmF0aW9uID0gJy91c3IvbG9jYWwvZXRjL3JjLmQvJyArIHNlcnZpY2VfbmFtZTtcbiAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAnY2htb2QgNzU1ICcgKyBkZXN0aW5hdGlvbixcbiAgICAgICAgJ3N5c3JjICcgKyBzZXJ2aWNlX25hbWUgKyAnX2VuYWJsZT1ZRVMnXG4gICAgICBdO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnb3BlbmJzZCc6XG4gICAgY2FzZSAncmNkLW9wZW5ic2QnOlxuICAgICAgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgncmNkLW9wZW5ic2QnKTtcbiAgICAgIHNlcnZpY2VfbmFtZSA9IChvcHRzLnNlcnZpY2VOYW1lIHx8ICdwbTJfJyArIHVzZXIpO1xuICAgICAgZGVzdGluYXRpb24gPSBwYXRoLmpvaW4oJy9ldGMvcmMuZC8nLCBzZXJ2aWNlX25hbWUpO1xuICAgICAgY29tbWFuZHMgPSBbXG4gICAgICAgICdjaG1vZCA3NTUgJyArIGRlc3RpbmF0aW9uLFxuICAgICAgICAncmNjdGwgZW5hYmxlICcgKyBzZXJ2aWNlX25hbWUsXG4gICAgICAgICdyY2N0bCBzdGFydCAnICsgc2VydmljZV9uYW1lXG4gICAgICBdO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnb3BlbnJjJzpcbiAgICAgIHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoJ29wZW5yYycpO1xuICAgICAgc2VydmljZV9uYW1lID0gb3BlbnJjX3NlcnZpY2VfbmFtZTtcbiAgICAgIGRlc3RpbmF0aW9uID0gJy9ldGMvaW5pdC5kLycgKyBzZXJ2aWNlX25hbWU7XG4gICAgICBjb21tYW5kcyA9IFtcbiAgICAgICAgJ2NobW9kICt4ICcgKyBkZXN0aW5hdGlvbixcbiAgICAgICAgJ3JjLXVwZGF0ZSBhZGQgJyArIHNlcnZpY2VfbmFtZSArICcgZGVmYXVsdCdcbiAgICAgIF07XG4gICAgICBicmVhaztcbiAgICBjYXNlICdzbWYnOlxuICAgIGNhc2UgJ3N1bm9zJzpcbiAgICBjYXNlICdzb2xhcmlzJzpcbiAgICAgIHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoJ3NtZicpO1xuICAgICAgc2VydmljZV9uYW1lID0gKG9wdHMuc2VydmljZU5hbWUgfHwgJ3BtMl8nICsgdXNlcik7XG4gICAgICBkZXN0aW5hdGlvbiA9IHBhdGguam9pbih0bXBQYXRoKCksIHNlcnZpY2VfbmFtZSArICcueG1sJyk7XG4gICAgICBjb21tYW5kcyA9IFtcbiAgICAgICAgJ3N2Y2NmZyBpbXBvcnQgJyArIGRlc3RpbmF0aW9uLFxuICAgICAgICAnc3ZjYWRtIGVuYWJsZSAnICsgc2VydmljZV9uYW1lXG4gICAgICBdO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBwbGF0Zm9ybSAvIGluaXQgc3lzdGVtIG5hbWUnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiA0IyBSZXBsYWNlIHRlbXBsYXRlIHZhcmlhYmxlIHZhbHVlXG4gICAgICovXG4gICAgdmFyIGVudlBhdGhcblxuICAgIGlmIChjc3QuSEFTX05PREVfRU1CRURERUQgPT0gdHJ1ZSlcbiAgICAgIGVudlBhdGggPSB1dGlsLmZvcm1hdCgnJXM6JXMnLCBwcm9jZXNzLmVudi5QQVRIIHx8ICcnLCBwYXRoLmRpcm5hbWUocHJvY2Vzcy5leGVjUGF0aCkpXG4gICAgZWxzZSBpZiAobmV3IFJlZ0V4cChwYXRoLmRpcm5hbWUocHJvY2Vzcy5leGVjUGF0aCkpLnRlc3QocHJvY2Vzcy5lbnYuUEFUSCkpXG4gICAgICBlbnZQYXRoID0gcHJvY2Vzcy5lbnYuUEFUSFxuICAgIGVsc2VcbiAgICAgIGVudlBhdGggPSB1dGlsLmZvcm1hdCgnJXM6JXMnLCBwcm9jZXNzLmVudi5QQVRIIHx8ICcnLCBwYXRoLmRpcm5hbWUocHJvY2Vzcy5leGVjUGF0aCkpXG5cbiAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UoLyVQTTJfUEFUSCUvZywgcHJvY2Vzcy5tYWluTW9kdWxlLmZpbGVuYW1lKVxuICAgICAgLnJlcGxhY2UoLyVOT0RFX1BBVEglL2csIGVudlBhdGgpXG4gICAgICAucmVwbGFjZSgvJVVTRVIlL2csIHVzZXIpXG4gICAgICAucmVwbGFjZSgvJUhPTUVfUEFUSCUvZywgb3B0cy5ocCA/IHBhdGgucmVzb2x2ZShvcHRzLmhwLCAnLnBtMicpIDogY3N0LlBNMl9ST09UX1BBVEgpXG4gICAgICAucmVwbGFjZSgvJVNFUlZJQ0VfTkFNRSUvZywgc2VydmljZV9uYW1lKTtcblxuICAgIENvbW1vbi5wcmludE91dChjaGFsay5ib2xkKCdQbGF0Zm9ybScpLCBwbGF0Zm9ybSk7XG4gICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQoJ1RlbXBsYXRlJykpO1xuICAgIENvbW1vbi5wcmludE91dCh0ZW1wbGF0ZSk7XG4gICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQoJ1RhcmdldCBwYXRoJykpO1xuICAgIENvbW1vbi5wcmludE91dChkZXN0aW5hdGlvbik7XG4gICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQoJ0NvbW1hbmQgbGlzdCcpKTtcbiAgICBDb21tb24ucHJpbnRPdXQoY29tbWFuZHMpO1xuXG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1dyaXRpbmcgaW5pdCBjb25maWd1cmF0aW9uIGluICcgKyBkZXN0aW5hdGlvbik7XG4gICAgdHJ5IHtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoZGVzdGluYXRpb24sIHRlbXBsYXRlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArICdGYWlsdXJlIHdoZW4gdHJ5aW5nIHRvIHdyaXRlIHN0YXJ0dXAgc2NyaXB0Jyk7XG4gICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSB8fCBlKTtcbiAgICAgIHJldHVybiBjYihlKTtcbiAgICB9XG5cbiAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnTWFraW5nIHNjcmlwdCBib290aW5nIGF0IHN0YXJ0dXAuLi4nKTtcblxuICAgIGZvckVhY2hMaW1pdChjb21tYW5kcywgMSwgZnVuY3Rpb24oY29tbWFuZCwgbmV4dCkge1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1stXSBFeGVjdXRpbmc6ICVzLi4uJywgY2hhbGsuYm9sZChjb21tYW5kKSk7XG5cbiAgICAgIHNleGVjKGNvbW1hbmQsIGZ1bmN0aW9uKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSB7XG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgY2hhbGsuYm9sZCgnW3ZdIENvbW1hbmQgc3VjY2Vzc2Z1bGx5IGV4ZWN1dGVkLicpKTtcbiAgICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChjaGFsay5yZWQoJ1tFUlJPUl0gRXhpdCBjb2RlIDogJyArIGNvZGUpKVxuICAgICAgICAgIHJldHVybiBuZXh0KG5ldyBFcnJvcihjb21tYW5kICsgJyBmYWlsZWQsIHNlZSBlcnJvciBhYm92ZS4nKSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyAoZXJyLm1lc3NhZ2UgfHwgZXJyKSk7XG4gICAgICAgIHJldHVybiBjYihlcnIpO1xuICAgICAgfVxuICAgICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQuYmx1ZSgnKy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSsnKSk7XG4gICAgICBDb21tb24ucHJpbnRPdXQoY2hhbGsuYm9sZC5ibHVlKChjc3QuUFJFRklYX01TRyArICdGcmVlemUgYSBwcm9jZXNzIGxpc3Qgb24gcmVib290IHZpYTonICkpKTtcbiAgICAgIENvbW1vbi5wcmludE91dChjaGFsay5ib2xkKCckIHBtMiBzYXZlJykpO1xuICAgICAgQ29tbW9uLnByaW50T3V0KCcnKTtcbiAgICAgIENvbW1vbi5wcmludE91dChjaGFsay5ib2xkLmJsdWUoY3N0LlBSRUZJWF9NU0cgKyAnUmVtb3ZlIGluaXQgc2NyaXB0IHZpYTonKSk7XG4gICAgICBDb21tb24ucHJpbnRPdXQoY2hhbGsuYm9sZCgnJCBwbTIgdW5zdGFydHVwICcgKyBwbGF0Zm9ybSkpO1xuXG4gICAgICByZXR1cm4gY2IobnVsbCwge1xuICAgICAgICBkZXN0aW5hdGlvbiAgOiBkZXN0aW5hdGlvbixcbiAgICAgICAgdGVtcGxhdGUgOiB0ZW1wbGF0ZVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIERJU0FCTEVEIEZFQVRVUkVcbiAgICogS0VFUElORyBNRVRIT0QgRk9SIEJBQ0tXQVJEIENPTVBBVFxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5hdXRvZHVtcCA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgcmV0dXJuIGNiKClcbiAgfVxuXG4gIC8qKlxuICAgKiBEdW1wIGN1cnJlbnQgcHJvY2Vzc2VzIG1hbmFnZWQgYnkgcG0yIGludG8gRFVNUF9GSUxFX1BBVEggZmlsZVxuICAgKiBAbWV0aG9kIGR1bXBcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUuZHVtcCA9IGZ1bmN0aW9uKGZvcmNlLCBjYikge1xuICAgIHZhciBlbnZfYXJyID0gW107XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZihmb3JjZSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNiID0gZm9yY2VcbiAgICAgIGZvcmNlID0gZmFsc2VcbiAgICB9XG5cbiAgICBpZiAoIWNiKVxuICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1NhdmluZyBjdXJyZW50IHByb2Nlc3MgbGlzdC4uLicpO1xuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIERlc2NyaXB0aW9uXG4gICAgICAgKiBAbWV0aG9kIGZpblxuICAgICAgICogQHBhcmFtIHt9IGVyclxuICAgICAgICogQHJldHVyblxuICAgICAgICovXG4gICAgICBmdW5jdGlvbiBmaW4oZXJyKSB7XG5cbiAgICAgICAgLy8gdHJ5IHRvIGZpeCBpc3N1ZXMgd2l0aCBlbXB0eSBkdW1wIGZpbGVcbiAgICAgICAgLy8gbGlrZSAjMzQ4NVxuICAgICAgICBpZiAoIWZvcmNlICYmIGVudl9hcnIubGVuZ3RoID09PSAwICYmICFwcm9jZXNzLmVudi5GT1JDRSkge1xuXG4gICAgICAgICAgLy8gZml4IDogaWYgbm8gZHVtcCBmaWxlLCBubyBwcm9jZXNzLCBvbmx5IG1vZHVsZSBhbmQgYWZ0ZXIgcG0yIHVwZGF0ZVxuICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhjc3QuRFVNUF9GSUxFX1BBVEgpKSB7XG4gICAgICAgICAgICB0aGF0LmNsZWFyRHVtcChmdW5jdGlvbigpe30pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGlmIG5vIHByb2Nlc3MgaW4gbGlzdCBkb24ndCBtb2RpZnkgZHVtcCBmaWxlXG4gICAgICAgICAgLy8gcHJvY2VzcyBsaXN0IHNob3VsZCBub3QgYmUgZW1wdHlcbiAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoJ1Byb2Nlc3MgbGlzdCBlbXB0eSwgY2Fubm90IHNhdmUgZW1wdHkgbGlzdCcpKTtcbiAgICAgICAgICB9IGVsc2UgIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19XQVJOSU5HICsgJ1BNMiBpcyBub3QgbWFuYWdpbmcgYW55IHByb2Nlc3MsIHNraXBwaW5nIHNhdmUuLi4nKTtcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19XQVJOSU5HICsgJ1RvIGZvcmNlIHNhdmluZyB1c2U6IHBtMiBzYXZlIC0tZm9yY2UnKTtcbiAgICAgICAgICAgIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCYWNrIHVwIGR1bXAgZmlsZVxuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGNzdC5EVU1QX0ZJTEVfUEFUSCkpIHtcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoY3N0LkRVTVBfQkFDS1VQX0ZJTEVfUEFUSCwgZnMucmVhZEZpbGVTeW5jKGNzdC5EVU1QX0ZJTEVfUEFUSCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0dfRVJSICsgJ0ZhaWxlZCB0byBiYWNrIHVwIGR1bXAgZmlsZSBpbiAlcycsIGNzdC5EVU1QX0JBQ0tVUF9GSUxFX1BBVEgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3ZlcndyaXRlIGR1bXAgZmlsZSwgZGVsZXRlIGlmIGJyb2tlbiBhbmQgZXhpdFxuICAgICAgICB0cnkge1xuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoY3N0LkRVTVBfRklMRV9QQVRILCBKU09OLnN0cmluZ2lmeShlbnZfYXJyLCBbXCJcIl0sIDIpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gdHJ5IHRvIGJhY2t1cCBmaWxlXG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjc3QuRFVNUF9CQUNLVVBfRklMRV9QQVRIKSkge1xuICAgICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGNzdC5EVU1QX0ZJTEVfUEFUSCwgZnMucmVhZEZpbGVTeW5jKGNzdC5EVU1QX0JBQ0tVUF9GSUxFX1BBVEgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBkb24ndCBrZWVwIGJyb2tlbiBmaWxlXG4gICAgICAgICAgICBmcy51bmxpbmtTeW5jKGNzdC5EVU1QX0ZJTEVfUEFUSCk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19FUlIgKyAnRmFpbGVkIHRvIHNhdmUgZHVtcCBmaWxlIGluICVzJywgY3N0LkRVTVBfRklMRV9QQVRIKTtcbiAgICAgICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2IpIHJldHVybiBjYihudWxsLCB7c3VjY2Vzczp0cnVlfSk7XG5cbiAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1N1Y2Nlc3NmdWxseSBzYXZlZCBpbiAlcycsIGNzdC5EVU1QX0ZJTEVfUEFUSCk7XG4gICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIChmdW5jdGlvbiBleChhcHBzKSB7XG4gICAgICAgIGlmICghYXBwc1swXSkgcmV0dXJuIGZpbihudWxsKTtcbiAgICAgICAgZGVsZXRlIGFwcHNbMF0ucG0yX2Vudi5pbnN0YW5jZXM7XG4gICAgICAgIGRlbGV0ZSBhcHBzWzBdLnBtMl9lbnYucG1faWQ7XG4gICAgICAgIGRlbGV0ZSBhcHBzWzBdLnBtMl9lbnYucHJldl9yZXN0YXJ0X2RlbGF5O1xuICAgICAgICBpZiAoIWFwcHNbMF0ucG0yX2Vudi5wbXhfbW9kdWxlKVxuICAgICAgICAgIGVudl9hcnIucHVzaChhcHBzWzBdLnBtMl9lbnYpO1xuICAgICAgICBhcHBzLnNoaWZ0KCk7XG4gICAgICAgIHJldHVybiBleChhcHBzKTtcbiAgICAgIH0pKGxpc3QpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmUgRFVNUF9GSUxFX1BBVEggZmlsZSBhbmQgRFVNUF9CQUNLVVBfRklMRV9QQVRIIGZpbGVcbiAgICogQG1ldGhvZCBkdW1wXG4gICAqIEBwYXJhbSB7fSBjYlxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmNsZWFyRHVtcCA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgZnMud3JpdGVGaWxlU3luYyhjc3QuRFVNUF9GSUxFX1BBVEgsIEpTT04uc3RyaW5naWZ5KFtdKSk7XG5cbiAgICBpZihjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHJldHVybiBjYigpO1xuXG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1N1Y2Nlc3NmdWxseSBjcmVhdGVkICVzJywgY3N0LkRVTVBfRklMRV9QQVRIKTtcbiAgICByZXR1cm4gdGhpcy5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXN1cnJlY3QgcHJvY2Vzc2VzXG4gICAqIEBtZXRob2QgcmVzdXJyZWN0XG4gICAqIEBwYXJhbSB7fSBjYlxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnJlc3VycmVjdCA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgdmFyIGFwcHMgPSB7fTtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB2YXIgcHJvY2Vzc2VzO1xuXG4gICAgZnVuY3Rpb24gcmVhZER1bXBGaWxlKGR1bXBGaWxlUGF0aCkge1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1Jlc3RvcmluZyBwcm9jZXNzZXMgbG9jYXRlZCBpbiAlcycsIGR1bXBGaWxlUGF0aCk7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgYXBwcyA9IGZzLnJlYWRGaWxlU3luYyhkdW1wRmlsZVBhdGgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyAnRmFpbGVkIHRvIHJlYWQgZHVtcCBmaWxlIGluICVzJywgZHVtcEZpbGVQYXRoKTtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFwcHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VEdW1wRmlsZShkdW1wRmlsZVBhdGgsIGFwcHMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBwcm9jZXNzZXMgPSBDb21tb24ucGFyc2VDb25maWcoYXBwcywgJ25vbmUnKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgJ0ZhaWxlZCB0byBwYXJzZSBkdW1wIGZpbGUgaW4gJXMnLCBkdW1wRmlsZVBhdGgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGZzLnVubGlua1N5bmMoZHVtcEZpbGVQYXRoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcHJvY2Vzc2VzO1xuICAgIH1cblxuICAgIC8vIFJlYWQgZHVtcCBmaWxlLCBmYWxsIGJhY2sgdG8gYmFja3VwLCBkZWxldGUgaWYgYnJva2VuXG4gICAgdHJ5IHtcbiAgICAgIGFwcHMgPSByZWFkRHVtcEZpbGUoY3N0LkRVTVBfRklMRV9QQVRIKTtcbiAgICAgIHByb2Nlc3NlcyA9IHBhcnNlRHVtcEZpbGUoY3N0LkRVTVBfRklMRV9QQVRILCBhcHBzKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGFwcHMgPSByZWFkRHVtcEZpbGUoY3N0LkRVTVBfQkFDS1VQX0ZJTEVfUEFUSCk7XG4gICAgICAgIHByb2Nlc3NlcyA9IHBhcnNlRHVtcEZpbGUoY3N0LkRVTVBfQkFDS1VQX0ZJTEVfUEFUSCwgYXBwcyk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgJ05vIHByb2Nlc3NlcyBzYXZlZDsgRFVNUCBmaWxlIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICAvLyBpZiAoY2IpIHJldHVybiBjYihDb21tb24ucmV0RXJyKGUpKTtcbiAgICAgICAgLy8gZWxzZSByZXR1cm4gdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgcmV0dXJuIHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoMSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBjdXJyZW50ID0gW107XG4gICAgICB2YXIgdGFyZ2V0ID0gW107XG5cbiAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbihhcHApIHtcbiAgICAgICAgaWYgKCFjdXJyZW50W2FwcC5uYW1lXSlcbiAgICAgICAgICBjdXJyZW50W2FwcC5uYW1lXSA9IDA7XG4gICAgICAgIGN1cnJlbnRbYXBwLm5hbWVdKys7XG4gICAgICB9KTtcblxuICAgICAgcHJvY2Vzc2VzLmZvckVhY2goZnVuY3Rpb24oYXBwKSB7XG4gICAgICAgIGlmICghdGFyZ2V0W2FwcC5uYW1lXSlcbiAgICAgICAgICB0YXJnZXRbYXBwLm5hbWVdID0gMDtcbiAgICAgICAgdGFyZ2V0W2FwcC5uYW1lXSsrO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciB0b3N0YXJ0ID0gT2JqZWN0LmtleXModGFyZ2V0KS5maWx0ZXIoZnVuY3Rpb24oaSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoY3VycmVudCkuaW5kZXhPZihpKSA8IDA7XG4gICAgICB9KVxuXG4gICAgICBlYWNoTGltaXQocHJvY2Vzc2VzLCBjc3QuQ09OQ1VSUkVOVF9BQ1RJT05TLCBmdW5jdGlvbihhcHAsIG5leHQpIHtcbiAgICAgICAgaWYgKHRvc3RhcnQuaW5kZXhPZihhcHAubmFtZSkgPT0gLTEpXG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgncHJlcGFyZScsIGFwcCwgZnVuY3Rpb24oZXJyLCBkdCkge1xuICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdQcm9jZXNzICVzIHJlc3RvcmVkJywgYXBwLnBtX2V4ZWNfcGF0aCk7XG4gICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9KTtcbiAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBhcHBzKSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxufVxuIl19