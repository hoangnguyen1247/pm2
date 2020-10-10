"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _API = _interopRequireDefault(require("../../API"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9TeXNpbmZvL1NlcnZpY2VEZXRlY3Rpb24vU2VydmljZURldGVjdGlvbi50cyJdLCJuYW1lcyI6WyJTRVJWSUNFU19BU1NPQ0lBVElPTiIsIm1vZHVsZSIsIlNlcnZpY2VzRGV0ZWN0aW9uIiwicG0yIiwiUE0yIiwiY2IiLCJtb25pdG9yZWRTZXJ2aWNlcyIsImVyciIsInBtMl9zZXJ2aWNlcyIsImRpc2NvdmVyIiwicmVxdWlyZWRfbW9kdWxlcyIsInJlcXVpcmVkX21vbml0b3JpbmdfcHJvYmVzIiwiT2JqZWN0Iiwia2V5cyIsImluc3RhbGwiLCJhcHBzIiwiZl9wcm9jX2xpc3QiLCJsaXN0IiwicHJvY19saXN0IiwibWFwIiwicCIsIm5hbWUiLCJjbG9zZSIsInRoZW4iLCJwcm9jZXNzZXMiLCJzdXBwb3J0ZWRfc3lzdGVtcyIsImZvckVhY2giLCJwcm9jIiwic3VwX3N5cyIsInByb2NfbmFtZXMiLCJzcGxpdCIsInByb2NfbmFtZSIsImluY2x1ZGVzIiwiY21kIiwia2V5IiwibW9uaXQiLCJlIiwiY29uc29sZSIsImVycm9yIiwicmVxdWlyZSIsIm1haW4iLCJzZXJ2aWNlRGV0ZWN0aW9uIiwicHJvY2VzcyIsImRvbmUiLCJzdGFydERldGVjdGlvbiIsIml0ZXJhdGUiLCJzZXRUaW1lb3V0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0E7O0FBQ0E7O0FBRUEsSUFBTUEsb0JBQW9CLEdBQUc7QUFDM0IsbUJBQWlCO0FBQ2ZDLElBQUFBLE1BQU0sRUFBRTtBQURPLEdBRFU7QUFJM0Isd0JBQXNCO0FBQ3BCQSxJQUFBQSxNQUFNLEVBQUU7QUFEWSxHQUpLO0FBTzNCLG1CQUFpQjtBQUNmQSxJQUFBQSxNQUFNLEVBQUU7QUFETyxHQVBVO0FBVTNCLFlBQVU7QUFDUkEsSUFBQUEsTUFBTSxFQUFFO0FBREEsR0FWaUI7QUFhM0IsWUFBVTtBQUNSQSxJQUFBQSxNQUFNLEVBQUM7QUFEQyxHQWJpQjtBQWdCM0IsU0FBTztBQUNMQSxJ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Q0FBQ0MsSUFBUixLQUFpQnZDLE1BQXJCLEVBQTZCO0FBQzNCLE1BQUl3QyxnQkFBZ0IsR0FBRyxJQUFJdkMsaUJBQUosRUFBdkI7O0FBRUEsTUFBSXdDLE9BQU8sR0FBRyxTQUFWQSxPQUFVLENBQUNDLElBQUQsRUFBVTtBQUN0QkYsSUFBQUEsZ0JBQWdCLENBQUNHLGNBQWpCLENBQWdDLFlBQU07QUFDcENELE1BQUFBLElBQUk7QUFDTCxLQUZEO0FBR0QsR0FKRDs7QUFNQSxNQUFJRSxPQUFPLEdBQUcsU0FBVkEsT0FBVSxHQUFNO0FBQ2xCSCxJQUFBQSxPQUFPLENBQUMsWUFBTTtBQUNaSSxNQUFBQSxVQUFVLENBQUNELE9BQUQsRUFBVSxJQUFWLENBQVY7QUFDRCxLQUZNLENBQVA7QUFHRCxHQUpEOztBQU1BQSxFQUFBQSxPQUFPO0FBQ1IiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBQTTIgZnJvbSAnLi4vLi4vQVBJJ1xuaW1wb3J0IHBzTGlzdCBmcm9tICcuLi9wc0xpc3QnXG5cbmNvbnN0IFNFUlZJQ0VTX0FTU09DSUFUSU9OID0ge1xuICAnbW9uZ29kYixtb25nbyc6IHtcbiAgICBtb2R1bGU6ICdwbTItbW9uZ29kYidcbiAgfSxcbiAgJ3JlZGlzLHJlZGlzLXNlcnZlcic6IHtcbiAgICBtb2R1bGU6ICdwbTItcmVkaXMnXG4gIH0sXG4gICdlbGFzdGljc2VhcmNoJzoge1xuICAgIG1vZHVsZTogJ3BtMi1lbGFzdGljc2VhcmNoJ1xuICB9LFxuICAnZG9ja2VyJzoge1xuICAgIG1vZHVsZTogJ3BtMi1tb25pdC1kb2NrZXInXG4gIH0sXG4gICdjb25zdWwnOiB7XG4gICAgbW9kdWxlOidwbTItbW9uaXQtY29uc3VsJ1xuICB9LFxuICAncG0yJzoge1xuICAgIG1vZHVsZTogJ3BtMi1wcm9iZSdcbiAgfSxcbiAgJ2ZwbSc6IHtcbiAgICBtb2R1bGU6ICdwbTItcGhwLWZwbSdcbiAgfVxufVxuXG4vLyAncHl0aG9uLHB5dGhvbjMnOiB7XG4vLyAgIG1vZHVsZTogJ3BtMi1weXRob24nXG4vLyB9LFxuLy8gJ25naW54Jzoge1xuLy8gICBtb2R1bGU6ICdwbTItbW9uaXQtbmdpbngnXG4vLyB9LFxuLy8gJ2hhcHJveHknOiB7XG4vLyAgIG1vZHVsZTogJ3BtMi1tb25pdC1oYXByb3h5J1xuLy8gfSxcbi8vICd0cmFlZmZpayc6IHtcbi8vICAgbW9kdWxlOiAncG0yLW1vbml0LXRyYWVmZmlrJ1xuLy8gfVxuXG5jbGFzcyBTZXJ2aWNlc0RldGVjdGlvbiB7XG4gIHBtMjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMucG0yID0gbmV3IFBNMigpXG4gIH1cblxuICBzdGFydERldGVjdGlvbihjYiA9ICgpID0+IHt9KSB7XG4gICAgLy8gQ2hlY2sgcnVubmluZyBwcm9iZXNcbiAgICB0aGlzLm1vbml0b3JlZFNlcnZpY2VzKChlcnIsIHBtMl9zZXJ2aWNlcykgPT4ge1xuICAgICAgLy8gQ2hlY2sgcnVubmluZyBzZXJ2aWNlc1xuICAgICAgdGhpcy5kaXNjb3ZlcigoZXJyLCByZXF1aXJlZF9tb2R1bGVzKSA9PiB7XG4gICAgICAgIHZhciByZXF1aXJlZF9tb25pdG9yaW5nX3Byb2JlcyA9IE9iamVjdC5rZXlzKHJlcXVpcmVkX21vZHVsZXMpXG4gICAgICAgIC8vIE1ha2UgdGhlIGRpZmYgYmV0d2VlblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgTmVlZCB0byBzdGFydCBmb2xsb3dpbmcgbW9kdWxlczpgKVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhfLmRpZmZlcmVuY2UocmVxdWlyZWRfbW9uaXRvcmluZ19wcm9iZXMsIHBtMl9zZXJ2aWNlcykpXG4gICAgICAgIHRoaXMucG0yLmluc3RhbGwoJ3BtMi1zZXJ2ZXItbW9uaXQnLCAoZXJyLCBhcHBzKSA9PiB7XG4gICAgICAgICAgY2IoKVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgbW9uaXRvcmVkU2VydmljZXMoY2IpIHtcbiAgICB2YXIgZl9wcm9jX2xpc3QgPSBbXVxuXG4gICAgdGhpcy5wbTIubGlzdCgoZXJyLCBwcm9jX2xpc3QpID0+IHtcbiAgICAgIGZfcHJvY19saXN0ID0gcHJvY19saXN0Lm1hcChwID0+IHtcbiAgICAgICAgcmV0dXJuIHAubmFtZVxuICAgICAgfSlcbiAgICAgIHRoaXMucG0yLmNsb3NlKClcbiAgICAgIGNiKGVyciwgZl9wcm9jX2xpc3QpXG4gICAgfSlcbiAgfVxuXG4gIGRpc2NvdmVyKGNiKSB7XG4gICAgcHNMaXN0KClcbiAgICAgIC50aGVuKHByb2Nlc3NlcyA9PiB7XG4gICAgICAgIHZhciBzdXBwb3J0ZWRfc3lzdGVtcyA9IE9iamVjdC5rZXlzKFNFUlZJQ0VTX0FTU09DSUFUSU9OKVxuICAgICAgICB2YXIgcmVxdWlyZWRfbW9kdWxlcyA9IHt9XG5cbiAgICAgICAgcHJvY2Vzc2VzLmZvckVhY2goKHByb2M6IGFueSkgPT4ge1xuICAgICAgICAgIHN1cHBvcnRlZF9zeXN0ZW1zLmZvckVhY2goc3VwX3N5cyA9PiB7XG4gICAgICAgICAgICB2YXIgcHJvY19uYW1lcyA9IHN1cF9zeXMuc3BsaXQoJywnKVxuICAgICAgICAgICAgcHJvY19uYW1lcy5mb3JFYWNoKHByb2NfbmFtZSA9PiB7XG4gICAgICAgICAgICAgIGlmIChwcm9jLm5hbWUuaW5jbHVkZXMocHJvY19uYW1lKSA9PT0gdHJ1ZSB8fFxuICAgICAgICAgICAgICAgICAgcHJvYy5jbWQuaW5jbHVkZXMocHJvY19uYW1lKSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBTRVJWSUNFU19BU1NPQ0lBVElPTltzdXBfc3lzXS5tb2R1bGVcbiAgICAgICAgICAgICAgICByZXF1aXJlZF9tb2R1bGVzW2tleV0gPSBTRVJWSUNFU19BU1NPQ0lBVElPTltzdXBfc3lzXVxuICAgICAgICAgICAgICAgIHJlcXVpcmVkX21vZHVsZXNba2V5XS5tb25pdCA9IHByb2NcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gY2IobnVsbCwgcmVxdWlyZWRfbW9kdWxlcylcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHdoaWxlIGxpc3RpbmcgcHJvY2Vzc2VzYCwgZSlcbiAgICAgIH0pXG4gIH1cbn1cblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIHZhciBzZXJ2aWNlRGV0ZWN0aW9uID0gbmV3IFNlcnZpY2VzRGV0ZWN0aW9uKClcblxuICB2YXIgcHJvY2VzcyA9IChkb25lKSA9PiB7XG4gICAgc2VydmljZURldGVjdGlvbi5zdGFydERldGVjdGlvbigoKSA9PiB7XG4gICAgICBkb25lKClcbiAgICB9KVxuICB9XG5cbiAgdmFyIGl0ZXJhdGUgPSAoKSA9PiB7XG4gICAgcHJvY2VzcygoKSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KGl0ZXJhdGUsIDMwMDApXG4gICAgfSlcbiAgfVxuXG4gIGl0ZXJhdGUoKVxufVxuIl19