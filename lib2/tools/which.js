"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _constants = _interopRequireDefault(require("../../constants.js"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy93aGljaC50cyJdLCJuYW1lcyI6WyJYUF9ERUZBVUxUX1BBVEhFWFQiLCJGSUxFX0VYRUNVVEFCTEVfTU9ERSIsInN0YXRGb2xsb3dMaW5rcyIsInBhdGhOYW1lIiwiZnMiLCJzdGF0U3luYyIsImFwcGx5IiwiYXJndW1lbnRzIiwiaXNXaW5kb3dzUGxhdGZvcm0iLCJjc3QiLCJJU19XSU5ET1dTIiwic3BsaXRQYXRoIiwicCIsInNwbGl0IiwicGF0aCIsImRlbGltaXRlciIsImlzRXhlY3V0YWJsZSIsImFjY2Vzc1N5bmMiLCJlcnIiLCJjaGVja1BhdGgiLCJleGlzdHNTeW5jIiwiaXNEaXJlY3RvcnkiLCJfd2hpY2giLCJjbWQiLCJjb25zb2xlIiwiZXJyb3IiLCJvcHRpb25zIiwiaXNXaW5kb3dzIiwicGF0aEFycmF5IiwicHJvY2VzcyIsImVudiIsIlBBVEgiLCJxdWVyeU1hdGNoZXMiLCJpbmRleE9mIiwicGF0aEV4dEFycmF5IiwicGF0aEV4dEVudiIsIlBBVEhFWFQiLCJ0b1VwcGVyQ2FzZSIsImsiLCJsZW5ndGgiLCJhbGwiLCJhdHRlbXB0IiwicmVzb2x2ZSIsIm1hdGNoIiwicHVzaCIsImkiLCJleHQiLCJuZXdBdHRlbXB0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSUEsa0JBQWtCLEdBQUcsa0RBQXpCLEMsQ0FFQTs7QUFDQSxJQUFJQyxvQkFBb0IsR0FBRyxDQUEzQjs7QUFFQSxTQUFTQyxlQUFULENBQXlCQyxRQUF6QixFQUFtQztBQUNqQyxTQUFPQyxlQUFHQyxRQUFILENBQVlDLEtBQVosQ0FBa0JGLGNBQWxCLEVBQXNCRyxTQUF0QixDQUFQO0FBQ0Q7O0FBRUQsU0FBU0MsaUJBQVQsR0FBNkI7QUFDM0IsU0FBT0Msc0JBQUlDLFVBQVg7QUFDRCxDLENBRUQ7OztBQUNBLFNBQVNDLFNBQVQsQ0FBbUJDLENBQW5CLEVBQXNCO0FBQ3BCLFNBQU9BLENBQUMsR0FBR0EsQ0FBQyxDQUFDQyxLQUFGLENBQVFDLGlCQUFLQyxTQUFiLENBQUgsR0FBNkIsRUFBckM7QUFDRCxDLENBRUQ7O0FBQ0E7OztBQUNBLFNBQVNDLFlBQVQsQ0FBc0JiLFFBQXRCLEVBQWdDO0FBQzlCLE1BQUk7QUFDRjtBQUNBQyxtQkFBR2EsVUFBSCxDQUFjZCxRQUFkLEVBQXdCRixvQkFBeEI7QUFDRCxHQUhELENBR0UsT0FBT2lCLEdBQVAsRUFBWTtBQUNaLFdBQU8sS0FBUDtBQUNEOztBQUNELFNBQU8sSUFBUDtBQUNEOztBQUVELFNBQVNDLFNBQVQsQ0FBbUJoQixRQUFuQixFQUE2QjtBQUMzQixTQUFPQyxlQUFHZ0IsVUFBSCxDQUFjakIsUUFBZCxLQUEyQixDQUFDRCxlQUFlLENBQUNDLFFBQUQsQ0FBZixDQUEwQmtCLFdBQTFCLEVBQTVCLEtBQ0RiLGlCQUFpQixNQUFNUSxZQUFZLENBQUNiLFFBQUQsQ0FEbEMsQ0FBUDtBQUVELEMsQ0FFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0EsU0FBU21CLE1BQVQsQ0FBZ0JDLEdBQWhCLEVBQXFCO0FBQ25CLE1BQUksQ0FBQ0EsR0FBTCxFQUFVQyxPQUFPLENBQUNDLEtBQVIsQ0FBYyxzQkFBZDtBQUVWLE1BQUlDLE9BQVksR0FBRyxFQUFuQjtBQUVBLE1BQUlDLFNBQVMsR0FBR25CLGlCQUFpQixFQUFqQztBQUNBLE1BQUlvQixTQUFTLEdBQUdqQixTQUFTLENBQUNrQixPQUFPLENBQUNDLEdBQVIsQ0FBWUMsSUFBYixDQUF6QjtBQUVBLE1BQUlDLFlBQVksR0FBRyxFQUFuQixDQVJtQixDQVVuQjs7QUFDQSxNQUFJVCxHQUFHLENBQUNVLE9BQUosQ0FBWSxHQUFaLE1BQXFCLENBQUMsQ0FBMUIsRUFBNkI7QUFDM0I7QUFDQTtBQUNBLFFBQUlDLFlBQVksR0FBRyxDQUFDLEVBQUQsQ0FBbkI7O0FBQ0EsUUFBSVAsU0FBSixFQUFlO0FBQ2I7QUFDQTtBQUNBLFVBQUlRLFVBQVUsR0FBR04sT0FBTyxDQUFDQyxHQUFSLENBQVlNLE9BQVosSUFBdUJwQyxrQkFBeEM7QUFDQWtDLE1BQUFBLFlBQVksR0FBR3ZCLFNBQVMsQ0FBQ3dCLFVBQVUsQ0FBQ0UsV0FBWCxFQUFELENBQXhCO0FBQ0QsS0FUMEIsQ0FXM0I7OztBQUNBLFNBQUssSUFBSUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR1YsU0FBUyxDQUFDVyxNQUE5QixFQUFzQ0QsQ0FBQyxFQUF2QyxFQUEyQztBQUN6QztBQUNBLFVBQUlOLFlBQVksQ0FBQ08sTUFBYixHQUFzQixDQUF0QixJQUEyQixDQUFDYixPQUFPLENBQUNjLEdBQXhDLEVBQTZDOztBQUU3QyxVQUFJQyxPQUFPLEdBQUczQixpQkFBSzRCLE9BQUwsQ0FBYWQsU0FBUyxDQUFDVSxDQUFELENBQXRCLEVBQTJCZixHQUEzQixDQUFkOztBQUVBLFVBQUlJLFNBQUosRUFBZTtBQUNiYyxRQUFBQSxPQUFPLEdBQUdBLE9BQU8sQ0FBQ0osV0FBUixFQUFWO0FBQ0Q7O0FBRUQsVUFBSU0sS0FBSyxHQUFHRixPQUFPLENBQUNFLEtBQVIsQ0FBYyxrQkFBZCxDQUFaOztBQUNBLFVBQUlBLEtBQUssSUFBSVQsWUFBWSxDQUFDRCxPQUFiLENBQXFCVSxLQUFLLENBQUMsQ0FBRCxDQUExQixLQUFrQyxDQUEvQyxFQUFrRDtBQUFFO0FBQ2xEO0FBQ0E7QUFDQSxZQUFJeEIsU0FBUyxDQUFDc0IsT0FBRCxDQUFiLEVBQXdCO0FBQ3RCVCxVQUFBQSxZQUFZLENBQUNZLElBQWIsQ0FBa0JILE9BQWxCO0FBQ0E7QUFDRDtBQUNGLE9BUEQsTUFPTztBQUFFO0FBQ1A7QUFDQTtBQUNBLGFBQUssSUFBSUksQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR1gsWUFBWSxDQUFDSyxNQUFqQyxFQUF5Q00sQ0FBQyxFQUExQyxFQUE4QztBQUM1QyxjQUFJQyxHQUFHLEdBQUdaLFlBQVksQ0FBQ1csQ0FBRCxDQUF0QjtBQUNBLGNBQUlFLFVBQVUsR0FBR04sT0FBTyxHQUFHSyxHQUEzQjs7QUFDQSxjQUFJM0IsU0FBUyxDQUFDNEIsVUFBRCxDQUFiLEVBQTJCO0FBQ3pCZixZQUFBQSxZQUFZLENBQUNZLElBQWIsQ0FBa0JHLFVBQWxCO0FBQ0E7QUFDRDtBQUNGO0FBQ0Y7QUFDRjtBQUNGLEdBM0NELE1BMkNPLElBQUk1QixTQUFTLENBQUNJLEdBQUQsQ0FBYixFQUFvQjtBQUFFO0FBQzNCUyxJQUFBQSxZQUFZLENBQUNZLElBQWIsQ0FBa0I5QixpQkFBSzRCLE9BQUwsQ0FBYW5CLEdBQWIsQ0FBbEI7QUFDRDs7QUFFRCxNQUFJUyxZQUFZLENBQUNPLE1BQWIsR0FBc0IsQ0FBMUIsRUFBNkI7QUFDM0IsV0FBT2IsT0FBTyxDQUFDYyxHQUFSLEdBQWNSLFlBQWQsR0FBNkJBLFlBQVksQ0FBQyxDQUFELENBQWhEO0FBQ0Q7O0FBQ0QsU0FBT04sT0FBTyxDQUFDYyxHQUFSLEdBQWMsRUFBZCxHQUFtQixJQUExQjtBQUNEOztlQUVjbEIsTSIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi9jb25zdGFudHMuanMnXG5cbi8vIFhQJ3Mgc3lzdGVtIGRlZmF1bHQgdmFsdWUgZm9yIGBQQVRIRVhUYCBzeXN0ZW0gdmFyaWFibGUsIGp1c3QgaW4gY2FzZSBpdCdzIG5vdFxuLy8gc2V0IG9uIFdpbmRvd3MuXG52YXIgWFBfREVGQVVMVF9QQVRIRVhUID0gJy5jb207LmV4ZTsuYmF0Oy5jbWQ7LnZiczsudmJlOy5qczsuanNlOy53c2Y7LndzaCc7XG5cbi8vIEZvciBlYXJsaWVyIHZlcnNpb25zIG9mIE5vZGVKUyB0aGF0IGRvZXNuJ3QgaGF2ZSBhIGxpc3Qgb2YgY29uc3RhbnRzICg8IHY2KVxudmFyIEZJTEVfRVhFQ1VUQUJMRV9NT0RFID0gMTtcblxuZnVuY3Rpb24gc3RhdEZvbGxvd0xpbmtzKHBhdGhOYW1lKSB7XG4gIHJldHVybiBmcy5zdGF0U3luYy5hcHBseShmcywgYXJndW1lbnRzIGFzIGFueSk7XG59XG5cbmZ1bmN0aW9uIGlzV2luZG93c1BsYXRmb3JtKCkge1xuICByZXR1cm4gY3N0LklTX1dJTkRPV1M7XG59XG5cbi8vIENyb3NzLXBsYXRmb3JtIG1ldGhvZCBmb3Igc3BsaXR0aW5nIGVudmlyb25tZW50IGBQQVRIYCB2YXJpYWJsZXNcbmZ1bmN0aW9uIHNwbGl0UGF0aChwKSB7XG4gIHJldHVybiBwID8gcC5zcGxpdChwYXRoLmRlbGltaXRlcikgOiBbXTtcbn1cblxuLy8gVGVzdHMgYXJlIHJ1bm5pbmcgYWxsIGNhc2VzIGZvciB0aGlzIGZ1bmMgYnV0IGl0IHN0YXlzIHVuY292ZXJlZCBieSBjb2RlY292IGR1ZSB0byB1bmtub3duIHJlYXNvblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmZ1bmN0aW9uIGlzRXhlY3V0YWJsZShwYXRoTmFtZSkge1xuICB0cnkge1xuICAgIC8vIFRPRE8obm9kZS1zdXBwb3J0KTogcmVwbGFjZSB3aXRoIGZzLmNvbnN0YW50cy5YX09LIG9uY2UgcmVtb3ZlIHN1cHBvcnQgZm9yIG5vZGUgPCB2NlxuICAgIGZzLmFjY2Vzc1N5bmMocGF0aE5hbWUsIEZJTEVfRVhFQ1VUQUJMRV9NT0RFKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBjaGVja1BhdGgocGF0aE5hbWUpIHtcbiAgcmV0dXJuIGZzLmV4aXN0c1N5bmMocGF0aE5hbWUpICYmICFzdGF0Rm9sbG93TGlua3MocGF0aE5hbWUpLmlzRGlyZWN0b3J5KClcbiAgICAmJiAoaXNXaW5kb3dzUGxhdGZvcm0oKSB8fCBpc0V4ZWN1dGFibGUocGF0aE5hbWUpKTtcbn1cblxuLy9AXG4vL0AgIyMjIHdoaWNoKGNvbW1hbmQpXG4vL0Bcbi8vQCBFeGFtcGxlczpcbi8vQFxuLy9AIGBgYGphdmFzY3JpcHRcbi8vQCB2YXIgbm9kZUV4ZWMgPSB3aGljaCgnbm9kZScpO1xuLy9AIGBgYFxuLy9AXG4vL0AgU2VhcmNoZXMgZm9yIGBjb21tYW5kYCBpbiB0aGUgc3lzdGVtJ3MgYFBBVEhgLiBPbiBXaW5kb3dzLCB0aGlzIHVzZXMgdGhlXG4vL0AgYFBBVEhFWFRgIHZhcmlhYmxlIHRvIGFwcGVuZCB0aGUgZXh0ZW5zaW9uIGlmIGl0J3Mgbm90IGFscmVhZHkgZXhlY3V0YWJsZS5cbi8vQCBSZXR1cm5zIGEgW1NoZWxsU3RyaW5nXSgjc2hlbGxzdHJpbmdzdHIpIGNvbnRhaW5pbmcgdGhlIGFic29sdXRlIHBhdGggdG9cbi8vQCBgY29tbWFuZGAuXG5mdW5jdGlvbiBfd2hpY2goY21kKSB7XG4gIGlmICghY21kKSBjb25zb2xlLmVycm9yKCdtdXN0IHNwZWNpZnkgY29tbWFuZCcpO1xuXG4gIHZhciBvcHRpb25zOiBhbnkgPSB7fVxuXG4gIHZhciBpc1dpbmRvd3MgPSBpc1dpbmRvd3NQbGF0Zm9ybSgpO1xuICB2YXIgcGF0aEFycmF5ID0gc3BsaXRQYXRoKHByb2Nlc3MuZW52LlBBVEgpO1xuXG4gIHZhciBxdWVyeU1hdGNoZXMgPSBbXTtcblxuICAvLyBObyByZWxhdGl2ZS9hYnNvbHV0ZSBwYXRocyBwcm92aWRlZD9cbiAgaWYgKGNtZC5pbmRleE9mKCcvJykgPT09IC0xKSB7XG4gICAgLy8gQXNzdW1lIHRoYXQgdGhlcmUgYXJlIG5vIGV4dGVuc2lvbnMgdG8gYXBwZW5kIHRvIHF1ZXJpZXMgKHRoaXMgaXMgdGhlXG4gICAgLy8gY2FzZSBmb3IgdW5peClcbiAgICB2YXIgcGF0aEV4dEFycmF5ID0gWycnXTtcbiAgICBpZiAoaXNXaW5kb3dzKSB7XG4gICAgICAvLyBJbiBjYXNlIHRoZSBQQVRIRVhUIHZhcmlhYmxlIGlzIHNvbWVob3cgbm90IHNldCAoZS5nLlxuICAgICAgLy8gY2hpbGRfcHJvY2Vzcy5zcGF3biB3aXRoIGFuIGVtcHR5IGVudmlyb25tZW50KSwgdXNlIHRoZSBYUCBkZWZhdWx0LlxuICAgICAgdmFyIHBhdGhFeHRFbnYgPSBwcm9jZXNzLmVudi5QQVRIRVhUIHx8IFhQX0RFRkFVTFRfUEFUSEVYVDtcbiAgICAgIHBhdGhFeHRBcnJheSA9IHNwbGl0UGF0aChwYXRoRXh0RW52LnRvVXBwZXJDYXNlKCkpO1xuICAgIH1cblxuICAgIC8vIFNlYXJjaCBmb3IgY29tbWFuZCBpbiBQQVRIXG4gICAgZm9yICh2YXIgayA9IDA7IGsgPCBwYXRoQXJyYXkubGVuZ3RoOyBrKyspIHtcbiAgICAgIC8vIGFscmVhZHkgZm91bmQgaXRcbiAgICAgIGlmIChxdWVyeU1hdGNoZXMubGVuZ3RoID4gMCAmJiAhb3B0aW9ucy5hbGwpIGJyZWFrO1xuXG4gICAgICB2YXIgYXR0ZW1wdCA9IHBhdGgucmVzb2x2ZShwYXRoQXJyYXlba10sIGNtZCk7XG5cbiAgICAgIGlmIChpc1dpbmRvd3MpIHtcbiAgICAgICAgYXR0ZW1wdCA9IGF0dGVtcHQudG9VcHBlckNhc2UoKTtcbiAgICAgIH1cblxuICAgICAgdmFyIG1hdGNoID0gYXR0ZW1wdC5tYXRjaCgvXFwuW148PjpcIi98PyouXSskLyk7XG4gICAgICBpZiAobWF0Y2ggJiYgcGF0aEV4dEFycmF5LmluZGV4T2YobWF0Y2hbMF0pID49IDApIHsgLy8gdGhpcyBpcyBXaW5kb3dzLW9ubHlcbiAgICAgICAgLy8gVGhlIHVzZXIgdHlwZWQgYSBxdWVyeSB3aXRoIHRoZSBmaWxlIGV4dGVuc2lvbiwgbGlrZVxuICAgICAgICAvLyBgd2hpY2goJ25vZGUuZXhlJylgXG4gICAgICAgIGlmIChjaGVja1BhdGgoYXR0ZW1wdCkpIHtcbiAgICAgICAgICBxdWVyeU1hdGNoZXMucHVzaChhdHRlbXB0KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHsgLy8gQWxsLXBsYXRmb3Jtc1xuICAgICAgICAvLyBDeWNsZSB0aHJvdWdoIHRoZSBQQVRIRVhUIGFycmF5LCBhbmQgY2hlY2sgZWFjaCBleHRlbnNpb25cbiAgICAgICAgLy8gTm90ZTogdGhlIGFycmF5IGlzIGFsd2F5cyBbJyddIG9uIFVuaXhcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoRXh0QXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgZXh0ID0gcGF0aEV4dEFycmF5W2ldO1xuICAgICAgICAgIHZhciBuZXdBdHRlbXB0ID0gYXR0ZW1wdCArIGV4dDtcbiAgICAgICAgICBpZiAoY2hlY2tQYXRoKG5ld0F0dGVtcHQpKSB7XG4gICAgICAgICAgICBxdWVyeU1hdGNoZXMucHVzaChuZXdBdHRlbXB0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChjaGVja1BhdGgoY21kKSkgeyAvLyBhIHZhbGlkIGFic29sdXRlIG9yIHJlbGF0aXZlIHBhdGhcbiAgICBxdWVyeU1hdGNoZXMucHVzaChwYXRoLnJlc29sdmUoY21kKSk7XG4gIH1cblxuICBpZiAocXVlcnlNYXRjaGVzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gb3B0aW9ucy5hbGwgPyBxdWVyeU1hdGNoZXMgOiBxdWVyeU1hdGNoZXNbMF07XG4gIH1cbiAgcmV0dXJuIG9wdGlvbnMuYWxsID8gW10gOiBudWxsO1xufVxuXG5leHBvcnQgZGVmYXVsdCBfd2hpY2g7XG4iXX0=