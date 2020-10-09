'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _constants = _interopRequireDefault(require("../../constants"));

var _commander = _interopRequireDefault(require("commander"));

var _chalk = _interopRequireDefault(require("chalk"));

var _forEachLimit = _interopRequireDefault(require("async/forEachLimit"));

var _debug = _interopRequireDefault(require("debug"));

var _API = _interopRequireDefault(require("../API"));

var _package = _interopRequireDefault(require("../../package.json"));

var tabtab = _interopRequireWildcard(require("../completion"));

var _Common = _interopRequireDefault(require("../Common"));

var _PM2IO = _interopRequireDefault(require("../API/pm2-plus/PM2IO"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

process.env.PM2_USAGE = 'CLI';
var debug = (0, _debug["default"])('pm2:cli');

_Common["default"].determineSilentCLI();

_Common["default"].printVersion();

var pm2 = new _API["default"]();

_PM2IO["default"].usePM2Client(pm2);

_commander["default"].version(_package["default"].version).option('-v --version', 'print pm2 version').option('-s --silent', 'hide all messages', false).option('--ext <extensions>', 'watch only this file extensions').option('-n --name <name>', 'set a name for the process in the process list').option('-m --mini-list', 'display a compacted list without formatting').option('--interpreter <interpreter>', 'set a specific interpreter to use for executing app, default: node').option('--interpreter-args <arguments>', 'set arguments to pass to the interpreter (alias of --node-args)').option('--node-args <node_args>', 'space delimited arguments to pass to node').option('-o --output <path>', 'specify log file for stdout').option('-e --error <path>', 'specify log file for stderr').option('-l --log [path]', 'specify log file which gathers both stdout and stderr').option('--filter-env [envs]', 'filter out outgoing global values that contain provided strings', function (v, m) {
  m.push(v);
  return m;
}, []).option('--log-type <type>', 'specify log output style (raw by default, json optional)').option('--log-date-format <date format>', 'add custom prefix timestamp to logs').option('--time', 'enable time logging').option('--disable-logs', 'disable all logs storage').option('--env <environment_name>', 'specify which set of environment variables from ecosystem file must be injected').option('-a --update-env', 'force an update of the environment with restart/reload (-a <=> apply)').option('-f --force', 'force actions').option('-i --instances <number>', 'launch [number] instances (for networked app)(load balanced)').option('--parallel <number>', 'number of parallel actions (for restart/reload)').option('--shutdown-with-message', 'shutdown an application with process.send(\'shutdown\') instead of process.kill(pid, SIGINT)').option('-p --pid <pid>', 'specify pid file').option('-k --kill-timeout <delay>', 'delay before sending final SIGKILL signal to process').option('--listen-timeout <delay>', 'listen timeout on application reload').option('--max-memory-restart <memory>', 'Restart the app if an amount of memory is exceeded (in bytes)').option('--restart-delay <delay>', 'specify a delay between restarts (in milliseconds)').option('--exp-backoff-restart-delay <delay>', 'specify a delay between restarts (in milliseconds)').option('-x --execute-command', 'execute a program using fork system').option('--max-restarts [count]', 'only restart the script COUNT times').option('-u --user <username>', 'define user when generating startup script').option('--uid <uid>', 'run target script with <uid> rights').option('--gid <gid>', 'run target script with <gid> rights').option('--namespace <ns>', 'start application within specified namespace').option('--cwd <path>', 'run target script from path <cwd>').option('--hp <home path>', 'define home path when generating startup script').option('--wait-ip', 'override systemd script to wait for full internet connectivity to launch pm2').option('--service-name <name>', 'define service name when generating startup script').option('-c --cron <cron_pattern>', 'restart a running process based on a cron pattern').option('-w --write', 'write configuration in local folder').option('--no-daemon', 'run pm2 daemon in the foreground if it doesn\'t exist already').option('--source-map-support', 'force source map support').option('--only <application-name>', 'with json declaration, allow to only act on one application').option('--disable-source-map-support', 'force source map support').option('--wait-ready', 'ask pm2 to wait for ready event from your app').option('--merge-logs', 'merge logs from different instances but keep error and out separated').option('--watch [paths]', 'watch application folder for changes', function (v, m) {
  m.push(v);
  return m;
}, []).option('--ignore-watch <folders|files>', 'List of paths to ignore (name or regex)').option('--watch-delay <delay>', 'specify a restart delay after changing files (--watch-delay 4 (in sec) or 4000ms)').option('--no-color', 'skip colors').option('--no-vizion', 'start an app without vizion feature (versioning control)').option('--no-autorestart', 'start an app without automatic restart').option('--no-treekill', 'Only kill the main process, not detached children').option('--no-pmx', 'start an app without pmx').option('--no-automation', 'start an app without pmx').option('--trace', 'enable transaction tracing with km').option('--disable-trace', 'disable transaction tracing with km').option('--attach', 'attach logging after your start/restart/stop/reload').option('--v8', 'enable v8 data collecting').option('--event-loop-inspector', 'enable event-loop-inspector dump in pmx').option('--deep-monitoring', 'enable all monitoring tools (equivalent to --v8 --event-loop-inspector --trace)').usage('[cmd] app');

function displayUsage() {
  console.log('usage: pm2 [options] <command>');
  console.log('');
  console.log('pm2 -h, --help             all available commands and options');
  console.log('pm2 examples               display pm2 usage examples');
  console.log('pm2 <command> -h           help on a specific command');
  console.log('');
  console.log('Access pm2 files in ~/.pm2');
}

function displayExamples() {
  console.log('- Start and add a process to the pm2 process list:');
  console.log('');
  console.log(_chalk["default"].cyan('  $ pm2 start app.js --name app'));
  console.log('');
  console.log('- Show the process list:');
  console.log('');
  console.log(_chalk["default"].cyan('  $ pm2 ls'));
  console.log('');
  console.log('- Stop and delete a process from the pm2 process list:');
  console.log('');
  console.log(_chalk["default"].cyan('  $ pm2 delete app'));
  console.log('');
  console.log('- Stop, start and restart a process from the process list:');
  console.log('');
  console.log(_chalk["default"].cyan('  $ pm2 stop app'));
  console.log(_chalk["default"].cyan('  $ pm2 start app'));
  console.log(_chalk["default"].cyan('  $ pm2 restart app'));
  console.log('');
  console.log('- Clusterize an app to all CPU cores available:');
  console.log('');
  console.log(_chalk["default"].cyan('  $ pm2 start -i max'));
  console.log('');
  console.log('- Update pm2 :');
  console.log('');
  console.log(_chalk["default"].cyan('  $ npm install pm2 -g && pm2 update'));
  console.log('');
  console.log('- Install pm2 auto completion:');
  console.log('');
  console.log(_chalk["default"].cyan('  $ pm2 completion install'));
  console.log('');
  console.log('Check the full documentation on https://pm2.keymetrics.io/');
  console.log('');
}

function beginCommandProcessing() {
  pm2.getVersion(function (err, remote_version) {
    if (!err && _package["default"].version != remote_version) {
      console.log('');
      console.log(_chalk["default"].red.bold('>>>> In-memory PM2 is out-of-date, do:\n>>>> $ pm2 update'));
      console.log('In memory PM2 version:', _chalk["default"].blue.bold(remote_version));
      console.log('Local PM2 version:', _chalk["default"].blue.bold(_package["default"].version));
      console.log('');
    }
  });

  _commander["default"].parse(process.argv);
}

function checkCompletion() {
  return tabtab.complete('pm2', function (err, data) {
    if (err || !data) return;
    if (/^--\w?/.test(data.last)) return tabtab.log(_commander["default"].options.map(function (data) {
      return data["long"];
    }), data);
    if (/^-\w?/.test(data.last)) return tabtab.log(_commander["default"].options.map(function (data) {
      return data["short"];
    }), data); // array containing commands after which process name should be listed

    var cmdProcess = ['stop', 'restart', 'scale', 'reload', 'delete', 'reset', 'pull', 'forward', 'backward', 'logs', 'describe', 'desc', 'show'];

    if (cmdProcess.indexOf(data.prev) > -1) {
      pm2.list(function (err, list) {
        tabtab.log(list.map(function (el) {
          return el.name;
        }), data);
        pm2.disconnect();
      });
    } else if (data.prev == 'pm2') {
      tabtab.log(_commander["default"].commands.map(function (data) {
        return data._name;
      }), data);
      pm2.disconnect();
    } else pm2.disconnect();
  });
}

;

var _arr = process.argv.indexOf('--') > -1 ? process.argv.slice(0, process.argv.indexOf('--')) : process.argv;

if (_arr.indexOf('log') > -1) {
  process.argv[_arr.indexOf('log')] = 'logs';
}

if (_arr.indexOf('--no-daemon') > -1) {
  //
  // Start daemon if it does not exist
  //
  // Function checks if --no-daemon option is present,
  // and starts daemon in the same process if it does not exist
  //
  console.log('pm2 launched in no-daemon mode (you can add DEBUG="*" env variable to get more messages)');
  var pm2NoDaeamon = new _API["default"]({
    daemon_mode: false
  });
  pm2NoDaeamon.connect(function () {
    pm2 = pm2NoDaeamon;
    beginCommandProcessing();
  });
} else if (_arr.indexOf('startup') > -1 || _arr.indexOf('unstartup') > -1) {
  setTimeout(function () {
    _commander["default"].parse(process.argv);
  }, 100);
} else {
  // HERE we instanciate the Client object
  pm2.connect(function () {
    debug('Now connected to daemon');

    if (process.argv.slice(2)[0] === 'completion') {
      checkCompletion(); //Close client if completion related installation

      var third = process.argv.slice(3)[0];
      if (third == null || third === 'install' || third === 'uninstall') pm2.disconnect();
    } else {
      beginCommandProcessing();
    }
  });
} //
// Helper function to fail when unknown command arguments are passed
//


function failOnUnknown(fn) {
  return function (arg) {
    if (arguments.length > 1) {
      console.log(_constants["default"].PREFIX_MSG + '\nUnknown command argument: ' + arg);

      _commander["default"].outputHelp();

      process.exit(_constants["default"].ERROR_EXIT);
    }

    return fn.apply(this, arguments);
  };
}
/**
 * @todo to remove at some point once it's fixed in official commander.js
 * https://github.com/tj/commander.js/issues/475
 *
 * Patch Commander.js Variadic feature
 */


function patchCommanderArg(cmd) {
  var argsIndex;

  if ((argsIndex = _commander["default"].rawArgs.indexOf('--')) >= 0) {
    var optargs = _commander["default"].rawArgs.slice(argsIndex + 1);

    cmd = cmd.slice(0, cmd.indexOf(optargs[0]));
  }

  return cmd;
} //
// Start command
//


_commander["default"].command('start [name|namespace|file|ecosystem|id...]').option('--watch', 'Watch folder for changes').option('--fresh', 'Rebuild Dockerfile').option('--daemon', 'Run container in Daemon mode (debug purposes)').option('--container', 'Start application in container mode').option('--dist', 'with --container; change local Dockerfile to containerize all files in current directory').option('--image-name [name]', 'with --dist; set the exported image name').option('--node-version [major]', 'with --container, set a specific major Node.js version').option('--dockerdaemon', 'for debugging purpose').description('start and daemonize an app').action(function (cmd, opts) {
  if (opts.container == true && opts.dist == true) return pm2.dockerMode(cmd, opts, 'distribution');else if (opts.container == true) return pm2.dockerMode(cmd, opts, 'development');

  if (cmd == "-") {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function (cmd) {
      process.stdin.pause();

      pm2._startJson(cmd, _commander["default"], 'restartProcessId', 'pipe');
    });
  } else {
    // Commander.js patch
    cmd = patchCommanderArg(cmd);

    if (cmd.length === 0) {
      cmd = [_constants["default"].APP_CONF_DEFAULT_FILE];
    }

    var acc = [];
    (0, _forEachLimit["default"])(cmd, 1, function (script, next) {
      pm2.start(script, _commander["default"], function (err, apps) {
        acc = acc.concat(apps);
        next(err);
      });
    }, function (err, dt) {
      if (err && err.message && (err.message.includes('Script not found') === true || err.message.includes('NOT AVAILABLE IN PATH') === true)) {
        pm2.exitCli(1);
      } else pm2.speedList(err ? 1 : 0, acc);
    });
  }
});

_commander["default"].command('trigger <id|proc_name|namespace|all> <action_name> [params]').description('trigger process action').action(function (pm_id, action_name, params) {
  pm2.trigger(pm_id, action_name, params);
});

_commander["default"].command('deploy <file|environment>').description('deploy your json').action(function (cmd) {
  pm2.deploy(cmd, _commander["default"]);
});

_commander["default"].command('startOrRestart <json>').description('start or restart JSON file').action(function (file) {
  pm2._startJson(file, _commander["default"], 'restartProcessId');
});

_commander["default"].command('startOrReload <json>').description('start or gracefully reload JSON file').action(function (file) {
  pm2._startJson(file, _commander["default"], 'reloadProcessId');
});

_commander["default"].command('pid [app_name]').description('return pid of [app_name] or all').action(function (app) {
  pm2.getPID(app);
});

_commander["default"].command('create').description('return pid of [app_name] or all').action(function () {
  pm2.boilerplate();
});

_commander["default"].command('startOrGracefulReload <json>').description('start or gracefully reload JSON file').action(function (file) {
  pm2._startJson(file, _commander["default"], 'softReloadProcessId');
}); //
// Stop specific id
//


_commander["default"].command('stop <id|name|namespace|all|json|stdin...>').option('--watch', 'Stop watching folder for changes').description('stop a process').action(function (param) {
  (0, _forEachLimit["default"])(param, 1, function (script, next) {
    pm2.stop(script, next);
  }, function (err) {
    pm2.speedList(err ? 1 : 0);
  });
}); //
// Stop All processes
//


_commander["default"].command('restart <id|name|namespace|all|json|stdin...>').option('--watch', 'Toggle watching folder for changes').description('restart a process').action(function (param) {
  // Commander.js patch
  param = patchCommanderArg(param);
  var acc = [];
  (0, _forEachLimit["default"])(param, 1, function (script, next) {
    pm2.restart(script, _commander["default"], function (err, apps) {
      acc = acc.concat(apps);
      next(err);
    });
  }, function (err) {
    pm2.speedList(err ? 1 : 0, acc);
  });
}); //
// Scale up/down a process in cluster mode
//


_commander["default"].command('scale <app_name> <number>').description('scale up/down a process in cluster mode depending on total_number param').action(function (app_name, number) {
  pm2.scale(app_name, number);
}); //
// snapshot PM2
//


_commander["default"].command('profile:mem [time]').description('Sample PM2 heap memory').action(function (time) {
  pm2.profile('mem', time);
}); //
// snapshot PM2
//


_commander["default"].command('profile:cpu [time]').description('Profile PM2 cpu').action(function (time) {
  pm2.profile('cpu', time);
}); //
// Reload process(es)
//


_commander["default"].command('reload <id|name|namespace|all>').description('reload processes (note that its for app using HTTP/HTTPS)').action(function (pm2_id) {
  pm2.reload(pm2_id, _commander["default"]);
});

_commander["default"].command('id <name>').description('get process id by name').action(function (name) {
  pm2.getProcessIdByName(name);
}); // Inspect a process


_commander["default"].command('inspect <name>').description('inspect a process').action(function (cmd) {
  pm2.inspect(cmd, _commander["default"]);
}); //
// Stop and delete a process by name from database
//


_commander["default"].command('delete <name|id|namespace|script|all|json|stdin...>').alias('del').description('stop and delete a process from pm2 process list').action(function (name) {
  if (name == "-") {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function (param) {
      process.stdin.pause();
      pm2["delete"](param, 'pipe');
    });
  } else (0, _forEachLimit["default"])(name, 1, function (script, next) {
    pm2["delete"](script, '', next);
  }, function (err) {
    pm2.speedList(err ? 1 : 0);
  });
}); //
// Send system signal to process
//


_commander["default"].command('sendSignal <signal> <pm2_id|name>').description('send a system signal to the target process').action(function (signal, pm2_id) {
  if (isNaN(parseInt(pm2_id))) {
    console.log(_constants["default"].PREFIX_MSG + 'Sending signal to process name ' + pm2_id);
    pm2.sendSignalToProcessName(signal, pm2_id);
  } else {
    console.log(_constants["default"].PREFIX_MSG + 'Sending signal to process id ' + pm2_id);
    pm2.sendSignalToProcessId(signal, pm2_id);
  }
}); //
// Stop and delete a process by name from database
//


_commander["default"].command('ping').description('ping pm2 daemon - if not up it will launch it').action(function () {
  pm2.ping();
});

_commander["default"].command('updatePM2').description('update in-memory PM2 with local PM2').action(function () {
  pm2.update();
});

_commander["default"].command('update').description('(alias) update in-memory PM2 with local PM2').action(function () {
  pm2.update();
});
/**
 * Module specifics
 */


_commander["default"].command('install <module|git:// url>').alias('module:install').option('--tarball', 'is local tarball').option('--install', 'run yarn install before starting module').option('--docker', 'is docker container').option('--v1', 'install module in v1 manner (do not use it)').option('--safe [time]', 'keep module backup, if new module fail = restore with previous').description('install or update a module and run it forever').action(function (plugin_name, opts) {
  require('util')._extend(_commander["default"], opts);

  pm2.install(plugin_name, _commander["default"]);
});

_commander["default"].command('module:update <module|git:// url>').description('update a module and run it forever').action(function (plugin_name) {
  pm2.install(plugin_name);
});

_commander["default"].command('module:generate [app_name]').description('Generate a sample module in current folder').action(function (app_name) {
  pm2.generateModuleSample(app_name);
});

_commander["default"].command('uninstall <module>').alias('module:uninstall').description('stop and uninstall a module').action(function (plugin_name) {
  pm2.uninstall(plugin_name);
});

_commander["default"].command('package [target]').description('Check & Package TAR type module').action(function (target) {
  pm2["package"](target);
});

_commander["default"].command('publish [folder]').option('--npm', 'publish on npm').alias('module:publish').description('Publish the module you are currently on').action(function (folder, opts) {
  pm2.publish(folder, opts);
});

_commander["default"].command('set [key] [value]').description('sets the specified config <key> <value>').action(function (key, value) {
  pm2.set(key, value);
});

_commander["default"].command('multiset <value>').description('multiset eg "key1 val1 key2 val2').action(function (str) {
  pm2.multiset(str);
});

_commander["default"].command('get [key]').description('get value for <key>').action(function (key) {
  pm2.get(key);
});

_commander["default"].command('conf [key] [value]').description('get / set module config values').action(function (key, value) {
  pm2.get();
});

_commander["default"].command('config <key> [value]').description('get / set module config values').action(function (key, value) {
  pm2.conf(key, value);
});

_commander["default"].command('unset <key>').description('clears the specified config <key>').action(function (key) {
  pm2.unset(key);
});

_commander["default"].command('report').description('give a full pm2 report for https://github.com/Unitech/pm2/issues').action(function (key) {
  pm2.report();
}); //
// PM2 I/O
//


_commander["default"].command('link [secret] [public] [name]').option('--info-node [url]', 'set url info node').option('--ws', 'websocket mode').option('--axon', 'axon mode').description('link with the pm2 monitoring dashboard').action(pm2.linkManagement.bind(pm2));

_commander["default"].command('unlink').description('unlink with the pm2 monitoring dashboard').action(function () {
  pm2.unlink();
});

_commander["default"].command('monitor [name]').description('monitor target process').action(function (name) {
  if (name === undefined) {
    return plusHandler();
  }

  pm2.monitorState('monitor', name);
});

_commander["default"].command('unmonitor [name]').description('unmonitor target process').action(function (name) {
  pm2.monitorState('unmonitor', name);
});

_commander["default"].command('open').description('open the pm2 monitoring dashboard').action(function (name) {
  pm2.openDashboard();
});

function plusHandler(command, opts) {
  if (opts && opts.infoNode) {
    process.env.KEYMETRICS_NODE = opts.infoNode;
  }

  return _PM2IO["default"].launch(command, opts);
}

_commander["default"].command('plus [command] [option]').alias('register').option('--info-node [url]', 'set url info node for on-premise pm2 plus').option('-d --discrete', 'silent mode').option('-a --install-all', 'install all modules (force yes)').description('enable pm2 plus').action(plusHandler);

_commander["default"].command('login').description('Login to pm2 plus').action(function () {
  return plusHandler('login');
});

_commander["default"].command('logout').description('Logout from pm2 plus').action(function () {
  return plusHandler('logout');
}); //
// Save processes to file
//


_commander["default"].command('dump').alias('save').option('--force', 'force deletion of dump file, even if empty').description('dump all processes for resurrecting them later').action(failOnUnknown(function (opts) {
  pm2.dump(_commander["default"].force);
})); //
// Delete dump file
//


_commander["default"].command('cleardump').description('Create empty dump file').action(failOnUnknown(function () {
  pm2.clearDump();
})); //
// Save processes to file
//


_commander["default"].command('send <pm_id> <line>').description('send stdin to <pm_id>').action(function (pm_id, line) {
  pm2.sendLineToStdin(pm_id, line);
}); //
// Attach to stdin/stdout
// Not TTY ready
//


_commander["default"].command('attach <pm_id> [command separator]').description('attach stdin/stdout to application identified by <pm_id>').action(function (pm_id, separator) {
  pm2.attach(pm_id, separator);
}); //
// Resurrect
//


_commander["default"].command('resurrect').description('resurrect previously dumped processes').action(failOnUnknown(function () {
  console.log(_constants["default"].PREFIX_MSG + 'Resurrecting');
  pm2.resurrect();
})); //
// Set pm2 to startup
//


_commander["default"].command('unstartup [platform]').description('disable the pm2 startup hook').action(function (platform) {
  pm2.uninstallStartup(platform, _commander["default"]);
}); //
// Set pm2 to startup
//


_commander["default"].command('startup [platform]').description('enable the pm2 startup hook').action(function (platform) {
  pm2.startup(platform, _commander["default"]);
}); //
// Logrotate
//


_commander["default"].command('logrotate').description('copy default logrotate configuration').action(function (cmd) {
  pm2.logrotate(_commander["default"]);
}); //
// Sample generate
//


_commander["default"].command('ecosystem [mode]').alias('init').description('generate a process conf file. (mode = null or simple)').action(function (mode) {
  pm2.generateSample(mode);
});

_commander["default"].command('reset <name|id|all>').description('reset counters for process').action(function (proc_id) {
  pm2.reset(proc_id);
});

_commander["default"].command('describe <name|id>').description('describe all parameters of a process').action(function (proc_id) {
  pm2.describe(proc_id);
});

_commander["default"].command('desc <name|id>').description('(alias) describe all parameters of a process').action(function (proc_id) {
  pm2.describe(proc_id);
});

_commander["default"].command('info <name|id>').description('(alias) describe all parameters of a process').action(function (proc_id) {
  pm2.describe(proc_id);
});

_commander["default"].command('show <name|id>').description('(alias) describe all parameters of a process').action(function (proc_id) {
  pm2.describe(proc_id);
});

_commander["default"].command('env <id>').description('list all environment variables of a process id').action(function (proc_id) {
  pm2.env(proc_id);
}); //
// List command
//


_commander["default"].command('list').alias('ls').description('list all processes').action(function () {
  pm2.list(_commander["default"]);
});

_commander["default"].command('l').description('(alias) list all processes').action(function () {
  pm2.list();
});

_commander["default"].command('ps').description('(alias) list all processes').action(function () {
  pm2.list();
});

_commander["default"].command('status').description('(alias) list all processes').action(function () {
  pm2.list();
}); // List in raw json


_commander["default"].command('jlist').description('list all processes in JSON format').action(function () {
  pm2.jlist();
});

_commander["default"].command('sysmonit').description('start system monitoring daemon').action(function () {
  pm2.launchSysMonitoring();
});

_commander["default"].command('slist').alias('sysinfos').option('-t --tree', 'show as tree').description('list system infos in JSON').action(function (opts) {
  pm2.slist(opts.tree);
}); // List in prettified Json


_commander["default"].command('prettylist').description('print json in a prettified JSON').action(failOnUnknown(function () {
  pm2.jlist(true);
})); //
// Dashboard command
//


_commander["default"].command('monit').description('launch termcaps monitoring').action(function () {
  pm2.dashboard();
});

_commander["default"].command('imonit').description('launch legacy termcaps monitoring').action(function () {
  pm2.monit();
});

_commander["default"].command('dashboard').alias('dash').description('launch dashboard with monitoring and logs').action(function () {
  pm2.dashboard();
}); //
// Flushing command
//


_commander["default"].command('flush [api]').description('flush logs').action(function (api) {
  pm2.flush(api);
});
/* old version
commander.command('flush')
  .description('flush logs')
  .action(failOnUnknown(function() {
    pm2.flush();
  }));
*/
//
// Reload all logs
//


