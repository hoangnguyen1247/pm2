'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _constants = _interopRequireDefault(require("../../../../constants"));

var _strategy = _interopRequireDefault(require("@pm2/js-api/src/auth_strategies/strategy"));

var _http = _interopRequireDefault(require("http"));

var _fs = _interopRequireDefault(require("fs"));

var _url = _interopRequireDefault(require("url"));

var _child_process = require("child_process");

var _async = _interopRequireDefault(require("async"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

var WebStrategy = /*#__PURE__*/function (_AuthStrategy) {
  (0, _inherits2["default"])(WebStrategy, _AuthStrategy);

  var _super = _createSuper(WebStrategy);

  function WebStrategy(opts) {
    var _this;

    (0, _classCallCheck2["default"])(this, WebStrategy);
    _this = _super.call(this);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "authenticated", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "callback", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "km", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "client_id", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "oauth_endpoint", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "oauth_query", void 0);
    return _this;
  } // the client will try to call this but we handle this part ourselves


  (0, _createClass2["default"])(WebStrategy, [{
    key: "retrieveTokens",
    value: function retrieveTokens(km, cb) {
      this.authenticated = false;
      this.callback = cb;
      this.km = km;
    } // so the cli know if we need to tell user to login/register

  }, {
    key: "isAuthenticated",
    value: function isAuthenticated() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (_this2.authenticated) return resolve(true);
        var tokensPath = _constants["default"].PM2_IO_ACCESS_TOKEN;

        _fs["default"].readFile(tokensPath, function (err, tokens) {
          if (err && err.code === 'ENOENT') return resolve(false);
          if (err) return reject(err); // verify that the token is valid

          try {
            tokens = JSON.parse(tokens.toString() || '{}');
          } catch (err) {
            _fs["default"].unlinkSync(tokensPath);

            return resolve(false);
          } // if the refresh tokens is here, the user could be automatically authenticated


          return resolve(typeof tokens.refresh_token === 'string');
        });
      });
    } // called when we are sure the user asked to be logged in

  }, {
    key: "_retrieveTokens",
    value: function _retrieveTokens(optionalCallback) {
      var _this3 = this;

      var km = this.km;
      var cb = this.callback;

      var verifyToken = function verifyToken(refresh) {
        return km.auth.retrieveToken({
          client_id: _this3.client_id,
          refresh_token: refresh
        });
      };

      _async["default"].tryEach([// try to find the token via the environment
      function (next) {
        if (!process.env.PM2_IO_TOKEN) {
          return next(new Error('No token in env'));
        }

        verifyToken(process.env.PM2_IO_TOKEN).then(function (res) {
          return next(null, res.data);
        })["catch"](next);
      }, // try to find it in the file system
      function (next) {
        _fs["default"].readFile(_constants["default"].PM2_IO_ACCESS_TOKEN, "utf8", function (err, tokens) {
          if (err) return next(err); // verify that the token is valid

          tokens = JSON.parse(tokens || '{}');

          if (new Date(tokens.expire_at) > new Date(new Date().toISOString())) {
            return next(null, tokens);
          }

          verifyToken(tokens.refresh_token).then(function (res) {
            return next(null, res.data);
          })["catch"](next);
        });
      }, // otherwise make the whole flow
      function (next) {
        return _this3.loginViaWeb(function (data) {
          // verify that the token is valid
          verifyToken(data.access_token).then(function (res) {
            return next(null, res.data);
          })["catch"](function (err) {
            return next(err);
          });
        });
      }], function (err, result) {
        // if present run the optional callback
        if (typeof optionalCallback === 'function') {
          optionalCallback(err, result);
        }

        if (result.refresh_token) {
          _this3.authenticated = true;
          var file = _constants["default"].PM2_IO_ACCESS_TOKEN;

          _fs["default"].writeFile(file, JSON.stringify(result), function () {
            return cb(err, result);
          });
        } else {
          return cb(err, result);
        }
      });
    }
  }, {
    key: "loginViaWeb",
    value: function loginViaWeb(cb) {
      var _this4 = this;

      var redirectURL = "".concat(this.oauth_endpoint).concat(this.oauth_query);
      console.log("".concat(_constants["default"].PM2_IO_MSG, " Please follow the popup or go to this URL :"), '\n', '    ', redirectURL);
      var shutdown = false;

      var server = _http["default"].createServer(function (req, res) {
        // only handle one request
        if (shutdown === true) return res.end();
        shutdown = true;

        var query = _url["default"].parse(req.url, true).query;

        res.write("\n        <head>\n          <script>\n          </script>\n        </head>\n        <body>\n          <h2 style=\"text-align: center\">\n            You can go back to your terminal now :)\n          </h2>\n        </body>");
        res.end();
        server.close();
        return cb(query);
      });

      server.listen(43532, function () {
        _this4.open(redirectURL);
      });
    }
  }, {
    key: "deleteTokens",
    value: function deleteTokens(km) {
      return new Promise(function (resolve, reject) {
        // revoke the refreshToken
        km.auth.revoke().then(function (res) {
          // remove the token from the filesystem
          var file = _constants["default"].PM2_IO_ACCESS_TOKEN;

          _fs["default"].unlinkSync(file);

          return resolve(res);
        })["catch"](reject);
      });
    }
  }, {
    key: "open",
    value: function open(target, appName, callback) {
      var opener;

      var escape = function escape(s) {
        return s.replace(/"/g, '\\"');
      };

      if (typeof appName === 'function') {
        callback = appName;
        appName = null;
      }

      switch (process.platform) {
        case 'darwin':
          {
            opener = appName ? "open -a \"".concat(escape(appName), "\"") : "open";
            break;
          }

        case 'win32':
          {
            opener = appName ? "start \"\" ".concat(escape(appName), "\"") : "start \"\"";
            break;
          }

        default:
          {
            opener = appName ? escape(appName) : "xdg-open";
            break;
          }
      }

      if (process.env.SUDO_USER) {
        opener = 'sudo -u ' + process.env.SUDO_USER + ' ' + opener;
      }

      return (0, _child_process.exec)("".concat(opener, " \"").concat(escape(target), "\""), callback);
    }
  }]);
  return WebStrategy;
}(_strategy["default"]);

