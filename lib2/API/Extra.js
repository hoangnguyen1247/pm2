"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _constants = _interopRequireDefault(require("../../constants"));

var _Common = _interopRequireDefault(require("../Common"));

var _UX = _interopRequireDefault(require("./UX"));

var _chalk = _interopRequireDefault(require("chalk"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var fmt = _interopRequireWildcard(require("../tools/fmt"));

var _dayjs = _interopRequireDefault(require("dayjs"));

var _package = _interopRequireDefault(require("../../package.json"));

var _semver = _interopRequireDefault(require("semver"));

var _copydirSync = _interopRequireDefault(require("../tools/copydirSync"));

var _Log = _interopRequireDefault(require("./Log"));

var _Dashboard = _interopRequireDefault(require("./Dashboard"));

var _Monit = _interopRequireDefault(require("./Monit"));

/***************************
 *
 * Extra methods
 *
 **************************/
function _default(CLI) {
  /**
   * Get version of the daemonized PM2
   * @method getVersion
   * @callback cb
   */
  CLI.prototype.getVersion = function (cb) {
    var that = this;
    that.Client.executeRemote('getVersion', {}, function (err) {
      return cb ? cb.apply(null, arguments) : that.exitCli(_constants["default"].SUCCESS_EXIT);
    });
  };
  /**
   * Get version of the daemonized PM2
   * @method getVersion
   * @callback cb
   */


  CLI.prototype.launchSysMonitoring = function (cb) {
    var that = this;
    this.set('pm2:sysmonit', 'true', function () {
      that.Client.executeRemote('launchSysMonitoring', {}, function (err) {
        if (err) _Common["default"].err(err);else _Common["default"].log('System Monitoring launched');
        return cb ? cb.apply(null, arguments) : that.exitCli(_constants["default"].SUCCESS_EXIT);
      });
    });
  };
  /**
   * Show application environment
   * @method env
   * @callback cb
   */


  CLI.prototype.env = function (app_id, cb) {
    var _arguments = arguments,
        _this = this;

    var procs = [];
    var printed = 0;
    this.Client.executeRemote('getMonitorData', {}, function (err, list) {
      list.forEach(function (l) {
        if (app_id == l.pm_id) {
          printed++;

          var env = _Common["default"].safeExtend({}, l.pm2_env);

          Object.keys(env).forEach(function (key) {
            console.log("".concat(key, ": ").concat(_chalk["default"].green(env[key])));
          });
        }
      });

      if (printed == 0) {
        _Common["default"].err("Modules with id ".concat(app_id, " not found"));

        return cb ? cb.apply(null, _arguments) : _this.exitCli(_constants["default"].ERROR_EXIT);
      }

      return cb ? cb.apply(null, _arguments) : _this.exitCli(_constants["default"].SUCCESS_EXIT);
    });
  };
  /**
   * Get version of the daemonized PM2
   * @method getVersion
   * @callback cb
   */


  CLI.prototype.report = function () {
    var that = this;
    that.Client.executeRemote('getReport', {}, function (err, report) {
      console.log();
      console.log();
      console.log();
      console.log('```');
      fmt.title('PM2 report');
      fmt.field('Date', new Date());
      fmt.sep();
      fmt.title(_chalk["default"].bold.blue('Daemon'));
      fmt.field('pm2d version', report.pm2_version);
      fmt.field('node version', report.node_version);
      fmt.field('node path', report.node_path);
      fmt.field('argv', report.argv);
      fmt.field('argv0', report.argv0);
      fmt.field('user', report.user);
      fmt.field('uid', report.uid);
      fmt.field('gid', report.gid);
      fmt.field('uptime', (0, _dayjs["default"])(new Date()).diff(report.started_at, 'minute') + 'min');
      fmt.sep();
      fmt.title(_chalk["default"].bold.blue('CLI'));
      fmt.field('local pm2', _package["default"].version);
      fmt.field('node version', process.versions.node);
      fmt.field('node path', process.env['_'] || 'not found');
      fmt.field('argv', process.argv);
      fmt.field('argv0', process.argv0);
      fmt.field('user', process.env.USER || process.env.LNAME || process.env.USERNAME);
      if (_constants["default"].IS_WINDOWS === false && process.geteuid) fmt.field('uid', process.geteuid());
      if (_constants["default"].IS_WINDOWS === false && process.getegid) fmt.field('gid', process.getegid());

      var os = require('os');

      fmt.sep();
      fmt.title(_chalk["default"].bold.blue('System info'));
      fmt.field('arch', os.arch());
      fmt.field('platform', os.platform());
      fmt.field('type', os.type());
      fmt.field('cpus', os.cpus()[0].model);
      fmt.field('cpus nb', Object.keys(os.cpus()).length);
      fmt.field('freemem', os.freemem());
      fmt.field('totalmem', os.totalmem());
      fmt.field('home', os.homedir());
      that.Client.executeRemote('getMonitorData', {}, function (err, list) {
        fmt.sep();
        fmt.title(_chalk["default"].bold.blue('PM2 list'));

        _UX["default"].list(list, that.gl_interact_infos);

        fmt.sep();
        fmt.title(_chalk["default"].bold.blue('Daemon logs'));

        _Log["default"].tail([{
          path: _constants["default"].PM2_LOG_FILE_PATH,
          app_name: 'PM2',
          type: 'PM2'
        }], 20, false, function () {
          console.log('```');
          console.log();
          console.log();
          console.log(_chalk["default"].bold.green('Please copy/paste the above report in your issue on https://github.com/Unitech/pm2/issues'));
          console.log();
          console.log();
          that.exitCli(_constants["default"].SUCCESS_EXIT);
        });
      });
    });
  };

  CLI.prototype.getPID = function (app_name, cb) {
    var _this2 = this;

    if (typeof app_name === 'function') {
      cb = app_name;
      app_name = null;
    }

    this.Client.executeRemote('getMonitorData', {}, function (err, list) {
      if (err) {
        _Common["default"].printError(_constants["default"].PREFIX_MSG_ERR + err);

        return cb ? cb(_Common["default"].retErr(err)) : _this2.exitCli(_constants["default"].ERROR_EXIT);
      }

      var pids = [];
      list.forEach(function (app) {
        if (!app_name || app_name == app.name) pids.push(app.pid);
      });

      if (!cb) {
        _Common["default"].printOut(pids.join("\n"));

        return _this2.exitCli(_constants["default"].SUCCESS_EXIT);
      }

      return cb(null, pids);
    });
  };
  /**
   * Create PM2 memory snapshot
   * @method getVersion
   * @callback cb
   */


  CLI.prototype.profile = function (type, time, cb) {
    var _arguments2 = arguments,
        _this3 = this;

    var dayjs = require('dayjs');

    var cmd;

    if (type == 'cpu') {
      cmd = {
        ext: '.cpuprofile',
        action: 'profileCPU'
      };
    }

    if (type == 'mem') {
      cmd = {
        ext: '.heapprofile',
        action: 'profileMEM'
      };
    }

    var file = _path["default"].join(process.cwd(), dayjs().format('dd-HH:mm:ss') + cmd.ext);

    time = time || 10000;
    console.log("Starting ".concat(cmd.action, " profiling for ").concat(time, "ms..."));
    this.Client.executeRemote(cmd.action, {
      pwd: file,
      timeout: time
    }, function (err) {
      if (err) {
        console.error(err);
        return _this3.exitCli(1);
      }

      console.log("Profile done in ".concat(file));
      return cb ? cb.apply(null, _arguments2) : _this3.exitCli(_constants["default"].SUCCESS_EXIT);
    });
  };

  function basicMDHighlight(lines) {
    console.log('\n\n+-------------------------------------+');
    console.log(_chalk["default"].bold('README.md content:'));
    lines = lines.split('\n');
    var isInner = false;
    lines.forEach(function (l) {
      if (l.startsWith('#')) console.log(_chalk["default"].bold.green(l));else if (isInner || l.startsWith('```')) {
        if (isInner && l.startsWith('```')) isInner = false;else if (isInner == false) isInner = true;
        console.log(_chalk["default"].grey(l));
      } else if (l.startsWith('`')) console.log(_chalk["default"].grey(l));else console.log(l);
    });
    console.log('+-------------------------------------+');
  }
  /**
   * pm2 create command
   * create boilerplate of application for fast try
   * @method boilerplate
   */


  CLI.prototype.boilerplate = function (cb) {
    var _arguments3 = arguments,
        _this4 = this;

    var i = 0;
    var projects = [];

    var enquirer = require('enquirer');

    _fs["default"].readdir(_path["default"].join(__dirname, '../templates/sample-apps'), function (err, items) {
      require('async').forEach(items, function (app, next) {
        var fp = _path["default"].join(__dirname, '../templates/sample-apps', app);

        _fs["default"].readFile(_path["default"].join(fp, 'package.json'), "utf8", function (err, dt) {
          var meta = JSON.parse(dt);
          meta.fullpath = fp;
          meta.folder_name = app;
          projects.push(meta);
          next();
        });
      }, function () {
        var prompt = new enquirer.Select({
          name: 'boilerplate',
          message: 'Select a boilerplate',
          choices: projects.map(function (p, i) {
            return {
              message: "".concat(_chalk["default"].bold.blue(p.name), " ").concat(p.description),
              value: "".concat(i)
            };
          })
        });
        prompt.run().then(function (answer) {
          var p = projects[parseInt(answer)];
          basicMDHighlight(_fs["default"].readFileSync(_path["default"].join(p.fullpath, 'README.md')).toString());
          console.log(_chalk["default"].bold(">> Project copied inside folder ./".concat(p.folder_name, "/\n")));
          (0, _copydirSync["default"])(p.fullpath, _path["default"].join(process.cwd(), p.folder_name));

          _this4.start(_path["default"].join(p.fullpath, 'ecosystem.config.js'), {
            cwd: p.fullpath
          }, function () {
            return cb ? cb.apply(null, _arguments3) : _this4.speedList(_constants["default"].SUCCESS_EXIT);
          });
        })["catch"](function (e) {
          return cb ? cb.apply(null, _arguments3) : _this4.speedList(_constants["default"].SUCCESS_EXIT);
        });
      });
    });
  };
  /**
   * Description
   * @method sendLineToStdin
   */


  CLI.prototype.sendLineToStdin = function (pm_id, line, separator, cb) {
    var that = this;

    if (!cb && typeof separator == 'function') {
      cb = separator;
      separator = null;
    }

    var packet = {
      pm_id: pm_id,
      line: line + (separator || '\n')
    };
    that.Client.executeRemote('sendLineToStdin', packet, function (err, res) {
      if (err) {
        _Common["default"].printError(_constants["default"].PREFIX_MSG_ERR + err);

        return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      return cb ? cb(null, res) : that.speedList();
    });
  };
  /**
   * Description
   * @method attachToProcess
   */


  CLI.prototype.attach = function (pm_id, separator, cb) {
    var that = this;

    var readline = require('readline');

    if (isNaN(pm_id)) {
      _Common["default"].printError('pm_id must be a process number (not a process name)');

      return cb ? cb(_Common["default"].retErr('pm_id must be number')) : that.exitCli(_constants["default"].ERROR_EXIT);
    }

    if (typeof separator == 'function') {
      cb = separator;
      separator = null;
    }

    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.on('close', function () {
      return cb ? cb() : that.exitCli(_constants["default"].SUCCESS_EXIT);
    });
    that.Client.launchBus(function (err, bus, socket) {
      if (err) {
        _Common["default"].printError(err);

        return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      bus.on('log:*', function (type, packet) {
        if (packet.process.pm_id !== parseInt(pm_id)) return;
        process.stdout.write(packet.data);
      });
    });
    rl.on('line', function (line) {
      that.sendLineToStdin(pm_id, line, separator, function () {});
    });
  };
  /**
   * Description
   * @method sendDataToProcessId
   */


  CLI.prototype.sendDataToProcessId = function (proc_id, packet, cb) {
    var that = this;

    if ((0, _typeof2["default"])(proc_id) === 'object' && typeof packet === 'function') {
      // the proc_id is packet.
      cb = packet;
      packet = proc_id;
    } else {
      packet.id = proc_id;
    }

    that.Client.executeRemote('sendDataToProcessId', packet, function (err, res) {
      if (err) {
        _Common["default"].printError(err);

        return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      _Common["default"].printOut('successfully sent data to process');

      return cb ? cb(null, res) : that.speedList();
    });
  };
  /**
   * Used for custom actions, allows to trigger function inside an app
   * To expose a function you need to use keymetrics/pmx
   *
   * @method msgProcess
   * @param {Object} opts
   * @param {String} id           process id
   * @param {String} action_name  function name to trigger
   * @param {Object} [opts.opts]  object passed as first arg of the function
   * @param {String} [uuid]       optional unique identifier when logs are emitted
   *
   */


  CLI.prototype.msgProcess = function (opts, cb) {
    var that = this;
    that.Client.executeRemote('msgProcess', opts, cb);
  };
  /**
   * Trigger a PMX custom action in target application
   * Custom actions allows to interact with an application
   *
   * @method trigger
   * @param  {String|Number} pm_id       process id or application name
   * @param  {String}        action_name name of the custom action to trigger
   * @param  {Mixed}         params      parameter to pass to target action
   * @param  {Function}      cb          callback
   */


  CLI.prototype.trigger = function (pm_id, action_name, params, cb) {
    if (typeof params === 'function') {
      cb = params;
      params = null;
    }

    var cmd = {
      msg: action_name
    };
    var counter = 0;
    var process_wait_count = 0;
    var that = this;
    var results = [];

    if (params) {
      cmd.opts = params;
    }

    if (isNaN(pm_id)) {
      cmd.name = pm_id;
    } else {
      cmd.id = pm_id;
    }

    this.launchBus(function (err, bus) {
      bus.on('axm:reply', function (ret) {
        if (ret.process.name == pm_id || ret.process.pm_id == pm_id || ret.process.namespace == pm_id || pm_id == 'all') {
          results.push(ret);

          _Common["default"].printOut('[%s:%s:%s]=%j', ret.process.name, ret.process.pm_id, ret.process.namespace, ret.data["return"]);

          if (++counter == process_wait_count) return cb ? cb(null, results) : that.exitCli(_constants["default"].SUCCESS_EXIT);
        }
      });
      that.msgProcess(cmd, function (err, data) {
        if (err) {
          _Common["default"].printError(err);

          return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
        }

        if (data.process_count == 0) {
          _Common["default"].printError('Not any process has received a command (offline or unexistent)');

          return cb ? cb(_Common["default"].retErr('Unknown process')) : that.exitCli(_constants["default"].ERROR_EXIT);
        }

        process_wait_count = data.process_count;

        _Common["default"].printOut(_chalk["default"].bold('%s processes have received command %s'), data.process_count, action_name);
      });
    });
  };
  /**
   * Description
   * @method sendSignalToProcessName
   * @param {} signal
   * @param {} process_name
   * @return
   */


  CLI.prototype.sendSignalToProcessName = function (signal, process_name, cb) {
    var that = this;
    that.Client.executeRemote('sendSignalToProcessName', {
      signal: signal,
      process_name: process_name
    }, function (err, list) {
      if (err) {
        _Common["default"].printError(err);

        return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      _Common["default"].printOut('successfully sent signal %s to process name %s', signal, process_name);

      return cb ? cb(null, list) : that.speedList();
    });
  };
  /**
   * Description
   * @method sendSignalToProcessId
   * @param {} signal
   * @param {} process_id
   * @return
   */


  CLI.prototype.sendSignalToProcessId = function (signal, process_id, cb) {
    var that = this;
    that.Client.executeRemote('sendSignalToProcessId', {
      signal: signal,
      process_id: process_id
    }, function (err, list) {
      if (err) {
        _Common["default"].printError(err);

        return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      _Common["default"].printOut('successfully sent signal %s to process id %s', signal, process_id);

      return cb ? cb(null, list) : that.speedList();
    });
  };
  /**
   * API method to launch a process that will serve directory over http
   */


  CLI.prototype.autoinstall = function (cb) {
    var _this5 = this;

    var filepath = _path["default"].resolve(_path["default"].dirname(module.filename), '../Sysinfo/ServiceDetection/ServiceDetection.js');

    this.start(filepath, function (err, res) {
      if (err) {
        _Common["default"].printError(_constants["default"].PREFIX_MSG_ERR + 'Error while trying to serve : ' + err.message || err);

        return cb ? cb(err) : _this5.speedList(_constants["default"].ERROR_EXIT);
      }

      return cb ? cb(null) : _this5.speedList();
    });
  };
  /**
   * API method to launch a process that will serve directory over http
   *
   * @param {Object} opts options
   * @param {String} opts.path path to be served
   * @param {Number} opts.port port on which http will bind
   * @param {Boolean} opts.spa single page app served
   * @param {String} opts.basicAuthUsername basic auth username
   * @param {String} opts.basicAuthPassword basic auth password
   * @param {Object} commander commander object
   * @param {Function} cb optional callback
   */


  CLI.prototype.serve = function (target_path, port, opts, commander, cb) {
    var that = this;
    var servePort = process.env.PM2_SERVE_PORT || port || 8080;

    var servePath = _path["default"].resolve(process.env.PM2_SERVE_PATH || target_path || '.');

    var filepath = _path["default"].resolve(_path["default"].dirname(module.filename), './Serve.js');

    if (typeof commander.name === 'string') opts.name = commander.name;else opts.name = 'static-page-server-' + servePort;
    if (!opts.env) opts.env = {};
    opts.env.PM2_SERVE_PORT = servePort;
    opts.env.PM2_SERVE_PATH = servePath;
    opts.env.PM2_SERVE_SPA = opts.spa;

    if (opts.basicAuthUsername && opts.basicAuthPassword) {
      opts.env.PM2_SERVE_BASIC_AUTH = 'true';
      opts.env.PM2_SERVE_BASIC_AUTH_USERNAME = opts.basicAuthUsername;
      opts.env.PM2_SERVE_BASIC_AUTH_PASSWORD = opts.basicAuthPassword;
    }

    if (opts.monitor) {
      opts.env.PM2_SERVE_MONITOR = opts.monitor;
    }

    opts.cwd = servePath;
    this.start(filepath, opts, function (err, res) {
      if (err) {
        _Common["default"].printError(_constants["default"].PREFIX_MSG_ERR + 'Error while trying to serve : ' + err.message || err);

        return cb ? cb(err) : that.speedList(_constants["default"].ERROR_EXIT);
      }

      _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Serving ' + servePath + ' on port ' + servePort);

      return cb ? cb(null, res) : that.speedList();
    });
  };
  /**
   * Ping daemon - if PM2 daemon not launched, it will launch it
   * @method ping
   */


  CLI.prototype.ping = function (cb) {
    var _this6 = this;

    this.Client.executeRemote('ping', {}, function (err, res) {
      if (err) {
        _Common["default"].printError(err);

        return cb ? cb(new Error(err)) : _this6.exitCli(_constants["default"].ERROR_EXIT);
      }

      _Common["default"].printOut(res);

      return cb ? cb(null, res) : _this6.exitCli(_constants["default"].SUCCESS_EXIT);
    });
  };
  /**
   * Execute remote command
   */


  CLI.prototype.remote = function (command, opts, cb) {
    var that = this;
    that[command](opts.name, function (err_cmd, ret) {
      if (err_cmd) console.error(err_cmd);
      console.log('Command %s finished', command);
      return cb(err_cmd, ret);
    });
  };
  /**
   * This remote method allows to pass multiple arguments
   * to PM2
   * It is used for the new scoped PM2 action system
   */


  CLI.prototype.remoteV2 = function (command, opts, cb) {
    var that = this;
    if (that[command].length == 1) return that[command](cb);
    opts.args.push(cb);
    return that[command].apply(this, opts.args);
  };
  /**
   * Description
   * @method generateSample
   * @param {} name
   * @return
   */


  CLI.prototype.generateSample = function (mode) {
    var that = this;
    var templatePath;
    if (mode == 'simple') templatePath = _path["default"].join(_constants["default"].TEMPLATE_FOLDER, _constants["default"].APP_CONF_TPL_SIMPLE);else templatePath = _path["default"].join(_constants["default"].TEMPLATE_FOLDER, _constants["default"].APP_CONF_TPL);

    var sample = _fs["default"].readFileSync(templatePath);

    var dt = sample.toString();
    var f_name = 'ecosystem.config.js';
    var pwd = process.env.PWD || process.cwd();

    try {
      _fs["default"].writeFileSync(_path["default"].join(pwd, f_name), dt);
    } catch (e) {
      console.error(e.stack || e);
      return that.exitCli(_constants["default"].ERROR_EXIT);
    }

    _Common["default"].printOut('File %s generated', _path["default"].join(pwd, f_name));

    that.exitCli(_constants["default"].SUCCESS_EXIT);
  };
  /**
   * Description
   * @method dashboard
   * @return
   */


  CLI.prototype.dashboard = function (cb) {
    var that = this;
    if (cb) return cb(new Error('Dashboard cant be called programmatically'));

    _Dashboard["default"].init();

    this.Client.launchBus(function (err, bus) {
      if (err) {
        console.error('Error launchBus: ' + err);
        that.exitCli(_constants["default"].ERROR_EXIT);
      }

      bus.on('log:*', function (type, data) {
        _Dashboard["default"].log(type, data);
      });
    });
    process.on('SIGINT', function () {
      this.Client.disconnectBus(function () {
        process.exit(_constants["default"].SUCCESS_EXIT);
      });
    });

    function refreshDashboard() {
      that.Client.executeRemote('getMonitorData', {}, function (err, list) {
        if (err) {
          console.error('Error retrieving process list: ' + err);
          that.exitCli(_constants["default"].ERROR_EXIT);
        }

        _Dashboard["default"].refresh(list);

        setTimeout(function () {
          refreshDashboard();
        }, 800);
      });
    }

    refreshDashboard();
  };

  CLI.prototype.monit = function (cb) {
    var that = this;
    if (cb) return cb(new Error('Monit cant be called programmatically'));

    _Monit["default"].init();

    function launchMonitor() {
      that.Client.executeRemote('getMonitorData', {}, function (err, list) {
        if (err) {
          console.error('Error retrieving process list: ' + err);
          that.exitCli(_constants["default"].ERROR_EXIT);
        }

        _Monit["default"].refresh(list);

        setTimeout(function () {
          launchMonitor();
        }, 400);
      });
    }

    launchMonitor();
  };

  CLI.prototype.inspect = function (app_name, cb) {
    var that = this;

    if (_semver["default"].satisfies(process.versions.node, '>= 8.0.0')) {
      this.trigger(app_name, 'internal:inspect', function (err, res) {
        if (res && res[0]) {
          if (res[0].data["return"] === '') {
            _Common["default"].printOut("Inspect disabled on ".concat(app_name));
          } else {
            _Common["default"].printOut("Inspect enabled on ".concat(app_name, " => go to chrome : chrome://inspect !!!"));
          }
        } else {
          _Common["default"].printOut("Unable to activate inspect mode on ".concat(app_name, " !!!"));
        }

        that.exitCli(_constants["default"].SUCCESS_EXIT);
      });
    } else {
      _Common["default"].printOut('Inspect is available for node version >=8.x !');

      that.exitCli(_constants["default"].SUCCESS_EXIT);
    }
  };
}

;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvRXh0cmEudHMiXSwibmFtZXMiOlsiQ0xJIiwicHJvdG90eXBlIiwiZ2V0VmVyc2lvbiIsImNiIiwidGhhdCIsIkNsaWVudCIsImV4ZWN1dGVSZW1vdGUiLCJlcnIiLCJhcHBseSIsImFyZ3VtZW50cyIsImV4aXRDbGkiLCJjc3QiLCJTVUNDRVNTX0VYSVQiLCJsYXVuY2hTeXNNb25pdG9yaW5nIiwic2V0IiwiQ29tbW9uIiwibG9nIiwiZW52IiwiYXBwX2lkIiwicHJvY3MiLCJwcmludGVkIiwibGlzdCIsImZvckVhY2giLCJsIiwicG1faWQiLCJzYWZlRXh0ZW5kIiwicG0yX2VudiIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJjb25zb2xlIiwiY2hhbGsiLCJncmVlbiIsIkVSUk9SX0VYSVQiLCJyZXBvcnQiLCJmbXQiLCJ0aXRsZSIsImZpZWxkIiwiRGF0ZSIsInNlcCIsImJvbGQiLCJibHVlIiwicG0yX3ZlcnNpb24iLCJub2RlX3ZlcnNpb24iLCJub2RlX3BhdGgiLCJhcmd2IiwiYXJndjAiLCJ1c2VyIiwidWlkIiwiZ2lkIiwiZGlmZiIsInN0YXJ0ZWRfYXQiLCJwa2ciLCJ2ZXJzaW9uIiwicHJvY2VzcyIsInZlcnNpb25zIiwibm9kZSIsIlVTRVIiLCJMTkFNRSIsIlVTRVJOQU1FIiwiSVNfV0lORE9XUyIsImdldGV1aWQiLCJnZXRlZ2lkIiwib3MiLCJyZXF1aXJlIiwiYXJjaCIsInBsYXRmb3JtIiwidHlwZSIsImNwdXMiLCJtb2RlbCIsImxlbmd0aCIsImZyZWVtZW0iLCJ0b3RhbG1lbSIsImhvbWVkaXIiLCJVWCIsImdsX2ludGVyYWN0X2luZm9zIiwiTG9nIiwidGFpbCIsInBhdGgiLCJQTTJfTE9HX0ZJTEVfUEFUSCIsImFwcF9uYW1lIiwiZ2V0UElEIiwicHJpbnRFcnJvciIsIlBSRUZJWF9NU0dfRVJSIiwicmV0RXJyIiwicGlkcyIsImFwcCIsIm5hbWUiLCJwdXNoIiwicGlkIiwicHJpbnRPdXQiLCJqb2luIiwicHJvZmlsZSIsInRpbWUiLCJkYXlqcyIsImNtZCIsImV4dCIsImFjdGlvbiIsImZpbGUiLCJjd2QiLCJmb3JtYXQiLCJwd2QiLCJ0aW1lb3V0IiwiZXJyb3IiLCJiYXNpY01ESGlnaGxpZ2h0IiwibGluZXMiLCJzcGxpdCIsImlzSW5uZXIiLCJzdGFydHNXaXRoIiwiZ3JleSIsImJvaWxlcnBsYXRlIiwiaSIsInByb2plY3RzIiwiZW5xdWlyZXIiLCJmcyIsInJlYWRkaXIiLCJfX2Rpcm5hbWUiLCJpdGVtcyIsIm5leHQiLCJmcCIsInJlYWRGaWxlIiwiZHQiLCJtZXRhIiwiSlNPTiIsInBhcnNlIiwiZnVsbHBhdGgiLCJmb2xkZXJfbmFtZSIsInByb21wdCIsIlNlbGVjdCIsIm1lc3NhZ2UiLCJjaG9pY2VzIiwibWFwIiwicCIsImRlc2NyaXB0aW9uIiwidmFsdWUiLCJydW4iLCJ0aGVuIiwiYW5zd2VyIiwicGFyc2VJbnQiLCJyZWFkRmlsZVN5bmMiLCJ0b1N0cmluZyIsInN0YXJ0Iiwic3BlZWRMaXN0IiwiZSIsInNlbmRMaW5lVG9TdGRpbiIsImxpbmUiLCJzZXBhcmF0b3IiLCJwYWNrZXQiLCJyZXMiLCJhdHRhY2giLCJyZWFkbGluZSIsImlzTmFOIiwicmwiLCJjcmVhdGVJbnRlcmZhY2UiLCJpbnB1dCIsInN0ZGluIiwib3V0cHV0Iiwic3Rkb3V0Iiwib24iLCJsYXVuY2hCdXMiLCJidXMiLCJzb2NrZXQiLCJ3cml0ZSIsImRhdGEiLCJzZW5kRGF0YVRvUHJvY2Vzc0lkIiwicHJvY19pZCIsImlkIiwibXNnUHJvY2VzcyIsIm9wdHMiLCJ0cmlnZ2VyIiwiYWN0aW9uX25hbWUiLCJwYXJhbXMiLCJtc2ciLCJjb3VudGVyIiwicHJvY2Vzc193YWl0X2NvdW50IiwicmVzdWx0cyIsInJldCIsIm5hbWVzcGFjZSIsInByb2Nlc3NfY291bnQiLCJzZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZSIsInNpZ25hbCIsInByb2Nlc3NfbmFtZSIsInNlbmRTaWduYWxUb1Byb2Nlc3NJZCIsInByb2Nlc3NfaWQiLCJhdXRvaW5zdGFsbCIsImZpbGVwYXRoIiwicmVzb2x2ZSIsImRpcm5hbWUiLCJtb2R1bGUiLCJmaWxlbmFtZSIsInNlcnZlIiwidGFyZ2V0X3BhdGgiLCJwb3J0IiwiY29tbWFuZGVyIiwic2VydmVQb3J0IiwiUE0yX1NFUlZFX1BPUlQiLCJzZXJ2ZVBhdGgiLCJQTTJfU0VSVkVfUEFUSCIsIlBNMl9TRVJWRV9TUEEiLCJzcGEiLCJiYXNpY0F1dGhVc2VybmFtZSIsImJhc2ljQXV0aFBhc3N3b3JkIiwiUE0yX1NFUlZFX0JBU0lDX0FVVEgiLCJQTTJfU0VSVkVfQkFTSUNfQVVUSF9VU0VSTkFNRSIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIX1BBU1NXT1JEIiwibW9uaXRvciIsIlBNMl9TRVJWRV9NT05JVE9SIiwiUFJFRklYX01TRyIsInBpbmciLCJFcnJvciIsInJlbW90ZSIsImNvbW1hbmQiLCJlcnJfY21kIiwicmVtb3RlVjIiLCJhcmdzIiwiZ2VuZXJhdGVTYW1wbGUiLCJtb2RlIiwidGVtcGxhdGVQYXRoIiwiVEVNUExBVEVfRk9MREVSIiwiQVBQX0NPTkZfVFBMX1NJTVBMRSIsIkFQUF9DT05GX1RQTCIsInNhbXBsZSIsImZfbmFtZSIsIlBXRCIsIndyaXRlRmlsZVN5bmMiLCJzdGFjayIsImRhc2hib2FyZCIsIkRhc2hib2FyZCIsImluaXQiLCJkaXNjb25uZWN0QnVzIiwiZXhpdCIsInJlZnJlc2hEYXNoYm9hcmQiLCJyZWZyZXNoIiwic2V0VGltZW91dCIsIm1vbml0IiwiTW9uaXQiLCJsYXVuY2hNb25pdG9yIiwiaW5zcGVjdCIsInNlbXZlciIsInNhdGlzZmllcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQU1BOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQW5CQTs7Ozs7QUFxQmUsa0JBQVVBLEdBQVYsRUFBZTtBQUMxQjs7Ozs7QUFLQUEsRUFBQUEsR0FBRyxDQUFDQyxTQUFK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Q0g7QUFDSixHQXJCRDtBQXNCSDs7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqXG4gKiBFeHRyYSBtZXRob2RzXG4gKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5pbXBvcnQgY3N0IGZyb20gJy4uLy4uL2NvbnN0YW50cyc7XG5pbXBvcnQgQ29tbW9uIGZyb20gJy4uL0NvbW1vbic7XG5pbXBvcnQgVVggZnJvbSAnLi9VWCc7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgZm10IGZyb20gJy4uL3Rvb2xzL2ZtdCc7XG5pbXBvcnQgZGF5anMgZnJvbSAnZGF5anMnO1xuaW1wb3J0IHBrZyBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nO1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IGNvcHlEaXJTeW5jIGZyb20gJy4uL3Rvb2xzL2NvcHlkaXJTeW5jJ1xuaW1wb3J0IExvZyBmcm9tICcuL0xvZyc7XG5pbXBvcnQgRGFzaGJvYXJkIGZyb20gJy4vRGFzaGJvYXJkJztcbmltcG9ydCBNb25pdCBmcm9tICcuL01vbml0JztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKENMSSkge1xuICAgIC8qKlxuICAgICAqIEdldCB2ZXJzaW9uIG9mIHRoZSBkYWVtb25pemVkIFBNMlxuICAgICAqIEBtZXRob2QgZ2V0VmVyc2lvblxuICAgICAqIEBjYWxsYmFjayBjYlxuICAgICAqL1xuICAgIENMSS5wcm90b3R5cGUuZ2V0VmVyc2lvbiA9IGZ1bmN0aW9uIChjYikge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0VmVyc2lvbicsIHt9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYi5hcHBseShudWxsLCBhcmd1bWVudHMpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogR2V0IHZlcnNpb24gb2YgdGhlIGRhZW1vbml6ZWQgUE0yXG4gICAgICogQG1ldGhvZCBnZXRWZXJzaW9uXG4gICAgICogQGNhbGxiYWNrIGNiXG4gICAgICovXG4gICAgQ0xJLnByb3RvdHlwZS5sYXVuY2hTeXNNb25pdG9yaW5nID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICB0aGlzLnNldCgncG0yOnN5c21vbml0JywgJ3RydWUnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdsYXVuY2hTeXNNb25pdG9yaW5nJywge30sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgICAgICBDb21tb24uZXJyKGVycilcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIENvbW1vbi5sb2coJ1N5c3RlbSBNb25pdG9yaW5nIGxhdW5jaGVkJylcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYi5hcHBseShudWxsLCBhcmd1bWVudHMpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2hvdyBhcHBsaWNhdGlvbiBlbnZpcm9ubWVudFxuICAgICAqIEBtZXRob2QgZW52XG4gICAgICogQGNhbGxiYWNrIGNiXG4gICAgICovXG4gICAgQ0xJLnByb3RvdHlwZS5lbnYgPSBmdW5jdGlvbiAoYXBwX2lkLCBjYikge1xuICAgICAgICB2YXIgcHJvY3MgPSBbXVxuICAgICAgICB2YXIgcHJpbnRlZCA9IDBcblxuICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCAoZXJyLCBsaXN0KSA9PiB7XG4gICAgICAgICAgICBsaXN0LmZvckVhY2gobCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGFwcF9pZCA9PSBsLnBtX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50ZWQrK1xuICAgICAgICAgICAgICAgICAgICB2YXIgZW52ID0gQ29tbW9uLnNhZmVFeHRlbmQoe30sIGwucG0yX2VudilcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZW52KS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgJHtrZXl9OiAke2NoYWxrLmdyZWVuKGVudltrZXldKX1gKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGlmIChwcmludGVkID09IDApIHtcbiAgICAgICAgICAgICAgICBDb21tb24uZXJyKGBNb2R1bGVzIHdpdGggaWQgJHthcHBfaWR9IG5vdCBmb3VuZGApXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IuYXBwbHkobnVsbCwgYXJndW1lbnRzKSA6IHRoaXMuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYi5hcHBseShudWxsLCBhcmd1bWVudHMpIDogdGhpcy5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICB9KVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdmVyc2lvbiBvZiB0aGUgZGFlbW9uaXplZCBQTTJcbiAgICAgKiBAbWV0aG9kIGdldFZlcnNpb25cbiAgICAgKiBAY2FsbGJhY2sgY2JcbiAgICAgKi9cbiAgICBDTEkucHJvdG90eXBlLnJlcG9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldFJlcG9ydCcsIHt9LCBmdW5jdGlvbiAoZXJyLCByZXBvcnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKClcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKClcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKClcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdgYGAnKVxuICAgICAgICAgICAgZm10LnRpdGxlKCdQTTIgcmVwb3J0JylcbiAgICAgICAgICAgIGZtdC5maWVsZCgnRGF0ZScsIG5ldyBEYXRlKCkpO1xuICAgICAgICAgICAgZm10LnNlcCgpO1xuICAgICAgICAgICAgZm10LnRpdGxlKGNoYWxrLmJvbGQuYmx1ZSgnRGFlbW9uJykpO1xuICAgICAgICAgICAgZm10LmZpZWxkKCdwbTJkIHZlcnNpb24nLCByZXBvcnQucG0yX3ZlcnNpb24pO1xuICAgICAgICAgICAgZm10LmZpZWxkKCdub2RlIHZlcnNpb24nLCByZXBvcnQubm9kZV92ZXJzaW9uKTtcbiAgICAgICAgICAgIGZtdC5maWVsZCgnbm9kZSBwYXRoJywgcmVwb3J0Lm5vZGVfcGF0aCk7XG4gICAgICAgICAgICBmbXQuZmllbGQoJ2FyZ3YnLCByZXBvcnQuYXJndik7XG4gICAgICAgICAgICBmbXQuZmllbGQoJ2FyZ3YwJywgcmVwb3J0LmFyZ3YwKTtcbiAgICAgICAgICAgIGZtdC5maWVsZCgndXNlcicsIHJlcG9ydC51c2VyKTtcbiAgICAgICAgICAgIGZtdC5maWVsZCgndWlkJywgcmVwb3J0LnVpZCk7XG4gICAgICAgICAgICBmbXQuZmllbGQoJ2dpZCcsIHJlcG9ydC5naWQpO1xuICAgICAgICAgICAgZm10LmZpZWxkKCd1cHRpbWUnLCBkYXlqcyhuZXcgRGF0ZSgpKS5kaWZmKHJlcG9ydC5zdGFydGVkX2F0LCAnbWludXRlJykgKyAnbWluJyk7XG5cbiAgICAgICAgICAgIGZtdC5zZXAoKTtcbiAgICAgICAgICAgIGZtdC50aXRsZShjaGFsay5ib2xkLmJsdWUoJ0NMSScpKTtcbiAgICAgICAgICAgIGZtdC5maWVsZCgnbG9jYWwgcG0yJywgcGtnLnZlcnNpb24pO1xuICAgICAgICAgICAgZm10LmZpZWxkKCdub2RlIHZlcnNpb24nLCBwcm9jZXNzLnZlcnNpb25zLm5vZGUpO1xuICAgICAgICAgICAgZm10LmZpZWxkKCdub2RlIHBhdGgnLCBwcm9jZXNzLmVudlsnXyddIHx8ICdub3QgZm91bmQnKTtcbiAgICAgICAgICAgIGZtdC5maWVsZCgnYXJndicsIHByb2Nlc3MuYXJndik7XG4gICAgICAgICAgICBmbXQuZmllbGQoJ2FyZ3YwJywgcHJvY2Vzcy5hcmd2MCk7XG4gICAgICAgICAgICBmbXQuZmllbGQoJ3VzZXInLCBwcm9jZXNzLmVudi5VU0VSIHx8IHByb2Nlc3MuZW52LkxOQU1FIHx8IHByb2Nlc3MuZW52LlVTRVJOQU1FKTtcbiAgICAgICAgICAgIGlmIChjc3QuSVNfV0lORE9XUyA9PT0gZmFsc2UgJiYgcHJvY2Vzcy5nZXRldWlkKVxuICAgICAgICAgICAgICAgIGZtdC5maWVsZCgndWlkJywgcHJvY2Vzcy5nZXRldWlkKCkpO1xuICAgICAgICAgICAgaWYgKGNzdC5JU19XSU5ET1dTID09PSBmYWxzZSAmJiBwcm9jZXNzLmdldGVnaWQpXG4gICAgICAgICAgICAgICAgZm10LmZpZWxkKCdnaWQnLCBwcm9jZXNzLmdldGVnaWQoKSk7XG5cbiAgICAgICAgICAgIHZhciBvcyA9IHJlcXVpcmUoJ29zJyk7XG5cbiAgICAgICAgICAgIGZtdC5zZXAoKTtcbiAgICAgICAgICAgIGZtdC50aXRsZShjaGFsay5ib2xkLmJsdWUoJ1N5c3RlbSBpbmZvJykpO1xuICAgICAgICAgICAgZm10LmZpZWxkKCdhcmNoJywgb3MuYXJjaCgpKTtcbiAgICAgICAgICAgIGZtdC5maWVsZCgncGxhdGZvcm0nLCBvcy5wbGF0Zm9ybSgpKTtcbiAgICAgICAgICAgIGZtdC5maWVsZCgndHlwZScsIG9zLnR5cGUoKSk7XG4gICAgICAgICAgICBmbXQuZmllbGQoJ2NwdXMnLCBvcy5jcHVzKClbMF0ubW9kZWwpO1xuICAgICAgICAgICAgZm10LmZpZWxkKCdjcHVzIG5iJywgT2JqZWN0LmtleXMob3MuY3B1cygpKS5sZW5ndGgpO1xuICAgICAgICAgICAgZm10LmZpZWxkKCdmcmVlbWVtJywgb3MuZnJlZW1lbSgpKTtcbiAgICAgICAgICAgIGZtdC5maWVsZCgndG90YWxtZW0nLCBvcy50b3RhbG1lbSgpKTtcbiAgICAgICAgICAgIGZtdC5maWVsZCgnaG9tZScsIG9zLmhvbWVkaXIoKSk7XG5cbiAgICAgICAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcblxuICAgICAgICAgICAgICAgIGZtdC5zZXAoKTtcbiAgICAgICAgICAgICAgICBmbXQudGl0bGUoY2hhbGsuYm9sZC5ibHVlKCdQTTIgbGlzdCcpKTtcbiAgICAgICAgICAgICAgICBVWC5saXN0KGxpc3QsIHRoYXQuZ2xfaW50ZXJhY3RfaW5mb3MpO1xuXG4gICAgICAgICAgICAgICAgZm10LnNlcCgpO1xuICAgICAgICAgICAgICAgIGZtdC50aXRsZShjaGFsay5ib2xkLmJsdWUoJ0RhZW1vbiBsb2dzJykpO1xuICAgICAgICAgICAgICAgIExvZy50YWlsKFt7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IGNzdC5QTTJfTE9HX0ZJTEVfUEFUSCxcbiAgICAgICAgICAgICAgICAgICAgYXBwX25hbWU6ICdQTTInLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnUE0yJ1xuICAgICAgICAgICAgICAgIH1dLCAyMCwgZmFsc2UsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2BgYCcpXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKClcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coKVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmJvbGQuZ3JlZW4oJ1BsZWFzZSBjb3B5L3Bhc3RlIHRoZSBhYm92ZSByZXBvcnQgaW4geW91ciBpc3N1ZSBvbiBodHRwczovL2dpdGh1Yi5jb20vVW5pdGVjaC9wbTIvaXNzdWVzJykpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKClcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coKVxuICAgICAgICAgICAgICAgICAgICB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIENMSS5wcm90b3R5cGUuZ2V0UElEID0gZnVuY3Rpb24gKGFwcF9uYW1lLCBjYikge1xuICAgICAgICBpZiAodHlwZW9mIChhcHBfbmFtZSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNiID0gYXBwX25hbWU7XG4gICAgICAgICAgICBhcHBfbmFtZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCAoZXJyLCBsaXN0KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhpcy5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHBpZHMgPSBbXTtcblxuICAgICAgICAgICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChhcHApIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFwcF9uYW1lIHx8IGFwcF9uYW1lID09IGFwcC5uYW1lKVxuICAgICAgICAgICAgICAgICAgICBwaWRzLnB1c2goYXBwLnBpZCk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBpZiAoIWNiKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KHBpZHMuam9pbihcIlxcblwiKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNiKG51bGwsIHBpZHMpO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBQTTIgbWVtb3J5IHNuYXBzaG90XG4gICAgICogQG1ldGhvZCBnZXRWZXJzaW9uXG4gICAgICogQGNhbGxiYWNrIGNiXG4gICAgICovXG4gICAgQ0xJLnByb3RvdHlwZS5wcm9maWxlID0gZnVuY3Rpb24gKHR5cGUsIHRpbWUsIGNiKSB7XG4gICAgICAgIHZhciBkYXlqcyA9IHJlcXVpcmUoJ2RheWpzJyk7XG4gICAgICAgIHZhciBjbWRcblxuICAgICAgICBpZiAodHlwZSA9PSAnY3B1Jykge1xuICAgICAgICAgICAgY21kID0ge1xuICAgICAgICAgICAgICAgIGV4dDogJy5jcHVwcm9maWxlJyxcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdwcm9maWxlQ1BVJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09ICdtZW0nKSB7XG4gICAgICAgICAgICBjbWQgPSB7XG4gICAgICAgICAgICAgICAgZXh0OiAnLmhlYXBwcm9maWxlJyxcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdwcm9maWxlTUVNJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpbGUgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgZGF5anMoKS5mb3JtYXQoJ2RkLUhIOm1tOnNzJykgKyBjbWQuZXh0KTtcbiAgICAgICAgdGltZSA9IHRpbWUgfHwgMTAwMDBcblxuICAgICAgICBjb25zb2xlLmxvZyhgU3RhcnRpbmcgJHtjbWQuYWN0aW9ufSBwcm9maWxpbmcgZm9yICR7dGltZX1tcy4uLmApXG4gICAgICAgIHRoaXMuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoY21kLmFjdGlvbiwge1xuICAgICAgICAgICAgcHdkOiBmaWxlLFxuICAgICAgICAgICAgdGltZW91dDogdGltZVxuICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4aXRDbGkoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgUHJvZmlsZSBkb25lIGluICR7ZmlsZX1gKVxuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IuYXBwbHkobnVsbCwgYXJndW1lbnRzKSA6IHRoaXMuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gYmFzaWNNREhpZ2hsaWdodChsaW5lcykge1xuICAgICAgICBjb25zb2xlLmxvZygnXFxuXFxuKy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0rJylcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuYm9sZCgnUkVBRE1FLm1kIGNvbnRlbnQ6JykpXG4gICAgICAgIGxpbmVzID0gbGluZXMuc3BsaXQoJ1xcbicpXG4gICAgICAgIHZhciBpc0lubmVyID0gZmFsc2VcbiAgICAgICAgbGluZXMuZm9yRWFjaChsID0+IHtcbiAgICAgICAgICAgIGlmIChsLnN0YXJ0c1dpdGgoJyMnKSlcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ib2xkLmdyZWVuKGwpKVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNJbm5lciB8fCBsLnN0YXJ0c1dpdGgoJ2BgYCcpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzSW5uZXIgJiYgbC5zdGFydHNXaXRoKCdgYGAnKSlcbiAgICAgICAgICAgICAgICAgICAgaXNJbm5lciA9IGZhbHNlXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaXNJbm5lciA9PSBmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgaXNJbm5lciA9IHRydWVcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmV5KGwpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobC5zdGFydHNXaXRoKCdgJykpXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JleShsKSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhsKVxuICAgICAgICB9KVxuICAgICAgICBjb25zb2xlLmxvZygnKy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0rJylcbiAgICB9XG4gICAgLyoqXG4gICAgICogcG0yIGNyZWF0ZSBjb21tYW5kXG4gICAgICogY3JlYXRlIGJvaWxlcnBsYXRlIG9mIGFwcGxpY2F0aW9uIGZvciBmYXN0IHRyeVxuICAgICAqIEBtZXRob2QgYm9pbGVycGxhdGVcbiAgICAgKi9cbiAgICBDTEkucHJvdG90eXBlLmJvaWxlcnBsYXRlID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgIHZhciBpID0gMFxuICAgICAgICB2YXIgcHJvamVjdHMgPSBbXVxuICAgICAgICB2YXIgZW5xdWlyZXIgPSByZXF1aXJlKCdlbnF1aXJlcicpXG5cbiAgICAgICAgZnMucmVhZGRpcihwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGVzL3NhbXBsZS1hcHBzJyksIChlcnIsIGl0ZW1zKSA9PiB7XG4gICAgICAgICAgICByZXF1aXJlKCdhc3luYycpLmZvckVhY2goaXRlbXMsIChhcHAsIG5leHQpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgZnAgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGVzL3NhbXBsZS1hcHBzJywgYXBwKVxuICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKHBhdGguam9pbihmcCwgJ3BhY2thZ2UuanNvbicpLCBcInV0ZjhcIiwgKGVyciwgZHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1ldGEgPSBKU09OLnBhcnNlKGR0KVxuICAgICAgICAgICAgICAgICAgICBtZXRhLmZ1bGxwYXRoID0gZnBcbiAgICAgICAgICAgICAgICAgICAgbWV0YS5mb2xkZXJfbmFtZSA9IGFwcFxuICAgICAgICAgICAgICAgICAgICBwcm9qZWN0cy5wdXNoKG1ldGEpXG4gICAgICAgICAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvbXB0ID0gbmV3IGVucXVpcmVyLlNlbGVjdCh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdib2lsZXJwbGF0ZScsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdTZWxlY3QgYSBib2lsZXJwbGF0ZScsXG4gICAgICAgICAgICAgICAgICAgIGNob2ljZXM6IHByb2plY3RzLm1hcCgocCwgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgJHtjaGFsay5ib2xkLmJsdWUocC5uYW1lKX0gJHtwLmRlc2NyaXB0aW9ufWAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGAke2l9YFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcHJvbXB0LnJ1bigpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGFuc3dlciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IHByb2plY3RzW3BhcnNlSW50KGFuc3dlcildXG4gICAgICAgICAgICAgICAgICAgICAgICBiYXNpY01ESGlnaGxpZ2h0KGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4ocC5mdWxscGF0aCwgJ1JFQURNRS5tZCcpKS50b1N0cmluZygpKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuYm9sZChgPj4gUHJvamVjdCBjb3BpZWQgaW5zaWRlIGZvbGRlciAuLyR7cC5mb2xkZXJfbmFtZX0vXFxuYCkpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3B5RGlyU3luYyhwLmZ1bGxwYXRoLCBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgcC5mb2xkZXJfbmFtZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFydChwYXRoLmpvaW4ocC5mdWxscGF0aCwgJ2Vjb3N5c3RlbS5jb25maWcuanMnKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN3ZDogcC5mdWxscGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB0aGlzLnNwZWVkTGlzdChjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB0aGlzLnNwZWVkTGlzdChjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVzY3JpcHRpb25cbiAgICAgKiBAbWV0aG9kIHNlbmRMaW5lVG9TdGRpblxuICAgICAqL1xuICAgIENMSS5wcm90b3R5cGUuc2VuZExpbmVUb1N0ZGluID0gZnVuY3Rpb24gKHBtX2lkLCBsaW5lLCBzZXBhcmF0b3IsIGNiKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICBpZiAoIWNiICYmIHR5cGVvZiAoc2VwYXJhdG9yKSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYiA9IHNlcGFyYXRvcjtcbiAgICAgICAgICAgIHNlcGFyYXRvciA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGFja2V0ID0ge1xuICAgICAgICAgICAgcG1faWQ6IHBtX2lkLFxuICAgICAgICAgICAgbGluZTogbGluZSArIChzZXBhcmF0b3IgfHwgJ1xcbicpXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnc2VuZExpbmVUb1N0ZGluJywgcGFja2V0LCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyBlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgcmVzKSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXNjcmlwdGlvblxuICAgICAqIEBtZXRob2QgYXR0YWNoVG9Qcm9jZXNzXG4gICAgICovXG4gICAgQ0xJLnByb3RvdHlwZS5hdHRhY2ggPSBmdW5jdGlvbiAocG1faWQsIHNlcGFyYXRvciwgY2IpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgcmVhZGxpbmUgPSByZXF1aXJlKCdyZWFkbGluZScpO1xuXG4gICAgICAgIGlmIChpc05hTihwbV9pZCkpIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKCdwbV9pZCBtdXN0IGJlIGEgcHJvY2VzcyBudW1iZXIgKG5vdCBhIHByb2Nlc3MgbmFtZSknKTtcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoJ3BtX2lkIG11c3QgYmUgbnVtYmVyJykpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKHNlcGFyYXRvcikgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2IgPSBzZXBhcmF0b3I7XG4gICAgICAgICAgICBzZXBhcmF0b3IgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJsID0gcmVhZGxpbmUuY3JlYXRlSW50ZXJmYWNlKHtcbiAgICAgICAgICAgIGlucHV0OiBwcm9jZXNzLnN0ZGluLFxuICAgICAgICAgICAgb3V0cHV0OiBwcm9jZXNzLnN0ZG91dFxuICAgICAgICB9KTtcblxuICAgICAgICBybC5vbignY2xvc2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYigpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGF0LkNsaWVudC5sYXVuY2hCdXMoZnVuY3Rpb24gKGVyciwgYnVzLCBzb2NrZXQpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBidXMub24oJ2xvZzoqJywgZnVuY3Rpb24gKHR5cGUsIHBhY2tldCkge1xuICAgICAgICAgICAgICAgIGlmIChwYWNrZXQucHJvY2Vzcy5wbV9pZCAhPT0gcGFyc2VJbnQocG1faWQpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUocGFja2V0LmRhdGEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJsLm9uKCdsaW5lJywgZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgIHRoYXQuc2VuZExpbmVUb1N0ZGluKHBtX2lkLCBsaW5lLCBzZXBhcmF0b3IsIGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXNjcmlwdGlvblxuICAgICAqIEBtZXRob2Qgc2VuZERhdGFUb1Byb2Nlc3NJZFxuICAgICAqL1xuICAgIENMSS5wcm90b3R5cGUuc2VuZERhdGFUb1Byb2Nlc3NJZCA9IGZ1bmN0aW9uIChwcm9jX2lkLCBwYWNrZXQsIGNiKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICBpZiAodHlwZW9mIHByb2NfaWQgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwYWNrZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIC8vIHRoZSBwcm9jX2lkIGlzIHBhY2tldC5cbiAgICAgICAgICAgIGNiID0gcGFja2V0O1xuICAgICAgICAgICAgcGFja2V0ID0gcHJvY19pZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhY2tldC5pZCA9IHByb2NfaWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdzZW5kRGF0YVRvUHJvY2Vzc0lkJywgcGFja2V0LCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KCdzdWNjZXNzZnVsbHkgc2VudCBkYXRhIHRvIHByb2Nlc3MnKTtcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJlcykgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVXNlZCBmb3IgY3VzdG9tIGFjdGlvbnMsIGFsbG93cyB0byB0cmlnZ2VyIGZ1bmN0aW9uIGluc2lkZSBhbiBhcHBcbiAgICAgKiBUbyBleHBvc2UgYSBmdW5jdGlvbiB5b3UgbmVlZCB0byB1c2Uga2V5bWV0cmljcy9wbXhcbiAgICAgKlxuICAgICAqIEBtZXRob2QgbXNnUHJvY2Vzc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlkICAgICAgICAgICBwcm9jZXNzIGlkXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGFjdGlvbl9uYW1lICBmdW5jdGlvbiBuYW1lIHRvIHRyaWdnZXJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdHMub3B0c10gIG9iamVjdCBwYXNzZWQgYXMgZmlyc3QgYXJnIG9mIHRoZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbdXVpZF0gICAgICAgb3B0aW9uYWwgdW5pcXVlIGlkZW50aWZpZXIgd2hlbiBsb2dzIGFyZSBlbWl0dGVkXG4gICAgICpcbiAgICAgKi9cbiAgICBDTEkucHJvdG90eXBlLm1zZ1Byb2Nlc3MgPSBmdW5jdGlvbiAob3B0cywgY2IpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ21zZ1Byb2Nlc3MnLCBvcHRzLCBjYik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRyaWdnZXIgYSBQTVggY3VzdG9tIGFjdGlvbiBpbiB0YXJnZXQgYXBwbGljYXRpb25cbiAgICAgKiBDdXN0b20gYWN0aW9ucyBhbGxvd3MgdG8gaW50ZXJhY3Qgd2l0aCBhbiBhcHBsaWNhdGlvblxuICAgICAqXG4gICAgICogQG1ldGhvZCB0cmlnZ2VyXG4gICAgICogQHBhcmFtICB7U3RyaW5nfE51bWJlcn0gcG1faWQgICAgICAgcHJvY2VzcyBpZCBvciBhcHBsaWNhdGlvbiBuYW1lXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSAgICAgICAgYWN0aW9uX25hbWUgbmFtZSBvZiB0aGUgY3VzdG9tIGFjdGlvbiB0byB0cmlnZ2VyXG4gICAgICogQHBhcmFtICB7TWl4ZWR9ICAgICAgICAgcGFyYW1zICAgICAgcGFyYW1ldGVyIHRvIHBhc3MgdG8gdGFyZ2V0IGFjdGlvblxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSAgICAgIGNiICAgICAgICAgIGNhbGxiYWNrXG4gICAgICovXG4gICAgQ0xJLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gKHBtX2lkLCBhY3Rpb25fbmFtZSwgcGFyYW1zLCBjYikge1xuICAgICAgICBpZiAodHlwZW9mIChwYXJhbXMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYiA9IHBhcmFtcztcbiAgICAgICAgICAgIHBhcmFtcyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNtZDogYW55ID0ge1xuICAgICAgICAgICAgbXNnOiBhY3Rpb25fbmFtZVxuICAgICAgICB9O1xuICAgICAgICB2YXIgY291bnRlciA9IDA7XG4gICAgICAgIHZhciBwcm9jZXNzX3dhaXRfY291bnQgPSAwO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHZhciByZXN1bHRzID0gW107XG5cbiAgICAgICAgaWYgKHBhcmFtcykge1xuICAgICAgICAgICAgY21kLm9wdHMgPSBwYXJhbXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNOYU4ocG1faWQpKSB7XG4gICAgICAgICAgICBjbWQubmFtZSA9IHBtX2lkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY21kLmlkID0gcG1faWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxhdW5jaEJ1cygoZXJyLCBidXMpID0+IHtcbiAgICAgICAgICAgIGJ1cy5vbignYXhtOnJlcGx5JywgZnVuY3Rpb24gKHJldCkge1xuICAgICAgICAgICAgICAgIGlmIChyZXQucHJvY2Vzcy5uYW1lID09IHBtX2lkIHx8IHJldC5wcm9jZXNzLnBtX2lkID09IHBtX2lkIHx8IHJldC5wcm9jZXNzLm5hbWVzcGFjZSA9PSBwbV9pZCB8fCBwbV9pZCA9PSAnYWxsJykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmV0KTtcbiAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KCdbJXM6JXM6JXNdPSVqJywgcmV0LnByb2Nlc3MubmFtZSwgcmV0LnByb2Nlc3MucG1faWQsIHJldC5wcm9jZXNzLm5hbWVzcGFjZSwgcmV0LmRhdGEucmV0dXJuKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCsrY291bnRlciA9PSBwcm9jZXNzX3dhaXRfY291bnQpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCByZXN1bHRzKSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhhdC5tc2dQcm9jZXNzKGNtZCwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEucHJvY2Vzc19jb3VudCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKCdOb3QgYW55IHByb2Nlc3MgaGFzIHJlY2VpdmVkIGEgY29tbWFuZCAob2ZmbGluZSBvciB1bmV4aXN0ZW50KScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKCdVbmtub3duIHByb2Nlc3MnKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHByb2Nlc3Nfd2FpdF9jb3VudCA9IGRhdGEucHJvY2Vzc19jb3VudDtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoY2hhbGsuYm9sZCgnJXMgcHJvY2Vzc2VzIGhhdmUgcmVjZWl2ZWQgY29tbWFuZCAlcycpLFxuICAgICAgICAgICAgICAgICAgICBkYXRhLnByb2Nlc3NfY291bnQsIGFjdGlvbl9uYW1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGVzY3JpcHRpb25cbiAgICAgKiBAbWV0aG9kIHNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lXG4gICAgICogQHBhcmFtIHt9IHNpZ25hbFxuICAgICAqIEBwYXJhbSB7fSBwcm9jZXNzX25hbWVcbiAgICAgKiBAcmV0dXJuXG4gICAgICovXG4gICAgQ0xJLnByb3RvdHlwZS5zZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZSA9IGZ1bmN0aW9uIChzaWduYWwsIHByb2Nlc3NfbmFtZSwgY2IpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ3NlbmRTaWduYWxUb1Byb2Nlc3NOYW1lJywge1xuICAgICAgICAgICAgc2lnbmFsOiBzaWduYWwsXG4gICAgICAgICAgICBwcm9jZXNzX25hbWU6IHByb2Nlc3NfbmFtZVxuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dCgnc3VjY2Vzc2Z1bGx5IHNlbnQgc2lnbmFsICVzIHRvIHByb2Nlc3MgbmFtZSAlcycsIHNpZ25hbCwgcHJvY2Vzc19uYW1lKTtcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGxpc3QpIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERlc2NyaXB0aW9uXG4gICAgICogQG1ldGhvZCBzZW5kU2lnbmFsVG9Qcm9jZXNzSWRcbiAgICAgKiBAcGFyYW0ge30gc2lnbmFsXG4gICAgICogQHBhcmFtIHt9IHByb2Nlc3NfaWRcbiAgICAgKiBAcmV0dXJuXG4gICAgICovXG4gICAgQ0xJLnByb3RvdHlwZS5zZW5kU2lnbmFsVG9Qcm9jZXNzSWQgPSBmdW5jdGlvbiAoc2lnbmFsLCBwcm9jZXNzX2lkLCBjYikge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnc2VuZFNpZ25hbFRvUHJvY2Vzc0lkJywge1xuICAgICAgICAgICAgc2lnbmFsOiBzaWduYWwsXG4gICAgICAgICAgICBwcm9jZXNzX2lkOiBwcm9jZXNzX2lkXG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KCdzdWNjZXNzZnVsbHkgc2VudCBzaWduYWwgJXMgdG8gcHJvY2VzcyBpZCAlcycsIHNpZ25hbCwgcHJvY2Vzc19pZCk7XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBsaXN0KSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBUEkgbWV0aG9kIHRvIGxhdW5jaCBhIHByb2Nlc3MgdGhhdCB3aWxsIHNlcnZlIGRpcmVjdG9yeSBvdmVyIGh0dHBcbiAgICAgKi9cbiAgICBDTEkucHJvdG90eXBlLmF1dG9pbnN0YWxsID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgIHZhciBmaWxlcGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUobW9kdWxlLmZpbGVuYW1lKSwgJy4uL1N5c2luZm8vU2VydmljZURldGVjdGlvbi9TZXJ2aWNlRGV0ZWN0aW9uLmpzJyk7XG5cbiAgICAgICAgdGhpcy5zdGFydChmaWxlcGF0aCwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgJ0Vycm9yIHdoaWxlIHRyeWluZyB0byBzZXJ2ZSA6ICcgKyBlcnIubWVzc2FnZSB8fCBlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVycikgOiB0aGlzLnNwZWVkTGlzdChjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsKSA6IHRoaXMuc3BlZWRMaXN0KCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFQSSBtZXRob2QgdG8gbGF1bmNoIGEgcHJvY2VzcyB0aGF0IHdpbGwgc2VydmUgZGlyZWN0b3J5IG92ZXIgaHR0cFxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnBhdGggcGF0aCB0byBiZSBzZXJ2ZWRcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gb3B0cy5wb3J0IHBvcnQgb24gd2hpY2ggaHR0cCB3aWxsIGJpbmRcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdHMuc3BhIHNpbmdsZSBwYWdlIGFwcCBzZXJ2ZWRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5iYXNpY0F1dGhVc2VybmFtZSBiYXNpYyBhdXRoIHVzZXJuYW1lXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuYmFzaWNBdXRoUGFzc3dvcmQgYmFzaWMgYXV0aCBwYXNzd29yZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb21tYW5kZXIgY29tbWFuZGVyIG9iamVjdFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIG9wdGlvbmFsIGNhbGxiYWNrXG4gICAgICovXG4gICAgQ0xJLnByb3RvdHlwZS5zZXJ2ZSA9IGZ1bmN0aW9uICh0YXJnZXRfcGF0aCwgcG9ydCwgb3B0cywgY29tbWFuZGVyLCBjYikge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHZhciBzZXJ2ZVBvcnQgPSBwcm9jZXNzLmVudi5QTTJfU0VSVkVfUE9SVCB8fCBwb3J0IHx8IDgwODA7XG4gICAgICAgIHZhciBzZXJ2ZVBhdGggPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5lbnYuUE0yX1NFUlZFX1BBVEggfHwgdGFyZ2V0X3BhdGggfHwgJy4nKTtcblxuICAgICAgICB2YXIgZmlsZXBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKG1vZHVsZS5maWxlbmFtZSksICcuL1NlcnZlLmpzJyk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjb21tYW5kZXIubmFtZSA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICBvcHRzLm5hbWUgPSBjb21tYW5kZXIubmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBvcHRzLm5hbWUgPSAnc3RhdGljLXBhZ2Utc2VydmVyLScgKyBzZXJ2ZVBvcnRcbiAgICAgICAgaWYgKCFvcHRzLmVudilcbiAgICAgICAgICAgIG9wdHMuZW52ID0ge307XG4gICAgICAgIG9wdHMuZW52LlBNMl9TRVJWRV9QT1JUID0gc2VydmVQb3J0O1xuICAgICAgICBvcHRzLmVudi5QTTJfU0VSVkVfUEFUSCA9IHNlcnZlUGF0aDtcbiAgICAgICAgb3B0cy5lbnYuUE0yX1NFUlZFX1NQQSA9IG9wdHMuc3BhO1xuICAgICAgICBpZiAob3B0cy5iYXNpY0F1dGhVc2VybmFtZSAmJiBvcHRzLmJhc2ljQXV0aFBhc3N3b3JkKSB7XG4gICAgICAgICAgICBvcHRzLmVudi5QTTJfU0VSVkVfQkFTSUNfQVVUSCA9ICd0cnVlJztcbiAgICAgICAgICAgIG9wdHMuZW52LlBNMl9TRVJWRV9CQVNJQ19BVVRIX1VTRVJOQU1FID0gb3B0cy5iYXNpY0F1dGhVc2VybmFtZTtcbiAgICAgICAgICAgIG9wdHMuZW52LlBNMl9TRVJWRV9CQVNJQ19BVVRIX1BBU1NXT1JEID0gb3B0cy5iYXNpY0F1dGhQYXNzd29yZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0cy5tb25pdG9yKSB7XG4gICAgICAgICAgICBvcHRzLmVudi5QTTJfU0VSVkVfTU9OSVRPUiA9IG9wdHMubW9uaXRvclxuICAgICAgICB9XG4gICAgICAgIG9wdHMuY3dkID0gc2VydmVQYXRoO1xuXG4gICAgICAgIHRoaXMuc3RhcnQoZmlsZXBhdGgsIG9wdHMsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArICdFcnJvciB3aGlsZSB0cnlpbmcgdG8gc2VydmUgOiAnICsgZXJyLm1lc3NhZ2UgfHwgZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIpIDogdGhhdC5zcGVlZExpc3QoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1NlcnZpbmcgJyArIHNlcnZlUGF0aCArICcgb24gcG9ydCAnICsgc2VydmVQb3J0KTtcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJlcykgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQaW5nIGRhZW1vbiAtIGlmIFBNMiBkYWVtb24gbm90IGxhdW5jaGVkLCBpdCB3aWxsIGxhdW5jaCBpdFxuICAgICAqIEBtZXRob2QgcGluZ1xuICAgICAqL1xuICAgIENMSS5wcm90b3R5cGUucGluZyA9IGZ1bmN0aW9uIChjYikge1xuICAgICAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdwaW5nJywge30sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKGVycikpIDogdGhpcy5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChyZXMpO1xuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgcmVzKSA6IHRoaXMuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSByZW1vdGUgY29tbWFuZFxuICAgICAqL1xuICAgIENMSS5wcm90b3R5cGUucmVtb3RlID0gZnVuY3Rpb24gKGNvbW1hbmQsIG9wdHMsIGNiKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICB0aGF0W2NvbW1hbmRdKG9wdHMubmFtZSwgZnVuY3Rpb24gKGVycl9jbWQsIHJldCkge1xuICAgICAgICAgICAgaWYgKGVycl9jbWQpXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJfY21kKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDb21tYW5kICVzIGZpbmlzaGVkJywgY29tbWFuZCk7XG4gICAgICAgICAgICByZXR1cm4gY2IoZXJyX2NtZCwgcmV0KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgcmVtb3RlIG1ldGhvZCBhbGxvd3MgdG8gcGFzcyBtdWx0aXBsZSBhcmd1bWVudHNcbiAgICAgKiB0byBQTTJcbiAgICAgKiBJdCBpcyB1c2VkIGZvciB0aGUgbmV3IHNjb3BlZCBQTTIgYWN0aW9uIHN5c3RlbVxuICAgICAqL1xuICAgIENMSS5wcm90b3R5cGUucmVtb3RlVjIgPSBmdW5jdGlvbiAoY29tbWFuZCwgb3B0cywgY2IpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgIGlmICh0aGF0W2NvbW1hbmRdLmxlbmd0aCA9PSAxKVxuICAgICAgICAgICAgcmV0dXJuIHRoYXRbY29tbWFuZF0oY2IpO1xuXG4gICAgICAgIG9wdHMuYXJncy5wdXNoKGNiKTtcbiAgICAgICAgcmV0dXJuIHRoYXRbY29tbWFuZF0uYXBwbHkodGhpcywgb3B0cy5hcmdzKTtcbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgKiBEZXNjcmlwdGlvblxuICAgICAqIEBtZXRob2QgZ2VuZXJhdGVTYW1wbGVcbiAgICAgKiBAcGFyYW0ge30gbmFtZVxuICAgICAqIEByZXR1cm5cbiAgICAgKi9cbiAgICBDTEkucHJvdG90eXBlLmdlbmVyYXRlU2FtcGxlID0gZnVuY3Rpb24gKG1vZGUpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgdGVtcGxhdGVQYXRoO1xuXG4gICAgICAgIGlmIChtb2RlID09ICdzaW1wbGUnKVxuICAgICAgICAgICAgdGVtcGxhdGVQYXRoID0gcGF0aC5qb2luKGNzdC5URU1QTEFURV9GT0xERVIsIGNzdC5BUFBfQ09ORl9UUExfU0lNUExFKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGVtcGxhdGVQYXRoID0gcGF0aC5qb2luKGNzdC5URU1QTEFURV9GT0xERVIsIGNzdC5BUFBfQ09ORl9UUEwpO1xuXG4gICAgICAgIHZhciBzYW1wbGUgPSBmcy5yZWFkRmlsZVN5bmModGVtcGxhdGVQYXRoKTtcbiAgICAgICAgdmFyIGR0ID0gc2FtcGxlLnRvU3RyaW5nKCk7XG4gICAgICAgIHZhciBmX25hbWUgPSAnZWNvc3lzdGVtLmNvbmZpZy5qcyc7XG4gICAgICAgIHZhciBwd2QgPSBwcm9jZXNzLmVudi5QV0QgfHwgcHJvY2Vzcy5jd2QoKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ocHdkLCBmX25hbWUpLCBkdCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIENvbW1vbi5wcmludE91dCgnRmlsZSAlcyBnZW5lcmF0ZWQnLCBwYXRoLmpvaW4ocHdkLCBmX25hbWUpKTtcbiAgICAgICAgdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXNjcmlwdGlvblxuICAgICAqIEBtZXRob2QgZGFzaGJvYXJkXG4gICAgICogQHJldHVyblxuICAgICAqL1xuICAgIENMSS5wcm90b3R5cGUuZGFzaGJvYXJkID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICBpZiAoY2IpXG4gICAgICAgICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdEYXNoYm9hcmQgY2FudCBiZSBjYWxsZWQgcHJvZ3JhbW1hdGljYWxseScpKTtcblxuICAgICAgICBEYXNoYm9hcmQuaW5pdCgpO1xuXG4gICAgICAgIHRoaXMuQ2xpZW50LmxhdW5jaEJ1cyhmdW5jdGlvbiAoZXJyLCBidXMpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsYXVuY2hCdXM6ICcgKyBlcnIpO1xuICAgICAgICAgICAgICAgIHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBidXMub24oJ2xvZzoqJywgZnVuY3Rpb24gKHR5cGUsIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBEYXNoYm9hcmQubG9nKHR5cGUsIGRhdGEpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICBwcm9jZXNzLm9uKCdTSUdJTlQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLkNsaWVudC5kaXNjb25uZWN0QnVzKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnVuY3Rpb24gcmVmcmVzaERhc2hib2FyZCgpIHtcbiAgICAgICAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBEYXNoYm9hcmQucmVmcmVzaChsaXN0KTtcblxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZWZyZXNoRGFzaGJvYXJkKCk7XG4gICAgICAgICAgICAgICAgfSwgODAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVmcmVzaERhc2hib2FyZCgpO1xuICAgIH07XG5cbiAgICBDTEkucHJvdG90eXBlLm1vbml0ID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICBpZiAoY2IpIHJldHVybiBjYihuZXcgRXJyb3IoJ01vbml0IGNhbnQgYmUgY2FsbGVkIHByb2dyYW1tYXRpY2FsbHknKSk7XG5cbiAgICAgICAgTW9uaXQuaW5pdCgpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGxhdW5jaE1vbml0b3IoKSB7XG4gICAgICAgICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgTW9uaXQucmVmcmVzaChsaXN0KTtcblxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBsYXVuY2hNb25pdG9yKCk7XG4gICAgICAgICAgICAgICAgfSwgNDAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGF1bmNoTW9uaXRvcigpO1xuICAgIH07XG5cbiAgICBDTEkucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiAoYXBwX25hbWUsIGNiKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgICAgICBpZiAoc2VtdmVyLnNhdGlzZmllcyhwcm9jZXNzLnZlcnNpb25zLm5vZGUsICc+PSA4LjAuMCcpKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoYXBwX25hbWUsICdpbnRlcm5hbDppbnNwZWN0JywgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzICYmIHJlc1swXSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzWzBdLmRhdGEucmV0dXJuID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGBJbnNwZWN0IGRpc2FibGVkIG9uICR7YXBwX25hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoYEluc3BlY3QgZW5hYmxlZCBvbiAke2FwcF9uYW1lfSA9PiBnbyB0byBjaHJvbWUgOiBjaHJvbWU6Ly9pbnNwZWN0ICEhIWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGBVbmFibGUgdG8gYWN0aXZhdGUgaW5zcGVjdCBtb2RlIG9uICR7YXBwX25hbWV9ICEhIWApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KCdJbnNwZWN0IGlzIGF2YWlsYWJsZSBmb3Igbm9kZSB2ZXJzaW9uID49OC54ICEnKTtcbiAgICAgICAgICAgIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuIl19