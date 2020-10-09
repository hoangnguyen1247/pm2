"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _cliTableau = _interopRequireDefault(require("cli-tableau"));

var _chalk = _interopRequireDefault(require("chalk"));

var _helpers = _interopRequireDefault(require("./helpers.js"));

var _Common = _interopRequireDefault(require("../../Common.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var postModuleInfos = function postModuleInfos(module_name, human_info) {
  var table = new _cliTableau["default"]({
    style: {
      'padding-left': 1,
      head: ['cyan', 'bold'],
      compact: true
    }
  });
  var disp = {};
  human_info.unshift(['Module name', module_name]);
  human_info.forEach(function (info) {
    var obj = {};
    obj[_chalk["default"].bold.cyan(info[0])] = info[1];
    table.push(obj);
  });
  console.log();
  console.log(_chalk["default"].bold.inverse(' Module %s infos '), module_name);
  console.log(table.toString());
};
/**
 * Description
 * @method describeTable
 * @param {Object} proc process list
 */


function _default(proc) {
  var table = new _cliTableau["default"]({
    style: {
      'padding-left': 1,
      head: ['cyan', 'bold'],
      compact: true
    }
  });
  var pm2_env = proc.pm2_env;
  var created_at = 'N/A';

  if (pm2_env.axm_options && pm2_env.axm_options.human_info) {
    postModuleInfos(pm2_env.name, pm2_env.axm_options.human_info);
  }

  try {
    if (pm2_env.created_at != null) created_at = new Date(pm2_env.created_at).toISOString();
  } catch (e) {}

  console.log(_chalk["default"].bold.inverse(' Describing process with id %d - name %s '), pm2_env.pm_id, pm2_env.name);

  _helpers["default"].safe_push(table, {
    'status': _helpers["default"].colorStatus(pm2_env.status)
  }, {
    'name': pm2_env.name
  }, {
    'namespace': pm2_env.namespace
  }, {
    'version': pm2_env.version
  }, {
    'restarts': pm2_env.restart_time
  }, {
    'uptime': pm2_env.pm_uptime && pm2_env.status == 'online' ? _helpers["default"].timeSince(pm2_env.pm_uptime) : 0
  }, {
    'script path': pm2_env.pm_exec_path
  }, {
    'script args': pm2_env.args ? (typeof pm2_env.args == 'string' ? JSON.parse(pm2_env.args.replace(/'/g, '"')) : pm2_env.args).join(' ') : null
  }, {
    'error log path': pm2_env.pm_err_log_path
  }, {
    'out log path': pm2_env.pm_out_log_path
  }, {
    'pid path': pm2_env.pm_pid_path
  }, {
    'interpreter': pm2_env.exec_interpreter
  }, {
    'interpreter args': pm2_env.node_args.length != 0 ? pm2_env.node_args : null
  }, {
    'script id': pm2_env.pm_id
  }, {
    'exec cwd': pm2_env.pm_cwd
  }, {
    'exec mode': pm2_env.exec_mode
  }, {
    'node.js version': pm2_env.node_version
  }, {
    'node env': pm2_env.env.NODE_ENV
  }, {
    'watch & reload': pm2_env.watch ? _chalk["default"].green.bold('✔') : '✘'
  }, {
    'unstable restarts': pm2_env.unstable_restarts
  }, {
    'created at': created_at
  });

  if ('pm_log_path' in pm2_env) {
    table.splice(6, 0, {
      'entire log path': pm2_env.pm_log_path
    });
  }

  if ('cron_restart' in pm2_env) {
    table.splice(5, 0, {
      'cron restart': pm2_env.cron_restart
    });
  }

  console.log(table.toString());
  /**
   * Module conf display
   */

  if (pm2_env.axm_options && pm2_env.axm_options.module_conf && Object.keys(pm2_env.axm_options.module_conf).length > 0) {
    var table_conf = new _cliTableau["default"]({
      style: {
        'padding-left': 1,
        head: ['cyan', 'bold'],
        compact: true
      }
    });
    console.log('Process configuration');
    Object.keys(pm2_env.axm_options.module_conf).forEach(function (key) {
      var tmp = {};
      tmp[key] = pm2_env.axm_options.module_conf[key];

      _helpers["default"].safe_push(table_conf, tmp);
    });
    console.log(table_conf.toString());
  }
  /**
   * Versioning metadata
   */


  if (pm2_env.versioning) {
    var table2 = new _cliTableau["default"]({
      style: {
        'padding-left': 1,
        head: ['cyan', 'bold'],
        compact: true
      }
    });
    console.log(_chalk["default"].inverse.bold(' Revision control metadata '));

    _helpers["default"].safe_push(table2, {
      'revision control': pm2_env.versioning.type
    }, {
      'remote url': pm2_env.versioning.url
    }, {
      'repository root': pm2_env.versioning.repo_path
    }, {
      'last update': pm2_env.versioning.update_time
    }, {
      'revision': pm2_env.versioning.revision
    }, {
      'comment': pm2_env.versioning.comment ? pm2_env.versioning.comment.trim().slice(0, 60) : ''
    }, {
      'branch': pm2_env.versioning.branch
    });

    console.log(table2.toString());
  }

  if (pm2_env.axm_actions && Object.keys(pm2_env.axm_actions).length > 0) {
    var table_actions = new _cliTableau["default"]({
      style: {
        'padding-left': 1,
        head: ['cyan', 'bold'],
        compact: true
      }
    });
    console.log(_chalk["default"].inverse.bold(' Actions available '));
    pm2_env.axm_actions.forEach(function (action_set) {
      _helpers["default"].safe_push(table_actions, [action_set.action_name]);
    });
    console.log(table_actions.toString());

    _Common["default"].printOut(_chalk["default"].white.italic(' Trigger via: pm2 trigger %s <action_name>\n'), pm2_env.name);
  }

  if (pm2_env.axm_monitor && Object.keys(pm2_env.axm_monitor).length > 0) {
    var table_probes = new _cliTableau["default"]({
      style: {
        'padding-left': 1,
        head: ['cyan', 'bold'],
        compact: true
      }
    });
    console.log(_chalk["default"].inverse.bold(' Code metrics value '));
    Object.keys(pm2_env.axm_monitor).forEach(function (key) {
      var obj = {};
      var metric_name = pm2_env.axm_monitor[key].hasOwnProperty("value") ? pm2_env.axm_monitor[key].value : pm2_env.axm_monitor[key];
      var metric_unit = pm2_env.axm_monitor[key].hasOwnProperty("unit") ? pm2_env.axm_monitor[key].unit : '';
      var value = "".concat(metric_name, " ").concat(metric_unit);
      obj[key] = value;

      _helpers["default"].safe_push(table_probes, obj);
    });
    console.log(table_probes.toString());
  }

  var table_env = new _cliTableau["default"]({
    style: {
      'padding-left': 1,
      head: ['cyan', 'bold'],
      compact: true
    }
  });
  console.log(_chalk["default"].inverse.bold(' Divergent env variables from local env '));

  var _env = _Common["default"].safeExtend({}, pm2_env);

  var diff_env = {};
  Object.keys(process.env).forEach(function (k) {
    if (!_env[k] || _env[k] != process.env[k]) {
      diff_env[k] = process.env[k];
    }
  });
  Object.keys(diff_env).forEach(function (key) {
    var obj = {};

    if (_env[key]) {
      obj[key] = _env[key].slice(0, process.stdout.columns - 60);

      _helpers["default"].safe_push(table_env, obj);
    }
  });
  console.log(table_env.toString());
  console.log();

  _Common["default"].printOut(_chalk["default"].white.italic(' Add your own code metrics: http://bit.ly/code-metrics'));

  _Common["default"].printOut(_chalk["default"].white.italic(' Use `pm2 logs %s [--lines 1000]` to display logs'), pm2_env.name);

  _Common["default"].printOut(_chalk["default"].white.italic(' Use `pm2 env %s` to display environment variables'), pm2_env.pm_id);

  _Common["default"].printOut(_chalk["default"].white.italic(' Use `pm2 monit` to monitor CPU and Memory usage'), pm2_env.name);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvVVgvcG0yLWRlc2NyaWJlLnRzIl0sIm5hbWVzIjpbInBvc3RNb2R1bGVJbmZvcyIsIm1vZHVsZV9uYW1lIiwiaHVtYW5faW5mbyIsInRhYmxlIiwiVGFibGUiLCJzdHlsZSIsImhlYWQiLCJjb21wYWN0IiwiZGlzcCIsInVuc2hpZnQiLCJmb3JFYWNoIiwiaW5mbyIsIm9iaiIsImNoYWxrIiwiYm9sZCIsImN5YW4iLCJwdXNoIiwiY29uc29sZSIsImxvZyIsImludmVyc2UiLCJ0b1N0cmluZyIsInByb2MiLCJwbTJfZW52IiwiY3JlYXRlZF9hdCIsImF4bV9vcHRpb25zIiwibmFtZSIsIkRhdGUiLCJ0b0lTT1N0cmluZyIsImUiLCJwbV9pZCIsIlV4SGVscGVycyIsInNhZmVfcHVzaCIsImNvbG9yU3RhdHVzIiwic3RhdHVzIiwibmFtZXNwYWNlIiwidmVyc2lvbiIsInJlc3RhcnRfdGltZSIsInBtX3VwdGltZSIsInRpbWVTaW5jZSIsInBtX2V4ZWNfcGF0aCIsImFyZ3MiLCJKU09OIiwicGFyc2UiLCJyZXBsYWNlIiwiam9pbiIsInBtX2Vycl9sb2dfcGF0aCIsInBtX291dF9sb2dfcGF0aCIsInBtX3BpZF9wYXRoIiwiZXhlY19pbnRlcnByZXRlciIsIm5vZGVfYXJncyIsImxlbmd0aCIsInBtX2N3ZCIsImV4ZWNfbW9kZSIsIm5vZGVfdmVyc2lvbiIsImVudiIsIk5PREVfRU5WIiwid2F0Y2giLCJncmVlbiIsInVuc3RhYmxlX3Jlc3RhcnRzIiwic3BsaWNlIiwicG1fbG9nX3BhdGgiLCJjcm9uX3Jlc3RhcnQiLCJtb2R1bGVfY29uZiIsIk9iamVjdCIsImtleXMiLCJ0YWJsZV9jb25mIiwia2V5IiwidG1wIiwidmVyc2lvbmluZyIsInRhYmxlMiIsInR5cGUiLCJ1cmwiLCJyZXBvX3BhdGgiLCJ1cGRhdGVfdGltZSIsInJldmlzaW9uIiwiY29tbWVudCIsInRyaW0iLCJzbGljZSIsImJyYW5jaCIsImF4bV9hY3Rpb25zIiwidGFibGVfYWN0aW9ucyIsImFjdGlvbl9zZXQiLCJhY3Rpb25fbmFtZSIsIkNvbW1vbiIsInByaW50T3V0Iiwid2hpdGUiLCJpdGFsaWMiLCJheG1fbW9uaXRvciIsInRhYmxlX3Byb2JlcyIsIm1ldHJpY19uYW1lIiwiaGFzT3duUHJvcGVydHkiLCJ2YWx1ZSIsIm1ldHJpY191bml0IiwidW5pdCIsInRhYmxlX2VudiIsIl9lbnYiLCJzYWZlRXh0ZW5kIiwiZGlmZl9lbnYiLCJwcm9jZXNzIiwiayIsInN0ZG91dCIsImNvbHVtbnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLElBQUlBLGVBQWUsR0FBRyxTQUFsQkEsZUFBa0IsQ0FBU0MsV0FBVCxFQUFzQkMsVUFBdEIsRUFBa0M7QUFDdEQsTUFBSUMsS0FBSyxHQUFHLElBQUlDLHNCQUFKLENBQVU7QUFDcEJDLElBQUFBLEtBQUssRUFBRztBQUFDLHNCQUFpQixDQUFsQjtBQUFxQkMsTUFBQUEsSUFBSSxFQUFHLENBQUMsTUFBRCxFQUFTLE1BQVQsQ0FBNUI7QUFBOENDLE1BQUFBLE9BQU8sRUFBRztBQUF4RDtBQURZLEdBQVYsQ0FBWjtBQUlBLE1BQUlDLElBQUksR0FBRyxFQUFYO0FBRUFOLEVBQUFBLFVBQVUsQ0FBQ08sT0FBWCxDQUFtQixDQUFDLGFBQUQsRUFBZ0JSLFdBQWhCLENBQW5CO0FBQ0FDLEVBQUFBLFVBQVUsQ0FBQ1EsT0FBWCxDQUFtQixVQUFTQyxJQUFULEVBQWU7QUFDaEMsUUFBSUMsR0FBRyxHQUFHLEVBQVY7QUFDQUEsSUFBQUEsR0FBRyxDQUFDQyxrQkFBTUMsSUFBTixDQUFXQyxJQUFYLENBQWdCSixJQUFJLENBQUMsQ0FBRCxDQUFwQixDQUFELENBQUgsR0FBZ0NBLElBQUksQ0FBQyxDQUFELENBQXBDO0FBQ0FSLElBQUFBLEtBQUssQ0FBQ2EsSUFBTixDQUFXSixHQUFYO0FBQ0QsR0FKRDtBQU1BSyxFQUFBQSxPQUFPLENBQUNDLEdBQVI7QUFDQUQsRUFBQUEsT0FB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LEVBQXdGaEUsT0FBTyxDQUFDRyxJQUFoRztBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFRhYmxlIGZyb20gJ2NsaS10YWJsZWF1JztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgVXhIZWxwZXJzIGZyb20gJy4vaGVscGVycy5qcyc7XG5pbXBvcnQgQ29tbW9uIGZyb20gJy4uLy4uL0NvbW1vbi5qcyc7XG5cbnZhciBwb3N0TW9kdWxlSW5mb3MgPSBmdW5jdGlvbihtb2R1bGVfbmFtZSwgaHVtYW5faW5mbykge1xuICB2YXIgdGFibGUgPSBuZXcgVGFibGUoe1xuICAgIHN0eWxlIDogeydwYWRkaW5nLWxlZnQnIDogMSwgaGVhZCA6IFsnY3lhbicsICdib2xkJ10sIGNvbXBhY3QgOiB0cnVlfVxuICB9KVxuXG4gIHZhciBkaXNwID0ge31cblxuICBodW1hbl9pbmZvLnVuc2hpZnQoWydNb2R1bGUgbmFtZScsIG1vZHVsZV9uYW1lXSlcbiAgaHVtYW5faW5mby5mb3JFYWNoKGZ1bmN0aW9uKGluZm8pIHtcbiAgICB2YXIgb2JqID0ge31cbiAgICBvYmpbY2hhbGsuYm9sZC5jeWFuKGluZm9bMF0pXSA9IGluZm9bMV1cbiAgICB0YWJsZS5wdXNoKG9iailcbiAgfSlcblxuICBjb25zb2xlLmxvZygpXG4gIGNvbnNvbGUubG9nKGNoYWxrLmJvbGQuaW52ZXJzZSgnIE1vZHVsZSAlcyBpbmZvcyAnKSwgbW9kdWxlX25hbWUpXG4gIGNvbnNvbGUubG9nKHRhYmxlLnRvU3RyaW5nKCkpXG59XG5cbi8qKlxuICogRGVzY3JpcHRpb25cbiAqIEBtZXRob2QgZGVzY3JpYmVUYWJsZVxuICogQHBhcmFtIHtPYmplY3R9IHByb2MgcHJvY2VzcyBsaXN0XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHByb2MpIHtcbiAgdmFyIHRhYmxlID0gbmV3IFRhYmxlKHtcbiAgICBzdHlsZSA6IHsncGFkZGluZy1sZWZ0JyA6IDEsIGhlYWQgOiBbJ2N5YW4nLCAnYm9sZCddLCBjb21wYWN0IDogdHJ1ZX1cbiAgfSlcblxuICB2YXIgcG0yX2VudiA9IHByb2MucG0yX2VudlxuXG4gIHZhciBjcmVhdGVkX2F0ID0gJ04vQSdcblxuICBpZiAocG0yX2Vudi5heG1fb3B0aW9ucyAmJiBwbTJfZW52LmF4bV9vcHRpb25zLmh1bWFuX2luZm8pIHtcbiAgICBwb3N0TW9kdWxlSW5mb3MocG0yX2Vudi5uYW1lLCBwbTJfZW52LmF4bV9vcHRpb25zLmh1bWFuX2luZm8pXG4gIH1cblxuICB0cnkge1xuICAgIGlmIChwbTJfZW52LmNyZWF0ZWRfYXQgIT0gbnVsbClcbiAgICAgIGNyZWF0ZWRfYXQgPSBuZXcgRGF0ZShwbTJfZW52LmNyZWF0ZWRfYXQpLnRvSVNPU3RyaW5nKClcbiAgfSBjYXRjaCAoZSkge1xuICB9XG5cbiAgY29uc29sZS5sb2coY2hhbGsuYm9sZC5pbnZlcnNlKCcgRGVzY3JpYmluZyBwcm9jZXNzIHdpdGggaWQgJWQgLSBuYW1lICVzICcpLCBwbTJfZW52LnBtX2lkLCBwbTJfZW52Lm5hbWUpXG4gIFV4SGVscGVycy5zYWZlX3B1c2godGFibGUsXG4gICAgICAgICAgICB7ICdzdGF0dXMnIDogVXhIZWxwZXJzLmNvbG9yU3RhdHVzKHBtMl9lbnYuc3RhdHVzKSB9LFxuICAgICAgICAgICAgeyAnbmFtZSc6IHBtMl9lbnYubmFtZSB9LFxuICAgICAgICAgICAgeyAnbmFtZXNwYWNlJzogcG0yX2Vudi5uYW1lc3BhY2UgfSxcbiAgICAgICAgICAgIHsgJ3ZlcnNpb24nOiBwbTJfZW52LnZlcnNpb24gfSxcbiAgICAgICAgICAgIHsgJ3Jlc3RhcnRzJyA6IHBtMl9lbnYucmVzdGFydF90aW1lIH0sXG4gICAgICAgICAgICB7ICd1cHRpbWUnIDogKHBtMl9lbnYucG1fdXB0aW1lICYmIHBtMl9lbnYuc3RhdHVzID09ICdvbmxpbmUnKSA/IFV4SGVscGVycy50aW1lU2luY2UocG0yX2Vudi5wbV91cHRpbWUpIDogMCB9LFxuICAgICAgICAgICAgeyAnc2NyaXB0IHBhdGgnIDogcG0yX2Vudi5wbV9leGVjX3BhdGggfSxcbiAgICAgICAgICAgIHsgJ3NjcmlwdCBhcmdzJyA6IHBtMl9lbnYuYXJncyA/ICh0eXBlb2YgcG0yX2Vudi5hcmdzID09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShwbTJfZW52LmFyZ3MucmVwbGFjZSgvJy9nLCAnXCInKSk6cG0yX2Vudi5hcmdzKS5qb2luKCcgJykgOiBudWxsIH0sXG4gICAgICAgICAgICB7ICdlcnJvciBsb2cgcGF0aCcgOiBwbTJfZW52LnBtX2Vycl9sb2dfcGF0aCB9LFxuICAgICAgICAgICAgeyAnb3V0IGxvZyBwYXRoJyA6IHBtMl9lbnYucG1fb3V0X2xvZ19wYXRoIH0sXG4gICAgICAgICAgICB7ICdwaWQgcGF0aCcgOiBwbTJfZW52LnBtX3BpZF9wYXRoIH0sXG5cbiAgICAgICAgICAgIHsgJ2ludGVycHJldGVyJyA6IHBtMl9lbnYuZXhlY19pbnRlcnByZXRlciB9LFxuICAgICAgICAgICAgeyAnaW50ZXJwcmV0ZXIgYXJncycgOiBwbTJfZW52Lm5vZGVfYXJncy5sZW5ndGggIT0gMCA/IHBtMl9lbnYubm9kZV9hcmdzIDogbnVsbCB9LFxuXG4gICAgICAgICAgICB7ICdzY3JpcHQgaWQnIDogcG0yX2Vudi5wbV9pZCB9LFxuICAgICAgICAgICAgeyAnZXhlYyBjd2QnIDogcG0yX2Vudi5wbV9jd2QgfSxcblxuICAgICAgICAgICAgeyAnZXhlYyBtb2RlJyA6IHBtMl9lbnYuZXhlY19tb2RlIH0sXG4gICAgICAgICAgICB7ICdub2RlLmpzIHZlcnNpb24nIDogcG0yX2Vudi5ub2RlX3ZlcnNpb24gfSxcbiAgICAgICAgICAgIHsgJ25vZGUgZW52JzogcG0yX2Vudi5lbnYuTk9ERV9FTlYgfSxcbiAgICAgICAgICAgIHsgJ3dhdGNoICYgcmVsb2FkJyA6IHBtMl9lbnYud2F0Y2ggPyBjaGFsay5ncmVlbi5ib2xkKCfinJQnKSA6ICfinJgnIH0sXG4gICAgICAgICAgICB7ICd1bnN0YWJsZSByZXN0YXJ0cycgOiBwbTJfZW52LnVuc3RhYmxlX3Jlc3RhcnRzIH0sXG4gICAgICAgICAgICB7ICdjcmVhdGVkIGF0JyA6IGNyZWF0ZWRfYXQgfVxuICAgICAgICAgICApXG5cbiAgaWYgKCdwbV9sb2dfcGF0aCcgaW4gcG0yX2Vudil7XG4gICAgdGFibGUuc3BsaWNlKDYsIDAsIHsnZW50aXJlIGxvZyBwYXRoJzogcG0yX2Vudi5wbV9sb2dfcGF0aH0pXG4gIH1cblxuICBpZiAoJ2Nyb25fcmVzdGFydCcgaW4gcG0yX2Vudil7XG4gICAgdGFibGUuc3BsaWNlKDUsIDAsIHsnY3JvbiByZXN0YXJ0JzogcG0yX2Vudi5jcm9uX3Jlc3RhcnR9KVxuICB9XG5cbiAgY29uc29sZS5sb2codGFibGUudG9TdHJpbmcoKSlcblxuICAvKipcbiAgICogTW9kdWxlIGNvbmYgZGlzcGxheVxuICAgKi9cbiAgaWYgKHBtMl9lbnYuYXhtX29wdGlvbnMgJiZcbiAgICAgIHBtMl9lbnYuYXhtX29wdGlvbnMubW9kdWxlX2NvbmYgJiZcbiAgICAgIE9iamVjdC5rZXlzKHBtMl9lbnYuYXhtX29wdGlvbnMubW9kdWxlX2NvbmYpLmxlbmd0aCA+IDApIHtcbiAgICB2YXIgdGFibGVfY29uZiA9IG5ldyBUYWJsZSh7XG4gICAgICBzdHlsZSA6IHsncGFkZGluZy1sZWZ0JyA6IDEsIGhlYWQgOiBbJ2N5YW4nLCAnYm9sZCddLCBjb21wYWN0IDogdHJ1ZX1cbiAgICB9KVxuICAgIGNvbnNvbGUubG9nKCdQcm9jZXNzIGNvbmZpZ3VyYXRpb24nKVxuXG4gICAgT2JqZWN0LmtleXMocG0yX2Vudi5heG1fb3B0aW9ucy5tb2R1bGVfY29uZikuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciB0bXAgPSB7fVxuICAgICAgdG1wW2tleV0gPSBwbTJfZW52LmF4bV9vcHRpb25zLm1vZHVsZV9jb25mW2tleV1cbiAgICAgIFV4SGVscGVycy5zYWZlX3B1c2godGFibGVfY29uZiwgdG1wKVxuICAgIH0pXG5cbiAgICBjb25zb2xlLmxvZyh0YWJsZV9jb25mLnRvU3RyaW5nKCkpXG4gIH1cblxuICAvKipcbiAgICogVmVyc2lvbmluZyBtZXRhZGF0YVxuICAgKi9cbiAgaWYgKHBtMl9lbnYudmVyc2lvbmluZykge1xuXG4gICAgdmFyIHRhYmxlMiA9IG5ldyBUYWJsZSh7XG4gICAgICBzdHlsZSA6IHsncGFkZGluZy1sZWZ0JyA6IDEsIGhlYWQgOiBbJ2N5YW4nLCAnYm9sZCddLCBjb21wYWN0IDogdHJ1ZX1cbiAgICB9KVxuXG4gICAgY29uc29sZS5sb2coY2hhbGsuaW52ZXJzZS5ib2xkKCcgUmV2aXNpb24gY29udHJvbCBtZXRhZGF0YSAnKSlcbiAgICBVeEhlbHBlcnMuc2FmZV9wdXNoKHRhYmxlMixcbiAgICAgICAgICAgICAgeyAncmV2aXNpb24gY29udHJvbCcgOiBwbTJfZW52LnZlcnNpb25pbmcudHlwZSB9LFxuICAgICAgICAgICAgICB7ICdyZW1vdGUgdXJsJyA6IHBtMl9lbnYudmVyc2lvbmluZy51cmwgfSxcbiAgICAgICAgICAgICAgeyAncmVwb3NpdG9yeSByb290JyA6IHBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGggfSxcbiAgICAgICAgICAgICAgeyAnbGFzdCB1cGRhdGUnIDogcG0yX2Vudi52ZXJzaW9uaW5nLnVwZGF0ZV90aW1lIH0sXG4gICAgICAgICAgICAgIHsgJ3JldmlzaW9uJyA6IHBtMl9lbnYudmVyc2lvbmluZy5yZXZpc2lvbiB9LFxuICAgICAgICAgICAgICB7ICdjb21tZW50JyA6ICBwbTJfZW52LnZlcnNpb25pbmcuY29tbWVudCA/IHBtMl9lbnYudmVyc2lvbmluZy5jb21tZW50LnRyaW0oKS5zbGljZSgwLCA2MCkgOiAnJyB9LFxuICAgICAgICAgICAgICB7ICdicmFuY2gnIDogIHBtMl9lbnYudmVyc2lvbmluZy5icmFuY2ggfVxuICAgICAgICAgICAgIClcbiAgICBjb25zb2xlLmxvZyh0YWJsZTIudG9TdHJpbmcoKSlcbiAgfVxuXG4gIGlmIChwbTJfZW52LmF4bV9hY3Rpb25zICYmIE9iamVjdC5rZXlzKHBtMl9lbnYuYXhtX2FjdGlvbnMpLmxlbmd0aCA+IDApIHtcbiAgICB2YXIgdGFibGVfYWN0aW9ucyA9IG5ldyBUYWJsZSh7XG4gICAgICBzdHlsZSA6IHsncGFkZGluZy1sZWZ0JyA6IDEsIGhlYWQgOiBbJ2N5YW4nLCAnYm9sZCddLCBjb21wYWN0IDogdHJ1ZX1cbiAgICB9KVxuXG4gICAgY29uc29sZS5sb2coY2hhbGsuaW52ZXJzZS5ib2xkKCcgQWN0aW9ucyBhdmFpbGFibGUgJykpXG4gICAgcG0yX2Vudi5heG1fYWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGFjdGlvbl9zZXQpIHtcbiAgICAgIFV4SGVscGVycy5zYWZlX3B1c2godGFibGVfYWN0aW9ucywgW2FjdGlvbl9zZXQuYWN0aW9uX25hbWVdKVxuICAgIH0pXG5cbiAgICBjb25zb2xlLmxvZyh0YWJsZV9hY3Rpb25zLnRvU3RyaW5nKCkpXG4gICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLndoaXRlLml0YWxpYygnIFRyaWdnZXIgdmlhOiBwbTIgdHJpZ2dlciAlcyA8YWN0aW9uX25hbWU+XFxuJyksIHBtMl9lbnYubmFtZSlcbiAgfVxuXG4gIGlmIChwbTJfZW52LmF4bV9tb25pdG9yICYmIE9iamVjdC5rZXlzKHBtMl9lbnYuYXhtX21vbml0b3IpLmxlbmd0aCA+IDApIHtcbiAgICB2YXIgdGFibGVfcHJvYmVzID0gbmV3IFRhYmxlKHtcbiAgICAgIHN0eWxlIDogeydwYWRkaW5nLWxlZnQnIDogMSwgaGVhZCA6IFsnY3lhbicsICdib2xkJ10sIGNvbXBhY3QgOiB0cnVlfVxuICAgIH0pXG5cbiAgICBjb25zb2xlLmxvZyhjaGFsay5pbnZlcnNlLmJvbGQoJyBDb2RlIG1ldHJpY3MgdmFsdWUgJykpXG4gICAgT2JqZWN0LmtleXMocG0yX2Vudi5heG1fbW9uaXRvcikuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBvYmogPSB7fVxuICAgICAgdmFyIG1ldHJpY19uYW1lID0gcG0yX2Vudi5heG1fbW9uaXRvcltrZXldLmhhc093blByb3BlcnR5KFwidmFsdWVcIikgPyBwbTJfZW52LmF4bV9tb25pdG9yW2tleV0udmFsdWUgOiBwbTJfZW52LmF4bV9tb25pdG9yW2tleV1cbiAgICAgIHZhciBtZXRyaWNfdW5pdCA9IHBtMl9lbnYuYXhtX21vbml0b3Jba2V5XS5oYXNPd25Qcm9wZXJ0eShcInVuaXRcIikgPyBwbTJfZW52LmF4bV9tb25pdG9yW2tleV0udW5pdCA6ICcnXG4gICAgICB2YXIgdmFsdWUgPSBgJHttZXRyaWNfbmFtZX0gJHttZXRyaWNfdW5pdH1gXG4gICAgICBvYmpba2V5XSA9IHZhbHVlXG4gICAgICBVeEhlbHBlcnMuc2FmZV9wdXNoKHRhYmxlX3Byb2Jlcywgb2JqKVxuICAgIH0pXG5cbiAgICBjb25zb2xlLmxvZyh0YWJsZV9wcm9iZXMudG9TdHJpbmcoKSlcbiAgfVxuXG4gIHZhciB0YWJsZV9lbnYgPSBuZXcgVGFibGUoe1xuICAgIHN0eWxlIDogeydwYWRkaW5nLWxlZnQnIDogMSwgaGVhZCA6IFsnY3lhbicsICdib2xkJ10sIGNvbXBhY3QgOiB0cnVlfVxuICB9KVxuXG4gIGNvbnNvbGUubG9nKGNoYWxrLmludmVyc2UuYm9sZCgnIERpdmVyZ2VudCBlbnYgdmFyaWFibGVzIGZyb20gbG9jYWwgZW52ICcpKVxuXG4gIHZhciBfZW52ID0gQ29tbW9uLnNhZmVFeHRlbmQoe30sIHBtMl9lbnYpXG4gIHZhciBkaWZmX2VudiA9IHt9XG5cbiAgT2JqZWN0LmtleXMocHJvY2Vzcy5lbnYpLmZvckVhY2goayA9PiB7XG4gICAgaWYgKCFfZW52W2tdIHx8IF9lbnZba10gIT0gcHJvY2Vzcy5lbnZba10pIHtcbiAgICAgIGRpZmZfZW52W2tdID0gcHJvY2Vzcy5lbnZba11cbiAgICB9XG4gIH0pXG5cbiAgT2JqZWN0LmtleXMoZGlmZl9lbnYpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgdmFyIG9iaiA9IHt9XG4gICAgaWYgKF9lbnZba2V5XSkge1xuICAgICAgb2JqW2tleV0gPSBfZW52W2tleV0uc2xpY2UoMCwgcHJvY2Vzcy5zdGRvdXQuY29sdW1ucyAtIDYwKVxuICAgICAgVXhIZWxwZXJzLnNhZmVfcHVzaCh0YWJsZV9lbnYsIG9iailcbiAgICB9XG4gIH0pXG5cbiAgY29uc29sZS5sb2codGFibGVfZW52LnRvU3RyaW5nKCkpXG4gIGNvbnNvbGUubG9nKClcbiAgQ29tbW9uLnByaW50T3V0KGNoYWxrLndoaXRlLml0YWxpYygnIEFkZCB5b3VyIG93biBjb2RlIG1ldHJpY3M6IGh0dHA6Ly9iaXQubHkvY29kZS1tZXRyaWNzJykpXG4gIENvbW1vbi5wcmludE91dChjaGFsay53aGl0ZS5pdGFsaWMoJyBVc2UgYHBtMiBsb2dzICVzIFstLWxpbmVzIDEwMDBdYCB0byBkaXNwbGF5IGxvZ3MnKSwgcG0yX2Vudi5uYW1lKVxuICBDb21tb24ucHJpbnRPdXQoY2hhbGsud2hpdGUuaXRhbGljKCcgVXNlIGBwbTIgZW52ICVzYCB0byBkaXNwbGF5IGVudmlyb25tZW50IHZhcmlhYmxlcycpLCBwbTJfZW52LnBtX2lkKVxuICBDb21tb24ucHJpbnRPdXQoY2hhbGsud2hpdGUuaXRhbGljKCcgVXNlIGBwbTIgbW9uaXRgIHRvIG1vbml0b3IgQ1BVIGFuZCBNZW1vcnkgdXNhZ2UnKSwgcG0yX2Vudi5uYW1lKVxufVxuIl19