import {type SanityDocument} from '@sanity/client'
import {type SchemaType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {useDocumentPairPermissionsMockReturn} from '../../../../../../test/mocks/useDocumentPairPermissions.mock'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type DocumentActionComponent} from '../../../../config/document/actions'
import {type SingleWorkspace} from '../../../../config/types'
import {type Schedule} from '../../../types'
import ToolPreview from '../ToolPreview'

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  IntentLink: ({children}: {children: ReactNode}) => <div>{children}</div>,
}))

vi.mock('../../../../store/grants/documentPairPermissions', () => ({
  useDocumentPairPermissions: vi.fn(() => useDocumentPairPermissionsMockReturn),
}))

vi.mock('../PreviewWrapper', () => ({
  default: ({contextMenu}: {contextMenu: ReactNode}) => <div>{contextMenu}</div>,
}))

// `publish` is contributed by the structure tool, which the core test harness does not load.
const publishAction: DocumentActionComponent = Object.assign(() => null, {
  action: 'publish' as const,
})

const withPublishConfigured: Partial<SingleWorkspace> = {
  document: {actions: (prev) => [...prev, publishAction]},
}

const withPublishFiltered: Partial<SingleWorkspace> = {
  document: {
    actions: (prev) => [...prev, publishAction].filter((action) => action.action !== 'publish'),
  },
}

const authorSchemaType = {name: 'author', title: 'Author', jsonType: 'object'} as SchemaType

const draftDocument = {_id: 'drafts.author-1', _type: 'author'} as SanityDocument

const scheduledSchedule: Schedule = {
  author: 'doug',
  action: 'publish',
  createdAt: '2026-08-01T00:00:00.000Z',
  dataset: 'mock-data-set',
  description: '',
  documents: [{documentId: 'drafts.author-1', documentType: 'author'}],
  executeAt: '2026-09-01T00:00:00.000Z',
  id: 'schedule-1',
  name: 'schedule-1',
  projectId: 'mock-project-id',
  state: 'scheduled',
  stateReason: '',
}

const completedSchedule: Schedule = {...scheduledSchedule, state: 'succeeded'}

async function renderContextMenu(config: Partial<SingleWorkspace>, schedule: Schedule) {
  const wrapper = await createTestProvider({config})

  render(
    <ToolPreview
      previewState={{isLoading: false, draft: draftDocument, published: null}}
      schedule={schedule}
      schemaType={authorSchemaType}
    />,
    {wrapper},
  )

  await userEvent.click(screen.getByRole('button'))
}

describe('ToolPreview', () => {
  it('offers Publish now while publish is configured', async () => {
    await renderContextMenu(withPublishConfigured, scheduledSchedule)

    expect(screen.getByText('Publish now')).toBeInTheDocument()
  })

  it('hides Publish now when publish is omitted from document.actions', async () => {
    await renderContextMenu(withPublishFiltered, scheduledSchedule)

    expect(screen.queryByText('Publish now')).not.toBeInTheDocument()
  })

  it('keeps Edit schedule and Delete schedule while publish is configured', async () => {
    await renderContextMenu(withPublishConfigured, scheduledSchedule)

    expect(screen.getByText('Edit schedule')).toBeInTheDocument()
    expect(screen.getByText('Delete schedule')).toBeInTheDocument()
  })

  it('keeps Edit schedule and Delete schedule when publish is omitted', async () => {
    await renderContextMenu(withPublishFiltered, scheduledSchedule)

    expect(screen.getByText('Edit schedule')).toBeInTheDocument()
    expect(screen.getByText('Delete schedule')).toBeInTheDocument()
  })

  it('keeps Clear completed schedule while publish is configured', async () => {
    await renderContextMenu(withPublishConfigured, completedSchedule)

    expect(screen.getByText('Clear completed schedule')).toBeInTheDocument()
  })

  it('keeps Clear completed schedule when publish is omitted', async () => {
    await renderContextMenu(withPublishFiltered, completedSchedule)

    expect(screen.getByText('Clear completed schedule')).toBeInTheDocument()
  })
})
