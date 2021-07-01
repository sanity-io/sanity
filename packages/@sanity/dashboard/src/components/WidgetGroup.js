/* eslint-disable react/prop-types */
import React from 'react'
import styled, {css} from 'styled-components'
import {Grid} from '@sanity/ui'
import {WidgetContainer} from '../legacyParts'

const media = {
  small: (...args) =>
    css`
      @media (min-width: ${({theme}) => theme.sanity.media[0]}px) {
        ${css(...args)}
      }
    `,
  medium: (...args) =>
    css`
      @media (min-width: ${({theme}) => theme.sanity.media[2]}px) {
        ${css(...args)}
      }
    `,
}

const Root = styled(Grid)`
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));

  & > div {
    overflow: hidden;
  }

  & > div[data-width='medium'] {
    ${media.small`
      grid-column: span 2;
    `}
  }

  & > div[data-width='large'] {
    ${media.small`
      grid-column: span 2;
    `}

    ${media.medium`
      grid-column: span 3;
    `}
  }

  & > div[data-width='full'] {
    ${media.small`
      grid-column: 1 / -1;
    `}
  }

  & > div[data-height='medium'] {
    ${media.small`
      grid-row: span 2;
    `}
  }

  & > div[data-height='large'] {
    ${media.small`
      grid-row: span 2;
    `}

    ${media.medium`
      grid-row: span 3;
    `}
  }

  & > div[data-height='full'] {
    ${media.medium`
      grid-row: 1 / -1;
    `}
  }
`

function WidgetGroup(props) {
  const config = props.config || {}
  const widgets = config.widgets || []
  const layout = config.layout || {}

  return (
    <Root
      autoFlow="dense"
      data-width={layout.width || 'auto'}
      data-height={layout.height || 'auto'}
      gap={4}
    >
      {widgets.map((widgetConfig, index) => {
        if (widgetConfig.type === '__experimental_group') {
          return <WidgetGroup key={String(index)} config={widgetConfig} />
        }

        return <WidgetContainer key={String(index)} config={widgetConfig} />
      })}
    </Root>
  )
}

export default WidgetGroup
