import {type ReactNode} from 'react'

import {PlaceholderSlot} from '../slots/PlaceholderSlot'

import {useOption} from './store'

interface OptionSlotProps {
  /** Registry id, e.g. 'c3'. */
  component: string
  /** One renderer per option id. A missing entry shows a "not built yet" placeholder. */
  options: Record<string, ReactNode>
}

// Every design surface mounts through a slot, so the toolbar and the control panel decide which
// option renders without the surface knowing about them.
export function OptionSlot({component, options}: OptionSlotProps) {
  const active = useOption(component)
  const content = options[active]

  if (content !== undefined) return <>{content}</>

  return <PlaceholderSlot component={component} />
}
