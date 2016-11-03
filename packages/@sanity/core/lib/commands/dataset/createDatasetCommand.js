'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _datasetNamePrompt = require('../../actions/dataset/datasetNamePrompt');

var _datasetNamePrompt2 = _interopRequireDefault(_datasetNamePrompt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = {
  name: 'create',
  group: 'dataset',
  signature: '[NAME]',
  description: 'Create a new dataset within your project',
  action: (() => {
    var _ref = _asyncToGenerator(function* (args, context) {
      const apiClient = context.apiClient,
            output = context.output,
            prompt = context.prompt;

      var _args$argsWithoutOpti = _slicedToArray(args.argsWithoutOptions, 1);

      const dataset = _args$argsWithoutOpti[0];

      const client = apiClient();
      const datasetName = yield dataset || (0, _datasetNamePrompt2.default)(prompt);

      try {
        yield client.datasets.create(datasetName);
        output.print('Dataset created successfully');
      } catch (err) {
        throw new Error(`Dataset creation failed:\n${ err.message }`);
      }
    });

    return function action(_x, _x2) {
      return _ref.apply(this, arguments);
    };
  })()
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9kYXRhc2V0L2NyZWF0ZURhdGFzZXRDb21tYW5kLmpzIl0sIm5hbWVzIjpbIm5hbWUiLCJncm91cCIsInNpZ25hdHVyZSIsImRlc2NyaXB0aW9uIiwiYWN0aW9uIiwiYXJncyIsImNvbnRleHQiLCJhcGlDbGllbnQiLCJvdXRwdXQiLCJwcm9tcHQiLCJhcmdzV2l0aG91dE9wdGlvbnMiLCJkYXRhc2V0IiwiY2xpZW50IiwiZGF0YXNldE5hbWUiLCJkYXRhc2V0cyIsImNyZWF0ZSIsInByaW50IiwiZXJyIiwiRXJyb3IiLCJtZXNzYWdlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOzs7Ozs7OztrQkFFZTtBQUNiQSxRQUFNLFFBRE87QUFFYkMsU0FBTyxTQUZNO0FBR2JDLGFBQVcsUUFIRTtBQUliQyxlQUFhLDBDQUpBO0FBS2JDO0FBQUEsaUNBQVEsV0FBT0MsSUFBUCxFQUFhQyxPQUFiLEVBQXlCO0FBQUEsWUFDeEJDLFNBRHdCLEdBQ0tELE9BREwsQ0FDeEJDLFNBRHdCO0FBQUEsWUFDYkMsTUFEYSxHQUNLRixPQURMLENBQ2JFLE1BRGE7QUFBQSxZQUNMQyxNQURLLEdBQ0tILE9BREwsQ0FDTEcsTUFESzs7QUFBQSxpREFFYkosS0FBS0ssa0JBRlE7O0FBQUEsWUFFeEJDLE9BRndCOztBQUcvQixZQUFNQyxTQUFTTCxXQUFmO0FBQ0EsWUFBTU0sY0FBYyxNQUFPRixXQUFXLGlDQUFxQkYsTUFBckIsQ0FBdEM7O0FBRUEsVUFBSTtBQUNGLGNBQU1HLE9BQU9FLFFBQVAsQ0FBZ0JDLE1BQWhCLENBQXVCRixXQUF2QixDQUFOO0FBQ0FMLGVBQU9RLEtBQVAsQ0FBYSw4QkFBYjtBQUNELE9BSEQsQ0FHRSxPQUFPQyxHQUFQLEVBQVk7QUFDWixjQUFNLElBQUlDLEtBQUosQ0FBVyw4QkFBNEJELElBQUlFLE9BQVEsR0FBbkQsQ0FBTjtBQUNEO0FBQ0YsS0FaRDs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUxhLEMiLCJmaWxlIjoiY3JlYXRlRGF0YXNldENvbW1hbmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcHJvbXB0Rm9yRGF0YXNldE5hbWUgZnJvbSAnLi4vLi4vYWN0aW9ucy9kYXRhc2V0L2RhdGFzZXROYW1lUHJvbXB0J1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIG5hbWU6ICdjcmVhdGUnLFxuICBncm91cDogJ2RhdGFzZXQnLFxuICBzaWduYXR1cmU6ICdbTkFNRV0nLFxuICBkZXNjcmlwdGlvbjogJ0NyZWF0ZSBhIG5ldyBkYXRhc2V0IHdpdGhpbiB5b3VyIHByb2plY3QnLFxuICBhY3Rpb246IGFzeW5jIChhcmdzLCBjb250ZXh0KSA9PiB7XG4gICAgY29uc3Qge2FwaUNsaWVudCwgb3V0cHV0LCBwcm9tcHR9ID0gY29udGV4dFxuICAgIGNvbnN0IFtkYXRhc2V0XSA9IGFyZ3MuYXJnc1dpdGhvdXRPcHRpb25zXG4gICAgY29uc3QgY2xpZW50ID0gYXBpQ2xpZW50KClcbiAgICBjb25zdCBkYXRhc2V0TmFtZSA9IGF3YWl0IChkYXRhc2V0IHx8IHByb21wdEZvckRhdGFzZXROYW1lKHByb21wdCkpXG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgY2xpZW50LmRhdGFzZXRzLmNyZWF0ZShkYXRhc2V0TmFtZSlcbiAgICAgIG91dHB1dC5wcmludCgnRGF0YXNldCBjcmVhdGVkIHN1Y2Nlc3NmdWxseScpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYERhdGFzZXQgY3JlYXRpb24gZmFpbGVkOlxcbiR7ZXJyLm1lc3NhZ2V9YClcbiAgICB9XG4gIH1cbn1cblxuIl19