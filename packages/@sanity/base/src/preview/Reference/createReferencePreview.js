import React from 'react'
import ReferencePreview from './ReferencePreview'

export default function createReferencePreview(materializeReference) {
  return function CustomReferencePreview(props) {
    return <ReferencePreview materializeReference={materializeReference} {...props} />
  }
}
