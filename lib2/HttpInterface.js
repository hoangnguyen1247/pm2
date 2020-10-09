"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _http = _interopRequireDefault(require("http"));

var _os = _interopRequireDefault(require("os"));

var _index = _interopRequireDefault(require("../index.js"));

var _url = _interopRequireDefault(require("url"));

var _constants = _interopRequireDefault(require("../constants.js"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9IdHRwSW50ZXJmYWNlLnRzIl0sIm5hbWVzIjpbInBtMiIsImNvbm5lY3QiLCJzdGFydFdlYlNlcnZlciIsImh0dHAiLCJjcmVhdGVTZXJ2ZXIiLCJyZXEiLCJyZXMiLCJzZXRIZWFkZXIiLCJwYXRoIiwidXJsVCIsInBhcnNlIiwidXJsIiwicGF0aG5hbWUiLCJsaXN0IiwiZXJyIiwiZW5kIiwiZGF0YSIsInN5c3RlbV9pbmZvIiwiaG9zdG5hbWUiLCJvcyIsInVwdGltZSIsIm1vbml0IiwibG9hZGF2ZyIsInRvdGFsX21lbSIsInRvdGFsbWVtIiwiZnJlZV9tZW0iLCJmcmVlbWVtIiwiY3B1IiwiY3B1cyIsImludGVyZmFjZXMiLCJuZXR3b3JrSW50ZXJmYWNlcyIsInByb2Nlc3NlcyIsImNzdCIsIldFQl9TVFJJUF9FTlZfVkFSUyIsImkiLCJsZW5ndGgiLCJwcm9jIiwicG0yX2VudiIsImVudiIsInN0YXR1c0NvZGUiLCJ3cml0ZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJsaXN0ZW4iLCJwcm9jZXNzIiwiUE0yX1dFQl9QT1JUIiwiV0VCX1BPUlQiLCJXRUJfSVBBRERSIiwiY29uc29sZSIsImxvZyJdLCJtYXBwaW5ncyI6Ijs7OztBQUtBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQVRBOzs7OztBQVdBO0FBRUFBLGtCQUFJQyxPQUFKLENBQVksWUFBWTtBQUN0QkMsRUFBQUEsY0FBYyxDQUFDRixpQkFBRCxDQUFkO0FBQ0QsQ0FGRDs7QUFJQSxTQUFTRSxjQUFULENBQXdCRixHQUF4QixFQUE2QjtBQUMzQkcsbUJBQUtDLFlBQUwsQ0FBa0IsVUFBVUMsR0FBVixFQUFlQyxHQUFmLEVBQW9CO0FBQ3BDO0FBQ0FBLElBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUFjLDZCQUFkLEVBQTZDLEdBQTdDO0FBQ0FELElBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUFjLDhCQUFkLEVBQThDLDhFQUE5QztBQUNBRCxJQUFBQSxHQUFHLENBQUNDLFNBQUosQ0FBYyw4QkFBZCxFQUE4QyxLQUE5QyxFQUpvQyxDQU1wQzs7QUFDQUQsSUFBQUEsR0FBRyxDQUFDQyxTQUFKLENBQWMsY0FBZCxFQUE4QixrQkFBOUI7O0FBRUEsUUFBSUMsSUFBSSxHQUFHQyxnQkFBS0MsS0FBTCxDQUFXTCxHQUFHLENBQUNNLEdBQWYsRUFBb0JDLFFBQS9COztBQUVBLFFBQUlKLElBQUksSUFBSSxHQUFaLEVBQWlCO0FBQ2Y7QUFDQVIsTUFBQUEsR0FBRyxDQUFDYSxJQUFKLENBQVMsVUFBVUMsR0FBVixFQUFlRCxJQUFmLEVBQXFCO0FBQzVCLFlBQUlDLEdBQUosRUFBUztBQUNQO0FBQ0EsaUJBQU9SLEdBQUcsQ0FBQ1MsR0FBSixDQUFRRCxHQUFSLENBQVA7QUFDRDs7QUFDRCxZQUFJRSxJQUFJLEdBQUc7QUFDVEMsVUFBQUEsV0FBVyxFQUFFO0FBQ1hDLFlBQUFBLFFBQVEsRUFBRUMsZUFBR0QsUUFBSCxFQURDO0FBRVhFLFlBQUFBLE1BQU0sRUFBRUQsZUFBR0MsTUFBSDtBQUZHLFdBREo7QUFLVEMsVUFBQUEsS0FBSyxFQUFFO0FBQ0xDLFlBQUFBLE9BQU8sRUFBRUgsZUFBR0csT0FBSCxFQURKO0FBRUxDLFlBQUFBLFNBQVMsRUFBRUosZUFBR0ssUUFBSCxFQUZOO0FBR0xDLFlBQUFBLFFBQVEsRUFBRU4sZUFBR08sT0FBSCxFQUhMO0FBSUxDLFlBQUFBLEdBQUcsRUFBRVIsZUFBR1MsSUFBSCxFQUpBO0FBS0xDLFlBQUFBLFVBQVUsRUFBRVYsZUFBR1csaUJBQUg7QUFMUCxXQUxFO0FBWVRDLFVBQUFBLFNBQVMsRUFBRWxCO0FBWkYsU0FBWDs7QUFlQSxZQUFJbUIsc0JBQUlDLGtCQUFKLEtBQTJCLElBQS9CLEVBQXFDO0FBQ25DLGVBQUssSUFBSUMsQ0FBQyxHQUFHbEIsSUFBSSxDQUFDZSxTQUFMLENBQWVJLE1BQWYsR0FBd0IsQ0FBckMsRUFBd0NELENBQUMsSUFBSSxDQUE3QyxFQUFnREEsQ0FBQyxFQUFqRCxFQUFxRDtBQUNuRCxnQkFBSUUsSUFBSSxHQUFHcEIsSUFBSSxDQUFDZSxTQUFMLENBQWVHLENBQWYsQ0FBWCxDQURtRCxDQUduRDs7QUFDQSxnQkFBSSxPQUFPRSxJQUFJLENBQUNDLE9BQVosS0FBd0IsV0FBeEIsSUFBdUMsT0FBT0QsSUFBSSxDQUFDQyxPQUFMLENBQWFDLEdBQXBCLEtBQTRCLFdBQXZFLEVBQW9GO0FBRXBGLG1CQUFPRixJQUFJLENBQUNDLE9BQUwsQ0FBYUMsR0FBcEI7QUFDRDtBQUNGOztBQUVEaEMsUUFBQUEsR0FBRyxDQUFDaUMsVUFBSixHQUFpQixHQUFqQjtBQUNBakMsUUFBQUEsR0FBRyxDQUFDa0MsS0FBSixDQUFVQyxJQUFJLENBQUNDLFNBQUwsQ0FBZTFCLElBQWYsQ0FBVjtBQUNBLGVBQU9WLEdBQUcsQ0FBQ1MsR0FBSixFQUFQO0FBRUQsT0FuQ0Q7QUFvQ0QsS0F0Q0QsTUF1Q0s7QUFDSDtBQUNBVCxNQUFBQSxHQUFHLENBQUNpQyxVQUFKLEdBQWlCLEdBQWpCO0FBQ0FqQyxNQUFBQSxHQUFHLENBQUNrQyxLQUFKLENBQVVDLElBQUksQ0FBQ0MsU0FBTCxDQUFlO0FBQUU1QixRQUFBQSxHQUFHLEVBQUU7QUFBUCxPQUFmLENBQVY7QUFDQSxhQUFPUixHQUFHLENBQUNTLEdBQUosRUFBUDtBQUNEO0FBQ0YsR0F4REQsRUF3REc0QixNQXhESCxDQXdEVUMsT0FBTyxDQUFDTixHQUFSLENBQVlPLFlBQVosSUFBNEJiLHNCQUFJYyxRQXhEMUMsRUF3RG9EZCxzQkFBSWUsVUF4RHhELEVBd0RvRSxZQUFZO0FBQzlFQyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxtQ0FBWixFQUFpRGpCLHNCQUFJZSxVQUFyRCxFQUFpRWYsc0JBQUljLFFBQXJFO0FBQ0QsR0ExREQ7QUE0REQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuICovXG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCBvcyBmcm9tICdvcyc7XG5pbXBvcnQgcG0yIGZyb20gJy4uL2luZGV4LmpzJztcbmltcG9ydCB1cmxUIGZyb20gJ3VybCc7XG5pbXBvcnQgY3N0IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XG5cbi8vIERlZmF1bHQsIGF0dGFjaCB0byBkZWZhdWx0IGxvY2FsIFBNMlxuXG5wbTIuY29ubmVjdChmdW5jdGlvbiAoKSB7XG4gIHN0YXJ0V2ViU2VydmVyKHBtMik7XG59KTtcblxuZnVuY3Rpb24gc3RhcnRXZWJTZXJ2ZXIocG0yKSB7XG4gIGh0dHAuY3JlYXRlU2VydmVyKGZ1bmN0aW9uIChyZXEsIHJlcykge1xuICAgIC8vIEFkZCBDT1JTIGhlYWRlcnMgdG8gYWxsb3cgYnJvd3NlcnMgdG8gZmV0Y2ggZGF0YSBkaXJlY3RseVxuICAgIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG4gICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycycsICdDYWNoZS1Db250cm9sLCBQcmFnbWEsIE9yaWdpbiwgQXV0aG9yaXphdGlvbiwgQ29udGVudC1UeXBlLCBYLVJlcXVlc3RlZC1XaXRoJyk7XG4gICAgcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcycsICdHRVQnKTtcblxuICAgIC8vIFdlIGFsd2F5cyBzZW5kIGpzb25cbiAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuXG4gICAgdmFyIHBhdGggPSB1cmxULnBhcnNlKHJlcS51cmwpLnBhdGhuYW1lO1xuXG4gICAgaWYgKHBhdGggPT0gJy8nKSB7XG4gICAgICAvLyBNYWluIG1vbml0IHJvdXRlXG4gICAgICBwbTIubGlzdChmdW5jdGlvbiAoZXJyLCBsaXN0KSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAvLyByZXR1cm4gcmVzLnNlbmQoZXJyKTtcbiAgICAgICAgICByZXR1cm4gcmVzLmVuZChlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgIHN5c3RlbV9pbmZvOiB7XG4gICAgICAgICAgICBob3N0bmFtZTogb3MuaG9zdG5hbWUoKSxcbiAgICAgICAgICAgIHVwdGltZTogb3MudXB0aW1lKClcbiAgICAgICAgICB9LFxuICAgICAgICAgIG1vbml0OiB7XG4gICAgICAgICAgICBsb2FkYXZnOiBvcy5sb2FkYXZnKCksXG4gICAgICAgICAgICB0b3RhbF9tZW06IG9zLnRvdGFsbWVtKCksXG4gICAgICAgICAgICBmcmVlX21lbTogb3MuZnJlZW1lbSgpLFxuICAgICAgICAgICAgY3B1OiBvcy5jcHVzKCksXG4gICAgICAgICAgICBpbnRlcmZhY2VzOiBvcy5uZXR3b3JrSW50ZXJmYWNlcygpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwcm9jZXNzZXM6IGxpc3RcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoY3N0LldFQl9TVFJJUF9FTlZfVkFSUyA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGZvciAodmFyIGkgPSBkYXRhLnByb2Nlc3Nlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdmFyIHByb2MgPSBkYXRhLnByb2Nlc3Nlc1tpXTtcblxuICAgICAgICAgICAgLy8gU3RyaXAgaW1wb3J0YW50IGVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwcm9jLnBtMl9lbnYgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBwcm9jLnBtMl9lbnYuZW52ID09PSAndW5kZWZpbmVkJykgcmV0dXJuO1xuXG4gICAgICAgICAgICBkZWxldGUgcHJvYy5wbTJfZW52LmVudjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgcmVzLndyaXRlKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgcmV0dXJuIHJlcy5lbmQoKTtcblxuICAgICAgfSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyA0MDRcbiAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA0O1xuICAgICAgcmVzLndyaXRlKEpTT04uc3RyaW5naWZ5KHsgZXJyOiAnNDA0JyB9KSk7XG4gICAgICByZXR1cm4gcmVzLmVuZCgpO1xuICAgIH1cbiAgfSkubGlzdGVuKHByb2Nlc3MuZW52LlBNMl9XRUJfUE9SVCB8fCBjc3QuV0VCX1BPUlQsIGNzdC5XRUJfSVBBRERSLCBmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coJ1dlYiBpbnRlcmZhY2UgbGlzdGVuaW5nIG9uICAlczolcycsIGNzdC5XRUJfSVBBRERSLCBjc3QuV0VCX1BPUlQpO1xuICB9KTtcblxufVxuIl19