_commander["default"].command('reloadLogs').description('reload all logs').action(function () {
  pm2.reloadLogs();
}); //
// Log streaming
//


_commander["default"].command('logs [id|name|namespace]').option('--json', 'json log output').option('--format', 'formated log output').option('--raw', 'raw output').option('--err', 'only shows error output').option('--out', 'only shows standard output').option('--lines <n>', 'output the last N lines, instead of the last 15 by default').option('--timestamp [format]', 'add timestamps (default format YYYY-MM-DD-HH:mm:ss)').option('--nostream', 'print logs without lauching the log stream').option('--highlight [value]', 'highlights the given value').description('stream logs file. Default stream all logs').action(function (id, cmd) {
  var Logs = require("../API/Log.js");

  if (!id) id = 'all';
  var line = 15;
  var raw = false;
  var exclusive = "";
  var timestamp = false;
  var highlight = false;

  if (!isNaN(parseInt(cmd.lines))) {
    line = parseInt(cmd.lines);
  }

  if (cmd.parent.rawArgs.indexOf('--raw') !== -1) raw = true;
  if (cmd.timestamp) timestamp = typeof cmd.timestamp === 'string' ? cmd.timestamp : 'YYYY-MM-DD-HH:mm:ss';
  if (cmd.highlight) highlight = typeof cmd.highlight === 'string' ? cmd.highlight : false;
  if (cmd.out === true) exclusive = 'out';
  if (cmd.err === true) exclusive = 'err';
  if (cmd.nostream === true) pm2.printLogs(id, line, raw, timestamp, exclusive);else if (cmd.json === true) Logs.jsonStream(pm2.Client, id);else if (cmd.format === true) Logs.formatStream(pm2.Client, id, false, 'YYYY-MM-DD-HH:mm:ssZZ', exclusive, highlight);else pm2.streamLogs(id, line, raw, timestamp, exclusive, highlight);
}); //
// Kill
//


_commander["default"].command('kill').description('kill daemon').action(failOnUnknown(function (arg) {
  pm2.killDaemon(function () {
    process.exit(_constants["default"].SUCCESS_EXIT);
  });
})); //
// Update repository for a given app
//


_commander["default"].command('pull <name> [commit_id]').description('updates repository for a given app').action(function (pm2_name, commit_id) {
  if (commit_id !== undefined) {
    pm2._pullCommitId({
      pm2_name: pm2_name,
      commit_id: commit_id
    });
  } else pm2.pullAndRestart(pm2_name);
}); //
// Update repository to the next commit for a given app
//


_commander["default"].command('forward <name>').description('updates repository to the next commit for a given app').action(function (pm2_name) {
  pm2.forward(pm2_name);
}); //
// Downgrade repository to the previous commit for a given app
//


_commander["default"].command('backward <name>').description('downgrades repository to the previous commit for a given app').action(function (pm2_name) {
  pm2.backward(pm2_name);
}); //
// Perform a deep update of PM2
//


_commander["default"].command('deepUpdate').description('performs a deep update of PM2').action(function () {
  pm2.deepUpdate();
}); //
// Launch a http server that expose a given path on given port
//


_commander["default"].command('serve [path] [port]').alias('expose').option('--port [port]', 'specify port to listen to').option('--spa', 'always serving index.html on inexistant sub path').option('--basic-auth-username [username]', 'set basic auth username').option('--basic-auth-password [password]', 'set basic auth password').option('--monitor [frontend-app]', 'frontend app monitoring (auto integrate snippet on html files)').description('serve a directory over http via port').action(function (path, port, cmd) {
  pm2.serve(path, port || cmd.port, cmd, _commander["default"]);
});

_commander["default"].command('autoinstall').action(function () {
  pm2.autoinstall();
});

_commander["default"].command('examples').description('display pm2 usage examples').action(function () {
  console.log(_constants["default"].PREFIX_MSG + _chalk["default"].grey('pm2 usage examples:\n'));
  displayExamples();
  process.exit(_constants["default"].SUCCESS_EXIT);
}); //
// Catch all
//


_commander["default"].command('*').action(function () {
  console.log(_constants["default"].PREFIX_MSG_ERR + _chalk["default"].bold('Command not found\n'));
  displayUsage(); // Check if it does not forget to close fds from RPC

  process.exit(_constants["default"].ERROR_EXIT);
}); //
// Display help if 0 arguments passed to pm2
//


