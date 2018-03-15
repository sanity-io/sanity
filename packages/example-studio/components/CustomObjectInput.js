import PropTypes from 'prop-types'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import {setIfMissing} from 'part:@sanity/form-builder/patch-event'
import {FormBuilderInput} from 'part:@sanity/form-builder'

export default class CustomObjectInput extends React.PureComponent {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string,
      name: PropTypes.string
    }).isRequired,
    level: PropTypes.number,
    value: PropTypes.shape({
      _type: PropTypes.string
    }),
    onChange: PropTypes.func.isRequired
  }

  handleFieldChange = (field, fieldPatchEvent) => {
    const {onChange, type} = this.props
    onChange(fieldPatchEvent.prefixAll(field.name).prepend(setIfMissing({_type: type.name})))
  }

  render() {
    const {type, value, level} = this.props
    return (
      <FormField label={type.title} level={level} description={type.description}>
        This is my custom object input with fields
        <fieldset style={{backgroundColor: 'lightblue'}}>
          {type.fields.map(field => (
            // Delegate to the generic FormBuilderInput. It will resolve and insert the actual input component
            // for the given field type
            <FormBuilderInput
              key={field.name}
              type={field.type}
              value={value && value[field.name]}
              onChange={patchEvent => this.handleFieldChange(field, patchEvent)}
            />
          ))}
        </fieldset>
      </FormField>
    )
  }
}
