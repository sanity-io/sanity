import PropTypes from 'prop-types'
//@flow weak
import React from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import Field from './Field'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import isEmpty from '../../utils/isEmpty'
import UnknownFields from './UnknownFields'
import fieldStyles from './styles/Field.css'

export default class ObjectInput extends React.PureComponent {

  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func.isRequired,
    focusPath: PropTypes.array,
    onBlur: PropTypes.func.isRequired,
    level: PropTypes.number,
    isRoot: PropTypes.bool,
    autoFocus: PropTypes.bool
  }

  static defaultProps = {
    onChange() {},
    level: 0,
    isRoot: false
  }

  handleBlur() {
    const {onChange, value} = this.props
    if (isEmpty(value)) {
      onChange(PatchEvent.from(unset()))
    }
  }

  handleFieldChange = (fieldEvent: PatchEvent, field) => {
    const {onChange, type, value, isRoot} = this.props

    let event = fieldEvent.prefixAll(field.name)

    if (!isRoot) {
      event = event.prepend(setIfMissing(type.name === 'object' ? {} : {_type: type.name}))
      if (value) {
        const valueTypeName = value && value._type
        const schemaTypeName = type.name

        if (valueTypeName && schemaTypeName === 'object') { // eslint-disable-line max-depth
          // The value has a _type key, but the type name from schema is 'object',
          // but _type: 'object' is implicit so we should fix it by removing it
          event = event.prepend(unset(['_type']))
        } else if (schemaTypeName !== 'object' && valueTypeName !== schemaTypeName) {
          // There's a mismatch between schema type and the value _type
          // fix it by setting _type to type name defined in schema
          event = event.prepend(set(schemaTypeName, ['_type']))
        }

      }
    }
    onChange(event)
  }

  handleFieldFocus = (path, field) => {
    this.props.onFocus([field.name, ...path])
  }

  handleFieldBlur = (path, field) => {
    this.props.onBlur()
  }

  renderField(field, level, index) {
    if (field.type.hidden) {
      return null
    }

    const {value, focusPath} = this.props
    const fieldValue = value && value[field.name]
    const fieldFocusPath = focusPath[0] === field.name ? focusPath.slice(1) : []

    return (
      <Field
        key={field.name}
        field={field}
        value={fieldValue}
        onChange={this.handleFieldChange}
        onFocus={this.handleFieldFocus}
        focusPath={fieldFocusPath}
        onBlur={this.handleFieldBlur}
        level={level}
      />
    )
  }

  renderFieldset(fieldset, fieldsetIndex) {
    const {level, focusPath} = this.props
    const columns = fieldset.options && fieldset.options.columns
    const collapsable = fieldset.options && fieldset.options.collapsable
    const hasFocus = focusPath.length > 0 && fieldset.fields.some(field => (
      focusPath[0] === field.name
    ))
    return (
      <div key={fieldset.name} className={fieldStyles.root}>
        <Fieldset
          legend={fieldset.title}
          description={fieldset.description}
          level={level + 1}
          columns={columns}
          isExpanded={collapsable === false || hasFocus}
        >
          {fieldset.fields.map((field, fieldIndex) => {
            return this.renderField(field, level + 2, fieldsetIndex + fieldIndex)
          })}
        </Fieldset>
      </div>

    )
  }

  getRenderedFields() {
    const {type, level} = this.props

    if (!type.fieldsets) {
      // this is a fallback for schema types that are not parsed to be objects, but still has jsonType == 'object'
      return (type.fields || []).map((field, i) => this.renderField(field, level + 1, i))
    }

    return type.fieldsets.map((fieldset, i) => {
      return fieldset.single
        ? this.renderField(fieldset.field, level + 1, i)
        : this.renderFieldset(fieldset, i)
    })

  }

  renderUnknownFields() {
    const {value, type, onChange} = this.props
    if (!type.fields) {
      return null
    }

    const knownFieldNames = type.fields.map(field => field.name)
    const unknownFields = Object.keys(value || {})
      .filter(key => !key.startsWith('_') && !knownFieldNames.includes(key))

    if (unknownFields.length === 0) {
      return null
    }

    return (
      <UnknownFields
        fieldNames={unknownFields}
        value={value}
        onChange={onChange}
      />
    )
  }

  setFieldset = el => {
    this.fieldset = el
  }

  focus() {
    this.fieldset.focus()
  }

  render() {
    const {type, level} = this.props

    const renderedFields = this.getRenderedFields()
    const renderedUnknownFields = this.renderUnknownFields()

    if (level === 0) {
      return (
        <div>
          {renderedFields}
          {renderedUnknownFields}
        </div>
      )
    }

    const columns = type.options && type.options.columns
    const collapsable = type.options && type.options.collapsable

    return (
      <Fieldset
        tabIndex={0}
        ref={this.setFieldset}
        level={level}
        legend={type.title}
        description={type.description}
        columns={columns}
        collapsable={collapsable}
      >
        {renderedFields}
        {renderedUnknownFields}
      </Fieldset>
    )
  }
}
