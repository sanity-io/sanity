'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = promptForDatasetName;
const datasetNameError = 'Dataset names can only contain lowercase characters,' + 'numbers, underscores and dashes' + 'and can be at most 128 characters.';

function promptForDatasetName(prompt) {
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return prompt.single(_extends({
    type: 'input',
    message: 'Dataset name:',
    validate: name => {
      return (/^[-\w]{1,128}$/.test(name) || datasetNameError
      );
    }
  }, options));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hY3Rpb25zL2RhdGFzZXQvZGF0YXNldE5hbWVQcm9tcHQuanMiXSwibmFtZXMiOlsicHJvbXB0Rm9yRGF0YXNldE5hbWUiLCJkYXRhc2V0TmFtZUVycm9yIiwicHJvbXB0Iiwib3B0aW9ucyIsInNpbmdsZSIsInR5cGUiLCJtZXNzYWdlIiwidmFsaWRhdGUiLCJuYW1lIiwidGVzdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7a0JBTXdCQSxvQjtBQU54QixNQUFNQyxtQkFDSix5REFDRSxpQ0FERixHQUVFLG9DQUhKOztBQU1lLFNBQVNELG9CQUFULENBQThCRSxNQUE5QixFQUFvRDtBQUFBLE1BQWRDLE9BQWMsdUVBQUosRUFBSTs7QUFDakUsU0FBT0QsT0FBT0UsTUFBUDtBQUNMQyxVQUFNLE9BREQ7QUFFTEMsYUFBUyxlQUZKO0FBR0xDLGNBQVVDLFFBQVE7QUFDaEIsYUFBTyxrQkFBaUJDLElBQWpCLENBQXNCRCxJQUF0QixLQUErQlA7QUFBdEM7QUFDRDtBQUxJLEtBTUZFLE9BTkUsRUFBUDtBQVFEIiwiZmlsZSI6ImRhdGFzZXROYW1lUHJvbXB0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZGF0YXNldE5hbWVFcnJvciA9IChcbiAgJ0RhdGFzZXQgbmFtZXMgY2FuIG9ubHkgY29udGFpbiBsb3dlcmNhc2UgY2hhcmFjdGVycywnXG4gICsgJ251bWJlcnMsIHVuZGVyc2NvcmVzIGFuZCBkYXNoZXMnXG4gICsgJ2FuZCBjYW4gYmUgYXQgbW9zdCAxMjggY2hhcmFjdGVycy4nXG4pXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHByb21wdEZvckRhdGFzZXROYW1lKHByb21wdCwgb3B0aW9ucyA9IHt9KSB7XG4gIHJldHVybiBwcm9tcHQuc2luZ2xlKHtcbiAgICB0eXBlOiAnaW5wdXQnLFxuICAgIG1lc3NhZ2U6ICdEYXRhc2V0IG5hbWU6JyxcbiAgICB2YWxpZGF0ZTogbmFtZSA9PiB7XG4gICAgICByZXR1cm4gL15bLVxcd117MSwxMjh9JC8udGVzdChuYW1lKSB8fCBkYXRhc2V0TmFtZUVycm9yXG4gICAgfSxcbiAgICAuLi5vcHRpb25zXG4gIH0pXG59XG4iXX0=