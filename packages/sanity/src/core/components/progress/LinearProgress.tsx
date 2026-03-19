import {hues} from '@sanity/color'
import {Card} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {barColorVar, barStyle, rootStyle} from './LinearProgress.css'

/**
 * @hidden
 * @beta */
export function LinearProgress(props: {
  /** Percentage */
  value: number
}) {
  const {value} = props
  const {color} = useThemeV2()

  return (
    <Card className={rootStyle} radius={5}>
      <Card
        className={barStyle}
        radius={5}
        style={{
          ...assignInlineVars({[barColorVar]: hues.blue[color.dark ? 400 : 500].hex}),
          transform: `translate3d(${value - 100}%, 0, 0)`,
        }}
      />
    </Card>
  )
}
