"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

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

var _Log = _interopRequireDefault(require("../API/Log"));

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
  if (cmd.nostream === true) pm2.printLogs(id, line, raw, timestamp, exclusive);else if (cmd.json === true) _Log["default"].jsonStream(pm2.Client, id);else if (cmd.format === true) _Log["default"].formatStream(pm2.Client, id, false, 'YYYY-MM-DD-HH:mm:ssZZ', exclusive, highlight);else pm2.streamLogs(id, line, raw, timestamp, exclusive, highlight);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9iaW5hcmllcy9DTEkudHMiXSwibmFtZXMiOlsicHJvY2VzcyIsImVudiIsIlBNMl9VU0FHRSIsImRlYnVnIiwiQ29tbW9uIiwiZGV0ZXJtaW5lU2lsZW50Q0xJIiwicHJpbnRWZXJzaW9uIiwicG0yIiwiUE0yIiwiUE0yaW9IYW5kbGVyIiwidXNlUE0yQ2xpZW50IiwiY29tbWFuZGVyIiwidmVyc2lvbiIsInBrZyIsIm9wdGlvbiIsInYiLCJtIiwicHVzaCIsInVzYWdlIiwiZGlzcGxheVVzYWdlIiwiY29uc29sZSIsImxvZyIsImRpc3BsYXlFeGFtcGxlcyIsImNoYWxrIiwiY3lhbiIsImJlZ2luQ29tbWFuZFByb2Nlc3NpbmciLCJnZXRWZXJzaW9uIiwiZXJyIiwicmVtb3RlX3ZlcnNpb24iLCJyZWQiLCJib2xkIiwiYmx1ZSIsInBhcnNlIiwiYXJndiIsImNoZWNrQ29tcGxldGlvbiIsInRhYnRhYiIsImNvbXBsZXRlIiwiZGF0YSIsInRlc3QiLCJsYXN0Iiwib3B0aW9ucyIsIm1hcCIsImNtZFByb2Nlc3MiLCJpbmRleE9mIiwicHJldiIsImxpc3QiLCJlbCIsIm5hbWUiLCJkaXNjb25uZWN0IiwiY29tbWFuZHMiLCJfbmFtZSIsIl9hcnIiLCJzbGljZSIsInBtMk5vRGFlYW1vbiIsImRhZW1vbl9tb2RlIiwiY29ubmVjdCIsInNldFRpbWVvdXQiLCJ0aGlyZCIsImZhaWxPblVua25vd24iLCJmbiIsImFyZyIsImFyZ3VtZW50cyIsImxlbmd0aCIsImNzdCIsIlBSRUZJWF9NU0ciLCJvdXRwdXRIZWxwIiwiZXhpdCIsIkVSUk9SX0VYSVQiLCJhcHBseSIsInBhdGNoQ29tbWFuZGVyQXJnIiwiY21kIiwiYXJnc0luZGV4IiwicmF3QXJncyIsIm9wdGFyZ3MiLCJjb21tYW5kIiwiZGVzY3JpcHRpb24iLCJhY3Rpb24iLCJvcHRzIiwiY29udGFpbmVyIiwiZGlzdCIsImRvY2tlck1vZGUiLCJzdGRpbiIsInJlc3VtZSIsInNldEVuY29kaW5nIiwib24iLCJwYXVzZSIsIl9zdGFydEpzb24iLCJBUFBfQ09ORl9ERUZBVUxUX0ZJTEUiLCJhY2MiLCJzY3JpcHQiLCJuZXh0Iiwic3RhcnQiLCJhcHBzIiwiY29uY2F0IiwiZHQiLCJtZXNzYWdlIiwiaW5jbHVkZXMiLCJleGl0Q2xpIiwic3BlZWRMaXN0IiwicG1faWQiLCJhY3Rpb25fbmFtZSIsInBhcmFtcyIsInRyaWdnZXIiLCJkZXBsb3kiLCJmaWxlIiwiYXBwIiwiZ2V0UElEIiwiYm9pbGVycGxhdGUiLCJwYXJhbSIsInN0b3AiLCJyZXN0YXJ0IiwiYXBwX25hbWUiLCJudW1iZXIiLCJzY2FsZSIsInRpbWUiLCJwcm9maWxlIiwicG0yX2lkIiwicmVsb2FkIiwiZ2V0UHJvY2Vzc0lkQnlOYW1lIiwiaW5zcGVjdCIsImFsaWFzIiwic2lnbmFsIiwiaXNOYU4iLCJwYXJzZUludCIsInNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lIiwic2VuZFNpZ25hbFRvUHJvY2Vzc0lkIiwicGluZyIsInVwZGF0ZSIsInBsdWdpbl9uYW1lIiwicmVxdWlyZSIsIl9leHRlbmQiLCJpbnN0YWxsIiwiZ2VuZXJhdGVNb2R1bGVTYW1wbGUiLCJ1bmluc3RhbGwiLCJ0YXJnZXQiLCJmb2xkZXIiLCJwdWJsaXNoIiwia2V5IiwidmFsdWUiLCJzZXQiLCJzdHIiLCJtdWx0aXNldCIsImdldCIsImNvbmYiLCJ1bnNldCIsInJlcG9ydCIsImxpbmtNYW5hZ2VtZW50IiwiYmluZCIsInVubGluayIsInVuZGVmaW5lZCIsInBsdXNIYW5kbGVyIiwibW9uaXRvclN0YXRlIiwib3BlbkRhc2hib2FyZCIsImluZm9Ob2RlIiwiS0VZTUVUUklDU19OT0RFIiwibGF1bmNoIiwiZHVtcCIsImZvcmNlIiwiY2xlYXJEdW1wIiwibGluZSIsInNlbmRMaW5lVG9TdGRpbiIsInNlcGFyYXRvciIsImF0dGFjaCIsInJlc3VycmVjdCIsInBsYXRmb3JtIiwidW5pbnN0YWxsU3RhcnR1cCIsInN0YXJ0dXAiLCJsb2dyb3RhdGUiLCJtb2RlIiwiZ2VuZXJhdGVTYW1wbGUiLCJwcm9jX2lkIiwicmVzZXQiLCJkZXNjcmliZSIsImpsaXN0IiwibGF1bmNoU3lzTW9uaXRvcmluZyIsInNsaXN0IiwidHJlZSIsImRhc2hib2FyZCIsIm1vbml0IiwiYXBpIiwiZmx1c2giLCJyZWxvYWRMb2dzIiwiaWQiLCJyYXciLCJleGNsdXNpdmUiLCJ0aW1lc3RhbXAiLCJoaWdobGlnaHQiLCJsaW5lcyIsInBhcmVudCIsIm91dCIsIm5vc3RyZWFtIiwicHJpbnRMb2dzIiwianNvbiIsIkxvZ3MiLCJqc29uU3RyZWFtIiwiQ2xpZW50IiwiZm9ybWF0IiwiZm9ybWF0U3RyZWFtIiwic3RyZWFtTG9ncyIsImtpbGxEYWVtb24iLCJTVUNDRVNTX0VYSVQiLCJwbTJfbmFtZSIsImNvbW1pdF9pZCIsIl9wdWxsQ29tbWl0SWQiLCJwdWxsQW5kUmVzdGFydCIsImZvcndhcmQiLCJiYWNrd2FyZCIsImRlZXBVcGRhdGUiLCJwYXRoIiwicG9ydCIsInNlcnZlIiwiYXV0b2luc3RhbGwiLCJncmV5IiwiUFJFRklYX01TR19FUlIiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBOztBQUVBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQWRBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsU0FBWixHQUF3QixLQUF4QjtBQWdCQSxJQUFNQyxLQUFLLEdBQUcsdUJBQVksU0FBWixDQUFkOztBQUVBQyxtQkFBT0Msa0JBQVA7O0FBQ0FELG1CQUFPRSxZQUFQOztBQUVBLElBQUlDLEdBQVEsR0FBRyxJQUFJQyxlQUFKLEVBQWY7O0FBRUFDLGtCQUFhQyxZQUFiLENBQTBCSCxHQUExQjs7QUFFQUksc0JBQVVDLE9BQVYsQ0FBa0JDLG9CQUFJRCxPQUF0QixFQUNLRSxNQURMLENBQ1ksY0FEWixFQUM0QixtQkFENUIsRUFFS0EsTUFGTCxDQUVZLGFBRlosRUFFMkIsbUJBRjNCLEVBRWdELEtBRmhELEVBR0tBLE1BSEwsQ0FHWSxvQkFI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YUgsc0JBQUlJLFVBQWpCO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyJwcm9jZXNzLmVudi5QTTJfVVNBR0UgPSAnQ0xJJztcblxuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi9jb25zdGFudHMnO1xuXG5pbXBvcnQgY29tbWFuZGVyIGZyb20gJ2NvbW1hbmRlcic7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IGZvckVhY2hMaW1pdCBmcm9tICdhc3luYy9mb3JFYWNoTGltaXQnO1xuXG5pbXBvcnQgZGVidWdMb2dnZXIgZnJvbSAnZGVidWcnO1xuaW1wb3J0IFBNMiBmcm9tICcuLi9BUEknO1xuaW1wb3J0IHBrZyBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nO1xuaW1wb3J0ICogYXMgdGFidGFiIGZyb20gJy4uL2NvbXBsZXRpb24nO1xuaW1wb3J0IENvbW1vbiBmcm9tICcuLi9Db21tb24nO1xuaW1wb3J0IFBNMmlvSGFuZGxlciBmcm9tICcuLi9BUEkvcG0yLXBsdXMvUE0ySU8nO1xuaW1wb3J0IExvZ3MgZnJvbSAnLi4vQVBJL0xvZyc7XG5cbmNvbnN0IGRlYnVnID0gZGVidWdMb2dnZXIoJ3BtMjpjbGknKTtcblxuQ29tbW9uLmRldGVybWluZVNpbGVudENMSSgpO1xuQ29tbW9uLnByaW50VmVyc2lvbigpO1xuXG52YXIgcG0yOiBhbnkgPSBuZXcgUE0yKCk7XG5cblBNMmlvSGFuZGxlci51c2VQTTJDbGllbnQocG0yKVxuXG5jb21tYW5kZXIudmVyc2lvbihwa2cudmVyc2lvbilcbiAgICAub3B0aW9uKCctdiAtLXZlcnNpb24nLCAncHJpbnQgcG0yIHZlcnNpb24nKVxuICAgIC5vcHRpb24oJy1zIC0tc2lsZW50JywgJ2hpZGUgYWxsIG1lc3NhZ2VzJywgZmFsc2UpXG4gICAgLm9wdGlvbignLS1leHQgPGV4dGVuc2lvbnM+JywgJ3dhdGNoIG9ubHkgdGhpcyBmaWxlIGV4dGVuc2lvbnMnKVxuICAgIC5vcHRpb24oJy1uIC0tbmFtZSA8bmFtZT4nLCAnc2V0IGEgbmFtZSBmb3IgdGhlIHByb2Nlc3MgaW4gdGhlIHByb2Nlc3MgbGlzdCcpXG4gICAgLm9wdGlvbignLW0gLS1taW5pLWxpc3QnLCAnZGlzcGxheSBhIGNvbXBhY3RlZCBsaXN0IHdpdGhvdXQgZm9ybWF0dGluZycpXG4gICAgLm9wdGlvbignLS1pbnRlcnByZXRlciA8aW50ZXJwcmV0ZXI+JywgJ3NldCBhIHNwZWNpZmljIGludGVycHJldGVyIHRvIHVzZSBmb3IgZXhlY3V0aW5nIGFwcCwgZGVmYXVsdDogbm9kZScpXG4gICAgLm9wdGlvbignLS1pbnRlcnByZXRlci1hcmdzIDxhcmd1bWVudHM+JywgJ3NldCBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgaW50ZXJwcmV0ZXIgKGFsaWFzIG9mIC0tbm9kZS1hcmdzKScpXG4gICAgLm9wdGlvbignLS1ub2RlLWFyZ3MgPG5vZGVfYXJncz4nLCAnc3BhY2UgZGVsaW1pdGVkIGFyZ3VtZW50cyB0byBwYXNzIHRvIG5vZGUnKVxuICAgIC5vcHRpb24oJy1vIC0tb3V0cHV0IDxwYXRoPicsICdzcGVjaWZ5IGxvZyBmaWxlIGZvciBzdGRvdXQnKVxuICAgIC5vcHRpb24oJy1lIC0tZXJyb3IgPHBhdGg+JywgJ3NwZWNpZnkgbG9nIGZpbGUgZm9yIHN0ZGVycicpXG4gICAgLm9wdGlvbignLWwgLS1sb2cgW3BhdGhdJywgJ3NwZWNpZnkgbG9nIGZpbGUgd2hpY2ggZ2F0aGVycyBib3RoIHN0ZG91dCBhbmQgc3RkZXJyJylcbiAgICAub3B0aW9uKCctLWZpbHRlci1lbnYgW2VudnNdJywgJ2ZpbHRlciBvdXQgb3V0Z29pbmcgZ2xvYmFsIHZhbHVlcyB0aGF0IGNvbnRhaW4gcHJvdmlkZWQgc3RyaW5ncycsIGZ1bmN0aW9uICh2LCBtKSB7IG0ucHVzaCh2KTsgcmV0dXJuIG07IH0sIFtdKVxuICAgIC5vcHRpb24oJy0tbG9nLXR5cGUgPHR5cGU+JywgJ3NwZWNpZnkgbG9nIG91dHB1dCBzdHlsZSAocmF3IGJ5IGRlZmF1bHQsIGpzb24gb3B0aW9uYWwpJylcbiAgICAub3B0aW9uKCctLWxvZy1kYXRlLWZvcm1hdCA8ZGF0ZSBmb3JtYXQ+JywgJ2FkZCBjdXN0b20gcHJlZml4IHRpbWVzdGFtcCB0byBsb2dzJylcbiAgICAub3B0aW9uKCctLXRpbWUnLCAnZW5hYmxlIHRpbWUgbG9nZ2luZycpXG4gICAgLm9wdGlvbignLS1kaXNhYmxlLWxvZ3MnLCAnZGlzYWJsZSBhbGwgbG9ncyBzdG9yYWdlJylcbiAgICAub3B0aW9uKCctLWVudiA8ZW52aXJvbm1lbnRfbmFtZT4nLCAnc3BlY2lmeSB3aGljaCBzZXQgb2YgZW52aXJvbm1lbnQgdmFyaWFibGVzIGZyb20gZWNvc3lzdGVtIGZpbGUgbXVzdCBiZSBpbmplY3RlZCcpXG4gICAgLm9wdGlvbignLWEgLS11cGRhdGUtZW52JywgJ2ZvcmNlIGFuIHVwZGF0ZSBvZiB0aGUgZW52aXJvbm1lbnQgd2l0aCByZXN0YXJ0L3JlbG9hZCAoLWEgPD0+IGFwcGx5KScpXG4gICAgLm9wdGlvbignLWYgLS1mb3JjZScsICdmb3JjZSBhY3Rpb25zJylcbiAgICAub3B0aW9uKCctaSAtLWluc3RhbmNlcyA8bnVtYmVyPicsICdsYXVuY2ggW251bWJlcl0gaW5zdGFuY2VzIChmb3IgbmV0d29ya2VkIGFwcCkobG9hZCBiYWxhbmNlZCknKVxuICAgIC5vcHRpb24oJy0tcGFyYWxsZWwgPG51bWJlcj4nLCAnbnVtYmVyIG9mIHBhcmFsbGVsIGFjdGlvbnMgKGZvciByZXN0YXJ0L3JlbG9hZCknKVxuICAgIC5vcHRpb24oJy0tc2h1dGRvd24td2l0aC1tZXNzYWdlJywgJ3NodXRkb3duIGFuIGFwcGxpY2F0aW9uIHdpdGggcHJvY2Vzcy5zZW5kKFxcJ3NodXRkb3duXFwnKSBpbnN0ZWFkIG9mIHByb2Nlc3Mua2lsbChwaWQsIFNJR0lOVCknKVxuICAgIC5vcHRpb24oJy1wIC0tcGlkIDxwaWQ+JywgJ3NwZWNpZnkgcGlkIGZpbGUnKVxuICAgIC5vcHRpb24oJy1rIC0ta2lsbC10aW1lb3V0IDxkZWxheT4nLCAnZGVsYXkgYmVmb3JlIHNlbmRpbmcgZmluYWwgU0lHS0lMTCBzaWduYWwgdG8gcHJvY2VzcycpXG4gICAgLm9wdGlvbignLS1saXN0ZW4tdGltZW91dCA8ZGVsYXk+JywgJ2xpc3RlbiB0aW1lb3V0IG9uIGFwcGxpY2F0aW9uIHJlbG9hZCcpXG4gICAgLm9wdGlvbignLS1tYXgtbWVtb3J5LXJlc3RhcnQgPG1lbW9yeT4nLCAnUmVzdGFydCB0aGUgYXBwIGlmIGFuIGFtb3VudCBvZiBtZW1vcnkgaXMgZXhjZWVkZWQgKGluIGJ5dGVzKScpXG4gICAgLm9wdGlvbignLS1yZXN0YXJ0LWRlbGF5IDxkZWxheT4nLCAnc3BlY2lmeSBhIGRlbGF5IGJldHdlZW4gcmVzdGFydHMgKGluIG1pbGxpc2Vjb25kcyknKVxuICAgIC5vcHRpb24oJy0tZXhwLWJhY2tvZmYtcmVzdGFydC1kZWxheSA8ZGVsYXk+JywgJ3NwZWNpZnkgYSBkZWxheSBiZXR3ZWVuIHJlc3RhcnRzIChpbiBtaWxsaXNlY29uZHMpJylcbiAgICAub3B0aW9uKCcteCAtLWV4ZWN1dGUtY29tbWFuZCcsICdleGVjdXRlIGEgcHJvZ3JhbSB1c2luZyBmb3JrIHN5c3RlbScpXG4gICAgLm9wdGlvbignLS1tYXgtcmVzdGFydHMgW2NvdW50XScsICdvbmx5IHJlc3RhcnQgdGhlIHNjcmlwdCBDT1VOVCB0aW1lcycpXG4gICAgLm9wdGlvbignLXUgLS11c2VyIDx1c2VybmFtZT4nLCAnZGVmaW5lIHVzZXIgd2hlbiBnZW5lcmF0aW5nIHN0YXJ0dXAgc2NyaXB0JylcbiAgICAub3B0aW9uKCctLXVpZCA8dWlkPicsICdydW4gdGFyZ2V0IHNjcmlwdCB3aXRoIDx1aWQ+IHJpZ2h0cycpXG4gICAgLm9wdGlvbignLS1naWQgPGdpZD4nLCAncnVuIHRhcmdldCBzY3JpcHQgd2l0aCA8Z2lkPiByaWdodHMnKVxuICAgIC5vcHRpb24oJy0tbmFtZXNwYWNlIDxucz4nLCAnc3RhcnQgYXBwbGljYXRpb24gd2l0aGluIHNwZWNpZmllZCBuYW1lc3BhY2UnKVxuICAgIC5vcHRpb24oJy0tY3dkIDxwYXRoPicsICdydW4gdGFyZ2V0IHNjcmlwdCBmcm9tIHBhdGggPGN3ZD4nKVxuICAgIC5vcHRpb24oJy0taHAgPGhvbWUgcGF0aD4nLCAnZGVmaW5lIGhvbWUgcGF0aCB3aGVuIGdlbmVyYXRpbmcgc3RhcnR1cCBzY3JpcHQnKVxuICAgIC5vcHRpb24oJy0td2FpdC1pcCcsICdvdmVycmlkZSBzeXN0ZW1kIHNjcmlwdCB0byB3YWl0IGZvciBmdWxsIGludGVybmV0IGNvbm5lY3Rpdml0eSB0byBsYXVuY2ggcG0yJylcbiAgICAub3B0aW9uKCctLXNlcnZpY2UtbmFtZSA8bmFtZT4nLCAnZGVmaW5lIHNlcnZpY2UgbmFtZSB3aGVuIGdlbmVyYXRpbmcgc3RhcnR1cCBzY3JpcHQnKVxuICAgIC5vcHRpb24oJy1jIC0tY3JvbiA8Y3Jvbl9wYXR0ZXJuPicsICdyZXN0YXJ0IGEgcnVubmluZyBwcm9jZXNzIGJhc2VkIG9uIGEgY3JvbiBwYXR0ZXJuJylcbiAgICAub3B0aW9uKCctdyAtLXdyaXRlJywgJ3dyaXRlIGNvbmZpZ3VyYXRpb24gaW4gbG9jYWwgZm9sZGVyJylcbiAgICAub3B0aW9uKCctLW5vLWRhZW1vbicsICdydW4gcG0yIGRhZW1vbiBpbiB0aGUgZm9yZWdyb3VuZCBpZiBpdCBkb2VzblxcJ3QgZXhpc3QgYWxyZWFkeScpXG4gICAgLm9wdGlvbignLS1zb3VyY2UtbWFwLXN1cHBvcnQnLCAnZm9yY2Ugc291cmNlIG1hcCBzdXBwb3J0JylcbiAgICAub3B0aW9uKCctLW9ubHkgPGFwcGxpY2F0aW9uLW5hbWU+JywgJ3dpdGgganNvbiBkZWNsYXJhdGlvbiwgYWxsb3cgdG8gb25seSBhY3Qgb24gb25lIGFwcGxpY2F0aW9uJylcbiAgICAub3B0aW9uKCctLWRpc2FibGUtc291cmNlLW1hcC1zdXBwb3J0JywgJ2ZvcmNlIHNvdXJjZSBtYXAgc3VwcG9ydCcpXG4gICAgLm9wdGlvbignLS13YWl0LXJlYWR5JywgJ2FzayBwbTIgdG8gd2FpdCBmb3IgcmVhZHkgZXZlbnQgZnJvbSB5b3VyIGFwcCcpXG4gICAgLm9wdGlvbignLS1tZXJnZS1sb2dzJywgJ21lcmdlIGxvZ3MgZnJvbSBkaWZmZXJlbnQgaW5zdGFuY2VzIGJ1dCBrZWVwIGVycm9yIGFuZCBvdXQgc2VwYXJhdGVkJylcbiAgICAub3B0aW9uKCctLXdhdGNoIFtwYXRoc10nLCAnd2F0Y2ggYXBwbGljYXRpb24gZm9sZGVyIGZvciBjaGFuZ2VzJywgZnVuY3Rpb24gKHYsIG0pIHsgbS5wdXNoKHYpOyByZXR1cm4gbTsgfSwgW10pXG4gICAgLm9wdGlvbignLS1pZ25vcmUtd2F0Y2ggPGZvbGRlcnN8ZmlsZXM+JywgJ0xpc3Qgb2YgcGF0aHMgdG8gaWdub3JlIChuYW1lIG9yIHJlZ2V4KScpXG4gICAgLm9wdGlvbignLS13YXRjaC1kZWxheSA8ZGVsYXk+JywgJ3NwZWNpZnkgYSByZXN0YXJ0IGRlbGF5IGFmdGVyIGNoYW5naW5nIGZpbGVzICgtLXdhdGNoLWRlbGF5IDQgKGluIHNlYykgb3IgNDAwMG1zKScpXG4gICAgLm9wdGlvbignLS1uby1jb2xvcicsICdza2lwIGNvbG9ycycpXG4gICAgLm9wdGlvbignLS1uby12aXppb24nLCAnc3RhcnQgYW4gYXBwIHdpdGhvdXQgdml6aW9uIGZlYXR1cmUgKHZlcnNpb25pbmcgY29udHJvbCknKVxuICAgIC5vcHRpb24oJy0tbm8tYXV0b3Jlc3RhcnQnLCAnc3RhcnQgYW4gYXBwIHdpdGhvdXQgYXV0b21hdGljIHJlc3RhcnQnKVxuICAgIC5vcHRpb24oJy0tbm8tdHJlZWtpbGwnLCAnT25seSBraWxsIHRoZSBtYWluIHByb2Nlc3MsIG5vdCBkZXRhY2hlZCBjaGlsZHJlbicpXG4gICAgLm9wdGlvbignLS1uby1wbXgnLCAnc3RhcnQgYW4gYXBwIHdpdGhvdXQgcG14JylcbiAgICAub3B0aW9uKCctLW5vLWF1dG9tYXRpb24nLCAnc3RhcnQgYW4gYXBwIHdpdGhvdXQgcG14JylcbiAgICAub3B0aW9uKCctLXRyYWNlJywgJ2VuYWJsZSB0cmFuc2FjdGlvbiB0cmFjaW5nIHdpdGgga20nKVxuICAgIC5vcHRpb24oJy0tZGlzYWJsZS10cmFjZScsICdkaXNhYmxlIHRyYW5zYWN0aW9uIHRyYWNpbmcgd2l0aCBrbScpXG4gICAgLm9wdGlvbignLS1hdHRhY2gnLCAnYXR0YWNoIGxvZ2dpbmcgYWZ0ZXIgeW91ciBzdGFydC9yZXN0YXJ0L3N0b3AvcmVsb2FkJylcbiAgICAub3B0aW9uKCctLXY4JywgJ2VuYWJsZSB2OCBkYXRhIGNvbGxlY3RpbmcnKVxuICAgIC5vcHRpb24oJy0tZXZlbnQtbG9vcC1pbnNwZWN0b3InLCAnZW5hYmxlIGV2ZW50LWxvb3AtaW5zcGVjdG9yIGR1bXAgaW4gcG14JylcbiAgICAub3B0aW9uKCctLWRlZXAtbW9uaXRvcmluZycsICdlbmFibGUgYWxsIG1vbml0b3JpbmcgdG9vbHMgKGVxdWl2YWxlbnQgdG8gLS12OCAtLWV2ZW50LWxvb3AtaW5zcGVjdG9yIC0tdHJhY2UpJylcbiAgICAudXNhZ2UoJ1tjbWRdIGFwcCcpO1xuXG5mdW5jdGlvbiBkaXNwbGF5VXNhZ2UoKSB7XG4gICAgY29uc29sZS5sb2coJ3VzYWdlOiBwbTIgW29wdGlvbnNdIDxjb21tYW5kPicpXG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCdwbTIgLWgsIC0taGVscCAgICAgICAgICAgICBhbGwgYXZhaWxhYmxlIGNvbW1hbmRzIGFuZCBvcHRpb25zJyk7XG4gICAgY29uc29sZS5sb2coJ3BtMiBleGFtcGxlcyAgICAgICAgICAgICAgIGRpc3BsYXkgcG0yIHVzYWdlIGV4YW1wbGVzJyk7XG4gICAgY29uc29sZS5sb2coJ3BtMiA8Y29tbWFuZD4gLWggICAgICAgICAgIGhlbHAgb24gYSBzcGVjaWZpYyBjb21tYW5kJyk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCdBY2Nlc3MgcG0yIGZpbGVzIGluIH4vLnBtMicpO1xufVxuXG5mdW5jdGlvbiBkaXNwbGF5RXhhbXBsZXMoKSB7XG4gICAgY29uc29sZS5sb2coJy0gU3RhcnQgYW5kIGFkZCBhIHByb2Nlc3MgdG8gdGhlIHBtMiBwcm9jZXNzIGxpc3Q6JylcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coY2hhbGsuY3lhbignICAkIHBtMiBzdGFydCBhcHAuanMgLS1uYW1lIGFwcCcpKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJy0gU2hvdyB0aGUgcHJvY2VzcyBsaXN0OicpO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKCcgICQgcG0yIGxzJykpO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZygnLSBTdG9wIGFuZCBkZWxldGUgYSBwcm9jZXNzIGZyb20gdGhlIHBtMiBwcm9jZXNzIGxpc3Q6Jyk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJyAgJCBwbTIgZGVsZXRlIGFwcCcpKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJy0gU3RvcCwgc3RhcnQgYW5kIHJlc3RhcnQgYSBwcm9jZXNzIGZyb20gdGhlIHByb2Nlc3MgbGlzdDonKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coY2hhbGsuY3lhbignICAkIHBtMiBzdG9wIGFwcCcpKTtcbiAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKCcgICQgcG0yIHN0YXJ0IGFwcCcpKTtcbiAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKCcgICQgcG0yIHJlc3RhcnQgYXBwJykpO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZygnLSBDbHVzdGVyaXplIGFuIGFwcCB0byBhbGwgQ1BVIGNvcmVzIGF2YWlsYWJsZTonKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coY2hhbGsuY3lhbignICAkIHBtMiBzdGFydCAtaSBtYXgnKSk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCctIFVwZGF0ZSBwbTIgOicpO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKCcgICQgbnBtIGluc3RhbGwgcG0yIC1nICYmIHBtMiB1cGRhdGUnKSk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCctIEluc3RhbGwgcG0yIGF1dG8gY29tcGxldGlvbjonKVxuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKCcgICQgcG0yIGNvbXBsZXRpb24gaW5zdGFsbCcpKVxuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZygnQ2hlY2sgdGhlIGZ1bGwgZG9jdW1lbnRhdGlvbiBvbiBodHRwczovL3BtMi5rZXltZXRyaWNzLmlvLycpO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcbn1cblxuZnVuY3Rpb24gYmVnaW5Db21tYW5kUHJvY2Vzc2luZygpIHtcbiAgICBwbTIuZ2V0VmVyc2lvbihmdW5jdGlvbiAoZXJyLCByZW1vdGVfdmVyc2lvbikge1xuICAgICAgICBpZiAoIWVyciAmJiAocGtnLnZlcnNpb24gIT0gcmVtb3RlX3ZlcnNpb24pKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5yZWQuYm9sZCgnPj4+PiBJbi1tZW1vcnkgUE0yIGlzIG91dC1vZi1kYXRlLCBkbzpcXG4+Pj4+ICQgcG0yIHVwZGF0ZScpKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbiBtZW1vcnkgUE0yIHZlcnNpb246JywgY2hhbGsuYmx1ZS5ib2xkKHJlbW90ZV92ZXJzaW9uKSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTG9jYWwgUE0yIHZlcnNpb246JywgY2hhbGsuYmx1ZS5ib2xkKHBrZy52ZXJzaW9uKSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBjb21tYW5kZXIucGFyc2UocHJvY2Vzcy5hcmd2KTtcbn1cblxuZnVuY3Rpb24gY2hlY2tDb21wbGV0aW9uKCkge1xuICAgIHJldHVybiB0YWJ0YWIuY29tcGxldGUoJ3BtMicsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgaWYgKGVyciB8fCAhZGF0YSkgcmV0dXJuO1xuICAgICAgICBpZiAoL14tLVxcdz8vLnRlc3QoZGF0YS5sYXN0KSkgcmV0dXJuIHRhYnRhYi5sb2coY29tbWFuZGVyLm9wdGlvbnMubWFwKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS5sb25nO1xuICAgICAgICB9KSwgZGF0YSk7XG4gICAgICAgIGlmICgvXi1cXHc/Ly50ZXN0KGRhdGEubGFzdCkpIHJldHVybiB0YWJ0YWIubG9nKGNvbW1hbmRlci5vcHRpb25zLm1hcChmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEuc2hvcnQ7XG4gICAgICAgIH0pLCBkYXRhKTtcbiAgICAgICAgLy8gYXJyYXkgY29udGFpbmluZyBjb21tYW5kcyBhZnRlciB3aGljaCBwcm9jZXNzIG5hbWUgc2hvdWxkIGJlIGxpc3RlZFxuICAgICAgICB2YXIgY21kUHJvY2VzcyA9IFsnc3RvcCcsICdyZXN0YXJ0JywgJ3NjYWxlJywgJ3JlbG9hZCcsICdkZWxldGUnLCAncmVzZXQnLCAncHVsbCcsICdmb3J3YXJkJywgJ2JhY2t3YXJkJywgJ2xvZ3MnLCAnZGVzY3JpYmUnLCAnZGVzYycsICdzaG93J107XG5cbiAgICAgICAgaWYgKGNtZFByb2Nlc3MuaW5kZXhPZihkYXRhLnByZXYpID4gLTEpIHtcbiAgICAgICAgICAgIHBtMi5saXN0KGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcbiAgICAgICAgICAgICAgICB0YWJ0YWIubG9nKGxpc3QubWFwKGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gZWwubmFtZSB9KSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgcG0yLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRhdGEucHJldiA9PSAncG0yJykge1xuICAgICAgICAgICAgdGFidGFiLmxvZyhjb21tYW5kZXIuY29tbWFuZHMubWFwKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEuX25hbWU7XG4gICAgICAgICAgICB9KSwgZGF0YSk7XG4gICAgICAgICAgICBwbTIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBtMi5kaXNjb25uZWN0KCk7XG4gICAgfSk7XG59O1xuXG52YXIgX2FyciA9IHByb2Nlc3MuYXJndi5pbmRleE9mKCctLScpID4gLTEgPyBwcm9jZXNzLmFyZ3Yuc2xpY2UoMCwgcHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0tJykpIDogcHJvY2Vzcy5hcmd2O1xuXG5pZiAoX2Fyci5pbmRleE9mKCdsb2cnKSA+IC0xKSB7XG4gICAgcHJvY2Vzcy5hcmd2W19hcnIuaW5kZXhPZignbG9nJyldID0gJ2xvZ3MnO1xufVxuXG5pZiAoX2Fyci5pbmRleE9mKCctLW5vLWRhZW1vbicpID4gLTEpIHtcbiAgICAvL1xuICAgIC8vIFN0YXJ0IGRhZW1vbiBpZiBpdCBkb2VzIG5vdCBleGlzdFxuICAgIC8vXG4gICAgLy8gRnVuY3Rpb24gY2hlY2tzIGlmIC0tbm8tZGFlbW9uIG9wdGlvbiBpcyBwcmVzZW50LFxuICAgIC8vIGFuZCBzdGFydHMgZGFlbW9uIGluIHRoZSBzYW1lIHByb2Nlc3MgaWYgaXQgZG9lcyBub3QgZXhpc3RcbiAgICAvL1xuICAgIGNvbnNvbGUubG9nKCdwbTIgbGF1bmNoZWQgaW4gbm8tZGFlbW9uIG1vZGUgKHlvdSBjYW4gYWRkIERFQlVHPVwiKlwiIGVudiB2YXJpYWJsZSB0byBnZXQgbW9yZSBtZXNzYWdlcyknKTtcbiAgICB2YXIgcG0yTm9EYWVhbW9uID0gbmV3IFBNMih7XG4gICAgICAgIGRhZW1vbl9tb2RlOiBmYWxzZVxuICAgIH0pO1xuXG4gICAgcG0yTm9EYWVhbW9uLmNvbm5lY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICBwbTIgPSBwbTJOb0RhZWFtb247XG4gICAgICAgIGJlZ2luQ29tbWFuZFByb2Nlc3NpbmcoKTtcbiAgICB9KTtcblxufSBlbHNlIGlmIChfYXJyLmluZGV4T2YoJ3N0YXJ0dXAnKSA+IC0xIHx8IF9hcnIuaW5kZXhPZigndW5zdGFydHVwJykgPiAtMSkge1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb21tYW5kZXIucGFyc2UocHJvY2Vzcy5hcmd2KTtcbiAgICB9LCAxMDApO1xufSBlbHNlIHtcbiAgICAvLyBIRVJFIHdlIGluc3RhbmNpYXRlIHRoZSBDbGllbnQgb2JqZWN0XG4gICAgcG0yLmNvbm5lY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICBkZWJ1ZygnTm93IGNvbm5lY3RlZCB0byBkYWVtb24nKTtcbiAgICAgICAgaWYgKHByb2Nlc3MuYXJndi5zbGljZSgyKVswXSA9PT0gJ2NvbXBsZXRpb24nKSB7XG4gICAgICAgICAgICBjaGVja0NvbXBsZXRpb24oKTtcbiAgICAgICAgICAgIC8vQ2xvc2UgY2xpZW50IGlmIGNvbXBsZXRpb24gcmVsYXRlZCBpbnN0YWxsYXRpb25cbiAgICAgICAgICAgIHZhciB0aGlyZCA9IHByb2Nlc3MuYXJndi5zbGljZSgzKVswXTtcbiAgICAgICAgICAgIGlmICh0aGlyZCA9PSBudWxsIHx8IHRoaXJkID09PSAnaW5zdGFsbCcgfHwgdGhpcmQgPT09ICd1bmluc3RhbGwnKVxuICAgICAgICAgICAgICAgIHBtMi5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBiZWdpbkNvbW1hbmRQcm9jZXNzaW5nKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLy9cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBmYWlsIHdoZW4gdW5rbm93biBjb21tYW5kIGFyZ3VtZW50cyBhcmUgcGFzc2VkXG4vL1xuZnVuY3Rpb24gZmFpbE9uVW5rbm93bihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYXJnKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coY3N0LlBSRUZJWF9NU0cgKyAnXFxuVW5rbm93biBjb21tYW5kIGFyZ3VtZW50OiAnICsgYXJnKTtcbiAgICAgICAgICAgIGNvbW1hbmRlci5vdXRwdXRIZWxwKCk7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8qKlxuICogQHRvZG8gdG8gcmVtb3ZlIGF0IHNvbWUgcG9pbnQgb25jZSBpdCdzIGZpeGVkIGluIG9mZmljaWFsIGNvbW1hbmRlci5qc1xuICogaHR0cHM6Ly9naXRodWIuY29tL3RqL2NvbW1hbmRlci5qcy9pc3N1ZXMvNDc1XG4gKlxuICogUGF0Y2ggQ29tbWFuZGVyLmpzIFZhcmlhZGljIGZlYXR1cmVcbiAqL1xuZnVuY3Rpb24gcGF0Y2hDb21tYW5kZXJBcmcoY21kKSB7XG4gICAgdmFyIGFyZ3NJbmRleDtcbiAgICBpZiAoKGFyZ3NJbmRleCA9IGNvbW1hbmRlci5yYXdBcmdzLmluZGV4T2YoJy0tJykpID49IDApIHtcbiAgICAgICAgdmFyIG9wdGFyZ3MgPSBjb21tYW5kZXIucmF3QXJncy5zbGljZShhcmdzSW5kZXggKyAxKTtcbiAgICAgICAgY21kID0gY21kLnNsaWNlKDAsIGNtZC5pbmRleE9mKG9wdGFyZ3NbMF0pKTtcbiAgICB9XG4gICAgcmV0dXJuIGNtZDtcbn1cblxuLy9cbi8vIFN0YXJ0IGNvbW1hbmRcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnc3RhcnQgW25hbWV8bmFtZXNwYWNlfGZpbGV8ZWNvc3lzdGVtfGlkLi4uXScpXG4gICAgLm9wdGlvbignLS13YXRjaCcsICdXYXRjaCBmb2xkZXIgZm9yIGNoYW5nZXMnKVxuICAgIC5vcHRpb24oJy0tZnJlc2gnLCAnUmVidWlsZCBEb2NrZXJmaWxlJylcbiAgICAub3B0aW9uKCctLWRhZW1vbicsICdSdW4gY29udGFpbmVyIGluIERhZW1vbiBtb2RlIChkZWJ1ZyBwdXJwb3NlcyknKVxuICAgIC5vcHRpb24oJy0tY29udGFpbmVyJywgJ1N0YXJ0IGFwcGxpY2F0aW9uIGluIGNvbnRhaW5lciBtb2RlJylcbiAgICAub3B0aW9uKCctLWRpc3QnLCAnd2l0aCAtLWNvbnRhaW5lcjsgY2hhbmdlIGxvY2FsIERvY2tlcmZpbGUgdG8gY29udGFpbmVyaXplIGFsbCBmaWxlcyBpbiBjdXJyZW50IGRpcmVjdG9yeScpXG4gICAgLm9wdGlvbignLS1pbWFnZS1uYW1lIFtuYW1lXScsICd3aXRoIC0tZGlzdDsgc2V0IHRoZSBleHBvcnRlZCBpbWFnZSBuYW1lJylcbiAgICAub3B0aW9uKCctLW5vZGUtdmVyc2lvbiBbbWFqb3JdJywgJ3dpdGggLS1jb250YWluZXIsIHNldCBhIHNwZWNpZmljIG1ham9yIE5vZGUuanMgdmVyc2lvbicpXG4gICAgLm9wdGlvbignLS1kb2NrZXJkYWVtb24nLCAnZm9yIGRlYnVnZ2luZyBwdXJwb3NlJylcbiAgICAuZGVzY3JpcHRpb24oJ3N0YXJ0IGFuZCBkYWVtb25pemUgYW4gYXBwJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChjbWQsIG9wdHMpIHtcbiAgICAgICAgaWYgKG9wdHMuY29udGFpbmVyID09IHRydWUgJiYgb3B0cy5kaXN0ID09IHRydWUpXG4gICAgICAgICAgICByZXR1cm4gcG0yLmRvY2tlck1vZGUoY21kLCBvcHRzLCAnZGlzdHJpYnV0aW9uJyk7XG4gICAgICAgIGVsc2UgaWYgKG9wdHMuY29udGFpbmVyID09IHRydWUpXG4gICAgICAgICAgICByZXR1cm4gcG0yLmRvY2tlck1vZGUoY21kLCBvcHRzLCAnZGV2ZWxvcG1lbnQnKTtcblxuICAgICAgICBpZiAoY21kID09IFwiLVwiKSB7XG4gICAgICAgICAgICBwcm9jZXNzLnN0ZGluLnJlc3VtZSgpO1xuICAgICAgICAgICAgcHJvY2Vzcy5zdGRpbi5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgICAgICAgICAgcHJvY2Vzcy5zdGRpbi5vbignZGF0YScsIGZ1bmN0aW9uIChjbWQpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLnN0ZGluLnBhdXNlKCk7XG4gICAgICAgICAgICAgICAgcG0yLl9zdGFydEpzb24oY21kLCBjb21tYW5kZXIsICdyZXN0YXJ0UHJvY2Vzc0lkJywgJ3BpcGUnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gQ29tbWFuZGVyLmpzIHBhdGNoXG4gICAgICAgICAgICBjbWQgPSBwYXRjaENvbW1hbmRlckFyZyhjbWQpO1xuICAgICAgICAgICAgaWYgKGNtZC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBjbWQgPSBbY3N0LkFQUF9DT05GX0RFRkFVTFRfRklMRV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgYWNjID0gW11cbiAgICAgICAgICAgIGZvckVhY2hMaW1pdChjbWQsIDEsIGZ1bmN0aW9uIChzY3JpcHQsIG5leHQpIHtcbiAgICAgICAgICAgICAgICBwbTIuc3RhcnQoc2NyaXB0LCBjb21tYW5kZXIsIChlcnIsIGFwcHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYWNjID0gYWNjLmNvbmNhdChhcHBzKVxuICAgICAgICAgICAgICAgICAgICBuZXh0KGVycilcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIGR0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyciAmJiBlcnIubWVzc2FnZSAmJlxuICAgICAgICAgICAgICAgICAgICAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ1NjcmlwdCBub3QgZm91bmQnKSA9PT0gdHJ1ZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ05PVCBBVkFJTEFCTEUgSU4gUEFUSCcpID09PSB0cnVlKSkge1xuICAgICAgICAgICAgICAgICAgICBwbTIuZXhpdENsaSgxKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHBtMi5zcGVlZExpc3QoZXJyID8gMSA6IDAsIGFjYyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgndHJpZ2dlciA8aWR8cHJvY19uYW1lfG5hbWVzcGFjZXxhbGw+IDxhY3Rpb25fbmFtZT4gW3BhcmFtc10nKVxuICAgIC5kZXNjcmlwdGlvbigndHJpZ2dlciBwcm9jZXNzIGFjdGlvbicpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAocG1faWQsIGFjdGlvbl9uYW1lLCBwYXJhbXMpIHtcbiAgICAgICAgcG0yLnRyaWdnZXIocG1faWQsIGFjdGlvbl9uYW1lLCBwYXJhbXMpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZGVwbG95IDxmaWxlfGVudmlyb25tZW50PicpXG4gICAgLmRlc2NyaXB0aW9uKCdkZXBsb3kgeW91ciBqc29uJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChjbWQpIHtcbiAgICAgICAgcG0yLmRlcGxveShjbWQsIGNvbW1hbmRlcik7XG4gICAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdzdGFydE9yUmVzdGFydCA8anNvbj4nKVxuICAgIC5kZXNjcmlwdGlvbignc3RhcnQgb3IgcmVzdGFydCBKU09OIGZpbGUnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgcG0yLl9zdGFydEpzb24oZmlsZSwgY29tbWFuZGVyLCAncmVzdGFydFByb2Nlc3NJZCcpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnc3RhcnRPclJlbG9hZCA8anNvbj4nKVxuICAgIC5kZXNjcmlwdGlvbignc3RhcnQgb3IgZ3JhY2VmdWxseSByZWxvYWQgSlNPTiBmaWxlJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHBtMi5fc3RhcnRKc29uKGZpbGUsIGNvbW1hbmRlciwgJ3JlbG9hZFByb2Nlc3NJZCcpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgncGlkIFthcHBfbmFtZV0nKVxuICAgIC5kZXNjcmlwdGlvbigncmV0dXJuIHBpZCBvZiBbYXBwX25hbWVdIG9yIGFsbCcpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAoYXBwKSB7XG4gICAgICAgIHBtMi5nZXRQSUQoYXBwKTtcbiAgICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2NyZWF0ZScpXG4gICAgLmRlc2NyaXB0aW9uKCdyZXR1cm4gcGlkIG9mIFthcHBfbmFtZV0gb3IgYWxsJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG0yLmJvaWxlcnBsYXRlKClcbiAgICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3N0YXJ0T3JHcmFjZWZ1bFJlbG9hZCA8anNvbj4nKVxuICAgIC5kZXNjcmlwdGlvbignc3RhcnQgb3IgZ3JhY2VmdWxseSByZWxvYWQgSlNPTiBmaWxlJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHBtMi5fc3RhcnRKc29uKGZpbGUsIGNvbW1hbmRlciwgJ3NvZnRSZWxvYWRQcm9jZXNzSWQnKTtcbiAgICB9KTtcblxuLy9cbi8vIFN0b3Agc3BlY2lmaWMgaWRcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnc3RvcCA8aWR8bmFtZXxuYW1lc3BhY2V8YWxsfGpzb258c3RkaW4uLi4+JylcbiAgICAub3B0aW9uKCctLXdhdGNoJywgJ1N0b3Agd2F0Y2hpbmcgZm9sZGVyIGZvciBjaGFuZ2VzJylcbiAgICAuZGVzY3JpcHRpb24oJ3N0b3AgYSBwcm9jZXNzJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChwYXJhbSkge1xuICAgICAgICBmb3JFYWNoTGltaXQocGFyYW0sIDEsIGZ1bmN0aW9uIChzY3JpcHQsIG5leHQpIHtcbiAgICAgICAgICAgIHBtMi5zdG9wKHNjcmlwdCwgbmV4dCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIHBtMi5zcGVlZExpc3QoZXJyID8gMSA6IDApO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuLy9cbi8vIFN0b3AgQWxsIHByb2Nlc3Nlc1xuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdyZXN0YXJ0IDxpZHxuYW1lfG5hbWVzcGFjZXxhbGx8anNvbnxzdGRpbi4uLj4nKVxuICAgIC5vcHRpb24oJy0td2F0Y2gnLCAnVG9nZ2xlIHdhdGNoaW5nIGZvbGRlciBmb3IgY2hhbmdlcycpXG4gICAgLmRlc2NyaXB0aW9uKCdyZXN0YXJ0IGEgcHJvY2VzcycpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAocGFyYW0pIHtcbiAgICAgICAgLy8gQ29tbWFuZGVyLmpzIHBhdGNoXG4gICAgICAgIHBhcmFtID0gcGF0Y2hDb21tYW5kZXJBcmcocGFyYW0pO1xuICAgICAgICBsZXQgYWNjID0gW11cbiAgICAgICAgZm9yRWFjaExpbWl0KHBhcmFtLCAxLCBmdW5jdGlvbiAoc2NyaXB0LCBuZXh0KSB7XG4gICAgICAgICAgICBwbTIucmVzdGFydChzY3JpcHQsIGNvbW1hbmRlciwgKGVyciwgYXBwcykgPT4ge1xuICAgICAgICAgICAgICAgIGFjYyA9IGFjYy5jb25jYXQoYXBwcylcbiAgICAgICAgICAgICAgICBuZXh0KGVycilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBwbTIuc3BlZWRMaXN0KGVyciA/IDEgOiAwLCBhY2MpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuLy9cbi8vIFNjYWxlIHVwL2Rvd24gYSBwcm9jZXNzIGluIGNsdXN0ZXIgbW9kZVxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdzY2FsZSA8YXBwX25hbWU+IDxudW1iZXI+JylcbiAgICAuZGVzY3JpcHRpb24oJ3NjYWxlIHVwL2Rvd24gYSBwcm9jZXNzIGluIGNsdXN0ZXIgbW9kZSBkZXBlbmRpbmcgb24gdG90YWxfbnVtYmVyIHBhcmFtJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChhcHBfbmFtZSwgbnVtYmVyKSB7XG4gICAgICAgIHBtMi5zY2FsZShhcHBfbmFtZSwgbnVtYmVyKTtcbiAgICB9KTtcblxuLy9cbi8vIHNuYXBzaG90IFBNMlxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdwcm9maWxlOm1lbSBbdGltZV0nKVxuICAgIC5kZXNjcmlwdGlvbignU2FtcGxlIFBNMiBoZWFwIG1lbW9yeScpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAodGltZSkge1xuICAgICAgICBwbTIucHJvZmlsZSgnbWVtJywgdGltZSk7XG4gICAgfSk7XG5cbi8vXG4vLyBzbmFwc2hvdCBQTTJcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgncHJvZmlsZTpjcHUgW3RpbWVdJylcbiAgICAuZGVzY3JpcHRpb24oJ1Byb2ZpbGUgUE0yIGNwdScpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAodGltZSkge1xuICAgICAgICBwbTIucHJvZmlsZSgnY3B1JywgdGltZSk7XG4gICAgfSk7XG5cbi8vXG4vLyBSZWxvYWQgcHJvY2Vzcyhlcylcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgncmVsb2FkIDxpZHxuYW1lfG5hbWVzcGFjZXxhbGw+JylcbiAgICAuZGVzY3JpcHRpb24oJ3JlbG9hZCBwcm9jZXNzZXMgKG5vdGUgdGhhdCBpdHMgZm9yIGFwcCB1c2luZyBIVFRQL0hUVFBTKScpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAocG0yX2lkKSB7XG4gICAgICAgIHBtMi5yZWxvYWQocG0yX2lkLCBjb21tYW5kZXIpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnaWQgPG5hbWU+JylcbiAgICAuZGVzY3JpcHRpb24oJ2dldCBwcm9jZXNzIGlkIGJ5IG5hbWUnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcG0yLmdldFByb2Nlc3NJZEJ5TmFtZShuYW1lKTtcbiAgICB9KTtcblxuLy8gSW5zcGVjdCBhIHByb2Nlc3NcbmNvbW1hbmRlci5jb21tYW5kKCdpbnNwZWN0IDxuYW1lPicpXG4gICAgLmRlc2NyaXB0aW9uKCdpbnNwZWN0IGEgcHJvY2VzcycpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAoY21kKSB7XG4gICAgICAgIHBtMi5pbnNwZWN0KGNtZCwgY29tbWFuZGVyKTtcbiAgICB9KTtcblxuLy9cbi8vIFN0b3AgYW5kIGRlbGV0ZSBhIHByb2Nlc3MgYnkgbmFtZSBmcm9tIGRhdGFiYXNlXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2RlbGV0ZSA8bmFtZXxpZHxuYW1lc3BhY2V8c2NyaXB0fGFsbHxqc29ufHN0ZGluLi4uPicpXG4gICAgLmFsaWFzKCdkZWwnKVxuICAgIC5kZXNjcmlwdGlvbignc3RvcCBhbmQgZGVsZXRlIGEgcHJvY2VzcyBmcm9tIHBtMiBwcm9jZXNzIGxpc3QnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgaWYgKG5hbWUgPT0gXCItXCIpIHtcbiAgICAgICAgICAgIHByb2Nlc3Muc3RkaW4ucmVzdW1lKCk7XG4gICAgICAgICAgICBwcm9jZXNzLnN0ZGluLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgICAgICAgICBwcm9jZXNzLnN0ZGluLm9uKCdkYXRhJywgZnVuY3Rpb24gKHBhcmFtKSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5zdGRpbi5wYXVzZSgpO1xuICAgICAgICAgICAgICAgIHBtMi5kZWxldGUocGFyYW0sICdwaXBlJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICBmb3JFYWNoTGltaXQobmFtZSwgMSwgZnVuY3Rpb24gKHNjcmlwdCwgbmV4dCkge1xuICAgICAgICAgICAgICAgIHBtMi5kZWxldGUoc2NyaXB0LCAnJywgbmV4dCk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcG0yLnNwZWVkTGlzdChlcnIgPyAxIDogMCk7XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcblxuLy9cbi8vIFNlbmQgc3lzdGVtIHNpZ25hbCB0byBwcm9jZXNzXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ3NlbmRTaWduYWwgPHNpZ25hbD4gPHBtMl9pZHxuYW1lPicpXG4gICAgLmRlc2NyaXB0aW9uKCdzZW5kIGEgc3lzdGVtIHNpZ25hbCB0byB0aGUgdGFyZ2V0IHByb2Nlc3MnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKHNpZ25hbCwgcG0yX2lkKSB7XG4gICAgICAgIGlmIChpc05hTihwYXJzZUludChwbTJfaWQpKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coY3N0LlBSRUZJWF9NU0cgKyAnU2VuZGluZyBzaWduYWwgdG8gcHJvY2VzcyBuYW1lICcgKyBwbTJfaWQpO1xuICAgICAgICAgICAgcG0yLnNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lKHNpZ25hbCwgcG0yX2lkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNzdC5QUkVGSVhfTVNHICsgJ1NlbmRpbmcgc2lnbmFsIHRvIHByb2Nlc3MgaWQgJyArIHBtMl9pZCk7XG4gICAgICAgICAgICBwbTIuc2VuZFNpZ25hbFRvUHJvY2Vzc0lkKHNpZ25hbCwgcG0yX2lkKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4vL1xuLy8gU3RvcCBhbmQgZGVsZXRlIGEgcHJvY2VzcyBieSBuYW1lIGZyb20gZGF0YWJhc2Vcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgncGluZycpXG4gICAgLmRlc2NyaXB0aW9uKCdwaW5nIHBtMiBkYWVtb24gLSBpZiBub3QgdXAgaXQgd2lsbCBsYXVuY2ggaXQnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgICAgICBwbTIucGluZygpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgndXBkYXRlUE0yJylcbiAgICAuZGVzY3JpcHRpb24oJ3VwZGF0ZSBpbi1tZW1vcnkgUE0yIHdpdGggbG9jYWwgUE0yJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG0yLnVwZGF0ZSgpO1xuICAgIH0pO1xuY29tbWFuZGVyLmNvbW1hbmQoJ3VwZGF0ZScpXG4gICAgLmRlc2NyaXB0aW9uKCcoYWxpYXMpIHVwZGF0ZSBpbi1tZW1vcnkgUE0yIHdpdGggbG9jYWwgUE0yJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG0yLnVwZGF0ZSgpO1xuICAgIH0pO1xuXG4vKipcbiAqIE1vZHVsZSBzcGVjaWZpY3NcbiAqL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2luc3RhbGwgPG1vZHVsZXxnaXQ6Ly8gdXJsPicpXG4gICAgLmFsaWFzKCdtb2R1bGU6aW5zdGFsbCcpXG4gICAgLm9wdGlvbignLS10YXJiYWxsJywgJ2lzIGxvY2FsIHRhcmJhbGwnKVxuICAgIC5vcHRpb24oJy0taW5zdGFsbCcsICdydW4geWFybiBpbnN0YWxsIGJlZm9yZSBzdGFydGluZyBtb2R1bGUnKVxuICAgIC5vcHRpb24oJy0tZG9ja2VyJywgJ2lzIGRvY2tlciBjb250YWluZXInKVxuICAgIC5vcHRpb24oJy0tdjEnLCAnaW5zdGFsbCBtb2R1bGUgaW4gdjEgbWFubmVyIChkbyBub3QgdXNlIGl0KScpXG4gICAgLm9wdGlvbignLS1zYWZlIFt0aW1lXScsICdrZWVwIG1vZHVsZSBiYWNrdXAsIGlmIG5ldyBtb2R1bGUgZmFpbCA9IHJlc3RvcmUgd2l0aCBwcmV2aW91cycpXG4gICAgLmRlc2NyaXB0aW9uKCdpbnN0YWxsIG9yIHVwZGF0ZSBhIG1vZHVsZSBhbmQgcnVuIGl0IGZvcmV2ZXInKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKHBsdWdpbl9uYW1lLCBvcHRzKSB7XG4gICAgICAgIHJlcXVpcmUoJ3V0aWwnKS5fZXh0ZW5kKGNvbW1hbmRlciwgb3B0cyk7XG4gICAgICAgIHBtMi5pbnN0YWxsKHBsdWdpbl9uYW1lLCBjb21tYW5kZXIpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnbW9kdWxlOnVwZGF0ZSA8bW9kdWxlfGdpdDovLyB1cmw+JylcbiAgICAuZGVzY3JpcHRpb24oJ3VwZGF0ZSBhIG1vZHVsZSBhbmQgcnVuIGl0IGZvcmV2ZXInKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKHBsdWdpbl9uYW1lKSB7XG4gICAgICAgIHBtMi5pbnN0YWxsKHBsdWdpbl9uYW1lKTtcbiAgICB9KTtcblxuXG5jb21tYW5kZXIuY29tbWFuZCgnbW9kdWxlOmdlbmVyYXRlIFthcHBfbmFtZV0nKVxuICAgIC5kZXNjcmlwdGlvbignR2VuZXJhdGUgYSBzYW1wbGUgbW9kdWxlIGluIGN1cnJlbnQgZm9sZGVyJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChhcHBfbmFtZSkge1xuICAgICAgICBwbTIuZ2VuZXJhdGVNb2R1bGVTYW1wbGUoYXBwX25hbWUpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgndW5pbnN0YWxsIDxtb2R1bGU+JylcbiAgICAuYWxpYXMoJ21vZHVsZTp1bmluc3RhbGwnKVxuICAgIC5kZXNjcmlwdGlvbignc3RvcCBhbmQgdW5pbnN0YWxsIGEgbW9kdWxlJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChwbHVnaW5fbmFtZSkge1xuICAgICAgICBwbTIudW5pbnN0YWxsKHBsdWdpbl9uYW1lKTtcbiAgICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3BhY2thZ2UgW3RhcmdldF0nKVxuICAgIC5kZXNjcmlwdGlvbignQ2hlY2sgJiBQYWNrYWdlIFRBUiB0eXBlIG1vZHVsZScpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIHBtMi5wYWNrYWdlKHRhcmdldCk7XG4gICAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdwdWJsaXNoIFtmb2xkZXJdJylcbiAgICAub3B0aW9uKCctLW5wbScsICdwdWJsaXNoIG9uIG5wbScpXG4gICAgLmFsaWFzKCdtb2R1bGU6cHVibGlzaCcpXG4gICAgLmRlc2NyaXB0aW9uKCdQdWJsaXNoIHRoZSBtb2R1bGUgeW91IGFyZSBjdXJyZW50bHkgb24nKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKGZvbGRlciwgb3B0cykge1xuICAgICAgICBwbTIucHVibGlzaChmb2xkZXIsIG9wdHMpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnc2V0IFtrZXldIFt2YWx1ZV0nKVxuICAgIC5kZXNjcmlwdGlvbignc2V0cyB0aGUgc3BlY2lmaWVkIGNvbmZpZyA8a2V5PiA8dmFsdWU+JylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgIHBtMi5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdtdWx0aXNldCA8dmFsdWU+JylcbiAgICAuZGVzY3JpcHRpb24oJ211bHRpc2V0IGVnIFwia2V5MSB2YWwxIGtleTIgdmFsMicpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHBtMi5tdWx0aXNldChzdHIpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZ2V0IFtrZXldJylcbiAgICAuZGVzY3JpcHRpb24oJ2dldCB2YWx1ZSBmb3IgPGtleT4nKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBwbTIuZ2V0KGtleSk7XG4gICAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdjb25mIFtrZXldIFt2YWx1ZV0nKVxuICAgIC5kZXNjcmlwdGlvbignZ2V0IC8gc2V0IG1vZHVsZSBjb25maWcgdmFsdWVzJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgIHBtMi5nZXQoKVxuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnY29uZmlnIDxrZXk+IFt2YWx1ZV0nKVxuICAgIC5kZXNjcmlwdGlvbignZ2V0IC8gc2V0IG1vZHVsZSBjb25maWcgdmFsdWVzJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgIHBtMi5jb25mKGtleSwgdmFsdWUpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgndW5zZXQgPGtleT4nKVxuICAgIC5kZXNjcmlwdGlvbignY2xlYXJzIHRoZSBzcGVjaWZpZWQgY29uZmlnIDxrZXk+JylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcG0yLnVuc2V0KGtleSk7XG4gICAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdyZXBvcnQnKVxuICAgIC5kZXNjcmlwdGlvbignZ2l2ZSBhIGZ1bGwgcG0yIHJlcG9ydCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL1VuaXRlY2gvcG0yL2lzc3VlcycpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHBtMi5yZXBvcnQoKTtcbiAgICB9KTtcblxuLy9cbi8vIFBNMiBJL09cbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnbGluayBbc2VjcmV0XSBbcHVibGljXSBbbmFtZV0nKVxuICAgIC5vcHRpb24oJy0taW5mby1ub2RlIFt1cmxdJywgJ3NldCB1cmwgaW5mbyBub2RlJylcbiAgICAub3B0aW9uKCctLXdzJywgJ3dlYnNvY2tldCBtb2RlJylcbiAgICAub3B0aW9uKCctLWF4b24nLCAnYXhvbiBtb2RlJylcbiAgICAuZGVzY3JpcHRpb24oJ2xpbmsgd2l0aCB0aGUgcG0yIG1vbml0b3JpbmcgZGFzaGJvYXJkJylcbiAgICAuYWN0aW9uKHBtMi5saW5rTWFuYWdlbWVudC5iaW5kKHBtMikpO1xuXG5jb21tYW5kZXIuY29tbWFuZCgndW5saW5rJylcbiAgICAuZGVzY3JpcHRpb24oJ3VubGluayB3aXRoIHRoZSBwbTIgbW9uaXRvcmluZyBkYXNoYm9hcmQnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgICAgICBwbTIudW5saW5rKCk7XG4gICAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdtb25pdG9yIFtuYW1lXScpXG4gICAgLmRlc2NyaXB0aW9uKCdtb25pdG9yIHRhcmdldCBwcm9jZXNzJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGlmIChuYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBwbHVzSGFuZGxlcigpXG4gICAgICAgIH1cbiAgICAgICAgcG0yLm1vbml0b3JTdGF0ZSgnbW9uaXRvcicsIG5hbWUpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgndW5tb25pdG9yIFtuYW1lXScpXG4gICAgLmRlc2NyaXB0aW9uKCd1bm1vbml0b3IgdGFyZ2V0IHByb2Nlc3MnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcG0yLm1vbml0b3JTdGF0ZSgndW5tb25pdG9yJywgbmFtZSk7XG4gICAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdvcGVuJylcbiAgICAuZGVzY3JpcHRpb24oJ29wZW4gdGhlIHBtMiBtb25pdG9yaW5nIGRhc2hib2FyZCcpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBwbTIub3BlbkRhc2hib2FyZCgpO1xuICAgIH0pO1xuXG5mdW5jdGlvbiBwbHVzSGFuZGxlcihjb21tYW5kPywgb3B0cz8pIHtcbiAgICBpZiAob3B0cyAmJiBvcHRzLmluZm9Ob2RlKSB7XG4gICAgICAgIHByb2Nlc3MuZW52LktFWU1FVFJJQ1NfTk9ERSA9IG9wdHMuaW5mb05vZGVcbiAgICB9XG5cbiAgICByZXR1cm4gUE0yaW9IYW5kbGVyLmxhdW5jaChjb21tYW5kLCBvcHRzKVxufVxuXG5jb21tYW5kZXIuY29tbWFuZCgncGx1cyBbY29tbWFuZF0gW29wdGlvbl0nKVxuICAgIC5hbGlhcygncmVnaXN0ZXInKVxuICAgIC5vcHRpb24oJy0taW5mby1ub2RlIFt1cmxdJywgJ3NldCB1cmwgaW5mbyBub2RlIGZvciBvbi1wcmVtaXNlIHBtMiBwbHVzJylcbiAgICAub3B0aW9uKCctZCAtLWRpc2NyZXRlJywgJ3NpbGVudCBtb2RlJylcbiAgICAub3B0aW9uKCctYSAtLWluc3RhbGwtYWxsJywgJ2luc3RhbGwgYWxsIG1vZHVsZXMgKGZvcmNlIHllcyknKVxuICAgIC5kZXNjcmlwdGlvbignZW5hYmxlIHBtMiBwbHVzJylcbiAgICAuYWN0aW9uKHBsdXNIYW5kbGVyKTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2xvZ2luJylcbiAgICAuZGVzY3JpcHRpb24oJ0xvZ2luIHRvIHBtMiBwbHVzJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHBsdXNIYW5kbGVyKCdsb2dpbicpXG4gICAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdsb2dvdXQnKVxuICAgIC5kZXNjcmlwdGlvbignTG9nb3V0IGZyb20gcG0yIHBsdXMnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcGx1c0hhbmRsZXIoJ2xvZ291dCcpXG4gICAgfSk7XG5cbi8vXG4vLyBTYXZlIHByb2Nlc3NlcyB0byBmaWxlXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2R1bXAnKVxuICAgIC5hbGlhcygnc2F2ZScpXG4gICAgLm9wdGlvbignLS1mb3JjZScsICdmb3JjZSBkZWxldGlvbiBvZiBkdW1wIGZpbGUsIGV2ZW4gaWYgZW1wdHknKVxuICAgIC5kZXNjcmlwdGlvbignZHVtcCBhbGwgcHJvY2Vzc2VzIGZvciByZXN1cnJlY3RpbmcgdGhlbSBsYXRlcicpXG4gICAgLmFjdGlvbihmYWlsT25Vbmtub3duKGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgICAgIHBtMi5kdW1wKGNvbW1hbmRlci5mb3JjZSlcbiAgICB9KSk7XG5cbi8vXG4vLyBEZWxldGUgZHVtcCBmaWxlXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2NsZWFyZHVtcCcpXG4gICAgLmRlc2NyaXB0aW9uKCdDcmVhdGUgZW1wdHkgZHVtcCBmaWxlJylcbiAgICAuYWN0aW9uKGZhaWxPblVua25vd24oZnVuY3Rpb24gKCkge1xuICAgICAgICBwbTIuY2xlYXJEdW1wKCk7XG4gICAgfSkpO1xuXG4vL1xuLy8gU2F2ZSBwcm9jZXNzZXMgdG8gZmlsZVxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdzZW5kIDxwbV9pZD4gPGxpbmU+JylcbiAgICAuZGVzY3JpcHRpb24oJ3NlbmQgc3RkaW4gdG8gPHBtX2lkPicpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAocG1faWQsIGxpbmUpIHtcbiAgICAgICAgcG0yLnNlbmRMaW5lVG9TdGRpbihwbV9pZCwgbGluZSk7XG4gICAgfSk7XG5cbi8vXG4vLyBBdHRhY2ggdG8gc3RkaW4vc3Rkb3V0XG4vLyBOb3QgVFRZIHJlYWR5XG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2F0dGFjaCA8cG1faWQ+IFtjb21tYW5kIHNlcGFyYXRvcl0nKVxuICAgIC5kZXNjcmlwdGlvbignYXR0YWNoIHN0ZGluL3N0ZG91dCB0byBhcHBsaWNhdGlvbiBpZGVudGlmaWVkIGJ5IDxwbV9pZD4nKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKHBtX2lkLCBzZXBhcmF0b3IpIHtcbiAgICAgICAgcG0yLmF0dGFjaChwbV9pZCwgc2VwYXJhdG9yKTtcbiAgICB9KTtcblxuLy9cbi8vIFJlc3VycmVjdFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdyZXN1cnJlY3QnKVxuICAgIC5kZXNjcmlwdGlvbigncmVzdXJyZWN0IHByZXZpb3VzbHkgZHVtcGVkIHByb2Nlc3NlcycpXG4gICAgLmFjdGlvbihmYWlsT25Vbmtub3duKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS5sb2coY3N0LlBSRUZJWF9NU0cgKyAnUmVzdXJyZWN0aW5nJyk7XG4gICAgICAgIHBtMi5yZXN1cnJlY3QoKTtcbiAgICB9KSk7XG5cbi8vXG4vLyBTZXQgcG0yIHRvIHN0YXJ0dXBcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgndW5zdGFydHVwIFtwbGF0Zm9ybV0nKVxuICAgIC5kZXNjcmlwdGlvbignZGlzYWJsZSB0aGUgcG0yIHN0YXJ0dXAgaG9vaycpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAocGxhdGZvcm0pIHtcbiAgICAgICAgcG0yLnVuaW5zdGFsbFN0YXJ0dXAocGxhdGZvcm0sIGNvbW1hbmRlcik7XG4gICAgfSk7XG5cbi8vXG4vLyBTZXQgcG0yIHRvIHN0YXJ0dXBcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnc3RhcnR1cCBbcGxhdGZvcm1dJylcbiAgICAuZGVzY3JpcHRpb24oJ2VuYWJsZSB0aGUgcG0yIHN0YXJ0dXAgaG9vaycpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAocGxhdGZvcm0pIHtcbiAgICAgICAgcG0yLnN0YXJ0dXAocGxhdGZvcm0sIGNvbW1hbmRlcik7XG4gICAgfSk7XG5cbi8vXG4vLyBMb2dyb3RhdGVcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnbG9ncm90YXRlJylcbiAgICAuZGVzY3JpcHRpb24oJ2NvcHkgZGVmYXVsdCBsb2dyb3RhdGUgY29uZmlndXJhdGlvbicpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAoY21kKSB7XG4gICAgICAgIHBtMi5sb2dyb3RhdGUoY29tbWFuZGVyKTtcbiAgICB9KTtcblxuLy9cbi8vIFNhbXBsZSBnZW5lcmF0ZVxuLy9cblxuY29tbWFuZGVyLmNvbW1hbmQoJ2Vjb3N5c3RlbSBbbW9kZV0nKVxuICAgIC5hbGlhcygnaW5pdCcpXG4gICAgLmRlc2NyaXB0aW9uKCdnZW5lcmF0ZSBhIHByb2Nlc3MgY29uZiBmaWxlLiAobW9kZSA9IG51bGwgb3Igc2ltcGxlKScpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAobW9kZSkge1xuICAgICAgICBwbTIuZ2VuZXJhdGVTYW1wbGUobW9kZSk7XG4gICAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdyZXNldCA8bmFtZXxpZHxhbGw+JylcbiAgICAuZGVzY3JpcHRpb24oJ3Jlc2V0IGNvdW50ZXJzIGZvciBwcm9jZXNzJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChwcm9jX2lkKSB7XG4gICAgICAgIHBtMi5yZXNldChwcm9jX2lkKTtcbiAgICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2Rlc2NyaWJlIDxuYW1lfGlkPicpXG4gICAgLmRlc2NyaXB0aW9uKCdkZXNjcmliZSBhbGwgcGFyYW1ldGVycyBvZiBhIHByb2Nlc3MnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKHByb2NfaWQpIHtcbiAgICAgICAgcG0yLmRlc2NyaWJlKHByb2NfaWQpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZGVzYyA8bmFtZXxpZD4nKVxuICAgIC5kZXNjcmlwdGlvbignKGFsaWFzKSBkZXNjcmliZSBhbGwgcGFyYW1ldGVycyBvZiBhIHByb2Nlc3MnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKHByb2NfaWQpIHtcbiAgICAgICAgcG0yLmRlc2NyaWJlKHByb2NfaWQpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnaW5mbyA8bmFtZXxpZD4nKVxuICAgIC5kZXNjcmlwdGlvbignKGFsaWFzKSBkZXNjcmliZSBhbGwgcGFyYW1ldGVycyBvZiBhIHByb2Nlc3MnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKHByb2NfaWQpIHtcbiAgICAgICAgcG0yLmRlc2NyaWJlKHByb2NfaWQpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnc2hvdyA8bmFtZXxpZD4nKVxuICAgIC5kZXNjcmlwdGlvbignKGFsaWFzKSBkZXNjcmliZSBhbGwgcGFyYW1ldGVycyBvZiBhIHByb2Nlc3MnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKHByb2NfaWQpIHtcbiAgICAgICAgcG0yLmRlc2NyaWJlKHByb2NfaWQpO1xuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZW52IDxpZD4nKVxuICAgIC5kZXNjcmlwdGlvbignbGlzdCBhbGwgZW52aXJvbm1lbnQgdmFyaWFibGVzIG9mIGEgcHJvY2VzcyBpZCcpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAocHJvY19pZCkge1xuICAgICAgICBwbTIuZW52KHByb2NfaWQpO1xuICAgIH0pO1xuXG4vL1xuLy8gTGlzdCBjb21tYW5kXG4vL1xuY29tbWFuZGVyXG4gICAgLmNvbW1hbmQoJ2xpc3QnKVxuICAgIC5hbGlhcygnbHMnKVxuICAgIC5kZXNjcmlwdGlvbignbGlzdCBhbGwgcHJvY2Vzc2VzJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG0yLmxpc3QoY29tbWFuZGVyKVxuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnbCcpXG4gICAgLmRlc2NyaXB0aW9uKCcoYWxpYXMpIGxpc3QgYWxsIHByb2Nlc3NlcycpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBtMi5saXN0KClcbiAgICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3BzJylcbiAgICAuZGVzY3JpcHRpb24oJyhhbGlhcykgbGlzdCBhbGwgcHJvY2Vzc2VzJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG0yLmxpc3QoKVxuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnc3RhdHVzJylcbiAgICAuZGVzY3JpcHRpb24oJyhhbGlhcykgbGlzdCBhbGwgcHJvY2Vzc2VzJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG0yLmxpc3QoKVxuICAgIH0pO1xuXG5cbi8vIExpc3QgaW4gcmF3IGpzb25cbmNvbW1hbmRlci5jb21tYW5kKCdqbGlzdCcpXG4gICAgLmRlc2NyaXB0aW9uKCdsaXN0IGFsbCBwcm9jZXNzZXMgaW4gSlNPTiBmb3JtYXQnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgICAgICBwbTIuamxpc3QoKVxuICAgIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnc3lzbW9uaXQnKVxuICAgIC5kZXNjcmlwdGlvbignc3RhcnQgc3lzdGVtIG1vbml0b3JpbmcgZGFlbW9uJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG0yLmxhdW5jaFN5c01vbml0b3JpbmcoKVxuICAgIH0pXG5cbmNvbW1hbmRlci5jb21tYW5kKCdzbGlzdCcpXG4gICAgLmFsaWFzKCdzeXNpbmZvcycpXG4gICAgLm9wdGlvbignLXQgLS10cmVlJywgJ3Nob3cgYXMgdHJlZScpXG4gICAgLmRlc2NyaXB0aW9uKCdsaXN0IHN5c3RlbSBpbmZvcyBpbiBKU09OJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgICAgIHBtMi5zbGlzdChvcHRzLnRyZWUpXG4gICAgfSlcblxuLy8gTGlzdCBpbiBwcmV0dGlmaWVkIEpzb25cbmNvbW1hbmRlci5jb21tYW5kKCdwcmV0dHlsaXN0JylcbiAgICAuZGVzY3JpcHRpb24oJ3ByaW50IGpzb24gaW4gYSBwcmV0dGlmaWVkIEpTT04nKVxuICAgIC5hY3Rpb24oZmFpbE9uVW5rbm93bihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBtMi5qbGlzdCh0cnVlKTtcbiAgICB9KSk7XG5cbi8vXG4vLyBEYXNoYm9hcmQgY29tbWFuZFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdtb25pdCcpXG4gICAgLmRlc2NyaXB0aW9uKCdsYXVuY2ggdGVybWNhcHMgbW9uaXRvcmluZycpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBtMi5kYXNoYm9hcmQoKTtcbiAgICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2ltb25pdCcpXG4gICAgLmRlc2NyaXB0aW9uKCdsYXVuY2ggbGVnYWN5IHRlcm1jYXBzIG1vbml0b3JpbmcnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgICAgICBwbTIubW9uaXQoKTtcbiAgICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2Rhc2hib2FyZCcpXG4gICAgLmFsaWFzKCdkYXNoJylcbiAgICAuZGVzY3JpcHRpb24oJ2xhdW5jaCBkYXNoYm9hcmQgd2l0aCBtb25pdG9yaW5nIGFuZCBsb2dzJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG0yLmRhc2hib2FyZCgpO1xuICAgIH0pO1xuXG5cbi8vXG4vLyBGbHVzaGluZyBjb21tYW5kXG4vL1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZmx1c2ggW2FwaV0nKVxuICAgIC5kZXNjcmlwdGlvbignZmx1c2ggbG9ncycpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAoYXBpKSB7XG4gICAgICAgIHBtMi5mbHVzaChhcGkpO1xuICAgIH0pO1xuXG4vKiBvbGQgdmVyc2lvblxuY29tbWFuZGVyLmNvbW1hbmQoJ2ZsdXNoJylcbiAgLmRlc2NyaXB0aW9uKCdmbHVzaCBsb2dzJylcbiAgLmFjdGlvbihmYWlsT25Vbmtub3duKGZ1bmN0aW9uKCkge1xuICAgIHBtMi5mbHVzaCgpO1xuICB9KSk7XG4qL1xuLy9cbi8vIFJlbG9hZCBhbGwgbG9nc1xuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdyZWxvYWRMb2dzJylcbiAgICAuZGVzY3JpcHRpb24oJ3JlbG9hZCBhbGwgbG9ncycpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBtMi5yZWxvYWRMb2dzKCk7XG4gICAgfSk7XG5cbi8vXG4vLyBMb2cgc3RyZWFtaW5nXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2xvZ3MgW2lkfG5hbWV8bmFtZXNwYWNlXScpXG4gICAgLm9wdGlvbignLS1qc29uJywgJ2pzb24gbG9nIG91dHB1dCcpXG4gICAgLm9wdGlvbignLS1mb3JtYXQnLCAnZm9ybWF0ZWQgbG9nIG91dHB1dCcpXG4gICAgLm9wdGlvbignLS1yYXcnLCAncmF3IG91dHB1dCcpXG4gICAgLm9wdGlvbignLS1lcnInLCAnb25seSBzaG93cyBlcnJvciBvdXRwdXQnKVxuICAgIC5vcHRpb24oJy0tb3V0JywgJ29ubHkgc2hvd3Mgc3RhbmRhcmQgb3V0cHV0JylcbiAgICAub3B0aW9uKCctLWxpbmVzIDxuPicsICdvdXRwdXQgdGhlIGxhc3QgTiBsaW5lcywgaW5zdGVhZCBvZiB0aGUgbGFzdCAxNSBieSBkZWZhdWx0JylcbiAgICAub3B0aW9uKCctLXRpbWVzdGFtcCBbZm9ybWF0XScsICdhZGQgdGltZXN0YW1wcyAoZGVmYXVsdCBmb3JtYXQgWVlZWS1NTS1ERC1ISDptbTpzcyknKVxuICAgIC5vcHRpb24oJy0tbm9zdHJlYW0nLCAncHJpbnQgbG9ncyB3aXRob3V0IGxhdWNoaW5nIHRoZSBsb2cgc3RyZWFtJylcbiAgICAub3B0aW9uKCctLWhpZ2hsaWdodCBbdmFsdWVdJywgJ2hpZ2hsaWdodHMgdGhlIGdpdmVuIHZhbHVlJylcbiAgICAuZGVzY3JpcHRpb24oJ3N0cmVhbSBsb2dzIGZpbGUuIERlZmF1bHQgc3RyZWFtIGFsbCBsb2dzJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChpZCwgY21kKSB7XG4gICAgICAgIGlmICghaWQpIGlkID0gJ2FsbCc7XG5cbiAgICAgICAgdmFyIGxpbmUgPSAxNTtcbiAgICAgICAgdmFyIHJhdyA9IGZhbHNlO1xuICAgICAgICB2YXIgZXhjbHVzaXZlID0gXCJcIjtcbiAgICAgICAgdmFyIHRpbWVzdGFtcCA9IGZhbHNlO1xuICAgICAgICB2YXIgaGlnaGxpZ2h0ID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKCFpc05hTihwYXJzZUludChjbWQubGluZXMpKSkge1xuICAgICAgICAgICAgbGluZSA9IHBhcnNlSW50KGNtZC5saW5lcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY21kLnBhcmVudC5yYXdBcmdzLmluZGV4T2YoJy0tcmF3JykgIT09IC0xKVxuICAgICAgICAgICAgcmF3ID0gdHJ1ZTtcblxuICAgICAgICBpZiAoY21kLnRpbWVzdGFtcClcbiAgICAgICAgICAgIHRpbWVzdGFtcCA9IHR5cGVvZiBjbWQudGltZXN0YW1wID09PSAnc3RyaW5nJyA/IGNtZC50aW1lc3RhbXAgOiAnWVlZWS1NTS1ERC1ISDptbTpzcyc7XG5cbiAgICAgICAgaWYgKGNtZC5oaWdobGlnaHQpXG4gICAgICAgICAgICBoaWdobGlnaHQgPSB0eXBlb2YgY21kLmhpZ2hsaWdodCA9PT0gJ3N0cmluZycgPyBjbWQuaGlnaGxpZ2h0IDogZmFsc2U7XG5cbiAgICAgICAgaWYgKGNtZC5vdXQgPT09IHRydWUpXG4gICAgICAgICAgICBleGNsdXNpdmUgPSAnb3V0JztcblxuICAgICAgICBpZiAoY21kLmVyciA9PT0gdHJ1ZSlcbiAgICAgICAgICAgIGV4Y2x1c2l2ZSA9ICdlcnInO1xuXG4gICAgICAgIGlmIChjbWQubm9zdHJlYW0gPT09IHRydWUpXG4gICAgICAgICAgICBwbTIucHJpbnRMb2dzKGlkLCBsaW5lLCByYXcsIHRpbWVzdGFtcCwgZXhjbHVzaXZlKTtcbiAgICAgICAgZWxzZSBpZiAoY21kLmpzb24gPT09IHRydWUpXG4gICAgICAgICAgICBMb2dzLmpzb25TdHJlYW0ocG0yLkNsaWVudCwgaWQpO1xuICAgICAgICBlbHNlIGlmIChjbWQuZm9ybWF0ID09PSB0cnVlKVxuICAgICAgICAgICAgTG9ncy5mb3JtYXRTdHJlYW0ocG0yLkNsaWVudCwgaWQsIGZhbHNlLCAnWVlZWS1NTS1ERC1ISDptbTpzc1paJywgZXhjbHVzaXZlLCBoaWdobGlnaHQpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwbTIuc3RyZWFtTG9ncyhpZCwgbGluZSwgcmF3LCB0aW1lc3RhbXAsIGV4Y2x1c2l2ZSwgaGlnaGxpZ2h0KTtcbiAgICB9KTtcblxuXG4vL1xuLy8gS2lsbFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdraWxsJylcbiAgICAuZGVzY3JpcHRpb24oJ2tpbGwgZGFlbW9uJylcbiAgICAuYWN0aW9uKGZhaWxPblVua25vd24oZnVuY3Rpb24gKGFyZykge1xuICAgICAgICBwbTIua2lsbERhZW1vbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgIH0pO1xuICAgIH0pKTtcblxuLy9cbi8vIFVwZGF0ZSByZXBvc2l0b3J5IGZvciBhIGdpdmVuIGFwcFxuLy9cblxuY29tbWFuZGVyLmNvbW1hbmQoJ3B1bGwgPG5hbWU+IFtjb21taXRfaWRdJylcbiAgICAuZGVzY3JpcHRpb24oJ3VwZGF0ZXMgcmVwb3NpdG9yeSBmb3IgYSBnaXZlbiBhcHAnKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24gKHBtMl9uYW1lLCBjb21taXRfaWQpIHtcblxuICAgICAgICBpZiAoY29tbWl0X2lkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHBtMi5fcHVsbENvbW1pdElkKHtcbiAgICAgICAgICAgICAgICBwbTJfbmFtZTogcG0yX25hbWUsXG4gICAgICAgICAgICAgICAgY29tbWl0X2lkOiBjb21taXRfaWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBtMi5wdWxsQW5kUmVzdGFydChwbTJfbmFtZSk7XG4gICAgfSk7XG5cbi8vXG4vLyBVcGRhdGUgcmVwb3NpdG9yeSB0byB0aGUgbmV4dCBjb21taXQgZm9yIGEgZ2l2ZW4gYXBwXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2ZvcndhcmQgPG5hbWU+JylcbiAgICAuZGVzY3JpcHRpb24oJ3VwZGF0ZXMgcmVwb3NpdG9yeSB0byB0aGUgbmV4dCBjb21taXQgZm9yIGEgZ2l2ZW4gYXBwJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChwbTJfbmFtZSkge1xuICAgICAgICBwbTIuZm9yd2FyZChwbTJfbmFtZSk7XG4gICAgfSk7XG5cbi8vXG4vLyBEb3duZ3JhZGUgcmVwb3NpdG9yeSB0byB0aGUgcHJldmlvdXMgY29tbWl0IGZvciBhIGdpdmVuIGFwcFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdiYWNrd2FyZCA8bmFtZT4nKVxuICAgIC5kZXNjcmlwdGlvbignZG93bmdyYWRlcyByZXBvc2l0b3J5IHRvIHRoZSBwcmV2aW91cyBjb21taXQgZm9yIGEgZ2l2ZW4gYXBwJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChwbTJfbmFtZSkge1xuICAgICAgICBwbTIuYmFja3dhcmQocG0yX25hbWUpO1xuICAgIH0pO1xuXG4vL1xuLy8gUGVyZm9ybSBhIGRlZXAgdXBkYXRlIG9mIFBNMlxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdkZWVwVXBkYXRlJylcbiAgICAuZGVzY3JpcHRpb24oJ3BlcmZvcm1zIGEgZGVlcCB1cGRhdGUgb2YgUE0yJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG0yLmRlZXBVcGRhdGUoKTtcbiAgICB9KTtcblxuLy9cbi8vIExhdW5jaCBhIGh0dHAgc2VydmVyIHRoYXQgZXhwb3NlIGEgZ2l2ZW4gcGF0aCBvbiBnaXZlbiBwb3J0XG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ3NlcnZlIFtwYXRoXSBbcG9ydF0nKVxuICAgIC5hbGlhcygnZXhwb3NlJylcbiAgICAub3B0aW9uKCctLXBvcnQgW3BvcnRdJywgJ3NwZWNpZnkgcG9ydCB0byBsaXN0ZW4gdG8nKVxuICAgIC5vcHRpb24oJy0tc3BhJywgJ2Fsd2F5cyBzZXJ2aW5nIGluZGV4Lmh0bWwgb24gaW5leGlzdGFudCBzdWIgcGF0aCcpXG4gICAgLm9wdGlvbignLS1iYXNpYy1hdXRoLXVzZXJuYW1lIFt1c2VybmFtZV0nLCAnc2V0IGJhc2ljIGF1dGggdXNlcm5hbWUnKVxuICAgIC5vcHRpb24oJy0tYmFzaWMtYXV0aC1wYXNzd29yZCBbcGFzc3dvcmRdJywgJ3NldCBiYXNpYyBhdXRoIHBhc3N3b3JkJylcbiAgICAub3B0aW9uKCctLW1vbml0b3IgW2Zyb250ZW5kLWFwcF0nLCAnZnJvbnRlbmQgYXBwIG1vbml0b3JpbmcgKGF1dG8gaW50ZWdyYXRlIHNuaXBwZXQgb24gaHRtbCBmaWxlcyknKVxuICAgIC5kZXNjcmlwdGlvbignc2VydmUgYSBkaXJlY3Rvcnkgb3ZlciBodHRwIHZpYSBwb3J0JylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uIChwYXRoLCBwb3J0LCBjbWQpIHtcbiAgICAgICAgcG0yLnNlcnZlKHBhdGgsIHBvcnQgfHwgY21kLnBvcnQsIGNtZCwgY29tbWFuZGVyKTtcbiAgICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2F1dG9pbnN0YWxsJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG0yLmF1dG9pbnN0YWxsKClcbiAgICB9KVxuXG5jb21tYW5kZXIuY29tbWFuZCgnZXhhbXBsZXMnKVxuICAgIC5kZXNjcmlwdGlvbignZGlzcGxheSBwbTIgdXNhZ2UgZXhhbXBsZXMnKVxuICAgIC5hY3Rpb24oKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhjc3QuUFJFRklYX01TRyArIGNoYWxrLmdyZXkoJ3BtMiB1c2FnZSBleGFtcGxlczpcXG4nKSk7XG4gICAgICAgIGRpc3BsYXlFeGFtcGxlcygpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgfSlcblxuLy9cbi8vIENhdGNoIGFsbFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCcqJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS5sb2coY3N0LlBSRUZJWF9NU0dfRVJSICsgY2hhbGsuYm9sZCgnQ29tbWFuZCBub3QgZm91bmRcXG4nKSk7XG4gICAgICAgIGRpc3BsYXlVc2FnZSgpO1xuICAgICAgICAvLyBDaGVjayBpZiBpdCBkb2VzIG5vdCBmb3JnZXQgdG8gY2xvc2UgZmRzIGZyb20gUlBDXG4gICAgICAgIHByb2Nlc3MuZXhpdChjc3QuRVJST1JfRVhJVCk7XG4gICAgfSk7XG5cbi8vXG4vLyBEaXNwbGF5IGhlbHAgaWYgMCBhcmd1bWVudHMgcGFzc2VkIHRvIHBtMlxuLy9cbmlmIChwcm9jZXNzLmFyZ3YubGVuZ3RoID09IDIpIHtcbiAgICBjb21tYW5kZXIucGFyc2UocHJvY2Vzcy5hcmd2KTtcbiAgICBkaXNwbGF5VXNhZ2UoKTtcbiAgICAvLyBDaGVjayBpZiBpdCBkb2VzIG5vdCBmb3JnZXQgdG8gY2xvc2UgZmRzIGZyb20gUlBDXG4gICAgcHJvY2Vzcy5leGl0KGNzdC5FUlJPUl9FWElUKTtcbn1cbiJdfQ==