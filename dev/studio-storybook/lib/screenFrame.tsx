import {type ReactNode} from 'react'

/**
 * A sized stage for the studio's full-screen states.
 *
 * Two problems it solves, both of which produce a story that looks broken for reasons that have
 * nothing to do with the component.
 *
 * 1. **`height="fill"` needs something to fill.** Every screen in `core/studio/screens` is a
 *    `<Card height="fill">` that centres its content vertically. In a real studio the parent is
 *    the viewport. In a story canvas the parent is an auto-height div, so `height: 100%` resolves
 *    against nothing, the card collapses to its content, and the centring - which is most of the
 *    design - simply does not happen.
 *
 * 2. **Docs pages must stay navigable.** A docs page renders every story of a component into one
 *    document. Give each one a real viewport height and a five-story page is five screens tall
 *    before you reach the second paragraph. The docs-health gate caps a story frame at 700px for
 *    exactly this reason, so these stages are deliberately shorter than a viewport while staying
 *    tall enough that vertical centring is visible.
 */
export function ScreenFrame({
  children,
  height = 520,
}: {
  children: ReactNode
  /** Stage height in px. Keep under the docs gate's 700px frame cap. */
  height?: number
}) {
  return (
    <div
      style={{
        height,
        // The screens are the only thing on the page in a real studio, so give them a hard
        // boundary here rather than letting them bleed into the storybook chrome.
        border: '1px solid var(--card-border-color)',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {children}
    </div>
  )
}