exports["default"] = WebStrategy;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9BUEkvcG0yLXBsdXMvYXV0aC1zdHJhdGVnaWVzL1dlYkF1dGgudHMiXSwibmFtZXMiOlsiV2ViU3RyYXRlZ3kiLCJvcHRzIiwia20iLCJjYiIsImF1dGhlbnRpY2F0ZWQiLCJjYWxsYmFjayIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwidG9rZW5zUGF0aCIsImNzdCIsIlBNMl9JT19BQ0NFU1NfVE9LRU4iLCJmcyIsInJlYWRGaWxlIiwiZXJyIiwidG9rZW5zIiwiY29kZSIsIkpTT04iLCJwYXJzZSIsInRvU3RyaW5nIiwidW5saW5rU3luYyIsInJlZnJlc2hfdG9rZW4iLCJvcHRpb25hbENhbGxiYWNrIiwidmVyaWZ5VG9rZW4iLCJyZWZyZXNoIiwiYXV0aCIsInJldHJpZXZlVG9rZW4iLCJjbGllbnRfaWQiLCJhc3luYyIsInRyeUVhY2giLCJuZXh0IiwicHJvY2VzcyIsImVudiIsIlBNMl9JT19UT0tFTiIsIkVycm9yIiwidGhlbiIsInJlcyIsImRhdGEiLCJEYXRlIiwiZXhwaXJlX2F0IiwidG9JU09TdHJpbmciLCJsb2dpblZpYVdlYiIsImFjY2Vzc190b2tlbiIsInJlc3VsdCIsImZpbGUiLCJ3cml0ZUZpbGUiLCJzdHJpbmdpZnkiLCJyZWRpcmVjdFVSTCIsIm9hdXRoX2VuZHBvaW50Iiwib2F1dGhfcXVlcnkiLCJjb25zb2xlIiwibG9nIiwiUE0yX0lPX01TRyIsInNodXRkb3duIiwic2VydmVyIiwiaHR0cCIsImNyZWF0ZVNlcnZlciIsInJlcSIsImVuZCIsInF1ZXJ5IiwidXJsIiwid3JpdGUiLCJjbG9zZSIsImxpc3RlbiIsIm9wZW4iLCJyZXZva2UiLCJ0YXJnZXQiLCJhcHBOYW1lIiwib3BlbmVyIiwiZXNjYXBlIiwicyIsInJlcGxhY2UiLCJwbGF0Zm9ybSIsIlNVRE9fVVNFUiIsIkF1dGhTdHJhdGVneSJdLCJtYXBwaW5ncyI6IkFBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7O0FBRUE7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R0FBUixDQUFZeUMsU0FBaEIsRUFBMkI7QUFDekJMLFFBQUFBLE1BQU0sR0FBRyxhQUFhckMsT0FBTyxDQUFDQyxHQUFSLENBQVl5QyxTQUF6QixHQUFxQyxHQUFyQyxHQUEyQ0wsTUFBcEQ7QUFDRDs7QUFDRCxhQUFPLG1DQUFRQSxNQUFSLGdCQUFtQkMsTUFBTSxDQUFDSCxNQUFELENBQXpCLFNBQXNDN0QsUUFBdEMsQ0FBUDtBQUNEOzs7RUExTHNDcUUsb0IiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgY3N0IGZyb20nLi4vLi4vLi4vLi4vY29uc3RhbnRzJztcblxuaW1wb3J0IEF1dGhTdHJhdGVneSBmcm9tJ0BwbTIvanMtYXBpL3NyYy9hdXRoX3N0cmF0ZWdpZXMvc3RyYXRlZ3knXG5pbXBvcnQgaHR0cCBmcm9tJ2h0dHAnXG5pbXBvcnQgZnMgZnJvbSdmcydcbmltcG9ydCB1cmwgZnJvbSd1cmwnXG5pbXBvcnQgeyBleGVjIH0gZnJvbSdjaGlsZF9wcm9jZXNzJ1xuaW1wb3J0IGFzeW5jIGZyb20nYXN5bmMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdlYlN0cmF0ZWd5IGV4dGVuZHMgQXV0aFN0cmF0ZWd5IHtcblxuICBhdXRoZW50aWNhdGVkOiBib29sZWFuO1xuICBjYWxsYmFjazogKGVyciwgcmVzdWx0KSA9PiB2b2lkO1xuICBrbTogYW55O1xuXG4gIGNsaWVudF9pZDogc3RyaW5nO1xuICBvYXV0aF9lbmRwb2ludDogc3RyaW5nO1xuICBvYXV0aF9xdWVyeTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKG9wdHM/KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIC8vIHRoZSBjbGllbnQgd2lsbCB0cnkgdG8gY2FsbCB0aGlzIGJ1dCB3ZSBoYW5kbGUgdGhpcyBwYXJ0IG91cnNlbHZlc1xuICByZXRyaWV2ZVRva2VucyAoa20sIGNiKSB7XG4gICAgdGhpcy5hdXRoZW50aWNhdGVkID0gZmFsc2VcbiAgICB0aGlzLmNhbGxiYWNrID0gY2JcbiAgICB0aGlzLmttID0ga21cbiAgfVxuXG4gIC8vIHNvIHRoZSBjbGkga25vdyBpZiB3ZSBuZWVkIHRvIHRlbGwgdXNlciB0byBsb2dpbi9yZWdpc3RlclxuICBpc0F1dGhlbnRpY2F0ZWQgKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZiAodGhpcy5hdXRoZW50aWNhdGVkKSByZXR1cm4gcmVzb2x2ZSh0cnVlKVxuXG4gICAgICBsZXQgdG9rZW5zUGF0aCA9IGNzdC5QTTJfSU9fQUNDRVNTX1RPS0VOXG4gICAgICBmcy5yZWFkRmlsZSh0b2tlbnNQYXRoLCAoZXJyLCB0b2tlbnM6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyICYmIGVyci5jb2RlID09PSAnRU5PRU5UJykgcmV0dXJuIHJlc29sdmUoZmFsc2UpXG4gICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKVxuXG4gICAgICAgIC8vIHZlcmlmeSB0aGF0IHRoZSB0b2tlbiBpcyB2YWxpZFxuICAgICAgICB0cnkge1xuICAgICAgICAgIHRva2VucyA9IEpTT04ucGFyc2UodG9rZW5zLnRvU3RyaW5nKCkgfHwgJ3t9JylcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgZnMudW5saW5rU3luYyh0b2tlbnNQYXRoKVxuICAgICAgICAgIHJldHVybiByZXNvbHZlKGZhbHNlKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlIHJlZnJlc2ggdG9rZW5zIGlzIGhlcmUsIHRoZSB1c2VyIGNvdWxkIGJlIGF1dG9tYXRpY2FsbHkgYXV0aGVudGljYXRlZFxuICAgICAgICByZXR1cm4gcmVzb2x2ZSh0eXBlb2YgdG9rZW5zLnJlZnJlc2hfdG9rZW4gPT09ICdzdHJpbmcnKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLy8gY2FsbGVkIHdoZW4gd2UgYXJlIHN1cmUgdGhlIHVzZXIgYXNrZWQgdG8gYmUgbG9nZ2VkIGluXG4gIF9yZXRyaWV2ZVRva2VucyAob3B0aW9uYWxDYWxsYmFjaykge1xuICAgIGNvbnN0IGttID0gdGhpcy5rbVxuICAgIGNvbnN0IGNiID0gdGhpcy5jYWxsYmFja1xuXG4gICAgbGV0IHZlcmlmeVRva2VuID0gKHJlZnJlc2gpID0+IHtcbiAgICAgIHJldHVybiBrbS5hdXRoLnJldHJpZXZlVG9rZW4oe1xuICAgICAgICBjbGllbnRfaWQ6IHRoaXMuY2xpZW50X2lkLFxuICAgICAgICByZWZyZXNoX3Rva2VuOiByZWZyZXNoXG4gICAgICB9KVxuICAgIH1cbiAgICBhc3luYy50cnlFYWNoKFtcbiAgICAgIC8vIHRyeSB0byBmaW5kIHRoZSB0b2tlbiB2aWEgdGhlIGVudmlyb25tZW50XG4gICAgICAobmV4dCkgPT4ge1xuICAgICAgICBpZiAoIXByb2Nlc3MuZW52LlBNMl9JT19UT0tFTikge1xuICAgICAgICAgIHJldHVybiBuZXh0KG5ldyBFcnJvcignTm8gdG9rZW4gaW4gZW52JykpXG4gICAgICAgIH1cbiAgICAgICAgdmVyaWZ5VG9rZW4ocHJvY2Vzcy5lbnYuUE0yX0lPX1RPS0VOKVxuICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KG51bGwsIHJlcy5kYXRhKVxuICAgICAgICAgIH0pLmNhdGNoKG5leHQpXG4gICAgICB9LFxuICAgICAgLy8gdHJ5IHRvIGZpbmQgaXQgaW4gdGhlIGZpbGUgc3lzdGVtXG4gICAgICAobmV4dCkgPT4ge1xuICAgICAgICBmcy5yZWFkRmlsZShjc3QuUE0yX0lPX0FDQ0VTU19UT0tFTiwgXCJ1dGY4XCIsIChlcnIsIHRva2VuczogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmV0dXJuIG5leHQoZXJyKVxuICAgICAgICAgIC8vIHZlcmlmeSB0aGF0IHRoZSB0b2tlbiBpcyB2YWxpZFxuICAgICAgICAgIHRva2VucyA9IEpTT04ucGFyc2UodG9rZW5zIHx8ICd7fScpXG4gICAgICAgICAgaWYgKG5ldyBEYXRlKHRva2Vucy5leHBpcmVfYXQpID4gbmV3IERhdGUobmV3IERhdGUoKS50b0lTT1N0cmluZygpKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5leHQobnVsbCwgdG9rZW5zKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHZlcmlmeVRva2VuKHRva2Vucy5yZWZyZXNoX3Rva2VuKVxuICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gbmV4dChudWxsLCByZXMuZGF0YSlcbiAgICAgICAgICAgIH0pLmNhdGNoKG5leHQpXG4gICAgICAgIH0pXG4gICAgICB9LFxuICAgICAgLy8gb3RoZXJ3aXNlIG1ha2UgdGhlIHdob2xlIGZsb3dcbiAgICAgIChuZXh0KSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvZ2luVmlhV2ViKChkYXRhKSA9PiB7XG4gICAgICAgICAgLy8gdmVyaWZ5IHRoYXQgdGhlIHRva2VuIGlzIHZhbGlkXG4gICAgICAgICAgdmVyaWZ5VG9rZW4oZGF0YS5hY2Nlc3NfdG9rZW4pXG4gICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBuZXh0KG51bGwsIHJlcy5kYXRhKVxuICAgICAgICAgICAgfSkuY2F0Y2goZXJyID0+IG5leHQoZXJyKSlcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICBdLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgIC8vIGlmIHByZXNlbnQgcnVuIHRoZSBvcHRpb25hbCBjYWxsYmFja1xuICAgICAgaWYgKHR5cGVvZiBvcHRpb25hbENhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9wdGlvbmFsQ2FsbGJhY2soZXJyLCByZXN1bHQpXG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQucmVmcmVzaF90b2tlbikge1xuICAgICAgICB0aGlzLmF1dGhlbnRpY2F0ZWQgPSB0cnVlXG4gICAgICAgIGxldCBmaWxlID0gY3N0LlBNMl9JT19BQ0NFU1NfVE9LRU5cbiAgICAgICAgZnMud3JpdGVGaWxlKGZpbGUsIEpTT04uc3RyaW5naWZ5KHJlc3VsdCksICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gY2IoZXJyLCByZXN1bHQpXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY2IoZXJyLCByZXN1bHQpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGxvZ2luVmlhV2ViIChjYikge1xuICAgIGNvbnN0IHJlZGlyZWN0VVJMID0gYCR7dGhpcy5vYXV0aF9lbmRwb2ludH0ke3RoaXMub2F1dGhfcXVlcnl9YFxuXG4gICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFBsZWFzZSBmb2xsb3cgdGhlIHBvcHVwIG9yIGdvIHRvIHRoaXMgVVJMIDpgLCAnXFxuJywgJyAgICAnLCByZWRpcmVjdFVSTClcblxuICAgIGxldCBzaHV0ZG93biA9IGZhbHNlXG4gICAgbGV0IHNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKChyZXEsIHJlcykgPT4ge1xuICAgICAgLy8gb25seSBoYW5kbGUgb25lIHJlcXVlc3RcbiAgICAgIGlmIChzaHV0ZG93biA9PT0gdHJ1ZSkgcmV0dXJuIHJlcy5lbmQoKVxuICAgICAgc2h1dGRvd24gPSB0cnVlXG5cbiAgICAgIGxldCBxdWVyeSA9IHVybC5wYXJzZShyZXEudXJsLCB0cnVlKS5xdWVyeVxuXG4gICAgICByZXMud3JpdGUoYFxuICAgICAgICA8aGVhZD5cbiAgICAgICAgICA8c2NyaXB0PlxuICAgICAgICAgIDwvc2NyaXB0PlxuICAgICAgICA8L2hlYWQ+XG4gICAgICAgIDxib2R5PlxuICAgICAgICAgIDxoMiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlclwiPlxuICAgICAgICAgICAgWW91IGNhbiBnbyBiYWNrIHRvIHlvdXIgdGVybWluYWwgbm93IDopXG4gICAgICAgICAgPC9oMj5cbiAgICAgICAgPC9ib2R5PmApXG4gICAgICByZXMuZW5kKClcbiAgICAgIHNlcnZlci5jbG9zZSgpXG4gICAgICByZXR1cm4gY2IocXVlcnkpXG4gICAgfSlcbiAgICBzZXJ2ZXIubGlzdGVuKDQzNTMyLCAoKSA9PiB7XG4gICAgICB0aGlzLm9wZW4ocmVkaXJlY3RVUkwpXG4gICAgfSlcbiAgfVxuXG4gIGRlbGV0ZVRva2VucyAoa20pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgLy8gcmV2b2tlIHRoZSByZWZyZXNoVG9rZW5cbiAgICAgIGttLmF1dGgucmV2b2tlKClcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAvLyByZW1vdmUgdGhlIHRva2VuIGZyb20gdGhlIGZpbGVzeXN0ZW1cbiAgICAgICAgICBsZXQgZmlsZSA9IGNzdC5QTTJfSU9fQUNDRVNTX1RPS0VOXG4gICAgICAgICAgZnMudW5saW5rU3luYyhmaWxlKVxuICAgICAgICAgIHJldHVybiByZXNvbHZlKHJlcylcbiAgICAgICAgfSkuY2F0Y2gocmVqZWN0KVxuICAgIH0pXG4gIH1cblxuICBvcGVuICh0YXJnZXQsIGFwcE5hbWU/LCBjYWxsYmFjaz8pIHtcbiAgICBsZXQgb3BlbmVyXG4gICAgY29uc3QgZXNjYXBlID0gZnVuY3Rpb24gKHMpIHtcbiAgICAgIHJldHVybiBzLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgKGFwcE5hbWUpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IGFwcE5hbWVcbiAgICAgIGFwcE5hbWUgPSBudWxsXG4gICAgfVxuXG4gICAgc3dpdGNoIChwcm9jZXNzLnBsYXRmb3JtKSB7XG4gICAgICBjYXNlICdkYXJ3aW4nOiB7XG4gICAgICAgIG9wZW5lciA9IGFwcE5hbWUgPyBgb3BlbiAtYSBcIiR7ZXNjYXBlKGFwcE5hbWUpfVwiYCA6IGBvcGVuYFxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgY2FzZSAnd2luMzInOiB7XG4gICAgICAgIG9wZW5lciA9IGFwcE5hbWUgPyBgc3RhcnQgXCJcIiAke2VzY2FwZShhcHBOYW1lKX1cImAgOiBgc3RhcnQgXCJcImBcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgb3BlbmVyID0gYXBwTmFtZSA/IGVzY2FwZShhcHBOYW1lKSA6IGB4ZGctb3BlbmBcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocHJvY2Vzcy5lbnYuU1VET19VU0VSKSB7XG4gICAgICBvcGVuZXIgPSAnc3VkbyAtdSAnICsgcHJvY2Vzcy5lbnYuU1VET19VU0VSICsgJyAnICsgb3BlbmVyXG4gICAgfVxuICAgIHJldHVybiBleGVjKGAke29wZW5lcn0gXCIke2VzY2FwZSh0YXJnZXQpfVwiYCwgY2FsbGJhY2spXG4gIH1cbn1cbiJdfQ==