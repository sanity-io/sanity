import {Button, ButtonTone, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'

const dot = css`
  &:after {
    content: '';
    width: 6px;
    height: 6px;
    background-color: var(--status-button-dot-bg);
    position: absolute;
    top: 0;
    right: 0;
    border-radius: 50%;
    transform: translate(-7px, 7px);
    border: 1px solid var(--card-bg-color);
  }
`

export const StatusButton = styled(Button)(
  ({theme, active, statusTone}: {theme: Theme; active: boolean; statusTone: ButtonTone}) => {
    const {color} = theme.sanity

    const tone = color.selectable && color.selectable[statusTone].selected.bg
    const showDot = active && tone

    return css`
      position: relative;
      --status-button-dot-bg: ${tone};

      ${showDot && dot}
    `
  }
)
