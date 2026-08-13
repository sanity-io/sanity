import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {ReleaseDescriptionSet} from '../../../__telemetry__/releases.telemetry'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnFalse,
  useReleasesPermissionsMockReturnTrue,
} from '../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {ReleaseDetailsEditor} from '../ReleaseDetailsEditor'

const mockTelemetryLog = vi.fn<(event: unknown, payload?: unknown) => void>()

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(() => ({log: mockTelemetryLog})),
}))

// Mock the dependencies
vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn().mockReturnValue({
    updateRelease: vi.fn(),
  }),
}))

vi.mock('../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

const initialRelease = {
  _id: 'release1',
  metadata: {
    title: 'Initial Title',
    description: 'A description',
    releaseType: 'asap',
    intendedPublishAt: undefined,
  },
} as ReleaseDocument

const otherRelease = {
  _id: 'release2',
  metadata: {
    title: 'Other Title',
    description: 'Another description',
    releaseType: 'asap',
    intendedPublishAt: undefined,
  },
} as ReleaseDocument

function getDescriptionTelemetryPayloads(): unknown[] {
  return mockTelemetryLog.mock.calls
    .filter(([event]) => event === ReleaseDescriptionSet)
    .map(([, payload]) => payload)
}

function getUpdateReleaseMock(): Mock {
  return (useReleaseOperations as unknown as Mock).mock.results[0]?.value.updateRelease
}

describe('ReleaseDetailsEditor', () => {
  describe('production (inline editing)', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    })

    it('renders inline title and description fields', async () => {
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByTestId('release-form-title')).toHaveValue('Initial Title')
      expect(screen.queryByTestId('release-title-display')).toBeNull()
    })

    it('debounces changes and saves via updateRelease', async () => {
      vi.useFakeTimers({shouldAdvanceTime: true})
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      const titleInput = screen.getByTestId('release-form-title') as HTMLTextAreaElement
      await userEvent.clear(titleInput)
      await userEvent.type(titleInput, 'New Title')

      await vi.advanceTimersByTimeAsync(250)

      await waitFor(() => {
        expect(getUpdateReleaseMock()).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({title: 'New Title'}),
          }),
        )
      })
      vi.useRealTimers()
    })

    it('logs release description telemetry when the description changes', async () => {
      vi.useFakeTimers({shouldAdvanceTime: true})
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      const nextDescription = 'See https://sanity.io'
      const descriptionInput = screen.getByTestId('release-form-description') as HTMLTextAreaElement
      await userEvent.clear(descriptionInput)
      await userEvent.type(descriptionInput, nextDescription, {delay: null})

      await vi.advanceTimersByTimeAsync(250)

      await waitFor(() => {
        expect(getDescriptionTelemetryPayloads()).toEqual([
          {
            action: 'edit',
            characterCount: nextDescription.length,
            containsUrl: true,
          },
        ])
      })
      expect(JSON.stringify(getDescriptionTelemetryPayloads())).not.toContain(nextDescription)
      vi.useRealTimers()
    })

    it('does not log release description telemetry when only the title changes', async () => {
      vi.useFakeTimers({shouldAdvanceTime: true})
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      const titleInput = screen.getByTestId('release-form-title') as HTMLTextAreaElement
      await userEvent.clear(titleInput)
      await userEvent.type(titleInput, 'New Title', {delay: null})

      await vi.advanceTimersByTimeAsync(250)

      await waitFor(() => {
        expect(getUpdateReleaseMock()).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({title: 'New Title'}),
          }),
        )
      })
      expect(getDescriptionTelemetryPayloads()).toEqual([])
      vi.useRealTimers()
    })

    it('does not log release description telemetry for a title edit after switching release', async () => {
      vi.useFakeTimers({shouldAdvanceTime: true})
      const wrapper = await createTestProvider()
      // No key: the same component instance has to survive the release switch for this regression.
      const {rerender} = render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      rerender(<ReleaseDetailsEditor release={otherRelease} />)
      await flushMicrotasksThisIsACodeSmell()

      const titleInput = screen.getByTestId('release-form-title') as HTMLTextAreaElement
      await userEvent.clear(titleInput)
      await userEvent.type(titleInput, 'Renamed Title', {delay: null})

      await vi.advanceTimersByTimeAsync(250)

      await waitFor(() => {
        expect(getUpdateReleaseMock()).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({title: 'Renamed Title'}),
          }),
        )
      })
      expect(getDescriptionTelemetryPayloads()).toEqual([])
      vi.useRealTimers()
    })

    it('logs release description telemetry for a description edit after switching release', async () => {
      vi.useFakeTimers({shouldAdvanceTime: true})
      const wrapper = await createTestProvider()
      const {rerender} = render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      rerender(<ReleaseDetailsEditor release={otherRelease} />)
      await flushMicrotasksThisIsACodeSmell()

      const nextDescription = 'Reworded'
      const descriptionInput = screen.getByTestId('release-form-description') as HTMLTextAreaElement
      await userEvent.clear(descriptionInput)
      await userEvent.type(descriptionInput, nextDescription, {delay: null})

      await vi.advanceTimersByTimeAsync(250)

      await waitFor(() => {
        expect(getDescriptionTelemetryPayloads()).toEqual([
          {
            action: 'edit',
            characterCount: nextDescription.length,
            containsUrl: false,
          },
        ])
      })
      vi.useRealTimers()
    })
  })

  describe('with beta.variants (read-only identity)', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    })

    it('renders the title and description as read-only display, not inline inputs', async () => {
      const wrapper = await createTestProvider({
        config: {beta: {variants: {enabled: true}}},
      })
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByTestId('release-title-display')).toHaveTextContent('Initial Title')
      expect(screen.getByTestId('release-description-display')).toHaveTextContent('A description')
      expect(screen.queryByTestId('release-form-title')).toBeNull()
    })
  })

  describe('when there is no permission', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnFalse)
    })

    it('disables inline fields in production', async () => {
      const wrapper = await createTestProvider()
      render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByTestId('release-form-title')).toBeDisabled()
    })
  })
})
