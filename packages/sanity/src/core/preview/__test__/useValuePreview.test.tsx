import {type SchemaType, type SortOrdering} from '@sanity/types'
import {act, render} from '@testing-library/react'
import {Observable, Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useValuePreview} from '../useValuePreview'

const observeForPreview = vi.fn()
const subscriptions = {active: 0, total: 0}

vi.mock('../../store/datastores', () => ({
  useDocumentPreviewStore: () => ({observeForPreview}),
}))
// Stable like the real context value: a fresh array per render would rebuild the observable.
const DEFAULT_PERSPECTIVE = {perspectiveStack: ['drafts'], selectedVariantName: undefined}
let currentPerspective: {perspectiveStack: string[]; selectedVariantName: string | undefined} =
  DEFAULT_PERSPECTIVE
vi.mock('../../perspective/usePerspective', () => ({
  usePerspective: () => currentPerspective,
}))

const schemaType = {name: 'book', jsonType: 'object', preview: {}} as unknown as SchemaType

interface Frame {
  isLoading: boolean
  title: unknown
  error?: Error
}

function Harness({frames, ...props}: Parameters<typeof useValuePreview>[0] & {frames: Frame[]}) {
  // an explicit `schemaType={undefined}` overrides the default
  const state = useValuePreview({schemaType, ...props})
  frames.push({isLoading: state.isLoading, title: state.value?.title, error: state.error})
  return null
}

