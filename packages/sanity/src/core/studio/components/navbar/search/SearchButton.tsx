import {SearchIcon} from '@sanity/icons'
import {type ForwardedRef, forwardRef} from 'react'

import {Button} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {GLOBAL_SEARCH_KEY, GLOBAL_SEARCH_KEY_MODIFIER} from './constants'

interface SearchButtonProps {
  onClick: () => void
}

/**
 * @internal
 */
export const SearchButton = forwardRef(function SearchButton(
  {onClick}: SearchButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
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
