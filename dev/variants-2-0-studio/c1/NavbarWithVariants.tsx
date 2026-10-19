import {useCallback, useMemo} from 'react'
import {type NavbarProps} from 'sanity'

import {STOCK_OPTION, useOption} from '../options/store'
import {AddressRow} from './AddressRow'
import {VariantsControl} from './Controls'

/**
 * Studio's navbar plus C1:
 * - Option B adds the "Variants" control to the top right through the navbar's `__internal_actions` slot;
 * - Options A and B show the composed-address row under the navbar, in the page flow (it pushes the Studio down).
 * Option A's pill is extended elsewhere, through the PROPOSED perspective menu extension.
 */
export function NavbarWithVariants(props: NavbarProps) {
  const option = useOption('c1')
  const renderVariants = useCallback(() => <VariantsControl />, [])
  const actions = useMemo(
    (): NavbarProps['__internal_actions'] =>
      option === 'b'
        ? [...(props.__internal_actions ?? []), {location: 'topbar', name: 'variants-topbar', render: renderVariants}]
        : props.__internal_actions,
    [option, props.__internal_actions, renderVariants],
  )
  return (
    <>
      {props.renderDefault({...props, __internal_actions: actions})}
      {option === STOCK_OPTION ? null : <AddressRow />}
    </>
  )
}
