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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Hb2QvQ2x1c3Rlck1vZGUudHMiXSwibmFtZXMiOlsiQ2x1c3Rlck1vZGUiLCJHb2QiLCJub2RlQXBwIiwiZW52X2NvcHkiLCJjYiIsImNsdSIsImNvbnNvbGUiLCJsb2ciLCJuYW1lIiwicG1faWQiLCJub2RlX2FyZ3MiLCJBcnJheSIsImlzQXJyYXkiLCJjbHVzdGVyIiwic2V0dGluZ3MiLCJleGVjQXJndiIsIl9wbTJfdmVyc2lvbiIsInBrZyIsInZlcnNpb24iLCJmb3JrIiwicG0yX2VudiIsIkpTT04iLCJzdHJpbmdpZnkiLCJ3aW5kb3dzSGlkZSIsImUiLCJsb2dBbmRHZW5lcmF0ZUVycm9yIiwib24iLCJjbHVNZXNzYWdlIiwibXNnIiwiZGF0YSIsInR5cGUiLCJidXMiLCJlbWl0IiwiYXQiLCJVdGlsaXR5IiwiZ2V0RGF0ZSIsInByb2Nlc3MiLCJyZXYiLCJ2ZXJzaW9uaW5nIiwicmV2aXNpb24iLCJuYW1lc3BhY2UiLCJub2RlX3ZlcnNpb24iLCJyZXN0YXJ0UHJvY2Vzc0lkIiwiaWQiLCJyYXciXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQUtBO0FBRUE7Ozs7Ozs7Ozs7O0FBS0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVBOzs7Ozs7QUFNZSxTQUFTQSxXQUFULENBQXFCQyxHQUFyQixFQUEwQjtBQUV2Qzs7Ozs7Ozs7QUFRQUEsRUFBQUEsR0FBRyxDQUFDQyxPQUFKLEdBQWMsU0FBU0EsT0FBVCxDQUFpQkMsUUFBakIsRUFBMkJDLEVBQTNCLEVBQThCO0FBQzFDLFFBQUlDLEdBQUcsR0FBRyxJQUFWO0FBRUFDLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixnQkFBb0JKLFFBQVEsQ0FBQ0ssSUFBN0IsY0FBcUNMLFFBQVEsQ0FBQ00sS0FBOUM7O0FBQ0EsUUFBSU4sUUFBUSxDQUFDTyxTQUFULElBQXNCQyxLQUFLLENBQUNDLE9BQU4sQ0FBY1QsUUFBUSxDQUFDTyxTQUF2QixDQUExQixFQUE2RDtBQUMzREcsMEJBQVFDLFFBQVIsQ0FB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QUluQyxHQUFHLENBQUNlLE9BQUosQ0FBWW9CO0FBSGhCO0FBSHNCLFNBQTVCLENBQVA7QUFTRDtBQUNGLEtBeENEO0FBMENBLFdBQU9wQyxFQUFFLENBQUMsSUFBRCxFQUFPQyxHQUFQLENBQVQ7QUFDRCxHQXJFRDtBQXNFRDs7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcclxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQGZpbGUgQ2x1c3RlciBleGVjdXRpb24gZnVuY3Rpb25zIHJlbGF0ZWRcclxuICogQGF1dGhvciBBbGV4YW5kcmUgU3RyemVsZXdpY3ogPGFzQHVuaXRlY2guaW8+XHJcbiAqIEBwcm9qZWN0IFBNMlxyXG4gKi9cclxuaW1wb3J0IGNsdXN0ZXIgICAgICAgZnJvbSAnY2x1c3Rlcic7XHJcbmltcG9ydCBVdGlsaXR5ICAgICAgIGZyb20gJy4uL1V0aWxpdHkuanMnO1xyXG5pbXBvcnQgcGtnICAgICAgICAgICBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nO1xyXG5cclxuLyoqXHJcbiAqIERlc2NyaXB0aW9uXHJcbiAqIEBtZXRob2QgZXhwb3J0c1xyXG4gKiBAcGFyYW0ge30gR29kXHJcbiAqIEByZXR1cm5cclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIENsdXN0ZXJNb2RlKEdvZCkge1xyXG5cclxuICAvKipcclxuICAgKiBGb3IgTm9kZSBhcHBzIC0gQ2x1c3RlciBtb2RlXHJcbiAgICogSXQgd2lsbCB3cmFwIHRoZSBjb2RlIGFuZCBlbmFibGUgbG9hZC1iYWxhbmNpbmcgbW9kZVxyXG4gICAqIEBtZXRob2Qgbm9kZUFwcFxyXG4gICAqIEBwYXJhbSB7fSBlbnZfY29weVxyXG4gICAqIEBwYXJhbSB7fSBjYlxyXG4gICAqIEByZXR1cm4gTGl0ZXJhbFxyXG4gICAqL1xyXG4gIEdvZC5ub2RlQXBwID0gZnVuY3Rpb24gbm9kZUFwcChlbnZfY29weSwgY2Ipe1xyXG4gICAgdmFyIGNsdSA9IG51bGw7XHJcblxyXG4gICAgY29uc29sZS5sb2coYEFwcCBbJHtlbnZfY29weS5uYW1lfToke2Vudl9jb3B5LnBtX2lkfV0gc3RhcnRpbmcgaW4gLWNsdXN0ZXIgbW9kZS1gKVxyXG4gICAgaWYgKGVudl9jb3B5Lm5vZGVfYXJncyAmJiBBcnJheS5pc0FycmF5KGVudl9jb3B5Lm5vZGVfYXJncykpIHtcclxuICAgICAgY2x1c3Rlci5zZXR0aW5ncy5leGVjQXJndiA9IGVudl9jb3B5Lm5vZGVfYXJncztcclxuICAgIH1cclxuXHJcbiAgICBlbnZfY29weS5fcG0yX3ZlcnNpb24gPSBwa2cudmVyc2lvbjtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBub2RlLmpzIGNsdXN0ZXIgY2xpZW50cyBjYW4gbm90IHJlY2VpdmUgZGVlcC1sZXZlbCBvYmplY3RzIG9yIGFycmF5cyBpbiB0aGUgZm9ya2VkIHByb2Nlc3MsIGUuZy46XHJcbiAgICAgIC8vIHsgXCJhcmdzXCI6IFtcImZvb1wiLCBcImJhclwiXSwgXCJlbnZcIjogeyBcImZvbzFcIjogXCJiYXIxXCIgfX0gd2lsbCBiZSBwYXJzZWQgdG9cclxuICAgICAgLy8geyBcImFyZ3NcIjogXCJmb28sIGJhclwiLCBcImVudlwiOiBcIltvYmplY3QgT2JqZWN0XVwifVxyXG4gICAgICAvLyBTbyB3ZSBwYXNzaW5nIGEgc3RyaW5naWZpZWQgSlNPTiBoZXJlLlxyXG4gICAgICBjbHUgPSBjbHVzdGVyLmZvcmsoe3BtMl9lbnY6IEpTT04uc3RyaW5naWZ5KGVudl9jb3B5KSwgd2luZG93c0hpZGU6IHRydWV9KTtcclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICBHb2QubG9nQW5kR2VuZXJhdGVFcnJvcihlKTtcclxuICAgICAgcmV0dXJuIGNiKGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsdS5wbTJfZW52ID0gZW52X2NvcHk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCcm9hZGNhc3QgbWVzc2FnZSB0byBHb2RcclxuICAgICAqL1xyXG4gICAgY2x1Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24gY2x1TWVzc2FnZShtc2cpIHtcclxuICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgKiBJZiB5b3UgZWRpdCB0aGlzIGZ1bmN0aW9uXHJcbiAgICAgICAqIERvIHRoZSBzYW1lIGluIEZvcmtNb2RlLmpzICFcclxuICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuICAgICAgaWYgKG1zZy5kYXRhICYmIG1zZy50eXBlKSB7XHJcbiAgICAgICAgcmV0dXJuIEdvZC5idXMuZW1pdChtc2cudHlwZSA/IG1zZy50eXBlIDogJ3Byb2Nlc3M6bXNnJywge1xyXG4gICAgICAgICAgYXQgICAgICA6IFV0aWxpdHkuZ2V0RGF0ZSgpLFxyXG4gICAgICAgICAgZGF0YSAgICA6IG1zZy5kYXRhLFxyXG4gICAgICAgICAgcHJvY2VzcyA6ICB7XHJcbiAgICAgICAgICAgIHBtX2lkICAgICAgOiBjbHUucG0yX2Vudi5wbV9pZCxcclxuICAgICAgICAgICAgbmFtZSAgICAgICA6IGNsdS5wbTJfZW52Lm5hbWUsXHJcbiAgICAgICAgICAgIHJldiAgICAgICAgOiAoY2x1LnBtMl9lbnYudmVyc2lvbmluZyAmJiBjbHUucG0yX2Vudi52ZXJzaW9uaW5nLnJldmlzaW9uKSA/IGNsdS5wbTJfZW52LnZlcnNpb25pbmcucmV2aXNpb24gOiBudWxsLFxyXG4gICAgICAgICAgICBuYW1lc3BhY2UgIDogY2x1LnBtMl9lbnYubmFtZXNwYWNlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgbXNnID09ICdvYmplY3QnICYmICdub2RlX3ZlcnNpb24nIGluIG1zZykge1xyXG4gICAgICAgICAgY2x1LnBtMl9lbnYubm9kZV92ZXJzaW9uID0gbXNnLm5vZGVfdmVyc2lvbjtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBtc2cgPT0gJ29iamVjdCcgJiYgJ2Nyb25fcmVzdGFydCcgaW4gbXNnKSB7XHJcbiAgICAgICAgICByZXR1cm4gR29kLnJlc3RhcnRQcm9jZXNzSWQoe1xyXG4gICAgICAgICAgICBpZCA6IGNsdS5wbTJfZW52LnBtX2lkXHJcbiAgICAgICAgICB9LCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FwcGxpY2F0aW9uICVzIGhhcyBiZWVuIHJlc3RhcnRlZCB2aWEgQ1JPTicsIGNsdS5wbTJfZW52Lm5hbWUpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gR29kLmJ1cy5lbWl0KCdwcm9jZXNzOm1zZycsIHtcclxuICAgICAgICAgIGF0ICAgICAgOiBVdGlsaXR5LmdldERhdGUoKSxcclxuICAgICAgICAgIHJhdyAgICAgOiBtc2csXHJcbiAgICAgICAgICBwcm9jZXNzIDogIHtcclxuICAgICAgICAgICAgcG1faWQgICAgICA6IGNsdS5wbTJfZW52LnBtX2lkLFxyXG4gICAgICAgICAgICBuYW1lICAgICAgIDogY2x1LnBtMl9lbnYubmFtZSxcclxuICAgICAgICAgICAgbmFtZXNwYWNlICA6IGNsdS5wbTJfZW52Lm5hbWVzcGFjZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gY2IobnVsbCwgY2x1KTtcclxuICB9O1xyXG59O1xyXG4iXX0=