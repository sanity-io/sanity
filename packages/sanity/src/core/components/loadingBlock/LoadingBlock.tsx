import {Card, Layer, Spinner, Text} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {useTranslation} from '../..'

// Enable to force debug background
const DEBUG_MODE = false

// Duration to wait before initial spinner appears
const SPINNER_DELAY = 750 // ms

// Duration to wait before text appears (if enabled)
const TEXT_DELAY = 2000 // ms

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

const StyledCard = styled(Card)<{$fill?: boolean}>(({$fill}) => {
  return css`
    align-items: center;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;

    ${$fill
      ? css`
          bottom: 0;
          height: 100%;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: 100%;
        `
      : css`
          min-height: 75px;
          height: stretch;
          height: -webkit-fill-available;
          width: stretch;
          width: -webkit-fill-available;
        `}

    ${DEBUG_MODE &&
    css`
      background: linear-gradient(#5555ca, #daf9f9);
      border: 2px solid black;
      > * {
        mix-blend-mode: multiply;
      }
    `}

    > * {
      position: absolute;
    }
  `
})

const StyledSpinner = styled(Spinner)<{$animatePosition: boolean}>(({$animatePosition = true}) => {
  return css`
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes slideUp {
      from {
        transform: translateY(0);
      }
      to {
        transform: translateY(-15px);
      }
    }
    animation: ${$animatePosition
      ? `500ms ease-out ${SPINNER_DELAY}ms 1 normal both running fadeIn, 750ms ease-out ${TEXT_DELAY}ms 1 normal both running slideUp`
      : `500ms ease-out ${SPINNER_DELAY}ms 1 normal both running fadeIn`};
  `
})

const StyledText = styled(Text)`
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes slideDown {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(15px);
    }
  }
  animation:
    1500ms ease-out ${TEXT_DELAY}ms 1 normal both running fadeIn,
    750ms ease-out ${TEXT_DELAY}ms 1 normal both running slideDown;
`

/**
 * A generic loading container which displays a spinner and text.
 * The spinner won't initially be visible and fades in after a short delay.
 *
 * @internal
 */
export function LoadingBlock({fill, showText, title}: LoadingTestProps) {
  return (
    <StyledCard $fill={fill} as={fill ? Layer : 'div'}>
      <StyledSpinner $animatePosition={!!showText} muted />
      {showText && <LoadingText title={title} />}
    </StyledCard>
  )
}

function LoadingText({title}: {title?: string | null}) {
  const {t} = useTranslation()

  return (
    <StyledText muted size={1}>
      {title || t('common.loading')}
    </StyledText>
  )
}
