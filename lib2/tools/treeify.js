"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

//     treeify.js
//     Luke Plaster <notatestuser@gmail.com>
//     https://github.com/notatestuser/treeify.js
// do the universal module definition dance
(function (root, factory) {
  if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object') {
    module.exports = factory();
  } else if (typeof global.define === 'function' && global.define["amd"]) {
    global.define(factory);
  } else {
    root.treeify = factory();
  }
})(void 0, function () {
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

      showValues && (_typeof(root) !== 'object' || root instanceof Date) && (line += ': ' + root);
      circular && (line += ' (circular ref.)');
      callback(line);
    } // can we descend into the next item?


    if (!circular && _typeof(root) === 'object') {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy90cmVlaWZ5LnRzIl0sIm5hbWVzIjpbInJvb3QiLCJmYWN0b3J5IiwiZXhwb3J0cyIsIm1vZHVsZSIsImdsb2JhbCIsImRlZmluZSIsInRyZWVpZnkiLCJtYWtlUHJlZml4Iiwia2V5IiwibGFzdCIsInN0ciIsImZpbHRlcktleXMiLCJvYmoiLCJoaWRlRnVuY3Rpb25zIiwia2V5cyIsImJyYW5jaCIsImhhc093blByb3BlcnR5IiwicHVzaCIsImdyb3dCcmFuY2giLCJsYXN0U3RhdGVzIiwic2hvd1ZhbHVlcyIsImNhbGxiYWNrIiwibGluZSIsImluZGV4IiwibGFzdEtleSIsImNpcmN1bGFyIiwibGFzdFN0YXRlc0NvcHkiLCJzbGljZSIsImxlbmd0aCIsImZvckVhY2giLCJsYXN0U3RhdGUiLCJpZHgiLCJEYXRlIiwiVHJlZWlmeSIsImFzTGluZXMiLCJsaW5lQ2FsbGJhY2siLCJoaWRlRnVuY3Rpb25zQXJnIiwiYXNUcmVlIiwidHJlZSJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUVBO0FBQ0MsV0FBVUEsSUFBVixFQUFnQkMsT0FBaEIsRUFBeUI7QUFFeEIsTUFBSSxRQUFPQyxPQUFQLHlDQUFPQSxPQUFQLE9BQW1CLFFBQXZCLEVBQWlDO0FBQy9CQyxJQUFBQSxNQUFNLENBQUNELE9BQVAsR0FBaUJELE9BQU8sRUFBeEI7QUFDRCxHQUZELE1BRU8sSUFBSSxPQUFPRyxNQUFNLENBQUNDLE1BQWQsS0FBeUIsVUFBekIsSUFBdUNELE1BQU0sQ0FBQ0MsTUFBUCxDQUFjLEtBQWQsQ0FBM0MsRUFBaUU7QUFDdEVELElBQUFBLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjSixPQUFkO0FBQ0QsR0FGTSxNQUVBO0FBQ0xELElBQUFBLElBQUksQ0FBQ00sT0FBTCxHQUFlTCxPQUFPLEVBQXRCO0FBQ0Q7QUFFRixDQVZBLFVBVU8sWUFBVztBQUVqQixXQUFTTSxVQUFULENBQW9CQyxHQUFwQixFQUF5QkMsSUFBekIsRUFBK0I7QUFDN0IsUUFBSUMsR0FBRyxHQUFJRCxJQUFJLEdBQUcsR0FBSCxHQUFTLEdBQXhCOztBQUNBLFFBQUlELEdBQUosRUFBUztBQUNQRSxNQUFBQSxHQUFHLElBQUksSUFBUDtBQUNELEtBRkQsTUFFTztBQUNMQSxNQUFBQSxHQUFHLElBQUksS0FBUDtBQUNEOztBQUNELFdBQU9BLEdBQVA7QUFDRDs7QUFFRCxXQUFTQyxVQUFULENBQW9CQyxHQUFwQixFQUF5QkMsYUFBekIsRUFBd0M7QUFDdEMsUUFBSUMsSUFBSSxHQUFHLEVBQVg7O0FBQ0EsU0FBSyxJQUFJQyxNQUFULElBQW1CSCxHQUFuQixFQUF3QjtBQUN0QjtBQUNBLFVBQUksQ0FBQ0EsR0FBRyxDQUFDSSxjQUFKLENBQW1CRCxNQUFuQixDQUFMLEVBQWlDO0FBQy9CO0FBQ0QsT0FKcUIsQ0FLdEI7OztBQUNBLFVBQUlGLGFBQWEsSUFBTSxPQUFPRCxHQUFHLENBQUNHLE1BQUQsQ0FBWCxLQUF1QixVQUE3QyxFQUEwRDtBQUN4RDtBQUNEOztBQUNERCxNQUFBQSxJQUFJLENBQUNHLElBQUwsQ0FBVUYsTUFBVjtBQUNEOztBQUNELFdBQU9ELElBQVA7QUFDRDs7QUFFRCxXQUFTSSxVQUFULENBQW9CVixHQUFwQixFQUF5QlIsSUFBekIsRUFBK0JTLElBQS9CLEVBQXFDVSxVQUFyQyxFQUFpREMsVUFBakQsRUFBNkRQLGFBQTdELEVBQTRFUSxRQUE1RSxFQUFzRjtBQUNwRixRQUFJQyxJQUFJLEdBQUcsRUFBWDtBQUFBLFFBQWVDLEtBQUssR0FBRyxDQUF2QjtBQUFBLFFBQTBCQyxPQUExQjtBQUFBLFFBQW1DQyxRQUFuQztBQUFBLFFBQTZDQyxjQUFjLEdBQUdQLFVBQVUsQ0FBQ1EsS0FBWCxDQUFpQixDQUFqQixDQUE5RDs7QUFFQSxRQUFJRCxjQUFjLENBQUNULElBQWYsQ0FBb0IsQ0FBRWpCLElBQUYsRUFBUVMsSUFBUixDQUFwQixLQUF1Q1UsVUFBVSxDQUFDUyxNQUFYLEdBQW9CLENBQS9ELEVBQWtFO0FBQ2hFO0FBQ0E7QUFDQVQsTUFBQUEsVUFBVSxDQUFDVSxPQUFYLENBQW1CLFVBQVNDLFNBQVQsRUFBb0JDLEdBQXBCLEVBQXlCO0FBQzFDLFlBQUlBLEdBQUcsR0FBRyxDQUFWLEVBQWE7QUFDWFQsVUFBQUEsSUFBSSxJQUFJLENBQUNRLFNBQVMsQ0FBQyxDQUFELENBQVQsR0FBZSxHQUFmLEdBQXFCLEdBQXRCLElBQTZCLElBQXJDO0FBQ0Q7O0FBQ0QsWUFBSyxDQUFFTCxRQUFGLElBQWNLLFNBQVMsQ0FBQyxDQUFELENBQVQsS0FBaUI5QixJQUFwQyxFQUEwQztBQUN4Q3lCLFVBQUFBLFFBQVEsR0FBRyxJQUFYO0FBQ0Q7QUFDRixPQVBELEVBSGdFLENBWWhFO0FBQ0E7O0FBQ0FILE1BQUFBLElBQUksSUFBSWYsVUFBVSxDQUFDQyxHQUFELEVBQU1DLElBQU4sQ0FBVixHQUF3QkQsR0FBaEMsQ0FkZ0UsQ0FnQmhFOztBQUNBWSxNQUFBQSxVQUFVLEtBQUssUUFBT3BCLElBQVAsTUFBZ0IsUUFBaEIsSUFBNEJBLElBQUksWUFBWWdDLElBQWpELENBQVYsS0FBcUVWLElBQUksSUFBSSxPQUFPdEIsSUFBcEY7QUFDQXlCLE1BQUFBLFFBQVEsS0FBS0gsSUFBSSxJQUFJLGtCQUFiLENBQVI7QUFFQUQsTUFBQUEsUUFBUSxDQUFDQyxJQUFELENBQVI7QUFDRCxLQXhCbUYsQ0EwQnBGOzs7QUFDQSxRQUFLLENBQUVHLFFBQUYsSUFBYyxRQUFPekIsSUFBUCxNQUFnQixRQUFuQyxFQUE2QztBQUMzQyxVQUFJYyxJQUFJLEdBQUdILFVBQVUsQ0FBQ1gsSUFBRCxFQUFPYSxhQUFQLENBQXJCO0FBQ0FDLE1BQUFBLElBQUksQ0FBQ2UsT0FBTCxDQUFhLFVBQVNkLE1BQVQsRUFBZ0I7QUFDM0I7QUFDQVMsUUFBQUEsT0FBTyxHQUFHLEVBQUVELEtBQUYsS0FBWVQsSUFBSSxDQUFDYyxNQUEzQixDQUYyQixDQUkzQjs7QUFDQVYsUUFBQUEsVUFBVSxDQUFDSCxNQUFELEVBQVNmLElBQUksQ0FBQ2UsTUFBRCxDQUFiLEVBQXVCUyxPQUF2QixFQUFnQ0UsY0FBaEMsRUFBZ0ROLFVBQWhELEVBQTREUCxhQUE1RCxFQUEyRVEsUUFBM0UsQ0FBVjtBQUNELE9BTkQ7QUFPRDtBQUNGOztBQUFBLEdBakVnQixDQW1FakI7O0FBRUEsTUFBSVksT0FBWSxHQUFHLEVBQW5CLENBckVpQixDQXVFakI7QUFDQTtBQUNBOztBQUVBQSxFQUFBQSxPQUFPLENBQUNDLE9BQVIsR0FBa0IsVUFBU3RCLEdBQVQsRUFBY1EsVUFBZCxFQUEwQlAsYUFBMUIsRUFBeUNzQixZQUF6QyxFQUF1RDtBQUN2RTtBQUNBLFFBQUlDLGdCQUFnQixHQUFHLE9BQU92QixhQUFQLEtBQXlCLFVBQXpCLEdBQXNDQSxhQUF0QyxHQUFzRCxLQUE3RTtBQUNBSyxJQUFBQSxVQUFVLENBQUMsR0FBRCxFQUFNTixHQUFOLEVBQVcsS0FBWCxFQUFrQixFQUFsQixFQUFzQlEsVUFBdEIsRUFBa0NnQixnQkFBbEMsRUFBb0RELFlBQVksSUFBSXRCLGFBQXBFLENBQVY7QUFDRCxHQUpELENBM0VpQixDQWlGakI7QUFDQTtBQUNBOzs7QUFFQW9CLEVBQUFBLE9BQU8sQ0FBQ0ksTUFBUixHQUFpQixVQUFTekIsR0FBVCxFQUFjUSxVQUFkLEVBQTBCUCxhQUExQixFQUF5QztBQUN4RCxRQUFJeUIsSUFBSSxHQUFHLEVBQVg7QUFDQXBCLElBQUFBLFVBQVUsQ0FBQyxHQUFELEVBQU1OLEdBQU4sRUFBVyxLQUFYLEVBQWtCLEVBQWxCLEVBQXNCUSxVQUF0QixFQUFrQ1AsYUFBbEMsRUFBaUQsVUFBU1MsSUFBVCxFQUFlO0FBQ3hFZ0IsTUFBQUEsSUFBSSxJQUFJaEIsSUFBSSxHQUFHLElBQWY7QUFDRCxLQUZTLENBQVY7QUFHQSxXQUFPZ0IsSUFBUDtBQUNELEdBTkQsQ0FyRmlCLENBNkZqQjs7O0FBRUEsU0FBT0wsT0FBUDtBQUVELENBM0dBLENBQUQiLCJzb3VyY2VzQ29udGVudCI6WyIvLyAgICAgdHJlZWlmeS5qc1xuLy8gICAgIEx1a2UgUGxhc3RlciA8bm90YXRlc3R1c2VyQGdtYWlsLmNvbT5cbi8vICAgICBodHRwczovL2dpdGh1Yi5jb20vbm90YXRlc3R1c2VyL3RyZWVpZnkuanNcblxuLy8gZG8gdGhlIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvbiBkYW5jZVxuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cbiAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwuZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGdsb2JhbC5kZWZpbmVbXCJhbWRcIl0pIHtcbiAgICBnbG9iYWwuZGVmaW5lKGZhY3RvcnkpO1xuICB9IGVsc2Uge1xuICAgIHJvb3QudHJlZWlmeSA9IGZhY3RvcnkoKTtcbiAgfVxuXG59KHRoaXMsIGZ1bmN0aW9uKCkge1xuXG4gIGZ1bmN0aW9uIG1ha2VQcmVmaXgoa2V5LCBsYXN0KSB7XG4gICAgdmFyIHN0ciA9IChsYXN0ID8gJ+KUlCcgOiAn4pScJyk7XG4gICAgaWYgKGtleSkge1xuICAgICAgc3RyICs9ICfilIAgJztcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICfilIDilIDilJAnO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyS2V5cyhvYmosIGhpZGVGdW5jdGlvbnMpIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGJyYW5jaCBpbiBvYmopIHtcbiAgICAgIC8vIGFsd2F5cyBleGNsdWRlIGFueXRoaW5nIGluIHRoZSBvYmplY3QncyBwcm90b3R5cGVcbiAgICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KGJyYW5jaCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvLyAuLi4gYW5kIGhpZGUgYW55IGtleXMgbWFwcGVkIHRvIGZ1bmN0aW9ucyBpZiB3ZSd2ZSBiZWVuIHRvbGQgdG9cbiAgICAgIGlmIChoaWRlRnVuY3Rpb25zICYmICgodHlwZW9mIG9ialticmFuY2hdKT09PVwiZnVuY3Rpb25cIikpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBrZXlzLnB1c2goYnJhbmNoKTtcbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG4gIH1cblxuICBmdW5jdGlvbiBncm93QnJhbmNoKGtleSwgcm9vdCwgbGFzdCwgbGFzdFN0YXRlcywgc2hvd1ZhbHVlcywgaGlkZUZ1bmN0aW9ucywgY2FsbGJhY2spIHtcbiAgICB2YXIgbGluZSA9ICcnLCBpbmRleCA9IDAsIGxhc3RLZXksIGNpcmN1bGFyLCBsYXN0U3RhdGVzQ29weSA9IGxhc3RTdGF0ZXMuc2xpY2UoMCk7XG5cbiAgICBpZiAobGFzdFN0YXRlc0NvcHkucHVzaChbIHJvb3QsIGxhc3QgXSkgJiYgbGFzdFN0YXRlcy5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBiYXNlZCBvbiB0aGUgXCJ3YXMgbGFzdCBlbGVtZW50XCIgc3RhdGVzIG9mIHdoYXRldmVyIHdlJ3JlIG5lc3RlZCB3aXRoaW4sXG4gICAgICAvLyB3ZSBuZWVkIHRvIGFwcGVuZCBlaXRoZXIgYmxhbmtuZXNzIG9yIGEgYnJhbmNoIHRvIG91ciBsaW5lXG4gICAgICBsYXN0U3RhdGVzLmZvckVhY2goZnVuY3Rpb24obGFzdFN0YXRlLCBpZHgpIHtcbiAgICAgICAgaWYgKGlkeCA+IDApIHtcbiAgICAgICAgICBsaW5lICs9IChsYXN0U3RhdGVbMV0gPyAnICcgOiAn4pSCJykgKyAnICAnO1xuICAgICAgICB9XG4gICAgICAgIGlmICggISBjaXJjdWxhciAmJiBsYXN0U3RhdGVbMF0gPT09IHJvb3QpIHtcbiAgICAgICAgICBjaXJjdWxhciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyB0aGUgcHJlZml4IHZhcmllcyBiYXNlZCBvbiB3aGV0aGVyIHRoZSBrZXkgY29udGFpbnMgc29tZXRoaW5nIHRvIHNob3cgYW5kXG4gICAgICAvLyB3aGV0aGVyIHdlJ3JlIGRlYWxpbmcgd2l0aCB0aGUgbGFzdCBlbGVtZW50IGluIHRoaXMgY29sbGVjdGlvblxuICAgICAgbGluZSArPSBtYWtlUHJlZml4KGtleSwgbGFzdCkgKyBrZXk7XG5cbiAgICAgIC8vIGFwcGVuZCB2YWx1ZXMgYW5kIHRoZSBjaXJjdWxhciByZWZlcmVuY2UgaW5kaWNhdG9yXG4gICAgICBzaG93VmFsdWVzICYmICh0eXBlb2Ygcm9vdCAhPT0gJ29iamVjdCcgfHwgcm9vdCBpbnN0YW5jZW9mIERhdGUpICYmIChsaW5lICs9ICc6ICcgKyByb290KTtcbiAgICAgIGNpcmN1bGFyICYmIChsaW5lICs9ICcgKGNpcmN1bGFyIHJlZi4pJyk7XG5cbiAgICAgIGNhbGxiYWNrKGxpbmUpO1xuICAgIH1cblxuICAgIC8vIGNhbiB3ZSBkZXNjZW5kIGludG8gdGhlIG5leHQgaXRlbT9cbiAgICBpZiAoICEgY2lyY3VsYXIgJiYgdHlwZW9mIHJvb3QgPT09ICdvYmplY3QnKSB7XG4gICAgICB2YXIga2V5cyA9IGZpbHRlcktleXMocm9vdCwgaGlkZUZ1bmN0aW9ucyk7XG4gICAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oYnJhbmNoKXtcbiAgICAgICAgLy8gdGhlIGxhc3Qga2V5IGlzIGFsd2F5cyBwcmludGVkIHdpdGggYSBkaWZmZXJlbnQgcHJlZml4LCBzbyB3ZSdsbCBuZWVkIHRvIGtub3cgaWYgd2UgaGF2ZSBpdFxuICAgICAgICBsYXN0S2V5ID0gKytpbmRleCA9PT0ga2V5cy5sZW5ndGg7XG5cbiAgICAgICAgLy8gaG9sZCB5b3VyIGJyZWF0aCBmb3IgcmVjdXJzaXZlIGFjdGlvblxuICAgICAgICBncm93QnJhbmNoKGJyYW5jaCwgcm9vdFticmFuY2hdLCBsYXN0S2V5LCBsYXN0U3RhdGVzQ29weSwgc2hvd1ZhbHVlcywgaGlkZUZ1bmN0aW9ucywgY2FsbGJhY2spO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgdmFyIFRyZWVpZnk6IGFueSA9IHt9O1xuXG4gIC8vIFRyZWVpZnkuYXNMaW5lc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBPdXRwdXRzIHRoZSB0cmVlIGxpbmUtYnktbGluZSwgY2FsbGluZyB0aGUgbGluZUNhbGxiYWNrIHdoZW4gZWFjaCBvbmUgaXMgYXZhaWxhYmxlLlxuXG4gIFRyZWVpZnkuYXNMaW5lcyA9IGZ1bmN0aW9uKG9iaiwgc2hvd1ZhbHVlcywgaGlkZUZ1bmN0aW9ucywgbGluZUNhbGxiYWNrKSB7XG4gICAgLyogaGlkZUZ1bmN0aW9ucyBhbmQgbGluZUNhbGxiYWNrIGFyZSBjdXJyaWVkLCB3aGljaCBtZWFucyB3ZSBkb24ndCBicmVhayBhcHBzIHVzaW5nIHRoZSBvbGRlciBmb3JtICovXG4gICAgdmFyIGhpZGVGdW5jdGlvbnNBcmcgPSB0eXBlb2YgaGlkZUZ1bmN0aW9ucyAhPT0gJ2Z1bmN0aW9uJyA/IGhpZGVGdW5jdGlvbnMgOiBmYWxzZTtcbiAgICBncm93QnJhbmNoKCcuJywgb2JqLCBmYWxzZSwgW10sIHNob3dWYWx1ZXMsIGhpZGVGdW5jdGlvbnNBcmcsIGxpbmVDYWxsYmFjayB8fCBoaWRlRnVuY3Rpb25zKTtcbiAgfTtcblxuICAvLyBUcmVlaWZ5LmFzVHJlZVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBPdXRwdXRzIHRoZSBlbnRpcmUgdHJlZSwgcmV0dXJuaW5nIGl0IGFzIGEgc3RyaW5nIHdpdGggbGluZSBicmVha3MuXG5cbiAgVHJlZWlmeS5hc1RyZWUgPSBmdW5jdGlvbihvYmosIHNob3dWYWx1ZXMsIGhpZGVGdW5jdGlvbnMpIHtcbiAgICB2YXIgdHJlZSA9ICcnO1xuICAgIGdyb3dCcmFuY2goJy4nLCBvYmosIGZhbHNlLCBbXSwgc2hvd1ZhbHVlcywgaGlkZUZ1bmN0aW9ucywgZnVuY3Rpb24obGluZSkge1xuICAgICAgdHJlZSArPSBsaW5lICsgJ1xcbic7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRyZWU7XG4gIH07XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICByZXR1cm4gVHJlZWlmeTtcblxufSkpO1xuIl19