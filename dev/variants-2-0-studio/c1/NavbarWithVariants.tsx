import {useCallback, useMemo} from 'react'
import {type NavbarProps} from 'sanity'

import {CompareHeader} from '../compare/CompareHeader'
import {useComparison} from '../compare/useCompare'
import {LocalePill} from '../localization/LocalePill'
import {STOCK_OPTION, useOption} from '../options/store'
import {AddressRow} from './AddressRow'
import {hasNavSection, isLockedNav} from './lockedNav'
import {NavLayoutStyles} from './NavLayout'
import {OpenBetaVariants} from './OpenBetaVariants'

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
  const inNavbar = navLayout === 'c'
  const renderInline = useCallback(() => <AddressRow inline />, [])
  const renderLocale = useCallback(() => <LocalePill />, [])
  const renderVariants = useCallback(() => <OpenBetaVariants />, [])
  // The localization switch C (field-level) and D (both): a locale pill after Variants, drawn from the language filter's state.
  const localization = useOption('localization')
  const localePill = localization === 'c' || localization === 'd'
  const actions = useMemo((): NavbarProps['__internal_actions'] => {
    const base = props.__internal_actions ?? []
    const locale = localePill
      ? [{location: 'topbar' as const, name: 'locale-pill', render: renderLocale}]
      : []
    // C1 B: the stock state control stays as it is, and ONE control is added: Variants. No row.
    // B: the stock state control stays as it is, and the Variants control is added beside it. D and E: the Variants control is inside the grey
    // section the state control draws (see useNavbarSection), so it is not a separate action.
    if (option === 'b')
      return [
        ...base,
        {location: 'topbar' as const, name: 'open-beta-variants', render: renderVariants},
        ...locale,
      ]
    if (hasNavSection(option)) return [...base, ...locale]
    // navLayout C: the whole global perspective inside the navbar (the row under it is removed).
    return inNavbar && option !== STOCK_OPTION && option !== 'c'
      ? [
          ...base,
          {location: 'topbar' as const, name: 'address-in-bar', render: renderInline},
          ...locale,
        ]
      : [...base, ...locale]
  }, [
    option,
    inNavbar,
    localePill,
    props.__internal_actions,
    renderInline,
    renderLocale,
    renderVariants,
  ])
  return (
    <>
      <NavLayoutStyles />
      {props.renderDefault({...props, __internal_actions: actions})}
      {/* Option C is the shipped Perspective Filter bar only: no address row. */}
      {option === STOCK_OPTION || option === 'c' || isLockedNav(option) || inNavbar ? null : (
        <AddressRow />
      )}
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
