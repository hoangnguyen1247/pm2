"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _API = _interopRequireDefault(require("./../../API"));

var _psList = _interopRequireDefault(require("../psList"));

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
    (0, _classCallCheck2["default"])(this, ServicesDetection);
    (0, _defineProperty2["default"])(this, "pm2", void 0);
    this.pm2 = new _API["default"]();
  }

  (0, _createClass2["default"])(ServicesDetection, [{
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9TeXNpbmZvL1NlcnZpY2VEZXRlY3Rpb24vU2VydmljZURldGVjdGlvbi50cyJdLCJuYW1lcyI6WyJTRVJWSUNFU19BU1NPQ0lBVElPTiIsIm1vZHVsZSIsIlNlcnZpY2VzRGV0ZWN0aW9uIiwicG0yIiwiUE0yIiwiY2IiLCJtb25pdG9yZWRTZXJ2aWNlcyIsImVyciIsInBtMl9zZXJ2aWNlcyIsImRpc2NvdmVyIiwicmVxdWlyZWRfbW9kdWxlcyIsInJlcXVpcmVkX21vbml0b3JpbmdfcHJvYmVzIiwiT2JqZWN0Iiwia2V5cyIsImluc3RhbGwiLCJhcHBzIiwiZl9wcm9jX2xpc3QiLCJsaXN0IiwicHJvY19saXN0IiwibWFwIiwicCIsIm5hbWUiLCJjbG9zZSIsInRoZW4iLCJwcm9jZXNzZXMiLCJzdXBwb3J0ZWRfc3lzdGVtcyIsImZvckVhY2giLCJwcm9jIiwic3VwX3N5cyIsInByb2NfbmFtZXMiLCJzcGxpdCIsInByb2NfbmFtZSIsImluY2x1ZGVzIiwiY21kIiwia2V5IiwibW9uaXQiLCJlIiwiY29uc29sZSIsImVycm9yIiwicmVxdWlyZSIsIm1haW4iLCJzZXJ2aWNlRGV0ZWN0aW9uIiwicHJvY2VzcyIsImRvbmUiLCJzdGFydERldGVjdGlvbiIsIml0ZXJhdGUiLCJzZXRUaW1lb3V0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0E7O0FBQ0E7O0FBRUEsSUFBTUEsb0JBQW9CLEdBQUc7QUFDM0IsbUJBQWlCO0FBQ2ZDLElBQUFBLE1BQU0sRUFBRTtBQURPLEdBRFU7QUFJM0Isd0JBQXNCO0FBQ3BCQSxJQUFBQSxNQUFNLEVBQUU7QUFEWSxHQUpLO0FBTzNCLG1CQUFpQjtBQUNmQSxJQUFBQSxNQUFNLEVBQUU7QUFETyxHQVBVO0FBVTNCLFlBQVU7QUFDUkEsSUFBQUEsTUFBTSxFQUFFO0FBREEsR0FWaUI7QUFhM0IsWUFBVTtBQUNSQSxJQUFBQSxNQUFNLEVBQUM7QUFEQyxHQWJpQjtBQWdCM0IsU0FBTztBQUNMQSxJ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Q0FBQ0MsSUFBUixLQUFpQnZDLE1BQXJCLEVBQTZCO0FBQzNCLE1BQUl3QyxnQkFBZ0IsR0FBRyxJQUFJdkMsaUJBQUosRUFBdkI7O0FBRUEsTUFBSXdDLE9BQU8sR0FBRyxTQUFWQSxPQUFVLENBQUNDLElBQUQsRUFBVTtBQUN0QkYsSUFBQUEsZ0JBQWdCLENBQUNHLGNBQWpCLENBQWdDLFlBQU07QUFDcENELE1BQUFBLElBQUk7QUFDTCxLQUZEO0FBR0QsR0FKRDs7QUFNQSxNQUFJRSxPQUFPLEdBQUcsU0FBVkEsT0FBVSxHQUFNO0FBQ2xCSCxJQUFBQSxPQUFPLENBQUMsWUFBTTtBQUNaSSxNQUFBQSxVQUFVLENBQUNELE9BQUQsRUFBVSxJQUFWLENBQVY7QUFDRCxLQUZNLENBQVA7QUFHRCxHQUpEOztBQU1BQSxFQUFBQSxPQUFPO0FBQ1IiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBQTTIgZnJvbSAnLi8uLi8uLi9BUEknXG5pbXBvcnQgcHNMaXN0IGZyb20gJy4uL3BzTGlzdCdcblxuY29uc3QgU0VSVklDRVNfQVNTT0NJQVRJT04gPSB7XG4gICdtb25nb2RiLG1vbmdvJzoge1xuICAgIG1vZHVsZTogJ3BtMi1tb25nb2RiJ1xuICB9LFxuICAncmVkaXMscmVkaXMtc2VydmVyJzoge1xuICAgIG1vZHVsZTogJ3BtMi1yZWRpcydcbiAgfSxcbiAgJ2VsYXN0aWNzZWFyY2gnOiB7XG4gICAgbW9kdWxlOiAncG0yLWVsYXN0aWNzZWFyY2gnXG4gIH0sXG4gICdkb2NrZXInOiB7XG4gICAgbW9kdWxlOiAncG0yLW1vbml0LWRvY2tlcidcbiAgfSxcbiAgJ2NvbnN1bCc6IHtcbiAgICBtb2R1bGU6J3BtMi1tb25pdC1jb25zdWwnXG4gIH0sXG4gICdwbTInOiB7XG4gICAgbW9kdWxlOiAncG0yLXByb2JlJ1xuICB9LFxuICAnZnBtJzoge1xuICAgIG1vZHVsZTogJ3BtMi1waHAtZnBtJ1xuICB9XG59XG5cbi8vICdweXRob24scHl0aG9uMyc6IHtcbi8vICAgbW9kdWxlOiAncG0yLXB5dGhvbidcbi8vIH0sXG4vLyAnbmdpbngnOiB7XG4vLyAgIG1vZHVsZTogJ3BtMi1tb25pdC1uZ2lueCdcbi8vIH0sXG4vLyAnaGFwcm94eSc6IHtcbi8vICAgbW9kdWxlOiAncG0yLW1vbml0LWhhcHJveHknXG4vLyB9LFxuLy8gJ3RyYWVmZmlrJzoge1xuLy8gICBtb2R1bGU6ICdwbTItbW9uaXQtdHJhZWZmaWsnXG4vLyB9XG5cbmNsYXNzIFNlcnZpY2VzRGV0ZWN0aW9uIHtcbiAgcG0yOiBhbnk7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5wbTIgPSBuZXcgUE0yKClcbiAgfVxuXG4gIHN0YXJ0RGV0ZWN0aW9uKGNiID0gKCkgPT4ge30pIHtcbiAgICAvLyBDaGVjayBydW5uaW5nIHByb2Jlc1xuICAgIHRoaXMubW9uaXRvcmVkU2VydmljZXMoKGVyciwgcG0yX3NlcnZpY2VzKSA9PiB7XG4gICAgICAvLyBDaGVjayBydW5uaW5nIHNlcnZpY2VzXG4gICAgICB0aGlzLmRpc2NvdmVyKChlcnIsIHJlcXVpcmVkX21vZHVsZXMpID0+IHtcbiAgICAgICAgdmFyIHJlcXVpcmVkX21vbml0b3JpbmdfcHJvYmVzID0gT2JqZWN0LmtleXMocmVxdWlyZWRfbW9kdWxlcylcbiAgICAgICAgLy8gTWFrZSB0aGUgZGlmZiBiZXR3ZWVuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBOZWVkIHRvIHN0YXJ0IGZvbGxvd2luZyBtb2R1bGVzOmApXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKF8uZGlmZmVyZW5jZShyZXF1aXJlZF9tb25pdG9yaW5nX3Byb2JlcywgcG0yX3NlcnZpY2VzKSlcbiAgICAgICAgdGhpcy5wbTIuaW5zdGFsbCgncG0yLXNlcnZlci1tb25pdCcsIChlcnIsIGFwcHMpID0+IHtcbiAgICAgICAgICBjYigpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBtb25pdG9yZWRTZXJ2aWNlcyhjYikge1xuICAgIHZhciBmX3Byb2NfbGlzdCA9IFtdXG5cbiAgICB0aGlzLnBtMi5saXN0KChlcnIsIHByb2NfbGlzdCkgPT4ge1xuICAgICAgZl9wcm9jX2xpc3QgPSBwcm9jX2xpc3QubWFwKHAgPT4ge1xuICAgICAgICByZXR1cm4gcC5uYW1lXG4gICAgICB9KVxuICAgICAgdGhpcy5wbTIuY2xvc2UoKVxuICAgICAgY2IoZXJyLCBmX3Byb2NfbGlzdClcbiAgICB9KVxuICB9XG5cbiAgZGlzY292ZXIoY2IpIHtcbiAgICBwc0xpc3QoKVxuICAgICAgLnRoZW4ocHJvY2Vzc2VzID0+IHtcbiAgICAgICAgdmFyIHN1cHBvcnRlZF9zeXN0ZW1zID0gT2JqZWN0LmtleXMoU0VSVklDRVNfQVNTT0NJQVRJT04pXG4gICAgICAgIHZhciByZXF1aXJlZF9tb2R1bGVzID0ge31cblxuICAgICAgICBwcm9jZXNzZXMuZm9yRWFjaCgocHJvYzogYW55KSA9PiB7XG4gICAgICAgICAgc3VwcG9ydGVkX3N5c3RlbXMuZm9yRWFjaChzdXBfc3lzID0+IHtcbiAgICAgICAgICAgIHZhciBwcm9jX25hbWVzID0gc3VwX3N5cy5zcGxpdCgnLCcpXG4gICAgICAgICAgICBwcm9jX25hbWVzLmZvckVhY2gocHJvY19uYW1lID0+IHtcbiAgICAgICAgICAgICAgaWYgKHByb2MubmFtZS5pbmNsdWRlcyhwcm9jX25hbWUpID09PSB0cnVlIHx8XG4gICAgICAgICAgICAgICAgICBwcm9jLmNtZC5pbmNsdWRlcyhwcm9jX25hbWUpID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IFNFUlZJQ0VTX0FTU09DSUFUSU9OW3N1cF9zeXNdLm1vZHVsZVxuICAgICAgICAgICAgICAgIHJlcXVpcmVkX21vZHVsZXNba2V5XSA9IFNFUlZJQ0VTX0FTU09DSUFUSU9OW3N1cF9zeXNdXG4gICAgICAgICAgICAgICAgcmVxdWlyZWRfbW9kdWxlc1trZXldLm1vbml0ID0gcHJvY1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiBjYihudWxsLCByZXF1aXJlZF9tb2R1bGVzKVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3Igd2hpbGUgbGlzdGluZyBwcm9jZXNzZXNgLCBlKVxuICAgICAgfSlcbiAgfVxufVxuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgdmFyIHNlcnZpY2VEZXRlY3Rpb24gPSBuZXcgU2VydmljZXNEZXRlY3Rpb24oKVxuXG4gIHZhciBwcm9jZXNzID0gKGRvbmUpID0+IHtcbiAgICBzZXJ2aWNlRGV0ZWN0aW9uLnN0YXJ0RGV0ZWN0aW9uKCgpID0+IHtcbiAgICAgIGRvbmUoKVxuICAgIH0pXG4gIH1cblxuICB2YXIgaXRlcmF0ZSA9ICgpID0+IHtcbiAgICBwcm9jZXNzKCgpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoaXRlcmF0ZSwgMzAwMClcbiAgICB9KVxuICB9XG5cbiAgaXRlcmF0ZSgpXG59XG4iXX0=