if (process.argv.length == 2) {
  _commander["default"].parse(process.argv);

  displayUsage(); // Check if it does not forget to close fds from RPC

  process.exit(_constants["default"].ERROR_EXIT);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9iaW5hcmllcy9DTEkudHMiXSwibmFtZXMiOlsicHJvY2VzcyIsImVudiIsIlBNMl9VU0FHRSIsImRlYnVnIiwiQ29tbW9uIiwiZGV0ZXJtaW5lU2lsZW50Q0xJIiwicHJpbnRWZXJzaW9uIiwicG0yIiwiUE0yIiwiUE0yaW9IYW5kbGVyIiwidXNlUE0yQ2xpZW50IiwiY29tbWFuZGVyIiwidmVyc2lvbiIsInBrZyIsIm9wdGlvbiIsInYiLCJtIiwicHVzaCIsInVzYWdlIiwiZGlzcGxheVVzYWdlIiwiY29uc29sZSIsImxvZyIsImRpc3BsYXlFeGFtcGxlcyIsImNoYWxrIiwiY3lhbiIsImJlZ2luQ29tbWFuZFByb2Nlc3NpbmciLCJnZXRWZXJzaW9uIiwiZXJyIiwicmVtb3RlX3ZlcnNpb24iLCJyZWQiLCJib2xkIiwiYmx1ZSIsInBhcnNlIiwiYXJndiIsImNoZWNrQ29tcGxldGlvbiIsInRhYnRhYiIsImNvbXBsZXRlIiwiZGF0YSIsInRlc3QiLCJsYXN0Iiwib3B0aW9ucyIsIm1hcCIsImNtZFByb2Nlc3MiLCJpbmRleE9mIiwicHJldiIsImxpc3QiLCJlbCIsIm5hbWUiLCJkaXNjb25uZWN0IiwiY29tbWFuZHMiLCJfbmFtZSIsIl9hcnIiLCJzbGljZSIsInBtMk5vRGFlYW1vbiIsImRhZW1vbl9tb2RlIiwiY29ubmVjdCIsInNldFRpbWVvdXQiLCJ0aGlyZCIsImZhaWxPblVua25vd24iLCJmbiIsImFyZyIsImFyZ3VtZW50cyIsImxlbmd0aCIsImNzdCIsIlBSRUZJWF9NU0ciLCJvdXRwdXRIZWxwIiwiZXhpdCIsIkVSUk9SX0VYSVQiLCJhcHBseSIsInBhdGNoQ29tbWFuZGVyQXJnIiwiY21kIiwiYXJnc0luZGV4IiwicmF3QXJncyIsIm9wdGFyZ3MiLCJjb21tYW5kIiwiZGVzY3JpcHRpb24iLCJhY3Rpb24iLCJvcHRzIiwiY29udGFpbmVyIiwiZGlzdCIsImRvY2tlck1vZGUiLCJzdGRpbiIsInJlc3VtZSIsInNldEVuY29kaW5nIiwib24iLCJwYXVzZSIsIl9zdGFydEpzb24iLCJBUFBfQ09ORl9ERUZBVUxUX0ZJTEUiLCJhY2MiLCJzY3JpcHQiLCJuZXh0Iiwic3RhcnQiLCJhcHBzIiwiY29uY2F0IiwiZHQiLCJtZXNzYWdlIiwiaW5jbHVkZXMiLCJleGl0Q2xpIiwic3BlZWRMaXN0IiwicG1faWQiLCJhY3Rpb25fbmFtZSIsInBhcmFtcyIsInRyaWdnZXIiLCJkZXBsb3kiLCJmaWxlIiwiYXBwIiwiZ2V0UElEIiwiYm9pbGVycGxhdGUiLCJwYXJhbSIsInN0b3AiLCJyZXN0YXJ0IiwiYXBwX25hbWUiLCJudW1iZXIiLCJzY2FsZSIsInRpbWUiLCJwcm9maWxlIiwicG0yX2lkIiwicmVsb2FkIiwiZ2V0UHJvY2Vzc0lkQnlOYW1lIiwiaW5zcGVjdCIsImFsaWFzIiwic2lnbmFsIiwiaXNOYU4iLCJwYXJzZUludCIsInNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lIiwic2VuZFNpZ25hbFRvUHJvY2Vzc0lkIiwicGluZyIsInVwZGF0ZSIsInBsdWdpbl9uYW1lIiwicmVxdWlyZSIsIl9leHRlbmQiLCJpbnN0YWxsIiwiZ2VuZXJhdGVNb2R1bGVTYW1wbGUiLCJ1bmluc3RhbGwiLCJ0YXJnZXQiLCJmb2xkZXIiLCJwdWJsaXNoIiwia2V5IiwidmFsdWUiLCJzZXQiLCJzdHIiLCJtdWx0aXNldCIsImdldCIsImNvbmYiLCJ1bnNldCIsInJlcG9ydCIsImxpbmtNYW5hZ2VtZW50IiwiYmluZCIsInVubGluayIsInVuZGVmaW5lZCIsInBsdXNIYW5kbGVyIiwibW9uaXRvclN0YXRlIiwib3BlbkRhc2hib2FyZCIsImluZm9Ob2RlIiwiS0VZTUVUUklDU19OT0RFIiwibGF1bmNoIiwiZHVtcCIsImZvcmNlIiwiY2xlYXJEdW1wIiwibGluZSIsInNlbmRMaW5lVG9TdGRpbiIsInNlcGFyYXRvciIsImF0dGFjaCIsInJlc3VycmVjdCIsInBsYXRmb3JtIiwidW5pbnN0YWxsU3RhcnR1cCIsInN0YXJ0dXAiLCJsb2dyb3RhdGUiLCJtb2RlIiwiZ2VuZXJhdGVTYW1wbGUiLCJwcm9jX2lkIiwicmVzZXQiLCJkZXNjcmliZSIsImpsaXN0IiwibGF1bmNoU3lzTW9uaXRvcmluZyIsInNsaXN0IiwidHJlZSIsImRhc2hib2FyZCIsIm1vbml0IiwiYXBpIiwiZmx1c2giLCJyZWxvYWRMb2dzIiwiaWQiLCJMb2dzIiwicmF3IiwiZXhjbHVzaXZlIiwidGltZXN0YW1wIiwiaGlnaGxpZ2h0IiwibGluZXMiLCJwYXJlbnQiLCJvdXQiLCJub3N0cmVhbSIsInByaW50TG9ncyIsImpzb24iLCJqc29uU3RyZWFtIiwiQ2xpZW50IiwiZm9ybWF0IiwiZm9ybWF0U3RyZWFtIiwic3RyZWFtTG9ncyIsImtpbGxEYWVtb24iLCJTVUNDRVNTX0VYSVQiLCJwbTJfbmFtZSIsImNvbW1pdF9pZCIsIl9wdWxsQ29tbWl0SWQiLCJwdWxsQW5kUmVzdGFydCIsImZvcndhcmQiLCJiYWNrd2FyZCIsImRlZXBVcGRhdGUiLCJwYXRoIiwicG9ydCIsInNlcnZlIiwiYXV0b2luc3RhbGwiLCJncmV5IiwiUFJFRklYX01TR19FUlIiXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBSUE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBYkFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxTQUFaLEdBQXdCLEtBQXhCO0FBZUEsSUFBTUMsS0FBSyxHQUFHLHVCQUFZLFNBQVosQ0FBZDs7QUFFQUMsbUJBQU9DLGtCQUFQOztBQUNBRCxtQkFBT0UsWUFBUDs7QUFFQSxJQUFJQyxHQUFRLEdBQUcsSUFBSUMsZUFBSixFQUFmOztBQUVBQyxrQkFBYUMsWUFBYixDQUEwQkgsR0FBMUI7O0FBRUFJLHNCQUFVQyxPQUFWLENBQWtCQyxvQkFBSUQsT0FBdEIsRUFDR0UsTUFESCxDQUNVLGNBRFYsRUFDMEIsbUJBRDFCLEVBRUdBLE1BRkgsQ0FFVSxhQUZWLEVBRXlCLG1CQUZ6QixFQUU4QyxLQUY5QyxFQUdHQSxNQUhILENBR1Usb0JBSFYsRUFHZ0MsaUNBSGhDLEVBSUdBLE1BSkgsQ0FJVSxrQkFKVixFQUk4QixnREFKOUIsRUFLR0EsTUFMSCxDQUtVLGdCQUxWLEVBSzRCLDZDQUw1QixFQU1HQSxNQU5ILENBTVUsNkJBTlYsRUFNeUMsb0VBTnpDLEVBT0dBLE1BUEgsQ0FPVSxnQ0FQVixFQU80QyxpRUFQNUMsRUFRR0EsTUFSSCxDQVFVLHlCQVJWLEVBUXFDLDJDQVJyQyxFQVNHQSxNQVRILENBU1Usb0JBVFYsRUFTZ0MsNkJBVGhDLEVBVUdBLE1BVkgsQ0FVVSxtQkFWVixFQVUrQiw2QkFWL0IsRUFXR0EsTUFYSCxDQVdVLGlCQVhWLEVBVzZCLHVEQVg3QixFQVlHQSxNQVpILENBWVUscUJBWlYsRUFZaUMsaUVBWmpDLEVBWW9HLFVBQVVDLENBQVYsRUFBYUMsQ0FBYixFQUFnQjtBQUFFQSxFQUFBQSxDQUFDLENBQUNDLElBQUYsQ0FBT0YsQ0FBUDtBQUFXLFNBQU9DLENBQVA7QUFBVyxDQVo1SSxFQVk4SSxFQVo5SSxFQWFHRixNQWJILENBYVUsbUJBYlYsRUFhK0IsMERBYi9CLEVBY0dBLE1BZEgsQ0FjVSxpQ0FkVixFQWM2QyxxQ0FkN0MsRUFlR0EsTUFmSCxDQWVVLFFBZlYsRUFlb0IscUJBZnBCLEVBZ0JHQSxNQWhCSCxDQWdCVSxnQkFoQlYsRUFnQjRCLDBCQWhCNUIsRUFpQkdBLE1BakJILENBaUJVLDBCQWpCVixFQWlCc0MsaUZBakJ0QyxFQWtCR0EsTUFsQkgsQ0FrQlUsaUJBbEJWLEVBa0I2Qix1RUFsQjdCLEVBbUJHQSxNQW5CSCxDQW1CVSxZQW5CVixFQW1Cd0IsZUFuQnhCLEVBb0JHQSxNQXBCSCxDQW9CVSx5QkFwQlYsRUFvQnFDLDhEQXBCckMsRUFxQkdBLE1BckJILENBcUJVLHFCQXJCVixFQXFCaUMsaURBckJqQyxFQXNCR0EsTUF0QkgsQ0FzQlUseUJBdEJWLEVBc0JxQyw4RkF0QnJDLEVBdUJHQSxNQXZCSCxDQXVCVSxnQkF2QlYsRUF1QjRCLGtCQXZCNUIsRUF3QkdBLE1BeEJILENBd0JVLDJCQXhCVixFQXdCdUMsc0RBeEJ2QyxFQXlCR0EsTUF6QkgsQ0F5QlUsMEJBekJWLEVBeUJzQyxzQ0F6QnRDLEVBMEJHQSxNQTFCSCxDQTBCVSwrQkExQlYsRUEwQjJDLCtEQTFCM0MsRUEyQkdBLE1BM0JILENBMkJVLHlCQTNCVixFQTJCcUMsb0RBM0JyQyxFQTRCR0EsTUE1QkgsQ0E0QlUscUNBNUJWLEVBNEJpRCxvREE1QmpELEVBNkJHQSxNQTdCSCxDQTZCVSxzQkE3QlYsRUE2QmtDLHFDQTdCbEMsRUE4QkdBLE1BOUJILENBOEJVLHdCQTlCVixFQThCb0MscUNBOUJwQyxFQStCR0EsTUEvQkgsQ0ErQlUsc0JBL0JWLEVBK0JrQyw0Q0EvQmxDLEVBZ0NHQSxNQWhDSCxDQWdDVSxhQWhDVixFQWdDeUIscUNBaEN6QixFQWlDR0EsTUFqQ0gsQ0FpQ1UsYUFqQ1YsRUFpQ3lCLHFDQWpDekIsRUFrQ0dBLE1BbENILENBa0NVLGtCQWxDVixFQWtDOEIsOENBbEM5QixFQW1DR0EsTUFuQ0gsQ0FtQ1UsY0FuQ1YsRUFtQzBCLG1DQW5DMUIsRUFvQ0dBLE1BcENILENBb0NVLGtCQXBDVixFQW9DOEIsaURBcEM5QixFQXFDR0EsTUFyQ0gsQ0FxQ1UsV0FyQ1YsRUFxQ3VCLDhFQXJDdkIsRUFzQ0dBLE1BdENILENBc0NVLHVCQXRDVixFQXNDbUMsb0RBdENuQyxFQXVDR0EsTUF2Q0gsQ0F1Q1UsMEJBdkNWLEVBdUNzQyxtREF2Q3RDLEVBd0NHQSxNQXhDSCxDQXdDVSxZQXhDVixFQXdDd0IscUNBeEN4QixFQXlDR0EsTUF6Q0gsQ0F5Q1UsYUF6Q1YsRUF5Q3lCLCtEQXpDekIsRUEwQ0dBLE1BMUNILENBMENVLHNCQTFDVixFQTBDa0MsMEJBMUNsQyxFQTJDR0EsTUEzQ0gsQ0EyQ1UsMkJBM0NWLEVBMkN1Qyw2REEzQ3ZDLEVBNENHQSxNQTVDSCxDQTRDVSw4QkE1Q1YsRUE0QzBDLDBCQTVDMUMsRUE2Q0dBLE1BN0NILENBNkNVLGNBN0NWLEVBNkMwQiwrQ0E3QzFCLEVBOENHQSxNQTlDSCxDQThDVSxjQTlDVixFQThDMEIsc0VBOUMxQixFQStDR0EsTUEvQ0gsQ0ErQ1UsaUJBL0NWLEVBK0M2QixzQ0EvQzdCLEVBK0NxRSxVQUFVQyxDQUFWLEVBQWFDLENBQWIsRUFBZ0I7QUFBRUEsRUFBQUEsQ0FBQyxDQUFDQyxJQUFGLENBQU9GLENBQVA7QUFBVyxTQUFPQyxDQUFQO0FBQVcsQ0EvQzdHLEVBK0MrRyxFQS9DL0csRUFnREdGLE1BaERILENBZ0RVLGdDQWhEVixFQWdENEMseUNBaEQ1QyxFQWlER0EsTUFqREgsQ0FpRFUsdUJBakRWLEVBaURtQyxtRkFqRG5DLEVBa0RHQSxNQWxESCxDQWtEVSxZQWxEVixFQWtEd0IsYUFsRHhCLEVBbURHQSxNQW5ESCxDQW1EVSxhQW5EVixFQW1EeUIsMERBbkR6QixFQW9ER0EsTUFwREgsQ0FvRFUsa0JBcERWLEVBb0Q4Qix3Q0FwRDlCLEVBcURHQSxNQXJESCxDQXFEVSxlQXJEVixFQXFEMkIsbURBckQzQixFQXNER0EsTUF0REgsQ0FzRFUsVUF0RFYsRUFzRHNCLDBCQXREdEIsRUF1REdBLE1BdkRILENBdURVLGlCQXZEVixFQXVENkIsMEJBdkQ3QixFQXdER0EsTUF4REgsQ0F3RFUsU0F4RFYsRUF3RHFCLG9DQXhEckIsRUF5REdBLE1BekRILENBeURVLGlCQXpEVixFQXlENkIscUNBekQ3QixFQTBER0EsTUExREgsQ0EwRFUsVUExRFYsRUEwRHNCLHFEQTFEdEIsRUEyREdBLE1BM0RILENBMkRVLE1BM0RWLEVBMkRrQiwyQkEzRGxCLEVBNERHQSxNQTVESCxDQTREVSx3QkE1RFYsRUE0RG9DLHlDQTVEcEMsRUE2REdBLE1BN0RILENBNkRVLG1CQTdEVixFQTZEK0IsaUZBN0QvQixFQThER0ksS0E5REgsQ0E4RFMsV0E5RFQ7O0FBZ0VBLFNBQVNDLFlBQVQsR0FBd0I7QUFDdEJDLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGdDQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksK0RBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksdURBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksdURBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksRUFBWjtBQUNBRCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSw0QkFBWjtBQUNEOztBQUVELFNBQVNDLGVBQVQsR0FBMkI7QUFDekJGLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLG9EQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlFLGtCQUFNQyxJQUFOLENBQVcsaUNBQVgsQ0FBWjtBQUNBSixFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxFQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLDBCQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlFLGtCQUFNQyxJQUFOLENBQVcsWUFBWCxDQUFaO0FBQ0FKLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksd0RBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksRUFBWjtBQUNBRCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUUsa0JBQU1DLElBQU4sQ0FBVyxvQkFBWCxDQUFaO0FBQ0FKLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksNERBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksRUFBWjtBQUNBRCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUUsa0JBQU1DLElBQU4sQ0FBVyxrQkFBWCxDQUFaO0FBQ0FKLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZRSxrQkFBTUMsSUFBTixDQUFXLG1CQUFYLENBQVo7QUFDQUosRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlFLGtCQUFNQyxJQUFOLENBQVcscUJBQVgsQ0FBWjtBQUNBSixFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxFQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGlEQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlFLGtCQUFNQyxJQUFOLENBQVcsc0JBQVgsQ0FBWjtBQUNBSixFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxFQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGdCQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlFLGtCQUFNQyxJQUFOLENBQVcsc0NBQVgsQ0FBWjtBQUNBSixFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxFQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGdDQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlFLGtCQUFNQyxJQUFOLENBQVcsNEJBQVgsQ0FBWjtBQUNBSixFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxFQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLDREQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQVo7QUFDRDs7QUFFRCxTQUFTSSxzQkFBVCxHQUFrQztBQUNoQ2xCLEVBQUFBLEdBQUcsQ0FBQ21CLFVBQUosQ0FBZSxVQUFVQyxHQUFWLEVBQWVDLGNBQWYsRUFBK0I7QUFDNUMsUUFBSSxDQUFDRCxHQUFELElBQVNkLG9CQUFJRCxPQUFKLElBQWVnQixjQUE1QixFQUE2QztBQUMzQ1IsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksRUFBWjtBQUNBRCxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUUsa0JBQU1NLEdBQU4sQ0FBVUMsSUFBVixDQUFlLDJEQUFmLENBQVo7QUFDQVYsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksd0JBQVosRUFBc0NFLGtCQUFNUSxJQUFOLENBQVdELElBQVgsQ0FBZ0JGLGNBQWhCLENBQXRDO0FBQ0FSLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLG9CQUFaLEVBQWtDRSxrQkFBTVEsSUFBTixDQUFXRCxJQUFYLENBQWdCakIsb0JBQUlELE9BQXBCLENBQWxDO0FBQ0FRLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQVo7QUFDRDtBQUNGLEdBUkQ7O0FBU0FWLHdCQUFVcUIsS0FBVixDQUFnQmhDLE9BQU8sQ0FBQ2lDLElBQXhCO0FBQ0Q7O0FBRUQsU0FBU0MsZUFBVCxHQUEyQjtBQUN6QixTQUFPQyxNQUFNLENBQUNDLFFBQVAsQ0FBZ0IsS0FBaEIsRUFBdUIsVUFBVVQsR0FBVixFQUFlVSxJQUFmLEVBQXFCO0FBQ2pELFFBQUlWLEdBQUcsSUFBSSxDQUFDVSxJQUFaLEVBQWtCO0FBQ2xCLFFBQUksU0FBU0MsSUFBVCxDQUFjRCxJQUFJLENBQUNFLElBQW5CLENBQUosRUFBOEIsT0FBT0osTUFBTSxDQUFDZCxHQUFQLENBQVdWLHNCQUFVNkIsT0FBVixDQUFrQkMsR0FBbEIsQ0FBc0IsVUFBVUosSUFBVixFQUFnQjtBQUNwRixhQUFPQSxJQUFJLFFBQVg7QUFDRCxLQUYrQyxDQUFYLEVBRWpDQSxJQUZpQyxDQUFQO0FBRzlCLFFBQUksUUFBUUMsSUFBUixDQUFhRCxJQUFJLENBQUNFLElBQWxCLENBQUosRUFBNkIsT0FBT0osTUFBTSxDQUFDZCxHQUFQLENBQVdWLHNCQUFVNkIsT0FBVixDQUFrQkMsR0FBbEIsQ0FBc0IsVUFBVUosSUFBVixFQUFnQjtBQUNuRixhQUFPQSxJQUFJLFNBQVg7QUFDRCxLQUY4QyxDQUFYLEVBRWhDQSxJQUZnQyxDQUFQLENBTG9CLENBUWpEOztBQUNBLFFBQUlLLFVBQVUsR0FBRyxDQUFDLE1BQUQsRUFBUyxTQUFULEVBQW9CLE9BQXBCLEVBQTZCLFFBQTdCLEVBQXVDLFFBQXZDLEVBQWlELE9BQWpELEVBQTBELE1BQTFELEVBQWtFLFNBQWxFLEVBQTZFLFVBQTdFLEVBQXlGLE1BQXpGLEVBQWlHLFVBQWpHLEVBQTZHLE1BQTdHLEVBQXFILE1BQXJILENBQWpCOztBQUVBLFFBQUlBLFVBQVUsQ0FBQ0MsT0FBWCxDQUFtQk4sSUFBSSxDQUFDTyxJQUF4QixJQUFnQyxDQUFDLENBQXJDLEVBQXdDO0FBQ3RDckMsTUFBQUEsR0FBRyxDQUFDc0MsSUFBSixDQUFTLFVBQVVsQixHQUFWLEVBQWVrQixJQUFmLEVBQXFCO0FBQzVCVixRQUFBQSxNQUFNLENBQUNkLEdBQVAsQ0FBV3dCLElBQUksQ0FBQ0osR0FBTCxDQUFTLFVBQVVLLEVBQVYsRUFBYztBQUFFLGlCQUFPQSxFQUFFLENBQUNDLElBQVY7QUFBZ0IsU0FBekMsQ0FBWCxFQUF1RFYsSUFBdkQ7QUFDQTlCLFFBQUFBLEdBQUcsQ0FBQ3lDLFVBQUo7QUFDRCxPQUhEO0FBSUQsS0FMRCxNQU1LLElBQUlYLElBQUksQ0FBQ08sSUFBTCxJQUFhLEtBQWpCLEVBQXdCO0FBQzNCVCxNQUFBQSxNQUFNLENBQUNkLEdBQVAsQ0FBV1Ysc0JBQVVzQyxRQUFWLENBQW1CUixHQUFuQixDQUF1QixVQUFVSixJQUFWLEVBQWdCO0FBQ2hELGVBQU9BLElBQUksQ0FBQ2EsS0FBWjtBQUNELE9BRlUsQ0FBWCxFQUVJYixJQUZKO0FBR0E5QixNQUFBQSxHQUFHLENBQUN5QyxVQUFKO0FBQ0QsS0FMSSxNQU9IekMsR0FBRyxDQUFDeUMsVUFBSjtBQUNILEdBekJNLENBQVA7QUEwQkQ7O0FBQUE7O0FBRUQsSUFBSUcsSUFBSSxHQUFHbkQsT0FBTyxDQUFDaUMsSUFBUixDQUFhVSxPQUFiLENBQXFCLElBQXJCLElBQTZCLENBQUMsQ0FBOUIsR0FBa0MzQyxPQUFPLENBQUNpQyxJQUFSLENBQWFtQixLQUFiLENBQW1CLENBQW5CLEVBQXNCcEQsT0FBTyxDQUFDaUMsSUFBUixDQUFhVSxPQUFiLENBQXFCLElBQXJCLENBQXRCLENBQWxDLEdBQXNGM0MsT0FBTyxDQUFDaUMsSUFBekc7O0FBRUEsSUFBSWtCLElBQUksQ0FBQ1IsT0FBTCxDQUFhLEtBQWIsSUFBc0IsQ0FBQyxDQUEzQixFQUE4QjtBQUM1QjNDLEVBQUFBLE9BQU8sQ0FBQ2lDLElBQVIsQ0FBYWtCLElBQUksQ0FBQ1IsT0FBTCxDQUFhLEtBQWIsQ0FBYixJQUFvQyxNQUFwQztBQUNEOztBQUVELElBQUlRLElBQUksQ0FBQ1IsT0FBTCxDQUFhLGFBQWIsSUFBOEIsQ0FBQyxDQUFuQyxFQUFzQztBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQXZCLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLDBGQUFaO0FBRUEsTUFBSWdDLFlBQVksR0FBRyxJQUFJN0MsZUFBSixDQUFRO0FBQ3pCOEMsSUFBQUEsV0FBVyxFQUFFO0FBRFksR0FBUixDQUFuQjtBQUlBRCxFQUFBQSxZQUFZLENBQUNFLE9BQWIsQ0FBcUIsWUFBWTtBQUMvQmhELElBQUFBLEdBQUcsR0FBRzhDLFlBQU47QUFDQTVCLElBQUFBLHNCQUFzQjtBQUN2QixHQUhEO0FBS0QsQ0FsQkQsTUFtQkssSUFBSTBCLElBQUksQ0FBQ1IsT0FBTCxDQUFhLFNBQWIsSUFBMEIsQ0FBQyxDQUEzQixJQUFnQ1EsSUFBSSxDQUFDUixPQUFMLENBQWEsV0FBYixJQUE0QixDQUFDLENBQWpFLEVBQW9FO0FBQ3ZFYSxFQUFBQSxVQUFVLENBQUMsWUFBWTtBQUNyQjdDLDBCQUFVcUIsS0FBVixDQUFnQmhDLE9BQU8sQ0FBQ2lDLElBQXhCO0FBQ0QsR0FGUyxFQUVQLEdBRk8sQ0FBVjtBQUdELENBSkksTUFLQTtBQUNIO0FBQ0ExQixFQUFBQSxHQUFHLENBQUNnRCxPQUFKLENBQVksWUFBWTtBQUN0QnBELElBQUFBLEtBQUssQ0FBQyx5QkFBRCxDQUFMOztBQUNBLFFBQUlILE9BQU8sQ0FBQ2lDLElBQVIsQ0FBYW1CLEtBQWIsQ0FBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsTUFBNkIsWUFBakMsRUFBK0M7QUFDN0NsQixNQUFBQSxlQUFlLEdBRDhCLENBRTdDOztBQUNBLFVBQUl1QixLQUFLLEdBQUd6RCxPQUFPLENBQUNpQyxJQUFSLENBQWFtQixLQUFiLENBQW1CLENBQW5CLEVBQXNCLENBQXRCLENBQVo7QUFDQSxVQUFJSyxLQUFLLElBQUksSUFBVCxJQUFpQkEsS0FBSyxLQUFLLFNBQTNCLElBQXdDQSxLQUFLLEtBQUssV0FBdEQsRUFDRWxELEdBQUcsQ0FBQ3lDLFVBQUo7QUFDSCxLQU5ELE1BT0s7QUFDSHZCLE1BQUFBLHNCQUFzQjtBQUN2QjtBQUNGLEdBWkQ7QUFhRCxDLENBRUQ7QUFDQTtBQUNBOzs7QUFDQSxTQUFTaUMsYUFBVCxDQUF1QkMsRUFBdkIsRUFBMkI7QUFDekIsU0FBTyxVQUFVQyxHQUFWLEVBQWU7QUFDcEIsUUFBSUMsU0FBUyxDQUFDQyxNQUFWLEdBQW1CLENBQXZCLEVBQTBCO0FBQ3hCMUMsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVkwQyxzQkFBSUMsVUFBSixHQUFpQiw4QkFBakIsR0FBa0RKLEdBQTlEOztBQUNBakQsNEJBQVVzRCxVQUFWOztBQUNBakUsTUFBQUEsT0FBTyxDQUFDa0UsSUFBUixDQUFhSCxzQkFBSUksVUFBakI7QUFDRDs7QUFDRCxXQUFPUixFQUFFLENBQUNTLEtBQUgsQ0FBUyxJQUFULEVBQWVQLFNBQWYsQ0FBUDtBQUNELEdBUEQ7QUFRRDtBQUVEOzs7Ozs7OztBQU1BLFNBQVNRLGlCQUFULENBQTJCQyxHQUEzQixFQUFnQztBQUM5QixNQUFJQyxTQUFKOztBQUNBLE1BQUksQ0FBQ0EsU0FBUyxHQUFHNUQsc0JBQVU2RCxPQUFWLENBQWtCN0IsT0FBbEIsQ0FBMEIsSUFBMUIsQ0FBYixLQUFpRCxDQUFyRCxFQUF3RDtBQUN0RCxRQUFJOEIsT0FBTyxHQUFHOUQsc0JBQVU2RCxPQUFWLENBQWtCcEIsS0FBbEIsQ0FBd0JtQixTQUFTLEdBQUcsQ0FBcEMsQ0FBZDs7QUFDQUQsSUFBQUEsR0FBRyxHQUFHQSxHQUFHLENBQUNsQixLQUFKLENBQVUsQ0FBVixFQUFha0IsR0FBRyxDQUFDM0IsT0FBSixDQUFZOEIsT0FBTyxDQUFDLENBQUQsQ0FBbkIsQ0FBYixDQUFOO0FBQ0Q7O0FBQ0QsU0FBT0gsR0FBUDtBQUNELEMsQ0FFRDtBQUNBO0FBQ0E7OztBQUNBM0Qsc0JBQVUrRCxPQUFWLENBQWtCLDZDQUFsQixFQUNHNUQsTUFESCxDQUNVLFNBRFYsRUFDcUIsMEJBRHJCLEVBRUdBLE1BRkgsQ0FFVSxTQUZWLEVBRXFCLG9CQUZyQixFQUdHQSxNQUhILENBR1UsVUFIVixFQUdzQiwrQ0FIdEIsRUFJR0EsTUFKSCxDQUlVLGFBSlYsRUFJeUIscUNBSnpCLEVBS0dBLE1BTEgsQ0FLVSxRQUxWLEVBS29CLDBGQUxwQixFQU1HQSxNQU5ILENBTVUscUJBTlYsRUFNaUMsMENBTmpDLEVBT0dBLE1BUEgsQ0FPVSx3QkFQVixFQU9vQyx3REFQcEMsRUFRR0EsTUFSSCxDQVFVLGdCQVJWLEVBUTRCLHVCQVI1QixFQVNHNkQsV0FUSCxDQVNlLDRCQVRmLEVBVUdDLE1BVkgsQ0FVVSxVQUFVTixHQUFWLEVBQWVPLElBQWYsRUFBcUI7QUFDM0IsTUFBSUEsSUFBSSxDQUFDQyxTQUFMLElBQWtCLElBQWxCLElBQTBCRCxJQUFJLENBQUNFLElBQUwsSUFBYSxJQUEzQyxFQUNFLE9BQU94RSxHQUFHLENBQUN5RSxVQUFKLENBQWVWLEdBQWYsRUFBb0JPLElBQXBCLEVBQTBCLGNBQTFCLENBQVAsQ0FERixLQUVLLElBQUlBLElBQUksQ0FBQ0MsU0FBTCxJQUFrQixJQUF0QixFQUNILE9BQU92RSxHQUFHLENBQUN5RSxVQUFKLENBQWVWLEdBQWYsRUFBb0JPLElBQXBCLEVBQTBCLGFBQTFCLENBQVA7O0FBRUYsTUFBSVAsR0FBRyxJQUFJLEdBQVgsRUFBZ0I7QUFDZHRFLElBQUFBLE9BQU8sQ0FBQ2lGLEtBQVIsQ0FBY0MsTUFBZDtBQUNBbEYsSUFBQUEsT0FBTyxDQUFDaUYsS0FBUixDQUFjRSxXQUFkLENBQTBCLE1BQTFCO0FBQ0FuRixJQUFBQSxPQUFPLENBQUNpRixLQUFSLENBQWNHLEVBQWQsQ0FBaUIsTUFBakIsRUFBeUIsVUFBVWQsR0FBVixFQUFlO0FBQ3RDdEUsTUFBQUEsT0FBTyxDQUFDaUYsS0FBUixDQUFjSSxLQUFkOztBQUNBOUUsTUFBQUEsR0FBRyxDQUFDK0UsVUFBSixDQUFlaEIsR0FBZixFQUFvQjNELHFCQUFwQixFQUErQixrQkFBL0IsRUFBbUQsTUFBbkQ7QUFDRCxLQUhEO0FBSUQsR0FQRCxNQVFLO0FBQ0g7QUFDQTJELElBQUFBLEdBQUcsR0FBR0QsaUJBQWlCLENBQUNDLEdBQUQsQ0FBdkI7O0FBQ0EsUUFBSUEsR0FBRyxDQUFDUixNQUFKLEtBQWUsQ0FBbkIsRUFBc0I7QUFDcEJRLE1BQUFBLEdBQUcsR0FBRyxDQUFDUCxzQkFBSXdCLHFCQUFMLENBQU47QUFDRDs7QUFDRCxRQUFJQyxHQUFHLEdBQUcsRUFBVjtBQUNBLGtDQUFhbEIsR0FBYixFQUFrQixDQUFsQixFQUFxQixVQUFVbUIsTUFBVixFQUFrQkMsSUFBbEIsRUFBd0I7QUFDM0NuRixNQUFBQSxHQUFHLENBQUNvRixLQUFKLENBQVVGLE1BQVYsRUFBa0I5RSxxQkFBbEIsRUFBNkIsVUFBQ2dCLEdBQUQsRUFBTWlFLElBQU4sRUFBZTtBQUMxQ0osUUFBQUEsR0FBRyxHQUFHQSxHQUFHLENBQUNLLE1BQUosQ0FBV0QsSUFBWCxDQUFOO0FBQ0FGLFFBQUFBLElBQUksQ0FBQy9ELEdBQUQsQ0FBSjtBQUNELE9BSEQ7QUFJRCxLQUxELEVBS0csVUFBVUEsR0FBVixFQUFlbUUsRUFBZixFQUFtQjtBQUNwQixVQUFJbkUsR0FBRyxJQUFJQSxHQUFHLENBQUNvRSxPQUFYLEtBQ0RwRSxHQUFHLENBQUNvRSxPQUFKLENBQVlDLFFBQVosQ0FBcUIsa0JBQXJCLE1BQTZDLElBQTdDLElBQ0NyRSxHQUFHLENBQUNvRSxPQUFKLENBQVlDLFFBQVosQ0FBcUIsdUJBQXJCLE1BQWtELElBRmxELENBQUosRUFFNkQ7QUFDM0R6RixRQUFBQSxHQUFHLENBQUMwRixPQUFKLENBQVksQ0FBWjtBQUNELE9BSkQsTUFNRTFGLEdBQUcsQ0FBQzJGLFNBQUosQ0FBY3ZFLEdBQUcsR0FBRyxDQUFILEdBQU8sQ0FBeEIsRUFBMkI2RCxHQUEzQjtBQUNILEtBYkQ7QUFjRDtBQUNGLENBOUNIOztBQWdEQTdFLHNCQUFVK0QsT0FBVixDQUFrQiw2REFBbEIsRUFDR0MsV0FESCxDQUNlLHdCQURmLEVBRUdDLE1BRkgsQ0FFVSxVQUFVdUIsS0FBVixFQUFpQkMsV0FBakIsRUFBOEJDLE1BQTlCLEVBQXNDO0FBQzVDOUYsRUFBQUEsR0FBRyxDQUFDK0YsT0FBSixDQUFZSCxLQUFaLEVBQW1CQyxXQUFuQixFQUFnQ0MsTUFBaEM7QUFDRCxDQUpIOztBQU1BMUYsc0JBQVUrRCxPQUFWLENBQWtCLDJCQUFsQixFQUNHQyxXQURILENBQ2Usa0JBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVVOLEdBQVYsRUFBZTtBQUNyQi9ELEVBQUFBLEdBQUcsQ0FBQ2dHLE1BQUosQ0FBV2pDLEdBQVgsRUFBZ0IzRCxxQkFBaEI7QUFDRCxDQUpIOztBQU1BQSxzQkFBVStELE9BQVYsQ0FBa0IsdUJBQWxCLEVBQ0dDLFdBREgsQ0FDZSw0QkFEZixFQUVHQyxNQUZILENBRVUsVUFBVTRCLElBQVYsRUFBZ0I7QUFDdEJqRyxFQUFBQSxHQUFHLENBQUMrRSxVQUFKLENBQWVrQixJQUFmLEVBQXFCN0YscUJBQXJCLEVBQWdDLGtCQUFoQztBQUNELENBSkg7O0FBTUFBLHNCQUFVK0QsT0FBVixDQUFrQixzQkFBbEIsRUFDR0MsV0FESCxDQUNlLHNDQURmLEVBRUdDLE1BRkgsQ0FFVSxVQUFVNEIsSUFBVixFQUFnQjtBQUN0QmpHLEVBQUFBLEdBQUcsQ0FBQytFLFVBQUosQ0FBZWtCLElBQWYsRUFBcUI3RixxQkFBckIsRUFBZ0MsaUJBQWhDO0FBQ0QsQ0FKSDs7QUFNQUEsc0JBQVUrRCxPQUFWLENBQWtCLGdCQUFsQixFQUNHQyxXQURILENBQ2UsaUNBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVU2QixHQUFWLEVBQWU7QUFDckJsRyxFQUFBQSxHQUFHLENBQUNtRyxNQUFKLENBQVdELEdBQVg7QUFDRCxDQUpIOztBQU1BOUYsc0JBQVUrRCxPQUFWLENBQWtCLFFBQWxCLEVBQ0dDLFdBREgsQ0FDZSxpQ0FEZixFQUVHQyxNQUZILENBRVUsWUFBWTtBQUNsQnJFLEVBQUFBLEdBQUcsQ0FBQ29HLFdBQUo7QUFDRCxDQUpIOztBQU1BaEcsc0JBQVUrRCxPQUFWLENBQWtCLDhCQUFsQixFQUNHQyxXQURILENBQ2Usc0NBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVU0QixJQUFWLEVBQWdCO0FBQ3RCakcsRUFBQUEsR0FBRyxDQUFDK0UsVUFBSixDQUFla0IsSUFBZixFQUFxQjdGLHFCQUFyQixFQUFnQyxxQkFBaEM7QUFDRCxDQUpILEUsQ0FNQTtBQUNBO0FBQ0E7OztBQUNBQSxzQkFBVStELE9BQVYsQ0FBa0IsNENBQWxCLEVBQ0c1RCxNQURILENBQ1UsU0FEVixFQUNxQixrQ0FEckIsRUFFRzZELFdBRkgsQ0FFZSxnQkFGZixFQUdHQyxNQUhILENBR1UsVUFBVWdDLEtBQVYsRUFBaUI7QUFDdkIsZ0NBQWFBLEtBQWIsRUFBb0IsQ0FBcEIsRUFBdUIsVUFBVW5CLE1BQVYsRUFBa0JDLElBQWxCLEVBQXdCO0FBQzdDbkYsSUFBQUEsR0FBRyxDQUFDc0csSUFBSixDQUFTcEIsTUFBVCxFQUFpQkMsSUFBakI7QUFDRCxHQUZELEVBRUcsVUFBVS9ELEdBQVYsRUFBZTtBQUNoQnBCLElBQUFBLEdBQUcsQ0FBQzJGLFNBQUosQ0FBY3ZFLEdBQUcsR0FBRyxDQUFILEdBQU8sQ0FBeEI7QUFDRCxHQUpEO0FBS0QsQ0FUSCxFLENBV0E7QUFDQTtBQUNBOzs7QUFDQWhCLHNCQUFVK0QsT0FBVixDQUFrQiwrQ0FBbEIsRUFDRzVELE1BREgsQ0FDVSxTQURWLEVBQ3FCLG9DQURyQixFQUVHNkQsV0FGSCxDQUVlLG1CQUZmLEVBR0dDLE1BSEgsQ0FHVSxVQUFVZ0MsS0FBVixFQUFpQjtBQUN2QjtBQUNBQSxFQUFBQSxLQUFLLEdBQUd2QyxpQkFBaUIsQ0FBQ3VDLEtBQUQsQ0FBekI7QUFDQSxNQUFJcEIsR0FBRyxHQUFHLEVBQVY7QUFDQSxnQ0FBYW9CLEtBQWIsRUFBb0IsQ0FBcEIsRUFBdUIsVUFBVW5CLE1BQVYsRUFBa0JDLElBQWxCLEVBQXdCO0FBQzdDbkYsSUFBQUEsR0FBRyxDQUFDdUcsT0FBSixDQUFZckIsTUFBWixFQUFvQjlFLHFCQUFwQixFQUErQixVQUFDZ0IsR0FBRCxFQUFNaUUsSUFBTixFQUFlO0FBQzVDSixNQUFBQSxHQUFHLEdBQUdBLEdBQUcsQ0FBQ0ssTUFBSixDQUFXRCxJQUFYLENBQU47QUFDQUYsTUFBQUEsSUFBSSxDQUFDL0QsR0FBRCxDQUFKO0FBQ0QsS0FIRDtBQUlELEdBTEQsRUFLRyxVQUFVQSxHQUFWLEVBQWU7QUFDaEJwQixJQUFBQSxHQUFHLENBQUMyRixTQUFKLENBQWN2RSxHQUFHLEdBQUcsQ0FBSCxHQUFPLENBQXhCLEVBQTJCNkQsR0FBM0I7QUFDRCxHQVBEO0FBUUQsQ0FmSCxFLENBaUJBO0FBQ0E7QUFDQTs7O0FBQ0E3RSxzQkFBVStELE9BQVYsQ0FBa0IsMkJBQWxCLEVBQ0dDLFdBREgsQ0FDZSx5RUFEZixFQUVHQyxNQUZILENBRVUsVUFBVW1DLFFBQVYsRUFBb0JDLE1BQXBCLEVBQTRCO0FBQ2xDekcsRUFBQUEsR0FBRyxDQUFDMEcsS0FBSixDQUFVRixRQUFWLEVBQW9CQyxNQUFwQjtBQUNELENBSkgsRSxDQU1BO0FBQ0E7QUFDQTs7O0FBQ0FyRyxzQkFBVStELE9BQVYsQ0FBa0Isb0JBQWxCLEVBQ0dDLFdBREgsQ0FDZSx3QkFEZixFQUVHQyxNQUZILENBRVUsVUFBVXNDLElBQVYsRUFBZ0I7QUFDdEIzRyxFQUFBQSxHQUFHLENBQUM0RyxPQUFKLENBQVksS0FBWixFQUFtQkQsSUFBbkI7QUFDRCxDQUpILEUsQ0FNQTtBQUNBO0FBQ0E7OztBQUNBdkcsc0JBQVUrRCxPQUFWLENBQWtCLG9CQUFsQixFQUNHQyxXQURILENBQ2UsaUJBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVVzQyxJQUFWLEVBQWdCO0FBQ3RCM0csRUFBQUEsR0FBRyxDQUFDNEcsT0FBSixDQUFZLEtBQVosRUFBbUJELElBQW5CO0FBQ0QsQ0FKSCxFLENBTUE7QUFDQTtBQUNBOzs7QUFDQXZHLHNCQUFVK0QsT0FBVixDQUFrQixnQ0FBbEIsRUFDR0MsV0FESCxDQUNlLDJEQURmLEVBRUdDLE1BRkgsQ0FFVSxVQUFVd0MsTUFBVixFQUFrQjtBQUN4QjdHLEVBQUFBLEdBQUcsQ0FBQzhHLE1BQUosQ0FBV0QsTUFBWCxFQUFtQnpHLHFCQUFuQjtBQUNELENBSkg7O0FBTUFBLHNCQUFVK0QsT0FBVixDQUFrQixXQUFsQixFQUNHQyxXQURILENBQ2Usd0JBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVU3QixJQUFWLEVBQWdCO0FBQ3RCeEMsRUFBQUEsR0FBRyxDQUFDK0csa0JBQUosQ0FBdUJ2RSxJQUF2QjtBQUNELENBSkgsRSxDQU1BOzs7QUFDQXBDLHNCQUFVK0QsT0FBVixDQUFrQixnQkFBbEIsRUFDR0MsV0FESCxDQUNlLG1CQURmLEVBRUdDLE1BRkgsQ0FFVSxVQUFVTixHQUFWLEVBQWU7QUFDckIvRCxFQUFBQSxHQUFHLENBQUNnSCxPQUFKLENBQVlqRCxHQUFaLEVBQWlCM0QscUJBQWpCO0FBQ0QsQ0FKSCxFLENBTUE7QUFDQTtBQUNBOzs7QUFDQUEsc0JBQVUrRCxPQUFWLENBQWtCLHFEQUFsQixFQUNHOEMsS0FESCxDQUNTLEtBRFQsRUFFRzdDLFdBRkgsQ0FFZSxpREFGZixFQUdHQyxNQUhILENBR1UsVUFBVTdCLElBQVYsRUFBZ0I7QUFDdEIsTUFBSUEsSUFBSSxJQUFJLEdBQVosRUFBaUI7QUFDZi9DLElBQUFBLE9BQU8sQ0FBQ2lGLEtBQVIsQ0FBY0MsTUFBZDtBQUNBbEYsSUFBQUEsT0FBTyxDQUFDaUYsS0FBUixDQUFjRSxXQUFkLENBQTBCLE1BQTFCO0FBQ0FuRixJQUFBQSxPQUFPLENBQUNpRixLQUFSLENBQWNHLEVBQWQsQ0FBaUIsTUFBakIsRUFBeUIsVUFBVXdCLEtBQVYsRUFBaUI7QUFDeEM1RyxNQUFBQSxPQUFPLENBQUNpRixLQUFSLENBQWNJLEtBQWQ7QUFDQTlFLE1BQUFBLEdBQUcsVUFBSCxDQUFXcUcsS0FBWCxFQUFrQixNQUFsQjtBQUNELEtBSEQ7QUFJRCxHQVBELE1BUUUsOEJBQWE3RCxJQUFiLEVBQW1CLENBQW5CLEVBQXNCLFVBQVUwQyxNQUFWLEVBQWtCQyxJQUFsQixFQUF3QjtBQUM1Q25GLElBQUFBLEdBQUcsVUFBSCxDQUFXa0YsTUFBWCxFQUFtQixFQUFuQixFQUF1QkMsSUFBdkI7QUFDRCxHQUZELEVBRUcsVUFBVS9ELEdBQVYsRUFBZTtBQUNoQnBCLElBQUFBLEdBQUcsQ0FBQzJGLFNBQUosQ0FBY3ZFLEdBQUcsR0FBRyxDQUFILEdBQU8sQ0FBeEI7QUFDRCxHQUpEO0FBS0gsQ0FqQkgsRSxDQW1CQTtBQUNBO0FBQ0E7OztBQUNBaEIsc0JBQVUrRCxPQUFWLENBQWtCLG1DQUFsQixFQUNHQyxXQURILENBQ2UsNENBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVU2QyxNQUFWLEVBQWtCTCxNQUFsQixFQUEwQjtBQUNoQyxNQUFJTSxLQUFLLENBQUNDLFFBQVEsQ0FBQ1AsTUFBRCxDQUFULENBQVQsRUFBNkI7QUFDM0JoRyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTBDLHNCQUFJQyxVQUFKLEdBQWlCLGlDQUFqQixHQUFxRG9ELE1BQWpFO0FBQ0E3RyxJQUFBQSxHQUFHLENBQUNxSCx1QkFBSixDQUE0QkgsTUFBNUIsRUFBb0NMLE1BQXBDO0FBQ0QsR0FIRCxNQUdPO0FBQ0xoRyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTBDLHNCQUFJQyxVQUFKLEdBQWlCLCtCQUFqQixHQUFtRG9ELE1BQS9EO0FBQ0E3RyxJQUFBQSxHQUFHLENBQUNzSCxxQkFBSixDQUEwQkosTUFBMUIsRUFBa0NMLE1BQWxDO0FBQ0Q7QUFDRixDQVZILEUsQ0FZQTtBQUNBO0FBQ0E7OztBQUNBekcsc0JBQVUrRCxPQUFWLENBQWtCLE1BQWxCLEVBQ0dDLFdBREgsQ0FDZSwrQ0FEZixFQUVHQyxNQUZILENBRVUsWUFBWTtBQUNsQnJFLEVBQUFBLEdBQUcsQ0FBQ3VILElBQUo7QUFDRCxDQUpIOztBQU1Bbkgsc0JBQVUrRCxPQUFWLENBQWtCLFdBQWxCLEVBQ0dDLFdBREgsQ0FDZSxxQ0FEZixFQUVHQyxNQUZILENBRVUsWUFBWTtBQUNsQnJFLEVBQUFBLEdBQUcsQ0FBQ3dILE1BQUo7QUFDRCxDQUpIOztBQUtBcEgsc0JBQVUrRCxPQUFWLENBQWtCLFFBQWxCLEVBQ0dDLFdBREgsQ0FDZSw2Q0FEZixFQUVHQyxNQUZILENBRVUsWUFBWTtBQUNsQnJFLEVBQUFBLEdBQUcsQ0FBQ3dILE1BQUo7QUFDRCxDQUpIO0FBTUE7Ozs7O0FBR0FwSCxzQkFBVStELE9BQVYsQ0FBa0IsNkJBQWxCLEVBQ0c4QyxLQURILENBQ1MsZ0JBRFQsRUFFRzFHLE1BRkgsQ0FFVSxXQUZWLEVBRXVCLGtCQUZ2QixFQUdHQSxNQUhILENBR1UsV0FIVixFQUd1Qix5Q0FIdkIsRUFJR0EsTUFKSCxDQUlVLFVBSlYsRUFJc0IscUJBSnRCLEVBS0dBLE1BTEgsQ0FLVSxNQUxWLEVBS2tCLDZDQUxsQixFQU1HQSxNQU5ILENBTVUsZUFOVixFQU0yQixnRUFOM0IsRUFPRzZELFdBUEgsQ0FPZSwrQ0FQZixFQVFHQyxNQVJILENBUVUsVUFBVW9ELFdBQVYsRUFBdUJuRCxJQUF2QixFQUE2QjtBQUNuQ29ELEVBQUFBLE9BQU8sQ0FBQyxNQUFELENBQVAsQ0FBZ0JDLE9BQWhCLENBQXdCdkgscUJBQXhCLEVBQW1Da0UsSUFBbkM7O0FBQ0F0RSxFQUFBQSxHQUFHLENBQUM0SCxPQUFKLENBQVlILFdBQVosRUFBeUJySCxxQkFBekI7QUFDRCxDQVhIOztBQWFBQSxzQkFBVStELE9BQVYsQ0FBa0IsbUNBQWxCLEVBQ0dDLFdBREgsQ0FDZSxvQ0FEZixFQUVHQyxNQUZILENBRVUsVUFBVW9ELFdBQVYsRUFBdUI7QUFDN0J6SCxFQUFBQSxHQUFHLENBQUM0SCxPQUFKLENBQVlILFdBQVo7QUFDRCxDQUpIOztBQU9Bckgsc0JBQVUrRCxPQUFWLENBQWtCLDRCQUFsQixFQUNHQyxXQURILENBQ2UsNENBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVVtQyxRQUFWLEVBQW9CO0FBQzFCeEcsRUFBQUEsR0FBRyxDQUFDNkgsb0JBQUosQ0FBeUJyQixRQUF6QjtBQUNELENBSkg7O0FBTUFwRyxzQkFBVStELE9BQVYsQ0FBa0Isb0JBQWxCLEVBQ0c4QyxLQURILENBQ1Msa0JBRFQsRUFFRzdDLFdBRkgsQ0FFZSw2QkFGZixFQUdHQyxNQUhILENBR1UsVUFBVW9ELFdBQVYsRUFBdUI7QUFDN0J6SCxFQUFBQSxHQUFHLENBQUM4SCxTQUFKLENBQWNMLFdBQWQ7QUFDRCxDQUxIOztBQU9Bckgsc0JBQVUrRCxPQUFWLENBQWtCLGtCQUFsQixFQUNHQyxXQURILENBQ2UsaUNBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVUwRCxNQUFWLEVBQWtCO0FBQ3hCL0gsRUFBQUEsR0FBRyxXQUFILENBQVkrSCxNQUFaO0FBQ0QsQ0FKSDs7QUFNQTNILHNCQUFVK0QsT0FBVixDQUFrQixrQkFBbEIsRUFDRzVELE1BREgsQ0FDVSxPQURWLEVBQ21CLGdCQURuQixFQUVHMEcsS0FGSCxDQUVTLGdCQUZULEVBR0c3QyxXQUhILENBR2UseUNBSGYsRUFJR0MsTUFKSCxDQUlVLFVBQVUyRCxNQUFWLEVBQWtCMUQsSUFBbEIsRUFBd0I7QUFDOUJ0RSxFQUFBQSxHQUFHLENBQUNpSSxPQUFKLENBQVlELE1BQVosRUFBb0IxRCxJQUFwQjtBQUNELENBTkg7O0FBUUFsRSxzQkFBVStELE9BQVYsQ0FBa0IsbUJBQWxCLEVBQ0dDLFdBREgsQ0FDZSx5Q0FEZixFQUVHQyxNQUZILENBRVUsVUFBVTZELEdBQVYsRUFBZUMsS0FBZixFQUFzQjtBQUM1Qm5JLEVBQUFBLEdBQUcsQ0FBQ29JLEdBQUosQ0FBUUYsR0FBUixFQUFhQyxLQUFiO0FBQ0QsQ0FKSDs7QUFNQS9ILHNCQUFVK0QsT0FBVixDQUFrQixrQkFBbEIsRUFDR0MsV0FESCxDQUNlLGtDQURmLEVBRUdDLE1BRkgsQ0FFVSxVQUFVZ0UsR0FBVixFQUFlO0FBQ3JCckksRUFBQUEsR0FBRyxDQUFDc0ksUUFBSixDQUFhRCxHQUFiO0FBQ0QsQ0FKSDs7QUFNQWpJLHNCQUFVK0QsT0FBVixDQUFrQixXQUFsQixFQUNHQyxXQURILENBQ2UscUJBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVU2RCxHQUFWLEVBQWU7QUFDckJsSSxFQUFBQSxHQUFHLENBQUN1SSxHQUFKLENBQVFMLEdBQVI7QUFDRCxDQUpIOztBQU1BOUgsc0JBQVUrRCxPQUFWLENBQWtCLG9CQUFsQixFQUNHQyxXQURILENBQ2UsZ0NBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVU2RCxHQUFWLEVBQWVDLEtBQWYsRUFBc0I7QUFDNUJuSSxFQUFBQSxHQUFHLENBQUN1SSxHQUFKO0FBQ0QsQ0FKSDs7QUFNQW5JLHNCQUFVK0QsT0FBVixDQUFrQixzQkFBbEIsRUFDR0MsV0FESCxDQUNlLGdDQURmLEVBRUdDLE1BRkgsQ0FFVSxVQUFVNkQsR0FBVixFQUFlQyxLQUFmLEVBQXNCO0FBQzVCbkksRUFBQUEsR0FBRyxDQUFDd0ksSUFBSixDQUFTTixHQUFULEVBQWNDLEtBQWQ7QUFDRCxDQUpIOztBQU1BL0gsc0JBQVUrRCxPQUFWLENBQWtCLGFBQWxCLEVBQ0dDLFdBREgsQ0FDZSxtQ0FEZixFQUVHQyxNQUZILENBRVUsVUFBVTZELEdBQVYsRUFBZTtBQUNyQmxJLEVBQUFBLEdBQUcsQ0FBQ3lJLEtBQUosQ0FBVVAsR0FBVjtBQUNELENBSkg7O0FBTUE5SCxzQkFBVStELE9BQVYsQ0FBa0IsUUFBbEIsRUFDR0MsV0FESCxDQUNlLGtFQURmLEVBRUdDLE1BRkgsQ0FFVSxVQUFVNkQsR0FBVixFQUFlO0FBQ3JCbEksRUFBQUEsR0FBRyxDQUFDMEksTUFBSjtBQUNELENBSkgsRSxDQU1BO0FBQ0E7QUFDQTs7O0FBQ0F0SSxzQkFBVStELE9BQVYsQ0FBa0IsK0JBQWxCLEVBQ0c1RCxNQURILENBQ1UsbUJBRFYsRUFDK0IsbUJBRC9CLEVBRUdBLE1BRkgsQ0FFVSxNQUZWLEVBRWtCLGdCQUZsQixFQUdHQSxNQUhILENBR1UsUUFIVixFQUdvQixXQUhwQixFQUlHNkQsV0FKSCxDQUllLHdDQUpmLEVBS0dDLE1BTEgsQ0FLVXJFLEdBQUcsQ0FBQzJJLGNBQUosQ0FBbUJDLElBQW5CLENBQXdCNUksR0FBeEIsQ0FMVjs7QUFPQUksc0JBQVUrRCxPQUFWLENBQWtCLFFBQWxCLEVBQ0dDLFdBREgsQ0FDZSwwQ0FEZixFQUVHQyxNQUZILENBRVUsWUFBWTtBQUNsQnJFLEVBQUFBLEdBQUcsQ0FBQzZJLE1BQUo7QUFDRCxDQUpIOztBQU1Bekksc0JBQVUrRCxPQUFWLENBQWtCLGdCQUFsQixFQUNHQyxXQURILENBQ2Usd0JBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVU3QixJQUFWLEVBQWdCO0FBQ3RCLE1BQUlBLElBQUksS0FBS3NHLFNBQWIsRUFBd0I7QUFDdEIsV0FBT0MsV0FBVyxFQUFsQjtBQUNEOztBQUNEL0ksRUFBQUEsR0FBRyxDQUFDZ0osWUFBSixDQUFpQixTQUFqQixFQUE0QnhHLElBQTVCO0FBQ0QsQ0FQSDs7QUFTQXBDLHNCQUFVK0QsT0FBVixDQUFrQixrQkFBbEIsRUFDR0MsV0FESCxDQUNlLDBCQURmLEVBRUdDLE1BRkgsQ0FFVSxVQUFVN0IsSUFBVixFQUFnQjtBQUN0QnhDLEVBQUFBLEdBQUcsQ0FBQ2dKLFlBQUosQ0FBaUIsV0FBakIsRUFBOEJ4RyxJQUE5QjtBQUNELENBSkg7O0FBTUFwQyxzQkFBVStELE9BQVYsQ0FBa0IsTUFBbEIsRUFDR0MsV0FESCxDQUNlLG1DQURmLEVBRUdDLE1BRkgsQ0FFVSxVQUFVN0IsSUFBVixFQUFnQjtBQUN0QnhDLEVBQUFBLEdBQUcsQ0FBQ2lKLGFBQUo7QUFDRCxDQUpIOztBQU1BLFNBQVNGLFdBQVQsQ0FBcUI1RSxPQUFyQixFQUErQkcsSUFBL0IsRUFBc0M7QUFDcEMsTUFBSUEsSUFBSSxJQUFJQSxJQUFJLENBQUM0RSxRQUFqQixFQUEyQjtBQUN6QnpKLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZeUosZUFBWixHQUE4QjdFLElBQUksQ0FBQzRFLFFBQW5DO0FBQ0Q7O0FBRUQsU0FBT2hKLGtCQUFha0osTUFBYixDQUFvQmpGLE9BQXBCLEVBQTZCRyxJQUE3QixDQUFQO0FBQ0Q7O0FBRURsRSxzQkFBVStELE9BQVYsQ0FBa0IseUJBQWxCLEVBQ0c4QyxLQURILENBQ1MsVUFEVCxFQUVHMUcsTUFGSCxDQUVVLG1CQUZWLEVBRStCLDJDQUYvQixFQUdHQSxNQUhILENBR1UsZUFIVixFQUcyQixhQUgzQixFQUlHQSxNQUpILENBSVUsa0JBSlYsRUFJOEIsaUNBSjlCLEVBS0c2RCxXQUxILENBS2UsaUJBTGYsRUFNR0MsTUFOSCxDQU1VMEUsV0FOVjs7QUFRQTNJLHNCQUFVK0QsT0FBVixDQUFrQixPQUFsQixFQUNHQyxXQURILENBQ2UsbUJBRGYsRUFFR0MsTUFGSCxDQUVVLFlBQVk7QUFDbEIsU0FBTzBFLFdBQVcsQ0FBQyxPQUFELENBQWxCO0FBQ0QsQ0FKSDs7QUFNQTNJLHNCQUFVK0QsT0FBVixDQUFrQixRQUFsQixFQUNHQyxXQURILENBQ2Usc0JBRGYsRUFFR0MsTUFGSCxDQUVVLFlBQVk7QUFDbEIsU0FBTzBFLFdBQVcsQ0FBQyxRQUFELENBQWxCO0FBQ0QsQ0FKSCxFLENBTUE7QUFDQTtBQUNBOzs7QUFDQTNJLHNCQUFVK0QsT0FBVixDQUFrQixNQUFsQixFQUNHOEMsS0FESCxDQUNTLE1BRFQsRUFFRzFHLE1BRkgsQ0FFVSxTQUZWLEVBRXFCLDRDQUZyQixFQUdHNkQsV0FISCxDQUdlLGdEQUhmLEVBSUdDLE1BSkgsQ0FJVWxCLGFBQWEsQ0FBQyxVQUFVbUIsSUFBVixFQUFnQjtBQUNwQ3RFLEVBQUFBLEdBQUcsQ0FBQ3FKLElBQUosQ0FBU2pKLHNCQUFVa0osS0FBbkI7QUFDRCxDQUZvQixDQUp2QixFLENBUUE7QUFDQTtBQUNBOzs7QUFDQWxKLHNCQUFVK0QsT0FBVixDQUFrQixXQUFsQixFQUNHQyxXQURILENBQ2Usd0JBRGYsRUFFR0MsTUFGSCxDQUVVbEIsYUFBYSxDQUFDLFlBQVk7QUFDaENuRCxFQUFBQSxHQUFHLENBQUN1SixTQUFKO0FBQ0QsQ0FGb0IsQ0FGdkIsRSxDQU1BO0FBQ0E7QUFDQTs7O0FBQ0FuSixzQkFBVStELE9BQVYsQ0FBa0IscUJBQWxCLEVBQ0dDLFdBREgsQ0FDZSx1QkFEZixFQUVHQyxNQUZILENBRVUsVUFBVXVCLEtBQVYsRUFBaUI0RCxJQUFqQixFQUF1QjtBQUM3QnhKLEVBQUFBLEdBQUcsQ0FBQ3lKLGVBQUosQ0FBb0I3RCxLQUFwQixFQUEyQjRELElBQTNCO0FBQ0QsQ0FKSCxFLENBTUE7QUFDQTtBQUNBO0FBQ0E7OztBQUNBcEosc0JBQVUrRCxPQUFWLENBQWtCLG9DQUFsQixFQUNHQyxXQURILENBQ2UsMERBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVV1QixLQUFWLEVBQWlCOEQsU0FBakIsRUFBNEI7QUFDbEMxSixFQUFBQSxHQUFHLENBQUMySixNQUFKLENBQVcvRCxLQUFYLEVBQWtCOEQsU0FBbEI7QUFDRCxDQUpILEUsQ0FNQTtBQUNBO0FBQ0E7OztBQUNBdEosc0JBQVUrRCxPQUFWLENBQWtCLFdBQWxCLEVBQ0dDLFdBREgsQ0FDZSx1Q0FEZixFQUVHQyxNQUZILENBRVVsQixhQUFhLENBQUMsWUFBWTtBQUNoQ3RDLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZMEMsc0JBQUlDLFVBQUosR0FBaUIsY0FBN0I7QUFDQXpELEVBQUFBLEdBQUcsQ0FBQzRKLFNBQUo7QUFDRCxDQUhvQixDQUZ2QixFLENBT0E7QUFDQTtBQUNBOzs7QUFDQXhKLHNCQUFVK0QsT0FBVixDQUFrQixzQkFBbEIsRUFDR0MsV0FESCxDQUNlLDhCQURmLEVBRUdDLE1BRkgsQ0FFVSxVQUFVd0YsUUFBVixFQUFvQjtBQUMxQjdKLEVBQUFBLEdBQUcsQ0FBQzhKLGdCQUFKLENBQXFCRCxRQUFyQixFQUErQnpKLHFCQUEvQjtBQUNELENBSkgsRSxDQU1BO0FBQ0E7QUFDQTs7O0FBQ0FBLHNCQUFVK0QsT0FBVixDQUFrQixvQkFBbEIsRUFDR0MsV0FESCxDQUNlLDZCQURmLEVBRUdDLE1BRkgsQ0FFVSxVQUFVd0YsUUFBVixFQUFvQjtBQUMxQjdKLEVBQUFBLEdBQUcsQ0FBQytKLE9BQUosQ0FBWUYsUUFBWixFQUFzQnpKLHFCQUF0QjtBQUNELENBSkgsRSxDQU1BO0FBQ0E7QUFDQTs7O0FBQ0FBLHNCQUFVK0QsT0FBVixDQUFrQixXQUFsQixFQUNHQyxXQURILENBQ2Usc0NBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVVOLEdBQVYsRUFBZTtBQUNyQi9ELEVBQUFBLEdBQUcsQ0FBQ2dLLFNBQUosQ0FBYzVKLHFCQUFkO0FBQ0QsQ0FKSCxFLENBTUE7QUFDQTtBQUNBOzs7QUFFQUEsc0JBQVUrRCxPQUFWLENBQWtCLGtCQUFsQixFQUNHOEMsS0FESCxDQUNTLE1BRFQsRUFFRzdDLFdBRkgsQ0FFZSx1REFGZixFQUdHQyxNQUhILENBR1UsVUFBVTRGLElBQVYsRUFBZ0I7QUFDdEJqSyxFQUFBQSxHQUFHLENBQUNrSyxjQUFKLENBQW1CRCxJQUFuQjtBQUNELENBTEg7O0FBT0E3SixzQkFBVStELE9BQVYsQ0FBa0IscUJBQWxCLEVBQ0dDLFdBREgsQ0FDZSw0QkFEZixFQUVHQyxNQUZILENBRVUsVUFBVThGLE9BQVYsRUFBbUI7QUFDekJuSyxFQUFBQSxHQUFHLENBQUNvSyxLQUFKLENBQVVELE9BQVY7QUFDRCxDQUpIOztBQU1BL0osc0JBQVUrRCxPQUFWLENBQWtCLG9CQUFsQixFQUNHQyxXQURILENBQ2Usc0NBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVU4RixPQUFWLEVBQW1CO0FBQ3pCbkssRUFBQUEsR0FBRyxDQUFDcUssUUFBSixDQUFhRixPQUFiO0FBQ0QsQ0FKSDs7QUFNQS9KLHNCQUFVK0QsT0FBVixDQUFrQixnQkFBbEIsRUFDR0MsV0FESCxDQUNlLDhDQURmLEVBRUdDLE1BRkgsQ0FFVSxVQUFVOEYsT0FBVixFQUFtQjtBQUN6Qm5LLEVBQUFBLEdBQUcsQ0FBQ3FLLFFBQUosQ0FBYUYsT0FBYjtBQUNELENBSkg7O0FBTUEvSixzQkFBVStELE9BQVYsQ0FBa0IsZ0JBQWxCLEVBQ0dDLFdBREgsQ0FDZSw4Q0FEZixFQUVHQyxNQUZILENBRVUsVUFBVThGLE9BQVYsRUFBbUI7QUFDekJuSyxFQUFBQSxHQUFHLENBQUNxSyxRQUFKLENBQWFGLE9BQWI7QUFDRCxDQUpIOztBQU1BL0osc0JBQVUrRCxPQUFWLENBQWtCLGdCQUFsQixFQUNHQyxXQURILENBQ2UsOENBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVU4RixPQUFWLEVBQW1CO0FBQ3pCbkssRUFBQUEsR0FBRyxDQUFDcUssUUFBSixDQUFhRixPQUFiO0FBQ0QsQ0FKSDs7QUFNQS9KLHNCQUFVK0QsT0FBVixDQUFrQixVQUFsQixFQUNHQyxXQURILENBQ2UsZ0RBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVU4RixPQUFWLEVBQW1CO0FBQ3pCbkssRUFBQUEsR0FBRyxDQUFDTixHQUFKLENBQVF5SyxPQUFSO0FBQ0QsQ0FKSCxFLENBTUE7QUFDQTtBQUNBOzs7QUFDQS9KLHNCQUNHK0QsT0FESCxDQUNXLE1BRFgsRUFFRzhDLEtBRkgsQ0FFUyxJQUZULEVBR0c3QyxXQUhILENBR2Usb0JBSGYsRUFJR0MsTUFKSCxDQUlVLFlBQVk7QUFDbEJyRSxFQUFBQSxHQUFHLENBQUNzQyxJQUFKLENBQVNsQyxxQkFBVDtBQUNELENBTkg7O0FBUUFBLHNCQUFVK0QsT0FBVixDQUFrQixHQUFsQixFQUNHQyxXQURILENBQ2UsNEJBRGYsRUFFR0MsTUFGSCxDQUVVLFlBQVk7QUFDbEJyRSxFQUFBQSxHQUFHLENBQUNzQyxJQUFKO0FBQ0QsQ0FKSDs7QUFNQWxDLHNCQUFVK0QsT0FBVixDQUFrQixJQUFsQixFQUNHQyxXQURILENBQ2UsNEJBRGYsRUFFR0MsTUFGSCxDQUVVLFlBQVk7QUFDbEJyRSxFQUFBQSxHQUFHLENBQUNzQyxJQUFKO0FBQ0QsQ0FKSDs7QUFNQWxDLHNCQUFVK0QsT0FBVixDQUFrQixRQUFsQixFQUNHQyxXQURILENBQ2UsNEJBRGYsRUFFR0MsTUFGSCxDQUVVLFlBQVk7QUFDbEJyRSxFQUFBQSxHQUFHLENBQUNzQyxJQUFKO0FBQ0QsQ0FKSCxFLENBT0E7OztBQUNBbEMsc0JBQVUrRCxPQUFWLENBQWtCLE9BQWxCLEVBQ0dDLFdBREgsQ0FDZSxtQ0FEZixFQUVHQyxNQUZILENBRVUsWUFBWTtBQUNsQnJFLEVBQUFBLEdBQUcsQ0FBQ3NLLEtBQUo7QUFDRCxDQUpIOztBQU1BbEssc0JBQVUrRCxPQUFWLENBQWtCLFVBQWxCLEVBQ0dDLFdBREgsQ0FDZSxnQ0FEZixFQUVHQyxNQUZILENBRVUsWUFBWTtBQUNsQnJFLEVBQUFBLEdBQUcsQ0FBQ3VLLG1CQUFKO0FBQ0QsQ0FKSDs7QUFNQW5LLHNCQUFVK0QsT0FBVixDQUFrQixPQUFsQixFQUNHOEMsS0FESCxDQUNTLFVBRFQsRUFFRzFHLE1BRkgsQ0FFVSxXQUZWLEVBRXVCLGNBRnZCLEVBR0c2RCxXQUhILENBR2UsMkJBSGYsRUFJR0MsTUFKSCxDQUlVLFVBQVVDLElBQVYsRUFBZ0I7QUFDdEJ0RSxFQUFBQSxHQUFHLENBQUN3SyxLQUFKLENBQVVsRyxJQUFJLENBQUNtRyxJQUFmO0FBQ0QsQ0FOSCxFLENBUUE7OztBQUNBckssc0JBQVUrRCxPQUFWLENBQWtCLFlBQWxCLEVBQ0dDLFdBREgsQ0FDZSxpQ0FEZixFQUVHQyxNQUZILENBRVVsQixhQUFhLENBQUMsWUFBWTtBQUNoQ25ELEVBQUFBLEdBQUcsQ0FBQ3NLLEtBQUosQ0FBVSxJQUFWO0FBQ0QsQ0FGb0IsQ0FGdkIsRSxDQU1BO0FBQ0E7QUFDQTs7O0FBQ0FsSyxzQkFBVStELE9BQVYsQ0FBa0IsT0FBbEIsRUFDR0MsV0FESCxDQUNlLDRCQURmLEVBRUdDLE1BRkgsQ0FFVSxZQUFZO0FBQ2xCckUsRUFBQUEsR0FBRyxDQUFDMEssU0FBSjtBQUNELENBSkg7O0FBTUF0SyxzQkFBVStELE9BQVYsQ0FBa0IsUUFBbEIsRUFDR0MsV0FESCxDQUNlLG1DQURmLEVBRUdDLE1BRkgsQ0FFVSxZQUFZO0FBQ2xCckUsRUFBQUEsR0FBRyxDQUFDMkssS0FBSjtBQUNELENBSkg7O0FBTUF2SyxzQkFBVStELE9BQVYsQ0FBa0IsV0FBbEIsRUFDRzhDLEtBREgsQ0FDUyxNQURULEVBRUc3QyxXQUZILENBRWUsMkNBRmYsRUFHR0MsTUFISCxDQUdVLFlBQVk7QUFDbEJyRSxFQUFBQSxHQUFHLENBQUMwSyxTQUFKO0FBQ0QsQ0FMSCxFLENBUUE7QUFDQTtBQUNBOzs7QUFFQXRLLHNCQUFVK0QsT0FBVixDQUFrQixhQUFsQixFQUNHQyxXQURILENBQ2UsWUFEZixFQUVHQyxNQUZILENBRVUsVUFBVXVHLEdBQVYsRUFBZTtBQUNyQjVLLEVBQUFBLEdBQUcsQ0FBQzZLLEtBQUosQ0FBVUQsR0FBVjtBQUNELENBSkg7QUFNQTs7Ozs7OztBQU9BO0FBQ0E7QUFDQTs7O0FBQ0F4SyxzQkFBVStELE9BQVYsQ0FBa0IsWUFBbEIsRUFDR0MsV0FESCxDQUNlLGlCQURmLEVBRUdDLE1BRkgsQ0FFVSxZQUFZO0FBQ2xCckUsRUFBQUEsR0FBRyxDQUFDOEssVUFBSjtBQUNELENBSkgsRSxDQU1BO0FBQ0E7QUFDQTs7O0FBQ0ExSyxzQkFBVStELE9BQVYsQ0FBa0IsMEJBQWxCLEVBQ0c1RCxNQURILENBQ1UsUUFEVixFQUNvQixpQkFEcEIsRUFFR0EsTUFGSCxDQUVVLFVBRlYsRUFFc0IscUJBRnRCLEVBR0dBLE1BSEgsQ0FHVSxPQUhWLEVBR21CLFlBSG5CLEVBSUdBLE1BSkgsQ0FJVSxPQUpWLEVBSW1CLHlCQUpuQixFQUtHQSxNQUxILENBS1UsT0FMVixFQUttQiw0QkFMbkIsRUFNR0EsTUFOSCxDQU1VLGFBTlYsRUFNeUIsNERBTnpCLEVBT0dBLE1BUEgsQ0FPVSxzQkFQVixFQU9rQyxxREFQbEMsRUFRR0EsTUFSSCxDQVFVLFlBUlYsRUFRd0IsNENBUnhCLEVBU0dBLE1BVEgsQ0FTVSxxQkFUVixFQVNpQyw0QkFUakMsRUFVRzZELFdBVkgsQ0FVZSwyQ0FWZixFQVdHQyxNQVhILENBV1UsVUFBVTBHLEVBQVYsRUFBY2hILEdBQWQsRUFBbUI7QUFDekIsTUFBSWlILElBQUksR0FBR3RELE9BQU8saUJBQWxCOztBQUVBLE1BQUksQ0FBQ3FELEVBQUwsRUFBU0EsRUFBRSxHQUFHLEtBQUw7QUFFVCxNQUFJdkIsSUFBSSxHQUFHLEVBQVg7QUFDQSxNQUFJeUIsR0FBRyxHQUFHLEtBQVY7QUFDQSxNQUFJQyxTQUFTLEdBQUcsRUFBaEI7QUFDQSxNQUFJQyxTQUFTLEdBQUcsS0FBaEI7QUFDQSxNQUFJQyxTQUFTLEdBQUcsS0FBaEI7O0FBRUEsTUFBSSxDQUFDakUsS0FBSyxDQUFDQyxRQUFRLENBQUNyRCxHQUFHLENBQUNzSCxLQUFMLENBQVQsQ0FBVixFQUFpQztBQUMvQjdCLElBQUFBLElBQUksR0FBR3BDLFFBQVEsQ0FBQ3JELEdBQUcsQ0FBQ3NILEtBQUwsQ0FBZjtBQUNEOztBQUVELE1BQUl0SCxHQUFHLENBQUN1SCxNQUFKLENBQVdySCxPQUFYLENBQW1CN0IsT0FBbkIsQ0FBMkIsT0FBM0IsTUFBd0MsQ0FBQyxDQUE3QyxFQUNFNkksR0FBRyxHQUFHLElBQU47QUFFRixNQUFJbEgsR0FBRyxDQUFDb0gsU0FBUixFQUNFQSxTQUFTLEdBQUcsT0FBT3BILEdBQUcsQ0FBQ29ILFNBQVgsS0FBeUIsUUFBekIsR0FBb0NwSCxHQUFHLENBQUNvSCxTQUF4QyxHQUFvRCxxQkFBaEU7QUFFRixNQUFJcEgsR0FBRyxDQUFDcUgsU0FBUixFQUNFQSxTQUFTLEdBQUcsT0FBT3JILEdBQUcsQ0FBQ3FILFNBQVgsS0FBeUIsUUFBekIsR0FBb0NySCxHQUFHLENBQUNxSCxTQUF4QyxHQUFvRCxLQUFoRTtBQUVGLE1BQUlySCxHQUFHLENBQUN3SCxHQUFKLEtBQVksSUFBaEIsRUFDRUwsU0FBUyxHQUFHLEtBQVo7QUFFRixNQUFJbkgsR0FBRyxDQUFDM0MsR0FBSixLQUFZLElBQWhCLEVBQ0U4SixTQUFTLEdBQUcsS0FBWjtBQUVGLE1BQUluSCxHQUFHLENBQUN5SCxRQUFKLEtBQWlCLElBQXJCLEVBQ0V4TCxHQUFHLENBQUN5TCxTQUFKLENBQWNWLEVBQWQsRUFBa0J2QixJQUFsQixFQUF3QnlCLEdBQXhCLEVBQTZCRSxTQUE3QixFQUF3Q0QsU0FBeEMsRUFERixLQUVLLElBQUluSCxHQUFHLENBQUMySCxJQUFKLEtBQWEsSUFBakIsRUFDSFYsSUFBSSxDQUFDVyxVQUFMLENBQWdCM0wsR0FBRyxDQUFDNEwsTUFBcEIsRUFBNEJiLEVBQTVCLEVBREcsS0FFQSxJQUFJaEgsR0FBRyxDQUFDOEgsTUFBSixLQUFlLElBQW5CLEVBQ0hiLElBQUksQ0FBQ2MsWUFBTCxDQUFrQjlMLEdBQUcsQ0FBQzRMLE1BQXRCLEVBQThCYixFQUE5QixFQUFrQyxLQUFsQyxFQUF5Qyx1QkFBekMsRUFBa0VHLFNBQWxFLEVBQTZFRSxTQUE3RSxFQURHLEtBR0hwTCxHQUFHLENBQUMrTCxVQUFKLENBQWVoQixFQUFmLEVBQW1CdkIsSUFBbkIsRUFBeUJ5QixHQUF6QixFQUE4QkUsU0FBOUIsRUFBeUNELFNBQXpDLEVBQW9ERSxTQUFwRDtBQUNILENBakRILEUsQ0FvREE7QUFDQTtBQUNBOzs7QUFDQWhMLHNCQUFVK0QsT0FBVixDQUFrQixNQUFsQixFQUNHQyxXQURILENBQ2UsYUFEZixFQUVHQyxNQUZILENBRVVsQixhQUFhLENBQUMsVUFBVUUsR0FBVixFQUFlO0FBQ25DckQsRUFBQUEsR0FBRyxDQUFDZ00sVUFBSixDQUFlLFlBQVk7QUFDekJ2TSxJQUFBQSxPQUFPLENBQUNrRSxJQUFSLENBQWFILHNCQUFJeUksWUFBakI7QUFDRCxHQUZEO0FBR0QsQ0FKb0IsQ0FGdkIsRSxDQVFBO0FBQ0E7QUFDQTs7O0FBRUE3TCxzQkFBVStELE9BQVYsQ0FBa0IseUJBQWxCLEVBQ0dDLFdBREgsQ0FDZSxvQ0FEZixFQUVHQyxNQUZILENBRVUsVUFBVTZILFFBQVYsRUFBb0JDLFNBQXBCLEVBQStCO0FBRXJDLE1BQUlBLFNBQVMsS0FBS3JELFNBQWxCLEVBQTZCO0FBQzNCOUksSUFBQUEsR0FBRyxDQUFDb00sYUFBSixDQUFrQjtBQUNoQkYsTUFBQUEsUUFBUSxFQUFFQSxRQURNO0FBRWhCQyxNQUFBQSxTQUFTLEVBQUVBO0FBRkssS0FBbEI7QUFJRCxHQUxELE1BT0VuTSxHQUFHLENBQUNxTSxjQUFKLENBQW1CSCxRQUFuQjtBQUNILENBWkgsRSxDQWNBO0FBQ0E7QUFDQTs7O0FBQ0E5TCxzQkFBVStELE9BQVYsQ0FBa0IsZ0JBQWxCLEVBQ0dDLFdBREgsQ0FDZSx1REFEZixFQUVHQyxNQUZILENBRVUsVUFBVTZILFFBQVYsRUFBb0I7QUFDMUJsTSxFQUFBQSxHQUFHLENBQUNzTSxPQUFKLENBQVlKLFFBQVo7QUFDRCxDQUpILEUsQ0FNQTtBQUNBO0FBQ0E7OztBQUNBOUwsc0JBQVUrRCxPQUFWLENBQWtCLGlCQUFsQixFQUNHQyxXQURILENBQ2UsOERBRGYsRUFFR0MsTUFGSCxDQUVVLFVBQVU2SCxRQUFWLEVBQW9CO0FBQzFCbE0sRUFBQUEsR0FBRyxDQUFDdU0sUUFBSixDQUFhTCxRQUFiO0FBQ0QsQ0FKSCxFLENBTUE7QUFDQTtBQUNBOzs7QUFDQTlMLHNCQUFVK0QsT0FBVixDQUFrQixZQUFsQixFQUNHQyxXQURILENBQ2UsK0JBRGYsRUFFR0MsTUFGSCxDQUVVLFlBQVk7QUFDbEJyRSxFQUFBQSxHQUFHLENBQUN3TSxVQUFKO0FBQ0QsQ0FKSCxFLENBTUE7QUFDQTtBQUNBOzs7QUFDQXBNLHNCQUFVK0QsT0FBVixDQUFrQixxQkFBbEIsRUFDRzhDLEtBREgsQ0FDUyxRQURULEVBRUcxRyxNQUZILENBRVUsZUFGVixFQUUyQiwyQkFGM0IsRUFHR0EsTUFISCxDQUdVLE9BSFYsRUFHbUIsa0RBSG5CLEVBSUdBLE1BSkgsQ0FJVSxrQ0FKVixFQUk4Qyx5QkFKOUMsRUFLR0EsTUFMSCxDQUtVLGtDQUxWLEVBSzhDLHlCQUw5QyxFQU1HQSxNQU5ILENBTVUsMEJBTlYsRUFNc0MsZ0VBTnRDLEVBT0c2RCxXQVBILENBT2Usc0NBUGYsRUFRR0MsTUFSSCxDQVFVLFVBQVVvSSxJQUFWLEVBQWdCQyxJQUFoQixFQUFzQjNJLEdBQXRCLEVBQTJCO0FBQ2pDL0QsRUFBQUEsR0FBRyxDQUFDMk0sS0FBSixDQUFVRixJQUFWLEVBQWdCQyxJQUFJLElBQUkzSSxHQUFHLENBQUMySSxJQUE1QixFQUFrQzNJLEdBQWxDLEVBQXVDM0QscUJBQXZDO0FBQ0QsQ0FWSDs7QUFZQUEsc0JBQVUrRCxPQUFWLENBQWtCLGFBQWxCLEVBQ0dFLE1BREgsQ0FDVSxZQUFZO0FBQ2xCckUsRUFBQUEsR0FBRyxDQUFDNE0sV0FBSjtBQUNELENBSEg7O0FBS0F4TSxzQkFBVStELE9BQVYsQ0FBa0IsVUFBbEIsRUFDR0MsV0FESCxDQUNlLDRCQURmLEVBRUdDLE1BRkgsQ0FFVSxZQUFNO0FBQ1p4RCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTBDLHNCQUFJQyxVQUFKLEdBQWlCekMsa0JBQU02TCxJQUFOLENBQVcsdUJBQVgsQ0FBN0I7QUFDQTlMLEVBQUFBLGVBQWU7QUFDZnRCLEVBQUFBLE9BQU8sQ0FBQ2tFLElBQVIsQ0FBYUgsc0JBQUl5SSxZQUFqQjtBQUNELENBTkgsRSxDQVFBO0FBQ0E7QUFDQTs7O0FBQ0E3TCxzQkFBVStELE9BQVYsQ0FBa0IsR0FBbEIsRUFDR0UsTUFESCxDQUNVLFlBQVk7QUFDbEJ4RCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTBDLHNCQUFJc0osY0FBSixHQUFxQjlMLGtCQUFNTyxJQUFOLENBQVcscUJBQVgsQ0FBakM7QUFDQVgsRUFBQUEsWUFBWSxHQUZNLENBR2xCOztBQUNBbkIsRUFBQUEsT0FBTyxDQUFDa0UsSUFBUixDQUFhSCxzQkFBSUksVUFBakI7QUFDRCxDQU5ILEUsQ0FRQTtBQUNBO0FBQ0E7OztBQUNBLElBQUluRSxPQUFPLENBQUNpQyxJQUFSLENBQWE2QixNQUFiLElBQXVCLENBQTNCLEVBQThCO0FBQzVCbkQsd0JBQVVxQixLQUFWLENBQWdCaEMsT0FBTyxDQUFDaUMsSUFBeEI7O0FBQ0FkLEVBQUFBLFlBQVksR0FGZ0IsQ0FHNUI7O0FBQ0FuQixFQUFBQSxPQUFPLENBQUNrRSxJQUFSLENBQWFILHNCQUFJSSxVQUFqQjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5wcm9jZXNzLmVudi5QTTJfVVNBR0UgPSAnQ0xJJztcblxuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi9jb25zdGFudHMnO1xuXG5pbXBvcnQgY29tbWFuZGVyIGZyb20gJ2NvbW1hbmRlcic7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IGZvckVhY2hMaW1pdCBmcm9tICdhc3luYy9mb3JFYWNoTGltaXQnO1xuXG5pbXBvcnQgZGVidWdMb2dnZXIgZnJvbSAnZGVidWcnO1xuaW1wb3J0IFBNMiBmcm9tICcuLi9BUEknO1xuaW1wb3J0IHBrZyBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nO1xuaW1wb3J0ICogYXMgdGFidGFiIGZyb20gJy4uL2NvbXBsZXRpb24nO1xuaW1wb3J0IENvbW1vbiBmcm9tICcuLi9Db21tb24nO1xuaW1wb3J0IFBNMmlvSGFuZGxlciBmcm9tICcuLi9BUEkvcG0yLXBsdXMvUE0ySU8nO1xuXG5jb25zdCBkZWJ1ZyA9IGRlYnVnTG9nZ2VyKCdwbTI6Y2xpJyk7XG5cbkNvbW1vbi5kZXRlcm1pbmVTaWxlbnRDTEkoKTtcbkNvbW1vbi5wcmludFZlcnNpb24oKTtcblxudmFyIHBtMjogYW55ID0gbmV3IFBNMigpO1xuXG5QTTJpb0hhbmRsZXIudXNlUE0yQ2xpZW50KHBtMilcblxuY29tbWFuZGVyLnZlcnNpb24ocGtnLnZlcnNpb24pXG4gIC5vcHRpb24oJy12IC0tdmVyc2lvbicsICdwcmludCBwbTIgdmVyc2lvbicpXG4gIC5vcHRpb24oJy1zIC0tc2lsZW50JywgJ2hpZGUgYWxsIG1lc3NhZ2VzJywgZmFsc2UpXG4gIC5vcHRpb24oJy0tZXh0IDxleHRlbnNpb25zPicsICd3YXRjaCBvbmx5IHRoaXMgZmlsZSBleHRlbnNpb25zJylcbiAgLm9wdGlvbignLW4gLS1uYW1lIDxuYW1lPicsICdzZXQgYSBuYW1lIGZvciB0aGUgcHJvY2VzcyBpbiB0aGUgcHJvY2VzcyBsaXN0JylcbiAgLm9wdGlvbignLW0gLS1taW5pLWxpc3QnLCAnZGlzcGxheSBhIGNvbXBhY3RlZCBsaXN0IHdpdGhvdXQgZm9ybWF0dGluZycpXG4gIC5vcHRpb24oJy0taW50ZXJwcmV0ZXIgPGludGVycHJldGVyPicsICdzZXQgYSBzcGVjaWZpYyBpbnRlcnByZXRlciB0byB1c2UgZm9yIGV4ZWN1dGluZyBhcHAsIGRlZmF1bHQ6IG5vZGUnKVxuICAub3B0aW9uKCctLWludGVycHJldGVyLWFyZ3MgPGFyZ3VtZW50cz4nLCAnc2V0IGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBpbnRlcnByZXRlciAoYWxpYXMgb2YgLS1ub2RlLWFyZ3MpJylcbiAgLm9wdGlvbignLS1ub2RlLWFyZ3MgPG5vZGVfYXJncz4nLCAnc3BhY2UgZGVsaW1pdGVkIGFyZ3VtZW50cyB0byBwYXNzIHRvIG5vZGUnKVxuICAub3B0aW9uKCctbyAtLW91dHB1dCA8cGF0aD4nLCAnc3BlY2lmeSBsb2cgZmlsZSBmb3Igc3Rkb3V0JylcbiAgLm9wdGlvbignLWUgLS1lcnJvciA8cGF0aD4nLCAnc3BlY2lmeSBsb2cgZmlsZSBmb3Igc3RkZXJyJylcbiAgLm9wdGlvbignLWwgLS1sb2cgW3BhdGhdJywgJ3NwZWNpZnkgbG9nIGZpbGUgd2hpY2ggZ2F0aGVycyBib3RoIHN0ZG91dCBhbmQgc3RkZXJyJylcbiAgLm9wdGlvbignLS1maWx0ZXItZW52IFtlbnZzXScsICdmaWx0ZXIgb3V0IG91dGdvaW5nIGdsb2JhbCB2YWx1ZXMgdGhhdCBjb250YWluIHByb3ZpZGVkIHN0cmluZ3MnLCBmdW5jdGlvbiAodiwgbSkgeyBtLnB1c2godik7IHJldHVybiBtOyB9LCBbXSlcbiAgLm9wdGlvbignLS1sb2ctdHlwZSA8dHlwZT4nLCAnc3BlY2lmeSBsb2cgb3V0cHV0IHN0eWxlIChyYXcgYnkgZGVmYXVsdCwganNvbiBvcHRpb25hbCknKVxuICAub3B0aW9uKCctLWxvZy1kYXRlLWZvcm1hdCA8ZGF0ZSBmb3JtYXQ+JywgJ2FkZCBjdXN0b20gcHJlZml4IHRpbWVzdGFtcCB0byBsb2dzJylcbiAgLm9wdGlvbignLS10aW1lJywgJ2VuYWJsZSB0aW1lIGxvZ2dpbmcnKVxuICAub3B0aW9uKCctLWRpc2FibGUtbG9ncycsICdkaXNhYmxlIGFsbCBsb2dzIHN0b3JhZ2UnKVxuICAub3B0aW9uKCctLWVudiA8ZW52aXJvbm1lbnRfbmFtZT4nLCAnc3BlY2lmeSB3aGljaCBzZXQgb2YgZW52aXJvbm1lbnQgdmFyaWFibGVzIGZyb20gZWNvc3lzdGVtIGZpbGUgbXVzdCBiZSBpbmplY3RlZCcpXG4gIC5vcHRpb24oJy1hIC0tdXBkYXRlLWVudicsICdmb3JjZSBhbiB1cGRhdGUgb2YgdGhlIGVudmlyb25tZW50IHdpdGggcmVzdGFydC9yZWxvYWQgKC1hIDw9PiBhcHBseSknKVxuICAub3B0aW9uKCctZiAtLWZvcmNlJywgJ2ZvcmNlIGFjdGlvbnMnKVxuICAub3B0aW9uKCctaSAtLWluc3RhbmNlcyA8bnVtYmVyPicsICdsYXVuY2ggW251bWJlcl0gaW5zdGFuY2VzIChmb3IgbmV0d29ya2VkIGFwcCkobG9hZCBiYWxhbmNlZCknKVxuICAub3B0aW9uKCctLXBhcmFsbGVsIDxudW1iZXI+JywgJ251bWJlciBvZiBwYXJhbGxlbCBhY3Rpb25zIChmb3IgcmVzdGFydC9yZWxvYWQpJylcbiAgLm9wdGlvbignLS1zaHV0ZG93bi13aXRoLW1lc3NhZ2UnLCAnc2h1dGRvd24gYW4gYXBwbGljYXRpb24gd2l0aCBwcm9jZXNzLnNlbmQoXFwnc2h1dGRvd25cXCcpIGluc3RlYWQgb2YgcHJvY2Vzcy5raWxsKHBpZCwgU0lHSU5UKScpXG4gIC5vcHRpb24oJy1wIC0tcGlkIDxwaWQ+JywgJ3NwZWNpZnkgcGlkIGZpbGUnKVxuICAub3B0aW9uKCctayAtLWtpbGwtdGltZW91dCA8ZGVsYXk+JywgJ2RlbGF5IGJlZm9yZSBzZW5kaW5nIGZpbmFsIFNJR0tJTEwgc2lnbmFsIHRvIHByb2Nlc3MnKVxuICAub3B0aW9uKCctLWxpc3Rlbi10aW1lb3V0IDxkZWxheT4nLCAnbGlzdGVuIHRpbWVvdXQgb24gYXBwbGljYXRpb24gcmVsb2FkJylcbiAgLm9wdGlvbignLS1tYXgtbWVtb3J5LXJlc3RhcnQgPG1lbW9yeT4nLCAnUmVzdGFydCB0aGUgYXBwIGlmIGFuIGFtb3VudCBvZiBtZW1vcnkgaXMgZXhjZWVkZWQgKGluIGJ5dGVzKScpXG4gIC5vcHRpb24oJy0tcmVzdGFydC1kZWxheSA8ZGVsYXk+JywgJ3NwZWNpZnkgYSBkZWxheSBiZXR3ZWVuIHJlc3RhcnRzIChpbiBtaWxsaXNlY29uZHMpJylcbiAgLm9wdGlvbignLS1leHAtYmFja29mZi1yZXN0YXJ0LWRlbGF5IDxkZWxheT4nLCAnc3BlY2lmeSBhIGRlbGF5IGJldHdlZW4gcmVzdGFydHMgKGluIG1pbGxpc2Vjb25kcyknKVxuICAub3B0aW9uKCcteCAtLWV4ZWN1dGUtY29tbWFuZCcsICdleGVjdXRlIGEgcHJvZ3JhbSB1c2luZyBmb3JrIHN5c3RlbScpXG4gIC5vcHRpb24oJy0tbWF4LXJlc3RhcnRzIFtjb3VudF0nLCAnb25seSByZXN0YXJ0IHRoZSBzY3JpcHQgQ09VTlQgdGltZXMnKVxuICAub3B0aW9uKCctdSAtLXVzZXIgPHVzZXJuYW1lPicsICdkZWZpbmUgdXNlciB3aGVuIGdlbmVyYXRpbmcgc3RhcnR1cCBzY3JpcHQnKVxuICAub3B0aW9uKCctLXVpZCA8dWlkPicsICdydW4gdGFyZ2V0IHNjcmlwdCB3aXRoIDx1aWQ+IHJpZ2h0cycpXG4gIC5vcHRpb24oJy0tZ2lkIDxnaWQ+JywgJ3J1biB0YXJnZXQgc2NyaXB0IHdpdGggPGdpZD4gcmlnaHRzJylcbiAgLm9wdGlvbignLS1uYW1lc3BhY2UgPG5zPicsICdzdGFydCBhcHBsaWNhdGlvbiB3aXRoaW4gc3BlY2lmaWVkIG5hbWVzcGFjZScpXG4gIC5vcHRpb24oJy0tY3dkIDxwYXRoPicsICdydW4gdGFyZ2V0IHNjcmlwdCBmcm9tIHBhdGggPGN3ZD4nKVxuICAub3B0aW9uKCctLWhwIDxob21lIHBhdGg+JywgJ2RlZmluZSBob21lIHBhdGggd2hlbiBnZW5lcmF0aW5nIHN0YXJ0dXAgc2NyaXB0JylcbiAgLm9wdGlvbignLS13YWl0LWlwJywgJ292ZXJyaWRlIHN5c3RlbWQgc2NyaXB0IHRvIHdhaXQgZm9yIGZ1bGwgaW50ZXJuZXQgY29ubmVjdGl2aXR5IHRvIGxhdW5jaCBwbTInKVxuICAub3B0aW9uKCctLXNlcnZpY2UtbmFtZSA8bmFtZT4nLCAnZGVmaW5lIHNlcnZpY2UgbmFtZSB3aGVuIGdlbmVyYXRpbmcgc3RhcnR1cCBzY3JpcHQnKVxuICAub3B0aW9uKCctYyAtLWNyb24gPGNyb25fcGF0dGVybj4nLCAncmVzdGFydCBhIHJ1bm5pbmcgcHJvY2VzcyBiYXNlZCBvbiBhIGNyb24gcGF0dGVybicpXG4gIC5vcHRpb24oJy13IC0td3JpdGUnLCAnd3JpdGUgY29uZmlndXJhdGlvbiBpbiBsb2NhbCBmb2xkZXInKVxuICAub3B0aW9uKCctLW5vLWRhZW1vbicsICdydW4gcG0yIGRhZW1vbiBpbiB0aGUgZm9yZWdyb3VuZCBpZiBpdCBkb2VzblxcJ3QgZXhpc3QgYWxyZWFkeScpXG4gIC5vcHRpb24oJy0tc291cmNlLW1hcC1zdXBwb3J0JywgJ2ZvcmNlIHNvdXJjZSBtYXAgc3VwcG9ydCcpXG4gIC5vcHRpb24oJy0tb25seSA8YXBwbGljYXRpb24tbmFtZT4nLCAnd2l0aCBqc29uIGRlY2xhcmF0aW9uLCBhbGxvdyB0byBvbmx5IGFjdCBvbiBvbmUgYXBwbGljYXRpb24nKVxuICAub3B0aW9uKCctLWRpc2FibGUtc291cmNlLW1hcC1zdXBwb3J0JywgJ2ZvcmNlIHNvdXJjZSBtYXAgc3VwcG9ydCcpXG4gIC5vcHRpb24oJy0td2FpdC1yZWFkeScsICdhc2sgcG0yIHRvIHdhaXQgZm9yIHJlYWR5IGV2ZW50IGZyb20geW91ciBhcHAnKVxuICAub3B0aW9uKCctLW1lcmdlLWxvZ3MnLCAnbWVyZ2UgbG9ncyBmcm9tIGRpZmZlcmVudCBpbnN0YW5jZXMgYnV0IGtlZXAgZXJyb3IgYW5kIG91dCBzZXBhcmF0ZWQnKVxuICAub3B0aW9uKCctLXdhdGNoIFtwYXRoc10nLCAnd2F0Y2ggYXBwbGljYXRpb24gZm9sZGVyIGZvciBjaGFuZ2VzJywgZnVuY3Rpb24gKHYsIG0pIHsgbS5wdXNoKHYpOyByZXR1cm4gbTsgfSwgW10pXG4gIC5vcHRpb24oJy0taWdub3JlLXdhdGNoIDxmb2xkZXJzfGZpbGVzPicsICdMaXN0IG9mIHBhdGhzIHRvIGlnbm9yZSAobmFtZSBvciByZWdleCknKVxuICAub3B0aW9uKCctLXdhdGNoLWRlbGF5IDxkZWxheT4nLCAnc3BlY2lmeSBhIHJlc3RhcnQgZGVsYXkgYWZ0ZXIgY2hhbmdpbmcgZmlsZXMgKC0td2F0Y2gtZGVsYXkgNCAoaW4gc2VjKSBvciA0MDAwbXMpJylcbiAgLm9wdGlvbignLS1uby1jb2xvcicsICdza2lwIGNvbG9ycycpXG4gIC5vcHRpb24oJy0tbm8tdml6aW9uJywgJ3N0YXJ0IGFuIGFwcCB3aXRob3V0IHZpemlvbiBmZWF0dXJlICh2ZXJzaW9uaW5nIGNvbnRyb2wpJylcbiAgLm9wdGlvbignLS1uby1hdXRvcmVzdGFydCcsICdzdGFydCBhbiBhcHAgd2l0aG91dCBhdXRvbWF0aWMgcmVzdGFydCcpXG4gIC5vcHRpb24oJy0tbm8tdHJlZWtpbGwnLCAnT25seSBraWxsIHRoZSBtYWluIHByb2Nlc3MsIG5vdCBkZXRhY2hlZCBjaGlsZHJlbicpXG4gIC5vcHRpb24oJy0tbm8tcG14JywgJ3N0YXJ0IGFuIGFwcCB3aXRob3V0IHBteCcpXG4gIC5vcHRpb24oJy0tbm8tYXV0b21hdGlvbicsICdzdGFydCBhbiBhcHAgd2l0aG91dCBwbXgnKVxuICAub3B0aW9uKCctLXRyYWNlJywgJ2VuYWJsZSB0cmFuc2FjdGlvbiB0cmFjaW5nIHdpdGgga20nKVxuICAub3B0aW9uKCctLWRpc2FibGUtdHJhY2UnLCAnZGlzYWJsZSB0cmFuc2FjdGlvbiB0cmFjaW5nIHdpdGgga20nKVxuICAub3B0aW9uKCctLWF0dGFjaCcsICdhdHRhY2ggbG9nZ2luZyBhZnRlciB5b3VyIHN0YXJ0L3Jlc3RhcnQvc3RvcC9yZWxvYWQnKVxuICAub3B0aW9uKCctLXY4JywgJ2VuYWJsZSB2OCBkYXRhIGNvbGxlY3RpbmcnKVxuICAub3B0aW9uKCctLWV2ZW50LWxvb3AtaW5zcGVjdG9yJywgJ2VuYWJsZSBldmVudC1sb29wLWluc3BlY3RvciBkdW1wIGluIHBteCcpXG4gIC5vcHRpb24oJy0tZGVlcC1tb25pdG9yaW5nJywgJ2VuYWJsZSBhbGwgbW9uaXRvcmluZyB0b29scyAoZXF1aXZhbGVudCB0byAtLXY4IC0tZXZlbnQtbG9vcC1pbnNwZWN0b3IgLS10cmFjZSknKVxuICAudXNhZ2UoJ1tjbWRdIGFwcCcpO1xuXG5mdW5jdGlvbiBkaXNwbGF5VXNhZ2UoKSB7XG4gIGNvbnNvbGUubG9nKCd1c2FnZTogcG0yIFtvcHRpb25zXSA8Y29tbWFuZD4nKVxuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCdwbTIgLWgsIC0taGVscCAgICAgICAgICAgICBhbGwgYXZhaWxhYmxlIGNvbW1hbmRzIGFuZCBvcHRpb25zJyk7XG4gIGNvbnNvbGUubG9nKCdwbTIgZXhhbXBsZXMgICAgICAgICAgICAgICBkaXNwbGF5IHBtMiB1c2FnZSBleGFtcGxlcycpO1xuICBjb25zb2xlLmxvZygncG0yIDxjb21tYW5kPiAtaCAgICAgICAgICAgaGVscCBvbiBhIHNwZWNpZmljIGNvbW1hbmQnKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBjb25zb2xlLmxvZygnQWNjZXNzIHBtMiBmaWxlcyBpbiB+Ly5wbTInKTtcbn1cblxuZnVuY3Rpb24gZGlzcGxheUV4YW1wbGVzKCkge1xuICBjb25zb2xlLmxvZygnLSBTdGFydCBhbmQgYWRkIGEgcHJvY2VzcyB0byB0aGUgcG0yIHByb2Nlc3MgbGlzdDonKVxuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJyAgJCBwbTIgc3RhcnQgYXBwLmpzIC0tbmFtZSBhcHAnKSk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJy0gU2hvdyB0aGUgcHJvY2VzcyBsaXN0OicpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJyAgJCBwbTIgbHMnKSk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJy0gU3RvcCBhbmQgZGVsZXRlIGEgcHJvY2VzcyBmcm9tIHRoZSBwbTIgcHJvY2VzcyBsaXN0OicpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJyAgJCBwbTIgZGVsZXRlIGFwcCcpKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBjb25zb2xlLmxvZygnLSBTdG9wLCBzdGFydCBhbmQgcmVzdGFydCBhIHByb2Nlc3MgZnJvbSB0aGUgcHJvY2VzcyBsaXN0OicpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJyAgJCBwbTIgc3RvcCBhcHAnKSk7XG4gIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJyAgJCBwbTIgc3RhcnQgYXBwJykpO1xuICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKCcgICQgcG0yIHJlc3RhcnQgYXBwJykpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCctIENsdXN0ZXJpemUgYW4gYXBwIHRvIGFsbCBDUFUgY29yZXMgYXZhaWxhYmxlOicpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJyAgJCBwbTIgc3RhcnQgLWkgbWF4JykpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCctIFVwZGF0ZSBwbTIgOicpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJyAgJCBucG0gaW5zdGFsbCBwbTIgLWcgJiYgcG0yIHVwZGF0ZScpKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBjb25zb2xlLmxvZygnLSBJbnN0YWxsIHBtMiBhdXRvIGNvbXBsZXRpb246JylcbiAgY29uc29sZS5sb2coJycpO1xuICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKCcgICQgcG0yIGNvbXBsZXRpb24gaW5zdGFsbCcpKVxuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCdDaGVjayB0aGUgZnVsbCBkb2N1bWVudGF0aW9uIG9uIGh0dHBzOi8vcG0yLmtleW1ldHJpY3MuaW8vJyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbn1cblxuZnVuY3Rpb24gYmVnaW5Db21tYW5kUHJvY2Vzc2luZygpIHtcbiAgcG0yLmdldFZlcnNpb24oZnVuY3Rpb24gKGVyciwgcmVtb3RlX3ZlcnNpb24pIHtcbiAgICBpZiAoIWVyciAmJiAocGtnLnZlcnNpb24gIT0gcmVtb3RlX3ZlcnNpb24pKSB7XG4gICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgICBjb25zb2xlLmxvZyhjaGFsay5yZWQuYm9sZCgnPj4+PiBJbi1tZW1vcnkgUE0yIGlzIG91dC1vZi1kYXRlLCBkbzpcXG4+Pj4+ICQgcG0yIHVwZGF0ZScpKTtcbiAgICAgIGNvbnNvbGUubG9nKCdJbiBtZW1vcnkgUE0yIHZlcnNpb246JywgY2hhbGsuYmx1ZS5ib2xkKHJlbW90ZV92ZXJzaW9uKSk7XG4gICAgICBjb25zb2xlLmxvZygnTG9jYWwgUE0yIHZlcnNpb246JywgY2hhbGsuYmx1ZS5ib2xkKHBrZy52ZXJzaW9uKSk7XG4gICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgfVxuICB9KTtcbiAgY29tbWFuZGVyLnBhcnNlKHByb2Nlc3MuYXJndik7XG59XG5cbmZ1bmN0aW9uIGNoZWNrQ29tcGxldGlvbigpIHtcbiAgcmV0dXJuIHRhYnRhYi5jb21wbGV0ZSgncG0yJywgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgIGlmIChlcnIgfHwgIWRhdGEpIHJldHVybjtcbiAgICBpZiAoL14tLVxcdz8vLnRlc3QoZGF0YS5sYXN0KSkgcmV0dXJuIHRhYnRhYi5sb2coY29tbWFuZGVyLm9wdGlvbnMubWFwKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICByZXR1cm4gZGF0YS5sb25nO1xuICAgIH0pLCBkYXRhKTtcbiAgICBpZiAoL14tXFx3Py8udGVzdChkYXRhLmxhc3QpKSByZXR1cm4gdGFidGFiLmxvZyhjb21tYW5kZXIub3B0aW9ucy5tYXAoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIHJldHVybiBkYXRhLnNob3J0O1xuICAgIH0pLCBkYXRhKTtcbiAgICAvLyBhcnJheSBjb250YWluaW5nIGNvbW1hbmRzIGFmdGVyIHdoaWNoIHByb2Nlc3MgbmFtZSBzaG91bGQgYmUgbGlzdGVkXG4gICAgdmFyIGNtZFByb2Nlc3MgPSBbJ3N0b3AnLCAncmVzdGFydCcsICdzY2FsZScsICdyZWxvYWQnLCAnZGVsZXRlJywgJ3Jlc2V0JywgJ3B1bGwnLCAnZm9yd2FyZCcsICdiYWNrd2FyZCcsICdsb2dzJywgJ2Rlc2NyaWJlJywgJ2Rlc2MnLCAnc2hvdyddO1xuXG4gICAgaWYgKGNtZFByb2Nlc3MuaW5kZXhPZihkYXRhLnByZXYpID4gLTEpIHtcbiAgICAgIHBtMi5saXN0KGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgICAgdGFidGFiLmxvZyhsaXN0Lm1hcChmdW5jdGlvbiAoZWwpIHsgcmV0dXJuIGVsLm5hbWUgfSksIGRhdGEpO1xuICAgICAgICBwbTIuZGlzY29ubmVjdCgpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGRhdGEucHJldiA9PSAncG0yJykge1xuICAgICAgdGFidGFiLmxvZyhjb21tYW5kZXIuY29tbWFuZHMubWFwKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHJldHVybiBkYXRhLl9uYW1lO1xuICAgICAgfSksIGRhdGEpO1xuICAgICAgcG0yLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG4gICAgZWxzZVxuICAgICAgcG0yLmRpc2Nvbm5lY3QoKTtcbiAgfSk7XG59O1xuXG52YXIgX2FyciA9IHByb2Nlc3MuYXJndi5pbmRleE9mKCctLScpID4gLTEgPyBwcm9jZXNzLmFyZ3Yuc2xpY2UoMCwgcHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0tJykpIDogcHJvY2Vzcy5hcmd2O1xuXG5pZiAoX2Fyci5pbmRleE9mKCdsb2cnKSA+IC0xKSB7XG4gIHByb2Nlc3MuYXJndltfYXJyLmluZGV4T2YoJ2xvZycpXSA9ICdsb2dzJztcbn1cblxuaWYgKF9hcnIuaW5kZXhPZignLS1uby1kYWVtb24nKSA+IC0xKSB7XG4gIC8vXG4gIC8vIFN0YXJ0IGRhZW1vbiBpZiBpdCBkb2VzIG5vdCBleGlzdFxuICAvL1xuICAvLyBGdW5jdGlvbiBjaGVja3MgaWYgLS1uby1kYWVtb24gb3B0aW9uIGlzIHByZXNlbnQsXG4gIC8vIGFuZCBzdGFydHMgZGFlbW9uIGluIHRoZSBzYW1lIHByb2Nlc3MgaWYgaXQgZG9lcyBub3QgZXhpc3RcbiAgLy9cbiAgY29uc29sZS5sb2coJ3BtMiBsYXVuY2hlZCBpbiBuby1kYWVtb24gbW9kZSAoeW91IGNhbiBhZGQgREVCVUc9XCIqXCIgZW52IHZhcmlhYmxlIHRvIGdldCBtb3JlIG1lc3NhZ2VzKScpO1xuXG4gIHZhciBwbTJOb0RhZWFtb24gPSBuZXcgUE0yKHtcbiAgICBkYWVtb25fbW9kZTogZmFsc2VcbiAgfSk7XG5cbiAgcG0yTm9EYWVhbW9uLmNvbm5lY3QoZnVuY3Rpb24gKCkge1xuICAgIHBtMiA9IHBtMk5vRGFlYW1vbjtcbiAgICBiZWdpbkNvbW1hbmRQcm9jZXNzaW5nKCk7XG4gIH0pO1xuXG59XG5lbHNlIGlmIChfYXJyLmluZGV4T2YoJ3N0YXJ0dXAnKSA+IC0xIHx8IF9hcnIuaW5kZXhPZigndW5zdGFydHVwJykgPiAtMSkge1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICBjb21tYW5kZXIucGFyc2UocHJvY2Vzcy5hcmd2KTtcbiAgfSwgMTAwKTtcbn1cbmVsc2Uge1xuICAvLyBIRVJFIHdlIGluc3RhbmNpYXRlIHRoZSBDbGllbnQgb2JqZWN0XG4gIHBtMi5jb25uZWN0KGZ1bmN0aW9uICgpIHtcbiAgICBkZWJ1ZygnTm93IGNvbm5lY3RlZCB0byBkYWVtb24nKTtcbiAgICBpZiAocHJvY2Vzcy5hcmd2LnNsaWNlKDIpWzBdID09PSAnY29tcGxldGlvbicpIHtcbiAgICAgIGNoZWNrQ29tcGxldGlvbigpO1xuICAgICAgLy9DbG9zZSBjbGllbnQgaWYgY29tcGxldGlvbiByZWxhdGVkIGluc3RhbGxhdGlvblxuICAgICAgdmFyIHRoaXJkID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDMpWzBdO1xuICAgICAgaWYgKHRoaXJkID09IG51bGwgfHwgdGhpcmQgPT09ICdpbnN0YWxsJyB8fCB0aGlyZCA9PT0gJ3VuaW5zdGFsbCcpXG4gICAgICAgIHBtMi5kaXNjb25uZWN0KCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgYmVnaW5Db21tYW5kUHJvY2Vzc2luZygpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gZmFpbCB3aGVuIHVua25vd24gY29tbWFuZCBhcmd1bWVudHMgYXJlIHBhc3NlZFxuLy9cbmZ1bmN0aW9uIGZhaWxPblVua25vd24oZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChhcmcpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnNvbGUubG9nKGNzdC5QUkVGSVhfTVNHICsgJ1xcblVua25vd24gY29tbWFuZCBhcmd1bWVudDogJyArIGFyZyk7XG4gICAgICBjb21tYW5kZXIub3V0cHV0SGVscCgpO1xuICAgICAgcHJvY2Vzcy5leGl0KGNzdC5FUlJPUl9FWElUKTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG59XG5cbi8qKlxuICogQHRvZG8gdG8gcmVtb3ZlIGF0IHNvbWUgcG9pbnQgb25jZSBpdCdzIGZpeGVkIGluIG9mZmljaWFsIGNvbW1hbmRlci5qc1xuICogaHR0cHM6Ly9naXRodWIuY29tL3RqL2NvbW1hbmRlci5qcy9pc3N1ZXMvNDc1XG4gKlxuICogUGF0Y2ggQ29tbWFuZGVyLmpzIFZhcmlhZGljIGZlYXR1cmVcbiAqL1xuZnVuY3Rpb24gcGF0Y2hDb21tYW5kZXJBcmcoY21kKSB7XG4gIHZhciBhcmdzSW5kZXg7XG4gIGlmICgoYXJnc0luZGV4ID0gY29tbWFuZGVyLnJhd0FyZ3MuaW5kZXhPZignLS0nKSkgPj0gMCkge1xuICAgIHZhciBvcHRhcmdzID0gY29tbWFuZGVyLnJhd0FyZ3Muc2xpY2UoYXJnc0luZGV4ICsgMSk7XG4gICAgY21kID0gY21kLnNsaWNlKDAsIGNtZC5pbmRleE9mKG9wdGFyZ3NbMF0pKTtcbiAgfVxuICByZXR1cm4gY21kO1xufVxuXG4vL1xuLy8gU3RhcnQgY29tbWFuZFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdzdGFydCBbbmFtZXxuYW1lc3BhY2V8ZmlsZXxlY29zeXN0ZW18aWQuLi5dJylcbiAgLm9wdGlvbignLS13YXRjaCcsICdXYXRjaCBmb2xkZXIgZm9yIGNoYW5nZXMnKVxuICAub3B0aW9uKCctLWZyZXNoJywgJ1JlYnVpbGQgRG9ja2VyZmlsZScpXG4gIC5vcHRpb24oJy0tZGFlbW9uJywgJ1J1biBjb250YWluZXIgaW4gRGFlbW9uIG1vZGUgKGRlYnVnIHB1cnBvc2VzKScpXG4gIC5vcHRpb24oJy0tY29udGFpbmVyJywgJ1N0YXJ0IGFwcGxpY2F0aW9uIGluIGNvbnRhaW5lciBtb2RlJylcbiAgLm9wdGlvbignLS1kaXN0JywgJ3dpdGggLS1jb250YWluZXI7IGNoYW5nZSBsb2NhbCBEb2NrZXJmaWxlIHRvIGNvbnRhaW5lcml6ZSBhbGwgZmlsZXMgaW4gY3VycmVudCBkaXJlY3RvcnknKVxuICAub3B0aW9uKCctLWltYWdlLW5hbWUgW25hbWVdJywgJ3dpdGggLS1kaXN0OyBzZXQgdGhlIGV4cG9ydGVkIGltYWdlIG5hbWUnKVxuICAub3B0aW9uKCctLW5vZGUtdmVyc2lvbiBbbWFqb3JdJywgJ3dpdGggLS1jb250YWluZXIsIHNldCBhIHNwZWNpZmljIG1ham9yIE5vZGUuanMgdmVyc2lvbicpXG4gIC5vcHRpb24oJy0tZG9ja2VyZGFlbW9uJywgJ2ZvciBkZWJ1Z2dpbmcgcHVycG9zZScpXG4gIC5kZXNjcmlwdGlvbignc3RhcnQgYW5kIGRhZW1vbml6ZSBhbiBhcHAnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChjbWQsIG9wdHMpIHtcbiAgICBpZiAob3B0cy5jb250YWluZXIgPT0gdHJ1ZSAmJiBvcHRzLmRpc3QgPT0gdHJ1ZSlcbiAgICAgIHJldHVybiBwbTIuZG9ja2VyTW9kZShjbWQsIG9wdHMsICdkaXN0cmlidXRpb24nKTtcbiAgICBlbHNlIGlmIChvcHRzLmNvbnRhaW5lciA9PSB0cnVlKVxuICAgICAgcmV0dXJuIHBtMi5kb2NrZXJNb2RlKGNtZCwgb3B0cywgJ2RldmVsb3BtZW50Jyk7XG5cbiAgICBpZiAoY21kID09IFwiLVwiKSB7XG4gICAgICBwcm9jZXNzLnN0ZGluLnJlc3VtZSgpO1xuICAgICAgcHJvY2Vzcy5zdGRpbi5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgICAgcHJvY2Vzcy5zdGRpbi5vbignZGF0YScsIGZ1bmN0aW9uIChjbWQpIHtcbiAgICAgICAgcHJvY2Vzcy5zdGRpbi5wYXVzZSgpO1xuICAgICAgICBwbTIuX3N0YXJ0SnNvbihjbWQsIGNvbW1hbmRlciwgJ3Jlc3RhcnRQcm9jZXNzSWQnLCAncGlwZScpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gQ29tbWFuZGVyLmpzIHBhdGNoXG4gICAgICBjbWQgPSBwYXRjaENvbW1hbmRlckFyZyhjbWQpO1xuICAgICAgaWYgKGNtZC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY21kID0gW2NzdC5BUFBfQ09ORl9ERUZBVUxUX0ZJTEVdO1xuICAgICAgfVxuICAgICAgbGV0IGFjYyA9IFtdXG4gICAgICBmb3JFYWNoTGltaXQoY21kLCAxLCBmdW5jdGlvbiAoc2NyaXB0LCBuZXh0KSB7XG4gICAgICAgIHBtMi5zdGFydChzY3JpcHQsIGNvbW1hbmRlciwgKGVyciwgYXBwcykgPT4ge1xuICAgICAgICAgIGFjYyA9IGFjYy5jb25jYXQoYXBwcylcbiAgICAgICAgICBuZXh0KGVycilcbiAgICAgICAgfSk7XG4gICAgICB9LCBmdW5jdGlvbiAoZXJyLCBkdCkge1xuICAgICAgICBpZiAoZXJyICYmIGVyci5tZXNzYWdlICYmXG4gICAgICAgICAgKGVyci5tZXNzYWdlLmluY2x1ZGVzKCdTY3JpcHQgbm90IGZvdW5kJykgPT09IHRydWUgfHxcbiAgICAgICAgICAgIGVyci5tZXNzYWdlLmluY2x1ZGVzKCdOT1QgQVZBSUxBQkxFIElOIFBBVEgnKSA9PT0gdHJ1ZSkpIHtcbiAgICAgICAgICBwbTIuZXhpdENsaSgxKVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwbTIuc3BlZWRMaXN0KGVyciA/IDEgOiAwLCBhY2MpO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3RyaWdnZXIgPGlkfHByb2NfbmFtZXxuYW1lc3BhY2V8YWxsPiA8YWN0aW9uX25hbWU+IFtwYXJhbXNdJylcbiAgLmRlc2NyaXB0aW9uKCd0cmlnZ2VyIHByb2Nlc3MgYWN0aW9uJylcbiAgLmFjdGlvbihmdW5jdGlvbiAocG1faWQsIGFjdGlvbl9uYW1lLCBwYXJhbXMpIHtcbiAgICBwbTIudHJpZ2dlcihwbV9pZCwgYWN0aW9uX25hbWUsIHBhcmFtcyk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZGVwbG95IDxmaWxlfGVudmlyb25tZW50PicpXG4gIC5kZXNjcmlwdGlvbignZGVwbG95IHlvdXIganNvbicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGNtZCkge1xuICAgIHBtMi5kZXBsb3koY21kLCBjb21tYW5kZXIpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3N0YXJ0T3JSZXN0YXJ0IDxqc29uPicpXG4gIC5kZXNjcmlwdGlvbignc3RhcnQgb3IgcmVzdGFydCBKU09OIGZpbGUnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgcG0yLl9zdGFydEpzb24oZmlsZSwgY29tbWFuZGVyLCAncmVzdGFydFByb2Nlc3NJZCcpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3N0YXJ0T3JSZWxvYWQgPGpzb24+JylcbiAgLmRlc2NyaXB0aW9uKCdzdGFydCBvciBncmFjZWZ1bGx5IHJlbG9hZCBKU09OIGZpbGUnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgcG0yLl9zdGFydEpzb24oZmlsZSwgY29tbWFuZGVyLCAncmVsb2FkUHJvY2Vzc0lkJyk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgncGlkIFthcHBfbmFtZV0nKVxuICAuZGVzY3JpcHRpb24oJ3JldHVybiBwaWQgb2YgW2FwcF9uYW1lXSBvciBhbGwnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChhcHApIHtcbiAgICBwbTIuZ2V0UElEKGFwcCk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnY3JlYXRlJylcbiAgLmRlc2NyaXB0aW9uKCdyZXR1cm4gcGlkIG9mIFthcHBfbmFtZV0gb3IgYWxsJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLmJvaWxlcnBsYXRlKClcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdzdGFydE9yR3JhY2VmdWxSZWxvYWQgPGpzb24+JylcbiAgLmRlc2NyaXB0aW9uKCdzdGFydCBvciBncmFjZWZ1bGx5IHJlbG9hZCBKU09OIGZpbGUnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgcG0yLl9zdGFydEpzb24oZmlsZSwgY29tbWFuZGVyLCAnc29mdFJlbG9hZFByb2Nlc3NJZCcpO1xuICB9KTtcblxuLy9cbi8vIFN0b3Agc3BlY2lmaWMgaWRcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnc3RvcCA8aWR8bmFtZXxuYW1lc3BhY2V8YWxsfGpzb258c3RkaW4uLi4+JylcbiAgLm9wdGlvbignLS13YXRjaCcsICdTdG9wIHdhdGNoaW5nIGZvbGRlciBmb3IgY2hhbmdlcycpXG4gIC5kZXNjcmlwdGlvbignc3RvcCBhIHByb2Nlc3MnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwYXJhbSkge1xuICAgIGZvckVhY2hMaW1pdChwYXJhbSwgMSwgZnVuY3Rpb24gKHNjcmlwdCwgbmV4dCkge1xuICAgICAgcG0yLnN0b3Aoc2NyaXB0LCBuZXh0KTtcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBwbTIuc3BlZWRMaXN0KGVyciA/IDEgOiAwKTtcbiAgICB9KTtcbiAgfSk7XG5cbi8vXG4vLyBTdG9wIEFsbCBwcm9jZXNzZXNcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgncmVzdGFydCA8aWR8bmFtZXxuYW1lc3BhY2V8YWxsfGpzb258c3RkaW4uLi4+JylcbiAgLm9wdGlvbignLS13YXRjaCcsICdUb2dnbGUgd2F0Y2hpbmcgZm9sZGVyIGZvciBjaGFuZ2VzJylcbiAgLmRlc2NyaXB0aW9uKCdyZXN0YXJ0IGEgcHJvY2VzcycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHBhcmFtKSB7XG4gICAgLy8gQ29tbWFuZGVyLmpzIHBhdGNoXG4gICAgcGFyYW0gPSBwYXRjaENvbW1hbmRlckFyZyhwYXJhbSk7XG4gICAgbGV0IGFjYyA9IFtdXG4gICAgZm9yRWFjaExpbWl0KHBhcmFtLCAxLCBmdW5jdGlvbiAoc2NyaXB0LCBuZXh0KSB7XG4gICAgICBwbTIucmVzdGFydChzY3JpcHQsIGNvbW1hbmRlciwgKGVyciwgYXBwcykgPT4ge1xuICAgICAgICBhY2MgPSBhY2MuY29uY2F0KGFwcHMpXG4gICAgICAgIG5leHQoZXJyKVxuICAgICAgfSk7XG4gICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgcG0yLnNwZWVkTGlzdChlcnIgPyAxIDogMCwgYWNjKTtcbiAgICB9KTtcbiAgfSk7XG5cbi8vXG4vLyBTY2FsZSB1cC9kb3duIGEgcHJvY2VzcyBpbiBjbHVzdGVyIG1vZGVcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnc2NhbGUgPGFwcF9uYW1lPiA8bnVtYmVyPicpXG4gIC5kZXNjcmlwdGlvbignc2NhbGUgdXAvZG93biBhIHByb2Nlc3MgaW4gY2x1c3RlciBtb2RlIGRlcGVuZGluZyBvbiB0b3RhbF9udW1iZXIgcGFyYW0nKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChhcHBfbmFtZSwgbnVtYmVyKSB7XG4gICAgcG0yLnNjYWxlKGFwcF9uYW1lLCBudW1iZXIpO1xuICB9KTtcblxuLy9cbi8vIHNuYXBzaG90IFBNMlxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdwcm9maWxlOm1lbSBbdGltZV0nKVxuICAuZGVzY3JpcHRpb24oJ1NhbXBsZSBQTTIgaGVhcCBtZW1vcnknKVxuICAuYWN0aW9uKGZ1bmN0aW9uICh0aW1lKSB7XG4gICAgcG0yLnByb2ZpbGUoJ21lbScsIHRpbWUpO1xuICB9KTtcblxuLy9cbi8vIHNuYXBzaG90IFBNMlxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdwcm9maWxlOmNwdSBbdGltZV0nKVxuICAuZGVzY3JpcHRpb24oJ1Byb2ZpbGUgUE0yIGNwdScpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHRpbWUpIHtcbiAgICBwbTIucHJvZmlsZSgnY3B1JywgdGltZSk7XG4gIH0pO1xuXG4vL1xuLy8gUmVsb2FkIHByb2Nlc3MoZXMpXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ3JlbG9hZCA8aWR8bmFtZXxuYW1lc3BhY2V8YWxsPicpXG4gIC5kZXNjcmlwdGlvbigncmVsb2FkIHByb2Nlc3NlcyAobm90ZSB0aGF0IGl0cyBmb3IgYXBwIHVzaW5nIEhUVFAvSFRUUFMpJylcbiAgLmFjdGlvbihmdW5jdGlvbiAocG0yX2lkKSB7XG4gICAgcG0yLnJlbG9hZChwbTJfaWQsIGNvbW1hbmRlcik7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnaWQgPG5hbWU+JylcbiAgLmRlc2NyaXB0aW9uKCdnZXQgcHJvY2VzcyBpZCBieSBuYW1lJylcbiAgLmFjdGlvbihmdW5jdGlvbiAobmFtZSkge1xuICAgIHBtMi5nZXRQcm9jZXNzSWRCeU5hbWUobmFtZSk7XG4gIH0pO1xuXG4vLyBJbnNwZWN0IGEgcHJvY2Vzc1xuY29tbWFuZGVyLmNvbW1hbmQoJ2luc3BlY3QgPG5hbWU+JylcbiAgLmRlc2NyaXB0aW9uKCdpbnNwZWN0IGEgcHJvY2VzcycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGNtZCkge1xuICAgIHBtMi5pbnNwZWN0KGNtZCwgY29tbWFuZGVyKTtcbiAgfSk7XG5cbi8vXG4vLyBTdG9wIGFuZCBkZWxldGUgYSBwcm9jZXNzIGJ5IG5hbWUgZnJvbSBkYXRhYmFzZVxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdkZWxldGUgPG5hbWV8aWR8bmFtZXNwYWNlfHNjcmlwdHxhbGx8anNvbnxzdGRpbi4uLj4nKVxuICAuYWxpYXMoJ2RlbCcpXG4gIC5kZXNjcmlwdGlvbignc3RvcCBhbmQgZGVsZXRlIGEgcHJvY2VzcyBmcm9tIHBtMiBwcm9jZXNzIGxpc3QnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgaWYgKG5hbWUgPT0gXCItXCIpIHtcbiAgICAgIHByb2Nlc3Muc3RkaW4ucmVzdW1lKCk7XG4gICAgICBwcm9jZXNzLnN0ZGluLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgICBwcm9jZXNzLnN0ZGluLm9uKCdkYXRhJywgZnVuY3Rpb24gKHBhcmFtKSB7XG4gICAgICAgIHByb2Nlc3Muc3RkaW4ucGF1c2UoKTtcbiAgICAgICAgcG0yLmRlbGV0ZShwYXJhbSwgJ3BpcGUnKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZVxuICAgICAgZm9yRWFjaExpbWl0KG5hbWUsIDEsIGZ1bmN0aW9uIChzY3JpcHQsIG5leHQpIHtcbiAgICAgICAgcG0yLmRlbGV0ZShzY3JpcHQsICcnLCBuZXh0KTtcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgcG0yLnNwZWVkTGlzdChlcnIgPyAxIDogMCk7XG4gICAgICB9KTtcbiAgfSk7XG5cbi8vXG4vLyBTZW5kIHN5c3RlbSBzaWduYWwgdG8gcHJvY2Vzc1xuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdzZW5kU2lnbmFsIDxzaWduYWw+IDxwbTJfaWR8bmFtZT4nKVxuICAuZGVzY3JpcHRpb24oJ3NlbmQgYSBzeXN0ZW0gc2lnbmFsIHRvIHRoZSB0YXJnZXQgcHJvY2VzcycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHNpZ25hbCwgcG0yX2lkKSB7XG4gICAgaWYgKGlzTmFOKHBhcnNlSW50KHBtMl9pZCkpKSB7XG4gICAgICBjb25zb2xlLmxvZyhjc3QuUFJFRklYX01TRyArICdTZW5kaW5nIHNpZ25hbCB0byBwcm9jZXNzIG5hbWUgJyArIHBtMl9pZCk7XG4gICAgICBwbTIuc2VuZFNpZ25hbFRvUHJvY2Vzc05hbWUoc2lnbmFsLCBwbTJfaWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZyhjc3QuUFJFRklYX01TRyArICdTZW5kaW5nIHNpZ25hbCB0byBwcm9jZXNzIGlkICcgKyBwbTJfaWQpO1xuICAgICAgcG0yLnNlbmRTaWduYWxUb1Byb2Nlc3NJZChzaWduYWwsIHBtMl9pZCk7XG4gICAgfVxuICB9KTtcblxuLy9cbi8vIFN0b3AgYW5kIGRlbGV0ZSBhIHByb2Nlc3MgYnkgbmFtZSBmcm9tIGRhdGFiYXNlXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ3BpbmcnKVxuICAuZGVzY3JpcHRpb24oJ3BpbmcgcG0yIGRhZW1vbiAtIGlmIG5vdCB1cCBpdCB3aWxsIGxhdW5jaCBpdCcpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHBtMi5waW5nKCk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgndXBkYXRlUE0yJylcbiAgLmRlc2NyaXB0aW9uKCd1cGRhdGUgaW4tbWVtb3J5IFBNMiB3aXRoIGxvY2FsIFBNMicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHBtMi51cGRhdGUoKTtcbiAgfSk7XG5jb21tYW5kZXIuY29tbWFuZCgndXBkYXRlJylcbiAgLmRlc2NyaXB0aW9uKCcoYWxpYXMpIHVwZGF0ZSBpbi1tZW1vcnkgUE0yIHdpdGggbG9jYWwgUE0yJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLnVwZGF0ZSgpO1xuICB9KTtcblxuLyoqXG4gKiBNb2R1bGUgc3BlY2lmaWNzXG4gKi9cbmNvbW1hbmRlci5jb21tYW5kKCdpbnN0YWxsIDxtb2R1bGV8Z2l0Oi8vIHVybD4nKVxuICAuYWxpYXMoJ21vZHVsZTppbnN0YWxsJylcbiAgLm9wdGlvbignLS10YXJiYWxsJywgJ2lzIGxvY2FsIHRhcmJhbGwnKVxuICAub3B0aW9uKCctLWluc3RhbGwnLCAncnVuIHlhcm4gaW5zdGFsbCBiZWZvcmUgc3RhcnRpbmcgbW9kdWxlJylcbiAgLm9wdGlvbignLS1kb2NrZXInLCAnaXMgZG9ja2VyIGNvbnRhaW5lcicpXG4gIC5vcHRpb24oJy0tdjEnLCAnaW5zdGFsbCBtb2R1bGUgaW4gdjEgbWFubmVyIChkbyBub3QgdXNlIGl0KScpXG4gIC5vcHRpb24oJy0tc2FmZSBbdGltZV0nLCAna2VlcCBtb2R1bGUgYmFja3VwLCBpZiBuZXcgbW9kdWxlIGZhaWwgPSByZXN0b3JlIHdpdGggcHJldmlvdXMnKVxuICAuZGVzY3JpcHRpb24oJ2luc3RhbGwgb3IgdXBkYXRlIGEgbW9kdWxlIGFuZCBydW4gaXQgZm9yZXZlcicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHBsdWdpbl9uYW1lLCBvcHRzKSB7XG4gICAgcmVxdWlyZSgndXRpbCcpLl9leHRlbmQoY29tbWFuZGVyLCBvcHRzKTtcbiAgICBwbTIuaW5zdGFsbChwbHVnaW5fbmFtZSwgY29tbWFuZGVyKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdtb2R1bGU6dXBkYXRlIDxtb2R1bGV8Z2l0Oi8vIHVybD4nKVxuICAuZGVzY3JpcHRpb24oJ3VwZGF0ZSBhIG1vZHVsZSBhbmQgcnVuIGl0IGZvcmV2ZXInKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwbHVnaW5fbmFtZSkge1xuICAgIHBtMi5pbnN0YWxsKHBsdWdpbl9uYW1lKTtcbiAgfSk7XG5cblxuY29tbWFuZGVyLmNvbW1hbmQoJ21vZHVsZTpnZW5lcmF0ZSBbYXBwX25hbWVdJylcbiAgLmRlc2NyaXB0aW9uKCdHZW5lcmF0ZSBhIHNhbXBsZSBtb2R1bGUgaW4gY3VycmVudCBmb2xkZXInKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChhcHBfbmFtZSkge1xuICAgIHBtMi5nZW5lcmF0ZU1vZHVsZVNhbXBsZShhcHBfbmFtZSk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgndW5pbnN0YWxsIDxtb2R1bGU+JylcbiAgLmFsaWFzKCdtb2R1bGU6dW5pbnN0YWxsJylcbiAgLmRlc2NyaXB0aW9uKCdzdG9wIGFuZCB1bmluc3RhbGwgYSBtb2R1bGUnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwbHVnaW5fbmFtZSkge1xuICAgIHBtMi51bmluc3RhbGwocGx1Z2luX25hbWUpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3BhY2thZ2UgW3RhcmdldF0nKVxuICAuZGVzY3JpcHRpb24oJ0NoZWNrICYgUGFja2FnZSBUQVIgdHlwZSBtb2R1bGUnKVxuICAuYWN0aW9uKGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICBwbTIucGFja2FnZSh0YXJnZXQpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3B1Ymxpc2ggW2ZvbGRlcl0nKVxuICAub3B0aW9uKCctLW5wbScsICdwdWJsaXNoIG9uIG5wbScpXG4gIC5hbGlhcygnbW9kdWxlOnB1Ymxpc2gnKVxuICAuZGVzY3JpcHRpb24oJ1B1Ymxpc2ggdGhlIG1vZHVsZSB5b3UgYXJlIGN1cnJlbnRseSBvbicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGZvbGRlciwgb3B0cykge1xuICAgIHBtMi5wdWJsaXNoKGZvbGRlciwgb3B0cyk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnc2V0IFtrZXldIFt2YWx1ZV0nKVxuICAuZGVzY3JpcHRpb24oJ3NldHMgdGhlIHNwZWNpZmllZCBjb25maWcgPGtleT4gPHZhbHVlPicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICBwbTIuc2V0KGtleSwgdmFsdWUpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ211bHRpc2V0IDx2YWx1ZT4nKVxuICAuZGVzY3JpcHRpb24oJ211bHRpc2V0IGVnIFwia2V5MSB2YWwxIGtleTIgdmFsMicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHN0cikge1xuICAgIHBtMi5tdWx0aXNldChzdHIpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2dldCBba2V5XScpXG4gIC5kZXNjcmlwdGlvbignZ2V0IHZhbHVlIGZvciA8a2V5PicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGtleSkge1xuICAgIHBtMi5nZXQoa2V5KTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdjb25mIFtrZXldIFt2YWx1ZV0nKVxuICAuZGVzY3JpcHRpb24oJ2dldCAvIHNldCBtb2R1bGUgY29uZmlnIHZhbHVlcycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICBwbTIuZ2V0KClcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdjb25maWcgPGtleT4gW3ZhbHVlXScpXG4gIC5kZXNjcmlwdGlvbignZ2V0IC8gc2V0IG1vZHVsZSBjb25maWcgdmFsdWVzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHBtMi5jb25mKGtleSwgdmFsdWUpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3Vuc2V0IDxrZXk+JylcbiAgLmRlc2NyaXB0aW9uKCdjbGVhcnMgdGhlIHNwZWNpZmllZCBjb25maWcgPGtleT4nKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBwbTIudW5zZXQoa2V5KTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdyZXBvcnQnKVxuICAuZGVzY3JpcHRpb24oJ2dpdmUgYSBmdWxsIHBtMiByZXBvcnQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9Vbml0ZWNoL3BtMi9pc3N1ZXMnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBwbTIucmVwb3J0KCk7XG4gIH0pO1xuXG4vL1xuLy8gUE0yIEkvT1xuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdsaW5rIFtzZWNyZXRdIFtwdWJsaWNdIFtuYW1lXScpXG4gIC5vcHRpb24oJy0taW5mby1ub2RlIFt1cmxdJywgJ3NldCB1cmwgaW5mbyBub2RlJylcbiAgLm9wdGlvbignLS13cycsICd3ZWJzb2NrZXQgbW9kZScpXG4gIC5vcHRpb24oJy0tYXhvbicsICdheG9uIG1vZGUnKVxuICAuZGVzY3JpcHRpb24oJ2xpbmsgd2l0aCB0aGUgcG0yIG1vbml0b3JpbmcgZGFzaGJvYXJkJylcbiAgLmFjdGlvbihwbTIubGlua01hbmFnZW1lbnQuYmluZChwbTIpKTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3VubGluaycpXG4gIC5kZXNjcmlwdGlvbigndW5saW5rIHdpdGggdGhlIHBtMiBtb25pdG9yaW5nIGRhc2hib2FyZCcpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHBtMi51bmxpbmsoKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdtb25pdG9yIFtuYW1lXScpXG4gIC5kZXNjcmlwdGlvbignbW9uaXRvciB0YXJnZXQgcHJvY2VzcycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZiAobmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gcGx1c0hhbmRsZXIoKVxuICAgIH1cbiAgICBwbTIubW9uaXRvclN0YXRlKCdtb25pdG9yJywgbmFtZSk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgndW5tb25pdG9yIFtuYW1lXScpXG4gIC5kZXNjcmlwdGlvbigndW5tb25pdG9yIHRhcmdldCBwcm9jZXNzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAobmFtZSkge1xuICAgIHBtMi5tb25pdG9yU3RhdGUoJ3VubW9uaXRvcicsIG5hbWUpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ29wZW4nKVxuICAuZGVzY3JpcHRpb24oJ29wZW4gdGhlIHBtMiBtb25pdG9yaW5nIGRhc2hib2FyZCcpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBwbTIub3BlbkRhc2hib2FyZCgpO1xuICB9KTtcblxuZnVuY3Rpb24gcGx1c0hhbmRsZXIoY29tbWFuZD8sIG9wdHM/KSB7XG4gIGlmIChvcHRzICYmIG9wdHMuaW5mb05vZGUpIHtcbiAgICBwcm9jZXNzLmVudi5LRVlNRVRSSUNTX05PREUgPSBvcHRzLmluZm9Ob2RlXG4gIH1cblxuICByZXR1cm4gUE0yaW9IYW5kbGVyLmxhdW5jaChjb21tYW5kLCBvcHRzKVxufVxuXG5jb21tYW5kZXIuY29tbWFuZCgncGx1cyBbY29tbWFuZF0gW29wdGlvbl0nKVxuICAuYWxpYXMoJ3JlZ2lzdGVyJylcbiAgLm9wdGlvbignLS1pbmZvLW5vZGUgW3VybF0nLCAnc2V0IHVybCBpbmZvIG5vZGUgZm9yIG9uLXByZW1pc2UgcG0yIHBsdXMnKVxuICAub3B0aW9uKCctZCAtLWRpc2NyZXRlJywgJ3NpbGVudCBtb2RlJylcbiAgLm9wdGlvbignLWEgLS1pbnN0YWxsLWFsbCcsICdpbnN0YWxsIGFsbCBtb2R1bGVzIChmb3JjZSB5ZXMpJylcbiAgLmRlc2NyaXB0aW9uKCdlbmFibGUgcG0yIHBsdXMnKVxuICAuYWN0aW9uKHBsdXNIYW5kbGVyKTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2xvZ2luJylcbiAgLmRlc2NyaXB0aW9uKCdMb2dpbiB0byBwbTIgcGx1cycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBwbHVzSGFuZGxlcignbG9naW4nKVxuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2xvZ291dCcpXG4gIC5kZXNjcmlwdGlvbignTG9nb3V0IGZyb20gcG0yIHBsdXMnKVxuICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gcGx1c0hhbmRsZXIoJ2xvZ291dCcpXG4gIH0pO1xuXG4vL1xuLy8gU2F2ZSBwcm9jZXNzZXMgdG8gZmlsZVxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdkdW1wJylcbiAgLmFsaWFzKCdzYXZlJylcbiAgLm9wdGlvbignLS1mb3JjZScsICdmb3JjZSBkZWxldGlvbiBvZiBkdW1wIGZpbGUsIGV2ZW4gaWYgZW1wdHknKVxuICAuZGVzY3JpcHRpb24oJ2R1bXAgYWxsIHByb2Nlc3NlcyBmb3IgcmVzdXJyZWN0aW5nIHRoZW0gbGF0ZXInKVxuICAuYWN0aW9uKGZhaWxPblVua25vd24oZnVuY3Rpb24gKG9wdHMpIHtcbiAgICBwbTIuZHVtcChjb21tYW5kZXIuZm9yY2UpXG4gIH0pKTtcblxuLy9cbi8vIERlbGV0ZSBkdW1wIGZpbGVcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnY2xlYXJkdW1wJylcbiAgLmRlc2NyaXB0aW9uKCdDcmVhdGUgZW1wdHkgZHVtcCBmaWxlJylcbiAgLmFjdGlvbihmYWlsT25Vbmtub3duKGZ1bmN0aW9uICgpIHtcbiAgICBwbTIuY2xlYXJEdW1wKCk7XG4gIH0pKTtcblxuLy9cbi8vIFNhdmUgcHJvY2Vzc2VzIHRvIGZpbGVcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnc2VuZCA8cG1faWQ+IDxsaW5lPicpXG4gIC5kZXNjcmlwdGlvbignc2VuZCBzdGRpbiB0byA8cG1faWQ+JylcbiAgLmFjdGlvbihmdW5jdGlvbiAocG1faWQsIGxpbmUpIHtcbiAgICBwbTIuc2VuZExpbmVUb1N0ZGluKHBtX2lkLCBsaW5lKTtcbiAgfSk7XG5cbi8vXG4vLyBBdHRhY2ggdG8gc3RkaW4vc3Rkb3V0XG4vLyBOb3QgVFRZIHJlYWR5XG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2F0dGFjaCA8cG1faWQ+IFtjb21tYW5kIHNlcGFyYXRvcl0nKVxuICAuZGVzY3JpcHRpb24oJ2F0dGFjaCBzdGRpbi9zdGRvdXQgdG8gYXBwbGljYXRpb24gaWRlbnRpZmllZCBieSA8cG1faWQ+JylcbiAgLmFjdGlvbihmdW5jdGlvbiAocG1faWQsIHNlcGFyYXRvcikge1xuICAgIHBtMi5hdHRhY2gocG1faWQsIHNlcGFyYXRvcik7XG4gIH0pO1xuXG4vL1xuLy8gUmVzdXJyZWN0XG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ3Jlc3VycmVjdCcpXG4gIC5kZXNjcmlwdGlvbigncmVzdXJyZWN0IHByZXZpb3VzbHkgZHVtcGVkIHByb2Nlc3NlcycpXG4gIC5hY3Rpb24oZmFpbE9uVW5rbm93bihmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coY3N0LlBSRUZJWF9NU0cgKyAnUmVzdXJyZWN0aW5nJyk7XG4gICAgcG0yLnJlc3VycmVjdCgpO1xuICB9KSk7XG5cbi8vXG4vLyBTZXQgcG0yIHRvIHN0YXJ0dXBcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgndW5zdGFydHVwIFtwbGF0Zm9ybV0nKVxuICAuZGVzY3JpcHRpb24oJ2Rpc2FibGUgdGhlIHBtMiBzdGFydHVwIGhvb2snKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwbGF0Zm9ybSkge1xuICAgIHBtMi51bmluc3RhbGxTdGFydHVwKHBsYXRmb3JtLCBjb21tYW5kZXIpO1xuICB9KTtcblxuLy9cbi8vIFNldCBwbTIgdG8gc3RhcnR1cFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdzdGFydHVwIFtwbGF0Zm9ybV0nKVxuICAuZGVzY3JpcHRpb24oJ2VuYWJsZSB0aGUgcG0yIHN0YXJ0dXAgaG9vaycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHBsYXRmb3JtKSB7XG4gICAgcG0yLnN0YXJ0dXAocGxhdGZvcm0sIGNvbW1hbmRlcik7XG4gIH0pO1xuXG4vL1xuLy8gTG9ncm90YXRlXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2xvZ3JvdGF0ZScpXG4gIC5kZXNjcmlwdGlvbignY29weSBkZWZhdWx0IGxvZ3JvdGF0ZSBjb25maWd1cmF0aW9uJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoY21kKSB7XG4gICAgcG0yLmxvZ3JvdGF0ZShjb21tYW5kZXIpO1xuICB9KTtcblxuLy9cbi8vIFNhbXBsZSBnZW5lcmF0ZVxuLy9cblxuY29tbWFuZGVyLmNvbW1hbmQoJ2Vjb3N5c3RlbSBbbW9kZV0nKVxuICAuYWxpYXMoJ2luaXQnKVxuICAuZGVzY3JpcHRpb24oJ2dlbmVyYXRlIGEgcHJvY2VzcyBjb25mIGZpbGUuIChtb2RlID0gbnVsbCBvciBzaW1wbGUpJylcbiAgLmFjdGlvbihmdW5jdGlvbiAobW9kZSkge1xuICAgIHBtMi5nZW5lcmF0ZVNhbXBsZShtb2RlKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdyZXNldCA8bmFtZXxpZHxhbGw+JylcbiAgLmRlc2NyaXB0aW9uKCdyZXNldCBjb3VudGVycyBmb3IgcHJvY2VzcycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHByb2NfaWQpIHtcbiAgICBwbTIucmVzZXQocHJvY19pZCk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZGVzY3JpYmUgPG5hbWV8aWQ+JylcbiAgLmRlc2NyaXB0aW9uKCdkZXNjcmliZSBhbGwgcGFyYW1ldGVycyBvZiBhIHByb2Nlc3MnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwcm9jX2lkKSB7XG4gICAgcG0yLmRlc2NyaWJlKHByb2NfaWQpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2Rlc2MgPG5hbWV8aWQ+JylcbiAgLmRlc2NyaXB0aW9uKCcoYWxpYXMpIGRlc2NyaWJlIGFsbCBwYXJhbWV0ZXJzIG9mIGEgcHJvY2VzcycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHByb2NfaWQpIHtcbiAgICBwbTIuZGVzY3JpYmUocHJvY19pZCk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnaW5mbyA8bmFtZXxpZD4nKVxuICAuZGVzY3JpcHRpb24oJyhhbGlhcykgZGVzY3JpYmUgYWxsIHBhcmFtZXRlcnMgb2YgYSBwcm9jZXNzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAocHJvY19pZCkge1xuICAgIHBtMi5kZXNjcmliZShwcm9jX2lkKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdzaG93IDxuYW1lfGlkPicpXG4gIC5kZXNjcmlwdGlvbignKGFsaWFzKSBkZXNjcmliZSBhbGwgcGFyYW1ldGVycyBvZiBhIHByb2Nlc3MnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwcm9jX2lkKSB7XG4gICAgcG0yLmRlc2NyaWJlKHByb2NfaWQpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2VudiA8aWQ+JylcbiAgLmRlc2NyaXB0aW9uKCdsaXN0IGFsbCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgb2YgYSBwcm9jZXNzIGlkJylcbiAgLmFjdGlvbihmdW5jdGlvbiAocHJvY19pZCkge1xuICAgIHBtMi5lbnYocHJvY19pZCk7XG4gIH0pO1xuXG4vL1xuLy8gTGlzdCBjb21tYW5kXG4vL1xuY29tbWFuZGVyXG4gIC5jb21tYW5kKCdsaXN0JylcbiAgLmFsaWFzKCdscycpXG4gIC5kZXNjcmlwdGlvbignbGlzdCBhbGwgcHJvY2Vzc2VzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLmxpc3QoY29tbWFuZGVyKVxuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2wnKVxuICAuZGVzY3JpcHRpb24oJyhhbGlhcykgbGlzdCBhbGwgcHJvY2Vzc2VzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLmxpc3QoKVxuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3BzJylcbiAgLmRlc2NyaXB0aW9uKCcoYWxpYXMpIGxpc3QgYWxsIHByb2Nlc3NlcycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHBtMi5saXN0KClcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdzdGF0dXMnKVxuICAuZGVzY3JpcHRpb24oJyhhbGlhcykgbGlzdCBhbGwgcHJvY2Vzc2VzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLmxpc3QoKVxuICB9KTtcblxuXG4vLyBMaXN0IGluIHJhdyBqc29uXG5jb21tYW5kZXIuY29tbWFuZCgnamxpc3QnKVxuICAuZGVzY3JpcHRpb24oJ2xpc3QgYWxsIHByb2Nlc3NlcyBpbiBKU09OIGZvcm1hdCcpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHBtMi5qbGlzdCgpXG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnc3lzbW9uaXQnKVxuICAuZGVzY3JpcHRpb24oJ3N0YXJ0IHN5c3RlbSBtb25pdG9yaW5nIGRhZW1vbicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHBtMi5sYXVuY2hTeXNNb25pdG9yaW5nKClcbiAgfSlcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3NsaXN0JylcbiAgLmFsaWFzKCdzeXNpbmZvcycpXG4gIC5vcHRpb24oJy10IC0tdHJlZScsICdzaG93IGFzIHRyZWUnKVxuICAuZGVzY3JpcHRpb24oJ2xpc3Qgc3lzdGVtIGluZm9zIGluIEpTT04nKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgcG0yLnNsaXN0KG9wdHMudHJlZSlcbiAgfSlcblxuLy8gTGlzdCBpbiBwcmV0dGlmaWVkIEpzb25cbmNvbW1hbmRlci5jb21tYW5kKCdwcmV0dHlsaXN0JylcbiAgLmRlc2NyaXB0aW9uKCdwcmludCBqc29uIGluIGEgcHJldHRpZmllZCBKU09OJylcbiAgLmFjdGlvbihmYWlsT25Vbmtub3duKGZ1bmN0aW9uICgpIHtcbiAgICBwbTIuamxpc3QodHJ1ZSk7XG4gIH0pKTtcblxuLy9cbi8vIERhc2hib2FyZCBjb21tYW5kXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ21vbml0JylcbiAgLmRlc2NyaXB0aW9uKCdsYXVuY2ggdGVybWNhcHMgbW9uaXRvcmluZycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHBtMi5kYXNoYm9hcmQoKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdpbW9uaXQnKVxuICAuZGVzY3JpcHRpb24oJ2xhdW5jaCBsZWdhY3kgdGVybWNhcHMgbW9uaXRvcmluZycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHBtMi5tb25pdCgpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2Rhc2hib2FyZCcpXG4gIC5hbGlhcygnZGFzaCcpXG4gIC5kZXNjcmlwdGlvbignbGF1bmNoIGRhc2hib2FyZCB3aXRoIG1vbml0b3JpbmcgYW5kIGxvZ3MnKVxuICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICBwbTIuZGFzaGJvYXJkKCk7XG4gIH0pO1xuXG5cbi8vXG4vLyBGbHVzaGluZyBjb21tYW5kXG4vL1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZmx1c2ggW2FwaV0nKVxuICAuZGVzY3JpcHRpb24oJ2ZsdXNoIGxvZ3MnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChhcGkpIHtcbiAgICBwbTIuZmx1c2goYXBpKTtcbiAgfSk7XG5cbi8qIG9sZCB2ZXJzaW9uXG5jb21tYW5kZXIuY29tbWFuZCgnZmx1c2gnKVxuICAuZGVzY3JpcHRpb24oJ2ZsdXNoIGxvZ3MnKVxuICAuYWN0aW9uKGZhaWxPblVua25vd24oZnVuY3Rpb24oKSB7XG4gICAgcG0yLmZsdXNoKCk7XG4gIH0pKTtcbiovXG4vL1xuLy8gUmVsb2FkIGFsbCBsb2dzXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ3JlbG9hZExvZ3MnKVxuICAuZGVzY3JpcHRpb24oJ3JlbG9hZCBhbGwgbG9ncycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHBtMi5yZWxvYWRMb2dzKCk7XG4gIH0pO1xuXG4vL1xuLy8gTG9nIHN0cmVhbWluZ1xuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdsb2dzIFtpZHxuYW1lfG5hbWVzcGFjZV0nKVxuICAub3B0aW9uKCctLWpzb24nLCAnanNvbiBsb2cgb3V0cHV0JylcbiAgLm9wdGlvbignLS1mb3JtYXQnLCAnZm9ybWF0ZWQgbG9nIG91dHB1dCcpXG4gIC5vcHRpb24oJy0tcmF3JywgJ3JhdyBvdXRwdXQnKVxuICAub3B0aW9uKCctLWVycicsICdvbmx5IHNob3dzIGVycm9yIG91dHB1dCcpXG4gIC5vcHRpb24oJy0tb3V0JywgJ29ubHkgc2hvd3Mgc3RhbmRhcmQgb3V0cHV0JylcbiAgLm9wdGlvbignLS1saW5lcyA8bj4nLCAnb3V0cHV0IHRoZSBsYXN0IE4gbGluZXMsIGluc3RlYWQgb2YgdGhlIGxhc3QgMTUgYnkgZGVmYXVsdCcpXG4gIC5vcHRpb24oJy0tdGltZXN0YW1wIFtmb3JtYXRdJywgJ2FkZCB0aW1lc3RhbXBzIChkZWZhdWx0IGZvcm1hdCBZWVlZLU1NLURELUhIOm1tOnNzKScpXG4gIC5vcHRpb24oJy0tbm9zdHJlYW0nLCAncHJpbnQgbG9ncyB3aXRob3V0IGxhdWNoaW5nIHRoZSBsb2cgc3RyZWFtJylcbiAgLm9wdGlvbignLS1oaWdobGlnaHQgW3ZhbHVlXScsICdoaWdobGlnaHRzIHRoZSBnaXZlbiB2YWx1ZScpXG4gIC5kZXNjcmlwdGlvbignc3RyZWFtIGxvZ3MgZmlsZS4gRGVmYXVsdCBzdHJlYW0gYWxsIGxvZ3MnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChpZCwgY21kKSB7XG4gICAgdmFyIExvZ3MgPSByZXF1aXJlKCcuLi9BUEkvTG9nLmpzJyk7XG5cbiAgICBpZiAoIWlkKSBpZCA9ICdhbGwnO1xuXG4gICAgdmFyIGxpbmUgPSAxNTtcbiAgICB2YXIgcmF3ID0gZmFsc2U7XG4gICAgdmFyIGV4Y2x1c2l2ZSA9IFwiXCI7XG4gICAgdmFyIHRpbWVzdGFtcCA9IGZhbHNlO1xuICAgIHZhciBoaWdobGlnaHQgPSBmYWxzZTtcblxuICAgIGlmICghaXNOYU4ocGFyc2VJbnQoY21kLmxpbmVzKSkpIHtcbiAgICAgIGxpbmUgPSBwYXJzZUludChjbWQubGluZXMpO1xuICAgIH1cblxuICAgIGlmIChjbWQucGFyZW50LnJhd0FyZ3MuaW5kZXhPZignLS1yYXcnKSAhPT0gLTEpXG4gICAgICByYXcgPSB0cnVlO1xuXG4gICAgaWYgKGNtZC50aW1lc3RhbXApXG4gICAgICB0aW1lc3RhbXAgPSB0eXBlb2YgY21kLnRpbWVzdGFtcCA9PT0gJ3N0cmluZycgPyBjbWQudGltZXN0YW1wIDogJ1lZWVktTU0tREQtSEg6bW06c3MnO1xuXG4gICAgaWYgKGNtZC5oaWdobGlnaHQpXG4gICAgICBoaWdobGlnaHQgPSB0eXBlb2YgY21kLmhpZ2hsaWdodCA9PT0gJ3N0cmluZycgPyBjbWQuaGlnaGxpZ2h0IDogZmFsc2U7XG5cbiAgICBpZiAoY21kLm91dCA9PT0gdHJ1ZSlcbiAgICAgIGV4Y2x1c2l2ZSA9ICdvdXQnO1xuXG4gICAgaWYgKGNtZC5lcnIgPT09IHRydWUpXG4gICAgICBleGNsdXNpdmUgPSAnZXJyJztcblxuICAgIGlmIChjbWQubm9zdHJlYW0gPT09IHRydWUpXG4gICAgICBwbTIucHJpbnRMb2dzKGlkLCBsaW5lLCByYXcsIHRpbWVzdGFtcCwgZXhjbHVzaXZlKTtcbiAgICBlbHNlIGlmIChjbWQuanNvbiA9PT0gdHJ1ZSlcbiAgICAgIExvZ3MuanNvblN0cmVhbShwbTIuQ2xpZW50LCBpZCk7XG4gICAgZWxzZSBpZiAoY21kLmZvcm1hdCA9PT0gdHJ1ZSlcbiAgICAgIExvZ3MuZm9ybWF0U3RyZWFtKHBtMi5DbGllbnQsIGlkLCBmYWxzZSwgJ1lZWVktTU0tREQtSEg6bW06c3NaWicsIGV4Y2x1c2l2ZSwgaGlnaGxpZ2h0KTtcbiAgICBlbHNlXG4gICAgICBwbTIuc3RyZWFtTG9ncyhpZCwgbGluZSwgcmF3LCB0aW1lc3RhbXAsIGV4Y2x1c2l2ZSwgaGlnaGxpZ2h0KTtcbiAgfSk7XG5cblxuLy9cbi8vIEtpbGxcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgna2lsbCcpXG4gIC5kZXNjcmlwdGlvbigna2lsbCBkYWVtb24nKVxuICAuYWN0aW9uKGZhaWxPblVua25vd24oZnVuY3Rpb24gKGFyZykge1xuICAgIHBtMi5raWxsRGFlbW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgIHByb2Nlc3MuZXhpdChjc3QuU1VDQ0VTU19FWElUKTtcbiAgICB9KTtcbiAgfSkpO1xuXG4vL1xuLy8gVXBkYXRlIHJlcG9zaXRvcnkgZm9yIGEgZ2l2ZW4gYXBwXG4vL1xuXG5jb21tYW5kZXIuY29tbWFuZCgncHVsbCA8bmFtZT4gW2NvbW1pdF9pZF0nKVxuICAuZGVzY3JpcHRpb24oJ3VwZGF0ZXMgcmVwb3NpdG9yeSBmb3IgYSBnaXZlbiBhcHAnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwbTJfbmFtZSwgY29tbWl0X2lkKSB7XG5cbiAgICBpZiAoY29tbWl0X2lkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHBtMi5fcHVsbENvbW1pdElkKHtcbiAgICAgICAgcG0yX25hbWU6IHBtMl9uYW1lLFxuICAgICAgICBjb21taXRfaWQ6IGNvbW1pdF9pZFxuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2VcbiAgICAgIHBtMi5wdWxsQW5kUmVzdGFydChwbTJfbmFtZSk7XG4gIH0pO1xuXG4vL1xuLy8gVXBkYXRlIHJlcG9zaXRvcnkgdG8gdGhlIG5leHQgY29tbWl0IGZvciBhIGdpdmVuIGFwcFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdmb3J3YXJkIDxuYW1lPicpXG4gIC5kZXNjcmlwdGlvbigndXBkYXRlcyByZXBvc2l0b3J5IHRvIHRoZSBuZXh0IGNvbW1pdCBmb3IgYSBnaXZlbiBhcHAnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwbTJfbmFtZSkge1xuICAgIHBtMi5mb3J3YXJkKHBtMl9uYW1lKTtcbiAgfSk7XG5cbi8vXG4vLyBEb3duZ3JhZGUgcmVwb3NpdG9yeSB0byB0aGUgcHJldmlvdXMgY29tbWl0IGZvciBhIGdpdmVuIGFwcFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdiYWNrd2FyZCA8bmFtZT4nKVxuICAuZGVzY3JpcHRpb24oJ2Rvd25ncmFkZXMgcmVwb3NpdG9yeSB0byB0aGUgcHJldmlvdXMgY29tbWl0IGZvciBhIGdpdmVuIGFwcCcpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHBtMl9uYW1lKSB7XG4gICAgcG0yLmJhY2t3YXJkKHBtMl9uYW1lKTtcbiAgfSk7XG5cbi8vXG4vLyBQZXJmb3JtIGEgZGVlcCB1cGRhdGUgb2YgUE0yXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2RlZXBVcGRhdGUnKVxuICAuZGVzY3JpcHRpb24oJ3BlcmZvcm1zIGEgZGVlcCB1cGRhdGUgb2YgUE0yJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLmRlZXBVcGRhdGUoKTtcbiAgfSk7XG5cbi8vXG4vLyBMYXVuY2ggYSBodHRwIHNlcnZlciB0aGF0IGV4cG9zZSBhIGdpdmVuIHBhdGggb24gZ2l2ZW4gcG9ydFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdzZXJ2ZSBbcGF0aF0gW3BvcnRdJylcbiAgLmFsaWFzKCdleHBvc2UnKVxuICAub3B0aW9uKCctLXBvcnQgW3BvcnRdJywgJ3NwZWNpZnkgcG9ydCB0byBsaXN0ZW4gdG8nKVxuICAub3B0aW9uKCctLXNwYScsICdhbHdheXMgc2VydmluZyBpbmRleC5odG1sIG9uIGluZXhpc3RhbnQgc3ViIHBhdGgnKVxuICAub3B0aW9uKCctLWJhc2ljLWF1dGgtdXNlcm5hbWUgW3VzZXJuYW1lXScsICdzZXQgYmFzaWMgYXV0aCB1c2VybmFtZScpXG4gIC5vcHRpb24oJy0tYmFzaWMtYXV0aC1wYXNzd29yZCBbcGFzc3dvcmRdJywgJ3NldCBiYXNpYyBhdXRoIHBhc3N3b3JkJylcbiAgLm9wdGlvbignLS1tb25pdG9yIFtmcm9udGVuZC1hcHBdJywgJ2Zyb250ZW5kIGFwcCBtb25pdG9yaW5nIChhdXRvIGludGVncmF0ZSBzbmlwcGV0IG9uIGh0bWwgZmlsZXMpJylcbiAgLmRlc2NyaXB0aW9uKCdzZXJ2ZSBhIGRpcmVjdG9yeSBvdmVyIGh0dHAgdmlhIHBvcnQnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwYXRoLCBwb3J0LCBjbWQpIHtcbiAgICBwbTIuc2VydmUocGF0aCwgcG9ydCB8fCBjbWQucG9ydCwgY21kLCBjb21tYW5kZXIpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2F1dG9pbnN0YWxsJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLmF1dG9pbnN0YWxsKClcbiAgfSlcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2V4YW1wbGVzJylcbiAgLmRlc2NyaXB0aW9uKCdkaXNwbGF5IHBtMiB1c2FnZSBleGFtcGxlcycpXG4gIC5hY3Rpb24oKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGNzdC5QUkVGSVhfTVNHICsgY2hhbGsuZ3JleSgncG0yIHVzYWdlIGV4YW1wbGVzOlxcbicpKTtcbiAgICBkaXNwbGF5RXhhbXBsZXMoKTtcbiAgICBwcm9jZXNzLmV4aXQoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gIH0pXG5cbi8vXG4vLyBDYXRjaCBhbGxcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnKicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKGNzdC5QUkVGSVhfTVNHX0VSUiArIGNoYWxrLmJvbGQoJ0NvbW1hbmQgbm90IGZvdW5kXFxuJykpO1xuICAgIGRpc3BsYXlVc2FnZSgpO1xuICAgIC8vIENoZWNrIGlmIGl0IGRvZXMgbm90IGZvcmdldCB0byBjbG9zZSBmZHMgZnJvbSBSUENcbiAgICBwcm9jZXNzLmV4aXQoY3N0LkVSUk9SX0VYSVQpO1xuICB9KTtcblxuLy9cbi8vIERpc3BsYXkgaGVscCBpZiAwIGFyZ3VtZW50cyBwYXNzZWQgdG8gcG0yXG4vL1xuaWYgKHByb2Nlc3MuYXJndi5sZW5ndGggPT0gMikge1xuICBjb21tYW5kZXIucGFyc2UocHJvY2Vzcy5hcmd2KTtcbiAgZGlzcGxheVVzYWdlKCk7XG4gIC8vIENoZWNrIGlmIGl0IGRvZXMgbm90IGZvcmdldCB0byBjbG9zZSBmZHMgZnJvbSBSUENcbiAgcHJvY2Vzcy5leGl0KGNzdC5FUlJPUl9FWElUKTtcbn1cbiJdfQ==