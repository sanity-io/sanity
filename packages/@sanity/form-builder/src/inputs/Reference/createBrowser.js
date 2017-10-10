import React from 'react'
import ReferenceBrowser from './browser/ReferenceBrowser'
import FormField from 'part:@sanity/components/formfields/default'

type Props = {
  type: any,
  level: number

}
export default function createReferenceBrowser({searchFn, fetchValueFn}) {
  return ReferenceInput

  function ReferenceInput(props: Props) {
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
