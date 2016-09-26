import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import equals from 'shallow-equals'
import FormField from 'part:@sanity/components/formfields/default'
import TextArea from 'part:@sanity/components/textareas/default'
import {uniqueId} from 'lodash'

export default class Text extends React.Component {

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
  }

  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  handleChange(e) {
    const val = e.target.value || undefined
    this.props.onChange({patch: {$set: val}})
  }


  render() {
    const {value, field, level} = this.props
    const inputId = uniqueId('FormBuilderText')
    return (
      <FormField label={field.title} labelHtmlFor={inputId} level={level}>
        <TextArea
          id={inputId}
          placeholder={field.placeholder}
          onChange={this.handleChange}
          rows={field.rows}
          value={value}
        />
      </FormField>
    )
  }
}
