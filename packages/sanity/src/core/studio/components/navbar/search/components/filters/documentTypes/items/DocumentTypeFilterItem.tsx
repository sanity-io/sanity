import {CheckmarkIcon} from '@sanity/icons'
import {Box, ResponsiveMarginProps, ResponsivePaddingProps} from '@sanity/ui'
import React, {useCallback} from 'react'
import type {SearchableType} from '../../../../../../../../search'
import {useSearchState} from '../../../../contexts/search/useSearchState'
import {Button} from '../../../../../../../../../ui-components'

interface DocumentTypeFilterItemProps extends ResponsiveMarginProps, ResponsivePaddingProps {
  selected: boolean
  type: SearchableType
}

export const DocumentTypeFilterItem = React.memo(function TypeFilterItem({
  selected,
  type,
  ...rest
}: DocumentTypeFilterItemProps) {
  const {dispatch} = useSearchState()

  const handleTypeAdd = useCallback(() => {
    dispatch({type: 'TERMS_TYPE_ADD', schemaType: type})
  }, [dispatch, type])

  const handleTypeRemove = useCallback(() => {
    dispatch({type: 'TERMS_TYPE_REMOVE', schemaType: type})
  }, [dispatch, type])

  const handleClick = useCallback(() => {
    if (selected) {
      handleTypeRemove()
    } else {
      handleTypeAdd()
    }
  }, [handleTypeAdd, handleTypeRemove, selected])

  return (
    <Box {...rest}>
      <Button
        iconRight={selected && CheckmarkIcon}
        justify="flex-start"
        key={type.title ?? type.name}
        mode="bleed"
        onClick={handleClick}
        width="fill"
        size="large"
        tabIndex={-1}
        text={type.title ?? type.name}
        tone={selected ? 'primary' : 'default'}
      />
    </Box>
  )
})
