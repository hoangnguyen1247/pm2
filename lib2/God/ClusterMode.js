/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
'use strict';
/**
 * @file Cluster execution functions related
 * @author Alexandre Strzelewicz <as@unitech.io>
 * @project PM2
 */

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ClusterMode;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _cluster = _interopRequireDefault(require("cluster"));

var _Utility = _interopRequireDefault(require("../Utility.js"));

var _package = _interopRequireDefault(require("../../package.json"));

/**
 * Description
 * @method exports
 * @param {} God
 * @return
 */
function ClusterMode(God) {
  /**
   * For Node apps - Cluster mode
   * It will wrap the code and enable load-balancing mode
   * @method nodeApp
   * @param {} env_copy
   * @param {} cb
   * @return Literal
   */
  God.nodeApp = function nodeApp(env_copy, cb) {
    var clu = null;
    console.log("App [".concat(env_copy.name, ":").concat(env_copy.pm_id, "] starting in -cluster mode-"));

    if (env_copy.node_args && Array.isArray(env_copy.node_args)) {
      _cluster["default"].settings.execArgv = env_copy.node_args;
    }

    env_copy._pm2_version = _package["default"].version;

    try {
      // node.js cluster clients can not receive deep-level objects or arrays in the forked process, e.g.:
      // { "args": ["foo", "bar"], "env": { "foo1": "bar1" }} will be parsed to
      // { "args": "foo, bar", "env": "[object Object]"}
      // So we passing a stringified JSON here.
      clu = _cluster["default"].fork({
        pm2_env: JSON.stringify(env_copy),
        windowsHide: true
      });
    } catch (e) {
      God.logAndGenerateError(e);
      return cb(e);
    }

    clu.pm2_env = env_copy;
    /**
     * Broadcast message to God
     */

    clu.on('message', function cluMessage(msg) {
      /*********************************
       * If you edit this function
       * Do the same in ForkMode.js !
       *********************************/
      if (msg.data && msg.type) {
        return God.bus.emit(msg.type ? msg.type : 'process:msg', {
          at: _Utility["default"].getDate(),
          data: msg.data,
          process: {
            pm_id: clu.pm2_env.pm_id,
            name: clu.pm2_env.name,
            rev: clu.pm2_env.versioning && clu.pm2_env.versioning.revision ? clu.pm2_env.versioning.revision : null,
            namespace: clu.pm2_env.namespace
          }
        });
      } else {
        if ((0, _typeof2["default"])(msg) == 'object' && 'node_version' in msg) {
          clu.pm2_env.node_version = msg.node_version;
          return false;
        } else if ((0, _typeof2["default"])(msg) == 'object' && 'cron_restart' in msg) {
          return God.restartProcessId({
            id: clu.pm2_env.pm_id
          }, function () {
            console.log('Application %s has been restarted via CRON', clu.pm2_env.name);
          });
        }

        return God.bus.emit('process:msg', {
          at: _Utility["default"].getDate(),
          raw: msg,
          process: {
            pm_id: clu.pm2_env.pm_id,
            name: clu.pm2_env.name,
            namespace: clu.pm2_env.namespace
          }
        });
      }
    });
    return cb(null, clu);
  };
}

