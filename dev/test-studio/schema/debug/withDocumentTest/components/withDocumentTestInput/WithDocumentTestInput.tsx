import {FormField} from '@sanity/base/components'
import {TextArea} from '@sanity/ui'
import {withDocument} from 'part:@sanity/form-builder'
import React, {forwardRef} from 'react'

const TestInput = forwardRef(function TestInput(props: any, ref: any) {
  const {document: documentValue} = props

  return (
    <FormField
      __unstable_markers={props.markers}
      __unstable_presence={props.presence}
      description={props.type.description}
      title={props.type.title}
    >
      <TextArea
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        ref={ref}
        rows={10}
        value={JSON.stringify(documentValue, null, 2)}
      />
    </FormField>
  )
})

export const WithDocumentTestInput = withDocument(TestInput)
