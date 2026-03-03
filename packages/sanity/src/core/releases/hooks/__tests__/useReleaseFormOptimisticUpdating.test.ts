import {type EditableReleaseDocument} from '@sanity/client'
import {renderHook, act} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {useReleaseFormOptimisticUpdating} from '../useReleaseFormOptimisticUpdating'

function createExternalValue(
  overrides: Partial<EditableReleaseDocument> = {},
): EditableReleaseDocument {
  return {
    _id: '_.releases.test-release',
    _createdAt: '2024-01-01T00:00:00Z',
    state: 'active',
    metadata: {
      title: 'Initial Title',
      description: 'Initial Description',
      releaseType: 'asap',
    },
    ...overrides,
    // Ensure metadata merges correctly when overrides include metadata
    ...(overrides.metadata
      ? {
          metadata: {
            title: 'Initial Title',
            description: 'Initial Description',
            releaseType: 'asap',
            ...overrides.metadata,
          },
        }
      : {}),
  }
}

function extractData({metadata}: EditableReleaseDocument) {
  return {
    title: metadata.title ?? '',
    description: metadata.description ?? '',
  }
}

describe('useReleaseFormOptimisticUpdating', () => {
  it('should not overwrite a focused field when the server value changes', () => {
    const initialValue = createExternalValue({
      metadata: {title: 'Local Title', description: 'Desc'},
    })

    const {result, rerender} = renderHook(
      ({externalValue, id}: {externalValue: EditableReleaseDocument; id: string}) =>
        useReleaseFormOptimisticUpdating({externalValue, id, extractData}),
      {initialProps: {externalValue: initialValue, id: initialValue._id}},
    )

    // Focus the title field
    act(() => {
      result.current.createFocusHandler('title')()
    })

    // Simulate local editing of the title
    act(() => {
      result.current.updateLocalData({title: 'User Typed Title'})
    })

    expect(result.current.localData.title).toBe('User Typed Title')

    // Server pushes a different title
    const serverUpdatedValue = createExternalValue({
      metadata: {title: 'Server Updated Title', description: 'Desc'},
    })

    rerender({externalValue: serverUpdatedValue, id: initialValue._id})

    // Title is focused, so local value should be preserved
    expect(result.current.localData.title).toBe('User Typed Title')
  })

  it('should overwrite an unfocused field when the server value changes', () => {
    const initialValue = createExternalValue({
      metadata: {title: 'Original Title', description: 'Desc'},
    })

    const {result, rerender} = renderHook(
      ({externalValue, id}: {externalValue: EditableReleaseDocument; id: string}) =>
        useReleaseFormOptimisticUpdating({externalValue, id, extractData}),
      {initialProps: {externalValue: initialValue, id: initialValue._id}},
    )

    // Focus the description field (not title)
    act(() => {
      result.current.createFocusHandler('description')()
    })

    // Server pushes a new title
    const serverUpdatedValue = createExternalValue({
      metadata: {title: 'Server Updated Title', description: 'Desc'},
    })

    rerender({externalValue: serverUpdatedValue, id: initialValue._id})

    // Title is unfocused, so it should reflect the server value
    expect(result.current.localData.title).toBe('Server Updated Title')
  })

  it('should sync all fields and reset focus when the ID changes', () => {
    const initialValue = createExternalValue({
      _id: '_.releases.release-a',
      metadata: {title: 'Release A Title', description: 'Release A Desc'},
    })

    const {result, rerender} = renderHook(
      ({externalValue, id}: {externalValue: EditableReleaseDocument; id: string}) =>
        useReleaseFormOptimisticUpdating({externalValue, id, extractData}),
      {initialProps: {externalValue: initialValue, id: initialValue._id}},
    )

    // Focus a field and set local data
    act(() => {
      result.current.createFocusHandler('title')()
    })

    act(() => {
      result.current.updateLocalData({title: 'Locally Edited Title'})
    })

    expect(result.current.focusedField).toBe('title')
    expect(result.current.localData.title).toBe('Locally Edited Title')

    // Switch to a completely different release
    const newValue = createExternalValue({
      _id: '_.releases.release-b',
      metadata: {title: 'Release B Title', description: 'Release B Desc'},
    })

    rerender({externalValue: newValue, id: newValue._id})

    // All local data should match the new external value
    expect(result.current.localData.title).toBe('Release B Title')
    expect(result.current.localData.description).toBe('Release B Desc')
    // Focus should be reset
    expect(result.current.focusedField).toBeNull()
  })
})
