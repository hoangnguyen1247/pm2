"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

//     treeify.js
//     Luke Plaster <notatestuser@gmail.com>
//     https://github.com/notatestuser/treeify.js
// do the universal module definition dance
var _default = function (root, factory) {
  if ((typeof exports === "undefined" ? "undefined" : (0, _typeof2["default"])(exports)) === 'object') {
    module.exports = factory();
  } else if (typeof global.define === 'function' && global.define["amd"]) {
    global.define(factory);
  } else {
    root.treeify = factory();
  }
}(void 0, function () {
  function makePrefix(key, last) {
    var str = last ? '└' : '├';

    if (key) {
      str += '─ ';
    } else {
      str += '──┐';
    }

    return str;
  }

  function filterKeys(obj, hideFunctions) {
    var keys = [];

    for (var branch in obj) {
      // always exclude anything in the object's prototype
      if (!obj.hasOwnProperty(branch)) {
        continue;
      } // ... and hide any keys mapped to functions if we've been told to


      if (hideFunctions && typeof obj[branch] === "function") {
        continue;
      }

      keys.push(branch);
    }

    return keys;
  }

  function growBranch(key, root, last, lastStates, showValues, hideFunctions, callback) {
    var line = '',
        index = 0,
        lastKey,
        circular,
        lastStatesCopy = lastStates.slice(0);

    if (lastStatesCopy.push([root, last]) && lastStates.length > 0) {
      // based on the "was last element" states of whatever we're nested within,
      // we need to append either blankness or a branch to our line
      lastStates.forEach(function (lastState, idx) {
        if (idx > 0) {
          line += (lastState[1] ? ' ' : '│') + '  ';
        }

        if (!circular && lastState[0] === root) {
          circular = true;
        }
      }); // the prefix varies based on whether the key contains something to show and
      // whether we're dealing with the last element in this collection

      line += makePrefix(key, last) + key; // append values and the circular reference indicator

      showValues && ((0, _typeof2["default"])(root) !== 'object' || root instanceof Date) && (line += ': ' + root);
      circular && (line += ' (circular ref.)');
      callback(line);
    } // can we descend into the next item?


    if (!circular && (0, _typeof2["default"])(root) === 'object') {
      var keys = filterKeys(root, hideFunctions);
      keys.forEach(function (branch) {
        // the last key is always printed with a different prefix, so we'll need to know if we have it
        lastKey = ++index === keys.length; // hold your breath for recursive action

        growBranch(branch, root[branch], lastKey, lastStatesCopy, showValues, hideFunctions, callback);
      });
    }
  }

  ; // --------------------

  var Treeify = {}; // Treeify.asLines
  // --------------------
  // Outputs the tree line-by-line, calling the lineCallback when each one is available.

  Treeify.asLines = function (obj, showValues, hideFunctions, lineCallback) {
    /* hideFunctions and lineCallback are curried, which means we don't break apps using the older form */
    var hideFunctionsArg = typeof hideFunctions !== 'function' ? hideFunctions : false;
    growBranch('.', obj, false, [], showValues, hideFunctionsArg, lineCallback || hideFunctions);
  }; // Treeify.asTree
  // --------------------
  // Outputs the entire tree, returning it as a string with line breaks.


  Treeify.asTree = function (obj, showValues, hideFunctions) {
    var tree = '';
    growBranch('.', obj, false, [], showValues, hideFunctions, function (line) {
      tree += line + '\n';
    });
    return tree;
  }; // --------------------


  return Treeify;
});

exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy90cmVlaWZ5LnRzIl0sIm5hbWVzIjpbInJvb3QiLCJmYWN0b3J5IiwiZXhwb3J0cyIsIm1vZHVsZSIsImdsb2JhbCIsImRlZmluZSIsInRyZWVpZnkiLCJtYWtlUHJlZml4Iiwia2V5IiwibGFzdCIsInN0ciIsImZpbHRlcktleXMiLCJvYmoiLCJoaWRlRnVuY3Rpb25zIiwia2V5cyIsImJyYW5jaCIsImhhc093blByb3BlcnR5IiwicHVzaCIsImdyb3dCcmFuY2giLCJsYXN0U3RhdGVzIiwic2hvd1ZhbHVlcyIsImNhbGxiYWNrIiwibGluZSIsImluZGV4IiwibGFzdEtleSIsImNpcmN1bGFyIiwibGFzdFN0YXRlc0NvcHkiLCJzbGljZSIsImxlbmd0aCIsImZvckVhY2giLCJsYXN0U3RhdGUiLCJpZHgiLCJEYXRlIiwiVHJlZWlmeSIsImFzTGluZXMiLCJsaW5lQ2FsbGJhY2siLCJoaWRlRnVuY3Rpb25zQXJnIiwiYXNUcmVlIiwidHJlZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFFQTtlQUNnQixVQUFVQSxJQUFWLEVBQWdCQyxPQUFoQixFQUF5QjtBQUV2QyxNQUFJLFFBQU9DLE9BQVAsMERBQU9BLE9BQVAsT0FBbUIsUUFBdkIsRUFBaUM7QUFDL0JDLElBQUFBLE1BQU0sQ0FBQ0QsT0FBUCxHQUFpQkQsT0FBTyxFQUF4QjtBQUNELEdBRkQsTUFFTyxJQUFJLE9BQU9HLE1BQU0sQ0FBQ0MsTUFBZCxLQUF5QixVQUF6QixJQUF1Q0QsTUFBTSxDQUFDQyxNQUFQLENBQWMsS0FBZCxDQUEzQyxFQUFpRTtBQUN0RUQsSUFBQUEsTUFBTSxDQUFDQyxNQUFQLENBQWNKLE9BQWQ7QUFDRCxHQUZNLE1BRUE7QUFDSkQsSUFBQUEsSUFBRCxDQUFjTSxPQUFkLEdBQXdCTCxPQUFPLEVBQS9CO0FBQ0Q7QUFFRixDQVZlLFNBVVIsWUFBVztBQUVqQixXQUFTTSxVQUFULENBQW9CQyxHQUFwQixFQUF5QkMs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dUJTLE9BQXZCLEVBQWdDRSxjQUFoQyxFQUFnRE4sVUFBaEQsRUFBNERQLGFBQTVELEVBQTJFUSxRQUEzRSxDQUFWO0FBQ0QsT0FORDtBQU9EO0FBQ0Y7O0FBQUEsR0FqRWdCLENBbUVqQjs7QUFFQSxNQUFJWSxPQUFZLEdBQUcsRUFBbkIsQ0FyRWlCLENBdUVqQjtBQUNBO0FBQ0E7O0FBRUFBLEVBQUFBLE9BQU8sQ0FBQ0MsT0FBUixHQUFrQixVQUFTdEIsR0FBVCxFQUFjUSxVQUFkLEVBQTBCUCxhQUExQixFQUF5Q3NCLFlBQXpDLEVBQXVEO0FBQ3ZFO0FBQ0EsUUFBSUMsZ0JBQWdCLEdBQUcsT0FBT3ZCLGFBQVAsS0FBeUIsVUFBekIsR0FBc0NBLGFBQXRDLEdBQXNELEtBQTdFO0FBQ0FLLElBQUFBLFVBQVUsQ0FBQyxHQUFELEVBQU1OLEdBQU4sRUFBVyxLQUFYLEVBQWtCLEVBQWxCLEVBQXNCUSxVQUF0QixFQUFrQ2dCLGdCQUFsQyxFQUFvREQsWUFBWSxJQUFJdEIsYUFBcEUsQ0FBVjtBQUNELEdBSkQsQ0EzRWlCLENBaUZqQjtBQUNBO0FBQ0E7OztBQUVBb0IsRUFBQUEsT0FBTyxDQUFDSSxNQUFSLEdBQWlCLFVBQVN6QixHQUFULEVBQWNRLFVBQWQsRUFBMEJQLGFBQTFCLEVBQXlDO0FBQ3hELFFBQUl5QixJQUFJLEdBQUcsRUFBWDtBQUNBcEIsSUFBQUEsVUFBVSxDQUFDLEdBQUQsRUFBTU4sR0FBTixFQUFXLEtBQVgsRUFBa0IsRUFBbEIsRUFBc0JRLFVBQXRCLEVBQWtDUCxhQUFsQyxFQUFpRCxVQUFTUyxJQUFULEVBQWU7QUFDeEVnQixNQUFBQSxJQUFJLElBQUloQixJQUFJLEdBQUcsSUFBZjtBQUNELEtBRlMsQ0FBVjtBQUdBLFdBQU9nQixJQUFQO0FBQ0QsR0FORCxDQXJGaUIsQ0E2RmpCOzs7QUFFQSxTQUFPTCxPQUFQO0FBRUQsQ0EzR2UsQyIsInNvdXJjZXNDb250ZW50IjpbIi8vICAgICB0cmVlaWZ5LmpzXG4vLyAgICAgTHVrZSBQbGFzdGVyIDxub3RhdGVzdHVzZXJAZ21haWwuY29tPlxuLy8gICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9ub3RhdGVzdHVzZXIvdHJlZWlmeS5qc1xuXG4vLyBkbyB0aGUgdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uIGRhbmNlXG5leHBvcnQgZGVmYXVsdCAoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblxuICBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbC5kZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZ2xvYmFsLmRlZmluZVtcImFtZFwiXSkge1xuICAgIGdsb2JhbC5kZWZpbmUoZmFjdG9yeSk7XG4gIH0gZWxzZSB7XG4gICAgKHJvb3QgYXMgYW55KS50cmVlaWZ5ID0gZmFjdG9yeSgpO1xuICB9XG5cbn0odGhpcywgZnVuY3Rpb24oKSB7XG5cbiAgZnVuY3Rpb24gbWFrZVByZWZpeChrZXksIGxhc3QpIHtcbiAgICB2YXIgc3RyID0gKGxhc3QgPyAn4pSUJyA6ICfilJwnKTtcbiAgICBpZiAoa2V5KSB7XG4gICAgICBzdHIgKz0gJ+KUgCAnO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJ+KUgOKUgOKUkCc7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJLZXlzKG9iaiwgaGlkZUZ1bmN0aW9ucykge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIgYnJhbmNoIGluIG9iaikge1xuICAgICAgLy8gYWx3YXlzIGV4Y2x1ZGUgYW55dGhpbmcgaW4gdGhlIG9iamVjdCdzIHByb3RvdHlwZVxuICAgICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoYnJhbmNoKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8vIC4uLiBhbmQgaGlkZSBhbnkga2V5cyBtYXBwZWQgdG8gZnVuY3Rpb25zIGlmIHdlJ3ZlIGJlZW4gdG9sZCB0b1xuICAgICAgaWYgKGhpZGVGdW5jdGlvbnMgJiYgKCh0eXBlb2Ygb2JqW2JyYW5jaF0pPT09XCJmdW5jdGlvblwiKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGtleXMucHVzaChicmFuY2gpO1xuICAgIH1cbiAgICByZXR1cm4ga2V5cztcbiAgfVxuXG4gIGZ1bmN0aW9uIGdyb3dCcmFuY2goa2V5LCByb290LCBsYXN0LCBsYXN0U3RhdGVzLCBzaG93VmFsdWVzLCBoaWRlRnVuY3Rpb25zLCBjYWxsYmFjaykge1xuICAgIHZhciBsaW5lID0gJycsIGluZGV4ID0gMCwgbGFzdEtleSwgY2lyY3VsYXIsIGxhc3RTdGF0ZXNDb3B5ID0gbGFzdFN0YXRlcy5zbGljZSgwKTtcblxuICAgIGlmIChsYXN0U3RhdGVzQ29weS5wdXNoKFsgcm9vdCwgbGFzdCBdKSAmJiBsYXN0U3RhdGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIGJhc2VkIG9uIHRoZSBcIndhcyBsYXN0IGVsZW1lbnRcIiBzdGF0ZXMgb2Ygd2hhdGV2ZXIgd2UncmUgbmVzdGVkIHdpdGhpbixcbiAgICAgIC8vIHdlIG5lZWQgdG8gYXBwZW5kIGVpdGhlciBibGFua25lc3Mgb3IgYSBicmFuY2ggdG8gb3VyIGxpbmVcbiAgICAgIGxhc3RTdGF0ZXMuZm9yRWFjaChmdW5jdGlvbihsYXN0U3RhdGUsIGlkeCkge1xuICAgICAgICBpZiAoaWR4ID4gMCkge1xuICAgICAgICAgIGxpbmUgKz0gKGxhc3RTdGF0ZVsxXSA/ICcgJyA6ICfilIInKSArICcgICc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCAhIGNpcmN1bGFyICYmIGxhc3RTdGF0ZVswXSA9PT0gcm9vdCkge1xuICAgICAgICAgIGNpcmN1bGFyID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIHRoZSBwcmVmaXggdmFyaWVzIGJhc2VkIG9uIHdoZXRoZXIgdGhlIGtleSBjb250YWlucyBzb21ldGhpbmcgdG8gc2hvdyBhbmRcbiAgICAgIC8vIHdoZXRoZXIgd2UncmUgZGVhbGluZyB3aXRoIHRoZSBsYXN0IGVsZW1lbnQgaW4gdGhpcyBjb2xsZWN0aW9uXG4gICAgICBsaW5lICs9IG1ha2VQcmVmaXgoa2V5LCBsYXN0KSArIGtleTtcblxuICAgICAgLy8gYXBwZW5kIHZhbHVlcyBhbmQgdGhlIGNpcmN1bGFyIHJlZmVyZW5jZSBpbmRpY2F0b3JcbiAgICAgIHNob3dWYWx1ZXMgJiYgKHR5cGVvZiByb290ICE9PSAnb2JqZWN0JyB8fCByb290IGluc3RhbmNlb2YgRGF0ZSkgJiYgKGxpbmUgKz0gJzogJyArIHJvb3QpO1xuICAgICAgY2lyY3VsYXIgJiYgKGxpbmUgKz0gJyAoY2lyY3VsYXIgcmVmLiknKTtcblxuICAgICAgY2FsbGJhY2sobGluZSk7XG4gICAgfVxuXG4gICAgLy8gY2FuIHdlIGRlc2NlbmQgaW50byB0aGUgbmV4dCBpdGVtP1xuICAgIGlmICggISBjaXJjdWxhciAmJiB0eXBlb2Ygcm9vdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHZhciBrZXlzID0gZmlsdGVyS2V5cyhyb290LCBoaWRlRnVuY3Rpb25zKTtcbiAgICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbihicmFuY2gpe1xuICAgICAgICAvLyB0aGUgbGFzdCBrZXkgaXMgYWx3YXlzIHByaW50ZWQgd2l0aCBhIGRpZmZlcmVudCBwcmVmaXgsIHNvIHdlJ2xsIG5lZWQgdG8ga25vdyBpZiB3ZSBoYXZlIGl0XG4gICAgICAgIGxhc3RLZXkgPSArK2luZGV4ID09PSBrZXlzLmxlbmd0aDtcblxuICAgICAgICAvLyBob2xkIHlvdXIgYnJlYXRoIGZvciByZWN1cnNpdmUgYWN0aW9uXG4gICAgICAgIGdyb3dCcmFuY2goYnJhbmNoLCByb290W2JyYW5jaF0sIGxhc3RLZXksIGxhc3RTdGF0ZXNDb3B5LCBzaG93VmFsdWVzLCBoaWRlRnVuY3Rpb25zLCBjYWxsYmFjayk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICB2YXIgVHJlZWlmeTogYW55ID0ge307XG5cbiAgLy8gVHJlZWlmeS5hc0xpbmVzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIE91dHB1dHMgdGhlIHRyZWUgbGluZS1ieS1saW5lLCBjYWxsaW5nIHRoZSBsaW5lQ2FsbGJhY2sgd2hlbiBlYWNoIG9uZSBpcyBhdmFpbGFibGUuXG5cbiAgVHJlZWlmeS5hc0xpbmVzID0gZnVuY3Rpb24ob2JqLCBzaG93VmFsdWVzLCBoaWRlRnVuY3Rpb25zLCBsaW5lQ2FsbGJhY2spIHtcbiAgICAvKiBoaWRlRnVuY3Rpb25zIGFuZCBsaW5lQ2FsbGJhY2sgYXJlIGN1cnJpZWQsIHdoaWNoIG1lYW5zIHdlIGRvbid0IGJyZWFrIGFwcHMgdXNpbmcgdGhlIG9sZGVyIGZvcm0gKi9cbiAgICB2YXIgaGlkZUZ1bmN0aW9uc0FyZyA9IHR5cGVvZiBoaWRlRnVuY3Rpb25zICE9PSAnZnVuY3Rpb24nID8gaGlkZUZ1bmN0aW9ucyA6IGZhbHNlO1xuICAgIGdyb3dCcmFuY2goJy4nLCBvYmosIGZhbHNlLCBbXSwgc2hvd1ZhbHVlcywgaGlkZUZ1bmN0aW9uc0FyZywgbGluZUNhbGxiYWNrIHx8IGhpZGVGdW5jdGlvbnMpO1xuICB9O1xuXG4gIC8vIFRyZWVpZnkuYXNUcmVlXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIE91dHB1dHMgdGhlIGVudGlyZSB0cmVlLCByZXR1cm5pbmcgaXQgYXMgYSBzdHJpbmcgd2l0aCBsaW5lIGJyZWFrcy5cblxuICBUcmVlaWZ5LmFzVHJlZSA9IGZ1bmN0aW9uKG9iaiwgc2hvd1ZhbHVlcywgaGlkZUZ1bmN0aW9ucykge1xuICAgIHZhciB0cmVlID0gJyc7XG4gICAgZ3Jvd0JyYW5jaCgnLicsIG9iaiwgZmFsc2UsIFtdLCBzaG93VmFsdWVzLCBoaWRlRnVuY3Rpb25zLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICB0cmVlICs9IGxpbmUgKyAnXFxuJztcbiAgICB9KTtcbiAgICByZXR1cm4gdHJlZTtcbiAgfTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHJldHVybiBUcmVlaWZ5O1xuXG59KSk7XG4iXX0=