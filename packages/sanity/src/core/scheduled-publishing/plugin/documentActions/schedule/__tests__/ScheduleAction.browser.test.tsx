import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {useState} from 'react'
import {of} from 'rxjs'
import {
  ScheduledPublishingEnabledContext,
  type ScheduledPublishingEnabledContextValue,
} from 'sanity/_singletons'
import {SWRConfig} from 'swr'
import {Box, VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {createMockSanityClient} from '../../../../../../../test/mocks/mockSanityClient'
import {Button} from '../../../../../../ui-components/button/Button'
import {
  type DocumentActionModalDialogProps,
  type DocumentActionProps,
} from '../../../../../config/document/actions'
import {administrator} from '../../../../../store/grants/debug/exampleGrants'
import {type Schedule} from '../../../../types'
import {NewScheduleInfo} from '../NewScheduleInfo'
import {useScheduleAction} from '../ScheduleAction'
import Schedules from '../Schedules'

const SCHEMA_TYPES = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [{name: 'title', title: 'Title', type: 'string'}],
  },
]

const DRAFT: SanityDocument = {
  _id: 'drafts.article-1',
  _type: 'article',
  _rev: 'rev-1',
  _createdAt: '2024-01-01T09:00:00.000Z',
  _updatedAt: '2024-01-02T09:00:00.000Z',
  title: 'Scheduled article',
}

// The props the document pane hands to a document action for an existing draft.
const ACTION_PROPS: DocumentActionProps = {
  id: 'article-1',
  type: 'article',
  draft: DRAFT,
  published: null,
  version: null,
  liveEdit: false,
  liveEditSchemaType: false,
  ready: true,
  release: undefined,
  scopeId: undefined,
  transactionSyncLock: null,
  initialValueResolved: true,
  // oxlint-disable-next-line no-deprecated -- the action closes its dialog through this callback
  onComplete: () => {},
}

const UPCOMING_PUBLISH: Schedule = {
  author: 'doug',
  action: 'publish',
  createdAt: '2024-01-01T09:00:00.000Z',
  dataset: 'mock-data-set',
  description: '',
  documents: [{documentId: 'article-1', documentType: 'article'}],
  executeAt: '2024-01-15T10:00:00.000Z',
  id: 'publish-1',
  name: 'schedule',
  projectId: 'mock-project-id',
  state: 'scheduled',
  stateReason: '',
}

// `usePollSchedules` reads this endpoint through the workspace client (project and dataset of the mock).
const SCHEDULES_URL = '/schedules/mock-project-id/mock-data-set'

const ENABLED: ScheduledPublishingEnabledContextValue = {
  enabled: true,
  mode: 'default',
  hasUsedScheduledPublishing: {used: true, loading: false},
}

// A fresh SWR cache per mounted tree keeps the two dialogs from sharing each other's responses.
const swrProvider = () => new Map()

/**
 * Stands in for the document pane's `ModalDialog`: lays out the action's header, content and
 * footer in one card so the whole dialog is part of the archived end state.
 */
function ActionDialogFrame({dialog}: {dialog: DocumentActionModalDialogProps}) {
  return (
    <Card border radius={3} data-testid="schedule-dialog" style={{width: 520}}>
      <Card borderBottom padding={4} radius={3}>
        <Text size={1} weight="semibold">
          {dialog.header}
        </Text>
      </Card>
      <Box padding={4}>{dialog.content}</Box>
      {dialog.footer && (
        <Card borderTop padding={4} radius={3}>
          {dialog.footer}
        </Card>
      )}
    </Card>
  )
}

function ScheduleActionButton() {
  // oxlint-disable-next-line no-deprecated -- the deprecated action is the surface under test
  const action = useScheduleAction(ACTION_PROPS)

  if (!action) return null

  return (
    <VStack gap={4}>
      <Box>
        <Button
          data-testid="schedule-action"
          disabled={action.disabled}
          icon={action.icon}
          onClick={action.onHandle}
          text={action.label}
          tooltipProps={action.title ? {content: action.title} : null}
        />
      </Box>
      {action.dialog && action.dialog.type === 'dialog' && (
        <ActionDialogFrame dialog={action.dialog} />
      )}
    </VStack>
  )
}

