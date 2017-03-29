import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import DefaultTextField from 'part:@sanity/components/textfields/default'

export default class Email extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func,
    hasFocus: PropTypes.bool
  }

  static defaultProps = {
    value: '',
    onChange() {}
  }

  state = {
    hasFocus: this.props.hasFocus
  }

  componentDidUpdate(prevProps) {
    if (prevProps.hasFocus !== this.props.hasFocus) {
      this.handleFocus()
    }
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
    const {type, value, level} = this.props
    const {hasFocus} = this.state
    return (
      <DefaultTextField
        label={type.title}
        description={type.description}
        type="email"
        level={level}
        placeholder={type.placeholder}
        onChange={this.handleChange}
        onKeyPress={this.handleKeyPress}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        hasFocus={hasFocus}
        value={value}
        ref={this.setInputElement}
      />
    )
  }
}
