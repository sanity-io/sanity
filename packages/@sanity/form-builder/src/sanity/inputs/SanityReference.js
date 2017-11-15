
import React from 'react'
import {search, getPreviewSnapshot} from './client-adapters/reference'
import ReferenceInput from '../../inputs/Reference'

export default function SanityReference(props) {
  return <ReferenceInput {...props} onSearch={search} getPreviewSnapshot={getPreviewSnapshot} />
}
