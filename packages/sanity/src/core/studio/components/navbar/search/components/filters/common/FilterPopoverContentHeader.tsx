import {SearchIcon} from '@sanity/icons'
import {Box, Flex, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ChangeEvent, forwardRef} from 'react'

import {useTranslation} from '../../../../../../../i18n'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {CustomTextInput} from '../../common/CustomTextInput'
import {
  searchHeaderBox,
  searchHeaderContentFlex,
  borderColorVar,
} from './FilterPopoverContentHeader.css'

interface FilterPopoverContentHeaderProps {
  ariaInputLabel: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  typeFilter: string
}

export const FilterPopoverContentHeader = forwardRef<
  HTMLInputElement,
  FilterPopoverContentHeaderProps
>(function FilterPopoverContentHeader({ariaInputLabel, onChange, onClear, typeFilter}, ref) {
  const {color: themeColor} = useThemeV2()
  const {
    state: {fullscreen},
  } = useSearchState()
  const {t} = useTranslation()

  return (
    <Box
      className={searchHeaderBox}
      style={assignInlineVars({[borderColorVar]: themeColor.border})}
    >
      <Flex className={searchHeaderContentFlex} align="center" flex={1} padding={1}>
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
})
