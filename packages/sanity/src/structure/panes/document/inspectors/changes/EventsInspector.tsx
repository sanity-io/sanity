import {BoundaryElementProvider, Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import {type ReactElement, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {
  ChangeFieldWrapper,
  ChangeList,
  type DocumentChangeContextInstance,
  LoadingBlock,
  NoChanges,
  type ObjectSchemaType,
  type SanityDocument,
  ScrollContainer,
  useTranslation,
} from 'sanity'
import {DocumentChangeContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {structureLocaleNamespace} from '../../../../i18n'
import {useEvents} from '../../HistoryProvider'
import {EventsTimelineMenu} from '../../timeline/events/EventsTimelineMenue'
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

export function EventsInspector({showChanges}: {showChanges: boolean}): ReactElement {
  const {documentId, schemaType, timelineError, value, displayed, formState} = useDocumentPane()
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null)

  const {events, revision, sinceRevision, changesList} = useEvents()
  const isComparingCurrent = !revision?.revisionId
  const diff$ = useMemo(
    () =>
      changesList({
        to: revision?.document || (displayed as SanityDocument),
        since: sinceRevision?.document || null,
      }),
    [changesList, displayed, revision?.document, sinceRevision?.document],
  )
  const {diff, loading: diffLoading} = useObservable(diff$, {
    diff: null,
    loading: true,
  })

  // Note that we are using the studio core namespace here, as changes theoretically should
  // be part of Sanity core (needs to be moved from structure at some point)
  const {t: structureT} = useTranslation(structureLocaleNamespace)

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
      events.find((e) => e.id === revision?.revisionId) || null,
    ]
  }, [events, revision?.revisionId, sinceRevision?.revisionId])

  const sinceEvents = useMemo(() => {
    // The sinceEvents need to account the toEvent showing only events that are older than the toEvent
    if (!toEvent) return events.slice(1)
    return events.slice(events.indexOf(toEvent) + 1)
  }, [events, toEvent])

  return (
    <Flex data-testid="review-changes-pane" direction="column" height="fill" overflow="hidden">
      <Box padding={3}>
        <Grid paddingX={2} paddingBottom={2}>
          <Text size={1} muted>
            {structureT('changes.from.label')}
          </Text>
          <EventsTimelineMenu
            event={sinceEvent || null}
            events={sinceEvents}
            mode="since"
            placement="bottom-start"
          />
          <Text size={1} muted>
            {structureT('changes.to.label')}
          </Text>
          <EventsTimelineMenu
            event={toEvent || null}
            events={events}
            mode="rev"
            placement="bottom-end"
          />
        </Grid>
      </Box>

      <Card flex={1} paddingX={2} paddingY={2}>
        <BoundaryElementProvider element={scrollRef}>
          <Scroller data-ui="Scroller" ref={setScrollRef}>
            <Box flex={1} paddingX={3} height="fill">
              {showChanges && (
                <Content
                  showDiffLoading={diffLoading}
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
  showDiffLoading,
}: {
  showDiffLoading: boolean
  error?: Error | null
  documentContext: DocumentChangeContextInstance
  loading: boolean
  schemaType: ObjectSchemaType
}) {
  if (error) {
    return <NoChanges />
  }

  if (loading) {
    return <LoadingBlock showText />
  }

  if (!documentContext.rootDiff) {
    return <NoChanges />
  }

  return (
    <DocumentChangeContext.Provider value={documentContext}>
      {showDiffLoading && (
        <Flex justify={'center'} padding={2}>
          <Spinner />
        </Flex>
      )}
      <ChangeList diff={documentContext.rootDiff} schemaType={schemaType} />
    </DocumentChangeContext.Provider>
  )
}
