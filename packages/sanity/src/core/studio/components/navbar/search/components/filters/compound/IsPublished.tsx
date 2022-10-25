import {Box, Select, Stack} from '@sanity/ui'
import React, {ChangeEvent, useCallback} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {CompoundContentProps} from './types'

export function CompoundContentIsPublished({filter}: CompoundContentProps) {
  const {dispatch} = useSearchState()

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.currentTarget.value === 'true'
      dispatch({id: filter.id, type: 'TERMS_FILTERS_COMPOUND_SET', value})
    },
    [dispatch, filter.id]
  )

  return (
    <Box padding={2}>
      <Stack space={2}>
        {/* Value */}
        <Select fontSize={1} onChange={handleChange} value={(filter?.value ?? true).toString()}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </Select>
      </Stack>
    </Box>
  )
}
