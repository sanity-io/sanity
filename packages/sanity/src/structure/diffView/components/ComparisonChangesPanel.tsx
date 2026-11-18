import {hues} from '@sanity/color'
import {CloseIcon} from '@sanity/icons/Close'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {type Path} from '@sanity/types'
import {BoundaryElementProvider, Card, TabList, TabPanel} from '@sanity/ui'
import {type CSSProperties, type ReactNode, useCallback, useMemo, useState} from 'react'
import {useSyncObservable} from 'react-rx'
import {
  ChangeList,
  ChangesError,
  type DocumentChangeContextInstance,
  type DocumentGroupEvent,
  EventsProvider,
  getPublishedId,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  isNonSelectableTerminalEvent,
  isScheduleDocumentVersionEvent,
  isUnpublishDocumentEvent,
  isUnscheduleDocumentVersionEvent,
  LoadingBlock,
  NoChanges,
  type ObjectSchemaType,
  ScrollContainer,
  Translate,
  useColorSchemeValue,
  useDocumentVersions,
  useDocumentVersionTitle,
  useEvents,
  useEventsStore,
  useSchema,
  useTranslation,
  type VersionInfoDocumentStub,
} from 'sanity'
import {DocumentChangeContext} from 'sanity/_singletons'
import {Box, Flex, Grid, Icon, Text} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {Tab} from '../../../ui-components/tab/Tab'
import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {structureLocaleNamespace} from '../../i18n'
import {scroller} from '../../panes/document/inspectors/changes/Scroller.css'
import {EventsTimeline} from '../../panes/document/timeline/events/EventsTimeline'
import {EventsTimelineMenu} from '../../panes/document/timeline/events/EventsTimelineMenu'
import {comparisonChangesPanel} from './ComparisonChangesPanel.css'

interface ComparisonSide {
  type: string
  id: string
}

interface FieldWrapperProps {
  path: Path
  children: ReactNode
  hasRevertHover: boolean
}

function PassThroughFieldWrapper(props: FieldWrapperProps): ReactNode {
  return props.children
}

const EMPTY_VALUE = {}

const DIFF_INITIAL_VALUE = {diff: null, loading: true, error: null}

type PanelTab = 'history' | 'review'

interface TimelineRange {
  since: string | undefined
  rev: string | undefined
}

/** The inspector opens Review changes from the last publish; so does this panel. */
const INITIAL_RANGE: TimelineRange = {since: '@lastPublished', rev: undefined}

interface ActionColorStyle extends CSSProperties {
  '--comparison-added-bg': string
  '--comparison-added-fg': string
  '--comparison-removed-bg': string
  '--comparison-removed-fg': string
}

/**
 * Added in green and removed in red, whoever made the change. User colours leave out green and
 * red for this reason, so these never read as a person.
 */
function useActionColorStyle(): ActionColorStyle {
  const scheme = useColorSchemeValue()
  return useMemo(() => {
    const background = scheme === 'dark' ? 900 : 100
    const text = scheme === 'dark' ? 200 : 700
    return {
      '--comparison-added-bg': hues.green[background].hex,
      '--comparison-added-fg': hues.green[text].hex,
      '--comparison-removed-bg': hues.red[background].hex,
      '--comparison-removed-fg': hues.red[text].hex,
    }
  }, [scheme])
}

/**
 * The document pane's History inspector inside the comparison view, pointed at the version on the
 * right: its own events, and its own changes between two points in its timeline (From and To),
 * with who made them. Read only: no revert, no restore.
 *
 * @internal
 */
export function ComparisonChangesPanel({
  comparing,
  onClose,
}: {
  comparing: ComparisonSide
  onClose: () => void
}) {
  const [range, setRange] = useState<TimelineRange>(INITIAL_RANGE)
  const eventsStore = useEventsStore({
    documentId: comparing.id,
    documentType: comparing.type,
    rev: range.rev,
    since: range.since,
  })

  return (
    <EventsProvider value={eventsStore}>
      <ComparisonInspector comparing={comparing} onClose={onClose} setRange={setRange} />
    </EventsProvider>
  )
}

