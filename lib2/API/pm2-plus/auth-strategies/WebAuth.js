'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _constants = _interopRequireDefault(require("../../../../constants"));

var _strategy = _interopRequireDefault(require("@pm2/js-api/src/auth_strategies/strategy"));

var _http = _interopRequireDefault(require("http"));

var _fs = _interopRequireDefault(require("fs"));

var _url = _interopRequireDefault(require("url"));

var _child_process = require("child_process");

var _async = _interopRequireDefault(require("async"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var WebStrategy = /*#__PURE__*/function (_AuthStrategy) {
  _inherits(WebStrategy, _AuthStrategy);

  var _super = _createSuper(WebStrategy);

  function WebStrategy(opts) {
    var _this;

    _classCallCheck(this, WebStrategy);

    _this = _super.call(this);

    _defineProperty(_assertThisInitialized(_this), "authenticated", void 0);

    _defineProperty(_assertThisInitialized(_this), "callback", void 0);

    _defineProperty(_assertThisInitialized(_this), "km", void 0);

    _defineProperty(_assertThisInitialized(_this), "client_id", void 0);

    _defineProperty(_assertThisInitialized(_this), "oauth_endpoint", void 0);

    _defineProperty(_assertThisInitialized(_this), "oauth_query", void 0);

    return _this;
  } // the client will try to call this but we handle this part ourselves


  _createClass(WebStrategy, [{
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9BUEkvcG0yLXBsdXMvYXV0aC1zdHJhdGVnaWVzL1dlYkF1dGgudHMiXSwibmFtZXMiOlsiV2ViU3RyYXRlZ3kiLCJvcHRzIiwia20iLCJjYiIsImF1dGhlbnRpY2F0ZWQiLCJjYWxsYmFjayIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwidG9rZW5zUGF0aCIsImNzdCIsIlBNMl9JT19BQ0NFU1NfVE9LRU4iLCJmcyIsInJlYWRGaWxlIiwiZXJyIiwidG9rZW5zIiwiY29kZSIsIkpTT04iLCJwYXJzZSIsInRvU3RyaW5nIiwidW5saW5rU3luYyIsInJlZnJlc2hfdG9rZW4iLCJvcHRpb25hbENhbGxiYWNrIiwidmVyaWZ5VG9rZW4iLCJyZWZyZXNoIiwiYXV0aCIsInJldHJpZXZlVG9rZW4iLCJjbGllbnRfaWQiLCJhc3luYyIsInRyeUVhY2giLCJuZXh0IiwicHJvY2VzcyIsImVudiIsIlBNMl9JT19UT0tFTiIsIkVycm9yIiwidGhlbiIsInJlcyIsImRhdGEiLCJEYXRlIiwiZXhwaXJlX2F0IiwidG9JU09TdHJpbmciLCJsb2dpblZpYVdlYiIsImFjY2Vzc190b2tlbiIsInJlc3VsdCIsImZpbGUiLCJ3cml0ZUZpbGUiLCJzdHJpbmdpZnkiLCJyZWRpcmVjdFVSTCIsIm9hdXRoX2VuZHBvaW50Iiwib2F1dGhfcXVlcnkiLCJjb25zb2xlIiwibG9nIiwiUE0yX0lPX01TRyIsInNodXRkb3duIiwic2VydmVyIiwiaHR0cCIsImNyZWF0ZVNlcnZlciIsInJlcSIsImVuZCIsInF1ZXJ5IiwidXJsIiwid3JpdGUiLCJjbG9zZSIsImxpc3RlbiIsIm9wZW4iLCJyZXZva2UiLCJ0YXJnZXQiLCJhcHBOYW1lIiwib3BlbmVyIiwiZXNjYXBlIiwicyIsInJlcGxhY2UiLCJwbGF0Zm9ybSIsIlNVRE9fVVNFUiIsIkF1dGhTdHJhdGVneSJdLCJtYXBwaW5ncyI6IkFBQ0E7Ozs7Ozs7QUFFQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFD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cEMsT0FBTyxDQUFDQyxHQUFSLENBQVl5QyxTQUFoQixFQUEyQjtBQUN6QkwsUUFBQUEsTUFBTSxHQUFHLGFBQWFyQyxPQUFPLENBQUNDLEdBQVIsQ0FBWXlDLFNBQXpCLEdBQXFDLEdBQXJDLEdBQTJDTCxNQUFwRDtBQUNEOztBQUNELGFBQU8sbUNBQVFBLE1BQVIsZ0JBQW1CQyxNQUFNLENBQUNILE1BQUQsQ0FBekIsU0FBc0M3RCxRQUF0QyxDQUFQO0FBQ0Q7Ozs7RUExTHNDcUUsb0IiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuJ3VzZSBzdHJpY3QnXHJcblxyXG5pbXBvcnQgY3N0IGZyb20nLi4vLi4vLi4vLi4vY29uc3RhbnRzJztcclxuXHJcbmltcG9ydCBBdXRoU3RyYXRlZ3kgZnJvbSdAcG0yL2pzLWFwaS9zcmMvYXV0aF9zdHJhdGVnaWVzL3N0cmF0ZWd5J1xyXG5pbXBvcnQgaHR0cCBmcm9tJ2h0dHAnXHJcbmltcG9ydCBmcyBmcm9tJ2ZzJ1xyXG5pbXBvcnQgdXJsIGZyb20ndXJsJ1xyXG5pbXBvcnQgeyBleGVjIH0gZnJvbSdjaGlsZF9wcm9jZXNzJ1xyXG5pbXBvcnQgYXN5bmMgZnJvbSdhc3luYydcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdlYlN0cmF0ZWd5IGV4dGVuZHMgQXV0aFN0cmF0ZWd5IHtcclxuXHJcbiAgYXV0aGVudGljYXRlZDogYm9vbGVhbjtcclxuICBjYWxsYmFjazogKGVyciwgcmVzdWx0KSA9PiB2b2lkO1xyXG4gIGttOiBhbnk7XHJcblxyXG4gIGNsaWVudF9pZDogc3RyaW5nO1xyXG4gIG9hdXRoX2VuZHBvaW50OiBzdHJpbmc7XHJcbiAgb2F1dGhfcXVlcnk6IHN0cmluZztcclxuXHJcbiAgY29uc3RydWN0b3Iob3B0cz8pIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgfVxyXG5cclxuICAvLyB0aGUgY2xpZW50IHdpbGwgdHJ5IHRvIGNhbGwgdGhpcyBidXQgd2UgaGFuZGxlIHRoaXMgcGFydCBvdXJzZWx2ZXNcclxuICByZXRyaWV2ZVRva2VucyAoa20sIGNiKSB7XHJcbiAgICB0aGlzLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZVxyXG4gICAgdGhpcy5jYWxsYmFjayA9IGNiXHJcbiAgICB0aGlzLmttID0ga21cclxuICB9XHJcblxyXG4gIC8vIHNvIHRoZSBjbGkga25vdyBpZiB3ZSBuZWVkIHRvIHRlbGwgdXNlciB0byBsb2dpbi9yZWdpc3RlclxyXG4gIGlzQXV0aGVudGljYXRlZCAoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBpZiAodGhpcy5hdXRoZW50aWNhdGVkKSByZXR1cm4gcmVzb2x2ZSh0cnVlKVxyXG5cclxuICAgICAgbGV0IHRva2Vuc1BhdGggPSBjc3QuUE0yX0lPX0FDQ0VTU19UT0tFTlxyXG4gICAgICBmcy5yZWFkRmlsZSh0b2tlbnNQYXRoLCAoZXJyLCB0b2tlbnM6IGFueSkgPT4ge1xyXG4gICAgICAgIGlmIChlcnIgJiYgZXJyLmNvZGUgPT09ICdFTk9FTlQnKSByZXR1cm4gcmVzb2x2ZShmYWxzZSlcclxuICAgICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0KGVycilcclxuXHJcbiAgICAgICAgLy8gdmVyaWZ5IHRoYXQgdGhlIHRva2VuIGlzIHZhbGlkXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIHRva2VucyA9IEpTT04ucGFyc2UodG9rZW5zLnRvU3RyaW5nKCkgfHwgJ3t9JylcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgIGZzLnVubGlua1N5bmModG9rZW5zUGF0aClcclxuICAgICAgICAgIHJldHVybiByZXNvbHZlKGZhbHNlKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaWYgdGhlIHJlZnJlc2ggdG9rZW5zIGlzIGhlcmUsIHRoZSB1c2VyIGNvdWxkIGJlIGF1dG9tYXRpY2FsbHkgYXV0aGVudGljYXRlZFxyXG4gICAgICAgIHJldHVybiByZXNvbHZlKHR5cGVvZiB0b2tlbnMucmVmcmVzaF90b2tlbiA9PT0gJ3N0cmluZycpXHJcbiAgICAgIH0pXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgLy8gY2FsbGVkIHdoZW4gd2UgYXJlIHN1cmUgdGhlIHVzZXIgYXNrZWQgdG8gYmUgbG9nZ2VkIGluXHJcbiAgX3JldHJpZXZlVG9rZW5zIChvcHRpb25hbENhbGxiYWNrKSB7XHJcbiAgICBjb25zdCBrbSA9IHRoaXMua21cclxuICAgIGNvbnN0IGNiID0gdGhpcy5jYWxsYmFja1xyXG5cclxuICAgIGxldCB2ZXJpZnlUb2tlbiA9IChyZWZyZXNoKSA9PiB7XHJcbiAgICAgIHJldHVybiBrbS5hdXRoLnJldHJpZXZlVG9rZW4oe1xyXG4gICAgICAgIGNsaWVudF9pZDogdGhpcy5jbGllbnRfaWQsXHJcbiAgICAgICAgcmVmcmVzaF90b2tlbjogcmVmcmVzaFxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gICAgYXN5bmMudHJ5RWFjaChbXHJcbiAgICAgIC8vIHRyeSB0byBmaW5kIHRoZSB0b2tlbiB2aWEgdGhlIGVudmlyb25tZW50XHJcbiAgICAgIChuZXh0KSA9PiB7XHJcbiAgICAgICAgaWYgKCFwcm9jZXNzLmVudi5QTTJfSU9fVE9LRU4pIHtcclxuICAgICAgICAgIHJldHVybiBuZXh0KG5ldyBFcnJvcignTm8gdG9rZW4gaW4gZW52JykpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZlcmlmeVRva2VuKHByb2Nlc3MuZW52LlBNMl9JT19UT0tFTilcclxuICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5leHQobnVsbCwgcmVzLmRhdGEpXHJcbiAgICAgICAgICB9KS5jYXRjaChuZXh0KVxyXG4gICAgICB9LFxyXG4gICAgICAvLyB0cnkgdG8gZmluZCBpdCBpbiB0aGUgZmlsZSBzeXN0ZW1cclxuICAgICAgKG5leHQpID0+IHtcclxuICAgICAgICBmcy5yZWFkRmlsZShjc3QuUE0yX0lPX0FDQ0VTU19UT0tFTiwgXCJ1dGY4XCIsIChlcnIsIHRva2VuczogYW55KSA9PiB7XHJcbiAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gbmV4dChlcnIpXHJcbiAgICAgICAgICAvLyB2ZXJpZnkgdGhhdCB0aGUgdG9rZW4gaXMgdmFsaWRcclxuICAgICAgICAgIHRva2VucyA9IEpTT04ucGFyc2UodG9rZW5zIHx8ICd7fScpXHJcbiAgICAgICAgICBpZiAobmV3IERhdGUodG9rZW5zLmV4cGlyZV9hdCkgPiBuZXcgRGF0ZShuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXh0KG51bGwsIHRva2VucylcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2ZXJpZnlUb2tlbih0b2tlbnMucmVmcmVzaF90b2tlbilcclxuICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xyXG4gICAgICAgICAgICAgIHJldHVybiBuZXh0KG51bGwsIHJlcy5kYXRhKVxyXG4gICAgICAgICAgICB9KS5jYXRjaChuZXh0KVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIG90aGVyd2lzZSBtYWtlIHRoZSB3aG9sZSBmbG93XHJcbiAgICAgIChuZXh0KSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubG9naW5WaWFXZWIoKGRhdGEpID0+IHtcclxuICAgICAgICAgIC8vIHZlcmlmeSB0aGF0IHRoZSB0b2tlbiBpcyB2YWxpZFxyXG4gICAgICAgICAgdmVyaWZ5VG9rZW4oZGF0YS5hY2Nlc3NfdG9rZW4pXHJcbiAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcclxuICAgICAgICAgICAgICByZXR1cm4gbmV4dChudWxsLCByZXMuZGF0YSlcclxuICAgICAgICAgICAgfSkuY2F0Y2goZXJyID0+IG5leHQoZXJyKSlcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICBdLCAoZXJyLCByZXN1bHQpID0+IHtcclxuICAgICAgLy8gaWYgcHJlc2VudCBydW4gdGhlIG9wdGlvbmFsIGNhbGxiYWNrXHJcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uYWxDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIG9wdGlvbmFsQ2FsbGJhY2soZXJyLCByZXN1bHQpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChyZXN1bHQucmVmcmVzaF90b2tlbikge1xyXG4gICAgICAgIHRoaXMuYXV0aGVudGljYXRlZCA9IHRydWVcclxuICAgICAgICBsZXQgZmlsZSA9IGNzdC5QTTJfSU9fQUNDRVNTX1RPS0VOXHJcbiAgICAgICAgZnMud3JpdGVGaWxlKGZpbGUsIEpTT04uc3RyaW5naWZ5KHJlc3VsdCksICgpID0+IHtcclxuICAgICAgICAgIHJldHVybiBjYihlcnIsIHJlc3VsdClcclxuICAgICAgICB9KVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBjYihlcnIsIHJlc3VsdClcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIGxvZ2luVmlhV2ViIChjYikge1xyXG4gICAgY29uc3QgcmVkaXJlY3RVUkwgPSBgJHt0aGlzLm9hdXRoX2VuZHBvaW50fSR7dGhpcy5vYXV0aF9xdWVyeX1gXHJcblxyXG4gICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFBsZWFzZSBmb2xsb3cgdGhlIHBvcHVwIG9yIGdvIHRvIHRoaXMgVVJMIDpgLCAnXFxuJywgJyAgICAnLCByZWRpcmVjdFVSTClcclxuXHJcbiAgICBsZXQgc2h1dGRvd24gPSBmYWxzZVxyXG4gICAgbGV0IHNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKChyZXEsIHJlcykgPT4ge1xyXG4gICAgICAvLyBvbmx5IGhhbmRsZSBvbmUgcmVxdWVzdFxyXG4gICAgICBpZiAoc2h1dGRvd24gPT09IHRydWUpIHJldHVybiByZXMuZW5kKClcclxuICAgICAgc2h1dGRvd24gPSB0cnVlXHJcblxyXG4gICAgICBsZXQgcXVlcnkgPSB1cmwucGFyc2UocmVxLnVybCwgdHJ1ZSkucXVlcnlcclxuXHJcbiAgICAgIHJlcy53cml0ZShgXHJcbiAgICAgICAgPGhlYWQ+XHJcbiAgICAgICAgICA8c2NyaXB0PlxyXG4gICAgICAgICAgPC9zY3JpcHQ+XHJcbiAgICAgICAgPC9oZWFkPlxyXG4gICAgICAgIDxib2R5PlxyXG4gICAgICAgICAgPGgyIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyXCI+XHJcbiAgICAgICAgICAgIFlvdSBjYW4gZ28gYmFjayB0byB5b3VyIHRlcm1pbmFsIG5vdyA6KVxyXG4gICAgICAgICAgPC9oMj5cclxuICAgICAgICA8L2JvZHk+YClcclxuICAgICAgcmVzLmVuZCgpXHJcbiAgICAgIHNlcnZlci5jbG9zZSgpXHJcbiAgICAgIHJldHVybiBjYihxdWVyeSlcclxuICAgIH0pXHJcbiAgICBzZXJ2ZXIubGlzdGVuKDQzNTMyLCAoKSA9PiB7XHJcbiAgICAgIHRoaXMub3BlbihyZWRpcmVjdFVSTClcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBkZWxldGVUb2tlbnMgKGttKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAvLyByZXZva2UgdGhlIHJlZnJlc2hUb2tlblxyXG4gICAgICBrbS5hdXRoLnJldm9rZSgpXHJcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcclxuICAgICAgICAgIC8vIHJlbW92ZSB0aGUgdG9rZW4gZnJvbSB0aGUgZmlsZXN5c3RlbVxyXG4gICAgICAgICAgbGV0IGZpbGUgPSBjc3QuUE0yX0lPX0FDQ0VTU19UT0tFTlxyXG4gICAgICAgICAgZnMudW5saW5rU3luYyhmaWxlKVxyXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzKVxyXG4gICAgICAgIH0pLmNhdGNoKHJlamVjdClcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBvcGVuICh0YXJnZXQsIGFwcE5hbWU/LCBjYWxsYmFjaz8pIHtcclxuICAgIGxldCBvcGVuZXJcclxuICAgIGNvbnN0IGVzY2FwZSA9IGZ1bmN0aW9uIChzKSB7XHJcbiAgICAgIHJldHVybiBzLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgKGFwcE5hbWUpID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGNhbGxiYWNrID0gYXBwTmFtZVxyXG4gICAgICBhcHBOYW1lID0gbnVsbFxyXG4gICAgfVxyXG5cclxuICAgIHN3aXRjaCAocHJvY2Vzcy5wbGF0Zm9ybSkge1xyXG4gICAgICBjYXNlICdkYXJ3aW4nOiB7XHJcbiAgICAgICAgb3BlbmVyID0gYXBwTmFtZSA/IGBvcGVuIC1hIFwiJHtlc2NhcGUoYXBwTmFtZSl9XCJgIDogYG9wZW5gXHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgfVxyXG4gICAgICBjYXNlICd3aW4zMic6IHtcclxuICAgICAgICBvcGVuZXIgPSBhcHBOYW1lID8gYHN0YXJ0IFwiXCIgJHtlc2NhcGUoYXBwTmFtZSl9XCJgIDogYHN0YXJ0IFwiXCJgXHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgfVxyXG4gICAgICBkZWZhdWx0OiB7XHJcbiAgICAgICAgb3BlbmVyID0gYXBwTmFtZSA/IGVzY2FwZShhcHBOYW1lKSA6IGB4ZGctb3BlbmBcclxuICAgICAgICBicmVha1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHByb2Nlc3MuZW52LlNVRE9fVVNFUikge1xyXG4gICAgICBvcGVuZXIgPSAnc3VkbyAtdSAnICsgcHJvY2Vzcy5lbnYuU1VET19VU0VSICsgJyAnICsgb3BlbmVyXHJcbiAgICB9XHJcbiAgICByZXR1cm4gZXhlYyhgJHtvcGVuZXJ9IFwiJHtlc2NhcGUodGFyZ2V0KX1cImAsIGNhbGxiYWNrKVxyXG4gIH1cclxufVxyXG4iXX0=