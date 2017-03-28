import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import React, {PropTypes} from 'react'
import {FormBuilderInput} from '../../FormBuilderInput'
import {resolveJSType} from '../../utils/resolveJSType'
import ManageInvalidValue from './ManageInvalidValue'

// This component renders a single type in an object type. It emits onChange events telling the owner about the name of the type
// that changed. This gives the owner an opportunity to use the same event handler function for all of its fields
export default class RenderField extends React.Component {

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    validation: PropTypes.shape(FormBuilderPropTypes.validation),
    value: PropTypes.any,
    onChange: PropTypes.func,
    onEnter: PropTypes.func,
    level: PropTypes.number,
    focus: PropTypes.bool
  };

  static defaultProps = {
    validation: {messages: [], fields: {}},
    onEnter() {}
  };

  handleChange = event => {
    const {field, onChange} = this.props
    onChange(event, field)
  }

  handleEnter = event => {
    const {field, onEnter} = this.props
    onEnter(event, field)
  }

  render() {
    const {value, field, level, validation, focus, onChange} = this.props

    const expectedJSType = value.context.type.jsonType
    const valueJSType = resolveJSType(value.value)

    if (value.value && expectedJSType !== valueJSType) {
      return (
        <ManageInvalidValue
          field={field}
          value={value}
          onChange={onChange}
          expectedJSType={expectedJSType}
          valueJSType={valueJSType}
        />
      )
    }

    return (
      <FormBuilderInput
        value={value}
        type={field.type}
        validation={validation}
        onChange={this.handleChange}
        onEnter={this.handleEnter}
        level={level}
        focus={focus}
      />
    )
  }
}
