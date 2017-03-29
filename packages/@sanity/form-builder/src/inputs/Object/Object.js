//@flow weak
import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import RenderField from './RenderField'
import ObjectContainer from './ObjectContainer'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import PatchEvent, {setIfMissing} from '../../PatchEvent'

export default class ObjectInput extends React.PureComponent {
  static displayName = 'Object'

  static valueContainer = ObjectContainer;

  static propTypes = {
    type: FormBuilderPropTypes.type,
    validation: PropTypes.shape(FormBuilderPropTypes.validation),
    value: PropTypes.object,
    hasFocus: PropTypes.bool,
    onChange: PropTypes.func,
    onEnter: PropTypes.func,
    level: PropTypes.number
  };

  static defaultProps = {
    onChange() {},
    onEnter() {},
    level: 0
  };

  handleFieldChange = (event : PatchEvent, field) => {
    const {onChange, type} = this.props

    onChange(
      event
        .prefixAll(field.name)
        .prepend(setIfMissing(type.name === 'object' ? {} : {_type: type.name}))
    )
  }

  handleFieldEnter = (event, field) => {
    this.props.onEnter(field)
  }

  renderField(field, level, index) {
    const {value, hasFocus, validation} = this.props
    const fieldValidation = validation && validation.fields[field.name]

    const fieldValue = value && value.getAttribute(field.name)

    return (
      <RenderField
        key={field.name}
        hasFocus={hasFocus && index === 0}
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
    const {type, level} = this.props

    const isRoot = level === 0

    const renderedFields = type.fieldsets.map((fieldset, i) => {
      return fieldset.single
            ? this.renderField(fieldset.field, isRoot ? level : level + 1, i)
            : this.renderFieldset(fieldset, level, i)
    })

    if (isRoot) {
      return <div>{renderedFields}</div>
    }

    const columns = type.options && type.options.columns
    const collapsable = type.options && type.options.collapsable

    return (
      <Fieldset
        level={level}
        legend={type.title}
        description={type.description}
        columns={columns}
        collapsable={collapsable}
      >
        {renderedFields}
      </Fieldset>
    )
  }
}
