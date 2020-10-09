'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = find;

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Attempt to somewhat safely parse the JSON.
 *
 * @param {String} data JSON blob that needs to be parsed.
 * @returns {Object|false} Parsed JSON or false.
 * @api private
 */
function parse(data) {
  data = data.toString('utf-8'); //
  // Remove a possible UTF-8 BOM (byte order marker) as this can lead to parse
  // values when passed in to the JSON.parse.
  //

  if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);

  try {
    return JSON.parse(data);
  } catch (e) {
    return false;
  }
}
/**
 * Find package.json files.
 *
 * @param {String|Object} root The root directory we should start searching in.
 * @returns {Object} Iterator interface.
 * @api public
 */


function find(root) {
  root = root || process.cwd();

  if (typeof root !== "string") {
    if (_typeof(root) === "object" && typeof root.filename === 'string') {
      root = root.filename;
    } else {
      throw new Error("Must pass a filename string or a module object to finder");
    }
  }

  return {
    /**
     * Return the parsed package.json that we find in a parent folder.
     *
     * @returns {Object} Value, filename and indication if the iteration is done.
     * @api public
     */
    next: function next() {
      if (root.match(/^(\w:\\|\/)$/)) return {
        value: undefined,
        filename: undefined,
        done: true
      };

      var file = _path["default"].join(root, 'package.json'),
          data;

      root = _path["default"].resolve(root, '..');

      if (_fs["default"].existsSync(file) && (data = parse(_fs["default"].readFileSync(file)))) {
        data.__path = file;
        return {
          value: data,
          filename: file,
          done: false
        };
      }

      return next();
    }
  };
}

