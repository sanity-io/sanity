import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import RenderField from './RenderField'
import ObjectContainer from './ObjectContainer'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import arrify from 'arrify'

export default class Obj extends React.PureComponent {
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
    formBuilder: PropTypes.object
  };

  handleFieldChange = (event, fieldName) => {
    const {onChange} = this.props

    const patches = arrify(event.patch).map(patch => {
      return {
        ...patch,
        path: [fieldName, ...(patch.path || [])]
      }
    })
    onChange({patch: patches})
  }

  handleFieldEnter = (event, fieldName) => {
    this.props.onEnter(fieldName)
  }

  renderField(field, level, index) {
    const {value, focus, validation} = this.props
    const fieldValidation = validation && validation.fields[field.name]

    const fieldValue = value.getAttribute(field.name)

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
    const collapsable = fieldset.options && fieldset.options.collapsable
    return (
      <Fieldset
        key={fieldset.name}
        legend={fieldset.title}
        description={fieldset.description}
        level={level}
        columns={columns}
        collapsable={collapsable}
      >
        {fieldset.fields.map((field, fieldIndex) => {
          return this.renderField(field, level + 1, index + fieldIndex)
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

    const columns = field.options && field.options.columns
    const collapsable = field.options && field.options.collapsable

    return (
      <Fieldset
        level={level}
        legend={field.title}
        description={field.description}
        columns={columns}
        collapsable={collapsable}
      >
        {renderedFields}
      </Fieldset>
    )
  }
}
