import {SearchIcon} from '@sanity/icons'
import React, {forwardRef} from 'react'
import {useTranslation} from 'react-i18next'
import {Button} from '../../../../ui-components'
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
        content: t('search.button.tooltip'),
        hotkeys: [GLOBAL_SEARCH_KEY_MODIFIER, GLOBAL_SEARCH_KEY.toUpperCase()],
        portal: true,
      }}
      onClick={onClick}
      mode="bleed"
      ref={ref}
    />
  )
})
