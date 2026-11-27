import {firstValueFrom, NEVER, timeout} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type VariantConditionsContext} from '../../../config/types'
import {getStaticConditionsLoadInfo, trackConditionsLoad} from '../trackConditionsLoad'

const getClient = vi.fn<VariantConditionsContext['getClient']>()
const context: VariantConditionsContext = {
  projectId: 'project',
  dataset: 'dataset',
  getClient,
  type: 'variant',
}
const definitions = [
  {name: 'audience', title: 'Audience', values: [{value: 'loyal', title: 'Loyal'}]},
  {
    name: 'locale',
    title: 'Locale',
    values: [
      {value: 'en-US', title: 'en-US'},
      {value: 'nb-NO', title: 'nb-NO'},
    ],
  },
]

describe('trackConditionsLoad', () => {
  it('describes the load and whether the callback used the Sanity client', () => {
    const load = trackConditionsLoad(context)
    load.setAsync(true)

    expect(load.context).toMatchObject({projectId: 'project', dataset: 'dataset', type: 'variant'})
    load.context.getClient({apiVersion: '2025-02-19'})
    expect(getClient).toHaveBeenCalledWith({apiVersion: '2025-02-19'})

    expect(load.finish(definitions)).toEqual({
      source: 'function',
      async: true,
      outcome: 'ready',
      durationMs: expect.any(Number),
      conditionCount: 2,
      valueCount: 3,
      usedSanityClient: true,
    })
  })

  it('reports a callback that never called the Sanity client', () => {
    expect(trackConditionsLoad(context).finish(definitions)).toMatchObject({
      async: false,
      usedSanityClient: false,
    })
  })

  it('tells a timeout apart from other failures', async () => {
    const timeoutError: unknown = await firstValueFrom(NEVER.pipe(timeout({first: 1}))).catch(
      (error: unknown) => error,
    )

    expect(trackConditionsLoad(context).finish(undefined, timeoutError)).toMatchObject({
      outcome: 'timeout',
      conditionCount: 0,
      valueCount: 0,
    })
    expect(trackConditionsLoad(context).finish(undefined, new Error('down'))).toMatchObject({
      outcome: 'error',
    })
  })
})

describe('getStaticConditionsLoadInfo', () => {
  it('describes a fixed list from the config', () => {
    expect(getStaticConditionsLoadInfo(definitions)).toEqual({
      source: 'static',
      async: false,
      outcome: 'ready',
      durationMs: 0,
      conditionCount: 2,
      valueCount: 3,
      usedSanityClient: false,
    })
    expect(getStaticConditionsLoadInfo(undefined)).toMatchObject({
      outcome: 'error',
      conditionCount: 0,
    })
  })
})
