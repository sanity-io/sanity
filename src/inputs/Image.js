import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'

export default class extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.handleChange = this.handleChange.bind(this);
  }

  static propTypes = {
    field: FormBuilderPropTypes.field,
    value: PropTypes.string,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  handleChange(e) {
    this.props.onChange(e.target.value)
  }

  render() {
    const {value} = this.props
    return (
      <input type="file"
        onChange={this.handleChange}
        value={value}
      />
    )
  }
};
