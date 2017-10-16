import moment from 'moment'
import generateHelpUrl from '@sanity/generate-help-url'
import PropTypes from 'prop-types'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import styles from './Date.css'
import PatchEvent, {set, unset} from '@sanity/form-builder/PatchEvent'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css'
import DefaultSelect from 'part:@sanity/components/selects/default'


const DEPRECATION_WARNING = (
  <div className={styles.deprecationWarning}>
    This field has <code>type: {'date'}</code>, but the data associated with it has the richDate format. Either change the schema: <code>type: {'richDate'}</code>. Or migrate your data. {' '}
    <a href={generateHelpUrl('migrate-to-rich-date')} target="_blank" rel="noopener noreferrer">
      More info
    </a>
  </div>
)

export default class DateInput extends React.PureComponent {

  getOptions() {
    const options = Object.assign({}, this.props.type.options)
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

  assembleOutgoingValue(newMoment) {
    if (!newMoment || !newMoment.isValid()) {
      return undefined
    }
    if (this.getOptions().inputUtc) {
      return newMoment.utc().format() // e.g. "2017-02-12T09:15:00Z"
    }
    return newMoment.format() // e.g. 2017-02-21T10:15:00+01:00
  }

  handleChange = nextValue => {
    const {onChange} = this.props
    const assembledValue = this.assembleOutgoingValue(nextValue)
    onChange(PatchEvent.from(assembledValue ? set(assembledValue) : unset()))
  }

  handleTimeChange = nextValue => {
    const {onChange} = this.props
    const assembledValue = this.assembleOutgoingValue(nextValue.value)
    onChange(PatchEvent.from(assembledValue ? set(assembledValue) : unset()))
  }

  getTimeIntervals(value) {
    const options = this.getOptions()
    const {timeStep, timeFormat} = options
    const activeTime = value && moment(value)
    const beginningOfDay = moment().startOf('day')
    const multiplier = 1440 / timeStep

    const timeIntervals = []
    for (let i = 0; i < multiplier; i++) {
      timeIntervals.push(beginningOfDay.clone().add(i * timeStep, 'minutes'))
    }
    return timeIntervals.map(time => {
      const isActive = activeTime && time.format(options.timeFormat) === activeTime.format(options.timeFormat)
      return {
        title: time.format(timeFormat),
        value: time,
        isActive: isActive
      }
    })
  }

  getCurrentValue = () => {
    const {value} = this.props
    return value ? value : null
  }

  getPlaceholderText() {
    const options = this.getOptions()
    return `${options.inputDate ? options.placeholderDate : ''} ${options.inputTime ? options.placeholderTime : ''}`
  }

  render() {
    const {value, type, level} = this.props

    if (!type) {
      return <div>Date picker: Missing type</div>
    }

    const {title, description} = type
    const options = this.getOptions()
    const timeIntervals = this.getTimeIntervals(value)
    const activeTimeInterval = timeIntervals.find(time => time.isActive === true)
    const format = [
      options.inputDate ? options.dateFormat : null,
      options.inputTime ? options.timeFormat : null
    ].filter(Boolean).join(' ')
    return (
      <FormField labelFor={this.inputId} label={title} level={level} description={description}>
        {type.name === 'date'
          && value
          && value.utc
          && typeof value === 'object'
          && DEPRECATION_WARNING}
        <div className={options.inputTime ? styles.rootWithTime : styles.root}>
          {options.inputDate && (
            <DatePicker
              {...options}
              showMonthDropdown
              showYearDropdown
              todayButton={options.calendarTodayLabel}
              selected={value && moment(value)}
              placeholderText={this.getPlaceholderText(options)}
              calendarClassName={styles.datepicker}
              className={styles.input}
              onChange={this.handleChange}
              value={value && moment(value).format(format)}
              showTimeSelect={options.inputTime}
              dateFormat={options.dateFormat}
              timeFormat={options.timeFormat}
              timeIntervals={options.timeStep}
            />
          )}

          {!options.inputDate
            && options.inputTime && <DefaultSelect items={timeIntervals} value={activeTimeInterval} onChange={this.handleTimeChange} />}
        </div>
      </FormField>
    )
  }
}

DateInput.propTypes = {
  value: PropTypes.string,
  type: PropTypes.shape({
    title: PropTypes.string.isRequired,
    options: PropTypes.object
  }),
  onChange: PropTypes.func,
  level: PropTypes.number
}

DateInput.contextTypes = {
  resolveInputComponent: PropTypes.func,
  schema: PropTypes.object,
  intl: PropTypes.shape({
    locale: PropTypes.string
  })
}
