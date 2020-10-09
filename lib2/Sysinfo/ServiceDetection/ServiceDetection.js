"use strict";

var _API = _interopRequireDefault(require("./../../API"));

var _psList = _interopRequireDefault(require("../psList"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var SERVICES_ASSOCIATION = {
  'mongodb,mongo': {
    module: 'pm2-mongodb'
  },
  'redis,redis-server': {
    module: 'pm2-redis'
  },
  'elasticsearch': {
    module: 'pm2-elasticsearch'
  },
  'docker': {
    module: 'pm2-monit-docker'
  },
  'consul': {
    module: 'pm2-monit-consul'
  },
  'pm2': {
    module: 'pm2-probe'
  },
  'fpm': {
    module: 'pm2-php-fpm'
  }
}; // 'python,python3': {
//   module: 'pm2-python'
// },
// 'nginx': {
//   module: 'pm2-monit-nginx'
// },
// 'haproxy': {
//   module: 'pm2-monit-haproxy'
// },
// 'traeffik': {
//   module: 'pm2-monit-traeffik'
// }

var ServicesDetection = /*#__PURE__*/function () {
  function ServicesDetection() {
    _classCallCheck(this, ServicesDetection);

    _defineProperty(this, "pm2", void 0);

    this.pm2 = new _API["default"]();
  }

  _createClass(ServicesDetection, [{
    key: "startDetection",
    value: function startDetection() {
      var _this = this;

      var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
      // Check running probes
      this.monitoredServices(function (err, pm2_services) {
        // Check running services
        _this.discover(function (err, required_modules) {
          var required_monitoring_probes = Object.keys(required_modules); // Make the diff between
          // console.log(`Need to start following modules:`)
          // console.log(_.difference(required_monitoring_probes, pm2_services))

          _this.pm2.install('pm2-server-monit', function (err, apps) {
            cb();
          });
        });
      });
    }
  }, {
    key: "monitoredServices",
    value: function monitoredServices(cb) {
      var _this2 = this;

      var f_proc_list = [];
      this.pm2.list(function (err, proc_list) {
        f_proc_list = proc_list.map(function (p) {
          return p.name;
        });

        _this2.pm2.close();

        cb(err, f_proc_list);
      });
    }
  }, {
    key: "discover",
    value: function discover(cb) {
      (0, _psList["default"])().then(function (processes) {
        var supported_systems = Object.keys(SERVICES_ASSOCIATION);
        var required_modules = {};
        processes.forEach(function (proc) {
          supported_systems.forEach(function (sup_sys) {
            var proc_names = sup_sys.split(',');
            proc_names.forEach(function (proc_name) {
              if (proc.name.includes(proc_name) === true || proc.cmd.includes(proc_name) === true) {
                var key = SERVICES_ASSOCIATION[sup_sys].module;
                required_modules[key] = SERVICES_ASSOCIATION[sup_sys];
                required_modules[key].monit = proc;
              }
            });
          });
        });
        return cb(null, required_modules);
      })["catch"](function (e) {
        console.error("Error while listing processes", e);
      });
    }
  }]);

  return ServicesDetection;
}();

if (require.main === module) {
  var serviceDetection = new ServicesDetection();

  var process = function process(done) {
    serviceDetection.startDetection(function () {
      done();
    });
  };

  var iterate = function iterate() {
    process(function () {
      setTimeout(iterate, 3000);
    });
  };

  iterate();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9TeXNpbmZvL1NlcnZpY2VEZXRlY3Rpb24vU2VydmljZURldGVjdGlvbi50cyJdLCJuYW1lcyI6WyJTRVJWSUNFU19BU1NPQ0lBVElPTiIsIm1vZHVsZSIsIlNlcnZpY2VzRGV0ZWN0aW9uIiwicG0yIiwiUE0yIiwiY2IiLCJtb25pdG9yZWRTZXJ2aWNlcyIsImVyciIsInBtMl9zZXJ2aWNlcyIsImRpc2NvdmVyIiwicmVxdWlyZWRfbW9kdWxlcyIsInJlcXVpcmVkX21vbml0b3JpbmdfcHJvYmVzIiwiT2JqZWN0Iiwia2V5cyIsImluc3RhbGwiLCJhcHBzIiwiZl9wcm9jX2xpc3QiLCJsaXN0IiwicHJvY19saXN0IiwibWFwIiwicCIsIm5hbWUiLCJjbG9zZSIsInRoZW4iLCJwcm9jZXNzZXMiLCJzdXBwb3J0ZWRfc3lzdGVtcyIsImZvckVhY2giLCJwcm9jIiwic3VwX3N5cyIsInByb2NfbmFtZXMiLCJzcGxpdCIsInByb2NfbmFtZSIsImluY2x1ZGVzIiwiY21kIiwia2V5IiwibW9uaXQiLCJlIiwiY29uc29sZSIsImVycm9yIiwicmVxdWlyZSIsIm1haW4iLCJzZXJ2aWNlRGV0ZWN0aW9uIiwicHJvY2VzcyIsImRvbmUiLCJzdGFydERldGVjdGlvbiIsIml0ZXJhdGUiLCJzZXRUaW1lb3V0Il0sIm1hcHBpbmdzIjoiOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQSxJQUFNQSxvQkFBb0IsR0FBRztBQUMzQixtQkFBaUI7QUFDZkMsSUFBQUEsTUFBTSxFQUFFO0FBRE8sR0FEVTtBQUkzQix3QkFBc0I7QUFDcEJBLElBQUFBLE1BQU0sRUFBRTtBQURZLEdBSks7QUFPM0IsbUJBQWlCO0FBQ2ZBLElBQUFBLE1BQU0sRUFBRTtBQURPLEdBUFU7QUFVM0IsWUFBVTtBQUNSQSxJQUFBQSxNQUFNLEVBQUU7QUFEQSxHQVZpQjtBQWEzQixZQUFVO0FBQ1JBLElBQUFBLE1BQU0sRUFBQztBQURDLEdBYmlCO0FBZ0IzQixTQUFPO0FBQ0xB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T0FBTyxDQUFDQyxJQUFSLEtBQWlCdkMsTUFBckIsRUFBNkI7QUFDM0IsTUFBSXdDLGdCQUFnQixHQUFHLElBQUl2QyxpQkFBSixFQUF2Qjs7QUFFQSxNQUFJd0MsT0FBTyxHQUFHLFNBQVZBLE9BQVUsQ0FBQ0MsSUFBRCxFQUFVO0FBQ3RCRixJQUFBQSxnQkFBZ0IsQ0FBQ0csY0FBakIsQ0FBZ0MsWUFBTTtBQUNwQ0QsTUFBQUEsSUFBSTtBQUNMLEtBRkQ7QUFHRCxHQUpEOztBQU1BLE1BQUlFLE9BQU8sR0FBRyxTQUFWQSxPQUFVLEdBQU07QUFDbEJILElBQUFBLE9BQU8sQ0FBQyxZQUFNO0FBQ1pJLE1BQUFBLFVBQVUsQ0FBQ0QsT0FBRCxFQUFVLElBQVYsQ0FBVjtBQUNELEtBRk0sQ0FBUDtBQUdELEdBSkQ7O0FBTUFBLEVBQUFBLE9BQU87QUFDUiIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgUE0yIGZyb20gJy4vLi4vLi4vQVBJJ1xyXG5pbXBvcnQgcHNMaXN0IGZyb20gJy4uL3BzTGlzdCdcclxuXHJcbmNvbnN0IFNFUlZJQ0VTX0FTU09DSUFUSU9OID0ge1xyXG4gICdtb25nb2RiLG1vbmdvJzoge1xyXG4gICAgbW9kdWxlOiAncG0yLW1vbmdvZGInXHJcbiAgfSxcclxuICAncmVkaXMscmVkaXMtc2VydmVyJzoge1xyXG4gICAgbW9kdWxlOiAncG0yLXJlZGlzJ1xyXG4gIH0sXHJcbiAgJ2VsYXN0aWNzZWFyY2gnOiB7XHJcbiAgICBtb2R1bGU6ICdwbTItZWxhc3RpY3NlYXJjaCdcclxuICB9LFxyXG4gICdkb2NrZXInOiB7XHJcbiAgICBtb2R1bGU6ICdwbTItbW9uaXQtZG9ja2VyJ1xyXG4gIH0sXHJcbiAgJ2NvbnN1bCc6IHtcclxuICAgIG1vZHVsZToncG0yLW1vbml0LWNvbnN1bCdcclxuICB9LFxyXG4gICdwbTInOiB7XHJcbiAgICBtb2R1bGU6ICdwbTItcHJvYmUnXHJcbiAgfSxcclxuICAnZnBtJzoge1xyXG4gICAgbW9kdWxlOiAncG0yLXBocC1mcG0nXHJcbiAgfVxyXG59XHJcblxyXG4vLyAncHl0aG9uLHB5dGhvbjMnOiB7XHJcbi8vICAgbW9kdWxlOiAncG0yLXB5dGhvbidcclxuLy8gfSxcclxuLy8gJ25naW54Jzoge1xyXG4vLyAgIG1vZHVsZTogJ3BtMi1tb25pdC1uZ2lueCdcclxuLy8gfSxcclxuLy8gJ2hhcHJveHknOiB7XHJcbi8vICAgbW9kdWxlOiAncG0yLW1vbml0LWhhcHJveHknXHJcbi8vIH0sXHJcbi8vICd0cmFlZmZpayc6IHtcclxuLy8gICBtb2R1bGU6ICdwbTItbW9uaXQtdHJhZWZmaWsnXHJcbi8vIH1cclxuXHJcbmNsYXNzIFNlcnZpY2VzRGV0ZWN0aW9uIHtcclxuICBwbTI6IGFueTtcclxuXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLnBtMiA9IG5ldyBQTTIoKVxyXG4gIH1cclxuXHJcbiAgc3RhcnREZXRlY3Rpb24oY2IgPSAoKSA9PiB7fSkge1xyXG4gICAgLy8gQ2hlY2sgcnVubmluZyBwcm9iZXNcclxuICAgIHRoaXMubW9uaXRvcmVkU2VydmljZXMoKGVyciwgcG0yX3NlcnZpY2VzKSA9PiB7XHJcbiAgICAgIC8vIENoZWNrIHJ1bm5pbmcgc2VydmljZXNcclxuICAgICAgdGhpcy5kaXNjb3ZlcigoZXJyLCByZXF1aXJlZF9tb2R1bGVzKSA9PiB7XHJcbiAgICAgICAgdmFyIHJlcXVpcmVkX21vbml0b3JpbmdfcHJvYmVzID0gT2JqZWN0LmtleXMocmVxdWlyZWRfbW9kdWxlcylcclxuICAgICAgICAvLyBNYWtlIHRoZSBkaWZmIGJldHdlZW5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgTmVlZCB0byBzdGFydCBmb2xsb3dpbmcgbW9kdWxlczpgKVxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKF8uZGlmZmVyZW5jZShyZXF1aXJlZF9tb25pdG9yaW5nX3Byb2JlcywgcG0yX3NlcnZpY2VzKSlcclxuICAgICAgICB0aGlzLnBtMi5pbnN0YWxsKCdwbTItc2VydmVyLW1vbml0JywgKGVyciwgYXBwcykgPT4ge1xyXG4gICAgICAgICAgY2IoKVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0pXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgbW9uaXRvcmVkU2VydmljZXMoY2IpIHtcclxuICAgIHZhciBmX3Byb2NfbGlzdCA9IFtdXHJcblxyXG4gICAgdGhpcy5wbTIubGlzdCgoZXJyLCBwcm9jX2xpc3QpID0+IHtcclxuICAgICAgZl9wcm9jX2xpc3QgPSBwcm9jX2xpc3QubWFwKHAgPT4ge1xyXG4gICAgICAgIHJldHVybiBwLm5hbWVcclxuICAgICAgfSlcclxuICAgICAgdGhpcy5wbTIuY2xvc2UoKVxyXG4gICAgICBjYihlcnIsIGZfcHJvY19saXN0KVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIGRpc2NvdmVyKGNiKSB7XHJcbiAgICBwc0xpc3QoKVxyXG4gICAgICAudGhlbihwcm9jZXNzZXMgPT4ge1xyXG4gICAgICAgIHZhciBzdXBwb3J0ZWRfc3lzdGVtcyA9IE9iamVjdC5rZXlzKFNFUlZJQ0VTX0FTU09DSUFUSU9OKVxyXG4gICAgICAgIHZhciByZXF1aXJlZF9tb2R1bGVzID0ge31cclxuXHJcbiAgICAgICAgcHJvY2Vzc2VzLmZvckVhY2goKHByb2M6IGFueSkgPT4ge1xyXG4gICAgICAgICAgc3VwcG9ydGVkX3N5c3RlbXMuZm9yRWFjaChzdXBfc3lzID0+IHtcclxuICAgICAgICAgICAgdmFyIHByb2NfbmFtZXMgPSBzdXBfc3lzLnNwbGl0KCcsJylcclxuICAgICAgICAgICAgcHJvY19uYW1lcy5mb3JFYWNoKHByb2NfbmFtZSA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKHByb2MubmFtZS5pbmNsdWRlcyhwcm9jX25hbWUpID09PSB0cnVlIHx8XHJcbiAgICAgICAgICAgICAgICAgIHByb2MuY21kLmluY2x1ZGVzKHByb2NfbmFtZSkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBTRVJWSUNFU19BU1NPQ0lBVElPTltzdXBfc3lzXS5tb2R1bGVcclxuICAgICAgICAgICAgICAgIHJlcXVpcmVkX21vZHVsZXNba2V5XSA9IFNFUlZJQ0VTX0FTU09DSUFUSU9OW3N1cF9zeXNdXHJcbiAgICAgICAgICAgICAgICByZXF1aXJlZF9tb2R1bGVzW2tleV0ubW9uaXQgPSBwcm9jXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiBjYihudWxsLCByZXF1aXJlZF9tb2R1bGVzKVxyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goZSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3Igd2hpbGUgbGlzdGluZyBwcm9jZXNzZXNgLCBlKVxyXG4gICAgICB9KVxyXG4gIH1cclxufVxyXG5cclxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XHJcbiAgdmFyIHNlcnZpY2VEZXRlY3Rpb24gPSBuZXcgU2VydmljZXNEZXRlY3Rpb24oKVxyXG5cclxuICB2YXIgcHJvY2VzcyA9IChkb25lKSA9PiB7XHJcbiAgICBzZXJ2aWNlRGV0ZWN0aW9uLnN0YXJ0RGV0ZWN0aW9uKCgpID0+IHtcclxuICAgICAgZG9uZSgpXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgdmFyIGl0ZXJhdGUgPSAoKSA9PiB7XHJcbiAgICBwcm9jZXNzKCgpID0+IHtcclxuICAgICAgc2V0VGltZW91dChpdGVyYXRlLCAzMDAwKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIGl0ZXJhdGUoKVxyXG59XHJcbiJdfQ==