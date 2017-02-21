import moment from 'moment-timezone'
import {uniqueId} from 'lodash'
import React, {PropTypes} from 'react'
import Kronos from 'react-kronos'
import FormField from 'part:@sanity/components/formfields/default'
import styles from './Date.css'


export default class DateInput extends React.PureComponent {

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  // If schema options sez input is UTC
  // we're not storing anything else in order to avoid confusion
  assembleOutgoingValue(newMoment) {
    if (!newMoment) {
      return null
    }
    if (this.optionsWithDefaults().inputUtc) {
      return {
        utc: newMoment.utc().format() // e.g. "2017-02-12T09:15:00Z"
      }
    }
    return {
      local: newMoment.format(), // e.g. 2017-02-21T10:15:00+01:00
      utc: newMoment.utc().format(), // e.g. 2017-02-12T09:15:00Z
      timezone: moment.tz.guess(), // e.g. Europe/Oslo
      offset: moment().utcOffset() // e.g. 60 (utc offset in minutes)
    }
  }

  handleChange(localMoment) {
    this.props.onChange({
      patch: {
        type: (localMoment && localMoment.isValid()) ? 'set' : 'unset',
        path: [],
        value: this.assembleOutgoingValue(localMoment)
      }
    })
  }

  editableMoment(previousValue) {
    if (!previousValue) {
      return null
    }
    if (typeof previousValue === 'string') {
      // Backwards compatibility
      if (previousValue.match(/\d\d\d\d-\d\d-\d\d/)) {
        return moment(previousValue, 'YYYY-MM-DD')
      }
      if (previousValue.match(/\d\d\/\d\d\/\d\d\d\d/)) {
        return moment(previousValue, 'MM/DD/YYYY')
      }
      return moment() // sorry pal, can't help you
    }
    if (this.optionsWithDefaults().inputUtc) {
      return previousValue.utc ? moment.utc(previousValue.utc) : moment.utc()
    }
    return previousValue.local ? moment(previousValue.local) : moment()
  }

  optionsWithDefaults() {
    const options = this.props.type.options || {}
    options.dateFormat = options.dateFormat || 'YYYY-MM-DD'
    options.timeFormat = options.timeFormat || 'HH:mm'
    options.inputUtc = options.inputUtc || false
    options.timeStep = options.timeStep || 15
    options.calendarTodayLabel = options.calendarTodayLabel || 'Today'
    options.inputDate = options.hasOwnProperty('inputDate') ? options.inputDate : true
    options.inputTime = options.hasOwnProperty('inputTime') ? options.inputTime : true
    return options
  }

  render() {
    const {value, type, level} = this.props
    const options = this.optionsWithDefaults()

    const description = [
      (options.inputUtc ? 'Input is UTC' : null),
      type.description
    ].filter(Boolean).join('. ')

    const inputId = uniqueId('FormBuilderText')
    const editableMoment = this.editableMoment(value)
    const kronosProps = {
      options: {
        color: '#67c446',
        format: {
          today: options.calendarTodayLabel,
          year: 'YYYY',
          month: 'MMM',
          day: 'D',
          hour: 'H:mm',
        }
      },
      hideOutsideDateTimes: true,
      timeStep: options.timeStep
    }

    return (
      <FormField labelHtmlFor={inputId} label={type.title} level={level} description={description}>
        <div className={styles.root}>
          {options.inputDate && (
            <Kronos
              date={editableMoment}
              format={options.dateFormat}
              onChangeDateTime={this.handleChange}
              {...kronosProps}
            />
          )}
          {options.inputTime && (
            <Kronos
              time={editableMoment}
              format={options.timeFormat}
              onChangeDateTime={this.handleChange}
              {...kronosProps}
            />
          )}
        </div>
      </FormField>
    )
  }
}

DateInput.propTypes = {
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

DateInput.contextTypes = {
  resolveInputComponent: PropTypes.func,
  schema: PropTypes.object,
  intl: PropTypes.shape({
    locale: PropTypes.string
  })
}
