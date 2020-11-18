import PropTypes from 'prop-types'
import React from 'react'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {setIfMissing} from 'part:@sanity/form-builder/patch-event'
import {FormBuilderInput} from 'part:@sanity/form-builder'

export default class CustomObjectInput extends React.PureComponent {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,
    level: PropTypes.number,
    value: PropTypes.shape({
      _type: PropTypes.string,
    }),
    focusPath: PropTypes.array.isRequired,
    onFocus: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
  }

  firstFieldInput = React.createRef()

  handleFieldChange = (field, fieldPatchEvent) => {
    const {onChange, type} = this.props
    // Whenever the field input emits a patch event, we need to make sure to each of the included patches
    // are prefixed with its field name, e.g. going from:
    // {path: [], set: <nextvalue>} to {path: [<fieldName>], set: <nextValue>}
    // and ensure this input's value exists
    onChange(fieldPatchEvent.prefixAll(field.name).prepend(setIfMissing({_type: type.name})))
  }

  focus() {
    this.firstFieldInput.current.focus()
  }

  render() {
    const {type, value, level, focusPath, onFocus, onBlur} = this.props
    return (
      <Fieldset level={level} legend={type.title} description={type.description}>
        This is my custom object input with fields
        <div style={{backgroundColor: 'lightblue'}}>
          {type.fields.map((field, i) => (
            // Delegate to the generic FormBuilderInput. It will resolve and insert the actual input component
            // for the given field type
            <FormBuilderInput
              level={level + 1}
              ref={i === 0 ? this.firstFieldInput : null}
              key={field.name}
              type={field.type}
              value={value && value[field.name]}
              onChange={(patchEvent) => this.handleFieldChange(field, patchEvent)}
              path={[field.name]}
              focusPath={focusPath}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          ))}
        </div>
      </Fieldset>
    )
  }
}
