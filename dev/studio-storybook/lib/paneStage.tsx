import {type ReactNode} from 'react'

import {PaneLayout} from '../../../packages/sanity/src/structure/components/pane/PaneLayout'

/**
 * A single pane, mounted without the structure resolver.
 *
 * The full `StructureHarness` builds a router, a `StructureToolProvider` and a pane resolver, then
 * lets the structure builder decide which panes exist. That is exactly right for storying the
 * document pane or a list pane, and complete overkill for the four panes that are pure states:
 * error, loading, unknown-type. Those take props and render; nothing about them depends on the
 * structure they would have been resolved from.
 *
 * What they DO depend on is `PaneLayout`. Every `Pane` calls `usePaneLayout()`, which throws
 * outright when the context is missing - so a pane cannot be mounted bare, even though it has no
 * other requirement. `Pane` then supplies the `usePane()` context its own header and content read,
 * so one `PaneLayout` is the whole ceremony.
 *
 * The flex row and fixed height matter: `PaneLayout` measures itself to decide whether panes should
 * collapse, and in an auto-height container it measures zero and the pane renders collapsed.
 */
export function PaneStage({
  children,
  height = 420,
  width,
}: {
  children: ReactNode
  height?: number
  /** Constrain the layout width, e.g. to see how a pane behaves in a narrow column. */
  width?: number
}) {
  return (
    <div style={{height, display: 'flex', maxWidth: width}}>
      <PaneLayout height="fill" style={{minWidth: 320, flex: 1}}>
        {children}
      </PaneLayout>
    </div>
  )
}
