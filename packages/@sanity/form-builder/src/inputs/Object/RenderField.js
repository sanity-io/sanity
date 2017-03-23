import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import React, {PropTypes} from 'react'
import styles from './styles/RenderField.css'
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
    onEnter() {
    }
  };

  static contextTypes = {
    formBuilder: PropTypes.object
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
    const {value, field, level, validation, focus} = this.props

    const FieldInput = this.context.formBuilder.resolveInputComponent(field.type)

    const expectedJSType = value.context.type.jsonType
    const valueJSType = resolveJSType(value.value)

    if (value.value && expectedJSType !== valueJSType) {
      return (
        <ManageInvalidValue
          {...this.props}
          {...{expectedJSType}}
          {...{valueJSType}}
        />
      )
    }

    if (!FieldInput) {
      return (
        <div className={styles.missingInput}>
          <h3>Warning</h3>
          <p>Field input not found for field of type {JSON.stringify(field.type.name)}</p>
        </div>
      )
    }

    const passValue = value && value.constructor.passSerialized ? value.serialize() : value
    const document = FieldInput.passDocument ? this.context.formBuilder.getDocument() : null

    return (
      <FieldInput
        level={level}
        value={passValue}
        type={field.type}
        validation={validation}
        onChange={this.handleChange}
        onEnter={this.handleEnter}
        focus={focus}
        document={document}
      />
    )
  }
}
