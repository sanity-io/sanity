import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentPropsWithRef} from 'react'
import {Box, type BoxProps} from 'ui5'

import {ratioBox, ratioBoxChildInsetVar, ratioBoxPaddingBottomVar} from './RatioBox.css'

type RatioBoxProps = BoxProps &
  Omit<ComponentPropsWithRef<'div'>, keyof BoxProps> & {
    ratio?: number
  }

const DEFAULT_RATIO = 3 / 2

export function RatioBox(props: RatioBoxProps) {
  const {ratio = DEFAULT_RATIO, className, style, ...rest} = props
  const {padding = 0} = rest
  // The child inset mirrors the (numeric) `padding` prop as pixels, like the styled template did
  const childInset = typeof padding === 'number' ? `${padding}px` : undefined

  return (
    <Box
      {...rest}
      className={clsx(ratioBox, className)}
      style={{
        ...assignInlineVars({
          [ratioBoxPaddingBottomVar]: `calc(${1 / ratio} * 100%)`,
          [ratioBoxChildInsetVar]: childInset,
        }),
        ...style,
      }}
    />
  )
}
