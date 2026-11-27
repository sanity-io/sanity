import {clsx} from 'clsx'
import {type HTMLAttributes, type ReactNode, type Ref, useRef, ViewTransition} from 'react'

import {useViewTransitionValue} from '../../components/viewTransition/useViewTransitionValue'
import {useViewTransitionStyles} from '../../components/viewTransition/viewTransitionStyles'
import {studioViewTransitionClass} from '../../viewTransitions/transitionTypes'
import {pillHost, root} from './AnimatedTextWidth.css'

/**
 * The transition type of a label change. The label, its container and the controls beside it only
 * animate in a transition of this type, so other transitions that touch them (data arriving, a menu
 * opening, a tone change) do not start a view transition on their account.
 */
const WIDTH_MORPH = 'sanity-width-morph'
const WIDTH_MORPH_TYPES = [WIDTH_MORPH]

const LABEL = studioViewTransitionClass({default: 'none', [WIDTH_MORPH]: 'sanity-vt-width'})
const PILL = studioViewTransitionClass({default: 'none', [WIDTH_MORPH]: 'sanity-vt-pill'})
const SIBLING_MOVE = studioViewTransitionClass({default: 'none', [WIDTH_MORPH]: 'sanity-vt-move'})
const SIBLING_FADE = studioViewTransitionClass({default: 'none', [WIDTH_MORPH]: 'sanity-vt-fade'})

/**
 * `value` as it is shown: a change reaches it in the next transition of the label-change type,
 * together with the new label of every `AnimatedTextWidth`. Anything that has to change with the
 * label, such as a control beside it, reads its value through this. `immediate` returns `value` as
 * it is, for a layout that does not animate.
 *
 * @internal
 */
export function useWidthMorphValue<T>(value: T, immediate = false): T {
  return useViewTransitionValue(value, WIDTH_MORPH_TYPES, immediate)
}

type AnimatedTextWidthProps = {
  children: ReactNode
  /** The string whose change drives the width morph. */
  text: string
  ref?: Ref<HTMLDivElement>
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

/**
 * Animates width changes when label text changes, e.g. when switching perspectives or variants.
 * Rendered inside an `AnimatedWidthPill`.
 *
 * The render that receives new text keeps the previous label. `useWidthMorphValue` then commits
 * the new label in a transition of its own type, and the view transition morphs the two snapshots.
 * The element's layout takes the new width once; the pixels in between are the snapshots, not a
 * width transition on every frame.
 *
 * Extra props land on the host div. A tooltip clones its child and attaches a ref plus pointer
 * handlers, and this wrapper is that child.
 *
 * @internal
 */
export function AnimatedTextWidth(props: AnimatedTextWidthProps) {
  const {children, text, ref, className, ...rest} = props
  const shownText = useWidthMorphValue(text)
  const shownChildren = useRef(children)
  // The label element is a new object every render. Holding it in state would retrigger forever.
  // The ref keeps the previous label until the shown text has caught up, which is the render the
  // view transition commits.
  // oxlint-disable-next-line react/refs -- see comment above
  if (shownText === text) shownChildren.current = children
  // oxlint-disable-next-line react/refs -- the frozen label, see above
  const label = shownChildren.current
  useViewTransitionStyles()

  return (
    <ViewTransition default={LABEL}>
      <div {...rest} className={clsx(root, className)} ref={ref}>
        {label}
      </div>
    </ViewTransition>
  )
}

/**
 * The bordered container around an `AnimatedTextWidth` label. Only the label is in that
 * snapshot, so on its own the container and the controls beside the label would jump to their
 * new place while the label morphs. This morphs the container's outline over the same span, and
 * every other control inside it goes in an `AnimatedWidthSibling`.
 *
 * The boundary sits in an element of its own. React starts a view transition, even one that
 * animates nothing, when a transition or a Suspense reveal inserts a `<ViewTransition>` with no
 * element above it in what it inserts, and the pill is often the first thing such a commit
 * inserts, like the lazily loaded variants filters.
 *
 * Its child must render a single element: the container.
 *
 * @internal
 */
export function AnimatedWidthPill({children}: {children: ReactNode}) {
  useViewTransitionStyles()
  return (
    <div className={pillHost}>
      <ViewTransition default={PILL}>{children}</ViewTransition>
    </div>
  )
}

/**
 * A control inside an `AnimatedWidthPill`, beside the animated label. It is captured on its own,
 * so the container's stretched outline does not distort it, and it slides with the label's edge
 * when it sits after the label. One that appears or goes with the label change (rendered from a
 * `useWidthMorphValue`) fades in or out over the same span.
 *
 * @internal
 */
export function AnimatedWidthSibling({children}: {children: ReactNode}) {
  return (
    <ViewTransition default={SIBLING_MOVE} enter={SIBLING_FADE} exit={SIBLING_FADE}>
      {children}
    </ViewTransition>
  )
}
