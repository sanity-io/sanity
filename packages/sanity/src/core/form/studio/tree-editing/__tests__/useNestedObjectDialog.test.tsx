import {renderHook} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {describe, expect, type Mock, test, vi} from 'vitest'

import {useSource} from '../../../../studio/source'
import {NestedObjectDialogProvider, useNestedObjectDialog} from '../context'

// Mock the entire module
vi.mock('../../../../studio/source')

const mockedUseInnerHook = useSource as Mock

const wrapper = ({children}: PropsWithChildren) => (
  <NestedObjectDialogProvider>{children}</NestedObjectDialogProvider>
)

const legacyEditingWrapper = ({children}: PropsWithChildren) => (
  <NestedObjectDialogProvider legacyEditing>{children}</NestedObjectDialogProvider>
)

describe('useNestedObjectDialog', () => {
  test('should return enabled: false when config is not enabled', () => {
    const features = {
      beta: {
        treeArrayEditing: {
          enabled: false,
        },
      },
    }
    mockedUseInnerHook.mockImplementation(() => features)

    const {result} = renderHook(() => useNestedObjectDialog(), {wrapper})

    expect(result.current).toEqual({enabled: false, legacyEditing: false})
  })

  test('should return enabled: true when config is enabled', () => {
    const features = {
      beta: {
        form: {
          enhancedObjectDialog: {
            enabled: true,
          },
        },
      },
    }
    mockedUseInnerHook.mockImplementation(() => features)

    const {result} = renderHook(() => useNestedObjectDialog(), {wrapper})

    expect(result.current).toEqual({enabled: true, legacyEditing: false})
  })

  test('should return legacyEditing: true when legacyEditing is true', () => {
    const {result} = renderHook(() => useNestedObjectDialog(), {wrapper: legacyEditingWrapper})

    expect(result.current).toEqual({enabled: true, legacyEditing: true})
  })
})
