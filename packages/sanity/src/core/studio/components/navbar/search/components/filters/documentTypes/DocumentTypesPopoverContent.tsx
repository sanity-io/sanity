import {Flex} from '@sanity/ui'
import React from 'react'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {DocumentTypesList} from './DocumentTypesList'

interface DocumentTypesPopoverContentProps {
  onClose: () => void
}

export function DocumentTypesPopoverContent({onClose}: DocumentTypesPopoverContentProps) {
  return (
    <FilterPopoverWrapper onClose={onClose}>
      <Flex
        style={{
          maxHeight: '600px',
          maxWidth: '350px',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <DocumentTypesList />
      </Flex>
    </FilterPopoverWrapper>
  )
}
