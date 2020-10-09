"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _helpers = _interopRequireDefault(require("./helpers.js"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvVVgvcG0yLWxzLW1pbmltYWwudHMiXSwibmFtZXMiOlsibGlzdCIsImZvckVhY2giLCJsIiwibW9kZSIsInBtMl9lbnYiLCJleGVjX21vZGUiLCJzcGxpdCIsInN0YXR1cyIsImtleSIsIm5hbWUiLCJwIiwiYmFzZW5hbWUiLCJwbV9leGVjX3BhdGgiLCJzY3JpcHQiLCJjb25zb2xlIiwibG9nIiwibmFtZXNwYWNlIiwidmVyc2lvbiIsInBpZCIsInBtX2lkIiwicmVzdGFydF90aW1lIiwicG1fdXB0aW1lIiwiVXhIZWxwZXJzIiwidGltZVNpbmNlIiwibW9uaXQiLCJieXRlc1RvU2l6ZSIsIm1lbW9yeSIsInBtX2Vycl9sb2dfcGF0aCIsIndhdGNoIiwicG1fcGlkX3BhdGgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFDQTs7QUFDQTs7OztBQUVBOzs7OztBQUtlLGtCQUFTQSxJQUFULEVBQWU7QUFDNUJBLEVBQUFBLElBQUksQ0FBQ0MsT0FBTCxDQUFhLFVBQVNDLENBQVQsRUFBWTtBQUV2QixRQUFJQyxJQUFJLEdBQUdELENBQUMsQ0FBQ0UsT0FBRixDQUFVQyxTQUFWLENBQW9CQyxLQUFwQixDQUEwQixPQUExQixFQUFtQyxDQUFuQyxDQUFYO0FBQ0EsUUFBSUMsTUFBTSxHQUFHTCxDQUFDLENBQUNFLE9BQUYsQ0FBVUcsTUFBdkI7O0FBQ0EsUUFBSUMsR0FBRyxHQUFHTixDQUFDLENBQUNFLE9BQUYsQ0FBVUssSUFBVixJQUFrQkMsaUJBQUVDLFFBQUYsQ0FBV1QsQ0FBQyxDQUFDRSxPQUFGLENBQVVRLFlBQVYsQ0FBdUJDLE1BQWxDLENBQTVCOztBQUVBQyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxTQUFaLEVBQXVCUCxHQUF2QjtBQUNBTSxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxnQkFBWixFQUE4QmIsQ0FBQyxDQUFDRSxPQUFGLENBQVVZLFNBQXhDO0FBQ0FGLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGNBQVosRUFBNEJiLENBQUMsQ0FBQ0UsT0FBRixDQUFVYSxPQUF0QztBQUNBSCxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxVQUFaLEVBQXdCYixDQUFDLENBQUNnQixHQUExQjtBQUNBSixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxhQUFaLEVBQTJCYixDQUFDLENBQUNFLE9BQUYsQ0FBVWUsS0FBckM7QUFDQUwsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksYUFBWixFQUEyQlIsTUFBM0I7QUFDQU8sSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksV0FBWixFQUF5QlosSUFBekI7QUFDQVcsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksZ0JBQVosRUFBOEJiLENBQUMsQ0FBQ0UsT0FBRixDQUFVZ0IsWUFBVixHQUF5QmxCLENBQUMsQ0FBQ0UsT0FBRixDQUFVZ0IsWUFBbkMsR0FBa0QsQ0FBaEY7QUFDQU4sSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksYUFBWixFQUE0QmIsQ0FBQyxDQUFDRSxPQUFGLENBQVVpQixTQUFWLElBQXVCZCxNQUFNLElBQUksUUFBbEMsR0FBOENlLG9CQUFVQyxTQUFWLENBQW9CckIsQ0FBQyxDQUFDRSxPQUFGLENBQVVpQixTQUE5QixDQUE5QyxHQUF5RixDQUFwSDtBQUNBUCxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxtQkFBWixFQUFpQ2IsQ0FBQyxDQUFDc0IsS0FBRixHQUFVRixvQkFBVUcsV0FBVixDQUFzQnZCLENBQUMsQ0FBQ3NCLEtBQUYsQ0FBUUUsTUFBOUIsRUFBc0MsQ0FBdEMsQ0FBVixHQUFxRCxFQUF0RjtBQUNBWixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxnQkFBWixFQUE4QmIsQ0FBQyxDQUFDRSxPQUFGLENBQVV1QixlQUF4QztBQUNBYixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxlQUFaLEVBQTZCYixDQUFDLENBQUNFLE9BQUYsQ0FBVXdCLEtBQVYsR0FBa0IsS0FBbEIsR0FBMEIsSUFBdkQ7QUFDQWQsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksaUJBQVosRUFBK0JiLENBQUMsQ0FBQ0UsT0FBRixDQUFVeUIsV0FBekM7QUFDRCxHQW5CRDtBQW9CRCIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgVXhIZWxwZXJzIGZyb20gJy4vaGVscGVycy5qcyc7XHJcbmltcG9ydCBwIGZyb20gJ3BhdGgnO1xyXG5cclxuLyoqXHJcbiAqIE1pbmltYWwgZGlzcGxheSB2aWEgcG0yIGxzIC1tXHJcbiAqIEBtZXRob2QgbWluaURpc3BsYXlcclxuICogQHBhcmFtIHtPYmplY3R9IGxpc3QgcHJvY2VzcyBsaXN0XHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihsaXN0KSB7XHJcbiAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGwpIHtcclxuXHJcbiAgICB2YXIgbW9kZSA9IGwucG0yX2Vudi5leGVjX21vZGUuc3BsaXQoJ19tb2RlJylbMF1cclxuICAgIHZhciBzdGF0dXMgPSBsLnBtMl9lbnYuc3RhdHVzXHJcbiAgICB2YXIga2V5ID0gbC5wbTJfZW52Lm5hbWUgfHwgcC5iYXNlbmFtZShsLnBtMl9lbnYucG1fZXhlY19wYXRoLnNjcmlwdClcclxuXHJcbiAgICBjb25zb2xlLmxvZygnKy0tLSAlcycsIGtleSlcclxuICAgIGNvbnNvbGUubG9nKCduYW1lc3BhY2UgOiAlcycsIGwucG0yX2Vudi5uYW1lc3BhY2UpXHJcbiAgICBjb25zb2xlLmxvZygndmVyc2lvbiA6ICVzJywgbC5wbTJfZW52LnZlcnNpb24pXHJcbiAgICBjb25zb2xlLmxvZygncGlkIDogJXMnLCBsLnBpZClcclxuICAgIGNvbnNvbGUubG9nKCdwbTIgaWQgOiAlcycsIGwucG0yX2Vudi5wbV9pZClcclxuICAgIGNvbnNvbGUubG9nKCdzdGF0dXMgOiAlcycsIHN0YXR1cylcclxuICAgIGNvbnNvbGUubG9nKCdtb2RlIDogJXMnLCBtb2RlKVxyXG4gICAgY29uc29sZS5sb2coJ3Jlc3RhcnRlZCA6ICVkJywgbC5wbTJfZW52LnJlc3RhcnRfdGltZSA/IGwucG0yX2Vudi5yZXN0YXJ0X3RpbWUgOiAwKVxyXG4gICAgY29uc29sZS5sb2coJ3VwdGltZSA6ICVzJywgKGwucG0yX2Vudi5wbV91cHRpbWUgJiYgc3RhdHVzID09ICdvbmxpbmUnKSA/IFV4SGVscGVycy50aW1lU2luY2UobC5wbTJfZW52LnBtX3VwdGltZSkgOiAwKVxyXG4gICAgY29uc29sZS5sb2coJ21lbW9yeSB1c2FnZSA6ICVzJywgbC5tb25pdCA/IFV4SGVscGVycy5ieXRlc1RvU2l6ZShsLm1vbml0Lm1lbW9yeSwgMSkgOiAnJylcclxuICAgIGNvbnNvbGUubG9nKCdlcnJvciBsb2cgOiAlcycsIGwucG0yX2Vudi5wbV9lcnJfbG9nX3BhdGgpXHJcbiAgICBjb25zb2xlLmxvZygnd2F0Y2hpbmcgOiAlcycsIGwucG0yX2Vudi53YXRjaCA/ICd5ZXMnIDogJ25vJylcclxuICAgIGNvbnNvbGUubG9nKCdQSUQgZmlsZSA6ICVzXFxuJywgbC5wbTJfZW52LnBtX3BpZF9wYXRoKVxyXG4gIH0pXHJcbn1cclxuIl19