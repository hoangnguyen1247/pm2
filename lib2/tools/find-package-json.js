'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = find;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

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
    if ((0, _typeof2["default"])(root) === "object" && typeof root.filename === 'string') {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9maW5kLXBhY2thZ2UtanNvbi50cyJdLCJuYW1lcyI6WyJwYXJzZSIsImRhdGEiLCJ0b1N0cmluZyIsImNoYXJDb2RlQXQiLCJzbGljZSIsIkpTT04iLCJlIiwiZmluZCIsInJvb3QiLCJwcm9jZXNzIiwiY3dkIiwiZmlsZW5hbWUiLCJFcnJvciIsIm5leHQiLCJtYXRjaCIsInZhbHVlIiwidW5kZWZpbmVkIiwiZG9uZSIsImZpbGUiLCJwYXRoIiwiam9pbiIsInJlc29sdmUiLCJmcyIsImV4aXN0c1N5bmMiLCJyZWFkRmlsZVN5bmMiLCJfX3BhdGgiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQUVBOztBQUNBOztBQUVBOzs7Ozs7O0FBT0EsU0FBU0EsS0FBVCxDQUFlQyxJQUFmLEVBQXFCO0FBQ25CQSxFQUFBQSxJQUFJLEdBQUdBLElBQUksQ0FBQ0MsUUFBTCxDQUFjLE9BQWQsQ0FBUCxDQURtQixDQUduQjtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxNQUFJRCxJQUFJLENBQUNFLFVBQUwsQ0FBZ0IsQ0FBaEIsTUFBdUIsTUFBM0IsRUFBbUNGLElBQUksR0FBR0EsSUFBSSxDQUFDRyxLQUFMLENBQVcsQ0FBWCxDQUFQOztBQUVuQyxNQUFJO0FBQUUsV0FBT0MsSUFBSSxDQUFDTCxLQUFMLENBQVdDLElBQVgsQ0FBUDtBQUEwQixHQUFoQyxDQUNBLE9BQU9LLENBQVAsRUFBVTtBQUFFLFdBQU8sS0FBUDtBQUFlO0FBQzVCO0FBRUQ7Ozs7Ozs7OztBQU9lLFNBQVNDLElBQVQsQ0FBY0MsSUFBZCxFQUFvQjtBQUNqQ0EsRUFBQUEsSUFBSSxHQUFHQSxJQUFJLElBQUlDLE9BQU8sQ0FBQ0MsR0FBUixFQUFmOztBQUNBLE1BQUksT0FBT0YsSUFBUCxLQUFnQixRQUFwQixFQUE4QjtBQUM1QixRQUFJLHlCQUFPQSxJQUFQLE1BQWdCLFFBQWhCLElBQTRCLE9BQU9BLElBQUksQ0FBQ0csUUFBWixLQUF5QixRQUF6RCxFQUFtRTtBQUNqRUgsTUFBQUEsSUFBSSxHQUFHQSxJQUFJLENBQUNHLFFBQVo7QUFDRCxLQUZELE1BRU87QUFDTCxZQUFNLElBQUlDLEtBQUosQ0FBVSwwREFBVixDQUFOO0FBQ0Q7QUFDRjs7QUFDRCxTQUFPO0FBQ0w7Ozs7OztBQU1BQyxJQUFBQSxJQUFJLEVBQUUsU0FBU0EsSUFBVCxHQUFnQjtBQUNwQixVQUFJTCxJQUFJLENBQUNNLEtBQUwsQ0FBVyxjQUFYLENBQUosRUFBZ0MsT0FBTztBQUNyQ0MsUUFBQUEsS0FBSyxFQUFFQyxTQUQ4QjtBQUVyQ0wsUUFBQUEsUUFBUSxFQUFFSyxTQUYyQjtBQUdyQ0MsUUFBQUEsSUFBSSxFQUFFO0FBSCtCLE9BQVA7O0FBTWhDLFVBQUlDLElBQUksR0FBR0MsaUJBQUtDLElBQUwsQ0FBVVosSUFBVixFQUFnQixjQUFoQixDQUFYO0FBQUEsVUFDSVAsSUFESjs7QUFHQU8sTUFBQUEsSUFBSSxHQUFHVyxpQkFBS0UsT0FBTCxDQUFhYixJQUFiLEVBQW1CLElBQW5CLENBQVA7O0FBRUEsVUFBSWMsZUFBR0MsVUFBSCxDQUFjTCxJQUFkLE1BQXdCakIsSUFBSSxHQUFHRCxLQUFLLENBQUNzQixlQUFHRSxZQUFILENBQWdCTixJQUFoQixDQUFELENBQXBDLENBQUosRUFBa0U7QUFDaEVqQixRQUFBQSxJQUFJLENBQUN3QixNQUFMLEdBQWNQLElBQWQ7QUFFQSxlQUFPO0FBQ0xILFVBQUFBLEtBQUssRUFBRWQsSUFERjtBQUVMVSxVQUFBQSxRQUFRLEVBQUVPLElBRkw7QUFHTEQsVUFBQUEsSUFBSSxFQUFFO0FBSEQsU0FBUDtBQUtEOztBQUVELGFBQU9KLElBQUksRUFBWDtBQUNEO0FBOUJJLEdBQVA7QUFnQ0Q7O0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbi8qKlxuICogQXR0ZW1wdCB0byBzb21ld2hhdCBzYWZlbHkgcGFyc2UgdGhlIEpTT04uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGRhdGEgSlNPTiBibG9iIHRoYXQgbmVlZHMgdG8gYmUgcGFyc2VkLlxuICogQHJldHVybnMge09iamVjdHxmYWxzZX0gUGFyc2VkIEpTT04gb3IgZmFsc2UuXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gcGFyc2UoZGF0YSkge1xuICBkYXRhID0gZGF0YS50b1N0cmluZygndXRmLTgnKTtcblxuICAvL1xuICAvLyBSZW1vdmUgYSBwb3NzaWJsZSBVVEYtOCBCT00gKGJ5dGUgb3JkZXIgbWFya2VyKSBhcyB0aGlzIGNhbiBsZWFkIHRvIHBhcnNlXG4gIC8vIHZhbHVlcyB3aGVuIHBhc3NlZCBpbiB0byB0aGUgSlNPTi5wYXJzZS5cbiAgLy9cbiAgaWYgKGRhdGEuY2hhckNvZGVBdCgwKSA9PT0gMHhGRUZGKSBkYXRhID0gZGF0YS5zbGljZSgxKTtcblxuICB0cnkgeyByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTsgfVxuICBjYXRjaCAoZSkgeyByZXR1cm4gZmFsc2U7IH1cbn1cblxuLyoqXG4gKiBGaW5kIHBhY2thZ2UuanNvbiBmaWxlcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHJvb3QgVGhlIHJvb3QgZGlyZWN0b3J5IHdlIHNob3VsZCBzdGFydCBzZWFyY2hpbmcgaW4uXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBJdGVyYXRvciBpbnRlcmZhY2UuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmaW5kKHJvb3QpIHtcbiAgcm9vdCA9IHJvb3QgfHwgcHJvY2Vzcy5jd2QoKTtcbiAgaWYgKHR5cGVvZiByb290ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgaWYgKHR5cGVvZiByb290ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiByb290LmZpbGVuYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgcm9vdCA9IHJvb3QuZmlsZW5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcGFzcyBhIGZpbGVuYW1lIHN0cmluZyBvciBhIG1vZHVsZSBvYmplY3QgdG8gZmluZGVyXCIpO1xuICAgIH1cbiAgfVxuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgcGFyc2VkIHBhY2thZ2UuanNvbiB0aGF0IHdlIGZpbmQgaW4gYSBwYXJlbnQgZm9sZGVyLlxuICAgICAqXG4gICAgICogQHJldHVybnMge09iamVjdH0gVmFsdWUsIGZpbGVuYW1lIGFuZCBpbmRpY2F0aW9uIGlmIHRoZSBpdGVyYXRpb24gaXMgZG9uZS5cbiAgICAgKiBAYXBpIHB1YmxpY1xuICAgICAqL1xuICAgIG5leHQ6IGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICBpZiAocm9vdC5tYXRjaCgvXihcXHc6XFxcXHxcXC8pJC8pKSByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdW5kZWZpbmVkLFxuICAgICAgICBmaWxlbmFtZTogdW5kZWZpbmVkLFxuICAgICAgICBkb25lOiB0cnVlXG4gICAgICB9O1xuXG4gICAgICB2YXIgZmlsZSA9IHBhdGguam9pbihyb290LCAncGFja2FnZS5qc29uJylcbiAgICAgICAgLCBkYXRhO1xuXG4gICAgICByb290ID0gcGF0aC5yZXNvbHZlKHJvb3QsICcuLicpO1xuXG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhmaWxlKSAmJiAoZGF0YSA9IHBhcnNlKGZzLnJlYWRGaWxlU3luYyhmaWxlKSkpKSB7XG4gICAgICAgIGRhdGEuX19wYXRoID0gZmlsZTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHZhbHVlOiBkYXRhLFxuICAgICAgICAgIGZpbGVuYW1lOiBmaWxlLFxuICAgICAgICAgIGRvbmU6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgfVxuICB9O1xufTtcbiJdfQ==