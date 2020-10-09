"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*
  options: {
    utimes: false,  // Boolean | Object, keep utimes if true
    mode: false,    // Boolean | Number, keep file mode if true
    cover: true,    // Boolean, cover if file exists
    filter: true,   // Boolean | Function, file filter
  }
*/
function copydirSync(from, to, options) {
  if (typeof options === 'function') {
    options = {
      filter: options
    };
  }

  if (typeof options === 'undefined') options = {};

  if (typeof options.cover === 'undefined') {
    options.cover = true;
  }

  options.filter = typeof options.filter === 'function' ? options.filter : function (state, filepath, filename) {
    return options.filter;
  };

  var stats = _fs["default"].lstatSync(from);

  var statsname = stats.isDirectory() ? 'directory' : stats.isFile() ? 'file' : stats.isSymbolicLink() ? 'symbolicLink' : '';
  var valid = options.filter(statsname, from, _path["default"].dirname(from), _path["default"].basename(from));

  if (statsname === 'directory' || statsname === 'symbolicLink') {
    // Directory or SymbolicLink
    if (valid) {
      try {
        _fs["default"].statSync(to);
      } catch (err) {
        if (err.code === 'ENOENT') {
          _fs["default"].mkdirSync(to);

          options.debug && console.log('>> ' + to);
        } else {
          throw err;
        }
      }

      rewriteSync(to, options, stats);
      if (statsname != 'symbolicLink') listDirectorySync(from, to, options);
    }
  } else if (stats.isFile()) {
    // File
    if (valid) {
      if (options.cover) {
        writeFileSync(from, to, options, stats);
      } else {
        try {
          _fs["default"].statSync(to);
        } catch (err) {
          if (err.code === 'ENOENT') {
            writeFileSync(from, to, options, stats);
          } else {
            throw err;
          }
        }
      }
    }
  } else {
    throw new Error('stats invalid: ' + from);
  }
}

;

function listDirectorySync(from, to, options) {
  var files = _fs["default"].readdirSync(from);

  copyFromArraySync(files, from, to, options);
}

function copyFromArraySync(files, from, to, options) {
  if (files.length === 0) return true;
  var f = files.shift();
  copydirSync(_path["default"].join(from, f), _path["default"].join(to, f), options);
  copyFromArraySync(files, from, to, options);
}

function writeFileSync(from, to, options, stats) {
  _fs["default"].writeFileSync(to, _fs["default"].readFileSync(from, 'binary'), 'binary');

  options.debug && console.log('>> ' + to);
  rewriteSync(to, options, stats);
}

function rewriteSync(f, options, stats, callback) {
  if (options.cover) {
    var mode = options.mode === true ? stats.mode : options.mode;
    var utimes = options.utimes === true ? {
      atime: stats.atime,
      mtime: stats.mtime
    } : options.utimes;
    mode && _fs["default"].chmodSync(f, mode);
    utimes && _fs["default"].utimesSync(f, utimes.atime, utimes.mtime);
  }

  return true;
}

