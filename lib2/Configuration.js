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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Db25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbIkNvbmZpZ3VyYXRpb24iLCJzcGxpdEtleSIsImtleSIsInZhbHVlcyIsImluZGV4T2YiLCJtYXRjaCIsIm1hcCIsImR0IiwicmVwbGFjZSIsInNlcmlhbGl6ZUNvbmZpZ3VyYXRpb24iLCJqc29uX2NvbmYiLCJKU09OIiwic3RyaW5naWZ5Iiwic2V0IiwidmFsdWUiLCJjYiIsImZzIiwicmVhZEZpbGUiLCJjc3QiLCJQTTJfTU9EVUxFX0NPTkZfRklMRSIsImVyciIsImRhdGEiLCJwYXJzZSIsImxlbmd0aCIsImxldmVscyIsInRtcCIsImZvckVhY2giLCJpbmRleCIsIkNvbW1vbiIsInByaW50T3V0IiwiUFJFRklYX01TRyIsIndyaXRlRmlsZSIsInVuc2V0Iiwic2V0U3luY0lmTm90RXhpc3QiLCJjb25mIiwicmVhZEZpbGVTeW5jIiwiZSIsImV4aXN0cyIsIk9iamVjdCIsImtleXMiLCJzb21lIiwic2V0U3luYyIsIndyaXRlRmlsZVN5bmMiLCJjb25zb2xlIiwiZXJyb3IiLCJtZXNzYWdlIiwidW5zZXRTeW5jIiwibXVsdGlzZXQiLCJzZXJpYWwiLCJhcnJheXMiLCJwdXNoIiwic3BsaWNlIiwiZWwiLCJuZXh0IiwiZ2V0IiwiZ2V0QWxsIiwiY2xpbWIiLCJ2YWwiLCJnZXRTeW5jIiwiZ2V0QWxsU3luYyIsInN0YWNrIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBS0E7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVBLElBQUlBLGFBQWtCLEdBQUcsRUFBekI7O0FBRUEsU0FBU0MsUUFBVCxDQUFrQkMsR0FBbEIsRUFBdUI7QUFDckIsTUFBSUMsTUFBTSxHQUFHLENBQUNELEdBQUQsQ0FBYjtBQUVBLE1BQUlBLEdBQUcsQ0FBQ0UsT0FBSixDQUFZLEdBQVosSUFBbUIsQ0FBQyxDQUF4QixFQUNFRCxNQUFNLEdBQUdELEdBQUcsQ0FBQ0csS0FBSixDQUFVLHNCQUFWLEVBQWtDQyxHQUFsQyxD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R0FGRCxDQUVFLE9BQU9pQixDQUFQLEVBQVU7QUFDVk8sSUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNSLENBQUMsQ0FBQ3dCLEtBQUYsSUFBV3hCLENBQXpCO0FBQ0EsV0FBTyxFQUFQO0FBQ0Q7QUFDRixDQVBEOztlQVNlcEMsYSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIGxpY2Vuc2UgdGhhdFxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4gKi9cbmltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmltcG9ydCBDb21tb24gZnJvbSAnLi9Db21tb24nO1xuaW1wb3J0IGVhY2hTZXJpZXMgZnJvbSAnYXN5bmMvZWFjaFNlcmllcyc7XG5pbXBvcnQgY3N0IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XG5cbnZhciBDb25maWd1cmF0aW9uOiBhbnkgPSB7fTtcblxuZnVuY3Rpb24gc3BsaXRLZXkoa2V5KSB7XG4gIHZhciB2YWx1ZXMgPSBba2V5XTtcblxuICBpZiAoa2V5LmluZGV4T2YoJy4nKSA+IC0xKVxuICAgIHZhbHVlcyA9IGtleS5tYXRjaCgvKD86W14uXCJdK3xcIlteXCJdKlwiKSsvZykubWFwKGZ1bmN0aW9uIChkdCkgeyByZXR1cm4gZHQucmVwbGFjZSgvXCIvZywgJycpIH0pO1xuICBlbHNlIGlmIChrZXkuaW5kZXhPZignOicpID4gLTEpXG4gICAgdmFsdWVzID0ga2V5Lm1hdGNoKC8oPzpbXjpcIl0rfFwiW15cIl0qXCIpKy9nKS5tYXAoZnVuY3Rpb24gKGR0KSB7IHJldHVybiBkdC5yZXBsYWNlKC9cIi9nLCAnJykgfSk7XG5cbiAgcmV0dXJuIHZhbHVlcztcbn1cblxuZnVuY3Rpb24gc2VyaWFsaXplQ29uZmlndXJhdGlvbihqc29uX2NvbmYpIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGpzb25fY29uZiwgbnVsbCwgNClcbn1cblxuQ29uZmlndXJhdGlvbi5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgY2IpIHtcbiAgZnMucmVhZEZpbGUoY3N0LlBNMl9NT0RVTEVfQ09ORl9GSUxFLCBcInV0ZjhcIiwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuXG4gICAgdmFyIGpzb25fY29uZiA9IEpTT04ucGFyc2UoZGF0YSk7XG5cbiAgICB2YXIgdmFsdWVzID0gc3BsaXRLZXkoa2V5KTtcblxuICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIGxldmVscyA9IHZhbHVlcztcblxuICAgICAgdmFyIHRtcCA9IGpzb25fY29uZjtcblxuICAgICAgbGV2ZWxzLmZvckVhY2goZnVuY3Rpb24gKGtleSwgaW5kZXgpIHtcbiAgICAgICAgaWYgKGluZGV4ID09IGxldmVscy5sZW5ndGggLSAxKVxuICAgICAgICAgIHRtcFtrZXldID0gdmFsdWU7XG4gICAgICAgIGVsc2UgaWYgKCF0bXBba2V5XSkge1xuICAgICAgICAgIHRtcFtrZXldID0ge307XG4gICAgICAgICAgdG1wID0gdG1wW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiAodG1wW2tleV0pICE9ICdvYmplY3QnKVxuICAgICAgICAgICAgdG1wW2tleV0gPSB7fTtcbiAgICAgICAgICB0bXAgPSB0bXBba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpZiAoanNvbl9jb25mW2tleV0gJiYgdHlwZW9mIChqc29uX2NvbmZba2V5XSkgPT09ICdzdHJpbmcnKVxuICAgICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnUmVwbGFjaW5nIGN1cnJlbnQgdmFsdWUga2V5ICVzIGJ5ICVzJywga2V5LCB2YWx1ZSk7XG5cbiAgICAgIGpzb25fY29uZltrZXldID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZnMud3JpdGVGaWxlKGNzdC5QTTJfTU9EVUxFX0NPTkZfRklMRSwgc2VyaWFsaXplQ29uZmlndXJhdGlvbihqc29uX2NvbmYpLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gY2IoZXJyKTtcblxuICAgICAgcmV0dXJuIGNiKG51bGwsIGpzb25fY29uZik7XG4gICAgfSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KTtcbn07XG5cbkNvbmZpZ3VyYXRpb24udW5zZXQgPSBmdW5jdGlvbiAoa2V5LCBjYikge1xuICBmcy5yZWFkRmlsZShjc3QuUE0yX01PRFVMRV9DT05GX0ZJTEUsIFwidXRmOFwiLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG5cbiAgICB2YXIganNvbl9jb25mID0gSlNPTi5wYXJzZShkYXRhKTtcblxuICAgIHZhciB2YWx1ZXMgPSBzcGxpdEtleShrZXkpO1xuXG4gICAgaWYgKHZhbHVlcy5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgbGV2ZWxzID0gdmFsdWVzO1xuXG4gICAgICB2YXIgdG1wID0ganNvbl9jb25mO1xuXG4gICAgICBsZXZlbHMuZm9yRWFjaChmdW5jdGlvbiAoa2V5LCBpbmRleCkge1xuICAgICAgICBpZiAoaW5kZXggPT0gbGV2ZWxzLmxlbmd0aCAtIDEpXG4gICAgICAgICAgZGVsZXRlIHRtcFtrZXldO1xuICAgICAgICBlbHNlIGlmICghdG1wW2tleV0pIHtcbiAgICAgICAgICB0bXBba2V5XSA9IHt9O1xuICAgICAgICAgIHRtcCA9IHRtcFtrZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmICh0eXBlb2YgKHRtcFtrZXldKSAhPSAnb2JqZWN0JylcbiAgICAgICAgICAgIHRtcFtrZXldID0ge307XG4gICAgICAgICAgdG1wID0gdG1wW2tleV07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfVxuICAgIGVsc2VcbiAgICAgIGRlbGV0ZSBqc29uX2NvbmZba2V5XTtcblxuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuXG4gICAgaWYgKGtleSA9PT0gJ2FsbCcpXG4gICAgICBqc29uX2NvbmYgPSB7fTtcblxuICAgIGZzLndyaXRlRmlsZShjc3QuUE0yX01PRFVMRV9DT05GX0ZJTEUsIHNlcmlhbGl6ZUNvbmZpZ3VyYXRpb24oanNvbl9jb25mKSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikgcmV0dXJuIGNiKGVycik7XG5cbiAgICAgIHJldHVybiBjYihudWxsLCBqc29uX2NvbmYpO1xuICAgIH0pO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSk7XG59XG5cbkNvbmZpZ3VyYXRpb24uc2V0U3luY0lmTm90RXhpc3QgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICB0cnkge1xuICAgIHZhciBjb25mID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoY3N0LlBNMl9NT0RVTEVfQ09ORl9GSUxFLCBcInV0ZjhcIikpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB2YXIgdmFsdWVzID0gc3BsaXRLZXkoa2V5KTtcbiAgdmFyIGV4aXN0cyA9IGZhbHNlO1xuXG4gIGlmICh2YWx1ZXMubGVuZ3RoID4gMSAmJiBjb25mICYmIGNvbmZbdmFsdWVzWzBdXSkge1xuICAgIGV4aXN0cyA9IE9iamVjdC5rZXlzKGNvbmZbdmFsdWVzWzBdXSkuc29tZShmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBpZiAoa2V5ID09IHZhbHVlc1sxXSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH1cblxuICBpZiAoZXhpc3RzID09PSBmYWxzZSlcbiAgICByZXR1cm4gQ29uZmlndXJhdGlvbi5zZXRTeW5jKGtleSwgdmFsdWUpO1xuXG4gIHJldHVybiBudWxsO1xufTtcblxuQ29uZmlndXJhdGlvbi5zZXRTeW5jID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgdHJ5IHtcbiAgICB2YXIgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhjc3QuUE0yX01PRFVMRV9DT05GX0ZJTEUsIFwidXRmOFwiKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdmFyIGpzb25fY29uZiA9IEpTT04ucGFyc2UoZGF0YSk7XG5cbiAgdmFyIHZhbHVlcyA9IHNwbGl0S2V5KGtleSk7XG5cbiAgaWYgKHZhbHVlcy5sZW5ndGggPiAwKSB7XG4gICAgdmFyIGxldmVscyA9IHZhbHVlcztcblxuICAgIHZhciB0bXAgPSBqc29uX2NvbmY7XG5cbiAgICBsZXZlbHMuZm9yRWFjaChmdW5jdGlvbiAoa2V5LCBpbmRleCkge1xuICAgICAgaWYgKGluZGV4ID09IGxldmVscy5sZW5ndGggLSAxKVxuICAgICAgICB0bXBba2V5XSA9IHZhbHVlO1xuICAgICAgZWxzZSBpZiAoIXRtcFtrZXldKSB7XG4gICAgICAgIHRtcFtrZXldID0ge307XG4gICAgICAgIHRtcCA9IHRtcFtrZXldO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgKHRtcFtrZXldKSAhPSAnb2JqZWN0JylcbiAgICAgICAgICB0bXBba2V5XSA9IHt9O1xuICAgICAgICB0bXAgPSB0bXBba2V5XTtcbiAgICAgIH1cbiAgICB9KTtcblxuICB9XG4gIGVsc2Uge1xuICAgIGlmIChqc29uX2NvbmZba2V5XSAmJiB0eXBlb2YgKGpzb25fY29uZltrZXldKSA9PT0gJ3N0cmluZycpXG4gICAgICBDb21tb24ucHJpbnRPdXQoY3N0LlBSRUZJWF9NU0cgKyAnUmVwbGFjaW5nIGN1cnJlbnQgdmFsdWUga2V5ICVzIGJ5ICVzJywga2V5LCB2YWx1ZSk7XG5cbiAgICBqc29uX2NvbmZba2V5XSA9IHZhbHVlO1xuICB9XG5cbiAgaWYgKGtleSA9PT0gJ2FsbCcpXG4gICAganNvbl9jb25mID0ge307XG5cbiAgdHJ5IHtcbiAgICBmcy53cml0ZUZpbGVTeW5jKGNzdC5QTTJfTU9EVUxFX0NPTkZfRklMRSwgc2VyaWFsaXplQ29uZmlndXJhdGlvbihqc29uX2NvbmYpKTtcbiAgICByZXR1cm4ganNvbl9jb25mO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuXG5Db25maWd1cmF0aW9uLnVuc2V0U3luYyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgdHJ5IHtcbiAgICB2YXIgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhjc3QuUE0yX01PRFVMRV9DT05GX0ZJTEUsIFwidXRmOFwiKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdmFyIGpzb25fY29uZiA9IEpTT04ucGFyc2UoZGF0YSk7XG5cbiAgdmFyIHZhbHVlcyA9IHNwbGl0S2V5KGtleSk7XG5cbiAgaWYgKHZhbHVlcy5sZW5ndGggPiAwKSB7XG4gICAgdmFyIGxldmVscyA9IHZhbHVlcztcblxuICAgIHZhciB0bXAgPSBqc29uX2NvbmY7XG5cbiAgICBsZXZlbHMuZm9yRWFjaChmdW5jdGlvbiAoa2V5LCBpbmRleCkge1xuICAgICAgaWYgKGluZGV4ID09IGxldmVscy5sZW5ndGggLSAxKVxuICAgICAgICBkZWxldGUgdG1wW2tleV07XG4gICAgICBlbHNlIGlmICghdG1wW2tleV0pIHtcbiAgICAgICAgdG1wW2tleV0gPSB7fTtcbiAgICAgICAgdG1wID0gdG1wW2tleV07XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiAodG1wW2tleV0pICE9ICdvYmplY3QnKVxuICAgICAgICAgIHRtcFtrZXldID0ge307XG4gICAgICAgIHRtcCA9IHRtcFtrZXldO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIH1cbiAgZWxzZVxuICAgIGRlbGV0ZSBqc29uX2NvbmZba2V5XTtcblxuICBpZiAoa2V5ID09PSAnYWxsJylcbiAgICBqc29uX2NvbmYgPSB7fTtcblxuICB0cnkge1xuICAgIGZzLndyaXRlRmlsZVN5bmMoY3N0LlBNMl9NT0RVTEVfQ09ORl9GSUxFLCBzZXJpYWxpemVDb25maWd1cmF0aW9uKGpzb25fY29uZikpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuXG5Db25maWd1cmF0aW9uLm11bHRpc2V0ID0gZnVuY3Rpb24gKHNlcmlhbCwgY2IpIHtcbiAgdmFyIGFycmF5cyA9IFtdO1xuICBzZXJpYWwgPSBzZXJpYWwubWF0Y2goLyg/OlteIFwiXSt8XCJbXlwiXSpcIikrL2cpO1xuXG4gIHdoaWxlIChzZXJpYWwubGVuZ3RoID4gMClcbiAgICBhcnJheXMucHVzaChzZXJpYWwuc3BsaWNlKDAsIDIpKTtcblxuICBlYWNoU2VyaWVzKGFycmF5cywgZnVuY3Rpb24gKGVsLCBuZXh0KSB7XG4gICAgQ29uZmlndXJhdGlvbi5zZXQoZWxbMF0sIGVsWzFdLCBuZXh0KTtcbiAgfSwgY2IpO1xufTtcblxuQ29uZmlndXJhdGlvbi5nZXQgPSBmdW5jdGlvbiAoa2V5LCBjYikge1xuICBDb25maWd1cmF0aW9uLmdldEFsbChmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgdmFyIGNsaW1iID0gc3BsaXRLZXkoa2V5KTtcblxuICAgIGNsaW1iLnNvbWUoZnVuY3Rpb24gKHZhbCkge1xuICAgICAgaWYgKCFkYXRhW3ZhbF0pIHtcbiAgICAgICAgZGF0YSA9IG51bGw7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgZGF0YSA9IGRhdGFbdmFsXTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIGlmICghZGF0YSkgcmV0dXJuIGNiKHsgZXJyOiAnVW5rbm93biBrZXknIH0sIG51bGwpO1xuICAgIHJldHVybiBjYihudWxsLCBkYXRhKTtcbiAgfSk7XG59O1xuXG5Db25maWd1cmF0aW9uLmdldFN5bmMgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHRyeSB7XG4gICAgdmFyIGRhdGEgPSBDb25maWd1cmF0aW9uLmdldEFsbFN5bmMoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdmFyIGNsaW1iID0gc3BsaXRLZXkoa2V5KTtcblxuICBjbGltYi5zb21lKGZ1bmN0aW9uICh2YWwpIHtcbiAgICBpZiAoIWRhdGFbdmFsXSkge1xuICAgICAgZGF0YSA9IG51bGw7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZGF0YSA9IGRhdGFbdmFsXTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xuXG4gIGlmICghZGF0YSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBkYXRhO1xufTtcblxuQ29uZmlndXJhdGlvbi5nZXRBbGwgPSBmdW5jdGlvbiAoY2IpIHtcbiAgZnMucmVhZEZpbGUoY3N0LlBNMl9NT0RVTEVfQ09ORl9GSUxFLCBcInV0ZjhcIiwgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgIGlmIChlcnIpIHJldHVybiBjYihlcnIpO1xuICAgIHJldHVybiBjYihudWxsLCBKU09OLnBhcnNlKGRhdGEpKTtcbiAgfSk7XG59O1xuXG5Db25maWd1cmF0aW9uLmdldEFsbFN5bmMgPSBmdW5jdGlvbiAoKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGNzdC5QTTJfTU9EVUxFX0NPTkZfRklMRSwgXCJ1dGY4XCIpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayB8fCBlKTtcbiAgICByZXR1cm4ge307XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IENvbmZpZ3VyYXRpb247XG4iXX0=