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

    var Log = require("./Log");

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
        Log.tail([{
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

    var Dashboard = require("./Dashboard");

    if (cb) return cb(new Error('Dashboard cant be called programmatically'));
    Dashboard.init();
    this.Client.launchBus(function (err, bus) {
      if (err) {
        console.error('Error launchBus: ' + err);
        that.exitCli(_constants["default"].ERROR_EXIT);
      }

      bus.on('log:*', function (type, data) {
        Dashboard.log(type, data);
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

        Dashboard.refresh(list);
        setTimeout(function () {
          refreshDashboard();
        }, 800);
      });
    }

    refreshDashboard();
  };

  CLI.prototype.monit = function (cb) {
    var that = this;

    var Monit = require("./Monit.js");

    if (cb) return cb(new Error('Monit cant be called programmatically'));
    Monit.init();

    function launchMonitor() {
      that.Client.executeRemote('getMonitorData', {}, function (err, list) {
        if (err) {
          console.error('Error retrieving process list: ' + err);
          that.exitCli(_constants["default"].ERROR_EXIT);
        }

        Monit.refresh(list);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvRXh0cmEudHMiXSwibmFtZXMiOlsiQ0xJIiwicHJvdG90eXBlIiwiZ2V0VmVyc2lvbiIsImNiIiwidGhhdCIsIkNsaWVudCIsImV4ZWN1dGVSZW1vdGUiLCJlcnIiLCJhcHBseSIsImFyZ3VtZW50cyIsImV4aXRDbGkiLCJjc3QiLCJTVUNDRVNTX0VYSVQiLCJsYXVuY2hTeXNNb25pdG9yaW5nIiwic2V0IiwiQ29tbW9uIiwibG9nIiwiZW52IiwiYXBwX2lkIiwicHJvY3MiLCJwcmludGVkIiwibGlzdCIsImZvckVhY2giLCJsIiwicG1faWQiLCJzYWZlRXh0ZW5kIiwicG0yX2VudiIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJjb25zb2xlIiwiY2hhbGsiLCJncmVlbiIsIkVSUk9SX0VYSVQiLCJyZXBvcnQiLCJMb2ciLCJyZXF1aXJlIiwiZm10IiwidGl0bGUiLCJmaWVsZCIsIkRhdGUiLCJzZXAiLCJib2xkIiwiYmx1ZSIsInBtMl92ZXJzaW9uIiwibm9kZV92ZXJzaW9uIiwibm9kZV9wYXRoIiwiYXJndiIsImFyZ3YwIiwidXNlciIsInVpZCIsImdpZCIsImRpZmYiLCJzdGFydGVkX2F0IiwicGtnIiwidmVyc2lvbiIsInByb2Nlc3MiLCJ2ZXJzaW9ucyIsIm5vZGUiLCJVU0VSIiwiTE5BTUUiLCJVU0VSTkFNRSIsIklTX1dJTkRPV1MiLCJnZXRldWlkIiwiZ2V0ZWdpZCIsIm9zIiwiYXJjaCIsInBsYXRmb3JtIiwidHlwZSIsImNwdXMiLCJtb2RlbCIsImxlbmd0aCIsImZyZWVtZW0iLCJ0b3RhbG1lbSIsImhvbWVkaXIiLCJVWCIsImdsX2ludGVyYWN0X2luZm9zIiwidGFpbCIsInBhdGgiLCJQTTJfTE9HX0ZJTEVfUEFUSCIsImFwcF9uYW1lIiwiZ2V0UElEIiwicHJpbnRFcnJvciIsIlBSRUZJWF9NU0dfRVJSIiwicmV0RXJyIiwicGlkcyIsImFwcCIsIm5hbWUiLCJwdXNoIiwicGlkIiwicHJpbnRPdXQiLCJqb2luIiwicHJvZmlsZSIsInRpbWUiLCJkYXlqcyIsImNtZCIsImV4dCIsImFjdGlvbiIsImZpbGUiLCJjd2QiLCJmb3JtYXQiLCJwd2QiLCJ0aW1lb3V0IiwiZXJyb3IiLCJiYXNpY01ESGlnaGxpZ2h0IiwibGluZXMiLCJzcGxpdCIsImlzSW5uZXIiLCJzdGFydHNXaXRoIiwiZ3JleSIsImJvaWxlcnBsYXRlIiwiaSIsInByb2plY3RzIiwiZW5xdWlyZXIiLCJmcyIsInJlYWRkaXIiLCJfX2Rpcm5hbWUiLCJpdGVtcyIsIm5leHQiLCJmcCIsInJlYWRGaWxlIiwiZHQiLCJtZXRhIiwiSlNPTiIsInBhcnNlIiwiZnVsbHBhdGgiLCJmb2xkZXJfbmFtZSIsInByb21wdCIsIlNlbGVjdCIsIm1lc3NhZ2UiLCJjaG9pY2VzIiwibWFwIiwicCIsImRlc2NyaXB0aW9uIiwidmFsdWUiLCJydW4iLCJ0aGVuIiwiYW5zd2VyIiwicGFyc2VJbnQiLCJyZWFkRmlsZVN5bmMiLCJ0b1N0cmluZyIsInN0YXJ0Iiwic3BlZWRMaXN0IiwiZSIsInNlbmRMaW5lVG9TdGRpbiIsImxpbmUiLCJzZXBhcmF0b3IiLCJwYWNrZXQiLCJyZXMiLCJhdHRhY2giLCJyZWFkbGluZSIsImlzTmFOIiwicmwiLCJjcmVhdGVJbnRlcmZhY2UiLCJpbnB1dCIsInN0ZGluIiwib3V0cHV0Iiwic3Rkb3V0Iiwib24iLCJsYXVuY2hCdXMiLCJidXMiLCJzb2NrZXQiLCJ3cml0ZSIsImRhdGEiLCJzZW5kRGF0YVRvUHJvY2Vzc0lkIiwicHJvY19pZCIsImlkIiwibXNnUHJvY2VzcyIsIm9wdHMiLCJ0cmlnZ2VyIiwiYWN0aW9uX25hbWUiLCJwYXJhbXMiLCJtc2ciLCJjb3VudGVyIiwicHJvY2Vzc193YWl0X2NvdW50IiwicmVzdWx0cyIsInJldCIsIm5hbWVzcGFjZSIsInByb2Nlc3NfY291bnQiLCJzZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZSIsInNpZ25hbCIsInByb2Nlc3NfbmFtZSIsInNlbmRTaWduYWxUb1Byb2Nlc3NJZCIsInByb2Nlc3NfaWQiLCJhdXRvaW5zdGFsbCIsImZpbGVwYXRoIiwicmVzb2x2ZSIsImRpcm5hbWUiLCJtb2R1bGUiLCJmaWxlbmFtZSIsInNlcnZlIiwidGFyZ2V0X3BhdGgiLCJwb3J0IiwiY29tbWFuZGVyIiwic2VydmVQb3J0IiwiUE0yX1NFUlZFX1BPUlQiLCJzZXJ2ZVBhdGgiLCJQTTJfU0VSVkVfUEFUSCIsIlBNMl9TRVJWRV9TUEEiLCJzcGEiLCJiYXNpY0F1dGhVc2VybmFtZSIsImJhc2ljQXV0aFBhc3N3b3JkIiwiUE0yX1NFUlZFX0JBU0lDX0FVVEgiLCJQTTJfU0VSVkVfQkFTSUNfQVVUSF9VU0VSTkFNRSIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIX1BBU1NXT1JEIiwibW9uaXRvciIsIlBNMl9TRVJWRV9NT05JVE9SIiwiUFJFRklYX01TRyIsInBpbmciLCJFcnJvciIsInJlbW90ZSIsImNvbW1hbmQiLCJlcnJfY21kIiwicmVtb3RlVjIiLCJhcmdzIiwiZ2VuZXJhdGVTYW1wbGUiLCJtb2RlIiwidGVtcGxhdGVQYXRoIiwiVEVNUExBVEVfRk9MREVSIiwiQVBQX0NPTkZfVFBMX1NJTVBMRSIsIkFQUF9DT05GX1RQTCIsInNhbXBsZSIsImZfbmFtZSIsIlBXRCIsIndyaXRlRmlsZVN5bmMiLCJzdGFjayIsImRhc2hib2FyZCIsIkRhc2hib2FyZCIsImluaXQiLCJkaXNjb25uZWN0QnVzIiwiZXhpdCIsInJlZnJlc2hEYXNoYm9hcmQiLCJyZWZyZXNoIiwic2V0VGltZW91dCIsIm1vbml0IiwiTW9uaXQiLCJsYXVuY2hNb25pdG9yIiwiaW5zcGVjdCIsInNlbXZlciIsInNhdGlzZmllcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQU1BOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7Ozs7O0FBRWUsa0JBQVVBLEdBQVYsRUFBZTtBQUM1Qjs7Ozs7QUFLQUEsRUFBQUEsR0FBRyxDQUFDQyxTQUFKLENBQWNDLFVBQWQsR0FBMkIsVUFBVUMsRUFB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QkFBTzJFLFFBQVAsOENBQXNEVixRQUF0RDtBQUNEOztBQUVENUUsUUFBQUEsSUFBSSxDQUFDTSxPQUFMLENBQWFDLHNCQUFJQyxZQUFqQjtBQUNELE9BYkQ7QUFjRCxLQWZELE1BZU87QUFDTEcseUJBQU8yRSxRQUFQLENBQWdCLCtDQUFoQjs7QUFDQXRGLE1BQUFBLElBQUksQ0FBQ00sT0FBTCxDQUFhQyxzQkFBSUMsWUFBakI7QUFDRDtBQUNGLEdBckJEO0FBc0JEOztBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICpcbiAqIEV4dHJhIG1ldGhvZHNcbiAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmltcG9ydCBjc3QgZnJvbSAnLi4vLi4vY29uc3RhbnRzJztcbmltcG9ydCBDb21tb24gZnJvbSAnLi4vQ29tbW9uJztcbmltcG9ydCBVWCBmcm9tICcuL1VYJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBmbXQgZnJvbSAnLi4vdG9vbHMvZm10JztcbmltcG9ydCBkYXlqcyBmcm9tICdkYXlqcyc7XG5pbXBvcnQgcGtnIGZyb20gJy4uLy4uL3BhY2thZ2UuanNvbic7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgY29weURpclN5bmMgZnJvbSAnLi4vdG9vbHMvY29weWRpclN5bmMnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChDTEkpIHtcbiAgLyoqXG4gICAqIEdldCB2ZXJzaW9uIG9mIHRoZSBkYWVtb25pemVkIFBNMlxuICAgKiBAbWV0aG9kIGdldFZlcnNpb25cbiAgICogQGNhbGxiYWNrIGNiXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmdldFZlcnNpb24gPSBmdW5jdGlvbiAoY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRWZXJzaW9uJywge30sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHJldHVybiBjYiA/IGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldCB2ZXJzaW9uIG9mIHRoZSBkYWVtb25pemVkIFBNMlxuICAgKiBAbWV0aG9kIGdldFZlcnNpb25cbiAgICogQGNhbGxiYWNrIGNiXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmxhdW5jaFN5c01vbml0b3JpbmcgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0aGlzLnNldCgncG0yOnN5c21vbml0JywgJ3RydWUnLCAoKSA9PiB7XG4gICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdsYXVuY2hTeXNNb25pdG9yaW5nJywge30sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKGVycilcbiAgICAgICAgICBDb21tb24uZXJyKGVycilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIENvbW1vbi5sb2coJ1N5c3RlbSBNb25pdG9yaW5nIGxhdW5jaGVkJylcbiAgICAgICAgcmV0dXJuIGNiID8gY2IuYXBwbHkobnVsbCwgYXJndW1lbnRzKSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH0pXG4gICAgfSlcbiAgfTtcblxuICAvKipcbiAgICogU2hvdyBhcHBsaWNhdGlvbiBlbnZpcm9ubWVudFxuICAgKiBAbWV0aG9kIGVudlxuICAgKiBAY2FsbGJhY2sgY2JcbiAgICovXG4gIENMSS5wcm90b3R5cGUuZW52ID0gZnVuY3Rpb24gKGFwcF9pZCwgY2IpIHtcbiAgICB2YXIgcHJvY3MgPSBbXVxuICAgIHZhciBwcmludGVkID0gMFxuXG4gICAgdGhpcy5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgKGVyciwgbGlzdCkgPT4ge1xuICAgICAgbGlzdC5mb3JFYWNoKGwgPT4ge1xuICAgICAgICBpZiAoYXBwX2lkID09IGwucG1faWQpIHtcbiAgICAgICAgICBwcmludGVkKytcbiAgICAgICAgICB2YXIgZW52ID0gQ29tbW9uLnNhZmVFeHRlbmQoe30sIGwucG0yX2VudilcbiAgICAgICAgICBPYmplY3Qua2V5cyhlbnYpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke2tleX06ICR7Y2hhbGsuZ3JlZW4oZW52W2tleV0pfWApXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgaWYgKHByaW50ZWQgPT0gMCkge1xuICAgICAgICBDb21tb24uZXJyKGBNb2R1bGVzIHdpdGggaWQgJHthcHBfaWR9IG5vdCBmb3VuZGApXG4gICAgICAgIHJldHVybiBjYiA/IGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB0aGlzLmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNiID8gY2IuYXBwbHkobnVsbCwgYXJndW1lbnRzKSA6IHRoaXMuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICB9KVxuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQgdmVyc2lvbiBvZiB0aGUgZGFlbW9uaXplZCBQTTJcbiAgICogQG1ldGhvZCBnZXRWZXJzaW9uXG4gICAqIEBjYWxsYmFjayBjYlxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5yZXBvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdmFyIExvZyA9IHJlcXVpcmUoJy4vTG9nJyk7XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRSZXBvcnQnLCB7fSwgZnVuY3Rpb24gKGVyciwgcmVwb3J0KSB7XG4gICAgICBjb25zb2xlLmxvZygpXG4gICAgICBjb25zb2xlLmxvZygpXG4gICAgICBjb25zb2xlLmxvZygpXG4gICAgICBjb25zb2xlLmxvZygnYGBgJylcbiAgICAgIGZtdC50aXRsZSgnUE0yIHJlcG9ydCcpXG4gICAgICBmbXQuZmllbGQoJ0RhdGUnLCBuZXcgRGF0ZSgpKTtcbiAgICAgIGZtdC5zZXAoKTtcbiAgICAgIGZtdC50aXRsZShjaGFsay5ib2xkLmJsdWUoJ0RhZW1vbicpKTtcbiAgICAgIGZtdC5maWVsZCgncG0yZCB2ZXJzaW9uJywgcmVwb3J0LnBtMl92ZXJzaW9uKTtcbiAgICAgIGZtdC5maWVsZCgnbm9kZSB2ZXJzaW9uJywgcmVwb3J0Lm5vZGVfdmVyc2lvbik7XG4gICAgICBmbXQuZmllbGQoJ25vZGUgcGF0aCcsIHJlcG9ydC5ub2RlX3BhdGgpO1xuICAgICAgZm10LmZpZWxkKCdhcmd2JywgcmVwb3J0LmFyZ3YpO1xuICAgICAgZm10LmZpZWxkKCdhcmd2MCcsIHJlcG9ydC5hcmd2MCk7XG4gICAgICBmbXQuZmllbGQoJ3VzZXInLCByZXBvcnQudXNlcik7XG4gICAgICBmbXQuZmllbGQoJ3VpZCcsIHJlcG9ydC51aWQpO1xuICAgICAgZm10LmZpZWxkKCdnaWQnLCByZXBvcnQuZ2lkKTtcbiAgICAgIGZtdC5maWVsZCgndXB0aW1lJywgZGF5anMobmV3IERhdGUoKSkuZGlmZihyZXBvcnQuc3RhcnRlZF9hdCwgJ21pbnV0ZScpICsgJ21pbicpO1xuXG4gICAgICBmbXQuc2VwKCk7XG4gICAgICBmbXQudGl0bGUoY2hhbGsuYm9sZC5ibHVlKCdDTEknKSk7XG4gICAgICBmbXQuZmllbGQoJ2xvY2FsIHBtMicsIHBrZy52ZXJzaW9uKTtcbiAgICAgIGZtdC5maWVsZCgnbm9kZSB2ZXJzaW9uJywgcHJvY2Vzcy52ZXJzaW9ucy5ub2RlKTtcbiAgICAgIGZtdC5maWVsZCgnbm9kZSBwYXRoJywgcHJvY2Vzcy5lbnZbJ18nXSB8fCAnbm90IGZvdW5kJyk7XG4gICAgICBmbXQuZmllbGQoJ2FyZ3YnLCBwcm9jZXNzLmFyZ3YpO1xuICAgICAgZm10LmZpZWxkKCdhcmd2MCcsIHByb2Nlc3MuYXJndjApO1xuICAgICAgZm10LmZpZWxkKCd1c2VyJywgcHJvY2Vzcy5lbnYuVVNFUiB8fCBwcm9jZXNzLmVudi5MTkFNRSB8fCBwcm9jZXNzLmVudi5VU0VSTkFNRSk7XG4gICAgICBpZiAoY3N0LklTX1dJTkRPV1MgPT09IGZhbHNlICYmIHByb2Nlc3MuZ2V0ZXVpZClcbiAgICAgICAgZm10LmZpZWxkKCd1aWQnLCBwcm9jZXNzLmdldGV1aWQoKSk7XG4gICAgICBpZiAoY3N0LklTX1dJTkRPV1MgPT09IGZhbHNlICYmIHByb2Nlc3MuZ2V0ZWdpZClcbiAgICAgICAgZm10LmZpZWxkKCdnaWQnLCBwcm9jZXNzLmdldGVnaWQoKSk7XG5cbiAgICAgIHZhciBvcyA9IHJlcXVpcmUoJ29zJyk7XG5cbiAgICAgIGZtdC5zZXAoKTtcbiAgICAgIGZtdC50aXRsZShjaGFsay5ib2xkLmJsdWUoJ1N5c3RlbSBpbmZvJykpO1xuICAgICAgZm10LmZpZWxkKCdhcmNoJywgb3MuYXJjaCgpKTtcbiAgICAgIGZtdC5maWVsZCgncGxhdGZvcm0nLCBvcy5wbGF0Zm9ybSgpKTtcbiAgICAgIGZtdC5maWVsZCgndHlwZScsIG9zLnR5cGUoKSk7XG4gICAgICBmbXQuZmllbGQoJ2NwdXMnLCBvcy5jcHVzKClbMF0ubW9kZWwpO1xuICAgICAgZm10LmZpZWxkKCdjcHVzIG5iJywgT2JqZWN0LmtleXMob3MuY3B1cygpKS5sZW5ndGgpO1xuICAgICAgZm10LmZpZWxkKCdmcmVlbWVtJywgb3MuZnJlZW1lbSgpKTtcbiAgICAgIGZtdC5maWVsZCgndG90YWxtZW0nLCBvcy50b3RhbG1lbSgpKTtcbiAgICAgIGZtdC5maWVsZCgnaG9tZScsIG9zLmhvbWVkaXIoKSk7XG5cbiAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcblxuICAgICAgICBmbXQuc2VwKCk7XG4gICAgICAgIGZtdC50aXRsZShjaGFsay5ib2xkLmJsdWUoJ1BNMiBsaXN0JykpO1xuICAgICAgICBVWC5saXN0KGxpc3QsIHRoYXQuZ2xfaW50ZXJhY3RfaW5mb3MpO1xuXG4gICAgICAgIGZtdC5zZXAoKTtcbiAgICAgICAgZm10LnRpdGxlKGNoYWxrLmJvbGQuYmx1ZSgnRGFlbW9uIGxvZ3MnKSk7XG4gICAgICAgIExvZy50YWlsKFt7XG4gICAgICAgICAgcGF0aDogY3N0LlBNMl9MT0dfRklMRV9QQVRILFxuICAgICAgICAgIGFwcF9uYW1lOiAnUE0yJyxcbiAgICAgICAgICB0eXBlOiAnUE0yJ1xuICAgICAgICB9XSwgMjAsIGZhbHNlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2BgYCcpXG4gICAgICAgICAgY29uc29sZS5sb2coKVxuICAgICAgICAgIGNvbnNvbGUubG9nKClcblxuICAgICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmJvbGQuZ3JlZW4oJ1BsZWFzZSBjb3B5L3Bhc3RlIHRoZSBhYm92ZSByZXBvcnQgaW4geW91ciBpc3N1ZSBvbiBodHRwczovL2dpdGh1Yi5jb20vVW5pdGVjaC9wbTIvaXNzdWVzJykpO1xuXG4gICAgICAgICAgY29uc29sZS5sb2coKVxuICAgICAgICAgIGNvbnNvbGUubG9nKClcbiAgICAgICAgICB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgQ0xJLnByb3RvdHlwZS5nZXRQSUQgPSBmdW5jdGlvbiAoYXBwX25hbWUsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZiAoYXBwX25hbWUpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYiA9IGFwcF9uYW1lO1xuICAgICAgYXBwX25hbWUgPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBwaWRzID0gW107XG5cbiAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbiAoYXBwKSB7XG4gICAgICAgIGlmICghYXBwX25hbWUgfHwgYXBwX25hbWUgPT0gYXBwLm5hbWUpXG4gICAgICAgICAgcGlkcy5wdXNoKGFwcC5waWQpO1xuICAgICAgfSlcblxuICAgICAgaWYgKCFjYikge1xuICAgICAgICBDb21tb24ucHJpbnRPdXQocGlkcy5qb2luKFwiXFxuXCIpKVxuICAgICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNiKG51bGwsIHBpZHMpO1xuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIFBNMiBtZW1vcnkgc25hcHNob3RcbiAgICogQG1ldGhvZCBnZXRWZXJzaW9uXG4gICAqIEBjYWxsYmFjayBjYlxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5wcm9maWxlID0gZnVuY3Rpb24gKHR5cGUsIHRpbWUsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBkYXlqcyA9IHJlcXVpcmUoJ2RheWpzJyk7XG4gICAgdmFyIGNtZFxuXG4gICAgaWYgKHR5cGUgPT0gJ2NwdScpIHtcbiAgICAgIGNtZCA9IHtcbiAgICAgICAgZXh0OiAnLmNwdXByb2ZpbGUnLFxuICAgICAgICBhY3Rpb246ICdwcm9maWxlQ1BVJ1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZSA9PSAnbWVtJykge1xuICAgICAgY21kID0ge1xuICAgICAgICBleHQ6ICcuaGVhcHByb2ZpbGUnLFxuICAgICAgICBhY3Rpb246ICdwcm9maWxlTUVNJ1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBmaWxlID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGRheWpzKCkuZm9ybWF0KCdkZC1ISDptbTpzcycpICsgY21kLmV4dCk7XG4gICAgdGltZSA9IHRpbWUgfHwgMTAwMDBcblxuICAgIGNvbnNvbGUubG9nKGBTdGFydGluZyAke2NtZC5hY3Rpb259IHByb2ZpbGluZyBmb3IgJHt0aW1lfW1zLi4uYClcbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKGNtZC5hY3Rpb24sIHtcbiAgICAgIHB3ZDogZmlsZSxcbiAgICAgIHRpbWVvdXQ6IHRpbWVcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaSgxKTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGBQcm9maWxlIGRvbmUgaW4gJHtmaWxlfWApXG4gICAgICByZXR1cm4gY2IgPyBjYi5hcHBseShudWxsLCBhcmd1bWVudHMpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH0pO1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gYmFzaWNNREhpZ2hsaWdodChsaW5lcykge1xuICAgIGNvbnNvbGUubG9nKCdcXG5cXG4rLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSsnKVxuICAgIGNvbnNvbGUubG9nKGNoYWxrLmJvbGQoJ1JFQURNRS5tZCBjb250ZW50OicpKVxuICAgIGxpbmVzID0gbGluZXMuc3BsaXQoJ1xcbicpXG4gICAgdmFyIGlzSW5uZXIgPSBmYWxzZVxuICAgIGxpbmVzLmZvckVhY2gobCA9PiB7XG4gICAgICBpZiAobC5zdGFydHNXaXRoKCcjJykpXG4gICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmJvbGQuZ3JlZW4obCkpXG4gICAgICBlbHNlIGlmIChpc0lubmVyIHx8IGwuc3RhcnRzV2l0aCgnYGBgJykpIHtcbiAgICAgICAgaWYgKGlzSW5uZXIgJiYgbC5zdGFydHNXaXRoKCdgYGAnKSlcbiAgICAgICAgICBpc0lubmVyID0gZmFsc2VcbiAgICAgICAgZWxzZSBpZiAoaXNJbm5lciA9PSBmYWxzZSlcbiAgICAgICAgICBpc0lubmVyID0gdHJ1ZVxuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmV5KGwpKVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAobC5zdGFydHNXaXRoKCdgJykpXG4gICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyZXkobCkpXG4gICAgICBlbHNlXG4gICAgICAgIGNvbnNvbGUubG9nKGwpXG4gICAgfSlcbiAgICBjb25zb2xlLmxvZygnKy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0rJylcbiAgfVxuICAvKipcbiAgICogcG0yIGNyZWF0ZSBjb21tYW5kXG4gICAqIGNyZWF0ZSBib2lsZXJwbGF0ZSBvZiBhcHBsaWNhdGlvbiBmb3IgZmFzdCB0cnlcbiAgICogQG1ldGhvZCBib2lsZXJwbGF0ZVxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5ib2lsZXJwbGF0ZSA9IGZ1bmN0aW9uIChjYikge1xuICAgIHZhciBpID0gMFxuICAgIHZhciBwcm9qZWN0cyA9IFtdXG4gICAgdmFyIGVucXVpcmVyID0gcmVxdWlyZSgnZW5xdWlyZXInKVxuXG4gICAgZnMucmVhZGRpcihwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGVzL3NhbXBsZS1hcHBzJyksIChlcnIsIGl0ZW1zKSA9PiB7XG4gICAgICByZXF1aXJlKCdhc3luYycpLmZvckVhY2goaXRlbXMsIChhcHAsIG5leHQpID0+IHtcbiAgICAgICAgdmFyIGZwID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3RlbXBsYXRlcy9zYW1wbGUtYXBwcycsIGFwcClcbiAgICAgICAgZnMucmVhZEZpbGUocGF0aC5qb2luKGZwLCAncGFja2FnZS5qc29uJyksIFwidXRmOFwiLCAoZXJyLCBkdCkgPT4ge1xuICAgICAgICAgIHZhciBtZXRhID0gSlNPTi5wYXJzZShkdClcbiAgICAgICAgICBtZXRhLmZ1bGxwYXRoID0gZnBcbiAgICAgICAgICBtZXRhLmZvbGRlcl9uYW1lID0gYXBwXG4gICAgICAgICAgcHJvamVjdHMucHVzaChtZXRhKVxuICAgICAgICAgIG5leHQoKVxuICAgICAgICB9KVxuICAgICAgfSwgKCkgPT4ge1xuICAgICAgICBjb25zdCBwcm9tcHQgPSBuZXcgZW5xdWlyZXIuU2VsZWN0KHtcbiAgICAgICAgICBuYW1lOiAnYm9pbGVycGxhdGUnLFxuICAgICAgICAgIG1lc3NhZ2U6ICdTZWxlY3QgYSBib2lsZXJwbGF0ZScsXG4gICAgICAgICAgY2hvaWNlczogcHJvamVjdHMubWFwKChwLCBpKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBtZXNzYWdlOiBgJHtjaGFsay5ib2xkLmJsdWUocC5uYW1lKX0gJHtwLmRlc2NyaXB0aW9ufWAsXG4gICAgICAgICAgICAgIHZhbHVlOiBgJHtpfWBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICBwcm9tcHQucnVuKClcbiAgICAgICAgICAudGhlbihhbnN3ZXIgPT4ge1xuICAgICAgICAgICAgdmFyIHAgPSBwcm9qZWN0c1twYXJzZUludChhbnN3ZXIpXVxuICAgICAgICAgICAgYmFzaWNNREhpZ2hsaWdodChmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKHAuZnVsbHBhdGgsICdSRUFETUUubWQnKSkudG9TdHJpbmcoKSlcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmJvbGQoYD4+IFByb2plY3QgY29waWVkIGluc2lkZSBmb2xkZXIgLi8ke3AuZm9sZGVyX25hbWV9L1xcbmApKVxuICAgICAgICAgICAgY29weURpclN5bmMocC5mdWxscGF0aCwgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIHAuZm9sZGVyX25hbWUpKTtcbiAgICAgICAgICAgIHRoaXMuc3RhcnQocGF0aC5qb2luKHAuZnVsbHBhdGgsICdlY29zeXN0ZW0uY29uZmlnLmpzJyksIHtcbiAgICAgICAgICAgICAgY3dkOiBwLmZ1bGxwYXRoXG4gICAgICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB0aGlzLnNwZWVkTGlzdChjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYi5hcHBseShudWxsLCBhcmd1bWVudHMpIDogdGhpcy5zcGVlZExpc3QoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIHNlbmRMaW5lVG9TdGRpblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5zZW5kTGluZVRvU3RkaW4gPSBmdW5jdGlvbiAocG1faWQsIGxpbmUsIHNlcGFyYXRvciwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAoIWNiICYmIHR5cGVvZiAoc2VwYXJhdG9yKSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYiA9IHNlcGFyYXRvcjtcbiAgICAgIHNlcGFyYXRvciA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIHBhY2tldCA9IHtcbiAgICAgIHBtX2lkOiBwbV9pZCxcbiAgICAgIGxpbmU6IGxpbmUgKyAoc2VwYXJhdG9yIHx8ICdcXG4nKVxuICAgIH07XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdzZW5kTGluZVRvU3RkaW4nLCBwYWNrZXQsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyBlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJlcykgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIGF0dGFjaFRvUHJvY2Vzc1xuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5hdHRhY2ggPSBmdW5jdGlvbiAocG1faWQsIHNlcGFyYXRvciwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHJlYWRsaW5lID0gcmVxdWlyZSgncmVhZGxpbmUnKTtcblxuICAgIGlmIChpc05hTihwbV9pZCkpIHtcbiAgICAgIENvbW1vbi5wcmludEVycm9yKCdwbV9pZCBtdXN0IGJlIGEgcHJvY2VzcyBudW1iZXIgKG5vdCBhIHByb2Nlc3MgbmFtZSknKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoJ3BtX2lkIG11c3QgYmUgbnVtYmVyJykpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIChzZXBhcmF0b3IpID09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNiID0gc2VwYXJhdG9yO1xuICAgICAgc2VwYXJhdG9yID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgcmwgPSByZWFkbGluZS5jcmVhdGVJbnRlcmZhY2Uoe1xuICAgICAgaW5wdXQ6IHByb2Nlc3Muc3RkaW4sXG4gICAgICBvdXRwdXQ6IHByb2Nlc3Muc3Rkb3V0XG4gICAgfSk7XG5cbiAgICBybC5vbignY2xvc2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gY2IgPyBjYigpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH0pO1xuXG4gICAgdGhhdC5DbGllbnQubGF1bmNoQnVzKGZ1bmN0aW9uIChlcnIsIGJ1cywgc29ja2V0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICBidXMub24oJ2xvZzoqJywgZnVuY3Rpb24gKHR5cGUsIHBhY2tldCkge1xuICAgICAgICBpZiAocGFja2V0LnByb2Nlc3MucG1faWQgIT09IHBhcnNlSW50KHBtX2lkKSlcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKHBhY2tldC5kYXRhKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmwub24oJ2xpbmUnLCBmdW5jdGlvbiAobGluZSkge1xuICAgICAgdGhhdC5zZW5kTGluZVRvU3RkaW4ocG1faWQsIGxpbmUsIHNlcGFyYXRvciwgZnVuY3Rpb24gKCkgeyB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBzZW5kRGF0YVRvUHJvY2Vzc0lkXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnNlbmREYXRhVG9Qcm9jZXNzSWQgPSBmdW5jdGlvbiAocHJvY19pZCwgcGFja2V0LCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICh0eXBlb2YgcHJvY19pZCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHBhY2tldCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gdGhlIHByb2NfaWQgaXMgcGFja2V0LlxuICAgICAgY2IgPSBwYWNrZXQ7XG4gICAgICBwYWNrZXQgPSBwcm9jX2lkO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYWNrZXQuaWQgPSBwcm9jX2lkO1xuICAgIH1cblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ3NlbmREYXRhVG9Qcm9jZXNzSWQnLCBwYWNrZXQsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIENvbW1vbi5wcmludE91dCgnc3VjY2Vzc2Z1bGx5IHNlbnQgZGF0YSB0byBwcm9jZXNzJyk7XG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsLCByZXMpIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogVXNlZCBmb3IgY3VzdG9tIGFjdGlvbnMsIGFsbG93cyB0byB0cmlnZ2VyIGZ1bmN0aW9uIGluc2lkZSBhbiBhcHBcbiAgICogVG8gZXhwb3NlIGEgZnVuY3Rpb24geW91IG5lZWQgdG8gdXNlIGtleW1ldHJpY3MvcG14XG4gICAqXG4gICAqIEBtZXRob2QgbXNnUHJvY2Vzc1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgICAgICAgICAgIHByb2Nlc3MgaWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IGFjdGlvbl9uYW1lICBmdW5jdGlvbiBuYW1lIHRvIHRyaWdnZXJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRzLm9wdHNdICBvYmplY3QgcGFzc2VkIGFzIGZpcnN0IGFyZyBvZiB0aGUgZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IFt1dWlkXSAgICAgICBvcHRpb25hbCB1bmlxdWUgaWRlbnRpZmllciB3aGVuIGxvZ3MgYXJlIGVtaXR0ZWRcbiAgICpcbiAgICovXG4gIENMSS5wcm90b3R5cGUubXNnUHJvY2VzcyA9IGZ1bmN0aW9uIChvcHRzLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ21zZ1Byb2Nlc3MnLCBvcHRzLCBjYik7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgYSBQTVggY3VzdG9tIGFjdGlvbiBpbiB0YXJnZXQgYXBwbGljYXRpb25cbiAgICogQ3VzdG9tIGFjdGlvbnMgYWxsb3dzIHRvIGludGVyYWN0IHdpdGggYW4gYXBwbGljYXRpb25cbiAgICpcbiAgICogQG1ldGhvZCB0cmlnZ2VyXG4gICAqIEBwYXJhbSAge1N0cmluZ3xOdW1iZXJ9IHBtX2lkICAgICAgIHByb2Nlc3MgaWQgb3IgYXBwbGljYXRpb24gbmFtZVxuICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgICAgICBhY3Rpb25fbmFtZSBuYW1lIG9mIHRoZSBjdXN0b20gYWN0aW9uIHRvIHRyaWdnZXJcbiAgICogQHBhcmFtICB7TWl4ZWR9ICAgICAgICAgcGFyYW1zICAgICAgcGFyYW1ldGVyIHRvIHBhc3MgdG8gdGFyZ2V0IGFjdGlvblxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gICAgICBjYiAgICAgICAgICBjYWxsYmFja1xuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24gKHBtX2lkLCBhY3Rpb25fbmFtZSwgcGFyYW1zLCBjYikge1xuICAgIGlmICh0eXBlb2YgKHBhcmFtcykgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNiID0gcGFyYW1zO1xuICAgICAgcGFyYW1zID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIGNtZDogYW55ID0ge1xuICAgICAgbXNnOiBhY3Rpb25fbmFtZVxuICAgIH07XG4gICAgdmFyIGNvdW50ZXIgPSAwO1xuICAgIHZhciBwcm9jZXNzX3dhaXRfY291bnQgPSAwO1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuXG4gICAgaWYgKHBhcmFtcylcbiAgICAgIGNtZC5vcHRzID0gcGFyYW1zO1xuICAgIGlmIChpc05hTihwbV9pZCkpXG4gICAgICBjbWQubmFtZSA9IHBtX2lkO1xuICAgIGVsc2VcbiAgICAgIGNtZC5pZCA9IHBtX2lkO1xuXG4gICAgdGhpcy5sYXVuY2hCdXMoZnVuY3Rpb24gKGVyciwgYnVzKSB7XG4gICAgICBidXMub24oJ2F4bTpyZXBseScsIGZ1bmN0aW9uIChyZXQpIHtcbiAgICAgICAgaWYgKHJldC5wcm9jZXNzLm5hbWUgPT0gcG1faWQgfHwgcmV0LnByb2Nlc3MucG1faWQgPT0gcG1faWQgfHwgcmV0LnByb2Nlc3MubmFtZXNwYWNlID09IHBtX2lkIHx8IHBtX2lkID09ICdhbGwnKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHJldCk7XG4gICAgICAgICAgQ29tbW9uLnByaW50T3V0KCdbJXM6JXM6JXNdPSVqJywgcmV0LnByb2Nlc3MubmFtZSwgcmV0LnByb2Nlc3MucG1faWQsIHJldC5wcm9jZXNzLm5hbWVzcGFjZSwgcmV0LmRhdGEucmV0dXJuKTtcbiAgICAgICAgICBpZiAoKytjb3VudGVyID09IHByb2Nlc3Nfd2FpdF9jb3VudClcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJlc3VsdHMpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdGhhdC5tc2dQcm9jZXNzKGNtZCwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnByb2Nlc3NfY291bnQgPT0gMCkge1xuICAgICAgICAgIENvbW1vbi5wcmludEVycm9yKCdOb3QgYW55IHByb2Nlc3MgaGFzIHJlY2VpdmVkIGEgY29tbWFuZCAob2ZmbGluZSBvciB1bmV4aXN0ZW50KScpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoJ1Vua25vd24gcHJvY2VzcycpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9jZXNzX3dhaXRfY291bnQgPSBkYXRhLnByb2Nlc3NfY291bnQ7XG4gICAgICAgIENvbW1vbi5wcmludE91dChjaGFsay5ib2xkKCclcyBwcm9jZXNzZXMgaGF2ZSByZWNlaXZlZCBjb21tYW5kICVzJyksXG4gICAgICAgICAgZGF0YS5wcm9jZXNzX2NvdW50LCBhY3Rpb25fbmFtZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBzZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZVxuICAgKiBAcGFyYW0ge30gc2lnbmFsXG4gICAqIEBwYXJhbSB7fSBwcm9jZXNzX25hbWVcbiAgICogQHJldHVyblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5zZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZSA9IGZ1bmN0aW9uIChzaWduYWwsIHByb2Nlc3NfbmFtZSwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdzZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZScsIHtcbiAgICAgIHNpZ25hbDogc2lnbmFsLFxuICAgICAgcHJvY2Vzc19uYW1lOiBwcm9jZXNzX25hbWVcbiAgICB9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgQ29tbW9uLnByaW50T3V0KCdzdWNjZXNzZnVsbHkgc2VudCBzaWduYWwgJXMgdG8gcHJvY2VzcyBuYW1lICVzJywgc2lnbmFsLCBwcm9jZXNzX25hbWUpO1xuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgbGlzdCkgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIHNlbmRTaWduYWxUb1Byb2Nlc3NJZFxuICAgKiBAcGFyYW0ge30gc2lnbmFsXG4gICAqIEBwYXJhbSB7fSBwcm9jZXNzX2lkXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUuc2VuZFNpZ25hbFRvUHJvY2Vzc0lkID0gZnVuY3Rpb24gKHNpZ25hbCwgcHJvY2Vzc19pZCwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdzZW5kU2lnbmFsVG9Qcm9jZXNzSWQnLCB7XG4gICAgICBzaWduYWw6IHNpZ25hbCxcbiAgICAgIHByb2Nlc3NfaWQ6IHByb2Nlc3NfaWRcbiAgICB9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgQ29tbW9uLnByaW50T3V0KCdzdWNjZXNzZnVsbHkgc2VudCBzaWduYWwgJXMgdG8gcHJvY2VzcyBpZCAlcycsIHNpZ25hbCwgcHJvY2Vzc19pZCk7XG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBsaXN0KSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEFQSSBtZXRob2QgdG8gbGF1bmNoIGEgcHJvY2VzcyB0aGF0IHdpbGwgc2VydmUgZGlyZWN0b3J5IG92ZXIgaHR0cFxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5hdXRvaW5zdGFsbCA9IGZ1bmN0aW9uIChjYikge1xuICAgIHZhciBmaWxlcGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUobW9kdWxlLmZpbGVuYW1lKSwgJy4uL1N5c2luZm8vU2VydmljZURldGVjdGlvbi9TZXJ2aWNlRGV0ZWN0aW9uLmpzJyk7XG5cbiAgICB0aGlzLnN0YXJ0KGZpbGVwYXRoLCAoZXJyLCByZXMpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgJ0Vycm9yIHdoaWxlIHRyeWluZyB0byBzZXJ2ZSA6ICcgKyBlcnIubWVzc2FnZSB8fCBlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIpIDogdGhpcy5zcGVlZExpc3QoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCkgOiB0aGlzLnNwZWVkTGlzdCgpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFQSSBtZXRob2QgdG8gbGF1bmNoIGEgcHJvY2VzcyB0aGF0IHdpbGwgc2VydmUgZGlyZWN0b3J5IG92ZXIgaHR0cFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyBvcHRpb25zXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnBhdGggcGF0aCB0byBiZSBzZXJ2ZWRcbiAgICogQHBhcmFtIHtOdW1iZXJ9IG9wdHMucG9ydCBwb3J0IG9uIHdoaWNoIGh0dHAgd2lsbCBiaW5kXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0cy5zcGEgc2luZ2xlIHBhZ2UgYXBwIHNlcnZlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5iYXNpY0F1dGhVc2VybmFtZSBiYXNpYyBhdXRoIHVzZXJuYW1lXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLmJhc2ljQXV0aFBhc3N3b3JkIGJhc2ljIGF1dGggcGFzc3dvcmRcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbW1hbmRlciBjb21tYW5kZXIgb2JqZWN0XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIG9wdGlvbmFsIGNhbGxiYWNrXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnNlcnZlID0gZnVuY3Rpb24gKHRhcmdldF9wYXRoLCBwb3J0LCBvcHRzLCBjb21tYW5kZXIsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBzZXJ2ZVBvcnQgPSBwcm9jZXNzLmVudi5QTTJfU0VSVkVfUE9SVCB8fCBwb3J0IHx8IDgwODA7XG4gICAgdmFyIHNlcnZlUGF0aCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmVudi5QTTJfU0VSVkVfUEFUSCB8fCB0YXJnZXRfcGF0aCB8fCAnLicpO1xuXG4gICAgdmFyIGZpbGVwYXRoID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShtb2R1bGUuZmlsZW5hbWUpLCAnLi9TZXJ2ZS5qcycpO1xuXG4gICAgaWYgKHR5cGVvZiBjb21tYW5kZXIubmFtZSA9PT0gJ3N0cmluZycpXG4gICAgICBvcHRzLm5hbWUgPSBjb21tYW5kZXIubmFtZVxuICAgIGVsc2VcbiAgICAgIG9wdHMubmFtZSA9ICdzdGF0aWMtcGFnZS1zZXJ2ZXItJyArIHNlcnZlUG9ydFxuICAgIGlmICghb3B0cy5lbnYpXG4gICAgICBvcHRzLmVudiA9IHt9O1xuICAgIG9wdHMuZW52LlBNMl9TRVJWRV9QT1JUID0gc2VydmVQb3J0O1xuICAgIG9wdHMuZW52LlBNMl9TRVJWRV9QQVRIID0gc2VydmVQYXRoO1xuICAgIG9wdHMuZW52LlBNMl9TRVJWRV9TUEEgPSBvcHRzLnNwYTtcbiAgICBpZiAob3B0cy5iYXNpY0F1dGhVc2VybmFtZSAmJiBvcHRzLmJhc2ljQXV0aFBhc3N3b3JkKSB7XG4gICAgICBvcHRzLmVudi5QTTJfU0VSVkVfQkFTSUNfQVVUSCA9ICd0cnVlJztcbiAgICAgIG9wdHMuZW52LlBNMl9TRVJWRV9CQVNJQ19BVVRIX1VTRVJOQU1FID0gb3B0cy5iYXNpY0F1dGhVc2VybmFtZTtcbiAgICAgIG9wdHMuZW52LlBNMl9TRVJWRV9CQVNJQ19BVVRIX1BBU1NXT1JEID0gb3B0cy5iYXNpY0F1dGhQYXNzd29yZDtcbiAgICB9XG4gICAgaWYgKG9wdHMubW9uaXRvcikge1xuICAgICAgb3B0cy5lbnYuUE0yX1NFUlZFX01PTklUT1IgPSBvcHRzLm1vbml0b3JcbiAgICB9XG4gICAgb3B0cy5jd2QgPSBzZXJ2ZVBhdGg7XG5cbiAgICB0aGlzLnN0YXJ0KGZpbGVwYXRoLCBvcHRzLCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgJ0Vycm9yIHdoaWxlIHRyeWluZyB0byBzZXJ2ZSA6ICcgKyBlcnIubWVzc2FnZSB8fCBlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihlcnIpIDogdGhhdC5zcGVlZExpc3QoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1NlcnZpbmcgJyArIHNlcnZlUGF0aCArICcgb24gcG9ydCAnICsgc2VydmVQb3J0KTtcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJlcykgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFBpbmcgZGFlbW9uIC0gaWYgUE0yIGRhZW1vbiBub3QgbGF1bmNoZWQsIGl0IHdpbGwgbGF1bmNoIGl0XG4gICAqIEBtZXRob2QgcGluZ1xuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5waW5nID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgncGluZycsIHt9LCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIENvbW1vbi5wcmludE91dChyZXMpO1xuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgcmVzKSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIHJlbW90ZSBjb21tYW5kXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnJlbW90ZSA9IGZ1bmN0aW9uIChjb21tYW5kLCBvcHRzLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoYXRbY29tbWFuZF0ob3B0cy5uYW1lLCBmdW5jdGlvbiAoZXJyX2NtZCwgcmV0KSB7XG4gICAgICBpZiAoZXJyX2NtZClcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJfY21kKTtcbiAgICAgIGNvbnNvbGUubG9nKCdDb21tYW5kICVzIGZpbmlzaGVkJywgY29tbWFuZCk7XG4gICAgICByZXR1cm4gY2IoZXJyX2NtZCwgcmV0KTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogVGhpcyByZW1vdGUgbWV0aG9kIGFsbG93cyB0byBwYXNzIG11bHRpcGxlIGFyZ3VtZW50c1xuICAgKiB0byBQTTJcbiAgICogSXQgaXMgdXNlZCBmb3IgdGhlIG5ldyBzY29wZWQgUE0yIGFjdGlvbiBzeXN0ZW1cbiAgICovXG4gIENMSS5wcm90b3R5cGUucmVtb3RlVjIgPSBmdW5jdGlvbiAoY29tbWFuZCwgb3B0cywgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAodGhhdFtjb21tYW5kXS5sZW5ndGggPT0gMSlcbiAgICAgIHJldHVybiB0aGF0W2NvbW1hbmRdKGNiKTtcblxuICAgIG9wdHMuYXJncy5wdXNoKGNiKTtcbiAgICByZXR1cm4gdGhhdFtjb21tYW5kXS5hcHBseSh0aGlzLCBvcHRzLmFyZ3MpO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uXG4gICAqIEBtZXRob2QgZ2VuZXJhdGVTYW1wbGVcbiAgICogQHBhcmFtIHt9IG5hbWVcbiAgICogQHJldHVyblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5nZW5lcmF0ZVNhbXBsZSA9IGZ1bmN0aW9uIChtb2RlKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciB0ZW1wbGF0ZVBhdGg7XG5cbiAgICBpZiAobW9kZSA9PSAnc2ltcGxlJylcbiAgICAgIHRlbXBsYXRlUGF0aCA9IHBhdGguam9pbihjc3QuVEVNUExBVEVfRk9MREVSLCBjc3QuQVBQX0NPTkZfVFBMX1NJTVBMRSk7XG4gICAgZWxzZVxuICAgICAgdGVtcGxhdGVQYXRoID0gcGF0aC5qb2luKGNzdC5URU1QTEFURV9GT0xERVIsIGNzdC5BUFBfQ09ORl9UUEwpO1xuXG4gICAgdmFyIHNhbXBsZSA9IGZzLnJlYWRGaWxlU3luYyh0ZW1wbGF0ZVBhdGgpO1xuICAgIHZhciBkdCA9IHNhbXBsZS50b1N0cmluZygpO1xuICAgIHZhciBmX25hbWUgPSAnZWNvc3lzdGVtLmNvbmZpZy5qcyc7XG4gICAgdmFyIHB3ZCA9IHByb2Nlc3MuZW52LlBXRCB8fCBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKHB3ZCwgZl9uYW1lKSwgZHQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgIH1cbiAgICBDb21tb24ucHJpbnRPdXQoJ0ZpbGUgJXMgZ2VuZXJhdGVkJywgcGF0aC5qb2luKHB3ZCwgZl9uYW1lKSk7XG4gICAgdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIGRhc2hib2FyZFxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmRhc2hib2FyZCA9IGZ1bmN0aW9uIChjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHZhciBEYXNoYm9hcmQgPSByZXF1aXJlKCcuL0Rhc2hib2FyZCcpO1xuXG4gICAgaWYgKGNiKVxuICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcignRGFzaGJvYXJkIGNhbnQgYmUgY2FsbGVkIHByb2dyYW1tYXRpY2FsbHknKSk7XG5cbiAgICBEYXNoYm9hcmQuaW5pdCgpO1xuXG4gICAgdGhpcy5DbGllbnQubGF1bmNoQnVzKGZ1bmN0aW9uIChlcnIsIGJ1cykge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsYXVuY2hCdXM6ICcgKyBlcnIpO1xuICAgICAgICB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgYnVzLm9uKCdsb2c6KicsIGZ1bmN0aW9uICh0eXBlLCBkYXRhKSB7XG4gICAgICAgIERhc2hib2FyZC5sb2codHlwZSwgZGF0YSlcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICBwcm9jZXNzLm9uKCdTSUdJTlQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLkNsaWVudC5kaXNjb25uZWN0QnVzKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcHJvY2Vzcy5leGl0KGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiByZWZyZXNoRGFzaGJvYXJkKCkge1xuICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24gKGVyciwgbGlzdCkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcmV0cmlldmluZyBwcm9jZXNzIGxpc3Q6ICcgKyBlcnIpO1xuICAgICAgICAgIHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cblxuICAgICAgICBEYXNoYm9hcmQucmVmcmVzaChsaXN0KTtcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZWZyZXNoRGFzaGJvYXJkKCk7XG4gICAgICAgIH0sIDgwMCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZWZyZXNoRGFzaGJvYXJkKCk7XG4gIH07XG5cbiAgQ0xJLnByb3RvdHlwZS5tb25pdCA9IGZ1bmN0aW9uIChjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHZhciBNb25pdCA9IHJlcXVpcmUoJy4vTW9uaXQuanMnKTtcblxuICAgIGlmIChjYikgcmV0dXJuIGNiKG5ldyBFcnJvcignTW9uaXQgY2FudCBiZSBjYWxsZWQgcHJvZ3JhbW1hdGljYWxseScpKTtcblxuICAgIE1vbml0LmluaXQoKTtcblxuICAgIGZ1bmN0aW9uIGxhdW5jaE1vbml0b3IoKSB7XG4gICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICAgICAgdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuXG4gICAgICAgIE1vbml0LnJlZnJlc2gobGlzdCk7XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgbGF1bmNoTW9uaXRvcigpO1xuICAgICAgICB9LCA0MDApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbGF1bmNoTW9uaXRvcigpO1xuICB9O1xuXG4gIENMSS5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIChhcHBfbmFtZSwgY2IpIHtcbiAgICBjb25zdCB0aGF0ID0gdGhpcztcbiAgICBpZiAoc2VtdmVyLnNhdGlzZmllcyhwcm9jZXNzLnZlcnNpb25zLm5vZGUsICc+PSA4LjAuMCcpKSB7XG4gICAgICB0aGlzLnRyaWdnZXIoYXBwX25hbWUsICdpbnRlcm5hbDppbnNwZWN0JywgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG5cbiAgICAgICAgaWYgKHJlcyAmJiByZXNbMF0pIHtcbiAgICAgICAgICBpZiAocmVzWzBdLmRhdGEucmV0dXJuID09PSAnJykge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGBJbnNwZWN0IGRpc2FibGVkIG9uICR7YXBwX25hbWV9YCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChgSW5zcGVjdCBlbmFibGVkIG9uICR7YXBwX25hbWV9ID0+IGdvIHRvIGNocm9tZSA6IGNocm9tZTovL2luc3BlY3QgISEhYCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChgVW5hYmxlIHRvIGFjdGl2YXRlIGluc3BlY3QgbW9kZSBvbiAke2FwcF9uYW1lfSAhISFgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBDb21tb24ucHJpbnRPdXQoJ0luc3BlY3QgaXMgYXZhaWxhYmxlIGZvciBub2RlIHZlcnNpb24gPj04LnggIScpO1xuICAgICAgdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH1cbiAgfTtcbn07XG4iXX0=