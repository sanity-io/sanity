import {type SchemaType} from '@sanity/types'
import {act, render} from '@testing-library/react'
import {StrictMode} from 'react'
import {Observable, Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type PerspectiveStack} from '../../perspective/types'
import {type ObserveForPreviewFn} from '../documentPreviewStore'
import {type PreparedSnapshot} from '../types'
import {useValuePreview} from '../useValuePreview'

const observeForPreview = vi.fn<ObserveForPreviewFn>()
const subscriptions = {active: 0, total: 0}

vi.mock('../../store/datastores', () => ({
  useDocumentPreviewStore: () => ({observeForPreview}),
}))

// Stable across renders, like the real context value.
const DEFAULT_PERSPECTIVE = {perspectiveStack: ['drafts'], selectedVariantName: undefined}
let currentPerspective: {perspectiveStack: PerspectiveStack; selectedVariantName?: string} =
  DEFAULT_PERSPECTIVE
vi.mock('../../perspective/usePerspective', () => ({
  usePerspective: () => currentPerspective,
}))

const bookType = {name: 'book', jsonType: 'object', preview: {}} as unknown as SchemaType
const authorType = {name: 'author', jsonType: 'object', preview: {}} as unknown as SchemaType

interface Frame {
  isLoading: boolean
  title: unknown
  error?: Error
}

type HookProps = Parameters<typeof useValuePreview>[0]

function Harness({frames, ...props}: HookProps & {frames: Frame[]}) {
  const state = useValuePreview(props)
  frames.push({isLoading: state.isLoading, title: state.value?.title, error: state.error})
  return null
}

/** Previews synchronously, with the title taken from the previewed value. */
function previewTitle(): ObserveForPreviewFn {
  return (value) =>
    new Observable<PreparedSnapshot>((subscriber) => {
      subscriptions.active++
      subscriptions.total++
      subscriber.next({snapshot: {title: (value as {title?: string}).title}})
      return () => {
        subscriptions.active--
      }
    })
}

/**
 * Previews synchronously, with a title that records what was asked for: the previewed id, the keys
 * of the previewed value, the perspective, the variant and the ordering.
 */
function previewRequest(): ObserveForPreviewFn {
  return (value, _type, options) =>
    new Observable<PreparedSnapshot>((subscriber) => {
      subscriptions.active++
      subscriptions.total++
      subscriber.next({
        snapshot: {
          title: JSON.stringify({
            id: (value as {_id?: string})._id,
            keys: Object.keys(value).toSorted(),
            perspective: options?.perspective,
            variant: options?.variant,
            ordering: options?.viewOptions?.ordering?.name,
          }),
        },
      })
      return () => {
        subscriptions.active--
      }
    })
}

/** Previews asynchronously: each snapshot is delivered by pushing it into the returned subject. */
function previewLater(): {observe: ObserveForPreviewFn; snapshots$: Subject<PreparedSnapshot>} {
  const snapshots$ = new Subject<PreparedSnapshot>()
  return {
    snapshots$,
    observe: () =>
      new Observable<PreparedSnapshot>((subscriber) => {
        subscriptions.active++
        subscriptions.total++
        const subscription = snapshots$.subscribe(subscriber)
        return () => {
          subscriptions.active--
          subscription.unsubscribe()
        }
      }),
  }
}

function requested(frame: Frame | undefined) {
  return JSON.parse(frame?.title as string)
}

const IDLE_FRAME: Frame = {isLoading: false, title: undefined, error: undefined}
const LOADING_FRAME: Frame = {isLoading: true, title: undefined, error: undefined}

/** Every frame rendered since a switch is the loading state, and there is at least one. */
function expectOnlyLoadingFrames(frames: Frame[]) {
  expect(frames.length).toBeGreaterThan(0)
  expect(frames).toEqual(frames.map(() => LOADING_FRAME))
}

