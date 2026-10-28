/**
 * Regression guard for the observable-identity render-churn class
 * (see useDocumentValuesRenderLoop.repro.test.tsx for the original incident).
 *
 * `useValuePreview` once memoized its observable on the `value` / `ordering` /
 * `perspectiveStack` REFERENCES. Callers pass these inline — e.g.
 * UnpublishVersionDialog's `value: {_id}` object, useDocumentTitle's
 * `perspectiveStack: cond ? [] : undefined` — and inline references from
 * callers the React Compiler does not cover (customer components, plugins,
 * compiler bailouts) busted the memo every render, rebuilding and
 * resubscribing a fresh `observeForPreview(...).pipe(...)` per render
 * (verified pre-fix: one observeForPreview call per render).
 *
 * The hook now streams its inputs through a BehaviorSubject deduped with
 * `dequal`, keying the observable identity on `enabled`, the schema type and
 * the previewed document only. This suite pins that contract: inline-literal
 * inputs settle with exactly one subscription, updates still flow, and only
 * a CONTENT change in the inputs re-runs `observeForPreview`.
 *
 * Mounted via a raw createRoot with IS_REACT_ACT_ENVIRONMENT disabled: act
 * would flush and mask the churn's scheduling.
 */
import {type SchemaType} from '@sanity/types'
import {createRoot, type Root} from 'react-dom/client'
import {BehaviorSubject} from 'rxjs'
import {map} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type PerspectiveStack} from '../../perspective/types'
import {useValuePreview} from '../useValuePreview'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

// Mirrors the real preview store's shape: the underlying value is cached and
// replays synchronously to new subscribers, but every observeForPreview()
// call returns a NEW observable identity.
const cachedEvent$ = new BehaviorSubject<{type: 'snapshot'; snapshot: {title: string}}>({
  type: 'snapshot',
  snapshot: {title: 'hello'},
})
const observeForPreview = vi.fn(() => cachedEvent$.pipe(map((event) => event)))
vi.mock('../../store/datastores', () => ({
  useDocumentPreviewStore: () => ({observeForPreview}),
}))

const STABLE_STACK = ['drafts']
const NO_VARIANTS: string[] = []
vi.mock('../../perspective/usePerspective', () => ({
  usePerspective: () => ({perspectiveStack: STABLE_STACK, selectedVariantNames: NO_VARIANTS}),
}))

const schemaType = {name: 'testDoc', jsonType: 'object'} as unknown as SchemaType

const counters = {inline: 0}

function InlineProbe() {
  // oxlint-disable-next-line react/immutability -- deliberate render counter: this guard exists to make a loop measurable
  counters.inline++
  // The footgun call shape: fresh value object every render
  const {value} = useValuePreview({schemaType, value: {_id: 'doc-inline'}})
  return <div data-testid="inline">{value?.title}</div>
}

function StackProbe(props: {stack: PerspectiveStack}) {
  useValuePreview({schemaType, value: {_id: 'doc-stack'}, perspectiveStack: props.stack})
  return null
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

describe('useValuePreview render stability', () => {
  let container: HTMLElement
  let root: Root
  let previousActEnvironment: boolean | undefined

  beforeEach(() => {
    counters.inline = 0
    observeForPreview.mockClear()
    cachedEvent$.next({type: 'snapshot', snapshot: {title: 'hello'}})
    previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    root.unmount()
    container.remove()
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment
  })

  it('settles despite an inline value object (regression: render loop)', async () => {
    root.render(<InlineProbe />)
    await sleep(50)
    // A second render is the kick that exposed the bug before the fix: the
    // inline value object busted the memo, minting a new observable identity
    // (and a resubscription) per render.
    root.render(<InlineProbe />)
    await sleep(500)
    expect(counters.inline).toBeLessThan(10)
    // One observable for the one logical value — not one per render
    expect(observeForPreview).toHaveBeenCalledTimes(1)
  })

  it('still propagates value updates from the store', async () => {
    root.render(<InlineProbe />)
    await sleep(100)
    expect(container.textContent).toBe('hello')
    cachedEvent$.next({type: 'snapshot', snapshot: {title: 'updated'}})
    await sleep(100)
    expect(container.textContent).toBe('updated')
  })

  it('rebuilds the observable when the perspective stack contents actually change', async () => {
    root.render(<StackProbe stack={['rX']} />)
    await sleep(100)
    expect(observeForPreview).toHaveBeenCalledTimes(1)
    // Same contents, new array identity: no rebuild
    root.render(<StackProbe stack={['rX']} />)
    await sleep(100)
    expect(observeForPreview).toHaveBeenCalledTimes(1)
    // Different contents: rebuild
    root.render(<StackProbe stack={['rY']} />)
    await sleep(100)
    expect(observeForPreview).toHaveBeenCalledTimes(2)
  })
})
