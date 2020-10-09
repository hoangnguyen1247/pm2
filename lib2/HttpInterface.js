"use strict";

var _http = _interopRequireDefault(require("http"));

var _os = _interopRequireDefault(require("os"));

var _index = _interopRequireDefault(require("../index.js"));

var _url = _interopRequireDefault(require("url"));

var _constants = _interopRequireDefault(require("../constants.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
// Default, attach to default local PM2
_index["default"].connect(function () {
  startWebServer(_index["default"]);
});

function startWebServer(pm2) {
  _http["default"].createServer(function (req, res) {
    // Add CORS headers to allow browsers to fetch data directly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With');
    res.setHeader('Access-Control-Allow-Methods', 'GET'); // We always send json

    res.setHeader('Content-Type', 'application/json');

    var path = _url["default"].parse(req.url).pathname;

    if (path == '/') {
      // Main monit route
      pm2.list(function (err, list) {
        if (err) {
          // return res.send(err);
          return res.end(err);
        }

        var data = {
          system_info: {
            hostname: _os["default"].hostname(),
            uptime: _os["default"].uptime()
          },
          monit: {
            loadavg: _os["default"].loadavg(),
            total_mem: _os["default"].totalmem(),
            free_mem: _os["default"].freemem(),
            cpu: _os["default"].cpus(),
            interfaces: _os["default"].networkInterfaces()
          },
          processes: list
        };

        if (_constants["default"].WEB_STRIP_ENV_VARS === true) {
          for (var i = data.processes.length - 1; i >= 0; i--) {
            var proc = data.processes[i]; // Strip important environment variables

            if (typeof proc.pm2_env === 'undefined' && typeof proc.pm2_env.env === 'undefined') return;
            delete proc.pm2_env.env;
          }
        }

        res.statusCode = 200;
        res.write(JSON.stringify(data));
        return res.end();
      });
    } else {
      // 404
      res.statusCode = 404;
      res.write(JSON.stringify({
        err: '404'
      }));
      return res.end();
    }
  }).listen(process.env.PM2_WEB_PORT || _constants["default"].WEB_PORT, _constants["default"].WEB_IPADDR, function () {
    console.log('Web interface listening on  %s:%s', _constants["default"].WEB_IPADDR, _constants["default"].WEB_PORT);
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9IdHRwSW50ZXJmYWNlLnRzIl0sIm5hbWVzIjpbInBtMiIsImNvbm5lY3QiLCJzdGFydFdlYlNlcnZlciIsImh0dHAiLCJjcmVhdGVTZXJ2ZXIiLCJyZXEiLCJyZXMiLCJzZXRIZWFkZXIiLCJwYXRoIiwidXJsVCIsInBhcnNlIiwidXJsIiwicGF0aG5hbWUiLCJsaXN0IiwiZXJyIiwiZW5kIiwiZGF0YSIsInN5c3RlbV9pbmZvIiwiaG9zdG5hbWUiLCJvcyIsInVwdGltZSIsIm1vbml0IiwibG9hZGF2ZyIsInRvdGFsX21lbSIsInRvdGFsbWVtIiwiZnJlZV9tZW0iLCJmcmVlbWVtIiwiY3B1IiwiY3B1cyIsImludGVyZmFjZXMiLCJuZXR3b3JrSW50ZXJmYWNlcyIsInByb2Nlc3NlcyIsImNzdCIsIldFQl9TVFJJUF9FTlZfVkFSUyIsImkiLCJsZW5ndGgiLCJwcm9jIiwicG0yX2VudiIsImVudiIsInN0YXR1c0NvZGUiLCJ3cml0ZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJsaXN0ZW4iLCJwcm9jZXNzIiwiUE0yX1dFQl9QT1JUIiwiV0VCX1BPUlQiLCJXRUJfSVBBRERSIiwiY29uc29sZSIsImxvZyJdLCJtYXBwaW5ncyI6Ijs7QUFLQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQVRBOzs7OztBQVdBO0FBRUFBLGtCQUFJQyxPQUFKLENBQVksWUFBWTtBQUN0QkMsRUFBQUEsY0FBYyxDQUFDRixpQkFBRCxDQUFkO0FBQ0QsQ0FGRDs7QUFJQSxTQUFTRSxjQUFULENBQXdCRixHQUF4QixFQUE2QjtBQUMzQkcsbUJBQUtDLFlBQUwsQ0FBa0IsVUFBVUMsR0FBVixFQUFlQyxHQUFmLEVBQW9CO0FBQ3BDO0FBQ0FBLElBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUFjLDZCQUFkLEVBQTZDLEdBQTdDO0FBQ0FELElBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUFjLDhCQUFkLEVBQThDLDhFQUE5QztBQUNBRCxJQUFBQSxHQUFHLENBQUNDLFNBQUosQ0FBYyw4QkFBZCxFQUE4QyxLQUE5QyxFQUpvQyxDQU1wQzs7QUFDQUQsSUFBQUEsR0FBRyxDQUFDQyxTQUFKLENBQWMsY0FBZCxFQUE4QixrQkFBOUI7O0FBRUEsUUFBSUMsSUFBSSxHQUFHQyxnQkFBS0MsS0FBTCxDQUFXTCxHQUFHLENBQUNNLEdBQWYsRUFBb0JDLFFBQS9COztBQUVBLFFBQUlKLElBQUksSUFBSSxHQUFaLEVBQWlCO0FBQ2Y7QUFDQVIsTUFBQUEsR0FBRyxDQUFDYSxJQUFKLENBQVMsVUFBVUMsR0FBVixFQUFlRCxJQUFmLEVBQXFCO0FBQzVCLFlBQUlDLEdBQUosRUFBUztBQUNQO0FBQ0EsaUJBQU9SLEdBQUcsQ0FBQ1MsR0FBSixDQUFRRCxHQUFSLENBQVA7QUFDRDs7QUFDRCxZQUFJRSxJQUFJLEdBQUc7QUFDVEMsVUFBQUEsV0FBVyxFQUFFO0FBQ1hDLFlBQUFBLFFBQVEsRUFBRUMsZUFBR0QsUUFBSCxFQURDO0FBRVhFLFlBQUFBLE1BQU0sRUFBRUQsZUFBR0MsTUFBSDtBQUZHLFdBREo7QUFLVEMsVUFBQUEsS0FBSyxFQUFFO0FBQ0xDLFlBQUFBLE9BQU8sRUFBRUgsZUFBR0csT0FBSCxFQURKO0FBRUxDLFlBQUFBLFNBQVMsRUFBRUosZUFBR0ssUUFBSCxFQUZOO0FBR0xDLFlBQUFBLFFBQVEsRUFBRU4sZUFBR08sT0FBSCxFQUhMO0FBSUxDLFlBQUFBLEdBQUcsRUFBRVIsZUFBR1MsSUFBSCxFQUpBO0FBS0xDLFlBQUFBLFVBQVUsRUFBRVYsZUFBR1csaUJBQUg7QUFMUCxXQUxFO0FBWVRDLFVBQUFBLFNBQVMsRUFBRWxCO0FBWkYsU0FBWDs7QUFlQSxZQUFJbUIsc0JBQUlDLGtCQUFKLEtBQTJCLElBQS9CLEVBQXFDO0FBQ25DLGVBQUssSUFBSUMsQ0FBQyxHQUFHbEIsSUFBSSxDQUFDZSxTQUFMLENBQWVJLE1BQWYsR0FBd0IsQ0FBckMsRUFBd0NELENBQUMsSUFBSSxDQUE3QyxFQUFnREEsQ0FBQyxFQUFqRCxFQUFxRDtBQUNuRCxnQkFBSUUsSUFBSSxHQUFHcEIsSUFBSSxDQUFDZSxTQUFMLENBQWVHLENBQWYsQ0FBWCxDQURtRCxDQUduRDs7QUFDQSxnQkFBSSxPQUFPRSxJQUFJLENBQUNDLE9BQVosS0FBd0IsV0FBeEIsSUFBdUMsT0FBT0QsSUFBSSxDQUFDQyxPQUFMLENBQWFDLEdBQXBCLEtBQTRCLFdBQXZFLEVBQW9GO0FBRXBGLG1CQUFPRixJQUFJLENBQUNDLE9BQUwsQ0FBYUMsR0FBcEI7QUFDRDtBQUNGOztBQUVEaEMsUUFBQUEsR0FBRyxDQUFDaUMsVUFBSixHQUFpQixHQUFqQjtBQUNBakMsUUFBQUEsR0FBRyxDQUFDa0MsS0FBSixDQUFVQyxJQUFJLENBQUNDLFNBQUwsQ0FBZTFCLElBQWYsQ0FBVjtBQUNBLGVBQU9WLEdBQUcsQ0FBQ1MsR0FBSixFQUFQO0FBRUQsT0FuQ0Q7QUFvQ0QsS0F0Q0QsTUF1Q0s7QUFDSDtBQUNBVCxNQUFBQSxHQUFHLENBQUNpQyxVQUFKLEdBQWlCLEdBQWpCO0FBQ0FqQyxNQUFBQSxHQUFHLENBQUNrQyxLQUFKLENBQVVDLElBQUksQ0FBQ0MsU0FBTCxDQUFlO0FBQUU1QixRQUFBQSxHQUFHLEVBQUU7QUFBUCxPQUFmLENBQVY7QUFDQSxhQUFPUixHQUFHLENBQUNTLEdBQUosRUFBUDtBQUNEO0FBQ0YsR0F4REQsRUF3REc0QixNQXhESCxDQXdEVUMsT0FBTyxDQUFDTixHQUFSLENBQVlPLFlBQVosSUFBNEJiLHNCQUFJYyxRQXhEMUMsRUF3RG9EZCxzQkFBSWUsVUF4RHhELEVBd0RvRSxZQUFZO0FBQzlFQyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxtQ0FBWixFQUFpRGpCLHNCQUFJZSxVQUFyRCxFQUFpRWYsc0JBQUljLFFBQXJFO0FBQ0QsR0ExREQ7QUE0REQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgbGljZW5zZSB0aGF0XHJcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxyXG4gKi9cclxuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XHJcbmltcG9ydCBvcyBmcm9tICdvcyc7XHJcbmltcG9ydCBwbTIgZnJvbSAnLi4vaW5kZXguanMnO1xyXG5pbXBvcnQgdXJsVCBmcm9tICd1cmwnO1xyXG5pbXBvcnQgY3N0IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XHJcblxyXG4vLyBEZWZhdWx0LCBhdHRhY2ggdG8gZGVmYXVsdCBsb2NhbCBQTTJcclxuXHJcbnBtMi5jb25uZWN0KGZ1bmN0aW9uICgpIHtcclxuICBzdGFydFdlYlNlcnZlcihwbTIpO1xyXG59KTtcclxuXHJcbmZ1bmN0aW9uIHN0YXJ0V2ViU2VydmVyKHBtMikge1xyXG4gIGh0dHAuY3JlYXRlU2VydmVyKGZ1bmN0aW9uIChyZXEsIHJlcykge1xyXG4gICAgLy8gQWRkIENPUlMgaGVhZGVycyB0byBhbGxvdyBicm93c2VycyB0byBmZXRjaCBkYXRhIGRpcmVjdGx5XHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO1xyXG4gICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycycsICdDYWNoZS1Db250cm9sLCBQcmFnbWEsIE9yaWdpbiwgQXV0aG9yaXphdGlvbiwgQ29udGVudC1UeXBlLCBYLVJlcXVlc3RlZC1XaXRoJyk7XHJcbiAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJywgJ0dFVCcpO1xyXG5cclxuICAgIC8vIFdlIGFsd2F5cyBzZW5kIGpzb25cclxuICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XHJcblxyXG4gICAgdmFyIHBhdGggPSB1cmxULnBhcnNlKHJlcS51cmwpLnBhdGhuYW1lO1xyXG5cclxuICAgIGlmIChwYXRoID09ICcvJykge1xyXG4gICAgICAvLyBNYWluIG1vbml0IHJvdXRlXHJcbiAgICAgIHBtMi5saXN0KGZ1bmN0aW9uIChlcnIsIGxpc3QpIHtcclxuICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAvLyByZXR1cm4gcmVzLnNlbmQoZXJyKTtcclxuICAgICAgICAgIHJldHVybiByZXMuZW5kKGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgc3lzdGVtX2luZm86IHtcclxuICAgICAgICAgICAgaG9zdG5hbWU6IG9zLmhvc3RuYW1lKCksXHJcbiAgICAgICAgICAgIHVwdGltZTogb3MudXB0aW1lKClcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBtb25pdDoge1xyXG4gICAgICAgICAgICBsb2FkYXZnOiBvcy5sb2FkYXZnKCksXHJcbiAgICAgICAgICAgIHRvdGFsX21lbTogb3MudG90YWxtZW0oKSxcclxuICAgICAgICAgICAgZnJlZV9tZW06IG9zLmZyZWVtZW0oKSxcclxuICAgICAgICAgICAgY3B1OiBvcy5jcHVzKCksXHJcbiAgICAgICAgICAgIGludGVyZmFjZXM6IG9zLm5ldHdvcmtJbnRlcmZhY2VzKClcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBwcm9jZXNzZXM6IGxpc3RcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoY3N0LldFQl9TVFJJUF9FTlZfVkFSUyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IGRhdGEucHJvY2Vzc2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHZhciBwcm9jID0gZGF0YS5wcm9jZXNzZXNbaV07XHJcblxyXG4gICAgICAgICAgICAvLyBTdHJpcCBpbXBvcnRhbnQgZW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcHJvYy5wbTJfZW52ID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcHJvYy5wbTJfZW52LmVudiA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIGRlbGV0ZSBwcm9jLnBtMl9lbnYuZW52O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XHJcbiAgICAgICAgcmVzLndyaXRlKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgICAgICByZXR1cm4gcmVzLmVuZCgpO1xyXG5cclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyA0MDRcclxuICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDQ7XHJcbiAgICAgIHJlcy53cml0ZShKU09OLnN0cmluZ2lmeSh7IGVycjogJzQwNCcgfSkpO1xyXG4gICAgICByZXR1cm4gcmVzLmVuZCgpO1xyXG4gICAgfVxyXG4gIH0pLmxpc3Rlbihwcm9jZXNzLmVudi5QTTJfV0VCX1BPUlQgfHwgY3N0LldFQl9QT1JULCBjc3QuV0VCX0lQQUREUiwgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc29sZS5sb2coJ1dlYiBpbnRlcmZhY2UgbGlzdGVuaW5nIG9uICAlczolcycsIGNzdC5XRUJfSVBBRERSLCBjc3QuV0VCX1BPUlQpO1xyXG4gIH0pO1xyXG5cclxufVxyXG4iXX0=