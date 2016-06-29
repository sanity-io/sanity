import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

export default class Url extends React.Component {
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
    const {value} = this.props
    return (
      <input type="url" value={value} onChange={this.handleChange} />
    )
  }
}
