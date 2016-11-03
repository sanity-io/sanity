'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isLikelyASyntaxError = isLikelyASyntaxError;
exports.formatMessage = formatMessage;

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const friendlySyntaxErrorLabel = 'Syntax error:';

function isLikelyASyntaxError(message) {
  return message.indexOf(friendlySyntaxErrorLabel) !== -1;
}

function formatMessage(message) {
  return message
  // Make some common errors shorter:
  .replace(
  // Babel syntax error
  'Module build failed: SyntaxError:', friendlySyntaxErrorLabel).replace(
  // Webpack file not found error
  /Module not found: Error: Cannot resolve 'file' or 'directory'/, 'Module not found:')
  // Internal stacks are generally useless so we strip them
  .replace(/^\s*at\s.*:\d+:\d+[\s\)]*\n/gm, '') // at ... ...:x:y
  // Webpack loader names obscure CSS filenames
  .replace(/\.\/~\/css-loader.*?!\.\/~\/postcss-loader!/, '')
  // Make Sanity part names readable
  .replace(/(?:.*)!(\..*?)\?sanity(?:Role|Part)=(.*?)(?:&|$).*/gm, (full, path, part) => {
    return `${ path } (${ _chalk2.default.yellow(decodeURIComponent(part)) })`;
  }).replace(/\?sanity(?:Role|Part)=(.*?)(&|$).*/gm, (full, part) => {
    return ` (${ _chalk2.default.yellow(decodeURIComponent(part)) })`;
  })
  // Make paths red
  .replace(/(\s+@\s+)([.\/]\S+)( \(.*?\))/g, (full, prefix, path, part) => {
    return `${ prefix }${ _chalk2.default.red(path) }${ part }`;
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9zdGFydC9mb3JtYXRNZXNzYWdlLmpzIl0sIm5hbWVzIjpbImlzTGlrZWx5QVN5bnRheEVycm9yIiwiZm9ybWF0TWVzc2FnZSIsImZyaWVuZGx5U3ludGF4RXJyb3JMYWJlbCIsIm1lc3NhZ2UiLCJpbmRleE9mIiwicmVwbGFjZSIsImZ1bGwiLCJwYXRoIiwicGFydCIsInllbGxvdyIsImRlY29kZVVSSUNvbXBvbmVudCIsInByZWZpeCIsInJlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFJZ0JBLG9CLEdBQUFBLG9CO1FBSUFDLGEsR0FBQUEsYTs7QUFSaEI7Ozs7OztBQUVBLE1BQU1DLDJCQUEyQixlQUFqQzs7QUFFTyxTQUFTRixvQkFBVCxDQUE4QkcsT0FBOUIsRUFBdUM7QUFDNUMsU0FBT0EsUUFBUUMsT0FBUixDQUFnQkYsd0JBQWhCLE1BQThDLENBQUMsQ0FBdEQ7QUFDRDs7QUFFTSxTQUFTRCxhQUFULENBQXVCRSxPQUF2QixFQUFnQztBQUNyQyxTQUFPQTtBQUNMO0FBREssR0FFSkUsT0FGSTtBQUdIO0FBQ0EscUNBSkcsRUFLSEgsd0JBTEcsRUFPSkcsT0FQSTtBQVFIO0FBQ0EsaUVBVEcsRUFVSCxtQkFWRztBQVlMO0FBWkssR0FhSkEsT0FiSSxDQWFJLCtCQWJKLEVBYXFDLEVBYnJDLEVBYXlDO0FBQzlDO0FBZEssR0FlSkEsT0FmSSxDQWVJLDZDQWZKLEVBZW1ELEVBZm5EO0FBZ0JMO0FBaEJLLEdBaUJKQSxPQWpCSSxDQWlCSSxzREFqQkosRUFpQjRELENBQUNDLElBQUQsRUFBT0MsSUFBUCxFQUFhQyxJQUFiLEtBQXNCO0FBQ3JGLFdBQVEsSUFBRUQsSUFBSyxPQUFJLGdCQUFNRSxNQUFOLENBQWFDLG1CQUFtQkYsSUFBbkIsQ0FBYixDQUF1QyxJQUExRDtBQUNELEdBbkJJLEVBb0JKSCxPQXBCSSxDQW9CSSxzQ0FwQkosRUFvQjRDLENBQUNDLElBQUQsRUFBT0UsSUFBUCxLQUFnQjtBQUMvRCxXQUFRLE1BQUksZ0JBQU1DLE1BQU4sQ0FBYUMsbUJBQW1CRixJQUFuQixDQUFiLENBQXVDLElBQW5EO0FBQ0QsR0F0Qkk7QUF1Qkw7QUF2QkssR0F3QkpILE9BeEJJLENBd0JJLGdDQXhCSixFQXdCc0MsQ0FBQ0MsSUFBRCxFQUFPSyxNQUFQLEVBQWVKLElBQWYsRUFBcUJDLElBQXJCLEtBQThCO0FBQ3ZFLFdBQVEsSUFBRUcsTUFBTyxLQUFFLGdCQUFNQyxHQUFOLENBQVVMLElBQVYsQ0FBZ0IsS0FBRUMsSUFBSyxHQUExQztBQUNELEdBMUJJLENBQVA7QUEyQkQiLCJmaWxlIjoiZm9ybWF0TWVzc2FnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcblxuY29uc3QgZnJpZW5kbHlTeW50YXhFcnJvckxhYmVsID0gJ1N5bnRheCBlcnJvcjonXG5cbmV4cG9ydCBmdW5jdGlvbiBpc0xpa2VseUFTeW50YXhFcnJvcihtZXNzYWdlKSB7XG4gIHJldHVybiBtZXNzYWdlLmluZGV4T2YoZnJpZW5kbHlTeW50YXhFcnJvckxhYmVsKSAhPT0gLTFcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE1lc3NhZ2UobWVzc2FnZSkge1xuICByZXR1cm4gbWVzc2FnZVxuICAgIC8vIE1ha2Ugc29tZSBjb21tb24gZXJyb3JzIHNob3J0ZXI6XG4gICAgLnJlcGxhY2UoXG4gICAgICAvLyBCYWJlbCBzeW50YXggZXJyb3JcbiAgICAgICdNb2R1bGUgYnVpbGQgZmFpbGVkOiBTeW50YXhFcnJvcjonLFxuICAgICAgZnJpZW5kbHlTeW50YXhFcnJvckxhYmVsXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgLy8gV2VicGFjayBmaWxlIG5vdCBmb3VuZCBlcnJvclxuICAgICAgL01vZHVsZSBub3QgZm91bmQ6IEVycm9yOiBDYW5ub3QgcmVzb2x2ZSAnZmlsZScgb3IgJ2RpcmVjdG9yeScvLFxuICAgICAgJ01vZHVsZSBub3QgZm91bmQ6J1xuICAgIClcbiAgICAvLyBJbnRlcm5hbCBzdGFja3MgYXJlIGdlbmVyYWxseSB1c2VsZXNzIHNvIHdlIHN0cmlwIHRoZW1cbiAgICAucmVwbGFjZSgvXlxccyphdFxccy4qOlxcZCs6XFxkK1tcXHNcXCldKlxcbi9nbSwgJycpIC8vIGF0IC4uLiAuLi46eDp5XG4gICAgLy8gV2VicGFjayBsb2FkZXIgbmFtZXMgb2JzY3VyZSBDU1MgZmlsZW5hbWVzXG4gICAgLnJlcGxhY2UoL1xcLlxcL35cXC9jc3MtbG9hZGVyLio/IVxcLlxcL35cXC9wb3N0Y3NzLWxvYWRlciEvLCAnJylcbiAgICAvLyBNYWtlIFNhbml0eSBwYXJ0IG5hbWVzIHJlYWRhYmxlXG4gICAgLnJlcGxhY2UoLyg/Oi4qKSEoXFwuLio/KVxcP3Nhbml0eSg/OlJvbGV8UGFydCk9KC4qPykoPzomfCQpLiovZ20sIChmdWxsLCBwYXRoLCBwYXJ0KSA9PiB7XG4gICAgICByZXR1cm4gYCR7cGF0aH0gKCR7Y2hhbGsueWVsbG93KGRlY29kZVVSSUNvbXBvbmVudChwYXJ0KSl9KWBcbiAgICB9KVxuICAgIC5yZXBsYWNlKC9cXD9zYW5pdHkoPzpSb2xlfFBhcnQpPSguKj8pKCZ8JCkuKi9nbSwgKGZ1bGwsIHBhcnQpID0+IHtcbiAgICAgIHJldHVybiBgICgke2NoYWxrLnllbGxvdyhkZWNvZGVVUklDb21wb25lbnQocGFydCkpfSlgXG4gICAgfSlcbiAgICAvLyBNYWtlIHBhdGhzIHJlZFxuICAgIC5yZXBsYWNlKC8oXFxzK0BcXHMrKShbLlxcL11cXFMrKSggXFwoLio/XFwpKS9nLCAoZnVsbCwgcHJlZml4LCBwYXRoLCBwYXJ0KSA9PiB7XG4gICAgICByZXR1cm4gYCR7cHJlZml4fSR7Y2hhbGsucmVkKHBhdGgpfSR7cGFydH1gXG4gICAgfSlcbn1cbiJdfQ==