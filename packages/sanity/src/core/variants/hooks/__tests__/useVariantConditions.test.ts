import {act, renderHook, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type VariantConditionsContext} from '../../../config/types'
import {useVariantConditionMismatches, useVariantConditions} from '../useVariantConditions'

describe('useVariantConditions', () => {
  beforeEach(() => {
    // Resolver failures and dropped invalid entries are logged for studio developers;
    // keep the test output quiet.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  it('accepts a resolver that returns the list synchronously', async () => {
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions: () => [{name: 'locale', values: ['en-US', 'nb-NO']}],
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    await waitFor(() => {
      expect(result.current).toEqual({
        mode: 'mapped',
        status: 'ready',
        definitions: [
          {
            name: 'locale',
            title: 'locale',
            values: [
              {value: 'en-US', title: 'en-US'},
              {value: 'nb-NO', title: 'nb-NO'},
            ],
          },
        ],
      })
    })
  })

  it('reports a resolver that throws synchronously as an error', async () => {
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions: () => {
              throw new Error('bad resolver')
            },
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    await waitFor(() => {
      expect(result.current).toMatchObject({
        mode: 'mapped',
        status: 'error',
        error: expect.objectContaining({message: 'bad resolver'}),
      })
    })
  })

  it('does not share a resolve between different resolvers on the same workspace', async () => {
    const first = vi.fn().mockResolvedValue([{name: 'locale', values: ['en-US']}])
    const second = vi.fn().mockResolvedValue([{name: 'audience', values: ['loyal']}])
    const firstWrapper = await createTestProvider({
      config: {beta: {variants: {enabled: true, conditions: first}}},
    })
    const secondWrapper = await createTestProvider({
      config: {beta: {variants: {enabled: true, conditions: second}}},
    })

    const {result: firstResult} = renderHook(() => useVariantConditions(), {
      wrapper: firstWrapper,
    })
    const {result: secondResult} = renderHook(() => useVariantConditions(), {
      wrapper: secondWrapper,
    })

    await waitFor(() => {
      expect(firstResult.current).toMatchObject({
        status: 'ready',
        definitions: [expect.objectContaining({name: 'locale'})],
      })
      expect(secondResult.current).toMatchObject({
        status: 'ready',
        definitions: [expect.objectContaining({name: 'audience'})],
      })
    })

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
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

  it('treats an empty static list as an error', async () => {
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions: [],
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    expect(result.current).toMatchObject({
      mode: 'mapped',
      status: 'error',
      error: expect.objectContaining({
        message: 'Expected `beta.variants.conditions` to include at least one valid entry',
      }),
    })
    expect(console.error).toHaveBeenCalledWith(
      '[sanity] Failed to resolve `beta.variants.conditions`',
      expect.objectContaining({
        message: 'Expected `beta.variants.conditions` to include at least one valid entry',
      }),
    )
  })

  it('treats a static list of only invalid entries as an error', async () => {
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions: [{name: '_system', values: ['ok']}],
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    expect(result.current).toMatchObject({
      mode: 'mapped',
      status: 'error',
      error: expect.objectContaining({
        message: 'Expected `beta.variants.conditions` to include at least one valid entry',
      }),
    })
  })

  it('treats an empty resolved list as an error that can be retried', async () => {
    let empty = true
    const conditions = async () => {
      if (empty) {
        return []
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

    await waitFor(() => {
      expect(result.current).toMatchObject({
        mode: 'mapped',
        status: 'error',
        error: expect.objectContaining({
          message: 'Expected `beta.variants.conditions` to include at least one valid entry',
        }),
      })
    })

    empty = false

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

  it('does not report mismatches while the configured list is empty', async () => {
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions: [],
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditionMismatches({audience: 'loyal'}), {
      wrapper,
    })

    expect(result.current).toEqual([])
  })
})
