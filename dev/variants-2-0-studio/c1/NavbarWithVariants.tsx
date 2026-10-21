import {useCallback, useMemo} from 'react'
import {type NavbarProps} from 'sanity'

import {CompareHeader} from '../compare/CompareHeader'
import {useComparison} from '../compare/useCompare'
import {STOCK_OPTION, useOption} from '../options/store'
import {AddressRow} from './AddressRow'
import {VariantsControl} from './Controls'
import {NavLayoutStyles} from './NavLayout'

/**
 * Studio's navbar plus C1:
 * - Option B adds the "Variants" control to the top right through the navbar's `__internal_actions` slot;
 * - Options A and B show the composed-address row under the navbar (option C keeps only the shipped bar), in the page flow (it pushes the Studio down).
 * Option A's pill is extended elsewhere, through the PROPOSED perspective menu extension.
 */
export function NavbarWithVariants(props: NavbarProps) {
  const option = useOption('c1')
  const compare = useOption('compare')
  const comparison = useComparison()
  const navLayout = useOption('navLayout')
  const inNavbar = navLayout === 'c' || navLayout === 'd'
  const renderVariants = useCallback(() => <VariantsControl />, [])
  const renderInline = useCallback(() => <AddressRow inline />, [])
  const actions = useMemo((): NavbarProps['__internal_actions'] => {
    const base = props.__internal_actions ?? []
    const withVariants =
      option === 'b'
        ? [...base, {location: 'topbar' as const, name: 'variants-topbar', render: renderVariants}]
        : base
    // navLayout C and D: the whole global perspective inside the navbar (the row under it is removed).
    return inNavbar && option !== STOCK_OPTION && option !== 'c'
      ? [
          ...withVariants,
          {location: 'topbar' as const, name: 'address-in-bar', render: renderInline},
        ]
      : withVariants
  }, [option, inNavbar, props.__internal_actions, renderVariants, renderInline])
  return (
    <>
      <NavLayoutStyles />
      {props.renderDefault({...props, __internal_actions: actions})}
      {/* Option C is the shipped Perspective Filter bar only: no address row. */}
      {option === STOCK_OPTION || option === 'c' || inNavbar ? null : <AddressRow />}
      {/* E9 compare C: one header across both panes. */}
      {compare !== 'a' && compare !== 'b' && comparison ? (
        <CompareHeader
          comparison={comparison}
          composed={compare === 'c' ? undefined : (compare as 'd' | 'e' | 'f')}
        />
      ) : null}
    </>
  )
}
