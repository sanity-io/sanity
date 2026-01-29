import {type ArraySchemaType, type FormNodeValidation} from '@sanity/types'
import {Card, type CardTone, Text} from '@sanity/ui'

import {useTranslation} from '../../../../i18n'

/**
 * Shows a placeholder for an empty array of primitives.
 *
 * @internal
 */
export function NoItemsPlaceholder({
  schemaType,
  validation,
}: {
  schemaType: ArraySchemaType
  validation?: FormNodeValidation[]
}) {
  const {t} = useTranslation()

  const hasErrors = validation?.some((v) => v.level === 'error')
  const tone: CardTone | undefined = hasErrors ? 'critical' : undefined

  return (
    <Card padding={3} border radius={2} tone={tone}>
      <Text align="center" muted size={1}>
        {schemaType.placeholder || t('inputs.array.no-items-label')}
      </Text>
    </Card>
  )
}
