import {diffInput, wrap} from '@sanity/diff'
import {type ObjectSchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {BehaviorSubject, type Observable} from 'rxjs'
import {
  defineType,
  type EditDocumentVersionEvent,
  LocaleProvider,
  type ObjectDiff,
  type PublishDocumentVersionEvent,
  type useEvents,
  useSchema,
  useWorkspace,
  type WorkspaceSummary,
} from 'sanity'
import {ActiveWorkspaceMatcherContext, DocumentPaneContext, EventsContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {EventTimelineItem} from '../EventTimelineItem'

type EditChanges = {loading: boolean; diff: ObjectDiff | null; error: Error | null}
type GetEditChanges = ReturnType<typeof useEvents>['getEditChanges']

const authorType = defineType({
  name: 'author',
  type: 'document',
  fields: [
    {name: 'name', title: 'Name', type: 'string'},
    {name: 'role', title: 'Role', type: 'string'},
  ],
})

const TIMESTAMP = '2020-06-15T12:00:00.000Z'

const EDIT_EVENT: EditDocumentVersionEvent = {
  type: 'editDocumentVersion',
  id: 'rev-3',
  revisionId: 'rev-3',
  timestamp: TIMESTAMP,
  author: 'doug',
  contributors: ['doug'],
  documentId: 'drafts.article-1',
  documentVariantType: 'draft',
  transactions: [
    {type: 'editTransaction', author: 'doug', timestamp: TIMESTAMP, revisionId: 'rev-3'},
    {type: 'editTransaction', author: 'doug', timestamp: TIMESTAMP, revisionId: 'rev-2'},
    {type: 'editTransaction', author: 'doug', timestamp: TIMESTAMP, revisionId: 'rev-1'},
  ],
}

const PUBLISH_EVENT: PublishDocumentVersionEvent = {
  type: 'publishDocumentVersion',
  id: 'rev-4',
  revisionId: 'rev-4',
  timestamp: TIMESTAMP,
  author: 'doug',
  documentId: 'drafts.article-1',
  documentVariantType: 'draft',
  versionId: 'drafts.article-1',
  publishCause: 'document.publish',
}

const DIFF = diffInput(
  wrap({name: 'Ada', role: 'developer'}, null),
  wrap({name: 'Ada Lovelace', role: 'developer'}, null),
) as ObjectDiff

function PaneProviders({
  children,
  getEditChanges,
}: {
  children: ReactNode
  getEditChanges: GetEditChanges
}) {
  const schemaType = useSchema().get('author') as ObjectSchemaType
  const workspace = useWorkspace()
  // The document operation hooks of the change list only read these fields of the active workspace.
  const activeWorkspace = {
    type: 'workspace-summary',
    name: workspace.name,
    basePath: workspace.basePath,
    projectId: workspace.projectId,
    dataset: workspace.dataset,
  } as WorkspaceSummary
  const pane = {
    documentId: 'article-1',
    documentType: 'author',
    schemaType,
    value: {_id: 'drafts.article-1', _type: 'author', name: 'Ada Lovelace'},
  } as unknown as DocumentPaneContextValue
  const events = {getEditChanges} as unknown as ReturnType<typeof useEvents>

  return (
    <ActiveWorkspaceMatcherContext value={{activeWorkspace, setActiveWorkspace: () => {}}}>
      <EventsContext.Provider value={events}>
        <DocumentPaneContext value={pane}>{children}</DocumentPaneContext>
      </EventsContext.Provider>
    </ActiveWorkspaceMatcherContext>
  )
}

/** The computed value of a color variable as seen from inside `element`. */
function resolvedColor(element: Element, variable: string): string {
  const probe = document.createElement('span')
  probe.style.color = `var(${variable})`
  element.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

function renderItem(event: EditDocumentVersionEvent | PublishDocumentVersionEvent) {
  const changes$ = new BehaviorSubject<EditChanges>({loading: true, diff: null, error: null})
  const getEditChanges = vi.fn<GetEditChanges>(() => changes$ as Observable<EditChanges>)
  void render(
    <TestWrapper schemaTypes={[authorType]}>
      <LocaleProvider>
        <PaneProviders getEditChanges={getEditChanges}>
          {/* Room on the left, where the changes show. */}
          <Card padding={2} style={{width: 320, marginLeft: 480}}>
            <EventTimelineItem event={event} isSelected={false} onSelect={() => {}} />
          </Card>
        </PaneProviders>
      </LocaleProvider>
    </TestWrapper>,
  )
  return {changes$, getEditChanges}
}

describe('EventTimelineItem changes', () => {
  it('shows what an edit event changed when hovering it, without revert actions', async () => {
    const {changes$, getEditChanges} = renderItem(EDIT_EVENT)

    await userEvent.hover(page.getByTestId('timeline-item-button'))
    await expect.element(page.getByText('Loading changes…')).toBeVisible()
    // The changes of the whole group, from its oldest transaction to its newest.
    expect(getEditChanges).toHaveBeenCalledWith({fromRevisionId: 'rev-1', toRevisionId: 'rev-3'})

    changes$.next({loading: false, diff: DIFF, error: null})
    const changes = page.getByTestId('edit-event-changes')
    await expect.element(changes).toBeVisible()
    await expect.element(changes.getByText('Name', {exact: true})).toBeVisible()
    await expect.element(changes.getByText('Ada Lovelace')).toBeVisible()
    // Only the changed field is listed, and nothing can be reverted from here.
    expect(changes.getByText('Role', {exact: true}).elements()).toHaveLength(0)
    expect(
      changes.element().querySelectorAll('[data-testid^="single-change-revert-button"]'),
    ).toHaveLength(0)
  })

  it('shows additions on a green background and removals on a red one', async () => {
    const {changes$} = renderItem(EDIT_EVENT)

    await userEvent.hover(page.getByTestId('timeline-item-button'))
    changes$.next({
      loading: false,
      error: null,
      diff: diffInput(
        wrap({name: 'Ada Lovelace'}, null),
        wrap({name: 'Ada', role: 'developer'}, null),
      ) as ObjectDiff,
    })
    const changes = page.getByTestId('edit-event-changes')
    await expect.element(changes.getByText('Role', {exact: true})).toBeVisible()

    const removed = changes.element().querySelector('del')!
    const added = changes.element().querySelector('ins')!
    expect(removed.textContent).toBe(' Lovelace')
    expect(added.textContent).toBe('developer')
    const removedCard = removed.closest('[data-ui="diff-card"]')!
    const addedCard = added.closest('[data-ui="diff-card"]')!
    expect(getComputedStyle(removedCard).backgroundColor).toBe(
      resolvedColor(removedCard, '--card-badge-critical-bg-color'),
    )
    expect(getComputedStyle(removed).color).toBe(
      resolvedColor(removedCard, '--card-badge-critical-fg-color'),
    )
    expect(getComputedStyle(addedCard).backgroundColor).toBe(
      resolvedColor(addedCard, '--card-badge-positive-bg-color'),
    )
    expect(getComputedStyle(added).color).toBe(
      resolvedColor(addedCard, '--card-badge-positive-fg-color'),
    )
  })

  it('shows the changes of a single listed transaction', async () => {
    const transaction: EditDocumentVersionEvent = {
      ...EDIT_EVENT,
      id: 'rev-2',
      revisionId: 'rev-2',
      transactions: [EDIT_EVENT.transactions[1]],
      parentId: 'rev-3',
      isTransaction: true,
    }
    const {getEditChanges} = renderItem(transaction)

    await userEvent.hover(page.getByTestId('timeline-item-button'))
    await expect.element(page.getByText('Loading changes…')).toBeVisible()
    expect(getEditChanges).toHaveBeenCalledWith({fromRevisionId: 'rev-2', toRevisionId: 'rev-2'})
  })

  it('tells when the changes could not be loaded, or there are none', async () => {
    const {changes$} = renderItem(EDIT_EVENT)

    await userEvent.hover(page.getByTestId('timeline-item-button'))
    changes$.next({loading: false, diff: null, error: new Error('Missing document')})
    await expect.element(page.getByText('Could not load the changes')).toBeVisible()

    changes$.next({
      loading: false,
      diff: diffInput(wrap({name: 'Ada'}, null), wrap({name: 'Ada'}, null)) as ObjectDiff,
      error: null,
    })
    await expect.element(page.getByText('There are no changes')).toBeVisible()
  })

  it('does not show changes for other events', async () => {
    const {getEditChanges} = renderItem(PUBLISH_EVENT)

    await userEvent.hover(page.getByTestId('timeline-item-button'))
    // Longer than the changes tooltip delay.
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(getEditChanges).not.toHaveBeenCalled()
    expect(page.getByText('Loading changes…').elements()).toHaveLength(0)
  })
})
