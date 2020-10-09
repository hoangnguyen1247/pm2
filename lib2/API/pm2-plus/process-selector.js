"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _forEachLimit = _interopRequireDefault(require("async/forEachLimit"));

var _constants = _interopRequireDefault(require("../../../constants.js"));

var _Common = _interopRequireDefault(require("../../Common.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvcG0yLXBsdXMvcHJvY2Vzcy1zZWxlY3Rvci50cyJdLCJuYW1lcyI6WyJDTEkiLCJwcm90b3R5cGUiLCJtb25pdG9yU3RhdGUiLCJzdGF0ZSIsInRhcmdldCIsImNiIiwidGhhdCIsIkNvbW1vbiIsInByaW50RXJyb3IiLCJjc3QiLCJQUkVGSVhfTVNHX0VSUiIsIkVycm9yIiwiZXhpdENsaSIsIkVSUk9SX0VYSVQiLCJtb25pdG9yIiwicG1faWQiLCJDbGllbnQiLCJleGVjdXRlUmVtb3RlIiwiZ2V0QWxsUHJvY2Vzc0lkIiwiZXJyIiwicHJvY3MiLCJyZXRFcnIiLCJyZXMiLCJzcGVlZExpc3QiLCJOdW1iZXIiLCJpc0ludGVnZXIiLCJwYXJzZUludCIsImdldFByb2Nlc3NJZEJ5TmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUNBOztBQUVBOztBQUNBOzs7O0FBRWUsa0JBQVNBLEdBQVQsRUFBYztBQUMzQjs7Ozs7O0FBTUFBLEVBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUFjQyxZQUFkLEdBQTZCLFVBQVNDLEtBQVQsRUFBZ0JDLE1BQWhCLEVBQXdCQyxFQUF4QixFQUE0QjtBQUN2RCxRQUFJQyxJQUFJLEdBQUcsSUFBWDs7QUFFQSxRQUFJLENBQUNGLE1BQUwsRUFBYTtBQUNYRyx5QkFBT0MsVUFBUCxDQUFrQkMsc0JBQUlDLGNBQUosR0FBcUIsb0NBQXZDOztBQUNBLGFBQU9MLEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUlNLEtBQUosQ0FBVSxrQkFBVixDQUFELENBQUwsR0FBdUNMLElBQUksQ0FBQ00sT0FBTCxDQUFhSCxzQkFBSUksVUFBakIsQ0FBaEQ7QUFDRDs7QUFFRCxhQUFTQyxPQUFULENBQWtCQyxLQUFsQixFQUF5QlYsRUFBekIsRUFBNkI7QUFDM0I7QUFDQUMsTUFBQUEsSUFBSSxDQUFDVSxNQUFMLENBQVlDLGFBQVosQ0FBMEJkLEtBQTFCLEVBQWlDWSxLQUFqQyxFQUF3Q1YsRUFBeEM7QUFDRDs7QUFDRCxRQUFJRCxNQUFNLEtBQUssS0FBZixFQUFzQjtBQUNwQkUsTUFBQUEsSUFBSSxDQUFDVSxNQUFMLENBQVlFLGVBQVosQ0FBNEIsVUFBVUMsR0FBVixFQUFlQyxLQUFmLEVBQXNCO0FBQ2hELFlBQUlELEdBQUosRUFBUztBQUNQWiw2QkFBT0MsVUFBUCxDQUFrQlcsR0FBbEI7O0FBQ0EsaUJBQU9kLEVBQUUsR0FBR0EsRUFBRSxDQUFDRSxtQkFBT2MsTUFBUCxDQUFjRixHQUFkLENBQUQsQ0FBTCxHQUE0QmIsSUFBSSxDQUFDTSxPQUFMLENBQWFILHNCQUFJSSxVQUFqQixDQUFyQztBQUNEOztBQUNELHNDQUFhTyxLQUFiLEVBQW9CLENBQXBCLEVBQXVCTixPQUF2QixFQUFnQyxVQUFVSyxHQUFWLEVBQWVHLEdBQWYsRUFBb0I7QUFDbEQsaUJBQU8sT0FBT2pCLEVBQVAsS0FBYyxVQUFkLEdBQTJCQSxFQUFFLENBQUNjLEdBQUQsRUFBTUcsR0FBTixDQUE3QixHQUEwQ2hCLElBQUksQ0FBQ2lCLFNBQUwsRUFBakQ7QUFDRCxTQUZEO0FBR0QsT0FSRDtBQVNELEtBVkQsTUFVTyxJQUFJLENBQUNDLE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQkMsUUFBUSxDQUFDdEIsTUFBRCxDQUF6QixDQUFMLEVBQXlDO0FBQzlDLFdBQUtZLE1BQUwsQ0FBWVcsa0JBQVosQ0FBK0J2QixNQUEvQixFQUF1QyxJQUF2QyxFQUE2QyxVQUFVZSxHQUFWLEVBQWVDLEtBQWYsRUFBc0I7QUFDakUsWUFBSUQsR0FBSixFQUFTO0FBQ1BaLDZCQUFPQyxVQUFQLENBQWtCVyxHQUFsQjs7QUFDQSxpQkFBT2QsRUFBRSxHQUFHQSxFQUFFLENBQUNFLG1CQUFPYyxNQUFQLENBQWNGLEdBQWQsQ0FBRCxDQUFMLEdBQTRCYixJQUFJLENBQUNNLE9BQUwsQ0FBYUgsc0JBQUlJLFVBQWpCLENBQXJDO0FBQ0Q7O0FBQ0Qsc0NBQWFPLEtBQWIsRUFBb0IsQ0FBcEIsRUFBdUJOLE9BQXZCLEVBQWdDLFVBQVVLLEdBQVYsRUFBZUcsR0FBZixFQUFvQjtBQUNsRCxpQkFBTyxPQUFPakIsRUFBUCxLQUFjLFVBQWQsR0FBMkJBLEVBQUUsQ0FBQ2MsR0FBRCxFQUFNRyxHQUFOLENBQTdCLEdBQTBDaEIsSUFBSSxDQUFDaUIsU0FBTCxFQUFqRDtBQUNELFNBRkQ7QUFHRCxPQVJEO0FBU0QsS0FWTSxNQVVBO0FBQ0xULE1BQUFBLE9BQU8sQ0FBQ1ksUUFBUSxDQUFDdEIsTUFBRCxDQUFULEVBQW1CLFVBQVVlLEdBQVYsRUFBZUcsR0FBZixFQUFvQjtBQUM1QyxlQUFPLE9BQU9qQixFQUFQLEtBQWMsVUFBZCxHQUEyQkEsRUFBRSxDQUFDYyxHQUFELEVBQU1HLEdBQU4sQ0FBN0IsR0FBMENoQixJQUFJLENBQUNpQixTQUFMLEVBQWpEO0FBQ0QsT0FGTSxDQUFQO0FBR0Q7QUFDRixHQXJDRDtBQXNDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcyAgZnJvbSAnZnMnO1xyXG5pbXBvcnQgZm9yRWFjaExpbWl0IGZyb20gJ2FzeW5jL2ZvckVhY2hMaW1pdCc7XHJcblxyXG5pbXBvcnQgY3N0IGZyb20gJy4uLy4uLy4uL2NvbnN0YW50cy5qcyc7XHJcbmltcG9ydCBDb21tb24gZnJvbSAnLi4vLi4vQ29tbW9uLmpzJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKENMSSkge1xyXG4gIC8qKlxyXG4gICAqIE1vbml0b3IgU2VsZWN0aXZlbHkgUHJvY2Vzc2VzIChhdXRvIGZpbHRlciBpbiBpbnRlcmFjdGlvbilcclxuICAgKiBAcGFyYW0gU3RyaW5nIHN0YXRlICdtb25pdG9yJyBvciAndW5tb25pdG9yJ1xyXG4gICAqIEBwYXJhbSBTdHJpbmcgdGFyZ2V0IDxwbV9pZHxuYW1lfGFsbD5cclxuICAgKiBAcGFyYW0gRnVuY3Rpb24gY2IgY2FsbGJhY2tcclxuICAgKi9cclxuICBDTEkucHJvdG90eXBlLm1vbml0b3JTdGF0ZSA9IGZ1bmN0aW9uKHN0YXRlLCB0YXJnZXQsIGNiKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgaWYgKCF0YXJnZXQpIHtcclxuICAgICAgQ29tbW9uLnByaW50RXJyb3IoY3N0LlBSRUZJWF9NU0dfRVJSICsgJ1BsZWFzZSBzcGVjaWZ5IGFuIDxhcHBfbmFtZXxwbV9pZD4nKTtcclxuICAgICAgcmV0dXJuIGNiID8gY2IobmV3IEVycm9yKCdhcmd1bWVudCBtaXNzaW5nJykpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtb25pdG9yIChwbV9pZCwgY2IpIHtcclxuICAgICAgLy8gU3RhdGUgY2FuIGJlIG1vbml0b3Igb3IgdW5tb25pdG9yXHJcbiAgICAgIHRoYXQuQ2xpZW50LmV4ZWN1dGVSZW1vdGUoc3RhdGUsIHBtX2lkLCBjYik7XHJcbiAgICB9XHJcbiAgICBpZiAodGFyZ2V0ID09PSAnYWxsJykge1xyXG4gICAgICB0aGF0LkNsaWVudC5nZXRBbGxQcm9jZXNzSWQoZnVuY3Rpb24gKGVyciwgcHJvY3MpIHtcclxuICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xyXG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvckVhY2hMaW1pdChwcm9jcywgMSwgbW9uaXRvciwgZnVuY3Rpb24gKGVyciwgcmVzKSB7XHJcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nID8gY2IoZXJyLCByZXMpIDogdGhhdC5zcGVlZExpc3QoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKHBhcnNlSW50KHRhcmdldCkpKSB7XHJcbiAgICAgIHRoaXMuQ2xpZW50LmdldFByb2Nlc3NJZEJ5TmFtZSh0YXJnZXQsIHRydWUsIGZ1bmN0aW9uIChlcnIsIHByb2NzKSB7XHJcbiAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoZXJyKTtcclxuICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3JFYWNoTGltaXQocHJvY3MsIDEsIG1vbml0b3IsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xyXG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJyA/IGNiKGVyciwgcmVzKSA6IHRoYXQuc3BlZWRMaXN0KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbW9uaXRvcihwYXJzZUludCh0YXJnZXQpLCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcclxuICAgICAgICByZXR1cm4gdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nID8gY2IoZXJyLCByZXMpIDogdGhhdC5zcGVlZExpc3QoKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxufVxyXG4iXX0=