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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9maW5kLXBhY2thZ2UtanNvbi50cyJdLCJuYW1lcyI6WyJwYXJzZSIsImRhdGEiLCJ0b1N0cmluZyIsImNoYXJDb2RlQXQiLCJzbGljZSIsIkpTT04iLCJlIiwiZmluZCIsInJvb3QiLCJwcm9jZXNzIiwiY3dkIiwiZmlsZW5hbWUiLCJFcnJvciIsIm5leHQiLCJtYXRjaCIsInZhbHVlIiwidW5kZWZpbmVkIiwiZG9uZSIsImZpbGUiLCJwYXRoIiwiam9pbiIsInJlc29sdmUiLCJmcyIsImV4aXN0c1N5bmMiLCJyZWFkRmlsZVN5bmMiLCJfX3BhdGgiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBRUE7O0FBQ0E7Ozs7OztBQUVBOzs7Ozs7O0FBT0EsU0FBU0EsS0FBVCxDQUFlQyxJQUFmLEVBQXFCO0FBQ25CQSxFQUFBQSxJQUFJLEdBQUdBLElBQUksQ0FBQ0MsUUFBTCxDQUFjLE9BQWQsQ0FBUCxDQURtQixDQUduQjtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxNQUFJRCxJQUFJLENBQUNFLFVBQUwsQ0FBZ0IsQ0FBaEIsTUFBdUIsTUFBM0IsRUFBbUNGLElBQUksR0FBR0EsSUFBSSxDQUFDRyxLQUFMLENBQVcsQ0FBWCxDQUFQOztBQUVuQyxNQUFJO0FBQUUsV0FBT0MsSUFBSSxDQUFDTCxLQUFMLENBQVdDLElBQVgsQ0FBUDtBQUEwQixHQUFoQyxDQUNBLE9BQU9LLENBQVAsRUFBVTtBQUFFLFdBQU8sS0FBUDtBQUFlO0FBQzVCO0FBRUQ7Ozs7Ozs7OztBQU9lLFNBQVNDLElBQVQsQ0FBY0MsSUFBZCxFQUFvQjtBQUNqQ0EsRUFBQUEsSUFBSSxHQUFHQSxJQUFJLElBQUlDLE9BQU8sQ0FBQ0MsR0FBUixFQUFmOztBQUNBLE1BQUksT0FBT0YsSUFBUCxLQUFnQixRQUFwQixFQUE4QjtBQUM1QixRQUFJLFFBQU9BLElBQVAsTUFBZ0IsUUFBaEIsSUFBNEIsT0FBT0EsSUFBSSxDQUFDRyxRQUFaLEtBQXlCLFFBQXpELEVBQW1FO0FBQ2pFSCxNQUFBQSxJQUFJLEdBQUdBLElBQUksQ0FBQ0csUUFBWjtBQUNELEtBRkQsTUFFTztBQUNMLFlBQU0sSUFBSUMsS0FBSixDQUFVLDBEQUFWLENBQU47QUFDRDtBQUNGOztBQUNELFNBQU87QUFDTDs7Ozs7O0FBTUFDLElBQUFBLElBQUksRUFBRSxTQUFTQSxJQUFULEdBQWdCO0FBQ3BCLFVBQUlMLElBQUksQ0FBQ00sS0FBTCxDQUFXLGNBQVgsQ0FBSixFQUFnQyxPQUFPO0FBQ3JDQyxRQUFBQSxLQUFLLEVBQUVDLFNBRDhCO0FBRXJDTCxRQUFBQSxRQUFRLEVBQUVLLFNBRjJCO0FBR3JDQyxRQUFBQSxJQUFJLEVBQUU7QUFIK0IsT0FBUDs7QUFNaEMsVUFBSUMsSUFBSSxHQUFHQyxpQkFBS0MsSUFBTCxDQUFVWixJQUFWLEVBQWdCLGNBQWhCLENBQVg7QUFBQSxVQUNJUCxJQURKOztBQUdBTyxNQUFBQSxJQUFJLEdBQUdXLGlCQUFLRSxPQUFMLENBQWFiLElBQWIsRUFBbUIsSUFBbkIsQ0FBUDs7QUFFQSxVQUFJYyxlQUFHQyxVQUFILENBQWNMLElBQWQsTUFBd0JqQixJQUFJLEdBQUdELEtBQUssQ0FBQ3NCLGVBQUdFLFlBQUgsQ0FBZ0JOLElBQWhCLENBQUQsQ0FBcEMsQ0FBSixFQUFrRTtBQUNoRWpCLFFBQUFBLElBQUksQ0FBQ3dCLE1BQUwsR0FBY1AsSUFBZDtBQUVBLGVBQU87QUFDTEgsVUFBQUEsS0FBSyxFQUFFZCxJQURGO0FBRUxVLFVBQUFBLFFBQVEsRUFBRU8sSUFGTDtBQUdMRCxVQUFBQSxJQUFJLEVBQUU7QUFIRCxTQUFQO0FBS0Q7O0FBRUQsYUFBT0osSUFBSSxFQUFYO0FBQ0Q7QUE5QkksR0FBUDtBQWdDRDs7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXHJcbmltcG9ydCBmcyBmcm9tICdmcydcclxuXHJcbi8qKlxyXG4gKiBBdHRlbXB0IHRvIHNvbWV3aGF0IHNhZmVseSBwYXJzZSB0aGUgSlNPTi5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGRhdGEgSlNPTiBibG9iIHRoYXQgbmVlZHMgdG8gYmUgcGFyc2VkLlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fGZhbHNlfSBQYXJzZWQgSlNPTiBvciBmYWxzZS5cclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5mdW5jdGlvbiBwYXJzZShkYXRhKSB7XHJcbiAgZGF0YSA9IGRhdGEudG9TdHJpbmcoJ3V0Zi04Jyk7XHJcblxyXG4gIC8vXHJcbiAgLy8gUmVtb3ZlIGEgcG9zc2libGUgVVRGLTggQk9NIChieXRlIG9yZGVyIG1hcmtlcikgYXMgdGhpcyBjYW4gbGVhZCB0byBwYXJzZVxyXG4gIC8vIHZhbHVlcyB3aGVuIHBhc3NlZCBpbiB0byB0aGUgSlNPTi5wYXJzZS5cclxuICAvL1xyXG4gIGlmIChkYXRhLmNoYXJDb2RlQXQoMCkgPT09IDB4RkVGRikgZGF0YSA9IGRhdGEuc2xpY2UoMSk7XHJcblxyXG4gIHRyeSB7IHJldHVybiBKU09OLnBhcnNlKGRhdGEpOyB9XHJcbiAgY2F0Y2ggKGUpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGaW5kIHBhY2thZ2UuanNvbiBmaWxlcy5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSByb290IFRoZSByb290IGRpcmVjdG9yeSB3ZSBzaG91bGQgc3RhcnQgc2VhcmNoaW5nIGluLlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBJdGVyYXRvciBpbnRlcmZhY2UuXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmaW5kKHJvb3QpIHtcclxuICByb290ID0gcm9vdCB8fCBwcm9jZXNzLmN3ZCgpO1xyXG4gIGlmICh0eXBlb2Ygcm9vdCAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgaWYgKHR5cGVvZiByb290ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiByb290LmZpbGVuYW1lID09PSAnc3RyaW5nJykge1xyXG4gICAgICByb290ID0gcm9vdC5maWxlbmFtZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcGFzcyBhIGZpbGVuYW1lIHN0cmluZyBvciBhIG1vZHVsZSBvYmplY3QgdG8gZmluZGVyXCIpO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gdGhlIHBhcnNlZCBwYWNrYWdlLmpzb24gdGhhdCB3ZSBmaW5kIGluIGEgcGFyZW50IGZvbGRlci5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBWYWx1ZSwgZmlsZW5hbWUgYW5kIGluZGljYXRpb24gaWYgdGhlIGl0ZXJhdGlvbiBpcyBkb25lLlxyXG4gICAgICogQGFwaSBwdWJsaWNcclxuICAgICAqL1xyXG4gICAgbmV4dDogZnVuY3Rpb24gbmV4dCgpIHtcclxuICAgICAgaWYgKHJvb3QubWF0Y2goL14oXFx3OlxcXFx8XFwvKSQvKSkgcmV0dXJuIHtcclxuICAgICAgICB2YWx1ZTogdW5kZWZpbmVkLFxyXG4gICAgICAgIGZpbGVuYW1lOiB1bmRlZmluZWQsXHJcbiAgICAgICAgZG9uZTogdHJ1ZVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgdmFyIGZpbGUgPSBwYXRoLmpvaW4ocm9vdCwgJ3BhY2thZ2UuanNvbicpXHJcbiAgICAgICAgLCBkYXRhO1xyXG5cclxuICAgICAgcm9vdCA9IHBhdGgucmVzb2x2ZShyb290LCAnLi4nKTtcclxuXHJcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGUpICYmIChkYXRhID0gcGFyc2UoZnMucmVhZEZpbGVTeW5jKGZpbGUpKSkpIHtcclxuICAgICAgICBkYXRhLl9fcGF0aCA9IGZpbGU7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICB2YWx1ZTogZGF0YSxcclxuICAgICAgICAgIGZpbGVuYW1lOiBmaWxlLFxyXG4gICAgICAgICAgZG9uZTogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbmV4dCgpO1xyXG4gICAgfVxyXG4gIH07XHJcbn07XHJcbiJdfQ==