function ComparisonInspector({
  comparing,
  onClose,
  setRange,
}: {
  comparing: ComparisonSide
  onClose: () => void
  setRange: (range: TimelineRange) => void
}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()
  const [tab, setTab] = useState<PanelTab>('review')
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null)
  const comparingVersion = useVersionStub(comparing)
  const actionColorStyle = useActionColorStyle()

  const handleRangeChange = useCallback(
    (since: string | null, rev: string | null) =>
      setRange({since: since ?? undefined, rev: rev ?? undefined}),
    [setRange],
  )

  // Picking an event in History shows what it changed
  const handleSelectEvent = useCallback(
    (since: string | null, rev: string | null) => {
      handleRangeChange(since, rev)
      setTab('review')
    },
    [handleRangeChange],
  )

  return (
    <aside
      className={comparisonChangesPanel}
      data-testid="comparison-changes-panel"
      style={actionColorStyle}
    >
      <Flex flexDirection="column" padding={0} height="100%" ref={setParentRef}>
        <Card paddingBottom={1}>
          <Flex alignItems="center" padding={3} gap={2}>
            <TabList gap={1} flex={1}>
              <Tab
                aria-controls="comparison-history-panel"
                id="comparison-history-tab"
                label={t('changes.tab.history')}
                onClick={() => setTab('history')}
                selected={tab === 'history'}
              />
              <Tab
                aria-controls="comparison-review-panel"
                id="comparison-review-tab"
                label={t('changes.tab.review-changes')}
                onClick={() => setTab('review')}
                selected={tab === 'review'}
              />
            </TabList>
            <Button
              aria-label={tCore('changes.action.close-label')}
              icon={CloseIcon}
              mode="bleed"
              onClick={onClose}
              tooltipProps={{content: t('document-inspector.close-button.tooltip')}}
            />
          </Flex>
        </Card>
        {comparingVersion ? (
          <Card padding={2} marginBottom={3} marginX={3} tone="neutral" border radius={3}>
            <Flex gap={2} alignItems="flex-start">
              <Tooltip
                portal
                placement="bottom-end"
                boundaryElement={parentRef}
                content={
                  <Box flexBasis="0%" flexGrow={1} padding={1}>
                    <Text size={1} as="div" trim={true}>
                      <Translate t={t} i18nKey="changes.banner.tooltip" />
                    </Text>
                  </Box>
                }
              >
                <Icon size={0} muted icon={InfoOutlineIcon} style={{margin: '-0.3125rem'}} />
              </Tooltip>
              <Text size={0} muted as="div" trim={true}>
                <BannerDescription version={comparingVersion} />
              </Text>
            </Flex>
          </Card>
        ) : null}

        <TabPanel
          aria-labelledby="comparison-history-tab"
          height="fill"
          hidden={tab !== 'history'}
          id="comparison-history-panel"
        >
          {tab === 'history' ? <ComparisonHistory onSelectRange={handleSelectEvent} /> : null}
        </TabPanel>

        <TabPanel
          aria-labelledby="comparison-review-tab"
          height="fill"
          hidden={tab !== 'review'}
          id="comparison-review-panel"
        >
          {tab === 'review' ? (
            <ComparisonReviewChanges comparing={comparing} onRangeChange={handleRangeChange} />
          ) : null}
        </TabPanel>
      </Flex>
    </aside>
  )
}

/** The version stub of a side, as the inventory and the pickers know it. */
function useVersionStub(side: ComparisonSide): VersionInfoDocumentStub | undefined {
  const {versions} = useDocumentVersions({documentId: getPublishedId(side.id)})
  return versions.find((version) => version._id === side.id)
}

