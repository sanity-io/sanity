import {Box} from '@sanity/ui'
import {css, styled} from 'styled-components'

const INDICATOR_LEFT_OFFSET = 18
const INDICATOR_WIDTH = 5
const INDICATOR_COLOR_VAR_NAME = '--card-border-color'
const INDICATOR_BOTTOM_OFFSET = 4

export const GlobalPerspectiveMenuItemIndicator = styled.div<{
  $inRange: boolean
  $last: boolean
  $first: boolean
  $isDraft: boolean
}>(
  ({$inRange, $last, $first, $isDraft}) => css`
    position: relative;

    --indicator-left: ${INDICATOR_LEFT_OFFSET}px;
    --indicator-width: ${INDICATOR_WIDTH}px;
    --indicator-color: var(${INDICATOR_COLOR_VAR_NAME});
    --indicator-bottom: ${INDICATOR_BOTTOM_OFFSET}px;

    --indicator-in-range-height: 16.5px;

    ${$inRange &&
    !$last &&
    css`
      &:after {
        content: '';
        display: block;
        position: absolute;
        left: var(--indicator-left);
        bottom: -var(--indicator-bottom);
        width: var(--indicator-width);
        height: ${$isDraft ? 'calc(var(--indicator-bottom) + 12px)' : 'var(--indicator-bottom)'};
        background-color: var(--card-border-color);
      }
    `}

    ${$inRange &&
    css`
      > [data-ui='MenuItem'] {
        position: relative;

        &:before,
        &:after {
          content: '';
          display: block;
          position: absolute;
          left: var(--indicator-left);
          width: var(--indicator-width);
          background-color: var(--card-border-color);
        }

        &:before {
          top: 0;
          height: var(--indicator-in-range-height);
        }

        &:after {
          top: var(--indicator-in-range-height);
          bottom: 0;
        }
      }
    `}

    ${$first &&
    css`
      > [data-ui='MenuItem']:after {
        margin-top: -3px;
        border-top-left-radius: ${INDICATOR_WIDTH}px;
        border-top-right-radius: ${INDICATOR_WIDTH}px;
      }
      > [data-ui='MenuItem']:before {
        display: none;
      }
    `}

    ${$last &&
    css`
      > [data-ui='MenuItem']:before {
        // dot diameter (5px) - 1.6px stroke divided by 2
        padding-bottom: 1.7px;
        border-bottom-left-radius: ${INDICATOR_WIDTH}px;
        border-bottom-right-radius: ${INDICATOR_WIDTH}px;
      }
      > [data-ui='MenuItem']:after {
        display: none;
      }
    `}
  `,
)

export const GlobalPerspectiveMenuLabelIndicator = styled(Box)<{$withinRange: boolean}>(
  ({$withinRange}) => css`
    position: relative;
    // 4px padding + 33px release indicator width + 4px gap
    padding-left: 41px;

    ${$withinRange &&
    css`
      &:before {
        content: '';
        display: block;
        position: absolute;
        left: ${INDICATOR_LEFT_OFFSET}px;
        top: 0;
        bottom: -${INDICATOR_BOTTOM_OFFSET}px;
        width: ${INDICATOR_WIDTH}px;
        background-color: var(${INDICATOR_COLOR_VAR_NAME});
      }
    `}
  `,
)
