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

  it('is active while its link is hovered, and not otherwise', () => {
    const {result} = renderHook(() => usePerspectiveDetailLink({selected: false}))
    expect(result.current.linkProps.active).toBe(false)

    act(() => result.current.linkProps.onMouseEnter())
    expect(result.current.linkProps.active).toBe(true)

    act(() => result.current.linkProps.onMouseLeave())
    expect(result.current.linkProps.active).toBe(false)
  })

  it('is active while the menu marks its item active, and stops when the menu moves on', async () => {
    const item = document.createElement('button')
    document.body.append(item)
    // The hook reads its item when it mounts, so the item is attached while it renders
    const {result: mounted} = renderHook(() => {
      const hook = usePerspectiveDetailLink({selected: false})
      ;(hook.menuItemProps.ref as {current: HTMLButtonElement | null}).current = item
      return hook
    })
    expect(mounted.current.linkProps.active).toBe(false)

    await act(async () => {
      item.setAttribute('data-selected', '')
      await Promise.resolve()
    })
    expect(mounted.current.linkProps.active).toBe(true)

    await act(async () => {
      item.removeAttribute('data-selected')
      await Promise.resolve()
    })
    expect(mounted.current.linkProps.active).toBe(false)
    item.remove()
  })
})