/** The banner's sentence, naming the compared side as the inspector names the perspective. */
function BannerDescription({version}: {version: VersionInfoDocumentStub}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const {title} = useDocumentVersionTitle({version})
  return <Translate t={t} values={{perspective: title}} i18nKey="changes.banner.description" />
}

/** Review changes for the compared version, laid out as the inspector's Review changes tab. */
function ComparisonReviewChanges({
  comparing,
  onRangeChange,
}: {
  comparing: ComparisonSide
  onRangeChange: (since: string | null, rev: string | null) => void
}) {
  const {t} = useTranslation('studio')
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null)
  const schemaType = useSchema().get(comparing.type) as ObjectSchemaType | undefined
  const {events, revision, sinceRevision, getChangesList, error: eventsError} = useEvents()
  const changesList$ = useMemo(() => getChangesList(), [getChangesList])
  const {
    diff,
    loading: diffLoading,
    error: diffError,
  } = useSyncObservable(changesList$, DIFF_INITIAL_VALUE)

  const [sinceEvent, toEvent] = useMemo(() => {
    const [lastEvent] = events
    const revisionEvent = events.find((e) => e.id === revision?.revisionId)
    const fallbackToEvent =
      lastEvent && isNonSelectableTerminalEvent(lastEvent) ? null : lastEvent || null
    return [
      events.find((e) => e.id === sinceRevision?.revisionId) || null,
      revisionEvent || fallbackToEvent,
    ]
  }, [events, revision?.revisionId, sinceRevision?.revisionId])

  const sinceEvents = useMemo(() => {
    // Only events older than the To event can be the From event
    if (!toEvent) return events.slice(1)
    return events.slice(events.indexOf(toEvent) + 1).map((event) => {
      if (
        ('parentId' in toEvent && 'parentId' in event && event.parentId === toEvent.parentId) ||
        ('parentId' in event && toEvent.id === event.parentId)
      ) {
        return {...event, parentId: undefined}
      }
      return event
    })
  }, [events, toEvent])

  const documentContext: DocumentChangeContextInstance | null = useMemo(
    () =>
      schemaType && diff
        ? {
            // The document group's id, as Review changes passes it; the store refuses a draft id
            documentId: getPublishedId(comparing.id),
            schemaType,
            rootDiff: diff,
            // Read only: no revert controls
            isComparingCurrent: false,
            FieldWrapper: PassThroughFieldWrapper,
            value: revision?.document ?? EMPTY_VALUE,
            showFromValue: true,
          }
        : null,
    [comparing.id, diff, revision?.document, schemaType],
  )

  if (!events.length) {
    return <NoHistory />
  }

  const error = eventsError || diffError
  let content: ReactNode
  if (error) {
    content = <ChangesError error={error} />
  } else if (revision?.loading || sinceRevision?.loading || diffLoading || !schemaType) {
    content = <LoadingBlock showText />
  } else if (sinceEvent && toEvent && sinceEvent.id === toEvent.id) {
    content = <SameRevisionSelected />
  } else if (documentContext?.rootDiff && schemaType) {
    content = (
      <DocumentChangeContext.Provider value={documentContext}>
        <Box paddingY={1}>
          <ChangeList diff={documentContext.rootDiff} schemaType={schemaType} />
        </Box>
      </DocumentChangeContext.Provider>
    )
  } else {
    content = <NoChanges />
  }

  return (
    <Flex
      data-testid="comparison-review-changes"
      flexDirection="column"
      height="100%"
      overflow="hidden"
    >
      <Box padding={3}>
        <Grid
          paddingX={2}
          paddingBottom={2}
          gridTemplateColumns="48px 1fr"
          style={{alignItems: 'center', gap: '0.25em'}}
        >
          <Text size={1} muted as="div" trim={true}>
            {t('changes.inspector.from-label')}
          </Text>
          <EventsTimelineMenu
            event={sinceEvent}
            events={sinceEvents}
            mode="since"
            placement="bottom-start"
            onRangeChange={onRangeChange}
          />
          <Text size={1} muted as="div" trim={true}>
            {t('changes.inspector.to-label')}
          </Text>
          <EventsTimelineMenu
            event={toEvent}
            events={events}
            mode="rev"
            placement="bottom-end"
            onRangeChange={onRangeChange}
          />
        </Grid>
      </Box>
      <Card flex={1} paddingX={2} paddingY={2}>
        <BoundaryElementProvider element={scrollRef}>
          <ScrollContainer className={scroller} data-ui="Scroller" ref={setScrollRef}>
            <Box flexBasis="0%" flexGrow={1} paddingX={3} height="100%">
              {content}
            </Box>
          </ScrollContainer>
        </BoundaryElementProvider>
      </Card>
    </Flex>
  )
}

