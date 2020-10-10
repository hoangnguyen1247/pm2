"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = exports.parseTasks = exports.parseOut = exports.isComplete = exports.complete = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
//  hacked from node-tabtab 0.0.4 https://github.com/mklabs/node-tabtab.git
//  Itself based on npm completion by @isaac
var complete = function complete(name, completer, cb) {
  // cb not there, assume callback is completer and
  // the completer is the executable itself
  if (!cb) {
    cb = completer;
    completer = name;
  }

  var env = parseEnv(); // if not a complete command, return here.

  if (!env.complete) return cb(); // if install cmd, add complete script to either ~/.bashrc or ~/.zshrc

  if (env.install) return install(name, completer, function (err, state) {
    console.log(state || err.message);
    if (err) return cb(err);
    cb(null, null, state);
  }); // if install cmd, add complete script to either ~/.bashrc or ~/.zshrc

  if (env.uninstall) return uninstall(name, completer, function (err, state) {
    console.log(state || err.message);
    if (err) return cb(err);
    cb(null, null, state);
  }); // if the COMP_* are not in the env, then dump the install script.

  if (!env.words || !env.point || !env.line) return script(name, completer, function (err, content) {
    if (err) return cb(err);
    process.stdout.write(content, function (n) {
      cb(null, null, content);
    });
    process.stdout.on("error", function (er) {
      // Darwin is a real dick sometimes.
      //
      // This is necessary because the "source" or "." program in
      // bash on OS X closes its file argument before reading
      // from it, meaning that you get exactly 1 write, which will
      // work most of the time, and will always raise an EPIPE.
      //
      // Really, one should not be tossing away EPIPE errors, or any
      // errors, so casually.  But, without this, `. <(npm completion)`
      // can never ever work on OS X.
      //      -- isaacs
      // https://github.com/isaacs/npm/blob/master/lib/completion.js#L162
      if (er.errno === "EPIPE") er = null;
      cb(er, null, content);
    });
    cb(null, null, content);
  });
  var partial = env.line.substr(0, env.point),
      last = env.line.split(' ').slice(-1).join(''),
      lastPartial = partial.split(' ').slice(-1).join(''),
      prev = env.line.split(' ').slice(0, -1).slice(-1)[0];
  cb(null, {
    line: env.line,
    words: env.words,
    point: env.point,
    partial: partial,
    last: last,
    prev: prev,
    lastPartial: lastPartial
  });
}; // simple helper function to know if the script is run
// in the context of a completion command. Also mapping the
// special `<pkgname> completion` cmd.


exports.complete = complete;

var isComplete = function isComplete() {
  var env = parseEnv();
  return env.complete || env.words && env.point && env.line;
};

exports.isComplete = isComplete;

var parseOut = function parseOut(str) {
  var shorts = str.match(/\s-\w+/g);
  var longs = str.match(/\s--\w+/g);
  return {
    shorts: shorts.map(trim).map(cleanPrefix),
    longs: longs.map(trim).map(cleanPrefix)
  };
}; // specific to cake case


exports.parseOut = parseOut;

var parseTasks = function parseTasks(str, prefix, reg) {
  var tasks = str.match(reg || new RegExp('^' + prefix + '\\s[^#]+', 'gm')) || [];
  return tasks.map(trim).map(function (s) {
    return s.replace(prefix + ' ', '');
  });
};

exports.parseTasks = parseTasks;

var log = function log(arr, o, prefix) {
  prefix = prefix || '';
  arr = Array.isArray(arr) ? arr : [arr];
  arr.filter(abbrev(o)).forEach(function (v) {
    console.log(prefix + v);
  });
};

exports.log = log;

function trim(s) {
  return s.trim();
}

function cleanPrefix(s) {
  return s.replace(/-/g, '');
}

function abbrev(o) {
  return function (it) {
    return new RegExp('^' + o.last.replace(/^--?/g, '')).test(it);
  };
} // output the completion.sh script to the console for install instructions.
// This is actually a 'template' where the package name is used to setup
// the completion on the right command, and properly name the bash/zsh functions.


