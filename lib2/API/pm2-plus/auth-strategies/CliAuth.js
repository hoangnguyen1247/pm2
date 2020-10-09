'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _strategy = _interopRequireDefault(require("@pm2/js-api/src/auth_strategies/strategy"));

var _querystring = _interopRequireDefault(require("querystring"));

var _fs = _interopRequireDefault(require("fs"));

var _url = _interopRequireDefault(require("url"));

var _tryEach = _interopRequireDefault(require("async/tryEach"));

var _needle = _interopRequireDefault(require("needle"));

var _chalk = _interopRequireDefault(require("chalk"));

var _constants = _interopRequireDefault(require("../../../../constants.js"));

var _promptly = _interopRequireDefault(require("promptly"));

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

var CliStrategy = /*#__PURE__*/function (_AuthStrategy) {
  _inherits(CliStrategy, _AuthStrategy);

  var _super = _createSuper(CliStrategy);

  function CliStrategy(opts) {
    var _this;

    _classCallCheck(this, CliStrategy);

    _this = _super.call(this);

    _defineProperty(_assertThisInitialized(_this), "authenticated", void 0);

    _defineProperty(_assertThisInitialized(_this), "callback", void 0);

    _defineProperty(_assertThisInitialized(_this), "km", void 0);

    _defineProperty(_assertThisInitialized(_this), "BASE_URI", void 0);

    _defineProperty(_assertThisInitialized(_this), "client_id", void 0);

    return _this;
  } // the client will try to call this but we handle this part ourselves


  _createClass(CliStrategy, [{
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9BUEkvcG0yLXBsdXMvYXV0aC1zdHJhdGVnaWVzL0NsaUF1dGgudHMiXSwibmFtZXMiOlsiQ2xpU3RyYXRlZ3kiLCJvcHRzIiwia20iLCJjYiIsImF1dGhlbnRpY2F0ZWQiLCJjYWxsYmFjayIsIkJBU0VfVVJJIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ0b2tlbnNQYXRoIiwiY3N0IiwiUE0yX0lPX0FDQ0VTU19UT0tFTiIsImZzIiwicmVhZEZpbGUiLCJlcnIiLCJ0b2tlbnMiLCJjb2RlIiwiSlNPTiIsInBhcnNlIiwidW5saW5rU3luYyIsInJlZnJlc2hfdG9rZW4iLCJyZWZyZXNoIiwiYXV0aCIsInJldHJpZXZlVG9rZW4iLCJjbGllbnRfaWQiLCJvcHRpb25hbENhbGxiYWNrIiwibmV4dCIsInByb2Nlc3MiLCJlbnYiLCJQTTJfSU9fVE9LRU4iLCJFcnJvciIsInZlcmlmeVRva2VuIiwidGhlbiIsInJlcyIsImRhdGEiLCJEYXRlIiwiZXhwaXJlX2F0IiwidG9JU09TdHJpbmciLCJhdXRoZW50aWNhdGUiLCJyZXN1bHQiLCJmaWxlIiwid3JpdGVGaWxlIiwic3RyaW5naWZ5IiwiY29uc29sZSIsImxvZyIsIlBNMl9JT19NU0ciLCJwcm9tcHRseSIsImNvbmZpcm0iLCJhbnN3ZXIiLCJsb2dpbiIsInJlZ2lzdGVyIiwicmV0cnkiLCJwcm9tcHQiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwicmVwbGFjZSIsIl9sb2dpblVzZXIiLCJlcnJvciIsIlBNMl9JT19NU0dfRVJSIiwibWVzc2FnZSIsInZhbGlkYXRvciIsIl92YWxpZGF0ZVVzZXJuYW1lIiwiX3ZhbGlkYXRlRW1haWwiLCJlbWFpbCIsImNoYWxrIiwiYm9sZCIsInJlZCIsIl9yZWdpc3RlclVzZXIiLCJleGl0IiwidW5kZWZpbmVkIiwiT2JqZWN0IiwiYXNzaWduIiwicGFzc3dvcmRfY29uZmlybWF0aW9uIiwiYWNjZXB0X3Rlcm1zIiwibmVlZGxlIiwicG9zdCIsImpzb24iLCJoZWFkZXJzIiwiYm9keSIsImFjY2Vzc190b2tlbiIsIm1zZyIsInRva2VuIiwidXNlcl9pbmZvIiwiVVJMX0FVVEgiLCJnZXQiLCJjb29raWUiLCJjb29raWVzIiwicmVzcCIsInN0YXR1c0NvZGUiLCJsb2NhdGlvbiIsInF1ZXJ5c3RyaW5nIiwidXJsIiwicXVlcnkiLCJncmFudF90eXBlIiwic2NvcGUiLCJyZSIsInRlc3QiLCJ2YWx1ZSIsImxlbmd0aCIsInJldm9rZSIsIkF1dGhTdHJhdGVneSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUFFQTs7QUFHQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUVxQkEsVzs7Ozs7QUFRbkIsdUJBQVlDLElBQVosRUFBbUI7QUFBQTs7QUFBQTs7QUFDakI7O0FBRGlCOztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUFBO0FBRWxCLEcsQ0FFRDs7Ozs7bUNBQ2dCQyxFLEVBQUlDLEUsRUFBSTtBQUN0QixXQUFLQyxhQUFMLEdBQXFCLEtBQXJCO0FBQ0EsV0FBS0MsUUFBTCxHQUFnQkYsRUFBaEI7QUFDQSxXQUFLRCxFQUFMLEdBQVVBLEVBQVY7QUFDQSxXQUFLSSxRQUFMLEdBQWdCLDBCQUFoQjtBQUNELEssQ0FFRDs7OztzQ0FDbUI7QUFBQTs7QUFDakIsYUFBTyxJQUFJQyxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFVQyxNQUFWLEVBQXFCO0FBQ3RDLFlBQUksTUFBSSxDQUFDTCxhQUFULEVBQXdCLE9BQU9JLE9BQU8sQ0FBQyxJQUFELENBQWQ7QUFFeEIsWUFBSUUsVUFBVSxHQUFHQyxzQkFBSUMsbUJBQXJCOztBQUNBQyx1QkFBR0MsUUFBSCxDQUFZSixVQUFaLEVBQXdCLE1BQXhCLEVBQWdDLFVBQUNLLEdBQUQsRUFBTUMsTUFBTixFQUFzQjtBQUNwRCxjQUFJRCxHQUFHLElBQUlBLEdBQUcsQ0FBQ0UsSUFBSixLQUFhLFFBQXhCLEVBQWtD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a0IsS0FBdEIsRUFDRSxNQUFNLElBQUlqQyxLQUFKLENBQVUsY0FBVixDQUFOO0FBQ0YsYUFBT2lDLEtBQVA7QUFDRDs7O3NDQUVrQmtDLEssRUFBTztBQUN4QixVQUFJQSxLQUFLLENBQUNDLE1BQU4sR0FBZSxDQUFuQixFQUFzQjtBQUNwQixjQUFNLElBQUlwRSxLQUFKLENBQVUsaUJBQVYsQ0FBTjtBQUNEOztBQUNELGFBQU9tRSxLQUFQO0FBQ0Q7OztpQ0FFYWhHLEUsRUFBSTtBQUNoQixhQUFPLElBQUlLLE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVVDLE1BQVYsRUFBcUI7QUFDdEM7QUFDQVAsUUFBQUEsRUFBRSxDQUFDcUIsSUFBSCxDQUFRNkUsTUFBUixHQUNHbkUsSUFESCxDQUNRLFVBQUFDLEdBQUcsRUFBSTtBQUNYO0FBQ0EsY0FBSU8sSUFBSSxHQUFHOUIsc0JBQUlDLG1CQUFmOztBQUNBQyx5QkFBR08sVUFBSCxDQUFjcUIsSUFBZDs7QUFDQSxpQkFBT2pDLE9BQU8sQ0FBQzBCLEdBQUQsQ0FBZDtBQUNELFNBTkgsV0FNV3pCLE1BTlg7QUFPRCxPQVRNLENBQVA7QUFVRDs7OztFQXhSc0M0RixvQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgQXV0aFN0cmF0ZWd5ICBmcm9tJ0BwbTIvanMtYXBpL3NyYy9hdXRoX3N0cmF0ZWdpZXMvc3RyYXRlZ3knXG5pbXBvcnQgcXVlcnlzdHJpbmcgIGZyb20ncXVlcnlzdHJpbmcnO1xuXG5pbXBvcnQgaHR0cCAgZnJvbSdodHRwJ1xuaW1wb3J0IGZzICBmcm9tJ2ZzJ1xuaW1wb3J0IHVybCAgZnJvbSd1cmwnXG5pbXBvcnQgZXhlYyAgZnJvbSdjaGlsZF9wcm9jZXNzJ1xuaW1wb3J0IHRyeUVhY2ggIGZyb20nYXN5bmMvdHJ5RWFjaCdcbmltcG9ydCBwYXRoICBmcm9tJ3BhdGgnXG5pbXBvcnQgb3MgIGZyb20nb3MnXG5pbXBvcnQgbmVlZGxlICBmcm9tJ25lZWRsZSdcbmltcG9ydCBjaGFsayAgZnJvbSdjaGFsaydcbmltcG9ydCBjc3QgIGZyb20nLi4vLi4vLi4vLi4vY29uc3RhbnRzLmpzJ1xuaW1wb3J0IHByb21wdGx5ICBmcm9tJ3Byb21wdGx5J1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDbGlTdHJhdGVneSBleHRlbmRzIEF1dGhTdHJhdGVneSB7XG4gIGF1dGhlbnRpY2F0ZWQ6IGJvb2xlYW47XG4gIGNhbGxiYWNrOiAoZXJyLCByZXN1bHQpID0+IHt9O1xuICBrbTogYW55O1xuICBCQVNFX1VSSTogc3RyaW5nO1xuXG4gIGNsaWVudF9pZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKG9wdHM/KSB7XG4gICAgc3VwZXIoKVxuICB9XG5cbiAgLy8gdGhlIGNsaWVudCB3aWxsIHRyeSB0byBjYWxsIHRoaXMgYnV0IHdlIGhhbmRsZSB0aGlzIHBhcnQgb3Vyc2VsdmVzXG4gIHJldHJpZXZlVG9rZW5zIChrbSwgY2IpIHtcbiAgICB0aGlzLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZVxuICAgIHRoaXMuY2FsbGJhY2sgPSBjYlxuICAgIHRoaXMua20gPSBrbVxuICAgIHRoaXMuQkFTRV9VUkkgPSAnaHR0cHM6Ly9pZC5rZXltZXRyaWNzLmlvJztcbiAgfVxuXG4gIC8vIHNvIHRoZSBjbGkga25vdyBpZiB3ZSBuZWVkIHRvIHRlbGwgdXNlciB0byBsb2dpbi9yZWdpc3RlclxuICBpc0F1dGhlbnRpY2F0ZWQgKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZiAodGhpcy5hdXRoZW50aWNhdGVkKSByZXR1cm4gcmVzb2x2ZSh0cnVlKVxuXG4gICAgICBsZXQgdG9rZW5zUGF0aCA9IGNzdC5QTTJfSU9fQUNDRVNTX1RPS0VOXG4gICAgICBmcy5yZWFkRmlsZSh0b2tlbnNQYXRoLCBcInV0ZjhcIiwgKGVyciwgdG9rZW5zOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKGVyciAmJiBlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHJldHVybiByZXNvbHZlKGZhbHNlKVxuICAgICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0KGVycilcblxuICAgICAgICAvLyB2ZXJpZnkgdGhhdCB0aGUgdG9rZW4gaXMgdmFsaWRcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0b2tlbnMgPSBKU09OLnBhcnNlKHRva2VucyB8fCAne30nKVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBmcy51bmxpbmtTeW5jKHRva2Vuc1BhdGgpXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoZmFsc2UpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGUgcmVmcmVzaCB0b2tlbnMgaXMgaGVyZSwgdGhlIHVzZXIgY291bGQgYmUgYXV0b21hdGljYWxseSBhdXRoZW50aWNhdGVkXG4gICAgICAgIHJldHVybiByZXNvbHZlKHR5cGVvZiB0b2tlbnMucmVmcmVzaF90b2tlbiA9PT0gJ3N0cmluZycpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICB2ZXJpZnlUb2tlbiAocmVmcmVzaCkge1xuICAgIHJldHVybiB0aGlzLmttLmF1dGgucmV0cmlldmVUb2tlbih7XG4gICAgICBjbGllbnRfaWQ6IHRoaXMuY2xpZW50X2lkLFxuICAgICAgcmVmcmVzaF90b2tlbjogcmVmcmVzaFxuICAgIH0pXG4gIH1cblxuICAvLyBjYWxsZWQgd2hlbiB3ZSBhcmUgc3VyZSB0aGUgdXNlciBhc2tlZCB0byBiZSBsb2dnZWQgaW5cbiAgX3JldHJpZXZlVG9rZW5zIChvcHRpb25hbENhbGxiYWNrKSB7XG4gICAgY29uc3Qga20gPSB0aGlzLmttXG4gICAgY29uc3QgY2IgPSB0aGlzLmNhbGxiYWNrXG5cbiAgICB0cnlFYWNoKFtcbiAgICAgIC8vIHRyeSB0byBmaW5kIHRoZSB0b2tlbiB2aWEgdGhlIGVudmlyb25tZW50XG4gICAgICAobmV4dCkgPT4ge1xuICAgICAgICBpZiAoIXByb2Nlc3MuZW52LlBNMl9JT19UT0tFTikge1xuICAgICAgICAgIHJldHVybiBuZXh0KG5ldyBFcnJvcignTm8gdG9rZW4gaW4gZW52JykpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy52ZXJpZnlUb2tlbihwcm9jZXNzLmVudi5QTTJfSU9fVE9LRU4pXG4gICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5leHQobnVsbCwgcmVzLmRhdGEpXG4gICAgICAgICAgfSkuY2F0Y2gobmV4dClcbiAgICAgIH0sXG4gICAgICAvLyB0cnkgdG8gZmluZCBpdCBpbiB0aGUgZmlsZSBzeXN0ZW1cbiAgICAgIChuZXh0KSA9PiB7XG4gICAgICAgIGZzLnJlYWRGaWxlKGNzdC5QTTJfSU9fQUNDRVNTX1RPS0VOLCBcInV0ZjhcIiwgKGVyciwgdG9rZW5zOiBhbnkpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gbmV4dChlcnIpXG4gICAgICAgICAgLy8gdmVyaWZ5IHRoYXQgdGhlIHRva2VuIGlzIHZhbGlkXG4gICAgICAgICAgdG9rZW5zID0gSlNPTi5wYXJzZSh0b2tlbnMgfHwgJ3t9JylcbiAgICAgICAgICBpZiAobmV3IERhdGUodG9rZW5zLmV4cGlyZV9hdCkgPiBuZXcgRGF0ZShuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV4dChudWxsLCB0b2tlbnMpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy52ZXJpZnlUb2tlbih0b2tlbnMucmVmcmVzaF90b2tlbilcbiAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5leHQobnVsbCwgcmVzLmRhdGEpXG4gICAgICAgICAgICB9KS5jYXRjaChuZXh0KVxuICAgICAgICB9KVxuICAgICAgfSxcbiAgICAgIC8vIG90aGVyd2lzZSBtYWtlIHRoZSB3aG9sZSBmbG93XG4gICAgICAobmV4dCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5hdXRoZW50aWNhdGUoKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIG5leHQoZXJyKVxuICAgICAgICAgIC8vIHZlcmlmeSB0aGF0IHRoZSB0b2tlbiBpcyB2YWxpZFxuICAgICAgICAgIHRoaXMudmVyaWZ5VG9rZW4oZGF0YS5yZWZyZXNoX3Rva2VuKVxuICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gbmV4dChudWxsLCByZXMuZGF0YSlcbiAgICAgICAgICAgIH0pLmNhdGNoKG5leHQpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgXSwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAvLyBpZiBwcmVzZW50IHJ1biB0aGUgb3B0aW9uYWwgY2FsbGJhY2tcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9uYWxDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvcHRpb25hbENhbGxiYWNrKGVyciwgcmVzdWx0KVxuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0LnJlZnJlc2hfdG9rZW4pIHtcbiAgICAgICAgdGhpcy5hdXRoZW50aWNhdGVkID0gdHJ1ZVxuICAgICAgICBsZXQgZmlsZSA9IGNzdC5QTTJfSU9fQUNDRVNTX1RPS0VOXG4gICAgICAgIGZzLndyaXRlRmlsZShmaWxlLCBKU09OLnN0cmluZ2lmeShyZXN1bHQpLCAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNiKGVyciwgcmVzdWx0KVxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNiKGVyciwgcmVzdWx0KVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBhdXRoZW50aWNhdGUgKGNiKSB7XG4gICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFVzaW5nIG5vbi1icm93c2VyIGF1dGhlbnRpY2F0aW9uLmApXG4gICAgcHJvbXB0bHkuY29uZmlybShgJHtjc3QuUE0yX0lPX01TR30gRG8geW91IGhhdmUgYSBwbTIuaW8gYWNjb3VudD8gKHkvbilgLCAoZXJyLCBhbnN3ZXIpID0+IHtcbiAgICAgIC8vIEVpdGhlciBsb2dpbiBvciByZWdpc3RlclxuICAgICAgcmV0dXJuIGFuc3dlciA9PT0gdHJ1ZSA/IHRoaXMubG9naW4oY2IpIDogdGhpcy5yZWdpc3RlcihjYilcbiAgICB9KVxuICB9XG5cbiAgbG9naW4gKGNiKSB7XG4gICAgbGV0IHJldHJ5ID0gKCkgPT4ge1xuICAgICAgcHJvbXB0bHkucHJvbXB0KGAke2NzdC5QTTJfSU9fTVNHfSBZb3VyIHVzZXJuYW1lIG9yIGVtYWlsOiBgLCAoZXJyLCB1c2VybmFtZSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gcmV0cnkoKTtcblxuICAgICAgICBwcm9tcHRseS5wYXNzd29yZChgJHtjc3QuUE0yX0lPX01TR30gWW91ciBwYXNzd29yZDogYCwgeyByZXBsYWNlIDogJyonIH0sIChlcnIsIHBhc3N3b3JkKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmV0dXJuIHJldHJ5KCk7XG5cbiAgICAgICAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gQXV0aGVudGljYXRpbmcgLi4uYClcbiAgICAgICAgICB0aGlzLl9sb2dpblVzZXIoe1xuICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkXG4gICAgICAgICAgfSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gRmFpbGVkIHRvIGF1dGhlbnRpY2F0ZTogJHtlcnIubWVzc2FnZX1gKVxuICAgICAgICAgICAgICByZXR1cm4gcmV0cnkoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNiKG51bGwsIGRhdGEpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0cnkoKVxuICB9XG5cbiAgcmVnaXN0ZXIgKGNiKSB7XG4gICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IE5vIHByb2JsZW0gISBXZSBqdXN0IG5lZWQgZmV3IGluZm9ybWF0aW9ucyB0byBjcmVhdGUgeW91ciBhY2NvdW50YClcblxuICAgIHZhciByZXRyeSA9ICgpID0+IHtcbiAgICAgIHByb21wdGx5LnByb21wdChgJHtjc3QuUE0yX0lPX01TR30gUGxlYXNlIGNob29zZSBhbiB1c2VybmFtZSA6YCwge1xuICAgICAgICB2YWxpZGF0b3IgOiB0aGlzLl92YWxpZGF0ZVVzZXJuYW1lLFxuICAgICAgICByZXRyeSA6IHRydWVcbiAgICAgIH0sIChlcnIsIHVzZXJuYW1lKSA9PiB7XG4gICAgICAgIHByb21wdGx5LnByb21wdChgJHtjc3QuUE0yX0lPX01TR30gUGxlYXNlIGNob29zZSBhbiBlbWFpbCA6YCwge1xuICAgICAgICAgIHZhbGlkYXRvciA6IHRoaXMuX3ZhbGlkYXRlRW1haWwsXG4gICAgICAgICAgcmV0cnkgOiB0cnVlXG4gICAgICAgIH0sKGVyciwgZW1haWwpID0+IHtcbiAgICAgICAgICBwcm9tcHRseS5wYXNzd29yZChgJHtjc3QuUE0yX0lPX01TR30gUGxlYXNlIGNob29zZSBhIHBhc3N3b3JkIDpgLCB7IHJlcGxhY2UgOiAnKicgfSwgKGVyciwgcGFzc3dvcmQpID0+IHtcbiAgICAgICAgICAgIHByb21wdGx5LmNvbmZpcm0oYCR7Y3N0LlBNMl9JT19NU0d9IERvIHlvdSBhY2NlcHQgdGhlIHRlcm1zIGFuZCBwcml2YWN5IHBvbGljeSAoaHR0cHM6Ly9wbTIuaW8vbGVnYWxzL3Rlcm1zX2NvbmRpdGlvbnMucGRmKSA/ICAoeS9uKWAsIChlcnIsIGFuc3dlcikgPT4ge1xuICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihjaGFsay5ib2xkLnJlZChlcnIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0cnkoKVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFuc3dlciA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gWW91IG11c3QgYWNjZXB0IHRoZSB0ZXJtcyBhbmQgcHJpdmFjeSBwb2xpY3kgdG8gY29udGl1ZS5gKVxuICAgICAgICAgICAgICAgIHJldHVybiByZXRyeSgpXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0aGlzLl9yZWdpc3RlclVzZXIoe1xuICAgICAgICAgICAgICAgIGVtYWlsIDogZW1haWwsXG4gICAgICAgICAgICAgICAgcGFzc3dvcmQgOiBwYXNzd29yZCxcbiAgICAgICAgICAgICAgICB1c2VybmFtZSA6IHVzZXJuYW1lXG4gICAgICAgICAgICAgIH0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnXFxuJylcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gVW5leHBlY3QgZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YClcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBZb3UgY2FuIGFsc28gY29udGFjdCB1cyB0byBnZXQgaGVscDogY29udGFjdEBwbTIuaW9gKVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgxKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY2IodW5kZWZpbmVkLCBkYXRhKVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG4gICAgcmV0cnkoKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSBvcHRzLnVzZXJuYW1lXG4gICAqIEBwYXJhbSBvcHRzLnBhc3N3b3JkXG4gICAqIEBwYXJhbSBvcHRzLmVtYWlsXG4gICAqL1xuICBfcmVnaXN0ZXJVc2VyIChvcHRzLCBjYikge1xuICAgIGNvbnN0IGRhdGEgPSBPYmplY3QuYXNzaWduKG9wdHMsIHtcbiAgICAgIHBhc3N3b3JkX2NvbmZpcm1hdGlvbjogb3B0cy5wYXNzd29yZCxcbiAgICAgIGFjY2VwdF90ZXJtczogdHJ1ZVxuICAgIH0pXG4gICAgbmVlZGxlLnBvc3QodGhpcy5CQVNFX1VSSSArICcvYXBpL29hdXRoL3JlZ2lzdGVyJywgZGF0YSwge1xuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtUmVnaXN0ZXItUHJvdmlkZXInOiAncG0yLXJlZ2lzdGVyJyxcbiAgICAgICAgJ3gtY2xpZW50LWlkJzogdGhpcy5jbGllbnRfaWRcbiAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoZXJyLCByZXMsIGJvZHkpIHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpXG4gICAgICBpZiAoYm9keS5lbWFpbCAmJiBib2R5LmVtYWlsLm1lc3NhZ2UpIHJldHVybiBjYihuZXcgRXJyb3IoYm9keS5lbWFpbC5tZXNzYWdlKSlcbiAgICAgIGlmIChib2R5LnVzZXJuYW1lICYmIGJvZHkudXNlcm5hbWUubWVzc2FnZSkgcmV0dXJuIGNiKG5ldyBFcnJvcihib2R5LnVzZXJuYW1lLm1lc3NhZ2UpKVxuICAgICAgaWYgKCFib2R5LmFjY2Vzc190b2tlbikgcmV0dXJuIGNiKG5ldyBFcnJvcihib2R5Lm1zZykpXG5cbiAgICAgIHJldHVybiBjYihudWxsLCB7XG4gICAgICAgIHJlZnJlc2hfdG9rZW4gOiBib2R5LnJlZnJlc2hfdG9rZW4udG9rZW4sXG4gICAgICAgIGFjY2Vzc190b2tlbiA6IGJvZHkuYWNjZXNzX3Rva2VuLnRva2VuXG4gICAgICB9KVxuICAgIH0pO1xuICB9XG5cbiAgX2xvZ2luVXNlciAodXNlcl9pbmZvLCBjYikge1xuICAgIGNvbnN0IFVSTF9BVVRIID0gJy9hcGkvb2F1dGgvYXV0aG9yaXplP3Jlc3BvbnNlX3R5cGU9dG9rZW4mc2NvcGU9YWxsJmNsaWVudF9pZD0nICtcbiAgICAgICAgICAgIHRoaXMuY2xpZW50X2lkICsgJyZyZWRpcmVjdF91cmk9aHR0cDovL2xvY2FsaG9zdDo0MzUzMic7XG5cbiAgICBuZWVkbGUuZ2V0KHRoaXMuQkFTRV9VUkkgKyBVUkxfQVVUSCwgKGVyciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcblxuICAgICAgdmFyIGNvb2tpZSA9IHJlcy5jb29raWVzO1xuXG4gICAgICBuZWVkbGUucG9zdCh0aGlzLkJBU0VfVVJJICsgJy9hcGkvb2F1dGgvbG9naW4nLCB1c2VyX2luZm8sIHtcbiAgICAgICAgY29va2llcyA6IGNvb2tpZVxuICAgICAgfSwgKGVyciwgcmVzcCwgYm9keSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgICAgICBpZiAocmVzcC5zdGF0dXNDb2RlICE9IDIwMCkgcmV0dXJuIGNiKCdXcm9uZyBjcmVkZW50aWFscycpXG5cbiAgICAgICAgdmFyIGxvY2F0aW9uID0gcmVzcC5oZWFkZXJzWyd4LXJlZGlyZWN0J11cblxuICAgICAgICBuZWVkbGUuZ2V0KHRoaXMuQkFTRV9VUkkgKyBsb2NhdGlvbiwge1xuICAgICAgICAgIGNvb2tpZXMgOiBjb29raWVcbiAgICAgICAgfSwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG4gICAgICAgICAgdmFyIHJlZnJlc2hfdG9rZW4gPSBxdWVyeXN0cmluZy5wYXJzZSh1cmwucGFyc2UocmVzLmhlYWRlcnMubG9jYXRpb24pLnF1ZXJ5KS5hY2Nlc3NfdG9rZW47XG4gICAgICAgICAgbmVlZGxlLnBvc3QodGhpcy5CQVNFX1VSSSArICcvYXBpL29hdXRoL3Rva2VuJywge1xuICAgICAgICAgICAgY2xpZW50X2lkIDogdGhpcy5jbGllbnRfaWQsXG4gICAgICAgICAgICBncmFudF90eXBlIDogJ3JlZnJlc2hfdG9rZW4nLFxuICAgICAgICAgICAgcmVmcmVzaF90b2tlbiA6IHJlZnJlc2hfdG9rZW4sXG4gICAgICAgICAgICBzY29wZSA6ICdhbGwnXG4gICAgICAgICAgfSwgKGVyciwgcmVzLCBib2R5KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxuICAgICAgICAgICAgcmV0dXJuIGNiKG51bGwsIGJvZHkpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIF92YWxpZGF0ZUVtYWlsIChlbWFpbCkge1xuICAgIHZhciByZSA9IC9eKChbXjw+KClcXFtcXF1cXFxcLiw7Olxcc0BcIl0rKFxcLltePD4oKVxcW1xcXVxcXFwuLDs6XFxzQFwiXSspKil8KFwiLitcIikpQCgoXFxbWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfV0pfCgoW2EtekEtWlxcLTAtOV0rXFwuKStbYS16QS1aXXsyLH0pKSQvO1xuICAgIGlmIChyZS50ZXN0KGVtYWlsKSA9PSBmYWxzZSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGFuIGVtYWlsJyk7XG4gICAgcmV0dXJuIGVtYWlsO1xuICB9XG5cbiAgX3ZhbGlkYXRlVXNlcm5hbWUgKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlLmxlbmd0aCA8IDYpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWluIGxlbmd0aCBvZiA2Jyk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICBkZWxldGVUb2tlbnMgKGttKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIC8vIHJldm9rZSB0aGUgcmVmcmVzaFRva2VuXG4gICAgICBrbS5hdXRoLnJldm9rZSgpXG4gICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgLy8gcmVtb3ZlIHRoZSB0b2tlbiBmcm9tIHRoZSBmaWxlc3lzdGVtXG4gICAgICAgICAgbGV0IGZpbGUgPSBjc3QuUE0yX0lPX0FDQ0VTU19UT0tFTlxuICAgICAgICAgIGZzLnVubGlua1N5bmMoZmlsZSlcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXMpXG4gICAgICAgIH0pLmNhdGNoKHJlamVjdClcbiAgICB9KVxuICB9XG59XG4iXX0=