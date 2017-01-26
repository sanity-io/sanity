import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'

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

  handleChange = event => {
    const {onChange} = this.props
    onChange(event)
  }

  render() {
    const {value, type, focus, level} = this.props

    const InputComponent = this.context.formBuilder.resolveInputComponent(type)
    if (!InputComponent) {
      return (
        <div>
          No input component resolved for type {`"${type.name}"`}
        </div>
      )
    }

    const passSerialized = value.constructor.passSerialized

    return (
      <InputComponent
        value={passSerialized ? value.serialize() : value}
        type={type}
        level={level}
        focus={focus}
        onChange={this.handleChange}
      />
    )
  }
}
