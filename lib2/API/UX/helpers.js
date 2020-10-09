"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _chalk = _interopRequireDefault(require("chalk"));

var _moment = _interopRequireDefault(require("moment"));

var Helpers = {};
/**
 * Converts Byte to Human readable size
 * @method bytesToSize
 * @param {} bytes
 * @param {} precision
 * @return
 */

Helpers.bytesToSize = function (bytes, precision) {
  var kilobyte = 1024;
  var megabyte = kilobyte * 1024;
  var gigabyte = megabyte * 1024;
  var terabyte = gigabyte * 1024;

  if (bytes >= 0 && bytes < kilobyte) {
    return bytes + 'b ';
  } else if (bytes >= kilobyte && bytes < megabyte) {
    return (bytes / kilobyte).toFixed(precision) + 'kb ';
  } else if (bytes >= megabyte && bytes < gigabyte) {
    return (bytes / megabyte).toFixed(precision) + 'mb ';
  } else if (bytes >= gigabyte && bytes < terabyte) {
    return (bytes / gigabyte).toFixed(precision) + 'gb ';
  } else if (bytes >= terabyte) {
    return (bytes / terabyte).toFixed(precision) + 'tb ';
  } else {
    return bytes + 'b ';
  }
};
/**
 * Color Process state
 * @method colorStatus
 * @param {} status
 * @return
 */


Helpers.colorStatus = function (status) {
  switch (status) {
    case 'online':
      return _chalk["default"].green.bold('online');
      break;

    case 'running':
      return _chalk["default"].green.bold('online');
      break;

    case 'restarting':
      return _chalk["default"].yellow.bold('restart');
      break;

    case 'created':
      return _chalk["default"].yellow.bold('created');
      break;

    case 'launching':
      return _chalk["default"].blue.bold('launching');
      break;

    default:
      return _chalk["default"].red.bold(status);
  }
};
/**
 * Safe Push
 */


Helpers.safe_push = function () {
  var argv = arguments;
  var table = argv[0];

  for (var i = 1; i < argv.length; ++i) {
    var elem = argv[i];

    if (elem[Object.keys(elem)[0]] === undefined || elem[Object.keys(elem)[0]] === null) {
      elem[Object.keys(elem)[0]] = 'N/A';
    } else if (Array.isArray(elem[Object.keys(elem)[0]])) {
      elem[Object.keys(elem)[0]].forEach(function (curr, j) {
        if (curr === undefined || curr === null) elem[Object.keys(elem)[0]][j] = 'N/A';
      });
    }

    table.push(elem);
  }
};
/**
 * Description
 * @method timeSince
 * @param {} date
 * @return BinaryExpression
 */


Helpers.timeSince = function (date) {
  // TODO: please check this
  var seconds = Math.floor((0, _moment["default"])().subtract(date, "days").unix() / 1000);
  var interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + 'Y';
  }

  interval = Math.floor(seconds / 2592000);

  if (interval > 1) {
    return interval + 'M';
  }

  interval = Math.floor(seconds / 86400);

  if (interval > 1) {
    return interval + 'D';
  }

  interval = Math.floor(seconds / 3600);

  if (interval > 1) {
    return interval + 'h';
  }

  interval = Math.floor(seconds / 60);

  if (interval > 1) {
    return interval + 'm';
  }

  return Math.floor(seconds) + 's';
};
/**
 * Colorize Metrics
 *
 * @param {Number} value current value
 * @param {Number} warn value threshold
 * @param {Number} alert value threshold
 * @param {String} prefix value prefix
 * @return {String} value
 */


Helpers.colorizedMetric = function (value, warn, alert, prefix) {
  var inverted = false;
  if (alert < warn) inverted = true;
  if (!prefix) prefix = '';
  if (isNaN(value) === true) return 'N/A';
  if (value == 0) return 0 + prefix;

  if (inverted == true) {
    if (value > warn) return _chalk["default"].green(value + prefix);
    if (value <= warn && value >= alert) return _chalk["default"].bold.yellow(value + prefix);
    return _chalk["default"].bold.red(value + prefix);
  }

  if (value < warn) return _chalk["default"].green(value + prefix);
  if (value >= warn && value <= alert) return _chalk["default"].bold.yellow(value + prefix);
  return _chalk["default"].bold.red(value + prefix);
};
/**
 * Get nested property
 *
 * @param {String} propertyName
 * @param {Object} obj
 * @returns {String} property value
 */


