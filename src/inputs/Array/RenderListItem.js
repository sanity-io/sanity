import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from '../../utils/getFieldType'

export default class extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.handleChange = this.handleChange.bind(this);
  }

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    index: PropTypes.number.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  };

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
  }

  renderField(el) {
    const {index} = this.props
    return (
      <div key={index}>
        <button
          type="button"
          title="delete"
          onClick={() => this.handleChange()}
        >
          - Remove
        </button>
        {el}
      </div>
    )
  }

  handleChange(event) {
    const {index, onChange} = this.props
    onChange(event, index)
  }

  resolveInputComponent(field, fieldType) {
    return this.context.resolveInputComponent(field, fieldType)
  }

  getFieldType(field) {
    return getFieldType(this.context.schema, field)
  }

  render() {
    const {value, field} = this.props

    const fieldType = this.getFieldType(field)

    const FieldInput = this.context.resolveInputComponent(field, fieldType)
    if (!FieldInput) {
      return (
        <div>Field input not found for field of type "{field.type}"
          <pre>{JSON.stringify(field, null, 2)}</pre>
        </div>
      )
    }

    const passUnwrapped = value.constructor.passUnwrapped

    return this.renderField(
      <FieldInput
        value={passUnwrapped ? value.unwrap() : value}
        field={field}
        type={fieldType}
        onChange={this.handleChange}
      />
    )
  }
};
