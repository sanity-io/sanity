import {SearchIcon} from '@sanity/icons'
import React, {forwardRef} from 'react'
import {useTranslation} from 'react-i18next'
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
  const {t} = useTranslation()

  return (
    <Button
      aria-label={t('search.action-open-aria-label')}
      data-testid="studio-search"
      icon={SearchIcon}
      tooltipProps={{
        // @todo: localize
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
