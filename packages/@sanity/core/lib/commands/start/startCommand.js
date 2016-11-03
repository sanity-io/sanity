'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _thenify = require('thenify');

var _thenify2 = _interopRequireDefault(_thenify);

var _server = require('@sanity/storybook/server');

var _server2 = _interopRequireDefault(_server);

var _server3 = require('@sanity/server');

var _getConfig = require('@sanity/util/lib/getConfig');

var _getConfig2 = _interopRequireDefault(_getConfig);

var _isProduction = require('../../util/isProduction');

var _isProduction2 = _interopRequireDefault(_isProduction);

var _reinitializePluginConfigs = require('../../actions/config/reinitializePluginConfigs');

var _reinitializePluginConfigs2 = _interopRequireDefault(_reinitializePluginConfigs);

var _formatMessage = require('./formatMessage');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  name: 'start',
  signature: '',
  description: 'Starts a webserver that serves Sanity',
  action: (args, context) => {
    const flags = args.extOptions;
    const output = context.output,
          workDir = context.workDir;

    const sanityConfig = (0, _getConfig2.default)(workDir);
    const config = sanityConfig.get('server');
    const getServer = _isProduction2.default ? _server3.getProdServer : _server3.getDevServer;
    const server = getServer({
      staticPath: resolveStaticPath(workDir, config),
      basePath: workDir,
      listen: config
    });

    const port = config.port,
          hostname = config.hostname;

    const httpPort = flags.port || port;
    const compiler = server.locals.compiler;
    const listeners = [(0, _thenify2.default)(server.listen.bind(server))(httpPort, hostname)];

    // "invalid" doesn't mean the bundle is invalid, but that it is *invalidated*,
    // in other words, it's recompiling
    let compileSpinner;
    compiler.plugin('invalid', () => {
      output.clear();
      compileSpinner = output.spinner('Compiling...').start();
    });

    // Once the server(s) are listening, show a compiling spinner
    const listenPromise = Promise.all(listeners).then(res => {
      if (!compileSpinner) {
        compileSpinner = output.spinner('Compiling...').start();
      }
      return res;
    });

    // "done" event fires when Webpack has finished recompiling the bundle.
    // Whether or not you have warnings or errors, you will get this event.
    compiler.plugin('done', stats => {
      if (compileSpinner) {
        compileSpinner.stop();
      }

      output.clear();

      const hasErrors = stats.hasErrors();
      const hasWarnings = stats.hasWarnings();

      if (!hasErrors && !hasWarnings) {
        output.print(_chalk2.default.green(`Compiled successfully! Server listening on http://${ hostname }:${ httpPort }`));
        return;
      }

      var _stats$toJson = stats.toJson({}, true);

      const errors = _stats$toJson.errors,
            warnings = _stats$toJson.warnings;

      const formattedWarnings = warnings.map(message => `Warning in ${ (0, _formatMessage.formatMessage)(message) }`);
      let formattedErrors = errors.map(message => `Error in ${ (0, _formatMessage.formatMessage)(message) }`);

      if (hasErrors) {
        output.print(_chalk2.default.red('Failed to compile.'));
        output.print('');

        if (formattedErrors.some(_formatMessage.isLikelyASyntaxError)) {
          // If there are any syntax errors, show just them.
          // This prevents a confusing ESLint parsing error
          // preceding a much more useful Babel syntax error.
          formattedErrors = formattedErrors.filter(_formatMessage.isLikelyASyntaxError);
        }

        formattedErrors.forEach(message => {
          output.print(message);
          output.print('');
        });

        // If errors exist, ignore warnings.
        return;
      }

      if (hasWarnings) {
        output.print(_chalk2.default.yellow('Compiled with warnings.'));
        output.print();

        formattedWarnings.forEach(message => {
          output.print(message);
          output.print();
        });
      }

      listenPromise.then(res => {
        output.print(_chalk2.default.green(`Server listening on http://${ hostname }:${ httpPort }`));
        if (res.length > 1) {
          output.print(_chalk2.default.green(`Storybook listening on ${ res[1] }`));
        }
      });
    });

    const storyConfig = sanityConfig.get('storybook');
    if (storyConfig) {
      const plugins = sanityConfig.get('plugins') || [];
      if (plugins.indexOf('@sanity/storybook') === -1) {
        throw new Error('`@sanity/storybook` is missing from `plugins` array. ' + 'Either add it as a dependency and plugin, or remove the ' + '`storybook` section of your projects `sanity.json`.');
      }

      listeners.push((0, _server2.default)(storyConfig));
    }

    return (0, _reinitializePluginConfigs2.default)({ workDir: workDir, output: output }).then(listenPromise).catch(getGracefulDeathHandler(config));
  }
};


