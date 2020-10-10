"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _fs = _interopRequireDefault(require("fs"));

var _constants = _interopRequireDefault(require("../../constants"));

var _Utility = _interopRequireDefault(require("../Utility"));

var _Common = _interopRequireDefault(require("../Common"));

/**
 * Copyright 2013 the PM2 project authors. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */
function deployHelper() {
  console.log('');
  console.log('-----> Helper: Deployment with PM2');
  console.log('');
  console.log('  Generate a sample ecosystem.config.js with the command');
  console.log('  $ pm2 ecosystem');
  console.log('  Then edit the file depending on your needs');
  console.log('');
  console.log('  Commands:');
  console.log('    setup                run remote setup commands');
  console.log('    update               update deploy to the latest release');
  console.log('    revert [n]           revert to [n]th last deployment or 1');
  console.log('    curr[ent]            output current release commit');
  console.log('    prev[ious]           output previous release commit');
  console.log('    exec|run <cmd>       execute the given <cmd>');
  console.log('    list                 list previous deploy commits');
  console.log('    [ref]                deploy to [ref], the "ref" setting, or latest tag');
  console.log('');
  console.log('');
  console.log('  Basic Examples:');
  console.log('');
  console.log('    First initialize remote production host:');
  console.log('    $ pm2 deploy ecosystem.config.js production setup');
  console.log('');
  console.log('    Then deploy new code:');
  console.log('    $ pm2 deploy ecosystem.config.js production');
  console.log('');
  console.log('    If I want to revert to the previous commit:');
  console.log('    $ pm2 deploy ecosystem.config.js production revert 1');
  console.log('');
  console.log('    Execute a command on remote server:');
  console.log('    $ pm2 deploy ecosystem.config.js production exec "pm2 restart all"');
  console.log('');
  console.log('    PM2 will look by default to the ecosystem.config.js file so you dont need to give the file name:');
  console.log('    $ pm2 deploy production');
  console.log('    Else you have to tell PM2 the name of your ecosystem file');
  console.log('');
  console.log('    More examples in https://github.com/Unitech/pm2');
  console.log('');
}

;

function _default(CLI) {
  CLI.prototype.deploy = function (file, commands, cb) {
    var that = this;

    if (file == 'help') {
      deployHelper();
      return cb ? cb() : that.exitCli(_constants["default"].SUCCESS_EXIT);
    }

    var args = commands.rawArgs;
    var env;
    args.splice(0, args.indexOf('deploy') + 1); // Find ecosystem file by default

    if (!_Common["default"].isConfigFile(file)) {
      env = args[0];
      var defaultConfigNames = ['ecosystem.config.js', 'ecosystem.json', 'ecosystem.json5', 'package.json'];
      file = _Utility["default"].whichFileExists(defaultConfigNames);

      if (!file) {
        _Common["default"].printError('Not any default deployment file exists.' + ' Allowed default config file names are: ' + defaultConfigNames.join(', '));

        return cb ? cb('Not any default ecosystem file present') : that.exitCli(_constants["default"].ERROR_EXIT);
      }
    } else env = args[1];

    var json_conf = null;

    try {
      json_conf = _Common["default"].parseConfig(_fs["default"].readFileSync(file), file);
    } catch (e) {
      _Common["default"].printError(e);

      return cb ? cb(e) : that.exitCli(_constants["default"].ERROR_EXIT);
    }

    if (!env) {
      deployHelper();
      return cb ? cb() : that.exitCli(_constants["default"].SUCCESS_EXIT);
    }

    if (!json_conf.deploy || !json_conf.deploy[env]) {
      _Common["default"].printError('%s environment is not defined in %s file', env, file);

      return cb ? cb('%s environment is not defined in %s file') : that.exitCli(_constants["default"].ERROR_EXIT);
    }

    if (!json_conf.deploy[env]['post-deploy']) {
      json_conf.deploy[env]['post-deploy'] = 'pm2 startOrRestart ' + file + ' --env ' + env;
    }

    require('pm2-deploy').deployForEnv(json_conf.deploy, env, args, function (err, data) {
      if (err) {
        _Common["default"].printError('Deploy failed');

        _Common["default"].printError(err.message || err);

        return cb ? cb(err) : that.exitCli(_constants["default"].ERROR_EXIT);
      }

      _Common["default"].printOut('--> Success');

      return cb ? cb(null, data) : that.exitCli(_constants["default"].SUCCESS_EXIT);
    });
  };
}

