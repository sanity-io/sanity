import {Card} from '@sanity/ui'
import React from 'react'
import type {SearchableType} from '../../../../../search'
import {DocumentTypesTruncated} from './DocumentTypesTruncated'

interface TypePillsProps {
  availableCharacters?: number
  types: SearchableType[]
}

export function DocumentTypesPill({availableCharacters, types}: TypePillsProps) {
  return (
    <Card border padding={2} radius={2}>
      <DocumentTypesTruncated availableCharacters={availableCharacters} types={types} />
    </Card>
  )
}
