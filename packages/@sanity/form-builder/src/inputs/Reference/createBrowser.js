import React from 'react'
import ReferenceBrowser from './browser/ReferenceBrowser'
import ValueContainer from './common/ValueContainer'
import FormField from 'part:@sanity/components/formfields/default'

export default function createReferenceBrowser({searchFn, fetchValueFn}) {

  ReferenceInput.propTypes = ReferenceBrowser.propTypes
  ReferenceInput.valueContainer = ValueContainer

  return ReferenceInput

  function ReferenceInput(props) {
    const {type, level, ...rest} = props
    return (
      <FormField label={type.title} description={type.description} level={level}>
        <ReferenceBrowser
          fetchValueFn={fetchValueFn}
          searchFn={searchFn}
          type={type}
          {...rest}
        />
      </FormField>
    )
  }
}
