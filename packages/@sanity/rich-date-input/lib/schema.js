'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.default = void 0

var _RichDate = _interopRequireDefault(require('./RichDate'))

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj}
}

var _default = {
  title: 'Rich Date',
  name: 'richDate',
  type: 'object',
  fields: [
    {
      name: 'utc',
      type: 'datetime',
      title: 'UTC',
      required: true,
    },
    {
      name: 'local',
      type: 'datetime',
      title: 'Local',
    },
    {
      name: 'timezone',
      type: 'string',
      title: 'Timezone',
    },
    {
      name: 'offset',
      type: 'number',
      title: 'Offset',
    },
  ],
  inputComponent: _RichDate.default,
}
exports.default = _default
