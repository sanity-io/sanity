import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {SyncIcon} from '@sanity/icons/Sync'
import {Card, Text} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'
import {useTranslation} from 'sanity'
import {Flex, Box, VStack} from 'ui5'

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
      <Flex flexDirection="column" height="100%" overflow="hidden">
        <DocumentInspectorHeader
          as="header"
          closeButtonLabel={t('document-inspector.error.close-button.aria-label')}
          flex="none"
          onClose={onClose}
          title={t('document-inspector.error.title')}
        />

        <Card flex={1} overflow="auto" padding={3}>
          <VStack gap={3}>
            <Card padding={3} radius={2} tone="critical">
              <Flex gap={3}>
                <Text size={1}>
                  <ErrorOutlineIcon />
                </Text>

                <Flex flexBasis="0%" flexGrow={1} gap={3} flexDirection="column">
                  <Text size={1}>{t('document-inspector.error.description')}</Text>
                  <Text muted size={1}>
                    {error.message}
                  </Text>
                </Flex>
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
          </VStack>
        </Card>
      </Flex>
    )
  }

  return <ErrorBoundary onCatch={handleCatch}>{children}</ErrorBoundary>
}
