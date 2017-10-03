import React from 'react'
import resolveImporter from '../import/resolveImporter'
import ArrayInput from '../../inputs/Array'

export default function SanityArray(props) {
  return <ArrayInput {...props} resolveImporter={resolveImporter} />
}
