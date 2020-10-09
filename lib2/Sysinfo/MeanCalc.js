"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var MeanCalc = /*#__PURE__*/function () {
  function MeanCalc(count) {
    _classCallCheck(this, MeanCalc);

    _defineProperty(this, "metrics", void 0);

    _defineProperty(this, "count", void 0);

    this.metrics = [];
    this.count = count;
  }

  _createClass(MeanCalc, [{
    key: "inspect",
    value: function inspect() {
      return this.val();
    }
  }, {
    key: "add",
    value: function add(value) {
      if (this.metrics.length >= this.count) {
        this.metrics.shift();
      }

      this.metrics.push(value);
    }
  }, {
    key: "val",
    value: function val() {
      if (this.metrics.length == 0) return 0;
      var sum = this.metrics.reduce(function (prev, curr) {
        return curr += prev;
      });
      return Math.floor(sum / this.metrics.length * 1000) / 1000;
    }
  }]);

  return MeanCalc;
}();

var _default = MeanCalc;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9TeXNpbmZvL01lYW5DYWxjLnRzIl0sIm5hbWVzIjpbIk1lYW5DYWxjIiwiY291bnQiLCJtZXRyaWNzIiwidmFsIiwidmFsdWUiLCJsZW5ndGgiLCJzaGlmdCIsInB1c2giLCJzdW0iLCJyZWR1Y2UiLCJwcmV2IiwiY3VyciIsIk1hdGgiLCJmbG9vciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0lBQ01BLFE7QUFJSixvQkFBWUMsS0FBWixFQUFtQjtBQUFBOztBQUFBOztBQUFBOztBQUNqQixTQUFLQyxPQUFMLEdBQWUsRUFBZjtBQUNBLFNBQUtELEtBQUwsR0FBYUEsS0FBYjtBQUNEOzs7OzhCQUVTO0FBQ1IsYUFBTyxLQUFLRSxHQUFMLEVBQVA7QUFDRDs7O3dCQUVHQyxLLEVBQU87QUFDVCxVQUFJLEtBQUtGLE9BQUwsQ0FBYUcsTUFBYixJQUF1QixLQUFLSixLQUFoQyxFQUF1QztBQUNyQyxhQUFLQyxPQUFMLENBQWFJLEtBQWI7QUFDRDs7QUFDRCxXQUFLSixPQUFMLENBQWFLLElBQWIsQ0FBa0JILEtBQWxCO0FBQ0Q7OzswQkFFSztBQUNKLFVBQUksS0FBS0YsT0FBTCxDQUFhRyxNQUFiLElBQXVCLENBQTNCLEVBQThCLE9BQU8sQ0FBUDtBQUM5QixVQUFJRyxHQUFHLEdBQUcsS0FBS04sT0FBTCxDQUFhTyxNQUFiLENBQW9CLFVBQUNDLElBQUQsRUFBT0MsSUFBUDtBQUFBLGVBQWdCQSxJQUFJLElBQUlELElBQXhCO0FBQUEsT0FBcEIsQ0FBVjtBQUNBLGFBQU9FLElBQUksQ0FBQ0MsS0FBTCxDQUFZTCxHQUFHLEdBQUcsS0FBS04sT0FBTCxDQUFhRyxNQUFwQixHQUE4QixJQUF6QyxJQUFpRCxJQUF4RDtBQUNEOzs7Ozs7ZUFHWUwsUSIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5jbGFzcyBNZWFuQ2FsYyB7XHJcbiAgbWV0cmljczogYW55W107XHJcbiAgY291bnQ6IG51bWJlcjtcclxuXHJcbiAgY29uc3RydWN0b3IoY291bnQpIHtcclxuICAgIHRoaXMubWV0cmljcyA9IFtdXHJcbiAgICB0aGlzLmNvdW50ID0gY291bnRcclxuICB9XHJcblxyXG4gIGluc3BlY3QoKSB7XHJcbiAgICByZXR1cm4gdGhpcy52YWwoKVxyXG4gIH1cclxuXHJcbiAgYWRkKHZhbHVlKSB7XHJcbiAgICBpZiAodGhpcy5tZXRyaWNzLmxlbmd0aCA+PSB0aGlzLmNvdW50KSB7XHJcbiAgICAgIHRoaXMubWV0cmljcy5zaGlmdCgpXHJcbiAgICB9XHJcbiAgICB0aGlzLm1ldHJpY3MucHVzaCh2YWx1ZSlcclxuICB9XHJcblxyXG4gIHZhbCgpIHtcclxuICAgIGlmICh0aGlzLm1ldHJpY3MubGVuZ3RoID09IDApIHJldHVybiAwXHJcbiAgICBsZXQgc3VtID0gdGhpcy5tZXRyaWNzLnJlZHVjZSgocHJldiwgY3VycikgPT4gY3VyciArPSBwcmV2KVxyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoKHN1bSAvIHRoaXMubWV0cmljcy5sZW5ndGgpICogMTAwMCkgLyAxMDAwXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBNZWFuQ2FsY1xyXG4iXX0=