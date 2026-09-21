import {Layer, Spinner, Text} from '@sanity/ui'
import {clsx} from 'clsx'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {block, debug, fill, root, spinner, text} from './LoadingBlock.css'

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
export function LoadingBlock({fill: fillProp, showText, title}: LoadingTestProps) {
  // `styled(Card)` with `as` never rendered the Card itself: the class landed directly on a Layer
  // (fill) or a plain div, so neither picks up any Card styling.
  const Root = fillProp ? Layer : 'div'
  const className = clsx(root, fillProp ? fill : block, DEBUG_MODE && debug)

  return (
    <Root className={className} data-testid="loading-block">
      <Spinner className={showText ? spinner.animatePosition : spinner.static} muted />
      {showText && <LoadingText title={title} />}
    </Root>
  )
}

function LoadingText({title}: {title?: string | null}) {
  const {t} = useTranslation()

  return (
    <Text className={text} muted size={1}>
      {title || t('common.loading')}
    </Text>
  )
}
