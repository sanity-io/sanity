import React from 'react'
import ReferenceAutocomplete from './autocomplete/ReferenceAutocomplete'
import ValueContainer from './common/ValueContainer'
import FormField from 'component:@sanity/components/formfields/default'

export default function createReferenceInput({search, materializeReferences}) {

  ReferenceInput.propTypes = ReferenceAutocomplete.propTypes
  ReferenceInput.valueContainer = ValueContainer

  return ReferenceInput

  function ReferenceInput(props) {
    return (
      <FormField label="ReferenceAutocomplete">
        <ReferenceAutocomplete
          searchFn={search}
          materializeReferences={materializeReferences}
          {...props}
        />
      </FormField>
    )
  }
}