describe('useValuePreview', () => {
  beforeEach(() => {
    subscriptions.active = 0
    subscriptions.total = 0
    currentPerspective = DEFAULT_PERSPECTIVE
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

  it('resets to loading in the render that changes the schema type, until the new preview arrives', () => {
    const asArticle = new Subject<{snapshot: {title: string}}>()
    const articleType = {name: 'article', jsonType: 'object', preview: {}} as unknown as SchemaType
    observeForPreview.mockImplementation((value: {title: string}, type: SchemaType) =>
      type === articleType
        ? asArticle
        : new Observable((subscriber) => {
            subscriber.next({snapshot: {title: value.title}})
          }),
    )
    const frames: Frame[] = []
    const value = {_id: 'a', title: 'one'}
    const {rerender} = render(<Harness value={value} frames={frames} />)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
    const settled = frames.length

    // the same document prepared through another schema type is another preview: the previous
    // one must not linger, not even in the render that first receives the new type
    rerender(<Harness value={value} schemaType={articleType} frames={frames} />)
    expect(frames.slice(settled).map((frame) => frame.title)).not.toContain('one')
    expect(frames.at(-1)).toEqual({isLoading: true, title: undefined, error: undefined})

    act(() => {
      asArticle.next({snapshot: {title: 'one, as an article'}})
    })
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one, as an article'})
  })

  it('resets to loading in the render that changes the ordering, until the new preview arrives', () => {
    const byDate: SortOrdering = {
      name: 'byDate',
      title: 'By date',
      by: [{field: 'date', direction: 'asc'}],
    }
    const orderedByDate = new Subject<{snapshot: {title: string}}>()
    observeForPreview.mockImplementation(
      (
        value: {title: string},
        _type: unknown,
        options: {viewOptions: {ordering?: SortOrdering}},
      ) =>
        options.viewOptions.ordering === byDate
          ? orderedByDate
          : new Observable((subscriber) => {
              subscriber.next({snapshot: {title: value.title}})
            }),
    )
    const frames: Frame[] = []
    const value = {_id: 'a', title: 'one'}
    const {rerender} = render(<Harness value={value} frames={frames} />)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
    const settled = frames.length

    rerender(<Harness value={value} ordering={byDate} frames={frames} />)
    expect(frames.slice(settled).map((frame) => frame.title)).not.toContain('one')
    expect(frames.at(-1)).toEqual({isLoading: true, title: undefined, error: undefined})

    act(() => {
      orderedByDate.next({snapshot: {title: 'one · 2026'}})
    })
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one · 2026'})
  })

  it('keys array items by their _key as it is, not as a document id', () => {
    const second = new Subject<{snapshot: {title: string}}>()
    observeForPreview.mockImplementation((value: {_key: string; title: string}) =>
      value._key === 'foo'
        ? second
        : new Observable((subscriber) => {
            subscriber.next({snapshot: {title: value.title}})
          }),
    )
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness value={{_key: 'drafts.foo', title: 'one'}} frames={frames} />,
    )
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
    const settled = frames.length

    // `drafts.foo` and `foo` are two items, not a draft and its published document
    rerender(<Harness value={{_key: 'foo', title: 'two'}} frames={frames} />)
    expect(frames.slice(settled).map((frame) => frame.title)).not.toContain('one')
    expect(frames.at(-1)).toEqual({isLoading: true, title: undefined, error: undefined})

    act(() => {
      second.next({snapshot: {title: 'two'}})
    })
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'two'})
  })

  it('resets to loading when a version switches to the published preview under an empty perspective stack', () => {
    const published = new Subject<{snapshot: {title: string}}>()
    observeForPreview.mockImplementation((value: {_id: string; title?: string}) =>
      value._id === 'a'
        ? published
        : new Observable((subscriber) => {
            subscriber.next({snapshot: {title: value.title}})
          }),
    )
    const frames: Frame[] = []
    const version = {_id: 'versions.r1.a', title: 'in release'}
    const {rerender} = render(<Harness value={version} perspectiveStack={[]} frames={frames} />)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'in release'})
    const settled = frames.length

    // the caller's stack is already empty, so only the switch to the published document itself
    // distinguishes the new target from the version
    rerender(
      <Harness
        value={{...version, _system: {delete: true}}}
        perspectiveStack={[]}
        frames={frames}
      />,
    )
    expect(frames.slice(settled).map((frame) => frame.title)).not.toContain('in release')
    expect(frames.at(-1)).toEqual({isLoading: true, title: undefined, error: undefined})

    act(() => {
      published.next({snapshot: {title: 'published'}})
    })
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'published'})
  })

  it('does not resubscribe when the inherited perspective stack is rebuilt with the same contents', () => {
    const frames: Frame[] = []
    const value = {_id: 'a', title: 'one'}
    const {rerender} = render(<Harness value={value} frames={frames} />)
    const settled = frames.length

    // the perspective context rebuilds its stack whenever the releases change
    currentPerspective = {perspectiveStack: ['drafts'], selectedVariantName: undefined}
    rerender(<Harness value={value} frames={frames} />)

    expect(observeForPreview).toHaveBeenCalledTimes(1)
    expect(subscriptions.total).toBe(1)
    expect(frames.slice(settled).some((frame) => frame.isLoading)).toBe(false)
  })

  it('does not mistake an id-less object for a document whose id spells its own key', () => {
    const inline = new Subject<{snapshot: {title: string}}>()
    observeForPreview.mockImplementation((value: {_id?: string; title: string}) =>
      value._id === undefined
        ? inline
        : new Observable((subscriber) => {
            subscriber.next({snapshot: {title: value.title}})
          }),
    )
    const frames: Frame[] = []
    const {rerender} = render(
      <Harness value={{_id: 'inline', title: 'a document named inline'}} frames={frames} />,
    )
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'a document named inline'})
    const settled = frames.length

    rerender(<Harness value={{title: 'plain object'}} frames={frames} />)
    expect(frames.slice(settled).map((frame) => frame.title)).not.toContain(
      'a document named inline',
    )
    expect(frames.at(-1)).toEqual({isLoading: true, title: undefined, error: undefined})

    act(() => {
      inline.next({snapshot: {title: 'plain object'}})
    })
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'plain object'})
  })

  it('previews an array item as it is, without synthesizing a document id', () => {
    const item = {_key: 'item-1', _type: 'item', title: 'In place'}
    const frames: Frame[] = []
    render(<Harness value={item} frames={frames} />)

    // the very object, so nothing downstream can mistake it for a document
    expect(observeForPreview.mock.lastCall?.[0]).toBe(item)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'In place'})
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

  it('keeps the preview when a draft of a cross-dataset document is materialized', () => {
    const frames: Frame[] = []
    const reference = {_projectId: 'p1', _dataset: 'd1'}
    const {rerender} = render(
      <Harness value={{...reference, _ref: 'x', title: 'one'}} frames={frames} />,
    )
    const settled = frames.length

    rerender(
      <Harness value={{...reference, _ref: 'drafts.x', title: 'one edited'}} frames={frames} />,
    )
    rerender(
      <Harness
        value={{...reference, _ref: 'versions.r1.x', title: 'in release'}}
        frames={frames}
      />,
    )

    expect(frames.slice(settled).some((frame) => frame.isLoading)).toBe(false)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'in release'})

    // the same document in another dataset is a different target
    rerender(
      <Harness
        value={{...reference, _dataset: 'd2', _ref: 'x', title: 'elsewhere'}}
        frames={frames}
      />,
    )
    expect(frames.slice(settled).some((frame) => frame.isLoading)).toBe(true)
  })

  it('does not resubscribe a version preview when the global perspective or variant changes', () => {
    const frames: Frame[] = []
    const value = {_id: 'a', title: 'one'}
    const {rerender} = render(
      <Harness value={value} frames={frames} perspectiveStack={['r1', 'drafts']} />,
    )
    const settled = frames.length

    // the caller previews a specific version, so the global selection does not take part
    currentPerspective = {perspectiveStack: ['r2', 'drafts'], selectedVariantName: 'variant'}
    rerender(<Harness value={value} frames={frames} perspectiveStack={['r1', 'drafts']} />)

    expect(observeForPreview).toHaveBeenCalledTimes(1)
    expect(subscriptions.total).toBe(1)
    expect(frames.slice(settled).some((frame) => frame.isLoading)).toBe(false)
  })

  it('follows the global perspective when the caller does not choose one', () => {
    const frames: Frame[] = []
    const value = {_id: 'a', title: 'one'}
    const {rerender} = render(<Harness value={value} frames={frames} />)
    expect(observeForPreview).toHaveBeenLastCalledWith(
      value,
      schemaType,
      expect.objectContaining({perspective: ['drafts']}),
    )

    currentPerspective = {perspectiveStack: ['r2', 'drafts'], selectedVariantName: undefined}
    rerender(<Harness value={value} frames={frames} />)

    expect(observeForPreview).toHaveBeenCalledTimes(2)
    expect(observeForPreview).toHaveBeenLastCalledWith(
      value,
      schemaType,
      expect.objectContaining({perspective: ['r2', 'drafts']}),
    )
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
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

  it('drops an inline preview in the render that loses the value, not after an effect', () => {
    const frames: Frame[] = []
    // a plain object previewed in place has no id
    const {rerender} = render(<Harness value={{title: 'one'}} frames={frames} />)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
    const settled = frames.length

    rerender(<Harness value={undefined} frames={frames} />)
    expect(frames.length).toBeGreaterThan(settled)
    for (const frame of frames.slice(settled)) {
      expect(frame).toEqual({isLoading: false, title: undefined, error: undefined})
    }

    // nor is the next inline value mistaken for the previous one
    rerender(<Harness value={{title: 'two'}} frames={frames} />)
    expect(frames.slice(settled).map((frame) => frame.title)).not.toContain('one')
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'two'})
  })

  it.each([
    ['the value is removed', {value: undefined}],
    ['the preview is disabled', {enabled: false}],
    ['the schema type is removed', {schemaType: undefined}],
  ])('renders the idle state, not loading, in the render where %s', async (_, props) => {
    const frames: Frame[] = []
    const {rerender} = render(<Harness value={{_id: 'a', title: 'one'}} frames={frames} />)
    expect(frames.at(-1)).toMatchObject({isLoading: false, title: 'one'})
    const settled = frames.length

    rerender(<Harness value={{_id: 'a', title: 'one'}} {...props} frames={frames} />)
    expect(frames.length).toBeGreaterThan(settled)
    for (const frame of frames.slice(settled)) {
      expect(frame).toEqual({isLoading: false, title: undefined, error: undefined})
    }
    // and the document is no longer observed (react-rx releases a swapped-out source a tick later)
    await vi.waitFor(() => expect(subscriptions.active).toBe(0))
  })
})
