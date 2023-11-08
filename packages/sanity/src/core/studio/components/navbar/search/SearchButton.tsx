import {SearchIcon} from '@sanity/icons'
import React, {forwardRef} from 'react'
import {Button, Tooltip} from '../../../../../ui'
import {GLOBAL_SEARCH_KEY, GLOBAL_SEARCH_KEY_MODIFIER} from './constants'

interface SearchButtonProps {
  onClick: () => void
}

/**
 * @internal
 */
export const SearchButton = forwardRef(function SearchButton(
  {onClick}: SearchButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  return (
    <Tooltip
      content="Search"
      hotkeys={[GLOBAL_SEARCH_KEY_MODIFIER, GLOBAL_SEARCH_KEY.toUpperCase()]}
      portal
    >
      <Button
        aria-label="Open search"
        data-testid="studio-search"
        icon={SearchIcon}
        onClick={onClick}
        mode="bleed"
        ref={ref}
      />
    </Tooltip>
  )
})
