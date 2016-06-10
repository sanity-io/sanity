import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import RenderField from './RenderField'
import ObjectContainer from './ObjectContainer'
import Fieldset from '../../Fieldset'
import equals from 'shallow-equals'

export default class Obj extends React.Component {
  static displayName = 'Object'

  static valueContainer = ObjectContainer;

  static propTypes = {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    validation: PropTypes.shape(FormBuilderPropTypes.validation),
    value: PropTypes.object,
    focus: PropTypes.bool,
    onChange: PropTypes.func,
    onEnter: PropTypes.func,
    level: PropTypes.number
  };

  static defaultProps = {
    onChange() {},
    onEnter() {},
    level: 0
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object
  };

  constructor(props, context) {
    super(props, context)
    this.handleFieldChange = this.handleFieldChange.bind(this)
    this.handleFieldEnter = this.handleFieldEnter.bind(this)
  }

  handleFieldChange(event, fieldName) {
    const {onChange} = this.props
    const patch = {[fieldName]: event.patch}
    onChange({patch})
  }

  handleFieldEnter(event, fieldName) {
    this.props.onEnter(fieldName)
  }

  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  renderField(field, validation, level, index) {
    const {value, focus} = this.props
    const fieldValue = value.getFieldValue(field.name)

    return (
      <RenderField
        key={field.name}
        focus={focus && index === 0}
        fieldName={field.name}
        field={field}
        value={fieldValue}
        onChange={this.handleFieldChange}
        onEnter={this.handleFieldEnter}
        validation={validation}
        level={level}
      />
    )
  }

  renderFieldset(fieldset, validation, index) {
    const {level} = this.props
    return (
      <Fieldset key={fieldset.name} legend={fieldset.title} level={level}>
        {fieldset.fields.map((field, fieldIndex) => this.renderField(field, validation, level + 1, index + fieldIndex))}
      </Fieldset>
    )
  }

  render() {
    const {type, validation} = this.props
    return (
      <div>
        {type.fieldsets.map((fieldset, i) => {
          const fieldValidation = validation && validation.fields[fieldset.field.name]
          return fieldset.lonely
            ? this.renderField(fieldset.field, fieldValidation, this.props.level, i)
            : this.renderFieldset(fieldset, fieldValidation, i)
        })}
      </div>
    )
  }
}
