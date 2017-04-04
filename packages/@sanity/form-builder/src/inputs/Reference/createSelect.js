import React from 'react'
import ReferenceSelect from './select/ReferenceSelect'

export default function createReferenceSelect({fetchAllFn, fetchValueFn}) {

  ReferenceInput.propTypes = ReferenceSelect.propTypes // eslint-disable-line react/forbid-foreign-prop-types

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
