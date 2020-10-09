'use strict';

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9iaW5hcmllcy9DTEkudHMiXSwibmFtZXMiOlsicHJvY2VzcyIsImVudiIsIlBNMl9VU0FHRSIsImRlYnVnIiwiQ29tbW9uIiwiZGV0ZXJtaW5lU2lsZW50Q0xJIiwicHJpbnRWZXJzaW9uIiwicG0yIiwiUE0yIiwiUE0yaW9IYW5kbGVyIiwidXNlUE0yQ2xpZW50IiwiY29tbWFuZGVyIiwidmVyc2lvbiIsInBrZyIsIm9wdGlvbiIsInYiLCJtIiwicHVzaCIsInVzYWdlIiwiZGlzcGxheVVzYWdlIiwiY29uc29sZSIsImxvZyIsImRpc3BsYXlFeGFtcGxlcyIsImNoYWxrIiwiY3lhbiIsImJlZ2luQ29tbWFuZFByb2Nlc3NpbmciLCJnZXRWZXJzaW9uIiwiZXJyIiwicmVtb3RlX3ZlcnNpb24iLCJyZWQiLCJib2xkIiwiYmx1ZSIsInBhcnNlIiwiYXJndiIsImNoZWNrQ29tcGxldGlvbiIsInRhYnRhYiIsImNvbXBsZXRlIiwiZGF0YSIsInRlc3QiLCJsYXN0Iiwib3B0aW9ucyIsIm1hcCIsImNtZFByb2Nlc3MiLCJpbmRleE9mIiwicHJldiIsImxpc3QiLCJlbCIsIm5hbWUiLCJkaXNjb25uZWN0IiwiY29tbWFuZHMiLCJfbmFtZSIsIl9hcnIiLCJzbGljZSIsInBtMk5vRGFlYW1vbiIsImRhZW1vbl9tb2RlIiwiY29ubmVjdCIsInNldFRpbWVvdXQiLCJ0aGlyZCIsImZhaWxPblVua25vd24iLCJmbiIsImFyZyIsImFyZ3VtZW50cyIsImxlbmd0aCIsImNzdCIsIlBSRUZJWF9NU0ciLCJvdXRwdXRIZWxwIiwiZXhpdCIsIkVSUk9SX0VYSVQiLCJhcHBseSIsInBhdGNoQ29tbWFuZGVyQXJnIiwiY21kIiwiYXJnc0luZGV4IiwicmF3QXJncyIsIm9wdGFyZ3MiLCJjb21tYW5kIiwiZGVzY3JpcHRpb24iLCJhY3Rpb24iLCJvcHRzIiwiY29udGFpbmVyIiwiZGlzdCIsImRvY2tlck1vZGUiLCJzdGRpbiIsInJlc3VtZSIsInNldEVuY29kaW5nIiwib24iLCJwYXVzZSIsIl9zdGFydEpzb24iLCJBUFBfQ09ORl9ERUZBVUxUX0ZJTEUiLCJhY2MiLCJzY3JpcHQiLCJuZXh0Iiwic3RhcnQiLCJhcHBzIiwiY29uY2F0IiwiZHQiLCJtZXNzYWdlIiwiaW5jbHVkZXMiLCJleGl0Q2xpIiwic3BlZWRMaXN0IiwicG1faWQiLCJhY3Rpb25fbmFtZSIsInBhcmFtcyIsInRyaWdnZXIiLCJkZXBsb3kiLCJmaWxlIiwiYXBwIiwiZ2V0UElEIiwiYm9pbGVycGxhdGUiLCJwYXJhbSIsInN0b3AiLCJyZXN0YXJ0IiwiYXBwX25hbWUiLCJudW1iZXIiLCJzY2FsZSIsInRpbWUiLCJwcm9maWxlIiwicG0yX2lkIiwicmVsb2FkIiwiZ2V0UHJvY2Vzc0lkQnlOYW1lIiwiaW5zcGVjdCIsImFsaWFzIiwic2lnbmFsIiwiaXNOYU4iLCJwYXJzZUludCIsInNlbmRTaWduYWxUb1Byb2Nlc3NOYW1lIiwic2VuZFNpZ25hbFRvUHJvY2Vzc0lkIiwicGluZyIsInVwZGF0ZSIsInBsdWdpbl9uYW1lIiwicmVxdWlyZSIsIl9leHRlbmQiLCJpbnN0YWxsIiwiZ2VuZXJhdGVNb2R1bGVTYW1wbGUiLCJ1bmluc3RhbGwiLCJ0YXJnZXQiLCJmb2xkZXIiLCJwdWJsaXNoIiwia2V5IiwidmFsdWUiLCJzZXQiLCJzdHIiLCJtdWx0aXNldCIsImdldCIsImNvbmYiLCJ1bnNldCIsInJlcG9ydCIsImxpbmtNYW5hZ2VtZW50IiwiYmluZCIsInVubGluayIsInVuZGVmaW5lZCIsInBsdXNIYW5kbGVyIiwibW9uaXRvclN0YXRlIiwib3BlbkRhc2hib2FyZCIsImluZm9Ob2RlIiwiS0VZTUVUUklDU19OT0RFIiwibGF1bmNoIiwiZHVtcCIsImZvcmNlIiwiY2xlYXJEdW1wIiwibGluZSIsInNlbmRMaW5lVG9TdGRpbiIsInNlcGFyYXRvciIsImF0dGFjaCIsInJlc3VycmVjdCIsInBsYXRmb3JtIiwidW5pbnN0YWxsU3RhcnR1cCIsInN0YXJ0dXAiLCJsb2dyb3RhdGUiLCJtb2RlIiwiZ2VuZXJhdGVTYW1wbGUiLCJwcm9jX2lkIiwicmVzZXQiLCJkZXNjcmliZSIsImpsaXN0IiwibGF1bmNoU3lzTW9uaXRvcmluZyIsInNsaXN0IiwidHJlZSIsImRhc2hib2FyZCIsIm1vbml0IiwiYXBpIiwiZmx1c2giLCJyZWxvYWRMb2dzIiwiaWQiLCJyYXciLCJleGNsdXNpdmUiLCJ0aW1lc3RhbXAiLCJoaWdobGlnaHQiLCJsaW5lcyIsInBhcmVudCIsIm91dCIsIm5vc3RyZWFtIiwicHJpbnRMb2dzIiwianNvbiIsIkxvZ3MiLCJqc29uU3RyZWFtIiwiQ2xpZW50IiwiZm9ybWF0IiwiZm9ybWF0U3RyZWFtIiwic3RyZWFtTG9ncyIsImtpbGxEYWVtb24iLCJTVUNDRVNTX0VYSVQiLCJwbTJfbmFtZSIsImNvbW1pdF9pZCIsIl9wdWxsQ29tbWl0SWQiLCJwdWxsQW5kUmVzdGFydCIsImZvcndhcmQiLCJiYWNrd2FyZCIsImRlZXBVcGRhdGUiLCJwYXRoIiwicG9ydCIsInNlcnZlIiwiYXV0b2luc3RhbGwiLCJncmV5IiwiUFJFRklYX01TR19FUlIiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7QUFJQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFkQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlDLFNBQVosR0FBd0IsS0FBeEI7QUFnQkEsSUFBTUMsS0FBSyxHQUFHLHVCQUFZLFNBQVosQ0FBZDs7QUFFQUMsbUJBQU9DLGtCQUFQOztBQUNBRCxtQkFBT0UsWUFBUDs7QUFFQSxJQUFJQyxHQUFRLEdBQUcsSUFBSUMsZUFBSixFQUFmOztBQUVBQyxrQkFBYUMsWUFBYixDQUEwQkgsR0FBMUI7O0FBRUFJLHNCQUFVQyxPQUFWLENBQWtCQyxvQkFBSUQsT0FBdEIsRUFDR0UsTUFESCxDQUNVLGNBRFYsRUFDMEIsbUJBRDFCLEVBRUdBLE1BRkgsQ0FFVSxhQUZWLEVBRXlCLG1CQUZ6QixFQUU4QyxLQUY5QyxFQUdHQSxNQUhILENBR1Us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QUFWLENBQWtCLGFBQWxCLEVBQ0dFLE1BREgsQ0FDVSxZQUFZO0FBQ2xCckUsRUFBQUEsR0FBRyxDQUFDNE0sV0FBSjtBQUNELENBSEg7O0FBS0F4TSxzQkFBVStELE9BQVYsQ0FBa0IsVUFBbEIsRUFDR0MsV0FESCxDQUNlLDRCQURmLEVBRUdDLE1BRkgsQ0FFVSxZQUFNO0FBQ1p4RCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTBDLHNCQUFJQyxVQUFKLEdBQWlCekMsa0JBQU02TCxJQUFOLENBQVcsdUJBQVgsQ0FBN0I7QUFDQTlMLEVBQUFBLGVBQWU7QUFDZnRCLEVBQUFBLE9BQU8sQ0FBQ2tFLElBQVIsQ0FBYUgsc0JBQUl5SSxZQUFqQjtBQUNELENBTkgsRSxDQVFBO0FBQ0E7QUFDQTs7O0FBQ0E3TCxzQkFBVStELE9BQVYsQ0FBa0IsR0FBbEIsRUFDR0UsTUFESCxDQUNVLFlBQVk7QUFDbEJ4RCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTBDLHNCQUFJc0osY0FBSixHQUFxQjlMLGtCQUFNTyxJQUFOLENBQVcscUJBQVgsQ0FBakM7QUFDQVgsRUFBQUEsWUFBWSxHQUZNLENBR2xCOztBQUNBbkIsRUFBQUEsT0FBTyxDQUFDa0UsSUFBUixDQUFhSCxzQkFBSUksVUFBakI7QUFDRCxDQU5ILEUsQ0FRQTtBQUNBO0FBQ0E7OztBQUNBLElBQUluRSxPQUFPLENBQUNpQyxJQUFSLENBQWE2QixNQUFiLElBQXVCLENBQTNCLEVBQThCO0FBQzVCbkQsd0JBQVVxQixLQUFWLENBQWdCaEMsT0FBTyxDQUFDaUMsSUFBeEI7O0FBQ0FkLEVBQUFBLFlBQVksR0FGZ0IsQ0FHNUI7O0FBQ0FuQixFQUFBQSxPQUFPLENBQUNrRSxJQUFSLENBQWFILHNCQUFJSSxVQUFqQjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5wcm9jZXNzLmVudi5QTTJfVVNBR0UgPSAnQ0xJJztcblxuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi9jb25zdGFudHMnO1xuXG5pbXBvcnQgY29tbWFuZGVyIGZyb20gJ2NvbW1hbmRlcic7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IGZvckVhY2hMaW1pdCBmcm9tICdhc3luYy9mb3JFYWNoTGltaXQnO1xuXG5pbXBvcnQgZGVidWdMb2dnZXIgZnJvbSAnZGVidWcnO1xuaW1wb3J0IFBNMiBmcm9tICcuLi9BUEknO1xuaW1wb3J0IHBrZyBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nO1xuaW1wb3J0ICogYXMgdGFidGFiIGZyb20gJy4uL2NvbXBsZXRpb24nO1xuaW1wb3J0IENvbW1vbiBmcm9tICcuLi9Db21tb24nO1xuaW1wb3J0IFBNMmlvSGFuZGxlciBmcm9tICcuLi9BUEkvcG0yLXBsdXMvUE0ySU8nO1xuaW1wb3J0IExvZ3MgZnJvbSAnLi4vQVBJL0xvZyc7XG5cbmNvbnN0IGRlYnVnID0gZGVidWdMb2dnZXIoJ3BtMjpjbGknKTtcblxuQ29tbW9uLmRldGVybWluZVNpbGVudENMSSgpO1xuQ29tbW9uLnByaW50VmVyc2lvbigpO1xuXG52YXIgcG0yOiBhbnkgPSBuZXcgUE0yKCk7XG5cblBNMmlvSGFuZGxlci51c2VQTTJDbGllbnQocG0yKVxuXG5jb21tYW5kZXIudmVyc2lvbihwa2cudmVyc2lvbilcbiAgLm9wdGlvbignLXYgLS12ZXJzaW9uJywgJ3ByaW50IHBtMiB2ZXJzaW9uJylcbiAgLm9wdGlvbignLXMgLS1zaWxlbnQnLCAnaGlkZSBhbGwgbWVzc2FnZXMnLCBmYWxzZSlcbiAgLm9wdGlvbignLS1leHQgPGV4dGVuc2lvbnM+JywgJ3dhdGNoIG9ubHkgdGhpcyBmaWxlIGV4dGVuc2lvbnMnKVxuICAub3B0aW9uKCctbiAtLW5hbWUgPG5hbWU+JywgJ3NldCBhIG5hbWUgZm9yIHRoZSBwcm9jZXNzIGluIHRoZSBwcm9jZXNzIGxpc3QnKVxuICAub3B0aW9uKCctbSAtLW1pbmktbGlzdCcsICdkaXNwbGF5IGEgY29tcGFjdGVkIGxpc3Qgd2l0aG91dCBmb3JtYXR0aW5nJylcbiAgLm9wdGlvbignLS1pbnRlcnByZXRlciA8aW50ZXJwcmV0ZXI+JywgJ3NldCBhIHNwZWNpZmljIGludGVycHJldGVyIHRvIHVzZSBmb3IgZXhlY3V0aW5nIGFwcCwgZGVmYXVsdDogbm9kZScpXG4gIC5vcHRpb24oJy0taW50ZXJwcmV0ZXItYXJncyA8YXJndW1lbnRzPicsICdzZXQgYXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIGludGVycHJldGVyIChhbGlhcyBvZiAtLW5vZGUtYXJncyknKVxuICAub3B0aW9uKCctLW5vZGUtYXJncyA8bm9kZV9hcmdzPicsICdzcGFjZSBkZWxpbWl0ZWQgYXJndW1lbnRzIHRvIHBhc3MgdG8gbm9kZScpXG4gIC5vcHRpb24oJy1vIC0tb3V0cHV0IDxwYXRoPicsICdzcGVjaWZ5IGxvZyBmaWxlIGZvciBzdGRvdXQnKVxuICAub3B0aW9uKCctZSAtLWVycm9yIDxwYXRoPicsICdzcGVjaWZ5IGxvZyBmaWxlIGZvciBzdGRlcnInKVxuICAub3B0aW9uKCctbCAtLWxvZyBbcGF0aF0nLCAnc3BlY2lmeSBsb2cgZmlsZSB3aGljaCBnYXRoZXJzIGJvdGggc3Rkb3V0IGFuZCBzdGRlcnInKVxuICAub3B0aW9uKCctLWZpbHRlci1lbnYgW2VudnNdJywgJ2ZpbHRlciBvdXQgb3V0Z29pbmcgZ2xvYmFsIHZhbHVlcyB0aGF0IGNvbnRhaW4gcHJvdmlkZWQgc3RyaW5ncycsIGZ1bmN0aW9uICh2LCBtKSB7IG0ucHVzaCh2KTsgcmV0dXJuIG07IH0sIFtdKVxuICAub3B0aW9uKCctLWxvZy10eXBlIDx0eXBlPicsICdzcGVjaWZ5IGxvZyBvdXRwdXQgc3R5bGUgKHJhdyBieSBkZWZhdWx0LCBqc29uIG9wdGlvbmFsKScpXG4gIC5vcHRpb24oJy0tbG9nLWRhdGUtZm9ybWF0IDxkYXRlIGZvcm1hdD4nLCAnYWRkIGN1c3RvbSBwcmVmaXggdGltZXN0YW1wIHRvIGxvZ3MnKVxuICAub3B0aW9uKCctLXRpbWUnLCAnZW5hYmxlIHRpbWUgbG9nZ2luZycpXG4gIC5vcHRpb24oJy0tZGlzYWJsZS1sb2dzJywgJ2Rpc2FibGUgYWxsIGxvZ3Mgc3RvcmFnZScpXG4gIC5vcHRpb24oJy0tZW52IDxlbnZpcm9ubWVudF9uYW1lPicsICdzcGVjaWZ5IHdoaWNoIHNldCBvZiBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZnJvbSBlY29zeXN0ZW0gZmlsZSBtdXN0IGJlIGluamVjdGVkJylcbiAgLm9wdGlvbignLWEgLS11cGRhdGUtZW52JywgJ2ZvcmNlIGFuIHVwZGF0ZSBvZiB0aGUgZW52aXJvbm1lbnQgd2l0aCByZXN0YXJ0L3JlbG9hZCAoLWEgPD0+IGFwcGx5KScpXG4gIC5vcHRpb24oJy1mIC0tZm9yY2UnLCAnZm9yY2UgYWN0aW9ucycpXG4gIC5vcHRpb24oJy1pIC0taW5zdGFuY2VzIDxudW1iZXI+JywgJ2xhdW5jaCBbbnVtYmVyXSBpbnN0YW5jZXMgKGZvciBuZXR3b3JrZWQgYXBwKShsb2FkIGJhbGFuY2VkKScpXG4gIC5vcHRpb24oJy0tcGFyYWxsZWwgPG51bWJlcj4nLCAnbnVtYmVyIG9mIHBhcmFsbGVsIGFjdGlvbnMgKGZvciByZXN0YXJ0L3JlbG9hZCknKVxuICAub3B0aW9uKCctLXNodXRkb3duLXdpdGgtbWVzc2FnZScsICdzaHV0ZG93biBhbiBhcHBsaWNhdGlvbiB3aXRoIHByb2Nlc3Muc2VuZChcXCdzaHV0ZG93blxcJykgaW5zdGVhZCBvZiBwcm9jZXNzLmtpbGwocGlkLCBTSUdJTlQpJylcbiAgLm9wdGlvbignLXAgLS1waWQgPHBpZD4nLCAnc3BlY2lmeSBwaWQgZmlsZScpXG4gIC5vcHRpb24oJy1rIC0ta2lsbC10aW1lb3V0IDxkZWxheT4nLCAnZGVsYXkgYmVmb3JlIHNlbmRpbmcgZmluYWwgU0lHS0lMTCBzaWduYWwgdG8gcHJvY2VzcycpXG4gIC5vcHRpb24oJy0tbGlzdGVuLXRpbWVvdXQgPGRlbGF5PicsICdsaXN0ZW4gdGltZW91dCBvbiBhcHBsaWNhdGlvbiByZWxvYWQnKVxuICAub3B0aW9uKCctLW1heC1tZW1vcnktcmVzdGFydCA8bWVtb3J5PicsICdSZXN0YXJ0IHRoZSBhcHAgaWYgYW4gYW1vdW50IG9mIG1lbW9yeSBpcyBleGNlZWRlZCAoaW4gYnl0ZXMpJylcbiAgLm9wdGlvbignLS1yZXN0YXJ0LWRlbGF5IDxkZWxheT4nLCAnc3BlY2lmeSBhIGRlbGF5IGJldHdlZW4gcmVzdGFydHMgKGluIG1pbGxpc2Vjb25kcyknKVxuICAub3B0aW9uKCctLWV4cC1iYWNrb2ZmLXJlc3RhcnQtZGVsYXkgPGRlbGF5PicsICdzcGVjaWZ5IGEgZGVsYXkgYmV0d2VlbiByZXN0YXJ0cyAoaW4gbWlsbGlzZWNvbmRzKScpXG4gIC5vcHRpb24oJy14IC0tZXhlY3V0ZS1jb21tYW5kJywgJ2V4ZWN1dGUgYSBwcm9ncmFtIHVzaW5nIGZvcmsgc3lzdGVtJylcbiAgLm9wdGlvbignLS1tYXgtcmVzdGFydHMgW2NvdW50XScsICdvbmx5IHJlc3RhcnQgdGhlIHNjcmlwdCBDT1VOVCB0aW1lcycpXG4gIC5vcHRpb24oJy11IC0tdXNlciA8dXNlcm5hbWU+JywgJ2RlZmluZSB1c2VyIHdoZW4gZ2VuZXJhdGluZyBzdGFydHVwIHNjcmlwdCcpXG4gIC5vcHRpb24oJy0tdWlkIDx1aWQ+JywgJ3J1biB0YXJnZXQgc2NyaXB0IHdpdGggPHVpZD4gcmlnaHRzJylcbiAgLm9wdGlvbignLS1naWQgPGdpZD4nLCAncnVuIHRhcmdldCBzY3JpcHQgd2l0aCA8Z2lkPiByaWdodHMnKVxuICAub3B0aW9uKCctLW5hbWVzcGFjZSA8bnM+JywgJ3N0YXJ0IGFwcGxpY2F0aW9uIHdpdGhpbiBzcGVjaWZpZWQgbmFtZXNwYWNlJylcbiAgLm9wdGlvbignLS1jd2QgPHBhdGg+JywgJ3J1biB0YXJnZXQgc2NyaXB0IGZyb20gcGF0aCA8Y3dkPicpXG4gIC5vcHRpb24oJy0taHAgPGhvbWUgcGF0aD4nLCAnZGVmaW5lIGhvbWUgcGF0aCB3aGVuIGdlbmVyYXRpbmcgc3RhcnR1cCBzY3JpcHQnKVxuICAub3B0aW9uKCctLXdhaXQtaXAnLCAnb3ZlcnJpZGUgc3lzdGVtZCBzY3JpcHQgdG8gd2FpdCBmb3IgZnVsbCBpbnRlcm5ldCBjb25uZWN0aXZpdHkgdG8gbGF1bmNoIHBtMicpXG4gIC5vcHRpb24oJy0tc2VydmljZS1uYW1lIDxuYW1lPicsICdkZWZpbmUgc2VydmljZSBuYW1lIHdoZW4gZ2VuZXJhdGluZyBzdGFydHVwIHNjcmlwdCcpXG4gIC5vcHRpb24oJy1jIC0tY3JvbiA8Y3Jvbl9wYXR0ZXJuPicsICdyZXN0YXJ0IGEgcnVubmluZyBwcm9jZXNzIGJhc2VkIG9uIGEgY3JvbiBwYXR0ZXJuJylcbiAgLm9wdGlvbignLXcgLS13cml0ZScsICd3cml0ZSBjb25maWd1cmF0aW9uIGluIGxvY2FsIGZvbGRlcicpXG4gIC5vcHRpb24oJy0tbm8tZGFlbW9uJywgJ3J1biBwbTIgZGFlbW9uIGluIHRoZSBmb3JlZ3JvdW5kIGlmIGl0IGRvZXNuXFwndCBleGlzdCBhbHJlYWR5JylcbiAgLm9wdGlvbignLS1zb3VyY2UtbWFwLXN1cHBvcnQnLCAnZm9yY2Ugc291cmNlIG1hcCBzdXBwb3J0JylcbiAgLm9wdGlvbignLS1vbmx5IDxhcHBsaWNhdGlvbi1uYW1lPicsICd3aXRoIGpzb24gZGVjbGFyYXRpb24sIGFsbG93IHRvIG9ubHkgYWN0IG9uIG9uZSBhcHBsaWNhdGlvbicpXG4gIC5vcHRpb24oJy0tZGlzYWJsZS1zb3VyY2UtbWFwLXN1cHBvcnQnLCAnZm9yY2Ugc291cmNlIG1hcCBzdXBwb3J0JylcbiAgLm9wdGlvbignLS13YWl0LXJlYWR5JywgJ2FzayBwbTIgdG8gd2FpdCBmb3IgcmVhZHkgZXZlbnQgZnJvbSB5b3VyIGFwcCcpXG4gIC5vcHRpb24oJy0tbWVyZ2UtbG9ncycsICdtZXJnZSBsb2dzIGZyb20gZGlmZmVyZW50IGluc3RhbmNlcyBidXQga2VlcCBlcnJvciBhbmQgb3V0IHNlcGFyYXRlZCcpXG4gIC5vcHRpb24oJy0td2F0Y2ggW3BhdGhzXScsICd3YXRjaCBhcHBsaWNhdGlvbiBmb2xkZXIgZm9yIGNoYW5nZXMnLCBmdW5jdGlvbiAodiwgbSkgeyBtLnB1c2godik7IHJldHVybiBtOyB9LCBbXSlcbiAgLm9wdGlvbignLS1pZ25vcmUtd2F0Y2ggPGZvbGRlcnN8ZmlsZXM+JywgJ0xpc3Qgb2YgcGF0aHMgdG8gaWdub3JlIChuYW1lIG9yIHJlZ2V4KScpXG4gIC5vcHRpb24oJy0td2F0Y2gtZGVsYXkgPGRlbGF5PicsICdzcGVjaWZ5IGEgcmVzdGFydCBkZWxheSBhZnRlciBjaGFuZ2luZyBmaWxlcyAoLS13YXRjaC1kZWxheSA0IChpbiBzZWMpIG9yIDQwMDBtcyknKVxuICAub3B0aW9uKCctLW5vLWNvbG9yJywgJ3NraXAgY29sb3JzJylcbiAgLm9wdGlvbignLS1uby12aXppb24nLCAnc3RhcnQgYW4gYXBwIHdpdGhvdXQgdml6aW9uIGZlYXR1cmUgKHZlcnNpb25pbmcgY29udHJvbCknKVxuICAub3B0aW9uKCctLW5vLWF1dG9yZXN0YXJ0JywgJ3N0YXJ0IGFuIGFwcCB3aXRob3V0IGF1dG9tYXRpYyByZXN0YXJ0JylcbiAgLm9wdGlvbignLS1uby10cmVla2lsbCcsICdPbmx5IGtpbGwgdGhlIG1haW4gcHJvY2Vzcywgbm90IGRldGFjaGVkIGNoaWxkcmVuJylcbiAgLm9wdGlvbignLS1uby1wbXgnLCAnc3RhcnQgYW4gYXBwIHdpdGhvdXQgcG14JylcbiAgLm9wdGlvbignLS1uby1hdXRvbWF0aW9uJywgJ3N0YXJ0IGFuIGFwcCB3aXRob3V0IHBteCcpXG4gIC5vcHRpb24oJy0tdHJhY2UnLCAnZW5hYmxlIHRyYW5zYWN0aW9uIHRyYWNpbmcgd2l0aCBrbScpXG4gIC5vcHRpb24oJy0tZGlzYWJsZS10cmFjZScsICdkaXNhYmxlIHRyYW5zYWN0aW9uIHRyYWNpbmcgd2l0aCBrbScpXG4gIC5vcHRpb24oJy0tYXR0YWNoJywgJ2F0dGFjaCBsb2dnaW5nIGFmdGVyIHlvdXIgc3RhcnQvcmVzdGFydC9zdG9wL3JlbG9hZCcpXG4gIC5vcHRpb24oJy0tdjgnLCAnZW5hYmxlIHY4IGRhdGEgY29sbGVjdGluZycpXG4gIC5vcHRpb24oJy0tZXZlbnQtbG9vcC1pbnNwZWN0b3InLCAnZW5hYmxlIGV2ZW50LWxvb3AtaW5zcGVjdG9yIGR1bXAgaW4gcG14JylcbiAgLm9wdGlvbignLS1kZWVwLW1vbml0b3JpbmcnLCAnZW5hYmxlIGFsbCBtb25pdG9yaW5nIHRvb2xzIChlcXVpdmFsZW50IHRvIC0tdjggLS1ldmVudC1sb29wLWluc3BlY3RvciAtLXRyYWNlKScpXG4gIC51c2FnZSgnW2NtZF0gYXBwJyk7XG5cbmZ1bmN0aW9uIGRpc3BsYXlVc2FnZSgpIHtcbiAgY29uc29sZS5sb2coJ3VzYWdlOiBwbTIgW29wdGlvbnNdIDxjb21tYW5kPicpXG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJ3BtMiAtaCwgLS1oZWxwICAgICAgICAgICAgIGFsbCBhdmFpbGFibGUgY29tbWFuZHMgYW5kIG9wdGlvbnMnKTtcbiAgY29uc29sZS5sb2coJ3BtMiBleGFtcGxlcyAgICAgICAgICAgICAgIGRpc3BsYXkgcG0yIHVzYWdlIGV4YW1wbGVzJyk7XG4gIGNvbnNvbGUubG9nKCdwbTIgPGNvbW1hbmQ+IC1oICAgICAgICAgICBoZWxwIG9uIGEgc3BlY2lmaWMgY29tbWFuZCcpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCdBY2Nlc3MgcG0yIGZpbGVzIGluIH4vLnBtMicpO1xufVxuXG5mdW5jdGlvbiBkaXNwbGF5RXhhbXBsZXMoKSB7XG4gIGNvbnNvbGUubG9nKCctIFN0YXJ0IGFuZCBhZGQgYSBwcm9jZXNzIHRvIHRoZSBwbTIgcHJvY2VzcyBsaXN0OicpXG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coY2hhbGsuY3lhbignICAkIHBtMiBzdGFydCBhcHAuanMgLS1uYW1lIGFwcCcpKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBjb25zb2xlLmxvZygnLSBTaG93IHRoZSBwcm9jZXNzIGxpc3Q6Jyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coY2hhbGsuY3lhbignICAkIHBtMiBscycpKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBjb25zb2xlLmxvZygnLSBTdG9wIGFuZCBkZWxldGUgYSBwcm9jZXNzIGZyb20gdGhlIHBtMiBwcm9jZXNzIGxpc3Q6Jyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coY2hhbGsuY3lhbignICAkIHBtMiBkZWxldGUgYXBwJykpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCctIFN0b3AsIHN0YXJ0IGFuZCByZXN0YXJ0IGEgcHJvY2VzcyBmcm9tIHRoZSBwcm9jZXNzIGxpc3Q6Jyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coY2hhbGsuY3lhbignICAkIHBtMiBzdG9wIGFwcCcpKTtcbiAgY29uc29sZS5sb2coY2hhbGsuY3lhbignICAkIHBtMiBzdGFydCBhcHAnKSk7XG4gIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJyAgJCBwbTIgcmVzdGFydCBhcHAnKSk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJy0gQ2x1c3Rlcml6ZSBhbiBhcHAgdG8gYWxsIENQVSBjb3JlcyBhdmFpbGFibGU6Jyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coY2hhbGsuY3lhbignICAkIHBtMiBzdGFydCAtaSBtYXgnKSk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJy0gVXBkYXRlIHBtMiA6Jyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coY2hhbGsuY3lhbignICAkIG5wbSBpbnN0YWxsIHBtMiAtZyAmJiBwbTIgdXBkYXRlJykpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCctIEluc3RhbGwgcG0yIGF1dG8gY29tcGxldGlvbjonKVxuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJyAgJCBwbTIgY29tcGxldGlvbiBpbnN0YWxsJykpXG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJ0NoZWNrIHRoZSBmdWxsIGRvY3VtZW50YXRpb24gb24gaHR0cHM6Ly9wbTIua2V5bWV0cmljcy5pby8nKTtcbiAgY29uc29sZS5sb2coJycpO1xufVxuXG5mdW5jdGlvbiBiZWdpbkNvbW1hbmRQcm9jZXNzaW5nKCkge1xuICBwbTIuZ2V0VmVyc2lvbihmdW5jdGlvbiAoZXJyLCByZW1vdGVfdmVyc2lvbikge1xuICAgIGlmICghZXJyICYmIChwa2cudmVyc2lvbiAhPSByZW1vdGVfdmVyc2lvbikpIHtcbiAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICAgIGNvbnNvbGUubG9nKGNoYWxrLnJlZC5ib2xkKCc+Pj4+IEluLW1lbW9yeSBQTTIgaXMgb3V0LW9mLWRhdGUsIGRvOlxcbj4+Pj4gJCBwbTIgdXBkYXRlJykpO1xuICAgICAgY29uc29sZS5sb2coJ0luIG1lbW9yeSBQTTIgdmVyc2lvbjonLCBjaGFsay5ibHVlLmJvbGQocmVtb3RlX3ZlcnNpb24pKTtcbiAgICAgIGNvbnNvbGUubG9nKCdMb2NhbCBQTTIgdmVyc2lvbjonLCBjaGFsay5ibHVlLmJvbGQocGtnLnZlcnNpb24pKTtcbiAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG4gIH0pO1xuICBjb21tYW5kZXIucGFyc2UocHJvY2Vzcy5hcmd2KTtcbn1cblxuZnVuY3Rpb24gY2hlY2tDb21wbGV0aW9uKCkge1xuICByZXR1cm4gdGFidGFiLmNvbXBsZXRlKCdwbTInLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgaWYgKGVyciB8fCAhZGF0YSkgcmV0dXJuO1xuICAgIGlmICgvXi0tXFx3Py8udGVzdChkYXRhLmxhc3QpKSByZXR1cm4gdGFidGFiLmxvZyhjb21tYW5kZXIub3B0aW9ucy5tYXAoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIHJldHVybiBkYXRhLmxvbmc7XG4gICAgfSksIGRhdGEpO1xuICAgIGlmICgvXi1cXHc/Ly50ZXN0KGRhdGEubGFzdCkpIHJldHVybiB0YWJ0YWIubG9nKGNvbW1hbmRlci5vcHRpb25zLm1hcChmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgcmV0dXJuIGRhdGEuc2hvcnQ7XG4gICAgfSksIGRhdGEpO1xuICAgIC8vIGFycmF5IGNvbnRhaW5pbmcgY29tbWFuZHMgYWZ0ZXIgd2hpY2ggcHJvY2VzcyBuYW1lIHNob3VsZCBiZSBsaXN0ZWRcbiAgICB2YXIgY21kUHJvY2VzcyA9IFsnc3RvcCcsICdyZXN0YXJ0JywgJ3NjYWxlJywgJ3JlbG9hZCcsICdkZWxldGUnLCAncmVzZXQnLCAncHVsbCcsICdmb3J3YXJkJywgJ2JhY2t3YXJkJywgJ2xvZ3MnLCAnZGVzY3JpYmUnLCAnZGVzYycsICdzaG93J107XG5cbiAgICBpZiAoY21kUHJvY2Vzcy5pbmRleE9mKGRhdGEucHJldikgPiAtMSkge1xuICAgICAgcG0yLmxpc3QoZnVuY3Rpb24gKGVyciwgbGlzdCkge1xuICAgICAgICB0YWJ0YWIubG9nKGxpc3QubWFwKGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gZWwubmFtZSB9KSwgZGF0YSk7XG4gICAgICAgIHBtMi5kaXNjb25uZWN0KCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZGF0YS5wcmV2ID09ICdwbTInKSB7XG4gICAgICB0YWJ0YWIubG9nKGNvbW1hbmRlci5jb21tYW5kcy5tYXAoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIGRhdGEuX25hbWU7XG4gICAgICB9KSwgZGF0YSk7XG4gICAgICBwbTIuZGlzY29ubmVjdCgpO1xuICAgIH1cbiAgICBlbHNlXG4gICAgICBwbTIuZGlzY29ubmVjdCgpO1xuICB9KTtcbn07XG5cbnZhciBfYXJyID0gcHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0tJykgPiAtMSA/IHByb2Nlc3MuYXJndi5zbGljZSgwLCBwcm9jZXNzLmFyZ3YuaW5kZXhPZignLS0nKSkgOiBwcm9jZXNzLmFyZ3Y7XG5cbmlmIChfYXJyLmluZGV4T2YoJ2xvZycpID4gLTEpIHtcbiAgcHJvY2Vzcy5hcmd2W19hcnIuaW5kZXhPZignbG9nJyldID0gJ2xvZ3MnO1xufVxuXG5pZiAoX2Fyci5pbmRleE9mKCctLW5vLWRhZW1vbicpID4gLTEpIHtcbiAgLy9cbiAgLy8gU3RhcnQgZGFlbW9uIGlmIGl0IGRvZXMgbm90IGV4aXN0XG4gIC8vXG4gIC8vIEZ1bmN0aW9uIGNoZWNrcyBpZiAtLW5vLWRhZW1vbiBvcHRpb24gaXMgcHJlc2VudCxcbiAgLy8gYW5kIHN0YXJ0cyBkYWVtb24gaW4gdGhlIHNhbWUgcHJvY2VzcyBpZiBpdCBkb2VzIG5vdCBleGlzdFxuICAvL1xuICBjb25zb2xlLmxvZygncG0yIGxhdW5jaGVkIGluIG5vLWRhZW1vbiBtb2RlICh5b3UgY2FuIGFkZCBERUJVRz1cIipcIiBlbnYgdmFyaWFibGUgdG8gZ2V0IG1vcmUgbWVzc2FnZXMpJyk7XG5cbiAgdmFyIHBtMk5vRGFlYW1vbiA9IG5ldyBQTTIoe1xuICAgIGRhZW1vbl9tb2RlOiBmYWxzZVxuICB9KTtcblxuICBwbTJOb0RhZWFtb24uY29ubmVjdChmdW5jdGlvbiAoKSB7XG4gICAgcG0yID0gcG0yTm9EYWVhbW9uO1xuICAgIGJlZ2luQ29tbWFuZFByb2Nlc3NpbmcoKTtcbiAgfSk7XG5cbn1cbmVsc2UgaWYgKF9hcnIuaW5kZXhPZignc3RhcnR1cCcpID4gLTEgfHwgX2Fyci5pbmRleE9mKCd1bnN0YXJ0dXAnKSA+IC0xKSB7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIGNvbW1hbmRlci5wYXJzZShwcm9jZXNzLmFyZ3YpO1xuICB9LCAxMDApO1xufVxuZWxzZSB7XG4gIC8vIEhFUkUgd2UgaW5zdGFuY2lhdGUgdGhlIENsaWVudCBvYmplY3RcbiAgcG0yLmNvbm5lY3QoZnVuY3Rpb24gKCkge1xuICAgIGRlYnVnKCdOb3cgY29ubmVjdGVkIHRvIGRhZW1vbicpO1xuICAgIGlmIChwcm9jZXNzLmFyZ3Yuc2xpY2UoMilbMF0gPT09ICdjb21wbGV0aW9uJykge1xuICAgICAgY2hlY2tDb21wbGV0aW9uKCk7XG4gICAgICAvL0Nsb3NlIGNsaWVudCBpZiBjb21wbGV0aW9uIHJlbGF0ZWQgaW5zdGFsbGF0aW9uXG4gICAgICB2YXIgdGhpcmQgPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoMylbMF07XG4gICAgICBpZiAodGhpcmQgPT0gbnVsbCB8fCB0aGlyZCA9PT0gJ2luc3RhbGwnIHx8IHRoaXJkID09PSAndW5pbnN0YWxsJylcbiAgICAgICAgcG0yLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBiZWdpbkNvbW1hbmRQcm9jZXNzaW5nKCk7XG4gICAgfVxuICB9KTtcbn1cblxuLy9cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBmYWlsIHdoZW4gdW5rbm93biBjb21tYW5kIGFyZ3VtZW50cyBhcmUgcGFzc2VkXG4vL1xuZnVuY3Rpb24gZmFpbE9uVW5rbm93bihmbikge1xuICByZXR1cm4gZnVuY3Rpb24gKGFyZykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgY29uc29sZS5sb2coY3N0LlBSRUZJWF9NU0cgKyAnXFxuVW5rbm93biBjb21tYW5kIGFyZ3VtZW50OiAnICsgYXJnKTtcbiAgICAgIGNvbW1hbmRlci5vdXRwdXRIZWxwKCk7XG4gICAgICBwcm9jZXNzLmV4aXQoY3N0LkVSUk9SX0VYSVQpO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBAdG9kbyB0byByZW1vdmUgYXQgc29tZSBwb2ludCBvbmNlIGl0J3MgZml4ZWQgaW4gb2ZmaWNpYWwgY29tbWFuZGVyLmpzXG4gKiBodHRwczovL2dpdGh1Yi5jb20vdGovY29tbWFuZGVyLmpzL2lzc3Vlcy80NzVcbiAqXG4gKiBQYXRjaCBDb21tYW5kZXIuanMgVmFyaWFkaWMgZmVhdHVyZVxuICovXG5mdW5jdGlvbiBwYXRjaENvbW1hbmRlckFyZyhjbWQpIHtcbiAgdmFyIGFyZ3NJbmRleDtcbiAgaWYgKChhcmdzSW5kZXggPSBjb21tYW5kZXIucmF3QXJncy5pbmRleE9mKCctLScpKSA+PSAwKSB7XG4gICAgdmFyIG9wdGFyZ3MgPSBjb21tYW5kZXIucmF3QXJncy5zbGljZShhcmdzSW5kZXggKyAxKTtcbiAgICBjbWQgPSBjbWQuc2xpY2UoMCwgY21kLmluZGV4T2Yob3B0YXJnc1swXSkpO1xuICB9XG4gIHJldHVybiBjbWQ7XG59XG5cbi8vXG4vLyBTdGFydCBjb21tYW5kXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ3N0YXJ0IFtuYW1lfG5hbWVzcGFjZXxmaWxlfGVjb3N5c3RlbXxpZC4uLl0nKVxuICAub3B0aW9uKCctLXdhdGNoJywgJ1dhdGNoIGZvbGRlciBmb3IgY2hhbmdlcycpXG4gIC5vcHRpb24oJy0tZnJlc2gnLCAnUmVidWlsZCBEb2NrZXJmaWxlJylcbiAgLm9wdGlvbignLS1kYWVtb24nLCAnUnVuIGNvbnRhaW5lciBpbiBEYWVtb24gbW9kZSAoZGVidWcgcHVycG9zZXMpJylcbiAgLm9wdGlvbignLS1jb250YWluZXInLCAnU3RhcnQgYXBwbGljYXRpb24gaW4gY29udGFpbmVyIG1vZGUnKVxuICAub3B0aW9uKCctLWRpc3QnLCAnd2l0aCAtLWNvbnRhaW5lcjsgY2hhbmdlIGxvY2FsIERvY2tlcmZpbGUgdG8gY29udGFpbmVyaXplIGFsbCBmaWxlcyBpbiBjdXJyZW50IGRpcmVjdG9yeScpXG4gIC5vcHRpb24oJy0taW1hZ2UtbmFtZSBbbmFtZV0nLCAnd2l0aCAtLWRpc3Q7IHNldCB0aGUgZXhwb3J0ZWQgaW1hZ2UgbmFtZScpXG4gIC5vcHRpb24oJy0tbm9kZS12ZXJzaW9uIFttYWpvcl0nLCAnd2l0aCAtLWNvbnRhaW5lciwgc2V0IGEgc3BlY2lmaWMgbWFqb3IgTm9kZS5qcyB2ZXJzaW9uJylcbiAgLm9wdGlvbignLS1kb2NrZXJkYWVtb24nLCAnZm9yIGRlYnVnZ2luZyBwdXJwb3NlJylcbiAgLmRlc2NyaXB0aW9uKCdzdGFydCBhbmQgZGFlbW9uaXplIGFuIGFwcCcpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGNtZCwgb3B0cykge1xuICAgIGlmIChvcHRzLmNvbnRhaW5lciA9PSB0cnVlICYmIG9wdHMuZGlzdCA9PSB0cnVlKVxuICAgICAgcmV0dXJuIHBtMi5kb2NrZXJNb2RlKGNtZCwgb3B0cywgJ2Rpc3RyaWJ1dGlvbicpO1xuICAgIGVsc2UgaWYgKG9wdHMuY29udGFpbmVyID09IHRydWUpXG4gICAgICByZXR1cm4gcG0yLmRvY2tlck1vZGUoY21kLCBvcHRzLCAnZGV2ZWxvcG1lbnQnKTtcblxuICAgIGlmIChjbWQgPT0gXCItXCIpIHtcbiAgICAgIHByb2Nlc3Muc3RkaW4ucmVzdW1lKCk7XG4gICAgICBwcm9jZXNzLnN0ZGluLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgICBwcm9jZXNzLnN0ZGluLm9uKCdkYXRhJywgZnVuY3Rpb24gKGNtZCkge1xuICAgICAgICBwcm9jZXNzLnN0ZGluLnBhdXNlKCk7XG4gICAgICAgIHBtMi5fc3RhcnRKc29uKGNtZCwgY29tbWFuZGVyLCAncmVzdGFydFByb2Nlc3NJZCcsICdwaXBlJyk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBDb21tYW5kZXIuanMgcGF0Y2hcbiAgICAgIGNtZCA9IHBhdGNoQ29tbWFuZGVyQXJnKGNtZCk7XG4gICAgICBpZiAoY21kLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjbWQgPSBbY3N0LkFQUF9DT05GX0RFRkFVTFRfRklMRV07XG4gICAgICB9XG4gICAgICBsZXQgYWNjID0gW11cbiAgICAgIGZvckVhY2hMaW1pdChjbWQsIDEsIGZ1bmN0aW9uIChzY3JpcHQsIG5leHQpIHtcbiAgICAgICAgcG0yLnN0YXJ0KHNjcmlwdCwgY29tbWFuZGVyLCAoZXJyLCBhcHBzKSA9PiB7XG4gICAgICAgICAgYWNjID0gYWNjLmNvbmNhdChhcHBzKVxuICAgICAgICAgIG5leHQoZXJyKVxuICAgICAgICB9KTtcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIGR0KSB7XG4gICAgICAgIGlmIChlcnIgJiYgZXJyLm1lc3NhZ2UgJiZcbiAgICAgICAgICAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ1NjcmlwdCBub3QgZm91bmQnKSA9PT0gdHJ1ZSB8fFxuICAgICAgICAgICAgZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ05PVCBBVkFJTEFCTEUgSU4gUEFUSCcpID09PSB0cnVlKSkge1xuICAgICAgICAgIHBtMi5leGl0Q2xpKDEpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHBtMi5zcGVlZExpc3QoZXJyID8gMSA6IDAsIGFjYyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgndHJpZ2dlciA8aWR8cHJvY19uYW1lfG5hbWVzcGFjZXxhbGw+IDxhY3Rpb25fbmFtZT4gW3BhcmFtc10nKVxuICAuZGVzY3JpcHRpb24oJ3RyaWdnZXIgcHJvY2VzcyBhY3Rpb24nKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwbV9pZCwgYWN0aW9uX25hbWUsIHBhcmFtcykge1xuICAgIHBtMi50cmlnZ2VyKHBtX2lkLCBhY3Rpb25fbmFtZSwgcGFyYW1zKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdkZXBsb3kgPGZpbGV8ZW52aXJvbm1lbnQ+JylcbiAgLmRlc2NyaXB0aW9uKCdkZXBsb3kgeW91ciBqc29uJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoY21kKSB7XG4gICAgcG0yLmRlcGxveShjbWQsIGNvbW1hbmRlcik7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnc3RhcnRPclJlc3RhcnQgPGpzb24+JylcbiAgLmRlc2NyaXB0aW9uKCdzdGFydCBvciByZXN0YXJ0IEpTT04gZmlsZScpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGZpbGUpIHtcbiAgICBwbTIuX3N0YXJ0SnNvbihmaWxlLCBjb21tYW5kZXIsICdyZXN0YXJ0UHJvY2Vzc0lkJyk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnc3RhcnRPclJlbG9hZCA8anNvbj4nKVxuICAuZGVzY3JpcHRpb24oJ3N0YXJ0IG9yIGdyYWNlZnVsbHkgcmVsb2FkIEpTT04gZmlsZScpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGZpbGUpIHtcbiAgICBwbTIuX3N0YXJ0SnNvbihmaWxlLCBjb21tYW5kZXIsICdyZWxvYWRQcm9jZXNzSWQnKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdwaWQgW2FwcF9uYW1lXScpXG4gIC5kZXNjcmlwdGlvbigncmV0dXJuIHBpZCBvZiBbYXBwX25hbWVdIG9yIGFsbCcpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGFwcCkge1xuICAgIHBtMi5nZXRQSUQoYXBwKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdjcmVhdGUnKVxuICAuZGVzY3JpcHRpb24oJ3JldHVybiBwaWQgb2YgW2FwcF9uYW1lXSBvciBhbGwnKVxuICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICBwbTIuYm9pbGVycGxhdGUoKVxuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3N0YXJ0T3JHcmFjZWZ1bFJlbG9hZCA8anNvbj4nKVxuICAuZGVzY3JpcHRpb24oJ3N0YXJ0IG9yIGdyYWNlZnVsbHkgcmVsb2FkIEpTT04gZmlsZScpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGZpbGUpIHtcbiAgICBwbTIuX3N0YXJ0SnNvbihmaWxlLCBjb21tYW5kZXIsICdzb2Z0UmVsb2FkUHJvY2Vzc0lkJyk7XG4gIH0pO1xuXG4vL1xuLy8gU3RvcCBzcGVjaWZpYyBpZFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdzdG9wIDxpZHxuYW1lfG5hbWVzcGFjZXxhbGx8anNvbnxzdGRpbi4uLj4nKVxuICAub3B0aW9uKCctLXdhdGNoJywgJ1N0b3Agd2F0Y2hpbmcgZm9sZGVyIGZvciBjaGFuZ2VzJylcbiAgLmRlc2NyaXB0aW9uKCdzdG9wIGEgcHJvY2VzcycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHBhcmFtKSB7XG4gICAgZm9yRWFjaExpbWl0KHBhcmFtLCAxLCBmdW5jdGlvbiAoc2NyaXB0LCBuZXh0KSB7XG4gICAgICBwbTIuc3RvcChzY3JpcHQsIG5leHQpO1xuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHBtMi5zcGVlZExpc3QoZXJyID8gMSA6IDApO1xuICAgIH0pO1xuICB9KTtcblxuLy9cbi8vIFN0b3AgQWxsIHByb2Nlc3Nlc1xuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdyZXN0YXJ0IDxpZHxuYW1lfG5hbWVzcGFjZXxhbGx8anNvbnxzdGRpbi4uLj4nKVxuICAub3B0aW9uKCctLXdhdGNoJywgJ1RvZ2dsZSB3YXRjaGluZyBmb2xkZXIgZm9yIGNoYW5nZXMnKVxuICAuZGVzY3JpcHRpb24oJ3Jlc3RhcnQgYSBwcm9jZXNzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAocGFyYW0pIHtcbiAgICAvLyBDb21tYW5kZXIuanMgcGF0Y2hcbiAgICBwYXJhbSA9IHBhdGNoQ29tbWFuZGVyQXJnKHBhcmFtKTtcbiAgICBsZXQgYWNjID0gW11cbiAgICBmb3JFYWNoTGltaXQocGFyYW0sIDEsIGZ1bmN0aW9uIChzY3JpcHQsIG5leHQpIHtcbiAgICAgIHBtMi5yZXN0YXJ0KHNjcmlwdCwgY29tbWFuZGVyLCAoZXJyLCBhcHBzKSA9PiB7XG4gICAgICAgIGFjYyA9IGFjYy5jb25jYXQoYXBwcylcbiAgICAgICAgbmV4dChlcnIpXG4gICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBwbTIuc3BlZWRMaXN0KGVyciA/IDEgOiAwLCBhY2MpO1xuICAgIH0pO1xuICB9KTtcblxuLy9cbi8vIFNjYWxlIHVwL2Rvd24gYSBwcm9jZXNzIGluIGNsdXN0ZXIgbW9kZVxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdzY2FsZSA8YXBwX25hbWU+IDxudW1iZXI+JylcbiAgLmRlc2NyaXB0aW9uKCdzY2FsZSB1cC9kb3duIGEgcHJvY2VzcyBpbiBjbHVzdGVyIG1vZGUgZGVwZW5kaW5nIG9uIHRvdGFsX251bWJlciBwYXJhbScpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGFwcF9uYW1lLCBudW1iZXIpIHtcbiAgICBwbTIuc2NhbGUoYXBwX25hbWUsIG51bWJlcik7XG4gIH0pO1xuXG4vL1xuLy8gc25hcHNob3QgUE0yXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ3Byb2ZpbGU6bWVtIFt0aW1lXScpXG4gIC5kZXNjcmlwdGlvbignU2FtcGxlIFBNMiBoZWFwIG1lbW9yeScpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHRpbWUpIHtcbiAgICBwbTIucHJvZmlsZSgnbWVtJywgdGltZSk7XG4gIH0pO1xuXG4vL1xuLy8gc25hcHNob3QgUE0yXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ3Byb2ZpbGU6Y3B1IFt0aW1lXScpXG4gIC5kZXNjcmlwdGlvbignUHJvZmlsZSBQTTIgY3B1JylcbiAgLmFjdGlvbihmdW5jdGlvbiAodGltZSkge1xuICAgIHBtMi5wcm9maWxlKCdjcHUnLCB0aW1lKTtcbiAgfSk7XG5cbi8vXG4vLyBSZWxvYWQgcHJvY2Vzcyhlcylcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgncmVsb2FkIDxpZHxuYW1lfG5hbWVzcGFjZXxhbGw+JylcbiAgLmRlc2NyaXB0aW9uKCdyZWxvYWQgcHJvY2Vzc2VzIChub3RlIHRoYXQgaXRzIGZvciBhcHAgdXNpbmcgSFRUUC9IVFRQUyknKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwbTJfaWQpIHtcbiAgICBwbTIucmVsb2FkKHBtMl9pZCwgY29tbWFuZGVyKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdpZCA8bmFtZT4nKVxuICAuZGVzY3JpcHRpb24oJ2dldCBwcm9jZXNzIGlkIGJ5IG5hbWUnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcG0yLmdldFByb2Nlc3NJZEJ5TmFtZShuYW1lKTtcbiAgfSk7XG5cbi8vIEluc3BlY3QgYSBwcm9jZXNzXG5jb21tYW5kZXIuY29tbWFuZCgnaW5zcGVjdCA8bmFtZT4nKVxuICAuZGVzY3JpcHRpb24oJ2luc3BlY3QgYSBwcm9jZXNzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoY21kKSB7XG4gICAgcG0yLmluc3BlY3QoY21kLCBjb21tYW5kZXIpO1xuICB9KTtcblxuLy9cbi8vIFN0b3AgYW5kIGRlbGV0ZSBhIHByb2Nlc3MgYnkgbmFtZSBmcm9tIGRhdGFiYXNlXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2RlbGV0ZSA8bmFtZXxpZHxuYW1lc3BhY2V8c2NyaXB0fGFsbHxqc29ufHN0ZGluLi4uPicpXG4gIC5hbGlhcygnZGVsJylcbiAgLmRlc2NyaXB0aW9uKCdzdG9wIGFuZCBkZWxldGUgYSBwcm9jZXNzIGZyb20gcG0yIHByb2Nlc3MgbGlzdCcpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZiAobmFtZSA9PSBcIi1cIikge1xuICAgICAgcHJvY2Vzcy5zdGRpbi5yZXN1bWUoKTtcbiAgICAgIHByb2Nlc3Muc3RkaW4uc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICAgIHByb2Nlc3Muc3RkaW4ub24oJ2RhdGEnLCBmdW5jdGlvbiAocGFyYW0pIHtcbiAgICAgICAgcHJvY2Vzcy5zdGRpbi5wYXVzZSgpO1xuICAgICAgICBwbTIuZGVsZXRlKHBhcmFtLCAncGlwZScpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlXG4gICAgICBmb3JFYWNoTGltaXQobmFtZSwgMSwgZnVuY3Rpb24gKHNjcmlwdCwgbmV4dCkge1xuICAgICAgICBwbTIuZGVsZXRlKHNjcmlwdCwgJycsIG5leHQpO1xuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBwbTIuc3BlZWRMaXN0KGVyciA/IDEgOiAwKTtcbiAgICAgIH0pO1xuICB9KTtcblxuLy9cbi8vIFNlbmQgc3lzdGVtIHNpZ25hbCB0byBwcm9jZXNzXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ3NlbmRTaWduYWwgPHNpZ25hbD4gPHBtMl9pZHxuYW1lPicpXG4gIC5kZXNjcmlwdGlvbignc2VuZCBhIHN5c3RlbSBzaWduYWwgdG8gdGhlIHRhcmdldCBwcm9jZXNzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoc2lnbmFsLCBwbTJfaWQpIHtcbiAgICBpZiAoaXNOYU4ocGFyc2VJbnQocG0yX2lkKSkpIHtcbiAgICAgIGNvbnNvbGUubG9nKGNzdC5QUkVGSVhfTVNHICsgJ1NlbmRpbmcgc2lnbmFsIHRvIHByb2Nlc3MgbmFtZSAnICsgcG0yX2lkKTtcbiAgICAgIHBtMi5zZW5kU2lnbmFsVG9Qcm9jZXNzTmFtZShzaWduYWwsIHBtMl9pZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKGNzdC5QUkVGSVhfTVNHICsgJ1NlbmRpbmcgc2lnbmFsIHRvIHByb2Nlc3MgaWQgJyArIHBtMl9pZCk7XG4gICAgICBwbTIuc2VuZFNpZ25hbFRvUHJvY2Vzc0lkKHNpZ25hbCwgcG0yX2lkKTtcbiAgICB9XG4gIH0pO1xuXG4vL1xuLy8gU3RvcCBhbmQgZGVsZXRlIGEgcHJvY2VzcyBieSBuYW1lIGZyb20gZGF0YWJhc2Vcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgncGluZycpXG4gIC5kZXNjcmlwdGlvbigncGluZyBwbTIgZGFlbW9uIC0gaWYgbm90IHVwIGl0IHdpbGwgbGF1bmNoIGl0JylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLnBpbmcoKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCd1cGRhdGVQTTInKVxuICAuZGVzY3JpcHRpb24oJ3VwZGF0ZSBpbi1tZW1vcnkgUE0yIHdpdGggbG9jYWwgUE0yJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLnVwZGF0ZSgpO1xuICB9KTtcbmNvbW1hbmRlci5jb21tYW5kKCd1cGRhdGUnKVxuICAuZGVzY3JpcHRpb24oJyhhbGlhcykgdXBkYXRlIGluLW1lbW9yeSBQTTIgd2l0aCBsb2NhbCBQTTInKVxuICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICBwbTIudXBkYXRlKCk7XG4gIH0pO1xuXG4vKipcbiAqIE1vZHVsZSBzcGVjaWZpY3NcbiAqL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2luc3RhbGwgPG1vZHVsZXxnaXQ6Ly8gdXJsPicpXG4gIC5hbGlhcygnbW9kdWxlOmluc3RhbGwnKVxuICAub3B0aW9uKCctLXRhcmJhbGwnLCAnaXMgbG9jYWwgdGFyYmFsbCcpXG4gIC5vcHRpb24oJy0taW5zdGFsbCcsICdydW4geWFybiBpbnN0YWxsIGJlZm9yZSBzdGFydGluZyBtb2R1bGUnKVxuICAub3B0aW9uKCctLWRvY2tlcicsICdpcyBkb2NrZXIgY29udGFpbmVyJylcbiAgLm9wdGlvbignLS12MScsICdpbnN0YWxsIG1vZHVsZSBpbiB2MSBtYW5uZXIgKGRvIG5vdCB1c2UgaXQpJylcbiAgLm9wdGlvbignLS1zYWZlIFt0aW1lXScsICdrZWVwIG1vZHVsZSBiYWNrdXAsIGlmIG5ldyBtb2R1bGUgZmFpbCA9IHJlc3RvcmUgd2l0aCBwcmV2aW91cycpXG4gIC5kZXNjcmlwdGlvbignaW5zdGFsbCBvciB1cGRhdGUgYSBtb2R1bGUgYW5kIHJ1biBpdCBmb3JldmVyJylcbiAgLmFjdGlvbihmdW5jdGlvbiAocGx1Z2luX25hbWUsIG9wdHMpIHtcbiAgICByZXF1aXJlKCd1dGlsJykuX2V4dGVuZChjb21tYW5kZXIsIG9wdHMpO1xuICAgIHBtMi5pbnN0YWxsKHBsdWdpbl9uYW1lLCBjb21tYW5kZXIpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ21vZHVsZTp1cGRhdGUgPG1vZHVsZXxnaXQ6Ly8gdXJsPicpXG4gIC5kZXNjcmlwdGlvbigndXBkYXRlIGEgbW9kdWxlIGFuZCBydW4gaXQgZm9yZXZlcicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHBsdWdpbl9uYW1lKSB7XG4gICAgcG0yLmluc3RhbGwocGx1Z2luX25hbWUpO1xuICB9KTtcblxuXG5jb21tYW5kZXIuY29tbWFuZCgnbW9kdWxlOmdlbmVyYXRlIFthcHBfbmFtZV0nKVxuICAuZGVzY3JpcHRpb24oJ0dlbmVyYXRlIGEgc2FtcGxlIG1vZHVsZSBpbiBjdXJyZW50IGZvbGRlcicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGFwcF9uYW1lKSB7XG4gICAgcG0yLmdlbmVyYXRlTW9kdWxlU2FtcGxlKGFwcF9uYW1lKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCd1bmluc3RhbGwgPG1vZHVsZT4nKVxuICAuYWxpYXMoJ21vZHVsZTp1bmluc3RhbGwnKVxuICAuZGVzY3JpcHRpb24oJ3N0b3AgYW5kIHVuaW5zdGFsbCBhIG1vZHVsZScpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHBsdWdpbl9uYW1lKSB7XG4gICAgcG0yLnVuaW5zdGFsbChwbHVnaW5fbmFtZSk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgncGFja2FnZSBbdGFyZ2V0XScpXG4gIC5kZXNjcmlwdGlvbignQ2hlY2sgJiBQYWNrYWdlIFRBUiB0eXBlIG1vZHVsZScpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIHBtMi5wYWNrYWdlKHRhcmdldCk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgncHVibGlzaCBbZm9sZGVyXScpXG4gIC5vcHRpb24oJy0tbnBtJywgJ3B1Ymxpc2ggb24gbnBtJylcbiAgLmFsaWFzKCdtb2R1bGU6cHVibGlzaCcpXG4gIC5kZXNjcmlwdGlvbignUHVibGlzaCB0aGUgbW9kdWxlIHlvdSBhcmUgY3VycmVudGx5IG9uJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoZm9sZGVyLCBvcHRzKSB7XG4gICAgcG0yLnB1Ymxpc2goZm9sZGVyLCBvcHRzKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdzZXQgW2tleV0gW3ZhbHVlXScpXG4gIC5kZXNjcmlwdGlvbignc2V0cyB0aGUgc3BlY2lmaWVkIGNvbmZpZyA8a2V5PiA8dmFsdWU+JylcbiAgLmFjdGlvbihmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHBtMi5zZXQoa2V5LCB2YWx1ZSk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnbXVsdGlzZXQgPHZhbHVlPicpXG4gIC5kZXNjcmlwdGlvbignbXVsdGlzZXQgZWcgXCJrZXkxIHZhbDEga2V5MiB2YWwyJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoc3RyKSB7XG4gICAgcG0yLm11bHRpc2V0KHN0cik7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZ2V0IFtrZXldJylcbiAgLmRlc2NyaXB0aW9uKCdnZXQgdmFsdWUgZm9yIDxrZXk+JylcbiAgLmFjdGlvbihmdW5jdGlvbiAoa2V5KSB7XG4gICAgcG0yLmdldChrZXkpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2NvbmYgW2tleV0gW3ZhbHVlXScpXG4gIC5kZXNjcmlwdGlvbignZ2V0IC8gc2V0IG1vZHVsZSBjb25maWcgdmFsdWVzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHBtMi5nZXQoKVxuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2NvbmZpZyA8a2V5PiBbdmFsdWVdJylcbiAgLmRlc2NyaXB0aW9uKCdnZXQgLyBzZXQgbW9kdWxlIGNvbmZpZyB2YWx1ZXMnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgcG0yLmNvbmYoa2V5LCB2YWx1ZSk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgndW5zZXQgPGtleT4nKVxuICAuZGVzY3JpcHRpb24oJ2NsZWFycyB0aGUgc3BlY2lmaWVkIGNvbmZpZyA8a2V5PicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGtleSkge1xuICAgIHBtMi51bnNldChrZXkpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3JlcG9ydCcpXG4gIC5kZXNjcmlwdGlvbignZ2l2ZSBhIGZ1bGwgcG0yIHJlcG9ydCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL1VuaXRlY2gvcG0yL2lzc3VlcycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGtleSkge1xuICAgIHBtMi5yZXBvcnQoKTtcbiAgfSk7XG5cbi8vXG4vLyBQTTIgSS9PXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2xpbmsgW3NlY3JldF0gW3B1YmxpY10gW25hbWVdJylcbiAgLm9wdGlvbignLS1pbmZvLW5vZGUgW3VybF0nLCAnc2V0IHVybCBpbmZvIG5vZGUnKVxuICAub3B0aW9uKCctLXdzJywgJ3dlYnNvY2tldCBtb2RlJylcbiAgLm9wdGlvbignLS1heG9uJywgJ2F4b24gbW9kZScpXG4gIC5kZXNjcmlwdGlvbignbGluayB3aXRoIHRoZSBwbTIgbW9uaXRvcmluZyBkYXNoYm9hcmQnKVxuICAuYWN0aW9uKHBtMi5saW5rTWFuYWdlbWVudC5iaW5kKHBtMikpO1xuXG5jb21tYW5kZXIuY29tbWFuZCgndW5saW5rJylcbiAgLmRlc2NyaXB0aW9uKCd1bmxpbmsgd2l0aCB0aGUgcG0yIG1vbml0b3JpbmcgZGFzaGJvYXJkJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLnVubGluaygpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ21vbml0b3IgW25hbWVdJylcbiAgLmRlc2NyaXB0aW9uKCdtb25pdG9yIHRhcmdldCBwcm9jZXNzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAobmFtZSkge1xuICAgIGlmIChuYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBwbHVzSGFuZGxlcigpXG4gICAgfVxuICAgIHBtMi5tb25pdG9yU3RhdGUoJ21vbml0b3InLCBuYW1lKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCd1bm1vbml0b3IgW25hbWVdJylcbiAgLmRlc2NyaXB0aW9uKCd1bm1vbml0b3IgdGFyZ2V0IHByb2Nlc3MnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcG0yLm1vbml0b3JTdGF0ZSgndW5tb25pdG9yJywgbmFtZSk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnb3BlbicpXG4gIC5kZXNjcmlwdGlvbignb3BlbiB0aGUgcG0yIG1vbml0b3JpbmcgZGFzaGJvYXJkJylcbiAgLmFjdGlvbihmdW5jdGlvbiAobmFtZSkge1xuICAgIHBtMi5vcGVuRGFzaGJvYXJkKCk7XG4gIH0pO1xuXG5mdW5jdGlvbiBwbHVzSGFuZGxlcihjb21tYW5kPywgb3B0cz8pIHtcbiAgaWYgKG9wdHMgJiYgb3B0cy5pbmZvTm9kZSkge1xuICAgIHByb2Nlc3MuZW52LktFWU1FVFJJQ1NfTk9ERSA9IG9wdHMuaW5mb05vZGVcbiAgfVxuXG4gIHJldHVybiBQTTJpb0hhbmRsZXIubGF1bmNoKGNvbW1hbmQsIG9wdHMpXG59XG5cbmNvbW1hbmRlci5jb21tYW5kKCdwbHVzIFtjb21tYW5kXSBbb3B0aW9uXScpXG4gIC5hbGlhcygncmVnaXN0ZXInKVxuICAub3B0aW9uKCctLWluZm8tbm9kZSBbdXJsXScsICdzZXQgdXJsIGluZm8gbm9kZSBmb3Igb24tcHJlbWlzZSBwbTIgcGx1cycpXG4gIC5vcHRpb24oJy1kIC0tZGlzY3JldGUnLCAnc2lsZW50IG1vZGUnKVxuICAub3B0aW9uKCctYSAtLWluc3RhbGwtYWxsJywgJ2luc3RhbGwgYWxsIG1vZHVsZXMgKGZvcmNlIHllcyknKVxuICAuZGVzY3JpcHRpb24oJ2VuYWJsZSBwbTIgcGx1cycpXG4gIC5hY3Rpb24ocGx1c0hhbmRsZXIpO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnbG9naW4nKVxuICAuZGVzY3JpcHRpb24oJ0xvZ2luIHRvIHBtMiBwbHVzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHBsdXNIYW5kbGVyKCdsb2dpbicpXG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnbG9nb3V0JylcbiAgLmRlc2NyaXB0aW9uKCdMb2dvdXQgZnJvbSBwbTIgcGx1cycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBwbHVzSGFuZGxlcignbG9nb3V0JylcbiAgfSk7XG5cbi8vXG4vLyBTYXZlIHByb2Nlc3NlcyB0byBmaWxlXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2R1bXAnKVxuICAuYWxpYXMoJ3NhdmUnKVxuICAub3B0aW9uKCctLWZvcmNlJywgJ2ZvcmNlIGRlbGV0aW9uIG9mIGR1bXAgZmlsZSwgZXZlbiBpZiBlbXB0eScpXG4gIC5kZXNjcmlwdGlvbignZHVtcCBhbGwgcHJvY2Vzc2VzIGZvciByZXN1cnJlY3RpbmcgdGhlbSBsYXRlcicpXG4gIC5hY3Rpb24oZmFpbE9uVW5rbm93bihmdW5jdGlvbiAob3B0cykge1xuICAgIHBtMi5kdW1wKGNvbW1hbmRlci5mb3JjZSlcbiAgfSkpO1xuXG4vL1xuLy8gRGVsZXRlIGR1bXAgZmlsZVxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdjbGVhcmR1bXAnKVxuICAuZGVzY3JpcHRpb24oJ0NyZWF0ZSBlbXB0eSBkdW1wIGZpbGUnKVxuICAuYWN0aW9uKGZhaWxPblVua25vd24oZnVuY3Rpb24gKCkge1xuICAgIHBtMi5jbGVhckR1bXAoKTtcbiAgfSkpO1xuXG4vL1xuLy8gU2F2ZSBwcm9jZXNzZXMgdG8gZmlsZVxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdzZW5kIDxwbV9pZD4gPGxpbmU+JylcbiAgLmRlc2NyaXB0aW9uKCdzZW5kIHN0ZGluIHRvIDxwbV9pZD4nKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwbV9pZCwgbGluZSkge1xuICAgIHBtMi5zZW5kTGluZVRvU3RkaW4ocG1faWQsIGxpbmUpO1xuICB9KTtcblxuLy9cbi8vIEF0dGFjaCB0byBzdGRpbi9zdGRvdXRcbi8vIE5vdCBUVFkgcmVhZHlcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnYXR0YWNoIDxwbV9pZD4gW2NvbW1hbmQgc2VwYXJhdG9yXScpXG4gIC5kZXNjcmlwdGlvbignYXR0YWNoIHN0ZGluL3N0ZG91dCB0byBhcHBsaWNhdGlvbiBpZGVudGlmaWVkIGJ5IDxwbV9pZD4nKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwbV9pZCwgc2VwYXJhdG9yKSB7XG4gICAgcG0yLmF0dGFjaChwbV9pZCwgc2VwYXJhdG9yKTtcbiAgfSk7XG5cbi8vXG4vLyBSZXN1cnJlY3Rcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgncmVzdXJyZWN0JylcbiAgLmRlc2NyaXB0aW9uKCdyZXN1cnJlY3QgcHJldmlvdXNseSBkdW1wZWQgcHJvY2Vzc2VzJylcbiAgLmFjdGlvbihmYWlsT25Vbmtub3duKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZyhjc3QuUFJFRklYX01TRyArICdSZXN1cnJlY3RpbmcnKTtcbiAgICBwbTIucmVzdXJyZWN0KCk7XG4gIH0pKTtcblxuLy9cbi8vIFNldCBwbTIgdG8gc3RhcnR1cFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCd1bnN0YXJ0dXAgW3BsYXRmb3JtXScpXG4gIC5kZXNjcmlwdGlvbignZGlzYWJsZSB0aGUgcG0yIHN0YXJ0dXAgaG9vaycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHBsYXRmb3JtKSB7XG4gICAgcG0yLnVuaW5zdGFsbFN0YXJ0dXAocGxhdGZvcm0sIGNvbW1hbmRlcik7XG4gIH0pO1xuXG4vL1xuLy8gU2V0IHBtMiB0byBzdGFydHVwXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ3N0YXJ0dXAgW3BsYXRmb3JtXScpXG4gIC5kZXNjcmlwdGlvbignZW5hYmxlIHRoZSBwbTIgc3RhcnR1cCBob29rJylcbiAgLmFjdGlvbihmdW5jdGlvbiAocGxhdGZvcm0pIHtcbiAgICBwbTIuc3RhcnR1cChwbGF0Zm9ybSwgY29tbWFuZGVyKTtcbiAgfSk7XG5cbi8vXG4vLyBMb2dyb3RhdGVcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnbG9ncm90YXRlJylcbiAgLmRlc2NyaXB0aW9uKCdjb3B5IGRlZmF1bHQgbG9ncm90YXRlIGNvbmZpZ3VyYXRpb24nKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChjbWQpIHtcbiAgICBwbTIubG9ncm90YXRlKGNvbW1hbmRlcik7XG4gIH0pO1xuXG4vL1xuLy8gU2FtcGxlIGdlbmVyYXRlXG4vL1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZWNvc3lzdGVtIFttb2RlXScpXG4gIC5hbGlhcygnaW5pdCcpXG4gIC5kZXNjcmlwdGlvbignZ2VuZXJhdGUgYSBwcm9jZXNzIGNvbmYgZmlsZS4gKG1vZGUgPSBudWxsIG9yIHNpbXBsZSknKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChtb2RlKSB7XG4gICAgcG0yLmdlbmVyYXRlU2FtcGxlKG1vZGUpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3Jlc2V0IDxuYW1lfGlkfGFsbD4nKVxuICAuZGVzY3JpcHRpb24oJ3Jlc2V0IGNvdW50ZXJzIGZvciBwcm9jZXNzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAocHJvY19pZCkge1xuICAgIHBtMi5yZXNldChwcm9jX2lkKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdkZXNjcmliZSA8bmFtZXxpZD4nKVxuICAuZGVzY3JpcHRpb24oJ2Rlc2NyaWJlIGFsbCBwYXJhbWV0ZXJzIG9mIGEgcHJvY2VzcycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHByb2NfaWQpIHtcbiAgICBwbTIuZGVzY3JpYmUocHJvY19pZCk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZGVzYyA8bmFtZXxpZD4nKVxuICAuZGVzY3JpcHRpb24oJyhhbGlhcykgZGVzY3JpYmUgYWxsIHBhcmFtZXRlcnMgb2YgYSBwcm9jZXNzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAocHJvY19pZCkge1xuICAgIHBtMi5kZXNjcmliZShwcm9jX2lkKTtcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdpbmZvIDxuYW1lfGlkPicpXG4gIC5kZXNjcmlwdGlvbignKGFsaWFzKSBkZXNjcmliZSBhbGwgcGFyYW1ldGVycyBvZiBhIHByb2Nlc3MnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwcm9jX2lkKSB7XG4gICAgcG0yLmRlc2NyaWJlKHByb2NfaWQpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3Nob3cgPG5hbWV8aWQ+JylcbiAgLmRlc2NyaXB0aW9uKCcoYWxpYXMpIGRlc2NyaWJlIGFsbCBwYXJhbWV0ZXJzIG9mIGEgcHJvY2VzcycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHByb2NfaWQpIHtcbiAgICBwbTIuZGVzY3JpYmUocHJvY19pZCk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZW52IDxpZD4nKVxuICAuZGVzY3JpcHRpb24oJ2xpc3QgYWxsIGVudmlyb25tZW50IHZhcmlhYmxlcyBvZiBhIHByb2Nlc3MgaWQnKVxuICAuYWN0aW9uKGZ1bmN0aW9uIChwcm9jX2lkKSB7XG4gICAgcG0yLmVudihwcm9jX2lkKTtcbiAgfSk7XG5cbi8vXG4vLyBMaXN0IGNvbW1hbmRcbi8vXG5jb21tYW5kZXJcbiAgLmNvbW1hbmQoJ2xpc3QnKVxuICAuYWxpYXMoJ2xzJylcbiAgLmRlc2NyaXB0aW9uKCdsaXN0IGFsbCBwcm9jZXNzZXMnKVxuICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICBwbTIubGlzdChjb21tYW5kZXIpXG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnbCcpXG4gIC5kZXNjcmlwdGlvbignKGFsaWFzKSBsaXN0IGFsbCBwcm9jZXNzZXMnKVxuICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICBwbTIubGlzdCgpXG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgncHMnKVxuICAuZGVzY3JpcHRpb24oJyhhbGlhcykgbGlzdCBhbGwgcHJvY2Vzc2VzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLmxpc3QoKVxuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ3N0YXR1cycpXG4gIC5kZXNjcmlwdGlvbignKGFsaWFzKSBsaXN0IGFsbCBwcm9jZXNzZXMnKVxuICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICBwbTIubGlzdCgpXG4gIH0pO1xuXG5cbi8vIExpc3QgaW4gcmF3IGpzb25cbmNvbW1hbmRlci5jb21tYW5kKCdqbGlzdCcpXG4gIC5kZXNjcmlwdGlvbignbGlzdCBhbGwgcHJvY2Vzc2VzIGluIEpTT04gZm9ybWF0JylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLmpsaXN0KClcbiAgfSk7XG5cbmNvbW1hbmRlci5jb21tYW5kKCdzeXNtb25pdCcpXG4gIC5kZXNjcmlwdGlvbignc3RhcnQgc3lzdGVtIG1vbml0b3JpbmcgZGFlbW9uJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLmxhdW5jaFN5c01vbml0b3JpbmcoKVxuICB9KVxuXG5jb21tYW5kZXIuY29tbWFuZCgnc2xpc3QnKVxuICAuYWxpYXMoJ3N5c2luZm9zJylcbiAgLm9wdGlvbignLXQgLS10cmVlJywgJ3Nob3cgYXMgdHJlZScpXG4gIC5kZXNjcmlwdGlvbignbGlzdCBzeXN0ZW0gaW5mb3MgaW4gSlNPTicpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKG9wdHMpIHtcbiAgICBwbTIuc2xpc3Qob3B0cy50cmVlKVxuICB9KVxuXG4vLyBMaXN0IGluIHByZXR0aWZpZWQgSnNvblxuY29tbWFuZGVyLmNvbW1hbmQoJ3ByZXR0eWxpc3QnKVxuICAuZGVzY3JpcHRpb24oJ3ByaW50IGpzb24gaW4gYSBwcmV0dGlmaWVkIEpTT04nKVxuICAuYWN0aW9uKGZhaWxPblVua25vd24oZnVuY3Rpb24gKCkge1xuICAgIHBtMi5qbGlzdCh0cnVlKTtcbiAgfSkpO1xuXG4vL1xuLy8gRGFzaGJvYXJkIGNvbW1hbmRcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnbW9uaXQnKVxuICAuZGVzY3JpcHRpb24oJ2xhdW5jaCB0ZXJtY2FwcyBtb25pdG9yaW5nJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLmRhc2hib2FyZCgpO1xuICB9KTtcblxuY29tbWFuZGVyLmNvbW1hbmQoJ2ltb25pdCcpXG4gIC5kZXNjcmlwdGlvbignbGF1bmNoIGxlZ2FjeSB0ZXJtY2FwcyBtb25pdG9yaW5nJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLm1vbml0KCk7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnZGFzaGJvYXJkJylcbiAgLmFsaWFzKCdkYXNoJylcbiAgLmRlc2NyaXB0aW9uKCdsYXVuY2ggZGFzaGJvYXJkIHdpdGggbW9uaXRvcmluZyBhbmQgbG9ncycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKCkge1xuICAgIHBtMi5kYXNoYm9hcmQoKTtcbiAgfSk7XG5cblxuLy9cbi8vIEZsdXNoaW5nIGNvbW1hbmRcbi8vXG5cbmNvbW1hbmRlci5jb21tYW5kKCdmbHVzaCBbYXBpXScpXG4gIC5kZXNjcmlwdGlvbignZmx1c2ggbG9ncycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGFwaSkge1xuICAgIHBtMi5mbHVzaChhcGkpO1xuICB9KTtcblxuLyogb2xkIHZlcnNpb25cbmNvbW1hbmRlci5jb21tYW5kKCdmbHVzaCcpXG4gIC5kZXNjcmlwdGlvbignZmx1c2ggbG9ncycpXG4gIC5hY3Rpb24oZmFpbE9uVW5rbm93bihmdW5jdGlvbigpIHtcbiAgICBwbTIuZmx1c2goKTtcbiAgfSkpO1xuKi9cbi8vXG4vLyBSZWxvYWQgYWxsIGxvZ3Ncbi8vXG5jb21tYW5kZXIuY29tbWFuZCgncmVsb2FkTG9ncycpXG4gIC5kZXNjcmlwdGlvbigncmVsb2FkIGFsbCBsb2dzJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgcG0yLnJlbG9hZExvZ3MoKTtcbiAgfSk7XG5cbi8vXG4vLyBMb2cgc3RyZWFtaW5nXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2xvZ3MgW2lkfG5hbWV8bmFtZXNwYWNlXScpXG4gIC5vcHRpb24oJy0tanNvbicsICdqc29uIGxvZyBvdXRwdXQnKVxuICAub3B0aW9uKCctLWZvcm1hdCcsICdmb3JtYXRlZCBsb2cgb3V0cHV0JylcbiAgLm9wdGlvbignLS1yYXcnLCAncmF3IG91dHB1dCcpXG4gIC5vcHRpb24oJy0tZXJyJywgJ29ubHkgc2hvd3MgZXJyb3Igb3V0cHV0JylcbiAgLm9wdGlvbignLS1vdXQnLCAnb25seSBzaG93cyBzdGFuZGFyZCBvdXRwdXQnKVxuICAub3B0aW9uKCctLWxpbmVzIDxuPicsICdvdXRwdXQgdGhlIGxhc3QgTiBsaW5lcywgaW5zdGVhZCBvZiB0aGUgbGFzdCAxNSBieSBkZWZhdWx0JylcbiAgLm9wdGlvbignLS10aW1lc3RhbXAgW2Zvcm1hdF0nLCAnYWRkIHRpbWVzdGFtcHMgKGRlZmF1bHQgZm9ybWF0IFlZWVktTU0tREQtSEg6bW06c3MpJylcbiAgLm9wdGlvbignLS1ub3N0cmVhbScsICdwcmludCBsb2dzIHdpdGhvdXQgbGF1Y2hpbmcgdGhlIGxvZyBzdHJlYW0nKVxuICAub3B0aW9uKCctLWhpZ2hsaWdodCBbdmFsdWVdJywgJ2hpZ2hsaWdodHMgdGhlIGdpdmVuIHZhbHVlJylcbiAgLmRlc2NyaXB0aW9uKCdzdHJlYW0gbG9ncyBmaWxlLiBEZWZhdWx0IHN0cmVhbSBhbGwgbG9ncycpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKGlkLCBjbWQpIHtcblxuICAgIGlmICghaWQpIGlkID0gJ2FsbCc7XG5cbiAgICB2YXIgbGluZSA9IDE1O1xuICAgIHZhciByYXcgPSBmYWxzZTtcbiAgICB2YXIgZXhjbHVzaXZlID0gXCJcIjtcbiAgICB2YXIgdGltZXN0YW1wID0gZmFsc2U7XG4gICAgdmFyIGhpZ2hsaWdodCA9IGZhbHNlO1xuXG4gICAgaWYgKCFpc05hTihwYXJzZUludChjbWQubGluZXMpKSkge1xuICAgICAgbGluZSA9IHBhcnNlSW50KGNtZC5saW5lcyk7XG4gICAgfVxuXG4gICAgaWYgKGNtZC5wYXJlbnQucmF3QXJncy5pbmRleE9mKCctLXJhdycpICE9PSAtMSlcbiAgICAgIHJhdyA9IHRydWU7XG5cbiAgICBpZiAoY21kLnRpbWVzdGFtcClcbiAgICAgIHRpbWVzdGFtcCA9IHR5cGVvZiBjbWQudGltZXN0YW1wID09PSAnc3RyaW5nJyA/IGNtZC50aW1lc3RhbXAgOiAnWVlZWS1NTS1ERC1ISDptbTpzcyc7XG5cbiAgICBpZiAoY21kLmhpZ2hsaWdodClcbiAgICAgIGhpZ2hsaWdodCA9IHR5cGVvZiBjbWQuaGlnaGxpZ2h0ID09PSAnc3RyaW5nJyA/IGNtZC5oaWdobGlnaHQgOiBmYWxzZTtcblxuICAgIGlmIChjbWQub3V0ID09PSB0cnVlKVxuICAgICAgZXhjbHVzaXZlID0gJ291dCc7XG5cbiAgICBpZiAoY21kLmVyciA9PT0gdHJ1ZSlcbiAgICAgIGV4Y2x1c2l2ZSA9ICdlcnInO1xuXG4gICAgaWYgKGNtZC5ub3N0cmVhbSA9PT0gdHJ1ZSlcbiAgICAgIHBtMi5wcmludExvZ3MoaWQsIGxpbmUsIHJhdywgdGltZXN0YW1wLCBleGNsdXNpdmUpO1xuICAgIGVsc2UgaWYgKGNtZC5qc29uID09PSB0cnVlKVxuICAgICAgTG9ncy5qc29uU3RyZWFtKHBtMi5DbGllbnQsIGlkKTtcbiAgICBlbHNlIGlmIChjbWQuZm9ybWF0ID09PSB0cnVlKVxuICAgICAgTG9ncy5mb3JtYXRTdHJlYW0ocG0yLkNsaWVudCwgaWQsIGZhbHNlLCAnWVlZWS1NTS1ERC1ISDptbTpzc1paJywgZXhjbHVzaXZlLCBoaWdobGlnaHQpO1xuICAgIGVsc2VcbiAgICAgIHBtMi5zdHJlYW1Mb2dzKGlkLCBsaW5lLCByYXcsIHRpbWVzdGFtcCwgZXhjbHVzaXZlLCBoaWdobGlnaHQpO1xuICB9KTtcblxuXG4vL1xuLy8gS2lsbFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCdraWxsJylcbiAgLmRlc2NyaXB0aW9uKCdraWxsIGRhZW1vbicpXG4gIC5hY3Rpb24oZmFpbE9uVW5rbm93bihmdW5jdGlvbiAoYXJnKSB7XG4gICAgcG0yLmtpbGxEYWVtb24oZnVuY3Rpb24gKCkge1xuICAgICAgcHJvY2Vzcy5leGl0KGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH0pO1xuICB9KSk7XG5cbi8vXG4vLyBVcGRhdGUgcmVwb3NpdG9yeSBmb3IgYSBnaXZlbiBhcHBcbi8vXG5cbmNvbW1hbmRlci5jb21tYW5kKCdwdWxsIDxuYW1lPiBbY29tbWl0X2lkXScpXG4gIC5kZXNjcmlwdGlvbigndXBkYXRlcyByZXBvc2l0b3J5IGZvciBhIGdpdmVuIGFwcCcpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHBtMl9uYW1lLCBjb21taXRfaWQpIHtcblxuICAgIGlmIChjb21taXRfaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcG0yLl9wdWxsQ29tbWl0SWQoe1xuICAgICAgICBwbTJfbmFtZTogcG0yX25hbWUsXG4gICAgICAgIGNvbW1pdF9pZDogY29tbWl0X2lkXG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZVxuICAgICAgcG0yLnB1bGxBbmRSZXN0YXJ0KHBtMl9uYW1lKTtcbiAgfSk7XG5cbi8vXG4vLyBVcGRhdGUgcmVwb3NpdG9yeSB0byB0aGUgbmV4dCBjb21taXQgZm9yIGEgZ2l2ZW4gYXBwXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2ZvcndhcmQgPG5hbWU+JylcbiAgLmRlc2NyaXB0aW9uKCd1cGRhdGVzIHJlcG9zaXRvcnkgdG8gdGhlIG5leHQgY29tbWl0IGZvciBhIGdpdmVuIGFwcCcpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHBtMl9uYW1lKSB7XG4gICAgcG0yLmZvcndhcmQocG0yX25hbWUpO1xuICB9KTtcblxuLy9cbi8vIERvd25ncmFkZSByZXBvc2l0b3J5IHRvIHRoZSBwcmV2aW91cyBjb21taXQgZm9yIGEgZ2l2ZW4gYXBwXG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ2JhY2t3YXJkIDxuYW1lPicpXG4gIC5kZXNjcmlwdGlvbignZG93bmdyYWRlcyByZXBvc2l0b3J5IHRvIHRoZSBwcmV2aW91cyBjb21taXQgZm9yIGEgZ2l2ZW4gYXBwJylcbiAgLmFjdGlvbihmdW5jdGlvbiAocG0yX25hbWUpIHtcbiAgICBwbTIuYmFja3dhcmQocG0yX25hbWUpO1xuICB9KTtcblxuLy9cbi8vIFBlcmZvcm0gYSBkZWVwIHVwZGF0ZSBvZiBQTTJcbi8vXG5jb21tYW5kZXIuY29tbWFuZCgnZGVlcFVwZGF0ZScpXG4gIC5kZXNjcmlwdGlvbigncGVyZm9ybXMgYSBkZWVwIHVwZGF0ZSBvZiBQTTInKVxuICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICBwbTIuZGVlcFVwZGF0ZSgpO1xuICB9KTtcblxuLy9cbi8vIExhdW5jaCBhIGh0dHAgc2VydmVyIHRoYXQgZXhwb3NlIGEgZ2l2ZW4gcGF0aCBvbiBnaXZlbiBwb3J0XG4vL1xuY29tbWFuZGVyLmNvbW1hbmQoJ3NlcnZlIFtwYXRoXSBbcG9ydF0nKVxuICAuYWxpYXMoJ2V4cG9zZScpXG4gIC5vcHRpb24oJy0tcG9ydCBbcG9ydF0nLCAnc3BlY2lmeSBwb3J0IHRvIGxpc3RlbiB0bycpXG4gIC5vcHRpb24oJy0tc3BhJywgJ2Fsd2F5cyBzZXJ2aW5nIGluZGV4Lmh0bWwgb24gaW5leGlzdGFudCBzdWIgcGF0aCcpXG4gIC5vcHRpb24oJy0tYmFzaWMtYXV0aC11c2VybmFtZSBbdXNlcm5hbWVdJywgJ3NldCBiYXNpYyBhdXRoIHVzZXJuYW1lJylcbiAgLm9wdGlvbignLS1iYXNpYy1hdXRoLXBhc3N3b3JkIFtwYXNzd29yZF0nLCAnc2V0IGJhc2ljIGF1dGggcGFzc3dvcmQnKVxuICAub3B0aW9uKCctLW1vbml0b3IgW2Zyb250ZW5kLWFwcF0nLCAnZnJvbnRlbmQgYXBwIG1vbml0b3JpbmcgKGF1dG8gaW50ZWdyYXRlIHNuaXBwZXQgb24gaHRtbCBmaWxlcyknKVxuICAuZGVzY3JpcHRpb24oJ3NlcnZlIGEgZGlyZWN0b3J5IG92ZXIgaHR0cCB2aWEgcG9ydCcpXG4gIC5hY3Rpb24oZnVuY3Rpb24gKHBhdGgsIHBvcnQsIGNtZCkge1xuICAgIHBtMi5zZXJ2ZShwYXRoLCBwb3J0IHx8IGNtZC5wb3J0LCBjbWQsIGNvbW1hbmRlcik7XG4gIH0pO1xuXG5jb21tYW5kZXIuY29tbWFuZCgnYXV0b2luc3RhbGwnKVxuICAuYWN0aW9uKGZ1bmN0aW9uICgpIHtcbiAgICBwbTIuYXV0b2luc3RhbGwoKVxuICB9KVxuXG5jb21tYW5kZXIuY29tbWFuZCgnZXhhbXBsZXMnKVxuICAuZGVzY3JpcHRpb24oJ2Rpc3BsYXkgcG0yIHVzYWdlIGV4YW1wbGVzJylcbiAgLmFjdGlvbigoKSA9PiB7XG4gICAgY29uc29sZS5sb2coY3N0LlBSRUZJWF9NU0cgKyBjaGFsay5ncmV5KCdwbTIgdXNhZ2UgZXhhbXBsZXM6XFxuJykpO1xuICAgIGRpc3BsYXlFeGFtcGxlcygpO1xuICAgIHByb2Nlc3MuZXhpdChjc3QuU1VDQ0VTU19FWElUKTtcbiAgfSlcblxuLy9cbi8vIENhdGNoIGFsbFxuLy9cbmNvbW1hbmRlci5jb21tYW5kKCcqJylcbiAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coY3N0LlBSRUZJWF9NU0dfRVJSICsgY2hhbGsuYm9sZCgnQ29tbWFuZCBub3QgZm91bmRcXG4nKSk7XG4gICAgZGlzcGxheVVzYWdlKCk7XG4gICAgLy8gQ2hlY2sgaWYgaXQgZG9lcyBub3QgZm9yZ2V0IHRvIGNsb3NlIGZkcyBmcm9tIFJQQ1xuICAgIHByb2Nlc3MuZXhpdChjc3QuRVJST1JfRVhJVCk7XG4gIH0pO1xuXG4vL1xuLy8gRGlzcGxheSBoZWxwIGlmIDAgYXJndW1lbnRzIHBhc3NlZCB0byBwbTJcbi8vXG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aCA9PSAyKSB7XG4gIGNvbW1hbmRlci5wYXJzZShwcm9jZXNzLmFyZ3YpO1xuICBkaXNwbGF5VXNhZ2UoKTtcbiAgLy8gQ2hlY2sgaWYgaXQgZG9lcyBub3QgZm9yZ2V0IHRvIGNsb3NlIGZkcyBmcm9tIFJQQ1xuICBwcm9jZXNzLmV4aXQoY3N0LkVSUk9SX0VYSVQpO1xufVxuIl19