import {Layer, Spinner} from '@sanity/ui'
import {clsx} from 'clsx'
import {Text} from 'ui5'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {
  card,
  cardDebug,
  cardFill,
  cardFlow,
  spinner,
  spinnerAnimatePosition,
  text,
} from './LoadingBlock.css'

// Enable to force debug background
const DEBUG_MODE = false

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
  // The styled-components original passed this to `styled(Card)` as `as`, which replaced the Card
  // outright: the root was never a Card, only a `div` or a `Layer`.
  const Root = fill ? Layer : 'div'

  return (
    <Root
      className={clsx(card, fill ? cardFill : cardFlow, DEBUG_MODE && cardDebug)}
      data-testid="loading-block"
    >
      <Spinner className={showText ? spinnerAnimatePosition : spinner} muted />
      {showText && <LoadingText title={title} />}
    </Root>
  )
}

function LoadingText({title}: {title?: string | null}) {
  const {t} = useTranslation()

  return (
    <Text className={text} muted size={1} as="div" trim={true}>
      {title || t('common.loading')}
    </Text>
  )
}
