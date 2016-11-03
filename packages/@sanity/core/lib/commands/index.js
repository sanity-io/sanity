'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _buildCommand = require('./build/buildCommand');

var _buildCommand2 = _interopRequireDefault(_buildCommand);

var _checkCommand = require('./check/checkCommand');

var _checkCommand2 = _interopRequireDefault(_checkCommand);

var _configCheckCommand = require('./config/configCheckCommand');

var _configCheckCommand2 = _interopRequireDefault(_configCheckCommand);

var _listDatasetsCommand = require('./dataset/listDatasetsCommand');

var _listDatasetsCommand2 = _interopRequireDefault(_listDatasetsCommand);

var _createDatasetCommand = require('./dataset/createDatasetCommand');

var _createDatasetCommand2 = _interopRequireDefault(_createDatasetCommand);

var _deleteDatasetCommand = require('./dataset/deleteDatasetCommand');

var _deleteDatasetCommand2 = _interopRequireDefault(_deleteDatasetCommand);

var _installCommand = require('./install/installCommand');

var _installCommand2 = _interopRequireDefault(_installCommand);

var _startCommand = require('./start/startCommand');

var _startCommand2 = _interopRequireDefault(_startCommand);

var _uninstallCommand = require('./uninstall/uninstallCommand');

var _uninstallCommand2 = _interopRequireDefault(_uninstallCommand);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = [_buildCommand2.default, _checkCommand2.default, _configCheckCommand2.default, _listDatasetsCommand2.default, _createDatasetCommand2.default, _deleteDatasetCommand2.default, _installCommand2.default, _startCommand2.default, _uninstallCommand2.default];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztrQkFFZSwyUCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBidWlsZENvbW1hbmQgZnJvbSAnLi9idWlsZC9idWlsZENvbW1hbmQnXG5pbXBvcnQgY2hlY2tDb21tYW5kIGZyb20gJy4vY2hlY2svY2hlY2tDb21tYW5kJ1xuaW1wb3J0IGNvbmZpZ0NoZWNrQ29tbWFuZCBmcm9tICcuL2NvbmZpZy9jb25maWdDaGVja0NvbW1hbmQnXG5pbXBvcnQgbGlzdERhdGFzZXRzQ29tbWFuZCBmcm9tICcuL2RhdGFzZXQvbGlzdERhdGFzZXRzQ29tbWFuZCdcbmltcG9ydCBjcmVhdGVEYXRhc2V0Q29tbWFuZCBmcm9tICcuL2RhdGFzZXQvY3JlYXRlRGF0YXNldENvbW1hbmQnXG5pbXBvcnQgZGVsZXRlRGF0YXNldENvbW1hbmQgZnJvbSAnLi9kYXRhc2V0L2RlbGV0ZURhdGFzZXRDb21tYW5kJ1xuaW1wb3J0IGluc3RhbGxDb21tYW5kIGZyb20gJy4vaW5zdGFsbC9pbnN0YWxsQ29tbWFuZCdcbmltcG9ydCBzdGFydENvbW1hbmQgZnJvbSAnLi9zdGFydC9zdGFydENvbW1hbmQnXG5pbXBvcnQgdW5pbnN0YWxsQ29tbWFuZCBmcm9tICcuL3VuaW5zdGFsbC91bmluc3RhbGxDb21tYW5kJ1xuXG5leHBvcnQgZGVmYXVsdCBbXG4gIGJ1aWxkQ29tbWFuZCxcbiAgY2hlY2tDb21tYW5kLFxuICBjb25maWdDaGVja0NvbW1hbmQsXG4gIGxpc3REYXRhc2V0c0NvbW1hbmQsXG4gIGNyZWF0ZURhdGFzZXRDb21tYW5kLFxuICBkZWxldGVEYXRhc2V0Q29tbWFuZCxcbiAgaW5zdGFsbENvbW1hbmQsXG4gIHN0YXJ0Q29tbWFuZCxcbiAgdW5pbnN0YWxsQ29tbWFuZFxuXVxuIl19