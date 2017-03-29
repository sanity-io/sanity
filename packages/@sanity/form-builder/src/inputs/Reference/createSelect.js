import React from 'react'
import ReferenceSelect from './select/ReferenceSelect'
import ValueContainer from './common/ValueContainer'

export default function createReferenceSelect({fetchAllFn, fetchValueFn}) {

  ReferenceInput.propTypes = ReferenceSelect.propTypes // eslint-disable-line react/forbid-foreign-prop-types
  ReferenceInput.valueContainer = ValueContainer

  return ReferenceInput

  function ReferenceInput(props) {
    return (
      <ReferenceSelect
        fetchAllFn={fetchAllFn}
        fetchValueFn={fetchValueFn}
        {...props}
      />
    )
  }
}
