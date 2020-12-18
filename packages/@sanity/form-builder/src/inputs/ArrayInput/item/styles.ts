import styled from 'styled-components'

import legacyTheme from 'sanity:css-custom-properties'

export const BorderShadowGridItem = styled.div`
  background: ${legacyTheme['--component-bg']};
  border-radius: ${legacyTheme['--border-radius-small']};
  padding: calc(${legacyTheme['--extra-small-padding']} - 1px);
  transition: box-shadow 100ms;

  box-shadow: 0 0 0 1px ${legacyTheme['--hairline-color']},
    0 1px 2px 0 ${legacyTheme['--shadow-color-umbra']},
    0 2px 1px -2px ${legacyTheme['--shadow-color-penumbra']},
    0 1px 3px 0 ${legacyTheme['--shadow-color-ambient']};
`

export const PreviewWrapper = styled.div`
  position: relative;

  border-radius: ${legacyTheme['--border-radius-base']};
  flex-grow: 1;
  outline: none;
  user-select: none;
  min-width: 0;
  min-height: 40px;

  &:focus {
    box-shadow: ${legacyTheme['--input-box-shadow--focus']};
  }

  @media (hover: hover) {
    &:hover {
      background-color: ${legacyTheme['--selectable-item-color-hover']};
    }

    &:active {
      background-color: ${legacyTheme['--selectable-item-color-active']};
    }
  }
`
