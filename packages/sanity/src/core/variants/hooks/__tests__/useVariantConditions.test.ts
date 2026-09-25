import {act, renderHook, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type VariantConditionsContext} from '../../../config/types'
import {
  useVariantConditionMismatches,
  useVariantConditions,
  useVariantTypes,
} from '../useVariantConditions'

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
            types: {variant: {conditions: [{name: 'audience', values: ['loyal']}]}},
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

  it('normalizes a static list once for every consumer', async () => {
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            types: {variant: {conditions: [{name: 'audience', values: ['loyal']}]}},
          },
        },
      },
    })

    const first = renderHook(() => useVariantConditions(), {wrapper})
    const second = renderHook(() => useVariantConditions(), {wrapper})

    expect(first.result.current).toMatchObject({mode: 'mapped', status: 'ready'})
    expect(second.result.current).toMatchObject({mode: 'mapped', status: 'ready'})

    if (first.result.current.mode !== 'mapped' || first.result.current.status !== 'ready') {
      throw new Error('Expected the first consumer to be ready')
    }

    if (second.result.current.mode !== 'mapped' || second.result.current.status !== 'ready') {
      throw new Error('Expected the second consumer to be ready')
    }

    expect(second.result.current.definitions).toBe(first.result.current.definitions)
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
            types: {variant: {conditions}},
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
      if (
        result.current.mode !== 'mapped' ||
        result.current.status !== 'error' ||
        !result.current.retry
      ) {
        throw new Error('Expected a retryable error result')
      }

      result.current.retry()
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
            types: {variant: {conditions: () => [{name: 'locale', values: ['en-US', 'nb-NO']}]}},
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
            types: {
              variant: {
                conditions: () => {
                  throw new Error('bad resolver')
                },
              },
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
      config: {beta: {variants: {enabled: true, types: {variant: {conditions: first}}}}},
    })
    const secondWrapper = await createTestProvider({
      config: {beta: {variants: {enabled: true, types: {variant: {conditions: second}}}}},
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

  it('does not share a resolve between workspaces that reuse one resolver', async () => {
    const clients = new Set<VariantConditionsContext['getClient']>()
    const conditions = vi.fn(async (context: VariantConditionsContext) => {
      clients.add(context.getClient)
      return [{name: 'locale', values: ['en-US']}]
    })
    const editorial = await createTestProvider({
      config: {
        name: 'editorial',
        beta: {variants: {enabled: true, types: {variant: {conditions}}}},
      },
    })
    const marketing = await createTestProvider({
      config: {
        name: 'marketing',
        beta: {variants: {enabled: true, types: {variant: {conditions}}}},
      },
    })

    const {result: editorialResult} = renderHook(() => useVariantConditions(), {
      wrapper: editorial,
    })
    const {result: marketingResult} = renderHook(() => useVariantConditions(), {
      wrapper: marketing,
    })

    await waitFor(() => {
      expect(editorialResult.current).toMatchObject({mode: 'mapped', status: 'ready'})
      expect(marketingResult.current).toMatchObject({mode: 'mapped', status: 'ready'})
    })

    expect(conditions).toHaveBeenCalledTimes(2)
    expect(clients.size).toBe(2)
  })

  it('reuses a resolved list after the last subscriber unmounts', async () => {
    const conditions = vi.fn().mockResolvedValue([{name: 'locale', values: ['en-US']}])
    const wrapper = await createTestProvider({
      config: {beta: {variants: {enabled: true, types: {variant: {conditions}}}}},
    })

    const first = renderHook(() => useVariantConditions(), {wrapper})

    await waitFor(() => {
      expect(first.result.current).toMatchObject({mode: 'mapped', status: 'ready'})
    })

    first.unmount()

    const second = renderHook(() => useVariantConditions(), {wrapper})

    await waitFor(() => {
      expect(second.result.current).toMatchObject({mode: 'mapped', status: 'ready'})
    })

    expect(conditions).toHaveBeenCalledTimes(1)
  })

  it('shares one async resolve across consumers', async () => {
    const conditions = vi.fn().mockResolvedValue([{name: 'locale', values: ['en-US']}])
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            types: {variant: {conditions}},
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
            types: {variant: {conditions: []}},
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    expect(result.current).toMatchObject({
      mode: 'mapped',
      status: 'error',
      error: expect.objectContaining({
        message:
          'Expected `beta.variants.types.variant.conditions` to include at least one valid entry',
      }),
    })
    if (result.current.mode !== 'mapped' || result.current.status !== 'error') {
      throw new Error('Expected a static conditions error')
    }
    expect(result.current.retry).toBeUndefined()
    expect(console.error).toHaveBeenCalledWith(
      '[sanity] Invalid `beta.variants.types.variant.conditions`',
      expect.objectContaining({
        message:
          'Expected `beta.variants.types.variant.conditions` to include at least one valid entry',
      }),
    )
  })
  it('treats an undefined conditions function as a freeform mode', async () => {
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            types: {variant: {conditions: undefined}},
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    expect(result.current).toMatchObject({
      mode: 'freeform',
    })
  })

  it('treats a static list of only invalid entries as an error', async () => {
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            types: {variant: {conditions: [{name: '_system', values: ['ok']}]}},
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditions(), {wrapper})

    expect(result.current).toMatchObject({
      mode: 'mapped',
      status: 'error',
      error: expect.objectContaining({
        message:
          'Expected `beta.variants.types.variant.conditions` to include at least one valid entry',
      }),
    })
    if (result.current.mode !== 'mapped' || result.current.status !== 'error') {
      throw new Error('Expected a static conditions error')
    }
    expect(result.current.retry).toBeUndefined()
    expect(console.error).toHaveBeenCalledWith(
      '[sanity] Invalid `beta.variants.types.variant.conditions`',
      expect.objectContaining({
        message:
          'Expected `beta.variants.types.variant.conditions` to include at least one valid entry',
      }),
    )
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
            types: {variant: {conditions}},
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
            'Expected `beta.variants.types.variant.conditions` to include at least one valid entry',
        }),
      })
    })

    empty = false

    await act(async () => {
      if (
        result.current.mode !== 'mapped' ||
        result.current.status !== 'error' ||
        !result.current.retry
      ) {
        throw new Error('Expected a retryable error result')
      }

      result.current.retry()
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
            types: {variant: {conditions: []}},
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantConditionMismatches({audience: 'loyal'}), {
      wrapper,
    })

    expect(result.current).toEqual([])
  })

  it('labels the built-in variant type when config omits a label', async () => {
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            types: {variant: {conditions: []}},
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantTypes(), {wrapper})

    await waitFor(() => {
      expect(result.current).toMatchObject({
        status: 'ready',
        types: [expect.objectContaining({key: 'variant', label: 'Variant'})],
      })
    })
  })

  it('reports a types resolver that returns a non-object as an error that can be retried', async () => {
    let resolved: unknown = null
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            types: async () => resolved as Record<string, {label: string}>,
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantTypes(), {wrapper})

    await waitFor(() => {
      expect(result.current).toMatchObject({
        status: 'error',
        error: expect.objectContaining({
          message: 'Expected `beta.variants.types` to resolve to an object, but received null',
        }),
      })
    })

    resolved = 'variant'
    await act(async () => {
      if (result.current.status === 'error') {
        result.current.retry()
      }
    })

    await waitFor(() => {
      expect(result.current).toMatchObject({
        status: 'error',
        error: expect.objectContaining({
          message: 'Expected `beta.variants.types` to resolve to an object, but received string',
        }),
      })
    })

    resolved = {variant: {label: 'Variant'}}
    await act(async () => {
      if (result.current.status === 'error') {
        result.current.retry()
      }
    })

    await waitFor(() => {
      expect(result.current).toMatchObject({
        status: 'ready',
        types: [
          expect.objectContaining({
            key: 'variant',
            label: 'Variant',
            conditions: {mode: 'freeform'},
          }),
        ],
      })
    })
  })

  it('reports a types resolver that returns a non-object type entry as an error', async () => {
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            types: async () => ({variant: null}) as unknown as Record<string, {label: string}>,
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantTypes(), {wrapper})

    await waitFor(() => {
      expect(result.current).toMatchObject({
        status: 'error',
        error: expect.objectContaining({
          message: 'Expected `beta.variants.types.variant` to be an object, but received null',
        }),
      })
    })
  })

  it('resolves a type other than variant', async () => {
    const wrapper = await createTestProvider({
      config: {
        beta: {
          variants: {
            enabled: true,
            types: async () => ({
              variant: {label: 'Variant'},
              language: {label: 'Language'},
            }),
          },
        },
      },
    })

    const {result} = renderHook(() => useVariantTypes(), {wrapper})

    await waitFor(() => {
      expect(result.current).toMatchObject({
        status: 'ready',
        types: expect.arrayContaining([
          expect.objectContaining({key: 'variant'}),
          expect.objectContaining({key: 'language', label: 'Language'}),
        ]),
      })
    })
  })
})
