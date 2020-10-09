"use strict";

var _url = _interopRequireDefault(require("url"));

var _ProcessUtils = _interopRequireDefault(require("./ProcessUtils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

_ProcessUtils["default"].injectModules();

if (typeof process.env.source_map_support != "undefined" && process.env.source_map_support !== "false") {
  require('source-map-support').install();
} // Rename the process


process.title = process.env.PROCESS_TITLE || 'node ' + process.env.pm_exec_path;
if (process.connected && process.send && process.versions && process.versions.node) process.send({
  'node_version': process.versions.node
}); // Require the real application

if (process.env.pm_exec_path) {
  if (_ProcessUtils["default"].isESModule(process.env.pm_exec_path) === true) {
    Promise.resolve("".concat(_url["default"].pathToFileURL(process.env.pm_exec_path).toString())).then(function (s) {
      return _interopRequireWildcard(require(s));
    });
  } else require('module')._load(process.env.pm_exec_path, null, true);
} else throw new Error('Could not _load() the script'); // Change some values to make node think that the user's application
// was started directly such as `node app.js`


process.mainModule = process.mainModule || {};
process.mainModule.loaded = false;
require.main = process.mainModule;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Qcm9jZXNzQ29udGFpbmVyRm9yay50cyJdLCJuYW1lcyI6WyJQcm9jZXNzVXRpbHMiLCJpbmplY3RNb2R1bGVzIiwicHJvY2VzcyIsImVudiIsInNvdXJjZV9tYXBfc3VwcG9ydCIsInJlcXVpcmUiLCJpbnN0YWxsIiwidGl0bGUiLCJQUk9DRVNTX1RJVExFIiwicG1fZXhlY19wYXRoIiwiY29ubmVjdGVkIiwic2VuZCIsInZlcnNpb25zIiwibm9kZSIsImlzRVNNb2R1bGUiLCJ1cmwiLCJwYXRoVG9GaWxlVVJMIiwidG9TdHJpbmciLCJfbG9hZCIsIkVycm9yIiwibWFpbk1vZHVsZSIsImxvYWRlZCIsIm1haW4iXSwibWFwcGluZ3MiOiI7O0FBS0E7O0FBRUE7Ozs7Ozs7Ozs7QUFDQUEseUJBQWFDLGFBQWI7O0FBRUEsSUFBSSxPQUFPQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsa0JBQW5CLElBQTBDLFdBQTFDLElBQ0FGLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxrQkFBWixLQUFtQyxPQUR2QyxFQUNnRDtBQUM5Q0MsRUFBQUEsT0FBTyxDQUFDLG9CQUFELENBQVAsQ0FBOEJDLE9BQTlCO0FBQ0QsQyxDQUVEOzs7QUFDQUosT0FBTyxDQUFDSyxLQUFSLEdBQWdCTCxPQUFPLENBQUNDLEdBQVIsQ0FBWUssYUFBWixJQUE2QixVQUFVTixPQUFPLENBQUNDLEdBQVIsQ0FBWU0sWUFBbkU7QUFFQSxJQUFJUCxPQUFPLENBQUNRLFNBQVIsSUFDQVIsT0FBTyxDQUFDUyxJQURSLElBRUFULE9BQU8sQ0FBQ1UsUUFGUixJQUdBVixPQUFPLENBQUNVLFFBQVIsQ0FBaUJDLElBSHJCLEVBSUVYLE9BQU8sQ0FBQ1MsSUFBUixDQUFhO0FBQ1gsa0JBQWdCVCxPQUFPLENBQUNVLFFBQVIsQ0FBaUJDO0FBRHRCLENBQWIsRSxDQUlGOztBQUNBLElBQUlYLE9BQU8sQ0FBQ0MsR0FBUixDQUFZTSxZQUFoQixFQUE4QjtBQUM1QixNQUFJVCx5QkFBYWMsVUFBYixDQUF3QlosT0FBTyxDQUFDQyxHQUFSLENBQVlNLFlBQXBDLE1BQXNELElBQTFELEVBQWdFO0FBQzlELDhCQUFPTSxnQkFBSUMsYUFBSixDQUFrQmQsT0FBTyxDQUFDQyxHQUFSLENBQVlNLFlBQTlCLEVBQTRDUSxRQUE1QyxFQUFQO0FBQUE7QUFBQTtBQUNELEdBRkQsTUFJRVosT0FBTyxDQUFDLFFBQUQsQ0FBUCxDQUFrQmEsS0FBbEIsQ0FBd0JoQixPQUFPLENBQUNDLEdBQVIsQ0FBWU0sWUFBcEMsRUFBa0QsSUFBbEQsRUFBd0QsSUFBeEQ7QUFDSCxDQU5ELE1BUUUsTUFBTSxJQUFJVSxLQUFKLENBQVUsOEJBQVYsQ0FBTixDLENBRUY7QUFDQTs7O0FBQ0FqQixPQUFPLENBQUNrQixVQUFSLEdBQXFCbEIsT0FBTyxDQUFDa0IsVUFBUixJQUFzQixFQUEzQztBQUNBbEIsT0FBTyxDQUFDa0IsVUFBUixDQUFtQkMsTUFBbkIsR0FBNEIsS0FBNUI7QUFDQWhCLE9BQU8sQ0FBQ2lCLElBQVIsR0FBZXBCLE9BQU8sQ0FBQ2tCLFVBQXZCIiwic291cmNlc0NvbnRlbnQiOlsiICAvKipcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuICovXG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG4vLyBJbmplY3QgY3VzdG9tIG1vZHVsZXNcbmltcG9ydCBQcm9jZXNzVXRpbHMgZnJvbSAnLi9Qcm9jZXNzVXRpbHMnXG5Qcm9jZXNzVXRpbHMuaW5qZWN0TW9kdWxlcygpXG5cbmlmICh0eXBlb2YocHJvY2Vzcy5lbnYuc291cmNlX21hcF9zdXBwb3J0KSAhPSBcInVuZGVmaW5lZFwiICYmXG4gICAgcHJvY2Vzcy5lbnYuc291cmNlX21hcF9zdXBwb3J0ICE9PSBcImZhbHNlXCIpIHtcbiAgcmVxdWlyZSgnc291cmNlLW1hcC1zdXBwb3J0JykuaW5zdGFsbCgpO1xufVxuXG4vLyBSZW5hbWUgdGhlIHByb2Nlc3NcbnByb2Nlc3MudGl0bGUgPSBwcm9jZXNzLmVudi5QUk9DRVNTX1RJVExFIHx8ICdub2RlICcgKyBwcm9jZXNzLmVudi5wbV9leGVjX3BhdGg7XG5cbmlmIChwcm9jZXNzLmNvbm5lY3RlZCAmJlxuICAgIHByb2Nlc3Muc2VuZCAmJlxuICAgIHByb2Nlc3MudmVyc2lvbnMgJiZcbiAgICBwcm9jZXNzLnZlcnNpb25zLm5vZGUpXG4gIHByb2Nlc3Muc2VuZCh7XG4gICAgJ25vZGVfdmVyc2lvbic6IHByb2Nlc3MudmVyc2lvbnMubm9kZVxuICB9KTtcblxuLy8gUmVxdWlyZSB0aGUgcmVhbCBhcHBsaWNhdGlvblxuaWYgKHByb2Nlc3MuZW52LnBtX2V4ZWNfcGF0aCkge1xuICBpZiAoUHJvY2Vzc1V0aWxzLmlzRVNNb2R1bGUocHJvY2Vzcy5lbnYucG1fZXhlY19wYXRoKSA9PT0gdHJ1ZSkge1xuICAgIGltcG9ydCh1cmwucGF0aFRvRmlsZVVSTChwcm9jZXNzLmVudi5wbV9leGVjX3BhdGgpLnRvU3RyaW5nKCkpO1xuICB9XG4gIGVsc2VcbiAgICByZXF1aXJlKCdtb2R1bGUnKS5fbG9hZChwcm9jZXNzLmVudi5wbV9leGVjX3BhdGgsIG51bGwsIHRydWUpO1xufVxuZWxzZVxuICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBfbG9hZCgpIHRoZSBzY3JpcHQnKTtcblxuLy8gQ2hhbmdlIHNvbWUgdmFsdWVzIHRvIG1ha2Ugbm9kZSB0aGluayB0aGF0IHRoZSB1c2VyJ3MgYXBwbGljYXRpb25cbi8vIHdhcyBzdGFydGVkIGRpcmVjdGx5IHN1Y2ggYXMgYG5vZGUgYXBwLmpzYFxucHJvY2Vzcy5tYWluTW9kdWxlID0gcHJvY2Vzcy5tYWluTW9kdWxlIHx8IHt9IGFzIGFueTtcbnByb2Nlc3MubWFpbk1vZHVsZS5sb2FkZWQgPSBmYWxzZTtcbnJlcXVpcmUubWFpbiA9IHByb2Nlc3MubWFpbk1vZHVsZTtcbiJdfQ==