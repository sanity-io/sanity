import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from '../../schema/getFieldType'

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
    level: PropTypes.number,
    focus: PropTypes.bool,
    onChange: PropTypes.func,
    onRemove: PropTypes.func,
    onEnter: PropTypes.func
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
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
    return this.context.formBuilder.resolveInputComponent(field, fieldType)
  }

  getFieldType(field) {
    return getFieldType(this.context.formBuilder.schema, field)
  }

  render() {
    const {value, field, focus, level} = this.props

    const fieldType = this.getFieldType(field)

    const InputComponent = this.context.formBuilder.resolveInputComponent(field, fieldType)
    if (!InputComponent) {
      return (
        <div>No input component found for field of type "{field.type}"
          <pre>{JSON.stringify(field, null, 2)}</pre>
        </div>
      )
    }

    const passSerialized = value.constructor.passSerialized

    return (
      <InputComponent
        value={passSerialized ? value.serialize() : value}
        field={field}
        type={fieldType}
        level={level}
        focus={focus}
        onEnter={this.handleEnter}
        onChange={this.handleChange}
      />
    )
  }
}
