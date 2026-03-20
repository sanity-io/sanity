import {hues} from '@sanity/color'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {
  bgCircle,
  bgStrokeVar,
  progressCircle,
  progressStrokeVar,
  root,
} from './CircularProgress.css'

const SIZE = 43
const STROKE_WIDTH = 3

/**
 * @hidden
 * @beta */
export function CircularProgress(props: {
  /** Percentage */
  value: number
}) {
  const {value: valueProp} = props
  const {color} = useThemeV2()
  const value = Math.min(Math.max(valueProp, 0), 100)
  const radius = SIZE / 2 - STROKE_WIDTH / 2
  const circ = 2 * Math.PI * radius
  const offset = ((100 - value) / 100) * circ
  const viewBox = `${SIZE / 2} ${SIZE / 2} ${SIZE} ${SIZE}`

  return (
    <svg
      className={root}
      viewBox={viewBox}
      style={assignInlineVars({
        [bgStrokeVar]: hues.gray[color.dark ? 900 : 100].hex,
        [progressStrokeVar]: hues.blue[color.dark ? 400 : 500].hex,
      })}
    >
      <circle className={bgCircle} cx={SIZE} cy={SIZE} r={radius} />
      <circle
        className={progressCircle}
        cx={SIZE}
        cy={SIZE}
        r={radius}
        style={{
          strokeDasharray: circ,
          strokeDashoffset: `${offset}px`,
        }}
      />
    </svg>
  )
}
