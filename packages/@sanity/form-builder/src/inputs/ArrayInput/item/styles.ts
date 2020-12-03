import styled from 'styled-components'

import legacyTheme from 'sanity:css-custom-properties'

const DragHandleSpan = styled.span`
  display: block;
  flex-grow: 0;
  margin: 0 ${legacyTheme['--extra-small-padding']};

  & > button {
    cursor: ns-resize;
  }
`

const BorderShadowGridItem = styled.div`
  background: ${legacyTheme['--component-bg']};
  border-radius: ${legacyTheme['--border-radius-small']};
  padding: calc(${legacyTheme['--extra-small-padding']} - 1px);
  transition: box-shadow 100ms;

  box-shadow: 0 0 0 1px ${legacyTheme['--hairline-color']},
    0 1px 2px 0 ${legacyTheme['--shadow-color-umbra']},
    0 2px 1px -2px ${legacyTheme['--shadow-color-penumbra']},
    0 1px 3px 0 ${legacyTheme['--shadow-color-ambient']};

  .ArrayInput__moving & {
    box-shadow: 0 0 0 1px ${legacyTheme['--hairline-color']},
      0 8px 17px 2px ${legacyTheme['--shadow-color-umbra']},
      0 3px 14px 2px ${legacyTheme['--shadow-color-penumbra']},
      0 5px 5px -3px ${legacyTheme['--shadow-color-ambient']};
  }
`

const PreviewWrapper = styled.div`
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

export {DragHandleSpan, BorderShadowGridItem, PreviewWrapper}