function resolveStaticPath(rootDir, config) {
  const staticPath = config.staticPath;

  return _path2.default.isAbsolute(staticPath) ? staticPath : _path2.default.resolve(_path2.default.join(rootDir, staticPath));
}

function getGracefulDeathHandler(config) {
  return function gracefulDeath(err) {
    if (err.code === 'EADDRINUSE') {
      throw new Error('Port number for Sanity server is already in use, configure `server.port` in `sanity.json`');
    }

    if (err.code === 'EACCES') {
      const help = config.port < 1024 ? 'port numbers below 1024 requires root privileges' : `do you have access to listen to the given hostname (${ config.hostname })?`;

      throw new Error(`Sanity server does not have access to listen to given port - ${ help }`);
    }

    throw err;
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9zdGFydC9zdGFydENvbW1hbmQuanMiXSwibmFtZXMiOlsibmFtZSIsInNpZ25hdHVyZSIsImRlc2NyaXB0aW9uIiwiYWN0aW9uIiwiYXJncyIsImNvbnRleHQiLCJmbGFncyIsImV4dE9wdGlvbnMiLCJvdXRwdXQiLCJ3b3JrRGlyIiwic2FuaXR5Q29uZmlnIiwiY29uZmlnIiwiZ2V0IiwiZ2V0U2VydmVyIiwic2VydmVyIiwic3RhdGljUGF0aCIsInJlc29sdmVTdGF0aWNQYXRoIiwiYmFzZVBhdGgiLCJsaXN0ZW4iLCJwb3J0IiwiaG9zdG5hbWUiLCJodHRwUG9ydCIsImNvbXBpbGVyIiwibG9jYWxzIiwibGlzdGVuZXJzIiwiYmluZCIsImNvbXBpbGVTcGlubmVyIiwicGx1Z2luIiwiY2xlYXIiLCJzcGlubmVyIiwic3RhcnQiLCJsaXN0ZW5Qcm9taXNlIiwiUHJvbWlzZSIsImFsbCIsInRoZW4iLCJyZXMiLCJzdGF0cyIsInN0b3AiLCJoYXNFcnJvcnMiLCJoYXNXYXJuaW5ncyIsInByaW50IiwiZ3JlZW4iLCJ0b0pzb24iLCJlcnJvcnMiLCJ3YXJuaW5ncyIsImZvcm1hdHRlZFdhcm5pbmdzIiwibWFwIiwibWVzc2FnZSIsImZvcm1hdHRlZEVycm9ycyIsInJlZCIsInNvbWUiLCJmaWx0ZXIiLCJmb3JFYWNoIiwieWVsbG93IiwibGVuZ3RoIiwic3RvcnlDb25maWciLCJwbHVnaW5zIiwiaW5kZXhPZiIsIkVycm9yIiwicHVzaCIsImNhdGNoIiwiZ2V0R3JhY2VmdWxEZWF0aEhhbmRsZXIiLCJyb290RGlyIiwiaXNBYnNvbHV0ZSIsInJlc29sdmUiLCJqb2luIiwiZ3JhY2VmdWxEZWF0aCIsImVyciIsImNvZGUiLCJoZWxwIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O2tCQUVlO0FBQ2JBLFFB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QyxnQkFBRCxFQUFVRCxjQUFWLEVBQTFCLEVBQ0owQixJQURJLENBQ0NILGFBREQsRUFFSjZCLEtBRkksQ0FFRUMsd0JBQXdCbEQsTUFBeEIsQ0FGRixDQUFQO0FBR0Q7QUFqSFksQzs7O0FBb0hmLFNBQVNLLGlCQUFULENBQTJCOEMsT0FBM0IsRUFBb0NuRCxNQUFwQyxFQUE0QztBQUFBLFFBQ25DSSxVQURtQyxHQUNyQkosTUFEcUIsQ0FDbkNJLFVBRG1DOztBQUUxQyxTQUFPLGVBQUtnRCxVQUFMLENBQWdCaEQsVUFBaEIsSUFDSEEsVUFERyxHQUVILGVBQUtpRCxPQUFMLENBQWEsZUFBS0MsSUFBTCxDQUFVSCxPQUFWLEVBQW1CL0MsVUFBbkIsQ0FBYixDQUZKO0FBR0Q7O0FBRUQsU0FBUzhDLHVCQUFULENBQWlDbEQsTUFBakMsRUFBeUM7QUFDdkMsU0FBTyxTQUFTdUQsYUFBVCxDQUF1QkMsR0FBdkIsRUFBNEI7QUFDakMsUUFBSUEsSUFBSUMsSUFBSixLQUFhLFlBQWpCLEVBQStCO0FBQzdCLFlBQU0sSUFBSVYsS0FBSixDQUFVLDJGQUFWLENBQU47QUFDRDs7QUFFRCxRQUFJUyxJQUFJQyxJQUFKLEtBQWEsUUFBakIsRUFBMkI7QUFDekIsWUFBTUMsT0FBTzFELE9BQU9RLElBQVAsR0FBYyxJQUFkLEdBQ1Qsa0RBRFMsR0FFUix3REFBc0RSLE9BQU9TLFFBQVMsS0FGM0U7O0FBSUEsWUFBTSxJQUFJc0MsS0FBSixDQUFXLGlFQUErRFcsSUFBSyxHQUEvRSxDQUFOO0FBQ0Q7O0FBRUQsVUFBTUYsR0FBTjtBQUNELEdBZEQ7QUFlRCIsImZpbGUiOiJzdGFydENvbW1hbmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJ1xuaW1wb3J0IHRoZW5pZnkgZnJvbSAndGhlbmlmeSdcbmltcG9ydCBzdG9yeUJvb2sgZnJvbSAnQHNhbml0eS9zdG9yeWJvb2svc2VydmVyJ1xuaW1wb3J0IHtnZXRQcm9kU2VydmVyLCBnZXREZXZTZXJ2ZXJ9IGZyb20gJ0BzYW5pdHkvc2VydmVyJ1xuaW1wb3J0IGdldENvbmZpZyBmcm9tICdAc2FuaXR5L3V0aWwvbGliL2dldENvbmZpZydcbmltcG9ydCBpc1Byb2R1Y3Rpb24gZnJvbSAnLi4vLi4vdXRpbC9pc1Byb2R1Y3Rpb24nXG5pbXBvcnQgcmVpbml0aWFsaXplUGx1Z2luQ29uZmlncyBmcm9tICcuLi8uLi9hY3Rpb25zL2NvbmZpZy9yZWluaXRpYWxpemVQbHVnaW5Db25maWdzJ1xuaW1wb3J0IHtmb3JtYXRNZXNzYWdlLCBpc0xpa2VseUFTeW50YXhFcnJvcn0gZnJvbSAnLi9mb3JtYXRNZXNzYWdlJ1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIG5hbWU6ICdzdGFydCcsXG4gIHNpZ25hdHVyZTogJycsXG4gIGRlc2NyaXB0aW9uOiAnU3RhcnRzIGEgd2Vic2VydmVyIHRoYXQgc2VydmVzIFNhbml0eScsXG4gIGFjdGlvbjogKGFyZ3MsIGNvbnRleHQpID0+IHtcbiAgICBjb25zdCBmbGFncyA9IGFyZ3MuZXh0T3B0aW9uc1xuICAgIGNvbnN0IHtvdXRwdXQsIHdvcmtEaXJ9ID0gY29udGV4dFxuICAgIGNvbnN0IHNhbml0eUNvbmZpZyA9IGdldENvbmZpZyh3b3JrRGlyKVxuICAgIGNvbnN0IGNvbmZpZyA9IHNhbml0eUNvbmZpZy5nZXQoJ3NlcnZlcicpXG4gICAgY29uc3QgZ2V0U2VydmVyID0gaXNQcm9kdWN0aW9uID8gZ2V0UHJvZFNlcnZlciA6IGdldERldlNlcnZlclxuICAgIGNvbnN0IHNlcnZlciA9IGdldFNlcnZlcih7XG4gICAgICBzdGF0aWNQYXRoOiByZXNvbHZlU3RhdGljUGF0aCh3b3JrRGlyLCBjb25maWcpLFxuICAgICAgYmFzZVBhdGg6IHdvcmtEaXIsXG4gICAgICBsaXN0ZW46IGNvbmZpZ1xuICAgIH0pXG5cbiAgICBjb25zdCB7cG9ydCwgaG9zdG5hbWV9ID0gY29uZmlnXG4gICAgY29uc3QgaHR0cFBvcnQgPSBmbGFncy5wb3J0IHx8IHBvcnRcbiAgICBjb25zdCBjb21waWxlciA9IHNlcnZlci5sb2NhbHMuY29tcGlsZXJcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSBbdGhlbmlmeShzZXJ2ZXIubGlzdGVuLmJpbmQoc2VydmVyKSkoaHR0cFBvcnQsIGhvc3RuYW1lKV1cblxuICAgIC8vIFwiaW52YWxpZFwiIGRvZXNuJ3QgbWVhbiB0aGUgYnVuZGxlIGlzIGludmFsaWQsIGJ1dCB0aGF0IGl0IGlzICppbnZhbGlkYXRlZCosXG4gICAgLy8gaW4gb3RoZXIgd29yZHMsIGl0J3MgcmVjb21waWxpbmdcbiAgICBsZXQgY29tcGlsZVNwaW5uZXJcbiAgICBjb21waWxlci5wbHVnaW4oJ2ludmFsaWQnLCAoKSA9PiB7XG4gICAgICBvdXRwdXQuY2xlYXIoKVxuICAgICAgY29tcGlsZVNwaW5uZXIgPSBvdXRwdXQuc3Bpbm5lcignQ29tcGlsaW5nLi4uJykuc3RhcnQoKVxuICAgIH0pXG5cbiAgICAvLyBPbmNlIHRoZSBzZXJ2ZXIocykgYXJlIGxpc3RlbmluZywgc2hvdyBhIGNvbXBpbGluZyBzcGlubmVyXG4gICAgY29uc3QgbGlzdGVuUHJvbWlzZSA9IFByb21pc2UuYWxsKGxpc3RlbmVycykudGhlbihyZXMgPT4ge1xuICAgICAgaWYgKCFjb21waWxlU3Bpbm5lcikge1xuICAgICAgICBjb21waWxlU3Bpbm5lciA9IG91dHB1dC5zcGlubmVyKCdDb21waWxpbmcuLi4nKS5zdGFydCgpXG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzXG4gICAgfSlcblxuICAgIC8vIFwiZG9uZVwiIGV2ZW50IGZpcmVzIHdoZW4gV2VicGFjayBoYXMgZmluaXNoZWQgcmVjb21waWxpbmcgdGhlIGJ1bmRsZS5cbiAgICAvLyBXaGV0aGVyIG9yIG5vdCB5b3UgaGF2ZSB3YXJuaW5ncyBvciBlcnJvcnMsIHlvdSB3aWxsIGdldCB0aGlzIGV2ZW50LlxuICAgIGNvbXBpbGVyLnBsdWdpbignZG9uZScsIHN0YXRzID0+IHtcbiAgICAgIGlmIChjb21waWxlU3Bpbm5lcikge1xuICAgICAgICBjb21waWxlU3Bpbm5lci5zdG9wKClcbiAgICAgIH1cblxuICAgICAgb3V0cHV0LmNsZWFyKClcblxuICAgICAgY29uc3QgaGFzRXJyb3JzID0gc3RhdHMuaGFzRXJyb3JzKClcbiAgICAgIGNvbnN0IGhhc1dhcm5pbmdzID0gc3RhdHMuaGFzV2FybmluZ3MoKVxuXG4gICAgICBpZiAoIWhhc0Vycm9ycyAmJiAhaGFzV2FybmluZ3MpIHtcbiAgICAgICAgb3V0cHV0LnByaW50KGNoYWxrLmdyZWVuKGBDb21waWxlZCBzdWNjZXNzZnVsbHkhIFNlcnZlciBsaXN0ZW5pbmcgb24gaHR0cDovLyR7aG9zdG5hbWV9OiR7aHR0cFBvcnR9YCkpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCB7ZXJyb3JzLCB3YXJuaW5nc30gPSBzdGF0cy50b0pzb24oe30sIHRydWUpXG4gICAgICBjb25zdCBmb3JtYXR0ZWRXYXJuaW5ncyA9IHdhcm5pbmdzLm1hcChtZXNzYWdlID0+IGBXYXJuaW5nIGluICR7Zm9ybWF0TWVzc2FnZShtZXNzYWdlKX1gKVxuICAgICAgbGV0IGZvcm1hdHRlZEVycm9ycyA9IGVycm9ycy5tYXAobWVzc2FnZSA9PiBgRXJyb3IgaW4gJHtmb3JtYXRNZXNzYWdlKG1lc3NhZ2UpfWApXG5cbiAgICAgIGlmIChoYXNFcnJvcnMpIHtcbiAgICAgICAgb3V0cHV0LnByaW50KGNoYWxrLnJlZCgnRmFpbGVkIHRvIGNvbXBpbGUuJykpXG4gICAgICAgIG91dHB1dC5wcmludCgnJylcblxuICAgICAgICBpZiAoZm9ybWF0dGVkRXJyb3JzLnNvbWUoaXNMaWtlbHlBU3ludGF4RXJyb3IpKSB7XG4gICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIGFueSBzeW50YXggZXJyb3JzLCBzaG93IGp1c3QgdGhlbS5cbiAgICAgICAgICAvLyBUaGlzIHByZXZlbnRzIGEgY29uZnVzaW5nIEVTTGludCBwYXJzaW5nIGVycm9yXG4gICAgICAgICAgLy8gcHJlY2VkaW5nIGEgbXVjaCBtb3JlIHVzZWZ1bCBCYWJlbCBzeW50YXggZXJyb3IuXG4gICAgICAgICAgZm9ybWF0dGVkRXJyb3JzID0gZm9ybWF0dGVkRXJyb3JzLmZpbHRlcihpc0xpa2VseUFTeW50YXhFcnJvcilcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcm1hdHRlZEVycm9ycy5mb3JFYWNoKG1lc3NhZ2UgPT4ge1xuICAgICAgICAgIG91dHB1dC5wcmludChtZXNzYWdlKVxuICAgICAgICAgIG91dHB1dC5wcmludCgnJylcbiAgICAgICAgfSlcblxuICAgICAgICAvLyBJZiBlcnJvcnMgZXhpc3QsIGlnbm9yZSB3YXJuaW5ncy5cbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmIChoYXNXYXJuaW5ncykge1xuICAgICAgICBvdXRwdXQucHJpbnQoY2hhbGsueWVsbG93KCdDb21waWxlZCB3aXRoIHdhcm5pbmdzLicpKVxuICAgICAgICBvdXRwdXQucHJpbnQoKVxuXG4gICAgICAgIGZvcm1hdHRlZFdhcm5pbmdzLmZvckVhY2gobWVzc2FnZSA9PiB7XG4gICAgICAgICAgb3V0cHV0LnByaW50KG1lc3NhZ2UpXG4gICAgICAgICAgb3V0cHV0LnByaW50KClcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgbGlzdGVuUHJvbWlzZS50aGVuKHJlcyA9PiB7XG4gICAgICAgIG91dHB1dC5wcmludChjaGFsay5ncmVlbihgU2VydmVyIGxpc3RlbmluZyBvbiBodHRwOi8vJHtob3N0bmFtZX06JHtodHRwUG9ydH1gKSlcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgb3V0cHV0LnByaW50KGNoYWxrLmdyZWVuKGBTdG9yeWJvb2sgbGlzdGVuaW5nIG9uICR7cmVzWzFdfWApKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBjb25zdCBzdG9yeUNvbmZpZyA9IHNhbml0eUNvbmZpZy5nZXQoJ3N0b3J5Ym9vaycpXG4gICAgaWYgKHN0b3J5Q29uZmlnKSB7XG4gICAgICBjb25zdCBwbHVnaW5zID0gc2FuaXR5Q29uZmlnLmdldCgncGx1Z2lucycpIHx8IFtdXG4gICAgICBpZiAocGx1Z2lucy5pbmRleE9mKCdAc2FuaXR5L3N0b3J5Ym9vaycpID09PSAtMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ2BAc2FuaXR5L3N0b3J5Ym9va2AgaXMgbWlzc2luZyBmcm9tIGBwbHVnaW5zYCBhcnJheS4gJ1xuICAgICAgICAgICsgJ0VpdGhlciBhZGQgaXQgYXMgYSBkZXBlbmRlbmN5IGFuZCBwbHVnaW4sIG9yIHJlbW92ZSB0aGUgJ1xuICAgICAgICAgICsgJ2BzdG9yeWJvb2tgIHNlY3Rpb24gb2YgeW91ciBwcm9qZWN0cyBgc2FuaXR5Lmpzb25gLidcbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICBsaXN0ZW5lcnMucHVzaChzdG9yeUJvb2soc3RvcnlDb25maWcpKVxuICAgIH1cblxuICAgIHJldHVybiByZWluaXRpYWxpemVQbHVnaW5Db25maWdzKHt3b3JrRGlyLCBvdXRwdXR9KVxuICAgICAgLnRoZW4obGlzdGVuUHJvbWlzZSlcbiAgICAgIC5jYXRjaChnZXRHcmFjZWZ1bERlYXRoSGFuZGxlcihjb25maWcpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTdGF0aWNQYXRoKHJvb3REaXIsIGNvbmZpZykge1xuICBjb25zdCB7c3RhdGljUGF0aH0gPSBjb25maWdcbiAgcmV0dXJuIHBhdGguaXNBYnNvbHV0ZShzdGF0aWNQYXRoKVxuICAgID8gc3RhdGljUGF0aFxuICAgIDogcGF0aC5yZXNvbHZlKHBhdGguam9pbihyb290RGlyLCBzdGF0aWNQYXRoKSlcbn1cblxuZnVuY3Rpb24gZ2V0R3JhY2VmdWxEZWF0aEhhbmRsZXIoY29uZmlnKSB7XG4gIHJldHVybiBmdW5jdGlvbiBncmFjZWZ1bERlYXRoKGVycikge1xuICAgIGlmIChlcnIuY29kZSA9PT0gJ0VBRERSSU5VU0UnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BvcnQgbnVtYmVyIGZvciBTYW5pdHkgc2VydmVyIGlzIGFscmVhZHkgaW4gdXNlLCBjb25maWd1cmUgYHNlcnZlci5wb3J0YCBpbiBgc2FuaXR5Lmpzb25gJylcbiAgICB9XG5cbiAgICBpZiAoZXJyLmNvZGUgPT09ICdFQUNDRVMnKSB7XG4gICAgICBjb25zdCBoZWxwID0gY29uZmlnLnBvcnQgPCAxMDI0XG4gICAgICAgID8gJ3BvcnQgbnVtYmVycyBiZWxvdyAxMDI0IHJlcXVpcmVzIHJvb3QgcHJpdmlsZWdlcydcbiAgICAgICAgOiBgZG8geW91IGhhdmUgYWNjZXNzIHRvIGxpc3RlbiB0byB0aGUgZ2l2ZW4gaG9zdG5hbWUgKCR7Y29uZmlnLmhvc3RuYW1lfSk/YFxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFNhbml0eSBzZXJ2ZXIgZG9lcyBub3QgaGF2ZSBhY2Nlc3MgdG8gbGlzdGVuIHRvIGdpdmVuIHBvcnQgLSAke2hlbHB9YClcbiAgICB9XG5cbiAgICB0aHJvdyBlcnJcbiAgfVxufVxuIl19