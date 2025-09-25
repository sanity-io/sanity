import {css, styled} from 'styled-components'

import {Button, MenuItem} from '../../../../../../ui-components'

export const FileButton = styled(Button).attrs({forwardedAs: 'label'})(() => {
  return css`
    &:not([data-disabled='true']) {
      &:focus-within {
        /* TODO */
      }
    }

    // The underlying file input is rendered as children within a Sanity UI <Button> component.
    // The below visibly hides it by targeting the input's parent <span> element, which is
    // added by the <Button> component.
    // TODO: refactor, avoid nth-child selector usage
    & > span:nth-child(2) {
      overflow: hidden;
      overflow: clip;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      min-width: 0;
      display: block;
      appearance: none;
      padding: 0;
      margin: 0;
      border: 0;
      opacity: 0;
    }
  `
})

export const FileMenuItem = styled(MenuItem).attrs({forwardedAs: 'label'})(() => {
  return css`
    &:not([data-disabled='true']) {
      &:focus-within {
        /* TODO */
      }
    }

    // The underlying file input is rendered as children within a Sanity UI <Button> component.
    // The below visibly hides it by targeting the input's parent <span> element, which is
    // added by the <Button> component.
    // TODO: refactor, avoid nth-child selector usage
    & > span:nth-child(2) {
      overflow: hidden;
      overflow: clip;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      min-width: 0;
      display: block;
      appearance: none;
      padding: 0;
      margin: 0;
      border: 0;
      opacity: 0;
    }
  `
})
