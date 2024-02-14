import {ConcurrencyLimiter} from '../src/concurrency-limiter'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('ConcurrencyLimiter', () => {
  it('keeps track of inflight operations and prevents more than the max concurrency at a time', async () => {
    const limiter = new ConcurrencyLimiter(2)

    const promise1Cb = jest.fn()
    const promise2Cb = jest.fn()
    const promise3Cb = jest.fn()
    const promise4Cb = jest.fn()

    const allDone = Promise.all([
      limiter.ready().then(promise1Cb),
      limiter.ready().then(promise2Cb),
      limiter.ready().then(promise3Cb),
      limiter.ready().then(promise4Cb),
    ])
    await tick()

    expect(promise1Cb).toHaveBeenCalled()
    expect(promise2Cb).toHaveBeenCalled()
    expect(promise3Cb).not.toHaveBeenCalled()
    expect(promise4Cb).not.toHaveBeenCalled()

    limiter.release()
    await tick()

    expect(promise3Cb).toHaveBeenCalled()
    expect(promise4Cb).not.toHaveBeenCalled()

    limiter.release()
    await tick()

    expect(promise4Cb).toHaveBeenCalled()

    await allDone
  })
})
