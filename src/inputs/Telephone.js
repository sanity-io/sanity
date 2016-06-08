import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import Str from './String'

export default class extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  handleChange(event) {
    this.props.onChange({$set: event.target.value})
  }

  render() {
    const {value, field} = this.props
    return (
      <Str type="tel" field={field} value={value} onChange={this.handleChange} />
    )
  }
}