;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvRGVwbG95LnRzIl0sIm5hbWVzIjpbImRlcGxveUhlbHBlciIsImNvbnNvbGUiLCJsb2ciLCJDTEkiLCJwcm90b3R5cGUiLCJkZXBsb3kiLCJmaWxlIiwiY29tbWFuZHMiLCJjYiIsInRoYXQiLCJleGl0Q2xpIiwiY3N0IiwiU1VDQ0VTU19FWElUIiwiYXJncyIsInJhd0FyZ3MiLCJlbnYiLCJzcGxpY2UiLCJpbmRleE9mIiwiQ29tbW9uIiwiaXNDb25maWdGaWxlIiwiZGVmYXVsdENvbmZpZ05hbWVzIiwiVXRpbGl0eSIsIndoaWNoRmlsZUV4aXN0cyIsInByaW50RXJyb3IiLCJqb2luIiwiRVJST1JfRVhJVCIsImpzb25fY29uZiIsInBhcnNlQ29uZmlnIiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJlIiwicmVxdWlyZSIsImRlcGxveUZvckVudiIsImVyciIsImRhdGEiLCJtZXNzYWdlIiwicHJpbnRPdXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQU1BOztBQUNBOztBQUNBOztBQUNBOztBQVRBOzs7OztBQVdBLFNBQVNBLFlBQVQsR0FBd0I7QUFDcEJDLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksb0NBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksRUFBWjtBQUNBRCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSwwREFBWjtBQUNBRCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxtQkFBWjtBQUNBRCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSw4Q0FBWjtBQUNBRCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxFQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGFBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksb0RBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksOERBQVo7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aUJVLEdBQWpCLEVBQXNCLGFBQXRCLENBQUwsRUFBMkM7QUFDdkNXLE1BQUFBLFNBQVMsQ0FBQ3JCLE1BQVYsQ0FBaUJVLEdBQWpCLEVBQXNCLGFBQXRCLElBQXVDLHdCQUF3QlQsSUFBeEIsR0FBK0IsU0FBL0IsR0FBMkNTLEdBQWxGO0FBQ0g7O0FBRURnQixJQUFBQSxPQUFPLENBQUMsWUFBRCxDQUFQLENBQXNCQyxZQUF0QixDQUFtQ04sU0FBUyxDQUFDckIsTUFBN0MsRUFBcURVLEdBQXJELEVBQTBERixJQUExRCxFQUFnRSxVQUFVb0IsR0FBVixFQUFlQyxJQUFmLEVBQXFCO0FBQ2pGLFVBQUlELEdBQUosRUFBUztBQUNMZiwyQkFBT0ssVUFBUCxDQUFrQixlQUFsQjs7QUFDQUwsMkJBQU9LLFVBQVAsQ0FBa0JVLEdBQUcsQ0FBQ0UsT0FBSixJQUFlRixHQUFqQzs7QUFDQSxlQUFPekIsRUFBRSxHQUFHQSxFQUFFLENBQUN5QixHQUFELENBQUwsR0FBYXhCLElBQUksQ0FBQ0MsT0FBTCxDQUFhQyxzQkFBSWMsVUFBakIsQ0FBdEI7QUFDSDs7QUFDRFAseUJBQU9rQixRQUFQLENBQWdCLGFBQWhCOztBQUNBLGFBQU81QixFQUFFLEdBQUdBLEVBQUUsQ0FBQyxJQUFELEVBQU8wQixJQUFQLENBQUwsR0FBb0J6QixJQUFJLENBQUNDLE9BQUwsQ0FBYUMsc0JBQUlDLFlBQWpCLENBQTdCO0FBQ0gsS0FSRDtBQVNILEdBNUREO0FBOERIOztBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMyB0aGUgUE0yIHByb2plY3QgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgbGljZW5zZSB0aGF0XG4gKiBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cbiAqL1xuXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGNzdCBmcm9tICcuLi8uLi9jb25zdGFudHMnO1xuaW1wb3J0IFV0aWxpdHkgZnJvbSAnLi4vVXRpbGl0eSc7XG5pbXBvcnQgQ29tbW9uIGZyb20gJy4uL0NvbW1vbic7XG5cbmZ1bmN0aW9uIGRlcGxveUhlbHBlcigpIHtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJy0tLS0tPiBIZWxwZXI6IERlcGxveW1lbnQgd2l0aCBQTTInKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJyAgR2VuZXJhdGUgYSBzYW1wbGUgZWNvc3lzdGVtLmNvbmZpZy5qcyB3aXRoIHRoZSBjb21tYW5kJyk7XG4gICAgY29uc29sZS5sb2coJyAgJCBwbTIgZWNvc3lzdGVtJyk7XG4gICAgY29uc29sZS5sb2coJyAgVGhlbiBlZGl0IHRoZSBmaWxlIGRlcGVuZGluZyBvbiB5b3VyIG5lZWRzJyk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCcgIENvbW1hbmRzOicpO1xuICAgIGNvbnNvbGUubG9nKCcgICAgc2V0dXAgICAgICAgICAgICAgICAgcnVuIHJlbW90ZSBzZXR1cCBjb21tYW5kcycpO1xuICAgIGNvbnNvbGUubG9nKCcgICAgdXBkYXRlICAgICAgICAgICAgICAgdXBkYXRlIGRlcGxveSB0byB0aGUgbGF0ZXN0IHJlbGVhc2UnKTtcbiAgICBjb25zb2xlLmxvZygnICAgIHJldmVydCBbbl0gICAgICAgICAgIHJldmVydCB0byBbbl10aCBsYXN0IGRlcGxveW1lbnQgb3IgMScpO1xuICAgIGNvbnNvbGUubG9nKCcgICAgY3VycltlbnRdICAgICAgICAgICAgb3V0cHV0IGN1cnJlbnQgcmVsZWFzZSBjb21taXQnKTtcbiAgICBjb25zb2xlLmxvZygnICAgIHByZXZbaW91c10gICAgICAgICAgIG91dHB1dCBwcmV2aW91cyByZWxlYXNlIGNvbW1pdCcpO1xuICAgIGNvbnNvbGUubG9nKCcgICAgZXhlY3xydW4gPGNtZD4gICAgICAgZXhlY3V0ZSB0aGUgZ2l2ZW4gPGNtZD4nKTtcbiAgICBjb25zb2xlLmxvZygnICAgIGxpc3QgICAgICAgICAgICAgICAgIGxpc3QgcHJldmlvdXMgZGVwbG95IGNvbW1pdHMnKTtcbiAgICBjb25zb2xlLmxvZygnICAgIFtyZWZdICAgICAgICAgICAgICAgIGRlcGxveSB0byBbcmVmXSwgdGhlIFwicmVmXCIgc2V0dGluZywgb3IgbGF0ZXN0IHRhZycpO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJyAgQmFzaWMgRXhhbXBsZXM6Jyk7XG4gICAgY29uc29sZS5sb2coJycpO1xuICAgIGNvbnNvbGUubG9nKCcgICAgRmlyc3QgaW5pdGlhbGl6ZSByZW1vdGUgcHJvZHVjdGlvbiBob3N0OicpO1xuICAgIGNvbnNvbGUubG9nKCcgICAgJCBwbTIgZGVwbG95IGVjb3N5c3RlbS5jb25maWcuanMgcHJvZHVjdGlvbiBzZXR1cCcpO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZygnICAgIFRoZW4gZGVwbG95IG5ldyBjb2RlOicpO1xuICAgIGNvbnNvbGUubG9nKCcgICAgJCBwbTIgZGVwbG95IGVjb3N5c3RlbS5jb25maWcuanMgcHJvZHVjdGlvbicpO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICBjb25zb2xlLmxvZygnICAgIElmIEkgd2FudCB0byByZXZlcnQgdG8gdGhlIHByZXZpb3VzIGNvbW1pdDonKTtcbiAgICBjb25zb2xlLmxvZygnICAgICQgcG0yIGRlcGxveSBlY29zeXN0ZW0uY29uZmlnLmpzIHByb2R1Y3Rpb24gcmV2ZXJ0IDEnKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJyAgICBFeGVjdXRlIGEgY29tbWFuZCBvbiByZW1vdGUgc2VydmVyOicpO1xuICAgIGNvbnNvbGUubG9nKCcgICAgJCBwbTIgZGVwbG95IGVjb3N5c3RlbS5jb25maWcuanMgcHJvZHVjdGlvbiBleGVjIFwicG0yIHJlc3RhcnQgYWxsXCInKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJyAgICBQTTIgd2lsbCBsb29rIGJ5IGRlZmF1bHQgdG8gdGhlIGVjb3N5c3RlbS5jb25maWcuanMgZmlsZSBzbyB5b3UgZG9udCBuZWVkIHRvIGdpdmUgdGhlIGZpbGUgbmFtZTonKTtcbiAgICBjb25zb2xlLmxvZygnICAgICQgcG0yIGRlcGxveSBwcm9kdWN0aW9uJyk7XG4gICAgY29uc29sZS5sb2coJyAgICBFbHNlIHlvdSBoYXZlIHRvIHRlbGwgUE0yIHRoZSBuYW1lIG9mIHlvdXIgZWNvc3lzdGVtIGZpbGUnKTtcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgY29uc29sZS5sb2coJyAgICBNb3JlIGV4YW1wbGVzIGluIGh0dHBzOi8vZ2l0aHViLmNvbS9Vbml0ZWNoL3BtMicpO1xuICAgIGNvbnNvbGUubG9nKCcnKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChDTEkpIHtcbiAgICBDTEkucHJvdG90eXBlLmRlcGxveSA9IGZ1bmN0aW9uIChmaWxlLCBjb21tYW5kcywgY2IpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgIGlmIChmaWxlID09ICdoZWxwJykge1xuICAgICAgICAgICAgZGVwbG95SGVscGVyKCk7XG4gICAgICAgICAgICByZXR1cm4gY2IgPyBjYigpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFyZ3MgPSBjb21tYW5kcy5yYXdBcmdzO1xuICAgICAgICB2YXIgZW52O1xuXG4gICAgICAgIGFyZ3Muc3BsaWNlKDAsIGFyZ3MuaW5kZXhPZignZGVwbG95JykgKyAxKTtcblxuICAgICAgICAvLyBGaW5kIGVjb3N5c3RlbSBmaWxlIGJ5IGRlZmF1bHRcbiAgICAgICAgaWYgKCFDb21tb24uaXNDb25maWdGaWxlKGZpbGUpKSB7XG4gICAgICAgICAgICBlbnYgPSBhcmdzWzBdO1xuICAgICAgICAgICAgdmFyIGRlZmF1bHRDb25maWdOYW1lcyA9IFsnZWNvc3lzdGVtLmNvbmZpZy5qcycsICdlY29zeXN0ZW0uanNvbicsICdlY29zeXN0ZW0uanNvbjUnLCAncGFja2FnZS5qc29uJ107XG4gICAgICAgICAgICBmaWxlID0gVXRpbGl0eS53aGljaEZpbGVFeGlzdHMoZGVmYXVsdENvbmZpZ05hbWVzKTtcblxuICAgICAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ05vdCBhbnkgZGVmYXVsdCBkZXBsb3ltZW50IGZpbGUgZXhpc3RzLicgK1xuICAgICAgICAgICAgICAgICAgICAnIEFsbG93ZWQgZGVmYXVsdCBjb25maWcgZmlsZSBuYW1lcyBhcmU6ICcgKyBkZWZhdWx0Q29uZmlnTmFtZXMuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoJ05vdCBhbnkgZGVmYXVsdCBlY29zeXN0ZW0gZmlsZSBwcmVzZW50JykgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVudiA9IGFyZ3NbMV07XG5cbiAgICAgICAgdmFyIGpzb25fY29uZiA9IG51bGw7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGpzb25fY29uZiA9IENvbW1vbi5wYXJzZUNvbmZpZyhmcy5yZWFkRmlsZVN5bmMoZmlsZSksIGZpbGUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlKTtcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKGUpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZW52KSB7XG4gICAgICAgICAgICBkZXBsb3lIZWxwZXIoKTtcbiAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKCkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWpzb25fY29uZi5kZXBsb3kgfHwgIWpzb25fY29uZi5kZXBsb3lbZW52XSkge1xuICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoJyVzIGVudmlyb25tZW50IGlzIG5vdCBkZWZpbmVkIGluICVzIGZpbGUnLCBlbnYsIGZpbGUpO1xuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IoJyVzIGVudmlyb25tZW50IGlzIG5vdCBkZWZpbmVkIGluICVzIGZpbGUnKSA6IHRoYXQuZXhpdENsaShjc3QuRVJST1JfRVhJVCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWpzb25fY29uZi5kZXBsb3lbZW52XVsncG9zdC1kZXBsb3knXSkge1xuICAgICAgICAgICAganNvbl9jb25mLmRlcGxveVtlbnZdWydwb3N0LWRlcGxveSddID0gJ3BtMiBzdGFydE9yUmVzdGFydCAnICsgZmlsZSArICcgLS1lbnYgJyArIGVudjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVpcmUoJ3BtMi1kZXBsb3knKS5kZXBsb3lGb3JFbnYoanNvbl9jb25mLmRlcGxveSwgZW52LCBhcmdzLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgQ29tbW9uLnByaW50RXJyb3IoJ0RlcGxveSBmYWlsZWQnKTtcbiAgICAgICAgICAgICAgICBDb21tb24ucHJpbnRFcnJvcihlcnIubWVzc2FnZSB8fCBlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYiA/IGNiKGVycikgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ29tbW9uLnByaW50T3V0KCctLT4gU3VjY2VzcycpO1xuICAgICAgICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgZGF0YSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbn07XG4iXX0=