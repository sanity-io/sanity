import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

export const ResultViewWrapper = styled.div`
  & .json-inspector,
  & .json-inspector .json-inspector__selection {
    font-family: ${vars.font.code.family};
    font-size: ${vars.font.code.scale[1].fontSize};
    line-height: ${vars.font.code.scale[1].lineHeight};
    color: ${vars.color.code.fg};
  }

  & .json-inspector .json-inspector__leaf {
    padding-left: ${vars.space[4]};
  }

  & .json-inspector .json-inspector__leaf.json-inspector__leaf_root {
    padding-top: ${vars.space[0]};
    padding-left: ${vars.space[0]};
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
    background: ${vars.color.code.bg};
  }

  & .json-inspector .json-inspector__leaf_composite > .json-inspector__line {
    cursor: pointer;
  }

  & .json-inspector .json-inspector__leaf_composite > .json-inspector__line::before {
    content: '▸ ';
    margin-left: calc(0px - ${vars.space[4]});
    font-size: ${vars.font.code.scale[2].fontSize};
    line-height: ${vars.font.code.scale[2].lineHeight};
  }

  &
    .json-inspector
    .json-inspector__leaf_expanded.json-inspector__leaf_composite
    > .json-inspector__line::before {
    content: '▾ ';
    font-size: ${vars.font.code.scale[2].fontSize};
    line-height: ${vars.font.code.scale[2].lineHeight};
  }

  & .json-inspector .json-inspector__radio,
  & .json-inspector .json-inspector__flatpath {
    display: none;
  }

  & .json-inspector .json-inspector__value {
    margin-left: calc(${vars.space[4]} / 2);
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
    color: ${vars.color.code.token.property};
  }

  & .json-inspector .json-inspector__value_helper,
  & .json-inspector .json-inspector__value_null {
    color: ${vars.color.code.token.constant};
  }

  & .json-inspector .json-inspector__not-found {
    padding-top: ${vars.space[2]};
  }

  & .json-inspector .json-inspector__value_string {
    color: ${vars.color.code.token.string};
    word-break: break-word;
  }

  & .json-inspector .json-inspector__value_boolean {
    color: ${vars.color.code.token.boolean};
  }

  & .json-inspector .json-inspector__value_number {
    color: ${vars.color.code.token.number};
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
