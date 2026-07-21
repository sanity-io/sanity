import {Flex} from '@sanity/ui'
import {type ReactNode} from 'react'

/**
 * The top-right action rail of an entity detail page: optional secondary action(s), one prominent
 * primary action, then an overflow `⋯` menu. Placed top-right so the most primary action is where
 * the eye lands first (F-pattern), rather than hunted for in a bottom footer. A pure layout shell —
 * each page supplies its own actions, so the primary's weight can scale to its consequence (a loud,
 * confirm-gated "Run release" vs. a calm "Edit definition"), with lighter secondary actions (e.g.
 * an icon-only "Edit details") sitting beside it. Shared by the Releases and Variant-definition
 * detail pages so both read as one family.
 *
 * @internal
 */
export function DetailActionRail(props: {
  secondary?: ReactNode
  primary?: ReactNode
  menu?: ReactNode
}): React.JSX.Element | null {
  const {secondary, primary, menu} = props
  if (!secondary && !primary && !menu) return null
  return (
    <Flex flex="none" gap={2} align="center" data-ui="detail-action-rail">
      {secondary}
      {primary}
      {menu}
    </Flex>
  )
}
