import React from 'react'
import {FormFieldSet} from '@sanity/base/components'
import {Marker, ObjectSchemaTypeWithOptions, Path} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import isEmpty from '../../utils/isEmpty'
import Field from './Field'
import UnknownFields from './UnknownFields'
import fieldStyles from './styles/Field.css'

import styles from './styles/ObjectInput.css'

function getCollapsedWithDefaults(
  options: ObjectSchemaTypeWithOptions['options'] = {},
  level: number
) {
  // todo: warn on "collapsable" and deprecate collapsible in favor of just "collapsed"
  //       --> relevant: https://github.com/sanity-io/sanity/issues/537
  if (options.collapsible === true || options.collapsable === true) {
    // collapsible explicit set to true
    return {
      collapsible: true,
      collapsed: options.collapsed !== false,
    }
  } else if (options.collapsible === false || options.collapsable === false) {
    // collapsible explicit set to false
    return {
      // hard limit to avoid infinite recursion
      collapsible: level > 9,
      collapsed: level > 9,
    }
  }
  // default
  return {
    collapsible: level > 2,
    collapsed: level > 2,
  }
}

type ObjectInputProps = {
  type: ObjectSchemaTypeWithOptions
  value?: Record<string, unknown>
  compareValue?: Record<string, unknown>
  onChange?: (...args: any[]) => any
  onFocus: (...args: any[]) => any
  onBlur: (...args: any[]) => any
  focusPath?: Path
  markers?: Marker[]
  level?: number
  readOnly?: boolean
  isRoot?: boolean
  filterField?: (...args: any[]) => any
  presence: FormFieldPresence[]
}

export default class ObjectInput extends React.PureComponent<ObjectInputProps> {
  _firstField: any
  static defaultProps = {
    onChange: () => undefined,
    level: 0,
    focusPath: [],
    isRoot: false,
    filterField: () => true,
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
        // eslint-disable-next-line max-depth
        if (valueTypeName && schemaTypeName === 'object') {
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

  renderField(field, level, index) {
    const {
      type,
      value,
      markers,
      readOnly,
      focusPath,
      onFocus,
      onBlur,
      compareValue,
      filterField,
      presence,
    } = this.props

    if (!filterField(type, field) || field.type.hidden) {
      return null
    }

    const fieldValue = value && value[field.name]
    return (
      <Field
        key={field.name}
        field={field}
        value={fieldValue}
        onChange={this.handleFieldChange}
        onFocus={onFocus}
        onBlur={onBlur}
        compareValue={compareValue}
        markers={markers}
        focusPath={focusPath}
        level={level}
        presence={presence}
        readOnly={readOnly}
        filterField={filterField}
        ref={index === 0 && this.setFirstField}
      />
    )
  }

  renderFieldset(fieldset, fieldsetIndex) {
    const {level, focusPath, presence, onFocus, markers} = this.props
    const columns = fieldset.options && fieldset.options.columns
    const collapsibleOpts = getCollapsedWithDefaults(fieldset.options, level)
    const isExpanded =
      focusPath.length > 0 && fieldset.fields.some((field) => focusPath[0] === field.name)
    const fieldNames = fieldset.fields.map((f) => f.name)
    const childPresence = presence.filter(
      (item) => fieldNames.includes(item.path[0]) || item.path[0] === '$'
    )
    const isCollapsed = !isExpanded && collapsibleOpts.collapsed
    return (
      <div key={fieldset.name} className={fieldStyles.root}>
        <FormFieldSet
          title={fieldset.title}
          description={fieldset.description}
          level={level + 1}
          columns={columns}
          collapsible={collapsibleOpts.collapsible}
          collapsed={isCollapsed}
          presence={childPresence}
          onFocus={onFocus}
          changeIndicator={false}
          markers={markers}
          tabIndex={0}
        >
          {fieldset.fields.map((field, fieldIndex) => {
            return this.renderField(field, level + 2, fieldsetIndex + fieldIndex)
          })}
        </FormFieldSet>
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
    const {value, type, onChange, readOnly} = this.props
    if (!type.fields) {
      return null
    }

    const knownFieldNames = type.fields.map((field) => field.name)
    const unknownFields = Object.keys(value || {}).filter(
      (key) => !key.startsWith('_') && !knownFieldNames.includes(key)
    )

    if (unknownFields.length === 0) {
      return null
    }

    return (
      <UnknownFields
        readOnly={readOnly}
        fieldNames={unknownFields}
        value={value}
        onChange={onChange}
      />
    )
  }

  setFirstField = (el) => {
    this._firstField = el
  }

  focus() {
    if (this._firstField) {
      this._firstField.focus()
    }
  }

  render() {
    const {type, level, focusPath, onFocus, presence, markers} = this.props
    const renderedFields = this.getRenderedFields()
    const renderedUnknownFields = this.renderUnknownFields()

    if (level === 0) {
      return (
        <div className={styles.root}>
          <div className={styles.fieldWrapper}>
            {renderedFields}
            {renderedUnknownFields}
          </div>
        </div>
      )
    }

    const collapsibleOpts = getCollapsedWithDefaults(type.options, level)
    const isExpanded = focusPath.length > 0
    const columns = type.options && type.options.columns
    const isCollapsed = !isExpanded && collapsibleOpts.collapsed
    return (
      <div className={styles.root}>
        <FormFieldSet
          level={level}
          title={type.title}
          description={type.description}
          columns={columns}
          collapsible={collapsibleOpts.collapsible}
          collapsed={isCollapsed}
          presence={presence}
          onFocus={onFocus}
          changeIndicator={false}
          markers={markers}
          tabIndex={0}
        >
          {renderedFields}
          {renderedUnknownFields}
        </FormFieldSet>
      </div>
    )
  }
}
