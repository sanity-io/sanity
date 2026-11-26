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
    {
      name: 'translations',
      title: 'Translations',
      type: 'object',
      fields: [{name: 'sv', title: 'Swedish', type: 'string'}],
    },
    {
      name: 'summary',
      title: 'A summary of the author for the people browsing the list of authors',
      type: 'string',
    },
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

  it('keeps the changes open while the pointer is on them, so long ones can be scrolled', async () => {
    const {changes$} = renderItem(EDIT_EVENT)

    await userEvent.hover(page.getByTestId('timeline-item-button'))
    changes$.next({loading: false, diff: DIFF, error: null})
    const changes = page.getByTestId('edit-event-changes')
    await expect.element(changes).toBeVisible()

    await userEvent.hover(changes)
    await new Promise((resolve) => setTimeout(resolve, 800))
    await expect.element(changes).toBeVisible()
    const scroller = changes.element().parentElement!
    expect(getComputedStyle(scroller).overflowY).toBe('auto')
    expect(getComputedStyle(scroller).maxHeight).not.toBe('none')
  })

  it('colors each change with its author, and tells who made it when hovering it', async () => {
    const {changes$} = renderItem(EDIT_EVENT)

    await userEvent.hover(page.getByTestId('timeline-item-button'))
    const annotation = {author: 'doug', timestamp: TIMESTAMP}
    changes$.next({
      loading: false,
      error: null,
      diff: diffInput(
        wrap({name: 'Ada'}, annotation),
        wrap({name: 'Ada Lovelace'}, annotation),
      ) as ObjectDiff,
    })
    const changes = page.getByTestId('edit-event-changes')
    await expect.element(changes.getByText('Name', {exact: true})).toBeVisible()

    const added = changes.element().querySelector('ins')!
    expect(added.textContent).toBe(' Lovelace')
    const card = added.closest<HTMLElement>('[data-ui="diff-card"]')!
    await userEvent.hover(card)
    const label = page.getByText('Added', {exact: true})
    await expect.element(label).toBeVisible()
    const tooltip = page.elementLocator(label.element().closest('[data-ui="Tooltip"]')!)
    const author = tooltip.getByText('Doug', {exact: true})
    await expect.element(author).toBeVisible()
    // The changes stay open under the author's tooltip.
    await expect.element(changes).toBeVisible()
    // The card has the color of its author, the one of the author's pill in the tooltip.
    const pill = author.element().closest<HTMLElement>('[style*="background-color"]')!
    expect(getComputedStyle(card).backgroundColor).toBe(getComputedStyle(pill).backgroundColor)
    expect(getComputedStyle(card).backgroundColor).not.toBe(resolvedColor(card, '--card-bg-color'))
  })

  it('shows the contributors of an edit once, as the avatars of the row', async () => {
    renderItem({...EDIT_EVENT, contributors: ['doug', 'pedro']})

    const card = page.getByTestId('timeline-item-button')
    await expect.element(card).toBeVisible()
    const stacks = card.element().querySelectorAll('[data-ui="AvatarStack"]')
    expect(stacks).toHaveLength(1)
    // One entry per contributor (the mock workspace only resolves `doug`, the other one loads).
    expect(stacks[0].children).toHaveLength(2)
  })

  it('lists the titles of the fields an edit changed next to its label, two at most', async () => {
    const {changes$} = renderItem(EDIT_EVENT)

    changes$.next({
      loading: false,
      error: null,
      diff: diffInput(
        wrap({name: 'Ada'}, null),
        wrap({name: 'Ada Lovelace', role: 'developer', translations: {sv: 'Ada'}}, null),
      ) as ObjectDiff,
    })
    const titles = page.getByTestId('changed-field-titles')
    await expect.element(titles).toBeVisible()
    expect(titles.element().textContent).toBe('Name, Role, and more')
    expect(titles.element().getAttribute('title')).toBe('Name, Role, Translations › Swedish')
    // Secondary to the label, in the card's muted color.
    expect(getComputedStyle(titles.element()).color).toBe(
      resolvedColor(titles.element(), '--card-muted-fg-color'),
    )
  })

  it('shows the title path of a nested field, and truncates what does not fit', async () => {
    const {changes$} = renderItem(EDIT_EVENT)
    const card = page.getByTestId('timeline-item-button')
    await expect.element(card).toBeVisible()
    const rowHeight = card.element().getBoundingClientRect().height

    changes$.next({
      loading: false,
      error: null,
      diff: diffInput(
        wrap({}, null),
        wrap({translations: {sv: 'Ada'}, summary: 'Mathematician'}, null),
      ) as ObjectDiff,
    })
    const titles = page.getByTestId('changed-field-titles')
    await expect.element(titles).toBeVisible()
    // A chevron separates the segments of a title path, like the change list headers.
    expect(titles.element().querySelectorAll('svg')).toHaveLength(1)
    expect(titles.element().textContent).toBe(
      'TranslationsSwedish, A summary of the author for the people browsing the list of authors',
    )
    // The titles stay on the label's line, cut short, and the row keeps its height.
    const line = titles.element().firstElementChild!
    expect(line.scrollWidth).toBeGreaterThan(line.clientWidth)
    expect(card.element().getBoundingClientRect().height).toBe(rowHeight)
    let container = card.element().parentElement!
    while (getComputedStyle(container).display === 'contents') container = container.parentElement!
    expect(card.element().getBoundingClientRect().right).toBeLessThanOrEqual(
      container.getBoundingClientRect().right,
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
