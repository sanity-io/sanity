import {renderHook} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {describe, expect, type Mock, test, vi} from 'vitest'

import {useSource} from '../../../../studio/source'
import {TreeEditingEnabledProvider} from '../context/enabled/TreeEditingEnabledProvider'
import {useTreeEditingEnabled} from '../context/enabled/useTreeEditingEnabled'

// Mock the entire module
vi.mock('../../../../studio/source')

const mockedUseInnerHook = useSource as Mock

const wrapper = ({children}: PropsWithChildren) => (
  <TreeEditingEnabledProvider>{children}</TreeEditingEnabledProvider>
)

const legacyEditingWrapper = ({children}: PropsWithChildren) => (
  <TreeEditingEnabledProvider legacyEditing>{children}</TreeEditingEnabledProvider>
)

const nestedWrapper = ({children}: PropsWithChildren) => (
  <TreeEditingEnabledProvider legacyEditing>
    <TreeEditingEnabledProvider>{children}</TreeEditingEnabledProvider>
  </TreeEditingEnabledProvider>
)

describe('useTreeEditingEnabled', () => {
  test('should return enabled: false when config is not enabled', () => {
    const features = {
      beta: {
        treeArrayEditing: {
          enabled: false,
        },
      },
    }
    mockedUseInnerHook.mockImplementation(() => features)

    const {result} = renderHook(() => useTreeEditingEnabled(), {wrapper})

    expect(result.current).toEqual({enabled: false, legacyEditing: false})
  })

  test('should return enabled: false when config is enabled, beta feature is no longer available', () => {
    const features = {
      beta: {
        treeArrayEditing: {
          enabled: true,
        },
      },
    }
    mockedUseInnerHook.mockImplementation(() => features)

    const {result} = renderHook(() => useTreeEditingEnabled(), {wrapper})

    expect(result.current).toEqual({enabled: false, legacyEditing: false})
  })

  test('should return legacyEditing: true when legacyEditing is true', () => {
    const {result} = renderHook(() => useTreeEditingEnabled(), {wrapper: legacyEditingWrapper})

    expect(result.current).toEqual({enabled: false, legacyEditing: true})
  })

  test('should return legacyEditing: true when parent has legacyEditing enabled', () => {
    const {result} = renderHook(() => useTreeEditingEnabled(), {wrapper: nestedWrapper})

    expect(result.current).toEqual({enabled: false, legacyEditing: true})
  })
})
