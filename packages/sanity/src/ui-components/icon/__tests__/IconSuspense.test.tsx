import {act, render, screen} from '@testing-library/react'
import {type ComponentType, lazy, memo, type SVGProps} from 'react'
import {describe, expect, test} from 'vitest'

import {withIconSuspense} from '../IconSuspense'

function TestIcon(props: SVGProps<SVGSVGElement>) {
  return <svg data-testid="icon" {...props} />
}

describe('withIconSuspense', () => {
  test('returns the same wrapper for the same icon, so the icon stays mounted across renders', () => {
    const Lazy = lazy(() => Promise.resolve({default: TestIcon}))
    const Memo = memo(TestIcon)

    expect(withIconSuspense(TestIcon)).toBe(withIconSuspense(TestIcon))
    expect(withIconSuspense(Lazy)).toBe(withIconSuspense(Lazy))
    expect(withIconSuspense(Memo)).toBe(withIconSuspense(Memo))
    expect(withIconSuspense(TestIcon)).not.toBe(TestIcon)
  })

  test('returns anything that is not a component as is', () => {
    const element = <TestIcon />

    expect(withIconSuspense(element)).toBe(element)
    expect(withIconSuspense('svg')).toBe('svg')
    expect(withIconSuspense(undefined)).toBeUndefined()
    expect(withIconSuspense(null)).toBeNull()
  })

  test('renders a placeholder with the icon props while the icon loads, then the icon', async () => {
    let load!: (module: {default: ComponentType<SVGProps<SVGSVGElement>>}) => void
    const Icon = withIconSuspense(
      lazy(
        () =>
          new Promise<{default: ComponentType<SVGProps<SVGSVGElement>>}>((resolve) => {
            load = resolve
          }),
      ),
    )

    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the icon suspends during mount, and React only resumes work that suspended inside an awaited async `act`
    await act(async () => {
      render(<Icon className="sized" />)
    })

    const placeholder = document.querySelector('[data-sanity-icon-placeholder]')
    expect(placeholder).toHaveClass('sized')
    expect(placeholder).toHaveAttribute('width', '1em')
    expect(placeholder).toHaveAttribute('height', '1em')

    await act(async () => {
      load({default: TestIcon})
    })

    expect(screen.getByTestId('icon')).toHaveClass('sized')
    expect(document.querySelector('[data-sanity-icon-placeholder]')).not.toBeInTheDocument()
  })
})
