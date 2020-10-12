'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.getOptions = getOptions
exports.getPlaceholderText = getPlaceholderText
exports.getTimeIntervals = getTimeIntervals

var _moment = _interopRequireDefault(require('moment'))

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj}
}

function getOptions(props) {
  var options = Object.assign({}, props.type.options)
  options.dateFormat = options.dateFormat || 'YYYY-MM-DD'
  options.timeFormat = options.timeFormat || 'HH:mm'
  options.inputUtc = options.inputUtc === true
  options.timeStep = options.timeStep || 15
  options.calendarTodayLabel = options.calendarTodayLabel || 'Today'
  options.inputDate = options.hasOwnProperty('inputDate') ? options.inputDate : true
  options.inputTime = options.hasOwnProperty('inputTime') ? options.inputTime : true
  options.placeholderDate =
    options.placeholderDate || (0, _moment.default)().format(options.dateFormat)
  options.placeholderTime =
    options.placeholderTime || (0, _moment.default)().format(options.timeFormat)
  return options
}

function getPlaceholderText(options) {
  return ''
    .concat(options.inputDate ? options.placeholderDate : '', ' ')
    .concat(options.inputTime ? options.placeholderTime : '')
}

function getTimeIntervals(value, options) {
  var timeStep = options.timeStep,
    timeFormat = options.timeFormat
  var activeTime = value && (0, _moment.default)(value)
  var beginningOfDay = (0, _moment.default)().startOf('day')
  var multiplier = 1440 / timeStep
  var timeIntervals = []

  for (var i = 0; i < multiplier; i++) {
    timeIntervals.push(beginningOfDay.clone().add(i * timeStep, 'minutes'))
  }

  return timeIntervals.map((time) => {
    var isActive =
      activeTime && time.format(options.timeFormat) === activeTime.format(options.timeFormat)
    return {
      title: time.format(timeFormat),
      value: time,
      isActive: isActive,
    }
  })
}
