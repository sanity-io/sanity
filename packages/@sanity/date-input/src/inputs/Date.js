import moment from 'moment'
import {uniqueId} from 'lodash'
import React, {PropTypes} from 'react'
import DatePicker from 'react-datepicker'
import FormField from 'part:@sanity/components/formfields/default'
import KeyboardLessInput from './KeyboardLessInput'
import styles from './Date.css'

const getLocale = context => {
  const intl = context.intl || {}
  return (
    intl.locale
    || (typeof window !== 'undefined' && window.navigator.language)
    || 'en'
  )
}

export default class DateInput extends React.PureComponent {
  static propTypes = {
    value: PropTypes.string,
    type: PropTypes.shape({
      title: PropTypes.string.isRequired
    }),
    onChange: PropTypes.func,
    level: PropTypes.number
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object,
    level: 0,
    intl: PropTypes.shape({
      locale: PropTypes.string
    })
  };

  constructor(props, context) {
    super(props, context)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(date) {
    this.props.onChange({
      patch: {
        type: (date && date.isValid()) ? 'set' : 'unset',
        path: [],
        value: date.format('YYYY-MM-DD')
      }
    })
  }

  render() {
    const {value, type, level} = this.props
    const inputId = uniqueId('FormBuilderText')
    const input = <KeyboardLessInput />
    return (
      <FormField labelHtmlFor={inputId} label={type.title} level={level}>
        <div className={styles.root}>
          <DatePicker
            dateFormat="YYYY-MM-DD"
            customInput={input}
            id={inputId}
            locale={getLocale(this.context)}
            selected={value && moment(value)}
            onChange={this.handleChange}
            showYearDropdown
            className={styles.datepicker}
          />
        </div>
      </FormField>
    )
  }
}
