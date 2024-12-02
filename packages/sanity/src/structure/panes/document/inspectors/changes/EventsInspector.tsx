import {BoundaryElementProvider, Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {type ReactElement, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {
  ChangeFieldWrapper,
  ChangeList,
  ChangesError,
  type DocumentChangeContextInstance,
  LoadingBlock,
  NoChanges,
  type ObjectSchemaType,
  ScrollContainer,
  useEvents,
  useTranslation,
} from 'sanity'
import {DocumentChangeContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

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
}
export function EventsInspector({showChanges}: {showChanges: boolean}): ReactElement {
  const {documentId, schemaType, timelineError, value, formState} = useDocumentPane()
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null)

  const {events, revision, sinceRevision, getChangesList} = useEvents()

  const isComparingCurrent = !revision?.revisionId
  const changesList$ = useMemo(() => getChangesList(), [getChangesList])
  const {diff, loading: diffLoading} = useObservable(changesList$, DIFF_INITIAL_VALUE)

  const {t} = useTranslation('studio')

  const documentContext: DocumentChangeContextInstance = useMemo(() => {
    return {
      documentId,
      schemaType,
      FieldWrapper: ChangeFieldWrapper,
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
      if ('parentId' in toEvent && 'parentId' in event && event.parentId === toEvent.parentId) {
        return {...event, parentId: undefined}
      }
      return event
    })
  }, [events, toEvent])

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
                  error={timelineError}
                  loading={revision?.loading || sinceRevision?.loading || false}
                  schemaType={schemaType}
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
}: {
  error?: Error | null
  documentContext: DocumentChangeContextInstance
  loading: boolean
  schemaType: ObjectSchemaType
}) {
  if (error) {
    return <ChangesError />
  }

  if (loading) {
    return <LoadingBlock showText />
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
      <ChangeList diff={documentContext.rootDiff} schemaType={schemaType} />
    </DocumentChangeContext.Provider>
  )
}
