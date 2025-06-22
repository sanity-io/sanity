import {Box, Card, Stack, Text} from '@sanity/ui'

import {Translate} from '../../../i18n/Translate'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {MissingSinceDocumentError} from '../../../store/events/getDocumentChanges'

/**
 * @internal
 * */
export function ChangesError({error}: {error?: Error | null}) {
  const {t} = useTranslation()
  const revisionNotFoundError = error instanceof MissingSinceDocumentError
  return (
    <Card tone="caution" padding={3}>
      <Stack space={3}>
        <Text size={1} weight="medium" as="h3">
          {t('changes.error-title')}
        </Text>
        <Text as="p" size={1} muted>
          {t('changes.error-description')}
        </Text>
        {revisionNotFoundError && (
          <Box paddingTop={2}>
            <Text as="p" size={1} muted>
              <Translate
                i18nKey="changes.missing-since-document-error"
                t={t}
                values={{revisionId: error.revisionId}}
                components={{Break: () => <br />}}
              />
            </Text>
          </Box>
        )}
      </Stack>
    </Card>
  )
}
