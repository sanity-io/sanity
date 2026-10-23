import {css, keyframes} from '#styled-system/css'

// Card also receives `flex={1}`; both rules set the same value, and Card never sets
// `flex-direction`, so a plain class is enough.
export const rootCard = css({
  flex: 1,
  flexDirection: 'column',
})

export const headerStack = css({
  borderBottom: '1px solid var(--card-border-color)',
})

export const contentFlex = css({
  // The ui5 Flex also gets `overflow="auto"` (`.sui-overflow-auto`, (0,1,0), in the static
  // ui5 sheet); the styled() wrapper only won that tie by injection order, so add a second class.
  '&&': {
    overflowY: 'scroll',
    overflowX: 'hidden',
  },
})

const fadeIn = keyframes({
  from: {opacity: 0},
})

export const rootCardFadeIn = css({
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${fadeIn} 0.2s ease-out`,
  },
})
