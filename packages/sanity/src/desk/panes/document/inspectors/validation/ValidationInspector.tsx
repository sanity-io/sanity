import {ErrorOutlineIcon, IconComponent, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, CardTone, ErrorBoundary, Flex, Stack, Text} from '@sanity/ui'
import {ObjectSchemaType, Path, SanityDocument, SchemaType, ValidationMarker} from '@sanity/types'
import React, {ErrorInfo, Fragment, createElement, useCallback, useMemo, useState} from 'react'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentInspectorHeader} from '../../documentInspector'
import {getPathTypes} from './getPathTypes'
import {DocumentInspectorProps, useTranslation} from 'sanity'

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
              <Text size={1}>{createElement(MARKER_ICON[marker.level])}</Text>
            </Box>

            <Stack flex={1} space={2}>
              <DocumentNodePathBreadcrumbs
                path={marker.path}
                schemaType={schemaType}
                value={value}
              />

              <Text muted size={1}>
                {marker.item.message}
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

  const pathTypes = useMemo(
    () => getPathTypes({path, schemaType, value}),
    [path, schemaType, value],
  )

  return (
    <Text size={1}>
      {pathTypes.map((t, i) => (
        <Fragment key={i}>
          {i > 0 && <span style={{color: 'var(--card-muted-fg-color)', opacity: 0.5}}> / </span>}
          <span style={{fontWeight: 500}}>{t.title || t.name}</span>
        </Fragment>
      ))}
    </Text>
  )
}
