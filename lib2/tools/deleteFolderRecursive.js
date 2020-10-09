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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9kZWxldGVGb2xkZXJSZWN1cnNpdmUudHMiXSwibmFtZXMiOlsiZGVsZXRlRm9sZGVyUmVjdXJzaXZlIiwicGF0aCIsImZzIiwiZXhpc3RzU3luYyIsInJlYWRkaXJTeW5jIiwiZm9yRWFjaCIsImZpbGUiLCJpbmRleCIsImN1clBhdGgiLCJQYXRoIiwiam9pbiIsImxzdGF0U3luYyIsImlzRGlyZWN0b3J5IiwidW5saW5rU3luYyIsInJtZGlyU3luYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUNBOztBQUNBOzs7O0FBRUEsSUFBTUEscUJBQXFCLEdBQUcsU0FBeEJBLHFCQUF3QixDQUFTQyxJQUFULEVBQWU7QUFDM0MsTUFBSUMsZUFBR0MsVUFBSCxDQUFjRixJQUFkLENBQUosRUFBeUI7QUFDdkJDLG1CQUFHRSxXQUFILENBQWVILElBQWYsRUFBcUJJLE9BQXJCLENBQTZCLFVBQUNDLElBQUQsRUFBT0MsS0FBUCxFQUFpQjtBQUM1QyxVQUFNQyxPQUFPLEdBQUdDLGlCQUFLQyxJQUFMLENBQVVULElBQVYsRUFBZ0JLLElBQWhCLENBQWhCOztBQUNBLFVBQUlKLGVBQUdTLFNBQUgsQ0FBYUgsT0FBYixFQUFzQkksV0FBdEIsRUFBSixFQUF5QztBQUFFO0FBQ3pDWixRQUFBQSxxQkFBcUIsQ0FBQ1EsT0FBRCxDQUFyQjtBQUNELE9BRkQsTUFFTztBQUFFO0FBQ1BOLHVCQUFHVyxVQUFILENBQWNMLE9BQWQ7QUFDRDtBQUNGLEtBUEQ7O0FBUUFOLG1CQUFHWSxTQUFILENBQWFiLElBQWI7QUFDRDtBQUNGLENBWkQ7O2VBY2VELHFCIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IFBhdGggZnJvbSAncGF0aCc7XG5cbmNvbnN0IGRlbGV0ZUZvbGRlclJlY3Vyc2l2ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgaWYgKGZzLmV4aXN0c1N5bmMocGF0aCkpIHtcbiAgICBmcy5yZWFkZGlyU3luYyhwYXRoKS5mb3JFYWNoKChmaWxlLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgY3VyUGF0aCA9IFBhdGguam9pbihwYXRoLCBmaWxlKTtcbiAgICAgIGlmIChmcy5sc3RhdFN5bmMoY3VyUGF0aCkuaXNEaXJlY3RvcnkoKSkgeyAvLyByZWN1cnNlXG4gICAgICAgIGRlbGV0ZUZvbGRlclJlY3Vyc2l2ZShjdXJQYXRoKTtcbiAgICAgIH0gZWxzZSB7IC8vIGRlbGV0ZSBmaWxlXG4gICAgICAgIGZzLnVubGlua1N5bmMoY3VyUGF0aCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZnMucm1kaXJTeW5jKHBhdGgpO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWxldGVGb2xkZXJSZWN1cnNpdmVcbiJdfQ==