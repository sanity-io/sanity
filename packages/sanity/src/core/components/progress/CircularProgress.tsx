import {useTheme_v2 as useThemeV2} from '@sanity/ui'

import {bgCircle, progressCircle, root, SIZE, STROKE_WIDTH} from './CircularProgress.css'

/**
 * @hidden
 * @beta */
export function CircularProgress(props: {
  /** Percentage */
  value: number
}) {
  const {value: valueProp} = props
  const {color} = useThemeV2()
  const scheme = color._dark ? 'dark' : 'light'
  const value = Math.min(Math.max(valueProp, 0), 100)
  const radius = SIZE / 2 - STROKE_WIDTH / 2
  const circ = 2 * Math.PI * radius
  const offset = ((100 - value) / 100) * circ
  const viewBox = `${SIZE / 2} ${SIZE / 2} ${SIZE} ${SIZE}`

  return (
    <svg className={root} viewBox={viewBox}>
      <circle className={bgCircle[scheme]} cx={SIZE} cy={SIZE} r={radius} />
      <circle
        className={progressCircle[scheme]}
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
