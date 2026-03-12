import {Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {measureFirstEmission, measureFirstMatch} from '../measureFirstEmission'

describe('measureFirstEmission', () => {
  it('calls onMeasured with duration and value on first emission', () => {
    const onMeasured = vi.fn()
    const subject = new Subject<string>()

    subject.pipe(measureFirstEmission(onMeasured)).subscribe()

    subject.next('first')
    expect(onMeasured).toHaveBeenCalledTimes(1)
    expect(onMeasured).toHaveBeenCalledWith(expect.any(Number), 'first')
    expect(onMeasured.mock.calls[0][0]).toBeGreaterThanOrEqual(0)
  })

  it('only fires once per subscription', () => {
    const onMeasured = vi.fn()
    const subject = new Subject<string>()

    subject.pipe(measureFirstEmission(onMeasured)).subscribe()

    subject.next('first')
    subject.next('second')
    subject.next('third')

    expect(onMeasured).toHaveBeenCalledTimes(1)
    expect(onMeasured).toHaveBeenCalledWith(expect.any(Number), 'first')
  })

  it('does not alter the data flow', () => {
    const onMeasured = vi.fn()
    const subject = new Subject<number>()
    const received: number[] = []

    subject.pipe(measureFirstEmission(onMeasured)).subscribe((v) => received.push(v))

    subject.next(1)
    subject.next(2)
    subject.next(3)

    expect(received).toEqual([1, 2, 3])
  })

  it('resets on re-subscription', () => {
    const onMeasured = vi.fn()
    const subject = new Subject<string>()

    const source$ = subject.pipe(measureFirstEmission(onMeasured))

    const sub1 = source$.subscribe()
    subject.next('a')
    sub1.unsubscribe()

    const sub2 = source$.subscribe()
    subject.next('b')
    sub2.unsubscribe()

    expect(onMeasured).toHaveBeenCalledTimes(2)
    expect(onMeasured).toHaveBeenNthCalledWith(1, expect.any(Number), 'a')
    expect(onMeasured).toHaveBeenNthCalledWith(2, expect.any(Number), 'b')
  })
})

describe('measureFirstMatch', () => {
  it('calls onMeasured on first emission matching the predicate', () => {
    const onMeasured = vi.fn()
    const subject = new Subject<number>()

    subject.pipe(measureFirstMatch((v) => v > 5, onMeasured)).subscribe()

    subject.next(1)
    subject.next(3)
    expect(onMeasured).not.toHaveBeenCalled()

    subject.next(10)
    expect(onMeasured).toHaveBeenCalledTimes(1)
    expect(onMeasured).toHaveBeenCalledWith(expect.any(Number), 10)
  })

  it('only fires once even after multiple matches', () => {
    const onMeasured = vi.fn()
    const subject = new Subject<number>()

    subject.pipe(measureFirstMatch((v) => v > 5, onMeasured)).subscribe()

    subject.next(10)
    subject.next(20)
    subject.next(30)

    expect(onMeasured).toHaveBeenCalledTimes(1)
    expect(onMeasured).toHaveBeenCalledWith(expect.any(Number), 10)
  })

  it('does not alter the data flow', () => {
    const onMeasured = vi.fn()
    const subject = new Subject<number>()
    const received: number[] = []

    subject.pipe(measureFirstMatch((v) => v > 5, onMeasured)).subscribe((v) => received.push(v))

    subject.next(1)
    subject.next(10)
    subject.next(2)

    expect(received).toEqual([1, 10, 2])
  })

  it('resets on re-subscription', () => {
    const onMeasured = vi.fn()
    const subject = new Subject<number>()

    const source$ = subject.pipe(measureFirstMatch((v) => v > 5, onMeasured))

    const sub1 = source$.subscribe()
    subject.next(10)
    sub1.unsubscribe()

    const sub2 = source$.subscribe()
    subject.next(20)
    sub2.unsubscribe()

    expect(onMeasured).toHaveBeenCalledTimes(2)
    expect(onMeasured).toHaveBeenNthCalledWith(1, expect.any(Number), 10)
    expect(onMeasured).toHaveBeenNthCalledWith(2, expect.any(Number), 20)
  })

  it('never fires if no emission matches', () => {
    const onMeasured = vi.fn()
    const subject = new Subject<number>()

    subject.pipe(measureFirstMatch((v) => v > 100, onMeasured)).subscribe()

    subject.next(1)
    subject.next(2)
    subject.next(3)
    subject.complete()

    expect(onMeasured).not.toHaveBeenCalled()
  })
})
