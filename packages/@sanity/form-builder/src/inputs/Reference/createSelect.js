import React from 'react'
import ReferenceSelect from './select/ReferenceSelect'
import ValueContainer from './common/ValueContainer'

export default function createReferenceSelect({fetchAll, materializeReferences}) {

  ReferenceInput.propTypes = ReferenceSelect.propTypes
  ReferenceInput.valueContainer = ValueContainer

  return ReferenceInput

  function ReferenceInput(props) {
    return (
      <ReferenceSelect
        fetchAllFn={fetchAll}
        materializeReferences={materializeReferences}
        {...props}
      />
    )
  }
}
