import {Flex} from '@sanity/ui'
import {type ReactNode} from 'react'

/**
 * The top-right action rail of an entity detail page: one prominent primary action followed by an
 * overflow `⋯` menu. Placed top-right so the most primary action is where the eye lands first
 * (F-pattern), rather than hunted for in a bottom footer. A pure layout shell — each page supplies
 * its own primary and menu, so the primary's weight can scale to its consequence (a loud, confirm-
 * gated "Run release" vs. a calm "Edit definition"). Shared by the Releases and Variant-definition
 * detail pages so both read as one family.
 *
 * @internal
 */
export function DetailActionRail(props: {
  primary?: ReactNode
  menu?: ReactNode
}): React.JSX.Element | null {
  const {primary, menu} = props
  if (!primary && !menu) return null
  return (
    <Flex flex="none" gap={2} align="center" data-ui="detail-action-rail">
      {primary}
      {menu}
    </Flex>
  )
}
