import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import {getFieldType} from '../../schema/getFieldType'

export default class ItemForm extends React.Component {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    value: PropTypes.any,
    level: PropTypes.number,
    focus: PropTypes.bool,
    onChange: PropTypes.func,
    onRemove: PropTypes.func,
    onClose: PropTypes.func
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
  }
  resolveInputComponent(type, fieldType) {
    return this.context.formBuilder.resolveInputComponent(type, fieldType)
  }

  getFieldType(type) {
    return getFieldType(this.context.formBuilder.schema, type)
  }

  handleChange = event => {
    const {onChange} = this.props
    onChange(event)
  }

  render() {
    const {value, type, focus, level} = this.props

    const fieldType = this.getFieldType(type)

    const InputComponent = this.context.formBuilder.resolveInputComponent(type, fieldType)
    if (!InputComponent) {
      return (
        <div>No input component found for type of type "{type.type}"
          <pre>{JSON.stringify(type, null, 2)}</pre>
        </div>
      )
    }

    const passSerialized = value.constructor.passSerialized

    return (
      <InputComponent
        value={passSerialized ? value.serialize() : value}
        type={type}
        type={fieldType}
        level={level}
        focus={focus}
        onChange={this.handleChange}
      />
    )
  }
}
