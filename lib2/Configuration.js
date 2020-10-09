"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _Common = _interopRequireDefault(require("./Common"));

var _eachSeries = _interopRequireDefault(require("async/eachSeries"));

var _constants = _interopRequireDefault(require("../constants.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var Configuration = {};

function splitKey(key) {
  var values = [key];
  if (key.indexOf('.') > -1) values = key.match(/(?:[^."]+|"[^"]*")+/g).map(function (dt) {
    return dt.replace(/"/g, '');
  });else if (key.indexOf(':') > -1) values = key.match(/(?:[^:"]+|"[^"]*")+/g).map(function (dt) {
    return dt.replace(/"/g, '');
  });
  return values;
}

function serializeConfiguration(json_conf) {
  return JSON.stringify(json_conf, null, 4);
}

Configuration.set = function (key, value, cb) {
  _fs["default"].readFile(_constants["default"].PM2_MODULE_CONF_FILE, "utf8", function (err, data) {
    if (err) return cb(err);
    var json_conf = JSON.parse(data);
    var values = splitKey(key);

    if (values.length > 0) {
      var levels = values;
      var tmp = json_conf;
      levels.forEach(function (key, index) {
        if (index == levels.length - 1) tmp[key] = value;else if (!tmp[key]) {
          tmp[key] = {};
          tmp = tmp[key];
        } else {
          if (_typeof(tmp[key]) != 'object') tmp[key] = {};
          tmp = tmp[key];
        }
      });
    } else {
      if (json_conf[key] && typeof json_conf[key] === 'string') _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Replacing current value key %s by %s', key, value);
      json_conf[key] = value;
    }

    _fs["default"].writeFile(_constants["default"].PM2_MODULE_CONF_FILE, serializeConfiguration(json_conf), function (err) {
      if (err) return cb(err);
      return cb(null, json_conf);
    });

    return false;
  });
};

Configuration.unset = function (key, cb) {
  _fs["default"].readFile(_constants["default"].PM2_MODULE_CONF_FILE, "utf8", function (err, data) {
    if (err) return cb(err);
    var json_conf = JSON.parse(data);
    var values = splitKey(key);

    if (values.length > 0) {
      var levels = values;
      var tmp = json_conf;
      levels.forEach(function (key, index) {
        if (index == levels.length - 1) delete tmp[key];else if (!tmp[key]) {
          tmp[key] = {};
          tmp = tmp[key];
        } else {
          if (_typeof(tmp[key]) != 'object') tmp[key] = {};
          tmp = tmp[key];
        }
      });
    } else delete json_conf[key];

    if (err) return cb(err);
    if (key === 'all') json_conf = {};

    _fs["default"].writeFile(_constants["default"].PM2_MODULE_CONF_FILE, serializeConfiguration(json_conf), function (err) {
      if (err) return cb(err);
      return cb(null, json_conf);
    });

    return false;
  });
};

Configuration.setSyncIfNotExist = function (key, value) {
  try {
    var conf = JSON.parse(_fs["default"].readFileSync(_constants["default"].PM2_MODULE_CONF_FILE, "utf8"));
  } catch (e) {
    return null;
  }

  var values = splitKey(key);
  var exists = false;

  if (values.length > 1 && conf && conf[values[0]]) {
    exists = Object.keys(conf[values[0]]).some(function (key) {
      if (key == values[1]) return true;
      return false;
    });
  }

  if (exists === false) return Configuration.setSync(key, value);
  return null;
};

Configuration.setSync = function (key, value) {
  try {
    var data = _fs["default"].readFileSync(_constants["default"].PM2_MODULE_CONF_FILE, "utf8");
  } catch (e) {
    return null;
  }

  var json_conf = JSON.parse(data);
  var values = splitKey(key);

  if (values.length > 0) {
    var levels = values;
    var tmp = json_conf;
    levels.forEach(function (key, index) {
      if (index == levels.length - 1) tmp[key] = value;else if (!tmp[key]) {
        tmp[key] = {};
        tmp = tmp[key];
      } else {
        if (_typeof(tmp[key]) != 'object') tmp[key] = {};
        tmp = tmp[key];
      }
    });
  } else {
    if (json_conf[key] && typeof json_conf[key] === 'string') _Common["default"].printOut(_constants["default"].PREFIX_MSG + 'Replacing current value key %s by %s', key, value);
    json_conf[key] = value;
  }

  if (key === 'all') json_conf = {};

  try {
    _fs["default"].writeFileSync(_constants["default"].PM2_MODULE_CONF_FILE, serializeConfiguration(json_conf));

    return json_conf;
  } catch (e) {
    console.error(e.message);
    return null;
  }
};

Configuration.unsetSync = function (key) {
  try {
    var data = _fs["default"].readFileSync(_constants["default"].PM2_MODULE_CONF_FILE, "utf8");
  } catch (e) {
    return null;
  }

  var json_conf = JSON.parse(data);
  var values = splitKey(key);

  if (values.length > 0) {
    var levels = values;
    var tmp = json_conf;
    levels.forEach(function (key, index) {
      if (index == levels.length - 1) delete tmp[key];else if (!tmp[key]) {
        tmp[key] = {};
        tmp = tmp[key];
      } else {
        if (_typeof(tmp[key]) != 'object') tmp[key] = {};
        tmp = tmp[key];
      }
    });
  } else delete json_conf[key];

  if (key === 'all') json_conf = {};

  try {
    _fs["default"].writeFileSync(_constants["default"].PM2_MODULE_CONF_FILE, serializeConfiguration(json_conf));
  } catch (e) {
    console.error(e.message);
    return null;
  }
};

Configuration.multiset = function (serial, cb) {
  var arrays = [];
  serial = serial.match(/(?:[^ "]+|"[^"]*")+/g);

  while (serial.length > 0) {
    arrays.push(serial.splice(0, 2));
  }

  (0, _eachSeries["default"])(arrays, function (el, next) {
    Configuration.set(el[0], el[1], next);
  }, cb);
};

Configuration.get = function (key, cb) {
  Configuration.getAll(function (err, data) {
    var climb = splitKey(key);
    climb.some(function (val) {
      if (!data[val]) {
        data = null;
        return true;
      }

      data = data[val];
      return false;
    });
    if (!data) return cb({
      err: 'Unknown key'
    }, null);
    return cb(null, data);
  });
};

Configuration.getSync = function (key) {
  try {
    var data = Configuration.getAllSync();
  } catch (e) {
    return null;
  }

  var climb = splitKey(key);
  climb.some(function (val) {
    if (!data[val]) {
      data = null;
      return true;
    }

    data = data[val];
    return false;
  });
  if (!data) return null;
  return data;
};

Configuration.getAll = function (cb) {
  _fs["default"].readFile(_constants["default"].PM2_MODULE_CONF_FILE, "utf8", function (err, data) {
    if (err) return cb(err);
    return cb(null, JSON.parse(data));
  });
};

Configuration.getAllSync = function () {
  try {
    return JSON.parse(_fs["default"].readFileSync(_constants["default"].PM2_MODULE_CONF_FILE, "utf8"));
  } catch (e) {
    console.error(e.stack || e);
    return {};
  }
};

var _default = Configuration;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Db25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbIkNvbmZpZ3VyYXRpb24iLCJzcGxpdEtleSIsImtleSIsInZhbHVlcyIsImluZGV4T2YiLCJtYXRjaCIsIm1hcCIsImR0IiwicmVwbGFjZSIsInNlcmlhbGl6ZUNvbmZpZ3VyYXRpb24iLCJqc29uX2NvbmYiLCJKU09OIiwic3RyaW5naWZ5Iiwic2V0IiwidmFsdWUiLCJjYiIsImZzIiwicmVhZEZpbGUiLCJjc3QiLCJQTTJfTU9EVUxFX0NPTkZfRklMRSIsImVyciIsImRhdGEiLCJwYXJzZSIsImxlbmd0aCIsImxldmVscyIsInRtcCIsImZvckVhY2giLCJpbmRleCIsIkNvbW1vbiIsInByaW50T3V0IiwiUFJFRklYX01TRyIsIndyaXRlRmlsZSIsInVuc2V0Iiwic2V0U3luY0lmTm90RXhpc3QiLCJjb25mIiwicmVhZEZpbGVTeW5jIiwiZSIsImV4aXN0cyIsIk9iamVjdCIsImtleXMiLCJzb21lIiwic2V0U3luYyIsIndyaXRlRmlsZVN5bmMiLCJjb25zb2xlIiwiZXJyb3IiLCJtZXNzYWdlIiwidW5zZXRTeW5jIiwibXVsdGlzZXQiLCJzZXJpYWwiLCJhcnJheXMiLCJwdXNoIiwic3BsaWNlIiwiZWwiLCJuZXh0IiwiZ2V0IiwiZ2V0QWxsIiwiY2xpbWIiLCJ2YWwiLCJnZXRTeW5jIiwiZ2V0QWxsU3luYyIsInN0YWNrIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBS0E7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVBLElBQUlBLGFBQWtCLEdBQUcsRUFBekI7O0FBRUEsU0FBU0MsUUFBVCxDQUFrQkMsR0FBbEIsRUFBdUI7QUFDckIsTUFBSUMsTUFBTSxHQUFHLENBQUNELEdBQUQsQ0FBYjtBQUVBLE1BQUlBLEdBQUcsQ0FBQ0UsT0FBSixDQUFZLEdBQVosSUFBbUIsQ0FBQyxDQUF4QixFQUNFRCxNQUFNLEdBQUdELEdBQUcsQ0FBQ0csS0FBSixDQUFVLHNCQUFWLEVBQWtDQyxHQUFsQyxD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R0FGRCxDQUVFLE9BQU9pQixDQUFQLEVBQVU7QUFDVk8sSUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNSLENBQUMsQ0FBQ3dCLEtBQUYsSUFBV3hCLENBQXpCO0FBQ0EsV0FBTyxFQUFQO0FBQ0Q7QUFDRixDQVBEOztlQVNlcEMsYSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcclxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXHJcbiAqL1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5cclxuaW1wb3J0IENvbW1vbiBmcm9tICcuL0NvbW1vbic7XHJcbmltcG9ydCBlYWNoU2VyaWVzIGZyb20gJ2FzeW5jL2VhY2hTZXJpZXMnO1xyXG5pbXBvcnQgY3N0IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XHJcblxyXG52YXIgQ29uZmlndXJhdGlvbjogYW55ID0ge307XHJcblxyXG5mdW5jdGlvbiBzcGxpdEtleShrZXkpIHtcclxuICB2YXIgdmFsdWVzID0gW2tleV07XHJcblxyXG4gIGlmIChrZXkuaW5kZXhPZignLicpID4gLTEpXHJcbiAgICB2YWx1ZXMgPSBrZXkubWF0Y2goLyg/OlteLlwiXSt8XCJbXlwiXSpcIikrL2cpLm1hcChmdW5jdGlvbiAoZHQpIHsgcmV0dXJuIGR0LnJlcGxhY2UoL1wiL2csICcnKSB9KTtcclxuICBlbHNlIGlmIChrZXkuaW5kZXhPZignOicpID4gLTEpXHJcbiAgICB2YWx1ZXMgPSBrZXkubWF0Y2goLyg/OlteOlwiXSt8XCJbXlwiXSpcIikrL2cpLm1hcChmdW5jdGlvbiAoZHQpIHsgcmV0dXJuIGR0LnJlcGxhY2UoL1wiL2csICcnKSB9KTtcclxuXHJcbiAgcmV0dXJuIHZhbHVlcztcclxufVxyXG5cclxuZnVuY3Rpb24gc2VyaWFsaXplQ29uZmlndXJhdGlvbihqc29uX2NvbmYpIHtcclxuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoanNvbl9jb25mLCBudWxsLCA0KVxyXG59XHJcblxyXG5Db25maWd1cmF0aW9uLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBjYikge1xyXG4gIGZzLnJlYWRGaWxlKGNzdC5QTTJfTU9EVUxFX0NPTkZfRklMRSwgXCJ1dGY4XCIsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcclxuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xyXG5cclxuICAgIHZhciBqc29uX2NvbmYgPSBKU09OLnBhcnNlKGRhdGEpO1xyXG5cclxuICAgIHZhciB2YWx1ZXMgPSBzcGxpdEtleShrZXkpO1xyXG5cclxuICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICB2YXIgbGV2ZWxzID0gdmFsdWVzO1xyXG5cclxuICAgICAgdmFyIHRtcCA9IGpzb25fY29uZjtcclxuXHJcbiAgICAgIGxldmVscy5mb3JFYWNoKGZ1bmN0aW9uIChrZXksIGluZGV4KSB7XHJcbiAgICAgICAgaWYgKGluZGV4ID09IGxldmVscy5sZW5ndGggLSAxKVxyXG4gICAgICAgICAgdG1wW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICBlbHNlIGlmICghdG1wW2tleV0pIHtcclxuICAgICAgICAgIHRtcFtrZXldID0ge307XHJcbiAgICAgICAgICB0bXAgPSB0bXBba2V5XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBpZiAodHlwZW9mICh0bXBba2V5XSkgIT0gJ29iamVjdCcpXHJcbiAgICAgICAgICAgIHRtcFtrZXldID0ge307XHJcbiAgICAgICAgICB0bXAgPSB0bXBba2V5XTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAoanNvbl9jb25mW2tleV0gJiYgdHlwZW9mIChqc29uX2NvbmZba2V5XSkgPT09ICdzdHJpbmcnKVxyXG4gICAgICAgIENvbW1vbi5wcmludE91dChjc3QuUFJFRklYX01TRyArICdSZXBsYWNpbmcgY3VycmVudCB2YWx1ZSBrZXkgJXMgYnkgJXMnLCBrZXksIHZhbHVlKTtcclxuXHJcbiAgICAgIGpzb25fY29uZltrZXldID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgZnMud3JpdGVGaWxlKGNzdC5QTTJfTU9EVUxFX0NPTkZfRklMRSwgc2VyaWFsaXplQ29uZmlndXJhdGlvbihqc29uX2NvbmYpLCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xyXG5cclxuICAgICAgcmV0dXJuIGNiKG51bGwsIGpzb25fY29uZik7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufTtcclxuXHJcbkNvbmZpZ3VyYXRpb24udW5zZXQgPSBmdW5jdGlvbiAoa2V5LCBjYikge1xyXG4gIGZzLnJlYWRGaWxlKGNzdC5QTTJfTU9EVUxFX0NPTkZfRklMRSwgXCJ1dGY4XCIsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcclxuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xyXG5cclxuICAgIHZhciBqc29uX2NvbmYgPSBKU09OLnBhcnNlKGRhdGEpO1xyXG5cclxuICAgIHZhciB2YWx1ZXMgPSBzcGxpdEtleShrZXkpO1xyXG5cclxuICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICB2YXIgbGV2ZWxzID0gdmFsdWVzO1xyXG5cclxuICAgICAgdmFyIHRtcCA9IGpzb25fY29uZjtcclxuXHJcbiAgICAgIGxldmVscy5mb3JFYWNoKGZ1bmN0aW9uIChrZXksIGluZGV4KSB7XHJcbiAgICAgICAgaWYgKGluZGV4ID09IGxldmVscy5sZW5ndGggLSAxKVxyXG4gICAgICAgICAgZGVsZXRlIHRtcFtrZXldO1xyXG4gICAgICAgIGVsc2UgaWYgKCF0bXBba2V5XSkge1xyXG4gICAgICAgICAgdG1wW2tleV0gPSB7fTtcclxuICAgICAgICAgIHRtcCA9IHRtcFtrZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGlmICh0eXBlb2YgKHRtcFtrZXldKSAhPSAnb2JqZWN0JylcclxuICAgICAgICAgICAgdG1wW2tleV0gPSB7fTtcclxuICAgICAgICAgIHRtcCA9IHRtcFtrZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAgICBkZWxldGUganNvbl9jb25mW2tleV07XHJcblxyXG4gICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XHJcblxyXG4gICAgaWYgKGtleSA9PT0gJ2FsbCcpXHJcbiAgICAgIGpzb25fY29uZiA9IHt9O1xyXG5cclxuICAgIGZzLndyaXRlRmlsZShjc3QuUE0yX01PRFVMRV9DT05GX0ZJTEUsIHNlcmlhbGl6ZUNvbmZpZ3VyYXRpb24oanNvbl9jb25mKSwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcclxuXHJcbiAgICAgIHJldHVybiBjYihudWxsLCBqc29uX2NvbmYpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcbn1cclxuXHJcbkNvbmZpZ3VyYXRpb24uc2V0U3luY0lmTm90RXhpc3QgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xyXG4gIHRyeSB7XHJcbiAgICB2YXIgY29uZiA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGNzdC5QTTJfTU9EVUxFX0NPTkZfRklMRSwgXCJ1dGY4XCIpKTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIHZhciB2YWx1ZXMgPSBzcGxpdEtleShrZXkpO1xyXG4gIHZhciBleGlzdHMgPSBmYWxzZTtcclxuXHJcbiAgaWYgKHZhbHVlcy5sZW5ndGggPiAxICYmIGNvbmYgJiYgY29uZlt2YWx1ZXNbMF1dKSB7XHJcbiAgICBleGlzdHMgPSBPYmplY3Qua2V5cyhjb25mW3ZhbHVlc1swXV0pLnNvbWUoZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICBpZiAoa2V5ID09IHZhbHVlc1sxXSlcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBpZiAoZXhpc3RzID09PSBmYWxzZSlcclxuICAgIHJldHVybiBDb25maWd1cmF0aW9uLnNldFN5bmMoa2V5LCB2YWx1ZSk7XHJcblxyXG4gIHJldHVybiBudWxsO1xyXG59O1xyXG5cclxuQ29uZmlndXJhdGlvbi5zZXRTeW5jID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcclxuICB0cnkge1xyXG4gICAgdmFyIGRhdGEgPSBmcy5yZWFkRmlsZVN5bmMoY3N0LlBNMl9NT0RVTEVfQ09ORl9GSUxFLCBcInV0ZjhcIik7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICB2YXIganNvbl9jb25mID0gSlNPTi5wYXJzZShkYXRhKTtcclxuXHJcbiAgdmFyIHZhbHVlcyA9IHNwbGl0S2V5KGtleSk7XHJcblxyXG4gIGlmICh2YWx1ZXMubGVuZ3RoID4gMCkge1xyXG4gICAgdmFyIGxldmVscyA9IHZhbHVlcztcclxuXHJcbiAgICB2YXIgdG1wID0ganNvbl9jb25mO1xyXG5cclxuICAgIGxldmVscy5mb3JFYWNoKGZ1bmN0aW9uIChrZXksIGluZGV4KSB7XHJcbiAgICAgIGlmIChpbmRleCA9PSBsZXZlbHMubGVuZ3RoIC0gMSlcclxuICAgICAgICB0bXBba2V5XSA9IHZhbHVlO1xyXG4gICAgICBlbHNlIGlmICghdG1wW2tleV0pIHtcclxuICAgICAgICB0bXBba2V5XSA9IHt9O1xyXG4gICAgICAgIHRtcCA9IHRtcFtrZXldO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGlmICh0eXBlb2YgKHRtcFtrZXldKSAhPSAnb2JqZWN0JylcclxuICAgICAgICAgIHRtcFtrZXldID0ge307XHJcbiAgICAgICAgdG1wID0gdG1wW2tleV07XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBpZiAoanNvbl9jb25mW2tleV0gJiYgdHlwZW9mIChqc29uX2NvbmZba2V5XSkgPT09ICdzdHJpbmcnKVxyXG4gICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnUmVwbGFjaW5nIGN1cnJlbnQgdmFsdWUga2V5ICVzIGJ5ICVzJywga2V5LCB2YWx1ZSk7XHJcblxyXG4gICAganNvbl9jb25mW2tleV0gPSB2YWx1ZTtcclxuICB9XHJcblxyXG4gIGlmIChrZXkgPT09ICdhbGwnKVxyXG4gICAganNvbl9jb25mID0ge307XHJcblxyXG4gIHRyeSB7XHJcbiAgICBmcy53cml0ZUZpbGVTeW5jKGNzdC5QTTJfTU9EVUxFX0NPTkZfRklMRSwgc2VyaWFsaXplQ29uZmlndXJhdGlvbihqc29uX2NvbmYpKTtcclxuICAgIHJldHVybiBqc29uX2NvbmY7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG59O1xyXG5cclxuQ29uZmlndXJhdGlvbi51bnNldFN5bmMgPSBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgdHJ5IHtcclxuICAgIHZhciBkYXRhID0gZnMucmVhZEZpbGVTeW5jKGNzdC5QTTJfTU9EVUxFX0NPTkZfRklMRSwgXCJ1dGY4XCIpO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgdmFyIGpzb25fY29uZiA9IEpTT04ucGFyc2UoZGF0YSk7XHJcblxyXG4gIHZhciB2YWx1ZXMgPSBzcGxpdEtleShrZXkpO1xyXG5cclxuICBpZiAodmFsdWVzLmxlbmd0aCA+IDApIHtcclxuICAgIHZhciBsZXZlbHMgPSB2YWx1ZXM7XHJcblxyXG4gICAgdmFyIHRtcCA9IGpzb25fY29uZjtcclxuXHJcbiAgICBsZXZlbHMuZm9yRWFjaChmdW5jdGlvbiAoa2V5LCBpbmRleCkge1xyXG4gICAgICBpZiAoaW5kZXggPT0gbGV2ZWxzLmxlbmd0aCAtIDEpXHJcbiAgICAgICAgZGVsZXRlIHRtcFtrZXldO1xyXG4gICAgICBlbHNlIGlmICghdG1wW2tleV0pIHtcclxuICAgICAgICB0bXBba2V5XSA9IHt9O1xyXG4gICAgICAgIHRtcCA9IHRtcFtrZXldO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGlmICh0eXBlb2YgKHRtcFtrZXldKSAhPSAnb2JqZWN0JylcclxuICAgICAgICAgIHRtcFtrZXldID0ge307XHJcbiAgICAgICAgdG1wID0gdG1wW2tleV07XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICB9XHJcbiAgZWxzZVxyXG4gICAgZGVsZXRlIGpzb25fY29uZltrZXldO1xyXG5cclxuICBpZiAoa2V5ID09PSAnYWxsJylcclxuICAgIGpzb25fY29uZiA9IHt9O1xyXG5cclxuICB0cnkge1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyhjc3QuUE0yX01PRFVMRV9DT05GX0ZJTEUsIHNlcmlhbGl6ZUNvbmZpZ3VyYXRpb24oanNvbl9jb25mKSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG59O1xyXG5cclxuQ29uZmlndXJhdGlvbi5tdWx0aXNldCA9IGZ1bmN0aW9uIChzZXJpYWwsIGNiKSB7XHJcbiAgdmFyIGFycmF5cyA9IFtdO1xyXG4gIHNlcmlhbCA9IHNlcmlhbC5tYXRjaCgvKD86W14gXCJdK3xcIlteXCJdKlwiKSsvZyk7XHJcblxyXG4gIHdoaWxlIChzZXJpYWwubGVuZ3RoID4gMClcclxuICAgIGFycmF5cy5wdXNoKHNlcmlhbC5zcGxpY2UoMCwgMikpO1xyXG5cclxuICBlYWNoU2VyaWVzKGFycmF5cywgZnVuY3Rpb24gKGVsLCBuZXh0KSB7XHJcbiAgICBDb25maWd1cmF0aW9uLnNldChlbFswXSwgZWxbMV0sIG5leHQpO1xyXG4gIH0sIGNiKTtcclxufTtcclxuXHJcbkNvbmZpZ3VyYXRpb24uZ2V0ID0gZnVuY3Rpb24gKGtleSwgY2IpIHtcclxuICBDb25maWd1cmF0aW9uLmdldEFsbChmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XHJcbiAgICB2YXIgY2xpbWIgPSBzcGxpdEtleShrZXkpO1xyXG5cclxuICAgIGNsaW1iLnNvbWUoZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICBpZiAoIWRhdGFbdmFsXSkge1xyXG4gICAgICAgIGRhdGEgPSBudWxsO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIGRhdGEgPSBkYXRhW3ZhbF07XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmICghZGF0YSkgcmV0dXJuIGNiKHsgZXJyOiAnVW5rbm93biBrZXknIH0sIG51bGwpO1xyXG4gICAgcmV0dXJuIGNiKG51bGwsIGRhdGEpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuQ29uZmlndXJhdGlvbi5nZXRTeW5jID0gZnVuY3Rpb24gKGtleSkge1xyXG4gIHRyeSB7XHJcbiAgICB2YXIgZGF0YSA9IENvbmZpZ3VyYXRpb24uZ2V0QWxsU3luYygpO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgdmFyIGNsaW1iID0gc3BsaXRLZXkoa2V5KTtcclxuXHJcbiAgY2xpbWIuc29tZShmdW5jdGlvbiAodmFsKSB7XHJcbiAgICBpZiAoIWRhdGFbdmFsXSkge1xyXG4gICAgICBkYXRhID0gbnVsbDtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBkYXRhID0gZGF0YVt2YWxdO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxuICBpZiAoIWRhdGEpIHJldHVybiBudWxsO1xyXG4gIHJldHVybiBkYXRhO1xyXG59O1xyXG5cclxuQ29uZmlndXJhdGlvbi5nZXRBbGwgPSBmdW5jdGlvbiAoY2IpIHtcclxuICBmcy5yZWFkRmlsZShjc3QuUE0yX01PRFVMRV9DT05GX0ZJTEUsIFwidXRmOFwiLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XHJcbiAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcclxuICAgIHJldHVybiBjYihudWxsLCBKU09OLnBhcnNlKGRhdGEpKTtcclxuICB9KTtcclxufTtcclxuXHJcbkNvbmZpZ3VyYXRpb24uZ2V0QWxsU3luYyA9IGZ1bmN0aW9uICgpIHtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGNzdC5QTTJfTU9EVUxFX0NPTkZfRklMRSwgXCJ1dGY4XCIpKTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGUuc3RhY2sgfHwgZSk7XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ29uZmlndXJhdGlvbjtcclxuIl19