import {Box, Flex} from '@sanity/ui'
import styled, {css, keyframes} from 'styled-components'
import type {ProgressCircleProps} from './progressCircle'

type StatusProps = Pick<ProgressCircleProps, 'isComplete'> & {
  isHundredPercent?: boolean
}

const STROKE_WIDTH = '1px'
const PI = 3.14159265359
const CIRCUMFERENCE = PI * 100

const finish = keyframes`
    0% {
      stroke-width: 1em;
    }

    10% {
      stroke-width: 0.5em;
    }

    90% {
      transform: scale(0.9);
    }

    100% {
      transform: scale(2);
      opacity: 0;
      stroke-width: 1px;
    }
`

const rotate = keyframes`
    to {
        transform: rotate(360deg);
    }
`

const strokeWidth = keyframes`
     0% {
      stroke-width: 0;
    }

    50% {
      stroke-width: ${STROKE_WIDTH};
    }

    100% {
      stroke-width: 0;
    }
`

const strokeDash = keyframes`
    0% {
      stroke-dasharray: 0, ${CIRCUMFERENCE};
      stroke-dashoffset: 0;
    }

    50% {
      stroke-dasharray: ${CIRCUMFERENCE}, 0;
      stroke-dashoffset: 0;
    }

    100% {
      stroke-dasharray: ${CIRCUMFERENCE}, ${CIRCUMFERENCE};
      stroke-dashoffset: calc(${CIRCUMFERENCE} * -1);
    }
`

export const BackgroundCircle = styled.circle`
  stroke: var(--card-fg-color);
  stroke-width: 0.5em;
  opacity: 0.05;
  fill: none;
  transition: opacity 0.2s linear;

  ${({isComplete}: StatusProps) =>
    isComplete &&
    css`
      opacity: 0;
    `}
`

export const ForegroundCircle = styled.circle`
  transform-origin: center center;
  stroke: var(--card-fg-color);
  fill: none;
  stroke-width: 0.5em;
  transition: stroke 0.2s linear, opacity 0.3s linear;

  ${({isComplete}: StatusProps) =>
    isComplete &&
    css`
      stroke: var(--state-success-color);
      animation-name: ${finish};
      animation-delay: 0.2s;
      animation-duration: 1s;
      animation-iteration-count: 1;
      animation-fill-mode: forwards;
    `}

  ${({isHundredPercent}: StatusProps) =>
    isHundredPercent &&
    css`
      stroke: var(--state-success-color);
    `}
`

export const ActiveCircle = styled.circle`
  transform-origin: center center;
  stroke: var(--card-fg-color);
  fill: none;
  stroke-width: ${STROKE_WIDTH};
  stroke-dasharray: 0, ${CIRCUMFERENCE};
  animation: ${strokeDash} 6s ease-out infinite, ${strokeWidth} 3s ease-out infinite,
    ${rotate} 18s linear infinite;

  ${({isComplete}: StatusProps) =>
    isComplete &&
    css`
      opacity: 0;
    `}
`

export const Root = styled(Box)`
  width: 100%;
  --pi: 3.14159265359;
  --circumference: calc(var(--pi) * 100);
  --stroke-width: 1px;

  svg {
    display: block;
    margin: 0 auto;
  }
`

const SvgText = styled.text`
  font-weight: 400;
  font-size: 1em;
  fill: inherit;
  transform-origin: center center;

  ${({isComplete}: StatusProps) =>
    isComplete &&
    css`
      animation-name: ${finish};
      animation-delay: 0.2s;
      animation-duration: 1s;
      animation-iteration-count: 1;
      animation-fill-mode: forwards;
    `}
`

export const PercentText = styled(SvgText)``

export const StatusText = styled(SvgText)`
  fill: inherit;
  font-size: 0.7em;
`