/** Lets react-rx release the source of an observable that lost its last subscriber. */
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('useValuePreview', () => {
  beforeEach(() => {
    subscriptions.active = 0
    subscriptions.total = 0
    currentPerspective = DEFAULT_PERSPECTIVE
    observeForPreview.mockReset()
    observeForPreview.mockImplementation(previewTitle())
  })

  it('previews the value', () => {
    const frames: Frame[] = []
    render(<Harness schemaType={bookType} value={{_id: 'a', title: 'one'}} frames={frames} />)

    expect(frames.at(-1)).toEqual({isLoading: false, title: 'one', error: undefined})
  })

  it('keeps one live preview across edits of the same document, without a loading frame', async () => {
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness schemaType={bookType} value={{_id: 'a', title: 'one'}} frames={frames} />,
    )
    const settled = frames.length

    rerender(<Harness schemaType={bookType} value={{_id: 'a', title: 'two'}} frames={frames} />)
    rerender(<Harness schemaType={bookType} value={{_id: 'a', title: 'three'}} frames={frames} />)

    expect(frames.at(-1)).toEqual({isLoading: false, title: 'three', error: undefined})
    expect(frames.slice(settled).filter((frame) => frame.isLoading)).toEqual([])
    await flush()
    // one preview per distinct value, and only the latest one stays subscribed
    expect(subscriptions).toEqual({active: 1, total: 3})
  })

  it('renders once for an edit that leaves the preview unchanged', () => {
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness schemaType={bookType} value={{_id: 'a', title: 'one'}} frames={frames} />,
    )
    const settled = frames.length

    rerender(
      <Harness schemaType={bookType} value={{_id: 'a', title: 'one', body: 'x'}} frames={frames} />,
    )

    expect(frames.slice(settled)).toEqual([{isLoading: false, title: 'one', error: undefined}])
  })

  it('previews an unchanged value once', async () => {
    const value = {_id: 'a', title: 'one'}
    const {rerender} = render(<Harness schemaType={bookType} value={value} frames={[]} />)
    rerender(<Harness schemaType={bookType} value={value} frames={[]} />)
    rerender(<Harness schemaType={bookType} value={value} frames={[]} />)

    await flush()
    expect(subscriptions).toEqual({active: 1, total: 1})
  })

  it('previews an equal value built during render once', async () => {
    const {rerender} = render(<Harness schemaType={bookType} value={{_id: 'a'}} frames={[]} />)
    rerender(<Harness schemaType={bookType} value={{_id: 'a'}} frames={[]} />)
    rerender(<Harness schemaType={bookType} value={{_id: 'a'}} frames={[]} />)

    await flush()
    expect(subscriptions).toEqual({active: 1, total: 1})
  })

  it('keeps one live preview when the perspective stack is a new array every render', async () => {
    const {rerender} = render(
      <Harness schemaType={bookType} value={{_id: 'a'}} perspectiveStack={[]} frames={[]} />,
    )
    rerender(<Harness schemaType={bookType} value={{_id: 'a'}} perspectiveStack={[]} frames={[]} />)
    rerender(<Harness schemaType={bookType} value={{_id: 'a'}} perspectiveStack={[]} frames={[]} />)

    await flush()
    expect(subscriptions).toEqual({active: 1, total: 1})
  })

  it('shows the loading state for another document instead of the previous preview', async () => {
    const {observe, snapshots$} = previewLater()
    observeForPreview.mockImplementation(observe)
    const frames: Frame[] = []
    const {rerender} = render(<Harness schemaType={bookType} value={{_id: 'a'}} frames={frames} />)
    act(() => snapshots$.next({snapshot: {title: 'A'}}))
    expect(frames.at(-1)).toEqual({isLoading: false, title: 'A', error: undefined})
    const settled = frames.length

    rerender(<Harness schemaType={bookType} value={{_id: 'b'}} frames={frames} />)
    expectOnlyLoadingFrames(frames.slice(settled))
    await flush()
    expect(subscriptions).toEqual({active: 1, total: 2})

    act(() => snapshots$.next({snapshot: {title: 'B'}}))
    expect(frames.at(-1)).toEqual({isLoading: false, title: 'B', error: undefined})
  })

  it('shows the loading state for another schema type', async () => {
    const {observe, snapshots$} = previewLater()
    observeForPreview.mockImplementation(observe)
    const frames: Frame[] = []
    const {rerender} = render(<Harness schemaType={bookType} value={{_id: 'a'}} frames={frames} />)
    act(() => snapshots$.next({snapshot: {title: 'as book'}}))
    const settled = frames.length

    rerender(<Harness schemaType={authorType} value={{_id: 'a'}} frames={frames} />)
    expectOnlyLoadingFrames(frames.slice(settled))

    act(() => snapshots$.next({snapshot: {title: 'as author'}}))
    expect(frames.at(-1)).toEqual({isLoading: false, title: 'as author', error: undefined})
    await flush()
    expect(subscriptions).toEqual({active: 1, total: 2})
  })

  it('updates the preview in place when the perspective changes', async () => {
    observeForPreview.mockImplementation(previewRequest())
    const frames: Frame[] = []
    const {rerender} = render(<Harness schemaType={bookType} value={{_id: 'a'}} frames={frames} />)
    expect(requested(frames.at(-1))).toEqual({id: 'a', keys: ['_id'], perspective: ['drafts']})
    const settled = frames.length

    currentPerspective = {perspectiveStack: ['rRelease', 'drafts'], selectedVariantName: 'nb'}
    rerender(<Harness schemaType={bookType} value={{_id: 'a'}} frames={frames} />)

    expect(requested(frames.at(-1))).toEqual({
      id: 'a',
      keys: ['_id'],
      perspective: ['rRelease', 'drafts'],
      variant: 'nb',
    })
    expect(frames.slice(settled).filter((frame) => frame.isLoading)).toEqual([])
    await flush()
    expect(subscriptions).toEqual({active: 1, total: 2})
  })

  it('previews through the given perspective stack and variant only', () => {
    observeForPreview.mockImplementation(previewRequest())
    currentPerspective = {perspectiveStack: ['drafts'], selectedVariantName: 'nb'}
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness
        schemaType={bookType}
        value={{_id: 'a'}}
        perspectiveStack={['rRelease', 'drafts']}
        frames={frames}
      />,
    )
    expect(requested(frames.at(-1))).toEqual({
      id: 'a',
      keys: ['_id'],
      perspective: ['rRelease', 'drafts'],
    })

    rerender(
      <Harness
        schemaType={bookType}
        value={{_id: 'a'}}
        perspectiveStack={['rRelease', 'drafts']}
        variant="en"
        frames={frames}
      />,
    )
    expect(requested(frames.at(-1))).toEqual({
      id: 'a',
      keys: ['_id'],
      perspective: ['rRelease', 'drafts'],
      variant: 'en',
    })
  })

  it('ignores a context perspective change when the caller selects the perspective', async () => {
    observeForPreview.mockImplementation(previewRequest())
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness
        schemaType={bookType}
        value={{_id: 'a'}}
        perspectiveStack={['rRelease', 'drafts']}
        frames={frames}
      />,
    )
    const settled = frames.length

    currentPerspective = {perspectiveStack: ['rOther', 'drafts'], selectedVariantName: 'nb'}
    rerender(
      <Harness
        schemaType={bookType}
        value={{_id: 'a'}}
        perspectiveStack={['rRelease', 'drafts']}
        frames={frames}
      />,
    )

    expect(frames.slice(settled)).toEqual([frames[settled - 1]])
    await flush()
    expect(subscriptions).toEqual({active: 1, total: 1})
  })

  it('shows the loading state when a cross-dataset reference moves to another dataset', () => {
    const {observe, snapshots$} = previewLater()
    observeForPreview.mockImplementation(observe)
    const frames: Frame[] = []
    const reference = {_type: 'crossDatasetReference', _ref: 'x', _projectId: 'p', _dataset: 'a'}
    const {rerender} = render(<Harness schemaType={bookType} value={reference} frames={frames} />)
    act(() => snapshots$.next({snapshot: {title: 'from a'}}))
    const settled = frames.length

    rerender(
      <Harness schemaType={bookType} value={{...reference, _dataset: 'b'}} frames={frames} />,
    )
    expectOnlyLoadingFrames(frames.slice(settled))

    act(() => snapshots$.next({snapshot: {title: 'from b'}}))
    expect(frames.at(-1)).toEqual({isLoading: false, title: 'from b', error: undefined})
  })

  it('shows the loading state when a document turns into a version slated for unpublishing', () => {
    const {observe, snapshots$} = previewLater()
    observeForPreview.mockImplementation(observe)
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness schemaType={bookType} value={{_id: 'a', title: 'draft'}} frames={frames} />,
    )
    act(() => snapshots$.next({snapshot: {title: 'draft'}}))
    const settled = frames.length

    rerender(
      <Harness
        schemaType={bookType}
        value={{_id: 'versions.rRelease.a', _system: {delete: true}}}
        frames={frames}
      />,
    )
    expectOnlyLoadingFrames(frames.slice(settled))

    act(() => snapshots$.next({snapshot: {title: 'published'}}))
    expect(frames.at(-1)).toEqual({isLoading: false, title: 'published', error: undefined})
  })

  it('previews a version slated for unpublishing as its published document', () => {
    observeForPreview.mockImplementation(previewRequest())
    currentPerspective = {perspectiveStack: ['rRelease', 'drafts'], selectedVariantName: 'nb'}
    const frames: Frame[] = []
    render(
      <Harness
        schemaType={bookType}
        value={{_id: 'versions.rRelease.a', _system: {delete: true}, title: 'gone'}}
        frames={frames}
      />,
    )

    expect(requested(frames.at(-1))).toEqual({id: 'a', keys: ['_id'], perspective: []})
  })

  it('re-previews with a new ordering', () => {
    observeForPreview.mockImplementation(previewRequest())
    const frames: Frame[] = []
    const ordering = {
      name: 'byTitle',
      title: 'By title',
      by: [{field: 'title', direction: 'asc' as const}],
    }
    const {rerender} = render(
      <Harness schemaType={bookType} value={{_id: 'a'}} ordering={ordering} frames={frames} />,
    )
    expect(requested(frames.at(-1))).toEqual({
      id: 'a',
      keys: ['_id'],
      perspective: ['drafts'],
      ordering: 'byTitle',
    })

    rerender(
      <Harness
        schemaType={bookType}
        value={{_id: 'a'}}
        ordering={{...ordering, name: 'byYear'}}
        frames={frames}
      />,
    )
    expect(requested(frames.at(-1))).toEqual({
      id: 'a',
      keys: ['_id'],
      perspective: ['drafts'],
      ordering: 'byYear',
    })
  })

  it('renders the idle state without previewing when disabled', () => {
    const frames: Frame[] = []
    render(<Harness schemaType={bookType} value={{_id: 'a'}} enabled={false} frames={frames} />)

    expect(frames.at(-1)).toEqual(IDLE_FRAME)
    expect(subscriptions).toEqual({active: 0, total: 0})
  })

  it('renders the idle state without previewing when there is no schema type', () => {
    const frames: Frame[] = []
    render(<Harness schemaType={undefined} value={{_id: 'a'}} frames={frames} />)

    expect(frames.at(-1)).toEqual(IDLE_FRAME)
    expect(subscriptions).toEqual({active: 0, total: 0})
  })

  it('renders the idle state without previewing when there is no value', () => {
    const frames: Frame[] = []
    render(<Harness schemaType={bookType} value={undefined} frames={frames} />)

    expect(frames.at(-1)).toEqual(IDLE_FRAME)
    expect(subscriptions).toEqual({active: 0, total: 0})
  })

  it('drops back to the idle state and releases the preview when the value is removed', async () => {
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness schemaType={bookType} value={{_id: 'a', title: 'one'}} frames={frames} />,
    )
    expect(subscriptions).toEqual({active: 1, total: 1})

    rerender(<Harness schemaType={bookType} value={undefined} frames={frames} />)

    expect(frames.at(-1)).toEqual(IDLE_FRAME)
    await flush()
    expect(subscriptions).toEqual({active: 0, total: 1})
  })

  it('releases the preview when disabled', async () => {
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness schemaType={bookType} value={{_id: 'a', title: 'one'}} frames={frames} />,
    )

    rerender(
      <Harness
        schemaType={bookType}
        value={{_id: 'a', title: 'one'}}
        enabled={false}
        frames={frames}
      />,
    )

    expect(frames.at(-1)).toEqual(IDLE_FRAME)
    await flush()
    expect(subscriptions).toEqual({active: 0, total: 1})
  })

  it('previews the current value when re-enabled, not the one it was disabled with', () => {
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness schemaType={bookType} value={{_id: 'a', title: 'one'}} frames={frames} />,
    )
    rerender(
      <Harness
        schemaType={bookType}
        value={{_id: 'a', title: 'two'}}
        enabled={false}
        frames={frames}
      />,
    )
    expect(frames.at(-1)).toEqual(IDLE_FRAME)
    const settled = frames.length

    rerender(<Harness schemaType={bookType} value={{_id: 'a', title: 'three'}} frames={frames} />)

    expect(frames.at(-1)).toEqual({isLoading: false, title: 'three', error: undefined})
    expect(frames.slice(settled).map((frame) => frame.title)).not.toContain('two')
  })

  it('behaves the same under StrictMode', async () => {
    const frames: Frame[] = []
    const {rerender} = render(
      <StrictMode>
        <Harness schemaType={bookType} value={{_id: 'a', title: 'one'}} frames={frames} />
      </StrictMode>,
    )
    expect(frames.at(-1)).toEqual({isLoading: false, title: 'one', error: undefined})
    const settled = frames.length

    rerender(
      <StrictMode>
        <Harness schemaType={bookType} value={{_id: 'a', title: 'two'}} frames={frames} />
      </StrictMode>,
    )

    expect(frames.at(-1)).toEqual({isLoading: false, title: 'two', error: undefined})
    expect(frames.slice(settled).filter((frame) => frame.isLoading)).toEqual([])
    await flush()
    expect(subscriptions).toEqual({active: 1, total: 2})
  })

  it('surfaces a preview error', () => {
    const error = new Error('boom')
    observeForPreview.mockImplementation(
      () =>
        new Observable<PreparedSnapshot>((subscriber) => {
          subscriber.error(error)
        }),
    )
    const frames: Frame[] = []
    render(<Harness schemaType={bookType} value={{_id: 'a'}} frames={frames} />)

    expect(frames.at(-1)).toEqual({isLoading: false, title: undefined, error})
  })
})
