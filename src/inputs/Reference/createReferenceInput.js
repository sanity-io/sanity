import React from 'react'
import Reference from './Reference'
import ValueContainer from './ValueContainer'

export default function createReferenceInput({search, materializeReferences}) {

  ReferenceInput.propTypes = Reference.propTypes
  ReferenceInput.valueContainer = ValueContainer

  return ReferenceInput

  function ReferenceInput(props) {
    return (
      <Reference
        searchFn={search}
        materializeReferences={materializeReferences}
        {...props}
      />
    )
  }
}
