"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _child_process = require("child_process");

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function open(target, appName, callback) {
  var opener;

  if (typeof appName === 'function') {
    callback = appName;
    appName = null;
  }

  switch (process.platform) {
    case 'darwin':
      if (appName) {
        opener = 'open -a "' + escape(appName) + '"';
      } else {
        opener = 'open';
      }

      break;

    case 'win32':
      // if the first parameter to start is quoted, it uses that as the title
      // so we pass a blank title so we can quote the file we are opening
      if (appName) {
        opener = 'start "" "' + escape(appName) + '"';
      } else {
        opener = 'start ""';
      }

      break;

    default:
      if (appName) {
        opener = escape(appName);
      } else {
        // use Portlands xdg-open everywhere else
        opener = _path["default"].join(__dirname, './xdg-open');
      }

      break;
  }

  if (process.env.SUDO_USER) {
    opener = 'sudo -u ' + process.env.SUDO_USER + ' ' + opener;
  }

  return (0, _child_process.exec)(opener + ' "' + escape(target) + '"', callback);
}

function escape(s) {
  return s.replace(/"/g, '\\\"');
}
/**
 * open a file or uri using the default application for the file type.
 *
 * @return {ChildProcess} - the child process object.
 * @param {string} target - the file/uri to open.
 * @param {string} appName - (optional) the application to be used to open the
 *      file (for example, "chrome", "firefox")
 * @param {function(Error)} callback - called with null on success, or
 *      an error object that contains a property 'code' with the exit
 *      code of the process.
 */


var _default = open;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9vcGVuLnRzIl0sIm5hbWVzIjpbIm9wZW4iLCJ0YXJnZXQiLCJhcHBOYW1lIiwiY2FsbGJhY2siLCJvcGVuZXIiLCJwcm9jZXNzIiwicGxhdGZvcm0iLCJlc2NhcGUiLCJwYXRoIiwiam9pbiIsIl9fZGlybmFtZSIsImVudiIsIlNVRE9fVVNFUiIsInMiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFHQSxTQUFTQSxJQUFULENBQWNDLE1BQWQsRUFBc0JDLE9BQXRCLEVBQWdDQyxRQUFoQyxFQUEyQztBQUN6QyxNQUFJQyxNQUFKOztBQUVBLE1BQUksT0FBT0YsT0FBUCxLQUFvQixVQUF4QixFQUFvQztBQUNsQ0MsSUFBQUEsUUFBUSxHQUFHRCxPQUFYO0FBQ0FBLElBQUFBLE9BQU8sR0FBRyxJQUFWO0FBQ0Q7O0FBRUQsVUFBUUcsT0FBTyxDQUFDQyxRQUFoQjtBQUNBLFNBQUssUUFBTDtBQUNFLFVBQUlKLE9BQUosRUFBYTtBQUNYRSxRQUFBQSxNQUFNLEdBQUcsY0FBY0csTUFBTSxDQUFDTCxPQUFELENBQXBCLEdBQWdDLEdBQXpDO0FBQ0QsT0FGRCxNQUVPO0FBQ0xFLFFBQUFBLE1BQU0sR0FBRyxNQUFUO0FBQ0Q7O0FBQ0Q7O0FBQ0YsU0FBSyxPQUFMO0FBQ0U7QUFDQTtBQUNBLFVBQUlGLE9BQUosRUFBYTtBQUNYRSxRQUFBQSxNQUFNLEdBQUcsZUFBZUcsTUFBTSxDQUFDTCxPQUFELENBQXJCLEdBQWlDLEdBQTFDO0FBQ0QsT0FGRCxNQUVPO0FBQ0xFLFFBQUFBLE1BQU0sR0FBRyxVQUFUO0FBQ0Q7O0FBQ0Q7O0FBQ0Y7QUFDRSxVQUFJRixPQUFKLEVBQWE7QUFDWEUsUUFBQUEsTUFBTSxHQUFHRyxNQUFNLENBQUNMLE9BQUQsQ0FBZjtBQUNELE9BRkQsTUFFTztBQUNMO0FBQ0FFLFFBQUFBLE1BQU0sR0FBR0ksaUJBQUtDLElBQUwsQ0FBVUMsU0FBVixFQUFxQixZQUFyQixDQUFUO0FBQ0Q7O0FBQ0Q7QUF4QkY7O0FBMkJBLE1BQUlMLE9BQU8sQ0FBQ00sR0FBUixDQUFZQyxTQUFoQixFQUEyQjtBQUN6QlIsSUFBQUEsTUFBTSxHQUFHLGFBQWFDLE9BQU8sQ0FBQ00sR0FBUixDQUFZQyxTQUF6QixHQUFxQyxHQUFyQyxHQUEyQ1IsTUFBcEQ7QUFDRDs7QUFDRCxTQUFPLHlCQUFLQSxNQUFNLEdBQUcsSUFBVCxHQUFnQkcsTUFBTSxDQUFDTixNQUFELENBQXRCLEdBQWlDLEdBQXRDLEVBQTJDRSxRQUEzQyxDQUFQO0FBQ0Q7O0FBRUQsU0FBU0ksTUFBVCxDQUFnQk0sQ0FBaEIsRUFBbUI7QUFDakIsU0FBT0EsQ0FBQyxDQUFDQyxPQUFGLENBQVUsSUFBVixFQUFnQixNQUFoQixDQUFQO0FBQ0Q7QUFFRDs7Ozs7Ozs7Ozs7OztlQVllZCxJIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhlYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXHJcbiAgO1xyXG5cclxuZnVuY3Rpb24gb3Blbih0YXJnZXQsIGFwcE5hbWU/LCBjYWxsYmFjaz8pIHtcclxuICB2YXIgb3BlbmVyO1xyXG5cclxuICBpZiAodHlwZW9mKGFwcE5hbWUpID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBjYWxsYmFjayA9IGFwcE5hbWU7XHJcbiAgICBhcHBOYW1lID0gbnVsbDtcclxuICB9XHJcblxyXG4gIHN3aXRjaCAocHJvY2Vzcy5wbGF0Zm9ybSkge1xyXG4gIGNhc2UgJ2Rhcndpbic6XHJcbiAgICBpZiAoYXBwTmFtZSkge1xyXG4gICAgICBvcGVuZXIgPSAnb3BlbiAtYSBcIicgKyBlc2NhcGUoYXBwTmFtZSkgKyAnXCInO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb3BlbmVyID0gJ29wZW4nO1xyXG4gICAgfVxyXG4gICAgYnJlYWs7XHJcbiAgY2FzZSAnd2luMzInOlxyXG4gICAgLy8gaWYgdGhlIGZpcnN0IHBhcmFtZXRlciB0byBzdGFydCBpcyBxdW90ZWQsIGl0IHVzZXMgdGhhdCBhcyB0aGUgdGl0bGVcclxuICAgIC8vIHNvIHdlIHBhc3MgYSBibGFuayB0aXRsZSBzbyB3ZSBjYW4gcXVvdGUgdGhlIGZpbGUgd2UgYXJlIG9wZW5pbmdcclxuICAgIGlmIChhcHBOYW1lKSB7XHJcbiAgICAgIG9wZW5lciA9ICdzdGFydCBcIlwiIFwiJyArIGVzY2FwZShhcHBOYW1lKSArICdcIic7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBvcGVuZXIgPSAnc3RhcnQgXCJcIic7XHJcbiAgICB9XHJcbiAgICBicmVhaztcclxuICBkZWZhdWx0OlxyXG4gICAgaWYgKGFwcE5hbWUpIHtcclxuICAgICAgb3BlbmVyID0gZXNjYXBlKGFwcE5hbWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gdXNlIFBvcnRsYW5kcyB4ZGctb3BlbiBldmVyeXdoZXJlIGVsc2VcclxuICAgICAgb3BlbmVyID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4veGRnLW9wZW4nKTtcclxuICAgIH1cclxuICAgIGJyZWFrO1xyXG4gIH1cclxuXHJcbiAgaWYgKHByb2Nlc3MuZW52LlNVRE9fVVNFUikge1xyXG4gICAgb3BlbmVyID0gJ3N1ZG8gLXUgJyArIHByb2Nlc3MuZW52LlNVRE9fVVNFUiArICcgJyArIG9wZW5lcjtcclxuICB9XHJcbiAgcmV0dXJuIGV4ZWMob3BlbmVyICsgJyBcIicgKyBlc2NhcGUodGFyZ2V0KSArICdcIicsIGNhbGxiYWNrKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXNjYXBlKHMpIHtcclxuICByZXR1cm4gcy5yZXBsYWNlKC9cIi9nLCAnXFxcXFxcXCInKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIG9wZW4gYSBmaWxlIG9yIHVyaSB1c2luZyB0aGUgZGVmYXVsdCBhcHBsaWNhdGlvbiBmb3IgdGhlIGZpbGUgdHlwZS5cclxuICpcclxuICogQHJldHVybiB7Q2hpbGRQcm9jZXNzfSAtIHRoZSBjaGlsZCBwcm9jZXNzIG9iamVjdC5cclxuICogQHBhcmFtIHtzdHJpbmd9IHRhcmdldCAtIHRoZSBmaWxlL3VyaSB0byBvcGVuLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYXBwTmFtZSAtIChvcHRpb25hbCkgdGhlIGFwcGxpY2F0aW9uIHRvIGJlIHVzZWQgdG8gb3BlbiB0aGVcclxuICogICAgICBmaWxlIChmb3IgZXhhbXBsZSwgXCJjaHJvbWVcIiwgXCJmaXJlZm94XCIpXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oRXJyb3IpfSBjYWxsYmFjayAtIGNhbGxlZCB3aXRoIG51bGwgb24gc3VjY2Vzcywgb3JcclxuICogICAgICBhbiBlcnJvciBvYmplY3QgdGhhdCBjb250YWlucyBhIHByb3BlcnR5ICdjb2RlJyB3aXRoIHRoZSBleGl0XHJcbiAqICAgICAgY29kZSBvZiB0aGUgcHJvY2Vzcy5cclxuICovXHJcblxyXG5leHBvcnQgZGVmYXVsdCBvcGVuO1xyXG4iXX0=