Helpers.getNestedProperty = function (propertyName, obj) {
  var parts = propertyName.split('.'),
      length = parts.length,
      property = obj || {};

  for (var i = 0; i < length; i++) {
    property = property[parts[i]];
  }

  return property;
};

Helpers.openEditor = function (file, opts, cb) {
  var spawn = require('child_process').spawn;

  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  if (!opts) opts = {};
  var ed = /^win/.test(process.platform) ? 'notepad' : 'vim';
  var editor = opts.editor || process.env.VISUAL || process.env.EDITOR || ed;
  var args = editor.split(/\s+/);
  var bin = args.shift();
  var ps = spawn(bin, args.concat([file]), {
    stdio: 'inherit'
  });
  ps.on('exit', function (code, sig) {
    if (typeof cb === 'function') cb(code, sig);
  });
};

Helpers.dispKeys = function (kv, target_module) {
  Object.keys(kv).forEach(function (key) {
    if (target_module != null && target_module != key) return false;

    if ((0, _typeof2["default"])(kv[key]) == 'object') {
      var obj = {};
      console.log(_chalk["default"].bold('Module: ') + _chalk["default"].bold.blue(key));
      Object.keys(kv[key]).forEach(function (sub_key) {
        console.log("$ pm2 set ".concat(key, ":").concat(sub_key, " ").concat(kv[key][sub_key]));
      });
    }
  });
};

