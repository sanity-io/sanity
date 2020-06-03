import React from 'react'
import Field from './Field'
import {Presence, Marker} from '../../typedefs'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import PatchEvent, {set, setIfMissing, unset} from '../../PatchEvent'
import isEmpty from '../../utils/isEmpty'
import UnknownFields from './UnknownFields'
import fieldStyles from './styles/Field.css'

import styles from './styles/ObjectInput.css'

function getCollapsedWithDefaults(options: Record<string, any> = {}, level) {
  // todo: warn on "collapsable" and deprecate collapsible in favor of just "collapsed"
  //       --> relevant: https://github.com/sanity-io/sanity/issues/537
  if (options.collapsible === true || options.collapsable === true) {
    // collapsible explicit set to true
    return {
      collapsible: true,
      collapsed: options.collapsed !== false
    }
  } else if (options.collapsible === false || options.collapsable === false) {
    // collapsible explicit set to false
    return {
      // hard limit to avoid infinite recursion
      collapsible: level > 9,
      collapsed: level > 9
    }
  }
  // default
  return {
    collapsible: level > 2,
    collapsed: level > 2
  }
}
type ObjectInputProps = {
  type?: any
  value?: {[key: string]: any}
  onChange?: (...args: any[]) => any
  onFocus: (...args: any[]) => any
  focusPath?: any[]
  markers?: Marker[]
  onBlur: (...args: any[]) => any
  level?: number
  readOnly?: boolean
  isRoot?: boolean
  filterField?: (...args: any[]) => any
  presence: Presence[]
}
export default class ObjectInput extends React.PureComponent<ObjectInputProps, {}> {
  _firstField: any
  static defaultProps = {
    onChange() {},
    level: 0,
    focusPath: [],
    isRoot: false,
    filterField: () => true
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
      filterField,
      presence
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
    const {level, focusPath, presence, onFocus} = this.props
    const columns = fieldset.options && fieldset.options.columns
    const collapsibleOpts = getCollapsedWithDefaults(fieldset.options, level)
    const isExpanded =
      focusPath.length > 0 && fieldset.fields.some(field => focusPath[0] === field.name)
    const fieldNames = fieldset.fields.map(f => f.name)
    const childPresence = presence.filter(
      item => fieldNames.includes(item.path[0]) || item.path[0] === '$'
    )
    const isCollapsed = !isExpanded && collapsibleOpts.collapsed
    return (
      <div key={fieldset.name} className={fieldStyles.root}>
        <Fieldset
          legend={fieldset.title}
          description={fieldset.description}
          level={level + 1}
          columns={columns}
          isCollapsible={collapsibleOpts.collapsible}
          isCollapsed={isCollapsed}
          presence={isCollapsed ? childPresence : []}
          onFocus={onFocus}
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
    const {value, type, onChange, readOnly} = this.props
    if (!type.fields) {
      return null
    }
    const knownFieldNames = type.fields.map(field => field.name)
    const unknownFields = Object.keys(value || {}).filter(
      key => !key.startsWith('_') && !knownFieldNames.includes(key)
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
  setFirstField = el => {
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
        <Fieldset
          level={level}
          legend={type.title}
          description={type.description}
          columns={columns}
          isCollapsible={collapsibleOpts.collapsible}
          isCollapsed={isCollapsed}
          markers={markers}
          presence={presence.filter(item => item.path[0] === '$' || item.path.length === 0)}
          onFocus={onFocus}
          // focusPath={focusPath}
        >
          {renderedFields}
          {renderedUnknownFields}
        </Fieldset>
      </div>
    )
  }
}
