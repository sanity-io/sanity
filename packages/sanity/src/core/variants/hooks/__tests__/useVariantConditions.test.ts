import {act, renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type VariantConditionsContext} from '../../../config/types'
import {useVariantConditions} from '../useVariantConditions'

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
})
