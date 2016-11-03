'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

let installPlugin = (() => {
  var _ref2 = _asyncToGenerator(function* (plugin, context) {
    const output = context.output,
          workDir = context.workDir,
          yarn = context.yarn;

    const isNamespaced = plugin[0] === '@';
    let shortName = plugin;
    let fullName = plugin;

    if (!isNamespaced) {
      const isFullName = plugin.indexOf('sanity-plugin-') === 0;
      shortName = isFullName ? plugin.substr(14) : plugin;
      fullName = isFullName ? plugin : `sanity-plugin-${ plugin }`;
    }

    yield yarn(['add', fullName], context);
    yield (0, _addPluginToManifest2.default)(workDir, shortName);
    yield copyConfiguration(workDir, fullName, shortName, output);

    output.print(`Plugin '${ fullName }' installed`);
  });

  return function installPlugin(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
})();

let copyConfiguration = (() => {
  var _ref3 = _asyncToGenerator(function* (rootDir, fullName, shortName, output) {
    const configPath = _path2.default.join(rootDir, 'node_modules', fullName, 'config.dist.json');
    const dstPath = _path2.default.join(rootDir, 'config', `${ shortName }.json`);

    if (!_fsPromise2.default.existsSync(configPath)) {
      return;
    }

    // Configuration exists, check if user has local configuration already
    if (_fsPromise2.default.existsSync(dstPath)) {
      const distChecksum = yield (0, _generateConfigChecksum2.default)(configPath);
      const sameChecksum = yield (0, _pluginChecksumManifest.hasSameChecksum)(rootDir, fullName, distChecksum);
      warnOnDifferentChecksum(shortName, sameChecksum, output.print);
    } else {
      // Destination file does not exist, copy
      yield _fsPromise2.default.copy(configPath, dstPath);
      const checksum = yield (0, _generateConfigChecksum2.default)(configPath);
      yield (0, _pluginChecksumManifest.setChecksum)(rootDir, fullName, checksum);
    }
  });

  return function copyConfiguration(_x5, _x6, _x7, _x8) {
    return _ref3.apply(this, arguments);
  };
})();

// @todo Improve with some sort of helpful key differ or similar


var _fsPromise = require('fs-promise');

var _fsPromise2 = _interopRequireDefault(_fsPromise);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _generateConfigChecksum = require('../../util/generateConfigChecksum');

var _generateConfigChecksum2 = _interopRequireDefault(_generateConfigChecksum);

var _addPluginToManifest = require('@sanity/util/lib/addPluginToManifest');

var _addPluginToManifest2 = _interopRequireDefault(_addPluginToManifest);

var _pluginChecksumManifest = require('../../util/pluginChecksumManifest');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = {
  name: 'install',
  signature: '[PLUGIN]',
  description: 'Installs a Sanity plugin to the current Sanity configuration',
  action: (() => {
    var _ref = _asyncToGenerator(function* (args, context) {
      const extOptions = args.extOptions;
      const yarn = context.yarn;

      var _args$argsWithoutOpti = _slicedToArray(args.argsWithoutOptions, 1);

      const plugin = _args$argsWithoutOpti[0];

      if (!plugin) {
        const flags = extOptions.offline ? ['--offline'] : [];
        return yield yarn(['install'].concat(flags), context);
      }

      // @todo add support for multiple simultaneous plugins to be installed
      return yield installPlugin(plugin, context);
    });

    return function action(_x, _x2) {
      return _ref.apply(this, arguments);
    };
  })()
};
function warnOnDifferentChecksum(plugin, sameChecksum, printer) {
  if (!sameChecksum) {
    printer([`[Warning] Default configuration for plugin '${ plugin }' has changed since you first installed it,`, 'check local configuration vs distributed configuration to ensure your configuration is up to date'].join(' '));
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9pbnN0YWxsL2luc3RhbGxDb21tYW5kLmpzIl0sIm5hbWVzIjpbInBsdWdpbiIsImNvbnRleHQiLCJvdXRwdXQiLCJ3b3JrRGlyIiwieWFybiIsImlzTmFtZXNwYWNlZCIsInNob3J0TmFtZSIsImZ1bGxOYW1lIiwiaXNGdWxsTmFtZSIsImluZGV4T2YiLCJzdWJzdHIiLCJjb3B5Q29uZmlndXJhdGlvbiIsInByaW50IiwiaW5zdGFsbFBsdWdpbiIsInJvb3REaXIiLCJjb25maWdQYXRoIiwiam9pbiIsImRzdFBhdGgiLCJleGlzdHNTeW5jIiwiZGlzdENoZWNrc3VtIiwic2FtZUNoZWNrc3VtIiwid2Fybk9uRGlmZmVyZW50Q2hlY2tzdW0iLCJjb3B5IiwiY2hlY2tzdW0iLCJuYW1lIiwic2lnbmF0dXJlIiwiZGVzY3JpcHRpb24iLCJhY3Rpb24iLCJhcmdzIiwiZXh0T3B0aW9ucyIsImFyZ3NXaXRob3V0T3B0aW9ucyIsImZsYWdzIiwib2ZmbGluZSIsImNvbmNhdCIsInByaW50ZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztnQ0F3QkEsV0FBNkJBLE1BQTdCLEVBQXFDQyxPQUFyQyxFQUE4QztBQUFBLFVBQ3JDQyxNQURxQyxHQUNaRCxPQURZLENBQ3JDQyxNQURxQztBQUFBLFVBQzdCQyxPQUQ2QixHQUNaRixPQURZLENBQzdCRSxPQUQ2QjtBQUFBLFVBQ3BCQyxJQURvQixHQUNaSCxPQURZLENBQ3BCRyxJQURvQjs7QUFFNUMsVUFBTUMsZUFBZUwsT0FBTyxDQUFQLE1BQWMsR0FBbkM7QUFDQSxRQUFJTSxZQUFZTixNQUFoQjtBQUNBLFFBQUlPLFdBQVdQLE1BQWY7O0FBRUEsUUFBSSxDQUFDSyxZQUFMLEVBQW1CO0FBQ2pCLFlBQU1HLGFBQWFSLE9BQU9TLE9BQVAsQ0FBZSxnQkFBZixNQUFxQyxDQUF4RDtBQUNBSCxrQkFBWUUsYUFBYVIsT0FBT1UsTUFBUCxDQUFjLEVBQWQsQ0FBYixHQUFpQ1YsTUFBN0M7QUFDQU8saUJBQVdDLGFBQWFSLE1BQWIsR0FBdUIsa0JBQWdCQSxNQUFPLEdBQXpEO0FBQ0Q7O0FBRUQsVUFBTUksS0FBSyxDQUFDLEtBQUQsRUFBUUcsUUFBUixDQUFMLEVBQXdCTixPQUF4QixDQUFOO0FBQ0EsVUFBTSxtQ0FBb0JFLE9BQXBCLEVBQTZCRyxTQUE3QixDQUFOO0FBQ0EsVUFBTUssa0JBQWtCUixPQUFsQixFQUEyQkksUUFBM0IsRUFBcUNELFNBQXJDLEVBQWdESixNQUFoRCxDQUFOOztBQUVBQSxXQUFPVSxLQUFQLENBQWMsWUFBVUwsUUFBUyxjQUFqQztBQUNELEc7O2tCQWpCY00sYTs7Ozs7O2dDQW1CZixXQUFpQ0MsT0FBakMsRUFBMENQLFFBQTFDLEVBQW9ERCxTQUFwRCxFQUErREosTUFBL0QsRUFBdUU7QUFDckUsVUFBTWEsYUFBYSxlQUFLQyxJQUFMLENBQVVGLE9BQVYsRUFBbUIsY0FBbkIsRUFBbUNQLFFBQW5DLEVBQTZDLGtCQUE3QyxDQUFuQjtBQUNBLFVBQU1VLFVBQVUsZUFBS0QsSUFBTCxDQUFVRixPQUFWLEVBQW1CLFFBQW5CLEVBQThCLElBQUVSLFNBQVUsUUFBMUMsQ0FBaEI7O0FBRUEsUUFBSSxDQUFDLG9CQUFJWSxVQUFKLENBQWVILFVBQWYsQ0FBTCxFQUFpQztBQUMvQjtBQUNEOztBQUVEO0FBQ0EsUUFBSSxvQkFBSUcsVUFBSixDQUFlRCxPQUFmLENBQUosRUFBNkI7QUFDM0IsWUFBTUUsZUFBZSxNQUFNLHNDQUF1QkosVUFBdkIsQ0FBM0I7QUFDQSxZQUFNSyxlQUFlLE1BQU0sNkNBQWdCTixPQUFoQixFQUF5QlAsUUFBekIsRUFBbUNZLFlBQW5DLENBQTNCO0FBQ0FFLDhCQUF3QmYsU0FBeEIsRUFBbUNjLFlBQW5DLEVBQWlEbEIsT0FBT1UsS0FBeEQ7QUFDRCxLQUpELE1BSU87QUFDTDtBQUNBLFlBQU0sb0JBQUlVLElBQUosQ0FBU1AsVUFBVCxFQUFxQkUsT0FBckIsQ0FBTjtBQUNBLFlBQU1NLFdBQVcsTUFBTSxzQ0FBdUJSLFVBQXZCLENBQXZCO0FBQ0EsWUFBTSx5Q0FBWUQsT0FBWixFQUFxQlAsUUFBckIsRUFBK0JnQixRQUEvQixDQUFOO0FBQ0Q7QUFDRixHOztrQkFuQmNaLGlCOzs7OztBQXFCZjs7O0FBaEVBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztrQkFFZTtBQUNiYSxRQUFNLFNBRE87QUFFYkMsYUFBVyxVQUZFO0FBR2JDLGVBQWEsOERBSEE7QUFJYkM7QUFBQSxpQ0FBUSxXQUFPQyxJQUFQLEVBQWEzQixPQUFiLEVBQXlCO0FBQUEsWUFDeEI0QixVQUR3QixHQUNWRCxJQURVLENBQ3hCQyxVQUR3QjtBQUFBLFlBRXhCekIsSUFGd0IsR0FFaEJILE9BRmdCLENBRXhCRyxJQUZ3Qjs7QUFBQSxpREFHZHdCLEtBQUtFLGtCQUhTOztBQUFBLFlBR3hCOUIsTUFId0I7O0FBSS9CLFVBQUksQ0FBQ0EsTUFBTCxFQUFhO0FBQ1gsY0FBTStCLFFBQVFGLFdBQVdHLE9BQVgsR0FBcUIsQ0FBQyxXQUFELENBQXJCLEdBQXFDLEVBQW5EO0FBQ0EsZUFBTyxNQUFNNUIsS0FBSyxDQUFDLFNBQUQsRUFBWTZCLE1BQVosQ0FBbUJGLEtBQW5CLENBQUwsRUFBZ0M5QixPQUFoQyxDQUFiO0FBQ0Q7O0FBRUQ7QUFDQSxhQUFPLE1BQU1ZLGNBQWNiLE1BQWQsRUFBc0JDLE9BQXRCLENBQWI7QUFDRCxLQVhEOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBSmEsQztBQTJEZixTQUFTb0IsdUJBQVQsQ0FBaUNyQixNQUFqQyxFQUF5Q29CLFlBQXpDLEVBQXVEYyxPQUF2RCxFQUFnRTtBQUM5RCxNQUFJLENBQUNkLFlBQUwsRUFBbUI7QUFDakJjLFlBQVEsQ0FDTCxnREFBOENsQyxNQUFPLDhDQURoRCxFQUVOLG1HQUZNLEVBR05nQixJQUhNLENBR0QsR0FIQyxDQUFSO0FBSUQ7QUFDRiIsImZpbGUiOiJpbnN0YWxsQ29tbWFuZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmc3AgZnJvbSAnZnMtcHJvbWlzZSdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZ2VuZXJhdGVDb25maWdDaGVja3N1bSBmcm9tICcuLi8uLi91dGlsL2dlbmVyYXRlQ29uZmlnQ2hlY2tzdW0nXG5pbXBvcnQgYWRkUGx1Z2luVG9NYW5pZmVzdCBmcm9tICdAc2FuaXR5L3V0aWwvbGliL2FkZFBsdWdpblRvTWFuaWZlc3QnXG5pbXBvcnQge3NldENoZWNrc3VtLCBoYXNTYW1lQ2hlY2tzdW19IGZyb20gJy4uLy4uL3V0aWwvcGx1Z2luQ2hlY2tzdW1NYW5pZmVzdCdcblxuZXhwb3J0IGRlZmF1bHQge1xuICBuYW1lOiAnaW5zdGFsbCcsXG4gIHNpZ25hdHVyZTogJ1tQTFVHSU5dJyxcbiAgZGVzY3JpcHRpb246ICdJbnN0YWxscyBhIFNhbml0eSBwbHVnaW4gdG8gdGhlIGN1cnJlbnQgU2FuaXR5IGNvbmZpZ3VyYXRpb24nLFxuICBhY3Rpb246IGFzeW5jIChhcmdzLCBjb250ZXh0KSA9PiB7XG4gICAgY29uc3Qge2V4dE9wdGlvbnN9ID0gYXJnc1xuICAgIGNvbnN0IHt5YXJufSA9IGNvbnRleHRcbiAgICBjb25zdCBbcGx1Z2luXSA9IGFyZ3MuYXJnc1dpdGhvdXRPcHRpb25zXG4gICAgaWYgKCFwbHVnaW4pIHtcbiAgICAgIGNvbnN0IGZsYWdzID0gZXh0T3B0aW9ucy5vZmZsaW5lID8gWyctLW9mZmxpbmUnXSA6IFtdXG4gICAgICByZXR1cm4gYXdhaXQgeWFybihbJ2luc3RhbGwnXS5jb25jYXQoZmxhZ3MpLCBjb250ZXh0KVxuICAgIH1cblxuICAgIC8vIEB0b2RvIGFkZCBzdXBwb3J0IGZvciBtdWx0aXBsZSBzaW11bHRhbmVvdXMgcGx1Z2lucyB0byBiZSBpbnN0YWxsZWRcbiAgICByZXR1cm4gYXdhaXQgaW5zdGFsbFBsdWdpbihwbHVnaW4sIGNvbnRleHQpXG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFBsdWdpbihwbHVnaW4sIGNvbnRleHQpIHtcbiAgY29uc3Qge291dHB1dCwgd29ya0RpciwgeWFybn0gPSBjb250ZXh0XG4gIGNvbnN0IGlzTmFtZXNwYWNlZCA9IHBsdWdpblswXSA9PT0gJ0AnXG4gIGxldCBzaG9ydE5hbWUgPSBwbHVnaW5cbiAgbGV0IGZ1bGxOYW1lID0gcGx1Z2luXG5cbiAgaWYgKCFpc05hbWVzcGFjZWQpIHtcbiAgICBjb25zdCBpc0Z1bGxOYW1lID0gcGx1Z2luLmluZGV4T2YoJ3Nhbml0eS1wbHVnaW4tJykgPT09IDBcbiAgICBzaG9ydE5hbWUgPSBpc0Z1bGxOYW1lID8gcGx1Z2luLnN1YnN0cigxNCkgOiBwbHVnaW5cbiAgICBmdWxsTmFtZSA9IGlzRnVsbE5hbWUgPyBwbHVnaW4gOiBgc2FuaXR5LXBsdWdpbi0ke3BsdWdpbn1gXG4gIH1cblxuICBhd2FpdCB5YXJuKFsnYWRkJywgZnVsbE5hbWVdLCBjb250ZXh0KVxuICBhd2FpdCBhZGRQbHVnaW5Ub01hbmlmZXN0KHdvcmtEaXIsIHNob3J0TmFtZSlcbiAgYXdhaXQgY29weUNvbmZpZ3VyYXRpb24od29ya0RpciwgZnVsbE5hbWUsIHNob3J0TmFtZSwgb3V0cHV0KVxuXG4gIG91dHB1dC5wcmludChgUGx1Z2luICcke2Z1bGxOYW1lfScgaW5zdGFsbGVkYClcbn1cblxuYXN5bmMgZnVuY3Rpb24gY29weUNvbmZpZ3VyYXRpb24ocm9vdERpciwgZnVsbE5hbWUsIHNob3J0TmFtZSwgb3V0cHV0KSB7XG4gIGNvbnN0IGNvbmZpZ1BhdGggPSBwYXRoLmpvaW4ocm9vdERpciwgJ25vZGVfbW9kdWxlcycsIGZ1bGxOYW1lLCAnY29uZmlnLmRpc3QuanNvbicpXG4gIGNvbnN0IGRzdFBhdGggPSBwYXRoLmpvaW4ocm9vdERpciwgJ2NvbmZpZycsIGAke3Nob3J0TmFtZX0uanNvbmApXG5cbiAgaWYgKCFmc3AuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgLy8gQ29uZmlndXJhdGlvbiBleGlzdHMsIGNoZWNrIGlmIHVzZXIgaGFzIGxvY2FsIGNvbmZpZ3VyYXRpb24gYWxyZWFkeVxuICBpZiAoZnNwLmV4aXN0c1N5bmMoZHN0UGF0aCkpIHtcbiAgICBjb25zdCBkaXN0Q2hlY2tzdW0gPSBhd2FpdCBnZW5lcmF0ZUNvbmZpZ0NoZWNrc3VtKGNvbmZpZ1BhdGgpXG4gICAgY29uc3Qgc2FtZUNoZWNrc3VtID0gYXdhaXQgaGFzU2FtZUNoZWNrc3VtKHJvb3REaXIsIGZ1bGxOYW1lLCBkaXN0Q2hlY2tzdW0pXG4gICAgd2Fybk9uRGlmZmVyZW50Q2hlY2tzdW0oc2hvcnROYW1lLCBzYW1lQ2hlY2tzdW0sIG91dHB1dC5wcmludClcbiAgfSBlbHNlIHtcbiAgICAvLyBEZXN0aW5hdGlvbiBmaWxlIGRvZXMgbm90IGV4aXN0LCBjb3B5XG4gICAgYXdhaXQgZnNwLmNvcHkoY29uZmlnUGF0aCwgZHN0UGF0aClcbiAgICBjb25zdCBjaGVja3N1bSA9IGF3YWl0IGdlbmVyYXRlQ29uZmlnQ2hlY2tzdW0oY29uZmlnUGF0aClcbiAgICBhd2FpdCBzZXRDaGVja3N1bShyb290RGlyLCBmdWxsTmFtZSwgY2hlY2tzdW0pXG4gIH1cbn1cblxuLy8gQHRvZG8gSW1wcm92ZSB3aXRoIHNvbWUgc29ydCBvZiBoZWxwZnVsIGtleSBkaWZmZXIgb3Igc2ltaWxhclxuZnVuY3Rpb24gd2Fybk9uRGlmZmVyZW50Q2hlY2tzdW0ocGx1Z2luLCBzYW1lQ2hlY2tzdW0sIHByaW50ZXIpIHtcbiAgaWYgKCFzYW1lQ2hlY2tzdW0pIHtcbiAgICBwcmludGVyKFtcbiAgICAgIGBbV2FybmluZ10gRGVmYXVsdCBjb25maWd1cmF0aW9uIGZvciBwbHVnaW4gJyR7cGx1Z2lufScgaGFzIGNoYW5nZWQgc2luY2UgeW91IGZpcnN0IGluc3RhbGxlZCBpdCxgLFxuICAgICAgJ2NoZWNrIGxvY2FsIGNvbmZpZ3VyYXRpb24gdnMgZGlzdHJpYnV0ZWQgY29uZmlndXJhdGlvbiB0byBlbnN1cmUgeW91ciBjb25maWd1cmF0aW9uIGlzIHVwIHRvIGRhdGUnXG4gICAgXS5qb2luKCcgJykpXG4gIH1cbn1cbiJdfQ==