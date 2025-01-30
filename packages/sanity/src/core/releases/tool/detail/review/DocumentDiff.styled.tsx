import {Container} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

export const ChangesWrapper = styled(Container)((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    [data-ui='group-change-content'] {
      // Hide the first grouping border border
      &::before {
        display: none;
      }
      [data-ui='group-change-list'] {
        grid-gap: ${theme.space[6]}px;
      }

      [data-ui='group-change-content'] {
        // For inner groupings, show the border and reduce the gap
        &::before {
          display: block;
        }
        [data-ui='group-change-list'] {
          grid-gap: ${theme.space[4]}px;
        }
      }
    }

    [data-ui='field-diff-inspect-wrapper'] {
      // Hide the border of the field diff wrapper
      padding: 0;
      padding-top: ${theme.space[2]}px;
      &::before {
        display: none;
      }
    }
  `
})

export const FieldWrapper = styled.div`
  [data-changed] {
    cursor: default;
  }

  [data-diff-action='removed'] {
    background-color: var(--card-badge-critical-bg-color);
    color: var(--card-badge-critical-fg-color);
  }
  [data-diff-action='added'] {
    background-color: var(--card-badge-positive-bg-color);
    color: var(--card-badge-positive-fg-color);
  }

  [data-ui='diff-card'] {
    cursor: default;

    background-color: var(--card-badge-positive-bg-color);
    color: var(--card-badge-positive-fg-color);
    &:has(del) {
      background-color: var(--card-badge-critical-bg-color);
      color: var(--card-badge-critical-fg-color);
    }
    &[data-hover] {
      &::after {
        // Remove the hover effect for the cards
        display: none;
      }
    }
  }

  del[data-ui='diff-card'] {
    background-color: var(--card-badge-critical-bg-color);
    color: var(--card-badge-critical-fg-color);
  }

  ins[data-ui='diff-card'] {
    background-color: var(--card-badge-positive-bg-color);
    color: var(--card-badge-positive-fg-color);
  }

  del {
    text-decoration: none;
    &:hover {
      // Hides the border bottom added to the text differences when hovering
      background-image: none;
    }
  }
  ins {
    &:hover {
      // Hides the border bottom added to the text differences when hovering
      background-image: none;
    }
  }
`
