import {describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {useLegacyArrayEditing, useSource} from 'sanity'

import {LegacyArrayEditingProvider} from '../context'

// Mock the entire module
jest.mock('../../../../studio/source')

const mockedUseInnerHook = useSource as jest.Mock

const wrapper = ({children}: PropsWithChildren) => (
  <LegacyArrayEditingProvider>{children}</LegacyArrayEditingProvider>
)

const legacyEditingWrapper = ({children}: PropsWithChildren) => (
  <LegacyArrayEditingProvider enabled>{children}</LegacyArrayEditingProvider>
)

const nestedWrapper = ({children}: PropsWithChildren) => (
  <LegacyArrayEditingProvider enabled>
    <LegacyArrayEditingProvider>{children}</LegacyArrayEditingProvider>
  </LegacyArrayEditingProvider>
)

describe('useLegacyArrayEditing', () => {
  test('should return enabled: true when config is not enabled', () => {
    const features = {
      beta: {
        treeArrayEditing: {
          enabled: false,
        },
      },
    }
    mockedUseInnerHook.mockImplementation(() => features)

    const {result} = renderHook(() => useLegacyArrayEditing(), {wrapper})

    expect(result.current).toEqual({enabled: true})
  })

  test('should return enabled: true when config is enabled', () => {
    const features = {
      beta: {
        treeArrayEditing: {
          enabled: true,
        },
      },
    }
    mockedUseInnerHook.mockImplementation(() => features)

    const {result} = renderHook(() => useLegacyArrayEditing(), {wrapper})

    expect(result.current).toEqual({enabled: false})
  })

  test('should return legacyEditing: true when enabled is true', () => {
    const {result} = renderHook(() => useLegacyArrayEditing(), {wrapper: legacyEditingWrapper})

    mockedUseInnerHook.mockImplementation(() => {
      return {
        beta: {
          treeArrayEditing: {
            enabled: false,
          },
        },
      }
    })

    expect(result.current).toEqual({enabled: true})
  })

  test('should return legacyEditing: true when parent has enabled set to true', () => {
    const {result} = renderHook(() => useLegacyArrayEditing(), {wrapper: nestedWrapper})

    mockedUseInnerHook.mockImplementation(() => {
      return {
        beta: {
          treeArrayEditing: {
            enabled: true,
          },
        },
      }
    })

    expect(result.current).toEqual({enabled: true})
  })
})
