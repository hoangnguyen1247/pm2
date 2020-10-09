"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _Utility = _interopRequireDefault(require("./Utility"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
function _default(God) {
  God.notify = function (action_name, data, manually) {
    God.bus.emit('process:event', {
      event: action_name,
      manually: typeof manually == 'undefined' ? false : true,
      process: _Utility["default"].formatCLU(data),
      at: _Utility["default"].getDate()
    });
  };

  God.notifyByProcessId = function (opts, cb) {
    if (typeof opts.id === 'undefined') {
      return cb(new Error('process id missing'));
    }

    var proc = God.clusters_db[opts.id];

    if (!proc) {
      return cb(new Error('process id doesnt exists'));
    }

    God.bus.emit('process:event', {
      event: opts.action_name,
      manually: typeof opts.manually == 'undefined' ? false : true,
      process: _Utility["default"].formatCLU(proc),
      at: _Utility["default"].getDate()
    });
    process.nextTick(function () {
      return cb ? cb(null) : false;
    });
    return false;
  };
}

;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9FdmVudC50cyJdLCJuYW1lcyI6WyJHb2QiLCJub3RpZnkiLCJhY3Rpb25fbmFtZSIsImRhdGEiLCJtYW51YWxseSIsImJ1cyIsImVtaXQiLCJldmVudCIsInByb2Nlc3MiLCJVdGlsaXR5IiwiZm9ybWF0Q0xVIiwiYXQiLCJnZXREYXRlIiwibm90aWZ5QnlQcm9jZXNzSWQiLCJvcHRzIiwiY2IiLCJpZCIsIkVycm9yIiwicHJvYyIsImNsdXN0ZXJzX2RiIiwibmV4dFRpY2siXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFNQTs7OztBQU5BOzs7OztBQVFlLGtCQUFVQSxHQUFWLEVBQWU7QUFFNUJBLEVBQUFBLEdBQUcsQ0FBQ0MsTUFBSixHQUFhLFVBQVVDLFdBQVYsRUFBdUJDLElBQXZCLEVBQTZCQyxRQUE3QixFQUF1QztBQUNsREosSUFBQUEsR0FBRyxDQUFDSyxHQUFKLENBQVFDLElBQVIsQ0FBYSxlQUFiLEVBQThCO0FBQzVCQyxNQUFBQSxLQUFLLEVBQUVMLFdBRHFCO0FBRTVCRSxNQUFBQSxRQUFRLEVBQUUsT0FBUUEsUUFBUixJQUFxQixXQUFyQixHQUFtQyxLQUFuQyxHQUEyQyxJQUZ6QjtBQUc1QkksTUFBQUEsT0FBTyxFQUFFQyxvQkFBUUMsU0FBUixDQUFrQlAsSUFBbEIsQ0FIbUI7QUFJNUJRLE1BQUFBLEVBQUUsRUFBRUYsb0JBQVFHLE9BQVI7QUFKd0IsS0FBOUI7QUFNRCxHQVBEOztBQVNBWixFQUFBQSxHQUFHLENBQUNhLGlCQUFKLEdBQXdCLFVBQVVDLElBQVYsRUFBZ0JDLEVBQWhCLEVBQW9CO0FBQzFDLFFBQUksT0FBUUQsSUFBSSxDQUFDRSxFQUFiLEtBQXFCLFdBQXpCLEVBQXNDO0FBQUUsYUFBT0QsRUFBRSxDQUFDLElBQUlFLEtBQUosQ0FBVSxvQkFBVixDQUFELENBQVQ7QUFBNkM7O0FBQ3JGLFFBQUlDLElBQUksR0FBR2xCLEdBQUcsQ0FBQ21CLFdBQUosQ0FBZ0JMLElBQUksQ0FBQ0UsRUFBckIsQ0FBWDs7QUFDQSxRQUFJLENBQUNFLElBQUwsRUFBVztBQUFFLGFBQU9ILEVBQUUsQ0FBQyxJQUFJRSxLQUFKLENBQVUsMEJBQVYsQ0FBRCxDQUFUO0FBQW1EOztBQUVoRWpCLElBQUFBLEdBQUcsQ0FBQ0ssR0FBSixDQUFRQyxJQUFSLENBQWEsZUFBYixFQUE4QjtBQUM1QkMsTUFBQUEsS0FBSyxFQUFFTyxJQUFJLENBQUNaLFdBRGdCO0FBRTVCRSxNQUFBQSxRQUFRLEVBQUUsT0FBUVUsSUFBSSxDQUFDVixRQUFiLElBQTBCLFdBQTFCLEdBQXdDLEtBQXhDLEdBQWdELElBRjlCO0FBRzVCSSxNQUFBQSxPQUFPLEVBQUVDLG9CQUFRQyxTQUFSLENBQWtCUSxJQUFsQixDQUhtQjtBQUk1QlAsTUFBQUEsRUFBRSxFQUFFRixvQkFBUUcsT0FBUjtBQUp3QixLQUE5QjtBQU9BSixJQUFBQSxPQUFPLENBQUNZLFFBQVIsQ0FBaUIsWUFBWTtBQUMzQixhQUFPTCxFQUFFLEdBQUdBLEVBQUUsQ0FBQyxJQUFELENBQUwsR0FBYyxLQUF2QjtBQUNELEtBRkQ7QUFHQSxXQUFPLEtBQVA7QUFDRCxHQWhCRDtBQWlCRDs7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcclxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXHJcbiAqL1xyXG5cclxuaW1wb3J0IFV0aWxpdHkgZnJvbSAnLi9VdGlsaXR5JztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChHb2QpIHtcclxuXHJcbiAgR29kLm5vdGlmeSA9IGZ1bmN0aW9uIChhY3Rpb25fbmFtZSwgZGF0YSwgbWFudWFsbHkpIHtcclxuICAgIEdvZC5idXMuZW1pdCgncHJvY2VzczpldmVudCcsIHtcclxuICAgICAgZXZlbnQ6IGFjdGlvbl9uYW1lLFxyXG4gICAgICBtYW51YWxseTogdHlwZW9mIChtYW51YWxseSkgPT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IHRydWUsXHJcbiAgICAgIHByb2Nlc3M6IFV0aWxpdHkuZm9ybWF0Q0xVKGRhdGEpLFxyXG4gICAgICBhdDogVXRpbGl0eS5nZXREYXRlKClcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIEdvZC5ub3RpZnlCeVByb2Nlc3NJZCA9IGZ1bmN0aW9uIChvcHRzLCBjYikge1xyXG4gICAgaWYgKHR5cGVvZiAob3B0cy5pZCkgPT09ICd1bmRlZmluZWQnKSB7IHJldHVybiBjYihuZXcgRXJyb3IoJ3Byb2Nlc3MgaWQgbWlzc2luZycpKTsgfVxyXG4gICAgdmFyIHByb2MgPSBHb2QuY2x1c3RlcnNfZGJbb3B0cy5pZF07XHJcbiAgICBpZiAoIXByb2MpIHsgcmV0dXJuIGNiKG5ldyBFcnJvcigncHJvY2VzcyBpZCBkb2VzbnQgZXhpc3RzJykpOyB9XHJcblxyXG4gICAgR29kLmJ1cy5lbWl0KCdwcm9jZXNzOmV2ZW50Jywge1xyXG4gICAgICBldmVudDogb3B0cy5hY3Rpb25fbmFtZSxcclxuICAgICAgbWFudWFsbHk6IHR5cGVvZiAob3B0cy5tYW51YWxseSkgPT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IHRydWUsXHJcbiAgICAgIHByb2Nlc3M6IFV0aWxpdHkuZm9ybWF0Q0xVKHByb2MpLFxyXG4gICAgICBhdDogVXRpbGl0eS5nZXREYXRlKClcclxuICAgIH0pO1xyXG5cclxuICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gY2IgPyBjYihudWxsKSA6IGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfTtcclxufTtcclxuIl19