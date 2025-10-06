import {Card, Layer, Spinner, Text} from '@sanity/ui'

import {useTranslation} from '../..'
import * as styles from './LoadingBlock.css'

interface LoadingTestProps {
  /** Absolutely positions this component when `true`. */
  fill?: boolean
  /** Optionally show loading title. If `true`, both text and spinner will appear and animate after an initial delay */
  showText?: boolean
  /**
   * Text to display underneath the spinner.  If omitted, will default to `'Loading'`.
   * If providing a value, avoid using trailing ellipses.
   *
   * @defaultValue `'Loading'`
   */
  title?: string | null
}

/**
 * A generic loading container which displays a spinner and text.
 * The spinner won't initially be visible and fades in after a short delay.
 *
 * @internal
 */
export function LoadingBlock({fill, showText, title}: LoadingTestProps) {
  const cardStyle = fill ? styles.cardStyles.fill : styles.cardStyles.default
  const spinnerStyle = showText ? styles.spinnerStyles.withPosition : styles.spinnerStyles.default

  return (
    <Card className={cardStyle} as={fill ? Layer : 'div'} data-testid="loading-block">
      <Spinner className={spinnerStyle} muted />
      {showText && <LoadingText title={title} />}
    </Card>
  )
}

function LoadingText({title}: {title?: string | null}) {
  const {t} = useTranslation()

  return (
    <Text className={styles.textStyle} muted size={1}>
      {title || t('common.loading')}
    </Text>
  )
}
