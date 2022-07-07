import {ClockIcon} from '@sanity/icons'
import {Box, Button, MenuItem} from '@sanity/ui'
import React, {useCallback} from 'react'
import {RecentSearch} from './local-storage/search-store'
import {TypeNames} from './TypeNames'

export interface RecentSearchesProps {
  value: RecentSearch
  onClick: (value: RecentSearch) => void
}

export function RecentSearchItem(props: RecentSearchesProps) {
  const {value, onClick} = props
  const handleRecentSearchClick = useCallback(() => {
    onClick(value)
  }, [value, onClick])

  return (
    <MenuItem onClick={handleRecentSearchClick}>
      <Button
        as={'a'}
        style={{width: '100%'}}
        justify={'flex-start'}
        mode="bleed"
        icon={ClockIcon}
        text={
          <Box wrap="wrap" style={{whiteSpace: 'normal'}}>
            <strong>"{value.query}"</strong> in <TypeNames types={value.types} />
          </Box>
        }
      />
    </MenuItem>
  )
}
