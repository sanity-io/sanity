// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {WeightedHit} from '@sanity/base'
import {PreviewCard} from '@sanity/base/components'
import {useDocumentPresenceUsers} from '@sanity/base/hooks'
import {IntentLink} from '@sanity/base/router'
import {Box, ResponsivePaddingProps} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import React, {forwardRef, MouseEvent, useMemo} from 'react'
import type {VirtualItem} from 'react-virtual'
import styled, {css} from 'styled-components'
import {useCommandList} from '../../contexts/commandList'
import SearchResultItemPreview from './SearchResultItemPreview'

interface SearchItemProps extends ResponsivePaddingProps {
  data: WeightedHit
  index: number
  onClick?: () => void
  onMouseDown?: (event: MouseEvent) => void
  onMouseEnter?: () => void
  documentId: string
  virtualRow: VirtualItem
}

const SearchResultItemBox = styled(Box)<{$level: number}>(({$level}) => {
  return css`
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;

    [data-focused='true'][data-level='${$level}'] &,
    [data-hovered='true'][data-level='${$level}'] & {
      &[data-active='true'] a {
        // Allow nested cards to inherit the correct background color
        --card-bg-color: ${({theme}) => theme.sanity.color.button.bleed.default.hovered.bg};
        background: var(--card-bg-color);
        // Disable box-shadow to hide the halo effect when we have keyboard focus over a selected <Button>
        box-shadow: none;
      }
    }
  `
})

export function SearchResultItem({
  data,
  documentId,
  index,
  onClick,
  onMouseDown,
  onMouseEnter,
  virtualRow,
}: SearchItemProps) {
  const {hit, resultIndex} = data
  const type = schema.get(hit?._type)
  const documentPresence = useDocumentPresenceUsers(documentId)
  const {level} = useCommandList()

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            data-hit-index={resultIndex}
            intent="edit"
            params={{id: getPublishedId(hit._id), type: type.name}}
            ref={ref}
          />
        )
      }),
    [hit._id, resultIndex, type.name]
  )

  return (
    <SearchResultItemBox
      $level={level}
      data-index={index}
      flex={1}
      style={{
        // Kept inline to prevent styled-components from generating loads of classes on virtual list scroll
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      <PreviewCard
        as={LinkComponent}
        data-as="a"
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        marginTop={1}
        marginX={1}
        padding={2}
        radius={2}
        tabIndex={-1}
      >
        <SearchResultItemPreview
          data={data}
          documentId={hit._id}
          presence={documentPresence}
          schemaType={type}
        />
      </PreviewCard>
    </SearchResultItemBox>
  )
}
