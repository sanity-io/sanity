import {type IconComponent} from '@sanity/icons'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type SchemaType,
  type ValidationMarker,
  type ValidationSuggestedFix,
} from '@sanity/types'
import {Card, type CardTone, Text} from '@sanity/ui'
import {type ErrorInfo, Fragment, type MouseEvent, useCallback, useMemo, useState} from 'react'
import {
  type DocumentInspectorProps,
  type FormPatch,
  isGoingToUnpublish,
  mergeParseErrors,
  PatchEvent,
  set,
  unset,
  useParseErrors,
  useTranslation,
} from 'sanity'
import {Flex, Box, VStack} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {ErrorBoundary} from '../../../../../ui-components/errorBoundary/ErrorBoundary'
import {DocumentInspectorHeader} from '../../documentInspector/DocumentInspectorHeader'
import {useDocumentPane} from '../../useDocumentPane'
import {getPathTitles} from './getPathTitles'

const MARKER_ICON: Record<'error' | 'warning' | 'info', IconComponent> = {
  error: ErrorOutlineIcon,
  warning: WarningOutlineIcon,
  info: InfoOutlineIcon,
}

const MARKER_TONE = {
  error: 'critical',
  warning: 'caution',
  info: 'primary',
} as const satisfies Record<'error' | 'warning' | 'info', CardTone>

function suggestedFixToPatch(fix: ValidationSuggestedFix, path: Path): FormPatch {
  switch (fix.type) {
    case 'set':
      return set(fix.value, path)
    case 'unset':
      return unset(path)
    default: {
      const unknownFix: never = fix
      throw new Error(`Unknown suggested fix: ${JSON.stringify(unknownFix)}`)
    }
  }
}

export function ValidationInspector(props: DocumentInspectorProps) {
  const {onClose} = props
  const {onChange, onFocus, onPathOpen, schemaType, validation, value, editState, formState} =
    useDocumentPane()
  const parseErrors = useParseErrors()
  const mergedValidation = useMemo(
    () => mergeParseErrors(validation, parseErrors),
    [validation, parseErrors],
  )
  const {t} = useTranslation('validation')

  const handleOpen = useCallback(
    (path: Path) => {
      onPathOpen(path)
      onFocus(path)
    },
    [onFocus, onPathOpen],
  )

  const readOnly = !formState || formState.readOnly
  const handleApplyFix = useCallback(
    (path: Path, fix: ValidationSuggestedFix) => {
      onChange(PatchEvent.from(suggestedFixToPatch(fix, path)))
    },
    [onChange],
  )

  const isVersionGoingToUnpublish =
    editState && editState.version && isGoingToUnpublish(editState.version)

  return (
    <Flex flexDirection="column" height="100%" overflow="hidden">
      <DocumentInspectorHeader
        as="header"
        closeButtonLabel={t('panel.close-button-aria-label')}
        flex="none"
        onClose={onClose}
        title={t('panel.title')}
      />

      <Card flex={1} overflow="auto" padding={3}>
        {isVersionGoingToUnpublish ? (
          <Box padding={2}>
            <Text muted size={1}>
              {t('panel.unpublish-message')}
            </Text>
          </Box>
        ) : (
          <>
            {mergedValidation.length === 0 && (
              <Box padding={2}>
                <Text muted size={1}>
                  {t('panel.no-errors-message')}
                </Text>
              </Box>
            )}
            {mergedValidation.length > 0 && (
              <VStack gap={2}>
                {mergedValidation.map((marker, i) => (
                  <ValidationCard
                    // oxlint-disable-next-line no-array-index-key
                    key={i}
                    marker={marker}
                    onApplyFix={readOnly ? undefined : handleApplyFix}
                    onOpen={handleOpen}
                    schemaType={schemaType}
                    value={value}
                  />
                ))}
              </VStack>
            )}
          </>
        )}
      </Card>
    </Flex>
  )
}

function ValidationCard(props: {
  marker: ValidationMarker
  onApplyFix?: (path: Path, fix: ValidationSuggestedFix) => void
  onOpen: (path: Path) => void
  schemaType: ObjectSchemaType
  value: Partial<SanityDocument> | null
}) {
  const {marker, onApplyFix, onOpen, schemaType, value} = props
  const suggestedFixes = onApplyFix ? marker.suggestedFixes : undefined
  const handleClick = useCallback(
    (event: MouseEvent) => {
      // Allow text selection: if the user selected text, don't navigate
      const selection = window.getSelection()
      if (
        selection &&
        selection.toString().length > 0 &&
        // It's selecting inside the card, so don't navigate
        event.currentTarget.contains(selection.anchorNode)
      ) {
        return
      }
      onOpen(marker.path)
    },
    [marker, onOpen],
  )
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
          onClick={handleClick}
          padding={3}
          radius={2}
          style={{userSelect: 'text'}}
          tone={MARKER_TONE[marker.level]}
        >
          <Flex alignItems="flex-start" gap={3}>
            <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
              <Text size={1}>
                <Icon />
              </Text>
            </Box>

            <Flex flexBasis="0%" flexGrow={1} gap={2} flexDirection="column">
              <DocumentNodePathBreadcrumbs
                path={marker.path}
                schemaType={schemaType}
                value={value}
              />

              <Text muted size={1}>
                {marker.message}
              </Text>
            </Flex>
          </Flex>
        </Card>
      )}

      {!errorInfo && onApplyFix && suggestedFixes && suggestedFixes.length > 0 && (
        <Flex flexWrap="wrap" gap={2} paddingTop={2} paddingLeft={3}>
          {suggestedFixes.map((fix, fixIndex) => (
            <Button
              data-testid="validation-suggested-fix"
              // oxlint-disable-next-line no-array-index-key
              key={fixIndex}
              mode="ghost"
              onClick={() => onApplyFix(marker.path, fix)}
              text={fix.title}
              tone={MARKER_TONE[marker.level]}
            />
          ))}
        </Flex>
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
        // oxlint-disable-next-line no-array-index-key
        <Fragment key={i}>
          {i > 0 && <span style={{color: 'var(--card-muted-fg-color)', opacity: 0.5}}> / </span>}
          <span style={{fontWeight: 500}}>{t.title || t.name}</span>
        </Fragment>
      ))}
    </Text>
  )
}
