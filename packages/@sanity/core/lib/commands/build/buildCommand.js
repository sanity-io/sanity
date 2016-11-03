'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lazyRequire = require('@sanity/util/lib/lazyRequire');

var _lazyRequire2 = _interopRequireDefault(_lazyRequire);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  name: 'build',
  signature: '[OUTPUT_DIR]',
  description: 'Builds the current Sanity configuration to a static bundle',
  action: (0, _lazyRequire2.default)(require.resolve('../../actions/build/buildStaticAssets'))
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9idWlsZC9idWlsZENvbW1hbmQuanMiXSwibmFtZXMiOlsibmFtZSIsInNpZ25hdHVyZSIsImRlc2NyaXB0aW9uIiwiYWN0aW9uIiwicmVxdWlyZSIsInJlc29sdmUiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7Ozs7a0JBRWU7QUFDYkEsUUFBTSxPQURPO0FBRWJDLGFBQVcsY0FGRTtBQUdiQyxlQUFhLDREQUhBO0FBSWJDLFVBQVEsMkJBQVlDLFFBQVFDLE9BQVIsQ0FBZ0IsdUNBQWhCLENBQVo7QUFKSyxDIiwiZmlsZSI6ImJ1aWxkQ29tbWFuZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBsYXp5UmVxdWlyZSBmcm9tICdAc2FuaXR5L3V0aWwvbGliL2xhenlSZXF1aXJlJ1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIG5hbWU6ICdidWlsZCcsXG4gIHNpZ25hdHVyZTogJ1tPVVRQVVRfRElSXScsXG4gIGRlc2NyaXB0aW9uOiAnQnVpbGRzIHRoZSBjdXJyZW50IFNhbml0eSBjb25maWd1cmF0aW9uIHRvIGEgc3RhdGljIGJ1bmRsZScsXG4gIGFjdGlvbjogbGF6eVJlcXVpcmUocmVxdWlyZS5yZXNvbHZlKCcuLi8uLi9hY3Rpb25zL2J1aWxkL2J1aWxkU3RhdGljQXNzZXRzJykpXG59XG4iXX0=