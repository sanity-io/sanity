import {describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react'
import React from 'react'
import {type Path, useSource, useTreeArrayEditingConfig} from 'sanity'

// Mock the entire module
jest.mock('../../../../studio/source')

const mockedUseInnerHook = useSource as jest.Mock

describe('useTreeArrayEditingConfig', () => {
  const path: Path = []

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

    const {result} = renderHook(() => useTreeArrayEditingConfig(path))

    expect(result.current).toEqual({
      enabled: false,
      legacyEditing: false,
      exceptions: [],
      hasConflicts: false,
    })
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

    const {result} = renderHook(() => useTreeArrayEditingConfig(path))

    expect(result.current).toEqual({
      enabled: true,
      legacyEditing: false,
      exceptions: [],
      hasConflicts: false,
    })
  })

  // cover for legacy and PTE remaining with legacy editing
  test('should return legacyEditing: false when the PTE context has Editor Parent', () => {
    // Set the mock return value of useContext
    jest.spyOn(React, 'useContext').mockReturnValue({hasEditorParent: true})

    const {result} = renderHook(() => useTreeArrayEditingConfig(path))

    expect(result.current).toEqual({
      enabled: true,
      legacyEditing: true,
      exceptions: [],
      hasConflicts: false,
    })
  })
})
