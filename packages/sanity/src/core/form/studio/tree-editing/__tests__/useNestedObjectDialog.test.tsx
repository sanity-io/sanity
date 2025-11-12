import {renderHook} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {describe, expect, type Mock, test, vi} from 'vitest'

import {useSource} from '../../../../studio/source'
import {EnhancedObjectDialogProvider, useEnhancedObjectDialog} from '../context'

// Mock the entire module
vi.mock('../../../../studio/source')

const mockedUseInnerHook = useSource as Mock

const wrapper = ({children}: PropsWithChildren) => (
  <EnhancedObjectDialogProvider>{children}</EnhancedObjectDialogProvider>
)

const legacyEditingWrapper = ({children}: PropsWithChildren) => (
  <EnhancedObjectDialogProvider legacyEditing>{children}</EnhancedObjectDialogProvider>
)

const isDialogAvailableWrapper = ({children}: PropsWithChildren) => (
  <EnhancedObjectDialogProvider isDialogAvailable>{children}</EnhancedObjectDialogProvider>
)

describe('useEnhancedObjectDialog', () => {
  test('should return enabled: false when config is not enabled', () => {
    const features = {
      beta: {
        treeArrayEditing: {
          enabled: false,
        },
      },
    }
    mockedUseInnerHook.mockImplementation(() => features)

    const {result} = renderHook(() => useEnhancedObjectDialog(), {wrapper})

    expect(result.current).toEqual({enabled: false, legacyEditing: false, isDialogAvailable: false})
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

    const {result} = renderHook(() => useEnhancedObjectDialog(), {wrapper})

    expect(result.current).toEqual({enabled: true, legacyEditing: false, isDialogAvailable: false})
  })

  test('should return legacyEditing: true when legacyEditing is true', () => {
    const {result} = renderHook(() => useEnhancedObjectDialog(), {wrapper: legacyEditingWrapper})

    expect(result.current).toEqual({enabled: true, legacyEditing: true, isDialogAvailable: false})
  })

  test('should return isDialogAvailable: true when isDialogAvailable is true', () => {
    const {result} = renderHook(() => useEnhancedObjectDialog(), {
      wrapper: isDialogAvailableWrapper,
    })

    expect(result.current).toEqual({enabled: true, legacyEditing: false, isDialogAvailable: true})
  })
})
