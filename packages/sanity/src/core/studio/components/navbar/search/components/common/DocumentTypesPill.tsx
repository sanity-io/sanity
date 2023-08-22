import {Card, Text} from '@sanity/ui'
import React, {useMemo} from 'react'
import type {SearchableType} from '../../../../../../search'
import {documentTypesTruncated} from '../../utils/documentTypesTruncated'
import {useTranslation} from '../../../../../../i18n'

interface TypePillsProps {
  availableCharacters?: number
  types: SearchableType[]
}

export function DocumentTypesPill({availableCharacters, types}: TypePillsProps) {
  const {t} = useTranslation()
  const title = useMemo(
    () => documentTypesTruncated({availableCharacters, types, t}),
    [availableCharacters, types, t],
  )

  return (
    <Card border padding={2} radius={2}>
      <Text muted size={1}>
        {title}
      </Text>
    </Card>
  )
}
