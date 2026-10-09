import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Box, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../i18n'

export interface PublishProgressProps {
  /** Whether validation of the current revision is still running. */
  isValidating: boolean
  /** Number of validation errors once validation has finished. */
  errorCount: number
}

/**
 * The steps of a publish that is taking a while: for now only validation, which is shown as
 * running until the result is in, then as the number of errors found (or none).
 */
export function PublishProgress({isValidating, errorCount}: PublishProgressProps) {
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Stack gap={3} data-testid="publish-progress">
      <Flex align="center" gap={3} data-testid="publish-progress-validation">
        <Box flex="none" style={{width: 17, height: 17}}>
          {isValidating ? (
            <Spinner muted size={1} />
          ) : errorCount > 0 ? (
            <Text size={1} muted>
              <ErrorOutlineIcon />
            </Text>
          ) : (
            <Text size={1} muted>
              <CheckmarkCircleIcon />
            </Text>
          )}
        </Box>
        <Text size={1} weight={isValidating ? 'medium' : undefined}>
          {isValidating
            ? t('action.publish.progress.validating')
            : errorCount > 0
              ? t('action.publish.progress.validation-errors', {count: errorCount})
              : t('action.publish.progress.validation-passed')}
        </Text>
      </Flex>
    </Stack>
  )
}
