import {hues} from '@sanity/color'
import {Card, type CardProps, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type MouseEvent, type ReactNode, forwardRef} from 'react'

import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'
import {threadCardActiveBgVar, threadCardDefaultBgVar, threadCardStyle} from './styles.css'

interface ThreadCardProps extends Omit<CardProps, 'tone'> {
  children: ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  onMouseEnter?: (e: MouseEvent<HTMLDivElement>) => void
  onMouseLeave?: (e: MouseEvent<HTMLDivElement>) => void
}

export const ThreadCard = forwardRef<HTMLDivElement, ThreadCardProps>(
  function ThreadCard(props, ref) {
    const {className, ...rest} = props
    const theme = useThemeV2()
    const isDark = theme.color._dark
    const activeBg = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 900 : 50].hex
    const defaultBg = hues.gray[isDark ? 900 : 50].hex

    return (
      <Card
        {...rest}
        className={[threadCardStyle, className].filter(Boolean).join(' ')}
        padding={3}
        radius={3}
        sizing="border"
        ref={ref}
        style={{
          ...assignInlineVars({
            [threadCardActiveBgVar]: activeBg,
            [threadCardDefaultBgVar]: defaultBg,
          }),
        }}
      />
    )
  },
)
