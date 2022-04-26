import {TextArea} from '@sanity/ui'
import {withDocument} from '@sanity/base/form'
import React, {forwardRef} from 'react'

const TestInput = forwardRef(function TestInput(props: any, ref: any) {
  const {document: documentValue} = props

  return (
    <TextArea
      onBlur={props.onBlur}
      onFocus={props.onFocus}
      ref={ref}
      rows={10}
      value={JSON.stringify(documentValue, null, 2)}
    />
  )
})

export const WithDocumentTestInput = withDocument(TestInput)
