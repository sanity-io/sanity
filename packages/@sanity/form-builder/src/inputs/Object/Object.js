import PropTypes from 'prop-types'
//@flow weak
import React from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import Field from './Field'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import PatchEvent, {unset, setIfMissing} from '../../PatchEvent'
import isEmpty from '../../utils/isEmpty'
import UnknownFields from './UnknownFields'
import fieldStyles from './styles/Field.css'

export default class ObjectInput extends React.PureComponent {

  static propTypes = {
    type: FormBuilderPropTypes.type,
    validation: PropTypes.shape(FormBuilderPropTypes.validation),
    value: PropTypes.object,
    onChange: PropTypes.func,
    level: PropTypes.number,
    isRoot: PropTypes.bool
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
    const {onChange, type, isRoot} = this.props

    let event = fieldEvent.prefixAll(field.name)

    if (!isRoot) {
      event = event.prepend(setIfMissing(type.name === 'object' ? {} : {_type: type.name}))
    }
    onChange(event)
  }

  renderField(field, level, index) {
    const {value, validation, autoFocus} = this.props
    const fieldValidation = validation && validation.fields[field.name]

    const fieldValue = value && value[field.name]

    return (
      <Field
        key={field.name}
        field={field}
        value={fieldValue}
        onChange={this.handleFieldChange}
        validation={fieldValidation}
        level={level}
        autoFocus={autoFocus && index === 0}
      />
    )
  }

  renderFieldset(fieldset, fieldsetIndex) {
    const {level} = this.props
    const columns = fieldset.options && fieldset.options.columns
    const collapsable = fieldset.options && fieldset.options.collapsable
    return (
      <div className={fieldStyles.root}>
        <Fieldset
          key={fieldset.name}
          legend={fieldset.title}
          description={fieldset.description}
          level={level + 1}
          columns={columns}
          collapsable={collapsable}
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
