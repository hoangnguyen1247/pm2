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

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ClusterMode;

var _cluster = _interopRequireDefault(require("cluster"));

var _Utility = _interopRequireDefault(require("../Utility.js"));

var _package = _interopRequireDefault(require("../../package.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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
        if (_typeof(msg) == 'object' && 'node_version' in msg) {
          clu.pm2_env.node_version = msg.node_version;
          return false;
        } else if (_typeof(msg) == 'object' && 'cron_restart' in msg) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Hb2QvQ2x1c3Rlck1vZGUudHMiXSwibmFtZXMiOlsiQ2x1c3Rlck1vZGUiLCJHb2QiLCJub2RlQXBwIiwiZW52X2NvcHkiLCJjYiIsImNsdSIsImNvbnNvbGUiLCJsb2ciLCJuYW1lIiwicG1faWQiLCJub2RlX2FyZ3MiLCJBcnJheSIsImlzQXJyYXkiLCJjbHVzdGVyIiwic2V0dGluZ3MiLCJleGVjQXJndiIsIl9wbTJfdmVyc2lvbiIsInBrZyIsInZlcnNpb24iLCJmb3JrIiwicG0yX2VudiIsIkpTT04iLCJzdHJpbmdpZnkiLCJ3aW5kb3dzSGlkZSIsImUiLCJsb2dBbmRHZW5lcmF0ZUVycm9yIiwib24iLCJjbHVNZXNzYWdlIiwibXNnIiwiZGF0YSIsInR5cGUiLCJidXMiLCJlbWl0IiwiYXQiLCJVdGlsaXR5IiwiZ2V0RGF0ZSIsInByb2Nlc3MiLCJyZXYiLCJ2ZXJzaW9uaW5nIiwicmV2aXNpb24iLCJuYW1lc3BhY2UiLCJub2RlX3ZlcnNpb24iLCJyZXN0YXJ0UHJvY2Vzc0lkIiwiaWQiLCJyYXciXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQUtBO0FBRUE7Ozs7Ozs7Ozs7O0FBS0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVBOzs7Ozs7QUFNZSxTQUFTQSxXQUFULENBQXFCQyxHQUFyQixFQUEwQjtBQUV2Qzs7Ozs7Ozs7QUFRQUEsRUFBQUEsR0FBRyxDQUFDQyxPQUFKLEdBQWMsU0FBU0EsT0FBVCxDQUFpQkMsUUFBakIsRUFBMkJDLEVBQTNCLEVBQThCO0FBQzFDLFFBQUlDLEdBQUcsR0FBRyxJQUFWO0FBRUFDLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixnQkFBb0JKLFFBQVEsQ0FBQ0ssSUFBN0IsY0FBcUNMLFFBQVEsQ0FBQ00sS0FBOUM7O0FBQ0EsUUFBSU4sUUFBUSxDQUFDTyxTQUFULElBQXNCQyxLQUFLLENBQUNDLE9BQU4sQ0FBY1QsUUFBUSxDQUFDTyxTQUF2QixDQUExQixFQUE2RDtBQUMzREcsMEJBQVFDLFFBQVIsQ0FB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QUluQyxHQUFHLENBQUNlLE9BQUosQ0FBWW9CO0FBSGhCO0FBSHNCLFNBQTVCLENBQVA7QUFTRDtBQUNGLEtBeENEO0FBMENBLFdBQU9wQyxFQUFFLENBQUMsSUFBRCxFQUFPQyxHQUFQLENBQVQ7QUFDRCxHQXJFRDtBQXNFRDs7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIGxpY2Vuc2UgdGhhdFxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAZmlsZSBDbHVzdGVyIGV4ZWN1dGlvbiBmdW5jdGlvbnMgcmVsYXRlZFxuICogQGF1dGhvciBBbGV4YW5kcmUgU3RyemVsZXdpY3ogPGFzQHVuaXRlY2guaW8+XG4gKiBAcHJvamVjdCBQTTJcbiAqL1xuaW1wb3J0IGNsdXN0ZXIgICAgICAgZnJvbSAnY2x1c3Rlcic7XG5pbXBvcnQgVXRpbGl0eSAgICAgICBmcm9tICcuLi9VdGlsaXR5LmpzJztcbmltcG9ydCBwa2cgICAgICAgICAgIGZyb20gJy4uLy4uL3BhY2thZ2UuanNvbic7XG5cbi8qKlxuICogRGVzY3JpcHRpb25cbiAqIEBtZXRob2QgZXhwb3J0c1xuICogQHBhcmFtIHt9IEdvZFxuICogQHJldHVyblxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBDbHVzdGVyTW9kZShHb2QpIHtcblxuICAvKipcbiAgICogRm9yIE5vZGUgYXBwcyAtIENsdXN0ZXIgbW9kZVxuICAgKiBJdCB3aWxsIHdyYXAgdGhlIGNvZGUgYW5kIGVuYWJsZSBsb2FkLWJhbGFuY2luZyBtb2RlXG4gICAqIEBtZXRob2Qgbm9kZUFwcFxuICAgKiBAcGFyYW0ge30gZW52X2NvcHlcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm4gTGl0ZXJhbFxuICAgKi9cbiAgR29kLm5vZGVBcHAgPSBmdW5jdGlvbiBub2RlQXBwKGVudl9jb3B5LCBjYil7XG4gICAgdmFyIGNsdSA9IG51bGw7XG5cbiAgICBjb25zb2xlLmxvZyhgQXBwIFske2Vudl9jb3B5Lm5hbWV9OiR7ZW52X2NvcHkucG1faWR9XSBzdGFydGluZyBpbiAtY2x1c3RlciBtb2RlLWApXG4gICAgaWYgKGVudl9jb3B5Lm5vZGVfYXJncyAmJiBBcnJheS5pc0FycmF5KGVudl9jb3B5Lm5vZGVfYXJncykpIHtcbiAgICAgIGNsdXN0ZXIuc2V0dGluZ3MuZXhlY0FyZ3YgPSBlbnZfY29weS5ub2RlX2FyZ3M7XG4gICAgfVxuXG4gICAgZW52X2NvcHkuX3BtMl92ZXJzaW9uID0gcGtnLnZlcnNpb247XG5cbiAgICB0cnkge1xuICAgICAgLy8gbm9kZS5qcyBjbHVzdGVyIGNsaWVudHMgY2FuIG5vdCByZWNlaXZlIGRlZXAtbGV2ZWwgb2JqZWN0cyBvciBhcnJheXMgaW4gdGhlIGZvcmtlZCBwcm9jZXNzLCBlLmcuOlxuICAgICAgLy8geyBcImFyZ3NcIjogW1wiZm9vXCIsIFwiYmFyXCJdLCBcImVudlwiOiB7IFwiZm9vMVwiOiBcImJhcjFcIiB9fSB3aWxsIGJlIHBhcnNlZCB0b1xuICAgICAgLy8geyBcImFyZ3NcIjogXCJmb28sIGJhclwiLCBcImVudlwiOiBcIltvYmplY3QgT2JqZWN0XVwifVxuICAgICAgLy8gU28gd2UgcGFzc2luZyBhIHN0cmluZ2lmaWVkIEpTT04gaGVyZS5cbiAgICAgIGNsdSA9IGNsdXN0ZXIuZm9yayh7cG0yX2VudjogSlNPTi5zdHJpbmdpZnkoZW52X2NvcHkpLCB3aW5kb3dzSGlkZTogdHJ1ZX0pO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgR29kLmxvZ0FuZEdlbmVyYXRlRXJyb3IoZSk7XG4gICAgICByZXR1cm4gY2IoZSk7XG4gICAgfVxuXG4gICAgY2x1LnBtMl9lbnYgPSBlbnZfY29weTtcblxuICAgIC8qKlxuICAgICAqIEJyb2FkY2FzdCBtZXNzYWdlIHRvIEdvZFxuICAgICAqL1xuICAgIGNsdS5vbignbWVzc2FnZScsIGZ1bmN0aW9uIGNsdU1lc3NhZ2UobXNnKSB7XG4gICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgKiBJZiB5b3UgZWRpdCB0aGlzIGZ1bmN0aW9uXG4gICAgICAgKiBEbyB0aGUgc2FtZSBpbiBGb3JrTW9kZS5qcyAhXG4gICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuICAgICAgaWYgKG1zZy5kYXRhICYmIG1zZy50eXBlKSB7XG4gICAgICAgIHJldHVybiBHb2QuYnVzLmVtaXQobXNnLnR5cGUgPyBtc2cudHlwZSA6ICdwcm9jZXNzOm1zZycsIHtcbiAgICAgICAgICBhdCAgICAgIDogVXRpbGl0eS5nZXREYXRlKCksXG4gICAgICAgICAgZGF0YSAgICA6IG1zZy5kYXRhLFxuICAgICAgICAgIHByb2Nlc3MgOiAge1xuICAgICAgICAgICAgcG1faWQgICAgICA6IGNsdS5wbTJfZW52LnBtX2lkLFxuICAgICAgICAgICAgbmFtZSAgICAgICA6IGNsdS5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICByZXYgICAgICAgIDogKGNsdS5wbTJfZW52LnZlcnNpb25pbmcgJiYgY2x1LnBtMl9lbnYudmVyc2lvbmluZy5yZXZpc2lvbikgPyBjbHUucG0yX2Vudi52ZXJzaW9uaW5nLnJldmlzaW9uIDogbnVsbCxcbiAgICAgICAgICAgIG5hbWVzcGFjZSAgOiBjbHUucG0yX2Vudi5uYW1lc3BhY2VcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBtc2cgPT0gJ29iamVjdCcgJiYgJ25vZGVfdmVyc2lvbicgaW4gbXNnKSB7XG4gICAgICAgICAgY2x1LnBtMl9lbnYubm9kZV92ZXJzaW9uID0gbXNnLm5vZGVfdmVyc2lvbjtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG1zZyA9PSAnb2JqZWN0JyAmJiAnY3Jvbl9yZXN0YXJ0JyBpbiBtc2cpIHtcbiAgICAgICAgICByZXR1cm4gR29kLnJlc3RhcnRQcm9jZXNzSWQoe1xuICAgICAgICAgICAgaWQgOiBjbHUucG0yX2Vudi5wbV9pZFxuICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FwcGxpY2F0aW9uICVzIGhhcyBiZWVuIHJlc3RhcnRlZCB2aWEgQ1JPTicsIGNsdS5wbTJfZW52Lm5hbWUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEdvZC5idXMuZW1pdCgncHJvY2Vzczptc2cnLCB7XG4gICAgICAgICAgYXQgICAgICA6IFV0aWxpdHkuZ2V0RGF0ZSgpLFxuICAgICAgICAgIHJhdyAgICAgOiBtc2csXG4gICAgICAgICAgcHJvY2VzcyA6ICB7XG4gICAgICAgICAgICBwbV9pZCAgICAgIDogY2x1LnBtMl9lbnYucG1faWQsXG4gICAgICAgICAgICBuYW1lICAgICAgIDogY2x1LnBtMl9lbnYubmFtZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZSAgOiBjbHUucG0yX2Vudi5uYW1lc3BhY2VcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNiKG51bGwsIGNsdSk7XG4gIH07XG59O1xuIl19