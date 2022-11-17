import {Box, Label, MenuDivider, Stack} from '@sanity/ui'
import React, {Dispatch, SetStateAction} from 'react'
import styled from 'styled-components'
import type {SearchableType} from '../../../../../../../search'
import {PointerOverlay} from '../common/PointerOverlay'
import {TypeFilterItem} from './TypeFilterItem'

interface DocumentTypesVirtualListProps {
  itemsSelected: SearchableType[]
  itemsUnselected: SearchableType[]
  selectedTypes: SearchableType[]
  setChildContainerRef: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayRef: Dispatch<SetStateAction<HTMLDivElement | null>>
}

const TypeFiltersContentDiv = styled.div`
  position: relative;
`

export function DocumentTypesVirtualList({
  itemsSelected,
  itemsUnselected,
  selectedTypes,
  setChildContainerRef,
  setPointerOverlayRef,
}: DocumentTypesVirtualListProps) {
  return (
    <TypeFiltersContentDiv>
      <PointerOverlay ref={setPointerOverlayRef} />

      {/* Selectable document types */}
      <Stack ref={setChildContainerRef} space={1}>
        {/* Selected */}
        {itemsSelected.length > 0 && (
          <>
            <Box padding={3}>
              <Label muted size={0}>
                Selected
              </Label>
            </Box>
            {itemsSelected.map((type, index) => (
              <TypeFilterItem
                index={index}
                key={type.name}
                selected={selectedTypes.includes(type)}
                type={type}
              />
            ))}
          </>
        )}
        {/* Divider */}
        {itemsSelected.length > 0 && itemsUnselected.length > 0 && <MenuDivider />}
        {/* Unselected */}
        {itemsUnselected.map((type, index) => (
          <TypeFilterItem
            index={index}
            key={type.name}
            selected={selectedTypes.includes(type)}
            type={type}
          />
        ))}
      </Stack>
    </TypeFiltersContentDiv>
  )
}
