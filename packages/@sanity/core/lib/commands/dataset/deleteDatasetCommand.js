'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = {
  name: 'delete',
  group: 'dataset',
  signature: '[datasetName]',
  description: 'Delete a dataset within your project',
  action: (args, context) => {
    const apiClient = context.apiClient,
          output = context.output;

    var _args$argsWithoutOpti = _slicedToArray(args.argsWithoutOptions, 1);

    const dataset = _args$argsWithoutOpti[0];

    if (!dataset) {
      throw new Error('Dataset name must be provided');
    }

    return apiClient().datasets.delete(dataset).then(() => {
      output.print('Dataset deleted successfully');
    });
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9kYXRhc2V0L2RlbGV0ZURhdGFzZXRDb21tYW5kLmpzIl0sIm5hbWVzIjpbIm5hbWUiLCJncm91cCIsInNpZ25hdHVyZSIsImRlc2NyaXB0aW9uIiwiYWN0aW9uIiwiYXJncyIsImNvbnRleHQiLCJhcGlDbGllbnQiLCJvdXRwdXQiLCJhcmdzV2l0aG91dE9wdGlvbnMiLCJkYXRhc2V0IiwiRXJyb3IiLCJkYXRhc2V0cyIsImRlbGV0ZSIsInRoZW4iLCJwcmludCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7a0JBQWU7QUFDYkEsUUFBTSxRQURPO0FBRWJDLFNBQU8sU0FGTTtBQUdiQyxhQUFXLGVBSEU7QUFJYkMsZUFBYSxzQ0FKQTtBQUtiQyxVQUFRLENBQUNDLElBQUQsRUFBT0MsT0FBUCxLQUFtQjtBQUFBLFVBQ2xCQyxTQURrQixHQUNHRCxPQURILENBQ2xCQyxTQURrQjtBQUFBLFVBQ1BDLE1BRE8sR0FDR0YsT0FESCxDQUNQRSxNQURPOztBQUFBLCtDQUVQSCxLQUFLSSxrQkFGRTs7QUFBQSxVQUVsQkMsT0FGa0I7O0FBR3pCLFFBQUksQ0FBQ0EsT0FBTCxFQUFjO0FBQ1osWUFBTSxJQUFJQyxLQUFKLENBQVUsK0JBQVYsQ0FBTjtBQUNEOztBQUVELFdBQU9KLFlBQVlLLFFBQVosQ0FBcUJDLE1BQXJCLENBQTRCSCxPQUE1QixFQUFxQ0ksSUFBckMsQ0FBMEMsTUFBTTtBQUNyRE4sYUFBT08sS0FBUCxDQUFhLDhCQUFiO0FBQ0QsS0FGTSxDQUFQO0FBR0Q7QUFmWSxDIiwiZmlsZSI6ImRlbGV0ZURhdGFzZXRDb21tYW5kLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQge1xuICBuYW1lOiAnZGVsZXRlJyxcbiAgZ3JvdXA6ICdkYXRhc2V0JyxcbiAgc2lnbmF0dXJlOiAnW2RhdGFzZXROYW1lXScsXG4gIGRlc2NyaXB0aW9uOiAnRGVsZXRlIGEgZGF0YXNldCB3aXRoaW4geW91ciBwcm9qZWN0JyxcbiAgYWN0aW9uOiAoYXJncywgY29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHthcGlDbGllbnQsIG91dHB1dH0gPSBjb250ZXh0XG4gICAgY29uc3QgW2RhdGFzZXRdID0gYXJncy5hcmdzV2l0aG91dE9wdGlvbnNcbiAgICBpZiAoIWRhdGFzZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRGF0YXNldCBuYW1lIG11c3QgYmUgcHJvdmlkZWQnKVxuICAgIH1cblxuICAgIHJldHVybiBhcGlDbGllbnQoKS5kYXRhc2V0cy5kZWxldGUoZGF0YXNldCkudGhlbigoKSA9PiB7XG4gICAgICBvdXRwdXQucHJpbnQoJ0RhdGFzZXQgZGVsZXRlZCBzdWNjZXNzZnVsbHknKVxuICAgIH0pXG4gIH1cbn1cbiJdfQ==