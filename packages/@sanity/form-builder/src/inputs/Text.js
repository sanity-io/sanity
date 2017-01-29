import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import FormField from 'part:@sanity/components/formfields/default'
import TextArea from 'part:@sanity/components/textareas/default'
import {uniqueId} from 'lodash'

export default class Text extends React.PureComponent {

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    level: PropTypes.number.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: '',
    onChange() {}
  };

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
    this.inputId = uniqueId('FormBuilderText')
    this.state = {
      hasFocus: false
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

  render() {
    const {value, type, level} = this.props
    const {hasFocus} = this.state
    return (
      <FormField label={type.title} labelHtmlFor={this.inputId} level={level} description={type.description}>
        <TextArea
          id={this.inputId}
          placeholder={type.placeholder}
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          focus={hasFocus}
          rows={type.rows}
          value={value}
        />
      </FormField>
    )
  }
}
