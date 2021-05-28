import {hues} from '@sanity/color'
import {Box, Code, rem, Theme} from '@sanity/ui'
import React from 'react'
import ReactJsonView from 'react-json-view'
import styled, {css} from 'styled-components'
import {JSONTree} from './JSONTree'

// import './react-json-view.css'

export interface ResultViewProps {
  data?: any
}

const Root = styled(Box)((props: {theme: Theme}) => {
  const theme = props.theme.sanity
  const {space} = theme
  const {dark} = theme.color

  return css`
    & > .react-json-view {
      padding-left: 31px;
      font-family: ${theme.fonts.code.family} !important;
      background-color: transparent !important;

      & .icon-container {
        background-color: var(--card-bg-color);
        width: 21px !important;
        position: absolute;
        margin-left: -31px;

        & > span > svg {
          width: 21px !important;
          height: 21px !important;
          vertical-align: top !important;
        }
      }

      & .variable-value > div {
        color: inherit !important;
      }

      & .object-key-val > span > span > span:nth-child(3) {
        font-weight: inherit !important;
      }

      & .object-meta-data {
        padding-left: ${rem(space[2])} !important;

        & > .object-size {
          margin: 0 !important;
          font-style: normal !important;
          color: var(--card-muted-fg-color) !important;
          opacity: 0.5;
        }
      }

      & .string-value {
        color: ${hues.green[dark ? 400 : 700].hex};
      }
    }
  `
})

function isJsonObject(data: unknown): data is Record<string, unknown> {
  return Boolean(data) && typeof data === 'object'
}

export function ResultView(props: ResultViewProps) {
  const {data} = props

  if (isJsonObject(data)) {
    return (
      <Root padding={4}>
        <JSONTree value={data} />

        <Box hidden>
          <ReactJsonView
            collapsed={3}
            displayDataTypes={false}
            enableClipboard={false}
            groupArraysAfterLength={50}
            iconStyle="square"
            name="result"
            src={data}
          />
        </Box>
      </Root>
    )
  }

  return (
    <Root padding={4}>
      <Code language="json">{JSON.stringify(data)}</Code>
    </Root>
  )
}
