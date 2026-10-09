import {type ComponentType, Suspense} from 'react'
import {isLazy} from 'react-is'

import {isDev} from '../../environment'

const warned = new Set<string>()

const PLACEMENT = {
  'studio.components.layout':
    "It renders on the studio's critical path, under <StudioLayout>'s own Suspense boundary, so this only delays the first paint.",
  'studio.components.provider':
    "It renders on the studio's critical path, above <StudioLayout> and its Suspense boundary, so this suspends the whole studio to an ancestor fallback before the first paint.",
}

/**
 * `studio.components.layout` and `studio.components.provider` render in the studio's first
 * render pass, before any effect could preload them. A `lazy()` component there makes React wait
 * for its chunk before it can render anything, and a `Suspense` adds a second fallback to flip
 * between. Warns once per slot and plugin, in development only.
 *
 * `navbar`, `toolMenu` and `activeToolLayout` are not checked: a lazy component there is fine
 * when the plugin's provider preloads its chunk, and a bare `import()` preload leaves no trace
 * that could be read here.
 */
export function warnIfSuspendsOnCriticalPath(
  slot: keyof typeof PLACEMENT,
  pluginName: string,
  component: unknown,
): void {
  if (!isDev || !component || warned.has(`${slot}:${pluginName}`)) return
  const described = describe(component)
  if (!described) return
  warned.add(`${slot}:${pluginName}`)
  console.warn(
    `${slot} from "${pluginName}" is ${described.kind}. ${PLACEMENT[slot]} ${described.remedy}`,
  )
}

interface Described {
  kind: string
  remedy: string
}

const SUSPENSE: Described = {
  kind: 'a `Suspense`',
  remedy:
    'Remove the boundary: the studio owns the Suspense boundaries on this path, so render the middleware synchronously instead.',
}

const LAZY: Described = {
  kind: 'a `React.lazy` component',
  remedy: 'Import the component directly.',
}

function describe(component: unknown): Described | null {
  if (component === Suspense) return SUSPENSE
  if (typeof component !== 'object' && typeof component !== 'function') return null
  // react-is classifies elements, not component types
  const Component = component as ComponentType
  return isLazy(<Component />) ? LAZY : null
}
