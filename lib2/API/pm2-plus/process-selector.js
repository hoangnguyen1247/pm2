"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _forEachLimit = _interopRequireDefault(require("async/forEachLimit"));

var _constants = _interopRequireDefault(require("../../../constants"));

var _Common = _interopRequireDefault(require("../../Common"));

function _default(CLI) {
  /**
   * Monitor Selectively Processes (auto filter in interaction)
   * @param String state 'monitor' or 'unmonitor'
   * @param String target <pm_id|name|all>
   * @param Function cb callback
   */
  CLI.prototype.monitorState = function (state, target, cb) {
    var that = this;

    if (!target) {
      _Common["default"].printError(_constants["default"].PREFIX_MSG_ERR + 'Please specify an <app_name|pm_id>');

      return cb ? cb(new Error('argument missing')) : that.exitCli(_constants["default"].ERROR_EXIT);
    }

    function monitor(pm_id, cb) {
      // State can be monitor or unmonitor
      that.Client.executeRemote(state, pm_id, cb);
    }

    if (target === 'all') {
      that.Client.getAllProcessId(function (err, procs) {
        if (err) {
          _Common["default"].printError(err);

          return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
        }

        (0, _forEachLimit["default"])(procs, 1, monitor, function (err, res) {
          return typeof cb === 'function' ? cb(err, res) : that.speedList();
        });
      });
    } else if (!Number.isInteger(parseInt(target))) {
      this.Client.getProcessIdByName(target, true, function (err, procs) {
        if (err) {
          _Common["default"].printError(err);

          return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
        }

        (0, _forEachLimit["default"])(procs, 1, monitor, function (err, res) {
          return typeof cb === 'function' ? cb(err, res) : that.speedList();
        });
      });
    } else {
      monitor(parseInt(target), function (err, res) {
        return typeof cb === 'function' ? cb(err, res) : that.speedList();
      });
    }
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvcG0yLXBsdXMvcHJvY2Vzcy1zZWxlY3Rvci50cyJdLCJuYW1lcyI6WyJDTEkiLCJwcm90b3R5cGUiLCJtb25pdG9yU3RhdGUiLCJzdGF0ZSIsInRhcmdldCIsImNiIiwidGhhdCIsIkNvbW1vbiIsInByaW50RXJyb3IiLCJjc3QiLCJQUkVGSVhfTVNHX0VSUiIsIkVycm9yIiwiZXhpdENsaSIsIkVSUk9SX0VYSVQiLCJtb25pdG9yIiwicG1faWQiLCJDbGllbnQiLCJleGVjdXRlUmVtb3RlIiwiZ2V0QWxsUHJvY2Vzc0lkIiwiZXJyIiwicHJvY3MiLCJyZXRFcnIiLCJyZXMiLCJzcGVlZExpc3QiLCJOdW1iZXIiLCJpc0ludGVnZXIiLCJwYXJzZUludCIsImdldFByb2Nlc3NJZEJ5TmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBRWUsa0JBQVNBLEdBQVQsRUFBYztBQUMzQjs7Ozs7O0FBTUFBLEVBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUFjQyxZQUFkLEdBQTZCLFVBQVNDLEtBQVQsRUFBZ0JDLE1BQWhCLEVBQXdCQyxFQUF4QixFQUE0QjtBQUN2RCxRQUFJQyxJQUFJLEdBQUcsSUFBWDs7QUFFQSxRQUFJLENBQUNGLE1BQUwsRUFBYTtBQUNYRyx5QkFBT0MsVUFBUCxDQUFrQkMsc0JBQUlDLGNBQUosR0FBcUIsb0NBQXZDOztBQUNBLGFBQU9MLEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUlNLEtBQUosQ0FBVSxrQkFBVixDQUFELENBQUwsR0FBdUNMLElBQUksQ0FBQ00sT0FBTCxDQUFhSCxzQkFBSUksVUFBakIsQ0FBaEQ7QUFDRDs7QUFFRCxhQUFTQyxPQUFULENBQWtCQyxLQUFsQixFQUF5QlYsRUFBekIsRUFBNkI7QUFDM0I7QUFDQUMsTUFBQUEsSUFBSSxDQUFDVSxNQUFMLENBQVlDLGFBQVosQ0FBMEJkLEtBQTFCLEVBQWlDWSxLQUFqQyxFQUF3Q1YsRUFBeEM7QUFDRDs7QUFDRCxRQUFJRCxNQUFNLEtBQUssS0FBZixFQUFzQjtBQUNwQkUsTUFBQUEsSUFBSSxDQUFDVSxNQUFMLENBQVlFLGVBQVosQ0FBNEIsVUFBVUMsR0FBVixFQUFlQyxLQUFmLEVBQXNCO0FBQ2hELFlBQUlELEdBQUosRUFBUztBQUNQWiw2QkFBT0MsVUFBUCxDQUFrQlcsR0FBbEI7O0FBQ0EsaUJBQU9kLEVBQUUsR0FBR0EsRUFBRSxDQUFDRSxtQkFBT2MsTUFBUCxDQUFjRixHQUFkLENBQUQsQ0FBTCxHQUE0QmIsSUFBSSxDQUFDTSxPQUFMLENBQWFILHNCQUFJSSxVQUFqQixDQUFyQztBQUNEOztBQUNELHNDQUFhTyxLQUFiLEVBQW9CLENBQXBCLEVBQXVCTixPQUF2QixFQUFnQyxVQUFVSyxHQUFWLEVBQWVHLEdBQWYsRUFBb0I7QUFDbEQsaUJBQU8sT0FBT2pCLEVBQVAsS0FBYyxVQUFkLEdBQTJCQSxFQUFFLENBQUNjLEdBQUQsRUFBTUcsR0FBTixDQUE3QixHQUEwQ2hCLElBQUksQ0FBQ2lCLFNBQUwsRUFBakQ7QUFDRCxTQUZEO0FBR0QsT0FSRDtBQVNELEtBVkQsTUFVTyxJQUFJLENBQUNDLE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQkMsUUFBUSxDQUFDdEIsTUFBRCxDQUF6QixDQUFMLEVBQXlDO0FBQzlDLFdBQUtZLE1BQUwsQ0FBWVcsa0JBQVosQ0FBK0J2QixNQUEvQixFQUF1QyxJQUF2QyxFQUE2QyxVQUFVZSxHQUFWLEVBQWVDLEtBQWYsRUFBc0I7QUFDakUsWUFBSUQsR0FBSixFQUFTO0FBQ1BaLDZCQUFPQyxVQUFQLENBQWtCVyxHQUFsQjs7QUFDQSxpQkFBT2QsRUFBRSxHQUFHQSxFQUFFLENBQUNFLG1CQUFPYyxNQUFQLENBQWNGLEdBQWQsQ0FBRCxDQUFMLEdBQTRCYixJQUFJLENBQUNNLE9BQUwsQ0FBYUgsc0JBQUlJLFVBQWpCLENBQXJDO0FBQ0Q7O0FBQ0Qsc0NBQWFPLEtBQWIsRUFBb0IsQ0FBcEIsRUFBdUJOLE9BQXZCLEVBQWdDLFVBQVVLLEdBQVYsRUFBZUcsR0FBZixFQUFvQjtBQUNsRCxpQkFBTyxPQUFPakIsRUFBUCxLQUFjLFVBQWQsR0FBMkJBLEVBQUUsQ0FBQ2MsR0FBRCxFQUFNRyxHQUFOLENBQTdCLEdBQTBDaEIsSUFBSSxDQUFDaUIsU0FBTCxFQUFqRDtBQUNELFNBRkQ7QUFHRCxPQVJEO0FBU0QsS0FWTSxNQVVBO0FBQ0xULE1BQUFBLE9BQU8sQ0FBQ1ksUUFBUSxDQUFDdEIsTUFBRCxDQUFULEVBQW1CLFVBQVVlLEdBQVYsRUFBZUcsR0FBZixFQUFvQjtBQUM1QyxlQUFPLE9BQU9qQixFQUFQLEtBQWMsVUFBZCxHQUEyQkEsRUFBRSxDQUFDYyxHQUFELEVBQU1HLEdBQU4sQ0FBN0IsR0FBMENoQixJQUFJLENBQUNpQixTQUFMLEVBQWpEO0FBQ0QsT0FGTSxDQUFQO0FBR0Q7QUFDRixHQXJDRDtBQXNDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcyAgZnJvbSAnZnMnO1xuaW1wb3J0IGZvckVhY2hMaW1pdCBmcm9tICdhc3luYy9mb3JFYWNoTGltaXQnO1xuXG5pbXBvcnQgY3N0IGZyb20gJy4uLy4uLy4uL2NvbnN0YW50cyc7XG5pbXBvcnQgQ29tbW9uIGZyb20gJy4uLy4uL0NvbW1vbic7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKENMSSkge1xuICAvKipcbiAgICogTW9uaXRvciBTZWxlY3RpdmVseSBQcm9jZXNzZXMgKGF1dG8gZmlsdGVyIGluIGludGVyYWN0aW9uKVxuICAgKiBAcGFyYW0gU3RyaW5nIHN0YXRlICdtb25pdG9yJyBvciAndW5tb25pdG9yJ1xuICAgKiBAcGFyYW0gU3RyaW5nIHRhcmdldCA8cG1faWR8bmFtZXxhbGw+XG4gICAqIEBwYXJhbSBGdW5jdGlvbiBjYiBjYWxsYmFja1xuICAgKi9cbiAgQ0xJLnByb3RvdHlwZS5tb25pdG9yU3RhdGUgPSBmdW5jdGlvbihzdGF0ZSwgdGFyZ2V0LCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICBDb21tb24ucHJpbnRFcnJvcihjc3QuUFJFRklYX01TR19FUlIgKyAnUGxlYXNlIHNwZWNpZnkgYW4gPGFwcF9uYW1lfHBtX2lkPicpO1xuICAgICAgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKCdhcmd1bWVudCBtaXNzaW5nJykpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtb25pdG9yIChwbV9pZCwgY2IpIHtcbiAgICAgIC8vIFN0YXRlIGNhbiBiZSBtb25pdG9yIG9yIHVubW9uaXRvclxuICAgICAgdGhhdC5DbGllbnQuZXhlY3V0ZVJlbW90ZShzdGF0ZSwgcG1faWQsIGNiKTtcbiAgICB9XG4gICAgaWYgKHRhcmdldCA9PT0gJ2FsbCcpIHtcbiAgICAgIHRoYXQuQ2xpZW50LmdldEFsbFByb2Nlc3NJZChmdW5jdGlvbiAoZXJyLCBwcm9jcykge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuICAgICAgICBmb3JFYWNoTGltaXQocHJvY3MsIDEsIG1vbml0b3IsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicgPyBjYihlcnIsIHJlcykgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoIU51bWJlci5pc0ludGVnZXIocGFyc2VJbnQodGFyZ2V0KSkpIHtcbiAgICAgIHRoaXMuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZSh0YXJnZXQsIHRydWUsIGZ1bmN0aW9uIChlcnIsIHByb2NzKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIGZvckVhY2hMaW1pdChwcm9jcywgMSwgbW9uaXRvciwgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJyA/IGNiKGVyciwgcmVzKSA6IHRoYXQuc3BlZWRMaXN0KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1vbml0b3IocGFyc2VJbnQodGFyZ2V0KSwgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicgPyBjYihlcnIsIHJlcykgOiB0aGF0LnNwZWVkTGlzdCgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufVxuIl19