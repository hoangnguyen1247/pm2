/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _fs = _interopRequireDefault(require("fs"));

var _http = _interopRequireDefault(require("http"));

var _url = _interopRequireDefault(require("url"));

var _path = _interopRequireDefault(require("path"));

var _debug = _interopRequireDefault(require("debug"));

var _semver = _interopRequireDefault(require("semver"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvU2VydmUudHMiXSwibmFtZXMiOlsiaXNOb2RlNCIsInNlbXZlciIsImx0IiwicHJvY2VzcyIsInZlcnNpb24iLCJkZWJ1ZyIsInByb2JlIiwicmVxdWlyZSIsImVycm9yTWV0ZXIiLCJtZXRlciIsIm5hbWUiLCJzYW1wbGVzIiwidGltZWZyYW1lIiwiY29udGVudFR5cGVzIiwib3B0aW9ucyIsInBvcnQiLCJlbnYiLCJQTTJfU0VSVkVfUE9SVCIsImFyZ3YiLCJob3N0IiwiUE0yX1NFUlZFX0hPU1QiLCJwYXRoIiwicmVzb2x2ZSIsIlBNMl9TRVJWRV9QQVRIIiwic3BhIiwiUE0yX1NFUlZFX1NQQSIsImhvbWVwYWdlIiwiUE0yX1NFUlZFX0hPTUVQQUdFIiwiYmFzaWNfYXV0aCIsIlBNMl9TRVJWRV9CQVNJQ19BVVRIIiwidXNlcm5hbWUiLCJQTTJfU0VSVkVfQkFTSUNfQVVUSF9VU0VSTkFNRSIsInBhc3N3b3JkIiwiUE0yX1NFUlZFX0JBU0lDX0FVVEhfUEFTU1dPUkQiLCJtb25pdG9yIiwiUE0yX1NFUlZFX01PTklUT1IiLCJwYXJzZUludCIsImZpbGVDb250ZW50IiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJqb2luIiwiUE0yX0hPTUUiLCJ0b1N0cmluZyIsInJlcGxhY2UiLCJjb25mIiwiSlNPTiIsInBhcnNlIiwibW9uaXRvckJ1Y2tldCIsInB1YmxpY19rZXkiLCJlIiwiY29uc29sZSIsImxvZyIsImh0dHAiLCJjcmVhdGVTZXJ2ZXIiLCJyZXF1ZXN0IiwicmVzcG9uc2UiLCJoZWFkZXJzIiwiYXV0aG9yaXphdGlvbiIsImluZGV4T2YiLCJzZW5kQmFzaWNBdXRoUmVzcG9uc2UiLCJ1c2VyIiwicGFyc2VCYXNpY0F1dGgiLCJzZXJ2ZUZpbGUiLCJ1cmwiLCJsaXN0ZW4iLCJ1cmkiLCJmaWxlIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwicGF0aG5hbWUiLCJ3YW50SG9tZXBhZ2UiLCJmaWxlUGF0aCIsIndyaXRlSGVhZCIsImVuZCIsImNvbnRlbnRUeXBlIiwic3BsaXQiLCJwb3AiLCJ0b0xvd2VyQ2FzZSIsInJlYWRGaWxlIiwiZXJyb3IiLCJjb250ZW50IiwiRGF0ZSIsIm1lc3NhZ2UiLCJtYXJrIiwiY29kZSIsImJhc2VuYW1lIiwiZXJyIiwibm93IiwiYXV0aCIsInRtcCIsImJ1ZiIsIkJ1ZmZlciIsImZyb20iLCJwbGFpbiIsImNyZWRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUFLQTs7OztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLElBQUlBLE9BQU8sR0FBR0MsbUJBQU9DLEVBQVAsQ0FBVUMsT0FBTyxDQUFDQyxPQUFsQixFQUEyQixPQUEzQixDQUFkOztBQUVBLElBQU1DLEtBQUssR0FBRyx1QkFBWSxXQUFaLENBQWQ7O0FBQ0EsSUFBSSxDQUFDTCxPQUFMLEVBQWM7QUFDWixNQUFJTSxLQUFLLEdBQUdDLE9BQU8sQ0FBQyxTQUFELENBQW5COztBQUNBLE1BQUlDLFVBQVUsR0FBR0YsS0FBSyxDQUFDRyxLQUFOLENBQVk7QUFDM0JDLElBQUFBLElBQUksRUFBUSxTQURlO0FBRTNCQyxJQUFBQSxPQUFPLEVBQUssQ0FGZTtBQUczQkMsSUFBQUEsU0FBUyxFQUFHO0FBSGUsR0FBWixDQUFqQjtBQUtEO0FBRUQ7Ozs7O0FBR0EsSUFBSUMsWUFBWSxHQUFHO0FBQ2pCLFNBQU8sWUFEVTtBQUVqQixPQUFLLDBCQUZZO0FBR2pCLFFBQU0sd0JBSFc7QUFJakIsU0FBTyxjQUpVO0FBS2pCLFVBQVEsY0FMUztBQU1qQixTQUFPLDJCQU5VO0FBT2pCLFNBQU8sZ0JBUFU7QUFRakIsU0FBTyxZQVJVO0FBU2pCLFNBQU8sZ0JBVFU7QUFVakIsVUFBUSxzQkFWUztBQVdqQixRQUFNLGFBWFc7QUFZakIsU0FBTyxpQkFaVTtBQWFqQixTQUFPLDBCQWJVO0FBY2pCLFNBQU8sMEJBZFU7QUFlakIsU0FBTyxXQWZVO0FBZ0JqQixTQUFPLHFCQWhCVTtBQWlCakIsT0FBSyxVQWpCWTtBQWtCakIsU0FBTyxtQ0FsQlU7QUFtQmpCLFFBQU0sVUFuQlc7QUFvQmpCLFNBQU8sNkJBcEJVO0FBcUJqQixXQUFTLDBCQXJCUTtBQXNCakIsU0FBTywwQkF0QlU7QUF1QmpCLFVBQVEsWUF2QlM7QUF3QmpCLFNBQU8sVUF4QlU7QUF5QmpCLFNBQU8sNEJBekJVO0FBMEJqQixTQUFPLFVBMUJVO0FBMkJqQixTQUFPLFVBM0JVO0FBNEJqQixTQUFPLFVBNUJVO0FBNkJqQixTQUFPLDhCQTdCVTtBQThCakIsU0FBTyw0QkE5QlU7QUErQmpCLFVBQVEsYUEvQlM7QUFnQ2pCLFNBQU8sZ0JBaENVO0FBaUNqQixVQUFRLGdCQWpDUztBQWtDakIsU0FBTywwQkFsQ1U7QUFtQ2pCLFNBQU8sMEJBbkNVO0FBb0NqQixTQUFPLG9CQXBDVTtBQXFDakIsU0FBTyxvQkFyQ1U7QUFzQ2pCLFNBQU8scUJBdENVO0FBdUNqQixTQUFPLG1CQXZDVTtBQXdDakIsU0FBTywwQkF4Q1U7QUF5Q2pCLFNBQU8sZ0JBekNVO0FBMENqQixTQUFPLHdCQTFDVTtBQTJDakIsU0FBTywwQkEzQ1U7QUE0Q2pCLE9BQUssZ0JBNUNZO0FBNkNqQixTQUFPLGdCQTdDVTtBQThDakIsU0FBTyxnQkE5Q1U7QUErQ2pCLFNBQU8sYUEvQ1U7QUFnRGpCLFNBQU8sZ0JBaERVO0FBaURqQixTQUFPLDBCQWpEVTtBQWtEakIsYUFBVyxvQkFsRE07QUFtRGpCLFNBQU8sV0FuRFU7QUFvRGpCLFFBQU0sb0JBcERXO0FBcURqQixPQUFLLFVBckRZO0FBc0RqQixRQUFNLFVBdERXO0FBdURqQixTQUFPLFdBdkRVO0FBd0RqQixVQUFRLFdBeERTO0FBeURqQixTQUFPLDBCQXpEVTtBQTBEakIsU0FBTyxlQTFEVTtBQTJEakIsU0FBTyxlQTNEVTtBQTREakIsU0FBTywwQkE1RFU7QUE2RGpCLFNBQU8sMEJBN0RVO0FBOERqQixVQUFRLG9CQTlEUztBQStEakIsVUFBUSw4QkEvRFM7QUFnRWpCLFVBQVEsWUFoRVM7QUFpRWpCLFNBQU8sWUFqRVU7QUFrRWpCLFFBQU0sd0JBbEVXO0FBbUVqQixVQUFRLGtCQW5FUztBQW9FakIsU0FBTyxZQXBFVTtBQXFFakIsU0FBTyxpQkFyRVU7QUFzRWpCLFNBQU8sV0F0RVU7QUF1RWpCLFNBQU8sWUF2RVU7QUF3RWpCLFlBQVUsd0JBeEVPO0FBeUVqQixVQUFRLGtCQXpFUztBQTBFakIsVUFBUSxZQTFFUztBQTJFakIsUUFBTSxZQTNFVztBQTRFakIsU0FBTyxZQTVFVTtBQTZFakIsVUFBUSxZQTdFUztBQThFakIsVUFBUSxnQkE5RVM7QUErRWpCLFNBQU8sd0JBL0VVO0FBZ0ZqQixTQUFPLGFBaEZVO0FBaUZqQixTQUFPLGlCQWpGVTtBQWtGakIsU0FBTyxZQWxGVTtBQW1GakIsU0FBTyxXQW5GVTtBQW9GakIsVUFBUSxXQXBGUztBQXFGakIsVUFBUSxZQXJGUztBQXNGakIsU0FBTyxZQXRGVTtBQXVGakIsUUFBTSxZQXZGVztBQXdGakIsU0FBTywwQkF4RlU7QUF5RmpCLFNBQU8saURBekZVO0FBMEZqQixTQUFPLGdEQTFGVTtBQTJGakIsU0FBTyx5Q0EzRlU7QUE0RmpCLFNBQU8saUJBNUZVO0FBNkZqQixPQUFLLGVBN0ZZO0FBOEZqQixTQUFPLGVBOUZVO0FBK0ZqQixTQUFPLHlCQS9GVTtBQWdHakIsU0FBTyxpQkFoR1U7QUFpR2pCLFNBQU8sNEJBakdVO0FBa0dqQixTQUFPLDBCQWxHVTtBQW1HakIsU0FBTywyQkFuR1U7QUFvR2pCLFNBQU8sMEJBcEdVO0FBcUdqQixRQUFNLG9CQXJHVztBQXNHakIsUUFBTSwyQkF0R1c7QUF1R2pCLFNBQU8sV0F2R1U7QUF3R2pCLFNBQU8seUJBeEdVO0FBeUdqQixTQUFPLHlCQXpHVTtBQTBHakIsU0FBTywrQkExR1U7QUEyR2pCLFNBQU8sK0JBM0dVO0FBNEdqQixRQUFNLHdCQTVHVztBQTZHakIsU0FBTywyQkE3R1U7QUE4R2pCLFFBQU0sc0JBOUdXO0FBK0dqQixRQUFNLGlCQS9HVztBQWdIakIsUUFBTSxzQkFoSFc7QUFpSGpCLFVBQVEsb0JBakhTO0FBa0hqQixTQUFPLHNCQWxIVTtBQW1IakIsU0FBTyw4QkFuSFU7QUFvSGpCLFFBQU0sb0JBcEhXO0FBcUhqQixTQUFPLHFCQXJIVTtBQXNIakIsVUFBUSxZQXRIUztBQXVIakIsU0FBTyxzQ0F2SFU7QUF3SGpCLFNBQU8scUJBeEhVO0FBeUhqQixTQUFPLGlCQXpIVTtBQTBIakIsUUFBTSxvQkExSFc7QUEySGpCLE9BQUssWUEzSFk7QUE0SGpCLFNBQU8sV0E1SFU7QUE2SGpCLFVBQVEsV0E3SFM7QUE4SGpCLFFBQU0sa0JBOUhXO0FBK0hqQixTQUFPLDJCQS9IVTtBQWdJakIsU0FBTyxhQWhJVTtBQWlJakIsUUFBTSwwQkFqSVc7QUFrSWpCLFNBQU8sZUFsSVU7QUFtSWpCLFVBQVEsZUFuSVM7QUFvSWpCLFNBQU8sK0JBcElVO0FBcUlqQixPQUFLLFlBcklZO0FBc0lqQixTQUFPLG1CQXRJVTtBQXVJakIsU0FBTyxtQ0F2SVU7QUF3SWpCLFNBQU8sbUJBeElVO0FBeUlqQixTQUFPLG1CQXpJVTtBQTBJakIsVUFBUSx1QkExSVM7QUEySWpCLGFBQVcsdUJBM0lNO0FBNElqQixVQUFRLFlBNUlTO0FBNklqQixTQUFPLFlBN0lVO0FBOElqQixVQUFRLFlBOUlTO0FBK0lqQixhQUFXLDBCQS9JTTtBQWdKakIsUUFBTSxZQWhKVztBQWlKakIsU0FBTyxZQWpKVTtBQWtKakIsU0FBTyxjQWxKVTtBQW1KakIsU0FBTyxrQkFuSlU7QUFvSmpCLFVBQVEsWUFwSlM7QUFxSmpCLFNBQU8sMEJBckpVO0FBc0pqQixTQUFPLGFBdEpVO0FBdUpqQixTQUFPLGdCQXZKVTtBQXdKakIsU0FBTyxnQkF4SlU7QUF5SmpCLFNBQU8sZ0JBekpVO0FBMEpqQixTQUFPLFlBMUpVO0FBMkpqQixVQUFRLHNCQTNKUztBQTRKakIsU0FBTyxpQkE1SlU7QUE2SmpCLFdBQVMsdUJBN0pRO0FBOEpqQixTQUFPLDBCQTlKVTtBQStKakIsU0FBTyxpQkEvSlU7QUFnS2pCLFNBQU8saUJBaEtVO0FBaUtqQixTQUFPLGlCQWpLVTtBQWtLakIsVUFBUSxzQkFsS1M7QUFtS2pCLFVBQVEsV0FuS1M7QUFvS2pCLFNBQU8sV0FwS1U7QUFxS2pCLFNBQU8saUJBcktVO0FBc0tqQixVQUFRLHVCQXRLUztBQXVLakIsV0FBUyx1QkF2S1E7QUF3S2pCLFNBQU8sdUJBeEtVO0FBeUtqQixTQUFPLHVCQXpLVTtBQTBLakIsU0FBTztBQTFLVSxDQUFuQjtBQTZLQSxJQUFJQyxPQUFZLEdBQUc7QUFDakJDLEVBQUFBLElBQUksRUFBRVosT0FBTyxDQUFDYSxHQUFSLENBQVlDLGNBQVosSUFBOEJkLE9BQU8sQ0FBQ2UsSUFBUixDQUFhLENBQWIsQ0FBOUIsSUFBaUQsSUFEdEM7QUFFakJDLEVBQUFBLElBQUksRUFBRWhCLE9BQU8sQ0FBQ2EsR0FBUixDQUFZSSxjQUFaLElBQThCakIsT0FBTyxDQUFDZSxJQUFSLENBQWEsQ0FBYixDQUE5QixJQUFpRCxTQUZ0QztBQUdqQkcsRUFBQUEsSUFBSSxFQUFFQSxpQkFBS0MsT0FBTCxDQUFhbkIsT0FBTyxDQUFDYSxHQUFSLENBQVlPLGNBQVosSUFBOEJwQixPQUFPLENBQUNlLElBQVIsQ0FBYSxDQUFiLENBQTlCLElBQWlELEdBQTlELENBSFc7QUFJakJNLEVBQUFBLEdBQUcsRUFBRXJCLE9BQU8sQ0FBQ2EsR0FBUixDQUFZUyxhQUFaLEtBQThCLE1BSmxCO0FBS2pCQyxFQUFBQSxRQUFRLEVBQUV2QixPQUFPLENBQUNhLEdBQVIsQ0FBWVcsa0JBQVosSUFBa0MsYUFMM0I7QUFNakJDLEVBQUFBLFVBQVUsRUFBRXpCLE9BQU8sQ0FBQ2EsR0FBUixDQUFZYSxvQkFBWixLQUFxQyxNQUFyQyxHQUE4QztBQUN4REMsSUFBQUEsUUFBUSxFQUFFM0IsT0FBTyxDQUFDYSxHQUFSLENBQVllLDZCQURrQztBQUV4REMsSUFBQUEsUUFBUSxFQUFFN0IsT0FBTyxDQUFDYSxHQUFSLENBQVlpQjtBQUZrQyxHQUE5QyxHQUdSLElBVGE7QUFVakJDLEVBQUFBLE9BQU8sRUFBRS9CLE9BQU8sQ0FBQ2EsR0FBUixDQUFZbUI7QUFWSixDQUFuQjs7QUFhQSxJQUFJLE9BQU9yQixPQUFPLENBQUNDLElBQWYsS0FBd0IsUUFBNUIsRUFBc0M7QUFDcENELEVBQUFBLE9BQU8sQ0FBQ0MsSUFBUixHQUFlcUIsUUFBUSxDQUFDdEIsT0FBTyxDQUFDQyxJQUFULENBQVIsSUFBMEIsSUFBekM7QUFDRDs7QUFFRCxJQUFJLE9BQU9ELE9BQU8sQ0FBQ29CLE9BQWYsS0FBMkIsUUFBM0IsSUFBdUNwQixPQUFPLENBQUNvQixPQUFSLEtBQW9CLEVBQS9ELEVBQW1FO0FBQ2pFLE1BQUk7QUFDRixRQUFJRyxXQUFXLEdBQUdDLGVBQUdDLFlBQUgsQ0FBZ0JsQixpQkFBS21CLElBQUwsQ0FBVXJDLE9BQU8sQ0FBQ2EsR0FBUixDQUFZeUIsUUFBdEIsRUFBZ0MsYUFBaEMsQ0FBaEIsRUFBZ0VDLFFBQWhFLEVBQWxCLENBREUsQ0FFRjs7O0FBQ0FMLElBQUFBLFdBQVcsR0FBR0EsV0FBVyxDQUFDTSxPQUFaLENBQW9CLFdBQXBCLEVBQWlDLE9BQWpDLENBQWQsQ0FIRSxDQUlGOztBQUNBLFFBQUlDLElBQUksR0FBR0MsSUFBSSxDQUFDQyxLQUFMLENBQVdULFdBQVgsQ0FBWDtBQUNBdkIsSUFBQUEsT0FBTyxDQUFDaUMsYUFBUixHQUF3QkgsSUFBSSxDQUFDSSxVQUE3QjtBQUNELEdBUEQsQ0FPRSxPQUFPQyxDQUFQLEVBQVU7QUFDVkMsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksaUNBQVo7QUFDRDtBQUNGLEMsQ0FFRDs7O0FBQ0FDLGlCQUFLQyxZQUFMLENBQWtCLFVBQVVDLE9BQVYsRUFBbUJDLFFBQW5CLEVBQTZCO0FBQzdDLE1BQUl6QyxPQUFPLENBQUNjLFVBQVosRUFBd0I7QUFDdEIsUUFBSSxDQUFDMEIsT0FBTyxDQUFDRSxPQUFSLENBQWdCQyxhQUFqQixJQUFrQ0gsT0FBTyxDQUFDRSxPQUFSLENBQWdCQyxhQUFoQixDQUE4QkMsT0FBOUIsQ0FBc0MsUUFBdEMsTUFBb0QsQ0FBQyxDQUEzRixFQUE4RjtBQUM1RixhQUFPQyxxQkFBcUIsQ0FBQ0osUUFBRCxDQUE1QjtBQUNEOztBQUVELFFBQUlLLElBQUksR0FBR0MsY0FBYyxDQUFDUCxPQUFPLENBQUNFLE9BQVIsQ0FBZ0JDLGFBQWpCLENBQXpCOztBQUNBLFFBQUlHLElBQUksQ0FBQzlCLFFBQUwsS0FBa0JoQixPQUFPLENBQUNjLFVBQVIsQ0FBbUJFLFFBQXJDLElBQWlEOEIsSUFBSSxDQUFDNUIsUUFBTCxLQUFrQmxCLE9BQU8sQ0FBQ2MsVUFBUixDQUFtQkksUUFBMUYsRUFBb0c7QUFDbEcsYUFBTzJCLHFCQUFxQixDQUFDSixRQUFELENBQTVCO0FBQ0Q7QUFDRjs7QUFFRE8sRUFBQUEsU0FBUyxDQUFDUixPQUFPLENBQUNTLEdBQVQsRUFBY1QsT0FBZCxFQUF1QkMsUUFBdkIsQ0FBVDtBQUVELENBZEQsRUFjR1MsTUFkSCxDQWNVbEQsT0FBTyxDQUFDQyxJQWRsQixFQWN3QkQsT0FBTyxDQUFDSyxJQWRoQyxFQWNzQyxZQUFZO0FBQ2hEO0FBQ0U7QUFDQTtBQUNGO0FBQ0ErQixFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxnQ0FBWixFQUE4Q3JDLE9BQU8sQ0FBQ08sSUFBdEQsRUFBNERQLE9BQU8sQ0FBQ0ssSUFBcEUsRUFBMEVMLE9BQU8sQ0FBQ0MsSUFBbEY7QUFDRCxDQXBCRDs7QUFzQkEsU0FBUytDLFNBQVQsQ0FBbUJHLEdBQW5CLEVBQXdCWCxPQUF4QixFQUFpQ0MsUUFBakMsRUFBMkM7QUFDekMsTUFBSVcsSUFBSSxHQUFHQyxrQkFBa0IsQ0FBQ0osZ0JBQUlqQixLQUFKLENBQVVtQixHQUFHLElBQUlYLE9BQU8sQ0FBQ1MsR0FBekIsRUFBOEJLLFFBQS9CLENBQTdCOztBQUVBLE1BQUlGLElBQUksS0FBSyxHQUFULElBQWdCQSxJQUFJLEtBQUssRUFBN0IsRUFBaUM7QUFDL0JBLElBQUFBLElBQUksR0FBR3BELE9BQU8sQ0FBQ1ksUUFBZjtBQUNBNEIsSUFBQUEsT0FBTyxDQUFDZSxZQUFSLEdBQXVCLElBQXZCO0FBQ0Q7O0FBQ0QsTUFBSUMsUUFBUSxHQUFHakQsaUJBQUtDLE9BQUwsQ0FBYVIsT0FBTyxDQUFDTyxJQUFSLEdBQWU2QyxJQUE1QixDQUFmLENBUHlDLENBU3pDO0FBQ0E7OztBQUNBLE1BQUlJLFFBQVEsQ0FBQ1osT0FBVCxDQUFpQjVDLE9BQU8sQ0FBQ08sSUFBekIsTUFBbUMsQ0FBdkMsRUFBMEM7QUFDeENrQyxJQUFBQSxRQUFRLENBQUNnQixTQUFULENBQW1CLEdBQW5CLEVBQXdCO0FBQUUsc0JBQWdCO0FBQWxCLEtBQXhCO0FBQ0EsV0FBT2hCLFFBQVEsQ0FBQ2lCLEdBQVQsQ0FBYSxlQUFiLENBQVA7QUFDRDs7QUFFRCxNQUFJQyxXQUFXLEdBQUc1RCxZQUFZLENBQUN5RCxRQUFRLENBQUNJLEtBQVQsQ0FBZSxHQUFmLEVBQW9CQyxHQUFwQixHQUEwQkMsV0FBMUIsRUFBRCxDQUFaLElBQXlELFlBQTNFOztBQUVBdEMsaUJBQUd1QyxRQUFILENBQVlQLFFBQVosRUFBc0IsVUFBVVEsS0FBVixFQUFpQkMsT0FBakIsRUFBK0I7QUFDbkQsUUFBSUQsS0FBSixFQUFXO0FBQ1QsVUFBSyxDQUFDaEUsT0FBTyxDQUFDVSxHQUFULElBQWdCOEIsT0FBTyxDQUFDZSxZQUE3QixFQUE0QztBQUMxQ25CLFFBQUFBLE9BQU8sQ0FBQzRCLEtBQVIsQ0FBYyx1REFBZCxFQUNjLElBQUlFLElBQUosRUFEZCxFQUMwQlYsUUFEMUIsRUFDb0NHLFdBRHBDLEVBQ2lESyxLQUFLLENBQUNHLE9BQU4sSUFBaUJILEtBRGxFO0FBRUQ7O0FBQ0QsVUFBSSxDQUFDOUUsT0FBTCxFQUNFUSxVQUFVLENBQUMwRSxJQUFYOztBQUNGLFVBQUlKLEtBQUssQ0FBQ0ssSUFBTixLQUFlLFFBQW5CLEVBQTZCO0FBQzNCLFlBQUlyRSxPQUFPLENBQUNVLEdBQVIsSUFBZSxDQUFDOEIsT0FBTyxDQUFDZSxZQUE1QixFQUEwQztBQUN4Q2YsVUFBQUEsT0FBTyxDQUFDZSxZQUFSLEdBQXVCLElBQXZCO0FBQ0EsaUJBQU9QLFNBQVMsWUFBS3pDLGlCQUFLK0QsUUFBTCxDQUFjbEIsSUFBZCxDQUFMLEdBQTRCWixPQUE1QixFQUFxQ0MsUUFBckMsQ0FBaEI7QUFDRCxTQUhELE1BR08sSUFBSXpDLE9BQU8sQ0FBQ1UsR0FBUixJQUFlMEMsSUFBSSxLQUFLcEQsT0FBTyxDQUFDWSxRQUFwQyxFQUE4QztBQUNuRCxpQkFBT29DLFNBQVMsQ0FBQ2hELE9BQU8sQ0FBQ1ksUUFBVCxFQUFtQjRCLE9BQW5CLEVBQTRCQyxRQUE1QixDQUFoQjtBQUNEOztBQUNEakIsdUJBQUd1QyxRQUFILENBQVkvRCxPQUFPLENBQUNPLElBQVIsR0FBZSxXQUEzQixFQUF3QyxVQUFVZ0UsR0FBVixFQUFlTixPQUFmLEVBQTZCO0FBQ25FQSxVQUFBQSxPQUFPLEdBQUdNLEdBQUcsR0FBRyxlQUFILEdBQXFCTixPQUFsQztBQUNBeEIsVUFBQUEsUUFBUSxDQUFDZ0IsU0FBVCxDQUFtQixHQUFuQixFQUF3QjtBQUFFLDRCQUFnQjtBQUFsQixXQUF4QjtBQUNBLGlCQUFPaEIsUUFBUSxDQUFDaUIsR0FBVCxDQUFhTyxPQUFiLEVBQXNCLE9BQXRCLENBQVA7QUFDRCxTQUpEOztBQUtBO0FBQ0Q7O0FBQ0R4QixNQUFBQSxRQUFRLENBQUNnQixTQUFULENBQW1CLEdBQW5CO0FBQ0EsYUFBT2hCLFFBQVEsQ0FBQ2lCLEdBQVQsQ0FBYSxpREFBaURNLEtBQUssQ0FBQ0ssSUFBdkQsR0FBOEQsT0FBM0UsQ0FBUDtBQUNEOztBQUNENUIsSUFBQUEsUUFBUSxDQUFDZ0IsU0FBVCxDQUFtQixHQUFuQixFQUF3QjtBQUFFLHNCQUFnQkU7QUFBbEIsS0FBeEI7O0FBQ0EsUUFBSTNELE9BQU8sQ0FBQ2lDLGFBQVIsSUFBeUIwQixXQUFXLEtBQUssV0FBN0MsRUFBMEQ7QUFDeERNLE1BQUFBLE9BQU8sR0FBR0EsT0FBTyxDQUFDckMsUUFBUixHQUFtQkMsT0FBbkIsQ0FBMkIsU0FBM0IsNlZBU0c3QixPQUFPLENBQUNpQyxhQVRYLHVDQVVRakMsT0FBTyxDQUFDb0IsT0FWaEIsK0VBQVY7QUFpQkQ7O0FBQ0RxQixJQUFBQSxRQUFRLENBQUNpQixHQUFULENBQWFPLE9BQWIsRUFBc0IsT0FBdEI7QUFDQTFFLElBQUFBLEtBQUssQ0FBQyxzQ0FBRCxFQUF5QzJFLElBQUksQ0FBQ00sR0FBTCxFQUF6QyxFQUFxRGhCLFFBQXJELEVBQStERyxXQUEvRCxDQUFMO0FBQ0QsR0EvQ0Q7QUFnREQ7O0FBRUQsU0FBU1osY0FBVCxDQUF3QjBCLElBQXhCLEVBQThCO0FBQzVCO0FBQ0EsTUFBSUMsR0FBRyxHQUFHRCxJQUFJLENBQUNiLEtBQUwsQ0FBVyxHQUFYLENBQVY7QUFFQSxNQUFJZSxHQUFHLEdBQUdDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZSCxHQUFHLENBQUMsQ0FBRCxDQUFmLEVBQW9CLFFBQXBCLENBQVY7QUFDQSxNQUFJSSxLQUFLLEdBQUdILEdBQUcsQ0FBQy9DLFFBQUosRUFBWjtBQUVBLE1BQUltRCxLQUFLLEdBQUdELEtBQUssQ0FBQ2xCLEtBQU4sQ0FBWSxHQUFaLENBQVo7QUFDQSxTQUFPO0FBQ0w1QyxJQUFBQSxRQUFRLEVBQUUrRCxLQUFLLENBQUMsQ0FBRCxDQURWO0FBRUw3RCxJQUFBQSxRQUFRLEVBQUU2RCxLQUFLLENBQUMsQ0FBRDtBQUZWLEdBQVA7QUFJRDs7QUFFRCxTQUFTbEMscUJBQVQsQ0FBK0JKLFFBQS9CLEVBQXlDO0FBQ3ZDQSxFQUFBQSxRQUFRLENBQUNnQixTQUFULENBQW1CLEdBQW5CLEVBQXdCO0FBQ3RCLG9CQUFnQixXQURNO0FBRXRCLHdCQUFvQjtBQUZFLEdBQXhCO0FBSUEsU0FBT2hCLFFBQVEsQ0FBQ2lCLEdBQVQsQ0FBYSxrQkFBYixDQUFQO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCB1cmwgZnJvbSAndXJsJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGRlYnVnTG9nZ2VyIGZyb20gJ2RlYnVnJ1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xuXG52YXIgaXNOb2RlNCA9IHNlbXZlci5sdChwcm9jZXNzLnZlcnNpb24sICc2LjAuMCcpXG5cbmNvbnN0IGRlYnVnID0gZGVidWdMb2dnZXIoJ3BtMjpzZXJ2ZScpO1xuaWYgKCFpc05vZGU0KSB7XG4gIHZhciBwcm9iZSA9IHJlcXVpcmUoJ0BwbTIvaW8nKTtcbiAgdmFyIGVycm9yTWV0ZXIgPSBwcm9iZS5tZXRlcih7XG4gICAgbmFtZSAgICAgIDogJzQwNC9zZWMnLFxuICAgIHNhbXBsZXMgICA6IDEsXG4gICAgdGltZWZyYW1lIDogNjBcbiAgfSlcbn1cblxuLyoqXG4gKiBsaXN0IG9mIHN1cHBvcnRlZCBjb250ZW50IHR5cGVzLlxuICovXG52YXIgY29udGVudFR5cGVzID0ge1xuICAnM2dwJzogJ3ZpZGVvLzNncHAnLFxuICAnYSc6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nLFxuICAnYWknOiAnYXBwbGljYXRpb24vcG9zdHNjcmlwdCcsXG4gICdhaWYnOiAnYXVkaW8veC1haWZmJyxcbiAgJ2FpZmYnOiAnYXVkaW8veC1haWZmJyxcbiAgJ2FzYyc6ICdhcHBsaWNhdGlvbi9wZ3Atc2lnbmF0dXJlJyxcbiAgJ2FzZic6ICd2aWRlby94LW1zLWFzZicsXG4gICdhc20nOiAndGV4dC94LWFzbScsXG4gICdhc3gnOiAndmlkZW8veC1tcy1hc2YnLFxuICAnYXRvbSc6ICdhcHBsaWNhdGlvbi9hdG9tK3htbCcsXG4gICdhdSc6ICdhdWRpby9iYXNpYycsXG4gICdhdmknOiAndmlkZW8veC1tc3ZpZGVvJyxcbiAgJ2JhdCc6ICdhcHBsaWNhdGlvbi94LW1zZG93bmxvYWQnLFxuICAnYmluJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXG4gICdibXAnOiAnaW1hZ2UvYm1wJyxcbiAgJ2J6Mic6ICdhcHBsaWNhdGlvbi94LWJ6aXAyJyxcbiAgJ2MnOiAndGV4dC94LWMnLFxuICAnY2FiJzogJ2FwcGxpY2F0aW9uL3ZuZC5tcy1jYWItY29tcHJlc3NlZCcsXG4gICdjYyc6ICd0ZXh0L3gtYycsXG4gICdjaG0nOiAnYXBwbGljYXRpb24vdm5kLm1zLWh0bWxoZWxwJyxcbiAgJ2NsYXNzJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXG4gICdjb20nOiAnYXBwbGljYXRpb24veC1tc2Rvd25sb2FkJyxcbiAgJ2NvbmYnOiAndGV4dC9wbGFpbicsXG4gICdjcHAnOiAndGV4dC94LWMnLFxuICAnY3J0JzogJ2FwcGxpY2F0aW9uL3gteDUwOS1jYS1jZXJ0JyxcbiAgJ2Nzcyc6ICd0ZXh0L2NzcycsXG4gICdjc3YnOiAndGV4dC9jc3YnLFxuICAnY3h4JzogJ3RleHQveC1jJyxcbiAgJ2RlYic6ICdhcHBsaWNhdGlvbi94LWRlYmlhbi1wYWNrYWdlJyxcbiAgJ2Rlcic6ICdhcHBsaWNhdGlvbi94LXg1MDktY2EtY2VydCcsXG4gICdkaWZmJzogJ3RleHQveC1kaWZmJyxcbiAgJ2Rqdic6ICdpbWFnZS92bmQuZGp2dScsXG4gICdkanZ1JzogJ2ltYWdlL3ZuZC5kanZ1JyxcbiAgJ2RsbCc6ICdhcHBsaWNhdGlvbi94LW1zZG93bmxvYWQnLFxuICAnZG1nJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXG4gICdkb2MnOiAnYXBwbGljYXRpb24vbXN3b3JkJyxcbiAgJ2RvdCc6ICdhcHBsaWNhdGlvbi9tc3dvcmQnLFxuICAnZHRkJzogJ2FwcGxpY2F0aW9uL3htbC1kdGQnLFxuICAnZHZpJzogJ2FwcGxpY2F0aW9uL3gtZHZpJyxcbiAgJ2Vhcic6ICdhcHBsaWNhdGlvbi9qYXZhLWFyY2hpdmUnLFxuICAnZW1sJzogJ21lc3NhZ2UvcmZjODIyJyxcbiAgJ2Vwcyc6ICdhcHBsaWNhdGlvbi9wb3N0c2NyaXB0JyxcbiAgJ2V4ZSc6ICdhcHBsaWNhdGlvbi94LW1zZG93bmxvYWQnLFxuICAnZic6ICd0ZXh0L3gtZm9ydHJhbicsXG4gICdmNzcnOiAndGV4dC94LWZvcnRyYW4nLFxuICAnZjkwJzogJ3RleHQveC1mb3J0cmFuJyxcbiAgJ2Zsdic6ICd2aWRlby94LWZsdicsXG4gICdmb3InOiAndGV4dC94LWZvcnRyYW4nLFxuICAnZ2VtJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXG4gICdnZW1zcGVjJzogJ3RleHQveC1zY3JpcHQucnVieScsXG4gICdnaWYnOiAnaW1hZ2UvZ2lmJyxcbiAgJ2d6JzogJ2FwcGxpY2F0aW9uL3gtZ3ppcCcsXG4gICdoJzogJ3RleHQveC1jJyxcbiAgJ2hoJzogJ3RleHQveC1jJyxcbiAgJ2h0bSc6ICd0ZXh0L2h0bWwnLFxuICAnaHRtbCc6ICd0ZXh0L2h0bWwnLFxuICAnaWNvJzogJ2ltYWdlL3ZuZC5taWNyb3NvZnQuaWNvbicsXG4gICdpY3MnOiAndGV4dC9jYWxlbmRhcicsXG4gICdpZmInOiAndGV4dC9jYWxlbmRhcicsXG4gICdpc28nOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyxcbiAgJ2phcic6ICdhcHBsaWNhdGlvbi9qYXZhLWFyY2hpdmUnLFxuICAnamF2YSc6ICd0ZXh0L3gtamF2YS1zb3VyY2UnLFxuICAnam5scCc6ICdhcHBsaWNhdGlvbi94LWphdmEtam5scC1maWxlJyxcbiAgJ2pwZWcnOiAnaW1hZ2UvanBlZycsXG4gICdqcGcnOiAnaW1hZ2UvanBlZycsXG4gICdqcyc6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JyxcbiAgJ2pzb24nOiAnYXBwbGljYXRpb24vanNvbicsXG4gICdsb2cnOiAndGV4dC9wbGFpbicsXG4gICdtM3UnOiAnYXVkaW8veC1tcGVndXJsJyxcbiAgJ200dic6ICd2aWRlby9tcDQnLFxuICAnbWFuJzogJ3RleHQvdHJvZmYnLFxuICAnbWF0aG1sJzogJ2FwcGxpY2F0aW9uL21hdGhtbCt4bWwnLFxuICAnbWJveCc6ICdhcHBsaWNhdGlvbi9tYm94JyxcbiAgJ21kb2MnOiAndGV4dC90cm9mZicsXG4gICdtZSc6ICd0ZXh0L3Ryb2ZmJyxcbiAgJ21pZCc6ICdhdWRpby9taWRpJyxcbiAgJ21pZGknOiAnYXVkaW8vbWlkaScsXG4gICdtaW1lJzogJ21lc3NhZ2UvcmZjODIyJyxcbiAgJ21tbCc6ICdhcHBsaWNhdGlvbi9tYXRobWwreG1sJyxcbiAgJ21uZyc6ICd2aWRlby94LW1uZycsXG4gICdtb3YnOiAndmlkZW8vcXVpY2t0aW1lJyxcbiAgJ21wMyc6ICdhdWRpby9tcGVnJyxcbiAgJ21wNCc6ICd2aWRlby9tcDQnLFxuICAnbXA0dic6ICd2aWRlby9tcDQnLFxuICAnbXBlZyc6ICd2aWRlby9tcGVnJyxcbiAgJ21wZyc6ICd2aWRlby9tcGVnJyxcbiAgJ21zJzogJ3RleHQvdHJvZmYnLFxuICAnbXNpJzogJ2FwcGxpY2F0aW9uL3gtbXNkb3dubG9hZCcsXG4gICdvZHAnOiAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5wcmVzZW50YXRpb24nLFxuICAnb2RzJzogJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuc3ByZWFkc2hlZXQnLFxuICAnb2R0JzogJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQudGV4dCcsXG4gICdvZ2cnOiAnYXBwbGljYXRpb24vb2dnJyxcbiAgJ3AnOiAndGV4dC94LXBhc2NhbCcsXG4gICdwYXMnOiAndGV4dC94LXBhc2NhbCcsXG4gICdwYm0nOiAnaW1hZ2UveC1wb3J0YWJsZS1iaXRtYXAnLFxuICAncGRmJzogJ2FwcGxpY2F0aW9uL3BkZicsXG4gICdwZW0nOiAnYXBwbGljYXRpb24veC14NTA5LWNhLWNlcnQnLFxuICAncGdtJzogJ2ltYWdlL3gtcG9ydGFibGUtZ3JheW1hcCcsXG4gICdwZ3AnOiAnYXBwbGljYXRpb24vcGdwLWVuY3J5cHRlZCcsXG4gICdwa2cnOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyxcbiAgJ3BsJzogJ3RleHQveC1zY3JpcHQucGVybCcsXG4gICdwbSc6ICd0ZXh0L3gtc2NyaXB0LnBlcmwtbW9kdWxlJyxcbiAgJ3BuZyc6ICdpbWFnZS9wbmcnLFxuICAncG5tJzogJ2ltYWdlL3gtcG9ydGFibGUtYW55bWFwJyxcbiAgJ3BwbSc6ICdpbWFnZS94LXBvcnRhYmxlLXBpeG1hcCcsXG4gICdwcHMnOiAnYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQnLFxuICAncHB0JzogJ2FwcGxpY2F0aW9uL3ZuZC5tcy1wb3dlcnBvaW50JyxcbiAgJ3BzJzogJ2FwcGxpY2F0aW9uL3Bvc3RzY3JpcHQnLFxuICAncHNkJzogJ2ltYWdlL3ZuZC5hZG9iZS5waG90b3Nob3AnLFxuICAncHknOiAndGV4dC94LXNjcmlwdC5weXRob24nLFxuICAncXQnOiAndmlkZW8vcXVpY2t0aW1lJyxcbiAgJ3JhJzogJ2F1ZGlvL3gtcG4tcmVhbGF1ZGlvJyxcbiAgJ3Jha2UnOiAndGV4dC94LXNjcmlwdC5ydWJ5JyxcbiAgJ3JhbSc6ICdhdWRpby94LXBuLXJlYWxhdWRpbycsXG4gICdyYXInOiAnYXBwbGljYXRpb24veC1yYXItY29tcHJlc3NlZCcsXG4gICdyYic6ICd0ZXh0L3gtc2NyaXB0LnJ1YnknLFxuICAncmRmJzogJ2FwcGxpY2F0aW9uL3JkZit4bWwnLFxuICAncm9mZic6ICd0ZXh0L3Ryb2ZmJyxcbiAgJ3JwbSc6ICdhcHBsaWNhdGlvbi94LXJlZGhhdC1wYWNrYWdlLW1hbmFnZXInLFxuICAncnNzJzogJ2FwcGxpY2F0aW9uL3Jzcyt4bWwnLFxuICAncnRmJzogJ2FwcGxpY2F0aW9uL3J0ZicsXG4gICdydSc6ICd0ZXh0L3gtc2NyaXB0LnJ1YnknLFxuICAncyc6ICd0ZXh0L3gtYXNtJyxcbiAgJ3NnbSc6ICd0ZXh0L3NnbWwnLFxuICAnc2dtbCc6ICd0ZXh0L3NnbWwnLFxuICAnc2gnOiAnYXBwbGljYXRpb24veC1zaCcsXG4gICdzaWcnOiAnYXBwbGljYXRpb24vcGdwLXNpZ25hdHVyZScsXG4gICdzbmQnOiAnYXVkaW8vYmFzaWMnLFxuICAnc28nOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyxcbiAgJ3N2Zyc6ICdpbWFnZS9zdmcreG1sJyxcbiAgJ3N2Z3onOiAnaW1hZ2Uvc3ZnK3htbCcsXG4gICdzd2YnOiAnYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2gnLFxuICAndCc6ICd0ZXh0L3Ryb2ZmJyxcbiAgJ3Rhcic6ICdhcHBsaWNhdGlvbi94LXRhcicsXG4gICd0YnonOiAnYXBwbGljYXRpb24veC1iemlwLWNvbXByZXNzZWQtdGFyJyxcbiAgJ3RjbCc6ICdhcHBsaWNhdGlvbi94LXRjbCcsXG4gICd0ZXgnOiAnYXBwbGljYXRpb24veC10ZXgnLFxuICAndGV4aSc6ICdhcHBsaWNhdGlvbi94LXRleGluZm8nLFxuICAndGV4aW5mbyc6ICdhcHBsaWNhdGlvbi94LXRleGluZm8nLFxuICAndGV4dCc6ICd0ZXh0L3BsYWluJyxcbiAgJ3RpZic6ICdpbWFnZS90aWZmJyxcbiAgJ3RpZmYnOiAnaW1hZ2UvdGlmZicsXG4gICd0b3JyZW50JzogJ2FwcGxpY2F0aW9uL3gtYml0dG9ycmVudCcsXG4gICd0cic6ICd0ZXh0L3Ryb2ZmJyxcbiAgJ3R4dCc6ICd0ZXh0L3BsYWluJyxcbiAgJ3ZjZic6ICd0ZXh0L3gtdmNhcmQnLFxuICAndmNzJzogJ3RleHQveC12Y2FsZW5kYXInLFxuICAndnJtbCc6ICdtb2RlbC92cm1sJyxcbiAgJ3dhcic6ICdhcHBsaWNhdGlvbi9qYXZhLWFyY2hpdmUnLFxuICAnd2F2JzogJ2F1ZGlvL3gtd2F2JyxcbiAgJ3dtYSc6ICdhdWRpby94LW1zLXdtYScsXG4gICd3bXYnOiAndmlkZW8veC1tcy13bXYnLFxuICAnd214JzogJ3ZpZGVvL3gtbXMtd214JyxcbiAgJ3dybCc6ICdtb2RlbC92cm1sJyxcbiAgJ3dzZGwnOiAnYXBwbGljYXRpb24vd3NkbCt4bWwnLFxuICAneGJtJzogJ2ltYWdlL3gteGJpdG1hcCcsXG4gICd4aHRtbCc6ICdhcHBsaWNhdGlvbi94aHRtbCt4bWwnLFxuICAneGxzJzogJ2FwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbCcsXG4gICd4bWwnOiAnYXBwbGljYXRpb24veG1sJyxcbiAgJ3hwbSc6ICdpbWFnZS94LXhwaXhtYXAnLFxuICAneHNsJzogJ2FwcGxpY2F0aW9uL3htbCcsXG4gICd4c2x0JzogJ2FwcGxpY2F0aW9uL3hzbHQreG1sJyxcbiAgJ3lhbWwnOiAndGV4dC95YW1sJyxcbiAgJ3ltbCc6ICd0ZXh0L3lhbWwnLFxuICAnemlwJzogJ2FwcGxpY2F0aW9uL3ppcCcsXG4gICd3b2ZmJzogJ2FwcGxpY2F0aW9uL2ZvbnQtd29mZicsXG4gICd3b2ZmMic6ICdhcHBsaWNhdGlvbi9mb250LXdvZmYnLFxuICAnb3RmJzogJ2FwcGxpY2F0aW9uL2ZvbnQtc2ZudCcsXG4gICdvdGMnOiAnYXBwbGljYXRpb24vZm9udC1zZm50JyxcbiAgJ3R0Zic6ICdhcHBsaWNhdGlvbi9mb250LXNmbnQnXG59O1xuXG52YXIgb3B0aW9uczogYW55ID0ge1xuICBwb3J0OiBwcm9jZXNzLmVudi5QTTJfU0VSVkVfUE9SVCB8fCBwcm9jZXNzLmFyZ3ZbM10gfHwgODA4MCxcbiAgaG9zdDogcHJvY2Vzcy5lbnYuUE0yX1NFUlZFX0hPU1QgfHwgcHJvY2Vzcy5hcmd2WzRdIHx8ICcwLjAuMC4wJyxcbiAgcGF0aDogcGF0aC5yZXNvbHZlKHByb2Nlc3MuZW52LlBNMl9TRVJWRV9QQVRIIHx8IHByb2Nlc3MuYXJndlsyXSB8fCAnLicpLFxuICBzcGE6IHByb2Nlc3MuZW52LlBNMl9TRVJWRV9TUEEgPT09ICd0cnVlJyxcbiAgaG9tZXBhZ2U6IHByb2Nlc3MuZW52LlBNMl9TRVJWRV9IT01FUEFHRSB8fCAnL2luZGV4Lmh0bWwnLFxuICBiYXNpY19hdXRoOiBwcm9jZXNzLmVudi5QTTJfU0VSVkVfQkFTSUNfQVVUSCA9PT0gJ3RydWUnID8ge1xuICAgIHVzZXJuYW1lOiBwcm9jZXNzLmVudi5QTTJfU0VSVkVfQkFTSUNfQVVUSF9VU0VSTkFNRSxcbiAgICBwYXNzd29yZDogcHJvY2Vzcy5lbnYuUE0yX1NFUlZFX0JBU0lDX0FVVEhfUEFTU1dPUkRcbiAgfSA6IG51bGwsXG4gIG1vbml0b3I6IHByb2Nlc3MuZW52LlBNMl9TRVJWRV9NT05JVE9SXG59O1xuXG5pZiAodHlwZW9mIG9wdGlvbnMucG9ydCA9PT0gJ3N0cmluZycpIHtcbiAgb3B0aW9ucy5wb3J0ID0gcGFyc2VJbnQob3B0aW9ucy5wb3J0KSB8fCA4MDgwXG59XG5cbmlmICh0eXBlb2Ygb3B0aW9ucy5tb25pdG9yID09PSAnc3RyaW5nJyAmJiBvcHRpb25zLm1vbml0b3IgIT09ICcnKSB7XG4gIHRyeSB7XG4gICAgbGV0IGZpbGVDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihwcm9jZXNzLmVudi5QTTJfSE9NRSwgJ2FnZW50Lmpzb241JykpLnRvU3RyaW5nKClcbiAgICAvLyBIYW5kbGUgb2xkIGNvbmZpZ3VyYXRpb24gd2l0aCBqc29uNVxuICAgIGZpbGVDb250ZW50ID0gZmlsZUNvbnRlbnQucmVwbGFjZSgvXFxzKFxcdyspOi9nLCAnXCIkMVwiOicpXG4gICAgLy8gcGFyc2VcbiAgICBsZXQgY29uZiA9IEpTT04ucGFyc2UoZmlsZUNvbnRlbnQpXG4gICAgb3B0aW9ucy5tb25pdG9yQnVja2V0ID0gY29uZi5wdWJsaWNfa2V5XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmxvZygnSW50ZXJhY3Rpb24gZmlsZSBkb2VzIG5vdCBleGlzdCcpXG4gIH1cbn1cblxuLy8gc3RhcnQgYW4gSFRUUCBzZXJ2ZXJcbmh0dHAuY3JlYXRlU2VydmVyKGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuICBpZiAob3B0aW9ucy5iYXNpY19hdXRoKSB7XG4gICAgaWYgKCFyZXF1ZXN0LmhlYWRlcnMuYXV0aG9yaXphdGlvbiB8fCByZXF1ZXN0LmhlYWRlcnMuYXV0aG9yaXphdGlvbi5pbmRleE9mKCdCYXNpYyAnKSA9PT0gLTEpIHtcbiAgICAgIHJldHVybiBzZW5kQmFzaWNBdXRoUmVzcG9uc2UocmVzcG9uc2UpXG4gICAgfVxuXG4gICAgdmFyIHVzZXIgPSBwYXJzZUJhc2ljQXV0aChyZXF1ZXN0LmhlYWRlcnMuYXV0aG9yaXphdGlvbilcbiAgICBpZiAodXNlci51c2VybmFtZSAhPT0gb3B0aW9ucy5iYXNpY19hdXRoLnVzZXJuYW1lIHx8IHVzZXIucGFzc3dvcmQgIT09IG9wdGlvbnMuYmFzaWNfYXV0aC5wYXNzd29yZCkge1xuICAgICAgcmV0dXJuIHNlbmRCYXNpY0F1dGhSZXNwb25zZShyZXNwb25zZSlcbiAgICB9XG4gIH1cblxuICBzZXJ2ZUZpbGUocmVxdWVzdC51cmwsIHJlcXVlc3QsIHJlc3BvbnNlKTtcblxufSkubGlzdGVuKG9wdGlvbnMucG9ydCwgb3B0aW9ucy5ob3N0LCBmdW5jdGlvbiAoKSB7XG4gIC8vIGlmIChlcnIpIHtcbiAgICAvLyBjb25zb2xlLmVycm9yKGVycik7XG4gICAgLy8gcHJvY2Vzcy5leGl0KDEpO1xuICAvLyB9XG4gIGNvbnNvbGUubG9nKCdFeHBvc2luZyAlcyBkaXJlY3Rvcnkgb24gJXM6JWQnLCBvcHRpb25zLnBhdGgsIG9wdGlvbnMuaG9zdCwgb3B0aW9ucy5wb3J0KTtcbn0pO1xuXG5mdW5jdGlvbiBzZXJ2ZUZpbGUodXJpLCByZXF1ZXN0LCByZXNwb25zZSkge1xuICB2YXIgZmlsZSA9IGRlY29kZVVSSUNvbXBvbmVudCh1cmwucGFyc2UodXJpIHx8IHJlcXVlc3QudXJsKS5wYXRobmFtZSk7XG5cbiAgaWYgKGZpbGUgPT09ICcvJyB8fCBmaWxlID09PSAnJykge1xuICAgIGZpbGUgPSBvcHRpb25zLmhvbWVwYWdlO1xuICAgIHJlcXVlc3Qud2FudEhvbWVwYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUob3B0aW9ucy5wYXRoICsgZmlsZSk7XG5cbiAgLy8gc2luY2Ugd2UgY2FsbCBmaWxlc3lzdGVtIGRpcmVjdGx5IHNvIHdlIG5lZWQgdG8gdmVyaWZ5IHRoYXQgdGhlXG4gIC8vIHVybCBkb2Vzbid0IGdvIG91dHNpZGUgdGhlIHNlcnZlIHBhdGhcbiAgaWYgKGZpbGVQYXRoLmluZGV4T2Yob3B0aW9ucy5wYXRoKSAhPT0gMCkge1xuICAgIHJlc3BvbnNlLndyaXRlSGVhZCg0MDMsIHsgJ0NvbnRlbnQtVHlwZSc6ICd0ZXh0L2h0bWwnIH0pO1xuICAgIHJldHVybiByZXNwb25zZS5lbmQoJzQwMyBGb3JiaWRkZW4nKTtcbiAgfVxuXG4gIHZhciBjb250ZW50VHlwZSA9IGNvbnRlbnRUeXBlc1tmaWxlUGF0aC5zcGxpdCgnLicpLnBvcCgpLnRvTG93ZXJDYXNlKCldIHx8ICd0ZXh0L3BsYWluJztcblxuICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgZnVuY3Rpb24gKGVycm9yLCBjb250ZW50OiBhbnkpIHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGlmICgoIW9wdGlvbnMuc3BhIHx8IHJlcXVlc3Qud2FudEhvbWVwYWdlKSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdbJXNdIEVycm9yIHdoaWxlIHNlcnZpbmcgJXMgd2l0aCBjb250ZW50LXR5cGUgJXMgOiAlcycsXG4gICAgICAgICAgICAgICAgICAgICAgbmV3IERhdGUoKSwgZmlsZVBhdGgsIGNvbnRlbnRUeXBlLCBlcnJvci5tZXNzYWdlIHx8IGVycm9yKTtcbiAgICAgIH1cbiAgICAgIGlmICghaXNOb2RlNClcbiAgICAgICAgZXJyb3JNZXRlci5tYXJrKCk7XG4gICAgICBpZiAoZXJyb3IuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuc3BhICYmICFyZXF1ZXN0LndhbnRIb21lcGFnZSkge1xuICAgICAgICAgIHJlcXVlc3Qud2FudEhvbWVwYWdlID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm4gc2VydmVGaWxlKGAvJHtwYXRoLmJhc2VuYW1lKGZpbGUpfWAsIHJlcXVlc3QsIHJlc3BvbnNlKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLnNwYSAmJiBmaWxlICE9PSBvcHRpb25zLmhvbWVwYWdlKSB7XG4gICAgICAgICAgcmV0dXJuIHNlcnZlRmlsZShvcHRpb25zLmhvbWVwYWdlLCByZXF1ZXN0LCByZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICAgICAgZnMucmVhZEZpbGUob3B0aW9ucy5wYXRoICsgJy80MDQuaHRtbCcsIGZ1bmN0aW9uIChlcnIsIGNvbnRlbnQ6IGFueSkge1xuICAgICAgICAgIGNvbnRlbnQgPSBlcnIgPyAnNDA0IE5vdCBGb3VuZCcgOiBjb250ZW50O1xuICAgICAgICAgIHJlc3BvbnNlLndyaXRlSGVhZCg0MDQsIHsgJ0NvbnRlbnQtVHlwZSc6ICd0ZXh0L2h0bWwnIH0pO1xuICAgICAgICAgIHJldHVybiByZXNwb25zZS5lbmQoY29udGVudCwgJ3V0Zi04Jyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZXNwb25zZS53cml0ZUhlYWQoNTAwKTtcbiAgICAgIHJldHVybiByZXNwb25zZS5lbmQoJ1NvcnJ5LCBjaGVjayB3aXRoIHRoZSBzaXRlIGFkbWluIGZvciBlcnJvcjogJyArIGVycm9yLmNvZGUgKyAnIC4uXFxuJyk7XG4gICAgfVxuICAgIHJlc3BvbnNlLndyaXRlSGVhZCgyMDAsIHsgJ0NvbnRlbnQtVHlwZSc6IGNvbnRlbnRUeXBlIH0pO1xuICAgIGlmIChvcHRpb25zLm1vbml0b3JCdWNrZXQgJiYgY29udGVudFR5cGUgPT09ICd0ZXh0L2h0bWwnKSB7XG4gICAgICBjb250ZW50ID0gY29udGVudC50b1N0cmluZygpLnJlcGxhY2UoJzwvYm9keT4nLCBgXG48c2NyaXB0PlxuOyhmdW5jdGlvbiAoYixlLG4sbyxpLHQpIHtcbiAgYltvXT1iW29dfHxmdW5jdGlvbihmKXsoYltvXS5jPWJbb10uY3x8W10pLnB1c2goZil9O1xuICB0PWUuY3JlYXRlRWxlbWVudChpKTtlPWUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoaSlbMF07XG4gIHQuYXN5bmM9MTt0LnNyYz1uO2UucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodCxlKTtcbn0od2luZG93LGRvY3VtZW50LCdodHRwczovL2FwbS5wbTIuaW8vcG0yLWlvLWFwbS1icm93c2VyLnYxLmpzJywncG0yUmVhZHknLCdzY3JpcHQnKSlcblxucG0yUmVhZHkoZnVuY3Rpb24oYXBtKSB7XG4gIGFwbS5zZXRCdWNrZXQoJyR7b3B0aW9ucy5tb25pdG9yQnVja2V0fScpXG4gIGFwbS5zZXRBcHBsaWNhdGlvbignJHtvcHRpb25zLm1vbml0b3J9JylcbiAgYXBtLnJlcG9ydFRpbWluZ3MoKVxuICBhcG0ucmVwb3J0SXNzdWVzKClcbn0pXG48L3NjcmlwdD5cbjwvYm9keT5cbmApO1xuICAgIH1cbiAgICByZXNwb25zZS5lbmQoY29udGVudCwgJ3V0Zi04Jyk7XG4gICAgZGVidWcoJ1slc10gU2VydmluZyAlcyB3aXRoIGNvbnRlbnQtdHlwZSAlcycsIERhdGUubm93KCksIGZpbGVQYXRoLCBjb250ZW50VHlwZSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBwYXJzZUJhc2ljQXV0aChhdXRoKSB7XG4gIC8vIGF1dGggaXMgbGlrZSBgQmFzaWMgWTJoaGNteGxjem94TWpNME5RPT1gXG4gIHZhciB0bXAgPSBhdXRoLnNwbGl0KCcgJyk7XG5cbiAgdmFyIGJ1ZiA9IEJ1ZmZlci5mcm9tKHRtcFsxXSwgJ2Jhc2U2NCcpO1xuICB2YXIgcGxhaW4gPSBidWYudG9TdHJpbmcoKTtcblxuICB2YXIgY3JlZHMgPSBwbGFpbi5zcGxpdCgnOicpO1xuICByZXR1cm4ge1xuICAgIHVzZXJuYW1lOiBjcmVkc1swXSxcbiAgICBwYXNzd29yZDogY3JlZHNbMV1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZW5kQmFzaWNBdXRoUmVzcG9uc2UocmVzcG9uc2UpIHtcbiAgcmVzcG9uc2Uud3JpdGVIZWFkKDQwMSwge1xuICAgICdDb250ZW50LVR5cGUnOiAndGV4dC9odG1sJyxcbiAgICAnV1dXLUF1dGhlbnRpY2F0ZSc6ICdCYXNpYyByZWFsbT1cIkF1dGhlbnRpY2F0aW9uIHNlcnZpY2VcIidcbiAgfSk7XG4gIHJldHVybiByZXNwb25zZS5lbmQoJzQwMSBVbmF1dGhvcml6ZWQnKTtcbn1cbiJdfQ==