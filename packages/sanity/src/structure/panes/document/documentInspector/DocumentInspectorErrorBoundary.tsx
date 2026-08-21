import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {SyncIcon} from '@sanity/icons/Sync'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'
import {useTranslation} from 'sanity'
import {Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {ErrorBoundary} from '../../../../ui-components/errorBoundary/ErrorBoundary'
import {structureLocaleNamespace} from '../../../i18n'
import {DocumentInspectorHeader} from './DocumentInspectorHeader'

interface DocumentInspectorErrorBoundaryProps {
  children: ReactNode
  onClose: () => void
}

/**
 * Contains inspector crashes to the inspector panel. Errors thrown while rendering an inspector
 * would otherwise reach `StructureToolBoundary`, which rethrows anything that isn't a
 * `PaneResolutionError` and brings down the entire structure tool.
 *
 * @internal
 */
export function DocumentInspectorErrorBoundary(props: DocumentInspectorErrorBoundaryProps) {
  const {children, onClose} = props
  const {t} = useTranslation(structureLocaleNamespace)
  const [error, setError] = useState<Error | null>(null)

  const handleCatch = useCallback(({error: caughtError}: {error: Error}) => {
    setError(caughtError)
  }, [])

  // Unmounting the boundary discards its caught error, so a retry mounts a fresh one
  const handleRetry = useCallback(() => setError(null), [])

  if (error) {
    return (
      <Flex direction="column" height="fill" overflow="hidden">
        <DocumentInspectorHeader
          as="header"
          closeButtonLabel={t('document-inspector.error.close-button.aria-label')}
          flex="none"
          onClose={onClose}
          title={t('document-inspector.error.title')}
        />

        <Card flex={1} overflow="auto" padding={3}>
          <Stack gap={3}>
            <Card padding={3} radius={2} tone="critical">
              <Flex gap={3}>
                <Text size={1}>
                  <ErrorOutlineIcon />
                </Text>

                <Stack flex={1} gap={3}>
                  <Text size={1}>{t('document-inspector.error.description')}</Text>
                  <Text muted size={1}>
                    {error.message}
                  </Text>
                </Stack>
              </Flex>
            </Card>

            <Box>
              <Button
                icon={SyncIcon}
                mode="ghost"
                onClick={handleRetry}
                text={t('document-inspector.error.retry-button.text')}
              />
            </Box>
          </Stack>
        </Card>
      </Flex>
    )
  }

  return <ErrorBoundary onCatch={handleCatch}>{children}</ErrorBoundary>
}
