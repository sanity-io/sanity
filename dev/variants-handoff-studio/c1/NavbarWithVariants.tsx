import {useCallback, useMemo} from 'react'
import {type NavbarProps} from 'sanity'

import {NavLayoutStyles} from './NavLayout'
import {OpenBetaVariants} from './OpenBetaVariants'

/**
 * Studio's navbar plus the open beta Variants control (C1 option B): the stock state control stays as it ships, and ONE control is added beside
 * it, through the navbar's `__internal_actions` slot, before the state control. There is no perspective bar under the navbar.
 */
export function NavbarWithVariants(props: NavbarProps) {
  const renderVariants = useCallback(() => <OpenBetaVariants />, [])
  const actions = useMemo(
    (): NavbarProps['__internal_actions'] => [
      ...(props.__internal_actions ?? []),
      // Before the version chip, as the document pills put Variants first: both rows read "who, then where" (Faheem, 22 Oct).
      {
        location: 'topbar-before-perspective' as const,
        name: 'open-beta-variants',
        render: renderVariants,
      },
    ],
    [props.__internal_actions, renderVariants],
  )
  return (
    <>
      <NavLayoutStyles />
      {props.renderDefault({...props, __internal_actions: actions})}
    </>
  )
}
