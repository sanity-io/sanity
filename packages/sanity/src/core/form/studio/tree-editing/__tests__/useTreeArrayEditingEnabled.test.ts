import {describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react'
import React from 'react'
import {useSource, useTreeArrayEditingEnabled} from 'sanity'

// Mock the entire module
jest.mock('../../../../studio/source')

const mockedUseInnerHook = useSource as jest.Mock

describe('useTreeArrayEditingEnabled', () => {
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

    const {result} = renderHook(() => useTreeArrayEditingEnabled())

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

    const {result} = renderHook(() => useTreeArrayEditingEnabled())

    expect(result.current).toEqual({enabled: true, legacyEditing: false})
  })

  // cover for legacy and PTE remaining with legacy editing
  test('should return legacyEditing: false when the PTE context has Editor Parent', () => {
    // Set the mock return value of useContext
    jest.spyOn(React, 'useContext').mockReturnValue({hasEditorParent: true})

    const {result} = renderHook(() => useTreeArrayEditingEnabled())

    expect(result.current).toEqual({enabled: true, legacyEditing: true})
  })
})
