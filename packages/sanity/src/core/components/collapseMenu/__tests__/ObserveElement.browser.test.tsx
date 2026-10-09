import {useMemo, useState} from 'react'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'

import {withSilentIntersectionObserver} from '../../../../../test/browser/testHelpers'
import {type ObservedIntersection, ObserveElement} from '../ObserveElement'

// A 100px row with two 60px items: the first fits, the second is clipped.
const ROW_WIDTH = 100
const ITEM_WIDTH = 60

type Report = (name: string, entry: ObservedIntersection) => void

/**
 * Observes two items against the row they sit in, the way the collapse menus observe their
 * measurement clones: the row is the observer root, known after the first commit.
 */
function Row(props: {onReport: Report; width: number}) {
  const {onReport, width} = props
  const [rowEl, setRowEl] = useState<HTMLDivElement | null>(null)
  const options = useMemo(() => ({root: rowEl, threshold: 1, rootMargin: '1px'}), [rowEl])
  return (
    <>
      <style>{`.observed-item { flex-shrink: 0; }`}</style>
      <div ref={setRowEl} style={{display: 'flex', gap: 4, overflow: 'hidden', width}}>
        {rowEl &&
          ['first', 'second'].map((name) => (
            <ObserveElement
              className="observed-item"
              key={name}
              options={options}
              onIntersectionChange={(entries) => onReport(name, entries[entries.length - 1])}
            >
              <div data-testid={name} style={{width: ITEM_WIDTH}}>
                {name}
              </div>
            </ObserveElement>
          ))}
      </div>
    </>
  )
}

function reportsOf(onReport: ReturnType<typeof vi.fn<Report>>, name: string) {
  return onReport.mock.calls.filter(([n]) => n === name).map(([, entry]) => entry.isIntersecting)
}

describe('ObserveElement', () => {
  it('reports the intersection from its mount commit, before the observer has delivered', async () => {
    const onReport = vi.fn<Report>()

    await withSilentIntersectionObserver(async () => {
      await render(<Row onReport={onReport} width={ROW_WIDTH} />)
    })

    // One synchronous report per item, with the answer the observer would give for it
    expect(reportsOf(onReport, 'first')).toEqual([true])
    expect(reportsOf(onReport, 'second')).toEqual([false])
    // The reported target is the Flex wrapping the item, which is what the observer observes
    const [, entry] = onReport.mock.calls[0]
    expect(entry.target).toBe(document.querySelector('[data-testid="first"]')!.parentElement)
  })

  it('holds the observer to the threshold, whatever its entries say about an overlap', async () => {
    // Record the callback of each observer the component creates, by the targets it observes
    const RealIntersectionObserver = window.IntersectionObserver
    const observers: {callback: IntersectionObserverCallback; targets: Element[]}[] = []
    class RecordingIntersectionObserver extends RealIntersectionObserver {
      private readonly record: {callback: IntersectionObserverCallback; targets: Element[]}
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options)
        this.record = {callback, targets: []}
        observers.push(this.record)
      }
      override observe(target: Element): void {
        this.record.targets.push(target)
        super.observe(target)
      }
    }
    window.IntersectionObserver = RecordingIntersectionObserver
    const onReport = vi.fn<Report>()
    try {
      await render(<Row onReport={onReport} width={ROW_WIDTH} />)
    } finally {
      window.IntersectionObserver = RealIntersectionObserver
    }

    // What a browser whose `isIntersecting` means any overlap would deliver for the clipped
    // second item: a genuine entry, from a threshold-0 observer on the same element
    const second = document.querySelector('[data-testid="second"]')!.parentElement!
    const anyOverlapEntry = await new Promise<IntersectionObserverEntry>((resolve) => {
      const probe = new RealIntersectionObserver(
        ([entry]) => {
          probe.disconnect()
          resolve(entry)
        },
        {root: second.parentElement, threshold: 0, rootMargin: '1px'},
      )
      probe.observe(second)
    })
    expect(anyOverlapEntry.isIntersecting).toBe(true)
    expect(anyOverlapEntry.intersectionRatio).toBeGreaterThan(0.5)
    expect(anyOverlapEntry.intersectionRatio).toBeLessThan(1)

    const {callback} = observers.find((observer) => observer.targets.includes(second))!
    callback([anyOverlapEntry], new RealIntersectionObserver(() => undefined))

    // The mount report and every entry since agree: the clipped item does not reach threshold 1
    expect(reportsOf(onReport, 'second').length).toBeGreaterThanOrEqual(2)
    expect(reportsOf(onReport, 'second')).not.toContain(true)
  })

  it('keeps reporting through the observer once mounted', async () => {
    const onReport = vi.fn<Report>()
    const {rerender} = await render(<Row onReport={onReport} width={ROW_WIDTH} />)

    expect(reportsOf(onReport, 'second')[0]).toBe(false)

    // Widen the row: the second item now fits, which only the observer notices
    await rerender(<Row onReport={onReport} width={ROW_WIDTH * 2} />)

    await expect.poll(() => reportsOf(onReport, 'second').at(-1)).toBe(true)
    // The first item fit all along: the observer's own first entry agrees with the mount report
    expect(reportsOf(onReport, 'first')).not.toContain(false)
  })
})
