import {Box} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {forwardRef, type ComponentProps, type Ref} from 'react'

import {ratioBox, ratioInnerPaddingVar, ratioPaddingBottomVar} from './RatioBox.css'

type RatioBoxProps = ComponentProps<typeof Box> & {
  ratio?: number
}

const DEFAULT_RATIO = 1.5

export const RatioBox = forwardRef(function RatioBox(
  props: RatioBoxProps,
  ref: Ref<HTMLDivElement>,
) {
  const {className, ratio = DEFAULT_RATIO, padding = 0, style, ...rest} = props

  return (
    <Box
      {...rest}
      ref={ref}
      className={[ratioBox, className].filter(Boolean).join(' ')}
      style={{
        ...assignInlineVars({
          [ratioPaddingBottomVar]: `${(1 / ratio) * 100}%`,
          [ratioInnerPaddingVar]: typeof padding === 'number' ? `${padding}px` : String(padding),
        }),
        ...style,
      }}
    />
  )
})