// What the preview store's batched field query finds for the scheduled document, under either id.
const PREVIEW_DOCUMENTS = [
  {_id: 'drafts.article-1', _type: 'article', title: 'Scheduled article'},
  {_id: 'article-1', _type: 'article', title: 'Scheduled article'},
]

function createClient(schedules: Schedule[]): SanityClient {
  const client = createMockSanityClient({
    requests: {
      [SCHEDULES_URL]: {schedules},
      // The publish permission check behind the action reads the dataset ACL.
      '/acl': administrator,
    },
  })
  // The preview store reads fields through one GROQ query per selection and expects an array of
  // matches per selection, while the mock resolves every `fetch` with `null`. Every other query
  // (releases, variants) keeps the mock's answer.
  const {fetch} = client.observable
  client.observable.fetch = (query: string, params?: unknown, options?: {tag?: string}) =>
    options?.tag === 'preview.document-paths' ? of([PREVIEW_DOCUMENTS]) : fetch(query, params)
  return client as unknown as SanityClient
}

function ScheduleActionHarness({schedules}: {schedules: Schedule[]}) {
  const [client] = useState(() => createClient(schedules))

  return (
    <TestWrapper client={client} schemaTypes={SCHEMA_TYPES}>
      <SWRConfig value={{provider: swrProvider}}>
        <ScheduledPublishingEnabledContext.Provider value={ENABLED}>
          <ScheduleActionButton />
        </ScheduledPublishingEnabledContext.Provider>
      </SWRConfig>
    </TestWrapper>
  )
}

function DialogContentHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <ScheduledPublishingEnabledContext.Provider value={ENABLED}>
        <VStack gap={5} data-testid="dialog-content">
          <NewScheduleInfo id="article-1" schemaType="article" />
          <Schedules schedules={[]} />
        </VStack>
      </ScheduledPublishingEnabledContext.Provider>
    </TestWrapper>
  )
}

describe('ScheduleAction', () => {
  test('opens the new schedule dialog when the document has no schedules', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ScheduleActionHarness schedules={[]} />)

    const button = page.getByTestId('schedule-action')
    await expect.element(button).toHaveTextContent('Schedule')
    await expect.element(button).toBeEnabled()

    await button.click()

    const dialog = page.getByTestId('schedule-dialog')
    await expect
      .element(
        dialog.getByText('Schedule this document to be published at any time in the future.'),
      )
      .toBeVisible()
    await expect.element(dialog.getByRole('button', {name: 'Cancel'})).toBeEnabled()
    // No date has been picked yet, so the schedule button in the footer stays disabled.
    await expect.element(dialog.getByRole('button', {name: 'Schedule'})).toBeDisabled()

    await settleChromaticEndState()
  })

  test('lists the existing schedules in the edit dialog', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ScheduleActionHarness schedules={[UPCOMING_PUBLISH]} />)

    const button = page.getByTestId('schedule-action')
    await expect.element(button).toHaveTextContent('Edit Schedule')
    await expect.element(button).toBeEnabled()

    await button.click()

    const dialog = page.getByTestId('schedule-dialog')
    // The document pane already shows the document, so the item carries only date and author.
    await expect.element(dialog.getByText('Monday, 15 January 2024, 10:00 AM')).toBeVisible()
    await expect.element(dialog.getByText('Document not found')).not.toBeInTheDocument()
    // Editing an existing schedule happens from the item itself, so there is no footer action.
    await expect.element(dialog.getByRole('button', {name: 'Cancel'})).not.toBeInTheDocument()

    await settleChromaticEndState()
  })

  test('renders the dialog copy and the empty schedule list', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<DialogContentHarness />)

    const content = page.getByTestId('dialog-content')
    await expect
      .element(content.getByText('Visit the Schedules page to get an overview of all schedules.'))
      .toBeVisible()
    await expect.element(content.getByText('No schedules')).toBeVisible()

    await settleChromaticEndState()
  })
})
