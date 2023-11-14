import type {ArraySchemaType} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {useTranslation} from '../../../../i18n'
import React from 'react'

const CARD_STYLE = {borderStyle: 'dashed'} as const

/**
 * Shows a placeholder for an empty array of primitives.
 *
 * @internal
 */
export function NoItemsPlaceholder({schemaType}: {schemaType: ArraySchemaType}) {
  const {t} = useTranslation()
  return (
    <Card padding={3} border style={CARD_STYLE} radius={2}>
      <Text align="center" muted size={1}>
        {schemaType.placeholder || t('inputs.array.no-items-label')}
      </Text>
    </Card>
  )
}
