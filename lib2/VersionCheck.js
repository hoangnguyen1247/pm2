"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _pm2VersionCheck = _interopRequireDefault(require("@pm2/pm2-version-check"));

var _semver = _interopRequireDefault(require("semver"));

var _fs = _interopRequireDefault(require("fs"));

var _os = _interopRequireDefault(require("os"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function hasDockerEnv() {
  try {
    _fs["default"].statSync('/.dockerenv');

    return true;
  } catch (_) {
    return false;
  }
}

function hasDockerCGroup() {
  try {
    return _fs["default"].readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
  } catch (_) {
    return false;
  }
}

function _default(opts) {
  var params = {
    state: opts.state,
    version: opts.version
  };

  try {
    params.os = _os["default"].type();
    params.uptime = Math.floor(process.uptime());
    params.nodev = process.versions.node;
    params.docker = hasDockerEnv() || hasDockerCGroup();
  } catch (e) {}

  _pm2VersionCheck["default"].runCheck(params, function (err, pkg) {
    if (err) return false;
    if (!pkg.current_version) return false;

    if (opts.version && _semver["default"].lt(opts.version, pkg.current_version)) {
      console.log('[PM2] This PM2 is not UP TO DATE');
      console.log('[PM2] Upgrade to version %s', pkg.current_version);
    }
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9WZXJzaW9uQ2hlY2sudHMiXSwibmFtZXMiOlsiaGFzRG9ja2VyRW52IiwiZnMiLCJzdGF0U3luYyIsIl8iLCJoYXNEb2NrZXJDR3JvdXAiLCJyZWFkRmlsZVN5bmMiLCJpbmNsdWRlcyIsIm9wdHMiLCJwYXJhbXMiLCJzdGF0ZSIsInZlcnNpb24iLCJvcyIsInR5cGUiLCJ1cHRpbWUiLCJNYXRoIiwiZmxvb3IiLCJwcm9jZXNzIiwibm9kZXYiLCJ2ZXJzaW9ucyIsIm5vZGUiLCJkb2NrZXIiLCJlIiwidkNoZWNrIiwicnVuQ2hlY2siLCJlcnIiLCJwa2ciLCJjdXJyZW50X3ZlcnNpb24iLCJzZW12ZXIiLCJsdCIsImNvbnNvbGUiLCJsb2ciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLFNBQVNBLFlBQVQsR0FBd0I7QUFDdkIsTUFBSTtBQUNIQyxtQkFBR0MsUUFBSCxDQUFZLGFBQVo7O0FBQ0EsV0FBTyxJQUFQO0FBQ0EsR0FIRCxDQUdFLE9BQU9DLENBQVAsRUFBVTtBQUNYLFdBQU8sS0FBUDtBQUNBO0FBQ0Q7O0FBRUQsU0FBU0MsZUFBVCxHQUEyQjtBQUMxQixNQUFJO0FBQ0gsV0FBT0gsZUFBR0ksWUFBSCxDQUFnQixtQkFBaEIsRUFBcUMsTUFBckMsRUFBNkNDLFFBQTdDLENBQXNELFFBQXRELENBQVA7QUFDQSxHQUZELENBRUUsT0FBT0gsQ0FBUCxFQUFVO0FBQ1gsV0FBTyxLQUFQO0FBQ0E7QUFDRDs7QUFFYyxrQkFBVUksSUFBVixFQUFnQjtBQUM3QixNQUFJQyxNQUFXLEdBQUc7QUFDaEJDLElBQUFBLEtBQUssRUFBRUYsSUFBSSxDQUFDRSxLQURJO0FBRWhCQyxJQUFBQSxPQUFPLEVBQUVILElBQUksQ0FBQ0c7QUFGRSxHQUFsQjs7QUFLQSxNQUFJO0FBQ0ZGLElBQUFBLE1BQU0sQ0FBQ0csRUFBUCxHQUFZQSxlQUFHQyxJQUFILEVBQVo7QUFDQUosSUFBQUEsTUFBTSxDQUFDSyxNQUFQLEdBQWdCQyxJQUFJLENBQUNDLEtBQUwsQ0FBV0MsT0FBTyxDQUFDSCxNQUFSLEVBQVgsQ0FBaEI7QUFDQUwsSUFBQUEsTUFBTSxDQUFDUyxLQUFQLEdBQWVELE9BQU8sQ0FBQ0UsUUFBUixDQUFpQkMsSUFBaEM7QUFDQVgsSUFBQUEsTUFBTSxDQUFDWSxNQUFQLEdBQWdCcEIsWUFBWSxNQUFNSSxlQUFlLEVBQWpEO0FBQ0QsR0FMRCxDQUtFLE9BQU1pQixDQUFOLEVBQVMsQ0FDVjs7QUFFREMsOEJBQU9DLFFBQVAsQ0FBZ0JmLE1BQWhCLEVBQXdCLFVBQUNnQixHQUFELEVBQU1DLEdBQU4sRUFBYztBQUNwQyxRQUFJRCxHQUFKLEVBQVMsT0FBTyxLQUFQO0FBQ1QsUUFBSSxDQUFDQyxHQUFHLENBQUNDLGVBQVQsRUFBMEIsT0FBTyxLQUFQOztBQUMxQixRQUFJbkIsSUFBSSxDQUFDRyxPQUFMLElBQWdCaUIsbUJBQU9DLEVBQVAsQ0FBVXJCLElBQUksQ0FBQ0csT0FBZixFQUF3QmUsR0FBRyxDQUFDQyxlQUE1QixDQUFwQixFQUFrRTtBQUNoRUcsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksa0NBQVo7QUFDQUQsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksNkJBQVosRUFBMkNMLEdBQUcsQ0FBQ0MsZUFBL0M7QUFDRDtBQUNGLEdBUEQ7QUFRRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB2Q2hlY2sgZnJvbSAnQHBtMi9wbTItdmVyc2lvbi1jaGVjayc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcblxuZnVuY3Rpb24gaGFzRG9ja2VyRW52KCkge1xuXHR0cnkge1xuXHRcdGZzLnN0YXRTeW5jKCcvLmRvY2tlcmVudicpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChfKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGhhc0RvY2tlckNHcm91cCgpIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gZnMucmVhZEZpbGVTeW5jKCcvcHJvYy9zZWxmL2Nncm91cCcsICd1dGY4JykuaW5jbHVkZXMoJ2RvY2tlcicpO1xuXHR9IGNhdGNoIChfKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRzKSB7XG4gIHZhciBwYXJhbXM6IGFueSA9IHtcbiAgICBzdGF0ZTogb3B0cy5zdGF0ZSxcbiAgICB2ZXJzaW9uOiBvcHRzLnZlcnNpb25cbiAgfVxuXG4gIHRyeSB7XG4gICAgcGFyYW1zLm9zID0gb3MudHlwZSgpXG4gICAgcGFyYW1zLnVwdGltZSA9IE1hdGguZmxvb3IocHJvY2Vzcy51cHRpbWUoKSlcbiAgICBwYXJhbXMubm9kZXYgPSBwcm9jZXNzLnZlcnNpb25zLm5vZGVcbiAgICBwYXJhbXMuZG9ja2VyID0gaGFzRG9ja2VyRW52KCkgfHwgaGFzRG9ja2VyQ0dyb3VwKClcbiAgfSBjYXRjaChlKSB7XG4gIH1cblxuICB2Q2hlY2sucnVuQ2hlY2socGFyYW1zLCAoZXJyLCBwa2cpID0+IHtcbiAgICBpZiAoZXJyKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoIXBrZy5jdXJyZW50X3ZlcnNpb24pIHJldHVybiBmYWxzZVxuICAgIGlmIChvcHRzLnZlcnNpb24gJiYgc2VtdmVyLmx0KG9wdHMudmVyc2lvbiwgcGtnLmN1cnJlbnRfdmVyc2lvbikpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbUE0yXSBUaGlzIFBNMiBpcyBub3QgVVAgVE8gREFURScpXG4gICAgICBjb25zb2xlLmxvZygnW1BNMl0gVXBncmFkZSB0byB2ZXJzaW9uICVzJywgcGtnLmN1cnJlbnRfdmVyc2lvbilcbiAgICB9XG4gIH0pXG59XG4iXX0=