"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _fs = _interopRequireDefault(require("fs"));

var _constants = _interopRequireDefault(require("../../constants"));

var _Utility = _interopRequireDefault(require("../Utility"));

var _Common = _interopRequireDefault(require("../Common"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9BUEkvRGVwbG95LnRzIl0sIm5hbWVzIjpbImRlcGxveUhlbHBlciIsImNvbnNvbGUiLCJsb2ciLCJDTEkiLCJwcm90b3R5cGUiLCJkZXBsb3kiLCJmaWxlIiwiY29tbWFuZHMiLCJjYiIsInRoYXQiLCJleGl0Q2xpIiwiY3N0IiwiU1VDQ0VTU19FWElUIiwiYXJncyIsInJhd0FyZ3MiLCJlbnYiLCJzcGxpY2UiLCJpbmRleE9mIiwiQ29tbW9uIiwiaXNDb25maWdGaWxlIiwiZGVmYXVsdENvbmZpZ05hbWVzIiwiVXRpbGl0eSIsIndoaWNoRmlsZUV4aXN0cyIsInByaW50RXJyb3IiLCJqb2luIiwiRVJST1JfRVhJVCIsImpzb25fY29uZiIsInBhcnNlQ29uZmlnIiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJlIiwicmVxdWlyZSIsImRlcGxveUZvckVudiIsImVyciIsImRhdGEiLCJtZXNzYWdlIiwicHJpbnRPdXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFNQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQVRBOzs7OztBQVdBLFNBQVNBLFlBQVQsR0FBd0I7QUFDdEJDLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEVBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksb0NBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksRUFBWjtBQUNBRCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSwwREFBWjtBQUNBRCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxtQkFBWjtBQUNBRCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSw4Q0FBWjtBQUNBRCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxFQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGFBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksb0RBQVo7QUFDQUQsRUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksOERBQVo7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QUFpQlUsR0FBakIsRUFBc0IsYUFBdEIsQ0FBTCxFQUEyQztBQUN6Q1csTUFBQUEsU0FBUyxDQUFDckIsTUFBVixDQUFpQlUsR0FBakIsRUFBc0IsYUFBdEIsSUFBdUMsd0JBQXdCVCxJQUF4QixHQUErQixTQUEvQixHQUEyQ1MsR0FBbEY7QUFDRDs7QUFFRGdCLElBQUFBLE9BQU8sQ0FBQyxZQUFELENBQVAsQ0FBc0JDLFlBQXRCLENBQW1DTixTQUFTLENBQUNyQixNQUE3QyxFQUFxRFUsR0FBckQsRUFBMERGLElBQTFELEVBQWdFLFVBQVVvQixHQUFWLEVBQWVDLElBQWYsRUFBcUI7QUFDbkYsVUFBSUQsR0FBSixFQUFTO0FBQ1BmLDJCQUFPSyxVQUFQLENBQWtCLGVBQWxCOztBQUNBTCwyQkFBT0ssVUFBUCxDQUFrQlUsR0FBRyxDQUFDRSxPQUFKLElBQWVGLEdBQWpDOztBQUNBLGVBQU96QixFQUFFLEdBQUdBLEVBQUUsQ0FBQ3lCLEdBQUQsQ0FBTCxHQUFheEIsSUFBSSxDQUFDQyxPQUFMLENBQWFDLHNCQUFJYyxVQUFqQixDQUF0QjtBQUNEOztBQUNEUCx5QkFBT2tCLFFBQVAsQ0FBZ0IsYUFBaEI7O0FBQ0EsYUFBTzVCLEVBQUUsR0FBR0EsRUFBRSxDQUFDLElBQUQsRUFBTzBCLElBQVAsQ0FBTCxHQUFvQnpCLElBQUksQ0FBQ0MsT0FBTCxDQUFhQyxzQkFBSUMsWUFBakIsQ0FBN0I7QUFDRCxLQVJEO0FBU0QsR0E1REQ7QUE4REQ7O0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDEzIHRoZSBQTTIgcHJvamVjdCBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBsaWNlbnNlIHRoYXRcbiAqIGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuICovXG5cbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgY3N0IGZyb20gJy4uLy4uL2NvbnN0YW50cyc7XG5pbXBvcnQgVXRpbGl0eSBmcm9tICcuLi9VdGlsaXR5JztcbmltcG9ydCBDb21tb24gZnJvbSAnLi4vQ29tbW9uJztcblxuZnVuY3Rpb24gZGVwbG95SGVscGVyKCkge1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCctLS0tLT4gSGVscGVyOiBEZXBsb3ltZW50IHdpdGggUE0yJyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJyAgR2VuZXJhdGUgYSBzYW1wbGUgZWNvc3lzdGVtLmNvbmZpZy5qcyB3aXRoIHRoZSBjb21tYW5kJyk7XG4gIGNvbnNvbGUubG9nKCcgICQgcG0yIGVjb3N5c3RlbScpO1xuICBjb25zb2xlLmxvZygnICBUaGVuIGVkaXQgdGhlIGZpbGUgZGVwZW5kaW5nIG9uIHlvdXIgbmVlZHMnKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBjb25zb2xlLmxvZygnICBDb21tYW5kczonKTtcbiAgY29uc29sZS5sb2coJyAgICBzZXR1cCAgICAgICAgICAgICAgICBydW4gcmVtb3RlIHNldHVwIGNvbW1hbmRzJyk7XG4gIGNvbnNvbGUubG9nKCcgICAgdXBkYXRlICAgICAgICAgICAgICAgdXBkYXRlIGRlcGxveSB0byB0aGUgbGF0ZXN0IHJlbGVhc2UnKTtcbiAgY29uc29sZS5sb2coJyAgICByZXZlcnQgW25dICAgICAgICAgICByZXZlcnQgdG8gW25ddGggbGFzdCBkZXBsb3ltZW50IG9yIDEnKTtcbiAgY29uc29sZS5sb2coJyAgICBjdXJyW2VudF0gICAgICAgICAgICBvdXRwdXQgY3VycmVudCByZWxlYXNlIGNvbW1pdCcpO1xuICBjb25zb2xlLmxvZygnICAgIHByZXZbaW91c10gICAgICAgICAgIG91dHB1dCBwcmV2aW91cyByZWxlYXNlIGNvbW1pdCcpO1xuICBjb25zb2xlLmxvZygnICAgIGV4ZWN8cnVuIDxjbWQ+ICAgICAgIGV4ZWN1dGUgdGhlIGdpdmVuIDxjbWQ+Jyk7XG4gIGNvbnNvbGUubG9nKCcgICAgbGlzdCAgICAgICAgICAgICAgICAgbGlzdCBwcmV2aW91cyBkZXBsb3kgY29tbWl0cycpO1xuICBjb25zb2xlLmxvZygnICAgIFtyZWZdICAgICAgICAgICAgICAgIGRlcGxveSB0byBbcmVmXSwgdGhlIFwicmVmXCIgc2V0dGluZywgb3IgbGF0ZXN0IHRhZycpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJyAgQmFzaWMgRXhhbXBsZXM6Jyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJyAgICBGaXJzdCBpbml0aWFsaXplIHJlbW90ZSBwcm9kdWN0aW9uIGhvc3Q6Jyk7XG4gIGNvbnNvbGUubG9nKCcgICAgJCBwbTIgZGVwbG95IGVjb3N5c3RlbS5jb25maWcuanMgcHJvZHVjdGlvbiBzZXR1cCcpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCcgICAgVGhlbiBkZXBsb3kgbmV3IGNvZGU6Jyk7XG4gIGNvbnNvbGUubG9nKCcgICAgJCBwbTIgZGVwbG95IGVjb3N5c3RlbS5jb25maWcuanMgcHJvZHVjdGlvbicpO1xuICBjb25zb2xlLmxvZygnJyk7XG4gIGNvbnNvbGUubG9nKCcgICAgSWYgSSB3YW50IHRvIHJldmVydCB0byB0aGUgcHJldmlvdXMgY29tbWl0OicpO1xuICBjb25zb2xlLmxvZygnICAgICQgcG0yIGRlcGxveSBlY29zeXN0ZW0uY29uZmlnLmpzIHByb2R1Y3Rpb24gcmV2ZXJ0IDEnKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBjb25zb2xlLmxvZygnICAgIEV4ZWN1dGUgYSBjb21tYW5kIG9uIHJlbW90ZSBzZXJ2ZXI6Jyk7XG4gIGNvbnNvbGUubG9nKCcgICAgJCBwbTIgZGVwbG95IGVjb3N5c3RlbS5jb25maWcuanMgcHJvZHVjdGlvbiBleGVjIFwicG0yIHJlc3RhcnQgYWxsXCInKTtcbiAgY29uc29sZS5sb2coJycpO1xuICBjb25zb2xlLmxvZygnICAgIFBNMiB3aWxsIGxvb2sgYnkgZGVmYXVsdCB0byB0aGUgZWNvc3lzdGVtLmNvbmZpZy5qcyBmaWxlIHNvIHlvdSBkb250IG5lZWQgdG8gZ2l2ZSB0aGUgZmlsZSBuYW1lOicpO1xuICBjb25zb2xlLmxvZygnICAgICQgcG0yIGRlcGxveSBwcm9kdWN0aW9uJyk7XG4gIGNvbnNvbGUubG9nKCcgICAgRWxzZSB5b3UgaGF2ZSB0byB0ZWxsIFBNMiB0aGUgbmFtZSBvZiB5b3VyIGVjb3N5c3RlbSBmaWxlJyk7XG4gIGNvbnNvbGUubG9nKCcnKTtcbiAgY29uc29sZS5sb2coJyAgICBNb3JlIGV4YW1wbGVzIGluIGh0dHBzOi8vZ2l0aHViLmNvbS9Vbml0ZWNoL3BtMicpO1xuICBjb25zb2xlLmxvZygnJyk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoQ0xJKSB7XG4gIENMSS5wcm90b3R5cGUuZGVwbG95ID0gZnVuY3Rpb24gKGZpbGUsIGNvbW1hbmRzLCBjYikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGlmIChmaWxlID09ICdoZWxwJykge1xuICAgICAgZGVwbG95SGVscGVyKCk7XG4gICAgICByZXR1cm4gY2IgPyBjYigpIDogdGhhdC5leGl0Q2xpKGNzdC5TVUNDRVNTX0VYSVQpO1xuICAgIH1cblxuICAgIHZhciBhcmdzID0gY29tbWFuZHMucmF3QXJncztcbiAgICB2YXIgZW52O1xuXG4gICAgYXJncy5zcGxpY2UoMCwgYXJncy5pbmRleE9mKCdkZXBsb3knKSArIDEpO1xuXG4gICAgLy8gRmluZCBlY29zeXN0ZW0gZmlsZSBieSBkZWZhdWx0XG4gICAgaWYgKCFDb21tb24uaXNDb25maWdGaWxlKGZpbGUpKSB7XG4gICAgICBlbnYgPSBhcmdzWzBdO1xuICAgICAgdmFyIGRlZmF1bHRDb25maWdOYW1lcyA9IFsnZWNvc3lzdGVtLmNvbmZpZy5qcycsICdlY29zeXN0ZW0uanNvbicsICdlY29zeXN0ZW0uanNvbjUnLCAncGFja2FnZS5qc29uJ107XG4gICAgICBmaWxlID0gVXRpbGl0eS53aGljaEZpbGVFeGlzdHMoZGVmYXVsdENvbmZpZ05hbWVzKTtcblxuICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKCdOb3QgYW55IGRlZmF1bHQgZGVwbG95bWVudCBmaWxlIGV4aXN0cy4nICtcbiAgICAgICAgICAnIEFsbG93ZWQgZGVmYXVsdCBjb25maWcgZmlsZSBuYW1lcyBhcmU6ICcgKyBkZWZhdWx0Q29uZmlnTmFtZXMuam9pbignLCAnKSk7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKCdOb3QgYW55IGRlZmF1bHQgZWNvc3lzdGVtIGZpbGUgcHJlc2VudCcpIDogdGhhdC5leGl0Q2xpKGNzdC5FUlJPUl9FWElUKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZVxuICAgICAgZW52ID0gYXJnc1sxXTtcblxuICAgIHZhciBqc29uX2NvbmYgPSBudWxsO1xuXG4gICAgdHJ5IHtcbiAgICAgIGpzb25fY29uZiA9IENvbW1vbi5wYXJzZUNvbmZpZyhmcy5yZWFkRmlsZVN5bmMoZmlsZSksIGZpbGUpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIENvbW1vbi5wcmludEVycm9yKGUpO1xuICAgICAgcmV0dXJuIGNiID8gY2IoZSkgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgIH1cblxuICAgIGlmICghZW52KSB7XG4gICAgICBkZXBsb3lIZWxwZXIoKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKCkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgfVxuXG4gICAgaWYgKCFqc29uX2NvbmYuZGVwbG95IHx8ICFqc29uX2NvbmYuZGVwbG95W2Vudl0pIHtcbiAgICAgIENvbW1vbi5wcmludEVycm9yKCclcyBlbnZpcm9ubWVudCBpcyBub3QgZGVmaW5lZCBpbiAlcyBmaWxlJywgZW52LCBmaWxlKTtcbiAgICAgIHJldHVybiBjYiA/IGNiKCclcyBlbnZpcm9ubWVudCBpcyBub3QgZGVmaW5lZCBpbiAlcyBmaWxlJykgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgIH1cblxuICAgIGlmICghanNvbl9jb25mLmRlcGxveVtlbnZdWydwb3N0LWRlcGxveSddKSB7XG4gICAgICBqc29uX2NvbmYuZGVwbG95W2Vudl1bJ3Bvc3QtZGVwbG95J10gPSAncG0yIHN0YXJ0T3JSZXN0YXJ0ICcgKyBmaWxlICsgJyAtLWVudiAnICsgZW52O1xuICAgIH1cblxuICAgIHJlcXVpcmUoJ3BtMi1kZXBsb3knKS5kZXBsb3lGb3JFbnYoanNvbl9jb25mLmRlcGxveSwgZW52LCBhcmdzLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKCdEZXBsb3kgZmFpbGVkJyk7XG4gICAgICAgIENvbW1vbi5wcmludEVycm9yKGVyci5tZXNzYWdlIHx8IGVycik7XG4gICAgICAgIHJldHVybiBjYiA/IGNiKGVycikgOiB0aGF0LmV4aXRDbGkoY3N0LkVSUk9SX0VYSVQpO1xuICAgICAgfVxuICAgICAgQ29tbW9uLnByaW50T3V0KCctLT4gU3VjY2VzcycpO1xuICAgICAgcmV0dXJuIGNiID8gY2IobnVsbCwgZGF0YSkgOiB0aGF0LmV4aXRDbGkoY3N0LlNVQ0NFU1NfRVhJVCk7XG4gICAgfSk7XG4gIH07XG5cbn07XG4iXX0=