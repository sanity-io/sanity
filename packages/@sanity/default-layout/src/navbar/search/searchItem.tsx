// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {forwardRef, useMemo} from 'react'
import {Card, Label, MenuItem, ResponsivePaddingProps} from '@sanity/ui'
import {IntentLink} from '@sanity/state-router/components'
import Preview from 'part:@sanity/base/preview?'
import schema from 'part:@sanity/base/schema'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {SearchHit} from '.'

interface SearchItemProps extends ResponsivePaddingProps {
  data: SearchHit
  onClick?: () => void
  variant?: 'menu-item' | 'card'
}

export function SearchItem({data, onClick, variant, ...restProps}: SearchItemProps) {
  const {hit, resultIndex} = data
  const type = schema.get(hit?._type)

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line no-shadow
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

  if (variant === 'menu-item') {
    return (
      <MenuItem data-as="a" as={LinkComponent} onClick={onClick} {...restProps}>
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
      </MenuItem>
    )
  }

  return (
    <Card data-as="a" as={LinkComponent} onClick={onClick} {...restProps}>
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
