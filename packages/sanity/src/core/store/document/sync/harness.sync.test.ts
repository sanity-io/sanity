import {BufferedDocument} from '@sanity/mutator'
import {describe, expect, test, vi} from 'vitest'

import {runSyncTest, type SyncTestDefinition} from '../../../../../test/sync/syncTest'

const DRAFT_ID = 'drafts.article-9'

describe('sync test harness', () => {
  test('HARNESS-TEARDOWN-ON-FAILED-STEP: a step that throws restores the buffered document and real timers', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'HARNESS-TEARDOWN-ON-FAILED-STEP',
      title: 'A step names a client the world does not have',
      seam: 'pair',
      evidence: 'L3',
      initial: [
        {
          _id: DRAFT_ID,
          _type: 'article',
          _rev: 'seed',
          _createdAt: '2026-01-01T00:00:00.000Z',
          _updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      idPair: {publishedId: 'article-9', draftId: DRAFT_ID},
      clients: ['A'],
      steps: [{client: 'Z', do: 'commit'}],
    }
    const {add, commit} = BufferedDocument.prototype

    await expect(runSyncTest(syncTest)).rejects.toThrow('Unknown client Z')

    expect(BufferedDocument.prototype.add).toBe(add)
    expect(BufferedDocument.prototype.commit).toBe(commit)
    expect(vi.isFakeTimers()).toBe(false)
  })
})
