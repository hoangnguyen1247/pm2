/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
'use strict';

var _fs = _interopRequireDefault(require("fs"));

var _http = _interopRequireDefault(require("http"));

var _url = _interopRequireDefault(require("url"));

var _path = _interopRequireDefault(require("path"));

var _debug = _interopRequireDefault(require("debug"));

var _semver = _interopRequireDefault(require("semver"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var isNode4 = _semver["default"].lt(process.version, '6.0.0');

var debug = (0, _debug["default"])('pm2:serve');

if (!isNode4) {
  var probe = require('@pm2/io');

  var errorMeter = probe.meter({
    name: '404/sec',
    samples: 1,
    timeframe: 60
  });
}
/**
 * list of supported content types.
 */


var contentTypes = {
  '3gp': 'video/3gpp',
  'a': 'application/octet-stream',
  'ai': 'application/postscript',
  'aif': 'audio/x-aiff',
  'aiff': 'audio/x-aiff',
  'asc': 'application/pgp-signature',
  'asf': 'video/x-ms-asf',
  'asm': 'text/x-asm',
  'asx': 'video/x-ms-asf',
  'atom': 'application/atom+xml',
  'au': 'audio/basic',
  'avi': 'video/x-msvideo',
  'bat': 'application/x-msdownload',
  'bin': 'application/octet-stream',
  'bmp': 'image/bmp',
  'bz2': 'application/x-bzip2',
  'c': 'text/x-c',
  'cab': 'application/vnd.ms-cab-compressed',
  'cc': 'text/x-c',
  'chm': 'application/vnd.ms-htmlhelp',
  'class': 'application/octet-stream',
  'com': 'application/x-msdownload',
  'conf': 'text/plain',
  'cpp': 'text/x-c',
  'crt': 'application/x-x509-ca-cert',
  'css': 'text/css',
  'csv': 'text/csv',
  'cxx': 'text/x-c',
  'deb': 'application/x-debian-package',
  'der': 'application/x-x509-ca-cert',
  'diff': 'text/x-diff',
  'djv': 'image/vnd.djvu',
  'djvu': 'image/vnd.djvu',
  'dll': 'application/x-msdownload',
  'dmg': 'application/octet-stream',
  'doc': 'application/msword',
  'dot': 'application/msword',
  'dtd': 'application/xml-dtd',
  'dvi': 'application/x-dvi',
  'ear': 'application/java-archive',
  'eml': 'message/rfc822',
  'eps': 'application/postscript',
  'exe': 'application/x-msdownload',
  'f': 'text/x-fortran',
  'f77': 'text/x-fortran',
  'f90': 'text/x-fortran',
  'flv': 'video/x-flv',
  'for': 'text/x-fortran',
  'gem': 'application/octet-stream',
  'gemspec': 'text/x-script.ruby',
  'gif': 'image/gif',
  'gz': 'application/x-gzip',
  'h': 'text/x-c',
  'hh': 'text/x-c',
  'htm': 'text/html',
  'html': 'text/html',
  'ico': 'image/vnd.microsoft.icon',
  'ics': 'text/calendar',
  'ifb': 'text/calendar',
  'iso': 'application/octet-stream',
  'jar': 'application/java-archive',
  'java': 'text/x-java-source',
  'jnlp': 'application/x-java-jnlp-file',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'js': 'application/javascript',
  'json': 'application/json',
  'log': 'text/plain',
  'm3u': 'audio/x-mpegurl',
  'm4v': 'video/mp4',
  'man': 'text/troff',
  'mathml': 'application/mathml+xml',
  'mbox': 'application/mbox',
  'mdoc': 'text/troff',
  'me': 'text/troff',
  'mid': 'audio/midi',
  'midi': 'audio/midi',
  'mime': 'message/rfc822',
  'mml': 'application/mathml+xml',
  'mng': 'video/x-mng',
  'mov': 'video/quicktime',
  'mp3': 'audio/mpeg',
  'mp4': 'video/mp4',
  'mp4v': 'video/mp4',
  'mpeg': 'video/mpeg',
  'mpg': 'video/mpeg',
  'ms': 'text/troff',
  'msi': 'application/x-msdownload',
  'odp': 'application/vnd.oasis.opendocument.presentation',
  'ods': 'application/vnd.oasis.opendocument.spreadsheet',
  'odt': 'application/vnd.oasis.opendocument.text',
  'ogg': 'application/ogg',
  'p': 'text/x-pascal',
  'pas': 'text/x-pascal',
  'pbm': 'image/x-portable-bitmap',
  'pdf': 'application/pdf',
  'pem': 'application/x-x509-ca-cert',
  'pgm': 'image/x-portable-graymap',
  'pgp': 'application/pgp-encrypted',
  'pkg': 'application/octet-stream',
  'pl': 'text/x-script.perl',
  'pm': 'text/x-script.perl-module',
  'png': 'image/png',
  'pnm': 'image/x-portable-anymap',
  'ppm': 'image/x-portable-pixmap',
  'pps': 'application/vnd.ms-powerpoint',
  'ppt': 'application/vnd.ms-powerpoint',
  'ps': 'application/postscript',
  'psd': 'image/vnd.adobe.photoshop',
  'py': 'text/x-script.python',
  'qt': 'video/quicktime',
  'ra': 'audio/x-pn-realaudio',
  'rake': 'text/x-script.ruby',
  'ram': 'audio/x-pn-realaudio',
  'rar': 'application/x-rar-compressed',
  'rb': 'text/x-script.ruby',
  'rdf': 'application/rdf+xml',
  'roff': 'text/troff',
  'rpm': 'application/x-redhat-package-manager',
  'rss': 'application/rss+xml',
  'rtf': 'application/rtf',
  'ru': 'text/x-script.ruby',
  's': 'text/x-asm',
  'sgm': 'text/sgml',
  'sgml': 'text/sgml',
  'sh': 'application/x-sh',
  'sig': 'application/pgp-signature',
  'snd': 'audio/basic',
  'so': 'application/octet-stream',
  'svg': 'image/svg+xml',
  'svgz': 'image/svg+xml',
  'swf': 'application/x-shockwave-flash',
  't': 'text/troff',
  'tar': 'application/x-tar',
  'tbz': 'application/x-bzip-compressed-tar',
  'tcl': 'application/x-tcl',
  'tex': 'application/x-tex',
  'texi': 'application/x-texinfo',
  'texinfo': 'application/x-texinfo',
  'text': 'text/plain',
  'tif': 'image/tiff',
  'tiff': 'image/tiff',
  'torrent': 'application/x-bittorrent',
  'tr': 'text/troff',
  'txt': 'text/plain',
  'vcf': 'text/x-vcard',
  'vcs': 'text/x-vcalendar',
  'vrml': 'model/vrml',
  'war': 'application/java-archive',
  'wav': 'audio/x-wav',
  'wma': 'audio/x-ms-wma',
  'wmv': 'video/x-ms-wmv',
  'wmx': 'video/x-ms-wmx',
  'wrl': 'model/vrml',
  'wsdl': 'application/wsdl+xml',
  'xbm': 'image/x-xbitmap',
  'xhtml': 'application/xhtml+xml',
  'xls': 'application/vnd.ms-excel',
  'xml': 'application/xml',
  'xpm': 'image/x-xpixmap',
  'xsl': 'application/xml',
  'xslt': 'application/xslt+xml',
  'yaml': 'text/yaml',
  'yml': 'text/yaml',
  'zip': 'application/zip',
  'woff': 'application/font-woff',
  'woff2': 'application/font-woff',
  'otf': 'application/font-sfnt',
  'otc': 'application/font-sfnt',
  'ttf': 'application/font-sfnt'
};
var options = {
  port: process.env.PM2_SERVE_PORT || process.argv[3] || 8080,
  host: process.env.PM2_SERVE_HOST || process.argv[4] || '0.0.0.0',
  path: _path["default"].resolve(process.env.PM2_SERVE_PATH || process.argv[2] || '.'),
  spa: process.env.PM2_SERVE_SPA === 'true',
  homepage: process.env.PM2_SERVE_HOMEPAGE || '/index.html',
  basic_auth: process.env.PM2_SERVE_BASIC_AUTH === 'true' ? {
    username: process.env.PM2_SERVE_BASIC_AUTH_USERNAME,
    password: process.env.PM2_SERVE_BASIC_AUTH_PASSWORD
  } : null,
  monitor: process.env.PM2_SERVE_MONITOR
};

if (typeof options.port === 'string') {
  options.port = parseInt(options.port) || 8080;
}

if (typeof options.monitor === 'string' && options.monitor !== '') {
  try {
    var fileContent = _fs["default"].readFileSync(_path["default"].join(process.env.PM2_HOME, 'agent.json5')).toString(); // Handle old configuration with json5


    fileContent = fileContent.replace(/\s(\w+):/g, '"$1":'); // parse

    var conf = JSON.parse(fileContent);
    options.monitorBucket = conf.public_key;
  } catch (e) {
    console.log('Interaction file does not exist');
  }
} // start an HTTP server


_http["default"].createServer(function (request, response) {
  if (options.basic_auth) {
    if (!request.headers.authorization || request.headers.authorization.indexOf('Basic ') === -1) {
      return sendBasicAuthResponse(response);
    }

    var user = parseBasicAuth(request.headers.authorization);

    if (user.username !== options.basic_auth.username || user.password !== options.basic_auth.password) {
      return sendBasicAuthResponse(response);
    }
  }

  serveFile(request.url, request, response);
}).listen(options.port, options.host, function () {
  // if (err) {
  // console.error(err);
  // process.exit(1);
  // }
  console.log('Exposing %s directory on %s:%d', options.path, options.host, options.port);
});

function serveFile(uri, request, response) {
  var file = decodeURIComponent(_url["default"].parse(uri || request.url).pathname);

  if (file === '/' || file === '') {
    file = options.homepage;
    request.wantHomepage = true;
  }

  var filePath = _path["default"].resolve(options.path + file); // since we call filesystem directly so we need to verify that the
  // url doesn't go outside the serve path


  if (filePath.indexOf(options.path) !== 0) {
    response.writeHead(403, {
      'Content-Type': 'text/html'
    });
    return response.end('403 Forbidden');
  }

  var contentType = contentTypes[filePath.split('.').pop().toLowerCase()] || 'text/plain';

  _fs["default"].readFile(filePath, function (error, content) {
    if (error) {
      if (!options.spa || request.wantHomepage) {
        console.error('[%s] Error while serving %s with content-type %s : %s', new Date(), filePath, contentType, error.message || error);
      }

      if (!isNode4) errorMeter.mark();

      if (error.code === 'ENOENT') {
        if (options.spa && !request.wantHomepage) {
          request.wantHomepage = true;
          return serveFile("/".concat(_path["default"].basename(file)), request, response);
        } else if (options.spa && file !== options.homepage) {
          return serveFile(options.homepage, request, response);
        }

        _fs["default"].readFile(options.path + '/404.html', function (err, content) {
          content = err ? '404 Not Found' : content;
          response.writeHead(404, {
            'Content-Type': 'text/html'
          });
          return response.end(content, 'utf-8');
        });

        return;
      }

      response.writeHead(500);
      return response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
    }

    response.writeHead(200, {
      'Content-Type': contentType
    });

    if (options.monitorBucket && contentType === 'text/html') {
      content = content.toString().replace('</body>', "\n<script>\n;(function (b,e,n,o,i,t) {\n  b[o]=b[o]||function(f){(b[o].c=b[o].c||[]).push(f)};\n  t=e.createElement(i);e=e.getElementsByTagName(i)[0];\n  t.async=1;t.src=n;e.parentNode.insertBefore(t,e);\n}(window,document,'https://apm.pm2.io/pm2-io-apm-browser.v1.js','pm2Ready','script'))\n\npm2Ready(function(apm) {\n  apm.setBucket('".concat(options.monitorBucket, "')\n  apm.setApplication('").concat(options.monitor, "')\n  apm.reportTimings()\n  apm.reportIssues()\n})\n</script>\n</body>\n"));
    }

    response.end(content, 'utf-8');
    debug('[%s] Serving %s with content-type %s', Date.now(), filePath, contentType);
  });
}

function parseBasicAuth(auth) {
  // auth is like `Basic Y2hhcmxlczoxMjM0NQ==`
  var tmp = auth.split(' ');
  var buf = Buffer.from(tmp[1], 'base64');
  var plain = buf.toString();
  var creds = plain.split(':');
  return {
    username: creds[0],
    password: creds[1]
  };
}

function sendBasicAuthResponse(response) {
  response.writeHead(401, {
    'Content-Type': 'text/html',
    'WWW-Authenticate': 'Basic realm="Authentication service"'
  });
  return response.end('401 Unauthorized');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvU2VydmUudHMiXSwibmFtZXMiOlsiaXNOb2RlNCIsInNlbXZlciIsImx0IiwicHJvY2VzcyIsInZlcnNpb24iLCJkZWJ1ZyIsInByb2JlIiwicmVxdWlyZSIsImVycm9yTWV0ZXIiLCJtZXRlciIsIm5hbWUiLCJzYW1wbGVzIiwidGltZWZyYW1lIiwiY29udGVudFR5cGVzIiwib3B0aW9ucyIsInBvcnQiLCJlbnYiLCJQTTJfU0VSVkVfUE9SVCIsImFyZ3YiLCJob3N0IiwiUE0yX1NFUlZFX0hPU1QiLCJwYXRoIiwicmVzb2x2ZSIsIlBNMl9TRVJWRV9QQVRIIiwic3BhIiwiUE0yX1NFUlZFX1NQQSIsImhvbWVwYWdlIiwiUE0yX1NFUlZFX0hPTUVQQUdFIiwiYmFzaWNfYXV0aCIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIIiwidXNlcm5hbWUiLCJQTTJfU0VSVkVfQkFTSUNfQVVUSF9VU0VSTkFNRSIsInBhc3N3b3JkIiwiUE0yX1NFUlZFX0JBU0lDX0FVVEhfUEFTU1dPUkQiLCJtb25pdG9yIiwiUE0yX1NFUlZFX01PTklUT1IiLCJwYXJzZUludCIsImZpbGVDb250ZW50IiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJqb2luIiwiUE0yX0hPTUUiLCJ0b1N0cmluZyIsInJlcGxhY2UiLCJjb25mIiwiSlNPTiIsInBhcnNlIiwibW9uaXRvckJ1Y2tldCIsInB1YmxpY19rZXkiLCJlIiwiY29uc29sZSIsImxvZyIsImh0dHAiLCJjcmVhdGVTZXJ2ZXIiLCJyZXF1ZXN0IiwicmVzcG9uc2UiLCJoZWFkZXJzIiwiYXV0aG9yaXphdGlvbiIsImluZGV4T2YiLCJzZW5kQmFzaWNBdXRoUmVzcG9uc2UiLCJ1c2VyIiwicGFyc2VCYXNpY0F1dGgiLCJzZXJ2ZUZpbGUiLCJ1cmwiLCJsaXN0ZW4iLCJ1cmkiLCJmaWxlIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwicGF0aG5hbWUiLCJ3YW50SG9tZXBhZ2UiLCJmaWxlUGF0aCIsIndyaXRlSGVhZCIsImVuZCIsImNvbnRlbnRUeXBlIiwic3BsaXQiLCJwb3AiLCJ0b0xvd2VyQ2FzZSIsInJlYWRGaWxlIiwiZXJyb3IiLCJjb250ZW50IiwiRGF0ZSIsIm1lc3NhZ2UiLCJtYXJrIiwiY29kZSIsImJhc2VuYW1lIiwiZXJyIiwibm93IiwiYXV0aCIsInRtcCIsImJ1ZiIsIkJ1ZmZlciIsImZyb20iLCJwbGFpbiIsImNyZWRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUFLQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLElBQUlBLE9BQU8sR0FBR0MsbUJBQU9DLEVBQVAsQ0FBVUMsT0FBTyxDQUFDQyxPQUFsQixFQUEyQixPQUEzQixDQUFkOztBQUVBLElBQU1DLEtBQUssR0FBRyx1QkFBWSxXQUFaLENBQWQ7O0FBQ0EsSUFBSSxDQUFDTCxPQUFMLEVBQWM7QUFDWixNQUFJTSxLQUFLLEdBQUdDLE9BQU8sQ0FBQyxTQUFELENBQW5COztBQUNBLE1BQUlDLFVBQVUsR0FBR0YsS0FBSyxDQUFDRyxLQUFOLENBQVk7QUFDM0JDLElBQUFBLElBQUksRUFBUSxTQURlO0FBRTNCQyxJQUFBQSxPQUFPLEVBQUssQ0FGZTtBQUczQkMsSUFBQUEsU0FBUyxFQUFHO0FBSGUsR0FBWixDQUFqQjtBQUtEO0FBRUQ7Ozs7O0FBR0EsSUFBSUMsWUFBWSxHQUFHO0FBQ2pCLFNBQU8sWUFEVTtBQUVqQixPQUFLLDBCQUZZO0FBR2pCLFFBQU0sd0JBSFc7QUFJakIsU0FBTyxjQUpVO0FBS2pCLFVBQVEsY0FMUztBQU1qQixTQUFPLDJCQU5VO0FBT2pCLFNBQU8sZ0JBUFU7QUFRakIsU0FBTyxZQVJVO0FBU2pCLFNBQU8sZ0JBVFU7QUFVakIsVUFBUSxzQkFWUztBQVdqQixRQUFNLGFBWFc7QUFZakIsU0FBTyxpQkFaVTtBQWFqQixTQUFPLDBCQWJVO0FBY2pCLFNBQU8sMEJBZFU7QUFlakIsU0FBTyxXQWZVO0FBZ0JqQixTQUFPLHFCQWhCVTtBQWlCakIsT0FBSyxVQWpCWTtBQWtCakIsU0FBTyxt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c0IsT0FBdEI7QUFDQTFFLElBQUFBLEtBQUssQ0FBQyxzQ0FBRCxFQUF5QzJFLElBQUksQ0FBQ00sR0FBTCxFQUF6QyxFQUFxRGhCLFFBQXJELEVBQStERyxXQUEvRCxDQUFMO0FBQ0QsR0EvQ0Q7QUFnREQ7O0FBRUQsU0FBU1osY0FBVCxDQUF3QjBCLElBQXhCLEVBQThCO0FBQzVCO0FBQ0EsTUFBSUMsR0FBRyxHQUFHRCxJQUFJLENBQUNiLEtBQUwsQ0FBVyxHQUFYLENBQVY7QUFFQSxNQUFJZSxHQUFHLEdBQUdDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZSCxHQUFHLENBQUMsQ0FBRCxDQUFmLEVBQW9CLFFBQXBCLENBQVY7QUFDQSxNQUFJSSxLQUFLLEdBQUdILEdBQUcsQ0FBQy9DLFFBQUosRUFBWjtBQUVBLE1BQUltRCxLQUFLLEdBQUdELEtBQUssQ0FBQ2xCLEtBQU4sQ0FBWSxHQUFaLENBQVo7QUFDQSxTQUFPO0FBQ0w1QyxJQUFBQSxRQUFRLEVBQUUrRCxLQUFLLENBQUMsQ0FBRCxDQURWO0FBRUw3RCxJQUFBQSxRQUFRLEVBQUU2RCxLQUFLLENBQUMsQ0FBRDtBQUZWLEdBQVA7QUFJRDs7QUFFRCxTQUFTbEMscUJBQVQsQ0FBK0JKLFFBQS9CLEVBQXlDO0FBQ3ZDQSxFQUFBQSxRQUFRLENBQUNnQixTQUFULENBQW1CLEdBQW5CLEVBQXdCO0FBQ3RCLG9CQUFnQixXQURNO0FBRXRCLHdCQUFvQjtBQUZFLEdBQXhCO0FBSUEsU0FBT2hCLFFBQVEsQ0FBQ2lCLEdBQVQsQ0FBYSxrQkFBYixDQUFQO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ29weXJpZ2h0IDIwMTMgdGhlIFBNMiBwcm9qZWN0IGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgbGljZW5zZSB0aGF0XHJcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxyXG4gKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XHJcbmltcG9ydCB1cmwgZnJvbSAndXJsJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBkZWJ1Z0xvZ2dlciBmcm9tICdkZWJ1ZydcclxuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5cclxudmFyIGlzTm9kZTQgPSBzZW12ZXIubHQocHJvY2Vzcy52ZXJzaW9uLCAnNi4wLjAnKVxyXG5cclxuY29uc3QgZGVidWcgPSBkZWJ1Z0xvZ2dlcigncG0yOnNlcnZlJyk7XHJcbmlmICghaXNOb2RlNCkge1xyXG4gIHZhciBwcm9iZSA9IHJlcXVpcmUoJ0BwbTIvaW8nKTtcclxuICB2YXIgZXJyb3JNZXRlciA9IHByb2JlLm1ldGVyKHtcclxuICAgIG5hbWUgICAgICA6ICc0MDQvc2VjJyxcclxuICAgIHNhbXBsZXMgICA6IDEsXHJcbiAgICB0aW1lZnJhbWUgOiA2MFxyXG4gIH0pXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBsaXN0IG9mIHN1cHBvcnRlZCBjb250ZW50IHR5cGVzLlxyXG4gKi9cclxudmFyIGNvbnRlbnRUeXBlcyA9IHtcclxuICAnM2dwJzogJ3ZpZGVvLzNncHAnLFxyXG4gICdhJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXHJcbiAgJ2FpJzogJ2FwcGxpY2F0aW9uL3Bvc3RzY3JpcHQnLFxyXG4gICdhaWYnOiAnYXVkaW8veC1haWZmJyxcclxuICAnYWlmZic6ICdhdWRpby94LWFpZmYnLFxyXG4gICdhc2MnOiAnYXBwbGljYXRpb24vcGdwLXNpZ25hdHVyZScsXHJcbiAgJ2FzZic6ICd2aWRlby94LW1zLWFzZicsXHJcbiAgJ2FzbSc6ICd0ZXh0L3gtYXNtJyxcclxuICAnYXN4JzogJ3ZpZGVvL3gtbXMtYXNmJyxcclxuICAnYXRvbSc6ICdhcHBsaWNhdGlvbi9hdG9tK3htbCcsXHJcbiAgJ2F1JzogJ2F1ZGlvL2Jhc2ljJyxcclxuICAnYXZpJzogJ3ZpZGVvL3gtbXN2aWRlbycsXHJcbiAgJ2JhdCc6ICdhcHBsaWNhdGlvbi94LW1zZG93bmxvYWQnLFxyXG4gICdiaW4nOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyxcclxuICAnYm1wJzogJ2ltYWdlL2JtcCcsXHJcbiAgJ2J6Mic6ICdhcHBsaWNhdGlvbi94LWJ6aXAyJyxcclxuICAnYyc6ICd0ZXh0L3gtYycsXHJcbiAgJ2NhYic6ICdhcHBsaWNhdGlvbi92bmQubXMtY2FiLWNvbXByZXNzZWQnLFxyXG4gICdjYyc6ICd0ZXh0L3gtYycsXHJcbiAgJ2NobSc6ICdhcHBsaWNhdGlvbi92bmQubXMtaHRtbGhlbHAnLFxyXG4gICdjbGFzcyc6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nLFxyXG4gICdjb20nOiAnYXBwbGljYXRpb24veC1tc2Rvd25sb2FkJyxcclxuICAnY29uZic6ICd0ZXh0L3BsYWluJyxcclxuICAnY3BwJzogJ3RleHQveC1jJyxcclxuICAnY3J0JzogJ2FwcGxpY2F0aW9uL3gteDUwOS1jYS1jZXJ0JyxcclxuICAnY3NzJzogJ3RleHQvY3NzJyxcclxuICAnY3N2JzogJ3RleHQvY3N2JyxcclxuICAnY3h4JzogJ3RleHQveC1jJyxcclxuICAnZGViJzogJ2FwcGxpY2F0aW9uL3gtZGViaWFuLXBhY2thZ2UnLFxyXG4gICdkZXInOiAnYXBwbGljYXRpb24veC14NTA5LWNhLWNlcnQnLFxyXG4gICdkaWZmJzogJ3RleHQveC1kaWZmJyxcclxuICAnZGp2JzogJ2ltYWdlL3ZuZC5kanZ1JyxcclxuICAnZGp2dSc6ICdpbWFnZS92bmQuZGp2dScsXHJcbiAgJ2RsbCc6ICdhcHBsaWNhdGlvbi94LW1zZG93bmxvYWQnLFxyXG4gICdkbWcnOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyxcclxuICAnZG9jJzogJ2FwcGxpY2F0aW9uL21zd29yZCcsXHJcbiAgJ2RvdCc6ICdhcHBsaWNhdGlvbi9tc3dvcmQnLFxyXG4gICdkdGQnOiAnYXBwbGljYXRpb24veG1sLWR0ZCcsXHJcbiAgJ2R2aSc6ICdhcHBsaWNhdGlvbi94LWR2aScsXHJcbiAgJ2Vhcic6ICdhcHBsaWNhdGlvbi9qYXZhLWFyY2hpdmUnLFxyXG4gICdlbWwnOiAnbWVzc2FnZS9yZmM4MjInLFxyXG4gICdlcHMnOiAnYXBwbGljYXRpb24vcG9zdHNjcmlwdCcsXHJcbiAgJ2V4ZSc6ICdhcHBsaWNhdGlvbi94LW1zZG93bmxvYWQnLFxyXG4gICdmJzogJ3RleHQveC1mb3J0cmFuJyxcclxuICAnZjc3JzogJ3RleHQveC1mb3J0cmFuJyxcclxuICAnZjkwJzogJ3RleHQveC1mb3J0cmFuJyxcclxuICAnZmx2JzogJ3ZpZGVvL3gtZmx2JyxcclxuICAnZm9yJzogJ3RleHQveC1mb3J0cmFuJyxcclxuICAnZ2VtJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXHJcbiAgJ2dlbXNwZWMnOiAndGV4dC94LXNjcmlwdC5ydWJ5JyxcclxuICAnZ2lmJzogJ2ltYWdlL2dpZicsXHJcbiAgJ2d6JzogJ2FwcGxpY2F0aW9uL3gtZ3ppcCcsXHJcbiAgJ2gnOiAndGV4dC94LWMnLFxyXG4gICdoaCc6ICd0ZXh0L3gtYycsXHJcbiAgJ2h0bSc6ICd0ZXh0L2h0bWwnLFxyXG4gICdodG1sJzogJ3RleHQvaHRtbCcsXHJcbiAgJ2ljbyc6ICdpbWFnZS92bmQubWljcm9zb2Z0Lmljb24nLFxyXG4gICdpY3MnOiAndGV4dC9jYWxlbmRhcicsXHJcbiAgJ2lmYic6ICd0ZXh0L2NhbGVuZGFyJyxcclxuICAnaXNvJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXHJcbiAgJ2phcic6ICdhcHBsaWNhdGlvbi9qYXZhLWFyY2hpdmUnLFxyXG4gICdqYXZhJzogJ3RleHQveC1qYXZhLXNvdXJjZScsXHJcbiAgJ2pubHAnOiAnYXBwbGljYXRpb24veC1qYXZhLWpubHAtZmlsZScsXHJcbiAgJ2pwZWcnOiAnaW1hZ2UvanBlZycsXHJcbiAgJ2pwZyc6ICdpbWFnZS9qcGVnJyxcclxuICAnanMnOiAnYXBwbGljYXRpb24vamF2YXNjcmlwdCcsXHJcbiAgJ2pzb24nOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgJ2xvZyc6ICd0ZXh0L3BsYWluJyxcclxuICAnbTN1JzogJ2F1ZGlvL3gtbXBlZ3VybCcsXHJcbiAgJ200dic6ICd2aWRlby9tcDQnLFxyXG4gICdtYW4nOiAndGV4dC90cm9mZicsXHJcbiAgJ21hdGhtbCc6ICdhcHBsaWNhdGlvbi9tYXRobWwreG1sJyxcclxuICAnbWJveCc6ICdhcHBsaWNhdGlvbi9tYm94JyxcclxuICAnbWRvYyc6ICd0ZXh0L3Ryb2ZmJyxcclxuICAnbWUnOiAndGV4dC90cm9mZicsXHJcbiAgJ21pZCc6ICdhdWRpby9taWRpJyxcclxuICAnbWlkaSc6ICdhdWRpby9taWRpJyxcclxuICAnbWltZSc6ICdtZXNzYWdlL3JmYzgyMicsXHJcbiAgJ21tbCc6ICdhcHBsaWNhdGlvbi9tYXRobWwreG1sJyxcclxuICAnbW5nJzogJ3ZpZGVvL3gtbW5nJyxcclxuICAnbW92JzogJ3ZpZGVvL3F1aWNrdGltZScsXHJcbiAgJ21wMyc6ICdhdWRpby9tcGVnJyxcclxuICAnbXA0JzogJ3ZpZGVvL21wNCcsXHJcbiAgJ21wNHYnOiAndmlkZW8vbXA0JyxcclxuICAnbXBlZyc6ICd2aWRlby9tcGVnJyxcclxuICAnbXBnJzogJ3ZpZGVvL21wZWcnLFxyXG4gICdtcyc6ICd0ZXh0L3Ryb2ZmJyxcclxuICAnbXNpJzogJ2FwcGxpY2F0aW9uL3gtbXNkb3dubG9hZCcsXHJcbiAgJ29kcCc6ICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnByZXNlbnRhdGlvbicsXHJcbiAgJ29kcyc6ICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnNwcmVhZHNoZWV0JyxcclxuICAnb2R0JzogJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQudGV4dCcsXHJcbiAgJ29nZyc6ICdhcHBsaWNhdGlvbi9vZ2cnLFxyXG4gICdwJzogJ3RleHQveC1wYXNjYWwnLFxyXG4gICdwYXMnOiAndGV4dC94LXBhc2NhbCcsXHJcbiAgJ3BibSc6ICdpbWFnZS94LXBvcnRhYmxlLWJpdG1hcCcsXHJcbiAgJ3BkZic6ICdhcHBsaWNhdGlvbi9wZGYnLFxyXG4gICdwZW0nOiAnYXBwbGljYXRpb24veC14NTA5LWNhLWNlcnQnLFxyXG4gICdwZ20nOiAnaW1hZ2UveC1wb3J0YWJsZS1ncmF5bWFwJyxcclxuICAncGdwJzogJ2FwcGxpY2F0aW9uL3BncC1lbmNyeXB0ZWQnLFxyXG4gICdwa2cnOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyxcclxuICAncGwnOiAndGV4dC94LXNjcmlwdC5wZXJsJyxcclxuICAncG0nOiAndGV4dC94LXNjcmlwdC5wZXJsLW1vZHVsZScsXHJcbiAgJ3BuZyc6ICdpbWFnZS9wbmcnLFxyXG4gICdwbm0nOiAnaW1hZ2UveC1wb3J0YWJsZS1hbnltYXAnLFxyXG4gICdwcG0nOiAnaW1hZ2UveC1wb3J0YWJsZS1waXhtYXAnLFxyXG4gICdwcHMnOiAnYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQnLFxyXG4gICdwcHQnOiAnYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQnLFxyXG4gICdwcyc6ICdhcHBsaWNhdGlvbi9wb3N0c2NyaXB0JyxcclxuICAncHNkJzogJ2ltYWdlL3ZuZC5hZG9iZS5waG90b3Nob3AnLFxyXG4gICdweSc6ICd0ZXh0L3gtc2NyaXB0LnB5dGhvbicsXHJcbiAgJ3F0JzogJ3ZpZGVvL3F1aWNrdGltZScsXHJcbiAgJ3JhJzogJ2F1ZGlvL3gtcG4tcmVhbGF1ZGlvJyxcclxuICAncmFrZSc6ICd0ZXh0L3gtc2NyaXB0LnJ1YnknLFxyXG4gICdyYW0nOiAnYXVkaW8veC1wbi1yZWFsYXVkaW8nLFxyXG4gICdyYXInOiAnYXBwbGljYXRpb24veC1yYXItY29tcHJlc3NlZCcsXHJcbiAgJ3JiJzogJ3RleHQveC1zY3JpcHQucnVieScsXHJcbiAgJ3JkZic6ICdhcHBsaWNhdGlvbi9yZGYreG1sJyxcclxuICAncm9mZic6ICd0ZXh0L3Ryb2ZmJyxcclxuICAncnBtJzogJ2FwcGxpY2F0aW9uL3gtcmVkaGF0LXBhY2thZ2UtbWFuYWdlcicsXHJcbiAgJ3Jzcyc6ICdhcHBsaWNhdGlvbi9yc3MreG1sJyxcclxuICAncnRmJzogJ2FwcGxpY2F0aW9uL3J0ZicsXHJcbiAgJ3J1JzogJ3RleHQveC1zY3JpcHQucnVieScsXHJcbiAgJ3MnOiAndGV4dC94LWFzbScsXHJcbiAgJ3NnbSc6ICd0ZXh0L3NnbWwnLFxyXG4gICdzZ21sJzogJ3RleHQvc2dtbCcsXHJcbiAgJ3NoJzogJ2FwcGxpY2F0aW9uL3gtc2gnLFxyXG4gICdzaWcnOiAnYXBwbGljYXRpb24vcGdwLXNpZ25hdHVyZScsXHJcbiAgJ3NuZCc6ICdhdWRpby9iYXNpYycsXHJcbiAgJ3NvJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXHJcbiAgJ3N2Zyc6ICdpbWFnZS9zdmcreG1sJyxcclxuICAnc3Zneic6ICdpbWFnZS9zdmcreG1sJyxcclxuICAnc3dmJzogJ2FwcGxpY2F0aW9uL3gtc2hvY2t3YXZlLWZsYXNoJyxcclxuICAndCc6ICd0ZXh0L3Ryb2ZmJyxcclxuICAndGFyJzogJ2FwcGxpY2F0aW9uL3gtdGFyJyxcclxuICAndGJ6JzogJ2FwcGxpY2F0aW9uL3gtYnppcC1jb21wcmVzc2VkLXRhcicsXHJcbiAgJ3RjbCc6ICdhcHBsaWNhdGlvbi94LXRjbCcsXHJcbiAgJ3RleCc6ICdhcHBsaWNhdGlvbi94LXRleCcsXHJcbiAgJ3RleGknOiAnYXBwbGljYXRpb24veC10ZXhpbmZvJyxcclxuICAndGV4aW5mbyc6ICdhcHBsaWNhdGlvbi94LXRleGluZm8nLFxyXG4gICd0ZXh0JzogJ3RleHQvcGxhaW4nLFxyXG4gICd0aWYnOiAnaW1hZ2UvdGlmZicsXHJcbiAgJ3RpZmYnOiAnaW1hZ2UvdGlmZicsXHJcbiAgJ3RvcnJlbnQnOiAnYXBwbGljYXRpb24veC1iaXR0b3JyZW50JyxcclxuICAndHInOiAndGV4dC90cm9mZicsXHJcbiAgJ3R4dCc6ICd0ZXh0L3BsYWluJyxcclxuICAndmNmJzogJ3RleHQveC12Y2FyZCcsXHJcbiAgJ3Zjcyc6ICd0ZXh0L3gtdmNhbGVuZGFyJyxcclxuICAndnJtbCc6ICdtb2RlbC92cm1sJyxcclxuICAnd2FyJzogJ2FwcGxpY2F0aW9uL2phdmEtYXJjaGl2ZScsXHJcbiAgJ3dhdic6ICdhdWRpby94LXdhdicsXHJcbiAgJ3dtYSc6ICdhdWRpby94LW1zLXdtYScsXHJcbiAgJ3dtdic6ICd2aWRlby94LW1zLXdtdicsXHJcbiAgJ3dteCc6ICd2aWRlby94LW1zLXdteCcsXHJcbiAgJ3dybCc6ICdtb2RlbC92cm1sJyxcclxuICAnd3NkbCc6ICdhcHBsaWNhdGlvbi93c2RsK3htbCcsXHJcbiAgJ3hibSc6ICdpbWFnZS94LXhiaXRtYXAnLFxyXG4gICd4aHRtbCc6ICdhcHBsaWNhdGlvbi94aHRtbCt4bWwnLFxyXG4gICd4bHMnOiAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJyxcclxuICAneG1sJzogJ2FwcGxpY2F0aW9uL3htbCcsXHJcbiAgJ3hwbSc6ICdpbWFnZS94LXhwaXhtYXAnLFxyXG4gICd4c2wnOiAnYXBwbGljYXRpb24veG1sJyxcclxuICAneHNsdCc6ICdhcHBsaWNhdGlvbi94c2x0K3htbCcsXHJcbiAgJ3lhbWwnOiAndGV4dC95YW1sJyxcclxuICAneW1sJzogJ3RleHQveWFtbCcsXHJcbiAgJ3ppcCc6ICdhcHBsaWNhdGlvbi96aXAnLFxyXG4gICd3b2ZmJzogJ2FwcGxpY2F0aW9uL2ZvbnQtd29mZicsXHJcbiAgJ3dvZmYyJzogJ2FwcGxpY2F0aW9uL2ZvbnQtd29mZicsXHJcbiAgJ290Zic6ICdhcHBsaWNhdGlvbi9mb250LXNmbnQnLFxyXG4gICdvdGMnOiAnYXBwbGljYXRpb24vZm9udC1zZm50JyxcclxuICAndHRmJzogJ2FwcGxpY2F0aW9uL2ZvbnQtc2ZudCdcclxufTtcclxuXHJcbnZhciBvcHRpb25zOiBhbnkgPSB7XHJcbiAgcG9ydDogcHJvY2Vzcy5lbnYuUE0yX1NFUlZFX1BPUlQgfHwgcHJvY2Vzcy5hcmd2WzNdIHx8IDgwODAsXHJcbiAgaG9zdDogcHJvY2Vzcy5lbnYuUE0yX1NFUlZFX0hPU1QgfHwgcHJvY2Vzcy5hcmd2WzRdIHx8ICcwLjAuMC4wJyxcclxuICBwYXRoOiBwYXRoLnJlc29sdmUocHJvY2Vzcy5lbnYuUE0yX1NFUlZFX1BBVEggfHwgcHJvY2Vzcy5hcmd2WzJdIHx8ICcuJyksXHJcbiAgc3BhOiBwcm9jZXNzLmVudi5QTTJfU0VSVkVfU1BBID09PSAndHJ1ZScsXHJcbiAgaG9tZXBhZ2U6IHByb2Nlc3MuZW52LlBNMl9TRVJWRV9IT01FUEFHRSB8fCAnL2luZGV4Lmh0bWwnLFxyXG4gIGJhc2ljX2F1dGg6IHByb2Nlc3MuZW52LlBNMl9TRVJWRV9CQVNJQ19BVVRIID09PSAndHJ1ZScgPyB7XHJcbiAgICB1c2VybmFtZTogcHJvY2Vzcy5lbnYuUE0yX1NFUlZFX0JBU0lDX0FVVEhfVVNFUk5BTUUsXHJcbiAgICBwYXNzd29yZDogcHJvY2Vzcy5lbnYuUE0yX1NFUlZFX0JBU0lDX0FVVEhfUEFTU1dPUkRcclxuICB9IDogbnVsbCxcclxuICBtb25pdG9yOiBwcm9jZXNzLmVudi5QTTJfU0VSVkVfTU9OSVRPUlxyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBvcHRpb25zLnBvcnQgPT09ICdzdHJpbmcnKSB7XHJcbiAgb3B0aW9ucy5wb3J0ID0gcGFyc2VJbnQob3B0aW9ucy5wb3J0KSB8fCA4MDgwXHJcbn1cclxuXHJcbmlmICh0eXBlb2Ygb3B0aW9ucy5tb25pdG9yID09PSAnc3RyaW5nJyAmJiBvcHRpb25zLm1vbml0b3IgIT09ICcnKSB7XHJcbiAgdHJ5IHtcclxuICAgIGxldCBmaWxlQ29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuUE0yX0hPTUUsICdhZ2VudC5qc29uNScpKS50b1N0cmluZygpXHJcbiAgICAvLyBIYW5kbGUgb2xkIGNvbmZpZ3VyYXRpb24gd2l0aCBqc29uNVxyXG4gICAgZmlsZUNvbnRlbnQgPSBmaWxlQ29udGVudC5yZXBsYWNlKC9cXHMoXFx3Kyk6L2csICdcIiQxXCI6JylcclxuICAgIC8vIHBhcnNlXHJcbiAgICBsZXQgY29uZiA9IEpTT04ucGFyc2UoZmlsZUNvbnRlbnQpXHJcbiAgICBvcHRpb25zLm1vbml0b3JCdWNrZXQgPSBjb25mLnB1YmxpY19rZXlcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBjb25zb2xlLmxvZygnSW50ZXJhY3Rpb24gZmlsZSBkb2VzIG5vdCBleGlzdCcpXHJcbiAgfVxyXG59XHJcblxyXG4vLyBzdGFydCBhbiBIVFRQIHNlcnZlclxyXG5odHRwLmNyZWF0ZVNlcnZlcihmdW5jdGlvbiAocmVxdWVzdCwgcmVzcG9uc2UpIHtcclxuICBpZiAob3B0aW9ucy5iYXNpY19hdXRoKSB7XHJcbiAgICBpZiAoIXJlcXVlc3QuaGVhZGVycy5hdXRob3JpemF0aW9uIHx8IHJlcXVlc3QuaGVhZGVycy5hdXRob3JpemF0aW9uLmluZGV4T2YoJ0Jhc2ljICcpID09PSAtMSkge1xyXG4gICAgICByZXR1cm4gc2VuZEJhc2ljQXV0aFJlc3BvbnNlKHJlc3BvbnNlKVxyXG4gICAgfVxyXG5cclxuICAgIHZhciB1c2VyID0gcGFyc2VCYXNpY0F1dGgocmVxdWVzdC5oZWFkZXJzLmF1dGhvcml6YXRpb24pXHJcbiAgICBpZiAodXNlci51c2VybmFtZSAhPT0gb3B0aW9ucy5iYXNpY19hdXRoLnVzZXJuYW1lIHx8IHVzZXIucGFzc3dvcmQgIT09IG9wdGlvbnMuYmFzaWNfYXV0aC5wYXNzd29yZCkge1xyXG4gICAgICByZXR1cm4gc2VuZEJhc2ljQXV0aFJlc3BvbnNlKHJlc3BvbnNlKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2VydmVGaWxlKHJlcXVlc3QudXJsLCByZXF1ZXN0LCByZXNwb25zZSk7XHJcblxyXG59KS5saXN0ZW4ob3B0aW9ucy5wb3J0LCBvcHRpb25zLmhvc3QsIGZ1bmN0aW9uICgpIHtcclxuICAvLyBpZiAoZXJyKSB7XHJcbiAgICAvLyBjb25zb2xlLmVycm9yKGVycik7XHJcbiAgICAvLyBwcm9jZXNzLmV4aXQoMSk7XHJcbiAgLy8gfVxyXG4gIGNvbnNvbGUubG9nKCdFeHBvc2luZyAlcyBkaXJlY3Rvcnkgb24gJXM6JWQnLCBvcHRpb25zLnBhdGgsIG9wdGlvbnMuaG9zdCwgb3B0aW9ucy5wb3J0KTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBzZXJ2ZUZpbGUodXJpLCByZXF1ZXN0LCByZXNwb25zZSkge1xyXG4gIHZhciBmaWxlID0gZGVjb2RlVVJJQ29tcG9uZW50KHVybC5wYXJzZSh1cmkgfHwgcmVxdWVzdC51cmwpLnBhdGhuYW1lKTtcclxuXHJcbiAgaWYgKGZpbGUgPT09ICcvJyB8fCBmaWxlID09PSAnJykge1xyXG4gICAgZmlsZSA9IG9wdGlvbnMuaG9tZXBhZ2U7XHJcbiAgICByZXF1ZXN0LndhbnRIb21lcGFnZSA9IHRydWU7XHJcbiAgfVxyXG4gIHZhciBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShvcHRpb25zLnBhdGggKyBmaWxlKTtcclxuXHJcbiAgLy8gc2luY2Ugd2UgY2FsbCBmaWxlc3lzdGVtIGRpcmVjdGx5IHNvIHdlIG5lZWQgdG8gdmVyaWZ5IHRoYXQgdGhlXHJcbiAgLy8gdXJsIGRvZXNuJ3QgZ28gb3V0c2lkZSB0aGUgc2VydmUgcGF0aFxyXG4gIGlmIChmaWxlUGF0aC5pbmRleE9mKG9wdGlvbnMucGF0aCkgIT09IDApIHtcclxuICAgIHJlc3BvbnNlLndyaXRlSGVhZCg0MDMsIHsgJ0NvbnRlbnQtVHlwZSc6ICd0ZXh0L2h0bWwnIH0pO1xyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmVuZCgnNDAzIEZvcmJpZGRlbicpO1xyXG4gIH1cclxuXHJcbiAgdmFyIGNvbnRlbnRUeXBlID0gY29udGVudFR5cGVzW2ZpbGVQYXRoLnNwbGl0KCcuJykucG9wKCkudG9Mb3dlckNhc2UoKV0gfHwgJ3RleHQvcGxhaW4nO1xyXG5cclxuICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgZnVuY3Rpb24gKGVycm9yLCBjb250ZW50OiBhbnkpIHtcclxuICAgIGlmIChlcnJvcikge1xyXG4gICAgICBpZiAoKCFvcHRpb25zLnNwYSB8fCByZXF1ZXN0LndhbnRIb21lcGFnZSkpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdbJXNdIEVycm9yIHdoaWxlIHNlcnZpbmcgJXMgd2l0aCBjb250ZW50LXR5cGUgJXMgOiAlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICBuZXcgRGF0ZSgpLCBmaWxlUGF0aCwgY29udGVudFR5cGUsIGVycm9yLm1lc3NhZ2UgfHwgZXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghaXNOb2RlNClcclxuICAgICAgICBlcnJvck1ldGVyLm1hcmsoKTtcclxuICAgICAgaWYgKGVycm9yLmNvZGUgPT09ICdFTk9FTlQnKSB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuc3BhICYmICFyZXF1ZXN0LndhbnRIb21lcGFnZSkge1xyXG4gICAgICAgICAgcmVxdWVzdC53YW50SG9tZXBhZ2UgPSB0cnVlO1xyXG4gICAgICAgICAgcmV0dXJuIHNlcnZlRmlsZShgLyR7cGF0aC5iYXNlbmFtZShmaWxlKX1gLCByZXF1ZXN0LCByZXNwb25zZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnNwYSAmJiBmaWxlICE9PSBvcHRpb25zLmhvbWVwYWdlKSB7XHJcbiAgICAgICAgICByZXR1cm4gc2VydmVGaWxlKG9wdGlvbnMuaG9tZXBhZ2UsIHJlcXVlc3QsIHJlc3BvbnNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnMucmVhZEZpbGUob3B0aW9ucy5wYXRoICsgJy80MDQuaHRtbCcsIGZ1bmN0aW9uIChlcnIsIGNvbnRlbnQ6IGFueSkge1xyXG4gICAgICAgICAgY29udGVudCA9IGVyciA/ICc0MDQgTm90IEZvdW5kJyA6IGNvbnRlbnQ7XHJcbiAgICAgICAgICByZXNwb25zZS53cml0ZUhlYWQoNDA0LCB7ICdDb250ZW50LVR5cGUnOiAndGV4dC9odG1sJyB9KTtcclxuICAgICAgICAgIHJldHVybiByZXNwb25zZS5lbmQoY29udGVudCwgJ3V0Zi04Jyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHJlc3BvbnNlLndyaXRlSGVhZCg1MDApO1xyXG4gICAgICByZXR1cm4gcmVzcG9uc2UuZW5kKCdTb3JyeSwgY2hlY2sgd2l0aCB0aGUgc2l0ZSBhZG1pbiBmb3IgZXJyb3I6ICcgKyBlcnJvci5jb2RlICsgJyAuLlxcbicpO1xyXG4gICAgfVxyXG4gICAgcmVzcG9uc2Uud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogY29udGVudFR5cGUgfSk7XHJcbiAgICBpZiAob3B0aW9ucy5tb25pdG9yQnVja2V0ICYmIGNvbnRlbnRUeXBlID09PSAndGV4dC9odG1sJykge1xyXG4gICAgICBjb250ZW50ID0gY29udGVudC50b1N0cmluZygpLnJlcGxhY2UoJzwvYm9keT4nLCBgXHJcbjxzY3JpcHQ+XHJcbjsoZnVuY3Rpb24gKGIsZSxuLG8saSx0KSB7XHJcbiAgYltvXT1iW29dfHxmdW5jdGlvbihmKXsoYltvXS5jPWJbb10uY3x8W10pLnB1c2goZil9O1xyXG4gIHQ9ZS5jcmVhdGVFbGVtZW50KGkpO2U9ZS5nZXRFbGVtZW50c0J5VGFnTmFtZShpKVswXTtcclxuICB0LmFzeW5jPTE7dC5zcmM9bjtlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHQsZSk7XHJcbn0od2luZG93LGRvY3VtZW50LCdodHRwczovL2FwbS5wbTIuaW8vcG0yLWlvLWFwbS1icm93c2VyLnYxLmpzJywncG0yUmVhZHknLCdzY3JpcHQnKSlcclxuXHJcbnBtMlJlYWR5KGZ1bmN0aW9uKGFwbSkge1xyXG4gIGFwbS5zZXRCdWNrZXQoJyR7b3B0aW9ucy5tb25pdG9yQnVja2V0fScpXHJcbiAgYXBtLnNldEFwcGxpY2F0aW9uKCcke29wdGlvbnMubW9uaXRvcn0nKVxyXG4gIGFwbS5yZXBvcnRUaW1pbmdzKClcclxuICBhcG0ucmVwb3J0SXNzdWVzKClcclxufSlcclxuPC9zY3JpcHQ+XHJcbjwvYm9keT5cclxuYCk7XHJcbiAgICB9XHJcbiAgICByZXNwb25zZS5lbmQoY29udGVudCwgJ3V0Zi04Jyk7XHJcbiAgICBkZWJ1ZygnWyVzXSBTZXJ2aW5nICVzIHdpdGggY29udGVudC10eXBlICVzJywgRGF0ZS5ub3coKSwgZmlsZVBhdGgsIGNvbnRlbnRUeXBlKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VCYXNpY0F1dGgoYXV0aCkge1xyXG4gIC8vIGF1dGggaXMgbGlrZSBgQmFzaWMgWTJoaGNteGxjem94TWpNME5RPT1gXHJcbiAgdmFyIHRtcCA9IGF1dGguc3BsaXQoJyAnKTtcclxuXHJcbiAgdmFyIGJ1ZiA9IEJ1ZmZlci5mcm9tKHRtcFsxXSwgJ2Jhc2U2NCcpO1xyXG4gIHZhciBwbGFpbiA9IGJ1Zi50b1N0cmluZygpO1xyXG5cclxuICB2YXIgY3JlZHMgPSBwbGFpbi5zcGxpdCgnOicpO1xyXG4gIHJldHVybiB7XHJcbiAgICB1c2VybmFtZTogY3JlZHNbMF0sXHJcbiAgICBwYXNzd29yZDogY3JlZHNbMV1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNlbmRCYXNpY0F1dGhSZXNwb25zZShyZXNwb25zZSkge1xyXG4gIHJlc3BvbnNlLndyaXRlSGVhZCg0MDEsIHtcclxuICAgICdDb250ZW50LVR5cGUnOiAndGV4dC9odG1sJyxcclxuICAgICdXV1ctQXV0aGVudGljYXRlJzogJ0Jhc2ljIHJlYWxtPVwiQXV0aGVudGljYXRpb24gc2VydmljZVwiJ1xyXG4gIH0pO1xyXG4gIHJldHVybiByZXNwb25zZS5lbmQoJzQwMSBVbmF1dGhvcml6ZWQnKTtcclxufVxyXG4iXX0=