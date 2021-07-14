import React, {forwardRef} from 'react'
import {Card, Box, Heading} from '@sanity/ui'
import styled from 'styled-components'

const Root = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  height: 100%;
  box-sizing: border-box;
  position: relative;
`

const Header = styled(Card)`
  position: sticky;
  top: 0;
  z-index: 2;
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
`

const Footer = styled(Card)`
  position: sticky;
  overflow: hidden;
  bottom: 0;
  z-index: 2;
  border-bottom-right-radius: inherit;
  border-bottom-left-radius: inherit;
  margin-top: auto;
`

const Content = styled(Box)`
  position: relative;
  z-index: 1;
  height: stretch;
  min-height: 21.5em;

  @media (min-width: ${({theme}) => theme.sanity.media[0]}px) {
    overflow-y: auto;
    outline: none;
  }
`

interface DashboardWidgetProps {
  header?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export const DashboardWidget = forwardRef(
  (props: DashboardWidgetProps, ref: React.Ref<HTMLDivElement>) => {
    const {header, children, footer} = props

    return (
      <Root radius={3} display="flex" ref={ref}>
        {header && (
          <Header borderBottom paddingX={3} paddingY={4}>
            <Heading size={1} textOverflow="ellipsis">
              {header}
            </Heading>
          </Header>
        )}
        {children && <Content>{children}</Content>}
        {footer && <Footer borderTop>{footer}</Footer>}
      </Root>
    )
  }
)

DashboardWidget.displayName = 'DashboardWidget'
