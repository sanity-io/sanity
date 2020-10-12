'use strict'

var _react = _interopRequireDefault(require('react'))

var _storybook = require('part:@sanity/storybook')

var _richDate = _interopRequireDefault(require('part:@sanity/form-builder/input/rich-date'))

var _knobs = require('part:@sanity/storybook/addons/knobs')

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj}
}

;(0, _storybook.storiesOf)('Date Picker', module)
  .addDecorator(_knobs.withKnobs)
  .add('Default', () => {
    var dateFormat = (0, _knobs.text)('dateFormat', 'YYYY-MM-DD')
    var timeFormat = (0, _knobs.text)('timeFormat', 'HH:mm')
    var inputUtc = (0, _knobs.boolean)('inputUtc', false)
    var timeStep = (0, _knobs.number)('timeStep', 15)
    var calendarTodayLabel = (0, _knobs.text)('calendarTodayLabel', 'Today')
    var placeholderDate = (0, _knobs.text)('placeholderDate')
    var placeholderTime = (0, _knobs.text)('placeholderTime')
    var inputDate = (0, _knobs.boolean)('inputDate', true)
    var inputTime = (0, _knobs.boolean)('inputTime', true)
    var options = {
      dateFormat,
      timeFormat,
      inputUtc,
      timeStep,
      calendarTodayLabel,
      placeholderDate,
      placeholderTime,
      inputDate,
      inputTime,
    }
    return /*#__PURE__*/ _react.default.createElement(_richDate.default, {
      onChange: (0, _storybook.action)('onChange'),
      type: {
        title: (0, _knobs.text)('title'),
        description: (0, _knobs.text)('description'),
        options: options,
      },
    })
  })
