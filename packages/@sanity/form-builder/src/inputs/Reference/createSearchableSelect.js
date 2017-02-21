import React from 'react'
import ReferenceSearchableSelect from './searchableSelect/ReferenceSearchableSelect'
import ValueContainer from './common/ValueContainer'

export default function createSearchableSelect({valueToString, searchFn}) {

  // ReferenceInput.propTypes = ReferenceAutocomplete.propTypes
  ReferenceInput.valueContainer = ValueContainer

  return ReferenceInput

  function ReferenceInput(props) {
    return (
      <ReferenceSearchableSelect
        valueToString={valueToString}
        searchFn={searchFn}
        {...props}
      />
    )
  }
}
