import React from 'react'
import FormBuilderSpan from './FormBuilderSpan'

export default function createSpanNode(type) {
  return function SpanNode(props) {
    return <FormBuilderSpan type={type} {...props} />
  }
}
