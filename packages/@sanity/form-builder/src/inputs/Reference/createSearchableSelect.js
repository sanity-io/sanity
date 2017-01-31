import React from 'react'
import ReferenceSearchableSelect from './searchableSelect/ReferenceSearchableSelect'
import ValueContainer from './common/ValueContainer'

export default function createSearchableSelect({_tempResolveRefType, select, search}) {

  // ReferenceInput.propTypes = ReferenceAutocomplete.propTypes
  ReferenceInput.valueContainer = ValueContainer

  return ReferenceInput

  function ReferenceInput(props) {
    return (
      <ReferenceSearchableSelect
        _tempResolveRefType={_tempResolveRefType}
        searchFn={search}
        selectFn={select}
        {...props}
      />
    )
  }
}
