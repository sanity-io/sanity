import {rem, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const ResultViewWrapper = styled.div(({theme}: {theme: Theme}) => {
  const {color, fonts, space} = theme.sanity

  return css`
    & .json-inspector,
    & .json-inspector .json-inspector__selection {
      font-family: ${fonts.code.family};
      font-size: ${fonts.code.sizes[2].fontSize}px;
      line-height: ${fonts.code.sizes[2].lineHeight}px;
      color: var(--card-code-fg-color);
    }

    & .json-inspector .json-inspector__leaf {
      padding-left: ${rem(space[4])};
    }

    & .json-inspector .json-inspector__leaf.json-inspector__leaf_root {
      padding-top: ${rem(space[0])};
      padding-left: 0;
    }

    & .json-inspector > .json-inspector__leaf_root > .json-inspector__line > .json-inspector__key {
      display: none;
    }

    & .json-inspector .json-inspector__line {
      display: block;
      position: relative;
      cursor: default;
    }

    & .json-inspector .json-inspector__line::after {
      content: '';
      position: absolute;
      top: 0;
      left: -200px;
      right: -50px;
      bottom: 0;
      z-index: -1;
      pointer-events: none;
    }

    & .json-inspector .json-inspector__line:hover::after {
      background: var(--card-code-bg-color);
    }

    & .json-inspector .json-inspector__leaf_composite > .json-inspector__line {
      cursor: pointer;
    }

    & .json-inspector .json-inspector__leaf_composite > .json-inspector__line::before {
      content: '▸ ';
      margin-left: calc(0px - ${rem(space[4])});
      font-size: ${fonts.code.sizes[2].fontSize}px;
      line-height: ${fonts.code.sizes[2].lineHeight}px;
    }

    &
      .json-inspector
      .json-inspector__leaf_expanded.json-inspector__leaf_composite
      > .json-inspector__line::before {
      content: '▾ ';
      font-size: ${fonts.code.sizes[2].fontSize}px;
      line-height: ${fonts.code.sizes[2].lineHeight}px;
    }

    & .json-inspector .json-inspector__radio,
    & .json-inspector .json-inspector__flatpath {
      display: none;
    }

    & .json-inspector .json-inspector__value {
      margin-left: ${rem(space[4] / 2)};
    }

    &
      .json-inspector
      > .json-inspector__leaf_root
      > .json-inspector__line
      > .json-inspector__key
      + .json-inspector__value {
      margin: 0;
    }

    & .json-inspector .json-inspector__key {
      color: ${color.syntax.property};
    }

    & .json-inspector .json-inspector__value_helper,
    & .json-inspector .json-inspector__value_null {
      color: ${color.syntax.constant};
    }

    & .json-inspector .json-inspector__not-found {
      padding-top: ${rem(space[2])};
    }

    & .json-inspector .json-inspector__value_string {
      color: ${color.syntax.string};
      word-break: break-word;
    }

    & .json-inspector .json-inspector__value_boolean {
      color: ${color.syntax.boolean};
    }

    & .json-inspector .json-inspector__value_number {
      color: ${color.syntax.number};
    }

    & .json-inspector .json-inspector__show-original {
      display: inline-block;
      padding: 0 6px;
      cursor: pointer;
    }

    & .json-inspector .json-inspector__show-original:hover {
      color: inherit;
    }

    & .json-inspector .json-inspector__show-original::before {
      content: '↔';
    }

    & .json-inspector .json-inspector__show-original:hover::after {
      content: ' expand';
    }
  `
})
