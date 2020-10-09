"use strict";

var _ProcessUtils = _interopRequireDefault(require("./ProcessUtils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
* Copyright 2013 the PM2 project authors. All rights reserved.
* Use of this source code is governed by a license that
* can be found in the LICENSE file.
*/
// Inject custom modules
_ProcessUtils["default"].injectModules();

if (typeof process.env.source_map_support != "undefined" && process.env.source_map_support !== "false") {
  require('source-map-support').install();
} // Rename the process


process.title = process.env.PROCESS_TITLE || 'node ' + process.env.pm_exec_path;
if (process.connected && process.send && process.versions && process.versions.node) process.send({
  'node_version': process.versions.node
}); // Require the real application

if (process.env.pm_exec_path) {
  require('module')._load(process.env.pm_exec_path, null, true);
} else throw new Error('Could not _load() the script'); // Change some values to make node think that the user's application
// was started directly such as `node app.js`


process.mainModule = process.mainModule || {};
process.mainModule.loaded = false;
require.main = process.mainModule;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Qcm9jZXNzQ29udGFpbmVyRm9ya0xlZ2FjeS50cyJdLCJuYW1lcyI6WyJQcm9jZXNzVXRpbHMiLCJpbmplY3RNb2R1bGVzIiwicHJvY2VzcyIsImVudiIsInNvdXJjZV9tYXBfc3VwcG9ydCIsInJlcXVpcmUiLCJpbnN0YWxsIiwidGl0bGUiLCJQUk9DRVNTX1RJVExFIiwicG1fZXhlY19wYXRoIiwiY29ubmVjdGVkIiwic2VuZCIsInZlcnNpb25zIiwibm9kZSIsIl9sb2FkIiwiRXJyb3IiLCJtYWluTW9kdWxlIiwibG9hZGVkIiwibWFpbiJdLCJtYXBwaW5ncyI6Ijs7QUFNQTs7OztBQU5FOzs7OztBQUtGO0FBRUFBLHlCQUFhQyxhQUFiOztBQUVBLElBQUksT0FBT0MsT0FBTyxDQUFDQyxHQUFSLENBQVlDLGtCQUFuQixJQUEwQyxXQUExQyxJQUNBRixPQUFPLENBQUNDLEdBQVIsQ0FBWUMsa0JBQVosS0FBbUMsT0FEdkMsRUFDZ0Q7QUFDOUNDLEVBQUFBLE9BQU8sQ0FBQyxvQkFBRCxDQUFQLENBQThCQyxPQUE5QjtBQUNELEMsQ0FFRDs7O0FBQ0FKLE9BQU8sQ0FBQ0ssS0FBUixHQUFnQkwsT0FBTyxDQUFDQyxHQUFSLENBQVlLLGFBQVosSUFBNkIsVUFBVU4sT0FBTyxDQUFDQyxHQUFSLENBQVlNLFlBQW5FO0FBRUEsSUFBSVAsT0FBTyxDQUFDUSxTQUFSLElBQ0FSLE9BQU8sQ0FBQ1MsSUFEUixJQUVBVCxPQUFPLENBQUNVLFFBRlIsSUFHQVYsT0FBTyxDQUFDVSxRQUFSLENBQWlCQyxJQUhyQixFQUlFWCxPQUFPLENBQUNTLElBQVIsQ0FBYTtBQUNYLGtCQUFnQlQsT0FBTyxDQUFDVSxRQUFSLENBQWlCQztBQUR0QixDQUFiLEUsQ0FJRjs7QUFDQSxJQUFJWCxPQUFPLENBQUNDLEdBQVIsQ0FBWU0sWUFBaEIsRUFBOEI7QUFDNUJKLEVBQUFBLE9BQU8sQ0FBQyxRQUFELENBQVAsQ0FBa0JTLEtBQWxCLENBQXdCWixPQUFPLENBQUNDLEdBQVIsQ0FBWU0sWUFBcEMsRUFBa0QsSUFBbEQsRUFBd0QsSUFBeEQ7QUFDRCxDQUZELE1BSUUsTUFBTSxJQUFJTSxLQUFKLENBQVUsOEJBQVYsQ0FBTixDLENBRUY7QUFDQTs7O0FBQ0FiLE9BQU8sQ0FBQ2MsVUFBUixHQUFxQmQsT0FBTyxDQUFDYyxVQUFSLElBQXNCLEVBQTNDO0FBQ0FkLE9BQU8sQ0FBQ2MsVUFBUixDQUFtQkMsTUFBbkIsR0FBNEIsS0FBNUI7QUFDQVosT0FBTyxDQUFDYSxJQUFSLEdBQWVoQixPQUFPLENBQUNjLFVBQXZCIiwic291cmNlc0NvbnRlbnQiOlsiICAvKipcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuICovXG4vLyBJbmplY3QgY3VzdG9tIG1vZHVsZXNcbmltcG9ydCBQcm9jZXNzVXRpbHMgZnJvbSAnLi9Qcm9jZXNzVXRpbHMnO1xuUHJvY2Vzc1V0aWxzLmluamVjdE1vZHVsZXMoKVxuXG5pZiAodHlwZW9mKHByb2Nlc3MuZW52LnNvdXJjZV9tYXBfc3VwcG9ydCkgIT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgIHByb2Nlc3MuZW52LnNvdXJjZV9tYXBfc3VwcG9ydCAhPT0gXCJmYWxzZVwiKSB7XG4gIHJlcXVpcmUoJ3NvdXJjZS1tYXAtc3VwcG9ydCcpLmluc3RhbGwoKTtcbn1cblxuLy8gUmVuYW1lIHRoZSBwcm9jZXNzXG5wcm9jZXNzLnRpdGxlID0gcHJvY2Vzcy5lbnYuUFJPQ0VTU19USVRMRSB8fCAnbm9kZSAnICsgcHJvY2Vzcy5lbnYucG1fZXhlY19wYXRoO1xuXG5pZiAocHJvY2Vzcy5jb25uZWN0ZWQgJiZcbiAgICBwcm9jZXNzLnNlbmQgJiZcbiAgICBwcm9jZXNzLnZlcnNpb25zICYmXG4gICAgcHJvY2Vzcy52ZXJzaW9ucy5ub2RlKVxuICBwcm9jZXNzLnNlbmQoe1xuICAgICdub2RlX3ZlcnNpb24nOiBwcm9jZXNzLnZlcnNpb25zLm5vZGVcbiAgfSk7XG5cbi8vIFJlcXVpcmUgdGhlIHJlYWwgYXBwbGljYXRpb25cbmlmIChwcm9jZXNzLmVudi5wbV9leGVjX3BhdGgpIHtcbiAgcmVxdWlyZSgnbW9kdWxlJykuX2xvYWQocHJvY2Vzcy5lbnYucG1fZXhlY19wYXRoLCBudWxsLCB0cnVlKTtcbn1cbmVsc2VcbiAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgX2xvYWQoKSB0aGUgc2NyaXB0Jyk7XG5cbi8vIENoYW5nZSBzb21lIHZhbHVlcyB0byBtYWtlIG5vZGUgdGhpbmsgdGhhdCB0aGUgdXNlcidzIGFwcGxpY2F0aW9uXG4vLyB3YXMgc3RhcnRlZCBkaXJlY3RseSBzdWNoIGFzIGBub2RlIGFwcC5qc2BcbnByb2Nlc3MubWFpbk1vZHVsZSA9IHByb2Nlc3MubWFpbk1vZHVsZSB8fCB7fSBhcyBhbnk7XG5wcm9jZXNzLm1haW5Nb2R1bGUubG9hZGVkID0gZmFsc2U7XG5yZXF1aXJlLm1haW4gPSBwcm9jZXNzLm1haW5Nb2R1bGU7XG4iXX0=