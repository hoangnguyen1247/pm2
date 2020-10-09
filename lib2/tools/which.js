"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _constants = _interopRequireDefault(require("../../constants.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// XP's system default value for `PATHEXT` system variable, just in case it's not
// set on Windows.
var XP_DEFAULT_PATHEXT = '.com;.exe;.bat;.cmd;.vbs;.vbe;.js;.jse;.wsf;.wsh'; // For earlier versions of NodeJS that doesn't have a list of constants (< v6)

var FILE_EXECUTABLE_MODE = 1;

function statFollowLinks(pathName) {
  return _fs["default"].statSync.apply(_fs["default"], arguments);
}

function isWindowsPlatform() {
  return _constants["default"].IS_WINDOWS;
} // Cross-platform method for splitting environment `PATH` variables


function splitPath(p) {
  return p ? p.split(_path["default"].delimiter) : [];
} // Tests are running all cases for this func but it stays uncovered by codecov due to unknown reason

/* istanbul ignore next */


function isExecutable(pathName) {
  try {
    // TODO(node-support): replace with fs.constants.X_OK once remove support for node < v6
    _fs["default"].accessSync(pathName, FILE_EXECUTABLE_MODE);
  } catch (err) {
    return false;
  }

  return true;
}

function checkPath(pathName) {
  return _fs["default"].existsSync(pathName) && !statFollowLinks(pathName).isDirectory() && (isWindowsPlatform() || isExecutable(pathName));
} //@
//@ ### which(command)
//@
//@ Examples:
//@
//@ ```javascript
//@ var nodeExec = which('node');
//@ ```
//@
//@ Searches for `command` in the system's `PATH`. On Windows, this uses the
//@ `PATHEXT` variable to append the extension if it's not already executable.
//@ Returns a [ShellString](#shellstringstr) containing the absolute path to
//@ `command`.


