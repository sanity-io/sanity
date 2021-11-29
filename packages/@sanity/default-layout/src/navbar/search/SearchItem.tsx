// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {forwardRef, useMemo} from 'react'
import type {ResponsivePaddingProps} from '@sanity/ui'
import {Card, Label} from '@sanity/ui'
import {IntentLink} from '@sanity/base/router'
import Preview from 'part:@sanity/base/preview?'
import schema from 'part:@sanity/base/schema'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import type {SearchHit} from '.'

interface SearchItemProps extends ResponsivePaddingProps {
  data: SearchHit
  onClick?: () => void
}

export function SearchItem({data, onClick, ...restProps}: SearchItemProps) {
  const {hit, resultIndex} = data
  const type = schema.get(hit?._type)

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{id: getPublishedId(hit._id), type: type.name}}
            data-hit-index={resultIndex}
            tabIndex={-1}
            ref={ref}
          />
        )
      }),
    [hit._id, resultIndex, type.name]
  )

  return (
    <Card data-as="a" as={LinkComponent} onClick={onClick} {...restProps} radius={2}>
      <Preview
        value={hit}
        layout="default"
        type={type}
        status={
          <Label size={0} muted>
            {type.title}
          </Label>
        }
      />
    </Card>
  )
}
