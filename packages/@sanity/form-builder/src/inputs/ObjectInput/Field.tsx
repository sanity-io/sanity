import React from 'react'
import {FormBuilderInput} from '../../FormBuilderInput'
import InvalidValue from '../InvalidValueInput'
import {resolveTypeName} from '../../utils/resolveTypeName'
import {FormFieldSet} from '../../components/FormField'
import styles from './styles/Field.css'

type FieldProps = {
  field: any
  value?: any
  compareValue?: any
  onChange: (...args: any[]) => any
  onFocus: (...args: any[]) => any
  onBlur: (...args: any[]) => any
  focusPath?: any[]
  filterField?: (...args: any[]) => any
  readOnly?: boolean
  markers?: any[]
  level: number
  presence: any
}
// This component renders a single type in an object type. It emits onChange events telling the owner about the name of the type
// that changed. This gives the owner an opportunity to use the same event handler function for all of its fields
export default class Field extends React.PureComponent<FieldProps> {
  _input: any
  static defaultProps = {
    level: 0,
    focusPath: [],
  }
  handleChange = (event) => {
    const {field, onChange} = this.props
    if (!field.type.readOnly) {
      onChange(event, field)
    }
  }
  focus() {
    if (this._input && typeof this._input.focus === 'function') {
      this._input.focus()
    }
  }
  setInput = (input) => {
    this._input = input
  }
  render() {
    const {
      value,
      readOnly,
      field,
      level,
      onFocus,
      onBlur,
      markers,
      focusPath,
      filterField,
      compareValue,
      presence,
    } = this.props
    if (typeof value !== 'undefined') {
      const expectedType = field.type.name
      const actualType = resolveTypeName(value)
      // todo: we should consider removing this, and not allow aliasing native types
      // + ensure custom object types always gets annotated with _type
      const isCompatible = actualType === field.type.jsonType
      if (expectedType !== actualType && !isCompatible) {
        return (
          <div className={styles.root}>
            <FormFieldSet title={field.type.title} level={level} presence={presence}>
              <InvalidValue
                value={value}
                onChange={this.handleChange}
                validTypes={[field.type.name]}
                actualType={actualType}
                ref={this.setInput}
              />
            </FormFieldSet>
          </div>
        )
      }
    }
    return (
      <div className={styles.root}>
        <FormBuilderInput
          value={value}
          type={field.type}
          onChange={this.handleChange}
          path={[field.name]}
          onFocus={onFocus}
          onBlur={onBlur}
          readOnly={readOnly || field.type.readOnly}
          focusPath={focusPath}
          filterField={filterField}
          markers={markers}
          compareValue={compareValue}
          level={level}
          presence={presence}
          ref={this.setInput}
        />
      </div>
    )
  }
}
