import {Activity, type ReactNode, useState} from 'react'

/** @internal */
export interface LazyActivityProps {
  children: ReactNode
  /** Whether the children should currently be visible */
  visible: boolean
}

/**
 * Renders `children` inside an {@link Activity} boundary that is kept mounted once shown.
 *
 * Nothing renders until the first time `visible` is `true`, so initially hidden content costs
 * the same as conditional rendering (`{visible && children}`). After that, toggling `visible`
 * switches the Activity between `'visible'` and `'hidden'` instead of unmounting: DOM and
 * component state survive, while effects are unmounted and updates are deferred until shown
 * again.
 *
 * Use this over a bare `<Activity>` when the content is often hidden on first render (e.g.
 * collapsed-by-default sections) and pre-rendering it hidden would be wasted work.
 *
 * @internal
 */
export function LazyActivity(props: LazyActivityProps): React.JSX.Element | null {
  const {children, visible} = props
  const [hasShown, setHasShown] = useState(visible)

  // Latch `hasShown` during render the first time the content becomes visible, per
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (visible && !hasShown) {
    setHasShown(true)
  }

  if (!visible && !hasShown) {
    return null
  }

  return <Activity mode={visible ? 'visible' : 'hidden'}>{children}</Activity>
}
