import type {ArraySchemaType} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import React from 'react'
import {useTranslation} from '../../../../i18n'

/**
 * Shows a placeholder for an empty array of primitives.
 *
 * @internal
 */
export function NoItemsPlaceholder({schemaType}: {schemaType: ArraySchemaType}) {
  const {t} = useTranslation()
  return (
    <Card padding={3} border radius={2}>
      <Text align="center" muted size={1}>
        {schemaType.placeholder || t('inputs.array.no-items-label')}
      </Text>
    </Card>
  )
}
