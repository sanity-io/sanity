import {Box} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ComponentProps, forwardRef} from 'react'

import {heightVar, incomingReferencesListContainer} from './shared.css'

export const INCOMING_REFERENCES_ITEM_HEIGHT = 51
const INCOMING_REFERENCES_MAX_VISIBLE_ITEMS = 10

export const IncomingReferencesListContainer = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof Box> & {$itemCount: number}
>(function IncomingReferencesListContainer({$itemCount, style: styleProp, ...props}, ref) {
  return (
    <Box
      {...props}
      className={incomingReferencesListContainer}
      style={{
        ...styleProp,
        ...assignInlineVars({
          [heightVar]: `${Math.min($itemCount, INCOMING_REFERENCES_MAX_VISIBLE_ITEMS) * INCOMING_REFERENCES_ITEM_HEIGHT}px`,
        }),
      }}
      ref={ref}
    />
  )
})
