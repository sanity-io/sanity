import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import DefaultTextField from 'component:@sanity/components/textfields/default'

export default class Email extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  handleChange(event) {
    this.props.onChange({patch: {$set: event.target.value}})
  }

  render() {
    const {field, value, level} = this.props
    return (
      <DefaultTextField
        label={field.title}
        type="email"
        level={level}
        placeholder={field.placeholder}
        onChange={this.handleChange}
        onKeyPress={this.handleKeyPress}
        value={value}
        focus={focus}
        ref={this.setInputElement}
      />
    )
  }
}
