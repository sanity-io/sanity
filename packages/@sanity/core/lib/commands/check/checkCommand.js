'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _check = require('@sanity/check');

var _check2 = _interopRequireDefault(_check);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  name: 'check',
  signature: '[DIRECTORY]',
  description: 'Performs a Sanity check',
  action: (args, context) => (0, _check2.default)({
    dir: args.argsWithoutOptions[0] || context.workDir
  })
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9jaGVjay9jaGVja0NvbW1hbmQuanMiXSwibmFtZXMiOlsibmFtZSIsInNpZ25hdHVyZSIsImRlc2NyaXB0aW9uIiwiYWN0aW9uIiwiYXJncyIsImNvbnRleHQiLCJkaXIiLCJhcmdzV2l0aG91dE9wdGlvbnMiLCJ3b3JrRGlyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7Ozs7O2tCQUVlO0FBQ2JBLFFBQU0sT0FETztBQUViQyxhQUFXLGFBRkU7QUFHYkMsZUFBYSx5QkFIQTtBQUliQyxVQUFRLENBQUNDLElBQUQsRUFBT0MsT0FBUCxLQUFtQixxQkFBWTtBQUNyQ0MsU0FBS0YsS0FBS0csa0JBQUwsQ0FBd0IsQ0FBeEIsS0FBOEJGLFFBQVFHO0FBRE4sR0FBWjtBQUpkLEMiLCJmaWxlIjoiY2hlY2tDb21tYW5kLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHNhbml0eUNoZWNrIGZyb20gJ0BzYW5pdHkvY2hlY2snXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgbmFtZTogJ2NoZWNrJyxcbiAgc2lnbmF0dXJlOiAnW0RJUkVDVE9SWV0nLFxuICBkZXNjcmlwdGlvbjogJ1BlcmZvcm1zIGEgU2FuaXR5IGNoZWNrJyxcbiAgYWN0aW9uOiAoYXJncywgY29udGV4dCkgPT4gc2FuaXR5Q2hlY2soe1xuICAgIGRpcjogYXJncy5hcmdzV2l0aG91dE9wdGlvbnNbMF0gfHwgY29udGV4dC53b3JrRGlyXG4gIH0pXG59XG4iXX0=