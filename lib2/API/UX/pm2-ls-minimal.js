"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _helpers = _interopRequireDefault(require("./helpers"));

var _path = _interopRequireDefault(require("path"));

/**
 * Minimal display via pm2 ls -m
 * @method miniDisplay
 * @param {Object} list process list
 */
function _default(list) {
  list.forEach(function (l) {
    var mode = l.pm2_env.exec_mode.split('_mode')[0];
    var status = l.pm2_env.status;

    var key = l.pm2_env.name || _path["default"].basename(l.pm2_env.pm_exec_path.script);

    console.log('+--- %s', key);
    console.log('namespace : %s', l.pm2_env.namespace);
    console.log('version : %s', l.pm2_env.version);
    console.log('pid : %s', l.pid);
    console.log('pm2 id : %s', l.pm2_env.pm_id);
    console.log('status : %s', status);
    console.log('mode : %s', mode);
    console.log('restarted : %d', l.pm2_env.restart_time ? l.pm2_env.restart_time : 0);
    console.log('uptime : %s', l.pm2_env.pm_uptime && status == 'online' ? _helpers["default"].timeSince(l.pm2_env.pm_uptime) : 0);
    console.log('memory usage : %s', l.monit ? _helpers["default"].bytesToSize(l.monit.memory, 1) : '');
    console.log('error log : %s', l.pm2_env.pm_err_log_path);
    console.log('watching : %s', l.pm2_env.watch ? 'yes' : 'no');
    console.log('PID file : %s\n', l.pm2_env.pm_pid_path);
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvVVgvcG0yLWxzLW1pbmltYWwudHMiXSwibmFtZXMiOlsibGlzdCIsImZvckVhY2giLCJsIiwibW9kZSIsInBtMl9lbnYiLCJleGVjX21vZGUiLCJzcGxpdCIsInN0YXR1cyIsImtleSIsIm5hbWUiLCJwIiwiYmFzZW5hbWUiLCJwbV9leGVjX3BhdGgiLCJzY3JpcHQiLCJjb25zb2xlIiwibG9nIiwibmFtZXNwYWNlIiwidmVyc2lvbiIsInBpZCIsInBtX2lkIiwicmVzdGFydF90aW1lIiwicG1fdXB0aW1lIiwiVXhIZWxwZXJzIiwidGltZVNpbmNlIiwibW9uaXQiLCJieXRlc1RvU2l6ZSIsIm1lbW9yeSIsInBtX2Vycl9sb2dfcGF0aCIsIndhdGNoIiwicG1fcGlkX3BhdGgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBOztBQUNBOztBQUVBOzs7OztBQUtlLGtCQUFTQSxJQUFULEVBQWU7QUFDNUJBLEVBQUFBLElBQUksQ0FBQ0MsT0FBTCxDQUFhLFVBQVNDLENBQVQsRUFBWTtBQUV2QixRQUFJQyxJQUFJLEdBQUdELENBQUMsQ0FBQ0UsT0FBRixDQUFVQyxTQUFWLENBQW9CQyxLQUFwQixDQUEwQixPQUExQixFQUFtQyxDQUFuQyxDQUFYO0FBQ0EsUUFBSUMsTUFBTSxHQUFHTCxDQUFDLENBQUNFLE9BQUYsQ0FBVUcsTUFBdkI7O0FBQ0EsUUFBSUMsR0FBRyxHQUFHTixDQUFDLENBQUNFLE9BQUYsQ0FBVUssSUFBVixJQUFrQkMsaUJBQUVDLFFBQUYsQ0FBV1QsQ0FBQyxDQUFDRSxPQUFGLENBQVVRLFlBQVYsQ0FBdUJDLE1BQWxDLENBQTVCOztBQUVBQyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxTQUFaLEVBQXVCUCxHQUF2QjtBQUNBTSxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxnQkFBWixFQUE4QmIsQ0FBQyxDQUFDRSxPQUFGLENBQVVZLFNBQXhDO0FBQ0FGLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGNBQVosRUFBNEJiLENBQUMsQ0FBQ0UsT0FBRixDQUFVYSxPQUF0QztBQUNBSCxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxVQUFaLEVBQXdCYixDQUFDLENBQUNnQixHQUExQjtBQUNBSixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxhQUFaLEVBQTJCYixDQUFDLENBQUNFLE9BQUYsQ0FBVWUsS0FBckM7QUFDQUwsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksYUFBWixFQUEyQlIsTUFBM0I7QUFDQU8sSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksV0FBWixFQUF5QlosSUFBekI7QUFDQVcsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksZ0JBQVosRUFBOEJiLENBQUMsQ0FBQ0UsT0FBRixDQUFVZ0IsWUFBVixHQUF5QmxCLENBQUMsQ0FBQ0UsT0FBRixDQUFVZ0IsWUFBbkMsR0FBa0QsQ0FBaEY7QUFDQU4sSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksYUFBWixFQUE0QmIsQ0FBQyxDQUFDRSxPQUFGLENBQVVpQixTQUFWLElBQXVCZCxNQUFNLElBQUksUUFBbEMsR0FBOENlLG9CQUFVQyxTQUFWLENBQW9CckIsQ0FBQyxDQUFDRSxPQUFGLENBQVVpQixTQUE5QixDQUE5QyxHQUF5RixDQUFwSDtBQUNBUCxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxtQkFBWixFQUFpQ2IsQ0FBQyxDQUFDc0IsS0FBRixHQUFVRixvQkFBVUcsV0FBVixDQUFzQnZCLENBQUMsQ0FBQ3NCLEtBQUYsQ0FBUUUsTUFBOUIsRUFBc0MsQ0FBdEMsQ0FBVixHQUFxRCxFQUF0RjtBQUNBWixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxnQkFBWixFQUE4QmIsQ0FBQyxDQUFDRSxPQUFGLENBQVV1QixlQUF4QztBQUNBYixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxlQUFaLEVBQTZCYixDQUFDLENBQUNFLE9BQUYsQ0FBVXdCLEtBQVYsR0FBa0IsS0FBbEIsR0FBMEIsSUFBdkQ7QUFDQWQsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksaUJBQVosRUFBK0JiLENBQUMsQ0FBQ0UsT0FBRixDQUFVeUIsV0FBekM7QUFDRCxHQW5CRDtBQW9CRCIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IFV4SGVscGVycyBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHAgZnJvbSAncGF0aCc7XG5cbi8qKlxuICogTWluaW1hbCBkaXNwbGF5IHZpYSBwbTIgbHMgLW1cbiAqIEBtZXRob2QgbWluaURpc3BsYXlcbiAqIEBwYXJhbSB7T2JqZWN0fSBsaXN0IHByb2Nlc3MgbGlzdFxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihsaXN0KSB7XG4gIGxpc3QuZm9yRWFjaChmdW5jdGlvbihsKSB7XG5cbiAgICB2YXIgbW9kZSA9IGwucG0yX2Vudi5leGVjX21vZGUuc3BsaXQoJ19tb2RlJylbMF1cbiAgICB2YXIgc3RhdHVzID0gbC5wbTJfZW52LnN0YXR1c1xuICAgIHZhciBrZXkgPSBsLnBtMl9lbnYubmFtZSB8fCBwLmJhc2VuYW1lKGwucG0yX2Vudi5wbV9leGVjX3BhdGguc2NyaXB0KVxuXG4gICAgY29uc29sZS5sb2coJystLS0gJXMnLCBrZXkpXG4gICAgY29uc29sZS5sb2coJ25hbWVzcGFjZSA6ICVzJywgbC5wbTJfZW52Lm5hbWVzcGFjZSlcbiAgICBjb25zb2xlLmxvZygndmVyc2lvbiA6ICVzJywgbC5wbTJfZW52LnZlcnNpb24pXG4gICAgY29uc29sZS5sb2coJ3BpZCA6ICVzJywgbC5waWQpXG4gICAgY29uc29sZS5sb2coJ3BtMiBpZCA6ICVzJywgbC5wbTJfZW52LnBtX2lkKVxuICAgIGNvbnNvbGUubG9nKCdzdGF0dXMgOiAlcycsIHN0YXR1cylcbiAgICBjb25zb2xlLmxvZygnbW9kZSA6ICVzJywgbW9kZSlcbiAgICBjb25zb2xlLmxvZygncmVzdGFydGVkIDogJWQnLCBsLnBtMl9lbnYucmVzdGFydF90aW1lID8gbC5wbTJfZW52LnJlc3RhcnRfdGltZSA6IDApXG4gICAgY29uc29sZS5sb2coJ3VwdGltZSA6ICVzJywgKGwucG0yX2Vudi5wbV91cHRpbWUgJiYgc3RhdHVzID09ICdvbmxpbmUnKSA/IFV4SGVscGVycy50aW1lU2luY2UobC5wbTJfZW52LnBtX3VwdGltZSkgOiAwKVxuICAgIGNvbnNvbGUubG9nKCdtZW1vcnkgdXNhZ2UgOiAlcycsIGwubW9uaXQgPyBVeEhlbHBlcnMuYnl0ZXNUb1NpemUobC5tb25pdC5tZW1vcnksIDEpIDogJycpXG4gICAgY29uc29sZS5sb2coJ2Vycm9yIGxvZyA6ICVzJywgbC5wbTJfZW52LnBtX2Vycl9sb2dfcGF0aClcbiAgICBjb25zb2xlLmxvZygnd2F0Y2hpbmcgOiAlcycsIGwucG0yX2Vudi53YXRjaCA/ICd5ZXMnIDogJ25vJylcbiAgICBjb25zb2xlLmxvZygnUElEIGZpbGUgOiAlc1xcbicsIGwucG0yX2Vudi5wbV9waWRfcGF0aClcbiAgfSlcbn1cbiJdfQ==