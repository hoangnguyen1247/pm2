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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9BUEkvcG0yLXBsdXMvYXV0aC1zdHJhdGVnaWVzL0NsaUF1dGgudHMiXSwibmFtZXMiOlsiQ2xpU3RyYXRlZ3kiLCJvcHRzIiwia20iLCJjYiIsImF1dGhlbnRpY2F0ZWQiLCJjYWxsYmFjayIsIkJBU0VfVVJJIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJ0b2tlbnNQYXRoIiwiY3N0IiwiUE0yX0lPX0FDQ0VTU19UT0tFTiIsImZzIiwicmVhZEZpbGUiLCJlcnIiLCJ0b2tlbnMiLCJjb2RlIiwiSlNPTiIsInBhcnNlIiwidW5saW5rU3luYyIsInJlZnJlc2hfdG9rZW4iLCJyZWZyZXNoIiwiYXV0aCIsInJldHJpZXZlVG9rZW4iLCJjbGllbnRfaWQiLCJvcHRpb25hbENhbGxiYWNrIiwibmV4dCIsInByb2Nlc3MiLCJlbnYiLCJQTTJfSU9fVE9LRU4iLCJFcnJvciIsInZlcmlmeVRva2VuIiwidGhlbiIsInJlcyIsImRhdGEiLCJEYXRlIiwiZXhwaXJlX2F0IiwidG9JU09TdHJpbmciLCJhdXRoZW50aWNhdGUiLCJyZXN1bHQiLCJmaWxlIiwid3JpdGVGaWxlIiwic3RyaW5naWZ5IiwiY29uc29sZSIsImxvZyIsIlBNMl9JT19NU0ciLCJwcm9tcHRseSIsImNvbmZpcm0iLCJhbnN3ZXIiLCJsb2dpbiIsInJlZ2lzdGVyIiwicmV0cnkiLCJwcm9tcHQiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwicmVwbGFjZSIsIl9sb2dpblVzZXIiLCJlcnJvciIsIlBNMl9JT19NU0dfRVJSIiwibWVzc2FnZSIsInZhbGlkYXRvciIsIl92YWxpZGF0ZVVzZXJuYW1lIiwiX3ZhbGlkYXRlRW1haWwiLCJlbWFpbCIsImNoYWxrIiwiYm9sZCIsInJlZCIsIl9yZWdpc3RlclVzZXIiLCJleGl0IiwidW5kZWZpbmVkIiwiT2JqZWN0IiwiYXNzaWduIiwicGFzc3dvcmRfY29uZmlybWF0aW9uIiwiYWNjZXB0X3Rlcm1zIiwibmVlZGxlIiwicG9zdCIsImpzb24iLCJoZWFkZXJzIiwiYm9keSIsImFjY2Vzc190b2tlbiIsIm1zZyIsInRva2VuIiwidXNlcl9pbmZvIiwiVVJMX0FVVEgiLCJnZXQiLCJjb29raWUiLCJjb29raWVzIiwicmVzcCIsInN0YXR1c0NvZGUiLCJsb2NhdGlvbiIsInF1ZXJ5c3RyaW5nIiwidXJsIiwicXVlcnkiLCJncmFudF90eXBlIiwic2NvcGUiLCJyZSIsInRlc3QiLCJ2YWx1ZSIsImxlbmd0aCIsInJldm9rZSIsIkF1dGhTdHJhdGVneSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUFFQTs7QUFHQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUVxQkEsVzs7Ozs7QUFRbkIsdUJBQVlDLElBQVosRUFBbUI7QUFBQTs7QUFBQTs7QUFDakI7O0FBRGlCOztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUFBO0FBRWxCLEcsQ0FFRDs7Ozs7bUNBQ2dCQyxFLEVBQUlDLEUsRUFBSTtBQUN0QixXQUFLQyxhQUFMLEdBQXFCLEtBQXJCO0FBQ0EsV0FBS0MsUUFBTCxHQUFnQkYsRUFBaEI7QUFDQSxXQUFLRCxFQUFMLEdBQVVBLEVBQVY7QUFDQSxXQUFLSSxRQUFMLEdBQWdCLDBCQUFoQjtBQUNELEssQ0FFRDs7OztzQ0FDbUI7QUFBQTs7QUFDakIsYUFBTyxJQUFJQyxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFVQyxNQUFWLEVBQXFCO0FBQ3RDLFlBQUksTUFBSSxDQUFDTCxhQUFULEVBQXdCLE9BQU9JLE9BQU8sQ0FBQyxJQUFELENBQWQ7QUFFeEIsWUFBSUUsVUFBVSxHQUFHQyxzQkFBSUMsbUJBQXJCOztBQUNBQyx1QkFBR0MsUUFBSCxDQUFZSixVQUFaLEVBQXdCLE1BQXhCLEVBQWdDLFVBQUNLLEdBQUQsRUFBTUMsTUFBTixFQUFzQjtBQUNwRCxjQUFJRCxHQUFHLElBQUlBLEdBQUcsQ0FBQ0UsSUFBSixLQUFhLFFBQXhCLEVBQWtD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a0IsS0FBdEIsRUFDRSxNQUFNLElBQUlqQyxLQUFKLENBQVUsY0FBVixDQUFOO0FBQ0YsYUFBT2lDLEtBQVA7QUFDRDs7O3NDQUVrQmtDLEssRUFBTztBQUN4QixVQUFJQSxLQUFLLENBQUNDLE1BQU4sR0FBZSxDQUFuQixFQUFzQjtBQUNwQixjQUFNLElBQUlwRSxLQUFKLENBQVUsaUJBQVYsQ0FBTjtBQUNEOztBQUNELGFBQU9tRSxLQUFQO0FBQ0Q7OztpQ0FFYWhHLEUsRUFBSTtBQUNoQixhQUFPLElBQUlLLE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVVDLE1BQVYsRUFBcUI7QUFDdEM7QUFDQVAsUUFBQUEsRUFBRSxDQUFDcUIsSUFBSCxDQUFRNkUsTUFBUixHQUNHbkUsSUFESCxDQUNRLFVBQUFDLEdBQUcsRUFBSTtBQUNYO0FBQ0EsY0FBSU8sSUFBSSxHQUFHOUIsc0JBQUlDLG1CQUFmOztBQUNBQyx5QkFBR08sVUFBSCxDQUFjcUIsSUFBZDs7QUFDQSxpQkFBT2pDLE9BQU8sQ0FBQzBCLEdBQUQsQ0FBZDtBQUNELFNBTkgsV0FNV3pCLE1BTlg7QUFPRCxPQVRNLENBQVA7QUFVRDs7OztFQXhSc0M0RixvQiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xyXG5cclxuaW1wb3J0IEF1dGhTdHJhdGVneSAgZnJvbSdAcG0yL2pzLWFwaS9zcmMvYXV0aF9zdHJhdGVnaWVzL3N0cmF0ZWd5J1xyXG5pbXBvcnQgcXVlcnlzdHJpbmcgIGZyb20ncXVlcnlzdHJpbmcnO1xyXG5cclxuaW1wb3J0IGh0dHAgIGZyb20naHR0cCdcclxuaW1wb3J0IGZzICBmcm9tJ2ZzJ1xyXG5pbXBvcnQgdXJsICBmcm9tJ3VybCdcclxuaW1wb3J0IGV4ZWMgIGZyb20nY2hpbGRfcHJvY2VzcydcclxuaW1wb3J0IHRyeUVhY2ggIGZyb20nYXN5bmMvdHJ5RWFjaCdcclxuaW1wb3J0IHBhdGggIGZyb20ncGF0aCdcclxuaW1wb3J0IG9zICBmcm9tJ29zJ1xyXG5pbXBvcnQgbmVlZGxlICBmcm9tJ25lZWRsZSdcclxuaW1wb3J0IGNoYWxrICBmcm9tJ2NoYWxrJ1xyXG5pbXBvcnQgY3N0ICBmcm9tJy4uLy4uLy4uLy4uL2NvbnN0YW50cy5qcydcclxuaW1wb3J0IHByb21wdGx5ICBmcm9tJ3Byb21wdGx5J1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2xpU3RyYXRlZ3kgZXh0ZW5kcyBBdXRoU3RyYXRlZ3kge1xyXG4gIGF1dGhlbnRpY2F0ZWQ6IGJvb2xlYW47XHJcbiAgY2FsbGJhY2s6IChlcnIsIHJlc3VsdCkgPT4ge307XHJcbiAga206IGFueTtcclxuICBCQVNFX1VSSTogc3RyaW5nO1xyXG5cclxuICBjbGllbnRfaWQ6IHN0cmluZztcclxuXHJcbiAgY29uc3RydWN0b3Iob3B0cz8pIHtcclxuICAgIHN1cGVyKClcclxuICB9XHJcblxyXG4gIC8vIHRoZSBjbGllbnQgd2lsbCB0cnkgdG8gY2FsbCB0aGlzIGJ1dCB3ZSBoYW5kbGUgdGhpcyBwYXJ0IG91cnNlbHZlc1xyXG4gIHJldHJpZXZlVG9rZW5zIChrbSwgY2IpIHtcclxuICAgIHRoaXMuYXV0aGVudGljYXRlZCA9IGZhbHNlXHJcbiAgICB0aGlzLmNhbGxiYWNrID0gY2JcclxuICAgIHRoaXMua20gPSBrbVxyXG4gICAgdGhpcy5CQVNFX1VSSSA9ICdodHRwczovL2lkLmtleW1ldHJpY3MuaW8nO1xyXG4gIH1cclxuXHJcbiAgLy8gc28gdGhlIGNsaSBrbm93IGlmIHdlIG5lZWQgdG8gdGVsbCB1c2VyIHRvIGxvZ2luL3JlZ2lzdGVyXHJcbiAgaXNBdXRoZW50aWNhdGVkICgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmF1dGhlbnRpY2F0ZWQpIHJldHVybiByZXNvbHZlKHRydWUpXHJcblxyXG4gICAgICBsZXQgdG9rZW5zUGF0aCA9IGNzdC5QTTJfSU9fQUNDRVNTX1RPS0VOXHJcbiAgICAgIGZzLnJlYWRGaWxlKHRva2Vuc1BhdGgsIFwidXRmOFwiLCAoZXJyLCB0b2tlbnM6IGFueSkgPT4ge1xyXG4gICAgICAgIGlmIChlcnIgJiYgZXJyLmNvZGUgPT09ICdFTk9FTlQnKSByZXR1cm4gcmVzb2x2ZShmYWxzZSlcclxuICAgICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0KGVycilcclxuXHJcbiAgICAgICAgLy8gdmVyaWZ5IHRoYXQgdGhlIHRva2VuIGlzIHZhbGlkXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIHRva2VucyA9IEpTT04ucGFyc2UodG9rZW5zIHx8ICd7fScpXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICBmcy51bmxpbmtTeW5jKHRva2Vuc1BhdGgpXHJcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShmYWxzZSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlmIHRoZSByZWZyZXNoIHRva2VucyBpcyBoZXJlLCB0aGUgdXNlciBjb3VsZCBiZSBhdXRvbWF0aWNhbGx5IGF1dGhlbnRpY2F0ZWRcclxuICAgICAgICByZXR1cm4gcmVzb2x2ZSh0eXBlb2YgdG9rZW5zLnJlZnJlc2hfdG9rZW4gPT09ICdzdHJpbmcnKVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIHZlcmlmeVRva2VuIChyZWZyZXNoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5rbS5hdXRoLnJldHJpZXZlVG9rZW4oe1xyXG4gICAgICBjbGllbnRfaWQ6IHRoaXMuY2xpZW50X2lkLFxyXG4gICAgICByZWZyZXNoX3Rva2VuOiByZWZyZXNoXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgLy8gY2FsbGVkIHdoZW4gd2UgYXJlIHN1cmUgdGhlIHVzZXIgYXNrZWQgdG8gYmUgbG9nZ2VkIGluXHJcbiAgX3JldHJpZXZlVG9rZW5zIChvcHRpb25hbENhbGxiYWNrKSB7XHJcbiAgICBjb25zdCBrbSA9IHRoaXMua21cclxuICAgIGNvbnN0IGNiID0gdGhpcy5jYWxsYmFja1xyXG5cclxuICAgIHRyeUVhY2goW1xyXG4gICAgICAvLyB0cnkgdG8gZmluZCB0aGUgdG9rZW4gdmlhIHRoZSBlbnZpcm9ubWVudFxyXG4gICAgICAobmV4dCkgPT4ge1xyXG4gICAgICAgIGlmICghcHJvY2Vzcy5lbnYuUE0yX0lPX1RPS0VOKSB7XHJcbiAgICAgICAgICByZXR1cm4gbmV4dChuZXcgRXJyb3IoJ05vIHRva2VuIGluIGVudicpKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnZlcmlmeVRva2VuKHByb2Nlc3MuZW52LlBNMl9JT19UT0tFTilcclxuICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5leHQobnVsbCwgcmVzLmRhdGEpXHJcbiAgICAgICAgICB9KS5jYXRjaChuZXh0KVxyXG4gICAgICB9LFxyXG4gICAgICAvLyB0cnkgdG8gZmluZCBpdCBpbiB0aGUgZmlsZSBzeXN0ZW1cclxuICAgICAgKG5leHQpID0+IHtcclxuICAgICAgICBmcy5yZWFkRmlsZShjc3QuUE0yX0lPX0FDQ0VTU19UT0tFTiwgXCJ1dGY4XCIsIChlcnIsIHRva2VuczogYW55KSA9PiB7XHJcbiAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gbmV4dChlcnIpXHJcbiAgICAgICAgICAvLyB2ZXJpZnkgdGhhdCB0aGUgdG9rZW4gaXMgdmFsaWRcclxuICAgICAgICAgIHRva2VucyA9IEpTT04ucGFyc2UodG9rZW5zIHx8ICd7fScpXHJcbiAgICAgICAgICBpZiAobmV3IERhdGUodG9rZW5zLmV4cGlyZV9hdCkgPiBuZXcgRGF0ZShuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXh0KG51bGwsIHRva2VucylcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLnZlcmlmeVRva2VuKHRva2Vucy5yZWZyZXNoX3Rva2VuKVxyXG4gICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIG5leHQobnVsbCwgcmVzLmRhdGEpXHJcbiAgICAgICAgICAgIH0pLmNhdGNoKG5leHQpXHJcbiAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgLy8gb3RoZXJ3aXNlIG1ha2UgdGhlIHdob2xlIGZsb3dcclxuICAgICAgKG5leHQpID0+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hdXRoZW50aWNhdGUoKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gbmV4dChlcnIpXHJcbiAgICAgICAgICAvLyB2ZXJpZnkgdGhhdCB0aGUgdG9rZW4gaXMgdmFsaWRcclxuICAgICAgICAgIHRoaXMudmVyaWZ5VG9rZW4oZGF0YS5yZWZyZXNoX3Rva2VuKVxyXG4gICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIG5leHQobnVsbCwgcmVzLmRhdGEpXHJcbiAgICAgICAgICAgIH0pLmNhdGNoKG5leHQpXHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG4gICAgXSwgKGVyciwgcmVzdWx0KSA9PiB7XHJcbiAgICAgIC8vIGlmIHByZXNlbnQgcnVuIHRoZSBvcHRpb25hbCBjYWxsYmFja1xyXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbmFsQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBvcHRpb25hbENhbGxiYWNrKGVyciwgcmVzdWx0KVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAocmVzdWx0LnJlZnJlc2hfdG9rZW4pIHtcclxuICAgICAgICB0aGlzLmF1dGhlbnRpY2F0ZWQgPSB0cnVlXHJcbiAgICAgICAgbGV0IGZpbGUgPSBjc3QuUE0yX0lPX0FDQ0VTU19UT0tFTlxyXG4gICAgICAgIGZzLndyaXRlRmlsZShmaWxlLCBKU09OLnN0cmluZ2lmeShyZXN1bHQpLCAoKSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gY2IoZXJyLCByZXN1bHQpXHJcbiAgICAgICAgfSlcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gY2IoZXJyLCByZXN1bHQpXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBhdXRoZW50aWNhdGUgKGNiKSB7XHJcbiAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gVXNpbmcgbm9uLWJyb3dzZXIgYXV0aGVudGljYXRpb24uYClcclxuICAgIHByb21wdGx5LmNvbmZpcm0oYCR7Y3N0LlBNMl9JT19NU0d9IERvIHlvdSBoYXZlIGEgcG0yLmlvIGFjY291bnQ/ICh5L24pYCwgKGVyciwgYW5zd2VyKSA9PiB7XHJcbiAgICAgIC8vIEVpdGhlciBsb2dpbiBvciByZWdpc3RlclxyXG4gICAgICByZXR1cm4gYW5zd2VyID09PSB0cnVlID8gdGhpcy5sb2dpbihjYikgOiB0aGlzLnJlZ2lzdGVyKGNiKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIGxvZ2luIChjYikge1xyXG4gICAgbGV0IHJldHJ5ID0gKCkgPT4ge1xyXG4gICAgICBwcm9tcHRseS5wcm9tcHQoYCR7Y3N0LlBNMl9JT19NU0d9IFlvdXIgdXNlcm5hbWUgb3IgZW1haWw6IGAsIChlcnIsIHVzZXJuYW1lKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIHJldHJ5KCk7XHJcblxyXG4gICAgICAgIHByb21wdGx5LnBhc3N3b3JkKGAke2NzdC5QTTJfSU9fTVNHfSBZb3VyIHBhc3N3b3JkOiBgLCB7IHJlcGxhY2UgOiAnKicgfSwgKGVyciwgcGFzc3dvcmQpID0+IHtcclxuICAgICAgICAgIGlmIChlcnIpIHJldHVybiByZXRyeSgpO1xyXG5cclxuICAgICAgICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBBdXRoZW50aWNhdGluZyAuLi5gKVxyXG4gICAgICAgICAgdGhpcy5fbG9naW5Vc2VyKHtcclxuICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogcGFzc3dvcmRcclxuICAgICAgICAgIH0sIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBGYWlsZWQgdG8gYXV0aGVudGljYXRlOiAke2Vyci5tZXNzYWdlfWApXHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJldHJ5KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gY2IobnVsbCwgZGF0YSlcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICByZXRyeSgpXHJcbiAgfVxyXG5cclxuICByZWdpc3RlciAoY2IpIHtcclxuICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBObyBwcm9ibGVtICEgV2UganVzdCBuZWVkIGZldyBpbmZvcm1hdGlvbnMgdG8gY3JlYXRlIHlvdXIgYWNjb3VudGApXHJcblxyXG4gICAgdmFyIHJldHJ5ID0gKCkgPT4ge1xyXG4gICAgICBwcm9tcHRseS5wcm9tcHQoYCR7Y3N0LlBNMl9JT19NU0d9IFBsZWFzZSBjaG9vc2UgYW4gdXNlcm5hbWUgOmAsIHtcclxuICAgICAgICB2YWxpZGF0b3IgOiB0aGlzLl92YWxpZGF0ZVVzZXJuYW1lLFxyXG4gICAgICAgIHJldHJ5IDogdHJ1ZVxyXG4gICAgICB9LCAoZXJyLCB1c2VybmFtZSkgPT4ge1xyXG4gICAgICAgIHByb21wdGx5LnByb21wdChgJHtjc3QuUE0yX0lPX01TR30gUGxlYXNlIGNob29zZSBhbiBlbWFpbCA6YCwge1xyXG4gICAgICAgICAgdmFsaWRhdG9yIDogdGhpcy5fdmFsaWRhdGVFbWFpbCxcclxuICAgICAgICAgIHJldHJ5IDogdHJ1ZVxyXG4gICAgICAgIH0sKGVyciwgZW1haWwpID0+IHtcclxuICAgICAgICAgIHByb21wdGx5LnBhc3N3b3JkKGAke2NzdC5QTTJfSU9fTVNHfSBQbGVhc2UgY2hvb3NlIGEgcGFzc3dvcmQgOmAsIHsgcmVwbGFjZSA6ICcqJyB9LCAoZXJyLCBwYXNzd29yZCkgPT4ge1xyXG4gICAgICAgICAgICBwcm9tcHRseS5jb25maXJtKGAke2NzdC5QTTJfSU9fTVNHfSBEbyB5b3UgYWNjZXB0IHRoZSB0ZXJtcyBhbmQgcHJpdmFjeSBwb2xpY3kgKGh0dHBzOi8vcG0yLmlvL2xlZ2Fscy90ZXJtc19jb25kaXRpb25zLnBkZikgPyAgKHkvbilgLCAoZXJyLCBhbnN3ZXIpID0+IHtcclxuICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGNoYWxrLmJvbGQucmVkKGVycikpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldHJ5KClcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFuc3dlciA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBZb3UgbXVzdCBhY2NlcHQgdGhlIHRlcm1zIGFuZCBwcml2YWN5IHBvbGljeSB0byBjb250aXVlLmApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0cnkoKVxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJVc2VyKHtcclxuICAgICAgICAgICAgICAgIGVtYWlsIDogZW1haWwsXHJcbiAgICAgICAgICAgICAgICBwYXNzd29yZCA6IHBhc3N3b3JkLFxyXG4gICAgICAgICAgICAgICAgdXNlcm5hbWUgOiB1c2VybmFtZVxyXG4gICAgICAgICAgICAgIH0sIChlcnIsIGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcXG4nKVxyXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gVW5leHBlY3QgZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YClcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjc3QuUE0yX0lPX01TR19FUlJ9IFlvdSBjYW4gYWxzbyBjb250YWN0IHVzIHRvIGdldCBoZWxwOiBjb250YWN0QHBtMi5pb2ApXHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBjYih1bmRlZmluZWQsIGRhdGEpXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIHJldHJ5KClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZ2lzdGVyIGZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIG9wdHMudXNlcm5hbWVcclxuICAgKiBAcGFyYW0gb3B0cy5wYXNzd29yZFxyXG4gICAqIEBwYXJhbSBvcHRzLmVtYWlsXHJcbiAgICovXHJcbiAgX3JlZ2lzdGVyVXNlciAob3B0cywgY2IpIHtcclxuICAgIGNvbnN0IGRhdGEgPSBPYmplY3QuYXNzaWduKG9wdHMsIHtcclxuICAgICAgcGFzc3dvcmRfY29uZmlybWF0aW9uOiBvcHRzLnBhc3N3b3JkLFxyXG4gICAgICBhY2NlcHRfdGVybXM6IHRydWVcclxuICAgIH0pXHJcbiAgICBuZWVkbGUucG9zdCh0aGlzLkJBU0VfVVJJICsgJy9hcGkvb2F1dGgvcmVnaXN0ZXInLCBkYXRhLCB7XHJcbiAgICAgIGpzb246IHRydWUsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnWC1SZWdpc3Rlci1Qcm92aWRlcic6ICdwbTItcmVnaXN0ZXInLFxyXG4gICAgICAgICd4LWNsaWVudC1pZCc6IHRoaXMuY2xpZW50X2lkXHJcbiAgICAgIH1cclxuICAgIH0sIGZ1bmN0aW9uIChlcnIsIHJlcywgYm9keSkge1xyXG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxyXG4gICAgICBpZiAoYm9keS5lbWFpbCAmJiBib2R5LmVtYWlsLm1lc3NhZ2UpIHJldHVybiBjYihuZXcgRXJyb3IoYm9keS5lbWFpbC5tZXNzYWdlKSlcclxuICAgICAgaWYgKGJvZHkudXNlcm5hbWUgJiYgYm9keS51c2VybmFtZS5tZXNzYWdlKSByZXR1cm4gY2IobmV3IEVycm9yKGJvZHkudXNlcm5hbWUubWVzc2FnZSkpXHJcbiAgICAgIGlmICghYm9keS5hY2Nlc3NfdG9rZW4pIHJldHVybiBjYihuZXcgRXJyb3IoYm9keS5tc2cpKVxyXG5cclxuICAgICAgcmV0dXJuIGNiKG51bGwsIHtcclxuICAgICAgICByZWZyZXNoX3Rva2VuIDogYm9keS5yZWZyZXNoX3Rva2VuLnRva2VuLFxyXG4gICAgICAgIGFjY2Vzc190b2tlbiA6IGJvZHkuYWNjZXNzX3Rva2VuLnRva2VuXHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIF9sb2dpblVzZXIgKHVzZXJfaW5mbywgY2IpIHtcclxuICAgIGNvbnN0IFVSTF9BVVRIID0gJy9hcGkvb2F1dGgvYXV0aG9yaXplP3Jlc3BvbnNlX3R5cGU9dG9rZW4mc2NvcGU9YWxsJmNsaWVudF9pZD0nICtcclxuICAgICAgICAgICAgdGhpcy5jbGllbnRfaWQgKyAnJnJlZGlyZWN0X3VyaT1odHRwOi8vbG9jYWxob3N0OjQzNTMyJztcclxuXHJcbiAgICBuZWVkbGUuZ2V0KHRoaXMuQkFTRV9VUkkgKyBVUkxfQVVUSCwgKGVyciwgcmVzKSA9PiB7XHJcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xyXG5cclxuICAgICAgdmFyIGNvb2tpZSA9IHJlcy5jb29raWVzO1xyXG5cclxuICAgICAgbmVlZGxlLnBvc3QodGhpcy5CQVNFX1VSSSArICcvYXBpL29hdXRoL2xvZ2luJywgdXNlcl9pbmZvLCB7XHJcbiAgICAgICAgY29va2llcyA6IGNvb2tpZVxyXG4gICAgICB9LCAoZXJyLCByZXNwLCBib2R5KSA9PiB7XHJcbiAgICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycilcclxuICAgICAgICBpZiAocmVzcC5zdGF0dXNDb2RlICE9IDIwMCkgcmV0dXJuIGNiKCdXcm9uZyBjcmVkZW50aWFscycpXHJcblxyXG4gICAgICAgIHZhciBsb2NhdGlvbiA9IHJlc3AuaGVhZGVyc1sneC1yZWRpcmVjdCddXHJcblxyXG4gICAgICAgIG5lZWRsZS5nZXQodGhpcy5CQVNFX1VSSSArIGxvY2F0aW9uLCB7XHJcbiAgICAgICAgICBjb29raWVzIDogY29va2llXHJcbiAgICAgICAgfSwgKGVyciwgcmVzKSA9PiB7XHJcbiAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcclxuICAgICAgICAgIHZhciByZWZyZXNoX3Rva2VuID0gcXVlcnlzdHJpbmcucGFyc2UodXJsLnBhcnNlKHJlcy5oZWFkZXJzLmxvY2F0aW9uKS5xdWVyeSkuYWNjZXNzX3Rva2VuO1xyXG4gICAgICAgICAgbmVlZGxlLnBvc3QodGhpcy5CQVNFX1VSSSArICcvYXBpL29hdXRoL3Rva2VuJywge1xyXG4gICAgICAgICAgICBjbGllbnRfaWQgOiB0aGlzLmNsaWVudF9pZCxcclxuICAgICAgICAgICAgZ3JhbnRfdHlwZSA6ICdyZWZyZXNoX3Rva2VuJyxcclxuICAgICAgICAgICAgcmVmcmVzaF90b2tlbiA6IHJlZnJlc2hfdG9rZW4sXHJcbiAgICAgICAgICAgIHNjb3BlIDogJ2FsbCdcclxuICAgICAgICAgIH0sIChlcnIsIHJlcywgYm9keSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKVxyXG4gICAgICAgICAgICByZXR1cm4gY2IobnVsbCwgYm9keSlcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBfdmFsaWRhdGVFbWFpbCAoZW1haWwpIHtcclxuICAgIHZhciByZSA9IC9eKChbXjw+KClcXFtcXF1cXFxcLiw7Olxcc0BcIl0rKFxcLltePD4oKVxcW1xcXVxcXFwuLDs6XFxzQFwiXSspKil8KFwiLitcIikpQCgoXFxbWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfV0pfCgoW2EtekEtWlxcLTAtOV0rXFwuKStbYS16QS1aXXsyLH0pKSQvO1xyXG4gICAgaWYgKHJlLnRlc3QoZW1haWwpID09IGZhbHNlKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhbiBlbWFpbCcpO1xyXG4gICAgcmV0dXJuIGVtYWlsO1xyXG4gIH1cclxuXHJcbiAgX3ZhbGlkYXRlVXNlcm5hbWUgKHZhbHVlKSB7XHJcbiAgICBpZiAodmFsdWUubGVuZ3RoIDwgNikge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pbiBsZW5ndGggb2YgNicpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG4gIH07XHJcblxyXG4gIGRlbGV0ZVRva2VucyAoa20pIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIC8vIHJldm9rZSB0aGUgcmVmcmVzaFRva2VuXHJcbiAgICAgIGttLmF1dGgucmV2b2tlKClcclxuICAgICAgICAudGhlbihyZXMgPT4ge1xyXG4gICAgICAgICAgLy8gcmVtb3ZlIHRoZSB0b2tlbiBmcm9tIHRoZSBmaWxlc3lzdGVtXHJcbiAgICAgICAgICBsZXQgZmlsZSA9IGNzdC5QTTJfSU9fQUNDRVNTX1RPS0VOXHJcbiAgICAgICAgICBmcy51bmxpbmtTeW5jKGZpbGUpXHJcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShyZXMpXHJcbiAgICAgICAgfSkuY2F0Y2gocmVqZWN0KVxyXG4gICAgfSlcclxuICB9XHJcbn1cclxuIl19