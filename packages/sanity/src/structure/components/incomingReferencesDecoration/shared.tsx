import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'
import {Box} from 'ui5'

import {heightVar, incomingReferencesListContainer} from './shared.css'

export const INCOMING_REFERENCES_ITEM_HEIGHT = 51
const INCOMING_REFERENCES_MAX_VISIBLE_ITEMS = 10

export function IncomingReferencesListContainer(
  props: ComponentProps<typeof Box> & {$itemCount: number},
) {
  const {$itemCount, className, style, ...rest} = props
  const height =
    Math.min($itemCount, INCOMING_REFERENCES_MAX_VISIBLE_ITEMS) * INCOMING_REFERENCES_ITEM_HEIGHT

  return (
    <Box
      {...rest}
      className={clsx(incomingReferencesListContainer, className)}
      style={{...assignInlineVars({[heightVar]: `${height}px`}), ...style}}
    />
  )
}
