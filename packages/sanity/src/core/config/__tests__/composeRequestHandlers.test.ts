import {type RequestHandler} from '@sanity/client'
import {describe, expect, it, vi} from 'vitest'

import {composeRequestHandlers} from '../composeRequestHandlers'

describe('composeRequestHandlers', () => {
  it('returns the outer handler when there is no inner one', () => {
    const outer: RequestHandler = (request, next) => next(request)
    expect(composeRequestHandlers(outer, undefined)).toBe(outer)
  })

  it('lets the inner handler recover a failure before the outer one sees it', async () => {
    const seenByOuter = vi.fn()
    const outer: RequestHandler = async (request, next) => {
      try {
        return await next(request)
      } catch (err) {
        seenByOuter(err)
        throw err
      }
    }
    const inner: RequestHandler = async (request, next) => {
      try {
        return await next(request)
      } catch {
        return next({...request, headers: {Authorization: 'Bearer renewed'}})
      }
    }
    const network = vi
      .fn()
      .mockRejectedValueOnce(new Error('expired'))
      .mockResolvedValueOnce({ok: true})

    const result = await composeRequestHandlers(outer, inner)({url: '/data/query'}, network)

    expect(result).toEqual({ok: true})
    expect(network).toHaveBeenLastCalledWith({
      url: '/data/query',
      headers: {Authorization: 'Bearer renewed'},
    })
    expect(seenByOuter).not.toHaveBeenCalled()
  })

  it('passes a failure the inner handler cannot recover on to the outer one', async () => {
    const seenByOuter = vi.fn()
    const outer: RequestHandler = (request, next) =>
      next(request).catch((err) => {
        seenByOuter(err)
        throw err
      })
    const inner: RequestHandler = (request, next) => next(request)
    const failure = new Error('invalid session')

    await expect(
      composeRequestHandlers(outer, inner)({url: '/data/query'}, () => Promise.reject(failure)),
    ).rejects.toBe(failure)
    expect(seenByOuter).toHaveBeenCalledWith(failure)
  })
})
