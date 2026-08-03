import {type ReleaseDocument} from '@sanity/client'
import {type Decorator} from '@storybook/react-vite'
import {type PropsWithChildren, type ReactNode, useCallback, useState} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'
import {route, type Router, RouterProvider} from 'sanity/router'

import {type Tool} from '../../../packages/sanity/src/core/config'
import {type PerspectiveContextValue} from '../../../packages/sanity/src/core/perspective/types'
import {getReleaseIdFromReleaseDocumentId} from '../../../packages/sanity/src/core/releases/util/getReleaseIdFromReleaseDocumentId'
// `createRouter` is not on the `sanity/router` exports map — the studio's own root-router
// factory lives at this deep path, and only routers it builds carry tool-scoped state.
import {createRouter} from '../../../packages/sanity/src/core/studio/router/router'

/**
 * Harness for the global perspective control - the pill in the navbar that says which view of the
 * content you are looking at, and the menu that changes it.
 *
 * Two things it needs that are not obvious.
 *
 * 1. A REAL ROUTER WITH A `releases` TOOL. `ReleasesNav` renders a `ToolLink` whose state is
 *    `{tool: 'releases', releases: undefined}`, and tool-scoped state only resolves on a router
 *    built by `createRouter` with a scoped route for that tool NAME. A hand-written
 *    `route.create('/')` is not enough: the link throws. `Variants.stories.tsx` worked this out
 *    first; it is shared here rather than copied a third time.
 *
 * 2. A PERSPECTIVE VALUE PER STORY. `WithStudioProviders` seeds one `PerspectiveContext` for the
 *    whole file, pinned to `drafts`. The perspective control's entire job is to render differently
 *    per selected perspective, so each story needs its own. {@link WithPerspective} supplies it -
 *    and must be listed FIRST in `decorators`, because Storybook treats the first entry as the
 *    innermost wrapper, and only the innermost provider wins.
 */

/**
 * The studio root router, with a `releases` tool registered so `ReleasesToolLink` can encode its
 * state. The tool's component is never rendered - only its name and router are read.
 */
export const perspectiveNavbarRouter = createRouter({
  tools: [
    {
      name: 'releases',
      title: 'Releases',
      component: () => null,
      router: route.create('/'),
    } as unknown as Tool,
  ],
})

/** A stateful router, so links in these stories genuinely navigate instead of throwing. */
export function PerspectiveStoryRouter({
  children,
  router = perspectiveNavbarRouter,
}: PropsWithChildren<{router?: Router}>) {
  const [state, setState] = useState<Record<string, unknown>>({})
  const onNavigate = useCallback(
    (opts: {path: string}) => setState(router.decode(opts.path) ?? {}),
    [router],
  )
  return (
    <RouterProvider router={router} state={state} onNavigate={onNavigate}>
      {children}
    </RouterProvider>
  )
}

const BASE: PerspectiveContextValue = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts',
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
  selectedVariantName: undefined,
  selectedVariant: undefined,
  bundle: 'drafts',
}

/**
 * Seed the perspective the studio is currently viewing content through.
 *
 * Pass `'drafts'`, `'published'`, or a `ReleaseDocument`. The derived fields
 * (`selectedPerspectiveName`, `selectedReleaseId`, `perspectiveStack`) are computed here the way
 * `PerspectiveProvider` computes them, so a story cannot end up in a state the real provider
 * would never produce - a release selected with an empty stack, say, which renders a pill naming
 * a release while every document below it still shows drafts.
 */
export function WithPerspective(
  selected: 'drafts' | 'published' | ReleaseDocument,
  overrides: Partial<PerspectiveContextValue> = {},
): Decorator {
  const value: PerspectiveContextValue =
    typeof selected === 'string'
      ? {
          ...BASE,
          selectedPerspective: selected,
          selectedPerspectiveName: selected === 'published' ? 'published' : undefined,
          perspectiveStack: selected === 'published' ? [] : ['drafts'],
          bundle: selected,
          ...overrides,
        }
      : {
          ...BASE,
          selectedPerspective: selected,
          selectedPerspectiveName: getReleaseIdFromReleaseDocumentId(selected._id),
          selectedReleaseId: getReleaseIdFromReleaseDocumentId(selected._id),
          perspectiveStack: [getReleaseIdFromReleaseDocumentId(selected._id), 'drafts'],
          bundle: getReleaseIdFromReleaseDocumentId(selected._id),
          ...overrides,
        }

  return (Story) => (
    <PerspectiveContext.Provider value={value}>
      <Story />
    </PerspectiveContext.Provider>
  )
}

/**
 * A navbar-shaped stage.
 *
 * The perspective control is a pill designed to sit in a horizontal bar with dark chrome around
 * it and room below for its menu to open into. Rendered bare on a story canvas it reads as a
 * floating fragment, and - more practically - a menu anchored to an element at the very top of a
 * short canvas has nowhere to go.
 */
export function PerspectiveBarFrame({
  children,
  minHeight = 320,
}: {
  children: ReactNode
  minHeight?: number
}) {
  return (
    <div style={{minHeight}}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 6,
          background: 'var(--card-muted-bg-color)',
          border: '1px solid var(--card-border-color)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
