'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  name: 'code',
  type: 'object',
  fields: [{
    title: 'Code',
    name: 'code',
    type: 'text'
  }, {
    name: 'language',
    title: 'Language',
    type: 'string'
  }, {
    title: 'Highlighted lines',
    name: 'highlightedLines',
    type: 'array',
    of: [{
      type: 'string',
      title: 'Highlighted line'
    }]
  }]
};