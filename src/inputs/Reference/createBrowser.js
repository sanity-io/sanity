import React from 'react'
import ReferenceBrowser from './browser/ReferenceBrowser'
import ValueContainer from './common/ValueContainer'

export default function createReferenceInput({fetch, materializeReferences}) {

  ReferenceInput.propTypes = ReferenceBrowser.propTypes
  ReferenceInput.valueContainer = ValueContainer

  return ReferenceInput

  function ReferenceInput(props) {
    return (
      <ReferenceBrowser
        fetchFn={fetch}
        materializeReferences={materializeReferences}
        {...props}
      />
    )
  }
}
