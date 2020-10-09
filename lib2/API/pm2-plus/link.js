"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _constants = _interopRequireDefault(require("../../../constants"));

var _Common = _interopRequireDefault(require("../../Common"));

var _chalk = _interopRequireDefault(require("chalk"));

var _fs = _interopRequireDefault(require("fs"));

var _InteractorClient = _interopRequireDefault(require("@pm2/agent/src/InteractorClient"));

var _package = _interopRequireDefault(require("../../../package.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _default(CLI) {
  CLI.prototype.linkManagement = function (cmd, public_key, machine, opts, cb) {
    var that = this; // pm2 link stop || kill

    if (cmd == 'stop' || cmd == 'kill') {
      that.gl_is_km_linked = false;
      console.log(_constants["default"].PM2_IO_MSG + ' Stopping agent...');
      return that.killAgent(function (err) {
        if (err) {
          _Common["default"].printError(err);

          return process.exit(_constants["default"].ERROR_EXIT);
        }

        console.log(_constants["default"].PM2_IO_MSG + ' Stopped');
        that.reload('all', function () {
          return process.exit(_constants["default"].SUCCESS_EXIT);
        });
      });
    } // pm2 link info


    if (cmd == 'info') {
      console.log(_constants["default"].PM2_IO_MSG + ' Getting agent information...');
      that.agentInfos(function (err, infos) {
        if (err) {
          console.error(_constants["default"].PM2_IO_MSG_ERR + ' ' + err.message);
          return that.exitCli(_constants["default"].ERROR_EXIT);
        }

        console.log(infos);
        return that.exitCli(_constants["default"].SUCCESS_EXIT);
      });
      return false;
    } // pm2 link delete


    if (cmd == 'delete') {
      that.gl_is_km_linked = false;
      console.log(_constants["default"].PM2_IO_MSG + ' Permanently disable agent...');
      that.killAgent(function (err) {
        try {
          _fs["default"].unlinkSync(_constants["default"].INTERACTION_CONF);
        } catch (e) {
          console.log(_constants["default"].PM2_IO_MSG + ' No interaction config file found');
          return process.exit(_constants["default"].SUCCESS_EXIT);
        }

        console.log(_constants["default"].PM2_IO_MSG + ' Agent interaction ended');
        if (!cb) return process.exit(_constants["default"].SUCCESS_EXIT);
        return cb();
      });
      return false;
    }

    if (cmd && !public_key) {
      console.error(_constants["default"].PM2_IO_MSG + ' Command [%s] unknown or missing public key', cmd);
      return process.exit(_constants["default"].ERROR_EXIT);
    } // pm2 link xxx yyy


    var infos;

    if (!cmd) {
      infos = null;
    } else infos = {
      public_key: public_key,
      secret_key: cmd,
      machine_name: machine,
      info_node: opts.infoNode || null,
      pm2_version: _package["default"].version
    };

    if (opts && opts.axon === true && infos) {
      infos.agent_transport_axon = true;
      infos.agent_transport_websocket = false;
      process.env.AGENT_TRANSPORT_AXON = "true";
      process.env.AGENT_TRANSPORT_WEBSOCKET = "false";
    } else if (infos) {
      infos.agent_transport_axon = false;
      infos.agent_transport_websocket = true;
      process.env.AGENT_TRANSPORT_AXON = "false";
      process.env.AGENT_TRANSPORT_WEBSOCKET = "true";
    }

    that.link(infos, cb);
  };

  CLI.prototype.link = function (infos, cb) {
    var that = this;
    if (infos && !infos.machine_name) infos.machine_name = require('os').hostname() + '-' + require('crypto').randomBytes(2).toString('hex');

    _InteractorClient["default"].launchAndInteract(_constants["default"], infos, function (err, dt) {
      if (err) {
        _Common["default"].printError(_constants["default"].PM2_IO_MSG + ' Run `$ pm2 plus` to connect');

        return that.exitCli(_constants["default"].ERROR_EXIT);
      }

      console.log(_chalk["default"].bold.green('[+] PM2+ activated!'));

      if (!cb) {
        return that.exitCli(_constants["default"].SUCCESS_EXIT);
      }

      return cb(null, dt);
    });
  };

  CLI.prototype.agentInfos = function (cb) {
    _InteractorClient["default"].getInteractInfo(this._conf, function (err, data) {
      if (err) return cb(_Common["default"].retErr(err));
      return cb(null, data);
    });
  };

  CLI.prototype.killAgent = function (cb) {
    var that = this;

    _InteractorClient["default"].killInteractorDaemon(that._conf, function (err) {
      if (err) return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].SUCCESS_EXIT);
      return cb ? cb(null) : that.exitCli(_constants["default"].SUCCESS_EXIT);
    });
  };

  CLI.prototype.unlink = function (cb) {
    this.linkManagement('delete', cb);
  };
}

