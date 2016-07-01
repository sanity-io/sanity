import React, {PropTypes} from 'react'
import DatePicker from 'react-datepicker'
import moment from 'moment'

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
    const {value} = this.props
    return (
      <DatePicker
        locale={getLocale(this.context)}
        selected={value && moment(value)}
        onChange={this.handleFieldChange}
      />
    )
  }
}
