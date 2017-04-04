import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'

export default class ItemForm extends React.PureComponent {
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

  handleChange = event => {
    const {value, onChange} = this.props
    onChange(event, value)
  }

  handleEnter = () => {
    const {value, onEnter} = this.props
    onEnter(value)
  }

  resolveInputComponent(type, fieldType) {
    return this.context.formBuilder.resolveInputComponent(type, fieldType)
  }

  render() {
    const {value, type, hasFocus, level} = this.props

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
        onEnter={this.handleEnter}
        onChange={this.handleChange}
      />
    )
  }
}
