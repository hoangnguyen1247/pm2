"use strict";

var io = require('@pm2/io'); // Straight Metric


var user_count = 10;
var users = io.metric({
  name: 'CM: Realtime user',
  value: function value() {
    return user_count;
  }
}); // or users.set(user_count)
// Counter (.inc() .dec())

var currentReq = io.counter({
  name: 'CM: Current Processing',
  type: 'counter'
});
setInterval(function () {
  currentReq.inc();
}, 1000); // Meter

var reqsec = io.meter({
  name: 'CM: req/sec'
});
setInterval(function () {
  reqsec.mark();
}, 100); // Histogram

var latency = io.histogram({
  name: 'CM: latency'
});
var latencyValue = 0;
setInterval(function () {
  latencyValue = Math.round(Math.random() * 100);
  latency.update(latencyValue);
}, 100); ////////////////////
// Custom Actions //
////////////////////

io.action('add user', function (done) {
  user_count++;
  done({
    success: true
  });
});
io.action('remove user', function (done) {
  user_count++;
  done({
    success: true
  });
});
io.action('with params', function (arg, done) {
  console.log(arg);
  done({
    success: arg
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90ZW1wbGF0ZXMvc2FtcGxlLWFwcHMvcG0yLXBsdXMtbWV0cmljcy1hY3Rpb25zL2N1c3RvbS1tZXRyaWNzLmpzIl0sIm5hbWVzIjpbImlvIiwicmVxdWlyZSIsInVzZXJfY291bnQiLCJ1c2VycyIsIm1ldHJpYyIsIm5hbWUiLCJ2YWx1ZSIsImN1cnJlbnRSZXEiLCJjb3VudGVyIiwidHlwZSIsInNldEludGVydmFsIiwiaW5jIiwicmVxc2VjIiwibWV0ZXIiLCJtYXJrIiwibGF0ZW5jeSIsImhpc3RvZ3JhbSIsImxhdGVuY3lWYWx1ZSIsIk1hdGgiLCJyb3VuZCIsInJhbmRvbSIsInVwZGF0ZSIsImFjdGlvbiIsImRvbmUiLCJzdWNjZXNzIiwiYXJnIiwiY29uc29sZSIsImxvZyJdLCJtYXBwaW5ncyI6Ijs7QUFDQSxJQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBQyxTQUFELENBQWxCLEMsQ0FFQTs7O0FBQ0EsSUFBSUMsVUFBVSxHQUFHLEVBQWpCO0FBRUEsSUFBTUMsS0FBSyxHQUFHSCxFQUFFLENBQUNJLE1BQUgsQ0FBVTtBQUN0QkMsRUFBQUEsSUFBSSxFQUFFLG1CQURnQjtBQUV0QkMsRUFBQUEsS0FBSyxFQUFFLGlCQUFNO0FBQ1gsV0FBT0osVUFBUDtBQUNEO0FBSnFCLENBQVYsQ0FBZCxDLENBT0E7QUFFQTs7QUFDQSxJQUFNSyxVQUFVLEdBQUdQLEVBQUUsQ0FBQ1EsT0FBSCxDQUFXO0FBQzVCSCxFQUFBQSxJQUFJLEVBQUUsd0JBRHNCO0FBRTVCSSxFQUFBQSxJQUFJLEVBQUU7QUFGc0IsQ0FBWCxDQUFuQjtBQUtBQyxXQUFXLENBQUMsWUFBTTtBQUNoQkgsRUFBQUEsVUFBVSxDQUFDSSxHQUFYO0FBQ0QsQ0FGVSxFQUVSLElBRlEsQ0FBWCxDLENBSUE7O0FBQ0EsSUFBTUMsTUFBTSxHQUFHWixFQUFFLENBQUNhLEtBQUgsQ0FBUztBQUN0QlIsRUFBQUEsSUFBSSxFQUFFO0FBRGdCLENBQVQsQ0FBZjtBQUlBSyxXQUFXLENBQUMsWUFBTTtBQUNoQkUsRUFBQUEsTUFBTSxDQUFDRSxJQUFQO0FBQ0QsQ0FGVSxFQUVSLEdBRlEsQ0FBWCxDLENBS0E7O0FBQ0EsSUFBTUMsT0FBTyxHQUFHZixFQUFFLENBQUNnQixTQUFILENBQWE7QUFDM0JYLEVBQUFBLElBQUksRUFBRTtBQURxQixDQUFiLENBQWhCO0FBSUEsSUFBSVksWUFBWSxHQUFHLENBQW5CO0FBRUFQLFdBQVcsQ0FBQyxZQUFNO0FBQ2hCTyxFQUFBQSxZQUFZLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFXRCxJQUFJLENBQUNFLE1BQUwsS0FBZ0IsR0FBM0IsQ0FBZjtBQUNBTCxFQUFBQSxPQUFPLENBQUNNLE1BQVIsQ0FBZUosWUFBZjtBQUNELENBSFUsRUFHUixHQUhRLENBQVgsQyxDQU1BO0FBQ0E7QUFDQTs7QUFFQWpCLEVBQUUsQ0FBQ3NCLE1BQUgsQ0FBVSxVQUFWLEVBQXNCLFVBQUNDLElBQUQsRUFBVTtBQUM5QnJCLEVBQUFBLFVBQVU7QUFDVnFCLEVBQUFBLElBQUksQ0FBQztBQUFDQyxJQUFBQSxPQUFPLEVBQUM7QUFBVCxHQUFELENBQUo7QUFDRCxDQUhEO0FBS0F4QixFQUFFLENBQUNzQixNQUFILENBQVUsYUFBVixFQUF5QixVQUFDQyxJQUFELEVBQVU7QUFDakNyQixFQUFBQSxVQUFVO0FBQ1ZxQixFQUFBQSxJQUFJLENBQUM7QUFBQ0MsSUFBQUEsT0FBTyxFQUFDO0FBQVQsR0FBRCxDQUFKO0FBQ0QsQ0FIRDtBQUtBeEIsRUFBRSxDQUFDc0IsTUFBSCxDQUFVLGFBQVYsRUFBeUIsVUFBQ0csR0FBRCxFQUFNRixJQUFOLEVBQWU7QUFDdENHLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZRixHQUFaO0FBQ0FGLEVBQUFBLElBQUksQ0FBQztBQUFDQyxJQUFBQSxPQUFPLEVBQUNDO0FBQVQsR0FBRCxDQUFKO0FBQ0QsQ0FIRCIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5jb25zdCBpbyA9IHJlcXVpcmUoJ0BwbTIvaW8nKVxyXG5cclxuLy8gU3RyYWlnaHQgTWV0cmljXHJcbnZhciB1c2VyX2NvdW50ID0gMTBcclxuXHJcbmNvbnN0IHVzZXJzID0gaW8ubWV0cmljKHtcclxuICBuYW1lOiAnQ006IFJlYWx0aW1lIHVzZXInLFxyXG4gIHZhbHVlOiAoKSA9PiB7XHJcbiAgICByZXR1cm4gdXNlcl9jb3VudFxyXG4gIH1cclxufSlcclxuXHJcbi8vIG9yIHVzZXJzLnNldCh1c2VyX2NvdW50KVxyXG5cclxuLy8gQ291bnRlciAoLmluYygpIC5kZWMoKSlcclxuY29uc3QgY3VycmVudFJlcSA9IGlvLmNvdW50ZXIoe1xyXG4gIG5hbWU6ICdDTTogQ3VycmVudCBQcm9jZXNzaW5nJyxcclxuICB0eXBlOiAnY291bnRlcidcclxufSlcclxuXHJcbnNldEludGVydmFsKCgpID0+IHtcclxuICBjdXJyZW50UmVxLmluYygpXHJcbn0sIDEwMDApXHJcblxyXG4vLyBNZXRlclxyXG5jb25zdCByZXFzZWMgPSBpby5tZXRlcih7XHJcbiAgbmFtZTogJ0NNOiByZXEvc2VjJ1xyXG59KVxyXG5cclxuc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gIHJlcXNlYy5tYXJrKClcclxufSwgMTAwKVxyXG5cclxuXHJcbi8vIEhpc3RvZ3JhbVxyXG5jb25zdCBsYXRlbmN5ID0gaW8uaGlzdG9ncmFtKHtcclxuICBuYW1lOiAnQ006IGxhdGVuY3knXHJcbn0pO1xyXG5cclxudmFyIGxhdGVuY3lWYWx1ZSA9IDA7XHJcblxyXG5zZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgbGF0ZW5jeVZhbHVlID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMTAwKTtcclxuICBsYXRlbmN5LnVwZGF0ZShsYXRlbmN5VmFsdWUpO1xyXG59LCAxMDApXHJcblxyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gQ3VzdG9tIEFjdGlvbnMgLy9cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbmlvLmFjdGlvbignYWRkIHVzZXInLCAoZG9uZSkgPT4ge1xyXG4gIHVzZXJfY291bnQrK1xyXG4gIGRvbmUoe3N1Y2Nlc3M6dHJ1ZX0pXHJcbn0pXHJcblxyXG5pby5hY3Rpb24oJ3JlbW92ZSB1c2VyJywgKGRvbmUpID0+IHtcclxuICB1c2VyX2NvdW50KytcclxuICBkb25lKHtzdWNjZXNzOnRydWV9KVxyXG59KVxyXG5cclxuaW8uYWN0aW9uKCd3aXRoIHBhcmFtcycsIChhcmcsIGRvbmUpID0+IHtcclxuICBjb25zb2xlLmxvZyhhcmcpXHJcbiAgZG9uZSh7c3VjY2Vzczphcmd9KVxyXG59KVxyXG4iXX0=