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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9TeXNpbmZvL1NlcnZpY2VEZXRlY3Rpb24vU2VydmljZURldGVjdGlvbi50cyJdLCJuYW1lcyI6WyJTRVJWSUNFU19BU1NPQ0lBVElPTiIsIm1vZHVsZSIsIlNlcnZpY2VzRGV0ZWN0aW9uIiwicG0yIiwiUE0yIiwiY2IiLCJtb25pdG9yZWRTZXJ2aWNlcyIsImVyciIsInBtMl9zZXJ2aWNlcyIsImRpc2NvdmVyIiwicmVxdWlyZWRfbW9kdWxlcyIsInJlcXVpcmVkX21vbml0b3JpbmdfcHJvYmVzIiwiT2JqZWN0Iiwia2V5cyIsImluc3RhbGwiLCJhcHBzIiwiZl9wcm9jX2xpc3QiLCJsaXN0IiwicHJvY19saXN0IiwibWFwIiwicCIsIm5hbWUiLCJjbG9zZSIsInRoZW4iLCJwcm9jZXNzZXMiLCJzdXBwb3J0ZWRfc3lzdGVtcyIsImZvckVhY2giLCJwcm9jIiwic3VwX3N5cyIsInByb2NfbmFtZXMiLCJzcGxpdCIsInByb2NfbmFtZSIsImluY2x1ZGVzIiwiY21kIiwia2V5IiwibW9uaXQiLCJlIiwiY29uc29sZSIsImVycm9yIiwicmVxdWlyZSIsIm1haW4iLCJzZXJ2aWNlRGV0ZWN0aW9uIiwicHJvY2VzcyIsImRvbmUiLCJzdGFydERldGVjdGlvbiIsIml0ZXJhdGUiLCJzZXRUaW1lb3V0Il0sIm1hcHBpbmdzIjoiOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQSxJQUFNQSxvQkFBb0IsR0FBRztBQUMzQixtQkFBaUI7QUFDZkMsSUFBQUEsTUFBTSxFQUFFO0FBRE8sR0FEVTtBQUkzQix3QkFBc0I7QUFDcEJBLElBQUFBLE1BQU0sRUFBRTtBQURZLEdBSks7QUFPM0IsbUJBQWlCO0FBQ2ZBLElBQUFBLE1BQU0sRUFBRTtBQURPLEdBUFU7QUFVM0IsWUFBVTtBQUNSQSxJQUFBQSxNQUFNLEVBQUU7QUFEQSxHQVZpQjtBQWEzQixZQUFVO0FBQ1JBLElBQUFBLE1BQU0sRUFBQztBQURDLEdBYmlCO0FBZ0IzQixTQUFPO0FBQ0xBLElBQUFBLE1BQU0sRUFBRTtBQURILEdBaEJvQjtBQW1CM0IsU0FBTztBQUNMQSxJQUFBQSxNQUFNLEVBQUU7QUFESDtBQW5Cb0IsQ0FBN0IsQyxDQXdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBRU1DLGlCO0FBR0osK0JBQWM7QUFBQTs7QUFBQTs7QUFDWixTQUFLQyxHQUFMLEdBQVcsSUFBSUMsZUFBSixFQUFYO0FBQ0Q7Ozs7cUNBRTZCO0FBQUE7O0FBQUEsVUFBZkMsRUFBZSx1RUFBVixZQUFNLENBQUUsQ0FBRTtBQUM1QjtBQUNBLFdBQUtDLGlCQUFMLENBQXVCLFVBQUNDLEdBQUQsRUFBTUMsWUFBTixFQUF1QjtBQUM1QztBQUNBLFFBQUEsS0FBSSxDQUFDQyxRQUFMLENBQWMsVUFBQ0YsR0FBRCxFQUFNRyxnQkFBTixFQUEyQjtBQUN2QyxjQUFJQywwQkFBMEIsR0FBR0MsTUFBTSxDQUFDQyxJQUFQLENBQVlILGdCQUFaLENBQWpDLENBRHVDLENBRXZDO0FBQ0E7QUFDQTs7QUFDQSxVQUFBLEtBQUksQ0FBQ1AsR0FBTCxDQUFTVyxPQUFULENBQWlCLGtCQUFqQixFQUFxQyxVQUFDUCxHQUFELEVBQU1RLElBQU4sRUFBZTtBQUNsRFYsWUFBQUEsRUFBRTtBQUNILFdBRkQ7QUFHRCxTQVJEO0FBU0QsT0FYRDtBQVlEOzs7c0NBRWlCQSxFLEVBQUk7QUFBQTs7QUFDcEIsVUFBSVcsV0FBVyxHQUFHLEVBQWxCO0FBRUEsV0FBS2IsR0FBTCxDQUFTYyxJQUFULENBQWMsVUFBQ1YsR0FBRCxFQUFNVyxTQUFOLEVBQW9CO0FBQ2hDRixRQUFBQSxXQUFXLEdBQUdFLFNBQVMsQ0FBQ0MsR0FBVixDQUFjLFVBQUFDLENBQUMsRUFBSTtBQUMvQixpQkFBT0EsQ0FBQyxDQUFDQyxJQUFUO0FBQ0QsU0FGYSxDQUFkOztBQUdBLFFBQUEsTUFBSSxDQUFDbEIsR0FBTCxDQUFTbUIsS0FBVDs7QUFDQWpCLFFBQUFBLEVBQUUsQ0FBQ0UsR0FBRCxFQUFNUyxXQUFOLENBQUY7QUFDRCxPQU5EO0FBT0Q7Ozs2QkFFUVgsRSxFQUFJO0FBQ1gsZ0NBQ0drQixJQURILENBQ1EsVUFBQUMsU0FBUyxFQUFJO0FBQ2pCLFlBQUlDLGlCQUFpQixHQUFHYixNQUFNLENBQUNDLElBQVAsQ0FBWWIsb0JBQVosQ0FBeEI7QUFDQSxZQUFJVSxnQkFBZ0IsR0FBRyxFQUF2QjtBQUVBYyxRQUFBQSxTQUFTLENBQUNFLE9BQVYsQ0FBa0IsVUFBQ0MsSUFBRCxFQUFlO0FBQy9CRixVQUFBQSxpQkFBaUIsQ0FBQ0MsT0FBbEIsQ0FBMEIsVUFBQUUsT0FBTyxFQUFJO0FBQ25DLGdCQUFJQyxVQUFVLEdBQUdELE9BQU8sQ0FBQ0UsS0FBUixDQUFjLEdBQWQsQ0FBakI7QUFDQUQsWUFBQUEsVUFBVSxDQUFDSCxPQUFYLENBQW1CLFVBQUFLLFNBQVMsRUFBSTtBQUM5QixrQkFBSUosSUFBSSxDQUFDTixJQUFMLENBQVVXLFFBQVYsQ0FBbUJELFNBQW5CLE1BQWtDLElBQWxDLElBQ0FKLElBQUksQ0FBQ00sR0FBTCxDQUFTRCxRQUFULENBQWtCRCxTQUFsQixNQUFpQyxJQURyQyxFQUMyQztBQUN6QyxvQkFBSUcsR0FBRyxHQUFHbEMsb0JBQW9CLENBQUM0QixPQUFELENBQXBCLENBQThCM0IsTUFBeEM7QUFDQVMsZ0JBQUFBLGdCQUFnQixDQUFDd0IsR0FBRCxDQUFoQixHQUF3QmxDLG9CQUFvQixDQUFDNEIsT0FBRCxDQUE1QztBQUNBbEIsZ0JBQUFBLGdCQUFnQixDQUFDd0IsR0FBRCxDQUFoQixDQUFzQkMsS0FBdEIsR0FBOEJSLElBQTlCO0FBQ0Q7QUFDRixhQVBEO0FBUUQsV0FWRDtBQVdELFNBWkQ7QUFhQSxlQUFPdEIsRUFBRSxDQUFDLElBQUQsRUFBT0ssZ0JBQVAsQ0FBVDtBQUNELE9BbkJILFdBb0JTLFVBQUEwQixDQUFDLEVBQUk7QUFDVkMsUUFBQUEsT0FBTyxDQUFDQyxLQUFSLGtDQUErQ0YsQ0FBL0M7QUFDRCxPQXRCSDtBQXVCRDs7Ozs7O0FBR0gsSUFBSUcsT0FBTyxDQUFDQyxJQUFSLEtBQWlCdkMsTUFBckIsRUFBNkI7QUFDM0IsTUFBSXdDLGdCQUFnQixHQUFHLElBQUl2QyxpQkFBSixFQUF2Qjs7QUFFQSxNQUFJd0MsT0FBTyxHQUFHLFNBQVZBLE9BQVUsQ0FBQ0MsSUFBRCxFQUFVO0FBQ3RCRixJQUFBQSxnQkFBZ0IsQ0FBQ0csY0FBakIsQ0FBZ0MsWUFBTTtBQUNwQ0QsTUFBQUEsSUFBSTtBQUNMLEtBRkQ7QUFHRCxHQUpEOztBQU1BLE1BQUlFLE9BQU8sR0FBRyxTQUFWQSxPQUFVLEdBQU07QUFDbEJILElBQUFBLE9BQU8sQ0FBQyxZQUFNO0FBQ1pJLE1BQUFBLFVBQVUsQ0FBQ0QsT0FBRCxFQUFVLElBQVYsQ0FBVjtBQUNELEtBRk0sQ0FBUDtBQUdELEdBSkQ7O0FBTUFBLEVBQUFBLE9BQU87QUFDUiIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IFBNMiBmcm9tICcuLy4uLy4uL0FQSSdcbmltcG9ydCBwc0xpc3QgZnJvbSAnLi4vcHNMaXN0J1xuXG5jb25zdCBTRVJWSUNFU19BU1NPQ0lBVElPTiA9IHtcbiAgJ21vbmdvZGIsbW9uZ28nOiB7XG4gICAgbW9kdWxlOiAncG0yLW1vbmdvZGInXG4gIH0sXG4gICdyZWRpcyxyZWRpcy1zZXJ2ZXInOiB7XG4gICAgbW9kdWxlOiAncG0yLXJlZGlzJ1xuICB9LFxuICAnZWxhc3RpY3NlYXJjaCc6IHtcbiAgICBtb2R1bGU6ICdwbTItZWxhc3RpY3NlYXJjaCdcbiAgfSxcbiAgJ2RvY2tlcic6IHtcbiAgICBtb2R1bGU6ICdwbTItbW9uaXQtZG9ja2VyJ1xuICB9LFxuICAnY29uc3VsJzoge1xuICAgIG1vZHVsZToncG0yLW1vbml0LWNvbnN1bCdcbiAgfSxcbiAgJ3BtMic6IHtcbiAgICBtb2R1bGU6ICdwbTItcHJvYmUnXG4gIH0sXG4gICdmcG0nOiB7XG4gICAgbW9kdWxlOiAncG0yLXBocC1mcG0nXG4gIH1cbn1cblxuLy8gJ3B5dGhvbixweXRob24zJzoge1xuLy8gICBtb2R1bGU6ICdwbTItcHl0aG9uJ1xuLy8gfSxcbi8vICduZ2lueCc6IHtcbi8vICAgbW9kdWxlOiAncG0yLW1vbml0LW5naW54J1xuLy8gfSxcbi8vICdoYXByb3h5Jzoge1xuLy8gICBtb2R1bGU6ICdwbTItbW9uaXQtaGFwcm94eSdcbi8vIH0sXG4vLyAndHJhZWZmaWsnOiB7XG4vLyAgIG1vZHVsZTogJ3BtMi1tb25pdC10cmFlZmZpaydcbi8vIH1cblxuY2xhc3MgU2VydmljZXNEZXRlY3Rpb24ge1xuICBwbTI6IGFueTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnBtMiA9IG5ldyBQTTIoKVxuICB9XG5cbiAgc3RhcnREZXRlY3Rpb24oY2IgPSAoKSA9PiB7fSkge1xuICAgIC8vIENoZWNrIHJ1bm5pbmcgcHJvYmVzXG4gICAgdGhpcy5tb25pdG9yZWRTZXJ2aWNlcygoZXJyLCBwbTJfc2VydmljZXMpID0+IHtcbiAgICAgIC8vIENoZWNrIHJ1bm5pbmcgc2VydmljZXNcbiAgICAgIHRoaXMuZGlzY292ZXIoKGVyciwgcmVxdWlyZWRfbW9kdWxlcykgPT4ge1xuICAgICAgICB2YXIgcmVxdWlyZWRfbW9uaXRvcmluZ19wcm9iZXMgPSBPYmplY3Qua2V5cyhyZXF1aXJlZF9tb2R1bGVzKVxuICAgICAgICAvLyBNYWtlIHRoZSBkaWZmIGJldHdlZW5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYE5lZWQgdG8gc3RhcnQgZm9sbG93aW5nIG1vZHVsZXM6YClcbiAgICAgICAgLy8gY29uc29sZS5sb2coXy5kaWZmZXJlbmNlKHJlcXVpcmVkX21vbml0b3JpbmdfcHJvYmVzLCBwbTJfc2VydmljZXMpKVxuICAgICAgICB0aGlzLnBtMi5pbnN0YWxsKCdwbTItc2VydmVyLW1vbml0JywgKGVyciwgYXBwcykgPT4ge1xuICAgICAgICAgIGNiKClcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIG1vbml0b3JlZFNlcnZpY2VzKGNiKSB7XG4gICAgdmFyIGZfcHJvY19saXN0ID0gW11cblxuICAgIHRoaXMucG0yLmxpc3QoKGVyciwgcHJvY19saXN0KSA9PiB7XG4gICAgICBmX3Byb2NfbGlzdCA9IHByb2NfbGlzdC5tYXAocCA9PiB7XG4gICAgICAgIHJldHVybiBwLm5hbWVcbiAgICAgIH0pXG4gICAgICB0aGlzLnBtMi5jbG9zZSgpXG4gICAgICBjYihlcnIsIGZfcHJvY19saXN0KVxuICAgIH0pXG4gIH1cblxuICBkaXNjb3ZlcihjYikge1xuICAgIHBzTGlzdCgpXG4gICAgICAudGhlbihwcm9jZXNzZXMgPT4ge1xuICAgICAgICB2YXIgc3VwcG9ydGVkX3N5c3RlbXMgPSBPYmplY3Qua2V5cyhTRVJWSUNFU19BU1NPQ0lBVElPTilcbiAgICAgICAgdmFyIHJlcXVpcmVkX21vZHVsZXMgPSB7fVxuXG4gICAgICAgIHByb2Nlc3Nlcy5mb3JFYWNoKChwcm9jOiBhbnkpID0+IHtcbiAgICAgICAgICBzdXBwb3J0ZWRfc3lzdGVtcy5mb3JFYWNoKHN1cF9zeXMgPT4ge1xuICAgICAgICAgICAgdmFyIHByb2NfbmFtZXMgPSBzdXBfc3lzLnNwbGl0KCcsJylcbiAgICAgICAgICAgIHByb2NfbmFtZXMuZm9yRWFjaChwcm9jX25hbWUgPT4ge1xuICAgICAgICAgICAgICBpZiAocHJvYy5uYW1lLmluY2x1ZGVzKHByb2NfbmFtZSkgPT09IHRydWUgfHxcbiAgICAgICAgICAgICAgICAgIHByb2MuY21kLmluY2x1ZGVzKHByb2NfbmFtZSkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gU0VSVklDRVNfQVNTT0NJQVRJT05bc3VwX3N5c10ubW9kdWxlXG4gICAgICAgICAgICAgICAgcmVxdWlyZWRfbW9kdWxlc1trZXldID0gU0VSVklDRVNfQVNTT0NJQVRJT05bc3VwX3N5c11cbiAgICAgICAgICAgICAgICByZXF1aXJlZF9tb2R1bGVzW2tleV0ubW9uaXQgPSBwcm9jXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuIGNiKG51bGwsIHJlcXVpcmVkX21vZHVsZXMpXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciB3aGlsZSBsaXN0aW5nIHByb2Nlc3Nlc2AsIGUpXG4gICAgICB9KVxuICB9XG59XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICB2YXIgc2VydmljZURldGVjdGlvbiA9IG5ldyBTZXJ2aWNlc0RldGVjdGlvbigpXG5cbiAgdmFyIHByb2Nlc3MgPSAoZG9uZSkgPT4ge1xuICAgIHNlcnZpY2VEZXRlY3Rpb24uc3RhcnREZXRlY3Rpb24oKCkgPT4ge1xuICAgICAgZG9uZSgpXG4gICAgfSlcbiAgfVxuXG4gIHZhciBpdGVyYXRlID0gKCkgPT4ge1xuICAgIHByb2Nlc3MoKCkgPT4ge1xuICAgICAgc2V0VGltZW91dChpdGVyYXRlLCAzMDAwKVxuICAgIH0pXG4gIH1cblxuICBpdGVyYXRlKClcbn1cbiJdfQ==