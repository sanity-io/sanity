import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {type SchemaType} from '@sanity/types'
import {memo, useCallback} from 'react'
import {Box, type MarginProps, type PaddingProps} from 'ui5'

import {Button} from '../../../../../../../../../ui-components/button/Button'
import {useSearchState} from '../../../../contexts/search/useSearchState'

interface DocumentTypeFilterItemProps extends MarginProps, PaddingProps {
  selected: boolean
  type: SchemaType
}

export const DocumentTypeFilterItem = memo(function TypeFilterItem({
  selected,
  type,
  ...rest
}: DocumentTypeFilterItemProps) {
  const {searchActorRef} = useSearchState()

  const handleTypeAdd = useCallback(() => {
    searchActorRef.send({type: 'TERMS_TYPE_ADD', schemaType: type})
  }, [searchActorRef, type])

  const handleTypeRemove = useCallback(() => {
    searchActorRef.send({type: 'TERMS_TYPE_REMOVE', schemaType: type})
  }, [searchActorRef, type])

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
        key={type.title ?? type.name}
        iconRight={selected && CheckmarkIcon}
        justify="flex-start"
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
