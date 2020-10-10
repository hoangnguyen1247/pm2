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

var _Utility = _interopRequireDefault(require("../Utility"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Hb2QvQ2x1c3Rlck1vZGUudHMiXSwibmFtZXMiOlsiQ2x1c3Rlck1vZGUiLCJHb2QiLCJub2RlQXBwIiwiZW52X2NvcHkiLCJjYiIsImNsdSIsImNvbnNvbGUiLCJsb2ciLCJuYW1lIiwicG1faWQiLCJub2RlX2FyZ3MiLCJBcnJheSIsImlzQXJyYXkiLCJjbHVzdGVyIiwic2V0dGluZ3MiLCJleGVjQXJndiIsIl9wbTJfdmVyc2lvbiIsInBrZyIsInZlcnNpb24iLCJmb3JrIiwicG0yX2VudiIsIkpTT04iLCJzdHJpbmdpZnkiLCJ3aW5kb3dzSGlkZSIsImUiLCJsb2dBbmRHZW5lcmF0ZUVycm9yIiwib24iLCJjbHVNZXNzYWdlIiwibXNnIiwiZGF0YSIsInR5cGUiLCJidXMiLCJlbWl0IiwiYXQiLCJVdGlsaXR5IiwiZ2V0RGF0ZSIsInByb2Nlc3MiLCJyZXYiLCJ2ZXJzaW9uaW5nIiwicmV2aXNpb24iLCJuYW1lc3BhY2UiLCJub2RlX3ZlcnNpb24iLCJyZXN0YXJ0UHJvY2Vzc0lkIiwiaWQiLCJyYXciXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQUtBO0FBRUE7Ozs7Ozs7Ozs7Ozs7OztBQUtBOztBQUNBOztBQUNBOztBQUVBOzs7Ozs7QUFNZSxTQUFTQSxXQUFULENBQXFCQyxHQUFyQixFQUEwQjtBQUV2Qzs7Ozs7Ozs7QUFRQUEsRUFBQUEsR0FBRyxDQUFDQyxPQUFKLEdBQWMsU0FBU0EsT0FBVCxDQUFpQkMsUUFBakIsRUFBMkJDLEVBQTNCLEVBQStCO0FBQzNDLFFBQUlDLEdBQUcsR0FBRyxJQUFWO0FBRUFDLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixnQkFBb0JKLFFBQVEsQ0FBQ0ssSUFBN0IsY0FBcUNMLFFBQVEsQ0FBQ00sS0FBOUM7O0FBQ0EsUUFBSU4sUUFBUSxDQUFDTyxTQUFULElBQXNCQyxLQUFLLENBQUNDLE9BQU4sQ0FBY1QsUUFBUSxDQUFDTyxTQUF2QixDQUExQixFQUE2RDtBQUMzREcsMEJBQVFDLFFBQVIsQ0FB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bkMsR0FBRyxDQUFDZSxPQUFKLENBQVlvQjtBQUhoQjtBQUh3QixTQUE1QixDQUFQO0FBU0Q7QUFDRixLQXhDRDtBQTBDQSxXQUFPcEMsRUFBRSxDQUFDLElBQUQsRUFBT0MsR0FBUCxDQUFUO0FBQ0QsR0FyRUQ7QUFzRUQ7O0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQGZpbGUgQ2x1c3RlciBleGVjdXRpb24gZnVuY3Rpb25zIHJlbGF0ZWRcbiAqIEBhdXRob3IgQWxleGFuZHJlIFN0cnplbGV3aWN6IDxhc0B1bml0ZWNoLmlvPlxuICogQHByb2plY3QgUE0yXG4gKi9cbmltcG9ydCBjbHVzdGVyIGZyb20gJ2NsdXN0ZXInO1xuaW1wb3J0IFV0aWxpdHkgZnJvbSAnLi4vVXRpbGl0eSc7XG5pbXBvcnQgcGtnIGZyb20gJy4uLy4uL3BhY2thZ2UuanNvbic7XG5cbi8qKlxuICogRGVzY3JpcHRpb25cbiAqIEBtZXRob2QgZXhwb3J0c1xuICogQHBhcmFtIHt9IEdvZFxuICogQHJldHVyblxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBDbHVzdGVyTW9kZShHb2QpIHtcblxuICAvKipcbiAgICogRm9yIE5vZGUgYXBwcyAtIENsdXN0ZXIgbW9kZVxuICAgKiBJdCB3aWxsIHdyYXAgdGhlIGNvZGUgYW5kIGVuYWJsZSBsb2FkLWJhbGFuY2luZyBtb2RlXG4gICAqIEBtZXRob2Qgbm9kZUFwcFxuICAgKiBAcGFyYW0ge30gZW52X2NvcHlcbiAgICogQHBhcmFtIHt9IGNiXG4gICAqIEByZXR1cm4gTGl0ZXJhbFxuICAgKi9cbiAgR29kLm5vZGVBcHAgPSBmdW5jdGlvbiBub2RlQXBwKGVudl9jb3B5LCBjYikge1xuICAgIHZhciBjbHUgPSBudWxsO1xuXG4gICAgY29uc29sZS5sb2coYEFwcCBbJHtlbnZfY29weS5uYW1lfToke2Vudl9jb3B5LnBtX2lkfV0gc3RhcnRpbmcgaW4gLWNsdXN0ZXIgbW9kZS1gKVxuICAgIGlmIChlbnZfY29weS5ub2RlX2FyZ3MgJiYgQXJyYXkuaXNBcnJheShlbnZfY29weS5ub2RlX2FyZ3MpKSB7XG4gICAgICBjbHVzdGVyLnNldHRpbmdzLmV4ZWNBcmd2ID0gZW52X2NvcHkubm9kZV9hcmdzO1xuICAgIH1cblxuICAgIGVudl9jb3B5Ll9wbTJfdmVyc2lvbiA9IHBrZy52ZXJzaW9uO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIG5vZGUuanMgY2x1c3RlciBjbGllbnRzIGNhbiBub3QgcmVjZWl2ZSBkZWVwLWxldmVsIG9iamVjdHMgb3IgYXJyYXlzIGluIHRoZSBmb3JrZWQgcHJvY2VzcywgZS5nLjpcbiAgICAgIC8vIHsgXCJhcmdzXCI6IFtcImZvb1wiLCBcImJhclwiXSwgXCJlbnZcIjogeyBcImZvbzFcIjogXCJiYXIxXCIgfX0gd2lsbCBiZSBwYXJzZWQgdG9cbiAgICAgIC8vIHsgXCJhcmdzXCI6IFwiZm9vLCBiYXJcIiwgXCJlbnZcIjogXCJbb2JqZWN0IE9iamVjdF1cIn1cbiAgICAgIC8vIFNvIHdlIHBhc3NpbmcgYSBzdHJpbmdpZmllZCBKU09OIGhlcmUuXG4gICAgICBjbHUgPSBjbHVzdGVyLmZvcmsoeyBwbTJfZW52OiBKU09OLnN0cmluZ2lmeShlbnZfY29weSksIHdpbmRvd3NIaWRlOiB0cnVlIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIEdvZC5sb2dBbmRHZW5lcmF0ZUVycm9yKGUpO1xuICAgICAgcmV0dXJuIGNiKGUpO1xuICAgIH1cblxuICAgIGNsdS5wbTJfZW52ID0gZW52X2NvcHk7XG5cbiAgICAvKipcbiAgICAgKiBCcm9hZGNhc3QgbWVzc2FnZSB0byBHb2RcbiAgICAgKi9cbiAgICBjbHUub24oJ21lc3NhZ2UnLCBmdW5jdGlvbiBjbHVNZXNzYWdlKG1zZykge1xuICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICogSWYgeW91IGVkaXQgdGhpcyBmdW5jdGlvblxuICAgICAgICogRG8gdGhlIHNhbWUgaW4gRm9ya01vZGUuanMgIVxuICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbiAgICAgIGlmIChtc2cuZGF0YSAmJiBtc2cudHlwZSkge1xuICAgICAgICByZXR1cm4gR29kLmJ1cy5lbWl0KG1zZy50eXBlID8gbXNnLnR5cGUgOiAncHJvY2Vzczptc2cnLCB7XG4gICAgICAgICAgYXQ6IFV0aWxpdHkuZ2V0RGF0ZSgpLFxuICAgICAgICAgIGRhdGE6IG1zZy5kYXRhLFxuICAgICAgICAgIHByb2Nlc3M6IHtcbiAgICAgICAgICAgIHBtX2lkOiBjbHUucG0yX2Vudi5wbV9pZCxcbiAgICAgICAgICAgIG5hbWU6IGNsdS5wbTJfZW52Lm5hbWUsXG4gICAgICAgICAgICByZXY6IChjbHUucG0yX2Vudi52ZXJzaW9uaW5nICYmIGNsdS5wbTJfZW52LnZlcnNpb25pbmcucmV2aXNpb24pID8gY2x1LnBtMl9lbnYudmVyc2lvbmluZy5yZXZpc2lvbiA6IG51bGwsXG4gICAgICAgICAgICBuYW1lc3BhY2U6IGNsdS5wbTJfZW52Lm5hbWVzcGFjZVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcblxuICAgICAgICBpZiAodHlwZW9mIG1zZyA9PSAnb2JqZWN0JyAmJiAnbm9kZV92ZXJzaW9uJyBpbiBtc2cpIHtcbiAgICAgICAgICBjbHUucG0yX2Vudi5ub2RlX3ZlcnNpb24gPSBtc2cubm9kZV92ZXJzaW9uO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbXNnID09ICdvYmplY3QnICYmICdjcm9uX3Jlc3RhcnQnIGluIG1zZykge1xuICAgICAgICAgIHJldHVybiBHb2QucmVzdGFydFByb2Nlc3NJZCh7XG4gICAgICAgICAgICBpZDogY2x1LnBtMl9lbnYucG1faWRcbiAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQXBwbGljYXRpb24gJXMgaGFzIGJlZW4gcmVzdGFydGVkIHZpYSBDUk9OJywgY2x1LnBtMl9lbnYubmFtZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gR29kLmJ1cy5lbWl0KCdwcm9jZXNzOm1zZycsIHtcbiAgICAgICAgICBhdDogVXRpbGl0eS5nZXREYXRlKCksXG4gICAgICAgICAgcmF3OiBtc2csXG4gICAgICAgICAgcHJvY2Vzczoge1xuICAgICAgICAgICAgcG1faWQ6IGNsdS5wbTJfZW52LnBtX2lkLFxuICAgICAgICAgICAgbmFtZTogY2x1LnBtMl9lbnYubmFtZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZTogY2x1LnBtMl9lbnYubmFtZXNwYWNlXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBjYihudWxsLCBjbHUpO1xuICB9O1xufTtcbiJdfQ==