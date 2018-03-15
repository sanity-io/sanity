import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'

export default class ItemForm extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    value: PropTypes.any,
    level: PropTypes.number,
    onChange: PropTypes.func
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  resolveInputComponent(type, fieldType) {
    return this.context.formBuilder.resolveInputComponent(type, fieldType)
  }

  handleChange = event => {
    const {onChange} = this.props
    onChange(event)
  }

  render() {
    const {value, type, level} = this.props

    const InputComponent = this.context.formBuilder.resolveInputComponent(type)
    if (!InputComponent) {
      return <div>No input component resolved for type {`"${type.name}"`}</div>
    }

    return <InputComponent value={value} type={type} level={level} onChange={this.handleChange} />
  }
}
