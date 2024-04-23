import {Card, Flex, Stack, Text} from '@sanity/ui'

import {useValidationStatus} from '../../../../hooks/useValidationStatus'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {Translate} from '../../../../i18n/Translate'
import {ValidationInfo} from '../../../components/validation/ValidationInfo'
import {usePublishedId} from '../../../hooks/usePublishedId'
import {useSchemaType} from '../../../hooks/useSchemaType'
import {scheduledPublishingNamespace} from '../../../i18n'
import {useValidationState} from '../../../utils/validationUtils'

interface Props {
  id: string
  schemaType: string
}

export function NewScheduleInfo({id, schemaType}: Props) {
  const {t} = useTranslation(scheduledPublishingNamespace)
  return (
    <Stack space={4}>
      <Text size={1}>
        <Translate
          t={t}
          i18nKey="schedule-action.new-schedule.body-1"
          components={{
            Break: () => <br />,
          }}
        />
      </Text>
      <Text size={1}>{t('schedule-action.new-schedule.body-2')}</Text>
      <ValidationWarning id={id} type={schemaType} />
    </Stack>
  )
}

function ValidationWarning({id, type}: {id: string; type: string}) {
  const {t} = useTranslation(scheduledPublishingNamespace)
  const publishedId = usePublishedId(id)
  const schema = useSchemaType(type)
  const validationStatus = useValidationStatus(publishedId, type)
  const {hasError} = useValidationState(validationStatus.validation)

  if (!hasError) {
    return null
  }

  return (
    <Card padding={2} radius={1} shadow={1} tone="critical">
      <Flex gap={1} align="center">
        <ValidationInfo
          markers={validationStatus.validation}
          type={schema}
          documentId={publishedId}
        />
        <Text size={1}>{t('schedule-preview.warnings')}</Text>
      </Flex>
    </Card>
  )
}
