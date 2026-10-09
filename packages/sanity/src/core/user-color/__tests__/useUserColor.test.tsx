import {act, renderHook} from '@testing-library/react'
import {type ReactNode} from 'react'
import {BehaviorSubject} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {ColorSchemeProvider} from '../../studio/colorScheme'
import {useUserColor} from '../hooks'
import {createUserColorManager} from '../manager'
import {UserColorManagerProvider} from '../provider'
import {type UserColorManager} from '../types'

function createWrapper(manager: UserColorManager) {
  return function Wrapper({children}: {children: ReactNode}) {
    return (
      <ColorSchemeProvider scheme="light">
        <UserColorManagerProvider manager={manager}>{children}</UserColorManagerProvider>
      </ColorSchemeProvider>
    )
  }
}

describe('useUserColor', () => {
  it("renders the user's color from the first render on", () => {
    const manager = createUserColorManager({scheme: 'light'})
    const rendered: string[] = []

    renderHook(
      () => {
        const color = useUserColor('pAda')
        rendered.push(color.name)
        return color
      },
      {wrapper: createWrapper(manager)},
    )

    const assigned = manager.get('pAda').name
    expect(assigned).not.toBe(manager.get(null).name)
    expect(rendered.length).toBeGreaterThan(0)
    // Every render, the first one included, showed the assigned color rather than the anonymous one
    expect(rendered).toEqual(rendered.map(() => assigned))
  })

  it('switches color with the user, and back to the anonymous one without a user', () => {
    const manager = createUserColorManager({scheme: 'light'})
    const rendered: string[] = []
    const initialProps: {userId: string | null} = {userId: 'pAda'}

    const {rerender} = renderHook(
      ({userId}: typeof initialProps) => {
        const color = useUserColor(userId)
        rendered.push(color.name)
        return color
      },
      {wrapper: createWrapper(manager), initialProps},
    )
    const ada = manager.get('pAda').name

    rendered.length = 0
    rerender({userId: 'pGrace'})

    const grace = manager.get('pGrace').name
    expect(grace).not.toBe(ada)
    // No render after the change showed Ada's color
    expect(rendered).toEqual(rendered.map(() => grace))

    rendered.length = 0
    rerender({userId: null})

    expect(rendered).toEqual(rendered.map(() => manager.get(null).name))
  })

  it('renders the anonymous color without a user', () => {
    const manager = createUserColorManager({scheme: 'light'})

    const {result} = renderHook(() => useUserColor(null), {wrapper: createWrapper(manager)})

    expect(result.current).toBe(manager.get(null))
  })

  it("follows the manager's color stream once subscribed", () => {
    const palette = createUserColorManager({scheme: 'light'})
    const first = palette.get('pAda')
    const second = palette.get('pGrace')
    expect(second).not.toBe(first)
    const colors = new BehaviorSubject(first)
    const manager: UserColorManager = {get: () => palette.get(null), listen: () => colors}

    const {result} = renderHook(() => useUserColor('pAda'), {wrapper: createWrapper(manager)})

    expect(result.current).toBe(first)

    act(() => {
      colors.next(second)
    })

    expect(result.current).toBe(second)
  })
})
