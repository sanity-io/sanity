// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {PreviewCard} from '@sanity/base/components'
import {useDocumentPresence} from '@sanity/base/hooks'
import {IntentLink} from '@sanity/base/router'
import {Box, ResponsivePaddingProps} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import React, {forwardRef, MouseEvent, useCallback, useMemo, useRef} from 'react'
import type {VirtualItem} from 'react-virtual'
import styled from 'styled-components'
import type {SearchHit} from '../../types'
import SearchResultItemPreview from './SearchResultItemPreview'

interface SearchItemProps extends ResponsivePaddingProps {
  data: SearchHit
  index: number
  onClick?: () => void
  onMouseDown?: (event: MouseEvent) => void
  onMouseEnter?: () => void
  documentId: string
  virtualRow: VirtualItem
}

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
  const documentPresence = useDocumentPresence(documentId)
  const linkComponentRef = useRef<HTMLDivElement>(null)

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

  /**
   * Pass through wrapper click events to the nested child <PreviewCard> instead.
   *
   * Required as <CommandListProvider> will trigger click events on wrapper elements on ENTER key presses.
   *
   * In most cases, click events will be defined on the main wrapper component, however
   * <SearchResultItem> is unique in that the clickable area requires padding around it.
   */
  const handleWrapperClick = useCallback(() => {
    linkComponentRef?.current?.click()
  }, [])

  return (
    <SearchResultItemWrapper
      data-index={index}
      flex={1}
      onClick={handleWrapperClick}
      style={{
        // Kept inline to prevent styled-components from generating loads of classes on virtual list scroll
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      <Box paddingTop={1} paddingX={1}>
        <PreviewCard
          as={LinkComponent}
          data-as="a"
          onClick={onClick}
          onMouseDown={onMouseDown}
          onMouseEnter={onMouseEnter}
          padding={2}
          radius={2}
          ref={linkComponentRef}
          tabIndex={-1}
        >
          <SearchResultItemPreview
            documentId={hit._id}
            presence={documentPresence}
            schemaType={type}
          />
        </PreviewCard>
      </Box>
    </SearchResultItemWrapper>
  )
}

const SearchResultItemWrapper = styled(Box)`
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
`
