import {Box, Card, MenuDivider} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

export const EditableWrap = styled(Box)`
  max-height: 20vh;
  overflow-y: auto;
`

export const ButtonDivider = styled(MenuDivider)({
  height: 20,
  width: 1,
})

function focusRingBorderStyle(border: {color: string; width: number}): string {
  return `inset 0 0 0 ${border.width}px ${border.color}`
}

export const RootCard = styled(Card)(({theme}) => {
  const {color, input, radius} = getTheme_v2(theme)
  const radii = radius[2]

  return css`
    border-radius: ${radii}px;
    box-shadow: var(--input-box-shadow);

    --input-box-shadow: ${focusRingBorderStyle({
      color: color.input.default.enabled.border,
      width: input.border.width,
    })};

    &:not([data-expand-on-focus='false'], :focus-within) {
      background: transparent;
      box-shadow: unset;
    }

    &[data-focused='true']:focus-within {
      ${EditableWrap} {
        min-height: 1em;
      }

      /* box-shadow: inset 0 0 0 1px var(--card-focus-ring-color); */
      --input-box-shadow: ${focusRingBorderStyle({
        color: 'var(--card-focus-ring-color)',
        width: input.border.width,
      })};
    }

    &:focus-within {
      ${EditableWrap} {
        min-height: 1em;
      }
    }

    &[data-expand-on-focus='false'] {
      ${EditableWrap} {
        min-height: 1em;
      }
    }

    &[data-expand-on-focus='true'] {
      [data-ui='CommentInputActions']:not([hidden]) {
        display: none;
      }

      &:focus-within {
        [data-ui='CommentInputActions'] {
          display: flex;
        }
      }
    }
    &:hover {
      --input-box-shadow: ${focusRingBorderStyle({
        color: color.input.default.hovered.border,
        width: input.border.width,
      })};
    }
  `
})

export const AvatarContainer = styled.div((props) => {
  const theme = getTheme_v2(props.theme)
  return `
    min-height: ${theme.avatar.sizes[1]?.size}px;
    display: flex;
    align-items: center;
  `
})
