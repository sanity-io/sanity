'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = {
  name: 'list',
  group: 'dataset',
  signature: '',
  description: 'Create a new dataset within your project',
  action: (() => {
    var _ref = _asyncToGenerator(function* (args, context) {
      const apiClient = context.apiClient,
            output = context.output;

      const client = apiClient();
      const datasets = yield client.datasets.list();
      output.print(datasets.map(function (set) {
        return set.name;
      }).join('\n'));
    });

    return function action(_x, _x2) {
      return _ref.apply(this, arguments);
    };
  })()
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9kYXRhc2V0L2xpc3REYXRhc2V0c0NvbW1hbmQuanMiXSwibmFtZXMiOlsibmFtZSIsImdyb3VwIiwic2lnbmF0dXJlIiwiZGVzY3JpcHRpb24iLCJhY3Rpb24iLCJhcmdzIiwiY29udGV4dCIsImFwaUNsaWVudCIsIm91dHB1dCIsImNsaWVudCIsImRhdGFzZXRzIiwibGlzdCIsInByaW50IiwibWFwIiwic2V0Iiwiam9pbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7a0JBQWU7QUFDYkEsUUFBTSxNQURPO0FBRWJDLFNBQU8sU0FGTTtBQUdiQyxhQUFXLEVBSEU7QUFJYkMsZUFBYSwwQ0FKQTtBQUtiQztBQUFBLGlDQUFRLFdBQU9DLElBQVAsRUFBYUMsT0FBYixFQUF5QjtBQUFBLFlBQ3hCQyxTQUR3QixHQUNIRCxPQURHLENBQ3hCQyxTQUR3QjtBQUFBLFlBQ2JDLE1BRGEsR0FDSEYsT0FERyxDQUNiRSxNQURhOztBQUUvQixZQUFNQyxTQUFTRixXQUFmO0FBQ0EsWUFBTUcsV0FBVyxNQUFNRCxPQUFPQyxRQUFQLENBQWdCQyxJQUFoQixFQUF2QjtBQUNBSCxhQUFPSSxLQUFQLENBQWFGLFNBQVNHLEdBQVQsQ0FBYTtBQUFBLGVBQU9DLElBQUlkLElBQVg7QUFBQSxPQUFiLEVBQThCZSxJQUE5QixDQUFtQyxJQUFuQyxDQUFiO0FBQ0QsS0FMRDs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUxhLEMiLCJmaWxlIjoibGlzdERhdGFzZXRzQ29tbWFuZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IHtcbiAgbmFtZTogJ2xpc3QnLFxuICBncm91cDogJ2RhdGFzZXQnLFxuICBzaWduYXR1cmU6ICcnLFxuICBkZXNjcmlwdGlvbjogJ0NyZWF0ZSBhIG5ldyBkYXRhc2V0IHdpdGhpbiB5b3VyIHByb2plY3QnLFxuICBhY3Rpb246IGFzeW5jIChhcmdzLCBjb250ZXh0KSA9PiB7XG4gICAgY29uc3Qge2FwaUNsaWVudCwgb3V0cHV0fSA9IGNvbnRleHRcbiAgICBjb25zdCBjbGllbnQgPSBhcGlDbGllbnQoKVxuICAgIGNvbnN0IGRhdGFzZXRzID0gYXdhaXQgY2xpZW50LmRhdGFzZXRzLmxpc3QoKVxuICAgIG91dHB1dC5wcmludChkYXRhc2V0cy5tYXAoc2V0ID0+IHNldC5uYW1lKS5qb2luKCdcXG4nKSlcbiAgfVxufVxuXG4iXX0=