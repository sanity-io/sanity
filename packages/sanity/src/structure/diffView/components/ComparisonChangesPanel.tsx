import {diffInput, wrap} from '@sanity/diff'
import {CloseIcon} from '@sanity/icons/Close'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {type Path} from '@sanity/types'
import {BoundaryElementProvider, Card, TabList, TabPanel} from '@sanity/ui'
import {type ReactNode, useMemo, useState} from 'react'
import {
  ChangeList,
  type DocumentGroupEvent,
  DocumentVersionIcons,
  getPublishedId,
  getVersionFromId,
  LoadingBlock,
  NoChanges,
  type ObjectDiff,
  type ObjectSchemaType,
  ScrollContainer,
  Translate,
  useDocumentVersions,
  useDocumentVersionTitle,
  useEditState,
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
import {EventTimelineItem} from '../../panes/document/timeline/events/EventTimelineItem'
import {comparisonChangesPanel} from './ComparisonChangesPanel.css'
import {pickVersion} from './DiffViewPane'

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

const noop = () => undefined

type PanelTab = 'history' | 'review'

/**
 * History and Review changes inside the comparison view. It is the document pane's History
 * inspector (same tabs, banner, From and To rows, spacing), pointed at the two sides of the
 * comparison: History lists the compared side's events, Review changes lists what differs from the
 * reference. Read only: no revert, no restore.
 *
 * @internal
 */
export function ComparisonChangesPanel({
  reference,
  comparing,
  onClose,
}: {
  reference: ComparisonSide
  comparing: ComparisonSide
  onClose: () => void
}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()
  // Review changes is what the comparison is for, so it opens there
  const [tab, setTab] = useState<PanelTab>('review')
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null)
  const comparingVersion = useVersionStub(comparing)

  return (
    <aside className={comparisonChangesPanel} data-testid="comparison-changes-panel">
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
          {tab === 'history' ? <ComparisonHistory comparing={comparing} /> : null}
        </TabPanel>

        <TabPanel
          aria-labelledby="comparison-review-tab"
          height="fill"
          hidden={tab !== 'review'}
          id="comparison-review-panel"
        >
          {tab === 'review' ? (
            <ComparisonChanges
              reference={reference}
              comparing={comparing}
              comparingVersion={comparingVersion}
            />
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

/** A side's name in the From and To rows: its icons and title, as the picker shows them. */
function VersionName({version}: {version: VersionInfoDocumentStub | undefined}) {
  const {t} = useTranslation(structureLocaleNamespace)
  if (!version) {
    return (
      <Text size={1} muted as="div" trim={true}>
        {t('compare-versions.picker.missing')}
      </Text>
    )
  }
  return <KnownVersionName version={version} />
}

function KnownVersionName({version}: {version: VersionInfoDocumentStub}) {
  const {title} = useDocumentVersionTitle({version})
  return (
    <Flex gap={1} alignItems="center" paddingX={2} paddingY={2} style={{minWidth: 0}}>
      <DocumentVersionIcons version={version} />
      <Text
        size={1}
        weight="medium"
        as="div"
        trim={true}
        style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
      >
        {title}
      </Text>
    </Flex>
  )
}

/** Every field that differs between the two sides, laid out as the Review changes tab. */
function ComparisonChanges({
  reference,
  comparing,
  comparingVersion,
}: {
  reference: ComparisonSide
  comparing: ComparisonSide
  comparingVersion: VersionInfoDocumentStub | undefined
}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null)
  const schemaType = useSchema().get(comparing.type) as ObjectSchemaType | undefined
  const referenceVersion = useVersionStub(reference)
  const referenceSide = useSide(reference)
  const comparingSide = useSide(comparing)
  const referenceValue = referenceSide.value
  const comparingValue = comparingSide.value

  const diff = useMemo(
    () =>
      // Two separate versions share no edit history, so the diff carries no authors, the same
      // as the inspector's Compare with published view: the changes show without author colours
      diffInput(
        wrap(referenceValue ?? {}, {author: ''}),
        wrap(comparingValue ?? {}, {author: ''}),
      ) as ObjectDiff,
    [referenceValue, comparingValue],
  )

  let content: ReactNode
  if (!schemaType || !referenceSide.ready || !comparingSide.ready) {
    content = <LoadingBlock showText />
  } else if (!referenceValue || !comparingValue) {
    // A side names a version that does not exist; that side already says so
    content = <PanelMessage>{t('compare-versions.panel.missing-side')}</PanelMessage>
  } else if (!diff.isChanged) {
    content = <NoChanges />
  } else {
    content = (
      <DocumentChangeContext.Provider
        value={{
          // The document group's id, as Review changes passes it; the store refuses a draft id
          documentId: getPublishedId(comparing.id),
          schemaType,
          rootDiff: diff,
          // Not comparing against the current document, so no revert controls
          isComparingCurrent: false,
          FieldWrapper: PassThroughFieldWrapper,
          value: comparingValue,
          showFromValue: true,
        }}
      >
        <Box paddingY={1}>
          <ChangeList diff={diff} schemaType={schemaType} />
        </Box>
      </DocumentChangeContext.Provider>
    )
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
            {tCore('changes.inspector.from-label')}
          </Text>
          <VersionName version={referenceVersion} />
          <Text size={1} muted as="div" trim={true}>
            {tCore('changes.inspector.to-label')}
          </Text>
          <VersionName version={comparingVersion} />
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

/** A side's document, and whether its edit state has loaded (so missing is not mistaken for loading). */
function useSide(side: ComparisonSide) {
  const editState = useEditState(
    getPublishedId(side.id),
    side.type,
    'low',
    getVersionFromId(side.id),
  )
  return {value: pickVersion(side.id, editState), ready: editState.ready}
}

function PanelMessage({children}: {children: ReactNode}) {
  return (
    <Box paddingY={2}>
      <Text muted size={1}>
        {children}
      </Text>
    </Box>
  )
}

/**
 * The compared side's own history, laid out as the History tab's timeline. No item menus and no
 * selection, so nothing here restores or changes the comparison.
 */
function ComparisonHistory({comparing}: {comparing: ComparisonSide}) {
  const {t} = useTranslation('studio')
  const {t: tStructure} = useTranslation(structureLocaleNamespace)
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null)
  const {events, loading, nextCursor, loadMoreEvents} = useEventsStore({
    documentId: comparing.id,
    documentType: comparing.type,
  })

  let content: ReactNode
  if (loading && events.length === 0) {
    content = <LoadingBlock />
  } else if (events.length === 0) {
    content = (
      <Flex padding={3} gap={3} flexDirection="column">
        <Text size={1} weight="medium" as="div" trim={true}>
          {t('timeline.error.no-document-history-title')}
        </Text>
        <Text muted size={1} as="div" trim={true}>
          {t('timeline.error.no-document-history-description')}
        </Text>
      </Flex>
    )
  } else {
    content = (
      <>
        {events.map((event: DocumentGroupEvent) => (
          <Box key={event.id} paddingBottom={1} paddingX={1}>
            <EventTimelineItem event={event} isSelected={false} onSelect={noop} />
          </Box>
        ))}
        {nextCursor ? (
          <Box padding={1}>
            <Button
              mode="bleed"
              text={tStructure('compare-versions.panel.load-more')}
              onClick={loadMoreEvents}
              loading={loading}
            />
          </Box>
        ) : null}
      </>
    )
  }

  return (
    <Flex data-testid="comparison-history" flexDirection="column" height="100%">
      <Card flex={1} padding={2} paddingTop={0}>
        <BoundaryElementProvider element={scrollRef}>
          <ScrollContainer className={scroller} data-ui="Scroller" ref={setScrollRef}>
            {content}
          </ScrollContainer>
        </BoundaryElementProvider>
      </Card>
    </Flex>
  )
}
