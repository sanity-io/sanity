import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from '../../utils/getFieldType'
import Button from '../../buttons/Default'
import ReactDOM from 'react-dom'

export default class ItemForm extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
    this.handleRemove = this.handleRemove.bind(this)
    this.handleEnter = this.handleEnter.bind(this)
  }

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    index: PropTypes.number.isRequired,
    value: PropTypes.any,
    focus: PropTypes.bool,
    onChange: PropTypes.func,
    onRemove: PropTypes.func,
    onEnter: PropTypes.func
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
        {el}
        {
          // <Button
          //   type="button"
          //   title="delete"
          //   onClick={this.handleRemove}
          //   kind="delete"
          // >
          //   Remove
          // </Button>
        }

      </div>
    )
  }

  handleChange(event) {
    const {index, onChange} = this.props
    onChange(event, index)
  }

  handleRemove() {
    const {index, onRemove} = this.props
    onRemove(index)
  }

  handleEnter() {
    const {index, onEnter} = this.props
    onEnter(index)
  }

  resolveInputComponent(field, fieldType) {
    return this.context.resolveInputComponent(field, fieldType)
  }

  getFieldType(field) {
    return getFieldType(this.context.schema, field)
  }

  render() {
    const {value, field, focus} = this.props

    const fieldType = this.getFieldType(field)

    const FieldInput = this.context.resolveInputComponent(field, fieldType)
    if (!FieldInput) {
      return (
        <div>Field input not found for field of type "{field.type}"
          <pre>{JSON.stringify(field, null, 2)}</pre>
        </div>
      )
    }

    const passSerialized = value.constructor.passSerialized

    return this.renderField(
      <FieldInput
        value={passSerialized ? value.serialize() : value}
        field={field}
        type={fieldType}
        focus={focus}
        onEnter={this.handleEnter}
        onChange={this.handleChange}
      />
    )
  }
}
