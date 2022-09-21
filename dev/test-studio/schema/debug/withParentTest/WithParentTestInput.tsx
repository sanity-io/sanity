import {FormField} from '@sanity/base/components'
import {TextArea} from '@sanity/ui'
import {withParent} from 'part:@sanity/form-builder'
import React, {forwardRef} from 'react'

const TestInput = forwardRef(function TestInput(props: any, ref: any) {
  const {parent} = props

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
        value={JSON.stringify(parent, null, 2)}
      />
    </FormField>
  )
})

export const WithParentTestInput = withParent(TestInput)
