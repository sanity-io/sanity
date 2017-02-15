import React from 'react'
import FormBuilderBlock from './FormBuilderBlock'

export default function createBlockNode(type) {
  return function BlockNode(props) {
    return <FormBuilderBlock type={type} {...props} />
  }
}
