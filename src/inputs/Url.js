import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import DefaultTextField from 'part:@sanity/components/textfields/default'

export default class Url extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  static propTypes = {
    field: FormBuilderPropTypes.field,
    value: PropTypes.number,
    onChange: PropTypes.func,
    focus: PropTypes.bool
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  handleChange(event) {
    this.props.onChange({patch: {type: 'set', value: event.target.value}})
  }

  render() {
    const {value, field, focus} = this.props
    return (
      <DefaultTextField
        label={field.title}
        description={field.description}
        type="url"
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