function NoHistory() {
  const {t} = useTranslation('studio')
  return (
    <Box paddingX={2}>
      <Flex padding={3} gap={3} flexDirection="column">
        <Text size={1} weight="medium" as="div" trim={true}>
          {t('timeline.error.no-document-history-title')}
        </Text>
        <Text muted size={1} as="div" trim={true}>
          {t('timeline.error.no-document-history-description')}
        </Text>
      </Flex>
    </Box>
  )
}

function SameRevisionSelected() {
  const {t} = useTranslation('studio')
  return (
    <Flex gap={3} paddingTop={2} flexDirection="column">
      <Text size={1} weight="medium" as="h3" trim={true}>
        {t('changes.same-revision-selected-title')}
      </Text>
      <Text as="p" size={1} muted trim={true}>
        <Translate i18nKey="changes.same-revision-selected-description" t={t} />
      </Text>
    </Flex>
  )
}

/** The compared version's timeline, laid out as the inspector's History tab. */
function ComparisonHistory({
  onSelectRange,
}: {
  onSelectRange: (since: string | null, rev: string | null) => void
}) {
  const {
    events,
    nextCursor,
    loading,
    revision,
    lastNonDeletedRevId,
    loadMoreEvents,
    findRangeForRevision,
    expandEvent,
  } = useEvents()
  const [listHeight, setListHeight] = useState(0)
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null)

  // The virtual list needs a fixed height, taken from its scroller once, as the inspector does
  const getScrollerRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (!listHeight && el) {
        setListHeight(el.clientHeight ? el.clientHeight - 1 : 0)
        setScrollRef(el)
      }
    },
    [listHeight],
  )

  const selectEvent = useCallback(
    (event: DocumentGroupEvent) => {
      if (
        isDeleteDocumentVersionEvent(event) ||
        isDeleteDocumentGroupEvent(event) ||
        isUnpublishDocumentEvent(event) ||
        isScheduleDocumentVersionEvent(event) ||
        isUnscheduleDocumentVersionEvent(event)
      ) {
        return
      }
      const [since, rev] = findRangeForRevision(event.id)
      onSelectRange(since, rev)
    },
    [findRangeForRevision, onSelectRange],
  )

  const initialLoad = loading && !events.length
  let list: ReactNode = null
  if (listHeight && !initialLoad) {
    list = events.length ? (
      <EventsTimeline
        events={events}
        fetchEventChildren={expandEvent}
        hasMoreEvents={Boolean(nextCursor)}
        selectedEventId={revision?.revisionId || lastNonDeletedRevId || undefined}
        onLoadMore={loadMoreEvents}
        onSelect={selectEvent}
        listMaxHeight={`${listHeight}px`}
      />
    ) : (
      <NoHistory />
    )
  }

  return (
    <Flex data-testid="comparison-history" flexDirection="column" height="100%">
      <Card flex={1} padding={2} paddingTop={0}>
        <BoundaryElementProvider element={scrollRef}>
          <ScrollContainer className={scroller} data-ui="Scroller" ref={getScrollerRef}>
            {list}
            {loading && <LoadingBlock />}
          </ScrollContainer>
        </BoundaryElementProvider>
      </Card>
    </Flex>
  )
}
