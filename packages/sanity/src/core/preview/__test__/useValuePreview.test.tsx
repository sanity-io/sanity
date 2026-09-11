import {type SchemaType} from '@sanity/types'
import {act, render} from '@testing-library/react'
import {Observable, Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type PerspectiveStack} from '../../perspective/types'
import {useValuePreview} from '../useValuePreview'

const observeForPreview = vi.fn()
const subscriptions = {active: 0, total: 0}

vi.mock('../../store/datastores', () => ({
  useDocumentPreviewStore: () => ({observeForPreview}),
}))
// Stable like the real context value: a fresh array per render would rebuild the observable.
const perspective = {perspectiveStack: ['drafts'], selectedVariantName: undefined}
vi.mock('../../perspective/usePerspective', () => ({
  usePerspective: () => perspective,
}))

const schemaType = {name: 'book', jsonType: 'object', preview: {}} as unknown as SchemaType

interface Frame {
  isLoading: boolean
  title: unknown
  error?: Error
}

function Harness({
  value,
  frames,
  perspectiveStack,
}: {
  value: unknown
  frames: Frame[]
  perspectiveStack?: PerspectiveStack
}) {
  const state = useValuePreview({schemaType, value, perspectiveStack})
  frames.push({isLoading: state.isLoading, title: state.value?.title, error: state.error})
  return null
}

