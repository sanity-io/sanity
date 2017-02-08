import React from 'react'
import FormBuilderNode from './FormBuilderNode'

export default function createFormBuilderPreviewNode(ofType) {
  return function WrappedFormBuilderNode(props) {
    return <FormBuilderNode type={ofType} {...props} />
  }
}
