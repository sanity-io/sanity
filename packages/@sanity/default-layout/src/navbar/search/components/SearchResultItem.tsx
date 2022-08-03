// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {PreviewCard} from '@sanity/base/components'
import {useDocumentPresence} from '@sanity/base/hooks'
import {DocumentPreviewPresence} from '@sanity/base/presence'
import {IntentLink} from '@sanity/base/router'
import {Inline, Label, ResponsivePaddingProps, Theme} from '@sanity/ui'
import Preview from 'part:@sanity/base/preview?'
import schema from 'part:@sanity/base/schema'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import React, {forwardRef, useMemo} from 'react'
import styled, {css} from 'styled-components'
import type {SearchHit} from '../types'
import {withCommandPaletteItemStyles} from '../utils/applyCommandPaletteItemStyles'

interface SearchItemProps extends ResponsivePaddingProps {
  data: SearchHit
  onClick?: () => void
  documentId: string
}

const CommandPaletteIntentLink = withCommandPaletteItemStyles(IntentLink)

export function SearchResultItem(props: SearchItemProps) {
  const {data, documentId, onClick, ...restProps} = props
  const {hit, resultIndex} = data
  const type = schema.get(hit?._type)
  const documentPresence = useDocumentPresence(documentId)

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        return (
          <CommandPaletteIntentLink
            {...linkProps}
            intent="edit"
            params={{id: getPublishedId(hit._id), type: type.name}}
            data-hit-index={resultIndex}
            ref={ref}
          />
        )
      }),
    [hit._id, resultIndex, type.name]
  )

  return (
    <PreviewCard
      __unstable_focusRing
      data-as="a"
      as={LinkComponent}
      onClick={onClick}
      {...restProps}
      radius={2}
    >
      <Preview
        value={hit}
        layout="default"
        type={type}
        status={
          <Inline space={3}>
            {documentPresence && documentPresence.length > 0 && (
              <DocumentPreviewPresence presence={documentPresence} />
            )}
            <Label size={0} muted style={{maxWidth: '150px'}} textOverflow="ellipsis">
              {type.title}
            </Label>
          </Inline>
        }
      />
    </PreviewCard>
  )
}

const CustomIntentLink = styled(IntentLink)(({theme}: {theme: Theme}) => {
  const {color} = theme.sanity
  // TODO: use idiomatic sanity/ui styling, double check usage of `bg2`
  return css`
    &[aria-selected='true'] {
      background: ${color.button.bleed.default.hovered.bg2};
    }
  `
})
