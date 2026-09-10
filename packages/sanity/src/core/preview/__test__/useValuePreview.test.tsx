import {type SchemaType} from '@sanity/types'
import {render} from '@testing-library/react'
import {Observable} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

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

function Harness({value, frames}: {value: unknown; frames: Frame[]}) {
  const state = useValuePreview({schemaType, value})
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
