"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var deleteFolderRecursive = function deleteFolderRecursive(path) {
  if (_fs["default"].existsSync(path)) {
    _fs["default"].readdirSync(path).forEach(function (file, index) {
      var curPath = _path["default"].join(path, file);

      if (_fs["default"].lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        _fs["default"].unlinkSync(curPath);
      }
    });

    _fs["default"].rmdirSync(path);
  }
};

var _default = deleteFolderRecursive;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9kZWxldGVGb2xkZXJSZWN1cnNpdmUudHMiXSwibmFtZXMiOlsiZGVsZXRlRm9sZGVyUmVjdXJzaXZlIiwicGF0aCIsImZzIiwiZXhpc3RzU3luYyIsInJlYWRkaXJTeW5jIiwiZm9yRWFjaCIsImZpbGUiLCJpbmRleCIsImN1clBhdGgiLCJQYXRoIiwiam9pbiIsImxzdGF0U3luYyIsImlzRGlyZWN0b3J5IiwidW5saW5rU3luYyIsInJtZGlyU3luYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUNBOztBQUNBOzs7O0FBRUEsSUFBTUEscUJBQXFCLEdBQUcsU0FBeEJBLHFCQUF3QixDQUFTQyxJQUFULEVBQWU7QUFDM0MsTUFBSUMsZUFBR0MsVUFBSCxDQUFjRixJQUFkLENBQUosRUFBeUI7QUFDdkJDLG1CQUFHRSxXQUFILENBQWVILElBQWYsRUFBcUJJLE9BQXJCLENBQTZCLFVBQUNDLElBQUQsRUFBT0MsS0FBUCxFQUFpQjtBQUM1QyxVQUFNQyxPQUFPLEdBQUdDLGlCQUFLQyxJQUFMLENBQVVULElBQVYsRUFBZ0JLLElBQWhCLENBQWhCOztBQUNBLFVBQUlKLGVBQUdTLFNBQUgsQ0FBYUgsT0FBYixFQUFzQkksV0FBdEIsRUFBSixFQUF5QztBQUFFO0FBQ3pDWixRQUFBQSxxQkFBcUIsQ0FBQ1EsT0FBRCxDQUFyQjtBQUNELE9BRkQsTUFFTztBQUFFO0FBQ1BOLHVCQUFHVyxVQUFILENBQWNMLE9BQWQ7QUFDRDtBQUNGLEtBUEQ7O0FBUUFOLG1CQUFHWSxTQUFILENBQWFiLElBQWI7QUFDRDtBQUNGLENBWkQ7O2VBY2VELHFCIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCBQYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuY29uc3QgZGVsZXRlRm9sZGVyUmVjdXJzaXZlID0gZnVuY3Rpb24ocGF0aCkge1xyXG4gIGlmIChmcy5leGlzdHNTeW5jKHBhdGgpKSB7XHJcbiAgICBmcy5yZWFkZGlyU3luYyhwYXRoKS5mb3JFYWNoKChmaWxlLCBpbmRleCkgPT4ge1xyXG4gICAgICBjb25zdCBjdXJQYXRoID0gUGF0aC5qb2luKHBhdGgsIGZpbGUpO1xyXG4gICAgICBpZiAoZnMubHN0YXRTeW5jKGN1clBhdGgpLmlzRGlyZWN0b3J5KCkpIHsgLy8gcmVjdXJzZVxyXG4gICAgICAgIGRlbGV0ZUZvbGRlclJlY3Vyc2l2ZShjdXJQYXRoKTtcclxuICAgICAgfSBlbHNlIHsgLy8gZGVsZXRlIGZpbGVcclxuICAgICAgICBmcy51bmxpbmtTeW5jKGN1clBhdGgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGZzLnJtZGlyU3luYyhwYXRoKTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWxldGVGb2xkZXJSZWN1cnNpdmVcclxuIl19