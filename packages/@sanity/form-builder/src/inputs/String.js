import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import equals from 'shallow-equals'
import DefaultTextField from 'part:@sanity/components/textfields/default'

export default class Str extends React.PureComponent {
  static displayName = 'String';

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    validation: PropTypes.shape({
      messages: PropTypes.array
    }),
    hasFocus: PropTypes.bool,
    onChange: PropTypes.func,
    onEnter: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {},
    onEnter() {}
  }

  state = {
    hasFocus: this.props.hasFocus
  }


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

  handleFocus = () => {
    this.setState({
      hasFocus: true
    })
  }

  handleBlur = () => {
    this.setState({
      hasFocus: false
    })
  }

  handleKeyPress = event => {
    if (event.key === 'Enter') {
      this.props.onEnter()
    }
  }

  render() {
    const {value, type, validation, level} = this.props
    const {hasFocus} = this.state

    return (
      <DefaultTextField
        label={type.title}
        description={type.description}
        level={level}
        validation={validation}
        placeholder={type.placeholder}
        onChange={this.handleChange}
        onKeyPress={this.handleKeyPress}
        value={value}
        hasFocus={hasFocus}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
      />
    )
  }
}