var _default = copydirSync;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9jb3B5ZGlyU3luYy50cyJdLCJuYW1lcyI6WyJjb3B5ZGlyU3luYyIsImZyb20iLCJ0byIsIm9wdGlvbnMiLCJmaWx0ZXIiLCJjb3ZlciIsInN0YXRlIiwiZmlsZXBhdGgiLCJmaWxlbmFtZSIsInN0YXRzIiwiZnMiLCJsc3RhdFN5bmMiLCJzdGF0c25hbWUiLCJpc0RpcmVjdG9yeSIsImlzRmlsZSIsImlzU3ltYm9saWNMaW5rIiwidmFsaWQiLCJwYXRoIiwiZGlybmFtZSIsImJhc2VuYW1lIiwic3RhdFN5bmMiLCJlcnIiLCJjb2RlIiwibWtkaXJTeW5jIiwiZGVidWciLCJjb25zb2xlIiwibG9nIiwicmV3cml0ZVN5bmMiLCJsaXN0RGlyZWN0b3J5U3luYyIsIndyaXRlRmlsZVN5bmMiLCJFcnJvciIsImZpbGVzIiwicmVhZGRpclN5bmMiLCJjb3B5RnJvbUFycmF5U3luYyIsImxlbmd0aCIsImYiLCJzaGlmdCIsImpvaW4iLCJyZWFkRmlsZVN5bmMiLCJjYWxsYmFjayIsIm1vZGUiLCJ1dGltZXMiLCJhdGltZSIsIm10aW1lIiwiY2htb2RTeW5jIiwidXRpbWVzU3luYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7O0FBUUEsU0FBU0EsV0FBVCxDQUFxQkMsSUFBckIsRUFBMkJDLEVBQTNCLEVBQStCQyxPQUEvQixFQUF5QztBQUN2QyxNQUFJLE9BQU9BLE9BQVAsS0FBbUIsVUFBdkIsRUFBbUM7QUFDakNBLElBQUFBLE9BQU8sR0FBRztBQUNSQyxNQUFBQSxNQUFNLEVBQUVEO0FBREEsS0FBVjtBQUdEOztBQUNELE1BQUcsT0FBT0EsT0FBUCxLQUFtQixXQUF0QixFQUFtQ0EsT0FBTyxHQUFHLEVBQVY7O0FBQ25DLE1BQUcsT0FBT0EsT0FBTyxDQUFDRSxLQUFmLEtBQXlCLFdBQTVCLEVBQXlDO0FBQ3ZDRixJQUFBQSxPQUFPLENBQUNFLEtBQVIsR0FBZ0IsSUFBaEI7QUFDRDs7QUFD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LEtBQUssRUFBRWpDLEtBQUssQ0FBQ2lDLEtBRHdCO0FBRXJDQyxNQUFBQSxLQUFLLEVBQUVsQyxLQUFLLENBQUNrQztBQUZ3QixLQUExQixHQUdUeEMsT0FBTyxDQUFDc0MsTUFIWjtBQUlBRCxJQUFBQSxJQUFJLElBQUk5QixlQUFHa0MsU0FBSCxDQUFhVCxDQUFiLEVBQWdCSyxJQUFoQixDQUFSO0FBQ0FDLElBQUFBLE1BQU0sSUFBSS9CLGVBQUdtQyxVQUFILENBQWNWLENBQWQsRUFBaUJNLE1BQU0sQ0FBQ0MsS0FBeEIsRUFBK0JELE1BQU0sQ0FBQ0UsS0FBdEMsQ0FBVjtBQUNEOztBQUNELFNBQU8sSUFBUDtBQUNEOztlQUVjM0MsVyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG4vKlxyXG4gIG9wdGlvbnM6IHtcclxuICAgIHV0aW1lczogZmFsc2UsICAvLyBCb29sZWFuIHwgT2JqZWN0LCBrZWVwIHV0aW1lcyBpZiB0cnVlXHJcbiAgICBtb2RlOiBmYWxzZSwgICAgLy8gQm9vbGVhbiB8IE51bWJlciwga2VlcCBmaWxlIG1vZGUgaWYgdHJ1ZVxyXG4gICAgY292ZXI6IHRydWUsICAgIC8vIEJvb2xlYW4sIGNvdmVyIGlmIGZpbGUgZXhpc3RzXHJcbiAgICBmaWx0ZXI6IHRydWUsICAgLy8gQm9vbGVhbiB8IEZ1bmN0aW9uLCBmaWxlIGZpbHRlclxyXG4gIH1cclxuKi9cclxuZnVuY3Rpb24gY29weWRpclN5bmMoZnJvbSwgdG8sIG9wdGlvbnM/KSB7XHJcbiAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBvcHRpb25zID0ge1xyXG4gICAgICBmaWx0ZXI6IG9wdGlvbnNcclxuICAgIH07XHJcbiAgfVxyXG4gIGlmKHR5cGVvZiBvcHRpb25zID09PSAndW5kZWZpbmVkJykgb3B0aW9ucyA9IHt9O1xyXG4gIGlmKHR5cGVvZiBvcHRpb25zLmNvdmVyID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgb3B0aW9ucy5jb3ZlciA9IHRydWU7XHJcbiAgfVxyXG4gIG9wdGlvbnMuZmlsdGVyID0gdHlwZW9mIG9wdGlvbnMuZmlsdGVyID09PSAnZnVuY3Rpb24nID8gb3B0aW9ucy5maWx0ZXIgOiBmdW5jdGlvbihzdGF0ZSwgZmlsZXBhdGgsIGZpbGVuYW1lKSB7XHJcbiAgICByZXR1cm4gb3B0aW9ucy5maWx0ZXI7XHJcbiAgfTtcclxuICB2YXIgc3RhdHMgPSBmcy5sc3RhdFN5bmMoZnJvbSk7XHJcbiAgdmFyIHN0YXRzbmFtZSA9IHN0YXRzLmlzRGlyZWN0b3J5KCkgPyAnZGlyZWN0b3J5JyA6XHJcbiAgICBzdGF0cy5pc0ZpbGUoKSA/ICdmaWxlJyA6XHJcbiAgICAgIHN0YXRzLmlzU3ltYm9saWNMaW5rKCkgPyAnc3ltYm9saWNMaW5rJyA6XHJcbiAgICAgICcnO1xyXG4gIHZhciB2YWxpZCA9IG9wdGlvbnMuZmlsdGVyKHN0YXRzbmFtZSwgZnJvbSwgcGF0aC5kaXJuYW1lKGZyb20pLCBwYXRoLmJhc2VuYW1lKGZyb20pKTtcclxuXHJcbiAgaWYgKHN0YXRzbmFtZSA9PT0gJ2RpcmVjdG9yeScgfHwgc3RhdHNuYW1lID09PSAnc3ltYm9saWNMaW5rJykge1xyXG4gICAgLy8gRGlyZWN0b3J5IG9yIFN5bWJvbGljTGlua1xyXG4gICAgaWYodmFsaWQpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBmcy5zdGF0U3luYyh0byk7XHJcbiAgICAgIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAgICAgaWYoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSB7XHJcbiAgICAgICAgICBmcy5ta2RpclN5bmModG8pO1xyXG4gICAgICAgICAgb3B0aW9ucy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnPj4gJyArIHRvKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXdyaXRlU3luYyh0bywgb3B0aW9ucywgc3RhdHMpO1xyXG4gICAgICBpZiAoc3RhdHNuYW1lICE9ICdzeW1ib2xpY0xpbmsnKVxyXG4gICAgICAgIGxpc3REaXJlY3RvcnlTeW5jKGZyb20sIHRvLCBvcHRpb25zKTtcclxuICAgIH1cclxuICB9IGVsc2UgaWYoc3RhdHMuaXNGaWxlKCkpIHtcclxuICAgIC8vIEZpbGVcclxuICAgIGlmKHZhbGlkKSB7XHJcbiAgICAgIGlmKG9wdGlvbnMuY292ZXIpIHtcclxuICAgICAgICB3cml0ZUZpbGVTeW5jKGZyb20sIHRvLCBvcHRpb25zLCBzdGF0cyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGZzLnN0YXRTeW5jKHRvKTtcclxuICAgICAgICB9IGNhdGNoKGVycikge1xyXG4gICAgICAgICAgaWYoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSB7XHJcbiAgICAgICAgICAgIHdyaXRlRmlsZVN5bmMoZnJvbSwgdG8sIG9wdGlvbnMsIHN0YXRzKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IGVycjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdzdGF0cyBpbnZhbGlkOiAnKyBmcm9tKTtcclxuICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsaXN0RGlyZWN0b3J5U3luYyhmcm9tLCB0bywgb3B0aW9ucykge1xyXG4gIHZhciBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jKGZyb20pO1xyXG4gIGNvcHlGcm9tQXJyYXlTeW5jKGZpbGVzLCBmcm9tLCB0bywgb3B0aW9ucyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvcHlGcm9tQXJyYXlTeW5jKGZpbGVzLCBmcm9tLCB0bywgb3B0aW9ucykge1xyXG4gIGlmKGZpbGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWU7XHJcbiAgdmFyIGYgPSBmaWxlcy5zaGlmdCgpO1xyXG4gIGNvcHlkaXJTeW5jKHBhdGguam9pbihmcm9tLCBmKSwgcGF0aC5qb2luKHRvLCBmKSwgb3B0aW9ucyk7XHJcbiAgY29weUZyb21BcnJheVN5bmMoZmlsZXMsIGZyb20sIHRvLCBvcHRpb25zKTtcclxufVxyXG5cclxuZnVuY3Rpb24gd3JpdGVGaWxlU3luYyhmcm9tLCB0bywgb3B0aW9ucywgc3RhdHMpIHtcclxuICBmcy53cml0ZUZpbGVTeW5jKHRvLCBmcy5yZWFkRmlsZVN5bmMoZnJvbSwgJ2JpbmFyeScpLCAnYmluYXJ5Jyk7XHJcbiAgb3B0aW9ucy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnPj4gJyArIHRvKTtcclxuICByZXdyaXRlU3luYyh0bywgb3B0aW9ucywgc3RhdHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZXdyaXRlU3luYyhmLCBvcHRpb25zLCBzdGF0cywgY2FsbGJhY2s/KSB7XHJcbiAgaWYob3B0aW9ucy5jb3Zlcikge1xyXG4gICAgdmFyIG1vZGUgPSBvcHRpb25zLm1vZGUgPT09IHRydWUgPyBzdGF0cy5tb2RlIDogb3B0aW9ucy5tb2RlO1xyXG4gICAgdmFyIHV0aW1lcyA9IG9wdGlvbnMudXRpbWVzID09PSB0cnVlID8ge1xyXG4gICAgICBhdGltZTogc3RhdHMuYXRpbWUsXHJcbiAgICAgIG10aW1lOiBzdGF0cy5tdGltZVxyXG4gICAgfSA6IG9wdGlvbnMudXRpbWVzO1xyXG4gICAgbW9kZSAmJiBmcy5jaG1vZFN5bmMoZiwgbW9kZSk7XHJcbiAgICB1dGltZXMgJiYgZnMudXRpbWVzU3luYyhmLCB1dGltZXMuYXRpbWUsIHV0aW1lcy5tdGltZSk7XHJcbiAgfVxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjb3B5ZGlyU3luYztcclxuIl19