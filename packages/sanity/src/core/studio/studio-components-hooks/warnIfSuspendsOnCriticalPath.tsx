import {type ComponentType, Suspense} from 'react'
import {isLazy} from 'react-is'

import {isDev} from '../../environment'

const warned = new Set<string>()

/**
 * `studio.components.layout` and `studio.components.provider` render before the studio's first
 * paint, under `StudioLayout`'s own Suspense boundary. A `lazy()` component there makes React
 * wait for its chunk before it can render anything, and a `Suspense` adds a second fallback to
 * flip between. Warns once per slot and plugin, in development only.
 */
export function warnIfSuspendsOnCriticalPath(
  slot: 'studio.components.layout' | 'studio.components.provider',
  pluginName: string,
  component: unknown,
): void {
  if (!isDev || !component || warned.has(`${slot}:${pluginName}`)) return
  const kind = describe(component)
  if (!kind) return
  warned.add(`${slot}:${pluginName}`)
  console.warn(
    `${slot} from "${pluginName}" is ${kind}. It renders on the studio's critical path, under <StudioLayout>'s own Suspense boundary, so this only delays the first paint. Import the component directly.`,
  )
}

function describe(component: unknown): string | null {
  if (component === Suspense) return 'a `Suspense`'
  if (typeof component !== 'object' && typeof component !== 'function') return null
  // react-is classifies elements, not component types
  const Component = component as ComponentType
  return isLazy(<Component />) ? 'a `React.lazy` component' : null
}
