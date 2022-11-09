import {Box, ResponsivePaddingProps} from '@sanity/ui'
import React, {forwardRef, MouseEvent, useMemo} from 'react'
import type {VirtualItem} from '@tanstack/react-virtual'
import styled, {css} from 'styled-components'
import {PreviewCard} from '../../../../../../components/PreviewCard'
import {FIXME} from '../../../../../../FIXME'
import {useSchema} from '../../../../../../hooks'
import type {WeightedHit} from '../../../../../../search'
import {useDocumentPresence, useDocumentPreviewStore} from '../../../../../../store'
import {getPublishedId} from '../../../../../../util/draftUtils'
import {useCommandList} from '../../contexts/commandList'
import {DebugOverlay} from './DebugOverlay'
import SearchResultItemPreview from './SearchResultItemPreview'
import {IntentLink} from 'sanity/router'

interface SearchItemProps extends ResponsivePaddingProps {
  data: WeightedHit
  debug?: boolean
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
  debug,
  documentId,
  index,
  onClick,
  onMouseDown,
  onMouseEnter,
  virtualRow,
}: SearchItemProps) {
  const {hit, resultIndex} = data
  const schema = useSchema()
  const type = schema.get(hit?._type)
  const documentPresence = useDocumentPresence(documentId)
  const documentPreviewStore = useDocumentPreviewStore()
  const {level} = useCommandList()

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        if (!type?.name) return null
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
    [hit._id, resultIndex, type?.name]
  )

  if (!type) return null

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
        as={LinkComponent as FIXME}
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
          documentId={hit._id}
          documentPreviewStore={documentPreviewStore}
          presence={documentPresence}
          schemaType={type}
        />
      </PreviewCard>
      {debug && <DebugOverlay data={data} />}
    </SearchResultItemBox>
  )
}
