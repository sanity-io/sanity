import {diffInput, wrap} from '@sanity/diff'
import {type Path} from '@sanity/types'
import {type ReactNode, useMemo, useState} from 'react'
import {
  ChangeList,
  type DocumentGroupEvent,
  getPublishedId,
  getVersionFromId,
  LoadingBlock,
  NoChanges,
  type ObjectDiff,
  type ObjectSchemaType,
  useEditState,
  useEventsStore,
  useSchema,
  useTranslation,
} from 'sanity'
import {DocumentChangeContext} from 'sanity/_singletons'
import {Box, Text} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {structureLocaleNamespace} from '../../i18n'
import {EventTimelineItem} from '../../panes/document/timeline/events/EventTimelineItem'
import {
  comparisonChangesPanel,
  comparisonChangesPanelBody,
  comparisonChangesPanelTabs,
} from './ComparisonChangesPanel.css'
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

/**
 * Review changes inside the comparison view: what differs between the two sides, field by field,
 * and the history of the side being compared. Read only: no revert, no restore.
 *
 * @internal
 */
export function ComparisonChangesPanel({
  reference,
  comparing,
}: {
  reference: ComparisonSide
  comparing: ComparisonSide
}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const [tab, setTab] = useState<'changes' | 'history'>('changes')

  return (
    <aside className={comparisonChangesPanel} data-testid="comparison-changes-panel">
      <div className={comparisonChangesPanelTabs} role="tablist">
        <Button
          mode="bleed"
          role="tab"
          aria-selected={tab === 'changes'}
          selected={tab === 'changes'}
          text={t('compare-versions.panel.changes')}
          onClick={() => setTab('changes')}
        />
        <Button
          mode="bleed"
          role="tab"
          aria-selected={tab === 'history'}
          selected={tab === 'history'}
          text={t('compare-versions.panel.history')}
          onClick={() => setTab('history')}
        />
      </div>
      <div className={comparisonChangesPanelBody} role="tabpanel">
        {tab === 'changes' ? (
          <ComparisonChanges reference={reference} comparing={comparing} />
        ) : (
          <ComparisonHistory comparing={comparing} />
        )}
      </div>
    </aside>
  )
}

/** Every field that differs between the two sides, as Review changes lists them. */
function ComparisonChanges({
  reference,
  comparing,
}: {
  reference: ComparisonSide
  comparing: ComparisonSide
}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const schemaType = useSchema().get(comparing.type) as ObjectSchemaType | undefined
  const referenceSide = useSide(reference)
  const comparingSide = useSide(comparing)
  const referenceValue = referenceSide.value
  const comparingValue = comparingSide.value

  const diff = useMemo(
    () =>
      // Two separate versions have no shared history, so the diff carries no authors: who made a
      // change is in the History tab.
      diffInput(
        wrap(referenceValue ?? {}, {author: ''}),
        wrap(comparingValue ?? {}, {author: ''}),
      ) as ObjectDiff,
    [referenceValue, comparingValue],
  )

  if (!schemaType || !referenceSide.ready || !comparingSide.ready) {
    return <LoadingBlock showText />
  }
  if (!referenceValue || !comparingValue) {
    // A side names a version that does not exist; that side already says so
    return <PanelMessage>{t('compare-versions.panel.missing-side')}</PanelMessage>
  }
  if (!diff.isChanged) {
    return <NoChanges />
  }

  return (
    <DocumentChangeContext.Provider
      value={{
        // The document group's id, as Review changes passes it; the store refuses a draft id here
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
      <ChangeList diff={diff} schemaType={schemaType} />
    </DocumentChangeContext.Provider>
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
    <Box padding={2}>
      <Text muted size={1}>
        {children}
      </Text>
    </Box>
  )
}

/** The compared side's own history: who changed it, and when. No item menus, so nothing to restore. */
function ComparisonHistory({comparing}: {comparing: ComparisonSide}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const {events, loading, nextCursor, loadMoreEvents} = useEventsStore({
    documentId: comparing.id,
    documentType: comparing.type,
  })

  if (loading && events.length === 0) {
    return <LoadingBlock showText />
  }
  if (events.length === 0) {
    return <PanelMessage>{t('compare-versions.panel.no-history')}</PanelMessage>
  }

  return (
    <>
      {events.map((event: DocumentGroupEvent) => (
        <EventTimelineItem key={event.id} event={event} isSelected={false} onSelect={noop} />
      ))}
      {nextCursor ? (
        <Box paddingTop={2}>
          <Button
            mode="bleed"
            text={t('compare-versions.panel.load-more')}
            onClick={loadMoreEvents}
            loading={loading}
          />
        </Box>
      ) : null}
    </>
  )
}
