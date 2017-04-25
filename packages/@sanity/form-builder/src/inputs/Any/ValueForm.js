import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'

export default class ValueForm extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    value: PropTypes.any,
    level: PropTypes.number,
    hasFocus: PropTypes.bool,
    onChange: PropTypes.func,
    onEnter: PropTypes.func
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  resolveInputComponent(type, fieldType) {
    return this.context.formBuilder.resolveInputComponent(type, fieldType)
  }

  render() {
    const {value, type, hasFocus, onChange, onEnter, level} = this.props

    const InputComponent = this.context.formBuilder.resolveInputComponent(type)
    if (!InputComponent) {
      return (
        <div>No input component found item of type {JSON.stringify(type.type.name)}
          <pre>{JSON.stringify(type, null, 2)}</pre>
        </div>
      )
    }

    return (
      <InputComponent
        value={value}
        type={type}
        level={level}
        hasFocus={hasFocus}
        onEnter={onEnter}
        onChange={onChange}
      />
    )
  }
}
