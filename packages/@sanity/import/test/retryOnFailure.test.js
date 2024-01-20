import {describe, expect, jest, test} from '@jest/globals'

const retryOnFailure = require('../src/util/retryOnFailure')

describe('retry on failure utility', () => {
  test('does not retry on initial success', async () => {
    const fn = jest.fn()
    fn.mockReturnValueOnce(Promise.resolve('hei'))

    expect(await retryOnFailure(fn)).toEqual('hei')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('retries on failure up to maximum of 3 attempts', async () => {
    const error = new Error('nope')
    const fn = jest.fn()
    fn.mockReturnValue(Promise.reject(error))

    await expect(retryOnFailure(fn)).rejects.toEqual(error)

    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('retries on failure up to maximum of configured attempts', async () => {
    const start = Date.now()

    const error = new Error('nope')
    const fn = jest.fn()
    fn.mockReturnValue(Promise.reject(error))

    await expect(retryOnFailure(fn, {maxTries: 5})).rejects.toEqual(error)

    expect(fn).toHaveBeenCalledTimes(5)
    expect(Date.now() - start).toBeGreaterThanOrEqual(150 * 5)
  })

  test('succeeds if second attempt succeeds', async () => {
    const fn = jest.fn()
    fn.mockReturnValueOnce(Promise.reject(new Error('nope')))
    fn.mockReturnValueOnce(Promise.resolve('moop'))

    expect(await retryOnFailure(fn)).toEqual('moop')

    expect(fn).toHaveBeenCalledTimes(2)
  })
})
