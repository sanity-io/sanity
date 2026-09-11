import {render} from '@testing-library/react'
import {Observable, startWith} from 'rxjs'
import {beforeEach, expect, it, vi} from 'vitest'

import {
  type CompanionDocs,
  INITIAL_COMPANION_DOCS,
} from '../../store/createCanvasCompanionDocsStore'
import {useCanvasCompanionDocsStore} from '../../store/useCanvasCompanionDocsStore'
import {type CompanionDoc} from '../../types'
import {useCanvasCompanionDoc} from '../useCanvasCompanionDoc'

vi.mock('../../store/useCanvasCompanionDocsStore', () => ({
  useCanvasCompanionDocsStore: vi.fn(),
}))

const companion: CompanionDoc = {
  _id: 'link-1',
  canvasDocumentId: 'canvas-1',
  studioDocumentId: 'a',
  isStudioDocumentEditable: false,
}

interface Frame {
  loading: boolean
  isLinked: boolean
  isLockedByCanvas: boolean
}

function Consumer({documentId, frames}: {documentId: string; frames: Frame[]}) {
  const {loading, isLinked, isLockedByCanvas} = useCanvasCompanionDoc(documentId)
  frames.push({loading, isLinked, isLockedByCanvas})
  return null
}

// Like the store: a warm, replayed lookup delivers the loading state and the result synchronously
// on subscribe, but react-rx only subscribes on commit.
function mockLookup(resolved: CompanionDocs) {
  vi.mocked(useCanvasCompanionDocsStore).mockReturnValue({
    getCompanionDocs: () =>
      new Observable<CompanionDocs>((subscriber) => {
        subscriber.next(resolved)
      }).pipe(startWith(INITIAL_COMPANION_DOCS)),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('is loading in the render that mounts the consumer, never unlinked before the lookup answers', () => {
  mockLookup({data: [companion], error: null, loading: false})
  const frames: Frame[] = []

  render(<Consumer documentId="a" frames={frames} />)

  // `LinkToCanvasAction` shows itself when `!isLinked && !loading`: no frame may satisfy that
  expect(frames[0]).toEqual({loading: true, isLinked: false, isLockedByCanvas: false})
  expect(frames.some((frame) => !frame.loading && !frame.isLinked)).toBe(false)
  expect(frames.at(-1)).toEqual({loading: false, isLinked: true, isLockedByCanvas: true})
})

it('resolves to unlinked once the lookup finds no companion doc', () => {
  mockLookup({data: [], error: null, loading: false})
  const frames: Frame[] = []

  render(<Consumer documentId="a" frames={frames} />)

  expect(frames[0]).toMatchObject({loading: true, isLinked: false})
  expect(frames.at(-1)).toEqual({loading: false, isLinked: false, isLockedByCanvas: false})
})
