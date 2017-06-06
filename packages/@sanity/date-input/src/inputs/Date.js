import moment from 'moment-timezone'
import {uniqueId} from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import Kronos from 'react-kronos'
import FormField from 'part:@sanity/components/formfields/default'
import styles from './Date.css'
import PatchEvent, {set, unset} from '@sanity/form-builder/PatchEvent'

const KRONOS_STYLES = {
  input: styles.datepicker,
  kronos: styles.kronos
}

export default class DateInput extends React.PureComponent {

  assembleOutgoingValue(newMoment) {
    if (!newMoment || !newMoment.isValid()) {
      return undefined
    }
    if (this.optionsWithDefaults().inputUtc) {
      return newMoment.utc().format() // e.g. 2017-02-12T09:15:00Z
    }
    return newMoment.format() // e.g. 2017-02-21T10:15:00+01:00
  }

  handleChange = nextValue => {
    const {onChange} = this.props
    const assembledValue = this.assembleOutgoingValue(nextValue)
    onChange(PatchEvent.from(assembledValue ? set(assembledValue) : unset()))
  }

  editableMoment(currentValue) {
    if (!currentValue) {
      return null
    }
    if (this.optionsWithDefaults().inputUtc) {
      return moment.utc(currentValue)
    }
    return moment(currentValue)
  }

  optionsWithDefaults() { // eslint-disable-line complexity
    const options = this.props.type.options || {}
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

  render() {
    const {value, type, level} = this.props
    const {title, description} = type
    const options = this.optionsWithDefaults()
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
      timeStep: options.timeStep,
    }

    return (
      <FormField labelFor={inputId} label={title} level={level} description={description}>
        <div className={styles.root}>
          {options.inputDate && (
            <Kronos
              classes={KRONOS_STYLES}
              date={editableMoment}
              format={options.dateFormat}
              onChangeDateTime={this.handleChange}
              placeholder={options.placeholderDate}
              {...kronosProps}
            />
          )}
          {options.inputTime && (
            <Kronos
              classes={KRONOS_STYLES}
              time={editableMoment}
              format={options.timeFormat}
              onChangeDateTime={this.handleChange}
              placeholder={options.placeholderTime}
              {...kronosProps}
            />
          )}
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