;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvcG0yLXBsdXMvbGluay50cyJdLCJuYW1lcyI6WyJDTEkiLCJwcm90b3R5cGUiLCJsaW5rTWFuYWdlbWVudCIsImNtZCIsInB1YmxpY19rZXkiLCJtYWNoaW5lIiwib3B0cyIsImNiIiwidGhhdCIsImdsX2lzX2ttX2xpbmtlZCIsImNvbnNvbGUiLCJsb2ciLCJjc3QiLCJQTTJfSU9fTVNHIiwia2lsbEFnZW50IiwiZXJyIiwiQ29tbW9uIiwicHJpbnRFcnJvciIsInByb2Nlc3MiLCJleGl0IiwiRVJST1JfRVhJVCIsInJlbG9hZCIsIlNVQ0NFU1NfRVhJVCIsImFnZW50SW5mb3MiLCJpbmZvcyIsImVycm9yIiwiUE0yX0lPX01TR19FUlIiLCJtZXNzYWdlIiwiZXhpdENsaSIsImZzIiwidW5saW5rU3luYyIsIklOVEVSQUNUSU9OX0NPTkYiLCJlIiwic2VjcmV0X2tleSIsIm1hY2hpbmVfbmFtZSIsImluZm9fbm9kZSIsImluZm9Ob2RlIiwicG0yX3ZlcnNpb24iLCJwa2ciLCJ2ZXJzaW9uIiwiYXhvbiIsImFnZW50X3RyYW5zcG9ydF9heG9uIiwiYWdlbnRfdHJhbnNwb3J0X3dlYnNvY2tldCIsImVudiIsIkFHRU5UX1RSQU5TUE9SVF9BWE9OIiwiQUdFTlRfVFJBTlNQT1JUX1dFQlNPQ0tFVCIsImxpbmsiLCJyZXF1aXJlIiwiaG9zdG5hbWUiLCJyYW5kb21CeXRlcyIsInRvU3RyaW5nIiwiS01EYWVtb24iLCJsYXVuY2hBbmRJbnRlcmFjdCIsImR0IiwiY2hhbGsiLCJib2xkIiwiZ3JlZW4iLCJnZXRJbnRlcmFjdEluZm8iLCJfY29uZiIsImRhdGEiLCJyZXRFcnIiLCJraWxsSW50ZXJhY3RvckRhZW1vbiIsInVubGluayJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBRWUsa0JBQVVBLEdBQVYsRUFBZTtBQUU1QkEsRUFBQUEsR0FBRyxDQUFDQyxTQUFKLENB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QUosRUFDRSxPQUFPUixFQUFFLENBQUNTLG1CQUFPNEMsTUFBUCxDQUFjN0MsR0FBZCxDQUFELENBQVQ7QUFDRixhQUFPUixFQUFFLENBQUMsSUFBRCxFQUFPb0QsSUFBUCxDQUFUO0FBQ0QsS0FKRDtBQUtELEdBTkQ7O0FBUUEzRCxFQUFBQSxHQUFHLENBQUNDLFNBQUosQ0FBY2EsU0FBZCxHQUEwQixVQUFVUCxFQUFWLEVBQWM7QUFDdEMsUUFBSUMsSUFBSSxHQUFHLElBQVg7O0FBQ0EyQyxpQ0FBU1Usb0JBQVQsQ0FBOEJyRCxJQUFJLENBQUNrRCxLQUFuQyxFQUEwQyxVQUFVM0MsR0FBVixFQUFlO0FBQ3ZELFVBQUlBLEdBQUosRUFDRSxPQUFPUixFQUFFLEdBQUdBLEVBQUUsQ0FBQ1MsbUJBQU80QyxNQUFQLENBQWM3QyxHQUFkLENBQUQsQ0FBTCxHQUE0QlAsSUFBSSxDQUFDb0IsT0FBTCxDQUFhaEIsc0JBQUlVLFlBQWpCLENBQXJDO0FBQ0YsYUFBT2YsRUFBRSxHQUFHQSxFQUFFLENBQUMsSUFBRCxDQUFMLEdBQWNDLElBQUksQ0FBQ29CLE9BQUwsQ0FBYWhCLHNCQUFJVSxZQUFqQixDQUF2QjtBQUNELEtBSkQ7QUFLRCxHQVBEOztBQVNBdEIsRUFBQUEsR0FBRyxDQUFDQyxTQUFKLENBQWM2RCxNQUFkLEdBQXVCLFVBQVV2RCxFQUFWLEVBQWM7QUFDbkMsU0FBS0wsY0FBTCxDQUFvQixRQUFwQixFQUE4QkssRUFBOUI7QUFDRCxHQUZEO0FBR0Q7O0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBjc3QgZnJvbSAnLi4vLi4vLi4vY29uc3RhbnRzJztcbmltcG9ydCBDb21tb24gZnJvbSAnLi4vLi4vQ29tbW9uJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IEtNRGFlbW9uIGZyb20gJ0BwbTIvYWdlbnQvc3JjL0ludGVyYWN0b3JDbGllbnQnO1xuaW1wb3J0IHBrZyBmcm9tICcuLi8uLi8uLi9wYWNrYWdlLmpzb24nO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoQ0xJKSB7XG5cbiAgQ0xJLnByb3RvdHlwZS5saW5rTWFuYWdlbWVudCA9IGZ1bmN0aW9uIChjbWQsIHB1YmxpY19rZXksIG1hY2hpbmUsIG9wdHMsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgLy8gcG0yIGxpbmsgc3RvcCB8fCBraWxsXG4gICAgaWYgKGNtZCA9PSAnc3RvcCcgfHwgY21kID09ICdraWxsJykge1xuICAgICAgdGhhdC5nbF9pc19rbV9saW5rZWQgPSBmYWxzZVxuICAgICAgY29uc29sZS5sb2coY3N0LlBNMl9JT19NU0cgKyAnIFN0b3BwaW5nIGFnZW50Li4uJyk7XG5cbiAgICAgIHJldHVybiB0aGF0LmtpbGxBZ2VudChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIpO1xuICAgICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGNzdC5QTTJfSU9fTVNHICsgJyBTdG9wcGVkJyk7XG5cbiAgICAgICAgdGhhdC5yZWxvYWQoJ2FsbCcsICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gcG0yIGxpbmsgaW5mb1xuICAgIGlmIChjbWQgPT0gJ2luZm8nKSB7XG4gICAgICBjb25zb2xlLmxvZyhjc3QuUE0yX0lPX01TRyArICcgR2V0dGluZyBhZ2VudCBpbmZvcm1hdGlvbi4uLicpO1xuICAgICAgdGhhdC5hZ2VudEluZm9zKGZ1bmN0aW9uIChlcnIsIGluZm9zKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGNzdC5QTTJfSU9fTVNHX0VSUiArICcgJyArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhpbmZvcyk7XG4gICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBwbTIgbGluayBkZWxldGVcbiAgICBpZiAoY21kID09ICdkZWxldGUnKSB7XG4gICAgICB0aGF0LmdsX2lzX2ttX2xpbmtlZCA9IGZhbHNlXG4gICAgICBjb25zb2xlLmxvZyhjc3QuUE0yX0lPX01TRyArICcgUGVybWFuZW50bHkgZGlzYWJsZSBhZ2VudC4uLicpO1xuICAgICAgdGhhdC5raWxsQWdlbnQoZnVuY3Rpb24gKGVycikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGZzLnVubGlua1N5bmMoY3N0LklOVEVSQUNUSU9OX0NPTkYpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coY3N0LlBNMl9JT19NU0cgKyAnIE5vIGludGVyYWN0aW9uIGNvbmZpZyBmaWxlIGZvdW5kJyk7XG4gICAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdChjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhjc3QuUE0yX0lPX01TRyArICcgQWdlbnQgaW50ZXJhY3Rpb24gZW5kZWQnKTtcbiAgICAgICAgaWYgKCFjYilcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICByZXR1cm4gY2IoKVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGNtZCAmJiAhcHVibGljX2tleSkge1xuICAgICAgY29uc29sZS5lcnJvcihjc3QuUE0yX0lPX01TRyArICcgQ29tbWFuZCBbJXNdIHVua25vd24gb3IgbWlzc2luZyBwdWJsaWMga2V5JywgY21kKTtcbiAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoY3N0LkVSUk9SX0VYSVQpO1xuICAgIH1cblxuICAgIC8vIHBtMiBsaW5rIHh4eCB5eXlcbiAgICB2YXIgaW5mb3M7XG5cbiAgICBpZiAoIWNtZCkge1xuICAgICAgaW5mb3MgPSBudWxsO1xuICAgIH1cbiAgICBlbHNlXG4gICAgICBpbmZvcyA9IHtcbiAgICAgICAgcHVibGljX2tleTogcHVibGljX2tleSxcbiAgICAgICAgc2VjcmV0X2tleTogY21kLFxuICAgICAgICBtYWNoaW5lX25hbWU6IG1hY2hpbmUsXG4gICAgICAgIGluZm9fbm9kZTogb3B0cy5pbmZvTm9kZSB8fCBudWxsLFxuICAgICAgICBwbTJfdmVyc2lvbjogcGtnLnZlcnNpb25cbiAgICAgIH1cblxuICAgIGlmIChvcHRzICYmIG9wdHMuYXhvbiA9PT0gdHJ1ZSAmJiBpbmZvcykge1xuICAgICAgaW5mb3MuYWdlbnRfdHJhbnNwb3J0X2F4b24gPSB0cnVlXG4gICAgICBpbmZvcy5hZ2VudF90cmFuc3BvcnRfd2Vic29ja2V0ID0gZmFsc2VcbiAgICAgIHByb2Nlc3MuZW52LkFHRU5UX1RSQU5TUE9SVF9BWE9OID0gXCJ0cnVlXCJcbiAgICAgIHByb2Nlc3MuZW52LkFHRU5UX1RSQU5TUE9SVF9XRUJTT0NLRVQgPSBcImZhbHNlXCJcbiAgICB9XG4gICAgZWxzZSBpZiAoaW5mb3MpIHtcbiAgICAgIGluZm9zLmFnZW50X3RyYW5zcG9ydF9heG9uID0gZmFsc2VcbiAgICAgIGluZm9zLmFnZW50X3RyYW5zcG9ydF93ZWJzb2NrZXQgPSB0cnVlXG4gICAgICBwcm9jZXNzLmVudi5BR0VOVF9UUkFOU1BPUlRfQVhPTiA9IFwiZmFsc2VcIlxuICAgICAgcHJvY2Vzcy5lbnYuQUdFTlRfVFJBTlNQT1JUX1dFQlNPQ0tFVCA9IFwidHJ1ZVwiXG4gICAgfVxuXG4gICAgdGhhdC5saW5rKGluZm9zLCBjYilcbiAgfTtcblxuICBDTEkucHJvdG90eXBlLmxpbmsgPSBmdW5jdGlvbiAoaW5mb3MsIGNiKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKGluZm9zICYmICFpbmZvcy5tYWNoaW5lX25hbWUpXG4gICAgICBpbmZvcy5tYWNoaW5lX25hbWUgPSByZXF1aXJlKCdvcycpLmhvc3RuYW1lKCkgKyAnLScgKyByZXF1aXJlKCdjcnlwdG8nKS5yYW5kb21CeXRlcygyKS50b1N0cmluZygnaGV4JylcblxuICAgIEtNRGFlbW9uLmxhdW5jaEFuZEludGVyYWN0KGNzdCwgaW5mb3MsIGZ1bmN0aW9uIChlcnIsIGR0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGNzdC5QTTJfSU9fTVNHICsgJyBSdW4gYCQgcG0yIHBsdXNgIHRvIGNvbm5lY3QnKVxuICAgICAgICByZXR1cm4gdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmJvbGQuZ3JlZW4oJ1srXSBQTTIrIGFjdGl2YXRlZCEnKSlcbiAgICAgIGlmICghY2IpIHtcbiAgICAgICAgcmV0dXJuIHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjYihudWxsLCBkdClcbiAgICB9KTtcbiAgfTtcblxuICBDTEkucHJvdG90eXBlLmFnZW50SW5mb3MgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICBLTURhZW1vbi5nZXRJbnRlcmFjdEluZm8odGhpcy5fY29uZiwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgaWYgKGVycilcbiAgICAgICAgcmV0dXJuIGNiKENvbW1vbi5yZXRFcnIoZXJyKSk7XG4gICAgICByZXR1cm4gY2IobnVsbCwgZGF0YSk7XG4gICAgfSk7XG4gIH07XG5cbiAgQ0xJLnByb3RvdHlwZS5raWxsQWdlbnQgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgS01EYWVtb24ua2lsbEludGVyYWN0b3JEYWVtb24odGhhdC5fY29uZiwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycilcbiAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH0pO1xuICB9O1xuXG4gIENMSS5wcm90b3R5cGUudW5saW5rID0gZnVuY3Rpb24gKGNiKSB7XG4gICAgdGhpcy5saW5rTWFuYWdlbWVudCgnZGVsZXRlJywgY2IpO1xuICB9O1xufTtcbiJdfQ==