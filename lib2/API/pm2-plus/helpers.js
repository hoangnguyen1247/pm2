"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _constants = _interopRequireDefault(require("../../../constants"));

var _Common = _interopRequireDefault(require("../../Common"));

var _chalk = _interopRequireDefault(require("chalk"));

var _forEach = _interopRequireDefault(require("async/forEach"));

var _open = _interopRequireDefault(require("../../tools/open"));

var _semver = _interopRequireDefault(require("semver"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function processesAreAlreadyMonitored(CLI, cb) {
  CLI.Client.executeRemote('getMonitorData', {}, function (err, list) {
    if (err) return cb(false);
    var l = list.filter(function (l) {
      return l.pm2_env.km_link == true;
    });
    var l2 = list.filter(function (l) {
      return l.name == 'pm2-server-monit';
    });
    return cb(l.length > 0 && l2.length > 0 ? true : false);
  });
}

function _default(CLI) {
  CLI.prototype.openDashboard = function () {
    var _this = this;

    if (!this.gl_interact_infos) {
      _Common["default"].printError(_chalk["default"].bold.white('Agent if offline, type `$ pm2 plus` to log in'));

      return this.exitCli(_constants["default"].ERROR_EXIT);
    }

    var uri = "https://app.pm2.io/#/r/".concat(this.gl_interact_infos.public_key);
    console.log(_constants["default"].PM2_IO_MSG + " Opening ".concat(uri));
    (0, _open["default"])(uri);
    setTimeout(function (_) {
      _this.exitCli();
    }, 200);
  };

  CLI.prototype.clearSetup = function (opts, cb) {
    var _this2 = this;

    var self = this;
    var modules = ['event-loop-inspector'];
    this.gl_is_km_linked = false;

    if (_semver["default"].satisfies(process.version, '< 10.0.0')) {
      modules.push('v8-profiler-node8');
    }

    (0, _forEach["default"])(modules, function (_module, next) {
      self.uninstall(_this2, _module, function () {
        next();
      });
    }, function (err) {
      _this2.reload('all', function () {
        return cb();
      });
    });
  };
  /**
   * Install required package and enable flags for current running processes
   */


  CLI.prototype.minimumSetup = function (opts, cb) {
    var self = this;
    this.gl_is_km_linked = true;

    function install(cb) {
      var modules = [];

      if (opts.type === 'enterprise' || opts.type === 'plus') {
        modules = ['pm2-logrotate', 'pm2-server-monit'];

        if (_semver["default"].satisfies(process.version, '< 8.0.0')) {
          modules.push('v8-profiler-node8');
        }

        if (opts.type === 'enterprise') {
          modules.push('deep-metrics');
        }
      }

      (0, _forEach["default"])(modules, function (_module, next) {
        self.install(self, _module, {}, function () {
          next();
        });
      }, function (err) {
        self.reload('all', function () {
          return cb();
        });
      });
    }

    processesAreAlreadyMonitored(self, function (already_monitored) {
      if (already_monitored) {
        console.log(_constants["default"].PM2_IO_MSG + " PM2 ".concat(opts.type || '', " bundle already installed"));
        return cb();
      }

      if (opts.installAll) return install(cb); // promptly.confirm(chalk.bold('Install all pm2 plus dependencies ? (y/n)'), (err, answer) => {
      //   if (!err && answer === true)

      return install(cb); // self.reload('all', () => {
      //     return cb()
      //   })
      // });
    });
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvcG0yLXBsdXMvaGVscGVycy50cyJdLCJuYW1lcyI6WyJwcm9jZXNzZXNBcmVBbHJlYWR5TW9uaXRvcmVkIiwiQ0xJIiwiY2IiLCJDbGllbnQiLCJleGVjdXRlUmVtb3RlIiwiZXJyIiwibGlzdCIsImwiLCJmaWx0ZXIiLCJwbTJfZW52Iiwia21fbGluayIsImwyIiwibmFtZSIsImxlbmd0aCIsInByb3RvdHlwZSIsIm9wZW5EYXNoYm9hcmQiLCJnbF9pbnRlcmFjdF9pbmZvcyIsIkNvbW1vbiIsInByaW50RXJyb3IiLCJjaGFsayIsImJvbGQiLCJ3aGl0ZSIsImV4aXRDbGkiLCJjc3QiLCJFUlJPUl9FWElUIiwidXJpIiwicHVibGljX2tleSIsImNvbnNvbGUiLCJsb2ciLCJQTTJfSU9fTVNHIiwic2V0VGltZW91dCIsIl8iLCJjbGVhclNldHVwIiwib3B0cyIsInNlbGYiLCJtb2R1bGVzIiwiZ2xfaXNfa21fbGlua2VkIiwic2VtdmVyIiwic2F0aXNmaWVzIiwicHJvY2VzcyIsInZlcnNpb24iLCJwdXNoIiwiX21vZHVsZSIsIm5leHQiLCJ1bmluc3RhbGwiLCJyZWxvYWQiLCJtaW5pbXVtU2V0dXAiLCJpbnN0YWxsIiwidHlwZSIsImFscmVhZHlfbW9uaXRvcmVkIiwiaW5zdGFsbEFsbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBR0EsU0FBU0EsNEJBQVQsQ0FBc0NDLEdBQXRDLEVBQTJDQyxFQUEzQyxFQUErQztBQUM3Q0QsRUFBQUEsR0FBRyxDQUFDRSxNQUFKLENBQVdDLGFBQVgsQ0FBeUIsZ0JBQXpCLEVBQTJDLEVBQTNDLEVBQStDLFVBQVNDLEdBQVQsRUFBY0MsSUFBZCxFQUFvQjtBQUNqRSxRQUFJRCxHQUFKLEVBQVMsT0FBT0gsRUFBRSxDQUFDLEtBQUQsQ0FBVDtBQUNULFFBQUlLLENBQUMsR0FBR0QsSUFBSSxDQUFDRSxNQUFMLENBQVksVUFB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QUFDRCxZQUFJUixJQUFJLENBQUNlLElBQUwsS0FBYyxZQUFsQixFQUFnQztBQUM5QmIsVUFBQUEsT0FBTyxDQUFDTSxJQUFSLENBQWEsY0FBYjtBQUNEO0FBQ0Y7O0FBRUQsK0JBQVFOLE9BQVIsRUFBaUIsVUFBQ08sT0FBRCxFQUFVQyxJQUFWLEVBQW1CO0FBQ2xDVCxRQUFBQSxJQUFJLENBQUNhLE9BQUwsQ0FBYWIsSUFBYixFQUFtQlEsT0FBbkIsRUFBNEIsRUFBNUIsRUFBZ0MsWUFBTTtBQUNwQ0MsVUFBQUEsSUFBSTtBQUNMLFNBRkQ7QUFHRCxPQUpELEVBSUcsVUFBQ3RDLEdBQUQsRUFBUztBQUNWNkIsUUFBQUEsSUFBSSxDQUFDVyxNQUFMLENBQVksS0FBWixFQUFtQixZQUFNO0FBQ3ZCLGlCQUFPM0MsRUFBRSxFQUFUO0FBQ0QsU0FGRDtBQUdELE9BUkQ7QUFTRDs7QUFFREYsSUFBQUEsNEJBQTRCLENBQUNrQyxJQUFELEVBQU8sVUFBQ2UsaUJBQUQsRUFBdUI7QUFDeEQsVUFBSUEsaUJBQUosRUFBdUI7QUFDckJ0QixRQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUwsc0JBQUlNLFVBQUosa0JBQXlCSSxJQUFJLENBQUNlLElBQUwsSUFBYSxFQUF0Qyw4QkFBWjtBQUNBLGVBQU85QyxFQUFFLEVBQVQ7QUFDRDs7QUFFRCxVQUFJK0IsSUFBSSxDQUFDaUIsVUFBVCxFQUNFLE9BQU9ILE9BQU8sQ0FBQzdDLEVBQUQsQ0FBZCxDQVBzRCxDQVN4RDtBQUNBOztBQUNBLGFBQU82QyxPQUFPLENBQUM3QyxFQUFELENBQWQsQ0FYd0QsQ0FZeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDRCxLQWhCMkIsQ0FBNUI7QUFpQkQsR0E3Q0Q7QUErQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBjc3QgZnJvbSAnLi4vLi4vLi4vY29uc3RhbnRzJztcbmltcG9ydCBDb21tb24gZnJvbSAnLi4vLi4vQ29tbW9uJztcblxuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCBmb3JFYWNoIGZyb20gJ2FzeW5jL2ZvckVhY2gnO1xuaW1wb3J0IG9wZW4gZnJvbSAnLi4vLi4vdG9vbHMvb3Blbic7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgTW9kdWxlcyBmcm9tICcuLi9Nb2R1bGVzJztcblxuZnVuY3Rpb24gcHJvY2Vzc2VzQXJlQWxyZWFkeU1vbml0b3JlZChDTEksIGNiKSB7XG4gIENMSS5DbGllbnQuZXhlY3V0ZVJlbW90ZSgnZ2V0TW9uaXRvckRhdGEnLCB7fSwgZnVuY3Rpb24oZXJyLCBsaXN0KSB7XG4gICAgaWYgKGVycikgcmV0dXJuIGNiKGZhbHNlKTtcbiAgICB2YXIgbCA9IGxpc3QuZmlsdGVyKGwgPT4gbC5wbTJfZW52LmttX2xpbmsgPT0gdHJ1ZSlcbiAgICB2YXIgbDIgPSBsaXN0LmZpbHRlcihsID0+IGwubmFtZSA9PSAncG0yLXNlcnZlci1tb25pdCcpXG5cbiAgICByZXR1cm4gY2IobC5sZW5ndGggPiAwICYmIGwyLmxlbmd0aCA+IDAgPyB0cnVlIDogZmFsc2UpXG4gIH0pXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKENMSSkge1xuICBDTEkucHJvdG90eXBlLm9wZW5EYXNoYm9hcmQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuZ2xfaW50ZXJhY3RfaW5mb3MpIHtcbiAgICAgIENvbW1vbi5wcmludEVycm9yKGNoYWxrLmJvbGQud2hpdGUoJ0FnZW50IGlmIG9mZmxpbmUsIHR5cGUgYCQgcG0yIHBsdXNgIHRvIGxvZyBpbicpKTtcbiAgICAgIHJldHVybiB0aGlzLmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgIH1cblxuICAgIHZhciB1cmkgPSBgaHR0cHM6Ly9hcHAucG0yLmlvLyMvci8ke3RoaXMuZ2xfaW50ZXJhY3RfaW5mb3MucHVibGljX2tleX1gXG4gICAgY29uc29sZS5sb2coY3N0LlBNMl9JT19NU0cgKyBgIE9wZW5pbmcgJHt1cml9YClcbiAgICBvcGVuKHVyaSk7XG4gICAgc2V0VGltZW91dChfID0+IHtcbiAgICAgIHRoaXMuZXhpdENsaSgpO1xuICAgIH0sIDIwMCk7XG4gIH07XG5cbiAgQ0xJLnByb3RvdHlwZS5jbGVhclNldHVwID0gZnVuY3Rpb24gKG9wdHMsIGNiKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGNvbnN0IG1vZHVsZXMgPSBbJ2V2ZW50LWxvb3AtaW5zcGVjdG9yJ11cbiAgICB0aGlzLmdsX2lzX2ttX2xpbmtlZCA9IGZhbHNlXG5cbiAgICBpZiAoc2VtdmVyLnNhdGlzZmllcyhwcm9jZXNzLnZlcnNpb24sICc8IDEwLjAuMCcpKSB7XG4gICAgICBtb2R1bGVzLnB1c2goJ3Y4LXByb2ZpbGVyLW5vZGU4JylcbiAgICB9XG5cbiAgICBmb3JFYWNoKG1vZHVsZXMsIChfbW9kdWxlLCBuZXh0KSA9PiB7XG4gICAgICBzZWxmLnVuaW5zdGFsbCh0aGlzLCBfbW9kdWxlLCAoKSA9PiB7XG4gICAgICAgIG5leHQoKVxuICAgICAgfSk7XG4gICAgfSwgKGVycikgPT4ge1xuICAgICAgdGhpcy5yZWxvYWQoJ2FsbCcsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIGNiKClcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YWxsIHJlcXVpcmVkIHBhY2thZ2UgYW5kIGVuYWJsZSBmbGFncyBmb3IgY3VycmVudCBydW5uaW5nIHByb2Nlc3Nlc1xuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5taW5pbXVtU2V0dXAgPSBmdW5jdGlvbiAob3B0cywgY2IpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5nbF9pc19rbV9saW5rZWQgPSB0cnVlXG5cbiAgICBmdW5jdGlvbiBpbnN0YWxsKGNiKSB7XG4gICAgICB2YXIgbW9kdWxlcyA9IFtdXG5cbiAgICAgIGlmIChvcHRzLnR5cGUgPT09ICdlbnRlcnByaXNlJyB8fCBvcHRzLnR5cGUgPT09ICdwbHVzJykge1xuICAgICAgICBtb2R1bGVzID0gWydwbTItbG9ncm90YXRlJywgJ3BtMi1zZXJ2ZXItbW9uaXQnXVxuICAgICAgICBpZiAoc2VtdmVyLnNhdGlzZmllcyhwcm9jZXNzLnZlcnNpb24sICc8IDguMC4wJykpIHtcbiAgICAgICAgICBtb2R1bGVzLnB1c2goJ3Y4LXByb2ZpbGVyLW5vZGU4JylcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0cy50eXBlID09PSAnZW50ZXJwcmlzZScpIHtcbiAgICAgICAgICBtb2R1bGVzLnB1c2goJ2RlZXAtbWV0cmljcycpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZm9yRWFjaChtb2R1bGVzLCAoX21vZHVsZSwgbmV4dCkgPT4ge1xuICAgICAgICBzZWxmLmluc3RhbGwoc2VsZiwgX21vZHVsZSwge30sICgpID0+IHtcbiAgICAgICAgICBuZXh0KClcbiAgICAgICAgfSk7XG4gICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgIHNlbGYucmVsb2FkKCdhbGwnLCAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNiKClcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcHJvY2Vzc2VzQXJlQWxyZWFkeU1vbml0b3JlZChzZWxmLCAoYWxyZWFkeV9tb25pdG9yZWQpID0+IHtcbiAgICAgIGlmIChhbHJlYWR5X21vbml0b3JlZCkge1xuICAgICAgICBjb25zb2xlLmxvZyhjc3QuUE0yX0lPX01TRyArIGAgUE0yICR7b3B0cy50eXBlIHx8ICcnfSBidW5kbGUgYWxyZWFkeSBpbnN0YWxsZWRgKTtcbiAgICAgICAgcmV0dXJuIGNiKClcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdHMuaW5zdGFsbEFsbClcbiAgICAgICAgcmV0dXJuIGluc3RhbGwoY2IpXG5cbiAgICAgIC8vIHByb21wdGx5LmNvbmZpcm0oY2hhbGsuYm9sZCgnSW5zdGFsbCBhbGwgcG0yIHBsdXMgZGVwZW5kZW5jaWVzID8gKHkvbiknKSwgKGVyciwgYW5zd2VyKSA9PiB7XG4gICAgICAvLyAgIGlmICghZXJyICYmIGFuc3dlciA9PT0gdHJ1ZSlcbiAgICAgIHJldHVybiBpbnN0YWxsKGNiKVxuICAgICAgLy8gc2VsZi5yZWxvYWQoJ2FsbCcsICgpID0+IHtcbiAgICAgIC8vICAgICByZXR1cm4gY2IoKVxuICAgICAgLy8gICB9KVxuICAgICAgLy8gfSk7XG4gICAgfSlcbiAgfVxuXG59XG4iXX0=