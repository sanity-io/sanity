import {Flex} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {DEBUG_MODE} from '../../../constants'
import type {SearchFilter} from '../../../types'
import {DebugDocumentTypes} from '../debug/_DebugDocumentTypes'
import {DebugFilterValues} from '../debug/_DebugFilterValues'
import {FilterForm} from './FilterForm'

interface FilterPopoverContentProps {
  filter: SearchFilter
}

const ContainerFlex = styled(Flex)`
  max-width: 480px;
  min-width: 150px;
  overflow: hidden;
  width: 100%;
`

export function FilterPopoverContent({filter}: FilterPopoverContentProps) {
  return (
    <ContainerFlex direction="column">
      <FilterForm filter={filter} />

      {/* Debug panels */}
      {DEBUG_MODE && (
        <>
          <DebugFilterValues filter={filter} />
          <DebugDocumentTypes filter={filter} />
        </>
      )}
    </ContainerFlex>
  )
}
