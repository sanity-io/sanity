import {SearchIcon} from '@sanity/icons'
import React, {forwardRef} from 'react'
import {Button} from '../../../../../ui'
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
    <Button
      aria-label="Open search"
      data-testid="studio-search"
      icon={SearchIcon}
      tooltipProps={{
        content: 'Search',
        hotkeys: [GLOBAL_SEARCH_KEY_MODIFIER, GLOBAL_SEARCH_KEY.toUpperCase()],
        portal: true,
      }}
      onClick={onClick}
      mode="bleed"
      ref={ref}
    />
  )
})
