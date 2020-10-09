"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _Common = _interopRequireDefault(require("../Common"));

var _constants = _interopRequireDefault(require("../../constants"));

var _UX = _interopRequireDefault(require("./UX"));

var _chalk = _interopRequireDefault(require("chalk"));

var _Configuration = _interopRequireDefault(require("../Configuration"));

function _default(CLI) {
  CLI.prototype.get = function (key, cb) {
    var that = this;

    if (!key || key == 'all') {
      displayConf(function (err, data) {
        if (err) return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
        return cb ? cb(null, {
          success: true
        }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
      });
      return false;
    }

    _Configuration["default"].get(key, function (err, data) {
      if (err) {
        return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      } // pm2 conf module-name


      if (key.indexOf(':') === -1 && key.indexOf('.') === -1) {
        displayConf(key, function () {
          console.log('Modules configuration. Copy/Paste line to edit values.');
          return cb ? cb(null, {
            success: true
          }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
        });
        return false;
      } // pm2 conf module-name:key


      var module_name, key_name;

      if (key.indexOf(':') > -1) {
        module_name = key.split(':')[0];
        key_name = key.split(':')[1];
      } else if (key.indexOf('.') > -1) {
        module_name = key.split('.')[0];
        key_name = key.split('.')[1];
      }

      _Common["default"].printOut('Value for module ' + _chalk["default"].blue(module_name), 'key ' + _chalk["default"].blue(key_name) + ': ' + _chalk["default"].bold.green(data));

      return cb ? cb(null, {
        success: true
      }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
    });
  };

  CLI.prototype.set = function (key, value, cb) {
    var that = this;

    if (!key) {
      interactiveConfigEdit(function (err) {
        if (err) return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
        return cb ? cb(null, {
          success: true
        }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
      });
      return false;
    }
    /**
     * Set value
     */


    _Configuration["default"].set(key, value, function (err) {
      if (err) return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      var values = [];
      if (key.indexOf('.') > -1) values = key.split('.');
      if (key.indexOf(':') > -1) values = key.split(':');

      if (values && values.length > 1) {
        // The first element is the app name (module_conf.json)
        var app_name = values[0];
        process.env.PM2_PROGRAMMATIC = 'true';
        that.restart(app_name, {
          updateEnv: true
        }, function (err, data) {
          process.env.PM2_PROGRAMMATIC = 'false';
          if (!err) _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Module %s restarted', app_name);

          _Common["default"].log('Setting changed');

          displayConf(app_name, function () {
            return cb ? cb(null, {
              success: true
            }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
          });
        });
        return false;
      }

      displayConf(null, function () {
        return cb ? cb(null, {
          success: true
        }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
      });
    });
  };

  CLI.prototype.multiset = function (serial, cb) {
    var that = this;

    _Configuration["default"].multiset(serial, function (err, data) {
      if (err) return cb ? cb({
        success: false,
        err: err
      }) : that.exitCli(_constants["default"].ERROR_EXIT);
      var values = [];
      var key = serial.match(/(?:[^ "]+|"[^"]*")+/g)[0];
      if (key.indexOf('.') > -1) values = key.split('.');
      if (key.indexOf(':') > -1) values = key.split(':');

      if (values && values.length > 1) {
        // The first element is the app name (module_conf.json)
        var app_name = values[0];
        process.env.PM2_PROGRAMMATIC = 'true';
        that.restart(app_name, {
          updateEnv: true
        }, function (err, data) {
          process.env.PM2_PROGRAMMATIC = 'false';
          if (!err) _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Module %s restarted', app_name);
          displayConf(app_name, function () {
            return cb ? cb(null, {
              success: true
            }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
          });
        });
        return false;
      }

      displayConf(app_name, function () {
        return cb ? cb(null, {
          success: true
        }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
      });
    });
  };

  CLI.prototype.unset = function (key, cb) {
    var that = this;

    _Configuration["default"].unset(key, function (err) {
      if (err) {
        return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      displayConf(function () {
        cb ? cb(null, {
          success: true
        }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
      });
    });
  };

  CLI.prototype.conf = function (key, value, cb) {
    var that = this;

    if (typeof value === 'function') {
      cb = value;
      value = null;
    } // If key + value = set


    if (key && value) {
      that.set(key, value, function (err) {
        if (err) return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
        return cb ? cb(null, {
          success: true
        }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
      });
    } // If only key = get
    else if (key) {
        that.get(key, function (err, data) {
          if (err) return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
          return cb ? cb(null, {
            success: true
          }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
        });
      } else {
        interactiveConfigEdit(function (err) {
          if (err) return cb ? cb(_Common["default"].retErr(err)) : that.exitCli(_constants["default"].ERROR_EXIT);
          return cb ? cb(null, {
            success: true
          }) : that.exitCli(_constants["default"].SUCCESS_EXIT);
        });
      }
  };
}

;

function interactiveConfigEdit(cb) {
  _UX["default"].helpers.openEditor(_constants["default"].PM2_MODULE_CONF_FILE, function (err, data) {
    _Common["default"].printOut(_chalk["default"].bold('Module configuration (%s) edited.'), _constants["default"].PM2_MODULE_CONF_FILE);

    _Common["default"].printOut(_chalk["default"].bold('To take changes into account, please restart module related.'), _constants["default"].PM2_MODULE_CONF_FILE);

    if (err) return cb(_Common["default"].retErr(err));
    return cb(null, {
      success: true
    });
  });
}
/**
 * Configuration
 */


function displayConf(target_app, cb) {
  if (typeof target_app == 'function') {
    cb = target_app;
    target_app = null;
  }

  _Configuration["default"].getAll(function (err, data) {
    _UX["default"].helpers.dispKeys(data, target_app);

    return cb();
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvQ29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6WyJDTEkiLCJwcm90b3R5cGUiLCJnZXQiLCJrZXkiLCJjYiIsInRoYXQiLCJkaXNwbGF5Q29uZiIsImVyciIsImRhdGEiLCJDb21tb24iLCJyZXRFcnIiLCJleGl0Q2xpIiwiY3N0IiwiRVJST1JfRVhJVCIsInN1Y2Nlc3MiLCJTVUNDRVNTX0VYSVQiLCJDb25maWd1cmF0aW9uIiwiaW5kZXhPZiIsImNvbnNvbGUiLCJsb2ciLCJtb2R1bGVfbmFtZSIsImtleV9uYW1lIiwic3BsaXQiLCJwcmludE91dCIsImNoYWxrIiwiYmx1ZSIsImJvbGQiLCJncmVlbiIsInNldCIsInZhbHVlIiwiaW50ZXJhY3RpdmVDb25maWdFZGl0IiwidmFsdWVzIiwibGVuZ3RoIiwiYXBwX25hbWUiLCJwcm9jZXNzIiwiZW52IiwiUE0yX1BST0dSQU1NQVRJQyIsInJlc3RhcnQiLCJ1cGRhdGVFbnYiLCJQUkVGSVhfTVNHIiwibXVsdGlzZXQiLCJzZXJpYWwiLCJtYXRjaCIsInVuc2V0IiwiY29uZiIsIlVYIiwiaGVscGVycyIsIm9wZW5FZGl0b3IiLCJQTTJfTU9EVUxFX0NPTkZfRklMRSIsInRhcmdldF9hcHAiLCJnZXRBbGwiLCJkaXNwS2V5cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRWUsa0JBQVNBLEdBQVQsRUFBYztBQUUzQkEsRUFBQUEsR0FBRyxDQUFDQyxTQUFKLENBQWNDLEdBQWQsR0FBb0IsVUFBU0MsR0FBVCxFQUFjQyxFQUFkLEVBQWtCO0FBQ3BDLFFBQUlDLElBQUksR0FBRyxJQUFYOztBQUVBLFFBQUksQ0FBQ0YsR0FBRCxJQUFRQSxHQUFHLElBQUksS0FBbkIsRUFBMEI7QUFDeEJHLE1BQUFBLFdBQVcsQ0FBQyxVQUFTQyxHQUFULEVBQWNDLElBQWQsRUFBb0I7QUFDOUIsWUFBSUQsR0FBSixFQUNFLE9BQU9ILEVBQUUsR0FBR0EsRUFBRSxDQUFDSyxtQkFBT0MsTUFBUCxDQUFjSCxHQUFkLENBQUQsQ0FBTCxHQUE0QkYsSUFBSSxDQUFDTSxPQUFMLENBQWFDLHNCQUFJQyxVQUFqQixDQUFyQztBQUNGLGVBQU9ULEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBTztBQUFDVSxVQUFBQSxPQUFPLEVBQUM7QUFBVCxTQUFQLENBQUwsR0FBOEJULElBQUksQ0FBQ00sT0FBTCxDQUFhQyxzQkFBSUcsWUFBakIsQ0FBdkM7QUFDRCxPQUpVLENBQVg7QUFLQSxhQUFPLEtBQVA7QUFDRDs7QUFDREMsOEJBQWNkLEdBQWQsQ0FBa0JDLEdBQWxCLEVBQXVCLFVBQVNJLEdBQVQsRUFBY0MsSUFBZCxFQUFvQjtBQUN6QyxVQUFJRCxHQUFKLEVBQVM7QUFDUCxlQUFPSCxFQUFFLEdBQUdBLEVBQUUsQ0FBQ0ssbUJBQU9DLE1BQVAsQ0FBY0gsR0FBZCxDQUFELENBQUwsR0FBNEJGLElBQUksQ0FBQ00sT0FBTCxDQUFhQyxzQkFBSUMsVUFBakIsQ0FBckM7QUFDRCxPQUh3QyxDQUl6Qzs7O0FBQ0EsVUFBSVYsR0FBRyxDQUFDYyxPQUFKLENBQVksR0FBWixNQUFxQixDQUFDLENBQXRCLElBQTJCZCxHQUFHLENBQUNjLE9BQUosQ0FBWSxHQUFaLE1BQXFCLENBQUMsQ0FBckQsRUFBd0Q7QUFDdERYLFFBQUFBLFdBQVcsQ0FBQ0gsR0FBRCxFQUFNLFlBQVc7QUFDMUJlLFVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLHdEQUFaO0FBQ0EsaUJBQU9mLEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBTztBQUFDVSxZQUFBQSxPQUFPLEVBQUM7QUFBVCxXQUFQLENBQUwsR0FBOEJULElBQUksQ0FBQ00sT0FBTCxDQUFhQyxzQkFBSUcsWUFBakIsQ0FBdkM7QUFDRCxTQUhVLENBQVg7QUFJQSxlQUFPLEtBQVA7QUFDRCxPQVh3QyxDQVl6Qzs7O0FBQ0EsVUFBSUssV0FBSixFQUFpQkMsUUFBakI7O0FBRUEsVUFBSWxCLEdBQUcsQ0FBQ2MsT0FBSixDQUFZLEdBQVosSUFBbUIsQ0FBQyxDQUF4QixFQUEyQjtBQUN6QkcsUUFBQUEsV0FBVyxHQUFHakIsR0FBRyxDQUFDbUIsS0FBSixDQUFVLEdBQVYsRUFBZSxDQUFmLENBQWQ7QUFDQUQsUUFBQUEsUUFBUSxHQUFNbEIsR0FBRyxDQUFDbUIsS0FBSixDQUFVLEdBQVYsRUFBZSxDQUFmLENBQWQ7QUFDRCxPQUhELE1BR08sSUFBSW5CLEdBQUcsQ0FBQ2MsT0FBSixDQUFZLEdBQVosSUFBbUIsQ0FBQyxDQUF4QixFQUEyQjtBQUNoQ0csUUFBQUEsV0FBVyxHQUFHakIsR0FBRyxDQUFDbUIsS0FBSixDQUFVLEdBQVYsRUFBZSxDQUFmLENBQWQ7QUFDQUQsUUFBQUEsUUFBUSxHQUFNbEIsR0FBRyxDQUFDbUIsS0FBSixDQUFVLEdBQVYsRUFBZSxDQUFmLENBQWQ7QUFDRDs7QUFFRGIseUJBQU9jLFFBQVAsQ0FBZ0Isc0JBQXNCQyxrQkFBTUMsSUFBTixDQUFXTCxXQUFYLENBQXRDLEVBQStELFNBQVNJLGtCQUFNQyxJQUFOLENBQVdKLFFBQVgsQ0FBVCxHQUFnQyxJQUFoQyxHQUF1Q0csa0JBQU1FLElBQU4sQ0FBV0MsS0FBWCxDQUFpQm5CLElBQWpCLENBQXRHOztBQUdBLGFBQU9KLEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBTztBQUFDVSxRQUFBQSxPQUFPLEVBQUM7QUFBVCxPQUFQLENBQUwsR0FBOEJULElBQUksQ0FBQ00sT0FBTCxDQUFhQyxzQkFBSUcsWUFBakIsQ0FBdkM7QUFDRCxLQTNCRDtBQTRCRCxHQXZDRDs7QUF5Q0FmLEVBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUFjMkIsR0FBZCxHQUFvQixVQUFTekIsR0FBVCxFQUFjMEIsS0FBZCxFQUFxQnpCLEVBQXJCLEVBQXlCO0FBQzNDLFFBQUlDLElBQUksR0FBRyxJQUFYOztBQUVBLFFBQUksQ0FBQ0YsR0FBTCxFQUFVO0FBQ1IyQixNQUFBQSxxQkFBcUIsQ0FBQyxVQUFTdkIsR0FBVCxFQUFjO0FBQ2xDLFlBQUlBLEdBQUosRUFDRSxPQUFPSCxFQUFFLEdBQUdBLEVBQUUsQ0FBQ0ssbUJBQU9DLE1BQVAsQ0FBY0gsR0FBZCxDQUFELENBQUwsR0FBNEJGLElBQUksQ0FBQ00sT0FBTCxDQUFhQyxzQkFBSUMsVUFBakIsQ0FBckM7QUFDRixlQUFPVCxFQUFFLEdBQUdBLEVBQUUsQ0FBQyxJQUFELEVBQU87QUFBQ1UsVUFBQUEsT0FBTyxFQUFDO0FBQVQsU0FBUCxDQUFMLEdBQThCVCxJQUFJLENBQUNNLE9BQUwsQ0FBYUMsc0JBQUlHLFlBQWpCLENBQXZDO0FBQ0QsT0FKb0IsQ0FBckI7QUFLQSxhQUFPLEtBQVA7QUFDRDtBQUVEOzs7OztBQUdBQyw4QkFBY1ksR0FBZCxDQUFrQnpCLEdBQWxCLEVBQXVCMEIsS0FBdkIsRUFBOEIsVUFBU3RCLEdBQVQsRUFBYztBQUMxQyxVQUFJQSxHQUFKLEVBQ0UsT0FBT0gsRUFBRSxHQUFHQSxFQUFFLENBQUNLLG1CQUFPQyxNQUFQLENBQWNILEdBQWQsQ0FBRCxDQUFMLEdBQTRCRixJQUFJLENBQUNNLE9BQUwsQ0FBYUMsc0JBQUlDLFVBQWpCLENBQXJDO0FBRUYsVUFBSWtCLE1BQU0sR0FBRyxFQUFiO0FBRUEsVUFBSTVCLEdBQUcsQ0FBQ2MsT0FBSixDQUFZLEdBQVosSUFBbUIsQ0FBQyxDQUF4QixFQUNFYyxNQUFNLEdBQUc1QixHQUFHLENBQUNtQixLQUFKLENBQVUsR0FBVixDQUFUO0FBRUYsVUFBSW5CLEdBQUcsQ0FBQ2MsT0FBSixDQUFZLEdBQVosSUFBbUIsQ0FBQyxDQUF4QixFQUNFYyxNQUFNLEdBQUc1QixHQUFHLENBQUNtQixLQUFKLENBQVUsR0FBVixDQUFUOztBQUVGLFVBQUlTLE1BQU0sSUFBSUEsTUFBTSxDQUFDQyxNQUFQLEdBQWdCLENBQTlCLEVBQWlDO0FBQy9CO0FBQ0EsWUFBSUMsUUFBUSxHQUFHRixNQUFNLENBQUMsQ0FBRCxDQUFyQjtBQUVBRyxRQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsZ0JBQVosR0FBK0IsTUFBL0I7QUFDQS9CLFFBQUFBLElBQUksQ0FBQ2dDLE9BQUwsQ0FBYUosUUFBYixFQUF1QjtBQUNyQkssVUFBQUEsU0FBUyxFQUFHO0FBRFMsU0FBdkIsRUFFRyxVQUFTL0IsR0FBVCxFQUFjQyxJQUFkLEVBQW9CO0FBQ3JCMEIsVUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlDLGdCQUFaLEdBQStCLE9BQS9CO0FBQ0EsY0FBSSxDQUFDN0IsR0FBTCxFQUNFRSxtQkFBT2MsUUFBUCxDQUFnQlgsc0JBQUkyQixVQUFKLEdBQWlCLHFCQUFqQyxFQUF3RE4sUUFBeEQ7O0FBQ0Z4Qiw2QkFBT1UsR0FBUCxDQUFXLGlCQUFYOztBQUNBYixVQUFBQSxXQUFXLENBQUMyQixRQUFELEVBQVcsWUFBVztBQUMvQixtQkFBTzdCLEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBTztBQUFDVSxjQUFBQSxPQUFPLEVBQUM7QUFBVCxhQUFQLENBQUwsR0FBOEJULElBQUksQ0FBQ00sT0FBTCxDQUFhQyxzQkFBSUcsWUFBakIsQ0FBdkM7QUFDRCxXQUZVLENBQVg7QUFHRCxTQVZEO0FBV0EsZUFBTyxLQUFQO0FBQ0Q7O0FBQ0RULE1BQUFBLFdBQVcsQ0FBQyxJQUFELEVBQU8sWUFBVztBQUMzQixlQUFPRixFQUFFLEdBQUdBLEVBQUUsQ0FBQyxJQUFELEVBQU87QUFBQ1UsVUFBQUEsT0FBTyxFQUFDO0FBQVQsU0FBUCxDQUFMLEdBQThCVCxJQUFJLENBQUNNLE9BQUwsQ0FBYUMsc0JBQUlHLFlBQWpCLENBQXZDO0FBQ0QsT0FGVSxDQUFYO0FBR0QsS0FqQ0Q7QUFrQ0QsR0FqREQ7O0FBbURBZixFQUFBQSxHQUFHLENBQUNDLFNBQUosQ0FBY3VDLFFBQWQsR0FBeUIsVUFBU0MsTUFBVCxFQUFpQnJDLEVBQWpCLEVBQXFCO0FBQzVDLFFBQUlDLElBQUksR0FBRyxJQUFYOztBQUVBVyw4QkFBY3dCLFFBQWQsQ0FBdUJDLE1BQXZCLEVBQStCLFVBQVNsQyxHQUFULEVBQWNDLElBQWQsRUFBb0I7QUFDakQsVUFBSUQsR0FBSixFQUNFLE9BQU9ILEVBQUUsR0FBR0EsRUFBRSxDQUFDO0FBQUNVLFFBQUFBLE9BQU8sRUFBQyxLQUFUO0FBQWdCUCxRQUFBQSxHQUFHLEVBQUNBO0FBQXBCLE9BQUQsQ0FBTCxHQUFrQ0YsSUFBSSxDQUFDTSxPQUFMLENBQWFDLHNCQUFJQyxVQUFqQixDQUEzQztBQUVGLFVBQUlrQixNQUFNLEdBQUcsRUFBYjtBQUNBLFVBQUk1QixHQUFHLEdBQUdzQyxNQUFNLENBQUNDLEtBQVAsQ0FBYSxzQkFBYixFQUFxQyxDQUFyQyxDQUFWO0FBRUEsVUFBSXZDLEdBQUcsQ0FBQ2MsT0FBSixDQUFZLEdBQVosSUFBbUIsQ0FBQyxDQUF4QixFQUNFYyxNQUFNLEdBQUc1QixHQUFHLENBQUNtQixLQUFKLENBQVUsR0FBVixDQUFUO0FBRUYsVUFBSW5CLEdBQUcsQ0FBQ2MsT0FBSixDQUFZLEdBQVosSUFBbUIsQ0FBQyxDQUF4QixFQUNFYyxNQUFNLEdBQUc1QixHQUFHLENBQUNtQixLQUFKLENBQVUsR0FBVixDQUFUOztBQUVGLFVBQUlTLE1BQU0sSUFBSUEsTUFBTSxDQUFDQyxNQUFQLEdBQWdCLENBQTlCLEVBQWlDO0FBQy9CO0FBQ0EsWUFBSUMsUUFBUSxHQUFHRixNQUFNLENBQUMsQ0FBRCxDQUFyQjtBQUVBRyxRQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsZ0JBQVosR0FBK0IsTUFBL0I7QUFDQS9CLFFBQUFBLElBQUksQ0FBQ2dDLE9BQUwsQ0FBYUosUUFBYixFQUF1QjtBQUNyQkssVUFBQUEsU0FBUyxFQUFHO0FBRFMsU0FBdkIsRUFFRyxVQUFTL0IsR0FBVCxFQUFjQyxJQUFkLEVBQW9CO0FBQ3JCMEIsVUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlDLGdCQUFaLEdBQStCLE9BQS9CO0FBQ0EsY0FBSSxDQUFDN0IsR0FBTCxFQUNFRSxtQkFBT2MsUUFBUCxDQUFnQlgsc0JBQUkyQixVQUFKLEdBQWlCLHFCQUFqQyxFQUF3RE4sUUFBeEQ7QUFDRjNCLFVBQUFBLFdBQVcsQ0FBQzJCLFFBQUQsRUFBVyxZQUFXO0FBQy9CLG1CQUFPN0IsRUFBRSxHQUFHQSxFQUFFLENBQUMsSUFBRCxFQUFPO0FBQUNVLGNBQUFBLE9BQU8sRUFBQztBQUFULGFBQVAsQ0FBTCxHQUE4QlQsSUFBSSxDQUFDTSxPQUFMLENBQWFDLHNCQUFJRyxZQUFqQixDQUF2QztBQUNELFdBRlUsQ0FBWDtBQUdELFNBVEQ7QUFVQSxlQUFPLEtBQVA7QUFDRDs7QUFDRFQsTUFBQUEsV0FBVyxDQUFDMkIsUUFBRCxFQUFXLFlBQVc7QUFDL0IsZUFBTzdCLEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBTztBQUFDVSxVQUFBQSxPQUFPLEVBQUM7QUFBVCxTQUFQLENBQUwsR0FBOEJULElBQUksQ0FBQ00sT0FBTCxDQUFhQyxzQkFBSUcsWUFBakIsQ0FBdkM7QUFDRCxPQUZVLENBQVg7QUFHRCxLQWpDRDtBQWtDRCxHQXJDRDs7QUF1Q0FmLEVBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUFjMEMsS0FBZCxHQUFzQixVQUFTeEMsR0FBVCxFQUFjQyxFQUFkLEVBQWtCO0FBQ3RDLFFBQUlDLElBQUksR0FBRyxJQUFYOztBQUVBVyw4QkFBYzJCLEtBQWQsQ0FBb0J4QyxHQUFwQixFQUF5QixVQUFTSSxHQUFULEVBQWM7QUFDckMsVUFBSUEsR0FBSixFQUFTO0FBQ1AsZUFBT0gsRUFBRSxHQUFHQSxFQUFFLENBQUNLLG1CQUFPQyxNQUFQLENBQWNILEdBQWQsQ0FBRCxDQUFMLEdBQTRCRixJQUFJLENBQUNNLE9BQUwsQ0FBYUMsc0JBQUlDLFVBQWpCLENBQXJDO0FBQ0Q7O0FBRURQLE1BQUFBLFdBQVcsQ0FBQyxZQUFXO0FBQUVGLFFBQUFBLEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBTztBQUFDVSxVQUFBQSxPQUFPLEVBQUM7QUFBVCxTQUFQLENBQUwsR0FBOEJULElBQUksQ0FBQ00sT0FBTCxDQUFhQyxzQkFBSUcsWUFBakIsQ0FBaEM7QUFBZ0UsT0FBOUUsQ0FBWDtBQUNELEtBTkQ7QUFPRCxHQVZEOztBQVlBZixFQUFBQSxHQUFHLENBQUNDLFNBQUosQ0FBYzJDLElBQWQsR0FBcUIsVUFBU3pDLEdBQVQsRUFBYzBCLEtBQWQsRUFBcUJ6QixFQUFyQixFQUF5QjtBQUM1QyxRQUFJQyxJQUFJLEdBQUcsSUFBWDs7QUFFQSxRQUFJLE9BQU93QixLQUFQLEtBQWtCLFVBQXRCLEVBQWtDO0FBQ2hDekIsTUFBQUEsRUFBRSxHQUFHeUIsS0FBTDtBQUNBQSxNQUFBQSxLQUFLLEdBQUcsSUFBUjtBQUNELEtBTjJDLENBUTVDOzs7QUFDQSxRQUFJMUIsR0FBRyxJQUFJMEIsS0FBWCxFQUFrQjtBQUNoQnhCLE1BQUFBLElBQUksQ0FBQ3VCLEdBQUwsQ0FBU3pCLEdBQVQsRUFBYzBCLEtBQWQsRUFBcUIsVUFBU3RCLEdBQVQsRUFBYztBQUNqQyxZQUFJQSxHQUFKLEVBQ0UsT0FBT0gsRUFBRSxHQUFHQSxFQUFFLENBQUNLLG1CQUFPQyxNQUFQLENBQWNILEdBQWQsQ0FBRCxDQUFMLEdBQTRCRixJQUFJLENBQUNNLE9BQUwsQ0FBYUMsc0JBQUlDLFVBQWpCLENBQXJDO0FBQ0YsZUFBT1QsRUFBRSxHQUFHQSxFQUFFLENBQUMsSUFBRCxFQUFPO0FBQUNVLFVBQUFBLE9BQU8sRUFBQztBQUFULFNBQVAsQ0FBTCxHQUE4QlQsSUFBSSxDQUFDTSxPQUFMLENBQWFDLHNCQUFJRyxZQUFqQixDQUF2QztBQUNELE9BSkQ7QUFLRCxLQU5ELENBT0E7QUFQQSxTQVFLLElBQUlaLEdBQUosRUFBUztBQUNaRSxRQUFBQSxJQUFJLENBQUNILEdBQUwsQ0FBU0MsR0FBVCxFQUFjLFVBQVNJLEdBQVQsRUFBY0MsSUFBZCxFQUFvQjtBQUNoQyxjQUFJRCxHQUFKLEVBQ0UsT0FBT0gsRUFBRSxHQUFHQSxFQUFFLENBQUNLLG1CQUFPQyxNQUFQLENBQWNILEdBQWQsQ0FBRCxDQUFMLEdBQTRCRixJQUFJLENBQUNNLE9BQUwsQ0FBYUMsc0JBQUlDLFVBQWpCLENBQXJDO0FBQ0YsaUJBQU9ULEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBTztBQUFDVSxZQUFBQSxPQUFPLEVBQUM7QUFBVCxXQUFQLENBQUwsR0FBOEJULElBQUksQ0FBQ00sT0FBTCxDQUFhQyxzQkFBSUcsWUFBakIsQ0FBdkM7QUFDRCxTQUpEO0FBS0QsT0FOSSxNQU9BO0FBQ0hlLFFBQUFBLHFCQUFxQixDQUFDLFVBQVN2QixHQUFULEVBQWM7QUFDbEMsY0FBSUEsR0FBSixFQUNFLE9BQU9ILEVBQUUsR0FBR0EsRUFBRSxDQUFDSyxtQkFBT0MsTUFBUCxDQUFjSCxHQUFkLENBQUQsQ0FBTCxHQUE0QkYsSUFBSSxDQUFDTSxPQUFMLENBQWFDLHNCQUFJQyxVQUFqQixDQUFyQztBQUNGLGlCQUFPVCxFQUFFLEdBQUdBLEVBQUUsQ0FBQyxJQUFELEVBQU87QUFBQ1UsWUFBQUEsT0FBTyxFQUFDO0FBQVQsV0FBUCxDQUFMLEdBQThCVCxJQUFJLENBQUNNLE9BQUwsQ0FBYUMsc0JBQUlHLFlBQWpCLENBQXZDO0FBQ0QsU0FKb0IsQ0FBckI7QUFLRDtBQUNGLEdBL0JEO0FBaUNEOztBQUFBOztBQUVELFNBQVNlLHFCQUFULENBQStCMUIsRUFBL0IsRUFBbUM7QUFDakN5QyxpQkFBR0MsT0FBSCxDQUFXQyxVQUFYLENBQXNCbkMsc0JBQUlvQyxvQkFBMUIsRUFBZ0QsVUFBU3pDLEdBQVQsRUFBY0MsSUFBZCxFQUFvQjtBQUNsRUMsdUJBQU9jLFFBQVAsQ0FBZ0JDLGtCQUFNRSxJQUFOLENBQVcsbUNBQVgsQ0FBaEIsRUFBaUVkLHNCQUFJb0Msb0JBQXJFOztBQUNBdkMsdUJBQU9jLFFBQVAsQ0FBZ0JDLGtCQUFNRSxJQUFOLENBQVcsOERBQVgsQ0FBaEIsRUFBNEZkLHNCQUFJb0Msb0JBQWhHOztBQUNBLFFBQUl6QyxHQUFKLEVBQ0UsT0FBT0gsRUFBRSxDQUFDSyxtQkFBT0MsTUFBUCxDQUFjSCxHQUFkLENBQUQsQ0FBVDtBQUNGLFdBQU9ILEVBQUUsQ0FBQyxJQUFELEVBQU87QUFBQ1UsTUFBQUEsT0FBTyxFQUFDO0FBQVQsS0FBUCxDQUFUO0FBQ0QsR0FORDtBQVFEO0FBRUQ7Ozs7O0FBR0EsU0FBU1IsV0FBVCxDQUFxQjJDLFVBQXJCLEVBQWlDN0MsRUFBakMsRUFBc0M7QUFDcEMsTUFBSSxPQUFPNkMsVUFBUCxJQUFzQixVQUExQixFQUFzQztBQUNwQzdDLElBQUFBLEVBQUUsR0FBRzZDLFVBQUw7QUFDQUEsSUFBQUEsVUFBVSxHQUFHLElBQWI7QUFDRDs7QUFFRGpDLDRCQUFja0MsTUFBZCxDQUFxQixVQUFTM0MsR0FBVCxFQUFjQyxJQUFkLEVBQW9CO0FBQ3ZDcUMsbUJBQUdDLE9BQUgsQ0FBV0ssUUFBWCxDQUFvQjNDLElBQXBCLEVBQTBCeUMsVUFBMUI7O0FBQ0EsV0FBTzdDLEVBQUUsRUFBVDtBQUNELEdBSEQ7QUFJRCIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IENvbW1vbiAgICAgICAgICAgICAgIGZyb20gJy4uL0NvbW1vbic7XG5pbXBvcnQgY3N0ICAgICAgICAgICAgICAgICAgZnJvbSAnLi4vLi4vY29uc3RhbnRzJztcbmltcG9ydCBVWCAgICAgICAgICAgICAgICAgICBmcm9tICcuL1VYJztcbmltcG9ydCBjaGFsayAgICAgICAgICAgICAgICBmcm9tICdjaGFsayc7XG5pbXBvcnQgQ29uZmlndXJhdGlvbiAgICAgICAgZnJvbSAnLi4vQ29uZmlndXJhdGlvbic7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKENMSSkge1xuXG4gIENMSS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oa2V5LCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmICgha2V5IHx8IGtleSA9PSAnYWxsJykge1xuICAgICAgZGlzcGxheUNvbmYoZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOnRydWV9KSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBDb25maWd1cmF0aW9uLmdldChrZXksIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICAgIC8vIHBtMiBjb25mIG1vZHVsZS1uYW1lXG4gICAgICBpZiAoa2V5LmluZGV4T2YoJzonKSA9PT0gLTEgJiYga2V5LmluZGV4T2YoJy4nKSA9PT0gLTEpIHtcbiAgICAgICAgZGlzcGxheUNvbmYoa2V5LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTW9kdWxlcyBjb25maWd1cmF0aW9uLiBDb3B5L1Bhc3RlIGxpbmUgdG8gZWRpdCB2YWx1ZXMuJylcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCB7c3VjY2Vzczp0cnVlfSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVClcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIHBtMiBjb25mIG1vZHVsZS1uYW1lOmtleVxuICAgICAgdmFyIG1vZHVsZV9uYW1lLCBrZXlfbmFtZTtcblxuICAgICAgaWYgKGtleS5pbmRleE9mKCc6JykgPiAtMSkge1xuICAgICAgICBtb2R1bGVfbmFtZSA9IGtleS5zcGxpdCgnOicpWzBdO1xuICAgICAgICBrZXlfbmFtZSAgICA9IGtleS5zcGxpdCgnOicpWzFdO1xuICAgICAgfSBlbHNlIGlmIChrZXkuaW5kZXhPZignLicpID4gLTEpIHtcbiAgICAgICAgbW9kdWxlX25hbWUgPSBrZXkuc3BsaXQoJy4nKVswXTtcbiAgICAgICAga2V5X25hbWUgICAgPSBrZXkuc3BsaXQoJy4nKVsxXTtcbiAgICAgIH1cblxuICAgICAgQ29tbW9uLnByaW50T3V0KCdWYWx1ZSBmb3IgbW9kdWxlICcgKyBjaGFsay5ibHVlKG1vZHVsZV9uYW1lKSwgJ2tleSAnICsgY2hhbGsuYmx1ZShrZXlfbmFtZSkgKyAnOiAnICsgY2hhbGsuYm9sZC5ncmVlbihkYXRhKSk7XG5cblxuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwge3N1Y2Nlc3M6dHJ1ZX0pIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH0pO1xuICB9O1xuXG4gIENMSS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAoIWtleSkge1xuICAgICAgaW50ZXJhY3RpdmVDb25maWdFZGl0KGZ1bmN0aW9uKGVycikge1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCB7c3VjY2Vzczp0cnVlfSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdmFsdWVcbiAgICAgKi9cbiAgICBDb25maWd1cmF0aW9uLnNldChrZXksIHZhbHVlLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgIGlmIChlcnIpXG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuXG4gICAgICB2YXIgdmFsdWVzID0gW107XG5cbiAgICAgIGlmIChrZXkuaW5kZXhPZignLicpID4gLTEpXG4gICAgICAgIHZhbHVlcyA9IGtleS5zcGxpdCgnLicpO1xuXG4gICAgICBpZiAoa2V5LmluZGV4T2YoJzonKSA+IC0xKVxuICAgICAgICB2YWx1ZXMgPSBrZXkuc3BsaXQoJzonKTtcblxuICAgICAgaWYgKHZhbHVlcyAmJiB2YWx1ZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAvLyBUaGUgZmlyc3QgZWxlbWVudCBpcyB0aGUgYXBwIG5hbWUgKG1vZHVsZV9jb25mLmpzb24pXG4gICAgICAgIHZhciBhcHBfbmFtZSA9IHZhbHVlc1swXTtcblxuICAgICAgICBwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID0gJ3RydWUnO1xuICAgICAgICB0aGF0LnJlc3RhcnQoYXBwX25hbWUsIHtcbiAgICAgICAgICB1cGRhdGVFbnYgOiB0cnVlXG4gICAgICAgIH0sIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICAgIHByb2Nlc3MuZW52LlBNMl9QUk9HUkFNTUFUSUMgPSAnZmFsc2UnO1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ01vZHVsZSAlcyByZXN0YXJ0ZWQnLCBhcHBfbmFtZSk7XG4gICAgICAgICAgQ29tbW9uLmxvZygnU2V0dGluZyBjaGFuZ2VkJylcbiAgICAgICAgICBkaXNwbGF5Q29uZihhcHBfbmFtZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCB7c3VjY2Vzczp0cnVlfSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBkaXNwbGF5Q29uZihudWxsLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwge3N1Y2Nlc3M6dHJ1ZX0pIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgQ0xJLnByb3RvdHlwZS5tdWx0aXNldCA9IGZ1bmN0aW9uKHNlcmlhbCwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBDb25maWd1cmF0aW9uLm11bHRpc2V0KHNlcmlhbCwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICBpZiAoZXJyKVxuICAgICAgICByZXR1cm4gY2IgPyBjYih7c3VjY2VzczpmYWxzZSwgZXJyOmVycn0pIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcblxuICAgICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgICAgdmFyIGtleSA9IHNlcmlhbC5tYXRjaCgvKD86W14gXCJdK3xcIlteXCJdKlwiKSsvZylbMF07XG5cbiAgICAgIGlmIChrZXkuaW5kZXhPZignLicpID4gLTEpXG4gICAgICAgIHZhbHVlcyA9IGtleS5zcGxpdCgnLicpO1xuXG4gICAgICBpZiAoa2V5LmluZGV4T2YoJzonKSA+IC0xKVxuICAgICAgICB2YWx1ZXMgPSBrZXkuc3BsaXQoJzonKTtcblxuICAgICAgaWYgKHZhbHVlcyAmJiB2YWx1ZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAvLyBUaGUgZmlyc3QgZWxlbWVudCBpcyB0aGUgYXBwIG5hbWUgKG1vZHVsZV9jb25mLmpzb24pXG4gICAgICAgIHZhciBhcHBfbmFtZSA9IHZhbHVlc1swXTtcblxuICAgICAgICBwcm9jZXNzLmVudi5QTTJfUFJPR1JBTU1BVElDID0gJ3RydWUnO1xuICAgICAgICB0aGF0LnJlc3RhcnQoYXBwX25hbWUsIHtcbiAgICAgICAgICB1cGRhdGVFbnYgOiB0cnVlXG4gICAgICAgIH0sIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICAgIHByb2Nlc3MuZW52LlBNMl9QUk9HUkFNTUFUSUMgPSAnZmFsc2UnO1xuICAgICAgICAgIGlmICghZXJyKVxuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KGNzdC5QUkVGSVhfTVNHICsgJ01vZHVsZSAlcyByZXN0YXJ0ZWQnLCBhcHBfbmFtZSk7XG4gICAgICAgICAgZGlzcGxheUNvbmYoYXBwX25hbWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwge3N1Y2Nlc3M6dHJ1ZX0pIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBkaXNwbGF5Q29uZihhcHBfbmFtZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOnRydWV9KSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgQ0xJLnByb3RvdHlwZS51bnNldCA9IGZ1bmN0aW9uKGtleSwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBDb25maWd1cmF0aW9uLnVuc2V0KGtleSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuXG4gICAgICBkaXNwbGF5Q29uZihmdW5jdGlvbigpIHsgY2IgPyBjYihudWxsLCB7c3VjY2Vzczp0cnVlfSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCkgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgQ0xJLnByb3RvdHlwZS5jb25mID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSwgY2IpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mKHZhbHVlKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2IgPSB2YWx1ZTtcbiAgICAgIHZhbHVlID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBJZiBrZXkgKyB2YWx1ZSA9IHNldFxuICAgIGlmIChrZXkgJiYgdmFsdWUpIHtcbiAgICAgIHRoYXQuc2V0KGtleSwgdmFsdWUsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgIHJldHVybiBjYiA/IGNiKENvbW1vbi5yZXRFcnIoZXJyKSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICByZXR1cm4gY2IgPyBjYihudWxsLCB7c3VjY2Vzczp0cnVlfSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gSWYgb25seSBrZXkgPSBnZXRcbiAgICBlbHNlIGlmIChrZXkpIHtcbiAgICAgIHRoYXQuZ2V0KGtleSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgcmV0dXJuIGNiID8gY2IoQ29tbW9uLnJldEVycihlcnIpKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKG51bGwsIHtzdWNjZXNzOnRydWV9KSA6IHRoYXQuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGludGVyYWN0aXZlQ29uZmlnRWRpdChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycilcbiAgICAgICAgICByZXR1cm4gY2IgPyBjYihDb21tb24ucmV0RXJyKGVycikpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwge3N1Y2Nlc3M6dHJ1ZX0pIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG59O1xuXG5mdW5jdGlvbiBpbnRlcmFjdGl2ZUNvbmZpZ0VkaXQoY2IpIHtcbiAgVVguaGVscGVycy5vcGVuRWRpdG9yKGNzdC5QTTJfTU9EVUxFX0NPTkZfRklMRSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgQ29tbW9uLnByaW50T3V0KGNoYWxrLmJvbGQoJ01vZHVsZSBjb25maWd1cmF0aW9uICglcykgZWRpdGVkLicpLCBjc3QuUE0yX01PRFVMRV9DT05GX0ZJTEUpO1xuICAgIENvbW1vbi5wcmludE91dChjaGFsay5ib2xkKCdUbyB0YWtlIGNoYW5nZXMgaW50byBhY2NvdW50LCBwbGVhc2UgcmVzdGFydCBtb2R1bGUgcmVsYXRlZC4nKSwgY3N0LlBNMl9NT0RVTEVfQ09ORl9GSUxFKTtcbiAgICBpZiAoZXJyKVxuICAgICAgcmV0dXJuIGNiKENvbW1vbi5yZXRFcnIoZXJyKSk7XG4gICAgcmV0dXJuIGNiKG51bGwsIHtzdWNjZXNzOnRydWV9KTtcbiAgfSk7XG5cbn1cblxuLyoqXG4gKiBDb25maWd1cmF0aW9uXG4gKi9cbmZ1bmN0aW9uIGRpc3BsYXlDb25mKHRhcmdldF9hcHAsIGNiPykge1xuICBpZiAodHlwZW9mKHRhcmdldF9hcHApID09ICdmdW5jdGlvbicpIHtcbiAgICBjYiA9IHRhcmdldF9hcHA7XG4gICAgdGFyZ2V0X2FwcCA9IG51bGw7XG4gIH1cblxuICBDb25maWd1cmF0aW9uLmdldEFsbChmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICBVWC5oZWxwZXJzLmRpc3BLZXlzKGRhdGEsIHRhcmdldF9hcHApO1xuICAgIHJldHVybiBjYigpO1xuICB9KTtcbn1cbiJdfQ==