import {Box, Stack} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {CompoundContentProps} from './types'
import {DebugMiniReferenceInput} from './DebugMiniReferenceInput'

export function CompoundContentHasReferences({filter}: CompoundContentProps) {
  const {dispatch} = useSearchState()

  const handleSelect = useCallback(
    (documentId: string) => {
      dispatch({id: filter.id, type: 'TERMS_FILTERS_COMPOUND_SET', value: documentId})
    },
    [dispatch, filter.id]
  )

  return (
    <Box padding={2} style={{width: '400px'}}>
      <Stack space={2}>
        <DebugMiniReferenceInput onSelect={handleSelect} />
      </Stack>
    </Box>
  )
}
