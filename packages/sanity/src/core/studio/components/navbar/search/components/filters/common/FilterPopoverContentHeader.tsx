import {SearchIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {useCommandList} from '../../commandList/useCommandList'
import {CustomTextInput} from '../../common/CustomTextInput'

interface FilterPopoverContentHeaderProps {
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

export function FilterPopoverContentHeader({
  onChange,
  onClear,
  typeFilter,
}: FilterPopoverContentHeaderProps) {
  const {
    state: {fullscreen},
  } = useSearchState()

  const {setHeaderInputElement} = useCommandList()

  return (
    <SearchHeaderBox>
      <SearchHeaderContentFlex align="center" flex={1} padding={1}>
        <CustomTextInput
          autoComplete="off"
          border={false}
          clearButton={!!typeFilter}
          fontSize={fullscreen ? 2 : 1}
          icon={SearchIcon}
          muted
          onChange={onChange}
          onClear={onClear}
          placeholder="Filter"
          ref={setHeaderInputElement}
          smallClearButton
          spellCheck={false}
          radius={2}
          value={typeFilter}
        />
      </SearchHeaderContentFlex>
    </SearchHeaderBox>
  )
}
