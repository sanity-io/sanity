/* eslint-disable no-restricted-imports */
import {Card, Layer, Spinner, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import React from 'react'
import styled, {css} from 'styled-components'

// Enable to force debug background
const DEBUG_MODE = false

interface LoadingTestProps {
  /** Absolutely positions this component when `true`. */
  fill?: boolean
  /** Optionally hide loading title. If `true`, the spinner will remain centered. */
  hideText?: boolean
  /**
   * Text to display underneath the spinner.  If omitted, will default to `'Loading'`.
   * If providing a value, avoid using trailing ellipses.
   *
   * @defaultValue `'Loading'`
   */
  title?: string | null
}

const MotionSpinner = motion(Spinner)
const MotionText = motion(Text)

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

/**
 * A generic loading container which displays a spinner and text.
 * The spinner won't initially be visible and fades in after a short delay.
 */
// @todo: ensure this works in dark mode
export function LoadingBlock({fill, hideText, title = 'Loading'}: LoadingTestProps) {
  return (
    <StyledCard $fill={fill} as={fill ? Layer : 'div'}>
      <MotionSpinner
        animate={{
          opacity: 1,
          ...(hideText ? {} : {y: -15}),
        }}
        initial={{opacity: 0}}
        muted
        transition={{
          opacity: {delay: 0.5},
          ...(hideText ? {} : {y: {delay: 2, duration: 0.6, ease: 'easeOut'}}),
        }}
      />
      <MotionText
        animate={{opacity: 1, y: 15}}
        initial={{opacity: 0}}
        muted
        size={1}
        transition={{delay: 2, duration: 0.6, ease: 'easeOut'}}
      >
        {title}
      </MotionText>
    </StyledCard>
  )
}
