import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import PropTypes from 'prop-types'
import React from 'react'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {FormBuilderInput} from '../../FormBuilderInput'
import InvalidValue from '../InvalidValueInput'
import {resolveTypeName} from '../../utils/resolveTypeName'
import styles from './styles/Field.css'

// This component renders a single type in an object type. It emits onChange events telling the owner about the name of the type
// that changed. This gives the owner an opportunity to use the same event handler function for all of its fields
export default class Field extends React.Component {
  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    focusPath: PropTypes.array,
    readOnly: PropTypes.bool,
    markers: PropTypes.array,
    level: PropTypes.number
  }

  static defaultProps = {
    level: 0,
    focusPath: []
  }

  handleChange = event => {
    const {field, onChange} = this.props
    if (!field.type.readOnly) {
      onChange(event, field)
    }
  }

  focus() {
    this._input.focus()
  }

  setInput = input => {
    this._input = input
  }

  render() {
    const {value, readOnly, field, level, onFocus, onBlur, markers, focusPath} = this.props

    if (typeof value !== 'undefined') {
      const expectedType = field.type.name
      const actualType = resolveTypeName(value)

      // todo: we should consider removing this, and not allow aliasing native types
      // + ensure custom object types always gets annotated with _type
      const isCompatible = actualType === field.type.jsonType

      if (expectedType !== actualType && !isCompatible) {
        return (
          <div className={styles.root}>
            <Fieldset legend={field.type.title} level={level}>
              <InvalidValue
                value={value}
                onChange={this.handleChange}
                validTypes={[field.type.name]}
                actualType={actualType}
                ref={this.setInput}
              />
            </Fieldset>
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
          markers={markers}
          level={level}
          ref={this.setInput}
        />
      </div>
    )
  }
}
