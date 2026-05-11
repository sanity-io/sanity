import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {AgentActionsMenu} from './AgentActionsMenu'

const updateReleaseMock = vi.fn().mockResolvedValue(undefined)
const promptMock = vi.fn()

vi.mock('../../../../hooks/useClient', () => ({
  useClient: () => ({
    agent: {
      action: {
        prompt: promptMock,
      },
    },
  }),
}))

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: () => ({
    updateRelease: updateReleaseMock,
  }),
}))

const baseRelease: ReleaseDocument = {
  _id: '_.releases.release1',
  _type: 'system.release',
  _rev: 'rev1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  state: 'active',
  metadata: {
    title: 'My release',
    description: 'Existing description.',
    releaseType: 'asap',
  },
} as unknown as ReleaseDocument

const expectedReleaseName = getReleaseIdFromReleaseDocumentId(baseRelease._id)

async function renderMenu() {
  const wrapper = await createTestProvider()
  return render(<AgentActionsMenu release={baseRelease} />, {wrapper})
}

describe('AgentActionsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a menu trigger button with the sparkles icon', async () => {
    await renderMenu()

    const trigger = screen.getByTestId('release-agent-actions-button')
    expect(trigger).toBeInTheDocument()
  })

  it('clicking "Generate summary" triggers agent prompt and appends to description', async () => {
    promptMock.mockResolvedValue('Generated summary text.')

    await renderMenu()

    await userEvent.click(screen.getByTestId('release-agent-actions-button'))
    const generateItem = await screen.findByTestId('agent-action-generate-summary')
    await userEvent.click(generateItem)

    await waitFor(() => {
      expect(updateReleaseMock).toHaveBeenCalledTimes(1)
    })

    expect(updateReleaseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          description: 'Existing description.\n\nGenerated summary text.',
        }),
      }),
    )

    expect(promptMock).toHaveBeenCalledTimes(1)

    const args = promptMock.mock.calls[0][0]
    expect(args.instructionParams.changes.type).toBe('groq')
    expect(args.instructionParams.changes.params.releaseName).toBe(expectedReleaseName)
    expect(typeof args.instructionParams.changes.query).toBe('string')
    expect(args.instructionParams.changes.query).toContain('sanity::partOfRelease')
  })

  it('clicking "Generate title" triggers agent prompt and replaces release title', async () => {
    promptMock.mockResolvedValue('Concise Thematic Title')

    await renderMenu()

    await userEvent.click(screen.getByTestId('release-agent-actions-button'))
    const titleItem = await screen.findByTestId('agent-action-generate-title')
    await userEvent.click(titleItem)

    await waitFor(() => {
      expect(updateReleaseMock).toHaveBeenCalledTimes(1)
    })

    expect(updateReleaseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          title: 'Concise Thematic Title',
          description: 'Existing description.',
        }),
      }),
    )

    expect(promptMock).toHaveBeenCalledTimes(1)
  })
})
