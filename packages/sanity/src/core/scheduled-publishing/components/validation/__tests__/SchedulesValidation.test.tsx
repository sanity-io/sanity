import {act, render} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../../config/defineConfig'
import {useValidationStatus} from '../../../../hooks/useValidationStatus'
import {type Schedule} from '../../../types'
import {ValidateScheduleDoc} from '../SchedulesValidation'

vi.mock('../../../../hooks/useValidationStatus', () => ({
  useValidationStatus: vi.fn(() => ({validation: [], isValidating: false})),
}))
// oxlint-disable-next-line no-deprecated -- only the boolean overload is deprecated
const mockUseValidationStatus = vi.mocked(useValidationStatus)

const config = defineConfig({
  projectId: 'test',
  dataset: 'test',
  schema: {
    types: [{name: 'movie', type: 'document', fields: [{name: 'title', type: 'string'}]}],
  },
})

const schedule: Schedule = {
  author: 'user-1',
  action: 'publish',
  createdAt: '2026-01-01T00:00:00Z',
  dataset: 'test',
  description: '',
  documents: [{documentId: 'drafts.movie-1', documentType: 'movie'}],
  executeAt: '2026-12-01T00:00:00Z',
  id: 'schedule-1',
  name: 'Schedule',
  projectId: 'test',
  state: 'scheduled',
  stateReason: '',
}

describe('ValidateScheduleDoc', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it.each(['document', 'global'] as const)(
    'validates the scheduled draft through the %s listener it is given',
    async (listener) => {
      const wrapper = await createTestProvider({config})
      vi.useFakeTimers()

      render(
        <ValidateScheduleDoc
          schedule={schedule}
          updateValidation={() => undefined}
          listener={listener}
        />,
        {wrapper},
      )
      expect(mockUseValidationStatus).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(1500)
      })
      expect(mockUseValidationStatus).toHaveBeenCalledWith('drafts.movie-1', 'movie', {listener})
    },
  )
})
