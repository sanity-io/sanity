import {useEffect, useEffectEvent, useState} from 'react'

import {useOnValueChange} from '../../hooks/useOnValueChange'
import {SIDEBAR_TRANSITION, startLayoutTransition} from '../panelTransitions'

/**
 * The sidebar's state as it shows: the machine's state is read through an external store, which
 * React always renders at once, so beside the tabs area a change shows a transition later, which
 * the rail, the drawer, the tool in it and the tabs area animate together. On phones the rail and
 * the drawer float over the tool and move nothing, so they follow at once.
 */
export function useShownInSidebar<T>(value: T, immediate: boolean): T {
  const [shown, setShown] = useState(value)
  useOnValueChange(value, (next) => {
    if (immediate) setShown(next)
    else startLayoutTransition(SIDEBAR_TRANSITION, () => setShown(next))
  })
  // A change made while the tool was hidden in an `<Activity>` is not reported above, so showing
  // the tool again catches up at once: there is nothing on screen to animate from
  const catchUp = useEffectEvent(() => setShown(value))
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- a change the hidden tool missed can only be noticed once its effects run again
    catchUp()
  }, [])
  return immediate ? value : shown
}