describe('useValuePreview', () => {
  beforeEach(() => {
    subscriptions.active = 0
    subscriptions.total = 0
    observeForPreview.mockReset()
    observeForPreview.mockImplementation(
      (value: {title: string}) =>
        new Observable((subscriber) => {
          subscriptions.active++
          subscriptions.total++
          subscriber.next({snapshot: {title: value.title}})
          return () => {
            subscriptions.active--
          }
        }),
    )
  })

  it('previews the latest value without dropping back to the loading state', () => {
    const frames: Frame[] = []
    const {rerender} = render(<Harness value={{_id: 'a', title: 'one'}} frames={frames} />)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})

    const settled = frames.length
    rerender(<Harness value={{_id: 'a', title: 'two'}} frames={frames} />)
    rerender(<Harness value={{_id: 'a', title: 'three'}} frames={frames} />)

    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'three'})
    expect(frames.slice(settled).some((frame) => frame.isLoading)).toBe(false)
    // each value is previewed once, and only the latest preview stays subscribed
    expect(observeForPreview).toHaveBeenCalledTimes(3)
    expect(subscriptions.active).toBe(1)
  })

  it('previews an unchanged value only once', () => {
    const value = {_id: 'a', title: 'one'}
    const {rerender} = render(<Harness value={value} frames={[]} />)
    rerender(<Harness value={value} frames={[]} />)

    expect(observeForPreview).toHaveBeenCalledTimes(1)
    expect(subscriptions.total).toBe(1)
  })

  it('does not re-render consumers when an edit leaves the prepared preview unchanged', () => {
    const frames: Frame[] = []
    const {rerender} = render(<Harness value={{_id: 'a', title: 'one'}} frames={frames} />)
    const before = frames.length

    rerender(<Harness value={{_id: 'a', title: 'one', body: 'edited'}} frames={frames} />)

    // the edit is previewed, but the equal result does not cause a store-driven render
    expect(observeForPreview).toHaveBeenCalledTimes(2)
    expect(frames.length).toBe(before + 1)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
  })

  it('ignores the timestamps every local mutation bumps when comparing previews', () => {
    observeForPreview.mockImplementation(
      (value: {title: string; _updatedAt: string}) =>
        new Observable((subscriber) => {
          subscriber.next({
            snapshot: {title: value.title, _updatedAt: value._updatedAt, _createdAt: '2026-01-01'},
          })
        }),
    )
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness
        value={{_id: 'a', title: 'one', _updatedAt: '2026-09-11T10:00:00Z'}}
        frames={frames}
      />,
    )
    const before = frames.length

    rerender(
      <Harness
        value={{_id: 'a', title: 'one', _updatedAt: '2026-09-11T10:00:01Z'}}
        frames={frames}
      />,
    )

    expect(frames.length).toBe(before + 1)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
  })

  it('resets to loading when the value previews a different document', () => {
    const second = new Subject<{snapshot: {title: string}}>()
    observeForPreview.mockImplementation((value: {_id: string; title: string}) =>
      value._id === 'b'
        ? second
        : new Observable((subscriber) => {
            subscriber.next({snapshot: {title: value.title}})
          }),
    )
    const frames: Frame[] = []
    const {rerender} = render(<Harness value={{_id: 'a', title: 'one'}} frames={frames} />)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
    const settled = frames.length

    // the new document's preview is still pending: the previous title must not linger, not even
    // in the render that first receives the new value (before any effect has run)
    rerender(<Harness value={{_id: 'b', title: 'two'}} frames={frames} />)
    expect(frames.slice(settled).map((frame) => frame.title)).not.toContain('one')
    expect(frames.at(-1)).toEqual({isLoading: true, title: undefined, error: undefined})

    act(() => {
      second.next({snapshot: {title: 'two'}})
    })
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'two'})
  })

  it('keeps the preview when a draft or version of the same document is materialized', () => {
    const frames: Frame[] = []
    const {rerender} = render(<Harness value={{_id: 'a', title: 'one'}} frames={frames} />)
    const settled = frames.length

    rerender(<Harness value={{_id: 'drafts.a', title: 'one edited'}} frames={frames} />)
    rerender(<Harness value={{_id: 'versions.r1.a', title: 'one in release'}} frames={frames} />)

    expect(frames.slice(settled).some((frame) => frame.isLoading)).toBe(false)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one in release'})
  })

  it('resets to loading when a version slated for unpublishing switches to the published preview', () => {
    const published = new Subject<{snapshot: {title: string}}>()
    observeForPreview.mockImplementation(
      (value: {_id: string; title?: string}, _type: unknown, options: {perspective: unknown[]}) =>
        value._id === 'a' && options.perspective.length === 0
          ? published
          : new Observable((subscriber) => {
              subscriber.next({snapshot: {title: value.title}})
            }),
    )
    const frames: Frame[] = []
    const version = {_id: 'versions.r1.a', title: 'in release'}
    const {rerender} = render(<Harness value={version} frames={frames} />)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'in release'})
    const settled = frames.length

    // the same version, now marked for unpublishing: it previews the published document instead
    rerender(<Harness value={{...version, _system: {delete: true}}} frames={frames} />)
    expect(frames.slice(settled).map((frame) => frame.title)).not.toContain('in release')
    expect(frames.at(-1)).toEqual({isLoading: true, title: undefined, error: undefined})
    expect(observeForPreview).toHaveBeenLastCalledWith(
      {_id: 'a'},
      schemaType,
      expect.objectContaining({perspective: [], variant: undefined}),
    )

    act(() => {
      published.next({snapshot: {title: 'published'}})
    })
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'published'})
  })

  it('keeps one observable when the perspective stack is rebuilt every render', () => {
    const frames: Frame[] = []
    const value = {_id: 'a', title: 'one'}
    const {rerender} = render(<Harness value={value} frames={frames} perspectiveStack={[]} />)
    rerender(<Harness value={value} frames={frames} perspectiveStack={[]} />)
    rerender(<Harness value={value} frames={frames} perspectiveStack={[]} />)

    expect(observeForPreview).toHaveBeenCalledTimes(1)
    expect(subscriptions.total).toBe(1)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
  })

  it('converges when the value object is rebuilt on every render', () => {
    const frames: Frame[] = []
    function InlineValue() {
      if (frames.length > 10) throw new Error(`render loop after ${frames.length} renders`)
      const state = useValuePreview({schemaType, value: {_id: 'a', title: 'one'}})
      frames.push({isLoading: state.isLoading, title: state.value?.title})
      return null
    }
    render(<InlineValue />)

    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
  })

  it('converges when the value is rebuilt on every render and prepare() returns fresh media', () => {
    observeForPreview.mockImplementation(
      (value: {title: string}) =>
        new Observable((subscriber) => {
          subscriber.next({
            // a new component and a new element on every emission, like `media: () => ...` does
            snapshot: {
              title: value.title,
              media: () => <span />,
              icon: <i />,
            },
          })
        }),
    )
    const frames: Frame[] = []
    function InlineValue() {
      if (frames.length > 10) throw new Error(`render loop after ${frames.length} renders`)
      const state = useValuePreview({schemaType, value: {_id: 'a', title: 'one'}})
      frames.push({isLoading: state.isLoading, title: state.value?.title})
      return null
    }
    render(<InlineValue />)

    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
    expect(observeForPreview).toHaveBeenCalledTimes(1)
  })

  it('re-renders when media changes but not when only its identity does', () => {
    const asset = {_type: 'image', asset: {_ref: 'image-1'}}
    observeForPreview.mockImplementation(
      (value: {title: string; media: unknown}) =>
        new Observable((subscriber) => {
          subscriber.next({snapshot: {title: value.title, media: value.media}})
        }),
    )
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness value={{_id: 'a', title: 'one', media: {...asset}}} frames={frames} />,
    )
    const before = frames.length

    // an equal asset object is the same media
    rerender(<Harness value={{_id: 'a', title: 'one', media: {...asset}}} frames={frames} />)
    expect(frames.length).toBe(before + 1)

    // a different asset is not
    rerender(
      <Harness
        value={{_id: 'a', title: 'one', media: {_type: 'image', asset: {_ref: 'image-2'}}}}
        frames={frames}
      />,
    )
    expect(frames.length).toBe(before + 3)
  })

  it('compares element media by identity without walking it', () => {
    // A self-referencing prop would overflow a deep compare that walked into the element
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    const makeMedia = () => <span data-owner={cyclic} />
    observeForPreview.mockImplementation(
      (value: {title: string; version: number}) =>
        new Observable((subscriber) => {
          subscriber.next({snapshot: {title: value.title, media: makeMedia()}})
        }),
    )
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness value={{_id: 'a', title: 'one', version: 1}} frames={frames} />,
    )
    const before = frames.length

    // a new element instance is new media, so the consumer re-renders (rerender + store update)
    rerender(<Harness value={{_id: 'a', title: 'one', version: 2}} frames={frames} />)

    expect(frames.length).toBe(before + 2)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
  })

  it('surfaces a preview error once, even when the value is rebuilt on every render', () => {
    observeForPreview.mockImplementation(
      () =>
        new Observable(() => {
          throw new Error('boom')
        }),
    )
    const frames: Frame[] = []
    function Failing() {
      if (frames.length > 10) throw new Error(`render loop after ${frames.length} renders`)
      const state = useValuePreview({schemaType, value: {_id: 'a', title: 'one'}})
      frames.push({isLoading: state.isLoading, title: state.value?.title, error: state.error})
      return null
    }
    render(<Failing />)

    expect(frames.at(-1)).toMatchObject({isLoading: false, error: new Error('boom')})
  })

  it('renders the idle state without a value', () => {
    const frames: Frame[] = []
    render(<Harness value={undefined} frames={frames} />)

    expect(frames.at(-1)).toMatchObject({isLoading: false, title: undefined})
    expect(observeForPreview).not.toHaveBeenCalled()
  })
})
