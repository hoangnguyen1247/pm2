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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9FdmVudC50cyJdLCJuYW1lcyI6WyJHb2QiLCJub3RpZnkiLCJhY3Rpb25fbmFtZSIsImRhdGEiLCJtYW51YWxseSIsImJ1cyIsImVtaXQiLCJldmVudCIsInByb2Nlc3MiLCJVdGlsaXR5IiwiZm9ybWF0Q0xVIiwiYXQiLCJnZXREYXRlIiwibm90aWZ5QnlQcm9jZXNzSWQiLCJvcHRzIiwiY2IiLCJpZCIsIkVycm9yIiwicHJvYyIsImNsdXN0ZXJzX2RiIiwibmV4dFRpY2siXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFNQTs7OztBQU5BOzs7OztBQVFlLGtCQUFVQSxHQUFWLEVBQWU7QUFFNUJBLEVBQUFBLEdBQUcsQ0FBQ0MsTUFBSixHQUFhLFVBQVVDLFdBQVYsRUFBdUJDLElBQXZCLEVBQTZCQyxRQUE3QixFQUF1QztBQUNsREosSUFBQUEsR0FBRyxDQUFDSyxHQUFKLENBQVFDLElBQVIsQ0FBYSxlQUFiLEVBQThCO0FBQzVCQyxNQUFBQSxLQUFLLEVBQUVMLFdBRHFCO0FBRTVCRSxNQUFBQSxRQUFRLEVBQUUsT0FBUUEsUUFBUixJQUFxQixXQUFyQixHQUFtQyxLQUFuQyxHQUEyQyxJQUZ6QjtBQUc1QkksTUFBQUEsT0FBTyxFQUFFQyxvQkFBUUMsU0FBUixDQUFrQlAsSUFBbEIsQ0FIbUI7QUFJNUJRLE1BQUFBLEVBQUUsRUFBRUYsb0JBQVFHLE9BQVI7QUFKd0IsS0FBOUI7QUFNRCxHQVBEOztBQVNBWixFQUFBQSxHQUFHLENBQUNhLGlCQUFKLEdBQXdCLFVBQVVDLElBQVYsRUFBZ0JDLEVBQWhCLEVBQW9CO0FBQzFDLFFBQUksT0FBUUQsSUFBSSxDQUFDRSxFQUFiLEtBQXFCLFdBQXpCLEVBQXNDO0FBQUUsYUFBT0QsRUFBRSxDQUFDLElBQUlFLEtBQUosQ0FBVSxvQkFBVixDQUFELENBQVQ7QUFBNkM7O0FBQ3JGLFFBQUlDLElBQUksR0FBR2xCLEdBQUcsQ0FBQ21CLFdBQUosQ0FBZ0JMLElBQUksQ0FBQ0UsRUFBckIsQ0FBWDs7QUFDQSxRQUFJLENBQUNFLElBQUwsRUFBVztBQUFFLGFBQU9ILEVBQUUsQ0FBQyxJQUFJRSxLQUFKLENBQVUsMEJBQVYsQ0FBRCxDQUFUO0FBQW1EOztBQUVoRWpCLElBQUFBLEdBQUcsQ0FBQ0ssR0FBSixDQUFRQyxJQUFSLENBQWEsZUFBYixFQUE4QjtBQUM1QkMsTUFBQUEsS0FBSyxFQUFFTyxJQUFJLENBQUNaLFdBRGdCO0FBRTVCRSxNQUFBQSxRQUFRLEVBQUUsT0FBUVUsSUFBSSxDQUFDVixRQUFiLElBQTBCLFdBQTFCLEdBQXdDLEtBQXhDLEdBQWdELElBRjlCO0FBRzVCSSxNQUFBQSxPQUFPLEVBQUVDLG9CQUFRQyxTQUFSLENBQWtCUSxJQUFsQixDQUhtQjtBQUk1QlAsTUFBQUEsRUFBRSxFQUFFRixvQkFBUUcsT0FBUjtBQUp3QixLQUE5QjtBQU9BSixJQUFBQSxPQUFPLENBQUNZLFFBQVIsQ0FBaUIsWUFBWTtBQUMzQixhQUFPTCxFQUFFLEdBQUdBLEVBQUUsQ0FBQyxJQUFELENBQUwsR0FBYyxLQUF2QjtBQUNELEtBRkQ7QUFHQSxXQUFPLEtBQVA7QUFDRCxHQWhCRDtBQWlCRDs7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIGxpY2Vuc2UgdGhhdFxuICogY2FuIGJlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuXG4gKi9cblxuaW1wb3J0IFV0aWxpdHkgZnJvbSAnLi9VdGlsaXR5JztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKEdvZCkge1xuXG4gIEdvZC5ub3RpZnkgPSBmdW5jdGlvbiAoYWN0aW9uX25hbWUsIGRhdGEsIG1hbnVhbGx5KSB7XG4gICAgR29kLmJ1cy5lbWl0KCdwcm9jZXNzOmV2ZW50Jywge1xuICAgICAgZXZlbnQ6IGFjdGlvbl9uYW1lLFxuICAgICAgbWFudWFsbHk6IHR5cGVvZiAobWFudWFsbHkpID09ICd1bmRlZmluZWQnID8gZmFsc2UgOiB0cnVlLFxuICAgICAgcHJvY2VzczogVXRpbGl0eS5mb3JtYXRDTFUoZGF0YSksXG4gICAgICBhdDogVXRpbGl0eS5nZXREYXRlKClcbiAgICB9KTtcbiAgfTtcblxuICBHb2Qubm90aWZ5QnlQcm9jZXNzSWQgPSBmdW5jdGlvbiAob3B0cywgY2IpIHtcbiAgICBpZiAodHlwZW9mIChvcHRzLmlkKSA9PT0gJ3VuZGVmaW5lZCcpIHsgcmV0dXJuIGNiKG5ldyBFcnJvcigncHJvY2VzcyBpZCBtaXNzaW5nJykpOyB9XG4gICAgdmFyIHByb2MgPSBHb2QuY2x1c3RlcnNfZGJbb3B0cy5pZF07XG4gICAgaWYgKCFwcm9jKSB7IHJldHVybiBjYihuZXcgRXJyb3IoJ3Byb2Nlc3MgaWQgZG9lc250IGV4aXN0cycpKTsgfVxuXG4gICAgR29kLmJ1cy5lbWl0KCdwcm9jZXNzOmV2ZW50Jywge1xuICAgICAgZXZlbnQ6IG9wdHMuYWN0aW9uX25hbWUsXG4gICAgICBtYW51YWxseTogdHlwZW9mIChvcHRzLm1hbnVhbGx5KSA9PSAndW5kZWZpbmVkJyA/IGZhbHNlIDogdHJ1ZSxcbiAgICAgIHByb2Nlc3M6IFV0aWxpdHkuZm9ybWF0Q0xVKHByb2MpLFxuICAgICAgYXQ6IFV0aWxpdHkuZ2V0RGF0ZSgpXG4gICAgfSk7XG5cbiAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBjYiA/IGNiKG51bGwpIDogZmFsc2U7XG4gICAgfSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufTtcbiJdfQ==