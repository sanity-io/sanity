import {diffInput, wrap} from '@sanity/diff'
import {BoundaryElementProvider, Box, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {type ReactElement, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {
  ChangeFieldWrapper,
  ChangeList,
  ChangesError,
  type DocumentChangeContextInstance,
  type DocumentGroupEvent,
  isReleaseDocument,
  LoadingBlock,
  NoChanges,
  type ObjectDiff,
  type ObjectSchemaType,
  ScrollContainer,
  Translate,
  useEvents,
  usePerspective,
  useTranslation,
} from 'sanity'
import {DocumentChangeContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {structureLocaleNamespace} from '../../../../i18n'
import {EventsTimelineMenu} from '../../timeline/events/EventsTimelineMenu'
import {useDocumentPane} from '../../useDocumentPane'

const Scroller = styled(ScrollContainer)`
  height: 100%;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;
`

const Grid = styled(Box)`
  &:not([hidden]) {
    display: grid;
  }
  grid-template-columns: 48px 1fr;
  align-items: center;
  gap: 0.25em;
`

const SpinnerContainer = styled(Flex)`
  width: 100%;
  position: absolute;
  bottom: -4px;
`

const DIFF_INITIAL_VALUE = {
  diff: null,
  loading: true,
  error: null,
}

const CompareWithPublishedView = () => {
  const {documentId, schemaType, editState, displayed} = useDocumentPane()
  const {selectedPerspective, selectedPerspectiveName, selectedReleaseId} = usePerspective()
  const {t} = useTranslation(structureLocaleNamespace)
  const rootDiff = useMemo(() => {
    const diff = diffInput(
      wrap(editState?.published ?? {}, {author: ''}),
      wrap(displayed ?? {}, {author: ''}),
    ) as ObjectDiff

    return diff
  }, [editState?.published, displayed])

  if (selectedReleaseId && !editState?.version) {
    return null
  }
  if (selectedPerspective === 'drafts' && !editState?.draft) {
    return null
  }
  if (selectedPerspectiveName === 'published' || !displayed?._rev) {
    return null
  }
  return (
    <Stack gap={2} marginBottom={3}>
      <Card borderBottom paddingBottom={3}>
        <Stack gap={3} paddingTop={1}>
          <Text size={1} weight="medium">
            {t('events.compare-with-published.title')}
          </Text>
          <Text size={1} muted>
            <Translate
              i18nKey="events.compare-with-published.description"
              t={t}
              values={{
                version: isReleaseDocument(selectedPerspective)
                  ? selectedPerspective.metadata?.title
                  : 'draft',
              }}
            />
          </Text>
        </Stack>
      </Card>
      <DocumentChangeContext.Provider
        value={{
          documentId,
          schemaType,
          rootDiff,
          isComparingCurrent: true,
          FieldWrapper: (props) => props.children,
          value: displayed,
          showFromValue: true,
        }}
      >
        <Box paddingY={1}>
          <ChangeList diff={rootDiff} schemaType={schemaType} />
        </Box>
      </DocumentChangeContext.Provider>
    </Stack>
  )
}
export function EventsInspector({showChanges}: {showChanges: boolean}): ReactElement {
  const {documentId, schemaType, timelineError, value, formState} = useDocumentPane()
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null)

  const {events, revision, sinceRevision, getChangesList} = useEvents()

  const isComparingCurrent = !revision?.revisionId
  const changesList$ = useMemo(() => getChangesList(), [getChangesList])
  const {
    diff,
    loading: diffLoading,
    error: diffError,
  } = useObservable(changesList$, DIFF_INITIAL_VALUE)

  const {t} = useTranslation('studio')

  const documentContext: DocumentChangeContextInstance = useMemo(() => {
    return {
      documentId,
      schemaType,
      FieldWrapper: (props) =>
        props.path.length > 0 ? <ChangeFieldWrapper {...props} /> : props.children,
      rootDiff: diff,
      isComparingCurrent: isComparingCurrent && !formState?.readOnly,
      value,
      showFromValue: true,
    }
  }, [diff, documentId, isComparingCurrent, formState?.readOnly, schemaType, value])

  const [sinceEvent, toEvent] = useMemo(() => {
    if (!events) return [null, null]
    return [
      events.find((e) => e.id === sinceRevision?.revisionId) || null,
      events.find((e) => e.id === revision?.revisionId) || events[0],
    ]
  }, [events, revision?.revisionId, sinceRevision?.revisionId])

  const sinceEvents = useMemo(() => {
    // The sinceEvents need to account the toEvent showing only events that are older than the toEvent
    if (!toEvent) return events.slice(1)
    return events.slice(events.indexOf(toEvent) + 1).map((event) => {
      // If the to event has a parent id, we need to remove the parent id from the since events or they won't be rendered, as they have no parent to expand.
      if (
        ('parentId' in toEvent && 'parentId' in event && event.parentId === toEvent.parentId) ||
        ('parentId' in event && toEvent.id === event.parentId)
      ) {
        return {...event, parentId: undefined}
      }
      return event
    })
  }, [events, toEvent])
  if (!events.length) {
    return (
      <Box paddingX={2}>
        <Stack padding={3} gap={3}>
          <Text size={1} weight="medium">
            {t('timeline.error.no-document-history-title')}
          </Text>
          <Text muted size={1}>
            {t('timeline.error.no-document-history-description')}
          </Text>
        </Stack>
      </Box>
    )
  }
  return (
    <Flex data-testid="review-changes-pane" direction="column" height="fill" overflow="hidden">
      <Box padding={3} style={{position: 'relative'}}>
        <Grid paddingX={2} paddingBottom={2}>
          <Text size={1} muted>
            {t('changes.inspector.from-label')}
          </Text>
          <EventsTimelineMenu
            event={sinceEvent || null}
            events={sinceEvents}
            mode="since"
            placement="bottom-start"
          />
          <Text size={1} muted>
            {t('changes.inspector.to-label')}
          </Text>
          <EventsTimelineMenu
            event={toEvent || null}
            events={events}
            mode="rev"
            placement="bottom-end"
          />
        </Grid>
        {diffLoading && (
          <motion.div
            animate={{opacity: 1}}
            initial={{opacity: 0}}
            transition={{delay: 0.2, duration: 0.2}}
          >
            <SpinnerContainer justify="center" align="center" gap={2}>
              <Text muted size={0}>
                {t('changes.loading-changes')}
              </Text>
              <Spinner size={0} />
            </SpinnerContainer>
          </motion.div>
        )}
      </Box>

      <Card flex={1} paddingX={2} paddingY={2}>
        <BoundaryElementProvider element={scrollRef}>
          <Scroller data-ui="Scroller" ref={setScrollRef}>
            <Box flex={1} paddingX={3} height="fill">
              {showChanges && (
                <Content
                  documentContext={documentContext}
                  error={timelineError || diffError}
                  loading={revision?.loading || sinceRevision?.loading || false}
                  schemaType={schemaType}
                  sameRevisionSelected={sinceEvent?.id === toEvent?.id}
                  sinceEvent={sinceEvent}
                />
              )}
            </Box>
          </Scroller>
        </BoundaryElementProvider>
      </Card>
    </Flex>
  )
}

function Content({
  error,
  documentContext,
  loading,
  schemaType,
  sameRevisionSelected,
  sinceEvent,
}: {
  error?: Error | null
  documentContext: DocumentChangeContextInstance
  loading: boolean
  schemaType: ObjectSchemaType
  sameRevisionSelected: boolean
  sinceEvent: DocumentGroupEvent | null
}) {
  if (error) {
    return (
      <>
        <CompareWithPublishedView />
        {sinceEvent?.type !== 'historyCleared' && <ChangesError error={error} />}
      </>
    )
  }

  if (loading) {
    return <LoadingBlock showText />
  }
  if (sameRevisionSelected) {
    return <SameRevisionSelected />
  }

  if (!documentContext.rootDiff) {
    return (
      <motion.div
        animate={{opacity: 1}}
        initial={{opacity: 0}}
        transition={{delay: 0.2, duration: 0.2}}
      >
        <NoChanges />
      </motion.div>
    )
  }

  return (
    <DocumentChangeContext.Provider value={documentContext}>
      <Box paddingY={1}>
        <ChangeList diff={documentContext.rootDiff} schemaType={schemaType} />
      </Box>
    </DocumentChangeContext.Provider>
  )
}

function SameRevisionSelected() {
  const {t} = useTranslation('')
  return (
    <motion.div
      animate={{opacity: 1}}
      initial={{opacity: 0}}
      transition={{delay: 0.2, duration: 0.2}}
    >
      <Stack gap={3} paddingTop={2}>
        <Text size={1} weight="medium" as="h3">
          {t('changes.same-revision-selected-title')}
        </Text>
        <Text as="p" size={1} muted>
          <Translate i18nKey="changes.same-revision-selected-description" t={t} />
        </Text>
      </Stack>
    </motion.div>
  )
}
