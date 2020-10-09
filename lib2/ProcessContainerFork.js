"use strict";

var _url = _interopRequireDefault(require("url"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// Inject custom modules
var ProcessUtils = require("./ProcessUtils");

ProcessUtils.injectModules();

if (typeof process.env.source_map_support != "undefined" && process.env.source_map_support !== "false") {
  require('source-map-support').install();
} // Rename the process


process.title = process.env.PROCESS_TITLE || 'node ' + process.env.pm_exec_path;
if (process.connected && process.send && process.versions && process.versions.node) process.send({
  'node_version': process.versions.node
}); // Require the real application

if (process.env.pm_exec_path) {
  if (ProcessUtils.isESModule(process.env.pm_exec_path) === true) {
    Promise.resolve("".concat(_url["default"].pathToFileURL(process.env.pm_exec_path).toString())).then(function (s) {
      return _interopRequireWildcard(require(s));
    });
  } else require('module')._load(process.env.pm_exec_path, null, true);
} else throw new Error('Could not _load() the script'); // Change some values to make node think that the user's application
// was started directly such as `node app.js`


process.mainModule = process.mainModule || {};
process.mainModule.loaded = false;
require.main = process.mainModule;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Qcm9jZXNzQ29udGFpbmVyRm9yay50cyJdLCJuYW1lcyI6WyJQcm9jZXNzVXRpbHMiLCJyZXF1aXJlIiwiaW5qZWN0TW9kdWxlcyIsInByb2Nlc3MiLCJlbnYiLCJzb3VyY2VfbWFwX3N1cHBvcnQiLCJpbnN0YWxsIiwidGl0bGUiLCJQUk9DRVNTX1RJVExFIiwicG1fZXhlY19wYXRoIiwiY29ubmVjdGVkIiwic2VuZCIsInZlcnNpb25zIiwibm9kZSIsImlzRVNNb2R1bGUiLCJ1cmwiLCJwYXRoVG9GaWxlVVJMIiwidG9TdHJpbmciLCJfbG9hZCIsIkVycm9yIiwibWFpbk1vZHVsZSIsImxvYWRlZCIsIm1haW4iXSwibWFwcGluZ3MiOiI7O0FBS0E7Ozs7Ozs7Ozs7QUFDQTtBQUNBLElBQUlBLFlBQVksR0FBR0MsT0FBTyxrQkFBMUI7O0FBQ0FELFlBQVksQ0FBQ0UsYUFBYjs7QUFFQSxJQUFJLE9BQU9DLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxrQkFBbkIsSUFBMEMsV0FBMUMsSUFDQUYsT0FBTyxDQUFDQyxHQUFSLENBQVlDLGtCQUFaLEtBQW1DLE9BRHZDLEVBQ2dEO0FBQzlDSixFQUFBQSxPQUFPLENBQUMsb0JBQUQsQ0FBUCxDQUE4QkssT0FBOUI7QUFDRCxDLENBRUQ7OztBQUNBSCxPQUFPLENBQUNJLEtBQVIsR0FBZ0JKLE9BQU8sQ0FBQ0MsR0FBUixDQUFZSSxhQUFaLElBQTZCLFVBQVVMLE9BQU8sQ0FBQ0MsR0FBUixDQUFZSyxZQUFuRTtBQUVBLElBQUlOLE9BQU8sQ0FBQ08sU0FBUixJQUNBUCxPQUFPLENBQUNRLElBRFIsSUFFQVIsT0FBTyxDQUFDUyxRQUZSLElBR0FULE9BQU8sQ0FBQ1MsUUFBUixDQUFpQkMsSUFIckIsRUFJRVYsT0FBTyxDQUFDUSxJQUFSLENBQWE7QUFDWCxrQkFBZ0JSLE9BQU8sQ0FBQ1MsUUFBUixDQUFpQkM7QUFEdEIsQ0FBYixFLENBSUY7O0FBQ0EsSUFBSVYsT0FBTyxDQUFDQyxHQUFSLENBQVlLLFlBQWhCLEVBQThCO0FBQzVCLE1BQUlULFlBQVksQ0FBQ2MsVUFBYixDQUF3QlgsT0FBTyxDQUFDQyxHQUFSLENBQVlLLFlBQXBDLE1BQXNELElBQTFELEVBQWdFO0FBQzlELDhCQUFPTSxnQkFBSUMsYUFBSixDQUFrQmIsT0FBTyxDQUFDQyxHQUFSLENBQVlLLFlBQTlCLEVBQTRDUSxRQUE1QyxFQUFQO0FBQUE7QUFBQTtBQUNELEdBRkQsTUFJRWhCLE9BQU8sQ0FBQyxRQUFELENBQVAsQ0FBa0JpQixLQUFsQixDQUF3QmYsT0FBTyxDQUFDQyxHQUFSLENBQVlLLFlBQXBDLEVBQWtELElBQWxELEVBQXdELElBQXhEO0FBQ0gsQ0FORCxNQVFFLE1BQU0sSUFBSVUsS0FBSixDQUFVLDhCQUFWLENBQU4sQyxDQUVGO0FBQ0E7OztBQUNBaEIsT0FBTyxDQUFDaUIsVUFBUixHQUFxQmpCLE9BQU8sQ0FBQ2lCLFVBQVIsSUFBc0IsRUFBM0M7QUFDQWpCLE9BQU8sQ0FBQ2lCLFVBQVIsQ0FBbUJDLE1BQW5CLEdBQTRCLEtBQTVCO0FBQ0FwQixPQUFPLENBQUNxQixJQUFSLEdBQWVuQixPQUFPLENBQUNpQixVQUF2QiIsInNvdXJjZXNDb250ZW50IjpbIiAgLyoqXHJcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIGxpY2Vuc2UgdGhhdFxyXG4gKiBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cclxuICovXHJcbmltcG9ydCB1cmwgZnJvbSAndXJsJztcclxuLy8gSW5qZWN0IGN1c3RvbSBtb2R1bGVzXHJcbnZhciBQcm9jZXNzVXRpbHMgPSByZXF1aXJlKCcuL1Byb2Nlc3NVdGlscycpXHJcblByb2Nlc3NVdGlscy5pbmplY3RNb2R1bGVzKClcclxuXHJcbmlmICh0eXBlb2YocHJvY2Vzcy5lbnYuc291cmNlX21hcF9zdXBwb3J0KSAhPSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICBwcm9jZXNzLmVudi5zb3VyY2VfbWFwX3N1cHBvcnQgIT09IFwiZmFsc2VcIikge1xyXG4gIHJlcXVpcmUoJ3NvdXJjZS1tYXAtc3VwcG9ydCcpLmluc3RhbGwoKTtcclxufVxyXG5cclxuLy8gUmVuYW1lIHRoZSBwcm9jZXNzXHJcbnByb2Nlc3MudGl0bGUgPSBwcm9jZXNzLmVudi5QUk9DRVNTX1RJVExFIHx8ICdub2RlICcgKyBwcm9jZXNzLmVudi5wbV9leGVjX3BhdGg7XHJcblxyXG5pZiAocHJvY2Vzcy5jb25uZWN0ZWQgJiZcclxuICAgIHByb2Nlc3Muc2VuZCAmJlxyXG4gICAgcHJvY2Vzcy52ZXJzaW9ucyAmJlxyXG4gICAgcHJvY2Vzcy52ZXJzaW9ucy5ub2RlKVxyXG4gIHByb2Nlc3Muc2VuZCh7XHJcbiAgICAnbm9kZV92ZXJzaW9uJzogcHJvY2Vzcy52ZXJzaW9ucy5ub2RlXHJcbiAgfSk7XHJcblxyXG4vLyBSZXF1aXJlIHRoZSByZWFsIGFwcGxpY2F0aW9uXHJcbmlmIChwcm9jZXNzLmVudi5wbV9leGVjX3BhdGgpIHtcclxuICBpZiAoUHJvY2Vzc1V0aWxzLmlzRVNNb2R1bGUocHJvY2Vzcy5lbnYucG1fZXhlY19wYXRoKSA9PT0gdHJ1ZSkge1xyXG4gICAgaW1wb3J0KHVybC5wYXRoVG9GaWxlVVJMKHByb2Nlc3MuZW52LnBtX2V4ZWNfcGF0aCkudG9TdHJpbmcoKSk7XHJcbiAgfVxyXG4gIGVsc2VcclxuICAgIHJlcXVpcmUoJ21vZHVsZScpLl9sb2FkKHByb2Nlc3MuZW52LnBtX2V4ZWNfcGF0aCwgbnVsbCwgdHJ1ZSk7XHJcbn1cclxuZWxzZVxyXG4gIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IF9sb2FkKCkgdGhlIHNjcmlwdCcpO1xyXG5cclxuLy8gQ2hhbmdlIHNvbWUgdmFsdWVzIHRvIG1ha2Ugbm9kZSB0aGluayB0aGF0IHRoZSB1c2VyJ3MgYXBwbGljYXRpb25cclxuLy8gd2FzIHN0YXJ0ZWQgZGlyZWN0bHkgc3VjaCBhcyBgbm9kZSBhcHAuanNgXHJcbnByb2Nlc3MubWFpbk1vZHVsZSA9IHByb2Nlc3MubWFpbk1vZHVsZSB8fCB7fSBhcyBhbnk7XHJcbnByb2Nlc3MubWFpbk1vZHVsZS5sb2FkZWQgPSBmYWxzZTtcclxucmVxdWlyZS5tYWluID0gcHJvY2Vzcy5tYWluTW9kdWxlO1xyXG4iXX0=