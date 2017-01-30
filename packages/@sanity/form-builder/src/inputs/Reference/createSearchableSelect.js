import React from 'react'
import ReferenceSearchableSelect from './searchableSelect/ReferenceSearchableSelect'
import ValueContainer from './common/ValueContainer'

export default function createSearchableSelect({select, search}) {

  // ReferenceInput.propTypes = ReferenceAutocomplete.propTypes
  ReferenceInput.valueContainer = ValueContainer

  return ReferenceInput

  function ReferenceInput(props) {
    return (
      <ReferenceSearchableSelect
        searchFn={search}
        selectFn={select}
        {...props}
      />
    )
  }
}