function script(name, completer, cb) {
  var p = _path["default"].join(__dirname, 'completion.sh');

  _fs["default"].readFile(p, 'utf8', function (er, d) {
    if (er) return cb(er);
    cb(null, d);
  });
}

function install(name, completer, cb) {
  var markerIn = '###-begin-' + name + '-completion-###',
      markerOut = '###-end-' + name + '-completion-###';
  var rc, scriptOutput;
  readRc(completer, function (err, file) {
    if (err) return cb(err);
    var part = file.split(markerIn)[1];

    if (part) {
      return cb(null, ' ✗ ' + completer + ' tab-completion has been already installed. Do nothing.');
    }

    rc = file;
    next();
  });
  script(name, completer, function (err, file) {
    scriptOutput = file;
    next();
  });

  function next() {
    if (!rc || !scriptOutput) return;
    writeRc(rc + scriptOutput, function (err) {
      if (err) return cb(err);
      return cb(null, ' ✓ ' + completer + ' tab-completion installed.');
    });
  }
}

function uninstall(name, completer, cb) {
  var markerIn = '\n\n###-begin-' + name + '-completion-###',
      markerOut = '###-end-' + name + '-completion-###\n';
  readRc(completer, function (err, file) {
    if (err) return cb(err);
    var part = file.split(markerIn)[1];

    if (!part) {
      return cb(null, ' ✗ ' + completer + ' tab-completion has been already uninstalled. Do nothing.');
    }

    part = markerIn + part.split(markerOut)[0] + markerOut;
    writeRc(file.replace(part, ''), function (err) {
      if (err) return cb(err);
      return cb(null, ' ✓ ' + completer + ' tab-completion uninstalled.');
    });
  });
}

function readRc(completer, cb) {
  var file = '.' + process.env.SHELL.match(/\/bin\/(\w+)/)[1] + 'rc',
      filepath = _path["default"].join(process.env.HOME, file);

  _fs["default"].lstat(filepath, function (err, stats) {
    if (err) return cb(new Error("No " + file + " file. You'll have to run instead: " + completer + " completion >> ~/" + file));

    _fs["default"].readFile(filepath, 'utf8', cb);
  });
}

function writeRc(content, cb) {
  var file = '.' + process.env.SHELL.match(/\/bin\/(\w+)/)[1] + 'rc',
      filepath = _path["default"].join(process.env.HOME, file);

  _fs["default"].lstat(filepath, function (err, stats) {
    if (err) return cb(new Error("No " + file + " file. You'll have to run instead: " + content + " completion >> ~/" + file));

    _fs["default"].writeFile(filepath, content, cb);
  });
}

function installed(marker, completer, cb) {
  readRc(completer, function (err, file) {
    if (err) return cb(err);
    var installed = file.match(marker);
    return cb(!!installed);
  });
}

function parseEnv() {
  var args = process.argv.slice(2),
      complete = args[0] === 'completion';
  return {
    args: args,
    complete: complete,
    install: complete && args[1] === 'install',
    uninstall: complete && args[1] === 'uninstall',
    words: +process.env.COMP_CWORD,
    point: +process.env.COMP_POINT,
    line: process.env.COMP_LINE
  };
}

