"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

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

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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
    var that = this;

    if (typeof app_name === 'function') {
      cb = app_name;
      app_name = null;
    }

    this.Client.executeRemote('getMonitorData', {}, function (err, list) {
      if (err) {
        _Common["default"].printError(_constants["default"].PREFIX_MSG_ERR + err);

        return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      var pids = [];
      list.forEach(function (app) {
        if (!app_name || app_name == app.name) pids.push(app.pid);
      });

      if (!cb) {
        _Common["default"].printOut(pids.join("\n"));

        return that.exitCli(_constants["default"].SUCCESS_EXIT);
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
    var that = this;

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
    that.Client.executeRemote(cmd.action, {
      pwd: file,
      timeout: time
    }, function (err) {
      if (err) {
        console.error(err);
        return that.exitCli(1);
      }

      console.log("Profile done in ".concat(file));
      return cb ? cb.apply(null, arguments) : that.exitCli(_constants["default"].SUCCESS_EXIT);
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
    var _arguments2 = arguments,
        _this2 = this;

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

          _this2.start(_path["default"].join(p.fullpath, 'ecosystem.config.js'), {
            cwd: p.fullpath
          }, function () {
            return cb ? cb.apply(null, _arguments2) : _this2.speedList(_constants["default"].SUCCESS_EXIT);
          });
        })["catch"](function (e) {
          return cb ? cb.apply(null, _arguments2) : _this2.speedList(_constants["default"].SUCCESS_EXIT);
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

    if (_typeof(proc_id) === 'object' && typeof packet === 'function') {
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
    if (params) cmd.opts = params;
    if (isNaN(pm_id)) cmd.name = pm_id;else cmd.id = pm_id;
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
    var _this3 = this;

    var filepath = _path["default"].resolve(_path["default"].dirname(module.filename), '../Sysinfo/ServiceDetection/ServiceDetection.js');

    this.start(filepath, function (err, res) {
      if (err) {
        _Common["default"].printError(_constants["default"].PREFIX_MSG_ERR + 'Error while trying to serve : ' + err.message || err);

        return cb ? cb(err) : _this3.speedList(_constants["default"].ERROR_EXIT);
      }

      return cb ? cb(null) : _this3.speedList();
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
    var that = this;
    that.Client.executeRemote('ping', {}, function (err, res) {
      if (err) {
        _Common["default"].printError(err);

        return cb ? cb(new Error(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      _Common["default"].printOut(res);

      return cb ? cb(null, res) : that.exitCli(_constants["default"].SUCCESS_EXIT);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvRXh0cmEudHMiXSwibmFtZXMiOlsiQ0xJIiwicHJvdG90eXBlIiwiZ2V0VmVyc2lvbiIsImNiIiwidGhhdCIsIkNsaWVudCIsImV4ZWN1dGVSZW1vdGUiLCJlcnIiLCJhcHBseSIsImFyZ3VtZW50cyIsImV4aXRDbGkiLCJjc3QiLCJTVUNDRVNTX0VYSVQiLCJsYXVuY2hTeXNNb25pdG9yaW5nIiwic2V0IiwiQ29tbW9uIiwibG9nIiwiZW52IiwiYXBwX2lkIiwicHJvY3MiLCJwcmludGVkIiwibGlzdCIsImZvckVhY2giLCJsIiwicG1faWQiLCJzYWZlRXh0ZW5kIiwicG0yX2VudiIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJjb25zb2xlIiwiY2hhbGsiLCJncmVlbiIsIkVSUk9SX0VYSVQiLCJyZXBvcnQiLCJmbXQiLCJ0aXRsZSIsImZpZWxkIiwiRGF0ZSIsInNlcCIsImJvbGQiLCJibHVlIiwicG0yX3ZlcnNpb24iLCJub2RlX3ZlcnNpb24iLCJub2RlX3BhdGgiLCJhcmd2IiwiYXJndjAiLCJ1c2VyIiwidWlkIiwiZ2lkIiwiZGlmZiIsInN0YXJ0ZWRfYXQiLCJwa2ciLCJ2ZXJzaW9uIiwicHJvY2VzcyIsInZlcnNpb25zIiwibm9kZSIsIlVTRVIiLCJMTkFNRSIsIlVTRVJOQU1FIiwiSVNfV0lORE9XUyIsImdldGV1aWQiLCJnZXRlZ2lkIiwib3MiLCJyZXF1aXJlIiwiYXJjaCIsInBsYXRmb3JtIiwidHlwZSIsImNwdXMiLCJtb2RlbCIsImxlbmd0aCIsImZyZWVtZW0iLCJ0b3RhbG1lbSIsImhvbWVkaXIiLCJVWCIsImdsX2ludGVyYWN0X2luZm9zIiwiTG9nIiwidGFpbCIsInBhdGgiLCJQTTJfTE9HX0ZJTEVfUEFUSCIsImFwcF9uYW1lIiwiZ2V0UElEIiwicHJpbnRFcnJvciIsIlBSRUZJWF9NU0dfRVJSIiwicmV0RXJyIiwicGlkcyIsImFwcCIsIm5hbWUiLCJwdXNoIiwicGlkIiwicHJpbnRPdXQiLCJqb2luIiwicHJvZmlsZSIsInRpbWUiLCJkYXlqcyIsImNtZCIsImV4dCIsImFjdGlvbiIsImZpbGUiLCJjd2QiLCJmb3JtYXQiLCJwd2QiLCJ0aW1lb3V0IiwiZXJyb3IiLCJiYXNpY01ESGlnaGxpZ2h0IiwibGluZXMiLCJzcGxpdCIsImlzSW5uZXIiLCJzdGFydHNXaXRoIiwiZ3JleSIsImJvaWxlcnBsYXRlIiwiaSIsInByb2plY3RzIiwiZW5xdWlyZXIiLCJmcyIsInJlYWRkaXIiLCJfX2Rpcm5hbWUiLCJpdGVtcyIsIm5leHQiLCJmcCIsInJlYWRGaWxlIiwiZHQiLCJtZXRhIiwiSlNPTiIsInBhcnNlIiwiZnVsbHBhdGgiLCJmb2xkZXJfbmFtZSIsInByb21wdCIsIlNlbGVjdCIsIm1lc3NhZ2UiLCJjaG9pY2VzIiwibWFwIiwicCIsImRlc2NyaXB0aW9uIiwidmFsdWUiLCJydW4iLCJ0aGVuIiwiYW5zd2VyIiwicGFyc2VJbnQiLCJyZWFkRmlsZVN5bmMiLCJ0b1N0cmluZyIsInN0YXJ0Iiwic3BlZWRMaXN0IiwiZSIsInNlbmRMaW5lVG9TdGRpbiIsImxpbmUiLCJzZXBhcmF0b3IiLCJwYWNrZXQiLCJyZXMiLCJhdHRhY2giLCJyZWFkbGluZSIsImlzTmFOIiwicmwiLCJjcmVhdGVJbnRlcmZhY2UiLCJpbnB1dCIsInN0ZGluIiwib3V0cHV0Iiwic3Rkb3V0Iiwib24iLCJsYXVuY2hCdXMiLCJidXMiLCJzb2NrZXQiLCJ3cml0ZSIsImRhdGEiLCJzZW5kRGF0YVRvUHJvY2Vzc0lkIiwicHJvY19pZCIsImlkIiwibXNnUHJvY2VzcyIsIm9wdHMiLCJ0cmlnZ2VyIiwiYWN0aW9uX25hbWUiLCJwYXJhbXMiLCJtc2ciLCJjb3VudGVyIiwicHJvY2Vzc193YWl0X2NvdW50IiwicmVzdWx0cyIsInJldCIsIm5hbWVzcGFjZSIsInByb2Nlc3NfY291bnQiLCJzZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZSIsInNpZ25hbCIsInByb2Nlc3NfbmFtZSIsInNlbmRTaWduYWxUb1Byb2Nlc3NJZCIsInByb2Nlc3NfaWQiLCJhdXRvaW5zdGFsbCIsImZpbGVwYXRoIiwicmVzb2x2ZSIsImRpcm5hbWUiLCJtb2R1bGUiLCJmaWxlbmFtZSIsInNlcnZlIiwidGFyZ2V0X3BhdGgiLCJwb3J0IiwiY29tbWFuZGVyIiwic2VydmVQb3J0IiwiUE0yX1NFUlZFX1BPUlQiLCJzZXJ2ZVBhdGgiLCJQTTJfU0VSVkVfUEFUSCIsIlBNMl9TRVJWRV9TUEEiLCJzcGEiLCJiYXNpY0F1dGhVc2VybmFtZSIsImJhc2ljQXV0aFBhc3N3b3JkIiwiUE0yX1NFUlZFX0JBU0lDX0FVVEgiLCJQTTJfU0VSVkVfQkFTSUNfQVVUSF9VU0VSTkFNRSIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIX1BBU1NXT1JEIiwibW9uaXRvciIsIlBNMl9TRVJWRV9NT05JVE9SIiwiUFJFRklYX01TRyIsInBpbmciLCJFcnJvciIsInJlbW90ZSIsImNvbW1hbmQiLCJlcnJfY21kIiwicmVtb3RlVjIiLCJhcmdzIiwiZ2VuZXJhdGVTYW1wbGUiLCJtb2RlIiwidGVtcGxhdGVQYXRoIiwiVEVNUExBVEVfRk9MREVSIiwiQVBQX0NPTkZfVFBMX1NJTVBMRSIsIkFQUF9DT05GX1RQTCIsInNhbXBsZSIsImZfbmFtZSIsIlBXRCIsIndyaXRlRmlsZVN5bmMiLCJzdGFjayIsImRhc2hib2FyZCIsIkRhc2hib2FyZCIsImluaXQiLCJkaXNjb25uZWN0QnVzIiwiZXhpdCIsInJlZnJlc2hEYXNoYm9hcmQiLCJyZWZyZXNoIiwic2V0VGltZW91dCIsIm1vbml0IiwiTW9uaXQiLCJsYXVuY2hNb25pdG9yIiwiaW5zcGVjdCIsInNlbXZlciIsInNhdGlzZmllcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQU1BOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7Ozs7O0FBRWUsa0JBQVVBLEdBQVYsRUFBZTtBQUM1Qjs7Ozs7QUFLQUEsRUFBQUEsR0FBRyxDQUFDQyxTQUFKLENBQWNDLFVB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SUFBSSxDQUFDTSxPQUFMLENBQWFDLHNCQUFJQyxZQUFqQjtBQUNEO0FBQ0YsR0FyQkQ7QUFzQkQ7O0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKlxuICogRXh0cmEgbWV0aG9kc1xuICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi9jb25zdGFudHMnO1xuaW1wb3J0IENvbW1vbiBmcm9tICcuLi9Db21tb24nO1xuaW1wb3J0IFVYIGZyb20gJy4vVVgnO1xuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIGZtdCBmcm9tICcuLi90b29scy9mbXQnO1xuaW1wb3J0IGRheWpzIGZyb20gJ2RheWpzJztcbmltcG9ydCBwa2cgZnJvbSAnLi4vLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCBjb3B5RGlyU3luYyBmcm9tICcuLi90b29scy9jb3B5ZGlyU3luYydcbmltcG9ydCBMb2cgZnJvbSAnLi9Mb2cnO1xuaW1wb3J0IERhc2hib2FyZCBmcm9tICcuL0Rhc2hib2FyZCc7XG5pbXBvcnQgTW9uaXQgZnJvbSAnLi9Nb25pdCc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChDTEkpIHtcbiAgLyoqXG4gICAqIEdldCB2ZXJzaW9uIG9mIHRoZSBkYWVtb25pemVkIFBNMlxuICAgKiBAbWV0aG9kIGdldFZlcnNpb25cbiAgICogQGNhbGxiYWNrIGNiXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmdldFZlcnNpb24gPSBmdW5jdGlvbiAoY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRWZXJzaW9uJywge30sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHJldHVybiBjYiA/IGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldCB2ZXJzaW9uIG9mIHRoZSBkYWVtb25pemVkIFBNMlxuICAgKiBAbWV0aG9kIGdldFZlcnNpb25cbiAgICogQGNhbGxiYWNrIGNiXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmxhdW5jaFN5c01vbml0b3JpbmcgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0aGlzLnNldCgncG0yOnN5c21vbml0JywgJ3RydWUnLCAoKSA9PiB7XG4gICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdsYXVuY2hTeXNNb25pdG9yaW5nJywge30sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKGVycilcbiAgICAgICAgICBDb21tb24uZXJyKGVycilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIENvbW1vbi5sb2coJ1N5c3RlbSBNb25pdG9yaW5nIGxhdW5jaGVkJylcbiAgICAgICAgcmV0dXJuIGNiID8gY2IuYXBwbHkobnVsbCwgYXJndW1lbnRzKSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH0pXG4gICAgfSlcbiAgfTtcblxuICAvKipcbiAgICogU2hvdyBhcHBsaWNhdGlvbiBlbnZpcm9ubWVudFxuICAgKiBAbWV0aG9kIGVudlxuICAgKiBAY2FsbGJhY2sgY2JcbiAgICovXG4gIENMSS5wcm90b3R5cGUuZW52ID0gZnVuY3Rpb24gKGFwcF9pZCwgY2IpIHtcbiAgICB2YXIgcHJvY3MgPSBbXVxuICAgIHZhciBwcmludGVkID0gMFxuXG4gICAgdGhpcy5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgKGVyciwgbGlzdCkgPT4ge1xuICAgICAgbGlzdC5mb3JFYWNoKGwgPT4ge1xuICAgICAgICBpZiAoYXBwX2lkID09IGwucG1faWQpIHtcbiAgICAgICAgICBwcmludGVkKytcbiAgICAgICAgICB2YXIgZW52ID0gQ29tbW9uLnNhZmVFeHRlbmQoe30sIGwucG0yX2VudilcbiAgICAgICAgICBPYmplY3Qua2V5cyhlbnYpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke2tleX06ICR7Y2hhbGsuZ3JlZW4oZW52W2tleV0pfWApXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgaWYgKHByaW50ZWQgPT0gMCkge1xuICAgICAgICBDb21tb24uZXJyKGBNb2R1bGVzIHdpdGggaWQgJHthcHBfaWR9IG5vdCBmb3VuZGApXG4gICAgICAgIHJldHVybiBjYiA/IGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB0aGlzLmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNiID8gY2IuYXBwbHkobnVsbCwgYXJndW1lbnRzKSA6IHRoaXMuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICB9KVxuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQgdmVyc2lvbiBvZiB0aGUgZGFlbW9uaXplZCBQTTJcbiAgICogQG1ldGhvZCBnZXRWZXJzaW9uXG4gICAqIEBjYWxsYmFjayBjYlxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5yZXBvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0UmVwb3J0Jywge30sIGZ1bmN0aW9uIChlcnIsIHJlcG9ydCkge1xuICAgICAgY29uc29sZS5sb2coKVxuICAgICAgY29uc29sZS5sb2coKVxuICAgICAgY29uc29sZS5sb2coKVxuICAgICAgY29uc29sZS5sb2coJ2BgYCcpXG4gICAgICBmbXQudGl0bGUoJ1BNMiByZXBvcnQnKVxuICAgICAgZm10LmZpZWxkKCdEYXRlJywgbmV3IERhdGUoKSk7XG4gICAgICBmbXQuc2VwKCk7XG4gICAgICBmbXQudGl0bGUoY2hhbGsuYm9sZC5ibHVlKCdEYWVtb24nKSk7XG4gICAgICBmbXQuZmllbGQoJ3BtMmQgdmVyc2lvbicsIHJlcG9ydC5wbTJfdmVyc2lvbik7XG4gICAgICBmbXQuZmllbGQoJ25vZGUgdmVyc2lvbicsIHJlcG9ydC5ub2RlX3ZlcnNpb24pO1xuICAgICAgZm10LmZpZWxkKCdub2RlIHBhdGgnLCByZXBvcnQubm9kZV9wYXRoKTtcbiAgICAgIGZtdC5maWVsZCgnYXJndicsIHJlcG9ydC5hcmd2KTtcbiAgICAgIGZtdC5maWVsZCgnYXJndjAnLCByZXBvcnQuYXJndjApO1xuICAgICAgZm10LmZpZWxkKCd1c2VyJywgcmVwb3J0LnVzZXIpO1xuICAgICAgZm10LmZpZWxkKCd1aWQnLCByZXBvcnQudWlkKTtcbiAgICAgIGZtdC5maWVsZCgnZ2lkJywgcmVwb3J0LmdpZCk7XG4gICAgICBmbXQuZmllbGQoJ3VwdGltZScsIGRheWpzKG5ldyBEYXRlKCkpLmRpZmYocmVwb3J0LnN0YXJ0ZWRfYXQsICdtaW51dGUnKSArICdtaW4nKTtcblxuICAgICAgZm10LnNlcCgpO1xuICAgICAgZm10LnRpdGxlKGNoYWxrLmJvbGQuYmx1ZSgnQ0xJJykpO1xuICAgICAgZm10LmZpZWxkKCdsb2NhbCBwbTInLCBwa2cudmVyc2lvbik7XG4gICAgICBmbXQuZmllbGQoJ25vZGUgdmVyc2lvbicsIHByb2Nlc3MudmVyc2lvbnMubm9kZSk7XG4gICAgICBmbXQuZmllbGQoJ25vZGUgcGF0aCcsIHByb2Nlc3MuZW52WydfJ10gfHwgJ25vdCBmb3VuZCcpO1xuICAgICAgZm10LmZpZWxkKCdhcmd2JywgcHJvY2Vzcy5hcmd2KTtcbiAgICAgIGZtdC5maWVsZCgnYXJndjAnLCBwcm9jZXNzLmFyZ3YwKTtcbiAgICAgIGZtdC5maWVsZCgndXNlcicsIHByb2Nlc3MuZW52LlVTRVIgfHwgcHJvY2Vzcy5lbnYuTE5BTUUgfHwgcHJvY2Vzcy5lbnYuVVNFUk5BTUUpO1xuICAgICAgaWYgKGNzdC5JU19XSU5ET1dTID09PSBmYWxzZSAmJiBwcm9jZXNzLmdldGV1aWQpXG4gICAgICAgIGZtdC5maWVsZCgndWlkJywgcHJvY2Vzcy5nZXRldWlkKCkpO1xuICAgICAgaWYgKGNzdC5JU19XSU5ET1dTID09PSBmYWxzZSAmJiBwcm9jZXNzLmdldGVnaWQpXG4gICAgICAgIGZtdC5maWVsZCgnZ2lkJywgcHJvY2Vzcy5nZXRlZ2lkKCkpO1xuXG4gICAgICB2YXIgb3MgPSByZXF1aXJlKCdvcycpO1xuXG4gICAgICBmbXQuc2VwKCk7XG4gICAgICBmbXQudGl0bGUoY2hhbGsuYm9sZC5ibHVlKCdTeXN0ZW0gaW5mbycpKTtcbiAgICAgIGZtdC5maWVsZCgnYXJjaCcsIG9zLmFyY2goKSk7XG4gICAgICBmbXQuZmllbGQoJ3BsYXRmb3JtJywgb3MucGxhdGZvcm0oKSk7XG4gICAgICBmbXQuZmllbGQoJ3R5cGUnLCBvcy50eXBlKCkpO1xuICAgICAgZm10LmZpZWxkKCdjcHVzJywgb3MuY3B1cygpWzBdLm1vZGVsKTtcbiAgICAgIGZtdC5maWVsZCgnY3B1cyBuYicsIE9iamVjdC5rZXlzKG9zLmNwdXMoKSkubGVuZ3RoKTtcbiAgICAgIGZtdC5maWVsZCgnZnJlZW1lbScsIG9zLmZyZWVtZW0oKSk7XG4gICAgICBmbXQuZmllbGQoJ3RvdGFsbWVtJywgb3MudG90YWxtZW0oKSk7XG4gICAgICBmbXQuZmllbGQoJ2hvbWUnLCBvcy5ob21lZGlyKCkpO1xuXG4gICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG5cbiAgICAgICAgZm10LnNlcCgpO1xuICAgICAgICBmbXQudGl0bGUoY2hhbGsuYm9sZC5ibHVlKCdQTTIgbGlzdCcpKTtcbiAgICAgICAgVVgubGlzdChsaXN0LCB0aGF0LmdsX2ludGVyYWN0X2luZm9zKTtcblxuICAgICAgICBmbXQuc2VwKCk7XG4gICAgICAgIGZtdC50aXRsZShjaGFsay5ib2xkLmJsdWUoJ0RhZW1vbiBsb2dzJykpO1xuICAgICAgICBMb2cudGFpbChbe1xuICAgICAgICAgIHBhdGg6IGNzdC5QTTJfTE9HX0ZJTEVfUEFUSCxcbiAgICAgICAgICBhcHBfbmFtZTogJ1BNMicsXG4gICAgICAgICAgdHlwZTogJ1BNMidcbiAgICAgICAgfV0sIDIwLCBmYWxzZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdgYGAnKVxuICAgICAgICAgIGNvbnNvbGUubG9nKClcbiAgICAgICAgICBjb25zb2xlLmxvZygpXG5cbiAgICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ib2xkLmdyZWVuKCdQbGVhc2UgY29weS9wYXN0ZSB0aGUgYWJvdmUgcmVwb3J0IGluIHlvdXIgaXNzdWUgb24gaHR0cHM6Ly9naXRodWIuY29tL1VuaXRlY2gvcG0yL2lzc3VlcycpKTtcblxuICAgICAgICAgIGNvbnNvbGUubG9nKClcbiAgICAgICAgICBjb25zb2xlLmxvZygpXG4gICAgICAgICAgdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIENMSS5wcm90b3R5cGUuZ2V0UElEID0gZnVuY3Rpb24gKGFwcF9uYW1lLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICh0eXBlb2YgKGFwcF9uYW1lKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2IgPSBhcHBfbmFtZTtcbiAgICAgIGFwcF9uYW1lID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArIGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcGlkcyA9IFtdO1xuXG4gICAgICBsaXN0LmZvckVhY2goZnVuY3Rpb24gKGFwcCkge1xuICAgICAgICBpZiAoIWFwcF9uYW1lIHx8IGFwcF9uYW1lID09IGFwcC5uYW1lKVxuICAgICAgICAgIHBpZHMucHVzaChhcHAucGlkKTtcbiAgICAgIH0pXG5cbiAgICAgIGlmICghY2IpIHtcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KHBpZHMuam9pbihcIlxcblwiKSlcbiAgICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjYihudWxsLCBwaWRzKTtcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBQTTIgbWVtb3J5IHNuYXBzaG90XG4gICAqIEBtZXRob2QgZ2V0VmVyc2lvblxuICAgKiBAY2FsbGJhY2sgY2JcbiAgICovXG4gIENMSS5wcm90b3R5cGUucHJvZmlsZSA9IGZ1bmN0aW9uICh0eXBlLCB0aW1lLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgZGF5anMgPSByZXF1aXJlKCdkYXlqcycpO1xuICAgIHZhciBjbWRcblxuICAgIGlmICh0eXBlID09ICdjcHUnKSB7XG4gICAgICBjbWQgPSB7XG4gICAgICAgIGV4dDogJy5jcHVwcm9maWxlJyxcbiAgICAgICAgYWN0aW9uOiAncHJvZmlsZUNQVSdcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGUgPT0gJ21lbScpIHtcbiAgICAgIGNtZCA9IHtcbiAgICAgICAgZXh0OiAnLmhlYXBwcm9maWxlJyxcbiAgICAgICAgYWN0aW9uOiAncHJvZmlsZU1FTSdcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZmlsZSA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBkYXlqcygpLmZvcm1hdCgnZGQtSEg6bW06c3MnKSArIGNtZC5leHQpO1xuICAgIHRpbWUgPSB0aW1lIHx8IDEwMDAwXG5cbiAgICBjb25zb2xlLmxvZyhgU3RhcnRpbmcgJHtjbWQuYWN0aW9ufSBwcm9maWxpbmcgZm9yICR7dGltZX1tcy4uLmApXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZShjbWQuYWN0aW9uLCB7XG4gICAgICBwd2Q6IGZpbGUsXG4gICAgICB0aW1lb3V0OiB0aW1lXG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoMSk7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhgUHJvZmlsZSBkb25lIGluICR7ZmlsZX1gKVxuICAgICAgcmV0dXJuIGNiID8gY2IuYXBwbHkobnVsbCwgYXJndW1lbnRzKSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICB9KTtcbiAgfTtcblxuXG4gIGZ1bmN0aW9uIGJhc2ljTURIaWdobGlnaHQobGluZXMpIHtcbiAgICBjb25zb2xlLmxvZygnXFxuXFxuKy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0rJylcbiAgICBjb25zb2xlLmxvZyhjaGFsay5ib2xkKCdSRUFETUUubWQgY29udGVudDonKSlcbiAgICBsaW5lcyA9IGxpbmVzLnNwbGl0KCdcXG4nKVxuICAgIHZhciBpc0lubmVyID0gZmFsc2VcbiAgICBsaW5lcy5mb3JFYWNoKGwgPT4ge1xuICAgICAgaWYgKGwuc3RhcnRzV2l0aCgnIycpKVxuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ib2xkLmdyZWVuKGwpKVxuICAgICAgZWxzZSBpZiAoaXNJbm5lciB8fCBsLnN0YXJ0c1dpdGgoJ2BgYCcpKSB7XG4gICAgICAgIGlmIChpc0lubmVyICYmIGwuc3RhcnRzV2l0aCgnYGBgJykpXG4gICAgICAgICAgaXNJbm5lciA9IGZhbHNlXG4gICAgICAgIGVsc2UgaWYgKGlzSW5uZXIgPT0gZmFsc2UpXG4gICAgICAgICAgaXNJbm5lciA9IHRydWVcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JleShsKSlcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGwuc3RhcnRzV2l0aCgnYCcpKVxuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmV5KGwpKVxuICAgICAgZWxzZVxuICAgICAgICBjb25zb2xlLmxvZyhsKVxuICAgIH0pXG4gICAgY29uc29sZS5sb2coJystLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKycpXG4gIH1cbiAgLyoqXG4gICAqIHBtMiBjcmVhdGUgY29tbWFuZFxuICAgKiBjcmVhdGUgYm9pbGVycGxhdGUgb2YgYXBwbGljYXRpb24gZm9yIGZhc3QgdHJ5XG4gICAqIEBtZXRob2QgYm9pbGVycGxhdGVcbiAgICovXG4gIENMSS5wcm90b3R5cGUuYm9pbGVycGxhdGUgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICB2YXIgaSA9IDBcbiAgICB2YXIgcHJvamVjdHMgPSBbXVxuICAgIHZhciBlbnF1aXJlciA9IHJlcXVpcmUoJ2VucXVpcmVyJylcblxuICAgIGZzLnJlYWRkaXIocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3RlbXBsYXRlcy9zYW1wbGUtYXBwcycpLCAoZXJyLCBpdGVtcykgPT4ge1xuICAgICAgcmVxdWlyZSgnYXN5bmMnKS5mb3JFYWNoKGl0ZW1zLCAoYXBwLCBuZXh0KSA9PiB7XG4gICAgICAgIHZhciBmcCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi90ZW1wbGF0ZXMvc2FtcGxlLWFwcHMnLCBhcHApXG4gICAgICAgIGZzLnJlYWRGaWxlKHBhdGguam9pbihmcCwgJ3BhY2thZ2UuanNvbicpLCBcInV0ZjhcIiwgKGVyciwgZHQpID0+IHtcbiAgICAgICAgICB2YXIgbWV0YSA9IEpTT04ucGFyc2UoZHQpXG4gICAgICAgICAgbWV0YS5mdWxscGF0aCA9IGZwXG4gICAgICAgICAgbWV0YS5mb2xkZXJfbmFtZSA9IGFwcFxuICAgICAgICAgIHByb2plY3RzLnB1c2gobWV0YSlcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgfSlcbiAgICAgIH0sICgpID0+IHtcbiAgICAgICAgY29uc3QgcHJvbXB0ID0gbmV3IGVucXVpcmVyLlNlbGVjdCh7XG4gICAgICAgICAgbmFtZTogJ2JvaWxlcnBsYXRlJyxcbiAgICAgICAgICBtZXNzYWdlOiAnU2VsZWN0IGEgYm9pbGVycGxhdGUnLFxuICAgICAgICAgIGNob2ljZXM6IHByb2plY3RzLm1hcCgocCwgaSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogYCR7Y2hhbGsuYm9sZC5ibHVlKHAubmFtZSl9ICR7cC5kZXNjcmlwdGlvbn1gLFxuICAgICAgICAgICAgICB2YWx1ZTogYCR7aX1gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcHJvbXB0LnJ1bigpXG4gICAgICAgICAgLnRoZW4oYW5zd2VyID0+IHtcbiAgICAgICAgICAgIHZhciBwID0gcHJvamVjdHNbcGFyc2VJbnQoYW5zd2VyKV1cbiAgICAgICAgICAgIGJhc2ljTURIaWdobGlnaHQoZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihwLmZ1bGxwYXRoLCAnUkVBRE1FLm1kJykpLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ib2xkKGA+PiBQcm9qZWN0IGNvcGllZCBpbnNpZGUgZm9sZGVyIC4vJHtwLmZvbGRlcl9uYW1lfS9cXG5gKSlcbiAgICAgICAgICAgIGNvcHlEaXJTeW5jKHAuZnVsbHBhdGgsIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBwLmZvbGRlcl9uYW1lKSk7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0KHBhdGguam9pbihwLmZ1bGxwYXRoLCAnZWNvc3lzdGVtLmNvbmZpZy5qcycpLCB7XG4gICAgICAgICAgICAgIGN3ZDogcC5mdWxscGF0aFxuICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYi5hcHBseShudWxsLCBhcmd1bWVudHMpIDogdGhpcy5zcGVlZExpc3QoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IuYXBwbHkobnVsbCwgYXJndW1lbnRzKSA6IHRoaXMuc3BlZWRMaXN0KGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBzZW5kTGluZVRvU3RkaW5cbiAgICovXG4gIENMSS5wcm90b3R5cGUuc2VuZExpbmVUb1N0ZGluID0gZnVuY3Rpb24gKHBtX2lkLCBsaW5lLCBzZXBhcmF0b3IsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKCFjYiAmJiB0eXBlb2YgKHNlcGFyYXRvcikgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2IgPSBzZXBhcmF0b3I7XG4gICAgICBzZXBhcmF0b3IgPSBudWxsO1xuICAgIH1cblxuICAgIHZhciBwYWNrZXQgPSB7XG4gICAgICBwbV9pZDogcG1faWQsXG4gICAgICBsaW5lOiBsaW5lICsgKHNlcGFyYXRvciB8fCAnXFxuJylcbiAgICB9O1xuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnc2VuZExpbmVUb1N0ZGluJywgcGFja2V0LCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsLCByZXMpIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBhdHRhY2hUb1Byb2Nlc3NcbiAgICovXG4gIENMSS5wcm90b3R5cGUuYXR0YWNoID0gZnVuY3Rpb24gKHBtX2lkLCBzZXBhcmF0b3IsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciByZWFkbGluZSA9IHJlcXVpcmUoJ3JlYWRsaW5lJyk7XG5cbiAgICBpZiAoaXNOYU4ocG1faWQpKSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcigncG1faWQgbXVzdCBiZSBhIHByb2Nlc3MgbnVtYmVyIChub3QgYSBwcm9jZXNzIG5hbWUpJyk7XG4gICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKCdwbV9pZCBtdXN0IGJlIG51bWJlcicpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiAoc2VwYXJhdG9yKSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYiA9IHNlcGFyYXRvcjtcbiAgICAgIHNlcGFyYXRvciA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIHJsID0gcmVhZGxpbmUuY3JlYXRlSW50ZXJmYWNlKHtcbiAgICAgIGlucHV0OiBwcm9jZXNzLnN0ZGluLFxuICAgICAgb3V0cHV0OiBwcm9jZXNzLnN0ZG91dFxuICAgIH0pO1xuXG4gICAgcmwub24oJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNiID8gY2IoKSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICB9KTtcblxuICAgIHRoYXQuQ2xpZW50LmxhdW5jaEJ1cyhmdW5jdGlvbiAoZXJyLCBidXMsIHNvY2tldCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgYnVzLm9uKCdsb2c6KicsIGZ1bmN0aW9uICh0eXBlLCBwYWNrZXQpIHtcbiAgICAgICAgaWYgKHBhY2tldC5wcm9jZXNzLnBtX2lkICE9PSBwYXJzZUludChwbV9pZCkpXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShwYWNrZXQuZGF0YSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJsLm9uKCdsaW5lJywgZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgIHRoYXQuc2VuZExpbmVUb1N0ZGluKHBtX2lkLCBsaW5lLCBzZXBhcmF0b3IsIGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uXG4gICAqIEBtZXRob2Qgc2VuZERhdGFUb1Byb2Nlc3NJZFxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5zZW5kRGF0YVRvUHJvY2Vzc0lkID0gZnVuY3Rpb24gKHByb2NfaWQsIHBhY2tldCwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIHByb2NfaWQgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwYWNrZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIHRoZSBwcm9jX2lkIGlzIHBhY2tldC5cbiAgICAgIGNiID0gcGFja2V0O1xuICAgICAgcGFja2V0ID0gcHJvY19pZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFja2V0LmlkID0gcHJvY19pZDtcbiAgICB9XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdzZW5kRGF0YVRvUHJvY2Vzc0lkJywgcGFja2V0LCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgICBDb21tb24ucHJpbnRPdXQoJ3N1Y2Nlc3NmdWxseSBzZW50IGRhdGEgdG8gcHJvY2VzcycpO1xuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgcmVzKSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFVzZWQgZm9yIGN1c3RvbSBhY3Rpb25zLCBhbGxvd3MgdG8gdHJpZ2dlciBmdW5jdGlvbiBpbnNpZGUgYW4gYXBwXG4gICAqIFRvIGV4cG9zZSBhIGZ1bmN0aW9uIHlvdSBuZWVkIHRvIHVzZSBrZXltZXRyaWNzL3BteFxuICAgKlxuICAgKiBAbWV0aG9kIG1zZ1Byb2Nlc3NcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAgICogQHBhcmFtIHtTdHJpbmd9IGlkICAgICAgICAgICBwcm9jZXNzIGlkXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBhY3Rpb25fbmFtZSAgZnVuY3Rpb24gbmFtZSB0byB0cmlnZ2VyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0cy5vcHRzXSAgb2JqZWN0IHBhc3NlZCBhcyBmaXJzdCBhcmcgb2YgdGhlIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbdXVpZF0gICAgICAgb3B0aW9uYWwgdW5pcXVlIGlkZW50aWZpZXIgd2hlbiBsb2dzIGFyZSBlbWl0dGVkXG4gICAqXG4gICAqL1xuICBDTEkucHJvdG90eXBlLm1zZ1Byb2Nlc3MgPSBmdW5jdGlvbiAob3B0cywgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdtc2dQcm9jZXNzJywgb3B0cywgY2IpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUcmlnZ2VyIGEgUE1YIGN1c3RvbSBhY3Rpb24gaW4gdGFyZ2V0IGFwcGxpY2F0aW9uXG4gICAqIEN1c3RvbSBhY3Rpb25zIGFsbG93cyB0byBpbnRlcmFjdCB3aXRoIGFuIGFwcGxpY2F0aW9uXG4gICAqXG4gICAqIEBtZXRob2QgdHJpZ2dlclxuICAgKiBAcGFyYW0gIHtTdHJpbmd8TnVtYmVyfSBwbV9pZCAgICAgICBwcm9jZXNzIGlkIG9yIGFwcGxpY2F0aW9uIG5hbWVcbiAgICogQHBhcmFtICB7U3RyaW5nfSAgICAgICAgYWN0aW9uX25hbWUgbmFtZSBvZiB0aGUgY3VzdG9tIGFjdGlvbiB0byB0cmlnZ2VyXG4gICAqIEBwYXJhbSAge01peGVkfSAgICAgICAgIHBhcmFtcyAgICAgIHBhcmFtZXRlciB0byBwYXNzIHRvIHRhcmdldCBhY3Rpb25cbiAgICogQHBhcmFtICB7RnVuY3Rpb259ICAgICAgY2IgICAgICAgICAgY2FsbGJhY2tcbiAgICovXG4gIENMSS5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uIChwbV9pZCwgYWN0aW9uX25hbWUsIHBhcmFtcywgY2IpIHtcbiAgICBpZiAodHlwZW9mIChwYXJhbXMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYiA9IHBhcmFtcztcbiAgICAgIHBhcmFtcyA9IG51bGw7XG4gICAgfVxuICAgIHZhciBjbWQ6IGFueSA9IHtcbiAgICAgIG1zZzogYWN0aW9uX25hbWVcbiAgICB9O1xuICAgIHZhciBjb3VudGVyID0gMDtcbiAgICB2YXIgcHJvY2Vzc193YWl0X2NvdW50ID0gMDtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcblxuICAgIGlmIChwYXJhbXMpXG4gICAgICBjbWQub3B0cyA9IHBhcmFtcztcbiAgICBpZiAoaXNOYU4ocG1faWQpKVxuICAgICAgY21kLm5hbWUgPSBwbV9pZDtcbiAgICBlbHNlXG4gICAgICBjbWQuaWQgPSBwbV9pZDtcblxuICAgIHRoaXMubGF1bmNoQnVzKGZ1bmN0aW9uIChlcnIsIGJ1cykge1xuICAgICAgYnVzLm9uKCdheG06cmVwbHknLCBmdW5jdGlvbiAocmV0KSB7XG4gICAgICAgIGlmIChyZXQucHJvY2Vzcy5uYW1lID09IHBtX2lkIHx8IHJldC5wcm9jZXNzLnBtX2lkID09IHBtX2lkIHx8IHJldC5wcm9jZXNzLm5hbWVzcGFjZSA9PSBwbV9pZCB8fCBwbV9pZCA9PSAnYWxsJykge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChyZXQpO1xuICAgICAgICAgIENvbW1vbi5wcmludE91dCgnWyVzOiVzOiVzXT0laicsIHJldC5wcm9jZXNzLm5hbWUsIHJldC5wcm9jZXNzLnBtX2lkLCByZXQucHJvY2Vzcy5uYW1lc3BhY2UsIHJldC5kYXRhLnJldHVybik7XG4gICAgICAgICAgaWYgKCsrY291bnRlciA9PSBwcm9jZXNzX3dhaXRfY291bnQpXG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCByZXN1bHRzKSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHRoYXQubXNnUHJvY2VzcyhjbWQsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS5wcm9jZXNzX2NvdW50ID09IDApIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcignTm90IGFueSBwcm9jZXNzIGhhcyByZWNlaXZlZCBhIGNvbW1hbmQgKG9mZmxpbmUgb3IgdW5leGlzdGVudCknKTtcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKCdVbmtub3duIHByb2Nlc3MnKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvY2Vzc193YWl0X2NvdW50ID0gZGF0YS5wcm9jZXNzX2NvdW50O1xuICAgICAgICBDb21tb24ucHJpbnRPdXQoY2hhbGsuYm9sZCgnJXMgcHJvY2Vzc2VzIGhhdmUgcmVjZWl2ZWQgY29tbWFuZCAlcycpLFxuICAgICAgICAgIGRhdGEucHJvY2Vzc19jb3VudCwgYWN0aW9uX25hbWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uXG4gICAqIEBtZXRob2Qgc2VuZFNpZ25hbFRvUHJvY2Vzc05hbWVcbiAgICogQHBhcmFtIHt9IHNpZ25hbFxuICAgKiBAcGFyYW0ge30gcHJvY2Vzc19uYW1lXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUuc2VuZFNpZ25hbFRvUHJvY2Vzc05hbWUgPSBmdW5jdGlvbiAoc2lnbmFsLCBwcm9jZXNzX25hbWUsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnc2VuZFNpZ25hbFRvUHJvY2Vzc05hbWUnLCB7XG4gICAgICBzaWduYWw6IHNpZ25hbCxcbiAgICAgIHByb2Nlc3NfbmFtZTogcHJvY2Vzc19uYW1lXG4gICAgfSwgZnVuY3Rpb24gKGVyciwgbGlzdCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIENvbW1vbi5wcmludE91dCgnc3VjY2Vzc2Z1bGx5IHNlbnQgc2lnbmFsICVzIHRvIHByb2Nlc3MgbmFtZSAlcycsIHNpZ25hbCwgcHJvY2Vzc19uYW1lKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGxpc3QpIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBzZW5kU2lnbmFsVG9Qcm9jZXNzSWRcbiAgICogQHBhcmFtIHt9IHNpZ25hbFxuICAgKiBAcGFyYW0ge30gcHJvY2Vzc19pZFxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnNlbmRTaWduYWxUb1Byb2Nlc3NJZCA9IGZ1bmN0aW9uIChzaWduYWwsIHByb2Nlc3NfaWQsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnc2VuZFNpZ25hbFRvUHJvY2Vzc0lkJywge1xuICAgICAgc2lnbmFsOiBzaWduYWwsXG4gICAgICBwcm9jZXNzX2lkOiBwcm9jZXNzX2lkXG4gICAgfSwgZnVuY3Rpb24gKGVyciwgbGlzdCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIENvbW1vbi5wcmludE91dCgnc3VjY2Vzc2Z1bGx5IHNlbnQgc2lnbmFsICVzIHRvIHByb2Nlc3MgaWQgJXMnLCBzaWduYWwsIHByb2Nlc3NfaWQpO1xuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgbGlzdCkgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBUEkgbWV0aG9kIHRvIGxhdW5jaCBhIHByb2Nlc3MgdGhhdCB3aWxsIHNlcnZlIGRpcmVjdG9yeSBvdmVyIGh0dHBcbiAgICovXG4gIENMSS5wcm90b3R5cGUuYXV0b2luc3RhbGwgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICB2YXIgZmlsZXBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKG1vZHVsZS5maWxlbmFtZSksICcuLi9TeXNpbmZvL1NlcnZpY2VEZXRlY3Rpb24vU2VydmljZURldGVjdGlvbi5qcycpO1xuXG4gICAgdGhpcy5zdGFydChmaWxlcGF0aCwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArICdFcnJvciB3aGlsZSB0cnlpbmcgdG8gc2VydmUgOiAnICsgZXJyLm1lc3NhZ2UgfHwgZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyKSA6IHRoaXMuc3BlZWRMaXN0KGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwpIDogdGhpcy5zcGVlZExpc3QoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBUEkgbWV0aG9kIHRvIGxhdW5jaCBhIHByb2Nlc3MgdGhhdCB3aWxsIHNlcnZlIGRpcmVjdG9yeSBvdmVyIGh0dHBcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgb3B0aW9uc1xuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5wYXRoIHBhdGggdG8gYmUgc2VydmVkXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHRzLnBvcnQgcG9ydCBvbiB3aGljaCBodHRwIHdpbGwgYmluZFxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdHMuc3BhIHNpbmdsZSBwYWdlIGFwcCBzZXJ2ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuYmFzaWNBdXRoVXNlcm5hbWUgYmFzaWMgYXV0aCB1c2VybmFtZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5iYXNpY0F1dGhQYXNzd29yZCBiYXNpYyBhdXRoIHBhc3N3b3JkXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb21tYW5kZXIgY29tbWFuZGVyIG9iamVjdFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBvcHRpb25hbCBjYWxsYmFja1xuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5zZXJ2ZSA9IGZ1bmN0aW9uICh0YXJnZXRfcGF0aCwgcG9ydCwgb3B0cywgY29tbWFuZGVyLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgc2VydmVQb3J0ID0gcHJvY2Vzcy5lbnYuUE0yX1NFUlZFX1BPUlQgfHwgcG9ydCB8fCA4MDgwO1xuICAgIHZhciBzZXJ2ZVBhdGggPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5lbnYuUE0yX1NFUlZFX1BBVEggfHwgdGFyZ2V0X3BhdGggfHwgJy4nKTtcblxuICAgIHZhciBmaWxlcGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUobW9kdWxlLmZpbGVuYW1lKSwgJy4vU2VydmUuanMnKTtcblxuICAgIGlmICh0eXBlb2YgY29tbWFuZGVyLm5hbWUgPT09ICdzdHJpbmcnKVxuICAgICAgb3B0cy5uYW1lID0gY29tbWFuZGVyLm5hbWVcbiAgICBlbHNlXG4gICAgICBvcHRzLm5hbWUgPSAnc3RhdGljLXBhZ2Utc2VydmVyLScgKyBzZXJ2ZVBvcnRcbiAgICBpZiAoIW9wdHMuZW52KVxuICAgICAgb3B0cy5lbnYgPSB7fTtcbiAgICBvcHRzLmVudi5QTTJfU0VSVkVfUE9SVCA9IHNlcnZlUG9ydDtcbiAgICBvcHRzLmVudi5QTTJfU0VSVkVfUEFUSCA9IHNlcnZlUGF0aDtcbiAgICBvcHRzLmVudi5QTTJfU0VSVkVfU1BBID0gb3B0cy5zcGE7XG4gICAgaWYgKG9wdHMuYmFzaWNBdXRoVXNlcm5hbWUgJiYgb3B0cy5iYXNpY0F1dGhQYXNzd29yZCkge1xuICAgICAgb3B0cy5lbnYuUE0yX1NFUlZFX0JBU0lDX0FVVEggPSAndHJ1ZSc7XG4gICAgICBvcHRzLmVudi5QTTJfU0VSVkVfQkFTSUNfQVVUSF9VU0VSTkFNRSA9IG9wdHMuYmFzaWNBdXRoVXNlcm5hbWU7XG4gICAgICBvcHRzLmVudi5QTTJfU0VSVkVfQkFTSUNfQVVUSF9QQVNTV09SRCA9IG9wdHMuYmFzaWNBdXRoUGFzc3dvcmQ7XG4gICAgfVxuICAgIGlmIChvcHRzLm1vbml0b3IpIHtcbiAgICAgIG9wdHMuZW52LlBNMl9TRVJWRV9NT05JVE9SID0gb3B0cy5tb25pdG9yXG4gICAgfVxuICAgIG9wdHMuY3dkID0gc2VydmVQYXRoO1xuXG4gICAgdGhpcy5zdGFydChmaWxlcGF0aCwgb3B0cywgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArICdFcnJvciB3aGlsZSB0cnlpbmcgdG8gc2VydmUgOiAnICsgZXJyLm1lc3NhZ2UgfHwgZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoZXJyKSA6IHRoYXQuc3BlZWRMaXN0KGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdTZXJ2aW5nICcgKyBzZXJ2ZVBhdGggKyAnIG9uIHBvcnQgJyArIHNlcnZlUG9ydCk7XG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsLCByZXMpIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQaW5nIGRhZW1vbiAtIGlmIFBNMiBkYWVtb24gbm90IGxhdW5jaGVkLCBpdCB3aWxsIGxhdW5jaCBpdFxuICAgKiBAbWV0aG9kIHBpbmdcbiAgICovXG4gIENMSS5wcm90b3R5cGUucGluZyA9IGZ1bmN0aW9uIChjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ3BpbmcnLCB7fSwgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKG5ldyBFcnJvcihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgICBDb21tb24ucHJpbnRPdXQocmVzKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJlcykgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvKipcbiAgICogRXhlY3V0ZSByZW1vdGUgY29tbWFuZFxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5yZW1vdGUgPSBmdW5jdGlvbiAoY29tbWFuZCwgb3B0cywgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0aGF0W2NvbW1hbmRdKG9wdHMubmFtZSwgZnVuY3Rpb24gKGVycl9jbWQsIHJldCkge1xuICAgICAgaWYgKGVycl9jbWQpXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyX2NtZCk7XG4gICAgICBjb25zb2xlLmxvZygnQ29tbWFuZCAlcyBmaW5pc2hlZCcsIGNvbW1hbmQpO1xuICAgICAgcmV0dXJuIGNiKGVycl9jbWQsIHJldCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRoaXMgcmVtb3RlIG1ldGhvZCBhbGxvd3MgdG8gcGFzcyBtdWx0aXBsZSBhcmd1bWVudHNcbiAgICogdG8gUE0yXG4gICAqIEl0IGlzIHVzZWQgZm9yIHRoZSBuZXcgc2NvcGVkIFBNMiBhY3Rpb24gc3lzdGVtXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnJlbW90ZVYyID0gZnVuY3Rpb24gKGNvbW1hbmQsIG9wdHMsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHRoYXRbY29tbWFuZF0ubGVuZ3RoID09IDEpXG4gICAgICByZXR1cm4gdGhhdFtjb21tYW5kXShjYik7XG5cbiAgICBvcHRzLmFyZ3MucHVzaChjYik7XG4gICAgcmV0dXJuIHRoYXRbY29tbWFuZF0uYXBwbHkodGhpcywgb3B0cy5hcmdzKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIGdlbmVyYXRlU2FtcGxlXG4gICAqIEBwYXJhbSB7fSBuYW1lXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUuZ2VuZXJhdGVTYW1wbGUgPSBmdW5jdGlvbiAobW9kZSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgdGVtcGxhdGVQYXRoO1xuXG4gICAgaWYgKG1vZGUgPT0gJ3NpbXBsZScpXG4gICAgICB0ZW1wbGF0ZVBhdGggPSBwYXRoLmpvaW4oY3N0LlRFTVBMQVRFX0ZPTERFUiwgY3N0LkFQUF9DT05GX1RQTF9TSU1QTEUpO1xuICAgIGVsc2VcbiAgICAgIHRlbXBsYXRlUGF0aCA9IHBhdGguam9pbihjc3QuVEVNUExBVEVfRk9MREVSLCBjc3QuQVBQX0NPTkZfVFBMKTtcblxuICAgIHZhciBzYW1wbGUgPSBmcy5yZWFkRmlsZVN5bmModGVtcGxhdGVQYXRoKTtcbiAgICB2YXIgZHQgPSBzYW1wbGUudG9TdHJpbmcoKTtcbiAgICB2YXIgZl9uYW1lID0gJ2Vjb3N5c3RlbS5jb25maWcuanMnO1xuICAgIHZhciBwd2QgPSBwcm9jZXNzLmVudi5QV0QgfHwgcHJvY2Vzcy5jd2QoKTtcblxuICAgIHRyeSB7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihwd2QsIGZfbmFtZSksIGR0KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XG4gICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICB9XG4gICAgQ29tbW9uLnByaW50T3V0KCdGaWxlICVzIGdlbmVyYXRlZCcsIHBhdGguam9pbihwd2QsIGZfbmFtZSkpO1xuICAgIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBkYXNoYm9hcmRcbiAgICogQHJldHVyblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5kYXNoYm9hcmQgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAoY2IpXG4gICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdEYXNoYm9hcmQgY2FudCBiZSBjYWxsZWQgcHJvZ3JhbW1hdGljYWxseScpKTtcblxuICAgIERhc2hib2FyZC5pbml0KCk7XG5cbiAgICB0aGlzLkNsaWVudC5sYXVuY2hCdXMoZnVuY3Rpb24gKGVyciwgYnVzKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxhdW5jaEJ1czogJyArIGVycik7XG4gICAgICAgIHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgICBidXMub24oJ2xvZzoqJywgZnVuY3Rpb24gKHR5cGUsIGRhdGEpIHtcbiAgICAgICAgRGFzaGJvYXJkLmxvZyh0eXBlLCBkYXRhKVxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIHByb2Nlc3Mub24oJ1NJR0lOVCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuQ2xpZW50LmRpc2Nvbm5lY3RCdXMoZnVuY3Rpb24gKCkge1xuICAgICAgICBwcm9jZXNzLmV4aXQoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHJlZnJlc2hEYXNoYm9hcmQoKSB7XG4gICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICAgICAgdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuXG4gICAgICAgIERhc2hib2FyZC5yZWZyZXNoKGxpc3QpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJlZnJlc2hEYXNoYm9hcmQoKTtcbiAgICAgICAgfSwgODAwKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlZnJlc2hEYXNoYm9hcmQoKTtcbiAgfTtcblxuICBDTEkucHJvdG90eXBlLm1vbml0ID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKGNiKSByZXR1cm4gY2IobmV3IEVycm9yKCdNb25pdCBjYW50IGJlIGNhbGxlZCBwcm9ncmFtbWF0aWNhbGx5JykpO1xuXG4gICAgTW9uaXQuaW5pdCgpO1xuXG4gICAgZnVuY3Rpb24gbGF1bmNoTW9uaXRvcigpIHtcbiAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0OiAnICsgZXJyKTtcbiAgICAgICAgICB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG5cbiAgICAgICAgTW9uaXQucmVmcmVzaChsaXN0KTtcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBsYXVuY2hNb25pdG9yKCk7XG4gICAgICAgIH0sIDQwMCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsYXVuY2hNb25pdG9yKCk7XG4gIH07XG5cbiAgQ0xJLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gKGFwcF9uYW1lLCBjYikge1xuICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgIGlmIChzZW12ZXIuc2F0aXNmaWVzKHByb2Nlc3MudmVyc2lvbnMubm9kZSwgJz49IDguMC4wJykpIHtcbiAgICAgIHRoaXMudHJpZ2dlcihhcHBfbmFtZSwgJ2ludGVybmFsOmluc3BlY3QnLCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcblxuICAgICAgICBpZiAocmVzICYmIHJlc1swXSkge1xuICAgICAgICAgIGlmIChyZXNbMF0uZGF0YS5yZXR1cm4gPT09ICcnKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRPdXQoYEluc3BlY3QgZGlzYWJsZWQgb24gJHthcHBfbmFtZX1gKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGBJbnNwZWN0IGVuYWJsZWQgb24gJHthcHBfbmFtZX0gPT4gZ28gdG8gY2hyb21lIDogY2hyb21lOi8vaW5zcGVjdCAhISFgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KGBVbmFibGUgdG8gYWN0aXZhdGUgaW5zcGVjdCBtb2RlIG9uICR7YXBwX25hbWV9ICEhIWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIENvbW1vbi5wcmludE91dCgnSW5zcGVjdCBpcyBhdmFpbGFibGUgZm9yIG5vZGUgdmVyc2lvbiA+PTgueCAhJyk7XG4gICAgICB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgfVxuICB9O1xufTtcbiJdfQ==