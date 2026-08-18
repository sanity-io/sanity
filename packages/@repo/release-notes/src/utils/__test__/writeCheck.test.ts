import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getOctokit} from '../../octokit'
import {CHECK_NAME, EXTERNAL_ID, writeCheck} from '../writeCheck'

vi.mock('../../octokit', () => ({getOctokit: vi.fn()}))

const HEAD_SHA = 'abc123'
const BLOCKING_RELEASE_PR = {
  number: 99,
  draft: false,
  html_url: 'https://example.test/99',
} as never

function mockOctokit(checkRuns: unknown[]) {
  const octokit = {
    checks: {
      listForRef: vi.fn().mockResolvedValue({data: {check_runs: checkRuns}}),
      update: vi.fn().mockResolvedValue({data: {}}),
      create: vi.fn().mockResolvedValue({data: {}}),
    },
  }
  vi.mocked(getOctokit).mockReturnValue(octokit as never)
  return octokit
}

describe('writeCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('clearing (no in-flight release)', () => {
    it('creates a success run when none exists', async () => {
      const octokit = mockOctokit([])

      await writeCheck({currentPrNumber: 1, headSha: HEAD_SHA})

      expect(octokit.checks.update).not.toHaveBeenCalled()
      expect(octokit.checks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          head_sha: HEAD_SHA,
          external_id: EXTERNAL_ID,
          name: CHECK_NAME,
          status: 'completed',
          conclusion: 'success',
        }),
      )
    })

    it('is a no-op when a success run already exists', async () => {
      const octokit = mockOctokit([
        {
          id: 10,
          external_id: EXTERNAL_ID,
          status: 'completed',
          conclusion: 'success',
          started_at: '1',
        },
      ])

      await writeCheck({currentPrNumber: 1, headSha: HEAD_SHA})

      expect(octokit.checks.create).not.toHaveBeenCalled()
      expect(octokit.checks.update).not.toHaveBeenCalled()
    })

    it('finishes the newest in-progress run rather than creating a new one', async () => {
      const octokit = mockOctokit([
        {
          id: 10,
          external_id: EXTERNAL_ID,
          status: 'in_progress',
          conclusion: null,
          started_at: '1',
        },
        {
          id: 20,
          external_id: EXTERNAL_ID,
          status: 'in_progress',
          conclusion: null,
          started_at: '3',
        },
        {
          id: 15,
          external_id: EXTERNAL_ID,
          status: 'in_progress',
          conclusion: null,
          started_at: '2',
        },
        {
          id: 99,
          external_id: 'unrelated',
          status: 'completed',
          conclusion: 'success',
          started_at: '9',
        },
      ])

      await writeCheck({currentPrNumber: 1, headSha: HEAD_SHA})

      expect(octokit.checks.create).not.toHaveBeenCalled()
      expect(octokit.checks.update).toHaveBeenCalledWith(
        expect.objectContaining({check_run_id: 20, status: 'completed', conclusion: 'success'}),
      )
    })

    it('finishes a newer queued run (null started_at) instead of no-oping on an older success', async () => {
      const octokit = mockOctokit([
        {
          id: 10,
          external_id: EXTERNAL_ID,
          status: 'completed',
          conclusion: 'success',
          started_at: '5',
        },
        {
          id: 20,
          external_id: EXTERNAL_ID,
          status: 'queued',
          conclusion: null,
          started_at: null,
        },
      ])

      await writeCheck({currentPrNumber: 1, headSha: HEAD_SHA})

      expect(octokit.checks.create).not.toHaveBeenCalled()
      expect(octokit.checks.update).toHaveBeenCalledWith(
        expect.objectContaining({check_run_id: 20, status: 'completed', conclusion: 'success'}),
      )
    })
  })

  describe('blocking (in-flight release)', () => {
    it('creates a fresh in-progress run when none exists', async () => {
      const octokit = mockOctokit([])

      await writeCheck({currentPrNumber: 1, headSha: HEAD_SHA, releasePr: BLOCKING_RELEASE_PR})

      expect(octokit.checks.update).not.toHaveBeenCalled()
      expect(octokit.checks.create).toHaveBeenCalledWith(
        expect.objectContaining({status: 'in_progress', external_id: EXTERNAL_ID}),
      )
    })

    it('creates a fresh in-progress run rather than reopening a completed run', async () => {
      const octokit = mockOctokit([
        {
          id: 10,
          external_id: EXTERNAL_ID,
          status: 'completed',
          conclusion: 'success',
          started_at: '1',
        },
      ])

      await writeCheck({currentPrNumber: 1, headSha: HEAD_SHA, releasePr: BLOCKING_RELEASE_PR})

      expect(octokit.checks.update).not.toHaveBeenCalled()
      expect(octokit.checks.create).toHaveBeenCalledWith(
        expect.objectContaining({head_sha: HEAD_SHA, status: 'in_progress'}),
      )
    })

    it('is a no-op when an in-progress run already exists', async () => {
      const octokit = mockOctokit([
        {
          id: 10,
          external_id: EXTERNAL_ID,
          status: 'in_progress',
          conclusion: null,
          started_at: '1',
        },
      ])

      await writeCheck({currentPrNumber: 1, headSha: HEAD_SHA, releasePr: BLOCKING_RELEASE_PR})

      expect(octokit.checks.create).not.toHaveBeenCalled()
      expect(octokit.checks.update).not.toHaveBeenCalled()
    })
  })
})
