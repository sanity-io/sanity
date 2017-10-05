import React from 'react'
import resolveUploader from '../uploads/resolveUploader'
import ArrayInput from '../../inputs/Array'

export default function SanityArray(props) {
  return <ArrayInput {...props} resolveUploader={resolveUploader} />
}
