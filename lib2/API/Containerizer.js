"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
exports.generateDockerfile = generateDockerfile;
exports.parseAndSwitch = parseAndSwitch;
exports.switchDockerFile = switchDockerFile;

var _child_process = require("child_process");

var _chalk = _interopRequireDefault(require("chalk"));

var _util = _interopRequireDefault(require("util"));

var fmt = _interopRequireWildcard(require("../tools/fmt.js"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _constants = _interopRequireDefault(require("../../constants.js"));

var _promiseMin = _interopRequireDefault(require("../tools/promise.min.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function pspawn(cmd) {
  return new _promiseMin["default"](function (resolve, reject) {
    var p_cmd = cmd.split(' ');
    var install_instance = (0, _child_process.spawn)(p_cmd[0], p_cmd.splice(1, cmd.length), {
      stdio: 'inherit',
      env: process.env,
      shell: true
    });
    install_instance.on('close', function (code) {
      if (code != 0) {
        console.log(_chalk["default"].bold.red('Command failed'));
        return reject(new Error('Bad cmd return'));
      }

      return resolve();
    });
    install_instance.on('error', function (err) {
      return reject(err);
    });
  });
}

function checkDockerSetup() {
  return new _promiseMin["default"](function (resolve, reject) {
    (0, _child_process.exec)("docker version -f '{{.Client.Version}}'", function (err, stdout, stderr) {
      if (err) {
        console.error(_chalk["default"].red.bold('[Docker access] Error while trying to use docker command'));

        if (err.message && err.message.indexOf('Cannot connect to the Docker') > -1) {
          console.log();
          console.log(_chalk["default"].blue.bold('[Solution] Setup Docker to be able to be used without sudo rights:'));
          console.log(_chalk["default"].bold('$ sudo groupadd docker'));
          console.log(_chalk["default"].bold('$ sudo usermod -aG docker $USER'));
          console.log(_chalk["default"].bold('Then LOGOUT and LOGIN your Linux session'));
          console.log('Read more: http://bit.ly/29JGdCE');
        }

        return reject(err);
      }

      return resolve();
    });
  });
}
/**
 * Switch Dockerfile mode
 * check test/programmatic/containerizer.mocha.js
 */


function parseAndSwitch(file_content, main_file, opts) {
  var lines = file_content.split('\n');
  var mode = opts.mode;
  lines[0] = 'FROM keymetrics/pm2:' + opts.node_version;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (['## DISTRIBUTION MODE', '## DEVELOPMENT MODE'].indexOf(line) > -1 || i == lines.length - 1) {
      lines.splice(i, lines.length);
      lines[i] = '## ' + mode.toUpperCase() + ' MODE';
      lines[i + 1] = 'ENV NODE_ENV=' + (mode == 'distribution' ? 'production' : mode);

      if (mode == 'distribution') {
        lines[i + 2] = 'COPY . /var/app';
        lines[i + 3] = 'CMD ["pm2-docker", "' + main_file + '", "--env", "production"]';
      }

      if (mode == 'development') {
        lines[i + 2] = 'CMD ["pm2-dev", "' + main_file + '", "--env", "development"]';
      }

      break;
    }
  }

  ;
  lines = lines.join('\n');
  return lines;
}

;
/**
 * Replace ENV, COPY and CMD depending on the mode
 * @param {String} docker_filepath Dockerfile absolute path
 * @param {String} main_file       Main file to start in container
 * @param {String} mode            Mode to switch the Dockerfile
 */

function switchDockerFile(docker_filepath, main_file, opts) {
  return new _promiseMin["default"](function (resolve, reject) {
    var data = _fs["default"].readFileSync(docker_filepath, 'utf8').toString();

    if (['distribution', 'development'].indexOf(opts.mode) == -1) return reject(new Error('Unknown mode'));
    var lines = parseAndSwitch(data, main_file, opts);

    _fs["default"].writeFile(docker_filepath, lines, function (err) {
      if (err) return reject(err);
      resolve({
        Dockerfile_path: docker_filepath,
        Dockerfile: lines,
        CMD: ''
      });
    });
  });
}
/**
 * Generate sample Dockerfile (lib/templates/Dockerfiles)
 * @param {String} docker_filepath Dockerfile absolute path
 * @param {String} main_file       Main file to start in container
 * @param {String} mode            Mode to switch the Dockerfile
 */


function generateDockerfile(docker_filepath, main_file, opts) {
  return new _promiseMin["default"](function (resolve, reject) {
    var tpl_file = _path["default"].join(_constants["default"].TEMPLATE_FOLDER, _constants["default"].DOCKERFILE_NODEJS);

    var template = _fs["default"].readFileSync(tpl_file, {
      encoding: 'utf8'
    });

    var CMD;
    template = parseAndSwitch(template, main_file, opts);

    _fs["default"].writeFile(docker_filepath, template, function (err) {
      if (err) return reject(err);
      resolve({
        Dockerfile_path: docker_filepath,
        Dockerfile: template,
        CMD: CMD
      });
    });
  });
}

function handleExit(CLI, opts, mode) {
  process.on('SIGINT', function () {
    CLI.disconnect();
    if (mode != 'distribution') return false;
    (0, _child_process.exec)('docker ps -lq', function (err, stdout, stderr) {
      if (err) {
        console.error(err);
      }

      require('vizion').analyze({
        folder: process.cwd()
      }, function recur_path(err, meta) {
        if (!err && meta.revision) {
          var commit_id = _util["default"].format('#%s(%s) %s', meta.branch, meta.revision.slice(0, 5), meta.comment);

          console.log(_chalk["default"].bold.magenta('$ docker commit -m "%s" %s %s'), commit_id, stdout.replace('\n', ''), opts.imageName);
        } else console.log(_chalk["default"].bold.magenta('$ docker commit %s %s'), stdout.replace('\n', ''), opts.imageName);

        console.log(_chalk["default"].bold.magenta('$ docker push %s'), opts.imageName);
      });
    });
  });
}

function _default(CLI) {
  CLI.prototype.generateDockerfile = function (script, opts) {
    var docker_filepath = _path["default"].join(process.cwd(), 'Dockerfile');

    var that = this;

    _fs["default"].stat(docker_filepath, function (err, stat) {
      if (err || opts.force == true) {
        generateDockerfile(docker_filepath, script, {
          mode: 'development'
        }).then(function () {
          console.log(_chalk["default"].bold('New Dockerfile generated in current folder'));
          console.log(_chalk["default"].bold('You can now run\n$ pm2 docker:dev <file|config>'));
          return that.exitCli(_constants["default"].SUCCESS_EXIT);
        });
        return false;
      }

      console.log(_chalk["default"].red.bold('Dockerfile already exists in this folder, use --force if you want to replace it'));
      that.exitCli(_constants["default"].ERROR_EXIT);
    });
  };

  CLI.prototype.dockerMode = function (script, opts, mode) {
    var promptly = require('promptly');

    var self = this;
    handleExit(self, opts, mode);

    if (mode == 'distribution' && !opts.imageName) {
      console.error(_chalk["default"].bold.red('--image-name [name] option is missing'));
      return self.exitCli(_constants["default"].ERROR_EXIT);
    }

    var template;
    var app_path, main_script;
    var image_name;
    var node_version = opts.nodeVersion ? opts.nodeVersion.split('.')[0] : 'latest';
    image_name = opts.imageName || require('crypto').randomBytes(6).toString('hex');

    if (script.indexOf('/') > -1) {
      app_path = _path["default"].join(process.cwd(), _path["default"].dirname(script));
      main_script = _path["default"].basename(script);
    } else {
      app_path = process.cwd();
      main_script = script;
    }

    checkDockerSetup().then(function () {
      /////////////////////////
      // Generate Dockerfile //
      /////////////////////////
      return new _promiseMin["default"](function (resolve, reject) {
        var docker_filepath = _path["default"].join(process.cwd(), 'Dockerfile');

        _fs["default"].stat(docker_filepath, function (err, stat) {
          if (err) {
            // Dockerfile does not exist, generate one
            // console.log(chalk.blue.bold('Generating new Dockerfile'));
            if (opts.force == true) {
              return resolve(generateDockerfile(docker_filepath, main_script, {
                node_version: node_version,
                mode: mode
              }));
            }

            if (opts.dockerdaemon) return resolve(generateDockerfile(docker_filepath, main_script, {
              node_version: node_version,
              mode: mode
            }));
            promptly.prompt('No Dockerfile in current directory, ok to generate a new one? (y/n)', function (err, value) {
              if (value == 'y') return resolve(generateDockerfile(docker_filepath, main_script, {
                node_version: node_version,
                mode: mode
              }));else return self.exitCli(_constants["default"].SUCCESS_EXIT);
            });
            return false;
          }

          return resolve(switchDockerFile(docker_filepath, main_script, {
            node_version: node_version,
            mode: mode
          }));
        });
      });
    }).then(function (_template) {
      template = _template;
      return _promiseMin["default"].resolve();
    }).then(function () {
      //////////////////
      // Docker build //
      //////////////////
      var docker_build = _util["default"].format('docker build -t %s -f %s', image_name, template.Dockerfile_path);

      if (opts.fresh == true) docker_build += ' --no-cache';
      docker_build += ' .';
      console.log();
      fmt.sep();
      fmt.title('Building Boot System');
      fmt.field('Type', _chalk["default"].cyan.bold('Docker'));
      fmt.field('Mode', mode);
      fmt.field('Image name', image_name);
      fmt.field('Docker build command', docker_build);
      fmt.field('Dockerfile path', template.Dockerfile_path);
      fmt.sep();
      return pspawn(docker_build);
    }).then(function () {
      ////////////////
      // Docker run //
      ////////////////
      var docker_run = 'docker run --net host';
      if (opts.dockerdaemon == true) docker_run += ' -d';
      if (mode != 'distribution') docker_run += _util["default"].format(' -v %s:/var/app -v /var/app/node_modules', app_path);
      docker_run += ' ' + image_name;
      var dockerfile_parsed = template.Dockerfile.split('\n');
      var base_image = dockerfile_parsed[0];
      var run_cmd = dockerfile_parsed[dockerfile_parsed.length - 1];
      console.log();
      fmt.sep();
      fmt.title('Booting');
      fmt.field('Type', _chalk["default"].cyan.bold('Docker'));
      fmt.field('Mode', mode);
      fmt.field('Base Image', base_image);
      fmt.field('Image Name', image_name);
      fmt.field('Docker Command', docker_run);
      fmt.field('RUN Command', run_cmd);
      fmt.field('CWD', app_path);
      fmt.sep();
      return pspawn(docker_run);
    }).then(function () {
      console.log(_chalk["default"].blue.bold('>>> Leaving Docker instance uuid=%s'), image_name);
      self.disconnect();
      return _promiseMin["default"].resolve();
    })["catch"](function (err) {
      console.log();
      console.log(_chalk["default"].grey('Raw error=', err.message));
      self.disconnect();
    });
  };
}

;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvQ29udGFpbmVyaXplci50cyJdLCJuYW1lcyI6WyJwc3Bhd24iLCJjbWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInBfY21kIiwic3BsaXQiLCJpbnN0YWxsX2luc3RhbmNlIiwic3BsaWNlIiwibGVuZ3RoIiwic3RkaW8iLCJlbnYiLCJwcm9jZXNzIiwic2hlbGwiLCJvbiIsImNvZGUiLCJjb25zb2xlIiwibG9nIiwiY2hhbGsiLCJib2xkIiwicmVkIiwiRXJyb3IiLCJlcnIiLCJjaGVja0RvY2tlclNldHVwIiwic3Rkb3V0Iiwic3RkZXJyIiwiZXJyb3IiLCJtZXNzYWdlIiwiaW5kZXhPZiIsImJsdWUiLCJwYXJzZUFuZFN3aXRjaCIsImZpbGVfY29udGVudCIsIm1haW5fZmlsZSIsIm9wdHMiLCJsaW5lcyIsIm1vZGUiLCJub2RlX3ZlcnNpb24iLCJpIiwibGluZSIsInRvVXBwZXJDYXNlIiwiam9pbiIsInN3aXRjaERvY2tlckZpbGUiLCJkb2NrZXJfZmlsZXBhdGgiLCJkYXRhIiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJ0b1N0cmluZyIsIndyaXRlRmlsZSIsIkRvY2tlcmZpbGVfcGF0aCIsIkRvY2tlcmZpbGUiLCJDTUQiLCJnZW5lcmF0ZURvY2tlcmZpbGUiLCJ0cGxfZmlsZSIsInBhdGgiLCJjc3QiLCJURU1QTEFURV9GT0xERVIiLCJET0NLRVJGSUxFX05PREVKUyIsInRlbXBsYXRlIiwiZW5jb2RpbmciLCJoYW5kbGVFeGl0IiwiQ0xJIiwiZGlzY29ubmVjdCIsInJlcXVpcmUiLCJhbmFseXplIiwiZm9sZGVyIiwiY3dkIiwicmVjdXJfcGF0aCIsIm1ldGEiLCJyZXZpc2lvbiIsImNvbW1pdF9pZCIsInV0aWwiLCJmb3JtYXQiLCJicmFuY2giLCJzbGljZSIsImNvbW1lbnQiLCJtYWdlbnRhIiwicmVwbGFjZSIsImltYWdlTmFtZSIsInByb3RvdHlwZSIsInNjcmlwdCIsInRoYXQiLCJzdGF0IiwiZm9yY2UiLCJ0aGVuIiwiZXhpdENsaSIsIlNVQ0NFU1NfRVhJVCIsIkVSUk9SX0VYSVQiLCJkb2NrZXJNb2RlIiwicHJvbXB0bHkiLCJzZWxmIiwiYXBwX3BhdGgiLCJtYWluX3NjcmlwdCIsImltYWdlX25hbWUiLCJub2RlVmVyc2lvbiIsInJhbmRvbUJ5dGVzIiwiZGlybmFtZSIsImJhc2VuYW1lIiwiZG9ja2VyZGFlbW9uIiwicHJvbXB0IiwidmFsdWUiLCJfdGVtcGxhdGUiLCJkb2NrZXJfYnVpbGQiLCJmcmVzaCIsImZtdCIsInNlcCIsInRpdGxlIiwiZmllbGQiLCJjeWFuIiwiZG9ja2VyX3J1biIsImRvY2tlcmZpbGVfcGFyc2VkIiwiYmFzZV9pbWFnZSIsInJ1bl9jbWQiLCJncmV5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQSxTQUFTQSxNQUFULENBQWdCQyxHQUFoQixFQUFxQjtBQUNuQixTQUFPLElBQUlDLHNCQUFKLENBQVksVUFBVUMsT0FBVixFQUFtQkMsTUFBbkIsRUFBMkI7QUFDNUMsUUFBSUMsS0FBSyxHQUFHSixHQUFHLENBQUNLLEtBQUosQ0FBVSxHQUFWLENBQVo7QUFFQSxRQUFJQyxnQkFBZ0IsR0FBRywwQkFBTUYsS0FBSyxDQUFDLENBQUQsQ0FBWCxFQUFnQkEsS0FBSyxDQUFDRyxNQUFOLENBQWEsQ0FBYixFQUFnQlAsR0FBRyxDQUFDUSxNQUFwQixDQUFoQixFQUE2QztBQUNsRUMsTUFBQUEsS0FBSyxFQUFFLFNBRDJEO0FBRWxFQyxNQUFBQSxHQUFHLEVBQUVDLE9BQU8sQ0FBQ0QsR0FGcUQ7QUFHbEVFLE1BQUFBLEtBQUssRUFBRTtBQUgyRCxLQUE3QyxDQUF2QjtBQU1BTixJQUFBQSxnQkFBZ0IsQ0FBQ08sRUFBakIsQ0FBb0IsT0FBcEIsRUFBNkIsVUFBVUMsSUFBVixFQUFnQjtBQUMzQyxVQUFJQSxJQUFJLElBQUksQ0FBWixFQUFlO0FBQ2JDLFFBQUFBLE9BQU8s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Q0FBQzVCLFVBQUw7QUFDRCxLQTVHSDtBQThHRCxHQXhJRDtBQTBJRDs7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB7IGV4ZWMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIGZtdCBmcm9tICcuLi90b29scy9mbXQuanMnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnLi4vdG9vbHMvcHJvbWlzZS5taW4uanMnO1xuXG5mdW5jdGlvbiBwc3Bhd24oY21kKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHBfY21kID0gY21kLnNwbGl0KCcgJyk7XG5cbiAgICB2YXIgaW5zdGFsbF9pbnN0YW5jZSA9IHNwYXduKHBfY21kWzBdLCBwX2NtZC5zcGxpY2UoMSwgY21kLmxlbmd0aCksIHtcbiAgICAgIHN0ZGlvOiAnaW5oZXJpdCcsXG4gICAgICBlbnY6IHByb2Nlc3MuZW52LFxuICAgICAgc2hlbGw6IHRydWVcbiAgICB9KTtcblxuICAgIGluc3RhbGxfaW5zdGFuY2Uub24oJ2Nsb3NlJywgZnVuY3Rpb24gKGNvZGUpIHtcbiAgICAgIGlmIChjb2RlICE9IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuYm9sZC5yZWQoJ0NvbW1hbmQgZmFpbGVkJykpO1xuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignQmFkIGNtZCByZXR1cm4nKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzb2x2ZSgpO1xuICAgIH0pO1xuXG4gICAgaW5zdGFsbF9pbnN0YW5jZS5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjaGVja0RvY2tlclNldHVwKCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGV4ZWMoXCJkb2NrZXIgdmVyc2lvbiAtZiAne3suQ2xpZW50LlZlcnNpb259fSdcIiwgZnVuY3Rpb24gKGVyciwgc3Rkb3V0LCBzdGRlcnIpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihjaGFsay5yZWQuYm9sZCgnW0RvY2tlciBhY2Nlc3NdIEVycm9yIHdoaWxlIHRyeWluZyB0byB1c2UgZG9ja2VyIGNvbW1hbmQnKSk7XG4gICAgICAgIGlmIChlcnIubWVzc2FnZSAmJiBlcnIubWVzc2FnZS5pbmRleE9mKCdDYW5ub3QgY29ubmVjdCB0byB0aGUgRG9ja2VyJykgPiAtMSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCk7XG4gICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuYmx1ZS5ib2xkKCdbU29sdXRpb25dIFNldHVwIERvY2tlciB0byBiZSBhYmxlIHRvIGJlIHVzZWQgd2l0aG91dCBzdWRvIHJpZ2h0czonKSk7XG4gICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuYm9sZCgnJCBzdWRvIGdyb3VwYWRkIGRvY2tlcicpKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ib2xkKCckIHN1ZG8gdXNlcm1vZCAtYUcgZG9ja2VyICRVU0VSJykpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmJvbGQoJ1RoZW4gTE9HT1VUIGFuZCBMT0dJTiB5b3VyIExpbnV4IHNlc3Npb24nKSk7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1JlYWQgbW9yZTogaHR0cDovL2JpdC5seS8yOUpHZENFJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbi8qKlxuICogU3dpdGNoIERvY2tlcmZpbGUgbW9kZVxuICogY2hlY2sgdGVzdC9wcm9ncmFtbWF0aWMvY29udGFpbmVyaXplci5tb2NoYS5qc1xuICovXG5mdW5jdGlvbiBwYXJzZUFuZFN3aXRjaChmaWxlX2NvbnRlbnQsIG1haW5fZmlsZSwgb3B0cykge1xuICB2YXIgbGluZXMgPSBmaWxlX2NvbnRlbnQuc3BsaXQoJ1xcbicpO1xuICB2YXIgbW9kZSA9IG9wdHMubW9kZTtcblxuICBsaW5lc1swXSA9ICdGUk9NIGtleW1ldHJpY3MvcG0yOicgKyBvcHRzLm5vZGVfdmVyc2lvbjtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGxpbmUgPSBsaW5lc1tpXTtcblxuICAgIGlmIChbJyMjIERJU1RSSUJVVElPTiBNT0RFJywgJyMjIERFVkVMT1BNRU5UIE1PREUnXS5pbmRleE9mKGxpbmUpID4gLTEgfHxcbiAgICAgIGkgPT0gbGluZXMubGVuZ3RoIC0gMSkge1xuICAgICAgbGluZXMuc3BsaWNlKGksIGxpbmVzLmxlbmd0aCk7XG4gICAgICBsaW5lc1tpXSA9ICcjIyAnICsgbW9kZS50b1VwcGVyQ2FzZSgpICsgJyBNT0RFJztcbiAgICAgIGxpbmVzW2kgKyAxXSA9ICdFTlYgTk9ERV9FTlY9JyArIChtb2RlID09ICdkaXN0cmlidXRpb24nID8gJ3Byb2R1Y3Rpb24nIDogbW9kZSk7XG5cbiAgICAgIGlmIChtb2RlID09ICdkaXN0cmlidXRpb24nKSB7XG4gICAgICAgIGxpbmVzW2kgKyAyXSA9ICdDT1BZIC4gL3Zhci9hcHAnO1xuICAgICAgICBsaW5lc1tpICsgM10gPSAnQ01EIFtcInBtMi1kb2NrZXJcIiwgXCInICsgbWFpbl9maWxlICsgJ1wiLCBcIi0tZW52XCIsIFwicHJvZHVjdGlvblwiXSc7XG4gICAgICB9XG4gICAgICBpZiAobW9kZSA9PSAnZGV2ZWxvcG1lbnQnKSB7XG4gICAgICAgIGxpbmVzW2kgKyAyXSA9ICdDTUQgW1wicG0yLWRldlwiLCBcIicgKyBtYWluX2ZpbGUgKyAnXCIsIFwiLS1lbnZcIiwgXCJkZXZlbG9wbWVudFwiXSc7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gIH07XG4gIGxpbmVzID0gbGluZXMuam9pbignXFxuJyk7XG4gIHJldHVybiBsaW5lcztcbn07XG5cbi8qKlxuICogUmVwbGFjZSBFTlYsIENPUFkgYW5kIENNRCBkZXBlbmRpbmcgb24gdGhlIG1vZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBkb2NrZXJfZmlsZXBhdGggRG9ja2VyZmlsZSBhYnNvbHV0ZSBwYXRoXG4gKiBAcGFyYW0ge1N0cmluZ30gbWFpbl9maWxlICAgICAgIE1haW4gZmlsZSB0byBzdGFydCBpbiBjb250YWluZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBtb2RlICAgICAgICAgICAgTW9kZSB0byBzd2l0Y2ggdGhlIERvY2tlcmZpbGVcbiAqL1xuZnVuY3Rpb24gc3dpdGNoRG9ja2VyRmlsZShkb2NrZXJfZmlsZXBhdGgsIG1haW5fZmlsZSwgb3B0cykge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciBkYXRhID0gZnMucmVhZEZpbGVTeW5jKGRvY2tlcl9maWxlcGF0aCwgJ3V0ZjgnKS50b1N0cmluZygpO1xuXG4gICAgaWYgKFsnZGlzdHJpYnV0aW9uJywgJ2RldmVsb3BtZW50J10uaW5kZXhPZihvcHRzLm1vZGUpID09IC0xKVxuICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ1Vua25vd24gbW9kZScpKTtcblxuICAgIHZhciBsaW5lcyA9IHBhcnNlQW5kU3dpdGNoKGRhdGEsIG1haW5fZmlsZSwgb3B0cylcbiAgICBmcy53cml0ZUZpbGUoZG9ja2VyX2ZpbGVwYXRoLCBsaW5lcywgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgcmVzb2x2ZSh7XG4gICAgICAgIERvY2tlcmZpbGVfcGF0aDogZG9ja2VyX2ZpbGVwYXRoLFxuICAgICAgICBEb2NrZXJmaWxlOiBsaW5lcyxcbiAgICAgICAgQ01EOiAnJ1xuICAgICAgfSk7XG4gICAgfSlcbiAgfSk7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgc2FtcGxlIERvY2tlcmZpbGUgKGxpYi90ZW1wbGF0ZXMvRG9ja2VyZmlsZXMpXG4gKiBAcGFyYW0ge1N0cmluZ30gZG9ja2VyX2ZpbGVwYXRoIERvY2tlcmZpbGUgYWJzb2x1dGUgcGF0aFxuICogQHBhcmFtIHtTdHJpbmd9IG1haW5fZmlsZSAgICAgICBNYWluIGZpbGUgdG8gc3RhcnQgaW4gY29udGFpbmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gbW9kZSAgICAgICAgICAgIE1vZGUgdG8gc3dpdGNoIHRoZSBEb2NrZXJmaWxlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlRG9ja2VyZmlsZShkb2NrZXJfZmlsZXBhdGgsIG1haW5fZmlsZSwgb3B0cykge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciB0cGxfZmlsZSA9IHBhdGguam9pbihjc3QuVEVNUExBVEVfRk9MREVSLCBjc3QuRE9DS0VSRklMRV9OT0RFSlMpO1xuICAgIHZhciB0ZW1wbGF0ZSA9IGZzLnJlYWRGaWxlU3luYyh0cGxfZmlsZSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIHZhciBDTUQ7XG5cbiAgICB0ZW1wbGF0ZSA9IHBhcnNlQW5kU3dpdGNoKHRlbXBsYXRlLCBtYWluX2ZpbGUsIG9wdHMpO1xuXG4gICAgZnMud3JpdGVGaWxlKGRvY2tlcl9maWxlcGF0aCwgdGVtcGxhdGUsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgIHJlc29sdmUoe1xuICAgICAgICBEb2NrZXJmaWxlX3BhdGg6IGRvY2tlcl9maWxlcGF0aCxcbiAgICAgICAgRG9ja2VyZmlsZTogdGVtcGxhdGUsXG4gICAgICAgIENNRDogQ01EXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUV4aXQoQ0xJLCBvcHRzLCBtb2RlKSB7XG4gIHByb2Nlc3Mub24oJ1NJR0lOVCcsIGZ1bmN0aW9uICgpIHtcbiAgICBDTEkuZGlzY29ubmVjdCgpO1xuXG4gICAgaWYgKG1vZGUgIT0gJ2Rpc3RyaWJ1dGlvbicpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBleGVjKCdkb2NrZXIgcHMgLWxxJywgZnVuY3Rpb24gKGVyciwgc3Rkb3V0LCBzdGRlcnIpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgfVxuICAgICAgcmVxdWlyZSgndml6aW9uJykuYW5hbHl6ZSh7IGZvbGRlcjogcHJvY2Vzcy5jd2QoKSB9LCBmdW5jdGlvbiByZWN1cl9wYXRoKGVyciwgbWV0YSkge1xuICAgICAgICBpZiAoIWVyciAmJiBtZXRhLnJldmlzaW9uKSB7XG4gICAgICAgICAgdmFyIGNvbW1pdF9pZCA9IHV0aWwuZm9ybWF0KCcjJXMoJXMpICVzJyxcbiAgICAgICAgICAgIG1ldGEuYnJhbmNoLFxuICAgICAgICAgICAgbWV0YS5yZXZpc2lvbi5zbGljZSgwLCA1KSxcbiAgICAgICAgICAgIG1ldGEuY29tbWVudCk7XG5cbiAgICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ib2xkLm1hZ2VudGEoJyQgZG9ja2VyIGNvbW1pdCAtbSBcIiVzXCIgJXMgJXMnKSxcbiAgICAgICAgICAgIGNvbW1pdF9pZCxcbiAgICAgICAgICAgIHN0ZG91dC5yZXBsYWNlKCdcXG4nLCAnJyksXG4gICAgICAgICAgICBvcHRzLmltYWdlTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmJvbGQubWFnZW50YSgnJCBkb2NrZXIgY29tbWl0ICVzICVzJyksIHN0ZG91dC5yZXBsYWNlKCdcXG4nLCAnJyksIG9wdHMuaW1hZ2VOYW1lKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ib2xkLm1hZ2VudGEoJyQgZG9ja2VyIHB1c2ggJXMnKSwgb3B0cy5pbWFnZU5hbWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoQ0xJKSB7XG4gIENMSS5wcm90b3R5cGUuZ2VuZXJhdGVEb2NrZXJmaWxlID0gZnVuY3Rpb24gKHNjcmlwdCwgb3B0cykge1xuICAgIHZhciBkb2NrZXJfZmlsZXBhdGggPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ0RvY2tlcmZpbGUnKTtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBmcy5zdGF0KGRvY2tlcl9maWxlcGF0aCwgZnVuY3Rpb24gKGVyciwgc3RhdCkge1xuICAgICAgaWYgKGVyciB8fCBvcHRzLmZvcmNlID09IHRydWUpIHtcbiAgICAgICAgZ2VuZXJhdGVEb2NrZXJmaWxlKGRvY2tlcl9maWxlcGF0aCwgc2NyaXB0LCB7XG4gICAgICAgICAgbW9kZTogJ2RldmVsb3BtZW50J1xuICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmJvbGQoJ05ldyBEb2NrZXJmaWxlIGdlbmVyYXRlZCBpbiBjdXJyZW50IGZvbGRlcicpKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmJvbGQoJ1lvdSBjYW4gbm93IHJ1blxcbiQgcG0yIGRvY2tlcjpkZXYgPGZpbGV8Y29uZmlnPicpKTtcbiAgICAgICAgICAgIHJldHVybiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGNoYWxrLnJlZC5ib2xkKCdEb2NrZXJmaWxlIGFscmVhZHkgZXhpc3RzIGluIHRoaXMgZm9sZGVyLCB1c2UgLS1mb3JjZSBpZiB5b3Ugd2FudCB0byByZXBsYWNlIGl0JykpO1xuICAgICAgdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICB9KTtcbiAgfTtcblxuICBDTEkucHJvdG90eXBlLmRvY2tlck1vZGUgPSBmdW5jdGlvbiAoc2NyaXB0LCBvcHRzLCBtb2RlKSB7XG4gICAgdmFyIHByb21wdGx5ID0gcmVxdWlyZSgncHJvbXB0bHknKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaGFuZGxlRXhpdChzZWxmLCBvcHRzLCBtb2RlKTtcblxuICAgIGlmIChtb2RlID09ICdkaXN0cmlidXRpb24nICYmICFvcHRzLmltYWdlTmFtZSkge1xuICAgICAgY29uc29sZS5lcnJvcihjaGFsay5ib2xkLnJlZCgnLS1pbWFnZS1uYW1lIFtuYW1lXSBvcHRpb24gaXMgbWlzc2luZycpKTtcbiAgICAgIHJldHVybiBzZWxmLmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgIH1cblxuICAgIHZhciB0ZW1wbGF0ZTtcbiAgICB2YXIgYXBwX3BhdGgsIG1haW5fc2NyaXB0O1xuICAgIHZhciBpbWFnZV9uYW1lO1xuICAgIHZhciBub2RlX3ZlcnNpb24gPSBvcHRzLm5vZGVWZXJzaW9uID8gb3B0cy5ub2RlVmVyc2lvbi5zcGxpdCgnLicpWzBdIDogJ2xhdGVzdCc7XG5cbiAgICBpbWFnZV9uYW1lID0gb3B0cy5pbWFnZU5hbWUgfHwgcmVxdWlyZSgnY3J5cHRvJykucmFuZG9tQnl0ZXMoNikudG9TdHJpbmcoJ2hleCcpO1xuXG4gICAgaWYgKHNjcmlwdC5pbmRleE9mKCcvJykgPiAtMSkge1xuICAgICAgYXBwX3BhdGggPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgcGF0aC5kaXJuYW1lKHNjcmlwdCkpO1xuICAgICAgbWFpbl9zY3JpcHQgPSBwYXRoLmJhc2VuYW1lKHNjcmlwdCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgYXBwX3BhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgICAgbWFpbl9zY3JpcHQgPSBzY3JpcHQ7XG4gICAgfVxuXG4gICAgY2hlY2tEb2NrZXJTZXR1cCgpXG4gICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgLy8gR2VuZXJhdGUgRG9ja2VyZmlsZSAvL1xuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgdmFyIGRvY2tlcl9maWxlcGF0aCA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnRG9ja2VyZmlsZScpO1xuXG4gICAgICAgICAgZnMuc3RhdChkb2NrZXJfZmlsZXBhdGgsIGZ1bmN0aW9uIChlcnIsIHN0YXQpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgLy8gRG9ja2VyZmlsZSBkb2VzIG5vdCBleGlzdCwgZ2VuZXJhdGUgb25lXG4gICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGNoYWxrLmJsdWUuYm9sZCgnR2VuZXJhdGluZyBuZXcgRG9ja2VyZmlsZScpKTtcbiAgICAgICAgICAgICAgaWYgKG9wdHMuZm9yY2UgPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGdlbmVyYXRlRG9ja2VyZmlsZShkb2NrZXJfZmlsZXBhdGgsIG1haW5fc2NyaXB0LCB7XG4gICAgICAgICAgICAgICAgICBub2RlX3ZlcnNpb246IG5vZGVfdmVyc2lvbixcbiAgICAgICAgICAgICAgICAgIG1vZGU6IG1vZGVcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKG9wdHMuZG9ja2VyZGFlbW9uKVxuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGdlbmVyYXRlRG9ja2VyZmlsZShkb2NrZXJfZmlsZXBhdGgsIG1haW5fc2NyaXB0LCB7XG4gICAgICAgICAgICAgICAgICBub2RlX3ZlcnNpb246IG5vZGVfdmVyc2lvbixcbiAgICAgICAgICAgICAgICAgIG1vZGU6IG1vZGVcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgIHByb21wdGx5LnByb21wdCgnTm8gRG9ja2VyZmlsZSBpbiBjdXJyZW50IGRpcmVjdG9yeSwgb2sgdG8gZ2VuZXJhdGUgYSBuZXcgb25lPyAoeS9uKScsIGZ1bmN0aW9uIChlcnIsIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09ICd5JylcbiAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGdlbmVyYXRlRG9ja2VyZmlsZShkb2NrZXJfZmlsZXBhdGgsIG1haW5fc2NyaXB0LCB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVfdmVyc2lvbjogbm9kZV92ZXJzaW9uLFxuICAgICAgICAgICAgICAgICAgICBtb2RlOiBtb2RlXG4gICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZXhpdENsaShjc3QuU1VDQ0VTU19FWElUKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKHN3aXRjaERvY2tlckZpbGUoZG9ja2VyX2ZpbGVwYXRoLCBtYWluX3NjcmlwdCwge1xuICAgICAgICAgICAgICBub2RlX3ZlcnNpb246IG5vZGVfdmVyc2lvbixcbiAgICAgICAgICAgICAgbW9kZTogbW9kZVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbiAoX3RlbXBsYXRlKSB7XG4gICAgICAgIHRlbXBsYXRlID0gX3RlbXBsYXRlO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgLy8gRG9ja2VyIGJ1aWxkIC8vXG4gICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIHZhciBkb2NrZXJfYnVpbGQgPSB1dGlsLmZvcm1hdCgnZG9ja2VyIGJ1aWxkIC10ICVzIC1mICVzJyxcbiAgICAgICAgICBpbWFnZV9uYW1lLFxuICAgICAgICAgIHRlbXBsYXRlLkRvY2tlcmZpbGVfcGF0aCk7XG5cbiAgICAgICAgaWYgKG9wdHMuZnJlc2ggPT0gdHJ1ZSlcbiAgICAgICAgICBkb2NrZXJfYnVpbGQgKz0gJyAtLW5vLWNhY2hlJztcbiAgICAgICAgZG9ja2VyX2J1aWxkICs9ICcgLic7XG5cbiAgICAgICAgY29uc29sZS5sb2coKTtcbiAgICAgICAgZm10LnNlcCgpO1xuICAgICAgICBmbXQudGl0bGUoJ0J1aWxkaW5nIEJvb3QgU3lzdGVtJyk7XG4gICAgICAgIGZtdC5maWVsZCgnVHlwZScsIGNoYWxrLmN5YW4uYm9sZCgnRG9ja2VyJykpO1xuICAgICAgICBmbXQuZmllbGQoJ01vZGUnLCBtb2RlKTtcbiAgICAgICAgZm10LmZpZWxkKCdJbWFnZSBuYW1lJywgaW1hZ2VfbmFtZSk7XG4gICAgICAgIGZtdC5maWVsZCgnRG9ja2VyIGJ1aWxkIGNvbW1hbmQnLCBkb2NrZXJfYnVpbGQpO1xuICAgICAgICBmbXQuZmllbGQoJ0RvY2tlcmZpbGUgcGF0aCcsIHRlbXBsYXRlLkRvY2tlcmZpbGVfcGF0aCk7XG4gICAgICAgIGZtdC5zZXAoKTtcblxuICAgICAgICByZXR1cm4gcHNwYXduKGRvY2tlcl9idWlsZCk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAvLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgIC8vIERvY2tlciBydW4gLy9cbiAgICAgICAgLy8vLy8vLy8vLy8vLy8vL1xuXG4gICAgICAgIHZhciBkb2NrZXJfcnVuID0gJ2RvY2tlciBydW4gLS1uZXQgaG9zdCc7XG5cbiAgICAgICAgaWYgKG9wdHMuZG9ja2VyZGFlbW9uID09IHRydWUpXG4gICAgICAgICAgZG9ja2VyX3J1biArPSAnIC1kJztcbiAgICAgICAgaWYgKG1vZGUgIT0gJ2Rpc3RyaWJ1dGlvbicpXG4gICAgICAgICAgZG9ja2VyX3J1biArPSB1dGlsLmZvcm1hdCgnIC12ICVzOi92YXIvYXBwIC12IC92YXIvYXBwL25vZGVfbW9kdWxlcycsIGFwcF9wYXRoKTtcbiAgICAgICAgZG9ja2VyX3J1biArPSAnICcgKyBpbWFnZV9uYW1lO1xuICAgICAgICB2YXIgZG9ja2VyZmlsZV9wYXJzZWQgPSB0ZW1wbGF0ZS5Eb2NrZXJmaWxlLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgdmFyIGJhc2VfaW1hZ2UgPSBkb2NrZXJmaWxlX3BhcnNlZFswXTtcbiAgICAgICAgdmFyIHJ1bl9jbWQgPSBkb2NrZXJmaWxlX3BhcnNlZFtkb2NrZXJmaWxlX3BhcnNlZC5sZW5ndGggLSAxXTtcblxuICAgICAgICBjb25zb2xlLmxvZygpO1xuICAgICAgICBmbXQuc2VwKCk7XG4gICAgICAgIGZtdC50aXRsZSgnQm9vdGluZycpO1xuICAgICAgICBmbXQuZmllbGQoJ1R5cGUnLCBjaGFsay5jeWFuLmJvbGQoJ0RvY2tlcicpKTtcbiAgICAgICAgZm10LmZpZWxkKCdNb2RlJywgbW9kZSk7XG4gICAgICAgIGZtdC5maWVsZCgnQmFzZSBJbWFnZScsIGJhc2VfaW1hZ2UpO1xuICAgICAgICBmbXQuZmllbGQoJ0ltYWdlIE5hbWUnLCBpbWFnZV9uYW1lKTtcbiAgICAgICAgZm10LmZpZWxkKCdEb2NrZXIgQ29tbWFuZCcsIGRvY2tlcl9ydW4pO1xuICAgICAgICBmbXQuZmllbGQoJ1JVTiBDb21tYW5kJywgcnVuX2NtZCk7XG4gICAgICAgIGZtdC5maWVsZCgnQ1dEJywgYXBwX3BhdGgpO1xuICAgICAgICBmbXQuc2VwKCk7XG4gICAgICAgIHJldHVybiBwc3Bhd24oZG9ja2VyX3J1bik7XG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ibHVlLmJvbGQoJz4+PiBMZWF2aW5nIERvY2tlciBpbnN0YW5jZSB1dWlkPSVzJyksIGltYWdlX25hbWUpO1xuICAgICAgICBzZWxmLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyZXkoJ1JhdyBlcnJvcj0nLCBlcnIubWVzc2FnZSkpO1xuICAgICAgICBzZWxmLmRpc2Nvbm5lY3QoKTtcbiAgICAgIH0pO1xuXG4gIH07XG5cbn07XG5cbmV4cG9ydCB7XG4gIGdlbmVyYXRlRG9ja2VyZmlsZSxcbiAgcGFyc2VBbmRTd2l0Y2gsXG4gIHN3aXRjaERvY2tlckZpbGUsXG59XG4iXX0=