import {SearchIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import React, {forwardRef} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {CustomTextInput} from '../../common/CustomTextInput'

interface FilterPopoverContentHeaderProps {
  ariaInputLabel: string
  onChange: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onClear: () => void
  typeFilter: string
}

const SearchHeaderBox = styled(Box)`
  border-bottom: 1px solid ${({theme}) => theme.sanity.color.base.border};
  flex-shrink: 0;
`

const SearchHeaderContentFlex = styled(Flex)`
  box-sizing: border-box;
`

export const FilterPopoverContentHeader = forwardRef<
  HTMLInputElement,
  FilterPopoverContentHeaderProps
>(function FilterPopoverContentHeader({ariaInputLabel, onChange, onClear, typeFilter}, ref) {
  const {
    state: {fullscreen},
  } = useSearchState()

  return (
    <SearchHeaderBox>
      <SearchHeaderContentFlex align="center" flex={1} padding={1}>
        <CustomTextInput
          __unstable_disableFocusRing
          aria-label={ariaInputLabel}
          autoComplete="off"
          border={false}
          clearButton={!!typeFilter}
          fontSize={fullscreen ? 2 : 1}
          icon={SearchIcon}
          muted
          onChange={onChange}
          onClear={onClear}
          placeholder="Filter"
          ref={ref}
          smallClearButton
          spellCheck={false}
          radius={2}
          value={typeFilter}
        />
      </SearchHeaderContentFlex>
    </SearchHeaderBox>
  )
})
