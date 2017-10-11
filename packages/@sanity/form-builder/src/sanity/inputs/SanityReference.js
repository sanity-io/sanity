
import React from 'react'
import {search, valueToString} from './client-adapters/reference'
import ReferenceInput from '../../inputs/Reference'

export default function SanityReference(props) {
  return <ReferenceInput {...props} onSearch={search} valueToString={valueToString} />
}
