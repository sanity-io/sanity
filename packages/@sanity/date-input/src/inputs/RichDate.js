import moment from 'moment-timezone'
import {get} from 'lodash'
import generateHelpUrl from '@sanity/generate-help-url'
import PropTypes from 'prop-types'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import styles from './RichDate.css'
import PatchEvent, {set, unset} from '@sanity/form-builder/PatchEvent'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css'
import DefaultSelect from 'part:@sanity/components/selects/default'

const DEPRECATION_WARNING = (
  <div className={styles.deprecationWarning}>
    This field has <code>type: {'date'}</code>, which is deprecated and should be changed to
    {' '}<code>type: {'richDate'}</code>.
    Please update your schema and migrate your data. {' '}
    <a
      href={generateHelpUrl('migrate-to-rich-date')}
      target="_blank"
      rel="noopener noreferrer"
    >
      More info
    </a>
  </div>
)

export default class RichDateInput extends React.PureComponent {

  getOptions(props) {
    const options = props.type.options
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

  // If schema options sez input is UTC
  // we're not storing anything else in order to avoid confusion
  assembleOutgoingValue(newMoment) {
    const {type} = this.props
    if (!newMoment || !newMoment.isValid()) {
      return undefined
    }
    if (get(type, 'options.inputUtc') === true) {
      // Only store non-localized data
      return {
        _type: type.name,
        utc: newMoment.utc().format() // e.g. "2017-02-12T09:15:00Z"
      }
    }
    return {
      _type: type.name,
      local: newMoment.format(), // e.g. 2017-02-21T10:15:00+01:00
      utc: newMoment.utc().format(), // e.g. 2017-02-12T09:15:00Z
      timezone: moment.tz.guess(), // e.g. Europe/Oslo
      offset: moment().utcOffset() // e.g. 60 (utc offset in minutes)
    }
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

  getTimeIntervals(options, value) {
    //const value = this.props
    const times = []
    const format = options.timeFormat
    const intervals = options.timeStep
    const activeTime = (value && moment(value.utc))
    const base = moment().startOf('day')
    const multiplier = 1440 / intervals
    for (let i = 0; i < multiplier; i++) {
      times.push(base.clone().add(i * intervals, 'minutes'))
    }
    return times.map(time => {
      const isActive = activeTime && (time.format('HH:mm') === activeTime.format('HH:mm'))
      return {
        title: time.format(format),
        value: time,
        isActive: isActive
      }
    })
  }

  getCurrentValue = () => {
    const {value} = this.props
    if (!value) {
      return null
    }
    if (get(this.props, 'type.options.inputUtc') === true) {
      return value.utc
    }

    return value.local
  }

  getPlaceholderText(options) {
    return `${options.inputDate ? options.placeholderDate : ''} ${options.inputTime ? options.placeholderTime : ''}`
  }

  render() {
    const {value, type, level} = this.props

    if (!type) {
      return <div>Date picker: Missing type</div>
    }

    const {title, description} = type

    const options = this.getOptions(this.props)
    const timeIntervals = this.getTimeIntervals(options, value)

    const activeTimeInterval = timeIntervals.find(time => time.isActive === true)

    return (
      <FormField labelFor={this.inputId} label={title} level={level} description={description}>
        {type.name === 'date' && DEPRECATION_WARNING}
        <div className={options.inputTime ? styles.rootWithTime : styles.root}>
          {options.inputDate && (
            <DatePicker
              {...options}
              showMonthDropdown
              showYearDropdown
              todayButton={options.calendarTodayLabel}
              selected={value && moment(
                get(this.props, 'type.options.inputUtc') ? value.utc : value.local
              )}
              placeholderText={this.getPlaceholderText(options)}
              calendarClassName={styles.datepicker}
              className={styles.input}
              onChange={this.handleChange}
              value={value && moment(
                  get(this.props, 'type.options.inputUtc') ? value.utc : value.local
                ).format(`${options.inputDate ? options.dateFormat : ''} ${options.inputTime ? options.timeFormat : ''}`)
              }
              showTimeSelect={options.inputTime}
              dateFormat={`${options.inputDate ? options.dateFormat : ''} ${options.inputTime ? options.timeFormat : ''}`}
              timeFormat={options.timeFormat}
              timeIntervals={options.timeStep}
            />
          )}

          {
            !options.inputDate && options.inputTime && (
              <DefaultSelect
                items={timeIntervals}
                value={activeTimeInterval}
                onChange={this.handleTimeChange}
              />
            )
          }
        </div>
      </FormField>
    )
  }
}

RichDateInput.propTypes = {
  value: PropTypes.shape({
    utc: PropTypes.string,
    local: PropTypes.string,
    timezone: PropTypes.string,
    offset: PropTypes.number
  }),
  type: PropTypes.shape({
    title: PropTypes.string.isRequired,
    options: PropTypes.object
  }),
  onChange: PropTypes.func,
  level: PropTypes.number
}

RichDateInput.contextTypes = {
  resolveInputComponent: PropTypes.func,
  schema: PropTypes.object,
  intl: PropTypes.shape({
    locale: PropTypes.string
  })
}
