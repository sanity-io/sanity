import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import RenderField from './RenderField'
import ObjectContainer from './ObjectContainer'
import Fieldset, {FieldWrapper} from 'part:@sanity/components/fieldsets/default'
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
    level: PropTypes.number,
    isRoot: PropTypes.bool
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

  handleFieldChange = (event, fieldName) => {
    const {onChange} = this.props
    // Rewrite patch by prepending the field name to its path
    const patch = {
      ...event.patch,
      path: [fieldName, ...(event.patch.path || [])]
    }
    onChange({patch})
  }

  handleFieldEnter = (event, fieldName) => {
    this.props.onEnter(fieldName)
  }

  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  renderField(field, level, index) {
    const {value, focus, validation} = this.props
    const fieldValidation = validation && validation.fields[field.name]

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
        validation={fieldValidation}
        level={level}
      />
    )
  }

  renderFieldset(fieldset, level, index) {
    const columns = fieldset.options && fieldset.options.columns
    return (
      <Fieldset
        key={fieldset.name}
        legend={fieldset.title}
        description={fieldset.description}
        level={level}
        columns={columns}
      >
        {fieldset.fields.map((field, fieldIndex) => {
          return (
            <FieldWrapper key={field.name}>
              {this.renderField(field, level + 1, index + fieldIndex)}
            </FieldWrapper>
          )
        })}
      </Fieldset>
    )
  }

  render() {
    const {isRoot, field, type, level} = this.props

    const renderedFields = type.fieldsets.map((fieldset, i) => {
      return fieldset.single
            ? this.renderField(fieldset.field, isRoot ? level : level + 1, i)
            : this.renderFieldset(fieldset, level, i)
    })

    if (isRoot) {
      return <div>{renderedFields}</div>
    }

    return (
      <Fieldset level={level} legend={field.title} description={field.description}>
        {renderedFields}
      </Fieldset>
    )
  }
}
