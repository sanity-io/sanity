import moment from 'moment-timezone'
import generateHelpUrl from '@sanity/generate-help-url'
import PropTypes from 'prop-types'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import styles from './RichDate.css'
import {PatchEvent, set, unset} from 'part:@sanity/form-builder/patch-event'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css'
import DefaultSelect from 'part:@sanity/components/selects/default'
import {getOptions, getTimeIntervals} from './util'

const DEPRECATION_WARNING = (
  <div className={styles.deprecationWarning}>
    This field has <code>type: {'date'}</code>, which is deprecated and should be changed to{' '}
    <code>type: {'richDate'}</code>. Please update your schema and migrate your data.{' '}
    <a href={generateHelpUrl('migrate-to-rich-date')} target="_blank" rel="noopener noreferrer">
      More info
    </a>
  </div>
)

export default class RichDateInput extends React.PureComponent {
  assembleOutgoingValue(newMoment) {
    if (!newMoment || !newMoment.isValid()) {
      return undefined
    }
    const {name} = this.props.type
    if (getOptions(this.props).inputUtc) {
      return {
        _type: name,
        utc: newMoment.utc().format(), // e.g. "2017-02-12T09:15:00Z"
      }
    }
    return {
      _type: name,
      local: newMoment.format(), // e.g. 2017-02-21T10:15:00+01:00
      utc: newMoment.utc().format(), // e.g. 2017-02-12T09:15:00Z
      timezone: moment.tz.guess(), // e.g. Europe/Oslo
      offset: moment().utcOffset(), // e.g. 60 (utc offset in minutes)
    }
  }

  handleChange = (nextValue) => {
    const {onChange} = this.props
    const assembledValue = this.assembleOutgoingValue(nextValue)
    onChange(PatchEvent.from(assembledValue ? set(assembledValue) : unset()))
  }

  handleTimeChange = (nextValue) => {
    const {onChange} = this.props
    const assembledValue = this.assembleOutgoingValue(nextValue.value)
    onChange(PatchEvent.from(assembledValue ? set(assembledValue) : unset()))
  }

  getCurrentValue = () => {
    const {value} = this.props
    if (!value) {
      return null
    }
    return getOptions(this.props).inputUtc ? value.utc : value.local
  }

  render() {
    const {value, type, level} = this.props
    const {title, description} = type
    const options = getOptions(this.props)
    const format = [
      options.inputDate ? options.dateFormat : null,
      options.inputTime ? options.timeFormat : null,
    ]
      .filter(Boolean)
      .join(' ')
    const timeIntervals = getTimeIntervals(value, options)
    const activeTimeInterval = timeIntervals.find((time) => time.isActive === true)

    const placeholder =
      typeof type.placeholder === 'function' ? type.placeholder() : type.placeholder

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
              selected={value && moment(options.inputUtc ? value.utc : value.local)}
              placeholderText={placeholder}
              calendarClassName={styles.datepicker}
              className={styles.input}
              onChange={this.handleChange}
              value={value && moment(options.inputUtc ? value.utc : value.local).format(format)}
              showTimeSelect={options.inputTime}
              dateFormat={options.dateFormat}
              timeFormat={options.timeFormat}
              timeIntervals={options.timeStep}
            />
          )}

          {!options.inputDate && options.inputTime && (
            <DefaultSelect
              items={timeIntervals}
              value={activeTimeInterval}
              onChange={this.handleTimeChange}
            />
          )}
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
    offset: PropTypes.number,
  }),
  type: PropTypes.shape({
    title: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    options: PropTypes.object,
  }),
  onChange: PropTypes.func,
  level: PropTypes.number,
}

RichDateInput.contextTypes = {
  resolveInputComponent: PropTypes.func,
  schema: PropTypes.object,
  intl: PropTypes.shape({
    locale: PropTypes.string,
  }),
}