function _which(cmd) {
  if (!cmd) console.error('must specify command');
  var options = {};
  var isWindows = isWindowsPlatform();
  var pathArray = splitPath(process.env.PATH);
  var queryMatches = []; // No relative/absolute paths provided?

  if (cmd.indexOf('/') === -1) {
    // Assume that there are no extensions to append to queries (this is the
    // case for unix)
    var pathExtArray = [''];

    if (isWindows) {
      // In case the PATHEXT variable is somehow not set (e.g.
      // child_process.spawn with an empty environment), use the XP default.
      var pathExtEnv = process.env.PATHEXT || XP_DEFAULT_PATHEXT;
      pathExtArray = splitPath(pathExtEnv.toUpperCase());
    } // Search for command in PATH


    for (var k = 0; k < pathArray.length; k++) {
      // already found it
      if (queryMatches.length > 0 && !options.all) break;

      var attempt = _path["default"].resolve(pathArray[k], cmd);

      if (isWindows) {
        attempt = attempt.toUpperCase();
      }

      var match = attempt.match(/\.[^<>:"/|?*.]+$/);

      if (match && pathExtArray.indexOf(match[0]) >= 0) {
        // this is Windows-only
        // The user typed a query with the file extension, like
        // `which('node.exe')`
        if (checkPath(attempt)) {
          queryMatches.push(attempt);
          break;
        }
      } else {
        // All-platforms
        // Cycle through the PATHEXT array, and check each extension
        // Note: the array is always [''] on Unix
        for (var i = 0; i < pathExtArray.length; i++) {
          var ext = pathExtArray[i];
          var newAttempt = attempt + ext;

          if (checkPath(newAttempt)) {
            queryMatches.push(newAttempt);
            break;
          }
        }
      }
    }
  } else if (checkPath(cmd)) {
    // a valid absolute or relative path
    queryMatches.push(_path["default"].resolve(cmd));
  }

  if (queryMatches.length > 0) {
    return options.all ? queryMatches : queryMatches[0];
  }

  return options.all ? [] : null;
}

var _default = _which;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy93aGljaC50cyJdLCJuYW1lcyI6WyJYUF9ERUZBVUxUX1BBVEhFWFQiLCJGSUxFX0VYRUNVVEFCTEVfTU9ERSIsInN0YXRGb2xsb3dMaW5rcyIsInBhdGhOYW1lIiwiZnMiLCJzdGF0U3luYyIsImFwcGx5IiwiYXJndW1lbnRzIiwiaXNXaW5kb3dzUGxhdGZvcm0iLCJjc3QiLCJJU19XSU5ET1dTIiwic3BsaXRQYXRoIiwicCIsInNwbGl0IiwicGF0aCIsImRlbGltaXRlciIsImlzRXhlY3V0YWJsZSIsImFjY2Vzc1N5bmMiLCJlcnIiLCJjaGVja1BhdGgiLCJleGlzdHNTeW5jIiwiaXNEaXJlY3RvcnkiLCJfd2hpY2giLCJjbWQiLCJjb25zb2xlIiwiZXJyb3IiLCJvcHRpb25zIiwiaXNXaW5kb3dzIiwicGF0aEFycmF5IiwicHJvY2VzcyIsImVudiIsIlBBVEgiLCJxdWVyeU1hdGNoZXMiLCJpbmRleE9mIiwicGF0aEV4dEFycmF5IiwicGF0aEV4dEVudiIsIlBBVEhFWFQiLCJ0b1VwcGVyQ2FzZSIsImsiLCJsZW5ndGgiLCJhbGwiLCJhdHRlbXB0IiwicmVzb2x2ZSIsIm1hdGNoIiwicHVzaCIsImkiLCJleHQiLCJuZXdBdHRlbXB0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFFQTtBQUNBO0FBQ0EsSUFBSUEsa0JBQWtCLEdBQUcsa0RBQXpCLEMsQ0FFQTs7QUFDQSxJQUFJQyxvQkFBb0IsR0FBRyxDQUEzQjs7QUFFQSxTQUFTQyxlQUFULENBQXlCQyxRQUF6QixFQUFtQztBQUNqQyxTQUFPQyxlQUFHQyxRQUFILENBQVlDLEtBQVosQ0FBa0JGLGNBQWxCLEVBQXNCRyxTQUF0QixDQUFQO0FBQ0Q7O0FBRUQsU0FBU0MsaUJBQVQsR0FBNkI7QUFDM0IsU0FBT0Msc0JBQUlDLFVBQVg7QUFDRCxDLENBRUQ7OztBQUNBLFNBQVNDLFNBQVQsQ0FBbUJDLENBQW5CLEVBQXNCO0FBQ3BCLFNBQU9B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R0FBR04sT0FBTyxHQUFHSyxHQUEzQjs7QUFDQSxjQUFJM0IsU0FBUyxDQUFDNEIsVUFBRCxDQUFiLEVBQTJCO0FBQ3pCZixZQUFBQSxZQUFZLENBQUNZLElBQWIsQ0FBa0JHLFVBQWxCO0FBQ0E7QUFDRDtBQUNGO0FBQ0Y7QUFDRjtBQUNGLEdBM0NELE1BMkNPLElBQUk1QixTQUFTLENBQUNJLEdBQUQsQ0FBYixFQUFvQjtBQUFFO0FBQzNCUyxJQUFBQSxZQUFZLENBQUNZLElBQWIsQ0FBa0I5QixpQkFBSzRCLE9BQUwsQ0FBYW5CLEdBQWIsQ0FBbEI7QUFDRDs7QUFFRCxNQUFJUyxZQUFZLENBQUNPLE1BQWIsR0FBc0IsQ0FBMUIsRUFBNkI7QUFDM0IsV0FBT2IsT0FBTyxDQUFDYyxHQUFSLEdBQWNSLFlBQWQsR0FBNkJBLFlBQVksQ0FBQyxDQUFELENBQWhEO0FBQ0Q7O0FBQ0QsU0FBT04sT0FBTyxDQUFDYyxHQUFSLEdBQWMsRUFBZCxHQUFtQixJQUExQjtBQUNEOztlQUVjbEIsTSIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi9jb25zdGFudHMuanMnXHJcblxyXG4vLyBYUCdzIHN5c3RlbSBkZWZhdWx0IHZhbHVlIGZvciBgUEFUSEVYVGAgc3lzdGVtIHZhcmlhYmxlLCBqdXN0IGluIGNhc2UgaXQncyBub3RcclxuLy8gc2V0IG9uIFdpbmRvd3MuXHJcbnZhciBYUF9ERUZBVUxUX1BBVEhFWFQgPSAnLmNvbTsuZXhlOy5iYXQ7LmNtZDsudmJzOy52YmU7LmpzOy5qc2U7LndzZjsud3NoJztcclxuXHJcbi8vIEZvciBlYXJsaWVyIHZlcnNpb25zIG9mIE5vZGVKUyB0aGF0IGRvZXNuJ3QgaGF2ZSBhIGxpc3Qgb2YgY29uc3RhbnRzICg8IHY2KVxyXG52YXIgRklMRV9FWEVDVVRBQkxFX01PREUgPSAxO1xyXG5cclxuZnVuY3Rpb24gc3RhdEZvbGxvd0xpbmtzKHBhdGhOYW1lKSB7XHJcbiAgcmV0dXJuIGZzLnN0YXRTeW5jLmFwcGx5KGZzLCBhcmd1bWVudHMgYXMgYW55KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNXaW5kb3dzUGxhdGZvcm0oKSB7XHJcbiAgcmV0dXJuIGNzdC5JU19XSU5ET1dTO1xyXG59XHJcblxyXG4vLyBDcm9zcy1wbGF0Zm9ybSBtZXRob2QgZm9yIHNwbGl0dGluZyBlbnZpcm9ubWVudCBgUEFUSGAgdmFyaWFibGVzXHJcbmZ1bmN0aW9uIHNwbGl0UGF0aChwKSB7XHJcbiAgcmV0dXJuIHAgPyBwLnNwbGl0KHBhdGguZGVsaW1pdGVyKSA6IFtdO1xyXG59XHJcblxyXG4vLyBUZXN0cyBhcmUgcnVubmluZyBhbGwgY2FzZXMgZm9yIHRoaXMgZnVuYyBidXQgaXQgc3RheXMgdW5jb3ZlcmVkIGJ5IGNvZGVjb3YgZHVlIHRvIHVua25vd24gcmVhc29uXHJcbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbmZ1bmN0aW9uIGlzRXhlY3V0YWJsZShwYXRoTmFtZSkge1xyXG4gIHRyeSB7XHJcbiAgICAvLyBUT0RPKG5vZGUtc3VwcG9ydCk6IHJlcGxhY2Ugd2l0aCBmcy5jb25zdGFudHMuWF9PSyBvbmNlIHJlbW92ZSBzdXBwb3J0IGZvciBub2RlIDwgdjZcclxuICAgIGZzLmFjY2Vzc1N5bmMocGF0aE5hbWUsIEZJTEVfRVhFQ1VUQUJMRV9NT0RFKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrUGF0aChwYXRoTmFtZSkge1xyXG4gIHJldHVybiBmcy5leGlzdHNTeW5jKHBhdGhOYW1lKSAmJiAhc3RhdEZvbGxvd0xpbmtzKHBhdGhOYW1lKS5pc0RpcmVjdG9yeSgpXHJcbiAgICAmJiAoaXNXaW5kb3dzUGxhdGZvcm0oKSB8fCBpc0V4ZWN1dGFibGUocGF0aE5hbWUpKTtcclxufVxyXG5cclxuLy9AXHJcbi8vQCAjIyMgd2hpY2goY29tbWFuZClcclxuLy9AXHJcbi8vQCBFeGFtcGxlczpcclxuLy9AXHJcbi8vQCBgYGBqYXZhc2NyaXB0XHJcbi8vQCB2YXIgbm9kZUV4ZWMgPSB3aGljaCgnbm9kZScpO1xyXG4vL0AgYGBgXHJcbi8vQFxyXG4vL0AgU2VhcmNoZXMgZm9yIGBjb21tYW5kYCBpbiB0aGUgc3lzdGVtJ3MgYFBBVEhgLiBPbiBXaW5kb3dzLCB0aGlzIHVzZXMgdGhlXHJcbi8vQCBgUEFUSEVYVGAgdmFyaWFibGUgdG8gYXBwZW5kIHRoZSBleHRlbnNpb24gaWYgaXQncyBub3QgYWxyZWFkeSBleGVjdXRhYmxlLlxyXG4vL0AgUmV0dXJucyBhIFtTaGVsbFN0cmluZ10oI3NoZWxsc3RyaW5nc3RyKSBjb250YWluaW5nIHRoZSBhYnNvbHV0ZSBwYXRoIHRvXHJcbi8vQCBgY29tbWFuZGAuXHJcbmZ1bmN0aW9uIF93aGljaChjbWQpIHtcclxuICBpZiAoIWNtZCkgY29uc29sZS5lcnJvcignbXVzdCBzcGVjaWZ5IGNvbW1hbmQnKTtcclxuXHJcbiAgdmFyIG9wdGlvbnM6IGFueSA9IHt9XHJcblxyXG4gIHZhciBpc1dpbmRvd3MgPSBpc1dpbmRvd3NQbGF0Zm9ybSgpO1xyXG4gIHZhciBwYXRoQXJyYXkgPSBzcGxpdFBhdGgocHJvY2Vzcy5lbnYuUEFUSCk7XHJcblxyXG4gIHZhciBxdWVyeU1hdGNoZXMgPSBbXTtcclxuXHJcbiAgLy8gTm8gcmVsYXRpdmUvYWJzb2x1dGUgcGF0aHMgcHJvdmlkZWQ/XHJcbiAgaWYgKGNtZC5pbmRleE9mKCcvJykgPT09IC0xKSB7XHJcbiAgICAvLyBBc3N1bWUgdGhhdCB0aGVyZSBhcmUgbm8gZXh0ZW5zaW9ucyB0byBhcHBlbmQgdG8gcXVlcmllcyAodGhpcyBpcyB0aGVcclxuICAgIC8vIGNhc2UgZm9yIHVuaXgpXHJcbiAgICB2YXIgcGF0aEV4dEFycmF5ID0gWycnXTtcclxuICAgIGlmIChpc1dpbmRvd3MpIHtcclxuICAgICAgLy8gSW4gY2FzZSB0aGUgUEFUSEVYVCB2YXJpYWJsZSBpcyBzb21laG93IG5vdCBzZXQgKGUuZy5cclxuICAgICAgLy8gY2hpbGRfcHJvY2Vzcy5zcGF3biB3aXRoIGFuIGVtcHR5IGVudmlyb25tZW50KSwgdXNlIHRoZSBYUCBkZWZhdWx0LlxyXG4gICAgICB2YXIgcGF0aEV4dEVudiA9IHByb2Nlc3MuZW52LlBBVEhFWFQgfHwgWFBfREVGQVVMVF9QQVRIRVhUO1xyXG4gICAgICBwYXRoRXh0QXJyYXkgPSBzcGxpdFBhdGgocGF0aEV4dEVudi50b1VwcGVyQ2FzZSgpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTZWFyY2ggZm9yIGNvbW1hbmQgaW4gUEFUSFxyXG4gICAgZm9yICh2YXIgayA9IDA7IGsgPCBwYXRoQXJyYXkubGVuZ3RoOyBrKyspIHtcclxuICAgICAgLy8gYWxyZWFkeSBmb3VuZCBpdFxyXG4gICAgICBpZiAocXVlcnlNYXRjaGVzLmxlbmd0aCA+IDAgJiYgIW9wdGlvbnMuYWxsKSBicmVhaztcclxuXHJcbiAgICAgIHZhciBhdHRlbXB0ID0gcGF0aC5yZXNvbHZlKHBhdGhBcnJheVtrXSwgY21kKTtcclxuXHJcbiAgICAgIGlmIChpc1dpbmRvd3MpIHtcclxuICAgICAgICBhdHRlbXB0ID0gYXR0ZW1wdC50b1VwcGVyQ2FzZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgbWF0Y2ggPSBhdHRlbXB0Lm1hdGNoKC9cXC5bXjw+OlwiL3w/Ki5dKyQvKTtcclxuICAgICAgaWYgKG1hdGNoICYmIHBhdGhFeHRBcnJheS5pbmRleE9mKG1hdGNoWzBdKSA+PSAwKSB7IC8vIHRoaXMgaXMgV2luZG93cy1vbmx5XHJcbiAgICAgICAgLy8gVGhlIHVzZXIgdHlwZWQgYSBxdWVyeSB3aXRoIHRoZSBmaWxlIGV4dGVuc2lvbiwgbGlrZVxyXG4gICAgICAgIC8vIGB3aGljaCgnbm9kZS5leGUnKWBcclxuICAgICAgICBpZiAoY2hlY2tQYXRoKGF0dGVtcHQpKSB7XHJcbiAgICAgICAgICBxdWVyeU1hdGNoZXMucHVzaChhdHRlbXB0KTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHsgLy8gQWxsLXBsYXRmb3Jtc1xyXG4gICAgICAgIC8vIEN5Y2xlIHRocm91Z2ggdGhlIFBBVEhFWFQgYXJyYXksIGFuZCBjaGVjayBlYWNoIGV4dGVuc2lvblxyXG4gICAgICAgIC8vIE5vdGU6IHRoZSBhcnJheSBpcyBhbHdheXMgWycnXSBvbiBVbml4XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoRXh0QXJyYXkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIHZhciBleHQgPSBwYXRoRXh0QXJyYXlbaV07XHJcbiAgICAgICAgICB2YXIgbmV3QXR0ZW1wdCA9IGF0dGVtcHQgKyBleHQ7XHJcbiAgICAgICAgICBpZiAoY2hlY2tQYXRoKG5ld0F0dGVtcHQpKSB7XHJcbiAgICAgICAgICAgIHF1ZXJ5TWF0Y2hlcy5wdXNoKG5ld0F0dGVtcHQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGVsc2UgaWYgKGNoZWNrUGF0aChjbWQpKSB7IC8vIGEgdmFsaWQgYWJzb2x1dGUgb3IgcmVsYXRpdmUgcGF0aFxyXG4gICAgcXVlcnlNYXRjaGVzLnB1c2gocGF0aC5yZXNvbHZlKGNtZCkpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHF1ZXJ5TWF0Y2hlcy5sZW5ndGggPiAwKSB7XHJcbiAgICByZXR1cm4gb3B0aW9ucy5hbGwgPyBxdWVyeU1hdGNoZXMgOiBxdWVyeU1hdGNoZXNbMF07XHJcbiAgfVxyXG4gIHJldHVybiBvcHRpb25zLmFsbCA/IFtdIDogbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgX3doaWNoO1xyXG4iXX0=