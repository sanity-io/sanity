import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import PropTypes from 'prop-types'
import React from 'react'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {FormBuilderInput} from '../../FormBuilderInput'
import InvalidValue from '../InvalidValue'
import MemberValue from '../../Member'

import styles from './styles/Field.css'
import {resolveTypeName} from '../../utils/resolveTypeName'

// This component renders a single type in an object type. It emits onChange events telling the owner about the name of the type
// that changed. This gives the owner an opportunity to use the same event handler function for all of its fields
export default class Field extends React.Component {

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func,
    level: PropTypes.number,
    autoFocus: PropTypes.bool
  };

  handleChange = event => {
    const {field, onChange} = this.props
    if (!field.type.readOnly) {
      onChange(event, field)
    }
  }

  render() {
    const {value, field, level, autoFocus} = this.props

    if (typeof value !== 'undefined') {
      const expectedType = field.type.name
      const actualType = resolveTypeName(value)

      // todo: we should consider removing this, and not allow aliasing native types
      // + ensure custom object types always gets annotated with _type
      const isCompatible = actualType === field.type.jsonType

      if (expectedType !== actualType && !isCompatible) {
        return (
          <Fieldset legend={field.type.title} level={level}>
            <InvalidValue
              value={value}
              onChange={this.handleChange}
              validTypes={[field.type.name]}
              actualType={actualType}
            />
          </Fieldset>
        )
      }
    }

    return (
      <div className={styles.root}>
        <MemberValue path={field.name}>
          <FormBuilderInput
            value={value}
            type={field.type}
            onChange={this.handleChange}
            level={level}
            autoFocus={autoFocus}
          />
        </MemberValue>
      </div>
    )
  }
}
