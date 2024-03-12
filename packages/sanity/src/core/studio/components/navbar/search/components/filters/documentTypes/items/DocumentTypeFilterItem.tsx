import {CheckmarkIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'
import {Box, type ResponsiveMarginProps, type ResponsivePaddingProps} from '@sanity/ui'
import {memo, useCallback} from 'react'

import {Button} from '../../../../../../../../../ui-components'
import {useSearchState} from '../../../../contexts/search/useSearchState'

interface DocumentTypeFilterItemProps extends ResponsiveMarginProps, ResponsivePaddingProps {
  selected: boolean
  type: SchemaType
}

export const DocumentTypeFilterItem = memo(function TypeFilterItem({
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
