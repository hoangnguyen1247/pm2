"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var MeanCalc = /*#__PURE__*/function () {
  function MeanCalc(count) {
    (0, _classCallCheck2["default"])(this, MeanCalc);
    (0, _defineProperty2["default"])(this, "metrics", void 0);
    (0, _defineProperty2["default"])(this, "count", void 0);
    this.metrics = [];
    this.count = count;
  }

  (0, _createClass2["default"])(MeanCalc, [{
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9TeXNpbmZvL01lYW5DYWxjLnRzIl0sIm5hbWVzIjpbIk1lYW5DYWxjIiwiY291bnQiLCJtZXRyaWNzIiwidmFsIiwidmFsdWUiLCJsZW5ndGgiLCJzaGlmdCIsInB1c2giLCJzdW0iLCJyZWR1Y2UiLCJwcmV2IiwiY3VyciIsIk1hdGgiLCJmbG9vciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0lBQ01BLFE7QUFJSixvQkFBWUMsS0FBWixFQUFtQjtBQUFBO0FBQUE7QUFBQTtBQUNqQixTQUFLQyxPQUFMLEdBQWUsRUFBZjtBQUNBLFNBQUtELEtBQUwsR0FBYUEsS0FBYjtBQUNEOzs7OzhCQUVTO0FBQ1IsYUFBTyxLQUFLRSxHQUFMLEVBQVA7QUFDRDs7O3dCQUVHQyxLLEVBQU87QUFDVCxVQUFJLEtBQUtGLE9BQUwsQ0FBYUcsTUFBYixJQUF1QixLQUFLSixLQUFoQyxFQUF1QztBQUNyQyxhQUFLQyxPQUFMLENBQWFJLEtBQWI7QUFDRDs7QUFDRCxXQUFLSixPQUFMLENBQWFLLElBQWIsQ0FBa0JILEtBQWxCO0FBQ0Q7OzswQkFFSztBQUNKLFVBQUksS0FBS0YsT0FBTCxDQUFhRyxNQUFiLElBQXVCLENBQTNCLEVBQThCLE9BQU8sQ0FBUDtBQUM5QixVQUFJRyxHQUFHLEdBQUcsS0FBS04sT0FBTCxDQUFhTyxNQUFiLENBQW9CLFVBQUNDLElBQUQsRUFBT0MsSUFBUDtBQUFBLGVBQWdCQSxJQUFJLElBQUlELElBQXhCO0FBQUEsT0FBcEIsQ0FBVjtBQUNBLGFBQU9FLElBQUksQ0FBQ0MsS0FBTCxDQUFZTCxHQUFHLEdBQUcsS0FBS04sT0FBTCxDQUFhRyxNQUFwQixHQUE4QixJQUF6QyxJQUFpRCxJQUF4RDtBQUNEOzs7OztlQUdZTCxRIiwic291cmNlc0NvbnRlbnQiOlsiXG5jbGFzcyBNZWFuQ2FsYyB7XG4gIG1ldHJpY3M6IGFueVtdO1xuICBjb3VudDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKGNvdW50KSB7XG4gICAgdGhpcy5tZXRyaWNzID0gW11cbiAgICB0aGlzLmNvdW50ID0gY291bnRcbiAgfVxuXG4gIGluc3BlY3QoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsKClcbiAgfVxuXG4gIGFkZCh2YWx1ZSkge1xuICAgIGlmICh0aGlzLm1ldHJpY3MubGVuZ3RoID49IHRoaXMuY291bnQpIHtcbiAgICAgIHRoaXMubWV0cmljcy5zaGlmdCgpXG4gICAgfVxuICAgIHRoaXMubWV0cmljcy5wdXNoKHZhbHVlKVxuICB9XG5cbiAgdmFsKCkge1xuICAgIGlmICh0aGlzLm1ldHJpY3MubGVuZ3RoID09IDApIHJldHVybiAwXG4gICAgbGV0IHN1bSA9IHRoaXMubWV0cmljcy5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IGN1cnIgKz0gcHJldilcbiAgICByZXR1cm4gTWF0aC5mbG9vcigoc3VtIC8gdGhpcy5tZXRyaWNzLmxlbmd0aCkgKiAxMDAwKSAvIDEwMDBcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNZWFuQ2FsY1xuIl19