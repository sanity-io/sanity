import React from 'react'
import ReferenceAutocomplete from './autocomplete/ReferenceAutocomplete'
import ValueContainer from './common/ValueContainer'

export default function createReferenceInput({search, materializeReferences}) {

  ReferenceInput.propTypes = ReferenceAutocomplete.propTypes
  ReferenceInput.valueContainer = ValueContainer

  return ReferenceInput

  function ReferenceInput(props) {
    return (
      <ReferenceAutocomplete
        searchFn={search}
        materializeReferences={materializeReferences}
        {...props}
      />
    )
  }
}
