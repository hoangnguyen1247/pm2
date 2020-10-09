"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

//     treeify.js
//     Luke Plaster <notatestuser@gmail.com>
//     https://github.com/notatestuser/treeify.js
// do the universal module definition dance
var _default = function (root, factory) {
  if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object') {
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

exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy90cmVlaWZ5LnRzIl0sIm5hbWVzIjpbInJvb3QiLCJmYWN0b3J5IiwiZXhwb3J0cyIsIm1vZHVsZSIsImdsb2JhbCIsImRlZmluZSIsInRyZWVpZnkiLCJtYWtlUHJlZml4Iiwia2V5IiwibGFzdCIsInN0ciIsImZpbHRlcktleXMiLCJvYmoiLCJoaWRlRnVuY3Rpb25zIiwia2V5cyIsImJyYW5jaCIsImhhc093blByb3BlcnR5IiwicHVzaCIsImdyb3dCcmFuY2giLCJsYXN0U3RhdGVzIiwic2hvd1ZhbHVlcyIsImNhbGxiYWNrIiwibGluZSIsImluZGV4IiwibGFzdEtleSIsImNpcmN1bGFyIiwibGFzdFN0YXRlc0NvcHkiLCJzbGljZSIsImxlbmd0aCIsImZvckVhY2giLCJsYXN0U3RhdGUiLCJpZHgiLCJEYXRlIiwiVHJlZWlmeSIsImFzTGluZXMiLCJsaW5lQ2FsbGJhY2siLCJoaWRlRnVuY3Rpb25zQXJnIiwiYXNUcmVlIiwidHJlZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBRUE7ZUFDZ0IsVUFBVUEsSUFBVixFQUFnQkMsT0FBaEIsRUFBeUI7QUFFdkMsTUFBSSxRQUFPQyxPQUFQLHlDQUFPQSxPQUFQLE9BQW1CLFFBQXZCLEVBQWlDO0FBQy9CQyxJQUFBQSxNQUFNLENBQUNELE9BQVAsR0FBaUJELE9BQU8sRUFBeEI7QUFDRCxHQUZELE1BRU8sSUFBSSxPQUFPRyxNQUFNLENBQUNDLE1BQWQsS0FBeUIsVUFBekIsSUFBdUNELE1BQU0sQ0FBQ0MsTUFBUCxDQUFjLEtBQWQsQ0FBM0MsRUFBaUU7QUFDdEVELElBQUFBLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjSixPQUFkO0FBQ0QsR0FGTSxNQUVBO0FBQ0pELElBQUFBLElBQUQsQ0FBY00sT0FBZCxHQUF3QkwsT0FBTyxFQUEvQjtBQUNEO0FBRUYsQ0FWZSxTQVVSLFlBQVc7QUFFakIsV0FBU00sVUFBVCxDQUFvQkMsR0FBcEIsRUFBeUJDLElB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T0FBdkIsRUFBZ0NFLGNBQWhDLEVBQWdETixVQUFoRCxFQUE0RFAsYUFBNUQsRUFBMkVRLFFBQTNFLENBQVY7QUFDRCxPQU5EO0FBT0Q7QUFDRjs7QUFBQSxHQWpFZ0IsQ0FtRWpCOztBQUVBLE1BQUlZLE9BQVksR0FBRyxFQUFuQixDQXJFaUIsQ0F1RWpCO0FBQ0E7QUFDQTs7QUFFQUEsRUFBQUEsT0FBTyxDQUFDQyxPQUFSLEdBQWtCLFVBQVN0QixHQUFULEVBQWNRLFVBQWQsRUFBMEJQLGFBQTFCLEVBQXlDc0IsWUFBekMsRUFBdUQ7QUFDdkU7QUFDQSxRQUFJQyxnQkFBZ0IsR0FBRyxPQUFPdkIsYUFBUCxLQUF5QixVQUF6QixHQUFzQ0EsYUFBdEMsR0FBc0QsS0FBN0U7QUFDQUssSUFBQUEsVUFBVSxDQUFDLEdBQUQsRUFBTU4sR0FBTixFQUFXLEtBQVgsRUFBa0IsRUFBbEIsRUFBc0JRLFVBQXRCLEVBQWtDZ0IsZ0JBQWxDLEVBQW9ERCxZQUFZLElBQUl0QixhQUFwRSxDQUFWO0FBQ0QsR0FKRCxDQTNFaUIsQ0FpRmpCO0FBQ0E7QUFDQTs7O0FBRUFvQixFQUFBQSxPQUFPLENBQUNJLE1BQVIsR0FBaUIsVUFBU3pCLEdBQVQsRUFBY1EsVUFBZCxFQUEwQlAsYUFBMUIsRUFBeUM7QUFDeEQsUUFBSXlCLElBQUksR0FBRyxFQUFYO0FBQ0FwQixJQUFBQSxVQUFVLENBQUMsR0FBRCxFQUFNTixHQUFOLEVBQVcsS0FBWCxFQUFrQixFQUFsQixFQUFzQlEsVUFBdEIsRUFBa0NQLGFBQWxDLEVBQWlELFVBQVNTLElBQVQsRUFBZTtBQUN4RWdCLE1BQUFBLElBQUksSUFBSWhCLElBQUksR0FBRyxJQUFmO0FBQ0QsS0FGUyxDQUFWO0FBR0EsV0FBT2dCLElBQVA7QUFDRCxHQU5ELENBckZpQixDQTZGakI7OztBQUVBLFNBQU9MLE9BQVA7QUFFRCxDQTNHZSxDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gICAgIHRyZWVpZnkuanNcbi8vICAgICBMdWtlIFBsYXN0ZXIgPG5vdGF0ZXN0dXNlckBnbWFpbC5jb20+XG4vLyAgICAgaHR0cHM6Ly9naXRodWIuY29tL25vdGF0ZXN0dXNlci90cmVlaWZ5LmpzXG5cbi8vIGRvIHRoZSB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb24gZGFuY2VcbmV4cG9ydCBkZWZhdWx0IChmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsLmRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBnbG9iYWwuZGVmaW5lW1wiYW1kXCJdKSB7XG4gICAgZ2xvYmFsLmRlZmluZShmYWN0b3J5KTtcbiAgfSBlbHNlIHtcbiAgICAocm9vdCBhcyBhbnkpLnRyZWVpZnkgPSBmYWN0b3J5KCk7XG4gIH1cblxufSh0aGlzLCBmdW5jdGlvbigpIHtcblxuICBmdW5jdGlvbiBtYWtlUHJlZml4KGtleSwgbGFzdCkge1xuICAgIHZhciBzdHIgPSAobGFzdCA/ICfilJQnIDogJ+KUnCcpO1xuICAgIGlmIChrZXkpIHtcbiAgICAgIHN0ciArPSAn4pSAICc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAn4pSA4pSA4pSQJztcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlcktleXMob2JqLCBoaWRlRnVuY3Rpb25zKSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBicmFuY2ggaW4gb2JqKSB7XG4gICAgICAvLyBhbHdheXMgZXhjbHVkZSBhbnl0aGluZyBpbiB0aGUgb2JqZWN0J3MgcHJvdG90eXBlXG4gICAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLy8gLi4uIGFuZCBoaWRlIGFueSBrZXlzIG1hcHBlZCB0byBmdW5jdGlvbnMgaWYgd2UndmUgYmVlbiB0b2xkIHRvXG4gICAgICBpZiAoaGlkZUZ1bmN0aW9ucyAmJiAoKHR5cGVvZiBvYmpbYnJhbmNoXSk9PT1cImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAga2V5cy5wdXNoKGJyYW5jaCk7XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgZnVuY3Rpb24gZ3Jvd0JyYW5jaChrZXksIHJvb3QsIGxhc3QsIGxhc3RTdGF0ZXMsIHNob3dWYWx1ZXMsIGhpZGVGdW5jdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGxpbmUgPSAnJywgaW5kZXggPSAwLCBsYXN0S2V5LCBjaXJjdWxhciwgbGFzdFN0YXRlc0NvcHkgPSBsYXN0U3RhdGVzLnNsaWNlKDApO1xuXG4gICAgaWYgKGxhc3RTdGF0ZXNDb3B5LnB1c2goWyByb290LCBsYXN0IF0pICYmIGxhc3RTdGF0ZXMubGVuZ3RoID4gMCkge1xuICAgICAgLy8gYmFzZWQgb24gdGhlIFwid2FzIGxhc3QgZWxlbWVudFwiIHN0YXRlcyBvZiB3aGF0ZXZlciB3ZSdyZSBuZXN0ZWQgd2l0aGluLFxuICAgICAgLy8gd2UgbmVlZCB0byBhcHBlbmQgZWl0aGVyIGJsYW5rbmVzcyBvciBhIGJyYW5jaCB0byBvdXIgbGluZVxuICAgICAgbGFzdFN0YXRlcy5mb3JFYWNoKGZ1bmN0aW9uKGxhc3RTdGF0ZSwgaWR4KSB7XG4gICAgICAgIGlmIChpZHggPiAwKSB7XG4gICAgICAgICAgbGluZSArPSAobGFzdFN0YXRlWzFdID8gJyAnIDogJ+KUgicpICsgJyAgJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoICEgY2lyY3VsYXIgJiYgbGFzdFN0YXRlWzBdID09PSByb290KSB7XG4gICAgICAgICAgY2lyY3VsYXIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gdGhlIHByZWZpeCB2YXJpZXMgYmFzZWQgb24gd2hldGhlciB0aGUga2V5IGNvbnRhaW5zIHNvbWV0aGluZyB0byBzaG93IGFuZFxuICAgICAgLy8gd2hldGhlciB3ZSdyZSBkZWFsaW5nIHdpdGggdGhlIGxhc3QgZWxlbWVudCBpbiB0aGlzIGNvbGxlY3Rpb25cbiAgICAgIGxpbmUgKz0gbWFrZVByZWZpeChrZXksIGxhc3QpICsga2V5O1xuXG4gICAgICAvLyBhcHBlbmQgdmFsdWVzIGFuZCB0aGUgY2lyY3VsYXIgcmVmZXJlbmNlIGluZGljYXRvclxuICAgICAgc2hvd1ZhbHVlcyAmJiAodHlwZW9mIHJvb3QgIT09ICdvYmplY3QnIHx8IHJvb3QgaW5zdGFuY2VvZiBEYXRlKSAmJiAobGluZSArPSAnOiAnICsgcm9vdCk7XG4gICAgICBjaXJjdWxhciAmJiAobGluZSArPSAnIChjaXJjdWxhciByZWYuKScpO1xuXG4gICAgICBjYWxsYmFjayhsaW5lKTtcbiAgICB9XG5cbiAgICAvLyBjYW4gd2UgZGVzY2VuZCBpbnRvIHRoZSBuZXh0IGl0ZW0/XG4gICAgaWYgKCAhIGNpcmN1bGFyICYmIHR5cGVvZiByb290ID09PSAnb2JqZWN0Jykge1xuICAgICAgdmFyIGtleXMgPSBmaWx0ZXJLZXlzKHJvb3QsIGhpZGVGdW5jdGlvbnMpO1xuICAgICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGJyYW5jaCl7XG4gICAgICAgIC8vIHRoZSBsYXN0IGtleSBpcyBhbHdheXMgcHJpbnRlZCB3aXRoIGEgZGlmZmVyZW50IHByZWZpeCwgc28gd2UnbGwgbmVlZCB0byBrbm93IGlmIHdlIGhhdmUgaXRcbiAgICAgICAgbGFzdEtleSA9ICsraW5kZXggPT09IGtleXMubGVuZ3RoO1xuXG4gICAgICAgIC8vIGhvbGQgeW91ciBicmVhdGggZm9yIHJlY3Vyc2l2ZSBhY3Rpb25cbiAgICAgICAgZ3Jvd0JyYW5jaChicmFuY2gsIHJvb3RbYnJhbmNoXSwgbGFzdEtleSwgbGFzdFN0YXRlc0NvcHksIHNob3dWYWx1ZXMsIGhpZGVGdW5jdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHZhciBUcmVlaWZ5OiBhbnkgPSB7fTtcblxuICAvLyBUcmVlaWZ5LmFzTGluZXNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gT3V0cHV0cyB0aGUgdHJlZSBsaW5lLWJ5LWxpbmUsIGNhbGxpbmcgdGhlIGxpbmVDYWxsYmFjayB3aGVuIGVhY2ggb25lIGlzIGF2YWlsYWJsZS5cblxuICBUcmVlaWZ5LmFzTGluZXMgPSBmdW5jdGlvbihvYmosIHNob3dWYWx1ZXMsIGhpZGVGdW5jdGlvbnMsIGxpbmVDYWxsYmFjaykge1xuICAgIC8qIGhpZGVGdW5jdGlvbnMgYW5kIGxpbmVDYWxsYmFjayBhcmUgY3VycmllZCwgd2hpY2ggbWVhbnMgd2UgZG9uJ3QgYnJlYWsgYXBwcyB1c2luZyB0aGUgb2xkZXIgZm9ybSAqL1xuICAgIHZhciBoaWRlRnVuY3Rpb25zQXJnID0gdHlwZW9mIGhpZGVGdW5jdGlvbnMgIT09ICdmdW5jdGlvbicgPyBoaWRlRnVuY3Rpb25zIDogZmFsc2U7XG4gICAgZ3Jvd0JyYW5jaCgnLicsIG9iaiwgZmFsc2UsIFtdLCBzaG93VmFsdWVzLCBoaWRlRnVuY3Rpb25zQXJnLCBsaW5lQ2FsbGJhY2sgfHwgaGlkZUZ1bmN0aW9ucyk7XG4gIH07XG5cbiAgLy8gVHJlZWlmeS5hc1RyZWVcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gT3V0cHV0cyB0aGUgZW50aXJlIHRyZWUsIHJldHVybmluZyBpdCBhcyBhIHN0cmluZyB3aXRoIGxpbmUgYnJlYWtzLlxuXG4gIFRyZWVpZnkuYXNUcmVlID0gZnVuY3Rpb24ob2JqLCBzaG93VmFsdWVzLCBoaWRlRnVuY3Rpb25zKSB7XG4gICAgdmFyIHRyZWUgPSAnJztcbiAgICBncm93QnJhbmNoKCcuJywgb2JqLCBmYWxzZSwgW10sIHNob3dWYWx1ZXMsIGhpZGVGdW5jdGlvbnMsIGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgIHRyZWUgKz0gbGluZSArICdcXG4nO1xuICAgIH0pO1xuICAgIHJldHVybiB0cmVlO1xuICB9O1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcmV0dXJuIFRyZWVpZnk7XG5cbn0pKTtcbiJdfQ==