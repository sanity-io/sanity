import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import equals from 'shallow-equals'
import DefaultTextField from 'part:@sanity/components/textfields/default'

export default class Str extends React.Component {
  static displayName = 'String';

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    validation: PropTypes.shape({
      messages: PropTypes.array
    }),
    focus: PropTypes.bool,
    onChange: PropTypes.func,
    onEnter: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {},
    onEnter() {}
  };

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.setInputElement = this.setInputElement.bind(this)
  }

  setInputElement(element) {
    this.inputElement = element
  }

  componentDidMount() {
    // if (this.props.focus) {
    //   this.focus()
    // }
  }
  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  handleChange(event) {
    const value = event.target.value || undefined
    this.props.onChange({
      patch: {
        type: value ? 'set' : 'unset',
        path: [],
        value: value
      }
    })
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      this.props.onEnter()
    }
  }

  render() {
    const {value, type, validation, focus, level} = this.props

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
        focus={focus}
        ref={this.setInputElement}
      />
    )
  }
}
