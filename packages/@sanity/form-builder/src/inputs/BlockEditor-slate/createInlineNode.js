import React from 'react'
import FormBuilderInline from './FormBuilderInline'

export default function createInlineNode(type, onPatch) {
  return function InlineNode(props) {
    return <FormBuilderInline type={type} {...props} onPatch={onPatch} />
  }
}
