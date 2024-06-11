import {describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {useSource, useTreeEditingEnabled} from 'sanity'

import {TreeEditingEnabledProvider} from '../context'

// Mock the entire module
jest.mock('../../../../studio/source')

const mockedUseInnerHook = useSource as jest.Mock

const wrapper = ({children}: PropsWithChildren) => (
  <TreeEditingEnabledProvider>{children}</TreeEditingEnabledProvider>
)

const legacyEditingWrapper = ({children}: PropsWithChildren) => (
  <TreeEditingEnabledProvider legacyEditingEnabled>{children}</TreeEditingEnabledProvider>
)

describe('useTreeEditingEnabled', () => {
  test('should return enabled: false when config is not enabled', () => {
    const features = {
      features: {
        beta: {
          treeArrayEditing: {
            enabled: false,
          },
        },
      },
    }
    mockedUseInnerHook.mockImplementation(() => features)

    const {result} = renderHook(() => useTreeEditingEnabled(), {wrapper})

    expect(result.current).toEqual({enabled: false, legacyEditing: false})
  })

  test('should return enabled: true when config is enabled', () => {
    const features = {
      features: {
        beta: {
          treeArrayEditing: {
            enabled: true,
          },
        },
      },
    }
    mockedUseInnerHook.mockImplementation(() => features)

    const {result} = renderHook(() => useTreeEditingEnabled(), {wrapper})

    expect(result.current).toEqual({enabled: true, legacyEditing: false})
  })

  test('should return legacyEditing: true when legacyEditingEnabled is true', () => {
    const {result} = renderHook(() => useTreeEditingEnabled(), {wrapper: legacyEditingWrapper})

    expect(result.current).toEqual({enabled: true, legacyEditing: true})
  })
})
