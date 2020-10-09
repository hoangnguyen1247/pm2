"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// json5.js
// Modern JSON. See README.md for details.
//
// This file is based directly off of Douglas Crockford's json_parse.js:
// https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
var JSON5 = (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' ? exports : {};

JSON5.parse = function () {
  "use strict"; // This is a function that can parse a JSON5 text, producing a JavaScript
  // data structure. It is a simple, recursive descent parser. It does not use
  // eval or regular expressions, so it can be used as a model for implementing
  // a JSON5 parser in other languages.
  // We are defining the function inside of another function to avoid creating
  // global variables.

  var at,
      // The index of the current character
  ch,
      // The current character
  escapee = {
    "'": "'",
    '"': '"',
    '\\': '\\',
    '/': '/',
    '\n': '',
    // Replace escaped newlines in strings w/ empty string
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t'
  },
      ws = [' ', '\t', '\r', '\n', '\v', '\f', '\xA0', "\uFEFF"],
      text,
      error = function error(m) {
    // Call error when something is wrong.
    var error = new SyntaxError();
    error.message = m;
    error.at = at;
    error.text = text;
    throw error;
  },
      next = function next(c) {
    // If a c parameter is provided, verify that it matches the current character.
    if (c && c !== ch) {
      error("Expected '" + c + "' instead of '" + ch + "'");
    } // Get the next character. When there are no more characters,
    // return the empty string.


    ch = text.charAt(at);
    at += 1;
    return ch;
  },
      peek = function peek() {
    // Get the next character without consuming it or
    // assigning it to the ch varaible.
    return text.charAt(at);
  },
      identifier = function identifier() {
    // Parse an identifier. Normally, reserved words are disallowed here, but we
    // only use this for unquoted object keys, where reserved words are allowed,
    // so we don't check for those here. References:
    // - http://es5.github.com/#x7.6
    // - https://developer.mozilla.org/en/Core_JavaScript_1.5_Guide/Core_Language_Features#Variables
    // - http://docstore.mik.ua/orelly/webprog/jscript/ch02_07.htm
    var key = ch; // Identifiers must start with a letter, _ or $.

    if (ch !== '_' && ch !== '$' && (ch < 'a' || ch > 'z') && (ch < 'A' || ch > 'Z')) {
      error("Bad identifier");
    } // Subsequent characters can contain digits.


    while (next() && (ch === '_' || ch === '$' || ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' || ch >= '0' && ch <= '9')) {
      key += ch;
    }

    return key;
  },
      number = function number() {
    // Parse a number value.
    var number,
        sign = '',
        string = '',
        base = 10;

    if (ch === '-' || ch === '+') {
      sign = ch;
      next(ch);
    } // support for Infinity (could tweak to allow other words):


    if (ch === 'I') {
      number = word();

      if (typeof number !== 'number' || isNaN(number)) {
        error('Unexpected word for number');
      }

      return sign === '-' ? -number : number;
    } // support for NaN


    if (ch === 'N') {
      number = word();

      if (!isNaN(number)) {
        error('expected word to be NaN');
      } // ignore sign as -NaN also is NaN


      return number;
    }

    if (ch === '0') {
      string += ch;
      next();

      if (ch === 'x' || ch === 'X') {
        string += ch;
        next();
        base = 16;
      } else if (ch >= '0' && ch <= '9') {
        error('Octal literal');
      }
    }

    switch (base) {
      case 10:
        while (ch >= '0' && ch <= '9') {
          string += ch;
          next();
        }

        if (ch === '.') {
          string += '.';

          while (next() && ch >= '0' && ch <= '9') {
            string += ch;
          }
        }

        if (ch === 'e' || ch === 'E') {
          string += ch;
          next();

          if (ch === '-' || ch === '+') {
            string += ch;
            next();
          }

          while (ch >= '0' && ch <= '9') {
            string += ch;
            next();
          }
        }

        break;

      case 16:
        while (ch >= '0' && ch <= '9' || ch >= 'A' && ch <= 'F' || ch >= 'a' && ch <= 'f') {
          string += ch;
          next();
        }

        break;
    }

    if (sign === '-') {
      number = -string;
    } else {
      number = +string;
    }

    if (!isFinite(number)) {
      error("Bad number");
    } else {
      return number;
    }
  },
      string = function string() {
    // Parse a string value.
    var hex,
        i,
        string = '',
        delim,
        // double quote or single quote
    uffff; // When parsing for string values, we must look for ' or " and \ characters.

    if (ch === '"' || ch === "'") {
      delim = ch;

      while (next()) {
        if (ch === delim) {
          next();
          return string;
        } else if (ch === '\\') {
          next();

          if (ch === 'u') {
            uffff = 0;

            for (i = 0; i < 4; i += 1) {
              hex = parseInt(next(), 16);

              if (!isFinite(hex)) {
                break;
              }

              uffff = uffff * 16 + hex;
            }

            string += String.fromCharCode(uffff);
          } else if (ch === '\r') {
            if (peek() === '\n') {
              next();
            }
          } else if (typeof escapee[ch] === 'string') {
            string += escapee[ch];
          } else {
            break;
          }
        } else if (ch === '\n') {
          // unescaped newlines are invalid; see:
          // https://github.com/aseemk/json5/issues/24
          // invalid unescaped chars?
          break;
        } else {
          string += ch;
        }
      }
    }

    error("Bad string");
  },
      inlineComment = function inlineComment() {
    // Skip an inline comment, assuming this is one. The current character should
    // be the second / character in the // pair that begins this inline comment.
    // To finish the inline comment, we look for a newline or the end of the text.
    if (ch !== '/') {
      error("Not an inline comment");
    }

    do {
      next();

      if (ch === '\n' || ch === '\r') {
        next();
        return;
      }
    } while (ch);
  },
      blockComment = function blockComment() {
    // Skip a block comment, assuming this is one. The current character should be
    // the * character in the /* pair that begins this block comment.
    // To finish the block comment, we look for an ending */ pair of characters,
    // but we also watch for the end of text before the comment is terminated.
    if (ch !== '*') {
      error("Not a block comment");
    }

    do {
      next();

      while (ch === '*') {
        next('*');

        if (ch === '/') {
          next('/');
          return;
        }
      }
    } while (ch);

    error("Unterminated block comment");
  },
      comment = function comment() {
    // Skip a comment, whether inline or block-level, assuming this is one.
    // Comments always begin with a / character.
    if (ch !== '/') {
      error("Not a comment");
    }

    next('/');

    if (ch === '/') {
      inlineComment();
    } else if (ch === '*') {
      blockComment();
    } else {
      error("Unrecognized comment");
    }
  },
      white = function white() {
    // Skip whitespace and comments.
    // Note that we're detecting comments by only a single / character.
    // This works since regular expressions are not valid JSON(5), but this will
    // break if there are other valid values that begin with a / character!
    while (ch) {
      if (ch === '/') {
        comment();
      } else if (ws.indexOf(ch) >= 0) {
        next();
      } else {
        return;
      }
    }
  },
      word = function word() {
    // true, false, or null.
    switch (ch) {
      case 't':
        next('t');
        next('r');
        next('u');
        next('e');
        return true;

      case 'f':
        next('f');
        next('a');
        next('l');
        next('s');
        next('e');
        return false;

      case 'n':
        next('n');
        next('u');
        next('l');
        next('l');
        return null;

      case 'I':
        next('I');
        next('n');
        next('f');
        next('i');
        next('n');
        next('i');
        next('t');
        next('y');
        return Infinity;

      case 'N':
        next('N');
        next('a');
        next('N');
        return NaN;
    }

    error("Unexpected '" + ch + "'");
  },
      value,
      // Place holder for the value function.
  array = function array() {
    // Parse an array value.
    var array = [];

    if (ch === '[') {
      next('[');
      white();

      while (ch) {
        if (ch === ']') {
          next(']');
          return array; // Potentially empty array
        } // ES5 allows omitting elements in arrays, e.g. [,] and
        // [,null]. We don't allow this in JSON5.


        if (ch === ',') {
          error("Missing array element");
        } else {
          array.push(value());
        }

        white(); // If there's no comma after this value, this needs to
        // be the end of the array.

        if (ch !== ',') {
          next(']');
          return array;
        }

        next(',');
        white();
      }
    }

    error("Bad array");
  },
      object = function object() {
    // Parse an object value.
    var key,
        object = {};

    if (ch === '{') {
      next('{');
      white();

      while (ch) {
        if (ch === '}') {
          next('}');
          return object; // Potentially empty object
        } // Keys can be unquoted. If they are, they need to be
        // valid JS identifiers.


        if (ch === '"' || ch === "'") {
          key = string();
        } else {
          key = identifier();
        }

        white();
        next(':');
        object[key] = value();
        white(); // If there's no comma after this pair, this needs to be
        // the end of the object.

        if (ch !== ',') {
          next('}');
          return object;
        }

        next(',');
        white();
      }
    }

    error("Bad object");
  };

  value = function value() {
    // Parse a JSON value. It could be an object, an array, a string, a number,
    // or a word.
    white();

    switch (ch) {
      case '{':
        return object();

      case '[':
        return array();

      case '"':
      case "'":
        return string();

      case '-':
      case '+':
      case '.':
        return number();

      default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
  }; // Return the json_parse function. It will have access to all of the above
  // functions and variables.


  return function (source, reviver) {
    var result;
    text = String(source);
    at = 0;
    ch = ' ';
    result = value();
    white();

    if (ch) {
      error("Syntax error");
    } // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.


    return typeof reviver === 'function' ? function walk(holder, key) {
      var k,
          v,
          value = holder[key];

      if (value && _typeof(value) === 'object') {
        for (k in value) {
          if (Object.prototype.hasOwnProperty.call(value, k)) {
            v = walk(value, k);

            if (v !== undefined) {
              value[k] = v;
            } else {
              delete value[k];
            }
          }
        }
      }

      return reviver.call(holder, key, value);
    }({
      '': result
    }, '') : result;
  };
}(); // JSON5 stringify will not quote keys where appropriate


JSON5.stringify = function (obj, replacer, space) {
  if (replacer && typeof replacer !== "function" && !isArray(replacer)) {
    throw new Error('Replacer must be a function or an array');
  }

  var getReplacedValueOrUndefined = function getReplacedValueOrUndefined(holder, key, isTopLevel) {
    var value = holder[key]; // Replace the value with its toJSON value first, if possible

    if (value && value.toJSON && typeof value.toJSON === "function") {
      value = value.toJSON();
    } // If the user-supplied replacer if a function, call it. If it's an array, check objects' string keys for
    // presence in the array (removing the key/value pair from the resulting JSON if the key is missing).


    if (typeof replacer === "function") {
      return replacer.call(holder, key, value);
    } else if (replacer) {
      if (isTopLevel || isArray(holder) || replacer.indexOf(key) >= 0) {
        return value;
      } else {
        return undefined;
      }
    } else {
      return value;
    }
  };

  function isWordChar(_char) {
    return _char >= 'a' && _char <= 'z' || _char >= 'A' && _char <= 'Z' || _char >= '0' && _char <= '9' || _char === '_' || _char === '$';
  }

  function isWordStart(_char2) {
    return _char2 >= 'a' && _char2 <= 'z' || _char2 >= 'A' && _char2 <= 'Z' || _char2 === '_' || _char2 === '$';
  }

  function isWord(key) {
    if (typeof key !== 'string') {
      return false;
    }

    if (!isWordStart(key[0])) {
      return false;
    }

    var i = 1,
        length = key.length;

    while (i < length) {
      if (!isWordChar(key[i])) {
        return false;
      }

      i++;
    }

    return true;
  } // export for use in tests


  JSON5.isWord = isWord; // polyfills

  function isArray(obj) {
    if (Array.isArray) {
      return Array.isArray(obj);
    } else {
      return Object.prototype.toString.call(obj) === '[object Array]';
    }
  }

  function isDate(obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
  } // isNaN = isNaN || function (val) {
  //   return typeof val === 'number' && val !== val;
  // };


  var objStack = [];

  function checkForCircular(obj) {
    for (var i = 0; i < objStack.length; i++) {
      if (objStack[i] === obj) {
        throw new TypeError("Converting circular structure to JSON");
      }
    }
  }

  function makeIndent(str, num, noNewLine) {
    if (!str) {
      return "";
    } // indentation no more than 10 chars


    if (str.length > 10) {
      str = str.substring(0, 10);
    }

    var indent = noNewLine ? "" : "\n";

    for (var i = 0; i < num; i++) {
      indent += str;
    }

    return indent;
  }

  var indentStr;

  if (space) {
    if (typeof space === "string") {
      indentStr = space;
    } else if (typeof space === "number" && space >= 0) {
      indentStr = makeIndent(" ", space, true);
    } else {// ignore space parameter
    }
  } // Copied from Crokford's implementation of JSON
  // See https://github.com/douglascrockford/JSON-js/blob/e39db4b7e6249f04a195e7dd0840e610cc9e941e/json2.js#L195
  // Begin


  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      meta = {
    // table of character substitutions
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
    '\\': '\\\\'
  };

  function escapeString(string) {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
      var c = meta[a];
      return typeof c === 'string' ? c : "\\u" + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
  } // End


  function internalStringify(holder, key, isTopLevel) {
    var buffer, res; // Replace the value, if necessary

    var obj_part = getReplacedValueOrUndefined(holder, key, isTopLevel);

    if (obj_part && !isDate(obj_part)) {
      // unbox objects
      // don't unbox dates, since will turn it into number
      obj_part = obj_part.valueOf();
    }

    switch (_typeof(obj_part)) {
      case "boolean":
        return obj_part.toString();

      case "number":
        if (isNaN(obj_part) || !isFinite(obj_part)) {
          return "null";
        }

        return obj_part.toString();

      case "string":
        return escapeString(obj_part.toString());

      case "object":
        if (obj_part === null) {
          return "null";
        } else if (isArray(obj_part)) {
          checkForCircular(obj_part);
          buffer = "[";
          objStack.push(obj_part);

          for (var i = 0; i < obj_part.length; i++) {
            res = internalStringify(obj_part, i, false);
            buffer += makeIndent(indentStr, objStack.length);

            if (res === null || typeof res === "undefined") {
              buffer += "null";
            } else {
              buffer += res;
            }

            if (i < obj_part.length - 1) {
              buffer += ",";
            } else if (indentStr) {
              buffer += "\n";
            }
          }

          objStack.pop();
          buffer += makeIndent(indentStr, objStack.length, true) + "]";
        } else {
          checkForCircular(obj_part);
          buffer = "{";
          var nonEmpty = false;
          objStack.push(obj_part);

          for (var prop in obj_part) {
            if (obj_part.hasOwnProperty(prop)) {
              var value = internalStringify(obj_part, prop, false);
              isTopLevel = false;

              if (typeof value !== "undefined" && value !== null) {
                buffer += makeIndent(indentStr, objStack.length);
                nonEmpty = true;
                var key = isWord(prop) ? prop : escapeString(prop);
                buffer += key + ":" + (indentStr ? ' ' : '') + value + ",";
              }
            }
          }

          objStack.pop();

          if (nonEmpty) {
            buffer = buffer.substring(0, buffer.length - 1) + makeIndent(indentStr, objStack.length) + "}";
          } else {
            buffer = '{}';
          }
        }

        return buffer;

      default:
        // functions and undefined should be ignored
        return undefined;
    }
  } // special case...when undefined is used inside of
  // a compound object/array, return null.
  // but when top-level, return undefined


  var topLevelHolder = {
    "": obj
  };

  if (obj === undefined) {
    return getReplacedValueOrUndefined(topLevelHolder, '', true);
  }

  return internalStringify(topLevelHolder, '', true);
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9qc29uNS50cyJdLCJuYW1lcyI6WyJKU09ONSIsImV4cG9ydHMiLCJwYXJzZSIsImF0IiwiY2giLCJlc2NhcGVlIiwiYiIsImYiLCJuIiwiciIsInQiLCJ3cyIsInRleHQiLCJlcnJvciIsIm0iLCJTeW50YXhFcnJvciIsIm1lc3NhZ2UiLCJuZXh0IiwiYyIsImNoYXJBdCIsInBlZWsiLCJpZGVudGlmaWVyIiwia2V5IiwibnVtYmVyIiwic2lnbiIsInN0cmluZyIsImJhc2UiLCJ3b3JkIiwiaXNOYU4iLCJpc0Zpbml0ZSIsImhleCIsImkiLCJkZWxpbSIsInVmZmZmIiwicGFyc2VJbnQiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJpbmxpbmVDb21tZW50IiwiYmxvY2tDb21tZW50IiwiY29tbWVudCIsIndoaXRlIiwiaW5kZXhPZiIsIkluZmluaXR5IiwiTmFOIiwidmFsdWUiLCJhcnJheSIsInB1c2giLCJvYmplY3QiLCJzb3VyY2UiLCJyZXZpdmVyIiwicmVzdWx0Iiwid2FsayIsImhvbGRlciIsImsiLCJ2IiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwidW5kZWZpbmVkIiwic3RyaW5naWZ5Iiwib2JqIiwicmVwbGFjZXIiLCJzcGFjZSIsImlzQXJyYXkiLCJFcnJvciIsImdldFJlcGxhY2VkVmFsdWVPclVuZGVmaW5lZCIsImlzVG9wTGV2ZWwiLCJ0b0pTT04iLCJpc1dvcmRDaGFyIiwiY2hhciIsImlzV29yZFN0YXJ0IiwiaXNXb3JkIiwibGVuZ3RoIiwiQXJyYXkiLCJ0b1N0cmluZyIsImlzRGF0ZSIsIm9ialN0YWNrIiwiY2hlY2tGb3JDaXJjdWxhciIsIlR5cGVFcnJvciIsIm1ha2VJbmRlbnQiLCJzdHIiLCJudW0iLCJub05ld0xpbmUiLCJzdWJzdHJpbmciLCJpbmRlbnQiLCJpbmRlbnRTdHIiLCJjeCIsImVzY2FwYWJsZSIsIm1ldGEiLCJlc2NhcGVTdHJpbmciLCJsYXN0SW5kZXgiLCJ0ZXN0IiwicmVwbGFjZSIsImEiLCJjaGFyQ29kZUF0Iiwic2xpY2UiLCJpbnRlcm5hbFN0cmluZ2lmeSIsImJ1ZmZlciIsInJlcyIsIm9ial9wYXJ0IiwidmFsdWVPZiIsInBvcCIsIm5vbkVtcHR5IiwicHJvcCIsInRvcExldmVsSG9sZGVyIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBLElBQUlBLEtBQUssR0FBSSxRQUFPQyxPQUFQLHlDQUFPQSxPQUFQLE9BQW1CLFFBQW5CLEdBQThCQSxPQUE5QixHQUF3QyxFQUFyRDs7QUFFQUQsS0FBSyxDQUFDRSxLQUFOLEdBQWUsWUFBWTtBQUN6QixlQUR5QixDQUd6QjtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7O0FBRUEsTUFBSUMsRUFBSjtBQUFBLE1BQVk7QUFDVkMsRUFBQUEsRUFERjtBQUFBLE1BQ1U7QUFDUkMsRUFBQUEsT0FBTyxHQUFHO0FBQ1IsU0FBSyxHQURHO0FBRVIsU0FBSyxHQUZHO0FBR1IsVUFBTSxJQUhFO0FBSVIsU0FBSyxHQUpHO0FBS1IsVUFBTSxFQUxFO0FBS1E7QUFDaEJDLElBQUFBLENBQUMsRUFBRSxJQU5LO0FBT1JDLElBQUFBLENBQUMsRUFBRSxJQVBLO0FBUVJDLElBQUFBLENBQUMsRUFBRSxJQVJLO0FBU1JDLElBQUFBLENBQUMsRUFBRSxJQVRLO0FBVVJDLElBQUFBLENBQUMsRUFBRTtBQVZLLEdBRlo7QUFBQSxNQWNFQyxFQUFFLEdBQUcsQ0FDSCxHQURHLEVBRUgsSUFGRyxFQUdILElBSEcsRUFJSCxJQUpHLEVBS0gsSUFMRyxFQU1ILElBTkcsRUFPSCxNQVBHLEVBUUgsUUFSRyxDQWRQO0FBQUEsTUF3QkVDLElBeEJGO0FBQUEsTUEwQkVDLEtBQUssR0FBRyxlQUFVQyxDQUFWLEVBQWE7QUFFbkI7QUFFQSxRQUFJRCxLQUFVLEdBQUcsSUFBSUUsV0FBSixFQUFqQjtBQUNBRixJQUFBQSxLQUFLLENBQUNHLE9BQU4sR0FBZ0JGLENBQWhCO0FBQ0FELElBQUFBLEtBQUssQ0FBQ1YsRUFBTixHQUFXQSxFQUFYO0FBQ0FVLElBQUFBLEtBQUssQ0FBQ0QsSUFBTixHQUFhQSxJQUFiO0FBQ0EsVUFBTUMsS0FBTjtBQUNELEdBbkNIO0FBQUEsTUFxQ0VJLElBQVMsR0FBRyxTQUFaQSxJQUFZLENBQVVDLENBQVYsRUFBYTtBQUV2QjtBQUVBLFFBQUlBLENBQUMsSUFBSUEsQ0FBQyxLQUFLZCxFQUFmLEVBQW1CO0FBQ2pCUyxNQUFBQSxLQUFLLENBQUMsZUFBZUssQ0FBZixHQUFtQixnQkFBbkIsR0FBc0NkLEVBQXRDLEdBQTJDLEdBQTVDLENBQUw7QUFDRCxLQU5zQixDQVF2QjtBQUNBOzs7QUFFQUEsSUFBQUEsRUFBRSxHQUFHUSxJQUFJLENBQUNPLE1BQUwsQ0FBWWhCLEVBQVosQ0FBTDtBQUNBQSxJQUFBQSxFQUFFLElBQUksQ0FBTjtBQUNBLFdBQU9DLEVBQVA7QUFDRCxHQW5ESDtBQUFBLE1BcURFZ0IsSUFBSSxHQUFHLFNBQVBBLElBQU8sR0FBWTtBQUVqQjtBQUNBO0FBRUEsV0FBT1IsSUFBSSxDQUFDTyxNQUFMLENBQVloQixFQUFaLENBQVA7QUFDRCxHQTNESDtBQUFBLE1BNkRFa0IsVUFBVSxHQUFHLFNBQWJBLFVBQWEsR0FBWTtBQUV2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQSxRQUFJQyxHQUFHLEdBQUdsQixFQUFWLENBVHVCLENBV3ZCOztBQUNBLFFBQUtBLEVBQUUsS0FBSyxHQUFQLElBQWNBLEVBQUUsS0FBSyxHQUF0QixLQUNEQSxFQUFFLEdBQUcsR0FBTCxJQUFZQSxFQUFFLEdBQUcsR0FEaEIsTUFFREEsRUFBRSxHQUFHLEdBQUwsSUFBWUEsRUFBRSxHQUFHLEdBRmhCLENBQUosRUFFMEI7QUFDeEJTLE1BQUFBLEtBQUssQ0FBQyxnQkFBRCxDQUFMO0FBQ0QsS0FoQnNCLENBa0J2Qjs7O0FBQ0EsV0FBT0ksSUFBSSxPQUNUYixFQUFFLEtBQUssR0FBUCxJQUFjQSxFQUFFLEtBQUssR0FBckIsSUFDQ0EsRUFBRSxJQUFJLEdBQU4sSUFBYUEsRUFBRSxJQUFJLEdBRHBCLElBRUNBLEVBQUUsSUFBSSxHQUFOLElBQWFBLEVBQUUsSUFBSSxHQUZwQixJQUdDQSxFQUFFLElBQUksR0FBTixJQUFhQSxFQUFFLElBQUksR0FKWCxDQUFYLEVBSTZCO0FBQzNCa0IsTUFBQUEsR0FBRyxJQUFJbEIsRUFBUDtBQUNEOztBQUVELFdBQU9rQixHQUFQO0FBQ0QsR0F6Rkg7QUFBQSxNQTJGRUMsTUFBTSxHQUFHLGtCQUFZO0FBRW5CO0FBRUEsUUFBSUEsTUFBSjtBQUFBLFFBQ0VDLElBQUksR0FBRyxFQURUO0FBQUEsUUFFRUMsTUFBTSxHQUFHLEVBRlg7QUFBQSxRQUdFQyxJQUFJLEdBQUcsRUFIVDs7QUFLQSxRQUFJdEIsRUFBRSxLQUFLLEdBQVAsSUFBY0EsRUFBRSxLQUFLLEdBQXpCLEVBQThCO0FBQzVCb0IsTUFBQUEsSUFBSSxHQUFHcEIsRUFBUDtBQUNBYSxNQUFBQSxJQUFJLENBQUNiLEVBQUQsQ0FBSjtBQUNELEtBWmtCLENBY25COzs7QUFDQSxRQUFJQSxFQUFFLEtBQUssR0FBWCxFQUFnQjtBQUNkbUIsTUFBQUEsTUFBTSxHQUFHSSxJQUFJLEVBQWI7O0FBQ0EsVUFBSSxPQUFPSixNQUFQLEtBQWtCLFFBQWxCLElBQThCSyxLQUFLLENBQUNMLE1BQUQsQ0FBdkMsRUFBaUQ7QUFDL0NWLFFBQUFBLEtBQUssQ0FBQyw0QkFBRCxDQUFMO0FBQ0Q7O0FBQ0QsYUFBUVcsSUFBSSxLQUFLLEdBQVYsR0FBaUIsQ0FBQ0QsTUFBbEIsR0FBMkJBLE1BQWxDO0FBQ0QsS0FyQmtCLENBdUJuQjs7O0FBQ0EsUUFBSW5CLEVBQUUsS0FBSyxHQUFYLEVBQWdCO0FBQ2RtQixNQUFBQSxNQUFNLEdBQUdJLElBQUksRUFBYjs7QUFDQSxVQUFJLENBQUNDLEtBQUssQ0FBQ0wsTUFBRCxDQUFWLEVBQW9CO0FBQ2xCVixRQUFBQSxLQUFLLENBQUMseUJBQUQsQ0FBTDtBQUNELE9BSmEsQ0FLZDs7O0FBQ0EsYUFBT1UsTUFBUDtBQUNEOztBQUVELFFBQUluQixFQUFFLEtBQUssR0FBWCxFQUFnQjtBQUNkcUIsTUFBQUEsTUFBTSxJQUFJckIsRUFBVjtBQUNBYSxNQUFBQSxJQUFJOztBQUNKLFVBQUliLEVBQUUsS0FBSyxHQUFQLElBQWNBLEVBQUUsS0FBSyxHQUF6QixFQUE4QjtBQUM1QnFCLFFBQUFBLE1BQU0sSUFBSXJCLEVBQVY7QUFDQWEsUUFBQUEsSUFBSTtBQUNKUyxRQUFBQSxJQUFJLEdBQUcsRUFBUDtBQUNELE9BSkQsTUFJTyxJQUFJdEIsRUFBRSxJQUFJLEdBQU4sSUFBYUEsRUFBRSxJQUFJLEdBQXZCLEVBQTRCO0FBQ2pDUyxRQUFBQSxLQUFLLENBQUMsZUFBRCxDQUFMO0FBQ0Q7QUFDRjs7QUFFRCxZQUFRYSxJQUFSO0FBQ0UsV0FBSyxFQUFMO0FBQ0UsZUFBT3RCLEVBQUUsSUFBSSxHQUFOLElBQWFBLEVBQUUsSUFBSSxHQUExQixFQUErQjtBQUM3QnFCLFVBQUFBLE1BQU0sSUFBSXJCLEVBQVY7QUFDQWEsVUFBQUEsSUFBSTtBQUNMOztBQUNELFlBQUliLEVBQUUsS0FBSyxHQUFYLEVBQWdCO0FBQ2RxQixVQUFBQSxNQUFNLElBQUksR0FBVjs7QUFDQSxpQkFBT1IsSUFBSSxNQUFNYixFQUFFLElBQUksR0FBaEIsSUFBdUJBLEVBQUUsSUFBSSxHQUFwQyxFQUF5QztBQUN2Q3FCLFlBQUFBLE1BQU0sSUFBSXJCLEVBQVY7QUFDRDtBQUNGOztBQUNELFlBQUlBLEVBQUUsS0FBSyxHQUFQLElBQWNBLEVBQUUsS0FBSyxHQUF6QixFQUE4QjtBQUM1QnFCLFVBQUFBLE1BQU0sSUFBSXJCLEVBQVY7QUFDQWEsVUFBQUEsSUFBSTs7QUFDSixjQUFJYixFQUFFLEtBQUssR0FBUCxJQUFjQSxFQUFFLEtBQUssR0FBekIsRUFBOEI7QUFDNUJxQixZQUFBQSxNQUFNLElBQUlyQixFQUFWO0FBQ0FhLFlBQUFBLElBQUk7QUFDTDs7QUFDRCxpQkFBT2IsRUFBRSxJQUFJLEdBQU4sSUFBYUEsRUFBRSxJQUFJLEdBQTFCLEVBQStCO0FBQzdCcUIsWUFBQUEsTUFBTSxJQUFJckIsRUFBVjtBQUNBYSxZQUFBQSxJQUFJO0FBQ0w7QUFDRjs7QUFDRDs7QUFDRixXQUFLLEVBQUw7QUFDRSxlQUFPYixFQUFFLElBQUksR0FBTixJQUFhQSxFQUFFLElBQUksR0FBbkIsSUFBMEJBLEVBQUUsSUFBSSxHQUFOLElBQWFBLEVBQUUsSUFBSSxHQUE3QyxJQUFvREEsRUFBRSxJQUFJLEdBQU4sSUFBYUEsRUFBRSxJQUFJLEdBQTlFLEVBQW1GO0FBQ2pGcUIsVUFBQUEsTUFBTSxJQUFJckIsRUFBVjtBQUNBYSxVQUFBQSxJQUFJO0FBQ0w7O0FBQ0Q7QUE5Qko7O0FBaUNBLFFBQUlPLElBQUksS0FBSyxHQUFiLEVBQWtCO0FBQ2hCRCxNQUFBQSxNQUFNLEdBQUcsQ0FBQ0UsTUFBVjtBQUNELEtBRkQsTUFFTztBQUNMRixNQUFBQSxNQUFNLEdBQUcsQ0FBQ0UsTUFBVjtBQUNEOztBQUVELFFBQUksQ0FBQ0ksUUFBUSxDQUFDTixNQUFELENBQWIsRUFBdUI7QUFDckJWLE1BQUFBLEtBQUssQ0FBQyxZQUFELENBQUw7QUFDRCxLQUZELE1BRU87QUFDTCxhQUFPVSxNQUFQO0FBQ0Q7QUFDRixHQXBMSDtBQUFBLE1Bc0xFRSxNQUFNLEdBQUcsa0JBQVk7QUFFbkI7QUFFQSxRQUFJSyxHQUFKO0FBQUEsUUFDRUMsQ0FERjtBQUFBLFFBRUVOLE1BQU0sR0FBRyxFQUZYO0FBQUEsUUFHRU8sS0FIRjtBQUFBLFFBR2M7QUFDWkMsSUFBQUEsS0FKRixDQUptQixDQVVuQjs7QUFFQSxRQUFJN0IsRUFBRSxLQUFLLEdBQVAsSUFBY0EsRUFBRSxLQUFLLEdBQXpCLEVBQThCO0FBQzVCNEIsTUFBQUEsS0FBSyxHQUFHNUIsRUFBUjs7QUFDQSxhQUFPYSxJQUFJLEVBQVgsRUFBZTtBQUNiLFlBQUliLEVBQUUsS0FBSzRCLEtBQVgsRUFBa0I7QUFDaEJmLFVBQUFBLElBQUk7QUFDSixpQkFBT1EsTUFBUDtBQUNELFNBSEQsTUFHTyxJQUFJckIsRUFBRSxLQUFLLElBQVgsRUFBaUI7QUFDdEJhLFVBQUFBLElBQUk7O0FBQ0osY0FBSWIsRUFBRSxLQUFLLEdBQVgsRUFBZ0I7QUFDZDZCLFlBQUFBLEtBQUssR0FBRyxDQUFSOztBQUNBLGlCQUFLRixDQUFDLEdBQUcsQ0FBVCxFQUFZQSxDQUFDLEdBQUcsQ0FBaEIsRUFBbUJBLENBQUMsSUFBSSxDQUF4QixFQUEyQjtBQUN6QkQsY0FBQUEsR0FBRyxHQUFHSSxRQUFRLENBQUNqQixJQUFJLEVBQUwsRUFBUyxFQUFULENBQWQ7O0FBQ0Esa0JBQUksQ0FBQ1ksUUFBUSxDQUFDQyxHQUFELENBQWIsRUFBb0I7QUFDbEI7QUFDRDs7QUFDREcsY0FBQUEsS0FBSyxHQUFHQSxLQUFLLEdBQUcsRUFBUixHQUFhSCxHQUFyQjtBQUNEOztBQUNETCxZQUFBQSxNQUFNLElBQUlVLE1BQU0sQ0FBQ0MsWUFBUCxDQUFvQkgsS0FBcEIsQ0FBVjtBQUNELFdBVkQsTUFVTyxJQUFJN0IsRUFBRSxLQUFLLElBQVgsRUFBaUI7QUFDdEIsZ0JBQUlnQixJQUFJLE9BQU8sSUFBZixFQUFxQjtBQUNuQkgsY0FBQUEsSUFBSTtBQUNMO0FBQ0YsV0FKTSxNQUlBLElBQUksT0FBT1osT0FBTyxDQUFDRCxFQUFELENBQWQsS0FBdUIsUUFBM0IsRUFBcUM7QUFDMUNxQixZQUFBQSxNQUFNLElBQUlwQixPQUFPLENBQUNELEVBQUQsQ0FBakI7QUFDRCxXQUZNLE1BRUE7QUFDTDtBQUNEO0FBQ0YsU0FyQk0sTUFxQkEsSUFBSUEsRUFBRSxLQUFLLElBQVgsRUFBaUI7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDRCxTQUxNLE1BS0E7QUFDTHFCLFVBQUFBLE1BQU0sSUFBSXJCLEVBQVY7QUFDRDtBQUNGO0FBQ0Y7O0FBQ0RTLElBQUFBLEtBQUssQ0FBQyxZQUFELENBQUw7QUFDRCxHQXhPSDtBQUFBLE1BME9Fd0IsYUFBYSxHQUFHLFNBQWhCQSxhQUFnQixHQUFZO0FBRTFCO0FBQ0E7QUFDQTtBQUVBLFFBQUlqQyxFQUFFLEtBQUssR0FBWCxFQUFnQjtBQUNkUyxNQUFBQSxLQUFLLENBQUMsdUJBQUQsQ0FBTDtBQUNEOztBQUVELE9BQUc7QUFDREksTUFBQUEsSUFBSTs7QUFDSixVQUFJYixFQUFFLEtBQUssSUFBUCxJQUFlQSxFQUFFLEtBQUssSUFBMUIsRUFBZ0M7QUFDOUJhLFFBQUFBLElBQUk7QUFDSjtBQUNEO0FBQ0YsS0FORCxRQU1TYixFQU5UO0FBT0QsR0EzUEg7QUFBQSxNQTZQRWtDLFlBQVksR0FBRyxTQUFmQSxZQUFlLEdBQVk7QUFFekI7QUFDQTtBQUNBO0FBQ0E7QUFFQSxRQUFJbEMsRUFBRSxLQUFLLEdBQVgsRUFBZ0I7QUFDZFMsTUFBQUEsS0FBSyxDQUFDLHFCQUFELENBQUw7QUFDRDs7QUFFRCxPQUFHO0FBQ0RJLE1BQUFBLElBQUk7O0FBQ0osYUFBT2IsRUFBRSxLQUFLLEdBQWQsRUFBbUI7QUFDakJhLFFBQUFBLElBQUksQ0FBQyxHQUFELENBQUo7O0FBQ0EsWUFBSWIsRUFBRSxLQUFLLEdBQVgsRUFBZ0I7QUFDZGEsVUFBQUEsSUFBSSxDQUFDLEdBQUQsQ0FBSjtBQUNBO0FBQ0Q7QUFDRjtBQUNGLEtBVEQsUUFTU2IsRUFUVDs7QUFXQVMsSUFBQUEsS0FBSyxDQUFDLDRCQUFELENBQUw7QUFDRCxHQXBSSDtBQUFBLE1Bc1JFMEIsT0FBTyxHQUFHLFNBQVZBLE9BQVUsR0FBWTtBQUVwQjtBQUNBO0FBRUEsUUFBSW5DLEVBQUUsS0FBSyxHQUFYLEVBQWdCO0FBQ2RTLE1BQUFBLEtBQUssQ0FBQyxlQUFELENBQUw7QUFDRDs7QUFFREksSUFBQUEsSUFBSSxDQUFDLEdBQUQsQ0FBSjs7QUFFQSxRQUFJYixFQUFFLEtBQUssR0FBWCxFQUFnQjtBQUNkaUMsTUFBQUEsYUFBYTtBQUNkLEtBRkQsTUFFTyxJQUFJakMsRUFBRSxLQUFLLEdBQVgsRUFBZ0I7QUFDckJrQyxNQUFBQSxZQUFZO0FBQ2IsS0FGTSxNQUVBO0FBQ0x6QixNQUFBQSxLQUFLLENBQUMsc0JBQUQsQ0FBTDtBQUNEO0FBQ0YsR0F4U0g7QUFBQSxNQTBTRTJCLEtBQUssR0FBRyxTQUFSQSxLQUFRLEdBQVk7QUFFbEI7QUFDQTtBQUNBO0FBQ0E7QUFFQSxXQUFPcEMsRUFBUCxFQUFXO0FBQ1QsVUFBSUEsRUFBRSxLQUFLLEdBQVgsRUFBZ0I7QUFDZG1DLFFBQUFBLE9BQU87QUFDUixPQUZELE1BRU8sSUFBSTVCLEVBQUUsQ0FBQzhCLE9BQUgsQ0FBV3JDLEVBQVgsS0FBa0IsQ0FBdEIsRUFBeUI7QUFDOUJhLFFBQUFBLElBQUk7QUFDTCxPQUZNLE1BRUE7QUFDTDtBQUNEO0FBQ0Y7QUFDRixHQTFUSDtBQUFBLE1BNFRFVSxJQUFJLEdBQUcsU0FBUEEsSUFBTyxHQUFZO0FBRWpCO0FBRUEsWUFBUXZCLEVBQVI7QUFDRSxXQUFLLEdBQUw7QUFDRWEsUUFBQUEsSUFBSSxDQUFDLEdBQUQsQ0FBSjtBQUNBQSxRQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0FBLFFBQUFBLElBQUksQ0FBQyxHQUFELENBQUo7QUFDQUEsUUFBQUEsSUFBSSxDQUFDLEdBQUQsQ0FBSjtBQUNBLGVBQU8sSUFBUDs7QUFDRixXQUFLLEdBQUw7QUFDRUEsUUFBQUEsSUFBSSxDQUFDLEdBQUQsQ0FBSjtBQUNBQSxRQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0FBLFFBQUFBLElBQUksQ0FBQyxHQUFELENBQUo7QUFDQUEsUUFBQUEsSUFBSSxDQUFDLEdBQUQsQ0FBSjtBQUNBQSxRQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0EsZUFBTyxLQUFQOztBQUNGLFdBQUssR0FBTDtBQUNFQSxRQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0FBLFFBQUFBLElBQUksQ0FBQyxHQUFELENBQUo7QUFDQUEsUUFBQUEsSUFBSSxDQUFDLEdBQUQsQ0FBSjtBQUNBQSxRQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0EsZUFBTyxJQUFQOztBQUNGLFdBQUssR0FBTDtBQUNFQSxRQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0FBLFFBQUFBLElBQUksQ0FBQyxHQUFELENBQUo7QUFDQUEsUUFBQUEsSUFBSSxDQUFDLEdBQUQsQ0FBSjtBQUNBQSxRQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0FBLFFBQUFBLElBQUksQ0FBQyxHQUFELENBQUo7QUFDQUEsUUFBQUEsSUFBSSxDQUFDLEdBQUQsQ0FBSjtBQUNBQSxRQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0FBLFFBQUFBLElBQUksQ0FBQyxHQUFELENBQUo7QUFDQSxlQUFPeUIsUUFBUDs7QUFDRixXQUFLLEdBQUw7QUFDRXpCLFFBQUFBLElBQUksQ0FBQyxHQUFELENBQUo7QUFDQUEsUUFBQUEsSUFBSSxDQUFDLEdBQUQsQ0FBSjtBQUNBQSxRQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0EsZUFBTzBCLEdBQVA7QUFsQ0o7O0FBb0NBOUIsSUFBQUEsS0FBSyxDQUFDLGlCQUFpQlQsRUFBakIsR0FBc0IsR0FBdkIsQ0FBTDtBQUNELEdBcldIO0FBQUEsTUF1V0V3QyxLQXZXRjtBQUFBLE1BdVdVO0FBRVJDLEVBQUFBLEtBQUssR0FBRyxpQkFBWTtBQUVsQjtBQUVBLFFBQUlBLEtBQUssR0FBRyxFQUFaOztBQUVBLFFBQUl6QyxFQUFFLEtBQUssR0FBWCxFQUFnQjtBQUNkYSxNQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0F1QixNQUFBQSxLQUFLOztBQUNMLGFBQU9wQyxFQUFQLEVBQVc7QUFDVCxZQUFJQSxFQUFFLEtBQUssR0FBWCxFQUFnQjtBQUNkYSxVQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0EsaUJBQU80QixLQUFQLENBRmMsQ0FFRTtBQUNqQixTQUpRLENBS1Q7QUFDQTs7O0FBQ0EsWUFBSXpDLEVBQUUsS0FBSyxHQUFYLEVBQWdCO0FBQ2RTLFVBQUFBLEtBQUssQ0FBQyx1QkFBRCxDQUFMO0FBQ0QsU0FGRCxNQUVPO0FBQ0xnQyxVQUFBQSxLQUFLLENBQUNDLElBQU4sQ0FBV0YsS0FBSyxFQUFoQjtBQUNEOztBQUNESixRQUFBQSxLQUFLLEdBWkksQ0FhVDtBQUNBOztBQUNBLFlBQUlwQyxFQUFFLEtBQUssR0FBWCxFQUFnQjtBQUNkYSxVQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0EsaUJBQU80QixLQUFQO0FBQ0Q7O0FBQ0Q1QixRQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0F1QixRQUFBQSxLQUFLO0FBQ047QUFDRjs7QUFDRDNCLElBQUFBLEtBQUssQ0FBQyxXQUFELENBQUw7QUFDRCxHQTFZSDtBQUFBLE1BNFlFa0MsTUFBTSxHQUFHLGtCQUFZO0FBRW5CO0FBRUEsUUFBSXpCLEdBQUo7QUFBQSxRQUNFeUIsTUFBTSxHQUFHLEVBRFg7O0FBR0EsUUFBSTNDLEVBQUUsS0FBSyxHQUFYLEVBQWdCO0FBQ2RhLE1BQUFBLElBQUksQ0FBQyxHQUFELENBQUo7QUFDQXVCLE1BQUFBLEtBQUs7O0FBQ0wsYUFBT3BDLEVBQVAsRUFBVztBQUNULFlBQUlBLEVBQUUsS0FBSyxHQUFYLEVBQWdCO0FBQ2RhLFVBQUFBLElBQUksQ0FBQyxHQUFELENBQUo7QUFDQSxpQkFBTzhCLE1BQVAsQ0FGYyxDQUVHO0FBQ2xCLFNBSlEsQ0FNVDtBQUNBOzs7QUFDQSxZQUFJM0MsRUFBRSxLQUFLLEdBQVAsSUFBY0EsRUFBRSxLQUFLLEdBQXpCLEVBQThCO0FBQzVCa0IsVUFBQUEsR0FBRyxHQUFHRyxNQUFNLEVBQVo7QUFDRCxTQUZELE1BRU87QUFDTEgsVUFBQUEsR0FBRyxHQUFHRCxVQUFVLEVBQWhCO0FBQ0Q7O0FBRURtQixRQUFBQSxLQUFLO0FBQ0x2QixRQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0E4QixRQUFBQSxNQUFNLENBQUN6QixHQUFELENBQU4sR0FBY3NCLEtBQUssRUFBbkI7QUFDQUosUUFBQUEsS0FBSyxHQWpCSSxDQWtCVDtBQUNBOztBQUNBLFlBQUlwQyxFQUFFLEtBQUssR0FBWCxFQUFnQjtBQUNkYSxVQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0EsaUJBQU84QixNQUFQO0FBQ0Q7O0FBQ0Q5QixRQUFBQSxJQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0F1QixRQUFBQSxLQUFLO0FBQ047QUFDRjs7QUFDRDNCLElBQUFBLEtBQUssQ0FBQyxZQUFELENBQUw7QUFDRCxHQW5iSDs7QUFxYkErQixFQUFBQSxLQUFLLEdBQUcsaUJBQVk7QUFFbEI7QUFDQTtBQUVBSixJQUFBQSxLQUFLOztBQUNMLFlBQVFwQyxFQUFSO0FBQ0UsV0FBSyxHQUFMO0FBQ0UsZUFBTzJDLE1BQU0sRUFBYjs7QUFDRixXQUFLLEdBQUw7QUFDRSxlQUFPRixLQUFLLEVBQVo7O0FBQ0YsV0FBSyxHQUFMO0FBQ0EsV0FBSyxHQUFMO0FBQ0UsZUFBT3BCLE1BQU0sRUFBYjs7QUFDRixXQUFLLEdBQUw7QUFDQSxXQUFLLEdBQUw7QUFDQSxXQUFLLEdBQUw7QUFDRSxlQUFPRixNQUFNLEVBQWI7O0FBQ0Y7QUFDRSxlQUFPbkIsRUFBRSxJQUFJLEdBQU4sSUFBYUEsRUFBRSxJQUFJLEdBQW5CLEdBQXlCbUIsTUFBTSxFQUEvQixHQUFvQ0ksSUFBSSxFQUEvQztBQWJKO0FBZUQsR0FyQkQsQ0FoY3lCLENBdWR6QjtBQUNBOzs7QUFFQSxTQUFPLFVBQVVxQixNQUFWLEVBQWtCQyxPQUFsQixFQUEyQjtBQUNoQyxRQUFJQyxNQUFKO0FBRUF0QyxJQUFBQSxJQUFJLEdBQUd1QixNQUFNLENBQUNhLE1BQUQsQ0FBYjtBQUNBN0MsSUFBQUEsRUFBRSxHQUFHLENBQUw7QUFDQUMsSUFBQUEsRUFBRSxHQUFHLEdBQUw7QUFDQThDLElBQUFBLE1BQU0sR0FBR04sS0FBSyxFQUFkO0FBQ0FKLElBQUFBLEtBQUs7O0FBQ0wsUUFBSXBDLEVBQUosRUFBUTtBQUNOUyxNQUFBQSxLQUFLLENBQUMsY0FBRCxDQUFMO0FBQ0QsS0FWK0IsQ0FZaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBRUEsV0FBTyxPQUFPb0MsT0FBUCxLQUFtQixVQUFuQixHQUFpQyxTQUFTRSxJQUFULENBQWNDLE1BQWQsRUFBc0I5QixHQUF0QixFQUEyQjtBQUNqRSxVQUFJK0IsQ0FBSjtBQUFBLFVBQU9DLENBQVA7QUFBQSxVQUFVVixLQUFLLEdBQUdRLE1BQU0sQ0FBQzlCLEdBQUQsQ0FBeEI7O0FBQ0EsVUFBSXNCLEtBQUssSUFBSSxRQUFPQSxLQUFQLE1BQWlCLFFBQTlCLEVBQXdDO0FBQ3RDLGFBQUtTLENBQUwsSUFBVVQsS0FBVixFQUFpQjtBQUNmLGNBQUlXLE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQkMsY0FBakIsQ0FBZ0NDLElBQWhDLENBQXFDZCxLQUFyQyxFQUE0Q1MsQ0FBNUMsQ0FBSixFQUFvRDtBQUNsREMsWUFBQUEsQ0FBQyxHQUFHSCxJQUFJLENBQUNQLEtBQUQsRUFBUVMsQ0FBUixDQUFSOztBQUNBLGdCQUFJQyxDQUFDLEtBQUtLLFNBQVYsRUFBcUI7QUFDbkJmLGNBQUFBLEtBQUssQ0FBQ1MsQ0FBRCxDQUFMLEdBQVdDLENBQVg7QUFDRCxhQUZELE1BRU87QUFDTCxxQkFBT1YsS0FBSyxDQUFDUyxDQUFELENBQVo7QUFDRDtBQUNGO0FBQ0Y7QUFDRjs7QUFDRCxhQUFPSixPQUFPLENBQUNTLElBQVIsQ0FBYU4sTUFBYixFQUFxQjlCLEdBQXJCLEVBQTBCc0IsS0FBMUIsQ0FBUDtBQUNELEtBZnVDLENBZXRDO0FBQUUsVUFBSU07QUFBTixLQWZzQyxFQWV0QixFQWZzQixDQUFqQyxHQWVrQkEsTUFmekI7QUFnQkQsR0FsQ0Q7QUFtQ0QsQ0E3ZmMsRUFBZixDLENBK2ZBOzs7QUFDQWxELEtBQUssQ0FBQzRELFNBQU4sR0FBa0IsVUFBVUMsR0FBVixFQUFlQyxRQUFmLEVBQXlCQyxLQUF6QixFQUFnQztBQUNoRCxNQUFJRCxRQUFRLElBQUssT0FBUUEsUUFBUixLQUFzQixVQUF0QixJQUFvQyxDQUFDRSxPQUFPLENBQUNGLFFBQUQsQ0FBN0QsRUFBMEU7QUFDeEUsVUFBTSxJQUFJRyxLQUFKLENBQVUseUNBQVYsQ0FBTjtBQUNEOztBQUNELE1BQUlDLDJCQUEyQixHQUFHLFNBQTlCQSwyQkFBOEIsQ0FBVWQsTUFBVixFQUFrQjlCLEdBQWxCLEVBQXVCNkMsVUFBdkIsRUFBbUM7QUFDbkUsUUFBSXZCLEtBQUssR0FBR1EsTUFBTSxDQUFDOUIsR0FBRCxDQUFsQixDQURtRSxDQUduRTs7QUFDQSxRQUFJc0IsS0FBSyxJQUFJQSxLQUFLLENBQUN3QixNQUFmLElBQXlCLE9BQU94QixLQUFLLENBQUN3QixNQUFiLEtBQXdCLFVBQXJELEVBQWlFO0FBQy9EeEIsTUFBQUEsS0FBSyxHQUFHQSxLQUFLLENBQUN3QixNQUFOLEVBQVI7QUFDRCxLQU5rRSxDQVFuRTtBQUNBOzs7QUFDQSxRQUFJLE9BQVFOLFFBQVIsS0FBc0IsVUFBMUIsRUFBc0M7QUFDcEMsYUFBT0EsUUFBUSxDQUFDSixJQUFULENBQWNOLE1BQWQsRUFBc0I5QixHQUF0QixFQUEyQnNCLEtBQTNCLENBQVA7QUFDRCxLQUZELE1BRU8sSUFBSWtCLFFBQUosRUFBYztBQUNuQixVQUFJSyxVQUFVLElBQUlILE9BQU8sQ0FBQ1osTUFBRCxDQUFyQixJQUFpQ1UsUUFBUSxDQUFDckIsT0FBVCxDQUFpQm5CLEdBQWpCLEtBQXlCLENBQTlELEVBQWlFO0FBQy9ELGVBQU9zQixLQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBT2UsU0FBUDtBQUNEO0FBQ0YsS0FOTSxNQU1BO0FBQ0wsYUFBT2YsS0FBUDtBQUNEO0FBQ0YsR0FyQkQ7O0FBdUJBLFdBQVN5QixVQUFULENBQW9CQyxLQUFwQixFQUEwQjtBQUN4QixXQUFRQSxLQUFJLElBQUksR0FBUixJQUFlQSxLQUFJLElBQUksR0FBeEIsSUFDSkEsS0FBSSxJQUFJLEdBQVIsSUFBZUEsS0FBSSxJQUFJLEdBRG5CLElBRUpBLEtBQUksSUFBSSxHQUFSLElBQWVBLEtBQUksSUFBSSxHQUZuQixJQUdMQSxLQUFJLEtBQUssR0FISixJQUdXQSxLQUFJLEtBQUssR0FIM0I7QUFJRDs7QUFFRCxXQUFTQyxXQUFULENBQXFCRCxNQUFyQixFQUEyQjtBQUN6QixXQUFRQSxNQUFJLElBQUksR0FBUixJQUFlQSxNQUFJLElBQUksR0FBeEIsSUFDSkEsTUFBSSxJQUFJLEdBQVIsSUFBZUEsTUFBSSxJQUFJLEdBRG5CLElBRUxBLE1BQUksS0FBSyxHQUZKLElBRVdBLE1BQUksS0FBSyxHQUYzQjtBQUdEOztBQUVELFdBQVNFLE1BQVQsQ0FBZ0JsRCxHQUFoQixFQUFxQjtBQUNuQixRQUFJLE9BQU9BLEdBQVAsS0FBZSxRQUFuQixFQUE2QjtBQUMzQixhQUFPLEtBQVA7QUFDRDs7QUFDRCxRQUFJLENBQUNpRCxXQUFXLENBQUNqRCxHQUFHLENBQUMsQ0FBRCxDQUFKLENBQWhCLEVBQTBCO0FBQ3hCLGFBQU8sS0FBUDtBQUNEOztBQUNELFFBQUlTLENBQUMsR0FBRyxDQUFSO0FBQUEsUUFBVzBDLE1BQU0sR0FBR25ELEdBQUcsQ0FBQ21ELE1BQXhCOztBQUNBLFdBQU8xQyxDQUFDLEdBQUcwQyxNQUFYLEVBQW1CO0FBQ2pCLFVBQUksQ0FBQ0osVUFBVSxDQUFDL0MsR0FBRyxDQUFDUyxDQUFELENBQUosQ0FBZixFQUF5QjtBQUN2QixlQUFPLEtBQVA7QUFDRDs7QUFDREEsTUFBQUEsQ0FBQztBQUNGOztBQUNELFdBQU8sSUFBUDtBQUNELEdBdkQrQyxDQXlEaEQ7OztBQUNBL0IsRUFBQUEsS0FBSyxDQUFDd0UsTUFBTixHQUFlQSxNQUFmLENBMURnRCxDQTREaEQ7O0FBQ0EsV0FBU1IsT0FBVCxDQUFpQkgsR0FBakIsRUFBc0I7QUFDcEIsUUFBSWEsS0FBSyxDQUFDVixPQUFWLEVBQW1CO0FBQ2pCLGFBQU9VLEtBQUssQ0FBQ1YsT0FBTixDQUFjSCxHQUFkLENBQVA7QUFDRCxLQUZELE1BRU87QUFDTCxhQUFPTixNQUFNLENBQUNDLFNBQVAsQ0FBaUJtQixRQUFqQixDQUEwQmpCLElBQTFCLENBQStCRyxHQUEvQixNQUF3QyxnQkFBL0M7QUFDRDtBQUNGOztBQUVELFdBQVNlLE1BQVQsQ0FBZ0JmLEdBQWhCLEVBQXFCO0FBQ25CLFdBQU9OLE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQm1CLFFBQWpCLENBQTBCakIsSUFBMUIsQ0FBK0JHLEdBQS9CLE1BQXdDLGVBQS9DO0FBQ0QsR0F2RStDLENBeUVoRDtBQUNBO0FBQ0E7OztBQUVBLE1BQUlnQixRQUFRLEdBQUcsRUFBZjs7QUFDQSxXQUFTQyxnQkFBVCxDQUEwQmpCLEdBQTFCLEVBQStCO0FBQzdCLFNBQUssSUFBSTlCLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUc4QyxRQUFRLENBQUNKLE1BQTdCLEVBQXFDMUMsQ0FBQyxFQUF0QyxFQUEwQztBQUN4QyxVQUFJOEMsUUFBUSxDQUFDOUMsQ0FBRCxDQUFSLEtBQWdCOEIsR0FBcEIsRUFBeUI7QUFDdkIsY0FBTSxJQUFJa0IsU0FBSixDQUFjLHVDQUFkLENBQU47QUFDRDtBQUNGO0FBQ0Y7O0FBRUQsV0FBU0MsVUFBVCxDQUFvQkMsR0FBcEIsRUFBeUJDLEdBQXpCLEVBQThCQyxTQUE5QixFQUEwQztBQUN4QyxRQUFJLENBQUNGLEdBQUwsRUFBVTtBQUNSLGFBQU8sRUFBUDtBQUNELEtBSHVDLENBSXhDOzs7QUFDQSxRQUFJQSxHQUFHLENBQUNSLE1BQUosR0FBYSxFQUFqQixFQUFxQjtBQUNuQlEsTUFBQUEsR0FBRyxHQUFHQSxHQUFHLENBQUNHLFNBQUosQ0FBYyxDQUFkLEVBQWlCLEVBQWpCLENBQU47QUFDRDs7QUFFRCxRQUFJQyxNQUFNLEdBQUdGLFNBQVMsR0FBRyxFQUFILEdBQVEsSUFBOUI7O0FBQ0EsU0FBSyxJQUFJcEQsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR21ELEdBQXBCLEVBQXlCbkQsQ0FBQyxFQUExQixFQUE4QjtBQUM1QnNELE1BQUFBLE1BQU0sSUFBSUosR0FBVjtBQUNEOztBQUVELFdBQU9JLE1BQVA7QUFDRDs7QUFFRCxNQUFJQyxTQUFKOztBQUNBLE1BQUl2QixLQUFKLEVBQVc7QUFDVCxRQUFJLE9BQU9BLEtBQVAsS0FBaUIsUUFBckIsRUFBK0I7QUFDN0J1QixNQUFBQSxTQUFTLEdBQUd2QixLQUFaO0FBQ0QsS0FGRCxNQUVPLElBQUksT0FBT0EsS0FBUCxLQUFpQixRQUFqQixJQUE2QkEsS0FBSyxJQUFJLENBQTFDLEVBQTZDO0FBQ2xEdUIsTUFBQUEsU0FBUyxHQUFHTixVQUFVLENBQUMsR0FBRCxFQUFNakIsS0FBTixFQUFhLElBQWIsQ0FBdEI7QUFDRCxLQUZNLE1BRUEsQ0FDTDtBQUNEO0FBQ0YsR0FoSCtDLENBa0hoRDtBQUNBO0FBQ0E7OztBQUNBLE1BQUl3QixFQUFFLEdBQUcsMEdBQVQ7QUFBQSxNQUNFQyxTQUFTLEdBQUcsMEhBRGQ7QUFBQSxNQUVFQyxJQUFJLEdBQUc7QUFBRTtBQUNQLFVBQU0sS0FERDtBQUVMLFVBQU0sS0FGRDtBQUdMLFVBQU0sS0FIRDtBQUlMLFVBQU0sS0FKRDtBQUtMLFVBQU0sS0FMRDtBQU1MLFNBQUssS0FOQTtBQU9MLFVBQU07QUFQRCxHQUZUOztBQVdBLFdBQVNDLFlBQVQsQ0FBc0JqRSxNQUF0QixFQUE4QjtBQUU1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBK0QsSUFBQUEsU0FBUyxDQUFDRyxTQUFWLEdBQXNCLENBQXRCO0FBQ0EsV0FBT0gsU0FBUyxDQUFDSSxJQUFWLENBQWVuRSxNQUFmLElBQXlCLE1BQU1BLE1BQU0sQ0FBQ29FLE9BQVAsQ0FBZUwsU0FBZixFQUEwQixVQUFVTSxDQUFWLEVBQWE7QUFDM0UsVUFBSTVFLENBQUMsR0FBR3VFLElBQUksQ0FBQ0ssQ0FBRCxDQUFaO0FBQ0EsYUFBTyxPQUFPNUUsQ0FBUCxLQUFhLFFBQWIsR0FDTEEsQ0FESyxHQUVMLFFBQVEsQ0FBQyxTQUFTNEUsQ0FBQyxDQUFDQyxVQUFGLENBQWEsQ0FBYixFQUFnQnBCLFFBQWhCLENBQXlCLEVBQXpCLENBQVYsRUFBd0NxQixLQUF4QyxDQUE4QyxDQUFDLENBQS9DLENBRlY7QUFHRCxLQUxxQyxDQUFOLEdBSzNCLEdBTEUsR0FLSSxNQUFNdkUsTUFBTixHQUFlLEdBTDFCO0FBTUQsR0E3SStDLENBOEloRDs7O0FBRUEsV0FBU3dFLGlCQUFULENBQTJCN0MsTUFBM0IsRUFBbUM5QixHQUFuQyxFQUF3QzZDLFVBQXhDLEVBQW9EO0FBQ2xELFFBQUkrQixNQUFKLEVBQVlDLEdBQVosQ0FEa0QsQ0FHbEQ7O0FBQ0EsUUFBSUMsUUFBUSxHQUFHbEMsMkJBQTJCLENBQUNkLE1BQUQsRUFBUzlCLEdBQVQsRUFBYzZDLFVBQWQsQ0FBMUM7O0FBRUEsUUFBSWlDLFFBQVEsSUFBSSxDQUFDeEIsTUFBTSxDQUFDd0IsUUFBRCxDQUF2QixFQUFtQztBQUNqQztBQUNBO0FBQ0FBLE1BQUFBLFFBQVEsR0FBR0EsUUFBUSxDQUFDQyxPQUFULEVBQVg7QUFDRDs7QUFDRCxvQkFBZUQsUUFBZjtBQUNFLFdBQUssU0FBTDtBQUNFLGVBQU9BLFFBQVEsQ0FBQ3pCLFFBQVQsRUFBUDs7QUFFRixXQUFLLFFBQUw7QUFDRSxZQUFJL0MsS0FBSyxDQUFDd0UsUUFBRCxDQUFMLElBQW1CLENBQUN2RSxRQUFRLENBQUN1RSxRQUFELENBQWhDLEVBQTRDO0FBQzFDLGlCQUFPLE1BQVA7QUFDRDs7QUFDRCxlQUFPQSxRQUFRLENBQUN6QixRQUFULEVBQVA7O0FBRUYsV0FBSyxRQUFMO0FBQ0UsZUFBT2UsWUFBWSxDQUFDVSxRQUFRLENBQUN6QixRQUFULEVBQUQsQ0FBbkI7O0FBRUYsV0FBSyxRQUFMO0FBQ0UsWUFBSXlCLFFBQVEsS0FBSyxJQUFqQixFQUF1QjtBQUNyQixpQkFBTyxNQUFQO0FBQ0QsU0FGRCxNQUVPLElBQUlwQyxPQUFPLENBQUNvQyxRQUFELENBQVgsRUFBdUI7QUFDNUJ0QixVQUFBQSxnQkFBZ0IsQ0FBQ3NCLFFBQUQsQ0FBaEI7QUFDQUYsVUFBQUEsTUFBTSxHQUFHLEdBQVQ7QUFDQXJCLFVBQUFBLFFBQVEsQ0FBQy9CLElBQVQsQ0FBY3NELFFBQWQ7O0FBRUEsZUFBSyxJQUFJckUsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR3FFLFFBQVEsQ0FBQzNCLE1BQTdCLEVBQXFDMUMsQ0FBQyxFQUF0QyxFQUEwQztBQUN4Q29FLFlBQUFBLEdBQUcsR0FBR0YsaUJBQWlCLENBQUNHLFFBQUQsRUFBV3JFLENBQVgsRUFBYyxLQUFkLENBQXZCO0FBQ0FtRSxZQUFBQSxNQUFNLElBQUlsQixVQUFVLENBQUNNLFNBQUQsRUFBWVQsUUFBUSxDQUFDSixNQUFyQixDQUFwQjs7QUFDQSxnQkFBSTBCLEdBQUcsS0FBSyxJQUFSLElBQWdCLE9BQU9BLEdBQVAsS0FBZSxXQUFuQyxFQUFnRDtBQUM5Q0QsY0FBQUEsTUFBTSxJQUFJLE1BQVY7QUFDRCxhQUZELE1BRU87QUFDTEEsY0FBQUEsTUFBTSxJQUFJQyxHQUFWO0FBQ0Q7O0FBQ0QsZ0JBQUlwRSxDQUFDLEdBQUdxRSxRQUFRLENBQUMzQixNQUFULEdBQWtCLENBQTFCLEVBQTZCO0FBQzNCeUIsY0FBQUEsTUFBTSxJQUFJLEdBQVY7QUFDRCxhQUZELE1BRU8sSUFBSVosU0FBSixFQUFlO0FBQ3BCWSxjQUFBQSxNQUFNLElBQUksSUFBVjtBQUNEO0FBQ0Y7O0FBQ0RyQixVQUFBQSxRQUFRLENBQUN5QixHQUFUO0FBQ0FKLFVBQUFBLE1BQU0sSUFBSWxCLFVBQVUsQ0FBQ00sU0FBRCxFQUFZVCxRQUFRLENBQUNKLE1BQXJCLEVBQTZCLElBQTdCLENBQVYsR0FBK0MsR0FBekQ7QUFDRCxTQXJCTSxNQXFCQTtBQUNMSyxVQUFBQSxnQkFBZ0IsQ0FBQ3NCLFFBQUQsQ0FBaEI7QUFDQUYsVUFBQUEsTUFBTSxHQUFHLEdBQVQ7QUFDQSxjQUFJSyxRQUFRLEdBQUcsS0FBZjtBQUNBMUIsVUFBQUEsUUFBUSxDQUFDL0IsSUFBVCxDQUFjc0QsUUFBZDs7QUFDQSxlQUFLLElBQUlJLElBQVQsSUFBaUJKLFFBQWpCLEVBQTJCO0FBQ3pCLGdCQUFJQSxRQUFRLENBQUMzQyxjQUFULENBQXdCK0MsSUFBeEIsQ0FBSixFQUFtQztBQUNqQyxrQkFBSTVELEtBQUssR0FBR3FELGlCQUFpQixDQUFDRyxRQUFELEVBQVdJLElBQVgsRUFBaUIsS0FBakIsQ0FBN0I7QUFDQXJDLGNBQUFBLFVBQVUsR0FBRyxLQUFiOztBQUNBLGtCQUFJLE9BQU92QixLQUFQLEtBQWlCLFdBQWpCLElBQWdDQSxLQUFLLEtBQUssSUFBOUMsRUFBb0Q7QUFDbERzRCxnQkFBQUEsTUFBTSxJQUFJbEIsVUFBVSxDQUFDTSxTQUFELEVBQVlULFFBQVEsQ0FBQ0osTUFBckIsQ0FBcEI7QUFDQThCLGdCQUFBQSxRQUFRLEdBQUcsSUFBWDtBQUNBLG9CQUFJakYsR0FBUSxHQUFHa0QsTUFBTSxDQUFDZ0MsSUFBRCxDQUFOLEdBQWVBLElBQWYsR0FBc0JkLFlBQVksQ0FBQ2MsSUFBRCxDQUFqRDtBQUNBTixnQkFBQUEsTUFBTSxJQUFJNUUsR0FBRyxHQUFHLEdBQU4sSUFBYWdFLFNBQVMsR0FBRyxHQUFILEdBQVMsRUFBL0IsSUFBcUMxQyxLQUFyQyxHQUE2QyxHQUF2RDtBQUNEO0FBQ0Y7QUFDRjs7QUFDRGlDLFVBQUFBLFFBQVEsQ0FBQ3lCLEdBQVQ7O0FBQ0EsY0FBSUMsUUFBSixFQUFjO0FBQ1pMLFlBQUFBLE1BQU0sR0FBR0EsTUFBTSxDQUFDZCxTQUFQLENBQWlCLENBQWpCLEVBQW9CYyxNQUFNLENBQUN6QixNQUFQLEdBQWdCLENBQXBDLElBQXlDTyxVQUFVLENBQUNNLFNBQUQsRUFBWVQsUUFBUSxDQUFDSixNQUFyQixDQUFuRCxHQUFrRixHQUEzRjtBQUNELFdBRkQsTUFFTztBQUNMeUIsWUFBQUEsTUFBTSxHQUFHLElBQVQ7QUFDRDtBQUNGOztBQUNELGVBQU9BLE1BQVA7O0FBQ0Y7QUFDRTtBQUNBLGVBQU92QyxTQUFQO0FBaEVKO0FBa0VELEdBN04rQyxDQStOaEQ7QUFDQTtBQUNBOzs7QUFDQSxNQUFJOEMsY0FBYyxHQUFHO0FBQUUsUUFBSTVDO0FBQU4sR0FBckI7O0FBQ0EsTUFBSUEsR0FBRyxLQUFLRixTQUFaLEVBQXVCO0FBQ3JCLFdBQU9PLDJCQUEyQixDQUFDdUMsY0FBRCxFQUFpQixFQUFqQixFQUFxQixJQUFyQixDQUFsQztBQUNEOztBQUNELFNBQU9SLGlCQUFpQixDQUFDUSxjQUFELEVBQWlCLEVBQWpCLEVBQXFCLElBQXJCLENBQXhCO0FBQ0QsQ0F2T0QiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBqc29uNS5qc1xyXG4vLyBNb2Rlcm4gSlNPTi4gU2VlIFJFQURNRS5tZCBmb3IgZGV0YWlscy5cclxuLy9cclxuLy8gVGhpcyBmaWxlIGlzIGJhc2VkIGRpcmVjdGx5IG9mZiBvZiBEb3VnbGFzIENyb2NrZm9yZCdzIGpzb25fcGFyc2UuanM6XHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kb3VnbGFzY3JvY2tmb3JkL0pTT04tanMvYmxvYi9tYXN0ZXIvanNvbl9wYXJzZS5qc1xyXG5cclxudmFyIEpTT041ID0gKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyA/IGV4cG9ydHMgOiB7fSk7XHJcblxyXG5KU09ONS5wYXJzZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gIC8vIFRoaXMgaXMgYSBmdW5jdGlvbiB0aGF0IGNhbiBwYXJzZSBhIEpTT041IHRleHQsIHByb2R1Y2luZyBhIEphdmFTY3JpcHRcclxuICAvLyBkYXRhIHN0cnVjdHVyZS4gSXQgaXMgYSBzaW1wbGUsIHJlY3Vyc2l2ZSBkZXNjZW50IHBhcnNlci4gSXQgZG9lcyBub3QgdXNlXHJcbiAgLy8gZXZhbCBvciByZWd1bGFyIGV4cHJlc3Npb25zLCBzbyBpdCBjYW4gYmUgdXNlZCBhcyBhIG1vZGVsIGZvciBpbXBsZW1lbnRpbmdcclxuICAvLyBhIEpTT041IHBhcnNlciBpbiBvdGhlciBsYW5ndWFnZXMuXHJcblxyXG4gIC8vIFdlIGFyZSBkZWZpbmluZyB0aGUgZnVuY3Rpb24gaW5zaWRlIG9mIGFub3RoZXIgZnVuY3Rpb24gdG8gYXZvaWQgY3JlYXRpbmdcclxuICAvLyBnbG9iYWwgdmFyaWFibGVzLlxyXG5cclxuICB2YXIgYXQsICAgICAvLyBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgY2hhcmFjdGVyXHJcbiAgICBjaCwgICAgIC8vIFRoZSBjdXJyZW50IGNoYXJhY3RlclxyXG4gICAgZXNjYXBlZSA9IHtcclxuICAgICAgXCInXCI6IFwiJ1wiLFxyXG4gICAgICAnXCInOiAnXCInLFxyXG4gICAgICAnXFxcXCc6ICdcXFxcJyxcclxuICAgICAgJy8nOiAnLycsXHJcbiAgICAgICdcXG4nOiAnJywgICAgICAgLy8gUmVwbGFjZSBlc2NhcGVkIG5ld2xpbmVzIGluIHN0cmluZ3Mgdy8gZW1wdHkgc3RyaW5nXHJcbiAgICAgIGI6ICdcXGInLFxyXG4gICAgICBmOiAnXFxmJyxcclxuICAgICAgbjogJ1xcbicsXHJcbiAgICAgIHI6ICdcXHInLFxyXG4gICAgICB0OiAnXFx0J1xyXG4gICAgfSxcclxuICAgIHdzID0gW1xyXG4gICAgICAnICcsXHJcbiAgICAgICdcXHQnLFxyXG4gICAgICAnXFxyJyxcclxuICAgICAgJ1xcbicsXHJcbiAgICAgICdcXHYnLFxyXG4gICAgICAnXFxmJyxcclxuICAgICAgJ1xceEEwJyxcclxuICAgICAgJ1xcdUZFRkYnXHJcbiAgICBdLFxyXG4gICAgdGV4dCxcclxuXHJcbiAgICBlcnJvciA9IGZ1bmN0aW9uIChtKSB7XHJcblxyXG4gICAgICAvLyBDYWxsIGVycm9yIHdoZW4gc29tZXRoaW5nIGlzIHdyb25nLlxyXG5cclxuICAgICAgdmFyIGVycm9yOiBhbnkgPSBuZXcgU3ludGF4RXJyb3IoKTtcclxuICAgICAgZXJyb3IubWVzc2FnZSA9IG07XHJcbiAgICAgIGVycm9yLmF0ID0gYXQ7XHJcbiAgICAgIGVycm9yLnRleHQgPSB0ZXh0O1xyXG4gICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH0sXHJcblxyXG4gICAgbmV4dDogYW55ID0gZnVuY3Rpb24gKGMpIHtcclxuXHJcbiAgICAgIC8vIElmIGEgYyBwYXJhbWV0ZXIgaXMgcHJvdmlkZWQsIHZlcmlmeSB0aGF0IGl0IG1hdGNoZXMgdGhlIGN1cnJlbnQgY2hhcmFjdGVyLlxyXG5cclxuICAgICAgaWYgKGMgJiYgYyAhPT0gY2gpIHtcclxuICAgICAgICBlcnJvcihcIkV4cGVjdGVkICdcIiArIGMgKyBcIicgaW5zdGVhZCBvZiAnXCIgKyBjaCArIFwiJ1wiKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gR2V0IHRoZSBuZXh0IGNoYXJhY3Rlci4gV2hlbiB0aGVyZSBhcmUgbm8gbW9yZSBjaGFyYWN0ZXJzLFxyXG4gICAgICAvLyByZXR1cm4gdGhlIGVtcHR5IHN0cmluZy5cclxuXHJcbiAgICAgIGNoID0gdGV4dC5jaGFyQXQoYXQpO1xyXG4gICAgICBhdCArPSAxO1xyXG4gICAgICByZXR1cm4gY2g7XHJcbiAgICB9LFxyXG5cclxuICAgIHBlZWsgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAvLyBHZXQgdGhlIG5leHQgY2hhcmFjdGVyIHdpdGhvdXQgY29uc3VtaW5nIGl0IG9yXHJcbiAgICAgIC8vIGFzc2lnbmluZyBpdCB0byB0aGUgY2ggdmFyYWlibGUuXHJcblxyXG4gICAgICByZXR1cm4gdGV4dC5jaGFyQXQoYXQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpZGVudGlmaWVyID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgLy8gUGFyc2UgYW4gaWRlbnRpZmllci4gTm9ybWFsbHksIHJlc2VydmVkIHdvcmRzIGFyZSBkaXNhbGxvd2VkIGhlcmUsIGJ1dCB3ZVxyXG4gICAgICAvLyBvbmx5IHVzZSB0aGlzIGZvciB1bnF1b3RlZCBvYmplY3Qga2V5cywgd2hlcmUgcmVzZXJ2ZWQgd29yZHMgYXJlIGFsbG93ZWQsXHJcbiAgICAgIC8vIHNvIHdlIGRvbid0IGNoZWNrIGZvciB0aG9zZSBoZXJlLiBSZWZlcmVuY2VzOlxyXG4gICAgICAvLyAtIGh0dHA6Ly9lczUuZ2l0aHViLmNvbS8jeDcuNlxyXG4gICAgICAvLyAtIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0NvcmVfSmF2YVNjcmlwdF8xLjVfR3VpZGUvQ29yZV9MYW5ndWFnZV9GZWF0dXJlcyNWYXJpYWJsZXNcclxuICAgICAgLy8gLSBodHRwOi8vZG9jc3RvcmUubWlrLnVhL29yZWxseS93ZWJwcm9nL2pzY3JpcHQvY2gwMl8wNy5odG1cclxuXHJcbiAgICAgIHZhciBrZXkgPSBjaDtcclxuXHJcbiAgICAgIC8vIElkZW50aWZpZXJzIG11c3Qgc3RhcnQgd2l0aCBhIGxldHRlciwgXyBvciAkLlxyXG4gICAgICBpZiAoKGNoICE9PSAnXycgJiYgY2ggIT09ICckJykgJiZcclxuICAgICAgICAoY2ggPCAnYScgfHwgY2ggPiAneicpICYmXHJcbiAgICAgICAgKGNoIDwgJ0EnIHx8IGNoID4gJ1onKSkge1xyXG4gICAgICAgIGVycm9yKFwiQmFkIGlkZW50aWZpZXJcIik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFN1YnNlcXVlbnQgY2hhcmFjdGVycyBjYW4gY29udGFpbiBkaWdpdHMuXHJcbiAgICAgIHdoaWxlIChuZXh0KCkgJiYgKFxyXG4gICAgICAgIGNoID09PSAnXycgfHwgY2ggPT09ICckJyB8fFxyXG4gICAgICAgIChjaCA+PSAnYScgJiYgY2ggPD0gJ3onKSB8fFxyXG4gICAgICAgIChjaCA+PSAnQScgJiYgY2ggPD0gJ1onKSB8fFxyXG4gICAgICAgIChjaCA+PSAnMCcgJiYgY2ggPD0gJzknKSkpIHtcclxuICAgICAgICBrZXkgKz0gY2g7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBrZXk7XHJcbiAgICB9LFxyXG5cclxuICAgIG51bWJlciA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgIC8vIFBhcnNlIGEgbnVtYmVyIHZhbHVlLlxyXG5cclxuICAgICAgdmFyIG51bWJlcixcclxuICAgICAgICBzaWduID0gJycsXHJcbiAgICAgICAgc3RyaW5nID0gJycsXHJcbiAgICAgICAgYmFzZSA9IDEwO1xyXG5cclxuICAgICAgaWYgKGNoID09PSAnLScgfHwgY2ggPT09ICcrJykge1xyXG4gICAgICAgIHNpZ24gPSBjaDtcclxuICAgICAgICBuZXh0KGNoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gc3VwcG9ydCBmb3IgSW5maW5pdHkgKGNvdWxkIHR3ZWFrIHRvIGFsbG93IG90aGVyIHdvcmRzKTpcclxuICAgICAgaWYgKGNoID09PSAnSScpIHtcclxuICAgICAgICBudW1iZXIgPSB3b3JkKCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBudW1iZXIgIT09ICdudW1iZXInIHx8IGlzTmFOKG51bWJlcikpIHtcclxuICAgICAgICAgIGVycm9yKCdVbmV4cGVjdGVkIHdvcmQgZm9yIG51bWJlcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gKHNpZ24gPT09ICctJykgPyAtbnVtYmVyIDogbnVtYmVyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBzdXBwb3J0IGZvciBOYU5cclxuICAgICAgaWYgKGNoID09PSAnTicpIHtcclxuICAgICAgICBudW1iZXIgPSB3b3JkKCk7XHJcbiAgICAgICAgaWYgKCFpc05hTihudW1iZXIpKSB7XHJcbiAgICAgICAgICBlcnJvcignZXhwZWN0ZWQgd29yZCB0byBiZSBOYU4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gaWdub3JlIHNpZ24gYXMgLU5hTiBhbHNvIGlzIE5hTlxyXG4gICAgICAgIHJldHVybiBudW1iZXI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjaCA9PT0gJzAnKSB7XHJcbiAgICAgICAgc3RyaW5nICs9IGNoO1xyXG4gICAgICAgIG5leHQoKTtcclxuICAgICAgICBpZiAoY2ggPT09ICd4JyB8fCBjaCA9PT0gJ1gnKSB7XHJcbiAgICAgICAgICBzdHJpbmcgKz0gY2g7XHJcbiAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgICBiYXNlID0gMTY7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjaCA+PSAnMCcgJiYgY2ggPD0gJzknKSB7XHJcbiAgICAgICAgICBlcnJvcignT2N0YWwgbGl0ZXJhbCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgc3dpdGNoIChiYXNlKSB7XHJcbiAgICAgICAgY2FzZSAxMDpcclxuICAgICAgICAgIHdoaWxlIChjaCA+PSAnMCcgJiYgY2ggPD0gJzknKSB7XHJcbiAgICAgICAgICAgIHN0cmluZyArPSBjaDtcclxuICAgICAgICAgICAgbmV4dCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGNoID09PSAnLicpIHtcclxuICAgICAgICAgICAgc3RyaW5nICs9ICcuJztcclxuICAgICAgICAgICAgd2hpbGUgKG5leHQoKSAmJiBjaCA+PSAnMCcgJiYgY2ggPD0gJzknKSB7XHJcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoY2ggPT09ICdlJyB8fCBjaCA9PT0gJ0UnKSB7XHJcbiAgICAgICAgICAgIHN0cmluZyArPSBjaDtcclxuICAgICAgICAgICAgbmV4dCgpO1xyXG4gICAgICAgICAgICBpZiAoY2ggPT09ICctJyB8fCBjaCA9PT0gJysnKSB7XHJcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xyXG4gICAgICAgICAgICAgIG5leHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aGlsZSAoY2ggPj0gJzAnICYmIGNoIDw9ICc5Jykge1xyXG4gICAgICAgICAgICAgIHN0cmluZyArPSBjaDtcclxuICAgICAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMTY6XHJcbiAgICAgICAgICB3aGlsZSAoY2ggPj0gJzAnICYmIGNoIDw9ICc5JyB8fCBjaCA+PSAnQScgJiYgY2ggPD0gJ0YnIHx8IGNoID49ICdhJyAmJiBjaCA8PSAnZicpIHtcclxuICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xyXG4gICAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHNpZ24gPT09ICctJykge1xyXG4gICAgICAgIG51bWJlciA9IC1zdHJpbmc7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbnVtYmVyID0gK3N0cmluZztcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFpc0Zpbml0ZShudW1iZXIpKSB7XHJcbiAgICAgICAgZXJyb3IoXCJCYWQgbnVtYmVyXCIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBudW1iZXI7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc3RyaW5nID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgLy8gUGFyc2UgYSBzdHJpbmcgdmFsdWUuXHJcblxyXG4gICAgICB2YXIgaGV4LFxyXG4gICAgICAgIGksXHJcbiAgICAgICAgc3RyaW5nID0gJycsXHJcbiAgICAgICAgZGVsaW0sICAgICAgLy8gZG91YmxlIHF1b3RlIG9yIHNpbmdsZSBxdW90ZVxyXG4gICAgICAgIHVmZmZmO1xyXG5cclxuICAgICAgLy8gV2hlbiBwYXJzaW5nIGZvciBzdHJpbmcgdmFsdWVzLCB3ZSBtdXN0IGxvb2sgZm9yICcgb3IgXCIgYW5kIFxcIGNoYXJhY3RlcnMuXHJcblxyXG4gICAgICBpZiAoY2ggPT09ICdcIicgfHwgY2ggPT09IFwiJ1wiKSB7XHJcbiAgICAgICAgZGVsaW0gPSBjaDtcclxuICAgICAgICB3aGlsZSAobmV4dCgpKSB7XHJcbiAgICAgICAgICBpZiAoY2ggPT09IGRlbGltKSB7XHJcbiAgICAgICAgICAgIG5leHQoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHN0cmluZztcclxuICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICdcXFxcJykge1xyXG4gICAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJ3UnKSB7XHJcbiAgICAgICAgICAgICAgdWZmZmYgPSAwO1xyXG4gICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpICs9IDEpIHtcclxuICAgICAgICAgICAgICAgIGhleCA9IHBhcnNlSW50KG5leHQoKSwgMTYpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShoZXgpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdWZmZmYgPSB1ZmZmZiAqIDE2ICsgaGV4O1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBzdHJpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh1ZmZmZik7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICdcXHInKSB7XHJcbiAgICAgICAgICAgICAgaWYgKHBlZWsoKSA9PT0gJ1xcbicpIHtcclxuICAgICAgICAgICAgICAgIG5leHQoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVzY2FwZWVbY2hdID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgIHN0cmluZyArPSBlc2NhcGVlW2NoXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ1xcbicpIHtcclxuICAgICAgICAgICAgLy8gdW5lc2NhcGVkIG5ld2xpbmVzIGFyZSBpbnZhbGlkOyBzZWU6XHJcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hc2VlbWsvanNvbjUvaXNzdWVzLzI0XHJcbiAgICAgICAgICAgIC8vIGludmFsaWQgdW5lc2NhcGVkIGNoYXJzP1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN0cmluZyArPSBjaDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZXJyb3IoXCJCYWQgc3RyaW5nXCIpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbmxpbmVDb21tZW50ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgLy8gU2tpcCBhbiBpbmxpbmUgY29tbWVudCwgYXNzdW1pbmcgdGhpcyBpcyBvbmUuIFRoZSBjdXJyZW50IGNoYXJhY3RlciBzaG91bGRcclxuICAgICAgLy8gYmUgdGhlIHNlY29uZCAvIGNoYXJhY3RlciBpbiB0aGUgLy8gcGFpciB0aGF0IGJlZ2lucyB0aGlzIGlubGluZSBjb21tZW50LlxyXG4gICAgICAvLyBUbyBmaW5pc2ggdGhlIGlubGluZSBjb21tZW50LCB3ZSBsb29rIGZvciBhIG5ld2xpbmUgb3IgdGhlIGVuZCBvZiB0aGUgdGV4dC5cclxuXHJcbiAgICAgIGlmIChjaCAhPT0gJy8nKSB7XHJcbiAgICAgICAgZXJyb3IoXCJOb3QgYW4gaW5saW5lIGNvbW1lbnRcIik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGRvIHtcclxuICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgaWYgKGNoID09PSAnXFxuJyB8fCBjaCA9PT0gJ1xccicpIHtcclxuICAgICAgICAgIG5leHQoKTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgIH0gd2hpbGUgKGNoKTtcclxuICAgIH0sXHJcblxyXG4gICAgYmxvY2tDb21tZW50ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgLy8gU2tpcCBhIGJsb2NrIGNvbW1lbnQsIGFzc3VtaW5nIHRoaXMgaXMgb25lLiBUaGUgY3VycmVudCBjaGFyYWN0ZXIgc2hvdWxkIGJlXHJcbiAgICAgIC8vIHRoZSAqIGNoYXJhY3RlciBpbiB0aGUgLyogcGFpciB0aGF0IGJlZ2lucyB0aGlzIGJsb2NrIGNvbW1lbnQuXHJcbiAgICAgIC8vIFRvIGZpbmlzaCB0aGUgYmxvY2sgY29tbWVudCwgd2UgbG9vayBmb3IgYW4gZW5kaW5nICovIHBhaXIgb2YgY2hhcmFjdGVycyxcclxuICAgICAgLy8gYnV0IHdlIGFsc28gd2F0Y2ggZm9yIHRoZSBlbmQgb2YgdGV4dCBiZWZvcmUgdGhlIGNvbW1lbnQgaXMgdGVybWluYXRlZC5cclxuXHJcbiAgICAgIGlmIChjaCAhPT0gJyonKSB7XHJcbiAgICAgICAgZXJyb3IoXCJOb3QgYSBibG9jayBjb21tZW50XCIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkbyB7XHJcbiAgICAgICAgbmV4dCgpO1xyXG4gICAgICAgIHdoaWxlIChjaCA9PT0gJyonKSB7XHJcbiAgICAgICAgICBuZXh0KCcqJyk7XHJcbiAgICAgICAgICBpZiAoY2ggPT09ICcvJykge1xyXG4gICAgICAgICAgICBuZXh0KCcvJyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gd2hpbGUgKGNoKTtcclxuXHJcbiAgICAgIGVycm9yKFwiVW50ZXJtaW5hdGVkIGJsb2NrIGNvbW1lbnRcIik7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbW1lbnQgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAvLyBTa2lwIGEgY29tbWVudCwgd2hldGhlciBpbmxpbmUgb3IgYmxvY2stbGV2ZWwsIGFzc3VtaW5nIHRoaXMgaXMgb25lLlxyXG4gICAgICAvLyBDb21tZW50cyBhbHdheXMgYmVnaW4gd2l0aCBhIC8gY2hhcmFjdGVyLlxyXG5cclxuICAgICAgaWYgKGNoICE9PSAnLycpIHtcclxuICAgICAgICBlcnJvcihcIk5vdCBhIGNvbW1lbnRcIik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIG5leHQoJy8nKTtcclxuXHJcbiAgICAgIGlmIChjaCA9PT0gJy8nKSB7XHJcbiAgICAgICAgaW5saW5lQ29tbWVudCgpO1xyXG4gICAgICB9IGVsc2UgaWYgKGNoID09PSAnKicpIHtcclxuICAgICAgICBibG9ja0NvbW1lbnQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBlcnJvcihcIlVucmVjb2duaXplZCBjb21tZW50XCIpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHdoaXRlID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgLy8gU2tpcCB3aGl0ZXNwYWNlIGFuZCBjb21tZW50cy5cclxuICAgICAgLy8gTm90ZSB0aGF0IHdlJ3JlIGRldGVjdGluZyBjb21tZW50cyBieSBvbmx5IGEgc2luZ2xlIC8gY2hhcmFjdGVyLlxyXG4gICAgICAvLyBUaGlzIHdvcmtzIHNpbmNlIHJlZ3VsYXIgZXhwcmVzc2lvbnMgYXJlIG5vdCB2YWxpZCBKU09OKDUpLCBidXQgdGhpcyB3aWxsXHJcbiAgICAgIC8vIGJyZWFrIGlmIHRoZXJlIGFyZSBvdGhlciB2YWxpZCB2YWx1ZXMgdGhhdCBiZWdpbiB3aXRoIGEgLyBjaGFyYWN0ZXIhXHJcblxyXG4gICAgICB3aGlsZSAoY2gpIHtcclxuICAgICAgICBpZiAoY2ggPT09ICcvJykge1xyXG4gICAgICAgICAgY29tbWVudCgpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAod3MuaW5kZXhPZihjaCkgPj0gMCkge1xyXG4gICAgICAgICAgbmV4dCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHdvcmQgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAvLyB0cnVlLCBmYWxzZSwgb3IgbnVsbC5cclxuXHJcbiAgICAgIHN3aXRjaCAoY2gpIHtcclxuICAgICAgICBjYXNlICd0JzpcclxuICAgICAgICAgIG5leHQoJ3QnKTtcclxuICAgICAgICAgIG5leHQoJ3InKTtcclxuICAgICAgICAgIG5leHQoJ3UnKTtcclxuICAgICAgICAgIG5leHQoJ2UnKTtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIGNhc2UgJ2YnOlxyXG4gICAgICAgICAgbmV4dCgnZicpO1xyXG4gICAgICAgICAgbmV4dCgnYScpO1xyXG4gICAgICAgICAgbmV4dCgnbCcpO1xyXG4gICAgICAgICAgbmV4dCgncycpO1xyXG4gICAgICAgICAgbmV4dCgnZScpO1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGNhc2UgJ24nOlxyXG4gICAgICAgICAgbmV4dCgnbicpO1xyXG4gICAgICAgICAgbmV4dCgndScpO1xyXG4gICAgICAgICAgbmV4dCgnbCcpO1xyXG4gICAgICAgICAgbmV4dCgnbCcpO1xyXG4gICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgY2FzZSAnSSc6XHJcbiAgICAgICAgICBuZXh0KCdJJyk7XHJcbiAgICAgICAgICBuZXh0KCduJyk7XHJcbiAgICAgICAgICBuZXh0KCdmJyk7XHJcbiAgICAgICAgICBuZXh0KCdpJyk7XHJcbiAgICAgICAgICBuZXh0KCduJyk7XHJcbiAgICAgICAgICBuZXh0KCdpJyk7XHJcbiAgICAgICAgICBuZXh0KCd0Jyk7XHJcbiAgICAgICAgICBuZXh0KCd5Jyk7XHJcbiAgICAgICAgICByZXR1cm4gSW5maW5pdHk7XHJcbiAgICAgICAgY2FzZSAnTic6XHJcbiAgICAgICAgICBuZXh0KCdOJyk7XHJcbiAgICAgICAgICBuZXh0KCdhJyk7XHJcbiAgICAgICAgICBuZXh0KCdOJyk7XHJcbiAgICAgICAgICByZXR1cm4gTmFOO1xyXG4gICAgICB9XHJcbiAgICAgIGVycm9yKFwiVW5leHBlY3RlZCAnXCIgKyBjaCArIFwiJ1wiKTtcclxuICAgIH0sXHJcblxyXG4gICAgdmFsdWUsICAvLyBQbGFjZSBob2xkZXIgZm9yIHRoZSB2YWx1ZSBmdW5jdGlvbi5cclxuXHJcbiAgICBhcnJheSA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgIC8vIFBhcnNlIGFuIGFycmF5IHZhbHVlLlxyXG5cclxuICAgICAgdmFyIGFycmF5ID0gW107XHJcblxyXG4gICAgICBpZiAoY2ggPT09ICdbJykge1xyXG4gICAgICAgIG5leHQoJ1snKTtcclxuICAgICAgICB3aGl0ZSgpO1xyXG4gICAgICAgIHdoaWxlIChjaCkge1xyXG4gICAgICAgICAgaWYgKGNoID09PSAnXScpIHtcclxuICAgICAgICAgICAgbmV4dCgnXScpO1xyXG4gICAgICAgICAgICByZXR1cm4gYXJyYXk7ICAgLy8gUG90ZW50aWFsbHkgZW1wdHkgYXJyYXlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEVTNSBhbGxvd3Mgb21pdHRpbmcgZWxlbWVudHMgaW4gYXJyYXlzLCBlLmcuIFssXSBhbmRcclxuICAgICAgICAgIC8vIFssbnVsbF0uIFdlIGRvbid0IGFsbG93IHRoaXMgaW4gSlNPTjUuXHJcbiAgICAgICAgICBpZiAoY2ggPT09ICcsJykge1xyXG4gICAgICAgICAgICBlcnJvcihcIk1pc3NpbmcgYXJyYXkgZWxlbWVudFwiKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGFycmF5LnB1c2godmFsdWUoKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB3aGl0ZSgpO1xyXG4gICAgICAgICAgLy8gSWYgdGhlcmUncyBubyBjb21tYSBhZnRlciB0aGlzIHZhbHVlLCB0aGlzIG5lZWRzIHRvXHJcbiAgICAgICAgICAvLyBiZSB0aGUgZW5kIG9mIHRoZSBhcnJheS5cclxuICAgICAgICAgIGlmIChjaCAhPT0gJywnKSB7XHJcbiAgICAgICAgICAgIG5leHQoJ10nKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFycmF5O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgbmV4dCgnLCcpO1xyXG4gICAgICAgICAgd2hpdGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZXJyb3IoXCJCYWQgYXJyYXlcIik7XHJcbiAgICB9LFxyXG5cclxuICAgIG9iamVjdCA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgIC8vIFBhcnNlIGFuIG9iamVjdCB2YWx1ZS5cclxuXHJcbiAgICAgIHZhciBrZXksXHJcbiAgICAgICAgb2JqZWN0ID0ge307XHJcblxyXG4gICAgICBpZiAoY2ggPT09ICd7Jykge1xyXG4gICAgICAgIG5leHQoJ3snKTtcclxuICAgICAgICB3aGl0ZSgpO1xyXG4gICAgICAgIHdoaWxlIChjaCkge1xyXG4gICAgICAgICAgaWYgKGNoID09PSAnfScpIHtcclxuICAgICAgICAgICAgbmV4dCgnfScpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0OyAgIC8vIFBvdGVudGlhbGx5IGVtcHR5IG9iamVjdFxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEtleXMgY2FuIGJlIHVucXVvdGVkLiBJZiB0aGV5IGFyZSwgdGhleSBuZWVkIHRvIGJlXHJcbiAgICAgICAgICAvLyB2YWxpZCBKUyBpZGVudGlmaWVycy5cclxuICAgICAgICAgIGlmIChjaCA9PT0gJ1wiJyB8fCBjaCA9PT0gXCInXCIpIHtcclxuICAgICAgICAgICAga2V5ID0gc3RyaW5nKCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBrZXkgPSBpZGVudGlmaWVyKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgd2hpdGUoKTtcclxuICAgICAgICAgIG5leHQoJzonKTtcclxuICAgICAgICAgIG9iamVjdFtrZXldID0gdmFsdWUoKTtcclxuICAgICAgICAgIHdoaXRlKCk7XHJcbiAgICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIGNvbW1hIGFmdGVyIHRoaXMgcGFpciwgdGhpcyBuZWVkcyB0byBiZVxyXG4gICAgICAgICAgLy8gdGhlIGVuZCBvZiB0aGUgb2JqZWN0LlxyXG4gICAgICAgICAgaWYgKGNoICE9PSAnLCcpIHtcclxuICAgICAgICAgICAgbmV4dCgnfScpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgbmV4dCgnLCcpO1xyXG4gICAgICAgICAgd2hpdGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZXJyb3IoXCJCYWQgb2JqZWN0XCIpO1xyXG4gICAgfTtcclxuXHJcbiAgdmFsdWUgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgLy8gUGFyc2UgYSBKU09OIHZhbHVlLiBJdCBjb3VsZCBiZSBhbiBvYmplY3QsIGFuIGFycmF5LCBhIHN0cmluZywgYSBudW1iZXIsXHJcbiAgICAvLyBvciBhIHdvcmQuXHJcblxyXG4gICAgd2hpdGUoKTtcclxuICAgIHN3aXRjaCAoY2gpIHtcclxuICAgICAgY2FzZSAneyc6XHJcbiAgICAgICAgcmV0dXJuIG9iamVjdCgpO1xyXG4gICAgICBjYXNlICdbJzpcclxuICAgICAgICByZXR1cm4gYXJyYXkoKTtcclxuICAgICAgY2FzZSAnXCInOlxyXG4gICAgICBjYXNlIFwiJ1wiOlxyXG4gICAgICAgIHJldHVybiBzdHJpbmcoKTtcclxuICAgICAgY2FzZSAnLSc6XHJcbiAgICAgIGNhc2UgJysnOlxyXG4gICAgICBjYXNlICcuJzpcclxuICAgICAgICByZXR1cm4gbnVtYmVyKCk7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIGNoID49ICcwJyAmJiBjaCA8PSAnOScgPyBudW1iZXIoKSA6IHdvcmQoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvLyBSZXR1cm4gdGhlIGpzb25fcGFyc2UgZnVuY3Rpb24uIEl0IHdpbGwgaGF2ZSBhY2Nlc3MgdG8gYWxsIG9mIHRoZSBhYm92ZVxyXG4gIC8vIGZ1bmN0aW9ucyBhbmQgdmFyaWFibGVzLlxyXG5cclxuICByZXR1cm4gZnVuY3Rpb24gKHNvdXJjZSwgcmV2aXZlcikge1xyXG4gICAgdmFyIHJlc3VsdDtcclxuXHJcbiAgICB0ZXh0ID0gU3RyaW5nKHNvdXJjZSk7XHJcbiAgICBhdCA9IDA7XHJcbiAgICBjaCA9ICcgJztcclxuICAgIHJlc3VsdCA9IHZhbHVlKCk7XHJcbiAgICB3aGl0ZSgpO1xyXG4gICAgaWYgKGNoKSB7XHJcbiAgICAgIGVycm9yKFwiU3ludGF4IGVycm9yXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHRoZXJlIGlzIGEgcmV2aXZlciBmdW5jdGlvbiwgd2UgcmVjdXJzaXZlbHkgd2FsayB0aGUgbmV3IHN0cnVjdHVyZSxcclxuICAgIC8vIHBhc3NpbmcgZWFjaCBuYW1lL3ZhbHVlIHBhaXIgdG8gdGhlIHJldml2ZXIgZnVuY3Rpb24gZm9yIHBvc3NpYmxlXHJcbiAgICAvLyB0cmFuc2Zvcm1hdGlvbiwgc3RhcnRpbmcgd2l0aCBhIHRlbXBvcmFyeSByb290IG9iamVjdCB0aGF0IGhvbGRzIHRoZSByZXN1bHRcclxuICAgIC8vIGluIGFuIGVtcHR5IGtleS4gSWYgdGhlcmUgaXMgbm90IGEgcmV2aXZlciBmdW5jdGlvbiwgd2Ugc2ltcGx5IHJldHVybiB0aGVcclxuICAgIC8vIHJlc3VsdC5cclxuXHJcbiAgICByZXR1cm4gdHlwZW9mIHJldml2ZXIgPT09ICdmdW5jdGlvbicgPyAoZnVuY3Rpb24gd2Fsayhob2xkZXIsIGtleSkge1xyXG4gICAgICB2YXIgaywgdiwgdmFsdWUgPSBob2xkZXJba2V5XTtcclxuICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBmb3IgKGsgaW4gdmFsdWUpIHtcclxuICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGspKSB7XHJcbiAgICAgICAgICAgIHYgPSB3YWxrKHZhbHVlLCBrKTtcclxuICAgICAgICAgICAgaWYgKHYgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIHZhbHVlW2tdID0gdjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBkZWxldGUgdmFsdWVba107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJldml2ZXIuY2FsbChob2xkZXIsIGtleSwgdmFsdWUpO1xyXG4gICAgfSh7ICcnOiByZXN1bHQgfSwgJycpKSA6IHJlc3VsdDtcclxuICB9O1xyXG59KCkpO1xyXG5cclxuLy8gSlNPTjUgc3RyaW5naWZ5IHdpbGwgbm90IHF1b3RlIGtleXMgd2hlcmUgYXBwcm9wcmlhdGVcclxuSlNPTjUuc3RyaW5naWZ5ID0gZnVuY3Rpb24gKG9iaiwgcmVwbGFjZXIsIHNwYWNlKSB7XHJcbiAgaWYgKHJlcGxhY2VyICYmICh0eXBlb2YgKHJlcGxhY2VyKSAhPT0gXCJmdW5jdGlvblwiICYmICFpc0FycmF5KHJlcGxhY2VyKSkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignUmVwbGFjZXIgbXVzdCBiZSBhIGZ1bmN0aW9uIG9yIGFuIGFycmF5Jyk7XHJcbiAgfVxyXG4gIHZhciBnZXRSZXBsYWNlZFZhbHVlT3JVbmRlZmluZWQgPSBmdW5jdGlvbiAoaG9sZGVyLCBrZXksIGlzVG9wTGV2ZWwpIHtcclxuICAgIHZhciB2YWx1ZSA9IGhvbGRlcltrZXldO1xyXG5cclxuICAgIC8vIFJlcGxhY2UgdGhlIHZhbHVlIHdpdGggaXRzIHRvSlNPTiB2YWx1ZSBmaXJzdCwgaWYgcG9zc2libGVcclxuICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS50b0pTT04gJiYgdHlwZW9mIHZhbHVlLnRvSlNPTiA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgIHZhbHVlID0gdmFsdWUudG9KU09OKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgdGhlIHVzZXItc3VwcGxpZWQgcmVwbGFjZXIgaWYgYSBmdW5jdGlvbiwgY2FsbCBpdC4gSWYgaXQncyBhbiBhcnJheSwgY2hlY2sgb2JqZWN0cycgc3RyaW5nIGtleXMgZm9yXHJcbiAgICAvLyBwcmVzZW5jZSBpbiB0aGUgYXJyYXkgKHJlbW92aW5nIHRoZSBrZXkvdmFsdWUgcGFpciBmcm9tIHRoZSByZXN1bHRpbmcgSlNPTiBpZiB0aGUga2V5IGlzIG1pc3NpbmcpLlxyXG4gICAgaWYgKHR5cGVvZiAocmVwbGFjZXIpID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgcmV0dXJuIHJlcGxhY2VyLmNhbGwoaG9sZGVyLCBrZXksIHZhbHVlKTtcclxuICAgIH0gZWxzZSBpZiAocmVwbGFjZXIpIHtcclxuICAgICAgaWYgKGlzVG9wTGV2ZWwgfHwgaXNBcnJheShob2xkZXIpIHx8IHJlcGxhY2VyLmluZGV4T2Yoa2V5KSA+PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBmdW5jdGlvbiBpc1dvcmRDaGFyKGNoYXIpIHtcclxuICAgIHJldHVybiAoY2hhciA+PSAnYScgJiYgY2hhciA8PSAneicpIHx8XHJcbiAgICAgIChjaGFyID49ICdBJyAmJiBjaGFyIDw9ICdaJykgfHxcclxuICAgICAgKGNoYXIgPj0gJzAnICYmIGNoYXIgPD0gJzknKSB8fFxyXG4gICAgICBjaGFyID09PSAnXycgfHwgY2hhciA9PT0gJyQnO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaXNXb3JkU3RhcnQoY2hhcikge1xyXG4gICAgcmV0dXJuIChjaGFyID49ICdhJyAmJiBjaGFyIDw9ICd6JykgfHxcclxuICAgICAgKGNoYXIgPj0gJ0EnICYmIGNoYXIgPD0gJ1onKSB8fFxyXG4gICAgICBjaGFyID09PSAnXycgfHwgY2hhciA9PT0gJyQnO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaXNXb3JkKGtleSkge1xyXG4gICAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIGlmICghaXNXb3JkU3RhcnQoa2V5WzBdKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICB2YXIgaSA9IDEsIGxlbmd0aCA9IGtleS5sZW5ndGg7XHJcbiAgICB3aGlsZSAoaSA8IGxlbmd0aCkge1xyXG4gICAgICBpZiAoIWlzV29yZENoYXIoa2V5W2ldKSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICBpKys7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIGV4cG9ydCBmb3IgdXNlIGluIHRlc3RzXHJcbiAgSlNPTjUuaXNXb3JkID0gaXNXb3JkO1xyXG5cclxuICAvLyBwb2x5ZmlsbHNcclxuICBmdW5jdGlvbiBpc0FycmF5KG9iaikge1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkpIHtcclxuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkob2JqKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGlzRGF0ZShvYmopIHtcclxuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xyXG4gIH1cclxuXHJcbiAgLy8gaXNOYU4gPSBpc05hTiB8fCBmdW5jdGlvbiAodmFsKSB7XHJcbiAgLy8gICByZXR1cm4gdHlwZW9mIHZhbCA9PT0gJ251bWJlcicgJiYgdmFsICE9PSB2YWw7XHJcbiAgLy8gfTtcclxuXHJcbiAgdmFyIG9ialN0YWNrID0gW107XHJcbiAgZnVuY3Rpb24gY2hlY2tGb3JDaXJjdWxhcihvYmopIHtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqU3RhY2subGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKG9ialN0YWNrW2ldID09PSBvYmopIHtcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ29udmVydGluZyBjaXJjdWxhciBzdHJ1Y3R1cmUgdG8gSlNPTlwiKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbWFrZUluZGVudChzdHIsIG51bSwgbm9OZXdMaW5lPykge1xyXG4gICAgaWYgKCFzdHIpIHtcclxuICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICB9XHJcbiAgICAvLyBpbmRlbnRhdGlvbiBubyBtb3JlIHRoYW4gMTAgY2hhcnNcclxuICAgIGlmIChzdHIubGVuZ3RoID4gMTApIHtcclxuICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLCAxMCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGluZGVudCA9IG5vTmV3TGluZSA/IFwiXCIgOiBcIlxcblwiO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW07IGkrKykge1xyXG4gICAgICBpbmRlbnQgKz0gc3RyO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpbmRlbnQ7XHJcbiAgfVxyXG5cclxuICB2YXIgaW5kZW50U3RyO1xyXG4gIGlmIChzcGFjZSkge1xyXG4gICAgaWYgKHR5cGVvZiBzcGFjZSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBpbmRlbnRTdHIgPSBzcGFjZTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNwYWNlID09PSBcIm51bWJlclwiICYmIHNwYWNlID49IDApIHtcclxuICAgICAgaW5kZW50U3RyID0gbWFrZUluZGVudChcIiBcIiwgc3BhY2UsIHRydWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gaWdub3JlIHNwYWNlIHBhcmFtZXRlclxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQ29waWVkIGZyb20gQ3Jva2ZvcmQncyBpbXBsZW1lbnRhdGlvbiBvZiBKU09OXHJcbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9kb3VnbGFzY3JvY2tmb3JkL0pTT04tanMvYmxvYi9lMzlkYjRiN2U2MjQ5ZjA0YTE5NWU3ZGQwODQwZTYxMGNjOWU5NDFlL2pzb24yLmpzI0wxOTVcclxuICAvLyBCZWdpblxyXG4gIHZhciBjeCA9IC9bXFx1MDAwMFxcdTAwYWRcXHUwNjAwLVxcdTA2MDRcXHUwNzBmXFx1MTdiNFxcdTE3YjVcXHUyMDBjLVxcdTIwMGZcXHUyMDI4LVxcdTIwMmZcXHUyMDYwLVxcdTIwNmZcXHVmZWZmXFx1ZmZmMC1cXHVmZmZmXS9nLFxyXG4gICAgZXNjYXBhYmxlID0gL1tcXFxcXFxcIlxceDAwLVxceDFmXFx4N2YtXFx4OWZcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZyxcclxuICAgIG1ldGEgPSB7IC8vIHRhYmxlIG9mIGNoYXJhY3RlciBzdWJzdGl0dXRpb25zXHJcbiAgICAgICdcXGInOiAnXFxcXGInLFxyXG4gICAgICAnXFx0JzogJ1xcXFx0JyxcclxuICAgICAgJ1xcbic6ICdcXFxcbicsXHJcbiAgICAgICdcXGYnOiAnXFxcXGYnLFxyXG4gICAgICAnXFxyJzogJ1xcXFxyJyxcclxuICAgICAgJ1wiJzogJ1xcXFxcIicsXHJcbiAgICAgICdcXFxcJzogJ1xcXFxcXFxcJ1xyXG4gICAgfTtcclxuICBmdW5jdGlvbiBlc2NhcGVTdHJpbmcoc3RyaW5nKSB7XHJcblxyXG4gICAgLy8gSWYgdGhlIHN0cmluZyBjb250YWlucyBubyBjb250cm9sIGNoYXJhY3RlcnMsIG5vIHF1b3RlIGNoYXJhY3RlcnMsIGFuZCBub1xyXG4gICAgLy8gYmFja3NsYXNoIGNoYXJhY3RlcnMsIHRoZW4gd2UgY2FuIHNhZmVseSBzbGFwIHNvbWUgcXVvdGVzIGFyb3VuZCBpdC5cclxuICAgIC8vIE90aGVyd2lzZSB3ZSBtdXN0IGFsc28gcmVwbGFjZSB0aGUgb2ZmZW5kaW5nIGNoYXJhY3RlcnMgd2l0aCBzYWZlIGVzY2FwZVxyXG4gICAgLy8gc2VxdWVuY2VzLlxyXG4gICAgZXNjYXBhYmxlLmxhc3RJbmRleCA9IDA7XHJcbiAgICByZXR1cm4gZXNjYXBhYmxlLnRlc3Qoc3RyaW5nKSA/ICdcIicgKyBzdHJpbmcucmVwbGFjZShlc2NhcGFibGUsIGZ1bmN0aW9uIChhKSB7XHJcbiAgICAgIHZhciBjID0gbWV0YVthXTtcclxuICAgICAgcmV0dXJuIHR5cGVvZiBjID09PSAnc3RyaW5nJyA/XHJcbiAgICAgICAgYyA6XHJcbiAgICAgICAgJ1xcXFx1JyArICgnMDAwMCcgKyBhLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCk7XHJcbiAgICB9KSArICdcIicgOiAnXCInICsgc3RyaW5nICsgJ1wiJztcclxuICB9XHJcbiAgLy8gRW5kXHJcblxyXG4gIGZ1bmN0aW9uIGludGVybmFsU3RyaW5naWZ5KGhvbGRlciwga2V5LCBpc1RvcExldmVsKSB7XHJcbiAgICB2YXIgYnVmZmVyLCByZXM7XHJcblxyXG4gICAgLy8gUmVwbGFjZSB0aGUgdmFsdWUsIGlmIG5lY2Vzc2FyeVxyXG4gICAgdmFyIG9ial9wYXJ0ID0gZ2V0UmVwbGFjZWRWYWx1ZU9yVW5kZWZpbmVkKGhvbGRlciwga2V5LCBpc1RvcExldmVsKTtcclxuXHJcbiAgICBpZiAob2JqX3BhcnQgJiYgIWlzRGF0ZShvYmpfcGFydCkpIHtcclxuICAgICAgLy8gdW5ib3ggb2JqZWN0c1xyXG4gICAgICAvLyBkb24ndCB1bmJveCBkYXRlcywgc2luY2Ugd2lsbCB0dXJuIGl0IGludG8gbnVtYmVyXHJcbiAgICAgIG9ial9wYXJ0ID0gb2JqX3BhcnQudmFsdWVPZigpO1xyXG4gICAgfVxyXG4gICAgc3dpdGNoICh0eXBlb2Ygb2JqX3BhcnQpIHtcclxuICAgICAgY2FzZSBcImJvb2xlYW5cIjpcclxuICAgICAgICByZXR1cm4gb2JqX3BhcnQudG9TdHJpbmcoKTtcclxuXHJcbiAgICAgIGNhc2UgXCJudW1iZXJcIjpcclxuICAgICAgICBpZiAoaXNOYU4ob2JqX3BhcnQpIHx8ICFpc0Zpbml0ZShvYmpfcGFydCkpIHtcclxuICAgICAgICAgIHJldHVybiBcIm51bGxcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9ial9wYXJ0LnRvU3RyaW5nKCk7XHJcblxyXG4gICAgICBjYXNlIFwic3RyaW5nXCI6XHJcbiAgICAgICAgcmV0dXJuIGVzY2FwZVN0cmluZyhvYmpfcGFydC50b1N0cmluZygpKTtcclxuXHJcbiAgICAgIGNhc2UgXCJvYmplY3RcIjpcclxuICAgICAgICBpZiAob2JqX3BhcnQgPT09IG51bGwpIHtcclxuICAgICAgICAgIHJldHVybiBcIm51bGxcIjtcclxuICAgICAgICB9IGVsc2UgaWYgKGlzQXJyYXkob2JqX3BhcnQpKSB7XHJcbiAgICAgICAgICBjaGVja0ZvckNpcmN1bGFyKG9ial9wYXJ0KTtcclxuICAgICAgICAgIGJ1ZmZlciA9IFwiW1wiO1xyXG4gICAgICAgICAgb2JqU3RhY2sucHVzaChvYmpfcGFydCk7XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmpfcGFydC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICByZXMgPSBpbnRlcm5hbFN0cmluZ2lmeShvYmpfcGFydCwgaSwgZmFsc2UpO1xyXG4gICAgICAgICAgICBidWZmZXIgKz0gbWFrZUluZGVudChpbmRlbnRTdHIsIG9ialN0YWNrLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGlmIChyZXMgPT09IG51bGwgfHwgdHlwZW9mIHJlcyA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgIGJ1ZmZlciArPSBcIm51bGxcIjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBidWZmZXIgKz0gcmVzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpIDwgb2JqX3BhcnQubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgIGJ1ZmZlciArPSBcIixcIjtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpbmRlbnRTdHIpIHtcclxuICAgICAgICAgICAgICBidWZmZXIgKz0gXCJcXG5cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgb2JqU3RhY2sucG9wKCk7XHJcbiAgICAgICAgICBidWZmZXIgKz0gbWFrZUluZGVudChpbmRlbnRTdHIsIG9ialN0YWNrLmxlbmd0aCwgdHJ1ZSkgKyBcIl1cIjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY2hlY2tGb3JDaXJjdWxhcihvYmpfcGFydCk7XHJcbiAgICAgICAgICBidWZmZXIgPSBcIntcIjtcclxuICAgICAgICAgIHZhciBub25FbXB0eSA9IGZhbHNlO1xyXG4gICAgICAgICAgb2JqU3RhY2sucHVzaChvYmpfcGFydCk7XHJcbiAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIG9ial9wYXJ0KSB7XHJcbiAgICAgICAgICAgIGlmIChvYmpfcGFydC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGludGVybmFsU3RyaW5naWZ5KG9ial9wYXJ0LCBwcm9wLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgaXNUb3BMZXZlbCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIgJiYgdmFsdWUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGJ1ZmZlciArPSBtYWtlSW5kZW50KGluZGVudFN0ciwgb2JqU3RhY2subGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIG5vbkVtcHR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHZhciBrZXk6IGFueSA9IGlzV29yZChwcm9wKSA/IHByb3AgOiBlc2NhcGVTdHJpbmcocHJvcCk7XHJcbiAgICAgICAgICAgICAgICBidWZmZXIgKz0ga2V5ICsgXCI6XCIgKyAoaW5kZW50U3RyID8gJyAnIDogJycpICsgdmFsdWUgKyBcIixcIjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIG9ialN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgaWYgKG5vbkVtcHR5KSB7XHJcbiAgICAgICAgICAgIGJ1ZmZlciA9IGJ1ZmZlci5zdWJzdHJpbmcoMCwgYnVmZmVyLmxlbmd0aCAtIDEpICsgbWFrZUluZGVudChpbmRlbnRTdHIsIG9ialN0YWNrLmxlbmd0aCkgKyBcIn1cIjtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGJ1ZmZlciA9ICd7fSc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgLy8gZnVuY3Rpb25zIGFuZCB1bmRlZmluZWQgc2hvdWxkIGJlIGlnbm9yZWRcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gc3BlY2lhbCBjYXNlLi4ud2hlbiB1bmRlZmluZWQgaXMgdXNlZCBpbnNpZGUgb2ZcclxuICAvLyBhIGNvbXBvdW5kIG9iamVjdC9hcnJheSwgcmV0dXJuIG51bGwuXHJcbiAgLy8gYnV0IHdoZW4gdG9wLWxldmVsLCByZXR1cm4gdW5kZWZpbmVkXHJcbiAgdmFyIHRvcExldmVsSG9sZGVyID0geyBcIlwiOiBvYmogfTtcclxuICBpZiAob2JqID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBnZXRSZXBsYWNlZFZhbHVlT3JVbmRlZmluZWQodG9wTGV2ZWxIb2xkZXIsICcnLCB0cnVlKTtcclxuICB9XHJcbiAgcmV0dXJuIGludGVybmFsU3RyaW5naWZ5KHRvcExldmVsSG9sZGVyLCAnJywgdHJ1ZSk7XHJcbn07XHJcbiJdfQ==