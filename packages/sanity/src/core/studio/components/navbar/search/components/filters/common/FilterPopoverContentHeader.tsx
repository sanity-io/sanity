import {SearchIcon} from '@sanity/icons/Search'
import {type ChangeEvent, type RefAttributes} from 'react'
import {Flex, Box} from 'ui5'

import {useTranslation} from '../../../../../../../i18n/hooks/useTranslation'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {CustomTextInput} from '../../common/CustomTextInput'
import {searchHeaderBox, searchHeaderContentFlex} from './FilterPopoverContentHeader.css'

interface FilterPopoverContentHeaderProps {
  ariaInputLabel: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  typeFilter: string
}

export function FilterPopoverContentHeader({
  ref,
  ariaInputLabel,
  onChange,
  onClear,
  typeFilter,
}: FilterPopoverContentHeaderProps & RefAttributes<HTMLInputElement>) {
  const {
    state: {fullscreen},
  } = useSearchState()
  const {t} = useTranslation()

  return (
    <Box className={searchHeaderBox}>
      <Flex
        alignItems="center"
        className={searchHeaderContentFlex}
        flexBasis="0%"
        flexGrow={1}
        padding={1}
      >
        <CustomTextInput
          __unstable_disableFocusRing
          $smallClearButton
          aria-label={ariaInputLabel}
          autoComplete="off"
          border={false}
          clearButton={!!typeFilter}
          fontSize={fullscreen ? 2 : 1}
          icon={SearchIcon}
          muted
          onChange={onChange}
          onClear={onClear}
          placeholder={t('search.filter-placeholder')}
          ref={ref}
          spellCheck={false}
          radius={2}
          value={typeFilter}
        />
      </Flex>
    </Box>
  )
}
