"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _constants = _interopRequireDefault(require("../../constants"));

var _Common = _interopRequireDefault(require("../Common"));

var _fs = _interopRequireDefault(require("fs"));

var _eachSeries = _interopRequireDefault(require("async/eachSeries"));

var _child_process = _interopRequireDefault(require("child_process"));

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
                if (item.post_update && (0, _typeof2["default"])(item.post_update) === 'object') {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvVmVyc2lvbi50cyJdLCJuYW1lcyI6WyJwcmludEVycm9yIiwiQ29tbW9uIiwicHJpbnRPdXQiLCJDTEkiLCJFWEVDX1RJTUVPVVQiLCJwcm90b3R5cGUiLCJfcHVsbCIsIm9wdHMiLCJjYiIsInRoYXQiLCJwcm9jZXNzX25hbWUiLCJyZWxvYWRfdHlwZSIsImFjdGlvbiIsImNzdCIsIlBSRUZJWF9NU0ciLCJDbGllbnQiLCJnZXRQcm9jZXNzQnlOYW1lT3JJZCIsImVyciIsInByb2Nlc3NlcyIsImxlbmd0aCIsIm1zZyIsImV4aXRDbGkiLCJFUlJPUl9FWElUIiwicHJvYyIsInBtMl9lbnYiLCJ2ZXJzaW9uaW5nIiwic3VjY2VzcyIsIlNVQ0NFU1NfRVhJVCIsInJlcXVpcmUiLCJ1cGRhdGUiLCJmb2xkZXIiLCJyZXBvX3BhdGgiLCJtZXRhIiwiZ2V0UG9zdFVwZGF0ZUNtZHMiLCJjb21tYW5kX2xpc3QiLCJleGVjQ29tbWFuZHMiLCJyZXMiLCJvdXRwdXQiLCJjdXJyZW50X3JldmlzaW9uIiwicHJvY3MiLCJjb25zb2xlIiwiZXJyb3IiLCJwdWxsQ29tbWl0SWQiLCJjb21taXRfaWQiLCJpc1VwVG9EYXRlIiwicmV2ZXJ0VG8iLCJyZXZpc2lvbiIsImVycjIiLCJtZXRhMiIsImJhY2t3YXJkIiwibmFtZSIsInVuZGVmaW5lZCIsInByZXYiLCJkYXRhIiwibmV4dCIsInJlbG9hZCIsImZvcndhcmQiLCJleGVjIiwiY21kIiwiY2FsbGJhY2siLCJjIiwiY2hpbGQiLCJlbnYiLCJwcm9jZXNzIiwibWF4QnVmZmVyIiwidGltZW91dCIsImNvZGUiLCJzdGRvdXQiLCJvbiIsInN0ZGVyciIsImNvbW1hbmQiLCJwcm9jX25hbWUiLCJzZWFyY2hGb3JDb21tYW5kcyIsImZpbGUiLCJmcyIsImV4aXN0cyIsImNvbmZfc3RyaW5nIiwicmVhZEZpbGVTeW5jIiwicGFyc2VDb25maWciLCJlIiwibWVzc2FnZSIsImFwcHMiLCJpdGVtIiwiY2FsbGIiLCJwb3N0X3VwZGF0ZSIsImV4ZWNfdGltZW91dCIsInBhcnNlSW50IiwiZmluYWwiLCJwdWxsQW5kUmVzdGFydCIsInB1bGxBbmRSZWxvYWQiLCJfcHVsbENvbW1pdElkIiwicG0yX25hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsSUFBSUEsVUFBVSxHQUFHQyxtQkFBT0QsVUFBeEI7QUFDQSxJQUFJRSxRQUFRLEdBQUdELG1CQUFPQyxRQUF0Qjs7QUFFZSxrQkFBU0MsR0FBVCxFQUFjO0FBRTNCLE1BQUlDLFlBQVksR0FBRyxLQUFuQixDQUYyQixDQUVEOztBQUUxQkQsRUFBQUEsR0FBRyxDQUFDRSxTQUFKLENBQWNDLEtBQWQsR0FBc0IsVUFBU0MsSUFBVCxFQUFlQyxFQUFmLEVBQW1CO0FBQ3ZDLFFBQUlDLElBQUksR0FBRyxJQUFYO0FBRUEsUUFBSUMsWUFBWSxHQUFHSCxJQUFJLENBQUNHLFlBQXhCO0FBQ0EsUUFBSUMsV0FBVyxHQUFHSixJQUFJLENBQUNLLE1BQXZCO0FBRUFWLElBQUFBLFFBQVEsQ0FBQ1csc0JBQUlDLFVBQUosR0FBaUIseUNBQWxCLEVBQTZESixZQUE3RCxDQUFSO0FBRUFELElBQUFBLElBQUksQ0FBQ00sTUFBTCxDQUFZQyxvQkFBWixDQUFpQ04sWUFBakMsRUFBK0MsVUFBVU8sR0FBVixFQUFlQyxTQUFmLEVBQTBCO0FBRXZFLFVBQUlELEdBQUcsSUFBSUMsU0FBUyxDQUFDQyxNQUFWLEtBQXFCLENBQWhDLEVBQW1DO0FBQ2pDbkIsUUFBQUEsVUFBVSxDQUFDLHdDQUFELEVBQTJDVSxZQUEzQyxDQUFWO0FBQ0EsZUFBT0YsRUFBRSxHQUFHQSxFQUFFLENBQUM7QUFBQ1ksVUFBQUEsR0FBRyxFQUFFLHdCQUF3QlY7QUFBOUIsU0FBRCxDQUFMLEdBQXFERCxJQUFJLENBQUNZLE9BQUwsQ0FBYVIsc0JBQUlTLFVBQWpCLENBQTlEO0FBQ0Q7O0FBRUQsVUFBSUMsSUFBSSxHQUFHTCxTQUFTLENBQUMsQ0FBRCxDQUFwQjs7QUFDQSxVQUFJLENBQUNLLElBQUksQ0FBQ0MsT0FBTCxDQUFhQyxVQUFsQixFQUE4QjtBQUM1QnZCLFFBQUFBLFFBQVEsQ0FBQ1csc0JBQUlDLFVBQUosR0FBaUIsMkNBQWxCLEVBQStESixZQUEvRCxDQUFSO0FBQ0EsZUFBT0YsRUFBRSxHQUFHQSxFQUFFLENBQUM7QUFBQ2tCLFVBQUFBLE9BQU8sRUFBQyxLQUFUO0FBQWdCTixVQUFBQSxHQUFHLEVBQUU7QUFBckIsU0FBRCxDQUFMLEdBQXdFWCxJQUFJLENBQUNZLE9BQUwsQ0FBYVIsc0JBQUljLFlBQWpCLENBQWpGO0FBQ0Q7O0FBQ0RDLE1BQUFBLE9BQU8sQ0FBQyxRQUFELENBQVAsQ0FBa0JDLE1BQWxCLENBQXlCO0FBQ3ZCQyxRQUFBQSxNQUFNLEVBQUVQLElBQUksQ0FBQ0MsT0FBTCxDQUFhQyxVQUFiLENBQXdCTTtBQURULE9BQXpCLEVBRUcsVUFBU2QsR0FBVCxFQUFjZSxJQUFkLEVBQW9CO0FBQ3JCLFlBQUlmLEdBQUcsS0FBSyxJQUFaLEVBQWtCO0FBQ2hCLGlCQUFPVCxFQUFFLEdBQUdBLEVBQUUsQ0FBQztBQUFDWSxZQUFBQSxHQUFHLEVBQUNIO0FBQUwsV0FBRCxDQUFMLEdBQW1CUixJQUFJLENBQUNZLE9BQUwsQ0FBYVIsc0JBQUlTLFVBQWpCLENBQTVCO0FBQ0Q7O0FBRUQsWUFBSVUsSUFBSSxDQUFDTixPQUFMLEtBQWlCLElBQXJCLEVBQTJCO0FBQ3pCTyxVQUFBQSxpQkFBaUIsQ0FBQ1YsSUFBSSxDQUFDQyxPQUFMLENBQWFDLFVBQWIsQ0FBd0JNLFNBQXpCLEVBQW9DckIsWUFBcEMsRUFBa0QsVUFBVXdCLFlBQVYsRUFBd0I7QUFDekZDLFlBQUFBLFlBQVksQ0FBQ1osSUFBSSxDQUFDQyxPQUFMLENBQWFDLFVBQWIsQ0FBd0JNLFNBQXpCLEVBQW9DRyxZQUFwQyxFQUFrRCxVQUFTakIsR0FBVCxFQUFjbUIsR0FBZCxFQUFtQjtBQUMvRSxrQkFBSW5CLEdBQUcsS0FBSyxJQUFaLEVBQWtCO0FBQ2hCakIsZ0JBQUFBLFVBQVUsQ0FBQ2lCLEdBQUQsQ0FBVjtBQUNBLHVCQUFPVCxFQUFFLEdBQUdBLEVBQUUsQ0FBQztBQUFDWSxrQkFBQUEsR0FBRyxFQUFFWSxJQUFJLENBQUNLLE1BQUwsR0FBY3BCO0FBQXBCLGlCQUFELENBQUwsR0FBa0NSLElBQUksQ0FBQ1ksT0FBTCxDQUFhUixzQkFBSVMsVUFBakIsQ0FBM0M7QUFDRCxlQUhELE1BSUs7QUFDSHBCLGdCQUFBQSxRQUFRLENBQUNXLHNCQUFJQyxVQUFKLEdBQWlCLGlDQUFsQixFQUFxREosWUFBckQsQ0FBUjtBQUNBUixnQkFBQUEsUUFBUSxDQUFDVyxzQkFBSUMsVUFBSixHQUFpQixtQkFBbEIsRUFBdUNrQixJQUFJLENBQUNNLGdCQUE1QyxDQUFSO0FBQ0EsdUJBQU83QixJQUFJLENBQUNFLFdBQUQsQ0FBSixDQUFrQkQsWUFBbEIsRUFBZ0MsVUFBU08sR0FBVCxFQUFjc0IsS0FBZCxFQUFxQjtBQUMxRCxzQkFBSXRCLEdBQUcsSUFBSVQsRUFBWCxFQUFlLE9BQU9BLEVBQUUsQ0FBQ1MsR0FBRCxDQUFUO0FBQ2Ysc0JBQUlBLEdBQUosRUFBU3VCLE9BQU8sQ0FBQ0MsS0FBUixDQUFjeEIsR0FBZDtBQUNULHlCQUFPVCxFQUFFLEdBQUdBLEVBQUUsQ0FBQyxJQUFELEVBQU93QixJQUFJLENBQUNLLE1BQUwsR0FBY0QsR0FBckIsQ0FBTCxHQUFpQzNCLElBQUksQ0FBQ1ksT0FBTCxDQUFhUixzQkFBSWMsWUFBakIsQ0FBMUM7QUFDRCxpQkFKTSxDQUFQO0FBS0Q7QUFDRixhQWRXLENBQVo7QUFlRCxXQWhCZ0IsQ0FBakI7QUFpQkQsU0FsQkQsTUFtQks7QUFDSHpCLFVBQUFBLFFBQVEsQ0FBQ1csc0JBQUlDLFVBQUosR0FBaUIsb0RBQWxCLEVBQXdFSixZQUF4RSxDQUFSO0FBQ0EsaUJBQU9GLEVBQUUsR0FBR0EsRUFBRSxDQUFDO0FBQUNrQixZQUFBQSxPQUFPLEVBQUMsS0FBVDtBQUFnQk4sWUFBQUEsR0FBRyxFQUFHO0FBQXRCLFdBQUQsQ0FBTCxHQUFxRFgsSUFBSSxDQUFDWSxPQUFMLENBQWFSLHNCQUFJYyxZQUFqQixDQUE5RDtBQUNEOztBQUNELGVBQU8sS0FBUDtBQUNELE9BL0JEOztBQWdDQSxhQUFPLEtBQVA7QUFDRCxLQTdDRDtBQThDRCxHQXRERDtBQXdEQTs7Ozs7Ozs7O0FBT0F4QixFQUFBQSxHQUFHLENBQUNFLFNBQUosQ0FBY3FDLFlBQWQsR0FBNkIsVUFBU2hDLFlBQVQsRUFBdUJpQyxTQUF2QixFQUFrQ25DLEVBQWxDLEVBQXNDO0FBQ2pFLFFBQUlHLFdBQVcsR0FBRyxRQUFsQjtBQUNBLFFBQUlGLElBQUksR0FBRyxJQUFYO0FBRUFQLElBQUFBLFFBQVEsQ0FBQ1csc0JBQUlDLFVBQUosR0FBaUIseUNBQWxCLEVBQTZESixZQUE3RCxDQUFSO0FBRUFELElBQUFBLElBQUksQ0FBQ00sTUFBTCxDQUFZQyxvQkFBWixDQUFpQ04sWUFBakMsRUFBK0MsVUFBVU8sR0FBVixFQUFlQyxTQUFmLEVBQTBCO0FBRXZFLFVBQUlELEdBQUcsSUFBSUMsU0FBUyxDQUFDQyxNQUFWLEtBQXFCLENBQWhDLEVBQW1DO0FBQ2pDbkIsUUFBQUEsVUFBVSxDQUFDLHdDQUFELEVBQTJDVSxZQUEzQyxDQUFWO0FBQ0EsZUFBT0YsRUFBRSxHQUFHQSxFQUFFLENBQUM7QUFBQ1ksVUFBQUEsR0FBRyxFQUFFLHdCQUF3QlY7QUFBOUIsU0FBRCxDQUFMLEdBQXFERCxJQUFJLENBQUNZLE9BQUwsQ0FBYVIsc0JBQUlTLFVBQWpCLENBQTlEO0FBQ0Q7O0FBRUQsVUFBSUMsSUFBSSxHQUFHTCxTQUFTLENBQUMsQ0FBRCxDQUFwQjs7QUFDQSxVQUFJSyxJQUFJLENBQUNDLE9BQUwsQ0FBYUMsVUFBakIsRUFBNkI7QUFDM0JHLFFBQUFBLE9BQU8sQ0FBQyxRQUFELENBQVAsQ0FBa0JnQixVQUFsQixDQUE2QjtBQUFDZCxVQUFBQSxNQUFNLEVBQUVQLElBQUksQ0FBQ0MsT0FBTCxDQUFhQyxVQUFiLENBQXdCTTtBQUFqQyxTQUE3QixFQUEwRSxVQUFTZCxHQUFULEVBQWNlLElBQWQsRUFBb0I7QUFDNUYsY0FBSWYsR0FBRyxLQUFLLElBQVosRUFDRSxPQUFPVCxFQUFFLEdBQUdBLEVBQUUsQ0FBQztBQUFDWSxZQUFBQSxHQUFHLEVBQUNIO0FBQUwsV0FBRCxDQUFMLEdBQW1CUixJQUFJLENBQUNZLE9BQUwsQ0FBYVIsc0JBQUlTLFVBQWpCLENBQTVCOztBQUNGTSxVQUFBQSxPQUFPLENBQUMsUUFBRCxDQUFQLENBQWtCaUIsUUFBbEIsQ0FDRTtBQUFDQyxZQUFBQSxRQUFRLEVBQUVILFNBQVg7QUFDQ2IsWUFBQUEsTUFBTSxFQUFFUCxJQUFJLENBQUNDLE9BQUwsQ0FBYUMsVUFBYixDQUF3Qk07QUFEakMsV0FERixFQUdFLFVBQVNnQixJQUFULEVBQWVDLEtBQWYsRUFBc0I7QUFDcEIsZ0JBQUksQ0FBQ0QsSUFBRCxJQUFTQyxLQUFLLENBQUN0QixPQUFuQixFQUE0QjtBQUMxQk8sY0FBQUEsaUJBQWlCLENBQUNWLElBQUksQ0FBQ0MsT0FBTCxDQUFhQyxVQUFiLENBQXdCTSxTQUF6QixFQUFvQ3JCLFlBQXBDLEVBQWtELFVBQVV3QixZQUFWLEVBQXdCO0FBQ3pGQyxnQkFBQUEsWUFBWSxDQUFDWixJQUFJLENBQUNDLE9BQUwsQ0FBYUMsVUFBYixDQUF3Qk0sU0FBekIsRUFBb0NHLFlBQXBDLEVBQWtELFVBQVNqQixHQUFULEVBQWNtQixHQUFkLEVBQW1CO0FBQy9FLHNCQUFJbkIsR0FBRyxLQUFLLElBQVosRUFDQTtBQUNFakIsb0JBQUFBLFVBQVUsQ0FBQ2lCLEdBQUQsQ0FBVjtBQUNBLDJCQUFPVCxFQUFFLEdBQUdBLEVBQUUsQ0FBQztBQUFDWSxzQkFBQUEsR0FBRyxFQUFDSDtBQUFMLHFCQUFELENBQUwsR0FBbUJSLElBQUksQ0FBQ1ksT0FBTCxDQUFhUixzQkFBSVMsVUFBakIsQ0FBNUI7QUFDRCxtQkFKRCxNQUtLO0FBQ0hwQixvQkFBQUEsUUFBUSxDQUFDVyxzQkFBSUMsVUFBSixHQUFpQixpQ0FBbEIsRUFBcURKLFlBQXJELENBQVI7QUFDQVIsb0JBQUFBLFFBQVEsQ0FBQ1csc0JBQUlDLFVBQUosR0FBaUIsbUJBQWxCLEVBQXVDNkIsU0FBdkMsQ0FBUjtBQUNBLDJCQUFPbEMsSUFBSSxDQUFDRSxXQUFELENBQUosQ0FBa0JELFlBQWxCLEVBQWdDRixFQUFoQyxDQUFQO0FBQ0Q7QUFDRixpQkFYVyxDQUFaO0FBWUQsZUFiZ0IsQ0FBakI7QUFjRCxhQWZELE1BZ0JLO0FBQ0hOLGNBQUFBLFFBQVEsQ0FBQ1csc0JBQUlDLFVBQUosR0FBaUIsNENBQWxCLEVBQWdFSixZQUFoRSxDQUFSO0FBQ0EscUJBQU9GLEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBTztBQUFDa0IsZ0JBQUFBLE9BQU8sRUFBQ00sSUFBSSxDQUFDTjtBQUFkLGVBQVAsQ0FBTCxHQUFzQ2pCLElBQUksQ0FBQ1ksT0FBTCxDQUFhUixzQkFBSWMsWUFBakIsQ0FBL0M7QUFDRDtBQUNGLFdBeEJIO0FBeUJELFNBNUJEO0FBNkJELE9BOUJELE1BK0JLO0FBQ0h6QixRQUFBQSxRQUFRLENBQUNXLHNCQUFJQyxVQUFKLEdBQWlCLDJDQUFsQixFQUErREosWUFBL0QsQ0FBUjtBQUNBLGVBQU9GLEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBTztBQUFDa0IsVUFBQUEsT0FBTyxFQUFDO0FBQVQsU0FBUCxDQUFMLEdBQStCakIsSUFBSSxDQUFDWSxPQUFMLENBQWFSLHNCQUFJYyxZQUFqQixDQUF4QztBQUNEO0FBQ0YsS0EzQ0Q7QUE0Q0QsR0FsREQ7QUFvREE7Ozs7Ozs7O0FBTUF4QixFQUFBQSxHQUFHLENBQUNFLFNBQUosQ0FBYzRDLFFBQWQsR0FBeUIsVUFBU3ZDLFlBQVQsRUFBdUJGLEVBQXZCLEVBQTJCO0FBQ2xELFFBQUlDLElBQUksR0FBRyxJQUFYO0FBQ0FQLElBQUFBLFFBQVEsQ0FBQ1csc0JBQUlDLFVBQUosR0FBaUIsK0RBQWxCLEVBQW1GSixZQUFuRixDQUFSO0FBRUFELElBQUFBLElBQUksQ0FBQ00sTUFBTCxDQUFZQyxvQkFBWixDQUFpQ04sWUFBakMsRUFBK0MsVUFBVU8sR0FBVixFQUFlQyxTQUFmLEVBQTBCO0FBRXZFLFVBQUlELEdBQUcsSUFBSUMsU0FBUyxDQUFDQyxNQUFWLEtBQXFCLENBQWhDLEVBQW1DO0FBQ2pDbkIsUUFBQUEsVUFBVSxDQUFDLHdDQUFELEVBQTJDVSxZQUEzQyxDQUFWO0FBQ0EsZUFBT0YsRUFBRSxHQUFHQSxFQUFFLENBQUM7QUFBQ1ksVUFBQUEsR0FBRyxFQUFFLHdCQUF3QlY7QUFBOUIsU0FBRCxDQUFMLEdBQXFERCxJQUFJLENBQUNZLE9BQUwsQ0FBYVIsc0JBQUlTLFVBQWpCLENBQTlEO0FBQ0Q7O0FBRUQsVUFBSUMsSUFBSSxHQUFHTCxTQUFTLENBQUMsQ0FBRCxDQUFwQixDQVB1RSxDQVF2RTs7QUFDQVIsTUFBQUEsWUFBWSxHQUFHYSxJQUFJLENBQUMyQixJQUFwQjtBQUVBLFVBQUkzQixJQUFJLENBQUNDLE9BQUwsQ0FBYUMsVUFBYixLQUE0QjBCLFNBQTVCLElBQ0E1QixJQUFJLENBQUNDLE9BQUwsQ0FBYUMsVUFBYixLQUE0QixJQURoQyxFQUVFLE9BQU9qQixFQUFFLENBQUM7QUFBQ1ksUUFBQUEsR0FBRyxFQUFHO0FBQVAsT0FBRCxDQUFUOztBQUVGUSxNQUFBQSxPQUFPLENBQUMsUUFBRCxDQUFQLENBQWtCd0IsSUFBbEIsQ0FBdUI7QUFDckJ0QixRQUFBQSxNQUFNLEVBQUVQLElBQUksQ0FBQ0MsT0FBTCxDQUFhQyxVQUFiLENBQXdCTTtBQURYLE9BQXZCLEVBRUcsVUFBU2QsR0FBVCxFQUFjZSxJQUFkLEVBQW9CO0FBQ3JCLFlBQUlmLEdBQUosRUFDRSxPQUFPVCxFQUFFLEdBQUdBLEVBQUUsQ0FBQztBQUFDWSxVQUFBQSxHQUFHLEVBQUNILEdBQUw7QUFBVW9DLFVBQUFBLElBQUksRUFBR3JCO0FBQWpCLFNBQUQsQ0FBTCxHQUFnQ3ZCLElBQUksQ0FBQ1ksT0FBTCxDQUFhUixzQkFBSVMsVUFBakIsQ0FBekM7O0FBRUYsWUFBSVUsSUFBSSxDQUFDTixPQUFMLEtBQWlCLElBQXJCLEVBQTJCO0FBQ3pCeEIsVUFBQUEsUUFBUSxDQUFDVyxzQkFBSUMsVUFBSixHQUFpQiwyQ0FBbEIsRUFBK0RKLFlBQS9ELENBQVI7QUFDQSxpQkFBT0YsRUFBRSxHQUFHQSxFQUFFLENBQUM7QUFBQ1ksWUFBQUEsR0FBRyxFQUFDSCxHQUFMO0FBQVVvQyxZQUFBQSxJQUFJLEVBQUdyQjtBQUFqQixXQUFELENBQUwsR0FBZ0N2QixJQUFJLENBQUNZLE9BQUwsQ0FBYVIsc0JBQUlTLFVBQWpCLENBQXpDO0FBQ0Q7O0FBRURXLFFBQUFBLGlCQUFpQixDQUFDVixJQUFJLENBQUNDLE9BQUwsQ0FBYUMsVUFBYixDQUF3Qk0sU0FBekIsRUFBb0NyQixZQUFwQyxFQUFrRCxVQUFVd0IsWUFBVixFQUF3QjtBQUN6RkMsVUFBQUEsWUFBWSxDQUFDWixJQUFJLENBQUNDLE9BQUwsQ0FBYUMsVUFBYixDQUF3Qk0sU0FBekIsRUFBb0NHLFlBQXBDLEVBQWtELFVBQVNqQixHQUFULEVBQWNtQixHQUFkLEVBQW1CO0FBQy9FLGdCQUFJbkIsR0FBRyxLQUFLLElBQVosRUFBa0I7QUFDaEJXLGNBQUFBLE9BQU8sQ0FBQyxRQUFELENBQVAsQ0FBa0IwQixJQUFsQixDQUF1QjtBQUFDeEIsZ0JBQUFBLE1BQU0sRUFBRVAsSUFBSSxDQUFDQyxPQUFMLENBQWFDLFVBQWIsQ0FBd0JNO0FBQWpDLGVBQXZCLEVBQW9FLFVBQVNnQixJQUFULEVBQWVDLEtBQWYsRUFBc0I7QUFDeEZoRCxnQkFBQUEsVUFBVSxDQUFDaUIsR0FBRCxDQUFWO0FBQ0EsdUJBQU9ULEVBQUUsR0FBR0EsRUFBRSxDQUFDO0FBQUNZLGtCQUFBQSxHQUFHLEVBQUVZLElBQUksQ0FBQ0ssTUFBTCxHQUFjcEI7QUFBcEIsaUJBQUQsQ0FBTCxHQUFrQ1IsSUFBSSxDQUFDWSxPQUFMLENBQWFSLHNCQUFJUyxVQUFqQixDQUEzQztBQUNELGVBSEQ7O0FBSUEscUJBQU8sS0FBUDtBQUNEOztBQUVEcEIsWUFBQUEsUUFBUSxDQUFDVyxzQkFBSUMsVUFBSixHQUFpQixpQ0FBbEIsRUFBcURKLFlBQXJELENBQVI7QUFDQVIsWUFBQUEsUUFBUSxDQUFDVyxzQkFBSUMsVUFBSixHQUFpQixtQkFBbEIsRUFBdUNrQixJQUFJLENBQUNNLGdCQUE1QyxDQUFSO0FBQ0E3QixZQUFBQSxJQUFJLENBQUM4QyxNQUFMLENBQVk3QyxZQUFaLEVBQTBCLFVBQVNPLEdBQVQsRUFBY3NCLEtBQWQsRUFBcUI7QUFDN0Msa0JBQUl0QixHQUFKLEVBQVMsT0FBT1QsRUFBRSxDQUFDUyxHQUFELENBQVQ7QUFDVCxxQkFBT1QsRUFBRSxHQUFHQSxFQUFFLENBQUMsSUFBRCxFQUFPd0IsSUFBSSxDQUFDSyxNQUFMLEdBQWNELEdBQXJCLENBQUwsR0FBaUMzQixJQUFJLENBQUNZLE9BQUwsQ0FBYVIsc0JBQUljLFlBQWpCLENBQTFDO0FBQ0QsYUFIRDtBQUlELFdBZlcsQ0FBWjtBQWdCRCxTQWpCZ0IsQ0FBakI7QUFrQkQsT0E3QkQ7QUE4QkQsS0E3Q0Q7QUE4Q0QsR0FsREQ7QUFvREE7Ozs7Ozs7O0FBTUF4QixFQUFBQSxHQUFHLENBQUNFLFNBQUosQ0FBY21ELE9BQWQsR0FBd0IsVUFBUzlDLFlBQVQsRUFBdUJGLEVBQXZCLEVBQTJCO0FBQ2pELFFBQUlDLElBQUksR0FBRyxJQUFYO0FBQ0FQLElBQUFBLFFBQVEsQ0FBQ1csc0JBQUlDLFVBQUosR0FBaUIsd0RBQWxCLEVBQTRFSixZQUE1RSxDQUFSO0FBRUFELElBQUFBLElBQUksQ0FBQ00sTUFBTCxDQUFZQyxvQkFBWixDQUFpQ04sWUFBakMsRUFBK0MsVUFBVU8sR0FBVixFQUFlQyxTQUFmLEVBQTBCO0FBRXZFLFVBQUlELEdBQUcsSUFBSUMsU0FBUyxDQUFDQyxNQUFWLEtBQXFCLENBQWhDLEVBQW1DO0FBQ2pDbkIsUUFBQUEsVUFBVSxDQUFDLHVDQUFELEVBQTBDVSxZQUExQyxDQUFWO0FBQ0EsZUFBT0YsRUFBRSxHQUFHQSxFQUFFLENBQUM7QUFBQ1ksVUFBQUEsR0FBRyxFQUFFLHdCQUF3QlY7QUFBOUIsU0FBRCxDQUFMLEdBQXFERCxJQUFJLENBQUNZLE9BQUwsQ0FBYVIsc0JBQUlTLFVBQWpCLENBQTlEO0FBQ0Q7O0FBRUQsVUFBSUMsSUFBSSxHQUFHTCxTQUFTLENBQUMsQ0FBRCxDQUFwQixDQVB1RSxDQVF2RTs7QUFDQVIsTUFBQUEsWUFBWSxHQUFHYSxJQUFJLENBQUMyQixJQUFwQjs7QUFDQSxVQUFJM0IsSUFBSSxDQUFDQyxPQUFMLENBQWFDLFVBQWpCLEVBQTZCO0FBQzNCRyxRQUFBQSxPQUFPLENBQUMsUUFBRCxDQUFQLENBQWtCMEIsSUFBbEIsQ0FBdUI7QUFBQ3hCLFVBQUFBLE1BQU0sRUFBRVAsSUFBSSxDQUFDQyxPQUFMLENBQWFDLFVBQWIsQ0FBd0JNO0FBQWpDLFNBQXZCLEVBQW9FLFVBQVNkLEdBQVQsRUFBY2UsSUFBZCxFQUFvQjtBQUN0RixjQUFJZixHQUFHLEtBQUssSUFBWixFQUNFLE9BQU9ULEVBQUUsR0FBR0EsRUFBRSxDQUFDO0FBQUNZLFlBQUFBLEdBQUcsRUFBQ0g7QUFBTCxXQUFELENBQUwsR0FBbUJSLElBQUksQ0FBQ1ksT0FBTCxDQUFhUixzQkFBSVMsVUFBakIsQ0FBNUI7O0FBQ0YsY0FBSVUsSUFBSSxDQUFDTixPQUFMLEtBQWlCLElBQXJCLEVBQTJCO0FBQ3pCTyxZQUFBQSxpQkFBaUIsQ0FBQ1YsSUFBSSxDQUFDQyxPQUFMLENBQWFDLFVBQWIsQ0FBd0JNLFNBQXpCLEVBQW9DckIsWUFBcEMsRUFBa0QsVUFBVXdCLFlBQVYsRUFBd0I7QUFDekZDLGNBQUFBLFlBQVksQ0FBQ1osSUFBSSxDQUFDQyxPQUFMLENBQWFDLFVBQWIsQ0FBd0JNLFNBQXpCLEVBQW9DRyxZQUFwQyxFQUFrRCxVQUFTakIsR0FBVCxFQUFjbUIsR0FBZCxFQUFtQjtBQUMvRSxvQkFBSW5CLEdBQUcsS0FBSyxJQUFaLEVBQ0E7QUFDRVcsa0JBQUFBLE9BQU8sQ0FBQyxRQUFELENBQVAsQ0FBa0J3QixJQUFsQixDQUF1QjtBQUFDdEIsb0JBQUFBLE1BQU0sRUFBRVAsSUFBSSxDQUFDQyxPQUFMLENBQWFDLFVBQWIsQ0FBd0JNO0FBQWpDLG1CQUF2QixFQUFvRSxVQUFTZ0IsSUFBVCxFQUFlQyxLQUFmLEVBQXNCO0FBQ3hGaEQsb0JBQUFBLFVBQVUsQ0FBQ2lCLEdBQUQsQ0FBVjtBQUNBLDJCQUFPVCxFQUFFLEdBQUdBLEVBQUUsQ0FBQztBQUFDWSxzQkFBQUEsR0FBRyxFQUFDWSxJQUFJLENBQUNLLE1BQUwsR0FBY3BCO0FBQW5CLHFCQUFELENBQUwsR0FBaUNSLElBQUksQ0FBQ1ksT0FBTCxDQUFhUixzQkFBSVMsVUFBakIsQ0FBMUM7QUFDRCxtQkFIRDtBQUlELGlCQU5ELE1BT0s7QUFDSHBCLGtCQUFBQSxRQUFRLENBQUNXLHNCQUFJQyxVQUFKLEdBQWlCLGlDQUFsQixFQUFxREosWUFBckQsQ0FBUjtBQUNBUixrQkFBQUEsUUFBUSxDQUFDVyxzQkFBSUMsVUFBSixHQUFpQixtQkFBbEIsRUFBdUNrQixJQUFJLENBQUNNLGdCQUE1QyxDQUFSO0FBQ0E3QixrQkFBQUEsSUFBSSxDQUFDOEMsTUFBTCxDQUFZN0MsWUFBWixFQUEwQixVQUFTTyxHQUFULEVBQWNzQixLQUFkLEVBQXFCO0FBQzdDLHdCQUFJdEIsR0FBSixFQUFTLE9BQU9ULEVBQUUsQ0FBQ1MsR0FBRCxDQUFUO0FBQ1QsMkJBQU9ULEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBT3dCLElBQUksQ0FBQ0ssTUFBTCxHQUFjRCxHQUFyQixDQUFMLEdBQWlDM0IsSUFBSSxDQUFDWSxPQUFMLENBQWFSLHNCQUFJYyxZQUFqQixDQUExQztBQUNELG1CQUhEO0FBSUQ7QUFDRixlQWhCVyxDQUFaO0FBaUJELGFBbEJnQixDQUFqQjtBQW1CRCxXQXBCRCxNQXFCSztBQUNIekIsWUFBQUEsUUFBUSxDQUFDVyxzQkFBSUMsVUFBSixHQUFpQiw0Q0FBbEIsRUFBZ0VKLFlBQWhFLENBQVI7QUFDQSxtQkFBT0YsRUFBRSxHQUFHQSxFQUFFLENBQUMsSUFBRCxFQUFPO0FBQUNrQixjQUFBQSxPQUFPLEVBQUNNLElBQUksQ0FBQ047QUFBZCxhQUFQLENBQUwsR0FBc0NqQixJQUFJLENBQUNZLE9BQUwsQ0FBYVIsc0JBQUljLFlBQWpCLENBQS9DO0FBQ0Q7QUFDRixTQTVCRDtBQTZCRCxPQTlCRCxNQStCSztBQUNIekIsUUFBQUEsUUFBUSxDQUFDVyxzQkFBSUMsVUFBSixHQUFpQiwyQ0FBbEIsRUFBK0RKLFlBQS9ELENBQVI7QUFDQSxlQUFPRixFQUFFLEdBQUdBLEVBQUUsQ0FBQztBQUFDa0IsVUFBQUEsT0FBTyxFQUFDLEtBQVQ7QUFBZ0JOLFVBQUFBLEdBQUcsRUFBRTtBQUFyQixTQUFELENBQUwsR0FBNERYLElBQUksQ0FBQ1ksT0FBTCxDQUFhUixzQkFBSWMsWUFBakIsQ0FBckU7QUFDRDtBQUNGLEtBN0NEO0FBOENELEdBbEREOztBQW9EQSxNQUFJOEIsSUFBSSxHQUFHLFNBQVBBLElBQU8sQ0FBVUMsR0FBVixFQUFlQyxRQUFmLEVBQXlCO0FBQ2xDLFFBQUl0QixNQUFNLEdBQUcsRUFBYjs7QUFFQSxRQUFJdUIsQ0FBQyxHQUFHQywwQkFBTUosSUFBTixDQUFXQyxHQUFYLEVBQWdCO0FBQ3RCSSxNQUFBQSxHQUFHLEVBQUVDLE9BQU8sQ0FBQ0QsR0FEUztBQUV0QkUsTUFBQUEsU0FBUyxFQUFFLElBQUUsSUFBRixHQUFPLElBRkk7QUFHdEJDLE1BQUFBLE9BQU8sRUFBRTdEO0FBSGEsS0FBaEIsRUFJTCxVQUFTYSxHQUFULEVBQWM7QUFDZixVQUFJMEMsUUFBSixFQUNFQSxRQUFRLENBQUMxQyxHQUFHLEdBQUdBLEdBQUcsQ0FBQ2lELElBQVAsR0FBYyxDQUFsQixFQUFxQjdCLE1BQXJCLENBQVI7QUFDSCxLQVBPLENBQVI7O0FBU0F1QixJQUFBQSxDQUFDLENBQUNPLE1BQUYsQ0FBU0MsRUFBVCxDQUFZLE1BQVosRUFBb0IsVUFBU2YsSUFBVCxFQUFlO0FBQ2pDaEIsTUFBQUEsTUFBTSxJQUFJZ0IsSUFBVjtBQUNELEtBRkQ7QUFJQU8sSUFBQUEsQ0FBQyxDQUFDUyxNQUFGLENBQVNELEVBQVQsQ0FBWSxNQUFaLEVBQW9CLFVBQVNmLElBQVQsRUFBZTtBQUNqQ2hCLE1BQUFBLE1BQU0sSUFBSWdCLElBQVY7QUFDRCxLQUZEO0FBR0QsR0FuQkQ7QUFxQkE7Ozs7Ozs7OztBQU9BLE1BQUlsQixZQUFZLEdBQUcsU0FBZkEsWUFBZSxDQUFTSixTQUFULEVBQW9CRyxZQUFwQixFQUFrQzFCLEVBQWxDLEVBQXNDO0FBQ3ZELFFBQUkyRCxNQUFNLEdBQUcsRUFBYjtBQUVBLGdDQUFXakMsWUFBWCxFQUF5QixVQUFTb0MsT0FBVCxFQUFrQlgsUUFBbEIsRUFBNEI7QUFDbkRRLE1BQUFBLE1BQU0sSUFBSSxPQUFPRyxPQUFqQjtBQUNBYixNQUFBQSxJQUFJLENBQUMsUUFBTTFCLFNBQU4sR0FBZ0IsR0FBaEIsR0FBb0J1QyxPQUFyQixFQUNDLFVBQVNKLElBQVQsRUFBZTdCLE1BQWYsRUFBdUI7QUFDckI4QixRQUFBQSxNQUFNLElBQUksT0FBTzlCLE1BQWpCO0FBQ0EsWUFBSTZCLElBQUksS0FBSyxDQUFiLEVBQ0VQLFFBQVEsR0FEVixLQUdFQSxRQUFRLENBQUMsTUFBSVcsT0FBSixHQUFZLFVBQWIsQ0FBUjtBQUNILE9BUEYsQ0FBSjtBQVFELEtBVkQsRUFVRyxVQUFTckQsR0FBVCxFQUFjO0FBQ2YsVUFBSUEsR0FBSixFQUNFLE9BQU9ULEVBQUUsQ0FBQzJELE1BQU0sR0FBRyxJQUFULEdBQWdCbEQsR0FBakIsQ0FBVDtBQUNGLGFBQU9ULEVBQUUsQ0FBQyxJQUFELEVBQU8yRCxNQUFQLENBQVQ7QUFDRCxLQWREO0FBZUQsR0FsQkQ7QUFvQkE7Ozs7Ozs7OztBQU9BLE1BQUlsQyxpQkFBaUIsR0FBRyxTQUFwQkEsaUJBQW9CLENBQVNGLFNBQVQsRUFBb0J3QyxTQUFwQixFQUErQi9ELEVBQS9CLEVBQW1DO0FBQ3pELFFBQUksT0FBT3VCLFNBQVAsS0FBcUIsUUFBekIsRUFDRSxPQUFPdkIsRUFBRSxDQUFDLEVBQUQsQ0FBVDtBQUNGLFFBQUl1QixTQUFTLENBQUNBLFNBQVMsQ0FBQ1osTUFBVixHQUFtQixDQUFwQixDQUFULEtBQW9DLEdBQXhDLEVBQ0VZLFNBQVMsSUFBSSxHQUFiOztBQUVGLFFBQUl5QyxpQkFBaUIsR0FBRyxTQUFwQkEsaUJBQW9CLENBQVNDLElBQVQsRUFBZWQsUUFBZixFQUF5QjtBQUMvQ2UscUJBQUdDLE1BQUgsQ0FBVTVDLFNBQVMsR0FBQzBDLElBQXBCLEVBQTBCLFVBQVNFLE1BQVQsRUFBaUI7QUFDekMsWUFBSUEsTUFBSixFQUFZO0FBQ1YsY0FBSTtBQUNGLGdCQUFJQyxXQUFXLEdBQUdGLGVBQUdHLFlBQUgsQ0FBZ0I5QyxTQUFTLEdBQUcwQyxJQUE1QixDQUFsQjs7QUFDQSxnQkFBSXBCLElBQUksR0FBR3BELG1CQUFPNkUsV0FBUCxDQUFtQkYsV0FBbkIsRUFBZ0M3QyxTQUFTLEdBQUcwQyxJQUE1QyxDQUFYO0FBQ0QsV0FIRCxDQUdFLE9BQU9NLENBQVAsRUFBVTtBQUNWdkMsWUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNzQyxDQUFDLENBQUNDLE9BQUYsSUFBYUQsQ0FBM0I7QUFDRDs7QUFFRCxjQUFJMUIsSUFBSSxJQUFJQSxJQUFJLENBQUM0QixJQUFqQixFQUF1QjtBQUNyQix3Q0FBVzVCLElBQUksQ0FBQzRCLElBQWhCLEVBQXNCLFVBQVNDLElBQVQsRUFBZUMsS0FBZixFQUFzQjtBQUMxQyxrQkFBSUQsSUFBSSxDQUFDaEMsSUFBTCxJQUFhZ0MsSUFBSSxDQUFDaEMsSUFBTCxLQUFjcUIsU0FBL0IsRUFBMEM7QUFDeEMsb0JBQUlXLElBQUksQ0FBQ0UsV0FBTCxJQUFvQix5QkFBT0YsSUFBSSxDQUFDRSxXQUFaLE1BQTZCLFFBQXJELEVBQStEO0FBQzdELHNCQUFJRixJQUFJLENBQUNHLFlBQVQsRUFDRWpGLFlBQVksR0FBR2tGLFFBQVEsQ0FBQ0osSUFBSSxDQUFDRyxZQUFOLENBQXZCO0FBQ0YseUJBQU9GLEtBQUssQ0FBQ0QsSUFBSSxDQUFDRSxXQUFOLENBQVo7QUFDRCxpQkFKRCxNQUtLO0FBQ0gseUJBQU9ELEtBQUssRUFBWjtBQUNEO0FBQ0YsZUFURCxNQVdFLE9BQU9BLEtBQUssRUFBWjtBQUNILGFBYkQsRUFhRyxVQUFTSSxNQUFULEVBQWdCO0FBQ2pCLHFCQUFPNUIsUUFBUSxDQUFDNEIsTUFBRCxDQUFmO0FBQ0QsYUFmRDtBQWdCRCxXQWpCRCxNQWtCSztBQUNILG1CQUFPNUIsUUFBUSxFQUFmO0FBQ0Q7QUFDRixTQTdCRCxNQThCSztBQUNILGlCQUFPQSxRQUFRLEVBQWY7QUFDRDtBQUNGLE9BbENEO0FBbUNELEtBcENEOztBQXNDQSxnQ0FBVyxDQUFDLGdCQUFELEVBQW1CLGNBQW5CLEVBQW1DLGNBQW5DLENBQVgsRUFBK0RhLGlCQUEvRCxFQUNpQixVQUFTZSxPQUFULEVBQWdCO0FBQ2QsYUFBTy9FLEVBQUUsQ0FBQytFLE9BQUssR0FBR0EsT0FBSCxHQUFXLEVBQWpCLENBQVQ7QUFDRCxLQUhsQjtBQUlELEdBaEREO0FBbURBOzs7Ozs7OztBQU1BcEYsRUFBQUEsR0FBRyxDQUFDRSxTQUFKLENBQWNtRixjQUFkLEdBQStCLFVBQVU5RSxZQUFWLEVBQXdCRixFQUF4QixFQUE0QjtBQUN6RCxTQUFLRixLQUFMLENBQVc7QUFBQ0ksTUFBQUEsWUFBWSxFQUFFQSxZQUFmO0FBQTZCRSxNQUFBQSxNQUFNLEVBQUU7QUFBckMsS0FBWCxFQUEyREosRUFBM0Q7QUFDRCxHQUZEO0FBSUE7Ozs7Ozs7O0FBTUFMLEVBQUFBLEdBQUcsQ0FBQ0UsU0FBSixDQUFjb0YsYUFBZCxHQUE4QixVQUFVL0UsWUFBVixFQUF3QkYsRUFBeEIsRUFBNEI7QUFDeEQsU0FBS0YsS0FBTCxDQUFXO0FBQUNJLE1BQUFBLFlBQVksRUFBRUEsWUFBZjtBQUE2QkUsTUFBQUEsTUFBTSxFQUFFO0FBQXJDLEtBQVgsRUFBMkRKLEVBQTNEO0FBQ0QsR0FGRDtBQUlBOzs7Ozs7OztBQU1BTCxFQUFBQSxHQUFHLENBQUNFLFNBQUosQ0FBY3FGLGFBQWQsR0FBOEIsVUFBVW5GLElBQVYsRUFBZ0JDLEVBQWhCLEVBQW9CO0FBQ2hELFNBQUtrQyxZQUFMLENBQWtCbkMsSUFBSSxDQUFDb0YsUUFBdkIsRUFBaUNwRixJQUFJLENBQUNvQyxTQUF0QyxFQUFpRG5DLEVBQWpEO0FBQ0QsR0FGRDtBQUlEIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgY3N0ICAgICAgICBmcm9tICcuLi8uLi9jb25zdGFudHMnO1xuaW1wb3J0IENvbW1vbiAgICAgZnJvbSAnLi4vQ29tbW9uJztcbmltcG9ydCBmcyAgICAgICAgIGZyb20gJ2ZzJztcbmltcG9ydCBlYWNoU2VyaWVzIGZyb20gJ2FzeW5jL2VhY2hTZXJpZXMnO1xuaW1wb3J0IGNoaWxkICAgICAgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5cbnZhciBwcmludEVycm9yID0gQ29tbW9uLnByaW50RXJyb3I7XG52YXIgcHJpbnRPdXQgPSBDb21tb24ucHJpbnRPdXQ7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKENMSSkge1xuXG4gIHZhciBFWEVDX1RJTUVPVVQgPSA2MDAwMDsgLy8gRGVmYXVsdDogMSBtaW5cblxuICBDTEkucHJvdG90eXBlLl9wdWxsID0gZnVuY3Rpb24ob3B0cywgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB2YXIgcHJvY2Vzc19uYW1lID0gb3B0cy5wcm9jZXNzX25hbWU7XG4gICAgdmFyIHJlbG9hZF90eXBlID0gb3B0cy5hY3Rpb247XG5cbiAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdVcGRhdGluZyByZXBvc2l0b3J5IGZvciBwcm9jZXNzIG5hbWUgJXMnLCBwcm9jZXNzX25hbWUpO1xuXG4gICAgdGhhdC5DbGllbnQuZ2V0UHJvY2Vzc0J5TmFtZU9ySWQocHJvY2Vzc19uYW1lLCBmdW5jdGlvbiAoZXJyLCBwcm9jZXNzZXMpIHtcblxuICAgICAgaWYgKGVyciB8fCBwcm9jZXNzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHByaW50RXJyb3IoJ05vIHByb2Nlc3NlcyB3aXRoIHRoaXMgbmFtZSBvciBpZCA6ICVzJywgcHJvY2Vzc19uYW1lKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzogJ1Byb2Nlc3Mgbm90IGZvdW5kOiAnICsgcHJvY2Vzc19uYW1lfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcHJvYyA9IHByb2Nlc3Nlc1swXTtcbiAgICAgIGlmICghcHJvYy5wbTJfZW52LnZlcnNpb25pbmcpIHtcbiAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnTm8gdmVyc2lvbmluZyBzeXN0ZW0gZm91bmQgZm9yIHByb2Nlc3MgJXMnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYih7c3VjY2VzczpmYWxzZSwgbXNnOiAnTm8gdmVyc2lvbmluZyBzeXN0ZW0gZm91bmQgZm9yIHByb2Nlc3MnfSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9XG4gICAgICByZXF1aXJlKCd2aXppb24nKS51cGRhdGUoe1xuICAgICAgICBmb2xkZXI6IHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aFxuICAgICAgfSwgZnVuY3Rpb24oZXJyLCBtZXRhKSB7XG4gICAgICAgIGlmIChlcnIgIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOmVycn0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtZXRhLnN1Y2Nlc3MgPT09IHRydWUpIHtcbiAgICAgICAgICBnZXRQb3N0VXBkYXRlQ21kcyhwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGgsIHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24gKGNvbW1hbmRfbGlzdCkge1xuICAgICAgICAgICAgZXhlY0NvbW1hbmRzKHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aCwgY29tbWFuZF9saXN0LCBmdW5jdGlvbihlcnIsIHJlcykge1xuICAgICAgICAgICAgICBpZiAoZXJyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKHttc2c6IG1ldGEub3V0cHV0ICsgZXJyfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1Byb2Nlc3Mgc3VjY2Vzc2Z1bGx5IHVwZGF0ZWQgJXMnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICAgICAgICAgIHByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0N1cnJlbnQgY29tbWl0ICVzJywgbWV0YS5jdXJyZW50X3JldmlzaW9uKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhhdFtyZWxvYWRfdHlwZV0ocHJvY2Vzc19uYW1lLCBmdW5jdGlvbihlcnIsIHByb2NzKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoZXJyICYmIGNiKSByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgICAgICAgICAgIGlmIChlcnIpIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIG1ldGEub3V0cHV0ICsgcmVzKSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnQWxyZWFkeSB1cC10by1kYXRlIG9yIGFuIGVycm9yIG9jY3VyZWQgZm9yIGFwcDogJXMnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKHtzdWNjZXNzOmZhbHNlLCBtc2cgOiAnQWxyZWFkeSB1cCB0byBkYXRlJ30pIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDTEkgbWV0aG9kIGZvciB1cGRhdGluZyBhIHJlcG9zaXRvcnkgdG8gYSBzcGVjaWZpYyBjb21taXQgaWRcbiAgICogQG1ldGhvZCBwdWxsQ29tbWl0SWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb2Nlc3NfbmFtZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29tbWl0X2lkXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUucHVsbENvbW1pdElkID0gZnVuY3Rpb24ocHJvY2Vzc19uYW1lLCBjb21taXRfaWQsIGNiKSB7XG4gICAgdmFyIHJlbG9hZF90eXBlID0gJ3JlbG9hZCc7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnVXBkYXRpbmcgcmVwb3NpdG9yeSBmb3IgcHJvY2VzcyBuYW1lICVzJywgcHJvY2Vzc19uYW1lKTtcblxuICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NCeU5hbWVPcklkKHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24gKGVyciwgcHJvY2Vzc2VzKSB7XG5cbiAgICAgIGlmIChlcnIgfHwgcHJvY2Vzc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBwcmludEVycm9yKCdObyBwcm9jZXNzZXMgd2l0aCB0aGlzIG5hbWUgb3IgaWQgOiAlcycsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKHttc2c6ICdQcm9jZXNzIG5vdCBmb3VuZDogJyArIHByb2Nlc3NfbmFtZX0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHByb2MgPSBwcm9jZXNzZXNbMF07XG4gICAgICBpZiAocHJvYy5wbTJfZW52LnZlcnNpb25pbmcpIHtcbiAgICAgICAgcmVxdWlyZSgndml6aW9uJykuaXNVcFRvRGF0ZSh7Zm9sZGVyOiBwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGh9LCBmdW5jdGlvbihlcnIsIG1ldGEpIHtcbiAgICAgICAgICBpZiAoZXJyICE9PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzplcnJ9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgICAgcmVxdWlyZSgndml6aW9uJykucmV2ZXJ0VG8oXG4gICAgICAgICAgICB7cmV2aXNpb246IGNvbW1pdF9pZCxcbiAgICAgICAgICAgICBmb2xkZXI6IHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aH0sXG4gICAgICAgICAgICBmdW5jdGlvbihlcnIyLCBtZXRhMikge1xuICAgICAgICAgICAgICBpZiAoIWVycjIgJiYgbWV0YTIuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGdldFBvc3RVcGRhdGVDbWRzKHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aCwgcHJvY2Vzc19uYW1lLCBmdW5jdGlvbiAoY29tbWFuZF9saXN0KSB7XG4gICAgICAgICAgICAgICAgICBleGVjQ29tbWFuZHMocHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRoLCBjb21tYW5kX2xpc3QsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIgIT09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBwcmludEVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzplcnJ9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnUHJvY2VzcyBzdWNjZXNzZnVsbHkgdXBkYXRlZCAlcycsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnQ3VycmVudCBjb21taXQgJXMnLCBjb21taXRfaWQpO1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0W3JlbG9hZF90eXBlXShwcm9jZXNzX25hbWUsIGNiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnQWxyZWFkeSB1cC10by1kYXRlIG9yIGFuIGVycm9yIG9jY3VyZWQ6ICVzJywgcHJvY2Vzc19uYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCB7c3VjY2VzczptZXRhLnN1Y2Nlc3N9KSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ05vIHZlcnNpb25pbmcgc3lzdGVtIGZvdW5kIGZvciBwcm9jZXNzICVzJywgcHJvY2Vzc19uYW1lKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwge3N1Y2Nlc3M6ZmFsc2V9KSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQ0xJIG1ldGhvZCBmb3IgZG93bmdyYWRpbmcgYSByZXBvc2l0b3J5IHRvIHRoZSBwcmV2aW91cyBjb21taXQgKG9sZGVyKVxuICAgKiBAbWV0aG9kIGJhY2t3YXJkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9jZXNzX25hbWVcbiAgICogQHJldHVyblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uKHByb2Nlc3NfbmFtZSwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnRG93bmdyYWRpbmcgdG8gcHJldmlvdXMgY29tbWl0IHJlcG9zaXRvcnkgZm9yIHByb2Nlc3MgbmFtZSAlcycsIHByb2Nlc3NfbmFtZSk7XG5cbiAgICB0aGF0LkNsaWVudC5nZXRQcm9jZXNzQnlOYW1lT3JJZChwcm9jZXNzX25hbWUsIGZ1bmN0aW9uIChlcnIsIHByb2Nlc3Nlcykge1xuXG4gICAgICBpZiAoZXJyIHx8IHByb2Nlc3Nlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcHJpbnRFcnJvcignTm8gcHJvY2Vzc2VzIHdpdGggdGhpcyBuYW1lIG9yIGlkIDogJXMnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOiAnUHJvY2VzcyBub3QgZm91bmQ6ICcgKyBwcm9jZXNzX25hbWV9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBwcm9jID0gcHJvY2Vzc2VzWzBdO1xuICAgICAgLy8gaW4gY2FzZSB1c2VyIHNlYXJjaGVkIGJ5IGlkL3BpZFxuICAgICAgcHJvY2Vzc19uYW1lID0gcHJvYy5uYW1lO1xuXG4gICAgICBpZiAocHJvYy5wbTJfZW52LnZlcnNpb25pbmcgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgIHByb2MucG0yX2Vudi52ZXJzaW9uaW5nID09PSBudWxsKVxuICAgICAgICByZXR1cm4gY2Ioe21zZyA6ICdWZXJzaW9uaW5nIHVua25vd24nfSk7XG5cbiAgICAgIHJlcXVpcmUoJ3ZpemlvbicpLnByZXYoe1xuICAgICAgICBmb2xkZXI6IHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aFxuICAgICAgfSwgZnVuY3Rpb24oZXJyLCBtZXRhKSB7XG4gICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzplcnIsIGRhdGEgOiBtZXRhfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuXG4gICAgICAgIGlmIChtZXRhLnN1Y2Nlc3MgIT09IHRydWUpIHtcbiAgICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdObyB2ZXJzaW9uaW5nIHN5c3RlbSBmb3VuZCBmb3IgcHJvY2VzcyAlcycsIHByb2Nlc3NfbmFtZSk7XG4gICAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzplcnIsIGRhdGEgOiBtZXRhfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0UG9zdFVwZGF0ZUNtZHMocHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRoLCBwcm9jZXNzX25hbWUsIGZ1bmN0aW9uIChjb21tYW5kX2xpc3QpIHtcbiAgICAgICAgICBleGVjQ29tbWFuZHMocHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRoLCBjb21tYW5kX2xpc3QsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgICAgICBpZiAoZXJyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHJlcXVpcmUoJ3ZpemlvbicpLm5leHQoe2ZvbGRlcjogcHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRofSwgZnVuY3Rpb24oZXJyMiwgbWV0YTIpIHtcbiAgICAgICAgICAgICAgICBwcmludEVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzogbWV0YS5vdXRwdXQgKyBlcnJ9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1Byb2Nlc3Mgc3VjY2Vzc2Z1bGx5IHVwZGF0ZWQgJXMnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnQ3VycmVudCBjb21taXQgJXMnLCBtZXRhLmN1cnJlbnRfcmV2aXNpb24pO1xuICAgICAgICAgICAgdGhhdC5yZWxvYWQocHJvY2Vzc19uYW1lLCBmdW5jdGlvbihlcnIsIHByb2NzKSB7XG4gICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBtZXRhLm91dHB1dCArIHJlcykgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQ0xJIG1ldGhvZCBmb3IgdXBkYXRpbmcgYSByZXBvc2l0b3J5IHRvIHRoZSBuZXh0IGNvbW1pdCAobW9yZSByZWNlbnQpXG4gICAqIEBtZXRob2QgZm9yd2FyZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvY2Vzc19uYW1lXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uKHByb2Nlc3NfbmFtZSwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnVXBkYXRpbmcgdG8gbmV4dCBjb21taXQgcmVwb3NpdG9yeSBmb3IgcHJvY2VzcyBuYW1lICVzJywgcHJvY2Vzc19uYW1lKTtcblxuICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NCeU5hbWVPcklkKHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24gKGVyciwgcHJvY2Vzc2VzKSB7XG5cbiAgICAgIGlmIChlcnIgfHwgcHJvY2Vzc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBwcmludEVycm9yKCdObyBwcm9jZXNzZXMgd2l0aCB0aGlzIG5hbWUgb3IgaWQ6ICVzJywgcHJvY2Vzc19uYW1lKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzogJ1Byb2Nlc3Mgbm90IGZvdW5kOiAnICsgcHJvY2Vzc19uYW1lfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcHJvYyA9IHByb2Nlc3Nlc1swXTtcbiAgICAgIC8vIGluIGNhc2UgdXNlciBzZWFyY2hlZCBieSBpZC9waWRcbiAgICAgIHByb2Nlc3NfbmFtZSA9IHByb2MubmFtZTtcbiAgICAgIGlmIChwcm9jLnBtMl9lbnYudmVyc2lvbmluZykge1xuICAgICAgICByZXF1aXJlKCd2aXppb24nKS5uZXh0KHtmb2xkZXI6IHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aH0sIGZ1bmN0aW9uKGVyciwgbWV0YSkge1xuICAgICAgICAgIGlmIChlcnIgIT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOmVycn0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgICBpZiAobWV0YS5zdWNjZXNzID09PSB0cnVlKSB7XG4gICAgICAgICAgICBnZXRQb3N0VXBkYXRlQ21kcyhwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGgsIHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24gKGNvbW1hbmRfbGlzdCkge1xuICAgICAgICAgICAgICBleGVjQ29tbWFuZHMocHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRoLCBjb21tYW5kX2xpc3QsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyciAhPT0gbnVsbClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICByZXF1aXJlKCd2aXppb24nKS5wcmV2KHtmb2xkZXI6IHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aH0sIGZ1bmN0aW9uKGVycjIsIG1ldGEyKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzptZXRhLm91dHB1dCArIGVycn0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ1Byb2Nlc3Mgc3VjY2Vzc2Z1bGx5IHVwZGF0ZWQgJXMnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnQ3VycmVudCBjb21taXQgJXMnLCBtZXRhLmN1cnJlbnRfcmV2aXNpb24pO1xuICAgICAgICAgICAgICAgICAgdGhhdC5yZWxvYWQocHJvY2Vzc19uYW1lLCBmdW5jdGlvbihlcnIsIHByb2NzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBtZXRhLm91dHB1dCArIHJlcykgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnQWxyZWFkeSB1cC10by1kYXRlIG9yIGFuIGVycm9yIG9jY3VyZWQ6ICVzJywgcHJvY2Vzc19uYW1lKTtcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOm1ldGEuc3VjY2Vzc30pIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnTm8gdmVyc2lvbmluZyBzeXN0ZW0gZm91bmQgZm9yIHByb2Nlc3MgJXMnLCBwcm9jZXNzX25hbWUpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYih7c3VjY2VzczpmYWxzZSwgbXNnOiAnTm8gdmVyc2lvbmluZyBzeXN0ZW0gZm91bmQnfSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgdmFyIGV4ZWMgPSBmdW5jdGlvbiAoY21kLCBjYWxsYmFjaykge1xuICAgIHZhciBvdXRwdXQgPSAnJztcblxuICAgIHZhciBjID0gY2hpbGQuZXhlYyhjbWQsIHtcbiAgICAgIGVudjogcHJvY2Vzcy5lbnYsXG4gICAgICBtYXhCdWZmZXI6IDMqMTAyNCoxMDI0LFxuICAgICAgdGltZW91dDogRVhFQ19USU1FT1VUXG4gICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICBpZiAoY2FsbGJhY2spXG4gICAgICAgIGNhbGxiYWNrKGVyciA/IGVyci5jb2RlIDogMCwgb3V0cHV0KTtcbiAgICB9KTtcblxuICAgIGMuc3Rkb3V0Lm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgb3V0cHV0ICs9IGRhdGE7XG4gICAgfSk7XG5cbiAgICBjLnN0ZGVyci5vbignZGF0YScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIG91dHB1dCArPSBkYXRhO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKlxuICAgKiBAbWV0aG9kIGV4ZWNDb21tYW5kc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb19wYXRoXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjb21tYW5kX2xpc3RcbiAgICogQHJldHVyblxuICAgKi9cbiAgdmFyIGV4ZWNDb21tYW5kcyA9IGZ1bmN0aW9uKHJlcG9fcGF0aCwgY29tbWFuZF9saXN0LCBjYikge1xuICAgIHZhciBzdGRvdXQgPSAnJztcblxuICAgIGVhY2hTZXJpZXMoY29tbWFuZF9saXN0LCBmdW5jdGlvbihjb21tYW5kLCBjYWxsYmFjaykge1xuICAgICAgc3Rkb3V0ICs9ICdcXG4nICsgY29tbWFuZDtcbiAgICAgIGV4ZWMoJ2NkICcrcmVwb19wYXRoKyc7Jytjb21tYW5kLFxuICAgICAgICAgICBmdW5jdGlvbihjb2RlLCBvdXRwdXQpIHtcbiAgICAgICAgICAgICBzdGRvdXQgKz0gJ1xcbicgKyBvdXRwdXQ7XG4gICAgICAgICAgICAgaWYgKGNvZGUgPT09IDApXG4gICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGNhbGxiYWNrKCdgJytjb21tYW5kKydgIGZhaWxlZCcpO1xuICAgICAgICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgIGlmIChlcnIpXG4gICAgICAgIHJldHVybiBjYihzdGRvdXQgKyAnXFxuJyArIGVycik7XG4gICAgICByZXR1cm4gY2IobnVsbCwgc3Rkb3V0KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNjcmlwdGlvbiBTZWFyY2ggcHJvY2Vzcy5qc29uIGZvciBwb3N0LXVwZGF0ZSBjb21tYW5kc1xuICAgKiBAbWV0aG9kIGdldFBvc3RVcGRhdGVDbWRzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvX3BhdGhcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb2NfbmFtZVxuICAgKiBAcmV0dXJuXG4gICAqL1xuICB2YXIgZ2V0UG9zdFVwZGF0ZUNtZHMgPSBmdW5jdGlvbihyZXBvX3BhdGgsIHByb2NfbmFtZSwgY2IpIHtcbiAgICBpZiAodHlwZW9mIHJlcG9fcGF0aCAhPT0gJ3N0cmluZycpXG4gICAgICByZXR1cm4gY2IoW10pO1xuICAgIGlmIChyZXBvX3BhdGhbcmVwb19wYXRoLmxlbmd0aCAtIDFdICE9PSAnLycpXG4gICAgICByZXBvX3BhdGggKz0gJy8nO1xuXG4gICAgdmFyIHNlYXJjaEZvckNvbW1hbmRzID0gZnVuY3Rpb24oZmlsZSwgY2FsbGJhY2spIHtcbiAgICAgIGZzLmV4aXN0cyhyZXBvX3BhdGgrZmlsZSwgZnVuY3Rpb24oZXhpc3RzKSB7XG4gICAgICAgIGlmIChleGlzdHMpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGNvbmZfc3RyaW5nID0gZnMucmVhZEZpbGVTeW5jKHJlcG9fcGF0aCArIGZpbGUpO1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBDb21tb24ucGFyc2VDb25maWcoY29uZl9zdHJpbmcsIHJlcG9fcGF0aCArIGZpbGUpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlIHx8IGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuYXBwcykge1xuICAgICAgICAgICAgZWFjaFNlcmllcyhkYXRhLmFwcHMsIGZ1bmN0aW9uKGl0ZW0sIGNhbGxiKSB7XG4gICAgICAgICAgICAgIGlmIChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lID09PSBwcm9jX25hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5wb3N0X3VwZGF0ZSAmJiB0eXBlb2YoaXRlbS5wb3N0X3VwZGF0ZSkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoaXRlbS5leGVjX3RpbWVvdXQpXG4gICAgICAgICAgICAgICAgICAgIEVYRUNfVElNRU9VVCA9IHBhcnNlSW50KGl0ZW0uZXhlY190aW1lb3V0KTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYihpdGVtLnBvc3RfdXBkYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYigpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24oZmluYWwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGZpbmFsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGVhY2hTZXJpZXMoWydlY29zeXN0ZW0uanNvbicsICdwcm9jZXNzLmpzb24nLCAncGFja2FnZS5qc29uJ10sIHNlYXJjaEZvckNvbW1hbmRzLFxuICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZmluYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiKGZpbmFsID8gZmluYWwgOiBbXSk7XG4gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDTEkgbWV0aG9kIGZvciB1cGRhdGluZyBhIHJlcG9zaXRvcnlcbiAgICogQG1ldGhvZCBwdWxsQW5kUmVzdGFydFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvY2Vzc19uYW1lIG5hbWUgb2YgcHJvY2Vzc2VzIHRvIHB1bGxcbiAgICogQHJldHVyblxuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5wdWxsQW5kUmVzdGFydCA9IGZ1bmN0aW9uIChwcm9jZXNzX25hbWUsIGNiKSB7XG4gICAgdGhpcy5fcHVsbCh7cHJvY2Vzc19uYW1lOiBwcm9jZXNzX25hbWUsIGFjdGlvbjogJ3JlbG9hZCd9LCBjYik7XG4gIH07XG5cbiAgLyoqXG4gICAqIENMSSBtZXRob2QgZm9yIHVwZGF0aW5nIGEgcmVwb3NpdG9yeVxuICAgKiBAbWV0aG9kIHB1bGxBbmRSZWxvYWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb2Nlc3NfbmFtZSBuYW1lIG9mIHByb2Nlc3NlcyB0byBwdWxsXG4gICAqIEByZXR1cm5cbiAgICovXG4gIENMSS5wcm90b3R5cGUucHVsbEFuZFJlbG9hZCA9IGZ1bmN0aW9uIChwcm9jZXNzX25hbWUsIGNiKSB7XG4gICAgdGhpcy5fcHVsbCh7cHJvY2Vzc19uYW1lOiBwcm9jZXNzX25hbWUsIGFjdGlvbjogJ3JlbG9hZCd9LCBjYik7XG4gIH07XG5cbiAgLyoqXG4gICAqIENMSSBtZXRob2QgZm9yIHVwZGF0aW5nIGEgcmVwb3NpdG9yeSB0byBhIHNwZWNpZmljIGNvbW1pdCBpZFxuICAgKiBAbWV0aG9kIHB1bGxDb21taXRJZFxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0c1xuICAgKiBAcmV0dXJuXG4gICAqL1xuICBDTEkucHJvdG90eXBlLl9wdWxsQ29tbWl0SWQgPSBmdW5jdGlvbiAob3B0cywgY2IpIHtcbiAgICB0aGlzLnB1bGxDb21taXRJZChvcHRzLnBtMl9uYW1lLCBvcHRzLmNvbW1pdF9pZCwgY2IpO1xuICB9O1xuXG59XG4iXX0=