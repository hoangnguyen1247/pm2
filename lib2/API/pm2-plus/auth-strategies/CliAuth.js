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

var _strategy = _interopRequireDefault(require("@pm2/js-api/src/auth_strategies/strategy"));

var _querystring = _interopRequireDefault(require("querystring"));

var _fs = _interopRequireDefault(require("fs"));

var _url = _interopRequireDefault(require("url"));

var _tryEach = _interopRequireDefault(require("async/tryEach"));

var _needle = _interopRequireDefault(require("needle"));

var _chalk = _interopRequireDefault(require("chalk"));

var _constants = _interopRequireDefault(require("../../../../constants.js"));

var _promptly = _interopRequireDefault(require("promptly"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

var CliStrategy = /*#__PURE__*/function (_AuthStrategy) {
  (0, _inherits2["default"])(CliStrategy, _AuthStrategy);

  var _super = _createSuper(CliStrategy);

  function CliStrategy(opts) {
    var _this;

    (0, _classCallCheck2["default"])(this, CliStrategy);
    _this = _super.call(this);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "authenticated", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "callback", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "km", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "BASE_URI", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "client_id", void 0);
    return _this;
  } // the client will try to call this but we handle this part ourselves


  (0, _createClass2["default"])(CliStrategy, [{
    key: "retrieveTokens",
    value: function retrieveTokens(km, cb) {
      this.authenticated = false;
      this.callback = cb;
      this.km = km;
      this.BASE_URI = 'https://id.keymetrics.io';
    } // so the cli know if we need to tell user to login/register

  }, {
    key: "isAuthenticated",
    value: function isAuthenticated() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (_this2.authenticated) return resolve(true);
        var tokensPath = _constants["default"].PM2_IO_ACCESS_TOKEN;

        _fs["default"].readFile(tokensPath, "utf8", function (err, tokens) {
          if (err && err.code === 'ENOENT') return resolve(false);
          if (err) return reject(err); // verify that the token is valid

          try {
            tokens = JSON.parse(tokens || '{}');
          } catch (err) {
            _fs["default"].unlinkSync(tokensPath);

            return resolve(false);
          } // if the refresh tokens is here, the user could be automatically authenticated


          return resolve(typeof tokens.refresh_token === 'string');
        });
      });
    }
  }, {
    key: "verifyToken",
    value: function verifyToken(refresh) {
      return this.km.auth.retrieveToken({
        client_id: this.client_id,
        refresh_token: refresh
      });
    } // called when we are sure the user asked to be logged in

  }, {
    key: "_retrieveTokens",
    value: function _retrieveTokens(optionalCallback) {
      var _this3 = this;

      var km = this.km;
      var cb = this.callback;
      (0, _tryEach["default"])([// try to find the token via the environment
      function (next) {
        if (!process.env.PM2_IO_TOKEN) {
          return next(new Error('No token in env'));
        }

        _this3.verifyToken(process.env.PM2_IO_TOKEN).then(function (res) {
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

          _this3.verifyToken(tokens.refresh_token).then(function (res) {
            return next(null, res.data);
          })["catch"](next);
        });
      }, // otherwise make the whole flow
      function (next) {
        return _this3.authenticate(function (err, data) {
          if (err instanceof Error) return next(err); // verify that the token is valid

          _this3.verifyToken(data.refresh_token).then(function (res) {
            return next(null, res.data);
          })["catch"](next);
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
    key: "authenticate",
    value: function authenticate(cb) {
      var _this4 = this;

      console.log("".concat(_constants["default"].PM2_IO_MSG, " Using non-browser authentication."));

      _promptly["default"].confirm("".concat(_constants["default"].PM2_IO_MSG, " Do you have a pm2.io account? (y/n)"), function (err, answer) {
        // Either login or register
        return answer === true ? _this4.login(cb) : _this4.register(cb);
      });
    }
  }, {
    key: "login",
    value: function login(cb) {
      var _this5 = this;

      var retry = function retry() {
        _promptly["default"].prompt("".concat(_constants["default"].PM2_IO_MSG, " Your username or email: "), function (err, username) {
          if (err) return retry();

          _promptly["default"].password("".concat(_constants["default"].PM2_IO_MSG, " Your password: "), {
            replace: '*'
          }, function (err, password) {
            if (err) return retry();
            console.log("".concat(_constants["default"].PM2_IO_MSG, " Authenticating ..."));

            _this5._loginUser({
              username: username,
              password: password
            }, function (err, data) {
              if (err) {
                console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " Failed to authenticate: ").concat(err.message));
                return retry();
              }

              return cb(null, data);
            });
          });
        });
      };

      retry();
    }
  }, {
    key: "register",
    value: function register(cb) {
      var _this6 = this;

      console.log("".concat(_constants["default"].PM2_IO_MSG, " No problem ! We just need few informations to create your account"));

      var retry = function retry() {
        _promptly["default"].prompt("".concat(_constants["default"].PM2_IO_MSG, " Please choose an username :"), {
          validator: _this6._validateUsername,
          retry: true
        }, function (err, username) {
          _promptly["default"].prompt("".concat(_constants["default"].PM2_IO_MSG, " Please choose an email :"), {
            validator: _this6._validateEmail,
            retry: true
          }, function (err, email) {
            _promptly["default"].password("".concat(_constants["default"].PM2_IO_MSG, " Please choose a password :"), {
              replace: '*'
            }, function (err, password) {
              _promptly["default"].confirm("".concat(_constants["default"].PM2_IO_MSG, " Do you accept the terms and privacy policy (https://pm2.io/legals/terms_conditions.pdf) ?  (y/n)"), function (err, answer) {
                if (err) {
                  console.error(_chalk["default"].bold.red(err));
                  return retry();
                } else if (answer === false) {
                  console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " You must accept the terms and privacy policy to contiue."));
                  return retry();
                }

                _this6._registerUser({
                  email: email,
                  password: password,
                  username: username
                }, function (err, data) {
                  console.log('\n');

                  if (err) {
                    console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " Unexpect error: ").concat(err.message));
                    console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " You can also contact us to get help: contact@pm2.io"));
                    return process.exit(1);
                  }

                  return cb(undefined, data);
                });
              });
            });
          });
        });
      };

      retry();
    }
    /**
     * Register function
     * @param opts.username
     * @param opts.password
     * @param opts.email
     */

  }, {
    key: "_registerUser",
    value: function _registerUser(opts, cb) {
      var data = Object.assign(opts, {
        password_confirmation: opts.password,
        accept_terms: true
      });

      _needle["default"].post(this.BASE_URI + '/api/oauth/register', data, {
        json: true,
        headers: {
          'X-Register-Provider': 'pm2-register',
          'x-client-id': this.client_id
        }
      }, function (err, res, body) {
        if (err) return cb(err);
        if (body.email && body.email.message) return cb(new Error(body.email.message));
        if (body.username && body.username.message) return cb(new Error(body.username.message));
        if (!body.access_token) return cb(new Error(body.msg));
        return cb(null, {
          refresh_token: body.refresh_token.token,
          access_token: body.access_token.token
        });
      });
    }
  }, {
    key: "_loginUser",
    value: function _loginUser(user_info, cb) {
      var _this7 = this;

      var URL_AUTH = '/api/oauth/authorize?response_type=token&scope=all&client_id=' + this.client_id + '&redirect_uri=http://localhost:43532';

      _needle["default"].get(this.BASE_URI + URL_AUTH, function (err, res) {
        if (err) return cb(err);
        var cookie = res.cookies;

        _needle["default"].post(_this7.BASE_URI + '/api/oauth/login', user_info, {
          cookies: cookie
        }, function (err, resp, body) {
          if (err) return cb(err);
          if (resp.statusCode != 200) return cb('Wrong credentials');
          var location = resp.headers['x-redirect'];

          _needle["default"].get(_this7.BASE_URI + location, {
            cookies: cookie
          }, function (err, res) {
            if (err) return cb(err);

            var refresh_token = _querystring["default"].parse(_url["default"].parse(res.headers.location).query).access_token;

            _needle["default"].post(_this7.BASE_URI + '/api/oauth/token', {
              client_id: _this7.client_id,
              grant_type: 'refresh_token',
              refresh_token: refresh_token,
              scope: 'all'
            }, function (err, res, body) {
              if (err) return cb(err);
              return cb(null, body);
            });
          });
        });
      });
    }
  }, {
    key: "_validateEmail",
    value: function _validateEmail(email) {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (re.test(email) == false) throw new Error('Not an email');
      return email;
    }
  }, {
    key: "_validateUsername",
    value: function _validateUsername(value) {
      if (value.length < 6) {
        throw new Error('Min length of 6');
      }

      return value;
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
  }]);
  return CliStrategy;
}(_strategy["default"]);

