import {act, renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {usePerspectiveDetailLink} from '../PerspectiveDetailLink'

describe('usePerspectiveDetailLink', () => {
  it('keeps the row highlighted while its link is hovered', () => {
    const {result} = renderHook(() => usePerspectiveDetailLink({selected: false}))

    act(() => result.current.linkProps.onMouseEnter())
    expect(result.current.menuItemProps['data-hovered']).toBe('')

    act(() => result.current.linkProps.onMouseLeave())
    expect(result.current.menuItemProps['data-hovered']).toBeUndefined()
  })

  it('leaves a selected row as it is while its link is hovered', () => {
    const {result} = renderHook(() => usePerspectiveDetailLink({selected: true}))

    act(() => result.current.linkProps.onMouseEnter())
    // The hover style would replace the selected row's fill
    expect(result.current.menuItemProps['data-hovered']).toBeUndefined()
  })
})
