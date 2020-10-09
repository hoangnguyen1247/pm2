'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var OAUTH_CLIENT_ID_WEB = '138558311';
var OAUTH_CLIENT_ID_CLI = '0943857435';

var PM2ioHandler = /*#__PURE__*/function () {
  function PM2ioHandler() {
    _classCallCheck(this, PM2ioHandler);
  }

  _createClass(PM2ioHandler, null, [{
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

_defineProperty(PM2ioHandler, "pm2", void 0);

_defineProperty(PM2ioHandler, "_strategy", void 0);

_defineProperty(PM2ioHandler, "io", void 0);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvcG0yLXBsdXMvUE0ySU8udHMiXSwibmFtZXMiOlsiT0FVVEhfQ0xJRU5UX0lEX1dFQiIsIk9BVVRIX0NMSUVOVF9JRF9DTEkiLCJQTTJpb0hhbmRsZXIiLCJpbnN0YW5jZSIsInBtMiIsInByb2Nlc3MiLCJwbGF0Zm9ybSIsIldlYlN0cmF0ZWd5IiwiY2xpZW50X2lkIiwiaXNEZXNrdG9wIiwiZW52IiwiWERHX0NVUlJFTlRfREVTS1RPUCIsIlhER19TRVNTSU9OX0RFU0tUT1AiLCJESVNQTEFZIiwiaXNTU0giLCJTU0hfVFRZIiwiU1NIX0NPTk5FQ1RJT04iLCJDTElTdHJhdGVneSIsIl9zdHJhdGVneSIsInN0cmF0ZWd5IiwiaW8iLCJJT0FQSSIsInVzZSIsImNvbW1hbmQiLCJvcHRzIiwiaW5pdCIsInVuZGVmaW5lZCIsImF1dGhlbnRpY2F0ZSIsInZhbGlkYXRlQWNjb3VudCIsImR0IiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJwYXRoIiwiam9pbiIsIl9fZGlybmFtZSIsImNvbnNvbGUiLCJsb2ciLCJ0b1N0cmluZyIsImV4aXQiLCJpc0F1dGhlbnRpY2F0ZWQiLCJ0aGVuIiwiaXNDb25uZWN0ZWQiLCJraWxsQWdlbnQiLCJlcnIiLCJjc3QiLCJQTTJfSU9fTVNHIiwiX3JldHJpZXZlVG9rZW5zIiwidG9rZW5zIiwiZGVsZXRlVG9rZW5zIiwiXyIsIlBNMl9JT19NU0dfRVJSIiwibWVzc2FnZSIsImVycm9yIiwicmVzIiwiY3JlYXRlQnVja2V0IiwiY3JlYXRlQnVja2V0SGFuZGxlciIsImJpbmQiLCJvcGVuVUkiLCJidWNrZXQiLCJyZXRyaWV2ZUFsbCIsImJ1Y2tldHMiLCJkYXRhIiwibGVuZ3RoIiwic2VjcmV0X2lkIiwicHVibGljX2lkIiwidGFyZ2V0VVJMIiwiX2lkIiwib3BlbiIsInRhYmxlIiwiVGFibGUiLCJzdHlsZSIsImhlYWQiLCJjb21wYWN0IiwiZm9yRWFjaCIsInB1c2giLCJuYW1lIiwiY3JlZGl0cyIsIm9mZmVyX3R5cGUiLCJjaG9pY2VzIiwibWFwIiwicHJvbXB0bHkiLCJjaG9vc2UiLCJ2YWx1ZSIsImZpbmQiLCJ0b2tlbiIsImF1dGgiLCJ2YWxpZEVtYWlsIiwic3RhdHVzIiwibXNnIiwiZXJyb3JfZGVzY3JpcHRpb24iLCJ0cmFjZSIsImNiIiwiY3JlYXRlIiwibGluayIsInB1YmxpY19rZXkiLCJzZWNyZXRfa2V5IiwicG0yX3ZlcnNpb24iLCJwa2ciLCJ2ZXJzaW9uIiwiRXJyb3IiLCJwYXltZW50IiwidXNlciIsInJldHJpZXZlIiwidG1wVXNlciIsImNvbm5lY3RUb0J1Y2tldCIsInRhcmdldCIsImFwcE5hbWUiLCJjYWxsYmFjayIsIm9wZW5lciIsImVzY2FwZSIsInMiLCJyZXBsYWNlIiwiU1VET19VU0VSIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQUVBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQSxJQUFNQSxtQkFBbUIsR0FBRyxXQUE1QjtBQUNBLElBQU1DLG1CQUFtQixHQUFHLFlBQTVCOztJQUVxQkMsWTs7Ozs7OztpQ0FNRUMsUSxFQUFVO0FBQzdCLFdBQUtDLEdBQUwsR0FBV0QsUUFBWDtBQUNEOzs7K0JBRWtCO0FBQ2pCLGNBQVFFLE9BQU8sQ0FBQ0MsUUFBaEI7QUFDRSxhQUFLLFFBQUw7QUFBZTtBQUNiLG1CQUFPLElBQUlDLG1CQUFKLENBQWdCO0FBQ3JCQyxjQUFBQSxTQUFTLEVBQUVSO0FBRFUsYUFBaEIsQ0FBUDtBQUdEOztBQUNELGFBQUssT0FBTDtBQUFjO0FBQ1osbUJBQU8sSUFBSU8sbUJBQUosQ0FBZ0I7QUFDckJDLGNBQUFBLFNBQVMsRUFBRVI7QUFEVSxhQUFoQixDQUFQO0FBR0Q7O0FBQ0QsYUFBSyxPQUFMO0FBQWM7QUFDWixnQkFBTVMsU0FBUyxHQUFHSixPQUFPLENBQUNLLEdBQVIsQ0FBWUMsbUJBQVosSUFBbUNOLE9BQU8sQ0FBQ0ssR0FBUixDQUFZRSxtQkFBL0Ms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LE8sRUFBVUMsUSxFQUFXO0FBQ3hDLFVBQUlDLE1BQUo7O0FBQ0EsVUFBTUMsTUFBTSxHQUFHLFNBQVRBLE1BQVMsQ0FBVUMsQ0FBVixFQUFhO0FBQzFCLGVBQU9BLENBQUMsQ0FBQ0MsT0FBRixDQUFVLElBQVYsRUFBZ0IsS0FBaEIsQ0FBUDtBQUNELE9BRkQ7O0FBSUEsVUFBSSxPQUFRTCxPQUFSLEtBQXFCLFVBQXpCLEVBQXFDO0FBQ25DQyxRQUFBQSxRQUFRLEdBQUdELE9BQVg7QUFDQUEsUUFBQUEsT0FBTyxHQUFHLElBQVY7QUFDRDs7QUFFRCxjQUFRckcsT0FBTyxDQUFDQyxRQUFoQjtBQUNFLGFBQUssUUFBTDtBQUFlO0FBQ2JzRyxZQUFBQSxNQUFNLEdBQUdGLE9BQU8sdUJBQWVHLE1BQU0sQ0FBQ0gsT0FBRCxDQUFyQixnQkFBaEI7QUFDQTtBQUNEOztBQUNELGFBQUssT0FBTDtBQUFjO0FBQ1pFLFlBQUFBLE1BQU0sR0FBR0YsT0FBTyx3QkFBZUcsTUFBTSxDQUFDSCxPQUFELENBQXJCLHNCQUFoQjtBQUNBO0FBQ0Q7O0FBQ0Q7QUFBUztBQUNQRSxZQUFBQSxNQUFNLEdBQUdGLE9BQU8sR0FBR0csTUFBTSxDQUFDSCxPQUFELENBQVQsYUFBaEI7QUFDQTtBQUNEO0FBWkg7O0FBZUEsVUFBSXJHLE9BQU8sQ0FBQ0ssR0FBUixDQUFZc0csU0FBaEIsRUFBMkI7QUFDekJKLFFBQUFBLE1BQU0sR0FBRyxhQUFhdkcsT0FBTyxDQUFDSyxHQUFSLENBQVlzRyxTQUF6QixHQUFxQyxHQUFyQyxHQUEyQ0osTUFBcEQ7QUFDRDs7QUFDRCxhQUFPLG1DQUFRQSxNQUFSLGdCQUFtQkMsTUFBTSxDQUFDSixNQUFELENBQXpCLFNBQXNDRSxRQUF0QyxDQUFQO0FBQ0Q7Ozs7Ozs7O2dCQXJXa0J6RyxZOztnQkFBQUEsWTs7Z0JBQUFBLFkiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcclxuXHJcbmltcG9ydCBjc3QgZnJvbSAnLi4vLi4vLi4vY29uc3RhbnRzJztcclxuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBmcyAgZnJvbSAnZnMnO1xyXG5pbXBvcnQgVGFibGUgZnJvbSAnY2xpLXRhYmxlYXUnO1xyXG5pbXBvcnQgcGtnIGZyb20gJy4uLy4uLy4uL3BhY2thZ2UuanNvbic7XHJcbmltcG9ydCBJT0FQSSBmcm9tICdAcG0yL2pzLWFwaSc7XHJcbmltcG9ydCBwcm9tcHRseSBmcm9tICdwcm9tcHRseSc7XHJcbmltcG9ydCBDTElTdHJhdGVneSBmcm9tICcuL2F1dGgtc3RyYXRlZ2llcy9DbGlBdXRoJztcclxuaW1wb3J0IFdlYlN0cmF0ZWd5IGZyb20gJy4vYXV0aC1zdHJhdGVnaWVzL1dlYkF1dGgnO1xyXG5pbXBvcnQgeyBleGVjIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XHJcblxyXG5jb25zdCBPQVVUSF9DTElFTlRfSURfV0VCID0gJzEzODU1ODMxMSc7XHJcbmNvbnN0IE9BVVRIX0NMSUVOVF9JRF9DTEkgPSAnMDk0Mzg1NzQzNSc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQTTJpb0hhbmRsZXIge1xyXG5cclxuICBzdGF0aWMgcG0yOiBhbnk7XHJcbiAgc3RhdGljIF9zdHJhdGVneTogYW55O1xyXG4gIHN0YXRpYyBpbzogYW55O1xyXG5cclxuICBzdGF0aWMgdXNlUE0yQ2xpZW50IChpbnN0YW5jZSkge1xyXG4gICAgdGhpcy5wbTIgPSBpbnN0YW5jZTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBzdHJhdGVneSAoKSB7XHJcbiAgICBzd2l0Y2ggKHByb2Nlc3MucGxhdGZvcm0pIHtcclxuICAgICAgY2FzZSAnZGFyd2luJzoge1xyXG4gICAgICAgIHJldHVybiBuZXcgV2ViU3RyYXRlZ3koe1xyXG4gICAgICAgICAgY2xpZW50X2lkOiBPQVVUSF9DTElFTlRfSURfV0VCXHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG4gICAgICBjYXNlICd3aW4zMic6IHtcclxuICAgICAgICByZXR1cm4gbmV3IFdlYlN0cmF0ZWd5KHtcclxuICAgICAgICAgIGNsaWVudF9pZDogT0FVVEhfQ0xJRU5UX0lEX1dFQlxyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAnbGludXgnOiB7XHJcbiAgICAgICAgY29uc3QgaXNEZXNrdG9wID0gcHJvY2Vzcy5lbnYuWERHX0NVUlJFTlRfREVTS1RPUCB8fCBwcm9jZXNzLmVudi5YREdfU0VTU0lPTl9ERVNLVE9QIHx8IHByb2Nlc3MuZW52LkRJU1BMQVlcclxuICAgICAgICBjb25zdCBpc1NTSCA9IHByb2Nlc3MuZW52LlNTSF9UVFkgfHwgcHJvY2Vzcy5lbnYuU1NIX0NPTk5FQ1RJT05cclxuICAgICAgICBpZiAoaXNEZXNrdG9wICYmICFpc1NTSCkge1xyXG4gICAgICAgICAgcmV0dXJuIG5ldyBXZWJTdHJhdGVneSh7XHJcbiAgICAgICAgICAgIGNsaWVudF9pZDogT0FVVEhfQ0xJRU5UX0lEX1dFQlxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIG5ldyBDTElTdHJhdGVneSh7XHJcbiAgICAgICAgICAgIGNsaWVudF9pZDogT0FVVEhfQ0xJRU5UX0lEX0NMSVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZGVmYXVsdDoge1xyXG4gICAgICAgIHJldHVybiBuZXcgQ0xJU3RyYXRlZ3koe1xyXG4gICAgICAgICAgY2xpZW50X2lkOiBPQVVUSF9DTElFTlRfSURfQ0xJXHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc3RhdGljIGluaXQgKCkge1xyXG4gICAgdGhpcy5fc3RyYXRlZ3kgPSB0aGlzLnN0cmF0ZWd5KClcclxuICAgIC8qKlxyXG4gICAgICogSWYgeW91IGFyZSB1c2luZyBhIGxvY2FsIGJhY2tlbmQgeW91IHNob3VsZCBnaXZlIHRob3NlIG9wdGlvbnMgOlxyXG4gICAgICoge1xyXG4gICAgICogICBzZXJ2aWNlczoge1xyXG4gICAgICogICAgQVBJOiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJyxcclxuICAgICAqICAgIE9BVVRIOiAnaHR0cDovL2xvY2FsaG9zdDozMTAwJ1xyXG4gICAgICogICB9XHJcbiAgICAgKiAgfVxyXG4gICAgICovXHJcbiAgICB0aGlzLmlvID0gbmV3IElPQVBJKCkudXNlKHRoaXMuX3N0cmF0ZWd5KVxyXG4gIH1cclxuXHJcbiAgc3RhdGljIGxhdW5jaCAoY29tbWFuZCwgb3B0cykge1xyXG4gICAgLy8gZmlyc3QgaW5pdCB0aGUgc3RyYXRlZ3kgYW5kIHRoZSBpbyBjbGllbnRcclxuICAgIHRoaXMuaW5pdCgpXHJcblxyXG4gICAgc3dpdGNoIChjb21tYW5kKSB7XHJcbiAgICAgIGNhc2UgJ2Nvbm5lY3QnIDpcclxuICAgICAgY2FzZSAnbG9naW4nIDpcclxuICAgICAgY2FzZSAncmVnaXN0ZXInIDpcclxuICAgICAgY2FzZSB1bmRlZmluZWQgOlxyXG4gICAgICBjYXNlICdhdXRoZW50aWNhdGUnIDoge1xyXG4gICAgICAgIHRoaXMuYXV0aGVudGljYXRlKClcclxuICAgICAgICBicmVha1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgJ3ZhbGlkYXRlJyA6IHtcclxuICAgICAgICB0aGlzLnZhbGlkYXRlQWNjb3VudChvcHRzKVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAnaGVscCcgOlxyXG4gICAgICBjYXNlICd3ZWxjb21lJzoge1xyXG4gICAgICAgIHZhciBkdCA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi9wcmVzL3dlbGNvbWUnKSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coZHQudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgwKVxyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgJ2xvZ291dCc6IHtcclxuICAgICAgICB0aGlzLl9zdHJhdGVneS5pc0F1dGhlbnRpY2F0ZWQoKS50aGVuKGlzQ29ubmVjdGVkID0+IHtcclxuICAgICAgICAgIC8vIHRyeSB0byBraWxsIHRoZSBhZ2VudCBhbnl3YXlcclxuICAgICAgICAgIHRoaXMucG0yLmtpbGxBZ2VudChlcnIgPT4ge30pXHJcblxyXG4gICAgICAgICAgaWYgKGlzQ29ubmVjdGVkID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gQWxyZWFkeSBkaXNjb25uZWN0ZWRgKVxyXG4gICAgICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDApXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fc3RyYXRlZ3kuX3JldHJpZXZlVG9rZW5zKChlcnIsIHRva2VucykgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFN1Y2Nlc3NmdWxseSBkaXNjb25uZWN0ZWRgKVxyXG4gICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9zdHJhdGVneS5kZWxldGVUb2tlbnModGhpcy5pbykudGhlbihfID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gU3VjY2Vzc2Z1bGx5IGRpc2Nvbm5lY3RlZGApXHJcbiAgICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgwKVxyXG4gICAgICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gVW5leHBlY3RlZCBlcnJvcjogJHtlcnIubWVzc2FnZX1gKVxyXG4gICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBGYWlsZWQgdG8gbG9nb3V0OiAke2Vyci5tZXNzYWdlfWApXHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gWW91IGNhbiBhbHNvIGNvbnRhY3QgdXMgdG8gZ2V0IGhlbHA6IGNvbnRhY3RAcG0yLmlvYClcclxuICAgICAgICB9KVxyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIH1cclxuICAgICAgY2FzZSAnY3JlYXRlJzoge1xyXG4gICAgICAgIHRoaXMuX3N0cmF0ZWd5LmlzQXV0aGVudGljYXRlZCgpLnRoZW4ocmVzID0+IHtcclxuICAgICAgICAgIC8vIGlmIHRoZSB1c2VyIGlzbid0IGF1dGhlbnRpY2F0ZWQsIHdlIG1ha2UgdGhlbSBkbyB0aGUgd2hvbGUgZmxvd1xyXG4gICAgICAgICAgaWYgKHJlcyAhPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmF1dGhlbnRpY2F0ZSgpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUJ1Y2tldCh0aGlzLmNyZWF0ZUJ1Y2tldEhhbmRsZXIuYmluZCh0aGlzKSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjc3QuUE0yX0lPX01TR19FUlJ9IEZhaWxlZCB0byBjcmVhdGUgdG8gdGhlIGJ1Y2tldDogJHtlcnIubWVzc2FnZX1gKVxyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihgJHtjc3QuUE0yX0lPX01TR19FUlJ9IFlvdSBjYW4gYWxzbyBjb250YWN0IHVzIHRvIGdldCBoZWxwOiBjb250YWN0QHBtMi5pb2ApXHJcbiAgICAgICAgfSlcclxuICAgICAgICBicmVha1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgJ3dlYic6IHtcclxuICAgICAgICB0aGlzLl9zdHJhdGVneS5pc0F1dGhlbnRpY2F0ZWQoKS50aGVuKHJlcyA9PiB7XHJcbiAgICAgICAgICAvLyBpZiB0aGUgdXNlciBpc24ndCBhdXRoZW50aWNhdGVkLCB3ZSBtYWtlIHRoZW0gZG8gdGhlIHdob2xlIGZsb3dcclxuICAgICAgICAgIGlmIChyZXMgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBZb3UgbmVlZCB0byBiZSBhdXRoZW50aWNhdGVkIHRvIGRvIHRoYXQsIHBsZWFzZSB1c2U6IHBtMiBwbHVzIGxvZ2luYClcclxuICAgICAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgxKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy5fc3RyYXRlZ3kuX3JldHJpZXZlVG9rZW5zKCgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3BlblVJKClcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBGYWlsZWQgdG8gb3BlbiB0aGUgVUk6ICR7ZXJyLm1lc3NhZ2V9YClcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBZb3UgY2FuIGFsc28gY29udGFjdCB1cyB0byBnZXQgaGVscDogY29udGFjdEBwbTIuaW9gKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgfVxyXG4gICAgICBkZWZhdWx0IDoge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gSW52YWxpZCBjb21tYW5kICR7Y29tbWFuZH0sIGF2YWlsYWJsZSA6IGxvZ2luLHJlZ2lzdGVyLHZhbGlkYXRlLGNvbm5lY3Qgb3Igd2ViYClcclxuICAgICAgICBwcm9jZXNzLmV4aXQoMSlcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc3RhdGljIG9wZW5VSSAoKSB7XHJcbiAgICB0aGlzLmlvLmJ1Y2tldC5yZXRyaWV2ZUFsbCgpLnRoZW4ocmVzID0+IHtcclxuICAgICAgY29uc3QgYnVja2V0cyA9IHJlcy5kYXRhXHJcblxyXG4gICAgICBpZiAoYnVja2V0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVCdWNrZXQoKGVyciwgYnVja2V0KSA9PiB7XHJcbiAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBGYWlsZWQgdG8gY29ubmVjdCB0byB0aGUgYnVja2V0OiAke2Vyci5tZXNzYWdlfWApXHJcbiAgICAgICAgICAgIGlmIChidWNrZXQpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gWW91IGNhbiByZXRyeSB1c2luZzogcG0yIHBsdXMgbGluayAke2J1Y2tldC5zZWNyZXRfaWR9ICR7YnVja2V0LnB1YmxpY19pZH1gKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBZb3UgY2FuIGFsc28gY29udGFjdCB1cyB0byBnZXQgaGVscDogY29udGFjdEBwbTIuaW9gKVxyXG4gICAgICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDApXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCB0YXJnZXRVUkwgPSBgaHR0cHM6Ly9hcHAucG0yLmlvLyMvYnVja2V0LyR7YnVja2V0Ll9pZH1gXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gUGxlYXNlIGZvbGxvdyB0aGUgcG9wdXAgb3IgZ28gdG8gdGhpcyBVUkwgOmAsICdcXG4nLCAnICAgICcsIHRhcmdldFVSTClcclxuICAgICAgICAgIHRoaXMub3Blbih0YXJnZXRVUkwpXHJcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDApXHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHRhYmxlID0gbmV3IFRhYmxlKHtcclxuICAgICAgICBzdHlsZSA6IHsncGFkZGluZy1sZWZ0JyA6IDEsIGhlYWQgOiBbJ2N5YW4nLCAnYm9sZCddLCBjb21wYWN0IDogdHJ1ZX0sXHJcbiAgICAgICAgaGVhZCA6IFsnQnVja2V0IG5hbWUnLCAnUGxhbiB0eXBlJ11cclxuICAgICAgfSlcclxuXHJcbiAgICAgIGJ1Y2tldHMuZm9yRWFjaChmdW5jdGlvbihidWNrZXQpIHtcclxuICAgICAgICB0YWJsZS5wdXNoKFtidWNrZXQubmFtZSwgYnVja2V0LmNyZWRpdHMub2ZmZXJfdHlwZV0pXHJcbiAgICAgIH0pXHJcbiAgICAgIGNvbnNvbGUubG9nKHRhYmxlLnRvU3RyaW5nKCkpXHJcbiAgICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBJZiB5b3UgZG9uJ3Qgd2FudCB0byBvcGVuIHRoZSBVSSB0byBhIGJ1Y2tldCwgdHlwZSAnbm9uZSdgKVxyXG5cclxuICAgICAgY29uc3QgY2hvaWNlcyA9IGJ1Y2tldHMubWFwKGJ1Y2tldCA9PiBidWNrZXQubmFtZSlcclxuICAgICAgY2hvaWNlcy5wdXNoKCdub25lJylcclxuXHJcbiAgICAgIHByb21wdGx5LmNob29zZShgJHtjc3QuUE0yX0lPX01TR30gVHlwZSB0aGUgbmFtZSBvZiB0aGUgYnVja2V0IHlvdSB3YW50IHRvIGNvbm5lY3QgdG8gOmAsIGNob2ljZXMsIChlcnIsIHZhbHVlKSA9PiB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09PSAnbm9uZScpIHByb2Nlc3MuZXhpdCgwKVxyXG5cclxuICAgICAgICBjb25zdCBidWNrZXQgPSBidWNrZXRzLmZpbmQoYnVja2V0ID0+IGJ1Y2tldC5uYW1lID09PSB2YWx1ZSlcclxuICAgICAgICBpZiAoYnVja2V0ID09PSB1bmRlZmluZWQpIHJldHVybiBwcm9jZXNzLmV4aXQoMClcclxuXHJcbiAgICAgICAgY29uc3QgdGFyZ2V0VVJMID0gYGh0dHBzOi8vYXBwLnBtMi5pby8jL2J1Y2tldC8ke2J1Y2tldC5faWR9YFxyXG4gICAgICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBQbGVhc2UgZm9sbG93IHRoZSBwb3B1cCBvciBnbyB0byB0aGlzIFVSTCA6YCwgJ1xcbicsICcgICAgJywgdGFyZ2V0VVJMKVxyXG4gICAgICAgIHRoaXMub3Blbih0YXJnZXRVUkwpXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgwKVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIHN0YXRpYyB2YWxpZGF0ZUFjY291bnQgKHRva2VuKSB7XHJcbiAgICB0aGlzLmlvLmF1dGgudmFsaWRFbWFpbCh0b2tlbilcclxuICAgICAgLnRoZW4ocmVzID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gRW1haWwgc3VjY2VzZnVsbHkgdmFsaWRhdGVkLmApXHJcbiAgICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFlvdSBjYW4gbm93IHByb2NlZWQgYW5kIHVzZTogcG0yIHBsdXMgY29ubmVjdGApXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgwKVxyXG4gICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgIGlmIChlcnIuc3RhdHVzID09PSA0MDEpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBJbnZhbGlkIHRva2VuYClcclxuICAgICAgICAgIHJldHVybiBwcm9jZXNzLmV4aXQoMSlcclxuICAgICAgICB9IGVsc2UgaWYgKGVyci5zdGF0dXMgPT09IDMwMSkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IEVtYWlsIHN1Y2Nlc2Z1bGx5IHZhbGlkYXRlZC5gKVxyXG4gICAgICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFlvdSBjYW4gbm93IHByb2NlZWQgYW5kIHVzZTogcG0yIHBsdXMgY29ubmVjdGApXHJcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IG1zZyA9IGVyci5kYXRhID8gZXJyLmRhdGEuZXJyb3JfZGVzY3JpcHRpb24gfHwgZXJyLmRhdGEubXNnIDogZXJyLm1lc3NhZ2VcclxuICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gRmFpbGVkIHRvIHZhbGlkYXRlIHlvdXIgZW1haWw6ICR7bXNnfWApXHJcbiAgICAgICAgY29uc29sZS5lcnJvcihgJHtjc3QuUE0yX0lPX01TR19FUlJ9IFlvdSBjYW4gYWxzbyBjb250YWN0IHVzIHRvIGdldCBoZWxwOiBjb250YWN0QHBtMi5pb2ApXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgxKVxyXG4gICAgICB9KVxyXG4gIH1cclxuXHJcbiAgc3RhdGljIGNyZWF0ZUJ1Y2tldEhhbmRsZXIgKGVyciwgYnVja2V0KSB7XHJcbiAgICBpZiAoZXJyKSB7XHJcbiAgICAgIGNvbnNvbGUudHJhY2UoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBGYWlsZWQgdG8gY29ubmVjdCB0byB0aGUgYnVja2V0OiAke2Vyci5tZXNzYWdlfWApXHJcbiAgICAgIGlmIChidWNrZXQpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gWW91IGNhbiByZXRyeSB1c2luZzogcG0yIHBsdXMgbGluayAke2J1Y2tldC5zZWNyZXRfaWR9ICR7YnVja2V0LnB1YmxpY19pZH1gKVxyXG4gICAgICB9XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCR7Y3N0LlBNMl9JT19NU0dfRVJSfSBZb3UgY2FuIGFsc28gY29udGFjdCB1cyB0byBnZXQgaGVscDogY29udGFjdEBwbTIuaW9gKVxyXG4gICAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDApXHJcbiAgICB9XHJcbiAgICBpZiAoYnVja2V0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgwKVxyXG4gICAgfVxyXG4gICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFN1Y2Nlc3NmdWxseSBjb25uZWN0ZWQgdG8gYnVja2V0ICR7YnVja2V0Lm5hbWV9YClcclxuICAgIHZhciB0YXJnZXRVUkwgPSBgaHR0cHM6Ly9hcHAucG0yLmlvLyMvYnVja2V0LyR7YnVja2V0Ll9pZH1gXHJcbiAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gWW91IGNhbiB1c2UgdGhlIHdlYiBpbnRlcmZhY2Ugb3ZlciB0aGVyZTogJHt0YXJnZXRVUkx9YClcclxuICAgIHRoaXMub3Blbih0YXJnZXRVUkwpXHJcbiAgICByZXR1cm4gcHJvY2Vzcy5leGl0KDApXHJcbiAgfVxyXG5cclxuICBzdGF0aWMgY3JlYXRlQnVja2V0IChjYikge1xyXG4gICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IEJ5IGRlZmF1bHQgd2UgYWxsb3cgeW91IHRvIHRyaWFsIFBNMiBQbHVzIGZvciAxNCBkYXlzIHdpdGhvdXQgYW55IGNyZWRpdCBjYXJkLmApXHJcblxyXG4gICAgdGhpcy5pby5idWNrZXQuY3JlYXRlKHtcclxuICAgICAgbmFtZTogJ1BNMiBQbHVzIE1vbml0b3JpbmcnXHJcbiAgICB9KS50aGVuKHJlcyA9PiB7XHJcbiAgICAgIGNvbnN0IGJ1Y2tldCA9IHJlcy5kYXRhLmJ1Y2tldFxyXG5cclxuICAgICAgY29uc29sZS5sb2coYCR7Y3N0LlBNMl9JT19NU0d9IFN1Y2Nlc3NmdWxseSBjcmVhdGVkIHRoZSBidWNrZXRgKVxyXG4gICAgICB0aGlzLnBtMi5saW5rKHtcclxuICAgICAgICBwdWJsaWNfa2V5OiBidWNrZXQucHVibGljX2lkLFxyXG4gICAgICAgIHNlY3JldF9rZXk6IGJ1Y2tldC5zZWNyZXRfaWQsXHJcbiAgICAgICAgcG0yX3ZlcnNpb246IHBrZy52ZXJzaW9uXHJcbiAgICAgIH0sIChlcnIpID0+IHtcclxuICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdGYWlsZWQgdG8gY29ubmVjdCB5b3VyIGxvY2FsIFBNMiB0byB5b3VyIGJ1Y2tldCcpLCBidWNrZXQpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiBjYihudWxsLCBidWNrZXQpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcihgRmFpbGVkIHRvIGNyZWF0ZSBhIGJ1Y2tldDogJHtlcnIubWVzc2FnZX1gKSlcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25uZWN0IHRoZSBsb2NhbCBhZ2VudCB0byBhIHNwZWNpZmljIGJ1Y2tldFxyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXHJcbiAgICovXHJcbiAgc3RhdGljIGNvbm5lY3RUb0J1Y2tldCAoY2IpIHtcclxuICAgIHRoaXMuaW8uYnVja2V0LnJldHJpZXZlQWxsKCkudGhlbihyZXMgPT4ge1xyXG4gICAgICBjb25zdCBidWNrZXRzID0gcmVzLmRhdGFcclxuXHJcbiAgICAgIGlmIChidWNrZXRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUJ1Y2tldChjYilcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHRhYmxlID0gbmV3IFRhYmxlKHtcclxuICAgICAgICBzdHlsZSA6IHsncGFkZGluZy1sZWZ0JyA6IDEsIGhlYWQgOiBbJ2N5YW4nLCAnYm9sZCddLCBjb21wYWN0IDogdHJ1ZX0sXHJcbiAgICAgICAgaGVhZCA6IFsnQnVja2V0IG5hbWUnLCAnUGxhbiB0eXBlJ11cclxuICAgICAgfSlcclxuXHJcbiAgICAgIGJ1Y2tldHMuZm9yRWFjaChmdW5jdGlvbihidWNrZXQpIHtcclxuICAgICAgICB0YWJsZS5wdXNoKFtidWNrZXQubmFtZSwgYnVja2V0LnBheW1lbnQub2ZmZXJfdHlwZV0pXHJcbiAgICAgIH0pXHJcbiAgICAgIGNvbnNvbGUubG9nKHRhYmxlLnRvU3RyaW5nKCkpXHJcbiAgICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBJZiB5b3UgZG9uJ3Qgd2FudCB0byBjb25uZWN0IHRvIGEgYnVja2V0LCB0eXBlICdub25lJ2ApXHJcblxyXG4gICAgICBjb25zdCBjaG9pY2VzID0gYnVja2V0cy5tYXAoYnVja2V0ID0+IGJ1Y2tldC5uYW1lKVxyXG4gICAgICBjaG9pY2VzLnB1c2goJ25vbmUnKVxyXG5cclxuICAgICAgcHJvbXB0bHkuY2hvb3NlKGAke2NzdC5QTTJfSU9fTVNHfSBUeXBlIHRoZSBuYW1lIG9mIHRoZSBidWNrZXQgeW91IHdhbnQgdG8gY29ubmVjdCB0byA6YCwgY2hvaWNlcywgKGVyciwgdmFsdWUpID0+IHtcclxuICAgICAgICBpZiAodmFsdWUgPT09ICdub25lJykgcmV0dXJuIGNiKClcclxuXHJcbiAgICAgICAgY29uc3QgYnVja2V0ID0gYnVja2V0cy5maW5kKGJ1Y2tldCA9PiBidWNrZXQubmFtZSA9PT0gdmFsdWUpXHJcbiAgICAgICAgaWYgKGJ1Y2tldCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gY2IoKVxyXG4gICAgICAgIHRoaXMucG0yLmxpbmsoe1xyXG4gICAgICAgICAgcHVibGljX2tleTogYnVja2V0LnB1YmxpY19pZCxcclxuICAgICAgICAgIHNlY3JldF9rZXk6IGJ1Y2tldC5zZWNyZXRfaWQsXHJcbiAgICAgICAgICBwbTJfdmVyc2lvbjogcGtnLnZlcnNpb25cclxuICAgICAgICB9LCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gZXJyID8gY2IoZXJyKSA6IGNiKG51bGwsIGJ1Y2tldClcclxuICAgICAgICB9KVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEF1dGhlbnRpY2F0ZSB0aGUgdXNlciB3aXRoIGVpdGhlciBvZiB0aGUgc3RyYXRlZ3lcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYlxyXG4gICAqL1xyXG4gIHN0YXRpYyBhdXRoZW50aWNhdGUgKCkge1xyXG4gICAgdGhpcy5fc3RyYXRlZ3kuX3JldHJpZXZlVG9rZW5zKChlcnIsIHRva2VucykgPT4ge1xyXG4gICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgY29uc3QgbXNnID0gZXJyLmRhdGEgPyBlcnIuZGF0YS5lcnJvcl9kZXNjcmlwdGlvbiB8fCBlcnIuZGF0YS5tc2cgOiBlcnIubWVzc2FnZVxyXG4gICAgICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHX0VSUn0gVW5leHBlY3RlZCBlcnJvciA6ICR7bXNnfWApXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgxKVxyXG4gICAgICB9XHJcbiAgICAgIGNvbnNvbGUubG9nKGAke2NzdC5QTTJfSU9fTVNHfSBTdWNjZXNzZnVsbHkgYXV0aGVudGljYXRlZGApXHJcbiAgICAgIHRoaXMuaW8udXNlci5yZXRyaWV2ZSgpLnRoZW4ocmVzID0+IHtcclxuICAgICAgICBjb25zdCB1c2VyID0gcmVzLmRhdGFcclxuXHJcbiAgICAgICAgdGhpcy5pby51c2VyLnJldHJpZXZlKCkudGhlbihyZXMgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdG1wVXNlciA9IHJlcy5kYXRhXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhgJHtjc3QuUE0yX0lPX01TR30gU3VjY2Vzc2Z1bGx5IHZhbGlkYXRlZGApXHJcbiAgICAgICAgICB0aGlzLmNvbm5lY3RUb0J1Y2tldCh0aGlzLmNyZWF0ZUJ1Y2tldEhhbmRsZXIuYmluZCh0aGlzKSlcclxuICAgICAgICB9KVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIHN0YXRpYyBvcGVuICh0YXJnZXQsIGFwcE5hbWU/LCBjYWxsYmFjaz8pIHtcclxuICAgIGxldCBvcGVuZXJcclxuICAgIGNvbnN0IGVzY2FwZSA9IGZ1bmN0aW9uIChzKSB7XHJcbiAgICAgIHJldHVybiBzLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgKGFwcE5hbWUpID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGNhbGxiYWNrID0gYXBwTmFtZVxyXG4gICAgICBhcHBOYW1lID0gbnVsbFxyXG4gICAgfVxyXG5cclxuICAgIHN3aXRjaCAocHJvY2Vzcy5wbGF0Zm9ybSkge1xyXG4gICAgICBjYXNlICdkYXJ3aW4nOiB7XHJcbiAgICAgICAgb3BlbmVyID0gYXBwTmFtZSA/IGBvcGVuIC1hIFwiJHtlc2NhcGUoYXBwTmFtZSl9XCJgIDogYG9wZW5gXHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgfVxyXG4gICAgICBjYXNlICd3aW4zMic6IHtcclxuICAgICAgICBvcGVuZXIgPSBhcHBOYW1lID8gYHN0YXJ0IFwiXCIgJHtlc2NhcGUoYXBwTmFtZSl9XCJgIDogYHN0YXJ0IFwiXCJgXHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgfVxyXG4gICAgICBkZWZhdWx0OiB7XHJcbiAgICAgICAgb3BlbmVyID0gYXBwTmFtZSA/IGVzY2FwZShhcHBOYW1lKSA6IGB4ZGctb3BlbmBcclxuICAgICAgICBicmVha1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHByb2Nlc3MuZW52LlNVRE9fVVNFUikge1xyXG4gICAgICBvcGVuZXIgPSAnc3VkbyAtdSAnICsgcHJvY2Vzcy5lbnYuU1VET19VU0VSICsgJyAnICsgb3BlbmVyXHJcbiAgICB9XHJcbiAgICByZXR1cm4gZXhlYyhgJHtvcGVuZXJ9IFwiJHtlc2NhcGUodGFyZ2V0KX1cImAsIGNhbGxiYWNrKVxyXG4gIH1cclxufVxyXG4iXX0=