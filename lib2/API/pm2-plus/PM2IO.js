'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _constants = _interopRequireDefault(require("../../../constants"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _cliTableau = _interopRequireDefault(require("cli-tableau"));

var _package = _interopRequireDefault(require("../../../package.json"));

var _jsApi = _interopRequireDefault(require("@pm2/js-api"));

var _promptly = _interopRequireDefault(require("promptly"));

var _CliAuth = _interopRequireDefault(require("./auth-strategies/CliAuth"));

var _WebAuth = _interopRequireDefault(require("./auth-strategies/WebAuth"));

var _child_process = require("child_process");

var OAUTH_CLIENT_ID_WEB = '138558311';
var OAUTH_CLIENT_ID_CLI = '0943857435';

var PM2ioHandler = /*#__PURE__*/function () {
  function PM2ioHandler() {
    (0, _classCallCheck2["default"])(this, PM2ioHandler);
  }

  (0, _createClass2["default"])(PM2ioHandler, null, [{
    key: "usePM2Client",
    value: function usePM2Client(instance) {
      this.pm2 = instance;
    }
  }, {
    key: "strategy",
    value: function strategy() {
      switch (process.platform) {
        case 'darwin':
          {
            return new _WebAuth["default"]({
              client_id: OAUTH_CLIENT_ID_WEB
            });
          }

        case 'win32':
          {
            return new _WebAuth["default"]({
              client_id: OAUTH_CLIENT_ID_WEB
            });
          }

        case 'linux':
          {
            var isDesktop = process.env.XDG_CURRENT_DESKTOP || process.env.XDG_SESSION_DESKTOP || process.env.DISPLAY;
            var isSSH = process.env.SSH_TTY || process.env.SSH_CONNECTION;

            if (isDesktop && !isSSH) {
              return new _WebAuth["default"]({
                client_id: OAUTH_CLIENT_ID_WEB
              });
            } else {
              return new _CliAuth["default"]({
                client_id: OAUTH_CLIENT_ID_CLI
              });
            }
          }

        default:
          {
            return new _CliAuth["default"]({
              client_id: OAUTH_CLIENT_ID_CLI
            });
          }
      }
    }
  }, {
    key: "init",
    value: function init() {
      this._strategy = this.strategy();
      /**
       * If you are using a local backend you should give those options :
       * {
       *   services: {
       *    API: 'http://localhost:3000',
       *    OAUTH: 'http://localhost:3100'
       *   }
       *  }
       */

      this.io = new _jsApi["default"]().use(this._strategy);
    }
  }, {
    key: "launch",
    value: function launch(command, opts) {
      var _this = this;

      // first init the strategy and the io client
      this.init();

      switch (command) {
        case 'connect':
        case 'login':
        case 'register':
        case undefined:
        case 'authenticate':
          {
            this.authenticate();
            break;
          }

        case 'validate':
          {
            this.validateAccount(opts);
            break;
          }

        case 'help':
        case 'welcome':
          {
            var dt = _fs["default"].readFileSync(_path["default"].join(__dirname, './pres/welcome'));

            console.log(dt.toString());
            return process.exit(0);
          }

        case 'logout':
          {
            this._strategy.isAuthenticated().then(function (isConnected) {
              // try to kill the agent anyway
              _this.pm2.killAgent(function (err) {});

              if (isConnected === false) {
                console.log("".concat(_constants["default"].PM2_IO_MSG, " Already disconnected"));
                return process.exit(0);
              }

              _this._strategy._retrieveTokens(function (err, tokens) {
                if (err) {
                  console.log("".concat(_constants["default"].PM2_IO_MSG, " Successfully disconnected"));
                  return process.exit(0);
                }

                _this._strategy.deleteTokens(_this.io).then(function (_) {
                  console.log("".concat(_constants["default"].PM2_IO_MSG, " Successfully disconnected"));
                  return process.exit(0);
                })["catch"](function (err) {
                  console.log("".concat(_constants["default"].PM2_IO_MSG_ERR, " Unexpected error: ").concat(err.message));
                  return process.exit(1);
                });
              });
            })["catch"](function (err) {
              console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " Failed to logout: ").concat(err.message));
              console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " You can also contact us to get help: contact@pm2.io"));
            });

            break;
          }

        case 'create':
          {
            this._strategy.isAuthenticated().then(function (res) {
              // if the user isn't authenticated, we make them do the whole flow
              if (res !== true) {
                _this.authenticate();
              } else {
                _this.createBucket(_this.createBucketHandler.bind(_this));
              }
            })["catch"](function (err) {
              console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " Failed to create to the bucket: ").concat(err.message));
              console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " You can also contact us to get help: contact@pm2.io"));
            });

            break;
          }

        case 'web':
          {
            this._strategy.isAuthenticated().then(function (res) {
              // if the user isn't authenticated, we make them do the whole flow
              if (res === false) {
                console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " You need to be authenticated to do that, please use: pm2 plus login"));
                return process.exit(1);
              }

              _this._strategy._retrieveTokens(function () {
                return _this.openUI();
              });
            })["catch"](function (err) {
              console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " Failed to open the UI: ").concat(err.message));
              console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " You can also contact us to get help: contact@pm2.io"));
            });

            break;
          }

        default:
          {
            console.log("".concat(_constants["default"].PM2_IO_MSG_ERR, " Invalid command ").concat(command, ", available : login,register,validate,connect or web"));
            process.exit(1);
          }
      }
    }
  }, {
    key: "openUI",
    value: function openUI() {
      var _this2 = this;

      this.io.bucket.retrieveAll().then(function (res) {
        var buckets = res.data;

        if (buckets.length === 0) {
          return _this2.createBucket(function (err, bucket) {
            if (err) {
              console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " Failed to connect to the bucket: ").concat(err.message));

              if (bucket) {
                console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " You can retry using: pm2 plus link ").concat(bucket.secret_id, " ").concat(bucket.public_id));
              }

              console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " You can also contact us to get help: contact@pm2.io"));
              return process.exit(0);
            }

            var targetURL = "https://app.pm2.io/#/bucket/".concat(bucket._id);
            console.log("".concat(_constants["default"].PM2_IO_MSG, " Please follow the popup or go to this URL :"), '\n', '    ', targetURL);

            _this2.open(targetURL);

            return process.exit(0);
          });
        }

        var table = new _cliTableau["default"]({
          style: {
            'padding-left': 1,
            head: ['cyan', 'bold'],
            compact: true
          },
          head: ['Bucket name', 'Plan type']
        });
        buckets.forEach(function (bucket) {
          table.push([bucket.name, bucket.credits.offer_type]);
        });
        console.log(table.toString());
        console.log("".concat(_constants["default"].PM2_IO_MSG, " If you don't want to open the UI to a bucket, type 'none'"));
        var choices = buckets.map(function (bucket) {
          return bucket.name;
        });
        choices.push('none');

        _promptly["default"].choose("".concat(_constants["default"].PM2_IO_MSG, " Type the name of the bucket you want to connect to :"), choices, function (err, value) {
          if (value === 'none') process.exit(0);
          var bucket = buckets.find(function (bucket) {
            return bucket.name === value;
          });
          if (bucket === undefined) return process.exit(0);
          var targetURL = "https://app.pm2.io/#/bucket/".concat(bucket._id);
          console.log("".concat(_constants["default"].PM2_IO_MSG, " Please follow the popup or go to this URL :"), '\n', '    ', targetURL);

          _this2.open(targetURL);

          return process.exit(0);
        });
      });
    }
  }, {
    key: "validateAccount",
    value: function validateAccount(token) {
      this.io.auth.validEmail(token).then(function (res) {
        console.log("".concat(_constants["default"].PM2_IO_MSG, " Email succesfully validated."));
        console.log("".concat(_constants["default"].PM2_IO_MSG, " You can now proceed and use: pm2 plus connect"));
        return process.exit(0);
      })["catch"](function (err) {
        if (err.status === 401) {
          console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " Invalid token"));
          return process.exit(1);
        } else if (err.status === 301) {
          console.log("".concat(_constants["default"].PM2_IO_MSG, " Email succesfully validated."));
          console.log("".concat(_constants["default"].PM2_IO_MSG, " You can now proceed and use: pm2 plus connect"));
          return process.exit(0);
        }

        var msg = err.data ? err.data.error_description || err.data.msg : err.message;
        console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " Failed to validate your email: ").concat(msg));
        console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " You can also contact us to get help: contact@pm2.io"));
        return process.exit(1);
      });
    }
  }, {
    key: "createBucketHandler",
    value: function createBucketHandler(err, bucket) {
      if (err) {
        console.trace("".concat(_constants["default"].PM2_IO_MSG_ERR, " Failed to connect to the bucket: ").concat(err.message));

        if (bucket) {
          console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " You can retry using: pm2 plus link ").concat(bucket.secret_id, " ").concat(bucket.public_id));
        }

        console.error("".concat(_constants["default"].PM2_IO_MSG_ERR, " You can also contact us to get help: contact@pm2.io"));
        return process.exit(0);
      }

      if (bucket === undefined) {
        return process.exit(0);
      }

      console.log("".concat(_constants["default"].PM2_IO_MSG, " Successfully connected to bucket ").concat(bucket.name));
      var targetURL = "https://app.pm2.io/#/bucket/".concat(bucket._id);
      console.log("".concat(_constants["default"].PM2_IO_MSG, " You can use the web interface over there: ").concat(targetURL));
      this.open(targetURL);
      return process.exit(0);
    }
  }, {
    key: "createBucket",
    value: function createBucket(cb) {
      var _this3 = this;

      console.log("".concat(_constants["default"].PM2_IO_MSG, " By default we allow you to trial PM2 Plus for 14 days without any credit card."));
      this.io.bucket.create({
        name: 'PM2 Plus Monitoring'
      }).then(function (res) {
        var bucket = res.data.bucket;
        console.log("".concat(_constants["default"].PM2_IO_MSG, " Successfully created the bucket"));

        _this3.pm2.link({
          public_key: bucket.public_id,
          secret_key: bucket.secret_id,
          pm2_version: _package["default"].version
        }, function (err) {
          if (err) {
            return cb(new Error('Failed to connect your local PM2 to your bucket'), bucket);
          } else {
            return cb(null, bucket);
          }
        });
      })["catch"](function (err) {
        return cb(new Error("Failed to create a bucket: ".concat(err.message)));
      });
    }
    /**
     * Connect the local agent to a specific bucket
     * @param {Function} cb
     */

  }, {
    key: "connectToBucket",
    value: function connectToBucket(cb) {
      var _this4 = this;

      this.io.bucket.retrieveAll().then(function (res) {
        var buckets = res.data;

        if (buckets.length === 0) {
          return _this4.createBucket(cb);
        }

        var table = new _cliTableau["default"]({
          style: {
            'padding-left': 1,
            head: ['cyan', 'bold'],
            compact: true
          },
          head: ['Bucket name', 'Plan type']
        });
        buckets.forEach(function (bucket) {
          table.push([bucket.name, bucket.payment.offer_type]);
        });
        console.log(table.toString());
        console.log("".concat(_constants["default"].PM2_IO_MSG, " If you don't want to connect to a bucket, type 'none'"));
        var choices = buckets.map(function (bucket) {
          return bucket.name;
        });
        choices.push('none');

        _promptly["default"].choose("".concat(_constants["default"].PM2_IO_MSG, " Type the name of the bucket you want to connect to :"), choices, function (err, value) {
          if (value === 'none') return cb();
          var bucket = buckets.find(function (bucket) {
            return bucket.name === value;
          });
          if (bucket === undefined) return cb();

          _this4.pm2.link({
            public_key: bucket.public_id,
            secret_key: bucket.secret_id,
            pm2_version: _package["default"].version
          }, function (err) {
            return err ? cb(err) : cb(null, bucket);
          });
        });
      });
    }
    /**
     * Authenticate the user with either of the strategy
     * @param {Function} cb
     */

  }, {
    key: "authenticate",
    value: function authenticate() {
      var _this5 = this;

      this._strategy._retrieveTokens(function (err, tokens) {
        if (err) {
          var msg = err.data ? err.data.error_description || err.data.msg : err.message;
          console.log("".concat(_constants["default"].PM2_IO_MSG_ERR, " Unexpected error : ").concat(msg));
          return process.exit(1);
        }

        console.log("".concat(_constants["default"].PM2_IO_MSG, " Successfully authenticated"));

        _this5.io.user.retrieve().then(function (res) {
          var user = res.data;

          _this5.io.user.retrieve().then(function (res) {
            var tmpUser = res.data;
            console.log("".concat(_constants["default"].PM2_IO_MSG, " Successfully validated"));

            _this5.connectToBucket(_this5.createBucketHandler.bind(_this5));
          });
        });
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
  return PM2ioHandler;
}();

exports["default"] = PM2ioHandler;
(0, _defineProperty2["default"])(PM2ioHandler, "pm2", void 0);
(0, _defineProperty2["default"])(PM2ioHandler, "_strategy", void 0);
(0, _defineProperty2["default"])(PM2ioHandler, "io", void 0);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvcG0yLXBsdXMvUE0ySU8udHMiXSwibmFtZXMiOlsiT0FVVEhfQ0xJRU5UX0lEX1dFQiIsIk9BVVRIX0NMSUVOVF9JRF9DTEkiLCJQTTJpb0hhbmRsZXIiLCJpbnN0YW5jZSIsInBtMiIsInByb2Nlc3MiLCJwbGF0Zm9ybSIsIldlYlN0cmF0ZWd5IiwiY2xpZW50X2lkIiwiaXNEZXNrdG9wIiwiZW52IiwiWERHX0NVUlJFTlRfREVTS1RPUCIsIlhER19TRVNTSU9OX0RFU0tUT1AiLCJESVNQTEFZIiwiaXNTU0giLCJTU0hfVFRZIiwiU1NIX0NPTk5FQ1RJT04iLCJDTElTdHJhdGVneSIsIl9zdHJhdGVneSIsInN0cmF0ZWd5IiwiaW8iLCJJT0FQSSIsInVzZSIsImNvbW1hbmQiLCJvcHRzIiwiaW5pdCIsInVuZGVmaW5lZCIsImF1dGhlbnRpY2F0ZSIsInZhbGlkYXRlQWNjb3VudCIsImR0IiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJwYXRoIiwiam9pbiIsIl9fZGlybmFtZSIsImNvbnNvbGUiLCJsb2ciLCJ0b1N0cmluZyIsImV4aXQiLCJpc0F1dGhlbnRpY2F0ZWQiLCJ0aGVuIiwiaXNDb25uZWN0ZWQiLCJraWxsQWdlbnQiLCJlcnIiLCJjc3QiLCJQTTJfSU9fTVNHIiwiX3JldHJpZXZlVG9rZW5zIiwidG9rZW5zIiwiZGVsZXRlVG9rZW5zIiwiXyIsIlBNMl9JT19NU0dfRVJSIiwibWVzc2FnZSIsImVycm9yIiwicmVzIiwiY3JlYXRlQnVja2V0IiwiY3JlYXRlQnVja2V0SGFuZGxlciIsImJpbmQiLCJvcGVuVUkiLCJidWNrZXQiLCJyZXRyaWV2ZUFsbCIsImJ1Y2tldHMiLCJkYXRhIiwibGVuZ3RoIiwic2VjcmV0X2lkIiwicHVibGljX2lkIiwidGFyZ2V0VVJMIiwiX2lkIiwib3BlbiIsInRhYmxlIiwiVGFibGUiLCJzdHlsZSIsImhlYWQiLCJjb21wYWN0IiwiZm9yRWFjaCIsInB1c2giLCJuYW1lIiwiY3JlZGl0cyIsIm9mZmVyX3R5cGUiLCJjaG9pY2VzIiwibWFwIiwicHJvbXB0bHkiLCJjaG9vc2UiLCJ2YWx1ZSIsImZpbmQiLCJ0b2tlbiIsImF1dGgiLCJ2YWxpZEVtYWlsIiwic3RhdHVzIiwibXNnIiwiZXJyb3JfZGVzY3JpcHRpb24iLCJ0cmFjZSIsImNiIiwiY3JlYXRlIiwibGluayIsInB1YmxpY19rZXkiLCJzZWNyZXRfa2V5IiwicG0yX3ZlcnNpb24iLCJwa2ciLCJ2ZXJzaW9uIiwiRXJyb3IiLCJwYXltZW50IiwidXNlciIsInJldHJpZXZlIiwidG1wVXNlciIsImNvbm5lY3RUb0J1Y2tldCIsInRhcmdldCIsImFwcE5hbWUiLCJjYWxsYmFjayIsIm9wZW5lciIsImVzY2FwZSIsInMiLCJyZXBsYWNlIiwiU1VET19VU0VSIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsSUFBTUEsbUJBQW1CLEdBQUcsV0FBNUI7QUFDQSxJQUFNQyxtQkFBbUIsR0FBRyxZQUE1Qjs7SUFFcUJDLFk7Ozs7Ozs7aUNBTUVDLFEsRUFBVTtBQUM3QixXQUFLQyxHQUFMLEdBQVdELFFBQVg7QUFDRDs7OytCQUVrQjtBQUNqQixjQUFRRSxPQUFPLENBQUNDLFFBQWhCO0FBQ0UsYUFBSyxRQUFMO0FBQWU7QUFDYixtQkFBTyxJQUFJQyxtQkFBSixDQUFnQjtBQUNyQkMsY0FBQUEsU0FBUyxFQUFFUjtBQURVLGFBQWhCLENBQVA7QUFHRDs7QUFDRCxhQUFLLE9BQUw7QUFBYztBQUNaLG1CQUFPLElBQUlPLG1CQUFKLENBQWdCO0FBQ3JCQyxjQUFBQSxTQUFTLEVBQUVSO0FBRFUsYUFBaEIsQ0FBUDtBQUdEOztBQUNELGFBQUssT0FBTDtBQUFjO0FBQ1osZ0JBQU1TLFNBQVMsR0FBR0osT0FBTyxDQUFDSyxHQUFSLENBQVlDLG1CQUFaLElBQW1DTixPQUFPLENBQUNLLEdBQVIsQ0FBWUUsbUJBQS9DLElB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LEVBQVVDLFEsRUFBVztBQUN4QyxVQUFJQyxNQUFKOztBQUNBLFVBQU1DLE1BQU0sR0FBRyxTQUFUQSxNQUFTLENBQVVDLENBQVYsRUFBYTtBQUMxQixlQUFPQSxDQUFDLENBQUNDLE9BQUYsQ0FBVSxJQUFWLEVBQWdCLEtBQWhCLENBQVA7QUFDRCxPQUZEOztBQUlBLFVBQUksT0FBUUwsT0FBUixLQUFxQixVQUF6QixFQUFxQztBQUNuQ0MsUUFBQUEsUUFBUSxHQUFHRCxPQUFYO0FBQ0FBLFFBQUFBLE9BQU8sR0FBRyxJQUFWO0FBQ0Q7O0FBRUQsY0FBUXJHLE9BQU8sQ0FBQ0MsUUFBaEI7QUFDRSxhQUFLLFFBQUw7QUFBZTtBQUNic0csWUFBQUEsTUFBTSxHQUFHRixPQUFPLHVCQUFlRyxNQUFNLENBQUNILE9BQUQsQ0FBckIsZ0JBQWhCO0FBQ0E7QUFDRDs7QUFDRCxhQUFLLE9BQUw7QUFBYztBQUNaRSxZQUFBQSxNQUFNLEdBQUdGLE9BQU8sd0JBQWVHLE1BQU0sQ0FBQ0gsT0FBRCxDQUFyQixzQkFBaEI7QUFDQTtBQUNEOztBQUNEO0FBQVM7QUFDUEUsWUFBQUEsTUFBTSxHQUFHRixPQUFPLEdBQUdHLE1BQU0sQ0FBQ0gsT0FBRCxDQUFULGFBQWhCO0FBQ0E7QUFDRDtBQVpIOztBQWVBLFVBQUlyRyxPQUFPLENBQUNLLEdBQVIsQ0FBWXNHLFNBQWhCLEVBQTJCO0FBQ3pCSixRQUFBQSxNQUFNLEdBQUcsYUFBYXZHLE9BQU8sQ0FBQ0ssR0FBUixDQUFZc0csU0FBekIsR0FBcUMsR0FBckMsR0FBMkNKLE1BQXBEO0FBQ0Q7O0FBQ0QsYUFBTyxtQ0FBUUEsTUFBUixnQkFBbUJDLE1BQU0sQ0FBQ0osTUFBRCxDQUF6QixTQUFzQ0UsUUFBdEMsQ0FBUDtBQUNEOzs7Ozs7aUNBcldrQnpHLFk7aUNBQUFBLFk7aUNBQUFBLFkiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi8uLi9jb25zdGFudHMnO1xuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzICBmcm9tICdmcyc7XG5pbXBvcnQgVGFibGUgZnJvbSAnY2xpLXRhYmxlYXUnO1xuaW1wb3J0IHBrZyBmcm9tICcuLi8uLi8uLi9wYWNrYWdlLmpzb24nO1xuaW1wb3J0IElPQVBJIGZyb20gJ0BwbTIvanMtYXBpJztcbmltcG9ydCBwcm9tcHRseSBmcm9tICdwcm9tcHRseSc7XG5pbXBvcnQgQ0xJU3RyYXRlZ3kgZnJvbSAnLi9hdXRoLXN0cmF0ZWdpZXMvQ2xpQXV0aCc7XG5pbXBvcnQgV2ViU3RyYXRlZ3kgZnJvbSAnLi9hdXRoLXN0cmF0ZWdpZXMvV2ViQXV0aCc7XG5pbXBvcnQgeyBleGVjIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5cbmNvbnN0IE9BVVRIX0NMSUVOVF9JRF9XRUIgPSAnMTM4NTU4MzExJztcbmNvbnN0IE9BVVRIX0NMSUVOVF9JRF9DTEkgPSAnMDk0Mzg1NzQzNSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBNMmlvSGFuZGxlciB7XG5cbiAgc3RhdGljIHBtMjogYW55O1xuICBzdGF0aWMgX3N0cmF0ZWd5OiBhbnk7XG4gIHN0YXRpYyBpbzogYW55O1xuXG4gIHN0YXRpYyB1c2VQTTJDbGllbnQgKGluc3RhbmNlKSB7XG4gICAgdGhpcy5wbTIgPSBpbnN0YW5jZTtcbiAgfVxuXG4gIHN0YXRpYyBzdHJhdGVneSAoKSB7XG4gICAgc3dpdGNoIChwcm9jZXNzLnBsYXRmb3JtKSB7XG4gICAgICBjYXNlICdkYXJ3aW4nOiB7XG4gICAgICAgIHJldHVybiBuZXcgV2ViU3RyYXRlZ3koe1xuICAgICAgICAgIGNsaWVudF9pZDogT0FVVEhfQ0xJRU5UX0lEX1dFQlxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgY2FzZSAnd2luMzInOiB7XG4gICAgICAgIHJldHVybiBuZXcgV2ViU3RyYXRlZ3koe1xuICAgICAgICAgIGNsaWVudF9pZDogT0FVVEhfQ0xJRU5UX0lEX1dFQlxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgY2FzZSAnbGludXgnOiB7XG4gICAgICAgIGNvbnN0IGlzRGVza3RvcCA9IHByb2Nlc3MuZW52LlhER19DVVJSRU5UX0RFU0tUT1AgfHwgcHJvY2Vzcy5lbnYuWERHX1NFU1NJT05fREVTS1RPUCB8fCBwcm9jZXNzLmVudi5ESVNQTEFZXG4gICAgICAgIGNvbnN0IGlzU1NIID0gcHJvY2Vzcy5lbnYuU1NIX1RUWSB8fCBwcm9jZXNzLmVudi5TU0hfQ09OTkVDVElPTlxuICAgICAgICBpZiAoaXNEZXNrdG9wICYmICFpc1NTSCkge1xuICAgICAgICAgIHJldHVybiBuZXcgV2ViU3RyYXRlZ3koe1xuICAgICAgICAgICAgY2xpZW50X2lkOiBPQVVUSF9DTElFTlRfSURfV0VCXG4gICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbmV3IENMSVN0cmF0ZWd5KHtcbiAgICAgICAgICAgIGNsaWVudF9pZDogT0FVVEhfQ0xJRU5UX0lEX0NMSVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgcmV0dXJuIG5ldyBDTElTdHJhdGVneSh7XG4gICAgICAgICAgY2xpZW50X2lkOiBPQVVUSF9DTElFTlRfSURfQ0xJXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGluaXQgKCkge1xuICAgIHRoaXMuX3N0cmF0ZWd5ID0gdGhpcy5zdHJhdGVneSgpXG4gICAgLyoqXG4gICAgICogSWYgeW91IGFyZSB1c2luZyBhIGxvY2FsIGJhY2tlbmQgeW91IHNob3VsZCBnaXZlIHRob3NlIG9wdGlvbnMgOlxuICAgICAqIHtcbiAgICAgKiAgIHNlcnZpY2VzOiB7XG4gICAgICogICAgQVBJOiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJyxcbiAgICAgKiAgICBPQVVUSDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzEwMCdcbiAgICAgKiAgIH1cbiAgICAgKiAgfVxuICAgICAqL1xuICAgIHRoaXMuaW8gPSBuZXcgSU9BUEkoKS51c2UodGhpcy5fc3RyYXRlZ3kpXG4gIH1cblxuICBzdGF0aWMgbGF1bmNoIChjb21tYW5kLCBvcHRzKSB7XG4gICAgLy8gZmlyc3QgaW5pdCB0aGUgc3RyYXRlZ3kgYW5kIHRoZSBpbyBjbGllbnRcbiAgICB0aGlzLmluaXQoKVxuXG4gICAgc3dpdGNoIChjb21tYW5kKSB7XG4gICAgICBjYXNlICdjb25uZWN0JyA6XG4gICAgICBjYXNlICdsb2dpbicgOlxuICAgICAgY2FzZSAncmVnaXN0ZXInIDpcbiAgICAgIGNhc2UgdW5kZWZpbmVkIDpcbiAgICAgIGNhc2UgJ2F1dGhlbnRpY2F0ZScgOiB7XG4gICAgICAgIHRoaXMuYXV0aGVudGljYXRlKClcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICAgIGNhc2UgJ3ZhbGlkYXRlJyA6IHtcbiAgICAgICAgdGhpcy52YWxpZGF0ZUFjY291bnQob3B0cylcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICAgIGNhc2UgJ2hlbHAnIDpcbiAgICAgIGNhc2UgJ3dlbGNvbWUnOiB7XG4gICAgICAgIHZhciBkdCA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi9wcmVzL3dlbGNvbWUnKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGR0LnRvU3RyaW5nKCkpO1xuICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDApXG4gICAgICB9XG4gICAgICBjYXNlICdsb2dvdXQnOiB7XG4gICAgICAgIHRoaXMuX3N0cmF0ZWd5LmlzQXV0aGVudGljYXRlZCgpLnRoZW4oaXNDb25uZWN0ZWQgPT4ge1xuICAgICAgICAgIC8vIHRyeSB0byBraWxsIHRoZSBhZ2VudCBhbnl3YXlcbiAgICAgICAgICB0aGlzLnBtMi5raWxsQWdlbnQoZXJyID0+IHt9KVxuXG4gICAgICAgICAgaWYgKGlzQ29ubmVjdGVkID09PSBmYWxzZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IEFscmVhZHkgZGlzY29ubmVjdGVkYClcbiAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLl9zdHJhdGVneS5fcmV0cmlldmVUb2tlbnMoKGVyciwgdG9rZW5zKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBTdWNjZXNzZnVsbHkgZGlzY29ubmVjdGVkYClcbiAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgwKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc3RyYXRlZ3kuZGVsZXRlVG9rZW5zKHRoaXMuaW8pLnRoZW4oXyA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBTdWNjZXNzZnVsbHkgZGlzY29ubmVjdGVkYClcbiAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgwKVxuICAgICAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBVbmV4cGVjdGVkIGVycm9yOiAke2Vyci5tZXNzYWdlfWApXG4gICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gRmFpbGVkIHRvIGxvZ291dDogJHtlcnIubWVzc2FnZX1gKVxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBZb3UgY2FuIGFsc28gY29udGFjdCB1cyB0byBnZXQgaGVscDogY29udGFjdEBwbTIuaW9gKVxuICAgICAgICB9KVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgY2FzZSAnY3JlYXRlJzoge1xuICAgICAgICB0aGlzLl9zdHJhdGVneS5pc0F1dGhlbnRpY2F0ZWQoKS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgLy8gaWYgdGhlIHVzZXIgaXNuJ3QgYXV0aGVudGljYXRlZCwgd2UgbWFrZSB0aGVtIGRvIHRoZSB3aG9sZSBmbG93XG4gICAgICAgICAgaWYgKHJlcyAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgdGhpcy5hdXRoZW50aWNhdGUoKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUJ1Y2tldCh0aGlzLmNyZWF0ZUJ1Y2tldEhhbmRsZXIuYmluZCh0aGlzKSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjc3QuUE0yX0lPX01TR19FUlJ9IEZhaWxlZCB0byBjcmVhdGUgdG8gdGhlIGJ1Y2tldDogJHtlcnIubWVzc2FnZX1gKVxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBZb3UgY2FuIGFsc28gY29udGFjdCB1cyB0byBnZXQgaGVscDogY29udGFjdEBwbTIuaW9gKVxuICAgICAgICB9KVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgY2FzZSAnd2ViJzoge1xuICAgICAgICB0aGlzLl9zdHJhdGVneS5pc0F1dGhlbnRpY2F0ZWQoKS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgLy8gaWYgdGhlIHVzZXIgaXNuJ3QgYXV0aGVudGljYXRlZCwgd2UgbWFrZSB0aGVtIGRvIHRoZSB3aG9sZSBmbG93XG4gICAgICAgICAgaWYgKHJlcyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBZb3UgbmVlZCB0byBiZSBhdXRoZW50aWNhdGVkIHRvIGRvIHRoYXQsIHBsZWFzZSB1c2U6IHBtMiBwbHVzIGxvZ2luYClcbiAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMSlcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fc3RyYXRlZ3kuX3JldHJpZXZlVG9rZW5zKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9wZW5VSSgpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gRmFpbGVkIHRvIG9wZW4gdGhlIFVJOiAke2Vyci5tZXNzYWdlfWApXG4gICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjc3QuUE0yX0lPX01TR19FUlJ9IFlvdSBjYW4gYWxzbyBjb250YWN0IHVzIHRvIGdldCBoZWxwOiBjb250YWN0QHBtMi5pb2ApXG4gICAgICAgIH0pXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBkZWZhdWx0IDoge1xuICAgICAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR19FUlJ9IEludmFsaWQgY29tbWFuZCAke2NvbW1hbmR9LCBhdmFpbGFibGUgOiBsb2dpbixyZWdpc3Rlcix2YWxpZGF0ZSxjb25uZWN0IG9yIHdlYmApXG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBvcGVuVUkgKCkge1xuICAgIHRoaXMuaW8uYnVja2V0LnJldHJpZXZlQWxsKCkudGhlbihyZXMgPT4ge1xuICAgICAgY29uc3QgYnVja2V0cyA9IHJlcy5kYXRhXG5cbiAgICAgIGlmIChidWNrZXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVCdWNrZXQoKGVyciwgYnVja2V0KSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjc3QuUE0yX0lPX01TR19FUlJ9IEZhaWxlZCB0byBjb25uZWN0IHRvIHRoZSBidWNrZXQ6ICR7ZXJyLm1lc3NhZ2V9YClcbiAgICAgICAgICAgIGlmIChidWNrZXQpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjc3QuUE0yX0lPX01TR19FUlJ9IFlvdSBjYW4gcmV0cnkgdXNpbmc6IHBtMiBwbHVzIGxpbmsgJHtidWNrZXQuc2VjcmV0X2lkfSAke2J1Y2tldC5wdWJsaWNfaWR9YClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBZb3UgY2FuIGFsc28gY29udGFjdCB1cyB0byBnZXQgaGVscDogY29udGFjdEBwbTIuaW9gKVxuICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgwKVxuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCB0YXJnZXRVUkwgPSBgaHR0cHM6Ly9hcHAucG0yLmlvLyMvYnVja2V0LyR7YnVja2V0Ll9pZH1gXG4gICAgICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFBsZWFzZSBmb2xsb3cgdGhlIHBvcHVwIG9yIGdvIHRvIHRoaXMgVVJMIDpgLCAnXFxuJywgJyAgICAnLCB0YXJnZXRVUkwpXG4gICAgICAgICAgdGhpcy5vcGVuKHRhcmdldFVSTClcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDApXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHZhciB0YWJsZSA9IG5ldyBUYWJsZSh7XG4gICAgICAgIHN0eWxlIDogeydwYWRkaW5nLWxlZnQnIDogMSwgaGVhZCA6IFsnY3lhbicsICdib2xkJ10sIGNvbXBhY3QgOiB0cnVlfSxcbiAgICAgICAgaGVhZCA6IFsnQnVja2V0IG5hbWUnLCAnUGxhbiB0eXBlJ11cbiAgICAgIH0pXG5cbiAgICAgIGJ1Y2tldHMuZm9yRWFjaChmdW5jdGlvbihidWNrZXQpIHtcbiAgICAgICAgdGFibGUucHVzaChbYnVja2V0Lm5hbWUsIGJ1Y2tldC5jcmVkaXRzLm9mZmVyX3R5cGVdKVxuICAgICAgfSlcbiAgICAgIGNvbnNvbGUubG9nKHRhYmxlLnRvU3RyaW5nKCkpXG4gICAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gSWYgeW91IGRvbid0IHdhbnQgdG8gb3BlbiB0aGUgVUkgdG8gYSBidWNrZXQsIHR5cGUgJ25vbmUnYClcblxuICAgICAgY29uc3QgY2hvaWNlcyA9IGJ1Y2tldHMubWFwKGJ1Y2tldCA9PiBidWNrZXQubmFtZSlcbiAgICAgIGNob2ljZXMucHVzaCgnbm9uZScpXG5cbiAgICAgIHByb21wdGx5LmNob29zZShgJHtjc3QuUE0yX0lPX01TR30gVHlwZSB0aGUgbmFtZSBvZiB0aGUgYnVja2V0IHlvdSB3YW50IHRvIGNvbm5lY3QgdG8gOmAsIGNob2ljZXMsIChlcnIsIHZhbHVlKSA9PiB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gJ25vbmUnKSBwcm9jZXNzLmV4aXQoMClcblxuICAgICAgICBjb25zdCBidWNrZXQgPSBidWNrZXRzLmZpbmQoYnVja2V0ID0+IGJ1Y2tldC5uYW1lID09PSB2YWx1ZSlcbiAgICAgICAgaWYgKGJ1Y2tldCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gcHJvY2Vzcy5leGl0KDApXG5cbiAgICAgICAgY29uc3QgdGFyZ2V0VVJMID0gYGh0dHBzOi8vYXBwLnBtMi5pby8jL2J1Y2tldC8ke2J1Y2tldC5faWR9YFxuICAgICAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gUGxlYXNlIGZvbGxvdyB0aGUgcG9wdXAgb3IgZ28gdG8gdGhpcyBVUkwgOmAsICdcXG4nLCAnICAgICcsIHRhcmdldFVSTClcbiAgICAgICAgdGhpcy5vcGVuKHRhcmdldFVSTClcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgwKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgc3RhdGljIHZhbGlkYXRlQWNjb3VudCAodG9rZW4pIHtcbiAgICB0aGlzLmlvLmF1dGgudmFsaWRFbWFpbCh0b2tlbilcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBFbWFpbCBzdWNjZXNmdWxseSB2YWxpZGF0ZWQuYClcbiAgICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFlvdSBjYW4gbm93IHByb2NlZWQgYW5kIHVzZTogcG0yIHBsdXMgY29ubmVjdGApXG4gICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMClcbiAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGlmIChlcnIuc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gSW52YWxpZCB0b2tlbmApXG4gICAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgxKVxuICAgICAgICB9IGVsc2UgaWYgKGVyci5zdGF0dXMgPT09IDMwMSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBFbWFpbCBzdWNjZXNmdWxseSB2YWxpZGF0ZWQuYClcbiAgICAgICAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gWW91IGNhbiBub3cgcHJvY2VlZCBhbmQgdXNlOiBwbTIgcGx1cyBjb25uZWN0YClcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDApXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbXNnID0gZXJyLmRhdGEgPyBlcnIuZGF0YS5lcnJvcl9kZXNjcmlwdGlvbiB8fCBlcnIuZGF0YS5tc2cgOiBlcnIubWVzc2FnZVxuICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gRmFpbGVkIHRvIHZhbGlkYXRlIHlvdXIgZW1haWw6ICR7bXNnfWApXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBZb3UgY2FuIGFsc28gY29udGFjdCB1cyB0byBnZXQgaGVscDogY29udGFjdEBwbTIuaW9gKVxuICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDEpXG4gICAgICB9KVxuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUJ1Y2tldEhhbmRsZXIgKGVyciwgYnVja2V0KSB7XG4gICAgaWYgKGVycikge1xuICAgICAgY29uc29sZS50cmFjZShgJHtjc3QuUE0yX0lPX01TR19FUlJ9IEZhaWxlZCB0byBjb25uZWN0IHRvIHRoZSBidWNrZXQ6ICR7ZXJyLm1lc3NhZ2V9YClcbiAgICAgIGlmIChidWNrZXQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgJHtjc3QuUE0yX0lPX01TR19FUlJ9IFlvdSBjYW4gcmV0cnkgdXNpbmc6IHBtMiBwbHVzIGxpbmsgJHtidWNrZXQuc2VjcmV0X2lkfSAke2J1Y2tldC5wdWJsaWNfaWR9YClcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBZb3UgY2FuIGFsc28gY29udGFjdCB1cyB0byBnZXQgaGVscDogY29udGFjdEBwbTIuaW9gKVxuICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgwKVxuICAgIH1cbiAgICBpZiAoYnVja2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMClcbiAgICB9XG4gICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFN1Y2Nlc3NmdWxseSBjb25uZWN0ZWQgdG8gYnVja2V0ICR7YnVja2V0Lm5hbWV9YClcbiAgICB2YXIgdGFyZ2V0VVJMID0gYGh0dHBzOi8vYXBwLnBtMi5pby8jL2J1Y2tldC8ke2J1Y2tldC5faWR9YFxuICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBZb3UgY2FuIHVzZSB0aGUgd2ViIGludGVyZmFjZSBvdmVyIHRoZXJlOiAke3RhcmdldFVSTH1gKVxuICAgIHRoaXMub3Blbih0YXJnZXRVUkwpXG4gICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgwKVxuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUJ1Y2tldCAoY2IpIHtcbiAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gQnkgZGVmYXVsdCB3ZSBhbGxvdyB5b3UgdG8gdHJpYWwgUE0yIFBsdXMgZm9yIDE0IGRheXMgd2l0aG91dCBhbnkgY3JlZGl0IGNhcmQuYClcblxuICAgIHRoaXMuaW8uYnVja2V0LmNyZWF0ZSh7XG4gICAgICBuYW1lOiAnUE0yIFBsdXMgTW9uaXRvcmluZydcbiAgICB9KS50aGVuKHJlcyA9PiB7XG4gICAgICBjb25zdCBidWNrZXQgPSByZXMuZGF0YS5idWNrZXRcblxuICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFN1Y2Nlc3NmdWxseSBjcmVhdGVkIHRoZSBidWNrZXRgKVxuICAgICAgdGhpcy5wbTIubGluayh7XG4gICAgICAgIHB1YmxpY19rZXk6IGJ1Y2tldC5wdWJsaWNfaWQsXG4gICAgICAgIHNlY3JldF9rZXk6IGJ1Y2tldC5zZWNyZXRfaWQsXG4gICAgICAgIHBtMl92ZXJzaW9uOiBwa2cudmVyc2lvblxuICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcignRmFpbGVkIHRvIGNvbm5lY3QgeW91ciBsb2NhbCBQTTIgdG8geW91ciBidWNrZXQnKSwgYnVja2V0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBjYihudWxsLCBidWNrZXQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgYSBidWNrZXQ6ICR7ZXJyLm1lc3NhZ2V9YCkpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25uZWN0IHRoZSBsb2NhbCBhZ2VudCB0byBhIHNwZWNpZmljIGJ1Y2tldFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYlxuICAgKi9cbiAgc3RhdGljIGNvbm5lY3RUb0J1Y2tldCAoY2IpIHtcbiAgICB0aGlzLmlvLmJ1Y2tldC5yZXRyaWV2ZUFsbCgpLnRoZW4ocmVzID0+IHtcbiAgICAgIGNvbnN0IGJ1Y2tldHMgPSByZXMuZGF0YVxuXG4gICAgICBpZiAoYnVja2V0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlQnVja2V0KGNiKVxuICAgICAgfVxuXG4gICAgICB2YXIgdGFibGUgPSBuZXcgVGFibGUoe1xuICAgICAgICBzdHlsZSA6IHsncGFkZGluZy1sZWZ0JyA6IDEsIGhlYWQgOiBbJ2N5YW4nLCAnYm9sZCddLCBjb21wYWN0IDogdHJ1ZX0sXG4gICAgICAgIGhlYWQgOiBbJ0J1Y2tldCBuYW1lJywgJ1BsYW4gdHlwZSddXG4gICAgICB9KVxuXG4gICAgICBidWNrZXRzLmZvckVhY2goZnVuY3Rpb24oYnVja2V0KSB7XG4gICAgICAgIHRhYmxlLnB1c2goW2J1Y2tldC5uYW1lLCBidWNrZXQucGF5bWVudC5vZmZlcl90eXBlXSlcbiAgICAgIH0pXG4gICAgICBjb25zb2xlLmxvZyh0YWJsZS50b1N0cmluZygpKVxuICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IElmIHlvdSBkb24ndCB3YW50IHRvIGNvbm5lY3QgdG8gYSBidWNrZXQsIHR5cGUgJ25vbmUnYClcblxuICAgICAgY29uc3QgY2hvaWNlcyA9IGJ1Y2tldHMubWFwKGJ1Y2tldCA9PiBidWNrZXQubmFtZSlcbiAgICAgIGNob2ljZXMucHVzaCgnbm9uZScpXG5cbiAgICAgIHByb21wdGx5LmNob29zZShgJHtjc3QuUE0yX0lPX01TR30gVHlwZSB0aGUgbmFtZSBvZiB0aGUgYnVja2V0IHlvdSB3YW50IHRvIGNvbm5lY3QgdG8gOmAsIGNob2ljZXMsIChlcnIsIHZhbHVlKSA9PiB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gJ25vbmUnKSByZXR1cm4gY2IoKVxuXG4gICAgICAgIGNvbnN0IGJ1Y2tldCA9IGJ1Y2tldHMuZmluZChidWNrZXQgPT4gYnVja2V0Lm5hbWUgPT09IHZhbHVlKVxuICAgICAgICBpZiAoYnVja2V0ID09PSB1bmRlZmluZWQpIHJldHVybiBjYigpXG4gICAgICAgIHRoaXMucG0yLmxpbmsoe1xuICAgICAgICAgIHB1YmxpY19rZXk6IGJ1Y2tldC5wdWJsaWNfaWQsXG4gICAgICAgICAgc2VjcmV0X2tleTogYnVja2V0LnNlY3JldF9pZCxcbiAgICAgICAgICBwbTJfdmVyc2lvbjogcGtnLnZlcnNpb25cbiAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgIHJldHVybiBlcnIgPyBjYihlcnIpIDogY2IobnVsbCwgYnVja2V0KVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEF1dGhlbnRpY2F0ZSB0aGUgdXNlciB3aXRoIGVpdGhlciBvZiB0aGUgc3RyYXRlZ3lcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2JcbiAgICovXG4gIHN0YXRpYyBhdXRoZW50aWNhdGUgKCkge1xuICAgIHRoaXMuX3N0cmF0ZWd5Ll9yZXRyaWV2ZVRva2VucygoZXJyLCB0b2tlbnMpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc3QgbXNnID0gZXJyLmRhdGEgPyBlcnIuZGF0YS5lcnJvcl9kZXNjcmlwdGlvbiB8fCBlcnIuZGF0YS5tc2cgOiBlcnIubWVzc2FnZVxuICAgICAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR19FUlJ9IFVuZXhwZWN0ZWQgZXJyb3IgOiAke21zZ31gKVxuICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDEpXG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gU3VjY2Vzc2Z1bGx5IGF1dGhlbnRpY2F0ZWRgKVxuICAgICAgdGhpcy5pby51c2VyLnJldHJpZXZlKCkudGhlbihyZXMgPT4ge1xuICAgICAgICBjb25zdCB1c2VyID0gcmVzLmRhdGFcblxuICAgICAgICB0aGlzLmlvLnVzZXIucmV0cmlldmUoKS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgY29uc3QgdG1wVXNlciA9IHJlcy5kYXRhXG4gICAgICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFN1Y2Nlc3NmdWxseSB2YWxpZGF0ZWRgKVxuICAgICAgICAgIHRoaXMuY29ubmVjdFRvQnVja2V0KHRoaXMuY3JlYXRlQnVja2V0SGFuZGxlci5iaW5kKHRoaXMpKVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgc3RhdGljIG9wZW4gKHRhcmdldCwgYXBwTmFtZT8sIGNhbGxiYWNrPykge1xuICAgIGxldCBvcGVuZXJcbiAgICBjb25zdCBlc2NhcGUgPSBmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIHMucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiAoYXBwTmFtZSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gYXBwTmFtZVxuICAgICAgYXBwTmFtZSA9IG51bGxcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHByb2Nlc3MucGxhdGZvcm0pIHtcbiAgICAgIGNhc2UgJ2Rhcndpbic6IHtcbiAgICAgICAgb3BlbmVyID0gYXBwTmFtZSA/IGBvcGVuIC1hIFwiJHtlc2NhcGUoYXBwTmFtZSl9XCJgIDogYG9wZW5gXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBjYXNlICd3aW4zMic6IHtcbiAgICAgICAgb3BlbmVyID0gYXBwTmFtZSA/IGBzdGFydCBcIlwiICR7ZXNjYXBlKGFwcE5hbWUpfVwiYCA6IGBzdGFydCBcIlwiYFxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgZGVmYXVsdDoge1xuICAgICAgICBvcGVuZXIgPSBhcHBOYW1lID8gZXNjYXBlKGFwcE5hbWUpIDogYHhkZy1vcGVuYFxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwcm9jZXNzLmVudi5TVURPX1VTRVIpIHtcbiAgICAgIG9wZW5lciA9ICdzdWRvIC11ICcgKyBwcm9jZXNzLmVudi5TVURPX1VTRVIgKyAnICcgKyBvcGVuZXJcbiAgICB9XG4gICAgcmV0dXJuIGV4ZWMoYCR7b3BlbmVyfSBcIiR7ZXNjYXBlKHRhcmdldCl9XCJgLCBjYWxsYmFjaylcbiAgfVxufVxuIl19