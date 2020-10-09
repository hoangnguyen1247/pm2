"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _child_process = require("child_process");

var _path = _interopRequireDefault(require("path"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9vcGVuLnRzIl0sIm5hbWVzIjpbIm9wZW4iLCJ0YXJnZXQiLCJhcHBOYW1lIiwiY2FsbGJhY2siLCJvcGVuZXIiLCJwcm9jZXNzIiwicGxhdGZvcm0iLCJlc2NhcGUiLCJwYXRoIiwiam9pbiIsIl9fZGlybmFtZSIsImVudiIsIlNVRE9fVVNFUiIsInMiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFHQSxTQUFTQSxJQUFULENBQWNDLE1BQWQsRUFBc0JDLE9BQXRCLEVBQWdDQyxRQUFoQyxFQUEyQztBQUN6QyxNQUFJQyxNQUFKOztBQUVBLE1BQUksT0FBT0YsT0FBUCxLQUFvQixVQUF4QixFQUFvQztBQUNsQ0MsSUFBQUEsUUFBUSxHQUFHRCxPQUFYO0FBQ0FBLElBQUFBLE9BQU8sR0FBRyxJQUFWO0FBQ0Q7O0FBRUQsVUFBUUcsT0FBTyxDQUFDQyxRQUFoQjtBQUNBLFNBQUssUUFBTDtBQUNFLFVBQUlKLE9BQUosRUFBYTtBQUNYRSxRQUFBQSxNQUFNLEdBQUcsY0FBY0csTUFBTSxDQUFDTCxPQUFELENBQXBCLEdBQWdDLEdBQXpDO0FBQ0QsT0FGRCxNQUVPO0FBQ0xFLFFBQUFBLE1BQU0sR0FBRyxNQUFUO0FBQ0Q7O0FBQ0Q7O0FBQ0YsU0FBSyxPQUFMO0FBQ0U7QUFDQTtBQUNBLFVBQUlGLE9BQUosRUFBYTtBQUNYRSxRQUFBQSxNQUFNLEdBQUcsZUFBZUcsTUFBTSxDQUFDTCxPQUFELENBQXJCLEdBQWlDLEdBQTFDO0FBQ0QsT0FGRCxNQUVPO0FBQ0xFLFFBQUFBLE1BQU0sR0FBRyxVQUFUO0FBQ0Q7O0FBQ0Q7O0FBQ0Y7QUFDRSxVQUFJRixPQUFKLEVBQWE7QUFDWEUsUUFBQUEsTUFBTSxHQUFHRyxNQUFNLENBQUNMLE9BQUQsQ0FBZjtBQUNELE9BRkQsTUFFTztBQUNMO0FBQ0FFLFFBQUFBLE1BQU0sR0FBR0ksaUJBQUtDLElBQUwsQ0FBVUMsU0FBVixFQUFxQixZQUFyQixDQUFUO0FBQ0Q7O0FBQ0Q7QUF4QkY7O0FBMkJBLE1BQUlMLE9BQU8sQ0FBQ00sR0FBUixDQUFZQyxTQUFoQixFQUEyQjtBQUN6QlIsSUFBQUEsTUFBTSxHQUFHLGFBQWFDLE9BQU8sQ0FBQ00sR0FBUixDQUFZQyxTQUF6QixHQUFxQyxHQUFyQyxHQUEyQ1IsTUFBcEQ7QUFDRDs7QUFDRCxTQUFPLHlCQUFLQSxNQUFNLEdBQUcsSUFBVCxHQUFnQkcsTUFBTSxDQUFDTixNQUFELENBQXRCLEdBQWlDLEdBQXRDLEVBQTJDRSxRQUEzQyxDQUFQO0FBQ0Q7O0FBRUQsU0FBU0ksTUFBVCxDQUFnQk0sQ0FBaEIsRUFBbUI7QUFDakIsU0FBT0EsQ0FBQyxDQUFDQyxPQUFGLENBQVUsSUFBVixFQUFnQixNQUFoQixDQUFQO0FBQ0Q7QUFFRDs7Ozs7Ozs7Ozs7OztlQVllZCxJIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhlYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuICA7XG5cbmZ1bmN0aW9uIG9wZW4odGFyZ2V0LCBhcHBOYW1lPywgY2FsbGJhY2s/KSB7XG4gIHZhciBvcGVuZXI7XG5cbiAgaWYgKHR5cGVvZihhcHBOYW1lKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gYXBwTmFtZTtcbiAgICBhcHBOYW1lID0gbnVsbDtcbiAgfVxuXG4gIHN3aXRjaCAocHJvY2Vzcy5wbGF0Zm9ybSkge1xuICBjYXNlICdkYXJ3aW4nOlxuICAgIGlmIChhcHBOYW1lKSB7XG4gICAgICBvcGVuZXIgPSAnb3BlbiAtYSBcIicgKyBlc2NhcGUoYXBwTmFtZSkgKyAnXCInO1xuICAgIH0gZWxzZSB7XG4gICAgICBvcGVuZXIgPSAnb3Blbic7XG4gICAgfVxuICAgIGJyZWFrO1xuICBjYXNlICd3aW4zMic6XG4gICAgLy8gaWYgdGhlIGZpcnN0IHBhcmFtZXRlciB0byBzdGFydCBpcyBxdW90ZWQsIGl0IHVzZXMgdGhhdCBhcyB0aGUgdGl0bGVcbiAgICAvLyBzbyB3ZSBwYXNzIGEgYmxhbmsgdGl0bGUgc28gd2UgY2FuIHF1b3RlIHRoZSBmaWxlIHdlIGFyZSBvcGVuaW5nXG4gICAgaWYgKGFwcE5hbWUpIHtcbiAgICAgIG9wZW5lciA9ICdzdGFydCBcIlwiIFwiJyArIGVzY2FwZShhcHBOYW1lKSArICdcIic7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wZW5lciA9ICdzdGFydCBcIlwiJztcbiAgICB9XG4gICAgYnJlYWs7XG4gIGRlZmF1bHQ6XG4gICAgaWYgKGFwcE5hbWUpIHtcbiAgICAgIG9wZW5lciA9IGVzY2FwZShhcHBOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gdXNlIFBvcnRsYW5kcyB4ZGctb3BlbiBldmVyeXdoZXJlIGVsc2VcbiAgICAgIG9wZW5lciA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuL3hkZy1vcGVuJyk7XG4gICAgfVxuICAgIGJyZWFrO1xuICB9XG5cbiAgaWYgKHByb2Nlc3MuZW52LlNVRE9fVVNFUikge1xuICAgIG9wZW5lciA9ICdzdWRvIC11ICcgKyBwcm9jZXNzLmVudi5TVURPX1VTRVIgKyAnICcgKyBvcGVuZXI7XG4gIH1cbiAgcmV0dXJuIGV4ZWMob3BlbmVyICsgJyBcIicgKyBlc2NhcGUodGFyZ2V0KSArICdcIicsIGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gZXNjYXBlKHMpIHtcbiAgcmV0dXJuIHMucmVwbGFjZSgvXCIvZywgJ1xcXFxcXFwiJyk7XG59XG5cbi8qKlxuICogb3BlbiBhIGZpbGUgb3IgdXJpIHVzaW5nIHRoZSBkZWZhdWx0IGFwcGxpY2F0aW9uIGZvciB0aGUgZmlsZSB0eXBlLlxuICpcbiAqIEByZXR1cm4ge0NoaWxkUHJvY2Vzc30gLSB0aGUgY2hpbGQgcHJvY2VzcyBvYmplY3QuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFyZ2V0IC0gdGhlIGZpbGUvdXJpIHRvIG9wZW4uXG4gKiBAcGFyYW0ge3N0cmluZ30gYXBwTmFtZSAtIChvcHRpb25hbCkgdGhlIGFwcGxpY2F0aW9uIHRvIGJlIHVzZWQgdG8gb3BlbiB0aGVcbiAqICAgICAgZmlsZSAoZm9yIGV4YW1wbGUsIFwiY2hyb21lXCIsIFwiZmlyZWZveFwiKVxuICogQHBhcmFtIHtmdW5jdGlvbihFcnJvcil9IGNhbGxiYWNrIC0gY2FsbGVkIHdpdGggbnVsbCBvbiBzdWNjZXNzLCBvclxuICogICAgICBhbiBlcnJvciBvYmplY3QgdGhhdCBjb250YWlucyBhIHByb3BlcnR5ICdjb2RlJyB3aXRoIHRoZSBleGl0XG4gKiAgICAgIGNvZGUgb2YgdGhlIHByb2Nlc3MuXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgb3BlbjtcbiJdfQ==