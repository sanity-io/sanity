import {type SanityClient} from '@sanity/client'
import {act, renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type VariantConditionsContext} from '../../../config/types'
import {useVariantConditions} from '../useVariantConditions'

function createClientWithInvoke(invoke: ReturnType<typeof vi.fn>): SanityClient {
  const client = createMockSanityClient() as unknown as SanityClient
  Object.assign(client, {functions: {invoke}})
  return client
}

describe('useVariantConditions', () => {
  it('returns freeform when conditions is not configured', async () => {
    const wrapper = await createTestProvider({
      config: {beta: {variants: {enabled: true}}},
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    expect(result.current).toEqual({mode: 'freeform'})
  })

  it('normalizes a static array without a loading state', async () => {
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions: [{name: 'audience', values: ['loyal']}],
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    expect(result.current).toEqual({
      mode: 'mapped',
      status: 'ready',
      definitions: [
        {
          name: 'audience',
          title: 'audience',
          values: [{value: 'loyal', title: 'loyal'}],
        },
      ],
    })
  })

  it('resolves an async function and can retry after an error', async () => {
    let shouldFail = true
    const conditions = async (context: VariantConditionsContext) => {
      if (shouldFail) {
        throw new Error(`unavailable in ${context.dataset}`)
      }

      return [{name: 'locale', values: ['en-US']}]
    }
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions,
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    expect(result.current).toEqual({mode: 'mapped', status: 'loading'})

    await waitFor(() => {
      expect(result.current).toMatchObject({
        mode: 'mapped',
        status: 'error',
        error: expect.objectContaining({message: 'unavailable in mock-data-set'}),
      })
    })

    shouldFail = false

    await act(async () => {
      if (result.current.mode === 'mapped' && result.current.status === 'error') {
        result.current.retry()
      }
    })

    await waitFor(() => {
      expect(result.current).toEqual({
        mode: 'mapped',
        status: 'ready',
        definitions: [
          {
            name: 'locale',
            title: 'locale',
            values: [{value: 'en-US', title: 'en-US'}],
          },
        ],
      })
    })
  })

  it('shares one async resolve across consumers', async () => {
    const conditions = vi.fn().mockResolvedValue([{name: 'locale', values: ['en-US']}])
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions,
          },
        },
      },
    })

    const {result: first} = renderHook(() => useVariantConditions(), {wrapper})
    const {result: second} = renderHook(() => useVariantConditions(), {wrapper})

    await waitFor(() => {
      expect(first.current).toMatchObject({mode: 'mapped', status: 'ready'})
      expect(second.current).toMatchObject({mode: 'mapped', status: 'ready'})
    })

    expect(conditions).toHaveBeenCalledTimes(1)
  })

  it('invokes a referenced Sanity Function synchronously and normalizes its result', async () => {
    const invoke = vi.fn().mockResolvedValue([{name: 'audience', values: ['loyal']}])
    const wrapper = await createTestProvider({
      client: createClientWithInvoke(invoke),
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions: {function: 'audience-conditions', stackId: 'ST-123'},
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    expect(result.current).toEqual({mode: 'mapped', status: 'loading'})

    await waitFor(() => {
      expect(result.current).toEqual({
        mode: 'mapped',
        status: 'ready',
        definitions: [
          {
            name: 'audience',
            title: 'audience',
            values: [{value: 'loyal', title: 'loyal'}],
          },
        ],
      })
    })

    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke).toHaveBeenCalledWith(
      'audience-conditions',
      {
        event: {data: {projectId: 'mock-project-id', dataset: 'mock-data-set'}},
        stackId: 'ST-123',
        organizationId: undefined,
        timeout: undefined,
      },
      {sync: true},
    )
  })

  it('reports an error when the referenced function does not return an array', async () => {
    const invoke = vi.fn().mockResolvedValue({audience: ['loyal']})
    const wrapper = await createTestProvider({
      client: createClientWithInvoke(invoke),
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions: {function: 'audience-conditions', stackId: 'ST-123'},
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    await waitFor(() => {
      expect(result.current).toMatchObject({
        mode: 'mapped',
        status: 'error',
        error: expect.objectContaining({
          message:
            'Expected function "audience-conditions" to return an array of variant conditions, but received object',
        }),
      })
    })
  })

  it('surfaces invoke failures with retry', async () => {
    const invoke = vi
      .fn()
      .mockRejectedValueOnce(
        new Error('Function "audience-conditions" not found in stack "ST-123"'),
      )
      .mockResolvedValueOnce([{name: 'locale', values: ['en-US']}])
    const wrapper = await createTestProvider({
      client: createClientWithInvoke(invoke),
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions: {function: 'audience-conditions', stackId: 'ST-123'},
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    await waitFor(() => {
      expect(result.current).toMatchObject({
        mode: 'mapped',
        status: 'error',
        error: expect.objectContaining({
          message: 'Function "audience-conditions" not found in stack "ST-123"',
        }),
      })
    })

    await act(async () => {
      if (result.current.mode === 'mapped' && result.current.status === 'error') {
        result.current.retry()
      }
    })

    await waitFor(() => {
      expect(result.current).toMatchObject({mode: 'mapped', status: 'ready'})
    })
    expect(invoke).toHaveBeenCalledTimes(2)
  })
})