;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21wbGV0aW9uLnRzIl0sIm5hbWVzIjpbImNvbXBsZXRlIiwibmFtZSIsImNvbXBsZXRlciIsImNiIiwiZW52IiwicGFyc2VFbnYiLCJpbnN0YWxsIiwiZXJyIiwic3RhdGUiLCJjb25zb2xlIiwibG9nIiwibWVzc2FnZSIsInVuaW5zdGFsbCIsIndvcmRzIiwicG9pbnQiLCJsaW5lIiwic2NyaXB0IiwiY29udGVudCIsInByb2Nlc3MiLCJzdGRvdXQiLCJ3cml0ZSIsIm4iLCJvbiIsImVyIiwiZXJybm8iLCJwYXJ0aWFsIiwic3Vic3RyIiwibGFzdCIsInNwbGl0Iiwic2xpY2UiLCJqb2luIiwibGFzdFBhcnRpYWwiLCJwcmV2IiwiaXNDb21wbGV0ZSIsInBhcnNlT3V0Iiwic3RyIiwic2hvcnRzIiwibWF0Y2giLCJsb25ncyIsIm1hcCIsInRyaW0iLCJjbGVhblByZWZpeCIsInBhcnNlVGFza3MiLCJwcmVmaXgiLCJyZWciLCJ0YXNrcyIsIlJlZ0V4cCIsInMiLCJyZXBsYWNlIiwiYXJyIiwibyIsIkFycmF5IiwiaXNBcnJheSIsImZpbHRlciIsImFiYnJldiIsImZvckVhY2giLCJ2IiwiaXQiLCJ0ZXN0IiwicCIsInB0aCIsIl9fZGlybmFtZSIsImZzIiwicmVhZEZpbGUiLCJkIiwibWFya2VySW4iLCJtYXJrZXJPdXQiLCJyYyIsInNjcmlwdE91dHB1dCIsInJlYWRSYyIsImZpbGUiLCJwYXJ0IiwibmV4dCIsIndyaXRlUmMiLCJTSEVMTCIsImZpbGVwYXRoIiwiSE9NRSIsImxzdGF0Iiwic3RhdHMiLCJFcnJvciIsIndyaXRlRmlsZSIsImluc3RhbGxlZCIsIm1hcmtlciIsImFyZ3MiLCJhcmd2IiwiQ09NUF9DV09SRCIsIkNPTVBfUE9JTlQiLCJDT01QX0xJTkUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUtBOztBQUNBOztBQU5BOzs7OztBQVFBO0FBQ0E7QUFFTyxJQUFNQSxRQUFRLEdBQUcsU0FBU0EsUUFBVCxDQUFrQkMsSUFB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SUFBSSxDQUFDakMsS0FBTCxDQUFXNkMsTUFBWCxDQUFoQjtBQUNBLFdBQU8vRSxFQUFFLENBQUMsQ0FBQyxDQUFDOEUsU0FBSCxDQUFUO0FBQ0QsR0FKSyxDQUFOO0FBS0Q7O0FBRUQsU0FBUzVFLFFBQVQsR0FBb0I7QUFDbEIsTUFBSThFLElBQUksR0FBR2pFLE9BQU8sQ0FBQ2tFLElBQVIsQ0FBYXZELEtBQWIsQ0FBbUIsQ0FBbkIsQ0FBWDtBQUFBLE1BQ0E3QixRQUFRLEdBQUdtRixJQUFJLENBQUMsQ0FBRCxDQUFKLEtBQVksWUFEdkI7QUFHQSxTQUFPO0FBQ0xBLElBQUFBLElBQUksRUFBRUEsSUFERDtBQUVMbkYsSUFBQUEsUUFBUSxFQUFFQSxRQUZMO0FBR0xNLElBQUFBLE9BQU8sRUFBRU4sUUFBUSxJQUFJbUYsSUFBSSxDQUFDLENBQUQsQ0FBSixLQUFZLFNBSDVCO0FBSUx2RSxJQUFBQSxTQUFTLEVBQUVaLFFBQVEsSUFBSW1GLElBQUksQ0FBQyxDQUFELENBQUosS0FBWSxXQUo5QjtBQUtMdEUsSUFBQUEsS0FBSyxFQUFFLENBQUNLLE9BQU8sQ0FBQ2QsR0FBUixDQUFZaUYsVUFMZjtBQU1MdkUsSUFBQUEsS0FBSyxFQUFFLENBQUNJLE9BQU8sQ0FBQ2QsR0FBUixDQUFZa0YsVUFOZjtBQU9MdkUsSUFBQUEsSUFBSSxFQUFFRyxPQUFPLENBQUNkLEdBQVIsQ0FBWW1GO0FBUGIsR0FBUDtBQVNEOztBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgbGljZW5zZSB0aGF0XG4gKiBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cbiAqL1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwdGggZnJvbSAncGF0aCc7XG5cbi8vICBoYWNrZWQgZnJvbSBub2RlLXRhYnRhYiAwLjAuNCBodHRwczovL2dpdGh1Yi5jb20vbWtsYWJzL25vZGUtdGFidGFiLmdpdFxuLy8gIEl0c2VsZiBiYXNlZCBvbiBucG0gY29tcGxldGlvbiBieSBAaXNhYWNcblxuZXhwb3J0IGNvbnN0IGNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGUobmFtZSwgY29tcGxldGVyPywgY2I/KSB7XG5cbiAgLy8gY2Igbm90IHRoZXJlLCBhc3N1bWUgY2FsbGJhY2sgaXMgY29tcGxldGVyIGFuZFxuICAvLyB0aGUgY29tcGxldGVyIGlzIHRoZSBleGVjdXRhYmxlIGl0c2VsZlxuICBpZighY2IpIHtcbiAgICBjYiA9IGNvbXBsZXRlcjtcbiAgICBjb21wbGV0ZXIgPSBuYW1lO1xuICB9XG5cbiAgdmFyIGVudiA9IHBhcnNlRW52KCk7XG5cbiAgLy8gaWYgbm90IGEgY29tcGxldGUgY29tbWFuZCwgcmV0dXJuIGhlcmUuXG4gIGlmKCFlbnYuY29tcGxldGUpIHJldHVybiBjYigpO1xuXG4gIC8vIGlmIGluc3RhbGwgY21kLCBhZGQgY29tcGxldGUgc2NyaXB0IHRvIGVpdGhlciB+Ly5iYXNocmMgb3Igfi8uenNocmNcbiAgaWYoZW52Lmluc3RhbGwpIHJldHVybiBpbnN0YWxsKG5hbWUsIGNvbXBsZXRlciwgZnVuY3Rpb24oZXJyLCBzdGF0ZSnCoHtcbiAgICBjb25zb2xlLmxvZyhzdGF0ZSB8fCBlcnIubWVzc2FnZSk7XG4gICAgaWYoZXJyKSByZXR1cm4gY2IoZXJyKTtcbiAgICBjYihudWxsLCBudWxsLCBzdGF0ZSk7XG4gIH0pO1xuXG4gIC8vIGlmIGluc3RhbGwgY21kLCBhZGQgY29tcGxldGUgc2NyaXB0IHRvIGVpdGhlciB+Ly5iYXNocmMgb3Igfi8uenNocmNcbiAgaWYoZW52LnVuaW5zdGFsbCkgcmV0dXJuIHVuaW5zdGFsbChuYW1lLCBjb21wbGV0ZXIsIGZ1bmN0aW9uKGVyciwgc3RhdGUpIHtcbiAgICBjb25zb2xlLmxvZyhzdGF0ZSB8fCBlcnIubWVzc2FnZSk7XG4gICAgaWYoZXJyKSByZXR1cm4gY2IoZXJyKTtcbiAgICBjYihudWxsLCBudWxsLCBzdGF0ZSk7XG4gIH0pO1xuXG4gIC8vIGlmIHRoZSBDT01QXyogYXJlIG5vdCBpbiB0aGUgZW52LCB0aGVuIGR1bXAgdGhlIGluc3RhbGwgc2NyaXB0LlxuICBpZighZW52LndvcmRzIHx8ICFlbnYucG9pbnQgfHwgIWVudi5saW5lKSByZXR1cm4gc2NyaXB0KG5hbWUsIGNvbXBsZXRlciwgZnVuY3Rpb24oZXJyLCBjb250ZW50KSB7XG4gICAgaWYoZXJyKSByZXR1cm4gY2IoZXJyKTtcbiAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShjb250ZW50LCBmdW5jdGlvbiAobikgeyBjYihudWxsLCBudWxsLCBjb250ZW50KTsgfSk7XG4gICAgcHJvY2Vzcy5zdGRvdXQub24oXCJlcnJvclwiLCBmdW5jdGlvbiAoZXIpIHtcbiAgICAgIC8vIERhcndpbiBpcyBhIHJlYWwgZGljayBzb21ldGltZXMuXG4gICAgICAvL1xuICAgICAgLy8gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSB0aGUgXCJzb3VyY2VcIiBvciBcIi5cIiBwcm9ncmFtIGluXG4gICAgICAvLyBiYXNoIG9uIE9TIFggY2xvc2VzIGl0cyBmaWxlIGFyZ3VtZW50IGJlZm9yZSByZWFkaW5nXG4gICAgICAvLyBmcm9tIGl0LCBtZWFuaW5nIHRoYXQgeW91IGdldCBleGFjdGx5IDEgd3JpdGUsIHdoaWNoIHdpbGxcbiAgICAgIC8vIHdvcmsgbW9zdCBvZiB0aGUgdGltZSwgYW5kIHdpbGwgYWx3YXlzIHJhaXNlIGFuIEVQSVBFLlxuICAgICAgLy9cbiAgICAgIC8vIFJlYWxseSwgb25lIHNob3VsZCBub3QgYmUgdG9zc2luZyBhd2F5IEVQSVBFIGVycm9ycywgb3IgYW55XG4gICAgICAvLyBlcnJvcnMsIHNvIGNhc3VhbGx5LiAgQnV0LCB3aXRob3V0IHRoaXMsIGAuIDwobnBtIGNvbXBsZXRpb24pYFxuICAgICAgLy8gY2FuIG5ldmVyIGV2ZXIgd29yayBvbiBPUyBYLlxuICAgICAgLy8gICAgICAtLSBpc2FhY3NcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9pc2FhY3MvbnBtL2Jsb2IvbWFzdGVyL2xpYi9jb21wbGV0aW9uLmpzI0wxNjJcbiAgICAgIGlmIChlci5lcnJubyA9PT0gXCJFUElQRVwiKSBlciA9IG51bGxcbiAgICAgIGNiKGVyLCBudWxsLCBjb250ZW50KTtcbiAgICB9KTtcbiAgICBjYihudWxsLCBudWxsLCBjb250ZW50KTtcbiAgfSk7XG5cbiAgdmFyIHBhcnRpYWwgPSBlbnYubGluZS5zdWJzdHIoMCwgZW52LnBvaW50KSxcbiAgbGFzdCA9IGVudi5saW5lLnNwbGl0KCcgJykuc2xpY2UoLTEpLmpvaW4oJycpLFxuICBsYXN0UGFydGlhbCA9IHBhcnRpYWwuc3BsaXQoJyAnKS5zbGljZSgtMSkuam9pbignJyksXG4gIHByZXYgPSBlbnYubGluZS5zcGxpdCgnICcpLnNsaWNlKDAsIC0xKS5zbGljZSgtMSlbMF07XG5cbiAgY2IobnVsbCwge1xuICAgIGxpbmU6IGVudi5saW5lLFxuICAgIHdvcmRzOiBlbnYud29yZHMsXG4gICAgcG9pbnQ6IGVudi5wb2ludCxcbiAgICBwYXJ0aWFsOiBwYXJ0aWFsLFxuICAgIGxhc3Q6IGxhc3QsXG4gICAgcHJldjogcHJldixcbiAgICBsYXN0UGFydGlhbDogbGFzdFBhcnRpYWxcbiAgfSk7XG59O1xuXG4vLyBzaW1wbGUgaGVscGVyIGZ1bmN0aW9uIHRvIGtub3cgaWYgdGhlIHNjcmlwdCBpcyBydW5cbi8vIGluIHRoZSBjb250ZXh0IG9mIGEgY29tcGxldGlvbiBjb21tYW5kLiBBbHNvIG1hcHBpbmcgdGhlXG4vLyBzcGVjaWFsIGA8cGtnbmFtZT4gY29tcGxldGlvbmAgY21kLlxuZXhwb3J0IGNvbnN0IGlzQ29tcGxldGUgPSBmdW5jdGlvbiBpc0NvbXBsZXRlKCkge1xuICB2YXIgZW52ID0gcGFyc2VFbnYoKTtcbiAgcmV0dXJuIGVudi5jb21wbGV0ZSB8fCAoZW52LndvcmRzICYmIGVudi5wb2ludCAmJiBlbnYubGluZSk7XG59O1xuXG5leHBvcnQgY29uc3QgcGFyc2VPdXQgPSBmdW5jdGlvbiBwYXJzZU91dChzdHIpIHtcbiAgdmFyIHNob3J0cyA9IHN0ci5tYXRjaCgvXFxzLVxcdysvZyk7XG4gIHZhciBsb25ncyA9IHN0ci5tYXRjaCgvXFxzLS1cXHcrL2cpO1xuXG4gIHJldHVybiB7XG4gICAgc2hvcnRzOiBzaG9ydHMubWFwKHRyaW0pLm1hcChjbGVhblByZWZpeCksXG4gICAgbG9uZ3M6IGxvbmdzLm1hcCh0cmltKS5tYXAoY2xlYW5QcmVmaXgpXG4gIH07XG59O1xuXG4vLyBzcGVjaWZpYyB0byBjYWtlIGNhc2VcbmV4cG9ydCBjb25zdCBwYXJzZVRhc2tzID0gZnVuY3Rpb24oc3RyLCBwcmVmaXgsIHJlZykge1xuICB2YXIgdGFza3MgPSBzdHIubWF0Y2gocmVnIHx8IG5ldyBSZWdFeHAoJ14nICsgcHJlZml4ICsgJ1xcXFxzW14jXSsnLCAnZ20nKSkgfHwgW107XG4gIHJldHVybiB0YXNrcy5tYXAodHJpbSkubWFwKGZ1bmN0aW9uKHMpIHtcbiAgICByZXR1cm4gcy5yZXBsYWNlKHByZWZpeCArICcgJywgJycpO1xuICB9KTtcbn07XG5cbmV4cG9ydCBjb25zdCBsb2cgPSBmdW5jdGlvbiBsb2coYXJyLCBvLCBwcmVmaXg/KSB7XG4gIHByZWZpeCA9IHByZWZpeCB8fCAnJztcbiAgYXJyID0gQXJyYXkuaXNBcnJheShhcnIpID8gYXJyIDogW2Fycl07XG4gIGFyci5maWx0ZXIoYWJicmV2KG8pKS5mb3JFYWNoKGZ1bmN0aW9uKHYpIHtcbiAgICBjb25zb2xlLmxvZyhwcmVmaXggKyB2KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRyaW0gKHMpIHtcbiAgcmV0dXJuIHMudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBjbGVhblByZWZpeChzKSB7XG4gIHJldHVybiBzLnJlcGxhY2UoLy0vZywgJycpO1xufVxuXG5mdW5jdGlvbiBhYmJyZXYobykgeyByZXR1cm4gZnVuY3Rpb24oaXQpIHtcbiAgcmV0dXJuIG5ldyBSZWdFeHAoJ14nICsgby5sYXN0LnJlcGxhY2UoL14tLT8vZywgJycpKS50ZXN0KGl0KTtcbn19XG5cbi8vIG91dHB1dCB0aGUgY29tcGxldGlvbi5zaCBzY3JpcHQgdG8gdGhlIGNvbnNvbGUgZm9yIGluc3RhbGwgaW5zdHJ1Y3Rpb25zLlxuLy8gVGhpcyBpcyBhY3R1YWxseSBhICd0ZW1wbGF0ZScgd2hlcmUgdGhlIHBhY2thZ2UgbmFtZSBpcyB1c2VkIHRvIHNldHVwXG4vLyB0aGUgY29tcGxldGlvbiBvbiB0aGUgcmlnaHQgY29tbWFuZCwgYW5kIHByb3Blcmx5IG5hbWUgdGhlIGJhc2gvenNoIGZ1bmN0aW9ucy5cbmZ1bmN0aW9uIHNjcmlwdChuYW1lLCBjb21wbGV0ZXIsIGNiKSB7XG4gIHZhciBwID0gcHRoLmpvaW4oX19kaXJuYW1lLCAnY29tcGxldGlvbi5zaCcpO1xuXG4gIGZzLnJlYWRGaWxlKHAsICd1dGY4JywgZnVuY3Rpb24gKGVyLCBkKSB7XG4gICAgaWYgKGVyKSByZXR1cm4gY2IoZXIpO1xuICAgIGNiKG51bGwsIGQpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5zdGFsbChuYW1lLCBjb21wbGV0ZXIsIGNiKSB7XG4gIHZhciBtYXJrZXJJbiA9ICcjIyMtYmVnaW4tJyArIG5hbWUgKyAnLWNvbXBsZXRpb24tIyMjJyxcbiAgICBtYXJrZXJPdXQgPSAnIyMjLWVuZC0nICsgbmFtZSArICctY29tcGxldGlvbi0jIyMnO1xuXG4gIHZhciByYywgc2NyaXB0T3V0cHV0O1xuXG4gIHJlYWRSYyhjb21wbGV0ZXIsIGZ1bmN0aW9uKGVyciwgZmlsZSkge1xuICAgIGlmKGVycikgcmV0dXJuIGNiKGVycik7XG5cbiAgICB2YXIgcGFydCA9IGZpbGUuc3BsaXQobWFya2VySW4pWzFdO1xuICAgIGlmKHBhcnQpIHtcbiAgICAgIHJldHVybiBjYihudWxsLCAnIOKclyAnICsgY29tcGxldGVyICsgJyB0YWItY29tcGxldGlvbiBoYXMgYmVlbiBhbHJlYWR5IGluc3RhbGxlZC4gRG8gbm90aGluZy4nKTtcbiAgICB9XG5cbiAgICByYyA9IGZpbGU7XG4gICAgbmV4dCgpO1xuICB9KTtcblxuICBzY3JpcHQobmFtZSwgY29tcGxldGVyLCBmdW5jdGlvbihlcnIsIGZpbGUpIHtcbiAgICBzY3JpcHRPdXRwdXQgPSBmaWxlO1xuICAgIG5leHQoKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICBpZighcmMgfHwgIXNjcmlwdE91dHB1dCkgcmV0dXJuO1xuXG4gICAgd3JpdGVSYyhyYyArIHNjcmlwdE91dHB1dCwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICBpZihlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgcmV0dXJuIGNiKG51bGwsICcg4pyTICcgKyBjb21wbGV0ZXIgKyAnIHRhYi1jb21wbGV0aW9uIGluc3RhbGxlZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1bmluc3RhbGwobmFtZSwgY29tcGxldGVyLCBjYikge1xuICB2YXIgbWFya2VySW4gPSAnXFxuXFxuIyMjLWJlZ2luLScgKyBuYW1lICsgJy1jb21wbGV0aW9uLSMjIycsXG4gICAgbWFya2VyT3V0ID0gJyMjIy1lbmQtJyArIG5hbWUgKyAnLWNvbXBsZXRpb24tIyMjXFxuJztcblxuICByZWFkUmMoY29tcGxldGVyLCBmdW5jdGlvbihlcnIsIGZpbGUpIHtcbiAgICBpZihlcnIpIHJldHVybiBjYihlcnIpO1xuXG4gICAgdmFyIHBhcnQgPSBmaWxlLnNwbGl0KG1hcmtlckluKVsxXTtcbiAgICBpZighcGFydCkge1xuICAgICAgcmV0dXJuIGNiKG51bGwsICcg4pyXICcgKyBjb21wbGV0ZXIgKyAnIHRhYi1jb21wbGV0aW9uIGhhcyBiZWVuIGFscmVhZHkgdW5pbnN0YWxsZWQuIERvIG5vdGhpbmcuJyk7XG4gICAgfVxuXG4gICAgcGFydCA9IG1hcmtlckluICsgcGFydC5zcGxpdChtYXJrZXJPdXQpWzBdICsgbWFya2VyT3V0O1xuICAgIHdyaXRlUmMoZmlsZS5yZXBsYWNlKHBhcnQsICcnKSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICBpZihlcnIpIHJldHVybiBjYihlcnIpO1xuICAgICAgcmV0dXJuIGNiKG51bGwsICcg4pyTICcgKyBjb21wbGV0ZXIgKyAnIHRhYi1jb21wbGV0aW9uIHVuaW5zdGFsbGVkLicpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVhZFJjKGNvbXBsZXRlciwgY2IpIHtcbiAgdmFyIGZpbGUgPSAnLicgKyBwcm9jZXNzLmVudi5TSEVMTC5tYXRjaCgvXFwvYmluXFwvKFxcdyspLylbMV0gKyAncmMnLFxuICBmaWxlcGF0aCA9IHB0aC5qb2luKHByb2Nlc3MuZW52LkhPTUUsIGZpbGUpO1xuICBmcy5sc3RhdChmaWxlcGF0aCwgZnVuY3Rpb24gKGVyciwgc3RhdHMpIHtcbiAgICBpZihlcnIpIHJldHVybiBjYihuZXcgRXJyb3IoXCJObyBcIiArIGZpbGUgKyBcIiBmaWxlLiBZb3UnbGwgaGF2ZSB0byBydW4gaW5zdGVhZDogXCIgKyBjb21wbGV0ZXIgKyBcIiBjb21wbGV0aW9uID4+IH4vXCIgKyBmaWxlKSk7XG4gICAgZnMucmVhZEZpbGUoZmlsZXBhdGgsICd1dGY4JywgY2IpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gd3JpdGVSYyhjb250ZW50LCBjYikge1xuICB2YXIgZmlsZSA9ICcuJyArIHByb2Nlc3MuZW52LlNIRUxMLm1hdGNoKC9cXC9iaW5cXC8oXFx3KykvKVsxXSArICdyYycsXG4gIGZpbGVwYXRoID0gcHRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSwgZmlsZSk7XG4gIGZzLmxzdGF0KGZpbGVwYXRoLCBmdW5jdGlvbiAoZXJyLCBzdGF0cykge1xuICAgIGlmKGVycikgcmV0dXJuIGNiKG5ldyBFcnJvcihcIk5vIFwiICsgZmlsZSArIFwiIGZpbGUuIFlvdSdsbCBoYXZlIHRvIHJ1biBpbnN0ZWFkOiBcIiArIGNvbnRlbnQgKyBcIiBjb21wbGV0aW9uID4+IH4vXCIgKyBmaWxlKSk7XG4gICAgZnMud3JpdGVGaWxlKGZpbGVwYXRoLCBjb250ZW50LCBjYik7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbnN0YWxsZWQgKG1hcmtlciwgY29tcGxldGVyLCBjYikge1xuICByZWFkUmMoY29tcGxldGVyLCBmdW5jdGlvbihlcnIsIGZpbGUpIHtcbiAgICBpZihlcnIpIHJldHVybiBjYihlcnIpO1xuICAgIHZhciBpbnN0YWxsZWQgPSBmaWxlLm1hdGNoKG1hcmtlcik7XG4gICAgcmV0dXJuIGNiKCEhaW5zdGFsbGVkKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlRW52KCkge1xuICB2YXIgYXJncyA9IHByb2Nlc3MuYXJndi5zbGljZSgyKSxcbiAgY29tcGxldGUgPSBhcmdzWzBdID09PSAnY29tcGxldGlvbic7XG5cbiAgcmV0dXJuIHtcbiAgICBhcmdzOiBhcmdzLFxuICAgIGNvbXBsZXRlOiBjb21wbGV0ZSxcbiAgICBpbnN0YWxsOiBjb21wbGV0ZSAmJiBhcmdzWzFdID09PSAnaW5zdGFsbCcsXG4gICAgdW5pbnN0YWxsOiBjb21wbGV0ZSAmJiBhcmdzWzFdID09PSAndW5pbnN0YWxsJyxcbiAgICB3b3JkczogK3Byb2Nlc3MuZW52LkNPTVBfQ1dPUkQsXG4gICAgcG9pbnQ6ICtwcm9jZXNzLmVudi5DT01QX1BPSU5ULFxuICAgIGxpbmU6IHByb2Nlc3MuZW52LkNPTVBfTElORVxuICB9XG59O1xuIl19