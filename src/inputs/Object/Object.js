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
    onChange: PropTypes.func,
    level: PropTypes.number
  };

  static defaultProps = {
    onChange() {},
    level: 0
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object
  };

  constructor(props, context) {
    super(props, context)
    this.handleFieldChange = this.handleFieldChange.bind(this)
  }

  handleFieldChange(event, fieldName) {
    const {onChange} = this.props
    const patch = {[fieldName]: event.patch}
    onChange({patch})
  }

  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  renderField(field, validation, level) {
    const {value} = this.props
    const fieldValue = value.getFieldValue(field.name)

    return (
      <RenderField
        key={field.name}
        fieldName={field.name}
        field={field}
        value={fieldValue}
        onChange={this.handleFieldChange}
        validation={validation}
        level={level}
      />
    )
  }

  renderFieldset(fieldset, validation) {
    const {level} = this.props
    return (
      <Fieldset key={fieldset.name} legend={fieldset.title} level={level}>
        {fieldset.fields.map(field => this.renderField(field, validation, level + 1))}
      </Fieldset>
    )
  }

  render() {
    const {type, validation} = this.props
    return (
      <div>
        {type.fieldsets.map(fieldset => {
          const fieldValidation = validation && validation.fields[fieldset.field.name]
          return fieldset.lonely
            ? this.renderField(fieldset.field, fieldValidation, this.props.level)
            : this.renderFieldset(fieldset, fieldValidation)
        })}
      </div>
    )
  }
}
