"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _chalk = _interopRequireDefault(require("chalk"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _forEachLimit = _interopRequireDefault(require("async/forEachLimit"));

var _eachLimit = _interopRequireDefault(require("async/eachLimit"));

var _Common = _interopRequireDefault(require("../Common"));

var _constants = _interopRequireDefault(require("../../constants"));

var _util = _interopRequireDefault(require("util"));

var _os = require("os");

var _which = _interopRequireDefault(require("../tools/which"));

var _sexec = _interopRequireDefault(require("../tools/sexec"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvU3RhcnR1cC50cyJdLCJuYW1lcyI6WyJDTEkiLCJpc05vdFJvb3QiLCJzdGFydHVwX21vZGUiLCJwbGF0Zm9ybSIsIm9wdHMiLCJjYiIsIkNvbW1vbiIsInByaW50T3V0IiwiY3N0IiwiUFJFRklYX01TRyIsInVzZXIiLCJjb25zb2xlIiwibG9nIiwicGF0aCIsImRpcm5hbWUiLCJwcm9jZXNzIiwiZXhlY1BhdGgiLCJhcmdzIiwibmFtZSIsImVudiIsIkhPTUUiLCJFcnJvciIsInNpbGVudCIsImVyciIsInN0ZG91dCIsInN0ZGVyciIsInJlcXVpcmUiLCJtYWluIiwiZmlsZW5hbWUiLCJ0cmltIiwiZGV0ZWN0SW5pdFN5c3RlbSIsImhhc2hfbWFwIiwiaW5pdF9zeXN0ZW1zIiwiT2JqZWN0Iiwia2V5cyIsImkiLCJsZW5ndGgiLCJwcmludEVycm9yIiwiUFJFRklYX01TR19FUlIiLCJjaGFsayIsImJvbGQiLCJwcm90b3R5cGUiLCJ1bmluc3RhbGxTdGFydHVwIiwiY29tbWFuZHMiLCJ0aGF0IiwiYWN0dWFsX3BsYXRmb3JtIiwiVVNFUiIsIkxPR05BTUUiLCJzZXJ2aWNlX25hbWUiLCJzZXJ2aWNlTmFtZSIsIm9wZW5yY19zZXJ2aWNlX25hbWUiLCJsYXVuY2hkX3NlcnZpY2VfbmFtZSIsImRhdGEiLCJleGl0Q2xpIiwiRVJST1JfRVhJVCIsIlNVQ0NFU1NfRVhJVCIsImdldHVpZCIsImZzIiwiZXhpc3RzU3luYyIsImRlc3RpbmF0aW9uIiwiam9pbiIsImNvZGUiLCJFUlJPUl9NU0ciLCJzdGFydHVwIiwidGVtcGxhdGUiLCJnZXRUZW1wbGF0ZSIsInR5cGUiLCJyZWFkRmlsZVN5bmMiLCJfX2Rpcm5hbWUiLCJlbmNvZGluZyIsIndhaXRJcCIsImVudlBhdGgiLCJIQVNfTk9ERV9FTUJFRERFRCIsInV0aWwiLCJmb3JtYXQiLCJQQVRIIiwiUmVnRXhwIiwidGVzdCIsInJlcGxhY2UiLCJtYWluTW9kdWxlIiwiaHAiLCJyZXNvbHZlIiwiUE0yX1JPT1RfUEFUSCIsIndyaXRlRmlsZVN5bmMiLCJlIiwiZXJyb3IiLCJtZXNzYWdlIiwiY29tbWFuZCIsIm5leHQiLCJyZWQiLCJibHVlIiwiYXV0b2R1bXAiLCJkdW1wIiwiZm9yY2UiLCJlbnZfYXJyIiwiQ2xpZW50IiwiZXhlY3V0ZVJlbW90ZSIsImxpc3QiLCJyZXRFcnIiLCJmaW4iLCJGT1JDRSIsIkRVTVBfRklMRV9QQVRIIiwiY2xlYXJEdW1wIiwiUFJFRklYX01TR19XQVJOSU5HIiwiRFVNUF9CQUNLVVBfRklMRV9QQVRIIiwic3RhY2siLCJKU09OIiwic3RyaW5naWZ5IiwidW5saW5rU3luYyIsInN1Y2Nlc3MiLCJleCIsImFwcHMiLCJwbTJfZW52IiwiaW5zdGFuY2VzIiwicG1faWQiLCJwcmV2X3Jlc3RhcnRfZGVsYXkiLCJwbXhfbW9kdWxlIiwicHVzaCIsInNoaWZ0IiwicmVzdXJyZWN0IiwicHJvY2Vzc2VzIiwicmVhZER1bXBGaWxlIiwiZHVtcEZpbGVQYXRoIiwicGFyc2VEdW1wRmlsZSIsInBhcnNlQ29uZmlnIiwic3BlZWRMaXN0IiwiY3VycmVudCIsInRhcmdldCIsImZvckVhY2giLCJhcHAiLCJ0b3N0YXJ0IiwiZmlsdGVyIiwiaW5kZXhPZiIsIkNPTkNVUlJFTlRfQUNUSU9OUyIsImR0IiwicG1fZXhlY19wYXRoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFLQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFmQTs7Ozs7QUFnQmUsa0JBQVVBLEdBQVYsRUFBZTtBQUM1Qjs7OztBQUlBLFdBQVNDLFNBQVQsQ0FBbUJDLFlBQW5CLEVBQWlDQyxRQUFqQyxFQUEyQ0MsSUFBM0MsRUFBaURDLEVBQWpELEVBQXFEO0FBQ25EQyx1QkFBT0MsUUFBUCxXQUFtQkMsc0JBQUlDLFVBQXZCLGdCQUF1Q1AsWUFBdkM7O0FBQ0EsUUFBSUUsSUFBSSxDQUFDTSxJQUFULEVBQWU7QUFDYkMsTUFBQUEsT0FB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RUFBTzBHLElBQVAsQ0FBTCxHQUFvQm5FLElBQUksQ0FBQ2lGLFNBQUwsRUFBN0I7QUFDRCxPQVpEO0FBYUQsS0F0Q0Q7QUF1Q0QsR0F6RkQ7QUEyRkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuICovXG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGZvckVhY2hMaW1pdCBmcm9tICdhc3luYy9mb3JFYWNoTGltaXQnO1xuaW1wb3J0IGVhY2hMaW1pdCBmcm9tICdhc3luYy9lYWNoTGltaXQnO1xuaW1wb3J0IENvbW1vbiBmcm9tICcuLi9Db21tb24nO1xuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi9jb25zdGFudHMnO1xuaW1wb3J0IHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgeyB0bXBkaXIgYXMgdG1wUGF0aCB9IGZyb20gJ29zJztcbmltcG9ydCB3aGljaCBmcm9tICcuLi90b29scy93aGljaCc7XG5pbXBvcnQgc2V4ZWMgZnJvbSAnLi4vdG9vbHMvc2V4ZWMnO1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKENMSSkge1xuICAvKipcbiAgICogSWYgY29tbWFuZCBpcyBsYXVuY2hlZCB3aXRob3V0IHJvb3QgcmlnaHRcbiAgICogRGlzcGxheSBoZWxwZXJcbiAgICovXG4gIGZ1bmN0aW9uIGlzTm90Um9vdChzdGFydHVwX21vZGUsIHBsYXRmb3JtLCBvcHRzLCBjYikge1xuICAgIENvbW1vbi5wcmludE91dChgJHtjc3QuUFJFRklYX01TR31UbyAke3N0YXJ0dXBfbW9kZX0gdGhlIFN0YXJ0dXAgU2NyaXB0LCBjb3B5L3Bhc3RlIHRoZSBmb2xsb3dpbmcgY29tbWFuZDpgKTtcbiAgICBpZiAob3B0cy51c2VyKSB7XG4gICAgICBjb25zb2xlLmxvZygnc3VkbyBlbnYgUEFUSD0kUEFUSDonICsgcGF0aC5kaXJuYW1lKHByb2Nlc3MuZXhlY1BhdGgpICsgJyBwbTIgJyArIG9wdHMuYXJnc1sxXS5uYW1lKCkgKyAnICcgKyBwbGF0Zm9ybSArICcgLXUgJyArIG9wdHMudXNlciArICcgLS1ocCAnICsgcHJvY2Vzcy5lbnYuSE9NRSk7XG4gICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdZb3UgaGF2ZSB0byBydW4gdGhpcyB3aXRoIGVsZXZhdGVkIHJpZ2h0cycpKTtcbiAgICB9XG4gICAgcmV0dXJuIHNleGVjKCd3aG9hbWknLCB7IHNpbGVudDogdHJ1ZSB9LCBmdW5jdGlvbiAoZXJyLCBzdGRvdXQsIHN0ZGVycikge1xuICAgICAgY29uc29sZS5sb2coJ3N1ZG8gZW52IFBBVEg9JFBBVEg6JyArIHBhdGguZGlybmFtZShwcm9jZXNzLmV4ZWNQYXRoKSArICcgJyArIHJlcXVpcmUubWFpbi5maWxlbmFtZSArICcgJyArIG9wdHMuYXJnc1sxXS5uYW1lKCkgKyAnICcgKyBwbGF0Zm9ybSArICcgLXUgJyArIHN0ZG91dC50cmltKCkgKyAnIC0taHAgJyArIHByb2Nlc3MuZW52LkhPTUUpO1xuICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcignWW91IGhhdmUgdG8gcnVuIHRoaXMgd2l0aCBlbGV2YXRlZCByaWdodHMnKSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZWN0IHJ1bm5pbmcgaW5pdCBzeXN0ZW1cbiAgICovXG4gIGZ1bmN0aW9uIGRldGVjdEluaXRTeXN0ZW0oKSB7XG4gICAgdmFyIGhhc2hfbWFwID0ge1xuICAgICAgJ3N5c3RlbWN0bCc6ICdzeXN0ZW1kJyxcbiAgICAgICd1cGRhdGUtcmMuZCc6ICd1cHN0YXJ0JyxcbiAgICAgICdjaGtjb25maWcnOiAnc3lzdGVtdicsXG4gICAgICAncmMtdXBkYXRlJzogJ29wZW5yYycsXG4gICAgICAnbGF1bmNoY3RsJzogJ2xhdW5jaGQnLFxuICAgICAgJ3N5c3JjJzogJ3JjZCcsXG4gICAgICAncmNjdGwnOiAncmNkLW9wZW5ic2QnLFxuICAgICAgJ3N2Y2FkbSc6ICdzbWYnXG4gICAgfTtcbiAgICB2YXIgaW5pdF9zeXN0ZW1zID0gT2JqZWN0LmtleXMoaGFzaF9tYXApO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbml0X3N5c3RlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh3aGljaChpbml0X3N5c3RlbXNbaV0pICE9IG51bGwpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGkgPj0gaW5pdF9zeXN0ZW1zLmxlbmd0aCkge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgJ0luaXQgc3lzdGVtIG5vdCBmb3VuZCcpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdJbml0IFN5c3RlbSBmb3VuZDogJyArIGNoYWxrLmJvbGQoaGFzaF9tYXBbaW5pdF9zeXN0ZW1zW2ldXSkpO1xuICAgIHJldHVybiBoYXNoX21hcFtpbml0X3N5c3RlbXNbaV1dO1xuICB9XG5cbiAgQ0xJLnByb3RvdHlwZS51bmluc3RhbGxTdGFydHVwID0gZnVuY3Rpb24gKHBsYXRmb3JtLCBvcHRzLCBjYikge1xuICAgIHZhciBjb21tYW5kcztcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIGFjdHVhbF9wbGF0Zm9ybSA9IGRldGVjdEluaXRTeXN0ZW0oKTtcbiAgICB2YXIgdXNlciA9IG9wdHMudXNlciB8fCBwcm9jZXNzLmVudi5VU0VSIHx8IHByb2Nlc3MuZW52LkxPR05BTUU7IC8vIFVzZSBMT0dOQU1FIG9uIFNvbGFyaXMtbGlrZSBzeXN0ZW1zXG4gICAgdmFyIHNlcnZpY2VfbmFtZSA9IChvcHRzLnNlcnZpY2VOYW1lIHx8ICdwbTItJyArIHVzZXIpO1xuICAgIHZhciBvcGVucmNfc2VydmljZV9uYW1lID0gJ3BtMic7XG4gICAgdmFyIGxhdW5jaGRfc2VydmljZV9uYW1lID0gKG9wdHMuc2VydmljZU5hbWUgfHwgJ3BtMi4nICsgdXNlcik7XG5cbiAgICBpZiAoIXBsYXRmb3JtKVxuICAgICAgcGxhdGZvcm0gPSBhY3R1YWxfcGxhdGZvcm07XG4gICAgZWxzZSBpZiAoYWN0dWFsX3BsYXRmb3JtICYmIGFjdHVhbF9wbGF0Zm9ybSAhPT0gcGxhdGZvcm0pIHtcbiAgICAgIENvbW1vbi5wcmludE91dCgnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKVxuICAgICAgQ29tbW9uLnByaW50T3V0KCcgUE0yIGRldGVjdGVkICcgKyBhY3R1YWxfcGxhdGZvcm0gKyAnIGJ1dCB5b3UgcHJlY2lzZWQgJyArIHBsYXRmb3JtKVxuICAgICAgQ29tbW9uLnByaW50T3V0KCcgUGxlYXNlIHZlcmlmeSB0aGF0IHlvdXIgY2hvaWNlIGlzIGluZGVlZCB5b3VyIGluaXQgc3lzdGVtJylcbiAgICAgIENvbW1vbi5wcmludE91dCgnIElmIHlvdSBhcmVudCBzdXJlLCBqdXN0IHJ1biA6IHBtMiBzdGFydHVwJylcbiAgICAgIENvbW1vbi5wcmludE91dCgnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKVxuICAgIH1cbiAgICBpZiAocGxhdGZvcm0gPT09IG51bGwpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luaXQgc3lzdGVtIG5vdCBmb3VuZCcpXG5cbiAgICBpZiAoIWNiKSB7XG4gICAgICBjYiA9IGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgaWYgKGVycilcbiAgICAgICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocHJvY2Vzcy5nZXR1aWQoKSAhPSAwKSB7XG4gICAgICByZXR1cm4gaXNOb3RSb290KCd1bnNldHVwJywgcGxhdGZvcm0sIG9wdHMsIGNiKTtcbiAgICB9XG5cbiAgICBpZiAoZnMuZXhpc3RzU3luYygnL2V0Yy9pbml0LmQvcG0yLWluaXQuc2gnKSkge1xuICAgICAgcGxhdGZvcm0gPSAnb2xkc3lzdGVtJztcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHBsYXRmb3JtKSB7XG4gICAgICBjYXNlICdzeXN0ZW1kJzpcbiAgICAgICAgY29tbWFuZHMgPSBbXG4gICAgICAgICAgJ3N5c3RlbWN0bCBzdG9wICcgKyBzZXJ2aWNlX25hbWUsXG4gICAgICAgICAgJ3N5c3RlbWN0bCBkaXNhYmxlICcgKyBzZXJ2aWNlX25hbWUsXG4gICAgICAgICAgJ3JtIC9ldGMvc3lzdGVtZC9zeXN0ZW0vJyArIHNlcnZpY2VfbmFtZSArICcuc2VydmljZSdcbiAgICAgICAgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzeXN0ZW12JzpcbiAgICAgICAgY29tbWFuZHMgPSBbXG4gICAgICAgICAgJ2Noa2NvbmZpZyAnICsgc2VydmljZV9uYW1lICsgJyBvZmYnLFxuICAgICAgICAgICdybSAvZXRjL2luaXQuZC8nICsgc2VydmljZV9uYW1lXG4gICAgICAgIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnb2xkc3lzdGVtJzpcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0Rpc2FibGluZyBhbmQgZGVsZXRpbmcgb2xkIHN0YXJ0dXAgc3lzdGVtJyk7XG4gICAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAgICd1cGRhdGUtcmMuZCBwbTItaW5pdC5zaCBkaXNhYmxlJyxcbiAgICAgICAgICAndXBkYXRlLXJjLmQgLWYgcG0yLWluaXQuc2ggcmVtb3ZlJyxcbiAgICAgICAgICAncm0gL2V0Yy9pbml0LmQvcG0yLWluaXQuc2gnXG4gICAgICAgIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnb3BlbnJjJzpcbiAgICAgICAgc2VydmljZV9uYW1lID0gb3BlbnJjX3NlcnZpY2VfbmFtZTtcbiAgICAgICAgY29tbWFuZHMgPSBbXG4gICAgICAgICAgJy9ldGMvaW5pdC5kLycgKyBzZXJ2aWNlX25hbWUgKyAnIHN0b3AnLFxuICAgICAgICAgICdyYy11cGRhdGUgZGVsZXRlICcgKyBzZXJ2aWNlX25hbWUgKyAnIGRlZmF1bHQnLFxuICAgICAgICAgICdybSAvZXRjL2luaXQuZC8nICsgc2VydmljZV9uYW1lXG4gICAgICAgIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndXBzdGFydCc6XG4gICAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAgICd1cGRhdGUtcmMuZCAnICsgc2VydmljZV9uYW1lICsgJyBkaXNhYmxlJyxcbiAgICAgICAgICAndXBkYXRlLXJjLmQgLWYgJyArIHNlcnZpY2VfbmFtZSArICcgcmVtb3ZlJyxcbiAgICAgICAgICAncm0gL2V0Yy9pbml0LmQvJyArIHNlcnZpY2VfbmFtZVxuICAgICAgICBdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xhdW5jaGQnOlxuICAgICAgICB2YXIgZGVzdGluYXRpb24gPSBwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSwgJ0xpYnJhcnkvTGF1bmNoQWdlbnRzLycgKyBsYXVuY2hkX3NlcnZpY2VfbmFtZSArICcucGxpc3QnKTtcbiAgICAgICAgY29tbWFuZHMgPSBbXG4gICAgICAgICAgJ2xhdW5jaGN0bCByZW1vdmUgJyArIGxhdW5jaGRfc2VydmljZV9uYW1lICsgJyB8fCB0cnVlJyxcbiAgICAgICAgICAncm0gJyArIGRlc3RpbmF0aW9uXG4gICAgICAgIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncmNkJzpcbiAgICAgICAgc2VydmljZV9uYW1lID0gKG9wdHMuc2VydmljZU5hbWUgfHwgJ3BtMl8nICsgdXNlcik7XG4gICAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAgICcvdXNyL2xvY2FsL2V0Yy9yYy5kLycgKyBzZXJ2aWNlX25hbWUgKyAnIHN0b3AnLFxuICAgICAgICAgICdzeXNyYyAteCAnICsgc2VydmljZV9uYW1lICsgJ19lbmFibGUnLFxuICAgICAgICAgICdybSAvdXNyL2xvY2FsL2V0Yy9yYy5kLycgKyBzZXJ2aWNlX25hbWVcbiAgICAgICAgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdyY2Qtb3BlbmJzZCc6XG4gICAgICAgIHNlcnZpY2VfbmFtZSA9IChvcHRzLnNlcnZpY2VOYW1lIHx8ICdwbTJfJyArIHVzZXIpO1xuICAgICAgICB2YXIgZGVzdGluYXRpb24gPSBwYXRoLmpvaW4oJy9ldGMvcmMuZCcsIHNlcnZpY2VfbmFtZSk7XG4gICAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAgICdyY2N0bCBzdG9wICcgKyBzZXJ2aWNlX25hbWUsXG4gICAgICAgICAgJ3JjY3RsIGRpc2FibGUgJyArIHNlcnZpY2VfbmFtZSxcbiAgICAgICAgICAncm0gJyArIGRlc3RpbmF0aW9uXG4gICAgICAgIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc21mJzpcbiAgICAgICAgc2VydmljZV9uYW1lID0gKG9wdHMuc2VydmljZU5hbWUgfHwgJ3BtMl8nICsgdXNlcik7XG4gICAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAgICdzdmNhZG0gZGlzYWJsZSAnICsgc2VydmljZV9uYW1lLFxuICAgICAgICAgICdzdmNjZmcgZGVsZXRlIC1mICcgKyBzZXJ2aWNlX25hbWVcbiAgICAgICAgXVxuICAgIH07XG5cbiAgICBzZXhlYyhjb21tYW5kcy5qb2luKCcmJiAnKSwgZnVuY3Rpb24gKGNvZGUsIHN0ZG91dCwgc3RkZXJyKSB7XG4gICAgICBDb21tb24ucHJpbnRPdXQoc3Rkb3V0KTtcbiAgICAgIENvbW1vbi5wcmludE91dChzdGRlcnIpO1xuICAgICAgaWYgKGNvZGUgPT0gMCkge1xuICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyBjaGFsay5ib2xkKCdJbml0IGZpbGUgZGlzYWJsZWQuJykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5FUlJPUl9NU0cgKyBjaGFsay5ib2xkKCdSZXR1cm4gY29kZSA6ICcgKyBjb2RlKSk7XG4gICAgICB9XG5cbiAgICAgIGNiKG51bGwsIHtcbiAgICAgICAgY29tbWFuZHM6IGNvbW1hbmRzLFxuICAgICAgICBwbGF0Zm9ybTogcGxhdGZvcm1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTdGFydHVwIHNjcmlwdCBnZW5lcmF0aW9uXG4gICAqIEBtZXRob2Qgc3RhcnR1cFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGxhdGZvcm0gdHlwZSAoY2VudG9zfHJlZGhhdHxhbWF6b258Z2VudG9vfHN5c3RlbWR8c21mKVxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5zdGFydHVwID0gZnVuY3Rpb24gKHBsYXRmb3JtLCBvcHRzLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgYWN0dWFsX3BsYXRmb3JtID0gZGV0ZWN0SW5pdFN5c3RlbSgpO1xuICAgIHZhciB1c2VyID0gKG9wdHMudXNlciB8fCBwcm9jZXNzLmVudi5VU0VSIHx8IHByb2Nlc3MuZW52LkxPR05BTUUpOyAvLyBVc2UgTE9HTkFNRSBvbiBTb2xhcmlzLWxpa2Ugc3lzdGVtc1xuICAgIHZhciBzZXJ2aWNlX25hbWUgPSAob3B0cy5zZXJ2aWNlTmFtZSB8fCAncG0yLScgKyB1c2VyKTtcbiAgICB2YXIgb3BlbnJjX3NlcnZpY2VfbmFtZSA9ICdwbTInO1xuICAgIHZhciBsYXVuY2hkX3NlcnZpY2VfbmFtZSA9IChvcHRzLnNlcnZpY2VOYW1lIHx8ICdwbTIuJyArIHVzZXIpO1xuXG4gICAgaWYgKCFwbGF0Zm9ybSlcbiAgICAgIHBsYXRmb3JtID0gYWN0dWFsX3BsYXRmb3JtO1xuICAgIGVsc2UgaWYgKGFjdHVhbF9wbGF0Zm9ybSAmJiBhY3R1YWxfcGxhdGZvcm0gIT09IHBsYXRmb3JtKSB7XG4gICAgICBDb21tb24ucHJpbnRPdXQoJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJylcbiAgICAgIENvbW1vbi5wcmludE91dCgnIFBNMiBkZXRlY3RlZCAnICsgYWN0dWFsX3BsYXRmb3JtICsgJyBidXQgeW91IHByZWNpc2VkICcgKyBwbGF0Zm9ybSlcbiAgICAgIENvbW1vbi5wcmludE91dCgnIFBsZWFzZSB2ZXJpZnkgdGhhdCB5b3VyIGNob2ljZSBpcyBpbmRlZWQgeW91ciBpbml0IHN5c3RlbScpXG4gICAgICBDb21tb24ucHJpbnRPdXQoJyBJZiB5b3UgYXJlbnQgc3VyZSwganVzdCBydW4gOiBwbTIgc3RhcnR1cCcpXG4gICAgICBDb21tb24ucHJpbnRPdXQoJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJylcbiAgICB9XG4gICAgaWYgKHBsYXRmb3JtID09IG51bGwpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luaXQgc3lzdGVtIG5vdCBmb3VuZCcpO1xuXG4gICAgaWYgKCFjYikge1xuICAgICAgY2IgPSBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHByb2Nlc3MuZ2V0dWlkKCkgIT0gMCkge1xuICAgICAgcmV0dXJuIGlzTm90Um9vdCgnc2V0dXAnLCBwbGF0Zm9ybSwgb3B0cywgY2IpO1xuICAgIH1cblxuICAgIHZhciBkZXN0aW5hdGlvbjtcbiAgICB2YXIgY29tbWFuZHM7XG4gICAgdmFyIHRlbXBsYXRlO1xuXG4gICAgZnVuY3Rpb24gZ2V0VGVtcGxhdGUodHlwZSkge1xuICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAndGVtcGxhdGVzL2luaXQtc2NyaXB0cycsIHR5cGUgKyAnLnRwbCcpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgfVxuXG4gICAgc3dpdGNoIChwbGF0Zm9ybSkge1xuICAgICAgY2FzZSAndWJ1bnR1JzpcbiAgICAgIGNhc2UgJ2NlbnRvcyc6XG4gICAgICBjYXNlICdhcmNoJzpcbiAgICAgIGNhc2UgJ29yYWNsZSc6XG4gICAgICBjYXNlICdzeXN0ZW1kJzpcbiAgICAgICAgaWYgKG9wdHMud2FpdElwKVxuICAgICAgICAgIHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoJ3N5c3RlbWQtb25saW5lJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0ZW1wbGF0ZSA9IGdldFRlbXBsYXRlKCdzeXN0ZW1kJyk7XG4gICAgICAgIGRlc3RpbmF0aW9uID0gJy9ldGMvc3lzdGVtZC9zeXN0ZW0vJyArIHNlcnZpY2VfbmFtZSArICcuc2VydmljZSc7XG4gICAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAgICdzeXN0ZW1jdGwgZW5hYmxlICcgKyBzZXJ2aWNlX25hbWVcbiAgICAgICAgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd1YnVudHUxNCc6XG4gICAgICBjYXNlICd1YnVudHUxMic6XG4gICAgICBjYXNlICd1cHN0YXJ0JzpcbiAgICAgICAgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgndXBzdGFydCcpO1xuICAgICAgICBkZXN0aW5hdGlvbiA9ICcvZXRjL2luaXQuZC8nICsgc2VydmljZV9uYW1lO1xuICAgICAgICBjb21tYW5kcyA9IFtcbiAgICAgICAgICAnY2htb2QgK3ggJyArIGRlc3RpbmF0aW9uLFxuICAgICAgICAgICdta2RpciAtcCAvdmFyL2xvY2svc3Vic3lzJyxcbiAgICAgICAgICAndG91Y2ggL3Zhci9sb2NrL3N1YnN5cy8nICsgc2VydmljZV9uYW1lLFxuICAgICAgICAgICd1cGRhdGUtcmMuZCAnICsgc2VydmljZV9uYW1lICsgJyBkZWZhdWx0cydcbiAgICAgICAgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzeXN0ZW12JzpcbiAgICAgIGNhc2UgJ2FtYXpvbic6XG4gICAgICBjYXNlICdjZW50b3M2JzpcbiAgICAgICAgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgndXBzdGFydCcpO1xuICAgICAgICBkZXN0aW5hdGlvbiA9ICcvZXRjL2luaXQuZC8nICsgc2VydmljZV9uYW1lO1xuICAgICAgICBjb21tYW5kcyA9IFtcbiAgICAgICAgICAnY2htb2QgK3ggJyArIGRlc3RpbmF0aW9uLFxuICAgICAgICAgICdta2RpciAtcCAvdmFyL2xvY2svc3Vic3lzJyxcbiAgICAgICAgICAndG91Y2ggL3Zhci9sb2NrL3N1YnN5cy8nICsgc2VydmljZV9uYW1lLFxuICAgICAgICAgICdjaGtjb25maWcgLS1hZGQgJyArIHNlcnZpY2VfbmFtZSxcbiAgICAgICAgICAnY2hrY29uZmlnICcgKyBzZXJ2aWNlX25hbWUgKyAnIG9uJyxcbiAgICAgICAgICAnaW5pdGN0bCBsaXN0J1xuICAgICAgICBdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21hY29zJzpcbiAgICAgIGNhc2UgJ2Rhcndpbic6XG4gICAgICBjYXNlICdsYXVuY2hkJzpcbiAgICAgICAgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgnbGF1bmNoZCcpO1xuICAgICAgICBkZXN0aW5hdGlvbiA9IHBhdGguam9pbihwcm9jZXNzLmVudi5IT01FLCAnTGlicmFyeS9MYXVuY2hBZ2VudHMvJyArIGxhdW5jaGRfc2VydmljZV9uYW1lICsgJy5wbGlzdCcpO1xuICAgICAgICBjb21tYW5kcyA9IFtcbiAgICAgICAgICAnbGF1bmNoY3RsIGxvYWQgLXcgJyArIGRlc3RpbmF0aW9uXG4gICAgICAgIF1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdmcmVlYnNkJzpcbiAgICAgIGNhc2UgJ3JjZCc6XG4gICAgICAgIHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoJ3JjZCcpO1xuICAgICAgICBzZXJ2aWNlX25hbWUgPSAob3B0cy5zZXJ2aWNlTmFtZSB8fCAncG0yXycgKyB1c2VyKTtcbiAgICAgICAgZGVzdGluYXRpb24gPSAnL3Vzci9sb2NhbC9ldGMvcmMuZC8nICsgc2VydmljZV9uYW1lO1xuICAgICAgICBjb21tYW5kcyA9IFtcbiAgICAgICAgICAnY2htb2QgNzU1ICcgKyBkZXN0aW5hdGlvbixcbiAgICAgICAgICAnc3lzcmMgJyArIHNlcnZpY2VfbmFtZSArICdfZW5hYmxlPVlFUydcbiAgICAgICAgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvcGVuYnNkJzpcbiAgICAgIGNhc2UgJ3JjZC1vcGVuYnNkJzpcbiAgICAgICAgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgncmNkLW9wZW5ic2QnKTtcbiAgICAgICAgc2VydmljZV9uYW1lID0gKG9wdHMuc2VydmljZU5hbWUgfHwgJ3BtMl8nICsgdXNlcik7XG4gICAgICAgIGRlc3RpbmF0aW9uID0gcGF0aC5qb2luKCcvZXRjL3JjLmQvJywgc2VydmljZV9uYW1lKTtcbiAgICAgICAgY29tbWFuZHMgPSBbXG4gICAgICAgICAgJ2NobW9kIDc1NSAnICsgZGVzdGluYXRpb24sXG4gICAgICAgICAgJ3JjY3RsIGVuYWJsZSAnICsgc2VydmljZV9uYW1lLFxuICAgICAgICAgICdyY2N0bCBzdGFydCAnICsgc2VydmljZV9uYW1lXG4gICAgICAgIF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnb3BlbnJjJzpcbiAgICAgICAgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgnb3BlbnJjJyk7XG4gICAgICAgIHNlcnZpY2VfbmFtZSA9IG9wZW5yY19zZXJ2aWNlX25hbWU7XG4gICAgICAgIGRlc3RpbmF0aW9uID0gJy9ldGMvaW5pdC5kLycgKyBzZXJ2aWNlX25hbWU7XG4gICAgICAgIGNvbW1hbmRzID0gW1xuICAgICAgICAgICdjaG1vZCAreCAnICsgZGVzdGluYXRpb24sXG4gICAgICAgICAgJ3JjLXVwZGF0ZSBhZGQgJyArIHNlcnZpY2VfbmFtZSArICcgZGVmYXVsdCdcbiAgICAgICAgXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzbWYnOlxuICAgICAgY2FzZSAnc3Vub3MnOlxuICAgICAgY2FzZSAnc29sYXJpcyc6XG4gICAgICAgIHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoJ3NtZicpO1xuICAgICAgICBzZXJ2aWNlX25hbWUgPSAob3B0cy5zZXJ2aWNlTmFtZSB8fCAncG0yXycgKyB1c2VyKTtcbiAgICAgICAgZGVzdGluYXRpb24gPSBwYXRoLmpvaW4odG1wUGF0aCgpLCBzZXJ2aWNlX25hbWUgKyAnLnhtbCcpO1xuICAgICAgICBjb21tYW5kcyA9IFtcbiAgICAgICAgICAnc3ZjY2ZnIGltcG9ydCAnICsgZGVzdGluYXRpb24sXG4gICAgICAgICAgJ3N2Y2FkbSBlbmFibGUgJyArIHNlcnZpY2VfbmFtZVxuICAgICAgICBdO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBwbGF0Zm9ybSAvIGluaXQgc3lzdGVtIG5hbWUnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiA0IyBSZXBsYWNlIHRlbXBsYXRlIHZhcmlhYmxlIHZhbHVlXG4gICAgICovXG4gICAgdmFyIGVudlBhdGhcblxuICAgIGlmIChjc3QuSEFTX05PREVfRU1CRURERUQgPT0gdHJ1ZSlcbiAgICAgIGVudlBhdGggPSB1dGlsLmZvcm1hdCgnJXM6JXMnLCBwcm9jZXNzLmVudi5QQVRIIHx8ICcnLCBwYXRoLmRpcm5hbWUocHJvY2Vzcy5leGVjUGF0aCkpXG4gICAgZWxzZSBpZiAobmV3IFJlZ0V4cChwYXRoLmRpcm5hbWUocHJvY2Vzcy5leGVjUGF0aCkpLnRlc3QocHJvY2Vzcy5lbnYuUEFUSCkpXG4gICAgICBlbnZQYXRoID0gcHJvY2Vzcy5lbnYuUEFUSFxuICAgIGVsc2VcbiAgICAgIGVudlBhdGggPSB1dGlsLmZvcm1hdCgnJXM6JXMnLCBwcm9jZXNzLmVudi5QQVRIIHx8ICcnLCBwYXRoLmRpcm5hbWUocHJvY2Vzcy5leGVjUGF0aCkpXG5cbiAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UoLyVQTTJfUEFUSCUvZywgcHJvY2Vzcy5tYWluTW9kdWxlLmZpbGVuYW1lKVxuICAgICAgLnJlcGxhY2UoLyVOT0RFX1BBVEglL2csIGVudlBhdGgpXG4gICAgICAucmVwbGFjZSgvJVVTRVIlL2csIHVzZXIpXG4gICAgICAucmVwbGFjZSgvJUhPTUVfUEFUSCUvZywgb3B0cy5ocCA/IHBhdGgucmVzb2x2ZShvcHRzLmhwLCAnLnBtMicpIDogY3N0LlBNMl9ST09UX1BBVEgpXG4gICAgICAucmVwbGFjZSgvJVNFUlZJQ0VfTkFNRSUvZywgc2VydmljZV9uYW1lKTtcblxuICAgIENvbW1vbi5wcmludE91dChjaGFsay5ib2xkKCdQbGF0Zm9ybScpLCBwbGF0Zm9ybSk7XG4gICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQoJ1RlbXBsYXRlJykpO1xuICAgIENvbW1vbi5wcmludE91dCh0ZW1wbGF0ZSk7XG4gICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQoJ1RhcmdldCBwYXRoJykpO1xuICAgIENvbW1vbi5wcmludE91dChkZXN0aW5hdGlvbik7XG4gICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQoJ0NvbW1hbmQgbGlzdCcpKTtcbiAgICBDb21tb24ucHJpbnRPdXQoY29tbWFuZHMpO1xuXG4gICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1dyaXRpbmcgaW5pdCBjb25maWd1cmF0aW9uIGluICcgKyBkZXN0aW5hdGlvbik7XG4gICAgdHJ5IHtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMoZGVzdGluYXRpb24sIHRlbXBsYXRlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArICdGYWlsdXJlIHdoZW4gdHJ5aW5nIHRvIHdyaXRlIHN0YXJ0dXAgc2NyaXB0Jyk7XG4gICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSB8fCBlKTtcbiAgICAgIHJldHVybiBjYihlKTtcbiAgICB9XG5cbiAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnTWFraW5nIHNjcmlwdCBib290aW5nIGF0IHN0YXJ0dXAuLi4nKTtcblxuICAgIGZvckVhY2hMaW1pdChjb21tYW5kcywgMSwgZnVuY3Rpb24gKGNvbW1hbmQsIG5leHQpIHtcbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdbLV0gRXhlY3V0aW5nOiAlcy4uLicsIGNoYWxrLmJvbGQoY29tbWFuZCkpO1xuXG4gICAgICBzZXhlYyhjb21tYW5kLCBmdW5jdGlvbiAoY29kZSwgc3Rkb3V0LCBzdGRlcnIpIHtcbiAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyBjaGFsay5ib2xkKCdbdl0gQ29tbWFuZCBzdWNjZXNzZnVsbHkgZXhlY3V0ZWQuJykpO1xuICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLnJlZCgnW0VSUk9SXSBFeGl0IGNvZGUgOiAnICsgY29kZSkpXG4gICAgICAgICAgcmV0dXJuIG5leHQobmV3IEVycm9yKGNvbW1hbmQgKyAnIGZhaWxlZCwgc2VlIGVycm9yIGFib3ZlLicpKTtcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyAoZXJyLm1lc3NhZ2UgfHwgZXJyKSk7XG4gICAgICAgIHJldHVybiBjYihlcnIpO1xuICAgICAgfVxuICAgICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQuYmx1ZSgnKy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSsnKSk7XG4gICAgICBDb21tb24ucHJpbnRPdXQoY2hhbGsuYm9sZC5ibHVlKChjc3QuUFJFRklYX01TRyArICdGcmVlemUgYSBwcm9jZXNzIGxpc3Qgb24gcmVib290IHZpYTonKSkpO1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQoJyQgcG0yIHNhdmUnKSk7XG4gICAgICBDb21tb24ucHJpbnRPdXQoJycpO1xuICAgICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQuYmx1ZShjc3QuUFJFRklYX01TRyArICdSZW1vdmUgaW5pdCBzY3JpcHQgdmlhOicpKTtcbiAgICAgIENvbW1vbi5wcmludE91dChjaGFsay5ib2xkKCckIHBtMiB1bnN0YXJ0dXAgJyArIHBsYXRmb3JtKSk7XG5cbiAgICAgIHJldHVybiBjYihudWxsLCB7XG4gICAgICAgIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbixcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogRElTQUJMRUQgRkVBVFVSRVxuICAgKiBLRUVQSU5HIE1FVEhPRCBGT1IgQkFDS1dBUkQgQ09NUEFUXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmF1dG9kdW1wID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgcmV0dXJuIGNiKClcbiAgfVxuXG4gIC8qKlxuICAgKiBEdW1wIGN1cnJlbnQgcHJvY2Vzc2VzIG1hbmFnZWQgYnkgcG0yIGludG8gRFVNUF9GSUxFX1BBVEggZmlsZVxuICAgKiBAbWV0aG9kIGR1bXBcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUuZHVtcCA9IGZ1bmN0aW9uIChmb3JjZSwgY2IpIHtcbiAgICB2YXIgZW52X2FyciA9IFtdO1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICh0eXBlb2YgKGZvcmNlKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2IgPSBmb3JjZVxuICAgICAgZm9yY2UgPSBmYWxzZVxuICAgIH1cblxuICAgIGlmICghY2IpXG4gICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnU2F2aW5nIGN1cnJlbnQgcHJvY2VzcyBsaXN0Li4uJyk7XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIERlc2NyaXB0aW9uXG4gICAgICAgKiBAbWV0aG9kIGZpblxuICAgICAgICogQHBhcmFtIHt9IGVyclxuICAgICAgICogQHJldHVyblxuICAgICAgICovXG4gICAgICBmdW5jdGlvbiBmaW4oZXJyKSB7XG5cbiAgICAgICAgLy8gdHJ5IHRvIGZpeCBpc3N1ZXMgd2l0aCBlbXB0eSBkdW1wIGZpbGVcbiAgICAgICAgLy8gbGlrZSAjMzQ4NVxuICAgICAgICBpZiAoIWZvcmNlICYmIGVudl9hcnIubGVuZ3RoID09PSAwICYmICFwcm9jZXNzLmVudi5GT1JDRSkge1xuXG4gICAgICAgICAgLy8gZml4IDogaWYgbm8gZHVtcCBmaWxlLCBubyBwcm9jZXNzLCBvbmx5IG1vZHVsZSBhbmQgYWZ0ZXIgcG0yIHVwZGF0ZVxuICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhjc3QuRFVNUF9GSUxFX1BBVEgpKSB7XG4gICAgICAgICAgICB0aGF0LmNsZWFyRHVtcChmdW5jdGlvbiAoKSB7IH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGlmIG5vIHByb2Nlc3MgaW4gbGlzdCBkb24ndCBtb2RpZnkgZHVtcCBmaWxlXG4gICAgICAgICAgLy8gcHJvY2VzcyBsaXN0IHNob3VsZCBub3QgYmUgZW1wdHlcbiAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoJ1Byb2Nlc3MgbGlzdCBlbXB0eSwgY2Fubm90IHNhdmUgZW1wdHkgbGlzdCcpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX1dBUk5JTkcgKyAnUE0yIGlzIG5vdCBtYW5hZ2luZyBhbnkgcHJvY2Vzcywgc2tpcHBpbmcgc2F2ZS4uLicpO1xuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX1dBUk5JTkcgKyAnVG8gZm9yY2Ugc2F2aW5nIHVzZTogcG0yIHNhdmUgLS1mb3JjZScpO1xuICAgICAgICAgICAgdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJhY2sgdXAgZHVtcCBmaWxlXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoY3N0LkRVTVBfRklMRV9QQVRIKSkge1xuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhjc3QuRFVNUF9CQUNLVVBfRklMRV9QQVRILCBmcy5yZWFkRmlsZVN5bmMoY3N0LkRVTVBfRklMRV9QQVRIKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TR19FUlIgKyAnRmFpbGVkIHRvIGJhY2sgdXAgZHVtcCBmaWxlIGluICVzJywgY3N0LkRVTVBfQkFDS1VQX0ZJTEVfUEFUSCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPdmVyd3JpdGUgZHVtcCBmaWxlLCBkZWxldGUgaWYgYnJva2VuIGFuZCBleGl0XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhjc3QuRFVNUF9GSUxFX1BBVEgsIEpTT04uc3RyaW5naWZ5KGVudl9hcnIsIFtcIlwiXSwgMikpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyB0cnkgdG8gYmFja3VwIGZpbGVcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGNzdC5EVU1QX0JBQ0tVUF9GSUxFX1BBVEgpKSB7XG4gICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoY3N0LkRVTVBfRklMRV9QQVRILCBmcy5yZWFkRmlsZVN5bmMoY3N0LkRVTVBfQkFDS1VQX0ZJTEVfUEFUSCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIGRvbid0IGtlZXAgYnJva2VuIGZpbGVcbiAgICAgICAgICAgIGZzLnVubGlua1N5bmMoY3N0LkRVTVBfRklMRV9QQVRIKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHX0VSUiArICdGYWlsZWQgdG8gc2F2ZSBkdW1wIGZpbGUgaW4gJXMnLCBjc3QuRFVNUF9GSUxFX1BBVEgpO1xuICAgICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjYikgcmV0dXJuIGNiKG51bGwsIHsgc3VjY2VzczogdHJ1ZSB9KTtcblxuICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnU3VjY2Vzc2Z1bGx5IHNhdmVkIGluICVzJywgY3N0LkRVTVBfRklMRV9QQVRIKTtcbiAgICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH1cblxuICAgICAgKGZ1bmN0aW9uIGV4KGFwcHMpIHtcbiAgICAgICAgaWYgKCFhcHBzWzBdKSByZXR1cm4gZmluKG51bGwpO1xuICAgICAgICBkZWxldGUgYXBwc1swXS5wbTJfZW52Lmluc3RhbmNlcztcbiAgICAgICAgZGVsZXRlIGFwcHNbMF0ucG0yX2Vudi5wbV9pZDtcbiAgICAgICAgZGVsZXRlIGFwcHNbMF0ucG0yX2Vudi5wcmV2X3Jlc3RhcnRfZGVsYXk7XG4gICAgICAgIGlmICghYXBwc1swXS5wbTJfZW52LnBteF9tb2R1bGUpXG4gICAgICAgICAgZW52X2Fyci5wdXNoKGFwcHNbMF0ucG0yX2Vudik7XG4gICAgICAgIGFwcHMuc2hpZnQoKTtcbiAgICAgICAgcmV0dXJuIGV4KGFwcHMpO1xuICAgICAgfSkobGlzdCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBEVU1QX0ZJTEVfUEFUSCBmaWxlIGFuZCBEVU1QX0JBQ0tVUF9GSUxFX1BBVEggZmlsZVxuICAgKiBAbWV0aG9kIGR1bXBcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUuY2xlYXJEdW1wID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgZnMud3JpdGVGaWxlU3luYyhjc3QuRFVNUF9GSUxFX1BBVEgsIEpTT04uc3RyaW5naWZ5KFtdKSk7XG5cbiAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSByZXR1cm4gY2IoKTtcblxuICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdTdWNjZXNzZnVsbHkgY3JlYXRlZCAlcycsIGNzdC5EVU1QX0ZJTEVfUEFUSCk7XG4gICAgcmV0dXJuIHRoaXMuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgfTtcblxuICAvKipcbiAgICogUmVzdXJyZWN0IHByb2Nlc3Nlc1xuICAgKiBAbWV0aG9kIHJlc3VycmVjdFxuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVyblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5yZXN1cnJlY3QgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICB2YXIgYXBwcyA9IHt9O1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHZhciBwcm9jZXNzZXM7XG5cbiAgICBmdW5jdGlvbiByZWFkRHVtcEZpbGUoZHVtcEZpbGVQYXRoKSB7XG4gICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnUmVzdG9yaW5nIHByb2Nlc3NlcyBsb2NhdGVkIGluICVzJywgZHVtcEZpbGVQYXRoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBhcHBzID0gZnMucmVhZEZpbGVTeW5jKGR1bXBGaWxlUGF0aCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArICdGYWlsZWQgdG8gcmVhZCBkdW1wIGZpbGUgaW4gJXMnLCBkdW1wRmlsZVBhdGgpO1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXBwcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUR1bXBGaWxlKGR1bXBGaWxlUGF0aCwgYXBwcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIHByb2Nlc3NlcyA9IENvbW1vbi5wYXJzZUNvbmZpZyhhcHBzLCAnbm9uZScpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyAnRmFpbGVkIHRvIHBhcnNlIGR1bXAgZmlsZSBpbiAlcycsIGR1bXBGaWxlUGF0aCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZnMudW5saW5rU3luYyhkdW1wRmlsZVBhdGgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcm9jZXNzZXM7XG4gICAgfVxuXG4gICAgLy8gUmVhZCBkdW1wIGZpbGUsIGZhbGwgYmFjayB0byBiYWNrdXAsIGRlbGV0ZSBpZiBicm9rZW5cbiAgICB0cnkge1xuICAgICAgYXBwcyA9IHJlYWREdW1wRmlsZShjc3QuRFVNUF9GSUxFX1BBVEgpO1xuICAgICAgcHJvY2Vzc2VzID0gcGFyc2VEdW1wRmlsZShjc3QuRFVNUF9GSUxFX1BBVEgsIGFwcHMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGFwcHMgPSByZWFkRHVtcEZpbGUoY3N0LkRVTVBfQkFDS1VQX0ZJTEVfUEFUSCk7XG4gICAgICAgIHByb2Nlc3NlcyA9IHBhcnNlRHVtcEZpbGUoY3N0LkRVTVBfQkFDS1VQX0ZJTEVfUEFUSCwgYXBwcyk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArICdObyBwcm9jZXNzZXMgc2F2ZWQ7IERVTVAgZmlsZSBkb2VzblxcJ3QgZXhpc3QnKTtcbiAgICAgICAgLy8gaWYgKGNiKSByZXR1cm4gY2IoQ29tbW9uLnJldEVycihlKSk7XG4gICAgICAgIC8vIGVsc2UgcmV0dXJuIHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgIHJldHVybiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaSgxKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGN1cnJlbnQgPSBbXTtcbiAgICAgIHZhciB0YXJnZXQgPSBbXTtcblxuICAgICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChhcHApIHtcbiAgICAgICAgaWYgKCFjdXJyZW50W2FwcC5uYW1lXSlcbiAgICAgICAgICBjdXJyZW50W2FwcC5uYW1lXSA9IDA7XG4gICAgICAgIGN1cnJlbnRbYXBwLm5hbWVdKys7XG4gICAgICB9KTtcblxuICAgICAgcHJvY2Vzc2VzLmZvckVhY2goZnVuY3Rpb24gKGFwcCkge1xuICAgICAgICBpZiAoIXRhcmdldFthcHAubmFtZV0pXG4gICAgICAgICAgdGFyZ2V0W2FwcC5uYW1lXSA9IDA7XG4gICAgICAgIHRhcmdldFthcHAubmFtZV0rKztcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgdG9zdGFydCA9IE9iamVjdC5rZXlzKHRhcmdldCkuZmlsdGVyKGZ1bmN0aW9uIChpKSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhjdXJyZW50KS5pbmRleE9mKGkpIDwgMDtcbiAgICAgIH0pXG5cbiAgICAgIGVhY2hMaW1pdChwcm9jZXNzZXMsIGNzdC5DT05DVVJSRU5UX0FDVElPTlMsIGZ1bmN0aW9uIChhcHAsIG5leHQpIHtcbiAgICAgICAgaWYgKHRvc3RhcnQuaW5kZXhPZihhcHAubmFtZSkgPT0gLTEpXG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgncHJlcGFyZScsIGFwcCwgZnVuY3Rpb24gKGVyciwgZHQpIHtcbiAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnUHJvY2VzcyAlcyByZXN0b3JlZCcsIGFwcC5wbV9leGVjX3BhdGgpO1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGFwcHMpIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG59XG4iXX0=