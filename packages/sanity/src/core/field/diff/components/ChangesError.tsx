import {Card} from '@sanity/ui'
import {Text, VStack, Box} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {MissingSinceDocumentError} from '../../../store/events/getDocumentChanges'

/**
 * @internal
 * */
export function ChangesError({error}: {error?: Error | null}) {
  const {t} = useTranslation()
  const revisionNotFoundError = error instanceof MissingSinceDocumentError
  return (
    <Card tone="caution" padding={3}>
      <VStack gap={3}>
        <Text size={1} weight="medium" as="h3" trim={true}>
          {t('changes.error-title')}
        </Text>
        <Text as="p" size={1} muted trim={true}>
          {t('changes.error-description')}
        </Text>
        {revisionNotFoundError && (
          <Box paddingTop={2}>
            <Text as="p" size={1} muted trim={true}>
              <Translate
                i18nKey="changes.missing-since-document-error"
                t={t}
                values={{revisionId: error.revisionId}}
                components={{Break: 'br'}}
              />
            </Text>
          </Box>
        )}
      </VStack>
    </Card>
  )
}
