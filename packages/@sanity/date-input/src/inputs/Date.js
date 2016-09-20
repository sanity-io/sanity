import React, {PropTypes} from 'react'
import DatePicker from 'react-datepicker'
import moment from 'moment'
import styles from './Date.css'
import FormField from 'part:@sanity/components/formfields/default'
import {uniqueId} from 'lodash'

const getLocale = context => {
  const intl = context.intl || {}
  return (
    intl.locale
    || (typeof window !== 'undefined' && window.navigator.language)
    || 'en'
  )
}

export default class DateInput extends React.Component {
  static propTypes = {
    value: PropTypes.string,
    field: PropTypes.shape({
      title: PropTypes.string.isRequired
    }),
    onChange: PropTypes.func
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object,
    intl: PropTypes.shape({
      locale: PropTypes.string
    })
  };

  constructor(props, context) {
    super(props, context)

    this.handleFieldChange = this.handleFieldChange.bind(this)
  }

  handleFieldChange(date) {
    this.props.onChange({patch: {$set: date.format('YYYY-MM-DD')}})
  }

  render() {
    const {value, field} = this.props
    const inputId = uniqueId('FormBuilderText')
    return (
      <FormField labelHtmlFor={inputId} label={field.title}>
        <div className={styles.root}>
          <DatePicker
            id={inputId}
            locale={getLocale(this.context)}
            selected={value && moment(value)}
            onChange={this.handleFieldChange}
            showYearDropdown
            className={styles.datepicker}
          />
        </div>
      </FormField>
    )
  }
}
