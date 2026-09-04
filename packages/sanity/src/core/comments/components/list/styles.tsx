import {hues} from '@sanity/color'
import {Card, type CardProps, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'

import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'
import {threadCard, threadCardActiveBgVar, threadCardDefaultBgVar} from './styles.css'

export function ThreadCard(props: CardProps) {
  const {className, style, ...rest} = props
  const {color} = useThemeV2()
  const isDark = color._dark
  const activeBg = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 900 : 50].hex
  const defaultBg = hues.gray[isDark ? 900 : 50].hex

  return (
    <Card
      {...rest}
      padding={3}
      radius={3}
      sizing="border"
      className={clsx(threadCard, className)}
      style={{
        ...assignInlineVars({
          [threadCardDefaultBgVar]: defaultBg,
          [threadCardActiveBgVar]: activeBg,
        }),
        ...style,
      }}
    />
  )
}
