"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _constants = _interopRequireDefault(require("../../constants"));

var _Common = _interopRequireDefault(require("../Common"));

var _fs = _interopRequireDefault(require("fs"));

var _eachSeries = _interopRequireDefault(require("async/eachSeries"));

var _child_process = _interopRequireDefault(require("child_process"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var printError = _Common["default"].printError;
var printOut = _Common["default"].printOut;

function _default(CLI) {
  var EXEC_TIMEOUT = 60000; // Default: 1 min

  CLI.prototype._pull = function (opts, cb) {
    var that = this;
    var process_name = opts.process_name;
    var reload_type = opts.action;
    printOut(_constants["default"].PREFIX_MSG + 'Updating repository for process name %s', process_name);
    that.Client.getProcessByNameOrId(process_name, function (err, processes) {
      if (err || processes.length === 0) {
        printError('No processes with this name or id : %s', process_name);
        return cb ? cb({
          msg: 'Process not found: ' + process_name
        }) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      var proc = processes[0];

      if (!proc.pm2_env.versioning) {
        printOut(_constants["default"].PREFIX_MSG + 'No versioning system found for process %s', process_name);
        return cb ? cb({
          success: false,
          msg: 'No versioning system found for process'
        }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
      }

      require('vizion').update({
        folder: proc.pm2_env.versioning.repo_path
      }, function (err, meta) {
        if (err !== null) {
          return cb ? cb({
            msg: err
          }) : that.exitCli(_constants["default"].ERROR_EXIT);
        }

        if (meta.success === true) {
          getPostUpdateCmds(proc.pm2_env.versioning.repo_path, process_name, function (command_list) {
            execCommands(proc.pm2_env.versioning.repo_path, command_list, function (err, res) {
              if (err !== null) {
                printError(err);
                return cb ? cb({
                  msg: meta.output + err
                }) : that.exitCli(_constants["default"].ERROR_EXIT);
              } else {
                printOut(_constants["default"].PREFIX_MSG + 'Process successfully updated %s', process_name);
                printOut(_constants["default"].PREFIX_MSG + 'Current commit %s', meta.current_revision);
                return that[reload_type](process_name, function (err, procs) {
                  if (err && cb) return cb(err);
                  if (err) console.error(err);
                  return cb ? cb(null, meta.output + res) : that.exitCli(_constants["default"].SUCCESS_EXIT);
                });
              }
            });
          });
        } else {
          printOut(_constants["default"].PREFIX_MSG + 'Already up-to-date or an error occured for app: %s', process_name);
          return cb ? cb({
            success: false,
            msg: 'Already up to date'
          }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
        }

        return false;
      });

      return false;
    });
  };
  /**
   * CLI method for updating a repository to a specific commit id
   * @method pullCommitId
   * @param {string} process_name
   * @param {string} commit_id
   * @return
   */


  CLI.prototype.pullCommitId = function (process_name, commit_id, cb) {
    var reload_type = 'reload';
    var that = this;
    printOut(_constants["default"].PREFIX_MSG + 'Updating repository for process name %s', process_name);
    that.Client.getProcessByNameOrId(process_name, function (err, processes) {
      if (err || processes.length === 0) {
        printError('No processes with this name or id : %s', process_name);
        return cb ? cb({
          msg: 'Process not found: ' + process_name
        }) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      var proc = processes[0];

      if (proc.pm2_env.versioning) {
        require('vizion').isUpToDate({
          folder: proc.pm2_env.versioning.repo_path
        }, function (err, meta) {
          if (err !== null) return cb ? cb({
            msg: err
          }) : that.exitCli(_constants["default"].ERROR_EXIT);

          require('vizion').revertTo({
            revision: commit_id,
            folder: proc.pm2_env.versioning.repo_path
          }, function (err2, meta2) {
            if (!err2 && meta2.success) {
              getPostUpdateCmds(proc.pm2_env.versioning.repo_path, process_name, function (command_list) {
                execCommands(proc.pm2_env.versioning.repo_path, command_list, function (err, res) {
                  if (err !== null) {
                    printError(err);
                    return cb ? cb({
                      msg: err
                    }) : that.exitCli(_constants["default"].ERROR_EXIT);
                  } else {
                    printOut(_constants["default"].PREFIX_MSG + 'Process successfully updated %s', process_name);
                    printOut(_constants["default"].PREFIX_MSG + 'Current commit %s', commit_id);
                    return that[reload_type](process_name, cb);
                  }
                });
              });
            } else {
              printOut(_constants["default"].PREFIX_MSG + 'Already up-to-date or an error occured: %s', process_name);
              return cb ? cb(null, {
                success: meta.success
              }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
            }
          });
        });
      } else {
        printOut(_constants["default"].PREFIX_MSG + 'No versioning system found for process %s', process_name);
        return cb ? cb(null, {
          success: false
        }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
      }
    });
  };
  /**
   * CLI method for downgrading a repository to the previous commit (older)
   * @method backward
   * @param {string} process_name
   * @return
   */


  CLI.prototype.backward = function (process_name, cb) {
    var that = this;
    printOut(_constants["default"].PREFIX_MSG + 'Downgrading to previous commit repository for process name %s', process_name);
    that.Client.getProcessByNameOrId(process_name, function (err, processes) {
      if (err || processes.length === 0) {
        printError('No processes with this name or id : %s', process_name);
        return cb ? cb({
          msg: 'Process not found: ' + process_name
        }) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      var proc = processes[0]; // in case user searched by id/pid

      process_name = proc.name;
      if (proc.pm2_env.versioning === undefined || proc.pm2_env.versioning === null) return cb({
        msg: 'Versioning unknown'
      });

      require('vizion').prev({
        folder: proc.pm2_env.versioning.repo_path
      }, function (err, meta) {
        if (err) return cb ? cb({
          msg: err,
          data: meta
        }) : that.exitCli(_constants["default"].ERROR_EXIT);

        if (meta.success !== true) {
          printOut(_constants["default"].PREFIX_MSG + 'No versioning system found for process %s', process_name);
          return cb ? cb({
            msg: err,
            data: meta
          }) : that.exitCli(_constants["default"].ERROR_EXIT);
        }

        getPostUpdateCmds(proc.pm2_env.versioning.repo_path, process_name, function (command_list) {
          execCommands(proc.pm2_env.versioning.repo_path, command_list, function (err, res) {
            if (err !== null) {
              require('vizion').next({
                folder: proc.pm2_env.versioning.repo_path
              }, function (err2, meta2) {
                printError(err);
                return cb ? cb({
                  msg: meta.output + err
                }) : that.exitCli(_constants["default"].ERROR_EXIT);
              });

              return false;
            }

            printOut(_constants["default"].PREFIX_MSG + 'Process successfully updated %s', process_name);
            printOut(_constants["default"].PREFIX_MSG + 'Current commit %s', meta.current_revision);
            that.reload(process_name, function (err, procs) {
              if (err) return cb(err);
              return cb ? cb(null, meta.output + res) : that.exitCli(_constants["default"].SUCCESS_EXIT);
            });
          });
        });
      });
    });
  };
  /**
   * CLI method for updating a repository to the next commit (more recent)
   * @method forward
   * @param {string} process_name
   * @return
   */


  CLI.prototype.forward = function (process_name, cb) {
    var that = this;
    printOut(_constants["default"].PREFIX_MSG + 'Updating to next commit repository for process name %s', process_name);
    that.Client.getProcessByNameOrId(process_name, function (err, processes) {
      if (err || processes.length === 0) {
        printError('No processes with this name or id: %s', process_name);
        return cb ? cb({
          msg: 'Process not found: ' + process_name
        }) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      var proc = processes[0]; // in case user searched by id/pid

      process_name = proc.name;

      if (proc.pm2_env.versioning) {
        require('vizion').next({
          folder: proc.pm2_env.versioning.repo_path
        }, function (err, meta) {
          if (err !== null) return cb ? cb({
            msg: err
          }) : that.exitCli(_constants["default"].ERROR_EXIT);

          if (meta.success === true) {
            getPostUpdateCmds(proc.pm2_env.versioning.repo_path, process_name, function (command_list) {
              execCommands(proc.pm2_env.versioning.repo_path, command_list, function (err, res) {
                if (err !== null) {
                  require('vizion').prev({
                    folder: proc.pm2_env.versioning.repo_path
                  }, function (err2, meta2) {
                    printError(err);
                    return cb ? cb({
                      msg: meta.output + err
                    }) : that.exitCli(_constants["default"].ERROR_EXIT);
                  });
                } else {
                  printOut(_constants["default"].PREFIX_MSG + 'Process successfully updated %s', process_name);
                  printOut(_constants["default"].PREFIX_MSG + 'Current commit %s', meta.current_revision);
                  that.reload(process_name, function (err, procs) {
                    if (err) return cb(err);
                    return cb ? cb(null, meta.output + res) : that.exitCli(_constants["default"].SUCCESS_EXIT);
                  });
                }
              });
            });
          } else {
            printOut(_constants["default"].PREFIX_MSG + 'Already up-to-date or an error occured: %s', process_name);
            return cb ? cb(null, {
              success: meta.success
            }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
          }
        });
      } else {
        printOut(_constants["default"].PREFIX_MSG + 'No versioning system found for process %s', process_name);
        return cb ? cb({
          success: false,
          msg: 'No versioning system found'
        }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
      }
    });
  };

  var exec = function exec(cmd, callback) {
    var output = '';

    var c = _child_process["default"].exec(cmd, {
      env: process.env,
      maxBuffer: 3 * 1024 * 1024,
      timeout: EXEC_TIMEOUT
    }, function (err) {
      if (callback) callback(err ? err.code : 0, output);
    });

    c.stdout.on('data', function (data) {
      output += data;
    });
    c.stderr.on('data', function (data) {
      output += data;
    });
  };
  /**
   *
   * @method execCommands
   * @param {string} repo_path
   * @param {object} command_list
   * @return
   */


  var execCommands = function execCommands(repo_path, command_list, cb) {
    var stdout = '';
    (0, _eachSeries["default"])(command_list, function (command, callback) {
      stdout += '\n' + command;
      exec('cd ' + repo_path + ';' + command, function (code, output) {
        stdout += '\n' + output;
        if (code === 0) callback();else callback('`' + command + '` failed');
      });
    }, function (err) {
      if (err) return cb(stdout + '\n' + err);
      return cb(null, stdout);
    });
  };
  /**
   * Description Search process.json for post-update commands
   * @method getPostUpdateCmds
   * @param {string} repo_path
   * @param {string} proc_name
   * @return
   */


  var getPostUpdateCmds = function getPostUpdateCmds(repo_path, proc_name, cb) {
    if (typeof repo_path !== 'string') return cb([]);
    if (repo_path[repo_path.length - 1] !== '/') repo_path += '/';

    var searchForCommands = function searchForCommands(file, callback) {
      _fs["default"].exists(repo_path + file, function (exists) {
        if (exists) {
          try {
            var conf_string = _fs["default"].readFileSync(repo_path + file);

            var data = _Common["default"].parseConfig(conf_string, repo_path + file);
          } catch (e) {
            console.error(e.message || e);
          }

          if (data && data.apps) {
            (0, _eachSeries["default"])(data.apps, function (item, callb) {
              if (item.name && item.name === proc_name) {
                if (item.post_update && _typeof(item.post_update) === 'object') {
                  if (item.exec_timeout) EXEC_TIMEOUT = parseInt(item.exec_timeout);
                  return callb(item.post_update);
                } else {
                  return callb();
                }
              } else return callb();
            }, function (_final) {
              return callback(_final);
            });
          } else {
            return callback();
          }
        } else {
          return callback();
        }
      });
    };

    (0, _eachSeries["default"])(['ecosystem.json', 'process.json', 'package.json'], searchForCommands, function (_final2) {
      return cb(_final2 ? _final2 : []);
    });
  };
  /**
   * CLI method for updating a repository
   * @method pullAndRestart
   * @param {string} process_name name of processes to pull
   * @return
   */


  CLI.prototype.pullAndRestart = function (process_name, cb) {
    this._pull({
      process_name: process_name,
      action: 'reload'
    }, cb);
  };
  /**
   * CLI method for updating a repository
   * @method pullAndReload
   * @param {string} process_name name of processes to pull
   * @return
   */


  CLI.prototype.pullAndReload = function (process_name, cb) {
    this._pull({
      process_name: process_name,
      action: 'reload'
    }, cb);
  };
  /**
   * CLI method for updating a repository to a specific commit id
   * @method pullCommitId
   * @param {object} opts
   * @return
   */


  CLI.prototype._pullCommitId = function (opts, cb) {
    this.pullCommitId(opts.pm2_name, opts.commit_id, cb);
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvVmVyc2lvbi50cyJdLCJuYW1lcyI6WyJwcmludEVycm9yIiwiQ29tbW9uIiwicHJpbnRPdXQiLCJDTEkiLCJFWEVDX1RJTUVPVVQiLCJwcm90b3R5cGUiLCJfcHVsbCIsIm9wdHMiLCJjYiIsInRoYXQiLCJwcm9jZXNzX25hbWUiLCJyZWxvYWRfdHlwZSIsImFjdGlvbiIsImNzdCIsIlBSRUZJWF9NU0ciLCJDbGllbnQiLCJnZXRQcm9jZXNzQnlOYW1lT3JJZCIsImVyciIsInByb2Nlc3NlcyIsImxlbmd0aCIsIm1zZyIsImV4aXRDbGkiLCJFUlJPUl9FWElUIiwicHJvYyIsInBtMl9lbnYiLCJ2ZXJzaW9uaW5nIiwic3VjY2VzcyIsIlNVQ0NFU1NfRVhJVCIsInJlcXVpcmUiLCJ1cGRhdGUiLCJmb2xkZXIiLCJyZXBvX3BhdGgiLCJtZXRhIiwiZ2V0UG9zdFVwZGF0ZUNtZHMiLCJjb21tYW5kX2xpc3QiLCJleGVjQ29tbWFuZHMiLCJyZXMiLCJvdXRwdXQiLCJjdXJyZW50X3JldmlzaW9uIiwicHJvY3MiLCJjb25zb2xlIiwiZXJyb3IiLCJwdWxsQ29tbWl0SWQiLCJjb21taXRfaWQiLCJpc1VwVG9EYXRlIiwicmV2ZXJ0VG8iLCJyZXZpc2lvbiIsImVycjIiLCJtZXRhMiIsImJhY2t3YXJkIiwibmFtZSIsInVuZGVmaW5lZCIsInByZXYiLCJkYXRhIiwibmV4dCIsInJlbG9hZCIsImZvcndhcmQiLCJleGVjIiwiY21kIiwiY2FsbGJhY2siLCJjIiwiY2hpbGQiLCJlbnYiLCJwcm9jZXNzIiwibWF4QnVmZmVyIiwidGltZW91dCIsImNvZGUiLCJzdGRvdXQiLCJvbiIsInN0ZGVyciIsImNvbW1hbmQiLCJwcm9jX25hbWUiLCJzZWFyY2hGb3JDb21tYW5kcyIsImZpbGUiLCJmcyIsImV4aXN0cyIsImNvbmZfc3RyaW5nIiwicmVhZEZpbGVTeW5jIiwicGFyc2VDb25maWciLCJlIiwibWVzc2FnZSIsImFwcHMiLCJpdGVtIiwiY2FsbGIiLCJwb3N0X3VwZGF0ZSIsImV4ZWNfdGltZW91dCIsInBhcnNlSW50IiwiZmluYWwiLCJwdWxsQW5kUmVzdGFydCIsInB1bGxBbmRSZWxvYWQiLCJfcHVsbENvbW1pdElkIiwicG0yX25hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FBRUEsSUFBSUEsVUFBVSxHQUFHQyxtQkFBT0QsVUFBeEI7QUFDQSxJQUFJRSxRQUFRLEdBQUdELG1CQUFPQyxRQUF0Qjs7QUFFZSxrQkFBU0MsR0FBVCxFQUFjO0FBRTNCLE1BQUlDLFlBQVksR0FBRyxLQUFuQixDQUYyQixDQUVEOztBQUUxQkQsRUFBQUEsR0FBRyxDQUFDRSxTQUFKLENBQWNDLEtBQWQsR0FBc0IsVUFBU0MsSUFBVCxFQUFlQyxFQUFmLEVBQW1CO0FBQ3ZDLFFBQUlDLElBQUksR0FBRyxJQUFYO0FBRUEsUUFBSUMsWUFBWSxHQUFHSCxJQUFJLENBQUNHLFlBQXhCO0FBQ0EsUUFBSUMsV0FBVyxHQUFHSixJQUFJLENBQUNLLE1BQXZCO0FBRUFWLElBQUFBLFFBQVEsQ0FBQ1csc0JBQUlDLFVBQUosR0FBaUIseUNBQWxCLEVBQTZESixZQUE3RCxDQUFSO0FBRUFELElBQUFBLElBQUksQ0FBQ00sTUFBTCxDQUFZQyxvQkFBWixDQUFpQ04sWUFBakMsRUFBK0MsVUFBVU8sR0FBVixFQUFlQyxTQUFmLEVBQTBCO0FBRXZFLFVBQUlELEdBQUcsSUFBSUMsU0FBUyxDQUFDQyxNQUFWLEtBQXFCLENBQWhDLEVBQW1DO0FBQ2pDbkIsUUFBQUEsVUFBVSxDQUFDLHdDQUFELEVBQTJDVSxZQUEzQyxDQUFWO0FBQ0EsZUFBT0YsRUFBRSxHQUFHQSxFQUFFLENBQUM7QUFBQ1ksVUFBQUEsR0FBRyxFQUFFLHdCQUF3QlY7QUFBOUIsU0FBRCxDQUFMLEdBQXFERCxJQUFJLENBQUNZLE9BQUwsQ0FBYVIsc0JBQUlTLFVBQWpCLENBQTlEO0FBQ0Q7O0FBRUQsVUFBSUMsSUFBSSxHQUFHTCxTQUFTLENBQUMs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SUQiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBjc3QgICAgICAgIGZyb20gJy4uLy4uL2NvbnN0YW50cyc7XG5pbXBvcnQgQ29tbW9uICAgICBmcm9tICcuLi9Db21tb24nO1xuaW1wb3J0IGZzICAgICAgICAgZnJvbSAnZnMnO1xuaW1wb3J0IGVhY2hTZXJpZXMgZnJvbSAnYXN5bmMvZWFjaFNlcmllcyc7XG5pbXBvcnQgY2hpbGQgICAgICBmcm9tICdjaGlsZF9wcm9jZXNzJztcblxudmFyIHByaW50RXJyb3IgPSBDb21tb24ucHJpbnRFcnJvcjtcbnZhciBwcmludE91dCA9IENvbW1vbi5wcmludE91dDtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oQ0xJKSB7XG5cbiAgdmFyIEVYRUNfVElNRU9VVCA9IDYwMDAwOyAvLyBEZWZhdWx0OiAxIG1pblxuXG4gIENMSS5wcm90b3R5cGUuX3B1bGwgPSBmdW5jdGlvbihvcHRzLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHZhciBwcm9jZXNzX25hbWUgPSBvcHRzLnByb2Nlc3NfbmFtZTtcbiAgICB2YXIgcmVsb2FkX3R5cGUgPSBvcHRzLmFjdGlvbjtcblxuICAgIHByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1VwZGF0aW5nIHJlcG9zaXRvcnkgZm9yIHByb2Nlc3MgbmFtZSAlcycsIHByb2Nlc3NfbmFtZSk7XG5cbiAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzQnlOYW1lT3JJZChwcm9jZXNzX25hbWUsIGZ1bmN0aW9uIChlcnIsIHByb2Nlc3Nlcykge1xuXG4gICAgICBpZiAoZXJyIHx8IHByb2Nlc3Nlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcHJpbnRFcnJvcignTm8gcHJvY2Vzc2VzIHdpdGggdGhpcyBuYW1lIG9yIGlkIDogJXMnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOiAnUHJvY2VzcyBub3QgZm91bmQ6ICcgKyBwcm9jZXNzX25hbWV9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBwcm9jID0gcHJvY2Vzc2VzWzBdO1xuICAgICAgaWYgKCFwcm9jLnBtMl9lbnYudmVyc2lvbmluZykge1xuICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdObyB2ZXJzaW9uaW5nIHN5c3RlbSBmb3VuZCBmb3IgcHJvY2VzcyAlcycsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKHtzdWNjZXNzOmZhbHNlLCBtc2c6ICdObyB2ZXJzaW9uaW5nIHN5c3RlbSBmb3VuZCBmb3IgcHJvY2Vzcyd9KSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH1cbiAgICAgIHJlcXVpcmUoJ3ZpemlvbicpLnVwZGF0ZSh7XG4gICAgICAgIGZvbGRlcjogcHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRoXG4gICAgICB9LCBmdW5jdGlvbihlcnIsIG1ldGEpIHtcbiAgICAgICAgaWYgKGVyciAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKHttc2c6ZXJyfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1ldGEuc3VjY2VzcyA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGdldFBvc3RVcGRhdGVDbWRzKHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aCwgcHJvY2Vzc19uYW1lLCBmdW5jdGlvbiAoY29tbWFuZF9saXN0KSB7XG4gICAgICAgICAgICBleGVjQ29tbWFuZHMocHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRoLCBjb21tYW5kX2xpc3QsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgICAgICAgIGlmIChlcnIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwcmludEVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzogbWV0YS5vdXRwdXQgKyBlcnJ9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnUHJvY2VzcyBzdWNjZXNzZnVsbHkgdXBkYXRlZCAlcycsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnQ3VycmVudCBjb21taXQgJXMnLCBtZXRhLmN1cnJlbnRfcmV2aXNpb24pO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGF0W3JlbG9hZF90eXBlXShwcm9jZXNzX25hbWUsIGZ1bmN0aW9uKGVyciwgcHJvY3MpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChlcnIgJiYgY2IpIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgICAgICAgICAgaWYgKGVycikgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgbWV0YS5vdXRwdXQgKyByZXMpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdBbHJlYWR5IHVwLXRvLWRhdGUgb3IgYW4gZXJyb3Igb2NjdXJlZCBmb3IgYXBwOiAlcycsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2Ioe3N1Y2Nlc3M6ZmFsc2UsIG1zZyA6ICdBbHJlYWR5IHVwIHRvIGRhdGUnfSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENMSSBtZXRob2QgZm9yIHVwZGF0aW5nIGEgcmVwb3NpdG9yeSB0byBhIHNwZWNpZmljIGNvbW1pdCBpZFxuICAgKiBAbWV0aG9kIHB1bGxDb21taXRJZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvY2Vzc19uYW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb21taXRfaWRcbiAgICogQHJldHVyblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5wdWxsQ29tbWl0SWQgPSBmdW5jdGlvbihwcm9jZXNzX25hbWUsIGNvbW1pdF9pZCwgY2IpIHtcbiAgICB2YXIgcmVsb2FkX3R5cGUgPSAncmVsb2FkJztcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdVcGRhdGluZyByZXBvc2l0b3J5IGZvciBwcm9jZXNzIG5hbWUgJXMnLCBwcm9jZXNzX25hbWUpO1xuXG4gICAgdGhhdC5DbGllbnQuZ2V0UHJvY2Vzc0J5TmFtZU9ySWQocHJvY2Vzc19uYW1lLCBmdW5jdGlvbiAoZXJyLCBwcm9jZXNzZXMpIHtcblxuICAgICAgaWYgKGVyciB8fCBwcm9jZXNzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHByaW50RXJyb3IoJ05vIHByb2Nlc3NlcyB3aXRoIHRoaXMgbmFtZSBvciBpZCA6ICVzJywgcHJvY2Vzc19uYW1lKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzogJ1Byb2Nlc3Mgbm90IGZvdW5kOiAnICsgcHJvY2Vzc19uYW1lfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcHJvYyA9IHByb2Nlc3Nlc1swXTtcbiAgICAgIGlmIChwcm9jLnBtMl9lbnYudmVyc2lvbmluZykge1xuICAgICAgICByZXF1aXJlKCd2aXppb24nKS5pc1VwVG9EYXRlKHtmb2xkZXI6IHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aH0sIGZ1bmN0aW9uKGVyciwgbWV0YSkge1xuICAgICAgICAgIGlmIChlcnIgIT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOmVycn0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgICByZXF1aXJlKCd2aXppb24nKS5yZXZlcnRUbyhcbiAgICAgICAgICAgIHtyZXZpc2lvbjogY29tbWl0X2lkLFxuICAgICAgICAgICAgIGZvbGRlcjogcHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRofSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVycjIsIG1ldGEyKSB7XG4gICAgICAgICAgICAgIGlmICghZXJyMiAmJiBtZXRhMi5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgZ2V0UG9zdFVwZGF0ZUNtZHMocHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRoLCBwcm9jZXNzX25hbWUsIGZ1bmN0aW9uIChjb21tYW5kX2xpc3QpIHtcbiAgICAgICAgICAgICAgICAgIGV4ZWNDb21tYW5kcyhwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGgsIGNvbW1hbmRfbGlzdCwgZnVuY3Rpb24oZXJyLCByZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyciAhPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIHByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOmVycn0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdQcm9jZXNzIHN1Y2Nlc3NmdWxseSB1cGRhdGVkICVzJywgcHJvY2Vzc19uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdDdXJyZW50IGNvbW1pdCAlcycsIGNvbW1pdF9pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoYXRbcmVsb2FkX3R5cGVdKHByb2Nlc3NfbmFtZSwgY2IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdBbHJlYWR5IHVwLXRvLWRhdGUgb3IgYW4gZXJyb3Igb2NjdXJlZDogJXMnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOm1ldGEuc3VjY2Vzc30pIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnTm8gdmVyc2lvbmluZyBzeXN0ZW0gZm91bmQgZm9yIHByb2Nlc3MgJXMnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCB7c3VjY2VzczpmYWxzZX0pIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDTEkgbWV0aG9kIGZvciBkb3duZ3JhZGluZyBhIHJlcG9zaXRvcnkgdG8gdGhlIHByZXZpb3VzIGNvbW1pdCAob2xkZXIpXG4gICAqIEBtZXRob2QgYmFja3dhcmRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb2Nlc3NfbmFtZVxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24ocHJvY2Vzc19uYW1lLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdEb3duZ3JhZGluZyB0byBwcmV2aW91cyBjb21taXQgcmVwb3NpdG9yeSBmb3IgcHJvY2VzcyBuYW1lICVzJywgcHJvY2Vzc19uYW1lKTtcblxuICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NCeU5hbWVPcklkKHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24gKGVyciwgcHJvY2Vzc2VzKSB7XG5cbiAgICAgIGlmIChlcnIgfHwgcHJvY2Vzc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBwcmludEVycm9yKCdObyBwcm9jZXNzZXMgd2l0aCB0aGlzIG5hbWUgb3IgaWQgOiAlcycsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKHttc2c6ICdQcm9jZXNzIG5vdCBmb3VuZDogJyArIHByb2Nlc3NfbmFtZX0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHByb2MgPSBwcm9jZXNzZXNbMF07XG4gICAgICAvLyBpbiBjYXNlIHVzZXIgc2VhcmNoZWQgYnkgaWQvcGlkXG4gICAgICBwcm9jZXNzX25hbWUgPSBwcm9jLm5hbWU7XG5cbiAgICAgIGlmIChwcm9jLnBtMl9lbnYudmVyc2lvbmluZyA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICAgcHJvYy5wbTJfZW52LnZlcnNpb25pbmcgPT09IG51bGwpXG4gICAgICAgIHJldHVybiBjYih7bXNnIDogJ1ZlcnNpb25pbmcgdW5rbm93bid9KTtcblxuICAgICAgcmVxdWlyZSgndml6aW9uJykucHJldih7XG4gICAgICAgIGZvbGRlcjogcHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRoXG4gICAgICB9LCBmdW5jdGlvbihlcnIsIG1ldGEpIHtcbiAgICAgICAgaWYgKGVycilcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOmVyciwgZGF0YSA6IG1ldGF9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG5cbiAgICAgICAgaWYgKG1ldGEuc3VjY2VzcyAhPT0gdHJ1ZSkge1xuICAgICAgICAgIHByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ05vIHZlcnNpb25pbmcgc3lzdGVtIGZvdW5kIGZvciBwcm9jZXNzICVzJywgcHJvY2Vzc19uYW1lKTtcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOmVyciwgZGF0YSA6IG1ldGF9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRQb3N0VXBkYXRlQ21kcyhwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGgsIHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24gKGNvbW1hbmRfbGlzdCkge1xuICAgICAgICAgIGV4ZWNDb21tYW5kcyhwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGgsIGNvbW1hbmRfbGlzdCwgZnVuY3Rpb24oZXJyLCByZXMpIHtcbiAgICAgICAgICAgIGlmIChlcnIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgcmVxdWlyZSgndml6aW9uJykubmV4dCh7Zm9sZGVyOiBwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGh9LCBmdW5jdGlvbihlcnIyLCBtZXRhMikge1xuICAgICAgICAgICAgICAgIHByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOiBtZXRhLm91dHB1dCArIGVycn0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnUHJvY2VzcyBzdWNjZXNzZnVsbHkgdXBkYXRlZCAlcycsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdDdXJyZW50IGNvbW1pdCAlcycsIG1ldGEuY3VycmVudF9yZXZpc2lvbik7XG4gICAgICAgICAgICB0aGF0LnJlbG9hZChwcm9jZXNzX25hbWUsIGZ1bmN0aW9uKGVyciwgcHJvY3MpIHtcbiAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIG1ldGEub3V0cHV0ICsgcmVzKSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDTEkgbWV0aG9kIGZvciB1cGRhdGluZyBhIHJlcG9zaXRvcnkgdG8gdGhlIG5leHQgY29tbWl0IChtb3JlIHJlY2VudClcbiAgICogQG1ldGhvZCBmb3J3YXJkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9jZXNzX25hbWVcbiAgICogQHJldHVyblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24ocHJvY2Vzc19uYW1lLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdVcGRhdGluZyB0byBuZXh0IGNvbW1pdCByZXBvc2l0b3J5IGZvciBwcm9jZXNzIG5hbWUgJXMnLCBwcm9jZXNzX25hbWUpO1xuXG4gICAgdGhhdC5DbGllbnQuZ2V0UHJvY2Vzc0J5TmFtZU9ySWQocHJvY2Vzc19uYW1lLCBmdW5jdGlvbiAoZXJyLCBwcm9jZXNzZXMpIHtcblxuICAgICAgaWYgKGVyciB8fCBwcm9jZXNzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHByaW50RXJyb3IoJ05vIHByb2Nlc3NlcyB3aXRoIHRoaXMgbmFtZSBvciBpZDogJXMnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOiAnUHJvY2VzcyBub3QgZm91bmQ6ICcgKyBwcm9jZXNzX25hbWV9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBwcm9jID0gcHJvY2Vzc2VzWzBdO1xuICAgICAgLy8gaW4gY2FzZSB1c2VyIHNlYXJjaGVkIGJ5IGlkL3BpZFxuICAgICAgcHJvY2Vzc19uYW1lID0gcHJvYy5uYW1lO1xuICAgICAgaWYgKHByb2MucG0yX2Vudi52ZXJzaW9uaW5nKSB7XG4gICAgICAgIHJlcXVpcmUoJ3ZpemlvbicpLm5leHQoe2ZvbGRlcjogcHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRofSwgZnVuY3Rpb24oZXJyLCBtZXRhKSB7XG4gICAgICAgICAgaWYgKGVyciAhPT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKHttc2c6ZXJyfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICAgIGlmIChtZXRhLnN1Y2Nlc3MgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGdldFBvc3RVcGRhdGVDbWRzKHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aCwgcHJvY2Vzc19uYW1lLCBmdW5jdGlvbiAoY29tbWFuZF9saXN0KSB7XG4gICAgICAgICAgICAgIGV4ZWNDb21tYW5kcyhwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGgsIGNvbW1hbmRfbGlzdCwgZnVuY3Rpb24oZXJyLCByZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyICE9PSBudWxsKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHJlcXVpcmUoJ3ZpemlvbicpLnByZXYoe2ZvbGRlcjogcHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRofSwgZnVuY3Rpb24oZXJyMiwgbWV0YTIpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOm1ldGEub3V0cHV0ICsgZXJyfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnUHJvY2VzcyBzdWNjZXNzZnVsbHkgdXBkYXRlZCAlcycsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgICAgICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdDdXJyZW50IGNvbW1pdCAlcycsIG1ldGEuY3VycmVudF9yZXZpc2lvbik7XG4gICAgICAgICAgICAgICAgICB0aGF0LnJlbG9hZChwcm9jZXNzX25hbWUsIGZ1bmN0aW9uKGVyciwgcHJvY3MpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIG1ldGEub3V0cHV0ICsgcmVzKSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdBbHJlYWR5IHVwLXRvLWRhdGUgb3IgYW4gZXJyb3Igb2NjdXJlZDogJXMnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwge3N1Y2Nlc3M6bWV0YS5zdWNjZXNzfSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdObyB2ZXJzaW9uaW5nIHN5c3RlbSBmb3VuZCBmb3IgcHJvY2VzcyAlcycsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKHtzdWNjZXNzOmZhbHNlLCBtc2c6ICdObyB2ZXJzaW9uaW5nIHN5c3RlbSBmb3VuZCd9KSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICB2YXIgZXhlYyA9IGZ1bmN0aW9uIChjbWQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIG91dHB1dCA9ICcnO1xuXG4gICAgdmFyIGMgPSBjaGlsZC5leGVjKGNtZCwge1xuICAgICAgZW52OiBwcm9jZXNzLmVudixcbiAgICAgIG1heEJ1ZmZlcjogMyoxMDI0KjEwMjQsXG4gICAgICB0aW1lb3V0OiBFWEVDX1RJTUVPVVRcbiAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgIGlmIChjYWxsYmFjaylcbiAgICAgICAgY2FsbGJhY2soZXJyID8gZXJyLmNvZGUgOiAwLCBvdXRwdXQpO1xuICAgIH0pO1xuXG4gICAgYy5zdGRvdXQub24oJ2RhdGEnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBvdXRwdXQgKz0gZGF0YTtcbiAgICB9KTtcblxuICAgIGMuc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgb3V0cHV0ICs9IGRhdGE7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqXG4gICAqIEBtZXRob2QgZXhlY0NvbW1hbmRzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvX3BhdGhcbiAgICogQHBhcmFtIHtvYmplY3R9IGNvbW1hbmRfbGlzdFxuICAgKiBAcmV0dXJuXG4gICAqL1xuICB2YXIgZXhlY0NvbW1hbmRzID0gZnVuY3Rpb24ocmVwb19wYXRoLCBjb21tYW5kX2xpc3QsIGNiKSB7XG4gICAgdmFyIHN0ZG91dCA9ICcnO1xuXG4gICAgZWFjaFNlcmllcyhjb21tYW5kX2xpc3QsIGZ1bmN0aW9uKGNvbW1hbmQsIGNhbGxiYWNrKSB7XG4gICAgICBzdGRvdXQgKz0gJ1xcbicgKyBjb21tYW5kO1xuICAgICAgZXhlYygnY2QgJytyZXBvX3BhdGgrJzsnK2NvbW1hbmQsXG4gICAgICAgICAgIGZ1bmN0aW9uKGNvZGUsIG91dHB1dCkge1xuICAgICAgICAgICAgIHN0ZG91dCArPSAnXFxuJyArIG91dHB1dDtcbiAgICAgICAgICAgICBpZiAoY29kZSA9PT0gMClcbiAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgY2FsbGJhY2soJ2AnK2NvbW1hbmQrJ2AgZmFpbGVkJyk7XG4gICAgICAgICAgIH0pO1xuICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgaWYgKGVycilcbiAgICAgICAgcmV0dXJuIGNiKHN0ZG91dCArICdcXG4nICsgZXJyKTtcbiAgICAgIHJldHVybiBjYihudWxsLCBzdGRvdXQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc2NyaXB0aW9uIFNlYXJjaCBwcm9jZXNzLmpzb24gZm9yIHBvc3QtdXBkYXRlIGNvbW1hbmRzXG4gICAqIEBtZXRob2QgZ2V0UG9zdFVwZGF0ZUNtZHNcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlcG9fcGF0aFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvY19uYW1lXG4gICAqIEByZXR1cm5cbiAgICovXG4gIHZhciBnZXRQb3N0VXBkYXRlQ21kcyA9IGZ1bmN0aW9uKHJlcG9fcGF0aCwgcHJvY19uYW1lLCBjYikge1xuICAgIGlmICh0eXBlb2YgcmVwb19wYXRoICE9PSAnc3RyaW5nJylcbiAgICAgIHJldHVybiBjYihbXSk7XG4gICAgaWYgKHJlcG9fcGF0aFtyZXBvX3BhdGgubGVuZ3RoIC0gMV0gIT09ICcvJylcbiAgICAgIHJlcG9fcGF0aCArPSAnLyc7XG5cbiAgICB2YXIgc2VhcmNoRm9yQ29tbWFuZHMgPSBmdW5jdGlvbihmaWxlLCBjYWxsYmFjaykge1xuICAgICAgZnMuZXhpc3RzKHJlcG9fcGF0aCtmaWxlLCBmdW5jdGlvbihleGlzdHMpIHtcbiAgICAgICAgaWYgKGV4aXN0cykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgY29uZl9zdHJpbmcgPSBmcy5yZWFkRmlsZVN5bmMocmVwb19wYXRoICsgZmlsZSk7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IENvbW1vbi5wYXJzZUNvbmZpZyhjb25mX3N0cmluZywgcmVwb19wYXRoICsgZmlsZSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UgfHwgZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5hcHBzKSB7XG4gICAgICAgICAgICBlYWNoU2VyaWVzKGRhdGEuYXBwcywgZnVuY3Rpb24oaXRlbSwgY2FsbGIpIHtcbiAgICAgICAgICAgICAgaWYgKGl0ZW0ubmFtZSAmJiBpdGVtLm5hbWUgPT09IHByb2NfbmFtZSkge1xuICAgICAgICAgICAgICAgIGlmIChpdGVtLnBvc3RfdXBkYXRlICYmIHR5cGVvZihpdGVtLnBvc3RfdXBkYXRlKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmV4ZWNfdGltZW91dClcbiAgICAgICAgICAgICAgICAgICAgRVhFQ19USU1FT1VUID0gcGFyc2VJbnQoaXRlbS5leGVjX3RpbWVvdXQpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiKGl0ZW0ucG9zdF91cGRhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiKCk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbihmaW5hbCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZmluYWwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgZWFjaFNlcmllcyhbJ2Vjb3N5c3RlbS5qc29uJywgJ3Byb2Nlc3MuanNvbicsICdwYWNrYWdlLmpzb24nXSwgc2VhcmNoRm9yQ29tbWFuZHMsXG4gICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihmaW5hbCkge1xuICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IoZmluYWwgPyBmaW5hbCA6IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgIH0pO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIENMSSBtZXRob2QgZm9yIHVwZGF0aW5nIGEgcmVwb3NpdG9yeVxuICAgKiBAbWV0aG9kIHB1bGxBbmRSZXN0YXJ0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9jZXNzX25hbWUgbmFtZSBvZiBwcm9jZXNzZXMgdG8gcHVsbFxuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLnB1bGxBbmRSZXN0YXJ0ID0gZnVuY3Rpb24gKHByb2Nlc3NfbmFtZSwgY2IpIHtcbiAgICB0aGlzLl9wdWxsKHtwcm9jZXNzX25hbWU6IHByb2Nlc3NfbmFtZSwgYWN0aW9uOiAncmVsb2FkJ30sIGNiKTtcbiAgfTtcblxuICAvKipcbiAgICogQ0xJIG1ldGhvZCBmb3IgdXBkYXRpbmcgYSByZXBvc2l0b3J5XG4gICAqIEBtZXRob2QgcHVsbEFuZFJlbG9hZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvY2Vzc19uYW1lIG5hbWUgb2YgcHJvY2Vzc2VzIHRvIHB1bGxcbiAgICogQHJldHVyblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5wdWxsQW5kUmVsb2FkID0gZnVuY3Rpb24gKHByb2Nlc3NfbmFtZSwgY2IpIHtcbiAgICB0aGlzLl9wdWxsKHtwcm9jZXNzX25hbWU6IHByb2Nlc3NfbmFtZSwgYWN0aW9uOiAncmVsb2FkJ30sIGNiKTtcbiAgfTtcblxuICAvKipcbiAgICogQ0xJIG1ldGhvZCBmb3IgdXBkYXRpbmcgYSByZXBvc2l0b3J5IHRvIGEgc3BlY2lmaWMgY29tbWl0IGlkXG4gICAqIEBtZXRob2QgcHVsbENvbW1pdElkXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUuX3B1bGxDb21taXRJZCA9IGZ1bmN0aW9uIChvcHRzLCBjYikge1xuICAgIHRoaXMucHVsbENvbW1pdElkKG9wdHMucG0yX25hbWUsIG9wdHMuY29tbWl0X2lkLCBjYik7XG4gIH07XG5cbn1cbiJdfQ==