;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9maW5kLXBhY2thZ2UtanNvbi50cyJdLCJuYW1lcyI6WyJwYXJzZSIsImRhdGEiLCJ0b1N0cmluZyIsImNoYXJDb2RlQXQiLCJzbGljZSIsIkpTT04iLCJlIiwiZmluZCIsInJvb3QiLCJwcm9jZXNzIiwiY3dkIiwiZmlsZW5hbWUiLCJFcnJvciIsIm5leHQiLCJtYXRjaCIsInZhbHVlIiwidW5kZWZpbmVkIiwiZG9uZSIsImZpbGUiLCJwYXRoIiwiam9pbiIsInJlc29sdmUiLCJmcyIsImV4aXN0c1N5bmMiLCJyZWFkRmlsZVN5bmMiLCJfX3BhdGgiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBRUE7O0FBQ0E7Ozs7OztBQUVBOzs7Ozs7O0FBT0EsU0FBU0EsS0FBVCxDQUFlQyxJQUFmLEVBQXFCO0FBQ25CQSxFQUFBQSxJQUFJLEdBQUdBLElBQUksQ0FBQ0MsUUFBTCxDQUFjLE9BQWQsQ0FBUCxDQURtQixDQUduQjtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxNQUFJRCxJQUFJLENBQUNFLFVBQUwsQ0FBZ0IsQ0FBaEIsTUFBdUIsTUFBM0IsRUFBbUNGLElBQUksR0FBR0EsSUFBSSxDQUFDRyxLQUFMLENBQVcsQ0FBWCxDQUFQOztBQUVuQyxNQUFJO0FBQUUsV0FBT0MsSUFBSSxDQUFDTCxLQUFMLENBQVdDLElBQVgsQ0FBUDtBQUEwQixHQUFoQyxDQUNBLE9BQU9LLENBQVAsRUFBVTtBQUFFLFdBQU8sS0FBUDtBQUFlO0FBQzVCO0FBRUQ7Ozs7Ozs7OztBQU9lLFNBQVNDLElBQVQsQ0FBY0MsSUFBZCxFQUFvQjtBQUNqQ0EsRUFBQUEsSUFBSSxHQUFHQSxJQUFJLElBQUlDLE9BQU8sQ0FBQ0MsR0FBUixFQUFmOztBQUNBLE1BQUksT0FBT0YsSUFBUCxLQUFnQixRQUFwQixFQUE4QjtBQUM1QixRQUFJLFFBQU9BLElBQVAsTUFBZ0IsUUFBaEIsSUFBNEIsT0FBT0EsSUFBSSxDQUFDRyxRQUFaLEtBQXlCLFFBQXpELEVBQW1FO0FBQ2pFSCxNQUFBQSxJQUFJLEdBQUdBLElBQUksQ0FBQ0csUUFBWjtBQUNELEtBRkQsTUFFTztBQUNMLFlBQU0sSUFBSUMsS0FBSixDQUFVLDBEQUFWLENBQU47QUFDRDtBQUNGOztBQUNELFNBQU87QUFDTDs7Ozs7O0FBTUFDLElBQUFBLElBQUksRUFBRSxTQUFTQSxJQUFULEdBQWdCO0FBQ3BCLFVBQUlMLElBQUksQ0FBQ00sS0FBTCxDQUFXLGNBQVgsQ0FBSixFQUFnQyxPQUFPO0FBQ3JDQyxRQUFBQSxLQUFLLEVBQUVDLFNBRDhCO0FBRXJDTCxRQUFBQSxRQUFRLEVBQUVLLFNBRjJCO0FBR3JDQyxRQUFBQSxJQUFJLEVBQUU7QUFIK0IsT0FBUDs7QUFNaEMsVUFBSUMsSUFBSSxHQUFHQyxpQkFBS0MsSUFBTCxDQUFVWixJQUFWLEVBQWdCLGNBQWhCLENBQVg7QUFBQSxVQUNJUCxJQURKOztBQUdBTyxNQUFBQSxJQUFJLEdBQUdXLGlCQUFLRSxPQUFMLENBQWFiLElBQWIsRUFBbUIsSUFBbkIsQ0FBUDs7QUFFQSxVQUFJYyxlQUFHQyxVQUFILENBQWNMLElBQWQsTUFBd0JqQixJQUFJLEdBQUdELEtBQUssQ0FBQ3NCLGVBQUdFLFlBQUgsQ0FBZ0JOLElBQWhCLENBQUQsQ0FBcEMsQ0FBSixFQUFrRTtBQUNoRWpCLFFBQUFBLElBQUksQ0FBQ3dCLE1BQUwsR0FBY1AsSUFBZDtBQUVBLGVBQU87QUFDTEgsVUFBQUEsS0FBSyxFQUFFZCxJQURGO0FBRUxVLFVBQUFBLFFBQVEsRUFBRU8sSUFGTDtBQUdMRCxVQUFBQSxJQUFJLEVBQUU7QUFIRCxTQUFQO0FBS0Q7O0FBRUQsYUFBT0osSUFBSSxFQUFYO0FBQ0Q7QUE5QkksR0FBUDtBQWdDRDs7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmcyBmcm9tICdmcydcblxuLyoqXG4gKiBBdHRlbXB0IHRvIHNvbWV3aGF0IHNhZmVseSBwYXJzZSB0aGUgSlNPTi5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZGF0YSBKU09OIGJsb2IgdGhhdCBuZWVkcyB0byBiZSBwYXJzZWQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fGZhbHNlfSBQYXJzZWQgSlNPTiBvciBmYWxzZS5cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBwYXJzZShkYXRhKSB7XG4gIGRhdGEgPSBkYXRhLnRvU3RyaW5nKCd1dGYtOCcpO1xuXG4gIC8vXG4gIC8vIFJlbW92ZSBhIHBvc3NpYmxlIFVURi04IEJPTSAoYnl0ZSBvcmRlciBtYXJrZXIpIGFzIHRoaXMgY2FuIGxlYWQgdG8gcGFyc2VcbiAgLy8gdmFsdWVzIHdoZW4gcGFzc2VkIGluIHRvIHRoZSBKU09OLnBhcnNlLlxuICAvL1xuICBpZiAoZGF0YS5jaGFyQ29kZUF0KDApID09PSAweEZFRkYpIGRhdGEgPSBkYXRhLnNsaWNlKDEpO1xuXG4gIHRyeSB7IHJldHVybiBKU09OLnBhcnNlKGRhdGEpOyB9XG4gIGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfVxufVxuXG4vKipcbiAqIEZpbmQgcGFja2FnZS5qc29uIGZpbGVzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gcm9vdCBUaGUgcm9vdCBkaXJlY3Rvcnkgd2Ugc2hvdWxkIHN0YXJ0IHNlYXJjaGluZyBpbi5cbiAqIEByZXR1cm5zIHtPYmplY3R9IEl0ZXJhdG9yIGludGVyZmFjZS5cbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZpbmQocm9vdCkge1xuICByb290ID0gcm9vdCB8fCBwcm9jZXNzLmN3ZCgpO1xuICBpZiAodHlwZW9mIHJvb3QgIT09IFwic3RyaW5nXCIpIHtcbiAgICBpZiAodHlwZW9mIHJvb3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHJvb3QuZmlsZW5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICByb290ID0gcm9vdC5maWxlbmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwYXNzIGEgZmlsZW5hbWUgc3RyaW5nIG9yIGEgbW9kdWxlIG9iamVjdCB0byBmaW5kZXJcIik7XG4gICAgfVxuICB9XG4gIHJldHVybiB7XG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBwYXJzZWQgcGFja2FnZS5qc29uIHRoYXQgd2UgZmluZCBpbiBhIHBhcmVudCBmb2xkZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBWYWx1ZSwgZmlsZW5hbWUgYW5kIGluZGljYXRpb24gaWYgdGhlIGl0ZXJhdGlvbiBpcyBkb25lLlxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICovXG4gICAgbmV4dDogZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgIGlmIChyb290Lm1hdGNoKC9eKFxcdzpcXFxcfFxcLykkLykpIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiB1bmRlZmluZWQsXG4gICAgICAgIGZpbGVuYW1lOiB1bmRlZmluZWQsXG4gICAgICAgIGRvbmU6IHRydWVcbiAgICAgIH07XG5cbiAgICAgIHZhciBmaWxlID0gcGF0aC5qb2luKHJvb3QsICdwYWNrYWdlLmpzb24nKVxuICAgICAgICAsIGRhdGE7XG5cbiAgICAgIHJvb3QgPSBwYXRoLnJlc29sdmUocm9vdCwgJy4uJyk7XG5cbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGUpICYmIChkYXRhID0gcGFyc2UoZnMucmVhZEZpbGVTeW5jKGZpbGUpKSkpIHtcbiAgICAgICAgZGF0YS5fX3BhdGggPSBmaWxlO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdmFsdWU6IGRhdGEsXG4gICAgICAgICAgZmlsZW5hbWU6IGZpbGUsXG4gICAgICAgICAgZG9uZTogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICB9XG4gIH07XG59O1xuIl19