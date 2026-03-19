import {hues} from '@sanity/color'
import {Card, type CardProps} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {forwardRef} from 'react'

import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'
import {threadCardActiveBgVar, threadCardDefaultBgVar, threadCardStyle} from './styles.css'

export const ThreadCard = forwardRef<HTMLDivElement, Omit<CardProps, 'tone'>>(
  function ThreadCard(props, ref) {
    const {className, style: styleProp, ...rest} = props
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
          ...styleProp,
          ...assignInlineVars({
            [threadCardActiveBgVar]: activeBg,
            [threadCardDefaultBgVar]: defaultBg,
          }),
        }}
      />
    )
  },
)
