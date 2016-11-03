'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _reinitializePluginConfigs = require('../../actions/config/reinitializePluginConfigs');

var _reinitializePluginConfigs2 = _interopRequireDefault(_reinitializePluginConfigs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  name: 'configcheck',
  signature: '',
  description: 'Checks if the required configuration files for plugins exists and are up to date',
  action: (args, context) => (0, _reinitializePluginConfigs2.default)(context)
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9jb25maWcvY29uZmlnQ2hlY2tDb21tYW5kLmpzIl0sIm5hbWVzIjpbIm5hbWUiLCJzaWduYXR1cmUiLCJkZXNjcmlwdGlvbiIsImFjdGlvbiIsImFyZ3MiLCJjb250ZXh0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7Ozs7O2tCQUVlO0FBQ2JBLFFBQU0sYUFETztBQUViQyxhQUFXLEVBRkU7QUFHYkMsZUFBYSxrRkFIQTtBQUliQyxVQUFRLENBQUNDLElBQUQsRUFBT0MsT0FBUCxLQUFtQix5Q0FBMEJBLE9BQTFCO0FBSmQsQyIsImZpbGUiOiJjb25maWdDaGVja0NvbW1hbmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcmVpbml0aWFsaXplUGx1Z2luQ29uZmlncyBmcm9tICcuLi8uLi9hY3Rpb25zL2NvbmZpZy9yZWluaXRpYWxpemVQbHVnaW5Db25maWdzJ1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIG5hbWU6ICdjb25maWdjaGVjaycsXG4gIHNpZ25hdHVyZTogJycsXG4gIGRlc2NyaXB0aW9uOiAnQ2hlY2tzIGlmIHRoZSByZXF1aXJlZCBjb25maWd1cmF0aW9uIGZpbGVzIGZvciBwbHVnaW5zIGV4aXN0cyBhbmQgYXJlIHVwIHRvIGRhdGUnLFxuICBhY3Rpb246IChhcmdzLCBjb250ZXh0KSA9PiByZWluaXRpYWxpemVQbHVnaW5Db25maWdzKGNvbnRleHQpXG59XG4iXX0=