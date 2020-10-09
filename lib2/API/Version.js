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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvVmVyc2lvbi50cyJdLCJuYW1lcyI6WyJwcmludEVycm9yIiwiQ29tbW9uIiwicHJpbnRPdXQiLCJDTEkiLCJFWEVDX1RJTUVPVVQiLCJwcm90b3R5cGUiLCJfcHVsbCIsIm9wdHMiLCJjYiIsInRoYXQiLCJwcm9jZXNzX25hbWUiLCJyZWxvYWRfdHlwZSIsImFjdGlvbiIsImNzdCIsIlBSRUZJWF9NU0ciLCJDbGllbnQiLCJnZXRQcm9jZXNzQnlOYW1lT3JJZCIsImVyciIsInByb2Nlc3NlcyIsImxlbmd0aCIsIm1zZyIsImV4aXRDbGkiLCJFUlJPUl9FWElUIiwicHJvYyIsInBtMl9lbnYiLCJ2ZXJzaW9uaW5nIiwic3VjY2VzcyIsIlNVQ0NFU1NfRVhJVCIsInJlcXVpcmUiLCJ1cGRhdGUiLCJmb2xkZXIiLCJyZXBvX3BhdGgiLCJtZXRhIiwiZ2V0UG9zdFVwZGF0ZUNtZHMiLCJjb21tYW5kX2xpc3QiLCJleGVjQ29tbWFuZHMiLCJyZXMiLCJvdXRwdXQiLCJjdXJyZW50X3JldmlzaW9uIiwicHJvY3MiLCJjb25zb2xlIiwiZXJyb3IiLCJwdWxsQ29tbWl0SWQiLCJjb21taXRfaWQiLCJpc1VwVG9EYXRlIiwicmV2ZXJ0VG8iLCJyZXZpc2lvbiIsImVycjIiLCJtZXRhMiIsImJhY2t3YXJkIiwibmFtZSIsInVuZGVmaW5lZCIsInByZXYiLCJkYXRhIiwibmV4dCIsInJlbG9hZCIsImZvcndhcmQiLCJleGVjIiwiY21kIiwiY2FsbGJhY2siLCJjIiwiY2hpbGQiLCJlbnYiLCJwcm9jZXNzIiwibWF4QnVmZmVyIiwidGltZW91dCIsImNvZGUiLCJzdGRvdXQiLCJvbiIsInN0ZGVyciIsImNvbW1hbmQiLCJwcm9jX25hbWUiLCJzZWFyY2hGb3JDb21tYW5kcyIsImZpbGUiLCJmcyIsImV4aXN0cyIsImNvbmZfc3RyaW5nIiwicmVhZEZpbGVTeW5jIiwicGFyc2VDb25maWciLCJlIiwibWVzc2FnZSIsImFwcHMiLCJpdGVtIiwiY2FsbGIiLCJwb3N0X3VwZGF0ZSIsImV4ZWNfdGltZW91dCIsInBhcnNlSW50IiwiZmluYWwiLCJwdWxsQW5kUmVzdGFydCIsInB1bGxBbmRSZWxvYWQiLCJfcHVsbENvbW1pdElkIiwicG0yX25hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FBRUEsSUFBSUEsVUFBVSxHQUFHQyxtQkFBT0QsVUFBeEI7QUFDQSxJQUFJRSxRQUFRLEdBQUdELG1CQUFPQyxRQUF0Qjs7QUFFZSxrQkFBU0MsR0FBVCxFQUFjO0FBRTNCLE1BQUlDLFlBQVksR0FBRyxLQUFuQixDQUYyQixDQUVEOztBQUUxQkQsRUFBQUEsR0FBRyxDQUFDRSxTQUFKLENBQWNDLEtBQWQsR0FBc0IsVUFBU0MsSUFBVCxFQUFlQyxFQUFmLEVBQW1CO0FBQ3ZDLFFBQUlDLElBQUksR0FBRyxJQUFYO0FBRUEsUUFBSUMsWUFBWSxHQUFHSCxJQUFJLENBQUNHLFlBQXhCO0FBQ0EsUUFBSUMsV0FBVyxHQUFHSixJQUFJLENBQUNLLE1BQXZCO0FBRUFWLElBQUFBLFFBQVEsQ0FBQ1csc0JBQUlDLFVBQUosR0FBaUIseUNBQWxCLEVBQTZESixZQUE3RCxDQUFSO0FBRUFELElBQUFBLElBQUksQ0FBQ00sTUFBTCxDQUFZQyxvQkFBWixDQUFpQ04sWUFBakMsRUFBK0MsVUFBVU8sR0FBVixFQUFlQyxTQUFmLEVBQTBCO0FBRXZFLFVBQUlELEdBQUcsSUFBSUMsU0FBUyxDQUFDQyxNQUFWLEtBQXFCLENBQWhDLEVBQW1DO0FBQ2pDbkIsUUFBQUEsVUFBVSxDQUFDLHdDQUFELEVBQTJDVSxZQUEzQyxDQUFWO0FBQ0EsZUFBT0YsRUFBRSxHQUFHQSxFQUFFLENBQUM7QUFBQ1ksVUFBQUEsR0FBRyxFQUFFLHdCQUF3QlY7QUFBOUIsU0FBRCxDQUFMLEdBQXFERCxJQUFJLENBQUNZLE9BQUwsQ0FBYVIsc0JBQUlTLFVBQWpCLENBQTlEO0FBQ0Q7O0FBRUQsVUFBSUMsSUFBSSxHQUFHTCxTQUFTLENBQUMs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SUQiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuaW1wb3J0IGNzdCAgICAgICAgZnJvbSAnLi4vLi4vY29uc3RhbnRzJztcclxuaW1wb3J0IENvbW1vbiAgICAgZnJvbSAnLi4vQ29tbW9uJztcclxuaW1wb3J0IGZzICAgICAgICAgZnJvbSAnZnMnO1xyXG5pbXBvcnQgZWFjaFNlcmllcyBmcm9tICdhc3luYy9lYWNoU2VyaWVzJztcclxuaW1wb3J0IGNoaWxkICAgICAgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XHJcblxyXG52YXIgcHJpbnRFcnJvciA9IENvbW1vbi5wcmludEVycm9yO1xyXG52YXIgcHJpbnRPdXQgPSBDb21tb24ucHJpbnRPdXQ7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihDTEkpIHtcclxuXHJcbiAgdmFyIEVYRUNfVElNRU9VVCA9IDYwMDAwOyAvLyBEZWZhdWx0OiAxIG1pblxyXG5cclxuICBDTEkucHJvdG90eXBlLl9wdWxsID0gZnVuY3Rpb24ob3B0cywgY2IpIHtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICB2YXIgcHJvY2Vzc19uYW1lID0gb3B0cy5wcm9jZXNzX25hbWU7XHJcbiAgICB2YXIgcmVsb2FkX3R5cGUgPSBvcHRzLmFjdGlvbjtcclxuXHJcbiAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdVcGRhdGluZyByZXBvc2l0b3J5IGZvciBwcm9jZXNzIG5hbWUgJXMnLCBwcm9jZXNzX25hbWUpO1xyXG5cclxuICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NCeU5hbWVPcklkKHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24gKGVyciwgcHJvY2Vzc2VzKSB7XHJcblxyXG4gICAgICBpZiAoZXJyIHx8IHByb2Nlc3Nlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBwcmludEVycm9yKCdObyBwcm9jZXNzZXMgd2l0aCB0aGlzIG5hbWUgb3IgaWQgOiAlcycsIHByb2Nlc3NfbmFtZSk7XHJcbiAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzogJ1Byb2Nlc3Mgbm90IGZvdW5kOiAnICsgcHJvY2Vzc19uYW1lfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgcHJvYyA9IHByb2Nlc3Nlc1swXTtcclxuICAgICAgaWYgKCFwcm9jLnBtMl9lbnYudmVyc2lvbmluZykge1xyXG4gICAgICAgIHByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ05vIHZlcnNpb25pbmcgc3lzdGVtIGZvdW5kIGZvciBwcm9jZXNzICVzJywgcHJvY2Vzc19uYW1lKTtcclxuICAgICAgICByZXR1cm4gY2IgPyBjYih7c3VjY2VzczpmYWxzZSwgbXNnOiAnTm8gdmVyc2lvbmluZyBzeXN0ZW0gZm91bmQgZm9yIHByb2Nlc3MnfSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XHJcbiAgICAgIH1cclxuICAgICAgcmVxdWlyZSgndml6aW9uJykudXBkYXRlKHtcclxuICAgICAgICBmb2xkZXI6IHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aFxyXG4gICAgICB9LCBmdW5jdGlvbihlcnIsIG1ldGEpIHtcclxuICAgICAgICBpZiAoZXJyICE9PSBudWxsKSB7XHJcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOmVycn0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtZXRhLnN1Y2Nlc3MgPT09IHRydWUpIHtcclxuICAgICAgICAgIGdldFBvc3RVcGRhdGVDbWRzKHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aCwgcHJvY2Vzc19uYW1lLCBmdW5jdGlvbiAoY29tbWFuZF9saXN0KSB7XHJcbiAgICAgICAgICAgIGV4ZWNDb21tYW5kcyhwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGgsIGNvbW1hbmRfbGlzdCwgZnVuY3Rpb24oZXJyLCByZXMpIHtcclxuICAgICAgICAgICAgICBpZiAoZXJyICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBwcmludEVycm9yKGVycik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOiBtZXRhLm91dHB1dCArIGVycn0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdQcm9jZXNzIHN1Y2Nlc3NmdWxseSB1cGRhdGVkICVzJywgcHJvY2Vzc19uYW1lKTtcclxuICAgICAgICAgICAgICAgIHByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0N1cnJlbnQgY29tbWl0ICVzJywgbWV0YS5jdXJyZW50X3JldmlzaW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGF0W3JlbG9hZF90eXBlXShwcm9jZXNzX25hbWUsIGZ1bmN0aW9uKGVyciwgcHJvY3MpIHtcclxuICAgICAgICAgICAgICAgICAgaWYgKGVyciAmJiBjYikgcmV0dXJuIGNiKGVycik7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChlcnIpIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgbWV0YS5vdXRwdXQgKyByZXMpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0FscmVhZHkgdXAtdG8tZGF0ZSBvciBhbiBlcnJvciBvY2N1cmVkIGZvciBhcHA6ICVzJywgcHJvY2Vzc19uYW1lKTtcclxuICAgICAgICAgIHJldHVybiBjYiA/IGNiKHtzdWNjZXNzOmZhbHNlLCBtc2cgOiAnQWxyZWFkeSB1cCB0byBkYXRlJ30pIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDTEkgbWV0aG9kIGZvciB1cGRhdGluZyBhIHJlcG9zaXRvcnkgdG8gYSBzcGVjaWZpYyBjb21taXQgaWRcclxuICAgKiBAbWV0aG9kIHB1bGxDb21taXRJZFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9jZXNzX25hbWVcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29tbWl0X2lkXHJcbiAgICogQHJldHVyblxyXG4gICAqL1xyXG4gIENMSS5wcm90b3R5cGUucHVsbENvbW1pdElkID0gZnVuY3Rpb24ocHJvY2Vzc19uYW1lLCBjb21taXRfaWQsIGNiKSB7XHJcbiAgICB2YXIgcmVsb2FkX3R5cGUgPSAncmVsb2FkJztcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdVcGRhdGluZyByZXBvc2l0b3J5IGZvciBwcm9jZXNzIG5hbWUgJXMnLCBwcm9jZXNzX25hbWUpO1xyXG5cclxuICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NCeU5hbWVPcklkKHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24gKGVyciwgcHJvY2Vzc2VzKSB7XHJcblxyXG4gICAgICBpZiAoZXJyIHx8IHByb2Nlc3Nlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBwcmludEVycm9yKCdObyBwcm9jZXNzZXMgd2l0aCB0aGlzIG5hbWUgb3IgaWQgOiAlcycsIHByb2Nlc3NfbmFtZSk7XHJcbiAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzogJ1Byb2Nlc3Mgbm90IGZvdW5kOiAnICsgcHJvY2Vzc19uYW1lfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgcHJvYyA9IHByb2Nlc3Nlc1swXTtcclxuICAgICAgaWYgKHByb2MucG0yX2Vudi52ZXJzaW9uaW5nKSB7XHJcbiAgICAgICAgcmVxdWlyZSgndml6aW9uJykuaXNVcFRvRGF0ZSh7Zm9sZGVyOiBwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGh9LCBmdW5jdGlvbihlcnIsIG1ldGEpIHtcclxuICAgICAgICAgIGlmIChlcnIgIT09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKHttc2c6ZXJyfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xyXG4gICAgICAgICAgcmVxdWlyZSgndml6aW9uJykucmV2ZXJ0VG8oXHJcbiAgICAgICAgICAgIHtyZXZpc2lvbjogY29tbWl0X2lkLFxyXG4gICAgICAgICAgICAgZm9sZGVyOiBwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGh9LFxyXG4gICAgICAgICAgICBmdW5jdGlvbihlcnIyLCBtZXRhMikge1xyXG4gICAgICAgICAgICAgIGlmICghZXJyMiAmJiBtZXRhMi5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICBnZXRQb3N0VXBkYXRlQ21kcyhwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGgsIHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24gKGNvbW1hbmRfbGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICBleGVjQ29tbWFuZHMocHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRoLCBjb21tYW5kX2xpc3QsIGZ1bmN0aW9uKGVyciwgcmVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyciAhPT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBwcmludEVycm9yKGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOmVycn0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdQcm9jZXNzIHN1Y2Nlc3NmdWxseSB1cGRhdGVkICVzJywgcHJvY2Vzc19uYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0N1cnJlbnQgY29tbWl0ICVzJywgY29tbWl0X2lkKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGF0W3JlbG9hZF90eXBlXShwcm9jZXNzX25hbWUsIGNiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnQWxyZWFkeSB1cC10by1kYXRlIG9yIGFuIGVycm9yIG9jY3VyZWQ6ICVzJywgcHJvY2Vzc19uYW1lKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOm1ldGEuc3VjY2Vzc30pIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnTm8gdmVyc2lvbmluZyBzeXN0ZW0gZm91bmQgZm9yIHByb2Nlc3MgJXMnLCBwcm9jZXNzX25hbWUpO1xyXG4gICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOmZhbHNlfSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENMSSBtZXRob2QgZm9yIGRvd25ncmFkaW5nIGEgcmVwb3NpdG9yeSB0byB0aGUgcHJldmlvdXMgY29tbWl0IChvbGRlcilcclxuICAgKiBAbWV0aG9kIGJhY2t3YXJkXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb2Nlc3NfbmFtZVxyXG4gICAqIEByZXR1cm5cclxuICAgKi9cclxuICBDTEkucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24ocHJvY2Vzc19uYW1lLCBjYikge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnRG93bmdyYWRpbmcgdG8gcHJldmlvdXMgY29tbWl0IHJlcG9zaXRvcnkgZm9yIHByb2Nlc3MgbmFtZSAlcycsIHByb2Nlc3NfbmFtZSk7XHJcblxyXG4gICAgdGhhdC5DbGllbnQuZ2V0UHJvY2Vzc0J5TmFtZU9ySWQocHJvY2Vzc19uYW1lLCBmdW5jdGlvbiAoZXJyLCBwcm9jZXNzZXMpIHtcclxuXHJcbiAgICAgIGlmIChlcnIgfHwgcHJvY2Vzc2VzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHByaW50RXJyb3IoJ05vIHByb2Nlc3NlcyB3aXRoIHRoaXMgbmFtZSBvciBpZCA6ICVzJywgcHJvY2Vzc19uYW1lKTtcclxuICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOiAnUHJvY2VzcyBub3QgZm91bmQ6ICcgKyBwcm9jZXNzX25hbWV9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBwcm9jID0gcHJvY2Vzc2VzWzBdO1xyXG4gICAgICAvLyBpbiBjYXNlIHVzZXIgc2VhcmNoZWQgYnkgaWQvcGlkXHJcbiAgICAgIHByb2Nlc3NfbmFtZSA9IHByb2MubmFtZTtcclxuXHJcbiAgICAgIGlmIChwcm9jLnBtMl9lbnYudmVyc2lvbmluZyA9PT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgICAgICBwcm9jLnBtMl9lbnYudmVyc2lvbmluZyA9PT0gbnVsbClcclxuICAgICAgICByZXR1cm4gY2Ioe21zZyA6ICdWZXJzaW9uaW5nIHVua25vd24nfSk7XHJcblxyXG4gICAgICByZXF1aXJlKCd2aXppb24nKS5wcmV2KHtcclxuICAgICAgICBmb2xkZXI6IHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aFxyXG4gICAgICB9LCBmdW5jdGlvbihlcnIsIG1ldGEpIHtcclxuICAgICAgICBpZiAoZXJyKVxyXG4gICAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzplcnIsIGRhdGEgOiBtZXRhfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xyXG5cclxuICAgICAgICBpZiAobWV0YS5zdWNjZXNzICE9PSB0cnVlKSB7XHJcbiAgICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdObyB2ZXJzaW9uaW5nIHN5c3RlbSBmb3VuZCBmb3IgcHJvY2VzcyAlcycsIHByb2Nlc3NfbmFtZSk7XHJcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOmVyciwgZGF0YSA6IG1ldGF9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXRQb3N0VXBkYXRlQ21kcyhwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGgsIHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24gKGNvbW1hbmRfbGlzdCkge1xyXG4gICAgICAgICAgZXhlY0NvbW1hbmRzKHByb2MucG0yX2Vudi52ZXJzaW9uaW5nLnJlcG9fcGF0aCwgY29tbWFuZF9saXN0LCBmdW5jdGlvbihlcnIsIHJlcykge1xyXG4gICAgICAgICAgICBpZiAoZXJyICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgcmVxdWlyZSgndml6aW9uJykubmV4dCh7Zm9sZGVyOiBwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGh9LCBmdW5jdGlvbihlcnIyLCBtZXRhMikge1xyXG4gICAgICAgICAgICAgICAgcHJpbnRFcnJvcihlcnIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzogbWV0YS5vdXRwdXQgKyBlcnJ9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdQcm9jZXNzIHN1Y2Nlc3NmdWxseSB1cGRhdGVkICVzJywgcHJvY2Vzc19uYW1lKTtcclxuICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnQ3VycmVudCBjb21taXQgJXMnLCBtZXRhLmN1cnJlbnRfcmV2aXNpb24pO1xyXG4gICAgICAgICAgICB0aGF0LnJlbG9hZChwcm9jZXNzX25hbWUsIGZ1bmN0aW9uKGVyciwgcHJvY3MpIHtcclxuICAgICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcclxuICAgICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCBtZXRhLm91dHB1dCArIHJlcykgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ0xJIG1ldGhvZCBmb3IgdXBkYXRpbmcgYSByZXBvc2l0b3J5IHRvIHRoZSBuZXh0IGNvbW1pdCAobW9yZSByZWNlbnQpXHJcbiAgICogQG1ldGhvZCBmb3J3YXJkXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByb2Nlc3NfbmFtZVxyXG4gICAqIEByZXR1cm5cclxuICAgKi9cclxuICBDTEkucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbihwcm9jZXNzX25hbWUsIGNiKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICBwcmludE91dChjc3QuUFJFRklYX01TRyArICdVcGRhdGluZyB0byBuZXh0IGNvbW1pdCByZXBvc2l0b3J5IGZvciBwcm9jZXNzIG5hbWUgJXMnLCBwcm9jZXNzX25hbWUpO1xyXG5cclxuICAgIHRoYXQuQ2xpZW50LmdldFByb2Nlc3NCeU5hbWVPcklkKHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24gKGVyciwgcHJvY2Vzc2VzKSB7XHJcblxyXG4gICAgICBpZiAoZXJyIHx8IHByb2Nlc3Nlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBwcmludEVycm9yKCdObyBwcm9jZXNzZXMgd2l0aCB0aGlzIG5hbWUgb3IgaWQ6ICVzJywgcHJvY2Vzc19uYW1lKTtcclxuICAgICAgICByZXR1cm4gY2IgPyBjYih7bXNnOiAnUHJvY2VzcyBub3QgZm91bmQ6ICcgKyBwcm9jZXNzX25hbWV9KSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBwcm9jID0gcHJvY2Vzc2VzWzBdO1xyXG4gICAgICAvLyBpbiBjYXNlIHVzZXIgc2VhcmNoZWQgYnkgaWQvcGlkXHJcbiAgICAgIHByb2Nlc3NfbmFtZSA9IHByb2MubmFtZTtcclxuICAgICAgaWYgKHByb2MucG0yX2Vudi52ZXJzaW9uaW5nKSB7XHJcbiAgICAgICAgcmVxdWlyZSgndml6aW9uJykubmV4dCh7Zm9sZGVyOiBwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGh9LCBmdW5jdGlvbihlcnIsIG1ldGEpIHtcclxuICAgICAgICAgIGlmIChlcnIgIT09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKHttc2c6ZXJyfSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xyXG4gICAgICAgICAgaWYgKG1ldGEuc3VjY2VzcyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICBnZXRQb3N0VXBkYXRlQ21kcyhwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGgsIHByb2Nlc3NfbmFtZSwgZnVuY3Rpb24gKGNvbW1hbmRfbGlzdCkge1xyXG4gICAgICAgICAgICAgIGV4ZWNDb21tYW5kcyhwcm9jLnBtMl9lbnYudmVyc2lvbmluZy5yZXBvX3BhdGgsIGNvbW1hbmRfbGlzdCwgZnVuY3Rpb24oZXJyLCByZXMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIgIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIHJlcXVpcmUoJ3ZpemlvbicpLnByZXYoe2ZvbGRlcjogcHJvYy5wbTJfZW52LnZlcnNpb25pbmcucmVwb19wYXRofSwgZnVuY3Rpb24oZXJyMiwgbWV0YTIpIHtcclxuICAgICAgICAgICAgICAgICAgICBwcmludEVycm9yKGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2Ioe21zZzptZXRhLm91dHB1dCArIGVycn0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnUHJvY2VzcyBzdWNjZXNzZnVsbHkgdXBkYXRlZCAlcycsIHByb2Nlc3NfbmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgIHByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ0N1cnJlbnQgY29tbWl0ICVzJywgbWV0YS5jdXJyZW50X3JldmlzaW9uKTtcclxuICAgICAgICAgICAgICAgICAgdGhhdC5yZWxvYWQocHJvY2Vzc19uYW1lLCBmdW5jdGlvbihlcnIsIHByb2NzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgbWV0YS5vdXRwdXQgKyByZXMpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xyXG4gICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnQWxyZWFkeSB1cC10by1kYXRlIG9yIGFuIGVycm9yIG9jY3VyZWQ6ICVzJywgcHJvY2Vzc19uYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwge3N1Y2Nlc3M6bWV0YS5zdWNjZXNzfSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnTm8gdmVyc2lvbmluZyBzeXN0ZW0gZm91bmQgZm9yIHByb2Nlc3MgJXMnLCBwcm9jZXNzX25hbWUpO1xyXG4gICAgICAgIHJldHVybiBjYiA/IGNiKHtzdWNjZXNzOmZhbHNlLCBtc2c6ICdObyB2ZXJzaW9uaW5nIHN5c3RlbSBmb3VuZCd9KSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgdmFyIGV4ZWMgPSBmdW5jdGlvbiAoY21kLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIG91dHB1dCA9ICcnO1xyXG5cclxuICAgIHZhciBjID0gY2hpbGQuZXhlYyhjbWQsIHtcclxuICAgICAgZW52OiBwcm9jZXNzLmVudixcclxuICAgICAgbWF4QnVmZmVyOiAzKjEwMjQqMTAyNCxcclxuICAgICAgdGltZW91dDogRVhFQ19USU1FT1VUXHJcbiAgICB9LCBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgaWYgKGNhbGxiYWNrKVxyXG4gICAgICAgIGNhbGxiYWNrKGVyciA/IGVyci5jb2RlIDogMCwgb3V0cHV0KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGMuc3Rkb3V0Lm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICBvdXRwdXQgKz0gZGF0YTtcclxuICAgIH0pO1xyXG5cclxuICAgIGMuc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICBvdXRwdXQgKz0gZGF0YTtcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqXHJcbiAgICogQG1ldGhvZCBleGVjQ29tbWFuZHNcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVwb19wYXRoXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IGNvbW1hbmRfbGlzdFxyXG4gICAqIEByZXR1cm5cclxuICAgKi9cclxuICB2YXIgZXhlY0NvbW1hbmRzID0gZnVuY3Rpb24ocmVwb19wYXRoLCBjb21tYW5kX2xpc3QsIGNiKSB7XHJcbiAgICB2YXIgc3Rkb3V0ID0gJyc7XHJcblxyXG4gICAgZWFjaFNlcmllcyhjb21tYW5kX2xpc3QsIGZ1bmN0aW9uKGNvbW1hbmQsIGNhbGxiYWNrKSB7XHJcbiAgICAgIHN0ZG91dCArPSAnXFxuJyArIGNvbW1hbmQ7XHJcbiAgICAgIGV4ZWMoJ2NkICcrcmVwb19wYXRoKyc7Jytjb21tYW5kLFxyXG4gICAgICAgICAgIGZ1bmN0aW9uKGNvZGUsIG91dHB1dCkge1xyXG4gICAgICAgICAgICAgc3Rkb3V0ICs9ICdcXG4nICsgb3V0cHV0O1xyXG4gICAgICAgICAgICAgaWYgKGNvZGUgPT09IDApXHJcbiAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgIGNhbGxiYWNrKCdgJytjb21tYW5kKydgIGZhaWxlZCcpO1xyXG4gICAgICAgICAgIH0pO1xyXG4gICAgfSwgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgIGlmIChlcnIpXHJcbiAgICAgICAgcmV0dXJuIGNiKHN0ZG91dCArICdcXG4nICsgZXJyKTtcclxuICAgICAgcmV0dXJuIGNiKG51bGwsIHN0ZG91dCk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc2NyaXB0aW9uIFNlYXJjaCBwcm9jZXNzLmpzb24gZm9yIHBvc3QtdXBkYXRlIGNvbW1hbmRzXHJcbiAgICogQG1ldGhvZCBnZXRQb3N0VXBkYXRlQ21kc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXBvX3BhdGhcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvY19uYW1lXHJcbiAgICogQHJldHVyblxyXG4gICAqL1xyXG4gIHZhciBnZXRQb3N0VXBkYXRlQ21kcyA9IGZ1bmN0aW9uKHJlcG9fcGF0aCwgcHJvY19uYW1lLCBjYikge1xyXG4gICAgaWYgKHR5cGVvZiByZXBvX3BhdGggIT09ICdzdHJpbmcnKVxyXG4gICAgICByZXR1cm4gY2IoW10pO1xyXG4gICAgaWYgKHJlcG9fcGF0aFtyZXBvX3BhdGgubGVuZ3RoIC0gMV0gIT09ICcvJylcclxuICAgICAgcmVwb19wYXRoICs9ICcvJztcclxuXHJcbiAgICB2YXIgc2VhcmNoRm9yQ29tbWFuZHMgPSBmdW5jdGlvbihmaWxlLCBjYWxsYmFjaykge1xyXG4gICAgICBmcy5leGlzdHMocmVwb19wYXRoK2ZpbGUsIGZ1bmN0aW9uKGV4aXN0cykge1xyXG4gICAgICAgIGlmIChleGlzdHMpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciBjb25mX3N0cmluZyA9IGZzLnJlYWRGaWxlU3luYyhyZXBvX3BhdGggKyBmaWxlKTtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBDb21tb24ucGFyc2VDb25maWcoY29uZl9zdHJpbmcsIHJlcG9fcGF0aCArIGZpbGUpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSB8fCBlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLmFwcHMpIHtcclxuICAgICAgICAgICAgZWFjaFNlcmllcyhkYXRhLmFwcHMsIGZ1bmN0aW9uKGl0ZW0sIGNhbGxiKSB7XHJcbiAgICAgICAgICAgICAgaWYgKGl0ZW0ubmFtZSAmJiBpdGVtLm5hbWUgPT09IHByb2NfbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0ucG9zdF91cGRhdGUgJiYgdHlwZW9mKGl0ZW0ucG9zdF91cGRhdGUpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICBpZiAoaXRlbS5leGVjX3RpbWVvdXQpXHJcbiAgICAgICAgICAgICAgICAgICAgRVhFQ19USU1FT1VUID0gcGFyc2VJbnQoaXRlbS5leGVjX3RpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGIoaXRlbS5wb3N0X3VwZGF0ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYigpO1xyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbihmaW5hbCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhmaW5hbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGVhY2hTZXJpZXMoWydlY29zeXN0ZW0uanNvbicsICdwcm9jZXNzLmpzb24nLCAncGFja2FnZS5qc29uJ10sIHNlYXJjaEZvckNvbW1hbmRzLFxyXG4gICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihmaW5hbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYihmaW5hbCA/IGZpbmFsIDogW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICB9KTtcclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogQ0xJIG1ldGhvZCBmb3IgdXBkYXRpbmcgYSByZXBvc2l0b3J5XHJcbiAgICogQG1ldGhvZCBwdWxsQW5kUmVzdGFydFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9jZXNzX25hbWUgbmFtZSBvZiBwcm9jZXNzZXMgdG8gcHVsbFxyXG4gICAqIEByZXR1cm5cclxuICAgKi9cclxuICBDTEkucHJvdG90eXBlLnB1bGxBbmRSZXN0YXJ0ID0gZnVuY3Rpb24gKHByb2Nlc3NfbmFtZSwgY2IpIHtcclxuICAgIHRoaXMuX3B1bGwoe3Byb2Nlc3NfbmFtZTogcHJvY2Vzc19uYW1lLCBhY3Rpb246ICdyZWxvYWQnfSwgY2IpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENMSSBtZXRob2QgZm9yIHVwZGF0aW5nIGEgcmVwb3NpdG9yeVxyXG4gICAqIEBtZXRob2QgcHVsbEFuZFJlbG9hZFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9jZXNzX25hbWUgbmFtZSBvZiBwcm9jZXNzZXMgdG8gcHVsbFxyXG4gICAqIEByZXR1cm5cclxuICAgKi9cclxuICBDTEkucHJvdG90eXBlLnB1bGxBbmRSZWxvYWQgPSBmdW5jdGlvbiAocHJvY2Vzc19uYW1lLCBjYikge1xyXG4gICAgdGhpcy5fcHVsbCh7cHJvY2Vzc19uYW1lOiBwcm9jZXNzX25hbWUsIGFjdGlvbjogJ3JlbG9hZCd9LCBjYik7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ0xJIG1ldGhvZCBmb3IgdXBkYXRpbmcgYSByZXBvc2l0b3J5IHRvIGEgc3BlY2lmaWMgY29tbWl0IGlkXHJcbiAgICogQG1ldGhvZCBwdWxsQ29tbWl0SWRcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0c1xyXG4gICAqIEByZXR1cm5cclxuICAgKi9cclxuICBDTEkucHJvdG90eXBlLl9wdWxsQ29tbWl0SWQgPSBmdW5jdGlvbiAob3B0cywgY2IpIHtcclxuICAgIHRoaXMucHVsbENvbW1pdElkKG9wdHMucG0yX25hbWUsIG9wdHMuY29tbWl0X2lkLCBjYik7XHJcbiAgfTtcclxuXHJcbn1cclxuIl19