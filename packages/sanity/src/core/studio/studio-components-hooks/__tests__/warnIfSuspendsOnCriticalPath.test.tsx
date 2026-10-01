import {lazy, Suspense} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type LayoutProps} from '../../../config/studio/types'
import {warnIfSuspendsOnCriticalPath} from '../warnIfSuspendsOnCriticalPath'

function Layout(props: LayoutProps) {
  return props.renderDefault(props)
}

// Warnings are once per slot and plugin, so each case uses its own plugin name
describe('warnIfSuspendsOnCriticalPath', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  afterEach(() => {
    warn.mockClear()
  })

  it('warns once for a React.lazy component', () => {
    const LazyLayout = lazy(() => Promise.resolve({default: Layout}))

    warnIfSuspendsOnCriticalPath('studio.components.layout', 'lazy-layout', LazyLayout)
    warnIfSuspendsOnCriticalPath('studio.components.layout', 'lazy-layout', LazyLayout)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatch(
      /studio\.components\.layout from "lazy-layout" is a `React\.lazy` component.*under <StudioLayout>/,
    )
  })

  it('warns for Suspense itself, describing the provider placement', () => {
    warnIfSuspendsOnCriticalPath('studio.components.provider', 'suspense-provider', Suspense)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatch(
      /studio\.components\.provider from "suspense-provider" is a `Suspense`.*above <StudioLayout>/,
    )
  })

  it('stays quiet for a plain component or no component', () => {
    warnIfSuspendsOnCriticalPath('studio.components.layout', 'plain-layout', Layout)
    warnIfSuspendsOnCriticalPath('studio.components.provider', 'plain-provider', Layout)
    warnIfSuspendsOnCriticalPath('studio.components.layout', 'no-layout', undefined)

    expect(warn).not.toHaveBeenCalled()
  })
})
