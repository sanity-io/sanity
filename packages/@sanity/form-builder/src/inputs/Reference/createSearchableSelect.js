import React from 'react'
import ReferenceSearchableSelect from './searchableSelect/ReferenceSearchableSelect'

export default function createSearchableSelect({valueToString, searchFn}) {

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
