import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import DefaultTextField from 'part:@sanity/components/textfields/default'

export default class Url extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.string,
    onChange: PropTypes.func,
    focus: PropTypes.bool
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  handleChange = event => {
    const value = event.target.value || undefined
    this.props.onChange({
      patch: {
        type: value ? 'set' : 'unset',
        path: [],
        value: value
      }
    })
  }

  render() {
    const {value, type, focus} = this.props
    return (
      <DefaultTextField
        label={type.title}
        description={type.description}
        type="url"
        placeholder={type.placeholder}
        onChange={this.handleChange}
        onKeyPress={this.handleKeyPress}
        value={value}
        focus={focus}
        ref={this.setInputElement}
      />
    )
  }
}
