'use strict'; // From https://raw.githubusercontent.com/pkrumins/node-tree-kill/master/index.js

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _child_process = _interopRequireDefault(require("child_process"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var spawn = _child_process["default"].spawn;
var exec = _child_process["default"].exec;

function _default(pid, signal, callback) {
  var tree = {};
  var pidsToProcess = {};
  tree[pid] = [];
  pidsToProcess[pid] = 1;

  switch (process.platform) {
    case 'win32':
      exec('taskkill /pid ' + pid + ' /T /F', {
        windowsHide: true
      }, callback);
      break;

    case 'darwin':
      buildProcessTree(pid, tree, pidsToProcess, function (parentPid) {
        return spawn('pgrep', ['-P', parentPid]);
      }, function () {
        killAll(tree, signal, callback);
      });
      break;
    // case 'sunos':
    //     buildProcessTreeSunOS(pid, tree, pidsToProcess, function () {
    //         killAll(tree, signal, callback);
    //     });
    //     break;

    default:
      // Linux
      buildProcessTree(pid, tree, pidsToProcess, function (parentPid) {
        return spawn('ps', ['-o', 'pid', '--no-headers', '--ppid', parentPid]);
      }, function () {
        killAll(tree, signal, callback);
      });
      break;
  }
}

;

function killAll(tree, signal, callback) {
  var killed = {};

  try {
    Object.keys(tree).forEach(function (pid) {
      tree[pid].forEach(function (pidpid) {
        if (!killed[pidpid]) {
          killPid(pidpid, signal);
          killed[pidpid] = 1;
        }
      });

      if (!killed[pid]) {
        killPid(pid, signal);
        killed[pid] = 1;
      }
    });
  } catch (err) {
    if (callback) {
      return callback(err);
    } else {
      console.error(err);
    }
  }

  if (callback) {
    return callback();
  }
}

function killPid(pid, signal) {
  try {
    process.kill(parseInt(pid, 10), signal);
  } catch (err) {
    if (err.code !== 'ESRCH') console.error(err);
  }
}

function buildProcessTree(parentPid, tree, pidsToProcess, spawnChildProcessesList, cb) {
  var ps = spawnChildProcessesList(parentPid);
  var allData = '';
  ps.on('error', function (err) {
    console.error(err);
  });

  if (ps.stdout) {
    ps.stdout.on('data', function (data) {
      data = data.toString('ascii');
      allData += data;
    });
  }

  var onClose = function onClose(code) {
    delete pidsToProcess[parentPid];

    if (code !== 0) {
      // no more parent processes
      if (Object.keys(pidsToProcess).length == 0) {
        cb();
      }

      return;
    }

    var pids = allData.match(/\d+/g) || [];
    if (pids.length === 0) return cb();
    pids.forEach(function (pid) {
      pid = parseInt(pid, 10) + "";
      tree[parentPid].push(pid);
      tree[pid] = [];
      pidsToProcess[pid] = 1;
      buildProcessTree(pid, tree, pidsToProcess, spawnChildProcessesList, cb);
    });
  };

  ps.on('close', onClose);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9UcmVlS2lsbC50cyJdLCJuYW1lcyI6WyJzcGF3biIsImNoaWxkUHJvY2VzcyIsImV4ZWMiLCJwaWQiLCJzaWduYWwiLCJjYWxsYmFjayIsInRyZWUiLCJwaWRzVG9Qcm9jZXNzIiwicHJvY2VzcyIsInBsYXRmb3JtIiwid2luZG93c0hpZGUiLCJidWlsZFByb2Nlc3NUcmVlIiwicGFyZW50UGlkIiwia2lsbEFsbCIsImtpbGxlZCIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwicGlkcGlkIiwia2lsbFBpZCIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsImtpbGwiLCJwYXJzZUludCIsImNvZGUiLCJzcGF3bkNoaWxkUHJvY2Vzc2VzTGlzdCIsImNiIiwicHMiLCJhbGxEYXRhIiwib24iLCJzdGRvdXQiLCJkYXRhIiwidG9TdHJpbmciLCJvbkNsb3NlIiwibGVuZ3RoIiwicGlkcyIsIm1hdGNoIiwicHVzaCJdLCJtYXBwaW5ncyI6IkFBQUEsYSxDQUVBOzs7Ozs7O0FBRUE7Ozs7QUFDQSxJQUFJQSxLQUFLLEdBQUdDLDBCQUFhRCxLQUF6QjtBQUNBLElBQUlFLElBQUksR0FBR0QsMEJBQWFDLElBQXhCOztBQUVlLGtCQUFVQyxHQUFWLEVBQWVDLE1BQWYsRUFBdUJDLFFBQXZCLEVBQWlDO0FBQzlDLE1BQUlDLElBQUksR0FBRyxFQUFYO0FBQ0EsTUFBSUMsYUFBYSxHQUFHLEVBQXBCO0FBQ0FELEVBQUFBLElBQUksQ0FBQ0gsR0FBRCxDQUFKLEdBQVksRUFBWjtBQUNBSSxFQUFBQSxhQUFhLENBQUNKLEdBQUQsQ0FBYixHQUFxQixDQUFyQjs7QUFFQSxVQUFRSyxPQUFPLENBQUNDLFFBQWhCO0FBQ0EsU0FBSyxPQUFMO0FBQ0VQLE1BQUFBLElBQUksQ0FBQyxtQkFBbUJDLEdBQW5CLEdBQXlCLFFBQTFCLEVBQW9DO0FBQUVPLFFBQUFBLFdBQVcsRUFBRTtBQUFmLE9BQXBDLEVBQTJETCxRQUEzRCxDQUFKO0FBQ0E7O0FBQ0YsU0FBSyxRQUFM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QTJCbUIsdUJBQTNCLEVBQW9EQyxFQUFwRCxDQUFoQjtBQUNELEtBTkQ7QUFPRCxHQXJCRDs7QUF1QkFDLEVBQUFBLEVBQUUsQ0FBQ0UsRUFBSCxDQUFNLE9BQU4sRUFBZUksT0FBZjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gRnJvbSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vcGtydW1pbnMvbm9kZS10cmVlLWtpbGwvbWFzdGVyL2luZGV4LmpzXHJcblxyXG5pbXBvcnQgY2hpbGRQcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG52YXIgc3Bhd24gPSBjaGlsZFByb2Nlc3Muc3Bhd247XHJcbnZhciBleGVjID0gY2hpbGRQcm9jZXNzLmV4ZWM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAocGlkLCBzaWduYWwsIGNhbGxiYWNrKSB7XHJcbiAgdmFyIHRyZWUgPSB7fTtcclxuICB2YXIgcGlkc1RvUHJvY2VzcyA9IHt9O1xyXG4gIHRyZWVbcGlkXSA9IFtdO1xyXG4gIHBpZHNUb1Byb2Nlc3NbcGlkXSA9IDE7XHJcblxyXG4gIHN3aXRjaCAocHJvY2Vzcy5wbGF0Zm9ybSkge1xyXG4gIGNhc2UgJ3dpbjMyJzpcclxuICAgIGV4ZWMoJ3Rhc2traWxsIC9waWQgJyArIHBpZCArICcgL1QgL0YnLCB7IHdpbmRvd3NIaWRlOiB0cnVlIH0sIGNhbGxiYWNrKTtcclxuICAgIGJyZWFrO1xyXG4gIGNhc2UgJ2Rhcndpbic6XHJcbiAgICBidWlsZFByb2Nlc3NUcmVlKHBpZCwgdHJlZSwgcGlkc1RvUHJvY2VzcywgZnVuY3Rpb24gKHBhcmVudFBpZCkge1xyXG4gICAgICByZXR1cm4gc3Bhd24oJ3BncmVwJywgWyctUCcsIHBhcmVudFBpZF0pO1xyXG4gICAgfSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICBraWxsQWxsKHRyZWUsIHNpZ25hbCwgY2FsbGJhY2spO1xyXG4gICAgfSk7XHJcbiAgICBicmVhaztcclxuICAgIC8vIGNhc2UgJ3N1bm9zJzpcclxuICAgIC8vICAgICBidWlsZFByb2Nlc3NUcmVlU3VuT1MocGlkLCB0cmVlLCBwaWRzVG9Qcm9jZXNzLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyAgICAgICAgIGtpbGxBbGwodHJlZSwgc2lnbmFsLCBjYWxsYmFjayk7XHJcbiAgICAvLyAgICAgfSk7XHJcbiAgICAvLyAgICAgYnJlYWs7XHJcbiAgZGVmYXVsdDogLy8gTGludXhcclxuICAgIGJ1aWxkUHJvY2Vzc1RyZWUocGlkLCB0cmVlLCBwaWRzVG9Qcm9jZXNzLCBmdW5jdGlvbiAocGFyZW50UGlkKSB7XHJcbiAgICAgIHJldHVybiBzcGF3bigncHMnLCBbJy1vJywgJ3BpZCcsICctLW5vLWhlYWRlcnMnLCAnLS1wcGlkJywgcGFyZW50UGlkXSk7XHJcbiAgICB9LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGtpbGxBbGwodHJlZSwgc2lnbmFsLCBjYWxsYmFjayk7XHJcbiAgICB9KTtcclxuICAgIGJyZWFrO1xyXG4gIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGtpbGxBbGwgKHRyZWUsIHNpZ25hbCwgY2FsbGJhY2spIHtcclxuICB2YXIga2lsbGVkID0ge307XHJcbiAgdHJ5IHtcclxuICAgIE9iamVjdC5rZXlzKHRyZWUpLmZvckVhY2goZnVuY3Rpb24gKHBpZCkge1xyXG4gICAgICB0cmVlW3BpZF0uZm9yRWFjaChmdW5jdGlvbiAocGlkcGlkKSB7XHJcbiAgICAgICAgaWYgKCFraWxsZWRbcGlkcGlkXSkge1xyXG4gICAgICAgICAga2lsbFBpZChwaWRwaWQsIHNpZ25hbCk7XHJcbiAgICAgICAgICBraWxsZWRbcGlkcGlkXSA9IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgaWYgKCFraWxsZWRbcGlkXSkge1xyXG4gICAgICAgIGtpbGxQaWQocGlkLCBzaWduYWwpO1xyXG4gICAgICAgIGtpbGxlZFtwaWRdID0gMTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGlmIChjYWxsYmFjaykge1xyXG4gICAgcmV0dXJuIGNhbGxiYWNrKCk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBraWxsUGlkKHBpZCwgc2lnbmFsKSB7XHJcbiAgdHJ5IHtcclxuICAgIHByb2Nlc3Mua2lsbChwYXJzZUludChwaWQsIDEwKSwgc2lnbmFsKTtcclxuICB9XHJcbiAgY2F0Y2ggKGVycikge1xyXG4gICAgaWYgKGVyci5jb2RlICE9PSAnRVNSQ0gnKVxyXG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBidWlsZFByb2Nlc3NUcmVlIChwYXJlbnRQaWQsIHRyZWUsIHBpZHNUb1Byb2Nlc3MsIHNwYXduQ2hpbGRQcm9jZXNzZXNMaXN0LCBjYikge1xyXG4gIHZhciBwcyA9IHNwYXduQ2hpbGRQcm9jZXNzZXNMaXN0KHBhcmVudFBpZCk7XHJcbiAgdmFyIGFsbERhdGEgPSAnJztcclxuXHJcbiAgcHMub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGVycik7XHJcbiAgfSk7XHJcblxyXG4gIGlmIChwcy5zdGRvdXQpIHtcclxuICAgIHBzLnN0ZG91dC5vbignZGF0YScsIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgIGRhdGEgPSBkYXRhLnRvU3RyaW5nKCdhc2NpaScpO1xyXG4gICAgICBhbGxEYXRhICs9IGRhdGE7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHZhciBvbkNsb3NlID0gZnVuY3Rpb24gKGNvZGUpIHtcclxuICAgIGRlbGV0ZSBwaWRzVG9Qcm9jZXNzW3BhcmVudFBpZF07XHJcblxyXG4gICAgaWYgKGNvZGUgIT09IDApIHtcclxuICAgICAgLy8gbm8gbW9yZSBwYXJlbnQgcHJvY2Vzc2VzXHJcbiAgICAgIGlmIChPYmplY3Qua2V5cyhwaWRzVG9Qcm9jZXNzKS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIGNiKCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIHBpZHMgPSBhbGxEYXRhLm1hdGNoKC9cXGQrL2cpIHx8IFtdO1xyXG4gICAgaWYgKHBpZHMubGVuZ3RoID09PSAwKVxyXG4gICAgICByZXR1cm4gY2IoKTtcclxuXHJcbiAgICBwaWRzLmZvckVhY2goZnVuY3Rpb24gKHBpZCkge1xyXG4gICAgICBwaWQgPSBwYXJzZUludChwaWQsIDEwKSArIFwiXCI7XHJcbiAgICAgIHRyZWVbcGFyZW50UGlkXS5wdXNoKHBpZCk7XHJcbiAgICAgIHRyZWVbcGlkXSA9IFtdO1xyXG4gICAgICBwaWRzVG9Qcm9jZXNzW3BpZF0gPSAxO1xyXG4gICAgICBidWlsZFByb2Nlc3NUcmVlKHBpZCwgdHJlZSwgcGlkc1RvUHJvY2Vzcywgc3Bhd25DaGlsZFByb2Nlc3Nlc0xpc3QsIGNiKTtcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIHBzLm9uKCdjbG9zZScsIG9uQ2xvc2UpO1xyXG59XHJcbiJdfQ==