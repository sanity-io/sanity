import moment from 'moment'

export function getOptions(props) {
  const options = Object.assign({}, props.type.options)
  options.dateFormat = options.dateFormat || 'YYYY-MM-DD'
  options.timeFormat = options.timeFormat || 'HH:mm'
  options.inputUtc = options.inputUtc === true
  options.timeStep = options.timeStep || 15
  options.calendarTodayLabel = options.calendarTodayLabel || 'Today'
  options.inputDate = options.hasOwnProperty('inputDate') ? options.inputDate : true
  options.inputTime = options.hasOwnProperty('inputTime') ? options.inputTime : true
  options.placeholderDate = options.placeholderDate || moment().format(options.dateFormat)
  options.placeholderTime = options.placeholderTime || moment().format(options.timeFormat)
  return options
}

export function getPlaceholderText(options) {
  return `${options.inputDate ? options.placeholderDate : ''} ${
    options.inputTime ? options.placeholderTime : ''
  }`
}

export function getTimeIntervals(value, options) {
  const {timeStep, timeFormat} = options
  const activeTime = value && moment(value)
  const beginningOfDay = moment().startOf('day')
  const multiplier = 1440 / timeStep

  const timeIntervals = []
  for (let i = 0; i < multiplier; i++) {
    timeIntervals.push(beginningOfDay.clone().add(i * timeStep, 'minutes'))
  }
  return timeIntervals.map((time) => {
    const isActive =
      activeTime && time.format(options.timeFormat) === activeTime.format(options.timeFormat)
    return {
      title: time.format(timeFormat),
      value: time,
      isActive: isActive,
    }
  })
}
