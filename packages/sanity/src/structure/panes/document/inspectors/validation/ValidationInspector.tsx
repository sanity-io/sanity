import {
  ErrorOutlineIcon,
  type IconComponent,
  InfoOutlineIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type SchemaType,
  type ValidationMarker,
} from '@sanity/types'
import {Box, Card, type CardTone, Flex, Stack, Text} from '@sanity/ui'
import {type ErrorInfo, Fragment, useCallback, useMemo, useState} from 'react'
import {type DocumentInspectorProps, useTranslation} from 'sanity'

import {ErrorBoundary} from '../../../../../ui-components'
import {DocumentInspectorHeader} from '../../documentInspector'
import {useDocumentPane} from '../../useDocumentPane'
import {getPathTitles} from './getPathTitles'

const MARKER_ICON: Record<'error' | 'warning' | 'info', IconComponent> = {
  error: ErrorOutlineIcon,
  warning: WarningOutlineIcon,
  info: InfoOutlineIcon,
}

const MARKER_TONE: Record<'error' | 'warning' | 'info', CardTone> = {
  error: 'critical',
  warning: 'caution',
  info: 'primary',
}

export function ValidationInspector(props: DocumentInspectorProps) {
  const {onClose} = props
  const {onFocus, onPathOpen, schemaType, validation, value} = useDocumentPane()
  const {t} = useTranslation('validation')

  const handleOpen = useCallback(
    (path: Path) => {
      onPathOpen(path)
      onFocus(path)
    },
    [onFocus, onPathOpen],
  )

  return (
    <Flex direction="column" height="fill" overflow="hidden">
      <DocumentInspectorHeader
        as="header"
        closeButtonLabel={t('panel.close-button-aria-label')}
        flex="none"
        onClose={onClose}
        title={t('panel.title')}
      />

      <Card flex={1} overflow="auto" padding={3}>
        {validation.length === 0 && (
          <Box padding={2}>
            <Text muted size={1}>
              {t('panel.no-errors-message')}
            </Text>
          </Box>
        )}

        {validation.length > 0 && (
          <Stack space={2}>
            {validation.map((marker, i) => (
              <ValidationCard
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                marker={marker}
                onOpen={handleOpen}
                schemaType={schemaType}
                value={value}
              />
            ))}
          </Stack>
        )}
      </Card>
    </Flex>
  )
}

function ValidationCard(props: {
  marker: ValidationMarker
  onOpen: (path: Path) => void
  schemaType: ObjectSchemaType
  value: Partial<SanityDocument> | null
}) {
  const {marker, onOpen, schemaType, value} = props
  const handleOpen = useCallback(() => onOpen(marker.path), [marker, onOpen])
  const [errorInfo, setErrorInfo] = useState<{error: Error; info: ErrorInfo} | null>(null)
  const Icon = MARKER_ICON[marker.level]

  return (
    <ErrorBoundary onCatch={setErrorInfo}>
      {errorInfo && (
        <Card padding={3} radius={2} tone="critical">
          <Text size={1}>{errorInfo.error.message}</Text>
        </Card>
      )}

      {!errorInfo && (
        <Card
          __unstable_focusRing
          as="button"
          onClick={handleOpen}
          padding={3}
          radius={2}
          tone={MARKER_TONE[marker.level]}
        >
          <Flex align="flex-start" gap={3}>
            <Box flex="none">
              <Text size={1}>
                <Icon />
              </Text>
            </Box>

            <Stack flex={1} space={2}>
              <DocumentNodePathBreadcrumbs
                path={marker.path}
                schemaType={schemaType}
                value={value}
              />

              <Text muted size={1}>
                {marker.message}
              </Text>
            </Stack>
          </Flex>
        </Card>
      )}
    </ErrorBoundary>
  )
}

function DocumentNodePathBreadcrumbs(props: {
  path: Path
  schemaType: SchemaType
  value: Partial<SanityDocument> | null
}) {
  const {path, schemaType, value} = props

  const pathTitles = useMemo(() => {
    try {
      return getPathTitles({path, schemaType, value})
    } catch (e) {
      console.error(e)
    }
    return null
  }, [path, schemaType, value])

  if (!pathTitles?.length) return null

  return (
    <Text size={1}>
      {pathTitles.map((t, i) => (
        <Fragment key={i}>
          {i > 0 && <span style={{color: 'var(--card-muted-fg-color)', opacity: 0.5}}> / </span>}
          <span style={{fontWeight: 500}}>{t.title || t.name}</span>
        </Fragment>
      ))}
    </Text>
  )
}
