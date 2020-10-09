'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _default = {
  injectModules: function injectModules() {
    if (process.env.pmx !== 'false') {
      var pmx = require('@pm2/io');

      var conf = {};
      var hasSpecificConfig = typeof process.env.io === 'string' || process.env.trace === 'true'; // pmx is already init, no need to do it twice

      if (hasSpecificConfig === false) return;

      if (process.env.io) {
        var io = JSON.parse(process.env.io);
        conf = io.conf ? io.conf : conf;
      }

      pmx.init(Object.assign({
        tracing: process.env.trace === 'true' || false
      }, conf));
    }
  },
  isESModule: function isESModule(exec_path) {
    var fs = require('fs');

    var path = require('path');

    var semver = require('semver');

    var data;
    if (semver.satisfies(process.version, '< 13.3.0')) return false;
    if (path.extname(exec_path) === '.mjs') return true;

    try {
      data = JSON.parse(fs.readFileSync(path.join(path.dirname(exec_path), 'package.json')));
      if (data.type === 'module') return true;else return false;
    } catch (e) {}

    try {
      data = JSON.parse(fs.readFileSync(path.join(path.dirname(exec_path), '..', 'package.json')));
      if (data.type === 'module') return true;else return false;
    } catch (e) {
      return false;
    }
  }
};
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Qcm9jZXNzVXRpbHMudHMiXSwibmFtZXMiOlsiaW5qZWN0TW9kdWxlcyIsInByb2Nlc3MiLCJlbnYiLCJwbXgiLCJyZXF1aXJlIiwiY29uZiIsImhhc1NwZWNpZmljQ29uZmlnIiwiaW8iLCJ0cmFjZSIsIkpTT04iLCJwYXJzZSIsImluaXQiLCJPYmplY3QiLCJhc3NpZ24iLCJ0cmFjaW5nIiwiaXNFU01vZHVsZSIsImV4ZWNfcGF0aCIsImZzIiwicGF0aCIsInNlbXZlciIsImRhdGEiLCJzYXRpc2ZpZXMiLCJ2ZXJzaW9uIiwiZXh0bmFtZSIsInJlYWRGaWxlU3luYyIsImpvaW4iLCJkaXJuYW1lIiwidHlwZSIsImUiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7ZUFFZTtBQUNiQSxFQUFBQSxhQUFhLEVBQUUseUJBQVc7QUFDeEIsUUFBSUMsT0FBTyxDQUFDQyxHQUFSLENBQVlDLEdBQVosS0FBb0IsT0FBeEIsRUFBaUM7QUFDL0IsVUFBTUEsR0FBRyxHQUFHQyxPQUFPLENBQUMsU0FBRCxDQUFuQjs7QUFFQSxVQUFJQyxJQUFJLEdBQUcsRUFBWDtBQUNBLFVBQU1DLGlCQUFpQixHQUFHLE9BQU9MLE9BQU8sQ0FBQ0MsR0FBUixDQUFZSyxFQUFuQixLQUEwQixRQUExQixJQUFzQ04sT0FBTyxDQUFDQyxHQUFSLENBQVlNLEtBQVosS0FBc0IsTUFBdEYsQ0FKK0IsQ0FLL0I7O0FBQ0EsVUFBSUYsaUJBQWlCLEtBQUssS0FBMUIsRUFBaUM7O0FBRWpDLFVBQUlMLE9BQU8sQ0FBQ0MsR0FBUixDQUFZSyxFQUFoQixFQUFvQjtBQUNsQixZQUFNQSxFQUFFLEdBQUdFLElBQUksQ0FBQ0MsS0FBTCxDQUFXVCxPQUFPLENBQUNDLEdBQVIsQ0FBWUssRUFBdkIsQ0FBWDtBQUNBRixRQUFBQSxJQUFJLEdBQUdFLEVBQUUsQ0FBQ0YsSUFBSCxHQUFVRSxFQUFFLENBQUNGLElBQWIsR0FBb0JBLElBQTNCO0FBQ0Q7O0FBQ0RGLE1BQUFBLEdBQUcsQ0FBQ1EsSUFBSixDQUFTQyxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUNyQkMsUUFBQUEsT0FBTyxFQUFFYixPQUFPLENBQUNDLEdBQVIsQ0FBWU0sS0FBWixLQUFzQixNQUF0QixJQUFnQztBQURwQixPQUFkLEVBRU5ILElBRk0sQ0FBVDtBQUdEO0FBQ0YsR0FsQlk7QUFtQmJVLEVBQUFBLFVBbkJhLHNCQW1CRkMsU0FuQkUsRUFtQlM7QUFDcEIsUUFBSUMsRUFBRSxHQUFHYixPQUFPLENBQUMsSUFBRCxDQUFoQjs7QUFDQSxRQUFJYyxJQUFJLEdBQUdkLE9BQU8sQ0FBQyxNQUFELENBQWxCOztBQUNBLFFBQUllLE1BQU0sR0FBR2YsT0FBTyxDQUFDLFFBQUQsQ0FBcEI7O0FBQ0EsUUFBSWdCLElBQUo7QUFFQSxRQUFJRCxNQUFNLENBQUNFLFNBQVAsQ0FBaUJwQixPQUFPLENBQUNxQixPQUF6QixFQUFrQyxVQUFsQyxDQUFKLEVBQ0UsT0FBTyxLQUFQO0FBRUYsUUFBSUosSUFBSSxDQUFDSyxPQUFMLENBQWFQLFNBQWIsTUFBNEIsTUFBaEMsRUFDRSxPQUFPLElBQVA7O0FBRUYsUUFBSTtBQUNGSSxNQUFBQSxJQUFJLEdBQUdYLElBQUksQ0FBQ0MsS0FBTCxDQUFXTyxFQUFFLENBQUNPLFlBQUgsQ0FBZ0JOLElBQUksQ0FBQ08sSUFBTCxDQUFVUCxJQUFJLENBQUNRLE9BQUwsQ0FBYVYsU0FBYixDQUFWLEVBQW1DLGNBQW5DLENBQWhCLENBQVgsQ0FBUDtBQUNBLFVBQUlJLElBQUksQ0FBQ08sSUFBTCxLQUFjLFFBQWxCLEVBQ0UsT0FBTyxJQUFQLENBREYsS0FHRSxPQUFPLEtBQVA7QUFDSCxLQU5ELENBTUUsT0FBTUMsQ0FBTixFQUFTLENBQ1Y7O0FBRUQsUUFBSTtBQUNGUixNQUFBQSxJQUFJLEdBQUdYLElBQUksQ0FBQ0MsS0FBTCxDQUFXTyxFQUFFLENBQUNPLFlBQUgsQ0FBZ0JOLElBQUksQ0FBQ08sSUFBTCxDQUFVUCxJQUFJLENBQUNRLE9BQUwsQ0FBYVYsU0FBYixDQUFWLEVBQW1DLElBQW5DLEVBQXlDLGNBQXpDLENBQWhCLENBQVgsQ0FBUDtBQUNBLFVBQUlJLElBQUksQ0FBQ08sSUFBTCxLQUFjLFFBQWxCLEVBQ0UsT0FBTyxJQUFQLENBREYsS0FHRSxPQUFPLEtBQVA7QUFDSCxLQU5ELENBTUUsT0FBTUMsQ0FBTixFQUFTO0FBQ1QsYUFBTyxLQUFQO0FBQ0Q7QUFDRjtBQWpEWSxDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgaW5qZWN0TW9kdWxlczogZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAocHJvY2Vzcy5lbnYucG14ICE9PSAnZmFsc2UnKSB7XHJcbiAgICAgIGNvbnN0IHBteCA9IHJlcXVpcmUoJ0BwbTIvaW8nKVxyXG5cclxuICAgICAgbGV0IGNvbmYgPSB7fVxyXG4gICAgICBjb25zdCBoYXNTcGVjaWZpY0NvbmZpZyA9IHR5cGVvZiBwcm9jZXNzLmVudi5pbyA9PT0gJ3N0cmluZycgfHwgcHJvY2Vzcy5lbnYudHJhY2UgPT09ICd0cnVlJ1xyXG4gICAgICAvLyBwbXggaXMgYWxyZWFkeSBpbml0LCBubyBuZWVkIHRvIGRvIGl0IHR3aWNlXHJcbiAgICAgIGlmIChoYXNTcGVjaWZpY0NvbmZpZyA9PT0gZmFsc2UpIHJldHVyblxyXG5cclxuICAgICAgaWYgKHByb2Nlc3MuZW52LmlvKSB7XHJcbiAgICAgICAgY29uc3QgaW8gPSBKU09OLnBhcnNlKHByb2Nlc3MuZW52LmlvKVxyXG4gICAgICAgIGNvbmYgPSBpby5jb25mID8gaW8uY29uZiA6IGNvbmZcclxuICAgICAgfVxyXG4gICAgICBwbXguaW5pdChPYmplY3QuYXNzaWduKHtcclxuICAgICAgICB0cmFjaW5nOiBwcm9jZXNzLmVudi50cmFjZSA9PT0gJ3RydWUnIHx8IGZhbHNlXHJcbiAgICAgIH0sIGNvbmYpKVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgaXNFU01vZHVsZShleGVjX3BhdGgpIHtcclxuICAgIHZhciBmcyA9IHJlcXVpcmUoJ2ZzJylcclxuICAgIHZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpXHJcbiAgICB2YXIgc2VtdmVyID0gcmVxdWlyZSgnc2VtdmVyJylcclxuICAgIHZhciBkYXRhXHJcblxyXG4gICAgaWYgKHNlbXZlci5zYXRpc2ZpZXMocHJvY2Vzcy52ZXJzaW9uLCAnPCAxMy4zLjAnKSlcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcblxyXG4gICAgaWYgKHBhdGguZXh0bmFtZShleGVjX3BhdGgpID09PSAnLm1qcycpXHJcbiAgICAgIHJldHVybiB0cnVlXHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihwYXRoLmRpcm5hbWUoZXhlY19wYXRoKSwgJ3BhY2thZ2UuanNvbicpKSlcclxuICAgICAgaWYgKGRhdGEudHlwZSA9PT0gJ21vZHVsZScpXHJcbiAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihwYXRoLmRpcm5hbWUoZXhlY19wYXRoKSwgJy4uJywgJ3BhY2thZ2UuanNvbicpKSlcclxuICAgICAgaWYgKGRhdGEudHlwZSA9PT0gJ21vZHVsZScpXHJcbiAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgZWxzZVxyXG4gICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=