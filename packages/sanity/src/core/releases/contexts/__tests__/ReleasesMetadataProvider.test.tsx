import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {of, startWith, Subject} from 'rxjs'
import {beforeEach, expect, it, vi} from 'vitest'

import {type MetadataWrapper} from '../../store/createReleaseMetadataAggregator'
import {ReleasesMetadataProvider, useReleasesMetadataProvider} from '../ReleasesMetadataProvider'

const fetch$ = new Subject<MetadataWrapper>()
const getMetadataStateForSlugs$ = vi.fn((releaseIds: string[]) =>
  // like the aggregator: a non-empty set of ids starts loading, an empty set is idle
  releaseIds.length
    ? fetch$.pipe(startWith({data: null, error: null, loading: true} satisfies MetadataWrapper))
    : of({data: null, error: null, loading: false} satisfies MetadataWrapper),
)

vi.mock('../../store/useReleasesStore', () => ({
  useReleasesStore: () => ({getMetadataStateForSlugs$}),
}))

interface Frame {
  loading: boolean
  data: MetadataWrapper['data']
}

function Consumer({frames}: {frames: Frame[]}) {
  const {state, addReleaseIdsToListener} = useReleasesMetadataProvider()
  frames.push({loading: state.loading, data: state.data})
  return (
    <button type="button" onClick={() => addReleaseIdsToListener(['_.releases.r1'])}>
      listen
    </button>
  )
}

beforeEach(() => {
  getMetadataStateForSlugs$.mockClear()
})

it('reports loading from the render that adds the first release id until its metadata arrives', async () => {
  const frames: Frame[] = []
  render(
    <ReleasesMetadataProvider>
      <Consumer frames={frames} />
    </ReleasesMetadataProvider>,
  )
  expect(frames.at(-1)).toEqual({loading: false, data: null})
  const idle = frames.length

  await userEvent.click(screen.getByRole('button'))

  expect(getMetadataStateForSlugs$).toHaveBeenLastCalledWith(['_.releases.r1'])
  // no frame claims the metadata is loaded while the fetch is pending
  expect(frames.length).toBeGreaterThan(idle)
  expect(frames.slice(idle).every((frame) => frame.loading)).toBe(true)

  const metadata = {'_.releases.r1': {updatedAt: '2026-09-11T00:00:00Z', documentCount: 2}}
  act(() => {
    fetch$.next({data: metadata, error: null, loading: false})
  })
  expect(frames.at(-1)).toEqual({loading: false, data: metadata})
})