exports["default"] = CliStrategy;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9BUEkvcG0yLXBsdXMvYXV0aC1zdHJhdGVnaWVzL0NsaUF1dGgudHMiXSwibmFtZXMiOlsiQ2xpU3RyYXRlZ3kiLCJvcHRzIiwia20iLCJjYiIsImF1dGhlbnRpY2F0ZWQiLCJjYWxsYmFjayIsIkJBU0VfVVJJIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ0b2tlbnNQYXRoIiwiY3N0IiwiUE0yX0lPX0FDQ0VTU19UT0tFTiIsImZzIiwicmVhZEZpbGUiLCJlcnIiLCJ0b2tlbnMiLCJjb2RlIiwiSlNPTiIsInBhcnNlIiwidW5saW5rU3luYyIsInJlZnJlc2hfdG9rZW4iLCJyZWZyZXNoIiwiYXV0aCIsInJldHJpZXZlVG9rZW4iLCJjbGllbnRfaWQiLCJvcHRpb25hbENhbGxiYWNrIiwibmV4dCIsInByb2Nlc3MiLCJlbnYiLCJQTTJfSU9fVE9LRU4iLCJFcnJvciIsInZlcmlmeVRva2VuIiwidGhlbiIsInJlcyIsImRhdGEiLCJEYXRlIiwiZXhwaXJlX2F0IiwidG9JU09TdHJpbmciLCJhdXRoZW50aWNhdGUiLCJyZXN1bHQiLCJmaWxlIiwid3JpdGVGaWxlIiwic3RyaW5naWZ5IiwiY29uc29sZSIsImxvZyIsIlBNMl9JT19NU0ciLCJwcm9tcHRseSIsImNvbmZpcm0iLCJhbnN3ZXIiLCJsb2dpbiIsInJlZ2lzdGVyIiwicmV0cnkiLCJwcm9tcHQiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwicmVwbGFjZSIsIl9sb2dpblVzZXIiLCJlcnJvciIsIlBNMl9JT19NU0dfRVJSIiwibWVzc2FnZSIsInZhbGlkYXRvciIsIl92YWxpZGF0ZVVzZXJuYW1lIiwiX3ZhbGlkYXRlRW1haWwiLCJlbWFpbCIsImNoYWxrIiwiYm9sZCIsInJlZCIsIl9yZWdpc3RlclVzZXIiLCJleGl0IiwidW5kZWZpbmVkIiwiT2JqZWN0IiwiYXNzaWduIiwicGFzc3dvcmRfY29uZmlybWF0aW9uIiwiYWNjZXB0X3Rlcm1zIiwibmVlZGxlIiwicG9zdCIsImpzb24iLCJoZWFkZXJzIiwiYm9keSIsImFjY2Vzc190b2tlbiIsIm1zZyIsInRva2VuIiwidXNlcl9pbmZvIiwiVVJMX0FVVEgiLCJnZXQiLCJjb29raWUiLCJjb29raWVzIiwicmVzcCIsInN0YXR1c0NvZGUiLCJsb2NhdGlvbiIsInF1ZXJ5c3RyaW5nIiwidXJsIiwicXVlcnkiLCJncmFudF90eXBlIiwic2NvcGUiLCJyZSIsInRlc3QiLCJ2YWx1ZSIsImxlbmd0aCIsInJldm9rZSIsIkF1dGhTdHJhdGVneSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7O0FBQ0E7O0FBR0E7O0FBQ0E7O0FBRUE7O0FBR0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztJQUVxQkEsVzs7Ozs7QUFRbkIsdUJBQVlDLElBQVosRUFBbUI7QUFBQTs7QUFBQTtBQUNqQjtBQURpQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFFbEIsRyxDQUVEOzs7OzttQ0FDZ0JDLEUsRUFBSUMsRSxFQUFJO0FBQ3RCLFdBQUtDLGFBQUwsR0FBcUIsS0FBckI7QUFDQSxXQUFLQyxRQUFMLEdBQWdCRixFQUFoQjtBQUNBLFdBQUtELEVBQUwsR0FBVUEsRUFBVjtBQUNBLFdBQUtJLFFBQUwsR0FBZ0IsMEJBQWhCO0FBQ0QsSyxDQUVEOzs7O3NDQUNtQjtBQUFBOztBQUNqQixhQUFPLElBQUlDLE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVVDLE1BQVYsRUFBcUI7QUFDdEMsWUFBSSxNQUFJLENBQUNMLGFBQVQsRUFBd0IsT0FBT0ksT0FBTyxDQUFDLElBQUQsQ0FBZDtBQUV4QixZQUFJRSxVQUFVLEdBQUdDLHNCQUFJQyxtQkFBckI7O0FBQ0FDLHVCQUFHQyxRQUFILENBQVlKLFVBQVosRUFBd0IsTUFBeEIsRUFBZ0MsVUFBQ0ssR0FBRCxFQUFNQyxNQUFOLEVBQXNCO0FBQ3BELGNBQUlELEdBQUcsSUFBSUEsR0FBRyxDQUFDRSxJQUFKLEtBQWEsUUFBeEIsRUFBa0MsT0FBT1QsT0FBTyxD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LE1BQU0sSUFBSWpDLEtBQUosQ0FBVSxjQUFWLENBQU47QUFDRixhQUFPaUMsS0FBUDtBQUNEOzs7c0NBRWtCa0MsSyxFQUFPO0FBQ3hCLFVBQUlBLEtBQUssQ0FBQ0MsTUFBTixHQUFlLENBQW5CLEVBQXNCO0FBQ3BCLGNBQU0sSUFBSXBFLEtBQUosQ0FBVSxpQkFBVixDQUFOO0FBQ0Q7O0FBQ0QsYUFBT21FLEtBQVA7QUFDRDs7O2lDQUVhaEcsRSxFQUFJO0FBQ2hCLGFBQU8sSUFBSUssT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBVUMsTUFBVixFQUFxQjtBQUN0QztBQUNBUCxRQUFBQSxFQUFFLENBQUNxQixJQUFILENBQVE2RSxNQUFSLEdBQ0duRSxJQURILENBQ1EsVUFBQUMsR0FBRyxFQUFJO0FBQ1g7QUFDQSxjQUFJTyxJQUFJLEdBQUc5QixzQkFBSUMsbUJBQWY7O0FBQ0FDLHlCQUFHTyxVQUFILENBQWNxQixJQUFkOztBQUNBLGlCQUFPakMsT0FBTyxDQUFDMEIsR0FBRCxDQUFkO0FBQ0QsU0FOSCxXQU1XekIsTUFOWDtBQU9ELE9BVE0sQ0FBUDtBQVVEOzs7RUF4UnNDNEYsb0IiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuaW1wb3J0IEF1dGhTdHJhdGVneSAgZnJvbSdAcG0yL2pzLWFwaS9zcmMvYXV0aF9zdHJhdGVnaWVzL3N0cmF0ZWd5J1xuaW1wb3J0IHF1ZXJ5c3RyaW5nICBmcm9tJ3F1ZXJ5c3RyaW5nJztcblxuaW1wb3J0IGh0dHAgIGZyb20naHR0cCdcbmltcG9ydCBmcyAgZnJvbSdmcydcbmltcG9ydCB1cmwgIGZyb20ndXJsJ1xuaW1wb3J0IGV4ZWMgIGZyb20nY2hpbGRfcHJvY2VzcydcbmltcG9ydCB0cnlFYWNoICBmcm9tJ2FzeW5jL3RyeUVhY2gnXG5pbXBvcnQgcGF0aCAgZnJvbSdwYXRoJ1xuaW1wb3J0IG9zICBmcm9tJ29zJ1xuaW1wb3J0IG5lZWRsZSAgZnJvbSduZWVkbGUnXG5pbXBvcnQgY2hhbGsgIGZyb20nY2hhbGsnXG5pbXBvcnQgY3N0ICBmcm9tJy4uLy4uLy4uLy4uL2NvbnN0YW50cy5qcydcbmltcG9ydCBwcm9tcHRseSAgZnJvbSdwcm9tcHRseSdcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2xpU3RyYXRlZ3kgZXh0ZW5kcyBBdXRoU3RyYXRlZ3kge1xuICBhdXRoZW50aWNhdGVkOiBib29sZWFuO1xuICBjYWxsYmFjazogKGVyciwgcmVzdWx0KSA9PiB7fTtcbiAga206IGFueTtcbiAgQkFTRV9VUkk6IHN0cmluZztcblxuICBjbGllbnRfaWQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihvcHRzPykge1xuICAgIHN1cGVyKClcbiAgfVxuXG4gIC8vIHRoZSBjbGllbnQgd2lsbCB0cnkgdG8gY2FsbCB0aGlzIGJ1dCB3ZSBoYW5kbGUgdGhpcyBwYXJ0IG91cnNlbHZlc1xuICByZXRyaWV2ZVRva2VucyAoa20sIGNiKSB7XG4gICAgdGhpcy5hdXRoZW50aWNhdGVkID0gZmFsc2VcbiAgICB0aGlzLmNhbGxiYWNrID0gY2JcbiAgICB0aGlzLmttID0ga21cbiAgICB0aGlzLkJBU0VfVVJJID0gJ2h0dHBzOi8vaWQua2V5bWV0cmljcy5pbyc7XG4gIH1cblxuICAvLyBzbyB0aGUgY2xpIGtub3cgaWYgd2UgbmVlZCB0byB0ZWxsIHVzZXIgdG8gbG9naW4vcmVnaXN0ZXJcbiAgaXNBdXRoZW50aWNhdGVkICgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYXV0aGVudGljYXRlZCkgcmV0dXJuIHJlc29sdmUodHJ1ZSlcblxuICAgICAgbGV0IHRva2Vuc1BhdGggPSBjc3QuUE0yX0lPX0FDQ0VTU19UT0tFTlxuICAgICAgZnMucmVhZEZpbGUodG9rZW5zUGF0aCwgXCJ1dGY4XCIsIChlcnIsIHRva2VuczogYW55KSA9PiB7XG4gICAgICAgIGlmIChlcnIgJiYgZXJyLmNvZGUgPT09ICdFTk9FTlQnKSByZXR1cm4gcmVzb2x2ZShmYWxzZSlcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIHJlamVjdChlcnIpXG5cbiAgICAgICAgLy8gdmVyaWZ5IHRoYXQgdGhlIHRva2VuIGlzIHZhbGlkXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdG9rZW5zID0gSlNPTi5wYXJzZSh0b2tlbnMgfHwgJ3t9JylcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgZnMudW5saW5rU3luYyh0b2tlbnNQYXRoKVxuICAgICAgICAgIHJldHVybiByZXNvbHZlKGZhbHNlKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlIHJlZnJlc2ggdG9rZW5zIGlzIGhlcmUsIHRoZSB1c2VyIGNvdWxkIGJlIGF1dG9tYXRpY2FsbHkgYXV0aGVudGljYXRlZFxuICAgICAgICByZXR1cm4gcmVzb2x2ZSh0eXBlb2YgdG9rZW5zLnJlZnJlc2hfdG9rZW4gPT09ICdzdHJpbmcnKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgdmVyaWZ5VG9rZW4gKHJlZnJlc2gpIHtcbiAgICByZXR1cm4gdGhpcy5rbS5hdXRoLnJldHJpZXZlVG9rZW4oe1xuICAgICAgY2xpZW50X2lkOiB0aGlzLmNsaWVudF9pZCxcbiAgICAgIHJlZnJlc2hfdG9rZW46IHJlZnJlc2hcbiAgICB9KVxuICB9XG5cbiAgLy8gY2FsbGVkIHdoZW4gd2UgYXJlIHN1cmUgdGhlIHVzZXIgYXNrZWQgdG8gYmUgbG9nZ2VkIGluXG4gIF9yZXRyaWV2ZVRva2VucyAob3B0aW9uYWxDYWxsYmFjaykge1xuICAgIGNvbnN0IGttID0gdGhpcy5rbVxuICAgIGNvbnN0IGNiID0gdGhpcy5jYWxsYmFja1xuXG4gICAgdHJ5RWFjaChbXG4gICAgICAvLyB0cnkgdG8gZmluZCB0aGUgdG9rZW4gdmlhIHRoZSBlbnZpcm9ubWVudFxuICAgICAgKG5leHQpID0+IHtcbiAgICAgICAgaWYgKCFwcm9jZXNzLmVudi5QTTJfSU9fVE9LRU4pIHtcbiAgICAgICAgICByZXR1cm4gbmV4dChuZXcgRXJyb3IoJ05vIHRva2VuIGluIGVudicpKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudmVyaWZ5VG9rZW4ocHJvY2Vzcy5lbnYuUE0yX0lPX1RPS0VOKVxuICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KG51bGwsIHJlcy5kYXRhKVxuICAgICAgICAgIH0pLmNhdGNoKG5leHQpXG4gICAgICB9LFxuICAgICAgLy8gdHJ5IHRvIGZpbmQgaXQgaW4gdGhlIGZpbGUgc3lzdGVtXG4gICAgICAobmV4dCkgPT4ge1xuICAgICAgICBmcy5yZWFkRmlsZShjc3QuUE0yX0lPX0FDQ0VTU19UT0tFTiwgXCJ1dGY4XCIsIChlcnIsIHRva2VuczogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmV0dXJuIG5leHQoZXJyKVxuICAgICAgICAgIC8vIHZlcmlmeSB0aGF0IHRoZSB0b2tlbiBpcyB2YWxpZFxuICAgICAgICAgIHRva2VucyA9IEpTT04ucGFyc2UodG9rZW5zIHx8ICd7fScpXG4gICAgICAgICAgaWYgKG5ldyBEYXRlKHRva2Vucy5leHBpcmVfYXQpID4gbmV3IERhdGUobmV3IERhdGUoKS50b0lTT1N0cmluZygpKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5leHQobnVsbCwgdG9rZW5zKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMudmVyaWZ5VG9rZW4odG9rZW5zLnJlZnJlc2hfdG9rZW4pXG4gICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBuZXh0KG51bGwsIHJlcy5kYXRhKVxuICAgICAgICAgICAgfSkuY2F0Y2gobmV4dClcbiAgICAgICAgfSlcbiAgICAgIH0sXG4gICAgICAvLyBvdGhlcndpc2UgbWFrZSB0aGUgd2hvbGUgZmxvd1xuICAgICAgKG5leHQpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXV0aGVudGljYXRlKChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiBuZXh0KGVycilcbiAgICAgICAgICAvLyB2ZXJpZnkgdGhhdCB0aGUgdG9rZW4gaXMgdmFsaWRcbiAgICAgICAgICB0aGlzLnZlcmlmeVRva2VuKGRhdGEucmVmcmVzaF90b2tlbilcbiAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5leHQobnVsbCwgcmVzLmRhdGEpXG4gICAgICAgICAgICB9KS5jYXRjaChuZXh0KVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIF0sIChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgLy8gaWYgcHJlc2VudCBydW4gdGhlIG9wdGlvbmFsIGNhbGxiYWNrXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbmFsQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgb3B0aW9uYWxDYWxsYmFjayhlcnIsIHJlc3VsdClcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3VsdC5yZWZyZXNoX3Rva2VuKSB7XG4gICAgICAgIHRoaXMuYXV0aGVudGljYXRlZCA9IHRydWVcbiAgICAgICAgbGV0IGZpbGUgPSBjc3QuUE0yX0lPX0FDQ0VTU19UT0tFTlxuICAgICAgICBmcy53cml0ZUZpbGUoZmlsZSwgSlNPTi5zdHJpbmdpZnkocmVzdWx0KSwgKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBjYihlcnIsIHJlc3VsdClcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjYihlcnIsIHJlc3VsdClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgYXV0aGVudGljYXRlIChjYikge1xuICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBVc2luZyBub24tYnJvd3NlciBhdXRoZW50aWNhdGlvbi5gKVxuICAgIHByb21wdGx5LmNvbmZpcm0oYCR7Y3N0LlBNMl9JT19NU0d9IERvIHlvdSBoYXZlIGEgcG0yLmlvIGFjY291bnQ/ICh5L24pYCwgKGVyciwgYW5zd2VyKSA9PiB7XG4gICAgICAvLyBFaXRoZXIgbG9naW4gb3IgcmVnaXN0ZXJcbiAgICAgIHJldHVybiBhbnN3ZXIgPT09IHRydWUgPyB0aGlzLmxvZ2luKGNiKSA6IHRoaXMucmVnaXN0ZXIoY2IpXG4gICAgfSlcbiAgfVxuXG4gIGxvZ2luIChjYikge1xuICAgIGxldCByZXRyeSA9ICgpID0+IHtcbiAgICAgIHByb21wdGx5LnByb21wdChgJHtjc3QuUE0yX0lPX01TR30gWW91ciB1c2VybmFtZSBvciBlbWFpbDogYCwgKGVyciwgdXNlcm5hbWUpID0+IHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIHJldHJ5KCk7XG5cbiAgICAgICAgcHJvbXB0bHkucGFzc3dvcmQoYCR7Y3N0LlBNMl9JT19NU0d9IFlvdXIgcGFzc3dvcmQ6IGAsIHsgcmVwbGFjZSA6ICcqJyB9LCAoZXJyLCBwYXNzd29yZCkgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHJldHVybiByZXRyeSgpO1xuXG4gICAgICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IEF1dGhlbnRpY2F0aW5nIC4uLmApXG4gICAgICAgICAgdGhpcy5fbG9naW5Vc2VyKHtcbiAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZFxuICAgICAgICAgIH0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjc3QuUE0yX0lPX01TR19FUlJ9IEZhaWxlZCB0byBhdXRoZW50aWNhdGU6ICR7ZXJyLm1lc3NhZ2V9YClcbiAgICAgICAgICAgICAgcmV0dXJuIHJldHJ5KClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjYihudWxsLCBkYXRhKVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHJ5KClcbiAgfVxuXG4gIHJlZ2lzdGVyIChjYikge1xuICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBObyBwcm9ibGVtICEgV2UganVzdCBuZWVkIGZldyBpbmZvcm1hdGlvbnMgdG8gY3JlYXRlIHlvdXIgYWNjb3VudGApXG5cbiAgICB2YXIgcmV0cnkgPSAoKSA9PiB7XG4gICAgICBwcm9tcHRseS5wcm9tcHQoYCR7Y3N0LlBNMl9JT19NU0d9IFBsZWFzZSBjaG9vc2UgYW4gdXNlcm5hbWUgOmAsIHtcbiAgICAgICAgdmFsaWRhdG9yIDogdGhpcy5fdmFsaWRhdGVVc2VybmFtZSxcbiAgICAgICAgcmV0cnkgOiB0cnVlXG4gICAgICB9LCAoZXJyLCB1c2VybmFtZSkgPT4ge1xuICAgICAgICBwcm9tcHRseS5wcm9tcHQoYCR7Y3N0LlBNMl9JT19NU0d9IFBsZWFzZSBjaG9vc2UgYW4gZW1haWwgOmAsIHtcbiAgICAgICAgICB2YWxpZGF0b3IgOiB0aGlzLl92YWxpZGF0ZUVtYWlsLFxuICAgICAgICAgIHJldHJ5IDogdHJ1ZVxuICAgICAgICB9LChlcnIsIGVtYWlsKSA9PiB7XG4gICAgICAgICAgcHJvbXB0bHkucGFzc3dvcmQoYCR7Y3N0LlBNMl9JT19NU0d9IFBsZWFzZSBjaG9vc2UgYSBwYXNzd29yZCA6YCwgeyByZXBsYWNlIDogJyonIH0sIChlcnIsIHBhc3N3b3JkKSA9PiB7XG4gICAgICAgICAgICBwcm9tcHRseS5jb25maXJtKGAke2NzdC5QTTJfSU9fTVNHfSBEbyB5b3UgYWNjZXB0IHRoZSB0ZXJtcyBhbmQgcHJpdmFjeSBwb2xpY3kgKGh0dHBzOi8vcG0yLmlvL2xlZ2Fscy90ZXJtc19jb25kaXRpb25zLnBkZikgPyAgKHkvbilgLCAoZXJyLCBhbnN3ZXIpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsuYm9sZC5yZWQoZXJyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldHJ5KClcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChhbnN3ZXIgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjc3QuUE0yX0lPX01TR19FUlJ9IFlvdSBtdXN0IGFjY2VwdCB0aGUgdGVybXMgYW5kIHByaXZhY3kgcG9saWN5IHRvIGNvbnRpdWUuYClcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0cnkoKVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJVc2VyKHtcbiAgICAgICAgICAgICAgICBlbWFpbCA6IGVtYWlsLFxuICAgICAgICAgICAgICAgIHBhc3N3b3JkIDogcGFzc3dvcmQsXG4gICAgICAgICAgICAgICAgdXNlcm5hbWUgOiB1c2VybmFtZVxuICAgICAgICAgICAgICB9LCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1xcbicpXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjc3QuUE0yX0lPX01TR19FUlJ9IFVuZXhwZWN0IGVycm9yOiAke2Vyci5tZXNzYWdlfWApXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gWW91IGNhbiBhbHNvIGNvbnRhY3QgdXMgdG8gZ2V0IGhlbHA6IGNvbnRhY3RAcG0yLmlvYClcbiAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiKHVuZGVmaW5lZCwgZGF0YSlcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHJ5KClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBmdW5jdGlvblxuICAgKiBAcGFyYW0gb3B0cy51c2VybmFtZVxuICAgKiBAcGFyYW0gb3B0cy5wYXNzd29yZFxuICAgKiBAcGFyYW0gb3B0cy5lbWFpbFxuICAgKi9cbiAgX3JlZ2lzdGVyVXNlciAob3B0cywgY2IpIHtcbiAgICBjb25zdCBkYXRhID0gT2JqZWN0LmFzc2lnbihvcHRzLCB7XG4gICAgICBwYXNzd29yZF9jb25maXJtYXRpb246IG9wdHMucGFzc3dvcmQsXG4gICAgICBhY2NlcHRfdGVybXM6IHRydWVcbiAgICB9KVxuICAgIG5lZWRsZS5wb3N0KHRoaXMuQkFTRV9VUkkgKyAnL2FwaS9vYXV0aC9yZWdpc3RlcicsIGRhdGEsIHtcbiAgICAgIGpzb246IHRydWUsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdYLVJlZ2lzdGVyLVByb3ZpZGVyJzogJ3BtMi1yZWdpc3RlcicsXG4gICAgICAgICd4LWNsaWVudC1pZCc6IHRoaXMuY2xpZW50X2lkXG4gICAgICB9XG4gICAgfSwgZnVuY3Rpb24gKGVyciwgcmVzLCBib2R5KSB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgICAgaWYgKGJvZHkuZW1haWwgJiYgYm9keS5lbWFpbC5tZXNzYWdlKSByZXR1cm4gY2IobmV3IEVycm9yKGJvZHkuZW1haWwubWVzc2FnZSkpXG4gICAgICBpZiAoYm9keS51c2VybmFtZSAmJiBib2R5LnVzZXJuYW1lLm1lc3NhZ2UpIHJldHVybiBjYihuZXcgRXJyb3IoYm9keS51c2VybmFtZS5tZXNzYWdlKSlcbiAgICAgIGlmICghYm9keS5hY2Nlc3NfdG9rZW4pIHJldHVybiBjYihuZXcgRXJyb3IoYm9keS5tc2cpKVxuXG4gICAgICByZXR1cm4gY2IobnVsbCwge1xuICAgICAgICByZWZyZXNoX3Rva2VuIDogYm9keS5yZWZyZXNoX3Rva2VuLnRva2VuLFxuICAgICAgICBhY2Nlc3NfdG9rZW4gOiBib2R5LmFjY2Vzc190b2tlbi50b2tlblxuICAgICAgfSlcbiAgICB9KTtcbiAgfVxuXG4gIF9sb2dpblVzZXIgKHVzZXJfaW5mbywgY2IpIHtcbiAgICBjb25zdCBVUkxfQVVUSCA9ICcvYXBpL29hdXRoL2F1dGhvcml6ZT9yZXNwb25zZV90eXBlPXRva2VuJnNjb3BlPWFsbCZjbGllbnRfaWQ9JyArXG4gICAgICAgICAgICB0aGlzLmNsaWVudF9pZCArICcmcmVkaXJlY3RfdXJpPWh0dHA6Ly9sb2NhbGhvc3Q6NDM1MzInO1xuXG4gICAgbmVlZGxlLmdldCh0aGlzLkJBU0VfVVJJICsgVVJMX0FVVEgsIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG5cbiAgICAgIHZhciBjb29raWUgPSByZXMuY29va2llcztcblxuICAgICAgbmVlZGxlLnBvc3QodGhpcy5CQVNFX1VSSSArICcvYXBpL29hdXRoL2xvZ2luJywgdXNlcl9pbmZvLCB7XG4gICAgICAgIGNvb2tpZXMgOiBjb29raWVcbiAgICAgIH0sIChlcnIsIHJlc3AsIGJvZHkpID0+IHtcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycilcbiAgICAgICAgaWYgKHJlc3Auc3RhdHVzQ29kZSAhPSAyMDApIHJldHVybiBjYignV3JvbmcgY3JlZGVudGlhbHMnKVxuXG4gICAgICAgIHZhciBsb2NhdGlvbiA9IHJlc3AuaGVhZGVyc1sneC1yZWRpcmVjdCddXG5cbiAgICAgICAgbmVlZGxlLmdldCh0aGlzLkJBU0VfVVJJICsgbG9jYXRpb24sIHtcbiAgICAgICAgICBjb29raWVzIDogY29va2llXG4gICAgICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgICAgIHZhciByZWZyZXNoX3Rva2VuID0gcXVlcnlzdHJpbmcucGFyc2UodXJsLnBhcnNlKHJlcy5oZWFkZXJzLmxvY2F0aW9uKS5xdWVyeSkuYWNjZXNzX3Rva2VuO1xuICAgICAgICAgIG5lZWRsZS5wb3N0KHRoaXMuQkFTRV9VUkkgKyAnL2FwaS9vYXV0aC90b2tlbicsIHtcbiAgICAgICAgICAgIGNsaWVudF9pZCA6IHRoaXMuY2xpZW50X2lkLFxuICAgICAgICAgICAgZ3JhbnRfdHlwZSA6ICdyZWZyZXNoX3Rva2VuJyxcbiAgICAgICAgICAgIHJlZnJlc2hfdG9rZW4gOiByZWZyZXNoX3Rva2VuLFxuICAgICAgICAgICAgc2NvcGUgOiAnYWxsJ1xuICAgICAgICAgIH0sIChlcnIsIHJlcywgYm9keSkgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycilcbiAgICAgICAgICAgIHJldHVybiBjYihudWxsLCBib2R5KVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBfdmFsaWRhdGVFbWFpbCAoZW1haWwpIHtcbiAgICB2YXIgcmUgPSAvXigoW148PigpXFxbXFxdXFxcXC4sOzpcXHNAXCJdKyhcXC5bXjw+KClcXFtcXF1cXFxcLiw7Olxcc0BcIl0rKSopfChcIi4rXCIpKUAoKFxcW1swLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcLlswLTldezEsM31dKXwoKFthLXpBLVpcXC0wLTldK1xcLikrW2EtekEtWl17Mix9KSkkLztcbiAgICBpZiAocmUudGVzdChlbWFpbCkgPT0gZmFsc2UpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhbiBlbWFpbCcpO1xuICAgIHJldHVybiBlbWFpbDtcbiAgfVxuXG4gIF92YWxpZGF0ZVVzZXJuYW1lICh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZS5sZW5ndGggPCA2KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pbiBsZW5ndGggb2YgNicpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgZGVsZXRlVG9rZW5zIChrbSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAvLyByZXZva2UgdGhlIHJlZnJlc2hUb2tlblxuICAgICAga20uYXV0aC5yZXZva2UoKVxuICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgIC8vIHJlbW92ZSB0aGUgdG9rZW4gZnJvbSB0aGUgZmlsZXN5c3RlbVxuICAgICAgICAgIGxldCBmaWxlID0gY3N0LlBNMl9JT19BQ0NFU1NfVE9LRU5cbiAgICAgICAgICBmcy51bmxpbmtTeW5jKGZpbGUpXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUocmVzKVxuICAgICAgICB9KS5jYXRjaChyZWplY3QpXG4gICAgfSlcbiAgfVxufVxuIl19