'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

let uninstallPlugin = (() => {
  var _ref = _asyncToGenerator(function* (plugin, context) {
    const prompt = context.prompt,
          yarn = context.yarn,
          workDir = context.workDir;

    const isFullName = plugin.indexOf('sanity-plugin-') === 0;
    const shortName = isFullName ? plugin.substr(14) : plugin;
    const fullName = isFullName ? plugin : `sanity-plugin-${ plugin }`;

    yield removeConfiguration(workDir, fullName, shortName, prompt);
    yield removeFromSanityManifest(workDir, shortName);
    return yield yarn(['remove', fullName], context);
  });

  return function uninstallPlugin(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

let removeConfiguration = (() => {
  var _ref2 = _asyncToGenerator(function* (workDir, fullName, shortName, prompt) {
    const localConfigPath = _path2.default.join(workDir, 'config', `${ shortName }.json`);
    const hasLocalConfig = yield (0, _pluginChecksumManifest.localConfigExists)(workDir, shortName);

    if (!hasLocalConfig) {
      return;
    }

    try {
      const localChecksum = yield (0, _generateConfigChecksum2.default)(localConfigPath);
      const sameChecksum = yield (0, _pluginChecksumManifest.hasSameChecksum)(workDir, fullName, localChecksum);

      var _ref3 = yield promptOnAlteredConfiguration(shortName, sameChecksum, prompt);

      const deleteConfig = _ref3.deleteConfig;

      deleteConfiguration(localConfigPath, deleteConfig);
    } catch (err) {
      // Destination file does not exist?
      // Predictable, proceed with uninstall
      return;
    }
  });

  return function removeConfiguration(_x3, _x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
})();

let removeFromSanityManifest = (() => {
  var _ref4 = _asyncToGenerator(function* (workDir, pluginName) {
    const manifest = yield (0, _readLocalManifest2.default)(workDir, 'sanity.json');
    manifest.plugins = (0, _without2.default)(manifest.plugins || [], pluginName);
    return yield _fsPromise2.default.writeJson(_path2.default.join(workDir, 'sanity.json'), manifest, { spaces: 2 });
  });

  return function removeFromSanityManifest(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
})();

var _fsPromise = require('fs-promise');

var _fsPromise2 = _interopRequireDefault(_fsPromise);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _without = require('lodash/without');

var _without2 = _interopRequireDefault(_without);

var _readLocalManifest = require('@sanity/util/lib/readLocalManifest');

var _readLocalManifest2 = _interopRequireDefault(_readLocalManifest);

var _generateConfigChecksum = require('../../util/generateConfigChecksum');

var _generateConfigChecksum2 = _interopRequireDefault(_generateConfigChecksum);

var _pluginChecksumManifest = require('../../util/pluginChecksumManifest');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = {
  name: 'uninstall',
  signature: '[plugin]',
  description: 'Removes a Sanity plugin from the current Sanity configuration',
  action: (args, context) => {
    const output = context.output;

    var _args$argsWithoutOpti = _slicedToArray(args.argsWithoutOptions, 1);

    const plugin = _args$argsWithoutOpti[0];

    if (!plugin) {
      return output.error(new Error('Plugin name must be specified'));
    }

    // @todo add support for multiple simultaneous plugins to be uninstalled
    return uninstallPlugin(plugin, context);
  }
};


function deleteConfiguration(configPath, userConfirmed) {
  if (!userConfirmed) {
    return Promise.resolve(); // Leave the configuration in place
  }

  return _fsPromise2.default.unlink(configPath);
}

function promptOnAlteredConfiguration(plugin, sameChecksum, prompt) {
  if (sameChecksum) {
    return Promise.resolve({ deleteConfig: true });
  }

  return prompt([{
    type: 'confirm',
    name: 'deleteConfig',
    message: `Local configuration for '${ plugin }' has modifications - remove anyway?`,
    default: true
  }]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy91bmluc3RhbGwvdW5pbnN0YWxsQ29tbWFuZC5qcyJdLCJuYW1lcyI6WyJwbHVnaW4iLCJjb250ZXh0IiwicHJvbXB0IiwieWFybiIsIndvcmtEaXIiLCJpc0Z1bGxOYW1lIiwiaW5kZXhPZiIsInNob3J0TmFtZSIsInN1YnN0ciIsImZ1bGxOYW1lIiwicmVtb3ZlQ29uZmlndXJhdGlvbiIsInJlbW92ZUZyb21TYW5pdHlNYW5pZmVzdCIsInVuaW5zdGFsbFBsdWdpbiIsImxvY2FsQ29uZmlnUGF0aCIsImpvaW4iLCJoYXNMb2NhbENvbmZpZyIsImxvY2FsQ2hlY2tzdW0iLCJzYW1lQ2hlY2tzdW0iLCJwcm9tcHRPbkFsdGVyZWRDb25maWd1cmF0aW9uIiwiZGVsZXRlQ29uZmlnIiwiZGVsZXRlQ29uZmlndXJhdGlvbiIsImVyciIsInBsdWdpbk5hbWUiLCJtYW5pZmVzdCIsInBsdWdpbnMiLCJ3cml0ZUpzb24iLCJzcGFjZXMiLCJuYW1lIiwic2lnbmF0dXJlIiwiZGVzY3JpcHRpb24iLCJhY3Rpb24iLCJhcmdzIiwib3V0cHV0IiwiYXJnc1dpdGhvdXRPcHRpb25zIiwiZXJyb3IiLCJFcnJvciIsImNvbmZpZ1BhdGgiLCJ1c2VyQ29uZmlybWVkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ1bmxpbmsiLCJ0eXBlIiwibWVzc2FnZSIsImRlZmF1bHQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OzsrQkF1QkEsV0FBK0JBLE1BQS9CLEVBQXVDQyxPQUF2QyxFQUFnRDtBQUFBLFVBQ3ZDQyxNQUR1QyxHQUNkRCxPQURjLENBQ3ZDQyxNQUR1QztBQUFBLFVBQy9CQyxJQUQrQixHQUNkRixPQURjLENBQy9CRSxJQUQrQjtBQUFBLFVBQ3pCQyxPQUR5QixHQUNkSCxPQURjLENBQ3pCRyxPQUR5Qjs7QUFFOUMsVUFBTUMsYUFBYUwsT0FBT00sT0FBUCxDQUFlLGdCQUFmLE1BQXFDLENBQXhEO0FBQ0EsVUFBTUMsWUFBWUYsYUFBYUws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TUFBSWUsWUFBSixFQUFrQjtBQUNoQixXQUFPcUIsUUFBUUMsT0FBUixDQUFnQixFQUFDcEIsY0FBYyxJQUFmLEVBQWhCLENBQVA7QUFDRDs7QUFFRCxTQUFPakIsT0FBTyxDQUFDO0FBQ2J1QyxVQUFNLFNBRE87QUFFYmQsVUFBTSxjQUZPO0FBR2JlLGFBQVUsNkJBQTJCMUMsTUFBTyx1Q0FIL0I7QUFJYjJDLGFBQVM7QUFKSSxHQUFELENBQVAsQ0FBUDtBQU1EIiwiZmlsZSI6InVuaW5zdGFsbENvbW1hbmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnNwIGZyb20gJ2ZzLXByb21pc2UnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHdpdGhvdXQgZnJvbSAnbG9kYXNoL3dpdGhvdXQnXG5pbXBvcnQgcmVhZExvY2FsTWFuaWZlc3QgZnJvbSAnQHNhbml0eS91dGlsL2xpYi9yZWFkTG9jYWxNYW5pZmVzdCdcbmltcG9ydCBnZW5lcmF0ZUNvbmZpZ0NoZWNrc3VtIGZyb20gJy4uLy4uL3V0aWwvZ2VuZXJhdGVDb25maWdDaGVja3N1bSdcbmltcG9ydCB7aGFzU2FtZUNoZWNrc3VtLCBsb2NhbENvbmZpZ0V4aXN0c30gZnJvbSAnLi4vLi4vdXRpbC9wbHVnaW5DaGVja3N1bU1hbmlmZXN0J1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIG5hbWU6ICd1bmluc3RhbGwnLFxuICBzaWduYXR1cmU6ICdbcGx1Z2luXScsXG4gIGRlc2NyaXB0aW9uOiAnUmVtb3ZlcyBhIFNhbml0eSBwbHVnaW4gZnJvbSB0aGUgY3VycmVudCBTYW5pdHkgY29uZmlndXJhdGlvbicsXG4gIGFjdGlvbjogKGFyZ3MsIGNvbnRleHQpID0+IHtcbiAgICBjb25zdCB7b3V0cHV0fSA9IGNvbnRleHRcbiAgICBjb25zdCBbcGx1Z2luXSA9IGFyZ3MuYXJnc1dpdGhvdXRPcHRpb25zXG4gICAgaWYgKCFwbHVnaW4pIHtcbiAgICAgIHJldHVybiBvdXRwdXQuZXJyb3IobmV3IEVycm9yKCdQbHVnaW4gbmFtZSBtdXN0IGJlIHNwZWNpZmllZCcpKVxuICAgIH1cblxuICAgIC8vIEB0b2RvIGFkZCBzdXBwb3J0IGZvciBtdWx0aXBsZSBzaW11bHRhbmVvdXMgcGx1Z2lucyB0byBiZSB1bmluc3RhbGxlZFxuICAgIHJldHVybiB1bmluc3RhbGxQbHVnaW4ocGx1Z2luLCBjb250ZXh0KVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHVuaW5zdGFsbFBsdWdpbihwbHVnaW4sIGNvbnRleHQpIHtcbiAgY29uc3Qge3Byb21wdCwgeWFybiwgd29ya0Rpcn0gPSBjb250ZXh0XG4gIGNvbnN0IGlzRnVsbE5hbWUgPSBwbHVnaW4uaW5kZXhPZignc2FuaXR5LXBsdWdpbi0nKSA9PT0gMFxuICBjb25zdCBzaG9ydE5hbWUgPSBpc0Z1bGxOYW1lID8gcGx1Z2luLnN1YnN0cigxNCkgOiBwbHVnaW5cbiAgY29uc3QgZnVsbE5hbWUgPSBpc0Z1bGxOYW1lID8gcGx1Z2luIDogYHNhbml0eS1wbHVnaW4tJHtwbHVnaW59YFxuXG4gIGF3YWl0IHJlbW92ZUNvbmZpZ3VyYXRpb24od29ya0RpciwgZnVsbE5hbWUsIHNob3J0TmFtZSwgcHJvbXB0KVxuICBhd2FpdCByZW1vdmVGcm9tU2FuaXR5TWFuaWZlc3Qod29ya0Rpciwgc2hvcnROYW1lKVxuICByZXR1cm4gYXdhaXQgeWFybihbJ3JlbW92ZScsIGZ1bGxOYW1lXSwgY29udGV4dClcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVtb3ZlQ29uZmlndXJhdGlvbih3b3JrRGlyLCBmdWxsTmFtZSwgc2hvcnROYW1lLCBwcm9tcHQpIHtcbiAgY29uc3QgbG9jYWxDb25maWdQYXRoID0gcGF0aC5qb2luKHdvcmtEaXIsICdjb25maWcnLCBgJHtzaG9ydE5hbWV9Lmpzb25gKVxuICBjb25zdCBoYXNMb2NhbENvbmZpZyA9IGF3YWl0IGxvY2FsQ29uZmlnRXhpc3RzKHdvcmtEaXIsIHNob3J0TmFtZSlcblxuICBpZiAoIWhhc0xvY2FsQ29uZmlnKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGxvY2FsQ2hlY2tzdW0gPSBhd2FpdCBnZW5lcmF0ZUNvbmZpZ0NoZWNrc3VtKGxvY2FsQ29uZmlnUGF0aClcbiAgICBjb25zdCBzYW1lQ2hlY2tzdW0gPSBhd2FpdCBoYXNTYW1lQ2hlY2tzdW0od29ya0RpciwgZnVsbE5hbWUsIGxvY2FsQ2hlY2tzdW0pXG4gICAgY29uc3Qge2RlbGV0ZUNvbmZpZ30gPSBhd2FpdCBwcm9tcHRPbkFsdGVyZWRDb25maWd1cmF0aW9uKHNob3J0TmFtZSwgc2FtZUNoZWNrc3VtLCBwcm9tcHQpXG4gICAgZGVsZXRlQ29uZmlndXJhdGlvbihsb2NhbENvbmZpZ1BhdGgsIGRlbGV0ZUNvbmZpZylcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gRGVzdGluYXRpb24gZmlsZSBkb2VzIG5vdCBleGlzdD9cbiAgICAvLyBQcmVkaWN0YWJsZSwgcHJvY2VlZCB3aXRoIHVuaW5zdGFsbFxuICAgIHJldHVyblxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlbW92ZUZyb21TYW5pdHlNYW5pZmVzdCh3b3JrRGlyLCBwbHVnaW5OYW1lKSB7XG4gIGNvbnN0IG1hbmlmZXN0ID0gYXdhaXQgcmVhZExvY2FsTWFuaWZlc3Qod29ya0RpciwgJ3Nhbml0eS5qc29uJylcbiAgbWFuaWZlc3QucGx1Z2lucyA9IHdpdGhvdXQobWFuaWZlc3QucGx1Z2lucyB8fCBbXSwgcGx1Z2luTmFtZSlcbiAgcmV0dXJuIGF3YWl0IGZzcC53cml0ZUpzb24ocGF0aC5qb2luKHdvcmtEaXIsICdzYW5pdHkuanNvbicpLCBtYW5pZmVzdCwge3NwYWNlczogMn0pXG59XG5cbmZ1bmN0aW9uIGRlbGV0ZUNvbmZpZ3VyYXRpb24oY29uZmlnUGF0aCwgdXNlckNvbmZpcm1lZCkge1xuICBpZiAoIXVzZXJDb25maXJtZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkgLy8gTGVhdmUgdGhlIGNvbmZpZ3VyYXRpb24gaW4gcGxhY2VcbiAgfVxuXG4gIHJldHVybiBmc3AudW5saW5rKGNvbmZpZ1BhdGgpXG59XG5cbmZ1bmN0aW9uIHByb21wdE9uQWx0ZXJlZENvbmZpZ3VyYXRpb24ocGx1Z2luLCBzYW1lQ2hlY2tzdW0sIHByb21wdCkge1xuICBpZiAoc2FtZUNoZWNrc3VtKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7ZGVsZXRlQ29uZmlnOiB0cnVlfSlcbiAgfVxuXG4gIHJldHVybiBwcm9tcHQoW3tcbiAgICB0eXBlOiAnY29uZmlybScsXG4gICAgbmFtZTogJ2RlbGV0ZUNvbmZpZycsXG4gICAgbWVzc2FnZTogYExvY2FsIGNvbmZpZ3VyYXRpb24gZm9yICcke3BsdWdpbn0nIGhhcyBtb2RpZmljYXRpb25zIC0gcmVtb3ZlIGFueXdheT9gLFxuICAgIGRlZmF1bHQ6IHRydWVcbiAgfV0pXG59XG4iXX0=