import {Card, useTheme_v2 as useThemeV2} from '@sanity/ui'

import {bar, root} from './LinearProgress.css'

/**
 * @hidden
 * @beta */
export function LinearProgress(props: {
  /** Percentage */
  value: number
}) {
  const {value} = props
  const {color} = useThemeV2()
  const scheme = color._dark ? 'dark' : 'light'

  return (
    <Card className={root} radius={5}>
      <Card
        className={bar[scheme]}
        radius={5}
        style={{transform: `translate3d(${value - 100}%, 0, 0)`}}
      />
    </Card>
  )
}
