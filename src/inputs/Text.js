import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import FormField from 'part:@sanity/components/formfields/default'
import TextArea from 'part:@sanity/components/textareas/default'
import {uniqueId} from 'lodash'

export default class Text extends React.PureComponent {

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

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
    this.inputId = uniqueId('FormBuilderText')
  }

  handleChange(e) {
    const val = e.target.value || undefined
    this.props.onChange({patch: {type: 'set', path: [], value: val}})
  }

  render() {
    const {value, field, level} = this.props
    return (
      <FormField label={field.title} labelHtmlFor={this.inputId} level={level} description={field.description}>
        <TextArea
          id={this.inputId}
          placeholder={field.placeholder}
          onChange={this.handleChange}
          rows={field.rows}
          value={value}
        />
      </FormField>
    )
  }
}
