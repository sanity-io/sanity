import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {isShown, settleOpenTooltip} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {LocaleProvider} from '../../../../i18n/components/LocaleProvider'
import {
  type CreateDocumentVersionEvent,
  type DeleteDocumentVersionEvent,
  type EditDocumentVersionEvent,
  type PublishDocumentVersionEvent,
} from '../../../../store/events/types'
import {Event} from '../Event'

// Fixed past timestamps: `useRelativeTime` renders dates in another year as a
// plain date and never schedules a refresh. `doug` is the mock workspace's
// current user, the only id the mock client can resolve to a name.
const TIMESTAMP = '2020-06-15T12:00:00.000Z'

const EDIT_EVENT: EditDocumentVersionEvent = {
  type: 'editDocumentVersion',
  id: 'edit-1',
  timestamp: TIMESTAMP,
  author: 'doug',
  documentVariantType: 'draft',
  documentId: 'article-1',
  contributors: ['doug'],
  revisionId: 'rev-2',
  transactions: [
    {type: 'editTransaction', author: 'doug', timestamp: TIMESTAMP, revisionId: 'rev-2'},
  ],
}

const CREATE_EVENT: CreateDocumentVersionEvent = {
  type: 'createDocumentVersion',
  id: 'create-1',
  timestamp: '2020-06-14T12:00:00.000Z',
  author: 'doug',
  documentVariantType: 'draft',
  documentId: 'article-1',
  versionId: 'drafts.article-1',
  versionRevisionId: 'rev-1',
}

const PUBLISH_EVENT: PublishDocumentVersionEvent = {
  type: 'publishDocumentVersion',
  id: 'publish-1',
  timestamp: '2020-06-16T12:00:00.000Z',
  author: 'doug',
  documentVariantType: 'published',
  documentId: 'article-1',
  revisionId: 'rev-3',
  versionId: 'drafts.article-1',
  publishCause: 'document.publish',
}

const DISCARD_EVENT: DeleteDocumentVersionEvent = {
  type: 'deleteDocumentVersion',
  id: 'discard-1',
  timestamp: '2020-06-17T12:00:00.000Z',
  author: 'doug',
  documentVariantType: 'draft',
  documentId: 'article-1',
  versionId: 'drafts.article-1',
  versionRevisionId: 'rev-4',
}

const openTooltipText = () =>
  Array.from(document.querySelectorAll('[data-ui="Tooltip"]'))
    .filter(isShown)
    .map((tooltip) => tooltip.textContent)

function EventRow({
  label,
  testId,
  children,
}: {
  label: string
  testId: string
  children: React.ReactNode
}) {
  return (
    <VStack gap={2} data-testid={testId}>
      <Text muted size={1} weight="medium">
        {label}
      </Text>
      {children}
    </VStack>
  )
}

// `TestWrapper` mounts no locale provider, and the relative / absolute date
// formatters read the current locale.
function EventHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <LocaleProvider>
        <Card padding={4} style={{maxWidth: 420}}>
          <VStack gap={5}>
            <EventRow label="editDocumentVersion, changes-by tooltip" testId="event-edit">
              <Event event={EDIT_EVENT} showChangesBy="tooltip" />
            </EventRow>
            <EventRow label="createDocumentVersion" testId="event-create">
              <Event event={CREATE_EVENT} showChangesBy="tooltip" />
            </EventRow>
            <EventRow label="publishDocumentVersion, no release" testId="event-publish">
              <Event event={PUBLISH_EVENT} showChangesBy="tooltip" />
            </EventRow>
            <EventRow label="deleteDocumentVersion" testId="event-discard">
              <Event event={DISCARD_EVENT} showChangesBy="tooltip" />
            </EventRow>
            <EventRow label="editDocumentVersion, changes-by inline" testId="event-edit-inline">
              <Event event={EDIT_EVENT} showChangesBy="inline" />
            </EventRow>
          </VStack>
        </Card>
      </LocaleProvider>
    </TestWrapper>
  )
}

describe('Event', () => {
  it('renders each event kind and lists the contributors of an edit on hover', async () => {
    void render(<EventHarness />)

    const edit = page.getByTestId('event-edit')
    await expect.element(edit.getByText('Edited', {exact: true})).toBeVisible()
    await expect.element(edit.getByText('Jun 15, 2020', {exact: true})).toBeVisible()
    await expect.element(page.getByTestId('event-create').getByText('Draft created')).toBeVisible()
    await expect.element(page.getByTestId('event-publish').getByText('Published')).toBeVisible()
    await expect
      .element(page.getByTestId('event-publish').getByText('Draft', {exact: true}))
      .toBeVisible()
    await expect
      .element(page.getByTestId('event-discard').getByText('Discarded draft'))
      .toBeVisible()

    // The inline variant lists the contributors below the event.
    const inline = page.getByTestId('event-edit-inline')
    await expect.element(inline.getByText('Changes by', {exact: true})).toBeVisible()
    await expect.element(inline.getByText('Doug', {exact: true})).toBeVisible()

    // The tooltip variant lists them on hover of the trailing avatar stack
    // (the leading stack is the event author).
    expect(edit.getByText('Changes by', {exact: true}).elements()).toHaveLength(0)
    const stacks = edit.element().querySelectorAll('[data-ui="AvatarStack"]')
    expect(stacks).toHaveLength(2)
    await userEvent.hover(stacks[1])
    // Heading, avatar initial, display name.
    await expect.poll(openTooltipText).toEqual(['Changes byDDoug'])

    await settleOpenTooltip()
  })
})