;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Hb2QvQ2x1c3Rlck1vZGUudHMiXSwibmFtZXMiOlsiQ2x1c3Rlck1vZGUiLCJHb2QiLCJub2RlQXBwIiwiZW52X2NvcHkiLCJjYiIsImNsdSIsImNvbnNvbGUiLCJsb2ciLCJuYW1lIiwicG1faWQiLCJub2RlX2FyZ3MiLCJBcnJheSIsImlzQXJyYXkiLCJjbHVzdGVyIiwic2V0dGluZ3MiLCJleGVjQXJndiIsIl9wbTJfdmVyc2lvbiIsInBrZyIsInZlcnNpb24iLCJmb3JrIiwicG0yX2VudiIsIkpTT04iLCJzdHJpbmdpZnkiLCJ3aW5kb3dzSGlkZSIsImUiLCJsb2dBbmRHZW5lcmF0ZUVycm9yIiwib24iLCJjbHVNZXNzYWdlIiwibXNnIiwiZGF0YSIsInR5cGUiLCJidXMiLCJlbWl0IiwiYXQiLCJVdGlsaXR5IiwiZ2V0RGF0ZSIsInByb2Nlc3MiLCJyZXYiLCJ2ZXJzaW9uaW5nIiwicmV2aXNpb24iLCJuYW1lc3BhY2UiLCJub2RlX3ZlcnNpb24iLCJyZXN0YXJ0UHJvY2Vzc0lkIiwiaWQiLCJyYXciXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQUtBO0FBRUE7Ozs7Ozs7Ozs7Ozs7OztBQUtBOztBQUNBOztBQUNBOztBQUVBOzs7Ozs7QUFNZSxTQUFTQSxXQUFULENBQXFCQyxHQUFyQixFQUEwQjtBQUV2Qzs7Ozs7Ozs7QUFRQUEsRUFBQUEsR0FBRyxDQUFDQyxPQUFKLEdBQWMsU0FBU0EsT0FBVCxDQUFpQkMsUUFBakIsRUFBMkJDLEVBQTNCLEVBQThCO0FBQzFDLFFBQUlDLEdBQUcsR0FBRyxJQUFWO0FBRUFDLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixnQkFBb0JKLFFBQVEsQ0FBQ0ssSUFBN0IsY0FBcUNMLFFBQVEsQ0FBQ00sS0FBOUM7O0FBQ0EsUUFBSU4sUUFBUSxDQUFDTyxTQUFULElBQXNCQyxLQUFLLENBQUNDLE9BQU4sQ0FBY1QsUUFBUSxDQUFDTyxTQUF2QixDQUExQixFQUE2RDtBQUMzREcsMEJBQVFDLFFBQVIsQ0FB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RUFBSW5DLEdBQUcsQ0FBQ2UsT0FBSixDQUFZb0I7QUFIaEI7QUFIc0IsU0FBNUIsQ0FBUDtBQVNEO0FBQ0YsS0F4Q0Q7QUEwQ0EsV0FBT3BDLEVBQUUsQ0FBQyxJQUFELEVBQU9DLEdBQVAsQ0FBVDtBQUNELEdBckVEO0FBc0VEOztBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgbGljZW5zZSB0aGF0XG4gKiBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBmaWxlIENsdXN0ZXIgZXhlY3V0aW9uIGZ1bmN0aW9ucyByZWxhdGVkXG4gKiBAYXV0aG9yIEFsZXhhbmRyZSBTdHJ6ZWxld2ljeiA8YXNAdW5pdGVjaC5pbz5cbiAqIEBwcm9qZWN0IFBNMlxuICovXG5pbXBvcnQgY2x1c3RlciAgICAgICBmcm9tICdjbHVzdGVyJztcbmltcG9ydCBVdGlsaXR5ICAgICAgIGZyb20gJy4uL1V0aWxpdHkuanMnO1xuaW1wb3J0IHBrZyAgICAgICAgICAgZnJvbSAnLi4vLi4vcGFja2FnZS5qc29uJztcblxuLyoqXG4gKiBEZXNjcmlwdGlvblxuICogQG1ldGhvZCBleHBvcnRzXG4gKiBAcGFyYW0ge30gR29kXG4gKiBAcmV0dXJuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIENsdXN0ZXJNb2RlKEdvZCkge1xuXG4gIC8qKlxuICAgKiBGb3IgTm9kZSBhcHBzIC0gQ2x1c3RlciBtb2RlXG4gICAqIEl0IHdpbGwgd3JhcCB0aGUgY29kZSBhbmQgZW5hYmxlIGxvYWQtYmFsYW5jaW5nIG1vZGVcbiAgICogQG1ldGhvZCBub2RlQXBwXG4gICAqIEBwYXJhbSB7fSBlbnZfY29weVxuICAgKiBAcGFyYW0ge30gY2JcbiAgICogQHJldHVybiBMaXRlcmFsXG4gICAqL1xuICBHb2Qubm9kZUFwcCA9IGZ1bmN0aW9uIG5vZGVBcHAoZW52X2NvcHksIGNiKXtcbiAgICB2YXIgY2x1ID0gbnVsbDtcblxuICAgIGNvbnNvbGUubG9nKGBBcHAgWyR7ZW52X2NvcHkubmFtZX06JHtlbnZfY29weS5wbV9pZH1dIHN0YXJ0aW5nIGluIC1jbHVzdGVyIG1vZGUtYClcbiAgICBpZiAoZW52X2NvcHkubm9kZV9hcmdzICYmIEFycmF5LmlzQXJyYXkoZW52X2NvcHkubm9kZV9hcmdzKSkge1xuICAgICAgY2x1c3Rlci5zZXR0aW5ncy5leGVjQXJndiA9IGVudl9jb3B5Lm5vZGVfYXJncztcbiAgICB9XG5cbiAgICBlbnZfY29weS5fcG0yX3ZlcnNpb24gPSBwa2cudmVyc2lvbjtcblxuICAgIHRyeSB7XG4gICAgICAvLyBub2RlLmpzIGNsdXN0ZXIgY2xpZW50cyBjYW4gbm90IHJlY2VpdmUgZGVlcC1sZXZlbCBvYmplY3RzIG9yIGFycmF5cyBpbiB0aGUgZm9ya2VkIHByb2Nlc3MsIGUuZy46XG4gICAgICAvLyB7IFwiYXJnc1wiOiBbXCJmb29cIiwgXCJiYXJcIl0sIFwiZW52XCI6IHsgXCJmb28xXCI6IFwiYmFyMVwiIH19IHdpbGwgYmUgcGFyc2VkIHRvXG4gICAgICAvLyB7IFwiYXJnc1wiOiBcImZvbywgYmFyXCIsIFwiZW52XCI6IFwiW29iamVjdCBPYmplY3RdXCJ9XG4gICAgICAvLyBTbyB3ZSBwYXNzaW5nIGEgc3RyaW5naWZpZWQgSlNPTiBoZXJlLlxuICAgICAgY2x1ID0gY2x1c3Rlci5mb3JrKHtwbTJfZW52OiBKU09OLnN0cmluZ2lmeShlbnZfY29weSksIHdpbmRvd3NIaWRlOiB0cnVlfSk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihlKTtcbiAgICAgIHJldHVybiBjYihlKTtcbiAgICB9XG5cbiAgICBjbHUucG0yX2VudiA9IGVudl9jb3B5O1xuXG4gICAgLyoqXG4gICAgICogQnJvYWRjYXN0IG1lc3NhZ2UgdG8gR29kXG4gICAgICovXG4gICAgY2x1Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24gY2x1TWVzc2FnZShtc2cpIHtcbiAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAqIElmIHlvdSBlZGl0IHRoaXMgZnVuY3Rpb25cbiAgICAgICAqIERvIHRoZSBzYW1lIGluIEZvcmtNb2RlLmpzICFcbiAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4gICAgICBpZiAobXNnLmRhdGEgJiYgbXNnLnR5cGUpIHtcbiAgICAgICAgcmV0dXJuIEdvZC5idXMuZW1pdChtc2cudHlwZSA/IG1zZy50eXBlIDogJ3Byb2Nlc3M6bXNnJywge1xuICAgICAgICAgIGF0ICAgICAgOiBVdGlsaXR5LmdldERhdGUoKSxcbiAgICAgICAgICBkYXRhICAgIDogbXNnLmRhdGEsXG4gICAgICAgICAgcHJvY2VzcyA6ICB7XG4gICAgICAgICAgICBwbV9pZCAgICAgIDogY2x1LnBtMl9lbnYucG1faWQsXG4gICAgICAgICAgICBuYW1lICAgICAgIDogY2x1LnBtMl9lbnYubmFtZSxcbiAgICAgICAgICAgIHJldiAgICAgICAgOiAoY2x1LnBtMl9lbnYudmVyc2lvbmluZyAmJiBjbHUucG0yX2Vudi52ZXJzaW9uaW5nLnJldmlzaW9uKSA/IGNsdS5wbTJfZW52LnZlcnNpb25pbmcucmV2aXNpb24gOiBudWxsLFxuICAgICAgICAgICAgbmFtZXNwYWNlICA6IGNsdS5wbTJfZW52Lm5hbWVzcGFjZVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcblxuICAgICAgICBpZiAodHlwZW9mIG1zZyA9PSAnb2JqZWN0JyAmJiAnbm9kZV92ZXJzaW9uJyBpbiBtc2cpIHtcbiAgICAgICAgICBjbHUucG0yX2Vudi5ub2RlX3ZlcnNpb24gPSBtc2cubm9kZV92ZXJzaW9uO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbXNnID09ICdvYmplY3QnICYmICdjcm9uX3Jlc3RhcnQnIGluIG1zZykge1xuICAgICAgICAgIHJldHVybiBHb2QucmVzdGFydFByb2Nlc3NJZCh7XG4gICAgICAgICAgICBpZCA6IGNsdS5wbTJfZW52LnBtX2lkXG4gICAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQXBwbGljYXRpb24gJXMgaGFzIGJlZW4gcmVzdGFydGVkIHZpYSBDUk9OJywgY2x1LnBtMl9lbnYubmFtZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gR29kLmJ1cy5lbWl0KCdwcm9jZXNzOm1zZycsIHtcbiAgICAgICAgICBhdCAgICAgIDogVXRpbGl0eS5nZXREYXRlKCksXG4gICAgICAgICAgcmF3ICAgICA6IG1zZyxcbiAgICAgICAgICBwcm9jZXNzIDogIHtcbiAgICAgICAgICAgIHBtX2lkICAgICAgOiBjbHUucG0yX2Vudi5wbV9pZCxcbiAgICAgICAgICAgIG5hbWUgICAgICAgOiBjbHUucG0yX2Vudi5uYW1lLFxuICAgICAgICAgICAgbmFtZXNwYWNlICA6IGNsdS5wbTJfZW52Lm5hbWVzcGFjZVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY2IobnVsbCwgY2x1KTtcbiAgfTtcbn07XG4iXX0=