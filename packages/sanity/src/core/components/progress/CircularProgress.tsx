import * as styles from './CircularProgress.css'

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
  const value = Math.min(Math.max(valueProp, 0), 100)
  const radius = SIZE / 2 - STROKE_WIDTH / 2
  const circ = 2 * Math.PI * radius
  const offset = ((100 - value) / 100) * circ
  const viewBox = `${SIZE / 2} ${SIZE / 2} ${SIZE} ${SIZE}`

  return (
    <svg className={styles.rootStyle} viewBox={viewBox}>
      <circle className={styles.bgCircleStyle} cx={SIZE} cy={SIZE} r={radius} />
      <circle
        className={styles.progressCircleStyle}
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