var _default = Helpers;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BUEkvVVgvaGVscGVycy50cyJdLCJuYW1lcyI6WyJIZWxwZXJzIiwiYnl0ZXNUb1NpemUiLCJieXRlcyIsInByZWNpc2lvbiIsImtpbG9ieXRlIiwibWVnYWJ5dGUiLCJnaWdhYnl0ZSIsInRlcmFieXRlIiwidG9GaXhlZCIsImNvbG9yU3RhdHVzIiwic3RhdHVzIiwiY2hhbGsiLCJncmVlbiIsImJvbGQiLCJ5ZWxsb3ciLCJibHVlIiwicmVkIiwic2FmZV9wdXNoIiwiYXJndiIsImFyZ3VtZW50cyIsInRhYmxlIiwiaSIsImxlbmd0aCIsImVsZW0iLCJPYmplY3QiLCJrZXlzIiwidW5kZWZpbmVkIiwiQXJyYXkiLCJpc0FycmF5IiwiZm9yRWFjaCIsImN1cnIiLCJqIiwicHVzaCIsInRpbWVTaW5jZSIsImRhdGUiLCJzZWNvbmRzIiwiTWF0aCIsImZsb29yIiwic3VidHJhY3QiLCJ1bml4IiwiaW50ZXJ2YWwiLCJjb2xvcml6ZWRNZXRyaWMiLCJ2YWx1ZSIsIndhcm4iLCJhbGVydCIsInByZWZpeCIsImludmVydGVkIiwiaXNOYU4iLCJnZXROZXN0ZWRQcm9wZXJ0eSIsInByb3BlcnR5TmFtZSIsIm9iaiIsInBhcnRzIiwic3BsaXQiLCJwcm9wZXJ0eSIsIm9wZW5FZGl0b3IiLCJmaWxlIiwib3B0cyIsImNiIiwic3Bhd24iLCJyZXF1aXJlIiwiZWQiLCJ0ZXN0IiwicHJvY2VzcyIsInBsYXRmb3JtIiwiZWRpdG9yIiwiZW52IiwiVklTVUFMIiwiRURJVE9SIiwiYXJncyIsImJpbiIsInNoaWZ0IiwicHMiLCJjb25jYXQiLCJzdGRpbyIsIm9uIiwiY29kZSIsInNpZyIsImRpc3BLZXlzIiwia3YiLCJ0YXJnZXRfbW9kdWxlIiwia2V5IiwiY29uc29sZSIsImxvZyIsInN1Yl9rZXkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0EsSUFBTUEsT0FBWSxHQUFHLEVBQXJCO0FBRUE7Ozs7Ozs7O0FBT0FBLE9B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QUFSLEdBQW1CLFVBQVNDLEVBQVQsRUFBYUMsYUFBYixFQUE0QjtBQUM3Q3ZELEVBQUFBLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZcUQsRUFBWixFQUFnQmpELE9BQWhCLENBQXdCLFVBQVNtRCxHQUFULEVBQWM7QUFFcEMsUUFBSUQsYUFBYSxJQUFJLElBQWpCLElBQXlCQSxhQUFhLElBQUlDLEdBQTlDLEVBQ0UsT0FBTyxLQUFQOztBQUVGLFFBQUkseUJBQU9GLEVBQUUsQ0FBQ0UsR0FBRCxDQUFULEtBQW1CLFFBQXZCLEVBQWlDO0FBQy9CLFVBQUk5QixHQUFHLEdBQUcsRUFBVjtBQUVBK0IsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVl2RSxrQkFBTUUsSUFBTixDQUFXLFVBQVgsSUFBeUJGLGtCQUFNRSxJQUFOLENBQVdFLElBQVgsQ0FBZ0JpRSxHQUFoQixDQUFyQztBQUNBeEQsTUFBQUEsTUFBTSxDQUFDQyxJQUFQLENBQVlxRCxFQUFFLENBQUNFLEdBQUQsQ0FBZCxFQUFxQm5ELE9BQXJCLENBQTZCLFVBQVNzRCxPQUFULEVBQWtCO0FBQzdDRixRQUFBQSxPQUFPLENBQUNDLEdBQVIscUJBQXlCRixHQUF6QixjQUFnQ0csT0FBaEMsY0FBMkNMLEVBQUUsQ0FBQ0UsR0FBRCxDQUFGLENBQVFHLE9BQVIsQ0FBM0M7QUFDRCxPQUZEO0FBR0Q7QUFDRixHQWJEO0FBY0QsQ0FmRDs7ZUFpQmVuRixPIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50JztcbmNvbnN0IEhlbHBlcnM6IGFueSA9IHt9XG5cbi8qKlxuICogQ29udmVydHMgQnl0ZSB0byBIdW1hbiByZWFkYWJsZSBzaXplXG4gKiBAbWV0aG9kIGJ5dGVzVG9TaXplXG4gKiBAcGFyYW0ge30gYnl0ZXNcbiAqIEBwYXJhbSB7fSBwcmVjaXNpb25cbiAqIEByZXR1cm5cbiAqL1xuSGVscGVycy5ieXRlc1RvU2l6ZSA9IGZ1bmN0aW9uKGJ5dGVzLCBwcmVjaXNpb24pIHtcbiAgdmFyIGtpbG9ieXRlID0gMTAyNFxuICB2YXIgbWVnYWJ5dGUgPSBraWxvYnl0ZSAqIDEwMjRcbiAgdmFyIGdpZ2FieXRlID0gbWVnYWJ5dGUgKiAxMDI0XG4gIHZhciB0ZXJhYnl0ZSA9IGdpZ2FieXRlICogMTAyNFxuXG4gIGlmICgoYnl0ZXMgPj0gMCkgJiYgKGJ5dGVzIDwga2lsb2J5dGUpKSB7XG4gICAgcmV0dXJuIGJ5dGVzICsgJ2IgJ1xuICB9IGVsc2UgaWYgKChieXRlcyA+PSBraWxvYnl0ZSkgJiYgKGJ5dGVzIDwgbWVnYWJ5dGUpKSB7XG4gICAgcmV0dXJuIChieXRlcyAvIGtpbG9ieXRlKS50b0ZpeGVkKHByZWNpc2lvbikgKyAna2IgJ1xuICB9IGVsc2UgaWYgKChieXRlcyA+PSBtZWdhYnl0ZSkgJiYgKGJ5dGVzIDwgZ2lnYWJ5dGUpKSB7XG4gICAgcmV0dXJuIChieXRlcyAvIG1lZ2FieXRlKS50b0ZpeGVkKHByZWNpc2lvbikgKyAnbWIgJ1xuICB9IGVsc2UgaWYgKChieXRlcyA+PSBnaWdhYnl0ZSkgJiYgKGJ5dGVzIDwgdGVyYWJ5dGUpKSB7XG4gICAgcmV0dXJuIChieXRlcyAvIGdpZ2FieXRlKS50b0ZpeGVkKHByZWNpc2lvbikgKyAnZ2IgJ1xuICB9IGVsc2UgaWYgKGJ5dGVzID49IHRlcmFieXRlKSB7XG4gICAgcmV0dXJuIChieXRlcyAvIHRlcmFieXRlKS50b0ZpeGVkKHByZWNpc2lvbikgKyAndGIgJ1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBieXRlcyArICdiICdcbiAgfVxufVxuXG5cbi8qKlxuICogQ29sb3IgUHJvY2VzcyBzdGF0ZVxuICogQG1ldGhvZCBjb2xvclN0YXR1c1xuICogQHBhcmFtIHt9IHN0YXR1c1xuICogQHJldHVyblxuICovXG5IZWxwZXJzLmNvbG9yU3RhdHVzID0gZnVuY3Rpb24oc3RhdHVzKSB7XG4gIHN3aXRjaCAoc3RhdHVzKSB7XG5cbiAgY2FzZSAnb25saW5lJzpcbiAgICByZXR1cm4gY2hhbGsuZ3JlZW4uYm9sZCgnb25saW5lJylcbiAgICBicmVha1xuICBjYXNlICdydW5uaW5nJzpcbiAgICByZXR1cm4gY2hhbGsuZ3JlZW4uYm9sZCgnb25saW5lJylcbiAgICBicmVha1xuICBjYXNlICdyZXN0YXJ0aW5nJzpcbiAgICByZXR1cm4gY2hhbGsueWVsbG93LmJvbGQoJ3Jlc3RhcnQnKVxuICAgIGJyZWFrXG4gIGNhc2UgJ2NyZWF0ZWQnOlxuICAgIHJldHVybiBjaGFsay55ZWxsb3cuYm9sZCgnY3JlYXRlZCcpXG4gICAgYnJlYWtcbiAgY2FzZSAnbGF1bmNoaW5nJzpcbiAgICByZXR1cm4gY2hhbGsuYmx1ZS5ib2xkKCdsYXVuY2hpbmcnKVxuICAgIGJyZWFrXG4gIGRlZmF1bHQ6XG4gICAgcmV0dXJuIGNoYWxrLnJlZC5ib2xkKHN0YXR1cylcbiAgfVxufVxuXG4vKipcbiAqIFNhZmUgUHVzaFxuICovXG5IZWxwZXJzLnNhZmVfcHVzaCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYXJndiA9IGFyZ3VtZW50c1xuICB2YXIgdGFibGUgPSBhcmd2WzBdXG5cbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd2Lmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGVsZW0gPSBhcmd2W2ldXG4gICAgaWYgKGVsZW1bT2JqZWN0LmtleXMoZWxlbSlbMF1dID09PSB1bmRlZmluZWRcbiAgICAgICAgfHwgZWxlbVtPYmplY3Qua2V5cyhlbGVtKVswXV0gPT09IG51bGwpIHtcbiAgICAgIGVsZW1bT2JqZWN0LmtleXMoZWxlbSlbMF1dID0gJ04vQSdcbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShlbGVtW09iamVjdC5rZXlzKGVsZW0pWzBdXSkpIHtcbiAgICAgIGVsZW1bT2JqZWN0LmtleXMoZWxlbSlbMF1dLmZvckVhY2goZnVuY3Rpb24oY3Vyciwgaikge1xuICAgICAgICBpZiAoY3VyciA9PT0gdW5kZWZpbmVkIHx8IGN1cnIgPT09IG51bGwpXG4gICAgICAgICAgZWxlbVtPYmplY3Qua2V5cyhlbGVtKVswXV1bal0gPSAnTi9BJ1xuICAgICAgfSlcbiAgICB9XG4gICAgdGFibGUucHVzaChlbGVtKVxuICB9XG59XG5cbi8qKlxuICogRGVzY3JpcHRpb25cbiAqIEBtZXRob2QgdGltZVNpbmNlXG4gKiBAcGFyYW0ge30gZGF0ZVxuICogQHJldHVybiBCaW5hcnlFeHByZXNzaW9uXG4gKi9cbkhlbHBlcnMudGltZVNpbmNlID0gZnVuY3Rpb24oZGF0ZSkge1xuICAvLyBUT0RPOiBwbGVhc2UgY2hlY2sgdGhpc1xuICB2YXIgc2Vjb25kcyA9IE1hdGguZmxvb3IobW9tZW50KCkuc3VidHJhY3QoZGF0ZSwgXCJkYXlzXCIpLnVuaXgoKSAvIDEwMDApXG5cbiAgdmFyIGludGVydmFsID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gMzE1MzYwMDApXG5cbiAgaWYgKGludGVydmFsID4gMSkge1xuICAgIHJldHVybiBpbnRlcnZhbCArICdZJ1xuICB9XG4gIGludGVydmFsID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gMjU5MjAwMClcbiAgaWYgKGludGVydmFsID4gMSkge1xuICAgIHJldHVybiBpbnRlcnZhbCArICdNJ1xuICB9XG4gIGludGVydmFsID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gODY0MDApXG4gIGlmIChpbnRlcnZhbCA+IDEpIHtcbiAgICByZXR1cm4gaW50ZXJ2YWwgKyAnRCdcbiAgfVxuICBpbnRlcnZhbCA9IE1hdGguZmxvb3Ioc2Vjb25kcyAvIDM2MDApXG4gIGlmIChpbnRlcnZhbCA+IDEpIHtcbiAgICByZXR1cm4gaW50ZXJ2YWwgKyAnaCdcbiAgfVxuICBpbnRlcnZhbCA9IE1hdGguZmxvb3Ioc2Vjb25kcyAvIDYwKVxuICBpZiAoaW50ZXJ2YWwgPiAxKSB7XG4gICAgcmV0dXJuIGludGVydmFsICsgJ20nXG4gIH1cbiAgcmV0dXJuIE1hdGguZmxvb3Ioc2Vjb25kcykgKyAncydcbn1cblxuLyoqXG4gKiBDb2xvcml6ZSBNZXRyaWNzXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIGN1cnJlbnQgdmFsdWVcbiAqIEBwYXJhbSB7TnVtYmVyfSB3YXJuIHZhbHVlIHRocmVzaG9sZFxuICogQHBhcmFtIHtOdW1iZXJ9IGFsZXJ0IHZhbHVlIHRocmVzaG9sZFxuICogQHBhcmFtIHtTdHJpbmd9IHByZWZpeCB2YWx1ZSBwcmVmaXhcbiAqIEByZXR1cm4ge1N0cmluZ30gdmFsdWVcbiAqL1xuSGVscGVycy5jb2xvcml6ZWRNZXRyaWMgPSBmdW5jdGlvbih2YWx1ZSwgd2FybiwgYWxlcnQsIHByZWZpeCkge1xuICB2YXIgaW52ZXJ0ZWQgPSBmYWxzZVxuICBpZiAoYWxlcnQgPCB3YXJuKVxuICAgIGludmVydGVkID0gdHJ1ZVxuXG4gIGlmICghcHJlZml4KSBwcmVmaXggPSAnJ1xuICBpZiAoaXNOYU4odmFsdWUpID09PSB0cnVlKVxuICAgIHJldHVybiAnTi9BJ1xuICBpZiAodmFsdWUgPT0gMClcbiAgICByZXR1cm4gMCArIHByZWZpeFxuICBpZiAoaW52ZXJ0ZWQgPT0gdHJ1ZSkge1xuICAgIGlmICh2YWx1ZSA+IHdhcm4pXG4gICAgICByZXR1cm4gY2hhbGsuZ3JlZW4odmFsdWUgKyBwcmVmaXgpXG4gICAgaWYgKHZhbHVlIDw9IHdhcm4gJiYgdmFsdWUgPj0gYWxlcnQpXG4gICAgICByZXR1cm4gY2hhbGsuYm9sZC55ZWxsb3codmFsdWUgKyBwcmVmaXgpXG4gICAgcmV0dXJuIGNoYWxrLmJvbGQucmVkKHZhbHVlICsgcHJlZml4KVxuICB9XG4gIGlmICh2YWx1ZSA8IHdhcm4pXG4gICAgcmV0dXJuIGNoYWxrLmdyZWVuKHZhbHVlICsgcHJlZml4KVxuICBpZiAodmFsdWUgPj0gd2FybiAmJiB2YWx1ZSA8PSBhbGVydClcbiAgICByZXR1cm4gY2hhbGsuYm9sZC55ZWxsb3codmFsdWUgKyBwcmVmaXgpXG4gIHJldHVybiBjaGFsay5ib2xkLnJlZCh2YWx1ZSArIHByZWZpeClcbn1cblxuLyoqXG4gKiBHZXQgbmVzdGVkIHByb3BlcnR5XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5TmFtZVxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybnMge1N0cmluZ30gcHJvcGVydHkgdmFsdWVcbiAqL1xuSGVscGVycy5nZXROZXN0ZWRQcm9wZXJ0eSA9IGZ1bmN0aW9uKHByb3BlcnR5TmFtZSwgb2JqKSB7XG4gIHZhciBwYXJ0cyA9IHByb3BlcnR5TmFtZS5zcGxpdCgnLicpLFxuICAgICAgbGVuZ3RoID0gcGFydHMubGVuZ3RoLFxuICAgICAgcHJvcGVydHkgPSBvYmogfHwge31cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrICkge1xuICAgIHByb3BlcnR5ID0gcHJvcGVydHlbcGFydHNbaV1dXG4gIH1cblxuICByZXR1cm4gcHJvcGVydHlcbn1cblxuSGVscGVycy5vcGVuRWRpdG9yID0gZnVuY3Rpb24gKGZpbGUsIG9wdHMsIGNiKSB7XG4gIHZhciBzcGF3biA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKS5zcGF3blxuXG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNiID0gb3B0c1xuICAgIG9wdHMgPSB7fVxuICB9XG5cbiAgaWYgKCFvcHRzKSBvcHRzID0ge31cblxuICB2YXIgZWQgPSAvXndpbi8udGVzdChwcm9jZXNzLnBsYXRmb3JtKSA/ICdub3RlcGFkJyA6ICd2aW0nXG4gIHZhciBlZGl0b3IgPSBvcHRzLmVkaXRvciB8fCBwcm9jZXNzLmVudi5WSVNVQUwgfHwgcHJvY2Vzcy5lbnYuRURJVE9SIHx8IGVkXG4gIHZhciBhcmdzID0gZWRpdG9yLnNwbGl0KC9cXHMrLylcbiAgdmFyIGJpbiA9IGFyZ3Muc2hpZnQoKVxuXG4gIHZhciBwcyA9IHNwYXduKGJpbiwgYXJncy5jb25jYXQoWyBmaWxlIF0pLCB7IHN0ZGlvOiAnaW5oZXJpdCcgfSlcblxuICBwcy5vbignZXhpdCcsIGZ1bmN0aW9uIChjb2RlLCBzaWcpIHtcbiAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYihjb2RlLCBzaWcpXG4gIH0pXG59XG5cblxuSGVscGVycy5kaXNwS2V5cyA9IGZ1bmN0aW9uKGt2LCB0YXJnZXRfbW9kdWxlKSB7XG4gIE9iamVjdC5rZXlzKGt2KS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuXG4gICAgaWYgKHRhcmdldF9tb2R1bGUgIT0gbnVsbCAmJiB0YXJnZXRfbW9kdWxlICE9IGtleSlcbiAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgaWYgKHR5cGVvZihrdltrZXldKSA9PSAnb2JqZWN0Jykge1xuICAgICAgdmFyIG9iaiA9IHt9XG5cbiAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmJvbGQoJ01vZHVsZTogJykgKyBjaGFsay5ib2xkLmJsdWUoa2V5KSlcbiAgICAgIE9iamVjdC5rZXlzKGt2W2tleV0pLmZvckVhY2goZnVuY3Rpb24oc3ViX2tleSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgJCBwbTIgc2V0ICR7a2V5fToke3N1Yl9rZXl9ICR7a3Zba2V5XVtzdWJfa2V5XX1gKVxuICAgICAgfSlcbiAgICB9XG4gIH0pXG59XG5cbmV4cG9ydCBkZWZhdWx0IEhlbHBlcnNcbiJdfQ==