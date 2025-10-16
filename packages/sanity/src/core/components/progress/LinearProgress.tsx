import {Card} from '@sanity/ui'

import * as styles from './LinearProgress.css'

/**
 * @hidden
 * @beta */
export function LinearProgress(props: {
  /** Percentage */
  value: number
}) {
  const {value} = props

  return (
    <Card className={styles.rootStyle} radius={5}>
      <Card
        className={styles.barStyle}
        radius={5}
        style={{transform: `translate3d(${value - 100}%, 0, 0)`}}
      />
    </Card>
  )
}
