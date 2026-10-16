import {type SchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {useMemo} from 'react'
import {Text} from 'ui5'

import {useTranslation} from '../../../../../../i18n/hooks/useTranslation'
import {documentTypesTruncated} from '../../utils/documentTypesTruncated'

interface TypePillsProps {
  availableCharacters?: number
  types: SchemaType[]
}

export function DocumentTypesPill({availableCharacters, types}: TypePillsProps) {
  const {t} = useTranslation()
  const title = useMemo(
    () => documentTypesTruncated({availableCharacters, types, t}),
    [availableCharacters, types, t],
  )

  return (
    <Card border padding={2} radius={2}>
      <Text muted size={1} as="div" trim={true}>
        {title}
      </Text>
    </Card>
  )
}
