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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvRXh0cmEudHMiXSwibmFtZXMiOlsiQ0xJIiwicHJvdG90eXBlIiwiZ2V0VmVyc2lvbiIsImNiIiwidGhhdCIsIkNsaWVudCIsImV4ZWN1dGVSZW1vdGUiLCJlcnIiLCJhcHBseSIsImFyZ3VtZW50cyIsImV4aXRDbGkiLCJjc3QiLCJTVUNDRVNTX0VYSVQiLCJsYXVuY2hTeXNNb25pdG9yaW5nIiwic2V0IiwiQ29tbW9uIiwibG9nIiwiZW52IiwiYXBwX2lkIiwicHJvY3MiLCJwcmludGVkIiwibGlzdCIsImZvckVhY2giLCJsIiwicG1faWQiLCJzYWZlRXh0ZW5kIiwicG0yX2VudiIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJjb25zb2xlIiwiY2hhbGsiLCJncmVlbiIsIkVSUk9SX0VYSVQiLCJyZXBvcnQiLCJmbXQiLCJ0aXRsZSIsImZpZWxkIiwiRGF0ZSIsInNlcCIsImJvbGQiLCJibHVlIiwicG0yX3ZlcnNpb24iLCJub2RlX3ZlcnNpb24iLCJub2RlX3BhdGgiLCJhcmd2IiwiYXJndjAiLCJ1c2VyIiwidWlkIiwiZ2lkIiwiZGlmZiIsInN0YXJ0ZWRfYXQiLCJwa2ciLCJ2ZXJzaW9uIiwicHJvY2VzcyIsInZlcnNpb25zIiwibm9kZSIsIlVTRVIiLCJMTkFNRSIsIlVTRVJOQU1FIiwiSVNfV0lORE9XUyIsImdldGV1aWQiLCJnZXRlZ2lkIiwib3MiLCJyZXF1aXJlIiwiYXJjaCIsInBsYXRmb3JtIiwidHlwZSIsImNwdXMiLCJtb2RlbCIsImxlbmd0aCIsImZyZWVtZW0iLCJ0b3RhbG1lbSIsImhvbWVkaXIiLCJVWCIsImdsX2ludGVyYWN0X2luZm9zIiwiTG9nIiwidGFpbCIsInBhdGgiLCJQTTJfTE9HX0ZJTEVfUEFUSCIsImFwcF9uYW1lIiwiZ2V0UElEIiwicHJpbnRFcnJvciIsIlBSRUZJWF9NU0dfRVJSIiwicmV0RXJyIiwicGlkcyIsImFwcCIsIm5hbWUiLCJwdXNoIiwicGlkIiwicHJpbnRPdXQiLCJqb2luIiwicHJvZmlsZSIsInRpbWUiLCJkYXlqcyIsImNtZCIsImV4dCIsImFjdGlvbiIsImZpbGUiLCJjd2QiLCJmb3JtYXQiLCJwd2QiLCJ0aW1lb3V0IiwiZXJyb3IiLCJiYXNpY01ESGlnaGxpZ2h0IiwibGluZXMiLCJzcGxpdCIsImlzSW5uZXIiLCJzdGFydHNXaXRoIiwiZ3JleSIsImJvaWxlcnBsYXRlIiwiaSIsInByb2plY3RzIiwiZW5xdWlyZXIiLCJmcyIsInJlYWRkaXIiLCJfX2Rpcm5hbWUiLCJpdGVtcyIsIm5leHQiLCJmcCIsInJlYWRGaWxlIiwiZHQiLCJtZXRhIiwiSlNPTiIsInBhcnNlIiwiZnVsbHBhdGgiLCJmb2xkZXJfbmFtZSIsInByb21wdCIsIlNlbGVjdCIsIm1lc3NhZ2UiLCJjaG9pY2VzIiwibWFwIiwicCIsImRlc2NyaXB0aW9uIiwidmFsdWUiLCJydW4iLCJ0aGVuIiwiYW5zd2VyIiwicGFyc2VJbnQiLCJyZWFkRmlsZVN5bmMiLCJ0b1N0cmluZyIsInN0YXJ0Iiwic3BlZWRMaXN0IiwiZSIsInNlbmRMaW5lVG9TdGRpbiIsImxpbmUiLCJzZXBhcmF0b3IiLCJwYWNrZXQiLCJyZXMiLCJhdHRhY2giLCJyZWFkbGluZSIsImlzTmFOIiwicmwiLCJjcmVhdGVJbnRlcmZhY2UiLCJpbnB1dCIsInN0ZGluIiwib3V0cHV0Iiwic3Rkb3V0Iiwib24iLCJsYXVuY2hCdXMiLCJidXMiLCJzb2NrZXQiLCJ3cml0ZSIsImRhdGEiLCJzZW5kRGF0YVRvUHJvY2Vzc0lkIiwicHJvY19pZCIsImlkIiwibXNnUHJvY2VzcyIsIm9wdHMiLCJ0cmlnZ2VyIiwiYWN0aW9uX25hbWUiLCJwYXJhbXMiLCJtc2ciLCJjb3VudGVyIiwicHJvY2Vzc193YWl0X2NvdW50IiwicmVzdWx0cyIsInJldCIsIm5hbWVzcGFjZSIsInByb2Nlc3NfY291bnQiLCJzZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZSIsInNpZ25hbCIsInByb2Nlc3NfbmFtZSIsInNlbmRTaWduYWxUb1Byb2Nlc3NJZCIsInByb2Nlc3NfaWQiLCJhdXRvaW5zdGFsbCIsImZpbGVwYXRoIiwicmVzb2x2ZSIsImRpcm5hbWUiLCJtb2R1bGUiLCJmaWxlbmFtZSIsInNlcnZlIiwidGFyZ2V0X3BhdGgiLCJwb3J0IiwiY29tbWFuZGVyIiwic2VydmVQb3J0IiwiUE0yX1NFUlZFX1BPUlQiLCJzZXJ2ZVBhdGgiLCJQTTJfU0VSVkVfUEFUSCIsIlBNMl9TRVJWRV9TUEEiLCJzcGEiLCJiYXNpY0F1dGhVc2VybmFtZSIsImJhc2ljQXV0aFBhc3N3b3JkIiwiUE0yX1NFUlZFX0JBU0lDX0FVVEgiLCJQTTJfU0VSVkVfQkFTSUNfQVVUSF9VU0VSTkFNRSIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIX1BBU1NXT1JEIiwibW9uaXRvciIsIlBNMl9TRVJWRV9NT05JVE9SIiwiUFJFRklYX01TRyIsInBpbmciLCJFcnJvciIsInJlbW90ZSIsImNvbW1hbmQiLCJlcnJfY21kIiwicmVtb3RlVjIiLCJhcmdzIiwiZ2VuZXJhdGVTYW1wbGUiLCJtb2RlIiwidGVtcGxhdGVQYXRoIiwiVEVNUExBVEVfRk9MREVSIiwiQVBQX0NPTkZfVFBMX1NJTVBMRSIsIkFQUF9DT05GX1RQTCIsInNhbXBsZSIsImZfbmFtZSIsIlBXRCIsIndyaXRlRmlsZVN5bmMiLCJzdGFjayIsImRhc2hib2FyZCIsIkRhc2hib2FyZCIsImluaXQiLCJkaXNjb25uZWN0QnVzIiwiZXhpdCIsInJlZnJlc2hEYXNoYm9hcmQiLCJyZWZyZXNoIiwic2V0VGltZW91dCIsIm1vbml0IiwiTW9uaXQiLCJsYXVuY2hNb25pdG9yIiwiaW5zcGVjdCIsInNlbXZlciIsInNhdGlzZmllcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQU1BOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQW5CQTs7Ozs7QUFxQmUsa0JBQVVBLEdBQVYsRUFBZTtBQUM1Qjs7Ozs7QUFLQUEsRUFBQUEsR0FBRyxDQUFDQyxTQUFK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QXRGLE1BQUFBLElBQUksQ0FBQ00sT0FBTCxDQUFhQyxzQkFBSUMsWUFBakI7QUFDRDtBQUNGLEdBckJEO0FBc0JEOztBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICpcbiAqIEV4dHJhIG1ldGhvZHNcbiAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmltcG9ydCBjc3QgZnJvbSAnLi4vLi4vY29uc3RhbnRzJztcbmltcG9ydCBDb21tb24gZnJvbSAnLi4vQ29tbW9uJztcbmltcG9ydCBVWCBmcm9tICcuL1VYJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBmbXQgZnJvbSAnLi4vdG9vbHMvZm10JztcbmltcG9ydCBkYXlqcyBmcm9tICdkYXlqcyc7XG5pbXBvcnQgcGtnIGZyb20gJy4uLy4uL3BhY2thZ2UuanNvbic7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgY29weURpclN5bmMgZnJvbSAnLi4vdG9vbHMvY29weWRpclN5bmMnXG5pbXBvcnQgTG9nIGZyb20gJy4vTG9nJztcbmltcG9ydCBEYXNoYm9hcmQgZnJvbSAnLi9EYXNoYm9hcmQnO1xuaW1wb3J0IE1vbml0IGZyb20gJy4vTW9uaXQnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoQ0xJKSB7XG4gIC8qKlxuICAgKiBHZXQgdmVyc2lvbiBvZiB0aGUgZGFlbW9uaXplZCBQTTJcbiAgICogQG1ldGhvZCBnZXRWZXJzaW9uXG4gICAqIEBjYWxsYmFjayBjYlxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5nZXRWZXJzaW9uID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0VmVyc2lvbicsIHt9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gY2IgPyBjYi5hcHBseShudWxsLCBhcmd1bWVudHMpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQgdmVyc2lvbiBvZiB0aGUgZGFlbW9uaXplZCBQTTJcbiAgICogQG1ldGhvZCBnZXRWZXJzaW9uXG4gICAqIEBjYWxsYmFjayBjYlxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5sYXVuY2hTeXNNb25pdG9yaW5nID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdGhpcy5zZXQoJ3BtMjpzeXNtb25pdCcsICd0cnVlJywgKCkgPT4ge1xuICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnbGF1bmNoU3lzTW9uaXRvcmluZycsIHt9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgQ29tbW9uLmVycihlcnIpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBDb21tb24ubG9nKCdTeXN0ZW0gTW9uaXRvcmluZyBsYXVuY2hlZCcpXG4gICAgICAgIHJldHVybiBjYiA/IGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9KVxuICAgIH0pXG4gIH07XG5cbiAgLyoqXG4gICAqIFNob3cgYXBwbGljYXRpb24gZW52aXJvbm1lbnRcbiAgICogQG1ldGhvZCBlbnZcbiAgICogQGNhbGxiYWNrIGNiXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmVudiA9IGZ1bmN0aW9uIChhcHBfaWQsIGNiKSB7XG4gICAgdmFyIHByb2NzID0gW11cbiAgICB2YXIgcHJpbnRlZCA9IDBcblxuICAgIHRoaXMuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldE1vbml0b3JEYXRhJywge30sIChlcnIsIGxpc3QpID0+IHtcbiAgICAgIGxpc3QuZm9yRWFjaChsID0+IHtcbiAgICAgICAgaWYgKGFwcF9pZCA9PSBsLnBtX2lkKSB7XG4gICAgICAgICAgcHJpbnRlZCsrXG4gICAgICAgICAgdmFyIGVudiA9IENvbW1vbi5zYWZlRXh0ZW5kKHt9LCBsLnBtMl9lbnYpXG4gICAgICAgICAgT2JqZWN0LmtleXMoZW52KS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgJHtrZXl9OiAke2NoYWxrLmdyZWVuKGVudltrZXldKX1gKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGlmIChwcmludGVkID09IDApIHtcbiAgICAgICAgQ29tbW9uLmVycihgTW9kdWxlcyB3aXRoIGlkICR7YXBwX2lkfSBub3QgZm91bmRgKVxuICAgICAgICByZXR1cm4gY2IgPyBjYi5hcHBseShudWxsLCBhcmd1bWVudHMpIDogdGhpcy5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjYiA/IGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB0aGlzLmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgfSlcbiAgfTtcblxuICAvKipcbiAgICogR2V0IHZlcnNpb24gb2YgdGhlIGRhZW1vbml6ZWQgUE0yXG4gICAqIEBtZXRob2QgZ2V0VmVyc2lvblxuICAgKiBAY2FsbGJhY2sgY2JcbiAgICovXG4gIENMSS5wcm90b3R5cGUucmVwb3J0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ2dldFJlcG9ydCcsIHt9LCBmdW5jdGlvbiAoZXJyLCByZXBvcnQpIHtcbiAgICAgIGNvbnNvbGUubG9nKClcbiAgICAgIGNvbnNvbGUubG9nKClcbiAgICAgIGNvbnNvbGUubG9nKClcbiAgICAgIGNvbnNvbGUubG9nKCdgYGAnKVxuICAgICAgZm10LnRpdGxlKCdQTTIgcmVwb3J0JylcbiAgICAgIGZtdC5maWVsZCgnRGF0ZScsIG5ldyBEYXRlKCkpO1xuICAgICAgZm10LnNlcCgpO1xuICAgICAgZm10LnRpdGxlKGNoYWxrLmJvbGQuYmx1ZSgnRGFlbW9uJykpO1xuICAgICAgZm10LmZpZWxkKCdwbTJkIHZlcnNpb24nLCByZXBvcnQucG0yX3ZlcnNpb24pO1xuICAgICAgZm10LmZpZWxkKCdub2RlIHZlcnNpb24nLCByZXBvcnQubm9kZV92ZXJzaW9uKTtcbiAgICAgIGZtdC5maWVsZCgnbm9kZSBwYXRoJywgcmVwb3J0Lm5vZGVfcGF0aCk7XG4gICAgICBmbXQuZmllbGQoJ2FyZ3YnLCByZXBvcnQuYXJndik7XG4gICAgICBmbXQuZmllbGQoJ2FyZ3YwJywgcmVwb3J0LmFyZ3YwKTtcbiAgICAgIGZtdC5maWVsZCgndXNlcicsIHJlcG9ydC51c2VyKTtcbiAgICAgIGZtdC5maWVsZCgndWlkJywgcmVwb3J0LnVpZCk7XG4gICAgICBmbXQuZmllbGQoJ2dpZCcsIHJlcG9ydC5naWQpO1xuICAgICAgZm10LmZpZWxkKCd1cHRpbWUnLCBkYXlqcyhuZXcgRGF0ZSgpKS5kaWZmKHJlcG9ydC5zdGFydGVkX2F0LCAnbWludXRlJykgKyAnbWluJyk7XG5cbiAgICAgIGZtdC5zZXAoKTtcbiAgICAgIGZtdC50aXRsZShjaGFsay5ib2xkLmJsdWUoJ0NMSScpKTtcbiAgICAgIGZtdC5maWVsZCgnbG9jYWwgcG0yJywgcGtnLnZlcnNpb24pO1xuICAgICAgZm10LmZpZWxkKCdub2RlIHZlcnNpb24nLCBwcm9jZXNzLnZlcnNpb25zLm5vZGUpO1xuICAgICAgZm10LmZpZWxkKCdub2RlIHBhdGgnLCBwcm9jZXNzLmVudlsnXyddIHx8ICdub3QgZm91bmQnKTtcbiAgICAgIGZtdC5maWVsZCgnYXJndicsIHByb2Nlc3MuYXJndik7XG4gICAgICBmbXQuZmllbGQoJ2FyZ3YwJywgcHJvY2Vzcy5hcmd2MCk7XG4gICAgICBmbXQuZmllbGQoJ3VzZXInLCBwcm9jZXNzLmVudi5VU0VSIHx8IHByb2Nlc3MuZW52LkxOQU1FIHx8IHByb2Nlc3MuZW52LlVTRVJOQU1FKTtcbiAgICAgIGlmIChjc3QuSVNfV0lORE9XUyA9PT0gZmFsc2UgJiYgcHJvY2Vzcy5nZXRldWlkKVxuICAgICAgICBmbXQuZmllbGQoJ3VpZCcsIHByb2Nlc3MuZ2V0ZXVpZCgpKTtcbiAgICAgIGlmIChjc3QuSVNfV0lORE9XUyA9PT0gZmFsc2UgJiYgcHJvY2Vzcy5nZXRlZ2lkKVxuICAgICAgICBmbXQuZmllbGQoJ2dpZCcsIHByb2Nlc3MuZ2V0ZWdpZCgpKTtcblxuICAgICAgdmFyIG9zID0gcmVxdWlyZSgnb3MnKTtcblxuICAgICAgZm10LnNlcCgpO1xuICAgICAgZm10LnRpdGxlKGNoYWxrLmJvbGQuYmx1ZSgnU3lzdGVtIGluZm8nKSk7XG4gICAgICBmbXQuZmllbGQoJ2FyY2gnLCBvcy5hcmNoKCkpO1xuICAgICAgZm10LmZpZWxkKCdwbGF0Zm9ybScsIG9zLnBsYXRmb3JtKCkpO1xuICAgICAgZm10LmZpZWxkKCd0eXBlJywgb3MudHlwZSgpKTtcbiAgICAgIGZtdC5maWVsZCgnY3B1cycsIG9zLmNwdXMoKVswXS5tb2RlbCk7XG4gICAgICBmbXQuZmllbGQoJ2NwdXMgbmInLCBPYmplY3Qua2V5cyhvcy5jcHVzKCkpLmxlbmd0aCk7XG4gICAgICBmbXQuZmllbGQoJ2ZyZWVtZW0nLCBvcy5mcmVlbWVtKCkpO1xuICAgICAgZm10LmZpZWxkKCd0b3RhbG1lbScsIG9zLnRvdGFsbWVtKCkpO1xuICAgICAgZm10LmZpZWxkKCdob21lJywgb3MuaG9tZWRpcigpKTtcblxuICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24gKGVyciwgbGlzdCkge1xuXG4gICAgICAgIGZtdC5zZXAoKTtcbiAgICAgICAgZm10LnRpdGxlKGNoYWxrLmJvbGQuYmx1ZSgnUE0yIGxpc3QnKSk7XG4gICAgICAgIFVYLmxpc3QobGlzdCwgdGhhdC5nbF9pbnRlcmFjdF9pbmZvcyk7XG5cbiAgICAgICAgZm10LnNlcCgpO1xuICAgICAgICBmbXQudGl0bGUoY2hhbGsuYm9sZC5ibHVlKCdEYWVtb24gbG9ncycpKTtcbiAgICAgICAgTG9nLnRhaWwoW3tcbiAgICAgICAgICBwYXRoOiBjc3QuUE0yX0xPR19GSUxFX1BBVEgsXG4gICAgICAgICAgYXBwX25hbWU6ICdQTTInLFxuICAgICAgICAgIHR5cGU6ICdQTTInXG4gICAgICAgIH1dLCAyMCwgZmFsc2UsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYGBgJylcbiAgICAgICAgICBjb25zb2xlLmxvZygpXG4gICAgICAgICAgY29uc29sZS5sb2coKVxuXG4gICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuYm9sZC5ncmVlbignUGxlYXNlIGNvcHkvcGFzdGUgdGhlIGFib3ZlIHJlcG9ydCBpbiB5b3VyIGlzc3VlIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9Vbml0ZWNoL3BtMi9pc3N1ZXMnKSk7XG5cbiAgICAgICAgICBjb25zb2xlLmxvZygpXG4gICAgICAgICAgY29uc29sZS5sb2coKVxuICAgICAgICAgIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICBDTEkucHJvdG90eXBlLmdldFBJRCA9IGZ1bmN0aW9uIChhcHBfbmFtZSwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIChhcHBfbmFtZSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNiID0gYXBwX25hbWU7XG4gICAgICBhcHBfbmFtZSA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24gKGVyciwgbGlzdCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyBlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHBpZHMgPSBbXTtcblxuICAgICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChhcHApIHtcbiAgICAgICAgaWYgKCFhcHBfbmFtZSB8fCBhcHBfbmFtZSA9PSBhcHAubmFtZSlcbiAgICAgICAgICBwaWRzLnB1c2goYXBwLnBpZCk7XG4gICAgICB9KVxuXG4gICAgICBpZiAoIWNiKSB7XG4gICAgICAgIENvbW1vbi5wcmludE91dChwaWRzLmpvaW4oXCJcXG5cIikpXG4gICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2IobnVsbCwgcGlkcyk7XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgUE0yIG1lbW9yeSBzbmFwc2hvdFxuICAgKiBAbWV0aG9kIGdldFZlcnNpb25cbiAgICogQGNhbGxiYWNrIGNiXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnByb2ZpbGUgPSBmdW5jdGlvbiAodHlwZSwgdGltZSwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIGRheWpzID0gcmVxdWlyZSgnZGF5anMnKTtcbiAgICB2YXIgY21kXG5cbiAgICBpZiAodHlwZSA9PSAnY3B1Jykge1xuICAgICAgY21kID0ge1xuICAgICAgICBleHQ6ICcuY3B1cHJvZmlsZScsXG4gICAgICAgIGFjdGlvbjogJ3Byb2ZpbGVDUFUnXG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlID09ICdtZW0nKSB7XG4gICAgICBjbWQgPSB7XG4gICAgICAgIGV4dDogJy5oZWFwcHJvZmlsZScsXG4gICAgICAgIGFjdGlvbjogJ3Byb2ZpbGVNRU0nXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGZpbGUgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgZGF5anMoKS5mb3JtYXQoJ2RkLUhIOm1tOnNzJykgKyBjbWQuZXh0KTtcbiAgICB0aW1lID0gdGltZSB8fCAxMDAwMFxuXG4gICAgY29uc29sZS5sb2coYFN0YXJ0aW5nICR7Y21kLmFjdGlvbn0gcHJvZmlsaW5nIGZvciAke3RpbWV9bXMuLi5gKVxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoY21kLmFjdGlvbiwge1xuICAgICAgcHdkOiBmaWxlLFxuICAgICAgdGltZW91dDogdGltZVxuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKDEpO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coYFByb2ZpbGUgZG9uZSBpbiAke2ZpbGV9YClcbiAgICAgIHJldHVybiBjYiA/IGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgfSk7XG4gIH07XG5cblxuICBmdW5jdGlvbiBiYXNpY01ESGlnaGxpZ2h0KGxpbmVzKSB7XG4gICAgY29uc29sZS5sb2coJ1xcblxcbistLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKycpXG4gICAgY29uc29sZS5sb2coY2hhbGsuYm9sZCgnUkVBRE1FLm1kIGNvbnRlbnQ6JykpXG4gICAgbGluZXMgPSBsaW5lcy5zcGxpdCgnXFxuJylcbiAgICB2YXIgaXNJbm5lciA9IGZhbHNlXG4gICAgbGluZXMuZm9yRWFjaChsID0+IHtcbiAgICAgIGlmIChsLnN0YXJ0c1dpdGgoJyMnKSlcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuYm9sZC5ncmVlbihsKSlcbiAgICAgIGVsc2UgaWYgKGlzSW5uZXIgfHwgbC5zdGFydHNXaXRoKCdgYGAnKSkge1xuICAgICAgICBpZiAoaXNJbm5lciAmJiBsLnN0YXJ0c1dpdGgoJ2BgYCcpKVxuICAgICAgICAgIGlzSW5uZXIgPSBmYWxzZVxuICAgICAgICBlbHNlIGlmIChpc0lubmVyID09IGZhbHNlKVxuICAgICAgICAgIGlzSW5uZXIgPSB0cnVlXG4gICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyZXkobCkpXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChsLnN0YXJ0c1dpdGgoJ2AnKSlcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JleShsKSlcbiAgICAgIGVsc2VcbiAgICAgICAgY29uc29sZS5sb2cobClcbiAgICB9KVxuICAgIGNvbnNvbGUubG9nKCcrLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSsnKVxuICB9XG4gIC8qKlxuICAgKiBwbTIgY3JlYXRlIGNvbW1hbmRcbiAgICogY3JlYXRlIGJvaWxlcnBsYXRlIG9mIGFwcGxpY2F0aW9uIGZvciBmYXN0IHRyeVxuICAgKiBAbWV0aG9kIGJvaWxlcnBsYXRlXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmJvaWxlcnBsYXRlID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgdmFyIGkgPSAwXG4gICAgdmFyIHByb2plY3RzID0gW11cbiAgICB2YXIgZW5xdWlyZXIgPSByZXF1aXJlKCdlbnF1aXJlcicpXG5cbiAgICBmcy5yZWFkZGlyKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi90ZW1wbGF0ZXMvc2FtcGxlLWFwcHMnKSwgKGVyciwgaXRlbXMpID0+IHtcbiAgICAgIHJlcXVpcmUoJ2FzeW5jJykuZm9yRWFjaChpdGVtcywgKGFwcCwgbmV4dCkgPT4ge1xuICAgICAgICB2YXIgZnAgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGVzL3NhbXBsZS1hcHBzJywgYXBwKVxuICAgICAgICBmcy5yZWFkRmlsZShwYXRoLmpvaW4oZnAsICdwYWNrYWdlLmpzb24nKSwgXCJ1dGY4XCIsIChlcnIsIGR0KSA9PiB7XG4gICAgICAgICAgdmFyIG1ldGEgPSBKU09OLnBhcnNlKGR0KVxuICAgICAgICAgIG1ldGEuZnVsbHBhdGggPSBmcFxuICAgICAgICAgIG1ldGEuZm9sZGVyX25hbWUgPSBhcHBcbiAgICAgICAgICBwcm9qZWN0cy5wdXNoKG1ldGEpXG4gICAgICAgICAgbmV4dCgpXG4gICAgICAgIH0pXG4gICAgICB9LCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHByb21wdCA9IG5ldyBlbnF1aXJlci5TZWxlY3Qoe1xuICAgICAgICAgIG5hbWU6ICdib2lsZXJwbGF0ZScsXG4gICAgICAgICAgbWVzc2FnZTogJ1NlbGVjdCBhIGJvaWxlcnBsYXRlJyxcbiAgICAgICAgICBjaG9pY2VzOiBwcm9qZWN0cy5tYXAoKHAsIGkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGAke2NoYWxrLmJvbGQuYmx1ZShwLm5hbWUpfSAke3AuZGVzY3JpcHRpb259YCxcbiAgICAgICAgICAgICAgdmFsdWU6IGAke2l9YFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHByb21wdC5ydW4oKVxuICAgICAgICAgIC50aGVuKGFuc3dlciA9PiB7XG4gICAgICAgICAgICB2YXIgcCA9IHByb2plY3RzW3BhcnNlSW50KGFuc3dlcildXG4gICAgICAgICAgICBiYXNpY01ESGlnaGxpZ2h0KGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4ocC5mdWxscGF0aCwgJ1JFQURNRS5tZCcpKS50b1N0cmluZygpKVxuICAgICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuYm9sZChgPj4gUHJvamVjdCBjb3BpZWQgaW5zaWRlIGZvbGRlciAuLyR7cC5mb2xkZXJfbmFtZX0vXFxuYCkpXG4gICAgICAgICAgICBjb3B5RGlyU3luYyhwLmZ1bGxwYXRoLCBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgcC5mb2xkZXJfbmFtZSkpO1xuICAgICAgICAgICAgdGhpcy5zdGFydChwYXRoLmpvaW4ocC5mdWxscGF0aCwgJ2Vjb3N5c3RlbS5jb25maWcuanMnKSwge1xuICAgICAgICAgICAgICBjd2Q6IHAuZnVsbHBhdGhcbiAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IuYXBwbHkobnVsbCwgYXJndW1lbnRzKSA6IHRoaXMuc3BlZWRMaXN0KGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cykgOiB0aGlzLnNwZWVkTGlzdChjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uXG4gICAqIEBtZXRob2Qgc2VuZExpbmVUb1N0ZGluXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnNlbmRMaW5lVG9TdGRpbiA9IGZ1bmN0aW9uIChwbV9pZCwgbGluZSwgc2VwYXJhdG9yLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICghY2IgJiYgdHlwZW9mIChzZXBhcmF0b3IpID09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNiID0gc2VwYXJhdG9yO1xuICAgICAgc2VwYXJhdG9yID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgcGFja2V0ID0ge1xuICAgICAgcG1faWQ6IHBtX2lkLFxuICAgICAgbGluZTogbGluZSArIChzZXBhcmF0b3IgfHwgJ1xcbicpXG4gICAgfTtcblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ3NlbmRMaW5lVG9TdGRpbicsIHBhY2tldCwgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QUkVGSVhfTVNHX0VSUiArIGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgcmVzKSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uXG4gICAqIEBtZXRob2QgYXR0YWNoVG9Qcm9jZXNzXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uIChwbV9pZCwgc2VwYXJhdG9yLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgcmVhZGxpbmUgPSByZXF1aXJlKCdyZWFkbGluZScpO1xuXG4gICAgaWYgKGlzTmFOKHBtX2lkKSkge1xuICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ3BtX2lkIG11c3QgYmUgYSBwcm9jZXNzIG51bWJlciAobm90IGEgcHJvY2VzcyBuYW1lKScpO1xuICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycigncG1faWQgbXVzdCBiZSBudW1iZXInKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgKHNlcGFyYXRvcikgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2IgPSBzZXBhcmF0b3I7XG4gICAgICBzZXBhcmF0b3IgPSBudWxsO1xuICAgIH1cblxuICAgIHZhciBybCA9IHJlYWRsaW5lLmNyZWF0ZUludGVyZmFjZSh7XG4gICAgICBpbnB1dDogcHJvY2Vzcy5zdGRpbixcbiAgICAgIG91dHB1dDogcHJvY2Vzcy5zdGRvdXRcbiAgICB9KTtcblxuICAgIHJsLm9uKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjYiA/IGNiKCkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgfSk7XG5cbiAgICB0aGF0LkNsaWVudC5sYXVuY2hCdXMoZnVuY3Rpb24gKGVyciwgYnVzLCBzb2NrZXQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIGJ1cy5vbignbG9nOionLCBmdW5jdGlvbiAodHlwZSwgcGFja2V0KSB7XG4gICAgICAgIGlmIChwYWNrZXQucHJvY2Vzcy5wbV9pZCAhPT0gcGFyc2VJbnQocG1faWQpKVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUocGFja2V0LmRhdGEpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBybC5vbignbGluZScsIGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICB0aGF0LnNlbmRMaW5lVG9TdGRpbihwbV9pZCwgbGluZSwgc2VwYXJhdG9yLCBmdW5jdGlvbiAoKSB7IH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIHNlbmREYXRhVG9Qcm9jZXNzSWRcbiAgICovXG4gIENMSS5wcm90b3R5cGUuc2VuZERhdGFUb1Byb2Nlc3NJZCA9IGZ1bmN0aW9uIChwcm9jX2lkLCBwYWNrZXQsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jX2lkID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcGFja2V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyB0aGUgcHJvY19pZCBpcyBwYWNrZXQuXG4gICAgICBjYiA9IHBhY2tldDtcbiAgICAgIHBhY2tldCA9IHByb2NfaWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhY2tldC5pZCA9IHByb2NfaWQ7XG4gICAgfVxuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnc2VuZERhdGFUb1Byb2Nlc3NJZCcsIHBhY2tldCwgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgQ29tbW9uLnByaW50T3V0KCdzdWNjZXNzZnVsbHkgc2VudCBkYXRhIHRvIHByb2Nlc3MnKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHJlcykgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBVc2VkIGZvciBjdXN0b20gYWN0aW9ucywgYWxsb3dzIHRvIHRyaWdnZXIgZnVuY3Rpb24gaW5zaWRlIGFuIGFwcFxuICAgKiBUbyBleHBvc2UgYSBmdW5jdGlvbiB5b3UgbmVlZCB0byB1c2Uga2V5bWV0cmljcy9wbXhcbiAgICpcbiAgICogQG1ldGhvZCBtc2dQcm9jZXNzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBpZCAgICAgICAgICAgcHJvY2VzcyBpZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gYWN0aW9uX25hbWUgIGZ1bmN0aW9uIG5hbWUgdG8gdHJpZ2dlclxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdHMub3B0c10gIG9iamVjdCBwYXNzZWQgYXMgZmlyc3QgYXJnIG9mIHRoZSBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gW3V1aWRdICAgICAgIG9wdGlvbmFsIHVuaXF1ZSBpZGVudGlmaWVyIHdoZW4gbG9ncyBhcmUgZW1pdHRlZFxuICAgKlxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5tc2dQcm9jZXNzID0gZnVuY3Rpb24gKG9wdHMsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnbXNnUHJvY2VzcycsIG9wdHMsIGNiKTtcbiAgfTtcblxuICAvKipcbiAgICogVHJpZ2dlciBhIFBNWCBjdXN0b20gYWN0aW9uIGluIHRhcmdldCBhcHBsaWNhdGlvblxuICAgKiBDdXN0b20gYWN0aW9ucyBhbGxvd3MgdG8gaW50ZXJhY3Qgd2l0aCBhbiBhcHBsaWNhdGlvblxuICAgKlxuICAgKiBAbWV0aG9kIHRyaWdnZXJcbiAgICogQHBhcmFtICB7U3RyaW5nfE51bWJlcn0gcG1faWQgICAgICAgcHJvY2VzcyBpZCBvciBhcHBsaWNhdGlvbiBuYW1lXG4gICAqIEBwYXJhbSAge1N0cmluZ30gICAgICAgIGFjdGlvbl9uYW1lIG5hbWUgb2YgdGhlIGN1c3RvbSBhY3Rpb24gdG8gdHJpZ2dlclxuICAgKiBAcGFyYW0gIHtNaXhlZH0gICAgICAgICBwYXJhbXMgICAgICBwYXJhbWV0ZXIgdG8gcGFzcyB0byB0YXJnZXQgYWN0aW9uXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSAgICAgIGNiICAgICAgICAgIGNhbGxiYWNrXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbiAocG1faWQsIGFjdGlvbl9uYW1lLCBwYXJhbXMsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiAocGFyYW1zKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2IgPSBwYXJhbXM7XG4gICAgICBwYXJhbXMgPSBudWxsO1xuICAgIH1cbiAgICB2YXIgY21kOiBhbnkgPSB7XG4gICAgICBtc2c6IGFjdGlvbl9uYW1lXG4gICAgfTtcbiAgICB2YXIgY291bnRlciA9IDA7XG4gICAgdmFyIHByb2Nlc3Nfd2FpdF9jb3VudCA9IDA7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciByZXN1bHRzID0gW107XG5cbiAgICBpZiAocGFyYW1zKVxuICAgICAgY21kLm9wdHMgPSBwYXJhbXM7XG4gICAgaWYgKGlzTmFOKHBtX2lkKSlcbiAgICAgIGNtZC5uYW1lID0gcG1faWQ7XG4gICAgZWxzZVxuICAgICAgY21kLmlkID0gcG1faWQ7XG5cbiAgICB0aGlzLmxhdW5jaEJ1cyhmdW5jdGlvbiAoZXJyLCBidXMpIHtcbiAgICAgIGJ1cy5vbignYXhtOnJlcGx5JywgZnVuY3Rpb24gKHJldCkge1xuICAgICAgICBpZiAocmV0LnByb2Nlc3MubmFtZSA9PSBwbV9pZCB8fCByZXQucHJvY2Vzcy5wbV9pZCA9PSBwbV9pZCB8fCByZXQucHJvY2Vzcy5uYW1lc3BhY2UgPT0gcG1faWQgfHwgcG1faWQgPT0gJ2FsbCcpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gocmV0KTtcbiAgICAgICAgICBDb21tb24ucHJpbnRPdXQoJ1slczolczolc109JWonLCByZXQucHJvY2Vzcy5uYW1lLCByZXQucHJvY2Vzcy5wbV9pZCwgcmV0LnByb2Nlc3MubmFtZXNwYWNlLCByZXQuZGF0YS5yZXR1cm4pO1xuICAgICAgICAgIGlmICgrK2NvdW50ZXIgPT0gcHJvY2Vzc193YWl0X2NvdW50KVxuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgcmVzdWx0cykgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0aGF0Lm1zZ1Byb2Nlc3MoY21kLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEucHJvY2Vzc19jb3VudCA9PSAwKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ05vdCBhbnkgcHJvY2VzcyBoYXMgcmVjZWl2ZWQgYSBjb21tYW5kIChvZmZsaW5lIG9yIHVuZXhpc3RlbnQpJyk7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycignVW5rbm93biBwcm9jZXNzJykpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb2Nlc3Nfd2FpdF9jb3VudCA9IGRhdGEucHJvY2Vzc19jb3VudDtcbiAgICAgICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQoJyVzIHByb2Nlc3NlcyBoYXZlIHJlY2VpdmVkIGNvbW1hbmQgJXMnKSxcbiAgICAgICAgICBkYXRhLnByb2Nlc3NfY291bnQsIGFjdGlvbl9uYW1lKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvblxuICAgKiBAbWV0aG9kIHNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lXG4gICAqIEBwYXJhbSB7fSBzaWduYWxcbiAgICogQHBhcmFtIHt9IHByb2Nlc3NfbmFtZVxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lID0gZnVuY3Rpb24gKHNpZ25hbCwgcHJvY2Vzc19uYW1lLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ3NlbmRTaWduYWxUb1Byb2Nlc3NOYW1lJywge1xuICAgICAgc2lnbmFsOiBzaWduYWwsXG4gICAgICBwcm9jZXNzX25hbWU6IHByb2Nlc3NfbmFtZVxuICAgIH0sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgICBDb21tb24ucHJpbnRPdXQoJ3N1Y2Nlc3NmdWxseSBzZW50IHNpZ25hbCAlcyB0byBwcm9jZXNzIG5hbWUgJXMnLCBzaWduYWwsIHByb2Nlc3NfbmFtZSk7XG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBsaXN0KSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uXG4gICAqIEBtZXRob2Qgc2VuZFNpZ25hbFRvUHJvY2Vzc0lkXG4gICAqIEBwYXJhbSB7fSBzaWduYWxcbiAgICogQHBhcmFtIHt9IHByb2Nlc3NfaWRcbiAgICogQHJldHVyblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5zZW5kU2lnbmFsVG9Qcm9jZXNzSWQgPSBmdW5jdGlvbiAoc2lnbmFsLCBwcm9jZXNzX2lkLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoJ3NlbmRTaWduYWxUb1Byb2Nlc3NJZCcsIHtcbiAgICAgIHNpZ25hbDogc2lnbmFsLFxuICAgICAgcHJvY2Vzc19pZDogcHJvY2Vzc19pZFxuICAgIH0sIGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgICBDb21tb24ucHJpbnRPdXQoJ3N1Y2Nlc3NmdWxseSBzZW50IHNpZ25hbCAlcyB0byBwcm9jZXNzIGlkICVzJywgc2lnbmFsLCBwcm9jZXNzX2lkKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIGxpc3QpIDogdGhhdC5zcGVlZExpc3QoKTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQVBJIG1ldGhvZCB0byBsYXVuY2ggYSBwcm9jZXNzIHRoYXQgd2lsbCBzZXJ2ZSBkaXJlY3Rvcnkgb3ZlciBodHRwXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmF1dG9pbnN0YWxsID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgdmFyIGZpbGVwYXRoID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShtb2R1bGUuZmlsZW5hbWUpLCAnLi4vU3lzaW5mby9TZXJ2aWNlRGV0ZWN0aW9uL1NlcnZpY2VEZXRlY3Rpb24uanMnKTtcblxuICAgIHRoaXMuc3RhcnQoZmlsZXBhdGgsIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyAnRXJyb3Igd2hpbGUgdHJ5aW5nIHRvIHNlcnZlIDogJyArIGVyci5tZXNzYWdlIHx8IGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKGVycikgOiB0aGlzLnNwZWVkTGlzdChjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsKSA6IHRoaXMuc3BlZWRMaXN0KCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQVBJIG1ldGhvZCB0byBsYXVuY2ggYSBwcm9jZXNzIHRoYXQgd2lsbCBzZXJ2ZSBkaXJlY3Rvcnkgb3ZlciBodHRwXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIG9wdGlvbnNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMucGF0aCBwYXRoIHRvIGJlIHNlcnZlZFxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0cy5wb3J0IHBvcnQgb24gd2hpY2ggaHR0cCB3aWxsIGJpbmRcbiAgICogQHBhcmFtIHtCb29sZWFufSBvcHRzLnNwYSBzaW5nbGUgcGFnZSBhcHAgc2VydmVkXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLmJhc2ljQXV0aFVzZXJuYW1lIGJhc2ljIGF1dGggdXNlcm5hbWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuYmFzaWNBdXRoUGFzc3dvcmQgYmFzaWMgYXV0aCBwYXNzd29yZFxuICAgKiBAcGFyYW0ge09iamVjdH0gY29tbWFuZGVyIGNvbW1hbmRlciBvYmplY3RcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2Igb3B0aW9uYWwgY2FsbGJhY2tcbiAgICovXG4gIENMSS5wcm90b3R5cGUuc2VydmUgPSBmdW5jdGlvbiAodGFyZ2V0X3BhdGgsIHBvcnQsIG9wdHMsIGNvbW1hbmRlciwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHNlcnZlUG9ydCA9IHByb2Nlc3MuZW52LlBNMl9TRVJWRV9QT1JUIHx8IHBvcnQgfHwgODA4MDtcbiAgICB2YXIgc2VydmVQYXRoID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuZW52LlBNMl9TRVJWRV9QQVRIIHx8IHRhcmdldF9wYXRoIHx8ICcuJyk7XG5cbiAgICB2YXIgZmlsZXBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKG1vZHVsZS5maWxlbmFtZSksICcuL1NlcnZlLmpzJyk7XG5cbiAgICBpZiAodHlwZW9mIGNvbW1hbmRlci5uYW1lID09PSAnc3RyaW5nJylcbiAgICAgIG9wdHMubmFtZSA9IGNvbW1hbmRlci5uYW1lXG4gICAgZWxzZVxuICAgICAgb3B0cy5uYW1lID0gJ3N0YXRpYy1wYWdlLXNlcnZlci0nICsgc2VydmVQb3J0XG4gICAgaWYgKCFvcHRzLmVudilcbiAgICAgIG9wdHMuZW52ID0ge307XG4gICAgb3B0cy5lbnYuUE0yX1NFUlZFX1BPUlQgPSBzZXJ2ZVBvcnQ7XG4gICAgb3B0cy5lbnYuUE0yX1NFUlZFX1BBVEggPSBzZXJ2ZVBhdGg7XG4gICAgb3B0cy5lbnYuUE0yX1NFUlZFX1NQQSA9IG9wdHMuc3BhO1xuICAgIGlmIChvcHRzLmJhc2ljQXV0aFVzZXJuYW1lICYmIG9wdHMuYmFzaWNBdXRoUGFzc3dvcmQpIHtcbiAgICAgIG9wdHMuZW52LlBNMl9TRVJWRV9CQVNJQ19BVVRIID0gJ3RydWUnO1xuICAgICAgb3B0cy5lbnYuUE0yX1NFUlZFX0JBU0lDX0FVVEhfVVNFUk5BTUUgPSBvcHRzLmJhc2ljQXV0aFVzZXJuYW1lO1xuICAgICAgb3B0cy5lbnYuUE0yX1NFUlZFX0JBU0lDX0FVVEhfUEFTU1dPUkQgPSBvcHRzLmJhc2ljQXV0aFBhc3N3b3JkO1xuICAgIH1cbiAgICBpZiAob3B0cy5tb25pdG9yKSB7XG4gICAgICBvcHRzLmVudi5QTTJfU0VSVkVfTU9OSVRPUiA9IG9wdHMubW9uaXRvclxuICAgIH1cbiAgICBvcHRzLmN3ZCA9IHNlcnZlUGF0aDtcblxuICAgIHRoaXMuc3RhcnQoZmlsZXBhdGgsIG9wdHMsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyAnRXJyb3Igd2hpbGUgdHJ5aW5nIHRvIHNlcnZlIDogJyArIGVyci5tZXNzYWdlIHx8IGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKGVycikgOiB0aGF0LnNwZWVkTGlzdChjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG4gICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnU2VydmluZyAnICsgc2VydmVQYXRoICsgJyBvbiBwb3J0ICcgKyBzZXJ2ZVBvcnQpO1xuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgcmVzKSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUGluZyBkYWVtb24gLSBpZiBQTTIgZGFlbW9uIG5vdCBsYXVuY2hlZCwgaXQgd2lsbCBsYXVuY2ggaXRcbiAgICogQG1ldGhvZCBwaW5nXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnBpbmcgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdwaW5nJywge30sIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihuZXcgRXJyb3IoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgQ29tbW9uLnByaW50T3V0KHJlcyk7XG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsLCByZXMpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH0pO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgcmVtb3RlIGNvbW1hbmRcbiAgICovXG4gIENMSS5wcm90b3R5cGUucmVtb3RlID0gZnVuY3Rpb24gKGNvbW1hbmQsIG9wdHMsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdGhhdFtjb21tYW5kXShvcHRzLm5hbWUsIGZ1bmN0aW9uIChlcnJfY21kLCByZXQpIHtcbiAgICAgIGlmIChlcnJfY21kKVxuICAgICAgICBjb25zb2xlLmVycm9yKGVycl9jbWQpO1xuICAgICAgY29uc29sZS5sb2coJ0NvbW1hbmQgJXMgZmluaXNoZWQnLCBjb21tYW5kKTtcbiAgICAgIHJldHVybiBjYihlcnJfY21kLCByZXQpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUaGlzIHJlbW90ZSBtZXRob2QgYWxsb3dzIHRvIHBhc3MgbXVsdGlwbGUgYXJndW1lbnRzXG4gICAqIHRvIFBNMlxuICAgKiBJdCBpcyB1c2VkIGZvciB0aGUgbmV3IHNjb3BlZCBQTTIgYWN0aW9uIHN5c3RlbVxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5yZW1vdGVWMiA9IGZ1bmN0aW9uIChjb21tYW5kLCBvcHRzLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICh0aGF0W2NvbW1hbmRdLmxlbmd0aCA9PSAxKVxuICAgICAgcmV0dXJuIHRoYXRbY29tbWFuZF0oY2IpO1xuXG4gICAgb3B0cy5hcmdzLnB1c2goY2IpO1xuICAgIHJldHVybiB0aGF0W2NvbW1hbmRdLmFwcGx5KHRoaXMsIG9wdHMuYXJncyk7XG4gIH07XG5cblxuICAvKipcbiAgICogRGVzY3JpcHRpb25cbiAgICogQG1ldGhvZCBnZW5lcmF0ZVNhbXBsZVxuICAgKiBAcGFyYW0ge30gbmFtZVxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmdlbmVyYXRlU2FtcGxlID0gZnVuY3Rpb24gKG1vZGUpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHRlbXBsYXRlUGF0aDtcblxuICAgIGlmIChtb2RlID09ICdzaW1wbGUnKVxuICAgICAgdGVtcGxhdGVQYXRoID0gcGF0aC5qb2luKGNzdC5URU1QTEFURV9GT0xERVIsIGNzdC5BUFBfQ09ORl9UUExfU0lNUExFKTtcbiAgICBlbHNlXG4gICAgICB0ZW1wbGF0ZVBhdGggPSBwYXRoLmpvaW4oY3N0LlRFTVBMQVRFX0ZPTERFUiwgY3N0LkFQUF9DT05GX1RQTCk7XG5cbiAgICB2YXIgc2FtcGxlID0gZnMucmVhZEZpbGVTeW5jKHRlbXBsYXRlUGF0aCk7XG4gICAgdmFyIGR0ID0gc2FtcGxlLnRvU3RyaW5nKCk7XG4gICAgdmFyIGZfbmFtZSA9ICdlY29zeXN0ZW0uY29uZmlnLmpzJztcbiAgICB2YXIgcHdkID0gcHJvY2Vzcy5lbnYuUFdEIHx8IHByb2Nlc3MuY3dkKCk7XG5cbiAgICB0cnkge1xuICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ocHdkLCBmX25hbWUpLCBkdCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrIHx8IGUpO1xuICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgfVxuICAgIENvbW1vbi5wcmludE91dCgnRmlsZSAlcyBnZW5lcmF0ZWQnLCBwYXRoLmpvaW4ocHdkLCBmX25hbWUpKTtcbiAgICB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uXG4gICAqIEBtZXRob2QgZGFzaGJvYXJkXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUuZGFzaGJvYXJkID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKGNiKVxuICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcignRGFzaGJvYXJkIGNhbnQgYmUgY2FsbGVkIHByb2dyYW1tYXRpY2FsbHknKSk7XG5cbiAgICBEYXNoYm9hcmQuaW5pdCgpO1xuXG4gICAgdGhpcy5DbGllbnQubGF1bmNoQnVzKGZ1bmN0aW9uIChlcnIsIGJ1cykge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsYXVuY2hCdXM6ICcgKyBlcnIpO1xuICAgICAgICB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgYnVzLm9uKCdsb2c6KicsIGZ1bmN0aW9uICh0eXBlLCBkYXRhKSB7XG4gICAgICAgIERhc2hib2FyZC5sb2codHlwZSwgZGF0YSlcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICBwcm9jZXNzLm9uKCdTSUdJTlQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLkNsaWVudC5kaXNjb25uZWN0QnVzKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcHJvY2Vzcy5leGl0KGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiByZWZyZXNoRGFzaGJvYXJkKCkge1xuICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24gKGVyciwgbGlzdCkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcmV0cmlldmluZyBwcm9jZXNzIGxpc3Q6ICcgKyBlcnIpO1xuICAgICAgICAgIHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cblxuICAgICAgICBEYXNoYm9hcmQucmVmcmVzaChsaXN0KTtcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZWZyZXNoRGFzaGJvYXJkKCk7XG4gICAgICAgIH0sIDgwMCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZWZyZXNoRGFzaGJvYXJkKCk7XG4gIH07XG5cbiAgQ0xJLnByb3RvdHlwZS5tb25pdCA9IGZ1bmN0aW9uIChjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmIChjYikgcmV0dXJuIGNiKG5ldyBFcnJvcignTW9uaXQgY2FudCBiZSBjYWxsZWQgcHJvZ3JhbW1hdGljYWxseScpKTtcblxuICAgIE1vbml0LmluaXQoKTtcblxuICAgIGZ1bmN0aW9uIGxhdW5jaE1vbml0b3IoKSB7XG4gICAgICB0aGF0LkNsaWVudC5leGVjdXRlUmVtb3RlKCdnZXRNb25pdG9yRGF0YScsIHt9LCBmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdDogJyArIGVycik7XG4gICAgICAgICAgdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuXG4gICAgICAgIE1vbml0LnJlZnJlc2gobGlzdCk7XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgbGF1bmNoTW9uaXRvcigpO1xuICAgICAgICB9LCA0MDApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbGF1bmNoTW9uaXRvcigpO1xuICB9O1xuXG4gIENMSS5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIChhcHBfbmFtZSwgY2IpIHtcbiAgICBjb25zdCB0aGF0ID0gdGhpcztcbiAgICBpZiAoc2VtdmVyLnNhdGlzZmllcyhwcm9jZXNzLnZlcnNpb25zLm5vZGUsICc+PSA4LjAuMCcpKSB7XG4gICAgICB0aGlzLnRyaWdnZXIoYXBwX25hbWUsICdpbnRlcm5hbDppbnNwZWN0JywgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG5cbiAgICAgICAgaWYgKHJlcyAmJiByZXNbMF0pIHtcbiAgICAgICAgICBpZiAocmVzWzBdLmRhdGEucmV0dXJuID09PSAnJykge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGBJbnNwZWN0IGRpc2FibGVkIG9uICR7YXBwX25hbWV9YCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIENvbW1vbi5wcmludE91dChgSW5zcGVjdCBlbmFibGVkIG9uICR7YXBwX25hbWV9ID0+IGdvIHRvIGNocm9tZSA6IGNocm9tZTovL2luc3BlY3QgISEhYCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIENvbW1vbi5wcmludE91dChgVW5hYmxlIHRvIGFjdGl2YXRlIGluc3BlY3QgbW9kZSBvbiAke2FwcF9uYW1lfSAhISFgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBDb21tb24ucHJpbnRPdXQoJ0luc3BlY3QgaXMgYXZhaWxhYmxlIGZvciBub2RlIHZlcnNpb24gPj04LnggIScpO1xuICAgICAgdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH1cbiAgfTtcbn07XG4iXX0=