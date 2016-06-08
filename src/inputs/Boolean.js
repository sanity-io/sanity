import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

export default class Bool extends React.Component {
  static displayName = 'Boolean';

  static propTypes = {
    field: FormBuilderPropTypes.field,
    value: PropTypes.bool,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(e) {
    this.props.onChange({patch: {$set: e.target.checked}})
  }

  render() {
    const {value} = this.props
    return (
      <input
        type="checkbox"
        onChange={this.handleChange}
        checked={!!value}
      />
    )
  }
}
