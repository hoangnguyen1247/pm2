"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

// json5.js
// Modern JSON. See README.md for details.
//
// This file is based directly off of Douglas Crockford's json_parse.js:
// https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
var JSON5 = (typeof exports === "undefined" ? "undefined" : (0, _typeof2["default"])(exports)) === 'object' ? exports : {};

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

      if (value && (0, _typeof2["default"])(value) === 'object') {
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

    switch ((0, _typeof2["default"])(obj_part)) {
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

var _default = JSON5;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9qc29uNS50cyJdLCJuYW1lcyI6WyJKU09ONSIsImV4cG9ydHMiLCJwYXJzZSIsImF0IiwiY2giLCJlc2NhcGVlIiwiYiIsImYiLCJuIiwiciIsInQiLCJ3cyIsInRleHQiLCJlcnJvciIsIm0iLCJTeW50YXhFcnJvciIsIm1lc3NhZ2UiLCJuZXh0IiwiYyIsImNoYXJBdCIsInBlZWsiLCJpZGVudGlmaWVyIiwia2V5IiwibnVtYmVyIiwic2lnbiIsInN0cmluZyIsImJhc2UiLCJ3b3JkIiwiaXNOYU4iLCJpc0Zpbml0ZSIsImhleCIsImkiLCJkZWxpbSIsInVmZmZmIiwicGFyc2VJbnQiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJpbmxpbmVDb21tZW50IiwiYmxvY2tDb21tZW50IiwiY29tbWVudCIsIndoaXRlIiwiaW5kZXhPZiIsIkluZmluaXR5IiwiTmFOIiwidmFsdWUiLCJhcnJheSIsInB1c2giLCJvYmplY3QiLCJzb3VyY2UiLCJyZXZpdmVyIiwicmVzdWx0Iiwid2FsayIsImhvbGRlciIsImsiLCJ2IiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwidW5kZWZpbmVkIiwic3RyaW5naWZ5Iiwib2JqIiwicmVwbGFjZXIiLCJzcGFjZSIsImlzQXJyYXkiLCJFcnJvciIsImdldFJlcGxhY2VkVmFsdWVPclVuZGVmaW5lZCIsImlzVG9wTGV2ZWwiLCJ0b0pTT04iLCJpc1dvcmRDaGFyIiwiY2hhciIsImlzV29yZFN0YXJ0IiwiaXNXb3JkIiwibGVuZ3RoIiwiQXJyYXkiLCJ0b1N0cmluZyIsImlzRGF0ZSIsIm9ialN0YWNrIiwiY2hlY2tGb3JDaXJjdWxhciIsIlR5cGVFcnJvciIsIm1ha2VJbmRlbnQiLCJzdHIiLCJudW0iLCJub05ld0xpbmUiLCJzdWJzdHJpbmciLCJpbmRlbnQiLCJpbmRlbnRTdHIiLCJjeCIsImVzY2FwYWJsZSIsIm1ldGEiLCJlc2NhcGVTdHJpbmciLCJsYXN0SW5kZXgiLCJ0ZXN0IiwicmVwbGFjZSIsImEiLCJjaGFyQ29kZUF0Iiwic2xpY2UiLCJpbnRlcm5hbFN0cmluZ2lmeSIsImJ1ZmZlciIsInJlcyIsIm9ial9wYXJ0IiwidmFsdWVPZiIsInBvcCIsIm5vbkVtcHR5IiwicHJvcCIsInRvcExldmVsSG9sZGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQSxJQUFJQSxLQUFLLEdBQUksUUFBT0MsT0FBUCwwREFBT0EsT0FBUCxPQUFtQixRQUFuQixHQUE4QkEsT0FBOUIsR0FBd0MsRUFBckQ7O0FBRUFELEtBQUssQ0FBQ0UsS0FBTixHQUFlLFlBQVk7QUFDekIsZUFEeUIsQ0FHekI7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBOztBQUVBLE1BQUlDLEVBQUo7QUFBQSxNQUFZO0FBQ1ZDLEVBQUFBLEVBREY7QUFBQSxNQUNVO0FBQ1JDLEVBQUFBLE9BQU8sR0FBRztBQUNSLFNBQUssR0FERztBQUVSLFNBQUssR0FGRztBQUdSLFVBQU0sSUFIRTtBQUlSLFNBQUssR0FKRztBQUtSLFVBQU0sRUFMRTtBQUtRO0FBQ2hCQyxJQUFBQSxDQUFDLEVBQUUsSUFOSztBQU9SQyxJQUFBQSxDQUFDLEVBQUUsSUFQSztBQVFSQyxJQUFBQSxDQUFDLEVBQUUsSUFSSztBQVNSQyxJQUFBQSxDQUFDLEVBQUUsSUFUSztBQVVSQyxJQUFBQSxDQUFDLEVBQUU7QUFWSyxHQUZaO0FBQUEsTUFjRUMsRUFBRSxHQUFHLENBQ0gsR0FERyxFQUVILElBRkcsRUFHSCxJQUhHLEVBSUgsSUFKRyxFQUtILElBTEcsRUFNSCxJQU5HLEVBT0gsTUFQRyxFQVFILFFBUkcsQ0FkUDtBQUFBLE1Bd0JFQyxJQXhCRjtBQUFBLE1BMEJFQyxLQUFLLEdBQUcsZUFBVUMsQ0FBVixFQUFhO0FBRW5CO0FBRUEsUUFBSUQsS0FBVSxHQUFHLElBQUlFLFdBQUosRUFBakI7QUFDQUYsSUFBQUEsS0FBSyxDQUFDRyxPQUFOLEdBQWdCRixDQUFoQjtBQUNB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QUFYO0FBQ0Esb0JBQUlqRixHQUFRLEdBQUdrRCxNQUFNLENBQUNnQyxJQUFELENBQU4sR0FBZUEsSUFBZixHQUFzQmQsWUFBWSxDQUFDYyxJQUFELENBQWpEO0FBQ0FOLGdCQUFBQSxNQUFNLElBQUk1RSxHQUFHLEdBQUcsR0FBTixJQUFhZ0UsU0FBUyxHQUFHLEdBQUgsR0FBUyxFQUEvQixJQUFxQzFDLEtBQXJDLEdBQTZDLEdBQXZEO0FBQ0Q7QUFDRjtBQUNGOztBQUNEaUMsVUFBQUEsUUFBUSxDQUFDeUIsR0FBVDs7QUFDQSxjQUFJQyxRQUFKLEVBQWM7QUFDWkwsWUFBQUEsTUFBTSxHQUFHQSxNQUFNLENBQUNkLFNBQVAsQ0FBaUIsQ0FBakIsRUFBb0JjLE1BQU0sQ0FBQ3pCLE1BQVAsR0FBZ0IsQ0FBcEMsSUFBeUNPLFVBQVUsQ0FBQ00sU0FBRCxFQUFZVCxRQUFRLENBQUNKLE1BQXJCLENBQW5ELEdBQWtGLEdBQTNGO0FBQ0QsV0FGRCxNQUVPO0FBQ0x5QixZQUFBQSxNQUFNLEdBQUcsSUFBVDtBQUNEO0FBQ0Y7O0FBQ0QsZUFBT0EsTUFBUDs7QUFDRjtBQUNFO0FBQ0EsZUFBT3ZDLFNBQVA7QUFoRUo7QUFrRUQsR0E3TitDLENBK05oRDtBQUNBO0FBQ0E7OztBQUNBLE1BQUk4QyxjQUFjLEdBQUc7QUFBRSxRQUFJNUM7QUFBTixHQUFyQjs7QUFDQSxNQUFJQSxHQUFHLEtBQUtGLFNBQVosRUFBdUI7QUFDckIsV0FBT08sMkJBQTJCLENBQUN1QyxjQUFELEVBQWlCLEVBQWpCLEVBQXFCLElBQXJCLENBQWxDO0FBQ0Q7O0FBQ0QsU0FBT1IsaUJBQWlCLENBQUNRLGNBQUQsRUFBaUIsRUFBakIsRUFBcUIsSUFBckIsQ0FBeEI7QUFDRCxDQXZPRDs7ZUF5T2V6RyxLIiwic291cmNlc0NvbnRlbnQiOlsiLy8ganNvbjUuanNcbi8vIE1vZGVybiBKU09OLiBTZWUgUkVBRE1FLm1kIGZvciBkZXRhaWxzLlxuLy9cbi8vIFRoaXMgZmlsZSBpcyBiYXNlZCBkaXJlY3RseSBvZmYgb2YgRG91Z2xhcyBDcm9ja2ZvcmQncyBqc29uX3BhcnNlLmpzOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2RvdWdsYXNjcm9ja2ZvcmQvSlNPTi1qcy9ibG9iL21hc3Rlci9qc29uX3BhcnNlLmpzXG5cbnZhciBKU09ONSA9ICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgPyBleHBvcnRzIDoge30pO1xuXG5KU09ONS5wYXJzZSA9IChmdW5jdGlvbiAoKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIC8vIFRoaXMgaXMgYSBmdW5jdGlvbiB0aGF0IGNhbiBwYXJzZSBhIEpTT041IHRleHQsIHByb2R1Y2luZyBhIEphdmFTY3JpcHRcbiAgLy8gZGF0YSBzdHJ1Y3R1cmUuIEl0IGlzIGEgc2ltcGxlLCByZWN1cnNpdmUgZGVzY2VudCBwYXJzZXIuIEl0IGRvZXMgbm90IHVzZVxuICAvLyBldmFsIG9yIHJlZ3VsYXIgZXhwcmVzc2lvbnMsIHNvIGl0IGNhbiBiZSB1c2VkIGFzIGEgbW9kZWwgZm9yIGltcGxlbWVudGluZ1xuICAvLyBhIEpTT041IHBhcnNlciBpbiBvdGhlciBsYW5ndWFnZXMuXG5cbiAgLy8gV2UgYXJlIGRlZmluaW5nIHRoZSBmdW5jdGlvbiBpbnNpZGUgb2YgYW5vdGhlciBmdW5jdGlvbiB0byBhdm9pZCBjcmVhdGluZ1xuICAvLyBnbG9iYWwgdmFyaWFibGVzLlxuXG4gIHZhciBhdCwgICAgIC8vIFRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBjaGFyYWN0ZXJcbiAgICBjaCwgICAgIC8vIFRoZSBjdXJyZW50IGNoYXJhY3RlclxuICAgIGVzY2FwZWUgPSB7XG4gICAgICBcIidcIjogXCInXCIsXG4gICAgICAnXCInOiAnXCInLFxuICAgICAgJ1xcXFwnOiAnXFxcXCcsXG4gICAgICAnLyc6ICcvJyxcbiAgICAgICdcXG4nOiAnJywgICAgICAgLy8gUmVwbGFjZSBlc2NhcGVkIG5ld2xpbmVzIGluIHN0cmluZ3Mgdy8gZW1wdHkgc3RyaW5nXG4gICAgICBiOiAnXFxiJyxcbiAgICAgIGY6ICdcXGYnLFxuICAgICAgbjogJ1xcbicsXG4gICAgICByOiAnXFxyJyxcbiAgICAgIHQ6ICdcXHQnXG4gICAgfSxcbiAgICB3cyA9IFtcbiAgICAgICcgJyxcbiAgICAgICdcXHQnLFxuICAgICAgJ1xccicsXG4gICAgICAnXFxuJyxcbiAgICAgICdcXHYnLFxuICAgICAgJ1xcZicsXG4gICAgICAnXFx4QTAnLFxuICAgICAgJ1xcdUZFRkYnXG4gICAgXSxcbiAgICB0ZXh0LFxuXG4gICAgZXJyb3IgPSBmdW5jdGlvbiAobSkge1xuXG4gICAgICAvLyBDYWxsIGVycm9yIHdoZW4gc29tZXRoaW5nIGlzIHdyb25nLlxuXG4gICAgICB2YXIgZXJyb3I6IGFueSA9IG5ldyBTeW50YXhFcnJvcigpO1xuICAgICAgZXJyb3IubWVzc2FnZSA9IG07XG4gICAgICBlcnJvci5hdCA9IGF0O1xuICAgICAgZXJyb3IudGV4dCA9IHRleHQ7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9LFxuXG4gICAgbmV4dDogYW55ID0gZnVuY3Rpb24gKGMpIHtcblxuICAgICAgLy8gSWYgYSBjIHBhcmFtZXRlciBpcyBwcm92aWRlZCwgdmVyaWZ5IHRoYXQgaXQgbWF0Y2hlcyB0aGUgY3VycmVudCBjaGFyYWN0ZXIuXG5cbiAgICAgIGlmIChjICYmIGMgIT09IGNoKSB7XG4gICAgICAgIGVycm9yKFwiRXhwZWN0ZWQgJ1wiICsgYyArIFwiJyBpbnN0ZWFkIG9mICdcIiArIGNoICsgXCInXCIpO1xuICAgICAgfVxuXG4gICAgICAvLyBHZXQgdGhlIG5leHQgY2hhcmFjdGVyLiBXaGVuIHRoZXJlIGFyZSBubyBtb3JlIGNoYXJhY3RlcnMsXG4gICAgICAvLyByZXR1cm4gdGhlIGVtcHR5IHN0cmluZy5cblxuICAgICAgY2ggPSB0ZXh0LmNoYXJBdChhdCk7XG4gICAgICBhdCArPSAxO1xuICAgICAgcmV0dXJuIGNoO1xuICAgIH0sXG5cbiAgICBwZWVrID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBHZXQgdGhlIG5leHQgY2hhcmFjdGVyIHdpdGhvdXQgY29uc3VtaW5nIGl0IG9yXG4gICAgICAvLyBhc3NpZ25pbmcgaXQgdG8gdGhlIGNoIHZhcmFpYmxlLlxuXG4gICAgICByZXR1cm4gdGV4dC5jaGFyQXQoYXQpO1xuICAgIH0sXG5cbiAgICBpZGVudGlmaWVyID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBQYXJzZSBhbiBpZGVudGlmaWVyLiBOb3JtYWxseSwgcmVzZXJ2ZWQgd29yZHMgYXJlIGRpc2FsbG93ZWQgaGVyZSwgYnV0IHdlXG4gICAgICAvLyBvbmx5IHVzZSB0aGlzIGZvciB1bnF1b3RlZCBvYmplY3Qga2V5cywgd2hlcmUgcmVzZXJ2ZWQgd29yZHMgYXJlIGFsbG93ZWQsXG4gICAgICAvLyBzbyB3ZSBkb24ndCBjaGVjayBmb3IgdGhvc2UgaGVyZS4gUmVmZXJlbmNlczpcbiAgICAgIC8vIC0gaHR0cDovL2VzNS5naXRodWIuY29tLyN4Ny42XG4gICAgICAvLyAtIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0NvcmVfSmF2YVNjcmlwdF8xLjVfR3VpZGUvQ29yZV9MYW5ndWFnZV9GZWF0dXJlcyNWYXJpYWJsZXNcbiAgICAgIC8vIC0gaHR0cDovL2RvY3N0b3JlLm1pay51YS9vcmVsbHkvd2VicHJvZy9qc2NyaXB0L2NoMDJfMDcuaHRtXG5cbiAgICAgIHZhciBrZXkgPSBjaDtcblxuICAgICAgLy8gSWRlbnRpZmllcnMgbXVzdCBzdGFydCB3aXRoIGEgbGV0dGVyLCBfIG9yICQuXG4gICAgICBpZiAoKGNoICE9PSAnXycgJiYgY2ggIT09ICckJykgJiZcbiAgICAgICAgKGNoIDwgJ2EnIHx8IGNoID4gJ3onKSAmJlxuICAgICAgICAoY2ggPCAnQScgfHwgY2ggPiAnWicpKSB7XG4gICAgICAgIGVycm9yKFwiQmFkIGlkZW50aWZpZXJcIik7XG4gICAgICB9XG5cbiAgICAgIC8vIFN1YnNlcXVlbnQgY2hhcmFjdGVycyBjYW4gY29udGFpbiBkaWdpdHMuXG4gICAgICB3aGlsZSAobmV4dCgpICYmIChcbiAgICAgICAgY2ggPT09ICdfJyB8fCBjaCA9PT0gJyQnIHx8XG4gICAgICAgIChjaCA+PSAnYScgJiYgY2ggPD0gJ3onKSB8fFxuICAgICAgICAoY2ggPj0gJ0EnICYmIGNoIDw9ICdaJykgfHxcbiAgICAgICAgKGNoID49ICcwJyAmJiBjaCA8PSAnOScpKSkge1xuICAgICAgICBrZXkgKz0gY2g7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBrZXk7XG4gICAgfSxcblxuICAgIG51bWJlciA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgLy8gUGFyc2UgYSBudW1iZXIgdmFsdWUuXG5cbiAgICAgIHZhciBudW1iZXIsXG4gICAgICAgIHNpZ24gPSAnJyxcbiAgICAgICAgc3RyaW5nID0gJycsXG4gICAgICAgIGJhc2UgPSAxMDtcblxuICAgICAgaWYgKGNoID09PSAnLScgfHwgY2ggPT09ICcrJykge1xuICAgICAgICBzaWduID0gY2g7XG4gICAgICAgIG5leHQoY2gpO1xuICAgICAgfVxuXG4gICAgICAvLyBzdXBwb3J0IGZvciBJbmZpbml0eSAoY291bGQgdHdlYWsgdG8gYWxsb3cgb3RoZXIgd29yZHMpOlxuICAgICAgaWYgKGNoID09PSAnSScpIHtcbiAgICAgICAgbnVtYmVyID0gd29yZCgpO1xuICAgICAgICBpZiAodHlwZW9mIG51bWJlciAhPT0gJ251bWJlcicgfHwgaXNOYU4obnVtYmVyKSkge1xuICAgICAgICAgIGVycm9yKCdVbmV4cGVjdGVkIHdvcmQgZm9yIG51bWJlcicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoc2lnbiA9PT0gJy0nKSA/IC1udW1iZXIgOiBudW1iZXI7XG4gICAgICB9XG5cbiAgICAgIC8vIHN1cHBvcnQgZm9yIE5hTlxuICAgICAgaWYgKGNoID09PSAnTicpIHtcbiAgICAgICAgbnVtYmVyID0gd29yZCgpO1xuICAgICAgICBpZiAoIWlzTmFOKG51bWJlcikpIHtcbiAgICAgICAgICBlcnJvcignZXhwZWN0ZWQgd29yZCB0byBiZSBOYU4nKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpZ25vcmUgc2lnbiBhcyAtTmFOIGFsc28gaXMgTmFOXG4gICAgICAgIHJldHVybiBudW1iZXI7XG4gICAgICB9XG5cbiAgICAgIGlmIChjaCA9PT0gJzAnKSB7XG4gICAgICAgIHN0cmluZyArPSBjaDtcbiAgICAgICAgbmV4dCgpO1xuICAgICAgICBpZiAoY2ggPT09ICd4JyB8fCBjaCA9PT0gJ1gnKSB7XG4gICAgICAgICAgc3RyaW5nICs9IGNoO1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICBiYXNlID0gMTY7XG4gICAgICAgIH0gZWxzZSBpZiAoY2ggPj0gJzAnICYmIGNoIDw9ICc5Jykge1xuICAgICAgICAgIGVycm9yKCdPY3RhbCBsaXRlcmFsJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChiYXNlKSB7XG4gICAgICAgIGNhc2UgMTA6XG4gICAgICAgICAgd2hpbGUgKGNoID49ICcwJyAmJiBjaCA8PSAnOScpIHtcbiAgICAgICAgICAgIHN0cmluZyArPSBjaDtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNoID09PSAnLicpIHtcbiAgICAgICAgICAgIHN0cmluZyArPSAnLic7XG4gICAgICAgICAgICB3aGlsZSAobmV4dCgpICYmIGNoID49ICcwJyAmJiBjaCA8PSAnOScpIHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY2ggPT09ICdlJyB8fCBjaCA9PT0gJ0UnKSB7XG4gICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICBpZiAoY2ggPT09ICctJyB8fCBjaCA9PT0gJysnKSB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBjaDtcbiAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2hpbGUgKGNoID49ICcwJyAmJiBjaCA8PSAnOScpIHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xuICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE2OlxuICAgICAgICAgIHdoaWxlIChjaCA+PSAnMCcgJiYgY2ggPD0gJzknIHx8IGNoID49ICdBJyAmJiBjaCA8PSAnRicgfHwgY2ggPj0gJ2EnICYmIGNoIDw9ICdmJykge1xuICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKHNpZ24gPT09ICctJykge1xuICAgICAgICBudW1iZXIgPSAtc3RyaW5nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbnVtYmVyID0gK3N0cmluZztcbiAgICAgIH1cblxuICAgICAgaWYgKCFpc0Zpbml0ZShudW1iZXIpKSB7XG4gICAgICAgIGVycm9yKFwiQmFkIG51bWJlclwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudW1iZXI7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHN0cmluZyA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgLy8gUGFyc2UgYSBzdHJpbmcgdmFsdWUuXG5cbiAgICAgIHZhciBoZXgsXG4gICAgICAgIGksXG4gICAgICAgIHN0cmluZyA9ICcnLFxuICAgICAgICBkZWxpbSwgICAgICAvLyBkb3VibGUgcXVvdGUgb3Igc2luZ2xlIHF1b3RlXG4gICAgICAgIHVmZmZmO1xuXG4gICAgICAvLyBXaGVuIHBhcnNpbmcgZm9yIHN0cmluZyB2YWx1ZXMsIHdlIG11c3QgbG9vayBmb3IgJyBvciBcIiBhbmQgXFwgY2hhcmFjdGVycy5cblxuICAgICAgaWYgKGNoID09PSAnXCInIHx8IGNoID09PSBcIidcIikge1xuICAgICAgICBkZWxpbSA9IGNoO1xuICAgICAgICB3aGlsZSAobmV4dCgpKSB7XG4gICAgICAgICAgaWYgKGNoID09PSBkZWxpbSkge1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnXFxcXCcpIHtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJ3UnKSB7XG4gICAgICAgICAgICAgIHVmZmZmID0gMDtcbiAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDQ7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGhleCA9IHBhcnNlSW50KG5leHQoKSwgMTYpO1xuICAgICAgICAgICAgICAgIGlmICghaXNGaW5pdGUoaGV4KSkge1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHVmZmZmID0gdWZmZmYgKiAxNiArIGhleDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzdHJpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh1ZmZmZik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnXFxyJykge1xuICAgICAgICAgICAgICBpZiAocGVlaygpID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZXNjYXBlZVtjaF0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBlc2NhcGVlW2NoXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAvLyB1bmVzY2FwZWQgbmV3bGluZXMgYXJlIGludmFsaWQ7IHNlZTpcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hc2VlbWsvanNvbjUvaXNzdWVzLzI0XG4gICAgICAgICAgICAvLyBpbnZhbGlkIHVuZXNjYXBlZCBjaGFycz9cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlcnJvcihcIkJhZCBzdHJpbmdcIik7XG4gICAgfSxcblxuICAgIGlubGluZUNvbW1lbnQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIC8vIFNraXAgYW4gaW5saW5lIGNvbW1lbnQsIGFzc3VtaW5nIHRoaXMgaXMgb25lLiBUaGUgY3VycmVudCBjaGFyYWN0ZXIgc2hvdWxkXG4gICAgICAvLyBiZSB0aGUgc2Vjb25kIC8gY2hhcmFjdGVyIGluIHRoZSAvLyBwYWlyIHRoYXQgYmVnaW5zIHRoaXMgaW5saW5lIGNvbW1lbnQuXG4gICAgICAvLyBUbyBmaW5pc2ggdGhlIGlubGluZSBjb21tZW50LCB3ZSBsb29rIGZvciBhIG5ld2xpbmUgb3IgdGhlIGVuZCBvZiB0aGUgdGV4dC5cblxuICAgICAgaWYgKGNoICE9PSAnLycpIHtcbiAgICAgICAgZXJyb3IoXCJOb3QgYW4gaW5saW5lIGNvbW1lbnRcIik7XG4gICAgICB9XG5cbiAgICAgIGRvIHtcbiAgICAgICAgbmV4dCgpO1xuICAgICAgICBpZiAoY2ggPT09ICdcXG4nIHx8IGNoID09PSAnXFxyJykge1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0gd2hpbGUgKGNoKTtcbiAgICB9LFxuXG4gICAgYmxvY2tDb21tZW50ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBTa2lwIGEgYmxvY2sgY29tbWVudCwgYXNzdW1pbmcgdGhpcyBpcyBvbmUuIFRoZSBjdXJyZW50IGNoYXJhY3RlciBzaG91bGQgYmVcbiAgICAgIC8vIHRoZSAqIGNoYXJhY3RlciBpbiB0aGUgLyogcGFpciB0aGF0IGJlZ2lucyB0aGlzIGJsb2NrIGNvbW1lbnQuXG4gICAgICAvLyBUbyBmaW5pc2ggdGhlIGJsb2NrIGNvbW1lbnQsIHdlIGxvb2sgZm9yIGFuIGVuZGluZyAqLyBwYWlyIG9mIGNoYXJhY3RlcnMsXG4gICAgICAvLyBidXQgd2UgYWxzbyB3YXRjaCBmb3IgdGhlIGVuZCBvZiB0ZXh0IGJlZm9yZSB0aGUgY29tbWVudCBpcyB0ZXJtaW5hdGVkLlxuXG4gICAgICBpZiAoY2ggIT09ICcqJykge1xuICAgICAgICBlcnJvcihcIk5vdCBhIGJsb2NrIGNvbW1lbnRcIik7XG4gICAgICB9XG5cbiAgICAgIGRvIHtcbiAgICAgICAgbmV4dCgpO1xuICAgICAgICB3aGlsZSAoY2ggPT09ICcqJykge1xuICAgICAgICAgIG5leHQoJyonKTtcbiAgICAgICAgICBpZiAoY2ggPT09ICcvJykge1xuICAgICAgICAgICAgbmV4dCgnLycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSB3aGlsZSAoY2gpO1xuXG4gICAgICBlcnJvcihcIlVudGVybWluYXRlZCBibG9jayBjb21tZW50XCIpO1xuICAgIH0sXG5cbiAgICBjb21tZW50ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBTa2lwIGEgY29tbWVudCwgd2hldGhlciBpbmxpbmUgb3IgYmxvY2stbGV2ZWwsIGFzc3VtaW5nIHRoaXMgaXMgb25lLlxuICAgICAgLy8gQ29tbWVudHMgYWx3YXlzIGJlZ2luIHdpdGggYSAvIGNoYXJhY3Rlci5cblxuICAgICAgaWYgKGNoICE9PSAnLycpIHtcbiAgICAgICAgZXJyb3IoXCJOb3QgYSBjb21tZW50XCIpO1xuICAgICAgfVxuXG4gICAgICBuZXh0KCcvJyk7XG5cbiAgICAgIGlmIChjaCA9PT0gJy8nKSB7XG4gICAgICAgIGlubGluZUNvbW1lbnQoKTtcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICcqJykge1xuICAgICAgICBibG9ja0NvbW1lbnQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVycm9yKFwiVW5yZWNvZ25pemVkIGNvbW1lbnRcIik7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHdoaXRlID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBTa2lwIHdoaXRlc3BhY2UgYW5kIGNvbW1lbnRzLlxuICAgICAgLy8gTm90ZSB0aGF0IHdlJ3JlIGRldGVjdGluZyBjb21tZW50cyBieSBvbmx5IGEgc2luZ2xlIC8gY2hhcmFjdGVyLlxuICAgICAgLy8gVGhpcyB3b3JrcyBzaW5jZSByZWd1bGFyIGV4cHJlc3Npb25zIGFyZSBub3QgdmFsaWQgSlNPTig1KSwgYnV0IHRoaXMgd2lsbFxuICAgICAgLy8gYnJlYWsgaWYgdGhlcmUgYXJlIG90aGVyIHZhbGlkIHZhbHVlcyB0aGF0IGJlZ2luIHdpdGggYSAvIGNoYXJhY3RlciFcblxuICAgICAgd2hpbGUgKGNoKSB7XG4gICAgICAgIGlmIChjaCA9PT0gJy8nKSB7XG4gICAgICAgICAgY29tbWVudCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHdzLmluZGV4T2YoY2gpID49IDApIHtcbiAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIHdvcmQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgIC8vIHRydWUsIGZhbHNlLCBvciBudWxsLlxuXG4gICAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICAgIGNhc2UgJ3QnOlxuICAgICAgICAgIG5leHQoJ3QnKTtcbiAgICAgICAgICBuZXh0KCdyJyk7XG4gICAgICAgICAgbmV4dCgndScpO1xuICAgICAgICAgIG5leHQoJ2UnKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgY2FzZSAnZic6XG4gICAgICAgICAgbmV4dCgnZicpO1xuICAgICAgICAgIG5leHQoJ2EnKTtcbiAgICAgICAgICBuZXh0KCdsJyk7XG4gICAgICAgICAgbmV4dCgncycpO1xuICAgICAgICAgIG5leHQoJ2UnKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGNhc2UgJ24nOlxuICAgICAgICAgIG5leHQoJ24nKTtcbiAgICAgICAgICBuZXh0KCd1Jyk7XG4gICAgICAgICAgbmV4dCgnbCcpO1xuICAgICAgICAgIG5leHQoJ2wnKTtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgY2FzZSAnSSc6XG4gICAgICAgICAgbmV4dCgnSScpO1xuICAgICAgICAgIG5leHQoJ24nKTtcbiAgICAgICAgICBuZXh0KCdmJyk7XG4gICAgICAgICAgbmV4dCgnaScpO1xuICAgICAgICAgIG5leHQoJ24nKTtcbiAgICAgICAgICBuZXh0KCdpJyk7XG4gICAgICAgICAgbmV4dCgndCcpO1xuICAgICAgICAgIG5leHQoJ3knKTtcbiAgICAgICAgICByZXR1cm4gSW5maW5pdHk7XG4gICAgICAgIGNhc2UgJ04nOlxuICAgICAgICAgIG5leHQoJ04nKTtcbiAgICAgICAgICBuZXh0KCdhJyk7XG4gICAgICAgICAgbmV4dCgnTicpO1xuICAgICAgICAgIHJldHVybiBOYU47XG4gICAgICB9XG4gICAgICBlcnJvcihcIlVuZXhwZWN0ZWQgJ1wiICsgY2ggKyBcIidcIik7XG4gICAgfSxcblxuICAgIHZhbHVlLCAgLy8gUGxhY2UgaG9sZGVyIGZvciB0aGUgdmFsdWUgZnVuY3Rpb24uXG5cbiAgICBhcnJheSA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgLy8gUGFyc2UgYW4gYXJyYXkgdmFsdWUuXG5cbiAgICAgIHZhciBhcnJheSA9IFtdO1xuXG4gICAgICBpZiAoY2ggPT09ICdbJykge1xuICAgICAgICBuZXh0KCdbJyk7XG4gICAgICAgIHdoaXRlKCk7XG4gICAgICAgIHdoaWxlIChjaCkge1xuICAgICAgICAgIGlmIChjaCA9PT0gJ10nKSB7XG4gICAgICAgICAgICBuZXh0KCddJyk7XG4gICAgICAgICAgICByZXR1cm4gYXJyYXk7ICAgLy8gUG90ZW50aWFsbHkgZW1wdHkgYXJyYXlcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gRVM1IGFsbG93cyBvbWl0dGluZyBlbGVtZW50cyBpbiBhcnJheXMsIGUuZy4gWyxdIGFuZFxuICAgICAgICAgIC8vIFssbnVsbF0uIFdlIGRvbid0IGFsbG93IHRoaXMgaW4gSlNPTjUuXG4gICAgICAgICAgaWYgKGNoID09PSAnLCcpIHtcbiAgICAgICAgICAgIGVycm9yKFwiTWlzc2luZyBhcnJheSBlbGVtZW50XCIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcnJheS5wdXNoKHZhbHVlKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gY29tbWEgYWZ0ZXIgdGhpcyB2YWx1ZSwgdGhpcyBuZWVkcyB0b1xuICAgICAgICAgIC8vIGJlIHRoZSBlbmQgb2YgdGhlIGFycmF5LlxuICAgICAgICAgIGlmIChjaCAhPT0gJywnKSB7XG4gICAgICAgICAgICBuZXh0KCddJyk7XG4gICAgICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5leHQoJywnKTtcbiAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlcnJvcihcIkJhZCBhcnJheVwiKTtcbiAgICB9LFxuXG4gICAgb2JqZWN0ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBQYXJzZSBhbiBvYmplY3QgdmFsdWUuXG5cbiAgICAgIHZhciBrZXksXG4gICAgICAgIG9iamVjdCA9IHt9O1xuXG4gICAgICBpZiAoY2ggPT09ICd7Jykge1xuICAgICAgICBuZXh0KCd7Jyk7XG4gICAgICAgIHdoaXRlKCk7XG4gICAgICAgIHdoaWxlIChjaCkge1xuICAgICAgICAgIGlmIChjaCA9PT0gJ30nKSB7XG4gICAgICAgICAgICBuZXh0KCd9Jyk7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0OyAgIC8vIFBvdGVudGlhbGx5IGVtcHR5IG9iamVjdFxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEtleXMgY2FuIGJlIHVucXVvdGVkLiBJZiB0aGV5IGFyZSwgdGhleSBuZWVkIHRvIGJlXG4gICAgICAgICAgLy8gdmFsaWQgSlMgaWRlbnRpZmllcnMuXG4gICAgICAgICAgaWYgKGNoID09PSAnXCInIHx8IGNoID09PSBcIidcIikge1xuICAgICAgICAgICAga2V5ID0gc3RyaW5nKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGtleSA9IGlkZW50aWZpZXIoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgIG5leHQoJzonKTtcbiAgICAgICAgICBvYmplY3Rba2V5XSA9IHZhbHVlKCk7XG4gICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIGNvbW1hIGFmdGVyIHRoaXMgcGFpciwgdGhpcyBuZWVkcyB0byBiZVxuICAgICAgICAgIC8vIHRoZSBlbmQgb2YgdGhlIG9iamVjdC5cbiAgICAgICAgICBpZiAoY2ggIT09ICcsJykge1xuICAgICAgICAgICAgbmV4dCgnfScpO1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmV4dCgnLCcpO1xuICAgICAgICAgIHdoaXRlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVycm9yKFwiQmFkIG9iamVjdFwiKTtcbiAgICB9O1xuXG4gIHZhbHVlID0gZnVuY3Rpb24gKCkge1xuXG4gICAgLy8gUGFyc2UgYSBKU09OIHZhbHVlLiBJdCBjb3VsZCBiZSBhbiBvYmplY3QsIGFuIGFycmF5LCBhIHN0cmluZywgYSBudW1iZXIsXG4gICAgLy8gb3IgYSB3b3JkLlxuXG4gICAgd2hpdGUoKTtcbiAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICBjYXNlICd7JzpcbiAgICAgICAgcmV0dXJuIG9iamVjdCgpO1xuICAgICAgY2FzZSAnWyc6XG4gICAgICAgIHJldHVybiBhcnJheSgpO1xuICAgICAgY2FzZSAnXCInOlxuICAgICAgY2FzZSBcIidcIjpcbiAgICAgICAgcmV0dXJuIHN0cmluZygpO1xuICAgICAgY2FzZSAnLSc6XG4gICAgICBjYXNlICcrJzpcbiAgICAgIGNhc2UgJy4nOlxuICAgICAgICByZXR1cm4gbnVtYmVyKCk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gY2ggPj0gJzAnICYmIGNoIDw9ICc5JyA/IG51bWJlcigpIDogd29yZCgpO1xuICAgIH1cbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIGpzb25fcGFyc2UgZnVuY3Rpb24uIEl0IHdpbGwgaGF2ZSBhY2Nlc3MgdG8gYWxsIG9mIHRoZSBhYm92ZVxuICAvLyBmdW5jdGlvbnMgYW5kIHZhcmlhYmxlcy5cblxuICByZXR1cm4gZnVuY3Rpb24gKHNvdXJjZSwgcmV2aXZlcikge1xuICAgIHZhciByZXN1bHQ7XG5cbiAgICB0ZXh0ID0gU3RyaW5nKHNvdXJjZSk7XG4gICAgYXQgPSAwO1xuICAgIGNoID0gJyAnO1xuICAgIHJlc3VsdCA9IHZhbHVlKCk7XG4gICAgd2hpdGUoKTtcbiAgICBpZiAoY2gpIHtcbiAgICAgIGVycm9yKFwiU3ludGF4IGVycm9yXCIpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGlzIGEgcmV2aXZlciBmdW5jdGlvbiwgd2UgcmVjdXJzaXZlbHkgd2FsayB0aGUgbmV3IHN0cnVjdHVyZSxcbiAgICAvLyBwYXNzaW5nIGVhY2ggbmFtZS92YWx1ZSBwYWlyIHRvIHRoZSByZXZpdmVyIGZ1bmN0aW9uIGZvciBwb3NzaWJsZVxuICAgIC8vIHRyYW5zZm9ybWF0aW9uLCBzdGFydGluZyB3aXRoIGEgdGVtcG9yYXJ5IHJvb3Qgb2JqZWN0IHRoYXQgaG9sZHMgdGhlIHJlc3VsdFxuICAgIC8vIGluIGFuIGVtcHR5IGtleS4gSWYgdGhlcmUgaXMgbm90IGEgcmV2aXZlciBmdW5jdGlvbiwgd2Ugc2ltcGx5IHJldHVybiB0aGVcbiAgICAvLyByZXN1bHQuXG5cbiAgICByZXR1cm4gdHlwZW9mIHJldml2ZXIgPT09ICdmdW5jdGlvbicgPyAoZnVuY3Rpb24gd2Fsayhob2xkZXIsIGtleSkge1xuICAgICAgdmFyIGssIHYsIHZhbHVlID0gaG9sZGVyW2tleV07XG4gICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBmb3IgKGsgaW4gdmFsdWUpIHtcbiAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCBrKSkge1xuICAgICAgICAgICAgdiA9IHdhbGsodmFsdWUsIGspO1xuICAgICAgICAgICAgaWYgKHYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICB2YWx1ZVtrXSA9IHY7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBkZWxldGUgdmFsdWVba107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV2aXZlci5jYWxsKGhvbGRlciwga2V5LCB2YWx1ZSk7XG4gICAgfSh7ICcnOiByZXN1bHQgfSwgJycpKSA6IHJlc3VsdDtcbiAgfTtcbn0oKSk7XG5cbi8vIEpTT041IHN0cmluZ2lmeSB3aWxsIG5vdCBxdW90ZSBrZXlzIHdoZXJlIGFwcHJvcHJpYXRlXG5KU09ONS5zdHJpbmdpZnkgPSBmdW5jdGlvbiAob2JqLCByZXBsYWNlciwgc3BhY2UpIHtcbiAgaWYgKHJlcGxhY2VyICYmICh0eXBlb2YgKHJlcGxhY2VyKSAhPT0gXCJmdW5jdGlvblwiICYmICFpc0FycmF5KHJlcGxhY2VyKSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlcGxhY2VyIG11c3QgYmUgYSBmdW5jdGlvbiBvciBhbiBhcnJheScpO1xuICB9XG4gIHZhciBnZXRSZXBsYWNlZFZhbHVlT3JVbmRlZmluZWQgPSBmdW5jdGlvbiAoaG9sZGVyLCBrZXksIGlzVG9wTGV2ZWwpIHtcbiAgICB2YXIgdmFsdWUgPSBob2xkZXJba2V5XTtcblxuICAgIC8vIFJlcGxhY2UgdGhlIHZhbHVlIHdpdGggaXRzIHRvSlNPTiB2YWx1ZSBmaXJzdCwgaWYgcG9zc2libGVcbiAgICBpZiAodmFsdWUgJiYgdmFsdWUudG9KU09OICYmIHR5cGVvZiB2YWx1ZS50b0pTT04gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgdmFsdWUgPSB2YWx1ZS50b0pTT04oKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgdXNlci1zdXBwbGllZCByZXBsYWNlciBpZiBhIGZ1bmN0aW9uLCBjYWxsIGl0LiBJZiBpdCdzIGFuIGFycmF5LCBjaGVjayBvYmplY3RzJyBzdHJpbmcga2V5cyBmb3JcbiAgICAvLyBwcmVzZW5jZSBpbiB0aGUgYXJyYXkgKHJlbW92aW5nIHRoZSBrZXkvdmFsdWUgcGFpciBmcm9tIHRoZSByZXN1bHRpbmcgSlNPTiBpZiB0aGUga2V5IGlzIG1pc3NpbmcpLlxuICAgIGlmICh0eXBlb2YgKHJlcGxhY2VyKSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZXR1cm4gcmVwbGFjZXIuY2FsbChob2xkZXIsIGtleSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAocmVwbGFjZXIpIHtcbiAgICAgIGlmIChpc1RvcExldmVsIHx8IGlzQXJyYXkoaG9sZGVyKSB8fCByZXBsYWNlci5pbmRleE9mKGtleSkgPj0gMCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGlzV29yZENoYXIoY2hhcikge1xuICAgIHJldHVybiAoY2hhciA+PSAnYScgJiYgY2hhciA8PSAneicpIHx8XG4gICAgICAoY2hhciA+PSAnQScgJiYgY2hhciA8PSAnWicpIHx8XG4gICAgICAoY2hhciA+PSAnMCcgJiYgY2hhciA8PSAnOScpIHx8XG4gICAgICBjaGFyID09PSAnXycgfHwgY2hhciA9PT0gJyQnO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNXb3JkU3RhcnQoY2hhcikge1xuICAgIHJldHVybiAoY2hhciA+PSAnYScgJiYgY2hhciA8PSAneicpIHx8XG4gICAgICAoY2hhciA+PSAnQScgJiYgY2hhciA8PSAnWicpIHx8XG4gICAgICBjaGFyID09PSAnXycgfHwgY2hhciA9PT0gJyQnO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNXb3JkKGtleSkge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIWlzV29yZFN0YXJ0KGtleVswXSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGkgPSAxLCBsZW5ndGggPSBrZXkubGVuZ3RoO1xuICAgIHdoaWxlIChpIDwgbGVuZ3RoKSB7XG4gICAgICBpZiAoIWlzV29yZENoYXIoa2V5W2ldKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gZXhwb3J0IGZvciB1c2UgaW4gdGVzdHNcbiAgSlNPTjUuaXNXb3JkID0gaXNXb3JkO1xuXG4gIC8vIHBvbHlmaWxsc1xuICBmdW5jdGlvbiBpc0FycmF5KG9iaikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KSB7XG4gICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShvYmopO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaXNEYXRlKG9iaikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xuICB9XG5cbiAgLy8gaXNOYU4gPSBpc05hTiB8fCBmdW5jdGlvbiAodmFsKSB7XG4gIC8vICAgcmV0dXJuIHR5cGVvZiB2YWwgPT09ICdudW1iZXInICYmIHZhbCAhPT0gdmFsO1xuICAvLyB9O1xuXG4gIHZhciBvYmpTdGFjayA9IFtdO1xuICBmdW5jdGlvbiBjaGVja0ZvckNpcmN1bGFyKG9iaikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqU3RhY2subGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChvYmpTdGFja1tpXSA9PT0gb2JqKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDb252ZXJ0aW5nIGNpcmN1bGFyIHN0cnVjdHVyZSB0byBKU09OXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VJbmRlbnQoc3RyLCBudW0sIG5vTmV3TGluZT8pIHtcbiAgICBpZiAoIXN0cikge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIC8vIGluZGVudGF0aW9uIG5vIG1vcmUgdGhhbiAxMCBjaGFyc1xuICAgIGlmIChzdHIubGVuZ3RoID4gMTApIHtcbiAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgMTApO1xuICAgIH1cblxuICAgIHZhciBpbmRlbnQgPSBub05ld0xpbmUgPyBcIlwiIDogXCJcXG5cIjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgICBpbmRlbnQgKz0gc3RyO1xuICAgIH1cblxuICAgIHJldHVybiBpbmRlbnQ7XG4gIH1cblxuICB2YXIgaW5kZW50U3RyO1xuICBpZiAoc3BhY2UpIHtcbiAgICBpZiAodHlwZW9mIHNwYWNlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBpbmRlbnRTdHIgPSBzcGFjZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzcGFjZSA9PT0gXCJudW1iZXJcIiAmJiBzcGFjZSA+PSAwKSB7XG4gICAgICBpbmRlbnRTdHIgPSBtYWtlSW5kZW50KFwiIFwiLCBzcGFjZSwgdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGlnbm9yZSBzcGFjZSBwYXJhbWV0ZXJcbiAgICB9XG4gIH1cblxuICAvLyBDb3BpZWQgZnJvbSBDcm9rZm9yZCdzIGltcGxlbWVudGF0aW9uIG9mIEpTT05cbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9kb3VnbGFzY3JvY2tmb3JkL0pTT04tanMvYmxvYi9lMzlkYjRiN2U2MjQ5ZjA0YTE5NWU3ZGQwODQwZTYxMGNjOWU5NDFlL2pzb24yLmpzI0wxOTVcbiAgLy8gQmVnaW5cbiAgdmFyIGN4ID0gL1tcXHUwMDAwXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csXG4gICAgZXNjYXBhYmxlID0gL1tcXFxcXFxcIlxceDAwLVxceDFmXFx4N2YtXFx4OWZcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZyxcbiAgICBtZXRhID0geyAvLyB0YWJsZSBvZiBjaGFyYWN0ZXIgc3Vic3RpdHV0aW9uc1xuICAgICAgJ1xcYic6ICdcXFxcYicsXG4gICAgICAnXFx0JzogJ1xcXFx0JyxcbiAgICAgICdcXG4nOiAnXFxcXG4nLFxuICAgICAgJ1xcZic6ICdcXFxcZicsXG4gICAgICAnXFxyJzogJ1xcXFxyJyxcbiAgICAgICdcIic6ICdcXFxcXCInLFxuICAgICAgJ1xcXFwnOiAnXFxcXFxcXFwnXG4gICAgfTtcbiAgZnVuY3Rpb24gZXNjYXBlU3RyaW5nKHN0cmluZykge1xuXG4gICAgLy8gSWYgdGhlIHN0cmluZyBjb250YWlucyBubyBjb250cm9sIGNoYXJhY3RlcnMsIG5vIHF1b3RlIGNoYXJhY3RlcnMsIGFuZCBub1xuICAgIC8vIGJhY2tzbGFzaCBjaGFyYWN0ZXJzLCB0aGVuIHdlIGNhbiBzYWZlbHkgc2xhcCBzb21lIHF1b3RlcyBhcm91bmQgaXQuXG4gICAgLy8gT3RoZXJ3aXNlIHdlIG11c3QgYWxzbyByZXBsYWNlIHRoZSBvZmZlbmRpbmcgY2hhcmFjdGVycyB3aXRoIHNhZmUgZXNjYXBlXG4gICAgLy8gc2VxdWVuY2VzLlxuICAgIGVzY2FwYWJsZS5sYXN0SW5kZXggPSAwO1xuICAgIHJldHVybiBlc2NhcGFibGUudGVzdChzdHJpbmcpID8gJ1wiJyArIHN0cmluZy5yZXBsYWNlKGVzY2FwYWJsZSwgZnVuY3Rpb24gKGEpIHtcbiAgICAgIHZhciBjID0gbWV0YVthXTtcbiAgICAgIHJldHVybiB0eXBlb2YgYyA9PT0gJ3N0cmluZycgP1xuICAgICAgICBjIDpcbiAgICAgICAgJ1xcXFx1JyArICgnMDAwMCcgKyBhLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCk7XG4gICAgfSkgKyAnXCInIDogJ1wiJyArIHN0cmluZyArICdcIic7XG4gIH1cbiAgLy8gRW5kXG5cbiAgZnVuY3Rpb24gaW50ZXJuYWxTdHJpbmdpZnkoaG9sZGVyLCBrZXksIGlzVG9wTGV2ZWwpIHtcbiAgICB2YXIgYnVmZmVyLCByZXM7XG5cbiAgICAvLyBSZXBsYWNlIHRoZSB2YWx1ZSwgaWYgbmVjZXNzYXJ5XG4gICAgdmFyIG9ial9wYXJ0ID0gZ2V0UmVwbGFjZWRWYWx1ZU9yVW5kZWZpbmVkKGhvbGRlciwga2V5LCBpc1RvcExldmVsKTtcblxuICAgIGlmIChvYmpfcGFydCAmJiAhaXNEYXRlKG9ial9wYXJ0KSkge1xuICAgICAgLy8gdW5ib3ggb2JqZWN0c1xuICAgICAgLy8gZG9uJ3QgdW5ib3ggZGF0ZXMsIHNpbmNlIHdpbGwgdHVybiBpdCBpbnRvIG51bWJlclxuICAgICAgb2JqX3BhcnQgPSBvYmpfcGFydC52YWx1ZU9mKCk7XG4gICAgfVxuICAgIHN3aXRjaCAodHlwZW9mIG9ial9wYXJ0KSB7XG4gICAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgICByZXR1cm4gb2JqX3BhcnQudG9TdHJpbmcoKTtcblxuICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICBpZiAoaXNOYU4ob2JqX3BhcnQpIHx8ICFpc0Zpbml0ZShvYmpfcGFydCkpIHtcbiAgICAgICAgICByZXR1cm4gXCJudWxsXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9ial9wYXJ0LnRvU3RyaW5nKCk7XG5cbiAgICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgcmV0dXJuIGVzY2FwZVN0cmluZyhvYmpfcGFydC50b1N0cmluZygpKTtcblxuICAgICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgICBpZiAob2JqX3BhcnQgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gXCJudWxsXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShvYmpfcGFydCkpIHtcbiAgICAgICAgICBjaGVja0ZvckNpcmN1bGFyKG9ial9wYXJ0KTtcbiAgICAgICAgICBidWZmZXIgPSBcIltcIjtcbiAgICAgICAgICBvYmpTdGFjay5wdXNoKG9ial9wYXJ0KTtcblxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqX3BhcnQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJlcyA9IGludGVybmFsU3RyaW5naWZ5KG9ial9wYXJ0LCBpLCBmYWxzZSk7XG4gICAgICAgICAgICBidWZmZXIgKz0gbWFrZUluZGVudChpbmRlbnRTdHIsIG9ialN0YWNrLmxlbmd0aCk7XG4gICAgICAgICAgICBpZiAocmVzID09PSBudWxsIHx8IHR5cGVvZiByZXMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgYnVmZmVyICs9IFwibnVsbFwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYnVmZmVyICs9IHJlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpIDwgb2JqX3BhcnQubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICBidWZmZXIgKz0gXCIsXCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGluZGVudFN0cikge1xuICAgICAgICAgICAgICBidWZmZXIgKz0gXCJcXG5cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgb2JqU3RhY2sucG9wKCk7XG4gICAgICAgICAgYnVmZmVyICs9IG1ha2VJbmRlbnQoaW5kZW50U3RyLCBvYmpTdGFjay5sZW5ndGgsIHRydWUpICsgXCJdXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2hlY2tGb3JDaXJjdWxhcihvYmpfcGFydCk7XG4gICAgICAgICAgYnVmZmVyID0gXCJ7XCI7XG4gICAgICAgICAgdmFyIG5vbkVtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgb2JqU3RhY2sucHVzaChvYmpfcGFydCk7XG4gICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmpfcGFydCkge1xuICAgICAgICAgICAgaWYgKG9ial9wYXJ0Lmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGludGVybmFsU3RyaW5naWZ5KG9ial9wYXJ0LCBwcm9wLCBmYWxzZSk7XG4gICAgICAgICAgICAgIGlzVG9wTGV2ZWwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGJ1ZmZlciArPSBtYWtlSW5kZW50KGluZGVudFN0ciwgb2JqU3RhY2subGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBub25FbXB0eSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdmFyIGtleTogYW55ID0gaXNXb3JkKHByb3ApID8gcHJvcCA6IGVzY2FwZVN0cmluZyhwcm9wKTtcbiAgICAgICAgICAgICAgICBidWZmZXIgKz0ga2V5ICsgXCI6XCIgKyAoaW5kZW50U3RyID8gJyAnIDogJycpICsgdmFsdWUgKyBcIixcIjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBvYmpTdGFjay5wb3AoKTtcbiAgICAgICAgICBpZiAobm9uRW1wdHkpIHtcbiAgICAgICAgICAgIGJ1ZmZlciA9IGJ1ZmZlci5zdWJzdHJpbmcoMCwgYnVmZmVyLmxlbmd0aCAtIDEpICsgbWFrZUluZGVudChpbmRlbnRTdHIsIG9ialN0YWNrLmxlbmd0aCkgKyBcIn1cIjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnVmZmVyID0gJ3t9JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIGZ1bmN0aW9ucyBhbmQgdW5kZWZpbmVkIHNob3VsZCBiZSBpZ25vcmVkXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgLy8gc3BlY2lhbCBjYXNlLi4ud2hlbiB1bmRlZmluZWQgaXMgdXNlZCBpbnNpZGUgb2ZcbiAgLy8gYSBjb21wb3VuZCBvYmplY3QvYXJyYXksIHJldHVybiBudWxsLlxuICAvLyBidXQgd2hlbiB0b3AtbGV2ZWwsIHJldHVybiB1bmRlZmluZWRcbiAgdmFyIHRvcExldmVsSG9sZGVyID0geyBcIlwiOiBvYmogfTtcbiAgaWYgKG9iaiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGdldFJlcGxhY2VkVmFsdWVPclVuZGVmaW5lZCh0b3BMZXZlbEhvbGRlciwgJycsIHRydWUpO1xuICB9XG4gIHJldHVybiBpbnRlcm5hbFN0cmluZ2lmeSh0b3BMZXZlbEhvbGRlciwgJycsIHRydWUpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgSlNPTjVcbiJdfQ==