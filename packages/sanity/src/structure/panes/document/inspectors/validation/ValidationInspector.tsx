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
} from '@sanity/types'
import {Card, type CardTone, Text} from '@sanity/ui'
import {toString as pathToString} from '@sanity/util/paths'
import {
  type ErrorInfo,
  Fragment,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  type DocumentInspectorProps,
  isGoingToUnpublish,
  mergeParseErrors,
  useParseErrors,
  useTranslation,
} from 'sanity'
import {Flex, Box, VStack} from 'ui5'

import {ErrorBoundary} from '../../../../../ui-components/errorBoundary/ErrorBoundary'
import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {VALIDATION_PATH_PARAM, VALIDATION_PUBLISH_NOTICE_PARAM} from '../../constants'
import {DocumentInspectorHeader} from '../../documentInspector/DocumentInspectorHeader'
import {useDocumentPane} from '../../useDocumentPane'
import {getPathTitles} from './getPathTitles'
import {highlightedCard, publishNotice, scrollTarget} from './ValidationInspector.css'
import {highlightedValidationPaths} from './validationPath'

/** Pause before the publish notice so the inspector is on screen first. */
const PUBLISH_NOTICE_DELAY_MS = 300

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
  const {onFocus, onPathOpen, schemaType, validation, value, editState} = useDocumentPane()
  const {params} = usePaneRouter()
  const parseErrors = useParseErrors()
  const mergedValidation = useMemo(
    () => mergeParseErrors(validation, parseErrors),
    [validation, parseErrors],
  )
  const highlightedPaths = useMemo(
    () => highlightedValidationPaths(params?.[VALIDATION_PATH_PARAM]),
    [params],
  )
  const highlightedKey = params?.[VALIDATION_PATH_PARAM] ?? ''
  const hasHighlightedMarker = mergedValidation.some((marker) =>
    highlightedPaths.has(pathToString(marker.path)),
  )
  const listRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const publishNoticeId = params?.[VALIDATION_PUBLISH_NOTICE_PARAM] || ''
  const [revealedNotice, setRevealedNotice] = useState<string | null>(null)
  const {t} = useTranslation('validation')

  useEffect(() => {
    if (!publishNoticeId) return

    const scroller = scrollerRef.current
    let frame = 0
    let delay = 0
    let fallback = 0
    let revealed = false
    let onScroll: (() => void) | undefined

    const reveal = () => {
      if (revealed) return
      revealed = true
      delay = window.setTimeout(() => {
        frame = requestAnimationFrame(() => setRevealedNotice(publishNoticeId))
      }, PUBLISH_NOTICE_DELAY_MS)
    }

    const stopWaitingForScroll = () => {
      if (onScroll && scroller) scroller.removeEventListener('scroll', onScroll)
      onScroll = undefined
      window.clearTimeout(fallback)
    }

    if (!scroller || scroller.scrollTop <= 1) {
      reveal()
    } else {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      scroller.scrollTo({top: 0, behavior: reduceMotion ? 'auto' : 'smooth'})
      onScroll = () => {
        if (scroller.scrollTop > 1) return
        stopWaitingForScroll()
        reveal()
      }
      scroller.addEventListener('scroll', onScroll, {passive: true})
      // Smooth scrolling can fail to emit a final scroll event. Reveal anyway.
      fallback = window.setTimeout(() => {
        stopWaitingForScroll()
        reveal()
      }, 700)
    }

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(delay)
      stopWaitingForScroll()
    }
  }, [publishNoticeId])

  useEffect(() => {
    if (!highlightedKey || !hasHighlightedMarker) return
    const frame = requestAnimationFrame(() => {
      listRef.current
        ?.querySelector('[data-validation-highlighted="true"]')
        ?.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'})
    })
    return () => cancelAnimationFrame(frame)
  }, [hasHighlightedMarker, highlightedKey])

  const handleOpen = useCallback(
    (path: Path) => {
      onPathOpen(path)
      onFocus(path)
    },
    [onFocus, onPathOpen],
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

      <Card flex={1} overflow="auto" padding={3} ref={scrollerRef}>
        {isVersionGoingToUnpublish ? (
          <Box padding={2}>
            <Text muted size={1}>
              {t('panel.unpublish-message')}
            </Text>
          </Box>
        ) : (
          <>
            {revealedNotice === publishNoticeId && (
              <div
                className={publishNotice}
                data-testid="validation-publish-notice"
                key={publishNoticeId}
                role="status"
              >
                <Card padding={3} radius={2} tone="critical" border>
                  <Box paddingY={2}>
                    <Text size={1}>{t('panel.publish-blocked-message')}</Text>
                  </Box>
                </Card>
              </div>
            )}
            {mergedValidation.length === 0 && (
              <Box padding={2}>
                <Text muted size={1}>
                  {t('panel.no-errors-message')}
                </Text>
              </Box>
            )}
            {mergedValidation.length > 0 && (
              <div ref={listRef}>
                <VStack gap={2}>
                  {mergedValidation.map((marker, i) => (
                    <ValidationCard
                      // oxlint-disable-next-line no-array-index-key
                      key={i}
                      highlighted={highlightedPaths.has(pathToString(marker.path))}
                      marker={marker}
                      onOpen={handleOpen}
                      schemaType={schemaType}
                      value={value}
                    />
                  ))}
                </VStack>
              </div>
            )}
          </>
        )}
      </Card>
    </Flex>
  )
}

function ValidationCard(props: {
  highlighted: boolean
  marker: ValidationMarker
  onOpen: (path: Path) => void
  schemaType: ObjectSchemaType
  value: Partial<SanityDocument> | null
}) {
  const {highlighted, marker, onOpen, schemaType, value} = props
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
        <div
          className={scrollTarget}
          data-validation-highlighted={highlighted ? 'true' : undefined}
        >
          <Card
            __unstable_focusRing
            as="button"
            className={highlighted ? highlightedCard : undefined}
            onClick={handleClick}
            padding={3}
            radius={2}
            selected={highlighted}
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
        </div>
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
